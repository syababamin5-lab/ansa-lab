import React from 'react';
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
} from 'lucide-react';

import { isSampleAssignedToUser } from '../../utils/userPermissions';
import { getTestStatus3State } from '../../utils/helpers';

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
  // Collect assigned task cards (1 card per sample per test form)
  const myTaskCards: MobileTaskCard[] = [];
  let totalTestsCount = 0;
  let completedTestsCount = 0;
  let totalPhotosCount = 0;

  (pos || []).forEach(po => {
    (po.samples || []).forEach(sample => {
      const isMySample = isSampleAssignedToUser(sample, currentUser);
      const tests = sample.tests || [];
      totalPhotosCount += (sample.photos?.length || 0) + tests.reduce((acc, t) => acc + (t.photos?.length || 0), 0);

      tests.forEach(test => {
        const code = (test.testTypeCode || test.testTypeId || 'SG').toUpperCase();
        if (code === 'PP') return; // PP is a category header, not a standalone test form

        totalTestsCount++;
        const isDone = test.status === 'Selesai' || test.calculationStatus === 'Calculated';
        if (isDone) completedTestsCount++;

        myTaskCards.push({
          sample,
          po,
          test,
          testCode: code,
          testName: test.testTypeName || code
        });
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
        <div className="pt-2 border-t border-white/20 space-y-1">
          <div className="flex items-center justify-between text-[10.5px] text-blue-100 font-mono">
            <span>Progres Form Uji Hari Ini:</span>
            <strong>{completedTestsCount} / {totalTestsCount} Form Selesai</strong>
          </div>
          <div className="w-full bg-white/20 h-2 rounded-full overflow-hidden">
            <div
              className="bg-emerald-400 h-full rounded-full transition-all duration-500"
              style={{ width: `${totalTestsCount > 0 ? (completedTestsCount / totalTestsCount) * 100 : 0}%` }}
            />
          </div>
        </div>
      </div>

      {/* OFFLINE ACTIVE BANNER CARD */}
      {!isOnline && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-300 rounded-2xl p-3.5 shadow-xs flex items-center justify-between gap-2.5 animate-fade-in">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-200/70 text-amber-900 rounded-xl">
              <WifiOff className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-black text-amber-950">Mode Pengujian Offline</h4>
              <p className="text-[11px] text-amber-800 leading-tight mt-0.5">
                Data disimpan aman di HP{pendingQueueCount > 0 ? ` • ${pendingQueueCount} pengujian siap di-sync` : ''}.
              </p>
            </div>
          </div>

          <button
            onClick={onToggleOnlineMode}
            className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-extrabold flex items-center gap-1 shadow-xs transition active:scale-95 cursor-pointer shrink-0"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Aktifkan Online</span>
          </button>
        </div>
      )}

      {/* 4 QUICK METRICS CARDS */}
      <div className="grid grid-cols-2 gap-2 text-xs font-mono">
        <div
          onClick={() => onNavigateTab('tasks')}
          className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs space-y-1 cursor-pointer hover:border-blue-300 active:scale-95 transition"
        >
          <div className="flex items-center justify-between text-amber-600">
            <span className="text-[10px] font-bold text-slate-500">Antrean Aktif:</span>
            <Clock className="w-4 h-4" />
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono">{activeQueueCount} <span className="text-xs font-bold text-slate-400">Form Uji</span></div>
          <span className="text-[9.5px] text-blue-600 font-extrabold flex items-center gap-0.5">Buka Antrean ➔</span>
        </div>

        <div
          onClick={() => onNavigateTab('tasks')}
          className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs space-y-1 cursor-pointer hover:border-red-300 active:scale-95 transition"
        >
          <div className="flex items-center justify-between text-red-600">
            <span className="text-[10px] font-bold text-slate-500">Mendekati Deadline:</span>
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div className="text-2xl font-black text-red-600 font-mono">{urgentSamples.length} <span className="text-xs font-bold text-slate-400">Form Uji</span></div>
          <span className="text-[9.5px] text-red-600 font-extrabold flex items-center gap-0.5">&lt; 48 Jam ➔</span>
        </div>

        <div
          onClick={() => onNavigateTab('history')}
          className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs space-y-1 cursor-pointer hover:border-emerald-300 active:scale-95 transition"
        >
          <div className="flex items-center justify-between text-emerald-600">
            <span className="text-[10px] font-bold text-slate-500">Selesai Diuji:</span>
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div className="text-2xl font-black text-emerald-700 font-mono">{completedTestsCount} <span className="text-xs font-bold text-slate-400">Form</span></div>
          <span className="text-[9.5px] text-emerald-600 font-extrabold flex items-center gap-0.5">Lihat Histori ➔</span>
        </div>

        <div
          onClick={() => onNavigateTab('tasks')}
          className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs space-y-1 cursor-pointer hover:border-purple-300 active:scale-95 transition"
        >
          <div className="flex items-center justify-between text-purple-600">
            <span className="text-[10px] font-bold text-slate-500">Foto Terlampir:</span>
            <Camera className="w-4 h-4" />
          </div>
          <div className="text-2xl font-black text-purple-700 font-mono">{totalPhotosCount} <span className="text-xs font-bold text-slate-400">Foto</span></div>
          <span className="text-[9.5px] text-purple-600 font-extrabold flex items-center gap-0.5">Dokumentasi ➔</span>
        </div>
      </div>

      {/* QUICK SHORTCUT ACTIONS */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <button
          onClick={() => onNavigateTab('tasks')}
          className="p-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-extrabold flex items-center justify-between shadow-sm active:scale-95 transition cursor-pointer"
        >
          <div className="flex items-center gap-2 text-left">
            <FileSpreadsheet className="w-4 h-4 text-blue-200 shrink-0" />
            <div>
              <span className="block leading-tight text-xs font-black">Antrean Tugas</span>
              <span className="text-[9px] text-blue-100 font-normal">Daftar Form Uji</span>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-white/70" />
        </button>

        <button
          onClick={() => onNavigateTab('timers')}
          className="p-3 rounded-2xl bg-gradient-to-r from-amber-600 to-orange-600 text-white font-extrabold flex items-center justify-between shadow-sm active:scale-95 transition cursor-pointer"
        >
          <div className="flex items-center gap-2 text-left">
            <Timer className="w-4 h-4 text-amber-200 shrink-0" />
            <div>
              <span className="block leading-tight text-xs font-black">Timer Lab</span>
              <span className="text-[9px] text-amber-100 font-normal">Oven, CBR &amp; Consol</span>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-white/70" />
        </button>
      </div>

      {/* PRIORITY TEST TASK CARDS (1 CARD = 1 SAMPLE CODE + 1 TEST FORM) */}
      <div className="space-y-2.5">
        {(() => {
          const pendingTaskCards = myTaskCards.filter(({ test }) => getTestStatus3State(test).state !== 'completed');

          return (
            <>
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <h3 className="text-xs font-black uppercase text-slate-900 tracking-wider">
                    Tugas Form Uji Prioritas Hari Ini
                  </h3>
                </div>
                <button
                  onClick={() => onNavigateTab('tasks')}
                  className="text-[11px] font-extrabold text-blue-600 hover:text-blue-700"
                >
                  Lihat Semua Antrean ({pendingTaskCards.length}) ➔
                </button>
              </div>

              {pendingTaskCards.length === 0 ? (
                <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl text-center space-y-1.5 animate-fade-in">
                  <CheckCircle2 className="w-7 h-7 text-emerald-600 mx-auto" />
                  <h4 className="text-xs font-black text-emerald-950 uppercase tracking-wide">
                    Semua Tugas Form Uji Hari Ini Telah Selesai!
                  </h4>
                  <p className="text-[10.5px] text-emerald-700 font-mono">
                    Seluruh formulir pengujian telah diselesaikan oleh teknisi. Anda dapat melihat arsip hasil di menu Histori.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {pendingTaskCards.slice(0, 10).map(({ sample, po, test, testCode }, idx) => {
                    const badge = getTestBadgeProps(testCode);
                    const isRunning = test.status === 'Sedang Diuji' || test.calculationStatus === 'Draft Data';

                    return (
                      <div
                        key={`${sample.id}-${testCode}-${idx}`}
                        onClick={() => onOpenWorksheet(sample, po, testCode)}
                        className="bg-white p-3.5 rounded-2xl border border-slate-200 hover:border-blue-500 shadow-2xs hover:shadow-md cursor-pointer transition active:scale-[0.99] space-y-2.5"
                      >
                        {/* HEADER: 1. UJI APA + 3. KODE SAMPEL & 2. NO PO (HIGHLIGHTED) + ACTION BUTTON */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-start gap-2.5 min-w-0">
                            {/* 1. UJI APA */}
                            <span className={`px-2.5 py-1.5 rounded-xl text-xs font-black uppercase font-mono shadow-xs border shrink-0 ${badge.bg} ${badge.text} ${badge.border}`}>
                              {testCode}
                            </span>
                            <div className="min-w-0">
                              {/* 3. KODE SAMPEL */}
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <h4 className="text-xs font-black text-slate-900 leading-tight truncate">{sample.sampleCode}</h4>
                                {sample.idLab && (
                                  <span className="text-[9.5px] text-slate-400 font-mono">({sample.idLab})</span>
                                )}
                              </div>
                              
                              {/* 2. NO PO (PROMINENTLY HIGHLIGHTED) */}
                              <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-900 font-mono font-black text-[10px] border border-amber-300 shadow-2xs">
                                  <span className="text-amber-600 font-bold">PO:</span>
                                  <span>{po.poNumber}</span>
                                </span>
                                <span className="text-[10px] text-slate-400 font-medium truncate max-w-[140px]" title={po.clientName}>
                                  {po.clientName}
                                </span>
                              </div>
                            </div>
                          </div>

                          <span className={`px-2.5 py-1 rounded-xl font-black text-[10px] flex items-center gap-1 shadow-xs shrink-0 ${
                            isRunning
                              ? 'bg-amber-500 text-white animate-pulse'
                              : 'bg-blue-600 text-white hover:bg-blue-700'
                          }`}>
                            <span>{isRunning ? `Lanjutkan` : `Input Uji`}</span>
                          </span>
                        </div>

                        {/* SUBTITLE TEST TYPE & 4. KEDALAMAN (HIGHLIGHTED) */}
                        <div className="flex items-center justify-between text-[10.5px] pt-1.5 border-t border-slate-100 font-sans">
                          <span className="text-slate-600 font-semibold truncate max-w-[190px]">
                            {test.testTypeName || testCode}
                          </span>
                          {/* 4. KEDALAMAN BERAPA */}
                          <span className="text-blue-900 font-mono font-black bg-blue-50 border border-blue-200/80 px-2 py-0.5 rounded-md shrink-0">
                            Kedalaman: {sample.depthStart.toFixed(1)}-{sample.depthEnd.toFixed(1)}m
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          );
        })()}
      </div>
    </div>
  );
};
