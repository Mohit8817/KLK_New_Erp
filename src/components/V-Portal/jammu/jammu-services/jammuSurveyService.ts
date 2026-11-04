import { JAMMU_API, ROOT_URL } from '../../V_Portal_APIS/Jammu_API';
import { getAuthHeaders } from './jammuSrt70mwService';

/* ═══════════════════════════════════════════════════════════════════════════
   Media URL Helpers for Jammu Survey Modules
   ═══════════════════════════════════════════════════════════════════════════ */

export function getJammuSurveyMediaCandidates(
  path?: string | null,
  category: 'resco_image' | 'resco_pdf' | 'resco_bos' | 'srt_image' | 'srt_pdf' = 'resco_image'
): string[] {
  if (!path) return [];
  const trimmed = String(path).trim();
  if (!trimmed || trimmed === '—' || trimmed === 'null' || trimmed === 'undefined') return [];
  if (/^(https?:|data:|blob:)/i.test(trimmed)) return [trimmed];

  const normalized = trimmed.replace(/^\/+/, '');
  const filename = normalized.split('/').pop() || normalized;
  const candidates: string[] = [];

  // Direct root relative path
  candidates.push(`${ROOT_URL}/${normalized}`);

  // Categorized standard folders according to documentation
  if (category === 'resco_image') {
    candidates.push(`${ROOT_URL}/uploads/jammu/survey/resco/images/${filename}`);
  } else if (category === 'resco_pdf') {
    candidates.push(`${ROOT_URL}/uploads/jammu/survey/resco/pdf/${filename}`);
  } else if (category === 'resco_bos') {
    candidates.push(`${ROOT_URL}/uploads/jammu/survey/resco/bos/${filename}`);
  } else if (category === 'srt_image') {
    candidates.push(`${ROOT_URL}/uploads/jammu/survey/srt/images/${filename}`);
  } else if (category === 'srt_pdf') {
    candidates.push(`${ROOT_URL}/uploads/jammu/survey/srt/pdf/${filename}`);
  }

  // Common fallbacks
  candidates.push(`${ROOT_URL}/uploads/jammu/survey/resco/images/${filename}`);
  candidates.push(`${ROOT_URL}/uploads/jammu/survey/srt/images/${filename}`);
  candidates.push(`${ROOT_URL}/uploads/jammu/survey/resco/pdf/${filename}`);
  candidates.push(`${ROOT_URL}/uploads/jammu/survey/srt/pdf/${filename}`);
  candidates.push(`${ROOT_URL}/uploads/jammu/survey/resco/bos/${filename}`);
  candidates.push(`${ROOT_URL}/uploads/${filename}`);

  const R2_BASE = ((import.meta.env.VITE_R2_PUBLIC_URL as string | undefined) ?? '').replace(/\/+$/, '');
  if (R2_BASE) {
    candidates.push(`${R2_BASE}/${normalized}`);
    candidates.push(`${R2_BASE}/${filename}`);
  }

  return Array.from(new Set(candidates));
}

export function resolveJammuSurveyMediaUrl(
  path?: string | null,
  category: 'resco_image' | 'resco_pdf' | 'resco_bos' | 'srt_image' | 'srt_pdf' = 'resco_image'
): string {
  if (!path) return '';
  if (/^(https?:|data:|blob:)/i.test(path)) return path;
  const list = getJammuSurveyMediaCandidates(path, category);
  return list[0] || `${ROOT_URL}/${String(path).replace(/^\/+/, '')}`;
}

/* ═══════════════════════════════════════════════════════════════════════════
   TypeScript Interfaces: Part 1 - JK RESCO Survey
   ═══════════════════════════════════════════════════════════════════════════ */

export interface JammuRescoPendingSurveySite {
  id: number;
  uid?: string;
  site_name?: string;
  survey_status?: number | string;
  [key: string]: any;
}

export interface JammuRescoDropdownSite {
  id: number;
  site_name: string;
  uid?: string;
  [key: string]: any;
}

export interface JammuRescoSiteDetail {
  id: number;
  uid?: string;
  state?: string;
  district?: string;
  dept_name?: string;
  site_name?: string;
  address?: string;
  ca_no?: string;
  division?: string;
  sub_division?: string;
  [key: string]: any;
}

export interface JammuRescoSurveyStats {
  total: number;
  complete: number;
  pending: number;
}

