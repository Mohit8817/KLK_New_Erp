import { authService } from '../../../../../services/authService';
import {
  JAMMU_VENDOR_API,
  buildCandidateUrls,
  ROOT_URL,
} from '../../../Vendor_Management_APIS/Jammu_Vendor_API';

/* ═══════════════════════════════════════════════════════════════════════════
   TypeScript Interfaces for Jammu Installation Expenses
   Controller: App\Http\Controllers\admin\jammu\JammuInstalltionExpensesController
   Routes: /jammu/resco/installation/...
   ═══════════════════════════════════════════════════════════════════════════ */

export interface JammuExpenseVendor {
  id: number;
  name: string;
}

export interface JammuExpenseSiteDetails {
  id: number;
  district?: string;
  site_name?: string;
  site_code?: string;
}

export interface JammuPaymentHistoryItem {
  id: number;
  claim_id: number;
  amount: number;
  balance: number;
  date: string;
  pay_remarks?: string;
}

export interface JammuSrtExpenseClaimItem {
  id: number;
  vendor_id?: number;
  site_id?: number;
  state: string;
  vendor: string;
  claim_date: string;
  district: string;
  claim_count: number;
  site_name: string;
  site_code?: string;
  purpose: string;
  claim_invoice?: string;
  claim_amount: number;
  claim_update_date: string;
  claim_status: 1 | 2 | 3; // 1 = Pending, 2 = Approved, 3 = Rejected
  pay_status: 0 | 1 | 2;   // 0 = Pending, 1 = Complete, 2 = Partially
  claim_verify_remarks?: string;
  approved_remarks?: string;
  vendors?: JammuExpenseVendor;
  site_details?: JammuExpenseSiteDetails;
}

export interface JammuSrtExpensePaymentItem {
  id: number;
  vendor_id?: number;
  site_id?: number;
  date: string;
  vendor: string;
  district: string;
  site_name: string;
  site_code?: string;
  purpose: string;
  invoice?: string;
  amount: number;
  remarks: string;
  pay_amount: number | null;
  balance_amount: number | null;
  pay_date?: string | null;
  pay_remarks?: string | null;
  approved_remarks?: string | null;
  pay_status: 'Pending' | 'Paid' | 'Partially';
  pay_status_code: 0 | 1 | 2;
  can_pay: boolean;
  utr_no?: string;
  payment_mode?: string;
  vendors?: JammuExpenseVendor;
  site_details?: JammuExpenseSiteDetails;
  allpayment: JammuPaymentHistoryItem[];
}

export interface ExpenseClaimStats {
  total: number;
  approved: number;
  pending: number;
  rejected: number;
}

export interface ExpensePaymentStats {
  total: number;
  complete: number;
  partially: number;
  pending: number;
}

/* ═══════════════════════════════════════════════════════════════════════════
   Optional fallback vendor list (used while loading or if offline)
   ═══════════════════════════════════════════════════════════════════════════ */
export const JAMMU_EXPENSE_VENDORS = [
  'Lekhpal Sharma',
  'MANGAT RAM',
  'Ajay sharma',
  'Manish dubey',
  'KAMAL VYAS',
  'KLK',
  'Vikram Jeet Singh',
  'Raja',
  'shivram',
  'Adil Shah',
  'krishna',
  'Deepak Kumar',
  'Amanullah',
  'MUDASSIR',
  'Rajinder kumar',
  'RAKESH',
  'Jammu TEsting',
];

export const JAMMU_DISTRICTS = [
  'Jammu',
  'Samba',
  'Kathua',
  'Udhampur',
  'Reasi',
  'Rajouri',
  'Poonch',
  'Doda',
  'Ramban',
  'Kishtwar',
  'Srinagar',
  'Baramulla',
  'Anantnag',
  'Pulwama',
  'Kupwara',
  'Budgam',
];

/* ═══════════════════════════════════════════════════════════════════════════
   Helpers & Auth Header Resolvers
   ═══════════════════════════════════════════════════════════════════════════ */

export function resolveJammuMediaUrl(path?: string | null): string {
  if (!path) return '';
  const clean = String(path).trim();
  if (
    clean.startsWith('http://') ||
    clean.startsWith('https://') ||
    clean.startsWith('blob:') ||
    clean.startsWith('data:')
  ) {
    return clean;
  }
  const root = ROOT_URL.replace(/\/+$/, '');
  const rel = clean.replace(/^\/+/, '');
  return `${root}/${rel}`;
}

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
    const rawVendor = localStorage.getItem('klk_vendor_session');
    if (rawVendor) {
      const p = JSON.parse(rawVendor);
      if (p?.token) return p.token;
    }
  } catch {}

  return (
    localStorage.getItem('token') ||
    localStorage.getItem('auth_token') ||
    localStorage.getItem('admin_token') ||
    localStorage.getItem('accessToken') ||
    null
  );
};

