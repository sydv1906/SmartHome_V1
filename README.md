# SmartHome AI — Intelligent Energy Monitoring & Smart Appliance Control

A commercial-grade, full-stack Smart Home Energy Management & Automation Platform engineered with Next.js 15, React 19, TypeScript, TailwindCSS, Express, MongoDB Atlas, Socket.IO, MQTT (HiveMQ), and ESP32 IoT Microcontrollers.

---

## ⚡ Key Platform Features

- **Tesla & Home Assistant Inspired Glassmorphism UI**: High-density dark dashboard with vibrant status glow rings, real-time power gauges, and micro-interactions.
- **Real-Time Telemetry & Relay Control**: Zero-latency Socket.IO & MQTT bidirectional telemetry stream (Power W, Voltage V, Current A, Cumulative Energy kWh, Power Factor, Frequency, Temperature).
- **7-Step ESP32 Onboarding Wizard**: QR scan simulation, network discovery, WiFi credentials provisioning, room mapping, and relay pin allocation.
- **Granular Energy Analytics**:
  - 24-Hour Power Draw Profile (Area Chart)
  - Daily & Weekly Energy Consumption Bar Charts
  - Room Share Breakdown (Pie Chart)
  - Heatmap Matrix (7 days x 24 hours)
  - Top 10 Energy-Consuming Appliances
  - CSV & PDF Data Exports
- **Smart Automations & Protection Engine**:
  - Overvoltage Auto-Cutoff (>250V)
  - Overcurrent Trip (>15A)
  - Overload & 3-Hour Runtime Alerts
  - Scene Modes: Normal, Night Mode, Vacation Mode, Away Mode
- **AI Energy Recommendation Engine**: Autonomous load profile analysis detecting vampire standby drain and suggesting peak tariff shifting to save money monthly.
- **Hardware Safety Alerts & Logs**: Detailed severity-coded log stream for fire risk, voltage spikes, and device connection drops.
- **Voice Control Ready**: Web Speech API assistant integration ("Turn on Living Room Fan", "Status Report").
- **Admin Control Panel**: Full User Management, RBAC Role editor, System Health Inspector, and active WebSockets monitor.

---

## 🛠 Tech Stack

- **Frontend**: Next.js 15 (App Router), React 19, TypeScript, TailwindCSS, Framer Motion, Recharts, Lucide Icons, Socket.io-client.
- **Backend**: Node.js, Express.js, TypeScript, Mongoose (MongoDB Atlas), JWT (Access + Refresh Tokens), Socket.IO, MQTT (PubSubClient / mqtt.js), Winston, Swagger.
- **IoT & Hardware**: ESP32 C++ Arduino Firmware (`esp32_smart_meter.ino`), PZEM-004T AC Energy Sensor, 4-Channel Relays, Standalone Node.js IoT Device Simulator (`device_simulator.js`).

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- Node.js v20+ & npm 10+
- MongoDB (Local or MongoDB Atlas URI)
- MQTT Broker (Local Mosquitto or HiveMQ Cloud)

### 2. Installation
```bash
# Clone repository and install shared dependencies
cd SmartHome
npm --prefix shared install && npm --prefix shared run build

# Install Backend dependencies
npm --prefix backend install

# Install Frontend dependencies
npm --prefix frontend install
```

### 3. Run Development Servers
```bash
# Start Backend REST API & Socket.IO server (Port 5000)
npm --prefix backend run dev

# Start Standalone ESP32 IoT Device Simulator (In another terminal)
node simulator/device_simulator.js

# Start Next.js 15 Frontend Dashboard (Port 3000)
npm --prefix frontend run dev
```

Visit **`http://localhost:3000`** in your browser to view the live dashboard!

---

## 🔑 Demo Account Credentials

| Role | Email | Password |
|---|---|---|
| **Owner** | `owner@smarthome.ai` | `password123` |
| **Admin** | `admin@smarthome.ai` | `password123` |

---

## 📚 OpenAPI / Swagger API Documentation

When the backend is running, access full Swagger OpenAPI documentation at:
**`http://localhost:5000/api-docs`**

---

## 🐳 Docker Deployment

To launch the complete platform (Frontend, Backend, MongoDB, and Mosquitto MQTT Broker) with a single command:

```bash
docker-compose up --build -d
```



.......
## running the project 

1. Terminal 1 - Backend server
npm --prefix backend run dev

2. Terminal 2 - Next.js Frontend
npm --prefix frontend run dev