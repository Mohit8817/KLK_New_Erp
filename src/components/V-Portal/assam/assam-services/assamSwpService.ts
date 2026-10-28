import { API_BASE_URL, authService } from '../../../../services/authService';
import { ASSAM_SWP_API } from '../../V_Portal_APIS/Assam_API';

/* ── Backend & Media Base URLs ── */
export const BACKEND_BASE = (API_BASE_URL || 'https://klkerp.com/api')
  .replace(/\/api\/?$/, '')
  .replace(/\/+$/, '');

export const R2_BASE = ((import.meta.env.VITE_R2_PUBLIC_URL as string | undefined) ?? '').replace(/\/+$/, '');

export function getAssamMediaCandidates(path?: string | null): string[] {
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

  // SWP specific upload paths per docs
  candidates.push(`${BACKEND_BASE}/uploads/assam/installation/swp/assign/${filename}`);
  candidates.push(`${BACKEND_BASE}/uploads/assam/installation/swp/module/${filename}`);
  candidates.push(`${BACKEND_BASE}/uploads/assam/installation/swp/inverter_vfd/${filename}`);
  candidates.push(`${BACKEND_BASE}/uploads/assam/installation/swp/running_water/${filename}`);
  candidates.push(`${BACKEND_BASE}/uploads/assam/installation/swp/payment/${filename}`);
  candidates.push(`${BACKEND_BASE}/uploads/assam/installation/swp/${filename}`);
  candidates.push(`${BACKEND_BASE}/uploads/assam/installation/${filename}`);
  candidates.push(`${BACKEND_BASE}/uploads/${filename}`);
  candidates.push(`${BACKEND_BASE}/${normalized}`);

  if (R2_BASE) {
    candidates.push(`${R2_BASE}/uploads/assam/installation/swp/${filename}`);
    candidates.push(`${R2_BASE}/${filename}`);
  }
  candidates.push(`https://pub-21d2019fecbe4a96a88c93b2f091317a.r2.dev/${filename}`);

  return Array.from(new Set(candidates));
}

export function resolveAssamMediaUrl(path?: string | null): string {
  if (!path) return '';
  if (/^(https?:|data:|blob:)/i.test(path)) return path;
  const candidates = getAssamMediaCandidates(path);
  return candidates[0] || `${BACKEND_BASE}/${path.replace(/^\/+/, '')}`;
}

/* ═══════════════════ Type Definitions ═══════════════════ */

export interface FarmerNameFather {
  id?: number;
  farmer_name?: string;
  father_name?: string;
}

export interface AssignedSiteItem {
  id: number;
  company_id?: number;
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
  Names?: FarmerNameFather[];
  [key: string]: any;
}

export interface AssignSiteDetailName {
  id: number;
  state?: string;
  district?: string;
  tehsil?: string;
  block?: string;
  village?: string;
  farmer_name?: string;
  farmer_contact?: string;
  father_name?: string;
  customer_no?: string;
  pump_capacity?: string;
  pump_type?: string;
  pump_sub_type?: string;
  [key: string]: any;
}

export interface AssignSiteDetailResponse {
  id: number;
  site_id?: string | number[];
  status: number;
  Names?: AssignSiteDetailName[];
  [key: string]: any;
}

export interface InstallableSiteName {
  site_id: number;
  site_name: string;
}

export interface InstallSiteDetails {
  id: number;
  state?: string;
  district?: string;
  block?: string;
  village?: string;
  tehsil?: string;
  farmer_name?: string;
  father_name?: string;
  customer_no?: string;
  farmer_contact?: string;
  pump_capacity?: string;
  pump_type?: string;
  pump_sub_type?: string;
  [key: string]: any;
}

export interface InstalledSiteItem {
  id: number;
  company_id?: number;
  state?: string;
  district?: string;
  block?: string;
  village?: string;
  tehsil?: string;
  farmer_name?: string;
  father_name?: string;
  farmer_contact?: string;
  customer_no?: string;
  pump_capacity?: string;
  pump_type?: string;
  pump_sub_type?: string;
  inverter_no?: string;
  vfd_no?: string;
  module_serial_no?: string | string[];
  module_image?: string;
  inverter_vfd_image?: string;
  running_water_image?: string;
  inst_latitude?: string;
  inst_longitude?: string;
  inst_remarks?: string;
  inst_status: number; // 0 = Pending, 1 = Installed
  inst_date?: string;
  inst_verify_status: number; // 0 = Pending, 1 = Approved, 2 = Rejected
  inst_verify_remarks?: string;
  inst_doc?: string;
  inst_doc_date?: string;
  inst_doc_status?: number; // 1 = Pending, 2 = Approved, 3 = Rejected
  inst_doc_remarks?: string;
  inst_claim_status: number; // 0 = Not Raised, 1 = Raised, 2 = Approved, 3 = Rejected
  inst_pay_status: number; // 0 = Pending, 1 = Paid, 2 = Partially
  created_at?: string;
  updated_at?: string;
  [key: string]: any;
}

