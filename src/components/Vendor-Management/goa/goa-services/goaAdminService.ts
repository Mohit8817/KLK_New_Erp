import { API_BASE_URL, authService } from '../../../../services/authService';
import {
  BASE_URL,
  ROOT_URL,
  API_ROOT,
  RAW_ADMIN_URL,
  GOA_ADMIN_SRT_API,
  GOA_ADMIN_SURVEY_API,
  GOA_ADMIN_AMC_API,
  buildCandidateUrls,
} from '../../Vendor_Management_APIS/Goa_Vendor_API';

/* ── Base URLs for media assets ── */
export const BACKEND_BASE = (API_BASE_URL || 'https://klkerp.com/api')
  .replace(/\/api\/?$/, '')
  .replace(/\/+$/, '');

export const R2_BASE = (
  (import.meta.env.VITE_R2_PUBLIC_URL as string | undefined) ||
  'https://pub-21d2019fecbe4a96a88c93b2f091317a.r2.dev'
).replace(/\/+$/, '');

export function getGoaMediaCandidates(path?: string | null): string[] {
  if (!path || typeof path !== 'string') return [];
  const clean = path.trim().replace(/\\/g, '/');
  if (!clean || clean === '—') return [];

  if (/^(https?:)?\/\//i.test(clean) || clean.startsWith('data:') || clean.startsWith('blob:')) {
    return [clean];
  }

  const normalized = clean.replace(/^\/+/, '');
  const filename = normalized.split('/').pop() || normalized;
  const candidates: string[] = [];

  candidates.push(`${BACKEND_BASE}/${normalized}`);
  candidates.push(`${BACKEND_BASE}/uploads/goa/srt/installation/assignsite/${filename}`);
  candidates.push(`${BACKEND_BASE}/uploads/goa/srt/installation/${filename}`);
  candidates.push(`${BACKEND_BASE}/uploads/goa/installation/srt/${filename}`);
  candidates.push(`${BACKEND_BASE}/uploads/goa/survey/${filename}`);
  candidates.push(`${BACKEND_BASE}/uploads/goa/amc/${filename}`);
  candidates.push(`${BACKEND_BASE}/uploads/goa/${filename}`);
  candidates.push(`${BACKEND_BASE}/uploads/${filename}`);

  if (R2_BASE) {
    candidates.push(`${R2_BASE}/uploads/goa/${filename}`);
    candidates.push(`${R2_BASE}/${filename}`);
  }

  return Array.from(new Set(candidates));
}

export function resolveGoaMediaUrl(path?: string | null): string {
  if (!path) return '';
  if (/^(https?:|data:|blob:)/i.test(path)) return path;
  const candidates = getGoaMediaCandidates(path);
  return candidates[0] || `${BACKEND_BASE}/${path.replace(/^\/+/, '')}`;
}

export function calculateDeadlineDays(load?: number | string | null): number {
  const l = Number(load ?? 0);
  if (l >= 101) return 21;
  if (l >= 21) return 14;
  return 7;
}

/**
 * Normalize status string for drilldown route and API calls
 */
export function normalizeGoaDashboardStatus(status?: string): string {
  if (!status) return 'total-srt-sites';
  const s = status.toLowerCase().replace(/[\s_]+/g, '-');
  if (s === 'all' || s === 'total' || s === 'total-site' || s === 'site_count' || s === 'total-sites') {
    return 'total-srt-sites';
  }
  if (s === 'site-cancel' || s === 'cancel') return 'site-cancel';
  if (s === 'site-assigned' || s === 'assigned' || s === 'total-assigned') return 'total-srt-assign-sites';
  if (s === 'accepted' || s === 'site-accepted') return 'total-srt-sites-accepted';
  if (s === 'pending' || s === 'unassigned' || s === 'site-not-assigned') return 'total-srt-pending-sites';
  if (s === 'complete' || s === 'installed') return 'install';
  if (s === 'not-install' || s === 'not-installed') return 'not-install';
  if (s === 'verify-approved' || s === 'verified' || s === 'approved') return 'site-verified';
  if (s === 'verify-pending' || s === 'in-audit' || s === 'pending-audit') return 'verification-pending';
  if (s === 'verify-reject' || s === 'rejected') return 'site-rejected';
  if (s === 'claim-applicable') return 'claim-applicable';
  if (s === 'claim-raised' || s === 'claims') return 'claim-raised';
  if (s === 'inspection-pending') return 'inspection-pending';
  if (s === 'inspection-done' || s === 'inpection-complete') return 'inspection-done';
  if (s === 'pay1-done' || s === 'pay70-complete') return 'pay1-done';
  if (s === 'pay2-done' || s === 'pay15-complete') return 'pay2-done';
  if (s === 'pay3-done' || s === 'pay3-complete') return 'pay3-done';
  if (s === 'pay2-pending') return 'pay2-pending';
  if (s === 'doc-submit' || s === 'inst-doc-complete') return 'doc-submit';
  if (s === 'doc-pending' || s === 'inst-doc-pending') return 'doc-pending';
  if (s === 'doc-approve' || s === 'inst-doc-approve') return 'doc-approve';
  if (s === 'doc-reject' || s === 'inst-doc-reject') return 'doc-reject';
  if (s === 'final-payment-done') return 'final-payment-done';
  if (s === 'final-payment-pending') return 'final-payment-pending';
  if (s === 'inst-pay1-amount') return 'inst-pay1-amount';
  if (s === 'inst-pay2-amount') return 'inst-pay2-amount';
  if (s === 'inst-pay3-amount') return 'inst-pay3-amount';
  return s;
}

/* ── Type Definitions ── */

export interface GoaSurveyDetailStats {
  total: number;
  assigned: number;
  not_assigned: number;
  survey_done: number;
  survey_pending: number;
  survey_verify_pending: number;
  survey_verify_complete: number;
  survey_verify_reject: number;
}

export interface GoaSurveyDistrictwiseRow {
  district: string;
  total: number;
  assigned: number;
  not_assigned: number;
  survey_done: number;
  survey_pending: number;
  survey_verify_pending: number;
  survey_verify_complete: number;
  survey_verify_reject: number;
  [key: string]: any;
}

export interface GoaSurveyVendorwiseRow {
  survey_vendor: string | number;
  vendor_name?: string;
  total: number;
  assigned: number;
  not_assigned: number;
  survey_done: number;
  survey_pending: number;
  survey_verify_pending: number;
  survey_verify_complete: number;
  survey_verify_reject: number;
  [key: string]: any;
}

export interface GoaSurveyDashboardData {
  survey_detail: GoaSurveyDetailStats;
  districtwise: GoaSurveyDistrictwiseRow[];
  vendorwises: GoaSurveyVendorwiseRow[];
}

export interface GoaSurveyAssignFormData {
  vendor: Array<{ id: number; name: string; [key: string]: any }>;
  districts: Array<{ district: string; [key: string]: any }>;
}

export interface GoaSurveyFetchSiteItem {
  id: number;
  site_name: string;
  [key: string]: any;
}

export interface GoaSurveyAssignRecord {
  id: number;
  vendor: number;
  company_id?: number;
  type?: string;
  purpose?: string;
  state: string;
  district: string;
  site_name: string;
  sitecount: number;
  assign_date: string;
  file?: string | null;
  remarks?: string;
  created_by?: number;
  vendors?: { id: number; name: string; [key: string]: any };
  [key: string]: any;
}

