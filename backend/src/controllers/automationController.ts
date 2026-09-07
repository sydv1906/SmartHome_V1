import { Response } from 'express';
import AutomationRule from '../models/AutomationRule';
import Schedule from '../models/Schedule';
import Device from '../models/Device';
import { AuthRequest } from '../middleware/auth';

export const getAutomations = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const homeId = req.query.homeId || req.user.activeHomeId;
    const rules = await AutomationRule.find({ homeId }).populate('condition.deviceId action.targetDeviceId', 'name type');
    const schedules = await Schedule.find({ homeId }).populate('deviceId', 'name type');

    res.status(200).json({ success: true, rules, schedules });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const createAutomationRule = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, condition, action, homeId } = req.body;
    const targetHomeId = homeId || req.user.activeHomeId;

    const rule = await AutomationRule.create({
      homeId: targetHomeId,
      name,
      enabled: true,
      condition,
      action,
    });

    res.status(201).json({ success: true, rule });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const toggleRule = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { ruleId } = req.params;
    const rule = await AutomationRule.findById(ruleId);
    if (!rule) {
      res.status(404).json({ success: false, message: 'Automation rule not found' });
      return;
    }

    rule.enabled = !rule.enabled;
    await rule.save();
    res.status(200).json({ success: true, rule });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const deleteRule = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { ruleId } = req.params;
    await AutomationRule.findByIdAndDelete(ruleId);
    res.status(200).json({ success: true, message: 'Automation rule deleted' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const createSchedule = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { deviceId, name, time, days, action, homeId } = req.body;
    const targetHomeId = homeId || req.user.activeHomeId;

    const schedule = await Schedule.create({
      deviceId,
      homeId: targetHomeId,
      name,
      time,
      days: days || [0, 1, 2, 3, 4, 5, 6],
      action: action || 'OFF',
      enabled: true,
    });

    res.status(201).json({ success: true, schedule });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const toggleSchedule = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { scheduleId } = req.params;
    const schedule = await Schedule.findById(scheduleId);
    if (!schedule) {
      res.status(404).json({ success: false, message: 'Schedule not found' });
      return;
    }

    schedule.enabled = !schedule.enabled;
    await schedule.save();
    res.status(200).json({ success: true, schedule });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const deleteSchedule = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { scheduleId } = req.params;
    await Schedule.findByIdAndDelete(scheduleId);
    res.status(200).json({ success: true, message: 'Schedule deleted' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};
