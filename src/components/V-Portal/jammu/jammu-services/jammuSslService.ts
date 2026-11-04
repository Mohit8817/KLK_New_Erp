import { JAMMU_API, ROOT_URL } from '../../V_Portal_APIS/Jammu_API';
import { getAuthHeaders } from './jammuSrt70mwService';

/* ═══════════════════════════════════════════════════════════════════════════
   TypeScript Interfaces for Jammu SSL (Solar Street Light) Installation
   ═══════════════════════════════════════════════════════════════════════════ */

// 1. View Assigned Lights: GET jammu/ssl/installation/view-assigned-light
export interface JammuSslAssignedLightItem {
  id: number;
  company_id?: string;
  vendor?: string | number;
  state?: string;
  volume?: any;
  district?: string;
  block?: string;
  panchayat?: string;
  village?: string;
  sdate?: string;
  ldate?: string;
  start_date?: string;
  end_date?: string;
  deadline?: string;
  insp_code?: string | null;
  sitecount?: string | number;
  site_count?: string | number;
  count?: string | number;
  match_material?: number;
  uid_file?: string;
  unique_ids_file?: string;
  file?: string;
  battery_no_file?: string | null;
  panel_no_file?: string | null;
  sim_no_file?: string | null;
  imei_no_file?: string | null;
  remark?: string;
  remarks?: string;
  status: number; // 1 = Assigned/Pending, 2 = Accepted
  created_by?: string;
  updated_by?: string | null;
  created_at?: string;
  updated_at?: string;
  [key: string]: any;
}

// 3. Fetch Site Name: GET jammu/ssl/installation/fetch-site-name
export interface JammuSslLightDropdownItem {
  id: number;
  village?: string;
  unique_id?: string;
  panchayat?: string;
  district?: string;
  [key: string]: any;
}

// 4. Fetch Site Detail: GET jammu/ssl/installation/fetch-site-detail?ssl_id={id}
export interface JammuSslLightDetail {
  id: number;
  state?: string;
  district?: string;
  block?: string;
  village?: string;
  phase?: string;
  address?: string;
  beneficiary_name?: string | null;
  contact_no?: string | null;
  ward_no?: string | null;
  pole_no?: string | null;
  imei_no?: string | null;
  battery_serial_no?: string | null;
  module_no?: string | null;
  sim_no?: string | null;
  serial_no?: string | null;
  material_supply?: number | string | null;
  material_inspection?: number | string | null;
  installation?: number | string | null;
  installation_date?: string | null;
  vendor_name?: string;
  vendor?: string;
  [key: string]: any;
}

// 6. View Complete Sites: GET jammu/ssl/installation/view-complete-site
export interface JammuSslCompletedSiteItem {
  id: number;
  state?: string;
  phase?: string;
  district?: string;
  block?: string;
  village?: string;
  beneficiary_name?: string;
  contact_no?: string;
  latitude?: string;
  longitude?: string;
  imei_no?: string;
  sim_no?: string;
  battery_serial_no?: string;
  battery_no?: string;
  module_no?: string;
  panel_no?: string;
  light_file?: string;
  light_image?: string;
  remark?: string;
  inst_remark?: string;
  inst_verify_status?: number;
  verify_status?: number;
  inst_claim_status?: number;
  claim_status?: number;
  inst_pay_status?: number;
  payment_status?: number;
  inst_status?: number;
  created_at?: string;
  updated_at?: string;
  [key: string]: any;
}

export interface JammuSslCompleteSiteData {
  loginId?: number;
  loginName?: string;
  claimedapplicable?: number;
  claimedapplicable1?: number[];
  approvedsite?: number;
  verifypending?: number;
  rejectsite?: number;
  paymentsitecount?: number;
  complete?: number;
  totalsite?: number;
  pendingsite?: number;
  paymentsite?: JammuSslCompletedSiteItem[];
  completesite?: JammuSslCompletedSiteItem[];
  [key: string]: any;
}

// 7. Update Site (Fetch for edit): GET jammu/ssl/installation/update-site?ssl_id={id}
export interface JammuSslUpdateSiteLoadData {
  loginId?: number;
  company_id?: number;
  jammussl?: JammuSslCompletedSiteItem;
  [key: string]: any;
}

