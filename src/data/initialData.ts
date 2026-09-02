import { PurchaseOrder, TestType, DocumentItem, SOIL_COLOUR_CATALOGUE, ContainerItem, RingItem, ConsolRingItem, DsRingItem, TrxRingItem, UctRingItem, PycnometerItem, PersonnelItem, MoldItem, ReamerItem } from '../types';
import { Client } from '../types/workflowTypes';

export const MASTER_TEST_TYPES: TestType[] = [
  // Physical & Index Properties
  { id: 'tt-sg', code: 'SG', name: 'Specific Gravity (Berat Jenis)', standard: 'ASTM D854 / SNI 1965:2008', defaultDurationHours: 12, category: 'Sifat Indeks' },
  { id: 'tt-mc', code: 'MC', name: 'Moisture Content (Kadar Air)', standard: 'ASTM D2216 / SNI 1965:2008', defaultDurationHours: 12, category: 'Sifat Indeks' },
  { id: 'tt-uw', code: 'UW', name: 'Unit Weight (Berat Volume)', standard: 'ASTM D7263 / SNI 1964:2008', defaultDurationHours: 12, category: 'Sifat Indeks' },
  { id: 'tt-atb', code: 'ATB', name: 'Atterberg Limits Test (LL, PL, PI)', standard: 'ASTM D4318 / SNI 1967:2008', defaultDurationHours: 24, category: 'Sifat Indeks' },
  { id: 'tt-sve', code: 'Sieve-Hydro', name: 'Sieve Analysis & Hydrometer Test', standard: 'ASTM D422 / SNI 3423:2008', defaultDurationHours: 24, category: 'Sifat Indeks' },
  
  // Compaction
  { id: 'tt-cmp-std', code: 'CMP-STD', name: 'Compaction Standard Proctor', standard: 'ASTM D698 / SNI 1742:2008', defaultDurationHours: 36, category: 'Pemadatan' },
  { id: 'tt-cmp-mod', code: 'CMP-MOD', name: 'Compaction Modified Proctor', standard: 'ASTM D1557 / SNI 1743:2008', defaultDurationHours: 36, category: 'Pemadatan' },
  
  // Permeability & Consolidation
  { id: 'tt-pb', code: 'PB', name: 'Permeability Falling/Constant Head', standard: 'ASTM D2434 / SNI 2435:2008', defaultDurationHours: 40, category: 'Permeabilitas' },
  { id: 'tt-cns', code: 'CT', name: 'Consolidation Oedometer Test', standard: 'ASTM D2435 / SNI 2812:2011', defaultDurationHours: 72, category: 'KONSOLIDASI' },
  
  // Strength Tests
  { id: 'tt-uct', code: 'UCT', name: 'Unconfined Compression Test (UCT)', standard: 'ASTM D2166 / SNI 3638:2012', defaultDurationHours: 18, category: 'Kuat Geser' },
  { id: 'tt-ds-uu', code: 'DS-UU', name: 'Direct Shear UU', standard: 'ASTM D3080 / SNI 2813:2008', defaultDurationHours: 24, category: 'Kuat Geser' },
  { id: 'tt-ds-cu', code: 'DS-CU', name: 'Direct Shear CU', standard: 'ASTM D3080 / SNI 2813:2008', defaultDurationHours: 30, category: 'Kuat Geser' },
  { id: 'tt-ds-cd', code: 'DS-CD', name: 'Direct Shear CD', standard: 'ASTM D3080 / SNI 2813:2008', defaultDurationHours: 48, category: 'Kuat Geser' },
  { id: 'tt-ds-cdr', code: 'DS-CDR', name: 'Direct Shear CD-Residual', standard: 'ASTM D3080 / SNI 2813:2008', defaultDurationHours: 48, category: 'Kuat Geser' },
  
  // Triaxial Tests
  { id: 'tt-trx-uu', code: 'TRX-UU', name: 'Triaxial Compression Test (UU)', standard: 'ASTM D2850 / SNI 2815:2011', defaultDurationHours: 48, category: 'Kuat Geser' },
  { id: 'tt-trx-cu', code: 'TRX-CU', name: 'Triaxial Compression Test (CU)', standard: 'ASTM D4767 / SNI 4813:2015', defaultDurationHours: 72, category: 'Kuat Geser' },
  { id: 'tt-trx-cd', code: 'TRX-CD', name: 'Triaxial Compression Test (CD)', standard: 'ASTM D7181 / SNI 4814:2015', defaultDurationHours: 96, category: 'Kuat Geser' },

  // CBR Tests
  { id: 'tt-cbr-uns', code: 'CBR-UNS', name: 'CBR Lab Unsoaked', standard: 'ASTM D1883 / SNI 1744:2012', defaultDurationHours: 24, category: 'Pemadatan' },
  { id: 'tt-cbr-sok', code: 'CBR-SOK', name: 'CBR Lab Soaked', standard: 'ASTM D1883 / SNI 1744:2012', defaultDurationHours: 96, category: 'Pemadatan' }
];

