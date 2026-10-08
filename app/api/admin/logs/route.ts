'use server';

import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth/jwt';
import { getActivityLogger } from '@/lib/activity/logger';

export async function GET(req: NextRequest) {
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
    
    if (payload.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      );
    }
    
    const logger = getActivityLogger();
    const logs = await logger.getLogs(undefined, 500);
    
    return NextResponse.json({
      success: true,
      data: logs,
    });
  } catch (error) {
    console.error('Get logs error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get logs' },
      { status: 500 }
    );
  }
}
