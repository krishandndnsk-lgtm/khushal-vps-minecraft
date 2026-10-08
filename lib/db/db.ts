import Database from 'better-sqlite3';
import path from 'path';
import { SCHEMA } from './schema';

let db: Database.Database | null = null;

export function getDatabase(): Database.Database {
  if (!db) {
    const dbPath = path.join(process.cwd(), 'data', 'khushal.db');
    db = new Database(dbPath);
    db.pragma('journal_mode = WAL');
    db.pragma('synchronous = NORMAL');
  }
  return db;
}

export function initializeDatabase(): void {
  const database = getDatabase();
  const statements = SCHEMA.split(';').filter(s => s.trim());
  
  statements.forEach(statement => {
    try {
      database.exec(statement);
    } catch (error) {
      console.error('Schema initialization error:', error);
      throw error;
    }
  });
  
  console.log('✅ Database initialized successfully');
}

export function closeDatabase(): void {
  if (db) {
    db.close();
    db = null;
  }
}
