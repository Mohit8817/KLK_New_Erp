import { API_BASE_URL } from '../../../services/authService';

/**
 * Base URLs for Kashmir SRT 70MW V-Portal API Endpoints
 * All endpoints authenticated via Sanctum/Passport Bearer token
 */
const BASE_URL = (API_BASE_URL || 'https://klkerp.com/api').replace(/\/+$/, '');

export const KASHMIR_API = {
  INSTALLATION: {
    SRT_70MW: {
      // 1. View assigned sites: GET kashmir/srt/70mw/installation/assign-site
      ASSIGN_SITE: `${BASE_URL}/kashmir/srt/70mw/installation/assign-site`,

      // 2. Accept assignment: ANY / POST kashmir/srt/70mw/installation/assign-site-status
      ASSIGN_SITE_STATUS: `${BASE_URL}/kashmir/srt/70mw/installation/assign-site-status`,

      // 3. Fetch sites (dropdown): GET kashmir/srt/70mw/installation/fetch-sites
      FETCH_SITES: `${BASE_URL}/kashmir/srt/70mw/installation/fetch-sites`,

      // 4. Fetch site detail: GET kashmir/srt/70mw/installation/fetch-site-detail?srt_id={srt_id}
      FETCH_SITE_DETAIL: (srtId: number | string) =>
        `${BASE_URL}/kashmir/srt/70mw/installation/fetch-site-detail?srt_id=${encodeURIComponent(srtId)}`,

      // 5. Submit installation details: POST kashmir/srt/70mw/installation/site-details-store (multipart/form-data)
      SITE_DETAILS_STORE: `${BASE_URL}/kashmir/srt/70mw/installation/site-details-store`,

      // 6. Get installed site for edit: GET kashmir/srt/70mw/installation-site-update?srt_id={srt_id}
      SITE_UPDATE_GET: (srtId: number | string) =>
        `${BASE_URL}/kashmir/srt/70mw/installation-site-update?srt_id=${encodeURIComponent(srtId)}`,

      // 7. Update installed site details: POST kashmir/srt/70mw/installation-site-update-store (multipart/form-data)
      SITE_UPDATE_STORE: `${BASE_URL}/kashmir/srt/70mw/installation-site-update-store`,

      // 8. View dispatched material: GET kashmir/srt/70mw/view-installation-dispatch-material (or jammu/...)
      VIEW_DISPATCH_MATERIAL: `${BASE_URL}/kashmir/srt/70mw/view-installation-dispatch-material`,
      VIEW_DISPATCH_MATERIAL_JAMMU: `${BASE_URL}/jammu/srt/70mw/view-installation-dispatch-material`,

      // 9. View installed sites summary: GET kashmir/srt/70mw/view-install-sites
      VIEW_INSTALL_SITES: `${BASE_URL}/kashmir/srt/70mw/view-install-sites`,

      // 10. View claim requests: GET kashmir/srt70mw/view-claim-request
      VIEW_CLAIM_REQUEST: `${BASE_URL}/kashmir/srt70mw/view-claim-request`,

      // 11. Raise installation claim: POST kashmir/srt70mw/install-claim-raised (multipart/form-data)
      INSTALL_CLAIM_RAISED: `${BASE_URL}/kashmir/srt70mw/install-claim-raised`,

      // 12. Submit documents: GET kashmir/srt70mw/install-submit-document?srt_id={srt_id}
      INSTALL_SUBMIT_DOCUMENT: (srtId: number | string) =>
        `${BASE_URL}/kashmir/srt70mw/install-submit-document?srt_id=${encodeURIComponent(srtId)}`,

      // 13. Dashboard counts: GET kashmir/srt/70mw/installation/dashboard
      DASHBOARD: `${BASE_URL}/kashmir/srt/70mw/installation/dashboard`,

      // 14. Dashboard site list by status: GET kashmir/srt/70mw-installation-view-dashboard/{status}
      DASHBOARD_BY_STATUS: (status: string) =>
        `${BASE_URL}/kashmir/srt/70mw-installation-view-dashboard/${encodeURIComponent(status)}`,

      // 15. Dashboard site list by district and status: GET kashmir/srt/70mw-installation-districtwise/{status}/{district}
      DASHBOARD_DISTRICTWISE: (status: string, district: string) =>
        `${BASE_URL}/kashmir/srt/70mw-installation-districtwise/${encodeURIComponent(status)}/${encodeURIComponent(district)}`,
    },
  },

  SURVEY: {
    SRT_70MW: {
      // 16. Assigned survey sites: GET kashmir/srt70mw/survey-assign-site
      ASSIGN_SITE: `${BASE_URL}/kashmir/srt70mw/survey-assign-site`,

      // 17. Survey summary and completed surveys: GET kashmir/srt70mw/survey-view
      VIEW: `${BASE_URL}/kashmir/srt70mw/survey-view`,

      // 18. Survey pending sites (add form): GET kashmir/srt70mw/survey-add
      ADD: `${BASE_URL}/kashmir/srt70mw/survey-add`,

      // 19. Survey site detail: GET kashmir/srt70mw/survey-fetch-site-detail?srt_id={srt_id}
      FETCH_SITE_DETAIL: (srtId: number | string) =>
        `${BASE_URL}/kashmir/srt70mw/survey-fetch-site-detail?srt_id=${encodeURIComponent(srtId)}`,

      // 20. Submit survey: POST kashmir/srt70mw/survey-store (multipart/form-data)
      STORE: `${BASE_URL}/kashmir/srt70mw/survey-store`,

      // 21. Get survey for edit: GET kashmir/srt70mw/survey-edit/{id}
      EDIT: (id: number | string) =>
        `${BASE_URL}/kashmir/srt70mw/survey-edit/${encodeURIComponent(id)}`,

      // 22. Update survey: PUT/POST kashmir/srt70mw/survey-update/{id}
      UPDATE: (id: number | string) =>
        `${BASE_URL}/kashmir/srt70mw/survey-update/${encodeURIComponent(id)}`,
    },
  },

  EXPENSES: {
    SRT_70MW: {
      // 23. List expense claims: GET kashmir/srt70mw/installation-expenses
      LIST: `${BASE_URL}/kashmir/srt70mw/installation-expenses`,

      // 24. Sites for new claim: GET kashmir/srt70mw/installation-expenses-create
      CREATE_DATA: `${BASE_URL}/kashmir/srt70mw/installation-expenses-create`,

      // 25. Submit expense claim: POST kashmir/srt70mw/installation-expenses-store (multipart/form-data)
      STORE: `${BASE_URL}/kashmir/srt70mw/installation-expenses-store`,

      // 26. Get claim for edit: GET kashmir/srt70mw/installation-expenses-edit?claim_id={claim_id}
      EDIT: (claimId: number | string) =>
        `${BASE_URL}/kashmir/srt70mw/installation-expenses-edit?claim_id=${encodeURIComponent(claimId)}`,

      // 27. Update expense claim: POST kashmir/srt70mw/installation-expenses-update (multipart/form-data)
      UPDATE: `${BASE_URL}/kashmir/srt70mw/installation-expenses-update`,

      // 28. Approved claims and payment status: GET kashmir/srt70mw/installation-expenses-view-payment
      VIEW_PAYMENT: `${BASE_URL}/kashmir/srt70mw/installation-expenses-view-payment`,
    },
  },
};
