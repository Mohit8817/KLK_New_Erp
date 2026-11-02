import { API_BASE_URL } from '../../../services/authService';

/**
 * Base URLs for UP Survey API Endpoints
 * Supports:
 * 1. Resco Survey (11 methods under VendorUpRescoSurveyController)
 * 2. SRT Survey (Add Survey, View Survey)
 * 3. SSL Survey (Update SSL Survey Status, View UP SSL Sites)
 */
const BASE_URL = (API_BASE_URL || 'https://klkerp.com/api').replace(/\/+$/, '');

export const UP_SURVEY_API = {
  RESCO: {
    // 1. Sites still to be surveyed
    PENDING_SITES: `${BASE_URL}/up/resco-survey`,
    // 2. Detail of one site (?srt_id=xx)
    SITE_DETAIL: (srtId: number | string) =>
      `${BASE_URL}/up/resco-fetch-site-detail?srt_id=${encodeURIComponent(srtId)}`,
    // 3. Submit a survey (POST multipart/form-data)
    STORE_SURVEY: `${BASE_URL}/up/resco-survey-store`,
    // 4. Completed surveys and counts
    VIEW_SURVEY: `${BASE_URL}/up/view-resco-survey`,
    // 5. Fetch a survey for editing
    GET_SURVEY_FOR_EDIT: (id: number | string) =>
      `${BASE_URL}/up/view-resco-survey-update/${encodeURIComponent(id)}`,
    // 6. Save edits to a survey (POST multipart/form-data)
    UPDATE_SURVEY_STORE: (id: number | string) =>
      `${BASE_URL}/up/view-resco-survey-update-store/${encodeURIComponent(id)}`,
    // 7. Assigned survey batches
    ASSIGNED_SURVEYS: `${BASE_URL}/up/view-assigned-resco-survey`,
    // 8. Upload the BOS file
    BOS_SUBMIT: `${BASE_URL}/up/resco-bos-submit`,
    // 9. Fetch BOS products for a site (POST with { id })
    BOS_PRODUCT_FETCH: `${BASE_URL}/up/view-resco-survey-bos-product`,
    // 10. Save BOS products (POST)
    BOS_PRODUCT_STORE: `${BASE_URL}/up/view-resco-survey-bos-product-store`,
    // 11. Download BOS PDF (POST with { id })
    BOS_PRODUCT_PDF: `${BASE_URL}/up/view-resco-survey-bos-product-pdf`,
  },

  SRT: {
    STORE_SURVEY: `${BASE_URL}/up/srt-surveys/create`,
    VIEW_SURVEYS: `${BASE_URL}/up/srt-surveys/view`,
    DISTRICTS: `${BASE_URL}/up/srt/districts`,
    BLOCKS: (district: string) =>
      `${BASE_URL}/up/srt/blocks?district=${encodeURIComponent(district)}`,
    PANCHAYATS: (district: string, block: string) =>
      `${BASE_URL}/up/srt/panchayats?district=${encodeURIComponent(district)}&block=${encodeURIComponent(block)}`,
    VILLAGES: (district: string, block: string, panchayat: string) =>
      `${BASE_URL}/up/srt/villages?district=${encodeURIComponent(district)}&block=${encodeURIComponent(block)}&panchayat=${encodeURIComponent(panchayat)}`,
  },

  SSL: {
    FETCH_UIDS: `${BASE_URL}/up/edit-ssl`,
    FETCH_SITE_DETAIL: (uid: string | number) =>
      `${BASE_URL}/up/edit-ssl?uid=${encodeURIComponent(uid)}`,
    UPDATE_STATUS: `${BASE_URL}/up/update-ssl-survey`,
    VIEW_DATA: `${BASE_URL}/up/view-upssl`,
  },
};

export default UP_SURVEY_API;
