import { API_BASE_URL, authService } from '../../../../services/authService';
import { BIHAR_API } from '../../V_Portal_APIS/Bihar_API';
import { extractBackendError } from '../../common-services/vPortalFormUtils';

/* ── Base URLs for media assets ── */
const BACKEND_BASE = (import.meta.env.VITE_API_BASE_URL || 'https://klkerp.com/api')
  .replace(/\/api\/?$/, '')
  .replace(/\/+$/, '');

const R2_BASE = ((import.meta.env.VITE_R2_PUBLIC_URL as string | undefined) ?? '').replace(/\/+$/, '');

export function getSrtInstallationImageCandidates(path?: string | null): string[] {
  if (!path || typeof path !== 'string') return [];
  const clean = path.trim();
  if (!clean) return [];

  if (/^(https?:)?\/\//i.test(clean) || clean.startsWith('data:') || clean.startsWith('blob:')) {
    return [clean];
  }

  if (clean.startsWith('r2:')) {
    const key = clean.slice(3).replace(/^\/+/, '');
    const urls: string[] = [];
    if (R2_BASE) urls.push(`${R2_BASE}/${key}`);
    urls.push(`${BACKEND_BASE}/uploads/${key}`);
    return urls;
  }

  const normalized = clean.replace(/^\/+/, '');
  const filename = normalized.split('/').pop() || normalized;
  const candidates: string[] = [];

  if (normalized.startsWith('uploads/')) {
    candidates.push(`${BACKEND_BASE}/${normalized}`);
  } else if (normalized.startsWith('storage/')) {
    candidates.push(`${BACKEND_BASE}/${normalized}`);
  }

  // SRT specific paths
  candidates.push(`${BACKEND_BASE}/uploads/bihar/installation/srt/panel/${filename}`);
  candidates.push(`${BACKEND_BASE}/uploads/bihar/installation/srt/system/${filename}`);
  candidates.push(`${BACKEND_BASE}/uploads/bihar/installation/srt/inverter/${filename}`);
  candidates.push(`${BACKEND_BASE}/uploads/bihar/installation/srt/nm_sm/${filename}`);
  candidates.push(`${BACKEND_BASE}/uploads/bihar/installation/srt/loger/${filename}`);
  candidates.push(`${BACKEND_BASE}/uploads/bihar/installation/srt/${filename}`);
  candidates.push(`${BACKEND_BASE}/uploads/bihar/installation/${filename}`);
  candidates.push(`${BACKEND_BASE}/uploads/${filename}`);
  candidates.push(`${BACKEND_BASE}/${normalized}`);

  if (R2_BASE) {
    candidates.push(`${R2_BASE}/uploads/bihar/installation/srt/${filename}`);
    candidates.push(`${R2_BASE}/${filename}`);
  }
  candidates.push(`https://pub-21d2019fecbe4a96a88c93b2f091317a.r2.dev/${filename}`);

  return Array.from(new Set(candidates));
}

export function getMediaUrl(path?: string | null): string {
  if (!path) return '';
  const c = getSrtInstallationImageCandidates(path);
  return c[0] || '';
}

/* ───────── TypeScript Interfaces for Bihar SRT Installation ───────── */
export interface SrtBatchSiteNameItem {
  id: number;
  site_name: string;
  inst_deadline?: string;
  [key: string]: any;
}

export interface SrtAssignBatchItem {
  id: number;
  company_id?: number | string;
  vendor?: number | string;
  state?: string;
  district?: string;
  sitecount?: number | string;
  site_count?: number | string;
  site_name?: string | any[];
  status: number | string;
  inst_deadline?: string;
  deadline_date?: string;
  assign_date?: string;
  site_names?: SrtBatchSiteNameItem[];
  [key: string]: any;
}

export interface SrtSiteDropdownItem {
  id: number;
  site_name: string;
}

export interface SrtSiteDetailItem {
  id: number;
  discom?: string;
  state?: string;
  district?: string;
  dept_name?: string;
  site_name?: string;
  location?: string;
  firm_name?: string;
  plant_sc?: string;
  phase?: string;
  sanction_load?: string;
  contact_person?: string;
  contact_number?: string;
  ca_no?: string;
  inverter_no?: string | null;
  solarmeter_no?: string | null;
  loger_no?: string | null;
  nm_sm_no?: string | null;
  [key: string]: any;
}

export interface SrtInstalledSiteItem {
  id: number;
  site_name?: string;
  site_inst_status?: number;
  contact_person?: string;
  contact_number?: string;
  solarmeter_no?: string;
  nm_sm_no?: string;
  loger_no?: string;
  inverter_no?: string;
  ca_no?: string;
  inst_verify_status?: number;
  inst_date?: string;
  inst_remarks?: string;
  panel_image?: string;
  system_image?: string;
  inverter_image?: string;
  nm_sm_image?: string;
  loger_image?: string;
  inst_latitude?: string | number;
  inst_longitude?: string | number;
  [key: string]: any;
}

