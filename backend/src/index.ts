import http from 'http';
import app from './app';
import { connectDB } from './config/db';
import { initSocket } from './config/socket';
import { initMqtt } from './services/mqttService';
import { seedDatabase } from './services/seedService';

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // 1. Connect to Database
    await connectDB();

    // 2. Auto-seed initial admin, owner, rooms & devices if database is empty
    await seedDatabase();

    // 3. Create HTTP Server
    const server = http.createServer(app);

    // 4. Initialize Socket.IO Gateway
    initSocket(server);

    // 5. Initialize MQTT Broker Connection
    initMqtt();

    // 6. Listen on PORT
    server.listen(PORT, () => {
      console.log(`=======================================================`);
      console.log(`🚀 SmartHome AI Backend Server Running on Port ${PORT}`);
      console.log(`📡 WebSocket Gateway: ws://localhost:${PORT}`);
      console.log(`📚 Swagger OpenAPI Docs: http://localhost:${PORT}/api-docs`);
      console.log(`=======================================================`);
    });
  } catch (err) {
    console.error('Fatal Server Boot Error:', err);
    process.exit(1);
  }
};

startServer();
