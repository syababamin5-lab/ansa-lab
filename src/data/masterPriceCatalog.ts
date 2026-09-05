// Master Price Catalog Database for Geotechnical Laboratory Testing
// Includes 3 Pricing Categories: "Harga Geoland", "Harga BRS", and "Harga Umum"

export interface MasterPriceItem {
  id: string;
  code: string;
  name: string;
  standard: string;
  unit: string;
  priceGeoland: number;
  priceBRS: number;
  priceUmum: number;
  category?: 'physical' | 'mechanical';
}

export const INITIAL_MASTER_PRICE_CATALOG: MasterPriceItem[] = [
  // ── SIFAT FISIK TANAH (PHYSICAL PROPERTIES) ──────────────────────────────────
  { id: 'mp-1', code: 'PREP', name: 'Preparasi', standard: '-', unit: 'Sample', priceGeoland: 50000, priceBRS: 65000, priceUmum: 65000, category: 'physical' },
  { id: 'mp-2', code: 'SVE-HYD', name: 'Sieve Analysis & Hydrometer', standard: 'SNI 3423 : 2008', unit: 'Sample', priceGeoland: 135000, priceBRS: 135000, priceUmum: 135000, category: 'physical' },
  { id: 'mp-3', code: 'SG', name: 'Specific Gravity', standard: 'SNI 1964 : 2008', unit: 'Sample', priceGeoland: 75000, priceBRS: 75000, priceUmum: 75000, category: 'physical' },
  { id: 'mp-4', code: 'UW', name: 'Unit Weight', standard: 'SNI 03-3637 : 1994 / SNI 03-4804 : 1998', unit: 'Sample', priceGeoland: 60000, priceBRS: 60000, priceUmum: 60000, category: 'physical' },
  { id: 'mp-5', code: 'ATB', name: 'Atterberg Limit', standard: 'SNI 1966 : 2008 / SNI 1967 : 2008', unit: 'Sample', priceGeoland: 90000, priceBRS: 90000, priceUmum: 90000, category: 'physical' },
  { id: 'mp-6', code: 'MC', name: 'Moisture Content', standard: 'SNI 1965 : 2008', unit: 'Sample', priceGeoland: 50000, priceBRS: 50000, priceUmum: 50000, category: 'physical' },
  { id: 'mp-7', code: 'BD-DD', name: 'Bulk Density & Dry Density', standard: 'SNI 03-3637 : 1994', unit: 'Sample', priceGeoland: 60000, priceBRS: 60000, priceUmum: 80000, category: 'physical' },
  { id: 'mp-18', code: 'CMP-STD', name: 'Compaction Standard (Standard Proctor)', standard: 'SNI 1742 : 2008', unit: 'Sample', priceGeoland: 250000, priceBRS: 250000, priceUmum: 350000, category: 'physical' },
  { id: 'mp-19', code: 'CMP-MOD', name: 'Compaction Modified (Modified Proctor)', standard: 'SNI 1743 : 2008', unit: 'Sample', priceGeoland: 350000, priceBRS: 350000, priceUmum: 450000, category: 'physical' },
  { id: 'mp-23', code: 'SND-CONE', name: 'Sand Cone', standard: '-', unit: 'Sample', priceGeoland: 250000, priceBRS: 250000, priceUmum: 250000, category: 'physical' },
  { id: 'mp-24', code: 'PB', name: 'Permeability Falling Head (PB)', standard: 'SNI 03-6870-2002', unit: 'Sample', priceGeoland: 100000, priceBRS: 125000, priceUmum: 150000, category: 'physical' },
  { id: 'mp-26', code: 'SWELLING', name: 'Swelling Test', standard: 'SNI 2812 : 2011', unit: 'Sample', priceGeoland: 250000, priceBRS: 250000, priceUmum: 250000, category: 'physical' },
  { id: 'mp-27', code: 'SHRINKAGE', name: 'Shrinkage Limit', standard: '-', unit: 'Sample', priceGeoland: 125000, priceBRS: 125000, priceUmum: 125000, category: 'physical' },
  { id: 'mp-28', code: 'PH', name: 'pH Test', standard: '-', unit: 'Sample', priceGeoland: 200000, priceBRS: 200000, priceUmum: 200000, category: 'physical' },
  { id: 'mp-29', code: 'CHLORID', name: 'Chlorid Test', standard: '-', unit: 'Sample', priceGeoland: 350000, priceBRS: 350000, priceUmum: 350000, category: 'physical' },
  { id: 'mp-30', code: 'SULFAT', name: 'Sulfat Test', standard: '-', unit: 'Sample', priceGeoland: 250000, priceBRS: 250000, priceUmum: 250000, category: 'physical' },
  { id: 'mp-31', code: 'CARBONAT', name: 'Carbonat Test', standard: '-', unit: 'Sample', priceGeoland: 350000, priceBRS: 350000, priceUmum: 350000, category: 'physical' },
  { id: 'mp-32', code: 'RESISTIVITY', name: 'Resistivity Test', standard: '-', unit: 'Sample', priceGeoland: 370000, priceBRS: 370000, priceUmum: 370000, category: 'physical' },

  // ── SIFAT MEKANIS TANAH (MECHANICAL PROPERTIES) ──────────────────────────────
  { id: 'mp-8', code: 'TRX-UU', name: 'Triaxial UU', standard: 'SNI 4813 : 2015', unit: 'Sample', priceGeoland: 300000, priceBRS: 300000, priceUmum: 300000, category: 'mechanical' },
  { id: 'mp-9', code: 'TRX-CU', name: 'Triaxial CU', standard: 'SNI 2455 : 2015', unit: 'Sample', priceGeoland: 500000, priceBRS: 600000, priceUmum: 600000, category: 'mechanical' },
  { id: 'mp-10', code: 'TRX-CD', name: 'Triaxial CD', standard: 'SNI 2455 : 2015', unit: 'Sample', priceGeoland: 1000000, priceBRS: 1000000, priceUmum: 850000, category: 'mechanical' },
  { id: 'mp-11', code: 'UCT', name: 'Unconfined Compression Test (UCT / UCS)', standard: 'SNI 3638 : 2012', unit: 'Sample', priceGeoland: 150000, priceBRS: 150000, priceUmum: 150000, category: 'mechanical' },
  { id: 'mp-12', code: 'DS-UU', name: 'Direct Shear UU', standard: 'SNI 3420 : 2016', unit: 'Sample', priceGeoland: 250000, priceBRS: 250000, priceUmum: 250000, category: 'mechanical' },
  { id: 'mp-13', code: 'DS-CU', name: 'Direct Shear CU', standard: 'SNI 2813 : 2008', unit: 'Sample', priceGeoland: 500000, priceBRS: 500000, priceUmum: 450000, category: 'mechanical' },
  { id: 'mp-14', code: 'DS-CD', name: 'Direct Shear CD', standard: 'SNI 2813 : 2008', unit: 'Sample', priceGeoland: 1000000, priceBRS: 1000000, priceUmum: 550000, category: 'mechanical' },
  { id: 'mp-15', code: 'DS-CD-RES', name: 'Direct Shear CD + Residual', standard: 'SNI 2813 : 2008', unit: 'Sample', priceGeoland: 1250000, priceBRS: 1250000, priceUmum: 1250000, category: 'mechanical' },
  { id: 'mp-16', code: 'DS-RES', name: 'Direct Shear Residual', standard: 'SNI 2813 : 2008', unit: 'Sample', priceGeoland: 600000, priceBRS: 600000, priceUmum: 350000, category: 'mechanical' },
  { id: 'mp-17', code: 'CT', name: 'Consolidation', standard: 'SNI 2812 : 2011', unit: 'Sample', priceGeoland: 250000, priceBRS: 250000, priceUmum: 250000, category: 'mechanical' },
  { id: 'mp-20', code: 'CBR-FIELD', name: 'CBR Lapangan', standard: 'SNI 1744 : 2012', unit: 'Project', priceGeoland: 0, priceBRS: 0, priceUmum: 0, category: 'mechanical' },
  { id: 'mp-21', code: 'CBR-SOK', name: 'CBR Lab — Soaked', standard: 'SNI 1744 : 2012', unit: 'Sample', priceGeoland: 300000, priceBRS: 350000, priceUmum: 600000, category: 'mechanical' },
  { id: 'mp-22', code: 'CBR-UNS', name: 'CBR Lab — Unsoaked', standard: 'SNI 1744 : 2012', unit: 'Sample', priceGeoland: 250000, priceBRS: 250000, priceUmum: 550000, category: 'mechanical' },
  { id: 'mp-25', code: 'SNDR', name: 'Sondir', standard: '-', unit: 'Project', priceGeoland: 0, priceBRS: 0, priceUmum: 0, category: 'mechanical' },
  { id: 'mp-33', code: 'HV-SHEAR', name: 'Hand Vane Shear', standard: '-', unit: 'Sample', priceGeoland: 200000, priceBRS: 200000, priceUmum: 200000, category: 'mechanical' },
  { id: 'mp-34', code: 'VS-STRESS', name: 'Vane Shear Stress', standard: '-', unit: 'Sample', priceGeoland: 250000, priceBRS: 250000, priceUmum: 250000, category: 'mechanical' }
];

export const MASTER_PRICE_CATALOG = INITIAL_MASTER_PRICE_CATALOG;

export type PriceCategoryKey = 'priceGeoland' | 'priceBRS' | 'priceUmum';

const PHYSICAL_PRICE_CODES = ['PREP','SVE-HYD','SG','UW','ATB','MC','BD-DD','CMP-STD','CMP-MOD','SND-CONE','PERM','SWELLING','SHRINKAGE','PH','CHLORID','SULFAT','CARBONAT','RESISTIVITY'];

let inMemoryMasterPrices: MasterPriceItem[] = INITIAL_MASTER_PRICE_CATALOG.map((item: MasterPriceItem) => ({
  ...item,
  category: item.category || (PHYSICAL_PRICE_CODES.includes((item.code || '').toUpperCase()) ? 'physical' : 'mechanical')
}));

export function getStoredMasterPrices(): MasterPriceItem[] {
  return inMemoryMasterPrices;
}

export function saveStoredMasterPrices(items: MasterPriceItem[]): void {
  inMemoryMasterPrices = items;
}

