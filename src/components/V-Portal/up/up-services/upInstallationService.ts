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
  claim_submit?: number;
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
  company_id?: string;
  wo_no?: string;
  wo_received?: number;
  volume?: string;
  installation_date?: string;
  inst_date?: string;
  inst_deadline?: string;
  inst_assign_date?: string;
  inst_status?: number;
  state?: string;
  phase?: string;
  district?: string;
  block?: string;
  panchayat?: string;
  village?: string | null;
  ward_no?: string;
  pole_no?: string;
  beneficiary_name?: string;
  beneficiary_contact?: string;
  latitude?: string;
  longitude?: string;
  light_no?: string;
  light_type?: string | null;
  uuid_no?: string;
  battery_serial_no?: string;
  panel_no?: string;
  imei_no?: string | null;
  light_file?: string;
  remark?: string;
  inst_remarks?: string;
  verify_status?: number;
  inst_verify_status?: number;
  inst_verify_by?: string | number;
  inst_verify_date?: string;
  inst_verify_remarks?: string;
  claim_status?: number;
  inst_claim_status?: number;
  inst_claim_date?: string | null;
  inst_claim_id?: number | string | null;
  inst_pay_status?: number;
  payment_status?: number;
  bill_raised_85?: number;
  payment_85?: number;
  amc_status?: number;
  amc_date?: string | null;
  amc_type?: string | number | null;
  created_at?: string;
  updated_at?: string;
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
  id: number | string;
  assign_id?: number | string;
  resco_id?: number | string;
  site_id?: number | string;
  site_ids?: string[];
  company_id?: string;
  volume?: number;
  purpose?: string;
  type?: string;
  vendor?: string;
  vendor_id?: number | string;
  state?: string;
  district?: string;
  site_name?: Record<string, string> | string; // Map of site_name -> deadline
  assign_date?: string;
  sitecount?: string | number;
  count?: number;
  file?: string | null;
  panel_no_file?: string | null;
  created_by?: string | number | null;
  update_by?: string | number | null;
  status: number;
  remarks?: string | null;
  created_at?: string;
  updated_at?: string;
  deadline?: string;
  vendors?: {
    id: number;
    company_id?: string;
    category?: string;
    parent_id?: string | number;
    type?: string;
    vendor_id?: string;
    password?: string;
    name: string;
    email?: string;
    contact?: string;
    gst?: string;
    state?: string;
    register_for?: string;
    firm?: string;
    company?: string;
    sow?: string;
    bank?: string;
    account_no?: string;
    ifsc?: string;
    status?: string | number;
    profile_photo?: string | null;
    aadhar_photo?: string | null;
    pancard_photo?: string | null;
    doj?: string;
    self_signed?: string | null;
    profile_approved?: string | number;
    created_at?: string;
    updated_at?: string;
  };
  // Flattened helpers for UI
  location?: string;
  firm_name?: string;
  ca_no?: string;
  sanction_load?: string;
  plant_sc?: string;
  wo_no?: string;
}

export interface UpRescoSiteDetail {
  id: number | string;
  resco_id?: number | string;
  site_id?: number | string;
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
  unique_id?: string | null;
  company_id?: string;
  volume?: string;
  phase?: string;
  wo_no?: string;
  state?: string;
  district?: string;
  site_name?: string;
  dept_name?: string;
  address?: string;
  firm_name?: string;
  ca_no?: string;
  sanction_load?: string;
  revised_load?: string | null;
  plant_sc?: string;
  installation_date?: string;
  inst_date?: string;
  inst_status?: number;
  contact_person?: string;
  contact_number?: string;
  solar_meter_no?: string;
  solarmeter_no?: string;
  inverter_no?: string;
  inverter_make?: string | null;
  net_smart_meter_no?: string;
  nm_sm_no?: string;
  loger_no?: string;
  panel_make?: string | null;
  panel_wp?: string | null;
  panel_qty?: string | null;
  latitude?: string;
  longitude?: string;
  inst_latitude?: string;
  inst_longitude?: string;
  remark?: string;
  inst_remarks?: string;
  verify_status?: number;
  inst_verify_status?: number;
  verify_remarks?: string;
  inst_verify_remarks?: string;
  inst_verify_by?: string | number;
  inst_verify_date?: string;
  document_status?: number;
  inst_doc_status?: number;
  document_file?: string;
  inst_doc_file?: string;
  inst_doc_date?: string;
  document_remarks?: string;
  inst_doc_remarks?: string;
  inst_doc_verify_by?: string | number;
  inst_doc_verify_date?: string;
  inst_doc_verify_remarks?: string;
  inst_claim1_status?: number;
  inst_claim2_status?: number;
  inst_claim3_status?: number;
  inst_pay1_status?: number;
  inst_pay2_status?: number;
  inst_pay3_status?: number;
  amc_status?: number;
  amc_date?: string;
  amc_type?: string;
  system_image?: string;
  inverter_image?: string;
  panel_image?: string;
  net_meter_smart_meter_image?: string;
  nm_sm_image?: string;
  loger_image?: string;
  created_at?: string;
  updated_at?: string;
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
  state?: string;
  district?: string;
  dept_name?: string;
  address?: string;
  sanction_load?: string | number;
  plant_sc?: string | number;
  capacity?: string | number;
  contact_person?: string | null;
  contact_number?: string | null;
  inverter_no?: string | null;
  solarmeter_no?: string | null;
  solar_meter_no?: string | null;
  nm_sm_no?: string | null;
  net_smart_meter_no?: string | null;
  loger_no?: string | null;
  inst_status?: number;
  inst_verify_status?: number;
  vendor?: string;
  firm_name?: string;
  vendors?: {
    name?: string;
    firm?: string;
    company?: string;
    contact?: string;
    [key: string]: any;
  };
  [key: string]: any;
}

export type UpRescoMonthlyBillItem = UpRescoVerifiedSite;

export interface UpRescoBillInverterReading {
  id?: number;
  company_id?: string;
  resco_bill_id?: string | number;
  inverter_no: string;
  previous_reading: number | string;
  current_reading: number | string;
  generated_reading: number | string;
  amount: number | string;
  reading_date?: string;
  doc_file?: string | null;
  file?: string | null;
  status?: string | number;
  created_at?: string;
  updated_at?: string;
  remarks?: string | null;
  [key: string]: any;
}

