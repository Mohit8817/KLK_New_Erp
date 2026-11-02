import { API_BASE_URL } from '../../../../services/authService';
import { getAuthToken, resolveUpMediaUrl } from './upComplaintService';

const getBaseUrl = (): string => {
  return (API_BASE_URL || 'https://klkerp.com/api').replace(/\/+$/, '');
};

const makeHeaders = (isMultipart = false): HeadersInit => {
  const token = getAuthToken();
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
};

async function apiRequest<T = any>(
  endpoint: string,
  options: {
    method?: string;
    body?: any;
    isMultipart?: boolean;
  } = {}
): Promise<{ status: boolean; message?: string; data?: T; [key: string]: any }> {
  const base = getBaseUrl();
  const cleanEndpoint = endpoint.replace(/^\/+/, '');
  const url = `${base}/${cleanEndpoint}`;

  const method = options.method || 'GET';
  const headers = makeHeaders(options.isMultipart);

  const init: RequestInit = {
    method,
    headers,
  };

  if (options.body) {
    if (options.isMultipart) {
      init.body = options.body;
    } else if (typeof options.body === 'string') {
      init.body = options.body;
    } else {
      init.body = JSON.stringify(options.body);
    }
  }

  try {
    const res = await fetch(url, init);
    const contentType = res.headers.get('content-type') || '';
    let json: any = null;

    if (contentType.includes('application/json')) {
      json = await res.json();
    } else {
      const text = await res.text();
      try {
        json = JSON.parse(text);
      } catch {
        json = { status: res.ok, message: text };
      }
    }

    if (Array.isArray(json)) {
      return { status: true, data: json as unknown as T };
    }

    if (json && typeof json === 'object') {
      const isSuccess = json.status === true || json.status === 'success' || json.success === true || res.ok;
      return {
        status: isSuccess,
        ...json,
      };
    }

    return { status: res.ok, data: json };
  } catch (err: any) {
    console.warn(`[UP Installation API] Request failed for ${endpoint}:`, err);
    return {
      status: false,
      message: err?.message || 'Network request failed',
      error: err?.message,
    };
  }
}

/* ─────────────────────────────────────────────────────────────
 * TypeScript Interfaces: UP SSL 18W Installation
 * ───────────────────────────────────────────────────────────── */

export interface UpSsl18wAssignSiteItem {
  id: number;
  state?: string;
  project?: string;
  purpose?: string;
  district?: string;
  block?: string;
  panchayat?: string;
  vendor?: string;
  vendor_id?: number;
  start_date?: string;
  end_date?: string;
  site_count?: number;
  file?: string;
  remarks?: string;
  status: number; // 1 = Assigned/Pending, 2 = Accepted
}

export interface UpSsl18wLightDropdownItem {
  id: number;
  uid: string;
}

export interface UpSsl18wLightDetail {
  id: number;
  uid: string;
  state?: string;
  district?: string;
  block?: string;
  panchayat?: string;
  phase?: string;
  wo_no?: string;
  wo_received?: string;
  ward_no?: string | null;
  pole_no?: string | null;
  beneficiary_name?: string | null;
  beneficiary_contact?: string | null;
  battery_serial_no?: string | null;
  light_no?: string | null;
  panel_no?: string | null;
  uuid_no?: string | null;
  latitude?: string | null;
  longitude?: string | null;
  inst_status?: number;
  inst_accept?: number;
  inst_date?: string;
  inst_remarks?: string;
  light_file?: string | null;
  volume?: string;
}

export interface UpSsl18wInstallSiteResponse {
  vendor?: { id: number; name: string; company_id: number };
  ssl_sites?: UpSsl18wLightDetail[];
}

export interface UpSsl18wInstallDetailsCount {
  total: number;
  complete: number;
  pending: number;
  accept?: number;
  verify_approved: number;
  verify_pending: number;
  verify_reject: number;
  claim_applicable: number;
  claim_raised: number;
  claim_not_applicable: number;
  claim_verify_approved: number;
  claim_verify_pending: number;
  claim_verify_reject: number;
  payment_complete: number;
  payment_pending: number;
  payment_partially?: number;
}

export interface UpSsl18wInstalledLightItem {
  id: number;
  uid: string;
  installation_date?: string;
  inst_date?: string;
  state?: string;
  phase?: string;
  district?: string;
  block?: string;
  panchayat?: string;
  ward_no?: string;
  pole_no?: string;
  beneficiary_name?: string;
  beneficiary_contact?: string;
  latitude?: string;
  longitude?: string;
  light_no?: string;
  uuid_no?: string;
  battery_serial_no?: string;
  panel_no?: string;
  light_file?: string;
  remark?: string;
  inst_remarks?: string;
  verify_status?: number;
  claim_status?: number;
  inst_claim_status?: number;
  inst_pay_status?: number;
  payment_status?: number;
  action?: string;
}

