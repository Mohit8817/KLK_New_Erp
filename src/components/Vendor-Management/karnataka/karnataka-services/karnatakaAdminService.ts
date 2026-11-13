import { API_BASE_URL, authService } from '../../../../services/authService';
import {
  KARNATAKA_ADMIN_SWP_API,
  BASE_URL,
  API_ROOT,
  ROOT_URL,
} from '../../Vendor_Management_APIS/Karnataka_Vendor_API';

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
  } else if (normalized.startsWith('storage/')) {
    candidates.push(`${BACKEND_BASE}/${normalized}`);
  }

  candidates.push(`${BACKEND_BASE}/uploads/karnataka/swp/installation/assignsite/${filename}`);
  candidates.push(`${BACKEND_BASE}/uploads/karnataka/swp/installation/assign/${filename}`);
  candidates.push(`${BACKEND_BASE}/uploads/karnataka/swp/installation/document/${filename}`);
  candidates.push(`${BACKEND_BASE}/uploads/karnataka/swp/installation/payment/${filename}`);
  candidates.push(`${BACKEND_BASE}/uploads/karnataka/swp/installation/module/${filename}`);
  candidates.push(`${BACKEND_BASE}/uploads/karnataka/swp/installation/controller/${filename}`);
  candidates.push(`${BACKEND_BASE}/uploads/karnataka/swp/installation/structure/${filename}`);
  candidates.push(`${BACKEND_BASE}/uploads/karnataka/swp/installation/running_water/${filename}`);
  candidates.push(`${BACKEND_BASE}/uploads/karnataka/swp/installation/${filename}`);
  candidates.push(`${BACKEND_BASE}/uploads/karnataka/installation/${filename}`);
  candidates.push(`${BACKEND_BASE}/uploads/karnataka/${filename}`);
  candidates.push(`${BACKEND_BASE}/uploads/${filename}`);
  candidates.push(`${BACKEND_BASE}/${normalized}`);

  if (R2_BASE) {
    candidates.push(`${R2_BASE}/uploads/karnataka/swp/installation/${filename}`);
    candidates.push(`${R2_BASE}/karnataka_swp/${filename}`);
    candidates.push(`${R2_BASE}/${filename}`);
  }

  return Array.from(new Set(candidates));
}

export function resolveKarnatakaMediaUrl(path?: string | null): string {
  if (!path) return '';
  if (/^(https?:|data:|blob:)/i.test(path)) return path;
  const candidates = getKarnatakaMediaCandidates(path);
  return candidates[0] || `${BACKEND_BASE}/${path.replace(/^\/+/, '')}`;
}

export function normalizeKarnatakaDashboardStatus(status?: string | null): string {
  if (!status) return 'complete';
  const s = status.toLowerCase().trim();
  if (s === 'all' || s === 'total') return 'total';
  if (s === 'assign' || s === 'assigned' || s === 'site_assigned') return 'assign';
  if (s === 'not-assign' || s === 'not_assigned' || s === 'notassigned') return 'not-assign';
  if (s === 'acceptance-pending' || s === 'acceptance_pending') return 'acceptance-pending';
  if (s === 'accepted' || s === 'site-accept') return 'accepted';
  if (s === 'complete' || s === 'installed' || s === 'install') return 'installed';
  if (s === 'pending' || s === 'pending-installed' || s === 'not-install') return 'pending-installed';
  if (s === 'verify' || s === 'verify-approved' || s === 'verify_approved') return 'verify';
  if (s === 'verify-pending' || s === 'verify_pending') return 'verify-pending';
  if (s === 'verify-reject' || s === 'verify_reject' || s === 'rejected') return 'verify-reject';
  if (s === 'claim-applicable') return 'claim-applicable';
  if (s === 'claim-raised') return 'claim-raised';
  if (s === 'claim-approved') return 'claim-approved';
  if (s === 'claim-reject') return 'claim-reject';
  if (s === 'claim-pending') return 'claim-pending';
  if (s === 'pay-done' || s === 'paid' || s === 'inst_pay_done') return 'pay-done';
  if (s === 'pay-partially' || s === 'inst_pay_partially') return 'pay-partially';
  if (s === 'pay-pending' || s === 'inst_pay_pending') return 'pay-pending';
  return s;
}

/* ═══════════════════ Type Definitions ═══════════════════ */

export interface VendorItem {
  id: number;
  name: string;
  vendor_id?: string;
  phone?: string;
  email?: string;
  state?: string;
  company_id?: number;
  [key: string]: any;
}

export interface VolumeItem {
  volume: string;
}

export interface DistrictItem {
  district: string;
}

export interface ApplicantItem {
  id: number;
  f_farmer_name?: string;
  farmer_name?: string;
  f_father_name?: string;
  father_name?: string;
  application_no?: string;
  district?: string;
  volume?: string;
  block?: string;
  tehsil?: string;
  village?: string;
  contact_no?: string;
  inst_deadline?: string;
  [key: string]: any;
}

export interface AssignRecord {
  id: number;
  vendor: number;
  vendor_name?: string;
  purpose?: string;
  state?: string;
  project?: string;
  district: string;
  volume: string;
  site_id: string | number[];
  site_count: number;
  status: number; // 0 = Pending Approval, 1 = Approved / Active
  assign_date?: string;
  deadline_date?: string;
  remarks?: string;
  file?: string | null;
  vendors?: { id: number; name: string };
  sites?: Array<{
    id: number;
    farmer_name?: string;
    f_farmer_name?: string;
    inst_deadline?: string;
    application_no?: string;
    father_name?: string;
    district?: string;
    tehsil?: string;
    village?: string;
    [key: string]: any;
  }>;
  [key: string]: any;
}

export interface AssignDetailsSummary {
  total: number;
  assigned: number;
  not_assigned: number;
  complete: number;
  pending: number;
  verify_approved: number;
  verify_pending: number;
  verify_reject: number;
}

