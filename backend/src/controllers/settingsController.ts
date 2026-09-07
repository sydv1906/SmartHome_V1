import { Response } from 'express';
import User from '../models/User';
import Home from '../models/Home';
import { AuthRequest } from '../middleware/auth';

export const getSettings = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.user._id).select('-passwordHash');
    const home = await Home.findById(req.user.activeHomeId || req.user.homes[0]);

    res.status(200).json({
      success: true,
      user,
      homeSettings: {
        tariffPerKWh: home?.tariffPerKWh || 0.15,
        currency: home?.currency || '$',
        timezone: home?.timezone || 'UTC',
        currentMode: home?.currentMode || 'Normal',
        address: home?.address,
      },
      mqttSettings: {
        brokerUrl: process.env.MQTT_BROKER_URL || 'mqtt://127.0.0.1:1883',
        status: 'Connected',
        activeBroker: 'HiveMQ Cloud / Mosquitto Cluster',
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const updateUserSettings = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, phone, homeAddress, preferences } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    if (name) user.name = name;
    if (phone) user.phone = phone;
    if (homeAddress) user.homeAddress = homeAddress;
    if (preferences) user.preferences = { ...user.preferences, ...preferences };

    await user.save();
    res.status(200).json({ success: true, message: 'Profile settings updated', user });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const updateTariffBilling = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { tariffPerKWh, currency, timezone } = req.body;
    const homeId = req.body.homeId || req.user.activeHomeId;

    const home = await Home.findById(homeId);
    if (!home) {
      res.status(404).json({ success: false, message: 'Home not found' });
      return;
    }

    if (tariffPerKWh !== undefined) home.tariffPerKWh = tariffPerKWh;
    if (currency) home.currency = currency;
    if (timezone) home.timezone = timezone;

    await home.save();
    res.status(200).json({ success: true, message: 'Billing & Tariff settings updated', home });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const generateApiToken = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { tokenName } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    const token = `sh_live_${Math.random().toString(36).substring(2)}${Date.now().toString(36)}`;
    user.apiTokens.push({
      name: tokenName || 'Default API Key',
      token,
      createdAt: new Date(),
    });

    await user.save();
    res.status(201).json({ success: true, token, apiTokens: user.apiTokens });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};
