import { Server } from '@/lib/types';
import { SSHManager, SSHExecutionResult } from './ssh';
import { getDatabase } from '@/lib/db/db';

interface MinecraftProcessInfo {
  running: boolean;
  pid?: number;
  uptime?: number;
}

export class MinecraftController {
  private ssh: SSHManager;
  private serverDir: string;
  private javaCommand: string = 'java';

  constructor(ssh: SSHManager, serverDir: string) {
    this.ssh = ssh;
    this.serverDir = serverDir;
  }

  /**
   * Check if Minecraft server process is actually running
   */
  async isServerRunning(server: Server): Promise<MinecraftProcessInfo> {
    try {
      const pidFile = `${this.serverDir}/minecraft-${server.id}.pid`;
      const result = await this.ssh.executeInteractive(`if [ -f "${pidFile}" ]; then cat "${pidFile}"; else echo ""; fi`, 5000);
      
      const pid = parseInt(result.trim());
      
      if (!pid) {
        return { running: false };
      }

      // Check if process exists
      const checkResult = await this.ssh.executeInteractive(`ps -p ${pid} > /dev/null 2>&1 && echo "running" || echo "not_running"`, 5000);
      
      const isRunning = checkResult.trim() === 'running';
      
      if (isRunning) {
        // Get uptime
        const uptimeResult = await this.ssh.executeInteractive(
          `ps -o etime= -p ${pid} 2>/dev/null | tr -d ' '`,
          5000
        );
        
        return {
          running: true,
          pid,
          uptime: this.parseUptime(uptimeResult.trim()),
        };
      } else {
        // Clean up stale PID file
        await this.ssh.executeInteractive(`rm -f "${pidFile}"`, 5000);
        return { running: false };
      }
    } catch (error) {
      console.error(`[Minecraft] Process check failed for ${server.id}:`, error);
      return { running: false };
    }
  }

  /**
   * Start Minecraft server
   */
  async startServer(server: Server): Promise<{ success: boolean; error?: string; pid?: number }> {
    try {
      const processInfo = await this.isServerRunning(server);
      if (processInfo.running) {
        return { success: false, error: 'Server is already running' };
      }

      const serverPath = `${this.serverDir}/${server.id}`;
      const pidFile = `${this.serverDir}/minecraft-${server.id}.pid`;
      const logFile = `${serverPath}/logs/latest.log`;

      // Validate server directory exists
      const checkDirResult = await this.ssh.executeInteractive(`test -d "${serverPath}" && echo "exists" || echo "not_exists"`, 5000);
      
      if (checkDirResult.trim() !== 'exists') {
        return { success: false, error: `Server directory not found: ${serverPath}` };
      }

      // Start server in background with nohup
      const startCmd = `
        cd "${serverPath}" && 
        nohup ${this.javaCommand} \
          -Xmx${server.ram_gb}G \
          -Xms${server.ram_gb / 2}G \
          -XX:+UseG1GC \
          -XX:MaxGCPauseMillis=200 \
          -jar server.jar nogui \
          >> "${logFile}" 2>&1 & 
        echo $! > "${pidFile}" && 
        echo $!
      `;

      const result = await this.ssh.executeInteractive(startCmd, 10000);
      const pid = parseInt(result.trim());

      if (!pid || pid === 0) {
        return { success: false, error: 'Failed to start server - invalid PID' };
      }

      console.log(`[Minecraft] Server ${server.id} started with PID ${pid}`);
      
      // Wait a bit and verify it's running
      await new Promise(resolve => setTimeout(resolve, 2000));
      const verifyInfo = await this.isServerRunning(server);
      
      if (!verifyInfo.running) {
        return { success: false, error: 'Server started but process died immediately - check logs' };
      }

      return { success: true, pid };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error(`[Minecraft] Failed to start server ${server.id}:`, errorMsg);
      return { success: false, error: errorMsg };
    }
  }

