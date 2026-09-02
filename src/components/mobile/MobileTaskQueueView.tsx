import React, { useState, useEffect } from 'react';
import { PurchaseOrder, Sample, SampleTest } from '../../types';
import { UserProfile } from '../../types/userTypes';
import {
  Search,
  CheckCircle2,
  Clock,
  Layers,
  ChevronRight,
  Sparkles,
  Camera,
  ArrowRight,
  FileSpreadsheet,
} from 'lucide-react';

import { isSampleAssignedToUser } from '../../utils/userPermissions';
import { getTestStatus3State } from '../../utils/helpers';

interface MobileTaskQueueViewProps {
  pos: PurchaseOrder[];
  currentUser: UserProfile;
  activeFilter?: 'all' | 'unstarted' | 'draft' | 'completed';
  onFilterChange?: (filter: 'all' | 'unstarted' | 'draft' | 'completed') => void;
  onOpenWorksheet: (sample: Sample, po: PurchaseOrder, initialTestCode?: string) => void;
}

interface MobileTaskCard {
  id: string;
  sample: Sample;
  po: PurchaseOrder;
  test: SampleTest;
  testCode: string;
  testName: string;
  status: string;
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

export const MobileTaskQueueView: React.FC<MobileTaskQueueViewProps> = ({
  pos,
  currentUser,
  activeFilter: externalActiveFilter = 'unstarted',
  onFilterChange,
  onOpenWorksheet,
}) => {
  const [activeFilter, setActiveFilter] = useState<'all' | 'unstarted' | 'draft' | 'completed'>(externalActiveFilter);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    setActiveFilter(externalActiveFilter);
  }, [externalActiveFilter]);

  // Collect all task cards (1 card per sample per test form)
  const allTaskCards: MobileTaskCard[] = [];

  (pos || []).forEach(po => {
    (po.samples || []).forEach(sample => {
      const tests = sample.tests || [];
      tests.forEach(test => {
        const code = (test.testTypeCode || test.testTypeId || 'SG').toUpperCase();
        if (code === 'PP') return; // PP is a category header, not a standalone test form

        allTaskCards.push({
          id: `${sample.id}-${code}-${test.id}`,
          sample,
          po,
          test,
          testCode: code,
          testName: test.testTypeName || code,
          status: test.status || 'Belum Diuji'
        });
      });
    });
  });

  const getCardCategory = (test: any) => {
    const statusObj = getTestStatus3State(test);
    return statusObj.state;
  };

  const unstartedCount = allTaskCards.filter(({ test }) => getCardCategory(test) === 'unstarted').length;
  const draftCount = allTaskCards.filter(({ test }) => getCardCategory(test) === 'draft').length;
  const completedCount = allTaskCards.filter(({ test }) => getCardCategory(test) === 'completed').length;

  const handleFilterClick = (filter: 'all' | 'unstarted' | 'draft' | 'completed') => {
    setActiveFilter(filter);
    if (onFilterChange) onFilterChange(filter);
  };

  const query = searchQuery.trim().toLowerCase();

  const filteredCards = allTaskCards.filter(({ sample, po, testCode, testName, test }) => {
    const matchesQuery =
      sample.sampleCode.toLowerCase().includes(query) ||
      po.poNumber.toLowerCase().includes(query) ||
      po.clientName.toLowerCase().includes(query) ||
      testCode.toLowerCase().includes(query) ||
      testName.toLowerCase().includes(query);

    if (!matchesQuery) return false;

    const category = getCardCategory(test);
    if (activeFilter === 'unstarted') return category === 'unstarted';
    if (activeFilter === 'draft') return category === 'draft';
    if (activeFilter === 'completed') return category === 'completed';
    return true;
  });

  return (
    <div className="space-y-4 pb-20 font-sans">
      {/* SEARCH BAR */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Cari sampel, no PO, pengujian..."
          className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-4 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        />
      </div>

      {/* FILTER TABS */}
      <div className="flex bg-slate-100 p-1 rounded-xl gap-1">
        {[
          { id: 'all', label: `Semua (${allTaskCards.length})` },
          { id: 'unstarted', label: `Belum (${unstartedCount})` },
          { id: 'draft', label: `Proses (${draftCount})` },
          { id: 'completed', label: `Selesai (${completedCount})` },
        ].map(tab => {
          const isActive = activeFilter === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => handleFilterClick(tab.id as any)}
              className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-all text-center ${
                isActive
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* TASK CARDS LIST */}
      <div className="space-y-2.5">
        {filteredCards.map(({ sample, po, test, testCode }, idx) => {
          const badge = getTestBadgeProps(testCode);
          const statusObj = getTestStatus3State(test);
          const isDone = statusObj.state === 'completed';
          const isDraft = statusObj.state === 'draft';
          const totalPhotos = (sample.photos?.length || 0) + (test.photos?.length || 0);

          return (
            <div
              key={`${sample.id}-${testCode}-${idx}`}
              onClick={() => onOpenWorksheet(sample, po, testCode)}
              className="bg-white p-3.5 rounded-2xl border border-slate-200 hover:border-blue-500 transition-all shadow-2xs hover:shadow-md cursor-pointer space-y-2.5 active:scale-[0.99]"
            >
              {/* TOP ROW: 1. UJI APA + 3. KODE SAMPEL & 2. NO PO (HIGHLIGHTED) + STATUS */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2.5 min-w-0">
                  {/* 1. UJI APA */}
                  <span className={`px-2.5 py-1.5 rounded-xl text-xs font-black uppercase font-mono shadow-xs border shrink-0 ${badge.bg} ${badge.text} ${badge.border}`}>
                    {testCode}
                  </span>
                  
                  <div className="min-w-0">
                    {/* 3. KODE SAMPEL */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h3 className="text-xs font-black text-slate-900 leading-tight truncate">{sample.sampleCode}</h3>
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

                {/* STATUS BADGE */}
                {isDone ? (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[9.5px] flex items-center gap-1 shrink-0">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    <span>Selesai</span>
                  </span>
                ) : isDraft ? (
                  <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold text-[9.5px] flex items-center gap-1 shrink-0">
                    <Clock className="w-3 h-3 text-amber-600" />
                    <span>Dalam Proses</span>
                  </span>
                ) : (
                  <span className="px-2.5 py-1 rounded-xl bg-blue-600 text-white font-black text-[10px] shadow-xs shrink-0 hover:bg-blue-700">
                    Input Uji {testCode}
                  </span>
                )}
              </div>

              {/* TEST NAME & 4. KEDALAMAN (HIGHLIGHTED) */}
              <div className="p-2 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-[10.5px]">
                <span className="font-semibold text-slate-700 truncate max-w-[190px]">
                  {badge.label}
                </span>
                {/* 4. KEDALAMAN BERAPA */}
                <span className="font-mono font-black text-blue-800 bg-blue-50 border border-blue-200/80 px-2 py-0.5 rounded-md shrink-0">
                  Kedalaman: {sample.depthStart.toFixed(1)}-{sample.depthEnd.toFixed(1)}m
                </span>
              </div>

              {/* ACTION ROW */}
              <div className="flex items-center justify-between pt-0.5 text-[10.5px]">
                <div className="flex items-center gap-2 text-slate-400 font-mono text-[10px]">
                  {totalPhotos > 0 && (
                    <span className="flex items-center gap-1 text-blue-600 font-bold bg-blue-50 px-2 py-0.5 rounded-md">
                      <Camera className="w-3 h-3" />
                      <span>{totalPhotos} Foto</span>
                    </span>
                  )}
                  {sample.locationTag && (
                    <span>Rak: {sample.locationTag}</span>
                  )}
                </div>

                <div className="flex items-center gap-1 font-extrabold text-blue-600 hover:text-blue-700 text-xs">
                  <span>Buka Form</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </div>
              </div>
            </div>
          );
        })}

        {filteredCards.length === 0 && (
          <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 p-6 space-y-2">
            <Layers className="w-8 h-8 text-slate-300 mx-auto" />
            <h3 className="text-xs font-bold text-slate-700">Tidak Ada Form Uji</h3>
            <p className="text-[10.5px] text-slate-400">Tidak ada form pengujian yang sesuai dengan pencarian atau filter Anda.</p>
          </div>
        )}
      </div>
    </div>
  );
};
