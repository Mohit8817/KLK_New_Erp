import { API_BASE_URL, authService } from '../../../../services/authService';
import { GOA_API } from '../../V_Portal_APIS/Goa_API';

/* ── Base URLs for media assets ── */
const BACKEND_BASE = (import.meta.env.VITE_API_BASE_URL || 'https://klkerp.com/api')
  .replace(/\/api\/?$/, '')
  .replace(/\/+$/, '');

const R2_BASE = ((import.meta.env.VITE_R2_PUBLIC_URL as string | undefined) ?? '').replace(/\/+$/, '');

export function getGoaSrtInstallationImageCandidates(path?: string | null): string[] {
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

  // Goa SRT specific paths
  candidates.push(`${BACKEND_BASE}/uploads/goa/installation/srt/${filename}`);
  candidates.push(`${BACKEND_BASE}/uploads/goa/srt/installation/${filename}`);
  candidates.push(`${BACKEND_BASE}/uploads/goa/srt/installation/assignsite/${filename}`);
  candidates.push(`${BACKEND_BASE}/uploads/goa/installation/srt/panel/${filename}`);
  candidates.push(`${BACKEND_BASE}/uploads/goa/installation/srt/system/${filename}`);
  candidates.push(`${BACKEND_BASE}/uploads/goa/installation/srt/inverter/${filename}`);
  candidates.push(`${BACKEND_BASE}/uploads/goa/installation/srt/nm_sm/${filename}`);
  candidates.push(`${BACKEND_BASE}/uploads/goa/installation/srt/loger/${filename}`);
  candidates.push(`${BACKEND_BASE}/uploads/goa/installation/srt/claim/${filename}`);
  candidates.push(`${BACKEND_BASE}/uploads/goa/installation/srt/gen/${filename}`);
  candidates.push(`${BACKEND_BASE}/uploads/goa/installation/srt/rms/${filename}`);
  candidates.push(`${BACKEND_BASE}/uploads/goa/${filename}`);
  candidates.push(`${BACKEND_BASE}/uploads/${filename}`);
  candidates.push(`${BACKEND_BASE}/${normalized}`);

  if (R2_BASE) {
    candidates.push(`${R2_BASE}/uploads/goa/installation/srt/${filename}`);
    candidates.push(`${R2_BASE}/${filename}`);
  }
  candidates.push(`https://pub-21d2019fecbe4a96a88c93b2f091317a.r2.dev/${filename}`);

  return Array.from(new Set(candidates));
}

/* ───────── TypeScript Interfaces for Goa SRT Installation ───────── */
export interface GoaSrtDashboardSummary {
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
  [key: string]: any;
}

export interface GoaSrtDistrictRow {
  district: string;
  site_count?: number;
  inst_complete?: number;
  inst_pending?: number;
  inst_pay1?: number;
  [key: string]: any;
}

export interface GoaSrtDashboardData {
  goa_srts: GoaSrtDashboardSummary;
  district_install?: { district: string; inst_complete: number }[];
  districtwise?: GoaSrtDistrictRow[];
  district_installation_month?: { month_year: string; monthly_installations: number }[];
}

export interface GoaSrtAssignBatchItem {
  id: number;
  company_id?: number | string;
  vendor?: number | string;
  state?: string;
  district?: string;
  status: number;
  site_name?: string[] | string;
  vendors?: {
    id?: number;
    name?: string;
    contact?: string;
    email?: string;
    [key: string]: any;
  };
  assign_date?: string;
  deadline_date?: string;
  site_count?: number | string;
  file?: string;
  remarks?: string;
  [key: string]: any;
}

export interface GoaSrtSiteDropdownItem {
  id: number;
  site_name: string;
}

export interface GoaSrtSiteDetailItem {
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
  wo_no?: string;
  vendor?: string;
  date?: string;
  material_invoice_date?: string;
  material_bill_invoice?: string;
  inst_status?: string | number;
  inverter_no?: string | null;
  solarmeter_no?: string | null;
  loger_no?: string | null;
  nm_sm_no?: string | null;
  [key: string]: any;
}

export interface GoaSrtInstalledSiteItem {
  id: number;
  site_name?: string;
  state?: string;
  district?: string;
  site_inst_status?: number;
  contact_person?: string;
  contact_number?: string;
  solarmeter_no?: string;
  nm_sm_no?: string;
  loger_no?: string;
  inverter_no?: string;
  ca_no?: string;
  inst_verify_status?: number;
  inst_claim_status?: number;
  inst_claim_date?: string;
  inst_claim_amount?: string | number;
  inst_claim_invoice?: string;
  inst_date?: string;
  inst_remarks?: string;
  panel_image?: string;
  system_image?: string;
  inverter_image?: string;
  nm_sm_image?: string;
  loger_image?: string;
  inst_latitude?: string | number;
  inst_longitude?: string | number;
  inst_pay1_status?: number;
  inst_pay1_date?: string;
  inst_pay1_amount?: string | number;
  inst_pay2_status?: number;
  inst_pay2_date?: string;
  inst_pay2_amount?: string | number;
  inst_pay3_status?: number;
  inst_pay3_date?: string;
  inst_pay3_amount?: string | number;
  inst_pay3_raised_status?: number;
  inst_doc_submit?: number;
  inst_gen_image?: string;
  inst_rms_loger_image?: string;
  claim_updated_at?: string;
  claim_updated_by?: string;
  inspection_status?: string | number;
  [key: string]: any;
}

