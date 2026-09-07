'use client';

import React, { useState, useEffect } from 'react';
import { Settings, User, DollarSign, Key, Sun, Moon, ShieldCheck, Database, Wifi } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { fetchApi } from '@/services/api';

export const SettingsView: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const { theme, setTheme } = useTheme();
  const [name, setName] = useState<string>(user?.name || '');
  const [phone, setPhone] = useState<string>(user?.phone || '');
  const [address, setAddress] = useState<string>(user?.homeAddress || '');
  const [tariff, setTariff] = useState<number>(0.15);
  const [currency, setCurrency] = useState<string>('$');
  const [apiTokens, setApiTokens] = useState<any[]>([]);
  const [saving, setSaving] = useState<boolean>(false);
  const [generatedKey, setGeneratedKey] = useState<string>('');

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const res = await fetchApi('/settings');
        if (res.success) {
          setTariff(res.homeSettings?.tariffPerKWh || 0.15);
          setCurrency(res.homeSettings?.currency || '$');
          if (res.user?.apiTokens) setApiTokens(res.user.apiTokens);
        }
      } catch (_) {}
    };
    loadSettings();
  }, []);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await fetchApi('/settings/user', {
        method: 'PUT',
        body: JSON.stringify({ name, phone, homeAddress: address }),
      });
      await fetchApi('/settings/tariff', {
        method: 'PUT',
        body: JSON.stringify({ tariffPerKWh: tariff, currency }),
      });
      refreshUser();
      alert('Settings saved successfully!');
    } catch (err: any) {
      alert(`Error saving settings: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleGenerateKey = async () => {
    try {
      const res = await fetchApi('/settings/api-token', {
        method: 'POST',
        body: JSON.stringify({ tokenName: 'Third-Party Integration Key' }),
      });
      if (res.success) {
        setGeneratedKey(res.token);
        setApiTokens(res.apiTokens);
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Theme Appearance Mode Card */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-200 dark:border-gray-800 space-y-4">
        <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center space-x-2">
          <Sun className="w-5 h-5 text-amber-500" />
          <span>App Appearance & Theme Mode</span>
        </h3>

        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => setTheme('dark')}
            className={`p-4 rounded-2xl border text-left flex items-center justify-between transition-all ${
              theme === 'dark'
                ? 'border-cyan-400 bg-cyan-500/20 text-white shadow-glowCyan'
                : 'border-gray-800 bg-gray-900/60 text-gray-400 hover:border-gray-700'
            }`}
          >
            <div className="flex items-center space-x-3">
              <Moon className="w-5 h-5 text-indigo-400" />
              <div>
                <p className="text-sm font-bold text-white">Tesla Dark Mode</p>
                <p className="text-[11px] text-gray-400">Deep carbon glassmorphism theme</p>
              </div>
            </div>
            {theme === 'dark' && <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-glowCyan" />}
          </button>

          <button
            onClick={() => setTheme('light')}
            className={`p-4 rounded-2xl border text-left flex items-center justify-between transition-all ${
              theme === 'light'
                ? 'border-cyan-500 bg-cyan-50 text-slate-900 shadow-lg'
                : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center space-x-3">
              <Sun className="w-5 h-5 text-amber-500" />
              <div>
                <p className="text-sm font-bold text-slate-900">Clean Light Mode</p>
                <p className="text-[11px] text-slate-500">High contrast daylight theme</p>
              </div>
            </div>
            {theme === 'light' && <span className="w-2.5 h-2.5 rounded-full bg-cyan-500" />}
          </button>
        </div>
      </div>

      {/* Profile & Home Address Settings */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-200 dark:border-gray-800 space-y-4">
        <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center space-x-2">
          <User className="w-5 h-5 text-cyan-500 dark:text-neonCyan" />
          <span>Profile & Home Preferences</span>
        </h3>

        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-slate-500 dark:text-gray-400 block mb-1">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-gray-900 border border-slate-200 dark:border-gray-700 text-xs text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="text-xs text-slate-500 dark:text-gray-400 block mb-1">Phone Number</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-gray-900 border border-slate-200 dark:border-gray-700 text-xs text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-slate-500 dark:text-gray-400 block mb-1">Home Address</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-gray-900 border border-slate-200 dark:border-gray-700 text-xs text-slate-900 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="text-xs text-slate-500 dark:text-gray-400 block mb-1">Electricity Tariff Rate ($ / kWh)</label>
              <input
                type="number"
                step="0.01"
                value={tariff}
                onChange={(e) => setTariff(Number(e.target.value))}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-gray-900 border border-slate-200 dark:border-gray-700 text-xs text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="text-xs text-slate-500 dark:text-gray-400 block mb-1">Currency Symbol</label>
              <input
                type="text"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-gray-900 border border-slate-200 dark:border-gray-700 text-xs text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:opacity-90 text-white text-xs font-bold shadow-glowCyan"
          >
            {saving ? 'Saving...' : 'Save Preferences'}
          </button>
        </form>
      </div>

      {/* API Key Generation */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-200 dark:border-gray-800 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center space-x-2">
            <Key className="w-5 h-5 text-amber-500" />
            <span>Developer API Keys</span>
          </h3>
          <button
            onClick={handleGenerateKey}
            className="px-4 py-2 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-300 border border-amber-500/40 text-xs font-bold"
          >
            + Generate API Token
          </button>
        </div>

        {generatedKey && (
          <div className="p-3 rounded-xl bg-slate-100 dark:bg-gray-900 border border-amber-500/50">
            <p className="text-[10px] text-amber-600 dark:text-amber-300 font-semibold mb-1">New API Token (Save Now!):</p>
            <p className="text-xs font-mono text-cyan-600 dark:text-cyan-300 select-all">{generatedKey}</p>
          </div>
        )}

        <div className="space-y-2">
          {apiTokens.map((t, idx) => (
            <div key={idx} className="p-3 rounded-xl bg-slate-100 dark:bg-gray-900/60 border border-slate-200 dark:border-gray-800 flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-900 dark:text-white">{t.name}</span>
              <span className="font-mono text-slate-500 dark:text-gray-400">{t.token.substring(0, 14)}...</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
