import { API_BASE_URL, authService } from './authService';

export interface BiharUlaSurveyItem {
  id: number;
  state?: string;
  company_id?: number;
  created_by?: number;
  district: string;
  block: string;
  panchayat: string;
  village: string;
  address: string;
  consumer_name: string;
  gender: string;
  contact_no: string;
  aadhar_no?: string;
  ca_number: string;
  feasible_status: number; // 0 = Not Feasible, 1 = Feasible
  smart_meter?: number; // 0 = No, 1 = Yes
  smart_meter_no?: string;
  smart_meter_functional?: number; // 0 = No, 1 = Yes
  latitude?: number | string;
  longitude?: number | string;
  remarks?: string;
  survey_status?: number;
  verify_status?: number; // 0 = Pending, 1 = Approved, 2 = Rejected
  verify_remarks?: string | null;
  verifier?: { name?: string; id?: number } | string | null;
  electricity_bill_photo?: string | null;
  consent_form_photo?: string | null;
  aadhar_card_photo?: string | null;
  survey_date?: string;
  created_at?: string;
  updated_at?: string;
  [key: string]: any;
}

export interface UlaSurveyKpis {
  total: number;
  feasible: number;
  not_feasible: number;
  verified: number;
  pending: number;
  rejected: number;
}

export interface UlaCreateResponse {
  status: boolean;
  data?: {
    districts: (string | { district: string; district_name?: string })[];
  };
}

export interface UlaBlockResponse {
  status: boolean;
  data: (string | { block_name: string; block?: string })[];
}

export interface UlaPanchayatResponse {
  status: boolean;
  data: (string | { panchayat_name: string; panchayat?: string })[];
}

export interface UlaViewResponse {
  status: boolean;
  data: {
    surveys: BiharUlaSurveyItem[];
  };
}

class BiharUlaSurveyService {
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
   * Helper: try fetching with fallback URLs
   */
  private async fetchWithFallback(endpoint: string, options: RequestInit = {}): Promise<Response> {
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const baseClean = API_BASE_URL.replace(/\/+$/, '');
    const altBase = baseClean.endsWith('/api') ? baseClean.slice(0, -4) : `${baseClean}/api`;

    const urls = [
      `${baseClean}${cleanEndpoint}`,
      `${altBase}${cleanEndpoint}`,
      `${baseClean}/v${cleanEndpoint}`,
    ];

    let lastError: any = null;
    for (const url of urls) {
      try {
        const res = await fetch(url, options);
        if (res.status !== 404) {
          return res;
        }
        // If 404, try next url
        lastError = new Error(`404 on ${url}`);
      } catch (err) {
        lastError = err;
      }
    }
    // If all failed, return the first one's call
    return fetch(urls[0], options);
  }

  /**
   * 34. Survey Form (District List)
   * GET /bihar/ula-surveys/create
   */
  async getDistricts(): Promise<string[]> {
    try {
      const res = await this.fetchWithFallback('/bihar/ula-surveys/create', {
        method: 'GET',
        headers: this.getHeaders(),
      });

      if (!res.ok) {
        console.warn('[ULA Survey] getDistricts responded with status:', res.status);
        // Fallback default districts per documentation
        return ['Muzaffarpur', 'Samastipur', 'Vaishali', 'Sheohar', 'Sitamarhi'];
      }

      const json = await res.json();
      const rawDistricts = json?.data?.districts || json?.districts || [];
      if (Array.isArray(rawDistricts) && rawDistricts.length > 0) {
        return rawDistricts.map((d: any) =>
          typeof d === 'string' ? d : d.district || d.district_name || String(d)
        );
      }
      return ['Muzaffarpur', 'Samastipur', 'Vaishali', 'Sheohar', 'Sitamarhi'];
    } catch (err) {
      console.error('[ULA Survey] Failed to load districts:', err);
      return ['Muzaffarpur', 'Samastipur', 'Vaishali', 'Sheohar', 'Sitamarhi'];
    }
  }

  /**
   * 39. Get Blocks
   * GET /bihar/ula-surveys/blocks?district=Muzaffarpur
   */
  async getBlocks(district: string): Promise<string[]> {
    if (!district) return [];
    try {
      const res = await this.fetchWithFallback(
        `/bihar/ula-surveys/blocks?district=${encodeURIComponent(district)}`,
        {
          method: 'GET',
          headers: this.getHeaders(),
        }
      );

      if (!res.ok) return [];

      const json = await res.json();
      const list = json?.data || json?.blocks || [];
      if (Array.isArray(list)) {
        return list.map((b: any) =>
          typeof b === 'string' ? b : b.block_name || b.block || String(b)
        );
      }
      return [];
    } catch (err) {
      console.error('[ULA Survey] Failed to load blocks:', err);
      return [];
    }
  }

