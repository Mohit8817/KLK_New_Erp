import { API_BASE_URL, authService } from '../../../../services/authService';
import { KASHMIR_ADMIN_SRT_API } from '../../Vendor_Management_APIS/Kashmir_Vendor_API';

/* ── Backend & Media Base URLs ── */
export const BACKEND_BASE = (API_BASE_URL || 'https://klkerp.com/api')
  .replace(/\/api\/?$/, '')
  .replace(/\/+$/, '');

export const R2_BASE = ((import.meta.env.VITE_R2_PUBLIC_URL as string | undefined) ?? '').replace(/\/+$/, '');

export function getKashmirMediaCandidates(path?: string | null): string[] {
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

  candidates.push(`${BACKEND_BASE}/uploads/kashmir/installation/srt/assignsite/${filename}`);
  candidates.push(`${BACKEND_BASE}/uploads/kashmir/installation/srt/${filename}`);
  candidates.push(`${BACKEND_BASE}/uploads/kashmir/installation/${filename}`);
  candidates.push(`${BACKEND_BASE}/uploads/kashmir/expenses/${filename}`);
  candidates.push(`${BACKEND_BASE}/uploads/kashmir/${filename}`);
  candidates.push(`${BACKEND_BASE}/uploads/${filename}`);
  candidates.push(`${BACKEND_BASE}/${normalized}`);

  if (R2_BASE) {
    candidates.push(`${R2_BASE}/uploads/kashmir/installation/${filename}`);
    candidates.push(`${R2_BASE}/kashmir_srt/${filename}`);
    candidates.push(`${R2_BASE}/${filename}`);
  }

  return Array.from(new Set(candidates));
}

export function resolveKashmirMediaUrl(path?: string | null): string {
  if (!path) return '';
  if (/^(https?:|data:|blob:)/i.test(path)) return path;
  const candidates = getKashmirMediaCandidates(path);
  return candidates[0] || `${BACKEND_BASE}/${path.replace(/^\/+/, '')}`;
}

export function calculateSrtDeadlineDays(load?: number | string | null): number {
  const l = Number(load ?? 0);
  if (l >= 101) return 21;
  if (l >= 21) return 14;
  return 7;
}

/* ── Type Definitions ── */
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

export interface DistrictItem {
  id?: number;
  district: string;
  state?: string;
  [key: string]: any;
}

export interface SiteItem {
  id: number;
  site_name: string;
  site_code?: string;
  district?: string;
  sanction_load?: number | string;
  contact_person?: string;
  contact_number?: string;
  [key: string]: any;
}

export interface AssignFormDataResponse {
  success: boolean;
  message?: string;
  vendors: VendorItem[];
}

export interface AssignRecord {
  id: number;
  vendor: number | string;
  assign_date?: string;
  created_at?: string;
  state?: string;
  district: string;
  site_name: Record<string, string> | string[] | string;
  sitecount?: number;
  file?: string | null;
  remarks?: string | null;
  status: number; // 0 pending, 1 approved, 2 accepted
  vendors?: {
    id: number;
    name: string;
  };
  vendor_name?: string;
  [key: string]: any;
}

export interface ViewAssignResponse {
  success?: boolean;
  message?: string;
  data: {
    loginId?: number;
    loginName?: string;
    company_id?: number;
    role?: string;
    state?: string;
    amcsrtRecords: AssignRecord[];
    claimedapplicable: number;
    approvedsite: number;
    verifypending: number;
    rejectsite: number;
    paymentsitecount: number;
    payment80: number;
    payment20: number;
    docsubmit: number;
    claimraised: number;
    complete: number;
    totalsite: number;
    pendingsite: number;
    [key: string]: any;
  };
}

export interface InstallationVerificationItem {
  id: number;
  inst_vendor?: number;
  vendor_name?: string;
  state?: string;
  district: string;
  site_name: string;
  contact_person?: string;
  contact_number?: string;
  solarmeter_no?: string;
  inverter_no?: string;
  nm_sm_no?: string;
  panel_no?: string[] | string;
  loger_no?: string;
  system_image?: string | null;
  inverter_image?: string | null;
  panel_image?: string | null;
  nm_sm_image?: string | null;
  loger_image?: string | null;
  inst_latitude?: string | number;
  inst_longitude?: string | number;
  inst_remarks?: string | null;
  inst_verify_file?: string | null;
  inst_verify_remark?: string | null;
  inst_verify_status?: number; // 0 pending, 1 approved, 2 rejected
  [key: string]: any;
}

