import React, { useState, useEffect, useRef } from 'react';
import { PurchaseOrder, Sample, SampleTest, DocumentItem, TestStatus, MatrixTestInfo, MATRIX_TEST_CATALOGUE, DEFAULT_SAMPLE_TYPES, ContainerItem, RingItem, ConsolRingItem, DsProvingItem, DsRingItem, TrxRingItem, UctRingItem, PycnometerItem, PersonnelItem, MoldItem, ReamerItem } from './types';
import { INITIAL_POS, INITIAL_CLIENTS, INITIAL_DOCUMENTS, MASTER_TEST_TYPES, DEFAULT_CONTAINER_CATALOGUE, DEFAULT_RING_CATALOGUE, DEFAULT_CONSOL_RING_CATALOGUE, DEFAULT_DS_PROVING_CATALOGUE, DEFAULT_DS_RING_CATALOGUE, DEFAULT_TRX_RING_CATALOGUE, DEFAULT_UCT_RING_CATALOGUE, DEFAULT_PYCNOMETER_CATALOGUE, DEFAULT_PERSONNEL_CATALOGUE, DEFAULT_MOLD_CATALOGUE, DEFAULT_REAMER_CATALOGUE } from './data/initialData';
import { getPODeadlineStatus, normalizeTestCode, migrateRemoveSumartadji, migrateEnsureAllSampleTestStatuses, migrateStandardizeDsUu, migrateCanonicalTestCodes, ensurePrepReportsForPOs } from './utils/helpers';
import { ExcelImportResult } from './utils/excelParser';
import { UserProfile, INITIAL_USERS } from './types/userTypes';

import { Sidebar } from './components/Sidebar';
import { Navbar } from './components/Navbar';
import { DashboardView } from './components/DashboardView';
import { LscpDashboardView } from './components/LscpDashboardView';
import { LscpTvDisplayView } from './components/lscp/LscpTvDisplayView';
import { POManagementView } from './components/POManagementView';
import { FileExplorerView } from './components/FileExplorerView';
import { FutureCalcModal } from './components/FutureCalcModal';
import { SchemaViewerModal } from './components/SchemaViewerModal';
import { SampleReportSheetModal } from './components/SampleReportSheetModal';
import { SettingsView } from './components/SettingsView';
import { PhysicalPropertiesModal } from './components/PhysicalPropertiesModal';
import { PhysicalPropertiesView } from './components/PhysicalPropertiesView';
import { SandboxTestView } from './components/SandboxTestView';
import { LHUReportModal } from './components/LHUReportModal';
import { LHUSheetCode } from './types/lhuTypes';
import { UserManagementView } from './components/UserManagementView';
import { PublicReportVerificationView } from './components/PublicReportVerificationView';
import { ErrorBoundary } from './components/ErrorBoundary';

// ISO 17025 Workflow Components & Types
import { Quotation, SampleReceipt, SamplePrepReport, SubcontractNotice, SubcontractShippingLetter, Invoice, Client, LabRekanan } from './types/workflowTypes';
import { INITIAL_QUOTATIONS, INITIAL_SAMPLE_RECEIPTS, INITIAL_PREP_REPORTS, INITIAL_SUBCONTRACT_NOTICES, INITIAL_SUBCONTRACT_LETTERS, INITIAL_INVOICES } from './utils/workflowMockData';
import { QuotationView } from './components/workflow/QuotationView';
import { SampleReceiptView } from './components/workflow/SampleReceiptView';
import { SamplePrepView } from './components/workflow/SamplePrepView';
import { SubcontractNoticeView } from './components/workflow/SubcontractNoticeView';
import { BlankWorksheetView } from './components/workflow/BlankWorksheetView';
import { InvoiceView } from './components/workflow/InvoiceView';
import { ClientMasterView } from './components/workflow/ClientMasterView';
import { WaktuPengujianView } from './components/WaktuPengujianView';
import { FinancialAnalyticsView } from './components/FinancialAnalyticsView';
import { MobileTechnicianApp } from './components/mobile/MobileTechnicianApp';
import { LoginView } from './components/LoginView';
import { GuestBookView } from './components/guestbook/GuestBookView';

import { CheckCircle2 } from 'lucide-react';

const migrateATTtoATB = (orders: PurchaseOrder[]): PurchaseOrder[] => {
  if (!Array.isArray(orders)) return orders;
  return orders.map(po => ({
    ...po,
    samples: (po?.samples || []).map(sample => ({
      ...sample,
      tests: (sample?.tests || []).map(test => {
        if (!test) return test;
        const normCode = normalizeTestCode(test.testTypeCode || test.testTypeId || '');
        
        // Reconcile falsely completed SVE-HYD tests that have no real data
        if (normCode === 'SVE-HYD') {
          const calc = test.calculationData || {};
          const inputs = calc.inputValues || calc;
          const hasSieve = (Array.isArray(inputs.shSieveRetained) && inputs.shSieveRetained.some((v: string) => v !== '' && parseFloat(v) > 0)) ||
                           (parseFloat(inputs.wSieveRetained) > 0);
          const hasHydro = (Array.isArray(inputs.shHydroReadings) && inputs.shHydroReadings.some((v: string) => v !== '' && parseFloat(v) > 0));
          
          if (!hasSieve && !hasHydro) {
            const hasAnyDraft = (Array.isArray(inputs.shSieveRetained) && inputs.shSieveRetained.some((v: string) => v !== '')) ||
                                (Array.isArray(inputs.shHydroReadings) && inputs.shHydroReadings.some((v: string) => v !== ''));
            return {
              ...test,
              testTypeCode: normCode,
              status: hasAnyDraft ? ('Sedang Diuji' as const) : ('Belum Diuji' as const),
              calculationStatus: hasAnyDraft ? ('Draft Data' as const) : ('Not Started' as const)
            };
          }
        }

        return {
          ...test,
          testTypeCode: normCode
        };
      })
    }))
  }));
};

const deduplicatePOs = (orders: PurchaseOrder[]): PurchaseOrder[] => {
  if (!Array.isArray(orders)) return orders;
  const seenIds = new Set<string>();
  const seenNumbers = new Set<string>();
  return orders.filter(po => {
    if (!po || !po.id) return false;
    const normNum = (po.poNumber || po.id).trim().toUpperCase();
    if (seenIds.has(po.id) || seenNumbers.has(normNum)) {
      return false;
    }
    seenIds.add(po.id);
    seenNumbers.add(normNum);
    return true;
  });
};

const deduplicateDocuments = (docs: DocumentItem[]): DocumentItem[] => {
  if (!Array.isArray(docs)) return docs;
  const seenIds = new Set<string>();
  const seenFolderNames = new Set<string>();
  return docs.filter(doc => {
    if (!doc || !doc.id) return false;
    if (seenIds.has(doc.id)) return false;
    seenIds.add(doc.id);

    if (doc.type === 'folder' && doc.id !== 'f-2026' && doc.id !== 'f-root') {
      const normName = (doc.name || '').trim().toLowerCase();
      if (seenFolderNames.has(normName)) return false;
      seenFolderNames.add(normName);
    }
    return true;
  });
};

