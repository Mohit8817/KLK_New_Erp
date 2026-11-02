import { API_BASE_URL } from '../../../services/authService';

/**
 * Base URLs for UP Complaint API Endpoints
 * All endpoints adhere to backend routing rules under /up/complaint/... and /up/.../complaint
 */
const BASE_URL = (API_BASE_URL || 'https://klkerp.com/api').replace(/\/+$/, '');

export const UP_COMPLAINT_API = {
  RESCO: {
    ADD_COMPLAINT_PAGE: `${BASE_URL}/up/complaint/resco/add-complaint`,
    SAVE_COMPLAINT: `${BASE_URL}/up/complaint/resco/save-complaint`,
    GET_SITE_NAMES: (district: string) =>
      `${BASE_URL}/up/complaint/resco/get-site-names?district=${encodeURIComponent(district)}`,
    GET_SITE_DETAILS: (siteIdOrName: string | number) =>
      `${BASE_URL}/up/complaint/resco/get-sites-details?site_id=${encodeURIComponent(siteIdOrName)}&site_name=${encodeURIComponent(siteIdOrName)}`,
    VIEW_COMPLAINTS: `${BASE_URL}/up/complaint/resco/view-complaint`,
    ASSIGNED_COMPLAINTS: `${BASE_URL}/up/complaint/resco/assign-complaint`,
    EDIT_COMPLAINT: (id: string | number) =>
      `${BASE_URL}/up/complaint/resco/edit-complaint/${encodeURIComponent(id)}`,
    UPDATE_COMPLAINT: `${BASE_URL}/up/complaint/resco/update-complaint`,
    DELETE_COMPLAINT: (id: string | number) =>
      `${BASE_URL}/up/complaint/resco/delete-complaint/${encodeURIComponent(id)}`,
    CLOSE_EDIT_COMPLAINT: (id: string | number) =>
      `${BASE_URL}/up/complaint/resco/close-edit-complaint/${encodeURIComponent(id)}`,
    CLOSE_UPDATE_COMPLAINT: `${BASE_URL}/up/complaint/resco/close-update-complaint`,
  },

  SSL: {
    STORE_DATA: `${BASE_URL}/up/ssl/complaint/store-data`,
    STORE_COMPLAINT: `${BASE_URL}/up/ssl/complaint/store-data`,
    VIEW_DATA: `${BASE_URL}/up/ssl/complaint/view-data`,
    VIEW_COMPLAINTS: `${BASE_URL}/up/ssl/complaint/view-data`,
    EDIT_DATA: (id: string | number) =>
      `${BASE_URL}/up/ssl/complaint/edit-data/${encodeURIComponent(id)}`,
    EDIT_COMPLAINT: (id: string | number) =>
      `${BASE_URL}/up/ssl/complaint/edit-data/${encodeURIComponent(id)}`,
    UPDATE_DATA: `${BASE_URL}/up/ssl/complaint/update-data`,
    UPDATE_COMPLAINT: `${BASE_URL}/up/ssl/complaint/update-data`,
    DELETE_DATA: (id: string | number) =>
      `${BASE_URL}/up/ssl/complaint/delete-data/${encodeURIComponent(id)}`,
    DELETE_COMPLAINT: (id: string | number) =>
      `${BASE_URL}/up/ssl/complaint/delete-data/${encodeURIComponent(id)}`,
    ASSIGN: `${BASE_URL}/up/ssl/complaint/assign`,
    ASSIGNED_COMPLAINTS: `${BASE_URL}/up/ssl/complaint/assign`,
    CLOSE_EDIT: (id: string | number) =>
      `${BASE_URL}/up/ssl/complaint/colse-edit/${encodeURIComponent(id)}`,
    CLOSE_EDIT_COMPLAINT: (id: string | number) =>
      `${BASE_URL}/up/ssl/complaint/colse-edit/${encodeURIComponent(id)}`,
    CLOSE_UPDATE: `${BASE_URL}/up/ssl/complaint/close-update`,
    CLOSE_UPDATE_COMPLAINT: `${BASE_URL}/up/ssl/complaint/close-update`,
    GET_DISTRICTS: `${BASE_URL}/up/ssl/complaint/getdistricts`,
    GET_BLOCKS: (district: string) =>
      `${BASE_URL}/up/ssl/complaint/getblock?district=${encodeURIComponent(district)}&district_name=${encodeURIComponent(district)}`,
    GET_PANCHAYATS: (district: string, block: string) =>
      `${BASE_URL}/up/ssl/complaint/getpanchyats?district=${encodeURIComponent(district)}&block=${encodeURIComponent(block)}&block_name=${encodeURIComponent(block)}`,
    GET_BENEFICIARY_NAMES: (district: string, block: string, panchayat: string) =>
      `${BASE_URL}/up/ssl/complaint/getbeneficiaryname?district=${encodeURIComponent(district)}&block=${encodeURIComponent(block)}&panchayat=${encodeURIComponent(panchayat)}`,
    GET_BENEFICIARY_DETAILS: (idOrName: string | number) =>
      `${BASE_URL}/up/ssl/complaint/getbeneficiarydetails?id=${encodeURIComponent(idOrName)}&beneficiary_id=${encodeURIComponent(idOrName)}&beneficiary_name=${encodeURIComponent(idOrName)}`,
  },

  KUSUM_C: {
    // 6. UP KusumC / SWP Complaint
    ADD_COMPLAINT: `${BASE_URL}/up/complaint/swp/add-complaint`,
    GET_POST: (district: string) =>
      `${BASE_URL}/up/complaint/swp/get-post?district=${encodeURIComponent(district)}`,
    GET_VILLAGE: (district: string, post: string) =>
      `${BASE_URL}/up/complaint/swp/get_village?district=${encodeURIComponent(district)}&post=${encodeURIComponent(post)}`,
    GET_BENEFICIARY_NAMES: (district: string, post: string, village: string) =>
      `${BASE_URL}/up/complaint/swp/getbeneficiarynames?district=${encodeURIComponent(district)}&post=${encodeURIComponent(post)}&village=${encodeURIComponent(village)}`,
    GET_BENEFICIARY_DETAILS: (idOrName: string | number) =>
      `${BASE_URL}/up/complaint/swp/getbeneficiarydetails?id=${encodeURIComponent(idOrName)}&farmer_name=${encodeURIComponent(idOrName)}`,
    STORE_COMPLAINT: `${BASE_URL}/up/complaint/swp/store-complaint`,
    VIEW_COMPLAINT: `${BASE_URL}/up/complaint/swp/view-complaint`,
    ASSIGN_COMPLAINT: `${BASE_URL}/up/complaint/swp/assign-complaint`,
    EDIT_COMPLAINT: (id: string | number) =>
      `${BASE_URL}/up/complaint/swp/complaint-edit/${encodeURIComponent(id)}`,
    UPDATE_COMPLAINT: (id: string | number) =>
      `${BASE_URL}/up/complaint/swp/complaint-edit-store/${encodeURIComponent(id)}`,
    DELETE_COMPLAINT: (id: string | number) =>
      `${BASE_URL}/up/complaint/swp/complaint-delete/${encodeURIComponent(id)}`,
    CLOSE_EDIT_COMPLAINT: (id: string | number) =>
      `${BASE_URL}/up/complaint/swp/close-edit-complaint/${encodeURIComponent(id)}`,
    CLOSE_UPDATE: `${BASE_URL}/up/complaint/swp/close-update`,
  },

  KUSUM_B: {
    // 5. UP KusumB Complaint
    ADD_COMPLAINT: `${BASE_URL}/up/kusumb/complaint/add-complaint`,
    GET_BENEFICIARY_VILLAGE: (district: string) =>
      `${BASE_URL}/up/kusumb/complaint/getbeneficiaryvillage?district=${encodeURIComponent(district)}`,
    GET_BENEFICIARY_NAMES: (district: string, village: string) =>
      `${BASE_URL}/up/kusumb/complaint/getbeneficiarynames?district=${encodeURIComponent(district)}&village=${encodeURIComponent(village)}`,
    GET_BENEFICIARY_DETAILS: (idOrName: string | number) =>
      `${BASE_URL}/up/kusumb/complaint/getbeneficiarydetails?id=${encodeURIComponent(idOrName)}&beneficiary_name=${encodeURIComponent(idOrName)}`,
    STORE_DATA: `${BASE_URL}/up/kusumb/complaint/store-data`,
    VIEW_COMPLAINT: `${BASE_URL}/up/kusumb/complaint/view-complaint`,
    ASSIGN_COMPLAINT: `${BASE_URL}/up/kusumb/complaint/assign-complaint`,
    EDIT_COMPLAINT: (id: string | number) =>
      `${BASE_URL}/up/kusumb/complaint/edit-complaint/${encodeURIComponent(id)}`,
    UPDATE_COMPLAINT: (id: string | number) =>
      `${BASE_URL}/up/kusumb/complaint/update-complaint/${encodeURIComponent(id)}`,
    DELETE_COMPLAINT: (id: string | number) =>
      `${BASE_URL}/up/kusumb/complaint/delete-complaint/${encodeURIComponent(id)}`,
    CLOSE_EDIT_COMPLAINT: (id: string | number) =>
      `${BASE_URL}/up/kusumb/complaint/close-edit-complaint/${encodeURIComponent(id)}`,
    CLOSE_UPDATE_COMPLAINT: `${BASE_URL}/up/kusumb/complaint/close-update-complaint`,
  },

  ONGRID: {
    // 7. UP Ongrid Complaint
    ADD_COMPLAINT: `${BASE_URL}/up/ongrid/complaint/add-complaint`,
    GET_BENEFICIARY_NAMES: (district: string) =>
      `${BASE_URL}/up/ongrid/complaint/getbeneficiarynames?district=${encodeURIComponent(district)}`,
    GET_BENEFICIARY_DETAILS: (idOrName: string | number) =>
      `${BASE_URL}/up/ongrid/complaint/getbeneficiarydetails?id=${encodeURIComponent(idOrName)}&beneficiary_name=${encodeURIComponent(idOrName)}`,
    SAVE_COMPLAINT: `${BASE_URL}/up/ongrid/complaint/save-complaint`,
    VIEW_COMPLAINT: `${BASE_URL}/up/ongrid/complaint/view-complaint`,
    ASSIGN_COMPLAINT: `${BASE_URL}/up/ongrid/complaint/assign-complaint`,
    EDIT_COMPLAINT: (id: string | number) =>
      `${BASE_URL}/up/ongrid/complaint/edit-complaint/${encodeURIComponent(id)}`,
    UPDATE_COMPLAINT: `${BASE_URL}/up/ongrid/complaint/update-complaint`,
    DELETE_COMPLAINT: (id: string | number) =>
      `${BASE_URL}/up/ongrid/complaint/delete-complaint/${encodeURIComponent(id)}`,
    CLOSE_EDIT_COMPLAINT: (id: string | number) =>
      `${BASE_URL}/up/ongrid/complaint/edit/${encodeURIComponent(id)}`,
    CLOSE_STORE: `${BASE_URL}/up/ongrid/complaint/close-store`,
  },

  OFFGRID: {
    // 8. UP Offgrid Complaint
    ADD_COMPLAINT: `${BASE_URL}/up/offgrid/complaint/add-complaint`,
    GET_BENEFICIARY_NAMES: (district: string) =>
      `${BASE_URL}/up/offgrid/complaint/getbeneficiarynames?district=${encodeURIComponent(district)}`,
    GET_BENEFICIARY_DETAILS: (idOrName: string | number) =>
      `${BASE_URL}/up/offgrid/complaint/getbeneficiarydetails?id=${encodeURIComponent(idOrName)}&beneficiary_name=${encodeURIComponent(idOrName)}`,
    STORE: `${BASE_URL}/up/offgrid/complaint/store`,
    VIEW_COMPLAINT: `${BASE_URL}/up/offgrid/complaint/view-complaint`,
    ASSIGN_COMPLAINT: `${BASE_URL}/up/offgrid/complaint/assign-complaint`,
    CLOSE_EDIT: (id: string | number) =>
      `${BASE_URL}/up/offgrid/complaint/close-edit/${encodeURIComponent(id)}`,
    CLOSE_UPDATE: `${BASE_URL}/up/offgrid/complaint/close-update`,
    EDIT: (id: string | number) =>
      `${BASE_URL}/up/offgrid/complaint/edit/${encodeURIComponent(id)}`,
    UPDATE: `${BASE_URL}/up/offgrid/complaint/update`,
    DELETE: (id: string | number) =>
      `${BASE_URL}/up/offgrid/complaint/delete/${encodeURIComponent(id)}`,
  },

  POWERPACK: {
    // 9. UP Powerpack Complaint
    ADD_COMPLAINT: `${BASE_URL}/up/powerpack/complaint/add-complaint`,
    GET_BLOCK: (district: string) =>
      `${BASE_URL}/up/powerpack/complaint/getblock?district=${encodeURIComponent(district)}`,
    GET_VILLAGE: (district: string, block: string) =>
      `${BASE_URL}/up/powerpack/complaint/getvillage?district=${encodeURIComponent(district)}&block=${encodeURIComponent(block)}`,
    GET_BENEFICIARY_NAMES: (district: string, block: string, village: string) =>
      `${BASE_URL}/up/powerpack/complaint/getbeneficiarynames?district=${encodeURIComponent(district)}&block=${encodeURIComponent(block)}&village=${encodeURIComponent(village)}`,
    GET_BENEFICIARY_DETAILS: (idOrName: string | number) =>
      `${BASE_URL}/up/powerpack/complaint/getbeneficiarydetails?id=${encodeURIComponent(idOrName)}&beneficiary_name=${encodeURIComponent(idOrName)}`,
    SAVE_COMPLAINT: `${BASE_URL}/up/powerpack/complaint/save-complaint`,
    VIEW_COMPLAINT: `${BASE_URL}/up/powerpack/complaint/view-complaint`,
    ASSIGN_COMPLAINT: `${BASE_URL}/up/powerpack/complaint/assign-complaint`,
    CLOSE_EDIT: (id: string | number) =>
      `${BASE_URL}/up/powerpack/complaint/close-edit/${encodeURIComponent(id)}`,
    CLOSE_UPDATE: `${BASE_URL}/up/powerpack/complaint/close-update`,
    EDIT: (id: string | number) =>
      `${BASE_URL}/up/powerpack/complaint/edit/${encodeURIComponent(id)}`,
    UPDATE: `${BASE_URL}/up/powerpack/complaint/update`,
    DELETE_COMPLAINT: (id: string | number) =>
      `${BASE_URL}/up/powerpack/complaint/complaint-delete/${encodeURIComponent(id)}`,
  },

  SRLMSRT: {
    // 10. UP SRLMSRT Complaint
    ADD_COMPLAINT: `${BASE_URL}/up/srlmsrt/complaint/add-complaint`,
    GET_BLOCK_NAME: (district: string) =>
      `${BASE_URL}/up/srlmsrt/complaint/get-block-name?district=${encodeURIComponent(district)}`,
    GET_SITE_NAME: (district: string, block: string) =>
      `${BASE_URL}/up/srlmsrt/complaint/get-site-name?district=${encodeURIComponent(district)}&block=${encodeURIComponent(block)}`,
    GET_SITE_DETAILS: (idOrName: string | number) =>
      `${BASE_URL}/up/srlmsrt/complaint/get-site-details?id=${encodeURIComponent(idOrName)}&site_name=${encodeURIComponent(idOrName)}`,
    SAVE_COMPLAINT: `${BASE_URL}/up/srlmsrt/complaint/save-complaint`,
    VIEW_COMPLAINT: `${BASE_URL}/up/srlmsrt/complaint/view-complaint`,
    ASSIGN_COMPLAINT: `${BASE_URL}/up/srlmsrt/complaint/assign-complaint`,
    CLOSE_EDIT_COMPLAINT: (id: string | number) =>
      `${BASE_URL}/up/srlmsrt/complaint/close-edit-complaint/${encodeURIComponent(id)}`,
    CLOSE_UPDATE_COMPLAINT: `${BASE_URL}/up/srlmsrt/complaint/close-update-complaint`,
    EDIT_COMPLAINT: (id: string | number) =>
      `${BASE_URL}/up/srlmsrt/complaint/edit-complaint/${encodeURIComponent(id)}`,
    UPDATE_COMPLAINT: (id: string | number) =>
      `${BASE_URL}/up/srlmsrt/complaint/update-complaint/${encodeURIComponent(id)}`,
    DELETE_COMPLAINT: (id: string | number) =>
      `${BASE_URL}/up/srlmsrt/complaint/delete-complaint/${encodeURIComponent(id)}`,
  },
};

export default UP_COMPLAINT_API;
