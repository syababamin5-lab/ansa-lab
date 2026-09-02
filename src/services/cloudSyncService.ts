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

// Active REST API Cloud Store Endpoint
const CRUD_API_BASE = 'https://crudcrud.com/api/0a010bdb162249a7bd44a10a9e0fb17e';
const LOCAL_CACHE_KEY = 'ansa_lab_cloud_db_v4';
let cachedDocumentId: string | null = '6a97f90780971203e84819dd';

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

    if (!cachedDocumentId) {
      // POST baru
      const res = await fetch(`${CRUD_API_BASE}/main_store`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(state)
      });
      if (res.ok) {
        const created = await res.json();
        if (created._id) cachedDocumentId = created._id;
      }
    } else {
      // PUT update
      const res = await fetch(`${CRUD_API_BASE}/main_store/${cachedDocumentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(state)
      });

      if (!res.ok) {
        // Fallback POST jika ID hilang/reset
        const postRes = await fetch(`${CRUD_API_BASE}/main_store`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(state)
        });
        if (postRes.ok) {
          const created = await postRes.json();
          if (created._id) cachedDocumentId = created._id;
        }
      }
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
    const res = await fetch(`${CRUD_API_BASE}/main_store`);
    if (res.ok) {
      const result = await res.json();
      if (Array.isArray(result) && result.length > 0) {
        const doc = result[result.length - 1]; // Ambil snapshot terbaru
        if (doc._id) cachedDocumentId = doc._id;

        // Simpan snapshot cloud terbaru ke local cache
        localStorage.setItem(LOCAL_CACHE_KEY, JSON.stringify(doc));

        return {
          ...defaultState,
          ...doc,
          users: mergeUsers(doc.users),
          containers: mergeContainers(doc.containers),
          pos: doc.pos || [],
          clients: doc.clients || [],
          quotations: doc.quotations || [],
          sampleReceipts: doc.sampleReceipts || [],
          prepReports: doc.prepReports || [],
          subcontractNotices: doc.subcontractNotices || [],
          invoices: doc.invoices || [],
          documents: doc.documents || []
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
          users: mergeUsers(parsed.users),
          containers: mergeContainers(parsed.containers),
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

function mergeContainers(existing: ContainerItem[] | undefined): ContainerItem[] {
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

function mergeUsers(existing: UserProfile[] | undefined): UserProfile[] {
  if (!existing || existing.length === 0) return INITIAL_USERS;
  return existing; // DO NOT OVERWRITE EDITED USER PROFILES!
}