export function App() {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [currentUser, setCurrentUser] = useState<UserProfile>(INITIAL_USERS[0]); // Default: Super Admin
  
  // Public Verification URL parameter check (e.g. ?verify=REP-2026-001)
  const [verifyParam, setVerifyParam] = useState<string>(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      return urlParams.get('verify') || urlParams.get('v') || urlParams.get('report') || '';
    } catch {
      return '';
    }
  });

  // Guest Book Self Check-in URL parameter check (e.g. ?mode=guest-checkin)
  const [guestBookMode, setGuestBookMode] = useState<boolean>(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const modeParam = urlParams.get('mode') || urlParams.get('view') || '';
      return modeParam === 'guest-checkin' || modeParam === 'guestbook' || urlParams.get('guest') === 'true';
    } catch {
      return false;
    }
  });

  // Standalone Smart TV LSCP Display Landing Page URL parameter check (e.g. ?mode=tv-lscp)
  const [lscpTvMode, setLscpTvMode] = useState<boolean>(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const modeParam = urlParams.get('mode') || urlParams.get('view') || '';
      return modeParam === 'tv-lscp' || modeParam === 'lscp-tv' || modeParam === 'display-lscp' || modeParam === 'tv' || urlParams.get('tv') === 'true';
    } catch {
      return false;
    }
  });

  // Mobile / Tablet View Mode State (Persisted per-tab in sessionStorage for multi-tab testing)
  const [isMobileMode, setIsMobileMode] = useState<boolean>(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('mode') === 'mobile' || urlParams.get('mobile') === 'true') return true;
      if (urlParams.get('mode') === 'desktop' || urlParams.get('desktop') === 'true') return false;

      const saved = sessionStorage.getItem('ansa_mobile_mode');
      if (saved !== null) return saved === 'true';
      return typeof window !== 'undefined' && window.innerWidth < 768;
    } catch {
      return false;
    }
  });

  useEffect(() => {
    sessionStorage.setItem('ansa_mobile_mode', String(isMobileMode));
  }, [isMobileMode]);

  // Users State with LocalStorage Persistence
  const [users, setUsers] = useState<UserProfile[]>(() => {
    try {
      const saved = localStorage.getItem('ansa_lab_users');
      return saved ? JSON.parse(saved) : INITIAL_USERS;
    } catch (e) {
      return INITIAL_USERS;
    }
  });

  useEffect(() => {
    localStorage.setItem('ansa_lab_users', JSON.stringify(users));
  }, [users]);

  // Authentication Session State (Persisted per-tab in sessionStorage for simultaneous Super Admin & Teknisi multi-tab support)
  const [authSession, setAuthSession] = useState<{ isAuthenticated: boolean; userId: string | null }>(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('mode') === 'mobile' || urlParams.get('mobile') === 'true') {
        const analyst = INITIAL_USERS.find(u => u.role === 'ANALYST') || INITIAL_USERS[0];
        return { isAuthenticated: true, userId: analyst.id };
      }
      if (urlParams.get('mode') === 'desktop' || urlParams.get('desktop') === 'true') {
        const admin = INITIAL_USERS.find(u => u.role === 'SUPER_ADMIN' || u.role === 'ADMIN') || INITIAL_USERS[0];
        return { isAuthenticated: true, userId: admin.id };
      }

      const saved = sessionStorage.getItem('ansa_lab_auth_session') || localStorage.getItem('ansa_lab_auth_session');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.isAuthenticated && parsed.userId) {
          return parsed;
        }
      }
    } catch (e) {}
    return { isAuthenticated: false, userId: null };
  });

  useEffect(() => {
    sessionStorage.setItem('ansa_lab_auth_session', JSON.stringify(authSession));
  }, [authSession]);

  // Sync currentUser with authenticated userId on startup
  useEffect(() => {
    if (authSession.isAuthenticated && authSession.userId) {
      const matched = users.find(u => u.id === authSession.userId);
      if (matched) {
        setCurrentUser(matched);
        if (matched.role === 'ANALYST') {
          setIsMobileMode(true);
        }
      }
    }
  }, [authSession, users]);

  const handleLoginSuccess = (user: UserProfile) => {
    setCurrentUser(user);
    setAuthSession({ isAuthenticated: true, userId: user.id });
    if (user.role === 'ANALYST') {
      setIsMobileMode(true);
    } else {
      setIsMobileMode(false);
      setActiveTab('dashboard');
    }
  };

  const handleLogout = () => {
    setAuthSession({ isAuthenticated: false, userId: null });
    setIsMobileMode(false);
    sessionStorage.removeItem('ansa_lab_auth_session');
    sessionStorage.removeItem('ansa_mobile_mode');
  };

  const handleAddUser = (newUser: UserProfile) => {
    setUsers(prev => [newUser, ...prev]);
  };

  const handleUpdateUser = (updatedUser: UserProfile) => {
    setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
    if (currentUser.id === updatedUser.id) {
      setCurrentUser(updatedUser);
    }
  };

  const handleDeleteUser = (userId: string) => {
    setUsers(prev => prev.filter(u => u.id !== userId));
  };

  // Global Atom Sync Loader & Toast Feedback State
  const [isSyncingAtomGlobal, setIsSyncingAtomGlobal] = useState<boolean>(false);
  const [syncAtomDetails, setSyncAtomDetails] = useState<{ title: string; subtitle: string } | null>(null);
  const [globalToastMsg, setGlobalToastMsg] = useState<string | null>(null);

  const showGlobalToast = (msg: string) => {
    setGlobalToastMsg(msg);
    setTimeout(() => setGlobalToastMsg(null), 3500);
  };

  // Persistent PO state with clean initial fallback
  const [pos, setPos] = useState<PurchaseOrder[]>(() => {
    let initialList = INITIAL_POS;
    const saved = localStorage.getItem('ansa_lab_pos');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          initialList = parsed;
        }
      } catch (e) { console.error(e); }
    }
    return deduplicatePOs(migrateCanonicalTestCodes(migrateStandardizeDsUu(migrateEnsureAllSampleTestStatuses(migrateRemoveSumartadji(migrateATTtoATB(initialList))))));
  });

  // Real-time Cross-Tab & Cross-Port Synchronization Listener (BroadcastChannel & Storage Event)
  useEffect(() => {
    const handleSync = (newPosData: PurchaseOrder[]) => {
      if (Array.isArray(newPosData) && newPosData.length > 0) {
        setPos(prev => {
          const migrated = deduplicatePOs(migrateCanonicalTestCodes(migrateStandardizeDsUu(migrateEnsureAllSampleTestStatuses(migrateRemoveSumartadji(migrateATTtoATB(newPosData))))));
          if (JSON.stringify(prev) !== JSON.stringify(migrated)) {
            return migrated;
          }
          return prev;
        });
      }
    };

    let channel: BroadcastChannel | null = null;
    if (typeof BroadcastChannel !== 'undefined') {
      channel = new BroadcastChannel('ansa_lab_realtime_sync');
      channel.onmessage = (e) => {
        if (e.data?.type === 'SYNC_POS' && e.data?.pos) {
          handleSync(e.data.pos);
        }
      };
    }

    const handleStorageEvent = (e: StorageEvent) => {
      if (e.key === 'ansa_lab_pos' && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          handleSync(parsed);
        } catch (err) {}
      }
    };
    window.addEventListener('storage', handleStorageEvent);

    return () => {
      if (channel) channel.close();
      window.removeEventListener('storage', handleStorageEvent);
    };
  }, []);

  // Persistent Document Explorer state with auto deduplication
  const [documents, setDocuments] = useState<DocumentItem[]>(() => {
    const saved = localStorage.getItem('ansa_lab_docs');
    if (saved) {
      try { return deduplicateDocuments(JSON.parse(saved)); } catch (e) { console.error(e); }
    }
    return deduplicateDocuments(INITIAL_DOCUMENTS);
  });

  // Dynamic Test Catalogue (persisted to localStorage)
  const [testCatalogue, setTestCatalogue] = useState<MatrixTestInfo[]>(() => {
    const saved = localStorage.getItem('ansa_lab_test_catalogue');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const physList = ['SG','MC','UW','ATB','SVE-HYD','Sieve-Hydro','S&H','CMP-STD','CMP-MOD','PRM','PB','PERM','PREP','BD-DD','SND-CONE','SWELLING','SHRINKAGE','PH','CHLORID','SULFAT','CARBONAT','RESISTIVITY'];
          return parsed.map((item: MatrixTestInfo) => {
            const canonicalMatch = MATRIX_TEST_CATALOGUE.find(m => normalizeTestCode(m.code) === normalizeTestCode(item.code));
            if (canonicalMatch) {
              return {
                ...canonicalMatch,
                ...item,
                code: canonicalMatch.code,
                label: canonicalMatch.label,
                fullNameIndo: canonicalMatch.fullNameIndo,
                fullNameEn: canonicalMatch.fullNameEn,
                sniStandard: canonicalMatch.sniStandard,
                category: canonicalMatch.category
              };
            }
            const norm = normalizeTestCode(item.code);
            return {
              ...item,
              code: norm,
              label: norm,
              category: item.category || (physList.includes(norm.toUpperCase()) ? 'physical' : 'mechanical')
            };
          });
        }
      } catch (e) { console.error(e); }
    }
    return MATRIX_TEST_CATALOGUE;
  });

  // ISO 17025 Workflow States (Persisted to localStorage)
  const [quotations, setQuotations] = useState<Quotation[]>(() => {
    const saved = localStorage.getItem('ansa_lab_quotations');
    if (saved) { try { return JSON.parse(saved); } catch (e) {} }
    return INITIAL_QUOTATIONS;
  });

  const [sampleReceipts, setSampleReceipts] = useState<SampleReceipt[]>(() => {
    const saved = localStorage.getItem('ansa_lab_sample_receipts');
    if (saved) { try { return JSON.parse(saved); } catch (e) {} }
    return INITIAL_SAMPLE_RECEIPTS;
  });

  const [samplePrepReports, setSamplePrepReports] = useState<SamplePrepReport[]>(() => {
    const saved = localStorage.getItem('ansa_lab_prep_reports');
    let loaded: SamplePrepReport[] = INITIAL_PREP_REPORTS;
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) loaded = parsed;
      } catch (e) {}
    }
    return ensurePrepReportsForPOs(loaded, pos);
  });

  const [subcontractNotices, setSubcontractNotices] = useState<SubcontractNotice[]>(() => {
    const saved = localStorage.getItem('ansa_lab_subcontract_notices');
    if (saved) { try { return JSON.parse(saved); } catch (e) {} }
    return INITIAL_SUBCONTRACT_NOTICES;
  });

  const [subcontractShippingLetters, setSubcontractShippingLetters] = useState<SubcontractShippingLetter[]>(() => {
    const saved = localStorage.getItem('ansa_lab_subcontract_letters');
    if (saved) { try { return JSON.parse(saved); } catch (e) {} }
    return INITIAL_SUBCONTRACT_LETTERS;
  });

  const [invoices, setInvoices] = useState<Invoice[]>(() => {
    const saved = localStorage.getItem('ansa_lab_invoices');
    if (saved) { try { return JSON.parse(saved); } catch (e) {} }
    return INITIAL_INVOICES;
  });

  // Master Data: Client & Lab Rekanan
  const [clients, setClients] = useState<Client[]>(() => {
    const saved = localStorage.getItem('ansa_lab_clients');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {}
    }
    return INITIAL_CLIENTS;
  });
  const [labRekanans, setLabRekanans] = useState<LabRekanan[]>(() => {
    const saved = localStorage.getItem('ansa_lab_lab_rekanans');
    if (saved) { try { return JSON.parse(saved); } catch (e) {} }
    return [];
  });

  // Safe LocalStorage setter with QuotaExceededError handling
  const safeSetLocalStorage = (key: string, data: any) => {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (e: any) {
      console.warn(`[LocalStorage Quota Warning] Failed to set "${key}":`, e);
      if (key === 'ansa_lab_sample_receipts' && Array.isArray(data)) {
        try {
          const stripped = data.map(item => ({
            ...item,
            photos: item.photos?.map((p: any) => ({
              ...p,
              dataUrl: p.dataUrl && p.dataUrl.length > 50000 ? p.dataUrl.substring(0, 250) + '...' : p.dataUrl
            }))
          }));
          localStorage.setItem(key, JSON.stringify(stripped));
        } catch (err) {
          console.error('Compressed fallback save failed:', err);
        }
      }
    }
  };

  useEffect(() => { safeSetLocalStorage('ansa_lab_quotations', quotations); }, [quotations]);
  useEffect(() => { safeSetLocalStorage('ansa_lab_sample_receipts', sampleReceipts); }, [sampleReceipts]);
  useEffect(() => { safeSetLocalStorage('ansa_lab_prep_reports', samplePrepReports); }, [samplePrepReports]);
  useEffect(() => { safeSetLocalStorage('ansa_lab_subcontract_notices', subcontractNotices); }, [subcontractNotices]);
  useEffect(() => { safeSetLocalStorage('ansa_lab_subcontract_letters', subcontractShippingLetters); }, [subcontractShippingLetters]);
  useEffect(() => { safeSetLocalStorage('ansa_lab_invoices', invoices); }, [invoices]);
  useEffect(() => { safeSetLocalStorage('ansa_lab_clients', clients); }, [clients]);
  useEffect(() => { safeSetLocalStorage('ansa_lab_lab_rekanans', labRekanans); }, [labRekanans]);

  // Selected PO & Sample for drill-down view
  const [selectedPOId, setSelectedPOId] = useState<string | undefined>(undefined);
  const [selectedSampleId, setSelectedSampleId] = useState<string | undefined>(undefined);

  // Modals state
  const [activeCalcTest, setActiveCalcTest] = useState<{ test: SampleTest; sample: Sample; po: PurchaseOrder } | null>(null);
  const [activePPModal, setActivePPModal] = useState<{ sample: Sample; po: PurchaseOrder } | null>(null);
  const [activeReportSheet, setActiveReportSheet] = useState<{ sample: Sample; po: PurchaseOrder } | null>(null);
  const [activeLHUModal, setActiveLHUModal] = useState<{ sample: Sample; po: PurchaseOrder; initialSelectedCodes?: LHUSheetCode[] } | null>(null);
  const [isSchemaModalOpen, setIsSchemaModalOpen] = useState(false);

  // Save to localStorage whenever pos changes & auto-sync BA Preparasi
  useEffect(() => {
    safeSetLocalStorage('ansa_lab_pos', pos);
    setSamplePrepReports(prev => {
      const updated = ensurePrepReportsForPOs(prev, pos);
      if (updated.length !== prev.length) {
        safeSetLocalStorage('ansa_lab_prep_reports', updated);
        return updated;
      }
      return prev;
    });
  }, [pos]);



  useEffect(() => {
    safeSetLocalStorage('ansa_lab_docs', documents);
  }, [documents]);

  useEffect(() => {
    safeSetLocalStorage('ansa_lab_test_catalogue', testCatalogue);
  }, [testCatalogue]);

  // --- HANDLERS FOR TEST CATALOGUE ---
  const handleUpdateTestCatalogue = (updated: MatrixTestInfo[]) => {
    setTestCatalogue(updated);
  };

  const handleResetTestCatalogue = () => {
    if (confirm('Reset katalog uji ke default bawaan? Semua perubahan nama/kode akan direset.')) {
      setTestCatalogue(MATRIX_TEST_CATALOGUE);
    }
  };

  // Dynamic Sample Types (persisted to localStorage)
  const [sampleTypeCatalogue, setSampleTypeCatalogue] = useState<string[]>(() => {
    const saved = localStorage.getItem('ansa_lab_sample_types');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) { console.error(e); }
    }
    return DEFAULT_SAMPLE_TYPES;
  });

  useEffect(() => {
    localStorage.setItem('ansa_lab_sample_types', JSON.stringify(sampleTypeCatalogue));
  }, [sampleTypeCatalogue]);

  const handleUpdateSampleTypeCatalogue = (updated: string[]) => {
    setSampleTypeCatalogue(updated);
  };

  const handleResetSampleTypeCatalogue = () => {
    if (confirm('Reset katalog tipe sampel ke default bawaan?')) {
      setSampleTypeCatalogue(DEFAULT_SAMPLE_TYPES);
    }
  };

  // Dynamic Containers (persisted to localStorage)
  const [containerCatalogue, setContainerCatalogue] = useState<ContainerItem[]>(() => {
    const saved = localStorage.getItem('ansa_lab_containers');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const defaultMap = new Map(DEFAULT_CONTAINER_CATALOGUE.map(c => [String(c.id).toUpperCase(), c.weight]));
          const updatedParsed = parsed.map((c: any) => {
            const officialWt = defaultMap.get(String(c.id).toUpperCase());
            return officialWt !== undefined ? { ...c, weight: officialWt } : c;
          });
          const existingIds = new Set(updatedParsed.map((c: any) => String(c.id).toUpperCase()));
          const missingDefaults = DEFAULT_CONTAINER_CATALOGUE.filter(c => !existingIds.has(String(c.id).toUpperCase()));
          return missingDefaults.length > 0 ? [...updatedParsed, ...missingDefaults] : updatedParsed;
        }
      } catch (e) { console.error(e); }
    }
    return DEFAULT_CONTAINER_CATALOGUE;
  });

  useEffect(() => {
    localStorage.setItem('ansa_lab_containers', JSON.stringify(containerCatalogue));
  }, [containerCatalogue]);

  // Dynamic Mold Compaction
  const [moldCatalogue, setMoldCatalogue] = useState<MoldItem[]>(() => {
    const saved = localStorage.getItem('ansa_lab_molds');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const existingKodes = new Set(parsed.map((m: any) => m.kode));
          const missingDefaults = DEFAULT_MOLD_CATALOGUE.filter(m => !existingKodes.has(m.kode));
          return missingDefaults.length > 0 ? [...parsed, ...missingDefaults] : parsed;
        }
      } catch (e) { console.error(e); }
    }
    return DEFAULT_MOLD_CATALOGUE;
  });

  useEffect(() => {
    localStorage.setItem('ansa_lab_molds', JSON.stringify(moldCatalogue));
  }, [moldCatalogue]);

  const handleUpdateMoldCatalogue = (updated: MoldItem[]) => setMoldCatalogue(updated);
  const handleResetMoldCatalogue = () => {
    if (confirm('Reset katalog Mold Compaction ke default (Standard, Modified & CBR)?')) setMoldCatalogue(DEFAULT_MOLD_CATALOGUE);
  };

  // Dynamic Reamer Compaction
  const [reamerCatalogue, setReamerCatalogue] = useState<ReamerItem[]>(() => {
    const saved = localStorage.getItem('ansa_lab_reamers');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const existingKodes = new Set(parsed.map((r: any) => r.kode));
          const missingDefaults = DEFAULT_REAMER_CATALOGUE.filter(r => !existingKodes.has(r.kode));
          return missingDefaults.length > 0 ? [...parsed, ...missingDefaults] : parsed;
        }
      } catch (e) { console.error(e); }
    }
    return DEFAULT_REAMER_CATALOGUE;
  });

  useEffect(() => {
    localStorage.setItem('ansa_lab_reamers', JSON.stringify(reamerCatalogue));
  }, [reamerCatalogue]);

  const handleUpdateReamerCatalogue = (updated: ReamerItem[]) => setReamerCatalogue(updated);
  const handleResetReamerCatalogue = () => {
    if (confirm('Reset katalog Reamer Compaction ke default?')) setReamerCatalogue(DEFAULT_REAMER_CATALOGUE);
  };

  const handleUpdateContainerCatalogue = (updated: ContainerItem[]) => {
    setContainerCatalogue(updated);
  };

  const handleResetContainerCatalogue = () => {
    if (confirm('Reset katalog cawan (container) ke default bawaan (143 cawan)?')) {
      setContainerCatalogue(DEFAULT_CONTAINER_CATALOGUE);
    }
  };

  // Dynamic Rings (persisted to localStorage)
  const [ringCatalogue, setRingCatalogue] = useState<RingItem[]>(() => {
    const saved = localStorage.getItem('ansa_lab_rings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) { console.error(e); }
    }
    return DEFAULT_RING_CATALOGUE;
  });

  useEffect(() => {
    localStorage.setItem('ansa_lab_rings', JSON.stringify(ringCatalogue));
  }, [ringCatalogue]);

  const handleUpdateRingCatalogue = (updated: RingItem[]) => {
    setRingCatalogue(updated);
  };

  const handleResetRingCatalogue = () => {
    if (confirm('Reset katalog ring unit weight ke default bawaan (17 ring)?')) {
      setRingCatalogue(DEFAULT_RING_CATALOGUE);
    }
  };

  // Dynamic Consolidation Rings (persisted to localStorage)
  const [consolRingCatalogue, setConsolRingCatalogue] = useState<ConsolRingItem[]>(() => {
    const saved = localStorage.getItem('ansa_lab_consol_rings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) { console.error(e); }
    }
    return DEFAULT_CONSOL_RING_CATALOGUE;
  });

  useEffect(() => {
    localStorage.setItem('ansa_lab_consol_rings', JSON.stringify(consolRingCatalogue));
  }, [consolRingCatalogue]);

  const handleUpdateConsolRingCatalogue = (updated: ConsolRingItem[]) => {
    setConsolRingCatalogue(updated);
  };

  const handleResetConsolRingCatalogue = () => {
    if (confirm('Reset katalog kalibrasi ring konsolidasi ke default bawaan?')) {
      setConsolRingCatalogue(DEFAULT_CONSOL_RING_CATALOGUE);
    }
  };

  // Dynamic Direct Shear Rings (persisted to localStorage)
  const [dsRingCatalogue, setDsRingCatalogue] = useState<DsRingItem[]>(() => {
    const saved = localStorage.getItem('ansa_lab_ds_rings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) { console.error(e); }
    }
    return DEFAULT_DS_RING_CATALOGUE;
  });

  useEffect(() => {
    localStorage.setItem('ansa_lab_ds_rings', JSON.stringify(dsRingCatalogue));
  }, [dsRingCatalogue]);

  // Dynamic Direct Shear Proving Rings / Machines (persisted to localStorage)
  const [dsProvingCatalogue, setDsProvingCatalogue] = useState<DsProvingItem[]>(() => {
    const saved = localStorage.getItem('ansa_lab_ds_proving_rings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) { console.error(e); }
    }
    return DEFAULT_DS_PROVING_CATALOGUE;
  });

  useEffect(() => {
    localStorage.setItem('ansa_lab_ds_proving_rings', JSON.stringify(dsProvingCatalogue));
  }, [dsProvingCatalogue]);

  const handleUpdateDsProvingCatalogue = (updated: DsProvingItem[]) => {
    setDsProvingCatalogue(updated);
  };

  const handleResetDsProvingCatalogue = () => {
    if (confirm('Reset katalog kalibrasi proving ring mesin DS ke default?')) {
      setDsProvingCatalogue(DEFAULT_DS_PROVING_CATALOGUE);
    }
  };

  const handleUpdateDsRingCatalogue = (updated: DsRingItem[]) => {
    setDsRingCatalogue(updated);
  };

  const handleResetDsRingCatalogue = () => {
    if (confirm('Reset katalog kalibrasi ring Direct Shear ke default bawaan?')) {
      setDsRingCatalogue(DEFAULT_DS_RING_CATALOGUE);
    }
  };

  // Dynamic Triaxial TRX Proving Rings (persisted to localStorage)
  const [trxRingCatalogue, setTrxRingCatalogue] = useState<TrxRingItem[]>(() => {
    const saved = localStorage.getItem('ansa_lab_trx_rings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) { console.error(e); }
    }
    return DEFAULT_TRX_RING_CATALOGUE;
  });

  useEffect(() => {
    localStorage.setItem('ansa_lab_trx_rings', JSON.stringify(trxRingCatalogue));
  }, [trxRingCatalogue]);

  const handleUpdateTrxRingCatalogue = (updated: TrxRingItem[]) => {
    setTrxRingCatalogue(updated);
  };

  const handleResetTrxRingCatalogue = () => {
    if (confirm('Reset katalog kalibrasi ring Triaxial ke default bawaan?')) {
      setTrxRingCatalogue(DEFAULT_TRX_RING_CATALOGUE);
    }
  };

  // Dynamic UCT Proving Rings (persisted to localStorage)
  const [uctRingCatalogue, setUctRingCatalogue] = useState<UctRingItem[]>(() => {
    const saved = localStorage.getItem('ansa_lab_uct_rings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) { console.error(e); }
    }
    return DEFAULT_UCT_RING_CATALOGUE;
  });

  useEffect(() => {
    localStorage.setItem('ansa_lab_uct_rings', JSON.stringify(uctRingCatalogue));
  }, [uctRingCatalogue]);

  const handleUpdateUctRingCatalogue = (updated: UctRingItem[]) => {
    setUctRingCatalogue(updated);
  };

  const handleResetUctRingCatalogue = () => {
    if (confirm('Reset katalog kalibrasi ring UCT ke default bawaan?')) {
      setUctRingCatalogue(DEFAULT_UCT_RING_CATALOGUE);
    }
  };

  // Dynamic Pycnometers (persisted to localStorage)
  const [pycCatalogue, setPycCatalogue] = useState<PycnometerItem[]>(() => {
    const saved = localStorage.getItem('ansa_lab_pycs');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) { console.error(e); }
    }
    return DEFAULT_PYCNOMETER_CATALOGUE;
  });

  useEffect(() => {
    localStorage.setItem('ansa_lab_pycs', JSON.stringify(pycCatalogue));
  }, [pycCatalogue]);

  const handleUpdatePycCatalogue = (updated: PycnometerItem[]) => {
    setPycCatalogue(updated);
  };

  const handleResetPycCatalogue = () => {
    if (confirm('Reset kalibrasi piknometer ke default bawaan (20 piknometer)?')) {
      setPycCatalogue(DEFAULT_PYCNOMETER_CATALOGUE);
    }
  };

  // Dynamic Personnel Catalogue (persisted to localStorage)
  const [personnelCatalogue, setPersonnelCatalogue] = useState<PersonnelItem[]>(() => {
    const saved = localStorage.getItem('ansa_lab_personnels');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) { console.error(e); }
    }
    return DEFAULT_PERSONNEL_CATALOGUE;
  });

  // Auto-sync personnelCatalogue with users state so Master Personil & User Management stay in sync
  useEffect(() => {
    setPersonnelCatalogue(prevPersonnel => {
      const userIds = new Set(users.map(u => u.id));
      const synced: PersonnelItem[] = users.map(u => {
        const existing = (prevPersonnel || []).find(p => p.id === u.id || p.name.toLowerCase() === u.name.toLowerCase() || p.name.toLowerCase() === u.shortName.toLowerCase());

        let pRole: 'Penguji' | 'Analyst' | 'Computed' | 'Approver' = 'Penguji';
        if (u.role === 'EXECUTIVE_DIRECTOR' || u.role === 'LAB_MANAGER' || u.role === 'SUPER_ADMIN') {
          pRole = 'Approver';
        } else if (u.role === 'QA_QC_COORDINATOR') {
          pRole = 'Analyst';
        } else if (u.role === 'ADMIN_FINANCE') {
          pRole = 'Computed';
        }

        const sig = existing?.signatureUrl || existing?.digitalSignatureUrl || u.digitalSignatureUrl || u.signatureUrl;

        return {
          id: u.id,
          name: u.name,
          role: pRole,
          title: u.digitalSignatureLabel || u.specialization || USER_ROLE_LABELS[u.role],
          signatureUrl: sig,
          digitalSignatureUrl: sig
        };
      });

      // Retain any custom added personnel items that aren't matched yet
      const customItems = (prevPersonnel || []).filter(p => !userIds.has(p.id) && !users.some(u => u.name.toLowerCase() === p.name.toLowerCase()));

      return [...synced, ...customItems];
    });
  }, [users]);

  useEffect(() => {
    localStorage.setItem('ansa_lab_personnels', JSON.stringify(personnelCatalogue));
  }, [personnelCatalogue]);

  const handleUpdatePersonnelCatalogue = (updated: PersonnelItem[]) => {
    setPersonnelCatalogue(updated);
    safeSetLocalStorage('ansa_lab_personnels', updated);

    // Sync back into users state & localStorage so new personnel are created as User Accounts
    setUsers(prevUsers => {
      const userMap = new Map(prevUsers.map(u => [u.id, u]));
      const newUsersFromPersonnel: UserProfile[] = [];

      updated.forEach(p => {
        const userMatch = prevUsers.find(u => u.id === p.id || u.name.toLowerCase() === p.name.toLowerCase());
        if (!userMatch) {
          let role: UserRole = 'ANALYST';
          if (p.role === 'Approver') role = 'LAB_MANAGER';
          else if (p.role === 'Computed') role = 'ADMIN_FINANCE';
          else if (p.role === 'Analyst') role = 'QA_QC_COORDINATOR';

          newUsersFromPersonnel.push({
            id: p.id,
            name: p.name,
            shortName: p.name.split(' ')[0],
            nip: `STAFF-${Math.floor(1000 + Math.random() * 9000)}`,
            email: `${p.name.toLowerCase().replace(/[^a-z0-9]/g, '')}@ansalab.com`,
            role,
            password: '1234',
            avatarInitials: p.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase(),
            digitalSignatureLabel: p.title || p.name,
            digitalSignatureUrl: p.digitalSignatureUrl || p.signatureUrl,
            signatureUrl: p.digitalSignatureUrl || p.signatureUrl,
            isActive: true
          });
        }
      });

      const nextUsers = [
        ...prevUsers.map(u => {
          const p = updated.find(item => item.id === u.id || item.name.toLowerCase() === u.name.toLowerCase() || item.name.toLowerCase() === u.shortName.toLowerCase());
          if (p) {
            const sig = p.signatureUrl || p.digitalSignatureUrl;
            return {
              ...u,
              digitalSignatureUrl: sig,
              signatureUrl: sig
            };
          }
          return u;
        }),
        ...newUsersFromPersonnel
      ];

      safeSetLocalStorage('ansa_lab_users', nextUsers);
      return nextUsers;
    });
  };

  const handleResetPersonnelCatalogue = () => {
    if (confirm('Reset daftar master personil lab ke bawaan default?')) {
      setPersonnelCatalogue(DEFAULT_PERSONNEL_CATALOGUE);
    }
  };

  // Urgent PO Count
  const urgentPOCount = pos.filter(p => {
    const d = getPODeadlineStatus(p.deadline);
    return p.status === 'Running' && (d.badgeColor === 'red' || d.badgeColor === 'yellow');
  }).length;

  const runningPOCount = pos.filter(p => p.status === 'Running').length;

  // --- CRUD HANDLERS FOR PO ---
  const handleAddPO = (newPOData: Partial<PurchaseOrder>) => {
    const newId = `po-${Date.now()}`;
    const fullPO: PurchaseOrder = {
      id: newId,
      poNumber: newPOData.poNumber || `PO-2026-${Math.floor(100 + Math.random() * 900)}`,
      clientName: newPOData.clientName || 'Klien Baru',
      clientAddress: newPOData.clientAddress || '',
      projectName: newPOData.projectName || 'Proyek Baru',
      projectLocation: newPOData.projectLocation || '',
      status: newPOData.status || 'Running',
      startDate: newPOData.startDate || new Date().toISOString(),
      deadline: newPOData.deadline || new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString(),
      sampleArrivalDate: newPOData.sampleArrivalDate || new Date().toISOString(),
      listReceivedDate: newPOData.listReceivedDate || new Date().toISOString(),
      preparationStartDate: newPOData.preparationStartDate || new Date().toISOString(),
      testingStartDate: newPOData.testingStartDate || new Date().toISOString(),
      checkedBy: newPOData.checkedBy || '',
      computedBy: newPOData.computedBy || '',
      place: newPOData.place || 'Bandung',
      totalSamplesCount: 0,
      notes: newPOData.notes || '',
      samples: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    setPos(prev => [fullPO, ...prev]);

    // Automatically create a folder for this new PO in Windows File Explorer
    const newFolder: DocumentItem = {
      id: `f-${newId}`,
      poId: newId,
      name: `${fullPO.poNumber} (${fullPO.clientName.split(' ')[0]})`,
      type: 'folder',
      parentId: 'f-2026',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    setDocuments(prev => [...prev, newFolder]);
  };

  const handleUpdatePO = (updatedPO: PurchaseOrder) => {
    setPos(prev => prev.map(p => p.id === updatedPO.id ? updatedPO : p));
  };

  const handleDeletePO = (poId: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus Purchase Order ini? Semua data sampel dan dokumen terkait akan dihapus.')) {
      setPos(prev => prev.filter(p => p.id !== poId));
      setDocuments(prev => prev.filter(d => d.poId !== poId && d.id !== `f-${poId}`));
    }
  };

  // --- MANUAL STATUS TOGGLE (KLIK BERES WITH CUSTOM END TIME SUPPORT) ---
  const handleUpdateTestStatus = (poId: string, sampleId: string, testId: string, newStatus: TestStatus, customEndTime?: string) => {
    setPos(prev => prev.map(po => {
      if (po.id === poId) {
        const updatedSamples = po.samples.map(sample => {
          if (sample.id === sampleId) {
            const updatedTests = sample.tests.map(test => {
              if (test.id === testId) {
                return {
                  ...test,
                  status: newStatus,
                  startTime: newStatus === 'Sedang Diuji' && !test.startTime ? new Date().toISOString() : test.startTime,
                  endTime: newStatus === 'Selesai' ? (customEndTime || new Date().toISOString()) : test.endTime
                };
              }
              return test;
            });

            const allDone = updatedTests.every(t => t.status === 'Selesai' || t.status === 'Dibatalkan');
            const anyRunning = updatedTests.some(t => t.status === 'Sedang Diuji');

            let sampleStatus = sample.status;
            if (allDone) sampleStatus = 'Completed';
            else if (anyRunning) sampleStatus = 'In Progress';

            return {
              ...sample,
              status: sampleStatus,
              tests: updatedTests
            };
          }
          return sample;
        });

        // Check if ALL tests in ALL samples of this PO are completed
        let allPOTestsCount = 0;
        let completedPOTestsCount = 0;

        updatedSamples.forEach(s => {
          s.tests.forEach(t => {
            if (t.status !== 'Dibatalkan') {
              allPOTestsCount++;
              if (t.status === 'Selesai') completedPOTestsCount++;
            }
          });
        });

        const isPOFullyFinished = allPOTestsCount > 0 && completedPOTestsCount === allPOTestsCount;

        return {
          ...po,
          status: isPOFullyFinished ? 'Completed' : (po.status === 'Completed' ? 'Running' : po.status),
          samples: updatedSamples,
          updatedAt: new Date().toISOString()
        };
      }
      return po;
    }));
  };

  // --- CRUD HANDLERS FOR SAMPLES ---
  const handleAddSample = (poId: string, sampleData: Partial<Sample>) => {
    const newSampleId = `smp-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const newSample: Sample = {
      id: newSampleId,
      poId,
      sampleCode: sampleData.sampleCode || 'BH-NEW',
      reportNumber: sampleData.reportNumber || 'REP-2026-NEW',
      idLab: sampleData.idLab || `LAB-${Math.floor(100 + Math.random() * 900)}`,
      depthStart: sampleData.depthStart || 1.5,
      depthEnd: sampleData.depthEnd || 2.0,
      lithology: sampleData.lithology || '',
      soilType: sampleData.soilType || '',
      colourCode: sampleData.colourCode || 0,
      colourName: sampleData.colourName || 'Belum Dipilih',
      sampleType: sampleData.sampleType || '',
      testedBy: sampleData.testedBy || '',
      assignedTechnician: sampleData.testedBy || '',
      locationTag: sampleData.locationTag || 'Rak Cold-Room A-01',
      sampleDescription: sampleData.sampleDescription || '',
      status: 'Pending',
      createdAt: new Date().toISOString(),
      tests: sampleData.tests || []
    };

    setPos(prev => prev.map(po => {
      if (po.id === poId) {
        return {
          ...po,
          samples: [...po.samples, newSample],
          totalSamplesCount: po.samples.length + 1,
          updatedAt: new Date().toISOString()
        };
      }
      return po;
    }));
  };

  const handleUpdateSampleAssignedTests = (poId: string, sampleId: string, selectedTestCodes: string[]) => {
    setPos(prev => prev.map(po => {
      if (po.id === poId) {
        return {
          ...po,
          samples: po.samples.map(sample => {
            if (sample.id === sampleId) {
              const existingTests = sample.tests;

              const updatedTests: SampleTest[] = selectedTestCodes.map(code => {
                const found = existingTests.find(t => t.testTypeCode === code || t.testTypeId === code);
                if (found) return found;

                const master = MASTER_TEST_TYPES.find(m => m.code === code || m.id === code) || MASTER_TEST_TYPES[0];
                return {
                  id: `t-add-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
                  sampleId,
                  testTypeId: master.id,
                  testTypeName: master.name,
                  testTypeCode: code,
                  technicianName: sample.testedBy || '',
                  status: 'Belum Diuji',
                  estimatedDurationHours: master.defaultDurationHours || 24,
                  calculationStatus: 'Not Started'
                };
              });

              return {
                ...sample,
                tests: updatedTests
              };
            }
            return sample;
          })
        };
      }
      return po;
    }));
  };

  // --- BATCH IMPORT SAMPLES FROM EXCEL ---
  const handleImportExcelSamplesBatch = (poId: string, importedSamples: ExcelImportResult['samples']) => {
    const nowIso = new Date().toISOString();

    const createdSamples: Sample[] = importedSamples.map((s, idx) => {
      const sampleId = `smp-imp-${Date.now()}-${idx}`;

      const sampleTests: SampleTest[] = s.testCodesToAssign.map((code, tIdx) => {
        const master = MASTER_TEST_TYPES.find(m => m.code === code || m.id === code) || MASTER_TEST_TYPES[0];
        return {
          id: `t-imp-${Date.now()}-${idx}-${tIdx}`,
          sampleId,
          testTypeId: master.id,
          testTypeName: master.name,
          testTypeCode: master.code,
          technicianName: '',
          status: 'Belum Diuji',
          startTime: undefined,
          estimatedDurationHours: master.defaultDurationHours,
          calculationStatus: 'Not Started'
        };
      });

      return {
        id: sampleId,
        poId,
        sampleCode: s.sampleCode,
        reportNumber: `REP-2026-${s.idLab}`,
        idLab: s.idLab,
        depthStart: s.depthStart,
        depthEnd: s.depthEnd,
        lithology: s.lithology,
        soilType: s.soilType,
        colourCode: s.colourCode,
        colourName: s.colourName,
        sampleType: s.sampleType,
        testedBy: '',
        assignedTechnician: '',
        locationTag: 'Rak Cold-Room A-01',
        sampleDescription: `Imported from Excel with ${sampleTests.length} assigned tests.`,
        status: 'Pending',
        createdAt: nowIso,
        tests: sampleTests
      };
    });

    setPos(prev => prev.map(po => {
      if (po.id === poId) {
        return {
          ...po,
          samples: [...po.samples, ...createdSamples],
          totalSamplesCount: po.samples.length + createdSamples.length,
          updatedAt: nowIso
        };
      }
      return po;
    }));
  };

  // --- AUTO-GENERATE PO DARI BA PREPARASI SAMPEL ---
  // Mapping dari key SamplePrepTestEligible / TestCellDetail ke testTypeCode MASTER_TEST_TYPES (100% ISOLASI MANDIRI)
  const PREP_TEST_KEY_TO_CODE: Record<string, string> = {
    UW: 'UW',
    MC: 'MC',
    SG: 'SG',
    BD: 'UW',
    ATB: 'ATB',
    SieveHydro: 'Sieve-Hydro',
    'Sieve-Hydro': 'Sieve-Hydro',
    'Sieve_Hydro': 'Sieve-Hydro',
    'SVE-HYD': 'Sieve-Hydro',
    'S&H': 'Sieve-Hydro',
    'SVE': 'Sieve-Hydro',
    Proctor_Std: 'CMP-STD',
    Proctor_Mod: 'CMP-MOD',
    Permeability: 'PB',
    PB: 'PB',
    PRM: 'PB',
    PERM: 'PB',
    PFH: 'PB',
    Consolidation: 'CT',
    CT: 'CT',
    CNS: 'CT',
    UCT: 'UCT',
    DS_UU: 'DS-UU',
    'DS-UU': 'DS-UU',
    DS_CU: 'DS-CU',
    'DS-CU': 'DS-CU',
    DS_CD: 'DS-CD',
    'DS-CD': 'DS-CD',
    DS_Res: 'DS-CDR',
    'DS-CDR': 'DS-CDR',
    'DS-RES': 'DS-CDR',
    TRX_UU: 'TRX-UU',
    'TRX-UU': 'TRX-UU',
    TRX_CU: 'TRX-CU',
    'TRX-CU': 'TRX-CU',
    TRX_CD: 'TRX-CD',
    'TRX-CD': 'TRX-CD',
    CBR_Unsoaked: 'CBR-UNS',
    'CBR-UNS': 'CBR-UNS',
    CBR_Soaked: 'CBR-SOK',
    'CBR-SOK': 'CBR-SOK',
    PointLoad: 'UCT',
    UCS_Rock: 'UCT'
  };

  const handleSyncPOFromPrepReport = (prepReport: SamplePrepReport) => {
    setIsSyncingAtomGlobal(true);
    setSyncAtomDetails({
      title: 'MENYSINKRONKAN BA PREPARASI...',
      subtitle: `Atomic Data Sync & PO Matrix Validation (${prepReport.prepReportNo})`
    });

    const nowIso = new Date().toISOString();
    const newPoId = `po-ba-${prepReport.id}-${Date.now()}`;

    // Tentukan sampel yang layak diuji
    // Debug: log semua items untuk diagnosa
    console.log('[Sync PO] BA Preparasi items:', prepReport.items.map(i => ({
      code: i.sampleCode,
      condition: i.sampleCondition,
      testStatusDetails: i.testStatusDetails,
      testEligible: i.testEligible,
      status: i.status
    })));

    const eligibleItems = prepReport.items.filter(item => {
      // Selalu skip jika tidak diuji atau sampel kurang
      if (item.sampleCondition === 'UNTESTED') return false;
      if (item.sampleCondition === 'INSUFFICIENT') return false;

      // Jika ada testStatusDetails yang terisi, cek apakah ada PASS atau SUBCONTRACT
      if (item.testStatusDetails && Object.keys(item.testStatusDetails).length > 0) {
        const hasPassOrSub = Object.values(item.testStatusDetails).some(
          cell => cell.status === 'PASS' || cell.status === 'SUBCONTRACT'
        );
        // Jika semua NP/CANCEL/INSUFFICIENT, skip sampel ini
        if (!hasPassOrSub) return false;
        return true;
      }

      // Jika testEligible ada dan ada yang true, eligible
      const eligible = item.testEligible;
      if (eligible && Object.values(eligible).some(v => v === true)) return true;

      // FALLBACK: Jika sampleCondition adalah NORMAL atau ROCK dan tidak ada filter detail,
      // anggap eligible (sampel dipreparasi, test akan ditentukan kemudian)
      if (item.sampleCondition === 'NORMAL' || item.sampleCondition === 'ROCK' ||
          item.sampleCondition === 'SUBCONTRACT') {
        return true;
      }

      return false;
    });

    console.log('[Sync PO] Eligible items:', eligibleItems.length, 'dari', prepReport.items.length, 'total');

    if (eligibleItems.length === 0) {
      setIsSyncingAtomGlobal(false);
      showGlobalToast(`⚠️ Tidak ada sampel yang eligible untuk di-sync ke PO dari BA Preparasi "${prepReport.prepReportNo}".`);
      return;
    }

    const createdSamples: Sample[] = eligibleItems.map((item, idx) => {
      const sampleId = `smp-ba-${prepReport.id}-${idx}-${Date.now()}`;
      const eligibleTestCodes: string[] = [];

      if (item.testStatusDetails && Object.keys(item.testStatusDetails).length > 0) {
        Object.entries(item.testStatusDetails).forEach(([rawKey, cell]) => {
          if (cell.status === 'PASS' || cell.status === 'SUBCONTRACT') {
            const mappedCode = PREP_TEST_KEY_TO_CODE[rawKey] || rawKey;
            const masterMatch = MASTER_TEST_TYPES.find(m => m.code === mappedCode || m.code === rawKey || m.id === rawKey);
            const finalCode = masterMatch ? masterMatch.code : mappedCode;
            if (!eligibleTestCodes.includes(finalCode)) eligibleTestCodes.push(finalCode);
          }
        });
      } else {
        const eligible = item.testEligible || {};
        Object.entries(eligible).forEach(([key, val]) => {
          if (val === true) {
            const mappedCode = PREP_TEST_KEY_TO_CODE[key] || key;
            const masterMatch = MASTER_TEST_TYPES.find(m => m.code === mappedCode);
            const finalCode = masterMatch ? masterMatch.code : mappedCode;
            if (!eligibleTestCodes.includes(finalCode)) eligibleTestCodes.push(finalCode);
          }
        });
      }

      const sampleTests: SampleTest[] = eligibleTestCodes.map((code, tIdx) => {
        const master = MASTER_TEST_TYPES.find(m => m.code === code) || MASTER_TEST_TYPES[0];
        let isSubcontract = false;
        if (item.testStatusDetails) {
          const matchEntry = Object.entries(item.testStatusDetails).find(([rawKey]) => {
            const mappedCode = PREP_TEST_KEY_TO_CODE[rawKey] || rawKey;
            const masterMatch = MASTER_TEST_TYPES.find(m => m.code === mappedCode || m.code === rawKey);
            return (masterMatch ? masterMatch.code : mappedCode) === code;
          });
          if (matchEntry && matchEntry[1].status === 'SUBCONTRACT') isSubcontract = true;
        }
        return {
          id: `t-ba-${prepReport.id}-${idx}-${tIdx}-${Date.now()}`,
          sampleId,
          testTypeId: master.id,
          testTypeName: master.name,
          testTypeCode: master.code,
          technicianName: '',
          status: 'Belum Diuji' as const,
          startTime: undefined,
          estimatedDurationHours: master.defaultDurationHours,
          calculationStatus: 'Not Started' as const,
          cancellationReason: isSubcontract ? '[SUBCONTRACT] Dialihkan ke Lab Rekanan' : undefined
        };
      });

      const rawDepth = item.depthStr || '';
      const depthParts = rawDepth.replace(/,/g, '.').split('-');
      const depthStart = parseFloat(depthParts[0]?.trim() || '0') || 0;
      const depthEnd = parseFloat(depthParts[1]?.trim() || '0') || depthStart + 0.5;

      return {
        id: sampleId,
        poId: newPoId,
        sampleCode: item.sampleCode,
        reportNumber: `REP-${new Date().getFullYear()}-BA-${(idx + 1).toString().padStart(3, '0')}`,
        idLab: `LAB-BA-${prepReport.id.slice(-4)}-${(idx + 1).toString().padStart(3, '0')}`,
        depthStart,
        depthEnd,
        lithology: item.sampleCondition === 'ROCK' ? 'Batuan' : '',
        soilType: item.sampleCondition === 'ROCK' ? 'Batuan / Rock Sample' : '',
        colourCode: 0,
        colourName: '',
        sampleType: item.sampleCondition === 'ROCK' ? 'Rock Sample' : '',
        testedBy: '',
        assignedTechnician: '',
        locationTag: 'Rak Cold-Room A-01',
        sampleDescription: `[Dari BA Preparasi ${prepReport.prepReportNo}] ${item.description || '-'}`,
        status: 'Pending' as const,
        createdAt: nowIso,
        tests: sampleTests
      };
    });

    const newPO: PurchaseOrder = {
      id: newPoId,
      poNumber: prepReport.poNumber || `PO-BA-${Date.now()}`,
      clientName: prepReport.clientName,
      clientAddress: '', // Kosongkan, belum ada info
      projectName: prepReport.projectName,
      projectLocation: prepReport.projectLocation || '',
      status: 'Running',
      startDate: nowIso,
      deadline: '', // Kosongkan deadline karena di-sync dari BA Preparasi
      sampleArrivalDate: '', // Kosongkan
      listReceivedDate: '', // Kosongkan
      preparationStartDate: prepReport.date || nowIso,
      testingStartDate: '', // Kosongkan
      checkedBy: '',
      computedBy: '', // Kosongkan
      place: 'Bandung',
      totalSamplesCount: createdSamples.length,
      notes: `[Auto-generated dari BA Preparasi: ${prepReport.prepReportNo}]\nSampel diterima: ${prepReport.numSampleReceived} | Dipreparasi: ${prepReport.numSamplePrep} | Eligible untuk diuji: ${createdSamples.length}.`,
      samples: createdSamples,
      createdAt: nowIso,
      updatedAt: nowIso
    };

    setPos(prev => {
      const existingIdx = prev.findIndex(p => p.poNumber === prepReport.poNumber);
      if (existingIdx >= 0) {
        const existingPO = prev[existingIdx];
        
        // Perbarui daftar uji setiap sampel sesuai BA Preparasi secara presisi
        const updatedSamples = createdSamples.map(created => {
          const existingSample = existingPO.samples.find(s => s.sampleCode === created.sampleCode || (s.idLab && s.idLab === created.idLab));
          if (existingSample) {
            const mergedTests = created.tests.map(newTest => {
              const newNorm = normalizeTestCode(newTest.testTypeCode || newTest.testTypeId || '');
              const prevTest = existingSample.tests.find(pt => {
                const prevNorm = normalizeTestCode(pt.testTypeCode || pt.testTypeId || '');
                return prevNorm === newNorm;
              });
              if (prevTest) {
                return {
                  ...prevTest,
                  testTypeCode: newTest.testTypeCode,
                  testTypeName: newTest.testTypeName,
                  calculationData: prevTest.calculationData || newTest.calculationData
                };
              }
              return newTest;
            });

            return {
              ...existingSample,
              depthStart: created.depthStart,
              depthEnd: created.depthEnd,
              tests: mergedTests
            };
          }
          return created;
        });

        const updated = [...prev];
        updated[existingIdx] = {
          ...existingPO,
          samples: updatedSamples,
          totalSamplesCount: updatedSamples.length,
          updatedAt: nowIso
        };
        return updated;
      }
      return [newPO, ...prev];
    });

    setDocuments(prev => {
      const folderNamePrefix = prepReport.poNumber || newPO.poNumber;
      const alreadyExists = prev.some(d =>
        d.poId === newPoId ||
        (d.name && d.name.toLowerCase().startsWith(folderNamePrefix.toLowerCase()))
      );
      if (alreadyExists) return deduplicateDocuments(prev);
      const newFolder: DocumentItem = {
        id: `f-${newPoId}`,
        poId: newPoId,
        name: `${newPO.poNumber} (${newPO.clientName.split(' ').slice(0, 2).join(' ')})`,
        type: 'folder',
        parentId: 'f-2026',
        createdAt: nowIso,
        updatedAt: nowIso
      };
      return deduplicateDocuments([...prev, newFolder]);
    });

    setSamplePrepReports(prev => prev.map(r =>
      r.id === prepReport.id ? { ...r, syncedToPoId: newPoId, syncedAt: nowIso } : r
    ));

    const totalTests = createdSamples.reduce((sum, s) => sum + s.tests.length, 0);

    setTimeout(() => {
      setIsSyncingAtomGlobal(false);
      setActiveTab('po_management');
      showGlobalToast(`✓ Berhasil! ${createdSamples.length} sampel (${totalTests} uji) dari BA Preparasi "${prepReport.prepReportNo}" telah disinkronkan ke PO "${newPO.poNumber}".`);
    }, 1100);
  };

  const handleUpdateSample = (poId: string, sampleId: string, sampleData: Partial<Sample>) => {
    setPos(prev => prev.map(po => {
      if (po.id === poId) {
        return {
          ...po,
          samples: po.samples.map(s => s.id === sampleId ? { ...s, ...sampleData } : s)
        };
      }
      return po;
    }));
  };

  const handleDeleteSample = (poId: string, sampleId: string) => {
    setPos(prev => prev.map(po => {
      if (po.id === poId) {
        return {
          ...po,
          samples: po.samples.filter(s => s.id !== sampleId)
        };
      }
      return po;
    }));
  };

  // --- TEST ASSIGNMENT & REPLACEMENT ---
  const handleAddTestToSample = (poId: string, sampleId: string, testTypeId: string, durationHours: number, technician: string) => {
    const master = MASTER_TEST_TYPES.find(t => t.id === testTypeId);
    if (!master) return;

    const newTest: SampleTest = {
      id: `t-${Date.now()}`,
      sampleId,
      testTypeId: master.id,
      testTypeName: master.name,
      testTypeCode: master.code,
      technicianName: technician,
      status: 'Belum Diuji',
      startTime: undefined,
      estimatedDurationHours: durationHours || master.defaultDurationHours,
      calculationStatus: 'Not Started'
    };

    setPos(prev => prev.map(po => {
      if (po.id === poId) {
        return {
          ...po,
          samples: po.samples.map(s => {
            if (s.id === sampleId) {
              return {
                ...s,
                tests: [...s.tests, newTest]
              };
            }
            return s;
          })
        };
      }
      return po;
    }));
  };

  const handleReplaceTest = (poId: string, sampleId: string, testId: string, newTestTypeId: string, reason: string) => {
    const newMaster = MASTER_TEST_TYPES.find(t => t.id === newTestTypeId);
    if (!newMaster) return;

    setPos(prev => prev.map(po => {
      if (po.id === poId) {
        return {
          ...po,
          samples: po.samples.map(s => {
            if (s.id === sampleId) {
              return {
                ...s,
                tests: s.tests.map(t => {
                  if (t.id === testId) {
                    return {
                      ...t,
                      testTypeId: newMaster.id,
                      testTypeName: newMaster.name,
                      testTypeCode: newMaster.code,
                      status: 'Belum Diuji',
                      notes: `Replaced from original test. Reason: ${reason}`
                    };
                  }
                  return t;
                })
              };
            }
            return s;
          })
        };
      }
      return po;
    }));
  };

  const handleMoveSample = (poId: string, sampleId: string, newTechnician: string, newLocationTag: string) => {
    setPos(prev => prev.map(po => {
      const isPOMatch = po.id === poId || 
                        po.poNumber === poId || 
                        (po.id && po.id.toLowerCase() === poId.toLowerCase()) || 
                        (po.poNumber && po.poNumber.toLowerCase() === poId.toLowerCase());

      if (isPOMatch) {
        return {
          ...po,
          samples: po.samples.map(s => {
            const isSampleMatch = s.id === sampleId || 
                                  s.sampleCode === sampleId || 
                                  s.idLab === sampleId || 
                                  (s.id && s.id.toLowerCase() === sampleId.toLowerCase()) ||
                                  (s.sampleCode && s.sampleCode.toLowerCase() === sampleId.toLowerCase()) ||
                                  (s.idLab && s.idLab.toLowerCase() === sampleId.toLowerCase());

            if (isSampleMatch) {
              return {
                ...s,
                testedBy: newTechnician,
                assignedTechnician: newTechnician,
                locationTag: newLocationTag,
                tests: (s.tests || []).map(t => ({
                  ...t,
                  technicianName: newTechnician,
                  assignedTechnician: newTechnician,
                }))
              };
            }
            return s;
          })
        };
      }
      return po;
    }));
  };

  // --- DOCUMENT EXPLORER HANDLERS ---
  const handleCreateFolder = (name: string, parentId: string | null) => {
    const newDoc: DocumentItem = {
      id: `doc-${Date.now()}`,
      name,
      type: 'folder',
      parentId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    setDocuments(prev => [...prev, newDoc]);
  };

  const handleCreateFile = (name: string, ext: string, size: number, mime: string, parentId: string | null) => {
    const newDoc: DocumentItem = {
      id: `doc-${Date.now()}`,
      name,
      type: 'file',
      fileExtension: ext,
      fileSize: size,
      mimeType: mime,
      parentId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    setDocuments(prev => [...prev, newDoc]);
  };

  const handleDeleteDoc = (docId: string) => {
    setDocuments(prev => prev.filter(d => d.id !== docId && d.parentId !== docId));
  };

  const handleRenameDoc = (docId: string, newName: string) => {
    setDocuments(prev => prev.map(d => d.id === docId ? { ...d, name: newName, updatedAt: new Date().toISOString() } : d));
  };

  const handleResetLocalData = () => {
    localStorage.removeItem('ansa_lab_pos');
    localStorage.removeItem('ansa_lab_docs');
    setPos(INITIAL_POS);
    setDocuments(INITIAL_DOCUMENTS);
  };

  const handleOpenCalculationModal = (test: SampleTest, sample: Sample, po: PurchaseOrder) => {
    setSelectedPOId(po.id);
    setSelectedSampleId(sample.id);
    setActiveTab('pp_worksheet');
  };

  const handleSaveSampleCalculation = (poId: string, sampleId: string, summaryData: any) => {
    setPos(prev => {
      let poExists = prev.some(p => p.id === poId || (poId === 'po-sandbox-all-in-one' && (p.id === 'po-sandbox-all-in-one' || p.poNumber === 'PO-SANDBOX-TEST')));

      let baseList = prev;
      if (!poExists && (poId === 'po-sandbox-all-in-one' || poId === 'PO-SANDBOX-TEST')) {
        const defaultSandboxPO: PurchaseOrder = {
          id: 'po-sandbox-all-in-one',
          poNumber: 'PO-SANDBOX-TEST',
          clientName: 'PT. Terraforma Geoteknik Indonesia (Mode Uji Coba Rumus)',
          clientAddress: 'Jl. Geoteknik No. 1, Bandung',
          projectName: 'Eksperimen & Validasi Semua Rumus Pengujian Laboratorium',
          projectLocation: 'Laboratorium Mekanika Tanah Utama',
          status: 'Running',
          startDate: new Date().toISOString(),
          deadline: '',
          sampleArrivalDate: new Date().toISOString(),
          listReceivedDate: new Date().toISOString(),
          preparationStartDate: new Date().toISOString(),
          testingStartDate: new Date().toISOString(),
          checkedBy: '',
          computedBy: '',
          place: 'Bandung',
          totalSamplesCount: 1,
          notes: '[SANDBOX PLAYGROUND] PO uji coba otomatis untuk mengetes akurasi semua rumus perhitungannya.',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          samples: [
            {
              id: 'smp-sandbox-01',
              poId: 'po-sandbox-all-in-one',
              sampleCode: 'BH-SANDBOX (0.00-1.00m)',
              reportNumber: 'REP-2026-SANDBOX-01',
              idLab: 'LAB-SANDBOX-TEST',
              depthStart: 0,
              depthEnd: 1,
              lithology: 'NP',
              soilType: 'Sampel Eksperimen All-in-One',
              colourCode: 1,
              colourName: 'Cokelat / Brown',
              sampleType: 'Undisturbed Sample / UDS',
              testedBy: '',
              assignedTechnician: '',
              locationTag: 'Rak Cold-Room Sandbox',
              sampleDescription: 'Sampel uji coba untuk menguji semua 22 formulir rumus lab.',
              status: 'Pending',
              createdAt: new Date().toISOString(),
              tests: [
                'PP','SG','MC','UW','ATB','SVE-HYD','PRM','CT','UCT',
                'CMP-STD','CMP-MOD','TRX-UU','DS-UU','DS-CD','DS-CD-RES',
                'TRX-CU','TRX-CD','CBR-UNS','CBR-SOK','PLI','UCS-ROCK'
              ].map((code, idx) => ({
                id: `t-sandbox-${code.toLowerCase()}-${idx}`,
                sampleId: 'smp-sandbox-01',
                testTypeId: `tt-${code.toLowerCase()}`,
                testTypeName: `Pengujian ${code}`,
                testTypeCode: code,
                technicianName: '',
                status: 'Belum Diuji',
                estimatedDurationHours: 24,
                calculationStatus: 'Not Started'
              }))
            }
          ]
        };
        baseList = [defaultSandboxPO, ...prev];
      }

      return baseList.map(p => {
        const isPOMatch = p.id === poId || 
                          p.poNumber === poId || 
                          (p.id && p.id.toLowerCase() === poId.toLowerCase()) || 
                          (p.poNumber && p.poNumber.toLowerCase() === poId.toLowerCase()) ||
                          (poId === 'po-sandbox-all-in-one' && (p.id === 'po-sandbox-all-in-one' || p.poNumber === 'PO-SANDBOX-TEST'));

        if (isPOMatch) {
          return {
            ...p,
            samples: p.samples.map(s => {
              const isSampleMatch = s.id === sampleId || 
                                    s.sampleCode === sampleId || 
                                    s.idLab === sampleId || 
                                    (s.id && s.id.toLowerCase() === sampleId.toLowerCase()) ||
                                    (s.sampleCode && s.sampleCode.toLowerCase() === sampleId.toLowerCase()) ||
                                    (s.idLab && s.idLab.toLowerCase() === sampleId.toLowerCase()) ||
                                    (poId === 'po-sandbox-all-in-one' && s.id === 'smp-sandbox-01');

              if (isSampleMatch) {
                const activeNormSubTab = normalizeTestCode(summaryData.activeTestSubTab || 'PP');

                // Determine target codes for this subtab
                let targetCodes = [activeNormSubTab];
                if (activeNormSubTab === 'PP') {
                  targetCodes = ['SG', 'MC', 'UW', 'PP'];
                }

                let updatedTests = [...s.tests];

                // Ensure every target test code is updated or added
                targetCodes.forEach(targetCode => {
                  const existingIndex = updatedTests.findIndex(t => {
                    const norm = normalizeTestCode(t.testTypeCode || t.testTypeId || '');
                    return norm === targetCode;
                  });

                  if (existingIndex >= 0) {
                    // Update existing test
                    const t = updatedTests[existingIndex];
                    const existingInputs = t.calculationData?.inputValues || {};
                    const mergedInputs = { ...existingInputs, ...summaryData };

                    let isComplete = false;
                    let hasData = false;

                    const normTCode = normalizeTestCode(t.testTypeCode || t.testTypeId || '');
                    if (normTCode === 'SG') {
                      const hasA1 = parseFloat(mergedInputs.sgA1 || 0) > 0;
                      const hasB1 = parseFloat(mergedInputs.sgB1 || 0) > 0;
                      const hasA2 = parseFloat(mergedInputs.sgA2 || 0) > 0;
                      const hasB2 = parseFloat(mergedInputs.sgB2 || 0) > 0;
                      const gs = parseFloat(mergedInputs.gsAvg || 0);
                      isComplete = (gs > 0 || (hasA1 && hasB1)) && (hasA2 ? hasB2 : true);
                      hasData = hasA1 || hasB1 || hasA2 || hasB2;
                    } else if (normTCode === 'MC') {
                      const hasWet1 = parseFloat(mergedInputs.mcWet1 || 0) > 0;
                      const hasDry1 = parseFloat(mergedInputs.mcDry1 || 0) > 0;
                      const hasWet2 = parseFloat(mergedInputs.mcWet2 || 0) > 0;
                      const hasDry2 = parseFloat(mergedInputs.mcDry2 || 0) > 0;
                      const mc = parseFloat(mergedInputs.mcAvg || 0);
                      isComplete = (mc > 0 || (hasWet1 && hasDry1)) && (hasWet2 ? hasDry2 : true);
                      hasData = hasWet1 || hasDry1 || hasWet2 || hasDry2;
                    } else if (normTCode === 'UW') {
                      const hasWetSoil = parseFloat(mergedInputs.ringWetWeight || 0) > 0;
                      const bulk = parseFloat(mergedInputs.bulkDensity || 0);
                      isComplete = bulk > 0 && hasWetSoil;
                      hasData = hasWetSoil;
                    } else if (normTCode === 'PP') {
                      const hasSG = parseFloat(mergedInputs.sgA1 || 0) > 0 && parseFloat(mergedInputs.sgB1 || 0) > 0;
                      const hasMC = parseFloat(mergedInputs.mcWet1 || 0) > 0 && parseFloat(mergedInputs.mcDry1 || 0) > 0;
                      const hasUW = parseFloat(mergedInputs.ringWetWeight || 0) > 0;
                      isComplete = hasSG && hasMC && hasUW;
                      hasData = hasSG || hasMC || hasUW;
                    } else if (['ATB', 'ATT'].includes(normTCode)) {
                      const blows = Array.isArray(mergedInputs.atbBlows) ? mergedInputs.atbBlows.filter((v: string) => v !== '' && parseFloat(v) > 0) : [];
                      const plWet = Array.isArray(mergedInputs.atbPlWet) ? mergedInputs.atbPlWet.filter((v: string) => v !== '' && parseFloat(v) > 0) : [];
                      const ll = parseFloat(mergedInputs.computedLL || 0);
                      const pl = parseFloat(mergedInputs.computedPL || 0);
                      isComplete = ll > 0 && pl > 0 && blows.length >= 3 && plWet.length >= 2;
                      hasData = blows.length > 0 || plWet.length > 0 || ll > 0;
                    } else if (['SVE-HYD', 'S&H', 'SVE'].includes(normTCode)) {
                      const hasSieve = Array.isArray(mergedInputs.shSieveRetained) && mergedInputs.shSieveRetained.filter((v: string) => v !== '' && parseFloat(v) > 0).length >= 3;
                      const hasHydro = Array.isArray(mergedInputs.shHydroReadings) && mergedInputs.shHydroReadings.filter((v: string) => v !== '' && parseFloat(v) > 0).length >= 3;
                      isComplete = hasSieve || hasHydro;
                      hasData = (Array.isArray(mergedInputs.shSieveRetained) && mergedInputs.shSieveRetained.some((v: string) => v !== '' && parseFloat(v) > 0)) ||
                                (Array.isArray(mergedInputs.shHydroReadings) && mergedInputs.shHydroReadings.some((v: string) => v !== '' && parseFloat(v) > 0));
                    } else if (normTCode === 'DS-UU' || normTCode === 'DS') {
                      const normalLoads = mergedInputs.dsUuNormalLoads || mergedInputs.dsNormalLoads || [];
                      const wetSoil = mergedInputs.dsUuWetSoilPlusRing || mergedInputs.dsWetSoilPlusRing || [];
                      const dialA = mergedInputs.dsUuDialReadingsA || mergedInputs.dsDialReadingsA || [];
                      const dialB = mergedInputs.dsUuDialReadingsB || mergedInputs.dsDialReadingsB || [];
                      const dialC = mergedInputs.dsUuDialReadingsC || mergedInputs.dsDialReadingsC || [];

                      const hasLoadsAll = Array.isArray(normalLoads) && normalLoads.length >= 3 && normalLoads.slice(0, 3).every((v: any) => parseFloat(v) > 0);
                      const hasWetSoilAll = Array.isArray(wetSoil) && wetSoil.length >= 3 && wetSoil.slice(0, 3).every((v: any) => parseFloat(v) > 0);
                      const hasDialsAll = (Array.isArray(dialA) && dialA.some((v: any) => parseFloat(v) > 0)) &&
                                          (Array.isArray(dialB) && dialB.some((v: any) => parseFloat(v) > 0)) &&
                                          (Array.isArray(dialC) && dialC.some((v: any) => parseFloat(v) > 0));
                      const maxA = parseFloat(mergedInputs.dsMaxShearA || 0);
                      const maxB = parseFloat(mergedInputs.dsMaxShearB || 0);
                      const maxC = parseFloat(mergedInputs.dsMaxShearC || 0);

                      isComplete = hasLoadsAll && hasWetSoilAll && hasDialsAll && maxA > 0 && maxB > 0 && maxC > 0;
                      hasData = (Array.isArray(normalLoads) && normalLoads.some((v: any) => parseFloat(v) > 0)) ||
                                (Array.isArray(wetSoil) && wetSoil.some((v: any) => parseFloat(v) > 0)) ||
                                (Array.isArray(dialA) && dialA.some((v: any) => parseFloat(v) > 0)) ||
                                maxA > 0;
                    } else if (normTCode === 'DS-CD' || normTCode === 'DS-CU') {
                      const normalLoads = mergedInputs.dsCdNormalLoads || mergedInputs.dsNormalLoads || [];
                      const dialA = mergedInputs.dsCdDialReadingsA || mergedInputs.dsDialReadingsA || [];
                      const dialB = mergedInputs.dsCdDialReadingsB || mergedInputs.dsDialReadingsB || [];
                      const dialC = mergedInputs.dsCdDialReadingsC || mergedInputs.dsDialReadingsC || [];

                      const hasLoadsAll = Array.isArray(normalLoads) && normalLoads.length >= 3 && normalLoads.slice(0, 3).every((v: any) => parseFloat(v) > 0);
                      const hasDialsAll = (Array.isArray(dialA) && dialA.some((v: any) => parseFloat(v) > 0)) &&
                                          (Array.isArray(dialB) && dialB.some((v: any) => parseFloat(v) > 0)) &&
                                          (Array.isArray(dialC) && dialC.some((v: any) => parseFloat(v) > 0));
                      isComplete = hasLoadsAll && hasDialsAll;
                      hasData = (Array.isArray(normalLoads) && normalLoads.some((v: any) => parseFloat(v) > 0)) ||
                                (Array.isArray(dialA) && dialA.some((v: any) => parseFloat(v) > 0));
                    } else if (normTCode === 'DS-CD-RES') {
                      const normalLoads = mergedInputs.dsCdResNormalLoads || mergedInputs.dsNormalLoads || [];
                      const resA = mergedInputs.dsResResidualReadingsA || [];
                      const resB = mergedInputs.dsResResidualReadingsB || [];
                      const resC = mergedInputs.dsResResidualReadingsC || [];

                      const hasLoadsAll = Array.isArray(normalLoads) && normalLoads.length >= 3 && normalLoads.slice(0, 3).every((v: any) => parseFloat(v) > 0);
                      const hasResAll = (Array.isArray(resA) && resA.some((v: any) => parseFloat(v) > 0)) &&
                                        (Array.isArray(resB) && resB.some((v: any) => parseFloat(v) > 0)) &&
                                        (Array.isArray(resC) && resC.some((v: any) => parseFloat(v) > 0));
                      isComplete = hasLoadsAll && hasResAll;
                      hasData = (Array.isArray(normalLoads) && normalLoads.some((v: any) => parseFloat(v) > 0)) ||
                                (Array.isArray(resA) && resA.some((v: any) => parseFloat(v) > 0));
                    } else if (['PRM', 'PB'].includes(normTCode)) {
                      const hasH2 = Array.isArray(mergedInputs.prmH2) && mergedInputs.prmH2.some((v: string) => v !== '' && parseFloat(v) > 0);
                      const k = parseFloat(mergedInputs.prmKAvg || 0);
                      isComplete = k > 0 && hasH2;
                      hasData = hasH2 || (Array.isArray(mergedInputs.prmTime) && mergedInputs.prmTime.some((v: string) => v !== ''));
                    } else if (['TRX-UU', 'TRX'].includes(normTCode)) {
                      const loadA = mergedInputs.trxLoadReadingsA || [];
                      const loadB = mergedInputs.trxLoadReadingsB || [];
                      const loadC = mergedInputs.trxLoadReadingsC || [];
                      const hasLoadsAll = (Array.isArray(loadA) && loadA.some((v: any) => parseFloat(v) > 0)) &&
                                          (Array.isArray(loadB) && loadB.some((v: any) => parseFloat(v) > 0)) &&
                                          (Array.isArray(loadC) && loadC.some((v: any) => parseFloat(v) > 0));
                      const devA = parseFloat(mergedInputs.trxMaxDevStressA || 0);
                      isComplete = hasLoadsAll && devA > 0;
                      hasData = (Array.isArray(loadA) && loadA.some((v: any) => parseFloat(v) > 0)) || devA > 0;
                    } else if (['CT', 'CNS', 'Consol'].includes(normTCode)) {
                      const dial24 = mergedInputs.consolDial24h || [];
                      const hasDialAll = Array.isArray(dial24) && dial24.filter((v: any) => parseFloat(v) > 0).length >= 5;
                      const pc = parseFloat(mergedInputs.consolPc || 0);
                      isComplete = pc > 0 && hasDialAll;
                      hasData = (Array.isArray(dial24) && dial24.some((v: any) => parseFloat(v) > 0)) || pc > 0;
                    } else if (normTCode === 'UCT') {
                      const dials = mergedInputs.uctDialForceUds || [];
                      const validDials = Array.isArray(dials) ? dials.filter((v: string) => v !== '' && parseFloat(v) > 0).length : 0;
                      const qu = parseFloat(mergedInputs.uctQuUds || 0);
                      isComplete = qu > 0 && validDials >= 5;
                      hasData = validDials > 0 || qu > 0;
                    } else if (['CMP', 'CMP-STD', 'CMP-MOD', 'PROCTOR'].includes(normTCode)) {
                      const cans = mergedInputs.cmpCanWetSoil || [];
                      const validCans = Array.isArray(cans) ? cans.filter((v: string) => v !== '' && parseFloat(v) > 0).length : 0;
                      const mdd = parseFloat(mergedInputs.cmpMdd || 0);
                      const omc = parseFloat(mergedInputs.cmpOmc || 0);
                      isComplete = mdd > 0 && omc > 0 && validCans >= 4;
                      hasData = validCans > 0 || mdd > 0;
                    } else {
                      hasData = (mergedInputs && Object.values(mergedInputs).some((v: any) => parseFloat(v) > 0));
                      isComplete = hasData;
                    }

                    updatedTests[existingIndex] = {
                      ...t,
                      status: isComplete ? ('Selesai' as const) : hasData ? ('Sedang Diuji' as const) : t.status,
                      calculationStatus: isComplete ? ('Calculated' as const) : hasData ? ('Draft Data' as const) : t.calculationStatus,
                      technicianName: summaryData.testedBy || t.technicianName || '',
                      checkerName: summaryData.checkedBy || t.checkerName || '',
                      approverName: summaryData.approvedBy || t.approverName || '',
                      dateTested: summaryData.dateTested || t.dateTested || '',
                      dateTestedEnd: summaryData.dateTestedEnd || t.dateTestedEnd || '',
                      calculationData: {
                        ...(t.calculationData || {}),
                        inputValues: mergedInputs,
                        summaryResults: hasData ? { ...(t.calculationData?.summaryResults || {}), ...summaryData } : {}
                      }
                    };
                  } else {
                    // Create missing test entry automatically
                    const masterMatch = MASTER_TEST_TYPES.find(m => normalizeTestCode(m.code || m.id) === targetCode) || {
                      id: `tt-${targetCode.toLowerCase()}`,
                      name: `Pengujian ${targetCode}`,
                      code: targetCode,
                      defaultDurationHours: 24
                    };

                    const newTest: SampleTest = {
                      id: `t-auto-${targetCode.toLowerCase()}-${Date.now()}`,
                      sampleId: s.id,
                      testTypeId: masterMatch.id,
                      testTypeName: masterMatch.name,
                      testTypeCode: masterMatch.code,
                      technicianName: summaryData.testedBy || s.testedBy || '',
                      checkerName: summaryData.checkedBy || s.checkedBy || '',
                      approverName: summaryData.approvedBy || s.approvedBy || '',
                      dateTested: summaryData.dateTested || s.dateTested || '',
                      dateTestedEnd: summaryData.dateTestedEnd || s.dateTestedEnd || '',
                      status: 'Sedang Diuji',
                      calculationStatus: 'Draft Data',
                      calculationData: {
                        inputValues: { ...summaryData },
                        summaryResults: { ...summaryData }
                      }
                    };
                    updatedTests.push(newTest);
                  }
                });

                return {
                  ...s,
                  testedBy: summaryData.testedBy || s.testedBy,
                  checkedBy: summaryData.checkedBy || s.checkedBy,
                  approvedBy: summaryData.approvedBy || s.approvedBy,
                  dateTested: summaryData.dateTested || s.dateTested,
                  dateTestedEnd: summaryData.dateTestedEnd || s.dateTestedEnd,
                  assignedTechnician: summaryData.testedBy || s.assignedTechnician,
                  tests: updatedTests,
                  updatedAt: new Date().toISOString()
                };
              }
              return s;
            })
          };
        }
        return p;
      });

      safeSetLocalStorage('ansa_lab_pos', nextPOs);
      return nextPOs;
    });
  };

  const handleUpdateSamplePersonnel = (poId: string, sampleId: string, testCode: string, technicianName: string) => {
    setPos(prevPOs => {
      const normPoId = (poId || '').trim().toLowerCase();
      const normSampleId = (sampleId || '').trim().toLowerCase();
      const normTestCode = normalizeTestCode(testCode || 'PP');

      const nextPOs = prevPOs.map(p => {
        if (p.id.toLowerCase() === normPoId || (p.poNumber && p.poNumber.toLowerCase() === normPoId)) {
          return {
            ...p,
            samples: p.samples.map(s => {
              if (s.id.toLowerCase() === normSampleId || (s.sampleCode && s.sampleCode.toLowerCase() === normSampleId) || (s.idLab && s.idLab.toLowerCase() === normSampleId)) {
                const updatedTests = (s.tests || []).map(t => {
                  const tNorm = normalizeTestCode(t.testTypeCode || t.testTypeId || '');
                  const isMatch = normTestCode === 'PP' ? ['SG', 'MC', 'UW', 'PP'].includes(tNorm) : tNorm === normTestCode;
                  if (isMatch) {
                    return {
                      ...t,
                      technicianName,
                      assignedTechnician: technicianName,
                    };
                  }
                  return t;
                });

                return {
                  ...s,
                  testedBy: technicianName || s.testedBy,
                  assignedTechnician: technicianName || s.assignedTechnician,
                  tests: updatedTests,
                  updatedAt: new Date().toISOString()
                };
              }
              return s;
            })
          };
        }
        return p;
      });

      safeSetLocalStorage('ansa_lab_pos', nextPOs);
      return nextPOs;
    });
  };

  // Guest Book Online Self Check-in Landing Page (Direct QR code scan by guest)
  if (guestBookMode) {
    return (
      <ErrorBoundary>
        <GuestBookView
          initialMode="checkin"
          isPublicMode={true}
          onSwitchToLims={() => setGuestBookMode(false)}
        />
      </ErrorBoundary>
    );
  }

  // Standalone Smart TV LSCP Display Landing Page (Direct TV Wall Display without prior login or sidebar wrap)
  if (lscpTvMode || activeTab === 'tv_lscp') {
    return (
      <ErrorBoundary>
        <LscpTvDisplayView
          pos={pos}
          testCatalogue={testCatalogue}
          onSwitchToLims={() => {
            setLscpTvMode(false);
            if (activeTab === 'tv_lscp') setActiveTab('dashboard');
          }}
        />
      </ErrorBoundary>
    );
  }

  // Public Verification Landing Page (Direct scan from mobile / guest without requiring prior login)
  if (verifyParam || activeTab === 'public_verification') {
    return (
      <ErrorBoundary>
        <PublicReportVerificationView
          initialReportNo={verifyParam || 'REP-2026-001'}
          pos={pos}
          personnelList={personnelCatalogue}
          onOpenLHU={(sample, po, sheetCode) => {
            setActiveLHUModal({ 
              sample, 
              po, 
              initialSelectedCodes: sheetCode ? [sheetCode] : undefined 
            });
          }}
        />
        {activeLHUModal && (
          <LHUReportModal
            sample={activeLHUModal.sample}
            po={activeLHUModal.po}
            personnelList={personnelCatalogue}
            initialSelectedCodes={activeLHUModal.initialSelectedCodes}
            onClose={() => setActiveLHUModal(null)}
          />
        )}
      </ErrorBoundary>
    );
  }

  if (!authSession.isAuthenticated) {
    return (
      <ErrorBoundary>
        <LoginView users={users} onLoginSuccess={handleLoginSuccess} />
      </ErrorBoundary>
    );
  }

  if (isMobileMode) {
    return (
      <ErrorBoundary>
        <MobileTechnicianApp
          pos={pos}
          setPos={setPos}
          currentUser={currentUser}
          setCurrentUser={setCurrentUser}
          users={users}
          containerCatalogue={containerCatalogue}
          moldCatalogue={moldCatalogue}
          ringCatalogue={ringCatalogue}
          consolRingCatalogue={consolRingCatalogue}
          dsRingCatalogue={dsRingCatalogue}
          dsProvingCatalogue={dsProvingCatalogue}
          trxRingCatalogue={trxRingCatalogue}
          uctRingCatalogue={uctRingCatalogue}
          pycnometerCatalogue={pycCatalogue}
          onSwitchToDesktop={() => setIsMobileMode(false)}
          onLogout={handleLogout}
        />
      </ErrorBoundary>
    );
  }

  return (
    <div className="min-h-[105.3vh] h-[105.3vh] bg-slate-50 text-slate-900 flex font-sans antialiased overflow-hidden">
      {/* Sidebar Navigation */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        urgentPOCount={urgentPOCount}
        runningPOCount={runningPOCount}
        currentUser={currentUser}
      />

      {/* Main App Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Navbar 
          searchTerm={searchTerm} 
          setSearchTerm={setSearchTerm}
          urgentAlertsCount={urgentPOCount}
          onOpenSchemaModal={() => setIsSchemaModalOpen(true)}
          onResetLocalData={handleResetLocalData}
          currentUser={currentUser}
          onLogout={handleLogout}
          onToggleMobileMode={() => setIsMobileMode(true)}
        />

        <main className="flex-1 overflow-y-auto bg-slate-100/70">
          {activeTab === 'quotation' && (
            <ErrorBoundary>
              <QuotationView
                quotations={quotations}
                clients={clients}
                personnelCatalogue={personnelCatalogue}
                onSaveQuotation={(q) => {
                  setQuotations(prev => {
                    const idx = prev.findIndex(item => item.id === q.id);
                    if (idx >= 0) {
                      const updated = [...prev];
                      updated[idx] = q;
                      return updated;
                    }
                    return [q, ...prev];
                  });
                }}
                onDeleteQuotation={(id) => {
                  setQuotations(prev => prev.filter(item => item.id !== id));
                }}
              />
            </ErrorBoundary>
          )}

          {activeTab === 'sample_receipt' && (
            <ErrorBoundary>
              <SampleReceiptView
                receipts={sampleReceipts}
                quotations={quotations}
                personnelCatalogue={personnelCatalogue}
                onSaveReceipt={(r) => {
                  setSampleReceipts(prev => {
                    const idx = prev.findIndex(item => item.id === r.id);
                    if (idx >= 0) {
                      const updated = [...prev];
                      updated[idx] = r;
                      return updated;
                    }
                    return [r, ...prev];
                  });
                }}
                onDeleteReceipt={(id) => {
                  setSampleReceipts(prev => prev.filter(item => item.id !== id));
                }}
              />
            </ErrorBoundary>
          )}

          {activeTab === 'sample_prep' && (
            <ErrorBoundary>
              <SamplePrepView
                reports={samplePrepReports}
                sampleReceipts={sampleReceipts}
                quotations={quotations}
                pos={pos}
                personnelCatalogue={personnelCatalogue}
                onSaveReport={(rep) => {
                  setSamplePrepReports(prev => {
                    const idx = prev.findIndex(item => item.id === rep.id);
                    if (idx >= 0) {
                      const updated = [...prev];
                      updated[idx] = rep;
                      return updated;
                    }
                    return [rep, ...prev];
                  });
                }}
                onDeleteReport={(id) => {
                  setSamplePrepReports(prev => prev.filter(item => item.id !== id));
                }}
                onOpenSubcontractTrigger={(rep) => {
                  const failedItems = rep.items.filter(i => i.status === 'FAIL_SUBCONTRACT');
                  if (failedItems.length > 0) {
                    const newNotice: SubcontractNotice = {
                      id: `sub-${Date.now()}`,
                      noticeNo: `SPK/TGI/2026/0${subcontractNotices.length + 1}`,
                      prepReportNo: rep.prepReportNo,
                      date: new Date().toISOString().split('T')[0],
                      clientName: rep.clientName,
                      projectName: rep.projectName,
                      partnerLabName: 'Laboratorium Rekanan Terakreditasi Utama',
                      status: 'Pending_Client',
                      subcontractItems: failedItems.flatMap(i => i.rejectedTestCodes.map(tc => ({
                        sampleCode: i.sampleCode,
                        boreholeNo: i.boreholeNo,
                        depthStr: i.depthStr,
                        testCode: tc,
                        testName: `Pengujian ${tc}`,
                        reason: i.rejectionReason || 'Spesifikasi fisik tanah di lab internal terbatas. Memerlukan alat/sel mini lab rekanan.'
                      })))
                    };
                    setSubcontractNotices(prev => [newNotice, ...prev]);
                    setActiveTab('subcontract_notice');
                  }
                }}
                onSyncToPO={handleSyncPOFromPrepReport}
              />
            </ErrorBoundary>
          )}


          {activeTab === 'subcontract_notice' && (
            <ErrorBoundary>
              <SubcontractNoticeView
                notices={subcontractNotices}
                shippingLetters={subcontractShippingLetters}
                prepReports={samplePrepReports}
                onSaveNotice={(sn) => {
                  setSubcontractNotices(prev => {
                    const idx = prev.findIndex(item => item.id === sn.id || item.prepReportNo === sn.prepReportNo);
                    if (idx >= 0) {
                      const updated = [...prev];
                      updated[idx] = sn;
                      return updated;
                    }
                    return [sn, ...prev];
                  });
                }}
                onSaveShippingLetter={(sl) => {
                  setSubcontractShippingLetters(prev => {
                    const idx = prev.findIndex(item => item.id === sl.id);
                    if (idx >= 0) {
                      const updated = [...prev];
                      updated[idx] = sl;
                      return updated;
                    }
                    return [sl, ...prev];
                  });
                }}
              />
            </ErrorBoundary>
          )}

          {activeTab === 'blank_worksheet' && (
            <ErrorBoundary>
              <BlankWorksheetView prepReports={samplePrepReports} />
            </ErrorBoundary>
          )}

          {activeTab === 'guest_book' && (
            <ErrorBoundary>
              <GuestBookView
                initialMode="admin"
              />
            </ErrorBoundary>
          )}

          {activeTab === 'waktu_pengujian' && (
            <ErrorBoundary>
              <WaktuPengujianView
                pos={pos}
                personnelCatalogue={personnelCatalogue}
              />
            </ErrorBoundary>
          )}

          {activeTab === 'invoice' && (
            <ErrorBoundary>
              <InvoiceView
                invoices={invoices}
                onSaveInvoice={(inv) => {
                  setInvoices(prev => {
                    const idx = prev.findIndex(item => item.id === inv.id);
                    if (idx >= 0) {
                      const updated = [...prev];
                      updated[idx] = inv;
                      return updated;
                    }
                    return [inv, ...prev];
                  });
                }}
              />
            </ErrorBoundary>
          )}

          {activeTab === 'client_master' && (
            <ErrorBoundary>
              <ClientMasterView
                clients={clients}
                labRekanans={labRekanans}
                onSaveClient={(c) => {
                  setClients(prev => {
                    const idx = prev.findIndex(item => item.id === c.id);
                    if (idx >= 0) { const updated = [...prev]; updated[idx] = c; return updated; }
                    return [...prev, c];
                  });
                }}
                onDeleteClient={(id) => setClients(prev => prev.filter(item => item.id !== id))}
                onSaveLabRekanan={(l) => {
                  setLabRekanans(prev => {
                    const idx = prev.findIndex(item => item.id === l.id);
                    if (idx >= 0) { const updated = [...prev]; updated[idx] = l; return updated; }
                    return [...prev, l];
                  });
                }}
                onDeleteLabRekanan={(id) => setLabRekanans(prev => prev.filter(item => item.id !== id))}
              />
            </ErrorBoundary>
          )}
          {activeTab === 'financial_analytics' && (
            <ErrorBoundary>
              <FinancialAnalyticsView
                pos={pos}
                quotations={quotations}
                invoices={invoices}
                testCatalogue={testCatalogue}
                onSelectPO={(po) => {
                  setSelectedPOId(po.id);
                  setActiveTab('po_management');
                }}
              />
            </ErrorBoundary>
          )}

          {activeTab === 'dashboard' && (
            <ErrorBoundary>
              <LscpDashboardView 
                pos={pos}
                searchTerm={searchTerm}
                testCatalogue={testCatalogue}
                onOpenCalcModal={handleOpenCalculationModal}
                onSelectPO={(po) => {
                  setSelectedPOId(po.id);
                  setActiveTab('po_management');
                }}
                onUpdateTestStatus={handleUpdateTestStatus}
                onUpdateSampleAssignedTests={handleUpdateSampleAssignedTests}
                onOpenLHUModal={(sample, po) => setActiveLHUModal({ sample, po })}
              />
            </ErrorBoundary>
          )}

          {activeTab === 'tv_lscp' && (
            <ErrorBoundary>
              <LscpTvDisplayView
                pos={pos}
                testCatalogue={testCatalogue}
                onSwitchToLims={() => setActiveTab('dashboard')}
              />
            </ErrorBoundary>
          )}

          {activeTab === 'po_management' && (
            <ErrorBoundary>
              <POManagementView 
                pos={pos}
                selectedPOId={selectedPOId}
                testCatalogue={testCatalogue}
                sampleTypeCatalogue={sampleTypeCatalogue}
                onSelectPOId={(id) => setSelectedPOId(id)}
                onAddPO={handleAddPO}
                onUpdatePO={handleUpdatePO}
                onDeletePO={handleDeletePO}
                onAddSample={handleAddSample}
                onUpdateSample={handleUpdateSample}
                onDeleteSample={handleDeleteSample}
                onAddTestToSample={handleAddTestToSample}
                onReplaceTest={handleReplaceTest}
                onMoveSample={handleMoveSample}
                onImportExcelSamples={handleImportExcelSamplesBatch}
                onOpenReportSheet={(sample, po) => setActiveReportSheet({ sample, po })}
                onOpenCalcModal={handleOpenCalculationModal}
                onUpdateTestStatus={handleUpdateTestStatus}
                onUpdateSampleAssignedTests={handleUpdateSampleAssignedTests}
                onOpenLHUModal={(sample, po) => setActiveLHUModal({ sample, po })}
              />
            </ErrorBoundary>
          )}

          {activeTab === 'pp_worksheet' && (
            <ErrorBoundary>
              <PhysicalPropertiesView
                pos={pos}
                selectedPOId={selectedPOId}
                selectedSampleId={selectedSampleId}
                containerCatalogue={containerCatalogue}
                moldCatalogue={moldCatalogue}
                reamerCatalogue={reamerCatalogue}
                ringCatalogue={ringCatalogue}
                consolRingCatalogue={consolRingCatalogue}
                dsRingCatalogue={dsRingCatalogue}
                dsProvingCatalogue={dsProvingCatalogue}
                trxRingCatalogue={trxRingCatalogue}
                uctRingCatalogue={uctRingCatalogue}
                pycCatalogue={pycCatalogue}
                personnelCatalogue={personnelCatalogue}
                onBackToPO={() => setActiveTab('po_management')}
                onSaveSampleCalculation={handleSaveSampleCalculation}
                onUpdateSamplePersonnel={handleUpdateSamplePersonnel}
              />
            </ErrorBoundary>
          )}

          {activeTab === 'sandbox_test' && (
            <ErrorBoundary>
              <SandboxTestView
                pos={pos}
                containerCatalogue={containerCatalogue}
                moldCatalogue={moldCatalogue}
                reamerCatalogue={reamerCatalogue}
                ringCatalogue={ringCatalogue}
                consolRingCatalogue={consolRingCatalogue}
                dsRingCatalogue={dsRingCatalogue}
                dsProvingCatalogue={dsProvingCatalogue}
                pycCatalogue={pycCatalogue}
                personnelCatalogue={personnelCatalogue}
                onSaveSampleCalculation={handleSaveSampleCalculation}
              />
            </ErrorBoundary>
          )}

          {activeTab === 'file_explorer' && (
            <ErrorBoundary>
              <FileExplorerView 
                pos={pos}
                documents={documents}
                onCreateFolder={handleCreateFolder}
                onCreateFile={handleCreateFile}
                onDeleteDoc={handleDeleteDoc}
                onRenameDoc={handleRenameDoc}
              />
            </ErrorBoundary>
          )}

          {activeTab === 'settings' && (
            <ErrorBoundary>
              <SettingsView
                testCatalogue={testCatalogue}
                onUpdateCatalogue={handleUpdateTestCatalogue}
                onResetCatalogue={handleResetTestCatalogue}
                sampleTypeCatalogue={sampleTypeCatalogue}
                onUpdateSampleTypeCatalogue={handleUpdateSampleTypeCatalogue}
                onResetSampleTypeCatalogue={handleResetSampleTypeCatalogue}
                containerCatalogue={containerCatalogue}
                onUpdateContainerCatalogue={handleUpdateContainerCatalogue}
                onResetContainerCatalogue={handleResetContainerCatalogue}
                moldCatalogue={moldCatalogue}
                onUpdateMoldCatalogue={handleUpdateMoldCatalogue}
                onResetMoldCatalogue={handleResetMoldCatalogue}
                reamerCatalogue={reamerCatalogue}
                onUpdateReamerCatalogue={handleUpdateReamerCatalogue}
                onResetReamerCatalogue={handleResetReamerCatalogue}
                ringCatalogue={ringCatalogue}
                onUpdateRingCatalogue={handleUpdateRingCatalogue}
                onResetRingCatalogue={handleResetRingCatalogue}
                consolRingCatalogue={consolRingCatalogue}
                onUpdateConsolRingCatalogue={handleUpdateConsolRingCatalogue}
                onResetConsolRingCatalogue={handleResetConsolRingCatalogue}
                dsProvingCatalogue={dsProvingCatalogue}
                onUpdateDsProvingCatalogue={handleUpdateDsProvingCatalogue}
                onResetDsProvingCatalogue={handleResetDsProvingCatalogue}
                dsRingCatalogue={dsRingCatalogue}
                onUpdateDsRingCatalogue={handleUpdateDsRingCatalogue}
                onResetDsRingCatalogue={handleResetDsRingCatalogue}
                trxRingCatalogue={trxRingCatalogue}
                onUpdateTrxRingCatalogue={handleUpdateTrxRingCatalogue}
                onResetTrxRingCatalogue={handleResetTrxRingCatalogue}
                uctRingCatalogue={uctRingCatalogue}
                onUpdateUctRingCatalogue={handleUpdateUctRingCatalogue}
                onResetUctRingCatalogue={handleResetUctRingCatalogue}
                pycCatalogue={pycCatalogue}
                onUpdatePycCatalogue={handleUpdatePycCatalogue}
                onResetPycCatalogue={handleResetPycCatalogue}
                personnelCatalogue={personnelCatalogue}
                onUpdatePersonnelCatalogue={handleUpdatePersonnelCatalogue}
                onResetPersonnelCatalogue={handleResetPersonnelCatalogue}
              />
            </ErrorBoundary>
          )}

          {activeTab === 'user_management' && (
            <ErrorBoundary>
              <UserManagementView
                users={users}
                onAddUser={handleAddUser}
                onUpdateUser={handleUpdateUser}
                onDeleteUser={handleDeleteUser}
                currentUser={currentUser}
                onSwitchUser={(user) => setCurrentUser(user)}
              />
            </ErrorBoundary>
          )}
        </main>
      </div>

      {/* MODALS */}
      {activeCalcTest && (
        <ErrorBoundary>
          <FutureCalcModal
            test={activeCalcTest.test}
            sample={activeCalcTest.sample}
            po={activeCalcTest.po}
            onClose={() => setActiveCalcTest(null)}
            onSaveCalcData={(data) => {
              setPos(prev => prev.map(p => {
                if (p.id === activeCalcTest.po.id) {
                  return {
                    ...p,
                    samples: p.samples.map(s => {
                      if (s.id === activeCalcTest.sample.id) {
                        return {
                          ...s,
                          tests: s.tests.map(t => {
                            if (t.id === activeCalcTest.test.id) {
                              return {
                                ...t,
                                calculationStatus: 'Draft Data',
                                calculationData: data
                              };
                            }
                            return t;
                          })
                        };
                      }
                      return s;
                    })
                  };
                }
                return p;
              }));
              setActiveCalcTest(null);
            }}
          />
        </ErrorBoundary>
      )}

      {activeReportSheet && (
        <ErrorBoundary>
          <SampleReportSheetModal
            sample={activeReportSheet.sample}
            po={activeReportSheet.po}
            onClose={() => setActiveReportSheet(null)}
          />
        </ErrorBoundary>
      )}

      {activeLHUModal && (
        <ErrorBoundary>
          <LHUReportModal
            sample={activeLHUModal.sample}
            po={activeLHUModal.po}
            personnelList={personnelCatalogue}
            initialSelectedCodes={activeLHUModal.initialSelectedCodes}
            onClose={() => setActiveLHUModal(null)}
          />
        </ErrorBoundary>
      )}

      {activePPModal && (
        <ErrorBoundary>
          <PhysicalPropertiesModal
            sample={activePPModal.sample}
            po={activePPModal.po}
            containerCatalogue={containerCatalogue}
            moldCatalogue={moldCatalogue}
            reamerCatalogue={reamerCatalogue}
            ringCatalogue={ringCatalogue}
            pycCatalogue={pycCatalogue}
            onClose={() => setActivePPModal(null)}
            onSaveCalculation={(updatedSample) => {
              setPos(prev => prev.map(p => {
                if (p.id === activePPModal.po.id) {
                  return {
                    ...p,
                    samples: p.samples.map(s => s.id === updatedSample.id ? updatedSample : s)
                  };
                }
                return p;
              }));
              setActivePPModal(null);
            }}
          />
        </ErrorBoundary>
      )}

      {isSchemaModalOpen && (
        <ErrorBoundary>
          <SchemaViewerModal onClose={() => setIsSchemaModalOpen(false)} />
        </ErrorBoundary>
      )}

      {/* GLOBAL TOAST POPUP NOTIFICATION */}
      {globalToastMsg && (
        <div className="fixed top-5 right-5 z-[99999] bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white px-5 py-3 rounded-2xl shadow-2xl border border-emerald-400/40 backdrop-blur-md flex items-center gap-2.5 text-xs font-black animate-in slide-in-from-top-4 duration-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-200 shrink-0 stroke-[2.5]" />
          <span className="tracking-wide">{globalToastMsg}</span>
        </div>
      )}

      {/* SCIENTIFIC ATOM LOADING OVERLAY (LOADER 4 - ATOM FOR SYNC ACTION) */}
      {isSyncingAtomGlobal && (
        <div className="fixed inset-0 z-[100000] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white/95 backdrop-blur-md rounded-3xl border border-purple-200/90 p-7 text-center space-y-4 shadow-2xl max-w-[340px] w-full flex flex-col items-center animate-in zoom-in-95 duration-150 relative overflow-hidden">
            
            {/* Subtle Purple Background Ambient Glow */}
            <div className="absolute -top-10 -left-10 w-32 h-32 bg-purple-400/10 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-indigo-400/10 rounded-full blur-2xl pointer-events-none" />

            {/* Atom Header Pill Badge */}
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 border border-purple-200 text-purple-800 text-[10.5px] font-black tracking-wider uppercase">
              <span className="w-4 h-4 rounded-full bg-purple-600 text-white flex items-center justify-center text-[9px] font-bold">4</span>
              <span>Atom Scientific Sync</span>
            </div>

            {/* Scientific Atom Animation Container */}
            <div className="relative w-24 h-24 flex items-center justify-center my-1">
              
              {/* Central Atomic Nucleus */}
              <div className="relative z-10 flex items-center justify-center">
                <div className="w-5 h-5 rounded-full bg-purple-600 shadow-lg shadow-purple-600/60 animate-pulse" />
                <div className="absolute w-2.5 h-2.5 rounded-full bg-purple-200" />
              </div>

              {/* Orbit Ring 1 (Horizontal - 0 deg) */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-20 h-8 rounded-[50%] border border-purple-400/60 animate-spin relative" style={{ animationDuration: '2s' }}>
                  <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2.5 h-2.5 bg-purple-500 rounded-full shadow-md shadow-purple-500/80" />
                </div>
              </div>

              {/* Orbit Ring 2 (Tilted 60 deg) */}
              <div className="absolute inset-0 flex items-center justify-center rotate-[60deg]">
                <div className="w-20 h-8 rounded-[50%] border border-indigo-400/60 animate-[spin_1.5s_linear_infinite] relative">
                  <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2.5 h-2.5 bg-indigo-500 rounded-full shadow-md shadow-indigo-500/80" />
                </div>
              </div>

              {/* Orbit Ring 3 (Tilted 120 deg) */}
              <div className="absolute inset-0 flex items-center justify-center rotate-[120deg]">
                <div className="w-20 h-8 rounded-[50%] border border-cyan-400/60 animate-[spin_2.5s_linear_infinite_reverse] relative">
                  <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2.5 h-2.5 bg-cyan-500 rounded-full shadow-md shadow-cyan-500/80" />
                </div>
              </div>
            </div>

            <div className="space-y-1 z-10">
              <h4 className="text-sm font-black text-slate-900 font-mono tracking-wider uppercase">
                {syncAtomDetails?.title || 'MENYSINKRONKAN KE PO...'}
              </h4>
              <p className="text-xs text-purple-700 font-bold">
                {syncAtomDetails?.subtitle || 'Atomic Data Sync & PO Matrix Validation'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
