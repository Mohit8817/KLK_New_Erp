import { API_BASE_URL } from '../../../services/authService';

const RAW_BASE = (API_BASE_URL || 'https://klkerp.com/api').replace(/\/+$/, '');
export const API_ROOT = RAW_BASE.endsWith('/api') ? RAW_BASE : `${RAW_BASE}/api`;
export const ROOT_URL = RAW_BASE.replace(/\/api\/?$/, '');

/**
 * Build candidate URLs for a given route path (supporting both /api/admin/... and /admin/...)
 */
export function buildCandidateUrls(path: string): string[] {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  const candidates: string[] = [];

  // 1. With /api/admin prefix (standard API route)
  candidates.push(`${API_ROOT}${cleanPath}`);

  // 2. Direct with ROOT_URL (web route or non-api prefixed backend route)
  candidates.push(`${ROOT_URL}${cleanPath}`);

  // 3. Without /admin prefix if path starts with /admin (e.g. /api/bihar/... and /bihar/...)
  if (cleanPath.startsWith('/admin/')) {
    const nonAdminPath = cleanPath.replace(/^\/admin/, '');
    candidates.push(`${API_ROOT}${nonAdminPath}`);
    candidates.push(`${ROOT_URL}${nonAdminPath}`);
  }

  // 4. Fallback with RAW_BASE
  if (RAW_BASE !== API_ROOT && RAW_BASE !== ROOT_URL) {
    candidates.push(`${RAW_BASE}${cleanPath}`);
  }

  return Array.from(new Set(candidates));
}

/* ═══════════════════════════════════════════════════════════════════════════
   BIHAR SUPER ADMIN & VENDOR MANAGEMENT APIS
   Controller Prefixes from Laravel Backend
   ═══════════════════════════════════════════════════════════════════════════ */