export interface ViewInstallSiteSummary {
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
  [key: string]: any;
}

export interface ViewInstallSiteResponse {
  assign: number;
  install_detail: ViewInstallSiteSummary;
  sites: InstalledSiteItem[];
}

export interface SiteUpdateDataResponse {
  ven?: { name: string };
  site: InstalledSiteItem;
}

export interface ClaimItem {
  id: number;
  company_id?: number;
  project?: string;
  vendor_id?: string | number;
  date?: string;
  type?: string;
  state?: string;
  claim_status: number; // 1 = Raised, 2 = Approved, 3 = Rejected
  amount: string | number;
  site_id: string | number[];
  remarks?: string;
  file?: string;
  payment_amount?: string | number;
  payment_balance?: string | number;
  payment_date?: string;
  payment_remarks?: string;
  payment_status?: number;
  created_at?: string;
  updated_at?: string;
  [key: string]: any;
}

export interface ClaimEligibleSite {
  id: number;
  farmer_name: string;
  district?: string;
  state?: string;
  inst_verify_status?: number;
  inst_doc_status?: number;
  inst_claim_status?: number;
  inst_status?: number;
}

export interface ViewClaimResponse {
  data: ClaimItem[];
  sites: ClaimEligibleSite[];
}

export interface DashboardSwpSummary {
  site_count: number;
  complete: number;
  pending: number;
  verify_pending: number;
  verify_approved: number;
  verify_reject: number;
  doc_approved: number;
  doc_pending: number;
  doc_reject: number;
  inst_claim_raised: number;
  inst_claim_approved: number;
  inst_claim_reject: number;
  inst_pay_complete: number;
  inst_pay_partially: number;
  inst_pay_pending: number;
  [key: string]: any;
}

export interface DistrictInstallItem {
  district: string;
  inst_complete: number;
}

export interface DistrictWiseDetail {
  district: string;
  site_count: number;
  complete: number;
  pending: number;
  verify_pending: number;
  verify_approved: number;
  verify_reject: number;
  doc_approved: number;
  doc_pending: number;
  doc_reject: number;
  inst_claim_raised: number;
  inst_claim_approved: number;
  inst_claim_reject: number;
  inst_pay_complete: number;
  inst_pay_partially: number;
  inst_pay_pending: number;
  [key: string]: any;
}

export interface DistrictMonthItem {
  month_year: string;
  monthly_installations: number;
}

export interface AssamSwpDashboardResponse {
  swp: DashboardSwpSummary;
  district_install?: DistrictInstallItem[];
  districtwise?: DistrictWiseDetail[];
  district_installation_month?: DistrictMonthItem[];
  monthly_installations?: DistrictMonthItem[];
}

export interface ApiResponse<T = any> {
  status?: boolean;
  success?: boolean;
  message?: string;
  data?: T;
  errors?: Record<string, string[]>;
  error?: string;
  meta?: {
    status?: string;
    count?: number;
    district?: string;
  };
}

/* ═══════════════════ Service Implementation ═══════════════════ */

class AssamSwpService {
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
    const baseClean = (API_BASE_URL || 'https://klkerp.com/api').replace(/\/+$/, '');
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

    let lastError: Error | null = null;
    let lastRes: Response | null = null;

    for (const u of urls) {
      try {
        const res = await fetch(u, options);
        if (res.status === 404) {
          lastRes = res;
          continue;
        }
        return res;
      } catch (err: any) {
        lastError = err;
      }
    }

