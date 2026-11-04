import { authService } from '../../../../services/authService';
import { JAMMU_API, ROOT_URL } from '../../V_Portal_APIS/Jammu_API';

/**
 * Universal token getter for Vendor session
 */
export const getAuthToken = (): string | null => {
  const fromAuth = authService.getToken();
  if (fromAuth) return fromAuth;

  const session = authService.getSession();
  if (session?.token) return session.token;

  try {
    const rawLocal = localStorage.getItem('klk_user_session');
    if (rawLocal) {
      const p = JSON.parse(rawLocal);
      if (p?.token) return p.token;
    }
  } catch {}

  try {
    const rawSession = sessionStorage.getItem('klk_user_session');
    if (rawSession) {
      const p = JSON.parse(rawSession);
      if (p?.token) return p.token;
    }
  } catch {}

  return (
    localStorage.getItem('token') ||
    localStorage.getItem('access_token') ||
    localStorage.getItem('authToken') ||
    localStorage.getItem('accessToken') ||
    localStorage.getItem('klk_auth_token') ||
    sessionStorage.getItem('token') ||
    sessionStorage.getItem('access_token') ||
    sessionStorage.getItem('klk_auth_token') ||
    null
  );
};

/**
 * Common request headers generator
 */
export const getAuthHeaders = (isMultipart = false): Record<string, string> => {
  const token = getAuthToken();
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
};

/**
 * Resolve Jammu upload media URLs
 * Images uploads/jammu/installation/srt/{panel, system, inverter, nm_sm, loger}/
 * Invoices uploads/Jammu/installation/srt70mw/claim/
 */
export function getJammuMediaCandidates(path?: string | null): string[] {
  if (!path) return [];
  const trimmed = String(path).trim();
  if (!trimmed) return [];
  if (/^(https?:|data:|blob:)/i.test(trimmed)) return [trimmed];

  const normalized = trimmed.replace(/^\/+/, '');
  const filename = normalized.split('/').pop() || normalized;
  const candidates: string[] = [];

  candidates.push(`${ROOT_URL}/${normalized}`);
  candidates.push(`${ROOT_URL}/uploads/jammu/installation/srt/assignsite/${filename}`);
  candidates.push(`${ROOT_URL}/uploads/jammu/installation/resco/assign/${filename}`);
  candidates.push(`${ROOT_URL}/uploads/jammu/installation/srt/payment70/${filename}`);
  candidates.push(`${ROOT_URL}/uploads/jammu/installation/srt/${filename}`);
  candidates.push(`${ROOT_URL}/uploads/jammu/installation/srt70mw/${filename}`);
  candidates.push(`${ROOT_URL}/uploads/Jammu/installation/srt70mw/claim/${filename}`);
  candidates.push(`${ROOT_URL}/uploads/jammu/installation/expenses/${filename}`);
  candidates.push(`${ROOT_URL}/uploads/${filename}`);

  const R2_BASE = ((import.meta.env.VITE_R2_PUBLIC_URL as string | undefined) ?? '').replace(/\/+$/, '');
  if (R2_BASE) {
    candidates.push(`${R2_BASE}/${normalized}`);
    candidates.push(`${R2_BASE}/${filename}`);
  }

  return Array.from(new Set(candidates));
}

export function resolveJammuMediaUrl(path?: string | null): string {
  if (!path) return '';
  if (/^(https?:|data:|blob:)/i.test(path)) return path;
  const candidates = getJammuMediaCandidates(path);
  return candidates[0] || `${ROOT_URL}/${path.replace(/^\/+/, '')}`;
}

/* ═══════════════════════════════════════════════════════════════════════════
   TypeScript Interfaces for Jammu SRT 70MW Installation
   ═══════════════════════════════════════════════════════════════════════════ */

// 1. Assigned Sites
export interface JammuAssignSrtMeta {
  id: number;
  company_id: number | string;
  volume?: number | string | null;
  purpose?: string | null;
  type?: string | null;
  vendor: number | string;
  state: string;
  district: string;
  sitecount: number | string;
  site_name: string | number[]; // JSON string e.g. "[\"157\"]"
  assign_date?: string | null;
  file?: string | null;
  panel_no_file?: string | null;
  created_by?: string | null;
  update_by?: string | null;
  status: number; // 0 = Inactive, 1 = Assigned, 2 = Accepted
  remarks?: string | null;
  remark?: string | null;
  created_at?: string;
  updated_at?: string;
  [key: string]: any;
}

