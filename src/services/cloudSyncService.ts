// =====================================================================
// TIMES® ANSA LIMS — Realtime Cloud Database Service Engine
// =====================================================================
import { UserProfile, INITIAL_USERS } from '../types/userTypes';
import { Client, Quotation, SampleReceipt, SamplePrepReport, SubcontractNotice, Invoice } from '../types/workflowTypes';
import { PurchaseOrder, ContainerItem, RingItem, ConsolRingItem, PycnometerItem, MoldItem, ReamerItem, PersonnelItem, DocumentItem } from '../types';
import {
  DEFAULT_CONTAINER_CATALOGUE,
  DEFAULT_RING_CATALOGUE,
  DEFAULT_CONSOL_RING_CATALOGUE,
  DEFAULT_PYCNOMETER_CATALOGUE,
  DEFAULT_MOLD_CATALOGUE,
  DEFAULT_REAMER_CATALOGUE,
  DEFAULT_PERSONNEL_CATALOGUE
} from '../data/initialData';

// Dedicated Cloud Storage Object ID on HTTPS Rest API
const CLOUD_OBJECT_ID = 'ff808181a058d43f01a0615d96ab1b61';
const CLOUD_API_URL = `https://api.restful-api.dev/objects/${CLOUD_OBJECT_ID}`;
const LOCAL_CACHE_KEY = 'ansa_lab_cloud_db_v3';

export interface CloudDatabaseState {
  users: UserProfile[];
  clients: Client[];
  pos: PurchaseOrder[];
  quotations: Quotation[];
  sampleReceipts: SampleReceipt[];
  prepReports: SamplePrepReport[];
  subcontractNotices: SubcontractNotice[];
  invoices: Invoice[];
  documents: DocumentItem[];
  containers: ContainerItem[];
  rings: RingItem[];
  consolRings: ConsolRingItem[];
  pycnometers: PycnometerItem[];
  molds: MoldItem[];
  reamers: ReamerItem[];
  personnels: PersonnelItem[];
  updatedAt: string;
}

/** State dasar bawaan bersih */
export function getInitialMasterState(): CloudDatabaseState {
  return {
    users: INITIAL_USERS,
    clients: [],
    pos: [],
    quotations: [],
    sampleReceipts: [],
    prepReports: [],
    subcontractNotices: [],
    invoices: [],
    documents: [],
    containers: DEFAULT_CONTAINER_CATALOGUE,
    rings: DEFAULT_RING_CATALOGUE,
    consolRings: DEFAULT_CONSOL_RING_CATALOGUE,
    pycnometers: DEFAULT_PYCNOMETER_CATALOGUE,
    molds: DEFAULT_MOLD_CATALOGUE,
    reamers: DEFAULT_REAMER_CATALOGUE,
    personnels: DEFAULT_PERSONNEL_CATALOGUE,
    updatedAt: new Date().toISOString(),
  };
}

/** Simpan data state secara permanen ke Cloud Database Server */
export async function saveStateToCloud(state: CloudDatabaseState): Promise<boolean> {
  try {
    // 1. Simpan ke local cache untuk kecepatan UI
    localStorage.setItem(LOCAL_CACHE_KEY, JSON.stringify(state));

    // 2. Kirim langsung ke Server Cloud Database HTTPS
    const res = await fetch(CLOUD_API_URL, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'ANSA_LIMS_PRODUCTION_CLOUD_DATABASE',
        data: state
      })
    });

    if (!res.ok) {
      console.warn('[Cloud Sync Warning] Server HTTP status:', res.status);
    }
    return true;
  } catch (e) {
    console.error('[Cloud Sync Error]:', e);
    return false;
  }
}

/** Ambil data permanen langsung dari Cloud Database Server */
export async function loadStateFromCloud(): Promise<CloudDatabaseState> {
  const defaultState = getInitialMasterState();

  try {
    const res = await fetch(CLOUD_API_URL);
    if (res.ok) {
      const result = await res.json();
      if (result && result.data) {
        const cloudData = result.data as CloudDatabaseState;
        
        // Simpan snapshot cloud terbaru ke local cache
        localStorage.setItem(LOCAL_CACHE_KEY, JSON.stringify(cloudData));

        return {
          ...defaultState,
          ...cloudData,
          users: mergeUsers(cloudData.users || []),
          containers: mergeContainers(cloudData.containers || []),
          pos: cloudData.pos || [],
          clients: cloudData.clients || [],
          quotations: cloudData.quotations || [],
          sampleReceipts: cloudData.sampleReceipts || [],
          prepReports: cloudData.prepReports || [],
          subcontractNotices: cloudData.subcontractNotices || [],
          invoices: cloudData.invoices || [],
          documents: cloudData.documents || []
        };
      }
    }
  } catch (e) {
    console.warn('[Cloud Load Warning]: Failed to reach cloud API, checking local fallback', e);
  }

  // Fallback ke local cache jika offline
  const cached = localStorage.getItem(LOCAL_CACHE_KEY);
  if (cached) {
    try {
      const parsed = JSON.parse(cached);
      if (parsed && typeof parsed === 'object') {
        return {
          ...defaultState,
          ...parsed,
          users: mergeUsers(parsed.users || []),
          containers: mergeContainers(parsed.containers || []),
          pos: parsed.pos || [],
          clients: parsed.clients || [],
          quotations: parsed.quotations || [],
          sampleReceipts: parsed.sampleReceipts || [],
          prepReports: parsed.prepReports || [],
          subcontractNotices: parsed.subcontractNotices || [],
          invoices: parsed.invoices || [],
          documents: parsed.documents || []
        };
      }
    } catch (err) {}
  }

  return defaultState;
}

function mergeContainers(existing: ContainerItem[]): ContainerItem[] {
  if (!existing || existing.length === 0) return DEFAULT_CONTAINER_CATALOGUE;
  const defaultMap = new Map(DEFAULT_CONTAINER_CATALOGUE.map(c => [String(c.id).toUpperCase(), c.weight]));
  const updated = existing.map(c => {
    const officialWt = defaultMap.get(String(c.id).toUpperCase());
    return officialWt !== undefined ? { ...c, weight: officialWt } : c;
  });
  const existingIds = new Set(updated.map(c => String(c.id).toUpperCase()));
  const missing = DEFAULT_CONTAINER_CATALOGUE.filter(c => !existingIds.has(String(c.id).toUpperCase()));
  return missing.length > 0 ? [...updated, ...missing] : updated;
}

function mergeUsers(existing: UserProfile[]): UserProfile[] {
  if (!existing || existing.length === 0) return INITIAL_USERS;
  const existingIds = new Set(existing.map(u => u.id));
  const missing = INITIAL_USERS.filter(u => !existingIds.has(u.id));
  return missing.length > 0 ? [...existing, ...missing] : existing;
}
