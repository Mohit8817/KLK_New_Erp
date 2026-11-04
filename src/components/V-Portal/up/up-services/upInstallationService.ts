import { API_BASE_URL } from '../../../../services/authService';
import { getAuthToken, resolveUpMediaUrl } from './upComplaintService';

export { resolveUpMediaUrl };

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
      // Some endpoints (e.g. Kusum-C view-claim) return HTTP 500 with status: true
      const isSuccess =
        json.status === true ||
        json.status === 'success' ||
        json.success === true ||
        (res.ok && json.status !== false && json.success !== false);
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

/* ═════════════════════════════════════════════════════════════════════
 * 1. UP SSL 18W INSTALLATION INTERFACES
 * ═════════════════════════════════════════════════════════════════════ */

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

/* ═════════════════════════════════════════════════════════════════════
 * 2. UP RESCO INSTALLATION INTERFACES
 * ═════════════════════════════════════════════════════════════════════ */

export interface UpRescoAssignSiteItem {
  id: number;
  state?: string;
  type?: string;
  purpose?: string;
  status: number;
  site_name?: Record<string, string> | string; // Map of site_name -> deadline
  vendors?: { id: number; name: string };
  // Flattened helpers for UI
  vendor?: string;
  vendor_id?: number;
  district?: string;
  deadline?: string;
  count?: number;
  location?: string;
  firm_name?: string;
  ca_no?: string;
  sanction_load?: string;
  plant_sc?: string;
  wo_no?: string;
}

export interface UpRescoSiteDetail {
  id: number;
  state?: string;
  district?: string;
  dept_name?: string;
  site_name?: string;
  address?: string;
  firm_name?: string;
  ca_no?: string;
  plant_sc?: string;
  wo_no?: string;
  sanction_load?: string;
  contact_person?: string | null;
  contact_number?: string | null;
  inverter_no?: string | null;
  solarmeter_no?: string | null;
  nm_sm_no?: string | null;
  loger_no?: string | null;
  panel_image?: string | null;
  system_image?: string | null;
  inverter_image?: string | null;
  nm_sm_image?: string | null;
  loger_image?: string | null;
  inst_status?: number;
  inst_latitude?: string;
  inst_longitude?: string;
  inst_remarks?: string;
}

export interface UpRescoClaimItem {
  id: number;
  date?: string;
  claim?: string;
  sites?: number | string;
  amount?: number | string;
  remarks?: string;
  status?: number;
  payment_amount?: number | string;
  payment_balance?: number | string;
  payment_date?: string;
  payment_remarks?: string;
  payment_status?: number;
  [key: string]: any;
}

export interface UpRescoInstalledSiteItem {
  id: number;
  state?: string;
  district?: string;
  site_name?: string;
  installation_date?: string;
  contact_person?: string;
  contact_number?: string;
  solar_meter_no?: string;
  inverter_no?: string;
  net_smart_meter_no?: string;
  loger_no?: string;
  latitude?: string;
  longitude?: string;
  remark?: string;
  verify_status?: number;
  verify_remarks?: string;
  document_status?: number;
  document_file?: string;
  document_remarks?: string;
  system_image?: string;
  inverter_image?: string;
  panel_image?: string;
  net_meter_smart_meter_image?: string;
  loger_image?: string;
  [key: string]: any;
}

