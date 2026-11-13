import { API_BASE_URL, authService } from '../../../../services/authService';
import { BIHAR_ADMIN_API, ROOT_URL } from '../../Vendor_Management_APIS/Bihar_Vendor_API';

const R2_BASE = (
  (import.meta.env.VITE_R2_PUBLIC_URL as string | undefined) ||
  'https://pub-21d2019fecbe4a96a88c93b2f091317a.r2.dev'
).replace(/\/+$/, '');

/* ── Media Helpers ── */
export function getBiharMediaCandidates(path?: string | null): string[] {
  if (!path) return [];
  const clean = String(path).trim().replace(/\\/g, '/').replace(/^uploa\s+ds\//i, 'uploads/');
  if (!clean) return [];
  if (/^(https?:)?\/\//i.test(clean) || clean.startsWith('data:') || clean.startsWith('blob:')) {
    return [clean];
  }

  const normalized = clean.startsWith('/') ? clean.slice(1) : clean;
  const filename = normalized.split('/').pop() || normalized;
  const candidates: string[] = [];

  // 1. Primary backend URL
  candidates.push(`${ROOT_URL}/${normalized}`);

  // 2. R2 CDN
  if (R2_BASE) {
    candidates.push(`${R2_BASE}/${normalized}`);
    candidates.push(`${R2_BASE}/${filename}`);
  }

  // 3. Fallback with public/
  candidates.push(`${ROOT_URL}/public/${normalized}`);

  // 4. In case path is missing uploads/
  if (!normalized.startsWith('uploads/')) {
    candidates.push(`${ROOT_URL}/uploads/${normalized}`);
    if (R2_BASE) {
      candidates.push(`${R2_BASE}/uploads/${normalized}`);
    }
  }

  return Array.from(new Set(candidates));
}

export function resolveBiharMediaUrl(path?: string | null): string {
  const candidates = getBiharMediaCandidates(path);
  return candidates[0] || '';
}

/* ── HTTP Fetch with Candidate URLs Fallback ── */
export async function fetchWithCandidateUrls<T = any>(
  urls: string[],
  options: RequestInit = {}
): Promise<T> {
  const token = authService.getToken();
  const baseHeaders: Record<string, string> = {
    Accept: 'application/json',
  };
  if (token) {
    baseHeaders.Authorization = `Bearer ${token}`;
  }

  const isFormData = options.body instanceof FormData;
  const headers: Record<string, string> = isFormData
    ? { ...baseHeaders, ...((options.headers as Record<string, string>) || {}) }
    : { ...baseHeaders, 'Content-Type': 'application/json', ...((options.headers as Record<string, string>) || {}) };

  let lastError: any = null;

  for (const url of urls) {
    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const json = await response.json();
        if (response.ok) {
          return json;
        }
        // Even if status is 400/422, return parsed json so caller can read error message
        if (response.status === 400 || response.status === 422) {
          return json;
        }
        lastError = new Error(json?.message || `Request failed with status ${response.status}`);
      } else {
        const text = await response.text();
        if (response.ok) {
          try {
            return JSON.parse(text);
          } catch {
            return text as any;
          }
        }
        lastError = new Error(`HTTP ${response.status}: ${text.slice(0, 100)}`);
      }
    } catch (err: any) {
      lastError = err;
    }
  }

  throw lastError || new Error('All candidate URLs failed to respond');
}

/* ═══════════════════════════════════════════════════════════════════════════
   BIHAR ADMIN SERVICE
   ═══════════════════════════════════════════════════════════════════════════ */

export class BiharAdminService {
  /* ─────────────────────────────────────────────────────────────────────────
     3. BIHAR SRT 200MW SURVEY
     ───────────────────────────────────────────────────────────────────────── */

  // GET assign -> vendors & master options
  async getSrt200mwSurveyAssignMaster() {
    return fetchWithCandidateUrls(BIHAR_ADMIN_API.SRT_200MW_SURVEY.ASSIGN);
  }

  // GET fetch-site?district=...
  async getSrt200mwSites(district?: string) {
    return fetchWithCandidateUrls(BIHAR_ADMIN_API.SRT_200MW_SURVEY.FETCH_SITE(district));
  }

  // POST store-assign-survey
  async storeSrt200mwSurveyAssign(body: FormData | object) {
    return fetchWithCandidateUrls(BIHAR_ADMIN_API.SRT_200MW_SURVEY.STORE_ASSIGN, {
      method: 'POST',
      body: body instanceof FormData ? body : JSON.stringify(body),
    });
  }

