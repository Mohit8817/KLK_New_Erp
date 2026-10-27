import { API_BASE_URL, authService } from '../../../../services/authService';
import { BIHAR_API } from '../../V_Portal_APIS/Bihar_API';

export interface AssignSiteItem {
  id: number;
  vendor?: number;
  site_id?: string | number[];
  status?: number;
  created_at?: string;
  deadline_date?: string;
  remarks?: string;
  file?: string | null;
  vendors?: { id: number; name: string };
  sites?: AssignedBeneficiarySite[];
}

export interface AssignedBeneficiarySite {
  id: number;
  district?: string;
  block?: string;
  village?: string;
  beneficiary_name?: string;
  contact_no?: string;
  ca_no?: string;
  structure_status?: number;
  inst_status?: number;
  structure_verify_status?: number;
  verify_status?: number;
  [key: string]: any;
}

export interface SiteDetailResponse {
  id: number;
  state?: string;
  district?: string;
  block?: string;
  village?: string;
  address?: string;
  plant_sc?: string;
  sanction_load?: string;
  wo_no?: string;
  beneficiary_name?: string;
  father_name?: string;
  contact_no?: string;
  aadhar_no?: string;
  ca_no?: string;
  category?: string;
  latitude?: string;
  longitude?: string;
  meter_no?: string;
  module_serial_no?: string;
  inverter_serial_no?: string;
  rms_serial_no?: string;
  bos_kit_serial_no?: string;
  [key: string]: any;
}

export interface StructureSiteItem {
  id: number;
  site_id?: number;
  state?: string;
  district?: string;
  block?: string;
  village?: string;
  beneficiary_name?: string;
  contact_no?: string;
  ca_no?: string;
  structure_status?: number;
  structure_verify_status?: number;
  inst_status?: number;
  verify_status?: number;
  verify_remarks?: string;
  structure_remark?: string;
  module_serial_no?: string;
  module_serial_image?: string;
  foundation_and_fastner?: string;
  structure_image?: string;
  solar_meter_no?: string;
  inverter_no?: string;
  net_smart_meter_no?: string;
  loger_no?: string;
  complete_photo?: string;
  inverter_image?: string;
  earthing_image?: string;
  acdb_image?: string;
  solar_meter_image?: string;
  la_image?: string;
  inst_doc?: string;
  inst_doc_status?: number;
  doc_verify_status?: number;
  latitude?: string;
  longitude?: string;
  created_at?: string;
  updated_at?: string;
  [key: string]: any;
}

export interface PaymentClaimItem {
  id: number;
  vendor_id?: number;
  claim_type?: number;
  payment_type?: number | string;
  site_id?: string | number[];
  remarks?: string;
  file?: string;
  payment_amount?: string | number;
  payment_balance?: string | number;
  payment_date?: string;
  payment_remarks?: string;
  payment_status?: number;
  created_at?: string;
  sites?: { id: number; beneficiary_name?: string; district?: string; block?: string; village?: string; contact_no?: string }[];
}

export interface UlaInstallationDashboardData {
  company_id?: number;
  loginId?: number;
  role?: string;
  parent_id?: number;
  vendor?: { id: number; name: string };
  ula?: {
    site_count: number;
    structure_complete: number;
    structure_pending: number;
    structure_verify_pending: number;
    structure_verify_approved: number;
    structure_verify_reject: number;
    complete: number;
    pending: number;
    verify_pending: number;
    verify_approved: number;
    verify_reject: number;
    inst_doc_complete: number;
    inst_doc_pending: number;
    claim50_applicable: number;
    claim50_raised: number;
    claim30_applicable: number;
    inst_pay50_paid: number;
    inst_pay50_pending: number;
    inst_pay30_paid: number;
    inst_pay30_pending: number;
    [key: string]: any;
  };
  vendors?: { inst_vendor: number; vendor: number; name: string }[];
  districtwise?: {
    district: string;
    site_count: number;
    structure_complete?: number;
    inst_complete?: number;
    complete?: number;
    pending?: number;
    verify_approved?: number;
    verify_pending?: number;
    verify_reject?: number;
    doc_complete?: number;
    doc_pending?: number;
  }[];
  vendor_installation_month?: { month_year: string; monthly_installations: number }[];
  vendor_today_installation?: { inst_vendor: number; name: string; today_install: number }[];
}

