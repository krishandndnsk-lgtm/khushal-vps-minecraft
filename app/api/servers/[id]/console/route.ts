'use server';

import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth/jwt';
import { getConsoleManager } from '@/lib/minecraft/console';
import { getDatabase } from '@/lib/db/db';

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
    
    const consoleManager = getConsoleManager();
    const logs = await consoleManager.getLogs(params.id);
    
    return NextResponse.json({
      success: true,
      data: logs.reverse(),
    });
  } catch (error) {
    console.error('Get console logs error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get console logs' },
      { status: 500 }
    );
  }
}
