import { JAMMU_API } from '../../V_Portal_APIS/Jammu_API';
import { getAuthHeaders } from './jammuSrt70mwService';

/* ═══════════════════════════════════════════════════════════════════════════
   TypeScript Interfaces for Jammu Installation Expenses
   ═══════════════════════════════════════════════════════════════════════════ */

export interface JammuExpenseClaimItem {
  id: number;
  company_id: number;
  vendor_id: number;
  state: string;
  project: string;
  type: string;
  purpose: string;
  date: string;
  amount: string | number;
  claim_status: number; // 1 = Raised, 2 = Approved
  remarks: string;
  pay_status: number; // 0 = Pending, 1 = Complete, 2 = Partially
  file: string;
  site_name: string;
  site_code: string;
  [key: string]: any;
}

export interface JammuExpenseSiteItem {
  id: number;
  site_name: string;
  site_code: string;
  district?: string;
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
  }>;
}

export interface JammuExpensePaymentItem {
  id: number;
  purpose: string;
  amount: string | number;
  claim_status: number;
  pay_status: number; // 0 = Pending, 1 = Complete, 2 = Partially
  site_name: string;
  site_code: string;
  utr_no?: string;
  paid_date?: string;
  [key: string]: any;
}

export interface JammuExpensePaymentDetailSummary {
  total: number;
  complete: number;
  partially: number;
  pending: number;
}

export interface JammuExpensePaymentData {
  vendor?: { id: number; name: string };
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
   * 15. Installation Expenses: List: GET /jammu/installation-expenses
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
   * 16. Installation Expenses: Create (Site List): GET /jammu/installation-expenses-create
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
    // Key on backend is named 'claims', but contains full records of jammu_srt70mws
    return Array.isArray(json?.claims) ? json.claims : [];
  }

  /**
   * 17. Installation Expenses: Store: POST /jammu/installation-expenses-store
   * Content-Type: multipart/form-data
   */
  async storeExpenseClaim(formData: FormData): Promise<{ status: boolean; message: string; data?: any }> {
    const res = await fetch(JAMMU_API.EXPENSES.STORE, {
      method: 'POST',
      headers: getAuthHeaders(true),
      body: formData,
    });

    const json = await res.json().catch(() => null);

    if (!res.ok) {
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
   * 18. Installation Expenses: Edit (Load): GET /jammu/installation-expenses-edit?claim_id={claim_id}
   */
  async editExpenseClaimLoad(claimId: number | string): Promise<JammuExpenseEditData> {
    const res = await fetch(JAMMU_API.EXPENSES.EDIT_LOAD(claimId), {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!res.ok) {
      throw new Error(`Failed to load claim for editing (${res.status})`);
    }

    const json = await res.json();
    if (!json?.data?.claim) {
      throw new Error('Expense claim record not found.');
    }

    return json.data;
  }

  /**
   * 19. Installation Expenses: Update: POST /jammu/installation-expenses-update
   * Content-Type: multipart/form-data
   */
  async updateExpenseClaim(formData: FormData): Promise<{ status: boolean; message: string; data?: any }> {
    const res = await fetch(JAMMU_API.EXPENSES.UPDATE, {
      method: 'POST',
      headers: getAuthHeaders(true),
      body: formData,
    });

    const json = await res.json().catch(() => null);

    if (!res.ok) {
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
   * 20. Installation Expenses: View Payment: GET /jammu/installation-expenses-view-payment
   */
  async getExpensePayments(): Promise<JammuExpensePaymentData> {
    const res = await fetch(JAMMU_API.EXPENSES.VIEW_PAYMENT, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch expense payments (${res.status})`);
    }

    const json = await res.json();
    return (
      json?.data || {
        payments: [],
        payment_detail: { total: 0, complete: 0, partially: 0, pending: 0 },
      }
    );
  }
}

export const jammuExpenseService = new JammuExpenseService();
export default jammuExpenseService;
