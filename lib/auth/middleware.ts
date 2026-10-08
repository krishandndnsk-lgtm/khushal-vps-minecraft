import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from './jwt';
import { JWTPayload } from '@/lib/types';

export interface AuthRequest extends NextRequest {
  user?: JWTPayload;
}

export async function withAuth(handler: (req: AuthRequest) => Promise<NextResponse>) {
  return async (req: NextRequest) => {
    try {
      const token = req.headers.get('authorization')?.replace('Bearer ', '');
      
      if (!token) {
        return NextResponse.json(
          { success: false, error: 'No token provided' },
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
      
      const authReq = req as AuthRequest;
      authReq.user = payload;
      
      return handler(authReq);
    } catch (error) {
      console.error('Auth middleware error:', error);
      return NextResponse.json(
        { success: false, error: 'Authentication failed' },
        { status: 401 }
      );
    }
  };
}

export async function withAdminAuth(handler: (req: AuthRequest) => Promise<NextResponse>) {
  return async (req: NextRequest) => {
    try {
      const token = req.headers.get('authorization')?.replace('Bearer ', '');
      
      if (!token) {
        return NextResponse.json(
          { success: false, error: 'No token provided' },
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
      
      const authReq = req as AuthRequest;
      authReq.user = payload;
      
      return handler(authReq);
    } catch (error) {
      console.error('Admin auth middleware error:', error);
      return NextResponse.json(
        { success: false, error: 'Authentication failed' },
        { status: 401 }
      );
    }
  };
}
