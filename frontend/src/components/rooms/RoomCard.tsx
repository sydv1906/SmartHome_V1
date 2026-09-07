'use client';

import React from 'react';
import { Home, Zap, Activity, Cpu, Trash2, Edit } from 'lucide-react';
import { IRoom } from '@smarthome/shared';
import { motion } from 'framer-motion';

interface RoomCardProps {
  room: IRoom;
  onSelectRoom: (roomId: string) => void;
  onEditRoom: (room: IRoom) => void;
  onDeleteRoom: (roomId: string) => void;
}

export const RoomCard: React.FC<RoomCardProps> = ({
  room,
  onSelectRoom,
  onEditRoom,
  onDeleteRoom,
}) => {
  const statusColors = {
    active: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    idle: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    warning: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    offline: 'bg-gray-800 text-gray-400 border-gray-700',
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ y: -4 }}
      className="group relative rounded-2xl overflow-hidden glass-panel border border-gray-800/80 hover:border-cyan-500/40 transition-all duration-300 shadow-lg"
    >
      {/* Background Image Container */}
      <div className="relative h-44 w-full overflow-hidden">
        <img
          src={room.imageUrl || 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600'}
          alt={room.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-darkBg via-darkBg/60 to-transparent" />

        {/* Room Status Pill */}
        <div className="absolute top-3 right-3 flex items-center space-x-2">
          <span className={`px-2.5 py-1 text-[10px] font-bold uppercase rounded-full border ${statusColors[room.status || 'idle']}`}>
            {room.status || 'idle'}
          </span>
        </div>

        {/* Top Left Title Overlay */}
        <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between">
          <div>
            <h3 className="text-lg font-bold text-white tracking-tight">{room.name}</h3>
            <p className="text-xs text-cyan-300/80 font-medium">{room.type}</p>
          </div>
          <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-gray-900/80 border border-gray-800 text-xs font-semibold text-gray-200">
            <Cpu className="w-3.5 h-3.5 text-cyan-400" />
            <span>{room.deviceCount} Devices</span>
          </div>
        </div>
      </div>

      {/* Room Telemetry Statistics Footer */}
      <div className="p-4 bg-darkCard/90 space-y-3">
        <div className="grid grid-cols-2 gap-3 text-center">
          <div className="p-2 rounded-xl bg-gray-900/60 border border-gray-800">
            <span className="text-[10px] text-gray-400 uppercase font-semibold block">Live Power</span>
            <span className="text-sm font-bold text-neonCyan">{room.totalPowerW || 0} W</span>
          </div>
          <div className="p-2 rounded-xl bg-gray-900/60 border border-gray-800">
            <span className="text-[10px] text-gray-400 uppercase font-semibold block">Total Energy</span>
            <span className="text-sm font-bold text-emerald-300">{room.totalEnergyKWh || 0} kWh</span>
          </div>
        </div>

        {/* Card Controls */}
        <div className="flex items-center justify-between pt-1">
          <button
            onClick={() => onSelectRoom(room._id)}
            className="flex-1 py-1.5 px-3 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-cyan-300 text-xs font-semibold border border-cyan-500/30 text-center mr-2 transition-colors"
          >
            View Room Appliances →
          </button>
          <button
            onClick={() => onEditRoom(room)}
            className="p-1.5 rounded-lg bg-gray-900 text-gray-400 hover:text-white mr-1"
          >
            <Edit className="w-4 h-4 text-amber-400" />
          </button>
          <button
            onClick={() => onDeleteRoom(room._id)}
            className="p-1.5 rounded-lg bg-gray-900 text-gray-400 hover:text-rose-400"
          >
            <Trash2 className="w-4 h-4 text-rose-400" />
          </button>
        </div>
      </div>
    </motion.div>
  );
};
