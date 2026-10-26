import { authService } from '../../../../services/authService';
import { BIHAR_COMPLAINT_API } from '../../V_Portal_APIS/Bihar_API';
import { getMediaUrl } from './biharSslInstallationService';

export { getMediaUrl };

export interface BiharComplaintItem {
  id: number;
  complaint_id: number | string;
  uid?: string;
  state: string;
  company_id?: number;
  discom?: string;
  district: string;
  block?: string;
  village?: string;
  panchyat?: string;
  panchayat?: string; // alias
  dept_name?: string;
  site_name?: string;
  location?: string;
  firm_name?: string;
  ca_no?: string;
  sanction_load?: string | number;
  plant_sc?: string;
  wo_no?: string;
  phase?: string;
  address?: string;
  ward_no?: string;
  pole_no?: string;
  light_no?: string;
  beneficiary_name?: string;
  contact_no?: string;
  contact_person?: string;
  contact_number?: string;
  latitude?: string | number;
  longitude?: string | number;
  along_with_pole?: string;
  luminary_no?: string;
  sim_no?: string;
  battery_serial_no?: string;
  module_no?: string;
  inst_date?: string;
  date_of_installation?: string;
  complaint_issue?: string;
  complaint: string;
  complaint_source?: string;
  start_date?: string;
  complaint_date?: string;
  close_status: number; // 0 = open, 1 = closed, 2 = approved
  status: number; // 0 = open, 1 = resolution submitted / approved
  sms?: string;
  close_sms?: string;
  assigned_to?: number | string;
  assigned_vendor_name?: string;
  complaint_raised_by?: string | number;
  raised_complaint?: string | number;
  created_by?: number;
  file?: string | null;
  file2?: string | null;
  file3?: string | null;
  file4?: string | null;
  r_file?: string | null;
  r_file2?: string | null;
  r_file3?: string | null;
  r_file4?: string | null;
  remarks?: string;
  resolved_by?: string;
  r_email?: string;
  r_mobile?: string;
  close_date?: string;
  manual_close_date?: string;
}

export interface AssignedComplaintsResponse {
  company_id?: number;
  loginId?: number;
  state?: string;
  role?: string;
  parent_id?: number;
  name?: string;
  data: BiharComplaintItem[]; // closed
  open: BiharComplaintItem[];
  approved: BiharComplaintItem[];
  open_complaint: number;
  approved_complaint: number;
  close_complaint: number;
  total_complaint: number;
  vendors?: Record<string, any>;
}

export interface SslPoleDataResponse {
  id: number;
  uid?: string;
  unique_id?: string;
  beneficiary_name: string;
  contact_no: string;
  latitude: string | number;
  longitude: string | number;
  luminary_no: string;
  sim_no: string;
  light_no: string;
  battery_serial_no: string;
  module_no: string;
  date_of_installation: string;
}

export interface SrtSiteDetailsResponse {
  id: number;
  discom: string;
  district: string;
  dept_name: string;
  site_name: string;
  location: string;
  firm_name: string;
  ca_no: string;
  sanction_load: string | number;
  plant_sc: string;
  wo_no: string;
  phase: string;
}

type MutationResult = { success: boolean; message: string; data?: any };

class BiharComplaintService {
  /* ─────────────────────────────────────────────────────────────────────────
     Core helpers (single request, no fallback URLs, no fake data)
     ───────────────────────────────────────────────────────────────────────── */

  private getHeaders(isMultipart = false): Record<string, string> {
    const token = authService.getToken();
    const headers: Record<string, string> = { Accept: 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    if (!isMultipart) headers['Content-Type'] = 'application/json';
    return headers;
  }

  private errorMessage(json: any, status: number): string {
    if (status === 401) return 'Session expired. Please login again.';
    if (json?.message) return json.message;
    if (json?.error) return json.error;
    if (json?.errors && typeof json.errors === 'object') {
      return Object.values(json.errors).flat().join(', ');
    }
    return `Request failed (${status})`;
  }

  /** GET request. Throws on any failure so the UI can show the real error. */
  private async get(url: string): Promise<any> {
    const res = await fetch(url, { method: 'GET', headers: this.getHeaders() });
    const json = await res.json().catch(() => null);
    if (!res.ok || json?.status === false || json?.success === false) {
      throw new Error(this.errorMessage(json, res.status));
    }
    return json;
  }

  /** POST multipart form. Never returns fake success. */
  private async postForm(
    url: string,
    form: FormData,
    okMessage: string,
    failMessage: string,
    softSuccessMatch?: string
  ): Promise<MutationResult> {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: this.getHeaders(true),
        body: form,
      });
      const json = await res.json().catch(() => null);

