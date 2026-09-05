import React, { useState } from 'react';
import { PurchaseOrder, Sample, SampleTest, TestStatus, MatrixTestInfo } from '../types';
import { formatDate, getPOProgress, getPODeadlineStatus } from '../utils/helpers';
import { DashboardView as ExistingPODashboard } from './DashboardView';
import { 
  BarChart3, 
  Users, 
  Flame, 
  Clock, 
  AlertTriangle, 
  Layout, 
  CalendarDays, 
  FolderKanban, 
  Layers, 
  CheckCircle2, 
  Sparkles, 
  Building2, 
  Info, 
  FileText, 
  ExternalLink, 
  Wrench, 
  ShieldCheck, 
  Maximize2,
  RefreshCw,
  Search,
  Check,
  X,
  Sliders,
  ChevronRight,
  TrendingUp,
  Cpu,
  Activity,
  Zap,
  Gauge,
  Box,
  Timer,
  PlayCircle,
  AlertCircle
} from 'lucide-react';

interface LscpDashboardViewProps {
  pos: PurchaseOrder[];
  searchTerm: string;
  testCatalogue: MatrixTestInfo[];
  onOpenCalcModal: (test: SampleTest, sample: Sample, po: PurchaseOrder) => void;
  onSelectPO: (po: PurchaseOrder) => void;
  onUpdateTestStatus?: (poId: string, sampleId: string, testId: string, newStatus: TestStatus, customEndTime?: string) => void;
  onUpdateSampleAssignedTests?: (poId: string, sampleId: string, selectedTestCodes: string[]) => void;
  onOpenLHUModal?: (sample: Sample, po: PurchaseOrder) => void;
}

interface EquipmentItem {
  id: string;
  name: string;
  shortName: string;
  room: string;
  status: 'In Use' | 'Available' | 'Reserved' | 'Maintenance';
  usage: number; // 0-100%
  availableTime: string;
  assignedSample?: string;
  operator?: string;
  sopCode?: string;
  tempReading?: string;
}

