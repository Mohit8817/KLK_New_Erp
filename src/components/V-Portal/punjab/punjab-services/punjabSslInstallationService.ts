import { API_BASE_URL, authService } from '../../../../services/authService';
import { PUNJAB_API } from '../../V_Portal_APIS/Punjab_API';

/* ── Backend & Media Base URLs ── */
export const BACKEND_BASE = (API_BASE_URL || 'https://klkerp.com/api')
  .replace(/\/api\/?$/, '')
  .replace(/\/+$/, '');

export const R2_BASE = ((import.meta.env.VITE_R2_PUBLIC_URL as string | undefined) ?? '').replace(/\/+$/, '');

/**
 * Normalizes media paths into full valid candidates for Punjab SSL images.
 * Files are uploaded to uploads/punjab/installation/ssl/light/
 */
export function getPunjabMediaCandidates(path?: string | null): string[] {
  if (!path || typeof path !== 'string') return [];
  const clean = path.trim();
  if (!clean) return [];

  if (/^(https?:)?\/\//i.test(clean) || clean.startsWith('data:') || clean.startsWith('blob:')) {
    return [clean];
  }

  const normalized = clean.replace(/^\/+/, '');
  const filename = normalized.split('/').pop() || normalized;
  const candidates: string[] = [];

  if (normalized.startsWith('uploads/')) {
    candidates.push(`${BACKEND_BASE}/${normalized}`);
  } else if (normalized.startsWith('storage/')) {
    candidates.push(`${BACKEND_BASE}/${normalized}`);
  }

  // Punjab SSL specific upload path per documentation
  candidates.push(`${BACKEND_BASE}/uploads/punjab/installation/ssl/light/${filename}`);
  candidates.push(`${BACKEND_BASE}/uploads/punjab/installation/ssl/${filename}`);
  candidates.push(`${BACKEND_BASE}/uploads/punjab/installation/${filename}`);
  candidates.push(`${BACKEND_BASE}/uploads/${filename}`);
  candidates.push(`${BACKEND_BASE}/${normalized}`);

  if (R2_BASE) {
    candidates.push(`${R2_BASE}/uploads/punjab/installation/ssl/light/${filename}`);
    candidates.push(`${R2_BASE}/${filename}`);
  }

  return Array.from(new Set(candidates));
}

export function resolvePunjabMediaUrl(path?: string | null): string {
  if (!path) return '';
  if (/^(https?:|data:|blob:)/i.test(path)) return path;
  const candidates = getPunjabMediaCandidates(path);
  return candidates[0] || `${BACKEND_BASE}/${path.replace(/^\/+/, '')}`;
}

export const getMediaUrl = resolvePunjabMediaUrl;

/**
 * Universal token getter
 */
export const getAuthToken = (): string | null => {
  return (
    authService.getToken() ||
    localStorage.getItem('token') ||
    localStorage.getItem('access_token') ||
    localStorage.getItem('authToken') ||
    localStorage.getItem('accessToken') ||
    localStorage.getItem('klk_auth_token') ||
    sessionStorage.getItem('token') ||
    sessionStorage.getItem('access_token') ||
    sessionStorage.getItem('klk_auth_token') ||
    null
  );
};

/**
 * Universal company_id getter
 */
export const getCompanyId = (): string => {
  const fromAuth = authService.getCompanyId();
  if (fromAuth) return String(fromAuth).trim();

  const session = authService.getSession() as any;
  const raw = authService.getRawResponse() as any;

  const candidate =
    localStorage.getItem('company_id') ||
    localStorage.getItem('klk_company_id') ||
    sessionStorage.getItem('company_id') ||
    session?.company_id ||
    session?.companyId ||
    session?.vendor?.company_id ||
    session?.user?.company_id ||
    raw?.company_id ||
    raw?.user?.company_id ||
    raw?.data?.company_id ||
    raw?.data?.user?.company_id ||
    '1';

  return String(candidate).trim();
};

/* ═════════════════════════════════════════════════════════════════════════
   Type Definitions for Punjab SSL Installation
   ═════════════════════════════════════════════════════════════════════════ */

