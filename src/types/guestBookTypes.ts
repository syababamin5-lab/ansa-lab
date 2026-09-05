// =====================================================================
// TIMES® ANSA LIMS — Guest Book (Buku Tamu Digital) Types
// =====================================================================

export type GuestStatus = 'Checked In' | 'Checked Out';

export interface GuestEntry {
  id: string;
  fullName: string;
  institution: string;
  phone: string;
  email?: string;
  guestCount: number; // Jumlah orang / rombongan
  purpose: string;
  hostName: string;
  signatureUrl: string; // Base64 data URL
  timestamp: string; // ISO 8601
  checkInTime: string; // Formatted date string
  status: GuestStatus;
  checkOutTime?: string;
  notes?: string;
}

export const GUEST_PURPOSE_OPTIONS = [
  'Pengiriman / Serah Terima Sampel Uji',
  'Pengambilan Laporan Hasil Uji (LHU)',
  'Konsultasi & Diskusi Hasil Test Geoteknik',
  'Meeting / Rapat Manajemen',
  'Audit Internal / KAN / ISO 17025',
  'Inspeksi & Kunjungan Lapangan / Lab',
  'Lainnya'
] as const;

export const DEFAULT_LAB_HOSTS = [
  'Rafi, A.Md. (Analis Utama / Penguji Lab)',
  'Muhammad Nouval, S.T. (Pemeriksa / QC Coordinator)',
  'Yustiaji, S.T., M.T. (Kepala / Manager Laboratorium)',
  'Tim Admin & Recepsionis Lab',
  'Lainnya / Tidak Tahu'
] as const;

/**
 * Dynamically fetches active personnel from localStorage (ansa_lab_personnels or ansa_lab_users)
 * so that any changes in the web app (Master Personil / User Management) are automatically reflected in real time!
 */
export function getDynamicLabHosts(): string[] {
  const result: string[] = [...DEFAULT_LAB_HOSTS.slice(0, 3)];

  if (!result.some(r => r.includes('Tim Admin'))) {
    result.push('Tim Admin & Recepsionis Lab');
  }
  if (!result.some(r => r.includes('Lainnya'))) {
    result.push('Lainnya / Tidak Tahu');
  }

  return result;
}

export const INITIAL_GUEST_ENTRIES: GuestEntry[] = [];