export interface UpRescoBillItem {
  id: number;
  company_id?: string;
  resco_id?: number | string;
  state?: string;
  site_name?: string;
  inverter_no?: string | null;
  bill_no: string;
  bill_date?: string;
  billing_from?: string;
  billing_to?: string;
  due_date?: string;
  bill_amount: number | string;
  total_reading?: number | string;
  reading?: number | string;
  per_unit_price?: number | string;
  bill_status?: number;
  type?: number;
  verify_status?: number;
  verify_by?: string | null;
  verify_remarks?: string | null;
  verify_date?: string | null;
  pay_date?: string | null;
  pay_amount?: number | string | null;
  pay_status?: number;
  created_by?: string | number;
  updated_by?: string | number | null;
  created_at?: string;
  updated_at?: string;
  doc_file?: string | null;
  file?: string | null;
  remarks?: string | null;
  readings?: UpRescoBillInverterReading[];
  [key: string]: any;
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
  company_id?: string;
  purpose?: string;
  vendor?: string | number;
  status: number | string; // "1" = Pending, "2" = Accepted
  assign_date?: string;
  deadline_date?: string;
  state?: string;
  project?: string;
  volume?: string;
  district?: string;
  block?: string | null;
  village?: string | null;
  site_id?: string; // e.g. "[\"3030\"]" or "[3030]"
  site_count?: string | number;
  file?: string | null;
  remarks?: string | null;
  created_by?: string | number | null;
  updated_by?: string | number | null;
  created_at?: string;
  updated_at?: string;
  Names?: { f_farmer_name: string; inst_deadline?: string }[];
  details?: {
    state?: string;
    f_district?: string;
    f_post?: string;
    f_village?: string;
    f_farmer_name?: string;
    f_father_name?: string;
    inst_deadline?: string;
    [key: string]: any;
  }[];
  [key: string]: any;
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
  company_id?: string;
  excel_id?: string;
  uid?: string | null;
  lot_no?: string;
  state?: string;
  f_state?: string;
  phase?: string;
  kc_wise?: string;
  volume?: string;
  f_customer_no?: string;
  f_farmer_name?: string;
  farmer_name?: string;
  applicant_name?: string;
  beneficiary_name?: string;
  f_father_name?: string;
  father_name?: string;
  f_contact?: string;
  contact_no?: string;
  f_aadhar?: string | null;
  f_village?: string;
  village?: string;
  f_post?: string;
  post?: string;
  f_tehsil?: string | null;
  f_block?: string | null;
  block?: string;
  f_district?: string;
  district?: string;
  f_pin?: string | null;
  f_invoice_no?: string | null;
  f_invoice_date?: string | null;
  pump_capacity?: string;
  c_contractor_name?: string | null;
  KLK_Firm?: string | null;
  c_contact_no?: string | null;
  c_email?: string | null;
  sd_survey_done?: string;
  sd_latitude?: string | null;
  sd_longitude?: string | null;
  sd_survey_received_date?: string | null;
  material_dispatch_status?: number;
  mt_inverter?: string;
  mt_structure?: string;
  mt_modules?: string;
  mt_bos?: string;
  mt_date?: string | null;
  mt_updated_by?: string | null;
  mt_updated_at?: string | null;
  ins_foundation?: string;
  ins_foundation_date?: string | null;
  ins_structure?: string;
  ins_structure_data?: string | null;
  ins_module_mounting?: string;
  ins_module_mounting_date?: string | null;
  ins_inverter_installation?: string;
  ins_inverter_installation_date?: string | null;
  inst_vendor?: number | string;
  inst_deadline?: string;
  inst_assigned_by?: string;
  inst_assign_date?: string;
  inst_assigned_id?: number;
  inst_accept?: number;
  inst_status?: number;
  inst_date?: string;
  vfd_no?: string;
  vfd_status?: number;
  vfd_serial_no?: string;
  Inverter_no?: string; // Note Capital I from API!
  inverter_no?: string;
  inverter_serial_no?: string;
  longitude?: string;
  latitude?: string;
  remarks?: string;
  inst_remarks?: string;
  module_serial_no?: string | string[];
  module_no?: string;
  module_image?: string;
  farmer_module_image?: string;
  f_module_image?: string;
  inverter_vfd_image?: string;
  inverter_image?: string;
  vfd_image?: string;
  running_water_image?: string;
  water_image?: string;
  inst_verify_status?: number;
  verify_status?: number;
  inst_verify_by?: string | number;
  inst_verify_date?: string;
  inst_verify_remarks?: string;
  verify_remarks?: string;
  verification_remarks?: string;
  inst_doc_status?: number; // 1 = Submitted, 2 = Approved, 3 = Rejected, 0 = Pending
  document_status?: number;
  inst_doc_date?: string;
  inst_doc?: string | null; // Note inst_doc from API!
  hoc_photo?: string | null;
  doc_hoc_photo?: string | null;
  doc_hoc?: string;
  doc_hoc_date?: string | null;
  doc_hoc_photo_date?: string | null;
  inst_doc_remarks?: string | null;
  inst_doc_verify_by?: number | string;
  inst_doc_verify_date?: string;
  inst_doc_verify_remarks?: string | null; // Note inst_doc_verify_remarks from API!
  doc_verify_remarks?: string;
  hoc_remarks?: string;
  inst_claim_status?: number;
  claim_status?: number;
  inst_pay_status?: number;
  payment_status?: number;
  pay_status?: number;
  file_submission?: string;
  file_submission_date?: string | null;
  inspection_done?: string;
  net_metering?: string;
  net_metering_date?: string | null;
  net_metering_slip_status?: number;
  net_metering_slip?: string | null;
  sealing_slip_status?: number;
  sealing_slip?: string | null;
  pay1?: number;
  pay2?: number;
  pay3?: number;
  pay4?: number;
  pay5?: number;
  pay6?: number;
  pay7?: number;
  created_at?: string;
  updated_at?: string;
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

/**
 * Robust extractor for all individual Resco site IDs inside an assignment row.
 * Handles arrays, JSON-encoded array strings (e.g. '["7223"]'), numbers, and numeric JSON object keys.
 */
export function extractSiteIdsFromAssign(assign: any): string[] {
  const ids: string[] = [];
  if (!assign) return ids;

  const pushIfValid = (val: any) => {
    if (val === null || val === undefined) return;
    const str = String(val).trim();
    if (!str || str === 'null' || str === 'undefined') return;
    if (!ids.includes(str)) ids.push(str);
  };

  // 1. Direct resco_id / up_resco_id
  pushIfValid(assign.resco_id);
  pushIfValid(assign.up_resco_id);

  // 2. Check site_id (could be array, JSON array string like '["7223"]', number, or string)
  if (assign.site_id) {
    if (Array.isArray(assign.site_id)) {
      assign.site_id.forEach(pushIfValid);
    } else if (typeof assign.site_id === 'string') {
      const trimmed = assign.site_id.trim();
      if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
        try {
          const parsed = JSON.parse(trimmed);
          if (Array.isArray(parsed)) {
            parsed.forEach(pushIfValid);
          }
        } catch {
          // not valid json array
        }
      } else if (trimmed) {
        pushIfValid(trimmed);
      }
    } else if (typeof assign.site_id === 'number') {
      pushIfValid(assign.site_id);
    }
  }

