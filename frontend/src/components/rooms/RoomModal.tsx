'use client';

import React, { useState } from 'react';
import { X, Home } from 'lucide-react';
import { RoomType } from '@smarthome/shared';
import { fetchApi } from '@/services/api';

interface RoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRoomSaved: () => void;
}

export const RoomModal: React.FC<RoomModalProps> = ({ isOpen, onClose, onRoomSaved }) => {
  const [name, setName] = useState<string>('Living Room');
  const [type, setType] = useState<RoomType>('Living Room');
  const [imageUrl, setImageUrl] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await fetchApi('/rooms', {
        method: 'POST',
        body: JSON.stringify({ name, type, imageUrl }),
      });
      onRoomSaved();
      onClose();
    } catch (err: any) {
      alert(`Error creating room: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const roomTypes: RoomType[] = [
    'Living Room',
    'Bedroom',
    'Kitchen',
    'Office',
    'Laboratory',
    'Garage',
    'Hall',
    'Classroom',
    'Hostel',
    'Custom Room',
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="w-full max-w-md glass-panel-glow rounded-3xl border border-cyan-500/30 overflow-hidden shadow-2xl">
        <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between bg-darkCard">
          <h3 className="text-base font-bold text-white flex items-center space-x-2">
            <Home className="w-5 h-5 text-neonCyan" />
            <span>Create New Room</span>
          </h3>
          <button onClick={onClose} className="p-1 rounded-lg text-gray-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="text-xs text-gray-400 block mb-1">Room Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-gray-900 border border-gray-700 text-xs text-white focus:outline-none focus:border-cyan-400"
            />
          </div>

          <div>
            <label className="text-xs text-gray-400 block mb-1">Room Category</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as RoomType)}
              className="w-full px-4 py-2.5 rounded-xl bg-gray-900 border border-gray-700 text-xs text-white focus:outline-none focus:border-cyan-400"
            >
              {roomTypes.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs text-gray-400 block mb-1">Custom Image Cover URL (Optional)</label>
            <input
              type="url"
              placeholder="https://images.unsplash.com/..."
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-gray-900 border border-gray-700 text-xs text-white focus:outline-none focus:border-cyan-400"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 via-cyan-500 to-emerald-400 text-white text-xs font-bold shadow-glowCyan hover:opacity-90 transition-opacity"
          >
            {loading ? 'Creating Room...' : 'Create Room'}
          </button>
        </form>
      </div>
    </div>
  );
};
