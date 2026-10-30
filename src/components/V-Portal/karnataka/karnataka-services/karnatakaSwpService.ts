import { API_BASE_URL, authService } from '../../../../services/authService';
import { KARNATAKA_SWP_API } from '../../V_Portal_APIS/Karnataka_API';

/* ── Backend & Media Base URLs ── */
export const BACKEND_BASE = (API_BASE_URL || 'https://klkerp.com/api')
  .replace(/\/api\/?$/, '')
  .replace(/\/+$/, '');

export const R2_BASE = ((import.meta.env.VITE_R2_PUBLIC_URL as string | undefined) ?? '').replace(/\/+$/, '');

export function getKarnatakaMediaCandidates(path?: string | null): string[] {
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
    candidates.push(`${BACKEND_BASE}/storage/${normalized}`);
  } else {
    candidates.push(`${BACKEND_BASE}/uploads/${normalized}`);
    candidates.push(`${BACKEND_BASE}/storage/uploads/${normalized}`);
    candidates.push(`${BACKEND_BASE}/storage/${normalized}`);
  }

  if (R2_BASE) {
    candidates.push(`${R2_BASE}/${normalized}`);
    candidates.push(`${R2_BASE}/karnataka_swp/${filename}`);
  }

  candidates.push(`${BACKEND_BASE}/${normalized}`);
  return Array.from(new Set(candidates));
}

export function resolveKarnatakaMediaUrl(path?: string | null): string {
  const candidates = getKarnatakaMediaCandidates(path);
  return candidates[0] || '';
}

/* ── Status Normalizer matching Assam & Karnataka Catalog ── */
export function normalizeKarnatakaDashboardStatus(status?: string | null): string {
  if (!status) return 'complete';
  const s = status.toLowerCase().trim();

  if (s === 'all' || s === 'total') return 'total';
  if (s === 'site-accept' || s === 'accept' || s === 'accepted') return 'site-accept';
  if (s === 'site-not-accept' || s === 'not-accept') return 'site-not-accept';
  if (s === 'complete' || s === 'install' || s === 'installed') return 'install';
  if (s === 'pending' || s === 'not-install' || s === 'not_install') return 'not-install';
  if (s === 'inst-doc-complete' || s === 'doc-complete') return 'inst-doc-complete';
  if (s === 'inst-doc-pending' || s === 'doc-pending') return 'doc-pending';
  if (s === 'doc-approve' || s === 'doc-approved') return 'doc-approve';
  if (s === 'inst-doc-reject' || s === 'doc-reject') return 'inst-doc-reject';
  if (s === 'verify-pending' || s === 'verifypending') return 'verify-pending';
  if (s === 'verify-approved' || s === 'verify-approve' || s === 'verifyapproved') return 'verify-approved';
  if (s === 'verify-reject' || s === 'verifyrejected') return 'verify-reject';
  if (s === 'claim-applicable') return 'claim-applicable';
  if (s === 'claim-raised' || s === 'claimraised') return 'claim-raised';
  if (s === 'claim-approved' || s === 'claimapproved') return 'claim-approved';
  if (s === 'claim-reject' || s === 'claimreject') return 'claim-reject';
  if (s === 'inst-pay-done' || s === 'paid' || s === 'pay-complete') return 'inst-pay-done';
  if (s === 'inst-pay-partially' || s === 'partially' || s === 'partially-paid') return 'inst-pay-partially';
  if (s === 'inst-pay-pending' || s === 'pay-pending') return 'inst-pay-pending';

  return s;
}

/* ═══════════════════ Type Definitions ═══════════════════ */

export interface KarnatakaFarmerNameFather {
  id?: number;
  farmer_name?: string;
  f_farmer_name?: string;
  father_name?: string;
  f_father_name?: string;
  district?: string;
  tehsil?: string;
  village?: string;
  pump_capacity?: string;
  [key: string]: any;
}

export interface AssignedSiteItem {
  id: number;
  vendor?: number;
  state?: string;
  project?: string;
  purpose?: string;
  site_id?: string | number[];
  status: number; // 0 = Inactive, 1 = Assigned, 2 = Accepted
  created_at?: string;
  deadline_date?: string;
  remarks?: string;
  file?: string | null;
  vendors?: { id: number; name: string };
  Names?: KarnatakaFarmerNameFather[];
  sites?: any[];
  [key: string]: any;
}

export interface AssignSiteDetailSite {
  id: number;
  f_farmer_name?: string;
  farmer_name?: string;
  father_name?: string;
  f_father_name?: string;
  state?: string;
  district?: string;
  tehsil?: string;
  f_tehsil?: string;
  block?: string;
  village?: string;
  f_village?: string;
  pump_capacity?: string;
  pump_type?: string;
  assign_date?: string;
  deadline_date?: string;
  [key: string]: any;
}

export type AssignSiteDetailName = AssignSiteDetailSite;

export interface AssignSiteDetailResponse {
  id?: number;
  site_id?: string | number[];
  status?: number;
  username?: string;
  parent_id?: number;
  state?: string;
  district?: string;
  company_id?: number;
  assign_date?: string;
  deadline_date?: string;
  assign?: {
    id: number;
    site_id?: string | number[];
    status: number;
    [key: string]: any;
  };
  sites?: AssignSiteDetailSite[];
  Names?: AssignSiteDetailSite[];
  [key: string]: any;
}

export interface InstalledSiteItem {
  id: number;
  uid?: string;
  company_id?: number;
  state?: string;
  district?: string;
  tehsil?: string;
  f_tehsil?: string;
  village?: string;
  f_village?: string;
  f_post?: string;
  f_pincode?: string;
  work_order_no?: string;
  f_farmer_name?: string;
  farmer_name?: string;
  father_name?: string;
  f_father_name?: string;
  f_contact_no?: string;
  contact_no?: string;
  hp?: string | number;
  pump_capacity?: string;
  pump_type?: string;
  ac_dc?: string;

  // Equipment serials
  imei_no?: string;
  controller_no?: string;
  pump_no?: string;
  motor_no?: string;
  module_serial_no?: string | string[];

  // Field evidence photos
  module_image?: string;
  controller_image?: string;
  structure_image?: string;
  running_water_image?: string;
  foundation_image?: string;
  inst_doc?: string;
  document?: string;
  doc_file?: string;

  // Coordinates & remark
  inst_latitude?: string;
  latitude?: string;
  inst_longitude?: string;
  longitude?: string;
  inst_remarks?: string;
  remark?: string;

