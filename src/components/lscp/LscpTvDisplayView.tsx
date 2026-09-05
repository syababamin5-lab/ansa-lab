import React, { useState, useEffect } from 'react';
import { PurchaseOrder, MatrixTestInfo } from '../../types';
import { getPODeadlineStatus } from '../../utils/helpers';
import {
  Activity,
  Tv,
  Maximize2,
  Minimize2,
  Copy,
  Check,
  Clock,
  Building2,
  Users,
  AlertTriangle,
  ExternalLink,
  Radio,
  Flame,
  Wrench,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';

export interface LscpTvDisplayViewProps {
  pos: PurchaseOrder[];
  testCatalogue: MatrixTestInfo[];
  onSwitchToLims?: () => void;
}

export const LscpTvDisplayView: React.FC<LscpTvDisplayViewProps> = ({
  pos,
  testCatalogue,
  onSwitchToLims
}) => {
  const [currentTvTime, setCurrentTvTime] = useState<string>('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);

  // TV Wall URL
  const tvUrl = window.location.href.split('?')[0] + '?mode=tv-lscp';

  // Live Clock Effect with Seconds
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      const dateStr = now.toLocaleDateString('id-ID', {
        weekday: 'long',
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
      const timeStr = now.toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      }) + ' WIB';
      setCurrentTvTime(`${dateStr} • ${timeStr}`);
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  // Handle Fullscreen API
  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(console.error);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().then(() => setIsFullscreen(false)).catch(console.error);
      }
    }
  };

  // Handle Copy URL
  const handleCopyTvUrl = () => {
    navigator.clipboard.writeText(tvUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2500);
  };

  // Calculated Real-Time Metrics from active POs
  const totalActiveSamples = pos.reduce((acc, po) => acc + po.samples.length, 0);
  const urgentCount = pos.filter(po => getPODeadlineStatus(po.deadline).status === 'urgent').length;

  // Equipment Master List with short names
  const equipmentList = [
    { id: 'eq-oven-1', name: 'Oven-01', room: 'PREPARATION', status: 'In Use', usage: 85, availableTime: '14:30', assignedSample: 'UDS-001', tempReading: '110°C ± 5°C' },
    { id: 'eq-oven-2', name: 'Oven-02', room: 'PREPARATION', status: 'Available', usage: 0, availableTime: 'Sekarang', tempReading: '25°C' },
    { id: 'eq-compactor', name: 'Soil Compactor', room: 'COMPACTION', status: 'Reserved', usage: 60, availableTime: '13:00', assignedSample: 'BS-002' },
    { id: 'eq-oedometer', name: 'Oedometer 1-6', room: 'MECHANICAL', status: 'In Use', usage: 90, availableTime: 'Besok 10:00', assignedSample: 'UDS-004' },
    { id: 'eq-triaxial', name: 'Triaxial Cell-01', room: 'MECHANICAL', status: 'Available', usage: 0, availableTime: 'Sekarang' },
    { id: 'eq-ds', name: 'Direct Shear-01', room: 'MECHANICAL', status: 'Reserved', usage: 50, availableTime: '15:00', assignedSample: 'DS-010' },
    { id: 'eq-curing', name: 'Curing Tank', room: 'CURING', status: 'In Use', usage: 100, availableTime: 'Penuh', tempReading: '20°C ± 2°C' },
    { id: 'eq-balance', name: 'Moisture Balance', room: 'MECHANICAL', status: 'Available', usage: 0, availableTime: 'Sekarang' },
  ];

  // SDM Workload Data
  const sdmWorkload = [
    { id: 'ao-1', code: 'AO#1', name: 'Rafi', role: 'Analis 1', bookedTcu: 7.5, maxTcu: 8.0, percent: 94, status: 'Full', initials: 'RF', avatarBg: 'bg-slate-800' },
    { id: 'ao-2', code: 'AO#2', name: 'Rizki', role: 'Analis 2', bookedTcu: 5.0, maxTcu: 8.0, percent: 63, status: 'Medium', initials: 'RZ', avatarBg: 'bg-teal-700' },
    { id: 'ao-3', code: 'AO#3', name: 'Rasya', role: 'Analis 3', bookedTcu: 2.5, maxTcu: 8.0, percent: 31, status: 'Available', initials: 'RS', avatarBg: 'bg-emerald-700' },
    { id: 'ao-4', code: 'AO#4', name: 'Noval', role: 'Kepala Teknis', bookedTcu: 2.0, maxTcu: 8.0, percent: 25, status: 'Available', initials: 'NV', avatarBg: 'bg-indigo-700' },
    { id: 'ao-5', code: 'AO#5', name: 'Asisten Lab', role: 'Junior Analyst', bookedTcu: 3.0, maxTcu: 8.0, percent: 38, status: 'Available', initials: 'AL', avatarBg: 'bg-slate-600' },
  ];

  // System Bottlenecks / Alerts List
  const alertsList = [
    { id: 'al-1', level: 'danger', title: 'Oven-01 Overloaded', detail: 'Kapasitas oven pengeringan maksimum, estimasi delay 2 jam.', time: '10:20' },
    { id: 'al-2', level: 'warning', title: 'Oedometer Fully Booked', detail: 'Alat konsolidasi terisi penuh s.d. besok jam 10:00.', time: '10:15' },
    { id: 'al-3', level: 'warning', title: 'Soil Compactor Reserved', detail: 'Persiapan uji Pemadatan Proctor jam 13:00.', time: '10:10' },
  ];

  // Sample Queue Items with Soft Executive Badges
  const sampleQueue = [
    { sampleId: 'DS-001', method: 'Compaction (Pemadatan)', status: 'Testing', priority: 'HIGH', badgeClass: 'bg-rose-50 text-rose-800 border border-rose-200/80 font-bold' },
    { sampleId: 'UDS-004', method: 'Consolidation (Konsolidasi)', status: 'Waiting', priority: 'HIGH', badgeClass: 'bg-rose-50 text-rose-800 border border-rose-200/80 font-bold' },
    { sampleId: 'DS-008', method: 'CBR Soaked 4-Hari', status: 'Soaking', priority: 'MEDIUM', badgeClass: 'bg-amber-50 text-amber-800 border border-amber-200/80 font-bold' },
    { sampleId: 'BS-002', method: 'UCT (Unconfined Comp.)', status: 'Ready', priority: 'MEDIUM', badgeClass: 'bg-amber-50 text-amber-800 border border-amber-200/80 font-bold' },
    { sampleId: 'DS-010', method: 'Direct Shear Motorized', status: 'Waiting', priority: 'LOW', badgeClass: 'bg-emerald-50 text-emerald-800 border border-emerald-200/80 font-bold' },
  ];

  return (
    <div className="fixed inset-0 z-[9999] h-screen w-screen bg-slate-50 text-slate-800 font-sans selection:bg-teal-500 selection:text-white flex flex-col justify-between overflow-hidden p-0 m-0">
      {/* ===================================================================== */}
      {/* ULTRA-PREMIUM EXECUTIVE TOP NAVBAR HEADER                              */}
      {/* ===================================================================== */}
      <header className="w-full bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white px-5 py-2.5 shrink-0 shadow-md">
        <div className="w-full flex items-center justify-between gap-4">
          
          {/* BRANDING LOGO & TITLE */}
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-white shadow-2xs shrink-0">
              <Tv className="w-5 h-5 text-emerald-300 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-black text-white tracking-tight flex items-center gap-2">
                  <span>ANSA LAB SMART TV DISPLAY</span>
                  <span className="px-2.5 py-0.5 rounded-full bg-white/10 backdrop-blur-md text-emerald-200 font-mono text-[10px] font-extrabold border border-white/20 uppercase tracking-wider flex items-center gap-1.5 shadow-2xs">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    LIVE TV WALL
                  </span>
                </h1>
              </div>
              <p className="text-[11px] text-slate-300 font-medium leading-none mt-0.5">
                PT. Terraforma Geoteknik Indonesia — Laboratorium Mekanika Tanah &amp; Batuan
              </p>
            </div>
          </div>

          {/* REALTIME TICKING CLOCK & CONTROLS */}
          <div className="flex items-center gap-2.5">
            <div className="bg-white/10 backdrop-blur-md border border-white/20 px-3 py-1.5 rounded-2xl flex items-center gap-2 text-xs text-white shadow-inner">
              <Clock className="w-4 h-4 text-emerald-300 shrink-0" />
              <span className="font-mono font-black text-white text-xs sm:text-sm tracking-tight">{currentTvTime || 'Memuat waktu...'}</span>
            </div>

            <button
              onClick={handleCopyTvUrl}
              className="px-3 py-1.5 bg-white text-emerald-950 hover:bg-slate-100 rounded-xl text-xs font-extrabold transition flex items-center gap-1.5 shadow-sm cursor-pointer"
              title="Salin Link TV Display untuk Smart TV Browser"
            >
              {copiedUrl ? <Check className="w-4 h-4 text-emerald-700" /> : <Copy className="w-4 h-4 text-slate-700" />}
              <span className="hidden lg:inline">{copiedUrl ? 'URL Tersalin!' : 'Salin URL'}</span>
            </button>

            <button
              onClick={handleToggleFullscreen}
              className="px-3 py-1.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-xl text-xs font-black transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
              title="Tampilkan Fullscreen TV"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              <span className="hidden sm:inline">{isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}</span>
            </button>

            {onSwitchToLims && (
              <button
                onClick={onSwitchToLims}
                className="px-3 py-1.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-xl text-xs font-extrabold transition flex items-center gap-1.5 cursor-pointer"
              >
                <ExternalLink className="w-4 h-4 text-emerald-300" />
                <span className="hidden md:inline">Masuk LIMS</span>
              </button>
            )}
          </div>

        </div>
      </header>

      {/* ===================================================================== */}
      {/* 100% FULLSCREEN EDGE-TO-EDGE CONTAINER                                */}
      {/* ===================================================================== */}
      <main className="flex-1 w-full h-full p-2 bg-slate-50 overflow-hidden flex flex-col justify-between gap-2">
        
        {/* TOP KPI METRICS BAR (6 FLOATING CARDS TOUCHING EDGES) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-2 shrink-0 w-full">
          <div className="bg-white p-2.5 rounded-xl border border-slate-200/90 shadow-2xs border-t-4 border-t-emerald-600 relative overflow-hidden">
            <div className="text-[10px] font-black text-slate-500 uppercase tracking-wider">TOTAL CAPACITY</div>
            <div className="text-xl sm:text-2xl font-black text-slate-900 font-mono mt-0.5 flex items-baseline gap-1">
              <span>8.0</span> <span className="text-xs text-slate-500 font-sans font-bold">T-CU/Day</span>
            </div>
            <div className="text-[10px] font-extrabold text-emerald-700 mt-0.5 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> 100% Available
            </div>
          </div>

          <div className="bg-white p-2.5 rounded-xl border border-slate-200/90 shadow-2xs border-t-4 border-t-amber-500 relative overflow-hidden">
            <div className="text-[10px] font-black text-slate-500 uppercase tracking-wider">BOOKED CAPACITY</div>
            <div className="text-xl sm:text-2xl font-black text-amber-700 font-mono mt-0.5 flex items-baseline gap-1">
              <span>5.6</span> <span className="text-xs text-slate-500 font-sans font-bold">T-CU/Day</span>
            </div>
            <div className="text-[10px] font-extrabold text-amber-800 mt-0.5">70% Utilization Rate</div>
          </div>

          <div className="bg-white p-2.5 rounded-xl border border-slate-200/90 shadow-2xs border-t-4 border-t-teal-600 relative overflow-hidden">
            <div className="text-[10px] font-black text-slate-500 uppercase tracking-wider">REMAINING CAPACITY</div>
            <div className="text-xl sm:text-2xl font-black text-teal-700 font-mono mt-0.5 flex items-baseline gap-1">
              <span>2.4</span> <span className="text-xs text-slate-500 font-sans font-bold">T-CU/Day</span>
            </div>
            <div className="text-[10px] font-extrabold text-slate-500 mt-0.5">30% Sisa Slot Uji</div>
          </div>

          <div className="bg-white p-2.5 rounded-xl border border-slate-200/90 shadow-2xs border-t-4 border-t-slate-700 relative overflow-hidden">
            <div className="text-[10px] font-black text-slate-500 uppercase tracking-wider">SAMPLES IN PROCESS</div>
            <div className="text-xl sm:text-2xl font-black text-slate-800 font-mono mt-0.5 flex items-baseline gap-1">
              <span>{totalActiveSamples > 0 ? totalActiveSamples : 14}</span> <span className="text-xs text-slate-500 font-sans font-bold">Samples</span>
            </div>
            <div className="text-[10px] font-extrabold text-slate-600 mt-0.5">8 Test Types Active</div>
          </div>

          <div className="bg-white p-2.5 rounded-xl border border-slate-200/90 shadow-2xs border-t-4 border-t-indigo-600 relative overflow-hidden">
            <div className="text-[10px] font-black text-slate-500 uppercase tracking-wider">EST. TEST COMPLETION</div>
            <div className="text-xl sm:text-2xl font-black text-indigo-800 font-mono mt-0.5 flex items-baseline gap-1">
              <span>2.6</span> <span className="text-xs text-slate-500 font-sans font-bold">Days Avg</span>
            </div>
            <div className="text-[10px] font-extrabold text-indigo-700 mt-0.5">Lead Time Standar LIMS</div>
          </div>

          <div className="bg-white p-2.5 rounded-xl border border-rose-200 bg-rose-50/20 shadow-2xs border-t-4 border-t-rose-500 relative overflow-hidden">
            <div className="text-[10px] font-black text-rose-800 uppercase tracking-wider">SYSTEM ALERTS</div>
            <div className="text-xl sm:text-2xl font-black text-rose-700 font-mono mt-0.5 flex items-baseline gap-1">
              <span>3</span> <span className="text-xs text-rose-500 font-sans font-bold">Alerts</span>
            </div>
            <div className="text-[10px] font-extrabold text-rose-700 mt-0.5 flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-600" /> Action Needed
            </div>
          </div>
        </div>

        {/* MIDDLE 3-COLUMN ZERO-SCROLL MAIN GRID (STRETCH FULL HEIGHT) */}
        <div className="flex-1 w-full h-full grid grid-cols-1 lg:grid-cols-3 gap-2 min-h-0 overflow-hidden">
          
          {/* COLUMN 1: SDM WORKLOAD MONITORING */}
          <div className="bg-white rounded-xl p-3 border border-slate-200/90 shadow-2xs flex flex-col justify-between overflow-hidden h-full">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2 shrink-0">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-xl bg-teal-50 text-teal-700 border border-teal-200/80 shadow-2xs">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">SDM Workload Monitoring</h3>
                  <p className="text-[10px] text-slate-500 font-medium">Beban kerja real-time per Analis/Operator</p>
                </div>
              </div>
              <span className="text-[10px] font-mono font-extrabold text-teal-800 bg-teal-50 px-2 py-0.5 rounded-lg border border-teal-200/80">Avg: 50%</span>
            </div>

            <div className="space-y-2 flex-1 flex flex-col justify-around py-1.5 overflow-hidden">
              {sdmWorkload.map(person => (
                <div key={person.id} className="p-2 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1 hover:bg-emerald-50/40 transition">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className={`w-6.5 h-6.5 rounded-full ${person.avatarBg} text-white font-black text-[10.5px] flex items-center justify-center shrink-0 shadow-2xs`}>
                        {person.initials}
                      </div>
                      <div className="min-w-0">
                        <span className="text-slate-900 font-black truncate block text-xs">{person.name}</span>
                        <span className="text-[9.5px] text-slate-500 font-mono block leading-none">{person.code} • {person.role}</span>
                      </div>
                    </div>

                    <div className="text-right shrink-0 flex items-center gap-2">
                      <span className="font-mono font-black text-slate-800 text-xs">{person.bookedTcu}/8 T-CU</span>
                      <span className={`px-2 py-0.5 rounded text-[9.5px] font-mono font-bold ${
                        person.status === 'Full' ? 'bg-rose-100 text-rose-800 border border-rose-200' :
                        person.status === 'Medium' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                        'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      }`}>
                        {person.percent}%
                      </span>
                    </div>
                  </div>

                  <div className="w-full bg-slate-200/80 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        person.status === 'Full' ? 'bg-rose-500/90' : person.status === 'Medium' ? 'bg-amber-500/90' : 'bg-emerald-600/90'
                      }`}
                      style={{ width: `${person.percent}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="text-[10px] text-slate-600 font-mono flex items-center justify-between pt-1.5 border-t border-slate-100 shrink-0">
              <span>Total Booked: <b className="text-slate-900 font-black">20.0 T-CU</b></span>
              <span>Kapasitas Tersedia: <b className="text-teal-800 font-black">40.0 T-CU</b></span>
            </div>
          </div>

          {/* COLUMN 2: EQUIPMENT UTILIZATION MONITOR */}
          <div className="bg-white rounded-xl p-3 border border-slate-200/90 shadow-2xs flex flex-col justify-between overflow-hidden h-full">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2 shrink-0">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200/80 shadow-2xs">
                  <Flame className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">Equipment Utilization Monitor</h3>
                  <p className="text-[10px] text-slate-500 font-medium">Status &amp; utilisasi alat laboratorium secara real-time</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-[9.5px] font-bold">
                <span className="text-emerald-800">● Ready</span>
                <span className="text-amber-800">● Reserved</span>
                <span className="text-rose-800">● In Use</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-1.5 flex-1 py-1.5 overflow-hidden">
              {equipmentList.map(eq => (
                <div key={eq.id} className="p-2 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col justify-between hover:bg-emerald-50/40 transition">
                  <div className="flex items-center justify-between gap-1">
                    <span className="font-black text-xs text-slate-900 truncate">{eq.name}</span>
                    <span className={`px-2 py-0.5 rounded text-[8.5px] font-extrabold uppercase shrink-0 ${
                      eq.status === 'In Use' ? 'bg-rose-50 text-rose-800 border border-rose-200' :
                      eq.status === 'Reserved' ? 'bg-amber-50 text-amber-800 border border-amber-200' :
                      'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    }`}>
                      {eq.status}
                    </span>
                  </div>

                  <div className="my-1">
                    <div className="flex justify-between text-[9.5px] font-mono text-slate-500 mb-0.5">
                      <span>Usage: <b className="text-slate-900 font-black">{eq.usage}%</b></span>
                      <span>Next: <b className="text-slate-800 font-bold">{eq.availableTime}</b></span>
                    </div>
                    <div className="w-full bg-slate-200/80 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          eq.status === 'In Use' ? 'bg-rose-500/90' : eq.status === 'Reserved' ? 'bg-amber-500/90' : 'bg-emerald-600/90'
                        }`}
                        style={{ width: `${eq.usage > 0 ? eq.usage : 5}%` }}
                      />
                    </div>
                  </div>

                  {eq.tempReading ? (
                    <span className="text-[9.5px] font-mono text-teal-800 font-bold block truncate">
                      Sensor: {eq.tempReading}
                    </span>
                  ) : (
                    <span className="text-[9.5px] font-mono text-slate-400 block truncate">
                      Room: {eq.room}
                    </span>
                  )}
                </div>
              ))}
            </div>

            <div className="text-[10px] text-emerald-800 font-bold flex items-center justify-between pt-1.5 border-t border-slate-100 shrink-0">
              <span>Kamera Telemetri Real-Time Online</span>
              <span className="font-mono text-teal-800">8 Alat Terhubung</span>
            </div>
          </div>

          {/* COLUMN 3: ALERT & BOTTLENECK + QUEUE MATRIX */}
          <div className="bg-white rounded-xl p-3 border border-slate-200/90 shadow-2xs flex flex-col justify-between space-y-2 overflow-hidden h-full">
            
            {/* ALERT & BOTTLENECK SECTION */}
            <div className="space-y-1.5 shrink-0">
              <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                <div className="flex items-center gap-2 text-rose-800 font-black text-xs uppercase tracking-wider">
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                  <span>Alert &amp; Bottleneck Detect</span>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-800 text-[9.5px] font-extrabold font-mono border border-rose-200">
                  {alertsList.length} Alerts Active
                </span>
              </div>

              <div className="space-y-1">
                {alertsList.map(al => (
                  <div key={al.id} className={`p-2 rounded-xl text-xs border flex items-start justify-between gap-2 ${
                    al.level === 'danger' ? 'bg-rose-50/70 border-rose-200/80 text-rose-900' :
                    al.level === 'warning' ? 'bg-amber-50/70 border-amber-200/80 text-amber-900' :
                    'bg-emerald-50/70 border-emerald-200/80 text-emerald-900'
                  }`}>
                    <div className="min-w-0">
                      <span className="font-black block leading-tight text-[11px]">{al.title}</span>
                      <span className="text-[9.5px] opacity-90 leading-tight block mt-0.5">{al.detail}</span>
                    </div>
                    <span className="font-mono font-extrabold text-[9.5px] opacity-80 shrink-0 bg-white px-1.5 py-0.5 rounded border border-slate-200">{al.time}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* QUEUE SAMPLE MATRIX SECTION */}
            <div className="flex-1 flex flex-col justify-between min-h-0 overflow-hidden pt-1 border-t border-slate-100">
              <div className="flex items-center justify-between pb-1.5 shrink-0">
                <div className="flex items-center gap-2 text-slate-900 font-black text-xs uppercase tracking-wider">
                  <Activity className="w-4 h-4 text-teal-700" />
                  <span>Queue Sample &amp; Priority Matrix</span>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-teal-50 text-teal-800 text-[9.5px] font-extrabold font-mono border border-teal-200/70">
                  18 Samples Queued
                </span>
              </div>

              <div className="overflow-hidden border border-slate-200/90 rounded-xl flex-1 bg-white">
                <table className="w-full text-left text-[10.5px] border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-600 font-black text-[9px] uppercase border-b border-slate-200">
                      <th className="p-2">Sample ID</th>
                      <th className="p-2">Metode Uji</th>
                      <th className="p-2">Status</th>
                      <th className="p-2 text-right">Priority</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-semibold text-slate-800">
                    {sampleQueue.map((item, idx) => (
                      <tr key={idx} className="hover:bg-emerald-50/30 transition">
                        <td className="p-2 font-mono font-black text-slate-900">{item.sampleId}</td>
                        <td className="p-2 text-slate-700 font-bold truncate max-w-[130px]">{item.method}</td>
                        <td className="p-2">
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-700 border border-slate-200/80 rounded text-[8.5px] font-bold font-mono">
                            {item.status}
                          </span>
                        </td>
                        <td className="p-2 text-right">
                          <span className={`px-2 py-0.5 text-[8.5px] font-mono font-extrabold rounded ${item.badgeClass}`}>
                            {item.priority}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>

        </div>

      </main>

      {/* ===================================================================== */}
      {/* EXECUTIVE MUTED SOFT FOOTER TICKER BANNER                             */}
      {/* ===================================================================== */}
      <footer className="w-full bg-gradient-to-r from-emerald-950 via-teal-950 to-slate-900 text-white px-5 py-2 text-xs flex items-center justify-between gap-4 shrink-0 shadow-md">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-emerald-200 font-extrabold uppercase text-[10px] tracking-wider px-2.5 py-0.5 bg-white/10 backdrop-blur-md rounded-full border border-white/20">
            <Radio className="w-3.5 h-3.5 animate-pulse text-emerald-300" /> TELEMETRI REALTIME
          </span>
          <span className="text-white font-mono text-xs truncate">
            {urgentCount > 0 ? (
              <span className="text-amber-200 font-bold">⚠️ ALERT: Terdapat {urgentCount} PO Urgensi Tinggi Mendekati Deadline!</span>
            ) : (
              <span>Sistem Operasional Laboratorium Normal • Total {totalActiveSamples} Sampel Aktif Uji.</span>
            )}
          </span>
        </div>

        <div className="flex items-center gap-3 text-xs font-mono text-slate-300">
          <span>ANSA LIMS TIMES® LSCP TV DISPLAY v2.0 (1-PAGE FIT)</span>
          <span>•</span>
          <span className="text-slate-400">PT. Terraforma Geoteknik Indonesia</span>
        </div>
      </footer>
    </div>
  );
};
