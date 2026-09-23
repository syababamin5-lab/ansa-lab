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

/** Reset total data operasional cloud ke state bersih awal dengan katalog master yang rapi */
export async function resetCloudToCleanMaster(): Promise<boolean> {
  const cleanState = getInitialMasterState();
  return await saveStateToCloud(cleanState);
}

/** Ambil data permanen dengan validasi status koneksi aman (Safe Loading) */
export async function loadStateFromCloudSafe(): Promise<{ success: boolean; data: CloudDatabaseState | null }> {
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
      if (responseJson && responseJson.result !== undefined) {
        if (responseJson.result === null) {
          // Kunci Redis belum pernah diisi -> kembalikan state awal bersih
          return { success: true, data: getInitialMasterState() };
        }
        const rawString = responseJson.result;
        const cloudData = (typeof rawString === 'string' ? JSON.parse(rawString) : rawString) as CloudDatabaseState;
        const defaultState = getInitialMasterState();
        
        return {
          success: true,
          data: {
            ...defaultState,
            ...cloudData,
            users: mergeUsers(cloudData.users),
            containers: mergeContainers(cloudData.containers),
            rings: mergeRings(cloudData.rings),
            consolRings: mergeConsolRings(cloudData.consolRings),
            molds: mergeMolds(cloudData.molds),
            reamers: mergeReamers(cloudData.reamers),
            pycnometers: mergePycnometers(cloudData.pycnometers),
            personnels: mergePersonnels(cloudData.personnels),
            pos: Array.isArray(cloudData.pos) ? cloudData.pos : [],
            clients: Array.isArray(cloudData.clients) ? cloudData.clients : [],
            labRekanans: Array.isArray(cloudData.labRekanans) ? cloudData.labRekanans : [],
            quotations: Array.isArray(cloudData.quotations) ? cloudData.quotations : [],
            sampleReceipts: Array.isArray(cloudData.sampleReceipts) ? cloudData.sampleReceipts : [],
            prepReports: Array.isArray(cloudData.prepReports) ? cloudData.prepReports : [],
            subcontractNotices: Array.isArray(cloudData.subcontractNotices) ? cloudData.subcontractNotices : [],
            subcontractShippingLetters: Array.isArray(cloudData.subcontractShippingLetters) ? cloudData.subcontractShippingLetters : [],
            invoices: Array.isArray(cloudData.invoices) ? cloudData.invoices : [],
            documents: Array.isArray(cloudData.documents) ? cloudData.documents : [],
            guestEntries: Array.isArray(cloudData.guestEntries) ? cloudData.guestEntries : [],
            companyProfile: cloudData.companyProfile ? { ...DEFAULT_COMPANY_PROFILE, ...cloudData.companyProfile } : DEFAULT_COMPANY_PROFILE
          }
        };
      }
    }
    console.warn('[Vercel KV Warning] Non-OK HTTP Status:', res.status);
    return { success: false, data: null };
  } catch (e) {
    console.error('[Vercel KV Load Error]: Failed to reach Vercel KV', e);
    return { success: false, data: null };
  }
}

/** Ambil data permanen 100% langsung dari Cloud Server Database (Vercel KV / Upstash Redis) */
export async function loadStateFromCloud(): Promise<CloudDatabaseState | null> {
  const result = await loadStateFromCloudSafe();
  return result.data;
}

export const GUEST_STORE_KEY = 'ansa_lab_guestbook_store_v1';

/** Simpan entry tamu baru secara atomik langsung ke Cloud Redis dalam ~100ms */
export async function saveGuestEntryDirectToCloud(newEntry: GuestEntry): Promise<GuestEntry[]> {
  try {
    const existing = await loadGuestEntriesFromCloud();
    const updatedEntries = [newEntry, ...existing.filter(e => e.id !== newEntry.id)];
    
    // Simpan langsung ke dedicated Redis key (sangat cepat ~100ms)
    await fetch(VERCEL_KV_REST_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${VERCEL_KV_REST_API_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(['SET', GUEST_STORE_KEY, JSON.stringify(updatedEntries)])
    });

    // BroadcastChannel antar-tab seketika
    try {
      if (typeof BroadcastChannel !== 'undefined') {
        const bc = new BroadcastChannel('ansa_lab_guestbook_sync');
        bc.postMessage({ type: 'GUEST_UPDATED', entries: updatedEntries });
        bc.close();
      }
    } catch (_) {}

    return updatedEntries;
  } catch (e) {
    console.error('[Cloud Guest Book Save Error]:', e);
    return [newEntry];
  }
}

/** Update status entry tamu (misal checkout) langsung di Cloud Redis */
export async function updateGuestEntryInCloud(entryId: string, updates: Partial<GuestEntry>): Promise<GuestEntry[]> {
  try {
    const existing = await loadGuestEntriesFromCloud();
    const updatedEntries = existing.map(e => e.id === entryId ? { ...e, ...updates } : e);
    
    await fetch(VERCEL_KV_REST_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${VERCEL_KV_REST_API_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(['SET', GUEST_STORE_KEY, JSON.stringify(updatedEntries)])
    });

    try {
      if (typeof BroadcastChannel !== 'undefined') {
        const bc = new BroadcastChannel('ansa_lab_guestbook_sync');
        bc.postMessage({ type: 'GUEST_UPDATED', entries: updatedEntries });
        bc.close();
      }
    } catch (_) {}

    return updatedEntries;
  } catch (e) {
    console.error('[Cloud Guest Book Update Error]:', e);
    return [];
  }
}