export interface JammuAssignedSiteSubItem {
  id?: number;
  site_name: string;
  inst_deadline?: string;
  district?: string;
  location?: string;
  ca_no?: string;
}

export interface JammuAssignedSiteItem {
  assign_srt: JammuAssignSrtMeta;
  jammu_srt70mws: JammuAssignedSiteSubItem[];
}

// 3. Site Name dropdown
export interface JammuInstallableSiteName {
  id: number;
  site_name: string;
  site_code?: string;
  district?: string;
}

// 4. Site Detail
export interface JammuSrtSiteDetail {
  id: number;
  uid: string;
  state: string;
  site_code: string;
  site_name: string;
  district: string;
  dept_name: string;
  location: string;
  firm_name: string;
  ca_no: string;
  plant_sc: string | number;
  wo_no: string;
  phase: string;
  material_i_date: string;
  mb_invoice: string;
  sanction_load: string | number;
  volume: string | number;
  material_status?: number;
  inst_accept?: number;
  site_inst_status?: number;
  [key: string]: any;
}

// 6. Installation Summary
export interface JammuPaymentSiteItem {
  id: number;
  site_name: string;
  district?: string;
  ca_no?: string;
  inst_pay80_status?: number;
  inst_pay20_status?: number;
  [key: string]: any;
}

export interface JammuCompleteSiteItem {
  id: number;
  site_name: string;
  district?: string;
  ca_no?: string;
  total_panels?: number;
  used_panels?: number;
  unused_panels?: number;
  inst_date?: string;
  inst_verify_status?: number;
  inst_doc_submit?: number;
  inst_claim_status?: number;
  [key: string]: any;
}

export interface JammuInstallationSummaryData {
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
  paymentsite: JammuPaymentSiteItem[];
  completesite: JammuCompleteSiteItem[];
}

// 7. Edit Site
export interface JammuEditSiteData {
  srt: {
    id: number;
    site_name: string;
    inverter_no: string;
    panel_no: string | string[]; // JSON string e.g. "[\"P1\",\"P2\"]"
    solarmeter_no?: string;
    nm_sm_no?: string;
    loger_no?: string;
    contact_person?: string;
    contact_number?: string;
    inst_latitude?: string;
    inst_longitude?: string;
    inst_remarks?: string;
    site_inst_status: number;
    panels_count: number;
    [key: string]: any;
  };
}

// 11. Claim Request Item
export interface JammuClaimItem {
  id: number;
  srt_id?: number;
  site_name: string;
  inst_claim_status: number; // 0 = Not Raised, 1 = Raised, 2 = Approved, 3 = Rejected
  inst_claim_date: string;
  inst_claim_amount: string | number;
  inst_claim_invoice: string;
  district?: string;
  site_code?: string;
  inst_doc_submit?: number; // 0 = Not Submitted, 1 = Submitted, 2 = Approved, 3 = Rejected
  inst_doc?: string | null;
  document_status?: number;
  [key: string]: any;
}

// 12. Dashboard Data
export interface JammuDashboardSrtOverview {
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
}

export interface JammuDistrictInstallSummary {
  district: string;
  inst_complete: number;
}

export interface JammuDistrictWiseDetail {
  district: string;
  site_count: number;
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
}

export interface JammuMonthlyInstallationItem {
  month_year: string;
  monthly_installations: number;
}

export interface JammuInstallationDashboardData {
  srt: JammuDashboardSrtOverview;
  district_install: JammuDistrictInstallSummary[];
  districtwise: JammuDistrictWiseDetail[];
  district_installation_month: JammuMonthlyInstallationItem[];
}

export interface JammuStatusSiteItem {
  id: number;
  site_name: string;
  district: string;
  site_inst_status: number;
  [key: string]: any;
}

