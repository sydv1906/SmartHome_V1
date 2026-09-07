'use client';

import React from 'react';
import {
  LayoutDashboard,
  Home,
  Cpu,
  BarChart3,
  Sliders,
  BellRing,
  Sparkles,
  Settings,
  ShieldCheck,
  PlusCircle,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export type TabType =
  | 'dashboard'
  | 'rooms'
  | 'devices'
  | 'analytics'
  | 'automations'
  | 'alerts'
  | 'ai'
  | 'settings'
  | 'admin';

interface SidebarProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  onOpenOnboarding: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, onOpenOnboarding }) => {
  const { user } = useAuth();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'rooms', label: 'Room Manager', icon: Home },
    { id: 'devices', label: 'IoT Devices', icon: Cpu },
    { id: 'analytics', label: 'Energy Analytics', icon: BarChart3 },
    { id: 'automations', label: 'Smart Rules', icon: Sliders },
    { id: 'alerts', label: 'Alerts & Logs', icon: BellRing },
    { id: 'ai', label: 'AI Energy Insights', icon: Sparkles, badge: 'AI' },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  if (user?.role === 'Admin') {
    navItems.push({ id: 'admin', label: 'Admin Control', icon: ShieldCheck, badge: 'Admin' });
  }

  return (
    <aside className="w-64 glass-panel border-r border-gray-800/60 hidden md:flex flex-col justify-between p-4 space-y-6 shrink-0 h-[calc(100vh-61px)] sticky top-[61px]">
      <div className="space-y-4">
        {/* Quick Pair CTA */}
        <button
          onClick={onOpenOnboarding}
          className="w-full flex items-center justify-center space-x-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 via-cyan-500 to-emerald-500 hover:opacity-90 text-white text-xs font-semibold shadow-glowCyan transition-all"
        >
          <PlusCircle className="w-4 h-4 text-white" />
          <span>Onboard New ESP32</span>
        </button>

        {/* Navigation List */}
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as TabType)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-blue-600/30 to-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-glowCyan'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/60'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-neonCyan' : 'text-gray-400'}`} />
                  <span>{item.label}</span>
                </div>

                {item.badge && (
                  <span
                    className={`px-1.5 py-0.5 text-[9px] font-bold uppercase rounded ${
                      item.badge === 'AI'
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                        : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer System Status Card */}
      <div className="p-3 rounded-xl bg-gray-900/60 border border-gray-800 space-y-2">
        <div className="flex items-center justify-between text-[11px] text-gray-400 font-medium">
          <span>HiveMQ Broker</span>
          <span className="text-emerald-400 flex items-center space-x-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping inline-block" />
            <span>Connected</span>
          </span>
        </div>
        <div className="flex items-center justify-between text-[11px] text-gray-400 font-medium">
          <span>Active Tariff Rate</span>
          <span className="text-cyan-300">$0.15 / kWh</span>
        </div>
      </div>
    </aside>
  );
};