export interface SiteInstallationItem {
  id: number;
  uid?: string | number;
  company_id?: string | number;
  state?: string;
  vendor_name?: string;
  inst_vendor?: number;
  vendor_id?: number;
  district?: string;
  tehsil?: string;
  f_tehsil?: string;
  block?: string;
  gpanchayat?: string;
  village?: string;
  f_village?: string;
  f_pincode?: string;
  hobli?: string;
  region?: string;
  zone?: string;
  circle?: string;
  division?: string;
  subdivision?: string;
  section?: string;
  discom?: string;
  unip_type?: string;
  applicant_name?: string;
  farmer_name?: string;
  f_farmer_name?: string;
  father_name?: string;
  f_father_name?: string;
  caste?: string;
  f_contact?: string;
  contact_no?: string;
  f_aadhar?: string;
  f_post?: string;
  application_no?: string;
  rr_no?: string;
  f_customer_no?: string;
  work_order_no?: string;
  work_order_date?: string;
  lot?: string;
  phase?: string;
  pump_type?: string;
  pump_sub_type?: string;
  pump_capacity?: string;
  pump_no?: string;
  motor_no?: string;
  imei_no?: string;
  controller_no?: string;
  module_serial_no?: string;
  module_image?: string;
  foundation_image?: string;
  controller_image?: string;
  structure_image?: string;
  running_water_image?: string;
  latitude?: string;
  longitude?: string;
  inst_date?: string;
  installed_date?: string;
  inst_deadline?: string;
  inst_assign_date?: string;
  inst_assigned_id?: number;
  inst_assigned_by?: string | number;
  inst_accept?: number;
  inst_status?: number;
  inst_remarks?: string;
  inst_verify_status?: number; // 0 = Pending, 1 = Approved, 2 = Rejected
  inst_verify_remarks?: string;
  inst_verify_date?: string;
  inst_verify_by?: string | number;
  verify_remarks?: string;
  inst_doc?: string;
  document_file?: string;
  submit_date?: string;
  remarks?: string;
  inst_doc_status?: number; // 1 = Pending, 2 = Approved, 3 = Rejected
  inst_doc_date?: string;
  inst_doc_remarks?: string;
  inst_doc_verify_by?: string | number;
  inst_doc_verify_date?: string;
  inst_doc_verify_remarks?: string;
  doc_remarks?: string;
  inst_claim_status?: number;
  inst_pay_status?: number;
  created_at?: string;
  updated_at?: string;
  created_by?: string | number;
  updated_by?: string | number;
  [key: string]: any;
}

export interface ClaimItem {
  id: number;
  company_id?: string | number;
  vendor_id: number | string;
  vendor_name?: string;
  state?: string;
  project?: string;
  type?: string;
  site_id?: string | number[];
  file?: string;
  date?: string;
  invoice?: string;
  invoice_no?: string;
  payment_type?: string;
  total_amount?: number | string;
  amount: number | string;
  grand_total?: number | string;
  grand_amount?: number | string;
  claim_status: number; // 1 = Raised, 2 = Approved, 3 = Rejected
  pay_status: number; // 0 = Pending, 1 = Partial, 2 = Complete
  remarks?: string;
  verify_remarks?: string;
  approved_date?: string;
  approved_by?: string | number;
  approved_remarks?: string;
  sites?: Array<{
    id: number;
    farmer_name?: string;
    f_farmer_name?: string;
    application_no?: string;
    [key: string]: any;
  }>;
  vendors?: { id: number; name: string };
  [key: string]: any;
}

export interface PaymentItem {
  id: number;
  vendor_id: number;
  vendor_name?: string;
  date?: string;
  sites?: string | number;
  invoice?: string;
  amount: number | string;
  remarks?: string;
  pay_amount?: number | string;
  balance_amount?: number | string;
  grand_total?: number | string;
  pay_date?: string;
  pay_remarks?: string;
  pay_status: number; // 0 = Pending, 1 = Partially, 2 = Complete
  vendors?: { id: number; name: string };
  [key: string]: any;
}

export interface PaymentDetailSummary {
  total: number;
  complete: number;
  partially: number;
  pending: number;
}

export interface WarehouseItem {
  warehouse: string;
  id?: number;
  name?: string;
}

export interface ProductItem {
  id: number;
  name: string;
  warehouse?: string;
  unit?: string;
}

export interface DispatchMaterialRecord {
  id: number;
  state?: string;
  vendor_id: number;
  vendor_name?: string;
  vendor_contact?: string;
  site_count: number;
  dispatch_date: string;
  truck_no: string;
  challan_no: string;
  driver_no: string;
  warehouse_name: string;
  product?: string;
  unit?: string;
  quantity?: number | string;
  status?: string | number;
  received_date?: string;
  remarks?: string;
  material?: Array<{
    id?: number;
    product: string;
    unit: string;
    quantity: number | string;
  }>;
  Material?: Array<{
    id?: number;
    product: string;
    unit: string;
    quantity: number | string;
  }>;
  vendors?: { id: number; name: string; phone?: string; vendor_id?: string };
  [key: string]: any;
}

