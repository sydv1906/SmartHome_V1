'use client';

import React, { useState, useEffect } from 'react';
import { Sliders, Moon, Shield, Clock, Zap, Plus, Trash2, CheckCircle2, ShieldAlert } from 'lucide-react';
import { fetchApi } from '@/services/api';

export const AutomationView: React.FC = () => {
  const [rules, setRules] = useState<any[]>([]);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeMode, setActiveMode] = useState<string>('Normal');
  const [showRuleModal, setShowRuleModal] = useState<boolean>(false);

  // New Rule Form State
  const [ruleName, setRuleName] = useState<string>('High Voltage Auto-Cutoff');
  const [conditionType, setConditionType] = useState<string>('voltage_high');
  const [thresholdValue, setThresholdValue] = useState<number>(250);
  const [actionType, setActionType] = useState<string>('turn_off_relay');

  const loadAutomations = async () => {
    setLoading(true);
    try {
      const res = await fetchApi('/automations');
      if (res.success) {
        setRules(res.rules || []);
        setSchedules(res.schedules || []);
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAutomations();
  }, []);

  const handleModeChange = async (mode: string) => {
    setActiveMode(mode);
    try {
      await fetchApi(`/homes/default_home/mode`, {
        method: 'PUT',
        body: JSON.stringify({ mode }),
      });
    } catch (_) {}
  };

  const handleCreateRule = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetchApi('/automations/rules', {
        method: 'POST',
        body: JSON.stringify({
          name: ruleName,
          condition: {
            type: conditionType,
            thresholdValue,
          },
          action: {
            type: actionType,
          },
        }),
      });
      setShowRuleModal(false);
      loadAutomations();
    } catch (err: any) {
      alert(`Error creating rule: ${err.message}`);
    }
  };

  const handleToggleRule = async (ruleId: string) => {
    try {
      await fetchApi(`/automations/rules/${ruleId}/toggle`, { method: 'PUT' });
      loadAutomations();
    } catch (_) {}
  };

  const handleDeleteRule = async (ruleId: string) => {
    try {
      await fetchApi(`/automations/rules/${ruleId}`, { method: 'DELETE' });
      loadAutomations();
    } catch (_) {}
  };

  const modesList = [
    { name: 'Normal', desc: 'Standard operating mode with default rules', icon: Zap },
    { name: 'Night Mode', desc: 'Powers off ambient lights & reduces HVAC load after 11 PM', icon: Moon },
    { name: 'Vacation Mode', desc: 'Powers off non-essential relays & enables security monitoring', icon: Shield },
    { name: 'Away Mode', desc: 'Auto-cuts appliances when all family members leave home', icon: Clock },
  ];

  return (
    <div className="space-y-6">
      {/* Mode Preset Toggles */}
      <div className="glass-panel p-5 rounded-2xl border border-gray-800 space-y-4">
        <h2 className="text-base font-bold text-white flex items-center space-x-2">
          <Sliders className="w-5 h-5 text-neonCyan" />
          <span>Home Automation Scene Modes</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {modesList.map((m) => {
            const Icon = m.icon;
            const isActive = activeMode === m.name;
            return (
              <button
                key={m.name}
                onClick={() => handleModeChange(m.name)}
                className={`p-4 rounded-2xl border text-left transition-all ${
                  isActive
                    ? 'border-cyan-400 bg-cyan-500/20 text-white shadow-glowCyan scale-105'
                    : 'border-gray-800 bg-gray-900/60 text-gray-400 hover:border-gray-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <Icon className={`w-5 h-5 ${isActive ? 'text-neonCyan' : 'text-gray-400'}`} />
                  {isActive && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                </div>
                <h3 className="text-sm font-bold text-white mt-3">{m.name}</h3>
                <p className="text-[11px] text-gray-400 mt-1">{m.desc}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Smart Safety Rules List Header */}
      <div className="flex items-center justify-between glass-panel p-4 rounded-2xl border border-gray-800">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center space-x-2">
            <ShieldAlert className="w-4 h-4 text-amber-400" />
            <span>Hardware Safety & Threshold Rules</span>
          </h3>
          <p className="text-xs text-gray-400">Automated overvoltage, overcurrent, and maximum runtime protection</p>
        </div>

        <button
          onClick={() => setShowRuleModal(true)}
          className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:opacity-90 text-white text-xs font-bold shadow-glowCyan"
        >
          <Plus className="w-4 h-4" />
          <span>Add Custom Rule</span>
        </button>
      </div>

      {/* Rules Table / Cards */}
      <div className="space-y-3">
        {rules.map((rule) => (
          <div
            key={rule._id}
            className="glass-panel p-4 rounded-xl border border-gray-800 flex items-center justify-between hover:border-cyan-500/40 transition-colors"
          >
            <div className="flex items-center space-x-4">
              <button
                onClick={() => handleToggleRule(rule._id)}
                className={`w-10 h-6 rounded-full transition-colors relative ${
                  rule.enabled ? 'bg-cyan-500' : 'bg-gray-800'
                }`}
              >
                <span
                  className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${
                    rule.enabled ? 'right-1' : 'left-1'
                  }`}
                />
              </button>
              <div>
                <h4 className="text-sm font-bold text-white">{rule.name}</h4>
                <p className="text-xs text-gray-400">
                  Condition: <span className="text-cyan-300 font-mono">{rule.condition.type}</span> &gt;{' '}
                  <span className="text-amber-300 font-bold">{rule.condition.thresholdValue}</span> • Action:{' '}
                  <span className="text-emerald-300">{rule.action.type}</span>
                </p>
              </div>
            </div>

            <button
              onClick={() => handleDeleteRule(rule._id)}
              className="p-2 rounded-lg bg-rose-950/40 text-rose-300 hover:bg-rose-900/60"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      {/* Create Rule Modal */}
      {showRuleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-md glass-panel-glow rounded-3xl border border-cyan-500/30 p-6 space-y-4">
            <h3 className="text-base font-bold text-white">Create Smart Automation Rule</h3>

            <form onSubmit={handleCreateRule} className="space-y-4">
              <div>
                <label className="text-xs text-gray-400 block mb-1">Rule Name</label>
                <input
                  type="text"
                  required
                  value={ruleName}
                  onChange={(e) => setRuleName(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl bg-gray-900 border border-gray-700 text-xs text-white"
                />
              </div>

              <div>
                <label className="text-xs text-gray-400 block mb-1">Condition Trigger</label>
                <select
                  value={conditionType}
                  onChange={(e) => setConditionType(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl bg-gray-900 border border-gray-700 text-xs text-white"
                >
                  <option value="voltage_high">Voltage Exceeds Limit (High Voltage)</option>
                  <option value="current_high">Current Exceeds Limit (Overcurrent)</option>
                  <option value="power_high">Power Exceeds Limit (Overload)</option>
                  <option value="duration_exceeded">Runtime Exceeds Hours</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-gray-400 block mb-1">Threshold Value</label>
                <input
                  type="number"
                  required
                  value={thresholdValue}
                  onChange={(e) => setThresholdValue(Number(e.target.value))}
                  className="w-full px-4 py-2 rounded-xl bg-gray-900 border border-gray-700 text-xs text-white"
                />
              </div>

              <div>
                <label className="text-xs text-gray-400 block mb-1">Safety Action</label>
                <select
                  value={actionType}
                  onChange={(e) => setActionType(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl bg-gray-900 border border-gray-700 text-xs text-white"
                >
                  <option value="turn_off_relay">Turn OFF Relay Immediately</option>
                  <option value="send_alert">Send Alert Notification Only</option>
                </select>
              </div>

              <div className="flex items-center space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRuleModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-gray-800 text-gray-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white text-xs font-bold shadow-glowCyan"
                >
                  Save Rule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