export interface UpSsl18wInstalledViewResponse {
  install_details: UpSsl18wInstallDetailsCount;
  payment_sites: UpSsl18wInstalledLightItem[];
  completed_sites: UpSsl18wInstalledLightItem[];
}

export interface UpSsl18wClaimItem {
  id: number;
  company_id?: number;
  vendor_id?: number;
  vendor?: string;
  state?: string;
  project?: string;
  type?: string;
  date?: string;
  claim_status?: number;
  site_id?: string;
  file?: string;
  remarks?: string;
  amount?: string | number;
  claim_amount?: string | number;
  payment_amount?: string | number;
  payment_balance?: string | number;
  payment_date?: string;
  payment_remarks?: string;
  payment_status?: number;
  light_count?: number;
}

export interface UpSsl18wDashboardData {
  install_detail: UpSsl18wInstallDetailsCount;
  district_assigned: { district: string; total: number }[];
  districtwise: {
    district: string;
    total: number;
    assigned: number;
    accept: number;
    not_assigned: number;
    complete: number;
    pending: number;
    verify_approved?: number;
    verify_pending?: number;
    verify_reject?: number;
    claim_applicable?: number;
    claim_raised?: number;
    claim_not_applicable?: number;
    claim_verify_approved?: number;
    claim_verify_pending?: number;
    claim_verify_reject?: number;
    payment_complete?: number;
    payment_pending?: number;
    payment_partially?: number;
  }[];
  vendor_installation_month: {
    month_year: string;
    monthly_installations: number;
  }[];
}

/* ─────────────────────────────────────────────────────────────
 * TypeScript Interfaces: UP Resco Installation
 * ───────────────────────────────────────────────────────────── */

export interface UpRescoAssignSiteItem {
  id: number;
  vendor?: string;
  vendor_id?: number;
  assign_date?: string;
  state?: string;
  district?: string;
  site_name?: string;
  deadline?: string;
  count?: number;
  file?: string;
  remarks?: string;
  status: number;
  location?: string;
  firm_name?: string;
  ca_no?: string;
  sanction_load?: string;
  plant_sc?: string;
  wo_no?: string;
}

export interface UpRescoInstalledSiteItem {
  id: number;
  installation_date?: string;
  state?: string;
  district?: string;
  site_name?: string;
  contact_person?: string;
  contact_number?: string;
  solar_meter_no?: string;
  inverter_no?: string;
  net_smart_meter_no?: string;
  loger_no?: string;
  system_image?: string;
  inverter_image?: string;
  panel_image?: string;
  net_meter_smart_meter_image?: string;
  loger_image?: string;
  latitude?: string;
  longitude?: string;
  remark?: string;
  verify_status?: number;
  verify_remarks?: string;
  document_status?: number;
  document_file?: string;
  document_remarks?: string;
}

export interface UpRescoClaimItem {
  id: number;
  date?: string;
  claim?: string;
  sites?: number | string;
  invoice?: string;
  amount?: number | string;
  remarks?: string;
  status?: number;
  payment_amount?: number | string;
  payment_balance?: number | string;
  payment_date?: string;
  payment_remarks?: string;
  payment_status?: number;
}

export interface UpRescoMonthlyBillItem {
  id: number;
  state?: string;
  district?: string;
  site_name?: string;
  contact_person?: string;
  contact_number?: string;
  solar_meter_no?: string;
  inverter_no?: string;
  net_smart_meter_no?: string;
  loger_no?: string;
  bill_generated?: boolean;
  bill_date?: string;
  bill_amount?: number;
}

/* ─────────────────────────────────────────────────────────────
 * UP Installation Service Implementation
 * ───────────────────────────────────────────────────────────── */

class UpInstallationService {
  /* ──────── SSL 18W: 1. View assigned installations ──────── */
  async getSsl18wAssignSites(): Promise<{ status: boolean; message?: string; data: UpSsl18wAssignSiteItem[] }> {
    const res = await apiRequest<UpSsl18wAssignSiteItem[]>('up/view-18w-assign-installation-sites');
    return {
      status: res.status,
      message: res.message,
      data: Array.isArray(res.data) ? res.data : [],
    };
  }

  /* ──────── SSL 18W: 2. Accept installation ──────── */
  async acceptSsl18wInstallation(id: number | string): Promise<{ status: boolean; message?: string; errors?: any }> {
    return apiRequest(`up-ssl-18w-accept-installation?id=${id}`);
  }

