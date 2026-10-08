'use client';

import React from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { Sidebar } from '@/lib/components/Sidebar';
import { ProtectedRoute } from '@/lib/components/ProtectedRoute';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute>
      <div className="flex h-screen bg-slate-950">
        <Sidebar />
        <main className="flex-1 overflow-auto md:ml-0">
          <div className="pt-16 md:pt-0">
            {children}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
