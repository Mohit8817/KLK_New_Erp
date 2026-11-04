import { API_BASE_URL } from '../../../services/authService';

/**
 * Base URLs for Vendor Portal Common API Endpoints:
 *  - VendorProgressController (Vendor Progress Reports)
 *  - VendorController (Vendor Profile & Sub-Users)
 *  - VendorComplaintController (Vendor Complaints)
 */
const RAW_BASE = (API_BASE_URL || 'https://klkerp.com/api').replace(/\/+$/, '');
export const API_PREFIX = RAW_BASE.endsWith('/api') ? RAW_BASE : `${RAW_BASE}/api`;
export const BASE_URL = API_PREFIX;
export const ROOT_URL = API_PREFIX.replace(/\/api\/?$/, '');

export const VENDOR_COMMON_API = {
  // ── A. Vendor Progress (VendorProgressController) ──
  REPORTS: {
    // A1. Work order list for a progress report: GET /vendor-add-progress
    ADD_PROGRESS_WO: `${BASE_URL}/vendor-add-progress`,

    // A2. Save a progress report: POST /vendor-save-progress (multipart/form-data)
    SAVE_PROGRESS: `${BASE_URL}/vendor-save-progress`,

    // A3. My progress reports: GET /vendor-view-progress
    VIEW_PROGRESS: `${BASE_URL}/vendor-view-progress`,

    // A4. Progress reports by date range: GET /vendor-daily-view-progress?start_date=...&till_date=...&vendor=...
    DAILY_PROGRESS: `${BASE_URL}/vendor-daily-view-progress`,

    // A5. State, district and quantity of a work order: GET /getdetails?wo={wo}
    GET_WO_DETAILS: (wo: string) => `${BASE_URL}/getdetails?wo=${encodeURIComponent(wo)}`,
  },

  // ── B. Vendor Profile and Users (VendorController) ──
  USERS: {
    // B1. View my profile: GET /view-vendor-ptofile
    VIEW_PROFILE: `${BASE_URL}/view-vendor-ptofile`,

    // B2. Update my profile: POST /update-vendor-ptofile (multipart/form-data)
    UPDATE_PROFILE: `${BASE_URL}/update-vendor-ptofile`,

    // B3. Change my password: POST /change-vendor-password
    CHANGE_PASSWORD: `${BASE_URL}/change-vendor-password`,

    // B4. Data for the add-user form: GET /vendor-add-user
    ADD_USER_DATA: `${BASE_URL}/vendor-add-user`,

    // B5. Create a sub-user: POST /vendor-save-user
    SAVE_USER: `${BASE_URL}/vendor-save-user`,

    // B6. List my sub-users: GET /vendor-view-user
    VIEW_USERS: `${BASE_URL}/vendor-view-user`,

    // B7. Fetch a sub-user: GET /vendor-edit-user/{id}
    FETCH_USER: (id: number | string) => `${BASE_URL}/vendor-edit-user/${encodeURIComponent(id)}`,

    // B8. Update a sub-user: POST /vendor-update-user/{id}
    UPDATE_USER: (id: number | string) => `${BASE_URL}/vendor-update-user/${encodeURIComponent(id)}`,

    // B9. Fetch a sub-user's permissions: GET /vendor-role-permission-user/{id} (encrypted id)
    ROLE_PERMISSIONS: (encryptedId: string) =>
      `${BASE_URL}/vendor-role-permission-user/${encodeURIComponent(encryptedId)}`,

    // B10. Save a sub-user's permissions: POST /vendor-save-user-permissions
    SAVE_ROLE_PERMISSIONS: `${BASE_URL}/vendor-save-user-permissions`,
  },

  // ── C. Vendor Complaints (VendorComplaintController) ──
  COMPLAINTS: {
    // C1. Work order list for a complaint: GET /vendor-add-complaint
    ADD_COMPLAINT_WO: `${BASE_URL}/vendor-add-complaint`,

    // C2. Register a complaint: POST /vendor-save-complaint (multipart/form-data)
    SAVE_COMPLAINT: `${BASE_URL}/vendor-save-complaint`,

    // C3. Open and closed complaints: GET /vendor-view-complaint
    VIEW_COMPLAINTS: `${BASE_URL}/vendor-view-complaint`,

    // C4. Fetch a complaint: GET /vendor-edit-complaint/{id}
    FETCH_COMPLAINT: (id: number | string) =>
      `${BASE_URL}/vendor-edit-complaint/${encodeURIComponent(id)}`,

    // C5. Close a complaint: POST /vendor-update-complaint (multipart/form-data)
    UPDATE_CLOSE_COMPLAINT: `${BASE_URL}/vendor-update-complaint`,

    // C6. Assign a complaint to a vendor: POST /assignvendor-save-complaint
    ASSIGN_COMPLAINT: `${BASE_URL}/assignvendor-save-complaint`,
  },
};

/**
 * Resolve Common media URLs
 * - Reports & Complaints images are stored in `uploads/image/`
 * - Vendor profile photos are stored in `uploads/vendor/`
 */
export function getCommonMediaCandidates(path?: string | null): string[] {
  if (!path) return [];
  const trimmed = String(path).trim();
  if (!trimmed) return [];
  if (/^(https?:|data:|blob:)/i.test(trimmed)) return [trimmed];

  const normalized = trimmed.replace(/^\/+/, '');
  const filename = normalized.split('/').pop() || normalized;
  const candidates: string[] = [];

  candidates.push(`${ROOT_URL}/${normalized}`);
  candidates.push(`${ROOT_URL}/uploads/image/${filename}`);
  candidates.push(`${ROOT_URL}/uploads/vendor/${filename}`);
  candidates.push(`${ROOT_URL}/uploads/${filename}`);

  const R2_BASE = ((import.meta.env.VITE_R2_PUBLIC_URL as string | undefined) ?? '').replace(/\/+$/, '');
  if (R2_BASE) {
    candidates.push(`${R2_BASE}/${normalized}`);
    candidates.push(`${R2_BASE}/${filename}`);
  }

  return Array.from(new Set(candidates));
}

export function resolveCommonMediaUrl(path?: string | null): string {
  if (!path) return '';
  if (/^(https?:|data:|blob:)/i.test(path)) return path;
  const candidates = getCommonMediaCandidates(path);
  return candidates[0] || `${ROOT_URL}/${path.replace(/^\/+/, '')}`;
}