  /* ──────── SSL 18W: 3. Fetch light IDs ready for installation ──────── */
  async getSsl18wAvailableLights(): Promise<UpSsl18wLightDropdownItem[]> {
    let res = await apiRequest<UpSsl18wLightDropdownItem[]>('up/ssl18w/installation-fetch-light');
    if (!res.status || !Array.isArray(res.data)) {
      res = await apiRequest<UpSsl18wLightDropdownItem[]>('up-ssl-18w-installation-fetch-light');
    }
    return Array.isArray(res.data) ? res.data : [];
  }

  /* ──────── SSL 18W: 4. Fetch light details ──────── */
  async getSsl18wLightDetails(id: number | string): Promise<UpSsl18wLightDetail | null> {
    const res = await apiRequest<UpSsl18wLightDetail>(`up/ssl18w/installation-fetch-light-details/${id}`);
    if (res.status && res.data) {
      return res.data;
    }
    return null;
  }

  /* ──────── SSL 18W: 5. Update SSL site (install list & parent vendor) ──────── */
  async getSsl18wInstallSiteData(): Promise<UpSsl18wInstallSiteResponse> {
    const res = await apiRequest('up/ssl-install-18w-light');
    return {
      vendor: res.vendor,
      ssl_sites: Array.isArray(res.ssl_sites) ? res.ssl_sites : [],
    };
  }

  /* ──────── SSL 18W: 6. Fetch data (short list) ──────── */
  async getSsl18wLightDetailShort(): Promise<UpSsl18wLightDetail[]> {
    const res = await apiRequest('up/ssl-fetch-18w-light-detail');
    if (res.data?.up_ssl18ws && Array.isArray(res.data.up_ssl18ws)) {
      return res.data.up_ssl18ws;
    }
    return [];
  }

  /* ──────── SSL 18W: 7. Installation store ──────── */
  async storeSsl18wInstallation(fd: FormData): Promise<{ status: boolean; message?: string; errors?: any; data?: any }> {
    return apiRequest('up/ssl-install-18w-light-store', {
      method: 'POST',
      body: fd,
      isMultipart: true,
    });
  }

  /* ──────── SSL 18W: 8. View installed lights ──────── */
  async getSsl18wInstalledLights(): Promise<UpSsl18wInstalledViewResponse> {
    const res = await apiRequest('up/ssl-view-installed-18w-light');
    const install_details: UpSsl18wInstallDetailsCount = res.install_details || {
      total: 0,
      complete: 0,
      pending: 0,
      verify_approved: 0,
      verify_pending: 0,
      verify_reject: 0,
      claim_applicable: 0,
      claim_raised: 0,
      claim_not_applicable: 0,
      claim_verify_approved: 0,
      claim_verify_pending: 0,
      claim_verify_reject: 0,
      payment_complete: 0,
      payment_pending: 0,
    };
    return {
      install_details,
      payment_sites: Array.isArray(res.payment_sites) ? res.payment_sites : [],
      completed_sites: Array.isArray(res.completed_sites) ? res.completed_sites : [],
    };
  }

  /* ──────── SSL 18W: 9. Update install site (fetch installed light) ──────── */
  async getSsl18wInstalledLightForEdit(id: number | string): Promise<UpSsl18wLightDetail | null> {
    const res = await apiRequest<UpSsl18wLightDetail>(`up/ssl-install-18w-light-update?id=${id}`);
    if (res.status && res.data) {
      return res.data;
    }
    return null;
  }

  /* ──────── SSL 18W: 10. Installation edit store ──────── */
  async updateSsl18wInstallation(fd: FormData): Promise<{ status: boolean; message?: string; errors?: any }> {
    return apiRequest('up/ssl-installation-18w-light-edit-store', {
      method: 'POST',
      body: fd,
      isMultipart: true,
    });
  }

  /* ──────── SSL 18W: 11. View claim requests ──────── */
  async getSsl18wClaims(vendorId?: number | string): Promise<UpSsl18wClaimItem[]> {
    const q = vendorId ? `?vendor_id=${vendorId}` : '';
    const res = await apiRequest<UpSsl18wClaimItem[]>(`up/ssl-view-installation-18w-claim${q}`);
    return Array.isArray(res.data) ? res.data : [];
  }

  /* ──────── SSL 18W: 12. Add claim ──────── */
  async storeSsl18wClaim(fd: FormData): Promise<{ status: boolean; message?: string; errors?: any; data?: any }> {
    return apiRequest('up/ssl-installation-18w-claim-store', {
      method: 'POST',
      body: fd,
      isMultipart: true,
    });
  }

