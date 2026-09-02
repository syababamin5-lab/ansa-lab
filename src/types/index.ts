export type POStatus = 'Draft' | 'Running' | 'On Hold' | 'Completed';
export type SampleStatus = 'Pending' | 'In Progress' | 'Completed' | 'On Hold';
export type TestStatus = 'Belum Diuji' | 'Sedang Diuji' | 'Selesai' | 'Dibatalkan';
export type CalculationStatus = 'Not Started' | 'Draft Data' | 'Calculated' | 'Verified' | 'Approved';

export type CategoryType = 'Sifat Indeks' | 'Kuat Geser' | 'Pemadatan' | 'Permeabilitas' | 'KONSOLIDASI';

export interface SoilColourOption {
  code: number;
  name: string;
  hex: string;
}

export const SOIL_COLOUR_CATALOGUE: SoilColourOption[] = [
  { code: 0, name: 'Belum Dipilih', hex: '#E2E8F0' },
  { code: 1, name: 'Cokelat / Brown', hex: '#8B4513' },
  { code: 2, name: 'Cokelat terang / Light brown', hex: '#CD853F' },
  { code: 3, name: 'Cokelat pucat / Pale brown', hex: '#D2B48C' },
  { code: 4, name: 'Cokelat kekuningan / Yellowish brown', hex: '#B8860B' },
  { code: 5, name: 'Cokelat kekuningan pucat / Pale yellowish brown', hex: '#E5C158' },
  { code: 6, name: 'Cokelat kemerahan / Reddish brown', hex: '#A52A2A' },
  { code: 7, name: 'Cokelat kemerahan tua / Dark reddish brown', hex: '#671C1C' },
  { code: 8, name: 'Cokelat kemerahan sangat tua / Very dark grayish brown', hex: '#4A3B32' },
  { code: 9, name: 'Cokelat abu-abu tua / Dark grayish brown', hex: '#5C5046' },
  { code: 10, name: 'Cokelat tua / Dark brown', hex: '#5C4033' },
  { code: 11, name: 'Cokelat sangat tua / Very dark brown', hex: '#3B2F2F' },
  { code: 12, name: 'Abu-abu / Gray', hex: '#808080' },
  { code: 13, name: 'Abu-abu muda / Light gray', hex: '#D3D3D3' },
  { code: 14, name: 'Abu-abu tua / Dark gray', hex: '#555555' },
  { code: 15, name: 'Abu-abu sangat tua / Very dark gray', hex: '#333333' },
  { code: 16, name: 'Merah muda / Pinkish red', hex: '#BC8F8F' },
  { code: 17, name: 'Merah terang / Light red', hex: '#FF6666' },
  { code: 18, name: 'Merah kuat / Strong red', hex: '#CC0000' },
  { code: 19, name: 'Hitam / Black', hex: '#1C1C1C' }
];

export const DEFAULT_SAMPLE_TYPES = [
  'Sampel Tidak Terganggu / UDS',
  'Sampel Terganggu / DS',
  'Sampel Curah / DS'
];

export interface MatrixTestInfo {
  code: string;
  label: string;
  fullNameIndo: string;
  fullNameEn: string;
  sniStandard: string;
  sniTitle: string;
  category: 'physical' | 'mechanical';
}