export const BIHAR_ADMIN_API = {
  // ── 3. Bihar SRT 200MW Survey ──
  // Controller: Biharsrt200mwSurveyController · Prefix: /admin/bihar/srt200mw/survey/
  SRT_200MW_SURVEY: {
    ASSIGN: buildCandidateUrls('/admin/bihar/srt200mw/survey/assign'),
    FETCH_SITE: (district?: string) =>
      buildCandidateUrls(
        district
          ? `/admin/bihar/srt200mw/survey/fetch-site?district=${encodeURIComponent(district)}`
          : '/admin/bihar/srt200mw/survey/fetch-site'
      ),
    STORE_ASSIGN: buildCandidateUrls('/admin/bihar/srt200mw/survey/store-assign-survey'),
    VIEW_ASSIGN: Array.from(new Set([
      // Primary standard endpoint patterns (view-assign)
      ...buildCandidateUrls('/admin/bihar/srt200mw/survey/view-assign'),
      ...buildCandidateUrls('/bihar/srt200mw/survey/view-assign'),
      ...buildCandidateUrls('/admin/bihar/srt200mw/view-assign'),
      ...buildCandidateUrls('/bihar/srt200mw/view-assign'),

      // Controller-named patterns (view-assign-survey)
      ...buildCandidateUrls('/admin/bihar/srt200mw/survey/view-assign-survey'),
      ...buildCandidateUrls('/bihar/srt200mw/survey/view-assign-survey'),
      ...buildCandidateUrls('/admin/bihar/srt200mw/view-assign-survey'),
      ...buildCandidateUrls('/bihar/srt200mw/view-assign-survey'),

      // UI route matching patterns (assign-view)
      ...buildCandidateUrls('/admin/bihar/srt200mw/survey/assign-view'),
      ...buildCandidateUrls('/admin/bihar/srt200mw-survey-assign-view'),
      ...buildCandidateUrls('/bihar/srt200mw/survey/assign-view'),
      ...buildCandidateUrls('/bihar/srt200mw-survey-assign-view'),
      ...buildCandidateUrls('/bihar/srt200mw-survey/assign-view'),

      // Unified survey view & vendor portal endpoints
      ...buildCandidateUrls('/bihar/srt200mw-view-survey'),
      ...buildCandidateUrls('/admin/bihar/srt200mw/survey/view-survey'),
      ...buildCandidateUrls('/bihar/srt200mw/survey/view-survey'),
      ...buildCandidateUrls('/bihar/srt200mw-survey'),
      ...buildCandidateUrls('/v/bihar/view-srt200mw-survey'),
      ...buildCandidateUrls('/bihar/view-srt200mw-survey'),
    ])),
    APPROVAL_ASSIGN: (id: string | number) =>
      Array.from(new Set([
        ...buildCandidateUrls(`/admin/bihar/srt200mw/survey/approval-assign/${encodeURIComponent(id)}`),
        ...buildCandidateUrls(`/admin/bihar/srt200mw/survey/approvel-assign/${encodeURIComponent(id)}`),
        ...buildCandidateUrls(`/bihar/srt200mw/survey/approval-assign/${encodeURIComponent(id)}`),
        ...buildCandidateUrls(`/bihar/srt200mw/survey/approvel-assign/${encodeURIComponent(id)}`),
      ])),
    VIEW_SURVEY: buildCandidateUrls('/admin/bihar/srt200mw/survey/view-survey'),
    VERIFY_STATUS: buildCandidateUrls('/admin/bihar/srt200mw/survey/verify-survey-status'),
    DASHBOARD: buildCandidateUrls('/admin/bihar/srt200mw/survey/dashbboard'),
    VIEW_DASHBOARD: (status?: string) =>
      buildCandidateUrls(
        status
          ? `/admin/bihar/srt200mw/survey/view-dashbboard/${encodeURIComponent(status)}`
          : '/admin/bihar/srt200mw/survey/view-dashbboard'
      ),
    VENDORWISE_DATA: (status: string, vendor: string) =>
      buildCandidateUrls(`/admin/bihar/srt200mw/survey/vendorwise-data/${encodeURIComponent(status)}/${encodeURIComponent(vendor)}`),
    DISTRICTWISE_DATA: (status: string, district: string) =>
      buildCandidateUrls(`/admin/bihar/srt200mw/survey/districtwise-data/${encodeURIComponent(status)}/${encodeURIComponent(district)}`),
  },

  // ── 4. Bihar ULA Survey ──
  // Controller: BiharUlaSurveyController · Prefix: /admin/bihar/ula/survey/
  ULA_SURVEY: {
    VIEW_SURVEY: buildCandidateUrls('/admin/bihar/ula/survey/view-survey'),
    VERIFY_STATUS: buildCandidateUrls('/admin/bihar/ula/survey/verify-survey-status'),
    AJAX_VERIFY_STATUS: buildCandidateUrls('/admin/bihar/ula/survey/ajax-verify-survey-status'),
  },

  // ── 5. Bihar SSL Installation ──
  // Controller: BiharSslInstallationController · Prefix: /admin/bihar/ssl/installation/
  SSL_INSTALLATION: {
    // 5.1 Assignment & Master Data
    ASSIGN: buildCandidateUrls('/admin/bihar/ssl/installation/assign'),
    STORE_ASSIGN: buildCandidateUrls('/admin/bihar/ssl/installation/store-assign'),
    VIEW_ASSIGN: buildCandidateUrls('/admin/bihar/ssl/installation/view-assign'),
    EDIT_ASSIGN: (id: string | number) =>
      buildCandidateUrls(`/admin/bihar/ssl/installation/edit-assign/${encodeURIComponent(id)}`),
    UPDATE_ASSIGN: buildCandidateUrls('/admin/bihar/ssl/installation/update-assign'),
    VENDOR_WISE_DETAILS: (id: string | number) =>
      buildCandidateUrls(`/admin/bihar/ssl/installation/vendor-wise-details/${encodeURIComponent(id)}`),
    FETCH_DISTRICT: (volume: string) =>
      buildCandidateUrls(`/admin/bihar/ssl/installation/fetch-district/${encodeURIComponent(volume)}`),
    FETCH_BLOCK: (district: string) =>
      buildCandidateUrls(`/admin/bihar/ssl/installation/fetch-block/${encodeURIComponent(district)}`),
    FETCH_PANCHAYAT: (block: string) =>
      buildCandidateUrls(`/admin/bihar/ssl/installation/fetch-panchayat/${encodeURIComponent(block)}`),
    APPROVAL_ASSIGN: (id: string | number) =>
      buildCandidateUrls(`/admin/bihar/ssl/installation/approval-assign/${encodeURIComponent(id)}`),
    PAYMENT_FILTER: buildCandidateUrls('/admin/bihar/ssl/installation/payment-filter'),
    MATCH_MATERIAL: buildCandidateUrls('/admin/bihar/ssl/installation/match-material'),

    // 5.2 Material Import
    SIM_IMPORT: buildCandidateUrls('/admin/bihar/ssl/installation/sim-import'),
    PANEL_IMPORT: buildCandidateUrls('/admin/bihar/ssl/installation/panel-import'),
    BATTERY_IMPORT: buildCandidateUrls('/admin/bihar/ssl/installation/battery-import'),
    IMEI_IMPORT: buildCandidateUrls('/admin/bihar/ssl/installation/imei-import'),

    // 5.3 Installation Verification
    VIEW_INSTALLATION: buildCandidateUrls('/admin/bihar/ssl/installation/view-installation'),
    VERIFY_INSTALLATION_STATUS: buildCandidateUrls('/admin/bihar/ssl/installation/verify-installation-status'),
    REVERIFY_CMS_STATUS: buildCandidateUrls('/admin/bihar/ssl/installation/reverify-cms-status'),
    PUSH_SINGLE_VERIFIED_DATA: buildCandidateUrls('/admin/bihar/ssl/installation/push-single-verified-data'),

    // 5.4 Claims & Payment
    VIEW_CLAIM: buildCandidateUrls('/admin/bihar/ssl/installation/view-claim'),
    DOWNLOAD_CLAIM_PDF: buildCandidateUrls('/admin/bihar/ssl/installation/download_claim_pdf'),
    UPDATE_CLAIM_STATUS: buildCandidateUrls('/admin/bihar/ssl/installation/update-claim-status'),
    VIEW_CLAIM_DETAIL: (id: string | number) =>
      buildCandidateUrls(`/admin/bihar/ssl/installation/view-claim-detail/${encodeURIComponent(id)}`),
    PAYMENT_VIEW: buildCandidateUrls('/admin/bihar/ssl/installation/payment-view'),
    PAYMENT_UPDATE_STATUS: buildCandidateUrls('/admin/bihar/ssl/installation/payment-update-status'),
    APPROVAL_MANUAL_PAYMENT: (id: string | number) =>
      buildCandidateUrls(`/admin/bihar/ssl/installation/approval-manual-payment/${encodeURIComponent(id)}`),

    // 5.5 Supply Inspection & Installation Inspection
    VIEW_SUPPLY_INSPECTION: buildCandidateUrls('/admin/bihar/ssl/installation/view-supply-inspection'),
    SUPPLY_INSPECTION_STATUS: buildCandidateUrls('/admin/bihar/ssl/installation/supply-inspection-status'),
    SUPPLY_INSPECTION_CLAIM_PDF: buildCandidateUrls('/admin/bihar/ssl/installation/supply_inspection_claim_pdf'),
    VIEW_INSPECTION_REQUEST: buildCandidateUrls('/admin/bihar/ssl/installation/view-inspection-request'),
    INSPECTION_STATUS: buildCandidateUrls('/admin/bihar/ssl/installation/inspection-status'),
    INSPECTION_CLAIM_PDF: buildCandidateUrls('/admin/bihar/ssl/installation/inspection_claim_pdf'),
    VIEW_INSPECTION: (id: string | number) =>
      buildCandidateUrls(`/admin/bihar/ssl/installation/view-inspection/${encodeURIComponent(id)}`),
    INSPECTION_PAYMENT_STATUS: (id: string | number) =>
      buildCandidateUrls(`/admin/bihar/ssl/installation/inspection-payment-status/${encodeURIComponent(id)}`),

    // 5.6 Dashboard
    DASHBOARD: buildCandidateUrls('/admin/bihar/ssl/installation/dashboard'),
    DASHBOARD_VIEW_DATA: (volume: string, status?: string) =>
      buildCandidateUrls(
        status
          ? `/admin/bihar/ssl/installation/dashboard-view-data/${encodeURIComponent(status)}/${encodeURIComponent(volume)}`
          : `/admin/bihar/ssl/installation/dashboard-view-data/${encodeURIComponent(volume)}`
      ),
    VENDORWISE_VIEW_DATA: (status: string, vendor: string, volume?: string) =>
      buildCandidateUrls(
        volume
          ? `/admin/bihar/ssl/installation/vendorwise-view-data/${encodeURIComponent(status)}/${encodeURIComponent(volume)}/${encodeURIComponent(vendor)}`
          : `/admin/bihar/ssl/installation/vendorwise-view-data/${encodeURIComponent(status)}/${encodeURIComponent(vendor)}`
      ),
    DISTRICTWISE_VIEW_DATA: (status: string, district: string, volume?: string) =>
      buildCandidateUrls(
        volume
          ? `/admin/bihar/ssl/installation/districtwise-view-data/${encodeURIComponent(status)}/${encodeURIComponent(volume)}/${encodeURIComponent(district)}`
          : `/admin/bihar/ssl/installation/districtwise-view-data/${encodeURIComponent(status)}/${encodeURIComponent(district)}`
      ),
  },

  // ── 6. Bihar SRT Installation ──
  // Controller: BiharSrtInstallationController · Prefix: /admin/bihar/srt/installation/
  SRT_INSTALLATION: {
    ASSIGN: buildCandidateUrls('/admin/bihar/srt/installation/assign'),
    FETCH_DISTRICT: buildCandidateUrls('/admin/bihar/srt/installation/fetch-district'),
    FETCH_SITE: (district?: string) =>
      buildCandidateUrls(
        district
          ? `/admin/bihar/srt/installation/fetch-site?district=${encodeURIComponent(district)}`
          : '/admin/bihar/srt/installation/fetch-site'
      ),
    STORE_ASSIGN: buildCandidateUrls('/admin/bihar/srt/installation/store-assign'),
    EDIT_ASSIGN: (id: string | number) =>
      buildCandidateUrls(`/admin/bihar/srt/installation/edit-assign/${encodeURIComponent(id)}`),
    UPDATE_ASSIGN: (id: string | number) =>
      buildCandidateUrls(`/admin/bihar/srt/installation/update-assign/${encodeURIComponent(id)}`),
    VIEW_ASSIGN: buildCandidateUrls('/admin/bihar/srt/installation/view-assign'),
    VIEW_ASSIGN_DETAILS: (id: string | number) =>
      buildCandidateUrls(`/admin/bihar/srt/installation/view-assign-details/${encodeURIComponent(id)}`),
    VERIFY: buildCandidateUrls('/admin/bihar/srt/installation/verify'),
    APPROVAL_ASSIGN: (id: string | number) =>
      buildCandidateUrls(`/admin/bihar/srt/installation/approval-assign/${encodeURIComponent(id)}`),
    VIEW_INSTALLATION: buildCandidateUrls('/admin/bihar/srt/installation/view-installation'),
    VERIFY_INSTALLATION_STATUS: buildCandidateUrls('/admin/bihar/srt/installation/verify-installation-status'),
    VERIFY_INSTALLATION_DOC_STATUS: buildCandidateUrls('/admin/bihar/srt/installation/verify-installation-doc-status'),
    VIEW_CLAIMS: buildCandidateUrls('/admin/bihar/srt/installation/view-claims'),
    UPDATE_CLAIM_STATUS: buildCandidateUrls('/admin/bihar/srt/installation/update-claim-status'),
    INSPECTION_UPDATE_STATUS: buildCandidateUrls('/admin/bihar/srt/installation/inspection-update-status'),
    PAYMENT_VIEW: buildCandidateUrls('/admin/bihar/srt/installation/payment-view'),
    PAYMENT_UPDATE_STATUS: buildCandidateUrls('/admin/bihar/srt/installation/payment-update-status'),
    VIEW_DATA: buildCandidateUrls('/admin/bihar/srt/installation/view-data'),
    VERIFY_PAY3: buildCandidateUrls('/admin/bihar/srt/installation/verify-pay3'),
    PAYMENT_FILTER: buildCandidateUrls('/admin/bihar/srt/installation/payment-filter'),
    DASHBOARD: buildCandidateUrls('/admin/bihar/srt/installation/dashboard'),
    DASHBOARD_VIEW_DATA: (status: string) =>
      buildCandidateUrls(`/admin/bihar/srt/installation/dashboard-view-data/${encodeURIComponent(status)}`),
    VENDORWISE_DATA: (status: string, vendor: string) =>
      buildCandidateUrls(`/admin/bihar/srt/installation/vendorwise-data/${encodeURIComponent(status)}/${encodeURIComponent(vendor)}`),
    DISTRICTWISE_DATA: (status: string, district: string) =>
      buildCandidateUrls(`/admin/bihar/srt/installation/districtwise-data/${encodeURIComponent(status)}/${encodeURIComponent(district)}`),
  },

  // ── 7. Bihar ULA Installation ──
  // Controller: BiharUlaInstallationController · Prefix: /admin/bihar/ula/installation/
  ULA_INSTALLATION: {
    ASSIGN: buildCandidateUrls('/admin/bihar/ula/installation/assign'),
    FETCH_DISTRICT: (volume: string) =>
      buildCandidateUrls(`/admin/bihar/ula/installation/fetch-district/${encodeURIComponent(volume)}`),
    FETCH_BLOCK: buildCandidateUrls('/admin/bihar/ula/installation/fetch-block'),
    FETCH_VILLAGE: buildCandidateUrls('/admin/bihar/ula/installation/fetch-village'),
    FETCH_BENEFICIARY_NAME: buildCandidateUrls('/admin/bihar/ula/installation/fetch-beneficiary-name'),
    STORE_ASSIGN: buildCandidateUrls('/admin/bihar/ula/installation/store-assign'),
    VIEW_ASSIGN: buildCandidateUrls('/admin/bihar/ula/installation/view-assign'),
    APPROVAL_ASSIGN: (id: string | number) =>
      buildCandidateUrls(`/admin/bihar/ula/installation/approval-assign/${encodeURIComponent(id)}`),
    VIEW_INSTALLATION: buildCandidateUrls('/admin/bihar/ula/installation/view-installation'),
    VERIFY_INSTALLATION_STATUS: buildCandidateUrls('/admin/bihar/ula/installation/verify-installation-status'),
    VIEW_DOCUMENT: buildCandidateUrls('/admin/bihar/ula/installation/view-document'),
    VERIFY_INSTALLATION_DOC_STATUS: buildCandidateUrls('/admin/bihar/ula/installation/verify-installation_doc-status'),
    VIEW_CLAIM: buildCandidateUrls('/admin/bihar/ula/installation/view-claim'),
    UPDATE_CLAIM_STATUS: buildCandidateUrls('/admin/bihar/ula/installation/update-claim-status'),
    PAYMENT_VIEW: buildCandidateUrls('/admin/bihar/ula/installation/payment-view'),
    PAYMENT_UPDATE_STATUS: buildCandidateUrls('/admin/bihar/ula/installation/payment-update-status'),
    DASHBOARD: buildCandidateUrls('/admin/bihar/ula/installation/dashboard'),
    VIEW_DASHBOARD: (status: string) =>
      buildCandidateUrls(`/admin/bihar/ula/installation/view-dashboard/${encodeURIComponent(status)}`),
    VIEW_DASHBOARD_VENDORWISE: (status: string, vendor: string) =>
      buildCandidateUrls(`/admin/bihar/ula/installation/view-dashboard/vendorwise/${encodeURIComponent(status)}/${encodeURIComponent(vendor)}`),
    VIEW_DASHBOARD_DISTRICTWISE: (status: string, district: string) =>
      buildCandidateUrls(`/admin/bihar/ula/installation/view-dashboard/districtwise/${encodeURIComponent(status)}/${encodeURIComponent(district)}`),
    VIEW_STRUCTURE: buildCandidateUrls('/admin/bihar/ula/installation/view-structure'),
    STRUCTURE_VERIFY_STATUS: buildCandidateUrls('/admin/bihar/ula/installation/structure-verify-status'),
    MODULE_SERIAL_UPDATE: buildCandidateUrls('/admin/bihar/ula/installtion/module-serial-update'),
  },

  // ── 8. Bihar SSL AMC ──
  // Controller: BiharSslAssignAmcConroller · Prefix: /admin/bihar/ssl/installation/
  SSL_AMC: {
    ASSIGN_VENDOR: buildCandidateUrls('/admin/bihar/ssl/installation/amc-assign-vendor'),
    ASSIGN: buildCandidateUrls('/admin/bihar/ssl/installation/assign'),
    GET_DISTRICT: buildCandidateUrls('/admin/bihar/ssl/installation/get-district'),
    GET_BLOCKS: buildCandidateUrls('/admin/bihar/ssl/installation/get-blocks'),
    GET_PANCHAYATS: buildCandidateUrls('/admin/bihar/ssl/installation/get-panchayats'),
    GET_WARD: buildCandidateUrls('/admin/bihar/ssl/installation/get-ward'),
    VIEW_DATA: buildCandidateUrls('/admin/bihar/ssl/installation/view-data'),
    EDIT_DATA: buildCandidateUrls('/admin/bihar/ssl/installation/edit-data'),
    FETCH_DATA: (id: string | number) =>
      buildCandidateUrls(`/admin/bihar/ssl/installation/fetch-data/${encodeURIComponent(id)}`),
    UPDATE_DATA: buildCandidateUrls('/admin/bihar/ssl/installation/update-data'),
    VIEW_AMC: (id: string | number) =>
      buildCandidateUrls(`/admin/bihar/ssl/installation/view-amc/${encodeURIComponent(id)}`),
    VERIFY_AMC: buildCandidateUrls('/admin/bihar/ssl/installation/verify-amc'),
    VERIFY_AMC_STATUS: buildCandidateUrls('/admin/bihar/ssl/installation/verify-amc-status'),
    AMC_DASHBOARD: buildCandidateUrls('/admin/bihar/ssl/installation/amc-dashboard'),
  },

  // ── 9. Bihar SRT AMC ──
  // Controller: BiharSrtAssignAmcConroller · Prefix: /admin/bihar/srt/installation/
  SRT_AMC: {
    ASSIGN_VENDOR: buildCandidateUrls('/admin/bihar/srt/installation/assign-vendor'),
    GET_DISTRICT_NAME: buildCandidateUrls('/admin/bihar/srt/installation/get-district-name'),
    GET_SITE_NAME: buildCandidateUrls('/admin/bihar/srt/installation/get-site-name'),
    VIEW_ASSIGN: buildCandidateUrls('/admin/bihar/srt/installation/view-assign'),
    ASSIGN_AMC: buildCandidateUrls('/admin/bihar/srt/installation/assign-amc'),
    VIEW_INSTALLATION_AMC: buildCandidateUrls('/admin/bihar/srt/installation/view-installation-amc'),
    VERIFY_AMC_STATUS: buildCandidateUrls('/admin/bihar/srt/installation/verify-amc-status'),
    AMC_DASHBOARD: buildCandidateUrls('/admin/bihar/srt/installation/amc-dashboard'),
  },
};

export default BIHAR_ADMIN_API;
