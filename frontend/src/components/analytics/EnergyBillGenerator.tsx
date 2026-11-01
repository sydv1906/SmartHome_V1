'use client';

import React, { useMemo, useState } from 'react';
import { Download, FileText, LoaderCircle, MapPin, Plus, Trash2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { fetchApi } from '@/services/api';

interface MeteredDevice {
  id: string;
  name: string;
  appliances: string[];
  type: string;
  room: string;
  currentPowerW: number;
  meterConnected: boolean;
  energyKWh: number | null;
  measuredFrom: string | null;
  measuredThrough: string | null;
  unavailableReason: string | null;
}

interface BillingReadings {
  home: { name: string };
  period: {
    startDate: string;
    endDate: string;
    requestedEndDate: string;
    isInProgress: boolean;
    timezone: string;
  };
  devices: MeteredDevice[];
  summary: {
    totalEnergyKWh: number;
    measuredMeterCount: number;
    excludedMeterCount: number;
  };
}

interface SlabInput {
  upToUnits: string;
  rate: string;
}

interface BillLine {
  id: string;
  appliance: string;
  appliances: string[];
  room: string;
  energyKWh: number;
  currentPowerW: number;
  energyCharge: number;
}

interface GeneratedBill {
  invoiceNumber: string;
  userName: string;
  userEmail: string;
  billingAddress: string;
  homeName: string;
  state: string;
  provider: string;
  category: string;
  startDate: string;
  endDate: string;
  issuedAt: string;
  lines: BillLine[];
  readings: BillingReadings;
  energyCharge: number;
  fuelAdjustment: number;
  fixedCharge: number;
  electricityDuty: number;
  otherCharges: number;
  total: number;
}

interface BillDataResponse {
  success: boolean;
  message?: string;
  home?: { name: string };
  period?: BillingReadings['period'];
  devices?: MeteredDevice[];
  summary?: BillingReadings['summary'];
}

const dateInputValue = (date: Date): string => {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const part = (type: string) => parts.find((value) => value.type === type)?.value || '';
  return `${part('year')}-${part('month')}-${part('day')}`;
};

const formatDate = (date: string): string =>
  new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeZone: 'Asia/Kolkata' }).format(new Date(date));

const formatRupees = (value: number): string =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(value);

const calculateSlabCharge = (units: number, slabs: Array<{ upToUnits: number | null; rate: number }>): number => {
  let previousLimit = 0;
  let remaining = units;
  let total = 0;

  for (const slab of slabs) {
    const slabUnits = slab.upToUnits === null
      ? remaining
      : Math.min(remaining, Math.max(0, slab.upToUnits - previousLimit));
    total += slabUnits * slab.rate;
    remaining -= slabUnits;
    if (slab.upToUnits !== null) previousLimit = slab.upToUnits;
    if (remaining <= 0) break;
  }

  return Number(total.toFixed(2));
};