export interface UpRescoInstallCounts {
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

export interface UpRescoPanelItem {
  id: number;
  site_id: number;
  panel_no: string;
}

export interface UpRescoVerifiedSite {
  id: number;
  site_name: string;
  district?: string;
  sanction_load?: string;
  inst_status?: number;
  inst_verify_status?: number;
}

export interface UpRescoBillInverterReading {
  inverter_no: string;
  previous_reading: number;
  current_reading: number;
  generated_reading: number;
  amount: number;
}

export interface UpRescoBillItem {
  id: number;
  bill_no: string;
  bill_date?: string;
  billing_from?: string;
  billing_to?: string;
  due_date?: string;
  bill_amount: number | string;
  per_unit_price?: number;
  bill_status?: number;
  readings?: UpRescoBillInverterReading[];
}

export interface UpRescoDashboardCounts {
  site_count: number;
  complete: number;
  pending: number;
  verify_pending: number;
  verify_approved: number;
  verify_reject: number;
  doc_approved: number;
  doc_pending: number;
  doc_reject: number;
  inst_claim1_applicable?: number;
  inst_claim1_raised?: number;
  inst_claim1_approved?: number;
  inst_claim1_reject?: number;
  inst_claim1_pending?: number;
  inst_claim2_applicable?: number;
  inst_claim2_raised?: number;
  inst_claim2_approved?: number;
  inst_claim2_reject?: number;
  inst_claim2_pending?: number;
  inst_claim3_applicable?: number;
  inst_claim3_raised?: number;
  inst_claim3_approved?: number;
  inst_claim3_reject?: number;
  inst_claim3_pending?: number;
  inst_pay1_complete?: number;
  inst_pay1_partially?: number;
  inst_pay1_pending?: number;
  inst_pay2_complete?: number;
  inst_pay2_partially?: number;
  inst_pay2_pending?: number;
  inst_pay3_complete?: number;
  inst_pay3_partially?: number;
  inst_pay3_pending?: number;
}

/* ═════════════════════════════════════════════════════════════════════
 * 3. UP KUSUM-C INSTALLATION INTERFACES
 * ═════════════════════════════════════════════════════════════════════ */

export interface UpKusumCReadySiteItem {
  id: number;
  lot_no?: string;
  state?: string;
  phase?: string;
  volume?: string;
  f_customer_no?: string;
  f_farmer_name?: string;
  f_father_name?: string;
  f_contact?: string;
  f_village?: string;
  f_post?: string;
  f_tehsil?: string;
  f_district?: string;
  f_block?: string;
  pump_capacity?: string;
  vfd_no?: string | null;
  inverter_no?: string | null;
}

export interface UpKusumCAssignmentItem {
  id: number;
  state?: string;
  project?: string;
  purpose?: string;
  site_id?: string; // e.g. "[701,702]"
  status: number; // 1 = Assigned, 2 = Accepted
  Names?: { f_farmer_name: string; inst_deadline: string }[];
  details?: {
    state?: string;
    f_district?: string;
    f_post?: string;
    f_village?: string;
    f_farmer_name?: string;
    f_father_name?: string;
    inst_deadline?: string;
  }[];
}

export interface UpKusumCInstalledCounts {
  total: number;
  total_assign?: number;
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
  pending_pay?: number;
  payment_pending?: number;
  inst_pay_pending?: number;
  [key: string]: any;
}

export interface UpKusumCInstalledSiteItem {
  id: number;
  state?: string;
  f_state?: string;
  district?: string;
  f_district?: string;
  block?: string;
  f_block?: string;
  village?: string;
  f_village?: string;
  post?: string;
  f_post?: string;
  applicant_name?: string;
  farmer_name?: string;
  f_farmer_name?: string;
  beneficiary_name?: string;
  father_name?: string;
  f_father_name?: string;
  contact_no?: string;
  f_contact?: string;
  pump_capacity?: string;
  vfd_no?: string;
  vfd_serial_no?: string;
  inverter_no?: string;
  inverter_serial_no?: string;
  module_serial_no?: string | string[];
  module_no?: string;
  latitude?: string;
  longitude?: string;
  module_image?: string;
  farmer_module_image?: string;
  inverter_vfd_image?: string;
  inverter_image?: string;
  vfd_image?: string;
  running_water_image?: string;
  water_image?: string;
  hoc_photo?: string;
  remarks?: string;
  inst_remarks?: string;
  inst_status?: number;
  inst_verify_status?: number;
  verify_status?: number;
  verify_remarks?: string;
  inst_verify_remarks?: string;
  verification_remarks?: string;
  inst_doc_status?: number; // 1 = Pending/Submitted, 2 = Approved, 3 = Rejected
  document_status?: number;
  doc_verify_remarks?: string;
  inst_doc_remarks?: string;
  hoc_remarks?: string;
  inst_claim_status?: number;
  claim_status?: number;
  inst_pay_status?: number;
  payment_status?: number;
  pay_status?: number;
  inst_date?: string;
  [key: string]: any;
}

export interface UpKusumCClaimPaymentItem {
  id: number;
  project?: string;
  type?: string;
  state?: string;
  amount: number | string;
  site_id: string; // e.g. "[701,702]"
  file?: string;
  remarks?: string;
  claim_status: number;
  created_by?: number;
}

export interface UpKusumCDashboardCounts {
  site_count: number;
  complete: number;
  pending: number;
  site_assigned: number;
  accept_pending: number;
  site_not_assigned: number;
  verify_pending: number;
  verify_approved: number;
  verify_reject: number;
  doc_approved: number;
  doc_pending: number;
  doc_reject: number;
  claim_applicable: number;
  claim_raised: number;
  claim_approved: number;
  claim_pending: number;
  inst_pay_done: number;
  inst_pay_partially: number;
  inst_pay_pending: number;
}

export interface UpKusumCDashboardData {
  kusumc: UpKusumCDashboardCounts;
  district_install?: { f_district: string; inst_complete: number }[];
  districtwise?: {
    f_district: string;
    total: number;
    total_assigned?: number;
    inst_complete?: number;
    inst_pending?: number;
    verify_approved?: number;
    verify_pending?: number;
    verify_reject?: number;
    claim_raised?: number;
    claim_approved?: number;
    claim_reject?: number;
    payment_done?: number;
    payment_partially?: number;
    payment_pending?: number;
  }[];
  $districtInstaMonth?: {
    month_year: string;
    monthly_installations: number;
  }[];
}

/* ═════════════════════════════════════════════════════════════════════
 * SERVICE IMPLEMENTATION (19 Resco + 17 Kusum-C + 17 SSL 18W)
 * ═════════════════════════════════════════════════════════════════════ */

class UpInstallationService {
  /* ─────────────────────────────────────────────────────────────
   * 1. UP SSL 18W INSTALLATION APIs (Endpoints 1-17)
   * ───────────────────────────────────────────────────────────── */

