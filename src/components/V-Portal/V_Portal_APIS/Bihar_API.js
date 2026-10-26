import { API_BASE_URL } from '../../../services/authService';

/**
 * Base URLs for Bihar API Endpoints
 */
const BASE_URL = (API_BASE_URL || 'https://klkerp.com/api').replace(/\/+$/, '');
const ROOT_URL = BASE_URL.replace(/\/api\/?$/, '');

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 1. BIHAR SURVEY APIS
 * ═══════════════════════════════════════════════════════════════════════════
 */
export const BIHAR_SURVEY_API = {
  // ── SRT 200MW Survey ──
  SRT_200MW: {
    SURVEY_SITE_LIST: `${BASE_URL}/bihar/srt200mw-survey`,
    PENDING_SITES: `${BASE_URL}/bihar/srt200mw-survey`,
    SURVEY_STORE: `${BASE_URL}/bihar/srt200mw-survey-store`,
    SURVEY_EDIT: (id) => `${BASE_URL}/bihar/srt200mw-survey-edit?id=${encodeURIComponent(id)}`,
    SURVEY_UPDATE: `${BASE_URL}/bihar/srt200mw-survey-update`,
    VIEW_SURVEY: `${BASE_URL}/bihar/srt200mw-view-survey`,
  },

  // ── ULA (Urban Local Areas) Survey ──
  ULA: {
    CREATE: `${BASE_URL}/bihar/ula-surveys/create`,
    DISTRICTS: `${BASE_URL}/bihar/ula-surveys/create`,
    BLOCKS: (district) => `${BASE_URL}/bihar/ula-surveys/blocks?district=${encodeURIComponent(district)}`,
    PANCHAYAT: (district, block) => `${BASE_URL}/bihar/ula-surveys/panchayat?district=${encodeURIComponent(district)}&block=${encodeURIComponent(block)}`,
    STORE: `${BASE_URL}/bihar/ula-surveys`,
    VIEW: `${BASE_URL}/bihar/ula-surveys/view`,
    EDIT: (id) => `${BASE_URL}/bihar/ula-surveys/edit?id=${encodeURIComponent(id)}`,
    UPDATE: `${BASE_URL}/bihar/ula-surveys/update`,
  },
};

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 2. BIHAR INSTALLATION APIS
 * ═══════════════════════════════════════════════════════════════════════════
 */