  // Status flags
  inst_status?: number;
  inst_verify_status?: number | string;
  verify_status?: number | string;
  inst_verify_reject_reason?: string;
  inst_doc_status?: number;
  doc_status?: number;
  document_status?: number;
  inst_doc_reject_reason?: string;
  inst_claim_status?: number;
  claim_status?: number;
  inst_claim_reject_reason?: string;
  inst_pay_status?: number;
  pay_status?: number;

  created_at?: string;
  updated_at?: string;
  [key: string]: any;
}

export interface InstallDetailSummary {
  total: number;
  complete: number;
  pending: number;
  verify_approved: number;
  verify_pending: number;
  verify_reject: number;
  doc_approved: number;
  doc_pending: number;
  doc_reject: number;
  claim_approved: number;
  claim_pending: number;
  claim_reject: number;
  paid: number;
  partially: number;
}

export interface ViewInstallSiteResponse {
  username?: string;
  parent_id?: number;
  state?: string;
  company_id?: number;
  assign: number;
  install_detail: InstallDetailSummary;
  sites: InstalledSiteItem[];
}

export interface ClaimItem {
  id: number;
  company_id?: string | number;
  vendor_id?: string | number;
  vendor_name?: string;
  invoice_no?: string;
  invoice_date?: string;
  date?: string;
  amount?: number | string;
  total_amount?: number | string | null;
  tds_amount?: number;
  net_amount?: number;
  purpose?: string | null;
  payment_type?: string | null;
  grand_total?: number | string | null;
  status?: number; // 0 = Draft, 1 = Raised, 2 = Approved, 3 = Rejected
  claim_status?: number; // 1 = Raised, 2 = Approved, 3 = Rejected
  payment_status?: number; // 0 = Unpaid, 1 = Partial, 2 = Paid
  pay_status?: number; // 0 = Unpaid, 1 = Partial, 2 = Paid
  approved_date?: string | null;
  approved_by?: string | null;
  approved_remarks?: string | null;
  utr_no?: string;
  payment_date?: string;
  remarks?: string;
  file?: string;
  invoice_file?: string;
  sites_count?: number;
  site_id?: any;
  created_by?: string | number;
  created_at?: string;
  updated_at?: string;
  [key: string]: any;
}

export interface ClaimEligibleSite {
  id: number;
  farmer_name?: string;
  f_farmer_name?: string;
  district?: string;
  state?: string;
  inst_verify_status?: number | string;
  verify_status?: number | string;
  inst_doc_status?: number | string;
  document_status?: number | string;
  doc_status?: number | string;
  inst_claim_status?: number | string;
  claim_status?: number | string;
  amount?: number;
  total_amount?: number;
  pump_capacity?: string;
  hp?: string | number;
  [key: string]: any;
}

/**
 * Check if a site's installation verification is approved (Verify Status = OK)
 * Backend value: 1 or '1' or 'approved' or 'ok'
 */
export function isSiteVerifyApproved(site?: any): boolean {
  if (!site) return false;
  const num = Number(site.inst_verify_status ?? site.verify_status ?? 0);
  const str = String(site.inst_verify_status ?? site.verify_status ?? '').toLowerCase().trim();
  return num === 1 || str === '1' || str === 'approved' || str === 'ok';
}

/**
 * Check if a site's installation document is approved (Document Status = OK)
 * Backend value: 2 or '2' or 'approved' or 'ok'
 */
export function isSiteDocApproved(site?: any): boolean {
  if (!site) return false;
  const num = Number(site.inst_doc_status ?? site.document_status ?? site.doc_status ?? 0);
  const str = String(site.inst_doc_status ?? site.document_status ?? site.doc_status ?? '').toLowerCase().trim();
  return num === 2 || str === '2' || str === 'approved' || str === 'ok';
}

/**
 * Check if a site qualifies for payment claim
 * Strictly requires BOTH:
 * 1. Verify Status === Approved (1)
 * AND
 * 2. Document Status === Approved (2)
 */
export function isSiteClaimEligible(site?: any): boolean {
  return isSiteVerifyApproved(site) && isSiteDocApproved(site);
}

export interface ViewClaimResponse {
  username?: string;
  parent_id?: number | string;
  login_id?: number | string;
  state?: string;
  company_id?: number | string;
  payments: ClaimItem[];
  sites: (InstalledSiteItem | ClaimEligibleSite | any)[];
}

export interface FetchClaimResponse {
  claims: any;
  farmers: {
    id: number;
    f_farmer_name?: string;
    farmer_name?: string;
    district?: string;
    pump_capacity?: string;
  }[];
}

export interface DistrictWiseDetail {
  district: string;
  site_count: number;
  complete: number;
  pending: number;
  verify_approved: number;
  verify_pending: number;
  doc_approved: number;
  inst_pay_complete: number;
}

export interface DistrictInstallItem {
  district: string;
  installed: number;
}

export interface DistrictMonthItem {
  month_year: string;
  monthly_installations: number;
}

export interface KarnatakaSwpDashboardSwp {
  site_count: number;
  complete: number;
  pending: number;
  verify_pending: number;
  verify_approved: number;
  verify_reject: number;
  doc_approved: number;
  doc_pending: number;
  doc_reject: number;
  inst_claim_applicable?: number;
  claim_applicable?: number;
  inst_claim_raised: number;
  claim_raised?: number;
  inst_claim_approved: number;
  claim_approved?: number;
  inst_claim_reject: number;
  claim_reject?: number;
  inst_pay_complete: number;
  inst_pay_partially: number;
  inst_pay_pending: number;
}

export interface KarnatakaSwpDashboardResponse {
  state?: string;
  username?: string;
  swp: KarnatakaSwpDashboardSwp;
  district_install?: DistrictInstallItem[];
  districtwise: DistrictWiseDetail[];
  district_installation_month?: DistrictMonthItem[];
  monthly_installations?: DistrictMonthItem[];
}

export interface KarnatakaSiteNameItem {
  id: number;
  f_farmer_name?: string;
  farmer_name?: string;
  application_no?: string;
  district?: string;
  f_district?: string;
  tehsil?: string;
  f_tehsil?: string;
  village?: string;
  f_village?: string;
  [key: string]: any;
}

export interface KarnatakaSiteDetailItem {
  id: number;
  uid?: string;
  state?: string;
  district?: string;
  f_district?: string;
  f_tehsil?: string;
  tehsil?: string;
  f_post?: string;
  f_village?: string;
  village?: string;
  f_pincode?: string;
  pincode?: string;
  work_order_no?: string;
  app_no?: string;
  f_farmer_name?: string;
  farmer_name?: string;
  f_father_name?: string;
  father_name?: string;
  f_contact_no?: string;
  contact_no?: string;
  hp?: string | number;
  pump_capacity?: string;
  pump_type?: string;
  vendor?: string;
  vendor_name?: string;
  controller_no?: string;
  pump_no?: string;
  motor_no?: string;
  imei_no?: string;
  module_serial_no?: string | string[];
  module_image?: string;
  controller_image?: string;
  structure_image?: string;
  running_water_image?: string;
  foundation_image?: string;
  inst_latitude?: string;
  latitude?: string;
  inst_longitude?: string;
  longitude?: string;
  inst_remarks?: string;
  remark?: string;
  [key: string]: any;
}

