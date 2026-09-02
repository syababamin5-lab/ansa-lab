import React, { useState } from 'react';
import { PurchaseOrder, Sample, SampleTest } from '../../types';
import { UserProfile } from '../../types/userTypes';
import {
  History,
  Search,
  CheckCircle2,
  Calendar,
  Filter,
  Camera,
  ChevronRight,
  Sparkles,
  FileSpreadsheet,
} from 'lucide-react';
import { normalizeTestCode, getTestStatus3State } from '../../utils/helpers';
import { isSampleAssignedToUser } from '../../utils/userPermissions';

interface MobileHistoryViewProps {
  pos: PurchaseOrder[];
  currentUser: UserProfile;
  onOpenSampleDetail?: (sample: Sample, po: PurchaseOrder, initialTestCode?: string) => void;
}

const getTestBadgeProps = (code: string) => {
  const norm = normalizeTestCode(code);
  if (norm === 'SG') return { bg: 'bg-blue-600', text: 'text-white', border: 'border-blue-700', label: 'Specific Gravity (Gs) - Berat Jenis' };
  if (norm === 'MC') return { bg: 'bg-emerald-600', text: 'text-white', border: 'border-emerald-700', label: 'Moisture Content (w) - Kadar Air' };
  if (norm === 'UW') return { bg: 'bg-teal-600', text: 'text-white', border: 'border-teal-700', label: 'Unit Weight (γ) - Berat Volume' };
  if (norm === 'ATB' || norm === 'ATT') return { bg: 'bg-purple-600', text: 'text-white', border: 'border-purple-700', label: 'Atterberg Limits (ATB)' };
  if (norm === 'Sieve-Hydro' || norm === 'SVE-HYD' || norm === 'S&H' || norm === 'SVE') return { bg: 'bg-indigo-600', text: 'text-white', border: 'border-indigo-700', label: 'Sieve Analysis & Hydrometer (Sieve-Hydro)' };
  if (norm === 'PB' || norm === 'PRM' || norm === 'PERM') return { bg: 'bg-cyan-600', text: 'text-white', border: 'border-cyan-700', label: 'Permeability (PB - Falling Head)' };
  if (norm === 'CT' || norm === 'CNS') return { bg: 'bg-amber-600', text: 'text-white', border: 'border-amber-700', label: 'Consolidation Oedometer (CT)' };
  if (norm === 'UCT') return { bg: 'bg-rose-600', text: 'text-white', border: 'border-rose-700', label: 'Unconfined Compression Test' };
  if (norm.startsWith('CMP')) return { bg: 'bg-orange-600', text: 'text-white', border: 'border-orange-700', label: 'Compaction Proctor' };
  if (norm.startsWith('TRX')) return { bg: 'bg-violet-600', text: 'text-white', border: 'border-violet-700', label: 'Triaxial Compression Test' };
  if (norm.startsWith('DS')) return { bg: 'bg-fuchsia-600', text: 'text-white', border: 'border-fuchsia-700', label: 'Direct Shear Test' };
  if (norm.startsWith('CBR')) return { bg: 'bg-amber-700', text: 'text-white', border: 'border-amber-800', label: 'CBR Laboratory Test' };
  return { bg: 'bg-blue-600', text: 'text-white', border: 'border-blue-700', label: `Pengujian ${norm}` };
};

type DateFilterType = 'all' | 'today' | 'yesterday' | 'week' | 'custom';

