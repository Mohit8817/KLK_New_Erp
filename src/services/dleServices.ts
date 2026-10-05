/**
 * DLE (Digital Light & Energy) Service
 *
 * Central API Client for DLE endpoints hosted on
 * https://klkdle.klkventures.cloud
 */

import { authService } from './authService';

export const DLE_BASE_URL = (
  import.meta.env.VITE_DLE_API_BASE_URL ?? ''
).replace(/\/+$/, '');


export const APPROVAL_APPROVED = 1;

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

  // UP AMC
  UP_AMC_LIGHT_LIST: `${DLE_BASE_URL}/api/up/amc/light/list`,
  UP_AMC_LIGHT_GET: `${DLE_BASE_URL}/api/up/amc/light/get`,

  // Bihar AMC
  BIHAR_AMC_LIGHT_LIST: `${DLE_BASE_URL}/api/bihar/amc/light/list`,
  BIHAR_AMC_LIGHT_GET: `${DLE_BASE_URL}/api/bihar/amc/light/get`,
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

export const getDleAuthHeaders = (
  extraHeaders?: Record<string, string>
): Record<string, string> => ({
  Accept: 'application/json',
  ...(extraHeaders || {}),
});

/**
 * Handles:
 * []
 * { data: [] }
 * { users: [] }
 * { data: { users: [] } }
 */
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
   Matches the logged-in user's company_id with admin/users company_id.
   ───────────────────────────────────────────────────────────── */

const normId = (v: any): string => String(v ?? '').trim().toLowerCase();

/**
 * Extracts company id from an admin/user record.
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
 * Filter records matching current user's company_id.
 */
export const filterByCompany = <T = any>(list: T[]): T[] => {
  const mine = normId(authService.getCompanyId());

  return list.filter((u) => {
    const rec = getRecordCompanyId(u);

    // If company_id is null / empty / undefined -> show by default
    if (!rec || rec === 'null' || rec === 'undefined') return true;

    // Same company -> show
    return !!mine && rec === mine;
  });
};

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

          if (errData?.message) {
            errorMsg = errData.message;
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
   */
  async getAdminUsers(signal?: AbortSignal) {
    return this.request(
      DLE_ENDPOINTS.ADMIN_USERS,
      {
        method: 'GET',
        signal,
      }
    );
  }

  /**
   * Get DLE admin users filtered by logged-in user's company_id.
   * Returns: filtered array of users.
   */
  async getCompanyAdminUsers(signal?: AbortSignal): Promise<any[]> {
    const res = await this.getAdminUsers(signal);

    return filterByCompany(extractList(res));
  }

  async updateApprovalStatus(
    payload: {
      user_id: string | number;
      approval_status: number;
      id?: string | number;
    },
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

  async getUpAmcLight(
    params?: Record<string, string | number>,
    signal?: AbortSignal
  ) {
    const query = params
      ? '?' +
        new URLSearchParams(
          params as any
        ).toString()
      : '';

    return this.request(
      `${DLE_ENDPOINTS.UP_AMC_LIGHT_GET}${query}`,
      {
        method: 'GET',
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

  async getBiharAmcLight(
    params?: Record<string, string | number>,
    signal?: AbortSignal
  ) {
    const query = params
      ? '?' +
        new URLSearchParams(
          params as any
        ).toString()
      : '';

    return this.request(
      `${DLE_ENDPOINTS.BIHAR_AMC_LIGHT_GET}${query}`,
      {
        method: 'GET',
        signal,
      }
    );
  }
}

export const dleService = new DleService();

export default dleService;