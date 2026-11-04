import { authService } from '../../../services/authService';
import {
  VENDOR_COMMON_API,
  resolveCommonMediaUrl,
  getCommonMediaCandidates,
} from '../V_Portal_APIS/VendorCommon_API';

/**
 * Universal token getter for Vendor session
 */
export const getAuthToken = (): string | null => {
  const fromAuth = authService.getToken();
  if (fromAuth) return fromAuth;

  const session = authService.getSession();
  if (session?.token) return session.token;

  try {
    const rawLocal = localStorage.getItem('klk_user_session');
    if (rawLocal) {
      const p = JSON.parse(rawLocal);
      if (p?.token) return p.token;
    }
  } catch {}

  try {
    const rawSession = sessionStorage.getItem('klk_user_session');
    if (rawSession) {
      const p = JSON.parse(rawSession);
      if (p?.token) return p.token;
    }
  } catch {}

  return (
    localStorage.getItem('token') ||
    localStorage.getItem('access_token') ||
    localStorage.getItem('authToken') ||
    localStorage.getItem('accessToken') ||
    localStorage.getItem('klk_auth_token') ||
    sessionStorage.getItem('token') ||
    sessionStorage.getItem('access_token') ||
    sessionStorage.getItem('klk_auth_token') ||
    null
  );
};

/**
 * Common request headers generator
 */
export const getAuthHeaders = (isMultipart = false): Record<string, string> => {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    Accept: 'application/json',
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  if (!isMultipart) {
    headers['Content-Type'] = 'application/json';
  }

  return headers;
};

/* ═══════════════════════════════════════════════════════════════════════════
   TypeScript Interfaces: Reports (Vendor Progress)
   ═══════════════════════════════════════════════════════════════════════════ */

export interface VendorProgressWoItem {
  wassign_id: string;
}

export interface WorkOrderDetails {
  state: string;
  district: string;
  quantity: string | number;
}

export interface VendorProgressItem {
  id: number;
  workorder: string;
  vendor?: number | string;
  state?: string;
  district?: string;
  order_qty?: string | number;
  quantity: string | number;
  r_date?: string;
  img1?: string | null;
  img2?: string | null;
  report?: string | null;
  created_by?: number | string;
  created_at?: string;
  updated_at?: string;
  [key: string]: any;
}

export interface VendorDailyProgressData {
  sd?: string;
  td?: string;
  vd?: string;
  wo: VendorProgressItem[];
  vendor: Array<{ created_by: number | string; name?: string }>;
}

/* ═══════════════════════════════════════════════════════════════════════════
   TypeScript Interfaces: Users & Profile
   ═══════════════════════════════════════════════════════════════════════════ */

export interface VendorProfileRecord {
  id: number;
  vendor_id?: string;
  name: string;
  contact?: string;
  email?: string;
  gst?: string;
  bank?: string;
  account_no?: string;
  ifsc?: string;
  status?: number;
  category?: string;
  type?: string;
  firm?: string;
  company?: string;
  sow?: string;
  profile_photo?: string | null;
  aadhar_photo?: string | null;
  pancard_photo?: string | null;
  self_signed?: string | null;
  [key: string]: any;
}

export interface VendorProfileResponse {
  role?: string;
  state?: string;
  username?: string;
  vendor: VendorProfileRecord;
}

export interface VendorSubUserItem {
  id: number;
  parent_id?: number;
  vendor_id?: string;
  name: string;
  contact: string;
  email: string;
  register_for: 'field-work' | 'documentation' | string;
  status: number | string; // 1 = active, 0 = inactive
  created_at?: string;
  updated_at?: string;
  [key: string]: any;
}

export interface SubUserPermissionModule {
  module_name: string;
  survey: boolean;
  installation: boolean;
  amc: boolean;
  complaint: boolean;
}

export interface VendorRolePermissionsData {
  vendor: {
    id: number;
    name: string;
    parent_id?: number;
    [key: string]: any;
  };
  parent_permissions?: string | null;
  child_permissions?: string | null;
  modules?: Array<{ id: number; module_name: string }>;
}

/* ═══════════════════════════════════════════════════════════════════════════
   TypeScript Interfaces: Complaints
   ═══════════════════════════════════════════════════════════════════════════ */

