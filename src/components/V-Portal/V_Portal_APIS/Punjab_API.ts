import { API_BASE_URL } from '../../../services/authService';

/**
 * Base URLs for Punjab API Endpoints
 * VendorPunjabSslInstallationController routes are grouped under /vendor/punjab/ssl/installation/...
 */
const BASE_URL = (API_BASE_URL || 'https://klkerp.com/api').replace(/\/+$/, '');

export const PUNJAB_API = {
  INSTALLATION: {
    SSL: {
      // 1. View Assigned Lights: GET /vendor/punjab/ssl/installation/view-assigned-light
      VIEW_ASSIGNED_LIGHTS: `${BASE_URL}/vendor/punjab/ssl/installation/view-assigned-light`,

      // 2. Accept Assigned Lights: GET /vendor/punjab/ssl/installation/update-status-assigned-light?light_id={lightId}
      ACCEPT_ASSIGNED: (lightId: number | string) =>
        `${BASE_URL}/vendor/punjab/ssl/installation/update-status-assigned-light?light_id=${encodeURIComponent(lightId)}`,

      // 3. Fetch Light List: GET /vendor/punjab/ssl/installation/fetch-light
      FETCH_LIGHT_NAMES: `${BASE_URL}/vendor/punjab/ssl/installation/fetch-light`,

      // 4. Fetch Light Details: GET /vendor/punjab/ssl/installation/fetch-light-deatils?light_id={lightId}
      FETCH_LIGHT_DETAILS: (lightId: number | string) =>
        `${BASE_URL}/vendor/punjab/ssl/installation/fetch-light-deatils?light_id=${encodeURIComponent(lightId)}`,

      // 5. Store Light Details (Install): POST /vendor/punjab/ssl/installation/store-deatils-light
      STORE_LIGHT_DETAILS: `${BASE_URL}/vendor/punjab/ssl/installation/store-deatils-light`,

      // 6. Update Install Light (Load): GET /vendor/punjab/ssl/installation/update-install-light?ssl_id={sslId}
      UPDATE_INSTALL_LIGHT_LOAD: (sslId: number | string) =>
        `${BASE_URL}/vendor/punjab/ssl/installation/update-install-light?ssl_id=${encodeURIComponent(sslId)}`,

      // 7. Update Install Light Store: POST /vendor/punjab/ssl/installation/update-install-light-store
      UPDATE_INSTALL_LIGHT_STORE: `${BASE_URL}/vendor/punjab/ssl/installation/update-install-light-store`,

      // 8. View Complete Lights: GET /vendor/punjab/ssl/installation/complete-light
      COMPLETE_LIGHTS: `${BASE_URL}/vendor/punjab/ssl/installation/complete-light`,

      // 9. Installation Dashboard: GET /vendor/punjab/ssl/installation/dashboard
      DASHBOARD: `${BASE_URL}/vendor/punjab/ssl/installation/dashboard`,

      // 10. View Dashboard By Status: GET /vendor/punjab/ssl/installation/view-dashboard/{status}
      DASHBOARD_BY_STATUS: (status: string) =>
        `${BASE_URL}/vendor/punjab/ssl/installation/view-dashboard/${encodeURIComponent(status)}`,

      // 11. Districtwise By Status: GET /vendor/punjab/ssl/installation/districtwise-view-data/{status}/{district}
      DISTRICTWISE_BY_STATUS: (status: string, district: string) =>
        `${BASE_URL}/vendor/punjab/ssl/installation/districtwise-view-data/${encodeURIComponent(status)}/${encodeURIComponent(district)}`,
    },
  },
};

export default PUNJAB_API;
