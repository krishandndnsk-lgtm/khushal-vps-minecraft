'use server';

import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth/jwt';
import { getDatabase } from '@/lib/db/db';
import { createSSHManager } from '@/lib/vps/ssh';
import { createMinecraftController } from '@/lib/minecraft/controller';
import { getConsoleManager } from '@/lib/minecraft/console';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  let sshManager: any = null;
  
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json(
        { success: false, error: 'Invalid token' },
        { status: 401 }
      );
    }
    
    const db = getDatabase();
    const server = db.prepare('SELECT * FROM servers WHERE id = ?').get(params.id) as any;
    
    if (!server) {
      return NextResponse.json(
        { success: false, error: 'Server not found' },
        { status: 404 }
      );
    }
    
    // Check authorization
    if (server.user_id !== payload.user_id && payload.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      );
    }
    
    const limit = parseInt(req.nextUrl.searchParams.get('limit') || '100');
    
    // Try to get real logs from VPS first
    if (process.env.VPS_HOST) {
      try {
        sshManager = await createSSHManager();
        const controller = await createMinecraftController(sshManager);
        const logs = await controller.getConsoleLogs(server, limit);
        
        if (logs.length > 0) {
          return NextResponse.json({
            success: true,
            data: logs.map(log => ({
              id: Math.random().toString(),
              server_id: params.id,
              level: 'info',
              message: log,
              timestamp: new Date().toISOString(),
            })),
          });
        }
      } catch (error) {
        console.error('[API] Failed to read VPS logs:', error);
        // Fall through to database logs
      }
    }
    
    // Fallback to database logs
    const consoleManager = getConsoleManager();
    const dbLogs = await consoleManager.getLogs(params.id, limit);
    
    return NextResponse.json({
      success: true,
      data: dbLogs,
    });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error('[API] Get logs error:', errorMsg);
    return NextResponse.json(
      { success: false, error: 'Failed to get logs' },
      { status: 500 }
    );
  } finally {
    if (sshManager) {
      sshManager.disconnect();
    }
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  let sshManager: any = null;
  
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json(
        { success: false, error: 'Invalid token' },
        { status: 401 }
      );
    }
    
    const db = getDatabase();
    const server = db.prepare('SELECT * FROM servers WHERE id = ?').get(params.id) as any;
    
    if (!server) {
      return NextResponse.json(
        { success: false, error: 'Server not found' },
        { status: 404 }
      );
    }
    
    // Check authorization
    if (server.user_id !== payload.user_id && payload.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      );
    }
    
    const body = await req.json();
    const command = body.command?.trim();
    
    if (!command) {
      return NextResponse.json(
        { success: false, error: 'Command cannot be empty' },
        { status: 400 }
      );
    }
    
    // Check if VPS is configured
    if (!process.env.VPS_HOST) {
      return NextResponse.json(
        { success: false, error: 'VPS not configured' },
        { status: 503 }
      );
    }

    try {
      // Send command via VPS
      sshManager = await createSSHManager();
      const controller = await createMinecraftController(sshManager);
      
      const result = await controller.sendCommand(server, command);
      
      if (result.success) {
        return NextResponse.json({
          success: true,
          message: 'Command sent successfully',
        });
      } else {
        return NextResponse.json(
          { success: false, error: result.error || 'Failed to send command' },
          { status: 400 }
        );
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error('[API] Send command error:', errorMsg);
      
      return NextResponse.json(
        { success: false, error: `Command failed: ${errorMsg}` },
        { status: 500 }
      );
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error('[API] Send command error:', errorMsg);
    return NextResponse.json(
      { success: false, error: 'Failed to send command' },
      { status: 500 }
    );
  } finally {
    if (sshManager) {
      sshManager.disconnect();
    }
  }
}