export interface ViewInstallationResponse {
  status?: boolean;
  success?: boolean;
  message?: string;
  data: {
    claimedapplicable: number;
    approvedsite: number;
    verifypending: number;
    rejectsite: number;
    paymentsitecount: number;
    payment80: number;
    payment20: number;
    docsubmit: number;
    claimraised: number;
    complete: number;
    totalsite: number;
    pendingsite: number;
    verification: InstallationVerificationItem[];
    verified: InstallationVerificationItem[];
    [key: string]: any;
  };
}

export interface ClaimRecord {
  id: number;
  state?: string;
  district: string;
  site_name: string;
  inst_claim_date?: string;
  inst_claim_invoice?: string | null;
  inst_claim_amount?: string | number;
  inst_claim_update_date?: string | null;
  inst_claim_update_by?: string | null;
  inst_claim_status: number; // 0 not raised, 1 pending, 2 approved, 3 rejected
  inst_doc_submit: number; // 0 not submitted, 1 submitted, 2 approved, 3 rejected
  [key: string]: any;
}

export interface ViewClaimResponse {
  success?: boolean;
  message?: string;
  total?: number;
  data: ClaimRecord[];
}

export interface Payment80Item {
  id: number;
  vendor_name?: string;
  vendor?: string | number;
  site_name: string;
  state?: string;
  district?: string;
  inst_claim_date?: string;
  inst_claim_invoice?: string | null;
  inst_claim_amount?: string | number;
  inst_claim_update_date?: string | null;
  inst_claim_update_by?: string | null;
  inst_claim_status?: number;
  inst_pay80?: string | number | null;
  inst_pay80_date?: string | null;
  inst_pay80_remark?: string | null;
  inst_pay80_status: number; // 0 pending, 1 done
  [key: string]: any;
}

export interface Payment20Item {
  id: number;
  vendor_name?: string;
  vendor?: string | number;
  site_name: string;
  state?: string;
  district?: string;
  inst_claim_date?: string;
  inst_claim_invoice?: string | null;
  inst_claim_amount?: string | number;
  inst_claim_update_date?: string | null;
  inst_claim_update_by?: string | null;
  inst_doc_submit?: number;
  inst_pay20?: string | number | null;
  inst_pay20_date?: string | null;
  inst_pay20_remark?: string | null;
  inst_pay20_status: number; // 0 pending, 1 done
  [key: string]: any;
}

export interface ViewPaymentResponse {
  success?: boolean;
  message?: string;
  data: {
    vendors: VendorItem[];
    paymentrequests: any[];
    kashmir_srt70mw_pay_pending1: number;
    kashmir_srt70mw_pay_pending2: number;
    total_kashmir_srt70mw_pay_pending: number;
    kashmir_srt70mw_pay_done1: number;
    kashmir_srt70mw_pay_done2: number;
    total_kashmir_srt70mw_pay_done: number;
    payments80: Payment80Item[];
    payments20: Payment20Item[];
    [key: string]: any;
  };
}

export interface DashboardResponse {
  success: boolean;
  data: {
    loginId?: number;
    loginName?: string;
    company_id?: number;
    role?: string;
    state?: string;
    kashmir_srt70mws: {
      site_count: number;
      material_dispatch: number;
      material_pending: number;
      site_assigned: number;
      site_not_assigned: number;
      complete: number;
      pending: number;
      verify_pending: number;
      verify_approved: number;
      verify_reject: number;
      claim_applicable: number;
      claim_raised: number;
      inst_doc_complete: number;
      inst_doc_pending: number;
      inst_pay80_complete: number;
      inst_pay20_complete: number;
      inst_pay80_pending: number;
      inst_pay20_pending: number;
      inst_pay80_amount: string | number;
      inst_pay20_amount: string | number;
      [key: string]: any;
    };
    vendors: Array<{ inst_vendor: number; vendor: number; name: string }>;
    vendorswise: Array<{
      inst_vendor: number;
      site_count: number;
      material_dispatch: number;
      material_pending: number;
      inst_complete: number;
      inst_pending: number;
      verify_pending: number;
      verify_approved: number;
      verify_reject: number;
      inst_pay80_complete: number;
      inst_pay20_complete: number;
      inst_pay80_pending: number;
      inst_pay20_pending: number;
      [key: string]: any;
    }>;
    districtwise: Array<{
      district: string;
      site_count: number;
      material_dispatch: number;
      material_pending: number;
      total_assigned: number;
      inst_complete: number;
      inst_pending: number;
      verify_pending: number;
      verify_approved: number;
      verify_reject: number;
      inst_pay80_complete: number;
      inst_pay20_complete: number;
      inst_pay80_pending: number;
      inst_pay20_pending: number;
      [key: string]: any;
    }>;
    vendor_installation_month: Array<{ month_year: string; monthly_installations: number }>;
    vendor_today_installation: Array<{ inst_vendor: number; today_install: number }>;
    [key: string]: any;
  };
}

