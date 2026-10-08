// ==================
// Core Type Definitions
// ==================

export interface User {
  id: string;
  email: string;
  password_hash: string;
  full_name: string;
  role: 'admin' | 'user';
  status: 'active' | 'disabled';
  created_at: string;
  updated_at: string;
}

export interface Session {
  id: string;
  user_id: string;
  token: string;
  expires_at: string;
  created_at: string;
}

export type ServerStatus = 'online' | 'offline' | 'starting' | 'stopping' | 'crashed';

export interface Server {
  id: string;
  user_id: string;
  name: string;
  minecraft_version: string;
  software: 'vanilla' | 'paper' | 'purpur' | 'fabric' | 'forge';
  port: number;
  ram_gb: number;
  cpu_limit: number;
  storage_gb: number;
  max_players: number;
  status: ServerStatus;
  process_id: number | null;
  motd: string;
  gamemode: string;
  difficulty: string;
  created_at: string;
  updated_at: string;
  last_started: string | null;
  last_stopped: string | null;
}

export interface Backup {
  id: string;
  server_id: string;
  name: string;
  file_path: string;
  size_bytes: number;
  created_at: string;
  restored_at: string | null;
}

export interface ActivityLog {
  id: string;
  user_id: string;
  server_id: string | null;
  action: string;
  status: 'success' | 'failed';
  error_message: string | null;
  created_at: string;
}

export interface ConsoleLog {
  id: string;
  server_id: string;
  level: 'info' | 'warn' | 'error';
  message: string;
  timestamp: string;
}

export interface ResourceMetrics {
  id: string;
  server_id?: string;
  cpu_percent: number;
  ram_used_gb: number;
  ram_total_gb: number;
  disk_used_gb: number;
  disk_total_gb: number;
  network_in_mb: number;
  network_out_mb: number;
  timestamp: string;
}

export interface VPSInfo {
  hostname: string;
  cpu_cores: number;
  ram_total_gb: number;
  storage_total_gb: number;
  uptime_seconds: number;
  os_release: string;
}

export interface AuthPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  email: string;
  password: string;
  full_name: string;
}

export interface CreateServerPayload {
  name: string;
  minecraft_version: string;
  software: 'vanilla' | 'paper' | 'purpur' | 'fabric' | 'forge';
  port: number;
  ram_gb: number;
  cpu_limit: number;
  storage_gb: number;
  max_players: number;
}

export interface UpdateServerPropertiesPayload {
  motd?: string;
  gamemode?: string;
  difficulty?: string;
  max_players?: number;
  online_mode?: boolean;
  pvp?: boolean;
  view_distance?: number;
  simulation_distance?: number;
  spawn_protection?: number;
  allow_flight?: boolean;
  white_list?: boolean;
}

export interface APIResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

export interface JWTPayload {
  user_id: string;
  email: string;
  role: string;
  iat: number;
  exp: number;
}
