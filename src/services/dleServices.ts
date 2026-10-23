/**
 * DLE (Digital Light & Energy) Service
 *
 * Central API Client for DLE endpoints hosted on
 * https://klkdle.klkventures.cloud
 */

import { authService } from './authService';

export const KLKERP_API_BASE_URL = (
  (import.meta as any).env?.VITE_API_BASE_URL ||
  (import.meta as any).env?.VITE_KLKERP_API_BASE_URL ||
  'https://klkerp.com/api'
).replace(/\/+$/, '');

export const DLE_BASE_URL = (
  import.meta.env.VITE_DLE_API_BASE_URL ?? ''
).replace(/\/+$/, '');


export const APPROVAL_APPROVED = 1;
 
/** Backend `status` values for POST /api/admin/approval/status */
export const APPROVAL_PENDING = 0;
export const APPROVAL_REJECTED = 2;

export const DLE_ENDPOINTS = {
  // Bihar ULA
  BIHAR_ULA_LIST: `${DLE_BASE_URL}/api/bihar/ula/list`,
  BIHAR_ULA_DETAIL: (id: string | number) =>
    `${DLE_BASE_URL}/api/bihar/ula/${id}`,
  BIHAR_ULA_DOWNLOAD_IMAGES: (id: string | number) =>
    `${DLE_BASE_URL}/api/bihar/ula/${id}/download-images`,

  // Admin Management
  ADMIN_USERS: `${DLE_BASE_URL}/api/admin/users`,
  ADMIN_APPROVAL_STATUS: `${DLE_BASE_URL}/api/admin/approval/status`,
  ADMIN_APPROVE_BY_ID: (id: string | number) =>
    `${DLE_BASE_URL}/api/admin/approve/${id}`,

  // UP AMC
  UP_AMC_LIGHT_LIST: `${DLE_BASE_URL}/api/up/amc/light/list`,
  // GET /api/light-amc/get?region=up  (region zaroori hai)
  UP_AMC_LIGHT_GET: `${DLE_BASE_URL}/api/light-amc/get`,

  // Bihar AMC
  BIHAR_AMC_LIGHT_LIST: `${DLE_BASE_URL}/api/bihar/amc/light/list`,
  // GET /api/light-amc/get?region=bihar  (region zaroori hai)
  BIHAR_AMC_LIGHT_GET: `${DLE_BASE_URL}/api/light-amc/get`,

  // AMC approval (Bihar / UP) — SSL AMC documents
  BIHAR_AMC_APPROVAL_STATUS: `${DLE_BASE_URL}/api/bihar/ssl-amc/approval/status`,
  UP_AMC_APPROVAL_STATUS: `${DLE_BASE_URL}/api/up/ssl-amc/approval/status`,

  // AMC LIGHT approval (Bihar / UP) — survey light records
  UP_AMC_LIGHT_APPROVAL_STATUS: `${DLE_BASE_URL}/api/up/amc/light/approval/status`,
  BIHAR_AMC_LIGHT_APPROVAL_STATUS: `${DLE_BASE_URL}/api/bihar/amc/light/approval/status`,
  UP_AMC_LIGHT_APPROVAL_LIST: `${DLE_BASE_URL}/api/up/amc/light/approval/list`,
  BIHAR_AMC_LIGHT_APPROVAL_LIST: `${DLE_BASE_URL}/api/bihar/amc/light/approval/list`,
  UP_AMC_LIGHT_APPROVAL_PENDING: `${DLE_BASE_URL}/api/up/amc/light/approval/pending`,
  BIHAR_AMC_LIGHT_APPROVAL_PENDING: `${DLE_BASE_URL}/api/bihar/amc/light/approval/pending`,
  DLE_DASHBOARD_INTEGRATION: `${DLE_BASE_URL}/api/portal/integration/dle-dashboard`,
  ATTENDANCE_INTEGRATION_LIST: `${DLE_BASE_URL}/api/attendance/integration/list`,

  // DLE UP KUSUM-C AMC (Base URL: https://klkerp.com/api)
  UP_KUSUMC_AMC_DISTRICT: `${KLKERP_API_BASE_URL}/dle/up/kusumc/amc/district`,
  UP_KUSUMC_AMC_BLOCK: `${KLKERP_API_BASE_URL}/dle/up/kusumc/amc/block`,
  UP_KUSUMC_AMC_PANCHAYAT: `${KLKERP_API_BASE_URL}/dle/up/kusumc/amc/panchayat`,
  UP_KUSUMC_AMC_STORE: `${KLKERP_API_BASE_URL}/dle/up/kusumc/amc/store`,
  UP_KUSUMC_AMC_VIEW: `${KLKERP_API_BASE_URL}/dle/up/kusumc/amc/view`,
};

