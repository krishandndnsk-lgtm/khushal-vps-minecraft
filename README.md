# KHUSHAL VPS - Minecraft Hosting Control Panel

**Power Your Minecraft. Your Way.**

Production-ready Minecraft VPS hosting panel for a 32 GB dedicated server with enterprise-grade security, real-time monitoring, and complete server lifecycle management.

## Features

### Authentication & Authorization
- Secure user registration and login
- Password hashing with bcryptjs
- JWT-based session management
- Admin and User role-based access control
- Rate limiting on authentication endpoints
- Activity logging for security audits

### VPS Management
- Real SSH/SFTP integration with secure key authentication
- Live CPU, RAM, Disk, and Network monitoring
- Automatic VPS connection health checks
- Process monitoring and crash detection
- Automatic restart with configurable cooldown

### Minecraft Server Management
- **Create Servers** with wizard interface
  - Server software selection (Vanilla, Paper, Purpur, Fabric, Forge)
  - Minecraft version selection
  - RAM/CPU/Disk allocation
  - Port assignment and validation
- **Server Lifecycle**
  - Start, Stop, Restart, Kill operations
  - Startup success/failure detection
  - Crash detection and recovery
  - Real-time status monitoring
- **Server Properties Editor**
  - GUI for server.properties configuration
  - Live preview of changes
  - Restart requirement detection

### Console & Logs
- Real-time Minecraft console access via WebSocket/SSE
- Live server logs with auto-scrolling
- Timestamp and error detection
- Command input for server operations (say, list, save-all, etc.)
- Log search and copy functionality
- Error pattern recognition

### Player Management
- Online players list with UUID and IP
- Whitelist management
- OP (operator) management
- Ban/Unban system
- Kick player functionality
- Batch operations

### File Manager
- SFTP-based file browser
- Upload/Download files
- Edit text files (server.properties, configuration files)
- Create/Delete folders and files
- Rename operations
- ZIP upload and extraction
- Path traversal protection
- Special file handling (ops.json, whitelist.json, etc.)

### Backups & Restore
- Manual and automatic backup creation
- Compressed archives with metadata
- Backup restore with validation
- Safe restore workflow (stop server → validate → restore → start)
- Backup retention policies
- Scheduled automatic backups
- Download backups
- Backup size and date tracking

### Monitoring & Analytics
- Real-time graphs for CPU, RAM, Disk, Network
- Historical data retention
- Server uptime tracking
- Performance metrics
- Resource allocation visualization

### Admin Panel
- View all users and servers
- User enable/disable
- Global resource monitoring
- Server management across users
- Activity log viewing
- System health dashboard

### Mobile Responsive
- Fully responsive design
- Touch-friendly controls
- Mobile-optimized dashboard
- Console and file manager on mobile

## Tech Stack

- **Frontend**: Next.js 14, React, TypeScript
- **Backend**: Next.js API Routes, Node.js
- **Database**: SQLite with persistent storage
- **Authentication**: JWT + bcryptjs
- **VPS Communication**: SSH2 + SFTP
- **Real-time**: WebSocket/Server-Sent Events
- **Validation**: Zod
- **Security**: Rate limiting, CSRF protection, input validation

## Installation

### Prerequisites
- Node.js 18+ and npm/yarn
- SSH access to your Minecraft VPS
- 32 GB RAM server with Linux OS

### 1. Clone and Install

```bash
git clone https://github.com/krishandndnsk-lgtm/khushal-vps-minecraft.git
cd khushal-vps-minecraft
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env.local
```

Edit `.env.local` with your VPS credentials:
```
VPS_HOST=your-server-ip
VPS_USERNAME=root
VPS_PRIVATE_KEY_PATH=/path/to/private/key
VPS_ROOT_PATH=/opt/minecraft
JWT_SECRET=your-random-secret
SESSION_SECRET=your-random-secret
```

### 3. Initialize Database

```bash
npm run db:init
```

This creates SQLite database with all required tables:
- `users` - User accounts with roles
- `sessions` - Active sessions
- `servers` - Minecraft servers
- `backups` - Backup records
- `activity_logs` - Audit trail
- `console_logs` - Server console output
- `resource_metrics` - CPU/RAM/Disk history

### 4. VPS Server Setup

On your 32 GB VPS, ensure:

```bash
# Create root directory
sudo mkdir -p /opt/minecraft
sudo chown $USER:$USER /opt/minecraft

# Install Java (required for Minecraft)
sudo apt update
sudo apt install -y openjdk-17-jre-headless

# Verify installation
java -version
```

