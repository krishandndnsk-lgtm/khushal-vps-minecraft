'use server';

import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth/jwt';
import { getServerManager } from '@/lib/minecraft/server-manager';
import { getDatabase } from '@/lib/db/db';
import { getActivityLogger } from '@/lib/activity/logger';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
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
    
    const serverManager = getServerManager();
    const server = await serverManager.getServer(params.id);
    
    // Check authorization
    if (server.user_id !== payload.user_id && payload.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: server,
    });
  } catch (error: any) {
    if (error.message === 'Server not found') {
      return NextResponse.json(
        { success: false, error: 'Server not found' },
        { status: 404 }
      );
    }
    
    console.error('Get server error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get server' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
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
    await serverManager.deleteServer(params.id);
    
    // Log activity
    const logger = getActivityLogger();
    await logger.log(payload.user_id, 'Server deleted', 'success', params.id);
    
    return NextResponse.json({
      success: true,
      message: 'Server deleted successfully',
    });
  } catch (error) {
    console.error('Delete server error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete server' },
      { status: 500 }
    );
  }
}
