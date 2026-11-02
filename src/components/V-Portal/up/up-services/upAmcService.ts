import { API_BASE_URL } from '../../../../services/authService';
import { getAuthToken, resolveUpMediaUrl } from './upComplaintService';

const getBaseUrl = (): string => {
  return (API_BASE_URL || 'https://klkerp.com/api').replace(/\/+$/, '');
};

const makeHeaders = (isMultipart = false): HeadersInit => {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    Accept: 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  if (!isMultipart) {
    headers['Content-Type'] = 'application/json';
  }
  return headers;
};

async function apiRequest<T = any>(
  endpoint: string,
  options: {
    method?: string;
    body?: any;
    isMultipart?: boolean;
  } = {}
): Promise<{ status: boolean; message?: string; data?: T; [key: string]: any }> {
  const base = getBaseUrl();
  const cleanEndpoint = endpoint.replace(/^\/+/, '');
  const url = `${base}/${cleanEndpoint}`;

  const method = options.method || 'GET';
  const headers = makeHeaders(options.isMultipart);

  const init: RequestInit = {
    method,
    headers,
  };

  if (options.body) {
    if (options.isMultipart) {
      init.body = options.body; // FormData
    } else if (typeof options.body === 'string') {
      init.body = options.body;
    } else {
      init.body = JSON.stringify(options.body);
    }
  }

  try {
    const res = await fetch(url, init);
    const contentType = res.headers.get('content-type') || '';
    let json: any = null;

    if (contentType.includes('application/json')) {
      json = await res.json();
    } else {
      const text = await res.text();
      try {
        json = JSON.parse(text);
      } catch {
        json = { status: res.ok, message: text };
      }
    }

    // Normalize raw array responses (e.g. Kusum get-years returns raw `[2026, 2025]`)
    if (Array.isArray(json)) {
      return { status: true, data: json as unknown as T };
    }

    if (!res.ok) {
      const msg =
        json?.message ||
        (json?.errors ? Object.values(json.errors).flat().join(' ') : null) ||
        `Request failed with status ${res.status}`;
      return {
        status: false,
        message: msg,
        errors: json?.errors,
        data: json?.data,
        raw: json,
      };
    }

    // Some APIs return `{ error: true, message: ... }`
    if (json?.error === true) {
      return { status: false, message: json.message || 'Error occurred', ...json };
    }

    // Some APIs return `{ success: true }` instead of `{ status: true }`
    if (json?.status === undefined && json?.success !== undefined) {
      json.status = json.success;
    } else if (json?.status === undefined) {
      json.status = true;
    }

    return json;
  } catch (err: any) {
    console.error(`[upAmcService] API error on ${url}:`, err);
    return {
      status: false,
      message: err?.message || 'Network error occurred.',
    };
  }
}

/* ─────────────────────────────────────────────────────────────
   1. RESCO AMC API
   Prefix: up/resco/amc/
───────────────────────────────────────────────────────────── */
export const upRescoAmcApi = {
  // 1.1 View assigned sites
  getViewAssignSite: async () => {
    return apiRequest('up/resco/amc/view-assign-site');
  },

  // 1.2 AMC years (create)
  getCreateYears: async () => {
    return apiRequest('up/resco/amc/create-site');
  },

  // 1.3 Pending months of a year
  getMonth: async (year: number | string) => {
    return apiRequest(`up/resco/amc/fetch-month?amc_years=${year}`);
  },

  // 1.4 Pending sites for a month
  getSiteName: async (year: number | string, month: number | string) => {
    return apiRequest(`up/resco/amc/site-name?amc_years=${year}&months=${month}`);
  },

  // 1.5 Site details
  getSiteDetails: async (id: number | string) => {
    return apiRequest(`up/resco/amc/fetch-site-details?id=${id}`);
  },

  // 1.6 Store AMC report
  storeSite: async (formData: FormData) => {
    return apiRequest('up/resco/amc/store-site', {
      method: 'POST',
      body: formData,
      isMultipart: true,
    });
  },

  // 1.7 View submitted reports
  getViewSite: async () => {
    return apiRequest('up/resco/amc/view-site');
  },

  // 1.8 Reports of one site
  getViewSiteDetails: async (id: number | string) => {
    return apiRequest(`up/resco/amc/view-site-details/${id}`);
  },

  // 1.9 Claim page data
  getClaimSite: async () => {
    return apiRequest('up/resco/amc/claim-site');
  },

  // 1.10 Raise claim
  storeClaim: async (formData: FormData) => {
    return apiRequest('up/resco/amc/claim-store', {
      method: 'POST',
      body: formData,
      isMultipart: true,
    });
  },

  // 1.11 Update claim
  updateClaim: async (formData: FormData) => {
    return apiRequest('up/resco/amc/update-claim', {
      method: 'POST',
      body: formData,
      isMultipart: true,
    });
  },
};