export const MobileHistoryView: React.FC<MobileHistoryViewProps> = ({
  pos,
  currentUser,
  onOpenSampleDetail,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState<DateFilterType>('all');
  const [customDate, setCustomDate] = useState('');

  // Collect all individual completed tests (1 item = 1 completed test + 1 sample + 1 PO)
  const completedTaskCards: Array<{
    sample: Sample;
    po: PurchaseOrder;
    test: SampleTest;
    testCode: string;
    testDate: string;
    totalPhotos: number;
  }> = [];

  const todayStr = new Date().toISOString().slice(0, 10);
  const yesterdayDate = new Date();
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterdayStr = yesterdayDate.toISOString().slice(0, 10);

  const sevenDaysAgoDate = new Date();
  sevenDaysAgoDate.setDate(sevenDaysAgoDate.getDate() - 7);
  const sevenDaysAgoStr = sevenDaysAgoDate.toISOString().slice(0, 10);

  (pos || []).forEach(po => {
    (po.samples || []).forEach(sample => {
      const isMySample = isSampleAssignedToUser(sample, currentUser);
      if (!isMySample) return;

      (sample.tests || []).forEach(test => {
        const rawCode = test.testTypeCode || test.testTypeId || '';
        const normCode = normalizeTestCode(rawCode);
        if (normCode === 'PP') return;

        const isDone = getTestStatus3State(test).state === 'completed';
        if (!isDone) return;

        // Determine date of test completion (or po date)
        const testDate = (test.startTime ? test.startTime.slice(0, 10) : '') ||
                         (sample.createdAt ? sample.createdAt.slice(0, 10) : '') ||
                         (po.preparationStartDate ? po.preparationStartDate.slice(0, 10) : '') ||
                         (po.startDate ? po.startDate.slice(0, 10) : todayStr);

        const totalPhotos = (test.photos?.length || 0) + (sample.photos?.length || 0);

        completedTaskCards.push({
          sample,
          po,
          test,
          testCode: normCode,
          testDate,
          totalPhotos,
        });
      });
    });
  });

  const query = searchQuery.trim().toLowerCase();

  const filteredCards = completedTaskCards.filter(item => {
    // 1. Text Search Filter
    const matchesSearch =
      item.sample.sampleCode.toLowerCase().includes(query) ||
      (item.sample.idLab && item.sample.idLab.toLowerCase().includes(query)) ||
      item.po.poNumber.toLowerCase().includes(query) ||
      item.po.clientName.toLowerCase().includes(query) ||
      item.po.projectName.toLowerCase().includes(query) ||
      item.testCode.toLowerCase().includes(query) ||
      (item.test.testTypeName && item.test.testTypeName.toLowerCase().includes(query));

    if (!matchesSearch) return false;

    // 2. Date Filter
    if (dateFilter === 'today') {
      return item.testDate === todayStr;
    } else if (dateFilter === 'yesterday') {
      return item.testDate === yesterdayStr;
    } else if (dateFilter === 'week') {
      return item.testDate >= sevenDaysAgoStr && item.testDate <= todayStr;
    } else if (dateFilter === 'custom' && customDate) {
      return item.testDate === customDate;
    }

    return true;
  });

  const uniqueSamples = new Set(filteredCards.map(c => `${c.po.id}-${c.sample.id}`)).size;

  return (
    <div className="space-y-3.5 pb-24 font-sans">
      {/* HEADER */}
      <div className="bg-gradient-to-r from-teal-700 via-emerald-800 to-slate-900 text-white p-4 rounded-2xl shadow-md space-y-1">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-white/10 rounded-xl backdrop-blur-xs">
            <History className="w-5 h-5 text-emerald-300" />
          </div>
          <div>
            <h2 className="text-base font-black tracking-tight">Histori Pengujian Analis</h2>
            <p className="text-xs text-emerald-100/90 font-medium">Arsip Setiap Pengujian yang Telah Selesai Dikerjakan</p>
          </div>
        </div>
      </div>

      {/* SEARCH BAR */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Cari kode sampel, no PO, pengujian..."
          className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-8 py-2.5 text-xs font-semibold text-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 shadow-2xs placeholder:text-slate-400 placeholder:font-normal"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold p-1 cursor-pointer"
          >
            ✕
          </button>
        )}
      </div>

      {/* DATE FILTER BUTTONS */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-[11px] font-bold text-slate-600 px-1">
          <span className="flex items-center gap-1">
            <Filter className="w-3.5 h-3.5 text-emerald-600" />
            <span>Filter Waktu Pengujian:</span>
          </span>
          {dateFilter === 'custom' && customDate && (
            <span className="font-mono text-emerald-700 font-extrabold">{customDate}</span>
          )}
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
          {[
            { id: 'all', label: 'Semua Hari' },
            { id: 'today', label: 'Hari Ini' },
            { id: 'yesterday', label: 'Kemarin' },
            { id: 'week', label: '7 Hari Terakhir' },
          ].map(f => {
            const isActive = dateFilter === f.id;
            return (
              <button
                key={f.id}
                onClick={() => setDateFilter(f.id as DateFilterType)}
                className={`px-3 py-1.5 rounded-xl font-bold text-[11px] whitespace-nowrap transition cursor-pointer shrink-0 ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                {f.label}
              </button>
            );
          })}

          <div className="relative shrink-0">
            <input
              type="date"
              value={customDate}
              onChange={e => {
                setCustomDate(e.target.value);
                setDateFilter('custom');
              }}
              className={`px-2.5 py-1 rounded-xl text-[11px] font-bold border transition cursor-pointer ${
                dateFilter === 'custom'
                  ? 'bg-emerald-50 text-emerald-900 border-emerald-500 ring-1 ring-emerald-500'
                  : 'bg-white text-slate-600 border-slate-200'
              }`}
            />
          </div>
        </div>
      </div>

      {/* METRICS ROW */}
      <div className="grid grid-cols-2 gap-2 text-xs font-mono">
        <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] text-slate-400 block font-sans">Total Form Uji Selesai:</span>
          <span className="text-lg font-black text-emerald-700">{filteredCards.length} Uji</span>
        </div>
        <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] text-slate-400 block font-sans">Sampel Terverifikasi:</span>
          <span className="text-lg font-black text-slate-800">{uniqueSamples} Sampel</span>
        </div>
      </div>

      {/* 1 CARD = 1 TEST + 1 SAMPLE + 1 PO */}
      <div className="space-y-2.5">
        {filteredCards.map(({ sample, po, test, testCode, testDate, totalPhotos }, idx) => {
          const badge = getTestBadgeProps(testCode);

          return (
            <div
              key={`${sample.id}-${testCode}-${idx}`}
              onClick={() => onOpenSampleDetail?.(sample, po, testCode)}
              className="bg-white p-3.5 rounded-2xl border border-slate-200 hover:border-emerald-500 transition-all shadow-2xs hover:shadow-md cursor-pointer space-y-2.5 active:scale-[0.99]"
            >
              {/* TOP ROW: 1. UJI APA + 3. KODE SAMPEL & 2. NO PO (HIGHLIGHTED) + SELESAI BADGE */}
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

                <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-extrabold text-[10px] flex items-center gap-1 shrink-0 shadow-2xs border border-emerald-300">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Selesai</span>
                </span>
              </div>

              {/* TEST NAME & 4. KEDALAMAN */}
              <div className="p-2 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-[10.5px]">
                <span className="font-semibold text-slate-700 truncate max-w-[190px]">
                  {test.testTypeName || badge.label}
                </span>
                {/* 4. KEDALAMAN */}
                <span className="font-mono font-black text-blue-800 bg-blue-50 border border-blue-200/80 px-2 py-0.5 rounded-md shrink-0">
                  Kedalaman: {sample.depthStart.toFixed(1)}-{sample.depthEnd.toFixed(1)}m
                </span>
              </div>

              {/* FOOTER ROW: DATE & ACTION */}
              <div className="flex items-center justify-between pt-0.5 text-[10.5px]">
                <div className="flex items-center gap-2 text-slate-400 font-mono text-[10px]">
                  <span className="flex items-center gap-1 text-slate-500 font-bold">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>{testDate}</span>
                  </span>

                  {totalPhotos > 0 && (
                    <span className="flex items-center gap-1 text-blue-600 font-bold bg-blue-50 px-2 py-0.5 rounded-md">
                      <Camera className="w-3 h-3" />
                      <span>{totalPhotos} Foto</span>
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1 font-extrabold text-emerald-700 hover:text-emerald-800 text-xs">
                  <span>Lihat Hasil Uji</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </div>
              </div>
            </div>
          );
        })}

        {filteredCards.length === 0 && (
          <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 p-6 space-y-2">
            <History className="w-8 h-8 text-slate-300 mx-auto" />
            <h3 className="text-xs font-bold text-slate-700">Tidak Ada Histori Pengujian</h3>
            <p className="text-[10.5px] text-slate-400">
              {searchQuery || dateFilter !== 'all'
                ? 'Tidak ada pengujian selesai yang cocok dengan kata kunci atau filter tanggal yang dipilih.'
                : 'Pengujian yang telah Anda selesaikan di Antrean Tugas akan otomatis diarsipkan di sini.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

