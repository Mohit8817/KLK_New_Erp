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
    VIEW_ASSIGN_SITES: `${BASE_URL}/bihar/srt/view-assign-installation-sites`,
    INSTALL_SITE: `${BASE_URL}/bihar/srt/install-site`,
    VIEW_INSTALLATION: `${BASE_URL}/bihar/srt/view-install-site`,
    CLAIM_REQUEST: `${BASE_URL}/bihar/srt/paymentsrtVendor`,
  },

  // ── SSL (Solar Street Light) Installation ──
  SSL: {
    DASHBOARD: `${BASE_URL}/bihar/ssl/installation-dashboard`,
    ASSIGNED_LIGHTS: `${BASE_URL}/bihar/ssl/view-assign-installation-sites`,
    INSTALL_LIGHT: `${BASE_URL}/bihar/ssl/update-ssl-site-deatils`,
    INSTALLATION_DETAIL: `${BASE_URL}/bihar/ssl/view-ssl-complete-site`,
    SUPPLY_INSPECTION: `${BASE_URL}/bihar/ssl/supply-inspection`,
    INSTALLATION_INSPECTION: `${BASE_URL}/bihar/ssl/installation-inspection`,
    CLAIM_REQUEST: `${BASE_URL}/bihar/ssl/installation-claim`,
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
  // ── SSL Complaints ──
  SSL: {
    ADD_COMPLAINT: `${BASE_URL}/bihar/ssl/complaint-store`,
    VIEW_COMPLAINT: `${BASE_URL}/bihar/ssl/complaint-list`,
    ASSIGNED_COMPLAINT: `${BASE_URL}/bihar/ssl/complaint-assigned`,
    UPDATE_COMPLAINT: `${BASE_URL}/bihar/ssl/complaint-update`,
    COMPLAINT_RAISED: `${BASE_URL}/bihar/ssl/view-complaint`,
  },

  // ── SRT Complaints ──
  SRT: {
    ADD_COMPLAINT: `${BASE_URL}/bihar/srt/complaint-store`,
    VIEW_COMPLAINT: `${BASE_URL}/bihar/srt/complaint-list`,
    ASSIGNED_COMPLAINT: `${BASE_URL}/bihar/srt/complaint-assigned`,
    UPDATE_COMPLAINT: `${BASE_URL}/bihar/srt/complaint-update`,
    COMPLAINT_RAISED: `${BASE_URL}/bihar/view-srt-amc-complaint`,
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
