'use client';

import React, { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  AreaChart,
  Area,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { Download, FileText, Zap, Leaf, AlertTriangle, Sparkles, Cpu } from 'lucide-react';
import { fetchApi } from '@/services/api';
import { EnergyBillGenerator } from './EnergyBillGenerator';

const COLORS = ['#00F0FF', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#3B82F6', '#6366F1'];

export const EnergyAnalyticsView: React.FC = () => {
  const [range, setRange] = useState<string>('today');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const res = await fetchApi(`/analytics?range=${range}`);
      if (res.success) {
        setData(res.analytics);
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, [range]);

  const handleExportCSV = () => {
    window.open('http://localhost:5000/api/analytics/export', '_blank');
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
      {/* Top Header Controls & Export Buttons */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 glass-panel p-4 rounded-2xl border border-gray-800">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center space-x-2">
            <Zap className="w-5 h-5 text-neonCyan" />
            <span>Energy Analytics</span>
          </h2>
          <p className="text-xs text-gray-400">Metered appliance consumption, live load, and household energy insights</p>
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          {/* Time Range Filter Buttons */}
          <div className="flex items-center space-x-1 p-1 rounded-xl bg-gray-900 border border-gray-800 text-xs">
            {['today', 'yesterday', 'weekly', 'monthly', 'yearly'].map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`px-3 py-1.5 rounded-lg capitalize text-xs font-semibold transition-all ${
                  range === r ? 'bg-cyan-500 text-darkBg shadow-glowCyan' : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                {r}
              </button>
            ))}
          </div>

          <button
            onClick={handleExportCSV}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 text-xs font-semibold"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Export CSV</span>
          </button>
        </div>
      </div>

      <EnergyBillGenerator />

      {/* Summary Highlight Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-panel p-4 rounded-2xl border border-cyan-500/30 shadow-glowCyan">
          <div className="flex items-center justify-between text-xs text-gray-400 font-medium">
            <span>Total Energy Used</span>
            <Zap className="w-4 h-4 text-neonCyan" />
          </div>
          <p className="text-xl font-bold text-neonCyan mt-1">{data?.summary?.totalKWh} kWh</p>
          <span className="text-[10px] text-emerald-400 flex items-center space-x-1 mt-1">
            <span>Measured from connected appliance readings</span>
          </span>
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-amber-500/30">
          <div className="flex items-center justify-between text-xs text-gray-400 font-medium">
            <span>Connected Appliances</span>
            <Cpu className="w-4 h-4 text-neonAmber" />
          </div>
          <p className="text-xl font-bold text-neonAmber mt-1">{data?.summary?.deviceCount ?? 0}</p>
          <span className="text-[10px] text-gray-400 mt-1 block">Appliances in this home</span>
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-rose-500/30">
          <div className="flex items-center justify-between text-xs text-gray-400 font-medium">
            <span>Estimated Energy Wastage</span>
            <AlertTriangle className="w-4 h-4 text-rose-400" />
          </div>
          <p className="text-xl font-bold text-rose-400 mt-1">{data?.summary?.estimatedWastageKWh} kWh</p>
          <span className="text-[10px] text-rose-300/80 mt-1 block">
            Estimated idle-load energy per month
          </span>
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-emerald-500/30">
          <div className="flex items-center justify-between text-xs text-gray-400 font-medium">
            <span>Carbon Emission Offset</span>
            <Leaf className="w-4 h-4 text-neonEmerald" />
          </div>
          <p className="text-xl font-bold text-neonEmerald mt-1">{data?.summary?.carbonEmissionsKg} kg CO₂</p>
          <span className="text-[10px] text-emerald-300 mt-1 block">Equivalent to 4 planted trees</span>
        </div>
      </div>

      {/* Main Charts Row 1: 24H Power Draw Area Chart & Daily Cost Bar Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 24-Hour Real-Time Power Draw (Area Chart) */}
        <div className="glass-panel p-5 rounded-2xl border border-gray-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white">24-Hour Power Draw Profile (Watts)</h3>
            <span className="text-xs text-cyan-400 font-mono">Peak: {data?.summary?.peakUsageTime}</span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data?.hourlyData || []}>
                <defs>
                  <linearGradient id="powerGlow" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00F0FF" stopOpacity={0.5} />
                    <stop offset="95%" stopColor="#00F0FF" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" />
                <XAxis dataKey="hour" stroke="#9CA3AF" tick={{ fontSize: 11 }} />
                <YAxis stroke="#9CA3AF" tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', borderRadius: '12px' }}
                />
                <Area type="monotone" dataKey="powerW" stroke="#00F0FF" strokeWidth={2} fillOpacity={1} fill="url(#powerGlow)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Daily Usage & Cost Bar Chart */}
        <div className="glass-panel p-5 rounded-2xl border border-gray-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white">Weekly Consumption Breakdown (kWh)</h3>
            <span className="text-xs text-emerald-400 font-mono">Avg: 14.8 kWh/day</span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.dailyData || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" />
                <XAxis dataKey="day" stroke="#9CA3AF" tick={{ fontSize: 11 }} />
                <YAxis stroke="#9CA3AF" tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', borderRadius: '12px' }}
                />
                <Bar dataKey="energyKWh" fill="#10B981" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Row 2: Room Pie Chart Breakdown & Top 10 Appliances Table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Room Energy Pie Chart */}
        <div className="glass-panel p-5 rounded-2xl border border-gray-800 space-y-4 lg:col-span-1">
          <h3 className="text-sm font-bold text-white">Energy Share by Room</h3>
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data?.roomBreakdown || []}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="energyKWh"
                >
                  {(data?.roomBreakdown || []).map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', borderRadius: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-1.5">
            {(data?.roomBreakdown || []).map((r: any, idx: number) => (
              <div key={r.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                  <span className="text-gray-300 font-medium">{r.name}</span>
                </div>
                <span className="text-cyan-300 font-bold">{r.percentage}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top 10 Appliances Table */}
        <div className="glass-panel p-5 rounded-2xl border border-gray-800 space-y-4 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white">Top 10 Energy Consuming Appliances</h3>
            <span className="text-xs text-amber-400">Ranked by kWh</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-gray-800 text-gray-400 font-semibold">
                  <th className="py-2.5 px-3">#</th>
                  <th className="py-2.5 px-3">Appliance Name</th>
                  <th className="py-2.5 px-3">Category</th>
                  <th className="py-2.5 px-3">Live Power</th>
                  <th className="py-2.5 px-3">Energy (kWh)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60">
                {(data?.topDevices || []).map((dev: any, idx: number) => (
                  <tr key={dev.id} className="hover:bg-gray-900/60 transition-colors">
                    <td className="py-2.5 px-3 font-bold text-cyan-400">{idx + 1}</td>
                    <td className="py-2.5 px-3 font-semibold text-white">{dev.name}</td>
                    <td className="py-2.5 px-3 text-gray-400">{dev.type}</td>
                    <td className="py-2.5 px-3 font-mono text-cyan-300">{dev.powerW} W</td>
                    <td className="py-2.5 px-3 font-bold text-emerald-300">{dev.energyKWh} kWh</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