export interface GoaSurveyAssignViewData {
  loginId?: number;
  loginName?: string;
  company_id?: number;
  role?: string;
  state?: string;
  srtRecords: GoaSurveyAssignRecord[];
  survey: {
    totalsite: number;
    assignsite: number;
    not_assign: number;
    complete_survey: number;
    pending_survey: number;
  };
}

export interface GoaSurveyVerifyViewData {
  survey: {
    assignsite: number;
    complete_survey: number;
    pending_survey: number;
    survey_verify: number;
    survey_verify_pending: number;
    survey_verify_reject: number;
  };
  pending: any[];
  verify: any[];
}

export function normalizeGoaSurveyStatus(status?: string): string {
  if (!status) return '';
  const s = status.toLowerCase().trim().replace(/[\s_]+/g, '-');
  if (s === 'all' || s === 'total' || s === 'total-site') return '';
  if (s === 'assigned' || s === 'site-assigned' || s === 'total-assigned') return 'assigned';
  if (s === 'not-assigned' || s === 'unassigned' || s === 'not_assigned' || s === 'site-not-assigned') return 'not-assigned';
  if (s === 'survey-done' || s === 'done' || s === 'complete' || s === 'completed' || s === 'installed') return 'survey-done';
  if (s === 'survey-pending' || s === 'pending' || s === 'pending-survey') return 'survey-pending';
  if (s === 'verify-pending' || s === 'verification-pending' || s === 'in-audit' || s === 'audit-pending') return 'verify-pending';
  if (s === 'verify-done' || s === 'verify-complete' || s === 'verify-approved' || s === 'approved' || s === 'verified') return 'verify-done';
  if (s === 'verify-reject' || s === 'rejected' || s === 'verify-rejected') return 'verify-reject';
  return s;
}

export interface GoaVendor {
  id: number;
  name: string;
  contact_person?: string;
  phone?: string;
  email?: string;
  inst_vendor?: number;
  vendor?: number;
  [key: string]: any;
}

export interface GoaDistrictItem {
  district: string;
  [key: string]: any;
}

export interface GoaSiteItem {
  id: number;
  site_name: string;
  unique_id?: string;
  state?: string;
  district?: string;
  sanction_load?: number | string;
  inst_deadline?: string;
  [key: string]: any;
}

export interface GoaAssignSiteDetail {
  id: number;
  site_name: string;
  inst_deadline?: string;
  [key: string]: any;
}

export interface GoaAssignRecord {
  id: number;
  vendor: number;
  assign_date: string;
  state: string;
  district: string;
  site_name: string; // JSON string or array repr
  sitecount: number;
  file?: string | null;
  remarks?: string;
  status: number; // 0 = Pending, 1 = Approved
  vendors?: GoaVendor;
  sites?: GoaAssignSiteDetail[];
  [key: string]: any;
}

export interface GoaSrtSiteRow {
  id: number;
  unique_id?: string;
  state?: string;
  district?: string;
  site_name?: string;
  inst_vendor?: number;
  vendor?: string | number | GoaVendor;
  contact_person?: string;
  contact_number?: string;
  solarmeter_no?: string;
  inverter_no?: string;
  nm_sm_no?: string;
  loger_no?: string;
  system_image?: string | null;
  inverter_image?: string | null;
  panel_image?: string | null;
  nm_sm_image?: string | null;
  loger_image?: string | null;
  inst_latitude?: string;
  inst_longitude?: string;
  latitude?: string;
  longitude?: string;
  inst_remarks?: string;
  remarks?: string;
  inst_verify_status?: number; // 0 = Pending, 1 = Approved, 2 = Rejected
  inst_claim_status?: number;  // 0 = Not raised, 1 = Raised, 2 = Approved
  inst_claim_date?: string | null;
  inst_claim_invoice?: string | null;
  inst_claim_amount?: string | number | null;
  inst_claim_update_date?: string | null;
  inst_claim_update_by?: string | null;
  inst_inspection?: number;     // 0 = Pending, 1 = Approved, 2 = Rejected
  inst_doc_submit?: number;     // 0 = Pending, 1 = Submitted, 2 = Approved, 3 = Rejected
  inst_gen_image?: string | null;
  inst_rms_loger_image?: string | null;
  inst_pay1_status?: number;    // 0 = Pending, 1 = Paid
  inst_pay2_status?: number;    // 0 = Pending, 1 = Paid
  inst_pay3_status?: number;    // 0 = Pending, 1 = Paid
  inst_pay3_raised_status?: number; // 0 = Not raised, 1 = Raised, 2 = Approved
  inst_pay1?: number | string | null;
  inst_pay2?: number | string | null;
  inst_pay3?: number | string | null;
  inst_pay1_date?: string | null;
  inst_pay2_date?: string | null;
  inst_pay3_date?: string | null;
  inst_pay1_remark?: string | null;
  inst_pay2_remark?: string | null;
  inst_pay3_remark?: string | null;
  cancel_site?: number;
  volume?: string | number;
  [key: string]: any;
}

export interface GoaInstallationDashboardData {
  vol?: string[];
  srtdatas: {
    site_count: number;
    site_cancel?: number;
    site_assigned: number;
    site_not_assigned: number;
    site_not_accept?: number;
    complete: number;
    pending: number;
    inpection_pending?: number;
    inpection_complete?: number;
    verify_pending: number;
    verify_approved: number;
    verify_reject: number;
    claim_applicable: number;
    claim_raised: number;
    inst_doc_complete?: number;
    inst_doc_pending?: number;
    inst_doc_approve?: number;
    inst_doc_reject?: number;
    inst_pay1?: number;
    inst_pay2?: number;
    inst_pay3?: number;
    inst_pay1_amount?: number;
    inst_pay2_amount?: number;
    inst_pay3_amount?: number;
  };
  vendors: GoaVendor[];
  vendorswise: Array<{
    inst_vendor: number;
    site_count: number;
    inst_complete?: number;
    inst_pending?: number;
    verify_approved?: number;
    inst_pay1?: number;
    inst_pay2?: number;
    inst_pay3?: number;
    [key: string]: any;
  }>;
  districtwise: Array<{
    district: string;
    site_count: number;
    total_assigned?: number;
    inst_complete?: number;
    inst_pending?: number;
    verify_approved?: number;
    verify_pending?: number;
    verify_reject?: number;
    inst_pay1?: number;
    inst_pay2?: number;
    inst_pay3?: number;
    [key: string]: any;
  }>;
  vendor_installation_month: Array<{
    month_year: string;
    monthly_installations: number;
  }>;
  vendor_today_installation?: Array<{
    inst_vendor: number;
    today_install: number;
  }>;
}

export interface GoaViewAssignResponse {
  loginId?: number;
  loginName?: string;
  company_id?: number;
  role?: string;
  state?: string;
  amcsrtRecords: GoaAssignRecord[];
  claimedapplicable: number;
  approvedsite: number;
  verifypending: number;
  rejectsite: number;
  paymentsitecount: number;
  payment1: number;
  payment2: number;
  payment3: number;
  docsubmit: number;
  claimraised: number;
  complete: number;
  totalsite: number;
  cancelsite: number;
  pendingsite: number;
}

