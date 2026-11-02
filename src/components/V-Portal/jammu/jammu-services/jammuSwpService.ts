import { JAMMU_API, ROOT_URL } from '../../V_Portal_APIS/Jammu_API';
import { getAuthHeaders } from './jammuSrt70mwService';

/**
 * Resolve Jammu SWP upload media URLs
 */
export function getJammuSwpMediaCandidates(path?: string | null): string[] {
  if (!path) return [];
  const trimmed = String(path).trim();
  if (!trimmed) return [];
  if (/^(https?:|data:|blob:)/i.test(trimmed)) return [trimmed];

  const normalized = trimmed.replace(/^\/+/, '');
  const filename = normalized.split('/').pop() || normalized;
  const candidates: string[] = [];

  candidates.push(`${ROOT_URL}/${normalized}`);
  candidates.push(`${ROOT_URL}/uploads/jammu/installation/swp/module/${filename}`);
  candidates.push(`${ROOT_URL}/uploads/jammu/installation/swp/vfd/${filename}`);
  candidates.push(`${ROOT_URL}/uploads/jammu/installation/swp/running_water/${filename}`);
  candidates.push(`${ROOT_URL}/uploads/jammu/installation/swp/pole/${filename}`);
  candidates.push(`${ROOT_URL}/uploads/jammu/installation/swp/document/${filename}`);
  candidates.push(`${ROOT_URL}/uploads/jammu/installation/swp/payment/${filename}`);
  candidates.push(`${ROOT_URL}/uploads/jammu/installation/swp/${filename}`);
  candidates.push(`${ROOT_URL}/uploads/${filename}`);

  const R2_BASE = ((import.meta.env.VITE_R2_PUBLIC_URL as string | undefined) ?? '').replace(/\/+$/, '');
  if (R2_BASE) {
    candidates.push(`${R2_BASE}/${normalized}`);
    candidates.push(`${R2_BASE}/${filename}`);
  }

  return Array.from(new Set(candidates));
}

export function resolveJammuSwpMediaUrl(path?: string | null): string {
  if (!path) return '';
  if (/^(https?:|data:|blob:)/i.test(path)) return path;
  const candidates = getJammuSwpMediaCandidates(path);
  return candidates[0] || `${ROOT_URL}/${path.replace(/^\/+/, '')}`;
}

/* ═══════════════════════════════════════════════════════════════════════════
   TypeScript Interfaces for Jammu SWP Installation
   ═══════════════════════════════════════════════════════════════════════════ */

export interface JammuSwpVendorMeta {
  company_id?: number;
  loginId?: number;
  loginName?: string;
  state?: string;
  parent_id?: number;
}

export interface JammuSwpAssignItem {
  id: number;
  state?: string;
  district?: string;
  project?: string;
  purpose?: string;
  vendor?: string | number;
  site_id: (string | number)[];
  site_details?: { id: number; f_farmer_name: string }[];
  status: number; // 1 = assigned, 2 = accepted
  created_at?: string;
  updated_at?: string;
  remarks?: string;
  remark?: string;
  file?: string;
  deadline?: string;
  inst_deadline?: string;
}

export interface JammuSwpSiteNameItem {
  id: number;
  f_farmer_name: string;
  district?: string;
}

export interface JammuSwpSiteDetail {
  id: number;
  state?: string;
  district?: string;
  tehsil?: string;
  block?: string;
  post?: string;
  village?: string;
  f_farmer_name?: string;
  work_order?: string;
  volume?: string;
  vfd_no?: string | null;
  mt_pump_no?: string | null;
  mt_motor_no?: string | null;
  vendor?: string | number;
  vendor_name?: string;
  created_at?: string;
  inst_status?: number;
  inst_latitude?: string;
  inst_longitude?: string;
  inst_remarks?: string;
}

export interface JammuSwpModule {
  id: number;
  sr_no: string;
  jammu_id?: number;
  created_at?: string;
  updated_at?: string;
}