    if (lastRes) return lastRes;
    throw lastError || new Error(`Failed to request ${urlOrEndpoint}`);
  }

  /**
   * 1. Assigned Installation List
   * GET /assam/swp-view-assign-installation-sites
   */
  async getAssignedInstallationSites(): Promise<AssignedSiteItem[]> {
    const res = await this.fetchWithFallback(ASSAM_SWP_API.ASSIGNED_SITES, {
      method: 'GET',
      headers: this.getHeaders(),
    });
    const json: any = await res.json();
    if (!res.ok && !json.status && !json.success) {
      throw new Error(json.message || `Failed to fetch assigned installation sites (${res.status})`);
    }
    if (Array.isArray(json.data)) return json.data;
    if (Array.isArray(json)) return json;
    if (json.data && typeof json.data === 'object') return [json.data];
    return [];
  }

  /**
   * 2. Assign Site Detail
   * GET /assam/swp-view-assign-installation-detail?id=12
   */
  async getAssignSiteDetail(id: number | string | { id?: number | string; assign_id?: number | string; assignment_id?: number | string }): Promise<AssignSiteDetailResponse> {
    const rawId =
      typeof id === 'object' && id !== null
        ? (id.assign_id ?? (id as any).assignment_id ?? (id as any).assignId ?? (id as any).assign?.id ?? id.id)
        : id;
    const numId = Number(rawId);
    if (!Number.isFinite(numId) || numId <= 0) {
      throw new Error(`Invalid assignment ID provided (${String(rawId)}). A valid integer assign ID is required.`);
    }
    const cleanId = Math.floor(numId);
    const url = ASSAM_SWP_API.ASSIGN_SITE_DETAIL(cleanId);
    const res = await this.fetchWithFallback(url, {
      method: 'GET',
      headers: this.getHeaders(),
    });
    const json: any = await res.json().catch(() => ({}));
    if (!res.ok && !json.status && !json.success) {
      const errList = json.errors?.id ? json.errors.id.join(', ') : json.message;
      throw new Error(errList || `Failed to fetch assign site detail (${res.status})`);
    }
    return json.data || json;
  }

  /**
   * 3. Accept Installation
   * GET /assam/swp-assign-installation-accept?id=12
   * Accepts site_id (or assign_id if supported by backend).
   * Effect: assigns.status = 2 set hota hai aur us assign ki sabhi sites me assam_swps.inst_accept = 1 ho jata hai.
   */
  async acceptInstallation(
    id: number | string | { id?: number | string; site_id?: any; siteId?: any; assign_id?: number | string; assignment_id?: number | string },
    assignId?: number | string
  ): Promise<ApiResponse> {
    let rawId: any = id;
    let fallbackAssign = assignId;
    if (typeof id === 'object' && id !== null) {
      const candidateSite = (id as any).site_id ?? (id as any).siteId;
      fallbackAssign = fallbackAssign ?? (id.assign_id ?? (id as any).assignment_id ?? (id as any).assignId ?? (id as any).assign?.id ?? id.id);
      if (candidateSite !== undefined && candidateSite !== null) {
        if (typeof candidateSite === 'number') rawId = candidateSite;
        else if (typeof candidateSite === 'string') {
          const match = candidateSite.match(/\d+/);
          if (match) rawId = match[0];
        } else if (Array.isArray(candidateSite) && candidateSite.length > 0) {
          rawId = candidateSite[0];
        }
      } else {
        rawId = fallbackAssign;
      }
    }
    const numId = Number(rawId);
    if (!Number.isFinite(numId) || numId <= 0) {
      throw new Error(
        `Invalid ID provided: "${String(rawId)}". A valid integer ID is required.`
      );
    }
    const cleanId = Math.floor(numId);
    const url = ASSAM_SWP_API.ACCEPT_INSTALLATION(cleanId, fallbackAssign);
    const res = await this.fetchWithFallback(url, {
      method: 'GET',
      headers: this.getHeaders(),
    });
    const json: ApiResponse = await res.json().catch(() => ({}));
    if (!res.ok || json.status === false || json.success === false) {
      const fieldError = json.errors ? Object.values(json.errors).flat().join(', ') : '';
      const err = new Error(fieldError || json.message || `Failed to accept installation (${res.status})`);
      (err as any).status = res.status;
      (err as any).data = json;
      throw err;
    }
    return json;
  }

  /**
   * 4. Installable Site Name List
   * GET /assam/swp-install-site-name
   */
  async getInstallableSiteNameList(): Promise<InstallableSiteName[]> {
    const res = await this.fetchWithFallback(ASSAM_SWP_API.INSTALL_SITE_NAME_LIST, {
      method: 'GET',
      headers: this.getHeaders(),
    });
    const json: ApiResponse<InstallableSiteName[]> = await res.json();
    if (!res.ok && !json.status && !json.success) {
      throw new Error(json.message || `Failed to fetch installable sites list (${res.status})`);
    }
    return Array.isArray(json.data) ? json.data : [];
  }

  /**
   * 5. Install Site Details
   * GET /assam/swp-install-site-details?site_id=101
   */
  async getInstallSiteDetails(siteId: number | string): Promise<InstallSiteDetails> {
    const url = ASSAM_SWP_API.INSTALL_SITE_DETAILS(siteId);
    const res = await this.fetchWithFallback(url, {
      method: 'GET',
      headers: this.getHeaders(),
    });
    const json: ApiResponse<InstallSiteDetails> = await res.json();
    if (!res.ok || (json.status === false || json.success === false)) {
      const errList = json.errors?.site_id ? json.errors.site_id.join(', ') : json.message;
      throw new Error(errList || `Failed to fetch install site details (${res.status})`);
    }
    return json.data || (json as any);
  }

  /**
   * 6. Site Install Store
   * POST /assam/swp-install-site-store (multipart/form-data)
   */
  async storeSiteInstall(formData: FormData): Promise<ApiResponse> {
    const res = await this.fetchWithFallback(ASSAM_SWP_API.INSTALL_SITE_STORE, {
      method: 'POST',
      headers: this.getHeaders(true),
      body: formData,
    });
    const json: ApiResponse = await res.json();
    if (!res.ok || json.status === false || json.success === false) {
      let msg = json.message;
      if (json.errors && Object.keys(json.errors).length > 0) {
        msg = Object.entries(json.errors)
          .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`)
          .join('\n');
      }
      throw new Error(msg || `Failed to submit installation (${res.status})`);
    }
    return json;
  }

  /**
   * 7. View Install Site (Summary + List)
   * GET /assam/swp-view-install-site
   */
  async getViewInstallSite(): Promise<ViewInstallSiteResponse> {
    const res = await this.fetchWithFallback(ASSAM_SWP_API.VIEW_INSTALL_SITE, {
      method: 'GET',
      headers: this.getHeaders(),
    });
    const json: any = await res.json();
    if (!res.ok && !json.status && !json.success && !Array.isArray(json)) {
      throw new Error(json.message || `Failed to fetch installed sites (${res.status})`);
    }

    // Extract sites array robustly from all backend response formats
    let sites: InstalledSiteItem[] = [];
    if (Array.isArray(json)) {
      sites = json;
    } else if (Array.isArray(json.data)) {
      sites = json.data;
    } else if (Array.isArray(json.sites)) {
      sites = json.sites;
    } else if (Array.isArray(json.data?.sites)) {
      sites = json.data.sites;
    }

    // Normalize site fields (e.g. module_serial_no, latitude, longitude, string status codes)
    sites = sites.map((s: any) => {
      const rawDoc =
        s.inst_doc ||
        s.doc_file ||
        s.document ||
        s.doc ||
        s.file ||
        s.document_file ||
        s.doc_path ||
        s.file_path ||
        s.attachment ||
        s.doc_name ||
        s.document_name ||
        '';

      const rawDocStatus =
        s.inst_doc_status ??
        s.doc_status ??
        s.document_status ??
        s.documentStatus ??
        s.docStatus ??
        s.instDocStatus;

      let numDocStatus = 0;
      if (rawDocStatus !== undefined && rawDocStatus !== null && rawDocStatus !== '') {
        if (typeof rawDocStatus === 'string') {
          const lower = rawDocStatus.trim().toLowerCase();
          if (lower === 'approved' || lower === 'complete' || lower === 'verified' || lower === '2') {
            numDocStatus = 2;
          } else if (lower === 'rejected' || lower === 'reject' || lower === '3') {
            numDocStatus = 3;
          } else if (lower === 'pending' || lower === 'submitted' || lower === 'uploaded' || lower === '1') {
            numDocStatus = 1;
          } else if (lower === '0' || lower === 'not submitted' || lower === 'not_submitted') {
            numDocStatus = rawDoc ? 1 : 0;
          } else {
            const parsed = Number(rawDocStatus);
            numDocStatus = isNaN(parsed) ? (rawDoc ? 1 : 0) : parsed;
          }
        } else if (typeof rawDocStatus === 'number') {
          numDocStatus = rawDocStatus === 0 && rawDoc ? 1 : rawDocStatus;
        }
      } else {
        numDocStatus = rawDoc ? 1 : 0;
      }

      return {
        ...s,
        inst_doc: rawDoc,
        inst_doc_status: numDocStatus,
        module_serials: s.module_serials || s.module_serial_no || '',
        module_serial_no: s.module_serial_no || s.module_serials || '',
        inst_latitude: s.inst_latitude || s.latitude || '',
        inst_longitude: s.inst_longitude || s.longitude || '',
        latitude: s.latitude || s.inst_latitude || '',
        longitude: s.longitude || s.inst_longitude || '',
        inst_verify_status: Number(s.inst_verify_status ?? s.verify_status ?? 0),
        inst_claim_status: Number(s.inst_claim_status ?? s.claim_status ?? 0),
        inst_status: Number(s.inst_status ?? 0),
      };
    });

    const rawDetail = json.data?.install_detail || json.install_detail;
    const install_detail = rawDetail || {
      total: sites.length,
      complete: sites.filter((s) => Number(s.inst_status) === 1 || Number(s.complete) === 1).length,
      pending: sites.filter((s) => !s.inst_status || Number(s.inst_status) === 0).length,
      verify_approved: sites.filter((s) => Number(s.inst_verify_status) === 1).length,
      verify_pending: sites.filter((s) => !s.inst_verify_status || Number(s.inst_verify_status) === 0).length,
      verify_reject: sites.filter((s) => Number(s.inst_verify_status) === 2).length,
      doc_approved: sites.filter((s) => Number(s.inst_doc_status) === 2).length,
      doc_pending: sites.filter((s) => Number(s.inst_doc_status) === 1).length,
      doc_reject: sites.filter((s) => Number(s.inst_doc_status) === 3).length,
      claim_approved: sites.filter((s) => Number(s.inst_claim_status) === 2).length,
      claim_pending: sites.filter((s) => Number(s.inst_claim_status) === 1).length,
      claim_reject: sites.filter((s) => Number(s.inst_claim_status) === 3).length,
      paid: sites.filter((s) => Number(s.inst_pay_status) === 1).length,
      partially: sites.filter((s) => Number(s.inst_pay_status) === 2).length,
    };

    return {
      assign: Number(json.data?.assign ?? json.assign ?? sites.length),
      install_detail,
      sites,
    };
  }

  /**
   * 8. Update Install Site (Load for Edit)
   * GET /assam/swp-install-site-update?id=101
   */
  async getInstallSiteForUpdate(id: number | string): Promise<SiteUpdateDataResponse> {
    const url = ASSAM_SWP_API.INSTALL_SITE_UPDATE(id);
    const res = await this.fetchWithFallback(url, {
      method: 'GET',
      headers: this.getHeaders(),
    });
    const json: ApiResponse<SiteUpdateDataResponse> = await res.json();
    if (!res.ok && !json.status && !json.success) {
      throw new Error(json.message || `Failed to load site details for update (${res.status})`);
    }
    return json.data || (json as any);
  }

  /**
   * 9. Update Install Site Store
   * POST /assam/swp-install-site-update-store (multipart/form-data)
   */
  async updateSiteInstall(formData: FormData): Promise<ApiResponse> {
    const res = await this.fetchWithFallback(ASSAM_SWP_API.INSTALL_SITE_UPDATE_STORE, {
      method: 'POST',
      headers: this.getHeaders(true),
      body: formData,
    });
    const json: ApiResponse = await res.json();
    if (!res.ok || json.status === false || json.success === false) {
      let msg = json.message;
      if (json.errors && Object.keys(json.errors).length > 0) {
        msg = Object.entries(json.errors)
          .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`)
          .join('\n');
      }
      throw new Error(msg || `Failed to update installation (${res.status})`);
    }
    return json;
  }

  /**
   * 10. Installation Document Submit
   * POST /assam/swp-installation-doc-submit (multipart/form-data)
   * Required payload: site_id, doc_file
   */
  async submitInstallationDoc(formData: FormData): Promise<ApiResponse> {
    // Ensure ID aliases are populated
    if (!formData.has('site_id') && formData.has('id')) {
      formData.append('site_id', formData.get('id') as string);
    }
    if (!formData.has('id') && formData.has('site_id')) {
      formData.append('id', formData.get('site_id') as string);
    }
    // Ensure all file aliases are populated
    const fileBlob =
      formData.get('doc_file') ||
      formData.get('inst_doc') ||
      formData.get('document') ||
      formData.get('file') ||
      formData.get('doc');
    if (fileBlob && fileBlob instanceof Blob) {
      if (!formData.has('doc_file')) formData.append('doc_file', fileBlob);
      if (!formData.has('inst_doc')) formData.append('inst_doc', fileBlob);
      if (!formData.has('document')) formData.append('document', fileBlob);
      if (!formData.has('file')) formData.append('file', fileBlob);
    }

    const res = await this.fetchWithFallback(ASSAM_SWP_API.DOC_SUBMIT, {
      method: 'POST',
      headers: this.getHeaders(true),
      body: formData,
    });
    const json: ApiResponse = await res.json();
    if (!res.ok || json.status === false || json.success === false) {
      let msg = json.message;
      if (json.errors && Object.keys(json.errors).length > 0) {
        msg = Object.entries(json.errors)
          .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`)
          .join('\n');
      }
      throw new Error(msg || `Failed to submit installation document (${res.status})`);
    }
    return json;
  }

  /**
   * 11. View Claim
   * GET /assam/swp-installation-claim
   */
  async getViewClaims(): Promise<ViewClaimResponse> {
    const res = await this.fetchWithFallback(ASSAM_SWP_API.VIEW_CLAIM, {
      method: 'GET',
      headers: this.getHeaders(),
    });
    const json: ApiResponse<any> = await res.json();
    if (!res.ok && !json.status && !json.success) {
      throw new Error(json.message || `Failed to fetch claims (${res.status})`);
    }
    const rawData = json.data;
    let claims: ClaimItem[] = [];
    let sites: ClaimEligibleSite[] = [];

    if (Array.isArray(rawData)) {
      claims = rawData;
    } else if (rawData && typeof rawData === 'object') {
      claims = Array.isArray(rawData.data) ? rawData.data : Array.isArray(rawData.claims) ? rawData.claims : [];
      sites = Array.isArray(rawData.sites) ? rawData.sites : [];
    }

    if (Array.isArray(json.sites) && sites.length === 0) {
      sites = json.sites;
    }

    return { data: claims, sites };
  }

  /**
   * Fetch claim eligible completed sites:
   * 1. Checks getViewClaims() for backend sites array.
   * 2. If empty or alongside, pulls from completed installations (getViewInstallSite).
   * 3. Falls back to installable site name list (getInstallableSiteNameList).
   * Deduplicates by site ID.
   */
  async getClaimEligibleSites(): Promise<ClaimEligibleSite[]> {
    const list: ClaimEligibleSite[] = [];
    const seen = new Set<string | number>();

    // 1. From view claim response
    try {
      const claimRes = await this.getViewClaims();
      if (Array.isArray(claimRes.sites)) {
        for (const s of claimRes.sites) {
          const sid = Number(s.id);
          if (sid && !seen.has(sid)) {
            seen.add(sid);
            list.push({
              id: sid,
              farmer_name: s.farmer_name || `Site #${sid}`,
              district: s.district,
              state: s.state,
              inst_verify_status: s.inst_verify_status,
              inst_doc_status: s.inst_doc_status,
              inst_claim_status: s.inst_claim_status,
            });
          }
        }
      }
    } catch (e) {
      console.warn('[AssamSwpService] getViewClaims for sites warning:', e);
    }

    // 2. From completed installation sites (API 7)
    try {
      const installRes = await this.getViewInstallSite();
      if (Array.isArray(installRes.sites)) {
        for (const s of installRes.sites) {
          const sid = Number(s.id || s.site_id);
          if (sid && !seen.has(sid)) {
            seen.add(sid);
            list.push({
              id: sid,
              farmer_name: s.farmer_name || `Site #${sid}`,
              district: s.district,
              state: s.state,
              inst_verify_status: Number(s.inst_verify_status ?? 0),
              inst_doc_status: Number(s.inst_doc_status ?? 0),
              inst_claim_status: Number(s.inst_claim_status ?? 0),
              inst_status: Number(s.inst_status ?? 0),
            });
          }
        }
      }
    } catch (e) {
      console.warn('[AssamSwpService] getViewInstallSite for sites warning:', e);
    }

    // 3. Fallback to installable site names (API 4)
    if (list.length === 0) {
      try {
        const nameRes = await this.getInstallableSiteNameList();
        if (Array.isArray(nameRes)) {
          for (const s of nameRes) {
            const sid = Number(s.site_id || (s as any).id);
            if (sid && !seen.has(sid)) {
              seen.add(sid);
              list.push({
                id: sid,
                farmer_name: s.site_name || (s as any).farmer_name || `Site #${sid}`,
              });
            }
          }
        }
      } catch (e) {
        console.warn('[AssamSwpService] getInstallableSiteNameList for sites warning:', e);
      }
    }

    return list;
  }

  /**
   * 12. Add Claim
   * POST /assam/swp-installation-add-claim (multipart/form-data)
   */
  async addClaim(formData: FormData): Promise<ApiResponse> {
    // Backend validates 'site_id' as array. Delete scalar 'site_id' if present alongside 'site_id[]'
    if (formData.has('site_id') && formData.has('site_id[]')) {
      formData.delete('site_id');
    }
    // If only scalar site_id was provided, ensure site_id[] is appended
    if (formData.has('site_id') && !formData.has('site_id[]')) {
      const val = formData.get('site_id');
      if (val) {
        formData.append('site_id[]', String(val));
        formData.delete('site_id');
      }
    }

    const res = await this.fetchWithFallback(ASSAM_SWP_API.ADD_CLAIM, {
      method: 'POST',
      headers: this.getHeaders(true),
      body: formData,
    });
    const json: ApiResponse = await res.json();
    if (!res.ok || json.status === false || json.success === false) {
      let msg = json.message;
      if (json.errors && Object.keys(json.errors).length > 0) {
        msg = Object.entries(json.errors)
          .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`)
          .join('\n');
      }
      throw new Error(msg || `Failed to raise payment claim (${res.status})`);
    }
    return json;
  }

  /**
   * 13. Update Claim
   * POST /assam/swp-installation-update-claim (multipart/form-data)
   */
  async updateClaim(formData: FormData): Promise<ApiResponse> {
    // Backend requires 'update_id' field
    if (formData.has('id') && !formData.has('update_id')) {
      const idVal = formData.get('id');
      if (idVal) formData.append('update_id', String(idVal));
    }
    // Backend validates 'site_id' as array. Delete scalar 'site_id' if present alongside 'site_id[]'
    if (formData.has('site_id') && formData.has('site_id[]')) {
      formData.delete('site_id');
    }

    const res = await this.fetchWithFallback(ASSAM_SWP_API.UPDATE_CLAIM, {
      method: 'POST',
      headers: this.getHeaders(true),
      body: formData,
    });
    const json: ApiResponse = await res.json();
    if (!res.ok || json.status === false || json.success === false) {
      let msg = json.message;
      if (json.errors && Object.keys(json.errors).length > 0) {
        msg = Object.entries(json.errors)
          .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`)
          .join('\n');
      }
      throw new Error(msg || `Failed to update claim (${res.status})`);
    }
    return json;
  }

  /**
   * 14. Installation Dashboard
   * GET /assam/swp-installation-dashboard
   */
  async getDashboardData(): Promise<AssamSwpDashboardResponse> {
    const res = await this.fetchWithFallback(ASSAM_SWP_API.DASHBOARD, {
      method: 'GET',
      headers: this.getHeaders(),
    });
    const json: ApiResponse<AssamSwpDashboardResponse> = await res.json();
    if (!res.ok && !json.status && !json.success) {
      throw new Error(json.message || `Failed to fetch dashboard data (${res.status})`);
    }
    const raw = json.data || (json as any);
    return {
      swp: raw.swp || {
        site_count: 0,
        complete: 0,
        pending: 0,
        verify_pending: 0,
        verify_approved: 0,
        verify_reject: 0,
        doc_approved: 0,
        doc_pending: 0,
        doc_reject: 0,
        inst_claim_raised: 0,
        inst_claim_approved: 0,
        inst_claim_reject: 0,
        inst_pay_complete: 0,
        inst_pay_partially: 0,
        inst_pay_pending: 0,
      },
      district_install: Array.isArray(raw.district_install) ? raw.district_install : [],
      districtwise: Array.isArray(raw.districtwise) ? raw.districtwise : [],
      district_installation_month: Array.isArray(raw.district_installation_month)
        ? raw.district_installation_month
        : Array.isArray(raw.monthly_installations)
        ? raw.monthly_installations
        : [],
    };
  }

  /**
   * 15. View Dashboard By Status
   * GET /assam/swp-installation-view-dashboard/{status}
   * Allowed statuses: total, complete, pending, verify-pending, verify-approved, verify-reject,
   * doc-approved, doc-pending, doc-reject, claim-raised, claim-approved, claim-reject,
   * pay-complete, pay-partial, pay-pending
   */
  async getDashboardByStatus(status: string): Promise<{ meta?: any; data: InstalledSiteItem[] }> {
    const validStatus = normalizeAssamDashboardStatus(status);
    const url = ASSAM_SWP_API.VIEW_DASHBOARD_BY_STATUS(validStatus);
    const res = await this.fetchWithFallback(url, {
      method: 'GET',
      headers: this.getHeaders(),
    });
    const json: ApiResponse<InstalledSiteItem[]> = await res.json();
    if (!res.ok || json.status === false || json.success === false) {
      throw new Error(json.message || `Failed to fetch sites by status "${validStatus}" (${res.status})`);
    }
    return {
      meta: json.meta,
      data: Array.isArray(json.data) ? json.data : [],
    };
  }

  /**
   * 16. Districtwise By Status
   * GET /assam/swp-installation-view-districtwise/{status}/{district}
   */
  async getDistrictwiseByStatus(status: string, district: string): Promise<{ meta?: any; data: InstalledSiteItem[] }> {
    const validStatus = normalizeAssamDashboardStatus(status);
    const cleanDistrict = (district || '').trim();
    const url = ASSAM_SWP_API.VIEW_DISTRICTWISE_BY_STATUS(validStatus, cleanDistrict);
    const res = await this.fetchWithFallback(url, {
      method: 'GET',
      headers: this.getHeaders(),
    });
    const json: ApiResponse<InstalledSiteItem[]> = await res.json();
    if (!res.ok || json.status === false || json.success === false) {
      throw new Error(json.message || `Failed to fetch district sites by status "${validStatus}" in "${cleanDistrict}" (${res.status})`);
    }
    return {
      meta: json.meta,
      data: Array.isArray(json.data) ? json.data : [],
    };
  }
}