  /**
   * 40. Get Panchayat
   * GET /bihar/ula-surveys/panchayat?district=Muzaffarpur&block=Kanti
   */
  async getPanchayats(district: string, block: string): Promise<string[]> {
    if (!district || !block) return [];
    try {
      const res = await this.fetchWithFallback(
        `/bihar/ula-surveys/panchayat?district=${encodeURIComponent(district)}&block=${encodeURIComponent(block)}`,
        {
          method: 'GET',
          headers: this.getHeaders(),
        }
      );

      if (!res.ok) return [];

      const json = await res.json();
      const list = json?.data || json?.panchayats || [];
      if (Array.isArray(list)) {
        return list.map((p: any) =>
          typeof p === 'string' ? p : p.panchayat_name || p.panchayat || String(p)
        );
      }
      return [];
    } catch (err) {
      console.error('[ULA Survey] Failed to load panchayats:', err);
      return [];
    }
  }

  /**
   * 35. View Surveys
   * GET /bihar/ula-surveys/view
   */
  async getViewSurveys(): Promise<{
    surveys: BiharUlaSurveyItem[];
    kpis: UlaSurveyKpis;
  }> {
    try {
      const res = await this.fetchWithFallback('/bihar/ula-surveys/view', {
        method: 'GET',
        headers: this.getHeaders(),
      });

      if (!res.ok) {
        if (res.status === 404) {
          return {
            surveys: [],
            kpis: { total: 0, feasible: 0, not_feasible: 0, verified: 0, pending: 0, rejected: 0 },
          };
        }
        throw new Error(`Server returned HTTP ${res.status}`);
      }

      const json = await res.json();
      const list: BiharUlaSurveyItem[] =
        json?.data?.surveys || json?.surveys || (Array.isArray(json?.data) ? json.data : []);

      // Calculate KPIs
      const total = list.length;
      let feasible = 0;
      let not_feasible = 0;
      let verified = 0;
      let pending = 0;
      let rejected = 0;

      list.forEach((item) => {
        if (item.feasible_status === 1) feasible++;
        else not_feasible++;

        if (item.verify_status === 1) verified++;
        else if (item.verify_status === 2) rejected++;
        else pending++;
      });

      return {
        surveys: list,
        kpis: {
          total,
          feasible,
          not_feasible,
          verified,
          pending,
          rejected,
        },
      };
    } catch (err: any) {
      console.error('[ULA Survey] getViewSurveys error:', err);
      throw err;
    }
  }

  /**
   * 36. Survey Store
   * POST /bihar/ula-surveys (multipart/form-data)
   */
  async storeSurvey(formData: FormData): Promise<{ status: boolean; message: string; data?: any }> {
    const res = await this.fetchWithFallback('/bihar/ula-surveys', {
      method: 'POST',
      headers: this.getHeaders(true),
      body: formData,
    });

    const json = await res.json();

    if (!res.ok) {
      if (res.status === 422 && json.errors) {
        const firstErr = Object.values(json.errors).flat()[0] as string;
        throw new Error(firstErr || json.message || 'Validation error');
      }
      throw new Error(json.message || `Failed to save survey (HTTP ${res.status})`);
    }

    return json;
  }

  /**
   * 37. Survey Edit Data
   * GET /bihar/ula-surveys/edit?id=21
   */
  async getSurveyForEdit(id: number | string): Promise<{
    survey: BiharUlaSurveyItem;
    districts?: string[];
  }> {
    const res = await this.fetchWithFallback(`/bihar/ula-surveys/edit?id=${encodeURIComponent(id)}`, {
      method: 'GET',
      headers: this.getHeaders(),
    });

    const json = await res.json();

    if (!res.ok) {
      throw new Error(json.message || `Failed to load survey details (HTTP ${res.status})`);
    }

    const survey = json?.survey || json?.data?.survey || json?.data;
    const rawDistricts = json?.districts || json?.data?.districts || [];
    const districts = Array.isArray(rawDistricts)
      ? rawDistricts.map((d: any) => (typeof d === 'string' ? d : d.district || String(d)))
      : [];

    return { survey, districts };
  }

  /**
   * 38. Survey Update
   * POST /bihar/ula-surveys/update (multipart/form-data)
   */
  async updateSurvey(formData: FormData): Promise<{ status: boolean; message: string; data?: any }> {
    const res = await this.fetchWithFallback('/bihar/ula-surveys/update', {
      method: 'POST',
      headers: this.getHeaders(true),
      body: formData,
    });

    const json = await res.json();

    if (!res.ok) {
      if (res.status === 422 && json.errors) {
        const firstErr = Object.values(json.errors).flat()[0] as string;
        throw new Error(firstErr || json.message || 'Validation error');
      }
      throw new Error(json.message || `Failed to update survey (HTTP ${res.status})`);
    }

    return json;
  }
}

export const biharUlaSurveyService = new BiharUlaSurveyService();
