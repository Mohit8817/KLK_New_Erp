/**
 * SSL AMC Assign Light service (UP + Bihar)
 * UP     : https://klkerp.com/api/user/dle/up/ssl/amc
 * Bihar  : https://klkerp.com/api/user/dle/bihar/ssl/amc
 */
import { getDleToken } from './dleServices';

const ROOT = (import.meta.env.VITE_KLKERP_API_BASE_URL ?? 'https://klkerp.com').replace(/\/+$/, '');
export const UP_SSL_AMC_BASE = `${ROOT}/api/user/dle/up/ssl/amc`;
export const BIHAR_SSL_AMC_BASE = `${ROOT}/api/user/dle/bihar/ssl/amc`;

export interface Option { value: string; label: string }

/** Normalize backend responses into an array */
export const toArray = (json: any): any[] => {
  if (Array.isArray(json)) return json;
  const KEYS = ['assign', 'assigns', 'users', 'volumes', 'districts', 'blocks', 'panchayats', 'list', 'rows', 'records', 'items', 'data'];
  const walk = (d: any, depth: number): any[] => {
    if (Array.isArray(d)) return d;
    if (!d || typeof d !== 'object' || depth > 3) return [];
    for (const k of KEYS) {
      if (d[k] !== undefined) {
        const r = walk(d[k], depth + 1);
        if (r.length || Array.isArray(d[k])) return r;
      }
    }
    // Check for any array-valued property
    for (const k of Object.keys(d)) if (Array.isArray(d[k])) return d[k];
    return [];
  };
  return walk(json, 0);
};

/** Convert objects/primitives into {value, label} option pairs, removing empty values & duplicates */
export const toOptions = (json: any): Option[] => {
  const seen = new Set<string>();
  const out: Option[] = [];
  toArray(json).forEach((o: any) => {
    let value: any; let label: any;
    if (o === null || o === undefined) return;
    if (typeof o === 'string' || typeof o === 'number') { value = o; label = o; }
    else {
      value = o.id ?? o.value ?? o.user_id ?? o.district_id ?? o.block_id ?? o.panchayat_id ??
        o.volume ?? o.district ?? o.block ?? o.panchayat ?? o.name;
      label = o.name ?? o.label ?? o.user_name ?? o.district_name ?? o.block_name ?? o.panchayat_name ??
        o.volume_name ?? o.volume ?? o.district ?? o.block ?? o.panchayat ?? value;
    }
    if (value === null || value === undefined || String(value).trim() === '') return;
    const v = String(value);
    if (seen.has(v)) return;
    seen.add(v);
    out.push({ value: v, label: String(label) });
  });
  return out;
};

async function request<T = any>(url: string, options: RequestInit = {}, params?: Record<string, string | number>): Promise<T> {
  const token = getDleToken();
  const qs = params ? '?' + new URLSearchParams(params as any).toString() : '';
  const method = (options.method || 'GET').toUpperCase();
  const isWrite = method !== 'GET';

  const res = await fetch(url + qs, {
    ...options,
    // Write (POST) requests par redirect follow mat karo.
    // Backend save karke redirect()->back() karta hai (Referer = localhost:5173),
    // jise browser follow karke CORS error deta hai.
    ...(isWrite ? { redirect: 'manual' as RequestRedirect } : {}),
    headers: {
      Accept: 'application/json',
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  // POST ke baad backend ne redirect kiya => data save ho chuka hai
  if (isWrite && (res.type === 'opaqueredirect' || (res.status >= 300 && res.status < 400))) {
    return { success: true, message: 'Assigned successfully.' } as any;
  }

  let json: any = null;
  try { json = await res.json(); } catch { /* non-json */ }

  if (!res.ok) {
    const err = new Error(json?.message || `API Error ${res.status}`) as any;
    err.status = res.status;
    err.errors = json?.errors; // Laravel validation errors (field -> [messages])
    throw err;
  }
  return json;
}

/* ───────────── Uttar Pradesh ───────────── */
export const upSslAmc = {
  getDistricts: (signal?: AbortSignal) => request(`${UP_SSL_AMC_BASE}/district`, { method: 'GET', signal }),                         // GET
  getBlocks: (district: string, signal?: AbortSignal) => request(`${UP_SSL_AMC_BASE}/fetch-block`, { method: 'GET', signal }, { district, district_id: district }),       // GET
  getPanchayats: (block: string, district: string, signal?: AbortSignal) => request(`${UP_SSL_AMC_BASE}/fetch-panchayat`, { method: 'GET', signal }, { block, block_id: block, district }),     // GET
  storeAssignLight: (payload: Record<string, any>) => request(`${UP_SSL_AMC_BASE}/store-assign-light`, { method: 'POST', body: JSON.stringify(payload) }), // POST
  viewAssignLight: (signal?: AbortSignal) => request(`${UP_SSL_AMC_BASE}/view-assign-light`, { method: 'GET', signal }),              // GET
};

/* ───────────── Bihar ───────────── */
export const biharSslAmc = {
  getVolumes: (signal?: AbortSignal) => request(`${BIHAR_SSL_AMC_BASE}/volume`, { method: 'GET', signal }),                           // GET
  getDistricts: (volume: string, signal?: AbortSignal) => request(`${BIHAR_SSL_AMC_BASE}/fetch-district`, { method: 'GET', signal }, { volume }),       // GET
  getBlocks: (district: string, volume: string, signal?: AbortSignal) => request(`${BIHAR_SSL_AMC_BASE}/fetch-block`, { method: 'GET', signal }, { district, district_id: district, volume }),   // GET
  getPanchayats: (block: string, district: string, volume: string, signal?: AbortSignal) => request(`${BIHAR_SSL_AMC_BASE}/fetch-panchayat`, { method: 'GET', signal }, { block, block_id: block, district, volume }), // GET
  storeAssignLight: (payload: Record<string, any>) => request(`${BIHAR_SSL_AMC_BASE}/store-assign-light`, { method: 'POST', body: JSON.stringify(payload) }), // POST
  viewAssignLight: (signal?: AbortSignal) => request(`${BIHAR_SSL_AMC_BASE}/view-assign-light`, { method: 'GET', signal }),           // GET
};