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
  Filter,
  UserCheck,
  User,
  Play,
  Plus
} from 'lucide-react';

import { isSingleTestAssignedToUser } from '../../utils/userPermissions';
import { getTestStatus3State } from '../../utils/helpers';
import { getMobileTestButtonState, isSieveHydroCode } from '../../utils/mobileSync';

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
  assignedTechnicianName?: string;
}

const getTestBadgeProps = (code: string) => {
  const norm = (code || '').toUpperCase().trim();
  if (norm === 'SG') return { bg: 'bg-blue-600', text: 'text-white', border: 'border-blue-700', label: 'Specific Gravity (Gs) - Berat Jenis' };
  if (norm === 'MC') return { bg: 'bg-emerald-600', text: 'text-white', border: 'border-emerald-700', label: 'Moisture Content (w) - Kadar Air' };
  if (norm === 'UW') return { bg: 'bg-teal-600', text: 'text-white', border: 'border-teal-700', label: 'Unit Weight (γ) - Berat Volume' };
  if (norm === 'ATB' || norm === 'ATT') return { bg: 'bg-purple-600', text: 'text-white', border: 'border-purple-700', label: 'Atterberg Limits (ATB)' };
  if (isSieveHydroCode(norm)) return { bg: 'bg-indigo-600', text: 'text-white', border: 'border-indigo-700', label: 'Sieve Analysis & Hydrometer (Sieve-Hydro)' };
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
  const [selectedTechFilter, setSelectedTechFilter] = useState<string>('my_tasks'); // 'my_tasks' | 'all' | 'unassigned' | 'rafi' | 'noval' | etc.

  useEffect(() => {
    setActiveFilter(externalActiveFilter);
  }, [externalActiveFilter]);

  const isManagement = ['SUPER_ADMIN', 'LAB_MANAGER', 'QA_QC_COORDINATOR', 'EXECUTIVE_DIRECTOR'].includes(currentUser?.role);

  // Helper get assigned technician name for display
  const getAssignedName = (test: SampleTest, sample: Sample): string => {
    const calc = test.calculationData || {};
    const name = test.technicianName || test.assignedTechnician || test.testedBy ||
      calc.inputValues?.testedBy || calc.inputValues?.assignedTechnician ||
      calc.summaryResults?.testedBy || sample.testedBy || sample.assignedTechnician;
    return name?.trim() || '';
  };

  // Collect all task cards (1 card per sample per test form)
  const allTaskCards: MobileTaskCard[] = [];

  (pos || []).forEach(po => {
    (po.samples || []).forEach(sample => {
      const tests = sample.tests || [];
      tests.forEach(test => {
        const code = (test.testTypeCode || test.testTypeId || 'SG').toUpperCase();
        if (code === 'PP') return; // PP is a category header

        const assignedName = getAssignedName(test, sample);

        // FILTER PENUGASAN STRICT:
        // Jika login sebagai Teknisi (ANALYST): Hanya tampilkan pengujian yang Tested By nya di-assign ke teknisi ini!
        // Jika login sebagai Super Admin / Manager: Tampilkan sesuai filter pilihan
        let shouldInclude = false;

        if (!isManagement) {
          // Strict filter per teknisi
          shouldInclude = isSingleTestAssignedToUser(test, sample, currentUser);
        } else {
          // Management filter options
          if (selectedTechFilter === 'my_tasks') {
            shouldInclude = isSingleTestAssignedToUser(test, sample, currentUser);
          } else if (selectedTechFilter === 'all') {
            shouldInclude = true;
          } else if (selectedTechFilter === 'unassigned') {
            shouldInclude = !assignedName;
          } else {
            // Match specific technician name filter
            const mockUser: Partial<UserProfile> = {
              name: selectedTechFilter,
              shortName: selectedTechFilter,
              nip: selectedTechFilter,
            };
            shouldInclude = isSingleTestAssignedToUser(test, sample, mockUser as UserProfile);
          }
        }

        if (shouldInclude) {
          allTaskCards.push({
            id: `${sample.id}-${code}-${test.id}`,
            sample,
            po,
            test,
            testCode: code,
            testName: test.testTypeName || code,
            status: test.status || 'Belum Diuji',
            assignedTechnicianName: assignedName || 'Belum Di-Assign'
          });
        }
      });
    });
  });

  const getCardCategory = (test: any) => {
    return getMobileTestButtonState(test).statusType;
  };

  const unstartedCount = allTaskCards.filter(({ test }) => getCardCategory(test) === 'unstarted').length;
  const draftCount = allTaskCards.filter(({ test }) => getCardCategory(test) === 'draft').length;
  const completedCount = allTaskCards.filter(({ test }) => getCardCategory(test) === 'completed').length;

  const handleFilterClick = (filter: 'all' | 'unstarted' | 'draft' | 'completed') => {
    setActiveFilter(filter);
    if (onFilterChange) onFilterChange(filter);
  };

  const query = searchQuery.trim().toLowerCase();

  const filteredCards = allTaskCards.filter(({ sample, po, testCode, testName, test, assignedTechnicianName }) => {
    const matchesQuery =
      sample.sampleCode.toLowerCase().includes(query) ||
      po.poNumber.toLowerCase().includes(query) ||
      po.clientName.toLowerCase().includes(query) ||
      testCode.toLowerCase().includes(query) ||
      testName.toLowerCase().includes(query) ||
      (assignedTechnicianName || '').toLowerCase().includes(query);

    if (!matchesQuery) return false;

    const category = getCardCategory(test);
    if (activeFilter === 'unstarted') return category === 'unstarted';
    if (activeFilter === 'draft') return category === 'draft';
    if (activeFilter === 'completed') return category === 'completed';
    return true;
  });

  return (
    <div className="space-y-3.5 pb-20 font-sans">
      
      {/* MANAGEMENT TECHNICIAN FILTER DROPDOWN (JIKA LOGIN CONTROL/ADMIN/MANAGER) */}
      {isManagement && (
        <div className="p-3 bg-white border border-slate-200 rounded-2xl shadow-2xs space-y-1.5">
          <div className="flex items-center justify-between text-xs font-bold text-slate-800">
            <span className="flex items-center gap-1.5 text-teal-800 font-extrabold">
              <UserCheck className="w-4 h-4 text-teal-600" />
              <span>Filter Tugas Penguji (Tested By)</span>
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

      {/* SEARCH BAR */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Cari sampel, no PO, pengujian, atau penguji..."
          className="w-full bg-white border border-slate-200 rounded-2xl pl-9 pr-4 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600 shadow-2xs font-medium"
        />
      </div>

      {/* FILTER TABS */}
      <div className="flex bg-slate-100 p-1 rounded-2xl gap-1">
        <button
          onClick={() => handleFilterClick('all')}
          className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-extrabold transition cursor-pointer text-center ${
            activeFilter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Semua ({allTaskCards.length})
        </button>
        <button
          onClick={() => handleFilterClick('unstarted')}
          className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-extrabold transition cursor-pointer text-center ${
            activeFilter === 'unstarted' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Belum ({unstartedCount})
        </button>
        <button
          onClick={() => handleFilterClick('draft')}
          className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-extrabold transition cursor-pointer text-center ${
            activeFilter === 'draft' ? 'bg-amber-600 text-white shadow-xs' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Proses ({draftCount})
        </button>
        <button
          onClick={() => handleFilterClick('completed')}
          className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-extrabold transition cursor-pointer text-center ${
            activeFilter === 'completed' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Selesai ({completedCount})
        </button>
      </div>

      {/* TASK CARDS LIST */}
      {filteredCards.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-3xl p-8 text-center space-y-3 my-4">
          <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center mx-auto shadow-xs">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-slate-900">Belum Ada Tugas Ditugaskan</h3>
            <p className="text-xs text-slate-500 font-medium mt-1 max-w-xs mx-auto">
              {isManagement
                ? 'Tidak ada tugas yang di-assign untuk filter teknisi ini. Silakan tentukan "Tested By" di Web App.'
                : `Halo ${currentUser.shortName}, belum ada form pengujian yang ditugaskan kepada Anda (Tested By).`}
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredCards.map(({ id, sample, po, test, testCode, testName, assignedTechnicianName }) => {
            const badgeProps = getTestBadgeProps(testCode);
            const statusObj = getTestStatus3State(test);

            return (
              <div
                key={id}
                onClick={() => onOpenWorksheet(sample, po, testCode)}
                className="bg-white border border-slate-200 hover:border-teal-500 rounded-3xl p-4 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer active:scale-98 space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-10 h-10 rounded-2xl ${badgeProps.bg} text-white flex items-center justify-center font-black text-xs shrink-0 shadow-xs`}>
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
                        <span className="text-[10.5px] text-slate-500 font-medium truncate max-w-[140px]">{po.clientName}</span>
                      </div>
                    </div>
                  </div>

                  {(() => {
                    const btn = getMobileTestButtonState(test);
                    return (
                      <button className={`px-3 py-1.5 rounded-xl ${btn.bgClass} text-xs font-extrabold flex items-center gap-1 shrink-0 shadow-xs transition active:scale-95`}>
                        {btn.statusType === 'completed' && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                        {btn.statusType === 'draft' && <Play className="w-3 h-3 fill-current" />}
                        {btn.statusType === 'unstarted' && <Plus className="w-3.5 h-3.5" />}
                        <span>{btn.label}</span>
                      </button>
                    );
                  })()}
                </div>

                <div className="bg-slate-50/80 p-2.5 rounded-2xl border border-slate-100 flex items-center justify-between gap-2 text-xs">
                  <span className="font-bold text-slate-700 truncate">{badgeProps.label}</span>
                  {sample.depth && (
                    <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-900 font-mono font-bold text-[10px] shrink-0 border border-blue-200">
                      Kedalaman: {sample.depth}
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between text-[10.5px] text-slate-500 font-medium pt-1 border-t border-slate-100">
                  <div className="flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-teal-600" />
                    <span>Penguji (Tested By): <strong className="text-slate-800 font-mono">{assignedTechnicianName}</strong></span>
                  </div>

                  <span className="text-blue-600 font-bold flex items-center gap-1">
                    <span>Buka Form</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