const now = new Date();
const hoursAgo = (h: number) => new Date(now.getTime() - h * 3600 * 1000).toISOString();
const hoursAhead = (h: number) => new Date(now.getTime() + h * 3600 * 1000).toISOString();

// Master Clients Data
export const INITIAL_CLIENTS: Client[] = [
  {
    id: 'client-gqt',
    clientCode: 'GQT',
    companyName: 'PT. Geoland Quattro Technolab',
    address: 'Jl. Geologi No. 45, Bandung',
    contactPerson: 'Bapa Eka',
    phone: '081291910611',
    email: 'eka.gqt@gmail.com',
    taxId: '121244411102525',
    defaultPriceTier: 'priceGeoland',
    notes: 'Klien Tier 1 Geoland Technolab'
  },
  {
    id: 'client-sml',
    clientCode: 'SML',
    companyName: 'PT. Simbion Mono Lab',
    address: 'Jl. Riset Industri No. 12, Jakarta',
    contactPerson: 'Ibu Windy',
    phone: '08125725121',
    email: 'windy.sml@gmail.com',
    taxId: '12121545454210001',
    defaultPriceTier: 'priceUmum',
    notes: 'Klien umum mitra laboratorium'
  },
  {
    id: 'client-khm',
    clientCode: 'KHM',
    companyName: 'PT. Karam Hexa Mandiri',
    address: 'Jl. Hexa No. 88, Bekasi',
    contactPerson: 'Rudi',
    phone: '0821545124501',
    email: 'rudi@karam.co.id',
    taxId: '2121521212',
    defaultPriceTier: 'priceUmum',
    notes: 'Klien pekerjaan mekanika tanah'
  },
  {
    id: 'client-brs',
    clientCode: 'BRS',
    companyName: 'PT. Bukit Raya Sekawan',
    address: 'Jl. Bukit Raya No. 99, Bogor',
    contactPerson: 'Ibu Siti Nuraliza',
    phone: '08221541215',
    email: 'brs@gmail.com',
    taxId: '312154545',
    defaultPriceTier: 'priceBRS',
    notes: 'Klien Tier 2 Bukit Raya'
  },
  {
    id: 'client-tdk',
    clientCode: 'TDK',
    companyName: 'PT. Transka Dharma Konsultan',
    address: 'Jl. Ir. H. Juanda No. 128, Bandung',
    contactPerson: 'Bapa Doni',
    phone: '0814141484141',
    email: 'doni.tdk@gmail.com',
    taxId: '9984141484141',
    defaultPriceTier: 'priceUmum',
    notes: 'Klien Utama Penyelidikan Geoteknik'
  }
];

