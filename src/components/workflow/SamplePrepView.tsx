import React, { useState, useRef } from 'react';
import { SamplePrepReport, SamplePrepItem, SamplePrepPairPhoto, SampleReceipt, SampleConditionStatus, Quotation } from '../../types/workflowTypes';
import { PurchaseOrder, PersonnelItem } from '../../types';
import { CompanyProfile, DEFAULT_COMPANY_PROFILE } from '../../types/companyProfileTypes';
import { Scissors, Plus, Printer, CheckCircle2, AlertTriangle, X, Image as ImageIcon, ArrowRight, ArrowUpRight, Edit3, Trash2, Link, Camera, ChevronDown, FlaskConical, PackageX, Truck, SlidersHorizontal, FileSpreadsheet, Upload, Download } from 'lucide-react';
import { getNextDocNo } from '../../utils/docNumbering';
import { parseSoilLabExcel, downloadSampleImportTemplate } from '../../utils/excelParser';

const DAYS_INDO = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const MONTHS_INDO = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

export interface SamplePrepViewProps {
  reports: SamplePrepReport[];
  sampleReceipts?: SampleReceipt[];
  quotations?: Quotation[];
  pos?: PurchaseOrder[];
  personnelCatalogue?: PersonnelItem[];
  companyProfile?: CompanyProfile;
  onSaveReport: (report: SamplePrepReport) => void;
  onDeleteReport: (id: string) => void;
  onOpenSubcontractTrigger?: (report: SamplePrepReport) => void;
  onSyncToPO?: (report: SamplePrepReport) => void;
}

// Master daftar parameter uji lengkap sesuai SNI & Kode Dokumen LHU Lab
export const ALL_TEST_KEYS: { key: keyof SamplePrepItem['testEligible']; label: string }[] = [
  { key: 'UW', label: 'UW' },
  { key: 'MC', label: 'MC' },
  { key: 'SG', label: 'SG' },
  { key: 'BD', label: 'BD' },
  { key: 'ATB', label: 'ATB' },
  { key: 'SieveHydro', label: 'Sieve-Hydro' },
  { key: 'Proctor_Std', label: 'CMP-STD' },
  { key: 'Proctor_Mod', label: 'CMP-MOD' },
  { key: 'Permeability', label: 'PB' },
  { key: 'Consolidation', label: 'CT' },
  { key: 'UCT', label: 'UCT' },
  { key: 'DS_UU', label: 'DS-UU' },
  { key: 'DS_CU', label: 'DS-CU' },
  { key: 'DS_CD', label: 'DS-CD' },
  { key: 'DS_Res', label: 'DS-CDR' },
  { key: 'TRX_UU', label: 'TRX-UU' },
  { key: 'TRX_CU', label: 'TRX-CU' },
  { key: 'TRX_CD', label: 'TRX-CD' },
  { key: 'CBR_Unsoaked', label: 'CBR-UNS' },
  { key: 'CBR_Soaked', label: 'CBR-SOK' },
  { key: 'PointLoad', label: 'PointLoad' },
  { key: 'UCS_Rock', label: 'UCS-Rock' },
];

// ─── Label & Style per kondisi sampel ────────────────────────────────────────
const CONDITION_CONFIG: Record<SampleConditionStatus, { label: string; color: string; bg: string; border: string; icon: React.ReactNode }> = {
  NORMAL:       { label: 'Normal (Dapat Diuji)',      color: 'text-emerald-800', bg: 'bg-emerald-50',  border: 'border-emerald-300', icon: null },
  ROCK:         { label: 'Sampel Batuan',              color: 'text-stone-800',   bg: 'bg-stone-100',   border: 'border-stone-400',   icon: null },
  INSUFFICIENT: { label: 'Sampel Tidak Cukup',        color: 'text-red-800',     bg: 'bg-red-50',      border: 'border-red-300',     icon: null },
  SUBCONTRACT:  { label: 'Lempar ke Lab Rekanan',     color: 'text-amber-800',   bg: 'bg-amber-50',    border: 'border-amber-300',   icon: null },
  UNTESTED:     { label: 'Tidak Diuji',                color: 'text-slate-800',   bg: 'bg-slate-100',   border: 'border-slate-300',   icon: null },
};

// Helper untuk menghitung ketebalan (Thickness) dari selisih kedalaman (Depth): Max - Min
export const calculateThicknessFromDepth = (depthStr: string): number => {
  if (!depthStr || !depthStr.includes('-')) return 0;
  const parts = depthStr.replace(/,/g, '.').split('-');
  if (parts.length >= 2) {
    const p1 = parts[0].replace(/[^\d.]/g, '').trim();
    const p2 = parts[1].replace(/[^\d.]/g, '').trim();
    if (p1 !== '' && p2 !== '') {
      const d1 = parseFloat(p1);
      const d2 = parseFloat(p2);
      if (!isNaN(d1) && !isNaN(d2)) {
        return Math.round(Math.abs(d2 - d1) * 100) / 100;
      }
    }
  }
  return 0;
};