export interface ExpenseClaimItem {
  id: number;
  state: string;
  vendor_id: number;
  vendor_name: string;
  date: string;
  district: string;
  site_id?: number;
  site_name: string;
  site_code?: string;
  purpose: string;
  file?: string | null;
  amount: number | string;
  approved_date?: string | null;
  claim_status: number; // 1 pending, 2 approved, 3 rejected
  approved_remarks?: string | null;
  claim_count?: number;
  [key: string]: any;
}

export interface ViewExpensesResponse {
  success: boolean;
  message?: string;
  data: {
    claims: ExpenseClaimItem[];
    claim_details: {
      total: number;
      claim_approved: number;
      claim_pending: number;
      claim_reject: number;
    };
  };
}

export interface ExpensePaymentSubItem {
  id: number;
  claim_id: number;
  amount: number | string;
  balance: number | string;
  date: string;
  pay_remarks?: string | null;
  [key: string]: any;
}

export interface ExpensePaymentItem {
  id: number;
  date: string;
  vendor_id?: number;
  vendor_name: string;
  district: string;
  site_id?: number;
  site_name: string;
  site_code?: string;
  purpose: string;
  file?: string | null;
  amount: number | string;
  remarks?: string | null;
  pay_status: number; // 0 pending, 1 done, 2 partial
  allpayment?: ExpensePaymentSubItem[];
  [key: string]: any;
}

export interface ViewExpensesPaymentResponse {
  success: boolean;
  message?: string;
  data: {
    payments: ExpensePaymentItem[];
    payment_detail: {
      total: number;
      complete: number;
      partially: number;
      pending: number;
    };
  };
}

/* ── HTTP Client Helpers ── */
async function fetchWithCandidateUrls(
  urls: string[],
  options: RequestInit = {}
): Promise<any> {
  const token = authService.getToken();
  const isSyntheticDummy =
    !token ||
    token.startsWith('klk_user_session_token_') ||
    token.startsWith('klk_vendor_session_token_');

  const baseHeaders: Record<string, string> = {
    Accept: 'application/json',
  };
  if (token && !isSyntheticDummy) {
    baseHeaders.Authorization = `Bearer ${token}`;
  }

  // Include XSRF-TOKEN if present in document cookies for Laravel Sanctum SPA
  if (typeof document !== 'undefined') {
    const xsrfCookie = document.cookie
      .split(';')
      .map((c) => c.trim())
      .find((c) => c.startsWith('XSRF-TOKEN='));
    if (xsrfCookie) {
      const xsrfVal = decodeURIComponent(xsrfCookie.split('=')[1] || '');
      if (xsrfVal) {
        baseHeaders['X-XSRF-TOKEN'] = xsrfVal;
      }
    }
  }

  // Merge headers
  const isFormData = options.body instanceof FormData;
  const headers: Record<string, string> = isFormData
    ? { ...baseHeaders, ...(options.headers as Record<string, string> || {}) }
    : { ...baseHeaders, 'Content-Type': 'application/json', ...(options.headers as Record<string, string> || {}) };

  const isPost = (options.method || 'GET').toUpperCase() === 'POST';
  let lastError: any = null;

  for (const url of urls) {
    // Prevent sending POST to known non-admin GET-only routes that cause 405 Method Not Allowed
    const isNonAdminGetRoute = !url.includes('/admin/') && /kashmir\/srt70mw\/installation\/(claim-status-update|verify-doc-status|verify-installation-status)/i.test(url);
    if (isPost && isNonAdminGetRoute) {
      continue;
    }

    try {
      const response = await fetch(url, {
        credentials: 'include',
        ...options,
        headers,
      });

      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const json = await response.json();
        if (response.ok) {
          return json;
        }

        // If 405 Method Not Allowed (fallback to GET with query params)
        if (response.status === 405 && isPost) {
          let queryParams = '';
          if (options.body instanceof FormData) {
            const q = new URLSearchParams();
            options.body.forEach((val, key) => {
              if (typeof val === 'string') q.append(key, val);
            });
            queryParams = q.toString();
          } else if (typeof options.body === 'string') {
            try {
              const parsed = JSON.parse(options.body);
              if (parsed && typeof parsed === 'object') {
                const q = new URLSearchParams();
                Object.entries(parsed).forEach(([k, v]) => {
                  if (v !== undefined && v !== null) q.append(k, String(v));
                });
                queryParams = q.toString();
              }
            } catch {}
          }

          const getUrl = queryParams ? `${url}${url.includes('?') ? '&' : '?'}${queryParams}` : url;
          try {
            const getRes = await fetch(getUrl, {
              method: 'GET',
              credentials: 'include',
              headers: baseHeaders,
            });

            const getContentType = getRes.headers.get('content-type') || '';
            if (getContentType.includes('application/json')) {
              const getJson = await getRes.json();
              if (getRes.ok) {
                return getJson;
              }
            }
          } catch {
            // ignore, let standard error processing continue
          }
        }

        // If 422 validation error
        if (response.status === 422) {
          const err: any = new Error(json.message || 'Validation error');
          err.errors = json.errors;
          err.status = 422;
          throw err;
        }

        // If 401 unauthenticated on an admin route
        if (response.status === 401) {
          const err: any = new Error(json.message || 'Unauthorized: Please check your login session.');
          err.status = 401;
          throw err;
        }

        // 404 or other known error
        if (json.message || json.error) {
          const err: any = new Error(json.message || json.error);
          err.status = response.status;
          throw err;
        }
      }

      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }

      return await response.json();
    } catch (err: any) {
      lastError = err;
      // Don't retry if it's a validation error or unauthorized on admin route
      if (err.status === 422 || (err.status === 401 && url.includes('/admin/'))) {
        throw err;
      }
    }
  }

  throw lastError || new Error('Network request failed');
}