/* ─────────────────────────────────────────────────────────────
   2. UP SSL AMC API
───────────────────────────────────────────────────────────── */
export const upSslAmcApi = {
  // 2.1 Assigned AMC list
  getViewAssignLight: async () => {
    return apiRequest('up-ssl-amc-view-assign-light');
  },

  // 2.2 Assignment details
  getViewAssignLightDetails: async (id: number | string) => {
    return apiRequest(`up-ssl-amc-view-assign-light-details/${id}`);
  },

  // 2.3 Pending AMC sites
  getCreateLight: async () => {
    return apiRequest('up-ssl-amc-create-light');
  },

  // 2.4 Light details + pending months
  fetchLightDetails: async (id: number | string) => {
    return apiRequest(`up-ssl-amc-fetch-light-details?id=${id}`);
  },

  // 2.5 Store AMC report
  storeLight: async (formData: FormData) => {
    return apiRequest('up-ssl-amc-store-light', {
      method: 'POST',
      body: formData,
      isMultipart: true,
    });
  },

  // 2.6 View submitted reports
  getViewLight: async () => {
    return apiRequest('up-ssl-amc-view-light');
  },

  // 2.7 Claim page data
  getClaimLight: async () => {
    return apiRequest('up-ssl-amc-claim-light');
  },

  // 2.8 Raise claim
  storeClaim: async (formData: FormData) => {
    return apiRequest('up-ssl-amc-claim-store', {
      method: 'POST',
      body: formData,
      isMultipart: true,
    });
  },
};

/* ─────────────────────────────────────────────────────────────
   3. UP SSL 18W AMC API
───────────────────────────────────────────────────────────── */
export const upSsl18wAmcApi = {
  // 3.1 Assigned AMC list
  getViewAssignLight: async () => {
    return apiRequest('up-ssl18w-amc-view-assign-light');
  },

  // 3.2 Assignment details
  getViewAssignLightDetails: async (id: number | string) => {
    return apiRequest(`up-ssl18w-amc-view-assign-light-details/${id}`);
  },

  // 3.3 Pending AMC sites
  getCreateLight: async () => {
    return apiRequest('up-ssl18w-amc-create-light');
  },

  // 3.4 Light details + pending months
  fetchLightDetails: async (id: number | string) => {
    return apiRequest(`up-ssl18w-amc-fetch-light-details?id=${id}`);
  },

  // 3.5 Store AMC report
  storeLight: async (formData: FormData) => {
    return apiRequest('up-ssl18w-amc-store-light', {
      method: 'POST',
      body: formData,
      isMultipart: true,
    });
  },

  // 3.6 View submitted reports
  getViewLight: async () => {
    return apiRequest('up-ssl18w-amc-view-light');
  },

  // 3.7 Claim page data
  getClaimLight: async () => {
    return apiRequest('up-ssl18w-amc-claim-light');
  },

  // 3.8 Raise claim
  storeClaim: async (formData: FormData) => {
    return apiRequest('up-ssl18w-amc-claim-store', {
      method: 'POST',
      body: formData,
      isMultipart: true,
    });
  },

  // 3.9 Update claim
  updateClaim: async (formData: FormData) => {
    return apiRequest('up-ssl18w-amc-claim-update', {
      method: 'POST',
      body: formData,
      isMultipart: true,
    });
  },
};

/* ─────────────────────────────────────────────────────────────
   4. UP KUSUM C AMC API
   Prefix: /up/kusumc/amc/
───────────────────────────────────────────────────────────── */
export const upKusumCAmcApi = {
  // 4.1 AMC years
  getYears: async () => {
    return apiRequest('up/kusumc/amc/get-years');
  },

  // 4.2 Sites with pending AMC
  getSites: async (year: number | string) => {
    return apiRequest(`up/kusumc/amc/get-sites?year=${year}`);
  },

  // 4.3 Fetch site (form pre-fill)
  fetchSiteName: async (id: number | string, year?: number | string, month?: number | string) => {
    let q = `id=${id}`;
    if (year) q += `&year=${year}`;
    if (month) q += `&month=${month}`;
    return apiRequest(`up/kusumc/amc/fetch-site-name?${q}`);
  },

  // 4.4 Store AMC report
  updateSite: async (formData: FormData) => {
    return apiRequest('up/kusumc/amc/update-site', {
      method: 'POST',
      body: formData,
      isMultipart: true,
    });
  },

  // 4.5 Assigned sites list
  fetchViewAssignSite: async () => {
    return apiRequest('up/kusumc/amc/fetch-view-assign-site');
  },

  // 4.6 AMC details of one site
  fetchViewDetails: async (id: number | string) => {
    return apiRequest(`up/kusumc/amc/fetch-view-details/${id}`);
  },

  // 4.7 Completed AMC list
  completedDetails: async () => {
    return apiRequest('up/kusumc/amc/completed-details');
  },

  // 4.8 Get one report for edit
  editDetails: async (id: number | string) => {
    return apiRequest(`up/kusumc/amc/edit-details/${id}`);
  },

  // 4.9 Update report
  updateReport: async (id: number | string, data: any) => {
    return apiRequest(`up/kusumc/amc/update/${id}`, {
      method: 'PUT',
      body: data,
    });
  },
};