// 10. View Claim Requests: GET jammu/ssl/installation/view-claim-request-deatils
export interface JammuSslClaimItem {
  id: number;
  vendor_id?: number;
  vendor_name?: string;
  state?: string;
  claim_site_count?: number;
  claim_raised_date?: string;
  claim_amount?: string | number;
  claim_invoice?: string;
  claim_update_date?: string;
  updated_at?: string;
  claim_status?: number; // 1 = Raised, 2 = Approved, 3 = Rejected
  payment_status?: number;
  payment_date?: string;
  payment_amount?: string | number;
  payment_remark?: string;
  [key: string]: any;
}

export interface JammuSslClaimRequestResponseData {
  loginId?: number;
  claimraised?: JammuSslClaimItem[];
  [key: string]: any;
}

// 14. View SSL Complaints / AMC: GET jammu/ssl/complaint/view-data
export interface JammuSslComplaintItem {
  id: number;
  complaint_id?: string | number;
  complaint_date?: string;
  complaint?: string;
  complaint_issue?: string;
  state?: string;
  district?: string;
  block?: string;
  panchyat?: string;
  panchayat?: string;
  ward_no?: string;
  pole_no?: string;
  beneficiary_name?: string;
  site_name?: string;
  contact_no?: string;
  phone?: string;
  mobile?: string;
  latitude?: string | number;
  longitude?: string | number;
  along_with_pole?: string;
  luminary_no?: string;
  sim_no?: string;
  sim?: string;
  battery_serial_no?: string;
  battery_no?: string;
  module_no?: string;
  panel_no?: string;
  date_of_installation?: string;
  installation_date?: string;
  document?: string;
  file?: string;
  complaint_status?: string | number;
  status?: string | number;
  resolved_by?: string;
  resolver_name?: string;
  closed_date?: string;
  resolve_date?: string;
  resolver_email?: string;
  resolver_phone?: string;
  resolver_contact?: string;
  resolved_document?: string;
  resolved_remark?: string;
  closer_remark?: string;
  closer_approved?: string | number;
  [key: string]: any;
}

// 11. Installation Dashboard: GET jammu/ssl/installation/installation-dashboard
export interface JammuSslDashboardTotals {
  site_count: number;
  complete: number;
  pending: number;
  verify_pending: number;
  verify_approved: number;
  verify_reject: number;
  claim_applicable: number;
  claim_raised: number;
  claim_approved: number;
  pay_done: number;
  pay_partial: number;
  pay_pending: number;
}

export interface JammuSslDistrictInstall {
  district: string;
  inst_complete: number;
}

export interface JammuSslDistrictWise extends Partial<JammuSslDashboardTotals> {
  district: string;
  site_count?: number;
  complete?: number;
  pending?: number;
}

export interface JammuSslMonthlyInstall {
  month_year: string;
  monthly_installations: number;
}

export interface JammuSslDashboardData {
  ssl?: JammuSslDashboardTotals;
  district_install?: JammuSslDistrictInstall[];
  districtwise?: JammuSslDistrictWise[];
  district_installation_month?: JammuSslMonthlyInstall[];
  [key: string]: any;
}

// 12 & 13. Dashboard Status Sites: GET installation-view-dashboard/{status}
export interface JammuSslStatusSiteItem {
  id: number;
  district?: string;
  village?: string;
  block?: string;
  state?: string;
  inst_status?: number;
  beneficiary_name?: string;
  contact_no?: string;
  imei_no?: string;
  sim_no?: string;
  module_no?: string;
  battery_serial_no?: string;
  light_file?: string;
  latitude?: string;
  longitude?: string;
  remark?: string;
  inst_remark?: string;
  inst_verify_status?: number;
  inst_claim_status?: number;
  inst_pay_status?: number;
  [key: string]: any;
}

export interface JammuSslStatusResponseData {
  status: string;
  count: number;
  swp: JammuSslStatusSiteItem[];
}

/* ═══════════════════════════════════════════════════════════════════════════
   Media Resolution Helpers
   ═══════════════════════════════════════════════════════════════════════════ */

