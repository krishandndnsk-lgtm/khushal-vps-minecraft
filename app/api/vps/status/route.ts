'use server';

import { NextRequest, NextResponse } from 'next/server';
import { getVPSManager } from '@/lib/vps/manager';

export async function GET(req: NextRequest) {
  try {
    const vpsManager = await getVPSManager();
    const info = await vpsManager.getVPSInfo();
    const metrics = await vpsManager.getMetrics();
    
    if (!info) {
      return NextResponse.json({
        success: false,
        error: 'VPS connection failed - check environment variables',
        configured: !(!process.env.VPS_HOST || !process.env.VPS_PRIVATE_KEY_PATH),
      }, { status: 503 });
    }
    
    return NextResponse.json({
      success: true,
      data: {
        info,
        metrics,
        configured: true,
      },
    });
  } catch (error) {
    console.error('VPS status error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to get VPS status',
      configured: !(!process.env.VPS_HOST || !process.env.VPS_PRIVATE_KEY_PATH),
    }, { status: 503 });
  }
}