  /* ──────── SSL 18W: 13. Update claim ──────── */
  async updateSsl18wClaim(fd: FormData): Promise<{ status: boolean; message?: string; errors?: any; data?: any }> {
    return apiRequest('up/ssl-installation-18w-update-claim-store', {
      method: 'POST',
      body: fd,
      isMultipart: true,
    });
  }

  /* ──────── SSL 18W: 14. Claim applicable lights ──────── */
  async getSsl18wClaimApplicableLights(): Promise<{ count: number; ids: number[] }> {
    const res = await apiRequest('up/ssl-fetch-claim-applicable-light');
    return {
      count: Number(res.count ?? (res.ids?.length || 0)),
      ids: Array.isArray(res.ids) ? res.ids : [],
    };
  }

  /* ──────── SSL 18W: 15. Dashboard summary ──────── */
  async getSsl18wDashboardData(): Promise<UpSsl18wDashboardData | null> {
    const res = await apiRequest<UpSsl18wDashboardData>('up/ssl-18w-installation-dashboard');
    if (res.status && res.data) {
      return res.data;
    }
    return null;
  }

  /* ──────── SSL 18W: 16. Dashboard by status ──────── */
  async getSsl18wDashboardByStatus(status: string): Promise<UpSsl18wInstalledLightItem[]> {
    const res = await apiRequest(`up/ssl18w/installation-view-dashboard/${status}`);
    if (res.data?.ssl && Array.isArray(res.data.ssl)) {
      return res.data.ssl;
    }
    if (Array.isArray(res.data)) {
      return res.data;
    }
    return [];
  }

  /* ──────── SSL 18W: 17. Dashboard district-wise ──────── */
  async getSsl18wDashboardByDistrict(status: string, district: string): Promise<UpSsl18wInstalledLightItem[]> {
    const res = await apiRequest(`up/ssl18w/installation-view-districtwise/${status}/${encodeURIComponent(district)}`);
    if (res.data?.ssl && Array.isArray(res.data.ssl)) {
      return res.data.ssl;
    }
    if (Array.isArray(res.data)) {
      return res.data;
    }
    return [];
  }

  /* ─────────────────────────────────────────────────────────────
   * RESCO INSTALLATION METHODS
   * ───────────────────────────────────────────────────────────── */

  async getRescoAssignSites(): Promise<{ status: boolean; message?: string; data: UpRescoAssignSiteItem[] }> {
    let res = await apiRequest<UpRescoAssignSiteItem[]>('up/resco-view-assign-installation-sites');
    if (!res.status || !Array.isArray(res.data)) {
      res = await apiRequest<UpRescoAssignSiteItem[]>('up/view-resco-assign-installation-sites');
    }
    return {
      status: res.status,
      message: res.message,
      data: Array.isArray(res.data) ? res.data : [],
    };
  }

  async getRescoInstallSiteData(): Promise<{ status: boolean; data?: any }> {
    return apiRequest('up/resco-install-site');
  }

  async storeRescoInstallation(fd: FormData): Promise<{ status: boolean; message?: string; errors?: any }> {
    return apiRequest('up/resco-install-site-store', {
      method: 'POST',
      body: fd,
      isMultipart: true,
    });
  }

  async getRescoInstalledSites(): Promise<{
    status: boolean;
    install_details?: any;
    data?: UpRescoInstalledSiteItem[];
  }> {
    let res = await apiRequest('up/resco-view-install-site');
    return {
      status: res.status,
      install_details: res.install_details,
      data: Array.isArray(res.data) ? res.data : Array.isArray(res) ? res : [],
    };
  }

  async getRescoClaims(): Promise<UpRescoClaimItem[]> {
    const res = await apiRequest<UpRescoClaimItem[]>('up/resco-installation-claim');
    return Array.isArray(res.data) ? res.data : [];
  }

  async storeRescoClaim(fd: FormData): Promise<{ status: boolean; message?: string; errors?: any }> {
    return apiRequest('up/resco-installation-claim-store', {
      method: 'POST',
      body: fd,
      isMultipart: true,
    });
  }

  async getRescoMonthlyBill(): Promise<UpRescoMonthlyBillItem[]> {
    const res = await apiRequest<UpRescoMonthlyBillItem[]>('up/resco-view-install');
    return Array.isArray(res.data) ? res.data : [];
  }

  async getRescoDashboard(): Promise<any> {
    return apiRequest('up/resco-installation-dashboard');
  }
}

export const upInstallationService = new UpInstallationService();
export default upInstallationService;
