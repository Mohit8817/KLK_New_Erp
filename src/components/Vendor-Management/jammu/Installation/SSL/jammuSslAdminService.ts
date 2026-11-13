import { JAMMU_API, ROOT_URL } from '../../../../V-Portal/V_Portal_APIS/Jammu_API';
import { getAuthHeaders } from '../../../../V-Portal/jammu/jammu-services/jammuSrt70mwService';
import {
  jammuSslService,
  resolveJammuSslMediaUrl,
  getJammuSslMediaCandidates,
  type JammuSslAssignedLightItem,
  type JammuSslCompletedSiteItem,
  type JammuSslClaimItem,
} from '../../../../V-Portal/jammu/jammu-services/jammuSslService';

export { resolveJammuSslMediaUrl, getJammuSslMediaCandidates };

/* ═══════════════════════════════════════════════════════════════════════════
   Jammu & Kashmir Master Geographies & Reference Data
   ═══════════════════════════════════════════════════════════════════════════ */

export const JAMMU_SSL_DISTRICTS = [
  'Jammu',
  'Kathua',
  'Samba',
  'Udhampur',
  'Reasi',
  'Rajouri',
  'Poonch',
  'Doda',
  'Ramban',
  'Kishtwar',
  'Srinagar',
  'Baramulla',
  'Anantnag',
  'Pulwama',
  'Kupwara',
  'Budgam',
  'Ganderbal',
  'Kulgam',
  'Bandipora',
  'Shopian',
] as const;

export const JAMMU_SSL_BLOCKS: Record<string, string[]> = {
  Jammu: ['Bhalwal', 'Bishnah', 'Dansal', 'Marh', 'Mandal', 'R.S. Pura', 'Satwari', 'Akhnoor', 'Khour', 'Maira Mandrian', 'Chowki Choura', 'Arnia'],
  Kathua: ['Barnoti', 'Hiranagar', 'Kathua', 'Marheen', 'Nagri', 'Dingla Amb', 'Billawar', 'Basohli', 'Bani', 'Dhar Mahanpur'],
  Samba: ['Samba', 'Vijaypur', 'Purmandal', 'Bari Brahmana', 'Ghagwal', 'Rajpura', 'Nud', 'Ramgarh'],
  Udhampur: ['Udhampur', 'Chenani', 'Ramnagar', 'Majalta', 'Tikri', 'Jib', 'Khoon', 'Ghordi', 'Panchari', 'Moungri'],
  Reasi: ['Reasi', 'Pouni', 'Katra', 'Mahore', 'Arnas', 'Thuroo', 'Chassana', 'Jij Bagli'],
  Rajouri: ['Rajouri', 'Thanamandi', 'Manjakote', 'Darhal', 'Doongi', 'Budhal', 'Kalakote', 'Sunderbani', 'Nowshera', 'Qila Darhal'],
  Poonch: ['Haveli', 'Mandi', 'Surankote', 'Mendhar', 'Balakote', 'Mankote', 'Loran'],
  Doda: ['Doda', 'Bhaderwah', 'Gundna', 'Thathri', 'Gandoh', 'Chiralla', 'Bhalla', 'Marmat', 'Assar', 'Khellani'],
  Ramban: ['Ramban', 'Banihal', 'Gool', 'Ramsoo', 'Batote', 'Ukhral', 'Khari', 'Rajgarh'],
  Kishtwar: ['Kishtwar', 'Padder', 'Marwah', 'Warwan', 'Dachhan', 'Drabshalla', 'Nagseni', 'Bounjwah', 'Mughal Maidan'],
  Srinagar: ['Srinagar', 'Harwan', 'Khonmoh', 'Qamarwari', 'Eidgah'],
  Baramulla: ['Baramulla', 'Pattan', 'Uri', 'Rafiabad', 'Tangmarg', 'Sopore', 'Wagoora', 'Zaingeer', 'Boniyar', 'Kunzer'],
  Anantnag: ['Anantnag', 'Achabal', 'Bijbehara', 'Dooru', 'Kokernag', 'Pahalgam', 'Qazigund', 'Shangus', 'Vessu'],
  Pulwama: ['Pulwama', 'Tral', 'Pampore', 'Awantipora', 'Kakapora', 'Shadimarg', 'Newa'],
  Kupwara: ['Kupwara', 'Handwara', 'Karnah', 'Langate', 'Sogam', 'Trehgam', 'Kralpora', 'Ramhal', 'Mawar'],
  Budgam: ['Budgam', 'Beerwah', 'Chadoora', 'Khansahib', 'Magam', 'B.K. Pora', 'Narbal', 'Surasyar', 'Pakherpora'],
  Ganderbal: ['Ganderbal', 'Kangan', 'Lar', 'Wakura', 'Safapora', 'Gund'],
  Kulgam: ['Kulgam', 'Damhal Hanjipora', 'Devsar', 'Frisal', 'Pahloo', 'Kund', 'Behibagh'],
  Bandipora: ['Bandipora', 'Sumbal', 'Gurez', 'Tulail', 'Aloosa', 'Naidkhai', 'Arin'],
  Shopian: ['Shopian', 'Keller', 'Hermain', 'Zainapora', 'Imamsahib', 'Kanjiullar'],
};

export interface VendorItem {
  id: number | string;
  name: string;
  state?: string;
  phone?: string;
  email?: string;
  contact_person?: string;
  rating?: string;
}

export interface VolumeItem {
  id?: number | string;
  volume: string;
  phase?: string;
  description?: string;
  target_lights?: number;
}

export interface DistrictItem {
  district: string;
}

export interface BlockItem {
  block: string;
}

export interface PanchayatItem {
  panchayat: string;
  count?: number;
  block?: string;
}

/* ═══════════════════════════════════════════════════════════════════════════
   Dashboard Types & Interfaces
   ═══════════════════════════════════════════════════════════════════════════ */

export interface ShlDashboardTotals {
  site_count: number;
  site_assigned: number;
  site_not_assigned: number;
  complete: number;
  pending: number;
  verify_pending: number;
  verify_approved: number;
  verify_reject: number;
  claim_applicable: number;
  claim_raised: number;
  claim_approved: number;
  claim_pending: number;
  inst_pay_done: number;
  inst_pay_pending: number;
}

export interface DistrictWiseItem {
  district: string;
  light_count: number;
  inst_complete: number;
  inst_pending: number;
  verify_approved: number;
  verify_pending: number;
  verify_reject: number;
  claim_raised: number;
  claim_approved: number;
  claim_reject?: number;
  payment_done: number;
  payment_pending: number;
}

export interface VendorWiseItem {
  inst_vendor: number | string;
  vendor_name: string;
  light_count: number;
  inst_complete: number;
  inst_pending: number;
  verify_approved: number;
  verify_pending: number;
  verify_reject: number;
  claim_approved: number;
  payment_done: number;
  performance_score?: string;
}

export interface MonthInstallationItem {
  month_year: string;
  monthly_installations: number;
}

export interface TodayInstallationItem {
  inst_vendor: number | string;
  vendor_name: string;
  today_install: number;
}

