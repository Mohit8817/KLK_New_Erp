import { useState, useEffect } from 'react';
import { API_BASE_URL } from './authService';
import { normState } from './stateAccess';

export interface ModuleActionPermissions {
  survey?: number | boolean;
  installation?: number | boolean;
  amc?: number | boolean;
  complaint?: number | boolean;
  [key: string]: any;
}

export type VPortalPermissionsMap = Record<string, ModuleActionPermissions>;

export interface PermissionsApiResponse {
  success: boolean;
  permissions?: VPortalPermissionsMap;
  message?: string;
  data?: any;
}

const STORAGE_KEY = 'klk_vportal_permissions';
const RAW_BASE = (API_BASE_URL || 'https://klkerp.com/api').replace(/\/+$/, '');
export const PERMISSIONS_API_URL = `${RAW_BASE}/permissions`;

/**
 * Baseline fallback permissions matching exact production ERP API response
 * Ensures zero dummy data and safe immediate fallback when offline or loading
 */
export const DEFAULT_VPORTAL_PERMISSIONS: VPortalPermissionsMap = {
  assam_swp: { survey: 0, installation: 1, amc: 0, complaint: 1 },
  bihar_ssl: { survey: 1, installation: 1, amc: 1, complaint: 1 },
  bihar_srt: { survey: 1, installation: 1, amc: 1, complaint: 1 },
  bihar_ula: { survey: 1, installation: 1, amc: 1, complaint: 1 },
  jammu_ssl: { survey: 1, installation: 1, amc: 1, complaint: 1 },
  jammu_srt70mw: { survey: 1, installation: 1, amc: 1, complaint: 1 },
  jammu_swp: { survey: 1, installation: 1, amc: 1, complaint: 1 },
  jk_resco: { survey: 1, installation: 1, amc: 1, complaint: 1 },
  kashmir_srt70mw: { survey: 1, installation: 1, amc: 1, complaint: 1 },
  goa_srt: { survey: 1, installation: 1, amc: 1, complaint: 1 },
  karnataka_swp: { survey: 0, installation: 1, amc: 0, complaint: 1 },
  punjab_ssl: { survey: 0, installation: 1, amc: 0, complaint: 1 },
  arunachal_shl: { survey: 0, installation: 1, amc: 0, complaint: 1 },
  up_resco: { survey: 1, installation: 1, amc: 1, complaint: 1 },
  up_ssl: { survey: 1, installation: 1, amc: 1, complaint: 1 },
  up_swp: { survey: 0, installation: 1, amc: 1, complaint: 1 },
  up_kusumb: { survey: 0, installation: 0, amc: 1, complaint: 1 },
  up_ongrid: { survey: 0, installation: 0, amc: 1, complaint: 1 },
  up_offgrid: { survey: 0, installation: 0, amc: 1, complaint: 1 },
  up_powerpack: { survey: 0, installation: 0, amc: 1, complaint: 1 },
  up_srlmsrt: { survey: 0, installation: 0, amc: 0, complaint: 1 },
  up_ssl18w: { survey: 0, installation: 0, amc: 1, complaint: 1 },
  up_srt: { survey: 1, installation: 0, amc: 0, complaint: 1 },
};

/**
 * Mapping of state codes to all their associated permission keys
 */
export const STATE_PERMISSION_KEYS: Record<string, string[]> = {
  up: [
    'up_resco',
    'up_ssl',
    'up_swp',
    'up_kusumb',
    'up_ongrid',
    'up_offgrid',
    'up_powerpack',
    'up_srlmsrt',
    'up_ssl18w',
    'up_srt',
  ],
  bihar: ['bihar_ssl', 'bihar_srt', 'bihar_ula'],
  assam: ['assam_swp'],
  karnataka: ['karnataka_swp'],
  punjab: ['punjab_ssl'],
  arunachal: ['arunachal_shl'],
  goa: ['goa_srt'],
  jammu: ['jammu_ssl', 'jammu_srt70mw', 'jammu_swp', 'jk_resco'],
  kashmir: ['kashmir_srt70mw'],
};

/**
 * Specific subgroup mapping to permission key & action
 */