export interface GoaViewInstallationResponse {
  claimedapplicable: number;
  approvedsite: number;
  verifypending: number;
  rejectsite: number;
  paymentsitecount: number;
  payment1: number;
  payment2: number;
  payment3: number;
  docsubmit: number;
  claimraised: number;
  complete: number;
  totalsite: number;
  pendingsite: number;
  verification: GoaSrtSiteRow[]; // verify status 0
  verified: GoaSrtSiteRow[];     // verify status != 0
}

export interface GoaViewClaimRow {
  id: number;
  state: string;
  district: string;
  site_name: string;
  inst_claim_date?: string | null;
  inst_claim_invoice?: string | null;
  inst_claim_amount?: string | number | null;
  inst_claim_update_date?: string | null;
  inst_claim_update_by?: string | null;
  inst_claim_status: number;
  inst_pay1_status?: number;
  inst_inspection?: number;
  inst_doc_submit?: number;
  inst_gen_image?: string | null;
  inst_rms_loger_image?: string | null;
  inst_pay2_status?: number;
  inst_pay3_raised_status?: number;
  [key: string]: any;
}

export interface GoaViewPaymentResponse {
  goa_srt_pay_pending1: number;
  goa_srt_pay_pending2: number;
  goa_srt_pay_pending3: number;
  total_payment_pending: number;
  goa_srt_pay_done1: number;
  goa_srt_pay_done2: number;
  goa_srt_pay_done3: number;
  total_payment_done: number;
  vendorid?: number[];
  vendor?: GoaVendor[];
  payments1: GoaSrtSiteRow[];
  payments2: GoaSrtSiteRow[];
  payments3: GoaSrtSiteRow[];
}

/* ── Goa SRT AMC Specific Types ── */
export interface GoaAmcDistrict {
  district: string;
}

export interface GoaAmcVendor {
  id: number;
  name: string;
}

export interface GoaAmcAssignRecord {
  id: number;
  company_id?: number;
  amc: number; // 1 to 5
  site_id: number;
  state?: string;
  site_name: string;
  amc_assigned_to: number; // vendor id
  amc_assigned_time?: string;
  srtdata?: Record<string, any>;
  [key: string]: any;
}

export interface GoaAmcAssignFormData {
  district: GoaAmcDistrict[];
  vendors: GoaAmcVendor[];
  srts: GoaAmcAssignRecord[];
}

export interface GoaAmcSiteOption {
  id: number;
  site_name: string;
  [key: string]: any;
}

export interface GoaAmcStoreAssignPayload {
  vendor: number;
  amc: number | string;
  state: string;
  site_name: number[]; // array of site IDs (goa_srts.id)
}

export interface GoaAmcStoreAssignResponse {
  success: boolean;
  message: string;
  already_assigned_sites?: string[];
  [key: string]: any;
}

export interface GoaAmcViewAssignData {
  district: GoaAmcDistrict[];
  vendors: GoaAmcVendor[];
  assignsite: GoaAmcAssignRecord[];
}

export interface GoaAmcVerifyViewRecord {
  id: number;
  amc: number;
  site_id: number;
  site_name?: string;
  amc_assigned_to?: number;
  amc_assigned_time?: string;
  amc_status?: number; // 0=pending, 1=done
  amcverify_status?: number; // 0=pending, 1=approved, 2=rejected
  amcverifystatus_by?: any;
  srtdata?: Record<string, any>;
  [key: string]: any;
}

export interface GoaAmcVerifyViewData {
  loginId?: number;
  loginName?: string;
  company_id?: number;
  role?: string;
  state?: string;
  user_type?: string;
  assign?: string;
  srt: GoaAmcVerifyViewRecord[]; // AMC done, verify pending
  coms: GoaAmcVerifyViewRecord[]; // verify approved/rejected
}

export interface GoaAmcDashboardData {
  loginId?: number;
  loginName?: string;
  company_id?: number;
  role?: string;
  state?: string;
  goa_srts: {
    site_count: number;
    not_assigned: number;
    amc_assigned: number;
    amc_complete: number;
    amc_pending: number;
  };
  vendors: Array<{
    amc_assigned_to: string | number;
    site_count: number;
    amc_complete: number;
    amc_pending: number;
  }>;
  districts: Array<{
    district: string;
    site_count: number;
    total_assigned: number;
    amc_complete: number;
    amc_pending: number;
  }>;
  today: {
    today_complete: number;
  };
  vendorwisetoday: Array<{
    amc_assigned_to: string | number;
    amc_complete: number;
  }>;
  districtwisetoday: Array<{
    district: string;
    amc_complete: number;
  }>;
}

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * GoaAdminService: Complete API client implementation for Goa State
 * ═══════════════════════════════════════════════════════════════════════════
 */
class GoaAdminService {
  private getHeaders(): Record<string, string> {
    let token = '';
    try {
      if (typeof authService !== 'undefined') {
        token = authService.getToken?.() || authService.getAuthToken?.() || '';
      }
    } catch {
      // fallback
    }
    if (!token && typeof localStorage !== 'undefined') {
      token =
        localStorage.getItem('klk_auth_token') ||
        localStorage.getItem('token') ||
        localStorage.getItem('access_token') ||
        '';
    }
    return {
      Accept: 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  }

  /**
   * Resilient HTTP request helper:
   * Handles bearer auth, FormData vs JSON, Laravel route prefixes, and 405/422 responses.
   */
  private async request<T = any>(
    endpointOrCandidates: string | string[],
    options: RequestInit = {}
  ): Promise<T> {
    const baseHeaders = this.getHeaders();
    const isFormData = options.body instanceof FormData;

    const headers: Record<string, string> = isFormData
      ? { ...baseHeaders, ...((options.headers as Record<string, string>) || {}) }
      : {
          ...baseHeaders,
          'Content-Type': 'application/json',
          ...((options.headers as Record<string, string>) || {}),
        };

    const candidateList: string[] = [];
    const inputs = Array.isArray(endpointOrCandidates) ? endpointOrCandidates : [endpointOrCandidates];
    for (const item of inputs) {
      buildCandidateUrls(item).forEach((u) => candidateList.push(u));
    }

    let lastError: any = null;

    for (const url of Array.from(new Set(candidateList))) {
      try {
        const response = await fetch(url, {
          credentials: 'include',
          ...options,
          headers,
        });

        const contentType = response.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          const json = await response.json();
          if (response.ok) {
            return json;
          }
          if (response.status === 422) {
            const err: any = new Error(json.message || 'Validation error');
            err.errors = json.errors;
            err.status = 422;
            throw err;
          }
          if (response.status === 404 || response.status === 405) {
            lastError = new Error(json.message || `HTTP ${response.status}`);
            continue; // try next candidate URL
          }
          throw new Error(json.message || json.error || `HTTP ${response.status}`);
        }

        // If backend returned HTML (e.g. 404 page or redirect), try next variation
        if (!response.ok) {
          lastError = new Error(`Request returned status ${response.status}`);
          continue;
        }

        // If text response but ok
        const text = await response.text();
        try {
          return JSON.parse(text);
        } catch {
          return { success: true, raw: text } as any;
        }
      } catch (err: any) {
        lastError = err;
        if (err?.status === 422) throw err; // Don't retry validation errors
      }
    }

    throw lastError || new Error(`Network request failed for ${inputs[0]}`);
  }

