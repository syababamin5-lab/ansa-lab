// =====================================================================
// TIMES® ANSA LIMS — Official Vercel KV Realtime Database Engine
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

// Official Vercel KV (Upstash Redis) REST API Configuration
const VERCEL_KV_REST_API_URL = 'https://neat-bengal-180591.upstash.io';
const VERCEL_KV_REST_API_TOKEN = 'gQAAAAAAAsFvAAIgcDI0Yzk0MGE3ZTZlZWI0NDAwODAyNjgzMDQ1YmNhYjIwNA';
const STORE_KEY = 'ansa_lab_master_store_v2';
const LOCAL_CACHE_KEY = 'ansa_lab_vercel_kv_cache_v2';

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

/** Simpan data state secara permanen ke Vercel KV Server Database */
export async function saveStateToCloud(state: CloudDatabaseState): Promise<boolean> {
  try {
    // 1. Simpan snapshot cepat ke Local Cache untuk kecepatan UI
    localStorage.setItem(LOCAL_CACHE_KEY, JSON.stringify(state));

    // 2. Kirim langsung ke Server Vercel KV REST API
    const res = await fetch(VERCEL_KV_REST_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${VERCEL_KV_REST_API_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(['SET', STORE_KEY, JSON.stringify(state)])
    });

    if (!res.ok) {
      console.warn('[Vercel KV Warning] HTTP Status:', res.status);
    }
    return true;
  } catch (e) {
    console.error('[Vercel KV Save Error]:', e);
    return false;
  }
}

/** Ambil data permanen langsung dari Vercel KV Server Database */
export async function loadStateFromCloud(): Promise<CloudDatabaseState> {
  const defaultState = getInitialMasterState();

  try {
    const res = await fetch(VERCEL_KV_REST_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${VERCEL_KV_REST_API_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(['GET', STORE_KEY])
    });

    if (res.ok) {
      const responseJson = await res.json();
      if (responseJson && responseJson.result) {
        const rawString = responseJson.result;
        const cloudData = (typeof rawString === 'string' ? JSON.parse(rawString) : rawString) as CloudDatabaseState;
        
        // Simpan snapshot Vercel KV terbaru ke local cache
        localStorage.setItem(LOCAL_CACHE_KEY, JSON.stringify(cloudData));

        return {
          ...defaultState,
          ...cloudData,
          users: mergeUsers(cloudData.users),
          containers: mergeContainers(cloudData.containers),
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
    console.warn('[Vercel KV Load Warning]: Failed to reach Vercel KV, checking local fallback', e);
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
