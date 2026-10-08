import { getDatabase } from '@/lib/db/db';
import { v4 as uuidv4 } from 'uuid';

export class ConsoleManager {
  async addLog(serverId: string, level: 'info' | 'warn' | 'error', message: string): Promise<void> {
    const db = getDatabase();
    const id = uuidv4();
    const timestamp = new Date().toISOString();
    
    db.prepare(`
      INSERT INTO console_logs (id, server_id, level, message, timestamp)
      VALUES (?, ?, ?, ?, ?)
    `).run(id, serverId, level, message, timestamp);
  }

  async getLogs(serverId: string, limit: number = 100): Promise<any[]> {
    const db = getDatabase();
    return db.prepare(`
      SELECT * FROM console_logs
      WHERE server_id = ?
      ORDER BY timestamp DESC
      LIMIT ?
    `).all(serverId, limit) as any[];
  }

  async clearLogs(serverId: string): Promise<void> {
    const db = getDatabase();
    db.prepare('DELETE FROM console_logs WHERE server_id = ?').run(serverId);
  }
}

export function getConsoleManager(): ConsoleManager {
  return new ConsoleManager();
}