  /* ──────────────────────────────────────────────────────────
   * 1. Vendor List
   * GET /goa/srt/installation/assign
   * ────────────────────────────────────────────────────────── */
  async getVendors(): Promise<GoaVendor[]> {
    const res = await this.request(GOA_ADMIN_SRT_API.VENDOR_LIST_CANDIDATES(), { method: 'GET' });
    if (Array.isArray(res?.data)) return res.data;
    if (Array.isArray(res?.vendors)) return res.vendors;
    if (Array.isArray(res?.vendor)) return res.vendor;
    if (Array.isArray(res)) return res;
    return [];
  }

  /* ──────────────────────────────────────────────────────────
   * 2. Fetch Districts
   * GET /goa/srt/installation/fetch-district
   * ────────────────────────────────────────────────────────── */
  async getDistricts(state = 'Goa'): Promise<GoaDistrictItem[]> {
    const res = await this.request(GOA_ADMIN_SRT_API.FETCH_DISTRICTS_CANDIDATES(state), { method: 'GET' });
    if (Array.isArray(res?.districts)) return res.districts;
    if (Array.isArray(res?.district)) return res.district;
    if (Array.isArray(res?.data)) return res.data;
    if (Array.isArray(res)) return res;
    return [];
  }

  /* ──────────────────────────────────────────────────────────
   * 3. Fetch Sites (unassigned, non-cancelled)
   * GET /goa/srt/installation/fetch-site
   * ────────────────────────────────────────────────────────── */
  async getSites(state = 'Goa', district = ''): Promise<GoaSiteItem[]> {
    const res = await this.request(GOA_ADMIN_SRT_API.FETCH_SITES_CANDIDATES(state, district), { method: 'GET' });
    if (Array.isArray(res?.sites)) return res.sites;
    if (Array.isArray(res?.site)) return res.site;
    if (Array.isArray(res?.data)) return res.data;
    if (Array.isArray(res)) return res;
    return [];
  }

  /* ──────────────────────────────────────────────────────────
   * 4. Store Assign
   * POST /goa/srt/installation/store-assign (multipart/form-data)
   * ────────────────────────────────────────────────────────── */
  async storeAssign(formData: FormData): Promise<{ success: boolean; message: string }> {
    return this.request(GOA_ADMIN_SRT_API.STORE_ASSIGN_CANDIDATES(), {
      method: 'POST',
      body: formData,
    });
  }

  /* ──────────────────────────────────────────────────────────
   * 5. View Assign
   * GET /goa/srt/installation/view-assign
   * ────────────────────────────────────────────────────────── */
  async getViewAssign(): Promise<GoaViewAssignResponse> {
    const res = await this.request(GOA_ADMIN_SRT_API.VIEW_ASSIGN_CANDIDATES(), { method: 'GET' });
    const payload = res?.data && typeof res.data === 'object' && !Array.isArray(res.data) ? { ...res, ...res.data } : res;
    return {
      amcsrtRecords: Array.isArray(payload?.amcsrtRecords) ? payload.amcsrtRecords : (Array.isArray(payload?.data) ? payload.data : []),
      claimedapplicable: Number(payload?.claimedapplicable ?? 0),
      approvedsite: Number(payload?.approvedsite ?? 0),
      verifypending: Number(payload?.verifypending ?? 0),
      rejectsite: Number(payload?.rejectsite ?? 0),
      paymentsitecount: Number(payload?.paymentsitecount ?? 0),
      payment1: Number(payload?.payment1 ?? 0),
      payment2: Number(payload?.payment2 ?? 0),
      payment3: Number(payload?.payment3 ?? 0),
      docsubmit: Number(payload?.docsubmit ?? 0),
      claimraised: Number(payload?.claimraised ?? 0),
      complete: Number(payload?.complete ?? 0),
      totalsite: Number(payload?.totalsite ?? 0),
      cancelsite: Number(payload?.cancelsite ?? 0),
      pendingsite: Number(payload?.pendingsite ?? 0),
    };
  }

  /* ──────────────────────────────────────────────────────────
   * 6. Assign View Details (vendor-wise)
   * GET /goa/srt/installation/view-details/{id}
   * ────────────────────────────────────────────────────────── */
  async getViewDetails(vendorId: number | string): Promise<any> {
    const res = await this.request(GOA_ADMIN_SRT_API.VIEW_DETAILS_CANDIDATES(vendorId), { method: 'GET' });
    return res?.data || res;
  }

  /* ──────────────────────────────────────────────────────────
   * 7. Approve Assignment
   * ANY /goa/srt/installation/approval-assign/{id}
   * ────────────────────────────────────────────────────────── */
  async approveAssign(id: number | string): Promise<{ status: boolean; message: string }> {
    return this.request(GOA_ADMIN_SRT_API.APPROVE_ASSIGN_CANDIDATES(id), { method: 'POST' });
  }

  /* ──────────────────────────────────────────────────────────
   * 8. Edit Assign (fetch data)
   * GET /goa/srt/installation/edit-assign/{id}
   * ────────────────────────────────────────────────────────── */
  async getEditAssign(id: number | string): Promise<any> {
    const res = await this.request(GOA_ADMIN_SRT_API.EDIT_ASSIGN_CANDIDATES(id), { method: 'GET' });
    return res?.data || res;
  }

  /* ──────────────────────────────────────────────────────────
   * 9. Update Assign
   * ANY /goa/srt/installation/update-assign/{id} (multipart/form-data)
   * ────────────────────────────────────────────────────────── */
  async updateAssign(id: number | string, formData: FormData): Promise<{ success: boolean; message: string }> {
    return this.request(GOA_ADMIN_SRT_API.UPDATE_ASSIGN_CANDIDATES(id), {
      method: 'POST',
      body: formData,
    });
  }

  /* ──────────────────────────────────────────────────────────
   * 10. View Installation
   * GET /goa/srt/installation/view-installation
   * ────────────────────────────────────────────────────────── */
  async getViewInstallation(): Promise<GoaViewInstallationResponse> {
    const res = await this.request(GOA_ADMIN_SRT_API.VIEW_INSTALLATION_CANDIDATES(), { method: 'GET' });
    const payload = res?.data || res;
    return {
      claimedapplicable: Number(payload?.claimedapplicable ?? 0),
      approvedsite: Number(payload?.approvedsite ?? 0),
      verifypending: Number(payload?.verifypending ?? 0),
      rejectsite: Number(payload?.rejectsite ?? 0),
      paymentsitecount: Number(payload?.paymentsitecount ?? 0),
      payment1: Number(payload?.payment1 ?? 0),
      payment2: Number(payload?.payment2 ?? 0),
      payment3: Number(payload?.payment3 ?? 0),
      docsubmit: Number(payload?.docsubmit ?? 0),
      claimraised: Number(payload?.claimraised ?? 0),
      complete: Number(payload?.complete ?? 0),
      totalsite: Number(payload?.totalsite ?? 0),
      pendingsite: Number(payload?.pendingsite ?? 0),
      verification: Array.isArray(payload?.verification) ? payload.verification : [],
      verified: Array.isArray(payload?.verified) ? payload.verified : [],
    };
  }

