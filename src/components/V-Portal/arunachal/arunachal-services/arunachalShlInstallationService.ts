import { API_BASE_URL, authService } from '../../../../services/authService';
import { ARUNACHAL_API } from '../../V_Portal_APIS/Arunachal_API';

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

const R2_BASE = '';

export function getArunachalMediaCandidates(path?: string | null): string[] {
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

  candidates.push(`${BACKEND_BASE}/uploads/arunachal/installation/shl/light/${filename}`);
  candidates.push(`${BACKEND_BASE}/uploads/arunachal/installation/shl/${filename}`);
  candidates.push(`${BACKEND_BASE}/uploads/arunachal/installation/${filename}`);
  candidates.push(`${BACKEND_BASE}/uploads/arunachal/${filename}`);
  candidates.push(`${BACKEND_BASE}/uploads/${filename}`);
  candidates.push(`${BACKEND_BASE}/${normalized}`);

  if (R2_BASE) {
    candidates.push(`${R2_BASE}/uploads/arunachal/installation/shl/light/${filename}`);
    candidates.push(`${R2_BASE}/uploads/arunachal/installation/shl/${filename}`);
    candidates.push(`${R2_BASE}/${filename}`);
  }
  candidates.push(`https://pub-21d2019fecbe4a96a88c93b2f091317a.r2.dev/${filename}`);

  return Array.from(new Set(candidates));
}

export function resolveArunachalMediaUrl(path?: string | null): string {
  if (!path) return '';
  if (/^(https?:|data:|blob:)/i.test(path)) return path;
  const candidates = getArunachalMediaCandidates(path);
  return candidates[0] || `${BACKEND_BASE}/${path.replace(/^\/+/, '')}`;
}

export const getMediaUrl = (path?: string | null): string => {
  return resolveArunachalMediaUrl(path);
};

/* ═════════════════════════════════════════════════════════════════════════
   Type Definitions for Arunachal Pradesh SHL Installation
   ═════════════════════════════════════════════════════════════════════════ */

export interface ArunachalAssignedLightItem {
  id: number;
  company_id?: number | string;
  state?: string;
  vendor?: string;
  district?: string;
  block?: string;
  panchayat?: string;
  volume?: string | number;
  sdate?: string;
  ldate?: string;
  start_date?: string;
  end_date?: string;
  insp_code?: string | null;
  sitecount?: number | string;
  site_count?: number | string;
  match_material?: number | string;
  uid_file?: string | null;
  battery_no_file?: string | null;
  panel_no_file?: string | null;
  sim_no_file?: string | null;
  imei_no_file?: string | null;
  remarks?: string;
  remark?: string;
  status: number; // 0 = Inactive, 1 = Assigned, 2 = Accepted
  created_by?: string;
  updated_by?: string | null;
  created_at?: string;
  updated_at?: string;
  [key: string]: any;
}

export interface ArunachalLightDropdownItem {
  id: number;
  unique_id: string;
  panchayat?: string;
  [key: string]: any;
}

export interface ArunachalLightDetail {
  id: number;
  unique_id?: string;
  state?: string;
  district?: string;
  block?: string;
  panchayat?: string;
  address?: string;
  beneficiary_name?: string;
  contact_no?: string;
  phase?: string;
  ward_no?: string | null;
  pole_no?: string | null;
  uuid_no?: string | null;
  battery_serial_no?: string | null;
  battery_no?: string | null;
  panel_no?: string | null;
  light_no?: string | null;
  latitude?: string | null;
  longitude?: string | null;
  light_file?: string | null;
  remark?: string | null;
  inst_remark?: string | null;
  inst_status?: number;
  inst_accept?: number;
  inst_date?: string;
  inst_verify_status?: number;
  inst_claim_status?: number;
  inst_pay_status?: number;
  [key: string]: any;
}

export interface ArunachalInstalledLightItem {
  id: number;
  unique_id?: string;
  state?: string;
  district?: string;
  block?: string;
  panchayat?: string;
  address?: string;
  beneficiary_name?: string;
  contact_no?: string;
  phase?: string;
  ward_no?: string | null;
  pole_no?: string | null;
  uuid_no?: string | null;
  battery_serial_no?: string | null;
  battery_no?: string | null;
  panel_no?: string | null;
  light_no?: string | null;
  latitude?: string | null;
  longitude?: string | null;
  light_file?: string | null;
  remark?: string | null;
  inst_remark?: string | null;
  inst_status?: number;
  inst_accept?: number;
  inst_date?: string;
  inst_verify_status?: number; // 0 = Pending, 1 = Approved, 2 = Rejected
  inst_claim_status?: number;  // 0 = Not Raised, 1 = Raised/Pending, 2 = Approved, 3 = Rejected
  inst_pay_status?: number;    // 0 = Pending, 1 = Paid
  [key: string]: any;
}