class BiharUlaInstallationService {
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

  private async fetchWithFallback(urlOrEndpoint: string, options: RequestInit = {}): Promise<Response> {
    let urls: string[] = [];
    const baseClean = API_BASE_URL.replace(/\/+$/, '');
    const altBase = baseClean.endsWith('/api') ? baseClean.slice(0, -4) : `${baseClean}/api`;

    if (urlOrEndpoint.startsWith('http://') || urlOrEndpoint.startsWith('https://')) {
      const u = new URL(urlOrEndpoint);
      const cleanPath = (u.pathname + u.search).replace(/^\/api/, '');
      urls = [
        urlOrEndpoint,
        `${baseClean}${cleanPath}`,
        `${altBase}${cleanPath}`,
        `${baseClean}/v${cleanPath}`,
      ];
      urls = Array.from(new Set(urls));
    } else {
      const cleanEndpoint = urlOrEndpoint.startsWith('/') ? urlOrEndpoint : `/${urlOrEndpoint}`;
      urls = [
        `${baseClean}${cleanEndpoint}`,
        `${altBase}${cleanEndpoint}`,
        `${baseClean}/v${cleanEndpoint}`,
      ];
    }

    for (const url of urls) {
      try {
        const res = await fetch(url, options);
        if (res.status !== 404) {
          return res;
        }
      } catch {
        // try next fallback
      }
    }
    return fetch(urls[0], options);
  }

  /* ═══════════════════════════════════════════════════════════════════════
     1. Assigned Installation List
     GET /bihar/ula/installation/view-assign-site
     ═══════════════════════════════════════════════════════════════════════ */
  async getViewAssignSites(): Promise<AssignSiteItem[]> {
    try {
      const res = await this.fetchWithFallback(BIHAR_API.INSTALLATION.ULA.VIEW_ASSIGN_SITE, {
        method: 'GET',
        headers: this.getHeaders(),
      });
      if (!res.ok) return [];
      const json = await res.json();
      return json?.data || [];
    } catch (err) {
      console.error('[ULA Installation] getViewAssignSites error:', err);
      return [];
    }
  }

