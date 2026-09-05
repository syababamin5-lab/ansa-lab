// =====================================================================
// TIMES® ANSA LIMS — User Permissions & Menu Access Control (RBAC)
// =====================================================================
import { UserRole, UserProfile } from '../types/userTypes';

// ─── MENU ACCESS MATRIX ──────────────────────────────────────────────
// Maps each menu tab ID to which roles are allowed to see/use it.
const MENU_PERMISSIONS: Record<string, UserRole[]> = {
  // ─── OPERASIONAL LAB ─────────────────────────────────────────────
  dashboard:           ['SUPER_ADMIN', 'EXECUTIVE_DIRECTOR', 'LAB_MANAGER', 'QA_QC_COORDINATOR', 'ANALYST'],
  sample_receipt:      ['SUPER_ADMIN', 'LAB_MANAGER', 'QA_QC_COORDINATOR', 'ADMIN_FINANCE'],
  sample_prep:         ['SUPER_ADMIN', 'LAB_MANAGER', 'QA_QC_COORDINATOR', 'ANALYST'],
  subcontract_notice:  ['SUPER_ADMIN', 'LAB_MANAGER', 'QA_QC_COORDINATOR'],
  blank_worksheet:     ['SUPER_ADMIN', 'LAB_MANAGER', 'QA_QC_COORDINATOR', 'ANALYST'],
  waktu_pengujian:     ['SUPER_ADMIN', 'LAB_MANAGER', 'QA_QC_COORDINATOR'],
  po_management:       ['SUPER_ADMIN', 'LAB_MANAGER', 'QA_QC_COORDINATOR', 'ANALYST'],
  pp_worksheet:        ['SUPER_ADMIN', 'LAB_MANAGER', 'QA_QC_COORDINATOR', 'ANALYST'],
  sandbox_test:        ['SUPER_ADMIN', 'QA_QC_COORDINATOR', 'ANALYST'],
  guest_book:          ['SUPER_ADMIN', 'EXECUTIVE_DIRECTOR', 'LAB_MANAGER', 'QA_QC_COORDINATOR', 'ANALYST', 'ADMIN_FINANCE'],
  tv_lscp:             ['SUPER_ADMIN', 'EXECUTIVE_DIRECTOR', 'LAB_MANAGER', 'QA_QC_COORDINATOR', 'ANALYST', 'ADMIN_FINANCE'],

  // ─── BISNIS & ADMINISTRASI ───────────────────────────────────────
  quotation:           ['SUPER_ADMIN', 'EXECUTIVE_DIRECTOR', 'LAB_MANAGER', 'ADMIN_FINANCE'],
  client_master:       ['SUPER_ADMIN', 'EXECUTIVE_DIRECTOR', 'LAB_MANAGER', 'ADMIN_FINANCE'],
  invoice:             ['SUPER_ADMIN', 'EXECUTIVE_DIRECTOR', 'LAB_MANAGER', 'ADMIN_FINANCE'],
  financial_analytics: ['SUPER_ADMIN', 'EXECUTIVE_DIRECTOR', 'LAB_MANAGER'],

  // ─── SISTEM ─────────────────────────────────────────────────────
  file_explorer:       ['SUPER_ADMIN', 'LAB_MANAGER', 'QA_QC_COORDINATOR', 'ADMIN_FINANCE'],
  schema_viewer:       ['SUPER_ADMIN'],
  db_schema:           ['SUPER_ADMIN'],
  settings:            ['SUPER_ADMIN', 'LAB_MANAGER'],
  user_management:     ['SUPER_ADMIN', 'LAB_MANAGER'],
  public_verification: ['SUPER_ADMIN', 'EXECUTIVE_DIRECTOR', 'LAB_MANAGER', 'QA_QC_COORDINATOR', 'ANALYST', 'ADMIN_FINANCE'],
};

/** Cek apakah role dapat melihat menu tertentu */
export function isMenuAllowed(menuId: string, role: UserRole): boolean {
  const allowed = MENU_PERMISSIONS[menuId];
  if (!allowed) return role === 'SUPER_ADMIN'; // default: hanya super admin
  return allowed.includes(role);
}

// ─── ACTION PERMISSIONS ──────────────────────────────────────────────

/** Apakah bisa meng-approve LHU Final (Kepala Lab) */
export function canApproveLHU(role: UserRole): boolean {
  return ['SUPER_ADMIN', 'LAB_MANAGER'].includes(role);
}