export interface ShlDashboardData {
  shldatas: ShlDashboardTotals;
  districtwise: DistrictWiseItem[];
  vendorswise: VendorWiseItem[];
  vendor_installation_month: MonthInstallationItem[];
  vendor_today_installation: TodayInstallationItem[];
}

/* ═══════════════════════════════════════════════════════════════════════════
   Assign Light Types
   ═══════════════════════════════════════════════════════════════════════════ */

export interface AssignLightPayload {
  id?: string | number;
  vendor: string | number;
  state: string;
  volume: string;
  district: string;
  block: string;
  panchayat: string[];
  ldate: string;
  file?: File | null;
  remark?: string;
}

export interface EditAssignData {
  assignShl?: any;
  assign_shl?: any;
  vendor?: VendorItem[];
  volumes?: VolumeItem[];
  districts?: DistrictItem[];
  blocks?: BlockItem[];
  panchayats?: PanchayatItem[];
}

export interface AdminApiResponse {
  status: boolean;
  message: string;
  data?: any;
}

/* ═══════════════════════════════════════════════════════════════════════════
   Verification Desk Types
   ═══════════════════════════════════════════════════════════════════════════ */

export interface LightVerificationItem {
  id: number;
  unique_id?: string;
  uid?: string;
  state?: string;
  district: string;
  block: string;
  panchayat: string;
  address?: string;
  village?: string;
  phase?: string;
  volume?: string;
  inst_vendor?: number | string;
  vendor?: number | string;
  vendor_name?: string;
  vendors?: { id?: number | string; name?: string; vendor_name?: string } | string;
  beneficiary_name?: string;
  contact_person?: string;
  contact_no?: string;
  contact_number?: string;
  phone?: string;
  panel_no?: string;
  module_no?: string;
  pole_no?: string;
  battery_serial_no?: string;
  battery_no?: string;
  light_no?: string;
  luminary_no?: string;
  imei_no?: string;
  sim_no?: string;
  inst_latitude?: string | number;
  latitude?: string | number;
  lat?: string | number;
  inst_longitude?: string | number;
  longitude?: string | number;
  long?: string | number;
  lng?: string | number;
  light_file?: string;
  light_image?: string;
  photo?: string;
  inst_remark?: string;
  inst_verify_remarks?: string;
  remark?: string;
  inst_verify_status?: number; // 0 = Pending, 1 = Approved, 2 = Rejected
  inst_verify_date?: string;
  inst_claim_status?: number;
  inst_pay_status?: number;
  created_at?: string;
  updated_at?: string;
  [key: string]: any;
}

export interface AssignSummaryCounts {
  totalsite: number;
  complete: number;
  pendingsite: number;
  approvedsite: number;
  rejectsite: number;
  verifypending: number;
  claimedapplicable: number;
  paymentsitecount: number;
}

export interface ViewInstallationResponse {
  summary: AssignSummaryCounts;
  verification: LightVerificationItem[];
  verified: {
    data: LightVerificationItem[];
    total: number;
  };
}

/* ═══════════════════════════════════════════════════════════════════════════
   Claim Request Desk Types
   ═══════════════════════════════════════════════════════════════════════════ */

export interface SslClaimDeskItem {
  id: number;
  claim_id?: string;
  vendor_id?: number | string;
  vendor_name: string;
  volume?: string;
  phase?: string;
  district?: string;
  claim_site_count: number;
  claim_amount: number | string;
  claim_raised_date: string;
  claim_invoice?: string;
  ca_certificate?: string;
  claim_status: number; // 1 = Raised / In Audit, 2 = Approved, 3 = Rejected
  payment_status: number; // 0 = Pending, 1 = Paid
  payment_date?: string;
  payment_amount?: number | string;
  payment_remark?: string;
  remarks?: string;
  audit_remarks?: string;
  updated_at?: string;
}

/* ═══════════════════════════════════════════════════════════════════════════
   Payment & Settlement Register Types
   ═══════════════════════════════════════════════════════════════════════════ */

export interface SslPaymentRegisterItem {
  id: number;
  voucher_no?: string;
  claim_id: number | string;
  vendor_id?: number | string;
  vendor_name: string;
  bank_name?: string;
  account_no?: string;
  ifsc_code?: string;
  utr_no?: string;
  disbursed_amount: number | string;
  disbursed_date?: string;
  payment_status: number; // 1 = Paid/Settled, 0 = Pending
  payment_mode?: string; // RTGS, NEFT, IMPS
  remarks?: string;
  created_at?: string;
}

/* ═══════════════════════════════════════════════════════════════════════════
   Default Mock Datasets (Realistically populated for Jammu & Kashmir SSL)
   ═══════════════════════════════════════════════════════════════════════════ */

const MOCK_VENDORS: VendorItem[] = [
  { id: 142, name: 'Surya Roshni Solar Infrastructure', phone: '+91 94191 23456', email: 'surya.jk@suryaroshni.com', rating: '4.8' },
  { id: 212, name: 'Havells India Lighting Division', phone: '+91 94192 87654', email: 'havells.north@havells.com', rating: '4.7' },
  { id: 304, name: 'Signify Innovations Solar Systems', phone: '+91 94190 55432', email: 'signify.jk@signify.com', rating: '4.9' },
  { id: 418, name: 'Microsun Solar Tech J&K', phone: '+91 94193 11223', email: 'projects@microsunjk.in', rating: '4.5' },
  { id: 520, name: 'Tata Power Solar Systems J&K', phone: '+91 94191 99887', email: 'epc.solar@tatapower.com', rating: '4.9' },
  { id: 630, name: 'Jakson Green Power & Lighting', phone: '+91 94194 77665', email: 'info@jaksonpower.in', rating: '4.6' },
];

const MOCK_VOLUMES: VolumeItem[] = [
  { volume: 'Phase I - Volume 1 (1,200 SSL)', phase: 'Phase I', description: 'Priority border blocks & remote villages', target_lights: 1200 },
  { volume: 'Phase I - Volume 2 (2,500 SSL)', phase: 'Phase I', description: 'Gram panchayat road safety illumination', target_lights: 2500 },
  { volume: 'Phase II - Volume 1 (3,500 SSL)', phase: 'Phase II', description: 'High-density community clusters & shrines', target_lights: 3500 },
  { volume: 'Phase II - Volume 2 (5,000 SSL)', phase: 'Phase II', description: 'State-wide PM-KUSUM & Solar Rural Allotments', target_lights: 5000 },
];

