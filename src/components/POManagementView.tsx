import React, { useState, useEffect } from 'react';
import { PurchaseOrder, Sample, SampleTest, POStatus, TestStatus, MatrixTestInfo, SOIL_COLOUR_CATALOGUE } from '../types';
import { formatDate, getPOProgress, getSampleUscs, getTestStatus3State, normalizeTestCode } from '../utils/helpers';
import { ExcelImportModal } from './ExcelImportModal';
import { ConfirmTestCompletionModal } from './ConfirmTestCompletionModal';
import { TestCompletionInfoModal } from './TestCompletionInfoModal';
import { EditSampleTestsModal } from './EditSampleTestsModal';
import { ExcelImportResult } from '../utils/excelParser';
import { 
  Plus, 
  Edit3, 
  Trash2, 
  FolderKanban, 
  FlaskConical, 
  X, 
  Save, 
  MapPin,
  Building,
  CheckCircle2,
  Check,
  Clock,
  FileSpreadsheet,
  Printer,
  ArrowRightLeft,
  BookOpen,
  CheckSquare,
  Eye,
  EyeOff,
  Sparkles,
  AlertTriangle,
  FileText,
  Settings,
  UserCheck,
  UserPlus
} from 'lucide-react';

interface POManagementViewProps {
  pos: PurchaseOrder[];
  selectedPOId?: string;
  testCatalogue: MatrixTestInfo[];
  sampleTypeCatalogue: string[];
  onSelectPOId?: (poId: string) => void;
  onAddPO: (newPO: Partial<PurchaseOrder>) => void;
  onUpdatePO: (updatedPO: PurchaseOrder) => void;
  onDeletePO: (poId: string) => void;
  onAddSample: (poId: string, sampleData: Partial<Sample>) => void;
  onUpdateSample: (poId: string, sampleId: string, sampleData: Partial<Sample>) => void;
  onDeleteSample: (poId: string, sampleId: string) => void;
  onAddTestToSample: (poId: string, sampleId: string, testTypeId: string, durationHours: number, technician: string) => void;
  onReplaceTest: (poId: string, sampleId: string, testId: string, newTestTypeId: string, reason: string) => void;
  onMoveSample: (poId: string, sampleId: string, newTechnician: string, newLocationTag: string) => void;
  onImportExcelSamples?: (poId: string, importedSamples: ExcelImportResult['samples']) => void;
  onOpenReportSheet?: (sample: Sample, po: PurchaseOrder) => void;
  onOpenCalcModal?: (test: SampleTest, sample: Sample, po: PurchaseOrder) => void;
  onUpdateTestStatus?: (poId: string, sampleId: string, testId: string, newStatus: TestStatus, customEndTime?: string) => void;
  onUpdateSampleAssignedTests?: (poId: string, sampleId: string, selectedTestCodes: string[]) => void;
  onOpenLHUModal?: (sample: Sample, po: PurchaseOrder) => void;
}

