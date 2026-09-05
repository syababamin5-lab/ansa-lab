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

export const INITIAL_GUEST_ENTRIES: GuestEntry[] = [
  {
    id: 'gst-20260902-001',
    fullName: 'Budi Santoso, S.T.',
    institution: 'PT. Wijaya Karya (Persero) Tbk',
    phone: '0812-3456-7890',
    email: 'budi.santoso@wika.co.id',
    guestCount: 2,
    purpose: 'Pengiriman / Serah Terima Sampel Uji',
    hostName: 'Rafi, A.Md. (Analis Utama / Penguji Lab)',
    signatureUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="80"><path d="M 10 40 Q 50 10 90 40 T 170 40" stroke="black" stroke-width="2" fill="none"/></svg>',
    timestamp: '2026-09-02T08:15:00.000Z',
    checkInTime: '02 Sep 2026, 08:15 WIB',
    status: 'Checked In',
    notes: 'Mengirim 4 sampel UDS tanah proyek Tol Cisumdawu'
  },
  {
    id: 'gst-20260901-002',
    fullName: 'Ir. Hendra Gunawan',
    institution: 'PT. Transka Dharma Konsultan',
    phone: '0813-9876-5432',
    email: 'hendra@transka.co.id',
    guestCount: 1,
    purpose: 'Konsultasi & Diskusi Hasil Test Geoteknik',
    hostName: 'Yustiaji, S.T., M.T. (Kepala / Manager Laboratorium)',
    signatureUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="80"><path d="M 20 50 Q 70 20 120 50 T 180 30" stroke="black" stroke-width="2" fill="none"/></svg>',
    timestamp: '2026-09-01T14:30:00.000Z',
    checkInTime: '01 Sep 2026, 14:30 WIB',
    status: 'Checked Out',
    checkOutTime: '01 Sep 2026, 16:00 WIB',
    notes: 'Diskusi hasil uji Triaxial CU Bor1-UDS-1'
  }
];
