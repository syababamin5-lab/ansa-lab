import React, { useState } from 'react';
import { PurchaseOrder, Sample, SampleTest } from '../../types';
import { UserProfile, USER_ROLE_LABELS } from '../../types/userTypes';
import {
  Clock,
  CheckCircle2,
  AlertTriangle,
  Camera,
  Scale,
  Timer,
  ChevronRight,
  Sparkles,
  ArrowRight,
  FileSpreadsheet,
  Wifi,
  WifiOff,
  RefreshCw,
  UserCheck,
  User,
  Play,
  Plus
} from 'lucide-react';

import { isSingleTestAssignedToUser } from '../../utils/userPermissions';
import { getTestStatus3State } from '../../utils/helpers';
import { getMobileTestButtonState } from '../../utils/mobileSync';

interface MobileDashboardViewProps {
  pos: PurchaseOrder[];
  currentUser: UserProfile;
  isOnline?: boolean;
  onToggleOnlineMode?: () => void;
  pendingQueueCount?: number;
  onManualSync?: () => void;
  onNavigateTab: (tabId: string) => void;
  onOpenWorksheet: (sample: Sample, po: PurchaseOrder, initialTestCode?: string) => void;
}

interface MobileTaskCard {
  sample: Sample;
  po: PurchaseOrder;
  test: SampleTest;
  testCode: string;
  testName: string;
  assignedTechnicianName?: string;
}

const getTestBadgeProps = (code: string) => {
  const norm = (code || '').toUpperCase().trim();
  if (norm === 'SG') return { bg: 'bg-blue-600', text: 'text-white', border: 'border-blue-700', label: 'Specific Gravity (Gs) - Berat Jenis' };
  if (norm === 'MC') return { bg: 'bg-emerald-600', text: 'text-white', border: 'border-emerald-700', label: 'Moisture Content (w) - Kadar Air' };
  if (norm === 'UW') return { bg: 'bg-teal-600', text: 'text-white', border: 'border-teal-700', label: 'Unit Weight (γ) - Berat Volume' };
  if (norm === 'ATB' || norm === 'ATT') return { bg: 'bg-purple-600', text: 'text-white', border: 'border-purple-700', label: 'Atterberg Limits (ATB)' };
  if (norm === 'SIEVE-HYDRO' || norm === 'SVE-HYD' || norm === 'S&H' || norm === 'SVE') return { bg: 'bg-indigo-600', text: 'text-white', border: 'border-indigo-700', label: 'Sieve Analysis & Hydrometer (Sieve-Hydro)' };
  if (norm === 'PB' || norm === 'PRM' || norm === 'PERM') return { bg: 'bg-cyan-600', text: 'text-white', border: 'border-cyan-700', label: 'Permeability (PB - Falling Head)' };
  if (norm === 'CT' || norm === 'CNS') return { bg: 'bg-amber-600', text: 'text-white', border: 'border-amber-700', label: 'Consolidation Oedometer (CT)' };
  if (norm === 'UCT') return { bg: 'bg-rose-600', text: 'text-white', border: 'border-rose-700', label: 'Unconfined Compression Test' };
  if (norm.startsWith('CMP')) return { bg: 'bg-orange-600', text: 'text-white', border: 'border-orange-700', label: 'Compaction Proctor' };
  if (norm.startsWith('TRX')) return { bg: 'bg-violet-600', text: 'text-white', border: 'border-violet-700', label: 'Triaxial Compression Test' };
  if (norm.startsWith('DS')) return { bg: 'bg-fuchsia-600', text: 'text-white', border: 'border-fuchsia-700', label: 'Direct Shear Test' };
  if (norm.startsWith('CBR')) return { bg: 'bg-amber-700', text: 'text-white', border: 'border-amber-800', label: 'CBR Laboratory Test' };
  return { bg: 'bg-blue-600', text: 'text-white', border: 'border-blue-700', label: `Pengujian ${norm}` };
};