export const MATRIX_TEST_CATALOGUE: MatrixTestInfo[] = [
  // ── SIFAT FISIK TANAH (PHYSICAL PROPERTIES) ──────────────────────────────────
  { 
    code: 'SG', 
    label: 'SG', 
    fullNameIndo: 'Spesific Gravity / Uji Berat Jenis Tanah', 
    fullNameEn: 'Specific Gravity Test', 
    sniStandard: 'SNI 1964:2008',
    sniTitle: 'Cara Uji Berat Jenis Tanah',
    category: 'physical'
  },
  { 
    code: 'MC', 
    label: 'MC', 
    fullNameIndo: 'Moisture Content / Uji Kadar Air', 
    fullNameEn: 'Moisture Content Test', 
    sniStandard: 'SNI 1965:2008',
    sniTitle: 'Cara uji Penentuan kadar air tanah dan batuan di laboratorium',
    category: 'physical'
  },
  { 
    code: 'UW', 
    label: 'UW', 
    fullNameIndo: 'Unit Weight / Uji Berat Isi Tanah', 
    fullNameEn: 'Unit Weight / Density Test', 
    sniStandard: 'SNI 03-3637-1994',
    sniTitle: 'Metode Pengujian berat isi tanah berbutir halus dengan cetakan benda uji',
    category: 'physical'
  },
  { 
    code: 'ATB', 
    label: 'ATB', 
    fullNameIndo: 'Atterberg Limit (Batas Cair & Plastis)', 
    fullNameEn: 'Atterberg Limits Test', 
    sniStandard: 'SNI 1966:2008 / 1967:2008',
    sniTitle: 'Cara Uji Penentuan batas Plastis & Indeks Plastisitas (1966) / Batas Cair (1967)',
    category: 'physical'
  },
  { 
    code: 'Sieve-Hydro', 
    label: 'Sieve-Hydro', 
    fullNameIndo: 'Sieve Analysis & Hydrometer', 
    fullNameEn: 'Sieve & Hydrometer Analysis', 
    sniStandard: 'SNI 3423:2008',
    sniTitle: 'Cara Uji analisis ukuran butir tanah',
    category: 'physical'
  },
  { 
    code: 'CMP-STD', 
    label: 'CMP-STD', 
    fullNameIndo: 'Compaction Standard Proctor (Kepadatan Ringan)', 
    fullNameEn: 'Standard Proctor Compaction', 
    sniStandard: 'SNI 1742:2008',
    sniTitle: 'Cara Uji Kepadatan Ringan Untuk Tanah',
    category: 'physical'
  },
  { 
    code: 'CMP-MOD', 
    label: 'CMP-MOD', 
    fullNameIndo: 'Compaction Modified Proctor (Kepadatan Berat)', 
    fullNameEn: 'Modified Proctor Compaction', 
    sniStandard: 'SNI 1743:2008',
    sniTitle: 'Cara Uji Kepadatan Berat Untuk Tanah',
    category: 'physical'
  },
  { 
    code: 'PB', 
    label: 'PB', 
    fullNameIndo: 'Permeability / Uji Kelulusan Air Falling Head', 
    fullNameEn: 'Permeability Falling Head Test', 
    sniStandard: 'SNI 03-6870-2002',
    sniTitle: 'Cara Uji Kelulusan air di laboratorium untuk tanah berbutir halus dengan tinggi tekanan menurun',
    category: 'physical'
  },

  // ── SIFAT MEKANIS TANAH (MECHANICAL PROPERTIES) ──────────────────────────────
  { 
    code: 'CT', 
    label: 'CT', 
    fullNameIndo: 'Consolidation Test (Oedometer) / Uji Konsolidasi', 
    fullNameEn: 'Consolidation / Oedometer Test', 
    sniStandard: 'SNI 2812:2011',
    sniTitle: 'Cara uji konsolidasi tanah satu dimensi',
    category: 'mechanical'
  },
  { 
    code: 'UCT', 
    label: 'UCT', 
    fullNameIndo: 'Unconfined Compression Test (UCS) / Kuat Tekan Bebas', 
    fullNameEn: 'Unconfined Compression Test', 
    sniStandard: 'SNI 3638:2012',
    sniTitle: 'Metode uji kuat tekan bebas tanah kohesif',
    category: 'mechanical'
  },
  { 
    code: 'DS-UU', 
    label: 'DS-UU', 
    fullNameIndo: 'Direct Shear UU / Kuat Geser Langsung UU', 
    fullNameEn: 'Direct Shear Unconsolidated Undrained', 
    sniStandard: 'SNI 3420:2016',
    sniTitle: 'Metode Uji Kuat Geser langsung Tanah Tidak Terkonsolidasi dan Tidak Terdrainase',
    category: 'mechanical'
  },
  { 
    code: 'DS-CU', 
    label: 'DS-CU', 
    fullNameIndo: 'Direct Shear CU / Kuat Geser Langsung CU', 
    fullNameEn: 'Direct Shear Consolidated Undrained', 
    sniStandard: 'SNI 2813:2008',
    sniTitle: 'Cara uji kuat geser langsung Tanah Terkonsolidasi dan Terdrainase',
    category: 'mechanical'
  },
  { 
    code: 'DS-CD', 
    label: 'DS-CD', 
    fullNameIndo: 'Direct Shear CD / Kuat Geser Langsung CD', 
    fullNameEn: 'Direct Shear Consolidated Drained', 
    sniStandard: 'SNI 2813:2008',
    sniTitle: 'Cara uji kuat geser langsung Tanah Terkonsolidasi dan Terdrainase',
    category: 'mechanical'
  },
  { 
    code: 'DS-CDR', 
    label: 'DS-CDR', 
    fullNameIndo: 'Direct Shear CD Residual / Kuat Geser Langsung Residu', 
    fullNameEn: 'Direct Shear CD Residual', 
    sniStandard: 'SNI 2813:2008',
    sniTitle: 'Cara uji kuat geser langsung Tanah Terkonsolidasi dan Terdrainase (Residual)',
    category: 'mechanical'
  },
  { 
    code: 'TRX-UU', 
    label: 'TRX-UU', 
    fullNameIndo: 'Uji Triaxial UU (Unconsolidated Undrained)', 
    fullNameEn: 'Triaxial Unconsolidated Undrained', 
    sniStandard: 'SNI 4813:2015',
    sniTitle: 'Cara uji triaxial untuk tanah kohesif dalam keadaan tidak terkonsolidasi dan tidak terdrainase',
    category: 'mechanical'
  },
  { 
    code: 'TRX-CU', 
    label: 'TRX-CU', 
    fullNameIndo: 'Uji Triaxial CU (Consolidated Undrained)', 
    fullNameEn: 'Triaxial Consolidated Undrained', 
    sniStandard: 'SNI 2455:2015',
    sniTitle: 'Cara Uji triaxial untuk Tanah dalam keadaan terkonsolidasi tidak terdrainase (CU) dan Terkonsolidasi Terdrainase (CD)',
    category: 'mechanical'
  },
  { 
    code: 'TRX-CD', 
    label: 'TRX-CD', 
    fullNameIndo: 'Uji Triaxial CD (Consolidated Drained)', 
    fullNameEn: 'Triaxial Consolidated Drained', 
    sniStandard: 'SNI 2455:2015',
    sniTitle: 'Cara Uji triaxial untuk Tanah dalam keadaan terkonsolidasi tidak terdrainase (CU) dan Terkonsolidasi Terdrainase (CD)',
    category: 'mechanical'
  },
  { 
    code: 'CBR-UNS', 
    label: 'CBR-UNS', 
    fullNameIndo: 'CBR Lab Unsoaked / Tanpa Perendaman', 
    fullNameEn: 'CBR Unsoaked Test', 
    sniStandard: 'SNI 1744:2012',
    sniTitle: 'Metode UJI CBR Laboratorium',
    category: 'mechanical'
  },
  { 
    code: 'CBR-SOK', 
    label: 'CBR-SOK', 
    fullNameIndo: 'CBR Lab Soaked / Dengan Perendaman', 
    fullNameEn: 'CBR Soaked Test', 
    sniStandard: 'SNI 1744:2012',
    sniTitle: 'Metode UJI CBR Laboratorium',
    category: 'mechanical'
  }
];