      if (res.ok && json?.success !== false && json?.status !== false) {
        return { success: true, message: json?.message || okMessage, data: json?.data ?? json?.complaint };
      }
      // Backend quirk: record saved but notification (WhatsApp) failed with 500
      if (softSuccessMatch && res.status === 500 && json?.message?.includes(softSuccessMatch)) {
        return { success: true, message: okMessage };
      }
      return { success: false, message: json ? this.errorMessage(json, res.status) : failMessage };
    } catch (err: any) {
      return { success: false, message: err?.message || failMessage };
    }
  }

  private async deleteById(url: string): Promise<{ success: boolean; message: string }> {
    try {
      const json = await this.get(url);
      return { success: true, message: json?.message || 'Complaint deleted successfully.' };
    } catch (err: any) {
      return { success: false, message: err?.message || 'Delete request failed.' };
    }
  }

  private toStringList(list: any, keys: string[]): string[] {
    if (!Array.isArray(list)) return [];
    return list
      .map((item: any) => {
        if (typeof item !== 'object' || item === null) return String(item);
        for (const k of keys) if (item[k] !== undefined && item[k] !== null) return String(item[k]);
        return '';
      })
      .filter(Boolean);
  }

  private parseAssigned(json: any): AssignedComplaintsResponse {
    const d = json?.data;
    if (!json?.status || !d) {
      throw new Error(json?.message || 'Invalid response for assigned complaints.');
    }
    return {
      company_id: d.company_id,
      loginId: d.loginId,
      state: d.state,
      role: d.role,
      parent_id: d.parent_id,
      name: d.name,
      data: Array.isArray(d.data) ? d.data : [],
      open: Array.isArray(d.open) ? d.open : [],
      approved: Array.isArray(d.approved) ? d.approved : [],
      open_complaint: Number(d.open_complaint) || 0,
      approved_complaint: Number(d.approved_complaint) || 0,
      close_complaint: Number(d.close_complaint) || 0,
      total_complaint: Number(d.total_complaint) || 0,
      vendors: d.vendors,
    };
  }

  /* ═══════════════════════════════════════════════════════════════════════════
   * 1. BIHAR SSL COMPLAINT APIS
   * ═══════════════════════════════════════════════════════════════════════════ */

  // 1.1 GET /bihar/ssl/complaint/add
  async getSslDistricts(): Promise<string[]> {
    const json = await this.get(BIHAR_COMPLAINT_API.SSL.ADD);
    return this.toStringList(json?.data, ['district', 'name']);
  }

  // 1.2 GET /bihar/ssl/complaint/getblocks?district=...
  async getSslBlocks(district: string): Promise<string[]> {
    const json = await this.get(BIHAR_COMPLAINT_API.SSL.GET_BLOCKS(district));
    return this.toStringList(json?.data, ['block', 'name']);
  }

  // 1.3 GET /bihar/ssl/complaint/getpanchyats?district=...&block=...
  async getSslPanchayats(district: string, block: string): Promise<string[]> {
    const json = await this.get(BIHAR_COMPLAINT_API.SSL.GET_PANCHYATS(district, block));
    return this.toStringList(json?.data, ['panchyat', 'panchayat', 'name']);
  }

  // 1.4 GET /bihar/ssl/complaint/getwards?...
  async getSslWards(district: string, block: string, panchyat: string): Promise<string[]> {
    const json = await this.get(BIHAR_COMPLAINT_API.SSL.GET_WARDS(district, block, panchyat));
    return this.toStringList(json?.data, ['ward_no', 'ward', 'name']);
  }

  // 1.5 GET /bihar/ssl/complaint/getpoles?...
  async getSslPoles(
    district: string,
    block: string,
    panchyat: string,
    ward_no: string | number
  ): Promise<string[]> {
    const json = await this.get(BIHAR_COMPLAINT_API.SSL.GET_POLES(district, block, panchyat, ward_no));
    return this.toStringList(json?.data, ['pole_no', 'pole', 'name']);
  }

  // 1.6 GET /bihar/ssl/complaint/getpoledatas?...
  async getSslPoleData(
    district: string,
    block: string,
    panchyat: string,
    ward_no: string | number,
    pole_no: string
  ): Promise<SslPoleDataResponse | null> {
    const json = await this.get(
      BIHAR_COMPLAINT_API.SSL.GET_POLE_DATAS(district, block, panchyat, ward_no, pole_no)
    );
    return json?.data ?? null;
  }

  // 1.7 POST /bihar/ssl/complaint/store
  async storeSslComplaint(form: FormData): Promise<MutationResult> {
    return this.postForm(
      BIHAR_COMPLAINT_API.SSL.STORE,
      form,
      'Complaint added successfully.',
      'Failed to submit SSL complaint.',
      'Complaint added successfully'
    );
  }

  // 1.8 GET /bihar/ssl/complaint/view-data
  async getViewSslComplaints(): Promise<BiharComplaintItem[]> {
    const json = await this.get(BIHAR_COMPLAINT_API.SSL.VIEW_DATA);
    return Array.isArray(json?.data) ? json.data : [];
  }

  // 1.9 GET /bihar/ssl/complaint/edit?ssl_id=...
  async getEditSslComplaint(ssl_id: number | string): Promise<BiharComplaintItem | null> {
    const json = await this.get(BIHAR_COMPLAINT_API.SSL.EDIT(ssl_id));
    return json?.data ?? null;
  }

  // 1.10 POST /bihar/ssl/complaint/update
  async updateSslComplaint(form: FormData): Promise<MutationResult> {
    return this.postForm(
      BIHAR_COMPLAINT_API.SSL.UPDATE,
      form,
      'Complaint updated successfully.',
      'Failed to update complaint.'
    );
  }

  // 1.11 GET /bihar/ssl/complaint/close-edit?ssl_id=...
  async getCloseEditSslComplaint(ssl_id: number | string): Promise<any> {
    const json = await this.get(BIHAR_COMPLAINT_API.SSL.CLOSE_EDIT(ssl_id));
    return json?.data ?? null;
  }

  // 1.12 POST /bihar/ssl/complaint/close-update
  async closeUpdateSslComplaint(form: FormData): Promise<MutationResult> {
    return this.postForm(
      BIHAR_COMPLAINT_API.SSL.CLOSE_UPDATE,
      form,
      'Complaint Resolved successfully.',
      'Failed to resolve SSL complaint.',
      'Complaint added successfully'
    );
  }

  // 1.13 GET /bihar/ssl/complaint/assign
  async getAssignedSslComplaints(): Promise<AssignedComplaintsResponse> {
    const json = await this.get(BIHAR_COMPLAINT_API.SSL.ASSIGN);
    return this.parseAssigned(json);
  }

  // 1.14 GET /bihar/ssl/complaint/delete?ssl_id=...
  async deleteSslComplaint(ssl_id: number | string) {
    return this.deleteById(BIHAR_COMPLAINT_API.SSL.DELETE(ssl_id));
  }

  /* ═══════════════════════════════════════════════════════════════════════════
   * 2. BIHAR SRT COMPLAINT APIS
   * ═══════════════════════════════════════════════════════════════════════════ */

  // 2.1 GET /bihar/srt/complaint/add
  async getSrtDistricts(): Promise<string[]> {
    const json = await this.get(BIHAR_COMPLAINT_API.SRT.ADD);
    return this.toStringList(json?.data, ['district', 'name']);
  }

  // 2.2 GET /bihar/srt/complaint/get-site-names?district=...
  async getSrtSiteNames(district: string): Promise<string[]> {
    const json = await this.get(BIHAR_COMPLAINT_API.SRT.GET_SITE_NAMES(district));
    return this.toStringList(json?.data, ['site_name', 'name']);
  }

  // 2.3 GET /bihar/srt/complaint/get-sites?district=...&site_name=...
  async getSrtSiteDetails(district: string, site_name: string): Promise<SrtSiteDetailsResponse | null> {
    const json = await this.get(BIHAR_COMPLAINT_API.SRT.GET_SITES(district, site_name));
    return json?.data ?? null;
  }

  // 2.4 POST /bihar/srt/complaint/store
  async storeSrtComplaint(form: FormData): Promise<MutationResult> {
    return this.postForm(
      BIHAR_COMPLAINT_API.SRT.STORE,
      form,
      'Complaint added successfully.',
      'Failed to submit SRT complaint.'
    );
  }

  // 2.5 GET /bihar/srt/complaint/view-data
  async getViewSrtComplaints(): Promise<BiharComplaintItem[]> {
    const json = await this.get(BIHAR_COMPLAINT_API.SRT.VIEW_DATA);
    return Array.isArray(json?.data) ? json.data : [];
  }

  // 2.6 GET /bihar/srt/complaint/edit?srt_id=...
  async getEditSrtComplaint(srt_id: number | string): Promise<BiharComplaintItem | null> {
    const json = await this.get(BIHAR_COMPLAINT_API.SRT.EDIT(srt_id));
    return json?.data ?? null;
  }

  // 2.7 POST /bihar/srt/complaint/update
  async updateSrtComplaint(form: FormData): Promise<MutationResult> {
    return this.postForm(
      BIHAR_COMPLAINT_API.SRT.UPDATE,
      form,
      'Complaint updated successfully.',
      'Failed to update complaint.'
    );
  }

  // 2.8 GET /bihar/srt/complaint/close-edit?srt_id=...
  async getCloseEditSrtComplaint(srt_id: number | string): Promise<any> {
    const json = await this.get(BIHAR_COMPLAINT_API.SRT.CLOSE_EDIT(srt_id));
    return json?.data ?? null;
  }

  // 2.9 POST /bihar/srt/complaint/close-update
  async closeUpdateSrtComplaint(form: FormData): Promise<MutationResult> {
    return this.postForm(
      BIHAR_COMPLAINT_API.SRT.CLOSE_UPDATE,
      form,
      'Complaint close request raised successfully.',
      'Failed to raise SRT close request.',
      'WhatsApp'
    );
  }

  // 2.10 GET /bihar/srt/complaint/assign
  async getAssignedSrtComplaints(): Promise<AssignedComplaintsResponse> {
    const json = await this.get(BIHAR_COMPLAINT_API.SRT.ASSIGN);
    return this.parseAssigned(json);
  }

  // 2.11 GET /bihar/srt/complaint/delete?srt_id=...
  async deleteSrtComplaint(srt_id: number | string) {
    return this.deleteById(BIHAR_COMPLAINT_API.SRT.DELETE(srt_id));
  }

  /* ═══════════════════════════════════════════════════════════════════════════
   * 3. POLYMORPHIC / BACKWARD-COMPATIBLE WRAPPERS
   * ═══════════════════════════════════════════════════════════════════════════ */

  async getDistricts(module: 'ssl' | 'srt' | 'ula' = 'ssl'): Promise<string[]> {
    if (module === 'srt') return this.getSrtDistricts();
    return this.getSslDistricts();
  }

  async storeComplaint(module: 'ssl' | 'srt' | 'ula', form: FormData) {
    if (module === 'srt') return this.storeSrtComplaint(form);
    return this.storeSslComplaint(form);
  }

  async getViewComplaints(module: 'ssl' | 'srt' | 'ula') {
    if (module === 'srt') return this.getViewSrtComplaints();
    return this.getViewSslComplaints();
  }

  async getComplaintEdit(module: 'ssl' | 'srt' | 'ula', id: number | string) {
    if (module === 'srt') return this.getEditSrtComplaint(id);
    return this.getEditSslComplaint(id);
  }

  async updateComplaint(module: 'ssl' | 'srt' | 'ula', form: FormData) {
    if (module === 'srt') return this.updateSrtComplaint(form);
    return this.updateSslComplaint(form);
  }

  async deleteComplaint(module: 'ssl' | 'srt' | 'ula', id: number | string) {
    if (module === 'srt') return this.deleteSrtComplaint(id);
    return this.deleteSslComplaint(id);
  }

  async closeComplaint(module: 'ssl' | 'srt' | 'ula', form: FormData) {
    if (module === 'srt') return this.closeUpdateSrtComplaint(form);
    return this.closeUpdateSslComplaint(form);
  }

  async getAssignedComplaints(module: 'ssl' | 'srt' | 'ula') {
    if (module === 'srt') return this.getAssignedSrtComplaints();
    return this.getAssignedSslComplaints();
  }
}

export const biharComplaintService = new BiharComplaintService();
export default biharComplaintService;