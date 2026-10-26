import { API_BASE_URL, authService } from '../../../../services/authService';
import { BIHAR_API } from '../../V_Portal_APIS/Bihar_API';

/**
 * Universal token getter checking all localStorage and sessionStorage keys
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
 * Universal company_id getter checking all storage and session locations
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
    '1'; // Default Bihar SSL vendor company_id

  return String(candidate).trim();
};

/**
 * Normalizes media paths into full valid URLs.
 * If path is relative like 'uploads/bihar/...', prepends the API host.
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
   Type Definitions for Bihar SSL Installation
   ═════════════════════════════════════════════════════════════════════════ */

export interface AssignedSslLightItem {
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
  uid_file?: string | null;
  remarks?: string;
  status: number; // 1 = Assigned/Pending, 2 = Accepted
  created_at?: string;
  updated_at?: string;
}

export interface SslLightDropdownItem {
  id: number;
  unique_id: string;
}

export interface SslLightDetail {
  id: number;
  unique_id: string;
  state?: string;
  phase?: string;
  district?: string;
  block?: string;
  panchyat?: string;
  panchayat?: string;
  wo_no?: string;
  wo_received?: string;
  ward_no?: string;
  pole_no?: string;
  beneficiary_name?: string;
  contact_no?: string;
  latitude?: string;
  longitude?: string;
  luminary_no?: string;
  sim_no?: string;
  battery_serial_no?: string | null;
  module_no?: string | null;
  light_no?: string | null;
  uuid_no?: string | null;
  supply?: string;
  material_inspection?: string;
  installation?: string;
  date_of_installation?: string;
  installed_by?: string;
  inspected_by_breda?: string;
  [key: string]: any;
}

export interface InstallSslPayload {
  ssl_id: number;
  uuid_no: string;
  light_no: string;
  ward_no: string;
  pole_no: string;
  module_no: string;
  battery_serial_no: string;
  longitude: string | number;
  latitude: string | number;
  beneficiary_name: string;
  contact_no: string;
  light_file: File;
  remark?: string;
}

export interface InstalledLightsSummary {
  total: number;
  complete: number;
  pending: number;
  verify_approved: number;
  verify_pending: number;
  verify_reject: number;
  claim_applicable: number;
  claim_raised: number;
  claim_not_applicable: number;
  claim_verify_approved: number;
  claim_verify_pending: number;
  claim_verify_reject: number;
  payment_complete: number;
  payment_pending: number;
}

export interface InstalledLightItem {
  id: number;
  unique_id?: string;
  uid?: string;
  state?: string;
  phase?: string;
  district?: string;
  block?: string;
  panchayat?: string;
  panchyat?: string;
  ward_no?: string;
  pole_no?: string;
  beneficiary_name?: string;
  contact_no?: string;
  latitude?: string;
  longitude?: string;
  light_no?: string;
  uuid_no?: string;
  battery_no?: string;
  battery_serial_no?: string;
  panel_no?: string;
  module_no?: string;
  imei_no?: string;
  sim_no?: string;
  light_image?: string;
  light_file?: string;
  remark?: string;
  inst_remark?: string;
  inst_verify_status?: number;
  verify_status?: number | string;
  inst_claim_status?: number;
  claim_status?: number | string;
  inst_pay_status?: number;
  payment_status?: number | string;
  installation_status?: number;
  created_at?: string;
  updated_at?: string;
  [key: string]: any;
}

export interface InstalledLightsResponse {
  status: boolean;
  install_detail: InstalledLightsSummary;
  claimed_applicable_ids: number[];
  payment_lights: InstalledLightItem[];
  complete_lights: InstalledLightItem[];
}

export interface SslClaimRaisedItem {
  id: number;
  vendor_id?: number;
  vendor_name?: string;
  vendor?: string;
  state?: string;
  claim_site_count: number;
  claim_raised_date?: string;
  claim_amount: string | number;
  claim_invoice?: string | null;
  claim_update_date?: string;
  claim_status: number; // 0 = Pending, 1 = Approved, 2 = Rejected
  payment_status?: number | string;
  payment_date?: string;
  payment_amount?: string | number;
  payment_remark?: string;
  [key: string]: any;
}

export interface SslSupplyInspectionItem {
  id: number;
  insp_code?: string;
  vendor_name?: string;
  vendor?: string;
  state?: string;
  date: string;
  no_of_lights: number;
  pending_lights?: number;
  amount: string | number;
  remarks?: string;
  inspection_status: number;
  file?: string | null;
  verify_status?: number;
  verify_remarks?: string;
  [key: string]: any;
}

