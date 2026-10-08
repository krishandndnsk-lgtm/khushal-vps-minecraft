'use server';

import { NextRequest, NextResponse } from 'next/server';
import { LoginSchema } from '@/lib/validation/schemas';
import { verifyPassword } from '@/lib/auth/password';
import { createToken } from '@/lib/auth/jwt';
import { getDatabase } from '@/lib/db/db';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Validate input
    const validated = LoginSchema.parse(body);
    
    const db = getDatabase();
    
    // Find user
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(validated.email) as any;
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Invalid credentials' },
        { status: 401 }
      );
    }
    
    if (user.status === 'disabled') {
      return NextResponse.json(
        { success: false, error: 'Account disabled' },
        { status: 403 }
      );
    }
    
    // Verify password
    const passwordValid = await verifyPassword(validated.password, user.password_hash);
    
    if (!passwordValid) {
      return NextResponse.json(
        { success: false, error: 'Invalid credentials' },
        { status: 401 }
      );
    }
    
    // Create token
    const token = createToken(user.id, user.email, user.role);
    
    return NextResponse.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user.id,
          email: user.email,
          full_name: user.full_name,
          role: user.role,
        },
        token,
      },
    });
  } catch (error: any) {
    console.error('Login error:', error);
    
    if (error.errors) {
      return NextResponse.json(
        { success: false, error: error.errors[0]?.message || 'Validation failed' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { success: false, error: 'Login failed' },
      { status: 500 }
    );
  }
}
