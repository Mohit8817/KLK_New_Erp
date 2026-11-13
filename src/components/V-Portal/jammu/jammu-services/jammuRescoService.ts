import { JAMMU_API } from '../../V_Portal_APIS/Jammu_API';
import { getAuthHeaders } from './jammuSrt70mwService';

/* ═══════════════════════════════════════════════════════════════════════════
   TypeScript Interfaces for Jammu RESCO Installation
   ═══════════════════════════════════════════════════════════════════════════ */

// 1. Assigned Sites
export interface JammuRescoAssignedSiteItem {
  id: number;
  site_id?: number;
  state?: string;
  district?: string;
  site_name?: string;
  inst_vendor?: string | number;
  vendor?: string | number;
  purpose?: string;
  type?: string;
  status: number; // 1 = Assigned/Pending, 2 = Accepted
  inst_deadline?: string;
  assign_date?: string;
  created_at?: string;
  updated_at?: string;
  remarks?: string;
  remark?: string;
  file?: string;
  count?: number;
  [key: string]: any;
}

export function normalizeRescoStatus(rawStatus?: string | null): string {
  if (!rawStatus) return 'total';
  const s = String(rawStatus).trim().toLowerCase();

  const MAP: Record<string, string> = {
    'complete': 'complete',
    'completed': 'complete',
    'installed': 'complete',
    'inst-complete': 'complete',
    'install-complete': 'complete',
    'pending': 'pending',
    'inst-pending': 'pending',
    'install-pending': 'pending',
    'material-dispatch': 'material_dispatch',
    'material-dispatched': 'material_dispatch',
    'material_dispatch': 'material_dispatch',
    'material-pending': 'material_pending',
    'material_pending': 'material_pending',
    'verify-approved': 'verify_approved',
    'verify_approved': 'verify_approved',
    'approved': 'verify_approved',
    'verify-pending': 'verify_pending',
    'verify_pending': 'verify_pending',
    'verify-reject': 'verify_reject',
    'verify_reject': 'verify_reject',
    'reject': 'verify_reject',
    'rejected': 'verify_reject',
    'claim-applicable': 'complete',
    'claim-raised': 'claim1_approved',
    'claim_raised': 'claim1_approved',
    'claim1': 'claim1_approved',
    'claim1-approved': 'claim1_approved',
    'claim1_approved': 'claim1_approved',
    'claim2': 'claim2_approved',
    'claim2-approved': 'claim2_approved',
    'claim2_approved': 'claim2_approved',
    'claim3': 'claim3_approved',
    'claim3-approved': 'claim3_approved',
    'claim3_approved': 'claim3_approved',
    'pay80': 'claim1_approved',
    'pay-80': 'claim1_approved',
    '80': 'claim1_approved',
    'inst-pay80-done': 'claim1_approved',
    'pay20': 'claim2_approved',
    'pay-20': 'claim2_approved',
    '20': 'claim2_approved',
    'inst-pay20-done': 'claim2_approved',
    'total': 'total',
    'all': 'total',
  };

  return MAP[s] || s;
}

// 2. Assigned Site Detailed Sites
export interface JammuRescoAssignedDetailItem {
  sr_no?: number;
  assign_date?: string;
  state?: string;
  district?: string;
  site_name?: string;
  inst_deadline?: string;
  [key: string]: any;
}

export interface JammuRescoAssignedDetailData {
  sites?: JammuRescoAssignedDetailItem[];
  [key: string]: any;
}

// 4. Fetch Install Sites (GET /jk/resco-install-site)
export interface JammuRescoInstallSiteItem {
  id: number;
  unique_id?: string | null;
  company_id?: string;
  survey_id?: number | string | null;
  survey_status?: number;
  survey_by?: string | null;
  material_status?: number;
  volume?: string;
  phase?: string;
  finance_by?: string;
  wo_no?: string;
  state?: string;
  district?: string;
  site_name?: string;
  dept_name?: string;
  address?: string;
  location?: string;
  latitude?: string;
  longitude?: string;
  firm_name?: string;
  ca_no?: string;
  sanction_load?: string | number;
  plant_sc?: string | number;
  contact_person?: string;
  contact_number?: string;
  inst_assigned_id?: string | number;
  inst_assigned_by?: string | number;
  inst_assigned_date?: string;
  inst_deadline?: string;
  inst_vendor?: number | string;
  inst_accept?: number;
  inst_status?: number;
  inst_date?: string | null;
  inverter_no?: string | null;
  solarmeter_no?: string | null;
  nm_sm_no?: string | null;
  loger_no?: string | null;
  panel_no?: string[] | string | null;
  inst_remarks?: string | null;
  panel_image?: string | null;
  panel_status?: number;
  system_image?: string | null;
  inverter_image?: string | null;
  nm_sm_image?: string | null;
  loger_image?: string | null;
  inst_latitude?: string | null;
  inst_longitude?: string | null;
  inst_verify_status?: number;
  inst_verify_remarks?: string | null;
  inst_verify_by?: string | null;
  inst_verify_date?: string | null;
  inst_doc_status?: number;
  inst_doc_file?: string | null;
  inst_doc_date?: string | null;
  inst_doc_remarks?: string | null;
  created_by?: string;
  updated_by?: string;
  created_at?: string;
  updated_at?: string;
  vendor_name?: string;
  [key: string]: any;
}

