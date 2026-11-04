import { JAMMU_API } from '../../V_Portal_APIS/Jammu_API';
import { getAuthHeaders } from './jammuSrt70mwService';

/* ═══════════════════════════════════════════════════════════════════════════
   TypeScript Interfaces for Jammu Installation Expenses
   ═══════════════════════════════════════════════════════════════════════════ */

export interface JammuExpenseClaimItem {
  id: number;
  company_id?: number;
  vendor_id?: number;
  state?: string;
  project?: string;
  type?: string;
  purpose: string;
  date: string;
  amount: string | number;
  claim_status: number; // 1 = Raised, 2 = Approved
  remarks?: string;
  approved_remarks?: string;
  approved_date?: string;
  approved_by?: string | number;
  claim_status_remarks?: string;
  pay_status: number; // 0 = Pending, 1 = Complete, 2 = Partially
  file?: string;
  site_name: string;
  site_code?: string;
  [key: string]: any;
}

export interface JammuExpenseSiteItem {
  id: number;
  site_name: string;
  site_code?: string;
  district?: string;
  ca_no?: string;
  sanction_load?: string | number;
  [key: string]: any;
}

export interface JammuExpenseEditData {
  claim: {
    id: number;
    site_id: number | string;
    purpose: string;
    amount: string | number;
    date?: string;
    remarks?: string;
    file?: string;
    [key: string]: any;
  };
  srt70mw: Array<{
    id: number;
    site_name: string;
    site_code?: string;
    district?: string;
    [key: string]: any;
  }>;
}

export interface JammuAllPaymentItem {
  id?: number;
  claim_id?: number | string;
  amount?: number | string;
  balance?: number | string;
  date?: string;
  status?: number;
  payment_by?: string | number;
  pay_remarks?: string;
  created_at?: string;
  updated_at?: string;
  [key: string]: any;
}

export interface JammuExpensePaymentItem {
  id: number;
  purpose: string;
  amount: string | number;
  claim_status: number;
  pay_status: number; // 0 = Pending, 1 = Complete, 2 = Partially
  site_name: string;
  site_code?: string;
  district?: string;
  date?: string;
  approved_date?: string;
  approved_by?: string | number;
  approved_remarks?: string;
  remarks?: string;
  file?: string;
  utr_no?: string;
  paid_date?: string;
  pay_amount?: string | number;
  payment_amount?: string | number;
  balance_amount?: string | number;
  payment_balance?: string | number;
  pay_date?: string;
  payment_date?: string;
  pay_remarks?: string;
  payment_remarks?: string;
  allpayment?: JammuAllPaymentItem[];
  [key: string]: any;
}

export interface JammuExpensePaymentDetailSummary {
  total: number;
  complete: number;
  partially: number;
  pending: number;
}

export interface JammuExpensePaymentData {
  vendor?: { id: number; name: string; [key: string]: any };
  company_id?: number;
  loginId?: number;
  payments: JammuExpensePaymentItem[];
  payment_detail: JammuExpensePaymentDetailSummary;
}

/* ═══════════════════════════════════════════════════════════════════════════
   Jammu Installation Expense Service Implementation
   ═══════════════════════════════════════════════════════════════════════════ */

class JammuExpenseService {
  /**
   * 15. Installation Expenses: List
   * GET /jammu/installation-expenses
   * Vendor's installation expense claims (state jammu, project srt70mw, type installation), newest first.
   */
  async getExpenseClaims(): Promise<JammuExpenseClaimItem[]> {
    const res = await fetch(JAMMU_API.EXPENSES.LIST, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch expense claims (${res.status})`);
    }

    const json = await res.json();
    return Array.isArray(json?.claims) ? json.claims : [];
  }

  /**
   * 16. Installation Expenses: Create (Site List)
   * GET /jammu/installation-expenses-create
   * Sites allocated to vendor for creating new claims.
   * Note: The key in backend response is named 'claims', but contains full records of jammu_srt70mws.
   */
  async getExpenseSites(): Promise<JammuExpenseSiteItem[]> {
    const res = await fetch(JAMMU_API.EXPENSES.CREATE_SITE_LIST, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch expense sites (${res.status})`);
    }

