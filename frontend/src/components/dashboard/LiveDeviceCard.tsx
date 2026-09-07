'use client';

import React, { useState } from 'react';
import {
  Power,
  Zap,
  Activity,
  Gauge,
  Thermometer,
  Calendar,
  Settings,
  Trash2,
  Edit2,
  Wifi,
  Fan,
  Tv,
  Lightbulb,
  AirVent,
  Flame,
  Plug,
  Laptop,
  Printer,
  Router,
  Droplets,
} from 'lucide-react';
import { IDevice } from '@smarthome/shared';
import { motion } from 'framer-motion';

const iconMap: Record<string, any> = {
  Fan,
  Light: Lightbulb,
  Socket: Plug,
  TV: Tv,
  'Air Conditioner': AirVent,
  Cooler: AirVent,
  Heater: Flame,
  Motor: Zap,
  Computer: Laptop,
  Printer,
  Router,
  Pump: Droplets,
  'Custom Device': Zap,
};

interface LiveDeviceCardProps {
  device: IDevice;
  onToggleRelay: (deviceId: string, currentState: boolean) => void;
  onOpenSchedule: (device: IDevice) => void;
  onEditDevice: (device: IDevice) => void;
  onDeleteDevice: (deviceId: string) => void;
}

export const LiveDeviceCard: React.FC<LiveDeviceCardProps> = ({
  device,
  onToggleRelay,
  onOpenSchedule,
  onEditDevice,
  onDeleteDevice,
}) => {
  const [toggling, setToggling] = useState<boolean>(false);
  const DeviceIcon = iconMap[device.type] || Zap;
  const roomName = (device.roomId as any)?.name || 'Living Room';

  const handleToggle = async () => {
    setToggling(true);
    await onToggleRelay(device._id, device.relayState);
    setToggling(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -3 }}
      transition={{ duration: 0.2 }}
      className={`relative glass-panel p-4 rounded-2xl border transition-all duration-300 ${
        device.relayState
          ? 'border-cyan-500/50 shadow-glowCyan bg-gradient-to-b from-gray-900/90 via-darkCard to-blue-950/30'
          : 'border-gray-800/80 hover:border-gray-700 bg-darkCard/80'
      }`}
    >
      {/* Top Bar: Icon, Name, Room, Status */}
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-3">
          <div
            className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all ${
              device.relayState
                ? 'bg-cyan-500/20 text-neonCyan border border-cyan-500/40 shadow-glowCyan animate-pulseFast'
                : 'bg-gray-800/60 text-gray-400 border border-gray-700'
            }`}
          >
            <DeviceIcon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight leading-snug">{device.name}</h3>
            <div className="flex items-center space-x-2 mt-0.5">
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-800 text-gray-300 font-medium border border-gray-700">
                {roomName}
              </span>
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${
                  device.onlineStatus
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                    : 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                }`}
              >
                {device.onlineStatus ? 'Online' : 'Offline'}
              </span>
            </div>
          </div>
        </div>

        {/* Relay ON/OFF Toggle Button */}
        <button
          onClick={handleToggle}
          disabled={toggling}
          className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 ${
            device.relayState
              ? 'bg-gradient-to-tr from-cyan-500 to-blue-600 text-white shadow-glowCyan scale-105'
              : 'bg-gray-800 hover:bg-gray-700 text-gray-400 border border-gray-700'
          }`}
          title={device.relayState ? 'Turn Relay OFF' : 'Turn Relay ON'}
        >
          <Power className={`w-5 h-5 ${toggling ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Telemetry Metrics Grid */}
      <div className="grid grid-cols-4 gap-2 mt-4 p-2.5 rounded-xl bg-gray-950/60 border border-gray-800/80 text-center">
        <div>
          <span className="text-[9px] font-medium text-gray-400 block uppercase">Power</span>
          <span className={`text-xs font-bold ${device.relayState ? 'text-neonCyan' : 'text-gray-400'}`}>
            {device.relayState ? `${device.powerW}W` : '0W'}
          </span>
        </div>
        <div>
          <span className="text-[9px] font-medium text-gray-400 block uppercase">Voltage</span>
          <span className="text-xs font-bold text-blue-300">{device.voltageV}V</span>
        </div>
        <div>
          <span className="text-[9px] font-medium text-gray-400 block uppercase">Current</span>
          <span className="text-xs font-bold text-indigo-300">
            {device.relayState ? `${device.currentA}A` : '0A'}
          </span>
        </div>
        <div>
          <span className="text-[9px] font-medium text-gray-400 block uppercase">Energy</span>
          <span className="text-xs font-bold text-emerald-300">{device.energyKWh}kWh</span>
        </div>
      </div>

      {/* Extra Info: Temp & Signal RSSI */}
      <div className="flex items-center justify-between text-[10px] text-gray-400 mt-3 pt-2.5 border-t border-gray-800/60">
        <div className="flex items-center space-x-3">
          {device.temperatureC && (
            <span className="flex items-center space-x-1 text-amber-300">
              <Thermometer className="w-3 h-3 text-amber-400" />
              <span>{device.temperatureC}°C</span>
            </span>
          )}
          <span className="flex items-center space-x-1">
            <Wifi className="w-3 h-3 text-gray-500" />
            <span>{device.signalStrengthRssi || -65} dBm</span>
          </span>
        </div>

        {/* Relay Pin Number Badge */}
        <span className="font-mono text-[9px] text-cyan-400/80 bg-cyan-950/50 px-1.5 py-0.5 rounded border border-cyan-800/50">
          Relay #{device.relayNumber || 1}
        </span>
      </div>

      {/* Quick Action Buttons */}
      <div className="grid grid-cols-4 gap-1.5 mt-3 pt-2 border-t border-gray-800/40">
        <button
          onClick={() => onOpenSchedule(device)}
          className="flex items-center justify-center space-x-1 py-1 px-2 rounded-lg bg-gray-900/60 hover:bg-gray-800 text-gray-300 text-[10px] font-medium border border-gray-800 transition-colors"
        >
          <Calendar className="w-3 h-3 text-cyan-400" />
          <span>Schedule</span>
        </button>
        <button
          onClick={() => onEditDevice(device)}
          className="flex items-center justify-center space-x-1 py-1 px-2 rounded-lg bg-gray-900/60 hover:bg-gray-800 text-gray-300 text-[10px] font-medium border border-gray-800 transition-colors"
        >
          <Edit2 className="w-3 h-3 text-amber-400" />
          <span>Rename</span>
        </button>
        <button
          onClick={() => onEditDevice(device)}
          className="flex items-center justify-center space-x-1 py-1 px-2 rounded-lg bg-gray-900/60 hover:bg-gray-800 text-gray-300 text-[10px] font-medium border border-gray-800 transition-colors"
        >
          <Settings className="w-3 h-3 text-purple-400" />
          <span>Settings</span>
        </button>
        <button
          onClick={() => onDeleteDevice(device._id)}
          className="flex items-center justify-center space-x-1 py-1 px-2 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 text-[10px] font-medium border border-rose-900/40 transition-colors"
        >
          <Trash2 className="w-3 h-3 text-rose-400" />
          <span>Delete</span>
        </button>
      </div>
    </motion.div>
  );
};