const drawPdf = (bill: GeneratedBill) => {
  const pageWidth = 595;
  const pageHeight = 842;
  const left = 48;
  const right = 547;
  const pages: string[][] = [[]];
  let pageIndex = 0;
  const blue = [0.145, 0.325, 0.745];
  const slate = [0.2, 0.255, 0.335];
  const muted = [0.39, 0.455, 0.55];
  const currentPage = () => pages[pageIndex];
  const ascii = (value: string) => value
    .replace(/₹/g, 'INR ')
    .replace(/[–—]/g, '-')
    .replace(/[’‘]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/·/g, '-')
    .normalize('NFKD')
    .replace(/[^\x20-\x7E]/g, '');
  const escapePdf = (value: string) => ascii(value).replace(/([\\()])/g, '\\$1');
  const pdfY = (top: number) => pageHeight - top;
  const text = (
    value: string,
    x: number,
    top: number,
    size = 9,
    color: number[] = slate,
    bold = false,
    align: 'left' | 'right' = 'left'
  ) => {
    const printable = escapePdf(value);
    const adjustedX = align === 'right' ? x - printable.length * size * 0.5 : x;
    currentPage().push(
      `BT /${bold ? 'F2' : 'F1'} ${size} Tf ${color.join(' ')} rg 1 0 0 1 ${adjustedX.toFixed(2)} ${pdfY(top).toFixed(2)} Tm (${printable}) Tj ET`
    );
  };
  const rect = (x: number, top: number, width: number, height: number, color: number[]) => {
    currentPage().push(
      `${color.join(' ')} rg ${x} ${(pageHeight - top - height).toFixed(2)} ${width} ${height} re f`
    );
  };
  const line = (x1: number, top1: number, x2: number, top2: number, color: number[], width = 0.6) => {
    currentPage().push(
      `${color.join(' ')} RG ${width} w ${x1} ${pdfY(top1).toFixed(2)} m ${x2} ${pdfY(top2).toFixed(2)} l S`
    );
  };
  const newPage = () => {
    pageIndex += 1;
    pages.push([]);
    drawHeader(true);
  };
  const drawHeader = (continuation = false) => {
    rect(left, 18, 38, 38, blue);
    text('S', left + 14, 44, 21, [1, 1, 1], true);
    text('SmartHome AI', left + 49, 35, 18, slate, true);
    text(continuation ? 'ENERGY BILL ESTIMATE - CONTINUED' : 'METERED HOME ENERGY STATEMENT', left + 49, 49, 8, muted);
    if (!continuation) {
      text(`INVOICE ${bill.invoiceNumber}`, right, 31, 10, blue, true, 'right');
      text(`Issued ${formatDate(bill.issuedAt)}`, right, 43, 8, slate, false, 'right');
      text(`${formatDate(bill.startDate)} - ${formatDate(bill.endDate)}`, right, 54, 8, slate, false, 'right');
    }
    line(left, 68, right, 68, blue, 1.2);
  };
  const drawTableHeader = (top: number) => {
    rect(left, top - 12, right - left, 24, [0.945, 0.96, 0.975]);
    text('APPLIANCE / ROOM', left + 6, top + 4, 8, blue, true);
    text('USAGE', 365, top + 4, 8, blue, true, 'right');
    text('LIVE LOAD', 430, top + 4, 8, blue, true, 'right');
    text('ENERGY CHARGE', right - 5, top + 4, 8, blue, true, 'right');
  };

  drawHeader();
  text('BILL TO', left, 88, 8, blue, true);
  text('BILL FROM', right, 88, 8, blue, true, 'right');
  text(bill.userName, left, 101, 9, slate, true);
  text(bill.billingAddress || 'Address not provided', left, 113, 8, muted);
  text(bill.userEmail, left, 125, 8, muted);
  text(bill.provider, right, 101, 9, slate, true, 'right');
  text(`${bill.state} - ${bill.category}`, right, 113, 8, muted, false, 'right');
  text(bill.homeName, right, 125, 8, muted, false, 'right');
  line(left, 138, right, 138, [0.8, 0.84, 0.89]);
  text('METERED APPLIANCE USAGE', left, 154, 8, blue, true);
  text('Each physical PZEM meter is counted once; shared meters cover all listed appliances.', left, 167, 8, muted);

  let y = 187;
  drawTableHeader(y);
  y += 27;
  for (const billLine of bill.lines) {
    if (y > 740) {
      newPage();
      y = 94;
      drawTableHeader(y);
      y += 27;
    }
    const sharedMeter = billLine.appliances.length > 1;
    text(billLine.appliance.slice(0, 48), left + 6, y, 8.5, slate, true);
    text((sharedMeter ? billLine.appliances.join(', ') : billLine.room).slice(0, 62), left + 6, y + 11, 7.5, muted);
    if (sharedMeter) text(billLine.room.slice(0, 48), left + 6, y + 21, 7.5, muted);
    text(`${billLine.energyKWh.toFixed(3)} kWh`, 365, y + 5, 8, slate, false, 'right');
    text(`${billLine.currentPowerW} W`, 430, y + 5, 8, slate, false, 'right');
    text(`INR ${billLine.energyCharge.toFixed(2)}`, right - 5, y + 5, 8, slate, false, 'right');
    const rowHeight = sharedMeter ? 31 : 25;
    line(left, y + rowHeight - 4, right, y + rowHeight - 4, [0.88, 0.9, 0.93], 0.4);
    y += rowHeight;
  }

  if (y > 650) {
    newPage();
    y = 94;
  }
  y += 5;
  const summaryTop = y;
  rect(left, summaryTop, 230, 104, [0.93, 0.945, 0.96]);
  rect(left + 230, summaryTop, right - left - 230, 104, blue);
  text('METERING & TARIFF BASIS', left + 12, summaryTop + 18, 8, slate, true);
  text(`${bill.readings.summary.measuredMeterCount} meter(s) with boundary readings`, left + 12, summaryTop + 34, 7.5, slate);
  text(`${bill.readings.summary.excludedMeterCount} meter(s) excluded`, left + 12, summaryTop + 47, 7.5, slate);
  text('User-entered provider rates - progressive slabs', left + 12, summaryTop + 60, 7.5, slate);
  text('Estimate only - not issued by the electricity utility', left + 12, summaryTop + 73, 7.5, [0.65, 0.3, 0.08]);
  text(`${bill.readings.summary.totalEnergyKWh.toFixed(3)} kWh metered consumption`, left + 12, summaryTop + 87, 7.5, slate);

  const totals: Array<[string, number]> = [
    ['ENERGY CHARGES', bill.energyCharge + bill.fuelAdjustment],
    ['FIXED CHARGES', bill.fixedCharge],
    ['ELECTRICITY DUTY', bill.electricityDuty],
    ['OTHER CHARGES / CREDIT', bill.otherCharges],
  ];
  totals.forEach(([label, amount], index) => {
    const rowY = summaryTop + 17 + index * 15;
    text(label, left + 242, rowY, 7.5, [1, 1, 1], true);
    text(`INR ${amount.toFixed(2)}`, right - 10, rowY, 7.5, [1, 1, 1], false, 'right');
  });
  line(left + 242, summaryTop + 79, right - 10, summaryTop + 79, [1, 1, 1], 0.5);
  text(bill.total < 0 ? 'CREDIT' : 'TOTAL DUE', left + 242, summaryTop + 96, 9, [1, 1, 1], true);
  text(`INR ${Math.abs(bill.total).toFixed(2)}`, right - 10, summaryTop + 96, 9, [1, 1, 1], true, 'right');

  const disclaimerTop = summaryTop + 120;
  if (disclaimerTop > 790) newPage();
  const finalDisclaimerTop = disclaimerTop > 790 ? 100 : disclaimerTop;
  text('IMPORTANT', left, finalDisclaimerTop, 8, slate, true);
  text('This SmartHome AI estimate uses available PZEM readings and user-entered tariff details.', left, finalDisclaimerTop + 13, 7, muted);
  text('It is not an official electricity bill. Confirm rates, duties, subsidies and adjustments with your provider.', left, finalDisclaimerTop + 24, 7, muted);

  const pageCount = pages.length;
  pages.forEach((commands, index) => {
    commands.push(
      `BT /F1 7 Tf ${muted.join(' ')} rg 1 0 0 1 ${left} ${pdfY(pageHeight - 23).toFixed(2)} Tm (${escapePdf(`SmartHome AI - ${bill.invoiceNumber}`)}) Tj ET`
    );
    const pageLabel = `${index + 1} / ${pageCount}`;
    commands.push(
      `BT /F1 7 Tf ${muted.join(' ')} rg 1 0 0 1 ${(right - pageLabel.length * 3.5).toFixed(2)} ${pdfY(pageHeight - 23).toFixed(2)} Tm (${escapePdf(pageLabel)}) Tj ET`
    );
  });

  const objects: string[] = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    `<< /Type /Pages /Kids [${pages.map((_, index) => `${5 + index * 2} 0 R`).join(' ')}] /Count ${pages.length} >>`,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>',
  ];
  pages.forEach((commands, index) => {
    const pageId = 5 + index * 2;
    const contentId = pageId + 1;
    const stream = commands.join('\n');
    objects.push(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${contentId} 0 R >>`,
      `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`
    );
  });

  let document = '%PDF-1.4\n';
  const offsets = [0];
  objects.forEach((object, index) => {
    offsets.push(document.length);
    document += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });
  const xrefOffset = document.length;
  document += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  offsets.slice(1).forEach((offset) => {
    document += `${String(offset).padStart(10, '0')} 00000 n \n`;
  });
  document += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  const blob = new Blob([document], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const link = window.document.createElement('a');
  link.href = url;
  link.download = `${bill.invoiceNumber}.pdf`;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
};

export const EnergyBillGenerator: React.FC = () => {
  const { user } = useAuth();
  const today = dateInputValue(new Date());
  const [startDate, setStartDate] = useState(`${today.slice(0, 7)}-01`);
  const [endDate, setEndDate] = useState(today);
  const [state, setState] = useState('');
  const [provider, setProvider] = useState('');
  const [category, setCategory] = useState('Domestic / Residential');
  const [customCategory, setCustomCategory] = useState('');
  const [billingAddress, setBillingAddress] = useState(user?.homeAddress || '');
  const [slabs, setSlabs] = useState<SlabInput[]>([{ upToUnits: '', rate: '' }]);
  const [fixedCharge, setFixedCharge] = useState('0');
  const [dutyPercent, setDutyPercent] = useState('0');
  const [fuelAdjustment, setFuelAdjustment] = useState('0');
  const [otherCharges, setOtherCharges] = useState('0');
  const [detectingLocation, setDetectingLocation] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [bill, setBill] = useState<GeneratedBill | null>(null);

  const effectiveCategory = category === 'Other' ? customCategory.trim() : category;
  const updateSlab = (index: number, field: keyof SlabInput, value: string) => {
    setSlabs((current) => current.map((slab, slabIndex) =>
      slabIndex === index ? { ...slab, [field]: value } : slab
    ));
  };

  const locateState = async () => {
    if (!navigator.geolocation) {
      setError('Location detection is not supported. Enter your state manually.');
      return;
    }

    setDetectingLocation(true);
    setError('');
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          const query = new URLSearchParams({
            format: 'jsonv2',
            lat: String(coords.latitude),
            lon: String(coords.longitude),
            zoom: '10',
            addressdetails: '1',
          });
          const response = await fetch(`https://nominatim.openstreetmap.org/reverse?${query}`, {
            headers: { Accept: 'application/json' },
          });
          if (!response.ok) throw new Error('Could not look up your location.');
          const result = await response.json();
          const address = result.address || {};
          const detectedState = address.state || address.region;
          if (!detectedState) throw new Error('Could not detect a state. Enter it manually.');
          setState(detectedState);
          const locationParts = [address.house_number, address.road, address.city || address.town || address.village, detectedState, address.postcode].filter(Boolean);
          if (locationParts.length) setBillingAddress(locationParts.join(', '));
        } catch (locationError) {
          setError(locationError instanceof Error ? locationError.message : 'Could not detect your state.');
        } finally {
          setDetectingLocation(false);
        }
      },
      () => {
        setError('Location permission was denied. Enter your state manually.');
        setDetectingLocation(false);
      },
      { enableHighAccuracy: false, maximumAge: 300000, timeout: 10000 }
    );
  };

  const generateBill = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setBill(null);

    if (!user) {
      setError('Sign in before generating an energy bill.');
      return;
    }
    if (!provider.trim() || !state.trim() || !effectiveCategory) {
      setError('Enter your state, electricity provider, and consumer category.');
      return;
    }
    if (startDate > endDate) {
      setError('The billing start date must be on or before the end date.');
      return;
    }
    if (startDate > today) {
      setError('The billing start date cannot be in the future.');
      return;
    }

    const parsedSlabs: Array<{ upToUnits: number | null; rate: number }> = [];
    for (let index = 0; index < slabs.length; index += 1) {
      const slab = slabs[index];
      const rate = Number(slab.rate);
      const upToUnits = slab.upToUnits.trim() ? Number(slab.upToUnits) : null;
      if (!slab.rate.trim() || !Number.isFinite(rate) || rate < 0) {
        setError(`Enter a valid non-negative rate for slab ${index + 1}.`);
        return;
      }
      if (upToUnits !== null && (!Number.isFinite(upToUnits) || upToUnits <= 0)) {
        setError(`Enter a valid upper unit limit for slab ${index + 1}.`);
        return;
      }
      if (index < slabs.length - 1 && upToUnits === null) {
        setError('Only the final slab can have no upper unit limit.');
        return;
      }
      if (index === slabs.length - 1 && upToUnits !== null) {
        setError('Leave the final slab limit blank so all remaining units are charged.');
        return;
      }
      if (
        upToUnits !== null &&
        parsedSlabs.length > 0 &&
        parsedSlabs[parsedSlabs.length - 1].upToUnits !== null &&
        upToUnits <= parsedSlabs[parsedSlabs.length - 1].upToUnits!
      ) {
        setError('Each slab limit must be greater than the previous limit.');
        return;
      }
      parsedSlabs.push({ upToUnits, rate });
    }

    const charges = [fixedCharge, dutyPercent, fuelAdjustment, otherCharges].map(Number);
    if (charges.slice(0, 3).some((value) => !Number.isFinite(value) || value < 0) || !Number.isFinite(charges[3])) {
      setError('Enter valid charges. Other charges / adjustments may be negative to represent a credit.');
      return;
    }

    setLoading(true);
    try {
      const result = await fetchApi<BillDataResponse>(
        `/analytics/billing-consumption?startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}`
      );
      if (!result.success || !result.home || !result.period || !result.devices || !result.summary) {
        throw new Error(result.message || 'Meter readings could not be loaded.');
      }

      const readings: BillingReadings = {
        home: result.home,
        period: result.period,
        devices: result.devices,
        summary: result.summary,
      };
      const units = readings.summary.totalEnergyKWh;
      const energyCharge = calculateSlabCharge(units, parsedSlabs);
      const fuelCharge = Number((units * charges[2]).toFixed(2));
      const duty = Number(((energyCharge + fuelCharge) * charges[1] / 100).toFixed(2));
      const total = Number((energyCharge + fuelCharge + charges[0] + duty + charges[3]).toFixed(2));
      const measuredDevices = readings.devices.filter(
        (device): device is MeteredDevice & { energyKWh: number } => device.energyKWh !== null
      );
      const variableEnergyCharges = energyCharge + fuelCharge;
      const lines: BillLine[] = measuredDevices.map((device) => ({
        id: device.id,
        appliance: device.name,
        appliances: device.appliances,
        room: device.room,
        energyKWh: device.energyKWh,
        currentPowerW: device.currentPowerW,
        energyCharge: units > 0
          ? Number((variableEnergyCharges * device.energyKWh / units).toFixed(2))
          : 0,
      }));

      setBill({
        invoiceNumber: `SHAI-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`,
        userName: user.name,
        userEmail: user.email,
        billingAddress: billingAddress.trim() || user.homeAddress || 'Address not provided',
        homeName: readings.home.name,
        state: state.trim(),
        provider: provider.trim(),
        category: effectiveCategory,
        startDate: readings.period.startDate,
        endDate: readings.period.endDate,
        issuedAt: new Date().toISOString(),
        lines,
        readings,
        energyCharge,
        fuelAdjustment: fuelCharge,
        fixedCharge: charges[0],
        electricityDuty: duty,
        otherCharges: charges[3],
        total,
      });
    } catch (billError) {
      setError(billError instanceof Error ? billError.message : 'Could not generate the bill.');
    } finally {
      setLoading(false);
    }
  };

  const excludedDevices = useMemo(
    () => bill?.readings.devices.filter((device) => device.energyKWh === null) || [],
    [bill]
  );

  return (
    <section className="glass-panel space-y-5 rounded-2xl p-4 sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-cyan-500" />
            <h3 className="text-base font-bold text-white">Generate electricity bill</h3>
          </div>
          <p className="mt-1 max-w-3xl text-xs leading-relaxed text-gray-400">
            Create a SmartHome AI estimate from PZEM readings for the selected dates. Enter the rates shown on your provider’s tariff schedule; this is not an official utility bill.
          </p>
        </div>
      </div>

      <form onSubmit={generateBill} className="space-y-5">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="space-y-1 text-xs text-gray-400">
            Billing start date (IST)
            <input
              type="date"
              required
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
              className="w-full rounded-xl border border-gray-700 bg-gray-900 px-3 py-2.5 text-sm text-white"
            />
          </label>
          <label className="space-y-1 text-xs text-gray-400">
            Billing end date (IST)
            <input
              type="date"
              required
              value={endDate}
              onChange={(event) => setEndDate(event.target.value)}
              className="w-full rounded-xl border border-gray-700 bg-gray-900 px-3 py-2.5 text-sm text-white"
            />
          </label>
          <label className="space-y-1 text-xs text-gray-400">
            State / union territory
            <span className="flex gap-2">
              <input
                required
                value={state}
                onChange={(event) => setState(event.target.value)}
                placeholder="Detect location or enter state"
                className="min-w-0 flex-1 rounded-xl border border-gray-700 bg-gray-900 px-3 py-2.5 text-sm text-white"
              />
              <button
                type="button"
                onClick={locateState}
                disabled={detectingLocation}
                aria-label="Detect state using current location"
                title="Detect state using current location"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-gray-700 bg-gray-800 text-cyan-400 hover:bg-gray-700 disabled:opacity-50"
              >
                {detectingLocation ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <MapPin className="h-4 w-4" />}
              </button>
            </span>
          </label>
          <label className="space-y-1 text-xs text-gray-400">
            Electricity provider / DISCOM
            <input
              required
              value={provider}
              onChange={(event) => setProvider(event.target.value)}
              list="indian-electricity-providers"
              placeholder="e.g. BESCOM, Tata Power"
              className="w-full rounded-xl border border-gray-700 bg-gray-900 px-3 py-2.5 text-sm text-white"
            />
            <datalist id="indian-electricity-providers">
              <option value="BESCOM" />
              <option value="KSEB" />
              <option value="MSEDCL" />
              <option value="Tata Power" />
              <option value="BSES Rajdhani Power" />
              <option value="BSES Yamuna Power" />
              <option value="TPDDL" />
              <option value="Adani Electricity Mumbai" />
              <option value="TANGEDCO" />
              <option value="TSSPDCL" />
              <option value="UPPCL" />
              <option value="PSPCL" />
              <option value="CESC" />
              <option value="WBSEDCL" />
              <option value="Other provider" />
            </datalist>
          </label>
          <label className="space-y-1 text-xs text-gray-400">
            Consumer category
            <select
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              className="w-full rounded-xl border border-gray-700 bg-gray-900 px-3 py-2.5 text-sm text-white"
            >
              <option>Domestic / Residential</option>
              <option>Domestic - BPL</option>
              <option>Other</option>
            </select>
          </label>
          {category === 'Other' && (
            <label className="space-y-1 text-xs text-gray-400">
              Enter consumer category
              <input
                required
                value={customCategory}
                onChange={(event) => setCustomCategory(event.target.value)}
                placeholder="Enter your category"
                className="w-full rounded-xl border border-gray-700 bg-gray-900 px-3 py-2.5 text-sm text-white"
              />
            </label>
          )}
          <label className="space-y-1 text-xs text-gray-400 sm:col-span-2">
            Billing address
            <input
              value={billingAddress}
              onChange={(event) => setBillingAddress(event.target.value)}
              placeholder="Address printed on the estimate"
              className="w-full rounded-xl border border-gray-700 bg-gray-900 px-3 py-2.5 text-sm text-white"
            />
          </label>
        </div>

        <div className="space-y-3 rounded-xl border border-gray-800 bg-gray-900/40 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h4 className="text-sm font-semibold text-white">Provider tariff rates</h4>
              <p className="text-[11px] text-gray-400">Enter progressive slab rates from your provider’s current schedule (₹ per kWh).</p>
            </div>
            <button
              type="button"
              onClick={() => setSlabs((current) => [...current, { upToUnits: '', rate: '' }])}
              className="flex items-center gap-1 rounded-lg border border-gray-700 px-3 py-2 text-xs font-medium text-cyan-500 hover:bg-gray-800"
            >
              <Plus className="h-3.5 w-3.5" />
              Add slab
            </button>
          </div>

          <div className="space-y-2">
            {slabs.map((slab, index) => (
              <div key={index} className="grid grid-cols-[1fr_1fr_auto] items-end gap-2">
                <label className="space-y-1 text-[11px] text-gray-400">
                  {index === slabs.length - 1 ? 'Up to units (blank = no limit)' : 'Up to units'}
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={slab.upToUnits}
                    onChange={(event) => updateSlab(index, 'upToUnits', event.target.value)}
                    placeholder={index === slabs.length - 1 ? 'No limit' : 'e.g. 100'}
                    className="w-full rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white"
                  />
                </label>
                <label className="space-y-1 text-[11px] text-gray-400">
                  Rate (₹ / kWh)
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={slab.rate}
                    onChange={(event) => updateSlab(index, 'rate', event.target.value)}
                    placeholder="e.g. 4.50"
                    className="w-full rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white"
                  />
                </label>
                <button
                  type="button"
                  disabled={slabs.length === 1}
                  onClick={() => setSlabs((current) => current.filter((_, slabIndex) => slabIndex !== index))}
                  aria-label={`Remove slab ${index + 1}`}
                  className="mb-0.5 flex h-9 w-9 items-center justify-center rounded-lg border border-gray-700 text-gray-400 hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-30"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <label className="space-y-1 text-[11px] text-gray-400">
              Fixed charge for this period (₹)
              <input type="number" min="0" step="0.01" value={fixedCharge} onChange={(event) => setFixedCharge(event.target.value)} className="w-full rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white" />
            </label>
            <label className="space-y-1 text-[11px] text-gray-400">
              Fuel adjustment (₹ / kWh)
              <input type="number" min="0" step="0.01" value={fuelAdjustment} onChange={(event) => setFuelAdjustment(event.target.value)} className="w-full rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white" />
            </label>
            <label className="space-y-1 text-[11px] text-gray-400">
              Electricity duty (%)
              <input type="number" min="0" step="0.01" value={dutyPercent} onChange={(event) => setDutyPercent(event.target.value)} className="w-full rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white" />
            </label>
            <label className="space-y-1 text-[11px] text-gray-400">
              Other charges / credits (₹)
              <input type="number" step="0.01" value={otherCharges} onChange={(event) => setOtherCharges(event.target.value)} className="w-full rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white" />
            </label>
          </div>
          <p className="text-[10px] leading-relaxed text-gray-500">
            Slab charges are calculated progressively; fixed charges are for this billing period. Electricity duty is applied to energy charges plus fuel adjustment. Confirm all figures against your provider’s official tariff.
          </p>
        </div>

        {error && <p role="alert" className="rounded-xl border border-rose-500/20 bg-rose-500/5 px-3 py-2 text-xs text-rose-500">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 px-5 py-2.5 text-sm font-semibold text-white shadow-glowCyan hover:opacity-90 disabled:cursor-wait disabled:opacity-60"
        >
          {loading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
          {loading ? 'Reading PZEM data…' : '1. Generate bill & preview'}
        </button>
      </form>

      {bill && (
        <div className="space-y-4 border-t border-gray-800 pt-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h4 className="text-sm font-bold text-white">2. Bill preview</h4>
              <p className="text-xs text-gray-400">{bill.invoiceNumber} · {bill.provider}</p>
            </div>
            <button
              type="button"
              onClick={() => drawPdf(bill)}
              className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-blue-500"
            >
              <Download className="h-4 w-4" />
              3. Download PDF
            </button>
          </div>

          {bill.readings.period.isInProgress && (
            <p className="rounded-xl border border-amber-500/30 bg-amber-500/5 px-3 py-2 text-xs text-amber-500">
              This billing period is still in progress. Readings are included only through {formatDate(bill.readings.period.endDate)}.
            </p>
          )}
          {excludedDevices.length > 0 && (
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 px-3 py-2 text-xs text-amber-600 dark:text-amber-300">
              <p className="font-semibold">{excludedDevices.length} appliance(s) excluded because boundary readings are missing or unreliable.</p>
              <ul className="mt-1 list-inside list-disc">
                {excludedDevices.map((device) => <li key={device.id}>{device.name}: {device.unavailableReason}</li>)}
              </ul>
            </div>
          )}

          <div className="mx-auto max-w-3xl overflow-hidden border border-slate-200 bg-white text-slate-700 shadow-xl">
            <div className="p-5 sm:p-8">
              <div className="flex flex-wrap items-start justify-between gap-4 border-b-2 border-blue-700 pb-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-700 text-xl font-black text-white">S</div>
                  <div>
                    <h5 className="text-lg font-bold text-slate-900">SmartHome AI</h5>
                    <p className="text-[10px] uppercase tracking-wider text-slate-500">Metered energy estimate</p>
                  </div>
                </div>
                <div className="text-right text-xs">
                  <p className="font-bold text-blue-700">#{bill.invoiceNumber}</p>
                  <p className="mt-1">Issued: {formatDate(bill.issuedAt)}</p>
                  <p>{formatDate(bill.startDate)} – {formatDate(bill.endDate)}</p>
                </div>
              </div>

              <div className="grid gap-5 border-b border-slate-200 py-5 text-xs sm:grid-cols-2">
                <div className="space-y-1">
                  <p className="mb-2 font-bold uppercase text-blue-700">Bill to</p>
                  <p className="font-semibold text-slate-900">{bill.userName}</p>
                  <p>{bill.billingAddress}</p>
                  <p>{bill.userEmail}</p>
                </div>
                <div className="space-y-1 sm:text-right">
                  <p className="mb-2 font-bold uppercase text-blue-700">Bill from</p>
                  <p className="font-semibold text-slate-900">{bill.provider}</p>
                  <p>{bill.state} · {bill.category}</p>
                  <p>{bill.homeName}</p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="my-4 w-full min-w-[560px] text-left text-xs">
                  <thead>
                    <tr className="border-b border-blue-700 text-[10px] font-bold uppercase text-blue-700">
                      <th className="py-2 pr-2">Description</th>
                      <th className="px-2 py-2 text-right">Usage</th>
                      <th className="px-2 py-2 text-right">Live load</th>
                      <th className="py-2 pl-2 text-right">Energy charge</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bill.lines.map((line) => (
                      <tr key={line.id} className="border-b border-slate-100">
                        <td className="py-3 pr-2">
                          <p className="font-semibold text-slate-800">{line.appliance}</p>
                          {line.appliances.length > 1 && (
                            <p className="mt-0.5 text-[10px] text-slate-500">{line.appliances.join(', ')}</p>
                          )}
                          <p className="mt-0.5 text-[10px] text-slate-500">{line.room}</p>
                        </td>
                        <td className="px-2 py-3 text-right">{line.energyKWh.toFixed(3)} kWh</td>
                        <td className="px-2 py-3 text-right">{line.currentPowerW} W</td>
                        <td className="py-3 pl-2 text-right">{formatRupees(line.energyCharge)}</td>
                      </tr>
                    ))}
                    {bill.lines.length === 0 && (
                      <tr><td colSpan={4} className="py-4 text-center text-slate-500">No measured appliance usage in this period.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="grid overflow-hidden sm:grid-cols-2">
                <div className="bg-slate-100 p-4 text-[11px]">
                  <p className="font-bold uppercase text-slate-800">Meter & tariff basis</p>
                  <p className="mt-2">{bill.readings.summary.measuredMeterCount} meter(s) with reliable boundary readings</p>
                  <p>{bill.readings.summary.totalEnergyKWh.toFixed(3)} kWh metered consumption</p>
                  <p>Progressive slabs entered by user</p>
                  <p className="mt-2 font-semibold text-amber-700">Estimate only — not a utility-issued bill</p>
                </div>
                <div className="space-y-2 bg-blue-700 p-4 text-xs text-white">
                  <div className="flex justify-between"><span>Energy charges</span><span>{formatRupees(bill.energyCharge + bill.fuelAdjustment)}</span></div>
                  <div className="flex justify-between"><span>Fixed charges</span><span>{formatRupees(bill.fixedCharge)}</span></div>
                  <div className="flex justify-between"><span>Electricity duty</span><span>{formatRupees(bill.electricityDuty)}</span></div>
                  <div className="flex justify-between"><span>Other charges / credits</span><span>{formatRupees(bill.otherCharges)}</span></div>
                  <div className="flex justify-between border-t border-white/40 pt-2 text-sm font-bold"><span>{bill.total < 0 ? 'Credit' : 'Total due'}</span><span>{formatRupees(Math.abs(bill.total))}</span></div>
                </div>
              </div>

              <p className="mt-4 text-[10px] leading-relaxed text-slate-500">
                This SmartHome AI estimate uses available PZEM readings and tariff details entered by the user. Confirm provider rates, duties, subsidies, and adjustments with your electricity provider.
              </p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