export interface KarnatakaSwpDashboardResponse {
  loginId?: number;
  loginName?: string;
  company_id?: number;
  role?: string;
  state?: string;
  swp?: {
    site_count: number;
    complete: number;
    pending: number;
    site_assigned: number;
    site_not_assigned: number;
    acceptance_pending: number;
    accepted: number;
    verify_pending: number;
    verify_approved: number;
    verify_reject: number;
    claim_applicable: number;
    claim_raised: number;
    claim_approved: number;
    claim_pending: number;
    inst_pay_done: number;
    inst_pay_partially: number;
    inst_pay_pending: number;
  };
  payment_amount?: string | number;
  claim_amount?: string | number;
  districtwise?: Array<{
    district: string;
    total: number;
    total_assigned: number;
    acceptance_pending: number;
    inst_complete: number;
    inst_pending: number;
    verify_pending: number;
    verify_approved: number;
    verify_reject: number;
    claim_raised: number;
    claim_approved: number;
    claim_reject: number;
    payment_pending: number;
    payment_done: number;
    payment_partially: number;
  }>;
  vendors?: Array<{
    inst_vendor: number;
    vendor: number;
    name: string;
  }>;
  vendorswise?: Array<{
    inst_vendor: number;
    name?: string;
    site_count: number;
    acceptance_pending: number;
    inst_complete: number;
    inst_pending: number;
    verify_pending: number;
    verify_approved: number;
    verify_reject: number;
    claim_raised: number;
    claim_approved: number;
    claim_reject: number;
    payment_pending: number;
    payment_done: number;
    payment_partially: number;
  }>;
  vendor_installation_month?: Array<{
    month_year: string;
    monthly_installations: number;
  }>;
  vendor_today_installation?: Array<{
    inst_vendor: number;
    today_install: number;
  }>;
}

export interface AdminApiResponse<T = any> {
  status?: boolean;
  success?: boolean;
  message?: string;
  data?: T;
  [key: string]: any;
}

/* ═══════════════════ Service Class ═══════════════════ */

class KarnatakaAdminService {
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

  private async fetchWithFallback(url: string, altUrl: string, options: RequestInit = {}): Promise<Response> {
    try {
      const res = await fetch(url, options);
      if ((res.status === 404 || res.status === 405) && altUrl && altUrl !== url) {
        return await fetch(altUrl, options);
      }
      return res;
    } catch (e) {
      if (altUrl && altUrl !== url) {
        return await fetch(altUrl, options);
      }
      throw e;
    }
  }

  // ── 1. Assign Form Data ──
  async getAssignFormData(): Promise<{ vendors: VendorItem[]; volumes: VolumeItem[] }> {
    const res = await this.fetchWithFallback(
      KARNATAKA_ADMIN_SWP_API.ASSIGN_FORM_DATA,
      KARNATAKA_ADMIN_SWP_API.ASSIGN_FORM_DATA_ALT,
      { method: 'GET', headers: this.getHeaders() }
    );
    const json: AdminApiResponse<{ vendors: VendorItem[]; volumes: VolumeItem[] }> = await res.json();
    if (!res.ok && !json.status && !json.success) {
      throw new Error(json.message || `Failed to fetch assignment initial data (${res.status})`);
    }
    const data = json.data || (json as any);
    return {
      vendors: Array.isArray(data?.vendors) ? data.vendors : [],
      volumes: Array.isArray(data?.volumes) ? data.volumes : [],
    };
  }

  // ── 2. Fetch Districts for Volume ──
  async fetchDistricts(volume: string | number): Promise<DistrictItem[]> {
    const res = await this.fetchWithFallback(
      KARNATAKA_ADMIN_SWP_API.FETCH_DISTRICTS(volume),
      KARNATAKA_ADMIN_SWP_API.FETCH_DISTRICTS_ALT(volume),
      { method: 'GET', headers: this.getHeaders() }
    );
    const json: AdminApiResponse<{ districts?: DistrictItem[] }> = await res.json();
    if (!res.ok && !json.status && !json.success) {
      throw new Error(json.message || `Failed to fetch districts (${res.status})`);
    }
    const data = json.data || (json as any);
    const list = data?.districts ?? data;
    return Array.isArray(list) ? list : [];
  }

  // ── 3. Fetch Applicants ──
  async fetchApplicants(district: string, volume: string | number): Promise<ApplicantItem[]> {
    const res = await this.fetchWithFallback(
      KARNATAKA_ADMIN_SWP_API.FETCH_APPLICANTS(district, volume),
      KARNATAKA_ADMIN_SWP_API.FETCH_APPLICANTS_ALT(district, volume),
      { method: 'GET', headers: this.getHeaders() }
    );
    const json: AdminApiResponse<{ applicants?: ApplicantItem[] }> = await res.json();
    if (!res.ok && !json.status && !json.success) {
      throw new Error(json.message || `Failed to fetch applicants (${res.status})`);
    }
    const data = json.data || (json as any);
    const list = data?.applicants ?? data;
    return Array.isArray(list) ? list : [];
  }

  // ── 4. Store Assign (multipart/form-data) ──
  async storeAssign(formData: FormData): Promise<{ success: boolean; message: string }> {
    const res = await this.fetchWithFallback(
      KARNATAKA_ADMIN_SWP_API.STORE_ASSIGN,
      KARNATAKA_ADMIN_SWP_API.STORE_ASSIGN_ALT,
      { method: 'POST', headers: this.getHeaders(true), body: formData }
    );
    const json = await res.json();
    if (!res.ok && !json.success && !json.status) {
      throw new Error(json.message || json.error || `Failed to assign sites (${res.status})`);
    }
    return { success: true, message: json.message || 'Sites assigned successfully.' };
  }

  // ── 5. Edit Assign ──
  async getEditAssign(id: string | number): Promise<{
    vendors: VendorItem[];
    assign: AssignRecord;
    volumes: VolumeItem[];
    districts: DistrictItem[];
    applicant_names: ApplicantItem[];
  }> {
    const res = await this.fetchWithFallback(
      KARNATAKA_ADMIN_SWP_API.EDIT_ASSIGN(id),
      KARNATAKA_ADMIN_SWP_API.EDIT_ASSIGN_ALT(id),
      { method: 'GET', headers: this.getHeaders() }
    );
    const json = await res.json();
    if (!res.ok && !json.success && !json.status) {
      throw new Error(json.message || `Failed to fetch assign record #${id} (${res.status})`);
    }
    const data = json.data || json;
    return {
      vendors: Array.isArray(data?.vendors) ? data.vendors : [],
      assign: data?.assign || ({} as AssignRecord),
      volumes: Array.isArray(data?.volumes) ? data.volumes : [],
      districts: Array.isArray(data?.districts) ? data.districts : [],
      applicant_names: Array.isArray(data?.applicant_names) ? data.applicant_names : [],
    };
  }

