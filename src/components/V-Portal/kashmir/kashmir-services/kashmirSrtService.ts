import { API_BASE_URL, authService } from '../../../../services/authService';
import { KASHMIR_API } from '../../V_Portal_APIS/Kashmir_API';

/* ── Base URLs for media assets ── */
const BACKEND_BASE = (import.meta.env.VITE_API_BASE_URL || 'https://klkerp.com/api')
  .replace(/\/api\/?$/, '')
  .replace(/\/+$/, '');

const R2_BASE = ((import.meta.env.VITE_R2_PUBLIC_URL as string | undefined) ?? '').replace(/\/+$/, '');

export function getKashmirMediaUrl(path?: string | null): string {
  if (!path || typeof path !== 'string') return '';
  const clean = path.trim();
  if (!clean) return '';

  if (/^(https?:)?\/\//i.test(clean) || clean.startsWith('data:') || clean.startsWith('blob:')) {
    return clean;
  }

  const normalized = clean.replace(/^\/+/, '');

  // Exact relative path on backend server
  if (normalized.startsWith('uploads/') || normalized.startsWith('storage/')) {
    return `${BACKEND_BASE}/${normalized}`;
  }

  return `${BACKEND_BASE}/uploads/${normalized}`;
}

export function getKashmirMediaCandidates(path?: string | null): string[] {
  if (!path || typeof path !== 'string') return [];
  const clean = path.trim();
  if (!clean) return [];

  if (/^(https?:)?\/\//i.test(clean) || clean.startsWith('data:') || clean.startsWith('blob:')) {
    return [clean];
  }

  const normalized = clean.replace(/^\/+/, '');
  const filename = normalized.split('/').pop() || normalized;
  const candidates: string[] = [];

  if (normalized.startsWith('uploads/')) {
    candidates.push(`${BACKEND_BASE}/${normalized}`);
  } else if (normalized.startsWith('storage/')) {
    candidates.push(`${BACKEND_BASE}/${normalized}`);
  }

  // Kashmir SRT specific paths
  candidates.push(`${BACKEND_BASE}/uploads/kashmir/installation/srt/panel/${filename}`);
  candidates.push(`${BACKEND_BASE}/uploads/kashmir/installation/srt/system/${filename}`);
  candidates.push(`${BACKEND_BASE}/uploads/kashmir/installation/srt/inverter/${filename}`);
  candidates.push(`${BACKEND_BASE}/uploads/kashmir/installation/srt/nm_sm/${filename}`);
  candidates.push(`${BACKEND_BASE}/uploads/kashmir/installation/srt/loger/${filename}`);
  candidates.push(`${BACKEND_BASE}/uploads/kashmir/installation/srt70mw/claim/${filename}`);
  candidates.push(`${BACKEND_BASE}/uploads/kashmir/survey/srt/images/${filename}`);
  candidates.push(`${BACKEND_BASE}/uploads/kashmir/installation/expenses/${filename}`);
  candidates.push(`${BACKEND_BASE}/uploads/Kashmir/installation/expenses/${filename}`);
  candidates.push(`${BACKEND_BASE}/uploads/kashmir/${filename}`);
  candidates.push(`${BACKEND_BASE}/uploads/${filename}`);
  candidates.push(`${BACKEND_BASE}/${normalized}`);

  if (R2_BASE) {
    candidates.push(`${R2_BASE}/uploads/kashmir/${filename}`);
    candidates.push(`${R2_BASE}/${filename}`);
  }

  return Array.from(new Set(candidates));
}

/* ───────── TypeScript Interfaces ───────── */
export interface KashmirSrtDashboardSummary {
  site_count: number;
  material_dispatch: number;
  material_pending: number;
  complete: number;
  pending: number;
  verify_pending: number;
  verify_approved: number;
  verify_reject: number;
  claim_applicable: number;
  claim_raised: number;
  claim_approved: number;
  inst_pay80_done: number;
  inst_pay80_pending: number;
  inst_pay80_partially: number;
  inst_pay20_done: number;
  inst_pay20_pending: number;
  inst_pay20_partially: number;
  [key: string]: any;
}