    const json = await res.json();
    return Array.isArray(json?.claims) ? json.claims : [];
  }

  /**
   * 17. Installation Expenses: Store
   * POST /jammu/installation-expenses-store
   * Content-Type: multipart/form-data
   * Fields: site_id, project, date, claim_amount, claim_invoice, purpose, remarks
   */
  async storeExpenseClaim(formData: FormData): Promise<{ status: boolean; message: string; data?: any }> {
    const res = await fetch(JAMMU_API.EXPENSES.STORE, {
      method: 'POST',
      headers: getAuthHeaders(true),
      body: formData,
    });

    const json = await res.json().catch(() => null);

    if (!res.ok || json?.status === false || json?.success === false) {
      let errMsg = json?.message || `Failed to submit expense claim (${res.status})`;
      if (json?.errors) {
        const firstKey = Object.keys(json.errors)[0];
        if (firstKey && json.errors[firstKey]?.[0]) {
          errMsg = json.errors[firstKey][0];
        }
      }
      throw new Error(errMsg);
    }

    return {
      status: json?.status ?? true,
      message: json?.message || 'Claim submitted successfully!',
      data: json?.data,
    };
  }

  /**
   * 18. Installation Expenses: Edit (Load)
   * GET /jammu/installation-expenses-edit?claim_id={claim_id}
   */
  async editExpenseClaimLoad(claimId: number | string): Promise<JammuExpenseEditData> {
    const res = await fetch(JAMMU_API.EXPENSES.EDIT_LOAD(claimId), {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    const json = await res.json().catch(() => null);

    if (!res.ok || json?.status === false) {
      let errMsg = json?.message || `Failed to load claim for editing (${res.status})`;
      if (json?.errors) {
        const firstKey = Object.keys(json.errors)[0];
        if (firstKey && json.errors[firstKey]?.[0]) {
          errMsg = json.errors[firstKey][0];
        }
      }
      throw new Error(errMsg);
    }

    if (!json?.data?.claim) {
      throw new Error('Expense claim record not found.');
    }

    return json.data;
  }

  /**
   * 19. Installation Expenses: Update
   * POST /jammu/installation-expenses-update
   * Content-Type: multipart/form-data
   * Fields: claim_id, site_id, project, date, claim_amount, purpose, remarks, claim_invoice (optional)
   */
  async updateExpenseClaim(formData: FormData): Promise<{ status: boolean; message: string; data?: any }> {
    const res = await fetch(JAMMU_API.EXPENSES.UPDATE, {
      method: 'POST',
      headers: getAuthHeaders(true),
      body: formData,
    });

    const json = await res.json().catch(() => null);

    if (!res.ok || json?.status === false || json?.success === false) {
      let errMsg = json?.message || `Failed to update expense claim (${res.status})`;
      if (json?.errors) {
        const firstKey = Object.keys(json.errors)[0];
        if (firstKey && json.errors[firstKey]?.[0]) {
          errMsg = json.errors[firstKey][0];
        }
      }
      throw new Error(errMsg);
    }

    return {
      status: json?.status ?? true,
      message: json?.message || 'Claim updated successfully!',
      data: json?.data,
    };
  }

  /**
   * 20. Installation Expenses: View Payment
   * GET /jammu/installation-expenses-view-payment
   * Approved (claim_status = 2) expense claims and their payment summary.
   * Note: Backend may return HTTP 200 with message "Something went wrong while fetching payments."
   * while successfully returning data.
   */
  async getExpensePayments(): Promise<JammuExpensePaymentData> {
    const res = await fetch(JAMMU_API.EXPENSES.VIEW_PAYMENT, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch expense payments (${res.status})`);
    }

    const json = await res.json().catch(() => null);
    const d = json?.data || json;

    return {
      vendor: d?.vendor,
      company_id: d?.company_id,
      loginId: d?.loginId,
      payments: Array.isArray(d?.payments) ? d.payments : [],
      payment_detail: d?.payment_detail || {
        total: Array.isArray(d?.payments) ? d.payments.length : 0,
        complete: 0,
        partially: 0,
        pending: 0,
      },
    };
  }
}

export const jammuExpenseService = new JammuExpenseService();
export default jammuExpenseService;