export type KarnatakaDashboardStatus =
  | 'total'
  | 'site-accept'
  | 'site-not-accept'
  | 'install'
  | 'not-install'
  | 'inst-doc-complete'
  | 'inst-doc-pending'
  | 'doc-approve'
  | 'doc-pending'
  | 'inst-doc-reject'
  | 'verify-pending'
  | 'verify-approved'
  | 'verify-reject'
  | 'claim-applicable'
  | 'claim-raised'
  | 'claim-approved'
  | 'claim-reject'
  | 'inst-pay-done'
  | 'inst-pay-partially'
  | 'inst-pay-pending';

export interface ApiResponse<T = any> {
  status?: boolean;
  success?: boolean;
  message?: string;
  data?: T;
  errors?: Record<string, string[] | string>;
  error?: string;
}

/* ═══════════════════ Service Implementation (100% Real API) ═══════════════════ */

class KarnatakaSwpService {
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
   * Direct API request using exact URL as specified in API documentation
   * (No fallbacks or modified paths so only exact canonical endpoints are hit)
   */
  private async fetchApi(urlOrEndpoint: string, options: RequestInit = {}): Promise<Response> {
    const rawBase = (API_BASE_URL || 'https://klkerp.com/api').replace(/\/+$/, '');
    const apiPrefix = rawBase.endsWith('/api') ? rawBase : `${rawBase}/api`;

    let finalUrl: string;

    if (urlOrEndpoint.startsWith('http://') || urlOrEndpoint.startsWith('https://')) {
      const u = new URL(urlOrEndpoint);
      let path = u.pathname;
      // Guarantee /api prefix is present in the URL
      if (!path.startsWith('/api/') && path !== '/api') {
        path = '/api' + (path.startsWith('/') ? path : `/${path}`);
      }
      finalUrl = `${u.origin}${path}${u.search}`;
    } else {
      const cleanEndpoint = urlOrEndpoint.startsWith('/') ? urlOrEndpoint : `/${urlOrEndpoint}`;
      const pathWithoutApi = cleanEndpoint.replace(/^\/api/, '');
      finalUrl = `${apiPrefix}${pathWithoutApi}`;
    }

    return fetch(finalUrl, options);
  }

  // Alias for backward compatibility
  private async fetchWithFallback(urlOrEndpoint: string, options: RequestInit = {}): Promise<Response> {
    return this.fetchApi(urlOrEndpoint, options);
  }

  /**
   * 1. View Assigned Installation Sites
   * GET /karnataka/swp/view-assign-installation-sites
   */
  async getAssignedInstallationSites(): Promise<AssignedSiteItem[]> {
    const res = await this.fetchWithFallback(KARNATAKA_SWP_API.ASSIGNED_SITES, {
      method: 'GET',
      headers: this.getHeaders(),
    });
    const json: any = await res.json().catch(() => ({}));
    if (!res.ok && !json.status && !json.success) {
      throw new Error(json.message || `Failed to fetch assigned installation sites (${res.status})`);
    }
    let assignsList: any[] = [];
    if (json.data && Array.isArray(json.data.assigns)) assignsList = json.data.assigns;
    else if (Array.isArray(json.data)) assignsList = json.data;
    else if (Array.isArray(json.assigns)) assignsList = json.assigns;
    else if (Array.isArray(json)) assignsList = json;

    const defaultVendorName =
      json.username ||
      (!Array.isArray(json.data) ? json.data?.username : undefined);
    const defaultParentId =
      json.parent_id ||
      (!Array.isArray(json.data) ? json.data?.parent_id : undefined);

    return assignsList.map((item: any) => ({
      ...item,
      vendors:
        item.vendors ||
        (defaultVendorName
          ? { id: Number(item.vendor || defaultParentId), name: defaultVendorName }
          : undefined),
    }));
  }

  /**
   * 2. View Assigned Site Details
   * GET /karnataka/swp/view-assigned-site-details?id=5
   */
  async getAssignSiteDetail(id: number | string): Promise<AssignSiteDetailResponse> {
    const numId = Number(id);
    if (!Number.isFinite(numId) || numId <= 0) {
      throw new Error(`Invalid assignment ID (${String(id)}).`);
    }

    const res = await this.fetchWithFallback(KARNATAKA_SWP_API.ASSIGN_SITE_DETAIL(numId), {
      method: 'GET',
      headers: this.getHeaders(),
    });
    const json: any = await res.json().catch(() => ({}));
    if (!res.ok && !json.status && !json.success) {
      throw new Error(json.message || `Failed to fetch assign details (${res.status})`);
    }
    const data = json.data || json;
    const sitesList = Array.isArray(data.sites)
      ? data.sites
      : Array.isArray(data.Names)
      ? data.Names
      : [];
    return {
      id: data.assign?.id || data.id || numId,
      site_id: data.assign?.site_id || data.site_id,
      status: data.assign?.status ?? data.status ?? 1,
      username: data.username || 'Vendor',
      parent_id: data.parent_id,
      state: data.state || 'karnataka',
      district: data.district,
      company_id: data.company_id,
      assign_date: data.assign_date || data.created_at,
      deadline_date: data.deadline_date,
      assign: data.assign || { id: numId, status: 1 },
      sites: sitesList,
      Names: sitesList,
    };
  }

  /**
   * 3. Accept Installation
   * GET /karnataka/swp/accept-installation?id=5
   */
  async acceptInstallation(id: number | string, _altId?: number | string): Promise<ApiResponse> {
    const numId = Number(id);
    if (!Number.isFinite(numId) || numId <= 0) {
      throw new Error(`Invalid assignment ID (${String(id)}).`);
    }

    const res = await this.fetchWithFallback(KARNATAKA_SWP_API.ACCEPT_INSTALLATION(numId), {
      method: 'GET',
      headers: this.getHeaders(),
    });
    const json: any = await res.json().catch(() => ({}));
    if (!res.ok || json.success === false || json.status === false) {
      throw new Error(json.message || `Failed to accept installation (${res.status})`);
    }
    return json;
  }