// Helper to create sample item
const createTdkSample = (idx: number, boreCode: string, depthStart: number, depthEnd: number) => {
  const labCodeNum = String(idx).padStart(3, '0');
  const sampleId = `smp-tdk-${idx}`;
  const labId = `LAB-DA-9650-${labCodeNum}`;

  const testsList = [
    { code: 'SG', name: 'Specific Gravity (Berat Jenis)', status: idx <= 1 ? 'Selesai' : 'Sedang Diuji' },
    { code: 'MC', name: 'Moisture Content (Kadar Air)', status: idx <= 1 ? 'Selesai' : 'Sedang Diuji' },
    { code: 'UW', name: 'Unit Weight (Berat Volume)', status: idx <= 1 ? 'Selesai' : 'Sedang Diuji' },
    { code: 'ATB', name: 'Atterberg Limits Test (LL, PL, PI)', status: 'Sedang Diuji' },
    { code: 'SIEVE-HYDRO', name: 'Sieve Analysis & Hydrometer Test', status: 'Sedang Diuji' },
    { code: 'PB', name: 'Permeability Falling/Constant Head', status: 'Sedang Diuji' },
    { code: 'DS-UU', name: 'Direct Shear UU', status: 'Sedang Diuji' },
    { code: 'TRX-UU', name: 'Triaxial Compression Test (UU)', status: 'Sedang Diuji' }
  ];

  return {
    id: sampleId,
    poId: 'po-tdk-001',
    sampleCode: boreCode,
    reportNumber: `REP-2026-TDK-${labCodeNum}`,
    idLab: labId,
    depthStart: depthStart,
    depthEnd: depthEnd,
    lithology: 'CH',
    soilType: 'Lempung Plastisitas Tinggi (Fat Clay)',
    sampleType: 'Undisturbed Sample / UDS',
    testedBy: 'Rafi, A.Md.',
    assignedTechnician: 'Rafi, A.Md.',
    locationTag: `Rak Cold-Room A-${labCodeNum}`,
    sampleDescription: `Sampel UDS ${boreCode} kedalaman ${depthStart.toFixed(2)}-${depthEnd.toFixed(2)}m`,
    status: 'In Progress',
    createdAt: hoursAgo(100),
    tests: testsList.map((t) => ({
      id: `t-tdk-${t.code.toLowerCase()}-${idx}`,
      sampleId: sampleId,
      testTypeId: `tt-${t.code.toLowerCase()}`,
      testTypeName: t.name,
      testTypeCode: t.code,
      technicianName: 'Rafi, A.Md.',
      assignedTechnician: 'Rafi, A.Md.',
      status: t.status as any,
      startTime: hoursAgo(24),
      estimatedDurationHours: 24,
      calculationStatus: t.status === 'Selesai' ? 'Verified' : 'Draft Data',
      calculationData: t.status === 'Selesai' ? { summaryResults: { mc: 34.2, density: 1.68 } } : undefined
    }))
  };
};