  /** SSL 1: List assignments */
  async getSsl18wAssignSites(): Promise<{ status: boolean; message?: string; data: UpSsl18wAssignSiteItem[] }> {
    const res = await apiRequest<UpSsl18wAssignSiteItem[]>('up/view-18w-assign-installation-sites');
    return {
      status: res.status,
      message: res.message,
      data: Array.isArray(res.data) ? res.data : [],
    };
  }

  /** SSL 2: Accept installation */
  async acceptSsl18wInstallation(id: number | string): Promise<{ status: boolean; message?: string; errors?: any }> {
    return apiRequest(`up-ssl-18w-accept-installation?id=${id}`);
  }

  /** SSL 3: Lights ready for installation dropdown */
  async getSsl18wAvailableLights(): Promise<UpSsl18wLightDropdownItem[]> {
    let res = await apiRequest<UpSsl18wLightDropdownItem[]>('up/ssl18w/installation-fetch-light');
    if (!res.status || !Array.isArray(res.data)) {
      res = await apiRequest<UpSsl18wLightDropdownItem[]>('up-ssl-18w-installation-fetch-light');
    }
    return Array.isArray(res.data) ? res.data : [];
  }

  /** SSL 4: Fetch light details */
  async getSsl18wLightDetails(id: number | string): Promise<UpSsl18wLightDetail | null> {
    const res = await apiRequest<UpSsl18wLightDetail>(`up/ssl18w/installation-fetch-light-details/${id}`);
    return res.status && res.data ? res.data : null;
  }

  /** SSL 5: Pending lights and parent vendor */
  async getSsl18wInstallSiteData(): Promise<UpSsl18wInstallSiteResponse> {
    const res = await apiRequest('up/ssl-install-18w-light');
    return {
      vendor: res.vendor,
      ssl_sites: Array.isArray(res.ssl_sites) ? res.ssl_sites : [],
    };
  }

  /** SSL 6: Pending lights (short list) */
  async getSsl18wLightDetailShort(): Promise<UpSsl18wLightDetail[]> {
    const res = await apiRequest('up/ssl-fetch-18w-light-detail');
    return res.data?.up_ssl18ws && Array.isArray(res.data.up_ssl18ws) ? res.data.up_ssl18ws : [];
  }

  /** SSL 7: Submit installation (multipart) */
  async storeSsl18wInstallation(fd: FormData): Promise<{ status: boolean; message?: string; errors?: any; data?: any }> {
    return apiRequest('up/ssl-install-18w-light-store', {
      method: 'POST',
      body: fd,
      isMultipart: true,
    });
  }