export const MobileDashboardView: React.FC<MobileDashboardViewProps> = ({
  pos,
  currentUser,
  isOnline = true,
  onToggleOnlineMode,
  pendingQueueCount = 0,
  onManualSync,
  onNavigateTab,
  onOpenWorksheet,
}) => {
  const isManagement = ['SUPER_ADMIN', 'LAB_MANAGER', 'QA_QC_COORDINATOR', 'EXECUTIVE_DIRECTOR'].includes(currentUser?.role);
  const [selectedTechFilter, setSelectedTechFilter] = useState<string>('my_tasks');

  // Helper get assigned technician name for display
  const getAssignedName = (test: SampleTest, sample: Sample): string => {
    const calc = test.calculationData || {};
    const name = test.technicianName || test.assignedTechnician || test.testedBy ||
      calc.inputValues?.testedBy || calc.inputValues?.assignedTechnician ||
      calc.summaryResults?.testedBy || sample.testedBy || sample.assignedTechnician;
    return name?.trim() || '';
  };

  // Collect assigned task cards (1 card per sample per test form)
  const myTaskCards: MobileTaskCard[] = [];
  let totalTestsCount = 0;
  let completedTestsCount = 0;
  let totalPhotosCount = 0;

  (pos || []).forEach(po => {
    (po.samples || []).forEach(sample => {
      const tests = sample.tests || [];

      tests.forEach(test => {
        const code = (test.testTypeCode || test.testTypeId || 'SG').toUpperCase();
        if (code === 'PP') return; // PP is a category header, not a standalone test form

        const assignedName = getAssignedName(test, sample);

        // FILTER PENUGASAN STRICT DI MENU HOME:
        // Jika login sebagai Teknisi (ANALYST): Hanya hitung & tampilkan pengujian yang di-assign ke teknisi ini!
        // Jika login sebagai Super Admin / Manager: Tampilkan sesuai filter pilihan
        let shouldInclude = false;

        if (!isManagement) {
          shouldInclude = isSingleTestAssignedToUser(test, sample, currentUser);
        } else {
          if (selectedTechFilter === 'my_tasks') {
            shouldInclude = isSingleTestAssignedToUser(test, sample, currentUser);
          } else if (selectedTechFilter === 'all') {
            shouldInclude = true;
          } else if (selectedTechFilter === 'unassigned') {
            shouldInclude = !assignedName;
          } else {
            const mockUser: Partial<UserProfile> = {
              name: selectedTechFilter,
              shortName: selectedTechFilter,
              nip: selectedTechFilter,
            };
            shouldInclude = isSingleTestAssignedToUser(test, sample, mockUser as UserProfile);
          }
        }

        if (shouldInclude) {
          totalTestsCount++;
          const isDone = test.status === 'Selesai' || test.calculationStatus === 'Calculated';
          if (isDone) completedTestsCount++;

          totalPhotosCount += (sample.photos?.length || 0) + (test.photos?.length || 0);

          myTaskCards.push({
            sample,
            po,
            test,
            testCode: code,
            testName: test.testTypeName || code,
            assignedTechnicianName: assignedName || 'Belum Di-Assign'
          });
        }
      });
    });
  });

  const activeQueueCount = myTaskCards.filter(c => c.test.status !== 'Selesai' && c.test.calculationStatus !== 'Calculated').length;

  const urgentSamples = myTaskCards.filter(({ po }) => {
    const diffHours = (new Date(po.deadline).getTime() - new Date().getTime()) / (3600 * 1000);
    return diffHours < 48 && po.status !== 'Completed';
  });

  return (
    <div className="space-y-4 pb-20 font-sans">
      {/* TECHNICIAN WELCOME HEADER BANNER */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-slate-900 text-white p-4 sm:p-5 rounded-2xl shadow-md space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-lg font-black text-white shadow-inner">
              {currentUser.avatarInitials || 'AN'}
            </div>
            <div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <h1 className="text-base font-black tracking-tight">{currentUser.name}</h1>
                {currentUser.analyistCode && (
                  <span className="px-2 py-0.5 rounded-full bg-amber-400 text-amber-950 font-black text-[9.5px] font-mono shadow-xs">
                    {currentUser.analyistCode}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-blue-200 font-mono">
                {USER_ROLE_LABELS[currentUser.role]} • {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short' })}
              </p>
            </div>
          </div>

          <button
            onClick={onToggleOnlineMode}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold backdrop-blur-xs transition active:scale-95 cursor-pointer border ${
              isOnline
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40 hover:bg-emerald-500/30'
                : 'bg-amber-500/25 text-amber-200 border-amber-400/50 hover:bg-amber-500/35'
            }`}
            title="Klik untuk beralih antara Mode Online dan Offline"
          >
            <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`}></span>
            <span>{isOnline ? 'Live Sync' : 'Offline'}</span>
            {pendingQueueCount > 0 && (
              <span className="bg-amber-900 text-amber-100 px-1.5 py-0.2 rounded-full text-[9px] font-mono font-black">
                {pendingQueueCount}
              </span>
            )}
          </button>
        </div>

        {/* PROGRESS MINI BAR */}
        <div className="space-y-1.5 pt-1">
          <div className="flex items-center justify-between text-xs font-semibold text-blue-100">
            <span>Progres Form Uji Hari Ini:</span>
            <span className="font-mono font-bold">{completedTestsCount} / {totalTestsCount} Form Selesai</span>
          </div>
          <div className="w-full bg-blue-950/60 rounded-full h-2 overflow-hidden border border-white/10">
            <div
              className="bg-gradient-to-r from-teal-400 to-emerald-400 h-full rounded-full transition-all duration-500"
              style={{ width: `${totalTestsCount > 0 ? (completedTestsCount / totalTestsCount) * 100 : 0}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* MANAGEMENT FILTER OPTIONS FOR SUPER ADMIN / MANAGER */}
      {isManagement && (
        <div className="p-3 bg-white border border-slate-200 rounded-2xl shadow-2xs space-y-1.5">
          <div className="flex items-center justify-between text-xs font-bold text-slate-800">
            <span className="flex items-center gap-1.5 text-teal-800 font-extrabold">
              <UserCheck className="w-4 h-4 text-teal-600" />
              <span>Filter Ringkasan Home per Teknisi</span>
            </span>
            <span className="text-[10.5px] font-mono text-slate-500">Super Admin Control</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-xs">
            <button
              onClick={() => setSelectedTechFilter('my_tasks')}
              className={`px-2.5 py-1.5 rounded-xl font-bold transition cursor-pointer text-[11px] ${
                selectedTechFilter === 'my_tasks' ? 'bg-teal-600 text-white shadow-xs' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Tugas Saya ({currentUser.shortName})
            </button>
            <button
              onClick={() => setSelectedTechFilter('all')}
              className={`px-2.5 py-1.5 rounded-xl font-bold transition cursor-pointer text-[11px] ${
                selectedTechFilter === 'all' ? 'bg-teal-600 text-white shadow-xs' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Semua Uji Lab
            </button>
            <button
              onClick={() => setSelectedTechFilter('Rafi')}
              className={`px-2.5 py-1.5 rounded-xl font-bold transition cursor-pointer text-[11px] ${
                selectedTechFilter === 'Rafi' ? 'bg-teal-600 text-white shadow-xs' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Rafli / Rafi (AO#1)
            </button>
            <button
              onClick={() => setSelectedTechFilter('Noval')}
              className={`px-2.5 py-1.5 rounded-xl font-bold transition cursor-pointer text-[11px] ${
                selectedTechFilter === 'Noval' ? 'bg-teal-600 text-white shadow-xs' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Noval Fadli
            </button>
          </div>
        </div>
      )}

      {/* KPI STATS CARDS */}
      <div className="grid grid-cols-2 gap-3">
        {/* Antrean Aktif */}
        <div
          onClick={() => onNavigateTab('tasks')}
          className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs hover:shadow-md transition active:scale-98 cursor-pointer flex flex-col justify-between"
        >
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-extrabold text-slate-700">Antrean Aktif:</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-black text-slate-900 leading-none">{activeQueueCount}</span>
            <span className="text-xs font-bold text-slate-500 ml-1.5">Form Uji</span>
          </div>
          <div className="text-[10.5px] font-bold text-blue-600 mt-2 flex items-center gap-1">
            <span>Buka Antrean</span>
            <span>➔</span>
          </div>
        </div>

        {/* Mendekati Deadline */}
        <div
          onClick={() => onNavigateTab('tasks')}
          className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs hover:shadow-md transition active:scale-98 cursor-pointer flex flex-col justify-between"
        >
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-extrabold text-slate-700">Mendekati Deadline:</span>
            <AlertTriangle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-black text-rose-600 leading-none">{urgentSamples.length}</span>
            <span className="text-xs font-bold text-slate-500 ml-1.5">Form Uji</span>
          </div>
          <div className="text-[10.5px] font-bold text-rose-600 mt-2 flex items-center gap-1">
            <span>&lt; 48 Jam ➔</span>
          </div>
        </div>

        {/* Selesai Diuji */}
        <div
          onClick={() => onNavigateTab('history')}
          className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs hover:shadow-md transition active:scale-98 cursor-pointer flex flex-col justify-between"
        >
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-extrabold text-slate-700">Selesai Diuji:</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-black text-emerald-600 leading-none">{completedTestsCount}</span>
            <span className="text-xs font-bold text-slate-500 ml-1.5">Form</span>
          </div>
          <div className="text-[10.5px] font-bold text-emerald-600 mt-2 flex items-center gap-1">
            <span>Lihat Histori ➔</span>
          </div>
        </div>

        {/* Foto Terlampir */}
        <div
          onClick={() => onNavigateTab('tasks')}
          className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs hover:shadow-md transition active:scale-98 cursor-pointer flex flex-col justify-between"
        >
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-extrabold text-slate-700">Foto Terlampir:</span>
            <Camera className="w-4 h-4 text-purple-500" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-black text-purple-600 leading-none">{totalPhotosCount}</span>
            <span className="text-xs font-bold text-slate-500 ml-1.5">Foto</span>
          </div>
          <div className="text-[10.5px] font-bold text-purple-600 mt-2 flex items-center gap-1">
            <span>Dokumentasi ➔</span>
          </div>
        </div>
      </div>

      {/* QUICK ACTION BANNER */}
      <div className="grid grid-cols-2 gap-2.5">
        <button
          onClick={() => onNavigateTab('tasks')}
          className="p-3.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-extrabold text-xs flex items-center justify-between shadow-xs hover:shadow-md transition cursor-pointer active:scale-98"
        >
          <div className="flex items-center gap-2 text-left">
            <FileSpreadsheet className="w-4 h-4 text-blue-200" />
            <div>
              <div className="leading-tight">Antrean Tugas</div>
              <div className="text-[10px] text-blue-200 font-normal">Daftar Form Uji</div>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-blue-200" />
        </button>

        <button
          onClick={() => onNavigateTab('timers')}
          className="p-3.5 rounded-2xl bg-gradient-to-r from-orange-600 to-amber-600 text-white font-extrabold text-xs flex items-center justify-between shadow-xs hover:shadow-md transition cursor-pointer active:scale-98"
        >
          <div className="flex items-center gap-2 text-left">
            <Timer className="w-4 h-4 text-orange-200" />
            <div>
              <div className="leading-tight">Timer Lab</div>
              <div className="text-[10px] text-orange-200 font-normal">Oven, CBR &amp; Consol</div>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-orange-200" />
        </button>
      </div>

      {/* PRIORITY TODAY TASK LIST (FILERED STRICTLY PER ASSIGNED TECHNICIAN) */}
      <div className="space-y-3 pt-1">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-black uppercase text-slate-800 tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>Tugas Form Uji Prioritas Hari Ini</span>
          </h2>
          <button
            onClick={() => onNavigateTab('tasks')}
            className="text-xs font-extrabold text-blue-600 hover:text-blue-800 transition"
          >
            Lihat Semua Antrean ({myTaskCards.length}) ➔
          </button>
        </div>

        {myTaskCards.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-3xl p-6 text-center space-y-2">
            <UserCheck className="w-6 h-6 text-teal-600 mx-auto" />
            <h3 className="text-xs font-extrabold text-slate-900">Belum Ada Tugas Ditugaskan di Home</h3>
            <p className="text-[11px] text-slate-500 font-medium max-w-xs mx-auto">
              {isManagement
                ? 'Tidak ada tugas yang di-assign untuk filter teknisi ini.'
                : `Halo ${currentUser.shortName}, belum ada form pengujian yang di-assign khusus kepada Anda (Tested By).`}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {myTaskCards.slice(0, 5).map(({ sample, po, test, testCode, assignedTechnicianName }) => {
              const badgeProps = getTestBadgeProps(testCode);

              return (
                <div
                  key={`${sample.id}-${testCode}-${test.id}`}
                  onClick={() => onOpenWorksheet(sample, po, testCode)}
                  className="bg-white border border-slate-200 hover:border-blue-500 rounded-3xl p-4 shadow-2xs hover:shadow-md transition-all cursor-pointer active:scale-98 space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-10 h-10 rounded-2xl ${badgeProps.bg} text-white flex items-center justify-center font-black text-xs shrink-0 shadow-2xs`}>
                        {testCode}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <strong className="text-sm font-black text-slate-900 leading-tight">{sample.sampleCode}</strong>
                          <span className="text-[10px] text-slate-400 font-mono">({sample.sampleLabCode})</span>
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="px-2 py-0.2 rounded-full bg-amber-50 text-amber-900 border border-amber-200 text-[9.5px] font-extrabold font-mono">
                            PO: {po.poNumber}
                          </span>
                          <span className="text-[10.5px] text-slate-500 font-medium truncate max-w-[130px]">{po.clientName}</span>
                        </div>
                      </div>
                    </div>

                    {(() => {
                      const btn = getMobileTestButtonState(test);
                      return (
                        <button className={`px-3 py-1.5 rounded-xl ${btn.bgClass} text-xs font-extrabold flex items-center gap-1 shrink-0 shadow-2xs transition active:scale-95`}>
                          {btn.statusType === 'completed' && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                          {btn.statusType === 'draft' && <Play className="w-3 h-3 fill-current" />}
                          {btn.statusType === 'unstarted' && <Plus className="w-3.5 h-3.5" />}
                          <span>{btn.label}</span>
                        </button>
                      );
                    })()}
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1">
                    <span className="font-bold text-slate-700 truncate max-w-[190px]">{badgeProps.label}</span>
                    {sample.depth && (
                      <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-900 font-mono font-bold text-[10px] shrink-0 border border-blue-200">
                        Kedalaman: {sample.depth}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
