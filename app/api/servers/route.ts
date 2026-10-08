'use server';

import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth/jwt';
import { getServerManager } from '@/lib/minecraft/server-manager';
import { CreateServerSchema } from '@/lib/validation/schemas';
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
    
    const serverManager = getServerManager();
    const isAdmin = payload.role === 'admin';
    
    const servers = isAdmin
      ? await serverManager.getAllServers()
      : await serverManager.getServersByUser(payload.user_id);
    
    return NextResponse.json({
      success: true,
      data: servers,
    });
  } catch (error) {
    console.error('Get servers error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get servers' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
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
    
    const body = await req.json();
    
    // Validate input
    const validated = CreateServerSchema.parse(body);
    
    const serverManager = getServerManager();
    const server = await serverManager.createServer(payload.user_id, validated);
    
    // Log activity
    const logger = getActivityLogger();
    await logger.log(payload.user_id, 'Server created', 'success', server.id);
    
    return NextResponse.json({
      success: true,
      message: 'Server created successfully',
      data: server,
    });
  } catch (error: any) {
    console.error('Create server error:', error);
    
    if (error.errors) {
      return NextResponse.json(
        { success: false, error: error.errors[0]?.message || 'Validation failed' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { success: false, error: 'Failed to create server' },
      { status: 500 }
    );
  }
}
