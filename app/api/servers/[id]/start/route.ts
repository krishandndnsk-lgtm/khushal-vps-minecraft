'use server';

import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth/jwt';
import { getServerManager } from '@/lib/minecraft/server-manager';
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
    
    const serverManager = getServerManager();
    const logger = getActivityLogger();
    
    // Check if VPS is configured
    if (!process.env.VPS_HOST) {
      await logger.log(payload.user_id, 'Server start attempted without VPS configured', 'failed', params.id, 'VPS not configured');
      return NextResponse.json(
        { success: false, error: 'VPS not configured - set VPS_HOST environment variable' },
        { status: 503 }
      );
    }

    // Update status to starting
    await serverManager.updateServerStatus(params.id, 'starting');

    try {
      // Connect to VPS and start server
      sshManager = await createSSHManager();
      const controller = await createMinecraftController(sshManager);
      
      const result = await controller.startServer(server);
      
      if (result.success) {
        await serverManager.updateServerStatus(params.id, 'online');
        await logger.log(payload.user_id, 'Server started', 'success', params.id);
        
        return NextResponse.json({
          success: true,
          message: 'Server started successfully',
          data: { pid: result.pid },
        });
      } else {
        await serverManager.updateServerStatus(params.id, 'offline');
        await logger.log(payload.user_id, 'Server start failed', 'failed', params.id, result.error);
        
        return NextResponse.json(
          { success: false, error: result.error || 'Failed to start server' },
          { status: 500 }
        );
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error('[API] Start server error:', errorMsg);
      
      await serverManager.updateServerStatus(params.id, 'offline');
      await logger.log(payload.user_id, 'Server start failed', 'failed', params.id, errorMsg);
      
      return NextResponse.json(
        { success: false, error: `Server start failed: ${errorMsg}` },
        { status: 500 }
      );
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error('[API] Start server error:', errorMsg);
    return NextResponse.json(
      { success: false, error: 'Failed to start server' },
      { status: 500 }
    );
  } finally {
    if (sshManager) {
      sshManager.disconnect();
    }
  }
}