export interface KashmirSrtDistrictRow {
  district: string;
  site_count?: number;
  complete?: number;
  pending?: number;
  verify_pending?: number;
  verify_approved?: number;
  verify_reject?: number;
  claim_applicable?: number;
  claim_raised?: number;
  claim_approved?: number;
  inst_pay80_done?: number;
  inst_pay80_pending?: number;
  inst_pay80_partially?: number;
  inst_pay20_done?: number;
  inst_pay20_pending?: number;
  inst_pay20_partially?: number;
  [key: string]: any;
}

export interface KashmirSrtDashboardData {
  company_id?: number;
  loginId?: number;
  name?: string;
  state?: string;
  role?: string;
  parent_id?: number;
  srt: KashmirSrtDashboardSummary;
  district_install?: { district: string; inst_complete: number }[];
  districtwise?: KashmirSrtDistrictRow[];
  district_installation_month?: { month_year: string; monthly_installations: number }[];
}

export interface KashmirAssignSiteItem {
  assign_srt: {
    id: number;
    state?: string;
    vendor?: number | string;
    district?: string;
    sitecount?: number;
    site_name?: string | number[];
    status?: number;
    file?: string;
    remarks?: string;
    assign_date?: string;
    deadline_date?: string;
    [key: string]: any;
  };
  jammu_srt70mws?: {
    id?: number;
    site_name?: string;
    inst_deadline?: string;
    [key: string]: any;
  }[];
  vendor_name?: string;
}

export interface KashmirInstalledSiteItem {
  id: number;
  uid?: string;
  site_code?: string;
  site_name: string;
  state?: string;
  district?: string;
  contact_person?: string;
  contact_number?: string;
  solarmeter_no?: string;
  inverter_no?: string;
  nm_sm_no?: string;
  panel_no?: string | string[];
  loger_no?: string;
  system_image?: string;
  inverter_image?: string;
  panel_image?: string;
  nm_sm_image?: string;
  loger_image?: string;
  inst_latitude?: string | number;
  inst_longitude?: string | number;
  inst_remarks?: string;
  inst_verify_status?: number; // 0=pending, 1=approved, 2=rejected
  inst_claim_status?: number;  // 0=not raised, 1=raised, 2=approved
  inst_pay80_status?: number;
  inst_pay20_status?: number;
  site_inst_status?: number;
  inst_date?: string;
  inst_doc_submit?: number;
  [key: string]: any;
}

export interface KashmirInstallationSummaryData {
  company_id?: number;
  loginId?: number;
  name?: string;
  state?: string;
  role?: string;
  parent_id?: number;
  claimedapplicable: number;
  approvedsite: number;
  verifypending: number;
  rejectsite: number;
  paymentsitecount: number;
  payment80: number;
  payment20: number;
  docsubmit: number;
  claimraised: number;
  complete: number;
  totalsite: number;
  pendingsite: number;
  paymentsite?: KashmirInstalledSiteItem[];
  completesite?: KashmirInstalledSiteItem[];
}

export interface KashmirClaimItem {
  id: number;
  site_name: string;
  state?: string;
  district?: string;
  inst_claim_status: number;
  inst_claim_amount: string | number;
  inst_claim_date?: string;
  inst_claim_invoice?: string;
  claim_updated_at?: string;
  claim_updated_by?: string;
  inst_pay80_date?: string;
  inst_pay80_amount?: string | number;
  inst_pay80_status?: number;
  inst_doc_submit?: number;
  inst_pay20_date?: string;
  inst_pay20_amount?: string | number;
  inst_pay20_status?: number;
  [key: string]: any;
}

export interface KashmirSurveyItem {
  id: number;
  uid?: string;
  state?: string;
  district?: string;
  department?: string;
  dept_name?: string;
  site_name: string;
  site_address?: string;
  ca_no?: string;
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
  meter_no?: string;
  meter_number?: string;
  sanction_load?: string;
  instantaneous_load?: string;
  grid_availability?: string;
  three_phase_available?: string;
  missing_phase?: string;
  ltdb_status?: string;
  dg_set_available?: string | number;
  dg_set_capacity?: string;
  dg_set_make?: string;
  roof_condition?: string;
  roof_area?: string;
  solar_free_space?: string;
  control_room_free_space?: string;
  earth_pit_position?: string;
  ac_cable_routing?: string;
  roof_type?: string;
  structure_type?: string;
  building_age?: string;
  roof_access?: string;
  rooftop_height?: string;
  parapet_height?: string;
  number_of_floors?: string;
  site_access?: string;
  site_distance?: string;
  building_image?: string;
  image1?: string;
  roof_image?: string;
  image2?: string;
  control_room_image?: string;
  image3?: string;
  other_image?: string;
  image4?: string;
  pdf?: string;
  pdf_file?: string;
  survey_status?: number;
  survey_date?: string;
  [key: string]: any;
}