  // GET view-assign-survey
  async getViewAssignSrt200mwSurveys() {
    return fetchWithCandidateUrls(BIHAR_ADMIN_API.SRT_200MW_SURVEY.VIEW_ASSIGN);
  }

  // GET view-survey
  async getViewSrt200mwSurveys() {
    return fetchWithCandidateUrls(BIHAR_ADMIN_API.SRT_200MW_SURVEY.VIEW_SURVEY);
  }

  // ANY verify-survey-status
  async verifySrt200mwSurveyStatus(payload: object) {
    return fetchWithCandidateUrls(BIHAR_ADMIN_API.SRT_200MW_SURVEY.VERIFY_STATUS, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  // Dashboard
  async getSrt200mwDashboard() {
    return fetchWithCandidateUrls(BIHAR_ADMIN_API.SRT_200MW_SURVEY.DASHBOARD);
  }

  async getSrt200mwViewDashboard(status?: string) {
    return fetchWithCandidateUrls(BIHAR_ADMIN_API.SRT_200MW_SURVEY.VIEW_DASHBOARD(status));
  }

  async getSrt200mwVendorWiseData(status: string, vendor: string) {
    return fetchWithCandidateUrls(BIHAR_ADMIN_API.SRT_200MW_SURVEY.VENDORWISE_DATA(status, vendor));
  }

  async getSrt200mwDistrictWiseData(status: string, district: string) {
    return fetchWithCandidateUrls(BIHAR_ADMIN_API.SRT_200MW_SURVEY.DISTRICTWISE_DATA(status, district));
  }

  /* ─────────────────────────────────────────────────────────────────────────
     4. BIHAR ULA SURVEY
     ───────────────────────────────────────────────────────────────────────── */

  // GET view-survey
  async getViewUlaSurveys() {
    return fetchWithCandidateUrls(BIHAR_ADMIN_API.ULA_SURVEY.VIEW_SURVEY);
  }

  // ANY verify-survey-status
  async verifyUlaSurveyStatus(payload: object) {
    return fetchWithCandidateUrls(BIHAR_ADMIN_API.ULA_SURVEY.VERIFY_STATUS, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  // ANY ajax-verify-survey-status
  async ajaxVerifyUlaSurveyStatus(payload: object) {
    return fetchWithCandidateUrls(BIHAR_ADMIN_API.ULA_SURVEY.AJAX_VERIFY_STATUS, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  /* ─────────────────────────────────────────────────────────────────────────
     5. BIHAR SSL INSTALLATION
     ───────────────────────────────────────────────────────────────────────── */

  // 5.1 Assignment & Master Data
  async getSslAssignMaster() {
    return fetchWithCandidateUrls(BIHAR_ADMIN_API.SSL_INSTALLATION.ASSIGN);
  }

  async getSslDistrictsByVolume(volume: string) {
    return fetchWithCandidateUrls(BIHAR_ADMIN_API.SSL_INSTALLATION.FETCH_DISTRICT(volume));
  }

  async getSslBlocksByDistrict(district: string) {
    return fetchWithCandidateUrls(BIHAR_ADMIN_API.SSL_INSTALLATION.FETCH_BLOCK(district));
  }

  async getSslPanchayatsByBlock(block: string) {
    return fetchWithCandidateUrls(BIHAR_ADMIN_API.SSL_INSTALLATION.FETCH_PANCHAYAT(block));
  }

  async storeSslAssign(body: FormData | object) {
    return fetchWithCandidateUrls(BIHAR_ADMIN_API.SSL_INSTALLATION.STORE_ASSIGN, {
      method: 'POST',
      body: body instanceof FormData ? body : JSON.stringify(body),
    });
  }

  async getViewAssignSsl() {
    return fetchWithCandidateUrls(BIHAR_ADMIN_API.SSL_INSTALLATION.VIEW_ASSIGN);
  }

  async approveSslAssign(id: string | number) {
    return fetchWithCandidateUrls(BIHAR_ADMIN_API.SSL_INSTALLATION.APPROVAL_ASSIGN(id), {
      method: 'POST',
    });
  }

  // 5.3 Installation Verification
  async getViewSslInstallation() {
    return fetchWithCandidateUrls(BIHAR_ADMIN_API.SSL_INSTALLATION.VIEW_INSTALLATION);
  }

  async verifySslInstallationStatus(payload: object) {
    return fetchWithCandidateUrls(BIHAR_ADMIN_API.SSL_INSTALLATION.VERIFY_INSTALLATION_STATUS, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async reverifySslCmsStatus(payload: object) {
    return fetchWithCandidateUrls(BIHAR_ADMIN_API.SSL_INSTALLATION.REVERIFY_CMS_STATUS, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  // 5.4 Claims & Payment
  async getViewSslClaims() {
    return fetchWithCandidateUrls(BIHAR_ADMIN_API.SSL_INSTALLATION.VIEW_CLAIM);
  }

  async updateSslClaimStatus(payload: object) {
    return fetchWithCandidateUrls(BIHAR_ADMIN_API.SSL_INSTALLATION.UPDATE_CLAIM_STATUS, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async getViewSslPayments(filters?: { from?: string; to?: string; vendor?: string }) {
    let urls = BIHAR_ADMIN_API.SSL_INSTALLATION.PAYMENT_VIEW;
    if (filters && (filters.from || filters.to || filters.vendor)) {
      const qs = new URLSearchParams();
      if (filters.from) qs.set('from', filters.from);
      if (filters.to) qs.set('to', filters.to);
      if (filters.vendor) qs.set('vendor', filters.vendor);
      urls = urls.map((u) => `${u}?${qs.toString()}`);
    }
    return fetchWithCandidateUrls(urls);
  }

  async updateSslPaymentStatus(payload: object) {
    return fetchWithCandidateUrls(BIHAR_ADMIN_API.SSL_INSTALLATION.PAYMENT_UPDATE_STATUS, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  // 5.5 Supply Inspection & Installation Inspection
  async getViewSslSupplyInspections() {
    return fetchWithCandidateUrls(BIHAR_ADMIN_API.SSL_INSTALLATION.VIEW_SUPPLY_INSPECTION);
  }

  async updateSslSupplyInspectionStatus(payload: object) {
    return fetchWithCandidateUrls(BIHAR_ADMIN_API.SSL_INSTALLATION.SUPPLY_INSPECTION_STATUS, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async getViewSslInspectionRequests() {
    return fetchWithCandidateUrls(BIHAR_ADMIN_API.SSL_INSTALLATION.VIEW_INSPECTION_REQUEST);
  }

  async updateSslInspectionStatus(payload: object) {
    return fetchWithCandidateUrls(BIHAR_ADMIN_API.SSL_INSTALLATION.INSPECTION_STATUS, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  /* ─────────────────────────────────────────────────────────────────────────
     6. BIHAR SRT INSTALLATION
     ───────────────────────────────────────────────────────────────────────── */

  async getSrtAssignMaster() {
    return fetchWithCandidateUrls(BIHAR_ADMIN_API.SRT_INSTALLATION.ASSIGN);
  }

  async getSrtDistricts() {
    return fetchWithCandidateUrls(BIHAR_ADMIN_API.SRT_INSTALLATION.FETCH_DISTRICT);
  }

  async getSrtSites(district?: string) {
    return fetchWithCandidateUrls(BIHAR_ADMIN_API.SRT_INSTALLATION.FETCH_SITE(district));
  }

  async storeSrtAssign(body: FormData | object) {
    return fetchWithCandidateUrls(BIHAR_ADMIN_API.SRT_INSTALLATION.STORE_ASSIGN, {
      method: 'POST',
      body: body instanceof FormData ? body : JSON.stringify(body),
    });
  }

  async getViewAssignSrt() {
    return fetchWithCandidateUrls(BIHAR_ADMIN_API.SRT_INSTALLATION.VIEW_ASSIGN);
  }

  async approveSrtAssign(id: string | number) {
    return fetchWithCandidateUrls(BIHAR_ADMIN_API.SRT_INSTALLATION.APPROVAL_ASSIGN(id), {
      method: 'POST',
    });
  }

  async getViewSrtInstallation() {
    return fetchWithCandidateUrls(BIHAR_ADMIN_API.SRT_INSTALLATION.VIEW_INSTALLATION);
  }

  async verifySrtInstallationStatus(body: FormData | object) {
    return fetchWithCandidateUrls(BIHAR_ADMIN_API.SRT_INSTALLATION.VERIFY_INSTALLATION_STATUS, {
      method: 'POST',
      body: body instanceof FormData ? body : JSON.stringify(body),
    });
  }

  async verifySrtInstallationDocStatus(payload: object) {
    return fetchWithCandidateUrls(BIHAR_ADMIN_API.SRT_INSTALLATION.VERIFY_INSTALLATION_DOC_STATUS, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async getViewSrtClaims() {
    return fetchWithCandidateUrls(BIHAR_ADMIN_API.SRT_INSTALLATION.VIEW_CLAIMS);
  }

  async updateSrtClaimStatus(payload: object) {
    return fetchWithCandidateUrls(BIHAR_ADMIN_API.SRT_INSTALLATION.UPDATE_CLAIM_STATUS, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async updateSrtInspectionStatus(payload: object) {
    return fetchWithCandidateUrls(BIHAR_ADMIN_API.SRT_INSTALLATION.INSPECTION_UPDATE_STATUS, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async getViewSrtPayments(filters?: { from?: string; to?: string; vendor?: string }) {
    let urls = BIHAR_ADMIN_API.SRT_INSTALLATION.PAYMENT_VIEW;
    if (filters && (filters.from || filters.to || filters.vendor)) {
      const qs = new URLSearchParams();
      if (filters.from) qs.set('from', filters.from);
      if (filters.to) qs.set('to', filters.to);
      if (filters.vendor) qs.set('vendor', filters.vendor);
      urls = urls.map((u) => `${u}?${qs.toString()}`);
    }
    return fetchWithCandidateUrls(urls);
  }

  async updateSrtPaymentStatus(payload: object) {
    return fetchWithCandidateUrls(BIHAR_ADMIN_API.SRT_INSTALLATION.PAYMENT_UPDATE_STATUS, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async verifySrtPay3(payload: object) {
    return fetchWithCandidateUrls(BIHAR_ADMIN_API.SRT_INSTALLATION.VERIFY_PAY3, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  /* ─────────────────────────────────────────────────────────────────────────
     7. BIHAR ULA INSTALLATION
     ───────────────────────────────────────────────────────────────────────── */
  async getUlaAssignMaster() {
    return fetchWithCandidateUrls(BIHAR_ADMIN_API.ULA_INSTALLATION.ASSIGN);
  }

  async getUlaAssignForm() {
    return this.getUlaAssignMaster();
  }

  async getUlaDistricts(volume: string = 'all') {
    return fetchWithCandidateUrls(BIHAR_ADMIN_API.ULA_INSTALLATION.FETCH_DISTRICT(volume));
  }

  async getUlaBlocks(arg1?: any, arg2?: any) {
    const district = typeof arg1 === 'string' ? (arg2 || arg1) : arg1?.district;
    let urls = BIHAR_ADMIN_API.ULA_INSTALLATION.FETCH_BLOCK;
    if (district) {
      urls = urls.map((u) => `${u}?district=${encodeURIComponent(district)}`);
    }
    return fetchWithCandidateUrls(urls);
  }

  async getUlaVillages(arg1?: any, arg2?: any) {
    const block = typeof arg1 === 'string' ? arg1 : arg1?.block;
    const district = typeof arg2 === 'string' ? arg2 : arg1?.district;
    let urls = BIHAR_ADMIN_API.ULA_INSTALLATION.FETCH_VILLAGE;
    const qs = new URLSearchParams();
    if (block) qs.set('block', block);
    if (district) qs.set('district', district);
    if (qs.toString()) {
      urls = urls.map((u) => `${u}?${qs.toString()}`);
    }
    return fetchWithCandidateUrls(urls);
  }

  async getUlaBeneficiaries(arg1?: any, arg2?: any) {
    const village = typeof arg1 === 'string' ? arg1 : arg1?.village;
    const block = typeof arg2 === 'string' ? arg2 : arg1?.block;
    const district = arg1?.district;
    let urls = BIHAR_ADMIN_API.ULA_INSTALLATION.FETCH_BENEFICIARY_NAME;
    const qs = new URLSearchParams();
    if (village) qs.set('village', village);
    if (block) qs.set('block', block);
    if (district) qs.set('district', district);
    if (qs.toString()) {
      urls = urls.map((u) => `${u}?${qs.toString()}`);
    }
    return fetchWithCandidateUrls(urls);
  }

  async storeUlaAssign(body: FormData | object) {
    return fetchWithCandidateUrls(BIHAR_ADMIN_API.ULA_INSTALLATION.STORE_ASSIGN, {
      method: 'POST',
      body: body instanceof FormData ? body : JSON.stringify(body),
    });
  }

  async getViewAssignUla() {
    return fetchWithCandidateUrls(BIHAR_ADMIN_API.ULA_INSTALLATION.VIEW_ASSIGN);
  }

  async approveUlaAssign(id: string | number) {
    return fetchWithCandidateUrls(BIHAR_ADMIN_API.ULA_INSTALLATION.APPROVAL_ASSIGN(id), {
      method: 'POST',
    });
  }

  async approvalUlaAssign(id: string | number) {
    return this.approveUlaAssign(id);
  }

  async getViewUlaInstallation() {
    return fetchWithCandidateUrls(BIHAR_ADMIN_API.ULA_INSTALLATION.VIEW_INSTALLATION);
  }

  async verifyUlaInstallationStatus(payload: object) {
    return fetchWithCandidateUrls(BIHAR_ADMIN_API.ULA_INSTALLATION.VERIFY_INSTALLATION_STATUS, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async getViewUlaDocument() {
    return fetchWithCandidateUrls(BIHAR_ADMIN_API.ULA_INSTALLATION.VIEW_DOCUMENT);
  }

  async verifyUlaDocStatus(payload: object) {
    return fetchWithCandidateUrls(BIHAR_ADMIN_API.ULA_INSTALLATION.VERIFY_INSTALLATION_DOC_STATUS, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async getViewUlaClaim() {
    return fetchWithCandidateUrls(BIHAR_ADMIN_API.ULA_INSTALLATION.VIEW_CLAIM);
  }

  async updateUlaClaimStatus(payload: object) {
    return fetchWithCandidateUrls(BIHAR_ADMIN_API.ULA_INSTALLATION.UPDATE_CLAIM_STATUS, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async getViewUlaPayments(filters?: { from?: string; to?: string; vendor?: string; status?: string }) {
    let urls = BIHAR_ADMIN_API.ULA_INSTALLATION.PAYMENT_VIEW;
    if (filters) {
      const qs = new URLSearchParams();
      if (filters.from) qs.set('from', filters.from);
      if (filters.to) qs.set('to', filters.to);
      if (filters.vendor) qs.set('vendor', filters.vendor);
      if (filters.status) qs.set('status', filters.status);
      if (qs.toString()) {
        urls = urls.map((u) => `${u}?${qs.toString()}`);
      }
    }
    return fetchWithCandidateUrls(urls);
  }

  async getViewUlaPayment(filters?: { from?: string; to?: string; vendor?: string; status?: string }) {
    return this.getViewUlaPayments(filters);
  }

  async updateUlaPaymentStatus(payload: object) {
    return fetchWithCandidateUrls(BIHAR_ADMIN_API.ULA_INSTALLATION.PAYMENT_UPDATE_STATUS, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async getUlaDashboard() {
    return fetchWithCandidateUrls(BIHAR_ADMIN_API.ULA_INSTALLATION.DASHBOARD);
  }

  async getUlaInstallationDashboard() {
    return this.getUlaDashboard();
  }

  async getViewUlaDashboard(status: string) {
    return fetchWithCandidateUrls(BIHAR_ADMIN_API.ULA_INSTALLATION.VIEW_DASHBOARD(status));
  }

  async getViewUlaDashboardVendorwise(status: string, vendor: string) {
    return fetchWithCandidateUrls(BIHAR_ADMIN_API.ULA_INSTALLATION.VIEW_DASHBOARD_VENDORWISE(status, vendor));
  }

  async getViewUlaDashboardDistrictwise(status: string, district: string) {
    return fetchWithCandidateUrls(BIHAR_ADMIN_API.ULA_INSTALLATION.VIEW_DASHBOARD_DISTRICTWISE(status, district));
  }

  async getViewUlaStructure() {
    return fetchWithCandidateUrls(BIHAR_ADMIN_API.ULA_INSTALLATION.VIEW_STRUCTURE);
  }

  async verifyUlaStructureStatus(payload: object) {
    return fetchWithCandidateUrls(BIHAR_ADMIN_API.ULA_INSTALLATION.STRUCTURE_VERIFY_STATUS, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async updateUlaStructureVerifyStatus(payload: object) {
    return this.verifyUlaStructureStatus(payload);
  }

  async updateUlaModuleSerial(payload: object) {
    return fetchWithCandidateUrls(BIHAR_ADMIN_API.ULA_INSTALLATION.MODULE_SERIAL_UPDATE, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  /* ─────────────────────────────────────────────────────────────────────────
     8. BIHAR SSL AMC
     ───────────────────────────────────────────────────────────────────────── */
  async getSslAmcAssignVendorMaster() {
    return fetchWithCandidateUrls(BIHAR_ADMIN_API.SSL_AMC.ASSIGN_VENDOR);
  }

  async assignSslAmc(body: FormData | object) {
    return fetchWithCandidateUrls(BIHAR_ADMIN_API.SSL_AMC.ASSIGN, {
      method: 'POST',
      body: body instanceof FormData ? body : JSON.stringify(body),
    });
  }

  async getSslAmcDistricts() {
    return fetchWithCandidateUrls(BIHAR_ADMIN_API.SSL_AMC.GET_DISTRICT);
  }

  async getSslAmcBlocks(district?: string) {
    let urls = BIHAR_ADMIN_API.SSL_AMC.GET_BLOCKS;
    if (district) {
      urls = urls.map((u) => `${u}?district=${encodeURIComponent(district)}`);
    }
    return fetchWithCandidateUrls(urls);
  }

  async getSslAmcPanchayats(block?: string) {
    let urls = BIHAR_ADMIN_API.SSL_AMC.GET_PANCHAYATS;
    if (block) {
      urls = urls.map((u) => `${u}?block=${encodeURIComponent(block)}`);
    }
    return fetchWithCandidateUrls(urls);
  }

  async getSslAmcWards(panchayat?: string) {
    let urls = BIHAR_ADMIN_API.SSL_AMC.GET_WARD;
    if (panchayat) {
      urls = urls.map((u) => `${u}?panchayat=${encodeURIComponent(panchayat)}`);
    }
    return fetchWithCandidateUrls(urls);
  }

  async getViewSslAmcData() {
    return fetchWithCandidateUrls(BIHAR_ADMIN_API.SSL_AMC.VIEW_DATA);
  }

  async getVerifySslAmc() {
    return fetchWithCandidateUrls(BIHAR_ADMIN_API.SSL_AMC.VERIFY_AMC);
  }

  async verifySslAmcStatus(payload: object) {
    return fetchWithCandidateUrls(BIHAR_ADMIN_API.SSL_AMC.VERIFY_AMC_STATUS, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async getSslAmcDashboard() {
    return fetchWithCandidateUrls(BIHAR_ADMIN_API.SSL_AMC.AMC_DASHBOARD);
  }

  /* ─────────────────────────────────────────────────────────────────────────
     9. BIHAR SRT AMC
     ───────────────────────────────────────────────────────────────────────── */
  async getSrtAmcAssignVendorMaster() {
    return fetchWithCandidateUrls(BIHAR_ADMIN_API.SRT_AMC.ASSIGN_VENDOR);
  }

  async getSrtAmcDistricts() {
    return fetchWithCandidateUrls(BIHAR_ADMIN_API.SRT_AMC.GET_DISTRICT_NAME);
  }

  async getSrtAmcSites(district?: string) {
    let urls = BIHAR_ADMIN_API.SRT_AMC.GET_SITE_NAME;
    if (district) {
      urls = urls.map((u) => `${u}?district=${encodeURIComponent(district)}`);
    }
    return fetchWithCandidateUrls(urls);
  }

  async getViewAssignSrtAmc() {
    return fetchWithCandidateUrls(BIHAR_ADMIN_API.SRT_AMC.VIEW_ASSIGN);
  }

  async assignSrtAmc(body: FormData | object) {
    return fetchWithCandidateUrls(BIHAR_ADMIN_API.SRT_AMC.ASSIGN_AMC, {
      method: 'POST',
      body: body instanceof FormData ? body : JSON.stringify(body),
    });
  }

  async getViewInstallationSrtAmc() {
    return fetchWithCandidateUrls(BIHAR_ADMIN_API.SRT_AMC.VIEW_INSTALLATION_AMC);
  }

  async verifySrtAmcStatus(payload: object) {
    return fetchWithCandidateUrls(BIHAR_ADMIN_API.SRT_AMC.VERIFY_AMC_STATUS, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async getSrtAmcDashboard() {
    return fetchWithCandidateUrls(BIHAR_ADMIN_API.SRT_AMC.AMC_DASHBOARD);
  }
}

export const biharAdminService = new BiharAdminService();
export default biharAdminService;