  /**
   * 4. Install Site (Store)
   * POST /karnataka/swp/installsite-store (multipart/form-data)
   */
  async installSiteStore(formData: FormData): Promise<ApiResponse> {
    const res = await this.fetchWithFallback(KARNATAKA_SWP_API.INSTALL_SITE_STORE, {
      method: 'POST',
      headers: this.getHeaders(true),
      body: formData,
    });
    const json: any = await res.json().catch(() => ({}));
    if (!res.ok || json.success === false || json.status === false) {
      let errMsg = json.message || 'Failed to install site.';
      if (json.errors) {
        if (typeof json.errors === 'string') {
          errMsg = json.errors;
        } else if (typeof json.errors === 'object') {
          const firstErr = Object.values(json.errors)[0];
          errMsg = Array.isArray(firstErr) ? firstErr[0] : String(firstErr);
        }
      }
      const err: any = new Error(errMsg);
      err.errors = json.errors;
      err.status = res.status;
      throw err;
    }
    return json;
  }

  /**
   * 5. View Installed Sites
   * GET /karnataka/swp/view-install-site
   */
  async getViewInstallSites(): Promise<ViewInstallSiteResponse> {
    const res = await this.fetchWithFallback(KARNATAKA_SWP_API.VIEW_INSTALL_SITE, {
      method: 'GET',
      headers: this.getHeaders(),
    });
    const json: any = await res.json().catch(() => ({}));
    if (!res.ok && !json.status && !json.success) {
      throw new Error(json.message || `Failed to fetch install site data (${res.status})`);
    }
    const data = json.data || json;
    return {
      username: data.username,
      parent_id: data.parent_id,
      state: data.state || 'karnataka',
      company_id: data.company_id,
      assign: Number(data.assign || 0),
      install_detail: data.install_detail || {
        total: 0,
        complete: 0,
        pending: 0,
        verify_approved: 0,
        verify_pending: 0,
        verify_reject: 0,
        doc_approved: 0,
        doc_pending: 0,
        doc_reject: 0,
        claim_approved: 0,
        claim_pending: 0,
        claim_reject: 0,
        paid: 0,
        partially: 0,
      },
      sites: Array.isArray(data.sites) ? data.sites : [],
    };
  }

  async getViewInstalledSites(): Promise<ViewInstallSiteResponse> {
    return this.getViewInstallSites();
  }

  async getViewInstallSite(): Promise<ViewInstallSiteResponse> {
    return this.getViewInstallSites();
  }

  /**
   * 6. Update Install Site (Fetch)
   * GET /karnataka/swp/update-install-site?id=101
   */
  async getUpdateInstallSite(id: number | string): Promise<{ site: InstalledSiteItem; [key: string]: any }> {
    const numId = Number(id);
    const res = await this.fetchWithFallback(KARNATAKA_SWP_API.UPDATE_INSTALL_SITE_FETCH(numId), {
      method: 'GET',
      headers: this.getHeaders(),
    });
    const json: any = await res.json().catch(() => ({}));
    if (!res.ok && !json.success && !json.status) {
      throw new Error(json.message || `Failed to fetch site update data (${res.status})`);
    }
    const data = json.data || json;
    return {
      site: data.site || data,
      ven: data.ven,
      username: data.username,
      parent_id: data.parent_id,
      company_id: data.company_id,
    };
  }

  /**
   * 7. Update Install Site (Store)
   * POST /api/karnataka-update-install-swp-site-store?id=26 (multipart/form-data)
   */
  async updateInstStore(formData: FormData, siteId?: number | string): Promise<ApiResponse> {
    const id = siteId || formData.get('id') || '';
    const url = typeof KARNATAKA_SWP_API.UPDATE_INSTALL_SITE_STORE === 'function'
      ? KARNATAKA_SWP_API.UPDATE_INSTALL_SITE_STORE(id as any)
      : KARNATAKA_SWP_API.UPDATE_INSTALL_SITE_STORE;

    const res = await this.fetchWithFallback(url, {
      method: 'POST',
      headers: this.getHeaders(true),
      body: formData,
    });
    const json: any = await res.json().catch(() => ({}));
    if (!res.ok || json.success === false || json.status === false) {
      let errMsg = json.message || 'Failed to update site installation.';
      if (json.errors) {
        if (typeof json.errors === 'string') errMsg = json.errors;
        else if (typeof json.errors === 'object') {
          const firstErr = Object.values(json.errors)[0];
          errMsg = Array.isArray(firstErr) ? firstErr[0] : String(firstErr);
        }
      }
      const err: any = new Error(errMsg);
      err.errors = json.errors;
      throw err;
    }
    return json;
  }

  /**
   * 8. Billing Document (PDF)
   * GET /karnataka/swp/billing-document/{id}
   */
  async getBillingDocument(id: number | string): Promise<{ success: boolean; pdf_base64?: string; filename?: string }> {
    const res = await this.fetchWithFallback(KARNATAKA_SWP_API.BILLING_DOCUMENT(id), {
      method: 'GET',
      headers: this.getHeaders(),
    });
    const json: any = await res.json().catch(() => ({}));
    if (!res.ok && !json.pdf_base64 && !json.data) {
      throw new Error(json.message || `Failed to fetch billing document (${res.status})`);
    }
    return {
      success: true,
      pdf_base64: json.pdf_base64 || json.data?.pdf_base64 || json.data,
      filename: json.filename || `Karnataka_SWP_Billing_${id}.pdf`,
    };
  }

  /**
   * 9. Installation Document (HOC) Store
   * POST /karnataka/swp/installation-doc-store (multipart/form-data)
   */
  async uploadInstDoc(formData: FormData): Promise<ApiResponse> {
    const res = await this.fetchWithFallback(KARNATAKA_SWP_API.DOC_STORE, {
      method: 'POST',
      headers: this.getHeaders(true),
      body: formData,
    });
    const json: any = await res.json().catch(() => ({}));
    if (!res.ok || json.success === false || json.status === false) {
      throw new Error(json.message || `Failed to upload compliance document (${res.status})`);
    }
    return json;
  }

  async submitInstallationDoc(formData: FormData): Promise<ApiResponse> {
    return this.uploadInstDoc(formData);
  }

  /**
   * 10. View Claims / Payments
   * GET /karnataka/swp/installation-claim
   */
  async getViewClaims(): Promise<ViewClaimResponse> {
    const res = await this.fetchWithFallback(KARNATAKA_SWP_API.VIEW_CLAIM, {
      method: 'GET',
      headers: this.getHeaders(),
    });
    const json: any = await res.json().catch(() => ({}));
    if (!res.ok && !json.success && !json.status) {
      throw new Error(json.message || `Failed to fetch payment details (${res.status})`);
    }
    const data = json.data || json;
    return {
      username: data.username,
      parent_id: data.parent_id,
      login_id: data.login_id,
      state: data.state || 'karnataka',
      company_id: data.company_id,
      payments: Array.isArray(data.payments) ? data.payments : Array.isArray(data.claims) ? data.claims : [],
      sites: Array.isArray(data.sites) ? data.sites : [],
    };
  }

