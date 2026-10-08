import { Client as SSHClient } from 'ssh2';
import * as fs from 'fs';

interface SSHConfig {
  host: string;
  port: number;
  username: string;
  privateKeyPath: string;
}

export class SSHManager {
  private config: SSHConfig;
  private client: SSHClient | null = null;

  constructor(config: SSHConfig) {
    this.config = config;
  }

  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.client = new SSHClient();
      
      const privateKey = fs.readFileSync(this.config.privateKeyPath, 'utf-8');
      
      this.client.on('ready', () => {
        resolve();
      });
      
      this.client.on('error', reject);
      
      this.client.connect({
        host: this.config.host,
        port: this.config.port,
        username: this.config.username,
        privateKey: privateKey,
        readyTimeout: 30000,
      });
    });
  }

  async execute(command: string): Promise<string> {
    if (!this.client) throw new Error('SSH not connected');
    
    return new Promise((resolve, reject) => {
      this.client!.exec(command, (err, stream) => {
        if (err) return reject(err);
        
        let output = '';
        
        stream.on('data', (data: Buffer) => {
          output += data.toString();
        });
        
        stream.on('close', () => {
          resolve(output);
        });
        
        stream.on('error', reject);
      });
    });
  }

  disconnect(): void {
    if (this.client) {
      this.client.end();
      this.client = null;
    }
  }
}

export async function createSSHManager(): Promise<SSHManager> {
  const manager = new SSHManager({
    host: process.env.VPS_HOST || '',
    port: parseInt(process.env.VPS_PORT || '22'),
    username: process.env.VPS_USERNAME || 'root',
    privateKeyPath: process.env.VPS_PRIVATE_KEY_PATH || '',
  });
  
  await manager.connect();
  return manager;
}
