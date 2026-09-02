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
  settings:            ['SUPER_ADMIN', 'LAB_MANAGER'],
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

/** Helper penentuan nama teknisi match */
const getMatchingTerms = (user: UserProfile): string[] => {
  if (!user) return [];
  const terms = [
    user.name?.toLowerCase(),
    user.shortName?.toLowerCase(),
    user.nip?.toLowerCase(),
    user.analyistCode?.toLowerCase(),
    user.id?.toLowerCase()
  ].filter(Boolean) as string[];

  // Add alias synonyms for seamless legacy data matching
  if (user.shortName?.toLowerCase() === 'rafi' || user.name?.toLowerCase().includes('rafi')) {
    terms.push('rafly', 'rafly reza', 'ao#1', 'ao-0001', 'rafil', 'rafi, a.md.', 'rafi, a. md.');
  }
  if (user.shortName?.toLowerCase() === 'rizki' || user.name?.toLowerCase().includes('rizki')) {
    terms.push('rizki', 'ao#2', 'ao-0002');
  }
  if (user.shortName?.toLowerCase() === 'rasya' || user.name?.toLowerCase().includes('rasya')) {
    terms.push('rasya', 'ao#3', 'ao-0003');
  }
  if (user.shortName?.toLowerCase() === 'noval' || user.name?.toLowerCase().includes('nouval')) {
    terms.push('m noval', 'noval fadli', 'nouval', 'kor-0001');
  }
  return terms;
};

/** Cek apakah PENGUJIAN SPESIFIK (Single Test Item) ditugaskan ke teknisi tertentu */
export function isSingleTestAssignedToUser(test: any, sample: any, user: UserProfile): boolean {
  if (!user || !test) return false;

  const terms = getMatchingTerms(user);

  const isMatch = (val?: string) => {
    if (!val || typeof val !== 'string') return false;
    const lVal = val.toLowerCase().trim();
    if (!lVal) return false;
    return terms.some(t => lVal.includes(t) || t.includes(lVal));
  };

  // 1. Direct assignment on test object
  if (isMatch(test.technicianName) || isMatch(test.assignedTechnician) || isMatch(test.testedBy)) {
    return true;
  }

  // 2. Calculation data / worksheet values
  const calc = test.calculationData || {};
  const inputVal = calc.inputValues?.testedBy || calc.inputValues?.assignedTechnician;
  const summaryVal = calc.summaryResults?.testedBy || calc.summaryResults?.assignedTechnician;
  if (isMatch(inputVal) || isMatch(summaryVal)) {
    return true;
  }

  // 3. Fallback to sample level testedBy if sample-wide assignment
  if (isMatch(sample?.testedBy) || isMatch(sample?.assignedTechnician)) {
    return true;
  }

  return false;
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
