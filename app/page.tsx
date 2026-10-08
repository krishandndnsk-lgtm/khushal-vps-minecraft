'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function Home() {
  const router = useRouter();
  const [isChecking, setIsChecking] = React.useState(true);
  const [isAuthenticated, setIsAuthenticated] = React.useState(false);

  useEffect(() => {
    // Check if user is authenticated
    const token = localStorage.getItem('token');
    if (token) {
      setIsAuthenticated(true);
    }
    setIsChecking(false);
  }, []);

  if (isChecking) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-900 to-slate-950">
        {/* Header */}
        <header className="border-b border-purple-500/20 glass">
          <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
            <div className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
              🎮 KHUSHAL VPS
            </div>
            <nav className="flex gap-4">
              <Link
                href="/dashboard"
                className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 transition"
              >
                Dashboard
              </Link>
              <button
                onClick={() => {
                  localStorage.removeItem('token');
                  router.push('/auth/login');
                }}
                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 transition"
              >
                Logout
              </button>
            </nav>
          </div>
        </header>

        {/* Redirect to dashboard */}
        <div className="flex items-center justify-center h-[calc(100vh-100px)]">
          <div className="text-center">
            <p className="text-gray-400 mb-4">Redirecting to dashboard...</p>
            <button
              onClick={() => router.push('/dashboard')}
              className="px-6 py-3 rounded-lg bg-purple-600 hover:bg-purple-700 transition"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-900 to-slate-950 flex flex-col items-center justify-center px-4">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
        <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-cyan-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse delay-2000"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 text-center max-w-2xl">
        <h1 className="text-5xl md:text-7xl font-bold mb-4 bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">
          🎮 KHUSHAL VPS
        </h1>
        <p className="text-2xl md:text-3xl text-gray-300 mb-2">Power Your Minecraft</p>
        <p className="text-xl text-gray-400 mb-8">Your Way.</p>
        <p className="text-gray-400 mb-8 text-lg leading-relaxed">
          Enterprise-grade Minecraft VPS hosting control panel. 32 GB dedicated server.
          Real-time monitoring, automatic backups, player management, and complete server lifecycle control.
        </p>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-4 mb-12 text-left">
          <div className="glass rounded-lg p-6 glow-primary">
            <h3 className="text-lg font-bold text-purple-400 mb-2">⚡ Real-time Control</h3>
            <p className="text-gray-400">Start, stop, restart Minecraft servers instantly with live console access.</p>
          </div>
          <div className="glass rounded-lg p-6 glow-secondary">
            <h3 className="text-lg font-bold text-cyan-400 mb-2">📊 Live Monitoring</h3>
            <p className="text-gray-400">CPU, RAM, Disk, and Network metrics on beautiful interactive dashboards.</p>
          </div>
          <div className="glass rounded-lg p-6 glow-primary">
            <h3 className="text-lg font-bold text-purple-400 mb-2">💾 Smart Backups</h3>
            <p className="text-gray-400">Automatic and manual backups with one-click restore functionality.</p>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/auth/login"
            className="px-8 py-4 rounded-lg bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 font-bold text-lg transition glow-primary"
          >
            Login
          </Link>
          <Link
            href="/auth/register"
            className="px-8 py-4 rounded-lg bg-gradient-to-r from-cyan-600 to-cyan-700 hover:from-cyan-700 hover:to-cyan-800 font-bold text-lg transition glow-secondary"
          >
            Register
          </Link>
        </div>
      </div>
    </div>
  );
}