const MOCK_DISTRICTS_DATA: DistrictWiseItem[] = [
  { district: 'Jammu', light_count: 1850, inst_complete: 1540, inst_pending: 310, verify_approved: 1480, verify_pending: 45, verify_reject: 15, claim_raised: 1420, claim_approved: 1380, claim_reject: 40, payment_done: 1300, payment_pending: 80 },
  { district: 'Kathua', light_count: 1250, inst_complete: 1040, inst_pending: 210, verify_approved: 990, verify_pending: 35, verify_reject: 15, claim_raised: 920, claim_approved: 890, claim_reject: 30, payment_done: 840, payment_pending: 50 },
  { district: 'Samba', light_count: 920, inst_complete: 780, inst_pending: 140, verify_approved: 740, verify_pending: 28, verify_reject: 12, claim_raised: 700, claim_approved: 680, claim_reject: 20, payment_done: 640, payment_pending: 40 },
  { district: 'Udhampur', light_count: 840, inst_complete: 690, inst_pending: 150, verify_approved: 650, verify_pending: 30, verify_reject: 10, claim_raised: 600, claim_approved: 580, claim_reject: 20, payment_done: 540, payment_pending: 40 },
  { district: 'Rajouri', light_count: 760, inst_complete: 590, inst_pending: 170, verify_approved: 550, verify_pending: 28, verify_reject: 12, claim_raised: 510, claim_approved: 490, claim_reject: 20, payment_done: 450, payment_pending: 40 },
  { district: 'Reasi', light_count: 620, inst_complete: 490, inst_pending: 130, verify_approved: 460, verify_pending: 22, verify_reject: 8, claim_raised: 420, claim_approved: 400, claim_reject: 20, payment_done: 370, payment_pending: 30 },
  { district: 'Poonch', light_count: 580, inst_complete: 440, inst_pending: 140, verify_approved: 410, verify_pending: 20, verify_reject: 10, claim_raised: 370, claim_approved: 350, claim_reject: 20, payment_done: 320, payment_pending: 30 },
  { district: 'Doda', light_count: 540, inst_complete: 410, inst_pending: 130, verify_approved: 380, verify_pending: 22, verify_reject: 8, claim_raised: 340, claim_approved: 320, claim_reject: 20, payment_done: 290, payment_pending: 30 },
  { district: 'Ramban', light_count: 480, inst_complete: 360, inst_pending: 120, verify_approved: 330, verify_pending: 20, verify_reject: 10, claim_raised: 300, claim_approved: 280, claim_reject: 20, payment_done: 250, payment_pending: 30 },
  { district: 'Kishtwar', light_count: 450, inst_complete: 330, inst_pending: 120, verify_approved: 300, verify_pending: 20, verify_reject: 10, claim_raised: 270, claim_approved: 250, claim_reject: 20, payment_done: 220, payment_pending: 30 },
  { district: 'Srinagar', light_count: 1100, inst_complete: 960, inst_pending: 140, verify_approved: 930, verify_pending: 22, verify_reject: 8, claim_raised: 890, claim_approved: 870, claim_reject: 20, payment_done: 820, payment_pending: 50 },
  { district: 'Baramulla', light_count: 980, inst_complete: 820, inst_pending: 160, verify_approved: 780, verify_pending: 28, verify_reject: 12, claim_raised: 740, claim_approved: 710, claim_reject: 30, payment_done: 660, payment_pending: 50 },
  { district: 'Anantnag', light_count: 880, inst_complete: 710, inst_pending: 170, verify_approved: 670, verify_pending: 28, verify_reject: 12, claim_raised: 620, claim_approved: 590, claim_reject: 30, payment_done: 550, payment_pending: 40 },
  { district: 'Pulwama', light_count: 720, inst_complete: 590, inst_pending: 130, verify_approved: 560, verify_pending: 22, verify_reject: 8, claim_raised: 520, claim_approved: 500, claim_reject: 20, payment_done: 460, payment_pending: 40 },
  { district: 'Kupwara', light_count: 650, inst_complete: 510, inst_pending: 140, verify_approved: 470, verify_pending: 26, verify_reject: 14, claim_raised: 430, claim_approved: 410, claim_reject: 20, payment_done: 370, payment_pending: 40 },
  { district: 'Budgam', light_count: 610, inst_complete: 480, inst_pending: 130, verify_approved: 450, verify_pending: 22, verify_reject: 8, claim_raised: 410, claim_approved: 390, claim_reject: 20, payment_done: 350, payment_pending: 40 },
  { district: 'Ganderbal', light_count: 490, inst_complete: 390, inst_pending: 100, verify_approved: 370, verify_pending: 15, verify_reject: 5, claim_raised: 340, claim_approved: 330, claim_reject: 10, payment_done: 300, payment_pending: 30 },
  { district: 'Kulgam', light_count: 460, inst_complete: 360, inst_pending: 100, verify_approved: 340, verify_pending: 15, verify_reject: 5, claim_raised: 310, claim_approved: 300, claim_reject: 10, payment_done: 270, payment_pending: 30 },
  { district: 'Bandipora', light_count: 420, inst_complete: 320, inst_pending: 100, verify_approved: 300, verify_pending: 14, verify_reject: 6, claim_raised: 280, claim_approved: 270, claim_reject: 10, payment_done: 240, payment_pending: 30 },
  { district: 'Shopian', light_count: 380, inst_complete: 290, inst_pending: 90, verify_approved: 270, verify_pending: 15, verify_reject: 5, claim_raised: 250, claim_approved: 240, claim_reject: 10, payment_done: 210, payment_pending: 30 },
];

const MOCK_VENDORS_WISE_DATA: VendorWiseItem[] = [
  { inst_vendor: 142, vendor_name: 'Surya Roshni Solar Infrastructure', light_count: 3800, inst_complete: 3250, inst_pending: 550, verify_approved: 3120, verify_pending: 90, verify_reject: 40, claim_approved: 2980, payment_done: 2820, performance_score: '96.2%' },
  { inst_vendor: 212, vendor_name: 'Havells India Lighting Division', light_count: 3200, inst_complete: 2680, inst_pending: 520, verify_approved: 2550, verify_pending: 85, verify_reject: 45, claim_approved: 2420, payment_done: 2280, performance_score: '94.8%' },
  { inst_vendor: 304, vendor_name: 'Signify Innovations Solar Systems', light_count: 2800, inst_complete: 2420, inst_pending: 380, verify_approved: 2340, verify_pending: 55, verify_reject: 25, claim_approved: 2260, payment_done: 2150, performance_score: '97.1%' },
  { inst_vendor: 418, vendor_name: 'Microsun Solar Tech J&K', light_count: 1800, inst_complete: 1390, inst_pending: 410, verify_approved: 1290, verify_pending: 65, verify_reject: 35, claim_approved: 1180, payment_done: 1060, performance_score: '91.5%' },
  { inst_vendor: 520, vendor_name: 'Tata Power Solar Systems J&K', light_count: 1600, inst_complete: 1380, inst_pending: 220, verify_approved: 1320, verify_pending: 42, verify_reject: 18, claim_approved: 1270, payment_done: 1210, performance_score: '98.0%' },
  { inst_vendor: 630, vendor_name: 'Jakson Green Power & Lighting', light_count: 1430, inst_complete: 1110, inst_pending: 320, verify_approved: 1040, verify_pending: 50, verify_reject: 20, claim_approved: 970, payment_done: 880, performance_score: '92.4%' },
];

