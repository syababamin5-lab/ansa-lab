// Workflow Data Types for ISO 17025 Geotechnical Laboratory Management

export type QuotationStatus = 'Draft' | 'Sent' | 'Approved' | 'Rejected' | 'Expired';
export type SamplePrepStatus = 'PASS_FULL' | 'PASS_PARTIAL' | 'FAIL_SUBCONTRACT' | 'REJECTED';
export type SampleConditionStatus = 'NORMAL' | 'ROCK' | 'INSUFFICIENT' | 'SUBCONTRACT' | 'UNTESTED';
export type SubcontractNoticeStatus = 'Pending_Client' | 'Approved_Client' | 'Rejected_Client';
export type InvoiceStatus = 'Unpaid' | 'Partially_Paid' | 'Paid' | 'Cancelled';
export type PriceTierKey = 'priceGeoland' | 'priceBRS' | 'priceUmum';

// ─── MASTER DATA CLIENT ────────────────────────────────────────────────────────
export interface Client {
  id: string;
  clientCode: string;          // Kode singkat perusahaan, mis: GQT, MGU, SML
  companyName: string;         // Nama Perusahaan / Instansi
  address: string;             // Alamat Lengkap
  contactPerson: string;       // Nama PIC / Kontak
  phone: string;               // No. Telp / HP
  email?: string;              // Email (opsional)
  taxId?: string;              // NPWP (opsional)
  defaultPriceTier: PriceTierKey; // Kategori tarif default untuk klien ini
  notes?: string;
  createdAt: string;
}

// ─── MASTER DATA LAB REKANAN ───────────────────────────────────────────────────
export interface LabRekanan {
  id: string;
  labCode: string;             // Kode singkat lab rekanan, mis: PUS, BRT, ITB
  labName: string;             // Nama Laboratorium Rekanan
  address: string;             // Alamat Lab
  contactPerson: string;       // Nama PIC / Penanggung Jawab
  phone: string;               // No. Telp / HP
  email?: string;
  specialty: string;           // Spesialisasi (mis. "Mekanika Batuan, Triaxial CD")
  notes?: string;
  createdAt: string;
}


export interface QuotationItem {
  id: string;
  testCode: string;
  testName: string;
  standardStr?: string;
  unit: string;
  quantity: number;
  freq: number;
  unitPrice: number;
  subtotal: number;
  notes?: string;
}

export interface Quotation {
  id: string;
  quotationNo: string;
  date: string;
  validUntil: string;
  clientName: string;
  clientAddress: string;
  clientContactPerson?: string;
  clientPhone?: string;
  clientEmail?: string;
  poNumber?: string;
  projectName: string;
  projectLocation: string;
  items: QuotationItem[];
  subtotal: number;
  discountPct: number;
  discountAmount: number;
  vatPct: number;
  vatAmount: number;
  grandTotal: number;
  status: QuotationStatus;
  notes?: string;
  createdByName: string;
  createdAt: string;
}

export interface SampleReceiptItem {
  id: string;
  sampleCode: string;
  depthRange: string;
  depthFrom?: string;
  depthTo?: string;
  condition: string;
  packingType: string;
  remark: string;
}

export interface SampleReceiptPhoto {
  id: string;
  title: string;
  dataUrl: string;
}

export interface SampleReceipt {
  id: string;
  docCode: string;
  receiptNo: string;
  dayName: string;
  date: string;
  timeStr: string;
  clientName: string;
  projectCode: string;
  projectName: string;
  labReceiverName: string;
  items: SampleReceiptItem[];
  photos: SampleReceiptPhoto[];
  notes?: string;
  status: 'Received' | 'In_Inspection';
}

export interface SamplePrepPairPhoto {
  id: string;
  sampleCode: string;
  depthStr: string;
  tubePhotoUrl: string;
  corePhotoUrl: string;
  isRockSample?: boolean;
}

export interface SamplePrepTestEligible {
  UW?: boolean;           // Unit Weight / Berat Isi (SNI 03-3637-1994)
  MC?: boolean;           // Moisture Content / Kadar Air (SNI 1965:2008)
  SG?: boolean;           // Specific Gravity / Berat Jenis (SNI 1964:2008)
  BD?: boolean;           // Bulk Density / Kepadatan
  ATB?: boolean;          // Atterberg Limits (SNI 1966:2008 & 1967:2008)
  SieveHydro?: boolean;   // Sieve Analysis & Hydrometer (SNI 3423:2008)
  Proctor_Std?: boolean;  // Compaction Standard Proctor (SNI 1742:2008)
  Proctor_Mod?: boolean;  // Compaction Modified Proctor (SNI 1743:2008)
  Permeability?: boolean; // Permeability / Falling Head (SNI 03-6870-2002)
  Consolidation?: boolean;// Consolidation Test / CNS (SNI 2812:2011)
  UCT?: boolean;          // Unconfined Compression Test / UCS (SNI 3638:2012)
  DS_UU?: boolean;        // Direct Shear UU (SNI 3420:2016)
  DS_CU?: boolean;        // Direct Shear CU (SNI 2813:2008)
  DS_CD?: boolean;        // Direct Shear CD (SNI 2813:2008)
  DS_Res?: boolean;       // Direct Shear Residual (SNI 2813:2008)
  TRX_UU?: boolean;       // Triaxial UU (SNI 4813:2015)
  TRX_CU?: boolean;       // Triaxial CU (SNI 2455:2015)
  TRX_CD?: boolean;       // Triaxial CD (SNI 2455:2015)
  CBR_Unsoaked?: boolean; // CBR Unsoaked (SNI 1744:2012)
  CBR_Soaked?: boolean;   // CBR Soaked (SNI 1744:2012)
  PointLoad?: boolean;    // Point Load Index (Batuan)
  UCS_Rock?: boolean;     // UCS Batuan
}