export interface JammuSwpInstalledSiteItem {
  id: number;
  state?: string;
  district?: string;
  tehsil?: string;
  block?: string;
  village?: string;
  post?: string;
  f_farmer_name?: string;
  work_order?: string;
  volume?: string;
  vfd_no?: string | null;
  mt_motor_no?: string | null;
  mt_pump_no?: string | null;
  module_image?: string | null;
  vfd_image?: string | null;
  running_water_image?: string | null;
  pole_image?: string | null;
  inst_status?: number;
  inst_verify_status?: number; // 0 = pending, 1 = approved, 2 = reject
  inst_verify_remarks?: string | null;
  inst_doc?: string | null;
  inst_doc_date?: string | null;
  inst_doc_status?: number; // 0 = pending, 1 = submitted, 2 = approved
  inst_doc_remarks?: string | null;
  inst_doc_verify_remarks?: string | null;
  inst_claim_status?: number; // 0 = not raised, 1 = raised, 2 = approved
  inst_pay_status?: number; // 0 = pending, 1 = done, 2 = partially
  inst_latitude?: string | null;
  inst_longitude?: string | null;
  inst_remarks?: string | null;
  inst_date?: string | null;
  created_at?: string;
  updated_at?: string;
  jammuModulee?: JammuSwpModule[];
  jammu_modules?: JammuSwpModule[];
}

export interface JammuSwpInstallDetailSummary {
  total: number;
  complete: number;
  pending: number;
  verify_approved: number;
  verify_pending: number;
  verify_reject: number;
}

export interface JammuSwpInstallViewData {
  loginId?: number;
  assign?: number;
  install_detail: JammuSwpInstallDetailSummary;
  sites: JammuSwpInstalledSiteItem[];
}

export interface JammuSwpClaimItem {
  id: number;
  project?: string;
  type?: string;
  state?: string;
  amount: string | number;
  site_id: string | number[]; // e.g. "[501, 502]"
  file?: string;
  remarks?: string;
  claim_status?: number; // 1 = raised, 2 = approved, 3 = rejected
  date?: string;
  payment_amount?: string | number;
  payment_balance?: string | number;
  payment_date?: string;
  payment_remarks?: string;
  payment_status?: string | number;
  created_at?: string;
}

export interface JammuSwpClaimableSite {
  id: number;
  f_farmer_name: string;
  district?: string;
  inst_doc_status?: number;
}

export interface JammuSwpClaimViewData {
  payments: JammuSwpClaimItem[];
  sites: JammuSwpClaimableSite[];
}

export interface JammuSwpDashboardTotals {
  site_count: number;
  complete: number;
  pending: number;
  verify_approved: number;
  verify_pending: number;
  verify_reject: number;
  doc_submitted: number;
  doc_pending: number;
  claim_applicable: number;
  claim_raised: number;
  claim_approved: number;
  pay_done: number;
  pay_partially: number;
  pay_pending: number;
}

export interface JammuSwpDistrictInstall {
  district: string;
  inst_complete: number;
}

export interface JammuSwpDistrictwiseRow extends JammuSwpDashboardTotals {
  district: string;
}

export interface JammuSwpMonthlyInstall {
  month_year: string;
  monthly_installations: number;
}

export interface JammuSwpDashboardData {
  swp: JammuSwpDashboardTotals;
  district_install: JammuSwpDistrictInstall[];
  districtwise: JammuSwpDistrictwiseRow[];
  district_installation_month: JammuSwpMonthlyInstall[];
}

export interface JammuSwpStatusSiteItem {
  id: number;
  district?: string;
  f_farmer_name?: string;
  inst_status?: number;
  state?: string;
  tehsil?: string;
  village?: string;
  vfd_no?: string;
  mt_motor_no?: string;
  mt_pump_no?: string;
  inst_verify_status?: number;
  inst_doc_status?: number;
  inst_claim_status?: number;
  inst_pay_status?: number;
}

/* ═══════════════════════════════════════════════════════════════════════════
   Service Implementation
   ═══════════════════════════════════════════════════════════════════════════ */