export interface GoaSrtCompletedData {
  claimedapplicable: number;
  approvedsite: number;
  verifypending: number;
  rejectsite: number;
  payment1: number;
  payment2: number;
  payment3: number;
  docsubmit: number;
  claimraised: number;
  paymentsitecount: number;
  complete: number;
  totalsite: number;
  pendingsite: number;
  paymentsite: GoaSrtInstalledSiteItem[];
  completesite: GoaSrtInstalledSiteItem[];
}

class GoaSrtInstallationService {
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

  /* 1. Dashboard: GET /goa/srt/installation/dashboard */
  async getDashboardData(): Promise<GoaSrtDashboardData | null> {
    try {
      const res = await this.fetchWithFallback(GOA_API.INSTALLATION.SRT.DASHBOARD, {
        method: 'GET',
        headers: this.getHeaders(),
      });
      if (!res.ok) return null;
      const json = await res.json();
      return json?.data || null;
    } catch (err) {
      console.error('[Goa SRT Service] getDashboardData error:', err);
      return null;
    }
  }

  /* 2. Dashboard By Status: GET /goa/srt/installation/dashboard/view-data/{status} */
  async getDashboardViewData(status: string): Promise<any[]> {
    try {
      const res = await this.fetchWithFallback(GOA_API.INSTALLATION.SRT.DASHBOARD_BY_STATUS(status), {
        method: 'GET',
        headers: this.getHeaders(),
      });
      if (!res.ok) return [];
      const json = await res.json();
      return json?.data || [];
    } catch (err) {
      console.error('[Goa SRT Service] getDashboardViewData error:', err);
      return [];
    }
  }

  /* 3. Dashboard Districtwise: GET /goa/srt/installation/dashboard/districtwise/{status}/{district} */
  async getDashboardDistrictwiseData(status: string, district: string): Promise<any[]> {
    try {
      const res = await this.fetchWithFallback(
        GOA_API.INSTALLATION.SRT.DASHBOARD_DISTRICTWISE(status, district),
        {
          method: 'GET',
          headers: this.getHeaders(),
        }
      );
      if (!res.ok) return [];
      const json = await res.json();
      return json?.data || [];
    } catch (err) {
      console.error('[Goa SRT Service] getDashboardDistrictwiseData error:', err);
      return [];
    }
  }

  /* 4. View Assigned Sites: GET /goa/srt/installation/view-assign-site */
  async getViewAssignSites(): Promise<GoaSrtAssignBatchItem[]> {
    try {
      const res = await this.fetchWithFallback(GOA_API.INSTALLATION.SRT.VIEW_ASSIGN_SITE, {
        method: 'GET',
        headers: this.getHeaders(),
      });
      if (!res.ok) return [];
      const json = await res.json();
      return json?.data || [];
    } catch (err) {
      console.error('[Goa SRT Service] getViewAssignSites error:', err);
      return [];
    }
  }

  /* 5. Update Status (Accept Assignment): GET /goa/srt/installation/update-status?id={id} */
  async acceptAssignSite(id: number | string): Promise<{ success: boolean; message: string }> {
    const res = await this.fetchWithFallback(GOA_API.INSTALLATION.SRT.UPDATE_STATUS(id), {
      method: 'GET',
      headers: this.getHeaders(),
    });
    const json = await res.json();
    if (!res.ok) {
      throw new Error(json?.message || `Failed to accept assignment (HTTP ${res.status})`);
    }
    return json;
  }

  /* 6. Fetch Site Name: GET /goa/srt/installation/fetch-site-name */
  async fetchSiteNames(): Promise<GoaSrtSiteDropdownItem[]> {
    try {
      const res = await this.fetchWithFallback(GOA_API.INSTALLATION.SRT.FETCH_SITE_NAME, {
        method: 'GET',
        headers: this.getHeaders(),
      });
      if (!res.ok) return [];
      const json = await res.json();
      return json?.data || [];
    } catch (err) {
      console.error('[Goa SRT Service] fetchSiteNames error:', err);
      return [];
    }
  }

  /* 7. Fetch Site Detail: GET /goa/srt/installation/fetch-site-detail?site_id={site_id} */
  async fetchSiteDetail(siteId: number | string): Promise<GoaSrtSiteDetailItem | null> {
    try {
      const res = await this.fetchWithFallback(GOA_API.INSTALLATION.SRT.FETCH_SITE_DETAIL(siteId), {
        method: 'GET',
        headers: this.getHeaders(),
      });
      if (!res.ok) return null;
      const json = await res.json();
      return json?.data || null;
    } catch (err) {
      console.error('[Goa SRT Service] fetchSiteDetail error:', err);
      return null;
    }
  }