export interface JammuRescoSurveyItem {
  id: number;
  srt_id?: number;
  uid?: string;
  state?: string;
  district?: string;
  division?: string;
  sub_division?: string;
  department?: string;
  dept_name?: string;
  site_name?: string;
  site_address?: string;
  address?: string;
  ca_no?: string;
  landmark?: string;
  near_landmark?: string;
  agency_person_name?: string;
  agency_person_contact?: string;
  nodal_person?: string;
  contact_nodal?: string;
  latitude?: string;
  longitude?: string;
  load_type?: string;
  connection_phase?: string;
  meter_connection?: string;
  meter_number?: string;
  meter_type?: string;
  sanction_load?: string | number;
  connected_load?: string | number;
  grid_power?: string;
  ltdb_present?: string;
  all_3_phase_ltdb?: string;
  missing_phase?: string;
  roof_condition?: string;
  area_roof?: string | number;
  free_space_solar?: string | number;
  free_space_inverter?: string | number;
  earth_pit?: string;
  survey_remarks?: string;
  remarks?: string;
  building_age?: string;
  roof_access?: string;
  rooftop_height?: string | number;
  parapet_height?: string | number;
  floors_number?: string | number;
  water_source?: string;
  site_access?: string;
  site_distance?: string | number;
  building_image?: string;
  roof_image?: string;
  control_room_image?: string;
  image4?: string;
  image5?: string;
  pdf?: string;
  site_feasible?: string;
  survey_status?: number | string;
  survey_date?: string;
  bos_status?: number | string;
  bos_file?: string;
  bos_remarks?: string;
  created_by?: string | number;
  updated_by?: string | number;
  created_at?: string;
  updated_at?: string;
  [key: string]: any;
}

export interface JammuRescoViewSurveyResponse {
  status: boolean;
  message?: string;
  data: {
    $survey_detail?: JammuRescoSurveyStats;
    survey_detail?: JammuRescoSurveyStats;
    resco: JammuRescoSurveyItem[];
  };
}

export interface JammuRescoAssignedSurveyVendor {
  id?: number;
  name?: string;
  [key: string]: any;
}

export interface JammuRescoAssignedSurveyItem {
  id: number;
  vendor?: string | number;
  state?: string;
  district?: string;
  type?: string;
  purpose?: string;
  vendors?: JammuRescoAssignedSurveyVendor;
  site_name?: string;
  ca_no?: string;
  dept_name?: string;
  created_at?: string;
  updated_at?: string;
  [key: string]: any;
}

export interface JammuRescoBosProductItem {
  id: number;
  name: string;
  unit?: string;
  [key: string]: any;
}

export interface JammuRescoBosMaterialItem {
  id?: number;
  product_id?: number;
  product?: string | JammuRescoBosProductItem;
  quantity?: number | string;
  unit?: string;
  remarks?: string;
  [key: string]: any;
}

export interface JammuRescoBosProductData {
  products: JammuRescoBosProductItem[];
  resco: {
    id: number;
    site_name: string;
    [key: string]: any;
  };
  resco_bos: {
    id?: number;
    site_id: number;
    materials?: JammuRescoBosMaterialItem[];
    [key: string]: any;
  } | null;
}

export interface JammuRescoBosProductStorePayload {
  site_id: number;
  required_date?: string;
  vendor_name?: string;
  site_name?: string;
  remarks?: string;
  products?: number[];
  quantities?: number[];
  units?: string[];
  product_remarks?: string[];
}

/* ═══════════════════════════════════════════════════════════════════════════
   TypeScript Interfaces: Part 2 - Jammu SRT 70MW Survey
   ═══════════════════════════════════════════════════════════════════════════ */

export interface JammuSrtSurveyStats {
  total: number;
  complete: number;
  pending: number;
}