export interface SslInstallationInspectionItem {
  id: number;
  vendor_name?: string;
  vendor?: string;
  state?: string;
  district: string;
  block: string;
  panchayat: string; // JSON string e.g. "[\"Panchayat A\"]" or string
  date: string;
  no_of_lights: number;
  amount: string | number;
  remarks?: string;
  inspection_remark?: string;
  file?: string | null;
  inspection_status: number;
  verify_status?: number;
  verify_remarks?: string;
  payment_date?: string;
  payment_by?: string;
  payment_remark?: string;
  payment_status?: number | string;
  [key: string]: any;
}

export interface SslInstallationInspectionResponse {
  districts: string[];
  inspections: SslInstallationInspectionItem[];
}

export interface SslDashboardStats {
  site_count: number;
  complete: number;
  pending: number;
  site_assigned: number;
  site_not_assigned: number;
  verify_pending: number;
  verify_approved: number;
  verify_reject: number;
  claim_applicable: number;
  claim_raised: number;
  claim_verify_approved: number;
  claim_verify_pending: number;
  claim_verify_reject: number;
  inst_pay_done: number;
  inst_pay_pending: number;
  cms_upload_pending: number;
}

export interface SslDashboardDistrictRow {
  district: string;
  total_light: number;
  inst_complete: number;
  inst_pending: number;
  verify_approved: number;
  claim_raised: number;
  payment_done: number;
}

export interface SslDashboardData {
  ssl: SslDashboardStats;
  district_install: { district: string; inst_complete: number }[];
  payment_amount: number | string;
  districtwise: SslDashboardDistrictRow[];
  district_installation_month: { month_year: string; monthly_installations: number }[];
}

export interface SslStatusDrillRow {
  id: number;
  unique_id?: string;
  district?: string;
  block?: string;
  panchayat?: string;
  beneficiary_name?: string;
  installation_status?: number;
  inst_verify_status?: number;
  inst_claim_status?: number;
  inst_pay_status?: number;
  [key: string]: any;
}

/* ═════════════════════════════════════════════════════════════════════════
   BiharSslInstallationService Implementation
   ═════════════════════════════════════════════════════════════════════════ */