export const getDleToken = (): string | null => {
  return (
    authService.getToken() ||
    localStorage.getItem('token') ||
    localStorage.getItem('access_token') ||
    localStorage.getItem('authToken') ||
    localStorage.getItem('accessToken') ||
    localStorage.getItem('klk_auth_token') ||
    sessionStorage.getItem('token') ||
    sessionStorage.getItem('klk_auth_token') ||
    null
  );
};

/**
 * NOTE: Token yahan nahi bheja jaata. Portal key/secret
 * (X-Portal-Api-Key / X-Portal-Api-Secret) Vite proxy lagata hai.
 */
export const getDleAuthHeaders = (
  extraHeaders?: Record<string, string>
): Record<string, string> => {
  const env = (import.meta as any).env || {};
  const apiKey = env.VITE_DLE_API_KEY || env.DLE_API_KEY;
  const apiSecret = env.VITE_DLE_API_SECRET || env.DLE_API_SECRET;

  return {
    Accept: 'application/json',
    ...(apiKey ? { 'X-Portal-Api-Key': apiKey } : {}),
    ...(apiSecret ? { 'X-Portal-Api-Secret': apiSecret } : {}),
    ...(extraHeaders || {}),
  };
};

/**
 * Handles:
 * []
 * { data: [] }
 * { users: [] }
 * { data: { users: [] } }
 */
export interface Option {
  value: string;
  label: string;
}

/** Backend response kuch bhi ho (array / {data: []}) -> hamesha array */
export const toArray = (json: any): any[] => {
  if (Array.isArray(json)) return json;
  const KEYS = [
    'districts', 'f_districts', 'district', 'f_district',
    'blocks', 'f_blocks', 'block', 'f_block',
    'panchayats', 'f_panchayats', 'panchayat', 'f_panchayat',
    'assign', 'assigns', 'users', 'volumes', 'list', 'rows', 'records', 'items', 'data'
  ];
  const walk = (d: any, depth: number): any[] => {
    if (Array.isArray(d)) return d;
    if (!d || typeof d !== 'object' || depth > 3) return [];
    for (const k of KEYS) {
      if (d[k] !== undefined) {
        const r = walk(d[k], depth + 1);
        if (r.length || Array.isArray(d[k])) return r;
      }
    }
    for (const k of Object.keys(d)) if (Array.isArray(d[k])) return d[k];
    return [];
  };
  return walk(json, 0);
};

/** {id, name} / {district: '...'} -> {value, label} options */
export const toOptions = (json: any): Option[] => {
  const seen = new Set<string>();
  const out: Option[] = [];
  toArray(json).forEach((o: any) => {
    let value: any;
    let label: any;
    if (o === null || o === undefined) return;
    if (typeof o === 'string' || typeof o === 'number') {
      value = o;
      label = o;
    } else {
      const geo =
        o.f_district ??
        o.f_block ??
        o.f_panchayat ??
        o.district ??
        o.district_name ??
        o.block ??
        o.block_name ??
        o.panchayat ??
        o.panchayat_name ??
        o.volume ??
        o.volume_name;

      value =
        geo ??
        o.id ??
        o.value ??
        o.user_id ??
        o.district_id ??
        o.block_id ??
        o.panchayat_id ??
        o.name;

      label =
        o.name ??
        o.label ??
        o.user_name ??
        o.f_district ??
        o.district_name ??
        o.district ??
        o.f_block ??
        o.block_name ??
        o.block ??
        o.f_panchayat ??
        o.panchayat_name ??
        o.panchayat ??
        o.volume_name ??
        o.volume ??
        value;
    }
    if (value === null || value === undefined || String(value).trim() === '') return;
    const v = String(value);
    if (seen.has(v)) return;
    seen.add(v);
    out.push({ value: v, label: String(label) });
  });
  return out;
};