  /* ═══════════════════════════════════════════════════════════════════════
     2. Assign Site Detail
     GET /bihar/ula/installation/view-assign-site-detail?id=12
     ═══════════════════════════════════════════════════════════════════════ */
  async getAssignSiteDetail(id: number | string): Promise<AssignSiteItem | null> {
    const res = await this.fetchWithFallback(BIHAR_API.INSTALLATION.ULA.VIEW_ASSIGN_SITE_DETAIL(id), {
      method: 'GET',
      headers: this.getHeaders(),
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json?.data || null;
  }

  /* ═══════════════════════════════════════════════════════════════════════
     3. Accept Installation
     GET /bihar/ula/installation/accept-assign-site?id=12
     ═══════════════════════════════════════════════════════════════════════ */
  async acceptAssignSite(id: number | string): Promise<{ success: boolean; message: string }> {
    const res = await this.fetchWithFallback(BIHAR_API.INSTALLATION.ULA.ACCEPT_ASSIGN_SITE(id), {
      method: 'GET',
      headers: this.getHeaders(),
    });
    const json = await res.json();
    if (!res.ok) {
      throw new Error(json?.message || `Failed to accept installation (HTTP ${res.status})`);
    }
    return json;
  }

  /* ═══════════════════════════════════════════════════════════════════════
     4. Site Name List
     GET /bihar/ula/installation/fetch-site-name
     ═══════════════════════════════════════════════════════════════════════ */
  async fetchSiteNames(): Promise<{ id: number; beneficiary_name: string }[]> {
    try {
      const res = await this.fetchWithFallback(BIHAR_API.INSTALLATION.ULA.FETCH_SITE_NAME, {
        method: 'GET',
        headers: this.getHeaders(),
      });
      if (!res.ok) return [];
      const json = await res.json();
      return json?.data || [];
    } catch (err) {
      console.error('[ULA Installation] fetchSiteNames error:', err);
      return [];
    }
  }

  /* ═══════════════════════════════════════════════════════════════════════
     5. Site Details
     GET /bihar/ula/installation/fetch-site-details?site_id=101
     ═══════════════════════════════════════════════════════════════════════ */
  async fetchSiteDetails(siteId: number | string): Promise<SiteDetailResponse | null> {
    const res = await this.fetchWithFallback(BIHAR_API.INSTALLATION.ULA.FETCH_SITE_DETAILS(siteId), {
      method: 'GET',
      headers: this.getHeaders(),
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json?.data || null;
  }

  /* ═══════════════════════════════════════════════════════════════════════
     6. Structure Install Store
     POST /bihar/ula/installation/pending-structure-site-store (multipart)
     ═══════════════════════════════════════════════════════════════════════ */
  async storeStructureInstall(formData: FormData): Promise<{ status: boolean; message: string; data?: any }> {
    const res = await this.fetchWithFallback(BIHAR_API.INSTALLATION.ULA.PENDING_STRUCTURE_STORE, {
      method: 'POST',
      headers: this.getHeaders(true),
      body: formData,
    });
    const json = await res.json();
    if (!res.ok) {
      if (res.status === 422 && json?.errors) {
        const first = Object.values(json.errors).flat()[0] as string;
        throw new Error(first || json.message || 'Validation failed');
      }
      throw new Error(json?.message || `Failed to save structure (HTTP ${res.status})`);
    }
    return json;
  }

  /* ═══════════════════════════════════════════════════════════════════════
     7. View Installation (Structure Complete)
     GET /bihar/ula/installation/view-site
     ═══════════════════════════════════════════════════════════════════════ */
  async getViewInstalledSites(): Promise<StructureSiteItem[]> {
    try {
      const res = await this.fetchWithFallback(BIHAR_API.INSTALLATION.ULA.VIEW_INSTALLED_SITES, {
        method: 'GET',
        headers: this.getHeaders(),
      });
      if (!res.ok) return [];
      const json = await res.json();
      return json?.data || [];
    } catch (err) {
      console.error('[ULA Installation] getViewInstalledSites error:', err);
      return [];
    }
  }

  /* ═══════════════════════════════════════════════════════════════════════
     8. Structure Edit Data
     GET /bihar/ula/installation/structure-edit-site?site_id=101
     ═══════════════════════════════════════════════════════════════════════ */
  async getStructureEditSite(siteId: number | string): Promise<StructureSiteItem | null> {
    const res = await this.fetchWithFallback(BIHAR_API.INSTALLATION.ULA.STRUCTURE_EDIT_SITE(siteId), {
      method: 'GET',
      headers: this.getHeaders(),
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json?.data || null;
  }

  /* ═══════════════════════════════════════════════════════════════════════
     9. Structure Update
     POST /bihar/ula/installation/structure-update-site (multipart)
     ═══════════════════════════════════════════════════════════════════════ */
  async updateStructureSite(formData: FormData): Promise<{ success: boolean; message: string }> {
    const res = await this.fetchWithFallback(BIHAR_API.INSTALLATION.ULA.UPDATE_STRUCTURE_SITE, {
      method: 'POST',
      headers: this.getHeaders(true),
      body: formData,
    });
    const json = await res.json();
    if (!res.ok) {
      if (res.status === 422 && json?.errors) {
        const first = Object.values(json.errors).flat()[0] as string;
        throw new Error(first || json.message || 'Validation failed');
      }
      throw new Error(json?.message || `Failed to update structure (HTTP ${res.status})`);
    }
    return json;
  }

  /* ═══════════════════════════════════════════════════════════════════════
     10. Pending Install Site (Form Data)
     GET /bihar/ula/installation/pending-site?site_id=101
     ═══════════════════════════════════════════════════════════════════════ */
  async getPendingInstallSite(siteId: number | string): Promise<StructureSiteItem | null> {
    const res = await this.fetchWithFallback(BIHAR_API.INSTALLATION.ULA.PENDING_SITE(siteId), {
      method: 'GET',
      headers: this.getHeaders(),
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json?.data || null;
  }

  /* ═══════════════════════════════════════════════════════════════════════
     11. Installation Store
     POST /bihar/ula/installation/pending-site-store (multipart)
     ═══════════════════════════════════════════════════════════════════════ */
  async storeInstallation(formData: FormData): Promise<{ success: boolean; message: string; data?: any }> {
    const res = await this.fetchWithFallback(BIHAR_API.INSTALLATION.ULA.STORE_SITE, {
      method: 'POST',
      headers: this.getHeaders(true),
      body: formData,
    });
    const json = await res.json();
    if (!res.ok) {
      if (res.status === 422 && json?.errors) {
        const first = Object.values(json.errors).flat()[0] as string;
        throw new Error(first || json.message || 'Validation failed');
      }
      throw new Error(json?.message || `Failed to save installation (HTTP ${res.status})`);
    }
    return json;
  }

  /* ═══════════════════════════════════════════════════════════════════════
     12. Installation Edit Data
     GET /bihar/ula/installation/edit-site?site_id=101
     ═══════════════════════════════════════════════════════════════════════ */
  async getInstallationEditSite(siteId: number | string): Promise<StructureSiteItem | null> {
    const res = await this.fetchWithFallback(BIHAR_API.INSTALLATION.ULA.EDIT_SITE(siteId), {
      method: 'GET',
      headers: this.getHeaders(),
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json?.data || null;
  }

  /* ═══════════════════════════════════════════════════════════════════════
     13. Installation Update
     POST /bihar/ula/installation/update-site (multipart)
     ═══════════════════════════════════════════════════════════════════════ */
  async updateInstallation(formData: FormData): Promise<{ success: boolean; message: string; data?: any }> {
    const res = await this.fetchWithFallback(BIHAR_API.INSTALLATION.ULA.UPDATE_SITE, {
      method: 'POST',
      headers: this.getHeaders(true),
      body: formData,
    });
    const json = await res.json();
    if (!res.ok) {
      if (res.status === 422 && json?.errors) {
        const first = Object.values(json.errors).flat()[0] as string;
        throw new Error(first || json.message || 'Validation failed');
      }
      throw new Error(json?.message || `Failed to update installation (HTTP ${res.status})`);
    }
    return json;
  }

  /* ═══════════════════════════════════════════════════════════════════════
     14. Document Upload
     POST /bihar/ula/installation/doc-store (multipart)
     ═══════════════════════════════════════════════════════════════════════ */
  async uploadInstallationDoc(formData: FormData): Promise<{ success: boolean; message: string; data?: any }> {
    const res = await this.fetchWithFallback(BIHAR_API.INSTALLATION.ULA.DOC_STORE, {
      method: 'POST',
      headers: this.getHeaders(true),
      body: formData,
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) {
      const errDetail =
        json?.errors && typeof json.errors === 'object'
          ? Object.values(json.errors).flat().join(' ')
          : json?.message || `Failed to upload document (HTTP ${res.status})`;
      throw new Error(errDetail);
    }
    return json;
  }

  /* ═══════════════════════════════════════════════════════════════════════
     15. View Payment (Claims)
     GET /bihar/ula/installation/view-payment
     ═══════════════════════════════════════════════════════════════════════ */
  async getViewPayments(): Promise<PaymentClaimItem[]> {
    try {
      const res = await this.fetchWithFallback(BIHAR_API.INSTALLATION.ULA.VIEW_PAYMENT, {
        method: 'GET',
        headers: this.getHeaders(),
      });
      if (!res.ok) return [];
      const json = await res.json();
      return json?.data || [];
    } catch (err) {
      console.error('[ULA Installation] getViewPayments error:', err);
      return [];
    }
  }

  /* ═══════════════════════════════════════════════════════════════════════
     16. Claim Payment Details
     POST /bihar/ula/installation/claim-payment-details
     ═══════════════════════════════════════════════════════════════════════ */
  async fetchClaimEligibleSites(paymentType: string | number): Promise<any[]> {
    try {
      const res = await this.fetchWithFallback(BIHAR_API.INSTALLATION.ULA.CLAIM_PAYMENT_DETAILS, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ payment_type: paymentType }),
      });
      if (!res.ok) return [];
      const json = await res.json();
      return json?.data || [];
    } catch (err) {
      console.error('[ULA Installation] fetchClaimEligibleSites error:', err);
      return [];
    }
  }

  /* ═══════════════════════════════════════════════════════════════════════
     17. Claim Store
     POST /bihar/ula/installation/claim-store (multipart)
     ═══════════════════════════════════════════════════════════════════════ */
  async storeClaim(formData: FormData): Promise<{ success: boolean; message: string }> {
    const res = await this.fetchWithFallback(BIHAR_API.INSTALLATION.ULA.CLAIM_STORE, {
      method: 'POST',
      headers: this.getHeaders(true),
      body: formData,
    });
    const json = await res.json();
    if (!res.ok) {
      if (res.status === 422 && json?.errors) {
        const first = Object.values(json.errors).flat()[0] as string;
        throw new Error(first || json.message || 'Validation failed');
      }
      throw new Error(json?.message || `Failed to raise claim (HTTP ${res.status})`);
    }
    return json;
  }

  /* ═══════════════════════════════════════════════════════════════════════
     18. Dashboard
     GET /bihar/ula/installation/dashboard
     ═══════════════════════════════════════════════════════════════════════ */
  async getDashboardData(): Promise<UlaInstallationDashboardData | null> {
    try {
      const res = await this.fetchWithFallback(BIHAR_API.INSTALLATION.ULA.DASHBOARD, {
        method: 'GET',
        headers: this.getHeaders(),
      });
      if (!res.ok) return null;
      const json = await res.json();
      return json?.data || null;
    } catch (err) {
      console.error('[ULA Installation] getDashboardData error:', err);
      return null;
    }
  }

  /* ═══════════════════════════════════════════════════════════════════════
     19. Dashboard Site List by Status
     GET /bihar/ula/installation/view-dashboard/{status}
     ═══════════════════════════════════════════════════════════════════════ */
  async getDashboardSitesByStatus(status: string): Promise<any[]> {
    try {
      const res = await this.fetchWithFallback(BIHAR_API.INSTALLATION.ULA.DASHBOARD_BY_STATUS(status), {
        method: 'GET',
        headers: this.getHeaders(),
      });
      if (!res.ok) return [];
      const json = await res.json();
      return json?.data?.ula || [];
    } catch (err) {
      console.error('[ULA Installation] getDashboardSitesByStatus error:', err);
      return [];
    }
  }

  /* ═══════════════════════════════════════════════════════════════════════
     20. Dashboard Site List by District
     GET /bihar/ula/installation/view-dashboard/districtwise/{status}/{district}
     ═══════════════════════════════════════════════════════════════════════ */
  async getDashboardSitesByDistrict(status: string, district: string): Promise<any[]> {
    try {
      const res = await this.fetchWithFallback(
        BIHAR_API.INSTALLATION.ULA.DASHBOARD_BY_DISTRICT(status, district),
        {
          method: 'GET',
          headers: this.getHeaders(),
        }
      );
      if (!res.ok) return [];
      const json = await res.json();
      return json?.data?.ula || [];
    } catch (err) {
      console.error('[ULA Installation] getDashboardSitesByDistrict error:', err);
      return [];
    }
  }
}

export const biharUlaInstallationService = new BiharUlaInstallationService();
export default biharUlaInstallationService;