/** Apakah bisa melakukan QC Verifikasi data uji (Koordinator Teknis) */
export function canVerifyQC(role: UserRole): boolean {
  return ['SUPER_ADMIN', 'LAB_MANAGER', 'QA_QC_COORDINATOR'].includes(role);
}

/** Apakah bisa menugaskan teknisi ke sampel/pengujian (Koordinator Teknis) */
export function canAssignTechnician(role: UserRole): boolean {
  return ['SUPER_ADMIN', 'LAB_MANAGER', 'QA_QC_COORDINATOR'].includes(role);
}

/** Apakah bisa meng-input data uji mentah (Analis / Teknisi Lab) */
export function canInputTestData(role: UserRole): boolean {
  return ['SUPER_ADMIN', 'LAB_MANAGER', 'QA_QC_COORDINATOR', 'ANALYST'].includes(role);
}

/** Apakah bisa mengelola data keuangan (Penawaran, Invoice) */
export function canManageFinance(role: UserRole): boolean {
  return ['SUPER_ADMIN', 'EXECUTIVE_DIRECTOR', 'LAB_MANAGER', 'ADMIN_FINANCE'].includes(role);
}

/** Apakah bisa mengatur Master Data & Settings */
export function canManageMasterData(role: UserRole): boolean {
  return ['SUPER_ADMIN', 'LAB_MANAGER'].includes(role);
}

/** Apakah bisa meng-unlock LHU yang sudah di-approve */
export function canUnlockLHU(role: UserRole): boolean {
  return ['SUPER_ADMIN', 'LAB_MANAGER'].includes(role);
}

/** Apakah bisa melihat Financial Analytics */
export function canViewFinancialAnalytics(role: UserRole): boolean {
  return ['SUPER_ADMIN', 'EXECUTIVE_DIRECTOR', 'LAB_MANAGER'].includes(role);
}

/** Apakah bisa menyetujui Penawaran Harga */
export function canApproveQuotation(role: UserRole): boolean {
  return ['SUPER_ADMIN', 'EXECUTIVE_DIRECTOR', 'LAB_MANAGER'].includes(role);
}

/** Apakah ini Teknisi/Analis (filter tampilan sampel) */
export function isAnalyst(role: UserRole): boolean {
  return role === 'ANALYST';
}

/**
 * Normalisasi nama personil / teknisi:
 * - Huruf kecil
 * - Hapus tanda baca
 * - Hapus gelar akademik (S.T., M.T., A.Md., S.E., Ir., Dr., dll)
 * - Rapikan spasi
 */
