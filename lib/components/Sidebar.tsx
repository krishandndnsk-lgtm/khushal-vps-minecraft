'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { Menu, X, LogOut, Users, BarChart3, Zap } from 'lucide-react';

export function Sidebar() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [open, setOpen] = React.useState(false);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const menuItems = [
    { href: '/dashboard', label: 'Dashboard', icon: '📊' },
    { href: '/dashboard/servers', label: 'Servers', icon: '🎮' },
    ...(user?.role === 'admin' ? [{ href: '/dashboard/admin', label: 'Admin Panel', icon: '⚙️' }] : []),
  ];

  return (
    <>
      {/* Mobile Toggle */}
      <button
        onClick={() => setOpen(!open)}
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-purple-600 rounded-lg"
      >
        {open ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Sidebar */}
      <aside className={`fixed left-0 top-0 h-screen w-64 bg-slate-950 border-r border-purple-500/20 glass transform transition-transform md:translate-x-0 ${
        open ? 'translate-x-0' : '-translate-x-full'
      } z-40 md:z-10`}>
        {/* Logo */}
        <div className="p-6 border-b border-purple-500/20">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
            🎮 KHUSHAL VPS
          </h1>
          <p className="text-xs text-gray-400 mt-1">Power Your Minecraft</p>
        </div>

        {/* User Info */}
        {user && (
          <div className="p-4 border-b border-purple-500/20">
            <p className="text-sm text-gray-300 font-medium">{user.full_name}</p>
            <p className="text-xs text-gray-500">{user.email}</p>
            <div className="inline-block mt-2 px-2 py-1 bg-purple-600/30 rounded text-xs text-purple-300">
              {user.role === 'admin' ? '👑 Admin' : '👤 User'}
            </div>
          </div>
        )}

        {/* Menu */}
        <nav className="p-4 space-y-2 flex-1">
          {menuItems.map(item => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-purple-600/20 transition text-gray-300 hover:text-white"
            >
              <span className="text-xl">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-purple-500/20 space-y-2">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600/20 hover:bg-red-600/30 text-red-400 transition"
          >
            <LogOut size={20} />
            Logout
          </button>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          className="fixed inset-0 bg-black/50 md:hidden z-30"
        />
      )}
    </>
  );
}
