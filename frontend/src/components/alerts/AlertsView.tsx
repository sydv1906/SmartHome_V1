'use client';

import React, { useState, useEffect } from 'react';
import { BellRing, ShieldAlert, AlertTriangle, CheckCheck, Trash2, Info, Flame, ZapOff } from 'lucide-react';
import { fetchApi } from '@/services/api';

export const AlertsView: React.FC = () => {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const res = await fetchApi('/notifications');
      if (res.success) {
        setNotifications(res.notifications || []);
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await fetchApi('/notifications/all/read', { method: 'PUT' });
      loadNotifications();
    } catch (_) {}
  };

  const handleClearAll = async () => {
    try {
      await fetchApi('/notifications', { method: 'DELETE' });
      loadNotifications();
    } catch (_) {}
  };

  const getAlertIcon = (type: string, severity: string) => {
    if (type === 'Fire Risk') return <Flame className="w-5 h-5 text-rose-500" />;
    if (type === 'High Voltage' || type === 'High Current') return <ZapOff className="w-5 h-5 text-amber-400" />;
    if (severity === 'critical' || severity === 'danger') return <ShieldAlert className="w-5 h-5 text-rose-400" />;
    return <Info className="w-5 h-5 text-cyan-400" />;
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between glass-panel p-4 rounded-2xl border border-gray-800">
        <div>
          <h2 className="text-base font-bold text-white flex items-center space-x-2">
            <BellRing className="w-5 h-5 text-neonCyan" />
            <span>Hardware Alerts & System Logs</span>
          </h2>
          <p className="text-xs text-gray-400">Real-time log stream of IoT safety events and relay cutoffs</p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleMarkAllRead}
            className="flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-gray-900 hover:bg-gray-800 text-gray-300 text-xs font-semibold border border-gray-800"
          >
            <CheckCheck className="w-4 h-4 text-cyan-400" />
            <span>Mark All Read</span>
          </button>
          <button
            onClick={handleClearAll}
            className="flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 text-xs font-semibold border border-rose-900/40"
          >
            <Trash2 className="w-4 h-4 text-rose-400" />
            <span>Clear Logs</span>
          </button>
        </div>
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {notifications.map((n) => (
          <div
            key={n._id}
            className={`glass-panel p-4 rounded-xl border transition-all ${
              !n.read ? 'border-cyan-500/40 bg-gray-900/90' : 'border-gray-800 bg-darkCard/60'
            }`}
          >
            <div className="flex items-start space-x-3">
              <div className="p-2 rounded-xl bg-gray-900 border border-gray-800 shrink-0">
                {getAlertIcon(n.type, n.severity)}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-white">{n.title}</h4>
                  <span className="text-[10px] text-gray-500 font-mono">
                    {new Date(n.createdAt).toLocaleTimeString()}
                  </span>
                </div>
                <p className="text-xs text-gray-300 mt-1">{n.message}</p>
                <div className="flex items-center space-x-3 mt-2 text-[10px]">
                  <span className="px-2 py-0.5 rounded bg-gray-800 text-gray-400 border border-gray-700 font-mono">
                    Type: {n.type}
                  </span>
                  <span className="text-emerald-400">Channels: Email (Sent) • Push (Sent)</span>
                </div>
              </div>
            </div>
          </div>
        ))}

        {notifications.length === 0 && (
          <div className="glass-panel p-8 rounded-2xl text-center border border-gray-800">
            <CheckCheck className="w-10 h-10 mx-auto text-emerald-400 mb-2" />
            <p className="text-sm font-bold text-white">All Systems Nominal</p>
            <p className="text-xs text-gray-400">No hardware safety alerts or relay cutoffs logged.</p>
          </div>
        )}
      </div>
    </div>
  );
};