export interface ArunachalInstallDetailSummary {
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

export interface ArunachalViewInstallationResponse {
  install_detail?: ArunachalInstallDetailSummary;
  claimedapplicable1?: number[];
  paymentlight?: ArunachalInstalledLightItem[];
  paymentlights?: ArunachalInstalledLightItem[];
  completelight?: ArunachalInstalledLightItem[];
  completelights?: ArunachalInstalledLightItem[];
  [key: string]: any;
}

export interface ArunachalDashboardShlSummary {
  site_count: number;
  site_assigned: number;
  site_not_assigned: number;
  complete: number;
  pending: number;
  verify_pending: number;
  verify_approved: number;
  verify_reject: number;
  claim_applicable: number;
  claim_raised: number;
  claim_verify_approved?: number;
  claim_verify_pending?: number;
  claim_verify_reject?: number;
  claim_approved?: number;
  claim_pending?: number;
  claim_reject?: number;
  inst_pay_done: number;
  inst_pay_pending: number;
  [key: string]: any;
}

export interface ArunachalDistrictInstall {
  district: string;
  inst_complete: number;
}

export interface ArunachalDistrictwise {
  district: string;
  site_count: number;
  site_assigned: number;
  site_not_assigned: number;
  complete: number;
  pending: number;
  verify_pending: number;
  verify_approved: number;
  verify_reject: number;
  claim_applicable: number;
  claim_raised: number;
  claim_verify_approved?: number;
  claim_verify_pending?: number;
  claim_verify_reject?: number;
  inst_pay_done: number;
  inst_pay_pending: number;
  [key: string]: any;
}

export interface ArunachalMonthlyInstallation {
  month_year: string;
  monthly_installations: number;
}

export interface ArunachalDashboardData {
  shldatas?: ArunachalDashboardShlSummary;
  ssl?: ArunachalDashboardShlSummary;
  payment_amount: string | number;
  district_install?: ArunachalDistrictInstall[];
  districtwise?: ArunachalDistrictwise[];
  district_installation_month?: ArunachalMonthlyInstallation[];
  [key: string]: any;
}

export interface ArunachalStatusDrillRow extends ArunachalInstalledLightItem {
  [key: string]: any;
}

export type ArunachalDashboardStatus =
  | 'total'
  | 'site-assigned'
  | 'site-not-assigned'
  | 'inst-complete'
  | 'inst-pending'
  | 'verify-approve'
  | 'verify-pending'
  | 'verify-reject'
  | 'claim-applicable'
  | 'claim-raised'
  | 'claim-approved'
  | 'claim-reject'
  | 'claim-pending'
  | 'pay-done'
  | 'pay-pending';

export function normalizeArunachalDashboardStatus(status?: string | null): ArunachalDashboardStatus {
  if (!status) return 'inst-complete';
  const clean = String(status).toLowerCase().trim();
  switch (clean) {
    case 'total':
    case 'total-light':
    case 'all':
      return 'total';
    case 'site-assigned':
    case 'assigned':
    case 'assign-light':
      return 'site-assigned';
    case 'site-not-assigned':
    case 'not-assigned':
    case 'not-assign-light':
      return 'site-not-assigned';
    case 'inst-complete':
    case 'complete':
    case 'installed':
    case 'installed-light':
      return 'inst-complete';
    case 'inst-pending':
    case 'pending':
    case 'not-installed':
      return 'inst-pending';
    case 'verify-approve':
    case 'verify-approved':
    case 'verify-light':
    case 'verified':
    case 'approved':
      return 'verify-approve';
    case 'verify-pending':
    case 'verify-pending-light':
      return 'verify-pending';
    case 'verify-reject':
    case 'verify-reject-light':
    case 'rejected':
      return 'verify-reject';
    case 'claim-applicable':
      return 'claim-applicable';
    case 'claim-raised':
      return 'claim-raised';
    case 'claim-approved':
    case 'claim-verify-approved':
      return 'claim-approved';
    case 'claim-reject':
    case 'claim-verify-reject':
      return 'claim-reject';
    case 'claim-pending':
    case 'claim-verify-pending':
      return 'claim-pending';
    case 'pay-done':
    case 'payment-complete':
    case 'paid':
      return 'pay-done';
    case 'pay-pending':
    case 'payment-pending':
      return 'pay-pending';
    default:
      return (clean as ArunachalDashboardStatus) || 'inst-complete';
  }
}

export interface ArunachalStatusMeta {
  key: ArunachalDashboardStatus;
  label: string;
  tone: 'accent' | 'emerald' | 'amber' | 'cyan' | 'violet' | 'danger';
  desc: string;
}

export const ARUNACHAL_STATUS_LIST: ArunachalStatusMeta[] = [
  { key: 'total', label: 'Total Lights', tone: 'accent', desc: 'All Arunachal Pradesh SHL lights under vendor scope' },
  { key: 'site-assigned', label: 'Assigned Lights', tone: 'cyan', desc: 'Lights assigned and accepted by vendor' },
  { key: 'site-not-assigned', label: 'Not Assigned', tone: 'amber', desc: 'Lights not yet assigned or accepted' },
  { key: 'inst-complete', label: 'Installed Lights', tone: 'emerald', desc: 'Successfully installed solar home lights' },
  { key: 'inst-pending', label: 'Install Pending', tone: 'amber', desc: 'Lights awaiting installation in field' },
  { key: 'verify-approve', label: 'Verified & Approved', tone: 'emerald', desc: 'Installation verified & approved by department' },
  { key: 'verify-pending', label: 'Verification Pending', tone: 'amber', desc: 'Installed lights pending departmental inspection' },
  { key: 'verify-reject', label: 'Verification Rejected', tone: 'danger', desc: 'Lights rejected during inspection or audit' },
  { key: 'claim-applicable', label: 'Claim Applicable', tone: 'accent', desc: 'Lights eligible to raise payment claim' },
  { key: 'claim-raised', label: 'Claims Raised', tone: 'cyan', desc: 'Payment claim requests submitted by vendor' },
  { key: 'claim-approved', label: 'Claims Approved', tone: 'emerald', desc: 'Vendor payment claims reviewed & approved' },
  { key: 'claim-pending', label: 'Claims Pending', tone: 'amber', desc: 'Submitted payment claims under review' },
  { key: 'claim-reject', label: 'Claims Rejected', tone: 'danger', desc: 'Payment claim requests rejected' },
  { key: 'pay-done', label: 'Payment Done', tone: 'emerald', desc: 'Disbursed and fully paid installations' },
  { key: 'pay-pending', label: 'Payment Pending', tone: 'amber', desc: 'Approved claims pending financial disbursement' },
];

/* ═════════════════════════════════════════════════════════════════════════
   Arunachal SHL Installation Service Class
   ═════════════════════════════════════════════════════════════════════════ */

class ArunachalShlInstallationService {
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
   * Resilient request executor with automatic fallback between routes:
   * /arunachal/shl/installation/...
   * /vendor/arunachal/shl/installation/...
   * /api/arunachal/...
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