export const SamplePrepView: React.FC<SamplePrepViewProps> = ({
  reports,
  sampleReceipts = [],
  quotations = [],
  pos = [],
  personnelCatalogue = [],
  companyProfile = DEFAULT_COMPANY_PROFILE,
  onSaveReport,
  onDeleteReport,
  onOpenSubcontractTrigger,
  onSyncToPO
}) => {
  const [selectedReport, setSelectedReport] = useState<SamplePrepReport | null>(null);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingReportId, setEditingReportId] = useState<string | null>(null);

  // Form dirty state & unsaved modal
  const [isFormDirty, setIsFormDirty] = useState(false);
  const [showUnsavedConfirm, setShowUnsavedConfirm] = useState(false);

  // Selector & filter parameter uji manual
  const [manualActiveTestKeys, setManualActiveTestKeys] = useState<Record<string, boolean>>({});
  const [isTestSelectorOpen, setIsTestSelectorOpen] = useState(false);

  // Excel Upload state & ref
  const [isExcelImporting, setIsExcelImporting] = useState(false);
  const excelFileInputRef = useRef<HTMLInputElement | null>(null);

  const handlePrepExcelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsExcelImporting(true);
    try {
      const res = await parseSoilLabExcel(file);
      if (res.samples && res.samples.length > 0) {
        setIsFormDirty(true);
        // Mengambil HANYA data sampel (Sample Code, Depth, dan Jenis Uji Angka 1)
        // Metadata header Excel (Tanggal, PO, Project, Client) diabaikan.

        const importedFromExcel: SamplePrepItem[] = res.samples.map((s, idx) => {
          const depthStr = s.rawDepthStr || (s.depthStart !== undefined && s.depthEnd !== undefined ? `${s.depthStart.toFixed(2)} - ${s.depthEnd.toFixed(2)} m` : '');
          const thicknessM = calculateThicknessFromDepth(depthStr);
          const testCodes = (s.testCodesToAssign || []).map(c => c.toUpperCase());
          const has = (kw: string) => testCodes.some(c => c.includes(kw));

          return {
            id: `prep-excel-${Date.now()}-${idx}`,
            sampleCode: s.sampleCode,
            depthStr,
            thicknessM,
            recoveryM: 0, // Dikosongkan agar diisi manual oleh pengguna
            recoveryPct: 0,
            testEligible: {
              UW: has('UW') || has('UNIT WEIGHT') || has('BERAT VOLUME') || has('BERAT ISI'),
              MC: has('MC') || has('MOISTURE') || has('KADAR AIR'),
              SG: has('SG') || has('SPECIFIC GRAVITY') || has('BERAT JENIS'),
              BD: has('BD') || has('BULK DENSITY') || has('KEPADATAN'),
              ATB: has('ATB') || has('ATT') || has('ATTERBERG') || has('LIQUID LIMIT') || has('BATAS CAIR'),
              SieveHydro: has('SIEVE') || has('SVE') || has('HYD') || has('S&H') || has('AYAKAN') || has('GRADASI'),
              Proctor_Std: has('CMP-STD') || has('CMP-S') || has('PROCTOR_STD') || has('STANDARD PROCTOR'),
              Proctor_Mod: has('CMP-MOD') || has('CMP-M') || has('PROCTOR_MOD') || has('MODIFIED PROCTOR'),
              Permeability: has('PERM') || has('PRM') || has('PFH') || has('PERMEABILITAS') || has('FALLING HEAD'),
              Consolidation: has('CT') || has('CNS') || has('CONSOL') || has('KONSOLIDASI') || has('OEDOMETER'),
              UCT: has('UCT') || has('UNCONFINED') || has('BEBAS') || has('UCS'),
              DS_UU: has('DS-UU') || has('DS_UU') || has('DS UU') || has('DIRECT SHEAR UU') || has('GESER LANGSUNG UU'),
              DS_CU: has('DS-CU') || has('DS_CU') || has('DS CU') || has('DIRECT SHEAR CU') || has('GESER LANGSUNG CU'),
              DS_CD: has('DS-CD') || has('DS_CD') || has('DS CD') || has('DIRECT SHEAR CD') || has('GESER LANGSUNG CD'),
              DS_Res: has('DS-RES') || has('DS_RES') || has('RESIDUAL') || has('CD RESID'),
              TRX_UU: has('TRX-UU') || has('TRX_UU') || has('TRX UU') || has('TRIAXIAL UU'),
              TRX_CU: has('TRX-CU') || has('TRX_CU') || has('TRX CU') || has('TRIAXIAL CU'),
              TRX_CD: has('TRX-CD') || has('TRX_CD') || has('TRX CD') || has('TRIAXIAL CD'),
              CBR_Unsoaked: has('CBR-U') || has('CBR-UNS') || has('CBR UNSOAKED'),
              CBR_Soaked: has('CBR-S') || has('CBR-SOK') || has('CBR SOAKED'),
              PointLoad: has('POINTLOAD') || has('POINT LOAD') || has('PLI'),
              UCS_Rock: has('UCS_ROCK') || has('UNIAXIAL') || has('BATUAN')
            },
            status: 'PASS_FULL',
            sampleCondition: 'NORMAL',
            description: '-',
            photoBeforeUrl: '',
            photoAfterUrl: '',
          };
        });

        setFormItems(importedFromExcel);
      } else {
        alert('Tidak ditemukan baris sampel valid di dalam file Excel. Pastikan mengisi kolom Sample Initial.');
      }
    } catch (err) {
      console.error(err);
      alert('Gagal membaca file Excel. Pastikan format file .xlsx atau .csv yang valid.');
    } finally {
      setIsExcelImporting(false);
      e.target.value = '';
    }
  };

  // Form State
  const [formNo, setFormNo] = useState('');
  const [formPoNo, setFormPoNo] = useState('');
  const [formRawDate, setFormRawDate] = useState('');
  const [formDay, setFormDay] = useState('');
  const [formDateStr, setFormDateStr] = useState('');
  const [formClient, setFormClient] = useState('');
  const [formProject, setFormProject] = useState('');
  const [formInspector, setFormInspector] = useState('AS Sumartadji');
  const [linkedReceiptId, setLinkedReceiptId] = useState<string>('');

  const [formItems, setFormItems] = useState<SamplePrepItem[]>([]);
  const [formPhotos, setFormPhotos] = useState<SamplePrepPairPhoto[]>([]);

  // Ref map for photo file inputs: key = `${itemId}-before` or `${itemId}-after`
  const photoInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const handleDateInputChange = (isoDate: string) => {
    setIsFormDirty(true);
    setFormRawDate(isoDate);
    if (!isoDate) return;
    const d = new Date(isoDate);
    if (isNaN(d.getTime())) return;

    const dayName = DAYS_INDO[d.getDay()];
    const dayNum = d.getDate();
    const monthName = MONTHS_INDO[d.getMonth()];
    const yearNum = d.getFullYear();

    setFormDay(dayName);
    setFormDateStr(`${dayNum} ${monthName} ${yearNum}`);
  };

  const openNewForm = () => {
    setEditingReportId(null);
    setIsFormDirty(false);
    setShowUnsavedConfirm(false);
    setManualActiveTestKeys({});
    const nextNo = getNextDocNo('BA-PP', reports.map(r => r.prepReportNo));
    setFormNo(nextNo);
    setFormPoNo('');
    const todayIso = new Date().toISOString().split('T')[0];
    handleDateInputChange(todayIso);
    setFormClient('');
    setFormProject('');
    setFormInspector('');
    setLinkedReceiptId('');
    setFormItems([]);
    setFormPhotos([]);
    setIsFormModalOpen(true);
    setIsFormDirty(false);
  };

  // Helper untuk mengekstrak parameter uji yang terdaftar dari Surat Penawaran / PO per-sampel
  const extractTestEligibleFromOrder = (poCodeInput?: string, clientInput?: string, projectInput?: string, sampleCode?: string): SamplePrepTestEligible => {
    const poCode = (poCodeInput || '').trim().toLowerCase();
    const client = (clientInput || '').trim().toLowerCase();
    const project = (projectInput || '').trim().toLowerCase();

    const foundTestStrings: string[] = [];

    // 1. Cari Purchase Order (PO) yang cocok di pos
    const matchedPO = pos.find(p => {
      const pPo = (p.poNumber || '').trim().toLowerCase();
      const pClient = (p.clientName || '').trim().toLowerCase();
      return (poCode && pPo === poCode) || (client && (pClient.includes(client) || client.includes(pClient)));
    });

    // Jika ada PO dan KODE SAMPEL spesifik yang cocok, ambil pengujian khusus untuk sampel tersebut
    if (matchedPO && matchedPO.samples && sampleCode) {
      const cleanCode = sampleCode.trim().toLowerCase();
      const targetSample = matchedPO.samples.find(s => {
        const sCode = s.sampleCode.trim().toLowerCase();
        return sCode === cleanCode || sCode.includes(cleanCode) || cleanCode.includes(sCode);
      });

      if (targetSample && targetSample.tests && targetSample.tests.length > 0) {
        targetSample.tests.forEach(t => {
          if (t.testTypeCode) foundTestStrings.push(t.testTypeCode.toUpperCase());
          if (t.testTypeName) foundTestStrings.push(t.testTypeName.toUpperCase());
        });
      }
    }

    // 2. Jika pengujian per-sampel belum ditemukan, gunakan daftar uji dari Surat Penawaran (Quotation)
    if (foundTestStrings.length === 0) {
      const matchedQuo = quotations.find(q => {
        const qPo = (q.poNumber || '').trim().toLowerCase();
        const qClient = (q.clientName || '').trim().toLowerCase();
        const qProject = (q.projectName || '').trim().toLowerCase();
        return (poCode && (qPo === poCode || poCode.includes(qPo) || qPo.includes(poCode))) || 
               (client && (client.includes(qClient) || qClient.includes(client))) || 
               (project && qProject.includes(project));
      });

      if (matchedQuo && matchedQuo.items) {
        matchedQuo.items.forEach(item => {
          if (item.testCode) foundTestStrings.push(item.testCode.toUpperCase());
          if (item.testName) foundTestStrings.push(item.testName.toUpperCase());
        });
      }
    }

    // 3. Jika ditemukan data pengujian dari Penawaran/PO, buatkan status kelayakan yang presisi & 100% mandiri
    if (foundTestStrings.length > 0) {
      const matches = (predicate: (s: string) => boolean) => foundTestStrings.some(str => predicate(str.trim().toUpperCase()));

      return {
        UW: matches(s => s === 'UW' || s.startsWith('UW-') || s.startsWith('UW ') || s.includes('UNIT WEIGHT') || s.includes('BERAT VOLUME') || s.includes('BERAT ISI')),
        MC: matches(s => s === 'MC' || s.startsWith('MC-') || s.startsWith('MC ') || s.includes('MOISTURE') || s.includes('KADAR AIR')),
        SG: matches(s => s === 'SG' || s.startsWith('SG-') || s.startsWith('SG ') || s.includes('SPECIFIC GRAVITY') || s.includes('BERAT JENIS')),
        BD: matches(s => s === 'BD' || s.startsWith('BD-') || s.startsWith('BD ') || s.includes('BULK DENSITY') || s.includes('KEPADATAN')),
        ATB: matches(s => s === 'ATB' || s === 'ATT' || s.includes('ATTERBERG') || s.includes('LIQUID LIMIT') || s.includes('BATAS CAIR')),
        SieveHydro: matches(s => s === 'SVE' || s === 'HYD' || s === 'S&H' || s.includes('SIEVE') || s.includes('GRADASI') || s.includes('SARINGAN') || s.includes('AYAKAN')),
        Proctor_Std: matches(s => s === 'CMP-STD' || s === 'CMP-S' || s.includes('STANDARD PROCTOR') || s.includes('KEPADATAN RINGAN')),
        Proctor_Mod: matches(s => s === 'CMP-MOD' || s === 'CMP-M' || s.includes('MODIFIED PROCTOR') || s.includes('KEPADATAN BERAT')),
        Permeability: matches(s => s === 'PRM' || s === 'PERM' || s === 'PFH' || s.includes('PERMEABILITAS') || s.includes('FALLING HEAD')),
        Consolidation: matches(s => s === 'CT' || s === 'CNS' || s.startsWith('CT-') || s.startsWith('CT ') || s.includes('CONSOL') || s.includes('KONSOLIDASI') || s.includes('OEDOMETER')),
        UCT: matches(s => s === 'UCT' || s.startsWith('UCT-') || s.startsWith('UCT ') || s.includes('UNCONFINED') || s.includes('TEKAN BEBAS')),
        DS_UU: matches(s => s === 'DS-UU' || s === 'DS_UU' || s === 'DS UU' || (s.includes('DIRECT SHEAR') && s.includes('UU')) || (s.includes('GESER LANGSUNG') && s.includes('UU'))),
        DS_CU: matches(s => s === 'DS-CU' || s === 'DS_CU' || s === 'DS CU' || (s.includes('DIRECT SHEAR') && s.includes('CU')) || (s.includes('GESER LANGSUNG') && s.includes('CU'))),
        DS_CD: matches(s => s === 'DS-CD' || s === 'DS_CD' || s === 'DS CD' || (s.includes('DIRECT SHEAR') && s.includes('CD')) || (s.includes('GESER LANGSUNG') && s.includes('CD'))),
        DS_Res: matches(s => s === 'DS-RES' || s === 'DS_RES' || s.includes('RESIDUAL') || s.includes('CD RESID')),
        TRX_UU: matches(s => s === 'TRX-UU' || s === 'TRX_UU' || s === 'TRX UU' || (s.includes('TRIAXIAL') && s.includes('UU'))),
        TRX_CU: matches(s => s === 'TRX-CU' || s === 'TRX_CU' || s === 'TRX CU' || (s.includes('TRIAXIAL') && s.includes('CU'))),
        TRX_CD: matches(s => s === 'TRX-CD' || s === 'TRX_CD' || s === 'TRX CD' || (s.includes('TRIAXIAL') && s.includes('CD'))),
        CBR_Unsoaked: matches(s => s === 'CBR-U' || s === 'CBR-UNS' || s.includes('CBR UNSOAKED') || (s.includes('CBR') && s.includes('UNSOAKED'))),
        CBR_Soaked: matches(s => s === 'CBR-S' || s === 'CBR-SOK' || s.includes('CBR SOAKED') || (s.includes('CBR') && s.includes('SOAKED'))),
        PointLoad: matches(s => s === 'POINTLOAD' || s === 'PLI' || s.includes('POINT LOAD')),
        UCS_Rock: matches(s => s === 'UCS_ROCK' || s === 'UCS-ROCK' || s.includes('BATUAN'))
      };
    }

    return {};
  };

  const handleTableInputKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    fieldPrefix: string,
    rowIndex: number
  ) => {
    if (e.key === 'Enter' || e.key === 'ArrowDown') {
      e.preventDefault();
      if (rowIndex < formItems.length - 1) {
        const nextInput = document.getElementById(`${fieldPrefix}-${rowIndex + 1}`) as HTMLInputElement;
        if (nextInput) {
          nextInput.focus();
          nextInput.select();
        }
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (rowIndex > 0) {
        const prevInput = document.getElementById(`${fieldPrefix}-${rowIndex - 1}`) as HTMLInputElement;
        if (prevInput) {
          prevInput.focus();
          prevInput.select();
        }
      }
    }
  };

  const handleSelectLinkedReceipt = (receiptId: string) => {
    setIsFormDirty(true);
    setLinkedReceiptId(receiptId);
    const receipt = sampleReceipts.find(r => r.id === receiptId);
    if (!receipt) return;

    setFormClient(receipt.clientName);
    setFormProject(receipt.projectName);
    setFormPoNo(receipt.projectCode || '');

    // Auto Import Sample List dari Tanda Terima Sampel (BATT)
    // Tampilkan kolom uji sesuai Penawaran di header, tapi KOSONGKAN semua ceklis (false) per baris sampel
    const orderTests = extractTestEligibleFromOrder(receipt.projectCode, receipt.clientName, receipt.projectName);
    setManualActiveTestKeys(orderTests);

    const importedItems: SamplePrepItem[] = (receipt.items || []).map((rItem, idx) => {
      const depthStr = rItem.depthRange || '';
      const thicknessM = calculateThicknessFromDepth(depthStr);

      return {
        id: `prep-${Date.now()}-${idx}`,
        sampleCode: rItem.sampleCode,
        depthStr,
        thicknessM,
        recoveryM: 0,
        recoveryPct: 0,
        testEligible: {}, // Dikosongkan (semua unchecked) agar diisi manual per sampel
        status: 'PASS_FULL',
        sampleCondition: 'NORMAL',
        description: '-',
        photoBeforeUrl: '',
        photoAfterUrl: '',
      };
    });

    setFormItems(importedItems);
  };

  const openEditForm = (rep: SamplePrepReport) => {
    setEditingReportId(rep.id);
    setIsFormDirty(false);
    setShowUnsavedConfirm(false);
    setManualActiveTestKeys({});
    setFormNo(rep.prepReportNo);
    setFormPoNo(rep.poNumber);
    setFormDateStr(rep.date);
    setFormDay(rep.dayName || 'Senin');
    setFormClient(rep.clientName);
    setFormProject(rep.projectName);
    setFormInspector(rep.inspectorName || 'AS Sumartadji');
    setFormItems(rep.items || []);
    setFormPhotos(rep.photos || []);
    setIsFormModalOpen(true);
    setIsFormDirty(false);
  };

  const handleAddItem = () => {
    setIsFormDirty(true);
    const newItem: SamplePrepItem = {
      id: Date.now().toString(),
      sampleCode: '',
      depthStr: '0.00-0.50',
      thicknessM: 0.50,
      recoveryM: 0,
      recoveryPct: 0,
      testEligible: {}, // Dikosongkan (unchecked) agar diisi manual per sampel
      status: 'PASS_FULL',
      sampleCondition: 'NORMAL',
      description: '-',
      photoBeforeUrl: '',
      photoAfterUrl: '',
    };
    setFormItems([...formItems, newItem]);
  };

  const handleUpdateItem = (index: number, field: keyof SamplePrepItem, val: any) => {
    setIsFormDirty(true);
    const updated = [...formItems];
    const item = { ...updated[index], [field]: val };
    
    // Hitung Thickness otomatis dari selisih Depth: Max - Min
    if (field === 'depthStr') {
      const calcTh = calculateThicknessFromDepth(val);
      item.thicknessM = calcTh;
    }

    if (field === 'thicknessM' || field === 'recoveryM' || field === 'depthStr') {
      const th = parseFloat(String(item.thicknessM || '').replace(',', '.')) || 0;
      const recRaw = String(item.recoveryM !== undefined && item.recoveryM !== null ? item.recoveryM : '').replace(',', '.').trim();
      const rec = parseFloat(recRaw);
      item.recoveryPct = th > 0 && !isNaN(rec) && recRaw !== '' ? Math.round((rec / th) * 100) : 0;
    }

    // Otomatis atur status & highlight berdasarkan kondisi sampel
    if (field === 'sampleCondition') {
      const cond = val as SampleConditionStatus;
      if (cond === 'ROCK' || cond === 'INSUFFICIENT' || cond === 'UNTESTED') {
        item.isRockHighlight = true;
        item.status = 'REJECTED';
      } else if (cond === 'SUBCONTRACT') {
        item.isRockHighlight = true;
        item.status = 'FAIL_SUBCONTRACT';
      } else {
        item.isRockHighlight = false;
        item.status = 'PASS_FULL';
      }
    }

    // Backward compat: description still triggers highlight
    if (field === 'description') {
      const descLower = (val || '').toLowerCase();
      if (descLower.includes('tidak di uji') || descLower.includes('batuan') || descLower.includes('gagal')) {
        item.isRockHighlight = true;
        item.status = 'REJECTED';
      }
    }

    updated[index] = item;
    setFormItems(updated);
  };

  const handleToggleEligible = (index: number, testKey: keyof SamplePrepItem['testEligible']) => {
    setIsFormDirty(true);
    const updated = [...formItems];
    const item = { ...updated[index] };
    const eligible = { ...(item.testEligible || {}) };
    const details = { ...(item.testStatusDetails || {}) };

    const isCurrentlyActive = !!eligible[testKey];
    if (isCurrentlyActive) {
      eligible[testKey] = false;
      delete details[testKey as string];
    } else {
      eligible[testKey] = true;
      details[testKey as string] = { status: 'PASS' };
    }

    item.testEligible = eligible;
    item.testStatusDetails = details;
    updated[index] = item;
    setFormItems(updated);
  };

  const handleSetTestCellStatus = (index: number, testKey: string, status: TestCellStatus) => {
    setIsFormDirty(true);
    const updated = [...formItems];
    const item = { ...updated[index] };
    const eligible = { ...(item.testEligible || {}) };
    const details = { ...(item.testStatusDetails || {}) };

    if (status === 'CANCEL') {
      eligible[testKey as keyof SamplePrepTestEligible] = false;
      delete details[testKey];
    } else {
      eligible[testKey as keyof SamplePrepTestEligible] = true;
      details[testKey] = { status };
    }

    item.testEligible = eligible;
    item.testStatusDetails = details;
    updated[index] = item;
    setFormItems(updated);
  };

  const handleRemoveItem = (index: number) => {
    setIsFormDirty(true);
    setFormItems(formItems.filter((_, i) => i !== index));
  };

  // ─── Handle upload foto per sampel ───────────────────────────────────────
  const handlePhotoUpload = (itemId: string, side: 'before' | 'after', file: File) => {
    setIsFormDirty(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setFormItems(prev => prev.map(it => {
        if (it.id !== itemId) return it;
        return side === 'before'
          ? { ...it, photoBeforeUrl: dataUrl }
          : { ...it, photoAfterUrl: dataUrl };
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleAttemptCloseForm = () => {
    if (isFormDirty) {
      setShowUnsavedConfirm(true);
    } else {
      setIsFormModalOpen(false);
    }
  };

  const handleSaveForm = () => {
    const prepCount = formItems.filter(i => !i.isRockHighlight && i.status !== 'REJECTED' && i.status !== 'FAIL_SUBCONTRACT').length;
    const newRep: SamplePrepReport = {
      id: editingReportId || `bap-${Date.now()}`,
      prepReportNo: formNo,
      date: formDateStr,
      dayName: formDay,
      poNumber: formPoNo,
      clientName: formClient,
      projectName: formProject,
      numSampleReceived: formItems.length,
      numSamplePrep: prepCount,
      items: formItems,
      photos: formPhotos,
      inspectorName: formInspector,
      status: prepCount < formItems.length ? 'Requires_Subcontract_Action' : 'Completed'
    };
    onSaveReport(newRep);
    setIsFormDirty(false);
    setShowUnsavedConfirm(false);
    setIsFormModalOpen(false);
  };

  const handleDeleteRep = (rep: SamplePrepReport) => {
    if (confirm(`Apakah Anda yakin ingin menghapus Berita Acara Preparasi No. "${rep.prepReportNo}"?`)) {
      if (onDeleteReport) {
        onDeleteReport(rep.id);
      }
    }
  };

  // Helper sums for PDF table footer
  const countEligible = (items: SamplePrepItem[], key: keyof SamplePrepItem['testEligible']) => {
    return items.filter(i => i.testEligible && i.testEligible[key]).length;
  };

  return (
    <div className="w-full max-w-full px-4 sm:px-6 py-4 space-y-4 text-slate-800">
      {/* HEADER BANNER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200 w-fit mb-1.5">
            <span>TAHAP 3 OPERASIONAL LAB (ISO 17025)</span>
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
             Berita Acara Preparasi Sampel &amp; Lampiran Foto Inspeksi
          </h2>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Pembukaan tabung, evaluasi kelayakan parameter uji, status kondisi sampel (Normal / Batuan / Tidak Cukup / Subkontrak), dan foto Before &amp; After per sampel.
          </p>
        </div>

        <button
          onClick={openNewForm}
          className="px-4 py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-2 transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Buat BA Preparasi Baru</span>
        </button>
      </div>

      {/* REPORTS LIST TABLE */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
          <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
            <Scissors className="w-4 h-4 text-amber-600" />
            <span>Daftar Berita Acara Preparasi Sampel ({reports.length})</span>
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-slate-100/80 text-slate-700 font-bold border-b border-slate-200">
                <th className="py-3 px-4">No. BA Preparasi</th>
                <th className="py-3 px-4">Tgl &amp; No. PO</th>
                <th className="py-3 px-4">Klien &amp; Proyek</th>
                <th className="py-3 px-4 text-center">Jumlah Sampel Received / Prep</th>
                <th className="py-3 px-4 text-center">Status Kelayakan</th>
                <th className="py-3 px-4 text-center">Aksi &amp; Operasi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {reports.map((rep) => {
                const specialCount = rep.items.filter(i =>
                  i.sampleCondition === 'ROCK' || i.sampleCondition === 'INSUFFICIENT' || i.sampleCondition === 'SUBCONTRACT' ||
                  i.status === 'REJECTED' || i.status === 'FAIL_SUBCONTRACT' || i.isRockHighlight ||
                  (i.description || '').toLowerCase().includes('tidak di uji')
                ).length;
                const subcontractCount = rep.items.filter(i => i.sampleCondition === 'SUBCONTRACT' || i.status === 'FAIL_SUBCONTRACT').length;
                return (
                  <tr key={rep.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4 font-bold font-mono text-amber-900">{rep.prepReportNo}</td>
                    <td className="py-3 px-4 font-mono text-slate-600">
                      <div>{rep.date}</div>
                      <div className="text-[11px] text-slate-500">PO: {rep.poNumber}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{rep.clientName}</div>
                      <div className="text-[11px] text-slate-500">{rep.projectName}</div>
                    </td>
                    <td className="py-3 px-4 text-center font-mono font-bold text-slate-700">
                      {rep.numSampleReceived || rep.items.length} / {rep.numSamplePrep || rep.items.filter(i => !i.isRockHighlight).length} Sampel
                    </td>
                    <td className="py-3 px-4 text-center">
                      {specialCount > 0 ? (
                        <span className="px-2.5 py-1 text-[10px] font-extrabold rounded-full bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1 w-fit mx-auto">
                          <AlertTriangle className="w-3 h-3 text-amber-600" />
                          <span>{specialCount} Sampel Ada Catatan</span>
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 text-[10px] font-extrabold rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1 w-fit mx-auto">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>Lolos Uji Penuh</span>
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center space-x-1.5">
                      <button
                        onClick={() => { setSelectedReport(rep); setIsPreviewModalOpen(true); }}
                        className="px-2.5 py-1.5 bg-blue-900 hover:bg-blue-800 text-white rounded-lg text-[11px] font-bold inline-flex items-center gap-1 transition cursor-pointer"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Cetak PDF</span>
                      </button>

                      {subcontractCount > 0 && (
                        <button
                          onClick={() => onOpenSubcontractTrigger(rep)}
                          className="px-2.5 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-[11px] font-bold inline-flex items-center gap-1 transition cursor-pointer"
                        >
                          <span>Subkontrak</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      )}

                      <button
                        onClick={() => openEditForm(rep)}
                        className="p-1.5 bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 rounded-lg text-[11px] font-bold inline-flex items-center gap-1 transition cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Edit</span>
                      </button>

                      {onSyncToPO && (
                        <button
                          onClick={() => onSyncToPO(rep)}
                          title={rep.syncedToPoId ? `Sudah di-sync ke PO (${rep.poNumber}). Klik untuk sync ulang / tambah sampel baru.` : 'Generate sampel & uji ke menu PO Management dari BA Preparasi ini'}
                          className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold inline-flex items-center gap-1 transition cursor-pointer ${
                            rep.syncedToPoId
                              ? 'bg-emerald-100 hover:bg-emerald-200 text-emerald-800 border border-emerald-300'
                              : 'bg-indigo-600 hover:bg-indigo-500 text-white border border-indigo-700'
                          }`}
                        >
                          <ArrowUpRight className="w-3.5 h-3.5" />
                          <span>{rep.syncedToPoId ? '✓ Synced ke PO' : 'Sync ke PO'}</span>
                        </button>
                      )}

                      <button
                        onClick={() => handleDeleteRep(rep)}
                        className="p-1.5 bg-red-100 hover:bg-red-200 text-red-700 border border-red-300 rounded-lg text-[11px] font-bold inline-flex items-center gap-1 transition cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Hapus</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* FORM CREATE / EDIT MODAL */}
      {isFormModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 w-full max-w-7xl max-h-[94vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-4 bg-slate-900 text-white flex justify-between items-center border-b border-slate-800">
              <h3 className="font-extrabold text-sm flex items-center gap-2">
                <Scissors className="w-4 h-4 text-amber-400" />
                <span>{editingReportId ? 'Edit Berita Acara Preparasi' : 'Input Berita Acara Preparasi Baru'}</span>
              </h3>
              <button onClick={handleAttemptCloseForm} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-5 overflow-y-auto text-xs">
              
              {/* LINK FROM BATT DROPDOWN */}
              {sampleReceipts.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 font-bold text-amber-900">
                    <Link className="w-4 h-4 text-amber-600" />
                    <span>Hubungkan dengan Tanda Terima Sampel (BATT):</span>
                  </div>
                  <select
                    value={linkedReceiptId}
                    onChange={e => handleSelectLinkedReceipt(e.target.value)}
                    className="p-1.5 border border-amber-300 rounded-lg bg-white font-semibold text-slate-900 max-w-md"
                  >
                    <option value="">-- Impor Kode Sampel dari Tanda Terima --</option>
                    {sampleReceipts.filter(rec => {
                      // Hanya tampilkan BATT yang BELUM digunakan pada laporan BA Preparasi lain
                      // ATAU BATT yang sedang dihubungkan pada form ini (linkedReceiptId === rec.id)
                      const isUsedInOtherReport = reports.some(r => 
                        (r.receiptNo === rec.receiptNo || (r.poNumber && r.poNumber === rec.projectCode)) && 
                        r.id !== editingReportId
                      );
                      return !isUsedInOtherReport || linkedReceiptId === rec.id;
                    }).map(rec => (
                      <option key={rec.id} value={rec.id}>
                        {rec.receiptNo} ({rec.clientName} - {rec.items.length} Sampel)
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* OPSI IMPORT VIA EXCEL SPREADSHEET (ANGKA 1) */}
              <div className="bg-emerald-50/90 border border-emerald-200 p-3 rounded-xl flex flex-wrap items-center justify-between gap-3 shadow-xs">
                <div className="flex items-center gap-2 font-bold text-emerald-900">
                  <FileSpreadsheet className="w-4.5 h-4.5 text-emerald-600" />
                  <span>Atau Impor Matriks Sampel &amp; Uji via File Excel (Format Angka 1):</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={downloadSampleImportTemplate}
                    className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-bold text-[11px] rounded-lg shadow-xs flex items-center gap-1.5 cursor-pointer transition"
                  >
                    <Download className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Unduh Template Excel</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => excelFileInputRef.current?.click()}
                    disabled={isExcelImporting}
                    className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-[11px] rounded-lg shadow-xs flex items-center gap-1.5 cursor-pointer transition disabled:opacity-50"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>{isExcelImporting ? 'Membaca File...' : 'Upload File Excel'}</span>
                  </button>
                  <input
                    type="file"
                    ref={excelFileInputRef}
                    accept=".xlsx, .xls, .csv"
                    onChange={handlePrepExcelUpload}
                    className="hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-4 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Nomor BA Preparasi</label>
                  <input type="text" value={formNo} onChange={e => setFormNo(e.target.value)} className="w-full p-2 border border-slate-300 rounded-lg font-mono font-bold" />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Number PO</label>
                  <input type="text" value={formPoNo} onChange={e => setFormPoNo(e.target.value)} className="w-full p-2 border border-slate-300 rounded-lg font-mono" />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Hari &amp; Tanggal BA</label>
                  <div className="flex gap-1.5 items-center">
                    <input type="text" value={formDay} readOnly className="w-20 p-2 border border-slate-300 rounded-lg font-extrabold bg-slate-100 text-amber-900 text-center cursor-not-allowed" />
                    <input type="date" value={formRawDate} onChange={e => handleDateInputChange(e.target.value)} className="w-full p-2 border border-slate-300 rounded-lg font-bold" />
                  </div>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Inspector (Kepala Lab)</label>
                  <input type="text" value={formInspector} onChange={e => setFormInspector(e.target.value)} className="w-full p-2 border border-slate-300 rounded-lg font-bold" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Client (Nama Klien)</label>
                  <input type="text" value={formClient} onChange={e => setFormClient(e.target.value)} className="w-full p-2 border border-slate-300 rounded-lg font-bold" />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Project Name</label>
                  <input type="text" value={formProject} onChange={e => setFormProject(e.target.value)} className="w-full p-2 border border-slate-300 rounded-lg font-semibold" />
                </div>
              </div>

              {/* ─── TABEL EVALUASI KELAYAKAN ─────────────────────────────────── */}
              {(() => {
                const visibleTestKeys = ALL_TEST_KEYS.filter(({ key }) => {
                  if (manualActiveTestKeys[key] === true) return true;
                  if (manualActiveTestKeys[key] === false) return false;
                  return formItems.some(item => !!(item.testEligible && item.testEligible[key]));
                });

                return (
                  <div className="border border-slate-200 rounded-xl p-3 bg-slate-50 space-y-3">
                    <div className="flex justify-between items-center">
                      <h4 className="font-extrabold text-slate-800 flex items-center gap-2">
                        <Scissors className="w-3.5 h-3.5 text-amber-600" />
                        Tabel Evaluasi Kelayakan Parameter Uji ({formItems.length} Sampel)
                      </h4>

                      <div className="flex items-center gap-2">
                        {/* Popover opsi kolom parameter uji */}
                        <div className="relative">
                          <button
                            type="button"
                            onClick={() => setIsTestSelectorOpen(!isTestSelectorOpen)}
                            className="px-2.5 py-1 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-md text-[11px] font-bold flex items-center gap-1.5 cursor-pointer border border-slate-300 transition"
                          >
                            <SlidersHorizontal className="w-3.5 h-3.5 text-amber-700" />
                            <span>+ Tambah / Filter Parameter Uji</span>
                            <ChevronDown className="w-3 h-3 text-slate-500" />
                          </button>

                          {isTestSelectorOpen && (
                            <div className="absolute right-0 mt-1 w-64 bg-white border border-slate-300 rounded-xl shadow-2xl p-3 z-30 space-y-2 text-xs">
                              <div className="font-extrabold text-slate-800 border-b border-slate-200 pb-1.5 flex justify-between items-center">
                                <span className="flex items-center gap-1.5 text-amber-800">
                                  <SlidersHorizontal className="w-3.5 h-3.5" />
                                  <span>Opsi Kolom Parameter Uji</span>
                                </span>
                                <button onClick={() => setIsTestSelectorOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                              <p className="text-[10px] text-slate-500 leading-snug">
                                Centang untuk memunculkan/menampilkan kolom uji tambahan di tabel preparasi jika ada penambahan uji:
                              </p>
                              <div className="grid grid-cols-2 gap-1.5 pt-1">
                                {ALL_TEST_KEYS.map(({ key, label }) => {
                                  const isVisible = visibleTestKeys.some(v => v.key === key);
                                  return (
                                    <label key={key} className="flex items-center gap-2 text-[11px] font-semibold cursor-pointer p-1 rounded hover:bg-amber-50">
                                      <input
                                        type="checkbox"
                                        checked={isVisible}
                                        onChange={(e) => {
                                          const checked = e.target.checked;
                                          setManualActiveTestKeys(prev => ({ ...prev, [key]: checked }));
                                          setFormItems(items => items.map(item => ({
                                            ...item,
                                            testEligible: { ...(item.testEligible || {}), [key]: checked }
                                          })));
                                        }}
                                        className="w-3.5 h-3.5 accent-amber-600 cursor-pointer"
                                      />
                                      <span>{label}</span>
                                    </label>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>

                        <button onClick={handleAddItem} className="px-2.5 py-1 bg-amber-600 hover:bg-amber-500 text-white rounded-md text-[11px] font-bold flex items-center gap-1 cursor-pointer shadow-xs">
                          <Plus className="w-3.5 h-3.5" /> Tambah Baris Sampel
                        </button>
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-xs border-collapse">
                        <thead>
                          <tr className="bg-slate-200 text-slate-800 font-bold border-b border-slate-300">
                            <th className="p-2 text-left min-w-[150px]">Sample Code</th>
                            <th className="p-2 text-center w-24">Depth (m)</th>
                            <th className="p-2 text-center w-20">Thickness</th>
                            <th className="p-2 text-center w-20">Recovery</th>
                            <th className="p-2 text-center w-16">% Rec</th>
                            {visibleTestKeys.map(({ key, label }) => {
                              const allChecked = formItems.length > 0 && formItems.every(item => !!(item.testEligible && item.testEligible[key]));
                              const someChecked = formItems.some(item => !!(item.testEligible && item.testEligible[key]));
                              return (
                                <th key={label} className="p-1 text-center font-extrabold text-amber-900 bg-amber-100/60 border-x border-slate-300 min-w-[56px]">
                                  <div className="flex flex-col items-center gap-0.5">
                                    <span>{label}</span>
                                    <button
                                      type="button"
                                      title={allChecked ? `Batal pilih semua ${label}` : `Pilih semua ${label}`}
                                      onClick={() => {
                                        const newVal = !allChecked;
                                        setFormItems(items => items.map(item => ({
                                          ...item,
                                          testEligible: { ...(item.testEligible || {}), [key]: newVal }
                                        })));
                                      }}
                                      className={`text-[9px] font-bold px-1.5 py-0.5 rounded transition cursor-pointer border ${
                                        allChecked
                                          ? 'bg-amber-600 text-white border-amber-700 hover:bg-amber-700'
                                          : someChecked
                                          ? 'bg-amber-100 text-amber-800 border-amber-400 hover:bg-amber-200'
                                          : 'bg-white text-slate-500 border-slate-300 hover:bg-amber-50 hover:text-amber-700'
                                      }`}
                                    >
                                      {allChecked ? '✓ Semua' : someChecked ? '− Sebagian' : '+ Semua'}
                                    </button>
                                  </div>
                                </th>
                              );
                            })}
                            <th className="p-2 text-left min-w-[120px]">Keterangan</th>
                            <th className="p-2 text-center w-10">Hapus</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {formItems.map((item, idx) => {
                            const cond = item.sampleCondition || 'NORMAL';
                            const cfg = CONDITION_CONFIG[cond];
                            const isHighlight = cond !== 'NORMAL';
                            const el = item.testEligible || {};

                            return (
                              <tr key={item.id} className={isHighlight ? 'bg-orange-50 font-medium' : ''}>
                                <td className="p-1">
                                  <input
                                    id={`prep-samplecode-${idx}`}
                                    type="text"
                                    value={item.sampleCode}
                                    onChange={e => handleUpdateItem(idx, 'sampleCode', e.target.value)}
                                    onKeyDown={e => handleTableInputKeyDown(e, 'prep-samplecode', idx)}
                                    className="w-full p-1 border border-slate-300 rounded font-mono font-bold text-[11px]"
                                  />
                                </td>
                                <td className="p-1">
                                  <input
                                    id={`prep-depth-${idx}`}
                                    type="text"
                                    value={item.depthStr}
                                    onChange={e => handleUpdateItem(idx, 'depthStr', e.target.value)}
                                    onKeyDown={e => handleTableInputKeyDown(e, 'prep-depth', idx)}
                                    className="w-full p-1 border border-slate-300 rounded text-center font-mono text-[11px]"
                                  />
                                </td>
                                <td className="p-1">
                                  <input
                                    id={`prep-thickness-${idx}`}
                                    type="text"
                                    value={item.thicknessM !== undefined && item.thicknessM !== null ? String(item.thicknessM) : ''}
                                    onChange={e => handleUpdateItem(idx, 'thicknessM', e.target.value)}
                                    onKeyDown={e => handleTableInputKeyDown(e, 'prep-thickness', idx)}
                                    onBlur={e => {
                                      const raw = (e.target.value || '').replace(',', '.');
                                      if (raw.trim() !== '') {
                                        const val = parseFloat(raw);
                                        if (!isNaN(val)) {
                                          handleUpdateItem(idx, 'thicknessM', val.toFixed(2));
                                        }
                                      }
                                    }}
                                    className="w-full p-1 border border-slate-300 rounded text-center font-mono"
                                  />
                                </td>
                                <td className="p-1">
                                  <input
                                    id={`prep-recovery-${idx}`}
                                    type="text"
                                    value={item.recoveryM !== undefined && item.recoveryM !== null ? String(item.recoveryM) : ''}
                                    onChange={e => handleUpdateItem(idx, 'recoveryM', e.target.value)}
                                    onKeyDown={e => handleTableInputKeyDown(e, 'prep-recovery', idx)}
                                    onBlur={e => {
                                      const raw = (e.target.value || '').replace(',', '.');
                                      if (raw.trim() !== '') {
                                        const val = parseFloat(raw);
                                        if (!isNaN(val)) {
                                          handleUpdateItem(idx, 'recoveryM', val.toFixed(2));
                                        }
                                      } else {
                                        handleUpdateItem(idx, 'recoveryM', '');
                                      }
                                    }}
                                    className="w-full p-1 border border-slate-300 rounded text-center font-mono"
                                    placeholder="0.00"
                                  />
                                </td>
                                <td className="p-1 text-center font-mono font-bold">
                                  {item.recoveryM !== undefined && item.recoveryM !== null && String(item.recoveryM).trim() !== '' && !isNaN(parseFloat(String(item.recoveryM).replace(',', '.'))) && parseFloat(String(item.thicknessM).replace(',', '.')) > 0 
                                    ? `${item.recoveryPct}%` 
                                    : '-'}
                                </td>
                                
                                {/* DYNAMIC TEST ELIGIBILITY CHECKBOXES & PER-TEST CELL STATUS */}
                                {visibleTestKeys.map(({ key }) => {
                                  const isChecked = !!el[key];
                                  const cellDetail = item.testStatusDetails?.[key];
                                  const cellStatus: TestCellStatus = isChecked ? (cellDetail?.status || 'PASS') : 'CANCEL';

                                  let cellBg = 'bg-slate-50/40';
                                  let badgeStyle = 'bg-emerald-600 text-white font-extrabold';
                                  let statusText = 'PASS';

                                  if (isChecked) {
                                    if (cellStatus === 'PASS') {
                                      cellBg = 'bg-emerald-50/80';
                                      badgeStyle = 'bg-emerald-700 text-white font-extrabold';
                                      statusText = 'PASS';
                                    } else if (cellStatus === 'NP') {
                                      cellBg = 'bg-red-100/90';
                                      badgeStyle = 'bg-red-700 text-white font-extrabold';
                                      statusText = 'N.P.';
                                    } else if (cellStatus === 'INSUFFICIENT') {
                                      cellBg = 'bg-orange-100/90';
                                      badgeStyle = 'bg-orange-700 text-white font-extrabold';
                                      statusText = 'KURANG';
                                    } else if (cellStatus === 'SUBCONTRACT') {
                                      } else if (cellStatus === 'SUBCONTRACT') {
                                        cellBg = 'bg-amber-200/90';
                                        badgeStyle = 'bg-amber-800 text-white font-extrabold';
                                        statusText = 'SUB';
                                      } else if (cellStatus === 'CANCEL') {
                                        cellBg = 'bg-slate-200/90';
                                        badgeStyle = 'bg-slate-600 text-white font-extrabold';
                                        statusText = 'NON-UJI';
                                      }
                                    }

                                    return (
                                      <td key={key} className={`p-1 text-center border-x border-slate-200 transition-colors ${cellBg}`}>
                                        <div className="flex flex-col items-center justify-center gap-0.5">
                                          <input
                                            type="checkbox"
                                            checked={isChecked}
                                            onChange={() => handleToggleEligible(idx, key)}
                                            className="w-3.5 h-3.5 cursor-pointer accent-amber-600"
                                            title={isChecked ? `Status: ${statusText}` : 'Centang untuk mengaktifkan uji ini'}
                                          />
                                          {isChecked && (
                                            <select
                                              value={cellStatus}
                                              onChange={(e) => handleSetTestCellStatus(idx, key, e.target.value as TestCellStatus)}
                                              className={`text-[9px] font-extrabold rounded px-1 py-0.5 border border-slate-300 cursor-pointer shadow-2xs outline-none ${badgeStyle}`}
                                              title="Ubah status spesifik parameter uji ini"
                                            >
                                              <option value="PASS" className="bg-white text-slate-800 font-semibold">🟢 PASS (Diuji)</option>
                                              <option value="NP" className="bg-white text-slate-800 font-semibold">🔴 N.P. (Pasir)</option>
                                              <option value="INSUFFICIENT" className="bg-white text-slate-800 font-semibold">🟧 Sampel Kurang</option>
                                              <option value="SUBCONTRACT" className="bg-white text-slate-800 font-semibold">🟨 Subkontrak Lab</option>
                                              <option value="CANCEL" className="bg-white text-slate-800 font-semibold">⚪ Tidak Diuji</option>
                                            </select>
                                          )}
                                        </div>
                                      </td>
                                  );
                                })}



                                <td className="p-1">
                                  <input type="text" value={item.description || ''} onChange={e => handleUpdateItem(idx, 'description', e.target.value)} className="w-full p-1 border border-slate-300 rounded text-[11px]" placeholder="Keterangan..." />
                                </td>
                                <td className="p-1 text-center">
                                  <button onClick={() => handleRemoveItem(idx)} className="text-red-500 hover:text-red-700 cursor-pointer">
                                    <Trash2 className="w-4 h-4 mx-auto" />
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })()}

              {/* ─── SEKSI FOTO BEFORE & AFTER PER SAMPEL ─────────────────────── */}
              {formItems.length > 0 && (
                <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 space-y-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Camera className="w-4 h-4 text-amber-600" />
                    <h4 className="font-extrabold text-slate-800">Foto Preparasi Per Sampel (Before &amp; After Pembukaan Tabung)</h4>
                    <span className="text-[10px] font-semibold text-slate-500 bg-slate-200 px-2 py-0.5 rounded-full">{formItems.length} Sampel</span>
                  </div>
                  <p className="text-[11px] text-slate-500 -mt-2">
                    Unggah 2 foto untuk setiap sampel: <strong>BEFORE</strong> = kondisi tabung sebelum dibuka | <strong>AFTER</strong> = isi tabung setelah dibuka
                  </p>

                  <div className="grid grid-cols-1 gap-3">
                    {formItems.map((item, idx) => {
                      const cond = item.sampleCondition || 'NORMAL';
                      const cfg = CONDITION_CONFIG[cond];
                      return (
                        <div key={item.id} className="border border-slate-200 rounded-xl bg-white overflow-hidden">
                          {/* Sample header */}
                          <div className={`px-3 py-2 flex items-center gap-3 border-b border-slate-200 ${cfg.bg}`}>
                            <span className={`font-extrabold font-mono text-xs ${cfg.color}`}>
                              #{idx + 1} — {item.sampleCode || '(belum diisi)'}
                            </span>
                            <span className="text-[10px] text-slate-500 font-mono">{item.depthStr}</span>
                            <span className={`ml-auto flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${cfg.bg} ${cfg.color} ${cfg.border}`}>
                              {cfg.icon} {cfg.label}
                            </span>
                          </div>

                          {/* Photo pair */}
                          <div className="grid grid-cols-2 gap-0 divide-x divide-slate-200">
                            {/* BEFORE */}
                            <div className="p-3 space-y-2">
                              <div className="text-[11px] font-extrabold text-slate-700 flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-blue-500 inline-block"></span>
                                BEFORE — Sebelum Dibuka dari Tabung
                              </div>
                              {item.photoBeforeUrl ? (
                                <div className="relative group">
                                  <img src={item.photoBeforeUrl} alt="Before" className="w-full max-h-48 object-contain rounded-lg border border-slate-200 bg-slate-100" />
                                  <button
                                    onClick={() => handleUpdateItem(idx, 'photoBeforeUrl', '')}
                                    className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center opacity-0 group-hover:opacity-100 transition cursor-pointer"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </div>
                              ) : (
                                <div
                                  onClick={() => photoInputRefs.current[`${item.id}-before`]?.click()}
                                  className="border-2 border-dashed border-blue-200 rounded-lg h-28 flex flex-col items-center justify-center gap-1.5 cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition"
                                >
                                  <Camera className="w-6 h-6 text-blue-300" />
                                  <span className="text-[10px] text-slate-400 font-semibold">Klik untuk upload foto BEFORE</span>
                                </div>
                              )}
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                ref={el => { photoInputRefs.current[`${item.id}-before`] = el; }}
                                onChange={e => {
                                  const f = e.target.files?.[0];
                                  if (f) handlePhotoUpload(item.id, 'before', f);
                                  e.target.value = '';
                                }}
                              />
                            </div>

                            {/* AFTER */}
                            <div className="p-3 space-y-2">
                              <div className="text-[11px] font-extrabold text-slate-700 flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-amber-500 inline-block"></span>
                                AFTER — Setelah Dibuka dari Tabung
                              </div>
                              {item.photoAfterUrl ? (
                                <div className="relative group">
                                  <img src={item.photoAfterUrl} alt="After" className="w-full max-h-48 object-contain rounded-lg border border-slate-200 bg-slate-100" />
                                  <button
                                    onClick={() => handleUpdateItem(idx, 'photoAfterUrl', '')}
                                    className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center opacity-0 group-hover:opacity-100 transition cursor-pointer"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </div>
                              ) : (
                                <div
                                  onClick={() => photoInputRefs.current[`${item.id}-after`]?.click()}
                                  className="border-2 border-dashed border-amber-200 rounded-lg h-28 flex flex-col items-center justify-center gap-1.5 cursor-pointer hover:border-amber-400 hover:bg-amber-50 transition"
                                >
                                  <Camera className="w-6 h-6 text-amber-300" />
                                  <span className="text-[10px] text-slate-400 font-semibold">Klik untuk upload foto AFTER</span>
                                </div>
                              )}
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                ref={el => { photoInputRefs.current[`${item.id}-after`] = el; }}
                                onChange={e => {
                                  const f = e.target.files?.[0];
                                  if (f) handlePhotoUpload(item.id, 'after', f);
                                  e.target.value = '';
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button onClick={handleAttemptCloseForm} className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl cursor-pointer">Batal</button>
                <button onClick={handleSaveForm} className="px-5 py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl shadow-md cursor-pointer">
                  {editingReportId ? 'Simpan Perubahan' : 'Simpan & Terbitkan BA Preparasi'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PRINT PREVIEW MODAL */}
      {isPreviewModalOpen && selectedReport && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-2 z-50 overflow-y-auto">
          <div className="bg-slate-900 rounded-2xl border border-slate-800 w-[95vw] max-w-[1100px] max-h-[96vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-3.5 bg-slate-950 border-b border-slate-800 flex justify-between items-center text-white">
              <h3 className="font-extrabold text-sm flex items-center gap-2">
                <Printer className="w-4 h-4 text-amber-400" />
                <span>Cetak Berita Acara Preparasi - {selectedReport.prepReportNo}</span>
              </h3>
              <div className="flex items-center gap-2">
                <button onClick={() => window.print()} className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-lg text-xs flex items-center gap-1.5 cursor-pointer">
                  <Printer className="w-4 h-4" /> Cetak / Save PDF
                </button>
                <button onClick={() => setIsPreviewModalOpen(false)} className="text-slate-400 hover:text-white cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 bg-slate-800 overflow-y-auto flex flex-col items-center gap-6">

              {/* ─── HALAMAN 1: TABEL EVALUASI ──────────────────────────────── */}
              <div className="w-[210mm] max-w-full bg-white text-slate-900 p-7 shadow-2xl font-sans text-[10px] space-y-2.5 border border-slate-300 min-h-[297mm] relative overflow-hidden">
                
                {/* OFFICIAL KOP SURAT */}
                <div className="border-b-2 border-slate-900 pb-2 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <img src={companyProfile.logoUrl || '/logo.png'} alt="Logo" className="w-12 h-12 object-contain" />
                    <div>
                      <div className="font-black text-sm tracking-wider text-slate-950 uppercase leading-tight">{companyProfile.companyName || 'PT. TERRAFORMA GEOTEKNIK INDONESIA'}</div>
                      <div className="text-[8.5px] font-bold text-slate-700 uppercase tracking-tight">{companyProfile.taglineEn || companyProfile.labNameEn || 'Soil Mechanics & Geotechnical Laboratory Testing'}</div>
                      <div className="text-[7px] text-slate-500 font-sans">{companyProfile.labAddress || companyProfile.officeAddress || 'Jl. Terusan Jakarta No. 175, Antapani, Bandung — Jawa Barat'} | Email: {companyProfile.email || 'lab@terraforma.co.id'}</div>
                    </div>
                  </div>
                  <div className="text-right font-mono text-[8px] text-slate-600">
                    <div className="font-extrabold text-slate-900">FORM : FR-LAB-02</div>
                    <div>Rev. 00 / 2026</div>
                  </div>
                </div>

                <div className="text-center pt-0.5">
                  <h1 className="text-xs font-black text-slate-950 uppercase tracking-widest underline decoration-1 underline-offset-2">
                    BERITA ACARA PREPARASI SAMPEL
                  </h1>
                  <div className="text-[9.5px] font-bold text-slate-800 font-mono mt-0.5">
                    Nomor : {selectedReport.prepReportNo}
                  </div>
                </div>

                <p className="text-[9px] text-slate-800">
                  Telah Dilakukan Preparasi Sampel pengujian dari <strong>{selectedReport.clientName}</strong> Pada:
                </p>

                <div className="grid grid-cols-12 gap-x-2 gap-y-0.5 text-[9px] font-sans bg-slate-50/80 border border-slate-200 p-2 rounded-lg">
                  <div className="col-span-3 font-semibold text-slate-600">Day / Hari</div>
                  <div className="col-span-9 font-bold">: {selectedReport.dayName || 'Senin'}</div>
                  <div className="col-span-3 font-semibold text-slate-600">Date / Tanggal</div>
                  <div className="col-span-9 font-bold">: {selectedReport.date}</div>
                  <div className="col-span-3 font-semibold text-slate-600">Number PO / Kode Proyek</div>
                  <div className="col-span-9 font-bold font-mono">: {selectedReport.poNumber || '-'}</div>
                  <div className="col-span-3 font-semibold text-slate-600">Number of Samples Received</div>
                  <div className="col-span-9 font-bold font-mono">: {selectedReport.items.length} Sampel</div>
                  <div className="col-span-3 font-semibold text-slate-600">Number of Samples Prepared</div>
                  <div className="col-span-9 font-bold font-mono">
                    : {selectedReport.items.filter(item => {
                        const el = item.testEligible || {};
                        return Object.values(el).some(val => val === true);
                      }).length} Sampel
                  </div>
                </div>

                {(() => {
                  const pdfVisibleTestKeys = ALL_TEST_KEYS.filter(({ key }) =>
                    selectedReport.items.some(item => item.testEligible && item.testEligible[key] === true)
                  );
                  const activeCount = pdfVisibleTestKeys.length || 1;

                  const hasSpecialNotes = selectedReport.items.some(item => 
                    Object.entries(item.testStatusDetails || {}).some(([tKey, d]) => !!item.testEligible?.[tKey] && d.status !== 'PASS') ||
                    (item.sampleCondition && item.sampleCondition !== 'NORMAL')
                  );

                  return (
                    <>
                      <table className="w-full border-collapse border border-slate-900 text-[8px]">
                        <thead>
                          <tr className="bg-slate-200 text-slate-900 font-black text-center border-b border-slate-900">
                            <th className="p-0.5 border border-slate-900 w-5" rowSpan={2}>No</th>
                            <th className="p-0.5 border border-slate-900 text-center" rowSpan={2}>Sample Code</th>
                            <th className="p-0.5 border border-slate-900 text-center whitespace-nowrap" rowSpan={2}>Depth (m)</th>
                            <th className="p-0.5 border border-slate-900 text-center whitespace-nowrap" rowSpan={2}>Thickness (m)</th>
                            <th className="p-0.5 border border-slate-900 text-center whitespace-nowrap" rowSpan={2}>Recovery (m)</th>
                            <th className="p-0.5 border border-slate-900 text-center w-7" rowSpan={2}>%</th>
                            <th className="p-0.5 border border-slate-900 text-center font-extrabold" colSpan={activeCount}>Eligible ( Yes / No / Note )</th>
                            <th className="p-0.5 border border-slate-900 text-center" rowSpan={2}>Status</th>
                            <th className="p-0.5 border border-slate-900 text-center" rowSpan={2}>Keterangan</th>
                          </tr>
                          <tr className="bg-slate-200 text-slate-900 font-bold text-center border-b border-slate-900 text-[7.5px]">
                            {pdfVisibleTestKeys.map(({ label }) => (
                              <th key={label} className="p-0.5 border border-slate-900">{label}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-400">
                          {selectedReport.items.map((item, i) => {
                            const el = item.testEligible || {};
                            
                            // Hitung status ringkasan per baris sampel
                            const rowNotes: string[] = [];
                            Object.entries(item.testStatusDetails || {}).forEach(([tKey, d]) => {
                              if (!el[tKey]) return;
                              if (d.status === 'NP' && !rowNotes.includes('N.P. (Pasir)')) rowNotes.push('N.P. (Pasir)');
                              if (d.status === 'INSUFFICIENT' && !rowNotes.includes('Sampel Kurang')) rowNotes.push('Sampel Kurang');
                              if (d.status === 'SUBCONTRACT' && !rowNotes.includes('Subkontrak')) rowNotes.push('Subkontrak');
                              if (d.status === 'CANCEL' && !rowNotes.includes('Tidak Diuji')) rowNotes.push('Tidak Diuji');
                            });

                            const rowStatusLabel = rowNotes.length > 0 
                              ? rowNotes.join(', ') 
                              : (item.sampleCondition && item.sampleCondition !== 'NORMAL' ? (item.sampleCondition === 'ROCK' ? 'Batuan' : item.sampleCondition === 'INSUFFICIENT' ? 'Tdk Cukup' : 'Subkontrak') : '-');

                            const isOrangeRow = rowNotes.length > 0 || (item.sampleCondition && item.sampleCondition !== 'NORMAL') || item.isRockHighlight;

                            return (
                              <tr key={item.id} className={isOrangeRow ? 'bg-[#fff7ed] text-slate-950 font-semibold' : 'text-slate-900'}>
                                <td className="p-0.5 border border-slate-900 text-center font-bold">{i + 1}</td>
                                <td className="p-0.5 border border-slate-900 font-mono font-semibold text-left whitespace-nowrap">{item.sampleCode}</td>
                                <td className="p-0.5 border border-slate-900 text-center font-mono whitespace-nowrap">{item.depthStr}</td>
                                <td className="p-0.5 border border-slate-900 text-center font-mono whitespace-nowrap">{item.thicknessM !== undefined && item.thicknessM !== null ? Number(item.thicknessM).toFixed(2).replace('.', ',') : '-'}</td>
                                <td className="p-0.5 border border-slate-900 text-center font-mono whitespace-nowrap">{item.recoveryM !== undefined && item.recoveryM !== null && String(item.recoveryM).trim() !== '' ? Number(item.recoveryM).toFixed(2).replace('.', ',') : '-'}</td>
                                <td className="p-0.5 border border-slate-900 text-center font-mono font-bold">{item.recoveryPct !== undefined ? `${item.recoveryPct}%` : '-'}</td>
                                {pdfVisibleTestKeys.map(({ key }) => {
                                  const isChecked = !!el[key];
                                  const st = isChecked ? (item.testStatusDetails?.[key]?.status || 'PASS') : 'CANCEL';
                                  
                                  let dispText = '-';
                                  let dispStyle = 'text-slate-400 font-normal';

                                  if (isChecked) {
                                    if (st === 'PASS') {
                                      dispText = 'Yes';
                                      dispStyle = 'text-slate-900 font-bold';
                                    } else if (st === 'NP') {
                                      dispText = 'N.P.';
                                      dispStyle = 'text-red-700 font-black';
                                    } else if (st === 'INSUFFICIENT') {
                                      dispText = 'Kurang';
                                      dispStyle = 'text-orange-700 font-black';
                                    } else if (st === 'SUBCONTRACT') {
                                      dispText = 'Sub';
                                      dispStyle = 'text-amber-800 font-black';
                                    } else if (st === 'CANCEL') {
                                      dispText = 'Tidak';
                                      dispStyle = 'text-slate-600 font-bold bg-slate-100';
                                    }
                                  }

                                  return (
                                    <td key={key} className={`p-0.5 border border-slate-900 text-center ${dispStyle}`}>
                                      {dispText}
                                    </td>
                                  );
                                })}
                                <td className="p-0.5 border border-slate-900 text-center font-bold text-[7.5px] whitespace-nowrap">{rowStatusLabel}</td>
                                <td className="p-0.5 border border-slate-900 text-center font-semibold text-[7.5px]">{item.description || '-'}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                        <tfoot>
                          <tr className="bg-slate-200 text-slate-900 font-extrabold text-center border-t-2 border-slate-900">
                            <td colSpan={6} className="p-0.5 border border-slate-900 text-right pr-2 font-black">Jumlah Diuji (Pass)</td>
                            {pdfVisibleTestKeys.map(({ key }) => {
                              const passCount = selectedReport.items.filter(item => {
                                if (!item.testEligible || !item.testEligible[key]) return false;
                                const st = item.testStatusDetails?.[key]?.status || 'PASS';
                                return st === 'PASS';
                              }).length;

                              return (
                                <td key={key} className="p-0.5 border border-slate-900 font-mono font-bold">
                                  {passCount}
                                </td>
                              );
                            })}
                            <td colSpan={2} className="p-0.5 border border-slate-900"></td>
                          </tr>
                        </tfoot>
                      </table>

                      {(() => {
                        const detailNotes: Array<{ sampleCode: string; text: string }> = [];

                        selectedReport.items.forEach(item => {
                          const el = item.testEligible || {};
                          const details = item.testStatusDetails || {};

                          const passTests: string[] = [];
                          const npTests: string[] = [];
                          const infTests: string[] = [];
                          const subTests: string[] = [];
                          const cancelTests: string[] = [];

                          ALL_TEST_KEYS.forEach(({ key, label }) => {
                            if (!el[key]) return;
                            const st = details[key]?.status || 'PASS';
                            if (st === 'PASS') passTests.push(label);
                            if (st === 'NP') npTests.push(label);
                            if (st === 'INSUFFICIENT') infTests.push(label);
                            if (st === 'SUBCONTRACT') subTests.push(label);
                            if (st === 'CANCEL') cancelTests.push(label);
                          });

                          const itemNotes: string[] = [];
                          if (npTests.length > 0) {
                            itemNotes.push(`Parameter ${npTests.join(', ')} tidak dapat diuji dikarenakan jenis tanah bersifat Pasir Non-Plastis (N.P.)`);
                          }
                          if (infTests.length > 0) {
                            itemNotes.push(`Parameter ${infTests.join(', ')} tidak dapat diuji dikarenakan volume/benda uji tanah kurang saat dipotong`);
                          }
                          if (subTests.length > 0) {
                            itemNotes.push(`Parameter ${subTests.join(', ')} dialihkan ke Laboratorium Rekanan Terakreditasi (Subkontrak)`);
                          }
                          if (cancelTests.length > 0) {
                            itemNotes.push(`Parameter ${cancelTests.join(', ')} tidak diuji atas permintaan Klien / kebutuhan evaluasi`);
                          }

                          // Jika sampel SAMA SEKALI tidak dibuka/dipreparasi (0 active tests)
                          if (passTests.length === 0 && npTests.length === 0 && infTests.length === 0 && subTests.length === 0 && cancelTests.length === 0) {
                            const customDesc = item.description && item.description !== '-' ? ` (${item.description})` : '';
                            itemNotes.push(`Tabung sampel tidak dibuka / preparasi & pengujian laboratorium tidak dilakukan${customDesc}`);
                          }

                          if (itemNotes.length > 0) {
                            detailNotes.push({
                              sampleCode: item.sampleCode || 'Sampel',
                              text: itemNotes.join('; ')
                            });
                          }
                        });

                        return (
                          <>
                            {detailNotes.length > 0 ? (
                              <div className="pt-2 text-[9.5px] leading-relaxed text-slate-900 space-y-1.5 border-t border-slate-300 mt-2">
                                <p className="font-bold">Demikian Berita Acara Preparasi ini kami sampaikan. Berdasarkan hasil pemeriksaan fisik saat pembukaan tabung preparasi, berikut rincian penjelasan resmi untuk pihak Klien:</p>
                                <ul className="list-disc pl-4 space-y-0.5 font-medium text-[9px]">
                                  {detailNotes.map((note, nIdx) => (
                                    <li key={nIdx}>
                                      <strong>Sampel {note.sampleCode}:</strong> {note.text}.
                                    </li>
                                  ))}
                                </ul>
                                <p className="pt-1">Seluruh parameter uji dengan status <strong>Yes</strong> akan segera diproses ke tahap pengujian laboratorium utama. Apabila Bapak/Ibu memerlukan penyesuaian atau uji alternatif, mohon dapat mengonfirmasikan kepada kami.</p>
                              </div>
                            ) : (
                              <div className="pt-2 text-[9.5px] leading-relaxed text-slate-900 space-y-1 border-t border-slate-300 mt-2">
                                <p>Demikian Berita Acara Preparasi Sampel ini kami sampaikan. Seluruh sampel yang diterima berada dalam kondisi baik dan dapat diuji sepenuhnya sesuai dengan daftar parameter uji awal.</p>
                                <p>Kami akan segera melanjutkan proses pengujian laboratorium sesuai rencana yang telah ditetapkan. Apabila terdapat arahan tambahan atau permintaan uji alternatif, mohon dapat diinformasikan kepada kami.</p>
                              </div>
                            )}

                            {/* ─── TANDA TANGAN KANAN BAWAH (MASTER PERSONIL INTEGRATION) ─── */}
                            {(() => {
                              const headOfLab = (personnelCatalogue || []).find(p => 
                                p.role === 'Approver' && (p.title?.toLowerCase().includes('kepala') || p.name.toLowerCase().includes('yustiadji') || p.name.toLowerCase().includes('hendra'))
                              ) || (personnelCatalogue || []).find(p => p.role === 'Approver') || {
                                name: 'Ir. Hendra Wijaya, M.T.',
                                title: 'Kepala Laboratorium',
                                signatureUrl: undefined
                              };

                              const approverName = headOfLab.name || 'Ir. Hendra Wijaya, M.T.';
                              const approverTitle = headOfLab.title || 'Kepala Laboratorium';
                              const approverSignature = headOfLab.signatureUrl;

                              return (
                                <div className="pt-6 flex justify-end">
                                  <div className="text-center w-64 space-y-1 font-sans">
                                    <p className="text-[9.5px] text-slate-800 font-semibold">
                                      Bandung, {selectedReport.date}
                                    </p>
                                    <p className="text-[10.5px] font-black text-slate-900">
                                      {companyProfile.companyName || 'PT. Terraforma Geoteknik Indonesia'}
                                    </p>
                                    <p className="text-[9px] font-medium text-slate-600">
                                      {companyProfile.headOfLabTitle || 'Kepala Laboratorium Mekanika Tanah'}
                                    </p>

                                    <div className="h-16 flex flex-col items-center justify-end pb-1 relative my-1">
                                      {/* CAP STEMPEL RESMI (TERPISAH DARI LOGO - MENGGUNAKAN STAMP URL) */}
                                      {(companyProfile.stampUrl || companyProfile.logoUrl || '/logo.png') && (
                                        <img 
                                          src={companyProfile.stampUrl || companyProfile.logoUrl || '/logo.png'} 
                                          alt="Cap Stempel Resmi" 
                                          className="absolute bottom-0 left-2 w-16 h-16 object-contain mix-blend-multiply opacity-80 rotate-[-6deg] pointer-events-none z-20 select-none" 
                                        />
                                      )}

                                      {approverSignature ? (
                                        <img 
                                          src={approverSignature} 
                                          alt={`Tanda tangan ${approverName}`} 
                                          className="max-h-14 max-w-[170px] object-contain mix-blend-multiply mb-0.5 relative z-10" 
                                        />
                                      ) : (
                                        <span className="text-[8.5px] text-slate-400 font-mono mb-2">
                                          ( Tanda Tangan &amp; Stempel Lab )
                                        </span>
                                      )}

                                      <div className="border-b border-slate-500 w-48 relative z-0"></div>
                                    </div>

                                    <p className="text-[10px] font-extrabold text-slate-900 underline tracking-wide">
                                      {approverName}
                                    </p>
                                    <p className="text-[8.5px] text-slate-600 font-semibold">
                                      {approverTitle}
                                    </p>
                                  </div>
                                </div>
                              );
                            })()}
                          </>
                        );
                      })()}
                    </>
                  );
                })()}
              </div>

              {/* ─── HALAMAN 2+: LAMPIRAN FOTO BEFORE & AFTER PER SAMPEL ──── */}
              {(() => {
                const itemsWithPhotos = selectedReport.items.filter(i => i.photoBeforeUrl || i.photoAfterUrl);
                if (itemsWithPhotos.length === 0) return null;
                const totalPages = Math.ceil(itemsWithPhotos.length / 3);
                const chunks = [];
                for (let i = 0; i < itemsWithPhotos.length; i += 3) {
                  chunks.push(itemsWithPhotos.slice(i, i + 3));
                }
                return chunks.map((chunk, chunkIdx) => (
                  <div key={chunkIdx} className="w-[210mm] bg-white text-slate-900 p-8 shadow-2xl font-sans text-xs space-y-6 border border-slate-300 min-h-[297mm] relative page-break-before-always">
                    
                    <div className="border-b-2 border-slate-900 pb-2">
                      <h2 className="text-sm font-black text-slate-900 uppercase tracking-wide text-center">
                        LAMPIRAN FOTO PREPARASI SAMPEL
                      </h2>
                      <p className="text-[10px] text-center text-slate-600 font-semibold mt-0.5">Before &amp; After Pembukaan Tabung Sampel</p>
                      <p className="text-[10px] text-center text-slate-500 font-mono mt-0.5">{selectedReport.prepReportNo} — {selectedReport.clientName}</p>
                    </div>

                    <div className="space-y-4">
                      {chunk.map((item, i) => {
                        const cond = item.sampleCondition || 'NORMAL';
                        const condLabel = cond === 'NORMAL' ? 'Normal' : cond === 'ROCK' ? 'Batuan' : cond === 'INSUFFICIENT' ? 'Sampel Tidak Cukup' : 'Subkontrak';
                        const origIndex = selectedReport.items.findIndex(it => it.id === item.id) + 1;
                        const depthClean = (item.depthStr || '').replace(/\s*m\s*$/i, '').trim();

                        return (
                          <div key={item.id} className="border border-slate-300 rounded overflow-hidden">
                            <div className="px-3 py-1.5 bg-slate-100 border-b border-slate-300 flex justify-between items-center text-[10px] font-bold text-slate-800">
                              <div className="flex items-center gap-2">
                                <span className="px-1.5 py-0.5 bg-slate-900 text-white rounded text-[9.5px] font-black font-mono">
                                  #{origIndex > 0 ? origIndex : (i + 1)}
                                </span>
                                <span className="font-mono font-black text-slate-950 text-[11px]">{item.sampleCode}</span>
                              </div>
                              <span className="text-slate-600 font-mono">Kedalaman: {depthClean ? `${depthClean} m` : '-'}</span>
                              <span className="font-semibold text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-200 text-[9px]">Status: {condLabel}</span>
                            </div>
                            <div className="grid grid-cols-2 divide-x divide-slate-300">
                              <div className="p-2 space-y-1">
                                <div className="text-[10px] font-extrabold text-blue-800 flex items-center gap-1">
                                  <span className="w-2 h-2 rounded-full bg-blue-500 inline-block"></span>
                                  BEFORE — Sebelum Dibuka
                                </div>
                                {item.photoBeforeUrl ? (
                                  <img src={item.photoBeforeUrl} alt="Before" className="w-full max-h-56 object-contain border border-slate-200 rounded" />
                                ) : (
                                  <div className="h-40 border border-dashed border-slate-300 flex items-center justify-center text-slate-400 text-[9px] font-mono">Tidak Ada Foto</div>
                                )}
                              </div>
                              <div className="p-2 space-y-1">
                                <div className="text-[10px] font-extrabold text-amber-800 flex items-center gap-1">
                                  <span className="w-2 h-2 rounded-full bg-amber-500 inline-block"></span>
                                  AFTER — Setelah Dibuka
                                </div>
                                {item.photoAfterUrl ? (
                                  <img src={item.photoAfterUrl} alt="After" className="w-full max-h-56 object-contain border border-slate-200 rounded" />
                                ) : (
                                  <div className="h-40 border border-dashed border-slate-300 flex items-center justify-center text-slate-400 text-[9px] font-mono">Tidak Ada Foto</div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* FOOTER HALAMAN FOTO */}
                    <div className="absolute bottom-5 left-8 right-8 border-t border-slate-300 pt-2 flex justify-between items-center text-[9px] text-slate-500 font-mono">
                      <span>No. Dok: <strong className="text-slate-700">{selectedReport.prepReportNo}</strong></span>
                      <span className="text-center font-semibold text-slate-600">PT. Terraforma Geoteknik Indonesia — Soil Mechanics Laboratory</span>
                      <span>Hal. <strong className="text-slate-700">{2 + chunkIdx}</strong> / {1 + totalPages}</span>
                    </div>
                  </div>
                ));
              })()}

            </div>
          </div>
        </div>
      )}

      {/* UNSAVED CHANGES CONFIRMATION MODAL */}
      {showUnsavedConfirm && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 z-[70]">
          <div className="bg-white rounded-2xl border border-slate-200 w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-amber-100 rounded-xl border border-amber-200 text-amber-600">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-extrabold text-slate-900 text-base">Perubahan Belum Disimpan</h4>
                <p className="text-xs text-slate-500 font-medium">Apakah Anda ingin menyimpan data sebelum keluar?</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200 leading-relaxed">
              Terdapat perubahan data pada formulir Berita Acara Preparasi ini. Jika Anda keluar tanpa menyimpan, data baru yang Anda isi akan hilang.
            </p>

            <div className="flex flex-col gap-2 pt-2">
              <button
                onClick={handleSaveForm}
                className="w-full py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer transition flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Simpan &amp; Terbitkan BA Preparasi</span>
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    setShowUnsavedConfirm(false);
                    setIsFormModalOpen(false);
                    setIsFormDirty(false);
                  }}
                  className="py-2 bg-red-100 hover:bg-red-200 text-red-700 font-bold text-xs rounded-xl border border-red-300 cursor-pointer transition"
                >
                  Keluar Tanpa Menyimpan
                </button>
                <button
                  onClick={() => setShowUnsavedConfirm(false)}
                  className="py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl border border-slate-300 cursor-pointer transition"
                >
                  Kembali ke Form
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