export const extractList = (res: any): any[] => {
  if (Array.isArray(res)) return res;
  if (Array.isArray(res?.data)) return res.data;
  if (Array.isArray(res?.users)) return res.users;
  if (Array.isArray(res?.data?.users)) return res.data.users;
  if (Array.isArray(res?.data?.data)) return res.data.data;

  return [];
};

/* ─────────────────────────────────────────────────────────────
   Company filter
   Login user ki company_id (klkerp.com login se) ko
   admin/users ki company_id se match karta hai.
   ───────────────────────────────────────────────────────────── */

const normId = (v: any): string => String(v ?? '').trim().toLowerCase();

/**
 * admin/users record se company id nikalta hai.
 * Backend ke field name alag ho to yahin add kar do.
 */
export const getRecordCompanyId = (u: any): string =>
  normId(
    u?.company_id ??
      u?.companyId ??
      u?.company_code ??
      u?.company?.company_id ??
      u?.company?.id
  );

/**
 * Sirf wahi records jinki company_id login user ki company_id se match kare.
 * Login user ki company_id nahi hai (vendor / missing) → empty list.
 */
export const filterByCompany = <T = any>(list: T[]): T[] => {
  const mine = normId(authService.getCompanyId());

  return list.filter((u) => {
    const rec = getRecordCompanyId(u);

    // company_id null / "" / "null" → hamesha show
    if (!rec || rec === 'null' || rec === 'undefined') return true;

    // same company → show
    return !!mine && rec === mine;
  });
};

/** Logged-in user ki company_id (khaali ho to '') — original case me, approve/reject payload ke liye */
export const getLoginCompanyId = (): string =>
  String(authService.getCompanyId() ?? '').trim();

/**
 * STRICT: sirf wahi records jinki company_id login user ki company_id ke barabar ho.
 * Record ki company_id null/khaali ho → HIDE.
 * Login user ki company_id na ho → empty list.
 */
export const filterByCompanyStrict = <T = any>(list: T[]): T[] => {
  const mine = normId(authService.getCompanyId());

  if (!mine) return [];

  return list.filter((u) => {
    const rec = getRecordCompanyId(u);

    if (!rec || rec === 'null' || rec === 'undefined') return false;

    return rec === mine;
  });
};


export const isApprovedUser = (u: any): boolean =>
  Number(u?.approval_status) === APPROVAL_APPROVED;

/** Sirf approved users (approval_status === 1) */
export const filterApproved = <T = any>(list: T[]): T[] =>
  list.filter(isApprovedUser);

/** Payload for POST /api/admin/approval/status (matches approveUserController) */
export interface UpdateApprovalPayload {
  /** User id */
  id: string | number;
  /** 0 = Pending, 1 = Approved, 2 = Rejected */
  status: number;
  /** Remark — mandatory for rejection */
  approval_remarks: string;
  /** Optional: company_id to save on the user while approving / rejecting */
  company_id?: string | number;
}

/** Payload for POST /api/{bihar|up}/ssl-amc/approval/status  &  /api/{bihar|up}/amc/light/approval/status */
export interface AmcApprovalPayload {
  /** AMC record id */
  id: string | number;
  /** 0 = Pending, 1 = Approved, 2 = Rejected */
  approval_status: number;
  /** Rejection par mandatory */
  approval_remarks?: string;
  approval_by?: string | number;
}

/** Query params for GET /api/{bihar|up}/amc/light/approval/list */
export interface AmcLightApprovalListParams {
  /** 0 pending, 1 approved, 2 rejected; khaali / 'all' = sab */
  approval_status?: number | 'all';
  /** 'all' (default) ya 'mine' (tab user_id zaroori) */
  scope?: 'all' | 'mine';
  user_id?: string | number;
  district?: string;
  block?: string;
  panchayat?: string;
  page?: number;
  limit?: number;
  [key: string]: string | number | undefined;
}

