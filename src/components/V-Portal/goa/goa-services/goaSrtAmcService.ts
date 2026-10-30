import { API_BASE_URL, authService } from '../../../../services/authService';
import { GOA_API } from '../../V_Portal_APIS/Goa_API';

/* ── Base URLs for media assets ── */
const BACKEND_BASE = (import.meta.env.VITE_API_BASE_URL || 'https://klkerp.com/api')
  .replace(/\/api\/?$/, '')
  .replace(/\/+$/, '');

const R2_BASE = ((import.meta.env.VITE_R2_PUBLIC_URL as string | undefined) ?? '').replace(/\/+$/, '');

export function getGoaAmcImageCandidates(path?: string | null): string[] {
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

  // AMC specific upload paths
  candidates.push(`${BACKEND_BASE}/uploads/amcsrt/${filename}`);
  candidates.push(`${BACKEND_BASE}/uploads/amc/${filename}`);
  candidates.push(`${BACKEND_BASE}/uploads/goa/amcsrt/${filename}`);
  candidates.push(`${BACKEND_BASE}/uploads/goa/amc/${filename}`);
  candidates.push(`${BACKEND_BASE}/uploads/goa/${filename}`);
  candidates.push(`${BACKEND_BASE}/uploads/${filename}`);
  candidates.push(`${BACKEND_BASE}/${normalized}`);

  if (R2_BASE) {
    candidates.push(`${R2_BASE}/uploads/amcsrt/${filename}`);
    candidates.push(`${R2_BASE}/${filename}`);
  }
  candidates.push(`https://pub-21d2019fecbe4a96a88c93b2f091317a.r2.dev/${filename}`);

  return Array.from(new Set(candidates));
}

/* ───────── TypeScript Interfaces ───────── */
export interface GoaAmcTypeItem {
  amc: string;
}

export interface GoaAmcSiteDetail {
  id: number;
  discom?: string;
  state?: string;
  district?: string;
  dept_name?: string;
  site_name?: string;
  location?: string;
  firm_name?: string;
  ca_no?: string;
  sanction_load?: string;
  plant_sc?: string;
  wo_no?: string;
  phase?: string;
  vendor?: string | number;
  date?: string;
  material_invoice_date?: string;
  material_bill_invoice?: string;
  installation_status?: string;
  [key: string]: any;
}

export interface GoaAmcSiteRecord {
  id: number;
  company_id?: number;
  state?: string;
  site_id: number;
  amc: string;
  amc_assigned_to?: number;
  amc_assigned_time?: string;
  amc_status: number; // 0 = Pending, 1 = Done
  amc_date?: string;
  amcverify_status?: number; // 0 = Pending, 1 = Approved, 2 = Rejected
  amc_beneficiary_name?: string;
  amc_beneficiary_contact?: string;
  amc_remark?: string;
  amc_latitude?: string | number;
  amc_longitude?: string | number;
  amc_image1?: string | null;
  amc_image2?: string | null;
  amc_image3?: string | null;
  amc_image4?: string | null;
  amc_image5?: string | null;
  amc_image6?: string | null;
  amc_image7?: string | null;
  amc_image8?: string | null;
  amc_image9?: string | null;
  amc_image10?: string | null;
  srtdata?: GoaAmcSiteDetail;
  [key: string]: any;
}

export interface GoaAmcViewData {
  srt: GoaAmcSiteRecord[]; // Pending AMC (amc_status = 0)
  coms: GoaAmcSiteRecord[]; // Completed AMC (amc_status = 1)
}

export interface GoaAmcComplaintRecord {
  id: number;
  state?: string;
  complaint_id?: string;
  discom?: string;
  district?: string;
  dept_name?: string;
  site_name?: string;
  location?: string;
  firm_name?: string;
  ca_no?: string;
  sanction_load?: string;
  plant_sc?: string;
  wo_no?: string;
  phase?: string;
  vendor?: any;
  complaint?: string;
  start_date?: string;
  file?: string | null;
  raised_complaint?: number;
  sms?: string;
  created_by?: number;
  status?: number;
  close_status?: number;
  [key: string]: any;
}

