import { API_BASE_URL } from '../../../services/authService';

/**
 * Bihar Vendor Portal API Endpoints
 * Contains all Bihar API URLs
 */
export const BIHAR_API = {
  SRT_200MW: {
    SURVEY_SITE_LIST: `${API_BASE_URL}/bihar/srt200mw-survey`,
    SURVEY_STORE: `${API_BASE_URL}/bihar/srt200mw-survey-store`,
    SURVEY_EDIT: (id) => `${API_BASE_URL}/bihar/srt200mw-survey-edit?id=${id}`,
    SURVEY_UPDATE: `${API_BASE_URL}/bihar/srt200mw-survey-update`,
    VIEW_SURVEY: `${API_BASE_URL}/bihar/srt200mw-view-survey`,
  },
};

export default BIHAR_API;
