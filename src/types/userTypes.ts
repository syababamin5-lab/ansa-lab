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
// DAFTAR PENGGUNA RESMI ANSA LIMS — PT. TERRAFORMA GEOTEKNIK INDONESIA
// =====================================================================
export const INITIAL_USERS: UserProfile[] = [
  // ─── 1. SUPER ADMIN ────────────────────────────────────────────────
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
  },

  // ─── 2. DIREKTUR OPERASIONAL ────────────────────────────────────────
  {
    id: 'user-yustiaji',
    name: 'Yustiaji, S.T., M.T.',
    shortName: 'Pak Yustiaji',
    nip: 'DIR-0001',
    email: 'yustiaji@ansalab.com',
    role: 'EXECUTIVE_DIRECTOR',
    password: '1234',
    specialization: 'Geotechnical Engineering & Business Operations',
    avatarInitials: 'YJ',
    digitalSignatureLabel: 'Direktur Operasional',
    isActive: true,
  },

  // ─── 3. KEPALA LAB ──────────────────────────────────────────────────
  {
    id: 'user-alan',
    name: 'Ir. Alan Suherman, M.T.',
    shortName: 'Pak Alan',
    nip: 'MNG-0001',
    email: 'alan@ansalab.com',
    role: 'LAB_MANAGER',
    password: '1234',
    specialization: 'Soil Mechanics & Laboratory Management',
    avatarInitials: 'AL',
    digitalSignatureLabel: 'Kepala Laboratorium',
    isActive: true,
  },

  // ─── 4. KEPALA TEKNIS / KOORDINATOR TEKNISI ─────────────────────────
  {
    id: 'user-noval',
    name: 'Rakean Dhafin Nouval, S.T.',
    shortName: 'Noval',
    nip: 'KOR-0001',
    email: 'noval@ansalab.com',
    role: 'QA_QC_COORDINATOR',
    password: '1234',
    specialization: 'Geotechnical Testing — Triaxial, Consolidation, Direct Shear',
    avatarInitials: 'NV',
    digitalSignatureLabel: 'Kepala Teknis / Koordinator',
    isActive: true,
  },

  // ─── 5. ADMIN FINANCE & MARKETING ───────────────────────────────────
  {
    id: 'user-syabaab',
    name: 'Syabaab, S.E.',
    shortName: 'Syabaab',
    nip: 'ADM-0001',
    email: 'syabaab@ansalab.com',
    role: 'ADMIN_FINANCE',
    password: '1234',
    specialization: 'Finance, Marketing & Documentation',
    avatarInitials: 'SY',
    digitalSignatureLabel: 'Admin Finance & Marketing',
    isActive: true,
  },

  // ─── 6. TEKNISI / PENGUJI — AO#1 ────────────────────────────────────
  {
    id: 'user-rafi',
    name: 'Rafi, A.Md.',
    shortName: 'Rafi',
    nip: 'AO-0001',
    email: 'rafi@ansalab.com',
    role: 'ANALYST',
    password: '1234',
    analyistCode: 'AO#1',
    specialization: 'Sifat Fisik Tanah (SG, MC, Unit Weight, Atterberg, Gradasi)',
    avatarInitials: 'RF',
    digitalSignatureLabel: 'Penguji / Analis Lab (AO#1)',
    isActive: true,
  },

  // ─── 7. TEKNISI / PENGUJI — AO#2 ────────────────────────────────────
  {
    id: 'user-rizki',
    name: 'Rizki, A.Md.',
    shortName: 'Rizki',
    nip: 'AO-0002',
    email: 'rizki@ansalab.com',
    role: 'ANALYST',
    password: '1234',
    analyistCode: 'AO#2',
    specialization: 'Uji Mekanik — Triaxial CU/CD, Direct Shear, UCT',
    avatarInitials: 'RZ',
    digitalSignatureLabel: 'Penguji / Analis Lab (AO#2)',
    isActive: true,
  },

  // ─── 8. TEKNISI / PENGUJI — AO#3 ────────────────────────────────────
  {
    id: 'user-rasya',
    name: 'Rasya, A.Md.',
    shortName: 'Rasya',
    nip: 'AO-0003',
    email: 'rasya@ansalab.com',
    role: 'ANALYST',
    password: '1234',
    analyistCode: 'AO#3',
    specialization: 'Pemadatan (Compaction), CBR, Konsolidasi, Preparasi Sampel',
    avatarInitials: 'RS',
    digitalSignatureLabel: 'Penguji / Analis Lab (AO#3)',
    isActive: true,
  },
];