/** undefined / null / '' values hata kar query string banata hai */
const buildQuery = (params?: Record<string, unknown>): string => {
  if (!params) return '';

  const sp = new URLSearchParams();

  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null || v === '') return;
    sp.append(k, String(v));
  });

  const s = sp.toString();

  return s ? `?${s}` : '';
};

export class DleService {
  /**
   * Helper request function with auto header and error resolution
   */
  private async request<T = any>(
    url: string,
    options: RequestInit = {}
  ): Promise<T> {
    const headers = getDleAuthHeaders(
      options.headers as Record<string, string>
    );

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (!response.ok) {
        let errorMsg = `API Error ${response.status}`;

        if (response.status === 401) {
          errorMsg =
            'API error 401 — login token missing or expired. Please verify your login credentials.';
        } else if (response.status === 403) {
          errorMsg =
            'API error 403 — access forbidden. Insufficient permissions for this DLE endpoint.';
        } else if (response.status === 404) {
          errorMsg = 'API error 404 — resource not found.';
        }

        try {
          const errData = await response.json();

          // Validation errors (e.g. { errors: { field: ['msg'] } })
          const detail = errData?.errors
            ? Object.values(errData.errors).flat().join(', ')
            : '';

          if (errData?.message) {
            errorMsg = errData.message;
          } else if (detail) {
            errorMsg = detail;
          }
        } catch {
          // Ignore non-JSON error responses
        }

        const err = new Error(errorMsg) as any;
        err.status = response.status;

        throw err;
      }

      const json = await response.json();

      return json;
    } catch (err: any) {
      if (err.name === 'AbortError') {
        throw err;
      }

      if (
        err.name === 'TypeError' &&
        err.message.includes('fetch')
      ) {
        const netErr = new Error(
          'Network Error: Unable to connect to DLE server. Please check your network connection.'
        ) as any;

        netErr.status = 0;

        throw netErr;
      }

      throw err;
    }
  }

  /* ─────────────────────────────────────────────────────────────
     1. Bihar ULA Endpoints
     ───────────────────────────────────────────────────────────── */

  async getBiharUlaList(signal?: AbortSignal) {
    return this.request(
      DLE_ENDPOINTS.BIHAR_ULA_LIST,
      {
        method: 'GET',
        signal,
      }
    );
  }

  async getBiharUlaDetail(
    id: string | number,
    signal?: AbortSignal
  ) {
    return this.request(
      DLE_ENDPOINTS.BIHAR_ULA_DETAIL(id),
      {
        method: 'GET',
        signal,
      }
    );
  }

  async downloadUlaImagesZip(
    id: string | number
  ): Promise<void> {
    const token = getDleToken();

    const url =
      DLE_ENDPOINTS.BIHAR_ULA_DOWNLOAD_IMAGES(id);

    try {
      const res = await fetch(url, {
        method: 'GET',
        headers: token
          ? {
              Authorization: `Bearer ${token}`,
            }
          : {},
      });

      if (!res.ok) {
        throw new Error(
          `Download failed with status ${res.status}`
        );
      }

      const blob = await res.blob();

      const blobUrl =
        window.URL.createObjectURL(blob);

      const link =
        document.createElement('a');

      link.href = blobUrl;
      link.download =
        `bihar_ula_${id}_images.zip`;

      document.body.appendChild(link);

      link.click();

      document.body.removeChild(link);

      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      window.open(url, '_blank');
      throw err;
    }
  }

  /* ─────────────────────────────────────────────────────────────
     2. Admin Users & Approval Endpoints
     ───────────────────────────────────────────────────────────── */

  /**
   * Get DLE admin users (RAW response, bina company filter ke).
   *
   * State filtering is handled by the page because the same
   * API is used by both Bihar and Uttar Pradesh pages.
   *
   * cache: 'no-store' → approve/reject ke baad hamesha fresh list aaye,
   * browser purani (stale) list na de.
   */
  async getAdminUsers(signal?: AbortSignal) {
    return this.request(
      DLE_ENDPOINTS.ADMIN_USERS,
      {
        method: 'GET',
        cache: 'no-store',
        signal,
      }
    );
  }

  /**
   * Get DLE admin users sirf login user ki company_id ke hisaab se.
   * Returns: filtered ARRAY (response object nahi).
   */
  async getCompanyAdminUsers(signal?: AbortSignal): Promise<any[]> {
    const res = await this.getAdminUsers(signal);

    return filterByCompany(extractList(res));
  }

  /**
   * Approve / Reject / Pending a user.
   * Backend: POST /api/admin/approval/status
   * Body: { id, status (0|1|2), approval_remarks, company_id? }
   */
  async updateApprovalStatus(
    payload: UpdateApprovalPayload,
    signal?: AbortSignal
  ) {
    return this.request(
      DLE_ENDPOINTS.ADMIN_APPROVAL_STATUS,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        signal,
      }
    );
  }

  /**
   * EDIT an already processed user (Approved <-> Rejected).
   * Backend: PATCH /api/admin/approve/:id
   * Body: { status (0|1|2), approval_remarks, company_id? }  (id comes from the URL)
   */
  async editApproval(
    id: string | number,
    payload: Omit<UpdateApprovalPayload, 'id'>,
    signal?: AbortSignal
  ) {
    return this.request(
      DLE_ENDPOINTS.ADMIN_APPROVE_BY_ID(id),
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        signal,
      }
    );
  }

  /* ─────────────────────────────────────────────────────────────
     3. UP Field AMC Endpoints
     ───────────────────────────────────────────────────────────── */

  async getUpAmcLightList(
    signal?: AbortSignal
  ) {
    return this.request(
      DLE_ENDPOINTS.UP_AMC_LIGHT_LIST,
      {
        method: 'GET',
        signal,
      }
    );
  }

  /**
   * UP AMC light survey records.
   * Backend: GET /api/light-amc/get?region=up
   * region default 'up' lagta hai (params me override ho sakta hai).
   */
  async getUpAmcLight(
    params?: Record<string, string | number>,
    signal?: AbortSignal
  ) {
    return this.request(
      `${DLE_ENDPOINTS.UP_AMC_LIGHT_GET}${buildQuery({
        region: 'up',
        company_id: getLoginCompanyId(),
        ...params,
      })}`,
      {
        method: 'GET',
        cache: 'no-store',
        signal,
      }
    );
  }

  /* ─────────────────────────────────────────────────────────────
     4. Bihar Field AMC Endpoints
     ───────────────────────────────────────────────────────────── */

  async getBiharAmcLightList(
    signal?: AbortSignal
  ) {
    return this.request(
      DLE_ENDPOINTS.BIHAR_AMC_LIGHT_LIST,
      {
        method: 'GET',
        signal,
      }
    );
  }

  /**
   * Bihar AMC light survey records.
   * Backend: GET /api/light-amc/get?region=bihar
   * region default 'bihar' lagta hai (params me override ho sakta hai).
   */
  async getBiharAmcLight(
    params?: Record<string, string | number>,
    signal?: AbortSignal
  ) {
    return this.request(
      `${DLE_ENDPOINTS.BIHAR_AMC_LIGHT_GET}${buildQuery({
        region: 'bihar',
        company_id: getLoginCompanyId(),
        ...params,
      })}`,
      {
        method: 'GET',
        cache: 'no-store',
        signal,
      }
    );
  }

  /* ─────────────────────────────────────────────────────────────
     5. AMC Approval (Bihar / UP) — SSL AMC documents
     ───────────────────────────────────────────────────────────── */

  /**
   * Approve / Reject an SSL AMC document record.
   * Backend: POST /api/{bihar|up}/ssl-amc/approval/status
   * company_id login user se automatically jaata hai.
   */
  async updateAmcApproval(
    region: 'bihar' | 'up',
    payload: AmcApprovalPayload,
    signal?: AbortSignal
  ) {
    const url =
      region === 'up'
        ? DLE_ENDPOINTS.UP_AMC_APPROVAL_STATUS
        : DLE_ENDPOINTS.BIHAR_AMC_APPROVAL_STATUS;

    return this.request(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...payload,
        company_id: getLoginCompanyId(),
      }),
      signal,
    });
  }

  /* ─────────────────────────────────────────────────────────────
     6. AMC LIGHT Approval (Bihar / UP) — survey light records
     ───────────────────────────────────────────────────────────── */

  /**
   * AMC Light records approval ke saath (approval fields + image_*_url).
   * Backend: GET /api/{bihar|up}/amc/light/approval/list
   * Response: { success, meta, data: [...] }
   */
  async getAmcLightApprovalList(
    region: 'bihar' | 'up',
    params?: AmcLightApprovalListParams,
    signal?: AbortSignal
  ) {
    const base =
      region === 'up'
        ? DLE_ENDPOINTS.UP_AMC_LIGHT_APPROVAL_LIST
        : DLE_ENDPOINTS.BIHAR_AMC_LIGHT_APPROVAL_LIST;

    return this.request(`${base}${buildQuery(params)}`, {
      method: 'GET',
      cache: 'no-store',
      signal,
    });
  }

  /**
   * Sirf pending (approval_status = 0) AMC Light records.
   * Backend: GET /api/{bihar|up}/amc/light/approval/pending
   */
  async getAmcLightApprovalPending(
    region: 'bihar' | 'up',
    params?: Omit<AmcLightApprovalListParams, 'approval_status'>,
    signal?: AbortSignal
  ) {
    const base =
      region === 'up'
        ? DLE_ENDPOINTS.UP_AMC_LIGHT_APPROVAL_PENDING
        : DLE_ENDPOINTS.BIHAR_AMC_LIGHT_APPROVAL_PENDING;

    return this.request(`${base}${buildQuery(params)}`, {
      method: 'GET',
      cache: 'no-store',
      signal,
    });
  }

  /**
   * Approve / Reject an AMC LIGHT survey record.
   * Backend: POST /api/{bihar|up}/amc/light/approval/status
   * Body: { id, approval_status (0|1|2), approval_remarks, approval_by?, company_id }
   * Reject par approval_remarks mandatory.
   */
  async updateAmcLightApproval(
    region: 'bihar' | 'up',
    payload: AmcApprovalPayload,
    signal?: AbortSignal
  ) {
    const url =
      region === 'up'
        ? DLE_ENDPOINTS.UP_AMC_LIGHT_APPROVAL_STATUS
        : DLE_ENDPOINTS.BIHAR_AMC_LIGHT_APPROVAL_STATUS;

    return this.request(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...payload,
        company_id: getLoginCompanyId(),
      }),
      signal,
    });
  }

  /**
   * Get DLE Portal Integration Dashboard Summary Data
   * Backend: GET /api/portal/integration/dle-dashboard
   */
  async getDleDashboardIntegration(signal?: AbortSignal) {
    return this.request(DLE_ENDPOINTS.DLE_DASHBOARD_INTEGRATION, {
      method: 'GET',
      signal,
    });
  }

  /**
   * Get Attendance Integration List
   * Backend: GET /api/attendance/integration/list
   */
  /**
   * Helper request function for klkerp.com endpoints (Bearer token auth + Laravel error resolution)
   */
  async requestKlkerp<T = any>(
    url: string,
    options: RequestInit = {},
    params?: Record<string, unknown>
  ): Promise<T> {
    const token = getDleToken();
    const qs = params ? buildQuery(params) : '';
    const method = (options.method || 'GET').toUpperCase();
    const isWrite = method !== 'GET';

    const headers: Record<string, string> = {
      Accept: 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...((options.headers as Record<string, string>) || {}),
    };

    try {
      const res = await fetch(url + qs, {
        ...options,
        ...(isWrite ? { redirect: 'manual' as RequestRedirect } : {}),
        headers,
      });

      // POST ke baad backend ne redirect kiya => data save ho chuka hai
      if (isWrite && (res.type === 'opaqueredirect' || (res.status >= 300 && res.status < 400))) {
        return { success: true, message: 'Assigned successfully.' } as any;
      }

      let json: any = null;
      try {
        json = await res.json();
      } catch {
        // non-json body
      }

      if (!res.ok) {
        let errorMsg = json?.message || `API Error ${res.status}`;
        if (res.status === 401) {
          errorMsg = 'Session expired or unauthenticated. Please log in again.';
        }
        const err = new Error(errorMsg) as any;
        err.status = res.status;
        err.errors = json?.errors;
        throw err;
      }

      return json;
    } catch (err: any) {
      if (err.name === 'AbortError') throw err;
      if (err.name === 'TypeError' && err.message?.includes('fetch')) {
        const netErr = new Error(
          'Network Error: Unable to connect to server. Please check your network connection.'
        ) as any;
        netErr.status = 0;
        throw netErr;
      }
      throw err;
    }
  }

  /* ─────────────────────────────────────────────────────────────
     7. UP KUSUM-C AMC Endpoints (klkerp.com)
     ───────────────────────────────────────────────────────────── */

  /**
   * 1. GET /dle/up/kusumc/amc/district
   */
  async getUpKusumCAmcDistricts(signal?: AbortSignal) {
    return this.requestKlkerp(DLE_ENDPOINTS.UP_KUSUMC_AMC_DISTRICT, {
      method: 'GET',
      signal,
    });
  }

  /**
   * 2. GET /dle/up/kusumc/amc/block
   * Accepts district or district_id as query param
   */
  async getUpKusumCAmcBlocks(
    districtOrParams: string | Record<string, any>,
    signal?: AbortSignal
  ) {
    const params =
      typeof districtOrParams === 'object'
        ? districtOrParams
        : {
            district: districtOrParams,
            district_id: districtOrParams,
            f_district: districtOrParams,
          };

    return this.requestKlkerp(
      DLE_ENDPOINTS.UP_KUSUMC_AMC_BLOCK,
      { method: 'GET', signal },
      params
    );
  }

  /**
   * 3. GET /dle/up/kusumc/amc/panchayat
   * Accepts block, block_id, district, district_id
   */
  async getUpKusumCAmcPanchayats(
    blockOrParams: string | Record<string, any>,
    district?: string,
    signal?: AbortSignal
  ) {
    const params =
      typeof blockOrParams === 'object'
        ? blockOrParams
        : {
            block: blockOrParams,
            block_id: blockOrParams,
            f_block: blockOrParams,
            ...(district
              ? { district, district_id: district, f_district: district }
              : {}),
          };

    return this.requestKlkerp(
      DLE_ENDPOINTS.UP_KUSUMC_AMC_PANCHAYAT,
      { method: 'GET', signal },
      params
    );
  }

  /**
   * 4. POST /dle/up/kusumc/amc/store
   */
  async storeUpKusumCAmc(
    payload: Record<string, any>,
    signal?: AbortSignal
  ) {
    return this.requestKlkerp(DLE_ENDPOINTS.UP_KUSUMC_AMC_STORE, {
      method: 'POST',
      body: JSON.stringify(payload),
      signal,
    });
  }

  /**
   * 5. GET /dle/up/kusumc/amc/view
   */
  async getUpKusumCAmcView(
    params?: Record<string, any>,
    signal?: AbortSignal
  ) {
    return this.requestKlkerp(
      DLE_ENDPOINTS.UP_KUSUMC_AMC_VIEW,
      { method: 'GET', signal },
      params
    );
  }

  async getAttendanceList(
    params?: {
      user_id?: string | number;
      date_from?: string;
      date_to?: string;
      year?: string | number;
      month?: string | number;
    },
    signal?: AbortSignal
  ) {
    const qs = params ? buildQuery(params) : '';
    return this.request(`${DLE_ENDPOINTS.ATTENDANCE_INTEGRATION_LIST}${qs}`, {
      method: 'GET',
      cache: 'no-store',
      signal,
    });
  }
}

export const dleService = new DleService();

export const upKusumCAmc = {
  getDistricts: (signal?: AbortSignal) => dleService.getUpKusumCAmcDistricts(signal),
  getBlocks: (districtOrParams: string | Record<string, any>, signal?: AbortSignal) =>
    dleService.getUpKusumCAmcBlocks(districtOrParams, signal),
  getPanchayats: (blockOrParams: string | Record<string, any>, district?: string, signal?: AbortSignal) =>
    dleService.getUpKusumCAmcPanchayats(blockOrParams, district, signal),
  storeAssign: (payload: Record<string, any>, signal?: AbortSignal) =>
    dleService.storeUpKusumCAmc(payload, signal),
  viewAssign: (params?: Record<string, any>, signal?: AbortSignal) =>
    dleService.getUpKusumCAmcView(params, signal),
};

export default dleService;