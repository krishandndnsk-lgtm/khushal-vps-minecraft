import { z } from 'zod';

export const RegisterSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters').regex(/[A-Z]/, 'Password must contain uppercase letter').regex(/[0-9]/, 'Password must contain number'),
  full_name: z.string().min(2, 'Name must be at least 2 characters'),
});

export const LoginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Password required'),
});

export const CreateServerSchema = z.object({
  name: z.string().min(3, 'Server name must be at least 3 characters').max(32, 'Server name too long'),
  minecraft_version: z.string().regex(/^\d+\.\d+(\.\d+)?$/, 'Invalid version format'),
  software: z.enum(['vanilla', 'paper', 'purpur', 'fabric', 'forge']),
  port: z.number().int().min(1024, 'Port must be above 1024').max(65535, 'Port must be below 65536'),
  ram_gb: z.number().min(0.5).max(24, 'RAM allocation too high for 32GB server'),
  cpu_limit: z.number().min(0.1).max(4, 'CPU limit too high'),
  storage_gb: z.number().min(1).max(100, 'Storage too high'),
  max_players: z.number().int().min(1).max(1000),
});

export const UpdateServerPropertiesSchema = z.object({
  motd: z.string().max(59, 'MOTD too long').optional(),
  gamemode: z.enum(['survival', 'creative', 'adventure', 'spectator']).optional(),
  difficulty: z.enum(['peaceful', 'easy', 'normal', 'hard']).optional(),
  max_players: z.number().int().min(1).optional(),
  online_mode: z.boolean().optional(),
  pvp: z.boolean().optional(),
  view_distance: z.number().int().min(3).max(32).optional(),
  simulation_distance: z.number().int().min(3).max(32).optional(),
  spawn_protection: z.number().int().min(0).optional(),
  allow_flight: z.boolean().optional(),
  white_list: z.boolean().optional(),
});

export const ConsoleCommandSchema = z.object({
  command: z.string().min(1).max(256),
});

export const ALLOWED_CONSOLE_COMMANDS = [
  'say', 'list', 'save-all', 'save-off', 'save-on',
  'whitelist', 'op', 'deop', 'ban', 'ban-ip', 'pardon', 'pardon-ip',
  'kick', 'give', 'gamemode', 'difficulty', 'seed', 'forceload',
  'time', 'weather', 'effect', 'enchant', 'clear'
];

export function validateConsoleCommand(command: string): boolean {
  const parts = command.trim().split(/\s+/);
  if (!parts[0]) return false;
  return ALLOWED_CONSOLE_COMMANDS.some(allowed => parts[0].toLowerCase().startsWith(allowed));
}