class BiharSslInstallationService {
  private getHeaders(isMultipart = false): Record<string, string> {
    const token = getAuthToken();
    const companyId = getCompanyId();
    const headers: Record<string, string> = {
      Accept: 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    if (companyId) {
      headers['X-Company-Id'] = companyId;
      headers['company_id'] = companyId;
    }
    if (!isMultipart) {
      headers['Content-Type'] = 'application/json';
    }
    return headers;
  }

  private appendCompany(url: string): string {
    const cid = getCompanyId();
    if (!cid) return url;
    if (url.includes('company_id=')) return url;
    const sep = url.includes('?') ? '&' : '?';
    return `${url}${sep}company_id=${encodeURIComponent(cid)}`;
  }

  private async fetchWithFallback(urlOrEndpoint: string, options: RequestInit = {}): Promise<Response> {
    let urls: string[] = [];
    const baseClean = (API_BASE_URL || 'https://klkerp.com/api').replace(/\/+$/, '');
    const altBase = baseClean.endsWith('/api') ? baseClean.slice(0, -4) : `${baseClean}/api`;

    let cleanEndpoint = urlOrEndpoint;
    if (cleanEndpoint.startsWith('http://') || cleanEndpoint.startsWith('https://')) {
      const u = new URL(cleanEndpoint);
      cleanEndpoint = (u.pathname + u.search).replace(/^\/api/, '');
    }
    if (!cleanEndpoint.startsWith('/')) {
      cleanEndpoint = `/${cleanEndpoint}`;
    }

    const cid = getCompanyId();
    const queryPart = cleanEndpoint.includes('?')
      ? `&company_id=${encodeURIComponent(cid)}`
      : `?company_id=${encodeURIComponent(cid)}`;

    // Build unique URL variations (with and without company_id param, with and without /api/ /v/)
    urls = [
      `${baseClean}${cleanEndpoint}`,
      `${baseClean}${cleanEndpoint}${queryPart}`,
      `${altBase}${cleanEndpoint}`,
      `${altBase}${cleanEndpoint}${queryPart}`,
      `${baseClean}/v${cleanEndpoint}`,
      `${altBase}/v${cleanEndpoint}`,
    ];

    // If endpoint starts with /ssl/, also try /bihar/ssl/
    if (cleanEndpoint.startsWith('/ssl/')) {
      const biharEndpoint = cleanEndpoint.replace('/ssl/', '/bihar/ssl/');
      urls.push(
        `${baseClean}${biharEndpoint}`,
        `${baseClean}${biharEndpoint}${queryPart}`,
        `${altBase}${biharEndpoint}`
      );
    }
    // If endpoint starts with /bihar/ssl-, also try /bihar/ssl/-
    if (cleanEndpoint.startsWith('/bihar/ssl-')) {
      const slashEndpoint = cleanEndpoint.replace('/bihar/ssl-', '/bihar/ssl/');
      urls.push(
        `${baseClean}${slashEndpoint}`,
        `${baseClean}${slashEndpoint}${queryPart}`
      );
    }

    urls = Array.from(new Set(urls));

    for (const url of urls) {
      try {
        const res = await fetch(url, options);
        if (res.status === 200) {
          return res;
        }
        if (res.status !== 404 && res.status !== 401 && res.status !== 302) {
          return res;
        }
      } catch {
        // Continue to fallback
      }
    }
    return fetch(urls[0], options);
  }

  /* ─────────────────────────────────────────────────────────────────────────
     1. View Assigned SSL Lights
     GET /bihar/ssl-view-assigned-ssl-light
     ───────────────────────────────────────────────────────────────────────── */
  async getAssignedLights(): Promise<AssignedSslLightItem[]> {
    try {
      const res = await this.fetchWithFallback(
        BIHAR_API.INSTALLATION.SSL.VIEW_ASSIGNED_LIGHTS,
        {
          method: 'GET',
          headers: this.getHeaders(),
        }
      );
      if (res.ok) {
        const json = await res.json().catch(() => null);
        const list = json?.data || (Array.isArray(json) ? json : []);
        if (Array.isArray(list)) {
          const cid = getCompanyId();
          return list.filter((r: any) => !r.company_id || String(r.company_id) === cid);
        }
      }
    } catch (err) {
      console.error('[Bihar SSL] getAssignedLights error:', err);
    }
    return [];
  }

  /* ─────────────────────────────────────────────────────────────────────────
     2. Accept Assigned SSL
     POST /bihar/ssl-accept-assigned-ssl-light
     ───────────────────────────────────────────────────────────────────────── */
  async acceptAssignedLight(id: number | string): Promise<{ success: boolean; message: string }> {
    const res = await this.fetchWithFallback(
      BIHAR_API.INSTALLATION.SSL.ACCEPT_ASSIGNED,
      {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ id: Number(id), company_id: Number(getCompanyId()) }),
      }
    );
    const json = await res.json().catch(() => null);
    if (!res.ok || json?.success === false) {
      throw new Error(json?.message || `Failed to accept assigned light batch (HTTP ${res.status})`);
    }
    return { success: true, message: json?.message || 'Status changed successfully!!!' };
  }

  /* ─────────────────────────────────────────────────────────────────────────
     3. Fetch Light Names (Installation Dropdown)
     GET /bihar/ssl/installation/fetch-light-name
     ───────────────────────────────────────────────────────────────────────── */
  async fetchLightNames(): Promise<SslLightDropdownItem[]> {
    try {
      const res = await this.fetchWithFallback(
        BIHAR_API.INSTALLATION.SSL.FETCH_LIGHT_NAMES,
        {
          method: 'GET',
          headers: this.getHeaders(),
        }
      );
      if (res.ok) {
        const json = await res.json().catch(() => null);
        const list = json?.data || (Array.isArray(json) ? json : []);
        if (Array.isArray(list)) {
          return list;
        }
      }
    } catch (err) {
      console.error('[Bihar SSL] fetchLightNames error:', err);
    }
    return [];
  }

  /* ─────────────────────────────────────────────────────────────────────────
     4. Fetch Light Details
     GET /bihar/ssl/installation/fetch-light-detail?unique_id=101
     ───────────────────────────────────────────────────────────────────────── */
  async fetchLightDetail(uniqueId: number | string): Promise<SslLightDetail | null> {
    try {
      const res = await this.fetchWithFallback(
        BIHAR_API.INSTALLATION.SSL.FETCH_LIGHT_DETAIL(uniqueId),
        {
          method: 'GET',
          headers: this.getHeaders(),
        }
      );
      if (res.ok) {
        const json = await res.json().catch(() => null);
        if (json?.data) return json.data;
      }
    } catch (err) {
      console.error('[Bihar SSL] fetchLightDetail error:', err);
    }
    return null;
  }

  /* ─────────────────────────────────────────────────────────────────────────
     5. Install SSL Light Store
     POST /bihar/ssl-install-ssl-light-store (multipart/form-data)
     ───────────────────────────────────────────────────────────────────────── */
  async installLightStore(formData: FormData): Promise<{ status: boolean; message: string }> {
    try {
      const res = await this.fetchWithFallback(
        BIHAR_API.INSTALLATION.SSL.INSTALL_LIGHT_STORE,
        {
          method: 'POST',
          headers: this.getHeaders(true),
          body: formData,
        }
      );
      const json = await res.json();
      if (!res.ok || json?.status === false || json?.success === false) {
        const errorMsg =
          json?.message ||
          (json?.errors && Object.values(json.errors).flat().join(', ')) ||
          'Failed to install SSL light.';
        throw new Error(errorMsg);
      }
      return { status: true, message: json?.message || 'Details saved successfully.' };
    } catch (err: any) {
      console.error('[Bihar SSL] installLightStore error:', err);
      throw err;
    }
  }

  /* ─────────────────────────────────────────────────────────────────────────
     6. View Installed Lights (Summary & Lists)
     GET /bihar/ssl-view-installed-light
     ───────────────────────────────────────────────────────────────────────── */
  async getViewInstalledLights(): Promise<InstalledLightsResponse | null> {
    try {
      const res = await this.fetchWithFallback(
        BIHAR_API.INSTALLATION.SSL.VIEW_INSTALLED_LIGHTS,
        {
          method: 'GET',
          headers: this.getHeaders(),
        }
      );
      if (res.ok) {
        const json = await res.json().catch(() => null);
        if (json && (json.install_detail || json.complete_lights || json.payment_lights)) {
          return json;
        }
        if (json?.data && (json.data.install_detail || json.data.complete_lights)) {
          return json.data;
        }
      }
    } catch (err) {
      console.error('[Bihar SSL] getViewInstalledLights error:', err);
    }
    return null;
  }

  /* ─────────────────────────────────────────────────────────────────────────
     7. Edit Installed Light (Load for Edit)
     GET /bihar/ssl-installed-light-edit/{id}
     ───────────────────────────────────────────────────────────────────────── */
  async getInstalledLightEdit(id: number | string): Promise<InstalledLightItem | null> {
    try {
      const res = await this.fetchWithFallback(
        BIHAR_API.INSTALLATION.SSL.EDIT_INSTALLED_LIGHT(id),
        {
          method: 'GET',
          headers: this.getHeaders(),
        }
      );
      if (res.ok) {
        const json = await res.json().catch(() => null);
        if (json?.data) return json.data;
      }
    } catch (err) {
      console.error('[Bihar SSL] getInstalledLightEdit error:', err);
    }
    return null;
  }

  /* ─────────────────────────────────────────────────────────────────────────
     8. Update Installed Light Details
     POST /bihar/ssl-installed-light-edit-store (multipart/form-data)
     ───────────────────────────────────────────────────────────────────────── */
  async updateInstalledLight(formData: FormData): Promise<{ status: boolean; message: string }> {
    const res = await this.fetchWithFallback(
      BIHAR_API.INSTALLATION.SSL.UPDATE_INSTALLED_LIGHT,
      {
        method: 'POST',
        headers: this.getHeaders(true),
        body: formData,
      }
    );
    const json = await res.json().catch(() => null);
    if (!res.ok || json?.status === false) {
      if (res.status === 422 && json?.errors) {
        const first = Object.values(json.errors).flat()[0] as string;
        throw new Error(first || json.message || 'Validation failed');
      }
      throw new Error(json?.message || `Failed to update installed light details (HTTP ${res.status}).`);
    }
    return { status: true, message: json?.message || 'Details Updated Successfully' };
  }

  /* ─────────────────────────────────────────────────────────────────────────
     9. Raise Claim (Minimum 100 Sites Rule)
     POST /bihar/ssl-installed-claim_raised (multipart/form-data)
     ───────────────────────────────────────────────────────────────────────── */
  async raiseClaim(formData: FormData): Promise<{ status: boolean; message: string }> {
    const res = await this.fetchWithFallback(
      BIHAR_API.INSTALLATION.SSL.CLAIM_RAISED,
      {
        method: 'POST',
        headers: this.getHeaders(true),
        body: formData,
      }
    );
    const json = await res.json().catch(() => null);
    if (!res.ok || json?.status === false) {
      if (res.status === 422 && json?.errors) {
        const first = Object.values(json.errors).flat()[0] as string;
        throw new Error(first || json.message || 'Validation failed');
      }
      throw new Error(json?.message || `Failed to raise claim request (HTTP ${res.status}).`);
    }
    return { status: true, message: json?.message || 'Claim Raised Successfully!!!' };
  }

  /* ─────────────────────────────────────────────────────────────────────────
     10. View Claim Details
     GET /bihar/ssl-view-claim-deatils
     ───────────────────────────────────────────────────────────────────────── */
  async getViewClaimDetails(): Promise<SslClaimRaisedItem[]> {
    try {
      const res = await this.fetchWithFallback(
        BIHAR_API.INSTALLATION.SSL.VIEW_CLAIM_DETAILS,
        {
          method: 'GET',
          headers: this.getHeaders(),
        }
      );
      if (res.ok) {
        const json = await res.json().catch(() => null);
        const list = json?.claimraised || json?.data || (Array.isArray(json) ? json : []);
        if (Array.isArray(list)) {
          const cid = getCompanyId();
          return list.filter((r: any) => !r.company_id || String(r.company_id) === cid);
        }
      }
    } catch (err) {
      console.error('[Bihar SSL] getViewClaimDetails error:', err);
    }
    return [];
  }

  /* ─────────────────────────────────────────────────────────────────────────
     11. Download Claim PDF
     GET /bihar/ssl/claim/download-pdf/{id}
     ───────────────────────────────────────────────────────────────────────── */
  async downloadClaimPdf(id: number | string): Promise<Blob> {
    const res = await this.fetchWithFallback(
      BIHAR_API.INSTALLATION.SSL.DOWNLOAD_CLAIM_PDF(id),
      {
        method: 'GET',
        headers: this.getHeaders(),
      }
    );
    if (!res.ok) {
      throw new Error(`Failed to download claim PDF (HTTP ${res.status})`);
    }
    return res.blob();
  }

  /* ─────────────────────────────────────────────────────────────────────────
     12. Update Claim Raised
     POST /bihar/ssl-claim-raised-update (multipart/form-data)
     ───────────────────────────────────────────────────────────────────────── */
  async updateClaimRaised(formData: FormData): Promise<{ status: boolean; message: string }> {
    const res = await this.fetchWithFallback(
      BIHAR_API.INSTALLATION.SSL.UPDATE_CLAIM_RAISED,
      {
        method: 'POST',
        headers: this.getHeaders(true),
        body: formData,
      }
    );
    const json = await res.json().catch(() => null);
    if (!res.ok || json?.status === false) {
      if (res.status === 422 && json?.errors) {
        const first = Object.values(json.errors).flat()[0] as string;
        throw new Error(first || json.message || 'Validation failed');
      }
      throw new Error(json?.message || `Failed to update claim raised (HTTP ${res.status}).`);
    }
    return { status: true, message: json?.message || 'Updated Claim Raised Successfully!' };
  }

  /* ─────────────────────────────────────────────────────────────────────────
     13. View Supply Inspection
     GET /bihar/ssl/installation/light-supply-inspection
     ───────────────────────────────────────────────────────────────────────── */
  async getViewSupplyInspection(): Promise<SslSupplyInspectionItem[]> {
    try {
      const res = await this.fetchWithFallback(
        BIHAR_API.INSTALLATION.SSL.VIEW_SUPPLY_INSPECTION,
        {
          method: 'GET',
          headers: this.getHeaders(),
        }
      );
      if (res.ok) {
        const json = await res.json().catch(() => null);
        const list = json?.data || (Array.isArray(json) ? json : []);
        if (Array.isArray(list)) {
          const cid = getCompanyId();
          return list.filter((r: any) => !r.company_id || String(r.company_id) === cid);
        }
      }
    } catch (err) {
      console.error('[Bihar SSL] getViewSupplyInspection error:', err);
    }
    return [];
  }

  /* ─────────────────────────────────────────────────────────────────────────
     14. Store Supply Inspection
     POST /bihar/ssl/installation/light-supply-inspection-store (multipart/form-data)
     ───────────────────────────────────────────────────────────────────────── */
  async storeSupplyInspection(formData: FormData): Promise<{ success: boolean; message: string; data?: any }> {
    const res = await this.fetchWithFallback(
      BIHAR_API.INSTALLATION.SSL.STORE_SUPPLY_INSPECTION,
      {
        method: 'POST',
        headers: this.getHeaders(true),
        body: formData,
      }
    );
    const json = await res.json().catch(() => null);
    if (!res.ok || json?.success === false) {
      if (res.status === 422 && json?.errors) {
        const first = Object.values(json.errors).flat()[0] as string;
        throw new Error(first || json.message || 'Validation failed');
      }
      throw new Error(json?.message || `Failed to store supply inspection (HTTP ${res.status}).`);
    }
    return { success: true, message: json?.message || 'Created Supply Inspection Successfully!', data: json?.data };
  }

  /* ─────────────────────────────────────────────────────────────────────────
     15. Update Supply Inspection
     POST /bihar/ssl/installation/light-supply-inspection-update/{id}
     ───────────────────────────────────────────────────────────────────────── */
  async updateSupplyInspection(
    id: number | string,
    formData: FormData
  ): Promise<{ success: boolean; message: string; data?: any }> {
    const res = await this.fetchWithFallback(
      BIHAR_API.INSTALLATION.SSL.UPDATE_SUPPLY_INSPECTION(id),
      {
        method: 'POST',
        headers: this.getHeaders(true),
        body: formData,
      }
    );
    const json = await res.json().catch(() => null);
    if (!res.ok || json?.success === false) {
      if (res.status === 422 && json?.errors) {
        const first = Object.values(json.errors).flat()[0] as string;
        throw new Error(first || json.message || 'Validation failed');
      }
      throw new Error(json?.message || `Failed to update supply inspection (HTTP ${res.status}).`);
    }
    return { success: true, message: json?.message || 'Supply Inspection Updated Successfully!', data: json?.data };
  }

  /* ─────────────────────────────────────────────────────────────────────────
     16. View Installation Inspection
     GET /bihar/ssl/installation/light-inspection
     ───────────────────────────────────────────────────────────────────────── */
  async getViewInstallationInspection(): Promise<SslInstallationInspectionResponse> {
    try {
      const res = await this.fetchWithFallback(
        BIHAR_API.INSTALLATION.SSL.VIEW_INSTALLATION_INSPECTION,
        {
          method: 'GET',
          headers: this.getHeaders(),
        }
      );
      if (res.ok) {
        const json = await res.json().catch(() => null);
        const d = json?.data;
        if (d && (Array.isArray(d.districts) || Array.isArray(d.inspections))) {
          const cid = getCompanyId();
          const filteredInspections = (d.inspections || []).filter(
            (r: any) => !r.company_id || String(r.company_id) === cid
          );
          return {
            districts: Array.isArray(d.districts) ? d.districts : [],
            inspections: filteredInspections,
          };
        }
      }
    } catch (err) {
      console.error('[Bihar SSL] getViewInstallationInspection error:', err);
    }
    return { districts: [], inspections: [] };
  }

  /* ─────────────────────────────────────────────────────────────────────────
     17. Store Installation Inspection
     POST /bihar/ssl/installation/light-inspection-store (multipart/form-data)
     ───────────────────────────────────────────────────────────────────────── */
  async storeInstallationInspection(
    formData: FormData
  ): Promise<{ success: boolean; message: string; data?: any }> {
    try {
      const res = await this.fetchWithFallback(
        BIHAR_API.INSTALLATION.SSL.STORE_INSTALLATION_INSPECTION,
        {
          method: 'POST',
          headers: this.getHeaders(true),
          body: formData,
        }
      );
      const json = await res.json();
      if (!res.ok || json?.success === false) {
        throw new Error(json?.message || 'Failed to store installation inspection.');
      }
      return { success: true, message: json?.message || 'Installation Inspection Successfully!', data: json?.data };
    } catch (err: any) {
      console.error('[Bihar SSL] storeInstallationInspection error:', err);
      throw err;
    }
  }

  /* ─────────────────────────────────────────────────────────────────────────
     18. Fetch Inspection Blocks
     GET /bihar/ssl/installation/light-fetch-block/{district}
     ───────────────────────────────────────────────────────────────────────── */
  async fetchInspectionBlocks(district: string): Promise<string[]> {
    try {
      const res = await this.fetchWithFallback(
        BIHAR_API.INSTALLATION.SSL.FETCH_INSPECTION_BLOCKS(district),
        {
          method: 'GET',
          headers: this.getHeaders(),
        }
      );
      if (!res.ok) return [];
      const json = await res.json();
      const list = json?.data || [];
      return list.map((item: any) => item.block || item.name || String(item));
    } catch (err) {
      console.error('[Bihar SSL] fetchInspectionBlocks error:', err);
      return [];
    }
  }

  /* ─────────────────────────────────────────────────────────────────────────
     19. Fetch Inspection Panchayats
     GET /bihar/ssl/installation/light-fetch-panchayat/{block}?district=Patna&block=Danapur
     ───────────────────────────────────────────────────────────────────────── */
  async fetchInspectionPanchayats(
    block: string,
    district: string
  ): Promise<{ panchayat: string; count: number }[]> {
    try {
      const res = await this.fetchWithFallback(
        BIHAR_API.INSTALLATION.SSL.FETCH_INSPECTION_PANCHAYATS(block, district),
        {
          method: 'GET',
          headers: this.getHeaders(),
        }
      );
      if (!res.ok) return [];
      const json = await res.json();
      const list = json?.data || [];
      return list.map((item: any) => ({
        panchayat: item.panchyat || item.panchayat || item.name || 'Unknown',
        count: Number(item.count || 0),
      }));
    } catch (err) {
      console.error('[Bihar SSL] fetchInspectionPanchayats error:', err);
      return [];
    }
  }

  /* ─────────────────────────────────────────────────────────────────────────
     20. Installation Dashboard
     GET /ssl/installation-dashboard
     ───────────────────────────────────────────────────────────────────────── */
  async getDashboardData(): Promise<SslDashboardData | null> {
    try {
      const res = await this.fetchWithFallback(
        BIHAR_API.INSTALLATION.SSL.DASHBOARD,
        {
          method: 'GET',
          headers: this.getHeaders(),
        }
      );
      if (res.ok) {
        const json = await res.json().catch(() => null);
        if (json) {
          const raw = json.data && (json.data.ssl || json.data.districtwise) ? json.data : json;
          if (raw && (raw.ssl || raw.districtwise)) {
            return raw;
          }
        }
      }
    } catch (err) {
      console.error('[Bihar SSL] getDashboardData network error:', err);
    }
    return null;
  }

  /* ─────────────────────────────────────────────────────────────────────────
     21. View Dashboard By Status
     GET /ssl/installation-view-dashboard/{status}
     ───────────────────────────────────────────────────────────────────────── */
  async getDashboardByStatus(status: string): Promise<SslStatusDrillRow[]> {
    try {
      const res = await this.fetchWithFallback(
        BIHAR_API.INSTALLATION.SSL.DASHBOARD_BY_STATUS(status),
        {
          method: 'GET',
          headers: this.getHeaders(),
        }
      );
      if (res.ok) {
        const json = await res.json().catch(() => null);
        const list = json?.data?.ssl || json?.data || (Array.isArray(json) ? json : []);
        if (Array.isArray(list)) {
          return list;
        }
      }
    } catch (err) {
      console.error('[Bihar SSL] getDashboardByStatus network error:', err);
    }
    return [];
  }

  /* ─────────────────────────────────────────────────────────────────────────
     22. Districtwise Dashboard By Status
     GET /ssl/installation-view-district-dashboard/{status}/{district}
     ───────────────────────────────────────────────────────────────────────── */
  async getDashboardByDistrictStatus(status: string, district: string): Promise<SslStatusDrillRow[]> {
    try {
      const res = await this.fetchWithFallback(
        BIHAR_API.INSTALLATION.SSL.DASHBOARD_BY_DISTRICT(status, district),
        {
          method: 'GET',
          headers: this.getHeaders(),
        }
      );
      if (res.ok) {
        const json = await res.json().catch(() => null);
        const list = json?.data?.ssl || json?.data || (Array.isArray(json) ? json : []);
        if (Array.isArray(list)) {
          return list;
        }
      }
    } catch (err) {
      console.error('[Bihar SSL] getDashboardByDistrictStatus network error:', err);
    }
    return [];
  }
}

export const biharSslInstallationService = new BiharSslInstallationService();
export default biharSslInstallationService;