  /**
   * Stop Minecraft server gracefully
   */
  async stopServer(server: Server, timeout: number = 60000): Promise<{ success: boolean; error?: string }> {
    try {
      const processInfo = await this.isServerRunning(server);
      if (!processInfo.running) {
        return { success: false, error: 'Server is not running' };
      }

      const pid = processInfo.pid!;
      const pidFile = `${this.serverDir}/minecraft-${server.id}.pid`;

      // Send stop command via rcon or kill signal
      try {
        // Try graceful SIGTERM first
        await this.ssh.executeInteractive(`kill -TERM ${pid}`, 5000);
        console.log(`[Minecraft] Sent SIGTERM to server ${server.id} (PID ${pid})`);
        
        // Wait for graceful shutdown
        let attempts = 0;
        const maxAttempts = timeout / 1000;
        
        while (attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 1000));
          const stillRunning = await this.isServerRunning(server);
          
          if (!stillRunning.running) {
            console.log(`[Minecraft] Server ${server.id} stopped gracefully`);
            break;
          }
          
          attempts++;
        }

        // If still running after timeout, force kill
        const finalCheck = await this.isServerRunning(server);
        if (finalCheck.running) {
          console.warn(`[Minecraft] Force killing server ${server.id} (PID ${pid})`);
          await this.ssh.executeInteractive(`kill -9 ${pid}`, 5000);
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      } catch (err) {
        console.error(`[Minecraft] Error stopping server:`, err);
      }

      // Clean up PID file
      await this.ssh.executeInteractive(`rm -f "${pidFile}"`, 5000);
      
      return { success: true };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error(`[Minecraft] Failed to stop server ${server.id}:`, errorMsg);
      return { success: false, error: errorMsg };
    }
  }

  /**
   * Restart Minecraft server
   */
  async restartServer(server: Server): Promise<{ success: boolean; error?: string }> {
    try {
      // Stop server
      const stopResult = await this.stopServer(server);
      if (!stopResult.success) {
        return stopResult;
      }

      // Wait before restart
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Start server
      const startResult = await this.startServer(server);
      return startResult;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error(`[Minecraft] Failed to restart server ${server.id}:`, errorMsg);
      return { success: false, error: errorMsg };
    }
  }

  /**
   * Send command to running Minecraft server console
   */
  async sendCommand(server: Server, command: string): Promise<{ success: boolean; error?: string }> {
    try {
      if (!command || command.length === 0) {
        return { success: false, error: 'Command cannot be empty' };
      }

      // Validate command against allowlist
      const allowedCommands = ['say', 'list', 'save-all', 'difficulty', 'gamemode', 'give', 'kill', 'kick', 'ban', 'op', 'deop', 'whitelist', 'stop'];
      const firstWord = command.split(/\s+/)[0].toLowerCase();
      
      if (!allowedCommands.some(cmd => firstWord.startsWith(cmd))) {
        return { success: false, error: 'Command not allowed' };
      }

      const processInfo = await this.isServerRunning(server);
      if (!processInfo.running) {
        return { success: false, error: 'Server is not running' };
      }

      // Use screen or tmux to send commands
      const screenName = `minecraft-${server.id}`;
      
      // Send command via screen
      const sendResult = await this.ssh.executeInteractive(
        `screen -S ${screenName} -X stuff "${command}$(printf '\\r')"`,
        5000
      );

      console.log(`[Minecraft] Command sent to server ${server.id}: ${command}`);
      return { success: true };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error(`[Minecraft] Failed to send command to server ${server.id}:`, errorMsg);
      return { success: false, error: errorMsg };
    }
  }

  /**
   * Get recent console logs
   */
  async getConsoleLogs(server: Server, lines: number = 100): Promise<string[]> {
    try {
      const serverPath = `${this.serverDir}/${server.id}`;
      const logFile = `${serverPath}/logs/latest.log`;

      const result = await this.ssh.executeInteractive(
        `test -f "${logFile}" && tail -n ${lines} "${logFile}" || echo "Log file not found"`,
        5000
      );

      return result.split('\n').filter(line => line.trim().length > 0);
    } catch (error) {
      console.error(`[Minecraft] Failed to read logs from server ${server.id}:`, error);
      return [];
    }
  }

  /**
   * Parse uptime string from ps output
   */
  private parseUptime(uptimeStr: string): number {
    if (!uptimeStr) return 0;
    
    // Format: HH:MM:SS or MM:SS
    const parts = uptimeStr.split(':').map(p => parseInt(p));
    let seconds = 0;
    
    if (parts.length === 3) {
      seconds = parts[0] * 3600 + parts[1] * 60 + parts[2];
    } else if (parts.length === 2) {
      seconds = parts[0] * 60 + parts[1];
    } else {
      seconds = parts[0];
    }
    
    return seconds;
  }
}

export async function createMinecraftController(ssh: SSHManager): Promise<MinecraftController> {
  const serverDir = process.env.VPS_ROOT_PATH || '/opt/minecraft';
  return new MinecraftController(ssh, serverDir);
}
