'use server';

import { NextRequest, NextResponse } from 'next/server';
import { RegisterSchema } from '@/lib/validation/schemas';
import { hashPassword } from '@/lib/auth/password';
import { createToken } from '@/lib/auth/jwt';
import { getDatabase } from '@/lib/db/db';
import { v4 as uuidv4 } from 'uuid';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Validate input
    const validated = RegisterSchema.parse(body);
    
    const db = getDatabase();
    
    // Check if user exists
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(validated.email);
    if (existing) {
      return NextResponse.json(
        { success: false, error: 'Email already registered' },
        { status: 400 }
      );
    }
    
    // Hash password
    const passwordHash = await hashPassword(validated.password);
    
    // Create user
    const userId = uuidv4();
    const now = new Date().toISOString();
    
    db.prepare(`
      INSERT INTO users (id, email, password_hash, full_name, role, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(userId, validated.email, passwordHash, validated.full_name, 'user', 'active', now, now);
    
    // Create token
    const token = createToken(userId, validated.email, 'user');
    
    return NextResponse.json({
      success: true,
      message: 'Registration successful',
      data: {
        user: {
          id: userId,
          email: validated.email,
          full_name: validated.full_name,
          role: 'user',
        },
        token,
      },
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    
    if (error.errors) {
      return NextResponse.json(
        { success: false, error: error.errors[0]?.message || 'Validation failed' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { success: false, error: 'Registration failed' },
      { status: 500 }
    );
  }
}
