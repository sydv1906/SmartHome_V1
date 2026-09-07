'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useSocket } from '@/context/SocketContext';
import { Navbar } from '@/components/layout/Navbar';
import { Sidebar, TabType } from '@/components/layout/Sidebar';
import { TopStatsGrid } from '@/components/dashboard/TopStatsGrid';
import { LiveDeviceCard } from '@/components/dashboard/LiveDeviceCard';
import { OnboardingWizardModal } from '@/components/onboarding/OnboardingWizardModal';
import { RoomCard } from '@/components/rooms/RoomCard';
import { RoomModal } from '@/components/rooms/RoomModal';
import { EnergyAnalyticsView } from '@/components/analytics/EnergyAnalyticsView';
import { AutomationView } from '@/components/automation/AutomationView';
import { AlertsView } from '@/components/alerts/AlertsView';
import { AIRecommendationsPanel } from '@/components/ai/AIRecommendationsPanel';
import { SettingsView } from '@/components/settings/SettingsView';
import { AdminPanel } from '@/components/admin/AdminPanel';
import { VoiceControlModal } from '@/components/voice/VoiceControlModal';
import { AuthModal } from '@/components/auth/AuthModal';
import { fetchApi } from '@/services/api';
import { IDashboardStats, IDevice, IRoom } from '@smarthome/shared';
import { Plus, SlidersHorizontal, RefreshCw } from 'lucide-react';

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const { latestTelemetry, latestRelayStates } = useSocket();

  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [stats, setStats] = useState<IDashboardStats>({
    totalPowerW: 540,
    voltageV: 230.0,
    currentA: 2.39,
    todayEnergyKWh: 8.42,
    monthlyEnergyKWh: 218.5,
    estimatedBillCost: 32.78,
    connectedDevicesCount: 10,
    runningDevicesCount: 6,
    onlineDevicesCount: 9,
    offlineDevicesCount: 1,
    todayCost: 1.26,
    carbonSavedKg: 7.15,
    powerFactor: 0.98,
    frequencyHz: 50.0,
    currency: '$',
  });

  const [devices, setDevices] = useState<IDevice[]>([]);
  const [rooms, setRooms] = useState<IRoom[]>([]);
  const [loadingData, setLoadingData] = useState<boolean>(true);
  const [selectedRoomFilter, setSelectedRoomFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals
  const [showOnboarding, setShowOnboarding] = useState<boolean>(false);
  const [showVoice, setShowVoice] = useState<boolean>(false);
  const [showRoomModal, setShowRoomModal] = useState<boolean>(false);

  const loadData = async () => {
    setLoadingData(true);
    try {
      const [statsRes, devRes, roomRes] = await Promise.all([
        fetchApi('/homes/stats'),
        fetchApi('/devices'),
        fetchApi('/rooms'),
      ]);

      if (statsRes.success) setStats(statsRes.stats);
      if (devRes.success) setDevices(devRes.devices || []);
      if (roomRes.success) setRooms(roomRes.rooms || []);
    } catch (err) {
      console.warn('Backend load error:', err);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  // Handle Socket live updates merging into state
  useEffect(() => {
    if (Object.keys(latestTelemetry).length > 0 || Object.keys(latestRelayStates).length > 0) {
      setDevices((prev) =>
        prev.map((dev) => {
          const telem = latestTelemetry[dev._id];
          const newRelay = latestRelayStates[dev._id];
          return {
            ...dev,
            relayState: newRelay !== undefined ? newRelay : telem?.relayState ?? dev.relayState,
            powerW: telem?.powerW ?? dev.powerW,
            voltageV: telem?.voltageV ?? dev.voltageV,
            currentA: telem?.currentA ?? dev.currentA,
            energyKWh: telem?.energyKWh ?? dev.energyKWh,
          };
        })
      );
    }
  }, [latestTelemetry, latestRelayStates]);

  const handleToggleRelay = async (deviceId: string, currentState: boolean) => {
    try {
      const targetState = !currentState;
      // Optimistic update
      setDevices((prev) =>
        prev.map((d) => (d._id === deviceId ? { ...d, relayState: targetState } : d))
      );

      await fetchApi(`/devices/${deviceId}/relay`, {
        method: 'PUT',
        body: JSON.stringify({ state: targetState }),
      });
      loadData();
    } catch (err: any) {
      alert(`Relay toggle error: ${err.message}`);
    }
  };

  const handleDeleteDevice = async (deviceId: string) => {
    if (!confirm('Are you sure you want to remove this appliance?')) return;
    try {
      await fetchApi(`/devices/${deviceId}`, { method: 'DELETE' });
      loadData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeleteRoom = async (roomId: string) => {
    if (!confirm('Deleting this room will also unassign associated devices. Proceed?')) return;
    try {
      await fetchApi(`/rooms/${roomId}`, { method: 'DELETE' });
      loadData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen app-shell">
        <div className="w-10 h-10 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <AuthModal />;
  }

  const filteredDevices = devices.filter((d) => {
    const matchesRoom = selectedRoomFilter === 'all' || (d.roomId as any)?._id === selectedRoomFilter || d.roomId === selectedRoomFilter;
    const matchesSearch = d.name.toLowerCase().includes(searchQuery.toLowerCase()) || d.type.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesRoom && matchesSearch;
  });

  return (
    <div className="min-h-screen app-shell text-gray-100 flex flex-col">
      {/* Top Navbar */}
      <Navbar
        onOpenVoice={() => setShowVoice(true)}
        onOpenOnboarding={() => setShowOnboarding(true)}
        unreadAlertCount={2}
        onOpenAlerts={() => setActiveTab('alerts')}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* Left Sidebar */}
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} onOpenOnboarding={() => setShowOnboarding(true)} />

        {/* Main Content Viewport */}
        <main className="flex-1 min-w-0 overflow-y-auto p-3 sm:p-4 lg:p-8 space-y-5 lg:space-y-6">
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              {/* Top Telemetry Stats Grid */}
              <TopStatsGrid stats={stats} />

              {/* Appliances Section Controls */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 glass-panel p-4 rounded-2xl border border-gray-800">
                <div className="flex items-center space-x-3 w-full sm:w-auto">
                  <div className="relative flex-1 sm:w-64">
                    <input
                      type="text"
                      placeholder="Search appliances..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 rounded-xl bg-gray-900 border border-gray-700 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400"
                    />
                    <SlidersHorizontal className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                  </div>

                  {/* Room Filter Pills */}
                  <select
                    value={selectedRoomFilter}
                    onChange={(e) => setSelectedRoomFilter(e.target.value)}
                    className="px-3 py-2 rounded-xl bg-gray-900 border border-gray-700 text-xs text-cyan-300 font-medium focus:outline-none"
                  >
                    <option value="all">All Rooms</option>
                    {rooms.map((r) => (
                      <option key={r._id} value={r._id}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={loadData}
                    className="p-2 rounded-xl bg-gray-900 hover:bg-gray-800 border border-gray-800 text-gray-300 transition-colors"
                    title="Refresh Telemetry"
                  >
                    <RefreshCw className={`w-4 h-4 text-cyan-400 ${loadingData ? 'animate-spin' : ''}`} />
                  </button>
                  <button
                    onClick={() => setShowOnboarding(true)}
                    className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:opacity-90 text-white text-xs font-bold shadow-glowCyan"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Appliance</span>
                  </button>
                </div>
              </div>

              {/* Live Appliance Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredDevices.map((device) => (
                  <LiveDeviceCard
                    key={device._id}
                    device={device}
                    onToggleRelay={handleToggleRelay}
                    onOpenSchedule={() => setActiveTab('automations')}
                    onEditDevice={() => {}}
                    onDeleteDevice={handleDeleteDevice}
                  />
                ))}
              </div>
            </div>
          )}

          {activeTab === 'rooms' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between glass-panel p-4 rounded-2xl border border-gray-800">
                <div>
                  <h2 className="text-base font-bold text-white">Smart Home Room Manager</h2>
                  <p className="text-xs text-gray-400">Manage rooms, device allocations, and power draw per room</p>
                </div>
                <button
                  onClick={() => setShowRoomModal(true)}
                  className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white text-xs font-bold shadow-glowCyan"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create Room</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {rooms.map((room) => (
                  <RoomCard
                    key={room._id}
                    room={room}
                    onSelectRoom={(rId) => {
                      setSelectedRoomFilter(rId);
                      setActiveTab('dashboard');
                    }}
                    onEditRoom={() => {}}
                    onDeleteRoom={handleDeleteRoom}
                  />
                ))}
              </div>
            </div>
          )}

          {activeTab === 'devices' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between glass-panel p-4 rounded-2xl border border-gray-800">
                <div>
                  <h2 className="text-base font-bold text-white">IoT Appliance & MQTT Node Registry</h2>
                  <p className="text-xs text-gray-400">ESP32 ID mappings, relay channel assignments, and firmware versions</p>
                </div>
                <button
                  onClick={() => setShowOnboarding(true)}
                  className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white text-xs font-bold shadow-glowCyan"
                >
                  <Plus className="w-4 h-4" />
                  <span>Onboard ESP32 Node</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {devices.map((device) => (
                  <LiveDeviceCard
                    key={device._id}
                    device={device}
                    onToggleRelay={handleToggleRelay}
                    onOpenSchedule={() => setActiveTab('automations')}
                    onEditDevice={() => {}}
                    onDeleteDevice={handleDeleteDevice}
                  />
                ))}
              </div>
            </div>
          )}

          {activeTab === 'analytics' && <EnergyAnalyticsView />}
          {activeTab === 'automations' && <AutomationView />}
          {activeTab === 'alerts' && <AlertsView />}
          {activeTab === 'ai' && <AIRecommendationsPanel />}
          {activeTab === 'settings' && <SettingsView />}
          {activeTab === 'admin' && <AdminPanel />}
        </main>
      </div>

      {/* Interactive Modals */}
      <OnboardingWizardModal
        isOpen={showOnboarding}
        onClose={() => setShowOnboarding(false)}
        rooms={rooms}
        onDeviceAdded={loadData}
      />

      <VoiceControlModal
        isOpen={showVoice}
        onClose={() => setShowVoice(false)}
        onRefreshDevices={loadData}
      />

      <RoomModal
        isOpen={showRoomModal}
        onClose={() => setShowRoomModal(false)}
        onRoomSaved={loadData}
      />
    </div>
  );
}
