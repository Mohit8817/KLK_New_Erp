import { API_BASE_URL, authService } from '../../../../services/authService';
import { UP_SURVEY_API } from '../../V_Portal_APIS/UP_Survey_API';

/* ── Base URLs for Media Resolution ── */
const BACKEND_BASE = (API_BASE_URL || 'https://klkerp.com/api')
  .replace(/\/api\/?$/, '')
  .replace(/\/+$/, '');

const R2_BASE = ((import.meta.env.VITE_R2_PUBLIC_URL as string | undefined) ?? '').replace(/\/+$/, '');

export function getUpSurveyMediaUrl(path?: string | null): string {
  if (!path || typeof path !== 'string') return '';
  const clean = path.trim();
  if (!clean) return '';

  if (/^(https?:)?\/\//i.test(clean) || clean.startsWith('data:') || clean.startsWith('blob:')) {
    return clean;
  }

  if (clean.startsWith('r2:')) {
    const key = clean.slice(3).replace(/^\/+/, '');
    if (R2_BASE) return `${R2_BASE}/${key}`;
    return `${BACKEND_BASE}/uploads/${key}`;
  }

  const normalized = clean.replace(/^\/+/, '');
  if (normalized.startsWith('uploads/') || normalized.startsWith('storage/')) {
    return `${BACKEND_BASE}/${normalized}`;
  }

  return `${BACKEND_BASE}/uploads/${normalized}`;
}

export function getAuthToken(): string | null {
  return (
    authService.getToken() ||
    localStorage.getItem('token') ||
    localStorage.getItem('auth_token') ||
    sessionStorage.getItem('token') ||
    null
  );
}

const makeHeaders = (isMultipart = false): HeadersInit => {
  const token = getAuthToken();
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
};

/* ── Generic API Request Helper ── */
async function apiRequest<T = any>(
  url: string,
  options: {
    method?: string;
    body?: any;
    isMultipart?: boolean;
  } = {}
): Promise<{ status: boolean; message?: string; data?: T; [key: string]: any }> {
  const method = options.method || 'GET';
  const headers = makeHeaders(options.isMultipart);

  const init: RequestInit = {
    method,
    headers,
  };

  if (options.body) {
    if (options.isMultipart || typeof options.body === 'string') {
      init.body = options.body;
    } else {
      init.body = JSON.stringify(options.body);
    }
  }

  try {
    const res = await fetch(url, init);
    const contentType = res.headers.get('content-type') || '';
    let json: any = null;

    if (contentType.includes('application/json')) {
      json = await res.json();
    } else {
      const text = await res.text();
      try {
        json = JSON.parse(text);
      } catch {
        json = { status: res.ok, message: text };
      }
    }

    if (!res.ok) {
      return {
        status: false,
        message: json?.message || json?.error || `Request failed with HTTP ${res.status}`,
        errors: json?.errors,
        ...json,
      };
    }

    // Backend controller sometimes returns HTTP 200 with { status: false, message: ... }
    if (json && typeof json === 'object') {
      if (json.status === false) {
        return {
          status: false,
          message: json.message || json.error || 'Operation failed',
          errors: json.errors,
          ...json,
        };
      }
      return { status: true, ...json };
    }

    return { status: true, data: json };
  } catch (err: any) {
    console.error(`UP Survey API Error [${method} ${url}]:`, err);
    return {
      status: false,
      message: err?.message || 'Network request failed. Please check connection.',
    };
  }
}

/* ─────────────────────────────────────────────────────────────
   Types: UP Resco Survey
   ───────────────────────────────────────────────────────────── */
export interface UpRescoPendingSite {
  id: number;
  uid: string;
  state: string;
  district: string;
  dept_name?: string;
  site_name: string;
  address?: string;
  ca_no?: string;
  division?: string;
  sub_division?: string;
  [key: string]: any;
}

