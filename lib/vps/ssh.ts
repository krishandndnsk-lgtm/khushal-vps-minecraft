import { Client as SSHClient, ClientChannel } from 'ssh2';
import * as fs from 'fs';
import * as path from 'path';

interface SSHConfig {
  host: string;
  port: number;
  username: string;
  privateKeyPath?: string;
  password?: string;
}

export interface SSHExecutionResult {
  stdout: string;
  stderr: string;
  exitCode: number;
}

export class SSHManager {
  private config: SSHConfig;
  private client: SSHClient | null = null;
  private connectionTimeout = 30000;

  constructor(config: SSHConfig) {
    this.config = config;
  }

  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        if (!this.config.host) {
          reject(new Error('VPS_HOST not configured'));
          return;
        }

        this.client = new SSHClient();
        const connectionConfig: any = {
          host: this.config.host,
          port: this.config.port,
          username: this.config.username,
          readyTimeout: this.connectionTimeout,
          algorithms: {
            serverHostKey: ['ssh-rsa', 'ssh-dss', 'ecdsa-sha2-nistp256', 'ecdsa-sha2-nistp384', 'ecdsa-sha2-nistp521', 'ssh-ed25519'],
          },
        };

        // Use private key if provided
        if (this.config.privateKeyPath) {
          try {
            const keyPath = this.config.privateKeyPath.startsWith('/')
              ? this.config.privateKeyPath
              : path.resolve(process.cwd(), this.config.privateKeyPath);
            
            if (!fs.existsSync(keyPath)) {
              reject(new Error(`Private key not found at ${keyPath}`));
              return;
            }
            
            connectionConfig.privateKey = fs.readFileSync(keyPath);
          } catch (err) {
            reject(new Error(`Failed to read private key: ${err instanceof Error ? err.message : String(err)}`));
            return;
          }
        } else if (this.config.password) {
          // Use password authentication as fallback
          connectionConfig.password = this.config.password;
        } else {
          reject(new Error('VPS_PRIVATE_KEY_PATH or VPS_PASSWORD required'));
          return;
        }

        this.client.on('ready', () => {
          console.log(`[SSH] Connected to ${this.config.host}:${this.config.port}`);
          resolve();
        });

        this.client.on('error', (err) => {
          console.error(`[SSH] Connection error: ${err.message}`);
          reject(err);
        });

        this.client.connect(connectionConfig);
      } catch (err) {
        reject(err);
      }
    });
  }

  async execute(command: string): Promise<SSHExecutionResult> {
    if (!this.client) {
      throw new Error('SSH client not connected');
    }

    return new Promise((resolve, reject) => {
      try {
        this.client!.exec(command, (err, stream) => {
          if (err) {
            console.error(`[SSH] Command failed: ${command}`);
            return reject(err);
          }

          let stdout = '';
          let stderr = '';
          let exitCode = 0;

          stream.on('data', (data: Buffer) => {
            stdout += data.toString();
          });

          stream.stderr!.on('data', (data: Buffer) => {
            stderr += data.toString();
          });

          stream.on('close', (code: number) => {
            exitCode = code;
            console.log(`[SSH] Command completed: ${command} (exit code: ${code})`);
            resolve({ stdout, stderr, exitCode });
          });

          stream.on('error', reject);
        });
      } catch (err) {
        reject(err);
      }
    });
  }

  async executeInteractive(command: string, timeout: number = 10000): Promise<string> {
    if (!this.client) {
      throw new Error('SSH client not connected');
    }

    return new Promise((resolve, reject) => {
      try {
        const timeoutHandle = setTimeout(() => {
          reject(new Error(`Command timeout after ${timeout}ms: ${command}`));
        }, timeout);

        this.client!.exec(command, (err, stream) => {
          if (err) {
            clearTimeout(timeoutHandle);
            return reject(err);
          }

          let output = '';

          stream.on('data', (data: Buffer) => {
            output += data.toString();
          });

          stream.stderr!.on('data', (data: Buffer) => {
            output += data.toString();
          });

          stream.on('close', () => {
            clearTimeout(timeoutHandle);
            resolve(output);
          });

          stream.on('error', (err) => {
            clearTimeout(timeoutHandle);
            reject(err);
          });
        });
      } catch (err) {
        reject(err);
      }
    });
  }

  disconnect(): void {
    if (this.client) {
      this.client.end();
      this.client = null;
      console.log('[SSH] Disconnected');
    }
  }

  isConnected(): boolean {
    return this.client !== null && (this.client as any).authenticated === true;
  }
}

export async function createSSHManager(): Promise<SSHManager> {
  const manager = new SSHManager({
    host: process.env.VPS_HOST || '',
    port: parseInt(process.env.VPS_PORT || '22'),
    username: process.env.VPS_USERNAME || 'root',
    privateKeyPath: process.env.VPS_PRIVATE_KEY_PATH,
    password: process.env.VPS_PASSWORD,
  });

  await manager.connect();
  return manager;
}