export const INITIAL_POS: PurchaseOrder[] = [
  {
    id: 'po-tdk-001',
    poNumber: 'PO-TDK-001',
    clientName: 'PT. Transka Dharma Konsultan',
    clientAddress: 'Jl. Ir. H. Juanda No. 128, Bandung',
    projectName: 'Air Baku Terabek',
    projectLocation: 'Bandung, Jawa Barat',
    status: 'Running',
    startDate: '2026-08-01T08:00:00.000Z',
    deadline: hoursAhead(120),
    sampleArrivalDate: '2026-08-01T08:00:00.000Z',
    totalSamplesCount: 13,
    notes: 'Penyelidikan Geoteknik Air Baku Terabek - PT. Transka Dharma Konsultan.',
    createdAt: hoursAgo(100),
    updatedAt: hoursAgo(1),
    samples: [
      createTdkSample(1, 'Bor1-UDS-1', 5.00, 5.55),
      createTdkSample(2, 'Bor1-UDS-2', 8.00, 8.55),
      createTdkSample(3, 'Bor1-UDS-3', 11.00, 11.55),
      createTdkSample(4, 'Bor2-UDS-1', 5.00, 5.55),
      createTdkSample(5, 'Bor2-UDS-2', 8.00, 8.55),
      createTdkSample(6, 'Bor2-UDS-3', 11.00, 11.55),
      createTdkSample(7, 'Bor3-UDS-1', 2.00, 2.55),
      createTdkSample(8, 'Bor3-UDS-2', 5.00, 5.55),
      createTdkSample(9, 'Bor3-UDS-3', 8.00, 8.55),
      createTdkSample(10, 'Bor4-UDS-1', 2.00, 2.55),
      createTdkSample(11, 'Bor4-UDS-2', 5.00, 5.55),
      createTdkSample(12, 'Bor5-UDS-1', 2.00, 2.55),
      createTdkSample(13, 'Bor5-UDS-2', 5.00, 5.55),
    ]
  },
  {
    id: 'po-sandbox-all-in-one',
    poNumber: 'PO-SANDBOX-TEST',
    clientName: 'PT. Terraforma Geoteknik Indonesia (Mode Sandbox)',
    clientAddress: 'Jl. Geoteknik No. 1, Bandung',
    projectName: 'Eksperimen & Validasi Semua Rumus Pengujian Laboratorium',
    projectLocation: 'Laboratorium Mekanika Tanah Utama',
    status: 'Running',
    startDate: '2026-08-01T08:00:00.000Z',
    deadline: hoursAhead(1000),
    sampleArrivalDate: '2026-08-01T08:00:00.000Z',
    totalSamplesCount: 1,
    notes: '[SANDBOX PLAYGROUND] PO uji coba otomatis untuk mengetes akurasi semua rumus perhitungannya.',
    createdAt: hoursAgo(200),
    updatedAt: hoursAgo(1),
    samples: [
      {
        id: 'smp-sandbox-01',
        poId: 'po-sandbox-all-in-one',
        sampleCode: 'BH-SANDBOX (0.00 - 1.00m)',
        reportNumber: 'REP-2026-SANDBOX-01',
        idLab: 'LAB-SANDBOX-TEST',
        depthStart: 0,
        depthEnd: 1,
        lithology: 'NP',
        soilType: 'Sampel Eksperimen All-in-One (Semua 22 Form Uji)',
        sampleType: 'Undisturbed Sample / UDS',
        testedBy: 'Rafi, A.Md.',
        assignedTechnician: 'Rafi, A.Md.',
        locationTag: 'Rak Cold-Room Sandbox',
        sampleDescription: 'Sampel uji coba untuk menguji semua 22 formulir rumus lab.',
        status: 'In Progress',
        createdAt: hoursAgo(200),
        tests: [
          'SG','MC','UW','ATB','SVE-HYD','PRM','CT','UCT',
          'CMP-STD','CMP-MOD','TRX-UU','DS-UU','DS-CD','DS-CD-RES',
          'TRX-CU','TRX-CD','CBR-UNS','CBR-SOK','PLI','UCS-ROCK'
        ].map((code, idx) => ({
          id: `t-sandbox-${code.toLowerCase()}-${idx}`,
          sampleId: 'smp-sandbox-01',
          testTypeId: `tt-${code.toLowerCase()}`,
          testTypeName: `Pengujian ${code}`,
          testTypeCode: code,
          technicianName: 'Rafi, A.Md.',
          assignedTechnician: 'Rafi, A.Md.',
          status: 'Sedang Diuji',
          estimatedDurationHours: 24,
          calculationStatus: 'Draft Data'
        }))
      }
    ]
  }
];

export const INITIAL_DOCUMENTS: DocumentItem[] = [
  { id: 'f-2026', name: '2026', type: 'folder', parentId: null, createdAt: hoursAgo(500), updatedAt: hoursAgo(10) },
  { id: 'f-potdk001', poId: 'po-tdk-001', name: 'PO-TDK-001 (PT Transka Dharma Konsultan)', type: 'folder', parentId: 'f-2026', createdAt: hoursAgo(100), updatedAt: hoursAgo(2) },
  { id: 'doc-tdk-1', poId: 'po-tdk-001', name: 'Formulir_PO-TDK-001_Transka_Dharma_Konsultan.pdf', type: 'file', fileExtension: 'pdf', fileSize: 2150000, mimeType: 'application/pdf', parentId: 'f-potdk001', createdAt: hoursAgo(100), updatedAt: hoursAgo(100) }
];