/* ─────────────────────────────────────────────────────────────
   5. UP KUSUM B AMC API
   Prefix: /up/kusumb/amc/
───────────────────────────────────────────────────────────── */
export const upKusumBAmcApi = {
  // 5.1 AMC years
  getYears: async () => {
    return apiRequest('up/kusumb/amc/get-years');
  },

  // 5.2 Pending months of a year
  getMonths: async (year: number | string) => {
    return apiRequest(`up/kusumb/amc/get-months?year=${year}`);
  },

  // 5.3 Sites with pending AMC
  getSites: async (year: number | string) => {
    return apiRequest(`up/kusumb/amc/get-sites?year=${year}`);
  },

  // 5.4 Fetch site (form pre-fill)
  fetchSiteName: async (id: number | string, year?: number | string, month?: number | string) => {
    let q = `id=${id}`;
    if (year) q += `&year=${year}`;
    if (month) q += `&month=${month}`;
    return apiRequest(`up/kusumb/amc/fetch-site-name?${q}`);
  },

  // 5.5 Store AMC report
  updateSite: async (formData: FormData) => {
    return apiRequest('up/kusumb/amc/update-site', {
      method: 'POST',
      body: formData,
      isMultipart: true,
    });
  },

  // 5.6 Assigned sites list (note route typo `amc/amc` preserved)
  fetchViewAssignSite: async () => {
    return apiRequest('up/kusumb/amc/amc/fetch-view-assign-site');
  },

  // 5.7 AMC details of one site
  fetchViewDetails: async (id: number | string) => {
    return apiRequest(`up/kusumb/amc/amc/fetch-view-details/${id}`);
  },

  // 5.8 Completed AMC list
  completedDetails: async () => {
    return apiRequest('up/kusumb/amc/completed-details');
  },

  // 5.9 Get one report for edit
  editDetails: async (id: number | string) => {
    return apiRequest(`up/kusumb/amc/edit-details/${id}`);
  },

  // 5.10 Update report
  updateReport: async (id: number | string, data: any) => {
    return apiRequest(`up/kusumb/amc/update/${id}`, {
      method: 'PUT',
      body: data,
    });
  },
};

/* ─────────────────────────────────────────────────────────────
   6. UP POWER PACK AMC API
   Prefix: /up/powerpack/amc/
───────────────────────────────────────────────────────────── */
export const upPowerPackAmcApi = {
  // 6.1 AMC years
  getYears: async () => {
    return apiRequest('up/powerpack/amc/get-years');
  },

  // 6.2 Pending months of a year
  getMonths: async (year: number | string) => {
    return apiRequest(`up/powerpack/amc/get-months?year=${year}`);
  },

  // 6.3 Sites with pending AMC
  getSites: async (year: number | string) => {
    return apiRequest(`up/powerpack/amc/get-sites?year=${year}`);
  },

  // 6.4 Fetch site (form pre-fill)
  fetchSiteName: async (id: number | string, year?: number | string, month?: number | string) => {
    let q = `id=${id}`;
    if (year) q += `&year=${year}`;
    if (month) q += `&month=${month}`;
    return apiRequest(`up/powerpack/amc/fetch-site-name?${q}`);
  },

  // 6.5 Store AMC report
  updateSite: async (formData: FormData) => {
    return apiRequest('up/powerpack/amc/update-site', {
      method: 'POST',
      body: formData,
      isMultipart: true,
    });
  },

  // 6.6 Assigned sites list
  fetchViewAssignSite: async () => {
    return apiRequest('up/powerpack/amc/amc/fetch-view-assign-site');
  },

  // 6.7 AMC details of one site
  fetchViewDetails: async (id: number | string) => {
    return apiRequest(`up/powerpack/amc/amc/fetch-view-details/${id}`);
  },

  // 6.8 Completed AMC list
  completedDetails: async () => {
    return apiRequest('up/powerpack/amc/completed-details');
  },

  // 6.9 Get one report for edit
  editDetails: async (id: number | string) => {
    return apiRequest(`up/powerpack/amc/edit-details/${id}`);
  },

  // 6.10 Update report
  updateReport: async (id: number | string, data: any) => {
    return apiRequest(`up/powerpack/amc/update/${id}`, {
      method: 'PUT',
      body: data,
    });
  },
};