  /** SSL 8: Installed lights and counts */
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

  /** SSL 9: Fetch an installed light for editing */
  async getSsl18wInstalledLightForEdit(id: number | string): Promise<UpSsl18wLightDetail | null> {
    const res = await apiRequest<UpSsl18wLightDetail>(`up/ssl-install-18w-light-update?id=${id}`);
    return res.status && res.data ? res.data : null;
  }

  /** SSL 10: Save edits to an installed light (multipart) */
  async updateSsl18wInstallation(fd: FormData): Promise<{ status: boolean; message?: string; errors?: any }> {
    return apiRequest('up/ssl-installation-18w-light-edit-store', {
      method: 'POST',
      body: fd,
      isMultipart: true,
    });
  }

  /** SSL 11: List claims */
  async getSsl18wClaims(vendorId?: number | string): Promise<UpSsl18wClaimItem[]> {
    const q = vendorId ? `?vendor_id=${vendorId}` : '';
    const res = await apiRequest<UpSsl18wClaimItem[]>(`up/ssl-view-installation-18w-claim${q}`);
    return Array.isArray(res.data) ? res.data : [];
  }

  /** SSL 12: Raise a claim (multipart) */
  async storeSsl18wClaim(fd: FormData): Promise<{ status: boolean; message?: string; errors?: any; data?: any }> {
    return apiRequest('up/ssl-installation-18w-claim-store', {
      method: 'POST',
      body: fd,
      isMultipart: true,
    });
  }

  /** SSL 13: Edit a claim (multipart) */
  async updateSsl18wClaim(fd: FormData): Promise<{ status: boolean; message?: string; errors?: any; data?: any }> {
    return apiRequest('up/ssl-installation-18w-update-claim-store', {
      method: 'POST',
      body: fd,
      isMultipart: true,
    });
  }

  /** SSL 14: Lights eligible for a claim */
  async getSsl18wClaimApplicableLights(): Promise<{ count: number; ids: number[] }> {
    const res = await apiRequest('up/ssl-fetch-claim-applicable-light');
    return {
      count: Number(res.count ?? (res.ids?.length || 0)),
      ids: Array.isArray(res.ids) ? res.ids : [],
    };
  }

  /** SSL 15: Dashboard summary */
  async getSsl18wDashboardData(): Promise<UpSsl18wDashboardData | null> {
    const res = await apiRequest<UpSsl18wDashboardData>('up/ssl-18w-installation-dashboard');
    return res.status && res.data ? res.data : null;
  }

  /** SSL 16: Lights by status */
  async getSsl18wDashboardByStatus(status: string): Promise<UpSsl18wInstalledLightItem[]> {
    const res = await apiRequest(`up/ssl18w/installation-view-dashboard/${status}`);
    return res.data?.ssl && Array.isArray(res.data.ssl)
      ? res.data.ssl
      : Array.isArray(res.data)
      ? res.data
      : [];
  }

  /** SSL 17: Lights by status and district */
  async getSsl18wDashboardByDistrict(status: string, district: string): Promise<UpSsl18wInstalledLightItem[]> {
    const res = await apiRequest(`up/ssl18w/installation-view-districtwise/${status}/${encodeURIComponent(district)}`);
    return res.data?.ssl && Array.isArray(res.data.ssl)
      ? res.data.ssl
      : Array.isArray(res.data)
      ? res.data
      : [];
  }

  /* ─────────────────────────────────────────────────────────────
   * 2. UP RESCO INSTALLATION APIs (Endpoints 1-19)
   * ───────────────────────────────────────────────────────────── */

  /** Resco 1: View assigned installations */
  async getRescoAssignSites(): Promise<{ status: boolean; message?: string; data: UpRescoAssignSiteItem[] }> {
    const res = await apiRequest('up/resco/installation/view-assign-sites');
    let items: UpRescoAssignSiteItem[] = [];

    if (Array.isArray(res.data)) {
      items = res.data.map((row: any) => {
        const assign = row.assign_resc || row;
        return {
          id: assign.id,
          state: assign.state || 'up',
          type: assign.type || 'resco',
          purpose: assign.purpose || 'installation',
          status: assign.status,
          site_name: assign.site_name,
          vendors: assign.vendors,
          vendor: assign.vendors?.name,
          vendor_id: assign.vendors?.id,
        };
      });
    }

    return {
      status: res.status,
      message: res.message,
      data: items,
    };
  }

