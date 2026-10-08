// ==================
// Database Schema
// ==================

export const SCHEMA = `
-- Users Table
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user' CHECK(role IN ('admin', 'user')),
  status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'disabled')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- Sessions Table
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  token TEXT UNIQUE NOT NULL,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Servers Table
CREATE TABLE IF NOT EXISTS servers (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  minecraft_version TEXT NOT NULL,
  software TEXT NOT NULL CHECK(software IN ('vanilla', 'paper', 'purpur', 'fabric', 'forge')),
  port INTEGER NOT NULL UNIQUE,
  ram_gb REAL NOT NULL,
  cpu_limit REAL NOT NULL,
  storage_gb REAL NOT NULL,
  max_players INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'offline' CHECK(status IN ('online', 'offline', 'starting', 'stopping', 'crashed')),
  process_id INTEGER,
  motd TEXT DEFAULT 'Welcome to KHUSHAL VPS',
  gamemode TEXT DEFAULT 'survival',
  difficulty TEXT DEFAULT 'normal',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  last_started TEXT,
  last_stopped TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(user_id, port)
);

-- Backups Table
CREATE TABLE IF NOT EXISTS backups (
  id TEXT PRIMARY KEY,
  server_id TEXT NOT NULL,
  name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  size_bytes INTEGER NOT NULL,
  created_at TEXT NOT NULL,
  restored_at TEXT,
  FOREIGN KEY (server_id) REFERENCES servers(id) ON DELETE CASCADE
);

-- Activity Logs Table
CREATE TABLE IF NOT EXISTS activity_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  server_id TEXT,
  action TEXT NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('success', 'failed')),
  error_message TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (server_id) REFERENCES servers(id) ON DELETE SET NULL
);

-- Console Logs Table
CREATE TABLE IF NOT EXISTS console_logs (
  id TEXT PRIMARY KEY,
  server_id TEXT NOT NULL,
  level TEXT NOT NULL CHECK(level IN ('info', 'warn', 'error')),
  message TEXT NOT NULL,
  timestamp TEXT NOT NULL,
  FOREIGN KEY (server_id) REFERENCES servers(id) ON DELETE CASCADE
);

-- Resource Metrics Table
CREATE TABLE IF NOT EXISTS resource_metrics (
  id TEXT PRIMARY KEY,
  server_id TEXT,
  cpu_percent REAL NOT NULL,
  ram_used_gb REAL NOT NULL,
  ram_total_gb REAL NOT NULL,
  disk_used_gb REAL NOT NULL,
  disk_total_gb REAL NOT NULL,
  network_in_mb REAL NOT NULL,
  network_out_mb REAL NOT NULL,
  timestamp TEXT NOT NULL,
  FOREIGN KEY (server_id) REFERENCES servers(id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
CREATE INDEX IF NOT EXISTS idx_servers_user_id ON servers(user_id);
CREATE INDEX IF NOT EXISTS idx_servers_status ON servers(status);
CREATE INDEX IF NOT EXISTS idx_backups_server_id ON backups(server_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_server_id ON activity_logs(server_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created ON activity_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_console_logs_server_id ON console_logs(server_id);
CREATE INDEX IF NOT EXISTS idx_console_logs_timestamp ON console_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_resource_metrics_server_id ON resource_metrics(server_id);
CREATE INDEX IF NOT EXISTS idx_resource_metrics_timestamp ON resource_metrics(timestamp);
`;
