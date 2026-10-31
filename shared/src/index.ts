export type UserRole = 'Admin' | 'Owner' | 'Family Member' | 'Guest';

export interface IUser {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  homeAddress?: string;
  phone?: string;
  homes: string[];
  activeHomeId?: string;
  isEmailVerified: boolean;
  preferences: {
    darkMode: boolean;
    notifications: {
      email: boolean;
      sms: boolean;
      push: boolean;
    };
    theme: 'tesla-dark' | 'neon-blue' | 'cyber-emerald' | 'minimal-light';
    language: string;
    timezone: string;
    currency: string;
  };
  apiTokens?: { name: string; token: string; createdAt: Date }[];
  createdAt: string;
  updatedAt: string;
}

export type RoomType =
  | 'Living Room'
  | 'Bedroom'
  | 'Kitchen'
  | 'Office'
  | 'Laboratory'
  | 'Garage'
  | 'Hall'
  | 'Classroom'
  | 'Hostel'
  | 'Custom Room';

export interface IRoom {
  _id: string;
  name: string;
  type: RoomType;
  homeId: string;
  imageUrl?: string;
  icon?: string;
  deviceCount: number;
  totalPowerW: number;
  totalEnergyKWh: number;
  status: 'active' | 'warning' | 'idle' | 'offline';
  createdAt?: string;
}

export type DeviceType =
  | 'Fan'
  | 'Light'
  | 'Socket'
  | 'TV'
  | 'Air Conditioner'
  | 'Cooler'
  | 'Heater'
  | 'Motor'
  | 'Computer'
  | 'Printer'
  | 'Router'
  | 'Pump'
  | 'Custom Device';

export interface IDevice {
  _id: string;
  name: string;
  type: DeviceType;
  roomId: string;
  homeId: string;
  esp32Id: string;
  relayNumber: number; // 1..8
  mqttTopics: {
    telemetry: string;
    relay: string;
    status: string;
    ota: string;
    heartbeat: string;
  };
  powerRatingW: number;
  meterConnected?: boolean;
  currentA: number;
  voltageV: number;
  powerW: number;
  energyKWh: number;
  powerFactor: number;
  frequencyHz: number;
  relayState: boolean;
  onlineStatus: boolean;
  signalStrengthRssi: number;
  wifiSsid?: string;
  firmwareVersion: string;
  temperatureC?: number;
  lastSeen: string;
  createdAt?: string;
}

export interface ITelemetry {
  _id?: string;
  deviceId: string;
  esp32Id: string;
  voltageV: number;
  currentA: number;
  powerW: number;
  energyKWh: number;
  powerFactor: number;
  frequencyHz: number;
  relayState: boolean;
  temperatureC?: number;
  timestamp: string;
}

export interface IEnergyLog {
  _id?: string;
  deviceId: string;
  homeId: string;
  roomId: string;
  date: string; // YYYY-MM-DD
  hour?: number;
  energyKWh: number;
  cost: number;
  peakPowerW: number;
  avgVoltageV: number;
  avgPowerFactor: number;
  carbonOffsetKg: number;
}

export interface IAutomationRule {
  _id: string;
  homeId: string;
  name: string;
  enabled: boolean;
  condition: {
    type: 'voltage_high' | 'voltage_low' | 'current_high' | 'power_high' | 'duration_exceeded' | 'schedule';
    thresholdValue: number;
    deviceId?: string;
    roomId?: string;
    durationMinutes?: number;
    cronSchedule?: string;
  };
  action: {
    type: 'turn_off_relay' | 'turn_on_relay' | 'send_alert' | 'activate_mode';
    targetDeviceId?: string;
    mode?: 'Night Mode' | 'Vacation Mode' | 'Away Mode' | 'Eco Saver';
  };
  lastTriggered?: string;
  createdAt?: string;
}

export interface ISchedule {
  _id: string;
  deviceId: string;
  name: string;
  time: string; // HH:mm
  days: number[]; // 0=Sun, 1=Mon...
  action: 'ON' | 'OFF';
  enabled: boolean;
}

export type AlertType =
  | 'High Voltage'
  | 'Low Voltage'
  | 'High Current'
  | 'Relay Failure'
  | 'Device Offline'
  | 'ESP32 Offline'
  | 'Power Failure'
  | 'Power Restored'
  | 'Fire Risk'
  | 'Overload';

export type AlertSeverity = 'info' | 'warning' | 'danger' | 'critical';

export interface INotification {
  _id: string;
  homeId: string;
  userId?: string;
  title: string;
  message: string;
  type: AlertType;
  severity: AlertSeverity;
  deviceId?: string;
  read: boolean;
  channels: {
    email: boolean;
    sms: boolean;
    push: boolean;
  };
  createdAt: string;
}

export interface IDashboardStats {
  totalPowerW: number;
  voltageV: number;
  currentA: number;
  todayEnergyKWh: number;
  monthlyEnergyKWh: number;
  estimatedBillCost: number;
  connectedDevicesCount: number;
  runningDevicesCount: number;
  onlineDevicesCount: number;
  offlineDevicesCount: number;
  todayCost: number;
  carbonSavedKg: number;
  powerFactor: number;
  frequencyHz: number;
  currency: string;
}

export interface IAIEnergyRecommendation {
  id: string;
  title: string;
  description: string;
  potentialSavingsMonthly: number;
  category: 'Schedule' | 'Idle Waste' | 'Peak Tariff' | 'Appliance Health';
  impact: 'High' | 'Medium' | 'Low';
  actionDeviceIds?: string[];
}

export interface IFirmware {
  _id: string;
  version: string;
  deviceType: string;
  filename: string;
  fileSizeMb: number;
  releaseNotes: string;
  downloadUrl: string;
  uploadedAt: string;
}

// MQTT helper utilities
export const getMqttTopics = (userId: string, deviceId: string) => ({
  telemetry: `smarthome/${userId}/${deviceId}/telemetry`,
  relay: `smarthome/${userId}/${deviceId}/relay`,
  status: `smarthome/${userId}/${deviceId}/status`,
  ota: `smarthome/${userId}/${deviceId}/ota`,
  heartbeat: `smarthome/${userId}/${deviceId}/heartbeat`,
});

// Socket Events
export const SOCKET_EVENTS = {
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  JOIN_HOME: 'join_home',
  LEAVE_HOME: 'leave_home',
  TELEMETRY_UPDATE: 'telemetry_update',
  DEVICE_STATUS_CHANGE: 'device_status_change',
  RELAY_STATE_CHANGE: 'relay_state_change',
  ALERT_TRIGGERED: 'alert_triggered',
  STATS_UPDATE: 'stats_update',
  ROOM_UPDATE: 'room_update',
} as const;
