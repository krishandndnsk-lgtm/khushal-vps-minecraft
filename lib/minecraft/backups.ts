import { Backup } from '@/lib/types';
import { getDatabase } from '@/lib/db/db';
import { v4 as uuidv4 } from 'uuid';

export class BackupManager {
  async createBackup(serverId: string, name: string, filePath: string, sizeBytes: number): Promise<Backup> {
    const db = getDatabase();
    const id = uuidv4();
    const createdAt = new Date().toISOString();
    
    db.prepare(`
      INSERT INTO backups (id, server_id, name, file_path, size_bytes, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, serverId, name, filePath, sizeBytes, createdAt);
    
    return { id, server_id: serverId, name, file_path: filePath, size_bytes: sizeBytes, created_at: createdAt, restored_at: null };
  }

  async getBackups(serverId: string): Promise<Backup[]> {
    const db = getDatabase();
    return db.prepare(`
      SELECT * FROM backups
      WHERE server_id = ?
      ORDER BY created_at DESC
    `).all(serverId) as Backup[];
  }

  async getBackup(backupId: string): Promise<Backup> {
    const db = getDatabase();
    const backup = db.prepare('SELECT * FROM backups WHERE id = ?').get(backupId) as any;
    
    if (!backup) {
      throw new Error('Backup not found');
    }
    
    return backup;
  }

  async deleteBackup(backupId: string): Promise<void> {
    const db = getDatabase();
    db.prepare('DELETE FROM backups WHERE id = ?').run(backupId);
  }

  async markRestored(backupId: string): Promise<void> {
    const db = getDatabase();
    const now = new Date().toISOString();
    db.prepare('UPDATE backups SET restored_at = ? WHERE id = ?').run(now, backupId);
  }
}

export function getBackupManager(): BackupManager {
  return new BackupManager();
}
