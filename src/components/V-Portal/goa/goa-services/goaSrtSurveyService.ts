import { API_BASE_URL, authService } from '../../../../services/authService';
import { GOA_API } from '../../V_Portal_APIS/Goa_API';

/* ── Base URLs for media assets ── */
const BACKEND_BASE = (import.meta.env.VITE_API_BASE_URL || 'https://klkerp.com/api')
  .replace(/\/api\/?$/, '')
  .replace(/\/+$/, '');

const R2_BASE = ((import.meta.env.VITE_R2_PUBLIC_URL as string | undefined) ?? '').replace(/\/+$/, '');

export function getGoaSrtSurveyImageCandidates(path?: string | null): string[] {
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

  // Survey-specific upload paths
  candidates.push(`${BACKEND_BASE}/uploads/goa/survey/images/${filename}`);
  candidates.push(`${BACKEND_BASE}/uploads/goa/survey/pdf/${filename}`);
  candidates.push(`${BACKEND_BASE}/uploads/goa/survey/${filename}`);
  candidates.push(`${BACKEND_BASE}/uploads/goa/${filename}`);
  candidates.push(`${BACKEND_BASE}/uploads/${filename}`);
  candidates.push(`${BACKEND_BASE}/${normalized}`);

  if (R2_BASE) {
    candidates.push(`${R2_BASE}/uploads/goa/survey/images/${filename}`);
    candidates.push(`${R2_BASE}/${filename}`);
  }
  candidates.push(`https://pub-21d2019fecbe4a96a88c93b2f091317a.r2.dev/${filename}`);

  return Array.from(new Set(candidates));
}

/* ───────── TypeScript Interfaces ───────── */
export interface GoaSrtSurveyDropdownItem {
  id: number;
  site_name: string;
  uid?: string;
  [key: string]: any;
}

export interface GoaSrtSurveySiteDetail {
  id: number;
  uid?: string;
  state?: string;
  district?: string;
  division?: string;
  sub_division?: string;
  dept_name?: string;
  site_name?: string;
  address?: string;
  ca_no?: string;
  [key: string]: any;
}

export interface GoaSrtSurveyRecord {
  id: number;
  uid?: string;
  state?: string;
  district?: string;
  division?: string;
  sub_division?: string;
  dept_name?: string;
  site_name?: string;
  address?: string;
  ca_no?: string;
  survey_status?: number; // 0 = Pending, 1 = Done
  survey_date?: string;
  survey_verify_status?: number; // 0 = Pending, 1 = Approved, 2 = Rejected
  verify_remarks?: string;
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
  sanction_load?: string;
  connected_load?: string;
  grid_power?: string;
  ltdb_present?: string;
  all_3_phase_ltdb?: string;
  missing_phase?: string;
  roof_condition?: string;
  area_roof?: string;
  free_space_solar?: string;
  free_space_inverter?: string;
  earth_pit?: string;
  site_feasible?: string;
  survey_remarks?: string;
  building_age?: string;
  roof_access?: string;
  rooftop_height?: string;
  floors_number?: string;
  water_source?: string;
  site_access?: string;
  site_distance?: string;
  parapet_height?: string;
  image1?: string | null;
  image2?: string | null;
  image3?: string | null;
  image4?: string | null;
  pdf_file?: string | null;
  created_by?: number;
  [key: string]: any;
}

export interface GoaSrtSurveySummary {
  total: number;
  complete: number;
  pending: number;
  verify_pending: number;
  verify_complete: number;
  verify_reject: number;
}

export interface GoaSrtSurveyViewData {
  survey_detail: GoaSrtSurveySummary;
  srt: GoaSrtSurveyRecord[];
}

class GoaSrtSurveyService {
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

