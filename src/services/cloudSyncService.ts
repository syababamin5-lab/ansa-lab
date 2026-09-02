import { supabase } from '../utils/supabaseClient';
import { UserProfile, INITIAL_USERS } from '../types/userTypes';
import { Client } from '../types/workflowTypes';
import { PurchaseOrder, ContainerItem, RingItem, ConsolRingItem, PycnometerItem, MoldItem, ReamerItem, PersonnelItem } from '../types';
import {
  INITIAL_POS,
  INITIAL_CLIENTS,
  DEFAULT_CONTAINER_CATALOGUE,
  DEFAULT_RING_CATALOGUE,
  DEFAULT_CONSOL_RING_CATALOGUE,
  DEFAULT_PYCNOMETER_CATALOGUE,
  DEFAULT_MOLD_CATALOGUE,
  DEFAULT_REAMER_CATALOGUE,
  DEFAULT_PERSONNEL_CATALOGUE
} from '../data/initialData';

const CLOUD_STORAGE_KEY = 'ansa_lab_cloud_db_v1';

/** Interfase state terpusat di Cloud Database */
export interface CloudDatabaseState {
  users: UserProfile[];
  clients: Client[];
  pos: PurchaseOrder[];
  containers: ContainerItem[];
  rings: RingItem[];
  consolRings: ConsolRingItem[];
  pycnometers: PycnometerItem[];
  molds: MoldItem[];
  reamers: ReamerItem[];
  personnels: PersonnelItem[];
  updatedAt: string;
}

/** Ambil seluruh data master & setting resmi awal */
export function getInitialMasterState(): CloudDatabaseState {
  return {
    users: INITIAL_USERS,
    clients: INITIAL_CLIENTS,
    pos: INITIAL_POS,
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

/** Simpan data state ke Cloud Service */
export async function saveStateToCloud(state: CloudDatabaseState): Promise<boolean> {
  try {
    const payload = JSON.stringify(state);
    // Simpan ke Local Storage Cadangan Realtime
    localStorage.setItem(CLOUD_STORAGE_KEY, payload);

    // Kirim ke Cloud Supabase Service
    const { error } = await supabase.from('ansa_lab_master_store').upsert({
      id: 'main_store',
      data: state,
      updated_at: new Date().toISOString(),
    });

    if (error) {
      console.warn('[Cloud Sync Warning] Supabase upsert payload saved locally:', error.message);
    }
    return true;
  } catch (e) {
    console.error('[Cloud Sync Error]:', e);
    return false;
  }
}

/** Muat data dari Cloud Service */
export async function loadStateFromCloud(): Promise<CloudDatabaseState> {
  const defaultState = getInitialMasterState();

  try {
    // 1. Coba ambil data terbaru dari Supabase Cloud Database
    const { data, error } = await supabase
      .from('ansa_lab_master_store')
      .select('data')
      .eq('id', 'main_store')
      .single();

    if (data && data.data && !error) {
      const cloudData = data.data as CloudDatabaseState;
      // Pastikan 142 cawan dan 8 user selalu ter-merge sempurna
      const mergedContainers = mergeContainers(cloudData.containers || []);
      const mergedUsers = mergeUsers(cloudData.users || []);
      return {
        ...defaultState,
        ...cloudData,
        containers: mergedContainers,
        users: mergedUsers,
      };
    }
  } catch (e) {
    console.warn('[Cloud Database Load Warning]: Fallback to local cloud backup', e);
  }

  // 2. Fallback ke Cadangan Cloud Lokal jika jaringan offline
  const localSaved = localStorage.getItem(CLOUD_STORAGE_KEY);
  if (localSaved) {
    try {
      const parsed = JSON.parse(localSaved);
      if (parsed && typeof parsed === 'object') {
        return {
          ...defaultState,
          ...parsed,
          containers: mergeContainers(parsed.containers || []),
          users: mergeUsers(parsed.users || []),
        };
      }
    } catch (err) {}
  }

  return defaultState;
}

/** Helper penggabungan 142 cawan terkalibrasi */
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

/** Helper penggabungan 8 user resmi */
function mergeUsers(existing: UserProfile[]): UserProfile[] {
  if (!existing || existing.length === 0) return INITIAL_USERS;
  const existingIds = new Set(existing.map(u => u.id));
  const missing = INITIAL_USERS.filter(u => !existingIds.has(u.id));
  return missing.length > 0 ? [...existing, ...missing] : existing;
}