export interface UpRescoSiteDetail {
  id: number;
  uid: string;
  state: string;
  project?: string;
  district: string;
  site_name: string;
  address?: string;
  survey_status?: number;
  dept_name?: string;
  division?: string;
  sub_division?: string;
  ca_no?: string;
  location?: string;
  [key: string]: any;
}

export interface UpRescoSurveyRecord {
  id: number;
  uid?: string;
  state?: string;
  district?: string;
  division?: string;
  sub_division?: string;
  dept_name?: string;
  site_name?: string;
  site_address?: string;
  ca_no?: string;
  survey_address?: string;
  near_landmark?: string;
  agency_person_name?: string;
  agency_person_contact?: string;
  nodal_person?: string;
  contact_nodal?: string;
  latitude?: string | number;
  longitude?: string | number;
  load_type?: string;
  connection_phase?: string;
  meter_connection?: string;
  meter_number?: string;
  meter_type?: string;
  sanction_load?: string | number;
  connected_load?: string | number;
  grid_power?: string;
  all_3_phase_ltdb?: string;
  missing_phase?: string;
  ltdb_present?: string;
  roof_condition?: string;
  area_roof?: string | number;
  free_space_solar?: string | number;
  free_space_inverter?: string | number;
  earth_pit?: string;
  site_feasible?: string;
  survey_remarks?: string;
  age_of_building?: string | number;
  building_age?: string | number;
  roof_access?: string;
  rooftop_height?: string | number;
  parapet_height?: string | number;
  floors_number?: string | number;
  water_source?: string;
  site_access?: string;
  site_distance?: string | number;
  building_image?: string;
  image1?: string;
  roof_image?: string;
  image2?: string;
  control_room_image?: string;
  image3?: string;
  image4?: string;
  image5?: string;
  pdf_file?: string;
  pdf?: string;
  bos_status?: number;
  bos_file?: string;
  bos_remarks?: string;
  survey_status?: number;
  survey_date?: string;
  created_by?: string | number;
  updated_by?: string | number;
  [key: string]: any;
}

export interface UpRescoSurveyCounts {
  total: number;
  complete: number;
  pending: number;
}

export interface UpRescoAssignedBatch {
  id: number;
  state: string;
  type: string;
  purpose: string;
  site_name?: string;
  site_names?: string[];
  vendor_name?: string;
  assign_date?: string;
  district?: string;
  file?: string;
  remarks?: string;
  status?: number;
  [key: string]: any;
}

export interface UpRescoBosMaterialItem {
  id?: number;
  product_id: number;
  qty: string | number;
  unit: string;
  product_remarks?: string;
  product_name?: string;
}

export interface UpRescoBosProductData {
  resco: {
    id: number;
    site_name: string;
    bos_status: number;
    [key: string]: any;
  };
  products: Array<{
    id: number;
    name: string;
    [key: string]: any;
  }>;
  resco_bos: {
    id?: number;
    site_id: number;
    req_date?: string;
    vendor_name?: string;
    site_name?: string;
    remarks?: string;
    materials?: UpRescoBosMaterialItem[];
    [key: string]: any;
  } | null;
}

/* ─────────────────────────────────────────────────────────────
   Types: UP SRT Survey
   ───────────────────────────────────────────────────────────── */
export interface UpSrtSurveyRecord {
  id: number | string;
  survey_date?: string;
  district?: string;
  block?: string;
  panchayat?: string;
  village?: string;
  ward_no?: string;
  address?: string;
  beneficiary?: string;
  phone?: string;
  email?: string;
  aadhaar_no?: string;
  pan_no?: string;
  ca_no?: string;
  sanctioned_load?: string;
  load_demand?: string;
  consumption?: string;
  quotation?: string;
  area_sqft?: string;
  bank?: string;
  account_holder?: string;
  account_no?: string;
  ifsc?: string;
  latitude?: string;
  longitude?: string;
  aadhaar_photo?: string;
  pan_photo?: string;
  electricity_bill?: string;
  bank_passbook?: string;
  rooftop_photo?: string;
  remark?: string;
  verification?: string;
  verify_by?: string;
  [key: string]: any;
}