export const DEFAULT_CONTAINER_CATALOGUE: ContainerItem[] = [
  { id: "A", weight: 9.633 },
  { id: "B", weight: 9.693 },
  { id: "C", weight: 9.800 },
  { id: "D", weight: 9.757 },
  { id: "E", weight: 9.668 },
  { id: "F", weight: 9.575 },
  { id: "G", weight: 9.748 },
  { id: "H", weight: 9.431 },
  { id: "I", weight: 9.446 },
  { id: "J", weight: 9.578 },
  { id: "K", weight: 9.558 },
  { id: "L", weight: 9.704 },
  { "id": "1", "weight": 9.03 },
  { "id": "2", "weight": 8.842 },
  { "id": "3", "weight": 9.041 },
  { "id": "4", "weight": 8.936 },
  { "id": "5", "weight": 8.856 }
];

export const DEFAULT_MOLD_CATALOGUE: MoldItem[] = [
  { kode: "A (Standard)", kategori: "Standard", diameterCm: 10.16, heightCm: 11.64, weightGrams: 4210.00, updatedAt: "2026-08-10T08:00:00.000Z" },
  { kode: "B (Modified)", kategori: "Modified", diameterCm: 15.27, heightCm: 11.64, weightGrams: 6696.00, updatedAt: "2026-08-10T08:00:00.000Z" },
  { kode: "A", kategori: "CBR", diameterCm: 15.23, heightCm: 17.80, weightGrams: 7048.10, diameterMm: 152.30, heightMm: 178.00, volumeCm3: 3242.72, areaMm2: 18217.54, updatedAt: "2026-08-19T19:00:00.000Z" },
  { kode: "B", kategori: "CBR", diameterCm: 15.22, heightCm: 17.78, weightGrams: 6940.20, diameterMm: 152.20, heightMm: 177.80, volumeCm3: 3234.83, areaMm2: 18193.62, updatedAt: "2026-08-19T19:00:00.000Z" },
  { kode: "C", kategori: "CBR", diameterCm: 15.20, heightCm: 17.77, weightGrams: 7031.60, diameterMm: 152.00, heightMm: 177.70, volumeCm3: 3224.52, areaMm2: 18145.84, updatedAt: "2026-08-19T19:00:00.000Z" }
];

export const DEFAULT_REAMER_CATALOGUE: ReamerItem[] = [
  { kode: "A (Standard)", kategori: "Standard", weightKg: 2.50, updatedAt: "2026-08-10T08:00:00.000Z" },
  { kode: "A (Modified)", kategori: "Modified", weightKg: 4.3197, updatedAt: "2026-08-10T08:00:00.000Z" },
  { kode: "B (Modified)", kategori: "Modified", weightKg: 4.3849, updatedAt: "2026-08-10T08:00:00.000Z" },
  { kode: "Reamer CBR 1", kategori: "CBR", weightKg: 7.36, updatedAt: "2026-08-19T19:00:00.000Z" },
  { kode: "Reamer CBR 2", kategori: "CBR", weightKg: 7.34, updatedAt: "2026-08-19T19:00:00.000Z" }
];

