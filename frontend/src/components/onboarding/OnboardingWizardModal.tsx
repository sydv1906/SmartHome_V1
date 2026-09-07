'use client';

import React, { useState } from 'react';
import {
  QrCode,
  Search,
  Wifi,
  CheckCircle2,
  Home as HomeIcon,
  Cpu,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  X,
} from 'lucide-react';
import { IRoom } from '@smarthome/shared';
import { fetchApi } from '@/services/api';

interface OnboardingWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  rooms: IRoom[];
  onDeviceAdded: () => void;
}

export const OnboardingWizardModal: React.FC<OnboardingWizardModalProps> = ({
  isOpen,
  onClose,
  rooms,
  onDeviceAdded,
}) => {
  const [step, setStep] = useState<number>(1);
  const [qrCodeInput, setQrCodeInput] = useState<string>('ESP32_PZEM_SN_9942A');
  const [foundEsp32, setFoundEsp32] = useState<string>('esp32_smart_node_88');
  const [wifiSsid, setWifiSsid] = useState<string>('SmartHome_WiFi_5G');
  const [wifiPass, setWifiPass] = useState<string>('ProductionPass2026');
  const [deviceName, setDeviceName] = useState<string>('Master Bedroom Fan');
  const [deviceType, setDeviceType] = useState<string>('Fan');
  const [selectedRoomId, setSelectedRoomId] = useState<string>(rooms[0]?._id || '');
  const [relayNumber, setRelayNumber] = useState<number>(1);
  const [powerRatingW, setPowerRatingW] = useState<number>(100);
  const [submitting, setSubmitting] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleFinish = async () => {
    setSubmitting(true);
    try {
      await fetchApi('/devices', {
        method: 'POST',
        body: JSON.stringify({
          name: deviceName,
          type: deviceType,
          roomId: selectedRoomId || rooms[0]?._id,
          esp32Id: foundEsp32,
          relayNumber,
          powerRatingW,
        }),
      });

      onDeviceAdded();
      onClose();
      setStep(1);
    } catch (err: any) {
      alert(`Error pairing device: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const stepsList = [
    '1. Scan QR Code',
    '2. Find ESP32',
    '3. Connect WiFi',
    '4. Pair Device',
    '5. Assign Room',
    '6. Assign Relays',
    '7. Finish',
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="w-full max-w-2xl glass-panel-glow rounded-3xl border border-cyan-500/30 overflow-hidden shadow-2xl">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-gray-800/80 flex items-center justify-between bg-darkCard/90">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/20 text-neonCyan border border-cyan-500/40 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">ESP32 Device Onboarding Wizard</h2>
              <p className="text-xs text-cyan-400">Step {step} of 7 — {stepsList[step - 1]}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-900 h-1.5">
          <div
            className="bg-gradient-to-r from-blue-500 via-cyan-400 to-emerald-400 h-1.5 transition-all duration-300"
            style={{ width: `${(step / 7) * 100}%` }}
          />
        </div>

        {/* Step Content */}
        <div className="p-6 space-y-6">
          {step === 1 && (
            <div className="text-center space-y-4 py-4">
              <div className="w-24 h-24 mx-auto rounded-2xl bg-cyan-950/60 border-2 border-dashed border-cyan-500/50 flex flex-col items-center justify-center text-cyan-400">
                <QrCode className="w-10 h-10 animate-pulse" />
                <span className="text-[10px] mt-1">Scan Serial</span>
              </div>
              <p className="text-xs text-gray-300 max-w-md mx-auto">
                Scan the QR code printed on your ESP32 Hardware Module casing or enter serial number manually.
              </p>
              <input
                type="text"
                value={qrCodeInput}
                onChange={(e) => setQrCodeInput(e.target.value)}
                className="w-full max-w-sm px-4 py-2.5 rounded-xl bg-gray-900 border border-gray-700 text-sm text-cyan-300 focus:outline-none focus:border-cyan-400 text-center font-mono"
              />
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4 py-4 text-center">
              <div className="w-16 h-16 mx-auto rounded-full bg-blue-500/20 text-cyan-400 flex items-center justify-center animate-ping">
                <Search className="w-8 h-8" />
              </div>
              <h3 className="text-sm font-semibold text-white">Searching for ESP32 Nodes on Network...</h3>
              <div className="p-4 rounded-xl bg-gray-900 border border-emerald-500/40 text-left flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Cpu className="w-6 h-6 text-emerald-400" />
                  <div>
                    <p className="text-xs font-bold text-white">Discovered Node: {foundEsp32}</p>
                    <p className="text-[10px] text-gray-400">MAC: 24:0AC4:99:A1 • RSSI: -54 dBm</p>
                  </div>
                </div>
                <span className="text-xs text-emerald-400 font-bold">READY</span>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4 max-w-md mx-auto">
              <h3 className="text-sm font-semibold text-white">Connect ESP32 to Home WiFi</h3>
              <div>
                <label className="text-xs text-gray-400 block mb-1">WiFi SSID (Network Name)</label>
                <input
                  type="text"
                  value={wifiSsid}
                  onChange={(e) => setWifiSsid(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl bg-gray-900 border border-gray-700 text-xs text-white"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">WiFi Password</label>
                <input
                  type="password"
                  value={wifiPass}
                  onChange={(e) => setWifiPass(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl bg-gray-900 border border-gray-700 text-xs text-white"
                />
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4 max-w-md mx-auto">
              <h3 className="text-sm font-semibold text-white">Appliance Configuration</h3>
              <div>
                <label className="text-xs text-gray-400 block mb-1">Device Name</label>
                <input
                  type="text"
                  value={deviceName}
                  onChange={(e) => setDeviceName(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl bg-gray-900 border border-gray-700 text-xs text-white"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">Appliance Type</label>
                <select
                  value={deviceType}
                  onChange={(e) => setDeviceType(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl bg-gray-900 border border-gray-700 text-xs text-white"
                >
                  <option value="Fan">Fan</option>
                  <option value="Light">Light</option>
                  <option value="Socket">Socket</option>
                  <option value="TV">TV</option>
                  <option value="Air Conditioner">Air Conditioner</option>
                  <option value="Cooler">Cooler</option>
                  <option value="Heater">Heater</option>
                  <option value="Motor">Motor</option>
                  <option value="Computer">Computer</option>
                  <option value="Printer">Printer</option>
                  <option value="Router">Router</option>
                  <option value="Pump">Pump</option>
                  <option value="Custom Device">Custom Device</option>
                </select>
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-4 max-w-md mx-auto">
              <h3 className="text-sm font-semibold text-white">Assign to Room</h3>
              <div className="grid grid-cols-2 gap-3">
                {rooms.map((r) => (
                  <button
                    key={r._id}
                    onClick={() => setSelectedRoomId(r._id)}
                    className={`p-3 rounded-xl border text-left text-xs transition-all ${
                      selectedRoomId === r._id
                        ? 'border-cyan-400 bg-cyan-500/20 text-cyan-300 shadow-glowCyan'
                        : 'border-gray-800 bg-gray-900/60 text-gray-400 hover:border-gray-700'
                    }`}
                  >
                    <p className="font-bold text-white">{r.name}</p>
                    <p className="text-[10px] text-gray-400">{r.type}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 6 && (
            <div className="space-y-4 max-w-md mx-auto">
              <h3 className="text-sm font-semibold text-white">Assign Relay Channel & Power Rating</h3>
              <div>
                <label className="text-xs text-gray-400 block mb-1">ESP32 Relay Pin Channel (1 - 8)</label>
                <input
                  type="number"
                  min={1}
                  max={8}
                  value={relayNumber}
                  onChange={(e) => setRelayNumber(Number(e.target.value))}
                  className="w-full px-4 py-2 rounded-xl bg-gray-900 border border-gray-700 text-xs text-white"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">Max Power Rating (Watts)</label>
                <input
                  type="number"
                  value={powerRatingW}
                  onChange={(e) => setPowerRatingW(Number(e.target.value))}
                  className="w-full px-4 py-2 rounded-xl bg-gray-900 border border-gray-700 text-xs text-white"
                />
              </div>
            </div>
          )}

          {step === 7 && (
            <div className="text-center space-y-4 py-4">
              <div className="w-16 h-16 mx-auto rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shadow-glowEmerald">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h3 className="text-base font-bold text-white">Ready to Pair!</h3>
              <p className="text-xs text-gray-300 max-w-sm mx-auto">
                ESP32 hardware node <span className="font-mono text-cyan-300">{foundEsp32}</span> is configured to publish MQTT telemetry to HiveMQ.
              </p>
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="px-6 py-4 border-t border-gray-800/80 bg-darkCard/90 flex items-center justify-between">
          <button
            onClick={() => setStep((s) => Math.max(s - 1, 1))}
            disabled={step === 1}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-gray-900 hover:bg-gray-800 text-gray-400 text-xs font-medium border border-gray-800 disabled:opacity-40"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>

          {step < 7 ? (
            <button
              onClick={() => setStep((s) => Math.min(s + 1, 7))}
              className="flex items-center space-x-1.5 px-5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:opacity-90 text-white text-xs font-bold shadow-glowCyan"
            >
              <span>Next Step</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleFinish}
              disabled={submitting}
              className="flex items-center space-x-1.5 px-6 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:opacity-90 text-white text-xs font-bold shadow-glowEmerald"
            >
              <span>{submitting ? 'Adding Device...' : 'Complete Pairing'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