  /**
   * Sites eligible for payment claim
   * Strictly filtered: ONLY sites where BOTH:
   * 1. Verify Status === Approved (1)
   * AND
   * 2. Document Status === Approved (2)
   */
  async getClaimEligibleSites(): Promise<ClaimEligibleSite[]> {
    const list: ClaimEligibleSite[] = [];
    const seen = new Set<string | number>();

    // 1. Fetch installed sites (API 5) which has exact verification and doc statuses
    const installSitesMap = new Map<number, InstalledSiteItem>();

    try {
      const instRes = await this.getViewInstallSites();
      if (Array.isArray(instRes.sites)) {
        for (const s of instRes.sites) {
          const sid = Number(s.id);
          if (sid) {
            installSitesMap.set(sid, s);
          }
        }
      }
    } catch (e) {
      console.warn('Could not load install sites for verification check:', e);
    }

    // 2. Add eligible sites from installed sites (API 5)
    for (const [sid, s] of installSitesMap.entries()) {
      if (isSiteClaimEligible(s)) {
        if (!seen.has(sid)) {
          seen.add(sid);
          list.push({
            id: sid,
            farmer_name: s.f_farmer_name || s.farmer_name || `Site #${sid}`,
            f_farmer_name: s.f_farmer_name || s.farmer_name || `Site #${sid}`,
            district: s.district || (s as any).f_district,
            state: s.state || 'karnataka',
            pump_capacity: s.pump_capacity || (s as any).hp,
            hp: s.hp,
            inst_verify_status: s.inst_verify_status ?? s.verify_status,
            verify_status: s.verify_status ?? s.inst_verify_status,
            inst_doc_status: s.inst_doc_status ?? s.document_status ?? s.doc_status,
            document_status: s.document_status ?? s.inst_doc_status ?? s.doc_status,
            doc_status: s.doc_status ?? s.inst_doc_status ?? s.document_status,
            inst_claim_status: s.inst_claim_status ?? s.claim_status,
            claim_status: s.claim_status ?? s.inst_claim_status,
            amount: Number((s as any).amount || (s as any).total_amount || 50000),
            total_amount: Number((s as any).total_amount || (s as any).amount || 50000),
          });
        }
      }
    }

    // 3. Also check claims response (API 10) in case any other eligible sites exist
    try {
      const claimRes = await this.getViewClaims();
      if (Array.isArray(claimRes.sites)) {
        for (const s of claimRes.sites) {
          const sid = Number(s.id);
          if (!sid || seen.has(sid)) continue;

          // Merge with status from installSitesMap if available
          const instSite = installSitesMap.get(sid);
          const merged = {
            ...s,
            ...(instSite || {}),
            inst_verify_status: instSite?.inst_verify_status ?? s.inst_verify_status ?? instSite?.verify_status ?? (s as any).verify_status,
            verify_status: instSite?.verify_status ?? (s as any).verify_status ?? instSite?.inst_verify_status ?? s.inst_verify_status,
            inst_doc_status: instSite?.inst_doc_status ?? s.inst_doc_status ?? instSite?.document_status ?? (s as any).document_status,
            document_status: instSite?.document_status ?? (s as any).document_status ?? instSite?.inst_doc_status ?? s.inst_doc_status,
          };

          // Strictly require BOTH conditions: Verify Approved AND Document Approved
          if (isSiteClaimEligible(merged)) {
            seen.add(sid);
            list.push({
              id: sid,
              farmer_name: merged.f_farmer_name || merged.farmer_name || `Site #${sid}`,
              f_farmer_name: merged.f_farmer_name || merged.farmer_name || `Site #${sid}`,
              district: merged.district || (merged as any).f_district,
              state: merged.state || 'karnataka',
              pump_capacity: merged.pump_capacity || (merged as any).hp,
              hp: merged.hp,
              inst_verify_status: merged.inst_verify_status,
              verify_status: merged.verify_status,
              inst_doc_status: merged.inst_doc_status,
              document_status: merged.document_status,
              doc_status: merged.doc_status,
              inst_claim_status: merged.inst_claim_status,
              claim_status: merged.claim_status,
              amount: Number((merged as any).amount || (merged as any).total_amount || 50000),
              total_amount: Number((merged as any).total_amount || (merged as any).amount || 50000),
            });
          }
        }
      }
    } catch (e) {
      console.warn('Could not load claims sites:', e);
    }

    return list;
  }

  /**
   * 11. Add Claim
   * POST /karnataka/swp/installation-add-claim (multipart/form-data)
   */
  async addClaim(formData: FormData): Promise<ApiResponse> {
    const res = await this.fetchWithFallback(KARNATAKA_SWP_API.ADD_CLAIM, {
      method: 'POST',
      headers: this.getHeaders(true),
      body: formData,
    });
    const json: any = await res.json().catch(() => ({}));
    if (!res.ok || json.success === false || json.status === false) {
      let errMsg = json.message || 'Failed to raise payment claim.';
      if (json.errors) {
        if (typeof json.errors === 'string') errMsg = json.errors;
        else if (typeof json.errors === 'object') {
          const firstErr = Object.values(json.errors)[0];
          errMsg = Array.isArray(firstErr) ? firstErr[0] : String(firstErr);
        }
      }
      throw new Error(errMsg);
    }
    return json;
  }

  /**
   * 12. Update Claim
   * POST /karnataka/swp/installation-update-claim (multipart/form-data)
   */
  async updateClaim(formData: FormData): Promise<ApiResponse> {
    const res = await this.fetchWithFallback(KARNATAKA_SWP_API.UPDATE_CLAIM, {
      method: 'POST',
      headers: this.getHeaders(true),
      body: formData,
    });
    const json: any = await res.json().catch(() => ({}));
    if (!res.ok || json.success === false || json.status === false) {
      let errMsg = json.message || 'Failed to update payment claim.';
      if (json.errors) {
        if (typeof json.errors === 'string') errMsg = json.errors;
        else if (typeof json.errors === 'object') {
          const firstErr = Object.values(json.errors)[0];
          errMsg = Array.isArray(firstErr) ? firstErr[0] : String(firstErr);
        }
      }
      throw new Error(errMsg);
    }
    return json;
  }

