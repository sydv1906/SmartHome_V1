'use client';

import React, { useState, useEffect } from 'react';
import { Mic, MicOff, Volume2, X, Sparkles } from 'lucide-react';
import { fetchApi } from '@/services/api';

interface VoiceControlModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRefreshDevices: () => void;
}

export const VoiceControlModal: React.FC<VoiceControlModalProps> = ({
  isOpen,
  onClose,
  onRefreshDevices,
}) => {
  const [listening, setListening] = useState<boolean>(false);
  const [transcript, setTranscript] = useState<string>('');
  const [responseMsg, setResponseMsg] = useState<string>('Say a command, e.g. "Turn on Living Room Fan" or "Status Report"');

  if (!isOpen) return null;

  const handleSimulateCommand = async (cmd: string) => {
    setTranscript(cmd);
    setListening(true);
    setResponseMsg('Processing voice intent...');

    setTimeout(async () => {
      setListening(false);
      const lower = cmd.toLowerCase();

      if (lower.includes('turn on') || lower.includes('turn off') || lower.includes('toggle')) {
        try {
          const devicesRes = await fetchApi('/devices');
          if (devicesRes.success && devicesRes.devices.length > 0) {
            const dev = devicesRes.devices[0];
            const targetState = lower.includes('turn on');
            await fetchApi(`/devices/${dev._id}/relay`, {
              method: 'PUT',
              body: JSON.stringify({ state: targetState }),
            });
            onRefreshDevices();
            setResponseMsg(`✅ Command Executed: Switched ${dev.name} to ${targetState ? 'ON' : 'OFF'}.`);
          }
        } catch (e) {
          setResponseMsg('⚠️ Error toggling relay via voice command.');
        }
      } else if (lower.includes('status') || lower.includes('report')) {
        setResponseMsg('⚡ System Status Nominal: Total power draw is 540W across 8 online devices.');
      } else {
        setResponseMsg(`🤖 Processed intent: "${cmd}". No matching action rule.`);
      }
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="w-full max-w-md glass-panel-glow rounded-3xl border border-cyan-500/40 p-6 space-y-6 text-center shadow-2xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-neonCyan" />
            <h3 className="text-sm font-bold text-white">SmartHome AI Voice Control</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-gray-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Microphone Pulse Animation */}
        <div className="relative py-4">
          <button
            onClick={() => handleSimulateCommand('Turn on Living Room Fan')}
            className={`w-24 h-24 mx-auto rounded-full flex items-center justify-center transition-all ${
              listening
                ? 'bg-cyan-500 text-darkBg shadow-glowCyan scale-110 animate-pulse'
                : 'bg-gradient-to-tr from-blue-600 to-cyan-500 text-white shadow-glowCyan hover:scale-105'
            }`}
          >
            <Mic className="w-10 h-10" />
          </button>
        </div>

        {/* Live Transcript & Feedback */}
        <div className="space-y-2 p-3 rounded-xl bg-gray-900/80 border border-gray-800">
          <p className="text-xs font-mono text-cyan-300">
            {transcript ? `"${transcript}"` : 'Listening for wake phrase...'}
          </p>
          <p className="text-xs text-gray-300 font-medium">{responseMsg}</p>
        </div>

        {/* Preset Example Voice Commands */}
        <div className="space-y-1.5 text-left">
          <p className="text-[10px] text-gray-400 uppercase font-semibold">Preset Voice Commands (Click to Test):</p>
          <div className="flex flex-wrap gap-2">
            {[
              'Turn on Living Room Fan',
              'Turn off Master Bedroom AC',
              'System Status Report',
              'Activate Night Mode',
            ].map((c) => (
              <button
                key={c}
                onClick={() => handleSimulateCommand(c)}
                className="px-2.5 py-1 rounded-lg bg-gray-800 hover:bg-gray-700 text-cyan-300 text-[11px] font-medium border border-gray-700"
              >
                "{c}"
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
