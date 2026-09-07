"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SOCKET_EVENTS = exports.getMqttTopics = void 0;
// MQTT helper utilities
const getMqttTopics = (userId, deviceId) => ({
    telemetry: `smarthome/${userId}/${deviceId}/telemetry`,
    relay: `smarthome/${userId}/${deviceId}/relay`,
    status: `smarthome/${userId}/${deviceId}/status`,
    ota: `smarthome/${userId}/${deviceId}/ota`,
    heartbeat: `smarthome/${userId}/${deviceId}/heartbeat`,
});
exports.getMqttTopics = getMqttTopics;
// Socket Events
exports.SOCKET_EVENTS = {
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
};
