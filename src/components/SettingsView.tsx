import React, { useState } from 'react';
import { 
  MatrixTestInfo, 
  MATRIX_TEST_CATALOGUE, 
  DEFAULT_SAMPLE_TYPES, 
  ContainerItem, 
  RingItem, 
  ConsolRingItem,
  DsProvingItem,
  DsRingItem,
  TrxRingItem,
  UctRingItem,
  PycnometerItem,
  PersonnelItem,
  PersonnelRole,
  MoldItem,
  ReamerItem
} from '../types';
import {
  DEFAULT_CONTAINER_CATALOGUE,
  DEFAULT_RING_CATALOGUE,
  DEFAULT_CONSOL_RING_CATALOGUE,
  DEFAULT_DS_PROVING_CATALOGUE,
  DEFAULT_DS_RING_CATALOGUE,
  DEFAULT_TRX_RING_CATALOGUE,
  DEFAULT_UCT_RING_CATALOGUE,
  DEFAULT_PYCNOMETER_CATALOGUE,
  DEFAULT_PERSONNEL_CATALOGUE,
  DEFAULT_MOLD_CATALOGUE,
  DEFAULT_REAMER_CATALOGUE
} from '../data/initialData';
import {
  Settings,
  Edit3,
  Save,
  X,
  RotateCcw,
  Plus,
  FlaskConical,
  BookOpen,
  Tag,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Search,
  Box,
  CircleDot,
  Pipette,
  Check,
  UserCheck,
  User,
  Award,
  Filter,
  Upload,
  Image as ImageIcon,
  FileCheck,
  Eye,
  DollarSign
} from 'lucide-react';
import { getStoredMasterPrices, saveStoredMasterPrices, INITIAL_MASTER_PRICE_CATALOG, MasterPriceItem } from '../data/masterPriceCatalog';
import { CompanyProfileSettingsView } from './settings/CompanyProfileSettingsView';
import { CompanyProfile, DEFAULT_COMPANY_PROFILE } from '../types/companyProfileTypes';

interface SettingsViewProps {
  companyProfile?: CompanyProfile;
  onUpdateCompanyProfile?: (profile: CompanyProfile) => void;
  testCatalogue: MatrixTestInfo[];
  onUpdateCatalogue: (updated: MatrixTestInfo[]) => void;
  onResetCatalogue: () => void;
  sampleTypeCatalogue: string[];
  onUpdateSampleTypeCatalogue: (updated: string[]) => void;
  onResetSampleTypeCatalogue: () => void;

  containerCatalogue: ContainerItem[];
  onUpdateContainerCatalogue: (updated: ContainerItem[]) => void;
  onResetContainerCatalogue: () => void;

  ringCatalogue: RingItem[];
  onUpdateRingCatalogue: (updated: RingItem[]) => void;
  onResetRingCatalogue: () => void;

  consolRingCatalogue?: ConsolRingItem[];
  onUpdateConsolRingCatalogue?: (updated: ConsolRingItem[]) => void;
  onResetConsolRingCatalogue?: () => void;

  dsRingCatalogue?: DsRingItem[];
  onUpdateDsRingCatalogue?: (updated: DsRingItem[]) => void;
  onResetDsRingCatalogue?: () => void;

  trxRingCatalogue?: TrxRingItem[];
  onUpdateTrxRingCatalogue?: (updated: TrxRingItem[]) => void;
  onResetTrxRingCatalogue?: () => void;

  uctRingCatalogue?: UctRingItem[];
  onUpdateUctRingCatalogue?: (updated: UctRingItem[]) => void;
  onResetUctRingCatalogue?: () => void;

  pycCatalogue: PycnometerItem[];
  onUpdatePycCatalogue: (updated: PycnometerItem[]) => void;
  onResetPycCatalogue: () => void;

  personnelCatalogue: PersonnelItem[];
  onUpdatePersonnelCatalogue: (updated: PersonnelItem[]) => void;
  onResetPersonnelCatalogue: () => void;

  moldCatalogue?: MoldItem[];
  onUpdateMoldCatalogue?: (updated: MoldItem[]) => void;
  onResetMoldCatalogue?: () => void;

