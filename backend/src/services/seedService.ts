import bcrypt from 'bcryptjs';
import User from '../models/User';
import Home from '../models/Home';
import Room from '../models/Room';
import Device from '../models/Device';
import Telemetry from '../models/Telemetry';
import Notification from '../models/Notification';
import AutomationRule from '../models/AutomationRule';

export const seedDatabase = async () => {
  try {
    const existingUsers = await User.countDocuments();
    if (existingUsers > 0) {
      console.log('[Seed] Database already seeded. Skipping initial seeding.');
      return;
    }

    console.log('[Seed] Seeding initial production data...');

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('password123', salt);

    // 1. Create Admin & Owner Users
    const adminUser = await User.create({
      name: 'Dr. Sarah Connor',
      email: 'admin@smarthome.ai',
      passwordHash,
      role: 'Admin',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150',
      homeAddress: '100 Cybernetics Drive, Austin, TX',
      phone: '+1 (555) 987-6543',
    });

    const ownerUser = await User.create({
      name: 'Alex Rivera',
      email: 'owner@smarthome.ai',
      passwordHash,
      role: 'Owner',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      homeAddress: '450 Innovation Way, San Francisco, CA',
      phone: '+1 (555) 234-5678',
    });

    // 2. Create Home
    const demoHome = await Home.create({
      name: 'Smart Villa San Francisco',
      address: '450 Innovation Way, San Francisco, CA',
      ownerId: ownerUser._id,
      members: [
        { userId: ownerUser._id, role: 'Owner' },
        { userId: adminUser._id, role: 'Owner' },
      ],
      tariffPerKWh: 0.15,
      currency: '$',
      timezone: 'America/Los_Angeles',
      currentMode: 'Normal',
    });

    ownerUser.homes = [demoHome._id as any];
    ownerUser.activeHomeId = demoHome._id as any;
    adminUser.homes = [demoHome._id as any];
    adminUser.activeHomeId = demoHome._id as any;
    await ownerUser.save();
    await adminUser.save();

    // 3. Create Rooms
    const roomSpecs = [
      { name: 'Living Room', type: 'Living Room', imageUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600' },
      { name: 'Master Bedroom', type: 'Bedroom', imageUrl: 'https://images.unsplash.com/photo-1616594039964-ae9021a400a0?w=600' },
      { name: 'Gourmet Kitchen', type: 'Kitchen', imageUrl: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=600' },
      { name: 'Home Office', type: 'Office', imageUrl: 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=600' },
      { name: 'IoT Laboratory', type: 'Laboratory', imageUrl: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=600' },
      { name: 'Garage & EV Hub', type: 'Garage', imageUrl: 'https://images.unsplash.com/photo-1590674899484-d5640e854abe?w=600' },
    ];

    const createdRooms = await Promise.all(
      roomSpecs.map((rs) =>
        Room.create({
          name: rs.name,
          type: rs.type,
          homeId: demoHome._id,
          imageUrl: rs.imageUrl,
          deviceCount: 0,
          totalPowerW: 0,
          totalEnergyKWh: 0,
          status: 'idle',
        })
      )
    );

    const roomMap: Record<string, any> = {};
    createdRooms.forEach((r) => (roomMap[r.type] = r));

    // 4. Create Devices
    const userIdStr = ownerUser._id.toString();
    const deviceSpecs = [
      { name: 'Living Room Ceiling Fan', type: 'Fan', roomType: 'Living Room', esp32Id: 'esp32_lr_fan_01', relayNumber: 1, powerRatingW: 75, powerW: 65, relayState: true },
      { name: 'OLED Smart TV 65"', type: 'TV', roomType: 'Living Room', esp32Id: 'esp32_lr_tv_02', relayNumber: 2, powerRatingW: 180, powerW: 145, relayState: true },
      { name: 'Inverter Air Conditioner', type: 'Air Conditioner', roomType: 'Bedroom', esp32Id: 'esp32_br_ac_01', relayNumber: 1, powerRatingW: 1500, powerW: 1200, relayState: true },
      { name: 'Ambient Warm Lights', type: 'Light', roomType: 'Bedroom', esp32Id: 'esp32_br_light_02', relayNumber: 2, powerRatingW: 40, powerW: 0, relayState: false },
      { name: 'Induction Cooktop', type: 'Heater', roomType: 'Kitchen', esp32Id: 'esp32_kt_cook_01', relayNumber: 1, powerRatingW: 2000, powerW: 0, relayState: false },
      { name: 'Smart Refrigerator Socket', type: 'Socket', roomType: 'Kitchen', esp32Id: 'esp32_kt_fridge_02', relayNumber: 2, powerRatingW: 250, powerW: 180, relayState: true },
      { name: 'Developer Workstation PC', type: 'Computer', roomType: 'Office', esp32Id: 'esp32_of_pc_01', relayNumber: 1, powerRatingW: 450, powerW: 320, relayState: true },
      { name: '3D Printer & Test Rig', type: 'Printer', roomType: 'Laboratory', esp32Id: 'esp32_lab_3d_01', relayNumber: 1, powerRatingW: 300, powerW: 240, relayState: true },
      { name: 'Main Water Pump Motor', type: 'Pump', roomType: 'Garage', esp32Id: 'esp32_gr_pump_01', relayNumber: 1, powerRatingW: 1100, powerW: 0, relayState: false },
      { name: 'Gigabit Fiber Router', type: 'Router', roomType: 'Office', esp32Id: 'esp32_of_router_02', relayNumber: 2, powerRatingW: 25, powerW: 22, relayState: true },
    ];

    for (const spec of deviceSpecs) {
      const room = roomMap[spec.roomType] || createdRooms[0];
      const device = await Device.create({
        name: spec.name,
        type: spec.type,
        roomId: room._id,
        homeId: demoHome._id,
        esp32Id: spec.esp32Id,
        relayNumber: spec.relayNumber,
        mqttTopics: {
          telemetry: `smarthome/${userIdStr}/${spec.esp32Id}/telemetry`,
          relay: `smarthome/${userIdStr}/${spec.esp32Id}/relay`,
          status: `smarthome/${userIdStr}/${spec.esp32Id}/status`,
          ota: `smarthome/${userIdStr}/${spec.esp32Id}/ota`,
          heartbeat: `smarthome/${userIdStr}/${spec.esp32Id}/heartbeat`,
        },
        powerRatingW: spec.powerRatingW,
        currentA: spec.relayState ? Number((spec.powerW / (230 * 0.98)).toFixed(2)) : 0,
        voltageV: 230,
        powerW: spec.powerW,
        energyKWh: Number((Math.random() * 4 + 1.2).toFixed(2)),
        powerFactor: 0.98,
        frequencyHz: 50.0,
        relayState: spec.relayState,
        onlineStatus: true,
        signalStrengthRssi: Math.floor(-50 - Math.random() * 25),
        wifiSsid: 'SmartHome_5G_Mesh',
        firmwareVersion: 'v2.1.0',
        temperatureC: Math.floor(25 + Math.random() * 8),
        lastSeen: new Date(),
      });

      await Room.findByIdAndUpdate(room._id, { $inc: { deviceCount: 1 } });

      // Add initial Telemetry sample
      await Telemetry.create({
        deviceId: device._id,
        esp32Id: device.esp32Id,
        voltageV: 230,
        currentA: device.currentA,
        powerW: device.powerW,
        energyKWh: device.energyKWh,
        powerFactor: 0.98,
        frequencyHz: 50.0,
        relayState: device.relayState,
        temperatureC: device.temperatureC,
        timestamp: new Date(),
      });
    }

    // 5. Create Default Notifications & Automations
    await Notification.create({
      homeId: demoHome._id,
      title: '✅ SmartHome AI System Online',
      message: 'All 10 ESP32 IoT relay controllers successfully paired and connected to HiveMQ MQTT Broker.',
      type: 'Power Restored',
      severity: 'info',
      read: false,
    });

    await AutomationRule.create({
      homeId: demoHome._id,
      name: 'High Voltage Safety Auto-Cutoff',
      enabled: true,
      condition: {
        type: 'voltage_high',
        thresholdValue: 250,
      },
      action: {
        type: 'turn_off_relay',
      },
    });

    console.log('[Seed] Database seeding completed cleanly!');
    console.log(`[Seed Credentials] Admin: admin@smarthome.ai / password123 | Owner: owner@smarthome.ai / password123`);
  } catch (err) {
    console.error('[Seed Error]', err);
  }
};
