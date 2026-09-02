// =====================================================================
// TIMES® ANSA LIMS — User Roles, Profiles & Organizational Hierarchy
// =====================================================================

/** 6 Tingkatan Peran (Role) Pengguna Lab berdasarkan Struktur Organisasi */
export type UserRole =
  | 'SUPER_ADMIN'
  | 'EXECUTIVE_DIRECTOR'
  | 'LAB_MANAGER'
  | 'QA_QC_COORDINATOR'
  | 'ANALYST'
  | 'ADMIN_FINANCE';

/** Label tampilan per role */
export const USER_ROLE_LABELS: Record<UserRole, string> = {
  SUPER_ADMIN:         'Super Admin',
  EXECUTIVE_DIRECTOR:  'Direktur Operasional',
  LAB_MANAGER:         'Kepala Lab',
  QA_QC_COORDINATOR:   'Kepala Teknis / Koordinator',
  ANALYST:             'Analis / Teknisi Lab',
  ADMIN_FINANCE:       'Admin Finance & Marketing',
};

/** Warna badge per role (Tailwind classes) */
export const USER_ROLE_BADGE: Record<UserRole, { bg: string; text: string; border: string }> = {
  SUPER_ADMIN:         { bg: 'bg-purple-600',  text: 'text-white', border: 'border-purple-700' },
  EXECUTIVE_DIRECTOR:  { bg: 'bg-indigo-600',  text: 'text-white', border: 'border-indigo-700' },
  LAB_MANAGER:         { bg: 'bg-teal-700',    text: 'text-white', border: 'border-teal-800' },
  QA_QC_COORDINATOR:   { bg: 'bg-emerald-600', text: 'text-white', border: 'border-emerald-700' },
  ANALYST:             { bg: 'bg-blue-600',    text: 'text-white', border: 'border-blue-700' },
  ADMIN_FINANCE:       { bg: 'bg-amber-600',   text: 'text-white', border: 'border-amber-700' },
};

/** Profil pengguna laboratorium */
export interface UserProfile {
  id: string;
  name: string;
  shortName: string;
  nip: string;
  email: string;
  role: UserRole;
  password?: string;         // Password login (default: '1234')
  analyistCode?: string;     // Kode AO (misal: AO#1) untuk Teknisi
  specialization?: string;   // Spesialisasi pengujian
  avatarInitials: string;    // Inisial untuk Avatar
  digitalSignatureLabel?: string; // Label untuk tanda tangan di LHU
  digitalSignatureUrl?: string;   // Data URL tanda tangan digital (Base64)
  signatureUrl?: string;          // Alias untuk kompatibilitas
  isActive: boolean;
}

// =====================================================================
// DAFTAR PENGGUNA RESMI ANSA LIMS — MEMUTUSKAN HANYA SUPER ADMIN
// =====================================================================
export const INITIAL_USERS: UserProfile[] = [
  // ─── 1. SUPER ADMIN (SATU-SATUNYA AKUN AKTIF) ──────────────────────
  {
    id: 'user-super-admin',
    name: 'Super Admin',
    shortName: 'Super Admin',
    nip: 'SA-0001',
    email: 'admin@ansalab.com',
    role: 'SUPER_ADMIN',
    password: '1234',
    avatarInitials: 'SA',
    digitalSignatureLabel: 'Super Administrator',
    isActive: true,
  }
];