export interface SrtViewInstallSummary {
  totalsite: number;
  complete: number;
  pendingsite: number;
  approvedsite: number;
  verifypending: number;
  rejectsite: number;
  claimedapplicable: number;
  claimraised: number;
  docsubmit: number;
  payment1: number;
  payment2: number;
  payment3: number;
  paymentsitecount: number;
  paymentsite: SrtInstalledSiteItem[];
  completesite: SrtInstalledSiteItem[];
}

export interface SrtDashboardSummary {
  site_count: number;
  complete: number;
  pending: number;
  inpection_pending: number;
  inpection_complete: number;
  verify_pending: number;
  verify_approved: number;
  verify_reject: number;
  claim_applicable: number;
  claim_raised: number;
  inst_doc_complete: number;
  inst_doc_pending: number;
  inst_pay1: number;
  inst_pay2: number;
  inst_pay3: number;
  inst_pay1_amount: string | number;
  inst_pay2_amount: string | number;
  inst_pay3_amount: string | number;
}

export interface SrtDistrictRow {
  district: string;
  site_count?: number;
  inst_complete?: number;
  inst_pending?: number;
  inst_pay1?: number;
  [key: string]: any;
}

export interface SrtDashboardData {
  srtdatas: SrtDashboardSummary;
  district_install?: { district: string; inst_complete: number }[];
  districtwise?: SrtDistrictRow[];
  district_installation_month?: { month_year: string; monthly_installations: number }[];
}

export interface SrtInstallClaimItem {
  id: number;
  company_id?: string | number;
  unique_id?: string | number | null;
  discom?: string;
  state?: string;
  volume?: string;
  district?: string;
  dept_name?: string;
  site_name?: string;
  location?: string;
  firm_name?: string;
  ca_no?: string;
  sanction_load?: string;
  plant_sc?: string;
  wo_no?: string | null;
  phase?: string;
  survey_by?: string | null;
  survey_status?: number;
  survey_id?: number | null;
  vendor?: string | number;
  contact_person?: string;
  contact_number?: string;
  inst_vendor?: string | number;
  inst_accept?: string | number;
  inst_date?: string | null;
  inst_assign_date?: string | null;
  inst_deadline?: string | null;
  inst_assigned_id?: string | null;
  inst_assigned_by?: string | null;
  site_inst_status?: string | number;
  inst_verify_status?: string | number;
  inst_verify_date?: string | null;
  inst_verify_by?: string | null;
  inst_claim_status?: string | number;
  inst_claim_invoice?: string | null;
  inst_claim_amount?: string | number | null;
  inst_claim_date?: string | null;
  inst_claim_update_by?: string | null;
  inst_claim_update_date?: string | null;
  inst_pay1?: string | number | null;
  inst_pay1_amount?: string | number | null;
  inst_pay1_status?: string | number | null;
  inst_pay1_date?: string | null;
  inst_pay1_remark?: string | null;
  inst_doc_submit?: string | number | null;
  inst_pay2?: string | number | null;
  inst_pay2_amount?: string | number | null;
  inst_pay2_status?: string | number | null;
  inst_pay2_date?: string | null;
  inst_pay2_remark?: string | null;
  inst_pay3?: string | number | null;
  inst_pay3_amount?: string | number | null;
  inst_pay3_status?: string | number | null;
  inst_pay3_date?: string | null;
  inst_pay3_remark?: string | null;
  inst_pay3_raised_status?: string | number | null;
  inst_gen_image?: string | null;
  inst_rms_loger_image?: string | null;
  inst_inspection?: string | number | null;
  // Aliases for backward compatibility
  claim_status?: string | number;
  claim_invoice?: string | null;
  claim_amount?: string | number | null;
  claim_raised_date?: string | null;
  claim_date?: string | null;
  claim_update_by?: string | null;
  claim_update_date?: string | null;
  payment1_date?: string | null;
  payment1_amount?: string | number | null;
  payment1_status?: string | number | null;
  doc_submit?: string | number | null;
  payment2_date?: string | null;
  payment2_amount?: string | number | null;
  payment2_status?: string | number | null;
  payment3_raised?: string | number | null;
  generation_image?: string | null;
  rms_loger_image?: string | null;
  payment3_date?: string | null;
  payment3_amount?: string | number | null;
  payment3_status?: string | number | null;
  [key: string]: any;
}