/* ─────────────────────────────────────────────────────────────
   Types: UP SSL Survey
   ───────────────────────────────────────────────────────────── */
export interface UpSslSiteRecord {
  id: number | string;
  uid?: string;
  state?: string;
  district?: string;
  block?: string;
  village?: string;
  contact_no?: string;
  beneficiary_name?: string;
  survey_status?: number | string;
  financial_year?: string;
  scheme?: string;
  vendor?: string;
  material_supply?: string;
  supply_date?: string;
  install?: string;
  installed_date?: string;
  payment_85?: string;
  amc_1?: string;
  amc_2?: string;
  amc_3?: string;
  amc_4?: string;
  amc_5?: string;
  document_submitted?: string;
  mode?: string;
  remarks?: string;
  demo1_image?: string;
  demo2_image?: string;
  uploaded_images?: string[];
  [key: string]: any;
}

/* ─────────────────────────────────────────────────────────────
   Service Implementation
   ───────────────────────────────────────────────────────────── */
export const upSurveyService = {
  /* ============================================================
     UP Resco Survey (11 Controller Methods)
     ============================================================ */

  // 1. List pending survey sites
  async getRescoPendingSites(): Promise<UpRescoPendingSite[]> {
    const res = await apiRequest(UP_SURVEY_API.RESCO.PENDING_SITES);
    if (res.status) {
      if (Array.isArray(res.sites)) return res.sites;
      if (Array.isArray(res.data)) return res.data;
    }
    return [];
  },

  // 2. Fetch site detail
  async getRescoSiteDetail(srtId: number | string): Promise<UpRescoSiteDetail | null> {
    const res = await apiRequest(UP_SURVEY_API.RESCO.SITE_DETAIL(srtId));
    if (res.status) {
      if (res.srt) return res.srt;
      if (res.data) return res.data;
    }
    return null;
  },

  // 3. Store survey (POST multipart/form-data)
  async storeRescoSurvey(
    formData: FormData
  ): Promise<{ status: boolean; message: string; errors?: Record<string, string[]> }> {
    const res = await apiRequest(UP_SURVEY_API.RESCO.STORE_SURVEY, {
      method: 'POST',
      body: formData,
      isMultipart: true,
    });
    return {
      status: !!res.status,
      message: res.message || (res.status ? 'Survey Complete Successfully!!!' : 'Failed to save survey.'),
      errors: res.errors,
    };
  },

  // 4. View completed surveys and counts
  async getViewRescoSurveys(): Promise<{
    resco: UpRescoSurveyRecord[];
    survey_detail: UpRescoSurveyCounts;
  }> {
    const res = await apiRequest(UP_SURVEY_API.RESCO.VIEW_SURVEY);
    const fallback = {
      resco: [],
      survey_detail: { total: 0, complete: 0, pending: 0 },
    };
    if (res.status) {
      const list = Array.isArray(res.resco) ? res.resco : Array.isArray(res.data) ? res.data : [];
      const counts = res.survey_detail || {
        total: list.length,
        complete: list.filter((x: any) => x.survey_status === 1 || x.survey_status === '1').length,
        pending: list.filter((x: any) => x.survey_status === 0 || x.survey_status === '0').length,
      };
      return {
        resco: list,
        survey_detail: {
          total: Number(counts.total ?? list.length),
          complete: Number(counts.complete ?? 0),
          pending: Number(counts.pending ?? 0),
        },
      };
    }
    return fallback;
  },

  // 5. Fetch survey for edit
  async getRescoSurveyForEdit(id: number | string): Promise<UpRescoSurveyRecord | null> {
    const res = await apiRequest(UP_SURVEY_API.RESCO.GET_SURVEY_FOR_EDIT(id));
    if (res.status) {
      if (res.resco) return res.resco;
      if (res.data) return res.data;
    }
    return null;
  },

  // 6. Update survey store (POST multipart/form-data)
  async updateRescoSurveyStore(
    id: number | string,
    formData: FormData
  ): Promise<{ status: boolean; message: string; errors?: Record<string, string[]> }> {
    const res = await apiRequest(UP_SURVEY_API.RESCO.UPDATE_SURVEY_STORE(id), {
      method: 'POST',
      body: formData,
      isMultipart: true,
    });
    return {
      status: !!res.status,
      message: res.message || (res.status ? 'Survey Updated Successfully!!!' : 'Failed to update survey.'),
      errors: res.errors,
    };
  },

  // 7. View assigned surveys
  async getViewAssignedRescoSurveys(): Promise<UpRescoAssignedBatch[]> {
    const res = await apiRequest(UP_SURVEY_API.RESCO.ASSIGNED_SURVEYS);
    if (res.status) {
      if (Array.isArray(res.survey)) return res.survey;
      if (Array.isArray(res.data)) return res.data;
    }
    return [];
  },

  // 8. BOS file submit (POST multipart/form-data)
  async submitRescoBos(
    formData: FormData
  ): Promise<{ status: boolean; message: string; errors?: Record<string, string[]> }> {
    const res = await apiRequest(UP_SURVEY_API.RESCO.BOS_SUBMIT, {
      method: 'POST',
      body: formData,
      isMultipart: true,
    });
    return {
      status: !!res.status,
      message: res.message || (res.status ? 'BOS Submit Successfully!!!' : 'Failed to submit BOS file.'),
      errors: res.errors,
    };
  },

  // 9. Fetch BOS products for a site
  async fetchRescoBosProducts(siteId: number | string): Promise<UpRescoBosProductData | null> {
    const res = await apiRequest(UP_SURVEY_API.RESCO.BOS_PRODUCT_FETCH, {
      method: 'POST',
      body: { id: siteId },
    });
    if (res.status && res.data) {
      return res.data as UpRescoBosProductData;
    }
    return null;
  },

  // 10. Save BOS products
  async storeRescoBosProducts(
    payload: {
      site_id: number | string;
      required_date: string;
      vendor_name: string;
      site_name: string;
      remarks?: string;
      products: number[];
      quantities: (number | string)[];
      units: string[];
      product_remarks?: string[];
    }
  ): Promise<{ status: boolean; message: string; errors?: Record<string, string[]> }> {
    // Controller accepts standard array format
    const res = await apiRequest(UP_SURVEY_API.RESCO.BOS_PRODUCT_STORE, {
      method: 'POST',
      body: payload,
    });
    return {
      status: !!res.status,
      message:
        res.message ||
        res.error ||
        (res.status ? 'BOS Product Created Successfully!' : 'Failed to save BOS products.'),
      errors: res.errors,
    };
  },

  // 11. Download BOS PDF
  async downloadRescoBosPdf(siteId: number | string, siteName = 'Site'): Promise<{ status: boolean; message?: string }> {
    const token = getAuthToken();
    try {
      const res = await fetch(UP_SURVEY_API.RESCO.BOS_PRODUCT_PDF, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/pdf, application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ id: siteId }),
      });

      if (!res.ok) {
        const text = await res.text();
        try {
          const json = JSON.parse(text);
          return { status: false, message: json?.error || json?.message || 'Failed to download PDF.' };
        } catch {
          return { status: false, message: `Download failed with HTTP ${res.status}` };
        }
      }

      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const json = await res.json();
        return { status: false, message: json?.error || json?.message || 'BOS PDF not available.' };
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const safeName = siteName.replace(/[^a-zA-Z0-9_-]/g, '_');
      a.download = `${safeName}_BOS.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      return { status: true, message: 'PDF downloaded successfully!' };
    } catch (err: any) {
      console.error('Error downloading BOS PDF:', err);
      return { status: false, message: err?.message || 'Error downloading BOS PDF.' };
    }
  },

  /* ============================================================
     UP SRT Survey
     ============================================================ */

  async getSrtDistricts(): Promise<string[]> {
    const res = await apiRequest(UP_SURVEY_API.SRT.DISTRICTS);
    if (res.status && Array.isArray(res.data)) {
      return res.data;
    }
    return [
      'Agra', 'Aligarh', 'Ayodhya', 'Bareilly', 'Gorakhpur', 'Jhansi', 'Kanpur',
      'Lucknow', 'Meerut', 'Moradabad', 'Prayagraj', 'Varanasi',
    ];
  },

  async getSrtBlocks(district: string): Promise<string[]> {
    const res = await apiRequest(UP_SURVEY_API.SRT.BLOCKS(district));
    if (res.status && Array.isArray(res.data)) {
      return res.data;
    }
    return ['Block 1', 'Block 2', 'Block 3', 'Belghat', 'Doraha', 'Civil Lines'];
  },

  async getSrtPanchayats(district: string, block: string): Promise<string[]> {
    const res = await apiRequest(UP_SURVEY_API.SRT.PANCHAYATS(district, block));
    if (res.status && Array.isArray(res.data)) {
      return res.data;
    }
    return ['Avraroop', 'Panchayat A', 'Panchayat B', 'Panchayat C'];
  },

  async getSrtVillages(district: string, block: string, panchayat: string): Promise<string[]> {
    const res = await apiRequest(UP_SURVEY_API.SRT.VILLAGES(district, block, panchayat));
    if (res.status && Array.isArray(res.data)) {
      return res.data;
    }
    return ['Village 1', 'Village 2', 'Village 3'];
  },

  async storeSrtSurvey(
    formData: FormData
  ): Promise<{ status: boolean; message: string; errors?: Record<string, string[]> }> {
    const res = await apiRequest(UP_SURVEY_API.SRT.STORE_SURVEY, {
      method: 'POST',
      body: formData,
      isMultipart: true,
    });
    return {
      status: !!res.status,
      message: res.message || (res.status ? 'SRT Survey saved successfully!' : 'Failed to save SRT survey.'),
      errors: res.errors,
    };
  },

  async getViewSrtSurveys(): Promise<UpSrtSurveyRecord[]> {
    const res = await apiRequest(UP_SURVEY_API.SRT.VIEW_SURVEYS);
    if (res.status) {
      if (Array.isArray(res.data)) return res.data;
      if (Array.isArray(res.surveys)) return res.surveys;
    }
    return [];
  },

  /* ============================================================
     UP SSL Survey
     ============================================================ */

  async getSslUids(): Promise<Array<{ id: number | string; uid: string; site_name?: string }>> {
    const res = await apiRequest(UP_SURVEY_API.SSL.FETCH_UIDS);
    if (res.status) {
      if (Array.isArray(res.data)) return res.data;
      if (Array.isArray(res.uids)) return res.uids;
    }
    return [];
  },

  async getSslSiteDetail(uid: string | number): Promise<UpSslSiteRecord | null> {
    const res = await apiRequest(UP_SURVEY_API.SSL.FETCH_SITE_DETAIL(uid));
    if (res.status) {
      if (res.site) return res.site;
      if (res.data) return res.data;
    }
    return null;
  },

  async updateSslSurvey(
    formData: FormData
  ): Promise<{ status: boolean; message: string; errors?: Record<string, string[]> }> {
    const res = await apiRequest(UP_SURVEY_API.SSL.UPDATE_STATUS, {
      method: 'POST',
      body: formData,
      isMultipart: true,
    });
    return {
      status: !!res.status,
      message: res.message || (res.status ? 'SSL Survey status updated successfully!' : 'Failed to update SSL status.'),
      errors: res.errors,
    };
  },

  async getViewSslSites(): Promise<UpSslSiteRecord[]> {
    const res = await apiRequest(UP_SURVEY_API.SSL.VIEW_DATA);
    if (res.status) {
      if (Array.isArray(res.data)) return res.data;
      if (Array.isArray(res.sites)) return res.sites;
    }
    return [];
  },
};

export default upSurveyService;
