import { PurchaseOrder, TestType, DocumentItem, SOIL_COLOUR_CATALOGUE, ContainerItem, RingItem, ConsolRingItem, DsRingItem, TrxRingItem, UctRingItem, PycnometerItem, PersonnelItem, MoldItem, ReamerItem } from '../types';

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

export const INITIAL_POS: PurchaseOrder[] = [
  {
    id: 'po-tdk-001',
    poNumber: 'PO-TDK-001',
    clientName: 'PT. Transka Dharma Konsultan',
    clientAddress: 'Jl. Ir. H. Juanda No. 128, Bandung',
    projectName: 'Penyelidikan Geoteknik & Mekanika Tanah Utama',
    projectLocation: 'Bandung, Jawa Barat',
    status: 'Running',
    startDate: '2026-08-01T08:00:00.000Z',
    deadline: hoursAhead(120),
    sampleArrivalDate: '2026-08-01T08:00:00.000Z',
    totalSamplesCount: 15,
    notes: 'Penyelidikan Geoteknik & Analisis Laboratorium Mekanika Tanah Utama PT. Transka Dharma Konsultan.',
    createdAt: hoursAgo(100),
    updatedAt: hoursAgo(1),
    samples: [
      {
        id: 'smp-tdk-01',
        poId: 'po-tdk-001',
        sampleCode: 'Bor1-UDS-1',
        reportNumber: 'REP-2026-TDK-001',
        idLab: 'LAB-DA-9650-001',
        depthStart: 5.0,
        depthEnd: 5.5,
        lithology: 'CH',
        soilType: 'Lempung Plastisitas Tinggi (Fat Clay)',
        sampleType: 'Undisturbed Sample / UDS',
        testedBy: 'Rafi, A.Md.',
        assignedTechnician: 'Rafi, A.Md.',
        locationTag: 'Rak Cold-Room Utama A-01',
        sampleDescription: 'Sampel lempung tak terganggu plastisitas tinggi warna cokelat gelap.',
        status: 'In Progress',
        createdAt: hoursAgo(100),
        tests: [
          {
            id: 't-tdk-atb-1',
            sampleId: 'smp-tdk-01',
            testTypeId: 'tt-atb',
            testTypeName: 'Atterberg Limits Test (LL, PL, PI)',
            testTypeCode: 'ATB',
            technicianName: 'Rafi, A.Md.',
            status: 'Sedang Diuji',
            startTime: hoursAgo(24),
            estimatedDurationHours: 24,
            calculationStatus: 'Draft Data'
          },
          {
            id: 't-tdk-sve-1',
            sampleId: 'smp-tdk-01',
            testTypeId: 'tt-sve',
            testTypeName: 'Sieve Analysis & Hydrometer Test',
            testTypeCode: 'SIEVE-HYDRO',
            technicianName: 'Rafi, A.Md.',
            status: 'Sedang Diuji',
            startTime: hoursAgo(18),
            estimatedDurationHours: 24,
            calculationStatus: 'Draft Data'
          },
          {
            id: 't-tdk-ds-uu-1',
            sampleId: 'smp-tdk-01',
            testTypeId: 'tt-ds-uu',
            testTypeName: 'Direct Shear UU',
            testTypeCode: 'DS-UU',
            technicianName: 'Rafi, A.Md.',
            status: 'Sedang Diuji',
            startTime: hoursAgo(12),
            estimatedDurationHours: 24,
            calculationStatus: 'Draft Data'
          },
          {
            id: 't-tdk-mc-1',
            sampleId: 'smp-tdk-01',
            testTypeId: 'tt-mc',
            testTypeName: 'Moisture Content (Kadar Air)',
            testTypeCode: 'MC',
            technicianName: 'Rafi, A.Md.',
            status: 'Selesai',
            startTime: hoursAgo(30),
            endTime: hoursAgo(6),
            estimatedDurationHours: 12,
            calculationStatus: 'Verified',
            calculationData: { summaryResults: { mc: 34.2 } }
          },
          {
            id: 't-tdk-uw-1',
            sampleId: 'smp-tdk-01',
            testTypeId: 'tt-uw',
            testTypeName: 'Unit Weight (Berat Volume)',
            testTypeCode: 'UW',
            technicianName: 'Rafi, A.Md.',
            status: 'Selesai',
            startTime: hoursAgo(30),
            endTime: hoursAgo(6),
            estimatedDurationHours: 12,
            calculationStatus: 'Verified',
            calculationData: { summaryResults: { density: 1.68 } }
          }
        ]
      },
      {
        id: 'smp-tdk-02',
        poId: 'po-tdk-001',
        sampleCode: 'Bor1-UDS-2',
        reportNumber: 'REP-2026-TDK-002',
        idLab: 'LAB-DA-9650-002',
        depthStart: 8.0,
        depthEnd: 8.5,
        lithology: 'CL',
        soilType: 'Lempung Pasiran (Lean Clay with Sand)',
        sampleType: 'Undisturbed Sample / UDS',
        testedBy: 'Rizki',
        assignedTechnician: 'Rizki',
        locationTag: 'Rak Cold-Room Utama A-02',
        sampleDescription: 'Sampel lempung pasiran warna abu-abu kebiruan konsistensi teguh.',
        status: 'In Progress',
        createdAt: hoursAgo(90),
        tests: [
          {
            id: 't-tdk-cns-1',
            sampleId: 'smp-tdk-02',
            testTypeId: 'tt-cns',
            testTypeName: 'Consolidation Oedometer Test',
            testTypeCode: 'CT',
            technicianName: 'Rizki',
            status: 'Sedang Diuji',
            startTime: hoursAgo(20),
            estimatedDurationHours: 72,
            calculationStatus: 'Draft Data'
          },
          {
            id: 't-tdk-uct-1',
            sampleId: 'smp-tdk-02',
            testTypeId: 'tt-uct',
            testTypeName: 'Unconfined Compression Test (UCT)',
            testTypeCode: 'UCT',
            technicianName: 'Rizki',
            status: 'Sedang Diuji',
            startTime: hoursAgo(10),
            estimatedDurationHours: 18,
            calculationStatus: 'Draft Data'
          }
        ]
      }
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
