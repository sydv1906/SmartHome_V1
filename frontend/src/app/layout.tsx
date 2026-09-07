import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { SocketProvider } from '@/context/SocketContext';
import { ThemeProvider } from '@/context/ThemeContext';

export const metadata: Metadata = {
  title: 'SmartHome AI — Intelligent Energy Monitoring & Smart Appliance Control',
  description: 'Commercial SaaS Smart Home Energy Management Platform with real-time MQTT telemetry, live relay controls, energy analytics, and AI recommendations.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="app-shell text-gray-900 dark:text-gray-100 antialiased min-h-screen">
        <ThemeProvider>
          <AuthProvider>
            <SocketProvider>{children}</SocketProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