  // ── 6. Update Assign ──
  async updateAssign(id: string | number, formData: FormData): Promise<{ success: boolean; message: string; data?: any }> {
    const res = await this.fetchWithFallback(
      KARNATAKA_ADMIN_SWP_API.UPDATE_ASSIGN(id),
      KARNATAKA_ADMIN_SWP_API.UPDATE_ASSIGN_ALT(id),
      { method: 'POST', headers: this.getHeaders(true), body: formData }
    );
    const json = await res.json();
    if (!res.ok && !json.success && !json.status) {
      throw new Error(json.message || json.error || `Failed to update assigned site (${res.status})`);
    }
    return { success: true, message: json.message || 'Assigned Site Updated Successfully.', data: json.data };
  }

  // ── 7. View Assign ──
  async getViewAssign(): Promise<{ assigns: AssignRecord[]; details: AssignDetailsSummary }> {
    const res = await this.fetchWithFallback(
      KARNATAKA_ADMIN_SWP_API.VIEW_ASSIGN,
      KARNATAKA_ADMIN_SWP_API.VIEW_ASSIGN_ALT,
      { method: 'GET', headers: this.getHeaders() }
    );
    const json = await res.json();
    if (!res.ok && !json.success && !json.status) {
      throw new Error(json.message || `Failed to fetch assigned installations (${res.status})`);
    }
    const assigns = Array.isArray(json?.assigns) ? json.assigns : Array.isArray(json?.data) ? json.data : [];
    const details = json?.details || json?.detail || {
      total: assigns.length,
      assigned: assigns.length,
      not_assigned: 0,
      complete: 0,
      pending: 0,
      verify_approved: 0,
      verify_pending: 0,
      verify_reject: 0,
    };
    return { assigns, details };
  }

  // ── 8. Approve Assign ──
  async approveAssign(id: string | number): Promise<{ success: boolean; message: string }> {
    const candidateUrls = [
      KARNATAKA_ADMIN_SWP_API.APPROVE_ASSIGN(id),
      KARNATAKA_ADMIN_SWP_API.APPROVE_ASSIGN_ALT(id),
      (KARNATAKA_ADMIN_SWP_API as any).APPROVE_ASSIGN_ADMIN?.(id) || `${BASE_URL}/karnataka/swp/installation/approvel-assign/${encodeURIComponent(id)}`,
      (KARNATAKA_ADMIN_SWP_API as any).APPROVE_ASSIGN_APPROVAL?.(id) || `${API_ROOT}/karnataka/swp/installation/approval-assign/${encodeURIComponent(id)}`,
      KARNATAKA_ADMIN_SWP_API.APPROVE_ASSIGN_REST(id),
      (KARNATAKA_ADMIN_SWP_API as any).APPROVE_ASSIGN_DIRECT?.(id) || `${ROOT_URL}/karnataka/swp/installation/approvel-assign/${encodeURIComponent(id)}`,
      (KARNATAKA_ADMIN_SWP_API as any).APPROVE_ASSIGN_DIRECT_APPROVAL?.(id) || `${ROOT_URL}/karnataka/swp/installation/approval-assign/${encodeURIComponent(id)}`,
      (KARNATAKA_ADMIN_SWP_API as any).APPROVE_ASSIGN_DIRECT_ADMIN?.(id) || `${ROOT_URL}/admin/karnataka/swp/installation/approvel-assign/${encodeURIComponent(id)}`,
    ].filter((u, i, arr): u is string => Boolean(u) && arr.indexOf(u) === i);

    const postHeaders = this.getHeaders();
    const getHeaders: Record<string, string> = {
      Accept: 'application/json',
      ...(postHeaders.Authorization ? { Authorization: postHeaders.Authorization } : {}),
    };

    let lastError: any = null;

    const parsePayload = async (res: Response) => {
      const text = await res.text();
      let json: any = null;
      try {
        json = JSON.parse(text);
      } catch {
        json = null;
      }

      if (res.ok) {
        if (!json || json.success === true || json.status === true || json.status === 1 || !json.error) {
          return { success: true, message: json?.message || 'Success' };
        }
      }

      const errMsg =
        json?.message ||
        json?.error ||
        (text && text.length < 200 ? text : `Request failed with status ${res.status}`);
      const err: any = new Error(errMsg);
      err.status = res.status;
      err.data = json;
      return err;
    };

    // Pass 1: Try POST on candidate URLs. If 405 Method Not Allowed, immediately fallback to GET on same URL.
    for (const url of candidateUrls) {
      try {
        const res = await fetch(url, {
          method: 'POST',
          headers: postHeaders,
          body: JSON.stringify({ id: Number(id) }),
        });

        if (res.status === 405) {
          // 405 Method Not Allowed -> Route registered with Route::get instead of Route::post
          try {
            const getRes = await fetch(url, {
              method: 'GET',
              headers: getHeaders,
            });
            if (getRes.ok) {
              const parsed = await parsePayload(getRes);
              if (!(parsed instanceof Error)) return parsed;
              lastError = parsed;
            } else if (getRes.status !== 404 && getRes.status !== 405) {
              lastError = await parsePayload(getRes);
            }
          } catch (getErr) {
            lastError = getErr;
          }
        } else if (res.ok) {
          const parsed = await parsePayload(res);
          if (!(parsed instanceof Error)) return parsed;
          lastError = parsed;
        } else if (res.status !== 404) {
          lastError = await parsePayload(res);
        }
      } catch (err: any) {
        lastError = err;
      }
    }

    // Pass 2: If POST did not succeed on any URL, try GET on each candidate URL
    for (const url of candidateUrls) {
      try {
        const res = await fetch(url, {
          method: 'GET',
          headers: getHeaders,
        });
        if (res.ok) {
          const parsed = await parsePayload(res);
          if (!(parsed instanceof Error)) return parsed;
          lastError = parsed;
        }
      } catch (err: any) {
        lastError = err;
      }
    }

    throw lastError || new Error(`Approval failed for assignment #${id}`);
  }