  /** Resco 2: View assigned site detail */
  async getRescoAssignDetail(id: number | string): Promise<{ status: boolean; data?: UpRescoAssignSiteItem }> {
    const res = await apiRequest(`up/resco/installation/view-assign-detail/${id}`);
    return {
      status: res.status,
      data: res.data,
    };
  }

  /** Resco 3: Accept assignment */
  async acceptRescoAssignment(id: number | string): Promise<{ status: boolean; message?: string; error?: any }> {
    return apiRequest(`up/resco/installation/assign-accept/${id}`);
  }

  /** Resco 4: Fetch sites ready for installation (dropdown) */
  async getRescoAvailableSites(): Promise<{ id: number; site_name: string }[]> {
    const res = await apiRequest('up/resco/installation/fetch-site');
    return Array.isArray(res.data) ? res.data : [];
  }

  /** Resco 5: Fetch site detail */
  async getRescoSiteDetail(id: number | string): Promise<UpRescoSiteDetail | null> {
    const res = await apiRequest<UpRescoSiteDetail>(`up/resco/installation/fetch-site-detail/${id}`);
    return res.status && res.data ? res.data : null;
  }

  /** Resco 6: Submit an installation (multipart) */
  async storeRescoInstallation(fd: FormData): Promise<{ status: boolean; message?: string; errors?: any }> {
    return apiRequest('up/resco/installation/install-site-store', {
      method: 'POST',
      body: fd,
      isMultipart: true,
    });
  }

  /** Resco 7: Installation counts / summary */
  async getRescoInstallCounts(): Promise<UpRescoInstallCounts | null> {
    const res = await apiRequest('up/resco/installation/view-install-site');
    return res.status && res.data ? res.data : null;
  }

  /** Resco 7b: List of completed installations */
  async getRescoInstalledSites(): Promise<{ status: boolean; data: UpRescoInstalledSiteItem[] }> {
    try {
      const res = await apiRequest('up/resco/installation/view-dashboard/complete');
      const list = Array.isArray(res.data) ? res.data : (res.data?.resco || res.data?.ssl || []);
      return { status: true, data: list };
    } catch {
      return { status: false, data: [] };
    }
  }

  /** Resco 8: Fetch site for editing */
  async getRescoSiteForEdit(id: number | string): Promise<{ ven?: any; resco?: UpRescoSiteDetail } | null> {
    const res = await apiRequest(`up/resco/installation/site-update/${id}`);
    return res.status && res.data ? res.data : null;
  }

  /** Resco 9: Save edits to an installation (multipart) */
  async updateRescoInstallation(fd: FormData): Promise<{ status: boolean; message?: string; errors?: any }> {
    return apiRequest('up/resco/installation/site-update-store', {
      method: 'POST',
      body: fd,
      isMultipart: true,
    });
  }

  /** Resco 10: Submit installation document (multipart) */
  async submitRescoDocument(fd: FormData): Promise<{ status: boolean; message?: string; data?: any; errors?: any }> {
    return apiRequest('up/resco/installation/document-submit', {
      method: 'POST',
      body: fd,
      isMultipart: true,
    });
  }

  /** Resco 11: Import panel numbers from Excel (multipart) */
  async importRescoPanels(fd: FormData): Promise<{ status: boolean; message?: string; duplicates?: string[]; errors?: any }> {
    return apiRequest('up/resco/installation/panel-store', {
      method: 'POST',
      body: fd,
      isMultipart: true,
    });
  }

  /** Resco 12: View panels of a site */
  async getRescoPanels(rescoId: number | string): Promise<{ resco?: any; panels: UpRescoPanelItem[] }> {
    const res = await apiRequest(`up/resco/installation/view-panel?resco_id=${rescoId}`);
    return {
      resco: res.data?.resco,
      panels: Array.isArray(res.data?.panels) ? res.data.panels : [],
    };
  }

  /** Resco 13: Verified installed sites (pick a site for billing) */
  async getRescoVerifiedSites(): Promise<UpRescoVerifiedSite[]> {
    const res = await apiRequest('up/resco/view-install');
    return Array.isArray(res.data) ? res.data : [];
  }

