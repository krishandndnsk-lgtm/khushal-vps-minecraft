'use server';

import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth/jwt';
import { getBackupManager } from '@/lib/minecraft/backups';
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
    
    const backupManager = getBackupManager();
    const backups = await backupManager.getBackups(params.id);
    
    return NextResponse.json({
      success: true,
      data: backups,
    });
  } catch (error) {
    console.error('Get backups error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get backups' },
      { status: 500 }
    );
  }
}

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
    
    const body = await req.json();
    const backupName = body.name || `backup-${Date.now()}`;
    
    const backupManager = getBackupManager();
    const logger = getActivityLogger();
    
    try {
      // TODO: Implement actual backup creation via SSH
      const backup = await backupManager.createBackup(
        params.id,
        backupName,
        `/opt/minecraft/backups/${backupName}.tar.gz`,
        1024 * 1024 * 100 // 100 MB placeholder
      );
      
      await logger.log(payload.user_id, 'Backup created', 'success', params.id);
      
      return NextResponse.json({
        success: true,
        message: 'Backup created successfully',
        data: backup,
      });
    } catch (error) {
      await logger.log(payload.user_id, 'Backup creation failed', 'failed', params.id, String(error));
      
      return NextResponse.json(
        { success: false, error: 'Failed to create backup' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Create backup error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create backup' },
      { status: 500 }
    );
  }
}