export interface JammuSrtSurveyItem {
  id: number;
  uid?: string | number;
  company_id?: string;
  state?: string;
  district: string;
  department?: string;
  dept_name?: string;
  site_name: string;
  address?: string;
  survey_site_address?: string;
  near_landmark?: string;
  contact_person?: string;
  contact_no?: string;
  proposed_capacity?: string | number;
  latitude?: string;
  longitude?: string;
  load_type?: string;
  connection_type?: string;
  meter_connection_type?: string;
  ca_no?: string;
  meter_no?: string;
  sanction_load?: string | number;
  instantaneous_load?: string | number;
  grid_availability?: string;
  three_phase_available?: string;
  missing_phase?: string;
  ltdb_status?: string;
  existing_dg_set?: number | string;
  dg_set_available?: number | string;
  dg_set_capacity?: string | null;
  dg_set_make?: string | null;
  roof_condition?: string;
  roof_area?: string | number;
  roof_type?: string;
  structure_type?: string;
  solar_free_space?: string | number;
  control_room_free_space?: string | number;
  earth_pit?: string;
  earth_pit_position?: string;
  ac_cable_routing?: string;
  building_age?: string;
  roof_access?: string;
  rooftop_height?: string | number;
  parapet_height?: string | number;
  number_of_floors?: string | number;
  site_access?: string;
  site_distance?: string | number;
  image1?: string | null;
  image2?: string | null;
  image3?: string | null;
  image4?: string | null;
  building_image?: string | null;
  roof_image?: string | null;
  control_room_image?: string | null;
  pdf_file?: string | null;
  pdf?: string | null;
  survey_status?: number | string;
  survey_verify_status?: number | string;
  survey_verify_by?: string | null;
  survey_verify_date?: string | null;
  survey_assign_by?: string | null;
  survey_assign_date?: string | null;
  survey_date?: string;
  survey_vendor?: string | number;
  created_by?: string | number;
  updated_by?: string | number | null;
  created_at?: string;
  updated_at?: string;
  [key: string]: any;
}

export interface JammuSrtViewSurveyData {
  state?: string;
  username?: string;
  company_id?: number;
  survey_detail?: JammuSrtSurveyStats;
  surveys?: JammuSrtSurveyItem[];
}

export interface JammuSrtViewSurveyResponse {
  surveys: JammuSrtViewSurveyData;
}

/* ═══════════════════════════════════════════════════════════════════════════
   JK RESCO Survey Service
   ═══════════════════════════════════════════════════════════════════════════ */

const isRealSurveySite = (s: any): boolean => {
  if (!s) return false;
  const idStr = String(s.id ?? s.srt_id ?? '').trim();
  if (!idStr || idStr === '0' || idStr === 'null' || idStr === 'undefined') return false;
  const name = String(s.site_name ?? '').trim().toLowerCase();
  if (!name) return false;
  if (name.startsWith('-- select') || name.startsWith('- select') || name === 'select site') return false;
  if (name.includes('dummy') || name.includes('fake') || name === 'test site') return false;
  return true;
};