  /** Resco 14: Data for the bill form */
  async getRescoBillFormData(rescoId: number | string): Promise<{
    resco?: UpRescoVerifiedSite & { inverter_no?: string };
    readingAmount?: number;
    bills?: UpRescoBillItem[];
    previousReadings?: Record<string, number>;
  } | null> {
    const res = await apiRequest(`up/resco/create-bill?resco_id=${rescoId}`);
    return res.status && res.data ? res.data : null;
  }

  /** Resco 15: Bills of a site */
  async getRescoSiteBills(rescoId: number | string): Promise<{ rescos?: any; bills: UpRescoBillItem[] }> {
    const res = await apiRequest(`up/resco/view-create-bill?resco_id=${rescoId}`);
    return {
      rescos: res.data?.rescos,
      bills: Array.isArray(res.data?.bills) ? res.data.bills : [],
    };
  }

  /** Resco 16: Create a bill (multipart) */
  async storeRescoBill(fd: FormData): Promise<{ status: boolean; message?: string; data?: any; errors?: any }> {
    return apiRequest('up/resco/bill-store', {
      method: 'POST',
      body: fd,
      isMultipart: true,
    });
  }

  /** Resco Claim Helper: List claims */
  async getRescoClaims(): Promise<UpRescoClaimItem[]> {
    try {
      const res = await apiRequest('up/resco/installation/view-claim');
      return Array.isArray(res.data) ? res.data : (res.data?.payments || []);
    } catch {
      return [];
    }
  }

  /** Resco Claim Helper: Submit claim */
  async storeRescoClaim(fd: FormData): Promise<{ status: boolean; message?: string }> {
    try {
      return await apiRequest('up/resco/installation/claim-store', {
        method: 'POST',
        body: fd,
        isMultipart: true,
      });
    } catch (err: any) {
      return { status: false, message: err?.message || 'Failed to submit claim' };
    }
  }

  /** Resco 17: Dashboard summary */
  async getRescoDashboard(): Promise<UpRescoDashboardCounts | null> {
    const res = await apiRequest('up/resco/installation/dashboard');
    return res.status && res.data ? res.data : null;
  }

  /** Resco 18: Sites by status */
  async getRescoDashboardByStatus(status: string): Promise<any[]> {
    const res = await apiRequest(`up/resco/installation/view-dashboard/${status}`);
    return Array.isArray(res.data) ? res.data : [];
  }

  /** Resco 19: Sites by status and district */
  async getRescoDashboardByDistrict(status: string, district: string): Promise<any[]> {
    const res = await apiRequest(`up/resco/installation/view-districtwise/${status}/${encodeURIComponent(district)}`);
    return Array.isArray(res.data) ? res.data : [];
  }

  /* ─────────────────────────────────────────────────────────────
   * 3. UP KUSUM-C INSTALLATION APIs (Endpoints 1-17)
   * ───────────────────────────────────────────────────────────── */

  /** Kusum-C 1: Sites ready for installation */
  async getKusumCReadySites(): Promise<UpKusumCReadySiteItem[]> {
    const res = await apiRequest('up/kusumc/installation');
    return Array.isArray(res.data) ? res.data : [];
  }

  /** Kusum-C 2: Assigned batches */
  async getKusumCAssignments(): Promise<UpKusumCAssignmentItem[]> {
    const res = await apiRequest('up/kusumc/view-assign-installation');
    return Array.isArray(res.data) ? res.data : [];
  }

  /** Kusum-C 3: Sites in one batch */
  async getKusumCAssignmentDetail(id: number | string): Promise<UpKusumCAssignmentItem | null> {
    const res = await apiRequest(`up/kusumc/view-assign-installation-detail?id=${id}`);
    return res.status && res.data ? res.data : null;
  }

  /** Kusum-C 4: Accept a batch */
  async acceptKusumCAssignment(id: number | string): Promise<{ status: boolean; message?: string; errors?: any }> {
    return apiRequest(`up/kusumc/assign-site-accept?id=${id}`);
  }

  /** Kusum-C 5: Submit an installation (multipart) */
  async storeKusumCInstallation(fd: FormData): Promise<{ status: boolean; message?: string; errors?: any }> {
    return apiRequest('up/kusumc/installation-store', {
      method: 'POST',
      body: fd,
      isMultipart: true,
    });
  }