  // 3. Check site_ids
  if (assign.site_ids) {
    if (Array.isArray(assign.site_ids)) {
      assign.site_ids.forEach(pushIfValid);
    } else if (typeof assign.site_ids === 'string') {
      const trimmed = assign.site_ids.trim();
      if (trimmed.startsWith('[')) {
        try {
          const parsed = JSON.parse(trimmed);
          if (Array.isArray(parsed)) parsed.forEach(pushIfValid);
        } catch {}
      }
    }
  }

  // 4. Check site_name if it has JSON map with numeric keys e.g. {"7223": "2026-11-20"}
  let siteNameObj = assign.site_name;
  if (typeof siteNameObj === 'string' && siteNameObj.trim().startsWith('{')) {
    try {
      siteNameObj = JSON.parse(siteNameObj);
    } catch {}
  }
  if (siteNameObj && typeof siteNameObj === 'object' && !Array.isArray(siteNameObj)) {
    Object.keys(siteNameObj).forEach((k) => {
      const trimmed = k.trim();
      if (/^\d+$/.test(trimmed)) {
        pushIfValid(trimmed);
      }
    });
  }

  return ids;
}

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
    const sslSites = Array.isArray(res.ssl_sites)
      ? res.ssl_sites
      : Array.isArray(res.data?.ssl_sites)
      ? res.data.ssl_sites
      : Array.isArray(res.data)
      ? res.data
      : [];
    return {
      vendor: res.vendor ?? res.data?.vendor,
      ssl_sites: sslSites,
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
    const d = res.install_details || res.install_detail || (res.data && (res.data.install_details || res.data.install_detail)) || {};
    const install_details: UpSsl18wInstallDetailsCount = {
      total: Number(d.total ?? 0),
      complete: Number(d.complete ?? 0),
      pending: Number(d.pending ?? 0),
      accept: Number(d.accept ?? 0),
      verify_approved: Number(d.verify_approved ?? 0),
      verify_pending: Number(d.verify_pending ?? 0),
      verify_reject: Number(d.verify_reject ?? 0),
      claim_applicable: Number(d.claim_applicable ?? 0),
      claim_raised: Number(d.claim_raised ?? d.claim_submit ?? 0),
      claim_submit: Number(d.claim_submit ?? d.claim_raised ?? 0),
      claim_not_applicable: Number(d.claim_not_applicable ?? 0),
      claim_verify_approved: Number(d.claim_verify_approved ?? 0),
      claim_verify_pending: Number(d.claim_verify_pending ?? 0),
      claim_verify_reject: Number(d.claim_verify_reject ?? 0),
      payment_complete: Number(d.payment_complete ?? 0),
      payment_pending: Number(d.payment_pending ?? 0),
      payment_partially: Number(d.payment_partially ?? 0),
      ...d,
    };

    const normalizeRow = (r: any): UpSsl18wInstalledLightItem => {
      const vStatus = r.inst_verify_status !== undefined && r.inst_verify_status !== null
        ? Number(r.inst_verify_status)
        : (r.verify_status !== undefined && r.verify_status !== null ? Number(r.verify_status) : 0);
      const parsedStatus = Number.isNaN(vStatus) ? 0 : vStatus;
      return {
        ...r,
        verify_status: parsedStatus,
        inst_verify_status: parsedStatus,
        inst_verify_by: r.inst_verify_by ?? r.verify_by,
        inst_verify_date: r.inst_verify_date ?? r.verify_date,
        inst_verify_remarks: r.inst_verify_remarks ?? r.verify_remarks,
        remark: r.remark || r.inst_remarks || '',
        inst_remarks: r.inst_remarks || r.remark || '',
        installation_date: r.installation_date || r.inst_date || '',
        inst_date: r.inst_date || r.installation_date || '',
      };
    };

    const rawPayment = Array.isArray(res.payment_sites)
      ? res.payment_sites
      : (Array.isArray(res.data?.payment_sites) ? res.data.payment_sites : []);
    const rawCompleted = Array.isArray(res.completed_sites)
      ? res.completed_sites
      : (Array.isArray(res.data?.completed_sites) ? res.data.completed_sites : []);

    return {
      install_details,
      payment_sites: rawPayment.map(normalizeRow),
      completed_sites: rawCompleted.map(normalizeRow),
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
    const ids = Array.isArray(res.ids)
      ? res.ids
      : Array.isArray(res.data?.ids)
      ? res.data.ids
      : [];
    return {
      count: Number(res.count ?? res.data?.count ?? ids.length),
      ids,
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
    const rawList = res.data?.ssl && Array.isArray(res.data.ssl)
      ? res.data.ssl
      : Array.isArray(res.data)
      ? res.data
      : [];
    return rawList.map((r: any) => {
      const vStatus = r.inst_verify_status !== undefined && r.inst_verify_status !== null
        ? Number(r.inst_verify_status)
        : (r.verify_status !== undefined && r.verify_status !== null ? Number(r.verify_status) : 0);
      const parsedStatus = Number.isNaN(vStatus) ? 0 : vStatus;
      return {
        ...r,
        verify_status: parsedStatus,
        inst_verify_status: parsedStatus,
        inst_verify_by: r.inst_verify_by ?? r.verify_by,
        inst_verify_date: r.inst_verify_date ?? r.verify_date,
        inst_verify_remarks: r.inst_verify_remarks ?? r.verify_remarks,
        remark: r.remark || r.inst_remarks || '',
        inst_remarks: r.inst_remarks || r.remark || '',
        installation_date: r.installation_date || r.inst_date || '',
        inst_date: r.inst_date || r.installation_date || '',
      };
    });
  }

  /** SSL 17: Lights by status and district */
  async getSsl18wDashboardByDistrict(status: string, district: string): Promise<UpSsl18wInstalledLightItem[]> {
    const res = await apiRequest(`up/ssl18w/installation-view-districtwise/${status}/${encodeURIComponent(district)}`);
    const rawList = res.data?.ssl && Array.isArray(res.data.ssl)
      ? res.data.ssl
      : Array.isArray(res.data)
      ? res.data
      : [];
    return rawList.map((r: any) => {
      const vStatus = r.inst_verify_status !== undefined && r.inst_verify_status !== null
        ? Number(r.inst_verify_status)
        : (r.verify_status !== undefined && r.verify_status !== null ? Number(r.verify_status) : 0);
      const parsedStatus = Number.isNaN(vStatus) ? 0 : vStatus;
      return {
        ...r,
        verify_status: parsedStatus,
        inst_verify_status: parsedStatus,
        inst_verify_by: r.inst_verify_by ?? r.verify_by,
        inst_verify_date: r.inst_verify_date ?? r.verify_date,
        inst_verify_remarks: r.inst_verify_remarks ?? r.verify_remarks,
        remark: r.remark || r.inst_remarks || '',
        inst_remarks: r.inst_remarks || r.remark || '',
        installation_date: r.installation_date || r.inst_date || '',
        inst_date: r.inst_date || r.installation_date || '',
      };
    });
  }

  /* ─────────────────────────────────────────────────────────────
   * 2. UP RESCO INSTALLATION APIs (Endpoints 1-19)
   * ───────────────────────────────────────────────────────────── */

  /** Resco 1: View assigned installations */
  async getRescoAssignSites(): Promise<{ status: boolean; message?: string; data: UpRescoAssignSiteItem[] }> {
    const res = await apiRequest('up/resco/installation/view-assign-sites');
    let items: UpRescoAssignSiteItem[] = [];

    const rawList = Array.isArray(res.data)
      ? res.data
      : Array.isArray(res.sites)
      ? res.sites
      : Array.isArray(res.resco)
      ? res.resco
      : Array.isArray(res.assign_resc)
      ? res.assign_resc
      : (res.data && typeof res.data === 'object' && Array.isArray((res.data as any).sites))
      ? (res.data as any).sites
      : [];

    if (rawList.length > 0) {
      items = rawList.map((row: any) => {
        const assign = row.assign_resc || row.assign || row;

        let siteNameObj: Record<string, string> | string = assign.site_name;
        if (typeof siteNameObj === 'string' && siteNameObj.trim().startsWith('{')) {
          try {
            const parsed = JSON.parse(siteNameObj);
            if (parsed && typeof parsed === 'object') {
              siteNameObj = parsed;
            }
          } catch {
            // retain string
          }
        }

        let extractedDeadline = '';
        let inferredRescoId: string | undefined;
        if (siteNameObj && typeof siteNameObj === 'object') {
          const deadlines = Object.values(siteNameObj).filter(Boolean);
          if (deadlines.length > 0) {
            extractedDeadline = String(deadlines[0]);
          }
          const numKey = Object.keys(siteNameObj).find((k) => /^\d+$/.test(k.trim()));
          if (numKey) {
            inferredRescoId = numKey.trim();
          }
        }

        const extractedIds = extractSiteIdsFromAssign(assign);
        const resolvedRescoId =
          (extractedIds.length > 0 ? extractedIds[0] : undefined) ??
          assign.resco_id ??
          assign.up_resco_id ??
          row.resco_id ??
          inferredRescoId;

        const countNum =
          Number(
            assign.sitecount ??
            assign.volume ??
            (extractedIds.length > 0 ? extractedIds.length : (typeof siteNameObj === 'object' && siteNameObj !== null ? Object.keys(siteNameObj).length : 1))
          ) || 1;

        return {
          id: assign.id,
          assign_id: assign.id,
          resco_id: resolvedRescoId,
          site_id: resolvedRescoId,
          site_ids: extractedIds,
          company_id: assign.company_id,
          volume: assign.volume,
          purpose: assign.purpose || 'installation',
          type: assign.type || 'resco',
          vendor_id: assign.vendors?.id ?? (typeof assign.vendor === 'number' ? assign.vendor : undefined),
          vendor: assign.vendors?.name || (typeof assign.vendor === 'string' ? assign.vendor : (assign.vendors?.company || '')),
          state: assign.state || 'up',
          district: assign.district || '',
          site_name: siteNameObj,
          assign_date: assign.assign_date || '',
          sitecount: assign.sitecount,
          count: countNum,
          file: assign.file || null,
          panel_no_file: assign.panel_no_file || null,
          created_by: assign.created_by,
          update_by: assign.update_by,
          status: typeof assign.status === 'number' ? assign.status : Number(assign.status || 0),
          remarks: assign.remarks || '',
          created_at: assign.created_at,
          updated_at: assign.updated_at,
          deadline: assign.deadline || extractedDeadline,
          vendors: assign.vendors,
          firm_name: assign.vendors?.company || assign.vendors?.firm || assign.firm_name || '',
          location: assign.location || assign.district || '',
          ca_no: assign.ca_no || '',
          sanction_load: assign.sanction_load || (assign.volume ? `${assign.volume} kW` : ''),
          plant_sc: assign.plant_sc || '',
          wo_no: assign.wo_no || '',
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
    const assign = res.data?.assign_resc || res.data?.assign || res.data || res.assign_resc || null;
    if (!assign) {
      return { status: Boolean(res.status), data: undefined };
    }

    let siteNameObj: Record<string, string> | string = assign.site_name;
    if (typeof siteNameObj === 'string' && siteNameObj.trim().startsWith('{')) {
      try {
        const parsed = JSON.parse(siteNameObj);
        if (parsed && typeof parsed === 'object') {
          siteNameObj = parsed;
        }
      } catch {
        // retain string
      }
    }

    let extractedDeadline = '';
    let inferredRescoId: string | undefined;
    if (siteNameObj && typeof siteNameObj === 'object') {
      const deadlines = Object.values(siteNameObj).filter(Boolean);
      if (deadlines.length > 0) {
        extractedDeadline = String(deadlines[0]);
      }
      const numKey = Object.keys(siteNameObj).find((k) => /^\d+$/.test(k.trim()));
      if (numKey) {
        inferredRescoId = numKey.trim();
      }
    }

    const extractedIds = extractSiteIdsFromAssign(assign);
    const resolvedRescoId =
      (extractedIds.length > 0 ? extractedIds[0] : undefined) ??
      assign.resco_id ??
      assign.up_resco_id ??
      res.data?.resco_id ??
      inferredRescoId;

    const item: UpRescoAssignSiteItem = {
      id: assign.id || id,
      assign_id: assign.id || id,
      resco_id: resolvedRescoId,
      site_id: resolvedRescoId,
      site_ids: extractedIds,
      company_id: assign.company_id,
      volume: assign.volume,
      purpose: assign.purpose || 'installation',
      type: assign.type || 'resco',
      vendor_id: assign.vendors?.id ?? (typeof assign.vendor === 'number' ? assign.vendor : undefined),
      vendor: assign.vendors?.name || (typeof assign.vendor === 'string' ? assign.vendor : (assign.vendors?.company || '')),
      state: assign.state || 'up',
      district: assign.district || '',
      site_name: siteNameObj,
      assign_date: assign.assign_date || '',
      sitecount: assign.sitecount,
      count: Number(assign.sitecount ?? assign.volume ?? (extractedIds.length > 0 ? extractedIds.length : 1)) || 1,
      file: assign.file || null,
      panel_no_file: assign.panel_no_file || null,
      created_by: assign.created_by,
      update_by: assign.update_by,
      status: typeof assign.status === 'number' ? assign.status : Number(assign.status || 0),
      remarks: assign.remarks || '',
      created_at: assign.created_at,
      updated_at: assign.updated_at,
      deadline: assign.deadline || extractedDeadline,
      vendors: assign.vendors,
      firm_name: assign.vendors?.company || assign.vendors?.firm || '',
      location: assign.location || assign.district || '',
      ca_no: assign.ca_no || '',
      sanction_load: assign.sanction_load || (assign.volume ? `${assign.volume} kW` : ''),
      plant_sc: assign.plant_sc || '',
      wo_no: assign.wo_no || '',
    };

    return {
      status: res.status,
      data: item,
    };
  }

  /** Resco 3: Accept assignment */
  async acceptRescoAssignment(id: number | string): Promise<{ status: boolean; message?: string; error?: any }> {
    return apiRequest(`up/resco/installation/assign-accept/${id}`);
  }

  /** Resco 4: Fetch sites ready for installation (dropdown) */
  async getRescoAvailableSites(): Promise<{ id: number | string; site_name: string; resco_id?: number | string; site_id?: number | string; district?: string; state?: string; [key: string]: any }[]> {
    const extractList = (res: any): any[] => {
      if (Array.isArray(res)) return res;
      if (Array.isArray(res?.data)) return res.data;
      if (Array.isArray(res?.sites)) return res.sites;
      if (Array.isArray(res?.site)) return res.site;
      if (Array.isArray(res?.resco)) return res.resco;
      if (Array.isArray(res?.rescos)) return res.rescos;
      if (res?.data && typeof res.data === 'object') {
        if (Array.isArray(res.data.sites)) return res.data.sites;
        if (Array.isArray(res.data.site)) return res.data.site;
        if (Array.isArray(res.data.resco)) return res.data.resco;
        if (Array.isArray(res.data.rescos)) return res.data.rescos;
        if (Array.isArray(res.data.data)) return res.data.data;
      }
      return [];
    };

    const mapItems = (list: any[]) =>
      list
        .filter((item) => item && typeof item === 'object')
        .map((item: any) => {
          const rawId = item.id ?? item.resco_id ?? item.site_id;
          const rescoId = item.resco_id ?? item.site_id ?? item.id;
          return {
            ...item,
            id: rawId,
            resco_id: rescoId,
            site_id: rescoId,
            site_name: item.site_name || item.name || (rawId ? `Site #${rawId}` : ''),
            district: item.district || '',
            state: item.state || '',
          };
        })
        .filter((item) => item.id !== undefined && item.id !== null && String(item.id).trim() !== '');

    // 1. Primary Resco installation dropdown endpoint
    try {
      const res = await apiRequest('up/resco/installation/fetch-site');
      const list = extractList(res);
      if (list.length > 0) {
        return mapItems(list);
      }
    } catch {
      // fall through to pending dashboard sites
    }

    // 2. Fallback to real pending Resco installation sites (master Resco records)
    try {
      const pendingRes = await apiRequest('up/resco/installation/view-dashboard/pending');
      const pendingList = extractList(pendingRes);
      if (pendingList.length > 0) {
        return mapItems(pendingList);
      }
    } catch {
      // ignore
    }

    return [];
  }

  /** Resco 5: Fetch site detail */
  async getRescoSiteDetail(id: number | string): Promise<UpRescoSiteDetail | null> {
    const cleanId = String(id || '').trim();
    if (!cleanId || cleanId === 'undefined' || cleanId === 'null') return null;
    try {
      const res = await apiRequest(`up/resco/installation/fetch-site-detail/${cleanId}`);

      // Critical fix: If backend returns { status: true, data: null }, site does NOT exist in master!
      if (res.data === null && !res.resco && !res.site) {
        return null;
      }
      if (res.status === false && !res.data && !res.resco && !res.site) {
        return null;
      }

      let detail: any = null;
      if (res.resco && typeof res.resco === 'object') detail = res.resco;
      else if (res.site && typeof res.site === 'object') detail = res.site;
      else if (res.data && typeof res.data === 'object' && res.data !== null) {
        if (res.data.resco && typeof res.data.resco === 'object') detail = res.data.resco;
        else if (res.data.site && typeof res.data.site === 'object') detail = res.data.site;
        else if (Array.isArray(res.data) && res.data.length > 0) detail = res.data[0];
        else if (!Array.isArray(res.data)) detail = res.data;
      } else if (res && typeof res === 'object' && !Array.isArray(res)) {
        // Only accept if res contains actual site record properties
        if (res.site_name || res.district || res.ca_no || res.firm_name || res.sanction_load || res.plant_sc) {
          detail = res;
        }
      }

      if (detail && typeof detail === 'object' && Object.keys(detail).length > 0) {
        const resolvedId = detail.id ?? detail.resco_id ?? detail.site_id ?? cleanId;
        const apiVendor = res.ven?.name || res.data?.ven?.name || res.vendor?.name || res.data?.vendor?.name;
        return {
          ...detail,
          id: resolvedId,
          resco_id: detail.resco_id ?? resolvedId,
          site_id: detail.site_id ?? resolvedId,
          ...(apiVendor && !detail.vendor ? { vendor: apiVendor } : {}),
        } as UpRescoSiteDetail;
      }
    } catch (err) {
      console.warn(`[getRescoSiteDetail] Failed for id ${cleanId}:`, err);
    }
    return null;
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
    if (Array.isArray(res.data)) return res.data;
    if (Array.isArray(res.sites)) return res.sites;
    if (Array.isArray(res.resco)) return res.resco;
    if (Array.isArray(res.data?.sites)) return res.data.sites;
    if (Array.isArray(res.data?.resco)) return res.data.resco;
    if (Array.isArray(res.data?.data)) return res.data.data;
    return [];
  }

  /** Alias for Resco 13: Monthly billing verified sites */
  async getRescoMonthlyBill(): Promise<UpRescoVerifiedSite[]> {
    return this.getRescoVerifiedSites();
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
    const rawBills =
      (Array.isArray(res.bills) && res.bills) ||
      (Array.isArray(res.data?.bills) && res.data.bills) ||
      (Array.isArray(res.data) && res.data) ||
      [];
    return {
      rescos: res.rescos || res.data?.rescos,
      bills: rawBills,
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
    const endpoints = [
      'up/resco/installation/view-claim',
      'up/resco/view-claim',
      'up/resco/installation/view-installation-claim',
      'up/resco/installation-claim',
    ];
    for (const ep of endpoints) {
      try {
        const res = await apiRequest(ep);
        if (Array.isArray(res.data)) return res.data;
        if (Array.isArray(res.data?.payments)) return res.data.payments;
        if (Array.isArray(res.payments)) return res.payments;
      } catch {
        // try next endpoint
      }
    }
    return [];
  }

  /** Resco Claim Helper: Submit claim */
  async storeRescoClaim(fd: FormData): Promise<{ status: boolean; message?: string; errors?: any }> {
    const endpoints = [
      'up/resco/installation/claim-store',
      'up/resco/installation/add-claim',
      'up/resco/claim-store',
      'up/resco/installation-claim-store',
    ];
    let lastError: any = null;
    for (const ep of endpoints) {
      try {
        const res = await apiRequest(ep, {
          method: 'POST',
          body: fd,
          isMultipart: true,
        });
        if (res.status !== false && res.success !== false) {
          return { status: true, message: res.message || 'Payment claim submitted successfully!' };
        }
        if (res.errors && typeof res.errors === 'object') {
          const errMsg = Object.values(res.errors).flat().join(' ');
          return { status: false, message: errMsg || res.message || 'Validation failed.', errors: res.errors };
        }
        if (res.message && !String(res.message).toLowerCase().includes('not found') && !String(res.message).includes('404')) {
          lastError = res;
        }
      } catch (err: any) {
        lastError = err;
        if (err?.status === 422 || err?.errors || err?.message?.toLowerCase().includes('validation')) {
          const errMsg = err?.errors ? Object.values(err.errors).flat().join(', ') : err?.message;
          return { status: false, message: errMsg || 'Validation failed.' };
        }
      }
    }
    return { status: false, message: lastError?.message || 'Failed to submit claim' };
  }

  /** Resco 17: Dashboard summary */
  async getRescoDashboard(): Promise<UpRescoDashboardCounts | null> {
    const res = await apiRequest('up/resco/installation/dashboard');
    return res.status && res.data ? res.data : null;
  }

  /** Resco 18: Sites by status */
  async getRescoDashboardByStatus(status: string): Promise<any[]> {
    const res = await apiRequest(`up/resco/installation/view-dashboard/${status}`);
    if (Array.isArray(res.data)) return res.data;
    if (Array.isArray(res.data?.resco)) return res.data.resco;
    if (Array.isArray(res.data?.sites)) return res.data.sites;
    if (Array.isArray(res.data?.data)) return res.data.data;
    if (Array.isArray(res)) return res;
    return [];
  }

  /** Resco 19: Sites by status and district */
  async getRescoDashboardByDistrict(status: string, district: string): Promise<any[]> {
    const res = await apiRequest(`up/resco/installation/view-districtwise/${status}/${encodeURIComponent(district)}`);
    if (Array.isArray(res.data)) return res.data;
    if (Array.isArray(res.data?.resco)) return res.data.resco;
    if (Array.isArray(res.data?.sites)) return res.data.sites;
    if (Array.isArray(res.data?.data)) return res.data.data;
    if (Array.isArray(res)) return res;
    return [];
  }

  /* ─────────────────────────────────────────────────────────────
   * 3. UP KUSUM-C INSTALLATION APIs (Endpoints 1-17)
   * ───────────────────────────────────────────────────────────── */

  /** Kusum-C 1: Sites ready for installation */
  async getKusumCReadySites(): Promise<UpKusumCReadySiteItem[]> {
    const res = await apiRequest('up/kusumc/installation');
    if (Array.isArray(res.data)) return res.data;
    if (Array.isArray(res.sites)) return res.sites;
    if (Array.isArray(res.data?.sites)) return res.data.sites;
    return [];
  }

  /** Kusum-C 2: Assigned batches */
  async getKusumCAssignments(): Promise<UpKusumCAssignmentItem[]> {
    const res = await apiRequest('up/kusumc/view-assign-installation');
    if (Array.isArray(res.data)) return res.data;
    if (Array.isArray(res.sites)) return res.sites;
    if (Array.isArray(res.assign)) return res.assign;
    if (Array.isArray(res.data?.sites)) return res.data.sites;
    if (Array.isArray(res.data?.assign)) return res.data.assign;
    return [];
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
    has_install_detail?: boolean;
    install_detail: UpKusumCInstalledCounts;
    sites: UpKusumCInstalledSiteItem[];
    payment_sites?: UpKusumCInstalledSiteItem[];
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

    const d = res.data;
    const sites = Array.isArray(d?.sites) ? d.sites : Array.isArray(d) ? d : [];
    const payment_sites = Array.isArray(d?.payment_sites)
      ? d.payment_sites
      : Array.isArray(d?.paymentsite)
        ? d.paymentsite
        : undefined;
    const has_install_detail = Boolean(d?.install_detail && typeof d.install_detail === 'object');
    const install_detail = has_install_detail ? d.install_detail : defaultCounts;
    const assign = d?.assign ?? install_detail?.total ?? sites.length;

    return {
      assign,
      has_install_detail,
      install_detail,
      sites,
      payment_sites,
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
    if (Array.isArray(res.data)) return res.data;
    if (Array.isArray(res.data?.data)) return res.data.data;
    if (Array.isArray(res.sites)) return res.sites;
    if (Array.isArray((res as any).data?.sites)) return (res as any).data.sites;
    return [];
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
    const payments = Array.isArray(res.data?.payments)
      ? res.data.payments
      : Array.isArray(res.payments)
      ? res.payments
      : [];
    const sites = Array.isArray(res.data?.sites)
      ? res.data.sites
      : Array.isArray(res.sites)
      ? res.sites
      : [];
    return { payments, sites };
  }

  /** Kusum-C 13: Raise a claim (multipart) */
  async storeKusumCClaim(fd: FormData): Promise<{ status: boolean; message?: string; data?: any; errors?: any }> {
    const endpoints = [
      'up/kusumc/installation/add-claim',
      'up/kusumc/installation/claim-store',
      'up/kusumc/claim-store',
      'up/kusumc/installation-claim-store',
    ];
    let lastRes: any = null;
    for (const ep of endpoints) {
      try {
        const res = await apiRequest(ep, {
          method: 'POST',
          body: fd,
          isMultipart: true,
        });
        if (res.status !== false && res.success !== false) {
          return { status: true, message: res.message || 'Payment claim raised successfully!', data: res.data };
        }
        if (res.errors && typeof res.errors === 'object') {
          return res;
        }
        if (res.message && !String(res.message).toLowerCase().includes('not found') && !String(res.message).includes('404')) {
          lastRes = res;
        }
      } catch (err: any) {
        lastRes = err;
      }
    }
    return lastRes || { status: false, message: 'Failed to submit claim' };
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

  /** Kusum-C 16: Sites by status with candidate URL fallbacks and core installation data fallback */
  async getKusumCDashboardByStatus(status: string): Promise<any[]> {
    const norm = normalizeKusumCStatus(status);

    // 1. Candidate dedicated endpoints on the server
    const candidateEndpoints = [
      `up/kusumc/installation/view-dashboard/${norm}`,
      `up/kusumc/installation-view-dashboard/${norm}`,
      `up/kusumc/view-dashboard/${norm}`,
      `up/kusumc/view-dashboard-data/${norm}`,
      `up/kusumc/installation/view-dashboard-data/${norm}`,
    ];

    for (const ep of candidateEndpoints) {
      try {
        const res = await apiRequest(ep);
        const list = extractKusumCSiteList(res);
        if (Array.isArray(list) && list.length > 0) {
          return list;
        }
      } catch {
        // try next endpoint
      }
    }

    // 2. Resilient Fallback: Retrieve real records from core UP Kusum-C APIs
    return this.getKusumCFallbackSitesByStatus(norm);
  }

  /** Kusum-C 17: Sites by status and district with resilient fallbacks */
  async getKusumCDashboardByDistrict(status: string, district: string): Promise<any[]> {
    const norm = normalizeKusumCStatus(status);
    const cleanDistrict = (district || '').trim();

    if (!cleanDistrict || cleanDistrict.toLowerCase() === 'all') {
      return this.getKusumCDashboardByStatus(norm);
    }

    // 1. Candidate dedicated district endpoints on the server
    const candidateEndpoints = [
      `up/kusumc/installation/view-districtwise/${norm}/${encodeURIComponent(cleanDistrict)}`,
      `up/kusumc/installation-view-districtwise/${norm}/${encodeURIComponent(cleanDistrict)}`,
      `up/kusumc/view-districtwise/${norm}/${encodeURIComponent(cleanDistrict)}`,
      `up/kusumc/installation/view-dashboard/districtwise/${norm}/${encodeURIComponent(cleanDistrict)}`,
      `up/kusumc/installation/view-dashboard/${norm}?district=${encodeURIComponent(cleanDistrict)}`,
    ];

    for (const ep of candidateEndpoints) {
      try {
        const res = await apiRequest(ep);
        const list = extractKusumCSiteList(res);
        if (Array.isArray(list) && list.length > 0) {
          return list.filter((s) => {
            const d = (s.f_district || s.district || '').trim().toLowerCase();
            return !cleanDistrict || d === cleanDistrict.toLowerCase();
          });
        }
      } catch {
        // try next endpoint
      }
    }

    // 2. Fallback: Query all sites for the status, then filter by district
    const statusSites = await this.getKusumCDashboardByStatus(norm);
    return statusSites.filter((s) => {
      const d = (s.f_district || s.district || '').trim().toLowerCase();
      return d === cleanDistrict.toLowerCase();
    });
  }

  /**
   * Helper fallback: aggregates real records across UP Kusum-C installation APIs and applies status filter.
   */
  async getKusumCFallbackSitesByStatus(status: string): Promise<any[]> {
    const norm = normalizeKusumCStatus(status);

    try {
      const [installedRes, readySitesRes, assignmentsRes, claimsRes] = await Promise.all([
        this.getKusumCInstalledSites().catch(() => ({ sites: [], payment_sites: [] })),
        this.getKusumCReadySites().catch(() => []),
        this.getKusumCAssignments().catch(() => []),
        this.getKusumCClaims().catch(() => ({ payments: [], sites: [] })),
      ]);

      const siteMap = new Map<string, any>();

      // 1. Core installed sites (up/kusumc/view-installtion)
      const installedList = Array.isArray(installedRes?.sites) ? installedRes.sites : [];
      installedList.forEach((s) => {
        if (!s) return;
        const key = String(s.id ?? s.excel_id ?? '').trim();
        if (!key) return;
        siteMap.set(key, {
          ...s,
          inst_status: s.inst_status !== undefined ? Number(s.inst_status) : (s.vfd_no || s.Inverter_no ? 1 : 0),
        });
      });

      // 2. Payment sites if present
      if (Array.isArray(installedRes?.payment_sites)) {
        installedRes.payment_sites.forEach((s) => {
          if (!s) return;
          const key = String(s.id ?? s.excel_id ?? '').trim();
          if (!key) return;
          const existing = siteMap.get(key);
          siteMap.set(key, { ...existing, ...s });
        });
      }

      // 3. Ready sites (up/kusumc/installation - pending installation)
      if (Array.isArray(readySitesRes)) {
        readySitesRes.forEach((s) => {
          if (!s) return;
          const key = String(s.id ?? s.excel_id ?? '').trim();
          if (!key) return;
          const existing = siteMap.get(key);
          if (!existing) {
            siteMap.set(key, {
              ...s,
              inst_status: 0,
            });
          } else {
            siteMap.set(key, { ...s, ...existing });
          }
        });
      }

      // 4. Batch assignments (up/kusumc/view-assign-installation)
      if (Array.isArray(assignmentsRes)) {
        assignmentsRes.forEach((batch: any) => {
          const batchSites = Array.isArray(batch.sites) ? batch.sites : (Array.isArray(batch.site) ? batch.site : []);
          batchSites.forEach((s: any) => {
            if (!s) return;
            const key = String(s.id ?? s.excel_id ?? '').trim();
            if (!key) return;
            const existing = siteMap.get(key);
            if (!existing) {
              siteMap.set(key, {
                ...s,
                inst_vendor: s.inst_vendor ?? batch.company_id ?? batch.vendor_id,
                lot_no: s.lot_no ?? batch.lot_no,
                inst_status: 0,
              });
            } else {
              siteMap.set(key, {
                inst_vendor: existing.inst_vendor ?? batch.company_id ?? batch.vendor_id,
                lot_no: existing.lot_no ?? batch.lot_no,
                ...existing,
              });
            }
          });
        });
      }

      // 5. Link claim records if present
      if (Array.isArray(claimsRes?.payments)) {
        claimsRes.payments.forEach((pay: any) => {
          const sids: string[] = [];
          if (Array.isArray(pay.site_id)) {
            sids.push(...pay.site_id.map(String));
          } else if (typeof pay.site_id === 'string') {
            try {
              const parsed = JSON.parse(pay.site_id);
              if (Array.isArray(parsed)) sids.push(...parsed.map(String));
            } catch {
              pay.site_id.split(',').forEach((x: string) => {
                if (x.trim()) sids.push(x.trim());
              });
            }
          } else if (pay.site_id) {
            sids.push(String(pay.site_id));
          }

          sids.forEach((sid) => {
            const existing = siteMap.get(sid);
            if (existing) {
              siteMap.set(sid, {
                ...existing,
                inst_claim_status: existing.inst_claim_status ?? pay.claim_status ?? 1,
                inst_pay_status: existing.inst_pay_status ?? pay.payment_status ?? pay.status,
                claim_amount: pay.amount,
                claim_reference_no: pay.reference_no,
              });
            }
          });
        });
      }

      const allSites = Array.from(siteMap.values());
      return this.filterKusumCSitesByStatus(allSites, norm);
    } catch (err) {
      console.error('[UP Kusum-C] getKusumCFallbackSitesByStatus error:', err);
      return [];
    }
  }

  /** Filter site array by normalized Kusum C status */
  filterKusumCSitesByStatus(sites: any[], status: string): any[] {
    const norm = normalizeKusumCStatus(status);
    switch (norm) {
      case 'total':
      case 'all':
        return sites;

      case 'complete':
      case 'installed':
      case 'installation-complete':
        return sites.filter((s) => {
          const statusNum = Number(s.inst_status);
          const hasVfd = Boolean(s.vfd_no || s.Inverter_no || s.inverter_no || s.vfd_serial_no || s.inverter_serial_no);
          const hasDate = Boolean(s.installation_date || s.inst_date);
          return statusNum === 1 || hasVfd || hasDate;
        });

      case 'pending':
      case 'not-installed':
      case 'not-install':
        return sites.filter((s) => {
          const statusNum = Number(s.inst_status);
          const hasVfd = Boolean(s.vfd_no || s.Inverter_no || s.inverter_no || s.vfd_serial_no || s.inverter_serial_no);
          const hasDate = Boolean(s.installation_date || s.inst_date);
          return statusNum === 0 || (!hasVfd && !hasDate);
        });

      case 'site-assigned':
        return sites.filter((s) => Boolean(s.inst_vendor || s.inst_assigned_id || s.lot_no || s.inst_assign_date || s.company_id));

      case 'accept-pending':
        return sites.filter((s) => Number(s.inst_accept) === 0);

      case 'site-not-assigned':
        return sites.filter((s) => !s.inst_vendor && !s.inst_assigned_id && !s.lot_no);

      case 'verify-approved':
      case 'approved':
      case 'verified':
        return sites.filter((s) => {
          const v = Number(s.inst_verify_status ?? s.verify_status);
          const str = String(s.inst_verify_status ?? s.verify_status ?? '').toLowerCase().trim();
          return v === 1 || str === '1' || str === 'approved' || str === 'ok';
        });

      case 'verify-pending':
        return sites.filter((s) => {
          const v = Number(s.inst_verify_status ?? s.verify_status ?? 0);
          const str = String(s.inst_verify_status ?? s.verify_status ?? '').toLowerCase().trim();
          const isInstalled = Number(s.inst_status) === 1 || Boolean(s.vfd_no || s.Inverter_no);
          return isInstalled && (v === 0 || str === '' || str === '0' || str === 'pending');
        });

      case 'verify-reject':
      case 'rejected':
      case 'reject':
        return sites.filter((s) => {
          const v = Number(s.inst_verify_status ?? s.verify_status);
          const str = String(s.inst_verify_status ?? s.verify_status ?? '').toLowerCase().trim();
          return v === 2 || str === '2' || str === 'rejected' || str === 'reject';
        });

      case 'doc-approved':
      case 'doc-approve':
        return sites.filter((s) => {
          const d = Number(s.inst_doc_status ?? s.document_status);
          const str = String(s.inst_doc_status ?? '').toLowerCase().trim();
          return d === 2 || str === 'approved' || str === 'ok';
        });

      case 'doc-pending':
        return sites.filter((s) => {
          const d = Number(s.inst_doc_status ?? s.document_status ?? 0);
          const hasDoc = Boolean(s.inst_doc || s.hoc_photo || s.doc_hoc_photo);
          return d === 1 || (d === 0 && hasDoc);
        });

      case 'doc-reject':
        return sites.filter((s) => {
          const d = Number(s.inst_doc_status ?? s.document_status);
          const str = String(s.inst_doc_status ?? '').toLowerCase().trim();
          return d === 3 || str === 'rejected' || str === 'reject';
        });

      case 'claim-applicable':
        return sites.filter((s) => {
          const v = Number(s.inst_verify_status ?? s.verify_status);
          const d = Number(s.inst_doc_status ?? s.document_status);
          return v === 1 || d === 2;
        });

      case 'claim-raised':
        return sites.filter((s) => {
          const c = Number(s.inst_claim_status ?? s.claim_status);
          const str = String(s.inst_claim_status ?? '').toLowerCase().trim();
          return c === 1 || str === 'raised' || Boolean(s.claim_amount);
        });

      case 'claim-approved':
        return sites.filter((s) => {
          const c = Number(s.inst_claim_status ?? s.claim_status);
          const str = String(s.inst_claim_status ?? '').toLowerCase().trim();
          return c === 2 || str === 'approved';
        });

      case 'claim-pending':
        return sites.filter((s) => {
          const c = Number(s.inst_claim_status ?? s.claim_status ?? 0);
          return c === 1 || c === 0;
        });

      case 'pay-done':
      case 'inst-pay-done':
        return sites.filter((s) => {
          const p = Number(s.inst_pay_status ?? s.payment_status ?? s.pay_status);
          const str = String(s.inst_pay_status ?? '').toLowerCase().trim();
          return p === 1 || p === 2 || str === 'paid';
        });

      case 'pay-partially':
      case 'inst-pay-partially':
        return sites.filter((s) => {
          const p = Number(s.inst_pay_status ?? s.payment_status ?? s.pay_status);
          const str = String(s.inst_pay_status ?? '').toLowerCase().trim();
          return p === 2 || str === 'partially';
        });

      case 'pay-pending':
      case 'inst-pay-pending':
        return sites.filter((s) => {
          const p = Number(s.inst_pay_status ?? s.payment_status ?? s.pay_status ?? 0);
          return p === 0;
        });

      default:
        return sites;
    }
  }
}

/** Normalize status string for UP Kusum C */
export const normalizeKusumCStatus = (raw: string | undefined | null): string => {
  if (!raw) return 'total';
  const clean = raw.trim().toLowerCase();
  if (clean === 'install' || clean === 'installed' || clean === 'installation-complete') return 'complete';
  if (clean === 'not-install' || clean === 'not-installed') return 'pending';
  if (clean === 'all') return 'total';
  if (clean === 'approved' || clean === 'verified') return 'verify-approved';
  if (clean === 'rejected') return 'verify-reject';
  if (clean === 'doc-approve') return 'doc-approved';
  if (clean === 'inst-pay-done') return 'pay-done';
  if (clean === 'inst-pay-pending') return 'pay-pending';
  if (clean === 'inst-pay-partially') return 'pay-partially';
  return clean;
};

/** Helper to extract array from any API payload structure */
function extractKusumCSiteList(res: any): any[] {
  if (!res) return [];
  if (Array.isArray(res)) return res;
  if (Array.isArray(res.data)) return res.data;
  if (Array.isArray(res.data?.sites)) return res.data.sites;
  if (Array.isArray(res.data?.kusumc)) return res.data.kusumc;
  if (Array.isArray(res.data?.data)) return res.data.data;
  if (Array.isArray(res.data?.list)) return res.data.list;
  if (Array.isArray(res.sites)) return res.sites;
  if (Array.isArray(res.kusumc)) return res.kusumc;
  if (Array.isArray(res.list)) return res.list;
  return [];
}

export const upInstallationService = new UpInstallationService();
export default upInstallationService;