export interface PunjabAssignedLightItem {
  id: number;
  company_id?: number | string;
  state?: string;
  vendor?: string;
  district?: string;
  block?: string;
  panchayat?: string;
  start_date?: string;
  end_date?: string;
  site_count?: number;
  status: number; // 0 = Inactive, 1 = Assigned, 2 = Accepted
  created_at?: string;
  updated_at?: string;
  [key: string]: any;
}

export interface PunjabLightDropdownItem {
  id?: number;
  unique_id: string;
  panchayat?: string;
  district?: string;
  block?: string;
  [key: string]: any;
}

export interface PunjabLightDetail {
  id: number;
  state?: string;
  district?: string;
  block?: string;
  panchayat?: string;
  beneficiary_name?: string;
  contact_no?: string;
  sarpanch_name?: string;
  sarpanch_contact?: string;
  phase?: string;
  wo_no?: string;
  ward_no?: string | null;
  pole_no?: string | null;
  uuid_no?: string | null;
  battery_serial_no?: string | null;
  panel_no?: string | null;
  light_no?: string | null;
  unique_id?: string;
  latitude?: string;
  longitude?: string;
  light_file?: string;
  light_file2?: string;
  remark?: string;
  inst_remark?: string;
  inst_status?: number;
  inst_accept?: number;
  inst_date?: string;
  inst_verify_status?: number;
  inst_claim_status?: number;
  inst_pay_status?: number;
  [key: string]: any;
}

export interface PunjabInstalledLightItem {
  id: number;
  state?: string;
  district?: string;
  block?: string;
  panchayat?: string;
  unique_id?: string;
  wo_no?: string;
  phase?: string;
  beneficiary_name?: string;
  contact_no?: string;
  ward_no?: string;
  uuid_no?: string;
  pole_no?: string;
  light_no?: string;
  panel_no?: string;
  battery_serial_no?: string;
  latitude?: string;
  longitude?: string;
  light_file?: string;
  light_file2?: string;
  inst_status?: number;
  inst_accept?: number;
  inst_date?: string;
  inst_verify_status?: number; // 0 = Pending, 1 = Approved, 2 = Rejected
  inst_claim_status?: number;  // 0 = Not Raised, 1 = Raised/Pending, 2 = Approved, 3 = Rejected
  inst_pay_status?: number;    // 0 = Pending, 1 = Paid
  remark?: string;
  inst_remark?: string;
  [key: string]: any;
}

export interface PunjabInstallDetailSummary {
  total: number;
  complete: number;
  pending: number;
  verify_approved: number;
  verify_pending: number;
  verify_reject: number;
  claim_applicable: number;
  claim_raised: number;
  claim_not_applicable?: number;
  claim_verify_approved?: number;
  claim_verify_pending?: number;
  claim_verify_reject?: number;
  payment_complete: number;
  payment_pending: number;
  [key: string]: any;
}

export interface PunjabCompleteLightsResponse {
  vendor?: { id?: number; name?: string; company_id?: number };
  company_id?: number;
  loginId?: number;
  role?: string;
  parent_id?: number;
  install_detail?: PunjabInstallDetailSummary;
  claimedapplicable1?: number[];
  paymentlights?: PunjabInstalledLightItem[];
  completelights?: PunjabInstalledLightItem[];
  complete_lights?: PunjabInstalledLightItem[];
  payment_lights?: PunjabInstalledLightItem[];
  [key: string]: any;
}

export interface PunjabDashboardSsl {
  light_count: number;
  site_assigned: number;
  site_not_assigned: number;
  complete: number;
  pending: number;
  verify_pending: number;
  verify_approved: number;
  verify_reject: number;
  claim_applicable: number;
  claim_raised: number;
  claim_approved: number;
  claim_pending: number;
  claim_reject: number;
  inst_pay_done: number;
  inst_pay_pending: number;
  [key: string]: any;
}

export interface PunjabDistrictInstall {
  district: string;
  inst_complete: number;
}

export interface PunjabDistrictwise {
  district: string;
  light_count: number;
  site_assigned: number;
  site_not_assigned: number;
  complete: number;
  pending: number;
  verify_pending: number;
  verify_approved: number;
  verify_reject: number;
  claim_applicable: number;
  claim_raised: number;
  claim_approved: number;
  claim_pending: number;
  claim_reject: number;
  inst_pay_done: number;
  inst_pay_pending: number;
}