export const jammuSwpService = {
  /**
   * 1. View assigned installations
   * GET jammu/swp/installation-view-assign-sites
   */
  getAssignedSites: async (): Promise<{ assigns: JammuSwpAssignItem[]; vendorMeta?: JammuSwpVendorMeta }> => {
    const url = JAMMU_API.INSTALLATION.SWP.ASSIGNED_SITES;
    const res = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders(false),
    });

    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(json.message || 'Failed to fetch assigned installations.');
    }

    const d = json.data || {};
    const rawAssigns: any[] = d.assigns || d.data?.assigns || [];
    const vendorMeta: JammuSwpVendorMeta = d.data || {};

    const cleanAssigns: JammuSwpAssignItem[] = rawAssigns.map((item: any) => {
      let siteList = item.site_id;
      if (typeof siteList === 'string') {
        try {
          siteList = JSON.parse(siteList);
        } catch {
          siteList = siteList.split(',').map((s: string) => s.trim());
        }
      }
      if (!Array.isArray(siteList)) siteList = [siteList];

      return {
        ...item,
        id: Number(item.id),
        site_id: siteList,
        status: Number(item.status),
      };
    });

    return { assigns: cleanAssigns, vendorMeta };
  },

  /**
   * 2. Accept installation
   * GET jammu/swp/accept-installation?id={id}
   */
  acceptAssignment: async (id: number | string): Promise<{ status: boolean; message: string }> => {
    const url = JAMMU_API.INSTALLATION.SWP.ACCEPT_ASSIGNMENT(id);
    const res = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders(false),
    });

    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      const errMsg =
        json.message ||
        json.errors?.id?.[0] ||
        'Failed to accept assignment.';
      throw new Error(errMsg);
    }

    return { status: true, message: json.message || 'Accept Successfully!!!' };
  },

  /**
   * 3. Fetch site name (Sites ready for installation dropdown)
   * GET jammu/swp/fetch-site-name
   */
  getInstallableSiteNames: async (): Promise<JammuSwpSiteNameItem[]> => {
    const url = JAMMU_API.INSTALLATION.SWP.FETCH_SITE_NAMES;
    const res = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders(false),
    });

    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(json.message || 'Failed to fetch installable site names.');
    }

    const data = json.data;
    if (Array.isArray(data)) return data;
    return [];
  },

  /**
   * 4. Fetch site detail
   * GET jammu/swp/fetch-site-detail?site_id={site_id}
   */
  getSiteDetail: async (siteId: number | string): Promise<JammuSwpSiteDetail | null> => {
    const url = JAMMU_API.INSTALLATION.SWP.FETCH_SITE_DETAIL(siteId);
    const res = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders(false),
    });

    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      const errMsg = json.errors?.site_id?.[0] || json.message || 'Failed to fetch site detail.';
      throw new Error(errMsg);
    }

    return json.data || null;
  },

  /**
   * 5. Installation site store
   * POST jammu/swp/installation-site-store (multipart/form-data)
   */
  installSiteStore: async (formData: FormData): Promise<{ status: boolean; message: string; data?: any }> => {
    const url = JAMMU_API.INSTALLATION.SWP.INSTALL_SITE_STORE;
    const res = await fetch(url, {
      method: 'POST',
      headers: getAuthHeaders(true),
      body: formData,
    });

    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      let errMsg = json.message || 'Failed to submit installation details.';
      if (json.errors) {
        const firstErr = Object.values(json.errors)[0];
        if (Array.isArray(firstErr) && firstErr[0]) {
          errMsg = `${errMsg} (${firstErr[0]})`;
        }
      }
      throw new Error(errMsg);
    }

    // Handle controller typo where saved record comes under key "1"
    const savedData = json['1'] || json.data || json;
    return {
      status: true,
      message: json.message || 'Site Installed Successfully!',
      data: savedData,
    };
  },

  /**
   * 6. View installed sites
   * GET jammu/swp/installation-view-site
   */
  getInstalledSites: async (): Promise<JammuSwpInstallViewData> => {
    const url = JAMMU_API.INSTALLATION.SWP.VIEW_INSTALLED_SITES;
    const res = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders(false),
    });

    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(json.message || json.messgae || 'Failed to fetch installed sites.');
    }

    const d = json.data || {};
    const sites = Array.isArray(d.sites) ? d.sites : [];
    const install_detail: JammuSwpInstallDetailSummary = d.install_detail || {
      total: Number(d.assign || 0),
      complete: 0,
      pending: 0,
      verify_approved: 0,
      verify_pending: 0,
      verify_reject: 0,
    };

    return {
      loginId: d.loginId,
      assign: Number(d.assign || 0),
      install_detail,
      sites,
    };
  },

  /**
   * 7. Update install site (fetch)
   * GET jammu/swp/installation-update-site?site_id={site_id}
   */
  editInstallationLoad: async (siteId: number | string): Promise<{ site: JammuSwpInstalledSiteItem | null; ven?: any }> => {
    const url = JAMMU_API.INSTALLATION.SWP.UPDATE_SITE_LOAD(siteId);
    const res = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders(false),
    });

    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(json.message || json.messgae || 'Failed to load installation for editing.');
    }

    const d = json.data || {};
    return {
      site: d.site || null,
      ven: d.ven || null,
    };
  },

  /**
   * 8. Update install site store
   * POST jammu/swp/installation-update-site-store (multipart/form-data)
   */
  updateInstallationStore: async (formData: FormData): Promise<{ status: boolean; message: string; data?: any }> => {
    const url = JAMMU_API.INSTALLATION.SWP.UPDATE_SITE_STORE;
    const res = await fetch(url, {
      method: 'POST',
      headers: getAuthHeaders(true),
      body: formData,
    });

    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      let errMsg = json.message || 'Failed to update installation site.';
      if (json.errors) {
        const firstErr = Object.values(json.errors)[0];
        if (Array.isArray(firstErr) && firstErr[0]) {
          errMsg = `${errMsg} (${firstErr[0]})`;
        }
      }
      throw new Error(errMsg);
    }

    return {
      status: true,
      message: json.message || 'Site updated successfully!',
      data: json.data,
    };
  },

  /**
   * 9. HOC document store
   * POST jammu/swp/installation-doc-store (multipart/form-data)
   */
  submitHocDocument: async (formData: FormData): Promise<{ status: boolean; message: string; data?: any }> => {
    const url = JAMMU_API.INSTALLATION.SWP.DOC_STORE;
    const res = await fetch(url, {
      method: 'POST',
      headers: getAuthHeaders(true),
      body: formData,
    });

    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      let errMsg = json.message || 'Failed to submit HOC document.';
      if (json.errors?.hoc_photo?.[0]) {
        errMsg = json.errors.hoc_photo[0];
      }
      throw new Error(errMsg);
    }

    return {
      status: true,
      message: json.message || 'HOC submitted successfully!',
      data: json.data,
    };
  },

  /**
   * 10. View claim
   * GET jammu/swp/installation-claim
   */
  getClaims: async (): Promise<JammuSwpClaimViewData> => {
    const url = JAMMU_API.INSTALLATION.SWP.INSTALLATION_CLAIM;
    const res = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders(false),
    });

    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(json.message || 'Failed to fetch claim data.');
    }

    const d = json.data || {};
    return {
      payments: Array.isArray(d.payments) ? d.payments : [],
      sites: Array.isArray(d.sites) ? d.sites : [],
    };
  },

  /**
   * 11. Add claim
   * POST jammu/swp/installation-add-claim (multipart/form-data)
   */
  addClaim: async (formData: FormData): Promise<{ status: boolean; message: string; data?: any }> => {
    const url = JAMMU_API.INSTALLATION.SWP.ADD_CLAIM;
    const res = await fetch(url, {
      method: 'POST',
      headers: getAuthHeaders(true),
      body: formData,
    });

    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      let errMsg = json.message || 'Failed to raise payment claim.';
      if (json.errors) {
        const firstErr = Object.values(json.errors)[0];
        if (Array.isArray(firstErr) && firstErr[0]) {
          errMsg = `${errMsg} (${firstErr[0]})`;
        }
      }
      throw new Error(errMsg);
    }

    return {
      status: true,
      message: json.message || 'Payment raised successfully.',
      data: json.data,
    };
  },

  /**
   * 12. Update claim
   * POST jammu/swp/installation-update-claim (multipart/form-data)
   */
  updateClaim: async (formData: FormData): Promise<{ status: boolean; message: string; data?: any }> => {
    const url = JAMMU_API.INSTALLATION.SWP.UPDATE_CLAIM;
    const res = await fetch(url, {
      method: 'POST',
      headers: getAuthHeaders(true),
      body: formData,
    });

    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      let errMsg = json.message || 'Failed to update payment claim.';
      if (json.errors) {
        const firstErr = Object.values(json.errors)[0];
        if (Array.isArray(firstErr) && firstErr[0]) {
          errMsg = `${errMsg} (${firstErr[0]})`;
        }
      }
      throw new Error(errMsg);
    }

    return {
      status: true,
      message: json.message || 'Payment updated successfully.',
      data: json.data,
    };
  },

  /**
   * 13. Fetch claim
   * POST jammu/swp/installation-fetch-claim
   */
  fetchClaim: async (id: number | string): Promise<{ claims: JammuSwpClaimItem; farmers: { id: number; f_farmer_name: string }[] }> => {
    const url = JAMMU_API.INSTALLATION.SWP.FETCH_CLAIM;
    const fd = new FormData();
    fd.append('id', String(id));

    const res = await fetch(url, {
      method: 'POST',
      headers: getAuthHeaders(true),
      body: fd,
    });

    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(json.message || 'Failed to fetch claim.');
    }

    return {
      claims: json.claims || json.data?.claims || json.data,
      farmers: Array.isArray(json.farmers) ? json.farmers : [],
    };
  },

  /**
   * 14. View assigned site details
   * GET jammu/swp/installation-view-assigned-site-details?assign_id={assign_id}
   */
  getAssignedSiteDetails: async (assignId: number | string): Promise<JammuSwpAssignItem> => {
    const url = JAMMU_API.INSTALLATION.SWP.VIEW_ASSIGNED_SITE_DETAILS(assignId);
    const res = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders(false),
    });

    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(json.message || 'Failed to fetch assignment details.');
    }

    const d = json.data || {};
    let siteList = d.site_id;
    if (typeof siteList === 'string') {
      try {
        siteList = JSON.parse(siteList);
      } catch {
        siteList = siteList.split(',').map((s: string) => s.trim());
      }
    }

    return {
      ...d,
      id: Number(d.id),
      site_id: Array.isArray(siteList) ? siteList : [siteList],
      status: Number(d.status),
      site_details: Array.isArray(d.site_details) ? d.site_details : [],
    };
  },

  /**
   * 15. Dashboard summary
   * GET jammu/swp/view-installation-dashboard
   */
  getDashboard: async (): Promise<JammuSwpDashboardData> => {
    const url = JAMMU_API.INSTALLATION.SWP.DASHBOARD;
    const res = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders(false),
    });

    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(json.message || 'Failed to fetch dashboard data.');
    }

    const d = json.data || {};
    const swp: JammuSwpDashboardTotals = d.swp || {
      site_count: 0,
      complete: 0,
      pending: 0,
      verify_approved: 0,
      verify_pending: 0,
      verify_reject: 0,
      doc_submitted: 0,
      doc_pending: 0,
      claim_applicable: 0,
      claim_raised: 0,
      claim_approved: 0,
      pay_done: 0,
      pay_partially: 0,
      pay_pending: 0,
    };

    return {
      swp,
      district_install: Array.isArray(d.district_install) ? d.district_install : [],
      districtwise: Array.isArray(d.districtwise) ? d.districtwise : [],
      district_installation_month: Array.isArray(d.district_installation_month) ? d.district_installation_month : [],
    };
  },

  /**
   * 16. Dashboard by status
   * GET jammu/swp/view-dashboard-data/{status}
   */
  getDashboardByStatus: async (status: string): Promise<{ meta: { status: string; count: number }; data: JammuSwpStatusSiteItem[] }> => {
    const url = JAMMU_API.INSTALLATION.SWP.DASHBOARD_BY_STATUS(status);
    const res = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders(false),
    });

    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(json.message || `Failed to fetch data for status: ${status}`);
    }

    return {
      meta: json.meta || { status, count: json.data?.length || 0 },
      data: Array.isArray(json.data) ? json.data : [],
    };
  },

  /**
   * 17. Dashboard district-wise
   * GET jammu/swp/view-dashboard-districtwise/{status}/{district}
   */
  getDashboardDistrictwise: async (
    status: string,
    district: string
  ): Promise<{ meta: { status: string; count: number }; data: JammuSwpStatusSiteItem[] }> => {
    const url = JAMMU_API.INSTALLATION.SWP.DASHBOARD_DISTRICTWISE(status, district);
    const res = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders(false),
    });

    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(json.message || `Failed to fetch data for ${status} in ${district}`);
    }

    return {
      meta: json.meta || { status, count: json.data?.length || 0 },
      data: Array.isArray(json.data) ? json.data : [],
    };
  },
};

export default jammuSwpService;
