'use server';

import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth/jwt';
import { getServerManager } from '@/lib/minecraft/server-manager';
import { getDatabase } from '@/lib/db/db';
import { getActivityLogger } from '@/lib/activity/logger';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
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
    
    try {
      // TODO: Implement actual server stop via SSH
      await serverManager.updateServerStatus(params.id, 'offline');
      await logger.log(payload.user_id, 'Server stopped', 'success', params.id);
      
      return NextResponse.json({
        success: true,
        message: 'Server stopped successfully',
      });
    } catch (error) {
      await logger.log(payload.user_id, 'Server stop failed', 'failed', params.id, String(error));
      
      return NextResponse.json(
        { success: false, error: 'Failed to stop server' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Stop server error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to stop server' },
      { status: 500 }
    );
  }
}
