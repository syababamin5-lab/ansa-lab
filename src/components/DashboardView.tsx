import React, { useState, useEffect } from 'react';
import { PurchaseOrder, Sample, SampleTest, TestStatus, MatrixTestInfo, SOIL_COLOUR_CATALOGUE } from '../types';
import { formatDate, getPOProgress, getPODeadlineStatus, isTestRealtimeComplete, normalizeTestCode, getTestStatus3State } from '../utils/helpers';
import { ConfirmTestCompletionModal } from './ConfirmTestCompletionModal';
import { TestCompletionInfoModal } from './TestCompletionInfoModal';
import { EditSampleTestsModal } from './EditSampleTestsModal';
import { 
  FolderKanban, 
  AlertTriangle, 
  Clock, 
  CheckCircle2, 
  FlaskConical, 
  ChevronRight,
  ChevronDown,
  TrendingUp,
  Building,
  Check,
  ListTodo,
  Filter,
  BookOpen,
  Edit3,
  CheckSquare,
  Eye,
  EyeOff,
  ChevronsDown,
  ChevronsUp,
  FileText
} from 'lucide-react';

interface DashboardViewProps {
  pos: PurchaseOrder[];
  searchTerm: string;
  testCatalogue: MatrixTestInfo[];
  onOpenCalcModal: (test: SampleTest, sample: Sample, po: PurchaseOrder) => void;
  onSelectPO: (po: PurchaseOrder) => void;
  onUpdateTestStatus?: (poId: string, sampleId: string, testId: string, newStatus: TestStatus, customEndTime?: string) => void;
  onUpdateSampleAssignedTests?: (poId: string, sampleId: string, selectedTestCodes: string[]) => void;
  onOpenLHUModal?: (sample: Sample, po: PurchaseOrder) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  pos,
  searchTerm,
  testCatalogue,
  onOpenCalcModal,
  onSelectPO,
  onUpdateTestStatus,
  onUpdateSampleAssignedTests,
  onOpenLHUModal
}) => {
  const [selectedPOFilter, setSelectedPOFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'UNCOMPLETED' | 'COMPLETED'>('ALL');
  const [hideEmptyColumns, setHideEmptyColumns] = useState<boolean>(true);

  const EXPANDED_POS_STORAGE_KEY = 'ansa_lab_expanded_po_ids';

  // Track expanded PO IDs for 2-Level Accordion (default: restore last opened/closed state from localStorage)
  const [expandedPOIds, setExpandedPOIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(EXPANDED_POS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.warn('Failed to load saved PO accordion states', e);
    }
    return pos.map(p => p.id);
  });

  // Save expanded PO states to localStorage whenever changed
  useEffect(() => {
    try {
      localStorage.setItem(EXPANDED_POS_STORAGE_KEY, JSON.stringify(expandedPOIds));
    } catch (e) {
      console.warn('Failed to save PO accordion states', e);
    }
  }, [expandedPOIds]);

  const toggleExpandPO = (poId: string) => {
    setExpandedPOIds(prev => 
      prev.includes(poId) ? prev.filter(id => id !== poId) : [...prev, poId]
    );
  };

  const expandAllPOs = () => setExpandedPOIds(pos.map(p => p.id));
  const collapseAllPOs = () => setExpandedPOIds([]);

  // Modal for confirming completion (when clicking uncompleted test)
  const [pendingCompletion, setPendingCompletion] = useState<{
    poId: string;
    sampleId: string;
    testId: string;
    test: SampleTest;
    sample: Sample;
    po: PurchaseOrder;
  } | null>(null);

  // Pop-Up Modal for viewing completion date info (when clicking completed check ✓)
  const [activeCompletionInfo, setActiveCompletionInfo] = useState<{
    test: SampleTest;
    sample: Sample;
    po: PurchaseOrder;
  } | null>(null);

  // Modal for editing assigned tests on a sample
  const [editSampleTestsTarget, setEditSampleTestsTarget] = useState<{
    sample: Sample;
    po: PurchaseOrder;
  } | null>(null);

  // Matrix Test Columns configuration from MATRIX_TEST_CATALOGUE
  const MATRIX_COLUMNS = testCatalogue;

  // Floating tooltip state (fixed position to avoid overflow-x-auto clipping)
  const [hoveredCol, setHoveredCol] = useState<{ col: MatrixTestInfo; x: number; y: number; top: number } | null>(null);

  const safePos = pos || [];

  // Compute Overall Stats
  const runningPOs = safePos.filter(p => p.status === 'Running');
  const urgentPOs = safePos.filter(p => {
    const deadlineInfo = getPODeadlineStatus(p.deadline);
    return p.status === 'Running' && (deadlineInfo.badgeColor === 'red' || deadlineInfo.badgeColor === 'yellow');
  });

  let totalActiveSamples = 0;
  let totalCompletedTests = 0;
  let totalTotalTests = 0;

  safePos.forEach(po => {
    if (po && po.samples) {
      po.samples.forEach(s => {
        totalActiveSamples++;
        if (s && s.tests) {
          s.tests.forEach(t => {
            if (t.status !== 'Dibatalkan') {
              totalTotalTests++;
              if (isTestRealtimeComplete(t)) totalCompletedTests++;
            }
          });
        }
      });
    }
  });

  const overallProgressPct = totalTotalTests === 0 ? 0 : Math.round((totalCompletedTests / totalTotalTests) * 100);

  // Filter POs
  const filteredPOs = safePos.filter(po => {
    if (!po) return false;
    if (selectedPOFilter !== 'ALL' && po.id !== selectedPOFilter) return false;

    // Apply status filter based on PO progress
    const progress = getPOProgress(po, testCatalogue);
    const isFullyDone = progress.total > 0 && progress.percentage === 100;
    
    if (statusFilter === 'UNCOMPLETED' && (isFullyDone || po.status === 'Completed')) return false;
    if (statusFilter === 'COMPLETED' && (!isFullyDone && po.status !== 'Completed')) return false;

    if (!searchTerm) return true;

    const matchesPO = 
      (po.poNumber && po.poNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (po.clientName && po.clientName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (po.projectName && po.projectName.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesAnySample = po.samples && po.samples.some(s => 
      (s.sampleCode && s.sampleCode.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (s.idLab && s.idLab.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (s.soilType && s.soilType.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return matchesPO || matchesAnySample;
  });

  return (
    <div className="w-full max-w-full px-4 sm:px-6 py-4 space-y-4 text-slate-800">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
            ANSA LIMS — Dashboard Monitoring Administrasi Lab Mekanika Tanah
            <span className="px-2.5 py-0.5 text-xs font-extrabold rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
              TIMES® Engine
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Sistem Informasi Pengolahan Data Lab Mekanika Tanah PT. Terraforma Geoteknik Indonesia.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-200 text-xs">
            <span className="text-slate-500">Total Progress Seluruh Lab: </span>
            <span className="font-bold text-teal-700">{overallProgressPct}% Selesai</span>
          </div>
        </div>
      </div>

      {/* Critical PO Deadline Alerts Banner */}
      {urgentPOs.length > 0 && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-3 text-amber-900">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs space-y-1">
            <div className="font-bold text-amber-800">Peringatan Deadline PO!</div>
            <div className="text-amber-900 font-medium">
              Terdapat {urgentPOs.length} Purchase Order yang mendekati target deadline PO (&lt; 48 Jam / Overdue).
            </div>
          </div>
        </div>
      )}

      {/* Stat Cards Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow transition-all duration-150">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-semibold">PO Berjalan (Running)</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200">
              <FolderKanban className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">{runningPOs.length} <span className="text-xs font-normal text-slate-500">/ {pos.length} PO</span></div>
          <div className="text-[11px] text-teal-700 mt-1 font-bold flex items-center gap-1">
            <TrendingUp className="w-3 h-3" /> Operasional Aktif
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow transition-all duration-150">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-semibold">Peringatan Deadline PO</span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-700 border border-amber-200">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-amber-700 mt-2">{urgentPOs.length} <span className="text-xs font-normal text-slate-500">PO Critical</span></div>
          <div className="text-[11px] text-slate-500 mt-1 font-medium">Sisa waktu PO &lt; 48 jam</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow transition-all duration-150">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-semibold">Total Sampel Terdaftar</span>
            <div className="p-2 rounded-xl bg-cyan-50 text-cyan-700 border border-cyan-200">
              <FlaskConical className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">{totalActiveSamples} <span className="text-xs font-normal text-slate-500">Sampel UDS/DS</span></div>
          <div className="text-[11px] text-cyan-700 mt-1 font-bold">Ter-assign Pengujian</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow transition-all duration-150">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-semibold">Total Pengujian Selesai</span>
            <div className="p-2 rounded-xl bg-teal-50 text-teal-700 border border-teal-200">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-teal-700 mt-2">{totalCompletedTests} <span className="text-xs font-normal text-slate-500">/ {totalTotalTests} Uji</span></div>
          <div className="text-[11px] text-slate-500 mt-1 font-medium">{overallProgressPct}% Total Selesai</div>
        </div>
      </div>

      {/* FILTER & CONTROL BAR — compact single row */}
      <div className="bg-white rounded-xl px-4 py-2.5 border border-slate-200 shadow-sm flex items-center justify-between gap-3 flex-wrap">
        {/* Left: Title */}
        <div className="flex items-center gap-2 shrink-0">
          <ListTodo className="w-4 h-4 text-teal-600" />
          <span className="text-sm font-bold text-slate-800">Job List Matrix</span>
          <span className="text-xs text-slate-400 font-medium hidden sm:inline">per PO</span>
        </div>

        {/* Right: Controls */}
        <div className="flex items-center gap-2 flex-wrap text-xs font-semibold">

          {/* Kolom kosong toggle */}
          <button
            onClick={() => setHideEmptyColumns(prev => !prev)}
            className={`p-1.5 rounded-lg border transition ${
              hideEmptyColumns
                ? 'bg-teal-600 text-white border-teal-600 shadow-sm'
                : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
            }`}
            title="Tampilkan / sembunyikan kolom uji kosong"
          >
            {hideEmptyColumns ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>

          {/* Expand / Collapse */}
          <div className="flex items-center bg-slate-100 rounded-lg border border-slate-200 overflow-hidden">
            <button
              onClick={expandAllPOs}
              className="p-1.5 text-slate-600 hover:bg-white hover:text-slate-900 transition"
              title="Buka semua"
            >
              <ChevronsDown className="w-4 h-4" />
            </button>
            <div className="w-px h-4 bg-slate-300" />
            <button
              onClick={collapseAllPOs}
              className="p-1.5 text-slate-600 hover:bg-white hover:text-slate-900 transition"
              title="Tutup semua"
            >
              <ChevronsUp className="w-4 h-4" />
            </button>
          </div>

          {/* Filter PO */}
          <div className="flex items-center gap-1 bg-slate-100 border border-slate-200 rounded-lg px-2.5 py-1.5">
            <Filter className="w-3 h-3 text-slate-400 shrink-0" />
            <select
              value={selectedPOFilter}
              onChange={(e) => setSelectedPOFilter(e.target.value)}
              className="bg-transparent text-slate-800 font-bold focus:outline-none cursor-pointer text-xs"
            >
              <option value="ALL">Semua PO ({pos.length})</option>
              {pos.map(p => (
                <option key={p.id} value={p.id}>{p.poNumber}</option>
              ))}
            </select>
          </div>

          {/* Status filter */}
          <div className="flex items-center bg-slate-100 rounded-lg border border-slate-200 overflow-hidden">
            {[
              { value: 'ALL', icon: ListTodo, title: 'Semua Status', activeClass: 'bg-white text-slate-900' },
              { value: 'UNCOMPLETED', icon: Clock, title: 'Aktif / Belum Selesai', activeClass: 'bg-white text-amber-600' },
              { value: 'COMPLETED', icon: CheckCircle2, title: 'Selesai', activeClass: 'bg-white text-emerald-600' },
            ].map((opt, i) => {
              const Icon = opt.icon;
              return (
                <button
                  key={opt.value}
                  onClick={() => setStatusFilter(opt.value as any)}
                  className={`p-1.5 transition ${
                    statusFilter === opt.value ? opt.activeClass + ' shadow-sm' : 'text-slate-400 hover:text-slate-700 hover:bg-slate-50'
                  } ${i > 0 ? 'border-l border-slate-200' : ''}`}
                  title={opt.title}
                >
                  <Icon className="w-4 h-4" />
                </button>
              );
            })}
          </div>

        </div>
      </div>

      {/* DISTINCT PO CARDS CONTAINER */}
      <div className="space-y-4">
        {filteredPOs.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-400 italic font-medium">
            Tidak ada Purchase Order (PO) yang sesuai dengan filter pencarian.
          </div>
        ) : (
          filteredPOs.map((po) => {
            const poProgress = getPOProgress(po, testCatalogue);
            const deadlineStatus = getPODeadlineStatus(po.deadline);
            const isExpanded = expandedPOIds.includes(po.id);

            // Filter samples for this PO
            const poSamples = po.samples.filter(sample => {

              if (!searchTerm) return true;

              const matchesPO = 
                po.poNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                po.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                po.projectName.toLowerCase().includes(searchTerm.toLowerCase());

              const matchesSample = 
                sample.sampleCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
                sample.idLab.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (sample.soilType && sample.soilType.toLowerCase().includes(searchTerm.toLowerCase()));

              return matchesPO || matchesSample;
            });

            // Calculate active columns specifically for THIS PO
            const poColumnTotals: { [code: string]: number } = {};
            const poColumnCompleted: { [code: string]: number } = {};
            MATRIX_COLUMNS.forEach(col => {
              let count = 0;
              let completed = 0;
              (po.samples || []).forEach(s => {
                const test = (s.tests || []).find(t => {
                  const code = normalizeTestCode(t?.testTypeCode || t?.testTypeId || '');
                  const colCode = normalizeTestCode(col.code || '');
                  return code === colCode;
                });
                if (test) {
                  count++;
                  if (isTestRealtimeComplete(test)) completed++;
                }
              });
              poColumnTotals[col.code] = count;
              poColumnCompleted[col.code] = completed;
            });

            const poActiveColumns = hideEmptyColumns
              ? MATRIX_COLUMNS.filter(col => (poColumnTotals[col.code] || 0) > 0)
              : MATRIX_COLUMNS;

            const poDisplayedColumns = poActiveColumns.length > 0 ? poActiveColumns : MATRIX_COLUMNS;

            return (
              <div 
                key={po.id} 
                className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden transition-all duration-200"
              >
                {/* PO ACCORDION HEADER BAR — Clean 2-row layout */}
                <div
                  onClick={() => toggleExpandPO(po.id)}
                  className="px-4 py-3 bg-white hover:bg-slate-50/80 cursor-pointer border-b border-slate-200 select-none transition-colors duration-150"
                >
                  {/* ROW 1: PO Number + Status + Progress + Button */}
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      {/* Expand chevron */}
                      <div className="text-slate-400 shrink-0">
                        {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                      </div>

                      {/* PO Number */}
                      <span className="font-mono text-sm font-extrabold text-slate-900 shrink-0">{po.poNumber}</span>

                      {/* Status badge */}
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold flex items-center gap-1 border shrink-0 ${
                        po.status === 'Completed' || poProgress.percentage === 100
                          ? 'bg-emerald-500 text-white border-emerald-600 shadow-sm'
                          : po.status === 'Draft'
                          ? 'bg-slate-200 text-slate-700 border-slate-300'
                          : 'bg-sky-100 text-sky-800 border-sky-300'
                      }`}>
                        {po.status === 'Completed' || poProgress.percentage === 100
                          ? <><Check className="w-3 h-3 stroke-[3]" /> Selesai</>
                          : po.status
                        }
                      </span>

                      {/* Sample count */}
                      <span className="text-[10px] text-slate-500 font-semibold shrink-0 flex items-center gap-1">
                        <FlaskConical className="w-3 h-3 text-teal-600" />
                        {po.samples.length} Sampel
                      </span>

                      {/* Divider */}
                      <span className="text-slate-300 text-xs shrink-0">|</span>

                      {/* Client + Project — truncated if too long */}
                      <span className="text-xs text-slate-500 truncate min-w-0">
                        <strong className="text-slate-800 font-semibold">{po.clientName}</strong>
                        <span className="mx-1.5 text-slate-300">·</span>
                        <span className="text-slate-600">{po.projectName}</span>
                      </span>
                    </div>

                    {/* Right side: Progress + Deadline + Button */}
                    <div className="flex items-center gap-3 shrink-0">
                      {/* Deadline pill */}
                      <span className={`hidden sm:flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        deadlineStatus.badgeColor === 'red'
                          ? 'bg-red-50 text-red-700 border-red-200'
                          : deadlineStatus.badgeColor === 'yellow'
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      }`}>
                        <Clock className="w-3 h-3" />
                        {deadlineStatus.text}
                      </span>

                      {/* Progress bar */}
                      <div className="hidden md:flex items-center gap-2">
                        <div className="w-20 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${poProgress.percentage === 100 ? 'bg-emerald-500' : 'bg-teal-500'}`}
                            style={{ width: `${poProgress.percentage}%` }}
                          />
                        </div>
                        <span className="text-[10px] font-bold text-slate-600 whitespace-nowrap">
                          {poProgress.percentage}%
                        </span>
                      </div>

                      {/* Kelola PO button */}
                      <button
                        onClick={(e) => { e.stopPropagation(); onSelectPO(po); }}
                        className="px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-[11px] font-bold flex items-center gap-1 transition shadow-sm"
                      >
                        Kelola PO
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  {/* ROW 2: Resume badges — compact, dimmer */}
                  {poActiveColumns.length > 0 && (
                    <div className="flex items-center gap-1.5 flex-wrap mt-2 ml-6 pl-0.5">
                      <span className="text-[10px] text-slate-400 font-semibold shrink-0 mr-0.5">Uji:</span>
                      {poActiveColumns.map(col => {
                        const count = poColumnTotals[col.code] || 0;
                        const completed = poColumnCompleted[col.code] || 0;
                        const isDone = count > 0 && completed === count;
                        
                        return (
                          <span
                            key={col.code}
                            className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded border font-mono text-[10px] font-bold transition ${
                              isDone 
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 hover:border-emerald-300' 
                                : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100 hover:border-amber-300'
                            }`}
                            title={`${col.fullNameIndo}: ${completed} Selesai dari ${count} Sampel`}
                          >
                            {col.label}
                            <span className={`px-1 rounded text-[9px] font-bold ${
                              isDone ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-white'
                            }`}>
                              {completed}/{count}
                            </span>
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* EXPANDED PO MATRIX TABLE (DEDICATED PER-PO TABLE & HEADER) */}
                {isExpanded && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-center text-xs text-slate-800 border-collapse">
                      <thead className="bg-slate-100 text-slate-600 font-bold text-[10px] uppercase tracking-wider border-b border-slate-200">
                        
                        {/* BANNER HEADER SPECIFIC FOR THIS PO */}
                        <tr className="border-b border-slate-300 bg-slate-200/90 font-extrabold text-[11px] tracking-wider text-slate-800">
                          <th colSpan={5} className="py-2 px-3 text-left border-r border-slate-300 bg-slate-100 text-slate-700 font-sans">
                            INFORMASI SAMPEL — {po.poNumber} ({poSamples.length} Sampel)
                          </th>
                          <th colSpan={poDisplayedColumns.length + 1} className="py-2 px-3 text-center border-r border-slate-300 bg-teal-800 text-white font-sans tracking-widest shadow-inner">
                            JENIS PENGUJIAN LABORATORIUM ({poDisplayedColumns.length} KOLOM TAMPIL) + LHU
                          </th>
                        </tr>

                        {/* COLUMN HEADERS DIRECTLY UNDER PO HEADER */}
                        <tr>
                          <th className="py-2.5 px-2 text-center border-r border-slate-200 w-10">No</th>
                          <th className="py-2.5 px-3 text-left border-r border-slate-200 min-w-[130px]">Kode Sampel / ID</th>
                          <th className="py-2.5 px-2 text-center border-r border-slate-200 min-w-[100px]">Kedalaman / Qty</th>
                          <th className="py-2.5 px-3 text-left border-r border-slate-200 min-w-[110px]">Material</th>
                          <th className="py-2.5 px-2 text-center border-r border-slate-200 w-24">Progress</th>

                          {/* Test Columns Active for THIS PO - fixed tooltip on hover */}
                          {poDisplayedColumns.map(col => (
                            <th
                              key={col.code}
                              className="py-2.5 px-1.5 text-center border-r border-slate-200 min-w-[48px] relative select-none"
                              onMouseEnter={(e) => {
                                const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                                setHoveredCol({ col, x: rect.left + rect.width / 2, y: rect.bottom + 6, top: rect.top - 6 });
                              }}
                              onMouseLeave={() => setHoveredCol(null)}
                            >
                              <span className="block font-extrabold text-slate-800 cursor-help hover:text-teal-700 transition">
                                {col.label}
                              </span>
                            </th>
                          ))}
                          <th className="py-2.5 px-3 text-center border-r border-slate-200 min-w-[115px] bg-teal-900 text-white font-extrabold font-sans">
                            <div className="flex items-center justify-center gap-1.5">
                              <FileText className="w-4 h-4 text-teal-300" />
                              <span>LHU / LAPORAN</span>
                            </div>
                          </th>
                        </tr>
                      </thead>

                      <tbody className="divide-y divide-slate-200 font-mono text-[11px]">
                        {poSamples.length === 0 ? (
                          <tr>
                            <td colSpan={4 + poDisplayedColumns.length} className="py-6 text-center text-slate-400 italic font-sans font-medium">
                              Belum ada sampel terdaftar pada PO ini.
                            </td>
                          </tr>
                        ) : (
                          poSamples.map((sample, sIdx) => {
                            const colourObj = SOIL_COLOUR_CATALOGUE.find(c => c.code === sample.colourCode) || SOIL_COLOUR_CATALOGUE[0];
                            const assignedColsForSample = poDisplayedColumns.filter(col =>
                              (sample.tests || []).some(t => normalizeTestCode(t?.testTypeCode || t?.testTypeId || '') === normalizeTestCode(col.code || ''))
                            );
                            const sampleTotal = assignedColsForSample.length > 0 ? assignedColsForSample.length : poDisplayedColumns.length;
                            const sampleCompleted = assignedColsForSample.filter(col => {
                              const testObj = (sample.tests || []).find(t => normalizeTestCode(t?.testTypeCode || t?.testTypeId || '') === normalizeTestCode(col.code || ''));
                              return isTestRealtimeComplete(testObj);
                            }).length;
                            const isSampleFullyDone = sampleTotal > 0 && sampleCompleted === sampleTotal;

                            return (
                              <tr 
                                key={sample.id}
                                className={`hover:bg-slate-50 transition-colors duration-150 ${
                                  isSampleFullyDone ? 'bg-emerald-50/30' : 'bg-white'
                                }`}
                              >
                                <td className="py-2.5 px-2 text-center text-slate-400 font-mono text-[11px] border-r border-slate-200">
                                  {sIdx + 1}
                                </td>

                                {/* Sample Code & ID Lab */}
                                <td className="py-2.5 px-3 text-left border-r border-slate-200 font-sans">
                                  <div className="font-bold text-slate-900 flex items-center justify-between gap-1">
                                    <span>{sample.sampleCode}</span>
                                    <button
                                      onClick={() => setEditSampleTestsTarget({ sample, po })}
                                      className="p-1 rounded text-slate-400 hover:text-teal-700 hover:bg-slate-100 transition"
                                      title="Edit / Koreksi Penugasan Jenis Uji Sampel Ini"
                                    >
                                      <Edit3 className="w-3 h-3" />
                                    </button>
                                  </div>
                                  <div className="text-[10px] text-teal-700 font-mono font-bold">{sample.idLab}</div>
                                </td>

                                {/* Depth / Qty */}
                                <td className="py-2.5 px-2 text-center border-r border-slate-200 font-sans">
                                  {sample.sampleType.includes('Bulk') ? (
                                    <span className="font-bold text-slate-700">{sample.depthStart ? `${sample.depthStart} kg` : '-'}</span>
                                  ) : (
                                    <span className="font-bold text-slate-700">
                                      {Number(sample.depthStart).toFixed(2)} - {Number(sample.depthEnd).toFixed(2)} <span className="text-[10px] text-slate-500 font-normal">m</span>
                                    </span>
                                  )}
                                </td>

                                {/* Soil Type & USCS */}
                                <td className="py-2.5 px-3 text-left border-r border-slate-200 font-sans">
                                  <div className="font-semibold text-amber-800 text-[11px] truncate max-w-[110px]" title={sample.soilType}>
                                    {sample.soilType || '-'}
                                  </div>
                                  <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-medium mt-0.5">
                                    <span className="w-2 h-2 rounded-full border border-slate-300 shrink-0" style={{ backgroundColor: colourObj.hex }} />
                                    <span>{sample.lithology}</span>
                                  </div>
                                </td>

                                {/* Sample Progress Badge */}
                                <td className="py-2.5 px-2 text-center border-r border-slate-200 font-mono">
                                  <button
                                    onClick={() => setEditSampleTestsTarget({ sample, po })}
                                    className={`px-2 py-0.5 rounded-full text-[11px] font-bold border hover:scale-105 transition cursor-pointer ${
                                      isSampleFullyDone 
                                        ? 'bg-emerald-100 text-emerald-800 border-emerald-300' 
                                        : 'bg-amber-50 text-amber-800 border-amber-300'
                                    }`}
                                    title="Klik untuk edit/koreksi penugasan jenis uji"
                                  >
                                    {sampleCompleted}/{sampleTotal}
                                  </button>
                                </td>

                                {/* MATRIX CELLS matching THIS PO's columns */}
                                {poDisplayedColumns.map(col => {
                                  const testObj = (sample.tests || []).find(t => {
                                    const code = normalizeTestCode(t?.testTypeCode || t?.testTypeId || '');
                                    const colCode = normalizeTestCode(col.code || '');
                                    return code === colCode;
                                  });
                                  
                                  if (!testObj) {
                                    return (
                                      <td 
                                        key={col.code} 
                                        onClick={() => setEditSampleTestsTarget({ sample, po })}
                                        className="py-2.5 px-1.5 text-slate-300 border-r border-slate-200 select-none hover:bg-teal-50/50 hover:text-teal-600 cursor-pointer transition"
                                        title={`Klik untuk menugaskan uji ${col.fullNameIndo} pada sampel ini`}
                                      >
                                        —
                                      </td>
                                    );
                                  }

                                  const st = getTestStatus3State(testObj);

                                  if (st.state === 'completed') {
                                    return (
                                      <td key={col.code} className="py-2 px-1 text-center border-r border-slate-200">
                                        <button
                                          onClick={() => setActiveCompletionInfo({
                                            test: testObj,
                                            sample: sample,
                                            po: po
                                          })}
                                          className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-emerald-100 text-emerald-700 border border-emerald-300 hover:bg-emerald-200 hover:scale-105 transition-all shadow-2xs cursor-pointer active:scale-95" 
                                          title={`Selesai (${col.fullNameIndo})`}
                                        >
                                          <Check className="w-4 h-4 stroke-[3]" />
                                        </button>
                                      </td>
                                    );
                                  }

                                  if (st.state === 'draft') {
                                    return (
                                      <td key={col.code} className="py-2 px-1 text-center border-r border-slate-200">
                                        <button
                                          onClick={() => setPendingCompletion({
                                            poId: po.id,
                                            sampleId: sample.id,
                                            testId: testObj.id,
                                            test: testObj,
                                            sample: sample,
                                            po: po
                                          })}
                                          className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-amber-100 text-amber-800 border border-amber-300 hover:bg-amber-200 transition-all shadow-2xs cursor-pointer active:scale-95"
                                          title={`Dalam Proses (${col.fullNameIndo})`}
                                        >
                                          <Clock className="w-3.5 h-3.5" />
                                        </button>
                                      </td>
                                    );
                                  }

                                  // unstarted (Belum Diinput - Jam Abu-abu)
                                  return (
                                    <td key={col.code} className="py-2 px-1 text-center border-r border-slate-200">
                                      <button
                                        onClick={() => setPendingCompletion({
                                          poId: po.id,
                                          sampleId: sample.id,
                                          testId: testObj.id,
                                          test: testObj,
                                          sample: sample,
                                          po: po
                                        })}
                                        className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-slate-100 text-slate-400 border border-slate-200 hover:bg-slate-200 transition-all cursor-pointer"
                                        title={`Belum Diinput (${col.fullNameIndo})`}
                                      >
                                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                                      </button>
                                    </td>
                                  );
                                })}

                                {/* FAR-RIGHT COLUMN: REVIEW LHU BUTTON PER SAMPLE */}
                                <td className="py-2 px-2 text-center border-r border-slate-200 font-sans">
                                  <button
                                    onClick={() => onOpenLHUModal && onOpenLHUModal(sample, po)}
                                    className="px-2.5 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-[10px] flex items-center justify-center gap-1.5 shadow-md shadow-teal-600/20 transition cursor-pointer"
                                    title={`Lihat / Pratinjau Laporan Hasil Uji (LHU) Resmi A4 untuk ${sample.sampleCode}`}
                                  >
                                    <FileText className="w-3.5 h-3.5" />
                                    <span>Review LHU</span>
                                  </button>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>

                      {/* SUMMARY FOOTER FOR THIS PO */}
                      <tfoot className="bg-slate-100/80 font-sans text-xs border-t border-slate-200">
                        <tr>
                          <td colSpan={5} className="py-2.5 px-4 text-right font-bold text-slate-600 border-r border-slate-200">
                            Total Uji Ditugaskan Pada PO {po.poNumber}:
                          </td>

                          {poDisplayedColumns.map(col => {
                            const count = poColumnTotals[col.code] || 0;
                            return (
                              <td key={col.code} className="py-2.5 px-1 text-center border-r border-slate-200 font-mono">
                                {count > 0 ? (
                                  <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-indigo-100 text-indigo-800 font-bold text-[10px] border border-indigo-200">
                                    {count}
                                  </span>
                                ) : (
                                  <span className="text-slate-300">—</span>
                                )}
                              </td>
                            );
                          })}
                          <td className="py-2.5 px-1 text-center border-r border-slate-200 font-mono text-slate-400">—</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* MODAL 1: EDIT / KOREKSI PENUGASAN JENIS UJI */}
      {editSampleTestsTarget && (
        <EditSampleTestsModal
          sample={editSampleTestsTarget.sample}
          po={editSampleTestsTarget.po}
          testCatalogue={testCatalogue}
          onClose={() => setEditSampleTestsTarget(null)}
          onSaveAssignedTests={(selectedCodes) => {
            if (onUpdateSampleAssignedTests) {
              onUpdateSampleAssignedTests(
                editSampleTestsTarget.po.id,
                editSampleTestsTarget.sample.id,
                selectedCodes
              );
            }
          }}
        />
      )}

      {/* MODAL 2: CONFIRM TEST COMPLETION */}
      {pendingCompletion && (
        <ConfirmTestCompletionModal
          test={pendingCompletion.test}
          sample={pendingCompletion.sample}
          po={pendingCompletion.po}
          onClose={() => setPendingCompletion(null)}
          onConfirm={(completionDateIso) => {
            if (onUpdateTestStatus) {
              onUpdateTestStatus(
                pendingCompletion.poId,
                pendingCompletion.sampleId,
                pendingCompletion.testId,
                'Selesai',
                completionDateIso
              );
            }
            setPendingCompletion(null);
          }}
        />
      )}

      {/* MODAL 3: POP-UP INFO TANGGAL SELESAI UJI */}
      {activeCompletionInfo && (
        <TestCompletionInfoModal
          test={activeCompletionInfo.test}
          sample={activeCompletionInfo.sample}
          po={activeCompletionInfo.po}
          onClose={() => setActiveCompletionInfo(null)}
          onUpdateCompletionDate={(newDateIso) => {
            if (onUpdateTestStatus) {
              onUpdateTestStatus(
                activeCompletionInfo.po.id,
                activeCompletionInfo.sample.id,
                activeCompletionInfo.test.id,
                'Selesai',
                newDateIso
              );
            }
          }}
          onRevertToUncompleted={() => {
            if (onUpdateTestStatus) {
              onUpdateTestStatus(
                activeCompletionInfo.po.id,
                activeCompletionInfo.sample.id,
                activeCompletionInfo.test.id,
                'Belum Diuji'
              );
            }
          }}
          onOpenCalcModal={() => {
            onOpenCalcModal(
              activeCompletionInfo.test,
              activeCompletionInfo.sample,
              activeCompletionInfo.po
            );
          }}
        />
      )}

      {/* FLOATING TOOLTIP - fixed position, never clipped by overflow container */}
      {hoveredCol && (
        <div
          className="fixed z-[9999] pointer-events-none"
          style={{
            left: Math.min(hoveredCol.x, window.innerWidth - 272),
            top: hoveredCol.y + 130 > window.innerHeight ? hoveredCol.top : hoveredCol.y,
            transform: `translate(${hoveredCol.x > window.innerWidth - 272 ? '0' : '-50%'}, ${hoveredCol.y + 130 > window.innerHeight ? '-100%' : '0'})`,
          }}
        >
          <div className="bg-slate-900 text-white rounded-xl p-3 shadow-2xl w-64 text-left border border-slate-700">
            <div className="flex items-center justify-between border-b border-slate-700 pb-2 mb-2">
              <span className="font-mono text-xs font-extrabold text-teal-400">{hoveredCol.col.code}</span>
              <span className="px-2 py-0.5 rounded text-[9px] font-mono bg-emerald-950 text-emerald-300 border border-emerald-700/60 font-bold flex items-center gap-1">
                <BookOpen className="w-3 h-3 text-emerald-400" />
                <span>Standar SNI</span>
              </span>
            </div>
            <div className="text-xs font-bold text-slate-100 leading-snug">
              {hoveredCol.col.fullNameIndo}
            </div>
            <div className="text-[10px] text-slate-400 font-medium italic mt-0.5">
              ({hoveredCol.col.fullNameEn})
            </div>
            <div className="mt-2 pt-2 border-t border-slate-800/80 text-[10px] space-y-1">
              <div>
                <span className="text-slate-400 font-medium">Nomor Standar SNI: </span>
                <span className="font-mono font-bold text-amber-300 text-[11px]">{hoveredCol.col.sniStandard}</span>
              </div>
              <div className="text-[10px] text-teal-300 font-medium leading-tight">
                "{hoveredCol.col.sniTitle}"
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