export const SUBGROUP_PERMISSION_MAP: Record<string, { key: string; action: 'survey' | 'installation' | 'amc' | 'complaint' }> = {
  // UP
  'up.survey.srt': { key: 'up_srt', action: 'survey' },
  'up.survey.resco': { key: 'up_resco', action: 'survey' },
  'up.survey.ssl': { key: 'up_ssl', action: 'survey' },
  'up.installation.resco': { key: 'up_resco', action: 'installation' },
  'up.installation.ssl': { key: 'up_ssl', action: 'installation' },
  'up.installation.kusum-c': { key: 'up_swp', action: 'installation' },
  'up.amc.resco': { key: 'up_resco', action: 'amc' },
  'up.amc.kusum-c': { key: 'up_swp', action: 'amc' },
  'up.amc.kusum-b': { key: 'up_kusumb', action: 'amc' },
  'up.amc.powerpack': { key: 'up_powerpack', action: 'amc' },
  'up.amc.ongrid': { key: 'up_ongrid', action: 'amc' },
  'up.amc.offgrid': { key: 'up_offgrid', action: 'amc' },
  'up.amc.ssl': { key: 'up_ssl', action: 'amc' },
  'up.amc.ssl-18w': { key: 'up_ssl18w', action: 'amc' },
  'up.complaint.resco': { key: 'up_resco', action: 'complaint' },
  'up.complaint.ssl': { key: 'up_ssl', action: 'complaint' },
  'up.complaint.kusum-c': { key: 'up_swp', action: 'complaint' },
  'up.complaint.kusum-b': { key: 'up_kusumb', action: 'complaint' },
  'up.complaint.ongrid': { key: 'up_ongrid', action: 'complaint' },
  'up.complaint.offgrid': { key: 'up_offgrid', action: 'complaint' },
  'up.complaint.powerpack': { key: 'up_powerpack', action: 'complaint' },
  'up.complaint.srlmsrt': { key: 'up_srlmsrt', action: 'complaint' },

  // BIHAR
  'bihar.survey.srt200mw': { key: 'bihar_srt', action: 'survey' },
  'bihar.survey.ula': { key: 'bihar_ula', action: 'survey' },
  'bihar.installation.ssl': { key: 'bihar_ssl', action: 'installation' },
  'bihar.installation.srt': { key: 'bihar_srt', action: 'installation' },
  'bihar.installation.ula': { key: 'bihar_ula', action: 'installation' },
  'bihar.amc.ssl': { key: 'bihar_ssl', action: 'amc' },
  'bihar.amc.srt': { key: 'bihar_srt', action: 'amc' },
  'bihar.complaints.ssl': { key: 'bihar_ssl', action: 'complaint' },
  'bihar.complaints.srt': { key: 'bihar_srt', action: 'complaint' },

  // ASSAM
  'assam.installation.swp': { key: 'assam_swp', action: 'installation' },

  // KARNATAKA
  'karnataka.installation.swp': { key: 'karnataka_swp', action: 'installation' },

  // PUNJAB
  'punjab.installation.ssl': { key: 'punjab_ssl', action: 'installation' },

  // ARUNACHAL
  'arunachal.installation.shl': { key: 'arunachal_shl', action: 'installation' },

  // GOA
  'goa.survey.srt': { key: 'goa_srt', action: 'survey' },
  'goa.installation.srt': { key: 'goa_srt', action: 'installation' },
  'goa.amc.srt': { key: 'goa_srt', action: 'amc' },

  // JAMMU
  'jammu.survey.resco': { key: 'jk_resco', action: 'survey' },
  'jammu.survey.srt-70mw': { key: 'jammu_srt70mw', action: 'survey' },
  'jammu.installation.resco': { key: 'jk_resco', action: 'installation' },
  'jammu.installation.srt-70mw': { key: 'jammu_srt70mw', action: 'installation' },
  'jammu.installation.ssl': { key: 'jammu_ssl', action: 'installation' },
  'jammu.installation.swp': { key: 'jammu_swp', action: 'installation' },
  'jammu.expenses.srt-70mw': { key: 'jammu_srt70mw', action: 'installation' },

  // KASHMIR
  'kashmir.survey.srt-70mw': { key: 'kashmir_srt70mw', action: 'survey' },
  'kashmir.installation.srt-70mw': { key: 'kashmir_srt70mw', action: 'installation' },
  'kashmir.expenses.srt-70mw': { key: 'kashmir_srt70mw', action: 'installation' },
};