// Aliases for compatibility
export type JammuRescoSiteNameItem = JammuRescoInstallSiteItem;
export type JammuRescoInstallSiteDetail = JammuRescoInstallSiteItem;

// 7. View Installed Sites
export interface JammuRescoInstallDetailSummary {
  total: number;
  complete: number;
  pending: number;
  verify_approved: number;
  verify_pending: number;
  verify_reject: number;
  doc_approved: number;
  doc_pending: number;
  doc_reject: number;
}

export interface JammuRescoInstalledSiteItem {
  id: number;
  site_id?: number;
  resco_id?: number;
  state?: string;
  district?: string;
  site_name?: string;
  address?: string;
  location?: string;
  contact_person?: string;
  contact_number?: string;
  solarmeter_no?: string;
  inverter_no?: string;
  nm_sm_no?: string;
  loger_no?: string;
  panel_image?: string;
  system_image?: string;
  inverter_image?: string;
  nm_sm_image?: string;
  loger_image?: string;
  latitude?: string;
  longitude?: string;
  inst_latitude?: string;
  inst_longitude?: string;
  remark?: string;
  remarks?: string;
  inst_remarks?: string;
  inst_status?: number;
  inst_verify_status?: number; // 0 = pending, 1 = approved, 2 = reject
  verify_status?: number;
  verify_remarks?: string;
  inst_doc_status?: number; // 0 = not submitted, 1 = submitted, 2 = approved, 3 = reject
  document_status?: number;
  doc_file?: string;
  document_file?: string;
  doc_remarks?: string;
  document_remarks?: string;
  inst_date?: string;
  created_at?: string;
  panel_no?: string[] | string;
  panel_serials?: string;
  inst_claim1_status?: number;
  inst_claim2_status?: number;
  inst_claim3_status?: number;
  [key: string]: any;
}

// 11. Installation Claim
export interface JammuRescoPaymentItem {
  id: number;
  site_id: number;
  site_name?: string;
  amount: string | number;
  status: number; // 1 = raised, 2 = approved, 3 = rejected
  created_at?: string;
  date?: string;
  claim_date?: string;
  invoice?: string;
  file?: string;
  remarks?: string;
  payment_amount?: string | number;
  payment_balance?: string | number;
  payment_date?: string;
  payment_remarks?: string;
  payment_status?: number;
  [key: string]: any;
}

export interface JammuRescoPayStatusItem {
  site_id: number;
  claim_status: number;
  payment_status: number;
  [key: string]: any;
}

export interface JammuRescoClaimData {
  payments: JammuRescoPaymentItem[];
  pay1?: JammuRescoPayStatusItem[];
  pay2?: JammuRescoPayStatusItem[];
  pay3?: JammuRescoPayStatusItem[];
  username?: string;
  parent_id?: string;
  login_id?: number | string;
  state?: string;
  company_id?: string;
  [key: string]: any;
}

// 14. Fetch Claim Details
export interface JammuRescoClaimDetailResponse {
  claims: {
    id: number;
    amount: string | number;
    pay_type: number;
    remarks?: string;
    site_id: number;
    file?: string;
    [key: string]: any;
  };
  sites: Array<{
    id: number;
    site_name: string;
    [key: string]: any;
  }>;
}

// 15. Installation Dashboard
export interface JammuRescoDashboardMetrics {
  total: number;
  complete: number;
  pending: number;
  verify_approved: number;
  verify_pending: number;
  verify_reject: number;
}

export interface JammuRescoDistrictInstallItem {
  district: string;
  total: number;
  complete: number;
  pending: number;
}