export const POManagementView: React.FC<POManagementViewProps> = ({
  pos,
  selectedPOId,
  testCatalogue,
  sampleTypeCatalogue,
  onSelectPOId,
  onAddPO,
  onUpdatePO,
  onDeletePO,
  onAddSample,
  onUpdateSample,
  onDeleteSample,
  onAddTestToSample,
  onReplaceTest,
  onMoveSample,
  onImportExcelSamples,
  onOpenReportSheet,
  onOpenCalcModal,
  onUpdateTestStatus,
  onUpdateSampleAssignedTests,
  onOpenLHUModal
}) => {
  const [activePOId, setActivePOId] = useState<string>(selectedPOId || (pos && pos[0]?.id) || '');
  const [hideEmptyColumns, setHideEmptyColumns] = useState<boolean>(true);

  // Keep activePOId synced when selectedPOId prop explicitly changes from parent
  useEffect(() => {
    if (selectedPOId && pos.some(p => p.id === selectedPOId)) {
      setActivePOId(selectedPOId);
    } else if (activePOId && !pos.some(p => p.id === activePOId) && pos.length > 0) {
      setActivePOId(pos[0].id);
    } else if (!activePOId && pos.length > 0) {
      setActivePOId(pos[0].id);
    }
  }, [selectedPOId, pos, activePOId]);

  const activePO = pos.find(p => p.id === activePOId) || pos[0] || null;

  // Modals & Context Menu State
  const [isAddPOModalOpen, setIsAddPOModalOpen] = useState(false);
  const [isEditPOModalOpen, setIsEditPOModalOpen] = useState(false);
  const [isAddSampleModalOpen, setIsAddSampleModalOpen] = useState(false);
  const [isEditSampleModalOpen, setIsEditSampleModalOpen] = useState(false);
  const [isMoveSampleModalOpen, setIsMoveSampleModalOpen] = useState(false);
  const [isExcelImportModalOpen, setIsExcelImportModalOpen] = useState(false);

  // State for Confirmation Modal before marking test complete
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

  // Right-Click Context Menu State
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    sample: Sample;
  } | null>(null);

  // Close context menu on outside click or scroll
  useEffect(() => {
    const handleClick = () => setContextMenu(null);
    window.addEventListener('click', handleClick);
    window.addEventListener('scroll', handleClick);
    return () => {
      window.removeEventListener('click', handleClick);
      window.removeEventListener('scroll', handleClick);
    };
  }, []);

  // PO Form state
  const [poForm, setPoForm] = useState({
    poNumber: '',
    clientName: '',
    clientAddress: '',
    projectName: '',
    projectLocation: '',
    status: 'Running' as POStatus,
    deadline: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString().slice(0, 10),
    sampleArrivalDate: new Date().toISOString().slice(0, 10),
    listReceivedDate: new Date().toISOString().slice(0, 10),
    preparationStartDate: new Date().toISOString().slice(0, 10),
    testingStartDate: new Date().toISOString().slice(0, 10),
    checkedBy: '',
    computedBy: 'Ir. Agus Wijaya, MT',
    place: 'Bandung',
    notes: ''
  });

  const [selectedSample, setSelectedSample] = useState<Sample | null>(null);

  // Sample Form state
  const [sampleForm, setSampleForm] = useState({
    sampleCode: '',
    reportNumber: '',
    idLab: '',
    depthStart: '' as number | '',
    depthEnd: '' as number | '',
    lithology: '',
    soilType: '',
    colourCode: 0,
    sampleType: '' as '' | 'Sampel Tidak Terganggu / UDS' | 'Sampel Terganggu / DS' | 'Sampel Curah / DS',
    testedBy: '',
    locationTag: 'Rak Cold-Room A-01',
    sampleDescription: ''
  });

  const [moveForm, setMoveForm] = useState({
    newTechnician: '',
    newLocationTag: ''
  });

  const handleOpenAddPO = () => {
    setPoForm({
      poNumber: `PO-GQT-${Math.floor(10 + Math.random() * 90)}`,
      clientName: '',
      clientAddress: '',
      projectName: '',
      projectLocation: '',
      status: 'Running',
      deadline: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString().slice(0, 10),
      sampleArrivalDate: new Date().toISOString().slice(0, 10),
      listReceivedDate: new Date().toISOString().slice(0, 10),
      preparationStartDate: new Date().toISOString().slice(0, 10),
      testingStartDate: new Date().toISOString().slice(0, 10),
      checkedBy: '',
      computedBy: 'Ir. Agus Wijaya, MT',
      place: 'Bandung',
      notes: ''
    });
    setIsAddPOModalOpen(true);
  };

  const handleOpenEditPO = () => {
    if (!activePO) return;
    setPoForm({
      poNumber: activePO.poNumber,
      clientName: activePO.clientName,
      clientAddress: activePO.clientAddress || '',
      projectName: activePO.projectName,
      projectLocation: activePO.projectLocation || '',
      status: activePO.status,
      deadline: activePO.deadline ? activePO.deadline.slice(0, 10) : new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString().slice(0, 10),
      sampleArrivalDate: activePO.sampleArrivalDate ? activePO.sampleArrivalDate.slice(0, 10) : '',
      listReceivedDate: activePO.listReceivedDate ? activePO.listReceivedDate.slice(0, 10) : '',
      preparationStartDate: activePO.preparationStartDate ? activePO.preparationStartDate.slice(0, 10) : '',
      testingStartDate: activePO.testingStartDate ? activePO.testingStartDate.slice(0, 10) : '',
      checkedBy: activePO.checkedBy || 'AS Sumartadji',
      computedBy: activePO.computedBy || '',
      place: activePO.place || 'Bandung',
      notes: activePO.notes || ''
    });
    setIsEditPOModalOpen(true);
  };

  const handleSaveAddPO = (e: React.FormEvent) => {
    e.preventDefault();
    onAddPO({
      poNumber: poForm.poNumber,
      clientName: poForm.clientName,
      clientAddress: poForm.clientAddress,
      projectName: poForm.projectName,
      projectLocation: poForm.projectLocation,
      status: poForm.status,
      sampleArrivalDate: new Date(poForm.sampleArrivalDate).toISOString(),
      listReceivedDate: new Date(poForm.listReceivedDate).toISOString(),
      preparationStartDate: new Date(poForm.preparationStartDate).toISOString(),
      testingStartDate: new Date(poForm.testingStartDate).toISOString(),
      startDate: new Date(poForm.testingStartDate).toISOString(),
      deadline: poForm.deadline ? new Date(poForm.deadline).toISOString() : new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString(),
      checkedBy: poForm.checkedBy,
      computedBy: poForm.computedBy,
      place: poForm.place,
      notes: poForm.notes,
      samples: []
    });
    setIsAddPOModalOpen(false);
  };

  const handleSaveEditPO = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePO) return;
    onUpdatePO({
      ...activePO,
      poNumber: poForm.poNumber,
      clientName: poForm.clientName,
      clientAddress: poForm.clientAddress,
      projectName: poForm.projectName,
      projectLocation: poForm.projectLocation,
      status: poForm.status,
      sampleArrivalDate: poForm.sampleArrivalDate ? new Date(poForm.sampleArrivalDate).toISOString() : activePO.sampleArrivalDate,
      listReceivedDate: poForm.listReceivedDate ? new Date(poForm.listReceivedDate).toISOString() : activePO.listReceivedDate,
      preparationStartDate: poForm.preparationStartDate ? new Date(poForm.preparationStartDate).toISOString() : activePO.preparationStartDate,
      testingStartDate: poForm.testingStartDate ? new Date(poForm.testingStartDate).toISOString() : activePO.testingStartDate,
      deadline: poForm.deadline ? new Date(poForm.deadline).toISOString() : activePO.deadline,
      checkedBy: poForm.checkedBy,
      computedBy: poForm.computedBy,
      place: poForm.place,
      notes: poForm.notes,
      updatedAt: new Date().toISOString()
    });
    setIsEditPOModalOpen(false);
  };

  const handleSaveAddSample = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePO) return;

    const selectedColour = SOIL_COLOUR_CATALOGUE.find(c => c.code === Number(sampleForm.colourCode)) || SOIL_COLOUR_CATALOGUE[0];

    onAddSample(activePO.id, {
      sampleCode: sampleForm.sampleCode,
      reportNumber: sampleForm.reportNumber || `REP-2026-${sampleForm.idLab}`,
      idLab: sampleForm.idLab,
      depthStart: sampleForm.depthStart === '' ? 0 : sampleForm.depthStart,
      depthEnd: sampleForm.depthEnd === '' ? 0 : sampleForm.depthEnd,
      lithology: sampleForm.lithology,
      soilType: sampleForm.soilType,
      colourCode: selectedColour.code,
      colourName: selectedColour.name,
      sampleType: sampleForm.sampleType,
      testedBy: sampleForm.testedBy,
      assignedTechnician: sampleForm.testedBy,
      locationTag: sampleForm.locationTag,
      sampleDescription: sampleForm.sampleDescription
    });
    setIsAddSampleModalOpen(false);
  };

  const handleOpenEditSample = (sample: Sample) => {
    setSelectedSample(sample);
    setSampleForm({
      sampleCode: sample.sampleCode,
      reportNumber: sample.reportNumber || '',
      idLab: sample.idLab,
      depthStart: sample.depthStart,
      depthEnd: sample.depthEnd,
      lithology: sample.lithology,
      soilType: sample.soilType,
      colourCode: sample.colourCode,
      sampleType: sample.sampleType,
      testedBy: sample.testedBy || '',
      locationTag: sample.locationTag || 'Rak Cold-Room A-01',
      sampleDescription: sample.sampleDescription || ''
    });
    setIsEditSampleModalOpen(true);
  };

  const handleSaveEditSample = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePO || !selectedSample) return;

    const selectedColour = SOIL_COLOUR_CATALOGUE.find(c => c.code === Number(sampleForm.colourCode)) || SOIL_COLOUR_CATALOGUE[0];

    onUpdateSample(activePO.id, selectedSample.id, {
      sampleCode: sampleForm.sampleCode,
      reportNumber: sampleForm.reportNumber,
      idLab: sampleForm.idLab,
      depthStart: sampleForm.depthStart,
      depthEnd: sampleForm.depthEnd,
      lithology: sampleForm.lithology,
      soilType: sampleForm.soilType,
      colourCode: selectedColour.code,
      colourName: selectedColour.name,
      sampleType: sampleForm.sampleType,
      testedBy: sampleForm.testedBy,
      locationTag: sampleForm.locationTag,
      sampleDescription: sampleForm.sampleDescription
    });
    setIsEditSampleModalOpen(false);
  };

  const handleConfirmExcelImport = (importedData: ExcelImportResult) => {
    if (!activePO) return;
    if (onImportExcelSamples) {
      onImportExcelSamples(activePO.id, importedData.samples);
    }
  };

  const handleOpenMoveSample = (sample: Sample) => {
    setSelectedSample(sample);
    setMoveForm({
      newTechnician: sample.testedBy || sample.assignedTechnician || '',
      newLocationTag: sample.locationTag
    });
    setIsMoveSampleModalOpen(true);
  };

  const handleSaveMoveSample = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePO || !selectedSample) return;
    onMoveSample(activePO.id, selectedSample.id, moveForm.newTechnician, moveForm.newLocationTag);
    setIsMoveSampleModalOpen(false);
  };

  // Matrix Test Columns from dynamic testCatalogue
  const MATRIX_COLUMNS = testCatalogue;

  // Floating tooltip state for column headers (to avoid overflow-x-auto clipping)
  const [hoveredCol, setHoveredCol] = useState<{ col: typeof MATRIX_COLUMNS[0]; x: number; y: number; top: number } | null>(null);

  // Calculate Column totals for activePO
  const columnTotals: { [code: string]: number } = {};
  let totalAssignedTestsInPO = 0;

  if (activePO) {
    MATRIX_COLUMNS.forEach(col => {
      let count = 0;
      activePO.samples.forEach(s => {
        const hasTest = s.tests.some(t => {
          const code = normalizeTestCode(t.testTypeCode || t.testTypeId || '');
          const colCode = normalizeTestCode(col.code || '');
          return code === colCode || t.testTypeCode === col.code || t.testTypeId === col.code;
        });
        if (hasTest) count++;
      });
      columnTotals[col.code] = count;
      totalAssignedTestsInPO += count;
    });
  }

  // Auto-hide empty test columns per active PO if hideEmptyColumns is true
  const activeMatrixColumns = (hideEmptyColumns && activePO)
    ? MATRIX_COLUMNS.filter(col => (columnTotals[col.code] || 0) > 0)
    : MATRIX_COLUMNS;

  // Fallback if no tests assigned yet
  const displayedColumns = activeMatrixColumns.length > 0 ? activeMatrixColumns : MATRIX_COLUMNS;

  return (
    <div className="w-full max-w-full px-4 sm:px-6 py-4 space-y-4 relative text-slate-800">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <FolderKanban className="w-5 h-5 text-teal-600 shrink-0" />
            Manajemen Administrasi PO &amp; Detail Sampel Laboratorium
          </h2>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Kolom uji tanpa penugasan disembunyikan otomatis. Sorot kursor untuk lihat <strong className="text-teal-700 font-semibold">Nama Lengkap & Standar SNI</strong>.
          </p>
        </div>

        <button
          onClick={handleOpenAddPO}
          className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-md shadow-teal-600/20 flex items-center gap-2 transition-all duration-150 active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah PO Baru</span>
        </button>
      </div>

      {/* DYNAMIC ANIMATED PO SELECTOR TABS */}
      {pos.length > 0 && (
        <div className="flex items-center gap-2.5 overflow-x-auto pb-2 border-b border-slate-200">
          {pos.map(po => {
            const isActive = activePO && po.id === activePO.id;
            const progress = getPOProgress(po, testCatalogue);
            const is100Pct = progress.percentage === 100;

            return (
              <button
                key={po.id}
                onClick={() => {
                  setActivePOId(po.id);
                  if (onSelectPOId) onSelectPOId(po.id);
                }}
                className={`relative px-4 py-2 rounded-t-xl text-xs font-bold transition-all duration-200 flex flex-col gap-1.5 shrink-0 border-t border-x overflow-hidden group select-none ${
                  isActive
                    ? 'bg-white text-slate-900 border-slate-300 shadow-xs'
                    : 'bg-slate-100/80 text-slate-600 hover:text-slate-900 border-slate-200 hover:bg-white'
                }`}
              >
                {/* Tab Header Row */}
                <div className="flex items-center gap-2.5 z-10">
                  <span className="font-mono text-xs font-extrabold">{po.poNumber}</span>

                  {/* Animated Percentage Badge */}
                  <span className={`px-2 py-0.5 text-[10px] rounded-full font-extrabold flex items-center gap-1 border transition-all duration-300 ${
                    is100Pct 
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-300 shadow-2xs' 
                      : progress.percentage > 0 
                      ? 'bg-teal-50 text-teal-800 border-teal-300 shadow-2xs' 
                      : 'bg-slate-200 text-slate-700 border-slate-300'
                  }`}>
                    {is100Pct ? (
                      <span className="flex items-center gap-0.5 text-emerald-700 font-bold">
                        <Check className="w-3 h-3 stroke-[3]" /> 100%
                      </span>
                    ) : (
                      <span>{progress.percentage}%</span>
                    )}
                  </span>
                </div>

                {/* Animated Bottom Fill Bar representing completion % */}
                <div className="w-full h-1 bg-slate-200/80 rounded-full overflow-hidden z-10 border border-slate-200/50">
                  <div 
                    className={`h-full rounded-full transition-all duration-700 ease-out ${
                      is100Pct 
                        ? 'bg-emerald-500 shadow-xs' 
                        : 'bg-gradient-to-r from-teal-500 via-emerald-400 to-teal-600 animate-pulse'
                    }`}
                    style={{ width: `${progress.percentage}%` }}
                  />
                </div>

                {/* Subtle Background Tint Fill */}
                <div 
                  className="absolute inset-y-0 left-0 bg-teal-50/40 pointer-events-none transition-all duration-700 opacity-60"
                  style={{ width: `${progress.percentage}%` }}
                />
              </button>
            );
          })}
        </div>
      )}

      {/* Fallback if no active PO */}
      {!activePO && (
        <div className="p-12 text-center rounded-2xl bg-white border border-slate-200 space-y-4 shadow-sm">
          <FlaskConical className="w-12 h-12 text-slate-400 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">Belum Ada Purchase Order (PO) Terdaftar</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Klik tombol di bawah ini untuk membuat PO baru dan mendaftarkan sampel pengujian laboratorium.
          </p>
          <button
            onClick={handleOpenAddPO}
            className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow flex items-center gap-2 mx-auto transition"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah PO Pertama</span>
          </button>
        </div>
      )}

      {/* Active PO Content */}
      {activePO && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-sm space-y-3 relative">
            
            {/* ROW 1: PRIMARY IDENTIFIERS, PROJECT NAME, STATUS BADGES & ACTION TOOLS */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              
              {/* Left: Job Number + Project Name + Status */}
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="px-3 py-1 rounded-xl bg-slate-900 text-white font-mono font-black text-xs shadow-xs tracking-wide">
                  Job Number / PO: {activePO.poNumber}
                </span>

                <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
                  <Building className="w-4 h-4 text-teal-600 shrink-0" />
                  <span>{activePO.projectName}</span>
                </h3>

                <span className={`px-2.5 py-0.5 text-[11px] font-extrabold rounded-full border flex items-center gap-1 ${
                  activePO.status === 'Completed' || getPOProgress(activePO, testCatalogue).percentage === 100
                    ? 'bg-emerald-500 text-white border-emerald-600 shadow-2xs'
                    : activePO.status === 'Draft'
                    ? 'bg-slate-200 text-slate-700 border-slate-300'
                    : 'bg-sky-100 text-sky-900 border-sky-300 font-bold'
                }`}>
                  {activePO.status === 'Completed' || getPOProgress(activePO, testCatalogue).percentage === 100 ? (
                    <span className="flex items-center gap-1 text-white font-bold">
                      <Check className="w-3.5 h-3.5 stroke-[3]" /> Selesai
                    </span>
                  ) : (
                    <span>{activePO.status}</span>
                  )}
                </span>

                {activePO.notes && activePO.notes.includes('[Auto-generated dari BA Preparasi') && (
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-indigo-100 text-indigo-800 border border-indigo-200 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-indigo-600" />
                    <span>BA Preparasi</span>
                  </span>
                )}
              </div>

              {/* Right: Decimal Places Switcher & Edit / Delete Buttons */}
              <div className="flex items-center gap-2 shrink-0">
                
                {/* Compact Decimal Switcher Pill */}
                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200/80 text-[11px] font-bold">
                  <span className="text-slate-500 px-1 text-[10.5px]">Presisi:</span>
                  <button
                    onClick={() => onUpdatePO({ ...activePO, decimalPlaces: 2 })}
                    className={`px-2 py-0.5 rounded-lg transition cursor-pointer font-extrabold ${
                      (activePO.decimalPlaces ?? 3) === 2
                        ? 'bg-teal-600 text-white shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                    title="2 Desimal (ex: 2.68)"
                  >
                    2 Des
                  </button>
                  <button
                    onClick={() => onUpdatePO({ ...activePO, decimalPlaces: 3 })}
                    className={`px-2 py-0.5 rounded-lg transition cursor-pointer font-extrabold ${
                      (activePO.decimalPlaces ?? 3) === 3
                        ? 'bg-teal-600 text-white shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                    title="3 Desimal (ex: 2.684) — Standard SNI"
                  >
                    3 Des
                  </button>
                </div>

                {/* Edit PO Button */}
                <button
                  onClick={handleOpenEditPO}
                  className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition cursor-pointer"
                  title="Edit Data PO & Client"
                >
                  <Edit3 className="w-4 h-4" />
                </button>

                {/* Delete PO Button */}
                <button
                  onClick={() => onDeletePO(activePO.id)}
                  className="p-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 transition cursor-pointer"
                  title="Hapus PO"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* ROW 2: 4 SLEEK COMPACT METRIC CARDS WITH HIGH-VISIBILITY WARNING BADGES FOR UNFILLED FIELDS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-2.5 text-xs font-semibold">
              
              {/* KLIEN & ALAMAT */}
              <div className={`p-2.5 rounded-xl transition-all ${
                !activePO.clientAddress ? 'bg-amber-50/90 border border-amber-300/90 shadow-2xs' : 'bg-slate-50/80 border border-slate-200/80'
              } space-y-0.5`}>
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Klien &amp; Alamat</div>
                <div className="font-extrabold text-slate-900 truncate" title={activePO.clientName}>{activePO.clientName}</div>
                <div className="text-[11px] text-slate-600 truncate flex items-center gap-1" title={activePO.clientAddress || 'Alamat belum diisi'}>
                  <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                  {activePO.clientAddress ? (
                    <span className="truncate">{activePO.clientAddress}</span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-md bg-amber-200/90 text-amber-950 font-black text-[10.5px] inline-flex items-center gap-1 border border-amber-400/80 animate-pulse shadow-2xs">
                      <AlertTriangle className="w-3 h-3 text-amber-700 shrink-0" />
                      <span>Alamat Belum Diisi</span>
                    </span>
                  )}
                </div>
              </div>

              {/* LOKASI PROYEK */}
              <div className={`p-2.5 rounded-xl transition-all ${
                !activePO.projectLocation ? 'bg-amber-50/90 border border-amber-300/90 shadow-2xs' : 'bg-slate-50/80 border border-slate-200/80'
              } space-y-0.5`}>
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Lokasi &amp; Kota</div>
                <div>
                  {activePO.projectLocation ? (
                    <span className="font-extrabold text-teal-800 truncate block" title={activePO.projectLocation}>{activePO.projectLocation}</span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-md bg-amber-200/90 text-amber-950 font-black text-[10.5px] inline-flex items-center gap-1 border border-amber-400/80 animate-pulse shadow-2xs">
                      <AlertTriangle className="w-3 h-3 text-amber-700 shrink-0" />
                      <span>Lokasi Belum Diisi</span>
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-slate-600 pt-0.5">Kota/Tempat: <strong className="text-slate-900">{activePO.place}</strong></div>
              </div>

              {/* JADWAL & DEADLINE */}
              <div className={`p-2.5 rounded-xl transition-all ${
                !activePO.deadline ? 'bg-red-50/90 border border-red-300/90 shadow-2xs' : 'bg-slate-50/80 border border-slate-200/80'
              } space-y-0.5`}>
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
                  <span>Deadline LHU</span>
                  {activePO.deadline ? (() => {
                    const daysLeft = Math.ceil((new Date(activePO.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                    return (
                      <span className={`text-[9.5px] font-extrabold px-1.5 py-0.2 rounded ${daysLeft < 0 ? 'bg-red-100 text-red-700' : daysLeft <= 7 ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-800'}`}>
                        {daysLeft < 0 ? `+${Math.abs(daysLeft)}h` : `${daysLeft} hari`}
                      </span>
                    );
                  })() : (
                    <span className="text-[9px] font-black uppercase text-red-700 bg-red-200/90 px-1.5 rounded animate-pulse">Wajib Diisi</span>
                  )}
                </div>
                <div className="font-extrabold text-slate-900 flex items-center gap-1 font-mono text-[11.5px]">
                  <Clock className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                  {activePO.deadline ? (
                    <span>{formatDate(activePO.deadline)}</span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-md bg-red-200/90 text-red-950 font-black text-[10.5px] inline-flex items-center gap-1 border border-red-400/80 animate-pulse shadow-2xs">
                      <AlertTriangle className="w-3 h-3 text-red-700 shrink-0" />
                      <span>Deadline Belum Diisi!</span>
                    </span>
                  )}
                </div>
                <div className="text-[10.5px] text-slate-500 truncate">
                  Awal Uji: <strong className="text-slate-800">{activePO.testingStartDate ? formatDate(activePO.testingStartDate) : '-'}</strong>
                </div>
              </div>

              {/* PENANGGUNG JAWAB / CHECKER */}
              <div className={`p-2.5 rounded-xl transition-all ${
                !activePO.checkedBy || !activePO.computedBy ? 'bg-amber-50/80 border border-amber-300/80' : 'bg-slate-50/80 border border-slate-200/80'
              } space-y-0.5`}>
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Checker &amp; Evaluator</div>
                <div className="text-[11px] text-slate-700 truncate flex items-center justify-between">
                  <span>Checked:</span>
                  {activePO.checkedBy ? (
                    <strong className="text-amber-800 font-extrabold">{activePO.checkedBy}</strong>
                  ) : (
                    <span className="px-1.5 py-0.2 rounded bg-amber-200/90 text-amber-950 font-black text-[9.5px]">Belum Diisi</span>
                  )}
                </div>
                <div className="text-[11px] text-slate-700 truncate flex items-center justify-between">
                  <span>Computed:</span>
                  {activePO.computedBy ? (
                    <strong className="text-slate-900 font-bold">{activePO.computedBy}</strong>
                  ) : (
                    <span className="px-1.5 py-0.2 rounded bg-amber-200/90 text-amber-950 font-black text-[9.5px]">Belum Diisi</span>
                  )}
                </div>
              </div>
            </div>

            {/* ROW 3: COMPACT RESUME PENUGASAN UJI BADGE BAR */}
            <div className="pt-2 border-t border-slate-100 flex items-center gap-2 flex-wrap text-xs">
              <span className="font-extrabold text-slate-700 flex items-center gap-1.5 shrink-0 text-xs">
                <FlaskConical className="w-3.5 h-3.5 text-teal-600" />
                <span>Resume Uji:</span>
              </span>

              {activeMatrixColumns.length === 0 ? (
                <span className="text-slate-400 italic text-xs">Belum ada penugasan uji pada PO ini</span>
              ) : (
                activeMatrixColumns.map(col => {
                  const count = columnTotals[col.code] || 0;
                  return (
                    <span
                      key={col.code}
                      className="px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-900 border border-emerald-200/90 font-mono text-[10.5px] font-extrabold flex items-center gap-1 shadow-2xs"
                      title={`${col.fullNameIndo}: ${count} sampel diuji`}
                    >
                      <span>{normalizeTestCode(col.code)}</span>
                      <span className="w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[9px] font-bold">
                        {count}
                      </span>
                    </span>
                  );
                })
              )}
            </div>
          </div>

          {/* BATCH SUMMARY & TEST ASSIGNMENTS MATRIX TABLE */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm space-y-0">
            
            {/* Table Action Bar / Header */}
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-0.5">
                <div className="flex items-center gap-3">
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    Batch Summary & Test Assignments Matrix
                  </h3>
                  {onOpenCalcModal && activePO.samples.length > 0 && (
                    <button
                      onClick={() => {
                        const s = activePO.samples[0];
                        const testObj = s.tests.find(t => ['SG', 'MC', 'UW'].includes((t.testTypeCode || t.testTypeId || '').toUpperCase())) || s.tests[0];
                        if (testObj) onOpenCalcModal(testObj, s, activePO);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-teal-800 hover:bg-teal-900 text-amber-300 font-extrabold text-xs flex items-center gap-1.5 shadow-md shadow-teal-900/20 transition cursor-pointer"
                      title="Kertas Kerja / Work Sheet (Physical Properties: SG, MC, Unit Weight)"
                    >
                      <FileSpreadsheet className="w-4 h-4 text-amber-300" />
                      <span>Kertas Kerja / Work Sheet</span>
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-500 font-normal">({displayedColumns.length} Kolom Uji Tampil)</span>
                  <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-slate-200 text-slate-700 border border-slate-300">
                    {activePO.samples.length} Samples
                  </span>
                  <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                    {totalAssignedTestsInPO} Total Tests
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-medium">
                  Kolom tanpa pengujian disembunyikan otomatis. Klik tombol toggle untuk lihat/tampilkan semua 19 uji.
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {/* Auto-Hide Column Toggle Button */}
                <button
                  onClick={() => setHideEmptyColumns(prev => !prev)}
                  className={`p-2 rounded-xl transition border ${
                    hideEmptyColumns
                      ? 'bg-teal-50 border-teal-300 shadow-2xs'
                      : 'bg-slate-100 border-slate-200 hover:bg-slate-200'
                  }`}
                  title={hideEmptyColumns ? `Tampilkan Semua Uji` : `Sembunyikan Uji Kosong (${displayedColumns.length} Uji)`}
                >
                  {hideEmptyColumns ? (
                    <EyeOff className="w-4 h-4 text-teal-600" />
                  ) : (
                    <Eye className="w-4 h-4 text-slate-600" />
                  )}
                </button>

                <button
                  onClick={() => setIsExcelImportModalOpen(true)}
                  className="p-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white shadow-md shadow-teal-600/20 flex items-center transition"
                  title="Import dari Excel (.xlsx)"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                </button>

                <button
                  onClick={() => {
                    setSampleForm({
                      sampleCode: '',
                      reportNumber: '',
                      idLab: '',
                      depthStart: '',
                      depthEnd: '',
                      lithology: '',
                      soilType: '',
                      colourCode: 0,
                      sampleType: '',
                      testedBy: '',
                      locationTag: '',
                      sampleDescription: ''
                    });
                    setIsAddSampleModalOpen(true);
                  }}
                  className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 flex items-center transition border border-slate-200"
                  title="Tambah Sampel Manual"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Matrix Data Table with Right-Click Context Menu & Header Tooltips */}
            <div className="overflow-x-auto">
              <table className="w-full text-center text-xs text-slate-700 border-collapse">
                <thead className="bg-slate-100/90 text-slate-600 font-bold text-[10px] uppercase tracking-wider border-b border-slate-200 sticky top-0 z-20">
                  
                  {/* GROUP HEADER ROW: "JENIS PENGUJIAN" Banner Above Active Test Columns */}
                  <tr className="border-b border-slate-300 bg-slate-200/80 font-extrabold text-[11px] tracking-wider text-slate-800">
                    <th colSpan={6} className="py-2 px-3 text-left border-r border-slate-300 bg-slate-100 text-slate-600 font-sans">
                      INFORMASI DETAIL SAMPEL
                    </th>
                    <th colSpan={displayedColumns.length} className="py-2 px-3 text-center border-r border-slate-300 bg-teal-800 text-white font-sans tracking-widest shadow-inner">
                      JENIS PENGUJIAN LABORATORIUM ({displayedColumns.length} KOLOM TAMPIL)
                    </th>
                  </tr>

                  {/* Individual Column Header Row */}
                  <tr>
                    <th className="py-3.5 px-3 text-center border-r border-slate-200 w-12">No</th>
                    <th className="py-3.5 px-3 text-left border-r border-slate-200 min-w-[150px]">ID Sample / Kode</th>
                    <th className="py-3.5 px-3 text-left border-r border-slate-200 min-w-[140px]">Sample Type</th>
                    <th className="py-3.5 px-3 text-left border-r border-slate-200 min-w-[120px]">Material</th>
                    <th className="py-3.5 px-3 text-center border-r border-slate-200 min-w-[120px]">Kedalaman / Qty</th>
                    <th className="py-3.5 px-2 text-center border-r border-slate-200 w-16">USCS</th>

                    {/* Test Columns with SNI Tooltips - hover triggers fixed floating tooltip */}
                    {displayedColumns.map(col => (
                      <th
                        key={col.code}
                        className="py-3.5 px-2 text-center border-r border-slate-200 min-w-[65px] sm:min-w-[75px] relative select-none"
                        onMouseEnter={(e) => {
                          const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                          setHoveredCol({ col, x: rect.left + rect.width / 2, y: rect.bottom + 6, top: rect.top - 6 });
                        }}
                        onMouseLeave={() => setHoveredCol(null)}
                      >
                        <span className="block font-extrabold text-slate-800 cursor-help hover:text-teal-700 transition">
                          {normalizeTestCode(col.code) === 'Sieve-Hydro' ? 'Sieve-Hydro' : (normalizeTestCode(col.code) === 'PB' ? 'PB' : (col.label || col.code))}
                        </span>
                      </th>
                    ))}
                    <th className="py-3.5 px-4 text-center border-r border-slate-200 min-w-[135px] bg-teal-900 text-white font-extrabold font-sans">
                      <FileText className="w-3.5 h-3.5 inline mr-1" /> LHU / LAPORAN
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-mono text-[11px]">
                  {activePO.samples.map((s, idx) => {
                    return (
                      <tr 
                        key={s.id} 
                        onContextMenu={(e) => {
                          e.preventDefault();
                          setContextMenu({
                            x: e.clientX,
                            y: e.clientY,
                            sample: s
                          });
                        }}
                        className="hover:bg-slate-50 transition-colors duration-150 cursor-context-menu group"
                      >
                        <td className="py-2.5 px-2 text-slate-500 border-r border-slate-200 font-semibold">{idx + 1}</td>
                        <td className="py-2.5 px-3 text-left border-r border-slate-200">
                          <div className="text-xs font-black text-slate-900 font-sans tracking-tight">{s.sampleCode || s.idLab}</div>
                          {s.idLab && s.idLab !== s.sampleCode && (
                            <div className="text-[10px] text-teal-700 font-mono font-bold">{s.idLab}</div>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-left border-r border-slate-200 font-sans text-slate-700">
                          {s.sampleType ? (s.sampleType.includes('/') ? s.sampleType.split('/')[0].trim() : s.sampleType) : <span className="text-slate-400 font-mono">-</span>}
                        </td>
                        <td className="py-2.5 px-3 text-left border-r border-slate-200 font-sans text-amber-800 font-bold">
                          {s.soilType ? s.soilType : <span className="text-slate-400 font-mono font-normal">-</span>}
                        </td>
                        <td className="py-2.5 px-2 text-center border-r border-slate-200 text-slate-600 font-bold">
                          {s.sampleType.includes('Curah') || s.sampleType.includes('Bulk') ? (
                            <span>{s.depthStart ? `${s.depthStart} kg` : '-'}</span>
                          ) : (
                            <span>
                              {Number(s.depthStart).toFixed(2)} - {Number(s.depthEnd).toFixed(2)}
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-2 text-center border-r border-slate-200 font-bold text-teal-700">
                          {getSampleUscs(s)}
                        </td>

                        {/* Interactive Matrix Cells for Active Filtered Test Columns */}
                        {displayedColumns.map(col => {
                          const testObj = s.tests.find(t => {
                            const code = normalizeTestCode(t.testTypeCode || t.testTypeId || '');
                            const colCode = normalizeTestCode(col.code || '');
                            return code === colCode;
                          });
                          
                          if (!testObj) {
                            return (
                              <td 
                                key={col.code} 
                                onClick={() => setEditSampleTestsTarget({ sample: s, po: activePO })}
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
                                  onClick={() => {
                                    if (onOpenCalcModal) {
                                      onOpenCalcModal(testObj, s, activePO);
                                    } else {
                                      setActiveCompletionInfo({ test: testObj, sample: s, po: activePO });
                                    }
                                  }}
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
                                  onClick={() => {
                                    if (onOpenCalcModal) {
                                      onOpenCalcModal(testObj, s, activePO);
                                    } else {
                                      setPendingCompletion({
                                        poId: activePO.id,
                                        sampleId: s.id,
                                        testId: testObj.id,
                                        test: testObj,
                                        sample: s,
                                        po: activePO
                                      });
                                    }
                                  }}
                                  className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-amber-100 text-amber-800 border border-amber-300 hover:bg-amber-200 transition-all shadow-2xs cursor-pointer active:scale-95"
                                  title={`Dalam Proses (${col.fullNameIndo})`}
                                >
                                  <Clock className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            );
                          }

                          // ── SUBCONTRACT: test dialihkan ke lab rekanan ──
                          if (testObj.cancellationReason && testObj.cancellationReason.includes('[SUBCONTRACT]')) {
                            return (
                              <td key={col.code} className="py-2 px-1 text-center border-r border-slate-200">
                                <button
                                  onClick={() => {
                                    if (onOpenCalcModal) {
                                      onOpenCalcModal(testObj, s, activePO);
                                    } else {
                                      setPendingCompletion({
                                        poId: activePO.id,
                                        sampleId: s.id,
                                        testId: testObj.id,
                                        test: testObj,
                                        sample: s,
                                        po: activePO
                                      });
                                    }
                                  }}
                                  className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-purple-100 text-purple-700 border border-purple-300 hover:bg-purple-200 transition-all cursor-pointer font-bold text-[9px]"
                                  title={`Subkontrak Lab Rekanan (${col.fullNameIndo}) - Klik untuk input hasil dari lab rekanan`}
                                >
                                  <ArrowRightLeft className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            );
                          }

                          // unstarted (Belum Diinput - Jam Abu-abu)
                          return (
                            <td key={col.code} className="py-2 px-1 text-center border-r border-slate-200">
                              <button
                                onClick={() => {
                                  if (onOpenCalcModal) {
                                    onOpenCalcModal(testObj, s, activePO);
                                  } else {
                                    setPendingCompletion({
                                      poId: activePO.id,
                                      sampleId: s.id,
                                      testId: testObj.id,
                                      test: testObj,
                                      sample: s,
                                      po: activePO
                                    });
                                  }
                                }}
                                className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-slate-100 text-slate-400 border border-slate-200 hover:bg-slate-200 transition-all cursor-pointer"
                                title={`Belum Diinput (${col.fullNameIndo})`}
                              >
                                <Clock className="w-3.5 h-3.5 text-slate-400" />
                              </button>
                            </td>
                          );
                        })}


                        {/* FAR-RIGHT COLUMN: REVIEW LHU BUTTON PER SAMPLE */}
                        <td className="py-2.5 px-2 text-center border-r border-slate-200 font-sans">
                          <button
                            onClick={() => onOpenLHUModal && onOpenLHUModal(s, activePO)}
                            className="px-2.5 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-[10px] flex items-center justify-center gap-1.5 shadow-md shadow-teal-600/20 transition cursor-pointer"
                            title={`Lihat / Pratinjau Laporan Hasil Uji (LHU) Resmi A4 untuk ${s.sampleCode}`}
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>Review LHU</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>

                {/* Matrix Summary Footer Row */}
                <tfoot className="bg-slate-100/80 font-sans text-xs border-t border-slate-200">
                  <tr>
                    <td colSpan={7} className="py-3 px-4 text-right font-bold text-slate-600 border-r border-slate-200">
                      Total Assigned Tests Per Column:
                    </td>

                    {/* Column Total Badges */}
                    {displayedColumns.map(col => {
                      const count = columnTotals[col.code] || 0;
                      return (
                        <td key={col.code} className="py-3 px-1 text-center border-r border-slate-200 font-mono">
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
                    <td className="py-3 px-1 text-center border-r border-slate-200 font-mono text-slate-400">—</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Matrix Legend */}
          <div className="bg-white rounded-xl border border-slate-200 px-4 py-2.5 flex items-center gap-5 flex-wrap shadow-xs text-[10px] font-bold text-slate-600">
            <span className="text-slate-400 font-extrabold text-xs">LEGENDA:</span>
            <span className="flex items-center gap-1.5">
              <span className="inline-flex items-center justify-center w-5 h-5 rounded bg-emerald-100 text-emerald-700 border border-emerald-300 text-[10px]"><Check className="w-3.5 h-3.5 stroke-[3]" /></span>
              <span>Selesai / Diuji</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-flex items-center justify-center w-5 h-5 rounded bg-amber-100 text-amber-800 border border-amber-300 text-[10px]"><Clock className="w-3.5 h-3.5" /></span>
              <span>Sedang / Draft</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-flex items-center justify-center w-5 h-5 rounded bg-slate-100 text-slate-400 border border-slate-200 text-[10px]"><Clock className="w-3.5 h-3.5 text-slate-400" /></span>
              <span>Belum Diuji</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-flex items-center justify-center w-5 h-5 rounded bg-purple-100 text-purple-700 border border-purple-300 text-[10px]"><ArrowRightLeft className="w-3.5 h-3.5" /></span>
              <span>Subkontrak (Lab Rekanan)</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="text-slate-300 font-mono text-sm">—</span>
              <span>Tidak Diuji / N.A.</span>
            </span>
          </div>
        </div>
      )}

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
            if (onOpenCalcModal && activeCompletionInfo) {
              onOpenCalcModal(
                activeCompletionInfo.test,
                activeCompletionInfo.sample,
                activeCompletionInfo.po
              );
            }
          }}
        />
      )}

      {/* CUSTOM RIGHT-CLICK CONTEXT MENU POPUP (MODERN PREMIUM UPGRADE) */}
      {contextMenu && (
        <div
          style={{
            left: Math.min(contextMenu.x, window.innerWidth - 280),
            top: contextMenu.y + 320 > window.innerHeight ? Math.max(10, contextMenu.y - 320) : contextMenu.y,
          }}
          className="fixed z-[9999] bg-white/95 backdrop-blur-xl border border-slate-200/90 rounded-2xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.28),0_0_0_1px_rgba(0,0,0,0.05)] w-70 text-xs text-slate-800 overflow-hidden animate-in fade-in zoom-in-95 duration-150 select-none"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Clean Modern Light Header */}
          <div className="px-3.5 py-2.5 bg-slate-50/90 border-b border-slate-200/80">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="w-2 h-2 rounded-full bg-teal-500 shrink-0" />
                <span className="font-black text-xs tracking-tight truncate text-slate-900 font-mono">
                  {contextMenu.sample.sampleCode}
                </span>
              </div>
              {contextMenu.sample.idLab && contextMenu.sample.idLab !== contextMenu.sample.sampleCode && (
                <span className="text-[9.5px] px-2 py-0.5 rounded-md bg-teal-50 text-teal-800 border border-teal-200 font-mono font-bold shrink-0">
                  {contextMenu.sample.idLab}
                </span>
              )}
            </div>
            <div className="text-[10px] text-slate-500 mt-1 flex items-center justify-between font-sans">
              <span className="font-medium">Menu Aksi Sampel Lab</span>
              <span className="text-[9.5px] text-slate-600 font-mono font-bold bg-white px-1.5 py-0.2 rounded border border-slate-200">
                {contextMenu.sample.tests.length} Uji Terdaftar
              </span>
            </div>
          </div>

          {/* Action List */}
          <div className="p-1.5 space-y-1">
            <button
              onClick={() => {
                const s = contextMenu.sample;
                setContextMenu(null);
                setEditSampleTestsTarget({ sample: s, po: activePO! });
              }}
              className="w-full text-left px-2.5 py-1.5 rounded-xl hover:bg-emerald-50 text-slate-700 hover:text-emerald-900 flex items-center gap-2.5 font-bold transition-all group cursor-pointer"
            >
              <div className="w-7 h-7 rounded-lg bg-emerald-100/80 group-hover:bg-emerald-600 text-emerald-700 group-hover:text-white flex items-center justify-center transition-colors shrink-0 shadow-2xs">
                <CheckSquare className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[11px] font-extrabold tracking-tight text-slate-800 group-hover:text-emerald-950">Koreksi Penugasan Uji</div>
                <div className="text-[9px] text-slate-400 font-normal group-hover:text-emerald-700">Tambah / hapus parameter uji</div>
              </div>
            </button>

            {onOpenCalcModal && (
              <button
                onClick={() => {
                  const s = contextMenu.sample;
                  setContextMenu(null);
                  const testObj = s.tests.find(t => ['SG', 'MC', 'UW'].includes((t.testTypeCode || t.testTypeId || '').toUpperCase())) || s.tests[0];
                  if (testObj) onOpenCalcModal(testObj, s, activePO!);
                }}
                className="w-full text-left px-2.5 py-1.5 rounded-xl bg-amber-50/90 hover:bg-amber-100 text-amber-950 flex items-center gap-2.5 font-bold transition-all group cursor-pointer border border-amber-200/80 shadow-2xs"
              >
                <div className="w-7 h-7 rounded-lg bg-amber-200 group-hover:bg-amber-500 text-amber-900 group-hover:text-white flex items-center justify-center transition-colors shrink-0 shadow-2xs">
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[11px] font-black text-amber-950">Buka Kertas Kerja Uji</div>
                  <div className="text-[9px] text-amber-800/80 font-medium">Worksheet Sifat Fisik (PP)</div>
                </div>
              </button>
            )}

            <button
              onClick={() => {
                const s = contextMenu.sample;
                setContextMenu(null);
                handleOpenEditSample(s);
              }}
              className="w-full text-left px-2.5 py-1.5 rounded-xl hover:bg-slate-100 text-slate-700 hover:text-slate-900 flex items-center gap-2.5 font-semibold transition-all group cursor-pointer"
            >
              <div className="w-7 h-7 rounded-lg bg-slate-100 group-hover:bg-slate-700 text-slate-600 group-hover:text-white flex items-center justify-center transition-colors shrink-0 shadow-2xs">
                <Edit3 className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[11px] font-bold text-slate-800">Edit Data Fisik Sampel</div>
                <div className="text-[9px] text-slate-400">Kedalaman, USCS, warna tanah</div>
              </div>
            </button>

            {onOpenReportSheet && (
              <button
                onClick={() => {
                  const s = contextMenu.sample;
                  setContextMenu(null);
                  onOpenReportSheet(s, activePO!);
                }}
                className="w-full text-left px-2.5 py-1.5 rounded-xl hover:bg-teal-50 text-slate-700 hover:text-teal-900 flex items-center gap-2.5 font-semibold transition-all group cursor-pointer"
              >
                <div className="w-7 h-7 rounded-lg bg-teal-100/80 group-hover:bg-teal-700 text-teal-700 group-hover:text-white flex items-center justify-center transition-colors shrink-0 shadow-2xs">
                  <Printer className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[11px] font-bold text-slate-800">Cetak Form Laporan Lab</div>
                  <div className="text-[9px] text-slate-400 group-hover:text-teal-700">Preview &amp; cetak lembar LHU</div>
                </div>
              </button>
            )}

            <button
              onClick={() => {
                const s = contextMenu.sample;
                setContextMenu(null);
                handleOpenMoveSample(s);
              }}
              className="w-full text-left px-2.5 py-1.5 rounded-xl hover:bg-cyan-50 text-slate-700 hover:text-cyan-900 flex items-center gap-2.5 font-semibold transition-all group cursor-pointer"
            >
              <div className="w-7 h-7 rounded-lg bg-cyan-100/80 group-hover:bg-cyan-700 text-cyan-700 group-hover:text-white flex items-center justify-center transition-colors shrink-0 shadow-2xs">
                <ArrowRightLeft className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[11px] font-bold text-slate-800">Pindahkan Lokasi / Rak</div>
                <div className="text-[9px] text-slate-400 group-hover:text-cyan-700">Manajemen tag lokasi lab</div>
              </div>
            </button>

            <div className="my-1 border-t border-slate-100" />

            <button
              onClick={() => {
                const s = contextMenu.sample;
                setContextMenu(null);
                if (confirm(`Apakah Anda yakin ingin menghapus sampel ${s.sampleCode}?`)) {
                  onDeleteSample(activePO!.id, s.id);
                }
              }}
              className="w-full text-left px-2.5 py-1.5 rounded-xl hover:bg-red-50 text-red-600 hover:text-red-700 flex items-center gap-2.5 font-semibold transition-all group cursor-pointer"
            >
              <div className="w-7 h-7 rounded-lg bg-red-100/80 group-hover:bg-red-600 text-red-600 group-hover:text-white flex items-center justify-center transition-colors shrink-0 shadow-2xs">
                <Trash2 className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[11px] font-bold text-red-600">Hapus Sampel</div>
                <div className="text-[9px] text-red-400">Keluarkan dari batch PO ini</div>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* MODAL: EDIT SAMPEL DETAIL */}
      {isEditSampleModalOpen && selectedSample && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-xl w-full p-6 space-y-4 shadow-2xl my-8 text-slate-800">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-teal-600" />
                Edit Detail Kode Sampel & Fisik Tanah
              </h3>
              <button onClick={() => setIsEditSampleModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditSample} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Kode Sampel / Sample Number</label>
                  <input
                    type="text"
                    required
                    value={sampleForm.sampleCode}
                    onChange={(e) => setSampleForm({ ...sampleForm, sampleCode: e.target.value })}
                    className="w-full bg-slate-50 text-slate-900 p-2 rounded-lg border border-slate-200 focus:outline-none focus:border-teal-600"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-semibold mb-1">ID Lab Sampel</label>
                  <input
                    type="text"
                    required
                    value={sampleForm.idLab}
                    onChange={(e) => setSampleForm({ ...sampleForm, idLab: e.target.value })}
                    className="w-full bg-slate-50 text-slate-900 p-2 rounded-lg border border-slate-200 focus:outline-none focus:border-teal-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Kedalaman Awal (m)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={sampleForm.depthStart}
                    onChange={(e) => setSampleForm({ ...sampleForm, depthStart: e.target.value === '' ? '' : Number(e.target.value) })}
                    className="w-full bg-slate-50 text-slate-900 p-2 rounded-lg border border-slate-200 focus:outline-none focus:border-teal-600"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Kedalaman Akhir (m)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={sampleForm.depthEnd}
                    onChange={(e) => setSampleForm({ ...sampleForm, depthEnd: e.target.value === '' ? '' : Number(e.target.value) })}
                    className="w-full bg-slate-50 text-slate-900 p-2 rounded-lg border border-slate-200 focus:outline-none focus:border-teal-600"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Lithology / USCS</label>
                  <input
                    type="text"
                    value={sampleForm.lithology}
                    onChange={(e) => setSampleForm({ ...sampleForm, lithology: e.target.value })}
                    className="w-full bg-slate-50 text-slate-900 p-2 rounded-lg border border-slate-200 focus:outline-none focus:border-teal-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Tipe Tanah (Soil Type)</label>
                <input
                  type="text"
                  value={sampleForm.soilType}
                  onChange={(e) => setSampleForm({ ...sampleForm, soilType: e.target.value })}
                  className="w-full bg-slate-50 text-slate-900 p-2 rounded-lg border border-slate-200 focus:outline-none focus:border-teal-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Type of Sample</label>
                  <select
                    value={sampleForm.sampleType}
                    onChange={(e) => setSampleForm({ ...sampleForm, sampleType: e.target.value as any })}
                    className="w-full bg-slate-50 text-slate-900 p-2 rounded-lg border border-slate-200 focus:outline-none focus:border-teal-600"
                  >
                    <option value="">Belum Dipilih</option>
                    {sampleTypeCatalogue.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Penguji (Tested By)</label>
                  <input
                    type="text"
                    required
                    value={sampleForm.testedBy}
                    onChange={(e) => setSampleForm({ ...sampleForm, testedBy: e.target.value })}
                    className="w-full bg-slate-50 text-slate-900 p-2 rounded-lg border border-slate-200 focus:outline-none focus:border-teal-600"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditSampleModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-bold flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>Update Sampel</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: IMPORT EXCEL */}
      {isExcelImportModalOpen && activePO && (
        <ExcelImportModal
          poNumber={activePO.poNumber}
          onClose={() => setIsExcelImportModalOpen(false)}
          onConfirmImport={handleConfirmExcelImport}
        />
      )}

      {/* MODAL: TAMBAH PO BARU */}
      {isAddPOModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-2xl w-full p-6 space-y-4 shadow-2xl my-8 text-slate-800">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <FolderKanban className="w-5 h-5 text-teal-600" />
                Tambah Purchase Order & Detail Client Baru
              </h3>
              <button onClick={() => setIsAddPOModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAddPO} className="space-y-3 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">No PO / Job Number</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. PO-GQT-19"
                    value={poForm.poNumber}
                    onChange={(e) => setPoForm({ ...poForm, poNumber: e.target.value })}
                    className="w-full bg-slate-50 text-slate-900 p-2 rounded-lg border border-slate-200 focus:outline-none focus:border-teal-600"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Nama Client</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. PT Itamatra Nusantara"
                    value={poForm.clientName}
                    onChange={(e) => setPoForm({ ...poForm, clientName: e.target.value })}
                    className="w-full bg-slate-50 text-slate-900 p-2 rounded-lg border border-slate-200 focus:outline-none focus:border-teal-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Alamat Client</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ganda Ganda, Petasia, Morowali Regency, Central Sulawesi"
                  value={poForm.clientAddress}
                  onChange={(e) => setPoForm({ ...poForm, clientAddress: e.target.value })}
                  className="w-full bg-slate-50 text-slate-900 p-2 rounded-lg border border-slate-200 focus:outline-none focus:border-teal-600"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Nama Project</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Penyelidikan Geoteknik Morowali"
                    value={poForm.projectName}
                    onChange={(e) => setPoForm({ ...poForm, projectName: e.target.value })}
                    className="w-full bg-slate-50 text-slate-900 p-2 rounded-lg border border-slate-200 focus:outline-none focus:border-teal-600"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Lokasi Project</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Morowali Utara"
                    value={poForm.projectLocation}
                    onChange={(e) => setPoForm({ ...poForm, projectLocation: e.target.value })}
                    className="w-full bg-slate-50 text-slate-900 p-2 rounded-lg border border-slate-200 focus:outline-none focus:border-teal-600"
                  />
                </div>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <div className="font-bold text-slate-800 text-[11px]">Alur Tanggal Administrasi</div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div>
                    <label className="block text-slate-500 text-[10px] font-semibold mb-1">Tanggal Datang</label>
                    <input
                      type="date"
                      value={poForm.sampleArrivalDate}
                      onChange={(e) => setPoForm({ ...poForm, sampleArrivalDate: e.target.value })}
                      className="w-full bg-white text-slate-900 p-1.5 rounded-lg border border-slate-200 focus:outline-none focus:border-teal-600"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-500 text-[10px] font-semibold mb-1">Diterima List Uji</label>
                    <input
                      type="date"
                      value={poForm.listReceivedDate}
                      onChange={(e) => setPoForm({ ...poForm, listReceivedDate: e.target.value })}
                      className="w-full bg-white text-slate-900 p-1.5 rounded-lg border border-slate-200 focus:outline-none focus:border-teal-600"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-500 text-[10px] font-semibold mb-1">Preparasi Dimulai</label>
                    <input
                      type="date"
                      value={poForm.preparationStartDate}
                      onChange={(e) => setPoForm({ ...poForm, preparationStartDate: e.target.value })}
                      className="w-full bg-white text-slate-900 p-1.5 rounded-lg border border-slate-200 focus:outline-none focus:border-teal-600"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-500 text-[10px] font-semibold mb-1">Awal Pengujian</label>
                    <input
                      type="date"
                      value={poForm.testingStartDate}
                      onChange={(e) => setPoForm({ ...poForm, testingStartDate: e.target.value })}
                      className="w-full bg-white text-slate-900 p-1.5 rounded-lg border border-slate-200 focus:outline-none focus:border-teal-600"
                    />
                  </div>
                </div>

                {/* Deadline row highlighted */}
                <div className="pt-2 border-t border-slate-200">
                  <label className="block text-[10px] font-extrabold text-red-700 mb-1 flex items-center gap-1">
                    ⏰ Deadline Penyelesaian *
                  </label>
                  <input
                    type="date"
                    required
                    value={poForm.deadline}
                    onChange={(e) => setPoForm({ ...poForm, deadline: e.target.value })}
                    className="w-full bg-red-50 text-red-900 p-2 rounded-lg border-2 border-red-300 focus:outline-none focus:border-red-500 font-bold text-xs"
                  />
                  <p className="text-[10px] text-red-500 mt-1 font-medium">Tanggal ini menentukan label Mendesak/Aman di semua tampilan.</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Checked By</label>
                  <input
                    type="text"
                    value={poForm.checkedBy}
                    onChange={(e) => setPoForm({ ...poForm, checkedBy: e.target.value })}
                    className="w-full bg-slate-50 text-slate-900 p-2 rounded-lg border border-slate-200 focus:outline-none focus:border-teal-600"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Computed By</label>
                  <input
                    type="text"
                    value={poForm.computedBy}
                    onChange={(e) => setPoForm({ ...poForm, computedBy: e.target.value })}
                    className="w-full bg-slate-50 text-slate-900 p-2 rounded-lg border border-slate-200 focus:outline-none focus:border-teal-600"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Tempat / Kota</label>
                  <input
                    type="text"
                    value={poForm.place}
                    onChange={(e) => setPoForm({ ...poForm, place: e.target.value })}
                    className="w-full bg-slate-50 text-slate-900 p-2 rounded-lg border border-slate-200 focus:outline-none focus:border-teal-600"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddPOModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-bold flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>Simpan PO</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDIT PO */}
      {isEditPOModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-2xl w-full p-6 space-y-4 shadow-2xl my-8 text-slate-800">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-teal-600" />
                Edit Detail PO & Data Client
              </h3>
              <button onClick={() => setIsEditPOModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditPO} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">No PO / Job Number</label>
                  <input
                    type="text"
                    required
                    value={poForm.poNumber}
                    onChange={(e) => setPoForm({ ...poForm, poNumber: e.target.value })}
                    className="w-full bg-slate-50 text-slate-900 p-2 rounded-lg border border-slate-200 focus:outline-none focus:border-teal-600"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Nama Client</label>
                  <input
                    type="text"
                    required
                    value={poForm.clientName}
                    onChange={(e) => setPoForm({ ...poForm, clientName: e.target.value })}
                    className="w-full bg-slate-50 text-slate-900 p-2 rounded-lg border border-slate-200 focus:outline-none focus:border-teal-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Alamat Client</label>
                <input
                  type="text"
                  required
                  value={poForm.clientAddress}
                  onChange={(e) => setPoForm({ ...poForm, clientAddress: e.target.value })}
                  className="w-full bg-slate-50 text-slate-900 p-2 rounded-lg border border-slate-200 focus:outline-none focus:border-teal-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Nama Project</label>
                  <input
                    type="text"
                    required
                    value={poForm.projectName}
                    onChange={(e) => setPoForm({ ...poForm, projectName: e.target.value })}
                    className="w-full bg-slate-50 text-slate-900 p-2 rounded-lg border border-slate-200 focus:outline-none focus:border-teal-600"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Lokasi Project</label>
                  <input
                    type="text"
                    required
                    value={poForm.projectLocation}
                    onChange={(e) => setPoForm({ ...poForm, projectLocation: e.target.value })}
                    className="w-full bg-slate-50 text-slate-900 p-2 rounded-lg border border-slate-200 focus:outline-none focus:border-teal-600"
                  />
                </div>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <div className="font-bold text-slate-800 text-[11px]">Alur Tanggal Administrasi</div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div>
                    <label className="block text-slate-500 text-[10px] font-semibold mb-1">Tanggal Datang</label>
                    <input
                      type="date"
                      value={poForm.sampleArrivalDate}
                      onChange={(e) => setPoForm({ ...poForm, sampleArrivalDate: e.target.value })}
                      className="w-full bg-white text-slate-900 p-1.5 rounded-lg border border-slate-200 focus:outline-none focus:border-teal-600"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-500 text-[10px] font-semibold mb-1">Diterima List Uji</label>
                    <input
                      type="date"
                      value={poForm.listReceivedDate}
                      onChange={(e) => setPoForm({ ...poForm, listReceivedDate: e.target.value })}
                      className="w-full bg-white text-slate-900 p-1.5 rounded-lg border border-slate-200 focus:outline-none focus:border-teal-600"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-500 text-[10px] font-semibold mb-1">Preparasi Dimulai</label>
                    <input
                      type="date"
                      value={poForm.preparationStartDate}
                      onChange={(e) => setPoForm({ ...poForm, preparationStartDate: e.target.value })}
                      className="w-full bg-white text-slate-900 p-1.5 rounded-lg border border-slate-200 focus:outline-none focus:border-teal-600"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-500 text-[10px] font-semibold mb-1">Awal Pengujian</label>
                    <input
                      type="date"
                      value={poForm.testingStartDate}
                      onChange={(e) => setPoForm({ ...poForm, testingStartDate: e.target.value })}
                      className="w-full bg-white text-slate-900 p-1.5 rounded-lg border border-slate-200 focus:outline-none focus:border-teal-600"
                    />
                  </div>
                </div>

                {/* Deadline row highlighted */}
                <div className="pt-2 border-t border-slate-200">
                  <label className="block text-[10px] font-extrabold text-red-700 mb-1 flex items-center gap-1">
                    ⏰ Deadline Penyelesaian *
                  </label>
                  <input
                    type="date"
                    required
                    value={poForm.deadline}
                    onChange={(e) => setPoForm({ ...poForm, deadline: e.target.value })}
                    className="w-full bg-red-50 text-red-900 p-2 rounded-lg border-2 border-red-300 focus:outline-none focus:border-red-500 font-bold text-xs"
                  />
                  <p className="text-[10px] text-red-500 mt-1 font-medium">Tanggal ini menentukan label Mendesak/Aman di semua tampilan.</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Checked By</label>
                  <input
                    type="text"
                    value={poForm.checkedBy}
                    onChange={(e) => setPoForm({ ...poForm, checkedBy: e.target.value })}
                    className="w-full bg-slate-50 text-slate-900 p-2 rounded-lg border border-slate-200 focus:outline-none focus:border-teal-600"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Computed By</label>
                  <input
                    type="text"
                    value={poForm.computedBy}
                    onChange={(e) => setPoForm({ ...poForm, computedBy: e.target.value })}
                    className="w-full bg-slate-50 text-slate-900 p-2 rounded-lg border border-slate-200 focus:outline-none focus:border-teal-600"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Tempat / Kota</label>
                  <input
                    type="text"
                    value={poForm.place}
                    onChange={(e) => setPoForm({ ...poForm, place: e.target.value })}
                    className="w-full bg-slate-50 text-slate-900 p-2 rounded-lg border border-slate-200 focus:outline-none focus:border-teal-600"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditPOModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-bold flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>Update PO</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: TAMBAH SAMPEL DETAIL */}
      {isAddSampleModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-xl w-full p-6 space-y-4 shadow-2xl my-8 text-slate-800">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <FlaskConical className="w-5 h-5 text-teal-600" />
                Tambah Kode Sampel & Fisik Tanah
              </h3>
              <button onClick={() => setIsAddSampleModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAddSample} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Kode Sampel / Sample Number</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. BH-01 (1.50 - 2.00m)"
                    value={sampleForm.sampleCode}
                    onChange={(e) => setSampleForm({ ...sampleForm, sampleCode: e.target.value })}
                    className="w-full bg-slate-50 text-slate-900 p-2 rounded-lg border border-slate-200 focus:outline-none focus:border-teal-600"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-semibold mb-1">ID Lab Sampel</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. LAB-GQT-001"
                    value={sampleForm.idLab}
                    onChange={(e) => setSampleForm({ ...sampleForm, idLab: e.target.value })}
                    className="w-full bg-slate-50 text-slate-900 p-2 rounded-lg border border-slate-200 focus:outline-none focus:border-teal-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Kedalaman Awal (m)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={sampleForm.depthStart}
                    onChange={(e) => setSampleForm({ ...sampleForm, depthStart: e.target.value === '' ? '' : Number(e.target.value) })}
                    className="w-full bg-slate-50 text-slate-900 p-2 rounded-lg border border-slate-200 focus:outline-none focus:border-teal-600"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Kedalaman Akhir (m)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={sampleForm.depthEnd}
                    onChange={(e) => setSampleForm({ ...sampleForm, depthEnd: e.target.value === '' ? '' : Number(e.target.value) })}
                    className="w-full bg-slate-50 text-slate-900 p-2 rounded-lg border border-slate-200 focus:outline-none focus:border-teal-600"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Lithology / USCS</label>
                  <input
                    type="text"
                    placeholder="e.g. CL / NP"
                    value={sampleForm.lithology}
                    onChange={(e) => setSampleForm({ ...sampleForm, lithology: e.target.value })}
                    className="w-full bg-slate-50 text-slate-900 p-2 rounded-lg border border-slate-200 focus:outline-none focus:border-teal-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Tipe Tanah (Soil Type)</label>
                  <input
                    type="text"
                    placeholder="e.g. Lempung Pasiran / Organic Clay"
                    value={sampleForm.soilType}
                  onChange={(e) => setSampleForm({ ...sampleForm, soilType: e.target.value })}
                  className="w-full bg-slate-50 text-slate-900 p-2 rounded-lg border border-slate-200 focus:outline-none focus:border-teal-600"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1 flex items-center justify-between">
                  <span>Warna Tanah USCS (Bilingual)</span>
                  <span className="text-[10px] text-teal-700 font-bold">Standar USCS Lab</span>
                </label>

                <select
                  value={sampleForm.colourCode}
                  onChange={(e) => setSampleForm({ ...sampleForm, colourCode: Number(e.target.value) })}
                  className="w-full bg-slate-50 text-slate-900 p-2 rounded-lg border border-slate-200 focus:outline-none focus:border-teal-600"
                >
                  {SOIL_COLOUR_CATALOGUE.map(c => (
                    <option key={c.code} value={c.code}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Type of Sample</label>
                  <select
                    value={sampleForm.sampleType}
                    onChange={(e) => setSampleForm({ ...sampleForm, sampleType: e.target.value as any })}
                    className="w-full bg-slate-50 text-slate-900 p-2 rounded-lg border border-slate-200 focus:outline-none focus:border-teal-600"
                  >
                    <option value="">Belum Dipilih</option>
                    {sampleTypeCatalogue.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Penguji (Tested By)</label>
                  <input
                    type="text"
                    required
                    value={sampleForm.testedBy}
                    onChange={(e) => setSampleForm({ ...sampleForm, testedBy: e.target.value })}
                    className="w-full bg-slate-50 text-slate-900 p-2 rounded-lg border border-slate-200 focus:outline-none focus:border-teal-600"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddSampleModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-bold flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>Simpan Sampel</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: MOVE SAMPEL */}
      {isMoveSampleModalOpen && selectedSample && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-md w-full p-6 space-y-4 shadow-2xl text-slate-800">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <ArrowRightLeft className="w-5 h-5 text-cyan-600" />
                Move / Transfer Sampel & Penguji
              </h3>
              <button onClick={() => setIsMoveSampleModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveMoveSample} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Assign Teknisi / Penguji (Noval Otoritas)</label>
                <select
                  value={moveForm.newTechnician}
                  onChange={(e) => setMoveForm({ ...moveForm, newTechnician: e.target.value })}
                  className="w-full bg-slate-50 text-slate-900 p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-teal-600 font-bold text-xs"
                >
                  <option value="">Pilih Teknisi / Analyst Penanggung Jawab</option>
                  <option value="Rafi, A.Md. (AO#1)">Rafi, A.Md. (AO#1 - Penguji 1)</option>
                  <option value="Rizki, A.Md. (AO#2)">Rizki, A.Md. (AO#2 - Penguji 2)</option>
                  <option value="Rasya, A.Md. (AO#3)">Rasya, A.Md. (AO#3 - Penguji 3)</option>
                  <option value="Rakean Dhafin Nouval, S.T.">Rakean Dhafin Nouval, S.T. (Noval - Kepala Teknis)</option>
                  <option value="Ir. Alan Suherman, M.T.">Ir. Alan Suherman, M.T. (Pak Alan - Kepala Lab)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Pindahkan Ke Rak / Lokasi Baru</label>
                <input
                  type="text"
                  required
                  value={moveForm.newLocationTag}
                  onChange={(e) => setMoveForm({ ...moveForm, newLocationTag: e.target.value })}
                  className="w-full bg-slate-50 text-slate-900 p-2 rounded-lg border border-slate-200 focus:outline-none focus:border-teal-600"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsMoveSampleModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white font-bold flex items-center gap-1.5"
                >
                  <ArrowRightLeft className="w-4 h-4" />
                  <span>Transfer</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FLOATING TOOLTIP - rendered outside overflow container so it never clips */}
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
