'use client';

import React, { useState, useEffect } from 'react';
import { Sparkles, DollarSign, TrendingDown, ArrowRight, Zap, CheckCircle2 } from 'lucide-react';
import { IAIEnergyRecommendation } from '@smarthome/shared';
import { fetchApi } from '@/services/api';

export const AIRecommendationsPanel: React.FC = () => {
  const [recommendations, setRecommendations] = useState<IAIEnergyRecommendation[]>([]);
  const [totalMonthlySavings, setTotalMonthlySavings] = useState<number>(0);
  const [applied, setApplied] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState<boolean>(true);

  const loadAI = async () => {
    setLoading(true);
    try {
      const res = await fetchApi('/ai/recommendations');
      if (res.success) {
        setRecommendations(res.recommendations || []);
        setTotalMonthlySavings(res.totalPotentialMonthlySavings || 0);
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAI();
  }, []);

  const handleApply = (id: string) => {
    setApplied((prev) => ({ ...prev, [id]: true }));
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="glass-panel-glow p-6 rounded-3xl border border-cyan-500/40 relative overflow-hidden bg-gradient-to-r from-blue-950/60 via-darkCard to-cyan-950/40">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center space-x-2">
              <Sparkles className="w-6 h-6 text-neonCyan animate-spin" />
              <h2 className="text-xl font-bold text-white">SmartHome AI Energy Advisor</h2>
            </div>
            <p className="text-xs text-gray-300 max-w-xl mt-1">
              Autonomous neural analysis of your electrical load profiles, power factor, and local peak utility tariffs.
            </p>
          </div>

          <div className="px-5 py-3 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 text-center shadow-glowCyan">
            <span className="text-[10px] text-cyan-300 font-semibold uppercase block">Potential Monthly Savings</span>
            <span className="text-2xl font-black text-neonCyan">${totalMonthlySavings.toFixed(2)} / mo</span>
          </div>
        </div>
      </div>

      {/* Recommendation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {recommendations.map((rec) => {
          const isDone = applied[rec.id];
          return (
            <div
              key={rec.id}
              className={`glass-panel p-5 rounded-2xl border transition-all ${
                isDone
                  ? 'border-emerald-500/40 bg-emerald-950/20'
                  : 'border-gray-800 hover:border-cyan-500/40 bg-darkCard'
              }`}
            >
              <div className="flex items-start justify-between">
                <span className="px-2.5 py-1 text-[10px] font-bold uppercase rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  {rec.category}
                </span>
                <span className="text-xs font-bold text-neonEmerald flex items-center space-x-1">
                  <TrendingDown className="w-3.5 h-3.5" />
                  <span>Save ${rec.potentialSavingsMonthly}/mo</span>
                </span>
              </div>

              <h3 className="text-sm font-bold text-white mt-3">{rec.title}</h3>
              <p className="text-xs text-gray-300 mt-1.5 leading-relaxed">{rec.description}</p>

              <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-800/80">
                <span className="text-[10px] text-gray-400 font-semibold uppercase">Impact: {rec.impact}</span>
                <button
                  onClick={() => handleApply(rec.id)}
                  disabled={isDone}
                  className={`flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    isDone
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-glowCyan hover:opacity-90'
                  }`}
                >
                  {isDone ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Optimization Active</span>
                    </>
                  ) : (
                    <>
                      <span>Apply Auto-Fix</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