  reamerCatalogue?: ReamerItem[];
  onUpdateReamerCatalogue?: (updated: ReamerItem[]) => void;
  onResetReamerCatalogue?: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  testCatalogue,
  onUpdateCatalogue,
  onResetCatalogue,
  sampleTypeCatalogue,
  onUpdateSampleTypeCatalogue,
  onResetSampleTypeCatalogue,
  containerCatalogue,
  onUpdateContainerCatalogue,
  onResetContainerCatalogue,
  ringCatalogue,
  onUpdateRingCatalogue,
  onResetRingCatalogue,
  consolRingCatalogue = DEFAULT_CONSOL_RING_CATALOGUE,
  onUpdateConsolRingCatalogue = () => {},
  onResetConsolRingCatalogue = () => {},
  dsProvingCatalogue = DEFAULT_DS_PROVING_CATALOGUE,
  onUpdateDsProvingCatalogue = () => {},
  onResetDsProvingCatalogue = () => {},
  dsRingCatalogue = DEFAULT_DS_RING_CATALOGUE,
  onUpdateDsRingCatalogue = () => {},
  onResetDsRingCatalogue = () => {},
  trxRingCatalogue = DEFAULT_TRX_RING_CATALOGUE,
  onUpdateTrxRingCatalogue = () => {},
  onResetTrxRingCatalogue = () => {},
  uctRingCatalogue = DEFAULT_UCT_RING_CATALOGUE,
  onUpdateUctRingCatalogue = () => {},
  onResetUctRingCatalogue = () => {},
  pycCatalogue,
  onUpdatePycCatalogue,
  onResetPycCatalogue,
  personnelCatalogue,
  onUpdatePersonnelCatalogue,
  onResetPersonnelCatalogue,
  moldCatalogue = DEFAULT_MOLD_CATALOGUE,
  onUpdateMoldCatalogue = () => {},
  onResetMoldCatalogue = () => {},
  reamerCatalogue = DEFAULT_REAMER_CATALOGUE,
  onUpdateReamerCatalogue = () => {},
  onResetReamerCatalogue = () => {},
  companyProfile = DEFAULT_COMPANY_PROFILE,
  onUpdateCompanyProfile = () => {},
}) => {
  // Helper: parse decimal input that may use comma or dot
  const localeParseFloat = (val: string): number => parseFloat(String(val).replace(/,/g, '.')) || 0;

  const [activeSubTab, setActiveSubTab] = useState<'prices' | 'tests' | 'containers' | 'ds_containers' | 'rings' | 'consol_rings' | 'ds_rings' | 'trx_rings' | 'uct_rings' | 'pycnometers' | 'molds' | 'cbr_molds' | 'reamers' | 'cbr_reamers' | 'sample_types' | 'personnel' | 'company_profile'>('company_profile');
  const [savedFeedback, setSavedFeedback] = useState<string | null>(null);

  // Master Prices State
  const [masterPrices, setMasterPrices] = useState<MasterPriceItem[]>(() => getStoredMasterPrices());
  const [priceSearch, setPriceSearch] = useState('');
  const [editingPriceId, setEditingPriceId] = useState<string | null>(null);
  const [editingPriceData, setEditingPriceData] = useState<MasterPriceItem | null>(null);
  const [isAddingPrice, setIsAddingPrice] = useState(false);
  const [newPriceItem, setNewPriceItem] = useState<Partial<MasterPriceItem>>({
    code: '', name: '', standard: '-', unit: 'Sample', priceGeoland: 0, priceBRS: 0, priceUmum: 0
  });

  // Search states
  const [containerSearch, setContainerSearch] = useState('');
  const [ringSearch, setRingSearch] = useState('');
  const [pycSearch, setPycSearch] = useState('');
  const [testSearch, setTestSearch] = useState('');

  // 1. Matrix Tests State
  const [editingTestIndex, setEditingTestIndex] = useState<number | null>(null);
  const [editingTestData, setEditingTestData] = useState<MatrixTestInfo | null>(null);
  const [isAddingTest, setIsAddingTest] = useState(false);
  const [newTest, setNewTest] = useState<MatrixTestInfo>({ code: '', label: '', fullNameIndo: '', fullNameEn: '', sniStandard: '', sniTitle: '' });

  // 2. Container State
  const [editingContainerId, setEditingContainerId] = useState<string | null>(null);
  const [editingContainerWeight, setEditingContainerWeight] = useState<number>(0);
  const [isAddingContainer, setIsAddingContainer] = useState(false);
  const [newContainerNo, setNewContainerNo] = useState('');
  const [newContainerWeight, setNewContainerWeight] = useState('');

  // 3. Ring State
  const [editingRingNo, setEditingRingNo] = useState<string | null>(null);
  const [editingRingData, setEditingRingData] = useState<RingItem | null>(null);
  const [isAddingRing, setIsAddingRing] = useState(false);
  const [newRing, setNewRing] = useState({ ringNo: '', diameterMm: '', heightMm: '', weightGrams: '' });

  // 3b. Consol Ring State
  const [editingConsolRingNo, setEditingConsolRingNo] = useState<string | null>(null);
  const [editingConsolRingData, setEditingConsolRingData] = useState<ConsolRingItem | null>(null);
  const [isAddingConsolRing, setIsAddingConsolRing] = useState(false);
  const [newConsolRing, setNewConsolRing] = useState({ ringNo: '', diameterMm: '50.50', heightMm: '20.00', weightGrams: '' });

  // 3c. DS Ring & Proving Calibration State
  const [editingDsProvingCode, setEditingDsProvingCode] = useState<string | null>(null);
  const [editingDsProvingRaw, setEditingDsProvingRaw] = useState<{ machineCode: string; provingCalibration: string; capacityKg: string } | null>(null);
  const [isAddingDsProving, setIsAddingDsProving] = useState(false);
  const [newDsProving, setNewDsProving] = useState({ machineCode: '', provingCalibration: '0.4067', capacityKg: '300' });

  const [editingDsRingNo, setEditingDsRingNo] = useState<string | null>(null);
  const [editingDsRingRaw, setEditingDsRingRaw] = useState<{ ringNo: string; provingCalibration: string; diameterMm: string; heightMm: string; weightGrams: string } | null>(null);
  const [isAddingDsRing, setIsAddingDsRing] = useState(false);
  const [newDsRing, setNewDsRing] = useState({ ringNo: '', provingCalibration: '0.4067', diameterMm: '59.4', heightMm: '24.9', weightGrams: '63.16' });

  // 3d. TRX Proving Ring State
  const [editingTrxRingNo, setEditingTrxRingNo] = useState<string | null>(null);
  const [editingTrxRingRaw, setEditingTrxRingRaw] = useState<{ ringNo: string; provingCalibration: string; capacityKg: string } | null>(null);
  const [isAddingTrxRing, setIsAddingTrxRing] = useState(false);
  const [newTrxRing, setNewTrxRing] = useState({ ringNo: '', provingCalibration: '0.12064', capacityKg: '300' });

  // 3e. UCT Proving Ring State
  const [editingUctRingNo, setEditingUctRingNo] = useState<string | null>(null);
  const [editingUctRingRaw, setEditingUctRingRaw] = useState<{ ringNo: string; provingCalibration: string; capacityKg: string } | null>(null);
  const [isAddingUctRing, setIsAddingUctRing] = useState(false);
  const [newUctRing, setNewUctRing] = useState({ ringNo: '', provingCalibration: '0.5778', capacityKg: '300' });

  // 4. Pycnometer State
  const [editingPycNo, setEditingPycNo] = useState<string | null>(null);
  const [editingPycData, setEditingPycData] = useState<PycnometerItem | null>(null);
  const [isAddingPyc, setIsAddingPyc] = useState(false);
  const [newPyc, setNewPyc] = useState({ pycNo: '', weightWater25: '', weightTare: '' });

  // 5. Personnel State
  const [personnelSearch, setPersonnelSearch] = useState('');
  const [personnelRoleFilter, setPersonnelRoleFilter] = useState<'all' | PersonnelRole>('all');
  const [editingPersonnelId, setEditingPersonnelId] = useState<string | null>(null);
  const [editingPersonnelData, setEditingPersonnelData] = useState<PersonnelItem | null>(null);
  const [isAddingPersonnel, setIsAddingPersonnel] = useState(false);
  const [newPersonnelName, setNewPersonnelName] = useState('');
  const [newPersonnelRole, setNewPersonnelRole] = useState<PersonnelRole>('Penguji');
  const [newPersonnelTitle, setNewPersonnelTitle] = useState('');

  // 6. Mold State
  const [editingMoldIndex, setEditingMoldIndex] = useState<number | null>(null);
  const [editingMoldData, setEditingMoldData] = useState<MoldItem | null>(null);
  const [isAddingMold, setIsAddingMold] = useState(false);
  const [newMold, setNewMold] = useState({ kode: '', kategori: 'Standard' as 'Standard' | 'Modified', diameterCm: '10.16', heightCm: '11.64', weightGrams: '4207.70' });

  // 7. Reamer State
  const [editingReamerIndex, setEditingReamerIndex] = useState<number | null>(null);
  const [editingReamerData, setEditingReamerData] = useState<ReamerItem | null>(null);
  const [isAddingReamer, setIsAddingReamer] = useState(false);
  const [newReamer, setNewReamer] = useState({ kode: '', kategori: 'Standard' as 'Standard' | 'Modified', weightKg: '2.50' });

  const formatDate = (isoStr?: string) => {
    try {
      const d = isoStr ? new Date(isoStr) : new Date("2026-08-10T08:00:00.000Z");
      if (isNaN(d.getTime())) return '10/08/2026 08:00';
      return d.toLocaleDateString('id-ID', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return '10/08/2026 08:00';
    }
  };

  // --- MOLD HANDLERS ---
  const handleSaveMoldEdit = () => {
    if (editingMoldIndex === null || !editingMoldData) return;
    const updated = (moldCatalogue || []).map((m, idx) => idx === editingMoldIndex ? { ...editingMoldData, updatedAt: new Date().toISOString() } : m);
    onUpdateMoldCatalogue(updated);
    setEditingMoldIndex(null);
    setEditingMoldData(null);
    showFeedback(`Data Mold "${editingMoldData.kode}" berhasil diperbarui.`);
  };

  const handleAddMold = () => {
    if (!newMold.kode.trim()) { alert('Kode mold harus diisi'); return; }
    const newItem: MoldItem = {
      kode: newMold.kode.trim(),
      kategori: newMold.kategori,
      diameterCm: parseFloat(newMold.diameterCm) || 10.16,
      heightCm: parseFloat(newMold.heightCm) || 11.64,
      weightGrams: parseFloat(newMold.weightGrams) || 4207.70,
      updatedAt: new Date().toISOString()
    };
    onUpdateMoldCatalogue([...(moldCatalogue || []), newItem]);
    setIsAddingMold(false);
    setNewMold({ kode: '', kategori: 'Standard', diameterCm: '10.16', heightCm: '11.64', weightGrams: '4207.70' });
    showFeedback(`Mold ${newItem.kode} (${newItem.kategori}) berhasil ditambahkan!`);
  };

  const handleDeleteMold = (index: number, kode: string) => {
    if (confirm(`Hapus Mold "${kode}"?`)) {
      const updated = (moldCatalogue || []).filter((_, idx) => idx !== index);
      onUpdateMoldCatalogue(updated);
      showFeedback(`Mold ${kode} berhasil dihapus.`);
    }
  };

  // --- REAMER HANDLERS ---
  const handleSaveReamerEdit = () => {
    if (editingReamerIndex === null || !editingReamerData) return;
    const updated = (reamerCatalogue || []).map((r, idx) => idx === editingReamerIndex ? { ...editingReamerData, updatedAt: new Date().toISOString() } : r);
    onUpdateReamerCatalogue(updated);
    setEditingReamerIndex(null);
    setEditingReamerData(null);
    showFeedback(`Data Reamer "${editingReamerData.kode}" berhasil diperbarui.`);
  };

  const handleAddReamer = () => {
    if (!newReamer.kode.trim()) { alert('Kode reamer harus diisi'); return; }
    const newItem: ReamerItem = {
      kode: newReamer.kode.trim(),
      kategori: newReamer.kategori,
      weightKg: parseFloat(newReamer.weightKg) || 2.50,
      updatedAt: new Date().toISOString()
    };
    onUpdateReamerCatalogue([...(reamerCatalogue || []), newItem]);
    setIsAddingReamer(false);
    setNewReamer({ kode: '', kategori: 'Standard', weightKg: '2.50' });
    showFeedback(`Reamer ${newItem.kode} (${newItem.kategori}) berhasil ditambahkan!`);
  };

  const handleDeleteReamer = (index: number, kode: string) => {
    if (confirm(`Hapus Reamer "${kode}"?`)) {
      const updated = (reamerCatalogue || []).filter((_, idx) => idx !== index);
      onUpdateReamerCatalogue(updated);
      showFeedback(`Reamer ${kode} berhasil dihapus.`);
    }
  };

  // --- PERSONNEL HANDLERS ---
  const handleSavePersonnelEdit = () => {
    if (!editingPersonnelData) return;
    const updated = personnelCatalogue.map(p => p.id === editingPersonnelData.id ? editingPersonnelData : p);
    onUpdatePersonnelCatalogue(updated);
    setEditingPersonnelId(null);
    setEditingPersonnelData(null);
    showFeedback(`Data personil ${editingPersonnelData.name} diperbarui.`);
  };

  const handleAddPersonnel = () => {
    const name = newPersonnelName.trim();
    if (!name) {
      alert('Nama personil harus diisi.');
      return;
    }
    const newItem: PersonnelItem = {
      id: `p-${Date.now()}`,
      name,
      role: newPersonnelRole,
      title: newPersonnelTitle.trim() || undefined
    };
    const updated = [...personnelCatalogue, newItem];
    onUpdatePersonnelCatalogue(updated);
    setNewPersonnelName('');
    setNewPersonnelTitle('');
    setIsAddingPersonnel(false);
    showFeedback(`Personil ${name} (${newPersonnelRole}) berhasil ditambahkan.`);
  };

  const handleDeletePersonnel = (id: string) => {
    if (confirm('Hapus personil ini?')) {
      const updated = personnelCatalogue.filter(c => c.id !== id);
      onUpdatePersonnelCatalogue(updated);
      showFeedback(`Personil dihapus.`);
    }
  };



  const handleUploadSignature = (personnelId: string, file: File) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('File harus berupa gambar (PNG, JPG, WEBP, SVG).');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      if (dataUrl) {
        const updated = personnelCatalogue.map(p => p.id === personnelId ? { ...p, signatureUrl: dataUrl, digitalSignatureUrl: dataUrl } : p);
        onUpdatePersonnelCatalogue(updated);
        showFeedback(`Tanda tangan digital berhasil diunggah.`);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveSignature = (personnelId: string, name: string) => {
    if (!confirm(`Hapus tanda tangan personil "${name}"?`)) return;
    const updated = personnelCatalogue.map(p => p.id === personnelId ? { ...p, signatureUrl: undefined, digitalSignatureUrl: undefined } : p);
    onUpdatePersonnelCatalogue(updated);
    showFeedback(`Tanda tangan ${name} dihapus.`);
  };

  // 5. Sample Type State
  const [editingSampleTypeIndex, setEditingSampleTypeIndex] = useState<number | null>(null);
  const [editingSampleTypeValue, setEditingSampleTypeValue] = useState('');
  const [isAddingSampleType, setIsAddingSampleType] = useState(false);
  const [newSampleTypeValue, setNewSampleTypeValue] = useState('');

  const showFeedback = (msg: string) => {
    setSavedFeedback(msg);
    setTimeout(() => setSavedFeedback(null), 2500);
  };

  // --- CONTAINER HANDLERS ---
  const handleSaveContainerEdit = (id: string) => {
    const updated = containerCatalogue.map(c => c.id === id ? { ...c, weight: editingContainerWeight, updatedAt: new Date().toISOString() } : c);
    onUpdateContainerCatalogue(updated);
    setEditingContainerId(null);
    showFeedback(`Berat cawan No. ${id} diperbarui menjadi ${editingContainerWeight}g.`);
  };

  const handleAddContainer = () => {
    const noStr = newContainerNo.trim();
    const wtNum = parseFloat(newContainerWeight);
    if (!noStr || isNaN(wtNum)) {
      alert('Nomor cawan dan berat harus diisi dengan angka valid.');
      return;
    }
    if (containerCatalogue.some(c => c.id === noStr)) {
      alert(`Cawan No. "${noStr}" sudah ada.`);
      return;
    }
    const updated = [...containerCatalogue, { id: noStr, weight: wtNum, updatedAt: new Date().toISOString() }];
    updated.sort((a, b) => (parseInt(a.id) || 0) - (parseInt(b.id) || 0));
    onUpdateContainerCatalogue(updated);
    setNewContainerNo('');
    setNewContainerWeight('');
    setIsAddingContainer(false);
    showFeedback(`Cawan No. ${noStr} (${wtNum}g) berhasil ditambahkan.`);
  };

  const handleDeleteContainer = (id: string) => {
    if (!confirm(`Hapus data Cawan No. ${id}?`)) return;
    const updated = containerCatalogue.filter(c => c.id !== id);
    onUpdateContainerCatalogue(updated);
    showFeedback(`Cawan No. ${id} dihapus.`);
  };

  // --- RING HANDLERS ---
  const handleSaveRingEdit = () => {
    if (!editingRingData) return;
    const vol = (Math.PI * Math.pow(editingRingData.diameterMm / 2, 2) * editingRingData.heightMm) / 1000;
    const finalData = { ...editingRingData, volumeCm3: parseFloat(vol.toFixed(3)) };
    const updated = ringCatalogue.map(r => r.ringNo === editingRingData.ringNo ? finalData : r);
    onUpdateRingCatalogue(updated);
    setEditingRingNo(null);
    setEditingRingData(null);
    showFeedback(`Data Ring No. ${editingRingData.ringNo} diperbarui.`);
  };

  const handleAddRing = () => {
    const rNo = newRing.ringNo.trim();
    const dia = localeParseFloat(newRing.diameterMm);
    const ht = localeParseFloat(newRing.heightMm);
    const wt = localeParseFloat(newRing.weightGrams);

    if (!rNo || isNaN(dia) || isNaN(ht) || isNaN(wt)) {
      alert('Semua parameter ring harus diisi dengan angka valid.');
      return;
    }
    if (ringCatalogue.some(r => r.ringNo === rNo)) {
      alert(`Ring No. "${rNo}" sudah terdaftar.`);
      return;
    }

    const vol = parseFloat(((Math.PI * Math.pow(dia / 2, 2) * ht) / 1000).toFixed(3));
    const newItem: RingItem = { ringNo: rNo, diameterMm: dia, heightMm: ht, weightGrams: wt, volumeCm3: vol };
    const updated = [...ringCatalogue, newItem].sort((a, b) => (parseInt(a.ringNo) || 0) - (parseInt(b.ringNo) || 0));
    onUpdateRingCatalogue(updated);
    setNewRing({ ringNo: '', diameterMm: '', heightMm: '', weightGrams: '' });
    setIsAddingRing(false);
    showFeedback(`Ring No. ${rNo} berhasil ditambahkan.`);
  };

  const handleDeleteRing = (ringNo: string) => {
    if (!confirm(`Hapus data Ring No. ${ringNo}?`)) return;
    const updated = ringCatalogue.filter(r => r.ringNo !== ringNo);
    onUpdateRingCatalogue(updated);
    showFeedback(`Ring No. ${ringNo} dihapus.`);
  };

  // --- CONSOL RING HANDLERS ---
  const handleSaveConsolRingEdit = () => {
    if (!editingConsolRingData) return;
    const dia = editingConsolRingData.diameterMm || 63.5;
    const ht = editingConsolRingData.heightMm || 20.0;
    const vol = parseFloat(((Math.PI * Math.pow(dia / 2, 2) * ht) / 1000).toFixed(3));
    const updated = consolRingCatalogue.map(r => r.ringNo === editingConsolRingData.ringNo ? { ...editingConsolRingData, volumeCm3: vol } : r);
    onUpdateConsolRingCatalogue(updated);
    setEditingConsolRingNo(null);
    setEditingConsolRingData(null);
    showFeedback(`Data kalibrasi Ring Consol No. ${editingConsolRingData.ringNo} diperbarui.`);
  };

  const handleAddConsolRing = () => {
    const rNo = newConsolRing.ringNo.trim();
    const dia = localeParseFloat(newConsolRing.diameterMm) || 50.5;
    const ht = localeParseFloat(newConsolRing.heightMm) || 20.0;
    const wt = localeParseFloat(newConsolRing.weightGrams);

    if (!rNo || isNaN(wt)) {
      alert('Mohon isi Nomor Ring dan Berat Kosong Ring!');
      return;
    }
    if (consolRingCatalogue.some(r => r.ringNo === rNo)) {
      alert(`Ring Consol No. "${rNo}" sudah terdaftar.`);
      return;
    }

    const vol = parseFloat(((Math.PI * Math.pow(dia / 2, 2) * ht) / 1000).toFixed(3));
    const newItem: ConsolRingItem = { ringNo: rNo, diameterMm: dia, heightMm: ht, weightGrams: wt, volumeCm3: vol };
    const updated = [...consolRingCatalogue, newItem];
    onUpdateConsolRingCatalogue(updated);
    setNewConsolRing({ ringNo: '', diameterMm: '50.50', heightMm: '20.00', weightGrams: '' });
    setIsAddingConsolRing(false);
    showFeedback(`Ring Consol No. ${rNo} berhasil ditambahkan.`);
  };

  const handleDeleteConsolRing = (ringNo: string) => {
    if (!confirm(`Hapus data Ring Consol No. ${ringNo}?`)) return;
    const updated = consolRingCatalogue.filter(r => r.ringNo !== ringNo);
    onUpdateConsolRingCatalogue(updated);
    showFeedback(`Ring Consol No. ${ringNo} dihapus.`);
  };

  // --- DS PROVING RING MACHINE HANDLERS ---
  const handleSaveDsProvingEdit = () => {
    if (!editingDsProvingRaw) return;
    const calib = localeParseFloat(editingDsProvingRaw.provingCalibration) || 0.4067;
    const cap = localeParseFloat(editingDsProvingRaw.capacityKg) || 300;
    const updated = dsProvingCatalogue.map(item => item.machineCode === editingDsProvingRaw.machineCode ? {
      machineCode: editingDsProvingRaw.machineCode,
      provingCalibration: calib,
      capacityKg: cap,
      updatedAt: new Date().toISOString()
    } : item);
    onUpdateDsProvingCatalogue(updated);
    setEditingDsProvingCode(null);
    setEditingDsProvingRaw(null);
    showFeedback(`Data Proving Ring Mesin DS ${editingDsProvingRaw.machineCode} diperbarui.`);
  };

  const handleAddDsProving = () => {
    const code = newDsProving.machineCode.trim();
    const calib = localeParseFloat(newDsProving.provingCalibration) || 0.4067;
    const cap = localeParseFloat(newDsProving.capacityKg) || 300;

    if (!code || isNaN(calib)) {
      alert('Nama/Kode Mesin DS & Kalibrasi harus diisi angka valid.');
      return;
    }
    if (dsProvingCatalogue.some(m => m.machineCode === code)) {
      alert(`Mesin DS "${code}" sudah terdaftar.`);
      return;
    }

    const newItem: DsProvingItem = { machineCode: code, provingCalibration: calib, capacityKg: cap, updatedAt: new Date().toISOString() };
    onUpdateDsProvingCatalogue([...dsProvingCatalogue, newItem]);
    setNewDsProving({ machineCode: '', provingCalibration: '0.4067', capacityKg: '300' });
    setIsAddingDsProving(false);
    showFeedback(`Mesin DS ${code} berhasil ditambahkan.`);
  };

  const handleDeleteDsProving = (machineCode: string) => {
    if (!confirm(`Hapus kalibrasi Proving Ring Mesin DS ${machineCode}?`)) return;
    onUpdateDsProvingCatalogue(dsProvingCatalogue.filter(m => m.machineCode !== machineCode));
    showFeedback(`Proving Ring Mesin DS ${machineCode} dihapus.`);
  };

  // --- DS RING HANDLERS ---
  const handleSaveDsRingEdit = () => {
    if (!editingDsRingRaw) return;
    const calib = localeParseFloat(editingDsRingRaw.provingCalibration) || 0.4067;
    const dia = localeParseFloat(editingDsRingRaw.diameterMm) || 59.4;
    const ht = localeParseFloat(editingDsRingRaw.heightMm) || 24.9;
    const wt = localeParseFloat(editingDsRingRaw.weightGrams) || 63.16;
    const vol = parseFloat(((Math.PI * Math.pow(dia / 2, 2) * ht) / 1000).toFixed(3));
    const updated = dsRingCatalogue.map(r => r.ringNo === editingDsRingRaw.ringNo ? {
      ringNo: editingDsRingRaw.ringNo,
      provingCalibration: calib,
      diameterMm: dia,
      heightMm: ht,
      weightGrams: wt,
      volumeCm3: vol
    } : r);
    onUpdateDsRingCatalogue(updated);
    setEditingDsRingNo(null);
    setEditingDsRingRaw(null);
    showFeedback(`Data kalibrasi Ring DS No. ${editingDsRingRaw.ringNo} diperbarui.`);
  };

  const handleAddDsRing = () => {
    const rNo = newDsRing.ringNo.trim();
    const calib = localeParseFloat(newDsRing.provingCalibration) || 0.4067;
    const dia = localeParseFloat(newDsRing.diameterMm) || 59.4;
    const ht = localeParseFloat(newDsRing.heightMm) || 24.9;
    const wt = localeParseFloat(newDsRing.weightGrams) || 63.16;

    if (!rNo || isNaN(calib)) {
      alert('Semua parameter Ring DS & Kalibrasi harus diisi angka valid.');
      return;
    }
    if (dsRingCatalogue.some(r => r.ringNo === rNo)) {
      alert(`Ring DS No. "${rNo}" sudah terdaftar.`);
      return;
    }

    const vol = parseFloat(((Math.PI * Math.pow(dia / 2, 2) * ht) / 1000).toFixed(3));
    const newItem: DsRingItem = { ringNo: rNo, provingCalibration: calib, diameterMm: dia, heightMm: ht, weightGrams: wt, volumeCm3: vol };
    const updated = [...dsRingCatalogue, newItem];
    onUpdateDsRingCatalogue(updated);
    setNewDsRing({ ringNo: '', provingCalibration: '0.4067', diameterMm: '59.4', heightMm: '24.9', weightGrams: '63.16' });
    setIsAddingDsRing(false);
    showFeedback(`Ring DS No. ${rNo} berhasil ditambahkan.`);
  };

  const handleDeleteDsRing = (ringNo: string) => {
    if (!confirm(`Hapus data Ring DS No. ${ringNo}?`)) return;
    const updated = dsRingCatalogue.filter(r => r.ringNo !== ringNo);
    onUpdateDsRingCatalogue(updated);
    showFeedback(`Ring DS No. ${ringNo} dihapus.`);
  };

  // --- TRX RING HANDLERS ---
  const handleSaveTrxRingEdit = () => {
    if (!editingTrxRingRaw) return;
    const calib = localeParseFloat(editingTrxRingRaw.provingCalibration) || 0.12064;
    const cap = localeParseFloat(editingTrxRingRaw.capacityKg) || 300;
    const updated = trxRingCatalogue.map(r => r.ringNo === editingTrxRingRaw.ringNo ? {
      ringNo: editingTrxRingRaw.ringNo,
      provingCalibration: calib,
      capacityKg: cap,
      updatedAt: new Date().toISOString()
    } : r);
    onUpdateTrxRingCatalogue(updated);
    setEditingTrxRingNo(null);
    setEditingTrxRingRaw(null);
    showFeedback(`Data kalibrasi Ring TRX ${editingTrxRingRaw.ringNo} diperbarui.`);
  };

  const handleAddTrxRing = () => {
    const rNo = newTrxRing.ringNo.trim();
    const calib = localeParseFloat(newTrxRing.provingCalibration) || 0.12064;
    const cap = localeParseFloat(newTrxRing.capacityKg) || 300;

    if (!rNo || isNaN(calib)) {
      alert('Nama Ring TRX & Kalibrasi harus diisi angka valid.');
      return;
    }
    if (trxRingCatalogue.some(r => r.ringNo === rNo)) {
      alert(`Ring TRX "${rNo}" sudah terdaftar.`);
      return;
    }

    const newItem: TrxRingItem = { ringNo: rNo, provingCalibration: calib, capacityKg: cap, updatedAt: new Date().toISOString() };
    onUpdateTrxRingCatalogue([...trxRingCatalogue, newItem]);
    setNewTrxRing({ ringNo: '', provingCalibration: '0.12064', capacityKg: '300' });
    setIsAddingTrxRing(false);
    showFeedback(`Ring TRX ${rNo} berhasil ditambahkan.`);
  };

  const handleDeleteTrxRing = (ringNo: string) => {
    if (!confirm(`Hapus Ring TRX ${ringNo}?`)) return;
    onUpdateTrxRingCatalogue(trxRingCatalogue.filter(r => r.ringNo !== ringNo));
    showFeedback(`Ring TRX ${ringNo} dihapus.`);
  };

  // --- UCT RING HANDLERS ---
  const handleSaveUctRingEdit = () => {
    if (!editingUctRingRaw) return;
    const calib = localeParseFloat(editingUctRingRaw.provingCalibration) || 0.5778;
    const cap = localeParseFloat(editingUctRingRaw.capacityKg) || 300;
    const updated = uctRingCatalogue.map(r => r.ringNo === editingUctRingRaw.ringNo ? {
      ringNo: editingUctRingRaw.ringNo,
      provingCalibration: calib,
      capacityKg: cap,
      updatedAt: new Date().toISOString()
    } : r);
    onUpdateUctRingCatalogue(updated);
    setEditingUctRingNo(null);
    setEditingUctRingRaw(null);
    showFeedback(`Data kalibrasi Ring UCT ${editingUctRingRaw.ringNo} diperbarui.`);
  };

  const handleAddUctRing = () => {
    const rNo = newUctRing.ringNo.trim();
    const calib = localeParseFloat(newUctRing.provingCalibration) || 0.5778;
    const cap = localeParseFloat(newUctRing.capacityKg) || 300;

    if (!rNo || isNaN(calib)) {
      alert('Nama Ring UCT & Kalibrasi harus diisi angka valid.');
      return;
    }
    if (uctRingCatalogue.some(r => r.ringNo === rNo)) {
      alert(`Ring UCT "${rNo}" sudah terdaftar.`);
      return;
    }

    const newItem: UctRingItem = { ringNo: rNo, provingCalibration: calib, capacityKg: cap, updatedAt: new Date().toISOString() };
    onUpdateUctRingCatalogue([...uctRingCatalogue, newItem]);
    setNewUctRing({ ringNo: '', provingCalibration: '0.5778', capacityKg: '300' });
    setIsAddingUctRing(false);
    showFeedback(`Ring UCT ${rNo} berhasil ditambahkan.`);
  };

  const handleDeleteUctRing = (ringNo: string) => {
    if (!confirm(`Hapus Ring UCT ${ringNo}?`)) return;
    onUpdateUctRingCatalogue(uctRingCatalogue.filter(r => r.ringNo !== ringNo));
    showFeedback(`Ring UCT ${ringNo} dihapus.`);
  };

  // --- PYCNOMETER HANDLERS ---
  const handleSavePycEdit = () => {
    if (!editingPycData) return;
    const updated = pycCatalogue.map(p => p.pycNo === editingPycData.pycNo ? editingPycData : p);
    onUpdatePycCatalogue(updated);
    setEditingPycNo(null);
    setEditingPycData(null);
    showFeedback(`Data Piknometer No. ${editingPycData.pycNo} diperbarui.`);
  };

  const handleAddPyc = () => {
    const pNo = newPyc.pycNo.trim();
    const wWater = parseFloat(newPyc.weightWater25);
    const wTare = parseFloat(newPyc.weightTare);

    if (!pNo || isNaN(wWater) || isNaN(wTare)) {
      alert('Semua data piknometer harus diisi angka valid.');
      return;
    }
    if (pycCatalogue.some(p => p.pycNo === pNo)) {
      alert(`Piknometer No. "${pNo}" sudah terdaftar.`);
      return;
    }

    const newItem: PycnometerItem = { pycNo: pNo, weightWater25: wWater, weightTare: wTare };
    const updated = [...pycCatalogue, newItem].sort((a, b) => (parseInt(a.pycNo) || 0) - (parseInt(b.pycNo) || 0));
    onUpdatePycCatalogue(updated);
    setNewPyc({ pycNo: '', weightWater25: '', weightTare: '' });
    setIsAddingPyc(false);
    showFeedback(`Piknometer No. ${pNo} berhasil ditambahkan.`);
  };

  const handleDeletePyc = (pycNo: string) => {
    if (!confirm(`Hapus data Piknometer No. ${pycNo}?`)) return;
    const updated = pycCatalogue.filter(p => p.pycNo !== pycNo);
    onUpdatePycCatalogue(updated);
    showFeedback(`Piknometer No. ${pycNo} dihapus.`);
  };

  const isDsContainer = (cId: string) => {
    const clean = String(cId || '').trim().toUpperCase();
    return /^[A-Z]$/.test(clean) || clean.startsWith('DS-');
  };

  const numericContainers = (containerCatalogue || []).filter(c => c && !isDsContainer(c.id));
  const dsContainers = (containerCatalogue || []).filter(c => c && isDsContainer(c.id));

  const currentCategoryContainers = activeSubTab === 'ds_containers' ? dsContainers : numericContainers;

  const filteredContainers = currentCategoryContainers.filter(c => {
    if (!c) return false;
    const q = (containerSearch || '').toLowerCase().trim();
    if (!q) return true;

    const matchId = (c.id || '').toString().toLowerCase().includes(q);

    const rawWeight = c.weight !== undefined && c.weight !== null ? c.weight : (c as any).weightGrams;
    const weightNum = typeof rawWeight === 'number' ? rawWeight : parseFloat(rawWeight) || 0;
    const weightStr = weightNum.toString();
    const weightFixed3 = weightNum.toFixed(3);
    const weightFixed2 = weightNum.toFixed(2);
    
    const matchWeight = rawWeight != null && (weightStr.includes(q) || weightFixed3.includes(q) || weightFixed2.includes(q));

    return matchId || matchWeight;
  });
  const filteredRings = ringCatalogue.filter(r => r.ringNo.toLowerCase().includes(ringSearch.toLowerCase()));
  const filteredPycs = pycCatalogue.filter(p => p.pycNo.toLowerCase().includes(pycSearch.toLowerCase()));
  const filteredTests = testCatalogue.filter(t => t.code.toLowerCase().includes(testSearch.toLowerCase()) || t.fullNameIndo.toLowerCase().includes(testSearch.toLowerCase()));
  const filteredPersonnel = personnelCatalogue.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(personnelSearch.toLowerCase()) || (p.title || '').toLowerCase().includes(personnelSearch.toLowerCase());
    const matchesRole = personnelRoleFilter === 'all' || p.role === personnelRoleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="p-3.5 sm:p-4 space-y-3.5 w-full min-w-0">
      {/* Toast Feedback */}
      {savedFeedback && (
        <div className="fixed top-5 right-5 z-50 bg-emerald-600 text-white px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2 text-sm font-semibold">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{savedFeedback}</span>
        </div>
      )}

      {/* Header */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-teal-600 text-white shadow-md shadow-teal-600/20">
              <Settings className="w-5 h-5" />
            </div>
            Pengaturan &amp; Master Data Lab
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            Kelola master personil tim lab (Penguji, Analyst, Computed, Approver), katalog pengujian, tara berat cawan, kalibrasi ring density, piknometer, mold, dan reamer pemadatan.
          </p>
        </div>
      </div>

      {/* ─── 4 CATEGORY MAIN CARDS NAVIGATION ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 w-full">
        {/* CATEGORY 0: KOP SURAT & PROFIL LAB */}
        <button
          onClick={() => setActiveSubTab('company_profile')}
          className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between shadow-xs ${
            activeSubTab === 'company_profile'
              ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-500 ring-2 ring-blue-500/20'
              : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${activeSubTab === 'company_profile' ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20' : 'bg-slate-100 text-slate-600'}`}>
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-extrabold text-slate-900">Kop Surat &amp; Profil Lab</h4>
              <p className="text-[10px] text-slate-500 font-medium">Logo, Cap Stempel, Rekening, TTD</p>
            </div>
          </div>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-100 text-blue-800">
            Form
          </span>
        </button>

        {/* CATEGORY 1: TARIF & KATALOG */}
        <button
          onClick={() => {
            if (!['prices', 'tests', 'sample_types'].includes(activeSubTab)) {
              setActiveSubTab('prices');
            }
          }}
          className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between shadow-xs ${
            ['prices', 'tests', 'sample_types'].includes(activeSubTab)
              ? 'bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-500 ring-2 ring-emerald-500/20'
              : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${['prices', 'tests', 'sample_types'].includes(activeSubTab) ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20' : 'bg-slate-100 text-slate-600'}`}>
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-extrabold text-slate-900">1. Tarif &amp; Katalog Uji</h4>
              <p className="text-[10px] text-slate-500 font-medium">3 Tier Harga, Standar SNI, Tipe Sampel</p>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800">
            {masterPrices.length} Uji
          </span>
        </button>

        {/* CATEGORY 2: TIM & PERSONIL */}
        <button
          onClick={() => setActiveSubTab('personnel')}
          className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between shadow-xs ${
            activeSubTab === 'personnel'
              ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-500 ring-2 ring-blue-500/20'
              : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${activeSubTab === 'personnel' ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20' : 'bg-slate-100 text-slate-600'}`}>
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-extrabold text-slate-900">2. Tim Lab &amp; TTD Digital</h4>
              <p className="text-[10px] text-slate-500 font-medium">Penguji, Analyst, Checker, TTD</p>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-blue-100 text-blue-800">
            {personnelCatalogue.length} Tim
          </span>
        </button>

        {/* CATEGORY 3: PERALATAN & KALIBRASI ALAT */}
        <button
          onClick={() => {
            if (!['containers', 'ds_containers', 'rings', 'consol_rings', 'ds_rings', 'trx_rings', 'uct_rings', 'pycnometers', 'molds', 'cbr_molds', 'reamers', 'cbr_reamers'].includes(activeSubTab)) {
              setActiveSubTab('containers');
            }
          }}
          className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between shadow-xs ${
            ['containers', 'ds_containers', 'rings', 'consol_rings', 'ds_rings', 'trx_rings', 'uct_rings', 'pycnometers', 'molds', 'cbr_molds', 'reamers', 'cbr_reamers'].includes(activeSubTab)
              ? 'bg-gradient-to-r from-amber-50 to-orange-50 border-amber-500 ring-2 ring-amber-500/20'
              : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${['containers', 'ds_containers', 'rings', 'consol_rings', 'ds_rings', 'trx_rings', 'uct_rings', 'pycnometers', 'molds', 'cbr_molds', 'reamers', 'cbr_reamers'].includes(activeSubTab) ? 'bg-amber-600 text-white shadow-md shadow-amber-600/20' : 'bg-slate-100 text-slate-600'}`}>
              <Box className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-extrabold text-slate-900">3. Peralatan &amp; Kalibrasi</h4>
              <p className="text-[10px] text-slate-500 font-medium">Cawan, Ring Density, Consol, DS, TRX, UCT, Pikno, Mold, Reamer</p>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-800 font-mono">
            {containerCatalogue.length + ringCatalogue.length + consolRingCatalogue.length + dsRingCatalogue.length + trxRingCatalogue.length + uctRingCatalogue.length + pycCatalogue.length + (moldCatalogue?.length || 0) + (reamerCatalogue?.length || 0)} Alat
          </span>
        </button>
      </div>

      {/* ─── SUB-SEGMENTED PILL CONTROLS FOR ACTIVE CATEGORY ─── */}
      {activeSubTab !== 'company_profile' && (
        <div className="bg-slate-100/90 p-2 rounded-2xl border border-slate-200/90 w-full shadow-xs">
        {/* SUB-TABS DARI KATEGORI 1 (TARIF & KATALOG) */}
        {['prices', 'tests', 'sample_types'].includes(activeSubTab) && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 w-full">
            <button
              onClick={() => setActiveSubTab('prices')}
              className={`px-4 py-2.5 rounded-xl text-xs font-extrabold flex items-center justify-between transition-all cursor-pointer ${
                activeSubTab === 'prices'
                  ? 'bg-white text-emerald-800 shadow-sm ring-1 ring-slate-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <div className="flex items-center gap-2">
                <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                <span>Master Tarif 3-Tier Harga</span>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-100 text-emerald-800 font-mono">{masterPrices.length}</span>
            </button>
            <button
              onClick={() => setActiveSubTab('tests')}
              className={`px-4 py-2.5 rounded-xl text-xs font-extrabold flex items-center justify-between transition-all cursor-pointer ${
                activeSubTab === 'tests'
                  ? 'bg-white text-emerald-800 shadow-sm ring-1 ring-slate-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <div className="flex items-center gap-2">
                <FlaskConical className="w-3.5 h-3.5 text-teal-600" />
                <span>Katalog Standar SNI Matrix</span>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-teal-100 text-teal-800 font-mono">{testCatalogue.length}</span>
            </button>
            <button
              onClick={() => setActiveSubTab('sample_types')}
              className={`px-4 py-2.5 rounded-xl text-xs font-extrabold flex items-center justify-between transition-all cursor-pointer ${
                activeSubTab === 'sample_types'
                  ? 'bg-white text-emerald-800 shadow-sm ring-1 ring-slate-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <div className="flex items-center gap-2">
                <Tag className="w-3.5 h-3.5 text-cyan-600" />
                <span>Tipe &amp; Jenis Sampel</span>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-cyan-100 text-cyan-800 font-mono">{sampleTypeCatalogue.length}</span>
            </button>
          </div>
        )}

        {/* SUB-TABS DARI KATEGORI 2 (TIM & PERSONIL) */}
        {activeSubTab === 'personnel' && (
          <div className="w-full">
            <button
              onClick={() => setActiveSubTab('personnel')}
              className="w-full px-4 py-2.5 rounded-xl text-xs font-extrabold flex items-center justify-between bg-white text-blue-800 shadow-sm ring-1 ring-slate-200 cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                <span>Master Personil, Jabatan &amp; Tanda Tangan Digital</span>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-blue-100 text-blue-800 font-mono">{personnelCatalogue.length} Personil</span>
            </button>
          </div>
        )}

        {/* SUB-TABS DARI KATEGORI 3 (PERALATAN & KALIBRASI) */}
        {['containers', 'ds_containers', 'rings', 'consol_rings', 'ds_rings', 'trx_rings', 'uct_rings', 'pycnometers', 'molds', 'cbr_molds', 'reamers', 'cbr_reamers'].includes(activeSubTab) && (
          <div className="flex flex-wrap items-center gap-1.5 w-full">
            <button
              onClick={() => setActiveSubTab('containers')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                activeSubTab === 'containers'
                  ? 'bg-white text-amber-800 shadow-sm ring-1 ring-slate-200 font-extrabold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <Box className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span>Cawan (Kadar Air)</span>
              <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-amber-100 text-amber-800 font-mono shrink-0 ml-0.5">{numericContainers.length}</span>
            </button>
            <button
              onClick={() => setActiveSubTab('ds_containers')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                activeSubTab === 'ds_containers'
                  ? 'bg-white text-purple-800 shadow-sm ring-1 ring-slate-200 font-extrabold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <Box className="w-3.5 h-3.5 text-purple-600 shrink-0" />
              <span>Cawan DS</span>
              <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-purple-100 text-purple-800 font-mono shrink-0 ml-0.5">{dsContainers.length}</span>
            </button>
            <button
              onClick={() => setActiveSubTab('rings')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                activeSubTab === 'rings'
                  ? 'bg-white text-amber-800 shadow-sm ring-1 ring-slate-200 font-extrabold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <CircleDot className="w-3.5 h-3.5 text-orange-600 shrink-0" />
              <span>Ring Density</span>
              <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-orange-100 text-orange-800 font-mono shrink-0 ml-0.5">{ringCatalogue.length}</span>
            </button>
            <button
              onClick={() => setActiveSubTab('consol_rings')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                activeSubTab === 'consol_rings'
                  ? 'bg-white text-amber-800 shadow-sm ring-1 ring-slate-200 font-extrabold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <CircleDot className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span>Ring Consol</span>
              <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-amber-100 text-amber-800 font-mono shrink-0 ml-0.5">{consolRingCatalogue.length}</span>
            </button>
            <button
              onClick={() => setActiveSubTab('ds_rings')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                activeSubTab === 'ds_rings'
                  ? 'bg-white text-purple-800 shadow-sm ring-1 ring-slate-200 font-extrabold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <CircleDot className="w-3.5 h-3.5 text-purple-600 shrink-0" />
              <span>Ring Cetak DS</span>
              <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-purple-100 text-purple-800 font-mono shrink-0 ml-0.5">{dsRingCatalogue.length}</span>
            </button>
            <button
              onClick={() => setActiveSubTab('trx_rings')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                activeSubTab === 'trx_rings'
                  ? 'bg-white text-purple-800 shadow-sm ring-1 ring-slate-200 font-extrabold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <CircleDot className="w-3.5 h-3.5 text-purple-600 shrink-0" />
              <span>Proving Ring TRX</span>
              <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-purple-100 text-purple-800 font-mono shrink-0 ml-0.5">{trxRingCatalogue.length}</span>
            </button>
            <button
              onClick={() => setActiveSubTab('uct_rings')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                activeSubTab === 'uct_rings'
                  ? 'bg-white text-blue-800 shadow-sm ring-1 ring-slate-200 font-extrabold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <CircleDot className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span>Proving Ring UCT</span>
              <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-blue-100 text-blue-800 font-mono shrink-0 ml-0.5">{uctRingCatalogue.length}</span>
            </button>
            <button
              onClick={() => setActiveSubTab('pycnometers')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                activeSubTab === 'pycnometers'
                  ? 'bg-white text-teal-800 shadow-sm ring-1 ring-slate-200 font-extrabold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <Pipette className="w-3.5 h-3.5 text-teal-600 shrink-0" />
              <span>Piknometer</span>
              <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-teal-100 text-teal-800 font-mono shrink-0 ml-0.5">{pycCatalogue.length}</span>
            </button>
            <button
              onClick={() => setActiveSubTab('molds')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                activeSubTab === 'molds'
                  ? 'bg-white text-orange-800 shadow-sm ring-1 ring-slate-200 font-extrabold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <Box className="w-3.5 h-3.5 text-orange-600 shrink-0" />
              <span>Mold Compaction</span>
              <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-orange-100 text-orange-800 font-mono shrink-0 ml-0.5">
                {(moldCatalogue || []).filter(m => m.kategori !== 'CBR').length}
              </span>
            </button>
            <button
              onClick={() => setActiveSubTab('cbr_molds')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                activeSubTab === 'cbr_molds'
                  ? 'bg-white text-teal-800 shadow-sm ring-1 ring-slate-200 font-extrabold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <Box className="w-3.5 h-3.5 text-teal-600 shrink-0" />
              <span>Master Mold CBR</span>
              <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-teal-100 text-teal-800 font-mono shrink-0 ml-0.5">
                {(moldCatalogue || []).filter(m => m.kategori === 'CBR').length}
              </span>
            </button>
            <button
              onClick={() => setActiveSubTab('reamers')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                activeSubTab === 'reamers'
                  ? 'bg-white text-amber-800 shadow-sm ring-1 ring-slate-200 font-extrabold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <Box className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span>Reamer Compaction</span>
              <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-amber-100 text-amber-800 font-mono shrink-0 ml-0.5">
                {(reamerCatalogue || []).filter(r => r.kategori !== 'CBR').length}
              </span>
            </button>
            <button
              onClick={() => setActiveSubTab('cbr_reamers')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                activeSubTab === 'cbr_reamers'
                  ? 'bg-white text-emerald-800 shadow-sm ring-1 ring-slate-200 font-extrabold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <Box className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>Master Reamer CBR</span>
              <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-emerald-100 text-emerald-800 font-mono shrink-0 ml-0.5">
                {(reamerCatalogue || []).filter(r => r.kategori === 'CBR').length}
              </span>
            </button>
          </div>
        )}
      </div>
      )}

      {/* TAB: KOP SURAT & PROFIL PERUSAHAAN */}
      {activeSubTab === 'company_profile' && (
        <CompanyProfileSettingsView
          companyProfile={companyProfile}
          onSaveCompanyProfile={onUpdateCompanyProfile}
        />
      )}

      {/* TAB 0: MASTER TARIF & HARGA UJI (PRICES) */}
      {activeSubTab === 'prices' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-emerald-600" />
                Master Data Tarif &amp; Harga Uji Laboratorium (3 Tier Prices)
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Kelola daftar nama pengujian, standar SNI/ASTM, dan tarif harga untuk 3 kategori: <strong>Harga Geoland (Tier 1)</strong>, <strong>Harga BRS (Tier 2)</strong>, dan <strong>Harga Umum (Tier 3)</strong>.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  if (confirm('Kembalikan seluruh daftar harga ke setelan default laboratorium?')) {
                    setMasterPrices(INITIAL_MASTER_PRICE_CATALOG);
                    saveStoredMasterPrices(INITIAL_MASTER_PRICE_CATALOG);
                    showFeedback('Master Tarif berhasil di-reset ke nilai awal.');
                  }
                }}
                className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-red-50 border border-slate-200 hover:border-red-200 text-slate-700 hover:text-red-700 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset Master Tarif Default
              </button>
              <button
                onClick={() => setIsAddingPrice(true)}
                className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-600/20 transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Tambah Parameter Uji Baru
              </button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="flex items-center justify-between gap-4 pt-1">
            <div className="relative max-w-md w-full">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Cari Parameter / Kode / Standar SNI..."
                value={priceSearch}
                onChange={e => setPriceSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <span className="text-xs text-slate-500 font-semibold">
              Total {masterPrices.length} Jenis Pengujian
            </span>
          </div>

          {/* Add Price Item Form */}
          {isAddingPrice && (
            <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200 space-y-3 text-xs">
              <h4 className="font-bold text-emerald-900 flex items-center gap-1.5">
                <Plus className="w-4 h-4 text-emerald-600" />
                Tambah Parameter Pengujian &amp; Tarif Baru
              </h4>
              <div className="grid grid-cols-4 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Kode Uji (Short Code)</label>
                  <input
                    type="text"
                    placeholder="Contoh: DS-CD"
                    value={newPriceItem.code || ''}
                    onChange={e => setNewPriceItem({ ...newPriceItem, code: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-white font-mono uppercase"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Nama Parameter Pengujian</label>
                  <input
                    type="text"
                    placeholder="Contoh: Direct Shear CD"
                    value={newPriceItem.name || ''}
                    onChange={e => setNewPriceItem({ ...newPriceItem, name: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-white font-bold"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Standar Pengujian (SNI/ASTM)</label>
                  <input
                    type="text"
                    placeholder="Contoh: SNI 2813 : 2008"
                    value={newPriceItem.standard || ''}
                    onChange={e => setNewPriceItem({ ...newPriceItem, standard: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-white font-mono"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Satuan (Unit)</label>
                  <input
                    type="text"
                    placeholder="Sample / Project"
                    value={newPriceItem.unit || ''}
                    onChange={e => setNewPriceItem({ ...newPriceItem, unit: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 pt-1">
                <div className="bg-yellow-100/60 p-2 rounded-lg border border-yellow-300">
                  <label className="font-bold text-yellow-900 block mb-1">Harga Geoland (Rp)</label>
                  <input
                    type="number"
                    value={newPriceItem.priceGeoland || 0}
                    onChange={e => setNewPriceItem({ ...newPriceItem, priceGeoland: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-1.5 rounded-lg border border-yellow-400 bg-white font-mono font-bold text-right"
                  />
                </div>
                <div className="bg-teal-100/60 p-2 rounded-lg border border-teal-300">
                  <label className="font-bold text-teal-900 block mb-1">Harga BRS (Rp)</label>
                  <input
                    type="number"
                    value={newPriceItem.priceBRS || 0}
                    onChange={e => setNewPriceItem({ ...newPriceItem, priceBRS: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-1.5 rounded-lg border border-teal-400 bg-white font-mono font-bold text-right"
                  />
                </div>
                <div className="bg-blue-100/60 p-2 rounded-lg border border-blue-300">
                  <label className="font-bold text-blue-900 block mb-1">Harga Umum (Rp)</label>
                  <input
                    type="number"
                    value={newPriceItem.priceUmum || 0}
                    onChange={e => setNewPriceItem({ ...newPriceItem, priceUmum: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-1.5 rounded-lg border border-blue-400 bg-white font-mono font-bold text-right"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddingPrice(false)}
                  className="px-3 py-1.5 rounded-lg bg-slate-200 text-slate-700 font-bold"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!newPriceItem.name || !newPriceItem.code) {
                      alert('Nama dan Kode Pengujian harus diisi.');
                      return;
                    }
                    const newItem: MasterPriceItem = {
                      id: `mp-${Date.now()}`,
                      code: (newPriceItem.code || '').toUpperCase(),
                      name: newPriceItem.name || '',
                      standard: newPriceItem.standard || '-',
                      unit: newPriceItem.unit || 'Sample',
                      priceGeoland: newPriceItem.priceGeoland || 0,
                      priceBRS: newPriceItem.priceBRS || 0,
                      priceUmum: newPriceItem.priceUmum || 0
                    };
                    const updated = [newItem, ...masterPrices];
                    setMasterPrices(updated);
                    saveStoredMasterPrices(updated);
                    setIsAddingPrice(false);
                    setNewPriceItem({ code: '', name: '', standard: '-', unit: 'Sample', priceGeoland: 0, priceBRS: 0, priceUmum: 0 });
                    showFeedback(`Parameter "${newItem.name}" berhasil ditambahkan ke Master Tarif.`);
                  }}
                  className="px-4 py-1.5 rounded-lg bg-emerald-600 text-white font-bold shadow-md"
                >
                  Simpan Parameter Baru
                </button>
              </div>
            </div>
          )}

          {/* Table Price Catalog */}
          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                  <th className="py-2.5 px-3 w-10 text-center">No</th>
                  <th className="py-2.5 px-3 w-28">Kode Uji</th>
                  <th className="py-2.5 px-3">Nama Parameter Uji</th>
                  <th className="py-2.5 px-3">Standar (SNI / ASTM)</th>
                  <th className="py-2.5 px-3 text-center w-20">Satuan</th>
                  <th className="py-2.5 px-3 text-right bg-yellow-50 text-yellow-900 border-l border-slate-200 w-32">Harga Geoland (Rp)</th>
                  <th className="py-2.5 px-3 text-right bg-teal-50 text-teal-900 border-l border-slate-200 w-32">Harga BRS (Rp)</th>
                  <th className="py-2.5 px-3 text-right bg-blue-50 text-blue-900 border-l border-slate-200 w-32">Harga Umum (Rp)</th>
                  <th className="py-2.5 px-3 text-center w-20">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {masterPrices
                  .filter(m => 
                    m.name.toLowerCase().includes(priceSearch.toLowerCase()) || 
                    m.code.toLowerCase().includes(priceSearch.toLowerCase()) ||
                    m.standard.toLowerCase().includes(priceSearch.toLowerCase())
                  )
                  .map((item, idx) => {
                    const isEditing = editingPriceId === item.id;
                    const editObj = isEditing && editingPriceData ? editingPriceData : item;

                    return (
                      <tr key={item.id} className="hover:bg-slate-50 transition">
                        <td className="py-2 px-3 text-center font-bold text-slate-500">{idx + 1}</td>
                        <td className="py-2 px-3 font-mono font-bold text-slate-800">
                          {isEditing ? (
                            <input
                              type="text"
                              value={editObj.code}
                              onChange={e => setEditingPriceData({ ...editObj, code: e.target.value })}
                              className="w-full p-1 border border-slate-300 rounded font-mono font-bold uppercase"
                            />
                          ) : (
                            item.code
                          )}
                        </td>
                        <td className="py-2 px-3 font-semibold text-slate-900">
                          {isEditing ? (
                            <input
                              type="text"
                              value={editObj.name}
                              onChange={e => setEditingPriceData({ ...editObj, name: e.target.value })}
                              className="w-full p-1 border border-slate-300 rounded font-bold"
                            />
                          ) : (
                            item.name
                          )}
                        </td>
                        <td className="py-2 px-3 font-mono text-slate-600">
                          {isEditing ? (
                            <input
                              type="text"
                              value={editObj.standard}
                              onChange={e => setEditingPriceData({ ...editObj, standard: e.target.value })}
                              className="w-full p-1 border border-slate-300 rounded font-mono"
                            />
                          ) : (
                            item.standard
                          )}
                        </td>
                        <td className="py-2 px-3 text-center">
                          {isEditing ? (
                            <input
                              type="text"
                              value={editObj.unit}
                              onChange={e => setEditingPriceData({ ...editObj, unit: e.target.value })}
                              className="w-full p-1 border border-slate-300 rounded text-center"
                            />
                          ) : (
                            <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium">
                              {item.unit}
                            </span>
                          )}
                        </td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-yellow-900 bg-yellow-50/50 border-l border-slate-200">
                          {isEditing ? (
                            <input
                              type="number"
                              value={editObj.priceGeoland}
                              onChange={e => setEditingPriceData({ ...editObj, priceGeoland: parseFloat(e.target.value) || 0 })}
                              className="w-full p-1 border border-yellow-400 rounded text-right font-mono font-bold bg-white"
                            />
                          ) : (
                            item.priceGeoland === 0 ? 'Sesuai project' : `Rp ${item.priceGeoland.toLocaleString('id-ID')}`
                          )}
                        </td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-teal-900 bg-teal-50/50 border-l border-slate-200">
                          {isEditing ? (
                            <input
                              type="number"
                              value={editObj.priceBRS}
                              onChange={e => setEditingPriceData({ ...editObj, priceBRS: parseFloat(e.target.value) || 0 })}
                              className="w-full p-1 border border-teal-400 rounded text-right font-mono font-bold bg-white"
                            />
                          ) : (
                            item.priceBRS === 0 ? 'Sesuai project' : `Rp ${item.priceBRS.toLocaleString('id-ID')}`
                          )}
                        </td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-blue-900 bg-blue-50/50 border-l border-slate-200">
                          {isEditing ? (
                            <input
                              type="number"
                              value={editObj.priceUmum}
                              onChange={e => setEditingPriceData({ ...editObj, priceUmum: parseFloat(e.target.value) || 0 })}
                              className="w-full p-1 border border-blue-400 rounded text-right font-mono font-bold bg-white"
                            />
                          ) : (
                            item.priceUmum === 0 ? 'Sesuai project' : `Rp ${item.priceUmum.toLocaleString('id-ID')}`
                          )}
                        </td>
                        <td className="py-2 px-3 text-center space-x-1">
                          {isEditing ? (
                            <button
                              type="button"
                              onClick={() => {
                                const updated = masterPrices.map(m => m.id === item.id ? editObj : m);
                                setMasterPrices(updated);
                                saveStoredMasterPrices(updated);
                                setEditingPriceId(null);
                                setEditingPriceData(null);
                                showFeedback(`Harga &amp; Standar untuk "${editObj.name}" berhasil disimpan.`);
                              }}
                              className="p-1 text-emerald-600 hover:text-emerald-800 cursor-pointer"
                              title="Simpan Perubahan"
                            >
                              <Save className="w-4 h-4" />
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                setEditingPriceId(item.id);
                                setEditingPriceData(item);
                              }}
                              className="p-1 text-slate-600 hover:text-blue-600 cursor-pointer"
                              title="Edit Harga &amp; Standar"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              if (!confirm(`Hapus parameter uji "${item.name}" dari Master Tarif?`)) return;
                              const updated = masterPrices.filter(m => m.id !== item.id);
                              setMasterPrices(updated);
                              saveStoredMasterPrices(updated);
                              showFeedback(`Parameter "${item.name}" dihapus dari Master Tarif.`);
                            }}
                            className="p-1 text-red-500 hover:text-red-700 cursor-pointer"
                            title="Hapus Parameter"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 1: MASTER CAWAN (CONTAINERS & DS CONTAINERS) */}
      {(activeSubTab === 'containers' || activeSubTab === 'ds_containers') && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Box className={`w-5 h-5 ${activeSubTab === 'ds_containers' ? 'text-purple-600' : 'text-teal-600'}`} />
                <span>
                  {activeSubTab === 'ds_containers'
                    ? 'Master Data Cawan DS (Direct Shear - Huruf Alfabeta)'
                    : 'Master Data Cawan / Container (Kadar Air & Atterberg)'}
                </span>
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                {activeSubTab === 'ds_containers'
                  ? 'Master tara berat kosong cawan khusus pengujian Direct Shear (DS-UU, DS-CU, DS-CD) berformat huruf alfabeta (A, B, C... L).'
                  : 'Master tara berat kosong cawan yang digunakan pada Uji Moisture Content (MC) dan Atterberg Limits.'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsAddingContainer(true)}
                className={`px-3.5 py-1.5 rounded-xl text-white text-xs font-bold flex items-center gap-1.5 shadow-md transition cursor-pointer ${
                  activeSubTab === 'ds_containers'
                    ? 'bg-purple-600 hover:bg-purple-700 shadow-purple-600/20'
                    : 'bg-teal-600 hover:bg-teal-700 shadow-teal-600/20'
                }`}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{activeSubTab === 'ds_containers' ? 'Tambah Cawan DS Baru' : 'Tambah Cawan Baru'}</span>
              </button>
            </div>
          </div>

          {/* Search & Stats */}
          <div className="flex items-center justify-between gap-4 pt-2">
            <div className="relative max-w-md w-full">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder={activeSubTab === 'ds_containers' ? "Cari Cawan DS (misal: A, B)..." : "Cari No. Cawan (misal: 66)..."}
                value={containerSearch}
                onChange={e => setContainerSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-teal-500"
              />
            </div>
            <span className="text-xs text-slate-500 font-semibold">
              Menampilkan {filteredContainers.length} dari {activeSubTab === 'ds_containers' ? dsContainers.length : numericContainers.length} cawan
            </span>
          </div>

          {/* Form Add Container */}
          {isAddingContainer && (
            <div className="p-4 rounded-xl bg-teal-50/70 border border-teal-200 space-y-3">
              <h4 className="text-xs font-bold text-teal-900 flex items-center gap-1.5">
                <Plus className="w-4 h-4 text-teal-600" />
                Tambah Cawan Baru
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">No / ID Cawan</label>
                  <input
                    type="text"
                    placeholder="Contoh: 144"
                    value={newContainerNo}
                    onChange={e => setNewContainerNo(e.target.value)}
                    className="w-full text-xs px-3 py-1.5 rounded-lg border border-slate-300 bg-white"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">Berat Kosong Cawan (gram)</label>
                  <input
                    type="number"
                    step="0.001"
                    placeholder="Contoh: 8.925"
                    value={newContainerWeight}
                    onChange={e => setNewContainerWeight(e.target.value)}
                    className="w-full text-xs px-3 py-1.5 rounded-lg border border-slate-300 bg-white"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2 justify-end pt-1">
                <button
                  onClick={() => setIsAddingContainer(false)}
                  className="px-3 py-1 rounded-lg text-xs font-semibold text-slate-600 bg-slate-200 hover:bg-slate-300 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  onClick={handleAddContainer}
                  className="px-4 py-1 rounded-lg text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 cursor-pointer"
                >
                  Simpan Cawan
                </button>
              </div>
            </div>
          )}

          {/* Containers Grid Table */}
          <div className="max-h-[500px] overflow-y-auto border border-slate-200 rounded-xl">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-100 text-slate-700 font-bold sticky top-0 z-10 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-2.5 w-12 text-center">#</th>
                  <th className="px-4 py-2.5">No. Cawan / ID</th>
                  <th className="px-4 py-2.5">Berat Kosong Cawan (gram)</th>
                  <th className="px-4 py-2.5 text-center w-36">Terakhir Diubah</th>
                  <th className="px-4 py-2.5 text-right w-28">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {filteredContainers.map((item, idx) => {
                  const isEditing = editingContainerId === item.id;
                  return (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-2 text-center text-slate-400 font-sans">{idx + 1}</td>
                      <td className="px-4 py-2 font-bold text-slate-900">
                        <span className="px-2 py-0.5 rounded bg-teal-50 text-teal-800 border border-teal-200">
                          {item.id}
                        </span>
                      </td>
                      <td className="px-4 py-2">
                        {isEditing ? (
                          <input
                            type="number"
                            step="0.001"
                            value={editingContainerWeight}
                            onChange={e => setEditingContainerWeight(parseFloat(e.target.value) || 0)}
                            className="w-32 px-2 py-1 border border-teal-500 rounded bg-teal-50 text-xs font-mono font-bold"
                            autoFocus
                          />
                        ) : (
                          <span className="font-extrabold text-slate-800">{item.weight.toFixed(3)} g</span>
                        )}
                      </td>
                      <td className="px-4 py-2 text-center font-sans text-slate-500 text-[11px]">{formatDate(item.updatedAt)}</td>
                      <td className="px-4 py-2 text-right">
                        {isEditing ? (
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleSaveContainerEdit(item.id)}
                              className="p-1 rounded bg-emerald-600 text-white hover:bg-emerald-700 cursor-pointer"
                              title="Simpan"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setEditingContainerId(null)}
                              className="p-1 rounded bg-slate-300 text-slate-700 hover:bg-slate-400 cursor-pointer"
                              title="Batal"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => {
                                setEditingContainerId(item.id);
                                setEditingContainerWeight(item.weight);
                              }}
                              className="p-1 rounded text-slate-500 hover:text-teal-700 hover:bg-teal-50 cursor-pointer"
                              title="Edit Berat Cawan"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteContainer(item.id)}
                              className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 cursor-pointer"
                              title="Hapus Cawan"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: MASTER RING DENSITY */}
      {activeSubTab === 'rings' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <CircleDot className="w-5 h-5 text-teal-600" />
                Master Data Ring Unit Weight (Density)
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Master data kalibrasi dimensi ring cincin: Diameter, Tinggi, Berat Ring, dan Volume Otomatis (cm³).
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsAddingRing(true)}
                className="px-3.5 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-teal-600/20 transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah Ring Baru</span>
              </button>
            </div>
          </div>

          {/* Form Add Ring */}
          {isAddingRing && (
            <div className="p-4 rounded-xl bg-teal-50/70 border border-teal-200 space-y-3">
              <h4 className="text-xs font-bold text-teal-900 flex items-center gap-1.5">
                <Plus className="w-4 h-4 text-teal-600" />
                Tambah Ring Cincin Baru
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">No. Ring</label>
                  <input
                    type="text"
                    placeholder="Contoh: 18"
                    value={newRing.ringNo}
                    onChange={e => setNewRing({ ...newRing, ringNo: e.target.value })}
                    className="w-full text-xs px-3 py-1.5 rounded-lg border border-slate-300 bg-white"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">Diameter (mm)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Contoh: 47.6"
                    value={newRing.diameterMm}
                    onChange={e => setNewRing({ ...newRing, diameterMm: e.target.value })}
                    className="w-full text-xs px-3 py-1.5 rounded-lg border border-slate-300 bg-white"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">Tinggi (mm)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Contoh: 19.5"
                    value={newRing.heightMm}
                    onChange={e => setNewRing({ ...newRing, heightMm: e.target.value })}
                    className="w-full text-xs px-3 py-1.5 rounded-lg border border-slate-300 bg-white"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">Berat Kosong Ring (gram)</label>
                  <input
                    type="number"
                    step="0.001"
                    placeholder="Contoh: 36.499"
                    value={newRing.weightGrams}
                    onChange={e => setNewRing({ ...newRing, weightGrams: e.target.value })}
                    className="w-full text-xs px-3 py-1.5 rounded-lg border border-slate-300 bg-white"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2 justify-end pt-1">
                <button
                  onClick={() => setIsAddingRing(false)}
                  className="px-3 py-1 rounded-lg text-xs font-semibold text-slate-600 bg-slate-200 hover:bg-slate-300 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  onClick={handleAddRing}
                  className="px-4 py-1 rounded-lg text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 cursor-pointer"
                >
                  Simpan Ring
                </button>
              </div>
            </div>
          )}

          {/* Rings Table */}
          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="px-4 py-2.5 w-12 text-center">#</th>
                  <th className="px-4 py-2.5">No. Ring</th>
                  <th className="px-4 py-2.5">Diameter (mm)</th>
                  <th className="px-4 py-2.5">Tinggi (mm)</th>
                  <th className="px-4 py-2.5">Berat Kosong Ring (g)</th>
                  <th className="px-4 py-2.5">Volume Ring (cm³)</th>
                  <th className="px-4 py-2.5 text-center w-36">Terakhir Diubah</th>
                  <th className="px-4 py-2.5 text-right w-24">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {ringCatalogue.map((item, idx) => {
                  const isEditing = editingRingNo === item.ringNo;
                  return (
                    <tr key={item.ringNo} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-2.5 text-center text-slate-400 font-sans">{idx + 1}</td>
                      <td className="px-4 py-2.5 font-bold text-slate-900">
                        <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-800 border border-indigo-200">
                          Ring {item.ringNo}
                        </span>
                      </td>
                      <td className="px-4 py-2.5">
                        {isEditing && editingRingData ? (
                          <input
                            type="text"
                            inputMode="decimal"
                            step="0.01"
                            value={editingRingData.diameterMm}
                            onChange={e => setEditingRingData({ ...editingRingData, diameterMm: localeParseFloat(e.target.value) })}
                            className="w-20 px-2 py-1 border border-teal-500 rounded bg-teal-50 font-bold"
                          />
                        ) : (
                          <span>{item.diameterMm} mm</span>
                        )}
                      </td>
                      <td className="px-4 py-2.5">
                        {isEditing && editingRingData ? (
                          <input
                            type="text"
                            inputMode="decimal"
                            step="0.01"
                            value={editingRingData.heightMm}
                            onChange={e => setEditingRingData({ ...editingRingData, heightMm: localeParseFloat(e.target.value) })}
                            className="w-20 px-2 py-1 border border-teal-500 rounded bg-teal-50 font-bold"
                          />
                        ) : (
                          <span>{item.heightMm} mm</span>
                        )}
                      </td>
                      <td className="px-4 py-2.5">
                        {isEditing && editingRingData ? (
                          <input
                            type="text"
                            inputMode="decimal"
                            step="0.001"
                            value={editingRingData.weightGrams}
                            onChange={e => setEditingRingData({ ...editingRingData, weightGrams: localeParseFloat(e.target.value) })}
                            className="w-24 px-2 py-1 border border-teal-500 rounded bg-teal-50 font-bold"
                          />
                        ) : (
                          <span className="font-extrabold text-slate-900">{item.weightGrams.toFixed(3)} g</span>
                        )}
                      </td>
                      <td className="px-4 py-2.5">
                        <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 font-extrabold border border-emerald-200">
                          {item.volumeCm3.toFixed(3)} cm³
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-center font-sans text-slate-500 text-[11px]">{formatDate(item.updatedAt)}</td>
                      <td className="px-4 py-2.5 text-right">
                        {isEditing ? (
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={handleSaveRingEdit}
                              className="p-1 rounded bg-emerald-600 text-white hover:bg-emerald-700 cursor-pointer"
                              title="Simpan"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => { setEditingRingNo(null); setEditingRingData(null); }}
                              className="p-1 rounded bg-slate-300 text-slate-700 hover:bg-slate-400 cursor-pointer"
                              title="Batal"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => {
                                setEditingRingNo(item.ringNo);
                                setEditingRingData({ ...item });
                              }}
                              className="p-1 rounded text-slate-500 hover:text-teal-700 hover:bg-teal-50 cursor-pointer"
                              title="Edit Ring"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteRing(item.ringNo)}
                              className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 cursor-pointer"
                              title="Hapus Ring"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2B: MASTER KALIBRASI RING CONSOLIDATION */}
      {activeSubTab === 'consol_rings' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <CircleDot className="w-5 h-5 text-teal-600" />
                <span>Master Kalibrasi Ring Konsolidasi (Consolidation Ring Calibration)</span>
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Daftar acuan nomor ring konsolidasi, diameter (cm), tinggi (cm), dan berat kosong ring (g) untuk auto-lookup pada pengujian CT (SNI 2812:2011).
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsAddingConsolRing(true)}
                className="px-3.5 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-sm transition flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah Ring Consol</span>
              </button>
            </div>
          </div>

          {isAddingConsolRing && (
            <div className="p-4 bg-teal-50/70 rounded-xl border border-teal-200 space-y-3">
              <div className="text-xs font-extrabold text-teal-900">Tambah Ring Konsolidasi Baru</div>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <label className="text-[10px] font-bold text-slate-600 block">No. Ring Consol:</label>
                  <input
                    type="text"
                    placeholder="misal: C-06"
                    value={newConsolRing.ringNo}
                    onChange={e => setNewConsolRing(p => ({ ...p, ringNo: e.target.value }))}
                    className="w-full h-8 bg-white border border-slate-300 rounded-lg px-2 font-bold font-mono text-slate-900 focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-600 block">Diameter (mm):</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="63.50"
                    value={newConsolRing.diameterMm}
                    onChange={e => setNewConsolRing(p => ({ ...p, diameterMm: e.target.value }))}
                    className="w-full h-8 bg-white border border-slate-300 rounded-lg px-2 font-bold font-mono text-slate-900 focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-600 block">Tinggi (mm):</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="20.00"
                    value={newConsolRing.heightMm}
                    onChange={e => setNewConsolRing(p => ({ ...p, heightMm: e.target.value }))}
                    className="w-full h-8 bg-white border border-slate-300 rounded-lg px-2 font-bold font-mono text-slate-900 focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-600 block">Berat Kosong Ring (g):</label>
                  <input
                    type="number"
                    step="0.001"
                    placeholder="118.250"
                    value={newConsolRing.weightGrams}
                    onChange={e => setNewConsolRing(p => ({ ...p, weightGrams: e.target.value }))}
                    className="w-full h-8 bg-white border border-slate-300 rounded-lg px-2 font-bold font-mono text-slate-900 focus:border-teal-500"
                  />
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsAddingConsolRing(false)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 text-xs font-bold"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleAddConsolRing}
                  className="px-4 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-xs"
                >
                  Simpan Ring Consol
                </button>
              </div>
            </div>
          )}

          {/* Consol Rings Table */}
          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="px-4 py-2.5 w-12 text-center">#</th>
                  <th className="px-4 py-2.5">No. Ring Consol</th>
                  <th className="px-4 py-2.5">Diameter (mm)</th>
                  <th className="px-4 py-2.5">Tinggi (mm)</th>
                  <th className="px-4 py-2.5">Berat Kosong Ring (g)</th>
                  <th className="px-4 py-2.5">Volume Ring (cm³)</th>
                  <th className="px-4 py-2.5 text-center w-36">Terakhir Diubah</th>
                  <th className="px-4 py-2.5 text-right w-24">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {consolRingCatalogue.map((item, idx) => {
                  const isEditing = editingConsolRingNo === item.ringNo;
                  return (
                    <tr key={item.ringNo} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-2.5 text-center text-slate-400 font-sans">{idx + 1}</td>
                      <td className="px-4 py-2.5 font-bold text-slate-900">
                        <span className="px-2 py-0.5 rounded bg-teal-50 text-teal-800 border border-teal-200">
                          Ring {item.ringNo}
                        </span>
                      </td>
                      <td className="px-4 py-2.5">
                        {isEditing ? (
                          <input
                            type="text"
                            inputMode="decimal"
                            step="0.01"
                            value={editingConsolRingData?.diameterMm || 0}
                            onChange={e => setEditingConsolRingData(p => p ? { ...p, diameterMm: localeParseFloat(e.target.value) } : null)}
                            className="w-24 h-7 bg-white border border-slate-300 rounded px-1.5 text-center font-bold"
                          />
                        ) : `${item.diameterMm.toFixed(2)} mm`}
                      </td>
                      <td className="px-4 py-2.5">
                        {isEditing ? (
                          <input
                            type="text"
                            inputMode="decimal"
                            step="0.01"
                            value={editingConsolRingData?.heightMm || 0}
                            onChange={e => setEditingConsolRingData(p => p ? { ...p, heightMm: localeParseFloat(e.target.value) } : null)}
                            className="w-24 h-7 bg-white border border-slate-300 rounded px-1.5 text-center font-bold"
                          />
                        ) : `${item.heightMm.toFixed(2)} mm`}
                      </td>
                      <td className="px-4 py-2.5 font-bold text-slate-900">
                        {isEditing ? (
                          <input
                            type="text"
                            inputMode="decimal"
                            step="0.001"
                            value={editingConsolRingData?.weightGrams || 0}
                            onChange={e => setEditingConsolRingData(p => p ? { ...p, weightGrams: localeParseFloat(e.target.value) } : null)}
                            className="w-28 h-7 bg-white border border-slate-300 rounded px-1.5 text-center font-bold"
                          />
                        ) : `${item.weightGrams.toFixed(3)} g`}
                      </td>
                      <td className="px-4 py-2.5 text-teal-700 font-extrabold">
                        {item.volumeCm3.toFixed(3)} cm³
                      </td>
                      <td className="px-4 py-2.5 text-center font-sans text-slate-500 text-[11px]">{formatDate(item.updatedAt)}</td>
                      <td className="px-4 py-2.5 text-right font-sans">
                        {isEditing ? (
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={handleSaveConsolRingEdit}
                              className="p-1 rounded text-teal-600 hover:bg-teal-50 cursor-pointer"
                              title="Simpan"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => { setEditingConsolRingNo(null); setEditingConsolRingData(null); }}
                              className="p-1 rounded text-slate-400 hover:bg-slate-100 cursor-pointer"
                              title="Batal"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => {
                                setEditingConsolRingNo(item.ringNo);
                                setEditingConsolRingData({ ...item });
                              }}
                              className="p-1 rounded text-slate-500 hover:text-teal-700 hover:bg-teal-50 cursor-pointer"
                              title="Edit Ring"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteConsolRing(item.ringNo)}
                              className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 cursor-pointer"
                              title="Hapus Ring"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2C: MASTER KALIBRASI RING DIRECT SHEAR */}
      {/* TAB 2C: MASTER KALIBRASI RING DIRECT SHEAR */}
      {activeSubTab === 'ds_rings' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-5 font-sans">
          {/* SECTION 1: PROVING RING MESIN (BISA DITAMBAH, DIEDIT, DIHAPUS) */}
          <div className="p-4 bg-purple-50/60 border border-purple-200 rounded-xl space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-purple-200/60 pb-2">
              <div>
                <h4 className="text-sm font-extrabold text-purple-900 flex items-center gap-2">
                  <CircleDot className="w-4 h-4 text-purple-700" />
                  <span>1. Master Proving Ring / Mesin Direct Shear</span>
                </h4>
                <p className="text-xs text-slate-600 font-medium mt-0.5">
                  Faktor kalibrasi dial proving ring melekat pada alat/mesin Direct Shear (kgf/div). Tambahkan mesin di bawah jika laboratorium memiliki lebih dari 1 mesin DS.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsAddingDsProving(true)}
                  className="px-3 py-1.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Tambah Mesin DS / Proving Ring</span>
                </button>
                <button
                  onClick={onResetDsProvingCatalogue}
                  className="px-2.5 py-1.5 rounded-xl border border-purple-200 hover:bg-white text-purple-800 text-xs font-bold flex items-center gap-1 transition cursor-pointer"
                  title="Reset Proving Ring DS"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset</span>
                </button>
              </div>
            </div>

            {/* Form Add DS Proving Machine */}
            {isAddingDsProving && (
              <div className="p-3 bg-white border border-purple-300 rounded-xl space-y-3 font-mono text-xs">
                <div className="text-xs font-extrabold text-purple-900 font-sans">Tambah Proving Ring Mesin DS Baru</div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-600 block">Kode / Nama Mesin DS:</label>
                    <input
                      type="text"
                      placeholder="Mesin DS-01"
                      value={newDsProving.machineCode}
                      onChange={e => setNewDsProving(p => ({ ...p, machineCode: e.target.value }))}
                      className="w-full h-8 bg-white border border-purple-300 rounded px-2 font-bold text-slate-900 focus:border-purple-500"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-600 block">Faktor Kalibrasi (kgf/div):</label>
                    <input
                      type="text"
                      inputMode="decimal"
                      placeholder="0.4067"
                      value={newDsProving.provingCalibration}
                      onChange={e => setNewDsProving(p => ({ ...p, provingCalibration: e.target.value }))}
                      className="w-full h-8 bg-white border border-purple-300 rounded px-2 font-bold text-slate-900 focus:border-purple-500"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-600 block">Kapasitas Mesin (kgf):</label>
                    <input
                      type="text"
                      inputMode="decimal"
                      placeholder="300"
                      value={newDsProving.capacityKg}
                      onChange={e => setNewDsProving(p => ({ ...p, capacityKg: e.target.value }))}
                      className="w-full h-8 bg-white border border-purple-300 rounded px-2 font-bold text-slate-900 focus:border-purple-500"
                    />
                  </div>
                </div>
                <div className="flex items-center justify-end gap-2 pt-1 font-sans">
                  <button
                    onClick={() => setIsAddingDsProving(false)}
                    className="px-3 py-1 rounded-lg border border-slate-300 text-slate-600 text-xs font-bold hover:bg-slate-100 cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    onClick={handleAddDsProving}
                    className="px-4 py-1 rounded-lg bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold cursor-pointer"
                  >
                    Simpan Mesin DS
                  </button>
                </div>
              </div>
            )}

            {/* Table of DS Machine Proving Rings */}
            <div className="overflow-x-auto border border-purple-200 rounded-xl bg-white">
              <table className="w-full text-xs text-left border-collapse font-mono">
                <thead>
                  <tr className="bg-purple-100/70 text-purple-900 font-bold border-b border-purple-200 font-sans">
                    <th className="px-4 py-2.5">Kode / Nama Mesin DS</th>
                    <th className="px-4 py-2.5">Faktor Kalibrasi Proving (kgf/div)</th>
                    <th className="px-4 py-2.5">Kapasitas (kgf)</th>
                    <th className="px-4 py-2.5 text-center">Diperbarui</th>
                    <th className="px-4 py-2.5 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-purple-100">
                  {dsProvingCatalogue.map((item) => {
                    const isEditing = editingDsProvingCode === item.machineCode;
                    return (
                      <tr key={item.machineCode} className="hover:bg-purple-50/40 transition-colors">
                        <td className="px-4 py-2.5 font-bold text-slate-900 font-sans">
                          {item.machineCode}
                        </td>
                        <td className="px-4 py-2.5 font-black text-purple-800">
                          {isEditing ? (
                            <input
                              type="text"
                              inputMode="decimal"
                              value={editingDsProvingRaw?.provingCalibration ?? ''}
                              onChange={e => setEditingDsProvingRaw(p => p ? { ...p, provingCalibration: e.target.value } : null)}
                              className="w-28 h-7 bg-white border border-purple-300 rounded px-1.5 text-center font-bold"
                            />
                          ) : `${item.provingCalibration.toFixed(4)} kgf/div`}
                        </td>
                        <td className="px-4 py-2.5 text-slate-600">
                          {isEditing ? (
                            <input
                              type="text"
                              inputMode="decimal"
                              value={editingDsProvingRaw?.capacityKg ?? ''}
                              onChange={e => setEditingDsProvingRaw(p => p ? { ...p, capacityKg: e.target.value } : null)}
                              className="w-24 h-7 bg-white border border-slate-300 rounded px-1.5 text-center font-bold"
                            />
                          ) : (item.capacityKg ? `${item.capacityKg} kgf` : '—')}
                        </td>
                        <td className="px-4 py-2.5 text-center font-sans text-slate-500 text-[11px]">{formatDate(item.updatedAt)}</td>
                        <td className="px-4 py-2.5 text-right font-sans">
                          {isEditing ? (
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={handleSaveDsProvingEdit}
                                className="p-1 rounded text-purple-700 hover:bg-purple-100 cursor-pointer"
                                title="Simpan"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => { setEditingDsProvingCode(null); setEditingDsProvingRaw(null); }}
                                className="p-1 rounded text-slate-400 hover:bg-slate-100 cursor-pointer"
                                title="Batal"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => {
                                  setEditingDsProvingCode(item.machineCode);
                                  setEditingDsProvingRaw({
                                    machineCode: item.machineCode,
                                    provingCalibration: item.provingCalibration.toString(),
                                    capacityKg: (item.capacityKg ?? 300).toString()
                                  });
                                }}
                                className="p-1 rounded text-slate-500 hover:text-purple-700 hover:bg-purple-50 cursor-pointer"
                                title="Edit Kalibrasi Proving DS"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteDsProving(item.machineCode)}
                                className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 cursor-pointer"
                                title="Hapus Mesin DS"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* SECTION 2: RING CETAK SPECIMEN (DAPAT DITAMBAH / DIKALIBRASI SAKADARNYA) */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <CircleDot className="w-5 h-5 text-purple-600" />
                <span>2. Master Ring Cetak Specimen Direct Shear</span>
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Daftar acuan nomor ring cetak spesimen (diameter, tinggi, dan berat kosong ring) untuk auto-lookup dimensi benda uji Direct Shear. Ukuran dan berat ring cetak dapat ditambahkan atau dikalibrasi ulang sewaktu-waktu.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsAddingDsRing(true)}
                className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-purple-600/20 transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah Ring Cetak Baru</span>
              </button>
              <button
                onClick={onResetDsRingCatalogue}
                className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                title="Reset Katalog Ring Cetak"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            </div>
          </div>

          {/* Form Add DS Ring */}
          {isAddingDsRing && (
            <div className="p-4 bg-purple-50/70 border border-purple-200 rounded-xl space-y-3">
              <div className="text-xs font-extrabold text-purple-900">Tambah Ring Cetak Specimen Baru</div>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 font-mono text-xs">
                <div>
                  <label className="text-[10px] font-bold text-slate-600 block">No. Ring DS:</label>
                  <input
                    type="text"
                    placeholder="DS-1"
                    value={newDsRing.ringNo}
                    onChange={e => setNewDsRing(p => ({ ...p, ringNo: e.target.value }))}
                    className="w-full h-8 bg-white border border-purple-300 rounded px-2 font-bold text-slate-900 focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-600 block">Diameter (mm):</label>
                  <input
                    type="text"
                    inputMode="decimal"
                    placeholder="59.4"
                    value={newDsRing.diameterMm}
                    onChange={e => setNewDsRing(p => ({ ...p, diameterMm: e.target.value }))}
                    className="w-full h-8 bg-white border border-purple-300 rounded px-2 font-bold text-slate-900 focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-600 block">Tinggi (mm):</label>
                  <input
                    type="text"
                    inputMode="decimal"
                    placeholder="24.9"
                    value={newDsRing.heightMm}
                    onChange={e => setNewDsRing(p => ({ ...p, heightMm: e.target.value }))}
                    className="w-full h-8 bg-white border border-purple-300 rounded px-2 font-bold text-slate-900 focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-600 block">Berat Ring (g):</label>
                  <input
                    type="text"
                    inputMode="decimal"
                    placeholder="63.16"
                    value={newDsRing.weightGrams}
                    onChange={e => setNewDsRing(p => ({ ...p, weightGrams: e.target.value }))}
                    className="w-full h-8 bg-white border border-purple-300 rounded px-2 font-bold text-slate-900 focus:border-purple-500"
                  />
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 pt-1 font-sans">
                <button
                  onClick={() => setIsAddingDsRing(false)}
                  className="px-3 py-1 rounded-lg border border-slate-300 text-slate-600 text-xs font-bold hover:bg-slate-100 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  onClick={handleAddDsRing}
                  className="px-4 py-1 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold cursor-pointer"
                >
                  Simpan Ring Cetak
                </button>
              </div>
            </div>
          )}

          {/* DS Rings Table */}
          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-xs text-left border-collapse font-mono">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 font-sans">
                  <th className="px-4 py-2.5">No. Ring DS</th>
                  <th className="px-4 py-2.5">Diameter (mm)</th>
                  <th className="px-4 py-2.5">Tinggi (mm)</th>
                  <th className="px-4 py-2.5">Berat Kosong Ring (g)</th>
                  <th className="px-4 py-2.5">Volume Ring (cm³)</th>
                  <th className="px-4 py-2.5 text-center">Diperbarui</th>
                  <th className="px-4 py-2.5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {dsRingCatalogue.map((item) => {
                  const isEditing = editingDsRingNo === item.ringNo;
                  return (
                    <tr key={item.ringNo} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-2.5 font-bold text-slate-900">
                        Ring {item.ringNo}
                      </td>
                      <td className="px-4 py-2.5">
                        {isEditing ? (
                          <input
                            type="text"
                            inputMode="decimal"
                            value={editingDsRingRaw?.diameterMm ?? ''}
                            onChange={e => setEditingDsRingRaw(p => p ? { ...p, diameterMm: e.target.value } : null)}
                            className="w-24 h-7 bg-white border border-slate-300 rounded px-1.5 text-center font-bold"
                          />
                        ) : `${item.diameterMm.toFixed(2)} mm`}
                      </td>
                      <td className="px-4 py-2.5">
                        {isEditing ? (
                          <input
                            type="text"
                            inputMode="decimal"
                            value={editingDsRingRaw?.heightMm ?? ''}
                            onChange={e => setEditingDsRingRaw(p => p ? { ...p, heightMm: e.target.value } : null)}
                            className="w-24 h-7 bg-white border border-slate-300 rounded px-1.5 text-center font-bold"
                          />
                        ) : `${item.heightMm.toFixed(2)} mm`}
                      </td>
                      <td className="px-4 py-2.5 font-bold text-slate-900">
                        {isEditing ? (
                          <input
                            type="text"
                            inputMode="decimal"
                            value={editingDsRingRaw?.weightGrams ?? ''}
                            onChange={e => setEditingDsRingRaw(p => p ? { ...p, weightGrams: e.target.value } : null)}
                            className="w-28 h-7 bg-white border border-slate-300 rounded px-1.5 text-center font-bold"
                          />
                        ) : `${item.weightGrams.toFixed(3)} g`}
                      </td>
                      <td className="px-4 py-2.5 text-purple-700 font-extrabold">
                        {item.volumeCm3.toFixed(3)} cm³
                      </td>
                      <td className="px-4 py-2.5 text-center font-sans text-slate-500 text-[11px]">{formatDate(item.updatedAt)}</td>
                      <td className="px-4 py-2.5 text-right font-sans">
                        {isEditing ? (
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={handleSaveDsRingEdit}
                              className="p-1 rounded text-purple-600 hover:bg-purple-50 cursor-pointer"
                              title="Simpan"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => { setEditingDsRingNo(null); setEditingDsRingRaw(null); }}
                              className="p-1 rounded text-slate-400 hover:bg-slate-100 cursor-pointer"
                              title="Batal"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => {
                                setEditingDsRingNo(item.ringNo);
                                setEditingDsRingRaw({
                                  ringNo: item.ringNo,
                                  provingCalibration: item.provingCalibration.toString(),
                                  diameterMm: item.diameterMm.toString(),
                                  heightMm: item.heightMm.toString(),
                                  weightGrams: item.weightGrams.toString()
                                });
                              }}
                              className="p-1 rounded text-slate-500 hover:text-purple-700 hover:bg-purple-50 cursor-pointer"
                              title="Edit Ring DS"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteDsRing(item.ringNo)}
                              className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 cursor-pointer"
                              title="Hapus Ring DS"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB: MASTER PROVING RING TRX (TRIAXIAL) */}
      {activeSubTab === 'trx_rings' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <CircleDot className="w-5 h-5 text-purple-600" />
                Master Proving Ring &amp; Kalibrasi Mesin Triaxial (TRX-UU)
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Katalog beban kalibrasi proving ring mesin Triaxial (LRC kgf/div). Nilai default standar: <strong>0,12064 kgf/div</strong>.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsAddingTrxRing(true)}
                className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-purple-600/20 transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah Ring TRX Baru</span>
              </button>
            </div>
          </div>

          {/* Form Add TRX Ring */}
          {isAddingTrxRing && (
            <div className="p-4 bg-purple-50/50 border border-purple-200 rounded-xl space-y-3 font-mono">
              <h4 className="text-xs font-extrabold text-purple-900 font-sans">Pendaftaran Proving Ring TRX Baru</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="text-[10px] font-bold text-purple-900 block mb-1">Kode / Nama Proving Ring:</label>
                  <input
                    type="text"
                    placeholder="misal: TRX-1 (Standard)"
                    value={newTrxRing.ringNo}
                    onChange={e => setNewTrxRing(p => ({ ...p, ringNo: e.target.value }))}
                    className="w-full h-8 bg-white border border-purple-300 rounded px-2.5 font-bold text-slate-900 focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-purple-900 block mb-1">Faktor Kalibrasi LRC (kgf/div):</label>
                  <input
                    type="text"
                    inputMode="decimal"
                    placeholder="0.12064"
                    value={newTrxRing.provingCalibration}
                    onChange={e => setNewTrxRing(p => ({ ...p, provingCalibration: e.target.value }))}
                    className="w-full h-8 bg-white border border-purple-300 rounded px-2.5 font-bold text-slate-900 focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-purple-900 block mb-1">Kapasitas Maksimal (kgf):</label>
                  <input
                    type="text"
                    inputMode="decimal"
                    placeholder="300"
                    value={newTrxRing.capacityKg}
                    onChange={e => setNewTrxRing(p => ({ ...p, capacityKg: e.target.value }))}
                    className="w-full h-8 bg-white border border-purple-300 rounded px-2.5 font-bold text-slate-900 focus:border-purple-500"
                  />
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 pt-1 font-sans">
                <button
                  onClick={() => setIsAddingTrxRing(false)}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-600 text-xs font-bold hover:bg-slate-100 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  onClick={handleAddTrxRing}
                  className="px-4 py-1.5 rounded-lg bg-purple-600 text-white text-xs font-bold hover:bg-purple-700 cursor-pointer shadow-sm"
                >
                  Simpan Ring TRX
                </button>
              </div>
            </div>
          )}

          {/* Table TRX Rings */}
          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-xs text-left border-collapse font-mono">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 font-sans">
                  <th className="px-4 py-2.5">No. / Kode Ring TRX</th>
                  <th className="px-4 py-2.5">Faktor Kalibrasi LRC (kgf/div)</th>
                  <th className="px-4 py-2.5">Kapasitas Ring (kgf)</th>
                  <th className="px-4 py-2.5 text-center">Diperbarui</th>
                  <th className="px-4 py-2.5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {trxRingCatalogue.map((item) => {
                  const isEditing = editingTrxRingNo === item.ringNo;
                  return (
                    <tr key={item.ringNo} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-2.5 font-bold text-slate-900">
                        {item.ringNo}
                      </td>
                      <td className="px-4 py-2.5 font-bold text-purple-700">
                        {isEditing ? (
                          <input
                            type="text"
                            inputMode="decimal"
                            step="0.00001"
                            value={editingTrxRingData?.provingCalibration || 0}
                            onChange={e => setEditingTrxRingData(p => p ? { ...p, provingCalibration: localeParseFloat(e.target.value) } : null)}
                            className="w-32 h-7 bg-white border border-purple-300 rounded px-1.5 text-center font-bold"
                          />
                        ) : `${item.provingCalibration} kgf/div`}
                      </td>
                      <td className="px-4 py-2.5 font-bold text-slate-700">
                        {isEditing ? (
                          <input
                            type="text"
                            inputMode="decimal"
                            value={editingTrxRingData?.capacityKg || 300}
                            onChange={e => setEditingTrxRingData(p => p ? { ...p, capacityKg: localeParseFloat(e.target.value) } : null)}
                            className="w-24 h-7 bg-white border border-slate-300 rounded px-1.5 text-center font-bold"
                          />
                        ) : `${item.capacityKg || 300} kg`}
                      </td>
                      <td className="px-4 py-2.5 text-center font-sans text-slate-500 text-[11px]">{formatDate(item.updatedAt)}</td>
                      <td className="px-4 py-2.5 text-right font-sans">
                        {isEditing ? (
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={handleSaveTrxRingEdit}
                              className="p-1 rounded text-purple-600 hover:bg-purple-50 cursor-pointer"
                              title="Simpan"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => { setEditingTrxRingNo(null); setEditingTrxRingData(null); }}
                              className="p-1 rounded text-slate-400 hover:bg-slate-100 cursor-pointer"
                              title="Batal"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => {
                                setEditingTrxRingNo(item.ringNo);
                                setEditingTrxRingData({ ...item });
                              }}
                              className="p-1 rounded text-slate-500 hover:text-purple-700 hover:bg-purple-50 cursor-pointer"
                              title="Edit Ring TRX"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteTrxRing(item.ringNo)}
                              className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 cursor-pointer"
                              title="Hapus Ring TRX"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB: MASTER PROVING RING UCT */}
      {activeSubTab === 'uct_rings' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <CircleDot className="w-5 h-5 text-blue-600" />
                Master Proving Ring &amp; Kalibrasi Mesin Kuat Tekan Bebas (UCT)
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Katalog faktor kalibrasi proving ring mesin UCT (kgf/div). Nilai default standar: <strong>0,5778 kgf/div</strong>.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsAddingUctRing(true)}
                className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-blue-600/20 transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah Ring UCT Baru</span>
              </button>
            </div>
          </div>

          {/* Form Add UCT Ring */}
          {isAddingUctRing && (
            <div className="p-4 bg-blue-50/50 border border-blue-200 rounded-xl space-y-3 font-mono">
              <h4 className="text-xs font-extrabold text-blue-900 font-sans">Pendaftaran Proving Ring UCT Baru</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="text-[10px] font-bold text-blue-900 block mb-1">Kode / Nama Proving Ring:</label>
                  <input
                    type="text"
                    placeholder="misal: UCT-1 (Standard)"
                    value={newUctRing.ringNo}
                    onChange={e => setNewUctRing(p => ({ ...p, ringNo: e.target.value }))}
                    className="w-full h-8 bg-white border border-blue-300 rounded px-2.5 font-bold text-slate-900 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-blue-900 block mb-1">Faktor Kalibrasi PR (kgf/div):</label>
                  <input
                    type="text"
                    inputMode="decimal"
                    placeholder="0.5778"
                    value={newUctRing.provingCalibration}
                    onChange={e => setNewUctRing(p => ({ ...p, provingCalibration: e.target.value }))}
                    className="w-full h-8 bg-white border border-blue-300 rounded px-2.5 font-bold text-slate-900 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-blue-900 block mb-1">Kapasitas Maksimal (kgf):</label>
                  <input
                    type="text"
                    inputMode="decimal"
                    placeholder="300"
                    value={newUctRing.capacityKg}
                    onChange={e => setNewUctRing(p => ({ ...p, capacityKg: e.target.value }))}
                    className="w-full h-8 bg-white border border-blue-300 rounded px-2.5 font-bold text-slate-900 focus:border-blue-500"
                  />
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 pt-1 font-sans">
                <button
                  onClick={() => setIsAddingUctRing(false)}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-600 text-xs font-bold hover:bg-slate-100 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  onClick={handleAddUctRing}
                  className="px-4 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 cursor-pointer shadow-sm"
                >
                  Simpan Ring UCT
                </button>
              </div>
            </div>
          )}

          {/* Table UCT Rings */}
          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-xs text-left border-collapse font-mono">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 font-sans">
                  <th className="px-4 py-2.5">No. / Kode Ring UCT</th>
                  <th className="px-4 py-2.5">Faktor Kalibrasi PR (kgf/div)</th>
                  <th className="px-4 py-2.5">Kapasitas Ring (kgf)</th>
                  <th className="px-4 py-2.5 text-center">Diperbarui</th>
                  <th className="px-4 py-2.5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {uctRingCatalogue.map((item) => {
                  const isEditing = editingUctRingNo === item.ringNo;
                  return (
                    <tr key={item.ringNo} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-2.5 font-bold text-slate-900">
                        {item.ringNo}
                      </td>
                      <td className="px-4 py-2.5 font-bold text-blue-700">
                        {isEditing ? (
                          <input
                            type="text"
                            inputMode="decimal"
                            step="0.0001"
                            value={editingUctRingData?.provingCalibration || 0}
                            onChange={e => setEditingUctRingData(p => p ? { ...p, provingCalibration: localeParseFloat(e.target.value) } : null)}
                            className="w-32 h-7 bg-white border border-blue-300 rounded px-1.5 text-center font-bold"
                          />
                        ) : `${item.provingCalibration} kgf/div`}
                      </td>
                      <td className="px-4 py-2.5 font-bold text-slate-700">
                        {isEditing ? (
                          <input
                            type="text"
                            inputMode="decimal"
                            value={editingUctRingData?.capacityKg || 300}
                            onChange={e => setEditingUctRingData(p => p ? { ...p, capacityKg: localeParseFloat(e.target.value) } : null)}
                            className="w-24 h-7 bg-white border border-slate-300 rounded px-1.5 text-center font-bold"
                          />
                        ) : `${item.capacityKg || 300} kgf`}
                      </td>
                      <td className="px-4 py-2.5 text-center font-sans text-slate-500 text-[11px]">{formatDate(item.updatedAt)}</td>
                      <td className="px-4 py-2.5 text-right font-sans">
                        {isEditing ? (
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={handleSaveUctRingEdit}
                              className="p-1 rounded text-blue-600 hover:bg-blue-50 cursor-pointer"
                              title="Simpan"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => { setEditingUctRingNo(null); setEditingUctRingData(null); }}
                              className="p-1 rounded text-slate-400 hover:bg-slate-100 cursor-pointer"
                              title="Batal"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => {
                                setEditingUctRingNo(item.ringNo);
                                setEditingUctRingData({ ...item });
                              }}
                              className="p-1 rounded text-slate-500 hover:text-blue-700 hover:bg-blue-50 cursor-pointer"
                              title="Edit Ring UCT"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteUctRing(item.ringNo)}
                              className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 cursor-pointer"
                              title="Hapus Ring UCT"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: KALIBRASI PIKNOMETER */}
      {activeSubTab === 'pycnometers' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Pipette className="w-5 h-5 text-teal-600" />
                Kalibrasi Piknometer (Specific Gravity - GS)
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Master berat piknometer kosong (W pyc) dan berat piknometer terisi air pada suhu 25°C (W pyc+water, 25°C).
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsAddingPyc(true)}
                className="px-3.5 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-teal-600/20 transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah Piknometer Baru</span>
              </button>
            </div>
          </div>

          {/* Form Add Pycnometer */}
          {isAddingPyc && (
            <div className="p-4 rounded-xl bg-teal-50/70 border border-teal-200 space-y-3">
              <h4 className="text-xs font-bold text-teal-900 flex items-center gap-1.5">
                <Plus className="w-4 h-4 text-teal-600" />
                Tambah Piknometer Baru
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">No. Piknometer</label>
                  <input
                    type="text"
                    placeholder="Contoh: 21"
                    value={newPyc.pycNo}
                    onChange={e => setNewPyc({ ...newPyc, pycNo: e.target.value })}
                    className="w-full text-xs px-3 py-1.5 rounded-lg border border-slate-300 bg-white"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">Berat Pikno + Air @25°C (g)</label>
                  <input
                    type="number"
                    step="0.0001"
                    placeholder="Contoh: 152.1022"
                    value={newPyc.weightWater25}
                    onChange={e => setNewPyc({ ...newPyc, weightWater25: e.target.value })}
                    className="w-full text-xs px-3 py-1.5 rounded-lg border border-slate-300 bg-white"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">Berat Kosong Pikno (g)</label>
                  <input
                    type="number"
                    step="0.0001"
                    placeholder="Contoh: 52.9908"
                    value={newPyc.weightTare}
                    onChange={e => setNewPyc({ ...newPyc, weightTare: e.target.value })}
                    className="w-full text-xs px-3 py-1.5 rounded-lg border border-slate-300 bg-white"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2 justify-end pt-1">
                <button
                  onClick={() => setIsAddingPyc(false)}
                  className="px-3 py-1 rounded-lg text-xs font-semibold text-slate-600 bg-slate-200 hover:bg-slate-300 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  onClick={handleAddPyc}
                  className="px-4 py-1 rounded-lg text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 cursor-pointer"
                >
                  Simpan Piknometer
                </button>
              </div>
            </div>
          )}

          {/* Pycnometer Table */}
          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="px-4 py-2.5 w-12 text-center">#</th>
                  <th className="px-4 py-2.5">No. Piknometer</th>
                  <th className="px-4 py-2.5">Berat Pikno + Air pada 25°C (g)</th>
                  <th className="px-4 py-2.5">Berat Kosong Pikno (g)</th>
                  <th className="px-4 py-2.5 text-center w-36">Terakhir Diubah</th>
                  <th className="px-4 py-2.5 text-right w-24">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {pycCatalogue.map((item, idx) => {
                  const isEditing = editingPycNo === item.pycNo;
                  return (
                    <tr key={item.pycNo} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-2.5 text-center text-slate-400 font-sans">{idx + 1}</td>
                      <td className="px-4 py-2.5 font-bold text-slate-900">
                        <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                          Pikno {item.pycNo}
                        </span>
                      </td>
                      <td className="px-4 py-2.5">
                        {isEditing && editingPycData ? (
                          <input
                            type="number"
                            step="0.0001"
                            value={editingPycData.weightWater25}
                            onChange={e => setEditingPycData({ ...editingPycData, weightWater25: parseFloat(e.target.value) || 0 })}
                            className="w-28 px-2 py-1 border border-teal-500 rounded bg-teal-50 font-bold"
                          />
                        ) : (
                          <span className="font-extrabold text-slate-900">{item.weightWater25.toFixed(3)} g</span>
                        )}
                      </td>
                      <td className="px-4 py-2.5">
                        {isEditing && editingPycData ? (
                          <input
                            type="number"
                            step="0.001"
                            value={editingPycData.weightTare}
                            onChange={e => setEditingPycData({ ...editingPycData, weightTare: parseFloat(e.target.value) || 0 })}
                            className="w-28 px-2 py-1 border border-teal-500 rounded bg-teal-50 font-bold"
                          />
                        ) : (
                          <span>{item.weightTare.toFixed(3)} g</span>
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-center font-sans text-slate-500 text-[11px]">{formatDate(item.updatedAt)}</td>
                      <td className="px-4 py-2.5 text-right">
                        {isEditing ? (
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={handleSavePycEdit}
                              className="p-1 rounded bg-emerald-600 text-white hover:bg-emerald-700 cursor-pointer"
                              title="Simpan"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => { setEditingPycNo(null); setEditingPycData(null); }}
                              className="p-1 rounded bg-slate-300 text-slate-700 hover:bg-slate-400 cursor-pointer"
                              title="Batal"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => {
                                setEditingPycNo(item.pycNo);
                                setEditingPycData({ ...item });
                              }}
                              className="p-1 rounded text-slate-500 hover:text-teal-700 hover:bg-teal-50 cursor-pointer"
                              title="Edit Piknometer"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeletePyc(item.pycNo)}
                              className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 cursor-pointer"
                              title="Hapus Piknometer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB: MASTER PERSONIL & TIM LAB */}
      {activeSubTab === 'personnel' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-teal-600" />
                Master Personil &amp; Tim Laboratorium (Penguji / Analyst / Computed / Approver)
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Daftar personil resmi untuk pengisian Teknisi Penguji (Tested By), Analis (Analyst), Engineer Kalkulasi (Computed By), dan Pemeriksa (Approver / Checker).
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={onResetPersonnelCatalogue}
                className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-red-50 border border-slate-200 hover:border-red-200 text-slate-700 hover:text-red-700 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset Default ({DEFAULT_PERSONNEL_CATALOGUE.length} Personil)
              </button>
              <button
                onClick={() => setIsAddingPersonnel(true)}
                className="px-3.5 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-teal-600/20 transition cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Personil Baru</span>
              </button>
            </div>
          </div>

          {/* Role Filter Tabs & Search */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
            <div className="flex items-center gap-1 flex-wrap text-xs font-bold">
              <span className="text-slate-500 mr-1 flex items-center gap-1">
                <Filter className="w-3.5 h-3.5" /> Filter Peran:
              </span>
              {[
                { id: 'all', label: 'Semua Peran' },
                { id: 'Penguji', label: 'Penguji (Tested By)' },
                { id: 'Analyst', label: 'Analyst (Data Analysis)' },
                { id: 'Computed', label: 'Computed (Dihitung Oleh)' },
                { id: 'Approver', label: 'Approver (Pemeriksa / Checker)' }
              ].map(r => (
                <button
                  key={r.id}
                  onClick={() => setPersonnelRoleFilter(r.id as any)}
                  className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${personnelRoleFilter === r.id ? 'bg-teal-600 text-white shadow-2xs' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'}`}
                >
                  {r.label}
                </button>
              ))}
            </div>

            <div className="relative w-full md:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari nama atau jabatan..."
                value={personnelSearch}
                onChange={e => setPersonnelSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-xl focus:border-teal-600 focus:outline-none"
              />
            </div>
          </div>

          {/* Form Modal / Inline Add Personnel */}
          {isAddingPersonnel && (
            <div className="p-4 rounded-xl bg-teal-50/70 border border-teal-200 space-y-3 animate-in fade-in duration-150">
              <div className="font-extrabold text-xs text-teal-900 flex items-center justify-between">
                <span>Form Tambah Personil Lab Baru</span>
                <button onClick={() => setIsAddingPersonnel(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer"><X className="w-4 h-4" /></button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Nama Lengkap &amp; Gelar:</label>
                  <input
                    type="text"
                    placeholder="Contoh: Ir. Budi Santoso, MT"
                    value={newPersonnelName}
                    onChange={e => setNewPersonnelName(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 font-bold focus:border-teal-600"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Peran Utama (Role):</label>
                  <select
                    value={newPersonnelRole}
                    onChange={e => setNewPersonnelRole(e.target.value as PersonnelRole)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 font-bold focus:border-teal-600"
                  >
                    <option value="Penguji">Penguji (Tested By)</option>
                    <option value="Analyst">Analyst (Data Analysis)</option>
                    <option value="Computed">Computed (Dihitung Oleh)</option>
                    <option value="Approver">Approver (Checker / Disetujui)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Jabatan / Posisi Resmi:</label>
                  <input
                    type="text"
                    placeholder="Contoh: Senior Geotechnical Engineer"
                    value={newPersonnelTitle}
                    onChange={e => setNewPersonnelTitle(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 font-bold focus:border-teal-600"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button onClick={() => setIsAddingPersonnel(false)} className="px-3 py-1.5 rounded-lg bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer">Batal</button>
                <button onClick={handleAddPersonnel} className="px-4 py-1.5 rounded-lg bg-teal-600 text-white text-xs font-bold cursor-pointer shadow-sm">Simpan Personil</button>
              </div>
            </div>
          )}

          {/* Table Data */}
          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-600 font-extrabold border-b border-slate-200">
                  <th className="py-2.5 px-3 text-center w-12">No</th>
                  <th className="py-2.5 px-4">Nama Lengkap / Personil</th>
                  <th className="py-2.5 px-4 text-center w-44">Peran Utama (Role)</th>
                  <th className="py-2.5 px-4">Jabatan / Posisi Resmi</th>
                  <th className="py-2.5 px-4 text-center w-48">Tanda Tangan Digital</th>
                  <th className="py-2.5 px-3 text-center w-24">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans">
                {filteredPersonnel.map((p, idx) => {
                  const isEditing = editingPersonnelId === p.id;
                  const roleBadge = p.role === 'Penguji'
                    ? { bg: 'bg-blue-100 text-blue-900 border-blue-200', label: 'Penguji (Tested By)' }
                    : p.role === 'Analyst'
                      ? { bg: 'bg-purple-100 text-purple-900 border-purple-200', label: 'Analyst (Data Analysis)' }
                      : p.role === 'Computed'
                        ? { bg: 'bg-emerald-100 text-emerald-900 border-emerald-200', label: 'Computed (Calculated By)' }
                        : { bg: 'bg-amber-100 text-amber-900 border-amber-200', label: 'Approver (Checker / Disetujui)' };

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-2.5 px-3 text-center font-mono text-slate-500">{idx + 1}</td>
                      <td className="py-2.5 px-4 font-extrabold text-slate-900">
                        {isEditing ? (
                          <input
                            type="text"
                            value={editingPersonnelData?.name || ''}
                            onChange={e => setEditingPersonnelData(prev => prev ? { ...prev, name: e.target.value } : null)}
                            className="w-full bg-white border border-teal-500 rounded px-2 py-1 font-bold"
                          />
                        ) : (
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-slate-400 shrink-0" />
                            <span>{p.name}</span>
                          </div>
                        )}
                      </td>
                      <td className="py-2.5 px-4 text-center">
                        {isEditing ? (
                          <select
                            value={editingPersonnelData?.role || 'Penguji'}
                            onChange={e => setEditingPersonnelData(prev => prev ? { ...prev, role: e.target.value as PersonnelRole } : null)}
                            className="bg-white border border-teal-500 rounded px-2 py-1 font-bold text-xs"
                          >
                            <option value="Penguji">Penguji</option>
                            <option value="Analyst">Analyst</option>
                            <option value="Computed">Computed</option>
                            <option value="Approver">Approver</option>
                          </select>
                        ) : (
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${roleBadge.bg}`}>
                            {roleBadge.label}
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-4 text-slate-600 font-medium">
                        {isEditing ? (
                          <input
                            type="text"
                            value={editingPersonnelData?.title || ''}
                            onChange={e => setEditingPersonnelData(prev => prev ? { ...prev, title: e.target.value } : null)}
                            className="w-full bg-white border border-teal-500 rounded px-2 py-1 font-bold"
                          />
                        ) : (
                          <span>{p.title || '-'}</span>
                        )}
                      </td>
                      <td className="py-2 px-3 text-center">
                        {p.signatureUrl || p.digitalSignatureUrl ? (
                          <div className="flex items-center justify-center gap-2">
                            <div className="p-1 rounded-lg bg-slate-50 border border-slate-200 h-10 w-24 flex items-center justify-center overflow-hidden shadow-2xs group relative">
                              <img src={p.signatureUrl || p.digitalSignatureUrl} alt={`Tanda tangan ${p.name}`} className="max-h-8 max-w-full object-contain" />
                            </div>
                            <label className="p-1.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-teal-50 hover:text-teal-700 border border-slate-200 cursor-pointer transition" title="Ganti Tanda Tangan">
                              <Upload className="w-3.5 h-3.5" />
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) handleUploadSignature(p.id, file);
                                }}
                              />
                            </label>
                            <button
                              onClick={() => handleRemoveSignature(p.id, p.name)}
                              className="p-1.5 rounded-lg bg-slate-100 text-slate-400 hover:bg-red-50 hover:text-red-600 border border-slate-200 cursor-pointer transition"
                              title="Hapus Tanda Tangan"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <label className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-teal-50 text-teal-800 hover:bg-teal-100 border border-teal-200 text-[11px] font-bold cursor-pointer transition shadow-2xs">
                            <Upload className="w-3.5 h-3.5 text-teal-600" />
                            <span>Upload TT</span>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleUploadSignature(p.id, file);
                              }}
                            />
                          </label>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        {isEditing ? (
                          <div className="flex items-center justify-center gap-1">
                            <button onClick={handleSavePersonnelEdit} className="p-1 rounded bg-emerald-600 text-white hover:bg-emerald-700 cursor-pointer" title="Simpan"><Check className="w-3.5 h-3.5" /></button>
                            <button onClick={() => { setEditingPersonnelId(null); setEditingPersonnelData(null); }} className="p-1 rounded bg-slate-200 text-slate-600 hover:bg-slate-300 cursor-pointer" title="Batal"><X className="w-3.5 h-3.5" /></button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center gap-1">
                            <button onClick={() => { setEditingPersonnelId(p.id); setEditingPersonnelData(p); }} className="p-1 rounded bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-blue-600 cursor-pointer" title="Edit"><Edit3 className="w-3.5 h-3.5" /></button>
                            <button onClick={() => handleDeletePersonnel(p.id, p.name)} className="p-1 rounded bg-slate-100 text-slate-600 hover:bg-red-50 hover:text-red-600 cursor-pointer" title="Hapus"><Trash2 className="w-3.5 h-3.5" /></button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: JENIS UJI MATRIX */}
      {activeSubTab === 'tests' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <FlaskConical className="w-5 h-5 text-teal-600" />
                Master Katalogue Jenis Pengujian Matrix ({testCatalogue.length} Jenis Uji)
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Katalog resmi jenis uji laboratorium yang terkelompok secara terstruktur: <strong>Sifat Fisik Tanah (Physical Properties)</strong> &amp; <strong>Sifat Mekanis Tanah (Mechanical Properties)</strong>.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveSubTab('prices')}
                className="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer border border-blue-200"
              >
                <DollarSign className="w-3.5 h-3.5" />
                Buka Master Tarif &amp; Harga Uji
              </button>
              <button
                onClick={onResetCatalogue}
                className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-red-50 border border-slate-200 hover:border-red-200 text-slate-700 hover:text-red-700 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset Default
              </button>
            </div>
          </div>

          {/* SIFAT FISIK TANAH (PHYSICAL PROPERTIES) */}
          {(() => {
            const isPhys = (code?: string, cat?: string) => cat === 'physical' || (!cat && ['SG','MC','UW','ATB','SVE-HYD','S&H','CMP-STD','CMP-MOD','PRM','PERM','PREP','BD-DD','SND-CONE','SWELLING','SHRINKAGE','PH','CHLORID','SULFAT','CARBONAT','RESISTIVITY'].includes((code || '').toUpperCase()));
            const physItems = filteredTests.filter(t => isPhys(t.code, t.category));
            const mechItems = filteredTests.filter(t => !isPhys(t.code, t.category));

            return (
              <>
                <div className="space-y-2">
                  <div className="flex items-center justify-between px-3 py-2 bg-blue-50 border-l-4 border-blue-600 rounded-r-xl">
                    <h4 className="font-extrabold text-blue-900 text-xs flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                      Sifat Fisik Tanah (Physical Properties)
                    </h4>
                    <span className="text-[11px] font-bold text-blue-700 bg-white px-2.5 py-0.5 rounded-full border border-blue-200">
                      {physItems.length} Parameter
                    </span>
                  </div>

                  <div className="overflow-x-auto border border-slate-200 rounded-xl">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                        <tr>
                          <th className="px-4 py-2.5 w-10 text-center">#</th>
                          <th className="px-4 py-2.5">Kode Uji</th>
                          <th className="px-4 py-2.5">Label Header</th>
                          <th className="px-4 py-2.5">Nama Pengujian (Bahasa Indonesia)</th>
                          <th className="px-4 py-2.5">Kategori Uji</th>
                          <th className="px-4 py-2.5">Standar SNI</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-mono">
                        {physItems.map((item, idx) => (
                          <tr key={item.code} className="hover:bg-blue-50/40 transition-colors">
                            <td className="px-4 py-2.5 text-center text-slate-400 font-sans">{idx + 1}</td>
                            <td className="px-4 py-2.5 font-bold text-slate-900">{item.code}</td>
                            <td className="px-4 py-2.5 text-teal-700 font-bold">{item.label}</td>
                            <td className="px-4 py-2.5 font-sans font-medium text-slate-800">{item.fullNameIndo}</td>
                            <td className="px-4 py-2.5 font-sans">
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                                Physical Properties
                              </span>
                            </td>
                            <td className="px-4 py-2.5 text-amber-700 font-semibold">{item.sniStandard || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* SIFAT MEKANIS TANAH (MECHANICAL PROPERTIES) */}
                <div className="space-y-2 pt-2">
                  <div className="flex items-center justify-between px-3 py-2 bg-purple-50 border-l-4 border-purple-600 rounded-r-xl">
                    <h4 className="font-extrabold text-purple-900 text-xs flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-purple-600" />
                      Sifat Mekanis Tanah (Mechanical Properties)
                    </h4>
                    <span className="text-[11px] font-bold text-purple-700 bg-white px-2.5 py-0.5 rounded-full border border-purple-200">
                      {mechItems.length} Parameter
                    </span>
                  </div>

                  <div className="overflow-x-auto border border-slate-200 rounded-xl">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                        <tr>
                          <th className="px-4 py-2.5 w-10 text-center">#</th>
                          <th className="px-4 py-2.5">Kode Uji</th>
                          <th className="px-4 py-2.5">Label Header</th>
                          <th className="px-4 py-2.5">Nama Pengujian (Bahasa Indonesia)</th>
                          <th className="px-4 py-2.5">Kategori Uji</th>
                          <th className="px-4 py-2.5">Standar SNI</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-mono">
                        {mechItems.map((item, idx) => (
                          <tr key={item.code} className="hover:bg-purple-50/40 transition-colors">
                            <td className="px-4 py-2.5 text-center text-slate-400 font-sans">{idx + 1}</td>
                            <td className="px-4 py-2.5 font-bold text-slate-900">{item.code}</td>
                            <td className="px-4 py-2.5 text-purple-700 font-bold">{item.label}</td>
                            <td className="px-4 py-2.5 font-sans font-medium text-slate-800">{item.fullNameIndo}</td>
                            <td className="px-4 py-2.5 font-sans">
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200">
                                Mechanical Properties
                              </span>
                            </td>
                            <td className="px-4 py-2.5 text-amber-700 font-semibold">{item.sniStandard || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            );
          })()}
        </div>
      )}

      {/* TAB 5: TIPE SAMPEL */}
      {activeSubTab === 'sample_types' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Tag className="w-5 h-5 text-teal-600" />
                Master Data Tipe Sampel Tanah
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Daftar pilihan dropdown tipe sampel (misal: UDS, DS, Curah) yang digunakan saat membuat/mengubah data sampel.
              </p>
            </div>
            <button
              onClick={onResetSampleTypeCatalogue}
              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-red-50 border border-slate-200 hover:border-red-200 text-slate-700 hover:text-red-700 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset Tipe Sampel
            </button>
          </div>

          <div className="space-y-2">
            {sampleTypeCatalogue.map((st, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-slate-50/50 font-semibold text-xs text-slate-800">
                <span>{st}</span>
                <span className="text-[10px] text-teal-700 font-bold bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                  Aktif
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB: MASTER MOLD COMPACTION */}
      {activeSubTab === 'molds' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Box className="w-5 h-5 text-orange-600" />
                Master Mold Compaction (Standard &amp; Modified Proctor)
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Katalog dimensi &amp; berat mold khusus Uji Pemadatan Ringan (Standard ~10cm) dan Pemadatan Berat (Modified ~15cm).
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsAddingMold(true)}
                className="px-3.5 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-orange-600/20 transition cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Mold Compaction</span>
              </button>
            </div>
          </div>

          {/* Form Modal Tambah Mold */}
          {isAddingMold && (
            <div className="p-4 rounded-xl bg-orange-50/80 border border-orange-200 space-y-3 animate-in fade-in duration-150">
              <div className="font-extrabold text-xs text-orange-900 flex items-center justify-between">
                <span>Form Tambah Mold Compaction Baru</span>
                <button onClick={() => setIsAddingMold(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer"><X className="w-4 h-4" /></button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 text-xs">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Kode Mold:</label>
                  <input
                    type="text"
                    placeholder="Contoh: C"
                    value={newMold.kode}
                    onChange={e => setNewMold({ ...newMold, kode: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 font-bold focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Metode Uji:</label>
                  <select
                    value={newMold.kategori}
                    onChange={e => setNewMold({ ...newMold, kategori: e.target.value as any })}
                    className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 font-bold focus:border-orange-500"
                  >
                    <option value="Standard">Standard Proctor (~10cm)</option>
                    <option value="Modified">Modified Proctor (~15cm)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Diameter (cm):</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newMold.diameterCm}
                    onChange={e => setNewMold({ ...newMold, diameterCm: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 font-bold focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Tinggi (cm):</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newMold.heightCm}
                    onChange={e => setNewMold({ ...newMold, heightCm: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 font-bold focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Berat Kosong (g):</label>
                  <input
                    type="number"
                    step="0.1"
                    value={newMold.weightGrams}
                    onChange={e => setNewMold({ ...newMold, weightGrams: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 font-bold focus:border-orange-500"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button onClick={() => setIsAddingMold(false)} className="px-3 py-1.5 rounded-lg bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer">Batal</button>
                <button onClick={handleAddMold} className="px-4 py-1.5 rounded-lg bg-orange-600 text-white text-xs font-bold cursor-pointer shadow-sm">Simpan Mold</button>
              </div>
            </div>
          )}

          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="px-4 py-2 w-10">#</th>
                  <th className="px-4 py-2">Kode Mold</th>
                  <th className="px-4 py-2">Metode Uji</th>
                  <th className="px-4 py-2">Diameter (cm)</th>
                  <th className="px-4 py-2">Tinggi (cm)</th>
                  <th className="px-4 py-2">Berat (g)</th>
                  <th className="px-4 py-2 text-center w-36">Terakhir Diubah</th>
                  <th className="px-4 py-2 text-center w-20">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {(moldCatalogue || []).filter(m => m.kategori !== 'CBR').map((m, idx) => {
                  const isEditing = editingMoldIndex === idx;
                  return (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="px-4 py-2 text-slate-400 font-sans">{idx + 1}</td>
                      <td className="px-4 py-2 font-bold text-slate-800">
                        {isEditing && editingMoldData ? (
                          <input
                            type="text"
                            value={editingMoldData.kode}
                            onChange={e => setEditingMoldData({ ...editingMoldData, kode: e.target.value })}
                            className="w-24 px-2 py-1 border border-orange-500 rounded bg-orange-50 text-xs font-bold"
                          />
                        ) : (
                          m.kode
                        )}
                      </td>
                      <td className="px-4 py-2 font-sans">
                        {isEditing && editingMoldData ? (
                          <select
                            value={editingMoldData.kategori || 'Standard'}
                            onChange={e => setEditingMoldData({ ...editingMoldData, kategori: e.target.value as any })}
                            className="px-2 py-1 border border-orange-500 rounded bg-orange-50 text-xs font-bold"
                          >
                            <option value="Standard">Standard</option>
                            <option value="Modified">Modified</option>
                          </select>
                        ) : (
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${m.kategori === 'Modified' ? 'bg-purple-100 text-purple-800' : 'bg-amber-100 text-amber-800'}`}>
                            {m.kategori || (m.diameterCm > 12 ? 'Modified' : 'Standard')}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-2 font-medium text-slate-700">
                        {isEditing && editingMoldData ? (
                          <input
                            type="number"
                            step="0.001"
                            value={editingMoldData.diameterCm}
                            onChange={e => setEditingMoldData({ ...editingMoldData, diameterCm: parseFloat(e.target.value) || 0 })}
                            className="w-20 px-2 py-1 border border-orange-500 rounded bg-orange-50 text-xs font-bold"
                          />
                        ) : (
                          Number(m.diameterCm).toFixed(3)
                        )}
                      </td>
                      <td className="px-4 py-2 font-medium text-slate-700">
                        {isEditing && editingMoldData ? (
                          <input
                            type="number"
                            step="0.001"
                            value={editingMoldData.heightCm}
                            onChange={e => setEditingMoldData({ ...editingMoldData, heightCm: parseFloat(e.target.value) || 0 })}
                            className="w-20 px-2 py-1 border border-orange-500 rounded bg-orange-50 text-xs font-bold"
                          />
                        ) : (
                          Number(m.heightCm).toFixed(3)
                        )}
                      </td>
                      <td className="px-4 py-2 font-medium text-slate-700">
                        {isEditing && editingMoldData ? (
                          <input
                            type="number"
                            step="0.1"
                            value={editingMoldData.weightGrams}
                            onChange={e => setEditingMoldData({ ...editingMoldData, weightGrams: parseFloat(e.target.value) || 0 })}
                            className="w-24 px-2 py-1 border border-orange-500 rounded bg-orange-50 text-xs font-bold"
                          />
                        ) : (
                          Number(m.weightGrams).toFixed(3)
                        )}
                      </td>
                      <td className="px-4 py-2 font-sans text-center text-slate-500 text-[11px]">{formatDate(m.updatedAt)}</td>
                      <td className="px-4 py-2 text-center">
                        {isEditing ? (
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={handleSaveMoldEdit}
                              className="p-1 rounded bg-emerald-600 text-white hover:bg-emerald-700 cursor-pointer"
                              title="Simpan"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => { setEditingMoldIndex(null); setEditingMoldData(null); }}
                              className="p-1 rounded bg-slate-300 text-slate-700 hover:bg-slate-400 cursor-pointer"
                              title="Batal"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => {
                                setEditingMoldIndex(idx);
                                setEditingMoldData({ ...m });
                              }}
                              className="p-1 rounded text-slate-500 hover:text-orange-600 hover:bg-orange-50 cursor-pointer"
                              title="Edit Mold"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteMold(idx, m.kode)}
                              className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 cursor-pointer"
                              title="Hapus Mold"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB: MASTER MOLD CBR */}
      {activeSubTab === 'cbr_molds' && (
        <div className="bg-white rounded-2xl border border-teal-200 shadow-sm p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-extrabold text-teal-950 flex items-center gap-2">
                <Box className="w-5 h-5 text-teal-600" />
                Master Mold CBR (SNI 1744:2012 / ASTM D1883)
              </h3>
              <p className="text-xs text-teal-700 font-medium mt-0.5">
                Katalog dimensi &amp; berat mold terkalibrasi khusus Uji CBR Laboratorium (Diameter ~15.2cm, Tinggi ~17.8cm).
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsAddingMold(true)}
                className="px-3.5 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-teal-600/20 transition cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Mold CBR</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto border border-teal-200 rounded-xl">
            <table className="w-full text-xs text-left">
              <thead className="bg-teal-50 text-teal-900 font-bold border-b border-teal-200">
                <tr>
                  <th className="px-4 py-2 w-10">#</th>
                  <th className="px-4 py-2">Kode Mold CBR</th>
                  <th className="px-4 py-2">Metode Uji</th>
                  <th className="px-4 py-2">Diameter (mm / cm)</th>
                  <th className="px-4 py-2">Tinggi (mm / cm)</th>
                  <th className="px-4 py-2">Berat Kosong (g)</th>
                  <th className="px-4 py-2">Volume (cm³)</th>
                  <th className="px-4 py-2 text-center w-36">Terakhir Diubah</th>
                  <th className="px-4 py-2 text-center w-20">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {(moldCatalogue || []).filter(m => m.kategori === 'CBR').map((m, idx) => {
                  const isEditing = editingMoldIndex === idx;
                  return (
                    <tr key={idx} className="hover:bg-teal-50/50">
                      <td className="px-4 py-2 text-slate-400 font-sans">{idx + 1}</td>
                      <td className="px-4 py-2 font-bold text-teal-900">
                        {isEditing && editingMoldData ? (
                          <input
                            type="text"
                            value={editingMoldData.kode}
                            onChange={e => setEditingMoldData({ ...editingMoldData, kode: e.target.value })}
                            className="w-24 px-2 py-1 border border-teal-500 rounded bg-teal-50 text-xs font-bold"
                          />
                        ) : (
                          `Mold ${m.kode}`
                        )}
                      </td>
                      <td className="px-4 py-2 font-sans">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-teal-100 text-teal-800">
                          CBR (SNI 1744)
                        </span>
                      </td>
                      <td className="px-4 py-2 font-medium text-slate-700">
                        {isEditing && editingMoldData ? (
                          <input
                            type="number"
                            step="0.01"
                            value={editingMoldData.diameterCm}
                            onChange={e => setEditingMoldData({ ...editingMoldData, diameterCm: parseFloat(e.target.value) || 0 })}
                            className="w-20 px-2 py-1 border border-teal-500 rounded bg-teal-50 text-xs font-bold"
                          />
                        ) : (
                          `${m.diameterMm ? m.diameterMm.toFixed(2) : (m.diameterCm * 10).toFixed(2)} mm (${m.diameterCm.toFixed(2)} cm)`
                        )}
                      </td>
                      <td className="px-4 py-2 font-medium text-slate-700">
                        {isEditing && editingMoldData ? (
                          <input
                            type="number"
                            step="0.01"
                            value={editingMoldData.heightCm}
                            onChange={e => setEditingMoldData({ ...editingMoldData, heightCm: parseFloat(e.target.value) || 0 })}
                            className="w-20 px-2 py-1 border border-teal-500 rounded bg-teal-50 text-xs font-bold"
                          />
                        ) : (
                          `${m.heightMm ? m.heightMm.toFixed(2) : (m.heightCm * 10).toFixed(2)} mm (${m.heightCm.toFixed(2)} cm)`
                        )}
                      </td>
                      <td className="px-4 py-2 font-bold text-teal-900">
                        {isEditing && editingMoldData ? (
                          <input
                            type="number"
                            step="0.1"
                            value={editingMoldData.weightGrams}
                            onChange={e => setEditingMoldData({ ...editingMoldData, weightGrams: parseFloat(e.target.value) || 0 })}
                            className="w-24 px-2 py-1 border border-teal-500 rounded bg-teal-50 text-xs font-bold"
                          />
                        ) : (
                          `${Number(m.weightGrams).toFixed(2)} g`
                        )}
                      </td>
                      <td className="px-4 py-2 font-extrabold text-slate-900">
                        {m.volumeCm3 ? `${m.volumeCm3.toFixed(2)} cm³` : '-'}
                      </td>
                      <td className="px-4 py-2 font-sans text-center text-slate-500 text-[11px]">{formatDate(m.updatedAt)}</td>
                      <td className="px-4 py-2 text-center">
                        {isEditing ? (
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={handleSaveMoldEdit}
                              className="p-1 rounded bg-emerald-600 text-white hover:bg-emerald-700 cursor-pointer"
                              title="Simpan"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => { setEditingMoldIndex(null); setEditingMoldData(null); }}
                              className="p-1 rounded bg-slate-300 text-slate-700 hover:bg-slate-400 cursor-pointer"
                              title="Batal"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => {
                                setEditingMoldIndex(idx);
                                setEditingMoldData({ ...m });
                              }}
                              className="p-1 rounded text-slate-500 hover:text-teal-600 hover:bg-teal-50 cursor-pointer"
                              title="Edit Mold CBR"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteMold(idx, m.kode)}
                              className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 cursor-pointer"
                              title="Hapus Mold CBR"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB: MASTER REAMER COMPACTION */}
      {activeSubTab === 'reamers' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Box className="w-5 h-5 text-amber-600" />
                Master Reamer Compaction (Standard &amp; Modified Proctor)
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Katalog berat penumbuk/reamer untuk Standard Proctor (2.5kg) dan Modified Proctor (4.3-4.4kg).
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsAddingReamer(true)}
                className="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-amber-600/20 transition cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Reamer Compaction</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="px-4 py-2 w-10">#</th>
                  <th className="px-4 py-2">Kode Reamer</th>
                  <th className="px-4 py-2">Metode Uji</th>
                  <th className="px-4 py-2">Berat (kg)</th>
                  <th className="px-4 py-2 text-center w-36">Terakhir Diubah</th>
                  <th className="px-4 py-2 text-center w-20">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {(reamerCatalogue || []).filter(r => r.kategori !== 'CBR').map((r, idx) => {
                  const isEditing = editingReamerIndex === idx;
                  return (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="px-4 py-2 text-slate-400 font-sans">{idx + 1}</td>
                      <td className="px-4 py-2 font-bold text-slate-800">
                        {isEditing && editingReamerData ? (
                          <input
                            type="text"
                            value={editingReamerData.kode}
                            onChange={e => setEditingReamerData({ ...editingReamerData, kode: e.target.value })}
                            className="w-24 px-2 py-1 border border-amber-500 rounded bg-amber-50 text-xs font-bold"
                          />
                        ) : (
                          r.kode
                        )}
                      </td>
                      <td className="px-4 py-2 font-sans">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${r.kategori === 'Modified' ? 'bg-purple-100 text-purple-800' : 'bg-amber-100 text-amber-800'}`}>
                          {r.kategori || (r.weightKg > 3 ? 'Modified' : 'Standard')}
                        </span>
                      </td>
                      <td className="px-4 py-2 font-medium text-slate-700">
                        {isEditing && editingReamerData ? (
                          <input
                            type="number"
                            step="0.0001"
                            value={editingReamerData.weightKg}
                            onChange={e => setEditingReamerData({ ...editingReamerData, weightKg: parseFloat(e.target.value) || 0 })}
                            className="w-24 px-2 py-1 border border-amber-500 rounded bg-amber-50 text-xs font-bold"
                          />
                        ) : (
                          Number(r.weightKg).toFixed(4)
                        )}
                      </td>
                      <td className="px-4 py-2 font-sans text-center text-slate-500 text-[11px]">{formatDate(r.updatedAt)}</td>
                      <td className="px-4 py-2 text-center">
                        {isEditing ? (
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={handleSaveReamerEdit}
                              className="p-1 rounded bg-emerald-600 text-white hover:bg-emerald-700 cursor-pointer"
                              title="Simpan"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => { setEditingReamerIndex(null); setEditingReamerData(null); }}
                              className="p-1 rounded bg-slate-300 text-slate-700 hover:bg-slate-400 cursor-pointer"
                              title="Batal"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => {
                                setEditingReamerIndex(idx);
                                setEditingReamerData({ ...r });
                              }}
                              className="p-1 rounded text-slate-500 hover:text-amber-600 hover:bg-amber-50 cursor-pointer"
                              title="Edit Reamer"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteReamer(idx, r.kode)}
                              className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 cursor-pointer"
                              title="Hapus Reamer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB: MASTER REAMER CBR */}
      {activeSubTab === 'cbr_reamers' && (
        <div className="bg-white rounded-2xl border border-emerald-200 shadow-sm p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-extrabold text-emerald-950 flex items-center gap-2">
                <Box className="w-5 h-5 text-emerald-600" />
                Master Reamer / Penumbuk CBR (SNI 1744:2012)
              </h3>
              <p className="text-xs text-emerald-700 font-medium mt-0.5">
                Katalog berat penumbuk/reamer terkalibrasi khusus Uji CBR Laboratorium (7.34 kg - 7.36 kg).
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsAddingReamer(true)}
                className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-600/20 transition cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Reamer CBR</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto border border-emerald-200 rounded-xl">
            <table className="w-full text-xs text-left">
              <thead className="bg-emerald-50 text-emerald-900 font-bold border-b border-emerald-200">
                <tr>
                  <th className="px-4 py-2 w-10">#</th>
                  <th className="px-4 py-2">Kode Reamer CBR</th>
                  <th className="px-4 py-2">Metode Uji</th>
                  <th className="px-4 py-2">Berat Penumbuk (kg)</th>
                  <th className="px-4 py-2 text-center w-36">Terakhir Diubah</th>
                  <th className="px-4 py-2 text-center w-20">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {(reamerCatalogue || []).filter(r => r.kategori === 'CBR').map((r, idx) => {
                  const isEditing = editingReamerIndex === idx;
                  return (
                    <tr key={idx} className="hover:bg-emerald-50/50">
                      <td className="px-4 py-2 text-slate-400 font-sans">{idx + 1}</td>
                      <td className="px-4 py-2 font-bold text-emerald-950">
                        {isEditing && editingReamerData ? (
                          <input
                            type="text"
                            value={editingReamerData.kode}
                            onChange={e => setEditingReamerData({ ...editingReamerData, kode: e.target.value })}
                            className="w-24 px-2 py-1 border border-emerald-500 rounded bg-emerald-50 text-xs font-bold"
                          />
                        ) : (
                          r.kode
                        )}
                      </td>
                      <td className="px-4 py-2 font-sans">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          CBR (SNI 1744)
                        </span>
                      </td>
                      <td className="px-4 py-2 font-extrabold text-emerald-900">
                        {isEditing && editingReamerData ? (
                          <input
                            type="number"
                            step="0.0001"
                            value={editingReamerData.weightKg}
                            onChange={e => setEditingReamerData({ ...editingReamerData, weightKg: parseFloat(e.target.value) || 0 })}
                            className="w-24 px-2 py-1 border border-emerald-500 rounded bg-emerald-50 text-xs font-bold"
                          />
                        ) : (
                          `${Number(r.weightKg).toFixed(2)} kg`
                        )}
                      </td>
                      <td className="px-4 py-2 font-sans text-center text-slate-500 text-[11px]">{formatDate(r.updatedAt)}</td>
                      <td className="px-4 py-2 text-center">
                        {isEditing ? (
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={handleSaveReamerEdit}
                              className="p-1 rounded bg-emerald-600 text-white hover:bg-emerald-700 cursor-pointer"
                              title="Simpan"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => { setEditingReamerIndex(null); setEditingReamerData(null); }}
                              className="p-1 rounded bg-slate-300 text-slate-700 hover:bg-slate-400 cursor-pointer"
                              title="Batal"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => {
                                setEditingReamerIndex(idx);
                                setEditingReamerData({ ...r });
                              }}
                              className="p-1 rounded text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 cursor-pointer"
                              title="Edit Reamer CBR"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteReamer(idx, r.kode)}
                              className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 cursor-pointer"
                              title="Hapus Reamer CBR"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