  /* ──────────────────────────────────────────────────────────
   * 11. Verify Installation Status
   * ANY /goa/srt/installation/verify-installation-status (id, status: 1 or 2)
   * ────────────────────────────────────────────────────────── */
  async verifyInstallationStatus(id: number, status: 1 | 2): Promise<{ success: boolean; message: string }> {
    return this.request(GOA_ADMIN_SRT_API.VERIFY_INSTALLATION_STATUS_CANDIDATES(), {
      method: 'POST',
      body: JSON.stringify({ id, status }),
    });
  }

  /* ──────────────────────────────────────────────────────────
   * 12. View Claim
   * GET /goa/srt/installation/view-claim
   * ────────────────────────────────────────────────────────── */
  async getViewClaim(): Promise<GoaViewClaimRow[]> {
    const res = await this.request(GOA_ADMIN_SRT_API.VIEW_CLAIM_CANDIDATES(), { method: 'GET' });
    if (Array.isArray(res?.data)) return res.data;
    if (Array.isArray(res)) return res;
    return [];
  }

  /* ──────────────────────────────────────────────────────────
   * 13. Update Claim Status
   * ANY /goa/srt/installation/update-claim-status (id, status: 1 or 2)
   * ────────────────────────────────────────────────────────── */
  async updateClaimStatus(id: number, status: 1 | 2): Promise<{ success: boolean; message: string }> {
    return this.request(GOA_ADMIN_SRT_API.UPDATE_CLAIM_STATUS_CANDIDATES(), {
      method: 'POST',
      body: JSON.stringify({ id, status }),
    });
  }

  /* ──────────────────────────────────────────────────────────
   * 14. Verify Document Submit
   * ANY /goa/srt/srt/installation/verify-document-submit (id, status: 2 or 3)
   * ────────────────────────────────────────────────────────── */
  async verifyDocumentSubmit(id: number, status: 2 | 3): Promise<{ success: boolean; message: string }> {
    return this.request(GOA_ADMIN_SRT_API.VERIFY_DOCUMENT_SUBMIT_CANDIDATES(), {
      method: 'POST',
      body: JSON.stringify({ id, status }),
    });
  }

  /* ──────────────────────────────────────────────────────────
   * 15. Inspection Update Status
   * ANY /goa/srt/installation/inspection-update-status (id, status: 1 or 2)
   * ────────────────────────────────────────────────────────── */
  async updateInspectionStatus(id: number, status: 1 | 2): Promise<{ success: boolean; message: string }> {
    return this.request(GOA_ADMIN_SRT_API.INSPECTION_UPDATE_STATUS_CANDIDATES(), {
      method: 'POST',
      body: JSON.stringify({ id, status }),
    });
  }

  /* ──────────────────────────────────────────────────────────
   * 16. View Data (Master Records)
   * GET /goa/srt/installation/view-data
   * ────────────────────────────────────────────────────────── */
  async getViewData(): Promise<GoaSrtSiteRow[]> {
    const res = await this.request(GOA_ADMIN_SRT_API.VIEW_DATA_CANDIDATES(), { method: 'GET' });
    const payload = res?.data || res;
    if (Array.isArray(payload?.totalsite)) return payload.totalsite;
    if (Array.isArray(payload)) return payload;
    return [];
  }

  /* ──────────────────────────────────────────────────────────
   * 17. Verify Pay 3
   * ANY /goa/srt/installation/verify-pay3 (id, status: 1 or 2)
   * ────────────────────────────────────────────────────────── */
  async verifyPay3(id: number, status: 1 | 2): Promise<{ success: boolean; message: string }> {
    return this.request(GOA_ADMIN_SRT_API.VERIFY_PAY3_CANDIDATES(), {
      method: 'POST',
      body: JSON.stringify({ id, status }),
    });
  }

  /* ──────────────────────────────────────────────────────────
   * 18. View Payment
   * ANY /goa/srt/installation/view-payment
   * ────────────────────────────────────────────────────────── */
  async getViewPayment(params?: {
    from_date?: string;
    to_date?: string;
    vendor?: number | string;
  }): Promise<GoaViewPaymentResponse> {
    const res = await this.request(GOA_ADMIN_SRT_API.VIEW_PAYMENT_CANDIDATES(params), { method: 'GET' });
    const payload = res?.data || res;
    return {
      goa_srt_pay_pending1: Number(payload?.goa_srt_pay_pending1 ?? 0),
      goa_srt_pay_pending2: Number(payload?.goa_srt_pay_pending2 ?? 0),
      goa_srt_pay_pending3: Number(payload?.goa_srt_pay_pending3 ?? 0),
      total_payment_pending: Number(payload?.total_payment_pending ?? 0),
      goa_srt_pay_done1: Number(payload?.goa_srt_pay_done1 ?? 0),
      goa_srt_pay_done2: Number(payload?.goa_srt_pay_done2 ?? 0),
      goa_srt_pay_done3: Number(payload?.goa_srt_pay_done3 ?? 0),
      total_payment_done: Number(payload?.total_payment_done ?? 0),
      vendorid: Array.isArray(payload?.vendorid) ? payload.vendorid : [],
      vendor: Array.isArray(payload?.vendor) ? payload.vendor : [],
      payments1: Array.isArray(payload?.payments1) ? payload.payments1 : [],
      payments2: Array.isArray(payload?.payments2) ? payload.payments2 : [],
      payments3: Array.isArray(payload?.payments3) ? payload.payments3 : [],
    };
  }

