'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';

interface SocketContextType {
  socket: Socket | null;
  connected: boolean;
  latestTelemetry: Record<string, any>;
  latestRelayStates: Record<string, boolean>;
  alerts: any[];
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { activeHomeId } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState<boolean>(false);
  const [latestTelemetry, setLatestTelemetry] = useState<Record<string, any>>({});
  const [latestRelayStates, setLatestRelayStates] = useState<Record<string, boolean>>({});
  const [alerts, setAlerts] = useState<any[]>([]);

  useEffect(() => {
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000';
    const newSocket = io(socketUrl, {
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
    });

    newSocket.on('connect', () => {
      console.log('[Socket.IO Frontend] Connected to WebSocket server:', newSocket.id);
      setConnected(true);
      if (activeHomeId) {
        newSocket.emit('join_home', activeHomeId);
      }
    });

    newSocket.on('disconnect', () => {
      console.log('[Socket.IO Frontend] Disconnected from WebSocket server');
      setConnected(false);
    });

    newSocket.on('telemetry_update', (data: any) => {
      setLatestTelemetry((prev) => ({
        ...prev,
        [data.deviceId]: data,
      }));
    });

    newSocket.on('relay_state_change', (data: any) => {
      setLatestRelayStates((prev) => ({
        ...prev,
        [data.deviceId]: data.relayState,
      }));
    });

    newSocket.on('alert_triggered', (data: any) => {
      setAlerts((prev) => [data, ...prev.slice(0, 19)]);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, []);

  useEffect(() => {
    if (socket && connected && activeHomeId) {
      socket.emit('join_home', activeHomeId);
    }
  }, [activeHomeId, socket, connected]);

  return (
    <SocketContext.Provider
      value={{
        socket,
        connected,
        latestTelemetry,
        latestRelayStates,
        alerts,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) throw new Error('useSocket must be used within a SocketProvider');
  return context;
};
