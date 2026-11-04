import { authService, API_BASE_URL } from '../../../../services/authService';
import { BIHAR_AMC_API } from '../../V_Portal_APIS/Bihar_API';

const BASE_URL = (API_BASE_URL || 'https://klkerp.com/api').replace(/\/+$/, '');
const ROOT_URL = BASE_URL.replace(/\/api\/?$/, '');

export function getAmcMediaUrl(path?: string | null): string {
  if (!path) return '';
  if (/^https?:\/\//i.test(path)) return path;
  const clean = path.replace(/^\/+/, '');
  return `${ROOT_URL}/${clean}`;
}

/* ──────────────────────────────────────────────────────────
 * 1. BIHAR SRT AMC TYPES
 * ────────────────────────────────────────────────────────── */

export interface BiharSrtAmcSiteOption {
  id: number;
  site_id: number;
  amc: string;
  amc_status: number;
}

export interface BiharSrtSiteDetail {
  id: number;
  discom?: string;
  state?: string;
  district?: string;
  dept_name?: string;
  site_name?: string;
  location?: string;
  firm_name?: string;
  ca_no?: string;
  sanction_load?: string | number;
  plant_sc?: string;
  wo_no?: string;
  phase?: string;
  vendor?: string;
  date?: string;
  material_i_date?: string;
  material_bill_invoice?: string;
  mb_invoice?: string;
  installation_status?: string;
  contact_person?: string;
  contact_number?: string;
  metering_status?: string;
  [key: string]: any;
}

export interface BiharSrtAmcItem {
  id: number;
  amc?: string;
  site_id?: number;
  amc_status: number; // 0 = pending/incomplete, 1 = completed
  amcverify_status?: number; // 0 = pending, 1 = approved, 2 = rejected
  amc_assigned_time?: string;
  amc_date?: string;
  amc_beneficiary_name?: string;
  amc_beneficiary_contact?: string;
  amc_latitude?: string | number;
  amc_longitude?: string | number;
  amc_remark?: string;
  amc_image1?: string;
  amc_image2?: string;
  amc_image3?: string;
  amc_image4?: string;
  amc_image5?: string;
  amc_image6?: string;
  amc_image7?: string;
  amc_image8?: string;
  amc_image9?: string;
  amc_image10?: string;
  srtdata?: BiharSrtSiteDetail;
  [key: string]: any;
}

export interface BiharSrtAmcComplaintItem {
  id: number;
  complaint_id: string;
  site_name?: string;
  complaint: string;
  start_date?: string;
  complaint_date?: string;
  state?: string;
  discom?: string;
  district?: string;
  dept_name?: string;
  location?: string;
  firm_name?: string;
  ca_no?: string;
  sanction_load?: string | number;
  plant_sc?: string;
  wo_no?: string;
  phase?: string;
  [key: string]: any;
}

/* ──────────────────────────────────────────────────────────
 * 2. BIHAR SSL AMC TYPES
 * ────────────────────────────────────────────────────────── */

export interface BiharSslUidItem {
  id: number;
  unique_id: string;
}

export interface BiharSslDetail {
  id: number;
  unique_id: string;
  state?: string;
  phase?: string;
  wo_no?: string;
  wo_recieved?: string;
  district?: string;
  block?: string;
  panchyat?: string;
  panchayat?: string;
  ward_no?: string | number;
  pole_no?: string;
  beneficiary_name?: string;
  contact_no?: string;
  latitude?: string | number;
  longitude?: string | number;
  luminary_no?: string;
  sim_no?: string;
  battery_serial_no?: string;
  module_no?: string;
  supply?: string;
  material_inspection?: string;
  installation?: string;
  date_of_installation?: string;
  installed_by?: string;
  images?: Array<{
    image1?: string;
    image2?: string;
    latitude?: string;
    longitude?: string;
    [key: string]: any;
  }>;
  [key: string]: any;
}

export interface BiharSslAmcItem {
  id: number;
  unique_id: string;
  state?: string;
  phase?: string;
  district?: string;
  block?: string;
  panchyat?: string;
  panchayat?: string;
  ward_no?: string | number;
  pole_no?: string;
  beneficiary_name?: string;
  contact_no?: string;
  location?: string;
  luminary_no?: string;
  sim_no?: string;
  battery_serial_no?: string;
  module_no?: string;
  latitude?: string | number;
  longitude?: string | number;
  amc_remarks?: string;
  amc_image1?: string;
  amc_image2?: string;
  amc_v_status?: number; // 0 = incomplete, 1 = complete
  amc_verify?: number; // 1 = approved
  amc_v_date?: string;
  [key: string]: any;
}

export interface BiharSslAmcSummaryData {
  total: number;
  incomplete: number;
  complete: number;
  approved: number;
  ssls: BiharSslAmcItem[];
  coms: BiharSslAmcItem[];
}

export interface BiharSslAmcComplaintItem {
  id: number;
  complaint_id: string;
  district?: string;
  pole_no?: string;
  start_date?: string;
  state?: string;
  block?: string;
  panchyat?: string;
  panchayat?: string;
  phase?: string;
  ward_no?: string | number;
  beneficiary_name?: string;
  contact_no?: string;
  latitude?: string | number;
  longitude?: string | number;
  along_with_pole?: string;
  luminary_no?: string;
  sim_no?: string;
  battery_serial_no?: string;
  module_no?: string;
  date_of_installation?: string;
  complaint?: string;
  file?: string | null;
  [key: string]: any;
}

/* ──────────────────────────────────────────────────────────
 * 3. SERVICE CLASS
 * ────────────────────────────────────────────────────────── */

class BiharAmcService {
  private getHeaders(isMultipart = false): HeadersInit {
    const token = authService.getToken();
    const headers: Record<string, string> = {
      Accept: 'application/json',
    };
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    if (!isMultipart) {
      headers['Content-Type'] = 'application/json';
    }
    return headers;
  }

  private async fetchWithFallback(url: string, options: RequestInit): Promise<Response> {
    const res = await fetch(url, options);
    return res;
  }

  /* ══════════════════════════════════════════════════════════
   * PART 1: BIHAR SRT AMC
   * ══════════════════════════════════════════════════════════ */

  // 1. Pending AMC Name List: GET /bihar/srt/amc/add-data
  async getSrtAmcList(): Promise<{ amc: string }[]> {
    const res = await this.fetchWithFallback(BIHAR_AMC_API.SRT.ADD_DATA, {
      method: 'GET',
      headers: this.getHeaders(),
    });
    if (!res.ok) {
      throw new Error(`Failed to fetch AMC list: ${res.statusText}`);
    }
    const json = await res.json();
    return Array.isArray(json.data) ? json.data : Array.isArray(json) ? json : [];
  }

  // 2. Fetch Sites of an AMC: GET /bihar/srt/amc/fetch-site-name?amc=AMC-1
  async getSrtSitesByAmc(amc: string): Promise<BiharSrtAmcSiteOption[]> {
    const res = await this.fetchWithFallback(BIHAR_AMC_API.SRT.FETCH_SITE_NAME(amc), {
      method: 'GET',
      headers: this.getHeaders(),
    });
    if (!res.ok) {
      if (res.status === 404) return [];
      throw new Error(`Failed to fetch sites for AMC: ${res.statusText}`);
    }
    const json = await res.json();
    return json.srtsite || json.data || (Array.isArray(json) ? json : []);
  }

  // 3. Fetch Site Details: GET /bihar/srt/amc/fetch-site-details?id=25
  async getSrtSiteDetails(id: number | string): Promise<BiharSrtSiteDetail> {
    const res = await this.fetchWithFallback(BIHAR_AMC_API.SRT.FETCH_SITE_DETAILS(id), {
      method: 'GET',
      headers: this.getHeaders(),
    });
    const json = await res.json();
    if (!res.ok || json.status === false) {
      throw new Error(json.message || 'Site details not found.');
    }
    return json.data ?? json;
  }

  // 4. Update AMC (optionally raise complaint): POST /bihar/srt/amc/update-site
  async updateSrtSite(formData: FormData): Promise<{ status: boolean; message: string }> {
    const res = await this.fetchWithFallback(BIHAR_AMC_API.SRT.UPDATE_SITE, {
      method: 'POST',
      headers: this.getHeaders(true),
      body: formData,
    });
    const json = await res.json();
    if (!res.ok || json.status === false) {
      let msg = json.message || 'Validation failed.';
      if (json.errors && typeof json.errors === 'object') {
        const errorList: string[] = [];
        for (const [k, v] of Object.entries(json.errors)) {
          errorList.push(`${k}: ${Array.isArray(v) ? v.join(', ') : v}`);
        }
        if (errorList.length) msg = `${msg} (${errorList.join('; ')})`;
      }
      const err: any = new Error(msg);
      err.errors = json.errors;
      throw err;
    }
    return json;
  }

  // 5. View AMC Data: GET /bihar/srt/amc/view-data
  async getViewSrtAmcData(): Promise<{ srt: BiharSrtAmcItem[]; coms: BiharSrtAmcItem[] }> {
    const res = await this.fetchWithFallback(BIHAR_AMC_API.SRT.VIEW_DATA, {
      method: 'GET',
      headers: this.getHeaders(),
    });
    if (!res.ok) {
      throw new Error(`Failed to fetch SRT AMC data: ${res.statusText}`);
    }
    const json = await res.json();
    const data = json.data ?? json;
    return {
      srt: Array.isArray(data?.srt) ? data.srt : [],
      coms: Array.isArray(data?.coms) ? data.coms : [],
    };
  }

  // 6. View Completed AMC: GET /bihar/srt/amc/view-amc-data/{id}
  async getViewSrtAmcDetail(id: number | string): Promise<any> {
    const res = await this.fetchWithFallback(BIHAR_AMC_API.SRT.VIEW_AMC_DATA(id), {
      method: 'GET',
      headers: this.getHeaders(),
    });
    const json = await res.json();
    if (!res.ok || json.status === false) {
      throw new Error(json.message || 'SRT AMC record not found.');
    }
    return json.data ?? json;
  }

  // 7. Get Pending AMC (for update): GET /bihar/srt/amc/view-srt-amc-update/{id}
  async getViewSrtAmcUpdate(id: number | string): Promise<any> {
    const res = await this.fetchWithFallback(BIHAR_AMC_API.SRT.VIEW_SRT_AMC_UPDATE(id), {
      method: 'GET',
      headers: this.getHeaders(),
    });
    const json = await res.json();
    if (!res.ok || json.status === false) {
      throw new Error(json.message || 'SRT AMC not found or already updated.');
    }
    return json.data ?? json;
  }

  // 8. Complaint List: GET /bihar/srt/amc/view-srt-amc-complaint
  async getSrtAmcComplaints(): Promise<BiharSrtAmcComplaintItem[]> {
    const res = await this.fetchWithFallback(BIHAR_AMC_API.SRT.VIEW_COMPLAINT, {
      method: 'GET',
      headers: this.getHeaders(),
    });
    if (!res.ok) {
      throw new Error(`Failed to fetch SRT complaints: ${res.statusText}`);
    }
    const json = await res.json();
    return Array.isArray(json.data) ? json.data : Array.isArray(json) ? json : [];
  }

  /* ══════════════════════════════════════════════════════════
   * PART 2: BIHAR SSL AMC
   * ══════════════════════════════════════════════════════════ */

  // 1. View Data: GET /bihar/ssl/amc/view-data
  async getViewSslAmcData(): Promise<BiharSslAmcSummaryData> {
    const res = await this.fetchWithFallback(BIHAR_AMC_API.SSL.VIEW_DATA, {
      method: 'GET',
      headers: this.getHeaders(),
    });
    if (!res.ok) {
      throw new Error(`Failed to fetch SSL AMC data: ${res.statusText}`);
    }
    const json = await res.json();
    const d = json.data ?? json;
    return {
      total: Number(d?.total ?? 0),
      incomplete: Number(d?.incomplete ?? 0),
      complete: Number(d?.complete ?? 0),
      approved: Number(d?.approved ?? 0),
      ssls: Array.isArray(d?.ssls) ? d.ssls : [],
      coms: Array.isArray(d?.coms) ? d.coms : [],
    };
  }

  // 2. Fetch Unique IDs: GET /bihar/ssl/amc/fetch-uids
  async getSslUids(): Promise<BiharSslUidItem[]> {
    const res = await this.fetchWithFallback(BIHAR_AMC_API.SSL.FETCH_UIDS, {
      method: 'GET',
      headers: this.getHeaders(),
    });
    if (!res.ok) {
      throw new Error(`Failed to fetch SSL UIDs: ${res.statusText}`);
    }
    const json = await res.json();
    return json.data?.uids || json.uids || (Array.isArray(json.data) ? json.data : []);
  }

  // 3. Fetch Details: GET /bihar/ssl/amc/fetch-details/{unique_id}
  async getSslDetailsByUid(uniqueId: string | number): Promise<BiharSslDetail> {
    const res = await this.fetchWithFallback(BIHAR_AMC_API.SSL.FETCH_DETAILS(uniqueId), {
      method: 'GET',
      headers: this.getHeaders(),
    });
    const json = await res.json();
    if (!res.ok || json.status === false) {
      throw new Error(json.message || 'Bihar SSL details not found.');
    }
    return json.data ?? json;
  }

  // 4. Complaint List: GET /bihar/ssl/view-complaint
  async getSslComplaints(): Promise<BiharSslAmcComplaintItem[]> {
    const res = await this.fetchWithFallback(BIHAR_AMC_API.SSL.VIEW_COMPLAINT, {
      method: 'GET',
      headers: this.getHeaders(),
    });
    if (!res.ok) {
      throw new Error(`Failed to fetch SSL complaints: ${res.statusText}`);
    }
    const json = await res.json();
    return Array.isArray(json.data) ? json.data : Array.isArray(json) ? json : [];
  }

  // 5. Update AMC (optionally raise complaint): POST /bihar/ssl/update
  async updateSslAmc(formData: FormData): Promise<{ status: boolean; message: string }> {
    const res = await this.fetchWithFallback(BIHAR_AMC_API.SSL.UPDATE, {
      method: 'POST',
      headers: this.getHeaders(true),
      body: formData,
    });
    const json = await res.json();
    if (!res.ok || json.status === false) {
      let msg = json.message || 'Validation failed.';
      if (json.errors && typeof json.errors === 'object') {
        const errorList: string[] = [];
        for (const [k, v] of Object.entries(json.errors)) {
          errorList.push(`${k}: ${Array.isArray(v) ? v.join(', ') : v}`);
        }
        if (errorList.length) msg = `${msg} (${errorList.join('; ')})`;
      }
      const err: any = new Error(msg);
      err.errors = json.errors;
      throw err;
    }
    return json;
  }

  // 6. View Completed AMC: GET /bihar/ssl/view-amc/{id}?id={id}
  async getViewSslAmcDetail(id: number | string): Promise<any> {
    const res = await this.fetchWithFallback(BIHAR_AMC_API.SSL.VIEW_AMC(id), {
      method: 'GET',
      headers: this.getHeaders(),
    });
    const json = await res.json();
    if (!res.ok || json.status === false) {
      throw new Error(json.message || 'Approved Bihar SSL AMC data not found.');
    }
    return json.data ?? json;
  }

  // 7. AMC Record by ID: GET /bihar/ssl/update-amc/{id}
  async getSslAmcRecord(id: number | string): Promise<any> {
    const res = await this.fetchWithFallback(BIHAR_AMC_API.SSL.UPDATE_AMC(id), {
      method: 'GET',
      headers: this.getHeaders(),
    });
    const json = await res.json();
    if (!res.ok || json.status === false) {
      throw new Error(json.message || 'Bihar SSL AMC record not found.');
    }
    return json.data ?? json;
  }
}

export const biharAmcService = new BiharAmcService();
export default biharAmcService;