export interface JammuRescoDistrictwiseItem {
  district: string;
  inst_claim1_approved?: number;
  inst_claim2_approved?: number;
  inst_claim3_approved?: number;
  [key: string]: any;
}

export interface JammuRescoMonthlyItem {
  month_year: string;
  monthly_installations: number;
}

export interface JammuRescoDashboardData {
  resco: JammuRescoDashboardMetrics;
  district_install: JammuRescoDistrictInstallItem[];
  districtwise: JammuRescoDistrictwiseItem[];
  district_installation_month: JammuRescoMonthlyItem[];
}

// 17. View Panels
export interface JammuRescoPanelItem {
  id: number;
  panel_no: string;
  site_id: number;
  [key: string]: any;
}

export interface JammuRescoViewPanelsData {
  state?: string;
  resco?: {
    id: number;
    site_name: string;
  };
  panels: JammuRescoPanelItem[];
}

// 18. Billing Data
export interface JammuRescoBillingSiteItem {
  id: number;
  site_name: string;
  district?: string;
  inst_status?: number;
  inst_accept?: number;
  inst_verify_status?: number;
  [key: string]: any;
}

export interface JammuRescoBillItem {
  id: number;
  resco_id: number;
  month_year: string;
  reading: string | number;
  bill_no: string;
  bill_status: number;
  bill_date: string;
  file?: string;
  [key: string]: any;
}

export interface JammuRescoCreateBillData {
  username?: string;
  parent_id?: string;
  state?: string;
  company_id?: string;
  resco?: {
    id: number;
    site_name: string;
    inverter_no?: string;
  };
  bills: JammuRescoBillItem[];
}

export function extractRescoSiteArray(json: any): JammuRescoInstalledSiteItem[] {
  if (!json) return [];
  if (Array.isArray(json)) return json;
  if (Array.isArray(json?.install_detail)) return json.install_detail;
  if (Array.isArray(json?.data)) return json.data;
  if (Array.isArray(json?.sites)) return json.sites;
  if (Array.isArray(json?.resco)) return json.resco;
  if (Array.isArray(json?.installed)) return json.installed;
  if (Array.isArray(json?.list)) return json.list;
  if (Array.isArray(json?.records)) return json.records;

  if (json?.data && typeof json.data === 'object') {
    if (Array.isArray(json.data.sites)) return json.data.sites;
    if (Array.isArray(json.data.install_detail)) return json.data.install_detail;
    if (Array.isArray(json.data.resco)) return json.data.resco;
    if (Array.isArray(json.data.installed)) return json.data.installed;
    if (Array.isArray(json.data.list)) return json.data.list;
    if (Array.isArray(json.data.records)) return json.data.records;
    for (const key of Object.keys(json.data)) {
      if (Array.isArray(json.data[key]) && json.data[key].length > 0 && typeof json.data[key][0] === 'object') {
        return json.data[key];
      }
    }
  }

  if (typeof json === 'object') {
    for (const key of Object.keys(json)) {
      if (key !== 'status' && key !== 'message' && Array.isArray(json[key]) && json[key].length > 0 && typeof json[key][0] === 'object') {
        return json[key];
      }
    }
  }

  return [];
}

/* ═══════════════════════════════════════════════════════════════════════════
   Jammu RESCO Service Implementation
   ═══════════════════════════════════════════════════════════════════════════ */

class JammuRescoService {
  /**
   * 1. Assigned Installation Sites
   * GET /jk/resco-view-assign-installation-sites
   */
  async getAssignedSites(): Promise<JammuRescoAssignedSiteItem[]> {
    const res = await fetch(JAMMU_API.INSTALLATION.RESCO.ASSIGNED_SITES, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch assigned RESCO sites (${res.status} ${res.statusText})`);
    }

    const json = await res.json();
    if (Array.isArray(json?.assign_sites)) return json.assign_sites;
    if (Array.isArray(json?.data)) return json.data;
    if (Array.isArray(json?.sites)) return json.sites;
    if (Array.isArray(json)) return json;
    return [];
  }

  /**
   * 2. Assigned Installation Site Detail
   * GET /jk/resco-view-assign-installation-detail?id={id}
   */
  async getAssignedSiteDetail(id: number | string): Promise<JammuRescoAssignedDetailData | null> {
    const url = `${JAMMU_API.INSTALLATION.RESCO.ASSIGNED_SITE_DETAIL}?id=${encodeURIComponent(id)}`;
    const res = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch assign site details (${res.status} ${res.statusText})`);
    }

