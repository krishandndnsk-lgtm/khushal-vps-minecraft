import { Server, ServerStatus } from '@/lib/types';
import { getDatabase } from '@/lib/db/db';
import { v4 as uuidv4 } from 'uuid';

export class MinecraftServerManager {
  async createServer(userId: string, data: any): Promise<Server> {
    const db = getDatabase();
    const serverId = uuidv4();
    const now = new Date().toISOString();

    const stmt = db.prepare(`
      INSERT INTO servers (
        id, user_id, name, minecraft_version, software,
        port, ram_gb, cpu_limit, storage_gb, max_players,
        status, created_at, updated_at, motd, gamemode, difficulty
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      serverId, userId, data.name, data.minecraft_version, data.software,
      data.port, data.ram_gb, data.cpu_limit, data.storage_gb, data.max_players,
      'offline', now, now, 'Welcome to KHUSHAL VPS', 'survival', 'normal'
    );

    return this.getServer(serverId);
  }

  async getServer(serverId: string): Promise<Server> {
    const db = getDatabase();
    const server = db.prepare('SELECT * FROM servers WHERE id = ?').get(serverId) as any;
    
    if (!server) {
      throw new Error('Server not found');
    }
    
    return server;
  }

  async getServersByUser(userId: string): Promise<Server[]> {
    const db = getDatabase();
    return db.prepare('SELECT * FROM servers WHERE user_id = ? ORDER BY created_at DESC').all(userId) as Server[];
  }

  async getAllServers(): Promise<Server[]> {
    const db = getDatabase();
    return db.prepare('SELECT * FROM servers ORDER BY created_at DESC').all() as Server[];
  }

  async updateServerStatus(serverId: string, status: ServerStatus): Promise<void> {
    const db = getDatabase();
    const now = new Date().toISOString();
    
    db.prepare('UPDATE servers SET status = ?, updated_at = ? WHERE id = ?')
      .run(status, now, serverId);
  }

  async updateServerProperties(serverId: string, properties: any): Promise<void> {
    const db = getDatabase();
    const now = new Date().toISOString();
    
    const updates = Object.keys(properties)
      .map(key => `${key} = ?`)
      .join(', ');
    
    const values = Object.values(properties);
    values.push(now);
    values.push(serverId);
    
    db.prepare(`UPDATE servers SET ${updates}, updated_at = ? WHERE id = ?`)
      .run(...values);
  }

  async deleteServer(serverId: string): Promise<void> {
    const db = getDatabase();
    db.prepare('DELETE FROM servers WHERE id = ?').run(serverId);
  }
}

export function getServerManager(): MinecraftServerManager {
  return new MinecraftServerManager();
}
