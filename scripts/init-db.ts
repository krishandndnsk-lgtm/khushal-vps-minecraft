#!/usr/bin/env node

import { initializeDatabase } from '../lib/db/db';
import { getDatabase } from '../lib/db/db';
import { hashPassword } from '../lib/auth/password';
import { v4 as uuidv4 } from 'uuid';
import * as readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(prompt: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function main() {
  console.log('\n🔧 KHUSHAL VPS - Database Initialization\n');
  
  try {
    // Initialize schema
    console.log('📦 Creating database schema...');
    initializeDatabase();
    
    const db = getDatabase();
    
    // Check if admin exists
    const adminCheck = db.prepare('SELECT id FROM users WHERE role = ? LIMIT 1').get('admin');
    
    if (!adminCheck) {
      console.log('\n👤 Creating default admin user...\n');
      
      const email = await question('Admin email: ');
      const password = await question('Admin password (min 8 chars, uppercase, number): ');
      const fullName = await question('Full name: ');
      
      // Validate
      if (password.length < 8 || !/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
        console.error('❌ Invalid password. Requirements: 8+ chars, uppercase, number');
        process.exit(1);
      }
      
      const passwordHash = await hashPassword(password);
      const userId = uuidv4();
      const now = new Date().toISOString();
      
      db.prepare(`
        INSERT INTO users (id, email, password_hash, full_name, role, status, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(userId, email, passwordHash, fullName, 'admin', 'active', now, now);
      
      console.log('\n✅ Admin user created');
    } else {
      console.log('✅ Admin user already exists');
    }
    
    console.log('\n✅ Database initialization complete!\n');
    console.log('📌 Next steps:');
    console.log('  1. Configure .env.local with VPS credentials');
    console.log('  2. npm run dev');
    console.log('  3. Login at http://localhost:3000\n');
    
    rl.close();
  } catch (error) {
    console.error('❌ Error:', error);
    rl.close();
    process.exit(1);
  }
}

main();
