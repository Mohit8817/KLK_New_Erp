import { API_BASE_URL } from '../../../services/authService';

/**
 * Base URLs for Jammu API Endpoints
 * Controllers:
 *  - VendorJammuSrtInstallation70mwController (/jammu/srt70mw/...)
 *  - VendorJammuInstalltionExpenseController (/jammu/installation-expenses...)
 */
const RAW_BASE = (API_BASE_URL || 'https://klkerp.com/api').replace(/\/+$/, '');
export const API_PREFIX = RAW_BASE.endsWith('/api') ? RAW_BASE : `${RAW_BASE}/api`;
export const BASE_URL = API_PREFIX;
export const ROOT_URL = API_PREFIX.replace(/\/api\/?$/, '');

export const JAMMU_API = {
  INSTALLATION: {
    SRT_70MW: {
      // 1. Assigned Sites: GET /jammu/srt70mw/installation-assign-site
      ASSIGNED_SITES: `${BASE_URL}/jammu/srt70mw/installation-assign-site`,

      // 2. Accept Assignment: POST /jammu/srt70mw/installation-assign-site-status
      ACCEPT_ASSIGNMENT: `${BASE_URL}/jammu/srt70mw/installation-assign-site-status`,

      // 3. Fetch Site Names (Ready for install dropdown): GET /jammu/srt70mw/fetch-sites-name
      FETCH_SITE_NAMES: `${BASE_URL}/jammu/srt70mw/fetch-sites-name`,

      // 4. Fetch Site Detail: GET /jammu/srt70mw/site-detail?srt_id={srt_id}
      FETCH_SITE_DETAIL: (srtId: number | string) =>
        `${BASE_URL}/jammu/srt70mw/site-detail?srt_id=${encodeURIComponent(srtId)}`,

      // 5. Site Details Store (Install Site): POST /jammu/srt70mw/installation-site-details-store (multipart/form-data)
      INSTALL_SITE_STORE: `${BASE_URL}/jammu/srt70mw/installation-site-details-store`,

      // 6. Installation Summary: GET /jammu/srt70mw/view-install-srt70mw-sites
      VIEW_INSTALLATION_SUMMARY: `${BASE_URL}/jammu/srt70mw/view-install-srt70mw-sites`,

      // 7. Edit Installation Site (Load): POST /jammu/srt70mw/installation-site-edit
      EDIT_INSTALL_LOAD: `${BASE_URL}/jammu/srt70mw/installation-site-edit`,

      // 8. Update Installation Site: POST /jammu/srt70mw/installation-site-update (multipart/form-data)
      UPDATE_INSTALL_STORE: `${BASE_URL}/jammu/srt70mw/installation-site-update`,

      // 9. Submit Document: GET /jammu/srt70mw/installation-submit-document?srt_id={srt_id}
      SUBMIT_DOCUMENT: (srtId: number | string) =>
        `${BASE_URL}/jammu/srt70mw/installation-submit-document?srt_id=${encodeURIComponent(srtId)}`,

      // 10. Claim Raise: POST /jammu/srt70mw/installation-claim-raise (multipart/form-data)
      CLAIM_RAISE: `${BASE_URL}/jammu/srt70mw/installation-claim-raise`,

      // 11. View Claim Request: GET /Jammu/srt70mw/view-claim-request (Note: Capital 'Jammu' on backend)
      VIEW_CLAIM_REQUEST: `${BASE_URL}/Jammu/srt70mw/view-claim-request`,
      VIEW_CLAIM_REQUEST_ALT: `${BASE_URL}/jammu/srt70mw/view-claim-request`,

      // 12. Installation Dashboard: GET /jammu/srt70mw/installation-dashboard
      DASHBOARD: `${BASE_URL}/jammu/srt70mw/installation-dashboard`,
      DASHBOARD_ALT: `${BASE_URL}/Jammu/srt70mw/installation-dashboard`,

      // 13. View Dashboard By Status: GET /jammu/srt70mw/installation-view-dashboard/{status}
      DASHBOARD_BY_STATUS: (status: string) =>
        `${BASE_URL}/jammu/srt70mw/installation-view-dashboard/${encodeURIComponent(status)}`,
      DASHBOARD_BY_STATUS_ALT: (status: string) =>
        `${BASE_URL}/Jammu/srt70mw/installation-view-dashboard/${encodeURIComponent(status)}`,

      // 14. Districtwise By Status: GET /jammu/srt70mw/installation-districtwise/{status}/{district}
      DISTRICTWISE_BY_STATUS: (status: string, district: string) =>
        `${BASE_URL}/jammu/srt70mw/installation-districtwise/${encodeURIComponent(status)}/${encodeURIComponent(district)}`,
      DISTRICTWISE_BY_STATUS_ALT: (status: string, district: string) =>
        `${BASE_URL}/Jammu/srt70mw/installation-districtwise/${encodeURIComponent(status)}/${encodeURIComponent(district)}`,
    },

    RESCO: {
      // 1. Assigned Installation Sites: GET /jk/resco-view-assign-installation-sites
      ASSIGNED_SITES: `${BASE_URL}/jk/resco-view-assign-installation-sites`,

      // 2. Assigned Installation Site Detail: GET /jk/resco-view-assign-installation-detail
      ASSIGNED_SITE_DETAIL: `${BASE_URL}/jk/resco-view-assign-installation-detail`,

      // 3. Accept Installation Assignment: GET /jk/resco-assign-installation-accept/{id}
      ACCEPT_ASSIGNMENT: (id: number | string) =>
        `${BASE_URL}/jk/resco-assign-installation-accept/${encodeURIComponent(id)}`,

      // 4. Fetch Install Sites (Dropdown list): GET /jk/resco-install-site
      INSTALL_SITES: `${BASE_URL}/jk/resco-install-site`,
      FETCH_SITE_NAMES: `${BASE_URL}/jk/resco-install-site`,

      // 5. Fetch Installation Site Details: GET /jk/resco-installation-fetch-site-detail?id={id}&site_id={id}
      FETCH_SITE_DETAILS: (id: number | string) =>
        `${BASE_URL}/jk/resco-installation-fetch-site-detail?id=${encodeURIComponent(id)}&site_id=${encodeURIComponent(id)}`,
      FETCH_SITE_DETAILS_PATH: (id: number | string) =>
        `${BASE_URL}/jk/resco-installation-fetch-site-detail/${encodeURIComponent(id)}`,
      FETCH_SITE_DETAILS_ALT: (id: number | string) =>
        `${BASE_URL}/jk/resco-install-site/${encodeURIComponent(id)}`,

      // 6. Submit Installation: POST /jk/resco-install-site-store
      INSTALL_SITE_STORE: `${BASE_URL}/jk/resco-install-site-store`,

      // 7. View Installed Sites: GET /jk/resco-view-install-site
      VIEW_INSTALL_SITE: `${BASE_URL}/jk/resco-view-install-site`,

      // 8. Installation Update Data: GET /jk/resco-install-site-update/{id}
      INSTALL_UPDATE_DATA: (id: number | string) =>
        `${BASE_URL}/jk/resco-install-site-update/${encodeURIComponent(id)}`,

      // 9. Update Installation: POST /jk/resco-install-site-ipdate-store/{id}
      INSTALL_UPDATE_STORE: (id: number | string) =>
        `${BASE_URL}/jk/resco-install-site-ipdate-store/${encodeURIComponent(id)}`,
      INSTALL_UPDATE_STORE_ALT: (id: number | string) =>
        `${BASE_URL}/jk/resco-install-site-update-store/${encodeURIComponent(id)}`,

      // 10. Submit Installation Document: POST /jk/resco-installation-doc-submit
      DOC_SUBMIT: `${BASE_URL}/jk/resco-installation-doc-submit`,

      // 11. Installation Claim: GET /jk/resco-installation-claim
      INSTALL_CLAIM: `${BASE_URL}/jk/resco-installation-claim`,

      // 12. Add Claim: POST /jk/resco-installation-add-claim
      ADD_CLAIM: `${BASE_URL}/jk/resco-installation-add-claim`,

      // 13. Update Claim: POST /jk/resco-installation-update-claim
      UPDATE_CLAIM: `${BASE_URL}/jk/resco-installation-update-claim`,

      // 14. Fetch Claim Details: POST /jk/fetch-site-resco-installation-claim
      FETCH_CLAIM_DETAILS: `${BASE_URL}/jk/fetch-site-resco-installation-claim`,

      // 15. Installation Dashboard: GET /jk/resco-installation-dashboard
      DASHBOARD: `${BASE_URL}/jk/resco-installation-dashboard`,

      // 16. Import Installation Panels: POST /jk/resco-installation-panel-store/{id}
      PANEL_STORE: (id: number | string) =>
        `${BASE_URL}/jk/resco-installation-panel-store/${encodeURIComponent(id)}`,

      // 17. View Imported Panels: GET /jk/resco-installation-view-panel/{id}
      VIEW_PANEL: (id: number | string) =>
        `${BASE_URL}/jk/resco-installation-view-panel/${encodeURIComponent(id)}`,

      // 18. View Installations for Billing: GET /jk/resco-view-install
      VIEW_INSTALL_BILLING: `${BASE_URL}/jk/resco-view-install`,

      // 19. Create Bill – Fetch Bill Details: GET /jk/resco-installation-create-bill/{id}
      CREATE_BILL: (id: number | string) =>
        `${BASE_URL}/jk/resco-installation-create-bill/${encodeURIComponent(id)}`,

      // 20. Store Monthly Bill: POST /jk/installation/resco-bill-store/{id}
      BILL_STORE: (id: number | string) =>
        `${BASE_URL}/jk/installation/resco-bill-store/${encodeURIComponent(id)}`,

      // 21. Update Monthly Bill: POST /jk/installation/resco-bill-update-store/{id}
      BILL_UPDATE_STORE: (id: number | string) =>
        `${BASE_URL}/jk/installation/resco-bill-update-store/${encodeURIComponent(id)}`,

      // 22. Status-wise Installation Data: GET /jk/resco-installation-view-data/{status}
      VIEW_DATA_STATUS: (status: string) =>
        `${BASE_URL}/jk/resco-installation-view-data/${encodeURIComponent(status)}`,

      // 23. District-wise Installation Data: GET /jk/resco-installation-view-districtwise/{status}/{district}
      VIEW_DATA_DISTRICTWISE: (status: string, district: string) =>
        `${BASE_URL}/jk/resco-installation-view-districtwise/${encodeURIComponent(status)}/${encodeURIComponent(district)}`,
    },

    SSL: {
      // 1. View assigned lights: GET jammu/ssl/installation/view-assigned-light
      VIEW_ASSIGNED_LIGHT: `${BASE_URL}/jammu/ssl/installation/view-assigned-light`,

      // 2. Update assigned light status: GET jammu/ssl/installation/update-status-assigned-light?ssl_id={ssl_id}
      UPDATE_STATUS_ASSIGNED_LIGHT: (sslId: number | string) =>
        `${BASE_URL}/jammu/ssl/installation/update-status-assigned-light?ssl_id=${encodeURIComponent(sslId)}`,

      // 3. Fetch site name: GET jammu/ssl/installation/fetch-site-name
      FETCH_SITE_NAME: `${BASE_URL}/jammu/ssl/installation/fetch-site-name`,

      // 4. Fetch site detail: GET jammu/ssl/installation/fetch-site-detail?ssl_id={ssl_id}
      FETCH_SITE_DETAIL: (sslId: number | string) =>
        `${BASE_URL}/jammu/ssl/installation/fetch-site-detail?ssl_id=${encodeURIComponent(sslId)}`,

      // 5. Store installation details: POST jammu/ssl/installation/site-store (multipart/form-data)
      SITE_STORE: `${BASE_URL}/jammu/ssl/installation/site-store`,

      // 6. View complete sites: GET jammu/ssl/installation/view-complete-site
      VIEW_COMPLETE_SITE: `${BASE_URL}/jammu/ssl/installation/view-complete-site`,

      // 7. Update site (fetch for edit): GET jammu/ssl/installation/update-site?ssl_id={ssl_id}
      UPDATE_SITE_LOAD: (sslId: number | string) =>
        `${BASE_URL}/jammu/ssl/installation/update-site?ssl_id=${encodeURIComponent(sslId)}`,

      // 8. Update site store: POST jammu/ssl/installation/update-site-store (multipart/form-data)
      UPDATE_SITE_STORE: `${BASE_URL}/jammu/ssl/installation/update-site-store`,

      // 9. Raise claim: POST jammu/ssl/installation/claim-raised (multipart/form-data)
      CLAIM_RAISED: `${BASE_URL}/jammu/ssl/installation/claim-raised`,

      // 10. View claim requests: GET jammu/ssl/installation/view-claim-request-deatils
      VIEW_CLAIM_REQUEST_DETAILS: `${BASE_URL}/jammu/ssl/installation/view-claim-request-deatils`,

      // 11. Installation dashboard: GET jammu/ssl/installation/installation-dashboard
      INSTALLATION_DASHBOARD: `${BASE_URL}/jammu/ssl/installation/installation-dashboard`,

      // 12. View dashboard by status: GET jammu/ssl/installation/installation-view-dashboard/{status}
      INSTALLATION_VIEW_DASHBOARD_STATUS: (status: string) =>
        `${BASE_URL}/jammu/ssl/installation/installation-view-dashboard/${encodeURIComponent(status)}`,

      // 13. View dashboard district-wise: GET jammu/ssl/installation/installation-view-dashboard-districtwise/{status}/{district}
      INSTALLATION_VIEW_DASHBOARD_DISTRICTWISE: (status: string, district: string) =>
        `${BASE_URL}/jammu/ssl/installation/installation-view-dashboard-districtwise/${encodeURIComponent(status)}/${encodeURIComponent(district)}`,
    },

    SWP: {
      // 1. View assigned installations: GET jammu/swp/installation-view-assign-sites
      ASSIGNED_SITES: `${BASE_URL}/jammu/swp/installation-view-assign-sites`,

      // 2. Accept installation: GET jammu/swp/accept-installation?id={id}
      ACCEPT_ASSIGNMENT: (id: number | string) =>
        `${BASE_URL}/jammu/swp/accept-installation?id=${encodeURIComponent(id)}`,

      // 3. Fetch site name: GET jammu/swp/fetch-site-name
      FETCH_SITE_NAMES: `${BASE_URL}/jammu/swp/fetch-site-name`,

      // 4. Fetch site detail: GET jammu/swp/fetch-site-detail?site_id={site_id}
      FETCH_SITE_DETAIL: (siteId: number | string) =>
        `${BASE_URL}/jammu/swp/fetch-site-detail?site_id=${encodeURIComponent(siteId)}`,

      // 5. Installation site store: POST jammu/swp/installation-site-store (multipart/form-data)
      INSTALL_SITE_STORE: `${BASE_URL}/jammu/swp/installation-site-store`,

      // 6. View installed sites: GET jammu/swp/installation-view-site
      VIEW_INSTALLED_SITES: `${BASE_URL}/jammu/swp/installation-view-site`,

      // 7. Update install site (fetch): GET jammu/swp/installation-update-site?site_id={site_id}
      UPDATE_SITE_LOAD: (siteId: number | string) =>
        `${BASE_URL}/jammu/swp/installation-update-site?site_id=${encodeURIComponent(siteId)}`,

      // 8. Update install site store: POST jammu/swp/installation-update-site-store (multipart/form-data)
      UPDATE_SITE_STORE: `${BASE_URL}/jammu/swp/installation-update-site-store`,

      // 9. HOC document store: POST jammu/swp/installation-doc-store (multipart/form-data)
      DOC_STORE: `${BASE_URL}/jammu/swp/installation-doc-store`,

      // 10. View claim: GET jammu/swp/installation-claim
      INSTALLATION_CLAIM: `${BASE_URL}/jammu/swp/installation-claim`,

      // 11. Add claim: POST jammu/swp/installation-add-claim (multipart/form-data)
      ADD_CLAIM: `${BASE_URL}/jammu/swp/installation-add-claim`,

      // 12. Update claim: POST jammu/swp/installation-update-claim (multipart/form-data)
      UPDATE_CLAIM: `${BASE_URL}/jammu/swp/installation-update-claim`,

      // 13. Fetch claim: POST jammu/swp/installation-fetch-claim
      FETCH_CLAIM: `${BASE_URL}/jammu/swp/installation-fetch-claim`,

      // 14. View assigned site details: GET jammu/swp/installation-view-assigned-site-details?assign_id={assign_id}
      VIEW_ASSIGNED_SITE_DETAILS: (assignId: number | string) =>
        `${BASE_URL}/jammu/swp/installation-view-assigned-site-details?assign_id=${encodeURIComponent(assignId)}`,

      // 15. Dashboard summary: GET jammu/swp/view-installation-dashboard
      DASHBOARD: `${BASE_URL}/jammu/swp/view-installation-dashboard`,

      // 16. Dashboard by status: GET jammu/swp/view-dashboard-data/{status}
      DASHBOARD_BY_STATUS: (status: string) =>
        `${BASE_URL}/jammu/swp/view-dashboard-data/${encodeURIComponent(status)}`,

      // 17. Dashboard district-wise: GET jammu/swp/view-dashboard-districtwise/{status}/{district}
      DASHBOARD_DISTRICTWISE: (status: string, district: string) =>
        `${BASE_URL}/jammu/swp/view-dashboard-districtwise/${encodeURIComponent(status)}/${encodeURIComponent(district)}`,
    },
  },

  EXPENSES: {
    // 15. Installation Expenses: List: GET /jammu/installation-expenses
    LIST: `${BASE_URL}/jammu/installation-expenses`,

    // 16. Installation Expenses: Create (Site List): GET /jammu/installation-expenses-create
    CREATE_SITE_LIST: `${BASE_URL}/jammu/installation-expenses-create`,

    // 17. Installation Expenses: Store: POST /jammu/installation-expenses-store (multipart/form-data)
    STORE: `${BASE_URL}/jammu/installation-expenses-store`,

    // 18. Installation Expenses: Edit (Load): GET /jammu/installation-expenses-edit?claim_id={claim_id}
    EDIT_LOAD: (claimId: number | string) =>
      `${BASE_URL}/jammu/installation-expenses-edit?claim_id=${encodeURIComponent(claimId)}`,

    // 19. Installation Expenses: Update: POST /jammu/installation-expenses-update (multipart/form-data)
    UPDATE: `${BASE_URL}/jammu/installation-expenses-update`,

    // 20. Installation Expenses: View Payment: GET /jammu/installation-expenses-view-payment
    VIEW_PAYMENT: `${BASE_URL}/jammu/installation-expenses-view-payment`,
  },

  ROOT_URL,
  BASE_URL,
};

export default JAMMU_API;