  /**
   * 13. Fetch Claim
   * ANY /karnataka/swp/fetch-claim?id={id}
   */
  async fetchClaim(id: number | string): Promise<FetchClaimResponse> {
    const numId = Number(id);
    const res = await this.fetchWithFallback(KARNATAKA_SWP_API.FETCH_CLAIM(numId), {
      method: 'GET',
      headers: this.getHeaders(),
    });
    const json: any = await res.json().catch(() => ({}));
    if (!res.ok && !json.claims) {
      throw new Error(json.message || `Failed to fetch claim (${res.status})`);
    }
    return {
      claims: json.claims || json.data?.claims || json,
      farmers: Array.isArray(json.farmers) ? json.farmers : [],
    };
  }

  /**
   * 14. Dashboard Data (Pure API)
   * GET /karnataka/swp/dashboard OR GET /karnataka-swp-dashboard OR fallback to view-install-site
   */
  async getDashboardData(): Promise<KarnatakaSwpDashboardResponse> {
    let raw: any = null;
    let fetchError: Error | null = null;

    // 1. Try dedicated dashboard endpoint
    try {
      const res = await this.fetchWithFallback(KARNATAKA_SWP_API.DASHBOARD, {
        method: 'GET',
        headers: this.getHeaders(),
      });
      const json: any = await res.json().catch(() => ({}));
      if (res.ok && (json.success || json.status || json.data)) {
        raw = json.data || json;
      }
    } catch (err: any) {
      fetchError = err;
    }

    // 1b. Try alternate dashboard endpoint
    if (!raw && (KARNATAKA_SWP_API as any).DASHBOARD_ALT) {
      try {
        const res = await this.fetchWithFallback((KARNATAKA_SWP_API as any).DASHBOARD_ALT, {
          method: 'GET',
          headers: this.getHeaders(),
        });
        const json: any = await res.json().catch(() => ({}));
        if (res.ok && (json.success || json.status || json.data)) {
          raw = json.data || json;
        }
      } catch (err: any) {
        fetchError = err;
      }
    }

    // 2. Fall back to view-install-site (API 5)
    if (!raw) {
      try {
        const res = await this.fetchWithFallback(KARNATAKA_SWP_API.VIEW_INSTALL_SITE, {
          method: 'GET',
          headers: this.getHeaders(),
        });
        const json: any = await res.json().catch(() => ({}));
        if (res.ok && (json.success || json.status || json.data)) {
          raw = json.data || json;
        }
      } catch (err: any) {
        fetchError = err;
      }
    }

    if (!raw) {
      throw fetchError || new Error('Failed to fetch Karnataka SWP dashboard data from server.');
    }

    const installDetail = raw.install_detail || {};
    let swpData: KarnatakaSwpDashboardSwp;

    if (raw.swp) {
      swpData = {
        site_count: Number(raw.swp.site_count ?? raw.assign ?? installDetail.total ?? 0),
        complete: Number(raw.swp.complete ?? installDetail.complete ?? 0),
        pending: Number(raw.swp.pending ?? installDetail.pending ?? 0),
        verify_approved: Number(raw.swp.verify_approved ?? installDetail.verify_approved ?? 0),
        verify_pending: Number(raw.swp.verify_pending ?? installDetail.verify_pending ?? 0),
        verify_reject: Number(raw.swp.verify_reject ?? installDetail.verify_reject ?? 0),
        doc_approved: Number(raw.swp.doc_approved ?? installDetail.doc_approved ?? 0),
        doc_pending: Number(raw.swp.doc_pending ?? installDetail.doc_pending ?? 0),
        doc_reject: Number(raw.swp.doc_reject ?? installDetail.doc_reject ?? 0),
        inst_claim_raised: Number(raw.swp.inst_claim_raised ?? installDetail.claim_pending ?? 0),
        inst_claim_approved: Number(raw.swp.inst_claim_approved ?? installDetail.claim_approved ?? 0),
        inst_claim_reject: Number(raw.swp.inst_claim_reject ?? installDetail.claim_reject ?? 0),
        inst_pay_complete: Number(raw.swp.inst_pay_complete ?? installDetail.paid ?? 0),
        inst_pay_partially: Number(raw.swp.inst_pay_partially ?? installDetail.partially ?? 0),
        inst_pay_pending: Number(raw.swp.inst_pay_pending ?? 0),
      };
    } else if (Array.isArray(raw.sites) && raw.sites.length > 0) {
      const sites: InstalledSiteItem[] = raw.sites;
      let complete = 0;
      let verify_approved = 0;
      let verify_pending = 0;
      let verify_reject = 0;
      let doc_approved = 0;
      let doc_pending = 0;
      let doc_reject = 0;
      let pay_complete = 0;
      let pay_partially = 0;

      for (const s of sites) {
        const isInst = Number(s.inst_status) === 1 || Boolean(s.controller_no) || Boolean(s.pump_no);
        if (isInst) complete++;

        const vStatus = Number(s.inst_verify_status ?? s.verify_status ?? -1);
        if (vStatus === 1) verify_approved++;
        else if (vStatus === 2) verify_reject++;
        else verify_pending++;

        const dStatus = Number(s.inst_doc_status ?? s.document_status ?? s.doc_status ?? -1);
        if (dStatus === 2 || dStatus === 1) doc_approved++;
        else if (dStatus === 3) doc_reject++;
        else doc_pending++;

        const pStatus = Number(s.inst_pay_status ?? s.pay_status ?? s.inst_claim_status ?? -1);
        if (pStatus === 2) pay_complete++;
        else if (pStatus === 1) pay_partially++;
      }

      const totalCount = Number(raw.assign ?? installDetail.total ?? sites.length);
      swpData = {
        site_count: totalCount,
        complete: installDetail.complete !== undefined ? Number(installDetail.complete) : complete,
        pending: installDetail.pending !== undefined ? Number(installDetail.pending) : Math.max(0, totalCount - complete),
        verify_approved: installDetail.verify_approved !== undefined ? Number(installDetail.verify_approved) : verify_approved,
        verify_pending: installDetail.verify_pending !== undefined ? Number(installDetail.verify_pending) : verify_pending,
        verify_reject: installDetail.verify_reject !== undefined ? Number(installDetail.verify_reject) : verify_reject,
        doc_approved: installDetail.doc_approved !== undefined ? Number(installDetail.doc_approved) : doc_approved,
        doc_pending: installDetail.doc_pending !== undefined ? Number(installDetail.doc_pending) : doc_pending,
        doc_reject: installDetail.doc_reject !== undefined ? Number(installDetail.doc_reject) : doc_reject,
        inst_claim_raised: Number(installDetail.claim_pending ?? 0),
        inst_claim_approved: Number(installDetail.claim_approved ?? 0),
        inst_claim_reject: Number(installDetail.claim_reject ?? 0),
        inst_pay_complete: installDetail.paid !== undefined ? Number(installDetail.paid) : pay_complete,
        inst_pay_partially: installDetail.partially !== undefined ? Number(installDetail.partially) : pay_partially,
        inst_pay_pending: Math.max(0, complete - pay_complete),
      };
    } else {
      swpData = {
        site_count: Number(raw.assign ?? installDetail.total ?? 0),
        complete: Number(installDetail.complete ?? 0),
        pending: Number(installDetail.pending ?? 0),
        verify_approved: Number(installDetail.verify_approved ?? 0),
        verify_pending: Number(installDetail.verify_pending ?? 0),
        verify_reject: Number(installDetail.verify_reject ?? 0),
        doc_approved: Number(installDetail.doc_approved ?? 0),
        doc_pending: Number(installDetail.doc_pending ?? 0),
        doc_reject: Number(installDetail.doc_reject ?? 0),
        inst_claim_raised: Number(installDetail.claim_pending ?? 0),
        inst_claim_approved: Number(installDetail.claim_approved ?? 0),
        inst_claim_reject: Number(installDetail.claim_reject ?? 0),
        inst_pay_complete: Number(installDetail.paid ?? 0),
        inst_pay_partially: Number(installDetail.partially ?? 0),
        inst_pay_pending: 0,
      };
    }

    // Parse or compute districtwise analytics strictly from API data
    let districtwise: DistrictWiseDetail[] = [];
    if (Array.isArray(raw.districtwise) && raw.districtwise.length > 0) {
      districtwise = raw.districtwise;
    } else if (Array.isArray(raw.sites)) {
      const map: Record<string, DistrictWiseDetail> = {};
      for (const s of raw.sites) {
        const dist = s.district || s.f_district || 'General';
        if (!map[dist]) {
          map[dist] = {
            district: dist,
            site_count: 0,
            complete: 0,
            pending: 0,
            verify_approved: 0,
            verify_pending: 0,
            doc_approved: 0,
            inst_pay_complete: 0,
          };
        }
        map[dist].site_count++;
        const isInstalled = Number(s.inst_status) === 1 || Boolean(s.controller_no) || Boolean(s.pump_no);
        if (isInstalled) map[dist].complete++;
        else map[dist].pending++;

        const vStatus = Number(s.inst_verify_status ?? s.verify_status ?? -1);
        if (vStatus === 1) map[dist].verify_approved++;
        else if (vStatus === 0 || s.inst_verify_status === null || s.inst_verify_status === undefined) map[dist].verify_pending++;

        const dStatus = Number(s.inst_doc_status ?? s.document_status ?? s.doc_status ?? -1);
        if (dStatus === 2 || dStatus === 1) map[dist].doc_approved++;

        const pStatus = Number(s.inst_pay_status ?? s.pay_status ?? s.inst_claim_status ?? -1);
        if (pStatus === 2) map[dist].inst_pay_complete++;
      }
      districtwise = Object.values(map);
    }

    let monthlyInstallations: DistrictMonthItem[] =
      Array.isArray(raw.district_installation_month) && raw.district_installation_month.length > 0
        ? raw.district_installation_month
        : Array.isArray(raw.monthly_installations) && raw.monthly_installations.length > 0
        ? raw.monthly_installations
        : [];

    // Fallback: derive monthly trend from real site timestamps if monthly array is empty
    if (monthlyInstallations.length === 0 && Array.isArray(raw.sites)) {
      const monthMap: Record<string, number> = {};
      for (const s of raw.sites) {
        const isInstalled = Number(s.inst_status) === 1 || Boolean(s.controller_no) || Boolean(s.pump_no);
        if (!isInstalled) continue;
        const dStr = s.inst_date || s.created_at || s.updated_at;
        if (!dStr) continue;
        const dateObj = new Date(dStr);
        if (isNaN(dateObj.getTime())) continue;
        const mKey = dateObj.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        monthMap[mKey] = (monthMap[mKey] || 0) + 1;
      }
      monthlyInstallations = Object.entries(monthMap).map(([month_year, count]) => ({
        month_year,
        monthly_installations: count,
      }));
    }

    return {
      state: raw.state || 'karnataka',
      username: raw.username,
      swp: swpData,
      district_install: Array.isArray(raw.district_install) ? raw.district_install : [],
      districtwise,
      district_installation_month: monthlyInstallations,
    };
  }

