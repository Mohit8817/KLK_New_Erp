import { API_BASE_URL, authService } from '../../../../services/authService';
import { ASSAM_ADMIN_SWP_API } from '../../Vendor_Management_APIS/Assam_Vendor_API';

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

  candidates.push(`${BACKEND_BASE}/uploads/assam/installation/swp/assign/${filename}`);
  candidates.push(`${BACKEND_BASE}/uploads/assam/installation/swp/document/${filename}`);
  candidates.push(`${BACKEND_BASE}/uploads/assam/installation/swp/payment/${filename}`);
  candidates.push(`${BACKEND_BASE}/uploads/assam/installation/swp/module/${filename}`);
  candidates.push(`${BACKEND_BASE}/uploads/assam/installation/swp/inverter_vfd/${filename}`);
  candidates.push(`${BACKEND_BASE}/uploads/assam/installation/swp/running_water/${filename}`);
  candidates.push(`${BACKEND_BASE}/uploads/assam/installation/swp/${filename}`);
  candidates.push(`${BACKEND_BASE}/uploads/assam/installation/${filename}`);
  candidates.push(`${BACKEND_BASE}/uploads/${filename}`);
  candidates.push(`${BACKEND_BASE}/${normalized}`);

  if (R2_BASE) {
    candidates.push(`${R2_BASE}/uploads/assam/installation/swp/document/${filename}`);
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

export interface VendorItem {
  id: number;
  name: string;
  state?: string;
  company_id?: number;
  email?: string;
  phone?: string;
  [key: string]: any;
}

export interface VolumeItem {
  volume: string;
}

export interface DistrictItem {
  district: string;
}

export interface FarmerSiteItem {
  id: number;
  farmer_name: string;
  father_name?: string;
  district: string;
  volume?: string | number;
  block?: string;
  village?: string;
  contact_no?: string;
  customer_no?: string;
  pump_capacity?: string;
  pump_type?: string;
  inst_vendor?: number;
  inst_status?: number;
  inst_accept?: number;
  [key: string]: any;
}

export interface AssignRecord {
  id: number;
  company_id?: number;
  project?: string;
  purpose?: string;
  state?: string;
  vendor: number;
  volume: number | string;
  district: string;
  site_id: string | number[];
  site_count: number;
  deadline_date: string;
  status: number; // 0 = Pending Admin Approval, 1 = Approved / Dispatched to Vendor
  created_by?: number;
  created_at?: string;
  file?: string | null;
  remarks?: string;
  vendors?: {
    id: number;
    name: string;
    [key: string]: any;
  };
  site_details?: Array<{
    id: number;
    father_name?: string;
    farmer_name?: string;
    district?: string;
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
  company_id?: string | number;
  uid?: string;
  volume?: string | number;
  state?: string;
  wo_status?: number;
  wo_no?: string;
  wo_date?: string;
  district: string;
  tehsil?: string;
  block?: string;
  post?: string | null;
  village?: string | null;
  pin?: string | null;
  phase?: string;
  customer_no?: string | null;
  farmer_name: string;
  gender?: string | null;
  farmer_contact?: string | null;
  aadhar?: string | null;
  father_name?: string | null;
  pump_capacity?: string | null;
  pump_type?: string | null;
  pump_sub_type?: string | null;
  water_depth_level?: string | null;
  material_supply?: number;
  jcr_status?: number;
  beneficiary_share?: string | null;
  pay90_status?: number;
  pay10_status?: number;
  survey_status?: number;
  survey_date?: string | null;
  feasible_status?: number;
  feasible_date?: string | null;
  scada_upload?: number;
  inst_vendor?: number;
  inst_deadline?: string;
  inst_assigned_by?: string | number;
  inst_assign_date?: string;
  inst_assigned_id?: number;
  inst_accept?: number;
  inst_status?: number;
  inst_date?: string;
  inverter_no?: string;
  vfd_no?: string;
  module_serial_no?: string | string[];
  longitude?: string;
  latitude?: string;
  module_image?: string;
  inverter_vfd_image?: string;
  running_water_image?: string;
  inst_remarks?: string | null;
  inst_verify_status?: number | string; // 0 = Pending, 1 = Approved, 2 = Rejected
  inst_verify_by?: string | number | null;
  inst_verify_date?: string | null;
  inst_verify_remarks?: string | null;
  inst_doc?: string | null;
  inst_doc_status?: number | string;
  inst_doc_date?: string | null;
  inst_doc_remarks?: string | null;
  inst_doc_verify_by?: string | number | null;
  inst_doc_verify_date?: string | null;
  inst_doc_verify_remarks?: string | null;
  inst_claim_status?: number;
  inst_pay_status?: number;
  created_by?: number;
  created_at?: string;
  updated_at?: string;
  // Legacy & fallbacks
  motor_no?: string;
  controller_no?: string;
  panel_serials?: string;
  farmer_with_module?: string;
  inverter_vfd_with_farmer?: string;
  running_water_with_farmer?: string;
  vendors?: {
    id: number;
    name: string;
    [key: string]: any;
  };
  [key: string]: any;
}

export interface ClaimItem {
  id: number;
  company_id?: number;
  state?: string;
  project?: string;
  type?: string;
  vendor_id: number;
  amount: string | number;
  site_id?: string | number[];
  claim_status: number; // 1 = Raised, 2 = Approved, 3 = Rejected
  pay_status: number; // 0 = Pending, 1 = Full, 2 = Partial
  file?: string | null;
  remarks?: string;
  created_at?: string;
  approved_by?: number;
  approved_date?: string;
  approved_remarks?: string;
  vendors?: {
    id: number;
    name: string;
  };
  [key: string]: any;
}

export interface PaymentItem {
  id: number;
  vendor_id: number;
  amount: string | number;
  claim_status: number;
  pay_status: number;
  file?: string | null;
  remarks?: string;
  date?: string;
  utr_no?: string;
  vendors?: {
    id: number;
    name: string;
  };
  [key: string]: any;
}

export interface PaymentDetailSummary {
  total: number;
  complete: number;
  partially: number;
  pending: number;
}

export interface AdminApiResponse<T = any> {
  status?: boolean;
  success?: boolean;
  message?: string;
  data?: T;
  errors?: Record<string, string[]>;
  error?: string;
}

/* ═══════════════════ Service Class ═══════════════════ */

class AssamAdminService {
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

  private async fetchWithFallback(url: string, options: RequestInit = {}): Promise<Response> {
    const res = await fetch(url, options);
    return res;
  }

  // ── A. Assign Installation ──

  /**
   * 1. GET /assam/swp/installation/assign
   * Vendors & volumes for assignment form
   */
  async getAssignFormData(): Promise<{ vendors: VendorItem[]; volumes: VolumeItem[] }> {
    const res = await this.fetchWithFallback(ASSAM_ADMIN_SWP_API.ASSIGN_FORM_DATA, {
      method: 'GET',
      headers: this.getHeaders(),
    });
    const json: AdminApiResponse<{ vendors: VendorItem[]; volumes: VolumeItem[] }> = await res.json();
    if (!res.ok && !json.status && !json.success) {
      throw new Error(json.message || `Failed to fetch assign form data (${res.status})`);
    }
    const data = json.data || (json as any);
    return {
      vendors: Array.isArray(data?.vendors) ? data.vendors : [],
      volumes: Array.isArray(data?.volumes) ? data.volumes : [],
    };
  }

  /**
   * 2. GET /assam/swp/installation/fetch-district?volume=1
   */
  async fetchDistricts(volume: string | number): Promise<DistrictItem[]> {
    const res = await this.fetchWithFallback(ASSAM_ADMIN_SWP_API.FETCH_DISTRICTS(volume), {
      method: 'GET',
      headers: this.getHeaders(),
    });
    const json: AdminApiResponse<DistrictItem[]> = await res.json();
    if (!res.ok && !json.status && !json.success) {
      throw new Error(json.message || `Failed to fetch districts (${res.status})`);
    }
    const data = json.data || (json as any);
    return Array.isArray(data) ? data : [];
  }

  /**
   * 3. GET /assam/swp/installation/fetch-farmer?district=Kamrup
   */
  async fetchFarmers(district: string): Promise<FarmerSiteItem[]> {
    const res = await this.fetchWithFallback(ASSAM_ADMIN_SWP_API.FETCH_FARMERS(district), {
      method: 'GET',
      headers: this.getHeaders(),
    });
    const json: AdminApiResponse<FarmerSiteItem[]> = await res.json();
    if (!res.ok && !json.status && !json.success) {
      throw new Error(json.message || `Failed to fetch farmers for district "${district}" (${res.status})`);
    }
    const data = json.data || (json as any);
    return Array.isArray(data) ? data : [];
  }

  /**
   * 4. POST /assam/swp/installation/store-assign
   * Form fields: vendor, volume, district, site[], deadline_date, file (optional), remarks (optional)
   */
  async storeAssign(formData: FormData): Promise<AdminApiResponse> {
    const res = await this.fetchWithFallback(ASSAM_ADMIN_SWP_API.STORE_ASSIGN, {
      method: 'POST',
      headers: this.getHeaders(true),
      body: formData,
    });
    const json: AdminApiResponse = await res.json();
    if (!res.ok && !json.status && !json.success) {
      const errDetail = json.errors ? Object.values(json.errors).flat().join(', ') : json.message;
      throw new Error(errDetail || `Failed to store assignment (${res.status})`);
    }
    return json;
  }

  /**
   * 5. GET /assam/swp/installation/view-assign
   */
  async getViewAssign(): Promise<{ assigns: AssignRecord[]; details: AssignDetailsSummary }> {
    const res = await this.fetchWithFallback(ASSAM_ADMIN_SWP_API.VIEW_ASSIGN, {
      method: 'GET',
      headers: this.getHeaders(),
    });
    const json: AdminApiResponse<{ assigns: AssignRecord[]; details: AssignDetailsSummary }> = await res.json();
    if (!res.ok && !json.status && !json.success) {
      throw new Error(json.message || `Failed to fetch assignments list (${res.status})`);
    }
    const data = json.data || (json as any);
    const assigns = Array.isArray(data?.assigns) ? data.assigns : [];
    const details = data?.details || {
      total: assigns.length,
      assigned: assigns.length,
      not_assigned: 0,
      complete: 0,
      pending: assigns.length,
      verify_approved: 0,
      verify_pending: 0,
      verify_reject: 0,
    };
    return { assigns, details };
  }

  /**
   * 6. POST /assam/swp/installation/approvel-assign/{id}
   */
  async approveAssign(id: string | number): Promise<AdminApiResponse> {
    let res = await this.fetchWithFallback(ASSAM_ADMIN_SWP_API.APPROVE_ASSIGN(id), {
      method: 'POST',
      headers: this.getHeaders(),
    });
    if ((res.status === 404 || res.status === 405) && (ASSAM_ADMIN_SWP_API as any).APPROVE_ASSIGN_LEGACY) {
      res = await this.fetchWithFallback((ASSAM_ADMIN_SWP_API as any).APPROVE_ASSIGN_LEGACY(id), {
        method: 'POST',
        headers: this.getHeaders(),
      });
    }
    const json: AdminApiResponse = await res.json();
    if (!res.ok && !json.status && !json.success) {
      throw new Error(json.message || `Failed to approve assignment #${id} (${res.status})`);
    }
    return json;
  }

  /**
   * 7. GET /assam/swp/installation/edit-assign/{id}
   */
  async getEditAssign(id: string | number): Promise<{
    assign: AssignRecord;
    vendors: VendorItem[];
    volumes: VolumeItem[];
    districts: DistrictItem[];
    sites: FarmerSiteItem[];
  }> {
    const res = await this.fetchWithFallback(ASSAM_ADMIN_SWP_API.EDIT_ASSIGN(id), {
      method: 'GET',
      headers: this.getHeaders(),
    });
    const json: AdminApiResponse<any> = await res.json();
    if (!res.ok && !json.status && !json.success) {
      throw new Error(json.message || `Failed to load edit data for assign #${id} (${res.status})`);
    }
    const data = json.data || (json as any);
    return {
      assign: data.assign,
      vendors: Array.isArray(data.vendors) ? data.vendors : [],
      volumes: Array.isArray(data.volumes) ? data.volumes : [],
      districts: Array.isArray(data.districts) ? data.districts : [],
      sites: Array.isArray(data.sites) ? data.sites : [],
    };
  }

  /**
   * 8. PUT /assam/swp/installation/update-assign/{id}
   * Uses POST with _method: 'PUT' for multipart/form-data
   */
  async updateAssign(id: string | number, formData: FormData): Promise<AdminApiResponse> {
    if (!formData.has('_method')) {
      formData.append('_method', 'PUT');
    }
    const res = await this.fetchWithFallback(ASSAM_ADMIN_SWP_API.UPDATE_ASSIGN(id), {
      method: 'POST',
      headers: this.getHeaders(true),
      body: formData,
    });
    const json: AdminApiResponse = await res.json();
    if (!res.ok && !json.status && !json.success) {
      const errDetail = json.errors ? Object.values(json.errors).flat().join(', ') : json.message;
      throw new Error(errDetail || `Failed to update assignment #${id} (${res.status})`);
    }
    return json;
  }

  // ── B. Installation Verify ──

  /**
   * 9. GET /assam/swp/installation/view-installation
   */
  async getViewInstallation(): Promise<{
    detail: any;
    verify_pending: SiteInstallationItem[];
    verify_complete: SiteInstallationItem[];
  }> {
    const res = await this.fetchWithFallback(ASSAM_ADMIN_SWP_API.VIEW_INSTALLATION, {
      method: 'GET',
      headers: this.getHeaders(),
    });
    const json: AdminApiResponse<any> = await res.json();
    if (!res.ok && !json.status && !json.success) {
      throw new Error(json.message || `Failed to fetch installation verification list (${res.status})`);
    }
    const data = json.data || (json as any);
    return {
      detail: data?.detail || {},
      verify_pending: Array.isArray(data?.verify_pending) ? data.verify_pending : [],
      verify_complete: Array.isArray(data?.verify_complete) ? data.verify_complete : [],
    };
  }

  /**
   * 10. POST /assam/swp/installation/verify-installation-status
   * status: 0 = Pending, 1 = Approved, 2 = Rejected
   */
  async verifyInstallationStatus(payload: {
    id: number | string;
    status: number;
    inst_verify_remarks?: string;
  }): Promise<AdminApiResponse> {
    const res = await this.fetchWithFallback(ASSAM_ADMIN_SWP_API.VERIFY_INSTALLATION_STATUS, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(payload),
    });
    const json: AdminApiResponse = await res.json();
    if (!res.ok && !json.status && !json.success) {
      throw new Error(json.message || `Failed to update installation verification status (${res.status})`);
    }
    return json;
  }

  /**
   * 11. GET /assam/swp/installation/view-installation-document
   */
  async getViewInstallationDocument(): Promise<{
    detail: any;
    verification: SiteInstallationItem[];
    verified: SiteInstallationItem[];
  }> {
    const res = await this.fetchWithFallback(ASSAM_ADMIN_SWP_API.VIEW_INSTALLATION_DOCUMENT, {
      method: 'GET',
      headers: this.getHeaders(),
    });
    const json: AdminApiResponse<any> = await res.json();
    if (!res.ok && !json.status && !json.success) {
      throw new Error(json.message || `Failed to fetch installation document verification list (${res.status})`);
    }
    const data = json.data || (json as any);
    return {
      detail: data?.detail || {},
      verification: Array.isArray(data?.verification) ? data.verification : [],
      verified: Array.isArray(data?.verified) ? data.verified : [],
    };
  }

  /**
   * 12. POST /assam/swp/installation/verify-installation-doc-status
   * status: 1 = Pending, 2 = Approved, 3 = Rejected
   */
  async verifyInstallationDocStatus(payload: {
    id: number | string;
    status: number;
    remarks?: string;
  }): Promise<AdminApiResponse> {
    const res = await this.fetchWithFallback(ASSAM_ADMIN_SWP_API.VERIFY_INSTALLATION_DOC_STATUS, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(payload),
    });
    const json: AdminApiResponse = await res.json();
    if (!res.ok && !json.status && !json.success) {
      throw new Error(json.message || `Failed to update document verification status (${res.status})`);
    }
    return json;
  }

  // ── C. Claim & Payment ──

  /**
   * 13. GET /assam/swp/installation/view-claim
   */
  async getViewClaim(): Promise<ClaimItem[]> {
    const res = await this.fetchWithFallback(ASSAM_ADMIN_SWP_API.VIEW_CLAIM, {
      method: 'GET',
      headers: this.getHeaders(),
    });
    const json: AdminApiResponse<ClaimItem[]> = await res.json();
    if (!res.ok && !json.status && !json.success) {
      throw new Error(json.message || `Failed to fetch claims (${res.status})`);
    }
    const data = json.data || (json as any);
    return Array.isArray(data) ? data : [];
  }

  /**
   * 14. POST /assam/swp/installation/approvel-claim
   * status: 1 = Raised, 2 = Approved, 3 = Rejected
   */
  async approveClaim(payload: {
    id: number | string;
    status: number;
    remarks?: string;
  }): Promise<AdminApiResponse> {
    let res = await this.fetchWithFallback(ASSAM_ADMIN_SWP_API.APPROVE_CLAIM, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(payload),
    });
    if ((res.status === 404 || res.status === 405) && (ASSAM_ADMIN_SWP_API as any).APPROVE_CLAIM_LEGACY) {
      res = await this.fetchWithFallback((ASSAM_ADMIN_SWP_API as any).APPROVE_CLAIM_LEGACY, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(payload),
      });
    }
    const json: AdminApiResponse = await res.json();
    if (!res.ok && !json.status && !json.success) {
      throw new Error(json.message || `Failed to update claim status (${res.status})`);
    }
    return json;
  }

  /**
   * 15. GET /assam/swp/installation/payment-view
   */
  async getPaymentView(params?: {
    from_date?: string;
    to_date?: string;
    vendor?: string | number;
    status?: string | number;
  }): Promise<{
    payments: PaymentItem[];
    payment_detail: PaymentDetailSummary;
    vendors: Array<{ id: number; name: string }>;
  }> {
    const url = ASSAM_ADMIN_SWP_API.PAYMENT_VIEW(params);
    const res = await this.fetchWithFallback(url, {
      method: 'GET',
      headers: this.getHeaders(),
    });
    const json: AdminApiResponse<any> = await res.json();
    if (!res.ok && !json.status && !json.success) {
      throw new Error(json.message || `Failed to fetch payment view data (${res.status})`);
    }
    const data = json.data || (json as any);
    return {
      payments: Array.isArray(data?.payments) ? data.payments : [],
      payment_detail: data?.payment_detail || { total: 0, complete: 0, partially: 0, pending: 0 },
      vendors: Array.isArray(data?.vendors) ? data.vendors : [],
    };
  }

  /**
   * 16. POST /assam/swp/installation/payment-update
   * payload: id, amount, date, remarks
   */
  async paymentUpdate(payload: {
    id: number | string;
    amount: number;
    date: string;
    remarks?: string;
  }): Promise<AdminApiResponse> {
    const res = await this.fetchWithFallback(ASSAM_ADMIN_SWP_API.PAYMENT_UPDATE, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(payload),
    });
    const json: AdminApiResponse = await res.json();
    if (!res.ok && !json.status && !json.success) {
      throw new Error(json.message || `Failed to update payment disbursement (${res.status})`);
    }
    return json;
  }

  async updatePayment(payload: {
    id: number | string;
    amount: number;
    date: string;
    remarks?: string;
  }): Promise<AdminApiResponse> {
    return this.paymentUpdate(payload);
  }

  // ── D. Dashboard & Drilldowns ──

  /**
   * 17. GET /assam/swp/installation/dashboard
   */
  async getDashboard(): Promise<any> {
    const res = await this.fetchWithFallback(ASSAM_ADMIN_SWP_API.DASHBOARD, {
      method: 'GET',
      headers: this.getHeaders(),
    });
    const json: AdminApiResponse<any> = await res.json();
    if (!res.ok && !json.status && !json.success) {
      throw new Error(json.message || `Failed to fetch admin dashboard (${res.status})`);
    }
    return json.data || (json as any);
  }

  /**
   * 18. GET /assam/swp/installation/dashboard-view-data/{status}
   */
  async getDashboardViewData(status: string): Promise<any[]> {
    const res = await this.fetchWithFallback(ASSAM_ADMIN_SWP_API.DASHBOARD_VIEW_DATA(status), {
      method: 'GET',
      headers: this.getHeaders(),
    });
    const json: AdminApiResponse<any> = await res.json();
    if (!res.ok && !json.status && !json.success) {
      throw new Error(json.message || `Failed to fetch view data for status "${status}" (${res.status})`);
    }
    const data = json.data || (json as any);
    return Array.isArray(data?.installations) ? data.installations : [];
  }

  /**
   * 19. GET /assam/swp/installation/vendor-wise-view-data/{status}/{vendor}
   */
  async getVendorWiseViewData(status: string, vendor: string | number): Promise<any[]> {
    const res = await this.fetchWithFallback(ASSAM_ADMIN_SWP_API.VENDOR_WISE_VIEW_DATA(status, vendor), {
      method: 'GET',
      headers: this.getHeaders(),
    });
    const json: AdminApiResponse<any> = await res.json();
    if (!res.ok && !json.status && !json.success) {
      throw new Error(json.message || `Failed to fetch vendor-wise data (${res.status})`);
    }
    const data = json.data || (json as any);
    return Array.isArray(data?.installations) ? data.installations : [];
  }

  /**
   * 20. GET /assam/swp/installation/district-wise-view-data/{status}/{district}
   */
  async getDistrictWiseViewData(status: string, district: string): Promise<any[]> {
    const res = await this.fetchWithFallback(ASSAM_ADMIN_SWP_API.DISTRICT_WISE_VIEW_DATA(status, district), {
      method: 'GET',
      headers: this.getHeaders(),
    });
    const json: AdminApiResponse<any> = await res.json();
    if (!res.ok && !json.status && !json.success) {
      throw new Error(json.message || `Failed to fetch district-wise data (${res.status})`);
    }
    const data = json.data || (json as any);
    return Array.isArray(data?.installations) ? data.installations : [];
  }
}

export const assamAdminService = new AssamAdminService();
export default assamAdminService;