export const jammuRescoSurveyService = {
  /**
   * 1. Pending Survey Sites
   * GET /jk/resco-survey
   */
  async getPendingSurveys(): Promise<JammuRescoPendingSurveySite[]> {
    const res = await fetch(JAMMU_API.SURVEY.RESCO.PENDING_SITES, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) {
      throw new Error(json?.message || `Failed to fetch pending survey sites (${res.status})`);
    }
    const raw = Array.isArray(json?.data) ? json.data : Array.isArray(json) ? json : [];
    return raw.filter(isRealSurveySite);
  },

  /**
   * 2. Fetch Sites (Dropdown list)
   * GET /jk/resco-fetch-site
   */
  async fetchSites(): Promise<JammuRescoDropdownSite[]> {
    const res = await fetch(JAMMU_API.SURVEY.RESCO.FETCH_SITES, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) {
      throw new Error(json?.message || `Failed to fetch sites list (${res.status})`);
    }
    const raw = Array.isArray(json?.data) ? json.data : Array.isArray(json) ? json : [];
    return raw.filter(isRealSurveySite);
  },

  /**
   * 3. Fetch Site Detail
   * GET /jk/resco-fetch-site-detail?srt_id={srt_id}
   */
  async fetchSiteDetail(srtId: number | string): Promise<JammuRescoSiteDetail> {
    const res = await fetch(JAMMU_API.SURVEY.RESCO.FETCH_SITE_DETAIL(srtId), {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) {
      const msg = json?.message || (json?.errors ? Object.values(json.errors).flat().join(' ') : null);
      throw new Error(msg || `Failed to fetch site details (${res.status})`);
    }
    return json?.srt || json?.data || json;
  },

  /**
   * 4. Store Survey
   * POST /jk/resco-survey-store (multipart/form-data)
   */
  async storeSurvey(formData: FormData): Promise<{ status: boolean; message: string }> {
    const res = await fetch(JAMMU_API.SURVEY.RESCO.STORE_SURVEY, {
      method: 'POST',
      headers: getAuthHeaders(true),
      body: formData,
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) {
      let errMsg = json?.message || `Failed to store survey (${res.status})`;
      if (json?.errors) {
        const fieldErrors = Object.values(json.errors).flat().join(' ');
        if (fieldErrors) errMsg = `${errMsg}: ${fieldErrors}`;
      } else if (json?.error) {
        errMsg = `${errMsg}: ${json.error}`;
      }
      throw new Error(errMsg);
    }
    return json;
  },

  /**
   * 5. View Surveys (Summary + Completed list)
   * GET /jk/view-resco-survey
   */
  async viewSurveys(): Promise<JammuRescoViewSurveyResponse['data']> {
    const res = await fetch(JAMMU_API.SURVEY.RESCO.VIEW_SURVEYS, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) {
      throw new Error(json?.message || `Failed to fetch survey records (${res.status})`);
    }
    const dataObj = json?.data || json || {};
    return {
      $survey_detail: dataObj.$survey_detail || dataObj.survey_detail || { total: 0, complete: 0, pending: 0 },
      survey_detail: dataObj.$survey_detail || dataObj.survey_detail || { total: 0, complete: 0, pending: 0 },
      resco: Array.isArray(dataObj.resco) ? dataObj.resco : Array.isArray(dataObj) ? dataObj : [],
    };
  },

  /**
   * 6. Get Survey for Update
   * GET /jk/view-resco-survey-update/{id}
   */
  async getSurveyForUpdate(id: number | string): Promise<JammuRescoSurveyItem> {
    const res = await fetch(JAMMU_API.SURVEY.RESCO.GET_UPDATE_SURVEY(id), {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) {
      throw new Error(json?.message || `Failed to fetch survey for update (${res.status})`);
    }
    return json?.data || json?.srt || json;
  },

  /**
   * 7. Update Survey
   * POST /jk/view-resco-survey-update-store/{id} (multipart/form-data)
   */
  async updateSurvey(id: number | string, formData: FormData): Promise<{ status: boolean; message: string }> {
    const res = await fetch(JAMMU_API.SURVEY.RESCO.UPDATE_SURVEY_STORE(id), {
      method: 'POST',
      headers: getAuthHeaders(true),
      body: formData,
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) {
      let errMsg = json?.message || `Failed to update survey (${res.status})`;
      if (json?.errors) {
        const fieldErrors = Object.values(json.errors).flat().join(' ');
        if (fieldErrors) errMsg = `${errMsg}: ${fieldErrors}`;
      } else if (json?.error) {
        errMsg = `${errMsg}: ${json.error}`;
      }
      throw new Error(errMsg);
    }
    return json;
  },

  /**
   * 8. Assigned Surveys
   * GET /jk/view-assigned-resco-survey
   */
  async getAssignedSurveys(): Promise<JammuRescoAssignedSurveyItem[]> {
    const res = await fetch(JAMMU_API.SURVEY.RESCO.ASSIGNED_SURVEYS, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) {
      throw new Error(json?.message || `Failed to fetch assigned surveys (${res.status})`);
    }
    return Array.isArray(json?.data) ? json.data : Array.isArray(json) ? json : [];
  },

  /**
   * 9. BOS Submit (file upload)
   * POST /jk/resco-bos-submit (multipart/form-data)
   */
  async submitBos(formData: FormData): Promise<{ status: boolean; message: string; data?: any }> {
    const res = await fetch(JAMMU_API.SURVEY.RESCO.BOS_SUBMIT, {
      method: 'POST',
      headers: getAuthHeaders(true),
      body: formData,
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) {
      let errMsg = json?.message || `Failed to submit BOS (${res.status})`;
      if (json?.errors) {
        const fieldErrors = Object.values(json.errors).flat().join(' ');
        if (fieldErrors) errMsg = `${errMsg}: ${fieldErrors}`;
      }
      throw new Error(errMsg);
    }
    return json;
  },

  /**
   * 10. BOS Product Data
   * GET /jk/view-resco-survey-bos-product/{id}
   */
  async getBosProductData(id: number | string): Promise<JammuRescoBosProductData> {
    const res = await fetch(JAMMU_API.SURVEY.RESCO.BOS_PRODUCT_DATA(id), {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) {
      throw new Error(json?.message || `Failed to fetch BOS product details (${res.status})`);
    }
    return json?.data || json;
  },

  /**
   * 11. BOS Product Store (Create / Update)
   * POST /jk/view-resco-survey-bos-product-store (JSON or multipart)
   */
  async storeBosProducts(
    payload: JammuRescoBosProductStorePayload | FormData
  ): Promise<{ status: boolean; message: string; data?: any }> {
    const isMultipart = payload instanceof FormData;
    const res = await fetch(JAMMU_API.SURVEY.RESCO.BOS_PRODUCT_STORE, {
      method: 'POST',
      headers: getAuthHeaders(isMultipart),
      body: isMultipart ? payload : JSON.stringify(payload),
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) {
      let errMsg = json?.message || `Failed to save BOS products (${res.status})`;
      if (json?.errors) {
        const fieldErrors = Object.values(json.errors).flat().join(' ');
        if (fieldErrors) errMsg = `${errMsg}: ${fieldErrors}`;
      }
      throw new Error(errMsg);
    }
    return json;
  },

  /**
   * 12. Download BOS PDF
   * GET /jk/view-resco-survey-bos-product-download/{id}
   * Streams PDF file and triggers browser download
   */
  async downloadBosPdf(id: number | string, siteName = 'BOS_Product'): Promise<void> {
    const headers = getAuthHeaders();
    delete headers['Content-Type'];

    const res = await fetch(JAMMU_API.SURVEY.RESCO.BOS_PDF_DOWNLOAD(id), {
      method: 'GET',
      headers,
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => null);
      throw new Error(errJson?.message || `Failed to download BOS PDF (${res.status})`);
    }

    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const cleanSiteName = siteName.replace(/[^a-zA-Z0-9_-]/g, '_');
    a.download = `${cleanSiteName}_BOS.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  },
};

/* ═══════════════════════════════════════════════════════════════════════════
   Jammu SRT 70MW Survey Service
   ═══════════════════════════════════════════════════════════════════════════ */

export const jammuSrtSurveyService = {
  /**
   * 1. View Surveys
   * GET /jammu/srt70mw/view-survey
   */
  async viewSurveys(): Promise<JammuSrtViewSurveyData> {
    const res = await fetch(JAMMU_API.SURVEY.SRT_70MW.VIEW_SURVEYS, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) {
      throw new Error(json?.message || `Failed to load Jammu SRT surveys (${res.status})`);
    }

    // Backend returns: { surveys: { state: "jammu", survey_detail: {...}, surveys: [...] } }
    const topObj = json?.surveys || json?.data || json || {};
    return {
      state: topObj.state || 'jammu',
      username: topObj.username || '',
      company_id: topObj.company_id,
      survey_detail: topObj.survey_detail || { total: 0, complete: 0, pending: 0 },
      surveys: Array.isArray(topObj.surveys) ? topObj.surveys : Array.isArray(topObj) ? topObj : [],
    };
  },

  /**
   * 2. Add Survey
   * POST /jammu/srt70mw/add-survey (multipart/form-data)
   */
  async addSurvey(formData: FormData): Promise<{ success?: boolean; status?: boolean | string; message: string }> {
    const res = await fetch(JAMMU_API.SURVEY.SRT_70MW.ADD_SURVEY, {
      method: 'POST',
      headers: getAuthHeaders(true),
      body: formData,
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) {
      let errMsg = json?.message || `Failed to add Jammu SRT survey (${res.status})`;
      if (Array.isArray(json?.errors)) {
        errMsg = json.errors.join(' ');
      } else if (json?.errors && typeof json.errors === 'object') {
        errMsg = Object.values(json.errors).flat().join(' ');
      }
      throw new Error(errMsg);
    }
    return json;
  },

  /**
   * 3. Edit (get survey)
   * GET /jammu/srt70mw/edit-survey?id={id}
   */
  async getSurveyForEdit(id: number | string): Promise<JammuSrtSurveyItem> {
    const res = await fetch(JAMMU_API.SURVEY.SRT_70MW.EDIT_SURVEY(id), {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) {
      let errMsg = json?.message || `Failed to get SRT survey details (${res.status})`;
      if (json?.errors) {
        errMsg = `${errMsg}: ${Object.values(json.errors).flat().join(' ')}`;
      }
      throw new Error(errMsg);
    }
    return json?.srt || json?.data || json;
  },

  /**
   * 4. Update Survey
   * POST /jammu/srt70mw/update-survey (multipart/form-data)
   */
  async updateSurvey(formData: FormData): Promise<{ status?: boolean; message: string }> {
    const res = await fetch(JAMMU_API.SURVEY.SRT_70MW.UPDATE_SURVEY, {
      method: 'POST',
      headers: getAuthHeaders(true),
      body: formData,
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) {
      let errMsg = json?.message || `Failed to update Jammu SRT survey (${res.status})`;
      if (Array.isArray(json?.errors)) {
        errMsg = json.errors.join(' ');
      } else if (json?.errors && typeof json.errors === 'object') {
        errMsg = Object.values(json.errors).flat().join(' ');
      }
      throw new Error(errMsg);
    }
    return json;
  },
};

export default {
  jammuRescoSurveyService,
  jammuSrtSurveyService,
  resolveJammuSurveyMediaUrl,
  getJammuSurveyMediaCandidates,
};