export const BIHAR_INSTALLATION_API = {
  // ── ULA Installation ──
  ULA: {
    DASHBOARD: `${BASE_URL}/bihar/ula/installation/dashboard`,
    DASHBOARD_BY_STATUS: (status) => `${BASE_URL}/bihar/ula/installation/view-dashboard/${encodeURIComponent(status)}`,
    DASHBOARD_BY_DISTRICT: (status, district) => `${BASE_URL}/bihar/ula/installation/view-dashboard/districtwise/${encodeURIComponent(status)}/${encodeURIComponent(district)}`,
    VIEW_ASSIGN_SITE: `${BASE_URL}/bihar/ula/installation/view-assign-site`,
    VIEW_ASSIGN_SITE_DETAIL: (id) => `${BASE_URL}/bihar/ula/installation/view-assign-site-detail?id=${encodeURIComponent(id)}`,
    ACCEPT_ASSIGN_SITE: (id) => `${BASE_URL}/bihar/ula/installation/accept-assign-site?id=${encodeURIComponent(id)}`,
    FETCH_SITE_NAME: `${BASE_URL}/bihar/ula/installation/fetch-site-name`,
    FETCH_SITE_DETAILS: (siteId) => `${BASE_URL}/bihar/ula/installation/fetch-site-details?site_id=${encodeURIComponent(siteId)}`,
    PENDING_STRUCTURE_STORE: `${BASE_URL}/bihar/ula/installation/pending-structure-site-store`,
    STRUCTURE_EDIT_SITE: (siteId) => `${BASE_URL}/bihar/ula/installation/structure-edit-site/${encodeURIComponent(siteId)}`,
    UPDATE_STRUCTURE_SITE: `${BASE_URL}/bihar/ula/installation/update-structure-site`,
    VIEW_INSTALLED_SITES: `${BASE_URL}/bihar/ula/installation/view-site`,
    PENDING_SITE: (siteId) => `${BASE_URL}/bihar/ula/installation/pending-site/${encodeURIComponent(siteId)}`,
    STORE_SITE: `${BASE_URL}/bihar/ula/installation/pending-site-store`,
    PENDING_SITE_STORE: `${BASE_URL}/bihar/ula/installation/pending-site-store`,
    EDIT_SITE: (siteId) => `${BASE_URL}/bihar/ula/installation/edit-site/${encodeURIComponent(siteId)}`,
    UPDATE_SITE: `${BASE_URL}/bihar/ula/installation/update-site`,
    DOC_STORE: `${BASE_URL}/bihar/ula/installation/doc-store`,
    VIEW_PAYMENT: `${BASE_URL}/bihar/ula/installation/view-payment`,
    CLAIM_PAYMENT_DETAILS: `${BASE_URL}/bihar/ula/installation/claim-payment-details`,
    CLAIM_STORE: `${BASE_URL}/bihar/ula/installation/claim-store`,
  },

  // ── SRT Installation ──
  SRT: {
    DASHBOARD: `${BASE_URL}/bihar/srt/installation-dashboard`,
    DASHBOARD_BY_STATUS: (status) => `${BASE_URL}/bihar/srt/installation/view-dashboard-data/${encodeURIComponent(status)}`,
    DASHBOARD_BY_DISTRICT: (status, district) => `${BASE_URL}/bihar/srt/installation/districtwise-dashboard/${encodeURIComponent(status)}/${encodeURIComponent(district)}`,
    VIEW_ASSIGN_SITE: `${BASE_URL}/bihar/srt/view-assign-site`,
    ASSIGN_SITE_ACCEPT: `${BASE_URL}/bihar/srt/assign-site-accept`,
    FETCH_SITE_NAME: `${BASE_URL}/bihar/srt/installation/fetch-site-name`,
    FETCH_SITE_DETAIL: (srtId) => `${BASE_URL}/bihar/srt/installation/fetch-site-detail?srt_id=${encodeURIComponent(srtId)}`,
    INSTALLATION_STORE: `${BASE_URL}/bihar/srt/installation-store`,
    VIEW_INSTALL_SITES: `${BASE_URL}/bihar/srt/view-install-sites`,
    EDIT_INSTALL_SITE: (id) => `${BASE_URL}/bihar/srt/edit-install-site?id=${encodeURIComponent(id)}`,
    EDIT_INSTALL_SITE_STORE: `${BASE_URL}/bihar/srt/edit-install-site-store`,
    INSTALL_DOCUMENT_STORE: `${BASE_URL}/bihar/srt/install-document-store`,
    VIEW_INSTALL_CLAIM: `${BASE_URL}/bihar/srt/view-install-claim`,
    INSTALL_CLAIM_RAISED: `${BASE_URL}/bihar/srt/install-claim-raised`,
    // Backward compatibility aliases
    VIEW_ASSIGN_SITES: `${BASE_URL}/bihar/srt/view-assign-site`,
    INSTALL_SITE: `${BASE_URL}/bihar/srt/installation-store`,
    VIEW_INSTALLATION: `${BASE_URL}/bihar/srt/view-install-sites`,
    CLAIM_REQUEST: `${BASE_URL}/bihar/srt/install-claim-raised`,
  },

    // ── SSL (Solar Street Light) Installation ──
  SSL: {
    DASHBOARD: `${BASE_URL}/ssl/installation-dashboard`,
    DASHBOARD_BY_STATUS: (status) => `${BASE_URL}/ssl/installation-view-dashboard/${encodeURIComponent(status)}`,
    DASHBOARD_BY_DISTRICT: (status, district) => `${BASE_URL}/ssl/installation-view-district-dashboard/${encodeURIComponent(status)}/${encodeURIComponent(district)}`,
    VIEW_ASSIGNED_LIGHTS: `${BASE_URL}/bihar/ssl-view-assigned-ssl-light`,
    ACCEPT_ASSIGNED: `${BASE_URL}/bihar/ssl-accept-assigned-ssl-light`,
    FETCH_LIGHT_NAMES: `${BASE_URL}/bihar/ssl/installation/fetch-light-name`,
    FETCH_LIGHT_DETAIL: (uniqueId) => `${BASE_URL}/bihar/ssl/installation/fetch-light-detail?unique_id=${encodeURIComponent(uniqueId)}`,
    INSTALL_LIGHT_STORE: `${BASE_URL}/bihar/ssl-install-ssl-light-store`,
    VIEW_INSTALLED_LIGHTS: `${BASE_URL}/bihar/ssl-view-installed-light`,
    EDIT_INSTALLED_LIGHT: (id) => `${BASE_URL}/bihar/ssl-installed-light-edit/${encodeURIComponent(id)}`,
    UPDATE_INSTALLED_LIGHT: `${BASE_URL}/bihar/ssl-installed-light-edit-store`,
    CLAIM_RAISED: `${BASE_URL}/bihar/ssl-installed-claim_raised`,
    VIEW_CLAIM_DETAILS: `${BASE_URL}/bihar/ssl-view-claim-deatils`,
    DOWNLOAD_CLAIM_PDF: (id) => `${BASE_URL}/bihar/ssl/claim/download-pdf/${encodeURIComponent(id)}`,
    UPDATE_CLAIM_RAISED: `${BASE_URL}/bihar/ssl-claim-raised-update`,
    VIEW_SUPPLY_INSPECTION: `${BASE_URL}/bihar/ssl/installation/light-supply-inspection`,
    STORE_SUPPLY_INSPECTION: `${BASE_URL}/bihar/ssl/installation/light-supply-inspection-store`,
    UPDATE_SUPPLY_INSPECTION: (id) => `${BASE_URL}/bihar/ssl/installation/light-supply-inspection-update/${encodeURIComponent(id)}`,
    VIEW_INSTALLATION_INSPECTION: `${BASE_URL}/bihar/ssl/installation/light-inspection`,
    STORE_INSTALLATION_INSPECTION: `${BASE_URL}/bihar/ssl/installation/light-inspection-store`,
    FETCH_INSPECTION_BLOCKS: (district) => `${BASE_URL}/bihar/ssl/installation/light-fetch-block/${encodeURIComponent(district)}`,
    FETCH_INSPECTION_PANCHAYATS: (block, district) => `${BASE_URL}/bihar/ssl/installation/light-fetch-panchayat/${encodeURIComponent(block)}?district=${encodeURIComponent(district)}&block=${encodeURIComponent(block)}`,
    // Backward compatibility aliases
    ASSIGNED_LIGHTS: `${BASE_URL}/bihar/ssl-view-assigned-ssl-light`,
    INSTALL_LIGHT: `${BASE_URL}/bihar/ssl/update-ssl-site-deatils`,
    INSTALLATION_DETAIL: `${BASE_URL}/bihar/ssl-view-installed-light`,
    SUPPLY_INSPECTION: `${BASE_URL}/bihar/ssl/installation/light-supply-inspection`,
    INSTALLATION_INSPECTION: `${BASE_URL}/bihar/ssl/installation/light-inspection`,
    CLAIM_REQUEST: `${BASE_URL}/bihar/ssl-view-claim-deatils`,
  },
};

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 3. BIHAR AMC APIS
 * ═══════════════════════════════════════════════════════════════════════════
 */