  async getDashboard(): Promise<KarnatakaSwpDashboardResponse> {
    return this.getDashboardData();
  }

  /**
   * 15. Fetch Site Name (Dropdown for pending installation)
   * GET /karnataka/swp/installation/fetch-site-name
   */
  async fetchSiteName(): Promise<ApiResponse<KarnatakaSiteNameItem[]>> {
    const res = await this.fetchWithFallback(KARNATAKA_SWP_API.FETCH_SITE_NAMES, {
      method: 'GET',
      headers: this.getHeaders(),
    });
    const json: any = await res.json().catch(() => ({}));
    if (!res.ok && !json.status && !json.success) {
      throw new Error(json.message || `Failed to fetch site names (${res.status})`);
    }
    const list = Array.isArray(json.data) ? json.data : Array.isArray(json) ? json : [];
    return { success: true, data: list };
  }

  async fetchSiteNames(): Promise<KarnatakaSiteNameItem[]> {
    const res = await this.fetchSiteName();
    return res.data || [];
  }

  /**
   * 16. Fetch Site Details
   * GET /karnataka/swp/installation/fetch-site-details?site_id=101
   */
  async fetchSiteDetails(siteId: number | string): Promise<ApiResponse<KarnatakaSiteDetailItem>> {
    const numId = Number(siteId);
    const res = await this.fetchWithFallback(KARNATAKA_SWP_API.FETCH_SITE_DETAILS(numId), {
      method: 'GET',
      headers: this.getHeaders(),
    });
    const json: any = await res.json().catch(() => ({}));
    if (!res.ok && !json.success && !json.status) {
      throw new Error(json.message || `Failed to fetch site details (${res.status})`);
    }
    const dataArr = Array.isArray(json.data) ? json.data : Array.isArray(json) ? json : [json.data || json];
    return { success: true, data: dataArr[0] };
  }

