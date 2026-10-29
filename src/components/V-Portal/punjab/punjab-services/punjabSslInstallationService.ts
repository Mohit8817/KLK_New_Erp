import { API_BASE_URL, authService } from '../../../../services/authService';
import { PUNJAB_API } from '../../V_Portal_APIS/Punjab_API';

/**
 * Universal token getter for Vendor session
 */
export const getAuthToken = (): string | null => {
  const fromAuth = authService.getToken();
  if (fromAuth) return fromAuth;

  const session = authService.getSession();
  if (session?.token) return session.token;

  try {
    const rawLocal = localStorage.getItem('klk_user_session');
    if (rawLocal) {
      const p = JSON.parse(rawLocal);
      if (p?.token) return p.token;
    }
  } catch {}

  try {
    const rawSession = sessionStorage.getItem('klk_user_session');
    if (rawSession) {
      const p = JSON.parse(rawSession);
      if (p?.token) return p.token;
    }
  } catch {}

  return (
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

const BACKEND_BASE = (API_BASE_URL || 'https://klkerp.com/api')
  .replace(/\/api\/?$/, '')
  .replace(/\/+$/, '');

const R2_BASE = ((import.meta.env.VITE_R2_PUBLIC_URL as string | undefined) ?? '').replace(/\/+$/, '');

export function getPunjabMediaCandidates(path?: string | null): string[] {
  if (!path) return [];
  const trimmed = String(path).trim();
  if (!trimmed) return [];
  if (/^(https?:|data:|blob:)/i.test(trimmed)) return [trimmed];

  const normalized = trimmed.replace(/^\/+/, '');
  const filename = normalized.split('/').pop() || normalized;
  const candidates: string[] = [];

  if (normalized.startsWith('uploads/')) {
    candidates.push(`${BACKEND_BASE}/${normalized}`);
  } else if (normalized.startsWith('storage/')) {
    candidates.push(`${BACKEND_BASE}/${normalized}`);
  }

  candidates.push(`${BACKEND_BASE}/uploads/punjab/installation/ssl/light/${filename}`);
  candidates.push(`${BACKEND_BASE}/uploads/punjab/installation/ssl/${filename}`);
  candidates.push(`${BACKEND_BASE}/uploads/punjab/installation/${filename}`);
  candidates.push(`${BACKEND_BASE}/uploads/${filename}`);
  candidates.push(`${BACKEND_BASE}/${normalized}`);

  if (R2_BASE) {
    candidates.push(`${R2_BASE}/uploads/punjab/installation/ssl/light/${filename}`);
    candidates.push(`${R2_BASE}/uploads/punjab/installation/ssl/${filename}`);
    candidates.push(`${R2_BASE}/${filename}`);
  }
  candidates.push(`https://pub-21d2019fecbe4a96a88c93b2f091317a.r2.dev/${filename}`);

  return Array.from(new Set(candidates));
}

export function resolvePunjabMediaUrl(path?: string | null): string {
  if (!path) return '';
  if (/^(https?:|data:|blob:)/i.test(path)) return path;
  const candidates = getPunjabMediaCandidates(path);
  return candidates[0] || `${BACKEND_BASE}/${path.replace(/^\/+/, '')}`;
}

export const getMediaUrl = (path?: string | null): string => {
  return resolvePunjabMediaUrl(path);
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
  company_id?: number | string;
  state?: string;
  district?: string;
  block?: string;
  panchayat?: string;
  unique_id?: string;
  wo_no?: string;
  phase?: string;
  beneficiary_name?: string;
  contact_no?: string;
  sarpanch_name?: string;
  sarpanch_contact?: string;
  ward_no?: string | null;
  uuid_no?: string | null;
  pole_no?: string | null;
  light_no?: string | null;
  panel_no?: string | null;
  battery_serial_no?: string | null;
  latitude?: string | null;
  longitude?: string | null;
  light_file?: string | null;
  light_file2?: string | null;
  inst_status?: number;
  inst_accept?: number;
  inst_date?: string | null;
  inst_verify_status?: number; // 0 = Pending, 1 = Approved, 2 = Rejected
  inst_claim_status?: number;  // 0 = Not Raised, 1 = Raised/Pending, 2 = Approved, 3 = Rejected
  inst_pay_status?: number;    // 0 = Pending, 1 = Paid
  remark?: string | null;
  inst_remark?: string | null;
  created_at?: string;
  updated_at?: string;
  [key: string]: any;
}

export type PunjabDashboardStatus =
  | 'total-light'
  | 'assign-light'
  | 'not-assign-light'
  | 'installed-light'
  | 'not-installed-light'
  | 'verify-light'
  | 'verify-pending-light'
  | 'verify-reject-light'
  | 'claim-applicable'
  | 'claim-raised'
  | 'claim-approved'
  | 'claim-pending'
  | 'pay-done'
  | 'pay-pending';

export function normalizePunjabDashboardStatus(status?: string | null): PunjabDashboardStatus {
  if (!status) return 'installed-light';
  const clean = String(status).toLowerCase().trim();
  switch (clean) {
    case 'total':
    case 'total-light':
    case 'all':
      return 'total-light';
    case 'assign':
    case 'assigned':
    case 'assign-light':
      return 'assign-light';
    case 'not-assign':
    case 'not-assigned':
    case 'not-assign-light':
      return 'not-assign-light';
    case 'complete':
    case 'installed':
    case 'installed-light':
    case 'complete-light':
      return 'installed-light';
    case 'pending':
    case 'not-installed':
    case 'not-installed-light':
      return 'not-installed-light';
    case 'verify-light':
    case 'verify-approved':
    case 'verified':
    case 'approved':
      return 'verify-light';
    case 'verify-pending':
    case 'verify-pending-light':
      return 'verify-pending-light';
    case 'verify-reject':
    case 'verify-reject-light':
    case 'rejected':
      return 'verify-reject-light';
    case 'claim-applicable':
      return 'claim-applicable';
    case 'claim-raised':
      return 'claim-raised';
    case 'claim-approved':
      return 'claim-approved';
    case 'claim-pending':
      return 'claim-pending';
    case 'pay-done':
    case 'payment-done':
    case 'paid':
      return 'pay-done';
    case 'pay-pending':
    case 'payment-pending':
      return 'pay-pending';
    default:
      return (clean as PunjabDashboardStatus) || 'installed-light';
  }
}

export interface PunjabStatusMeta {
  key: PunjabDashboardStatus;
  label: string;
  tone: 'accent' | 'emerald' | 'amber' | 'cyan' | 'violet' | 'danger';
  desc: string;
}

export const PUNJAB_STATUS_LIST: PunjabStatusMeta[] = [
  { key: 'total-light', label: 'Total Lights', tone: 'accent', desc: 'All Punjab SSL lights under vendor scope' },
  { key: 'assign-light', label: 'Assigned Lights', tone: 'cyan', desc: 'Lights assigned and accepted by vendor' },
  { key: 'not-assign-light', label: 'Not Assigned', tone: 'amber', desc: 'Lights not yet assigned or accepted' },
  { key: 'installed-light', label: 'Installed Lights', tone: 'emerald', desc: 'Successfully installed solar street lights' },
  { key: 'not-installed-light', label: 'Install Pending', tone: 'amber', desc: 'Lights awaiting installation in field' },
  { key: 'verify-light', label: 'Verified & Approved', tone: 'emerald', desc: 'Installation verified & approved by department' },
  { key: 'verify-pending-light', label: 'Verification Pending', tone: 'amber', desc: 'Installed lights pending departmental inspection' },
  { key: 'verify-reject-light', label: 'Verification Rejected', tone: 'danger', desc: 'Lights rejected during inspection or audit' },
  { key: 'claim-applicable', label: 'Claim Applicable', tone: 'accent', desc: 'Lights eligible to raise payment claim' },
  { key: 'claim-raised', label: 'Claims Raised', tone: 'cyan', desc: 'Payment claim requests submitted by vendor' },
  { key: 'claim-approved', label: 'Claims Approved', tone: 'emerald', desc: 'Vendor payment claims reviewed & approved' },
  { key: 'claim-pending', label: 'Claims Pending', tone: 'amber', desc: 'Submitted payment claims under review' },
  { key: 'pay-done', label: 'Payment Done', tone: 'emerald', desc: 'Disbursed and fully paid installations' },
  { key: 'pay-pending', label: 'Payment Pending', tone: 'amber', desc: 'Approved claims pending financial disbursement' },
];

/* ═════════════════════════════════════════════════════════════════════════
   Punjab SSL Installation Service Class
   ═════════════════════════════════════════════════════════════════════════ */

class PunjabSslInstallationService {
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

  /**
   * Resilient request executor with automatic route prefix fallback (/api/vendor/... and /api/...)
   */
  private async fetchWithFallback(urlOrEndpoint: string, options: RequestInit = {}): Promise<Response> {
    const baseClean = (API_BASE_URL || 'https://klkerp.com/api').replace(/\/+$/, '');
    const altBase = baseClean.endsWith('/api') ? baseClean.slice(0, -4) : `${baseClean}/api`;

    let cleanPath = urlOrEndpoint;
    if (urlOrEndpoint.startsWith('http://') || urlOrEndpoint.startsWith('https://')) {
      try {
        const u = new URL(urlOrEndpoint);
        cleanPath = (u.pathname + u.search).replace(/^\/api/, '');
      } catch {}
    }
    if (!cleanPath.startsWith('/')) cleanPath = `/${cleanPath}`;

    // Candidate paths:
    // 1. /api/vendor/punjab/ssl/... (Canonical Laravel route group for Vendor Punjab SSL)
    // 2. Original URL
    // 3. /api/punjab/ssl/...
    // 4. /api/v/punjab/ssl/...
    const pathWithVendor = cleanPath.startsWith('/vendor/') ? cleanPath : `/vendor${cleanPath.replace(/^\/v\//, '/')}`;
    const pathWithoutVendor = cleanPath.replace(/^\/vendor/, '').replace(/^\/v\//, '/');

    const urls: string[] = [
      `${baseClean}${pathWithVendor}`,
      urlOrEndpoint,
      `${baseClean}${pathWithoutVendor}`,
      `${baseClean}/v${pathWithoutVendor}`,
      `${altBase}${pathWithVendor}`,
      `${altBase}${pathWithoutVendor}`,
    ];

    const uniqueUrls = Array.from(new Set(urls));
    let lastError: Error | null = null;
    let lastRes: Response | null = null;

    for (const u of uniqueUrls) {
      try {
        const res = await fetch(u, options);
        if (res.status === 404) {
          lastRes = res;
          continue;
        }
        return res;
      } catch (err: any) {
        lastError = err;
      }
    }

    if (lastRes) return lastRes;
    throw lastError || new Error(`Network error requesting ${urlOrEndpoint}`);
  }

  /* ─────────────────────────────────────────────────────────────────────────
     1. View Assigned Lights
     GET /vendor/punjab/ssl/installation/view-assigned-light
     ───────────────────────────────────────────────────────────────────────── */
  async getAssignedLights(): Promise<PunjabAssignedLightItem[]> {
    try {
      const res = await this.fetchWithFallback(PUNJAB_API.INSTALLATION.SSL.VIEW_ASSIGNED_LIGHTS, {
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
      } else {
        const errJson = await res.json().catch(() => null);
        console.warn('[Punjab SSL] getAssignedLights response error:', res.status, errJson);
        if (res.status === 401) {
          throw new Error('Unauthorized: Vendor session missing or expired. Please re-login.');
        }
      }
    } catch (err) {
      console.error('[Punjab SSL] getAssignedLights error:', err);
      throw err;
    }
    return [];
  }

  /* ─────────────────────────────────────────────────────────────────────────
     2. Accept Assigned Lights
     GET /vendor/punjab/ssl/installation/update-status-assigned-light?light_id={id}
     ───────────────────────────────────────────────────────────────────────── */
  async acceptAssignedLight(lightId: number | string): Promise<{ status: boolean; message: string; data?: any }> {
    const res = await this.fetchWithFallback(PUNJAB_API.INSTALLATION.SSL.ACCEPT_ASSIGNED(lightId), {
      method: 'GET',
      headers: this.getHeaders(),
    });
    const json = await res.json().catch(() => null);
    if (!res.ok || json?.status === false) {
      const errMsg = json?.message || json?.error || (json?.errors ? Object.values(json.errors).flat()[0] : null) || 'Failed to accept light assignment.';
      throw new Error(String(errMsg));
    }
    return {
      status: true,
      message: json?.message || 'Status Changed Successfully!!!',
      data: json?.data,
    };
  }

  /* ─────────────────────────────────────────────────────────────────────────
     3. Fetch Light List
     GET /vendor/punjab/ssl/installation/fetch-light
     ───────────────────────────────────────────────────────────────────────── */
  async fetchLightNames(): Promise<PunjabLightDropdownItem[]> {
    try {
      const res = await this.fetchWithFallback(PUNJAB_API.INSTALLATION.SSL.FETCH_LIGHT_NAMES, {
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
      console.error('[Punjab SSL] fetchLightNames error:', err);
    }
    return [];
  }

  /* ─────────────────────────────────────────────────────────────────────────
     4. Fetch Light Details
     GET /vendor/punjab/ssl/installation/fetch-light-deatils?light_id={lightId}
     ───────────────────────────────────────────────────────────────────────── */
  async fetchLightDetail(lightId: number | string): Promise<PunjabLightDetail | null> {
    try {
      const res = await this.fetchWithFallback(PUNJAB_API.INSTALLATION.SSL.FETCH_LIGHT_DETAILS(lightId), {
        method: 'GET',
        headers: this.getHeaders(),
      });
      if (res.ok) {
        const json = await res.json().catch(() => null);
        if (json?.data) {
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
     POST /vendor/punjab/ssl/installation/store-deatils-light (multipart/form-data)
     ───────────────────────────────────────────────────────────────────────── */
  async storeLightDetails(formData: FormData): Promise<{ status: boolean; message: string; data?: any }> {
    const res = await this.fetchWithFallback(PUNJAB_API.INSTALLATION.SSL.STORE_LIGHT_DETAILS, {
      method: 'POST',
      headers: this.getHeaders(true),
      body: formData,
    });
    const json = await res.json().catch(() => null);
    if (!res.ok || json?.status === false) {
      if (res.status === 422 && json?.errors) {
        const first = Object.values(json.errors).flat()[0] as string;
        throw new Error(first || json.message || 'Validation failed');
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
     GET /vendor/punjab/ssl/installation/update-install-light?ssl_id={sslId}
     ───────────────────────────────────────────────────────────────────────── */
  async getUpdateInstallLightLoad(sslId: number | string): Promise<PunjabLightDetail | null> {
    try {
      const res = await this.fetchWithFallback(PUNJAB_API.INSTALLATION.SSL.UPDATE_INSTALL_LIGHT_LOAD(sslId), {
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
     POST /vendor/punjab/ssl/installation/update-install-light-store (multipart/form-data)
     ───────────────────────────────────────────────────────────────────────── */
  async updateInstallLightStore(formData: FormData): Promise<{ status: boolean; message: string; data?: any }> {
    const res = await this.fetchWithFallback(PUNJAB_API.INSTALLATION.SSL.UPDATE_INSTALL_LIGHT_STORE, {
      method: 'POST',
      headers: this.getHeaders(true),
      body: formData,
    });
    const json = await res.json().catch(() => null);
    if (!res.ok || json?.status === false) {
      if (res.status === 422 && json?.errors) {
        const first = Object.values(json.errors).flat()[0] as string;
        throw new Error(first || json.message || 'Validation failed');
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
     GET /vendor/punjab/ssl/installation/complete-light
     ───────────────────────────────────────────────────────────────────────── */
  async getCompleteLights(): Promise<PunjabCompleteLightsResponse | null> {
    try {
      const res = await this.fetchWithFallback(PUNJAB_API.INSTALLATION.SSL.COMPLETE_LIGHTS, {
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
     GET /vendor/punjab/ssl/installation/dashboard
     ───────────────────────────────────────────────────────────────────────── */
  async getDashboardData(): Promise<PunjabDashboardData | null> {
    try {
      const res = await this.fetchWithFallback(PUNJAB_API.INSTALLATION.SSL.DASHBOARD, {
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
     GET /vendor/punjab/ssl/installation/view-dashboard/{status}
     ───────────────────────────────────────────────────────────────────────── */
  async getDashboardByStatus(status: string): Promise<PunjabStatusDrillRow[]> {
    try {
      const res = await this.fetchWithFallback(PUNJAB_API.INSTALLATION.SSL.DASHBOARD_BY_STATUS(status), {
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
      console.error('[Punjab SSL] getDashboardByStatus error:', err);
    }
    return [];
  }

  /* ─────────────────────────────────────────────────────────────────────────
     11. Districtwise By Status
     GET /vendor/punjab/ssl/installation/districtwise-view-data/{status}/{district}
     ───────────────────────────────────────────────────────────────────────── */
  async getDashboardByDistrictStatus(status: string, district: string): Promise<PunjabStatusDrillRow[]> {
    try {
      const res = await this.fetchWithFallback(PUNJAB_API.INSTALLATION.SSL.DISTRICTWISE_BY_STATUS(status, district), {
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

  /**
   * Universal fetcher for Punjab Dashboard Status View (APIs 10 & 11)
   */
  async getDashboardStatusResponse(status: string, district?: string): Promise<{ meta?: any; data: PunjabStatusDrillRow[] }> {
    try {
      const normalizedStatus = normalizePunjabDashboardStatus(status);
      const url =
        district && district !== 'All'
          ? PUNJAB_API.INSTALLATION.SSL.DISTRICTWISE_BY_STATUS(normalizedStatus, district)
          : PUNJAB_API.INSTALLATION.SSL.DASHBOARD_BY_STATUS(normalizedStatus);

      const res = await this.fetchWithFallback(url, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      if (res.ok) {
        const json = await res.json().catch(() => null);
        if (json && Array.isArray(json.data)) {
          return { meta: json.meta, data: json.data };
        }
        if (Array.isArray(json)) {
          return { data: json };
        }
        if (json?.data && typeof json.data === 'object') {
          return { meta: json.meta, data: [json.data] };
        }
      }
    } catch (err) {
      console.error('[Punjab SSL] getDashboardStatusResponse error:', err);
    }
    return { data: [] };
  }
}

export const punjabSslInstallationService = new PunjabSslInstallationService();
export default punjabSslInstallationService;