/**
 * Valid allowed status keys for Assam SWP Dashboard Drilldown APIs (APIs 15 & 16)
 */
export type AssamDashboardStatus =
  | 'total'
  | 'complete'
  | 'pending'
  | 'verify-pending'
  | 'verify-approved'
  | 'verify-reject'
  | 'doc-approved'
  | 'doc-pending'
  | 'doc-reject'
  | 'claim-raised'
  | 'claim-approved'
  | 'claim-reject'
  | 'pay-complete'
  | 'pay-partial'
  | 'pay-pending';

/**
 * Normalizes any dashboard status string (e.g. 'Complete', 'VerifyApproved', 'PaymentComplete')
 * to the exact backend-accepted string (API 15 & 16 specification).
 */
export function normalizeAssamDashboardStatus(rawStatus: string): AssamDashboardStatus {
  if (!rawStatus) return 'total';
  const clean = rawStatus.trim().toLowerCase();

  const exactSet = new Set<AssamDashboardStatus>([
    'total',
    'complete',
    'pending',
    'verify-pending',
    'verify-approved',
    'verify-reject',
    'doc-approved',
    'doc-pending',
    'doc-reject',
    'claim-raised',
    'claim-approved',
    'claim-reject',
    'pay-complete',
    'pay-partial',
    'pay-pending',
  ]);
  if (exactSet.has(clean as AssamDashboardStatus)) {
    return clean as AssamDashboardStatus;
  }

  const aliasMap: Record<string, AssamDashboardStatus> = {
    'all': 'total',
    'allocated': 'total',
    'total-sites': 'total',
    'site-count': 'total',

    'completed': 'complete',
    'installed': 'complete',

    'verify_pending': 'verify-pending',
    'verifypending': 'verify-pending',
    'audit-pending': 'verify-pending',

    'verify_approved': 'verify-approved',
    'verifyapproved': 'verify-approved',
    'approved': 'verify-approved',
    'audit-approved': 'verify-approved',

    'verify_reject': 'verify-reject',
    'verifyreject': 'verify-reject',
    'verify-rejected': 'verify-reject',
    'verify_rejected': 'verify-reject',
    'rejected': 'verify-reject',
    'rework': 'verify-reject',

    'doc_approved': 'doc-approved',
    'docapproved': 'doc-approved',

    'doc_pending': 'doc-pending',
    'docpending': 'doc-pending',

    'doc_reject': 'doc-reject',
    'docreject': 'doc-reject',
    'doc-rejected': 'doc-reject',
    'doc_rejected': 'doc-reject',

    'claim_raised': 'claim-raised',
    'claimraised': 'claim-raised',
    'inst_claim_raised': 'claim-raised',

    'claim_approved': 'claim-approved',
    'claimapproved': 'claim-approved',
    'inst_claim_approved': 'claim-approved',

    'claim_reject': 'claim-reject',
    'claimreject': 'claim-reject',
    'claim-rejected': 'claim-reject',
    'inst_claim_reject': 'claim-reject',

    'paymentcomplete': 'pay-complete',
    'payment-complete': 'pay-complete',
    'pay_complete': 'pay-complete',
    'inst_pay_complete': 'pay-complete',
    'paid': 'pay-complete',
    'settled': 'pay-complete',

    'paymentpartial': 'pay-partial',
    'payment-partial': 'pay-partial',
    'payment-partially': 'pay-partial',
    'pay_partial': 'pay-partial',
    'pay-partially': 'pay-partial',
    'inst_pay_partially': 'pay-partial',
    'partial': 'pay-partial',

    'paymentpending': 'pay-pending',
    'payment-pending': 'pay-pending',
    'pay_pending': 'pay-pending',
    'inst_pay_pending': 'pay-pending',
  };

  const normalized = clean.replace(/[_\s]+/g, '-');
  if (exactSet.has(normalized as AssamDashboardStatus)) {
    return normalized as AssamDashboardStatus;
  }
  if (aliasMap[clean]) return aliasMap[clean];
  if (aliasMap[normalized]) return aliasMap[normalized];
  if (aliasMap[clean.replace(/[-_]/g, '')]) return aliasMap[clean.replace(/[-_]/g, '')];

  return 'complete';
}

export const assamSwpService = new AssamSwpService();
export default assamSwpService;