  /* 1. Fetch Site Names (Dropdown): GET /goa/srt/installation/survey/fetch-site-name */
  async fetchSiteNames(): Promise<GoaSrtSurveyDropdownItem[]> {
    try {
      const res = await this.fetchWithFallback(GOA_API.SURVEY.SRT.FETCH_SITE_NAME, {
        method: 'GET',
        headers: this.getHeaders(),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      return json.data || json.sites || [];
    } catch (err) {
      console.warn('GoaSrtSurveyService.fetchSiteNames error:', err);
      return [];
    }
  }

  /* 2. Fetch Site Detail: GET /goa/srt/installation/survey/fetch-site-detail?srt_id={srt_id} */
  async fetchSiteDetail(srtId: number | string): Promise<GoaSrtSurveySiteDetail | null> {
    try {
      const res = await this.fetchWithFallback(GOA_API.SURVEY.SRT.FETCH_SITE_DETAIL(srtId), {
        method: 'GET',
        headers: this.getHeaders(),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      return json.data || null;
    } catch (err) {
      console.warn('GoaSrtSurveyService.fetchSiteDetail error:', err);
      return null;
    }
  }

  /* 3. Survey Store: POST /goa/srt/installation/survey-store (multipart/form-data) */
  async storeSurvey(formData: FormData): Promise<{ success: boolean; message: string; data?: any; errors?: any }> {
    try {
      const res = await this.fetchWithFallback(GOA_API.SURVEY.SRT.STORE, {
        method: 'POST',
        headers: this.getHeaders(true),
        body: formData,
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        return {
          success: false,
          message: json?.message || 'Failed to submit survey form.',
          errors: json?.errors,
        };
      }
      return {
        success: json?.success ?? json?.status ?? true,
        message: json?.message || 'Survey Complete Successfully!!!',
        data: json?.data,
      };
    } catch (err: any) {
      console.error('GoaSrtSurveyService.storeSurvey error:', err);
      return {
        success: false,
        message: err.message || 'Network error occurred.',
      };
    }
  }

  /* 4. Survey Update Load: GET /goa/srt/installation/view-survey-update?id={id} */
  async viewSurveyUpdate(id: number | string): Promise<GoaSrtSurveyRecord | null> {
    try {
      const res = await this.fetchWithFallback(GOA_API.SURVEY.SRT.VIEW_SURVEY_UPDATE(id), {
        method: 'GET',
        headers: this.getHeaders(),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      return json.data || null;
    } catch (err) {
      console.warn('GoaSrtSurveyService.viewSurveyUpdate error:', err);
      return null;
    }
  }

  /* 5. Survey Update Store: POST /goa/srt/installation/view-survey-update-store (multipart/form-data) */
  async updateSurveyStore(formData: FormData): Promise<{ success: boolean; message: string; data?: any; errors?: any }> {
    try {
      const res = await this.fetchWithFallback(GOA_API.SURVEY.SRT.UPDATE_STORE, {
        method: 'POST',
        headers: this.getHeaders(true),
        body: formData,
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        return {
          success: false,
          message: json?.message || 'Failed to update survey details.',
          errors: json?.errors,
        };
      }
      return {
        success: json?.success ?? json?.status ?? true,
        message: json?.message || 'Survey Updated Successfully!!!',
        data: json?.data,
      };
    } catch (err: any) {
      console.error('GoaSrtSurveyService.updateSurveyStore error:', err);
      return {
        success: false,
        message: err.message || 'Network error occurred.',
      };
    }
  }

  /* 6. View Survey (Summary + List): ANY /goa/srt/installation/view-survey/{status?} */
  async viewSurvey(status?: string): Promise<GoaSrtSurveyViewData> {
    const emptyResult: GoaSrtSurveyViewData = {
      survey_detail: {
        total: 0,
        complete: 0,
        pending: 0,
        verify_pending: 0,
        verify_complete: 0,
        verify_reject: 0,
      },
      srt: [],
    };

    try {
      const url = GOA_API.SURVEY.SRT.VIEW_SURVEY(status);
      const res = await this.fetchWithFallback(url, {
        method: 'GET',
        headers: this.getHeaders(),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      const data = json.data || {};

      return {
        survey_detail: {
          total: Number(data.survey_detail?.total ?? 0),
          complete: Number(data.survey_detail?.complete ?? 0),
          pending: Number(data.survey_detail?.pending ?? 0),
          verify_pending: Number(data.survey_detail?.verify_pending ?? 0),
          verify_complete: Number(data.survey_detail?.verify_complete ?? 0),
          verify_reject: Number(data.survey_detail?.verify_reject ?? 0),
        },
        srt: Array.isArray(data.srt) ? data.srt : [],
      };
    } catch (err) {
      console.warn('GoaSrtSurveyService.viewSurvey error:', err);
      return emptyResult;
    }
  }
}

export const goaSrtSurveyService = new GoaSrtSurveyService();
export default goaSrtSurveyService;