export interface VendorComplaintWoItem {
  wo: string;
}

export interface VendorComplaintItem {
  id: number;
  complaint_id?: number | string;
  complaint: string;
  state?: string;
  workorder?: string;
  name?: string;
  mobile?: string;
  district?: string;
  location?: string;
  remarks?: string;
  site?: string | null;
  resolved_by?: string | null;
  image?: string | null;
  start_date?: string;
  close_date?: string | null;
  r_mobile?: string | null;
  close_sms?: string | null;
  r_email?: string | null;
  r_file?: string | null;
  assigned_to?: number | string | null;
  status: number | string; // 0 = open, 1 = closed
  created_by?: number | string;
  created_at?: string;
  updated_at?: string;
  [key: string]: any;
}

export interface VendorAssignableItem {
  id: number;
  vendor_id: string;
  name: string;
}

export interface VendorComplaintsData {
  closed_complaints: VendorComplaintItem[];
  open_complaints: VendorComplaintItem[];
  vendor: VendorAssignableItem[];
}

/* ═══════════════════════════════════════════════════════════════════════════
   Vendor Common Service Class
   ═══════════════════════════════════════════════════════════════════════════ */

class VendorCommonService {
  /**
   * Helper to parse API responses and extract JSON data or throw friendly errors
   */
  private async parseResponse<T = any>(res: Response): Promise<T> {
    const text = await res.text();
    let json: any;
    try {
      json = text ? JSON.parse(text) : {};
    } catch {
      if (!res.ok) {
        throw new Error(`Server returned HTTP ${res.status}: ${res.statusText}`);
      }
      return text as unknown as T;
    }

    if (!res.ok) {
      if (json?.errors && typeof json.errors === 'object') {
        const errorList = Object.values(json.errors).flat().join(', ');
        throw new Error(errorList || json.message || `Request failed with HTTP ${res.status}`);
      }
      throw new Error(json?.message || json?.error || `Request failed with HTTP ${res.status}`);
    }

    return json;
  }

  // ═════════════════════════════════════════════════════════════════════════
  // A. Vendor Progress Reports (VendorProgressController)
  // ═════════════════════════════════════════════════════════════════════════