    const pathDirect = cleanPath.replace(/^\/vendor/, '');
    const pathWithVendor = cleanPath.startsWith('/vendor/') ? cleanPath : `/vendor${cleanPath}`;

    const urls: string[] = [
      urlOrEndpoint,
      `${baseClean}${pathDirect}`,
      `${baseClean}${pathWithVendor}`,
      `${altBase}${pathDirect}`,
      `${altBase}${pathWithVendor}`,
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
     GET /arunachal/shl/installation/view-assigned-light
     ───────────────────────────────────────────────────────────────────────── */
  async getAssignedLights(): Promise<ArunachalAssignedLightItem[]> {
    try {
      const res = await this.fetchWithFallback(ARUNACHAL_API.INSTALLATION.SHL.VIEW_ASSIGNED_LIGHTS, {
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
        console.warn('[Arunachal SHL] getAssignedLights response error:', res.status, errJson);
        if (res.status === 401) {
          throw new Error('Unauthorized: Vendor session missing or expired. Please re-login.');
        }
      }
    } catch (err) {
      console.error('[Arunachal SHL] getAssignedLights error:', err);
      throw err;
    }
    return [];
  }

  /* ─────────────────────────────────────────────────────────────────────────
     2. Accept Assigned Lights
     GET /arunachal/shl/installation/accept?light_id={lightId}
     ───────────────────────────────────────────────────────────────────────── */
  async acceptAssignedLight(lightId: number | string): Promise<{ status: boolean; message: string; data?: any }> {
    const res = await this.fetchWithFallback(ARUNACHAL_API.INSTALLATION.SHL.ACCEPT_ASSIGNED(lightId), {
      method: 'GET',
      headers: this.getHeaders(),
    });
    const json = await res.json().catch(() => null);
    if (!res.ok || json?.status === false) {
      const errMsg =
        json?.message ||
        json?.error ||
        (json?.errors ? Object.values(json.errors).flat()[0] : null) ||
        'Failed to accept assignment.';
      throw new Error(String(errMsg));
    }
    return {
      status: true,
      message: json?.message || 'Status Updated Successfully!!!',
      data: json?.data,
    };
  }

  /* ─────────────────────────────────────────────────────────────────────────
     3. Fetch Light List
     GET /arunachal/shl/installation/fetch-light
     ───────────────────────────────────────────────────────────────────────── */
  async fetchLightNames(): Promise<ArunachalLightDropdownItem[]> {
    try {
      const res = await this.fetchWithFallback(ARUNACHAL_API.INSTALLATION.SHL.FETCH_LIGHT_NAMES, {
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
      console.error('[Arunachal SHL] fetchLightNames error:', err);
    }
    return [];
  }

  /**
   * Alias for fetchLightNames() to support both naming styles
   */
  async fetchLightList(): Promise<ArunachalLightDropdownItem[]> {
    return this.fetchLightNames();
  }

  /* ─────────────────────────────────────────────────────────────────────────
     4. Fetch Light Details
     GET /arunachal/shl/installation/fetch-light-details?light_id={lightId}
     ───────────────────────────────────────────────────────────────────────── */
  async fetchLightDetail(lightId: number | string): Promise<ArunachalLightDetail | null> {
    try {
      const res = await this.fetchWithFallback(ARUNACHAL_API.INSTALLATION.SHL.FETCH_LIGHT_DETAILS(lightId), {
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
      console.error('[Arunachal SHL] fetchLightDetail error:', err);
    }
    return null;
  }

  /* ─────────────────────────────────────────────────────────────────────────
     5. Install Light (Store)
     POST /arunachal/shl/installation/install/store (multipart/form-data)
     ───────────────────────────────────────────────────────────────────────── */
  async storeLightDetails(formData: FormData): Promise<{ status: boolean; message: string; data?: any }> {
    const res = await this.fetchWithFallback(ARUNACHAL_API.INSTALLATION.SHL.STORE_LIGHT_DETAILS, {
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
      message: json?.message || 'Light installed successfully!',
      data: json?.data,
    };
  }

  /* ─────────────────────────────────────────────────────────────────────────
     6. View Installation (Summary + Lists)
     GET /arunachal/shl/installation/view-installation
     ───────────────────────────────────────────────────────────────────────── */
  async getViewInstallation(): Promise<ArunachalViewInstallationResponse | null> {
    try {
      const res = await this.fetchWithFallback(ARUNACHAL_API.INSTALLATION.SHL.VIEW_INSTALLATION, {
        method: 'GET',
        headers: this.getHeaders(),
      });
      if (res.ok) {
        const json = await res.json().catch(() => null);
        if (json?.data) {
          return json.data;
        }
        if (json && (json.install_detail || json.completelight || json.paymentlight)) {
          return json;
        }
      }
    } catch (err) {
      console.error('[Arunachal SHL] getViewInstallation error:', err);
    }
    return null;
  }

  /* ─────────────────────────────────────────────────────────────────────────
     7. Update Install Light (Load)
     GET /arunachal/shl/installation/update?light_id={lightId}
     ───────────────────────────────────────────────────────────────────────── */
  async getUpdateInstallLightLoad(lightId: number | string): Promise<ArunachalLightDetail | null> {
    try {
      const res = await this.fetchWithFallback(ARUNACHAL_API.INSTALLATION.SHL.UPDATE_INSTALL_LIGHT_LOAD(lightId), {
        method: 'GET',
        headers: this.getHeaders(),
      });
      if (res.ok) {
        const json = await res.json().catch(() => null);
        if (json?.data) return json.data;
        if (json && !('data' in json)) return json;
      }
    } catch (err) {
      console.error('[Arunachal SHL] getUpdateInstallLightLoad error:', err);
    }
    return null;
  }

  /* ─────────────────────────────────────────────────────────────────────────
     8. Update Install Light Store
     POST /arunachal/shl/installation/update (multipart/form-data)
     ───────────────────────────────────────────────────────────────────────── */
  async updateInstallLightStore(formData: FormData): Promise<{ status: boolean; message: string; data?: any }> {
    const res = await this.fetchWithFallback(ARUNACHAL_API.INSTALLATION.SHL.UPDATE_INSTALL_LIGHT_STORE, {
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
      message: json?.message || 'Light details updated successfully!',
      data: json?.data,
    };
  }

  /* ─────────────────────────────────────────────────────────────────────────
     9. Installation Dashboard
     GET /arunachal/shl/installation/dashboard
     ───────────────────────────────────────────────────────────────────────── */
  async getDashboardData(): Promise<ArunachalDashboardData | null> {
    try {
      const res = await this.fetchWithFallback(ARUNACHAL_API.INSTALLATION.SHL.DASHBOARD, {
        method: 'GET',
        headers: this.getHeaders(),
      });
      if (res.ok) {
        const json = await res.json().catch(() => null);
        if (json?.data) {
          return json.data;
        }
        if (json?.shldatas || json?.ssl) {
          return json;
        }
      }
    } catch (err) {
      console.error('[Arunachal SHL] getDashboardData error:', err);
    }
    return null;
  }

  /* ─────────────────────────────────────────────────────────────────────────
     10. View Dashboard By Status
     GET /arunachal/shl/installation/view-dashboard/{status}
     ───────────────────────────────────────────────────────────────────────── */
  async getDashboardByStatus(status: string): Promise<ArunachalStatusDrillRow[]> {
    try {
      const normalized = normalizeArunachalDashboardStatus(status);
      const res = await this.fetchWithFallback(ARUNACHAL_API.INSTALLATION.SHL.DASHBOARD_BY_STATUS(normalized), {
        method: 'GET',
        headers: this.getHeaders(),
      });
      if (res.ok) {
        const json = await res.json().catch(() => null);
        if (Array.isArray(json?.data?.shl)) {
          return json.data.shl;
        }
        if (Array.isArray(json?.data)) {
          return json.data;
        }
        if (Array.isArray(json)) {
          return json;
        }
      }
    } catch (err) {
      console.error('[Arunachal SHL] getDashboardByStatus error:', err);
    }
    return [];
  }

  /* ─────────────────────────────────────────────────────────────────────────
     11. Districtwise By Status
     GET /arunachal/shl/installation/districtwise-data/{status}/{district}
     ───────────────────────────────────────────────────────────────────────── */
  async getDashboardByDistrictStatus(status: string, district: string): Promise<ArunachalStatusDrillRow[]> {
    try {
      const normalized = normalizeArunachalDashboardStatus(status);
      const res = await this.fetchWithFallback(ARUNACHAL_API.INSTALLATION.SHL.DISTRICTWISE_BY_STATUS(normalized, district), {
        method: 'GET',
        headers: this.getHeaders(),
      });
      if (res.ok) {
        const json = await res.json().catch(() => null);
        if (Array.isArray(json?.data?.shl)) {
          return json.data.shl;
        }
        if (Array.isArray(json?.data)) {
          return json.data;
        }
        if (Array.isArray(json)) {
          return json;
        }
      }
    } catch (err) {
      console.error('[Arunachal SHL] getDashboardByDistrictStatus error:', err);
    }
    return [];
  }

  /**
   * Universal fetcher for Arunachal Dashboard Status View (APIs 10 & 11)
   */
  async getDashboardStatusResponse(
    status: string,
    district?: string
  ): Promise<{ meta?: any; count?: number; data: ArunachalStatusDrillRow[] }> {
    try {
      const normalizedStatus = normalizeArunachalDashboardStatus(status);
      const url =
        district && district !== 'All'
          ? ARUNACHAL_API.INSTALLATION.SHL.DISTRICTWISE_BY_STATUS(normalizedStatus, district)
          : ARUNACHAL_API.INSTALLATION.SHL.DASHBOARD_BY_STATUS(normalizedStatus);

      const res = await this.fetchWithFallback(url, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      if (res.ok) {
        const json = await res.json().catch(() => null);
        if (json?.data && Array.isArray(json.data.shl)) {
          return { meta: json.meta, count: json.data.count, data: json.data.shl };
        }
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
      console.error('[Arunachal SHL] getDashboardStatusResponse error:', err);
    }
    return { data: [] };
  }
}

export const arunachalShlInstallationService = new ArunachalShlInstallationService();
export default arunachalShlInstallationService;