export const BIHAR_AMC_API = {
  // ── SSL AMC ──
  SSL: {
    BASE: `${ROOT_URL}/api/user/dle/bihar/ssl/amc`,
    VOLUMES: `${ROOT_URL}/api/user/dle/bihar/ssl/amc/volume`,
    DISTRICTS: (volume) => `${ROOT_URL}/api/user/dle/bihar/ssl/amc/fetch-district${volume ? `?volume=${encodeURIComponent(volume)}` : ''}`,
    BLOCKS: (district, volume) => `${ROOT_URL}/api/user/dle/bihar/ssl/amc/fetch-block?district=${encodeURIComponent(district)}${volume ? `&volume=${encodeURIComponent(volume)}` : ''}`,
    PANCHAYATS: (block, district, volume) => `${ROOT_URL}/api/user/dle/bihar/ssl/amc/fetch-panchayat?block=${encodeURIComponent(block)}&district=${encodeURIComponent(district)}${volume ? `&volume=${encodeURIComponent(volume)}` : ''}`,
    STORE_ASSIGN_LIGHT: `${ROOT_URL}/api/user/dle/bihar/ssl/amc/store-assign-light`,
    VIEW_ASSIGN_LIGHT: `${ROOT_URL}/api/user/dle/bihar/ssl/amc/view-assign-light`,
    ADD_DATA: `${BASE_URL}/bihar/ssl/amc-store`,
    VIEW_DATA: `${BASE_URL}/bihar/ssl/amc-view`,
    APPROVAL_STATUS: `${BASE_URL}/bihar/ssl-amc/approval/status`,
    APPROVAL_LIST: `${BASE_URL}/bihar/amc/light/approval/list`,
    APPROVAL_PENDING: `${BASE_URL}/bihar/amc/light/approval/pending`,
  },

  // ── SRT AMC ──
  SRT: {
    ADD_DATA: `${BASE_URL}/bihar/srt/amc-store`,
    VIEW_DATA: `${BASE_URL}/bihar/srt/amc-view`,
    SITE_LIST: `${BASE_URL}/bihar/srt/amc-sites`,
    COMPLAINT_RAISED: `${BASE_URL}/bihar/view-srt-amc-complaint`,
  },
};

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 4. BIHAR COMPLAINTS APIS
 * ═══════════════════════════════════════════════════════════════════════════
 */