let inMemoryPermissions: VPortalPermissionsMap | null = null;
const listeners = new Set<(perms: VPortalPermissionsMap) => void>();

/** Token helper */
function getToken(): string | null {
  try {
    const raw = localStorage.getItem('klk_user_session') || sessionStorage.getItem('klk_user_session');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed?.token) return parsed.token;
    }
  } catch {}
  return (
    localStorage.getItem('klk_auth_token') ||
    localStorage.getItem('token') ||
    sessionStorage.getItem('token') ||
    null
  );
}

/**
 * Get stored permissions (from memory cache -> localStorage -> DEFAULT)
 */
export function getStoredVPortalPermissions(): VPortalPermissionsMap {
  if (inMemoryPermissions) return inMemoryPermissions;

  try {
    const stored = localStorage.getItem(STORAGE_KEY) || sessionStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed && typeof parsed === 'object' && Object.keys(parsed).length > 0) {
        inMemoryPermissions = parsed;
        return parsed;
      }
    }
  } catch (err) {
    console.warn('[VPortalPermissions] Failed to parse stored permissions:', err);
  }

  inMemoryPermissions = { ...DEFAULT_VPORTAL_PERMISSIONS };
  return inMemoryPermissions;
}

/**
 * Save permissions to memory and localStorage, notifying all subscribers
 */
export function saveVPortalPermissions(perms: VPortalPermissionsMap): void {
  if (!perms || typeof perms !== 'object') return;
  inMemoryPermissions = { ...perms };

  try {
    const json = JSON.stringify(perms);
    localStorage.setItem(STORAGE_KEY, json);
    sessionStorage.setItem(STORAGE_KEY, json);
  } catch (err) {
    console.warn('[VPortalPermissions] Failed to persist permissions:', err);
  }

  listeners.forEach((listener) => {
    try {
      listener(perms);
    } catch (e) {
      console.error('[VPortalPermissions] Listener notification error:', e);
    }
  });
}

/**
 * Fetch permissions from https://klkerp.com/api/permissions
 */
export async function fetchVPortalPermissions(force = false): Promise<VPortalPermissionsMap> {
  if (!force && inMemoryPermissions) {
    // If we already have fresh in-memory permissions, fetch asynchronously in background
    fetchFromApi().catch(() => {});
    return inMemoryPermissions;
  }

  return fetchFromApi();
}