export interface TestType {
  id: string;
  code: string;
  name: string;
  standard: string;
  defaultDurationHours: number;
  category: CategoryType;
}

export interface TestPhoto {
  id: string;
  url: string;
  caption?: string;
  phase?: 'before' | 'during' | 'after' | 'failure' | 'other';
  timestamp: string;
  testTypeCode?: string;
}

export interface CalculationData {
  inputValues?: Record<string, any>;
  readings?: Array<Record<string, any>>;
  graphPoints?: Array<{ x: number; y: number }>;
  summaryResults?: Record<string, any>;
  notes?: string;
  photos?: TestPhoto[];
  [key: string]: any;
}

export interface SampleTest {
  id: string;
  sampleId: string;
  testTypeId: string;
  testTypeName?: string;
  testTypeCode?: string;
  technicianName: string;
  checkerName?: string;
  approverName?: string;
  dateTested?: string;
  dateTestedEnd?: string;
  status: TestStatus;
  startTime?: string;
  endTime?: string;
  estimatedDurationHours: number;
  
  // Future-Proof Fields
  calculationStatus: CalculationStatus;
  calculationData?: CalculationData;
  originalTechnicianInput?: any; // IMMUTABLE ARCHIVE SNAPSHOT of original technician raw inputs & timestamp
  lockedByTechnician?: boolean;
  verifiedBy?: string;
  verifiedAt?: string;
  cancellationReason?: string;
  photos?: TestPhoto[];
}

export interface Sample {
  id: string;
  poId: string;
  sampleCode: string; // Sample Number
  reportNumber?: string;
  idLab: string; // e.g. LAB-2026-001
  depthStart: number;
  depthEnd: number;
  lithology: string; // e.g. NP, USCS
  soilType: string; // Tipe Tanah
  colourCode: number; // 1 to 19
  colourName: string; // e.g. "Cokelat / Brown"
  sampleType: string;
  testedBy: string; // Penguji
  checkedBy?: string; // Pemeriksa
  approvedBy?: string; // Penyetuju
  dateTested?: string; // Tanggal Mulai Uji
  dateTestedEnd?: string; // Tanggal Selesai Uji
  assignedTechnician?: string;
  locationTag: string; // Rak Cold Room / Storage
  sampleDescription?: string;
  status: SampleStatus;
  tests: SampleTest[];
  photos?: TestPhoto[];
  createdAt: string;
  updatedAt?: string;
}