export const LscpDashboardView: React.FC<LscpDashboardViewProps> = ({
  pos,
  searchTerm,
  testCatalogue,
  onOpenCalcModal,
  onSelectPO,
  onUpdateTestStatus,
  onUpdateSampleAssignedTests,
  onOpenLHUModal
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'layout' | 'timeline' | 'po_matrix'>('po_matrix');
  const [selectedEquipmentForVmt, setSelectedEquipmentForVmt] = useState<EquipmentItem | null>(null);
  const [layoutViewMode, setLayoutViewMode] = useState<'2D' | '3D'>('2D');

  // Calculated Real-Time Metrics from active POs
  const totalActiveSamples = pos.reduce((acc, po) => acc + po.samples.length, 0);
  const urgentPOCount = pos.filter(po => getPODeadlineStatus(po.deadline).status === 'urgent').length;
  
  // Equipment Master List with clean short names & telemetry
  const equipmentList: EquipmentItem[] = [
    { id: 'eq-oven-1', name: 'Oven-01 (Pengering Saringan)', shortName: 'Oven-01', room: 'SAMPLE PREPARATION', status: 'In Use', usage: 85, availableTime: '14:30', assignedSample: 'UDS-001', operator: 'Analyst #1 (AO#1)', sopCode: 'IK-LAB-012', tempReading: '110°C ± 5°C' },
    { id: 'eq-oven-2', name: 'Oven-02 (Pengering Kadar Air)', shortName: 'Oven-02', room: 'SAMPLE PREPARATION', status: 'Available', usage: 0, availableTime: 'Sekarang', sopCode: 'IK-LAB-012', tempReading: '25°C (Standby)' },
    { id: 'eq-compactor', name: 'Soil Compactor Automatic', shortName: 'Soil Compactor', room: 'COMPACTION & CBR ROOM', status: 'Reserved', usage: 60, availableTime: '13:00', assignedSample: 'BS-002', operator: 'Analyst #2 (AO#2)', sopCode: 'IK-LAB-045' },
    { id: 'eq-oedometer', name: 'Oedometer Consolidometer 1-6', shortName: 'Oedometer 1-6', room: 'MECHANICAL TESTING ROOM', status: 'In Use', usage: 90, availableTime: 'Besok 10:00', assignedSample: 'UDS-004', operator: 'Analyst #1 (AO#1)', sopCode: 'IK-LAB-088' },
    { id: 'eq-triaxial', name: 'Triaxial UU/CU/CD Cell-01', shortName: 'Triaxial Cell-01', room: 'MECHANICAL TESTING ROOM', status: 'Available', usage: 0, availableTime: 'Sekarang', sopCode: 'IK-LAB-092' },
    { id: 'eq-ds', name: 'Direct Shear Motorized-01', shortName: 'Direct Shear-01', room: 'MECHANICAL TESTING ROOM', status: 'Reserved', usage: 50, availableTime: '15:00', assignedSample: 'DS-010', operator: 'Analyst #4 (AO#4)', sopCode: 'IK-LAB-076' },
    { id: 'eq-curing', name: 'Curing Tank Preservasi', shortName: 'Curing Tank', room: 'CURING ROOM', status: 'In Use', usage: 100, availableTime: 'Penuh', assignedSample: 'CBR-005', operator: 'Analyst #3 (AO#3)', sopCode: 'IK-LAB-020', tempReading: '20°C ± 2°C' },
    { id: 'eq-balance', name: 'Moisture Balance Precision', shortName: 'Moisture Balance', room: 'MECHANICAL TESTING ROOM', status: 'Available', usage: 0, availableTime: 'Sekarang', sopCode: 'IK-LAB-005' },
  ];

  // SDM Workload Data with Real Organization Users
  const sdmWorkload = [
    { id: 'ao-1', code: 'AO#1', name: 'Rafi', role: 'Penguji / Analis 1', bookedTcu: 7.5, maxTcu: 8.0, percent: 94, status: 'Full', badgeBg: 'bg-rose-600', barColor: 'from-rose-500 to-red-600', initials: 'RF', avatarBg: 'bg-blue-600' },
    { id: 'ao-2', code: 'AO#2', name: 'Rizki', role: 'Penguji / Analis 2', bookedTcu: 5.0, maxTcu: 8.0, percent: 63, status: 'Medium', badgeBg: 'bg-amber-500', barColor: 'from-amber-500 to-orange-500', initials: 'RZ', avatarBg: 'bg-teal-600' },
    { id: 'ao-3', code: 'AO#3', name: 'Rasya', role: 'Penguji / Analis 3', bookedTcu: 2.5, maxTcu: 8.0, percent: 31, status: 'Available', badgeBg: 'bg-emerald-600', barColor: 'from-emerald-500 to-teal-500', initials: 'RS', avatarBg: 'bg-emerald-600' },
    { id: 'ao-4', code: 'AO#4', name: 'Noval', role: 'Kepala Teknis', bookedTcu: 2.0, maxTcu: 8.0, percent: 25, status: 'Available', badgeBg: 'bg-emerald-600', barColor: 'from-emerald-500 to-teal-500', initials: 'NV', avatarBg: 'bg-indigo-600' },
    { id: 'ao-5', code: 'AO#5', name: 'Asisten Lab', role: 'Junior Analyst', bookedTcu: 3.0, maxTcu: 8.0, percent: 38, status: 'Available', badgeBg: 'bg-emerald-600', barColor: 'from-emerald-500 to-teal-500', initials: 'AL', avatarBg: 'bg-slate-700' },
  ];

  // System Bottlenecks / Alerts List
  const alertsList = [
    { id: 'al-1', level: 'danger', title: 'Oven-01 Overloaded', detail: 'Kapasitas oven pengeringan maksimum, estimasi delay 2 jam.', time: '10:20' },
    { id: 'al-2', level: 'warning', title: 'Oedometer Fully Booked', detail: 'Alat konsolidasi terisi penuh hingga besok jam 10:00.', time: '10:15' },
    { id: 'al-3', level: 'warning', title: 'Soil Compactor Reserved', detail: 'Persiapan uji Pemadatan Proctor jam 13:00.', time: '10:10' },
    { id: 'al-4', level: 'info', title: 'Technician AO#3 Available', detail: 'Teknisi 3 siap menerima penugasan sampel baru.', time: '10:05' },
  ];

  return (
    <div className="w-full max-w-full px-4 sm:px-6 py-4 space-y-4 text-slate-800">
      
      {/* ===== LSCP ULTRA-PREMIUM HEADER BANNER (LIGHT & CLEAN THEME) ===== */}
      <div className="bg-gradient-to-r from-teal-50/90 via-white to-emerald-50/80 p-4 sm:p-5 rounded-2xl text-slate-900 shadow-sm border border-teal-200/80 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-teal-400/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute left-1/3 bottom-0 w-64 h-64 bg-emerald-400/10 rounded-full blur-2xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-100/80 text-emerald-800 border border-emerald-300 text-[10px] font-mono font-bold tracking-wider flex items-center gap-1.5 shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                TIMES® LSCP ENGINE v2.0 ONLINE
              </span>
              <span className="text-[10px] text-slate-500 font-mono font-semibold">07 Aug 2026 | 10:24 AM</span>
            </div>
            
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
              <div className="p-1.5 rounded-xl bg-gradient-to-tr from-teal-600 to-emerald-600 text-white shadow-md">
                <Activity className="w-5 h-5 text-white" />
              </div>
              <span>Laboratory Scheduling &amp; Capacity Planning (LSCP)</span>
            </h1>
            <p className="text-xs text-slate-600 font-medium mt-1 max-w-2xl leading-relaxed">
              Pusat kendali operasional laboratorium real-time: Pemantauan beban kerja SDM, utilisasi alat, penjadwalan T-CU, dan deteksi <em>bottleneck</em>.
            </p>
          </div>

          {/* Quick Sub-Tab Navigation Bar */}
          <div className="flex items-center gap-1.5 bg-slate-100/90 p-1.5 rounded-xl border border-slate-200 shrink-0 self-start lg:self-center shadow-2xs">
            <button
              onClick={() => setActiveSubTab('overview')}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                activeSubTab === 'overview'
                  ? 'bg-gradient-to-r from-teal-600 to-emerald-600 text-white shadow-md'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Executive Overview</span>
            </button>

            <button
              onClick={() => setActiveSubTab('layout')}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                activeSubTab === 'layout'
                  ? 'bg-gradient-to-r from-teal-600 to-emerald-600 text-white shadow-md'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
              }`}
            >
              <Layout className="w-4 h-4" />
              <span>Denah 2D Digital Lab</span>
            </button>

            <button
              onClick={() => setActiveSubTab('timeline')}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                activeSubTab === 'timeline'
                  ? 'bg-gradient-to-r from-teal-600 to-emerald-600 text-white shadow-md'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
              }`}
            >
              <CalendarDays className="w-4 h-4" />
              <span>T-CU Schedule Timeline</span>
            </button>

            <button
              onClick={() => setActiveSubTab('po_matrix')}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                activeSubTab === 'po_matrix'
                  ? 'bg-gradient-to-r from-teal-600 to-emerald-600 text-white shadow-md'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
              }`}
            >
              <FolderKanban className="w-4 h-4" />
              <span>Monitoring Matrix PO</span>
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SUB-TAB 1: EXECUTIVE LSCP OVERVIEW & CAPACITY CONTROL                     */}
      {/* ========================================================================= */}
      {activeSubTab === 'overview' && (
        <div className="space-y-4">
          
          {/* TOP 6 EXECUTIVE KPI CARDS */}
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
            <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-sm relative overflow-hidden group hover:border-teal-400 transition-colors">
              <div className="w-1 h-full bg-slate-900 absolute left-0 top-0" />
              <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">TOTAL CAPACITY</div>
              <div className="text-2xl sm:text-3xl font-black text-slate-900 font-mono mt-1 flex items-baseline gap-1">
                <span>8.0</span>
                <span className="text-xs font-bold text-slate-500 font-sans">T-CU/Day</span>
              </div>
              <div className="text-[10px] font-extrabold text-emerald-600 mt-1 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> 100% Available
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-sm relative overflow-hidden group hover:border-amber-400 transition-colors">
              <div className="w-1 h-full bg-amber-500 absolute left-0 top-0" />
              <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">BOOKED CAPACITY</div>
              <div className="text-2xl sm:text-3xl font-black text-amber-600 font-mono mt-1 flex items-baseline gap-1">
                <span>5.6</span>
                <span className="text-xs font-bold text-slate-500 font-sans">T-CU/Day</span>
              </div>
              <div className="text-[10px] font-extrabold text-amber-700 mt-1">
                70% Utilization Rate
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-sm relative overflow-hidden group hover:border-emerald-400 transition-colors">
              <div className="w-1 h-full bg-emerald-500 absolute left-0 top-0" />
              <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">REMAINING CAPACITY</div>
              <div className="text-2xl sm:text-3xl font-black text-emerald-600 font-mono mt-1 flex items-baseline gap-1">
                <span>2.4</span>
                <span className="text-xs font-bold text-slate-500 font-sans">T-CU/Day</span>
              </div>
              <div className="text-[10px] font-extrabold text-slate-500 mt-1">
                30% Sisa Slot Pengujian
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-sm relative overflow-hidden group hover:border-teal-500 transition-colors">
              <div className="w-1 h-full bg-teal-600 absolute left-0 top-0" />
              <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">SAMPLES IN PROCESS</div>
              <div className="text-2xl sm:text-3xl font-black text-teal-800 font-mono mt-1 flex items-baseline gap-1">
                <span>{totalActiveSamples > 0 ? totalActiveSamples : 24}</span>
                <span className="text-xs font-bold text-slate-500 font-sans">Samples</span>
              </div>
              <div className="text-[10px] font-extrabold text-teal-700 mt-1">
                8 Test Types Active
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-sm relative overflow-hidden group hover:border-indigo-400 transition-colors">
              <div className="w-1 h-full bg-indigo-600 absolute left-0 top-0" />
              <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">EST. TEST COMPLETION</div>
              <div className="text-2xl sm:text-3xl font-black text-indigo-700 font-mono mt-1 flex items-baseline gap-1">
                <span>2.6</span>
                <span className="text-xs font-bold text-slate-500 font-sans">Days Avg</span>
              </div>
              <div className="text-[10px] font-extrabold text-indigo-600 mt-1">
                Lead Time Standar LIMS
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-rose-200 bg-rose-50/20 shadow-sm relative overflow-hidden group hover:border-rose-400 transition-colors">
              <div className="w-1 h-full bg-rose-600 absolute left-0 top-0" />
              <div className="text-[10px] font-black text-rose-700 uppercase tracking-widest">SYSTEM ALERTS</div>
              <div className="text-2xl sm:text-3xl font-black text-rose-600 font-mono mt-1 flex items-baseline gap-1">
                <span>3</span>
                <span className="text-xs font-bold text-rose-500 font-sans">Alerts</span>
              </div>
              <div className="text-[10px] font-extrabold text-rose-600 mt-1 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-500" /> Action Needed
              </div>
            </div>
          </div>

          {/* MAIN 2-COLUMN GRID: SDM WORKLOAD MONITORING + EQUIPMENT UTILIZATION */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            
            {/* COLUMN 1: SDM WORKLOAD MONITORING */}
            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-sm space-y-3.5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-teal-50 text-teal-700 border border-teal-200/80 shadow-2xs">
                    <Users className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">SDM Workload Monitoring</h3>
                    <p className="text-[10.5px] text-slate-500 font-medium">Beban kerja real-time per Analis/Operator (T-CU / Day)</p>
                  </div>
                </div>
                <span className="text-[10px] font-mono font-extrabold text-teal-800 bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-200">Avg: 50%</span>
              </div>

              <div className="space-y-3">
                {sdmWorkload.map(person => (
                  <div key={person.id} className="p-3 rounded-xl bg-slate-50/90 border border-slate-200/80 space-y-2 hover:bg-slate-100/70 transition group">
                    <div className="flex items-center justify-between text-xs font-bold gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        {/* User Avatar Initials */}
                        <div className={`w-8 h-8 rounded-full ${person.avatarBg} text-white font-black text-xs flex items-center justify-center border-2 border-white shadow-xs shrink-0`}>
                          {person.initials}
                        </div>
                        <div className="min-w-0">
                          <div className="text-slate-900 font-extrabold flex items-center gap-1.5 truncate">
                            <span>{person.name}</span>
                            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-200 text-slate-700 font-bold shrink-0">{person.code}</span>
                          </div>
                          <div className="text-[10.5px] text-slate-500 font-medium truncate">{person.role}</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-xs font-mono shrink-0">
                        <span className="text-slate-500 font-medium hidden sm:inline">Booked: <strong className="text-slate-900 font-bold">{person.bookedTcu}/{person.maxTcu} T-CU</strong></span>
                        <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-black text-white ${person.badgeBg}`}>
                          {person.percent}% ({person.status})
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full h-2.5 rounded-full bg-slate-200/90 overflow-hidden shadow-inner">
                      <div className={`h-full rounded-full bg-gradient-to-r ${person.barColor} transition-all duration-500`} style={{ width: `${person.percent}%` }} />
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-slate-600">
                <span>Total Booked: <strong className="text-slate-900 font-mono">20.0 T-CU</strong></span>
                <span>Kapasitas Tersedia: <strong className="text-emerald-700 font-mono">40.0 T-CU</strong></span>
              </div>
            </div>

            {/* COLUMN 2: EQUIPMENT UTILIZATION MONITOR */}
            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-sm space-y-3.5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200/80 shadow-2xs">
                    <Flame className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">Equipment Utilization Monitor</h3>
                    <p className="text-[10.5px] text-slate-500 font-medium">Status &amp; utilisasi alat laboratorium secara real-time</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-[9.5px] font-bold">
                  <span className="flex items-center gap-1 text-emerald-700"><span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Ready</span>
                  <span className="flex items-center gap-1 text-amber-700"><span className="w-2 h-2 rounded-full bg-amber-500" /> Reserved</span>
                  <span className="flex items-center gap-1 text-rose-700"><span className="w-2 h-2 rounded-full bg-rose-500" /> In Use</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {equipmentList.map(eq => (
                  <div
                    key={eq.id}
                    onClick={() => setSelectedEquipmentForVmt(eq)}
                    className="p-3 rounded-xl bg-slate-50/90 border border-slate-200/80 space-y-2 hover:bg-teal-50/60 hover:border-teal-300 transition cursor-pointer group relative overflow-hidden"
                  >
                    <div className="flex items-center justify-between text-xs font-bold gap-2">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className={`w-2 h-2 rounded-full shrink-0 ${
                          eq.status === 'In Use' ? 'bg-rose-500 animate-pulse' :
                          eq.status === 'Reserved' ? 'bg-amber-500' :
                          'bg-emerald-500'
                        }`} />
                        <span className="text-slate-900 truncate font-extrabold group-hover:text-teal-900 transition-colors" title={eq.name}>{eq.shortName}</span>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[9.5px] font-black uppercase shrink-0 ${
                        eq.status === 'In Use' ? 'bg-rose-100 text-rose-800 border border-rose-200' :
                        eq.status === 'Reserved' ? 'bg-amber-100 text-amber-900 border border-amber-200' :
                        'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      }`}>
                        {eq.status}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[10.5px] text-slate-500">
                      <span>Usage: <strong className="text-slate-800 font-mono font-bold">{eq.usage}%</strong></span>
                      <span>Next Avail: <strong className="text-teal-700 font-mono font-bold">{eq.availableTime}</strong></span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden shadow-inner">
                      <div className={`h-full rounded-full transition-all duration-500 ${
                        eq.status === 'In Use' ? 'bg-rose-500' : eq.status === 'Reserved' ? 'bg-amber-500' : 'bg-emerald-500'
                      }`} style={{ width: `${Math.max(8, eq.usage)}%` }} />
                    </div>

                    {eq.tempReading && (
                      <div className="text-[9.5px] font-mono text-teal-700 font-bold flex items-center justify-between pt-0.5">
                        <span>Sensor: {eq.tempReading}</span>
                        <span className="text-teal-600 underline font-sans text-[9px] group-hover:translate-x-0.5 transition-transform">VMT &rarr;</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="pt-2 border-t border-slate-100 text-right">
                <button
                  onClick={() => setActiveSubTab('layout')}
                  className="text-xs font-extrabold text-teal-700 hover:text-teal-900 flex items-center justify-end gap-1 cursor-pointer group"
                >
                  <span>Buka Denah 2D Ruang Lab &amp; Virtual Manual (VMT)</span>
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </button>
              </div>
            </div>
          </div>

          {/* LOWER 2-COLUMN GRID: QUEUE SAMPLES + ALERTS & BOTTLENECKS */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
            
            {/* LEFT 3 COLS: QUEUE SAMPLES */}
            <div className="lg:col-span-3 bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-sm space-y-3.5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-200/80 shadow-2xs">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">Queue Sample &amp; Priority Matrix</h3>
                    <p className="text-[10.5px] text-slate-500 font-medium">Antrian pengujian berdasarkan durasi &amp; tingkat urgensi deadline</p>
                  </div>
                </div>
                <span className="text-[10px] font-extrabold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-200">18 Samples Enqueued</span>
              </div>

              <div className="overflow-x-auto border border-slate-200/80 rounded-xl">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-100/90 text-slate-700 font-bold border-b border-slate-200 text-[10px] uppercase tracking-wider">
                      <th className="py-2.5 px-3">Sample ID</th>
                      <th className="py-2.5 px-3">Metode Uji</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3 text-center">Priority</th>
                      <th className="py-2.5 px-3 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                    {[
                      { id: 'DS-001', test: 'Compaction (Pemadatan)', status: 'Testing', priority: 'HIGH', priorityColor: 'bg-rose-600 text-white' },
                      { id: 'UDS-004', test: 'Consolidation (Konsolidasi)', status: 'Waiting', priority: 'HIGH', priorityColor: 'bg-rose-600 text-white' },
                      { id: 'DS-008', test: 'CBR Soaked 4-Hari', status: 'Soaking', priority: 'MEDIUM', priorityColor: 'bg-amber-500 text-white' },
                      { id: 'BS-002', test: 'UCT (Unconfined Comp.)', status: 'Ready', priority: 'MEDIUM', priorityColor: 'bg-amber-500 text-white' },
                      { id: 'DS-010', test: 'Direct Shear Motorized', status: 'Waiting', priority: 'LOW', priorityColor: 'bg-emerald-600 text-white' },
                    ].map(row => (
                      <tr key={row.id} className="hover:bg-slate-50 transition">
                        <td className="py-2.5 px-3 font-bold text-slate-900">{row.id}</td>
                        <td className="py-2.5 px-3 text-slate-700 font-sans font-medium">{row.test}</td>
                        <td className="py-2.5 px-3">
                          <span className="px-2 py-0.5 rounded text-[9.5px] font-extrabold bg-slate-100 text-slate-800 border border-slate-200">
                            {row.status}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black tracking-wider ${row.priorityColor}`}>
                            {row.priority}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <button
                            onClick={() => setActiveSubTab('po_matrix')}
                            className="px-2.5 py-1 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-[10.5px] font-extrabold cursor-pointer transition shadow-2xs"
                          >
                            Input Data
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* RIGHT 2 COLS: ALERTS & BOTTLENECK PANEL */}
            <div className="lg:col-span-2 bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-sm space-y-3.5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-rose-50 text-rose-700 border border-rose-200/80 shadow-2xs">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">Alert &amp; Bottleneck</h3>
                    <p className="text-[10.5px] text-slate-500 font-medium">Deteksi potensi hambatan &amp; penundaan</p>
                  </div>
                </div>
              </div>

              <div className="space-y-2.5">
                {alertsList.map(al => (
                  <div
                    key={al.id}
                    className={`p-3 rounded-xl border flex items-start gap-3 text-xs ${
                      al.level === 'danger' ? 'bg-rose-50/90 border-rose-200 text-rose-950' :
                      al.level === 'warning' ? 'bg-amber-50/90 border-amber-200 text-amber-950' :
                      'bg-emerald-50/90 border-emerald-200 text-emerald-950'
                    }`}
                  >
                    {al.level === 'danger' && <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />}
                    {al.level === 'warning' && <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />}
                    {al.level === 'info' && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />}

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between font-extrabold">
                        <span>{al.title}</span>
                        <span className="text-[9.5px] font-mono text-slate-500">{al.time}</span>
                      </div>
                      <p className="text-[10.5px] font-medium opacity-90 mt-0.5 leading-snug">{al.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 2: HIGH-TECH FUTURISTIC 2D/3D DIGITAL LABORATORY FLOOR PLAN      */}
      {/* ========================================================================= */}
      {activeSubTab === 'layout' && (
        <div className="space-y-4">
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-sm space-y-4">
            
            {/* Header & View Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                  <Layout className="w-4.5 h-4.5 text-teal-600" />
                  <span>Digital Layout — Laboratory Overview (Interactive Floor Plan)</span>
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  Denah skematik fisik laboratorium mekanika tanah. Klik ikon alat untuk membuka detail status real-time &amp; Virtual Manual (VMT).
                </p>
              </div>

              {/* View Toggle */}
              <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl border border-slate-200">
                <button
                  onClick={() => setLayoutViewMode('2D')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-extrabold transition cursor-pointer flex items-center gap-1.5 ${
                    layoutViewMode === '2D'
                      ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Box className="w-3.5 h-3.5" />
                  <span>2D View</span>
                </button>
                <button
                  onClick={() => setLayoutViewMode('3D')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-extrabold transition cursor-pointer flex items-center gap-1.5 ${
                    layoutViewMode === '3D'
                      ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>3D View</span>
                </button>
              </div>
            </div>

            {/* LIVE LEGEND BAR */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-slate-900 text-white text-xs border border-slate-800">
              <div className="flex items-center gap-4 text-[11px] font-bold flex-wrap">
                <span className="text-slate-400 font-mono">STATUS ALAT LAB:</span>
                <span className="flex items-center gap-1.5 text-emerald-400">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-xs" />
                  <span>Ready (3 Alat)</span>
                </span>
                <span className="flex items-center gap-1.5 text-amber-400">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-xs" />
                  <span>Reserved (2 Alat)</span>
                </span>
                <span className="flex items-center gap-1.5 text-rose-400">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-xs" />
                  <span>In Use (3 Alat)</span>
                </span>
                <span className="flex items-center gap-1.5 text-slate-400">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-500 shadow-xs" />
                  <span>Maintenance (0 Alat)</span>
                </span>
              </div>

              <div className="text-[10px] text-teal-300 font-mono font-bold flex items-center gap-1 bg-teal-950/80 px-2.5 py-1 rounded-lg border border-teal-800">
                <Zap className="w-3 h-3 text-teal-400" />
                <span>KLIK ALAT UNTUK DETAIL VMT</span>
              </div>
            </div>

            {/* HIGH-TECH CAD CANVAS CONTAINER (Supports 2D and 3D Isometric View Mode) */}
            <div className="bg-slate-950 p-4 sm:p-6 rounded-2xl border border-slate-800 relative overflow-hidden shadow-2xl">
              <div 
                className={`transition-all duration-500 ease-in-out ${
                  layoutViewMode === '3D' 
                    ? '[transform:rotateX(40deg)_rotateZ(-20deg)] [transform-style:preserve-3d] my-8 scale-95 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)]' 
                    : ''
                }`}
              >
                <svg viewBox="0 0 900 490" className="w-full h-auto drop-shadow-2xl">
                  <defs>
                    {/* Background Grid Pattern */}
                    <pattern id="labCadGrid" width="30" height="30" patternUnits="userSpaceOnUse">
                      <path d="M 30 0 L 0 0 0 30" fill="none" stroke="#1E293B" strokeWidth="0.8" />
                    </pattern>

                    {/* Room Gradients */}
                    <linearGradient id="roomBgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#0F172A" />
                      <stop offset="100%" stopColor="#0B1329" />
                    </linearGradient>

                    <linearGradient id="mechRoomGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#0F172A" />
                      <stop offset="100%" stopColor="#091428" />
                    </linearGradient>

                    {/* Equipment Gradients */}
                    <linearGradient id="eqInUseGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#9F1239" />
                      <stop offset="100%" stopColor="#680727" />
                    </linearGradient>

                    <linearGradient id="eqReservedGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#92400E" />
                      <stop offset="100%" stopColor="#612705" />
                    </linearGradient>

                    <linearGradient id="eqAvailableGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#065F46" />
                      <stop offset="100%" stopColor="#023728" />
                    </linearGradient>
                  </defs>

                  {/* CAD Canvas Background */}
                  <rect width="900" height="490" fill="url(#labCadGrid)" />

                  {/* OUTER BUILDING BORDER WITH GLOW */}
                  <rect x="15" y="15" width="870" height="460" fill="none" stroke="#334155" strokeWidth="3" rx="12" />
                  <rect x="18" y="18" width="864" height="454" fill="none" stroke="#0EA5E9" strokeWidth="0.8" opacity="0.3" rx="10" />

                  {/* ==================== TOP ROW ROOMS ==================== */}

                  {/* ROOM 1: SAMPLE RECEIVING (RM-01) */}
                  <g className="group">
                    <rect x="25" y="25" width="185" height="155" fill="url(#roomBgGrad)" stroke="#334155" strokeWidth="1.8" rx="8" />
                    <rect x="30" y="30" width="175" height="22" fill="#1E293B" rx="4" />
                    <text x="38" y="44" fill="#38BDF8" fontSize="9" fontWeight="900" fontFamily="sans-serif">RM-01 | SAMPLE RECEIVING</text>
                    
                    {/* Reception Desk Schematic */}
                    <rect x="50" y="70" width="135" height="75" fill="#1E293B" stroke="#475569" strokeWidth="1.2" rx="6" />
                    <text x="117" y="100" textAnchor="middle" fill="#94A3B8" fontSize="8.5" fontWeight="bold">Meja Penerimaan Sampel</text>
                    
                    {/* Interactive Receiving Node */}
                    <g className="cursor-pointer hover:scale-105 transition-transform" onClick={() => setSelectedEquipmentForVmt(equipmentList[1])}>
                      <circle cx="117" cy="122" r="14" fill="#0284C7" stroke="#38BDF8" strokeWidth="2" />
                      <text x="117" y="125" textAnchor="middle" fill="#FFF" fontSize="8" fontWeight="bold">BATT</text>
                    </g>
                  </g>

                  {/* ROOM 2: SAMPLE PREPARATION (RM-02) */}
                  <g className="group">
                    <rect x="220" y="25" width="225" height="155" fill="url(#roomBgGrad)" stroke="#334155" strokeWidth="1.8" rx="8" />
                    <rect x="225" y="30" width="215" height="22" fill="#1E293B" rx="4" />
                    <text x="233" y="44" fill="#38BDF8" fontSize="9" fontWeight="900" fontFamily="sans-serif">RM-02 | SAMPLE PREPARATION</text>
                    
                    {/* Oven 1 (In Use) */}
                    <g className="cursor-pointer group/item" onClick={() => setSelectedEquipmentForVmt(equipmentList[0])}>
                      <rect x="238" y="72" width="54" height="60" rx="6" fill="url(#eqInUseGrad)" stroke="#F43F5E" strokeWidth="1.8" />
                      <circle cx="282" cy="82" r="4" fill="#F43F5E" className="animate-ping" />
                      <circle cx="282" cy="82" r="3" fill="#F43F5E" />
                      <text x="265" y="98" textAnchor="middle" fill="#FFF" fontSize="8.5" fontWeight="900">Oven-01</text>
                      <text x="265" y="112" textAnchor="middle" fill="#FECDD3" fontSize="7" fontStyle="mono">110°C</text>
                      <rect x="243" y="120" width="44" height="8" rx="2" fill="#881337" />
                      <text x="265" y="126.5" textAnchor="middle" fill="#FFF" fontSize="6.5" fontWeight="bold">IN USE</text>
                    </g>

                    {/* Oven 2 (Available) */}
                    <g className="cursor-pointer group/item" onClick={() => setSelectedEquipmentForVmt(equipmentList[1])}>
                      <rect x="304" y="72" width="54" height="60" rx="6" fill="url(#eqAvailableGrad)" stroke="#10B981" strokeWidth="1.8" />
                      <circle cx="348" cy="82" r="3" fill="#10B981" />
                      <text x="331" y="98" textAnchor="middle" fill="#FFF" fontSize="8.5" fontWeight="900">Oven-02</text>
                      <text x="331" y="112" textAnchor="middle" fill="#A7F3D0" fontSize="7" fontStyle="mono">Standby</text>
                      <rect x="309" y="120" width="44" height="8" rx="2" fill="#064E3B" />
                      <text x="331" y="126.5" textAnchor="middle" fill="#FFF" fontSize="6.5" fontWeight="bold">READY</text>
                    </g>

                    {/* Crusher / Splitter */}
                    <g className="cursor-pointer group/item" onClick={() => setSelectedEquipmentForVmt(equipmentList[2])}>
                      <rect x="370" y="72" width="60" height="60" rx="6" fill="url(#eqReservedGrad)" stroke="#F59E0B" strokeWidth="1.8" />
                      <circle cx="420" cy="82" r="3" fill="#F59E0B" />
                      <text x="400" y="98" textAnchor="middle" fill="#FFF" fontSize="8.5" fontWeight="900">Crusher</text>
                      <text x="400" y="112" textAnchor="middle" fill="#FDE68A" fontSize="7" fontStyle="mono">Splitter</text>
                      <rect x="375" y="120" width="50" height="8" rx="2" fill="#78350F" />
                      <text x="400" y="126.5" textAnchor="middle" fill="#FFF" fontSize="6.5" fontWeight="bold">RESERVED</text>
                    </g>
                  </g>

                  {/* ROOM 3: COMPACTION & CBR ROOM (RM-03) */}
                  <g className="group">
                    <rect x="455" y="25" width="235" height="155" fill="url(#roomBgGrad)" stroke="#334155" strokeWidth="1.8" rx="8" />
                    <rect x="460" y="30" width="225" height="22" fill="#1E293B" rx="4" />
                    <text x="468" y="44" fill="#38BDF8" fontSize="9" fontWeight="900" fontFamily="sans-serif">RM-03 | COMPACTION &amp; CBR ROOM</text>
                    
                    {/* Soil Compactor */}
                    <g className="cursor-pointer" onClick={() => setSelectedEquipmentForVmt(equipmentList[2])}>
                      <rect x="475" y="72" width="90" height="65" rx="6" fill="url(#eqReservedGrad)" stroke="#F59E0B" strokeWidth="1.8" />
                      <circle cx="555" cy="82" r="3" fill="#F59E0B" />
                      <text x="520" y="98" textAnchor="middle" fill="#FFF" fontSize="9" fontWeight="900">Soil Compactor</text>
                      <text x="520" y="112" textAnchor="middle" fill="#FDE68A" fontSize="7.5" fontStyle="mono">Auto Hammer</text>
                      <rect x="485" y="122" width="70" height="9" rx="2" fill="#78350F" />
                      <text x="520" y="129" textAnchor="middle" fill="#FFF" fontSize="7" fontWeight="bold">RESERVED (13:00)</text>
                    </g>

                    {/* CBR Press Frame */}
                    <g className="cursor-pointer">
                      <rect x="580" y="72" width="95" height="65" rx="6" fill="url(#eqAvailableGrad)" stroke="#10B981" strokeWidth="1.8" />
                      <circle cx="665" cy="82" r="3" fill="#10B981" />
                      <text x="627" y="98" textAnchor="middle" fill="#FFF" fontSize="9" fontWeight="900">CBR Press Frame</text>
                      <text x="627" y="112" textAnchor="middle" fill="#A7F3D0" fontSize="7.5" fontStyle="mono">50 kN Load Ring</text>
                      <rect x="592" y="122" width="70" height="9" rx="2" fill="#064E3B" />
                      <text x="627" y="129" textAnchor="middle" fill="#FFF" fontSize="7" fontWeight="bold">READY TO TEST</text>
                    </g>
                  </g>

                  {/* ROOM 4: CURING ROOM (RM-04) */}
                  <g className="group">
                    <rect x="700" y="25" width="180" height="155" fill="url(#roomBgGrad)" stroke="#334155" strokeWidth="1.8" rx="8" />
                    <rect x="705" y="30" width="170" height="22" fill="#1E293B" rx="4" />
                    <text x="713" y="44" fill="#38BDF8" fontSize="9" fontWeight="900" fontFamily="sans-serif">RM-04 | CURING ROOM</text>

                    {/* Curing Tank 01 & 02 */}
                    <g className="cursor-pointer" onClick={() => setSelectedEquipmentForVmt(equipmentList[6])}>
                      <rect x="715" y="72" width="150" height="65" rx="6" fill="url(#eqInUseGrad)" stroke="#F43F5E" strokeWidth="1.8" />
                      <circle cx="853" cy="82" r="4" fill="#F43F5E" className="animate-ping" />
                      <circle cx="853" cy="82" r="3" fill="#F43F5E" />
                      <text x="790" y="98" textAnchor="middle" fill="#FFF" fontSize="9.5" fontWeight="900">Curing Tank 01 &amp; 02</text>
                      <text x="790" y="112" textAnchor="middle" fill="#FECDD3" fontSize="7.5" fontStyle="mono">Suhu Air: 20°C ± 2°C</text>
                      <rect x="740" y="122" width="100" height="9" rx="2" fill="#881337" />
                      <text x="790" y="129" textAnchor="middle" fill="#FFF" fontSize="7" fontWeight="bold">IN USE (FULL CAPACITY)</text>
                    </g>
                  </g>

                  {/* ==================== BOTTOM ROW ROOMS ==================== */}

                  {/* ROOM 5: MECHANICAL TESTING ROOM (RM-05 - MAIN TEST LAB) */}
                  <g className="group">
                    <rect x="25" y="190" width="665" height="275" fill="url(#mechRoomGrad)" stroke="#334155" strokeWidth="1.8" rx="8" />
                    <rect x="30" y="195" width="655" height="24" fill="#1E293B" rx="4" />
                    <text x="357" y="211" textAnchor="middle" fill="#38BDF8" fontSize="10" fontWeight="900" fontFamily="sans-serif">RM-05 | MECHANICAL TESTING ROOM (UTAMA)</text>

                    {/* Oedometer 1-6 */}
                    <g className="cursor-pointer" onClick={() => setSelectedEquipmentForVmt(equipmentList[3])}>
                      <rect x="40" y="230" width="145" height="65" rx="6" fill="url(#eqInUseGrad)" stroke="#F43F5E" strokeWidth="1.8" />
                      <circle cx="173" cy="240" r="4" fill="#F43F5E" className="animate-ping" />
                      <circle cx="173" cy="240" r="3" fill="#F43F5E" />
                      <text x="112" y="258" textAnchor="middle" fill="#FFF" fontSize="9" fontWeight="900">Oedometer (Consolidation 1-6)</text>
                      <text x="112" y="272" textAnchor="middle" fill="#FECDD3" fontSize="7.5" fontStyle="mono">6 Cell Active</text>
                      <rect x="62" y="280" width="100" height="9" rx="2" fill="#881337" />
                      <text x="112" y="287" textAnchor="middle" fill="#FFF" fontSize="7" fontWeight="bold">IN USE (90% USAGE)</text>
                    </g>

                    {/* Direct Shear Motorized */}
                    <g className="cursor-pointer" onClick={() => setSelectedEquipmentForVmt(equipmentList[5])}>
                      <rect x="200" y="230" width="140" height="65" rx="6" fill="url(#eqReservedGrad)" stroke="#F59E0B" strokeWidth="1.8" />
                      <circle cx="328" cy="240" r="3" fill="#F59E0B" />
                      <text x="270" y="258" textAnchor="middle" fill="#FFF" fontSize="9" fontWeight="900">Direct Shear Motorized</text>
                      <text x="270" y="272" textAnchor="middle" fill="#FDE68A" fontSize="7.5" fontStyle="mono">Load Ring 10 kN</text>
                      <rect x="220" y="280" width="100" height="9" rx="2" fill="#78350F" />
                      <text x="270" y="287" textAnchor="middle" fill="#FFF" fontSize="7" fontWeight="bold">RESERVED (15:00)</text>
                    </g>

                    {/* Triaxial Cell */}
                    <g className="cursor-pointer" onClick={() => setSelectedEquipmentForVmt(equipmentList[4])}>
                      <rect x="355" y="230" width="150" height="65" rx="6" fill="url(#eqAvailableGrad)" stroke="#10B981" strokeWidth="1.8" />
                      <circle cx="493" cy="240" r="3" fill="#10B981" />
                      <text x="430" y="258" textAnchor="middle" fill="#FFF" fontSize="9" fontWeight="900">Triaxial UU/CU/CD Cell</text>
                      <text x="430" y="272" textAnchor="middle" fill="#A7F3D0" fontSize="7.5" fontStyle="mono">Digital Pressure Panel</text>
                      <rect x="380" y="280" width="100" height="9" rx="2" fill="#064E3B" />
                      <text x="430" y="287" textAnchor="middle" fill="#FFF" fontSize="7" fontWeight="bold">READY TO TEST</text>
                    </g>

                    {/* UCT Press */}
                    <g className="cursor-pointer">
                      <rect x="520" y="230" width="155" height="65" rx="6" fill="url(#eqAvailableGrad)" stroke="#10B981" strokeWidth="1.8" />
                      <circle cx="663" cy="240" r="3" fill="#10B981" />
                      <text x="597" y="258" textAnchor="middle" fill="#FFF" fontSize="9" fontWeight="900">UCT Press Frame</text>
                      <text x="597" y="272" textAnchor="middle" fill="#A7F3D0" fontSize="7.5" fontStyle="mono">Unconfined Compression</text>
                      <rect x="547" y="280" width="100" height="9" rx="2" fill="#064E3B" />
                      <text x="597" y="287" textAnchor="middle" fill="#FFF" fontSize="7" fontWeight="bold">READY TO TEST</text>
                    </g>

                    {/* Lower Bench: Physical Properties (SG, MC, Unit Weight, Hydrometer) */}
                    <g>
                      <rect x="40" y="310" width="635" height="140" fill="#0B1329" stroke="#334155" strokeWidth="1.5" rx="8" />
                      <rect x="45" y="315" width="625" height="20" fill="#1E293B" rx="4" />
                      <text x="357" y="329" textAnchor="middle" fill="#CBD5E1" fontSize="9" fontWeight="900">MEJA PENGUJIAN SIFAT FISIK &amp; HIDROMETER (SG, MC, UNIT WEIGHT)</text>

                      {/* Station 1: Piknometer */}
                      <g className="cursor-pointer" onClick={() => setSelectedEquipmentForVmt(equipmentList[7])}>
                        <rect x="55" y="345" width="110" height="90" rx="6" fill="#1E293B" stroke="#0284C7" strokeWidth="1.2" />
                        <circle cx="110" cy="375" r="16" fill="#0284C7" />
                        <text x="110" y="379" textAnchor="middle" fill="#FFF" fontSize="8" fontWeight="bold">Piknometer</text>
                        <text x="110" y="410" textAnchor="middle" fill="#38BDF8" fontSize="7.5" fontWeight="bold">20 Botol Terkalibrasi</text>
                      </g>

                      {/* Station 2: Balance */}
                      <g className="cursor-pointer" onClick={() => setSelectedEquipmentForVmt(equipmentList[7])}>
                        <rect x="180" y="345" width="110" height="90" rx="6" fill="#1E293B" stroke="#0284C7" strokeWidth="1.2" />
                        <circle cx="235" cy="375" r="16" fill="#0284C7" />
                        <text x="235" y="379" textAnchor="middle" fill="#FFF" fontSize="8" fontWeight="bold">Balance</text>
                        <text x="235" y="410" textAnchor="middle" fill="#38BDF8" fontSize="7.5" fontWeight="bold">Presisi 0.01g</text>
                      </g>

                      {/* Station 3: Hydrometer */}
                      <g className="cursor-pointer">
                        <rect x="305" y="345" width="110" height="90" rx="6" fill="#1E293B" stroke="#0284C7" strokeWidth="1.2" />
                        <circle cx="360" cy="375" r="16" fill="#0284C7" />
                        <text x="360" y="379" textAnchor="middle" fill="#FFF" fontSize="8" fontWeight="bold">Hydrometer</text>
                        <text x="360" y="410" textAnchor="middle" fill="#38BDF8" fontSize="7.5" fontWeight="bold">Tabung 151H/152H</text>
                      </g>

                      {/* Station 4: Desikator */}
                      <g className="cursor-pointer">
                        <rect x="430" y="345" width="110" height="90" rx="6" fill="#1E293B" stroke="#0284C7" strokeWidth="1.2" />
                        <circle cx="485" cy="375" r="16" fill="#0284C7" />
                        <text x="485" y="379" textAnchor="middle" fill="#FFF" fontSize="8" fontWeight="bold">Desikator</text>
                        <text x="485" y="410" textAnchor="middle" fill="#38BDF8" fontSize="7.5" fontWeight="bold">Silika Gel Vakum</text>
                      </g>

                      {/* Station 5: Water Bath */}
                      <g className="cursor-pointer">
                        <rect x="555" y="345" width="110" height="90" rx="6" fill="#1E293B" stroke="#0284C7" strokeWidth="1.2" />
                        <circle cx="610" cy="375" r="16" fill="#0284C7" />
                        <text x="610" y="379" textAnchor="middle" fill="#FFF" fontSize="8" fontWeight="bold">Water Bath</text>
                        <text x="610" y="410" textAnchor="middle" fill="#38BDF8" fontSize="7.5" fontWeight="bold">Termostat 20°C</text>
                      </g>
                    </g>
                  </g>

                  {/* ROOM 6: STORAGE ROOM (RM-06) */}
                  <g className="group">
                    <rect x="700" y="190" width="180" height="135" fill="url(#roomBgGrad)" stroke="#334155" strokeWidth="1.8" rx="8" />
                    <rect x="705" y="195" width="170" height="22" fill="#1E293B" rx="4" />
                    <text x="713" y="209" fill="#38BDF8" fontSize="9" fontWeight="900" fontFamily="sans-serif">RM-06 | STORAGE ROOM</text>
                    
                    <rect x="715" y="230" width="70" height="85" rx="4" fill="#1E293B" stroke="#475569" strokeWidth="1.2" />
                    <text x="750" y="275" textAnchor="middle" fill="#94A3B8" fontSize="8" fontWeight="bold">Rak Cold-Room A</text>
                    
                    <rect x="795" y="230" width="75" height="85" rx="4" fill="#1E293B" stroke="#475569" strokeWidth="1.2" />
                    <text x="832" y="275" textAnchor="middle" fill="#94A3B8" fontSize="8" fontWeight="bold">Rak Cold-Room B</text>
                  </g>

                  {/* ROOM 7: DATA & DOCUMENT ROOM (RM-07) */}
                  <g className="group">
                    <rect x="700" y="335" width="85" height="130" fill="url(#roomBgGrad)" stroke="#334155" strokeWidth="1.8" rx="8" />
                    <rect x="705" y="340" width="75" height="20" fill="#1E293B" rx="4" />
                    <text x="742" y="353" textAnchor="middle" fill="#38BDF8" fontSize="7.5" fontWeight="900" fontFamily="sans-serif">RM-07 | DATA</text>
                    <text x="742" y="400" textAnchor="middle" fill="#94A3B8" fontSize="8" fontWeight="bold">Workstation</text>
                    <text x="742" y="415" textAnchor="middle" fill="#38BDF8" fontSize="7" fontStyle="mono">Server PC</text>
                  </g>

                  {/* ROOM 8: IPAL ROOM (RM-08) */}
                  <g className="group">
                    <rect x="795" y="335" width="85" height="130" fill="url(#roomBgGrad)" stroke="#334155" strokeWidth="1.8" rx="8" />
                    <rect x="800" y="340" width="75" height="20" fill="#1E293B" rx="4" />
                    <text x="837" y="353" textAnchor="middle" fill="#38BDF8" fontSize="7.5" fontWeight="900" fontFamily="sans-serif">RM-08 | IPAL</text>
                    <text x="837" y="400" textAnchor="middle" fill="#94A3B8" fontSize="8" fontWeight="bold">Pengolahan</text>
                    <text x="837" y="415" textAnchor="middle" fill="#10B981" fontSize="7" fontStyle="mono">Limbah Tanah</text>
                  </g>
                </svg>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 3: T-CU DAILY SCHEDULE TIMELINE (GANTT CHART 09:00 - 17:00)       */}
      {/* ========================================================================= */}
      {activeSubTab === 'timeline' && (
        <div className="space-y-4">
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-sm space-y-3.5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                  <CalendarDays className="w-4 h-4 text-teal-600" />
                  <span>Daily Schedule — T-CU Timeline (Gantt Chart Harian 09:00 - 17:00)</span>
                </h3>
                <p className="text-xs text-slate-500 font-medium">Alokasi jadwal jam kerja pengujian alat &amp; teknisi lab real-time</p>
              </div>
              <span className="px-3 py-1 rounded-xl bg-teal-50 text-teal-900 font-mono font-extrabold text-xs border border-teal-200/80 shadow-2xs">
                07 Aug 2026
              </span>
            </div>

            {/* TIMELINE GANTT CHART GRID */}
            <div className="overflow-x-auto border border-slate-200/80 rounded-xl">
              <table className="w-full text-xs text-left border-collapse min-w-[750px]">
                <thead>
                  <tr className="bg-slate-100/90 text-slate-700 font-bold border-b border-slate-200 text-center text-[10px] uppercase tracking-wider">
                    <th className="py-2.5 px-3 text-left w-36 border-r border-slate-200">Resource / Alat</th>
                    {['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'].map(t => (
                      <th key={t} className="py-2.5 px-2 border-r border-slate-200 w-20">{t}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-mono text-[11px]">
                  {/* Row 1: Oven-01 */}
                  <tr>
                    <td className="py-2.5 px-3 font-extrabold text-slate-900 border-r border-slate-200 font-sans">Oven-01</td>
                    <td colSpan={3} className="p-1 border-r border-slate-200">
                      <div className="bg-rose-500 text-white p-1.5 rounded-lg font-bold text-[10px] text-center shadow-2xs">
                        Drying Sample UDS-001
                      </div>
                    </td>
                    <td colSpan={2} className="p-1 border-r border-slate-200">
                      <div className="bg-amber-500 text-white p-1.5 rounded-lg font-bold text-[10px] text-center shadow-2xs">
                        Drying Sample UDS-004
                      </div>
                    </td>
                    <td colSpan={3} className="bg-slate-50/60 border-r border-slate-200"></td>
                  </tr>

                  {/* Row 2: Soil Compactor */}
                  <tr>
                    <td className="py-2.5 px-3 font-extrabold text-slate-900 border-r border-slate-200 font-sans">Soil Compactor</td>
                    <td className="bg-slate-50/60 border-r border-slate-200"></td>
                    <td colSpan={2} className="p-1 border-r border-slate-200">
                      <div className="bg-rose-500 text-white p-1.5 rounded-lg font-bold text-[10px] text-center shadow-2xs">
                        Compaction DS-004
                      </div>
                    </td>
                    <td colSpan={2} className="p-1 border-r border-slate-200">
                      <div className="bg-amber-500 text-white p-1.5 rounded-lg font-bold text-[10px] text-center shadow-2xs">
                        Compaction BS-002
                      </div>
                    </td>
                    <td colSpan={3} className="bg-slate-50/60 border-r border-slate-200"></td>
                  </tr>

                  {/* Row 3: Oedometer */}
                  <tr>
                    <td className="py-2.5 px-3 font-extrabold text-slate-900 border-r border-slate-200 font-sans">Oedometer</td>
                    <td colSpan={2} className="bg-slate-50/60 border-r border-slate-200"></td>
                    <td colSpan={3} className="p-1 border-r border-slate-200">
                      <div className="bg-rose-500 text-white p-1.5 rounded-lg font-bold text-[10px] text-center shadow-2xs">
                        Consolidation UDS-003
                      </div>
                    </td>
                    <td colSpan={3} className="p-1 border-r border-slate-200">
                      <div className="bg-amber-500 text-white p-1.5 rounded-lg font-bold text-[10px] text-center shadow-2xs">
                        Consolidation UDS-006
                      </div>
                    </td>
                  </tr>

                  {/* Row 4: Triaxial UU-01 */}
                  <tr>
                    <td className="py-2.5 px-3 font-extrabold text-slate-900 border-r border-slate-200 font-sans">Triaxial UU-01</td>
                    <td colSpan={2} className="p-1 border-r border-slate-200">
                      <div className="bg-emerald-600 text-white p-1.5 rounded-lg font-bold text-[10px] text-center shadow-2xs">
                        UU Test DS-002
                      </div>
                    </td>
                    <td colSpan={3} className="bg-slate-50/60 border-r border-slate-200"></td>
                    <td colSpan={2} className="p-1 border-r border-slate-200">
                      <div className="bg-emerald-600 text-white p-1.5 rounded-lg font-bold text-[10px] text-center shadow-2xs">
                        UU Test DS-007
                      </div>
                    </td>
                    <td className="bg-slate-50/60 border-r border-slate-200"></td>
                  </tr>

                  {/* Row 5: Direct Shear-01 */}
                  <tr>
                    <td className="py-2.5 px-3 font-extrabold text-slate-900 border-r border-slate-200 font-sans">Direct Shear-01</td>
                    <td colSpan={2} className="bg-slate-50/60 border-r border-slate-200"></td>
                    <td colSpan={2} className="p-1 border-r border-slate-200">
                      <div className="bg-rose-500 text-white p-1.5 rounded-lg font-bold text-[10px] text-center shadow-2xs">
                        DS CU Test DS-005
                      </div>
                    </td>
                    <td colSpan={2} className="p-1 border-r border-slate-200">
                      <div className="bg-amber-500 text-white p-1.5 rounded-lg font-bold text-[10px] text-center shadow-2xs">
                        DS CD Test DS-008
                      </div>
                    </td>
                    <td colSpan={2} className="bg-slate-50/60 border-r border-slate-200"></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 4: MONITORING MATRIX PO                                           */}
      {/* ========================================================================= */}
      {activeSubTab === 'po_matrix' && (
        <ExistingPODashboard
          pos={pos}
          searchTerm={searchTerm}
          testCatalogue={testCatalogue}
          onOpenCalcModal={onOpenCalcModal}
          onSelectPO={onSelectPO}
          onUpdateTestStatus={onUpdateTestStatus}
          onUpdateSampleAssignedTests={onUpdateSampleAssignedTests}
          onOpenLHUModal={onOpenLHUModal}
        />
      )}

      {/* ===== MODAL VMT (VIRTUAL TECHNICAL MANUAL) EQUIPMENT DETAIL ===== */}
      {selectedEquipmentForVmt && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl overflow-hidden space-y-0">
            {/* Modal Header */}
            <div className="p-4 bg-slate-950 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-xl bg-teal-500/20 text-teal-400 border border-teal-500/30">
                  <Wrench className="w-5 h-5 text-teal-400" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-white">{selectedEquipmentForVmt.name}</h3>
                  <p className="text-[10px] text-slate-300 font-mono">{selectedEquipmentForVmt.room}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedEquipmentForVmt(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 space-y-3.5 text-xs text-slate-700">
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200/90">
                <span className="font-extrabold text-slate-700">Status Alat:</span>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-black uppercase ${
                  selectedEquipmentForVmt.status === 'In Use' ? 'bg-rose-600 text-white' :
                  selectedEquipmentForVmt.status === 'Reserved' ? 'bg-amber-500 text-white' :
                  'bg-emerald-600 text-white'
                }`}>
                  {selectedEquipmentForVmt.status} ({selectedEquipmentForVmt.usage}%)
                </span>
              </div>

              {selectedEquipmentForVmt.assignedSample && (
                <div className="space-y-1 p-3 rounded-xl bg-teal-50 border border-teal-200 text-teal-950 font-mono">
                  <div className="text-[10px] font-bold text-teal-700 uppercase">SAMPEL SEDANG DIUJI:</div>
                  <div className="font-extrabold text-sm text-teal-900">{selectedEquipmentForVmt.assignedSample}</div>
                  <div className="text-[11px] text-slate-600 font-sans">Operator: <strong>{selectedEquipmentForVmt.operator}</strong></div>
                </div>
              )}

              {selectedEquipmentForVmt.tempReading && (
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-950 font-mono text-[11px]">
                  <span>Telemetry / Sensor Temp:</span>
                  <strong className="text-amber-900 font-bold">{selectedEquipmentForVmt.tempReading}</strong>
                </div>
              )}

              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="font-extrabold text-slate-900 text-xs">VMT (Virtual Technical Manual &amp; Kalibrasi):</div>
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-100/80 text-slate-800 text-[11px]">
                  <span>Kode SOP / IK:</span>
                  <strong className="font-mono text-teal-700 font-bold">{selectedEquipmentForVmt.sopCode || 'IK-LAB-001'}</strong>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-100/80 text-slate-800 text-[11px]">
                  <span>Status Kalibrasi ISO 17025:</span>
                  <span className="text-emerald-700 font-extrabold flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Terkalibrasi (s/d Dec 2026)
                  </span>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <span className="text-[10px] text-slate-400 font-mono font-bold">TIMES® VMT Module</span>
              <button
                onClick={() => setSelectedEquipmentForVmt(null)}
                className="px-4 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs cursor-pointer transition shadow-xs"
              >
                Tutup VMT
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