/* ─────────────────────────────────────────────────────────────
   7. UP ONGRID AMC API
   Prefix: /up/ongrid/amc/
───────────────────────────────────────────────────────────── */
export const upOngridAmcApi = {
  // 7.1 AMC years
  getYears: async () => {
    return apiRequest('up/ongrid/amc/get-years');
  },

  // 7.2 Pending months of a year
  getMonths: async (year: number | string) => {
    return apiRequest(`up/ongrid/amc/get-months?year=${year}`);
  },

  // 7.3 Sites with pending AMC
  getSites: async (year: number | string) => {
    return apiRequest(`up/ongrid/amc/get-sites?year=${year}`);
  },

  // 7.4 Fetch site (form pre-fill)
  fetchSiteName: async (id: number | string, year?: number | string, month?: number | string) => {
    let q = `id=${id}`;
    if (year) q += `&year=${year}`;
    if (month) q += `&month=${month}`;
    return apiRequest(`up/ongrid/amc/fetch-site-name?${q}`);
  },

  // 7.5 Store AMC report
  updateSite: async (formData: FormData) => {
    return apiRequest('up/ongrid/amc/update-site', {
      method: 'POST',
      body: formData,
      isMultipart: true,
    });
  },

  // 7.6 Assigned sites list
  fetchViewAssignSite: async () => {
    return apiRequest('up/ongrid/amc/amc/fetch-view-assign-site');
  },

  // 7.7 AMC details of one site
  fetchViewDetails: async (id: number | string) => {
    return apiRequest(`up/ongrid/amc/amc/fetch-view-details/${id}`);
  },

  // 7.8 Completed AMC list
  completedDetails: async () => {
    return apiRequest('up/ongrid/amc/completed-details');
  },

  // 7.9 Get one report for edit
  editDetails: async (id: number | string) => {
    return apiRequest(`up/ongrid/amc/edit-details/${id}`);
  },

  // 7.10 Update report
  updateReport: async (id: number | string, data: any) => {
    return apiRequest(`up/ongrid/amc/update/${id}`, {
      method: 'PUT',
      body: data,
    });
  },
};

/* ─────────────────────────────────────────────────────────────
   8. UP OFFGRID AMC API
   Prefix: /up/offgrid/amc/
───────────────────────────────────────────────────────────── */
export const upOffgridAmcApi = {
  // 8.1 AMC years
  getYears: async () => {
    return apiRequest('up/offgrid/amc/get-years');
  },

  // 8.2 Pending months of a year
  getMonths: async (year: number | string) => {
    return apiRequest(`up/offgrid/amc/get-months?year=${year}`);
  },

  // 8.3 Sites with pending AMC
  getSites: async (year: number | string) => {
    return apiRequest(`up/offgrid/amc/get-sites?year=${year}`);
  },

  // 8.4 Fetch site (form pre-fill)
  fetchSiteName: async (id: number | string, year?: number | string, month?: number | string) => {
    let q = `id=${id}`;
    if (year) q += `&year=${year}`;
    if (month) q += `&month=${month}`;
    return apiRequest(`up/offgrid/amc/fetch-site-name?${q}`);
  },

  // 8.5 Store AMC report
  updateSite: async (formData: FormData) => {
    return apiRequest('up/offgrid/amc/update-site', {
      method: 'POST',
      body: formData,
      isMultipart: true,
    });
  },

  // 8.6 Assigned sites list
  fetchViewAssignSite: async () => {
    return apiRequest('up/offgrid/amc/amc/fetch-view-assign-site');
  },

  // 8.7 AMC details of one site
  fetchViewDetails: async (id: number | string) => {
    return apiRequest(`up/offgrid/amc/amc/fetch-view-details/${id}`);
  },

  // 8.8 Completed AMC list
  completedDetails: async () => {
    return apiRequest('up/offgrid/amc/completed-details');
  },

  // 8.9 Get one report for edit
  editDetails: async (id: number | string) => {
    return apiRequest(`up/offgrid/amc/edit-details/${id}`);
  },

  // 8.10 Update report
  updateReport: async (id: number | string, data: any) => {
    return apiRequest(`up/offgrid/amc/update/${id}`, {
      method: 'PUT',
      body: data,
    });
  },
};

export { resolveUpMediaUrl };
