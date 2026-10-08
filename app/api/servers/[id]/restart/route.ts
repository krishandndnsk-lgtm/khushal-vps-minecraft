'use server';

import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth/jwt';
import { getDatabase } from '@/lib/db/db';
import { getActivityLogger } from '@/lib/activity/logger';
import { createSSHManager } from '@/lib/vps/ssh';
import { createMinecraftController } from '@/lib/minecraft/controller';

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
    
    const logger = getActivityLogger();
    
    // Check if VPS is configured
    if (!process.env.VPS_HOST) {
      await logger.log(payload.user_id, 'Server restart attempted without VPS configured', 'failed', params.id, 'VPS not configured');
      return NextResponse.json(
        { success: false, error: 'VPS not configured' },
        { status: 503 }
      );
    }

    try {
      // Connect to VPS and restart server
      sshManager = await createSSHManager();
      const controller = await createMinecraftController(sshManager);
      
      const result = await controller.restartServer(server);
      
      if (result.success) {
        await logger.log(payload.user_id, 'Server restarted', 'success', params.id);
        
        return NextResponse.json({
          success: true,
          message: 'Server restarted successfully',
        });
      } else {
        await logger.log(payload.user_id, 'Server restart failed', 'failed', params.id, result.error);
        
        return NextResponse.json(
          { success: false, error: result.error || 'Failed to restart server' },
          { status: 500 }
        );
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error('[API] Restart server error:', errorMsg);
      
      await logger.log(payload.user_id, 'Server restart failed', 'failed', params.id, errorMsg);
      
      return NextResponse.json(
        { success: false, error: `Server restart failed: ${errorMsg}` },
        { status: 500 }
      );
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error('[API] Restart server error:', errorMsg);
    return NextResponse.json(
      { success: false, error: 'Failed to restart server' },
      { status: 500 }
    );
  } finally {
    if (sshManager) {
      sshManager.disconnect();
    }
  }
}