export function getJammuSslMediaCandidates(path?: string | null): string[] {
  if (!path) return [];
  const trimmed = String(path).trim();
  if (!trimmed) return [];
  if (/^(https?:|data:|blob:)/i.test(trimmed)) return [trimmed];

  const normalized = trimmed.replace(/^\/+/, '');
  const filename = normalized.split('/').pop() || normalized;
  const candidates: string[] = [];

  candidates.push(`${ROOT_URL}/${normalized}`);
  candidates.push(`${ROOT_URL}/uploads/jammu/ssl/installation/assignsite/${filename}`);
  candidates.push(`${ROOT_URL}/uploads/jammu/installation/ssl/light/${filename}`);
  candidates.push(`${ROOT_URL}/uploads/jammu/installation/ssl/claim/${filename}`);
  candidates.push(`${ROOT_URL}/uploads/jammu/installation/ssl/${filename}`);
  candidates.push(`${ROOT_URL}/uploads/jammu/ssl/${filename}`);
  candidates.push(`${ROOT_URL}/uploads/${filename}`);

  const R2_BASE = ((import.meta.env.VITE_R2_PUBLIC_URL as string | undefined) ?? '').replace(/\/+$/, '');
  if (R2_BASE) {
    candidates.push(`${R2_BASE}/${normalized}`);
    candidates.push(`${R2_BASE}/${filename}`);
  }

  return Array.from(new Set(candidates));
}

export function resolveJammuSslMediaUrl(path?: string | null): string {
  if (!path) return '';
  if (/^(https?:|data:|blob:)/i.test(path)) return path;
  const candidates = getJammuSslMediaCandidates(path);
  return candidates[0] || `${ROOT_URL}/${path.replace(/^\/+/, '')}`;
}

/**
 * Normalizes status string for dashboard status navigation
 */
export function normalizeJammuSslStatus(raw?: string | null): string {
  if (!raw) return 'total';
  const s = String(raw).trim().toLowerCase();
  const MAP: Record<string, string> = {
    total: 'total',
    all: 'total',
    complete: 'completed',
    completed: 'completed',
    pending: 'pending',
    'verify-pending': 'verify-pending',
    verify_pending: 'verify-pending',
    'verify-approved': 'verify-approved',
    verify_approved: 'verify-approved',
    approved: 'verify-approved',
    'verify-reject': 'verify-reject',
    verify_reject: 'verify-reject',
    reject: 'verify-reject',
    rejected: 'verify-reject',
    'claim-applicable': 'claim-applicable',
    claim_applicable: 'claim-applicable',
    'claim-raised': 'claim-raised',
    claim_raised: 'claim-raised',
    'claim-approved': 'claim-approved',
    claim_approved: 'claim-approved',
    'pay-done': 'pay-done',
    pay_done: 'pay-done',
    paid: 'pay-done',
    'pay-partially': 'pay-partially',
    pay_partially: 'pay-partially',
    'pay-partial': 'pay-partially',
    pay_partial: 'pay-partially',
    'pay-pending': 'pay-pending',
    pay_pending: 'pay-pending',
  };
  return MAP[s] || s;
}

/* ═══════════════════════════════════════════════════════════════════════════
   Jammu SSL Service API Implementation (13 Real Endpoints)
   ═══════════════════════════════════════════════════════════════════════════ */