  /**
   * 17. View Dashboard Data (Status-Wise Drilldown)
   * GET /karnataka/swp/installation/view-dashboard-data/{status}
   */
  async getViewDashboardData(status: string): Promise<InstalledSiteItem[]> {
    const norm = normalizeKarnatakaDashboardStatus(status);

    // 1. Try dedicated endpoint
    try {
      const res = await this.fetchWithFallback(KARNATAKA_SWP_API.VIEW_DASHBOARD_DATA(norm), {
        method: 'GET',
        headers: this.getHeaders(),
      });
      const json: any = await res.json().catch(() => ({}));
      if (res.ok && (json.status || json.success || json.data || json.sites)) {
        if (Array.isArray(json.data)) return json.data;
        if (Array.isArray(json.sites)) return json.sites;
        if (Array.isArray(json)) return json;
      }
    } catch {}

    // 2. Try alternate route
    if ((KARNATAKA_SWP_API as any).VIEW_DASHBOARD_DATA_ALT) {
      try {
        const res = await this.fetchWithFallback((KARNATAKA_SWP_API as any).VIEW_DASHBOARD_DATA_ALT(norm), {
          method: 'GET',
          headers: this.getHeaders(),
        });
        const json: any = await res.json().catch(() => ({}));
        if (res.ok && (json.status || json.success || json.data || json.sites)) {
          if (Array.isArray(json.data)) return json.data;
          if (Array.isArray(json.sites)) return json.sites;
          if (Array.isArray(json)) return json;
        }
      } catch {}
    }

    // 3. Fallback: Query all installed sites and apply the exact status filter client-side
    const installData = await this.getViewInstallSites().catch(() => ({ sites: [] as InstalledSiteItem[] }));
    const allSites = installData.sites || [];

    return this.filterSitesByStatus(allSites, norm);
  }

  /**
   * Filter site list by normalized status
   */
  private filterSitesByStatus(sites: InstalledSiteItem[], norm: string): InstalledSiteItem[] {
    switch (norm) {
      case 'total':
        return sites;
      case 'install':
        return sites.filter((s) => Number(s.inst_status) === 1 || Boolean(s.controller_no) || Boolean(s.pump_no));
      case 'not-install':
        return sites.filter((s) => Number(s.inst_status) === 0 && !s.controller_no && !s.pump_no);
      case 'verify-approved':
        return sites.filter((s) => Number(s.inst_verify_status ?? s.verify_status) === 1 || String(s.inst_verify_status).toLowerCase() === 'approved');
      case 'verify-pending':
        return sites.filter((s) => Number(s.inst_verify_status ?? s.verify_status) === 0 || s.inst_verify_status === null || String(s.inst_verify_status).toLowerCase() === 'pending');
      case 'verify-reject':
        return sites.filter((s) => Number(s.inst_verify_status ?? s.verify_status) === 2 || String(s.inst_verify_status).toLowerCase() === 'reject' || String(s.inst_verify_status).toLowerCase() === 'rejected');
      case 'doc-approve':
        return sites.filter((s) => Number(s.inst_doc_status ?? s.document_status ?? s.doc_status) === 2 || Number(s.inst_doc_status ?? s.document_status ?? s.doc_status) === 1 || String(s.inst_doc_status).toLowerCase() === 'approved');
      case 'doc-pending':
        return sites.filter((s) => Number(s.inst_doc_status ?? s.document_status ?? s.doc_status) === 0 || Boolean(s.inst_doc && Number(s.inst_doc_status) !== 2));
      case 'inst-doc-reject':
        return sites.filter((s) => Number(s.inst_doc_status ?? s.document_status ?? s.doc_status) === 3 || String(s.inst_doc_status).toLowerCase() === 'reject');
      case 'claim-raised':
        return sites.filter((s) => Number(s.inst_claim_status ?? s.claim_status) === 1);
      case 'claim-approved':
        return sites.filter((s) => Number(s.inst_claim_status ?? s.claim_status) === 2);
      case 'claim-reject':
        return sites.filter((s) => Number(s.inst_claim_status ?? s.claim_status) === 3);
      case 'inst-pay-done':
        return sites.filter((s) => Number(s.inst_pay_status ?? s.pay_status) === 2 || Number(s.inst_claim_status) === 2);
      case 'inst-pay-partially':
        return sites.filter((s) => Number(s.inst_pay_status ?? s.pay_status) === 1);
      case 'inst-pay-pending':
        return sites.filter((s) => Number(s.inst_pay_status ?? s.pay_status) === 0);
      default:
        return sites;
    }
  }

  /**
   * 18. District-Wise Status Drilldown
   * GET /karnataka/swp/installation/view-dashboard-districtwise/{status}/{district}
   */
  async getViewDashboardDistrictwise(status: string, district: string): Promise<InstalledSiteItem[]> {
    const norm = normalizeKarnatakaDashboardStatus(status);
    const cleanDistrict = district?.trim() || '';

    // 1. Try dedicated endpoint
    try {
      const res = await this.fetchWithFallback(KARNATAKA_SWP_API.VIEW_DASHBOARD_DISTRICTWISE(norm, cleanDistrict), {
        method: 'GET',
        headers: this.getHeaders(),
      });
      const json: any = await res.json().catch(() => ({}));
      if (res.ok && (json.status || json.success || json.data || json.sites)) {
        if (Array.isArray(json.data)) return json.data;
        if (Array.isArray(json.sites)) return json.sites;
        if (Array.isArray(json)) return json;
      }
    } catch {}

    // 2. Try alternate route
    if ((KARNATAKA_SWP_API as any).VIEW_DASHBOARD_DISTRICTWISE_ALT) {
      try {
        const res = await this.fetchWithFallback((KARNATAKA_SWP_API as any).VIEW_DASHBOARD_DISTRICTWISE_ALT(norm, cleanDistrict), {
          method: 'GET',
          headers: this.getHeaders(),
        });
        const json: any = await res.json().catch(() => ({}));
        if (res.ok && (json.status || json.success || json.data || json.sites)) {
          if (Array.isArray(json.data)) return json.data;
          if (Array.isArray(json.sites)) return json.sites;
          if (Array.isArray(json)) return json;
        }
      } catch {}
    }

    // 3. Fallback: Filter getViewDashboardData by district
    const statusSites = await this.getViewDashboardData(norm);
    if (!cleanDistrict || cleanDistrict.toLowerCase() === 'all') {
      return statusSites;
    }
    return statusSites.filter((s) => {
      const d = (s.district || s.f_district || '').toLowerCase().trim();
      return d === cleanDistrict.toLowerCase().trim();
    });
  }

  // Aliases for StatusView component compatibility
  async getViewDashboardByStatus(status: string): Promise<InstalledSiteItem[]> {
    return this.getViewDashboardData(status);
  }

  async getViewDistrictwiseByStatus(status: string, district: string): Promise<InstalledSiteItem[]> {
    return this.getViewDashboardDistrictwise(status, district);
  }
}

export const karnatakaSwpService = new KarnatakaSwpService();
export default karnatakaSwpService;