  /**
   * A1. Get Work Orders list for progress report dropdown
   * GET /vendor-add-progress
   */
  async getWorkOrdersForProgress(): Promise<VendorProgressWoItem[]> {
    const res = await fetch(VENDOR_COMMON_API.REPORTS.ADD_PROGRESS_WO, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    const json = await this.parseResponse(res);
    return Array.isArray(json?.data) ? json.data : Array.isArray(json) ? json : [];
  }

  /**
   * A2. Save a progress report
   * POST /vendor-save-progress (multipart/form-data)
   */
  async saveProgressReport(formData: FormData): Promise<any> {
    const res = await fetch(VENDOR_COMMON_API.REPORTS.SAVE_PROGRESS, {
      method: 'POST',
      headers: getAuthHeaders(true),
      body: formData,
    });
    return this.parseResponse(res);
  }

  /**
   * A3. Get all progress reports created by the logged-in vendor
   * GET /vendor-view-progress
   */
  async getMyProgressReports(): Promise<VendorProgressItem[]> {
    const res = await fetch(VENDOR_COMMON_API.REPORTS.VIEW_PROGRESS, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    const json = await this.parseResponse(res);
    return Array.isArray(json?.data) ? json.data : Array.isArray(json) ? json : [];
  }

  /**
   * A4. Get progress reports by date range
   * GET /vendor-daily-view-progress?start_date=Y-m-d&till_date=Y-m-d&vendor=ID
   */
  async getDailyProgressReports(params: {
    start_date: string;
    till_date: string;
    vendor?: number | string;
  }): Promise<VendorDailyProgressData> {
    const q = new URLSearchParams();
    q.set('start_date', params.start_date);
    q.set('till_date', params.till_date);
    // The backend validation rule strictly requires 'vendor' => 'nullable|integer'.
    // Non-integer strings (e.g. username 'mohit') trigger HTTP 422 error: "The vendor field must be an integer."
    if (params.vendor !== undefined && params.vendor !== null && String(params.vendor).trim() !== '') {
      const vStr = String(params.vendor).trim();
      if (/^\d+$/.test(vStr)) {
        q.set('vendor', vStr);
      }
    }

    const url = `${VENDOR_COMMON_API.REPORTS.DAILY_PROGRESS}?${q.toString()}`;
    const res = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    const json = await this.parseResponse(res);
    const d = json?.data ?? json ?? {};
    return {
      sd: d.sd ?? params.start_date,
      td: d.td ?? params.till_date,
      vd: d.vd ?? (params.vendor ? String(params.vendor) : undefined),
      wo: Array.isArray(d.wo) ? d.wo : [],
      vendor: Array.isArray(d.vendor) ? d.vendor : [],
    };
  }

  /**
   * A5. Get state, district and quantity of a work order
   * GET /getdetails?wo=...
   */
  async getWorkOrderDetails(wo: string): Promise<WorkOrderDetails | null> {
    if (!wo) return null;
    const res = await fetch(VENDOR_COMMON_API.REPORTS.GET_WO_DETAILS(wo), {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    const json = await this.parseResponse(res);
    return json?.data ?? null;
  }

  // ═════════════════════════════════════════════════════════════════════════
  // B. Vendor Profile and Users (VendorController)
  // ═════════════════════════════════════════════════════════════════════════

  /**
   * B1. View logged-in vendor's profile
   * GET /view-vendor-ptofile
   */
  async getVendorProfile(): Promise<VendorProfileResponse | null> {
    const res = await fetch(VENDOR_COMMON_API.USERS.VIEW_PROFILE, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    const json = await this.parseResponse(res);
    return json?.data ?? json ?? null;
  }

  /**
   * B2. Update vendor profile
   * POST /update-vendor-ptofile (multipart/form-data)
   */
  async updateVendorProfile(formData: FormData): Promise<any> {
    const res = await fetch(VENDOR_COMMON_API.USERS.UPDATE_PROFILE, {
      method: 'POST',
      headers: getAuthHeaders(true),
      body: formData,
    });
    return this.parseResponse(res);
  }

  /**
   * B3. Change vendor password
   * POST /change-vendor-password
   */
  async changeVendorPassword(payload: {
    old_password: string;
    password: string;
    password_confirmation: string;
  }): Promise<any> {
    const res = await fetch(VENDOR_COMMON_API.USERS.CHANGE_PASSWORD, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    return this.parseResponse(res);
  }

  /**
   * B4. Data for add-user form
   * GET /vendor-add-user
   */
  async getAddUserData(): Promise<any> {
    const res = await fetch(VENDOR_COMMON_API.USERS.ADD_USER_DATA, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    const json = await this.parseResponse(res);
    return json?.data ?? json ?? null;
  }

  /**
   * B5. Create a sub-user (max 5 sub-users)
   * POST /vendor-save-user
   */
  async saveSubUser(payload: {
    name: string;
    contact: string;
    email: string;
    password: string;
    confirm_password: string;
    registerFor: 'field-work' | 'documentation' | string;
  }): Promise<any> {
    const res = await fetch(VENDOR_COMMON_API.USERS.SAVE_USER, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    return this.parseResponse(res);
  }

  /**
   * B6. List sub-users created by the logged-in vendor
   * GET /vendor-view-user
   */
  async getSubUsers(): Promise<VendorSubUserItem[]> {
    const res = await fetch(VENDOR_COMMON_API.USERS.VIEW_USERS, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    const json = await this.parseResponse(res);
    return Array.isArray(json?.data) ? json.data : Array.isArray(json) ? json : [];
  }

  /**
   * B7. Fetch a sub-user for edit
   * GET /vendor-edit-user/{id}
   */
  async getSubUserForEdit(id: number | string): Promise<VendorSubUserItem | null> {
    const res = await fetch(VENDOR_COMMON_API.USERS.FETCH_USER(id), {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    const json = await this.parseResponse(res);
    return json?.data ?? json ?? null;
  }

  /**
   * B8. Update a sub-user
   * POST /vendor-update-user/{id}
   */
  async updateSubUser(
    id: number | string,
    payload: {
      name: string;
      contact: string;
      registerFor: string;
      status: string | number; // "1" or "0"
    }
  ): Promise<any> {
    const res = await fetch(VENDOR_COMMON_API.USERS.UPDATE_USER(id), {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    return this.parseResponse(res);
  }

  /**
   * B9. Fetch sub-user permissions
   * GET /vendor-role-permission-user/{id}
   * Note: $id must be encrypted Laravel string, or string passed from server
   */
  async getSubUserRolePermissions(encryptedOrPlainId: string | number): Promise<VendorRolePermissionsData | null> {
    const res = await fetch(VENDOR_COMMON_API.USERS.ROLE_PERMISSIONS(String(encryptedOrPlainId)), {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    const json = await this.parseResponse(res);
    return json?.data ?? null;
  }

  /**
   * B10. Save sub-user module permissions
   * POST /vendor-save-user-permissions
   */
  async saveSubUserPermissions(payload: {
    vendor_id: number;
    permissions: SubUserPermissionModule[];
  }): Promise<any> {
    const res = await fetch(VENDOR_COMMON_API.USERS.SAVE_ROLE_PERMISSIONS, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    return this.parseResponse(res);
  }

  // ═════════════════════════════════════════════════════════════════════════
  // C. Vendor Complaints (VendorComplaintController)
  // ═════════════════════════════════════════════════════════════════════════

  /**
   * C1. Work order list for complaint form dropdown
   * GET /vendor-add-complaint
   */
  async getWorkOrdersForComplaint(): Promise<VendorComplaintWoItem[]> {
    const res = await fetch(VENDOR_COMMON_API.COMPLAINTS.ADD_COMPLAINT_WO, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    const json = await this.parseResponse(res);
    return Array.isArray(json?.data) ? json.data : Array.isArray(json) ? json : [];
  }

  /**
   * C2. Register a new complaint
   * POST /vendor-save-complaint (multipart/form-data)
   */
  async saveComplaint(formData: FormData): Promise<any> {
    const res = await fetch(VENDOR_COMMON_API.COMPLAINTS.SAVE_COMPLAINT, {
      method: 'POST',
      headers: getAuthHeaders(true),
      body: formData,
    });
    return this.parseResponse(res);
  }

  /**
   * C3. View complaints (open and closed)
   * GET /vendor-view-complaint
   */
  async getVendorComplaints(): Promise<VendorComplaintsData> {
    const res = await fetch(VENDOR_COMMON_API.COMPLAINTS.VIEW_COMPLAINTS, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    const json = await this.parseResponse(res);
    const d = json?.data ?? json ?? {};
    return {
      closed_complaints: Array.isArray(d.closed_complaints) ? d.closed_complaints : [],
      open_complaints: Array.isArray(d.open_complaints) ? d.open_complaints : [],
      vendor: Array.isArray(d.vendor) ? d.vendor : [],
    };
  }

  /**
   * C4. Fetch a complaint for close form
   * GET /vendor-edit-complaint/{id}
   */
  async getComplaintForEdit(id: number | string): Promise<VendorComplaintItem | null> {
    const res = await fetch(VENDOR_COMMON_API.COMPLAINTS.FETCH_COMPLAINT(id), {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    const json = await this.parseResponse(res);
    return json?.data ?? null;
  }

  /**
   * C5. Close a complaint
   * POST /vendor-update-complaint (multipart/form-data)
   */
  async closeComplaint(formData: FormData): Promise<any> {
    const res = await fetch(VENDOR_COMMON_API.COMPLAINTS.UPDATE_CLOSE_COMPLAINT, {
      method: 'POST',
      headers: getAuthHeaders(true),
      body: formData,
    });
    return this.parseResponse(res);
  }

  /**
   * C6. Assign a complaint to another vendor
   * POST /assignvendor-save-complaint
   */
  async assignComplaint(payload: {
    complaint_id: number;
    vendor: number;
    assign_remarks?: string;
  }): Promise<any> {
    const res = await fetch(VENDOR_COMMON_API.COMPLAINTS.ASSIGN_COMPLAINT, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    return this.parseResponse(res);
  }
}

export const vendorCommonService = new VendorCommonService();
export { resolveCommonMediaUrl, getCommonMediaCandidates };
export default vendorCommonService;