/* ── Service Object ── */
export const kashmirAdminService = {
  // 1. GET /assign
  async getAssignFormData(): Promise<AssignFormDataResponse> {
    const urls = [
      KASHMIR_ADMIN_SRT_API.ASSIGN_FORM_DATA,
      KASHMIR_ADMIN_SRT_API.ASSIGN_FORM_DATA_ALT,
      KASHMIR_ADMIN_SRT_API.ASSIGN_FORM_DATA_DIRECT,
    ];
    return fetchWithCandidateUrls(urls, { method: 'GET' });
  },

  // 2. GET /fetch-district
  async fetchDistricts(): Promise<DistrictItem[]> {
    const urls = [
      KASHMIR_ADMIN_SRT_API.FETCH_DISTRICTS,
      KASHMIR_ADMIN_SRT_API.FETCH_DISTRICTS_ALT,
      KASHMIR_ADMIN_SRT_API.FETCH_DISTRICTS_DIRECT,
    ];
    const res = await fetchWithCandidateUrls(urls, { method: 'GET' });
    return res?.districts || [];
  },

  // 3. GET /fetch-site?district=...
  async fetchSites(district: string): Promise<SiteItem[]> {
    const urls = [
      KASHMIR_ADMIN_SRT_API.FETCH_SITES(district),
      KASHMIR_ADMIN_SRT_API.FETCH_SITES_ALT(district),
      KASHMIR_ADMIN_SRT_API.FETCH_SITES_DIRECT(district),
    ];
    const res = await fetchWithCandidateUrls(urls, { method: 'GET' });
    return res?.sites || [];
  },

  // 4. POST /store-assign (multipart/form-data)
  async storeAssign(formData: FormData): Promise<{ success: boolean; message: string }> {
    const urls = [
      KASHMIR_ADMIN_SRT_API.STORE_ASSIGN,
      KASHMIR_ADMIN_SRT_API.STORE_ASSIGN_ALT,
      KASHMIR_ADMIN_SRT_API.STORE_ASSIGN_DIRECT,
    ];
    return fetchWithCandidateUrls(urls, {
      method: 'POST',
      body: formData,
    });
  },

  // 5. GET /edit-assign/{id}
  async getEditAssign(id: string | number): Promise<any> {
    const urls = [
      KASHMIR_ADMIN_SRT_API.EDIT_ASSIGN(id),
      KASHMIR_ADMIN_SRT_API.EDIT_ASSIGN_ALT(id),
      KASHMIR_ADMIN_SRT_API.EDIT_ASSIGN_DIRECT(id),
    ];
    return fetchWithCandidateUrls(urls, { method: 'GET' });
  },

  // 6. POST /update-assign
  async updateAssign(formData: FormData): Promise<{ success: boolean; message: string }> {
    const urls = [
      KASHMIR_ADMIN_SRT_API.UPDATE_ASSIGN,
      KASHMIR_ADMIN_SRT_API.UPDATE_ASSIGN_ALT,
      KASHMIR_ADMIN_SRT_API.UPDATE_ASSIGN_DIRECT,
    ];
    return fetchWithCandidateUrls(urls, {
      method: 'POST',
      body: formData,
    });
  },

  // 7. GET /view-assign
  async getViewAssign(): Promise<ViewAssignResponse> {
    const urls = [
      KASHMIR_ADMIN_SRT_API.VIEW_ASSIGN,
      KASHMIR_ADMIN_SRT_API.VIEW_ASSIGN_ALT,
      KASHMIR_ADMIN_SRT_API.VIEW_ASSIGN_DIRECT,
    ];
    return fetchWithCandidateUrls(urls, { method: 'GET' });
  },

  // 8. GET /view-installation-vendor-wise/{id}
  async getViewInstallationVendorWise(id: string | number): Promise<any> {
    const urls = [
      KASHMIR_ADMIN_SRT_API.VIEW_INSTALLATION_VENDOR_WISE(id),
      KASHMIR_ADMIN_SRT_API.VIEW_INSTALLATION_VENDOR_WISE_ALT(id),
      KASHMIR_ADMIN_SRT_API.VIEW_INSTALLATION_VENDOR_WISE_DIRECT(id),
    ];
    return fetchWithCandidateUrls(urls, { method: 'GET' });
  },

  // 9. ANY /approval-assign/{id} (note: body contains id as well for backend validation)
  async approveAssign(id: string | number): Promise<{ success: boolean; message: string }> {
    const urls = [
      KASHMIR_ADMIN_SRT_API.APPROVE_ASSIGN(id),
      KASHMIR_ADMIN_SRT_API.APPROVE_ASSIGN_ALT(id),
      KASHMIR_ADMIN_SRT_API.APPROVE_ASSIGN_DIRECT(id),
    ];
    try {
      return await fetchWithCandidateUrls(urls, {
        method: 'POST',
        body: JSON.stringify({ id: Number(id) }),
      });
    } catch (err: any) {
      if (err.status === 405 || /method not allowed|not supported for route/i.test(err?.message || '')) {
        return await fetchWithCandidateUrls(urls, { method: 'GET' });
      }
      throw err;
    }
  },

  // 10. GET /view-installation
  async getViewInstallation(): Promise<ViewInstallationResponse> {
    const urls = [
      KASHMIR_ADMIN_SRT_API.VIEW_INSTALLATION,
      KASHMIR_ADMIN_SRT_API.VIEW_INSTALLATION_ALT,
      KASHMIR_ADMIN_SRT_API.VIEW_INSTALLATION_DIRECT,
    ];
    return fetchWithCandidateUrls(urls, { method: 'GET' });
  },

  // 11. ANY /verify-installation-status (multipart/form-data with GET query-params fallback)
  async verifyInstallationStatus(formData: FormData): Promise<any> {
    const adminUrl = KASHMIR_ADMIN_SRT_API.VERIFY_INSTALLATION_STATUS;
    const id = String(formData.get('id') || formData.get('srt_id') || '');
    const status = String(formData.get('status') || formData.get('inst_verify_status') || '1');
    const remarks = String(formData.get('inst_verify_remarks') || formData.get('inst_verify_remark') || formData.get('remarks') || '');

    // Ensure all standard alias fields are on formData
    if (!formData.has('inst_verify_status')) formData.append('inst_verify_status', status);
    if (!formData.has('status')) formData.append('status', status);
    if (id && !formData.has('srt_id')) formData.append('srt_id', id);
    if (remarks) {
      if (!formData.has('inst_verify_remarks')) formData.append('inst_verify_remarks', remarks);
      if (!formData.has('inst_verify_remark')) formData.append('inst_verify_remark', remarks);
      if (!formData.has('remarks')) formData.append('remarks', remarks);
    }

    const q = new URLSearchParams();
    if (id) {
      q.append('id', id);
      q.append('srt_id', id);
    }
    if (status) {
      q.append('status', status);
      q.append('inst_verify_status', status);
    }
    if (remarks) {
      q.append('inst_verify_remarks', remarks);
      q.append('inst_verify_remark', remarks);
      q.append('remarks', remarks);
    }
    const qs = q.toString();

    // Strategy 1: POST FormData to Admin URL
    try {
      return await fetchWithCandidateUrls([adminUrl], {
        method: 'POST',
        body: formData,
      });
    } catch (postErr: any) {
      if (postErr.status === 401 || postErr.status === 422) {
        throw postErr;
      }

      // Strategy 2: POST JSON to Admin URL
      try {
        const jsonBody: Record<string, any> = {
          id: Number(id),
          srt_id: Number(id),
          status: Number(status),
          inst_verify_status: Number(status),
          remarks,
          inst_verify_remarks: remarks,
          inst_verify_remark: remarks,
        };
        return await fetchWithCandidateUrls([adminUrl], {
          method: 'POST',
          body: JSON.stringify(jsonBody),
        });
      } catch (jsonErr: any) {
        if (jsonErr.status === 401 || jsonErr.status === 422) {
          throw jsonErr;
        }

        // Strategy 3: GET with query params to Admin URL
        try {
          return await fetchWithCandidateUrls([`${adminUrl}?${qs}`], {
            method: 'GET',
          });
        } catch (getErr: any) {
          if (getErr.status === 401 || getErr.status === 422) {
            throw getErr;
          }

          // Strategy 4: GET with query params to Alt/Direct URLs
          const altUrls = [
            KASHMIR_ADMIN_SRT_API.VERIFY_INSTALLATION_STATUS_ALT,
            KASHMIR_ADMIN_SRT_API.VERIFY_INSTALLATION_STATUS_DIRECT,
          ].map((u) => (qs ? `${u}?${qs}` : u));

          try {
            return await fetchWithCandidateUrls(altUrls, {
              method: 'GET',
            });
          } catch {
            throw postErr;
          }
        }
      }
    }
  },

  // 12. ANY /verify-doc-status
  async verifyDocStatus(id: number | string, status: number, remarks?: string): Promise<any> {
    const adminUrl = KASHMIR_ADMIN_SRT_API.VERIFY_DOC_STATUS;
    const cleanRemarks = (remarks || '').trim();

    const docPayload: Record<string, any> = {
      id: Number(id),
      doc_id: Number(id),
      srt_id: Number(id),
      status: Number(status),
      doc_status: Number(status),
      doc_verify_status: Number(status),
      inst_doc_submit: Number(status),
      inst_doc_status: Number(status),
      remarks: cleanRemarks,
      approved_remarks: cleanRemarks,
    };

    const q = new URLSearchParams();
    q.append('id', String(id));
    q.append('doc_id', String(id));
    q.append('srt_id', String(id));
    q.append('status', String(status));
    q.append('doc_status', String(status));
    q.append('doc_verify_status', String(status));
    q.append('inst_doc_submit', String(status));
    q.append('inst_doc_status', String(status));
    if (cleanRemarks) {
      q.append('remarks', cleanRemarks);
      q.append('approved_remarks', cleanRemarks);
    }
    const qs = q.toString();

    // Strategy 1: POST JSON to Admin URL
    try {
      return await fetchWithCandidateUrls([adminUrl], {
        method: 'POST',
        body: JSON.stringify(docPayload),
      });
    } catch (postErr: any) {
      if (postErr.status === 401 || postErr.status === 422) {
        throw postErr;
      }

      // Strategy 2: POST FormData to Admin URL
      try {
        const fd = new FormData();
        Object.entries(docPayload).forEach(([k, v]) => {
          if (v !== undefined && v !== null) fd.append(k, String(v));
        });
        return await fetchWithCandidateUrls([adminUrl], {
          method: 'POST',
          body: fd,
        });
      } catch (fdErr: any) {
        if (fdErr.status === 401 || fdErr.status === 422) {
          throw fdErr;
        }

        // Strategy 3: GET with query params to Admin URL
        try {
          return await fetchWithCandidateUrls([`${adminUrl}?${qs}`], {
            method: 'GET',
          });
        } catch (getErr: any) {
          if (getErr.status === 401 || getErr.status === 422) {
            throw getErr;
          }

          // Strategy 4: GET with query params to Alt/Direct URLs
          const altUrls = [
            KASHMIR_ADMIN_SRT_API.VERIFY_DOC_STATUS_ALT,
            KASHMIR_ADMIN_SRT_API.VERIFY_DOC_STATUS_DIRECT,
          ].map((u) => (qs ? `${u}?${qs}` : u));

          try {
            return await fetchWithCandidateUrls(altUrls, {
              method: 'GET',
            });
          } catch {
            throw postErr;
          }
        }
      }
    }
  },

  // 13. GET /view-claim
  async getViewClaim(): Promise<ViewClaimResponse> {
    const urls = [
      KASHMIR_ADMIN_SRT_API.VIEW_CLAIM,
      KASHMIR_ADMIN_SRT_API.VIEW_CLAIM_ALT,
      KASHMIR_ADMIN_SRT_API.VIEW_CLAIM_DIRECT,
    ];
    return fetchWithCandidateUrls(urls, { method: 'GET' });
  },

  // 14. ANY /claim-status-update
  async updateClaimStatus(id: number | string, status: number, remarks?: string): Promise<any> {
    const adminUrl = KASHMIR_ADMIN_SRT_API.CLAIM_STATUS_UPDATE;
    const cleanRemarks = (remarks || '').trim();

    const claimPayload: Record<string, any> = {
      id: Number(id),
      claim_id: Number(id),
      srt_id: Number(id),
      status: Number(status),
      claim_status: Number(status),
      inst_claim_status: Number(status),
      remarks: cleanRemarks,
      approved_remarks: cleanRemarks,
      claim_remarks: cleanRemarks,
    };

    const q = new URLSearchParams();
    q.append('id', String(id));
    q.append('claim_id', String(id));
    q.append('srt_id', String(id));
    q.append('status', String(status));
    q.append('claim_status', String(status));
    q.append('inst_claim_status', String(status));
    if (cleanRemarks) {
      q.append('remarks', cleanRemarks);
      q.append('approved_remarks', cleanRemarks);
      q.append('claim_remarks', cleanRemarks);
    }
    const qs = q.toString();

    // Strategy 1: POST JSON to Admin URL
    try {
      return await fetchWithCandidateUrls([adminUrl], {
        method: 'POST',
        body: JSON.stringify(claimPayload),
      });
    } catch (postErr: any) {
      if (postErr.status === 401 || postErr.status === 422) {
        throw postErr;
      }

      // Strategy 2: POST FormData to Admin URL
      try {
        const fd = new FormData();
        Object.entries(claimPayload).forEach(([k, v]) => {
          if (v !== undefined && v !== null) fd.append(k, String(v));
        });
        return await fetchWithCandidateUrls([adminUrl], {
          method: 'POST',
          body: fd,
        });
      } catch (fdErr: any) {
        if (fdErr.status === 401 || fdErr.status === 422) {
          throw fdErr;
        }

        // Strategy 3: GET with query params to Admin URL
        try {
          return await fetchWithCandidateUrls([`${adminUrl}?${qs}`], {
            method: 'GET',
          });
        } catch (getErr: any) {
          if (getErr.status === 401 || getErr.status === 422) {
            throw getErr;
          }

          // Strategy 4: GET with query params to Alt/Direct URLs
          const altUrls = [
            KASHMIR_ADMIN_SRT_API.CLAIM_STATUS_UPDATE_ALT,
            KASHMIR_ADMIN_SRT_API.CLAIM_STATUS_UPDATE_DIRECT,
          ].map((u) => (qs ? `${u}?${qs}` : u));

          try {
            return await fetchWithCandidateUrls(altUrls, {
              method: 'GET',
            });
          } catch {
            throw postErr;
          }
        }
      }
    }
  },

  // 15. ANY /view-payment
  async getViewPayment(params?: { from_date?: string; to_date?: string; vendor?: string | number }): Promise<ViewPaymentResponse> {
    const urls = [
      KASHMIR_ADMIN_SRT_API.VIEW_PAYMENT(params),
      KASHMIR_ADMIN_SRT_API.VIEW_PAYMENT_ALT(params),
      KASHMIR_ADMIN_SRT_API.VIEW_PAYMENT_DIRECT(params),
    ];
    return fetchWithCandidateUrls(urls, { method: 'GET' });
  },

  // 16. ANY /update-payment-status
  async updatePaymentStatus(payload: {
    pay80_id?: number;
    inst_pay80?: number | string;
    inst_pay80_date?: string;
    inst_pay80_remark?: string;
    pay20_id?: number;
    inst_pay20?: number | string;
    inst_pay20_date?: string;
    inst_pay20_remark?: string;
  }): Promise<any> {
    const urls = [
      KASHMIR_ADMIN_SRT_API.UPDATE_PAYMENT_STATUS,
      KASHMIR_ADMIN_SRT_API.UPDATE_PAYMENT_STATUS_ALT,
      KASHMIR_ADMIN_SRT_API.UPDATE_PAYMENT_STATUS_DIRECT,
    ];
    return fetchWithCandidateUrls(urls, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  // 17. GET /dashboard
  async getDashboard(): Promise<DashboardResponse> {
    const urls = [
      KASHMIR_ADMIN_SRT_API.DASHBOARD,
      KASHMIR_ADMIN_SRT_API.DASHBOARD_ALT,
      KASHMIR_ADMIN_SRT_API.DASHBOARD_DIRECT,
    ];
    return fetchWithCandidateUrls(urls, { method: 'GET' });
  },

  // 18. GET /view-dashboard/{status?}
  async getViewDashboard(status?: string): Promise<any> {
    const urls = [
      KASHMIR_ADMIN_SRT_API.VIEW_DASHBOARD(status),
      KASHMIR_ADMIN_SRT_API.VIEW_DASHBOARD_ALT(status),
      KASHMIR_ADMIN_SRT_API.VIEW_DASHBOARD_DIRECT(status),
    ];
    return fetchWithCandidateUrls(urls, { method: 'GET' });
  },

  // 19. GET /vendorwise-data/{status}/{vendor}
  async getVendorWiseData(status: string, vendor: string | number): Promise<any> {
    const urls = [
      KASHMIR_ADMIN_SRT_API.VENDOR_WISE_DATA(status, vendor),
      KASHMIR_ADMIN_SRT_API.VENDOR_WISE_DATA_ALT(status, vendor),
      KASHMIR_ADMIN_SRT_API.VENDOR_WISE_DATA_DIRECT(status, vendor),
    ];
    return fetchWithCandidateUrls(urls, { method: 'GET' });
  },

  // 20. GET /districtwise-data/{status}/{district}
  async getDistrictWiseData(status: string, district: string): Promise<any> {
    const urls = [
      KASHMIR_ADMIN_SRT_API.DISTRICT_WISE_DATA(status, district),
      KASHMIR_ADMIN_SRT_API.DISTRICT_WISE_DATA_ALT(status, district),
      KASHMIR_ADMIN_SRT_API.DISTRICT_WISE_DATA_DIRECT(status, district),
    ];
    return fetchWithCandidateUrls(urls, { method: 'GET' });
  },

  // 21. GET /view-expenses
  async getViewExpenses(): Promise<ViewExpensesResponse> {
    const urls = [
      KASHMIR_ADMIN_SRT_API.VIEW_EXPENSES,
      KASHMIR_ADMIN_SRT_API.VIEW_EXPENSES_ALT,
      KASHMIR_ADMIN_SRT_API.VIEW_EXPENSES_DIRECT,
    ];
    return fetchWithCandidateUrls(urls, { method: 'GET' });
  },

  // 22. POST /verify-expenses-claim-status
  async verifyExpensesClaimStatus(id: number | string, status: number, remarks?: string): Promise<any> {
    const urls = [
      KASHMIR_ADMIN_SRT_API.VERIFY_EXPENSES_CLAIM_STATUS,
      KASHMIR_ADMIN_SRT_API.VERIFY_EXPENSES_CLAIM_STATUS_ALT,
      KASHMIR_ADMIN_SRT_API.VERIFY_EXPENSES_CLAIM_STATUS_DIRECT,
    ];
    return fetchWithCandidateUrls(urls, {
      method: 'POST',
      body: JSON.stringify({ id: Number(id), status, remarks }),
    });
  },

  // 23. GET /expenses-payment-details/{id}
  async getExpensesPaymentDetails(id: string | number): Promise<any> {
    const urls = [
      KASHMIR_ADMIN_SRT_API.EXPENSES_PAYMENT_DETAILS(id),
      KASHMIR_ADMIN_SRT_API.EXPENSES_PAYMENT_DETAILS_ALT(id),
      KASHMIR_ADMIN_SRT_API.EXPENSES_PAYMENT_DETAILS_DIRECT(id),
    ];
    return fetchWithCandidateUrls(urls, { method: 'GET' });
  },

  // 24. ANY /view-expenses-payment
  async getViewExpensesPayment(params?: {
    from_date?: string;
    to_date?: string;
    vendor?: string | number;
    status?: string | number;
  }): Promise<ViewExpensesPaymentResponse> {
    const urls = [
      KASHMIR_ADMIN_SRT_API.VIEW_EXPENSES_PAYMENT(params),
      KASHMIR_ADMIN_SRT_API.VIEW_EXPENSES_PAYMENT_ALT(params),
      KASHMIR_ADMIN_SRT_API.VIEW_EXPENSES_PAYMENT_DIRECT(params),
    ];
    return fetchWithCandidateUrls(urls, { method: 'GET' });
  },

  // 25. POST /installasrttion-expenses-payment-status
  async updateExpensesPaymentStatus(payload: {
    id: number | string;
    amount: number | string;
    date: string;
    remarks?: string;
  }): Promise<any> {
    const urls = [
      KASHMIR_ADMIN_SRT_API.EXPENSES_PAYMENT_STATUS,
      KASHMIR_ADMIN_SRT_API.EXPENSES_PAYMENT_STATUS_ALT,
      KASHMIR_ADMIN_SRT_API.EXPENSES_PAYMENT_STATUS_DIRECT,
      KASHMIR_ADMIN_SRT_API.EXPENSES_PAYMENT_STATUS_CORRECT,
      KASHMIR_ADMIN_SRT_API.EXPENSES_PAYMENT_STATUS_CORRECT_ALT,
      KASHMIR_ADMIN_SRT_API.EXPENSES_PAYMENT_STATUS_WITH_PATH,
    ];
    return fetchWithCandidateUrls(urls, {
      method: 'POST',
      body: JSON.stringify({
        id: Number(payload.id),
        amount: Number(payload.amount),
        date: payload.date,
        remarks: payload.remarks,
      }),
    });
  },
};

export default kashmirAdminService;
