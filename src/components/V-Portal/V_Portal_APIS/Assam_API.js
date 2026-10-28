import { API_BASE_URL } from '../../../services/authService';

/**
 * Base URLs for Assam API Endpoints
 */
const BASE_URL = (API_BASE_URL || 'https://klkerp.com/api').replace(/\/+$/, '');
const ROOT_URL = BASE_URL.replace(/\/api\/?$/, '');

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * ASSAM SWP (Solar Water Pump) INSTALLATION APIS (Vendor Portal)
 * ═══════════════════════════════════════════════════════════════════════════
 */
export const ASSAM_SWP_API = {
  // 1. Assigned Installation List
  ASSIGNED_SITES: `${BASE_URL}/assam/swp-view-assign-installation-sites`,

  // 2. Assign Site Detail
  ASSIGN_SITE_DETAIL: (id) => {
    const rawId = typeof id === 'object' && id !== null ? (id.assign_id ?? id.assignment_id ?? id.assignId ?? id.id) : id;
    const num = Number(rawId);
    const validId = Number.isFinite(num) && num > 0 ? Math.floor(num) : (rawId ?? '');
    return `${BASE_URL}/assam/swp-view-assign-installation-detail?id=${encodeURIComponent(validId)}`;
  },

  // 3. Accept Installation (Backend accepts site_id currently; pass assign_id alongside if available)
  ACCEPT_INSTALLATION: (id, assignId) => {
    let rawId = id;
    let fallbackAssign = assignId;
    if (typeof id === 'object' && id !== null) {
      const candidateSite = id.site_id ?? id.siteId;
      fallbackAssign = id.assign_id ?? id.assignment_id ?? id.assignId ?? id.id;
      if (candidateSite !== undefined && candidateSite !== null) {
        if (typeof candidateSite === 'number') rawId = candidateSite;
        else if (typeof candidateSite === 'string') {
          const match = candidateSite.match(/\d+/);
          if (match) rawId = match[0];
        } else if (Array.isArray(candidateSite) && candidateSite.length > 0) {
          rawId = candidateSite[0];
        }
      } else {
        rawId = fallbackAssign;
      }
    }
    const num = Number(rawId);
    const validId = Number.isFinite(num) && num > 0 ? Math.floor(num) : (rawId ?? '');
    let url = `${BASE_URL}/assam/swp-assign-installation-accept?id=${encodeURIComponent(validId)}`;
    if (fallbackAssign && String(fallbackAssign) !== String(validId)) {
      url += `&assign_id=${encodeURIComponent(fallbackAssign)}&assignment_id=${encodeURIComponent(fallbackAssign)}`;
    }
    return url;
  },

  // 4. Installable Site Name List (Dropdown)
  INSTALL_SITE_NAME_LIST: `${BASE_URL}/assam/swp-install-site-name`,

  // 5. Install Site Details
  INSTALL_SITE_DETAILS: (siteId) => `${BASE_URL}/assam/swp-install-site-details?site_id=${encodeURIComponent(siteId)}`,

  // 6. Site Install Store
  INSTALL_SITE_STORE: `${BASE_URL}/assam/swp-install-site-store`,

  // 7. View Install Site (Summary + List)
  VIEW_INSTALL_SITE: `${BASE_URL}/assam/swp-view-install-site`,

  // 8. Update Install Site (Load for Edit)
  INSTALL_SITE_UPDATE: (id) => `${BASE_URL}/assam/swp-install-site-update?id=${encodeURIComponent(id)}`,

  // 9. Update Install Site Store
  INSTALL_SITE_UPDATE_STORE: `${BASE_URL}/assam/swp-install-site-update-store`,

  // 10. Installation Document Submit
  DOC_SUBMIT: `${BASE_URL}/assam/swp-installation-doc-submit`,

  // 11. View Claim
  VIEW_CLAIM: `${BASE_URL}/assam/swp-installation-claim`,

  // 12. Add Claim
  ADD_CLAIM: `${BASE_URL}/assam/swp-installation-add-claim`,

  // 13. Update Claim
  UPDATE_CLAIM: `${BASE_URL}/assam/swp-installation-update-claim`,

  // 14. Installation Dashboard
  DASHBOARD: `${BASE_URL}/assam/swp-installation-dashboard`,

  // 15. View Dashboard By Status
  VIEW_DASHBOARD_BY_STATUS: (status) => `${BASE_URL}/assam/swp-installation-view-dashboard/${encodeURIComponent(status)}`,

  // 16. Districtwise By Status
  VIEW_DISTRICTWISE_BY_STATUS: (status, district) =>
    `${BASE_URL}/assam/swp-installation-view-districtwise/${encodeURIComponent(status)}/${encodeURIComponent(district)}`,
};

// Aliases for backward compatibility
export const ASSAM_SWP_DASHBOARD_URL = ASSAM_SWP_API.DASHBOARD;

export const ASSAM_API = {
  SWP_DASHBOARD: ASSAM_SWP_DASHBOARD_URL,
  SWP: ASSAM_SWP_API,
  ROOT_URL,
  BASE_URL,
};

export default ASSAM_API;