export interface PunjabMonthlyInstallation {
  month_year: string;
  monthly_installations: number;
}

export interface PunjabDashboardData {
  vendor?: { id?: number; name?: string };
  company_id?: number;
  loginId?: number;
  role?: string;
  parent_id?: number;
  ssl: PunjabDashboardSsl;
  payment_amount: string | number;
  district_install?: PunjabDistrictInstall[];
  districtwise?: PunjabDistrictwise[];
  district_installation_month?: PunjabMonthlyInstallation[];
  [key: string]: any;
}

export interface PunjabStatusDrillRow {
  id: number;
  unique_id?: string;
  district?: string;
  block?: string;
  panchayat?: string;
  inst_status?: number;
  [key: string]: any;
}

/* ═════════════════════════════════════════════════════════════════════════
   Punjab SSL Installation Service Class
   ═════════════════════════════════════════════════════════════════════════ */

class PunjabSslInstallationService {
  // In-memory cache for mapping unique_id -> numeric id (punjab_ssls.id)
  private uidToIdMap: Map<string, number> = new Map();

  private getHeaders(isMultipart = false): HeadersInit {
    const headers: Record<string, string> = {
      Accept: 'application/json',
    };
    const token = getAuthToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    if (!isMultipart) {
      headers['Content-Type'] = 'application/json';
    }
    return headers;
  }

  /* ─────────────────────────────────────────────────────────────────────────
     1. View Assigned Lights
     GET /punjab/ssl/installation/view-assigned-light
     Vendor ko assign hui Punjab SSL entries (status != 0).
     ───────────────────────────────────────────────────────────────────────── */
  async getAssignedLights(): Promise<PunjabAssignedLightItem[]> {
    try {
      const res = await fetch(PUNJAB_API.INSTALLATION.SSL.VIEW_ASSIGNED_LIGHTS, {
        method: 'GET',
        headers: this.getHeaders(),
      });
      if (res.ok) {
        const json = await res.json().catch(() => null);
        if (Array.isArray(json?.data)) {
          return json.data;
        }
        if (Array.isArray(json)) {
          return json;
        }
      }
    } catch (err) {
      console.error('[Punjab SSL] getAssignedLights error:', err);
    }
    return [];
  }

  /* ─────────────────────────────────────────────────────────────────────────
     2. Accept Assigned Lights
     GET /punjab/ssl/installation/update-status-assigned-light?light_id={light_id}
     light_id = assign_ssl_to_vendors.id
     ───────────────────────────────────────────────────────────────────────── */
  async acceptAssignedLight(lightId: number | string): Promise<{ status: boolean; message: string; data?: any }> {
    const res = await fetch(PUNJAB_API.INSTALLATION.SSL.ACCEPT_ASSIGNED(lightId), {
      method: 'GET',
      headers: this.getHeaders(),
    });
    const json = await res.json().catch(() => null);
    if (!res.ok || json?.status === false) {
      let errMsg = json?.message || json?.error;
      if (json?.errors) {
        errMsg = Object.values(json.errors).flat()[0] as string;
      }
      throw new Error(String(errMsg || 'Failed to accept light assignment.'));
    }
    return {
      status: true,
      message: json?.message || 'Status Changed Successfully!!!',
      data: json?.data,
    };
  }