export const DEFAULT_RING_CATALOGUE: RingItem[] = [
  { "ringNo": "1", "diameterMm": 47.6, "heightMm": 19.5, "weightGrams": 36.499, "volumeCm3": 34.701 },
  { "ringNo": "2", "diameterMm": 47.6, "heightMm": 19.7, "weightGrams": 36.805, "volumeCm3": 35.057 },
  { "ringNo": "3", "diameterMm": 47.6, "heightMm": 19.6, "weightGrams": 36.847, "volumeCm3": 34.879 },
  { "ringNo": "4", "diameterMm": 47.6, "heightMm": 19.8, "weightGrams": 36.924, "volumeCm3": 35.235 },
  { "ringNo": "5", "diameterMm": 47.6, "heightMm": 20.3, "weightGrams": 37.892, "volumeCm3": 36.124 },
  { "ringNo": "6", "diameterMm": 47.6, "heightMm": 19.6, "weightGrams": 36.617, "volumeCm3": 34.879 },
  { "ringNo": "7", "diameterMm": 47.6, "heightMm": 19.8, "weightGrams": 37.048, "volumeCm3": 35.235 },
  { "ringNo": "8", "diameterMm": 51.025, "heightMm": 20.85, "weightGrams": 38.21, "volumeCm3": 42.635 },
  { "ringNo": "9", "diameterMm": 51.025, "heightMm": 20.95, "weightGrams": 39.84, "volumeCm3": 42.839 },
  { "ringNo": "10", "diameterMm": 50.95, "heightMm": 20.9, "weightGrams": 38.75, "volumeCm3": 42.611 },
  { "ringNo": "11", "diameterMm": 51.025, "heightMm": 20.9, "weightGrams": 39.04, "volumeCm3": 42.737 },
  { "ringNo": "12", "diameterMm": 51.025, "heightMm": 20.9, "weightGrams": 39.03, "volumeCm3": 42.737 },
  { "ringNo": "13", "diameterMm": 50.625, "heightMm": 20.825, "weightGrams": 44.24, "volumeCm3": 41.918 },
  { "ringNo": "14", "diameterMm": 51, "heightMm": 20.95, "weightGrams": 41.73, "volumeCm3": 42.797 },
  { "ringNo": "15", "diameterMm": 50.925, "heightMm": 20.775, "weightGrams": 40.84, "volumeCm3": 42.315 },
  { "ringNo": "16", "diameterMm": 50.975, "heightMm": 20.85, "weightGrams": 41.21, "volumeCm3": 42.551 },
  { "ringNo": "17", "diameterMm": 50.95, "heightMm": 20.875, "weightGrams": 42.72, "volumeCm3": 42.56 }
];

export const DEFAULT_CONSOL_RING_CATALOGUE: ConsolRingItem[] = [
  { ringNo: "C-1", diameterMm: 50.70, heightMm: 20.10, weightGrams: 41.467, volumeCm3: 40.572 },
  { ringNo: "C-2", diameterMm: 50.20, heightMm: 20.10, weightGrams: 44.958, volumeCm3: 39.782 },
  { ringNo: "C-3", diameterMm: 50.60, heightMm: 19.70, weightGrams: 42.502, volumeCm3: 39.615 },
  { ringNo: "C-4", diameterMm: 50.50, heightMm: 20.40, weightGrams: 48.853, volumeCm3: 40.860 },
  { ringNo: "C-5", diameterMm: 50.50, heightMm: 20.20, weightGrams: 45.231, volumeCm3: 40.459 },
  { ringNo: "C-6", diameterMm: 50.50, heightMm: 20.00, weightGrams: 47.069, volumeCm3: 40.059 }
];

export interface DsProvingItem {
  machineCode: string;
  provingCalibration: number;
  capacityKg?: number;
  updatedAt?: string;
}

export const DEFAULT_DS_PROVING_CATALOGUE: DsProvingItem[] = [
  { machineCode: "Mesin DS-01 (Standard)", provingCalibration: 0.4067, capacityKg: 300, updatedAt: "2025-03-15T00:00:00.000Z" }
];

export const DEFAULT_DS_RING_CATALOGUE: DsRingItem[] = [
  { ringNo: "DS-1", provingCalibration: 0.4067, diameterMm: 59.4, heightMm: 24.9, weightGrams: 63.16, volumeCm3: 69.00 }
];