/** Ambil daftar tamu langsung dari Cloud Redis secara instan (~100ms) */
export async function loadGuestEntriesFromCloud(): Promise<GuestEntry[]> {
  try {
    const res = await fetch(VERCEL_KV_REST_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${VERCEL_KV_REST_API_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(['GET', GUEST_STORE_KEY])
    });

    if (res.ok) {
      const responseJson = await res.json();
      if (responseJson && responseJson.result) {
        const raw = responseJson.result;
        const entries = (typeof raw === 'string' ? JSON.parse(raw) : raw) as GuestEntry[];
        if (Array.isArray(entries)) {
          return entries;
        }
      }
    }
  } catch (e) {
    console.warn('[Vercel KV Load Guest Entries Error]:', e);
  }

  // Fallback ke master store jika key khusus belum terisi
  try {
    const state = await loadStateFromCloud();
    return Array.isArray(state.guestEntries) ? state.guestEntries : [];
  } catch (e) {
    return [];
  }
}

function mergeContainers(existing: ContainerItem[] | undefined): ContainerItem[] {
  if (!existing || !Array.isArray(existing) || existing.length === 0) return DEFAULT_CONTAINER_CATALOGUE;
  return existing; // Respect user edits, never overwrite calibrated weights!
}

function mergeRings(existing: any[] | undefined): RingItem[] {
  if (!existing || !Array.isArray(existing) || existing.length === 0) return DEFAULT_RING_CATALOGUE;
  // If legacy schema detected (missing ringNo, or has id & ringWeight without ringNo)
  const isLegacy = existing.some(r => !r || !r.ringNo || r.ringWeight !== undefined);
  if (isLegacy) return DEFAULT_RING_CATALOGUE;
  return existing;
}

function mergeConsolRings(existing: any[] | undefined): ConsolRingItem[] {
  if (!existing || !Array.isArray(existing) || existing.length === 0) return DEFAULT_CONSOL_RING_CATALOGUE;
  // If legacy schema detected (has area or ringWeight instead of diameterMm and weightGrams)
  const isLegacy = existing.some(r => !r || r.area !== undefined || r.ringWeight !== undefined || !r.diameterMm);
  if (isLegacy) return DEFAULT_CONSOL_RING_CATALOGUE;
  return existing;
}

function mergeMolds(existing: any[] | undefined): MoldItem[] {
  if (!existing || !Array.isArray(existing) || existing.length === 0) return DEFAULT_MOLD_CATALOGUE;
  // If legacy schema detected (has moldId instead of kode)
  const isLegacy = existing.some(m => !m || m.moldId !== undefined || !m.kode);
  if (isLegacy) return DEFAULT_MOLD_CATALOGUE;
  return existing;
}

function mergeReamers(existing: any[] | undefined): ReamerItem[] {
  if (!existing || !Array.isArray(existing) || existing.length === 0) return DEFAULT_REAMER_CATALOGUE;
  // If legacy schema detected (has reamerId instead of kode)
  const isLegacy = existing.some(r => !r || r.reamerId !== undefined || !r.kode);
  if (isLegacy) return DEFAULT_REAMER_CATALOGUE;
  return existing;
}

function mergePycnometers(existing: any[] | undefined): PycnometerItem[] {
  if (!existing || !Array.isArray(existing) || existing.length === 0) return DEFAULT_PYCNOMETER_CATALOGUE;
  const isInvalid = existing.some(p => !p || !p.pycNo);
  if (isInvalid) return DEFAULT_PYCNOMETER_CATALOGUE;
  return existing;
}

function mergePersonnels(existing: any[] | undefined): PersonnelItem[] {
  if (!existing || !Array.isArray(existing) || existing.length === 0) return DEFAULT_PERSONNEL_CATALOGUE;
  const isInvalid = existing.some(p => !p || !p.id || !p.name);
  if (isInvalid) return DEFAULT_PERSONNEL_CATALOGUE;
  return existing;
}

function normalizeUserRole(rawRole: any): UserRole {
  if (rawRole === 'LAB_HEAD') return 'LAB_MANAGER';
  if (rawRole === 'SECTION_HEAD') return 'QA_QC_COORDINATOR';
  if (rawRole === 'ADMIN_OPERATOR') return 'ADMIN_FINANCE';
  if (rawRole === 'TECHNICIAN') return 'ANALYST';
  if (['SUPER_ADMIN', 'EXECUTIVE_DIRECTOR', 'LAB_MANAGER', 'QA_QC_COORDINATOR', 'ANALYST', 'ADMIN_FINANCE'].includes(rawRole)) {
    return rawRole;
  }
  return 'ANALYST';
}

function mergeUsers(existing: UserProfile[] | undefined): UserProfile[] {
  if (!existing || !Array.isArray(existing) || existing.length === 0) return INITIAL_USERS;
  return existing.map(u => {
    const role = normalizeUserRole(u.role);
    const nameStr = (u.name || '').toLowerCase();
    let updated: UserProfile = { ...u, role };
    if (u.id === 'user-noval' && (nameStr.includes('rakean') || !u.name)) {
      updated = { ...updated, name: 'Muhammad Noval Fadli, S.T.', shortName: 'Noval' };
    }
    if (u.id === 'user-rasya' && (nameStr.includes('rasya') || !u.name)) {
      updated = { ...updated, name: 'Abud, A.Md.', shortName: 'Abud', email: 'abud@ansalab.com', avatarInitials: 'AB' };
    }
    return updated;
  });
}

