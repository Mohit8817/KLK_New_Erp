export declare const ASSAM_SWP_API: {
  ASSIGNED_SITES: string;
  ASSIGN_SITE_DETAIL: (id: any) => string;
<<<<<<< HEAD
  ACCEPT_INSTALLATION: (id: any, assignId?: any) => string;
=======
  ACCEPT_INSTALLATION: (id: any) => string;
>>>>>>> b7724a26675275e33c5aa8bd0f2e9734dbf67476
  INSTALL_SITE_NAME_LIST: string;
  INSTALL_SITE_DETAILS: (siteId: string | number) => string;
  INSTALL_SITE_STORE: string;
  VIEW_INSTALL_SITE: string;
  INSTALL_SITE_UPDATE: (id: string | number) => string;
  INSTALL_SITE_UPDATE_STORE: string;
  DOC_SUBMIT: string;
  VIEW_CLAIM: string;
  ADD_CLAIM: string;
  UPDATE_CLAIM: string;
  DASHBOARD: string;
  VIEW_DASHBOARD_BY_STATUS: (status: string) => string;
  VIEW_DISTRICTWISE_BY_STATUS: (status: string, district: string) => string;
};

export declare const ASSAM_SWP_DASHBOARD_URL: string;

export declare const ASSAM_API: {
  SWP_DASHBOARD: string;
  SWP: typeof ASSAM_SWP_API;
  ROOT_URL: string;
  BASE_URL: string;
};

export default ASSAM_API;