export const DEFAULT_TRX_RING_CATALOGUE: TrxRingItem[] = [
  { ringNo: "GT-105 (S/N: 235669)", provingCalibration: 0.12064, capacityKg: 300, updatedAt: "2025-03-15T00:00:00.000Z" },
  { ringNo: "TRX-2 (Master)", provingCalibration: 0.12100, capacityKg: 300 }
];

export const DEFAULT_UCT_RING_CATALOGUE: UctRingItem[] = [
  { ringNo: "GT-102 (100.CKAF09.25)", provingCalibration: 0.5778, capacityKg: 300, updatedAt: "2025-03-15T00:00:00.000Z" },
  { ringNo: "UCT-2 (Master)", provingCalibration: 0.5800, capacityKg: 300 }
];

export const DEFAULT_PYCNOMETER_CATALOGUE: PycnometerItem[] = [
  { "pycNo": "1", "weightWater25": 152.1022, "weightTare": 52.9908 },
  { "pycNo": "2", "weightWater25": 152.857, "weightTare": 53.7774 },
  { "pycNo": "3", "weightWater25": 153.2238, "weightTare": 53.9802 },
  { "pycNo": "4", "weightWater25": 151.1122, "weightTare": 51.4122 },
  { "pycNo": "5", "weightWater25": 154.83, "weightTare": 55.0112 },
  { "pycNo": "6", "weightWater25": 159.4988, "weightTare": 63.0732 },
  { "pycNo": "7", "weightWater25": 153.368, "weightTare": 53.5314 },
  { "pycNo": "8", "weightWater25": 154.6622, "weightTare": 59.7316 },
  { "pycNo": "9", "weightWater25": 164.126, "weightTare": 59.7628 },
  { "pycNo": "10", "weightWater25": 155.2866, "weightTare": 59.0038 },
  { "pycNo": "11", "weightWater25": 156.669, "weightTare": 58.2254 },
  { "pycNo": "12", "weightWater25": 158.2136, "weightTare": 62.6674 },
  { "pycNo": "13", "weightWater25": 156.4662, "weightTare": 59.2952 },
  { "pycNo": "14", "weightWater25": 158.0556, "weightTare": 61.0316 },
  { "pycNo": "15", "weightWater25": 155.1908, "weightTare": 60.3026 },
  { "pycNo": "16", "weightWater25": 159.4982, "weightTare": 86.9434 },
  { "pycNo": "17", "weightWater25": 155.9656, "weightTare": 59.3672 },
  { "pycNo": "18", "weightWater25": 157.4324, "weightTare": 59.6842 },
  { "pycNo": "19", "weightWater25": 156.4718, "weightTare": 59.9944 },
  { "pycNo": "20", "weightWater25": 127.3896, "weightTare": 40.2316 }
];

export const DEFAULT_PERSONNEL_CATALOGUE: PersonnelItem[] = [
  { id: 'user-super-admin', name: 'Super Admin', role: 'Approver', title: 'Super Administrator' },
  { id: 'user-yustiaji', name: 'Yustiaji, S.T., M.T.', role: 'Approver', title: 'Direktur Operasional' },
  { id: 'user-alan', name: 'Ir. Alan Suherman, M.T.', role: 'Approver', title: 'Kepala Laboratorium' },
  { id: 'user-noval', name: 'Rakean Dhafin Nouval, S.T.', role: 'Analyst', title: 'Kepala Teknis / Koordinator' },
  { id: 'user-syabaab', name: 'Syabaab, S.E.', role: 'Computed', title: 'Admin Finance & Marketing' },
  { id: 'user-rafi', name: 'Rafi, A.Md.', role: 'Penguji', title: 'Penguji / Analis Lab (AO#1)' },
  { id: 'user-rizki', name: 'Rizki, A.Md.', role: 'Penguji', title: 'Penguji / Analis Lab (AO#2)' },
  { id: 'user-rasya', name: 'Rasya, A.Md.', role: 'Penguji', title: 'Penguji / Analis Lab (AO#3)' },
];