    const json = await res.json();
    return json?.data || json;
  }

  /**
   * 3. Accept Installation Assignment
   * GET /jk/resco-assign-installation-accept/{id}
   * Note: Fallback to ?id={id} if route without param
   */
  async acceptAssignment(id: number | string): Promise<{ success: boolean; message: string }> {
    const numId = Number(id);
    const primaryUrl = JAMMU_API.INSTALLATION.RESCO.ACCEPT_ASSIGNMENT(numId);

    try {
      const res = await fetch(primaryUrl, {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      const json = await res.json().catch(() => null);

      if (res.ok || json?.status === true || json?.success === true) {
        return {
          success: true,
          message: json?.message || 'Installation accepted successfully',
        };
      }

      // Fallback query parameter
      const fallbackUrl = `${JAMMU_API.INSTALLATION.RESCO.ASSIGNED_SITES.replace(
        'resco-view-assign-installation-sites',
        'resco-assign-installation-accept'
      )}?id=${encodeURIComponent(numId)}`;

      const res2 = await fetch(fallbackUrl, {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      const json2 = await res2.json().catch(() => null);
      if (res2.ok || json2?.status === true || json2?.success === true) {
        return {
          success: true,
          message: json2?.message || 'Installation accepted successfully',
        };
      }

      throw new Error(json?.message || json2?.message || 'Failed to accept installation assignment');
    } catch (err: any) {
      throw new Error(err?.message || 'Failed to accept installation assignment');
    }
  }

  /**
   * 4. Fetch Install Sites (Dropdown & Details)
   * GET /jk/resco-install-site
   */
  async getInstallSites(): Promise<JammuRescoInstallSiteItem[]> {
    const res = await fetch(JAMMU_API.INSTALLATION.RESCO.INSTALL_SITES, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch install sites (${res.status} ${res.statusText})`);
    }

    const json = await res.json();
    if (Array.isArray(json?.data)) return json.data;
    if (Array.isArray(json?.sites)) return json.sites;
    if (Array.isArray(json)) return json;
    return [];
  }

  /**
   * Alias: Fetch Site Name (Dropdown for Installation Form)
   */
  async getInstallableSiteNames(): Promise<JammuRescoInstallSiteItem[]> {
    return this.getInstallSites();
  }

  /**
   * 5. Fetch Installation Site Details
   * GET /jk/resco-installation-fetch-site-detail?id={id}&site_id={id}
   */
  async getSiteDetails(siteId: number | string): Promise<JammuRescoSiteDetail | null> {
    try {
      // 1. Query-based: GET /jk/resco-installation-fetch-site-detail?id={id}&site_id={id}
      const url1 = JAMMU_API.INSTALLATION.RESCO.FETCH_SITE_DETAILS(siteId);
      const res1 = await fetch(url1, {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      if (res1.ok) {
        const json1 = await res1.json();
        const site1 = json1?.resco || json1?.data?.resco || json1?.data || json1;
        if (site1 && (site1.id || site1.site_name)) return site1;
      }

      // 2. Path-based: GET /jk/resco-installation-fetch-site-detail/{id}
      const url2 = JAMMU_API.INSTALLATION.RESCO.FETCH_SITE_DETAILS_PATH(siteId);
      const res2 = await fetch(url2, {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      if (res2.ok) {
        const json2 = await res2.json();
        const site2 = json2?.resco || json2?.data?.resco || json2?.data || json2;
        if (site2 && (site2.id || site2.site_name)) return site2;
      }

      // 3. Fallback: match from getInstallSites() (/jk/resco-install-site)
      const allSites = await this.getInstallSites();
      const match = allSites.find((s) => String(s.id) === String(siteId));
      if (match) return match;

      return null;
    } catch (err: any) {
      console.warn('[jammuRescoService] getSiteDetails fallback lookup:', err);
      try {
        const allSites = await this.getInstallSites();
        const match = allSites.find((s) => String(s.id) === String(siteId));
        return match || null;
      } catch {
        return null;
      }
    }
  }

  /**
   * 6. Submit Installation
   * POST /jk/resco-install-site-store (multipart/form-data)
   */
  async submitInstallation(formData: FormData): Promise<{ success: boolean; message: string }> {
    const res = await fetch(JAMMU_API.INSTALLATION.RESCO.INSTALL_SITE_STORE, {
      method: 'POST',
      headers: getAuthHeaders(true),
      body: formData,
    });

    const json = await res.json().catch(() => null);

    if (res.ok || json?.success === true || json?.status === true) {
      return {
        success: true,
        message: json?.message || 'Details submitted successfully',
      };
    }

    const errMsg = json?.message || json?.error || `Failed to submit installation details (HTTP ${res.status})`;
    throw new Error(errMsg);
  }

  /**
   * 7. View Installed Sites
   * GET /jk/resco-view-install-site
   */
  async getViewInstalledSites(): Promise<{
    install_detail: JammuRescoInstallDetailSummary;
    sites: JammuRescoInstalledSiteItem[];
  }> {
    const res = await fetch(JAMMU_API.INSTALLATION.RESCO.VIEW_INSTALL_SITE, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch installed sites (${res.status} ${res.statusText})`);
    }

    const json = await res.json();

    // The backend returns the list of sites under `install_detail` or `data` or `sites`
    let sites: JammuRescoInstalledSiteItem[] = [];
    if (Array.isArray(json?.install_detail)) {
      sites = json.install_detail;
    } else if (Array.isArray(json?.data)) {
      sites = json.data;
    } else if (Array.isArray(json?.sites)) {
      sites = json.sites;
    } else if (Array.isArray(json?.resco)) {
      sites = json.resco;
    } else if (Array.isArray(json?.install_sites)) {
      sites = json.install_sites;
    } else if (Array.isArray(json?.installed)) {
      sites = json.installed;
    } else if (Array.isArray(json)) {
      sites = json;
    }

    const summary: JammuRescoInstallDetailSummary = {
      total: sites.length,
      complete: sites.filter((s) => Number(s.inst_status ?? 1) === 1).length,
      pending: sites.filter((s) => Number(s.inst_status) === 0).length,
      verify_approved: sites.filter((s) => Number(s.inst_verify_status ?? s.verify_status) === 1).length,
      verify_pending: sites.filter((s) => !s.inst_verify_status || Number(s.inst_verify_status ?? s.verify_status) === 0).length,
      verify_reject: sites.filter((s) => Number(s.inst_verify_status ?? s.verify_status) === 2).length,
      doc_approved: sites.filter((s) => Number(s.inst_doc_status ?? s.doc_status) === 2).length,
      doc_pending: sites.filter((s) => Number(s.inst_doc_status ?? s.doc_status) === 1).length,
      doc_reject: sites.filter((s) => Number(s.inst_doc_status ?? s.doc_status) === 3).length,
    };

    if (json?.summary && typeof json.summary === 'object') {
      Object.assign(summary, json.summary);
    } else if (json?.install_summary && typeof json.install_summary === 'object') {
      Object.assign(summary, json.install_summary);
    } else if (json?.counts && typeof json.counts === 'object') {
      Object.assign(summary, json.counts);
    } else if (!Array.isArray(json?.install_detail) && json?.install_detail && typeof json.install_detail === 'object') {
      Object.assign(summary, json.install_detail);
    }

    return {
      install_detail: summary,
      sites,
    };
  }

  /**
   * 8. Installation Update Data
   * GET /jk/resco-install-site-update/{id}
   */
  async getInstallationUpdateData(id: number | string): Promise<JammuRescoSiteDetail | null> {
    const res = await fetch(JAMMU_API.INSTALLATION.RESCO.INSTALL_UPDATE_DATA(id), {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch installation update data (${res.status} ${res.statusText})`);
    }

    const json = await res.json();
    return json?.data || json;
  }

  /**
   * 9. Update Installation
   * POST /jk/resco-install-site-ipdate-store/{id} (or update-store)
   */
  async updateInstallation(id: number | string, formData: FormData): Promise<{ success: boolean; message: string }> {
    const primaryUrl = JAMMU_API.INSTALLATION.RESCO.INSTALL_UPDATE_STORE(id);
    let res = await fetch(primaryUrl, {
      method: 'POST',
      headers: getAuthHeaders(true),
      body: formData,
    });

    let json = await res.json().catch(() => null);

    if (res.status === 404) {
      // Try spelling alias update-store
      const altUrl = JAMMU_API.INSTALLATION.RESCO.INSTALL_UPDATE_STORE_ALT(id);
      res = await fetch(altUrl, {
        method: 'POST',
        headers: getAuthHeaders(true),
        body: formData,
      });
      json = await res.json().catch(() => null);
    }

    if (res.ok || json?.success === true || json?.status === true) {
      return {
        success: true,
        message: json?.message || 'Details updated successfully',
      };
    }

    throw new Error(json?.message || json?.error || 'Failed to update installation');
  }

  /**
   * 10. Submit Installation Document
   * POST /jk/resco-installation-doc-submit (multipart/form-data)
   */
  async submitInstallationDocument(formData: FormData): Promise<{ success: boolean; message: string }> {
    const res = await fetch(JAMMU_API.INSTALLATION.RESCO.DOC_SUBMIT, {
      method: 'POST',
      headers: getAuthHeaders(true),
      body: formData,
    });

    const json = await res.json().catch(() => null);

    if (res.ok || json?.success === true || json?.status === true) {
      return {
        success: true,
        message: json?.message || 'Document submitted successfully',
      };
    }

    throw new Error(json?.message || json?.error || 'Failed to submit document');
  }

  /**
   * 11. Installation Claim
   * GET /jk/resco-installation-claim
   */
  async getInstallationClaims(): Promise<JammuRescoClaimData> {
    const res = await fetch(JAMMU_API.INSTALLATION.RESCO.INSTALL_CLAIM, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch claim payment data (${res.status} ${res.statusText})`);
    }

    const json = await res.json();
    const data = json?.data || json;

    return {
      username: data?.username,
      parent_id: data?.parent_id,
      login_id: data?.login_id,
      state: data?.state,
      company_id: data?.company_id,
      payments: Array.isArray(data?.payments) ? data.payments : Array.isArray(data) ? data : [],
      pay1: Array.isArray(data?.pay1) ? data.pay1 : [],
      pay2: Array.isArray(data?.pay2) ? data.pay2 : [],
      pay3: Array.isArray(data?.pay3) ? data.pay3 : [],
    };
  }

  /**
   * 12. Add Claim
   * POST /jk/resco-installation-add-claim (multipart/form-data)
   */
  async addClaim(formData: FormData): Promise<{ success: boolean; message: string }> {
    // Backend validation requires site_id as an array.
    // If scalar 'site_id' is present alongside 'site_id[]', delete scalar 'site_id'.
    if (formData.has('site_id') && formData.has('site_id[]')) {
      formData.delete('site_id');
    } else if (formData.has('site_id') && !formData.has('site_id[]')) {
      const val = formData.get('site_id');
      formData.delete('site_id');
      if (val) formData.append('site_id[]', String(val));
    }

    const res = await fetch(JAMMU_API.INSTALLATION.RESCO.ADD_CLAIM, {
      method: 'POST',
      headers: getAuthHeaders(true),
      body: formData,
    });

    const json = await res.json().catch(() => null);

    if (res.ok && (json?.success === true || json?.status === true)) {
      return {
        success: true,
        message: json?.message || 'Claim raised successfully',
      };
    }

    let errMsg = json?.message || json?.error || 'Failed to raise claim';
    if (json?.errors && typeof json.errors === 'object') {
      const firstKey = Object.keys(json.errors)[0];
      if (firstKey && Array.isArray(json.errors[firstKey]) && json.errors[firstKey][0]) {
        errMsg = json.errors[firstKey][0];
      }
    }

    throw new Error(errMsg);
  }

  /**
   * 13. Update Claim
   * POST /jk/resco-installation-update-claim (multipart/form-data)
   */
  async updateClaim(formData: FormData): Promise<{ success: boolean; message: string }> {
    // Backend validation requires site_id as an array.
    // If scalar 'site_id' is present alongside 'site_id[]', delete scalar 'site_id'.
    if (formData.has('site_id') && formData.has('site_id[]')) {
      formData.delete('site_id');
    } else if (formData.has('site_id') && !formData.has('site_id[]')) {
      const val = formData.get('site_id');
      formData.delete('site_id');
      if (val) formData.append('site_id[]', String(val));
    }

    const res = await fetch(JAMMU_API.INSTALLATION.RESCO.UPDATE_CLAIM, {
      method: 'POST',
      headers: getAuthHeaders(true),
      body: formData,
    });

    const json = await res.json().catch(() => null);

    if (res.ok && (json?.success === true || json?.status === true)) {
      return {
        success: true,
        message: json?.message || 'Claim updated successfully',
      };
    }

    let errMsg = json?.message || json?.error || 'Failed to update claim';
    if (json?.errors && typeof json.errors === 'object') {
      const firstKey = Object.keys(json.errors)[0];
      if (firstKey && Array.isArray(json.errors[firstKey]) && json.errors[firstKey][0]) {
        errMsg = json.errors[firstKey][0];
      }
    }

    throw new Error(errMsg);
  }

  /**
   * 14. Fetch Claim Details
   * POST /jk/fetch-site-resco-installation-claim
   * Request JSON: { id: number }
   */
  async fetchClaimDetails(id: number | string): Promise<JammuRescoClaimDetailResponse> {
    const res = await fetch(JAMMU_API.INSTALLATION.RESCO.FETCH_CLAIM_DETAILS, {
      method: 'POST',
      headers: getAuthHeaders(false),
      body: JSON.stringify({ id: Number(id) }),
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch claim details (${res.status} ${res.statusText})`);
    }

    const json = await res.json();
    return json;
  }

  /**
   * 15. Installation Dashboard
   * GET /jk/resco-installation-dashboard
   */
  async getDashboard(): Promise<JammuRescoDashboardData> {
    const res = await fetch(JAMMU_API.INSTALLATION.RESCO.DASHBOARD, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch dashboard data (${res.status} ${res.statusText})`);
    }

    const json = await res.json();
    return {
      resco: json?.resco || {
        total: 0,
        complete: 0,
        pending: 0,
        verify_approved: 0,
        verify_pending: 0,
        verify_reject: 0,
      },
      district_install: Array.isArray(json?.district_install) ? json.district_install : [],
      districtwise: Array.isArray(json?.districtwise) ? json.districtwise : [],
      district_installation_month: Array.isArray(json?.district_installation_month)
        ? json.district_installation_month
        : [],
    };
  }

  /**
   * 16. Import Installation Panels
   * POST /jk/resco-installation-panel-store/{id} (multipart/form-data)
   */
  async importPanels(id: number | string, formData: FormData): Promise<{ success: boolean; message: string }> {
    const res = await fetch(JAMMU_API.INSTALLATION.RESCO.PANEL_STORE(id), {
      method: 'POST',
      headers: getAuthHeaders(true),
      body: formData,
    });

    const json = await res.json().catch(() => null);

    if (res.ok || json?.success === true || json?.status === true) {
      return {
        success: true,
        message: json?.message || 'Rows imported successfully',
      };
    }

    throw new Error(json?.message || json?.error || 'Failed to import panels');
  }

  /**
   * 17. View Imported Panels
   * GET /jk/resco-installation-view-panel/{id}
   */
  async getViewPanels(id: number | string): Promise<JammuRescoViewPanelsData> {
    const res = await fetch(JAMMU_API.INSTALLATION.RESCO.VIEW_PANEL(id), {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch panels (${res.status} ${res.statusText})`);
    }

    const json = await res.json();
    return (
      json?.data || {
        panels: [],
      }
    );
  }

  /**
   * 18. View Installations for Billing
   * GET /jk/resco-view-install
   */
  async getViewInstallBilling(): Promise<{
    username?: string;
    parent_id?: string;
    state?: string;
    company_id?: string;
    resco: JammuRescoBillingSiteItem[];
  }> {
    const res = await fetch(JAMMU_API.INSTALLATION.RESCO.VIEW_INSTALL_BILLING, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch installations for billing (${res.status} ${res.statusText})`);
    }

    const json = await res.json();
    const data = json?.data || json;
    return {
      username: data?.username,
      parent_id: data?.parent_id,
      state: data?.state,
      company_id: data?.company_id,
      resco: Array.isArray(data?.resco) ? data.resco : [],
    };
  }

  /**
   * 19. Create Bill – Fetch Bill Details
   * GET /jk/resco-installation-create-bill/{id}
   */
  async getCreateBillDetails(id: number | string): Promise<JammuRescoCreateBillData> {
    const res = await fetch(JAMMU_API.INSTALLATION.RESCO.CREATE_BILL(id), {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch bill details (${res.status} ${res.statusText})`);
    }

    const json = await res.json();
    return json?.data || { bills: [] };
  }

  /**
   * 20. Store Monthly Bill
   * POST /jk/installation/resco-bill-store/{id} (multipart/form-data)
   */
  async storeMonthlyBill(id: number | string, formData: FormData): Promise<{ success: boolean; message: string }> {
    const res = await fetch(JAMMU_API.INSTALLATION.RESCO.BILL_STORE(id), {
      method: 'POST',
      headers: getAuthHeaders(true),
      body: formData,
    });

    const json = await res.json().catch(() => null);

    if (res.ok || json?.success === true || json?.status === true) {
      return {
        success: true,
        message: json?.message || 'Bill created successfully',
      };
    }

    throw new Error(json?.message || json?.error || 'Failed to create bill');
  }

  /**
   * 21. Update Monthly Bill
   * POST /jk/installation/resco-bill-update-store/{id} (multipart/form-data)
   */
  async updateMonthlyBill(id: number | string, formData: FormData): Promise<{ success: boolean; message: string }> {
    const res = await fetch(JAMMU_API.INSTALLATION.RESCO.BILL_UPDATE_STORE(id), {
      method: 'POST',
      headers: getAuthHeaders(true),
      body: formData,
    });

    const json = await res.json().catch(() => null);

    if (res.ok || json?.success === true || json?.status === true) {
      return {
        success: true,
        message: json?.message || 'Bill updated successfully',
      };
    }

    throw new Error(json?.message || json?.error || 'Failed to update bill');
  }

  /**
   * 22. Status-wise Installation Data
   * GET /jk/resco-installation-view-data/{status}
   */
  async getStatusWiseData(status: string): Promise<JammuRescoInstalledSiteItem[]> {
    const clean = (status || 'total').trim();
    const norm = normalizeRescoStatus(clean);

    // Build candidate status slug sequence (clean input, normalized, hyphen/underscore variations)
    const candidates = [clean];
    if (!candidates.includes(norm)) candidates.push(norm);
    const altClean = clean.includes('_') ? clean.replace(/_/g, '-') : clean.replace(/-/g, '_');
    if (!candidates.includes(altClean)) candidates.push(altClean);
    const altNorm = norm.includes('_') ? norm.replace(/_/g, '-') : norm.replace(/-/g, '_');
    if (!candidates.includes(altNorm)) candidates.push(altNorm);

    let lastError: Error | null = null;
    for (const st of candidates) {
      try {
        const url = JAMMU_API.INSTALLATION.RESCO.VIEW_DATA_STATUS(st);
        const res = await fetch(url, {
          method: 'GET',
          headers: getAuthHeaders(),
        });

        if (res.status === 404) {
          continue; // Try alternative status slug
        }

        if (!res.ok) {
          lastError = new Error(`Failed to fetch status data (${res.status} ${res.statusText})`);
          continue;
        }

        const json = await res.json().catch(() => null);
        if (json) {
          return extractRescoSiteArray(json);
        }
      } catch (err: any) {
        lastError = err;
      }
    }

    if (lastError) {
      console.warn('[Jammu RESCO getStatusWiseData] Warning:', lastError);
    }
    return [];
  }

  /**
   * 23. District-wise Installation Data
   * GET /jk/resco-installation-view-districtwise/{status}/{district}
   */
  async getDistrictWiseData(status: string, district: string): Promise<JammuRescoInstalledSiteItem[]> {
    const cleanDist = (district || '').trim();
    if (!cleanDist || cleanDist.toLowerCase() === 'all') {
      return this.getStatusWiseData(status);
    }

    const clean = (status || 'total').trim();
    const norm = normalizeRescoStatus(clean);

    const candidates = [clean];
    if (!candidates.includes(norm)) candidates.push(norm);
    const altClean = clean.includes('_') ? clean.replace(/_/g, '-') : clean.replace(/-/g, '_');
    if (!candidates.includes(altClean)) candidates.push(altClean);
    const altNorm = norm.includes('_') ? norm.replace(/_/g, '-') : norm.replace(/-/g, '_');
    if (!candidates.includes(altNorm)) candidates.push(altNorm);

    let lastError: Error | null = null;
    for (const st of candidates) {
      try {
        const url = JAMMU_API.INSTALLATION.RESCO.VIEW_DATA_DISTRICTWISE(st, cleanDist);
        const res = await fetch(url, {
          method: 'GET',
          headers: getAuthHeaders(),
        });

        if (res.status === 404) {
          continue;
        }

        if (!res.ok) {
          lastError = new Error(`Failed to fetch district data (${res.status} ${res.statusText})`);
          continue;
        }

        const json = await res.json().catch(() => null);
        if (json) {
          return extractRescoSiteArray(json);
        }
      } catch (err: any) {
        lastError = err;
      }
    }

    if (lastError) {
      console.warn('[Jammu RESCO getDistrictWiseData] Warning:', lastError);
    }
    return [];
  }
}

export const jammuRescoService = new JammuRescoService();
export default jammuRescoService;
