import { Sample, PurchaseOrder } from '../types';

export interface PendingOfflineUpdate {
  id: string;
  timestamp: string;
  sampleId: string;
  poId: string;
  updatedSample: Sample;
}

const OFFLINE_QUEUE_KEY = 'ansa_offline_queue';

/**
 * Get current pending updates from offline storage
 */
export const getOfflineQueue = (): PendingOfflineUpdate[] => {
  try {
    const raw = localStorage.getItem(OFFLINE_QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error('Error reading offline queue:', e);
    return [];
  }
};

/**
 * Add an updated sample to the offline queue
 */
export const queueOfflineSampleUpdate = (poId: string, updatedSample: Sample): PendingOfflineUpdate[] => {
  const queue = getOfflineQueue();
  const existingIdx = queue.findIndex(q => q.sampleId === updatedSample.id);
  
  const newItem: PendingOfflineUpdate = {
    id: `queue-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    timestamp: new Date().toISOString(),
    sampleId: updatedSample.id,
    poId: poId || updatedSample.poId,
    updatedSample,
  };

  let nextQueue: PendingOfflineUpdate[];
  if (existingIdx >= 0) {
    nextQueue = [...queue];
    nextQueue[existingIdx] = newItem;
  } else {
    nextQueue = [...queue, newItem];
  }

  try {
    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(nextQueue));
  } catch (e) {
    console.error('Failed to save offline queue:', e);
  }

  return nextQueue;
};

/**
 * Clear the offline queue after successful sync
 */
export const clearOfflineQueue = (): void => {
  try {
    localStorage.removeItem(OFFLINE_QUEUE_KEY);
  } catch (e) {
    console.error('Failed to clear offline queue:', e);
  }
};

/**
 * Sync all pending offline items into main PO list
 */
export const syncOfflineQueueToPos = (
  pos: PurchaseOrder[],
  setPos: React.Dispatch<React.SetStateAction<PurchaseOrder[]>>
): { syncedCount: number } => {
  const queue = getOfflineQueue();
  if (queue.length === 0) return { syncedCount: 0 };

  let count = 0;
  setPos(prevPos => {
    let nextPos = [...prevPos];

    queue.forEach(item => {
      nextPos = nextPos.map(po => {
        if (po.id !== item.poId && !po.samples.some(s => s.id === item.sampleId)) return po;
        const nextSamples = po.samples.map(s => s.id === item.sampleId ? item.updatedSample : s);
        count++;
        return {
          ...po,
          samples: nextSamples,
          updatedAt: new Date().toISOString(),
        };
      });
    });

    // Save to localStorage
    try {
      localStorage.setItem('ansa_lab_pos', JSON.stringify(nextPos));
      
      // Post to backend sync API if available
      fetch('/api/sync-pos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nextPos),
      }).catch(err => console.log('Backend sync offline fallback:', err));
    } catch (e) {
      console.error('Failed to persist POS during offline sync:', e);
    }

    return nextPos;
  });

  clearOfflineQueue();
  return { syncedCount: count };
};

// ─── GLOBAL STANDARDIZED MOBILE ↔ WEB APP SYNC HELPERS ──────────────────────

/**
 * Clean string representation of numeric inputs.
 * Automatically converts Indonesian decimal commas (',') to dots ('.') and strips whitespace.
 */
export const cleanIndoNumStr = (val: any): string => {
  if (val === undefined || val === null) return '';
  return String(val).replace(',', '.').trim();
};

/**
 * Safely parse any numeric input into a float, supporting both commas and dots.
 */
export const parseIndoFloat = (val: any): number => {
  if (val === undefined || val === null || val === '') return 0;
  const cleaned = String(val).replace(',', '.').trim();
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
};

/**
 * Safely call toUpperCase on any string value with nullish guarding.
 */
export const safeUpper = (val: any): string => {
  if (val === undefined || val === null) return '';
  return String(val).trim().toUpperCase();
};

/**
 * Robust Dual-Key Loader (Reads from Array OR Flat Primitive Keys like field1, field2)
 * Ensures 100% data sync reliability between Mobile HP and Web App Desktop.
 */
export const getArrayOrFlatSync = (
  inputs: Record<string, any>,
  arrKey: string,
  flatPrefix: string,
  count: number
): string[] => {
  if (!inputs) return Array(count).fill('');

  const rawArr = inputs[arrKey];
  if (Array.isArray(rawArr)) {
    const targetLen = Math.max(count, rawArr.length);
    const result: string[] = [];
    for (let i = 0; i < targetLen; i++) {
      result.push(cleanIndoNumStr(rawArr[i] ?? ''));
    }
    return result;
  }

  // Fallback to flat prefix keys ONLY if array key is not present
  let maxIdx = 0;
  Object.keys(inputs).forEach(key => {
    if (key.startsWith(flatPrefix)) {
      const numMatch = key.match(/\d+$/);
      if (numMatch) {
        const idx = parseInt(numMatch[0], 10);
        if (idx > maxIdx) maxIdx = idx;
      }
    }
  });

  const effectiveCount = Math.max(count, maxIdx);
  const result: string[] = [];
  for (let i = 0; i < effectiveCount; i++) {
    const val = inputs[`${flatPrefix}${i + 1}`] ?? inputs[`${flatPrefix}_${i + 1}`] ?? '';
    result.push(cleanIndoNumStr(val));
  }
  return result;
};

/**
 * Create a Dual-Key Payload object containing both Array and Flat Keys for multi-trial tests.
 */
export const buildDualKeyPayload = (
  arrKey: string,
  flatPrefix: string,
  values: (string | number)[],
  padCount = 30
): Record<string, any> => {
  const cleanedArr = (values || []).map(cleanIndoNumStr);
  const payload: Record<string, any> = {
    [arrKey]: cleanedArr,
  };
  const maxLen = Math.max(padCount, cleanedArr.length);
  for (let i = 0; i < maxLen; i++) {
    payload[`${flatPrefix}${i + 1}`] = cleanedArr[i] ?? '';
  }
  return payload;
};

