import { ActivityLog } from '@/lib/types';
import { getDatabase } from '@/lib/db/db';
import { v4 as uuidv4 } from 'uuid';

export class ActivityLogger {
  async log(
    userId: string,
    action: string,
    status: 'success' | 'failed' = 'success',
    serverId?: string,
    errorMessage?: string
  ): Promise<ActivityLog> {
    const db = getDatabase();
    const id = uuidv4();
    const createdAt = new Date().toISOString();
    
    db.prepare(`
      INSERT INTO activity_logs (id, user_id, server_id, action, status, error_message, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(id, userId, serverId || null, action, status, errorMessage || null, createdAt);
    
    return {
      id,
      user_id: userId,
      server_id: serverId || '',
      action,
      status,
      error_message: errorMessage || null,
      created_at: createdAt,
    };
  }

  async getLogs(serverId?: string, limit: number = 100): Promise<ActivityLog[]> {
    const db = getDatabase();
    
    if (serverId) {
      return db.prepare(`
        SELECT * FROM activity_logs
        WHERE server_id = ?
        ORDER BY created_at DESC
        LIMIT ?
      `).all(serverId, limit) as ActivityLog[];
    }
    
    return db.prepare(`
      SELECT * FROM activity_logs
      ORDER BY created_at DESC
      LIMIT ?
    `).all(limit) as ActivityLog[];
  }
}

export function getActivityLogger(): ActivityLogger {
  return new ActivityLogger();
}