  // ── 9. View Installation ──
  async getViewInstallation(): Promise<{
    details: AssignDetailsSummary;
    verification: SiteInstallationItem[];
    verified: SiteInstallationItem[];
  }> {
    const res = await this.fetchWithFallback(
      KARNATAKA_ADMIN_SWP_API.VIEW_INSTALLATION,
      KARNATAKA_ADMIN_SWP_API.VIEW_INSTALLATION_ALT,
      { method: 'GET', headers: this.getHeaders() }
    );
    const json = await res.json();
    if (!res.ok && !json.success && !json.status) {
      throw new Error(json.message || `Failed to fetch installation verification data (${res.status})`);
    }
    const data = json.data || json;
    const rawVerification: SiteInstallationItem[] = Array.isArray(data?.verification) ? data.verification : [];
    const rawVerified: SiteInstallationItem[] = Array.isArray(data?.verified) ? data.verified : [];

    // If backend returns all records in verification and none in verified, split by inst_verify_status
    let verification = rawVerification;
    let verified = rawVerified;
    if (rawVerified.length === 0 && rawVerification.length > 0) {
      const hasVerified = rawVerification.some((s) => Number(s.inst_verify_status ?? 0) !== 0);
      if (hasVerified) {
        verification = rawVerification.filter((s) => Number(s.inst_verify_status ?? 0) === 0);
        verified = rawVerification.filter((s) => Number(s.inst_verify_status ?? 0) !== 0);
      }
    }

    return {
      details: data?.details || data?.detail || {
        total: 0, assigned: 0, not_assigned: 0, complete: 0, pending: 0,
        verify_approved: 0, verify_pending: 0, verify_reject: 0,
      },
      verification,
      verified,
    };
  }

  // ── 10. Verify Installation Status ──
  async verifyInstallationStatus(payload: {
    id: number;
    status: number; // 1 approve or 2 reject
    inst_verify_remarks?: string;
    remarks?: string;
  }): Promise<{ success: boolean; message: string; data?: any }> {
    const remarks = payload.inst_verify_remarks ?? payload.remarks ?? '';
    const body = {
      id: payload.id,
      status: payload.status,
      inst_verify_status: payload.status,
      inst_verify_remarks: remarks,
      remarks,
    };
    const res = await this.fetchWithFallback(
      KARNATAKA_ADMIN_SWP_API.VERIFY_INSTALLATION_STATUS,
      KARNATAKA_ADMIN_SWP_API.VERIFY_INSTALLATION_STATUS_ALT,
      { method: 'POST', headers: this.getHeaders(), body: JSON.stringify(body) }
    );
    const json = await res.json();
    if (!res.ok && !json.success && !json.status) {
      throw new Error(json.message || `Failed to update installation verification status (${res.status})`);
    }
    return { success: true, message: json.message || 'Status Updated Successfully.', data: json.data };
  }

  // ── 11. View Installation Document ──
  async getViewInstallationDocument(): Promise<{
    detail: any;
    verification: SiteInstallationItem[];
    verified: SiteInstallationItem[];
  }> {
    const res = await this.fetchWithFallback(
      KARNATAKA_ADMIN_SWP_API.VIEW_INSTALLATION_DOCUMENT,
      KARNATAKA_ADMIN_SWP_API.VIEW_INSTALLATION_DOCUMENT_ALT,
      { method: 'GET', headers: this.getHeaders() }
    );
    const json = await res.json();
    if (!res.ok && !json.success && !json.status) {
      throw new Error(json.message || `Failed to fetch installation documents (${res.status})`);
    }
    const data = json.data || json;
    return {
      detail: data?.detail || data?.details || {
        total: 0, assigned: 0, not_assigned: 0, complete: 0, pending: 0,
        doc_approved: 0, doc_pending: 0, doc_reject: 0,
      },
      verification: Array.isArray(data?.verification) ? data.verification : [],
      verified: Array.isArray(data?.verified) ? data.verified : [],
    };
  }

  // ── 12. Verify Installation Doc Status ──
  async verifyInstallationDocStatus(payload: {
    id: number;
    status: number; // 2 approve or 3 reject
    remarks?: string;
    inst_doc_verify_remarks?: string;
  }): Promise<{ success: boolean; message: string; data?: any }> {
    const remarks = payload.remarks ?? payload.inst_doc_verify_remarks ?? '';
    const body = {
      id: payload.id,
      status: payload.status,
      inst_doc_status: payload.status,
      remarks,
      inst_doc_verify_remarks: remarks,
    };
    const res = await this.fetchWithFallback(
      KARNATAKA_ADMIN_SWP_API.VERIFY_INSTALLATION_DOC_STATUS,
      KARNATAKA_ADMIN_SWP_API.VERIFY_INSTALLATION_DOC_STATUS_ALT,
      { method: 'POST', headers: this.getHeaders(), body: JSON.stringify(body) }
    );
    const json = await res.json();
    if (!res.ok && !json.success && !json.status) {
      throw new Error(json.message || `Failed to update document verification status (${res.status})`);
    }
    return { success: true, message: json.message || 'Status updated successfully.', data: json.data };
  }

