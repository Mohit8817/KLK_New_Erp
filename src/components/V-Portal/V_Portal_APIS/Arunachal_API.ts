import { API_BASE_URL } from '../../../services/authService';

/**
 * Base URLs for Arunachal Pradesh SHL API Endpoints
 * VendorArunachalShlInstallationController routes are grouped under /arunachal/shl/installation/...
 */
const BASE_URL = (API_BASE_URL || 'https://klkerp.com/api').replace(/\/+$/, '');

export const ARUNACHAL_API = {
  INSTALLATION: {
    SHL: {
      // 1. View Assigned Lights: GET /arunachal/shl/installation/view-assigned-light
      VIEW_ASSIGNED_LIGHTS: `${BASE_URL}/arunachal/shl/installation/view-assigned-light`,

      // 2. Accept Assigned Lights: GET /arunachal/shl/installation/accept?light_id={lightId}
      ACCEPT_ASSIGNED: (lightId: number | string) =>
        `${BASE_URL}/arunachal/shl/installation/accept?light_id=${encodeURIComponent(lightId)}`,

      // 3. Fetch Light List: GET /arunachal/shl/installation/fetch-light
      FETCH_LIGHT_NAMES: `${BASE_URL}/arunachal/shl/installation/fetch-light`,

      // 4. Fetch Light Details: GET /arunachal/shl/installation/fetch-light-details?light_id={lightId}
      FETCH_LIGHT_DETAILS: (lightId: number | string) =>
        `${BASE_URL}/arunachal/shl/installation/fetch-light-details?light_id=${encodeURIComponent(lightId)}`,

      // 5. Install Light (Store): POST /arunachal/shl/installation/install/store
      STORE_LIGHT_DETAILS: `${BASE_URL}/arunachal/shl/installation/install/store`,

      // 6. View Installation (Summary + Lists): GET /arunachal/shl/installation/view-installation
      VIEW_INSTALLATION: `${BASE_URL}/arunachal/shl/installation/view-installation`,

      // 7. Update Install Light (Load): GET /arunachal/shl/installation/update?light_id={lightId}
      UPDATE_INSTALL_LIGHT_LOAD: (lightId: number | string) =>
        `${BASE_URL}/arunachal/shl/installation/update?light_id=${encodeURIComponent(lightId)}`,

      // 8. Update Install Light Store: POST /arunachal/shl/installation/update
      UPDATE_INSTALL_LIGHT_STORE: `${BASE_URL}/arunachal/shl/installation/update`,

      // 9. Installation Dashboard: GET /arunachal/shl/installation/dashboard
      DASHBOARD: `${BASE_URL}/arunachal/shl/installation/dashboard`,

      // 10. View Dashboard By Status: GET /arunachal/shl/installation/view-dashboard/{status}
      DASHBOARD_BY_STATUS: (status: string) =>
        `${BASE_URL}/arunachal/shl/installation/view-dashboard/${encodeURIComponent(status)}`,

      // 11. Districtwise By Status: GET /arunachal/shl/installation/districtwise-data/{status}/{district}
      DISTRICTWISE_BY_STATUS: (status: string, district: string) =>
        `${BASE_URL}/arunachal/shl/installation/districtwise-data/${encodeURIComponent(status)}/${encodeURIComponent(district)}`,
    },
  },
};

export default ARUNACHAL_API;
