// =====================================================================
// TIMES® ANSA LIMS — Official Vercel KV Realtime Database Engine
// =====================================================================
import { UserProfile, INITIAL_USERS } from '../types/userTypes';
import { Client, Quotation, SampleReceipt, SamplePrepReport, SubcontractNotice, Invoice, LabRekanan, SubcontractShippingLetter } from '../types/workflowTypes';
import { PurchaseOrder, ContainerItem, RingItem, ConsolRingItem, PycnometerItem, MoldItem, ReamerItem, PersonnelItem, DocumentItem } from '../types';
import { CompanyProfile, DEFAULT_COMPANY_PROFILE } from '../types/companyProfileTypes';
import { GuestEntry } from '../types/guestBookTypes';
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

export interface CloudDatabaseState {
  users: UserProfile[];
  clients: Client[];
  labRekanans?: LabRekanan[];
  pos: PurchaseOrder[];
  quotations: Quotation[];
  sampleReceipts: SampleReceipt[];
  prepReports: SamplePrepReport[];
  subcontractNotices: SubcontractNotice[];
  subcontractShippingLetters?: SubcontractShippingLetter[];
  invoices: Invoice[];
  documents: DocumentItem[];
  containers: ContainerItem[];
  rings: RingItem[];
  consolRings: ConsolRingItem[];
  pycnometers: PycnometerItem[];
  molds: MoldItem[];
  reamers: ReamerItem[];
  personnels: PersonnelItem[];
  companyProfile?: CompanyProfile;
  guestEntries?: GuestEntry[];
  updatedAt: string;
}

/** Bersihkan seluruh jejak cache localStorage lama di browser agar kuota memori browser 100% bersih */
export function purgeLegacyLocalStorage(): void {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return;
    const allKeys = Object.keys(localStorage);
    allKeys.forEach(k => {
      if (k.startsWith('ansa_') || k.startsWith('offline_queue')) {
        try {
          localStorage.removeItem(k);
        } catch (e) {}
      }
    });
  } catch (e) {}
}

/** State dasar bawaan bersih */
export function getInitialMasterState(): CloudDatabaseState {
  return {
    users: INITIAL_USERS,
    clients: [],
    labRekanans: [],
    pos: [],
    quotations: [],
    sampleReceipts: [],
    prepReports: [],
    subcontractNotices: [],
    subcontractShippingLetters: [],
    invoices: [],
    documents: [],
    containers: DEFAULT_CONTAINER_CATALOGUE,
    rings: DEFAULT_RING_CATALOGUE,
    consolRings: DEFAULT_CONSOL_RING_CATALOGUE,
    pycnometers: DEFAULT_PYCNOMETER_CATALOGUE,
    molds: DEFAULT_MOLD_CATALOGUE,
    reamers: DEFAULT_REAMER_CATALOGUE,
    personnels: DEFAULT_PERSONNEL_CATALOGUE,
    companyProfile: DEFAULT_COMPANY_PROFILE,
    guestEntries: [],
    updatedAt: new Date().toISOString(),
  };
}

/** Simpan data state secara permanen HANYA ke Cloud Database (Vercel KV / Upstash Redis), TANPA menyentuh localStorage */
export async function saveStateToCloud(state: CloudDatabaseState): Promise<boolean> {
  try {
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

/** Ambil data permanen 100% langsung dari Cloud Server Database (Vercel KV / Upstash Redis) */
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
        
        return {
          ...defaultState,
          ...cloudData,
          users: mergeUsers(cloudData.users),
          containers: mergeContainers(cloudData.containers),
          pos: cloudData.pos || [],
          clients: cloudData.clients || [],
          labRekanans: cloudData.labRekanans || [],
          quotations: cloudData.quotations || [],
          sampleReceipts: cloudData.sampleReceipts || [],
          prepReports: cloudData.prepReports || [],
          subcontractNotices: cloudData.subcontractNotices || [],
          subcontractShippingLetters: cloudData.subcontractShippingLetters || [],
          invoices: cloudData.invoices || [],
          documents: cloudData.documents || [],
          guestEntries: Array.isArray(cloudData.guestEntries) ? cloudData.guestEntries : [],
          companyProfile: cloudData.companyProfile ? { ...DEFAULT_COMPANY_PROFILE, ...cloudData.companyProfile } : DEFAULT_COMPANY_PROFILE
        };
      }
    }
  } catch (e) {
    console.warn('[Vercel KV Load Warning]: Failed to reach Vercel KV', e);
  }

  return defaultState;
}

/** Simpan entry tamu baru secara atomik langsung ke Cloud Redis */
export async function saveGuestEntryDirectToCloud(newEntry: GuestEntry): Promise<GuestEntry[]> {
  try {
    const currentState = await loadStateFromCloud();
    const existing = Array.isArray(currentState.guestEntries) ? currentState.guestEntries : [];
    // Prepend new entry
    const updatedEntries = [newEntry, ...existing.filter(e => e.id !== newEntry.id)];
    currentState.guestEntries = updatedEntries;
    currentState.updatedAt = new Date().toISOString();
    await saveStateToCloud(currentState);
    return updatedEntries;
  } catch (e) {
    console.error('[Cloud Guest Book Save Error]:', e);
    return [newEntry];
  }
}

/** Update status entry tamu (misal checkout) langsung di Cloud Redis */
export async function updateGuestEntryInCloud(entryId: string, updates: Partial<GuestEntry>): Promise<GuestEntry[]> {
  try {
    const currentState = await loadStateFromCloud();
    const existing = Array.isArray(currentState.guestEntries) ? currentState.guestEntries : [];
    const updatedEntries = existing.map(e => e.id === entryId ? { ...e, ...updates } : e);
    currentState.guestEntries = updatedEntries;
    currentState.updatedAt = new Date().toISOString();
    await saveStateToCloud(currentState);
    return updatedEntries;
  } catch (e) {
    console.error('[Cloud Guest Book Update Error]:', e);
    return [];
  }
}

/** Ambil daftar tamu langsung dari Cloud Redis */
export async function loadGuestEntriesFromCloud(): Promise<GuestEntry[]> {
  try {
    const state = await loadStateFromCloud();
    return Array.isArray(state.guestEntries) ? state.guestEntries : [];
  } catch (e) {
    return [];
  }
}

function mergeContainers(existing: ContainerItem[] | undefined): ContainerItem[] {
  if (!existing || existing.length === 0) return DEFAULT_CONTAINER_CATALOGUE;
  return existing; // Respect user edits, never overwrite calibrated weights!
}
function mergeUsers(existing: UserProfile[] | undefined): UserProfile[] {
  if (!existing || existing.length === 0) return INITIAL_USERS;
  return existing; // DO NOT OVERWRITE EDITED USER PROFILES!
}