export function normalizeJammuStatus(rawStatus?: string | null): string {
  if (!rawStatus) return 'total';
  const s = String(rawStatus).trim().toLowerCase();

  const MAP: Record<string, string> = {
    // Complete / Installed -> inst-complete
    'complete': 'inst-complete',
    'completed': 'inst-complete',
    'installed': 'inst-complete',
    'inst-complete': 'inst-complete',
    'install-complete': 'inst-complete',

    // Pending -> inst-pending
    'pending': 'inst-pending',
    'inst-pending': 'inst-pending',
    'install-pending': 'inst-pending',

    // Material
    'material-dispatch': 'material-dispatch',
    'material-dispatched': 'material-dispatch',
    'material_dispatch': 'material-dispatch',
    'material-pending': 'material-pending',
    'material_pending': 'material-pending',

    // Verification
    'verify-approved': 'verify-approved',
    'approved': 'verify-approved',
    'verify-pending': 'verify-pending',
    'verify-reject': 'verify-reject',
    'verify-rejected': 'verify-reject',
    'reject': 'verify-reject',
    'rejected': 'verify-reject',

    // Claims
    'claim-applicable': 'claim-applicable',
    'claim-raised': 'claim-raised',
    'claim-approved': 'claim-approved',

    // Payments 80%
    'pay80': 'inst-pay80-done',
    'pay-80': 'inst-pay80-done',
    '80': 'inst-pay80-done',
    'inst-pay80-done': 'inst-pay80-done',
    'inst-pay80-pending': 'inst-pay80-pending',
    'inst-pay80-partially': 'inst-pay80-partially',

    // Payments 20%
    'pay20': 'inst-pay20-done',
    'pay-20': 'inst-pay20-done',
    '20': 'inst-pay20-done',
    'inst-pay20-done': 'inst-pay20-done',
    'inst-pay20-pending': 'inst-pay20-pending',
    'inst-pay20-partially': 'inst-pay20-partially',

    // Total
    'total': 'total',
    'all': 'total',
  };

  return MAP[s] || s;
}

/* ═══════════════════════════════════════════════════════════════════════════
   Jammu SRT 70MW Service Implementation
   ═══════════════════════════════════════════════════════════════════════════ */

class JammuSrt70mwService {
  /**
   * 1. Assigned Sites: GET /jammu/srt70mw/installation-assign-site
   */
  async getAssignedSites(): Promise<JammuAssignedSiteItem[]> {
    const res = await fetch(JAMMU_API.INSTALLATION.SRT_70MW.ASSIGNED_SITES, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch assigned sites (${res.status} ${res.statusText})`);
    }

    const json = await res.json();
    return Array.isArray(json?.data) ? json.data : [];
  }

  /**
   * 2. Accept Assignment: POST /jammu/srt70mw/installation-assign-site-status
   * Effect: assign status = 2, inst_accept = 1
   * Note: Backend may return HTTP 500 if WhatsApp SMS fails, but DB status is already updated to 2.
   */
  async acceptAssignment(id: number | string): Promise<{ success: boolean; message: string }> {
    const numId = Number(id);
    const targetUrl = `${JAMMU_API.INSTALLATION.SRT_70MW.ACCEPT_ASSIGNMENT}?id=${encodeURIComponent(numId)}`;

    // Helper to evaluate API response
    const evaluateResponse = (res: Response, json: any) => {
      // 1. Direct success response (200 / 201 or success/status true)
      if (res.ok || json?.success === true || json?.status === 'success' || json?.status === true) {
        return {
          success: true,
          message: typeof json?.data === 'string' ? json.data : json?.message || 'Status Updated Successfully!!!',
        };
      }

      // 2. HTTP 500 where DB status is updated but WhatsApp / SMS gateway failed
      // Backend doc: "pehle wala 500 tab bhi aa sakta hai jab status DB me update ho chuka ho (sirf WhatsApp fail hua)."
      const rawMsg = String(json?.message || json?.error || '');
      const isSmsFailure =
        res.status === 500 &&
        (rawMsg.toLowerCase().includes('sms') ||
         rawMsg.toLowerCase().includes('whatsapp') ||
         rawMsg.toLowerCase().includes('notification'));

      if (isSmsFailure) {
        return {
          success: true,
          message: 'Status Updated Successfully! (Note: WhatsApp/SMS notification could not be delivered)',
        };
      }

      return null;
    };

    // Strategy 1: Try FormData (native PHP $_POST compatibility)
    let jsonResult: any = null;
    let lastStatus = 0;

    try {
      const fd = new FormData();
      fd.append('id', String(numId));

      const resFd = await fetch(targetUrl, {
        method: 'POST',
        headers: getAuthHeaders(true),
        body: fd,
      });

      lastStatus = resFd.status;
      jsonResult = await resFd.json().catch(() => null);
      const evalFd = evaluateResponse(resFd, jsonResult);
      if (evalFd) return evalFd;
    } catch {
      // Continue to Strategy 2 (JSON)
    }

    // Strategy 2: Try JSON payload
    try {
      const resJson = await fetch(targetUrl, {
        method: 'POST',
        headers: getAuthHeaders(false),
        body: JSON.stringify({ id: numId }),
      });

      lastStatus = resJson.status;
      jsonResult = await resJson.json().catch(() => null);
      const evalJson = evaluateResponse(resJson, jsonResult);
      if (evalJson) return evalJson;
    } catch (err: any) {
      const msg = String(err?.message || '');
      if (msg.toLowerCase().includes('sms') || msg.toLowerCase().includes('whatsapp')) {
        return {
          success: true,
          message: 'Status Updated Successfully! (Note: SMS notification could not be delivered)',
        };
      }
      throw err;
    }

    // If both returned error, build friendly message
    const errMsg =
      jsonResult?.errors?.id?.[0] ||
      jsonResult?.message ||
      jsonResult?.error ||
      (lastStatus === 422 ? 'The selected assignment ID is invalid or already accepted.' : `Failed to accept assignment (${lastStatus})`);

    throw new Error(errMsg);
  }

  /**
   * 3. Fetch Site Names (Dropdown for install form): GET /jammu/srt70mw/fetch-sites-name
   */
  async getInstallableSiteNames(): Promise<JammuInstallableSiteName[]> {
    const res = await fetch(JAMMU_API.INSTALLATION.SRT_70MW.FETCH_SITE_NAMES, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch installable site names (${res.status})`);
    }