class GoaSrtAmcService {
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
        // try next
      }
    }
    return fetch(urls[0], options);
  }

  /* 1. Fetch AMC Types: GET /goa/srt/installation/amc/fetch-amc-type */
  async fetchAmcTypes(): Promise<string[]> {
    try {
      const res = await this.fetchWithFallback(GOA_API.AMC.SRT.FETCH_AMC_TYPE, {
        method: 'GET',
        headers: this.getHeaders(),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      const rawList = json.data || [];
      return rawList.map((item: any) => (typeof item === 'string' ? item : item.amc)).filter(Boolean);
    } catch (err) {
      console.warn('GoaSrtAmcService.fetchAmcTypes error:', err);
      return [];
    }
  }

  /* 2. Fetch AMC Sites: GET /goa/srt/installation/amc/fetch-site-name?amc={amc} */
  async fetchAmcSites(amc: string): Promise<GoaAmcSiteRecord[]> {
    try {
      const res = await this.fetchWithFallback(GOA_API.AMC.SRT.FETCH_SITE_NAME(amc), {
        method: 'GET',
        headers: this.getHeaders(),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      return json.srtsite || json.data || [];
    } catch (err) {
      console.warn('GoaSrtAmcService.fetchAmcSites error:', err);
      return [];
    }
  }

  /* 3. Fetch Site Details: GET /goa/srt/installation/amc/fetch-site-details?site_id={site_id} */
  async fetchSiteDetails(siteId: number | string): Promise<GoaAmcSiteDetail | null> {
    try {
      const res = await this.fetchWithFallback(GOA_API.AMC.SRT.FETCH_SITE_DETAILS(siteId), {
        method: 'GET',
        headers: this.getHeaders(),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      return json.srtamc || json.data || null;
    } catch (err) {
      console.warn('GoaSrtAmcService.fetchSiteDetails error:', err);
      return null;
    }
  }

  /* 4. Update AMC Site: POST /goa/srt/installation/amc/update-site (multipart/form-data) */
  async updateAmcSite(formData: FormData): Promise<{ success: boolean; message: string; data?: any; errors?: any }> {
    try {
      const res = await this.fetchWithFallback(GOA_API.AMC.SRT.UPDATE_SITE, {
        method: 'POST',
        headers: this.getHeaders(true),
        body: formData,
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        return {
          success: false,
          message: json?.message || 'Failed to update AMC site.',
          errors: json?.errors,
        };
      }
      return {
        success: json?.success ?? json?.status ?? true,
        message: json?.message || 'Update SRT AMC Successfully',
        data: json?.data,
      };
    } catch (err: any) {
      console.error('GoaSrtAmcService.updateAmcSite error:', err);
      return {
        success: false,
        message: err.message || 'Network error occurred.',
      };
    }
  }

  /* 5. View AMC Data: GET /goa/srt/installation/amc/view-data */
  async viewAmcData(): Promise<GoaAmcViewData> {
    try {
      const res = await this.fetchWithFallback(GOA_API.AMC.SRT.VIEW_DATA, {
        method: 'GET',
        headers: this.getHeaders(),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      const data = json.data || {};
      return {
        srt: Array.isArray(data.srt) ? data.srt : [],
        coms: Array.isArray(data.coms) ? data.coms : [],
      };
    } catch (err) {
      console.warn('GoaSrtAmcService.viewAmcData error:', err);
      return { srt: [], coms: [] };
    }
  }

  /* 6. View Completed AMC: GET /goa/srt/installation/amc/view-amc?amc_id={amc_id} */
  async viewCompletedAmc(amcId: number | string): Promise<GoaAmcSiteRecord | null> {
    try {
      const res = await this.fetchWithFallback(GOA_API.AMC.SRT.VIEW_AMC(amcId), {
        method: 'GET',
        headers: this.getHeaders(),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      return json.data || null;
    } catch (err) {
      console.warn('GoaSrtAmcService.viewCompletedAmc error:', err);
      return null;
    }
  }

  /* 7. View AMC For Update: GET /goa/srt/installation/amc/view-amc-update?amc_id={amc_id} */
  async viewAmcForUpdate(amcId: number | string): Promise<GoaAmcSiteRecord | null> {
    try {
      const res = await this.fetchWithFallback(GOA_API.AMC.SRT.VIEW_AMC_UPDATE(amcId), {
        method: 'GET',
        headers: this.getHeaders(),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      return json.data || null;
    } catch (err) {
      console.warn('GoaSrtAmcService.viewAmcForUpdate error:', err);
      return null;
    }
  }

  /* 8. View AMC Complaints: GET /goa/srt/installation/amc/view-amc-complaint */
  async viewAmcComplaints(): Promise<GoaAmcComplaintRecord[]> {
    try {
      const res = await this.fetchWithFallback(GOA_API.AMC.SRT.VIEW_AMC_COMPLAINT, {
        method: 'GET',
        headers: this.getHeaders(),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      return Array.isArray(json.data) ? json.data : [];
    } catch (err) {
      console.warn('GoaSrtAmcService.viewAmcComplaints error:', err);
      return [];
    }
  }
}

export const goaSrtAmcService = new GoaSrtAmcService();
export default goaSrtAmcService;