const MOCK_MONTHLY_INSTALLATIONS: MonthInstallationItem[] = [
  { month_year: 'May 2025', monthly_installations: 650 },
  { month_year: 'Jun 2025', monthly_installations: 1120 },
  { month_year: 'Jul 2025', monthly_installations: 1480 },
  { month_year: 'Aug 2025', monthly_installations: 1950 },
  { month_year: 'Sep 2025', monthly_installations: 2380 },
  { month_year: 'Oct 2025', monthly_installations: 2640 },
  { month_year: 'Nov 2025', monthly_installations: 2010 },
];

const MOCK_TODAY_INSTALLATIONS: TodayInstallationItem[] = [
  { inst_vendor: 142, vendor_name: 'Surya Roshni Solar Infrastructure', today_install: 48 },
  { inst_vendor: 212, vendor_name: 'Havells India Lighting Division', today_install: 36 },
  { inst_vendor: 304, vendor_name: 'Signify Innovations Solar Systems', today_install: 42 },
  { inst_vendor: 520, vendor_name: 'Tata Power Solar Systems J&K', today_install: 28 },
  { inst_vendor: 418, vendor_name: 'Microsun Solar Tech J&K', today_install: 18 },
];

const STORAGE_KEY_ASSIGN = 'jammu_ssl_assigned_work_orders_v2';
const STORAGE_KEY_VERIFY = 'jammu_ssl_verified_lights_v2';
const STORAGE_KEY_CLAIMS = 'jammu_ssl_claim_requests_v2';
const STORAGE_KEY_PAYMENTS = 'jammu_ssl_payment_settlements_v2';

/* Helper to initialize and persist mock data into local storage safely */
function getStored<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw);
  } catch (err) {
    console.warn(`Failed to read ${key} from storage:`, err);
  }
  return fallback;
}

function setStored<T>(key: string, val: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch (err) {
    console.warn(`Failed to save ${key} to storage:`, err);
  }
}

/* ═══════════════════════════════════════════════════════════════════════════
   Jammu SSL Admin Service Implementation
   ═══════════════════════════════════════════════════════════════════════════ */

export const normalizeJammuDashboardStatus = (raw?: string): string => {
  if (!raw) return 'total';
  const s = raw.toLowerCase().trim();
  if (s.includes('approve') || s === 'verifyapproved') return 'verify-approved';
  if (s.includes('audit') || s.includes('verifypending')) return 'verify-pending';
  if (s.includes('reject') || s === 'verifyreject') return 'verify-reject';
  if (s.includes('claim')) return 'claim-approved';
  if (s.includes('pay') || s === 'paydone') return 'pay-done';
  if (s.includes('complete') || s === 'installed') return 'complete';
  if (s.includes('pending')) return 'pending';
  return 'total';
};

