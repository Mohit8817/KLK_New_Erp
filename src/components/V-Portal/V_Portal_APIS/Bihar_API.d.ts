export interface BiharSrt200MwSurveyApi {
  SURVEY_SITE_LIST: string;
  PENDING_SITES: string;
  SURVEY_STORE: string;
  SURVEY_EDIT: (id: string | number) => string;
  SURVEY_UPDATE: string;
  VIEW_SURVEY: string;
}

export interface BiharUlaSurveyApi {
  CREATE: string;
  DISTRICTS: string;
  BLOCKS: (district: string) => string;
  PANCHAYAT: (district: string, block: string) => string;
  STORE: string;
  VIEW: string;
  EDIT: (id: string | number) => string;
  UPDATE: string;
}

export interface BiharSurveyApi {
  SRT_200MW: BiharSrt200MwSurveyApi;
  ULA: BiharUlaSurveyApi;
}

export interface BiharUlaInstallationApi {
  DASHBOARD: string;
  DASHBOARD_BY_STATUS: (status: string | number) => string;
  DASHBOARD_BY_DISTRICT: (status: string | number, district: string) => string;
  VIEW_ASSIGN_SITE: string;
  VIEW_ASSIGN_SITE_DETAIL: (id: string | number) => string;
  ACCEPT_ASSIGN_SITE: (id: string | number) => string;
  FETCH_SITE_NAME: string;
  FETCH_SITE_DETAILS: (siteId: string | number) => string;
  PENDING_STRUCTURE_STORE: string;
  STRUCTURE_EDIT_SITE: (siteId: string | number) => string;
  UPDATE_STRUCTURE_SITE: string;
  VIEW_INSTALLED_SITES: string;
  PENDING_SITE: (siteId: string | number) => string;
  STORE_SITE: string;
  PENDING_SITE_STORE?: string;
  EDIT_SITE: (siteId: string | number) => string;
  UPDATE_SITE: string;
  DOC_STORE: string;
  VIEW_PAYMENT: string;
  CLAIM_PAYMENT_DETAILS: string;
  CLAIM_STORE: string;
}

export interface BiharSrtInstallationApi {
  DASHBOARD: string;
  DASHBOARD_BY_STATUS?: (status: string | number) => string;
  DASHBOARD_BY_DISTRICT?: (status: string | number, district: string) => string;
  VIEW_ASSIGN_SITE: string;
  ASSIGN_SITE_ACCEPT: string;
  FETCH_SITE_NAME: string;
  FETCH_SITE_DETAIL: (srtId: string | number) => string;
  INSTALLATION_STORE: string;
  VIEW_INSTALL_SITES: string;
  EDIT_INSTALL_SITE: (id: string | number) => string;
  EDIT_INSTALL_SITE_STORE: string;
  INSTALL_DOCUMENT_STORE: string;
  VIEW_INSTALL_CLAIM: string;
  INSTALL_CLAIM_RAISED: string;
  VIEW_ASSIGN_SITES?: string;
  INSTALL_SITE?: string;
  VIEW_INSTALLATION?: string;
  CLAIM_REQUEST?: string;
}

export interface BiharSslInstallationApi {
  DASHBOARD: string;
  DASHBOARD_BY_STATUS: (status: string | number) => string;
  DASHBOARD_BY_DISTRICT: (status: string | number, district: string) => string;
  VIEW_ASSIGNED_LIGHTS: string;
  ACCEPT_ASSIGNED: string;
  FETCH_LIGHT_NAMES: string;
  FETCH_LIGHT_DETAIL: (uniqueId: string | number) => string;
  INSTALL_LIGHT_STORE: string;
  VIEW_INSTALLED_LIGHTS: string;
  EDIT_INSTALLED_LIGHT: (id: string | number) => string;
  UPDATE_INSTALLED_LIGHT: string;
  CLAIM_RAISED: string;
  VIEW_CLAIM_DETAILS: string;
  DOWNLOAD_CLAIM_PDF: (id: string | number) => string;
  UPDATE_CLAIM_RAISED: string;
  VIEW_SUPPLY_INSPECTION: string;
  STORE_SUPPLY_INSPECTION: string;
  UPDATE_SUPPLY_INSPECTION: (id: string | number) => string;
  VIEW_INSTALLATION_INSPECTION: string;
  STORE_INSTALLATION_INSPECTION: string;
  FETCH_INSPECTION_BLOCKS: (district: string) => string;
  FETCH_INSPECTION_PANCHAYATS: (block: string, district: string) => string;
  ASSIGNED_LIGHTS: string;
  INSTALL_LIGHT: string;
  INSTALLATION_DETAIL: string;
  SUPPLY_INSPECTION: string;
  INSTALLATION_INSPECTION: string;
  CLAIM_REQUEST: string;
}

export interface BiharInstallationApi {
  ULA: BiharUlaInstallationApi;
  SRT: BiharSrtInstallationApi;
  SSL: BiharSslInstallationApi;
}

export interface BiharSslAmcApi {
  BASE: string;
  VOLUMES: string;
  DISTRICTS: (volume?: string) => string;
  BLOCKS: (district: string, volume?: string) => string;
  PANCHAYATS: (block: string, district: string, volume?: string) => string;
  STORE_ASSIGN_LIGHT: string;
  VIEW_ASSIGN_LIGHT: string;
  ADD_DATA: string;
  VIEW_DATA: string;
  APPROVAL_STATUS: string;
  APPROVAL_LIST: string;
  APPROVAL_PENDING: string;
}

export interface BiharSrtAmcApi {
  ADD_DATA: string;
  VIEW_DATA: string;
  SITE_LIST: string;
  COMPLAINT_RAISED: string;
}

export interface BiharAmcApi {
  SSL: BiharSslAmcApi;
  SRT: BiharSrtAmcApi;
}

export interface BiharComplaintCategoryApi {
  ADD_COMPLAINT: string;
  VIEW_COMPLAINT: string;
  ASSIGNED_COMPLAINT: string;
  UPDATE_COMPLAINT: string;
  COMPLAINT_RAISED?: string;
}

export interface BiharComplaintApi {
  SSL: BiharComplaintCategoryApi;
  SRT: BiharComplaintCategoryApi;
}

export interface BiharMasterApi {
  SRT_200MW: BiharSrt200MwSurveyApi;
  SURVEY: BiharSurveyApi;
  INSTALLATION: BiharInstallationApi;
  AMC: BiharAmcApi;
  COMPLAINTS: BiharComplaintApi;
}

export declare const BIHAR_SURVEY_API: BiharSurveyApi;
export declare const BIHAR_INSTALLATION_API: BiharInstallationApi;
export declare const BIHAR_AMC_API: BiharAmcApi;
export declare const BIHAR_COMPLAINT_API: BiharComplaintApi;
export declare const BIHAR_API: BiharMasterApi;

export default BIHAR_API;
