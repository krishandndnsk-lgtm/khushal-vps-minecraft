'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { LoadingSpinner } from '@/lib/components/LoadingSpinner';
import { Notification } from '@/lib/components/Notification';
import { Server } from '@/lib/types';
import Link from 'next/link';
import { Plus, Zap, Activity } from 'lucide-react';

export default function DashboardPage() {
  const { user } = useAuth();
  const [vpsInfo, setVpsInfo] = useState<any>(null);
  const [metrics, setMetrics] = useState<any>(null);
  const [servers, setServers] = useState<Server[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ type: 'error' | 'success' | 'info'; message: string } | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        // Get VPS Status
        const vpsRes = await fetch('/api/vps/status', {
          headers: { 'Authorization': `Bearer ${token}` },
        });

        if (vpsRes.ok) {
          const vpsData = await vpsRes.json();
          setVpsInfo(vpsData.data.info);
          setMetrics(vpsData.data.metrics);
        } else if (vpsRes.status === 503) {
          setError('VPS connection not configured. Check environment variables.');
        }

        // Get Servers
        const serversRes = await fetch('/api/servers', {
          headers: { 'Authorization': `Bearer ${token}` },
        });

        if (serversRes.ok) {
          const data = await serversRes.json();
          setServers(data.data || []);
        }
      } catch (err) {
        console.error(err);
        setError('Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    loadData();
    const interval = setInterval(loadData, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return <LoadingSpinner text="Loading dashboard..." />;
  }

  return (
    <div className="p-6 md:p-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
            Welcome, {user?.full_name}!
          </h1>
          <p className="text-gray-400 mt-2">Manage your Minecraft servers on KHUSHAL VPS</p>
        </div>
        <Link
          href="/dashboard/servers?action=create"
          className="px-6 py-3 rounded-lg bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 font-bold transition glow-primary flex items-center gap-2"
        >
          <Plus size={20} />
          Create Server
        </Link>
      </div>

      {/* VPS Status */}
      {error ? (
        <div className="glass rounded-lg p-6 border-l-4 border-red-500 bg-red-500/10">
          <p className="text-red-400 font-medium">⚠️ {error}</p>
          <p className="text-gray-400 text-sm mt-2">Configure VPS credentials in .env.local to enable real monitoring</p>
        </div>
      ) : vpsInfo && metrics ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* CPU Card */}
          <div className="glass rounded-lg p-6 glow-primary">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">CPU</p>
                <p className="text-3xl font-bold text-purple-400">{metrics.cpu_percent.toFixed(1)}%</p>
              </div>
              <div className="text-4xl">⚡</div>
            </div>
          </div>

          {/* RAM Card */}
          <div className="glass rounded-lg p-6 glow-secondary">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">RAM</p>
                <p className="text-3xl font-bold text-cyan-400">{metrics.ram_used_gb}/{metrics.ram_total_gb}GB</p>
                <p className="text-xs text-gray-500 mt-1">{((metrics.ram_used_gb / metrics.ram_total_gb) * 100).toFixed(0)}%</p>
              </div>
              <div className="text-4xl">💾</div>
            </div>
          </div>

          {/* Disk Card */}
          <div className="glass rounded-lg p-6 glow-primary">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Disk</p>
                <p className="text-3xl font-bold text-purple-400">{metrics.disk_used_gb}GB</p>
                <p className="text-xs text-gray-500 mt-1">of {metrics.disk_total_gb}GB</p>
              </div>
              <div className="text-4xl">💿</div>
            </div>
          </div>

          {/* Servers Card */}
          <div className="glass rounded-lg p-6 glow-secondary">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Servers</p>
                <p className="text-3xl font-bold text-cyan-400">{servers.length}</p>
                <p className="text-xs text-gray-500 mt-1">Total</p>
              </div>
              <div className="text-4xl">🎮</div>
            </div>
          </div>
        </div>
      ) : null}

      {/* Servers List */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Your Minecraft Servers</h2>
        
        {servers.length === 0 ? (
          <div className="glass rounded-lg p-12 text-center">
            <p className="text-gray-400 mb-4">No servers yet</p>
            <Link
              href="/dashboard/servers?action=create"
              className="inline-block px-6 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 transition"
            >
              Create your first server
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {servers.map(server => (
              <Link
                key={server.id}
                href={`/dashboard/servers/${server.id}`}
                className="glass rounded-lg p-6 hover:bg-purple-600/10 transition group"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-bold text-lg group-hover:text-purple-400 transition">{server.name}</h3>
                    <p className="text-sm text-gray-400">{server.minecraft_version} • {server.software}</p>
                  </div>
                  <div className={`px-2 py-1 rounded text-xs font-medium ${
                    server.status === 'online' ? 'bg-green-500/20 text-green-400' :
                    server.status === 'offline' ? 'bg-red-500/20 text-red-400' :
                    server.status === 'starting' ? 'bg-yellow-500/20 text-yellow-400' :
                    server.status === 'crashed' ? 'bg-red-600/20 text-red-500' :
                    'bg-gray-500/20 text-gray-400'
                  }`}>
                    {server.status.toUpperCase()}
                  </div>
                </div>
                
                <div className="space-y-2 text-sm text-gray-400 mb-4">
                  <div className="flex justify-between">
                    <span>RAM:</span>
                    <span className="text-gray-300">{server.ram_gb}GB</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Players:</span>
                    <span className="text-gray-300">0/{server.max_players}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Port:</span>
                    <span className="text-gray-300">{server.port}</span>
                  </div>
                </div>
                
                <div className="pt-4 border-t border-purple-500/20">
                  <p className="text-xs text-gray-500">Click to manage →</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {notification && (
        <Notification
          type={notification.type}
          message={notification.message}
          onClose={() => setNotification(null)}
        />
      )}
    </div>
  );
}
