'use client';

import React from 'react';
import {
  Zap,
  Activity,
  Gauge,
  Calendar,
  DollarSign,
  Cpu,
  PlayCircle,
  Wifi,
  WifiOff,
  Leaf,
  Compass,
  Radio,
} from 'lucide-react';
import { IDashboardStats } from '@smarthome/shared';

interface TopStatsGridProps {
  stats: IDashboardStats;
}

export const TopStatsGrid: React.FC<TopStatsGridProps> = ({ stats }) => {
  const cards = [
    { title: 'Total Power Draw', value: `${stats.totalPowerW} W`, icon: Zap, color: 'text-neonCyan', border: 'border-cyan-500/30', glow: 'shadow-glowCyan' },
    { title: 'Line Voltage', value: `${stats.voltageV} V`, icon: Activity, color: 'text-blue-400', border: 'border-blue-500/30' },
    { title: 'Total Current', value: `${stats.currentA} A`, icon: Gauge, color: 'text-indigo-400', border: 'border-indigo-500/30' },
    { title: "Today's Energy", value: `${stats.todayEnergyKWh} kWh`, icon: Calendar, color: 'text-neonEmerald', border: 'border-emerald-500/30', glow: 'shadow-glowEmerald' },
    { title: 'Monthly Energy', value: `${stats.monthlyEnergyKWh} kWh`, icon: Calendar, color: 'text-emerald-300', border: 'border-emerald-500/30' },
    { title: 'Estimated Bill', value: `${stats.currency}${stats.estimatedBillCost}`, icon: DollarSign, color: 'text-neonAmber', border: 'border-amber-500/30', glow: 'shadow-glowAmber' },
    { title: 'Connected Devices', value: `${stats.connectedDevicesCount}`, icon: Cpu, color: 'text-purple-400', border: 'border-purple-500/30' },
    { title: 'Running Devices', value: `${stats.runningDevicesCount}`, icon: PlayCircle, color: 'text-cyan-300', border: 'border-cyan-500/30' },
    { title: 'Online Nodes', value: `${stats.onlineDevicesCount}`, icon: Wifi, color: 'text-emerald-400', border: 'border-emerald-500/30' },
    { title: 'Offline Nodes', value: `${stats.offlineDevicesCount}`, icon: WifiOff, color: 'text-rose-400', border: 'border-rose-500/30' },
    { title: "Today's Cost", value: `${stats.currency}${stats.todayCost}`, icon: DollarSign, color: 'text-amber-300', border: 'border-amber-500/30' },
    { title: 'Carbon Saved', value: `${stats.carbonSavedKg} kg`, icon: Leaf, color: 'text-neonEmerald', border: 'border-emerald-500/30' },
    { title: 'Power Factor', value: `${stats.powerFactor} PF`, icon: Compass, color: 'text-cyan-400', border: 'border-cyan-500/30' },
    { title: 'Grid Frequency', value: `${stats.frequencyHz} Hz`, icon: Radio, color: 'text-indigo-300', border: 'border-indigo-500/30' },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <div
            key={idx}
            className={`glass-panel p-3.5 rounded-xl border ${card.border} hover:bg-gray-800/80 transition-all duration-300 flex flex-col justify-between space-y-2 ${
              card.glow || ''
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-gray-400 truncate">{card.title}</span>
              <Icon className={`w-4 h-4 ${card.color}`} />
            </div>
            <div>
              <p className={`text-base font-bold tracking-tight ${card.color}`}>{card.value}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
};