export type TestCellStatus = 'PASS' | 'NP' | 'INSUFFICIENT' | 'SUBCONTRACT' | 'CANCEL';

export interface TestCellDetail {
  status: TestCellStatus;
  remark?: string;
}

export interface SamplePrepItem {
  id: string;
  sampleCode: string;
  depthStr: string;        // e.g. "0,00-0,50"
  thicknessM: number;      // e.g. 0.50
  recoveryM: number | string;  // e.g. 0.27 or ''
  recoveryPct: number;     // e.g. 54%
  testEligible: SamplePrepTestEligible;
  testStatusDetails?: Record<string, TestCellDetail>; // Status spesifik per jenis uji (PASS, NP, SUBCONTRACT, INSUFFICIENT)
  status: SamplePrepStatus;
  // ─── Status kondisi sampel saat preparasi ────────────────────────────
  sampleCondition: SampleConditionStatus;  // NORMAL | ROCK | INSUFFICIENT | SUBCONTRACT
  // ─── Foto per sampel: sebelum & setelah dibuka dari tabung ──────────
  photoBeforeUrl?: string;   // Foto tabung sebelum dibuka
  photoAfterUrl?: string;    // Foto isi tabung setelah dibuka
  // ───────────────────────────────────────────────────────────────────
  description?: string;     // e.g. "sampel tidak di uji" or "-"
  isRockHighlight?: boolean;
  rejectionReason?: string;
}

export interface SamplePrepReport {
  id: string;
  prepReportNo: string;    // e.g. "23-BA / 019 / VII / 2026"
  receiptNo?: string;
  dayName: string;         // e.g. "Senin"
  date: string;            // e.g. "13 July 2026"
  poNumber: string;        // e.g. "PO-GQT-019"
  numSampleReceived: number;  // e.g. 17
  numSamplePrep: number;      // e.g. 17
  projectName: string;     // e.g. "Morowali Utara"
  projectLocation?: string;
  clientName: string;      // e.g. "PT. Geoland Quattro Technolab"
  inspectorName: string;   // e.g. "AS Sumartadji"
  items: SamplePrepItem[];
  photos: SamplePrepPairPhoto[];
  notes?: string;
  status: 'Completed' | 'Requires_Subcontract_Action';
  // ─── Auto-sync ke PO ─────────────────────────────────────────────────────────
  syncedToPoId?: string;   // ID PO yang sudah di-generate dari BA Preparasi ini
  syncedAt?: string;       // Timestamp saat sync ke PO
}

export interface SubcontractItem {
  sampleCode: string;
  boreholeNo: string;
  depthStr: string;
  testCode: string;
  testName: string;
  reason: string;
}

export interface SubcontractNotice {
  id: string;
  noticeNo: string;
  prepReportNo: string;
  date: string;
  clientName: string;
  clientContactPerson?: string;
  projectName: string;
  subcontractItems: SubcontractItem[];
  partnerLabName: string;
  status: SubcontractNoticeStatus;
  clientApprovalDate?: string;
  clientApprovalNotes?: string;
}

export interface SubcontractShippingLetter {
  id: string;
  letterNo: string;
  noticeNo: string;
  date: string;
  partnerLabName: string;
  partnerLabAddress: string;
  partnerLabPhone?: string;
  courierName: string;
  subcontractItems: SubcontractItem[];
  instructions: string;
}

export interface BlankWorksheetConfig {
  sampleCode: string;
  boreholeNo: string;
  depthStr: string;
  projectName: string;
  clientName: string;
  testCodes: string[];
  datePrinted: string;
}

export interface InvoiceItem {
  id: string;
  description: string;
  unit: string;
  quantity: number;
  freq: number;
  unitPrice: number;
  subtotal: number;
}

export interface Invoice {
  id: string;
  invoiceNo: string;
  date: string;
  terms: string;
  dueDate: string;
  poNumber?: string;
  reportNo?: string;
  clientName: string;
  clientAddress: string;
  clientTaxId?: string;
  projectName: string;
  items: InvoiceItem[];
  subtotal: number;
  discountPct: number;
  discountAmount: number;
  subtotalAfterDiscount: number;
  pph23Pct: number;
  pph23Amount: number;
  grandTotal: number;
  bankAccountName: string;
  bankName: string;
  bankAccountNumber: string;
  waConfirmationNo: string;
  taxNote: string;
  status: InvoiceStatus;
  notes?: string;
}