  // ── 13. View Claim ──
  async getViewClaim(): Promise<ClaimItem[]> {
    const res = await this.fetchWithFallback(
      KARNATAKA_ADMIN_SWP_API.VIEW_CLAIM,
      KARNATAKA_ADMIN_SWP_API.VIEW_CLAIM_ALT,
      { method: 'GET', headers: this.getHeaders() }
    );
    const json = await res.json();
    if (!res.ok && !json.success && !json.status) {
      throw new Error(json.message || `Failed to fetch claims (${res.status})`);
    }
    const data = json.data ?? json;
    return Array.isArray(data) ? data : [];
  }

  // ── 14. Claim Status Update ──
  async updateClaimStatus(payload: {
    id: number;
    status: number; // 2 approve or 3 reject
    remarks?: string;
    approved_remarks?: string;
  }): Promise<{ success: boolean; message: string; data?: any }> {
    const remarks = payload.remarks ?? payload.approved_remarks ?? '';
    const body = {
      id: payload.id,
      status: payload.status,
      claim_status: payload.status,
      remarks,
      approved_remarks: remarks,
    };
    const res = await this.fetchWithFallback(
      KARNATAKA_ADMIN_SWP_API.CLAIM_STATUS_UPDATE,
      KARNATAKA_ADMIN_SWP_API.CLAIM_STATUS_UPDATE_ALT,
      { method: 'POST', headers: this.getHeaders(), body: JSON.stringify(body) }
    );
    const json = await res.json();
    if (!res.ok && !json.success && !json.status) {
      throw new Error(json.message || json.error || `Failed to update claim status (${res.status})`);
    }
    return { success: true, message: json.message || 'Claim status updated successfully.', data: json.data };
  }

  // ── 15. Payment View ──
  async getPaymentView(params?: {
    from_date?: string;
    to_date?: string;
    vendor?: string | number;
    status?: string | number;
  }): Promise<{
    payments: PaymentItem[];
    payment_detail: PaymentDetailSummary;
    vendors: VendorItem[];
  }> {
    const res = await this.fetchWithFallback(
      KARNATAKA_ADMIN_SWP_API.PAYMENT_VIEW(params),
      KARNATAKA_ADMIN_SWP_API.PAYMENT_VIEW_ALT(params),
      { method: 'GET', headers: this.getHeaders() }
    );
    const json = await res.json();
    if (!res.ok && !json.success && !json.status) {
      throw new Error(json.message || `Failed to fetch payment details (${res.status})`);
    }
    const payments = Array.isArray(json?.payments) ? json.payments : Array.isArray(json?.data) ? json.data : [];
    const payment_detail = json?.payment_detail || {
      total: payments.length,
      complete: payments.filter((p: any) => Number(p.pay_status) === 2).length,
      partially: payments.filter((p: any) => Number(p.pay_status) === 1).length,
      pending: payments.filter((p: any) => Number(p.pay_status) === 0).length,
    };
    const vendors = Array.isArray(json?.vendors) ? json.vendors : [];
    return { payments, payment_detail, vendors };
  }

  // ── 16. Payment Update ──
  async updatePayment(payload: {
    id: number;
    amount: number | string;
    date: string;
    remarks?: string;
  }): Promise<{ success: boolean; message: string }> {
    const res = await this.fetchWithFallback(
      KARNATAKA_ADMIN_SWP_API.PAYMENT_UPDATE,
      KARNATAKA_ADMIN_SWP_API.PAYMENT_UPDATE_ALT,
      { method: 'POST', headers: this.getHeaders(), body: JSON.stringify(payload) }
    );
    const json = await res.json();
    if (!res.ok && !json.success && !json.status) {
      throw new Error(json.message || json.error || `Payment update failed (${res.status})`);
    }
    return { success: true, message: json.message || 'Payment Successfully!' };
  }

  // ── 17. Dashboard ──
  async getDashboard(): Promise<KarnatakaSwpDashboardResponse> {
    const res = await this.fetchWithFallback(
      KARNATAKA_ADMIN_SWP_API.DASHBOARD,
      KARNATAKA_ADMIN_SWP_API.DASHBOARD_ALT,
      { method: 'GET', headers: this.getHeaders() }
    );
    const json = await res.json();
    if (!res.ok && !json.success && !json.status) {
      throw new Error(json.message || `Failed to fetch Karnataka dashboard data (${res.status})`);
    }
    return json.data || json;
  }

  // ── 18. View Dashboard Status Drilldown ──
  async getViewDashboardData(status?: string): Promise<any[]> {
    const s = normalizeKarnatakaDashboardStatus(status);
    const res = await this.fetchWithFallback(
      KARNATAKA_ADMIN_SWP_API.VIEW_DASHBOARD(s),
      KARNATAKA_ADMIN_SWP_API.VIEW_DASHBOARD_ALT(s),
      { method: 'GET', headers: this.getHeaders() }
    );
    const json = await res.json();
    if (!res.ok && !json.success && !json.status) {
      throw new Error(json.message || `Failed to fetch status data (${res.status})`);
    }
    const data = json.data || json;
    return Array.isArray(data?.swp) ? data.swp : Array.isArray(data) ? data : [];
  }

  // ── 19. Vendor-wise Data ──
  async getVendorWiseData(status: string, vendor: string | number): Promise<any[]> {
    const s = normalizeKarnatakaDashboardStatus(status);
    const res = await this.fetchWithFallback(
      KARNATAKA_ADMIN_SWP_API.VENDOR_WISE_DATA(s, vendor),
      KARNATAKA_ADMIN_SWP_API.VENDOR_WISE_DATA_ALT(s, vendor),
      { method: 'GET', headers: this.getHeaders() }
    );
    const json = await res.json();
    if (!res.ok && !json.success && !json.status) {
      throw new Error(json.message || `Failed to fetch vendorwise data (${res.status})`);
    }
    const data = json.data || json;
    return Array.isArray(data?.swp) ? data.swp : Array.isArray(data) ? data : [];
  }