    const json = await res.json();
    return Array.isArray(json?.data) ? json.data : [];
  }

  /**
   * 4. Fetch Site Detail: GET /jammu/srt70mw/site-detail?srt_id={srt_id}
   */
  async getSiteDetail(srtId: number | string): Promise<JammuSrtSiteDetail | null> {
    const res = await fetch(JAMMU_API.INSTALLATION.SRT_70MW.FETCH_SITE_DETAIL(srtId), {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch site detail (${res.status})`);
    }

    const json = await res.json();
    return json?.data || null;
  }

  /**
   * 5. Site Details Store (Install Site): POST /jammu/srt70mw/installation-site-details-store
   * Content-Type: multipart/form-data
   */
  async installSiteStore(formData: FormData): Promise<{ status: string; message: string }> {
    const res = await fetch(JAMMU_API.INSTALLATION.SRT_70MW.INSTALL_SITE_STORE, {
      method: 'POST',
      headers: getAuthHeaders(true),
      body: formData,
    });

    const json = await res.json().catch(() => null);

    // Note: If WhatsApp/SMS fails on server, DB installation details are already saved successfully
    const rawMsg = String(json?.message || json?.error || '');
    const isSmsFailure =
      rawMsg.toLowerCase().includes('sms') ||
      rawMsg.toLowerCase().includes('whatsapp') ||
      rawMsg.toLowerCase().includes('notification');

    if (isSmsFailure) {
      return {
        status: 'success',
        message: 'Details Submitted Successfully! (Note: SMS/WhatsApp notification could not be delivered)',
      };
    }

    if (!res.ok || json?.status === false || json?.success === false) {
      let errMsg = json?.message || `Failed to submit installation details (${res.status})`;
      if (json?.errors) {
        const firstErrorKey = Object.keys(json.errors)[0];
        if (firstErrorKey && json.errors[firstErrorKey]?.[0]) {
          errMsg = json.errors[firstErrorKey][0];
        }
      }
      if (errMsg === 'Site Not found.') {
        errMsg = 'Site Not Found: Dispatch material record was not found for this site in the ERP system. Please verify that material dispatch has been completed.';
      }
      throw new Error(errMsg);
    }

    return {
      status: json?.status || 'success',
      message: json?.message || 'Details Submitted Successfully!!!',
    };
  }

  /**
   * 6. Installation Summary: GET /jammu/srt70mw/view-install-srt70mw-sites
   */
  async getInstallationSummary(): Promise<JammuInstallationSummaryData> {
    const res = await fetch(JAMMU_API.INSTALLATION.SRT_70MW.VIEW_INSTALLATION_SUMMARY, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch installation summary (${res.status})`);
    }

    const json = await res.json();
    return (
      json?.data || {
        claimedapplicable: 0,
        approvedsite: 0,
        verifypending: 0,
        rejectsite: 0,
        paymentsitecount: 0,
        payment80: 0,
        payment20: 0,
        docsubmit: 0,
        claimraised: 0,
        complete: 0,
        totalsite: 0,
        pendingsite: 0,
        paymentsite: [],
        completesite: [],
      }
    );
  }

  /**
   * 7. Edit Installation Site (Load): POST /jammu/srt70mw/installation-site-edit
   */
  async editInstallationLoad(id: number | string): Promise<JammuEditSiteData['srt']> {
    const res = await fetch(JAMMU_API.INSTALLATION.SRT_70MW.EDIT_INSTALL_LOAD, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ id: Number(id) }),
    });

    if (!res.ok) {
      throw new Error(`Failed to load installed site data (${res.status})`);
    }

    const json = await res.json();
    if (!json?.data?.srt) {
      throw new Error('Installed site record not found.');
    }

    return json.data.srt;
  }

  /**
   * 8. Update Installation Site: POST /jammu/srt70mw/installation-site-update
   * Content-Type: multipart/form-data
   */
  async updateInstallationStore(formData: FormData): Promise<{ success: boolean; message: string }> {
    const res = await fetch(JAMMU_API.INSTALLATION.SRT_70MW.UPDATE_INSTALL_STORE, {
      method: 'POST',
      headers: getAuthHeaders(true),
      body: formData,
    });

    const json = await res.json().catch(() => null);

    if (!res.ok) {
      let errMsg = json?.message || `Failed to update installation (${res.status})`;
      if (json?.errors) {
        const firstErrorKey = Object.keys(json.errors)[0];
        if (firstErrorKey && json.errors[firstErrorKey]?.[0]) {
          errMsg = json.errors[firstErrorKey][0];
        }
      }
      throw new Error(errMsg);
    }

    return {
      success: json?.success ?? true,
      message: json?.message || 'Details Updated Successfully!!!',
    };
  }

  /**
   * 9. Submit Document: GET /jammu/srt70mw/installation-submit-document?srt_id={srt_id}
   */
  async submitDocument(srtId: number | string): Promise<{ status: boolean; message: string; data?: any }> {
    const res = await fetch(JAMMU_API.INSTALLATION.SRT_70MW.SUBMIT_DOCUMENT(srtId), {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    const json = await res.json().catch(() => null);

    if (!res.ok) {
      throw new Error(json?.message || `Failed to submit document (${res.status})`);
    }

    return {
      status: json?.status ?? true,
      message: json?.message || 'Document Submitted Successfully!!!',
      data: json?.data,
    };
  }

  /**
   * 10. Claim Raise: POST /jammu/srt70mw/installation-claim-raise
   * Content-Type: multipart/form-data
   */
  async raiseClaim(formData: FormData): Promise<{ status: boolean; message: string; data?: any }> {
    const res = await fetch(JAMMU_API.INSTALLATION.SRT_70MW.CLAIM_RAISE, {
      method: 'POST',
      headers: getAuthHeaders(true),
      body: formData,
    });

    const json = await res.json().catch(() => null);

    if (!res.ok) {
      let errMsg = json?.message || `Failed to raise claim (${res.status})`;
      if (json?.errors?.claim_amount?.[0]) {
        errMsg = json.errors.claim_amount[0];
      }
      throw new Error(errMsg);
    }

    return {
      status: json?.status ?? true,
      message: json?.message || 'Claim raised Successfully!!!',
      data: json?.data,
    };
  }

  /**
   * 11. View Claim Request: GET /Jammu/srt70mw/view-claim-request
   */
  async getClaimRequests(): Promise<JammuClaimItem[]> {
    try {
      const res = await fetch(JAMMU_API.INSTALLATION.SRT_70MW.VIEW_CLAIM_REQUEST, {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      if (res.ok) {
        const json = await res.json();
        return Array.isArray(json?.data) ? json.data : [];
      }
    } catch {}

    // Fallback to lowercase route if server is Linux case-insensitive or redirected
    const resAlt = await fetch(JAMMU_API.INSTALLATION.SRT_70MW.VIEW_CLAIM_REQUEST_ALT, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!resAlt.ok) {
      throw new Error(`Failed to fetch claim requests (${resAlt.status})`);
    }

    const jsonAlt = await resAlt.json();
    return Array.isArray(jsonAlt?.data) ? jsonAlt.data : [];
  }

  /**
   * 12. Installation Dashboard: GET /jammu/srt70mw/installation-dashboard
   */
  async getDashboard(): Promise<JammuInstallationDashboardData> {
    let json: any = null;
    let lastStatus = 0;

    try {
      const res = await fetch(JAMMU_API.INSTALLATION.SRT_70MW.DASHBOARD, {
        method: 'GET',
        headers: getAuthHeaders(),
      });
      lastStatus = res.status;
      if (res.ok) {
        json = await res.json();
      }
    } catch {}

    // Fallback if initial endpoint fails (e.g., Linux route case differences)
    if (!json) {
      const altUrl = JAMMU_API.INSTALLATION.SRT_70MW.DASHBOARD_ALT;
      const resAlt = await fetch(altUrl, {
        method: 'GET',
        headers: getAuthHeaders(),
      });
      lastStatus = resAlt.status;
      if (!resAlt.ok) {
        throw new Error(`Failed to fetch dashboard data (${resAlt.status || lastStatus})`);
      }
      json = await resAlt.json();
    }

    const raw = json?.data?.srt ? json.data : json?.srt ? json : json?.data || json || {};

    return {
      srt: raw?.srt || (raw?.site_count !== undefined ? raw : {
        site_count: 0,
        material_dispatch: 0,
        material_pending: 0,
        complete: 0,
        pending: 0,
        verify_pending: 0,
        verify_approved: 0,
        verify_reject: 0,
        claim_applicable: 0,
        claim_raised: 0,
        claim_approved: 0,
        inst_pay80_done: 0,
        inst_pay80_pending: 0,
        inst_pay80_partially: 0,
        inst_pay20_done: 0,
        inst_pay20_pending: 0,
        inst_pay20_partially: 0,
      }),
      district_install: Array.isArray(raw?.district_install) ? raw.district_install : [],
      districtwise: Array.isArray(raw?.districtwise) ? raw.districtwise : [],
      district_installation_month: Array.isArray(raw?.district_installation_month)
        ? raw.district_installation_month
        : Array.isArray(raw?.monthly_installations)
        ? raw.monthly_installations
        : [],
    };
  }

  /**
   * 13. View Dashboard By Status: GET /jammu/srt70mw/installation-view-dashboard/{status}
   */
  async getDashboardByStatus(status: string): Promise<{ meta: { status: string; count: number }; data: JammuStatusSiteItem[] }> {
    const normStatus = normalizeJammuStatus(status);
    let res = await fetch(JAMMU_API.INSTALLATION.SRT_70MW.DASHBOARD_BY_STATUS(normStatus), {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!res.ok && res.status === 404) {
      try {
        const alt = await fetch(JAMMU_API.INSTALLATION.SRT_70MW.DASHBOARD_BY_STATUS_ALT(normStatus), {
          method: 'GET',
          headers: getAuthHeaders(),
        });
        if (alt.ok) res = alt;
      } catch {}
    }

    const json = await res.json().catch(() => null);

    if (!res.ok) {
      const errMsg = json?.message || `Failed to fetch dashboard sites for status ${normStatus} (${res.status})`;
      throw new Error(errMsg);
    }

    return {
      meta: json?.meta || { status: normStatus, count: Array.isArray(json?.data) ? json.data.length : 0 },
      data: Array.isArray(json?.data) ? json.data : [],
    };
  }

  /**
   * 14. Districtwise By Status: GET /jammu/srt70mw/installation-districtwise/{status}/{district}
   */
  async getDistrictwiseByStatus(
    status: string,
    district: string
  ): Promise<{ meta: { status: string; count: number }; data: JammuStatusSiteItem[] }> {
    const normStatus = normalizeJammuStatus(status);
    let res = await fetch(JAMMU_API.INSTALLATION.SRT_70MW.DISTRICTWISE_BY_STATUS(normStatus, district), {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!res.ok && res.status === 404) {
      try {
        const alt = await fetch(JAMMU_API.INSTALLATION.SRT_70MW.DISTRICTWISE_BY_STATUS_ALT(normStatus, district), {
          method: 'GET',
          headers: getAuthHeaders(),
        });
        if (alt.ok) res = alt;
      } catch {}
    }

    const json = await res.json().catch(() => null);

    if (!res.ok) {
      const errMsg = json?.message || `Failed to fetch sites for ${normStatus} in ${district} (${res.status})`;
      throw new Error(errMsg);
    }

    return {
      meta: json?.meta || { status: normStatus, count: Array.isArray(json?.data) ? json.data.length : 0 },
      data: Array.isArray(json?.data) ? json.data : [],
    };
  }
}

export const jammuSrt70mwService = new JammuSrt70mwService();
export default jammuSrt70mwService;
