'use server';

import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth/jwt';
import { getDatabase } from '@/lib/db/db';
import { getActivityLogger } from '@/lib/activity/logger';
import { createSSHManager } from '@/lib/vps/ssh';
import { createMinecraftController } from '@/lib/minecraft/controller';

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
    
    // Check if VPS is configured
    if (!process.env.VPS_HOST) {
      return NextResponse.json({
        success: true,
        data: {
          running: false,
          reason: 'VPS not configured',
        },
      });
    }

    try {
      // Connect to VPS and check status
      sshManager = await createSSHManager();
      const controller = await createMinecraftController(sshManager);
      
      const processInfo = await controller.isServerRunning(server);
      
      return NextResponse.json({
        success: true,
        data: processInfo,
      });
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error('[API] Status check error:', errorMsg);
      
      return NextResponse.json({
        success: true,
        data: {
          running: false,
          reason: `Status check failed: ${errorMsg}`,
        },
      });
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error('[API] Status check error:', errorMsg);
    return NextResponse.json(
      { success: false, error: 'Failed to check status' },
      { status: 500 }
    );
  } finally {
    if (sshManager) {
      sshManager.disconnect();
    }
  }
}