export const getAuthHeaders = (): Record<string, string> => {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
  };

  if (token) {
    const isSynthetic =
      token.startsWith('klk_user_session_token_') ||
      token.startsWith('klk_vendor_session_token_');
    if (!isSynthetic) {
      headers.Authorization = `Bearer ${token}`;
    }
  }

  return headers;
};

let knownWorkingBase: string | null = null;

async function apiRequest<T = any>(
  pathOrUrl: string,
  options: RequestInit = {}
): Promise<{ success: boolean; data?: T; message?: string; errors?: any; raw?: any }> {
  let urlsToTry = buildCandidateUrls(pathOrUrl);
  if (knownWorkingBase) {
    urlsToTry.sort((a, b) => {
      const aMatch = a.startsWith(knownWorkingBase!) ? -1 : 0;
      const bMatch = b.startsWith(knownWorkingBase!) ? -1 : 0;
      return aMatch - bMatch;
    });
  }

  let lastError: any = null;
  let lastJson: any = null;

  for (const url of urlsToTry) {
    try {
      const headers = {
        ...getAuthHeaders(),
        ...((options.headers as Record<string, string>) || {}),
      };

      const res = await fetch(url, {
        credentials: 'include',
        ...options,
        headers,
      });

      const contentType = res.headers.get('content-type') || '';
      let json: any = null;
      if (contentType.includes('application/json')) {
        json = await res.json().catch(() => null);
      } else {
        const text = await res.text().catch(() => '');
        try {
          json = text ? JSON.parse(text) : {};
        } catch {
          json = { rawText: text };
        }
      }

      lastJson = json;

      if (res.ok) {
        try {
          const origin = new URL(url).origin;
          knownWorkingBase = origin;
        } catch {}
        return {
          success: json?.success ?? true,
          data: json?.data !== undefined ? json.data : json,
          message: json?.message,
          raw: json,
        };
      }

      // If backend returned a 422 or 404 with JSON message, capture it
      if (res.status === 422 || res.status === 404 || res.status === 400) {
        const errMsg =
          json?.message ||
          (json?.errors ? Object.values(json.errors).flat().join(' ') : null) ||
          `Server returned HTTP ${res.status}`;
        lastError = new Error(errMsg);
      } else {
        lastError = new Error(
          json?.message || `HTTP ${res.status}: ${res.statusText}`
        );
      }
    } catch (err: any) {
      lastError = err;
    }
  }

  return {
    success: false,
    message: lastError?.message || lastJson?.message || 'Network request failed',
    errors: lastJson?.errors,
    raw: lastJson,
  };
}

/* ═══════════════════════════════════════════════════════════════════════════
   Jammu Installation Expenses Service
   Strictly calls live backend APIs with ZERO fake / mock data.
   ═══════════════════════════════════════════════════════════════════════════ */