  /* ─────────────────────────────────────────────────────────────────────────
     3. Fetch Light List
     GET /punjab/ssl/installation/fetch-light
     Installation ke liye ready lights (dropdown): inst_vendor = parent_id,
     inst_status = 0, inst_accept = 1.
     Note: Since fetch-light only provides { unique_id, panchayat }, we also
     enrich options with numeric id from view-dashboard/not-installed-light so
     API 4 & 5 (which require integer light_id) work flawlessly!
     ───────────────────────────────────────────────────────────────────────── */
  async fetchLightNames(): Promise<PunjabLightDropdownItem[]> {
    try {
      // 1. Fetch from official fetch-light endpoint
      const res = await fetch(PUNJAB_API.INSTALLATION.SSL.FETCH_LIGHT_NAMES, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      let lightList: PunjabLightDropdownItem[] = [];
      if (res.ok) {
        const json = await res.json().catch(() => null);
        if (Array.isArray(json?.data)) {
          lightList = json.data;
        } else if (Array.isArray(json)) {
          lightList = json;
        }
      }

      // Check if items already have numeric id
      const hasNumericId = lightList.length > 0 && lightList.every((item) => Number.isFinite(Number(item.id)) && Number(item.id) > 0);

      // If missing numeric ids or list is empty, query not-installed-light to bridge unique_id -> id
      if (!hasNumericId) {
        try {
          const readyLights = await this.getDashboardByStatus('not-installed-light');
          if (Array.isArray(readyLights) && readyLights.length > 0) {
            // Build dictionary: unique_id -> id
            readyLights.forEach((rl: any) => {
              if (rl.unique_id && rl.id) {
                this.uidToIdMap.set(String(rl.unique_id).trim(), Number(rl.id));
              }
            });

            if (lightList.length > 0) {
              // Enrich existing items with id
              lightList = lightList.map((item) => {
                const uid = String(item.unique_id || '').trim();
                const matchedId = this.uidToIdMap.get(uid);
                return {
                  ...item,
                  id: item.id || matchedId,
                };
              });
            } else {
              // If fetch-light returned empty but not-installed-light has records, use readyLights!
              lightList = readyLights.map((rl: any) => ({
                id: rl.id,
                unique_id: rl.unique_id,
                panchayat: rl.panchayat,
                district: rl.district,
                block: rl.block,
              }));
            }
          }
        } catch (enrichErr) {
          console.warn('[Punjab SSL] enrich fetchLightNames error:', enrichErr);
        }
      }

      // Save all discovered mappings
      lightList.forEach((item) => {
        if (item.unique_id && item.id) {
          this.uidToIdMap.set(String(item.unique_id).trim(), Number(item.id));
        }
      });

      return lightList;
    } catch (err) {
      console.error('[Punjab SSL] fetchLightNames error:', err);
    }
    return [];
  }

  /* ─────────────────────────────────────────────────────────────────────────
     4. Fetch Light Details
     GET /punjab/ssl/installation/fetch-light-deatils?light_id={light_id}
     light_id (integer): required, punjab_ssls.id me exist kare
     ───────────────────────────────────────────────────────────────────────── */
  async fetchLightDetail(lightId: number | string): Promise<PunjabLightDetail | null> {
    try {
      let resolvedId = lightId;
      // If a non-numeric string (e.g. "PB-SSL-0001") was passed, resolve its numeric id
      if (typeof lightId === 'string' && !/^\d+$/.test(lightId.trim())) {
        const cached = this.uidToIdMap.get(lightId.trim());
        if (cached) {
          resolvedId = cached;
        } else {
          // Attempt on-the-fly resolution via not-installed-light
          await this.fetchLightNames();
          const secondCheck = this.uidToIdMap.get(lightId.trim());
          if (secondCheck) resolvedId = secondCheck;
        }
      }

      const res = await fetch(PUNJAB_API.INSTALLATION.SSL.FETCH_LIGHT_DETAILS(resolvedId), {
        method: 'GET',
        headers: this.getHeaders(),
      });
      if (res.ok) {
        const json = await res.json().catch(() => null);
        if (json?.data) {
          if (json.data.unique_id && json.data.id) {
            this.uidToIdMap.set(String(json.data.unique_id).trim(), Number(json.data.id));
          }
          return json.data;
        }
        if (json && !('data' in json)) {
          return json;
        }
      }
    } catch (err) {
      console.error('[Punjab SSL] fetchLightDetail error:', err);
    }
    return null;
  }

  /* ─────────────────────────────────────────────────────────────────────────
     5. Store Light Details (Install Light)
     POST /punjab/ssl/installation/store-deatils-light
     multipart/form-data
     ssl_id (integer): required, punjab_ssls.id
     ───────────────────────────────────────────────────────────────────────── */
  async storeLightDetails(formData: FormData): Promise<{ status: boolean; message: string; data?: any }> {
    // Ensure ssl_id is numeric
    const rawSslId = formData.get('ssl_id');
    if (rawSslId && typeof rawSslId === 'string' && !/^\d+$/.test(rawSslId.trim())) {
      const resolved = this.uidToIdMap.get(rawSslId.trim());
      if (resolved) {
        formData.set('ssl_id', String(resolved));
      }
    }

    const res = await fetch(PUNJAB_API.INSTALLATION.SSL.STORE_LIGHT_DETAILS, {
      method: 'POST',
      headers: this.getHeaders(true),
      body: formData,
    });
    const json = await res.json().catch(() => null);
    if (!res.ok || json?.status === false) {
      if (res.status === 422 && json?.errors) {
        const first = Object.values(json.errors).flat()[0] as string;
        throw new Error(first || json.message || 'Validation failed. Please verify entered serials and inputs.');
      }
      if (res.status === 403) {
        throw new Error(json?.message || 'Light is not assigned or accepted by you!');
      }
      if (res.status === 409) {
        throw new Error(json?.message || 'Light is already installed!');
      }
      if (res.status === 404) {
        throw new Error(json?.message || 'Light not found in company records.');
      }
      throw new Error(json?.message || json?.error || `Failed to install light (HTTP ${res.status})`);
    }
    return {
      status: true,
      message: json?.message || 'Light Install Successfully!!!',
      data: json?.data,
    };
  }

  /* ─────────────────────────────────────────────────────────────────────────
     6. Update Install Light (Load)
     GET /punjab/ssl/installation/update-install-light?ssl_id={ssl_id}
     ssl_id (integer): required
     ───────────────────────────────────────────────────────────────────────── */
  async getUpdateInstallLightLoad(sslId: number | string): Promise<PunjabLightDetail | null> {
    try {
      let resolvedId = sslId;
      if (typeof sslId === 'string' && !/^\d+$/.test(sslId.trim())) {
        const cached = this.uidToIdMap.get(sslId.trim());
        if (cached) resolvedId = cached;
      }

      const res = await fetch(PUNJAB_API.INSTALLATION.SSL.UPDATE_INSTALL_LIGHT_LOAD(resolvedId), {
        method: 'GET',
        headers: this.getHeaders(),
      });
      if (res.ok) {
        const json = await res.json().catch(() => null);
        if (json?.data) return json.data;
        if (json && !('data' in json)) return json;
      }
    } catch (err) {
      console.error('[Punjab SSL] getUpdateInstallLightLoad error:', err);
    }
    return null;
  }

  /* ─────────────────────────────────────────────────────────────────────────
     7. Update Install Light Store
     POST /punjab/ssl/installation/update-install-light-store
     multipart/form-data
     ssl_id (integer): required
     ───────────────────────────────────────────────────────────────────────── */
  async updateInstallLightStore(formData: FormData): Promise<{ status: boolean; message: string; data?: any }> {
    const rawSslId = formData.get('ssl_id');
    if (rawSslId && typeof rawSslId === 'string' && !/^\d+$/.test(rawSslId.trim())) {
      const resolved = this.uidToIdMap.get(rawSslId.trim());
      if (resolved) {
        formData.set('ssl_id', String(resolved));
      }
    }

    const res = await fetch(PUNJAB_API.INSTALLATION.SSL.UPDATE_INSTALL_LIGHT_STORE, {
      method: 'POST',
      headers: this.getHeaders(true),
      body: formData,
    });
    const json = await res.json().catch(() => null);
    if (!res.ok || json?.status === false) {
      if (res.status === 422 && json?.errors) {
        const first = Object.values(json.errors).flat()[0] as string;
        throw new Error(first || json.message || 'Validation failed. Check unique serial values.');
      }
      if (res.status === 403) {
        throw new Error(json?.message || 'Light is not assigned to you!');
      }
      if (res.status === 409) {
        throw new Error(json?.message || 'Light is not installed yet, nothing to update!');
      }
      if (res.status === 404) {
        throw new Error(json?.message || 'Light not found!');
      }
      throw new Error(json?.message || json?.error || `Failed to update light details (HTTP ${res.status})`);
    }
    return {
      status: true,
      message: json?.message || 'Light Details Updated Successfully!!!',
      data: json?.data,
    };
  }

  /* ─────────────────────────────────────────────────────────────────────────
     8. View Complete Lights
     GET /punjab/ssl/installation/complete-light
     Vendor ki lights ka count-summary aur lists.
     ───────────────────────────────────────────────────────────────────────── */
  async getCompleteLights(): Promise<PunjabCompleteLightsResponse | null> {
    try {
      const res = await fetch(PUNJAB_API.INSTALLATION.SSL.COMPLETE_LIGHTS, {
        method: 'GET',
        headers: this.getHeaders(),
      });
      if (res.ok) {
        const json = await res.json().catch(() => null);
        if (json?.data) {
          return json.data;
        }
        if (json && (json.install_detail || json.completelights || json.paymentlights || json.complete_lights)) {
          return json;
        }
      }
    } catch (err) {
      console.error('[Punjab SSL] getCompleteLights error:', err);
    }
    return null;
  }

  /* ─────────────────────────────────────────────────────────────────────────
     9. Installation Dashboard
     GET /punjab/ssl/installation/dashboard
     Overall summary, payment amount, district-wise breakdown aur month-wise count.
     ───────────────────────────────────────────────────────────────────────── */
  async getDashboardData(): Promise<PunjabDashboardData | null> {
    try {
      const res = await fetch(PUNJAB_API.INSTALLATION.SSL.DASHBOARD, {
        method: 'GET',
        headers: this.getHeaders(),
      });
      if (res.ok) {
        const json = await res.json().catch(() => null);
        if (json?.data) {
          return json.data;
        }
        if (json?.ssl) {
          return json;
        }
      }
    } catch (err) {
      console.error('[Punjab SSL] getDashboardData error:', err);
    }
    return null;
  }

  /* ─────────────────────────────────────────────────────────────────────────
     10. View Dashboard By Status
     GET /punjab/ssl/installation/view-dashboard/{status}
     status: total-light, assign-light, not-assign-light, installed-light,
             not-installed-light, verify-light, verify-pending-light,
             verify-reject-light, claim-applicable, claim-raised,
             claim-approved, claim-pending, pay-done, pay-pending
     ───────────────────────────────────────────────────────────────────────── */
  async getDashboardByStatus(status: string): Promise<PunjabStatusDrillRow[]> {
    try {
      const res = await fetch(PUNJAB_API.INSTALLATION.SSL.DASHBOARD_BY_STATUS(status), {
        method: 'GET',
        headers: this.getHeaders(),
      });
      if (res.ok) {
        const json = await res.json().catch(() => null);
        let list: PunjabStatusDrillRow[] = [];
        if (Array.isArray(json?.data)) {
          list = json.data;
        } else if (Array.isArray(json)) {
          list = json;
        }
        list.forEach((r) => {
          if (r.unique_id && r.id) {
            this.uidToIdMap.set(String(r.unique_id).trim(), Number(r.id));
          }
        });
        return list;
      }
    } catch (err) {
      console.error('[Punjab SSL] getDashboardByStatus error:', err);
    }
    return [];
  }

  /* ─────────────────────────────────────────────────────────────────────────
     11. Districtwise By Status
     GET /punjab/ssl/installation/districtwise-view-data/{status}/{district}
     ───────────────────────────────────────────────────────────────────────── */
  async getDashboardByDistrictStatus(status: string, district: string): Promise<PunjabStatusDrillRow[]> {
    try {
      const res = await fetch(PUNJAB_API.INSTALLATION.SSL.DISTRICTWISE_BY_STATUS(status, district), {
        method: 'GET',
        headers: this.getHeaders(),
      });
      if (res.ok) {
        const json = await res.json().catch(() => null);
        if (Array.isArray(json?.data)) {
          return json.data;
        }
        if (Array.isArray(json)) {
          return json;
        }
      }
    } catch (err) {
      console.error('[Punjab SSL] getDashboardByDistrictStatus error:', err);
    }
    return [];
  }
}

export const punjabSslInstallationService = new PunjabSslInstallationService();
export default punjabSslInstallationService;