export const jammuSslService = {
  /**
   * 1. View assigned lights
   * GET jammu/ssl/installation/view-assigned-light
   */
  async getAssignedLights(): Promise<JammuSslAssignedLightItem[]> {
    const url = JAMMU_API.INSTALLATION.SSL.VIEW_ASSIGNED_LIGHT;
    const res = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson?.message || `Failed to fetch assigned lights (${res.status})`);
    }

    const json = await res.json();
    return Array.isArray(json?.data) ? json.data : [];
  },

  /**
   * 2. Update assigned light status
   * GET jammu/ssl/installation/update-status-assigned-light?ssl_id={ssl_id}
   */
  async acceptAssignment(sslId: number | string): Promise<{ status: boolean; message: string; data?: any }> {
    const url = JAMMU_API.INSTALLATION.SSL.UPDATE_STATUS_ASSIGNED_LIGHT(sslId);
    const res = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      const errMsg =
        json?.message ||
        (json?.errors && Object.values(json.errors).flat().join(', ')) ||
        `Failed to update assignment status (${res.status})`;
      throw new Error(errMsg);
    }

    return {
      status: true,
      message: json?.message || 'Status Changed Successfully!!!',
      data: json?.data,
    };
  },

  /**
   * 3. Fetch site name (Accepted, pending-install dropdown)
   * GET jammu/ssl/installation/fetch-site-name
   */
  async fetchLightNames(): Promise<JammuSslLightDropdownItem[]> {
    const url = JAMMU_API.INSTALLATION.SSL.FETCH_SITE_NAME;
    const res = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson?.message || `Failed to fetch light names (${res.status})`);
    }

    const json = await res.json();
    return Array.isArray(json?.data) ? json.data : [];
  },

  /**
   * 4. Fetch site detail
   * GET jammu/ssl/installation/fetch-site-detail?ssl_id={ssl_id}
   */
  async fetchLightDetail(sslId: number | string): Promise<JammuSslLightDetail | null> {
    const url = JAMMU_API.INSTALLATION.SSL.FETCH_SITE_DETAIL(sslId);
    const res = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      const msg =
        errJson?.message ||
        (errJson?.errors && Object.values(errJson.errors).flat().join(', ')) ||
        `Failed to fetch site detail (${res.status})`;
      throw new Error(msg);
    }

    const json = await res.json();
    return json?.data ?? null;
  },

  /**
   * 5. Store installation details
   * POST jammu/ssl/installation/site-store
   * Content-Type: multipart/form-data
   */
  async installLightStore(formData: FormData): Promise<{ status: boolean; message: string; data?: any }> {
    const url = JAMMU_API.INSTALLATION.SSL.SITE_STORE;
    const headers = getAuthHeaders(true); // isMultipart = true

    const res = await fetch(url, {
      method: 'POST',
      headers,
      body: formData,
    });

    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      let errMsg = json?.message;
      if (json?.errors && typeof json.errors === 'object') {
        const errorDetails = Object.entries(json.errors)
          .map(([key, val]) => `${key}: ${Array.isArray(val) ? val.join(' ') : String(val)}`)
          .join(' | ');
        errMsg = errMsg ? `${errMsg} (${errorDetails})` : errorDetails;
      }
      throw new Error(errMsg || `Installation submission failed (${res.status})`);
    }

    return {
      status: true,
      message: json?.message || 'Details Updated Successfully!!!',
      data: json?.data,
    };
  },

  /**
   * 6. View complete sites
   * GET jammu/ssl/installation/view-complete-site
   */
  async getViewCompleteSites(): Promise<JammuSslCompleteSiteData> {
    const url = JAMMU_API.INSTALLATION.SSL.VIEW_COMPLETE_SITE;
    const res = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson?.message || `Failed to fetch complete sites (${res.status})`);
    }

    const json = await res.json();
    return json?.data || {};
  },

  /**
   * 7. Update site (fetch for edit)
   * GET jammu/ssl/installation/update-site?ssl_id={ssl_id}
   */
  async getUpdateSiteLoad(sslId: number | string): Promise<JammuSslUpdateSiteLoadData> {
    const url = JAMMU_API.INSTALLATION.SSL.UPDATE_SITE_LOAD(sslId);
    const res = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson?.message || `Failed to load site for editing (${res.status})`);
    }

    const json = await res.json();
    return json?.data || {};
  },

  /**
   * 8. Update site store
   * POST jammu/ssl/installation/update-site-store
   * Content-Type: multipart/form-data
   */
  async updateSiteStore(formData: FormData): Promise<{ status: boolean; message: string; data?: any }> {
    const url = JAMMU_API.INSTALLATION.SSL.UPDATE_SITE_STORE;
    const headers = getAuthHeaders(true);

    const res = await fetch(url, {
      method: 'POST',
      headers,
      body: formData,
    });

    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      let errMsg = json?.message;
      if (json?.errors && typeof json.errors === 'object') {
        const errDetails = Object.values(json.errors).flat().join(', ');
        errMsg = errMsg ? `${errMsg} (${errDetails})` : errDetails;
      }
      throw new Error(errMsg || `Failed to update site installation (${res.status})`);
    }

    return {
      status: true,
      message: json?.message || 'Details Updated Successfully!!!',
      data: json?.data,
    };
  },

  /**
   * 9. Raise claim
   * POST jammu/ssl/installation/claim-raised
   * Content-Type: multipart/form-data
   */
  async raiseClaim(formData: FormData): Promise<{ status: boolean; message: string; data?: any }> {
    const url = JAMMU_API.INSTALLATION.SSL.CLAIM_RAISED;
    const headers = getAuthHeaders(true);

    const res = await fetch(url, {
      method: 'POST',
      headers,
      body: formData,
    });

    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      let errMsg = json?.message;
      if (json?.errors && typeof json.errors === 'object') {
        const errDetails = Object.values(json.errors).flat().join(', ');
        errMsg = errMsg ? `${errMsg} (${errDetails})` : errDetails;
      }
      throw new Error(errMsg || `Failed to raise claim (${res.status})`);
    }

    return {
      status: true,
      message: json?.message || 'Claim Raised Successfully!!!',
      data: json?.data,
    };
  },

  /**
   * 10. View claim requests
   * GET jammu/ssl/installation/view-claim-request-deatils
   */
  async getViewClaimRequests(): Promise<JammuSslClaimRequestResponseData> {
    const url = JAMMU_API.INSTALLATION.SSL.VIEW_CLAIM_REQUEST_DETAILS;
    const res = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson?.message || `Failed to fetch claim requests (${res.status})`);
    }

    const json = await res.json();
    return json?.data || {};
  },

  /**
   * 11. Installation dashboard
   * GET jammu/ssl/installation/installation-dashboard
   */
  async getInstallationDashboard(): Promise<JammuSslDashboardData> {
    const url = JAMMU_API.INSTALLATION.SSL.INSTALLATION_DASHBOARD;
    const res = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson?.message || `Failed to fetch installation dashboard (${res.status})`);
    }

    const json = await res.json();
    return json?.data || {};
  },

  /**
   * 12. View dashboard by status
   * GET jammu/ssl/installation/installation-view-dashboard/{status}
   */
  async getDashboardViewByStatus(status: string): Promise<JammuSslStatusResponseData> {
    const norm = normalizeJammuSslStatus(status);
    const url = JAMMU_API.INSTALLATION.SSL.INSTALLATION_VIEW_DASHBOARD_STATUS(norm);
    const res = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson?.message || `Failed to fetch status details (${res.status})`);
    }

    const json = await res.json();
    return json?.data || { status: norm, count: 0, swp: [] };
  },

  /**
   * 13. View dashboard district-wise
   * GET jammu/ssl/installation/installation-view-dashboard-districtwise/{status}/{district}
   */
  async getDashboardViewDistrictwise(status: string, district: string): Promise<JammuSslStatusResponseData> {
    const norm = normalizeJammuSslStatus(status);
    const url = JAMMU_API.INSTALLATION.SSL.INSTALLATION_VIEW_DASHBOARD_DISTRICTWISE(norm, district);
    const res = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson?.message || `Failed to fetch district status details (${res.status})`);
    }

    const json = await res.json();
    return json?.data || { status: norm, count: 0, swp: [] };
  },

  /**
   * 14. View SSL Complaints (AMC)
   * GET jammu/ssl/complaint/view-data or fallback to up/ssl/complaint/view-data
   */
  async getViewSslComplaints(): Promise<JammuSslComplaintItem[]> {
    const endpoints = [
      `${JAMMU_API.BASE_URL}/jammu/ssl/complaint/view-data`,
      `${JAMMU_API.BASE_URL}/up/ssl/complaint/view-data`,
      `${JAMMU_API.BASE_URL}/v/vendor/view-ssl-complaint`,
    ];

    for (const url of endpoints) {
      try {
        const res = await fetch(url, {
          method: 'GET',
          headers: getAuthHeaders(),
        });
        if (res.ok) {
          const json = await res.json();
          if (Array.isArray(json)) return json;
          if (Array.isArray(json?.data)) return json.data;
          if (Array.isArray(json?.complaints)) return json.complaints;
        }
      } catch {
        // try next endpoint
      }
    }
    return [];
  },
};

export default jammuSslService;
