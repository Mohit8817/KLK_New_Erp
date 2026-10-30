import { API_BASE_URL } from '../../../services/authService';

/**
 * Base URLs for Goa V Portal API Endpoints
 * - Installation: VendorGoaSrtInstallationController (/goa/srt/installation/...)
 * - AMC: VendorGoaAmcsrtController (/goa/srt/installation/amc/...)
 * - Survey: VendorGoaSrtSurveyController (/goa/srt/installation/survey/...)
 */
const BASE_URL = (API_BASE_URL || 'https://klkerp.com/api').replace(/\/+$/, '');

export const GOA_API = {
  INSTALLATION: {
    SRT: {
      // 1. Dashboard: GET /goa/srt/installation/dashboard
      DASHBOARD: `${BASE_URL}/goa/srt/installation/dashboard`,

      // 2. Dashboard By Status: GET /goa/srt/installation/dashboard/view-data/{status}
      DASHBOARD_BY_STATUS: (status: string) =>
        `${BASE_URL}/goa/srt/installation/dashboard/view-data/${encodeURIComponent(status)}`,

      // 3. Dashboard Districtwise: GET /goa/srt/installation/dashboard/districtwise/{status}/{district}
      DASHBOARD_DISTRICTWISE: (status: string, district: string) =>
        `${BASE_URL}/goa/srt/installation/dashboard/districtwise/${encodeURIComponent(status)}/${encodeURIComponent(district)}`,

      // 4. View Assigned Sites: GET /goa/srt/installation/view-assign-site
      VIEW_ASSIGN_SITE: `${BASE_URL}/goa/srt/installation/view-assign-site`,

      // 5. Update Status (Accept Assignment): GET /goa/srt/installation/update-status?id={id}
      UPDATE_STATUS: (id: number | string) =>
        `${BASE_URL}/goa/srt/installation/update-status?id=${encodeURIComponent(id)}`,

      // 6. Fetch Site Name: GET /goa/srt/installation/fetch-site-name
      FETCH_SITE_NAME: `${BASE_URL}/goa/srt/installation/fetch-site-name`,

      // 7. Fetch Site Detail: GET /goa/srt/installation/fetch-site-detail?site_id={site_id}
      FETCH_SITE_DETAIL: (siteId: number | string) =>
        `${BASE_URL}/goa/srt/installation/fetch-site-detail?site_id=${encodeURIComponent(siteId)}`,

      // 8. Store Installation Data: ANY / POST /goa/srt/installation/store-data
      STORE_DATA: `${BASE_URL}/goa/srt/installation/store-data`,

      // 9. Completed Installation Data: GET /goa/srt/installation/completed-data
      COMPLETED_DATA: `${BASE_URL}/goa/srt/installation/completed-data`,

      // 10. Fetch Installation Data for Editing: GET /goa/srt/installation/update-site?site_id={site_id}
      UPDATE_SITE: (siteId: number | string) =>
        `${BASE_URL}/goa/srt/installation/update-site?site_id=${encodeURIComponent(siteId)}`,

      // 11. Update Installation Data: POST /goa/srt/installation/update-site-store
      UPDATE_SITE_STORE: `${BASE_URL}/goa/srt/installation/update-site-store`,

      // 12. All Assigned Sites: GET /goa/srt/installation/allassignsite
      ALL_ASSIGN_SITE: `${BASE_URL}/goa/srt/installation/allassignsite`,

      // 13. Claim / Payment: GET /goa/srt/installation/claimpayment
      CLAIM_PAYMENT: `${BASE_URL}/goa/srt/installation/claimpayment`,

      // 14. View Payment Claims: GET /goa/srt/installation/view-payment
      VIEW_PAYMENT: `${BASE_URL}/goa/srt/installation/view-payment`,

      // 15. Raise Installation Claim: POST /goa/srt/installation/claim-raised
      CLAIM_RAISED: `${BASE_URL}/goa/srt/installation/claim-raised`,

      // 16. Raise Third Payment (15%): POST /goa/srt/installation/raised-payment3
      RAISED_PAYMENT3: `${BASE_URL}/goa/srt/installation/raised-payment3`,

      // 17. Submit Document: GET /goa/srt/installation/submit-document?site_id={site_id}
      SUBMIT_DOCUMENT: (siteId: number | string) =>
        `${BASE_URL}/goa/srt/installation/submit-document?site_id=${encodeURIComponent(siteId)}`,
    },
  },

  AMC: {
    SRT: {
      // 1. Fetch AMC Types: GET /goa/srt/installation/amc/fetch-amc-type
      FETCH_AMC_TYPE: `${BASE_URL}/goa/srt/installation/amc/fetch-amc-type`,

      // 2. Fetch AMC Sites: GET /goa/srt/installation/amc/fetch-site-name?amc={amc}
      FETCH_SITE_NAME: (amc: string) =>
        `${BASE_URL}/goa/srt/installation/amc/fetch-site-name?amc=${encodeURIComponent(amc)}`,

      // 3. Fetch Site Details: GET /goa/srt/installation/amc/fetch-site-details?site_id={site_id}
      FETCH_SITE_DETAILS: (siteId: number | string) =>
        `${BASE_URL}/goa/srt/installation/amc/fetch-site-details?site_id=${encodeURIComponent(siteId)}`,

      // 4. Update AMC Site: POST /goa/srt/installation/amc/update-site
      UPDATE_SITE: `${BASE_URL}/goa/srt/installation/amc/update-site`,

      // 5. View AMC Data: GET /goa/srt/installation/amc/view-data
      VIEW_DATA: `${BASE_URL}/goa/srt/installation/amc/view-data`,

      // 6. View Completed AMC: GET /goa/srt/installation/amc/view-amc?amc_id={amc_id}
      VIEW_AMC: (amcId: number | string) =>
        `${BASE_URL}/goa/srt/installation/amc/view-amc?amc_id=${encodeURIComponent(amcId)}`,

      // 7. View AMC For Update: GET /goa/srt/installation/amc/view-amc-update?amc_id={amc_id}
      VIEW_AMC_UPDATE: (amcId: number | string) =>
        `${BASE_URL}/goa/srt/installation/amc/view-amc-update?amc_id=${encodeURIComponent(amcId)}`,

      // 8. View AMC Complaints: GET /goa/srt/installation/amc/view-amc-complaint
      VIEW_AMC_COMPLAINT: `${BASE_URL}/goa/srt/installation/amc/view-amc-complaint`,
    },
  },

  SURVEY: {
    SRT: {
      // 1. Fetch Site Names: GET /goa/srt/installation/survey/fetch-site-name
      FETCH_SITE_NAME: `${BASE_URL}/goa/srt/installation/survey/fetch-site-name`,

      // 2. Fetch Site Detail: GET /goa/srt/installation/survey/fetch-site-detail?srt_id={srt_id}
      FETCH_SITE_DETAIL: (srtId: number | string) =>
        `${BASE_URL}/goa/srt/installation/survey/fetch-site-detail?srt_id=${encodeURIComponent(srtId)}`,

      // 3. Survey Store: POST /goa/srt/installation/survey-store
      STORE: `${BASE_URL}/goa/srt/installation/survey-store`,

      // 4. Survey Update (Load): GET /goa/srt/installation/view-survey-update?id={id}
      VIEW_SURVEY_UPDATE: (id: number | string) =>
        `${BASE_URL}/goa/srt/installation/view-survey-update?id=${encodeURIComponent(id)}`,

      // 5. Survey Update Store: POST /goa/srt/installation/view-survey-update-store
      UPDATE_STORE: `${BASE_URL}/goa/srt/installation/view-survey-update-store`,

      // 6. View Survey (Summary + List): ANY /goa/srt/installation/view-survey/{status?}
      VIEW_SURVEY: (status?: string) =>
        status
          ? `${BASE_URL}/goa/srt/installation/view-survey/${encodeURIComponent(status)}`
          : `${BASE_URL}/goa/srt/installation/view-survey`,
    },
  },
};

export default GOA_API;
