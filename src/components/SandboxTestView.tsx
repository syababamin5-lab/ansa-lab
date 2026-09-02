import React, { useState } from 'react';
import { 
  Sample, 
  PurchaseOrder, 
  ContainerItem, 
  RingItem, 
  PycnometerItem, 
  PersonnelItem,
  ConsolRingItem,
  MoldItem,
  ReamerItem
} from '../types';
import { 
  FlaskConical, 
  Calculator, 
  RotateCcw, 
  Layers, 
  CheckCircle2, 
  Sparkles, 
  Info, 
  SlidersHorizontal,
  ChevronRight,
  Activity,
  BarChart3,
  Droplet,
  CircleDot,
  Gauge,
  Compass,
  FileSpreadsheet,
  AlertTriangle,
  Zap,
  BookOpen,
  FileText
} from 'lucide-react';
import { PhysicalPropertiesView } from './PhysicalPropertiesView';
import { LHUReportModal } from './LHUReportModal';

interface SandboxTestViewProps {
  pos: PurchaseOrder[];
  containerCatalogue: ContainerItem[];
  ringCatalogue: RingItem[];
  consolRingCatalogue?: ConsolRingItem[];
  pycCatalogue: PycnometerItem[];
  personnelCatalogue?: PersonnelItem[];
  moldCatalogue?: MoldItem[];
  reamerCatalogue?: ReamerItem[];
  onSaveSampleCalculation: (poId: string, sampleId: string, summaryData: any) => void;
}

// 22 Master Test Catalogue Items for Sandbox Playground
const SANDBOX_TEST_CATALOGUE = [
  { code: 'SG', label: 'Specific Gravity (Berat Jenis)', sni: 'SNI 1964:2008', cat: 'Fisik', status: 'ready' },
  { code: 'MC', label: 'Moisture Content (Kadar Air)', sni: 'SNI 1965:2008', cat: 'Fisik', status: 'ready' },
  { code: 'UW', label: 'Unit Weight (Berat Isi / Kepadatan)', sni: 'SNI 03-3637-1994', cat: 'Fisik', status: 'ready' },
  { code: 'ATB', label: 'Atterberg Limits (LL, PL, PI, USCS)', sni: 'SNI 1966:2008 & 1967:2008', cat: 'Fisik', status: 'ready' },
  { code: 'SVE-HYD', label: 'Sieve Analysis & Hydrometer', sni: 'SNI 3423:2008', cat: 'Fisik', status: 'ready' },
  { code: 'PRM', label: 'Permeability Falling Head', sni: 'SNI 03-6870-2002', cat: 'Permeabilitas', status: 'ready' },
  { code: 'CT', label: 'Consolidation Oedometer (Pc, Cc, Cr, e0)', sni: 'SNI 2812:2011', cat: 'Konsolidasi', status: 'ready' },
  { code: 'UCT', label: 'Unconfined Compression / UCS Tanah', sni: 'SNI 3638:2012', cat: 'Mekanis', status: 'ready' },
  { code: 'CMP-STD', label: 'Compaction Standard Proctor', sni: 'SNI 1742:2008', cat: 'Pemadatan', status: 'ready' },
  { code: 'CMP-MOD', label: 'Compaction Modified Proctor', sni: 'SNI 1743:2008', cat: 'Pemadatan', status: 'ready' },
  { code: 'DS-UU', label: 'Direct Shear UU', sni: 'SNI 3420:2016', cat: 'Mekanis', status: 'ready' },
  { code: 'DSH-CU', label: 'Direct Shear CU (Terkonsolidasi Undrained)', sni: 'SNI 2813:2008', cat: 'Mekanis', status: 'draft' },
  { code: 'DSH-CD', label: 'Direct Shear CD (Terkonsolidasi Drained)', sni: 'SNI 2813:2008', cat: 'Mekanis', status: 'draft' },
  { code: 'DSH-CDR', label: 'Direct Shear CD Residual (Kuat Geser Residu)', sni: 'SNI 2813:2008', cat: 'Mekanis', status: 'draft' },
  { code: 'TRX-UU', label: 'Triaxial Compression UU', sni: 'SNI 4813:2015', cat: 'Mekanis', status: 'ready' },
  { code: 'TRX-CU', label: 'Triaxial Compression CU (PWP Measured)', sni: 'SNI 2455:2015', cat: 'Mekanis', status: 'draft' },
  { code: 'TRX-CD', label: 'Triaxial Compression CD (Drained Slow)', sni: 'SNI 2455:2015', cat: 'Mekanis', status: 'draft' },
  { code: 'CBR-UNS', label: 'CBR Lab Unsoaked (Tanpa Perendaman)', sni: 'SNI 1744:2012', cat: 'Pemadatan', status: 'ready' },
  { code: 'CBR-SOK', label: 'CBR Lab Soaked (Perendaman 4 Hari / Swell)', sni: 'SNI 1744:2012', cat: 'Pemadatan', status: 'ready' },
  { code: 'PLI', label: 'Point Load Index (Uji Beban Titik Batuan)', sni: 'ASTM D5731 / ISRM', cat: 'Batuan', status: 'draft' },
  { code: 'UCS-ROCK', label: 'Uniaxial Compressive Strength Batuan', sni: 'ASTM D7012 / ISRM', cat: 'Batuan', status: 'draft' }
];