  // ── 20. District-wise Data ──
  async getDistrictWiseData(status: string, district: string): Promise<any[]> {
    const s = normalizeKarnatakaDashboardStatus(status);
    const res = await this.fetchWithFallback(
      KARNATAKA_ADMIN_SWP_API.DISTRICT_WISE_DATA(s, district),
      KARNATAKA_ADMIN_SWP_API.DISTRICT_WISE_DATA_ALT(s, district),
      { method: 'GET', headers: this.getHeaders() }
    );
    const json = await res.json();
    if (!res.ok && !json.success && !json.status) {
      throw new Error(json.message || `Failed to fetch districtwise data (${res.status})`);
    }
    const data = json.data || json;
    return Array.isArray(data?.swp) ? data.swp : Array.isArray(data) ? data : [];
  }

  // ── 21. View Material Dispatch ──
  async getViewMaterialDispatch(): Promise<DispatchMaterialRecord[]> {
    const candidateUrls = [
      KARNATAKA_ADMIN_SWP_API.VIEW_MATERIAL_DISPATCH,
      KARNATAKA_ADMIN_SWP_API.VIEW_MATERIAL_DISPATCH_ALT,
      KARNATAKA_ADMIN_SWP_API.VIEW_MATERIAL_DISPATCH_SCOPE,
      KARNATAKA_ADMIN_SWP_API.VIEW_MATERIAL_DISPATCH_SCOPE_ALT,
      `${ROOT_URL}/karnataka/swp/installation/view-material-dispatch`,
      `${ROOT_URL}/admin/karnataka/swp/installation/view-material-dispatch`,
      `${BASE_URL}/karnataka/swp/installation/material-dispatch`,
      `${API_ROOT}/karnataka/swp/installation/material-dispatch`,
      `${BASE_URL}/karnataka/swp/installation/view-dispatch-material`,
      `${API_ROOT}/karnataka/swp/installation/view-dispatch-material`,
      `${BASE_URL}/view-material-dispatch`,
      `${API_ROOT}/view-material-dispatch`,
      `${ROOT_URL}/view-material-dispatch`,
    ].filter((u, i, arr): u is string => Boolean(u) && arr.indexOf(u) === i);

    let lastError: any = null;
    for (const url of candidateUrls) {
      try {
        const res = await fetch(url, { method: 'GET', headers: this.getHeaders() });
        if (res.status === 404 || res.status === 405) {
          continue;
        }
        const text = await res.text();
        let json: any = null;
        try {
          json = JSON.parse(text);
        } catch {
          json = null;
        }
        if (res.ok && json) {
          const data = json.data || json;
          const list = Array.isArray(data?.dispatchmaterials)
            ? data.dispatchmaterials
            : Array.isArray(json?.dispatchmaterials)
            ? json.dispatchmaterials
            : Array.isArray(data?.dispatches)
            ? data.dispatches
            : Array.isArray(json?.dispatches)
            ? json.dispatches
            : Array.isArray(data)
            ? data
            : Array.isArray(json)
            ? json
            : [];
          return list;
        }
        if (!res.ok) {
          lastError = new Error(json?.message || `Failed to fetch material dispatches (${res.status})`);
        }
      } catch (err: any) {
        lastError = err;
      }
    }
    if (lastError) throw lastError;
    return [];
  }

  // ── 22. Material Dispatch Initial Form Data ──
  async getMaterialDispatchFormData(): Promise<{
    warehouse: WarehouseItem[];
    products: ProductItem[];
    vendors: VendorItem[];
  }> {
    const candidateUrls = [
      KARNATAKA_ADMIN_SWP_API.MATERIAL_DISPATCH_FORM,
      KARNATAKA_ADMIN_SWP_API.MATERIAL_DISPATCH_FORM_ALT,
      `${ROOT_URL}/karnataka/swp/installation/material-dispatch`,
      `${ROOT_URL}/admin/karnataka/swp/installation/material-dispatch`,
      `${BASE_URL}/material-dispatch`,
      `${API_ROOT}/material-dispatch`,
    ].filter((u, i, arr): u is string => Boolean(u) && arr.indexOf(u) === i);

    let lastError: any = null;
    for (const url of candidateUrls) {
      try {
        const res = await fetch(url, { method: 'GET', headers: this.getHeaders() });
        if (res.status === 404 || res.status === 405) {
          continue;
        }
        const text = await res.text();
        let json: any = null;
        try {
          json = JSON.parse(text);
        } catch {
          json = null;
        }
        if (res.ok && json) {
          const data = json.data || json;
          return {
            warehouse: Array.isArray(data?.warehouse) ? data.warehouse : Array.isArray(json?.warehouse) ? json.warehouse : [],
            products: Array.isArray(data?.products) ? data.products : Array.isArray(json?.products) ? json.products : [],
            vendors: Array.isArray(data?.vendors) ? data.vendors : Array.isArray(json?.vendors) ? json.vendors : [],
          };
        }
        if (!res.ok) {
          lastError = new Error(json?.message || `Failed to fetch material dispatch form requirements (${res.status})`);
        }
      } catch (err: any) {
        lastError = err;
      }
    }
    if (lastError) throw lastError;
    return { warehouse: [], products: [], vendors: [] };
  }

