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

### ESP32 firmware and PZEM-004T

Open `firmware/esp32_smart_meter/esp32_smart_meter.ino` in the Arduino IDE, install the **PZEM-004T-v30** library, and select your ESP32 board. The firmware reads the meter over `Serial2` and publishes voltage, current, power, energy, power factor, and frequency in the existing MQTT telemetry message. If the meter cannot be read, it reports `pzemConnected: false`.

| PZEM module | ESP32 |
|---|---|
| TX | GPIO 16 (RX2) |
| RX | GPIO 17 (TX2) |
| 5V | VIN / shared regulated 5V rail |
| GND | GND / shared ground |

Use the GPIO numbers shown above (often labeled D16 and D17 on the board). Power the PZEM and relay module from an adequately rated 5V supply with a common ground. The PZEM measures hazardous AC mains: use an isolated, correctly rated module and enclosure, and do not handle mains wiring while powered.

The sketch includes `secrets.h` for Wi-Fi and MQTT settings. Keep that file local and do not publish its credentials.

### Windows demo startup

On the presentation laptop, connect to the ESP32's phone hotspot, then run this from PowerShell in the repository:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\start-demo.ps1
```

Approve the administrator prompt. The helper checks the hotspot, updates the local firmware broker IP and hotspot-scoped MQTT firewall rule, tests Atlas and authenticated MQTT, then opens backend and frontend terminals. Check the backend terminal for successful MongoDB and MQTT connections before opening `http://localhost:3000`. Atlas must allow the laptop's current public IP; the helper reports a failure but does not widen the Atlas IP access list. If the helper warns that the broker IP changed, upload the firmware to the ESP32 again before expecting it to connect. Keep the laptop on the hotspot and the backend, frontend, Mosquitto service, and ESP32 powered on during the presentation.

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

## AI Assistant Configuration

The dashboard assistant is available from the top navigation on desktop and mobile. It supports home/device status questions and explicit relay on/off requests. Voice input uses the browser's speech-recognition support when available; typed requests remain available in every browser.

Configure the chatbot in `backend/.env` using an OpenRouter API key from [openrouter.ai/keys](https://openrouter.ai/keys) as `OPENROUTER_API_KEY`. The default endpoint is `https://openrouter.ai/api/v1`, and the default model is `openai/gpt-4o-mini`; set `OPENROUTER_BASE_URL` or `OPENROUTER_MODEL` to override them. The selected model/provider must support structured outputs. Keep the key on the backend and out of frontend environment variables. OpenRouter account credits and rate limits apply. Assistant requests send device names, room names, relay/online state, and current power readings to that provider; do not enable it if that data sharing is not acceptable.

Relay responses distinguish between an MQTT command being sent and a device confirming its state. The current device protocol does not provide a command acknowledgement, so the assistant does not claim physical confirmation.

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