  /* ──────────────────────────────────────────────────────────
   * 19. Update Payment
   * ANY /goa/srt/installation/update-payment
   * ────────────────────────────────────────────────────────── */
  async updatePayment(payload: {
    pay1_id?: number;
    pay2_id?: number;
    pay3_id?: number;
    inst_pay1?: number;
    inst_pay2?: number;
    inst_pay3?: number;
    inst_pay1_date?: string;
    inst_pay2_date?: string;
    inst_pay3_date?: string;
    inst_pay1_remark?: string;
    inst_pay2_remark?: string;
    inst_pay3_remark?: string;
  }): Promise<{ status: boolean; message: string }> {
    return this.request(GOA_ADMIN_SRT_API.UPDATE_PAYMENT_CANDIDATES(), {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  /* ──────────────────────────────────────────────────────────
   * 20. Payment Filter
   * GET /goa/srt/installation/payment-filter
   * ────────────────────────────────────────────────────────── */
  async getPaymentFilter(params?: {
    from_date?: string;
    to_date?: string;
    vendor?: number | string;
  }): Promise<any> {
    const res = await this.request(GOA_ADMIN_SRT_API.PAYMENT_FILTER_CANDIDATES(params), { method: 'GET' });
    return res?.data || res;
  }

  /* ──────────────────────────────────────────────────────────
   * 21. Dashboard Data
   * ANY /goa/srt/installation/dashboard
   * ────────────────────────────────────────────────────────── */
  async getInstallationDashboard(volume?: string): Promise<GoaInstallationDashboardData> {
    const res = await this.request(GOA_ADMIN_SRT_API.DASHBOARD_CANDIDATES(volume), { method: 'GET' });
    const payload = res?.data || res;
    return {
      vol: Array.isArray(payload?.vol) ? payload.vol : [],
      srtdatas: payload?.srtdatas || {
        site_count: 0,
        site_assigned: 0,
        site_not_assigned: 0,
        complete: 0,
        pending: 0,
        verify_pending: 0,
        verify_approved: 0,
        verify_reject: 0,
        claim_applicable: 0,
        claim_raised: 0,
      },
      vendors: Array.isArray(payload?.vendors) ? payload.vendors : [],
      vendorswise: Array.isArray(payload?.vendorswise) ? payload.vendorswise : [],
      districtwise: Array.isArray(payload?.districtwise) ? payload.districtwise : [],
      vendor_installation_month: Array.isArray(payload?.vendor_installation_month)
        ? payload.vendor_installation_month
        : [],
      vendor_today_installation: Array.isArray(payload?.vendor_today_installation)
        ? payload.vendor_today_installation
        : [],
    };
  }

  /* ──────────────────────────────────────────────────────────
   * 22. View Dashboard Data (drill-down)
   * GET /goa/srt/installation/view-dashboard-data/{status}/{volume?}
   * ────────────────────────────────────────────────────────── */
  async getDashboardViewData(status: string, volume?: string): Promise<GoaSrtSiteRow[]> {
    const norm = normalizeGoaDashboardStatus(status);
    try {
      const res = await this.request(GOA_ADMIN_SRT_API.VIEW_DASHBOARD_DATA_CANDIDATES(norm, volume), { method: 'GET' });
      const payload = res?.data || res;
      if (Array.isArray(payload?.totalsite)) return payload.totalsite;
      if (Array.isArray(payload)) return payload;
    } catch {}

    // Fallback for master records if viewing all allocated sites
    if (norm === 'total-srt-sites' || norm === 'all' || norm === 'total') {
      try {
        const master = await this.getViewData();
        if (Array.isArray(master) && master.length > 0) {
          return master;
        }
      } catch {}
    }

    return [];
  }

  /* ──────────────────────────────────────────────────────────
   * 23. Vendor-wise Data
   * GET /goa/srt/installation/vendorwise-data/{status}/{volume?}/{vendor}
   * ────────────────────────────────────────────────────────── */
  async getVendorWiseData(status: string, vendor: number | string, volume?: string): Promise<GoaSrtSiteRow[]> {
    const norm = normalizeGoaDashboardStatus(status);
    try {
      const res = await this.request(GOA_ADMIN_SRT_API.VENDORWISE_DATA_CANDIDATES(norm, vendor, volume), { method: 'GET' });
      const payload = res?.data || res;
      if (Array.isArray(payload?.totalsite)) return payload.totalsite;
      if (Array.isArray(payload)) return payload;
    } catch {}
    return [];
  }

  /* ──────────────────────────────────────────────────────────
   * 24. District-wise Data
   * GET /goa/srt/installation/districtwise-data/{status}/{volume?}/{district}
   * ────────────────────────────────────────────────────────── */
  async getDistrictWiseData(status: string, district: string, volume?: string): Promise<GoaSrtSiteRow[]> {
    const norm = normalizeGoaDashboardStatus(status);
    try {
      const res = await this.request(GOA_ADMIN_SRT_API.DISTRICTWISE_DATA_CANDIDATES(norm, district, volume), { method: 'GET' });
      const payload = res?.data || res;
      if (Array.isArray(payload?.totalsite)) return payload.totalsite;
      if (Array.isArray(payload)) return payload;
    } catch {}
    return [];
  }

  /* ──────────────────────────────────────────────────────────
   * GOA SRT SURVEY APIS (10 ROUTES)
   * Controller: App\Http\Controllers\admin\goa\GoaSrtSurveyController
   * ────────────────────────────────────────────────────────── */

  /**
   * 1. Survey Assign (form data)
   * GET /goa/srt/survey/assign – Params: none
   * Returns: { vendor: [{ id, name }], districts: [{ district }] }
   */
  async getSurveyAssignFormData(): Promise<GoaSurveyAssignFormData> {
    const res = await this.request(GOA_ADMIN_SURVEY_API.ASSIGN_CANDIDATES(), { method: 'GET' });
    const payload = res?.data || res;
    return {
      vendor: Array.isArray(payload?.vendor) ? payload.vendor : (Array.isArray(payload?.vendors) ? payload.vendors : []),
      districts: Array.isArray(payload?.districts) ? payload.districts : (Array.isArray(payload?.district) ? payload.district : []),
    };
  }

  /**
   * 2. Fetch Sites
   * GET /goa/srt/survey/fetch-site?district={district}
   * Returns only sites with survey_status = 0 and no assigned vendor
   */
  async getSurveyFetchSites(district: string): Promise<GoaSurveyFetchSiteItem[]> {
    const res = await this.request(GOA_ADMIN_SURVEY_API.FETCH_SITES_CANDIDATES(district), { method: 'GET' });
    const payload = res?.data || res;
    if (Array.isArray(payload?.sites)) return payload.sites;
    if (Array.isArray(payload?.data)) return payload.data;
    if (Array.isArray(payload)) return payload;
    return [];
  }

  /**
   * 3. Survey Assign Store
   * POST /goa/srt/survey/assign-store (multipart/form-data)
   * Params: vendor, state, district, site (array of site ids), file (optional), remarks (optional)
   */
  async storeSurveyAssign(formData: FormData): Promise<{ success: boolean; message: string }> {
    return this.request(GOA_ADMIN_SURVEY_API.ASSIGN_STORE_CANDIDATES(), {
      method: 'POST',
      body: formData,
    });
  }

  /**
   * 4. Survey Assign View
   * GET /goa/srt/survey/assign-view
   * Returns: { loginId, loginName, company_id, role, state, srtRecords: [...], survey: { totalsite, assignsite, not_assign, complete_survey, pending_survey } }
   */
  async getSurveyAssignView(): Promise<GoaSurveyAssignViewData> {
    const res = await this.request(GOA_ADMIN_SURVEY_API.ASSIGN_VIEW_CANDIDATES(), { method: 'GET' });
    const payload = res?.data || res;
    const srtRecords = Array.isArray(payload?.srtRecords)
      ? payload.srtRecords
      : Array.isArray(payload?.data)
      ? payload.data
      : Array.isArray(payload)
      ? payload
      : [];

    const surveyStats = payload?.survey || {};
    return {
      loginId: payload?.loginId,
      loginName: payload?.loginName,
      company_id: payload?.company_id,
      role: payload?.role,
      state: payload?.state || 'goa',
      srtRecords,
      survey: {
        totalsite: Number(surveyStats?.totalsite ?? 0),
        assignsite: Number(surveyStats?.assignsite ?? 0),
        not_assign: Number(surveyStats?.not_assign ?? 0),
        complete_survey: Number(surveyStats?.complete_survey ?? 0),
        pending_survey: Number(surveyStats?.pending_survey ?? 0),
      },
    };
  }

  /**
   * 5. View Assign Survey (verification list)
   * GET /goa/srt/survey/view-assign-survey
   * Returns: { survey: { assignsite, complete_survey, pending_survey, survey_verify, survey_verify_pending, survey_verify_reject }, pending: [...], verify: [...] }
   */
  async getViewAssignSurvey(): Promise<GoaSurveyVerifyViewData> {
    const res = await this.request(GOA_ADMIN_SURVEY_API.VIEW_ASSIGN_SURVEY_CANDIDATES(), { method: 'GET' });
    const payload = res?.data || res;
    const surveyStats = payload?.survey || {};
    return {
      survey: {
        assignsite: Number(surveyStats?.assignsite ?? 0),
        complete_survey: Number(surveyStats?.complete_survey ?? 0),
        pending_survey: Number(surveyStats?.pending_survey ?? 0),
        survey_verify: Number(surveyStats?.survey_verify ?? 0),
        survey_verify_pending: Number(surveyStats?.survey_verify_pending ?? 0),
        survey_verify_reject: Number(surveyStats?.survey_verify_reject ?? 0),
      },
      pending: Array.isArray(payload?.pending) ? payload.pending : [],
      verify: Array.isArray(payload?.verify) ? payload.verify : [],
    };
  }

  /**
   * 6. Survey Verify Status
   * POST /goa/srt/survey/survey-verify-status
   * Params: id (integer, Yes), status (integer: 1=Approve, 2=Reject, 0=Pending), remarks (string, No)
   */
  async updateSurveyVerifyStatus(
    id: number,
    status: number,
    remarks?: string
  ): Promise<{ success: boolean; message: string }> {
    return this.request(GOA_ADMIN_SURVEY_API.SURVEY_VERIFY_STATUS_CANDIDATES(), {
      method: 'POST',
      body: JSON.stringify({
        id,
        status,
        ...(remarks ? { remarks } : {}),
      }),
    });
  }

  // Alias for backward compatibility
  async verifySurveyStatus(id: number, status: number, remarks?: string): Promise<any> {
    return this.updateSurveyVerifyStatus(id, status, remarks);
  }

  /**
   * 7. Survey Dashboard
   * GET /goa/srt/survey/dashboard
   * Returns: { survey_detail: {...}, districtwise: [...], vendorwises: [...] }
   */
  async getSurveyDashboard(): Promise<GoaSurveyDashboardData> {
    const res = await this.request(GOA_ADMIN_SURVEY_API.DASHBOARD_CANDIDATES(), { method: 'GET' });
    const payload = res?.data || res;
    const detail = payload?.survey_detail || payload?.survey || {};
    return {
      survey_detail: {
        total: Number(detail?.total ?? detail?.totalsite ?? 0),
        assigned: Number(detail?.assigned ?? detail?.assignsite ?? 0),
        not_assigned: Number(detail?.not_assigned ?? detail?.not_assign ?? 0),
        survey_done: Number(detail?.survey_done ?? detail?.complete_survey ?? 0),
        survey_pending: Number(detail?.survey_pending ?? detail?.pending_survey ?? 0),
        survey_verify_pending: Number(detail?.survey_verify_pending ?? 0),
        survey_verify_complete: Number(detail?.survey_verify_complete ?? detail?.survey_verify ?? 0),
        survey_verify_reject: Number(detail?.survey_verify_reject ?? 0),
      },
      districtwise: Array.isArray(payload?.districtwise) ? payload.districtwise : [],
      vendorwises: Array.isArray(payload?.vendorwises)
        ? payload.vendorwises
        : Array.isArray(payload?.vendorswise)
        ? payload.vendorswise
        : [],
    };
  }

  /**
   * 8. View Dashboard (drill-down)
   * GET /goa/srt/survey/view-dashboard/{status?}
   * Supported status: assigned, not-assigned, survey-done, survey-pending, verify-pending, verify-done, verify-reject (or all)
   */
  async getSurveyViewDashboard(status?: string): Promise<any[]> {
    const norm = normalizeGoaSurveyStatus(status);
    const res = await this.request(GOA_ADMIN_SURVEY_API.VIEW_DASHBOARD_CANDIDATES(norm), { method: 'GET' });
    const payload = res?.data || res;
    if (Array.isArray(payload?.surveys)) return payload.surveys;
    if (Array.isArray(payload?.data)) return payload.data;
    if (Array.isArray(payload?.totalsite)) return payload.totalsite;
    if (Array.isArray(payload)) return payload;
    return [];
  }

  // Alias for backward compatibility
  async getSurveyDrilldown(status: string): Promise<any[]> {
    return this.getSurveyViewDashboard(status);
  }

  // Alias for backward compatibility
  async getSurveyViewData(): Promise<any[]> {
    return this.getSurveyViewDashboard('');
  }

  /**
   * 9. Vendor-wise Dashboard Drill-Down
   * GET /goa/srt/survey/vendorwise-dashboard/{status}/{vendor} – {vendor} = survey_vendor id
   */
  async getSurveyVendorwiseDashboard(status: string, vendor: number | string): Promise<any[]> {
    const norm = normalizeGoaSurveyStatus(status) || 'assigned';
    const res = await this.request(GOA_ADMIN_SURVEY_API.VENDORWISE_DASHBOARD_CANDIDATES(norm, vendor), { method: 'GET' });
    const payload = res?.data || res;
    if (Array.isArray(payload?.surveys)) return payload.surveys;
    if (Array.isArray(payload?.data)) return payload.data;
    if (Array.isArray(payload?.totalsite)) return payload.totalsite;
    if (Array.isArray(payload)) return payload;
    return [];
  }

  /**
   * 10. District-wise Dashboard Drill-Down
   * GET /goa/srt/survey/districtwise-dashboard/{status}/{district} – {district} = district name
   */
  async getSurveyDistrictwiseDashboard(status: string, district: string): Promise<any[]> {
    const norm = normalizeGoaSurveyStatus(status) || 'assigned';
    const res = await this.request(GOA_ADMIN_SURVEY_API.DISTRICTWISE_DASHBOARD_CANDIDATES(norm, district), { method: 'GET' });
    const payload = res?.data || res;
    if (Array.isArray(payload?.surveys)) return payload.surveys;
    if (Array.isArray(payload?.data)) return payload.data;
    if (Array.isArray(payload?.totalsite)) return payload.totalsite;
    if (Array.isArray(payload)) return payload;
    return [];
  }

  /* ──────────────────────────────────────────────────────────
   * AMC Methods (App\Http\Controllers\admin\goa\GoaSrtAmcController)
   * ────────────────────────────────────────────────────────── */

  /**
   * 1. AMC Assign (form data)
   * GET /goa/srt/amc/assign - Params: none
   * Returns: { district, vendors, srts }
   */
  async getAMCAssignFormData(): Promise<GoaAmcAssignFormData> {
    try {
      const res = await this.request(GOA_ADMIN_AMC_API.ASSIGN_CANDIDATES(), { method: 'GET' });
      const data = res?.data || res || {};
      const rawDist = Array.isArray(data?.district) ? data.district : [];
      return {
        district: rawDist.length > 0 ? rawDist : [{ district: 'North Goa' }, { district: 'South Goa' }],
        vendors: Array.isArray(data?.vendors) ? data.vendors : [],
        srts: Array.isArray(data?.srts) ? data.srts : [],
      };
    } catch (err: any) {
      console.warn('Goa AMC assign form data API endpoint unreachable or 404:', err?.message || err);
      return {
        district: [{ district: 'North Goa' }, { district: 'South Goa' }],
        vendors: [],
        srts: [],
      };
    }
  }

  /**
   * 2. Get Site Name
   * GET /goa/srt/amc/get-site-name?district={district}&amc={amc}
   * Returns only sites where amc_Nth_2 flag is NO
   */
  async getAMCSiteNames(district: string, amc: number | string): Promise<GoaAmcSiteOption[]> {
    const res = await this.request(GOA_ADMIN_AMC_API.GET_SITE_NAME_CANDIDATES(district, amc), { method: 'GET' });
    const data = res?.data || res || [];
    return Array.isArray(data) ? data : [];
  }

  /**
   * 3. Store Assign
   * POST /goa/srt/amc/store-assign
   * Param: vendor (int), amc (1-5), state (string), site_name (array of site IDs)
   */
  async storeAMCAssign(payload: GoaAmcStoreAssignPayload | FormData): Promise<GoaAmcStoreAssignResponse> {
    const isFormData = payload instanceof FormData;
    const body = isFormData ? payload : JSON.stringify(payload);
    return this.request(GOA_ADMIN_AMC_API.STORE_ASSIGN_CANDIDATES(), {
      method: 'POST',
      body,
    });
  }

  /**
   * 4. View Assign
   * GET /goa/srt/amc/view-assign
   * Returns: { district, vendors, assignsite }
   */
  async getAMCViewAssign(): Promise<GoaAmcViewAssignData> {
    const res = await this.request(GOA_ADMIN_AMC_API.VIEW_ASSIGN_CANDIDATES(), { method: 'GET' });
    const data = res?.data || res || {};
    const rawDist = Array.isArray(data?.district) ? data.district : [];
    return {
      district: rawDist.length > 0 ? rawDist : [{ district: 'North Goa' }, { district: 'South Goa' }],
      vendors: Array.isArray(data?.vendors) ? data.vendors : [],
      assignsite: Array.isArray(data?.assignsite) ? data.assignsite : (Array.isArray(data?.data) ? data.data : []),
    };
  }

  /**
   * 5. Verify View AMC
   * GET /goa/srt/amc/verify-view-amc
   * Returns: { loginId, loginName, srt, coms }
   * srt: AMC done, verify pending
   * coms: verify approved / rejected
   */
  async getAMCVerifyView(): Promise<GoaAmcVerifyViewData> {
    const res = await this.request(GOA_ADMIN_AMC_API.VERIFY_VIEW_CANDIDATES(), { method: 'GET' });
    const data = res?.data || res || {};
    return {
      loginId: data?.loginId,
      loginName: data?.loginName,
      company_id: data?.company_id,
      role: data?.role,
      state: data?.state,
      user_type: data?.user_type,
      assign: data?.assign,
      srt: Array.isArray(data?.srt) ? data.srt : [],
      coms: Array.isArray(data?.coms) ? data.coms : [],
    };
  }

  /**
   * 6. Verify AMC Status
   * POST /goa/srt/amc/verify-amc-status
   * Param: id (int), status (0=Pending, 1=Approve, 2=Reject)
   */
  async verifyAMCStatus(id: number, status: number): Promise<any> {
    return this.request(GOA_ADMIN_AMC_API.VERIFY_STATUS_CANDIDATES(), {
      method: 'POST',
      body: JSON.stringify({ id, status }),
    });
  }

  /**
   * 7. Dashboard
   * GET /goa/srt/amc/dashboard
   */
  async getAMCDashboard(): Promise<GoaAmcDashboardData> {
    const res = await this.request(GOA_ADMIN_AMC_API.DASHBOARD_CANDIDATES(), { method: 'GET' });
    const data = res?.data || res || {};
    return {
      loginId: data?.loginId,
      loginName: data?.loginName,
      company_id: data?.company_id,
      role: data?.role,
      state: data?.state,
      goa_srts: data?.goa_srts || {
        site_count: 0,
        not_assigned: 0,
        amc_assigned: 0,
        amc_complete: 0,
        amc_pending: 0,
      },
      vendors: Array.isArray(data?.vendors) ? data.vendors : [],
      districts: Array.isArray(data?.districts) && data.districts.length > 0
        ? data.districts
        : [
            { district: 'North Goa', site_count: 0, total_assigned: 0, amc_complete: 0, amc_pending: 0 },
            { district: 'South Goa', site_count: 0, total_assigned: 0, amc_complete: 0, amc_pending: 0 },
          ],
      today: data?.today || { today_complete: 0 },
      vendorwisetoday: Array.isArray(data?.vendorwisetoday) ? data.vendorwisetoday : [],
      districtwisetoday: Array.isArray(data?.districtwisetoday) ? data.districtwisetoday : [],
    };
  }

  async getAmcDashboard(): Promise<GoaAmcDashboardData> {
    return this.getAMCDashboard();
  }

  // Backwards compatibility / Drilldown
  async getAMCViewData(): Promise<any[]> {
    try {
      const res = await this.getAMCVerifyView();
      return [...(res.srt || []), ...(res.coms || [])];
    } catch {
      const res = await this.request(GOA_ADMIN_AMC_API.VIEW_DATA_CANDIDATES(), { method: 'GET' });
      const payload = res?.data || res;
      if (Array.isArray(payload?.totalsite)) return payload.totalsite;
      if (Array.isArray(payload)) return payload;
      return [];
    }
  }

  async getAMCDrilldown(status: string): Promise<any[]> {
    try {
      const res = await this.request(GOA_ADMIN_AMC_API.DRILLDOWN_CANDIDATES(status), { method: 'GET' });
      const payload = res?.data || res;
      if (Array.isArray(payload?.totalsite)) return payload.totalsite;
      if (Array.isArray(payload?.data)) return payload.data;
      if (Array.isArray(payload)) return payload;
    } catch {
      // Fallback: derive drilldown from verify view or view-assign
    }

    try {
      const verifyData = await this.getAMCVerifyView();
      const allVerify = [
        ...(verifyData.srt || []).map((x) => ({ ...x, visit_done: true, verify_status: x.amcverify_status ?? 0 })),
        ...(verifyData.coms || []).map((x) => ({ ...x, visit_done: true, verify_status: x.amcverify_status ?? 1 })),
      ];

      const s = (status || '').toLowerCase().replace(/[\s_]+/g, '-');
      if (s === 'complete' || s === 'completed') return allVerify.filter((x) => Number(x.amc_status) === 1 || x.visit_done);
      if (s === 'pending') return allVerify.filter((x) => Number(x.amc_status) === 0);
      if (s === 'verify-approved' || s === 'approved') return allVerify.filter((x) => Number(x.verify_status) === 1);
      if (s === 'verify-pending') return allVerify.filter((x) => Number(x.verify_status) === 0);
      if (s === 'verify-reject' || s === 'rejected') return allVerify.filter((x) => Number(x.verify_status) === 2);
      if (s === 'total-site' || s === 'all') return allVerify;
    } catch {
      // ignore
    }

    return [];
  }
}

export const goaAdminService = new GoaAdminService();
export default goaAdminService;