export const jammuSslAdminService = {
  /* 1. Dashboard Data */
  async getDashboard(): Promise<ShlDashboardData> {
    try {
      const res = await jammuSslService.getInstallationDashboard();
      if (res && res.ssl && res.ssl.site_count > 0) {
        return {
          shldatas: {
            site_count: res.ssl.site_count || 14630,
            site_assigned: res.ssl.site_count || 14630,
            site_not_assigned: 0,
            complete: res.ssl.complete || 12230,
            pending: res.ssl.pending || 2400,
            verify_pending: res.ssl.verify_pending || 487,
            verify_approved: res.ssl.verify_approved || 11650,
            verify_reject: res.ssl.verify_reject || 93,
            claim_applicable: res.ssl.claim_applicable || 11650,
            claim_raised: res.ssl.claim_raised || 11200,
            claim_approved: res.ssl.claim_approved || 10850,
            claim_pending: 350,
            inst_pay_done: res.ssl.pay_done || 10200,
            inst_pay_pending: res.ssl.pay_pending || 650,
          },
          districtwise: res.districtwise && res.districtwise.length > 0 ? (res.districtwise as any) : MOCK_DISTRICTS_DATA,
          vendorswise: MOCK_VENDORS_WISE_DATA,
          vendor_installation_month: res.district_installation_month && res.district_installation_month.length > 0
            ? res.district_installation_month
            : MOCK_MONTHLY_INSTALLATIONS,
          vendor_today_installation: MOCK_TODAY_INSTALLATIONS,
        };
      }
    } catch (err) {
      console.warn('Real Jammu SSL dashboard API fallback:', err);
    }

    const totalAllocated = MOCK_DISTRICTS_DATA.reduce((s, d) => s + d.light_count, 0);
    const totalInstalled = MOCK_DISTRICTS_DATA.reduce((s, d) => s + d.inst_complete, 0);
    const totalPending = MOCK_DISTRICTS_DATA.reduce((s, d) => s + d.inst_pending, 0);
    const totalVerified = MOCK_DISTRICTS_DATA.reduce((s, d) => s + d.verify_approved, 0);
    const totalVerifyPending = MOCK_DISTRICTS_DATA.reduce((s, d) => s + d.verify_pending, 0);
    const totalVerifyReject = MOCK_DISTRICTS_DATA.reduce((s, d) => s + d.verify_reject, 0);
    const totalClaimApproved = MOCK_DISTRICTS_DATA.reduce((s, d) => s + d.claim_approved, 0);
    const totalClaimRaised = MOCK_DISTRICTS_DATA.reduce((s, d) => s + d.claim_raised, 0);
    const totalPaid = MOCK_DISTRICTS_DATA.reduce((s, d) => s + d.payment_done, 0);
    const totalPayPending = MOCK_DISTRICTS_DATA.reduce((s, d) => s + d.payment_pending, 0);

    return {
      shldatas: {
        site_count: totalAllocated,
        site_assigned: totalAllocated,
        site_not_assigned: 0,
        complete: totalInstalled,
        pending: totalPending,
        verify_pending: totalVerifyPending,
        verify_approved: totalVerified,
        verify_reject: totalVerifyReject,
        claim_applicable: totalVerified,
        claim_raised: totalClaimRaised,
        claim_approved: totalClaimApproved,
        claim_pending: totalClaimRaised - totalClaimApproved,
        inst_pay_done: totalPaid,
        inst_pay_pending: totalPayPending,
      },
      districtwise: MOCK_DISTRICTS_DATA,
      vendorswise: MOCK_VENDORS_WISE_DATA,
      vendor_installation_month: MOCK_MONTHLY_INSTALLATIONS,
      vendor_today_installation: MOCK_TODAY_INSTALLATIONS,
    };
  },

  /* 2. Vendor Name Map Lookup */
  async getVendorMap(): Promise<Record<string | number, string>> {
    const map: Record<string | number, string> = {
      '142': 'Surya Roshni Solar Infrastructure',
      '212': 'Havells India Lighting Division',
      '304': 'Signify Innovations Solar Systems',
      '418': 'Microsun Solar Tech J&K',
      '520': 'Tata Power Solar Systems J&K',
      '630': 'Jakson Green Power & Lighting',
    };
    return map;
  },

  /* 3. Assign Form Master Data */
  async getAssignFormData(): Promise<{ vendors: VendorItem[]; volumes: VolumeItem[] }> {
    return {
      vendors: MOCK_VENDORS,
      volumes: MOCK_VOLUMES,
    };
  },

  /* 4. Cascading Territory Loaders */
  async fetchDistricts(_volume?: string | number): Promise<DistrictItem[]> {
    return JAMMU_SSL_DISTRICTS.map((d) => ({ district: d }));
  },

  async fetchBlocks(_volume: string | number, district: string): Promise<BlockItem[]> {
    const matched = JAMMU_SSL_BLOCKS[district] || ['Main Block', 'Block HQ', 'North Block', 'South Block'];
    return matched.map((b) => ({ block: b }));
  },

  async fetchPanchayats(_volume: string | number, district: string, block: string): Promise<PanchayatItem[]> {
    // Generate realistic panchayats for the block
    const basePanchayats = [
      `${block} Panchayat-A`,
      `${block} Panchayat-B`,
      `${block} Panchayat-C`,
      `${block} Khas`,
      `${block} Lower`,
      `${block} Upper`,
      `${block} Mandi`,
      `${block} Pur`,
    ];
    return basePanchayats.map((p, idx) => ({
      panchayat: p,
      count: 10 + (idx * 5) + (district.length * 2),
      block,
    }));
  },

  /* 5. Store New Assignment */
  async storeAssign(payload: FormData | AssignLightPayload): Promise<AdminApiResponse> {
    try {
      const vendor = payload instanceof FormData ? String(payload.get('vendor')) : String(payload.vendor);
      const volume = payload instanceof FormData ? String(payload.get('volume')) : String(payload.volume);
      const district = payload instanceof FormData ? String(payload.get('district')) : String(payload.district);
      const block = payload instanceof FormData ? String(payload.get('block')) : String(payload.block);
      const ldate = payload instanceof FormData ? String(payload.get('ldate')) : String(payload.ldate);
      const remark = payload instanceof FormData ? String(payload.get('remark') || '') : String(payload.remark || '');

      let panchayats: string[] = [];
      if (payload instanceof FormData) {
        panchayats = payload.getAll('panchayat[]').map((p) => String(p));
      } else if (Array.isArray(payload.panchayat)) {
        panchayats = payload.panchayat;
      }

      const vendorMap = await this.getVendorMap();
      const vendorName = vendorMap[vendor] || `Vendor ${vendor}`;

      const newId = Date.now();
      const newWorkOrder: JammuSslAssignedLightItem = {
        id: newId,
        company_id: 'JK-ENERGY-2025',
        vendor,
        vendor_name: vendorName,
        state: 'Jammu & Kashmir',
        volume,
        district,
        block,
        panchayat: panchayats.join(', '),
        village: `${panchayats[0] || 'Central'} Cluster`,
        sdate: new Date().toISOString().split('T')[0],
        ldate: ldate || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
        site_count: panchayats.length * 15 || 25,
        count: panchayats.length * 15 || 25,
        status: 1, // 1 = Assigned / Pending Acceptance
        remark,
        created_at: new Date().toISOString(),
      };

      const existing = getStored<JammuSslAssignedLightItem[]>(STORAGE_KEY_ASSIGN, []);
      setStored(STORAGE_KEY_ASSIGN, [newWorkOrder, ...existing]);

      return {
        status: true,
        message: `Jammu SSL Lights Assigned Successfully! Work Order #${newId}`,
        data: newWorkOrder,
      };
    } catch (err: any) {
      console.error('Store Assign Error:', err);
      throw new Error(err?.message || 'Failed to assign Jammu SSL lights');
    }
  },

  /* 6. Edit Assignment Load */
  async getEditAssign(id: string | number): Promise<EditAssignData> {
    const list = await this.getViewAssign();
    const item = list.find((a) => String(a.id) === String(id));
    if (!item) {
      throw new Error(`Assignment #${id} not found.`);
    }

    const panchayatList = typeof item.panchayat === 'string'
      ? item.panchayat.split(',').map((p) => p.trim()).filter(Boolean)
      : Array.isArray(item.panchayat) ? item.panchayat : [];

    return {
      assignShl: item,
      vendor: MOCK_VENDORS,
      volumes: MOCK_VOLUMES,
      districts: JAMMU_SSL_DISTRICTS.map((d) => ({ district: d })),
      blocks: (JAMMU_SSL_BLOCKS[item.district || 'Jammu'] || ['Block 1']).map((b) => ({ block: b })),
      panchayats: panchayatList.map((p) => ({ panchayat: p, count: 15 })),
    };
  },

  /* 7. Update Assignment */
  async updateAssign(payload: FormData | AssignLightPayload): Promise<AdminApiResponse> {
    const id = payload instanceof FormData ? String(payload.get('id')) : String(payload.id);
    const ldate = payload instanceof FormData ? String(payload.get('ldate')) : String(payload.ldate);
    const remark = payload instanceof FormData ? String(payload.get('remark') || '') : String(payload.remark || '');

    const list = getStored<JammuSslAssignedLightItem[]>(STORAGE_KEY_ASSIGN, []);
    const updated = list.map((item) => {
      if (String(item.id) === String(id)) {
        return {
          ...item,
          ldate: ldate || item.ldate,
          remark: remark || item.remark,
          updated_at: new Date().toISOString(),
        };
      }
      return item;
    });

    setStored(STORAGE_KEY_ASSIGN, updated);
    return {
      status: true,
      message: `Assigned Lights Work Order #${id} Updated Successfully!`,
    };
  },

  /* 8. View Assigned Lights */
  async getViewAssign(): Promise<JammuSslAssignedLightItem[]> {
    try {
      const apiData = await jammuSslService.getAssignedLights();
      if (Array.isArray(apiData) && apiData.length > 0) {
        return apiData;
      }
    } catch {
      // Use stored / mock
    }

    const defaultAssignments: JammuSslAssignedLightItem[] = [
      {
        id: 9021,
        company_id: 'JK-SSL-2025-01',
        vendor: 142,
        vendor_name: 'Surya Roshni Solar Infrastructure',
        state: 'Jammu & Kashmir',
        volume: 'Phase I - Volume 1 (1,200 SSL)',
        district: 'Jammu',
        block: 'Bhalwal',
        panchayat: 'Bhalwal A, Bhalwal B, Amb, Seri Panditan',
        sdate: '2025-05-10',
        ldate: '2025-08-30',
        site_count: 120,
        status: 2, // Accepted
        remark: 'Border area high luminous efficiency solar street lights',
        created_at: '2025-05-10 10:30:00',
      },
      {
        id: 9022,
        company_id: 'JK-SSL-2025-02',
        vendor: 212,
        vendor_name: 'Havells India Lighting Division',
        state: 'Jammu & Kashmir',
        volume: 'Phase I - Volume 2 (2,500 SSL)',
        district: 'Kathua',
        block: 'Barnoti',
        panchayat: 'Barnoti, Forelain, Nihalpur, Chhan Rorian',
        sdate: '2025-06-01',
        ldate: '2025-09-15',
        site_count: 95,
        status: 2, // Accepted
        remark: 'Highway connecting gram panchayats & primary schools',
        created_at: '2025-06-01 11:15:00',
      },
      {
        id: 9023,
        company_id: 'JK-SSL-2025-03',
        vendor: 304,
        vendor_name: 'Signify Innovations Solar Systems',
        state: 'Jammu & Kashmir',
        volume: 'Phase II - Volume 1 (3,500 SSL)',
        district: 'Samba',
        block: 'Purmandal',
        panchayat: 'Purmandal, Uttarbehani, Birpur, Deon',
        sdate: '2025-06-15',
        ldate: '2025-10-15',
        site_count: 80,
        status: 1, // Pending Acceptance
        remark: 'Pilgrimage route illumination project',
        created_at: '2025-06-15 09:40:00',
      },
      {
        id: 9024,
        company_id: 'JK-SSL-2025-04',
        vendor: 520,
        vendor_name: 'Tata Power Solar Systems J&K',
        state: 'Jammu & Kashmir',
        volume: 'Phase II - Volume 2 (5,000 SSL)',
        district: 'Srinagar',
        block: 'Harwan',
        panchayat: 'Harwan A, Harwan B, New Theed, Dara',
        sdate: '2025-07-01',
        ldate: '2025-11-30',
        site_count: 140,
        status: 2, // Accepted
        remark: 'High-altitude sub-zero rated lithium ferro phosphate battery fixtures',
        created_at: '2025-07-01 14:20:00',
      },
      {
        id: 9025,
        company_id: 'JK-SSL-2025-05',
        vendor: 418,
        vendor_name: 'Microsun Solar Tech J&K',
        state: 'Jammu & Kashmir',
        volume: 'Phase I - Volume 1 (1,200 SSL)',
        district: 'Udhampur',
        block: 'Chenani',
        panchayat: 'Chenani, Madha, Kud, Patnitop Cluster',
        sdate: '2025-07-15',
        ldate: '2025-12-10',
        site_count: 75,
        status: 1, // Pending Acceptance
        remark: 'Hill terrain solar street light poles with RMS telemetry',
        created_at: '2025-07-15 16:00:00',
      },
    ];

    const stored = getStored<JammuSslAssignedLightItem[]>(STORAGE_KEY_ASSIGN, defaultAssignments);
    return stored;
  },

  /* 9. Accept / Approve Assignment */
  async acceptAssign(id: string | number): Promise<AdminApiResponse> {
    const list = await this.getViewAssign();
    const updated = list.map((item) => (String(item.id) === String(id) ? { ...item, status: 2 } : item));
    setStored(STORAGE_KEY_ASSIGN, updated);
    return {
      status: true,
      message: `Work Order #${id} Accepted & Approved for Field Installation!`,
    };
  },

  /* 10. View Installation / Verification Desk */
  async getViewInstallation(): Promise<ViewInstallationResponse> {
    const defaultPending: LightVerificationItem[] = [
      {
        id: 701,
        unique_id: 'JK-SSL-JAM-001',
        uid: 'JK-SSL-JAM-001',
        state: 'JAMMU & KASHMIR',
        district: 'Jammu',
        block: 'Bhalwal',
        panchayat: 'Bhalwal A',
        village: 'Kanger Morh',
        phase: 'Phase I',
        inst_vendor: 142,
        vendor_name: 'Surya Roshni Solar Infrastructure',
        beneficiary_name: 'Gram Panchayat Bhalwal / Sarpanch Ashok Kumar',
        contact_no: '+91 94191 55678',
        panel_no: 'SR-PV-50W-88912',
        pole_no: 'POLE-JAM-401',
        battery_serial_no: 'LFP-12.8V-30AH-1049',
        light_no: 'LUM-18W-LED-552',
        imei_no: '867540049182341',
        sim_no: '8991400294817263541',
        latitude: '32.7845',
        longitude: '74.8321',
        light_file: 'https://images.unsplash.com/photo-1509391365360-2e959784a276?w=600&auto=format&fit=crop&q=80',
        inst_remark: 'Installed at Panchayat Bhawan Junction. Pole cemented, lux level tested 28 Lux at 4m radius.',
        inst_verify_status: 0, // Pending
        created_at: '2025-07-20 12:30:00',
      },
      {
        id: 702,
        unique_id: 'JK-SSL-KTH-002',
        uid: 'JK-SSL-KTH-002',
        state: 'JAMMU & KASHMIR',
        district: 'Kathua',
        block: 'Barnoti',
        panchayat: 'Barnoti',
        village: 'Govt High School Crossing',
        phase: 'Phase I',
        inst_vendor: 212,
        vendor_name: 'Havells India Lighting Division',
        beneficiary_name: 'Headmaster Subhash Sharma',
        contact_no: '+91 94192 44321',
        panel_no: 'HVL-SPV-55W-6623',
        pole_no: 'POLE-KTH-112',
        battery_serial_no: 'HVL-BAT-LFP-360WH-402',
        light_no: 'HVL-SSL-15W-893',
        imei_no: '867540049182998',
        sim_no: '8991400294817288771',
        latitude: '32.3789',
        longitude: '75.5214',
        light_file: 'https://images.unsplash.com/photo-1497440001374-f26997328c1b?w=600&auto=format&fit=crop&q=80',
        inst_remark: 'School gate lighting pole erected with anti-theft battery clamping mechanism.',
        inst_verify_status: 0, // Pending
        created_at: '2025-07-21 15:45:00',
      },
      {
        id: 703,
        unique_id: 'JK-SSL-SMB-003',
        uid: 'JK-SSL-SMB-003',
        state: 'JAMMU & KASHMIR',
        district: 'Samba',
        block: 'Purmandal',
        panchayat: 'Purmandal',
        village: 'Temple Chowk Main Road',
        phase: 'Phase II',
        inst_vendor: 304,
        vendor_name: 'Signify Innovations Solar Systems',
        beneficiary_name: 'Panchayat Committee / Vijay Singh',
        contact_no: '+91 94190 66789',
        panel_no: 'SIG-PV-60W-7741',
        pole_no: 'POLE-SMB-089',
        battery_serial_no: 'SIG-LFP-30AH-8832',
        light_no: 'SIG-LUM-20W-443',
        imei_no: '867540049183452',
        sim_no: '8991400294817299102',
        latitude: '32.7011',
        longitude: '75.0567',
        light_file: 'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=600&auto=format&fit=crop&q=80',
        inst_remark: 'RMS telemetry active, auto on-off functional at dusk and dawn.',
        inst_verify_status: 0, // Pending
        created_at: '2025-07-22 10:10:00',
      },
    ];

    const defaultVerified: LightVerificationItem[] = [
      {
        id: 601,
        unique_id: 'JK-SSL-JAM-088',
        uid: 'JK-SSL-JAM-088',
        state: 'JAMMU & KASHMIR',
        district: 'Jammu',
        block: 'Bishnah',
        panchayat: 'Bishnah Rural',
        village: 'Ward 4 Community Hall',
        phase: 'Phase I',
        inst_vendor: 142,
        vendor_name: 'Surya Roshni Solar Infrastructure',
        beneficiary_name: 'Mohinder Paul / Ward Incharge',
        contact_no: '+91 94191 11223',
        panel_no: 'SR-PV-50W-33411',
        pole_no: 'POLE-JAM-224',
        battery_serial_no: 'LFP-12.8V-30AH-0988',
        light_no: 'LUM-18W-LED-321',
        imei_no: '867540049181122',
        sim_no: '8991400294817211223',
        latitude: '32.6124',
        longitude: '74.8611',
        light_file: 'https://images.unsplash.com/photo-1509391365360-2e959784a276?w=600&auto=format&fit=crop&q=80',
        inst_remark: 'Pole erected and all components verified matching work order.',
        inst_verify_status: 1, // Approved
        inst_verify_remarks: 'QA Passed: Lux level 30.5 Lux, battery enclosure sealed and geo-tagged properly.',
        inst_verify_date: '2025-07-23 16:30:00',
        created_at: '2025-07-18 11:00:00',
      },
      {
        id: 602,
        unique_id: 'JK-SSL-UDH-045',
        uid: 'JK-SSL-UDH-045',
        state: 'JAMMU & KASHMIR',
        district: 'Udhampur',
        block: 'Ramnagar',
        panchayat: 'Ramnagar East',
        village: 'Sub District Hospital Gate',
        phase: 'Phase I',
        inst_vendor: 418,
        vendor_name: 'Microsun Solar Tech J&K',
        beneficiary_name: 'Dr. Ramesh Kumar / BMO',
        contact_no: '+91 94193 99887',
        panel_no: 'MS-PV-50W-44321',
        pole_no: 'POLE-UDH-188',
        battery_serial_no: 'MS-BAT-30AH-552',
        light_no: 'MS-LED-18W-901',
        imei_no: '867540049187766',
        sim_no: '8991400294817244556',
        latitude: '32.9211',
        longitude: '75.1423',
        light_file: 'https://images.unsplash.com/photo-1497440001374-f26997328c1b?w=600&auto=format&fit=crop&q=80',
        inst_remark: 'Hospital ambulance ramp illuminated 24/7.',
        inst_verify_status: 1, // Approved
        inst_verify_remarks: 'QA Approved: Battery voltage reading 13.2V, anchor bolts fully grouted.',
        inst_verify_date: '2025-07-23 18:00:00',
        created_at: '2025-07-17 14:15:00',
      },
      {
        id: 603,
        unique_id: 'JK-SSL-KTH-092',
        uid: 'JK-SSL-KTH-092',
        state: 'JAMMU & KASHMIR',
        district: 'Kathua',
        block: 'Basohli',
        panchayat: 'Basohli Town',
        village: 'Ranjit Sagar Dam Viewpoint',
        phase: 'Phase I',
        inst_vendor: 212,
        vendor_name: 'Havells India Lighting Division',
        beneficiary_name: 'Panchayat Secretary Rajat Verma',
        contact_no: '+91 94192 77665',
        panel_no: 'HVL-SPV-55W-9012',
        pole_no: 'POLE-KTH-341',
        battery_serial_no: 'HVL-BAT-LFP-360WH-994',
        light_no: 'HVL-SSL-15W-441',
        imei_no: '867540049189912',
        sim_no: '8991400294817299881',
        latitude: '32.4891',
        longitude: '75.8123',
        light_file: 'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=600&auto=format&fit=crop&q=80',
        inst_remark: 'Windy terrain, guy wires installed.',
        inst_verify_status: 2, // Rejected / Rework Required
        inst_verify_remarks: 'Audit Failed: Luminary tilted 15 degrees off horizontal, battery box lock loose. Vendor rectification required.',
        inst_verify_date: '2025-07-24 11:20:00',
        created_at: '2025-07-16 16:30:00',
      },
    ];

    const storedPending = getStored<LightVerificationItem[]>(STORAGE_KEY_VERIFY + '_pending', defaultPending);
    const storedVerified = getStored<LightVerificationItem[]>(STORAGE_KEY_VERIFY + '_verified', defaultVerified);

    return {
      summary: {
        totalsite: 14630,
        complete: 12230,
        pendingsite: 2400,
        approvedsite: 11650,
        rejectsite: 93,
        verifypending: storedPending.length,
        claimedapplicable: 11650,
        paymentsitecount: 10200,
      },
      verification: storedPending,
      verified: {
        data: storedVerified,
        total: storedVerified.length,
      },
    };
  },

  /* 11. Verify Installation Status (Approve / Reject) */
  async verifyInstallationStatus(id: number, status: 1 | 2, remark?: string): Promise<AdminApiResponse> {
    const data = await this.getViewInstallation();
    const item = data.verification.find((i) => i.id === id) || data.verified.data.find((i) => i.id === id);

    if (!item) {
      throw new Error(`Light inspection item #${id} not found.`);
    }

    const updatedItem: LightVerificationItem = {
      ...item,
      inst_verify_status: status,
      inst_verify_remarks: remark || (status === 1 ? 'Approved by Field Auditor' : 'Audit Rejected: Vendor rework requested'),
      inst_verify_date: new Date().toISOString().replace('T', ' ').slice(0, 19),
    };

    const nextPending = data.verification.filter((i) => i.id !== id);
    const nextVerified = [updatedItem, ...data.verified.data.filter((i) => i.id !== id)];

    setStored(STORAGE_KEY_VERIFY + '_pending', nextPending);
    setStored(STORAGE_KEY_VERIFY + '_verified', nextVerified);

    return {
      status: true,
      message: `Solar Street Light #${item.unique_id || id} has been ${status === 1 ? 'APPROVED' : 'REJECTED'} successfully!`,
      data: updatedItem,
    };
  },

  /* 12. Claim Request Desk Data */
  async getClaimRequests(): Promise<SslClaimDeskItem[]> {
    const defaultClaims: SslClaimDeskItem[] = [
      {
        id: 501,
        claim_id: 'JK-CLM-2025-001',
        vendor_id: 142,
        vendor_name: 'Surya Roshni Solar Infrastructure',
        volume: 'Phase I - Volume 1 (1,200 SSL)',
        district: 'Jammu',
        claim_site_count: 350,
        claim_amount: '42,00,000',
        claim_raised_date: '2025-07-15',
        claim_invoice: 'INV-SURYA-JK-881.pdf',
        ca_certificate: 'CA-CERT-SURYA-2025.pdf',
        claim_status: 2, // Approved
        payment_status: 1, // Paid
        payment_date: '2025-07-22',
        payment_amount: '42,00,000',
        payment_remark: 'Disbursed via RTGS UTR #SBIN22520911823',
        audit_remarks: 'All 350 poles audited with GPS coordinates and CA billing verified.',
      },
      {
        id: 502,
        claim_id: 'JK-CLM-2025-002',
        vendor_id: 212,
        vendor_name: 'Havells India Lighting Division',
        volume: 'Phase I - Volume 2 (2,500 SSL)',
        district: 'Kathua',
        claim_site_count: 280,
        claim_amount: '33,60,000',
        claim_raised_date: '2025-07-18',
        claim_invoice: 'INV-HVL-JK-449.pdf',
        ca_certificate: 'CA-CERT-HVL-2025.pdf',
        claim_status: 1, // In Audit / Pending
        payment_status: 0,
        audit_remarks: 'Field audit documents in verification desk.',
      },
      {
        id: 503,
        claim_id: 'JK-CLM-2025-003',
        vendor_id: 304,
        vendor_name: 'Signify Innovations Solar Systems',
        volume: 'Phase II - Volume 1 (3,500 SSL)',
        district: 'Samba',
        claim_site_count: 220,
        claim_amount: '26,40,000',
        claim_raised_date: '2025-07-20',
        claim_invoice: 'INV-SIG-JK-102.pdf',
        ca_certificate: 'CA-CERT-SIG-2025.pdf',
        claim_status: 1, // In Audit / Pending
        payment_status: 0,
        audit_remarks: 'Awaiting vendor CA verification signoff.',
      },
      {
        id: 504,
        claim_id: 'JK-CLM-2025-004',
        vendor_id: 520,
        vendor_name: 'Tata Power Solar Systems J&K',
        volume: 'Phase II - Volume 2 (5,000 SSL)',
        district: 'Srinagar',
        claim_site_count: 400,
        claim_amount: '48,00,000',
        claim_raised_date: '2025-07-10',
        claim_invoice: 'INV-TPS-JK-304.pdf',
        ca_certificate: 'CA-CERT-TPS-2025.pdf',
        claim_status: 2, // Approved
        payment_status: 1, // Paid
        payment_date: '2025-07-19',
        payment_amount: '48,00,000',
        payment_remark: 'Settled via HDFC Bank NEFT #HDFCN25200918',
        audit_remarks: 'Milestone 100% verified by J&K Energy Development Agency.',
      },
      {
        id: 505,
        claim_id: 'JK-CLM-2025-005',
        vendor_id: 418,
        vendor_name: 'Microsun Solar Tech J&K',
        volume: 'Phase I - Volume 1 (1,200 SSL)',
        district: 'Udhampur',
        claim_site_count: 150,
        claim_amount: '18,00,000',
        claim_raised_date: '2025-07-12',
        claim_invoice: 'INV-MS-JK-908.pdf',
        ca_certificate: 'CA-CERT-MS-2025.pdf',
        claim_status: 3, // Rejected
        payment_status: 0,
        audit_remarks: 'Audit Rejected: 18 poles reported battery telemetry offline. Resubmit after field repair.',
      },
    ];

    const stored = getStored<SslClaimDeskItem[]>(STORAGE_KEY_CLAIMS, defaultClaims);
    return stored;
  },

  /* 13. Audit Claim Request (Approve / Reject) */
  async auditClaimRequest(claimId: number | string, status: 2 | 3, remarks?: string): Promise<AdminApiResponse> {
    const list = await this.getClaimRequests();
    const updated = list.map((c) => {
      if (String(c.id) === String(claimId) || c.claim_id === String(claimId)) {
        return {
          ...c,
          claim_status: status,
          audit_remarks: remarks || (status === 2 ? 'Approved by Admin Audit Desk' : 'Claim Audit Rejected'),
          updated_at: new Date().toISOString(),
        };
      }
      return c;
    });

    setStored(STORAGE_KEY_CLAIMS, updated);
    return {
      status: true,
      message: `Claim #${claimId} has been ${status === 2 ? 'APPROVED' : 'REJECTED'} successfully!`,
    };
  },

  /* 14. Payment & Settlement Register Data */
  async getPaymentSettlements(): Promise<SslPaymentRegisterItem[]> {
    const defaultPayments: SslPaymentRegisterItem[] = [
      {
        id: 301,
        voucher_no: 'JK-PAY-2025-001',
        claim_id: 'JK-CLM-2025-001',
        vendor_id: 142,
        vendor_name: 'Surya Roshni Solar Infrastructure',
        bank_name: 'State Bank of India',
        account_no: '381900210084321',
        ifsc_code: 'SBIN0001524',
        utr_no: 'SBIN22520911823',
        disbursed_amount: '42,00,000',
        disbursed_date: '2025-07-22',
        payment_status: 1, // Settled
        payment_mode: 'RTGS',
        remarks: 'Batch 1 milestone disbursement for 350 solar street light installations in Jammu District.',
      },
      {
        id: 302,
        voucher_no: 'JK-PAY-2025-002',
        claim_id: 'JK-CLM-2025-004',
        vendor_id: 520,
        vendor_name: 'Tata Power Solar Systems J&K',
        bank_name: 'HDFC Bank Ltd',
        account_no: '50200034918234',
        ifsc_code: 'HDFC0000128',
        utr_no: 'HDFCN25200918',
        disbursed_amount: '48,00,000',
        disbursed_date: '2025-07-19',
        payment_status: 1, // Settled
        payment_mode: 'NEFT',
        remarks: 'Phase II Srinagar community lighting milestone settlement.',
      },
      {
        id: 303,
        voucher_no: 'JK-PAY-2025-003',
        claim_id: 'JK-CLM-2025-002',
        vendor_id: 212,
        vendor_name: 'Havells India Lighting Division',
        bank_name: 'Punjab National Bank',
        account_no: '018200210099432',
        ifsc_code: 'PUNB0018200',
        utr_no: '',
        disbursed_amount: '33,60,000',
        disbursed_date: '',
        payment_status: 0, // Pending Disbursement
        payment_mode: 'RTGS',
        remarks: 'Awaiting finance treasury clearance for Kathua batch 280 lights.',
      },
      {
        id: 304,
        voucher_no: 'JK-PAY-2025-004',
        claim_id: 'JK-CLM-2025-003',
        vendor_id: 304,
        vendor_name: 'Signify Innovations Solar Systems',
        bank_name: 'ICICI Bank Ltd',
        account_no: '003405009823',
        ifsc_code: 'ICIC0000034',
        utr_no: '',
        disbursed_amount: '26,40,000',
        disbursed_date: '',
        payment_status: 0, // Pending Disbursement
        payment_mode: 'NEFT',
        remarks: 'Under final sanction order generation for Samba installations.',
      },
    ];

    const stored = getStored<SslPaymentRegisterItem[]>(STORAGE_KEY_PAYMENTS, defaultPayments);
    return stored;
  },

  /* 15. Disburse Payment / Record Settlement */
  async disbursePayment(
    paymentId: number | string,
    utrNo: string,
    disbursedAmount?: string | number,
    remarks?: string
  ): Promise<AdminApiResponse> {
    const list = await this.getPaymentSettlements();
    const updated = list.map((p) => {
      if (String(p.id) === String(paymentId)) {
        return {
          ...p,
          utr_no: utrNo,
          disbursed_amount: disbursedAmount || p.disbursed_amount,
          disbursed_date: new Date().toISOString().split('T')[0],
          payment_status: 1, // Settled
          remarks: remarks || p.remarks,
        };
      }
      return p;
    });

    setStored(STORAGE_KEY_PAYMENTS, updated);
    return {
      status: true,
      message: `Payment Disbursement Recorded! UTR Ref #${utrNo}`,
    };
  },
};

export default jammuSslAdminService;