export interface KashmirSurveyDetailKpis {
  total: number;
  complete: number;
  pending: number;
}

export interface KashmirExpenseItem {
  id: number;
  site_id: number;
  site_name?: string;
  purpose: string;
  date: string;
  amount: string | number;
  claim_status: number; // 1=submitted, 2=approved
  pay_status: number;   // 0=pending, 1=complete, 2=partial
  file?: string;
  remarks?: string | null;
  [key: string]: any;
}

export interface KashmirExpensePaymentData {
  payments: KashmirExpenseItem[];
  payment_detail: {
    total: number;
    complete: number;
    partially: number;
    pending: number;
  };
}

class KashmirSrtService {
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

    // fallback to first url
    return fetch(urls[0], options);
  }

  /* ────────────────── 1. INSTALLATION ────────────────── */

  // 1. Dashboard: GET kashmir/srt/70mw/installation/dashboard
  async getDashboard(): Promise<KashmirSrtDashboardData> {
    const res = await this.fetchWithFallback(KASHMIR_API.INSTALLATION.SRT_70MW.DASHBOARD, {
      method: 'GET',
      headers: this.getHeaders(),
    });
    if (!res.ok) throw new Error(`Failed to load dashboard: ${res.statusText}`);
    const json = await res.json();
    return json.data ?? json;
  }

  // 2. Dashboard By Status: GET kashmir/srt/70mw-installation-view-dashboard/{status}
  async getDashboardByStatus(status: string): Promise<any[]> {
    const res = await this.fetchWithFallback(KASHMIR_API.INSTALLATION.SRT_70MW.DASHBOARD_BY_STATUS(status), {
      method: 'GET',
      headers: this.getHeaders(),
    });
    if (!res.ok) throw new Error(`Failed to load status data: ${res.statusText}`);
    const json = await res.json();
    return json.data ?? [];
  }

  // 3. Dashboard Districtwise: GET kashmir/srt/70mw-installation-districtwise/{status}/{district}
  async getDashboardDistrictwise(status: string, district: string): Promise<any[]> {
    const res = await this.fetchWithFallback(KASHMIR_API.INSTALLATION.SRT_70MW.DASHBOARD_DISTRICTWISE(status, district), {
      method: 'GET',
      headers: this.getHeaders(),
    });
    if (!res.ok) throw new Error(`Failed to load district status data: ${res.statusText}`);
    const json = await res.json();
    return json.data ?? [];
  }

  // 4. Assigned Sites: GET kashmir/srt/70mw/installation/assign-site
  async getAssignSites(): Promise<KashmirAssignSiteItem[]> {
    const res = await this.fetchWithFallback(KASHMIR_API.INSTALLATION.SRT_70MW.ASSIGN_SITE, {
      method: 'GET',
      headers: this.getHeaders(),
    });
    if (!res.ok) throw new Error(`Failed to load assigned sites: ${res.statusText}`);
    const json = await res.json();
    return json.data ?? [];
  }

  // 5. Accept Assignment: POST / ANY kashmir/srt/70mw/installation/assign-site-status
  async acceptAssignment(id: number): Promise<{ success: boolean; message?: string }> {
    const formData = new FormData();
    formData.append('id', String(id));
    const res = await this.fetchWithFallback(KASHMIR_API.INSTALLATION.SRT_70MW.ASSIGN_SITE_STATUS, {
      method: 'POST',
      headers: this.getHeaders(true),
      body: formData,
    });
    const json = await res.json();
    if (!res.ok || json.success === false || json.status === false) {
      throw new Error(json.message || json.data || 'Failed to accept assignment');
    }
    return { success: true, message: json.data || json.message || 'Status Updated Successfully!!!' };
  }

  // 6. Fetch Sites (Dropdown): GET kashmir/srt/70mw/installation/fetch-sites
  async fetchSites(): Promise<{ id: number; site_name: string }[]> {
    const res = await this.fetchWithFallback(KASHMIR_API.INSTALLATION.SRT_70MW.FETCH_SITES, {
      method: 'GET',
      headers: this.getHeaders(),
    });
    if (!res.ok) throw new Error(`Failed to fetch sites: ${res.statusText}`);
    const json = await res.json();
    return json.data ?? [];
  }

  // 7. Fetch Site Detail: GET kashmir/srt/70mw/installation/fetch-site-detail?srt_id={srt_id}
  async fetchSiteDetail(srtId: number | string): Promise<any> {
    const res = await this.fetchWithFallback(KASHMIR_API.INSTALLATION.SRT_70MW.FETCH_SITE_DETAIL(srtId), {
      method: 'GET',
      headers: this.getHeaders(),
    });
    if (!res.ok) throw new Error(`Failed to fetch site detail: ${res.statusText}`);
    const json = await res.json();
    return json.data;
  }

  // 8. Submit Installation Details: POST kashmir/srt/70mw/installation/site-details-store (multipart)
  async storeSiteDetails(formData: FormData): Promise<{ status: string | boolean; message: string }> {
    const res = await this.fetchWithFallback(KASHMIR_API.INSTALLATION.SRT_70MW.SITE_DETAILS_STORE, {
      method: 'POST',
      headers: this.getHeaders(true),
      body: formData,
    });
    const json = await res.json();
    if (!res.ok || json.status === false || json.status === 'failed' || json.success === false) {
      throw new Error(json.message || 'Failed to submit site details');
    }
    return json;
  }

  // 9. Get Site For Update: GET kashmir/srt/70mw/installation-site-update?srt_id={srt_id}
  async getSiteUpdate(srtId: number | string): Promise<{ ven: any; srt: any }> {
    const res = await this.fetchWithFallback(KASHMIR_API.INSTALLATION.SRT_70MW.SITE_UPDATE_GET(srtId), {
      method: 'GET',
      headers: this.getHeaders(),
    });
    if (!res.ok) throw new Error(`Failed to fetch site update data: ${res.statusText}`);
    const json = await res.json();
    return json.data;
  }

  // 10. Update Site Details: POST kashmir/srt/70mw/installation-site-update-store (multipart)
  async updateSiteDetails(formData: FormData): Promise<{ success: boolean; message: string }> {
    const res = await this.fetchWithFallback(KASHMIR_API.INSTALLATION.SRT_70MW.SITE_UPDATE_STORE, {
      method: 'POST',
      headers: this.getHeaders(true),
      body: formData,
    });
    const json = await res.json();
    if (!res.ok || json.success === false || json.status === false) {
      throw new Error(json.message || 'Failed to update site details');
    }
    return json;
  }

  // 11. View Dispatched Material: GET kashmir/srt/70mw/view-installation-dispatch-material
  async getViewDispatchMaterial(): Promise<any> {
    const res = await this.fetchWithFallback(KASHMIR_API.INSTALLATION.SRT_70MW.VIEW_DISPATCH_MATERIAL, {
      method: 'GET',
      headers: this.getHeaders(),
    });
    if (!res.ok) {
      // try fallback route
      const resAlt = await this.fetchWithFallback(KASHMIR_API.INSTALLATION.SRT_70MW.VIEW_DISPATCH_MATERIAL_JAMMU, {
        method: 'GET',
        headers: this.getHeaders(),
      });
      if (!resAlt.ok) throw new Error(`Failed to load dispatched material: ${res.statusText}`);
      const json = await resAlt.json();
      return json.data;
    }
    const json = await res.json();
    return json.data;
  }

  // 12. View Installed Sites Summary: GET kashmir/srt/70mw/view-install-sites
  async getViewInstallSites(): Promise<KashmirInstallationSummaryData> {
    const res = await this.fetchWithFallback(KASHMIR_API.INSTALLATION.SRT_70MW.VIEW_INSTALL_SITES, {
      method: 'GET',
      headers: this.getHeaders(),
    });
    if (!res.ok) throw new Error(`Failed to load installation sites: ${res.statusText}`);
    const json = await res.json();
    return json.data ?? json;
  }

  // 13. View Claim Requests: GET kashmir/srt70mw/view-claim-request
  async getViewClaimRequest(): Promise<KashmirClaimItem[]> {
    const res = await this.fetchWithFallback(KASHMIR_API.INSTALLATION.SRT_70MW.VIEW_CLAIM_REQUEST, {
      method: 'GET',
      headers: this.getHeaders(),
    });
    if (!res.ok) throw new Error(`Failed to load claim requests: ${res.statusText}`);
    const json = await res.json();
    return json.data ?? [];
  }

  // 14. Raise Installation Claim: POST kashmir/srt70mw/install-claim-raised (multipart)
  async raiseInstallationClaim(formData: FormData): Promise<{ status: boolean; message: string }> {
    const res = await this.fetchWithFallback(KASHMIR_API.INSTALLATION.SRT_70MW.INSTALL_CLAIM_RAISED, {
      method: 'POST',
      headers: this.getHeaders(true),
      body: formData,
    });
    const json = await res.json();
    if (!res.ok || json.status === false || json.success === false) {
      throw new Error(json.message || 'Failed to raise claim');
    }
    return json;
  }

  // 15. Submit Document: GET kashmir/srt70mw/install-submit-document?srt_id={srt_id}
  async submitDocument(srtId: number | string): Promise<{ status: boolean; message: string }> {
    const res = await this.fetchWithFallback(KASHMIR_API.INSTALLATION.SRT_70MW.INSTALL_SUBMIT_DOCUMENT(srtId), {
      method: 'GET',
      headers: this.getHeaders(),
    });
    const json = await res.json();
    if (!res.ok || json.status === false || json.success === false) {
      throw new Error(json.message || 'Failed to submit document');
    }
    return json;
  }

  /* ────────────────── 2. SURVEY ────────────────── */

  // 16. Assigned Survey Sites: GET kashmir/srt70mw/survey-assign-site
  async getSurveyAssignSites(): Promise<any[]> {
    const res = await this.fetchWithFallback(KASHMIR_API.SURVEY.SRT_70MW.ASSIGN_SITE, {
      method: 'GET',
      headers: this.getHeaders(),
    });
    if (!res.ok) throw new Error(`Failed to load assigned survey sites: ${res.statusText}`);
    const json = await res.json();
    return json.data ?? [];
  }

  // 17. Survey View: GET kashmir/srt70mw/survey-view
  async getSurveyView(): Promise<{ survey_detail: KashmirSurveyDetailKpis; surveys: KashmirSurveyItem[] }> {
    const res = await this.fetchWithFallback(KASHMIR_API.SURVEY.SRT_70MW.VIEW, {
      method: 'GET',
      headers: this.getHeaders(),
    });
    if (!res.ok) throw new Error(`Failed to load surveys: ${res.statusText}`);
    const json = await res.json();
    return json.data ?? { survey_detail: { total: 0, complete: 0, pending: 0 }, surveys: [] };
  }

  // 18. Survey Pending Sites (Add dropdown): GET kashmir/srt70mw/survey-add
  async getSurveyAddSites(): Promise<{ id: number; site_name: string; district?: string; survey_status?: number }[]> {
    const res = await this.fetchWithFallback(KASHMIR_API.SURVEY.SRT_70MW.ADD, {
      method: 'GET',
      headers: this.getHeaders(),
    });
    if (!res.ok) throw new Error(`Failed to load pending survey sites: ${res.statusText}`);
    const json = await res.json();
    return json.data ?? [];
  }

  // 19. Survey Site Detail: GET kashmir/srt70mw/survey-fetch-site-detail?srt_id={srt_id}
  async getSurveySiteDetail(srtId: number | string): Promise<any> {
    const res = await this.fetchWithFallback(KASHMIR_API.SURVEY.SRT_70MW.FETCH_SITE_DETAIL(srtId), {
      method: 'GET',
      headers: this.getHeaders(),
    });
    if (!res.ok) throw new Error(`Failed to load site details: ${res.statusText}`);
    const json = await res.json();
    return json.data;
  }

  // 20. Submit Survey: POST kashmir/srt70mw/survey-store (multipart)
  async storeSurvey(formData: FormData): Promise<{ status: boolean; message: string }> {
    const res = await this.fetchWithFallback(KASHMIR_API.SURVEY.SRT_70MW.STORE, {
      method: 'POST',
      headers: this.getHeaders(true),
      body: formData,
    });
    const json = await res.json();
    if (!res.ok || json.status === false || json.success === false) {
      throw new Error(json.message || 'Failed to submit survey');
    }
    return json;
  }

  // 21. Get Survey For Edit: GET kashmir/srt70mw/survey-edit/{id}
  async getSurveyEdit(id: number | string): Promise<KashmirSurveyItem> {
    const res = await this.fetchWithFallback(KASHMIR_API.SURVEY.SRT_70MW.EDIT(id), {
      method: 'GET',
      headers: this.getHeaders(),
    });
    if (!res.ok) throw new Error(`Failed to fetch survey for edit: ${res.statusText}`);
    const json = await res.json();
    return json.data;
  }

  // 22. Update Survey: POST (with _method=PUT) kashmir/srt70mw/survey-update/{id}
  async updateSurvey(id: number | string, formData: FormData): Promise<{ status: boolean; message: string }> {
    formData.append('_method', 'PUT');
    const res = await this.fetchWithFallback(KASHMIR_API.SURVEY.SRT_70MW.UPDATE(id), {
      method: 'POST',
      headers: this.getHeaders(true),
      body: formData,
    });
    const json = await res.json();
    if (!res.ok || json.status === false || json.success === false) {
      throw new Error(json.message || 'Failed to update survey');
    }
    return json;
  }

  /* ────────────────── 3. INSTALLATION EXPENSES ────────────────── */

  // 23. List Expenses: GET kashmir/srt70mw/installation-expenses
  async getExpenses(): Promise<KashmirExpenseItem[]> {
    const res = await this.fetchWithFallback(KASHMIR_API.EXPENSES.SRT_70MW.LIST, {
      method: 'GET',
      headers: this.getHeaders(),
    });
    if (!res.ok) throw new Error(`Failed to load expenses: ${res.statusText}`);
    const json = await res.json();
    return json.data ?? [];
  }

  // 24. Expense Create Sites: GET kashmir/srt70mw/installation-expenses-create
  async getExpenseCreateSites(): Promise<{ id: number; site_name: string; district?: string }[]> {
    const res = await this.fetchWithFallback(KASHMIR_API.EXPENSES.SRT_70MW.CREATE_DATA, {
      method: 'GET',
      headers: this.getHeaders(),
    });
    if (!res.ok) throw new Error(`Failed to load sites for expense claim: ${res.statusText}`);
    const json = await res.json();
    return json.data ?? [];
  }

  // 25. Submit Expense Claim: POST kashmir/srt70mw/installation-expenses-store (multipart)
  async storeExpense(formData: FormData): Promise<{ success: boolean; message: string }> {
    const res = await this.fetchWithFallback(KASHMIR_API.EXPENSES.SRT_70MW.STORE, {
      method: 'POST',
      headers: this.getHeaders(true),
      body: formData,
    });
    const json = await res.json();
    if (!res.ok || json.success === false) {
      throw new Error(json.message || 'Failed to submit expense claim');
    }
    return json;
  }

  // 26. Get Expense Claim For Edit: GET kashmir/srt70mw/installation-expenses-edit?claim_id={claim_id}
  async getExpenseEdit(claimId: number | string): Promise<{ claim: KashmirExpenseItem; srt70mw: { id: number; site_name: string }[] }> {
    const res = await this.fetchWithFallback(KASHMIR_API.EXPENSES.SRT_70MW.EDIT(claimId), {
      method: 'GET',
      headers: this.getHeaders(),
    });
    if (!res.ok) throw new Error(`Failed to fetch claim edit details: ${res.statusText}`);
    const json = await res.json();
    return json.data;
  }

  // 27. Update Expense Claim: POST kashmir/srt70mw/installation-expenses-update (multipart)
  async updateExpense(formData: FormData): Promise<{ success: boolean; message: string }> {
    const res = await this.fetchWithFallback(KASHMIR_API.EXPENSES.SRT_70MW.UPDATE, {
      method: 'POST',
      headers: this.getHeaders(true),
      body: formData,
    });
    const json = await res.json();
    if (!res.ok || json.success === false) {
      throw new Error(json.message || 'Failed to update expense claim');
    }
    return json;
  }

  // 28. Approved Claims & Payment Status: GET kashmir/srt70mw/installation-expenses-view-payment
  async getExpensePayments(): Promise<KashmirExpensePaymentData> {
    const res = await this.fetchWithFallback(KASHMIR_API.EXPENSES.SRT_70MW.VIEW_PAYMENT, {
      method: 'GET',
      headers: this.getHeaders(),
    });
    if (!res.ok) throw new Error(`Failed to load payment details: ${res.statusText}`);
    const json = await res.json();
    return json.data ?? { payments: [], payment_detail: { total: 0, complete: 0, partially: 0, pending: 0 } };
  }
}

export const kashmirSrtService = new KashmirSrtService();
