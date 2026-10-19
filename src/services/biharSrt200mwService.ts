import { API_BASE_URL, authService } from './authService';

export interface BiharSrtSiteItem {
  id: number;
  uid?: string;
  state?: string;
  district?: string;
  division?: string;
  sub_division?: string;
  department?: string;
  site_name?: string;
  address?: string;
  ca_no?: string;
  survey_status?: number;
  survey_verify_status?: number;
  verify_remarks?: string;
  survey_date?: string;
  survey_address?: string;
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
  [key: string]: any;
}

export interface SurveyDetailKpis {
  total: number;
  complete: number;
  pending: number;
  verify_pending: number;
  verify_complete: number;
  verify_reject: number;
}

export interface ViewSurveyResponse {
  status: boolean;
  data: {
    survey_detail: SurveyDetailKpis;
    srt200mw: BiharSrtSiteItem[];
  };
}

class BiharSrt200mwService {
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

  /**
   * 1. GET /bihar/srt200mw-survey
   * Fetches pending sites for survey (survey_vendor = parent_id aur survey_status != 1)
   * Note: Backend returns 404 with {"success": false, "message": "No sites available for survey"}
   * when there are no pending sites for the vendor.
   */
  async getSurveyPendingSites(): Promise<{ sites: BiharSrtSiteItem[]; message?: string }> {
    const urlsToTry = [
      `${API_BASE_URL}/bihar/srt200mw-survey`,
      API_BASE_URL.replace(/\/api$/, '') + '/bihar/srt200mw-survey',
      `${API_BASE_URL}/v/bihar/srt200mw-survey`,
    ];

    for (const url of urlsToTry) {
      try {
        const res = await fetch(url, {
          method: 'GET',
          headers: this.getHeaders(),
        });

        const json = await res.json().catch(() => null);

        if (res.status === 404) {
          // Check if this is the expected 404 from VendorBiharSrt200mwSurveyController
          if (json && (json.message === 'No sites available for survey' || json.success === false)) {
            return {
              sites: [],
              message: json.message || 'No sites available for survey',
            };
          }
          continue; // Try next URL if it was an actual routing 404
        }

        if (res.ok && json) {
          if (Array.isArray(json.data)) {
            return { sites: json.data };
          }
          if (Array.isArray(json)) {
            return { sites: json };
          }
        }
      } catch (err) {
        console.warn(`[biharSrt200mw] getSurveyPendingSites error trying ${url}:`, err);
      }
    }

    return { sites: [], message: 'No sites available for survey' };
  }

  /**
   * 2. POST /bihar/srt200mw-survey-store
   * Submit new survey multipart/form-data
   */
  async storeSurvey(formData: FormData): Promise<{ success: boolean; message: string; errors?: any }> {
    try {
      const res = await fetch(`${API_BASE_URL}/bihar/srt200mw-survey-store`, {
        method: 'POST',
        headers: this.getHeaders(true),
        body: formData,
      });
      const data = await res.json().catch(() => null);

      if (!res.ok) {
        let msg = data?.message;
        if (typeof msg === 'object' && msg !== null) {
          const firstKey = Object.keys(msg)[0];
          msg = Array.isArray(msg[firstKey]) ? msg[firstKey][0] : String(msg[firstKey]);
        }
        return {
          success: false,
          message: msg || `Failed to submit survey (${res.status})`,
          errors: data?.message || data?.errors,
        };
      }

      return {
        success: data?.status ?? data?.success ?? true,
        message: data?.message || 'Survey Created Successfully!!!',
      };
    } catch (err: any) {
      return {
        success: false,
        message: err?.message || 'Network error occurred while submitting survey.',
      };
    }
  }

  /**
   * 3. GET /bihar/srt200mw-survey-edit?id=5
   * Load existing survey details for edit
   */
  async getSurveyForEdit(id: number | string): Promise<BiharSrtSiteItem | null> {
    try {
      const res = await fetch(`${API_BASE_URL}/bihar/srt200mw-survey-edit?id=${encodeURIComponent(id)}`, {
        method: 'GET',
        headers: this.getHeaders(),
      });
      if (!res.ok) return null;
      const json = await res.json();
      return json?.data?.srt200mw ?? json?.data ?? null;
    } catch (err) {
      console.warn('[biharSrt200mw] getSurveyForEdit error:', err);
      return null;
    }
  }