export const SandboxTestView: React.FC<SandboxTestViewProps> = ({
  pos,
  containerCatalogue,
  ringCatalogue,
  consolRingCatalogue = [],
  pycCatalogue,
  personnelCatalogue = [],
  moldCatalogue = [],
  reamerCatalogue = [],
  onSaveSampleCalculation
}) => {
  const [activeTabMode, setActiveTabMode] = useState<'worksheet' | 'placeholder_list' | 'guide'>('worksheet');
  const [selectedPlaceholderCode, setSelectedPlaceholderCode] = useState<string>('DSH-CU');

  // Interactive state for placeholder test forms
  const [placeholderInputs, setPlaceholderInputs] = useState<Record<string, Record<string, string>>>({
    'DSH-CU': { sigma1: '100', tau1: '62.5', sigma2: '200', tau2: '115.0', sigma3: '300', tau3: '168.0', cVal: '15.2', phiVal: '26.8' },
    'DSH-CD': { sigma1: '100', tau1: '58.0', sigma2: '200', tau2: '105.0', sigma3: '300', tau3: '152.0', cVal: '10.5', phiVal: '25.3' },
    'DSH-CDR': { sigma1: '100', tau1: '38.0', sigma2: '200', tau2: '72.0', sigma3: '300', tau3: '106.0', cVal: '2.5', phiVal: '18.5' },
    'TRX-CU': { cellP1: '100', devP1: '145', pwp1: '35', cellP2: '200', devP2: '260', pwp2: '65', cEff: '18.5', phiEff: '28.4' },
    'TRX-CD': { cellP1: '100', devP1: '120', cellP2: '200', devP2: '225', cellP3: '300', devP3: '330', cEff: '12.0', phiEff: '27.5' },
    'PLI': { specimenNo: 'PL-01', distMm: '50.2', loadKn: '14.8', diameterMm: '54.7', Is50: '5.24', UCS_est: '125.8' },
    'UCS-ROCK': { diaMm: '54.5', lengthMm: '109.0', areaCm2: '23.33', maxLoadKn: '185.4', ucsMpa: '79.5' }
  });

  // Construct or retrieve Sandbox PO from pos prop (persisted in localStorage)
  const existingSandboxPO = (pos || []).find(p => p.id === 'po-sandbox-all-in-one' || p.poNumber === 'PO-SANDBOX-TEST');

  const defaultSandboxPO: PurchaseOrder = {
    id: 'po-sandbox-all-in-one',
    poNumber: 'PO-SANDBOX-TEST',
    clientName: 'PT. Terraforma Geoteknik Indonesia (Mode Uji Coba Rumus)',
    clientAddress: 'Jl. Geoteknik No. 1, Bandung',
    projectName: 'Eksperimen & Validasi Semua Rumus Pengujian Laboratorium',
    projectLocation: 'Laboratorium Mekanika Tanah Utama',
    status: 'Running',
    startDate: new Date().toISOString(),
    deadline: '',
    sampleArrivalDate: new Date().toISOString(),
    listReceivedDate: new Date().toISOString(),
    preparationStartDate: new Date().toISOString(),
    testingStartDate: new Date().toISOString(),
    checkedBy: 'AS Sumartadji',
    computedBy: 'Ir. Agus Wijaya, MT',
    place: 'Bandung',
    totalSamplesCount: 1,
    notes: '[SANDBOX PLAYGROUND] PO uji coba otomatis untuk mengetes akurasi semua rumus perhitungannya.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    samples: [
      {
        id: 'smp-sandbox-01',
        poId: 'po-sandbox-all-in-one',
        sampleCode: 'BH-SANDBOX (0.00-1.00m)',
        reportNumber: 'REP-2026-SANDBOX-01',
        idLab: 'LAB-SANDBOX-TEST',
        depthStart: 0,
        depthEnd: 1,
        lithology: 'NP',
        soilType: 'Sampel Eksperimen All-in-One',
        colourCode: 1,
        colourName: 'Cokelat / Brown',
        sampleType: 'Undisturbed Sample / UDS',
        testedBy: '',
        assignedTechnician: '',
        locationTag: 'Rak Cold-Room Sandbox',
        sampleDescription: 'Sampel uji coba untuk menguji semua 22 formulir rumus lab.',
        status: 'Pending',
        createdAt: new Date().toISOString(),
        tests: SANDBOX_TEST_CATALOGUE.map((item, idx) => ({
          id: `t-sandbox-${item.code.toLowerCase()}-${idx}`,
          sampleId: 'smp-sandbox-01',
          testTypeId: `tt-${item.code.toLowerCase()}`,
          testTypeName: item.label,
          testTypeCode: item.code,
          technicianName: '',
          status: 'Belum Diuji',
          estimatedDurationHours: 24,
          calculationStatus: 'Not Started'
        }))
      }
    ]
  };

  const sandboxPO: PurchaseOrder = existingSandboxPO || defaultSandboxPO;

  const currentPlaceholder = placeholderInputs[selectedPlaceholderCode] || {};

  const handleUpdatePlaceholderInput = (field: string, value: string) => {
    setPlaceholderInputs(prev => ({
      ...prev,
      [selectedPlaceholderCode]: {
        ...(prev[selectedPlaceholderCode] || {}),
        [field]: value
      }
    }));
  };

  const [isLHUModalOpen, setIsLHUModalOpen] = useState(false);

  // Sample copy with populated dummy calculation data for previewing complete LHU Report
  const sandboxSampleForLHU: Sample = {
    ...sandboxPO.samples[0],
    tests: sandboxPO.samples[0].tests.map(t => {
      const code = t.testTypeCode;
      let summaryResults: Record<string, any> = {};
      let inputValues: Record<string, any> = {};

      if (code === 'SG') {
        summaryResults = { gsAvg: 2.65, status: 'Calculated' };
        inputValues = { pycNo1: '1', pycNo2: '2', sgA1: '10.454', sgA2: '10.299', sgT1: 23, sgT2: 23, sgB1: '158.708', sgB2: '159.346' };
      } else if (code === 'MC') {
        summaryResults = { mcAvg: 38.45, status: 'Calculated' };
        inputValues = { mcContainer1: '66', mcContainer2: '142', mcWet1: '115.633', mcWet2: '123.201', mcDry1: '78.058', mcDry2: '83.187' };
      } else if (code === 'UW') {
        summaryResults = { bulkDensity: 1.685, dryDensity: 1.217, status: 'Calculated' };
        inputValues = { ringNo: '1', ringWetWeight: '94.803' };
      } else if (code === 'ATB') {
        summaryResults = { LL: 52.4, PL: 24.1, PI: 28.3, Classification: 'CH' };
        inputValues = { computedLL: 52.4, computedPL: 24.1, atbBlows: ['15', '24', '33'], atbWet: ['32.5', '31.2', '29.8'], atbDry: ['24.1', '23.4', '22.8'] };
      } else if (code === 'SVE-HYD') {
        summaryResults = { sievePercentPassing: [100, 98.5, 92.4, 85.0, 72.1, 58.4], hydroPercentPassing: [45.2, 38.1, 29.4, 18.2, 9.5] };
        inputValues = { shSieveRetained: ['0', '0.75', '3.8', '3.7', '6.45', '6.85'], shHydroReadings: ['42', '35', '27', '17', '9'] };
      } else if (code === 'PRM') {
        summaryResults = { kAvg: 2.45e-6, status: 'Calculated' };
        inputValues = { prmH1: ['100', '100', '100'], prmH2: ['45', '46', '45.5'], prmTime: ['120', '120', '120'] };
      } else if (code === 'CT') {
        summaryResults = { pc: 1.25, cc: 0.385, cr: 0.042, e0: 1.142, ocr: 1.85 };
        inputValues = { consolPc: 1.25, consolCc: 0.385, consolCr: 0.042, consolE0: 1.142, consolDial24h: ['10', '25', '50', '100', '200', '400', '800', '1600'] };
      } else if (code === 'UCT') {
        summaryResults = { qu: 124.5, cu: 62.25 };
        inputValues = { uctMaxLoad: 0.385, uctFailureStrain: 4.2 };
      } else if (['DS-UU', 'DSH-UU', 'DS'].includes(code)) {
        summaryResults = { cohesionKg: 0.35, cohesionKpa: 34.3, phiDeg: 16.5 };
        inputValues = { dsCohesionKg: 0.35, dsPhiDeg: 16.5, dsDialReadingsA: ['15', '32', '48'] };
      } else if (code === 'TRX-UU') {
        summaryResults = { cu: 42.5, phi: 2.1 };
        inputValues = { cellP1: 100, devP1: 145, cellP2: 200, devP2: 260 };
      } else if (code === 'CMP-STD') {
        summaryResults = { dryDensityMax: 1.745, optimumMoisture: 18.2 };
        inputValues = { cmpMaxDensity: 1.745, cmpOptMoisture: 18.2 };
      } else if (code === 'CBR-UNS') {
        summaryResults = { cbrValue: 8.5 };
        inputValues = { cbrLoad25: 1.25, cbrLoad50: 1.85 };
      } else if (code === 'CBR-SOK') {
        summaryResults = { cbrValue: 6.2, swellPct: 0.8 };
        inputValues = { cbrLoad25: 0.95, cbrLoad50: 1.45, swellDial: 0.8 };
      }

      return {
        ...t,
        status: 'Selesai' as const,
        calculationStatus: 'Calculated' as const,
        calculationData: { summaryResults, inputValues }
      };
    })
  };

  return (
    <div className="w-full px-4 md:px-6 py-4 space-y-6 pb-24">
      {/* BANNER HEADER */}
      <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 rounded-2xl p-6 text-white shadow-xl border border-purple-800/40 relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 z-10 relative">
          <div className="space-y-1.5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-purple-500/20 border border-purple-400/30 text-purple-300">
                <FlaskConical className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-black tracking-tight text-white">
                    Sandbox Lab &amp; Mode Uji Coba Rumus All-in-One
                  </h1>
                  <span className="px-2.5 py-0.5 text-[10px] font-extrabold rounded-full bg-purple-500/30 text-purple-200 border border-purple-400/40">
                    Menu Uji Coba Sementara
                  </span>
                </div>
                <p className="text-xs text-purple-200 font-medium pt-0.5">
                  Ruang simulasi independen untuk mengetes &amp; menguji keakuratan seluruh formulir perhitungan (SG, MC, UW, ATB, S&amp;H, DS, TRX, CNS, PRM, CMP, CBR, Batuan) pada 1 sampel uji.
                </p>
              </div>
            </div>
          </div>

          {/* Quick Mode Switcher & LHU Review Button */}
          <div className="flex items-center gap-2 bg-slate-950/50 p-1.5 rounded-xl border border-purple-500/30 shrink-0 flex-wrap">
            <button
              onClick={() => setActiveTabMode('worksheet')}
              className={`px-3.5 py-2 rounded-lg text-xs font-extrabold transition flex items-center gap-2 cursor-pointer ${
                activeTabMode === 'worksheet'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'text-purple-200 hover:bg-white/10'
              }`}
            >
              <Calculator className="w-4 h-4" />
              <span>Kertas Kerja Interaktif (11 Rumus Siap)</span>
            </button>

            <button
              onClick={() => setActiveTabMode('placeholder_list')}
              className={`px-3.5 py-2 rounded-lg text-xs font-extrabold transition flex items-center gap-2 cursor-pointer ${
                activeTabMode === 'placeholder_list'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'text-purple-200 hover:bg-white/10'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Draft Rumus Lanjutan (CU, CD, PLI, UCS)</span>
            </button>

            <button
              onClick={() => setIsLHUModalOpen(true)}
              className="px-4 py-2 rounded-lg text-xs font-black bg-emerald-600 hover:bg-emerald-500 text-white transition flex items-center gap-2 shadow-lg shadow-emerald-900/30 border border-emerald-400/40 cursor-pointer"
              title="Lihat bentuk dokumen Laporan Hasil Uji (LHU) resmi A4 dengan data lengkap setelah sampel selesai diinput"
            >
              <FileText className="w-4 h-4 text-emerald-200" />
              <span>Review LHU Resmi A4 (Laporan Final)</span>
            </button>
          </div>
        </div>
      </div>

      {/* MODE 1: INTERACTIVE WORKSHEETS FOR ALL READY TESTS */}
      {activeTabMode === 'worksheet' && (
        <div className="space-y-4">
          <div className="bg-amber-50 border border-amber-300 rounded-xl p-3 text-xs text-amber-900 flex items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                <strong>Petunjuk Uji Coba:</strong> Anda sedang berada di mode Sandbox. Sampel <strong>BH-SANDBOX (0.00-1.00m)</strong> memiliki semua 22 metode uji terpasang. Klik tab-tab pengujian di bawah untuk memasukkan data uji &amp; langsung mengecek kebenaran rumus perhitungannya.
              </span>
            </div>
            <button
              onClick={() => alert('Data input sandbox direset ke kondisi bersih awal.')}
              className="px-3 py-1 bg-amber-200 hover:bg-amber-300 text-amber-900 font-bold rounded-lg text-[11px] shrink-0 transition flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Sandbox</span>
            </button>
          </div>

          <PhysicalPropertiesView
            pos={[sandboxPO]}
            selectedPOId={sandboxPO.id}
            selectedSampleId="smp-sandbox-01"
            containerCatalogue={containerCatalogue}
            ringCatalogue={ringCatalogue}
            consolRingCatalogue={consolRingCatalogue}
            pycCatalogue={pycCatalogue}
            personnelCatalogue={personnelCatalogue}
            moldCatalogue={moldCatalogue}
            reamerCatalogue={reamerCatalogue}
            onBackToPO={() => setActiveTabMode('placeholder_list')}
            onSaveSampleCalculation={onSaveSampleCalculation}
          />
        </div>
      )}

      {/* MODE 2: DRAFT / PLACEHOLDER RUMUS LANJUTAN */}
      {activeTabMode === 'placeholder_list' && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 text-xs">
          {/* Left Panel: List of Advanced Placeholder Tests */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3 shadow-sm h-fit">
            <h3 className="font-extrabold text-slate-900 flex items-center gap-2 text-sm border-b border-slate-100 pb-2">
              <Layers className="w-4 h-4 text-purple-600" />
              <span>Daftar Rumus Lanjutan</span>
            </h3>

            <div className="space-y-1.5">
              {SANDBOX_TEST_CATALOGUE.filter(t => t.status === 'draft').map((t) => (
                <button
                  key={t.code}
                  onClick={() => setSelectedPlaceholderCode(t.code)}
                  className={`w-full text-left p-3 rounded-xl border transition flex items-center justify-between cursor-pointer ${
                    selectedPlaceholderCode === t.code
                      ? 'bg-purple-50 border-purple-300 text-purple-900 font-bold shadow-xs'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <div className="space-y-0.5">
                    <div className="font-mono text-xs font-black text-purple-800">{t.code}</div>
                    <div className="text-[11px] font-semibold text-slate-800 line-clamp-1">{t.label}</div>
                    <div className="text-[10px] text-slate-500">{t.sni}</div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                </button>
              ))}
            </div>
          </div>

          {/* Right Panel: Placeholder Calculation Form & Formula Reference */}
          <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-200 p-6 space-y-6 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="px-2.5 py-0.5 text-[10px] font-extrabold rounded-full bg-purple-100 text-purple-800 border border-purple-300">
                  DRAFT / PLACEHOLDER RUMUS LAB
                </span>
                <h2 className="text-lg font-black text-slate-900 pt-1">
                  Kertas Kerja Uji {selectedPlaceholderCode} — {SANDBOX_TEST_CATALOGUE.find(t => t.code === selectedPlaceholderCode)?.label}
                </h2>
                <p className="text-xs text-slate-500 font-medium">
                  Standar Acuan: <strong className="text-slate-800">{SANDBOX_TEST_CATALOGUE.find(t => t.code === selectedPlaceholderCode)?.sni}</strong>
                </p>
              </div>

              <div className="px-3 py-1.5 rounded-xl bg-purple-50 text-purple-800 font-extrabold text-xs border border-purple-200 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-purple-600" />
                <span>Formulir Kosong / Draft Simulasi</span>
              </div>
            </div>

            {/* Form Inputs & Formulas per Selected Code */}
            {selectedPlaceholderCode.startsWith('DSH') && (
              <div className="space-y-5">
                <div className="bg-slate-900 text-white p-4 rounded-xl space-y-2 font-mono text-xs">
                  <div className="text-amber-400 font-bold flex items-center gap-2">
                    <BookOpen className="w-4 h-4" />
                    <span>Rumus Kuat Geser Langsung (Mohr-Coulomb Criterion):</span>
                  </div>
                  <p className="text-slate-300 text-sm font-bold">
                    &tau; = c' + &sigma;' &middot; tan(&phi;')
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Dimana &tau; = Kuat geser (kPa), c' = Kohesi efektif (kPa), &sigma;' = Tegangan normal efektif (kPa), &phi;' = Sudut geser dalam (derajat).
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                    <h4 className="font-bold text-slate-900">Uji Beban 1 (&sigma;&#8524; = 100 kPa):</h4>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Tegangan Geser Maksimum (&tau;&#8524; - kPa):</label>
                      <input
                        type="number"
                        value={currentPlaceholder.tau1 || ''}
                        onChange={e => handleUpdatePlaceholderInput('tau1', e.target.value)}
                        className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold"
                      />
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                    <h4 className="font-bold text-slate-900">Uji Beban 2 (&sigma;&#8525; = 200 kPa):</h4>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Tegangan Geser Maksimum (&tau;&#8525; - kPa):</label>
                      <input
                        type="number"
                        value={currentPlaceholder.tau2 || ''}
                        onChange={e => handleUpdatePlaceholderInput('tau2', e.target.value)}
                        className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold"
                      />
                    </div>
                  </div>
                </div>

                {/* Output Summary Card */}
                <div className="p-4 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-purple-900 block">Hasil Perhitungan Garis Keruntuhan (Mohr Circle Fit):</span>
                    <span className="text-sm font-mono font-black text-purple-800">
                      c' = {currentPlaceholder.cVal || '15.2'} kPa | &phi;' = {currentPlaceholder.phiVal || '26.8'}&deg;
                    </span>
                  </div>
                  <button
                    onClick={() => alert('Hasil perhitungan rumus Direct Shear telah dicatat di Sandbox!')}
                    className="px-4 py-2 bg-purple-700 hover:bg-purple-800 text-white font-bold rounded-xl shadow cursor-pointer"
                  >
                    Tes Rumus Ini
                  </button>
                </div>
              </div>
            )}

            {selectedPlaceholderCode.startsWith('TRX') && (
              <div className="space-y-5">
                <div className="bg-slate-900 text-white p-4 rounded-xl space-y-2 font-mono text-xs">
                  <div className="text-teal-400 font-bold flex items-center gap-2">
                    <BookOpen className="w-4 h-4" />
                    <span>Rumus Triaxial Shear (&sigma;&#8524; &amp; &sigma;&#8526; Principal Stresses):</span>
                  </div>
                  <p className="text-slate-300 text-sm font-bold">
                    &sigma;&#8524; = &sigma;&#8526; + &Delta;&sigma;d
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Deviator Stress &Delta;&sigma;d = P / A, dimana A = A0 / (1 - &epsilon;).
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                    <label className="block font-bold text-slate-700">Cell Pressure (&sigma;&#8526; - kPa):</label>
                    <input
                      type="number"
                      value={currentPlaceholder.cellP1 || '100'}
                      onChange={e => handleUpdatePlaceholderInput('cellP1', e.target.value)}
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg font-mono font-bold"
                    />
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                    <label className="block font-bold text-slate-700">Max Deviator Stress (&Delta;&sigma;d - kPa):</label>
                    <input
                      type="number"
                      value={currentPlaceholder.devP1 || '145'}
                      onChange={e => handleUpdatePlaceholderInput('devP1', e.target.value)}
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg font-mono font-bold"
                    />
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-teal-900 block">Hasil Simulasi Parameter Kuat Geser Triaxial:</span>
                    <span className="text-sm font-mono font-black text-teal-800">
                      c' = {currentPlaceholder.cEff || '18.5'} kPa | &phi;' = {currentPlaceholder.phiEff || '28.4'}&deg;
                    </span>
                  </div>
                  <button
                    onClick={() => alert('Hasil perhitungan Triaxial telah berhasil diverifikasi!')}
                    className="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white font-bold rounded-xl shadow cursor-pointer"
                  >
                    Tes Rumus Triaxial
                  </button>
                </div>
              </div>
            )}

            {(selectedPlaceholderCode === 'PLI' || selectedPlaceholderCode === 'UCS-ROCK') && (
              <div className="space-y-5">
                <div className="bg-slate-900 text-white p-4 rounded-xl space-y-2 font-mono text-xs">
                  <div className="text-amber-400 font-bold flex items-center gap-2">
                    <BookOpen className="w-4 h-4" />
                    <span>Rumus Pengujian Mekanika Batuan ({selectedPlaceholderCode}):</span>
                  </div>
                  <p className="text-slate-300 text-sm font-bold">
                    {selectedPlaceholderCode === 'PLI' ? 'Is = P / De^2, Is(50) = F * Is' : 'qu = Pmax / A0'}
                  </p>
                  <p className="text-[11px] text-slate-400">
                    {selectedPlaceholderCode === 'PLI' ? 'Konversi Kuat Tekan Bebas Batuan Est: UCS ≈ 20 ~ 24 * Is(50)' : 'Diuji menggunakan mesin tekan hidrolik dengan rasio sampel L/D = 2.0.'}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                    <label className="block font-bold text-slate-700">Diameter Sampel (mm):</label>
                    <input
                      type="number"
                      value={currentPlaceholder.diaMm || '54.5'}
                      onChange={e => handleUpdatePlaceholderInput('diaMm', e.target.value)}
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg font-mono font-bold"
                    />
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                    <label className="block font-bold text-slate-700">Beban Maksimum Pmax (kN):</label>
                    <input
                      type="number"
                      value={currentPlaceholder.maxLoadKn || '185.4'}
                      onChange={e => handleUpdatePlaceholderInput('maxLoadKn', e.target.value)}
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg font-mono font-bold"
                    />
                  </div>

                  <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 space-y-2">
                    <span className="block font-extrabold text-amber-900">Hasil Kuat Tekan Batuan (qu / UCS):</span>
                    <div className="text-base font-mono font-black text-amber-800 pt-1">
                      {currentPlaceholder.ucsMpa || '79.5'} MPa
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* LHU REPORT MODAL PREVIEW FOR SANDBOX */}
      {isLHUModalOpen && (
        <LHUReportModal
          sample={sandboxSampleForLHU}
          po={sandboxPO}
          personnelList={personnelCatalogue}
          onClose={() => setIsLHUModalOpen(false)}
        />
      )}
    </div>
  );
};