  // ── 23. Material Dispatch Store ──
  async storeMaterialDispatch(payload: FormData | Record<string, any>): Promise<{ success: boolean; message: string }> {
    const isMultipart = payload instanceof FormData;
    const body = isMultipart ? payload : JSON.stringify(payload);
    const candidateUrls = [
      KARNATAKA_ADMIN_SWP_API.MATERIAL_DISPATCH_STORE,
      KARNATAKA_ADMIN_SWP_API.MATERIAL_DISPATCH_STORE_ALT,
      `${ROOT_URL}/karnataka/swp/installation/material-dispatch-store`,
      `${ROOT_URL}/admin/karnataka/swp/installation/material-dispatch-store`,
      `${BASE_URL}/material-dispatch-store`,
      `${API_ROOT}/material-dispatch-store`,
    ].filter((u, i, arr): u is string => Boolean(u) && arr.indexOf(u) === i);

    let lastError: any = null;
    for (const url of candidateUrls) {
      try {
        const res = await fetch(url, {
          method: 'POST',
          headers: this.getHeaders(isMultipart),
          body,
        });
        if (res.status === 404 || res.status === 405) {
          continue;
        }
        const text = await res.text();
        let json: any = null;
        try {
          json = JSON.parse(text);
        } catch {
          json = null;
        }
        if (res.ok && (!json || json.success || json.status)) {
          return { success: true, message: json?.message || 'Material Dispatch Successfully!!!' };
        }
        if (!res.ok) {
          lastError = new Error(json?.message || json?.error || `Failed to store material dispatch (${res.status})`);
        }
      } catch (err: any) {
        lastError = err;
      }
    }
    if (lastError) throw lastError;
    return { success: true, message: 'Material Dispatch Successfully!!!' };
  }

  // ── 24. Update Material Dispatch Get ──
  async getUpdateMaterialDispatch(id: string | number): Promise<{
    vendors: VendorItem[];
    warehouse: WarehouseItem[];
    products: ProductItem[];
    dispatchmaterial: any;
    dispatches: any[];
  }> {
    const candidateUrls = [
      KARNATAKA_ADMIN_SWP_API.UPDATE_MATERIAL_DISPATCH_GET(id),
      KARNATAKA_ADMIN_SWP_API.UPDATE_MATERIAL_DISPATCH_GET_ALT(id),
      `${ROOT_URL}/karnataka/swp/installation/update-material-dispatch/${encodeURIComponent(id)}`,
      `${ROOT_URL}/admin/karnataka/swp/installation/update-material-dispatch/${encodeURIComponent(id)}`,
      `${BASE_URL}/update-material-dispatch/${encodeURIComponent(id)}`,
      `${API_ROOT}/update-material-dispatch/${encodeURIComponent(id)}`,
    ].filter((u, i, arr): u is string => Boolean(u) && arr.indexOf(u) === i);

    let lastError: any = null;
    for (const url of candidateUrls) {
      try {
        const res = await fetch(url, { method: 'GET', headers: this.getHeaders() });
        if (res.status === 404 || res.status === 405) {
          continue;
        }
        const text = await res.text();
        let json: any = null;
        try {
          json = JSON.parse(text);
        } catch {
          json = null;
        }
        if (res.ok && json) {
          const data = json.data || json;
          return {
            vendors: Array.isArray(data?.vendors) ? data.vendors : Array.isArray(json?.vendors) ? json.vendors : [],
            warehouse: Array.isArray(data?.warehouse) ? data.warehouse : Array.isArray(json?.warehouse) ? json.warehouse : [],
            products: Array.isArray(data?.products) ? data.products : Array.isArray(json?.products) ? json.products : [],
            dispatchmaterial: data?.dispatchmaterial || json?.dispatchmaterial || {},
            dispatches: Array.isArray(data?.dispatches) ? data.dispatches : Array.isArray(json?.dispatches) ? json.dispatches : [],
          };
        }
        if (!res.ok) {
          lastError = new Error(json?.message || `Failed to load material dispatch #${id}`);
        }
      } catch (err: any) {
        lastError = err;
      }
    }
    if (lastError) throw lastError;
    return { vendors: [], warehouse: [], products: [], dispatchmaterial: {}, dispatches: [] };
  }

  // ── 25. Update Material Dispatch Store ──
  async updateMaterialDispatch(id: string | number, payload: FormData | Record<string, any>): Promise<{ success: boolean; message: string }> {
    const isMultipart = payload instanceof FormData;
    const body = isMultipart ? payload : JSON.stringify(payload);
    const candidateUrls = [
      KARNATAKA_ADMIN_SWP_API.UPDATE_MATERIAL_DISPATCH_STORE(id),
      KARNATAKA_ADMIN_SWP_API.UPDATE_MATERIAL_DISPATCH_STORE_ALT(id),
      `${ROOT_URL}/karnataka/swp/installation/update-material-dispatch-store/${encodeURIComponent(id)}`,
      `${ROOT_URL}/admin/karnataka/swp/installation/update-material-dispatch-store/${encodeURIComponent(id)}`,
      `${BASE_URL}/update-material-dispatch-store/${encodeURIComponent(id)}`,
      `${API_ROOT}/update-material-dispatch-store/${encodeURIComponent(id)}`,
    ].filter((u, i, arr): u is string => Boolean(u) && arr.indexOf(u) === i);

    let lastError: any = null;
    for (const url of candidateUrls) {
      try {
        const res = await fetch(url, {
          method: 'POST',
          headers: this.getHeaders(isMultipart),
          body,
        });
        if (res.status === 404 || res.status === 405) {
          continue;
        }
        const text = await res.text();
        let json: any = null;
        try {
          json = JSON.parse(text);
        } catch {
          json = null;
        }
        if (res.ok && (!json || json.success || json.status)) {
          return { success: true, message: json?.message || 'Material Updated Successfully!!!' };
        }
        if (!res.ok) {
          lastError = new Error(json?.message || json?.error || `Failed to update material dispatch #${id}`);
        }
      } catch (err: any) {
        lastError = err;
      }
    }
    if (lastError) throw lastError;
    return { success: true, message: 'Material Updated Successfully!!!' };
  }
}

export const karnatakaAdminService = new KarnatakaAdminService();
export default karnatakaAdminService;