class JammuSrtExpenseService {
  /**
   * 1. View Claim Expenses
   * GET /jammu/resco/installation/view-claim-expenses
   */
  async getExpenseClaims(): Promise<{
    list: JammuSrtExpenseClaimItem[];
    stats: ExpenseClaimStats;
  }> {
    const res = await apiRequest(JAMMU_VENDOR_API.ADMIN_EXPENSES_VIEW_CLAIMS, {
      method: 'GET',
    });

    const rawData = res.data || res.raw?.data || {};
    const rawClaims = Array.isArray(rawData?.claims)
      ? rawData.claims
      : Array.isArray(rawData)
      ? rawData
      : [];

    const list: JammuSrtExpenseClaimItem[] = rawClaims.map((c: any, idx: number) => {
      const claimStatusNum = Number(c.claim_status);
      const payStatusNum = Number(c.pay_status);

      return {
        id: Number(c.id) || idx + 1,
        vendor_id: c.vendor_id ? Number(c.vendor_id) : undefined,
        site_id: c.site_id ? Number(c.site_id) : undefined,
        state: c.state || 'JAMMU & KASHMIR',
        vendor: c.vendors?.name || c.vendor_name || c.vendor || '—',
        claim_date: c.date || c.claim_date || '—',
        district: c.site_details?.district || c.district || '—',
        claim_count: Number(c.claim_count) || 1,
        site_name: c.site_details?.site_name || c.site_name || '—',
        site_code: c.site_details?.site_code || c.site_code || '',
        purpose: c.purpose || 'Installation Expense',
        claim_invoice: c.invoice || c.file || c.claim_invoice || '',
        claim_amount: Number(c.amount) || Number(c.claim_amount) || 0,
        claim_update_date: c.approved_date || c.updated_at || c.date || '—',
        claim_status: (claimStatusNum === 2 ? 2 : claimStatusNum === 3 ? 3 : 1) as 1 | 2 | 3,
        pay_status: (payStatusNum === 1 ? 1 : payStatusNum === 2 ? 2 : 0) as 0 | 1 | 2,
        approved_remarks: (c.approved_remarks != null && c.approved_remarks !== '')
          ? String(c.approved_remarks)
          : (c.claim_verify_remarks != null && c.claim_verify_remarks !== '')
          ? String(c.claim_verify_remarks)
          : '',
        claim_verify_remarks: (c.approved_remarks != null && c.approved_remarks !== '')
          ? String(c.approved_remarks)
          : (c.claim_verify_remarks != null && c.claim_verify_remarks !== '')
          ? String(c.claim_verify_remarks)
          : '',
        remarks: c.remarks ? String(c.remarks) : '',
        vendors: c.vendors,
        site_details: c.site_details,
      };
    });

    const rawDetails = rawData?.claim_details || {};
    const stats: ExpenseClaimStats = {
      total: Number(rawDetails.total ?? list.length),
      approved: Number(rawDetails.claim_approved ?? list.filter((c) => c.claim_status === 2).length),
      pending: Number(rawDetails.claim_pending ?? list.filter((c) => c.claim_status === 1).length),
      rejected: Number(rawDetails.claim_reject ?? list.filter((c) => c.claim_status === 3).length),
    };

    return { list, stats };
  }