  /**
   * 4. POST /bihar/srt200mw-survey-update
   * Update survey multipart/form-data
   */
  async updateSurvey(formData: FormData): Promise<{ success: boolean; message: string; errors?: any }> {
    try {
      const res = await fetch(`${API_BASE_URL}/bihar/srt200mw-survey-update`, {
        method: 'POST',
        headers: this.getHeaders(true),
        body: formData,
      });
      const data = await res.json().catch(() => null);

      if (!res.ok) {
        let msg = data?.message;
        if (typeof msg === 'object' && msg !== null) {
          const firstKey = Object.keys(msg)[0];
          msg = Array.isArray(msg[firstKey]) ? msg[firstKey][0] : String(msg[firstKey]);
        }
        return {
          success: false,
          message: msg || `Failed to update survey (${res.status})`,
          errors: data?.message || data?.errors,
        };
      }

      return {
        success: data?.success ?? data?.status ?? true,
        message: data?.message || 'Survey Updated Successfully!!!',
      };
    } catch (err: any) {
      return {
        success: false,
        message: err?.message || 'Network error occurred while updating survey.',
      };
    }
  }

  /**
   * 5. ANY /bihar/srt200mw-view-survey
   * Fetches summary statistics + full list of vendor sites
   */
  async getViewSurveyData(): Promise<ViewSurveyResponse> {
    const defaultResponse: ViewSurveyResponse = {
      status: true,
      data: {
        survey_detail: {
          total: 0,
          complete: 0,
          pending: 0,
          verify_pending: 0,
          verify_complete: 0,
          verify_reject: 0,
        },
        srt200mw: [],
      },
    };

    try {
      const res = await fetch(`${API_BASE_URL}/bihar/srt200mw-view-survey`, {
        method: 'GET',
        headers: this.getHeaders(),
      });
      if (!res.ok) {
        // Try fallback with POST as route is Route::any
        const postRes = await fetch(`${API_BASE_URL}/bihar/srt200mw-view-survey`, {
          method: 'POST',
          headers: this.getHeaders(),
        });
        if (!postRes.ok) return defaultResponse;
        const postJson = await postRes.json();
        return this.normalizeViewSurveyResponse(postJson, defaultResponse);
      }
      const json = await res.json();
      return this.normalizeViewSurveyResponse(json, defaultResponse);
    } catch (err) {
      console.warn('[biharSrt200mw] getViewSurveyData error:', err);
      return defaultResponse;
    }
  }

  private normalizeViewSurveyResponse(raw: any, fallback: ViewSurveyResponse): ViewSurveyResponse {
    if (!raw) return fallback;
    const data = raw.data || raw;
    const detail = data.survey_detail || {};
    const sites = Array.isArray(data.srt200mw)
      ? data.srt200mw
      : Array.isArray(data)
      ? data
      : [];

    return {
      status: raw.status ?? raw.success ?? true,
      data: {
        survey_detail: {
          total: Number(detail.total ?? sites.length),
          complete: Number(detail.complete ?? sites.filter((s: any) => s.survey_status === 1).length),
          pending: Number(detail.pending ?? sites.filter((s: any) => s.survey_status !== 1).length),
          verify_pending: Number(detail.verify_pending ?? sites.filter((s: any) => s.survey_verify_status === 0).length),
          verify_complete: Number(detail.verify_complete ?? sites.filter((s: any) => s.survey_verify_status === 1).length),
          verify_reject: Number(detail.verify_reject ?? sites.filter((s: any) => s.survey_verify_status === 2).length),
        },
        srt200mw: sites,
      },
    };
  }
}

export const biharSrt200mwService = new BiharSrt200mwService();
export default biharSrt200mwService;
