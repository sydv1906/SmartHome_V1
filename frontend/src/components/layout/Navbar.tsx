'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Zap,
  Clock,
  Bell,
  Mic,
  Sun,
  Moon,
  LogOut,
  ChevronDown,
  Menu,
  X,
  MapPin,
  LayoutDashboard,
  Home as HomeIcon,
  Cpu,
  BarChart3,
  Sliders,
  BellRing,
  Sparkles,
  Settings,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useSocket } from '@/context/SocketContext';
import { useTheme } from '@/context/ThemeContext';
import { TabType } from './Sidebar';

interface NavbarProps {
  onOpenVoice: () => void;
  onOpenOnboarding: () => void;
  unreadAlertCount: number;
  onOpenAlerts: () => void;
  activeTab?: TabType;
  setActiveTab?: (tab: TabType) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenVoice,
  onOpenOnboarding,
  unreadAlertCount,
  onOpenAlerts,
  activeTab = 'dashboard',
  setActiveTab,
}) => {
  const { user, logout } = useAuth();
  const { connected } = useSocket();
  const { theme, toggleTheme } = useTheme();
  const [time, setTime] = useState<string>('');
  const [date, setDate] = useState<string>('');
  const [location, setLocation] = useState<string>('India');
  const [showProfileMenu, setShowProfileMenu] = useState<boolean>(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setTime(
        now.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        })
      );
      setDate(
        now.toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
        })
      );
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${coords.latitude}&lon=${coords.longitude}&zoom=10`,
            { headers: { Accept: 'application/json' } }
          );
          if (!response.ok) return;

          const data = await response.json();
          const address = data.address || {};
          const locality = address.city || address.town || address.village || address.county;
          if (locality) setLocation(locality);
        } catch {
          // Keep the country fallback when reverse geocoding is unavailable.
        }
      },
      () => {
        // Keep the country fallback when location permission is denied.
      },
      { enableHighAccuracy: false, maximumAge: 300000, timeout: 10000 }
    );
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'rooms', label: 'Room Manager', icon: HomeIcon },
    { id: 'devices', label: 'IoT Devices', icon: Cpu },
    { id: 'analytics', label: 'Energy Analytics', icon: BarChart3 },
    { id: 'automations', label: 'Smart Rules', icon: Sliders },
    { id: 'alerts', label: 'Alerts & Logs', icon: BellRing },
    { id: 'ai', label: 'AI Energy Insights', icon: Sparkles },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  if (user?.role === 'Admin') {
    navItems.push({ id: 'admin', label: 'Admin Control', icon: ShieldCheck });
  }

  return (
    <header className="sticky top-0 z-50 isolate w-full glass-panel border-b border-gray-200 dark:border-gray-800/60 px-3 sm:px-4 lg:px-6 py-3 flex items-center justify-between gap-2">
      {/* Brand & Mobile Menu Toggle */}
      <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 rounded-xl md:hidden text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
          aria-label="Toggle Navigation Menu"
          aria-expanded={mobileMenuOpen}
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>

        <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-cyan-500 to-emerald-400 p-[1px] shadow-glowCyan">
          <div className="w-full h-full bg-slate-900 dark:bg-darkBg rounded-[11px] flex items-center justify-center">
            <Zap className="w-5 h-5 text-neonCyan animate-pulse" />
          </div>
        </div>
        <div>
          <div className="flex items-center space-x-2 min-w-0">
            <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-transparent dark:bg-clip-text dark:bg-gradient-to-r dark:from-white dark:via-cyan-200 dark:to-blue-400 truncate">
              SmartHome AI
            </h1>
            <span className="px-2 py-0.5 text-[10px] font-semibold tracking-wider uppercase rounded-full bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-cyan-300 border border-blue-500/30">
              Pro v2.4
            </span>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 font-medium hidden sm:block">
            Intelligent Energy Monitoring
          </p>
        </div>
      </div>

      {/* Center Widgets: Real-Time Clock & Weather */}
      <div className="hidden md:flex items-center space-x-4 lg:space-x-6">
        {/* Real-time Clock */}
        <div className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-gray-900/60 border border-slate-200 dark:border-gray-800 text-xs font-mono text-cyan-700 dark:text-cyan-300">
          <Clock className="w-4 h-4 text-cyan-500 dark:text-cyan-400" />
          <div>
            <span className="font-semibold text-sm">{time}</span>
            <span className="ml-2 text-gray-500 dark:text-gray-400 text-[11px]">{date}</span>
          </div>
        </div>

        {/* Live Location Widget */}
        <div className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-gray-900/60 border border-slate-200 dark:border-gray-800 text-xs text-slate-700 dark:text-gray-300">
          <MapPin className="w-4 h-4 text-rose-500 dark:text-rose-400" />
          <div>
            <div className="flex items-center space-x-1 font-medium">
              <span>{location}</span>
            </div>
            <span className="text-[10px] text-gray-500 dark:text-gray-400">Current location</span>
          </div>
        </div>

        {/* WebSocket Real-time Status Indicator */}
        <div className="flex items-center space-x-2 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-gray-900/80 border border-slate-200 dark:border-gray-800 text-xs">
          <span
            className={`w-2 h-2 rounded-full ${
              connected ? 'bg-emerald-500 dark:bg-emerald-400 animate-ping' : 'bg-rose-500'
            }`}
          />
          <span className={`text-[11px] font-medium ${connected ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'}`}>
            {connected ? 'MQTT Live Stream' : 'Disconnected'}
          </span>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center space-x-1.5 sm:space-x-3 shrink-0">
        {/* Light / Dark Mode Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-xl bg-slate-100 dark:bg-gray-900/80 hover:bg-slate-200 dark:hover:bg-gray-800 border border-slate-200 dark:border-gray-800 text-slate-700 dark:text-gray-300 transition-all"
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {theme === 'dark' ? (
            <Sun className="w-4 h-4 text-amber-400 animate-spin-slow" />
          ) : (
            <Moon className="w-4 h-4 text-indigo-600" />
          )}
        </button>

        {/* Voice Control Button */}
        <button
          onClick={onOpenVoice}
          className="hidden sm:flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-cyan-500/10 dark:bg-gradient-to-r dark:from-blue-600/30 dark:to-cyan-500/30 hover:bg-cyan-500/20 border border-cyan-500/40 text-cyan-600 dark:text-cyan-300 text-xs font-medium transition-all shadow-glowCyan"
        >
          <Mic className="w-3.5 h-3.5 text-cyan-500 dark:text-neonCyan animate-bounce" />
          <span className="hidden sm:inline">Voice Assistant</span>
        </button>

        {/* Add Device Onboarding Wizard Button */}
        <button
          onClick={onOpenOnboarding}
          className="hidden sm:block px-3 py-1.5 rounded-xl bg-emerald-500/15 dark:bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-700 dark:text-emerald-300 text-xs font-semibold transition-all"
        >
          + Pair Device
        </button>

        {/* Alerts Bell Button */}
        <button
          onClick={onOpenAlerts}
          className="relative p-2 rounded-xl bg-slate-100 dark:bg-gray-900/80 hover:bg-slate-200 dark:hover:bg-gray-800 border border-slate-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 transition-all"
        >
          <Bell className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
          {unreadAlertCount > 0 && (
            <span className="absolute -top-1 -right-1 px-1.5 py-0.5 text-[10px] font-bold bg-rose-500 text-white rounded-full animate-pulse">
              {unreadAlertCount}
            </span>
          )}
        </button>

        {/* User Profile Menu */}
        <div className="relative">
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center space-x-2 p-1.5 rounded-xl bg-slate-100 dark:bg-gray-900/80 hover:bg-slate-200 dark:hover:bg-gray-800 border border-slate-200 dark:border-gray-800 transition-all"
          >
            <img
              src={user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
              alt={user?.name || 'User Avatar'}
              className="w-7 h-7 rounded-full object-cover border border-cyan-500/40"
            />
            <div className="hidden lg:block text-left">
              <p className="text-xs font-semibold text-slate-800 dark:text-gray-200">{user?.name || 'Alex Rivera'}</p>
              <p className="text-[10px] text-cyan-600 dark:text-cyan-400 font-mono">{user?.role || 'Owner'}</p>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-48 rounded-2xl glass-panel border border-slate-200 dark:border-gray-800 shadow-2xl py-2 z-50">
              <div className="px-4 py-2 border-b border-slate-200 dark:border-gray-800/80">
                <p className="text-xs font-semibold text-slate-900 dark:text-white">{user?.name || 'Alex Rivera'}</p>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">{user?.email || 'owner@smarthome.ai'}</p>
              </div>
              <button
                onClick={() => {
                  setShowProfileMenu(false);
                  logout();
                }}
                className="w-full flex items-center space-x-2 px-4 py-2 text-xs text-rose-500 hover:bg-rose-500/10 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Nav Drawer */}
      {mobileMenuOpen && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[100] bg-white dark:bg-darkBg backdrop-blur-xl p-3 pt-20 sm:p-4 sm:pt-20 md:hidden flex flex-col justify-between overflow-y-auto space-y-4 shadow-2xl">
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="absolute top-4 right-4 p-2 rounded-xl text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
            aria-label="Close Navigation Menu"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="space-y-2">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-cyan-400 px-2">Navigation Menu</p>
            <button
              onClick={() => {
                onOpenOnboarding();
                setMobileMenuOpen(false);
              }}
              className="w-full flex items-center justify-center space-x-2 px-4 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white text-sm font-semibold shadow-glowCyan"
            >
              <Zap className="w-4 h-4" />
              <span>Pair New Device</span>
            </button>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    if (setActiveTab) setActiveTab(item.id as TabType);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-glowCyan'
                      : 'text-gray-300 hover:bg-gray-800'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${isActive ? 'text-neonCyan' : 'text-gray-400'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          <div className="p-4 rounded-2xl bg-gray-100 dark:bg-gray-900 border border-slate-200 dark:border-gray-800 space-y-2 text-xs">
            <div className="flex justify-between text-gray-400">
              <span>Theme Mode</span>
              <button onClick={toggleTheme} className="text-cyan-300 font-bold uppercase">
                {theme} Mode
              </button>
            </div>
            <div className="flex justify-between text-gray-400">
              <span>MQTT Stream</span>
              <span className="text-emerald-400 font-bold">Connected</span>
            </div>
          </div>
        </div>,
        document.body
      )}
    </header>
  );
};
