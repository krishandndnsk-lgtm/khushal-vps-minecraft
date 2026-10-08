'use server';

import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth/jwt';
import { getDatabase } from '@/lib/db/db';

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
    
    const db = getDatabase();
    const users = db.prepare('SELECT id, email, full_name, role, status, created_at FROM users ORDER BY created_at DESC').all() as any[];
    
    return NextResponse.json({
      success: true,
      data: users,
    });
  } catch (error) {
    console.error('Get users error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get users' },
      { status: 500 }
    );
  }
}
