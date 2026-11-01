import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import Device from '../models/Device';
import Home from '../models/Home';
import Telemetry from '../models/Telemetry';

const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
const MAX_BOUNDARY_GAP_MS = 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

const parseIndianDate = (value: unknown): Date | null => {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day) - IST_OFFSET_MS);
  const istDate = new Date(date.getTime() + IST_OFFSET_MS);
  if (
    istDate.getUTCFullYear() !== year ||
    istDate.getUTCMonth() !== month - 1 ||
    istDate.getUTCDate() !== day
  ) return null;
  return date;
};

export const getBillingConsumption = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const startDate = parseIndianDate(req.query.startDate);
    const requestedEndDate = parseIndianDate(req.query.endDate);
    const now = new Date();
    if (!startDate || !requestedEndDate || requestedEndDate < startDate) {
      res.status(400).json({
        success: false,
        message: 'Enter a valid billing start and end date.',
      });
      return;
    }
    if (startDate > now) {
      res.status(400).json({
        success: false,
        message: 'The billing start date cannot be in the future.',
      });
      return;
    }

    const periodDays = Math.floor((requestedEndDate.getTime() - startDate.getTime()) / DAY_MS) + 1;
    if (periodDays > 93) {
      res.status(400).json({
        success: false,
        message: 'A billing period cannot exceed 93 days.',
      });
      return;
    }

    const homeId = req.user.activeHomeId || req.user.homes?.[0];
    if (!homeId) {
      res.status(400).json({ success: false, message: 'Select a home before generating a bill.' });
      return;
    }

    const home = await Home.findOne({
      _id: homeId,
      $or: [{ ownerId: req.user._id }, { 'members.userId': req.user._id }],
    }).select('name');
    if (!home) {
      res.status(403).json({ success: false, message: 'You do not have access to the selected home.' });
      return;
    }

    const devices = await Device.find({ homeId })
      .select('name type roomId esp32Id powerW meterConnected')
      .populate('roomId', 'name')
      .lean();
    const requestedEndExclusive = new Date(requestedEndDate.getTime() + DAY_MS);
    const measurementEnd = requestedEndExclusive < now ? requestedEndExclusive : now;
    const isInProgress = requestedEndExclusive > now;

    const meters = new Map<string, typeof devices>();
    for (const device of devices) {
      const meterDevices = meters.get(device.esp32Id) || [];
      meterDevices.push(device);
      meters.set(device.esp32Id, meterDevices);
    }

    const readings = await Promise.all(Array.from(meters.entries()).map(async ([esp32Id, meterDevices]) => {
      const representative = meterDevices[0];
      const [startReading, endReading] = await Promise.all([
        Telemetry.findOne({ esp32Id, timestamp: { $lte: startDate } })
          .sort({ timestamp: -1, _id: -1 })
          .select('energyKWh timestamp')
          .lean(),
        Telemetry.findOne({ esp32Id, timestamp: { $lte: measurementEnd } })
          .sort({ timestamp: -1, _id: -1 })
          .select('energyKWh timestamp')
          .lean(),
      ]);
      const resetReading = startReading
        ? await Telemetry.findOne({
          esp32Id,
          timestamp: { $gt: startReading.timestamp, $lte: measurementEnd },
          energyKWh: { $lt: startReading.energyKWh },
        })
          .sort({ timestamp: 1, _id: 1 })
          .select('energyKWh timestamp')
          .lean()
        : null;

      const startGapMs = startReading ? startDate.getTime() - startReading.timestamp.getTime() : null;
      const endGapMs = endReading ? measurementEnd.getTime() - endReading.timestamp.getTime() : null;
      let unavailableReason: string | null = null;
      let energyKWh: number | null = null;

      if (isInProgress && !meterDevices.some((device) => device.meterConnected)) {
        unavailableReason = 'The PZEM meter is currently disconnected.';
      } else if (!startReading || !endReading) {
        unavailableReason = 'No meter readings bracket this billing period.';
      } else if (startGapMs! > MAX_BOUNDARY_GAP_MS || endGapMs! > MAX_BOUNDARY_GAP_MS) {
        unavailableReason = 'Meter readings are more than one hour from a billing boundary.';
      } else if (resetReading || endReading.energyKWh < startReading.energyKWh) {
        unavailableReason = 'The cumulative meter reading reset during this billing period.';
      } else {
        energyKWh = Number((endReading.energyKWh - startReading.energyKWh).toFixed(3));
      }

      return {
        id: esp32Id,
        name: meterDevices.length > 1
          ? `Shared PZEM meter (${meterDevices.length} appliances)`
          : representative.name,
        appliances: meterDevices.map((device) => device.name),
        type: meterDevices.length > 1 ? 'Shared PZEM meter' : representative.type,
        room: Array.from(new Set(meterDevices.map((device) => (device.roomId as any)?.name || 'Unassigned'))).join(', '),
        currentPowerW: Math.round(representative.powerW),
        meterConnected: meterDevices.some((device) => device.meterConnected),
        energyKWh,
        measuredFrom: startReading?.timestamp.toISOString() || null,
        measuredThrough: endReading?.timestamp.toISOString() || null,
        unavailableReason,
      };
    }));

    const billableDevices = readings.filter((device) => device.energyKWh !== null);
    if (billableDevices.length === 0) {
      res.status(422).json({
        success: false,
        message: 'There are no reliable PZEM readings for this billing period. Choose dates with readings at both boundaries.',
        devices: readings,
      });
      return;
    }

    res.status(200).json({
      success: true,
      home: { name: home.name },
      period: {
        startDate: startDate.toISOString(),
        endDate: requestedEndExclusive < now ? requestedEndExclusive.toISOString() : now.toISOString(),
        requestedEndDate: requestedEndExclusive.toISOString(),
        isInProgress,
        timezone: 'Asia/Kolkata',
      },
      devices: readings,
      summary: {
        totalEnergyKWh: Number(
          billableDevices.reduce((total, device) => total + (device.energyKWh || 0), 0).toFixed(3)
        ),
        measuredMeterCount: billableDevices.length,
        excludedMeterCount: readings.length - billableDevices.length,
      },
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      message: err.message || 'Unable to calculate metered energy for this billing period.',
    });
  }
};