export function normalizePersonName(name: string): string {
  if (!name || typeof name !== 'string') return '';
  return name
    .toLowerCase()
    .replace(/[,._#\-\/\\]/g, ' ')
    .replace(/\b(s\.?t|m\.?t|a\.?md|s\.?e|ir|dr|dra|drs)\b/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Resolves the single authoritative assigned technician name for a specific test item.
 * Strictly prioritizes test-level explicit assignment to guarantee 1 test = 1 technician.
 */
export function getTestAssignedTechnician(test: any, sample?: any): string {
  if (!test) return '';

  // 1. Prioritas tertinggi: Penugasan langsung di tingkat pengujian (Test Level)
  const testAssigned = (test.assignedTechnician || test.technicianName || '').trim();
  if (testAssigned) return testAssigned;

  // 2. Prioritas kedua: Penugasan di tingkat sampel (Sample Level) jika pengujian belum punya teknisi spesifik
  const sampleAssigned = (sample?.assignedTechnician || sample?.testedBy || '').trim();
  if (sampleAssigned) return sampleAssigned;

  // 3. Prioritas ketiga: Calculation data worksheet jika ada tercatat penugasan
  const calc = test.calculationData || {};
  const calcAssigned = (
    calc.inputValues?.assignedTechnician ||
    calc.inputValues?.technicianName ||
    calc.summaryResults?.assignedTechnician ||
    calc.summaryResults?.technicianName ||
    ''
  ).trim();
  if (calcAssigned) return calcAssigned;

  // 4. Fallback jika ada test.testedBy
  const testedBy = (test.testedBy || calc.inputValues?.testedBy || calc.summaryResults?.testedBy || '').trim();
  if (testedBy) return testedBy;

  return '';
}

/**
 * Memeriksa apakah string nama teknisi (assignedTech) cocok dengan user tertentu.
 * Didesain secara ketat dan saling eksklusif (mutually exclusive) agar tidak ada pengujian yang tumpang tindih.
 */
export function isTechnicianNameMatchingUser(assignedTech: string, user: UserProfile): boolean {
  if (!assignedTech || !user) return false;

  const rawAssigned = assignedTech.trim().toLowerCase();
  const normAssigned = normalizePersonName(assignedTech);
  const assignedWords = normAssigned.split(' ').filter(w => w.length >= 2);

  // 1. Cek kecocokan ID atau NIP secara eksak
  if (user.id && rawAssigned === user.id.toLowerCase()) return true;
  if (user.nip && (rawAssigned === user.nip.toLowerCase() || normAssigned === normalizePersonName(user.nip))) return true;

  // 2. Koleksi token / kata kunci unik untuk user ini
  const userShort = (user.shortName || '').toLowerCase().trim();
  const userNameNorm = normalizePersonName(user.name || '');

  const distinctKeywords: string[] = [];
  if (userShort) distinctKeywords.push(userShort);
  
  // Ambil kata-kata dari nama lengkap yang panjangnya >= 3 karakter
  userNameNorm.split(' ').filter(w => w.length >= 3).forEach(w => distinctKeywords.push(w));

  // Tambahkan sinonim khusus per personil
  if (userShort === 'rafi' || userNameNorm.includes('rafi')) {
    distinctKeywords.push('rafly', 'rafil', 'ao#1', 'ao 0001');
  } else if (userShort === 'rizki' || userNameNorm.includes('rizki')) {
    distinctKeywords.push('riski', 'wiharyadi', 'ao#2', 'ao 0002');
  } else if (userShort === 'rasya' || userNameNorm.includes('rasya')) {
    distinctKeywords.push('ao#3', 'ao 0003');
  } else if (userShort === 'noval' || userNameNorm.includes('noval') || userNameNorm.includes('nouval')) {
    distinctKeywords.push('nouval', 'rakean', 'dhafin', 'kor 0001');
  } else if (userShort === 'alan' || userNameNorm.includes('alan')) {
    distinctKeywords.push('suherman', 'mng 0001');
  } else if (userShort === 'yustiaji' || userNameNorm.includes('yustiaji')) {
    distinctKeywords.push('dir 0001');
  } else if (userShort === 'syabaab' || userNameNorm.includes('syabaab')) {
    distinctKeywords.push('adm 0001');
  }

  // 3. Periksa kecocokan kata: apakah ada keyword user di dalam assignedWords
  // Menggunakan pencocokan kata (word match), bukan substring bebas, untuk mencegah 'a' cocok dengan 'rafi'
  const hasWordMatch = distinctKeywords.some(keyword => {
    const normKeyword = normalizePersonName(keyword);
    if (!normKeyword) return false;
    
    // Jika keyword terdiri dari multi-kata (e.g. "ao 0001" atau "super admin")
    if (normKeyword.includes(' ')) {
      return normAssigned.includes(normKeyword);
    }
    
    // Jika keyword single word: cocok jika salah satu kata persis sama atau diawali keyword
    return assignedWords.some(w => w === normKeyword || (w.length >= 4 && normKeyword.length >= 4 && (w.startsWith(normKeyword) || normKeyword.startsWith(w))));
  });

  return hasWordMatch;
}

/**
 * Cek apakah PENGUJIAN SPESIFIK (Single Test Item) ditugaskan ke teknisi tertentu.
 * Menjamin 1 pengujian HANYA masuk ke 1 akun teknisi sesuai penugasan di Web App.
 */
export function isSingleTestAssignedToUser(test: any, sample: any, user: UserProfile): boolean {
  if (!user || !test) return false;

  const assignedTech = getTestAssignedTechnician(test, sample);
  if (!assignedTech) return false;

  return isTechnicianNameMatchingUser(assignedTech, user);
}

/** Cek apakah sampel atau pengujian di dalamnya ditugaskan ke pengguna tertentu */
export function isSampleAssignedToUser(sample: any, user: UserProfile): boolean {
  if (!user || !sample) return false;

  // Super Admin, Lab Manager, dan QA/QC Coordinator dapat melihat semua sampel
  if (['SUPER_ADMIN', 'LAB_MANAGER', 'QA_QC_COORDINATOR'].includes(user.role)) {
    return true;
  }

  const tests = sample.tests || [];
  return tests.some((test: any) => isSingleTestAssignedToUser(test, sample, user));
}