### 5. Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

Default credentials (first-run admin):
- Email: admin@khushal.local
- Password: (set during initialization)

## Production Deployment

### Build

```bash
npm run build
```

### Start Production Server

```bash
npm run start
```

### Environment Setup for Production

1. Use strong `JWT_SECRET` and `SESSION_SECRET`
2. Enable HTTPS/SSL
3. Use environment variables, never hardcode credentials
4. Set up firewall rules
5. Enable SSH key authentication only (no passwords)
6. Regular database backups
7. Log rotation and monitoring

## API Routes

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/verify` - Verify session

### Servers
- `GET /api/servers` - List user's servers
- `POST /api/servers` - Create new server
- `GET /api/servers/[id]` - Get server details
- `POST /api/servers/[id]/start` - Start server
- `POST /api/servers/[id]/stop` - Stop server
- `POST /api/servers/[id]/restart` - Restart server
- `DELETE /api/servers/[id]` - Delete server

### Console
- `GET /api/servers/[id]/console` - Get console logs
- `POST /api/servers/[id]/console/command` - Execute command
- `WebSocket /api/ws/console/[id]` - Real-time logs

### Files
- `GET /api/servers/[id]/files` - List files
- `GET /api/servers/[id]/files/download` - Download file
- `POST /api/servers/[id]/files/upload` - Upload file
- `POST /api/servers/[id]/files/save` - Save text file
- `DELETE /api/servers/[id]/files` - Delete file

### Backups
- `GET /api/servers/[id]/backups` - List backups
- `POST /api/servers/[id]/backups/create` - Create backup
- `POST /api/servers/[id]/backups/[backupId]/restore` - Restore backup
- `DELETE /api/servers/[id]/backups/[backupId]` - Delete backup

### Monitoring
- `GET /api/servers/[id]/metrics` - Resource metrics
- `GET /api/vps/status` - VPS health
- `GET /api/vps/info` - VPS information

### Admin
- `GET /api/admin/users` - List all users
- `GET /api/admin/servers` - List all servers
- `GET /api/admin/logs` - Activity logs
- `POST /api/admin/users/[id]/toggle` - Enable/disable user

## Security Features

✅ **No Plaintext Passwords** - All passwords hashed with bcryptjs
✅ **Secure Sessions** - JWT with expiration
✅ **Input Validation** - Zod schemas on all inputs
✅ **SSH Key Authentication** - No SSH passwords in code
✅ **Rate Limiting** - Protection against brute force
✅ **Path Traversal Protection** - SFTP requests validated
✅ **Command Injection Protection** - Allowlist for console commands
✅ **CSRF Protection** - Token-based on state-changing operations
✅ **Audit Logging** - All actions logged with user and timestamp
✅ **Environment Variables** - Credentials never in code
✅ **Role-Based Access** - User and Admin permissions
✅ **Error Handling** - Safe errors, no stack traces to frontend

## Database Schema

### users
```
id (primary)
email (unique)
password_hash
full_name
role (admin/user)
status (active/disabled)
created_at
updated_at
```

### servers
```
id (primary)
user_id (foreign)
name
minecraft_version
software (vanilla/paper/etc)
port
ram_gb
cpu_limit
storage_gb
max_players
status (online/offline/starting/stopping/crashed)
process_id
created_at
updated_at
last_started
last_stopped
```

### backups
```
id (primary)
server_id (foreign)
name
file_path
size_bytes
created_at
restored_at
```

### activity_logs
```
id (primary)
user_id (foreign)
server_id (foreign)
action (started/stopped/created/etc)
status (success/failed)
error_message
created_at
```

## Troubleshooting

### VPS Connection Failed
- Verify SSH credentials
- Check firewall rules
- Ensure private key has correct permissions (600)
- Check SSH service is running on VPS

### Database Lock Errors
- SQLite has built-in locking
- Ensure single app instance
- Check file permissions on data directory

### Minecraft Server Won't Start
- Verify Java is installed on VPS
- Check server software download succeeded
- Check port is not in use
- Review server logs

### Out of Memory Errors
- Check allocated RAM vs available
- Reduce player load or server count
- Increase swap on VPS

## Contributing

This is a production project. All changes should:
- Include proper error handling
- Add TypeScript types
- Follow security best practices
- Include database migrations if needed
- Add tests for new features

## License

Private - KHUSHAL VPS

## Support

For issues and questions, open an issue on GitHub.

---

**KHUSHAL VPS** — Power Your Minecraft. Your Way.
