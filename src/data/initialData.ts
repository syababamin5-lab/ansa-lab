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

// Pristine Empty Initial Data Lists for Production Clean State
export const INITIAL_CLIENTS: Client[] = [];
export const INITIAL_POS: PurchaseOrder[] = [];
export const INITIAL_DOCUMENTS: DocumentItem[] = [];

// MASTER EQUIPMENT & CALIBRATION CATALOGUES (HARAM DIHAPUS / UTUH)
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
  { id: 'user-super-admin', name: 'Super Admin', role: 'Approver', title: 'Super Administrator' }
];
