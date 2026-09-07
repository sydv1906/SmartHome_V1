'use client';

import React, { useState, useEffect } from 'react';
import { ShieldCheck, Users, Cpu, Activity, Server, Trash2, Edit } from 'lucide-react';
import { fetchApi } from '@/services/api';

export const AdminPanel: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const loadAdminData = async () => {
    setLoading(true);
    try {
      const res = await fetchApi('/admin/overview');
      if (res.success) {
        setData(res);
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      await fetchApi(`/admin/users/${userId}/role`, {
        method: 'PUT',
        body: JSON.stringify({ role: newRole }),
      });
      loadAdminData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to remove this user account?')) return;
    try {
      await fetchApi(`/admin/users/${userId}`, { method: 'DELETE' });
      loadAdminData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* System Health Status */}
      <div className="glass-panel p-5 rounded-2xl border border-rose-500/30 space-y-4">
        <h2 className="text-base font-bold text-white flex items-center space-x-2">
          <Server className="w-5 h-5 text-rose-400" />
          <span>System Health & Node Telemetry Inspector</span>
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="p-3 rounded-xl bg-gray-900 border border-gray-800">
            <span className="text-[10px] text-gray-400 block uppercase">Total Users</span>
            <span className="text-lg font-bold text-white">{data?.stats?.totalUsers}</span>
          </div>
          <div className="p-3 rounded-xl bg-gray-900 border border-gray-800">
            <span className="text-[10px] text-gray-400 block uppercase">Total Homes</span>
            <span className="text-lg font-bold text-cyan-300">{data?.stats?.totalHomes}</span>
          </div>
          <div className="p-3 rounded-xl bg-gray-900 border border-gray-800">
            <span className="text-[10px] text-gray-400 block uppercase">Total Devices</span>
            <span className="text-lg font-bold text-purple-300">{data?.stats?.totalDevices}</span>
          </div>
          <div className="p-3 rounded-xl bg-gray-900 border border-gray-800">
            <span className="text-[10px] text-gray-400 block uppercase">Online Nodes</span>
            <span className="text-lg font-bold text-emerald-400">{data?.stats?.onlineDevices}</span>
          </div>
          <div className="p-3 rounded-xl bg-gray-900 border border-gray-800">
            <span className="text-[10px] text-gray-400 block uppercase">CPU Load</span>
            <span className="text-lg font-bold text-amber-300">{data?.systemHealth?.cpuUsage}</span>
          </div>
          <div className="p-3 rounded-xl bg-gray-900 border border-gray-800">
            <span className="text-[10px] text-gray-400 block uppercase">Active Sockets</span>
            <span className="text-lg font-bold text-neonCyan">{data?.systemHealth?.activeSocketsCount}</span>
          </div>
        </div>
      </div>

      {/* User Management Table */}
      <div className="glass-panel p-5 rounded-2xl border border-gray-800 space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center space-x-2">
          <Users className="w-4 h-4 text-cyan-400" />
          <span>User Role & RBAC Access Matrix</span>
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-gray-800 text-gray-400 font-semibold">
                <th className="py-2.5 px-3">User</th>
                <th className="py-2.5 px-3">Email</th>
                <th className="py-2.5 px-3">Role</th>
                <th className="py-2.5 px-3">Joined Date</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/60">
              {(data?.recentUsers || []).map((u: any) => (
                <tr key={u._id} className="hover:bg-gray-900/60 transition-colors">
                  <td className="py-2.5 px-3 font-semibold text-white flex items-center space-x-2">
                    <img src={u.avatar} className="w-6 h-6 rounded-full object-cover" />
                    <span>{u.name}</span>
                  </td>
                  <td className="py-2.5 px-3 text-gray-400">{u.email}</td>
                  <td className="py-2.5 px-3">
                    <select
                      value={u.role}
                      onChange={(e) => handleRoleChange(u._id, e.target.value)}
                      className="px-2 py-1 rounded bg-gray-900 border border-gray-700 text-cyan-300 font-bold"
                    >
                      <option value="Admin">Admin</option>
                      <option value="Owner">Owner</option>
                      <option value="Family Member">Family Member</option>
                      <option value="Guest">Guest</option>
                    </select>
                  </td>
                  <td className="py-2.5 px-3 text-gray-400">{new Date(u.createdAt).toLocaleDateString()}</td>
                  <td className="py-2.5 px-3 text-right">
                    <button
                      onClick={() => handleDeleteUser(u._id)}
                      className="p-1.5 rounded bg-rose-950/40 text-rose-400 hover:bg-rose-900/60"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