export const BIHAR_COMPLAINT_API = {
  // ── SSL Complaints (14 APIs) ──
  SSL: {
    ADD: `${BASE_URL}/bihar/ssl/complaint/add`,
    GET_BLOCKS: (district) => `${BASE_URL}/bihar/ssl/complaint/getblocks?district=${encodeURIComponent(district)}`,
    GET_PANCHYATS: (district, block) => `${BASE_URL}/bihar/ssl/complaint/getpanchyats?district=${encodeURIComponent(district)}&block=${encodeURIComponent(block)}`,
    GET_WARDS: (district, block, panchyat) => `${BASE_URL}/bihar/ssl/complaint/getwards?district=${encodeURIComponent(district)}&block=${encodeURIComponent(block)}&panchyat=${encodeURIComponent(panchyat)}`,
    GET_POLES: (district, block, panchyat, ward_no) => `${BASE_URL}/bihar/ssl/complaint/getpoles?district=${encodeURIComponent(district)}&block=${encodeURIComponent(block)}&panchyat=${encodeURIComponent(panchyat)}&ward_no=${encodeURIComponent(ward_no)}`,
    GET_POLE_DATAS: (district, block, panchyat, ward_no, pole_no) => `${BASE_URL}/bihar/ssl/complaint/getpoledatas?district=${encodeURIComponent(district)}&block=${encodeURIComponent(block)}&panchyat=${encodeURIComponent(panchyat)}&ward_no=${encodeURIComponent(ward_no)}&pole_no=${encodeURIComponent(pole_no)}`,
    STORE: `${BASE_URL}/bihar/ssl/complaint/store`,
    VIEW_DATA: `${BASE_URL}/bihar/ssl/complaint/view-data`,
    EDIT: (sslId) => `${BASE_URL}/bihar/ssl/complaint/edit?ssl_id=${encodeURIComponent(sslId)}`,
    UPDATE: `${BASE_URL}/bihar/ssl/complaint/update`,
    CLOSE_EDIT: (sslId) => `${BASE_URL}/bihar/ssl/complaint/close-edit?ssl_id=${encodeURIComponent(sslId)}`,
    CLOSE_UPDATE: `${BASE_URL}/bihar/ssl/complaint/close-update`,
    ASSIGN: `${BASE_URL}/bihar/ssl/complaint/assign`,
    DELETE: (sslId) => `${BASE_URL}/bihar/ssl/complaint/delete?ssl_id=${encodeURIComponent(sslId)}`,

    // Backward compatibility aliases
    ADD_COMPLAINT: `${BASE_URL}/bihar/ssl/complaint/store`,
    VIEW_COMPLAINT: `${BASE_URL}/bihar/ssl/complaint/view-data`,
    ASSIGNED_COMPLAINT: `${BASE_URL}/bihar/ssl/complaint/assign`,
    UPDATE_COMPLAINT: `${BASE_URL}/bihar/ssl/complaint/update`,
  },

  // ── SRT Complaints (11 APIs) ──
  SRT: {
    ADD: `${BASE_URL}/bihar/srt/complaint/add`,
    GET_SITE_NAMES: (district) => `${BASE_URL}/bihar/srt/complaint/get-site-names?district=${encodeURIComponent(district)}`,
    GET_SITES: (district, siteName) => `${BASE_URL}/bihar/srt/complaint/get-sites?district=${encodeURIComponent(district)}&site_name=${encodeURIComponent(siteName)}`,
    STORE: `${BASE_URL}/bihar/srt/complaint/store`,
    VIEW_DATA: `${BASE_URL}/bihar/srt/complaint/view-data`,
    EDIT: (srtId) => `${BASE_URL}/bihar/srt/complaint/edit?srt_id=${encodeURIComponent(srtId)}`,
    UPDATE: `${BASE_URL}/bihar/srt/complaint/update`,
    CLOSE_EDIT: (srtId) => `${BASE_URL}/bihar/srt/complaint/close-edit?srt_id=${encodeURIComponent(srtId)}`,
    CLOSE_UPDATE: `${BASE_URL}/bihar/srt/complaint/close-update`,
    ASSIGN: `${BASE_URL}/bihar/srt/complaint/assign`,
    DELETE: (srtId) => `${BASE_URL}/bihar/srt/complaint/delete?srt_id=${encodeURIComponent(srtId)}`,

    // Backward compatibility aliases
    ADD_COMPLAINT: `${BASE_URL}/bihar/srt/complaint/store`,
    VIEW_COMPLAINT: `${BASE_URL}/bihar/srt/complaint/view-data`,
    ASSIGNED_COMPLAINT: `${BASE_URL}/bihar/srt/complaint/assign`,
    UPDATE_COMPLAINT: `${BASE_URL}/bihar/srt/complaint/update`,
  },
};

/**
 * Unified Master Bihar API Object
 */
export const BIHAR_API = {
  // Backward compatibility: SRT_200MW at root
  SRT_200MW: BIHAR_SURVEY_API.SRT_200MW,

  // Four Main Pillars
  SURVEY: BIHAR_SURVEY_API,
  INSTALLATION: BIHAR_INSTALLATION_API,
  AMC: BIHAR_AMC_API,
  COMPLAINTS: BIHAR_COMPLAINT_API,
};

export default BIHAR_API;