class BiharSrtInstallationService {
  private getHeaders(isMultipart = false): Record<string, string> {
    const token = authService.getToken();
    const headers: Record<string, string> = {
      Accept: 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    if (!isMultipart) {
      headers['Content-Type'] = 'application/json';
    }
    return headers;
  }

  private async fetchWithFallback(urlOrEndpoint: string, options: RequestInit = {}): Promise<Response> {
    let urls: string[] = [];
    const baseClean = API_BASE_URL.replace(/\/+$/, '');
    const altBase = baseClean.endsWith('/api') ? baseClean.slice(0, -4) : `${baseClean}/api`;

    if (urlOrEndpoint.startsWith('http://') || urlOrEndpoint.startsWith('https://')) {
      const u = new URL(urlOrEndpoint);
      const cleanPath = (u.pathname + u.search).replace(/^\/api/, '');
      urls = [
        urlOrEndpoint,
        `${baseClean}${cleanPath}`,
        `${altBase}${cleanPath}`,
        `${baseClean}/v${cleanPath}`,
      ];
      urls = Array.from(new Set(urls));
    } else {
      const cleanEndpoint = urlOrEndpoint.startsWith('/') ? urlOrEndpoint : `/${urlOrEndpoint}`;
      urls = [
        `${baseClean}${cleanEndpoint}`,
        `${altBase}${cleanEndpoint}`,
        `${baseClean}/v${cleanEndpoint}`,
      ];
    }

    for (const url of urls) {
      try {
        const res = await fetch(url, options);
        if (res.status !== 404) {
          return res;
        }
      } catch {
        // try next fallback
      }
    }
    return fetch(urls[0], options);
  }

  /* 1. View Assigned SRT Sites */
  async getViewAssignSites(): Promise<SrtAssignBatchItem[]> {
    try {
      const res = await this.fetchWithFallback(BIHAR_API.INSTALLATION.SRT.VIEW_ASSIGN_SITE, {
        method: 'GET',
        headers: this.getHeaders(),
      });
      if (!res.ok) return [];
      const json = await res.json();
      return json?.data || [];
    } catch (err) {
      console.error('[SRT Installation] getViewAssignSites error:', err);
      return [];
    }
  }

  /* 2. Accept Assigned SRT Sites */
  async acceptAssignSite(id: number | string): Promise<{ success: boolean; message: string }> {
    const res = await this.fetchWithFallback(BIHAR_API.INSTALLATION.SRT.ASSIGN_SITE_ACCEPT, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ id: Number(id) }),
    });
    const json = await res.json();
    if (!res.ok) {
      throw new Error(json?.message || `Failed to accept assignment (HTTP ${res.status})`);
    }
    return json;
  }

  /* 3. Fetch SRT Site Names (Installation Dropdown) */
  async fetchSiteNames(): Promise<SrtSiteDropdownItem[]> {
    try {
      const res = await this.fetchWithFallback(BIHAR_API.INSTALLATION.SRT.FETCH_SITE_NAME, {
        method: 'GET',
        headers: this.getHeaders(),
      });
      if (!res.ok) return [];
      const json = await res.json();
      return json?.data || [];
    } catch (err) {
      console.error('[SRT Installation] fetchSiteNames error:', err);
      return [];
    }
  }

  /* 4. Fetch SRT Site Detail */
  async fetchSiteDetail(srtId: number | string): Promise<SrtSiteDetailItem | null> {
    try {
      const res = await this.fetchWithFallback(BIHAR_API.INSTALLATION.SRT.FETCH_SITE_DETAIL(srtId), {
        method: 'GET',
        headers: this.getHeaders(),
      });
      if (!res.ok) return null;
      const json = await res.json();
      return json?.data || null;
    } catch (err) {
      console.error('[SRT Installation] fetchSiteDetail error:', err);
      return null;
    }
  }

  /* 5. SRT Installation Store (multipart) */
  async storeInstallation(formData: FormData): Promise<{ success: boolean; message: string; data?: any }> {
    const res = await this.fetchWithFallback(BIHAR_API.INSTALLATION.SRT.INSTALLATION_STORE, {
      method: 'POST',
      headers: this.getHeaders(true),
      body: formData,
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      const extracted = extractBackendError(json, `Failed to store installation (HTTP ${res.status})`);
      const err: any = new Error(extracted.message);
      err.errors = json.errors || extracted.fieldErrors;
      err.data = json;
      throw err;
    }
    return json;
  }

  /* 6. View Installed Sites (Summary & Lists) */
  async getViewInstalledSites(): Promise<SrtViewInstallSummary | null> {
    try {
      const res = await this.fetchWithFallback(BIHAR_API.INSTALLATION.SRT.VIEW_INSTALL_SITES, {
        method: 'GET',
        headers: this.getHeaders(),
      });
      if (!res.ok) return null;
      const json = await res.json();
      return json?.data || null;
    } catch (err) {
      console.error('[SRT Installation] getViewInstalledSites error:', err);
      return null;
    }
  }

  /* 7. Edit Installed Site (Load for Edit) */
  async getEditInstallSite(id: number | string): Promise<SrtInstalledSiteItem | null> {
    try {
      const res = await this.fetchWithFallback(BIHAR_API.INSTALLATION.SRT.EDIT_INSTALL_SITE(id), {
        method: 'GET',
        headers: this.getHeaders(),
      });
      if (!res.ok) return null;
      const json = await res.json();
      return json?.data?.srt || json?.data || null;
    } catch (err) {
      console.error('[SRT Installation] getEditInstallSite error:', err);
      return null;
    }
  }

  /* 8. Update Installed Site Details (multipart) */
  async updateInstallSite(formData: FormData): Promise<{ status: boolean; message: string }> {
    const res = await this.fetchWithFallback(BIHAR_API.INSTALLATION.SRT.EDIT_INSTALL_SITE_STORE, {
      method: 'POST',
      headers: this.getHeaders(true),
      body: formData,
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      const extracted = extractBackendError(json, `Failed to update installation (HTTP ${res.status})`);
      const err: any = new Error(extracted.message);
      err.errors = json.errors || extracted.fieldErrors;
      err.data = json;
      throw err;
    }
    return json;
  }

  /* 9. Installation Document Submit */
  async submitInstallDocument(id: number | string): Promise<{ status: boolean; message: string }> {
    const res = await this.fetchWithFallback(BIHAR_API.INSTALLATION.SRT.INSTALL_DOCUMENT_STORE, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ id: Number(id) }),
    });
    const json = await res.json();
    if (!res.ok) {
      throw new Error(json?.message || `Failed to submit document (HTTP ${res.status})`);
    }
    return json;
  }

  /* 10. View Install Claims */
  async getViewInstallClaims(): Promise<SrtInstallClaimItem[]> {
    try {
      const res = await this.fetchWithFallback(BIHAR_API.INSTALLATION.SRT.VIEW_INSTALL_CLAIM, {
        method: 'GET',
        headers: this.getHeaders(),
      });
      const json = await res.json();
      const list = Array.isArray(json?.data)
        ? json.data
        : Array.isArray(json)
        ? json
        : Array.isArray(json?.data?.data)
        ? json.data.data
        : Array.isArray(json?.claimrequest)
        ? json.claimrequest
        : [];
      return list;
    } catch (err) {
      console.error('[SRT Installation] getViewInstallClaims error:', err);
      return [];
    }
  }

  /* 11. Raise SRT Install Claim */
  async raiseInstallClaim(formData: FormData): Promise<{ status: boolean; message: string }> {
    const res = await this.fetchWithFallback(BIHAR_API.INSTALLATION.SRT.INSTALL_CLAIM_RAISED, {
      method: 'POST',
      headers: this.getHeaders(true),
      body: formData,
    });
    const json = await res.json();
    if (!res.ok) {
      if (res.status === 422 && json?.errors) {
        const first = Object.values(json.errors).flat()[0] as string;
        throw new Error(first || json.message || 'Validation failed');
      }
      throw new Error(json?.message || `Failed to raise claim (HTTP ${res.status})`);
    }
    return json;
  }

  /* 12. SRT Installation Dashboard */
  async getDashboardData(): Promise<SrtDashboardData | null> {
    try {
      const res = await this.fetchWithFallback(BIHAR_API.INSTALLATION.SRT.DASHBOARD, {
        method: 'GET',
        headers: this.getHeaders(),
      });
      if (!res.ok) return null;
      const json = await res.json();
      return json?.data || null;
    } catch (err) {
      console.error('[SRT Installation] getDashboardData error:', err);
      return null;
    }
  }

  /* 13. View Dashboard Data By Status */
  async getDashboardSitesByStatus(status: string): Promise<any[]> {
    try {
      const res = await this.fetchWithFallback(BIHAR_API.INSTALLATION.SRT.DASHBOARD_BY_STATUS(status), {
        method: 'GET',
        headers: this.getHeaders(),
      });
      if (!res.ok) return [];
      const json = await res.json();
      return json?.data?.srt || [];
    } catch (err) {
      console.error('[SRT Installation] getDashboardSitesByStatus error:', err);
      return [];
    }
  }

  /* 14. Districtwise Dashboard Data By Status */
  async getDashboardSitesByDistrict(status: string, district: string): Promise<any[]> {
    try {
      const res = await this.fetchWithFallback(
        BIHAR_API.INSTALLATION.SRT.DASHBOARD_BY_DISTRICT(status, district),
        {
          method: 'GET',
          headers: this.getHeaders(),
        }
      );
      if (!res.ok) return [];
      const json = await res.json();
      return json?.data?.srt || [];
    } catch (err) {
      console.error('[SRT Installation] getDashboardSitesByDistrict error:', err);
      return [];
    }
  }
}

export const biharSrtInstallationService = new BiharSrtInstallationService();
export default biharSrtInstallationService;