  /**
   * 2. Verify Claim Expenses
   * POST /jammu/resco/installation/verify-claim-expenses
   * Payload: { id: number, status: 2 | 3, remarks?: string, approved_remarks?: string }
   */
  async verifyExpenseClaim(
    id: number,
    status: 2 | 3,
    remarks?: string
  ): Promise<{ success: boolean; message: string }> {
    const trimmedRemarks = remarks?.trim() || '';
    const payload = {
      id: Number(id),
      status: Number(status),
      remarks: trimmedRemarks,
      approved_remarks: trimmedRemarks,
      claim_verify_remarks: trimmedRemarks,
    };

    const res = await apiRequest(JAMMU_VENDOR_API.ADMIN_EXPENSES_VERIFY_CLAIM, {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    if (!res.success) {
      throw new Error(res.message || 'Failed to verify expense claim.');
    }

    return {
      success: true,
      message: res.message || 'Claim verified successfully.',
    };
  }

  // Alias for backward compatibility with component call
  async auditExpenseClaim(
    id: number,
    status: 1 | 2 | 3,
    remarks?: string
  ): Promise<{ success: boolean; message: string }> {
    const apiStatus = status === 3 ? 3 : 2;
    return this.verifyExpenseClaim(id, apiStatus as 2 | 3, remarks);
  }

  /**
   * 3. View Expenses Payment
   * ANY (GET/POST) /jammu/resco/installation/view-expenses-payment
   * Params: from_date, to_date, vendor, status
   */
  async getExpensePayments(filters?: {
    from_date?: string;
    to_date?: string;
    vendor?: string | number;
    status?: string | number;
  }): Promise<{
    list: JammuSrtExpensePaymentItem[];
    stats: ExpensePaymentStats;
    vendors: JammuExpenseVendor[];
  }> {
    const url = JAMMU_VENDOR_API.ADMIN_EXPENSES_VIEW_PAYMENT(filters);
    const res = await apiRequest(url, {
      method: 'GET',
    });

    const rawData = res.data || res.raw?.data || {};
    const rawPayments = Array.isArray(rawData?.payments)
      ? rawData.payments
      : Array.isArray(rawData)
      ? rawData
      : [];

    const list: JammuSrtExpensePaymentItem[] = rawPayments.map((p: any, idx: number) => {
      const rawAllPayment = Array.isArray(p.allpayment) ? p.allpayment : [];
      const totalPaid = rawAllPayment.reduce(
        (acc: number, curr: any) => acc + (Number(curr.amount) || 0),
        0
      );
      const latestPayment =
        rawAllPayment.length > 0 ? rawAllPayment[rawAllPayment.length - 1] : null;

      const amount = Number(p.amount) || 0;
      const payAmount =
        p.pay_amount != null
          ? Number(p.pay_amount)
          : totalPaid > 0
          ? totalPaid
          : null;

      const balanceAmount =
        p.balance_amount != null
          ? Number(p.balance_amount)
          : latestPayment?.balance != null
          ? Number(latestPayment.balance)
          : Math.max(0, amount - (payAmount || 0));

      const payStatusNum = Number(p.pay_status);
      const payStatusText: 'Pending' | 'Paid' | 'Partially' =
        payStatusNum === 1 || p.pay_status === 'Paid' || p.pay_status === 'Complete'
          ? 'Paid'
          : payStatusNum === 2 || p.pay_status === 'Partially'
          ? 'Partially'
          : 'Pending';

      const canPay =
        p.can_pay !== undefined
          ? Boolean(p.can_pay)
          : payStatusNum === 0 || payStatusNum === 2 || payStatusText !== 'Paid';

      return {
        id: Number(p.id) || idx + 1,
        vendor_id: p.vendor_id ? Number(p.vendor_id) : undefined,
        site_id: p.site_id ? Number(p.site_id) : undefined,
        date: p.date || '—',
        vendor: p.vendors?.name || p.vendor_name || p.vendor || '—',
        district: p.site_details?.district || p.district || '—',
        site_name: p.site_details?.site_name || p.site_name || '—',
        site_code: p.site_details?.site_code || p.site_code || '',
        purpose: p.purpose || 'Installation Expense',
        invoice: p.invoice || p.file || '',
        amount,
        remarks: p.approved_remarks || p.remarks || '',
        pay_amount: payAmount,
        balance_amount: balanceAmount,
        pay_date: latestPayment?.date || p.pay_date || null,
        pay_remarks: latestPayment?.pay_remarks || p.pay_remarks || null,
        pay_status: payStatusText,
        pay_status_code: (payStatusNum === 1 ? 1 : payStatusNum === 2 ? 2 : 0) as 0 | 1 | 2,
        can_pay: canPay,
        utr_no: p.utr_no || '',
        payment_mode: p.payment_mode || 'RTGS',
        vendors: p.vendors,
        site_details: p.site_details,
        allpayment: rawAllPayment.map((ap: any) => ({
          id: Number(ap.id),
          claim_id: Number(ap.claim_id),
          amount: Number(ap.amount) || 0,
          balance: Number(ap.balance) || 0,
          date: ap.date || '',
          pay_remarks: ap.pay_remarks || '',
        })),
      };
    });

    const rawDetail = rawData?.payment_detail || {};
    const stats: ExpensePaymentStats = {
      total: Number(rawDetail.total ?? list.length),
      complete: Number(rawDetail.complete ?? list.filter((p) => p.pay_status === 'Paid').length),
      partially: Number(rawDetail.partially ?? list.filter((p) => p.pay_status === 'Partially').length),
      pending: Number(rawDetail.pending ?? list.filter((p) => p.pay_status === 'Pending').length),
    };

    const dynamicVendors: JammuExpenseVendor[] = Array.isArray(rawData?.vendors)
      ? rawData.vendors.map((v: any) => ({
          id: Number(v.id),
          name: String(v.name || v.vendor_name || ''),
        }))
      : [];

    return { list, stats, vendors: dynamicVendors };
  }

  /**
   * 4. Verify Payment Status (payment karna)
   * POST /jammu/resco/installation/verify-payment-expenses
   * Payload: { id: number, amount: number, date: string, remarks?: string }
   */
  async verifyPaymentExpenses(params: {
    id: number;
    amount: number;
    date: string;
    remarks?: string;
  }): Promise<{ success: boolean; message: string }> {
    const payload = {
      id: Number(params.id),
      amount: Number(params.amount),
      date: params.date,
      remarks: params.remarks?.trim() || '',
    };

    const res = await apiRequest(JAMMU_VENDOR_API.ADMIN_EXPENSES_VERIFY_PAYMENT, {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    if (!res.success) {
      throw new Error(res.message || 'Failed to verify payment expenses.');
    }

    return {
      success: true,
      message: res.message || 'Payment verified successfully.',
    };
  }

  // Alias for backward compatibility with settlement modal
  async submitPaymentSettlement(params: {
    id: number;
    pay_amount: number;
    payment_mode?: string;
    utr_no?: string;
    settlement_date: string;
    remarks?: string;
  }): Promise<{ success: boolean; message: string }> {
    const notesParts = [
      params.remarks?.trim(),
      params.payment_mode ? `Mode: ${params.payment_mode}` : '',
      params.utr_no ? `UTR: ${params.utr_no}` : '',
    ].filter(Boolean);

    return this.verifyPaymentExpenses({
      id: params.id,
      amount: params.pay_amount,
      date: params.settlement_date,
      remarks: notesParts.join(' | '),
    });
  }

  /**
   * 5. Payment Details
   * GET /jammu/resco/installation/expenses-payment-details/{id}
   */
  async getPaymentDetails(id: number): Promise<{
    payments: JammuSrtExpensePaymentItem[];
    stats: ExpensePaymentStats;
    raw: any;
  }> {
    const url = JAMMU_VENDOR_API.ADMIN_EXPENSES_PAYMENT_DETAILS(id);
    const res = await apiRequest(url, {
      method: 'GET',
    });
    const rawData = res.data || res.raw?.data || {};
    const rawPayments = Array.isArray(rawData?.payments)
      ? rawData.payments
      : Array.isArray(rawData)
      ? rawData
      : [];

    const list: JammuSrtExpensePaymentItem[] = rawPayments.map((p: any, idx: number) => {
      const rawAllPayment = Array.isArray(p.allpayment) ? p.allpayment : [];
      const totalPaid = rawAllPayment.reduce(
        (acc: number, curr: any) => acc + (Number(curr.amount) || 0),
        0
      );
      const latestPayment =
        rawAllPayment.length > 0 ? rawAllPayment[rawAllPayment.length - 1] : null;

      const amount = Number(p.amount) || 0;
      const payAmount =
        p.pay_amount != null
          ? Number(p.pay_amount)
          : totalPaid > 0
          ? totalPaid
          : null;

      const balanceAmount =
        p.balance_amount != null
          ? Number(p.balance_amount)
          : latestPayment?.balance != null
          ? Number(latestPayment.balance)
          : Math.max(0, amount - (payAmount || 0));

      const payStatusNum = Number(p.pay_status);
      const payStatusText: 'Pending' | 'Paid' | 'Partially' =
        payStatusNum === 1 || p.pay_status === 'Paid' || p.pay_status === 'Complete'
          ? 'Paid'
          : payStatusNum === 2 || p.pay_status === 'Partially'
          ? 'Partially'
          : 'Pending';

      return {
        id: Number(p.id) || idx + 1,
        vendor_id: p.vendor_id ? Number(p.vendor_id) : undefined,
        site_id: p.site_id ? Number(p.site_id) : undefined,
        date: p.date || '—',
        vendor: p.vendors?.name || p.vendor_name || p.vendor || '—',
        district: p.site_details?.district || p.district || '—',
        site_name: p.site_details?.site_name || p.site_name || '—',
        site_code: p.site_details?.site_code || p.site_code || '',
        purpose: p.purpose || 'Installation Expense',
        invoice: p.invoice || p.file || '',
        amount,
        remarks: p.approved_remarks || p.remarks || '',
        pay_amount: payAmount,
        balance_amount: balanceAmount,
        pay_date: latestPayment?.date || p.pay_date || null,
        pay_remarks: latestPayment?.pay_remarks || p.pay_remarks || null,
        pay_status: payStatusText,
        pay_status_code: (payStatusNum === 1 ? 1 : payStatusNum === 2 ? 2 : 0) as 0 | 1 | 2,
        can_pay: Boolean(p.can_pay ?? (payStatusNum === 0 || payStatusNum === 2)),
        utr_no: p.utr_no || '',
        payment_mode: p.payment_mode || 'RTGS',
        vendors: p.vendors,
        site_details: p.site_details,
        allpayment: rawAllPayment.map((ap: any) => ({
          id: Number(ap.id),
          claim_id: Number(ap.claim_id),
          amount: Number(ap.amount) || 0,
          balance: Number(ap.balance) || 0,
          date: ap.date || '',
          pay_remarks: ap.pay_remarks || '',
        })),
      };
    });

    const rawDetail = rawData?.payment_detail || {};
    const stats: ExpensePaymentStats = {
      total: Number(rawDetail.total ?? list.length),
      complete: Number(rawDetail.complete ?? list.filter((p) => p.pay_status === 'Paid').length),
      partially: Number(rawDetail.partially ?? list.filter((p) => p.pay_status === 'Partially').length),
      pending: Number(rawDetail.pending ?? list.filter((p) => p.pay_status === 'Pending').length),
    };

    return { payments: list, stats, raw: rawData };
  }
}

export const jammuSrtExpenseService = new JammuSrtExpenseService();
export default jammuSrtExpenseService;
