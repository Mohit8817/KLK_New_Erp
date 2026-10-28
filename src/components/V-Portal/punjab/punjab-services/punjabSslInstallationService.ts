import { API_BASE_URL, authService } from '../../../../services/authService';
import { PUNJAB_API } from '../../V_Portal_APIS/Punjab_API';

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

/**
 * Normalizes media paths into full valid URLs.
 * If path is relative like 'uploads/punjab/...', prepends the API host.
 */
export const getMediaUrl = (path?: string | null): string => {
  if (!path) return '';
  const trimmed = String(path).trim();
  if (!trimmed) return '';
  if (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('blob:') ||
    trimmed.startsWith('data:')
  ) {
    return trimmed;
  }
  const root = (API_BASE_URL || 'https://klkerp.com/api')
    .replace(/\/api\/?$/, '')
    .replace(/\/+$/, '');
  const cleanPath = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  return `${root}${cleanPath}`;
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
     GET /punjab/ssl/installation/update-status-assigned-light?light_id={id}
     ───────────────────────────────────────────────────────────────────────── */
  async acceptAssignedLight(lightId: number | string): Promise<{ status: boolean; message: string; data?: any }> {
    const res = await fetch(PUNJAB_API.INSTALLATION.SSL.ACCEPT_ASSIGNED(lightId), {
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
     GET /punjab/ssl/installation/fetch-light
     ───────────────────────────────────────────────────────────────────────── */
  async fetchLightNames(): Promise<PunjabLightDropdownItem[]> {
    try {
      const res = await fetch(PUNJAB_API.INSTALLATION.SSL.FETCH_LIGHT_NAMES, {
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
     GET /punjab/ssl/installation/fetch-light-deatils?light_id={lightId}
     ───────────────────────────────────────────────────────────────────────── */
  async fetchLightDetail(lightId: number | string): Promise<PunjabLightDetail | null> {
    try {
      const res = await fetch(PUNJAB_API.INSTALLATION.SSL.FETCH_LIGHT_DETAILS(lightId), {
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
     POST /punjab/ssl/installation/store-deatils-light (multipart/form-data)
     ───────────────────────────────────────────────────────────────────────── */
  async storeLightDetails(formData: FormData): Promise<{ status: boolean; message: string; data?: any }> {
    const res = await fetch(PUNJAB_API.INSTALLATION.SSL.STORE_LIGHT_DETAILS, {
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
     GET /punjab/ssl/installation/update-install-light?ssl_id={sslId}
     ───────────────────────────────────────────────────────────────────────── */
  async getUpdateInstallLightLoad(sslId: number | string): Promise<PunjabLightDetail | null> {
    try {
      const res = await fetch(PUNJAB_API.INSTALLATION.SSL.UPDATE_INSTALL_LIGHT_LOAD(sslId), {
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
     POST /punjab/ssl/installation/update-install-light-store (multipart/form-data)
     ───────────────────────────────────────────────────────────────────────── */
  async updateInstallLightStore(formData: FormData): Promise<{ status: boolean; message: string; data?: any }> {
    const res = await fetch(PUNJAB_API.INSTALLATION.SSL.UPDATE_INSTALL_LIGHT_STORE, {
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
     GET /punjab/ssl/installation/complete-light
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
     ───────────────────────────────────────────────────────────────────────── */
  async getDashboardByStatus(status: string): Promise<PunjabStatusDrillRow[]> {
    try {
      const res = await fetch(PUNJAB_API.INSTALLATION.SSL.DASHBOARD_BY_STATUS(status), {
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