export interface PurchaseOrder {
  id: string;
  poNumber: string; // Job Number / No PO
  clientName: string;
  clientAddress: string; // Alamat Client
  projectName: string;
  projectLocation: string; // Lokasi Project
  status: POStatus;
  startDate: string;
  deadline: string;
  
  // Timeline dates & responsibilities
  sampleArrivalDate: string; // Tanggal Sampel Datang
  listReceivedDate: string;  // Diterima list uji tanggal
  preparationStartDate: string; // PREPARASI DI MULAI
  testingStartDate: string;  // Awal Pengujian
  reportDate?: string;       // Tanggal Pelaporan
  checkedBy: string;         // Checked By
  computedBy?: string;       // Computed By
  place: string;             // Tempat (e.g. Bandung)

  totalSamplesCount: number;
  notes?: string;
  samples: Sample[];
  createdAt: string;
  updatedAt: string;

  // Per-PO Report Settings
  decimalPlaces?: 2 | 3; // Default: 3 (3 digits after decimal point)
}

export interface ContainerItem {
  id: string; // e.g. "1", "2", "66"
  weight: number; // e.g. 9.03 (grams)
  updatedAt?: string;
}

export interface RingItem {
  ringNo: string; // e.g. "1"
  diameterMm: number; // e.g. 47.6
  heightMm: number; // e.g. 19.5
  weightGrams: number; // e.g. 36.499
  volumeCm3: number; // e.g. 34.701
  updatedAt?: string;
}

export interface ConsolRingItem {
  ringNo: string; // e.g. "C-1"
  diameterMm: number; // e.g. 63.5
  heightMm: number; // e.g. 20.0
  weightGrams: number; // e.g. 118.25
  volumeCm3: number; // e.g. 63.34
  updatedAt?: string;
}

export interface DsProvingItem {
  machineCode: string;
  provingCalibration: number;
  capacityKg?: number;
  updatedAt?: string;
}

export interface DsRingItem {
  ringNo: string; // e.g. "DS-1"
  provingCalibration: number; // e.g. 0.4067 (kgf/div) or N/div
  diameterMm: number; // e.g. 59.4 (mm)
  heightMm: number; // e.g. 24.9 (mm)
  weightGrams: number; // e.g. 63.16 (grams)
  volumeCm3: number; // e.g. 69.00 (cm³)
  updatedAt?: string;
}

export interface TrxRingItem {
  ringNo: string; // e.g. "TRX-1"
  provingCalibration: number; // e.g. 0.12064 (kgf/div)
  capacityKg?: number; // e.g. 300
  updatedAt?: string;
}

export interface UctRingItem {
  ringNo: string; // e.g. "UCT-1"
  provingCalibration: number; // e.g. 0.5778 (kgf/div)
  capacityKg?: number; // e.g. 300
  updatedAt?: string;
}

export interface MoldItem {
  kode: string; // e.g. "A" or "CBR - Mold A"
  kategori?: 'Standard' | 'Modified' | 'CBR';
  diameterCm: number;
  heightCm: number;
  weightGrams: number;
  diameterMm?: number;
  heightMm?: number;
  volumeCm3?: number;
  areaMm2?: number;
  id?: string;
  berat?: number;
  volume?: number;
  diameter?: number;
  tinggi?: number;
  updatedAt?: string;
}

export interface ReamerItem {
  kode: string; // e.g. "A" or "Reamer CBR 1"
  kategori?: 'Standard' | 'Modified' | 'CBR';
  weightKg: number;
  updatedAt?: string;
}

export interface PycnometerItem {
  pycNo: string; // e.g. "1"
  weightWater25: number; // Wt. Pyc + Water at 25°C (grams)
  weightTare: number; // Wt. Pyc Empty (grams)
  updatedAt?: string;
}

export type PersonnelRole = 'Penguji' | 'Analyst' | 'Computed' | 'Approver';

export interface PersonnelItem {
  id: string;
  name: string;
  role: PersonnelRole;
  title?: string;
  signatureUrl?: string;
  digitalSignatureUrl?: string;
}