  /** Kusum-C 6: Installed sites and counts (note route spelling: view-installtion) */
  async getKusumCInstalledSites(): Promise<{
    assign?: number;
    install_detail: UpKusumCInstalledCounts;
    sites: UpKusumCInstalledSiteItem[];
  }> {
    const res = await apiRequest('up/kusumc/view-installtion');
    const defaultCounts: UpKusumCInstalledCounts = {
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
    };

    return {
      assign: res.data?.assign,
      install_detail: res.data?.install_detail || defaultCounts,
      sites: Array.isArray(res.data?.sites) ? res.data.sites : [],
    };
  }

  /** Kusum-C 7: Fetch a site for editing */
  async getKusumCSiteForEdit(id: number | string): Promise<UpKusumCInstalledSiteItem | null> {
    const res = await apiRequest(`up/kusumc/edit-installation?id=${id}`);
    return res.status && res.data ? res.data : null;
  }

  /** Kusum-C 8: Save edits to an installation (multipart) */
  async updateKusumCInstallation(fd: FormData): Promise<{ status: boolean; message?: string; errors?: any }> {
    return apiRequest('up/kusumc/edit-installation-store', {
      method: 'POST',
      body: fd,
      isMultipart: true,
    });
  }

  /** Kusum-C 9: Submit HOC photo (multipart) */
  async submitKusumCHoc(fd: FormData): Promise<{ status: boolean; message?: string; errors?: any }> {
    return apiRequest('up/kusumc/installation-doc-store', {
      method: 'POST',
      body: fd,
      isMultipart: true,
    });
  }

  /** Kusum-C 10: Site dropdown list (uses success flag) */
  async getKusumCAvailableSites(): Promise<{ id: number; f_farmer_name: string }[]> {
    const res = await apiRequest('up/kusumc/installation/fetch-site');
    return Array.isArray(res.data) ? res.data : [];
  }

  /** Kusum-C 11: Detail of one site */
  async getKusumCSiteDetail(id: number | string): Promise<UpKusumCReadySiteItem | null> {
    const res = await apiRequest(`up/kusumc/installation/fetch-site-details/${id}`);
    return res.status && res.data ? res.data : null;
  }

  /** Kusum-C 12: Claims and claimable sites */
  async getKusumCClaims(): Promise<{
    payments: UpKusumCClaimPaymentItem[];
    sites: { id: number; f_farmer_name: string; inst_doc_status: number }[];
  }> {
    const res = await apiRequest('up/kusumc/installation/view-claim');
    return {
      payments: Array.isArray(res.data?.payments) ? res.data.payments : [],
      sites: Array.isArray(res.data?.sites) ? res.data.sites : [],
    };
  }

  /** Kusum-C 13: Raise a claim (multipart) */
  async storeKusumCClaim(fd: FormData): Promise<{ status: boolean; message?: string; data?: any; errors?: any }> {
    return apiRequest('up/kusumc/installation/add-claim', {
      method: 'POST',
      body: fd,
      isMultipart: true,
    });
  }

  /** Kusum-C 14: Edit a claim (multipart) */
  async updateKusumCClaim(fd: FormData): Promise<{ status: boolean; message?: string; payment?: any; errors?: any }> {
    return apiRequest('up/kusumc/installation/update-claim', {
      method: 'POST',
      body: fd,
      isMultipart: true,
    });
  }

  /** Kusum-C 15: Dashboard summary */
  async getKusumCDashboard(): Promise<UpKusumCDashboardData | null> {
    const res = await apiRequest('up/kusumc/installation/dashboard');
    return res.status && res.data ? res.data : null;
  }

  /** Kusum-C 16: Sites by status */
  async getKusumCDashboardByStatus(status: string): Promise<any[]> {
    const res = await apiRequest(`up/kusumc/installation/view-dashboard/${status}`);
    return Array.isArray(res.data) ? res.data : [];
  }

  /** Kusum-C 17: Sites by status and district */
  async getKusumCDashboardByDistrict(status: string, district: string): Promise<any[]> {
    const res = await apiRequest(`up/kusumc/installation/view-districtwise/${status}/${encodeURIComponent(district)}`);
    return Array.isArray(res.data) ? res.data : [];
  }
}

export const upInstallationService = new UpInstallationService();
export default upInstallationService;