  /* 8. Store Installation Data: ANY / POST /goa/srt/installation/store-data */
  async storeInstallationData(formData: FormData): Promise<{ success: boolean; message: string; data?: any }> {
    const res = await this.fetchWithFallback(GOA_API.INSTALLATION.SRT.STORE_DATA, {
      method: 'POST',
      headers: this.getHeaders(true),
      body: formData,
    });
    const json = await res.json();
    if (!res.ok) {
      const errMsg =
        json?.message ||
        (json?.errors ? Object.values(json.errors).flat().join(', ') : 'Failed to submit installation data');
      throw new Error(errMsg);
    }
    return json;
  }

  /* 9. Completed Installation Data: GET /goa/srt/installation/completed-data */
  async getCompletedData(): Promise<GoaSrtCompletedData | null> {
    try {
      const res = await this.fetchWithFallback(GOA_API.INSTALLATION.SRT.COMPLETED_DATA, {
        method: 'GET',
        headers: this.getHeaders(),
      });
      if (!res.ok) return null;
      const json = await res.json();
      return json?.data || null;
    } catch (err) {
      console.error('[Goa SRT Service] getCompletedData error:', err);
      return null;
    }
  }

  /* 10. Fetch Installation Data for Editing: GET /goa/srt/installation/update-site?site_id={site_id} */
  async fetchUpdateSite(siteId: number | string): Promise<any> {
    try {
      const res = await this.fetchWithFallback(GOA_API.INSTALLATION.SRT.UPDATE_SITE(siteId), {
        method: 'GET',
        headers: this.getHeaders(),
      });
      if (!res.ok) return null;
      const json = await res.json();
      return json?.data?.srt || json?.data || null;
    } catch (err) {
      console.error('[Goa SRT Service] fetchUpdateSite error:', err);
      return null;
    }
  }

  /* 11. Update Installation Data: POST /goa/srt/installation/update-site-store */
  async updateSiteStore(formData: FormData): Promise<{ success: boolean; message: string }> {
    const res = await this.fetchWithFallback(GOA_API.INSTALLATION.SRT.UPDATE_SITE_STORE, {
      method: 'POST',
      headers: this.getHeaders(true),
      body: formData,
    });
    const json = await res.json();
    if (!res.ok) {
      const errMsg =
        json?.message ||
        (json?.errors ? Object.values(json.errors).flat().join(', ') : 'Failed to update installation details');
      throw new Error(errMsg);
    }
    return json;
  }

  /* 12. View Payment Claims: GET /goa/srt/installation/view-payment */
  async getViewPayments(): Promise<GoaSrtInstalledSiteItem[]> {
    try {
      const res = await this.fetchWithFallback(GOA_API.INSTALLATION.SRT.VIEW_PAYMENT, {
        method: 'GET',
        headers: this.getHeaders(),
      });
      if (!res.ok) return [];
      const json = await res.json();
      return json?.data || [];
    } catch (err) {
      console.error('[Goa SRT Service] getViewPayments error:', err);
      return [];
    }
  }

  /* 13. Raise Installation Claim: POST /goa/srt/installation/claim-raised */
  async raiseClaim(formData: FormData): Promise<{ success: boolean; message: string }> {
    const res = await this.fetchWithFallback(GOA_API.INSTALLATION.SRT.CLAIM_RAISED, {
      method: 'POST',
      headers: this.getHeaders(true),
      body: formData,
    });
    const json = await res.json();
    if (!res.ok) {
      const errMsg =
        json?.message ||
        (json?.errors ? Object.values(json.errors).flat().join(', ') : 'Failed to raise installation claim');
      throw new Error(errMsg);
    }
    return json;
  }

  /* 14. Raise Third Payment (15%): POST /goa/srt/installation/raised-payment3 */
  async raisePayment3(formData: FormData): Promise<{ success: boolean; message: string }> {
    const res = await this.fetchWithFallback(GOA_API.INSTALLATION.SRT.RAISED_PAYMENT3, {
      method: 'POST',
      headers: this.getHeaders(true),
      body: formData,
    });
    const json = await res.json();
    if (!res.ok) {
      const errMsg =
        json?.message ||
        (json?.errors ? Object.values(json.errors).flat().join(', ') : 'Failed to raise 3rd payment request');
      throw new Error(errMsg);
    }
    return json;
  }

  /* 15. Submit Document: GET /goa/srt/installation/submit-document?site_id={site_id} */
  async submitDocument(siteId: number | string): Promise<{ success: boolean; message: string }> {
    const res = await this.fetchWithFallback(GOA_API.INSTALLATION.SRT.SUBMIT_DOCUMENT(siteId), {
      method: 'GET',
      headers: this.getHeaders(),
    });
    const json = await res.json();
    if (!res.ok) {
      throw new Error(json?.message || 'Failed to submit document');
    }
    return json;
  }
}

export const goaSrtInstallationService = new GoaSrtInstallationService();
export default goaSrtInstallationService;