async function fetchFromApi(): Promise<VPortalPermissionsMap> {
  const token = getToken();
  const headers: Record<string, string> = {
    Accept: 'application/json',
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  try {
    const res = await fetch(PERMISSIONS_API_URL, {
      method: 'GET',
      headers,
      credentials: 'include',
    });

    if (!res.ok) {
      console.warn(`[VPortalPermissions] API request returned status ${res.status}`);
      return getStoredVPortalPermissions();
    }

    const data: PermissionsApiResponse = await res.json();

    if (data?.success && data?.permissions && typeof data.permissions === 'object') {
      saveVPortalPermissions(data.permissions);
      return data.permissions;
    }

    if (data?.data?.permissions && typeof data.data.permissions === 'object') {
      saveVPortalPermissions(data.data.permissions);
      return data.data.permissions;
    }

    return getStoredVPortalPermissions();
  } catch (err) {
    console.warn('[VPortalPermissions] Error fetching permissions from API:', err);
    return getStoredVPortalPermissions();
  }
}

/**
 * Subscribe to permission changes
 */
export function subscribeToPermissions(listener: (perms: VPortalPermissionsMap) => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

const isTruthy = (v: any) => v === 1 || v === true || v === '1';

/**
 * Check if a state is permitted based on the permissions API
 * Rule: "1 hoga to show krna hai state verna nhi"
 * If at least one key for this state has ANY operation == 1 (or true), the state is permitted.
 */
export function isStatePermitted(state: string, perms?: VPortalPermissionsMap): boolean {
  if (!state) return true; // non-state items (e.g. common vendor services)
  const nState = normState(state);
  const p = perms || getStoredVPortalPermissions();

  // 1. Direct key lookup from STATE_PERMISSION_KEYS
  const mappedKeys = STATE_PERMISSION_KEYS[nState];
  if (mappedKeys && mappedKeys.length > 0) {
    for (const k of mappedKeys) {
      const item = p[k];
      if (item) {
        if (
          isTruthy(item.survey) ||
          isTruthy(item.installation) ||
          isTruthy(item.amc) ||
          isTruthy(item.complaint)
        ) {
          return true;
        }
      }
    }
  }

  // 2. Generic prefix matching: any key starting with `${nState}_`
  for (const [key, item] of Object.entries(p)) {
    const keyLower = key.toLowerCase();
    if (keyLower.startsWith(`${nState}_`) || (nState === 'jammu' && keyLower.startsWith('jk_'))) {
      if (
        isTruthy(item.survey) ||
        isTruthy(item.installation) ||
        isTruthy(item.amc) ||
        isTruthy(item.complaint)
      ) {
        return true;
      }
    }
  }

  // All 0s or not found in permissions -> state is NOT shown
  return false;
}

/**
 * Check if a specific subgroup (or operation) is permitted
 */
export function isSubgroupPermitted(subgroupId: string, perms?: VPortalPermissionsMap): boolean {
  if (!subgroupId) return true;
  if (subgroupId.startsWith('common.')) return true;

  const p = perms || getStoredVPortalPermissions();
  const mapping = SUBGROUP_PERMISSION_MAP[subgroupId];

  if (mapping) {
    const item = p[mapping.key];
    if (!item) return false;
    const val = item[mapping.action];
    return isTruthy(val);
  }

  // Fallback heuristic: check if state itself is permitted
  const parts = subgroupId.split('.');
  if (parts.length >= 2) {
    const state = parts[0];
    const category = parts[1] as 'survey' | 'installation' | 'amc' | 'complaints' | 'complaint' | 'expenses';
    const sub = parts[2];

    const action = category === 'complaints' ? 'complaint' : category === 'expenses' ? 'installation' : category;
    const candidateKey = `${state}_${sub}`.replace(/-/g, '');
    for (const [k, item] of Object.entries(p)) {
      if (k.toLowerCase().replace(/_/g, '') === candidateKey.toLowerCase()) {
        const val = item[action as keyof ModuleActionPermissions];
        return isTruthy(val);
      }
    }

    return isStatePermitted(state, p);
  }

  return true;
}

/**
 * Get list of all currently permitted state names (normalized)
 */
export function getPermittedStates(perms?: VPortalPermissionsMap): string[] {
  const p = perms || getStoredVPortalPermissions();
  const result: string[] = [];

  for (const state of Object.keys(STATE_PERMISSION_KEYS)) {
    if (isStatePermitted(state, p)) {
      result.push(state);
    }
  }

  return result;
}

/**
 * React Hook for V-Portal permissions
 */
export function useVPortalPermissions() {
  const [permissions, setPermissions] = useState<VPortalPermissionsMap>(() => getStoredVPortalPermissions());
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Subscribe to store updates
    const unsubscribe = subscribeToPermissions((newPerms) => {
      setPermissions(newPerms);
    });

    // Trigger API fetch
    setLoading(true);
    fetchVPortalPermissions(true)
      .then((data) => {
        setPermissions(data);
        setError(null);
      })
      .catch((err) => {
        console.warn('[useVPortalPermissions] Fetch error:', err);
        setError(err?.message || 'Failed to fetch permissions');
      })
      .finally(() => {
        setLoading(false);
      });

    return unsubscribe;
  }, []);

  const refresh = async () => {
    setLoading(true);
    try {
      const data = await fetchVPortalPermissions(true);
      setPermissions(data);
      setError(null);
    } catch (err: any) {
      setError(err?.message || 'Failed to refresh permissions');
    } finally {
      setLoading(false);
    }
  };

  return {
    permissions,
    loading,
    error,
    refresh,
    isStatePermitted: (state: string) => isStatePermitted(state, permissions),
    isSubgroupPermitted: (subgroupId: string) => isSubgroupPermitted(subgroupId, permissions),
    permittedStates: getPermittedStates(permissions),
  };
}

export default {
  PERMISSIONS_API_URL,
  DEFAULT_VPORTAL_PERMISSIONS,
  STATE_PERMISSION_KEYS,
  SUBGROUP_PERMISSION_MAP,
  getStoredVPortalPermissions,
  saveVPortalPermissions,
  fetchVPortalPermissions,
  subscribeToPermissions,
  isStatePermitted,
  isSubgroupPermitted,
  getPermittedStates,
  useVPortalPermissions,
};
