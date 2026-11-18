import { API_BASE_URL, authService } from '../../../services/authService';
import { VENDOR_MANAGEMENT_COMMON_API } from '../Vendor_Management_APIS/VendorCommon_API';

export const BACKEND_BASE = (API_BASE_URL || 'https://klkerp.com/api')
  .replace(/\/api\/?$/, '')
  .replace(/\/+$/, '');

export const API_PREFIX = (API_BASE_URL || 'https://klkerp.com/api').replace(/\/+$/, '');

export function resolveMediaUrl(path?: string | null): string {
  if (!path) return '';
  if (/^(https?:|data:|blob:)/i.test(path)) return path;
  const clean = path.replace(/^\/+/, '');
  return `${BACKEND_BASE}/${clean}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Type Definitions
// ─────────────────────────────────────────────────────────────────────────────

export interface VendorMasterItem {
  id: number;
  vendor_id?: string;
  name: string;
  company_name: string;
  contact_person?: string;
  email: string;
  phone: string;
  type_of_entity: string;
  register_for: string;
  state: string;
  gst_number: string;
  status: 'Active' | 'Inactive';
  account_number?: string;
  ifsc_code?: string;
  bank_name?: string;
  sow?: string;
  password?: string;
  approved?: boolean;
  profile_status?: string;
  created_at?: string;
}

export interface DleUserItem {
  id: number;
  state: string;
  name: string;
  email: string;
  contact: string;
  emergency_contact?: string;
  district: string;
  block: string;
  panchayat?: string;
  address: string;
  police_verification: 'Verified' | 'Pending' | 'Rejected';
  documents?: string;
  approval_status: 'Approved' | 'Pending' | 'Rejected';
  status: 'Active' | 'Inactive';
  created_at: string;
}

export interface WorkOrderItem {
  id: number;
  workorder_id?: string;
  workorder: string;
  workorder_number: string;
  state: string;
  project_head: string;
  order_quantity: number;
  email?: string;
  phone?: string;
  file?: string;
  date?: string;
  created_at?: string;
}

export interface WorkOrderAssignItem {
  id: number;
  assign_id?: string;
  workorder: string;
  vendor: string;
  vendor_id?: number | string;
  state: string;
  district: string;
  block: string;
  start_date: string;
  end_date: string;
  quantity: number;
  remarks?: string;
  status?: string;
  created_at?: string;
}

export interface RmRequestItem {
  id: number;
  required_date: string;
  workorder: string;
  address: string;
  remarks: string;
  product: string;
  status?: 'Pending' | 'In Progress' | 'Resolved';
  vendor_name?: string;
  created_at?: string;
}

export interface PaymentRecordItem {
  id: number;
  date: string;
  workorder: string;
  vendor_name: string;
  project_head: string;
  payment_mode: 'NEFT/RTGS' | 'Cheque' | 'Online' | 'Cash';
  amount: number;
  file?: string;
  status?: string;
  remarks?: string;
}

export interface VendorComplaintItem {
  id: number;
  complaint_id: string;
  complaint_date: string;
  complaint: string;
  state: string;
  name: string;
  mobile: string;
  district: string;
  location: string;
  site: string;
  workorder: string;
  document?: string;
  created_by: string;
  assigned_to?: string;
  status: 'Open' | 'Assigned' | 'Closed';
  remarks?: string;
}

export interface VendorDailyProgressItem {
  id: number;
  sno: number;
  date: string;
  workorder: string;
  state: string;
  district: string;
  workorder_quantity: number;
  images?: string[];
  report?: string;
  vendor_name?: string;
  vendor_id?: number | string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Initial Mock Data Stores (Persisted in localStorage for responsive live testing)
// ─────────────────────────────────────────────────────────────────────────────

const INITIAL_VENDORS: VendorMasterItem[] = [
  {
    id: 1,
    vendor_id: 'VEND-001',
    name: 'Yashvendra Singh',
    company_name: 'SolarTech Infra Pvt Ltd',
    contact_person: 'Yashvendra Singh',
    email: 'yashvendra@solartech.in',
    phone: '9876543210',
    type_of_entity: 'Private Limited Company',
    register_for: 'Installer',
    state: 'Assam',
    gst_number: '18AABCS1429B1Z8',
    status: 'Active',
    account_number: '912345678901',
    ifsc_code: 'SBIN0001234',
    bank_name: 'State Bank of India',
    sow: 'Solar Water Pump Installation & Commissioning',
    password: '••••••••',
    approved: true,
    profile_status: 'Complete',
    created_at: '2025-01-10 10:30:00',
  },
  {
    id: 2,
    vendor_id: 'VEND-002',
    name: 'Kunal Kishor',
    company_name: 'Kishor Renewable Energies',
    contact_person: 'Kunal Kishor',
    email: 'kunal@kishorenergy.com',
    phone: '9812345678',
    type_of_entity: 'Partnership',
    register_for: 'Distributor',
    state: 'Bihar',
    gst_number: '10AABCK4820B1Z2',
    status: 'Active',
    account_number: '50100234567890',
    ifsc_code: 'HDFC0000456',
    bank_name: 'HDFC Bank',
    sow: 'Supply & Material Dispatch for Street Lighting',
    password: '••••••••',
    approved: true,
    profile_status: 'Complete',
    created_at: '2025-01-12 14:15:00',
  },
  {
    id: 3,
    vendor_id: 'VEND-003',
    name: 'Surender Kumar',
    company_name: 'SK Power Solutions',
    contact_person: 'Surender Kumar',
    email: 'surender@skpower.org',
    phone: '9765432109',
    type_of_entity: 'Individual/ Sole Proprietorship',
    register_for: 'Installer',
    state: 'Karnataka',
    gst_number: '29AABCS8930B1Z6',
    status: 'Active',
    account_number: '329847120934',
    ifsc_code: 'ICIC0000892',
    bank_name: 'ICICI Bank',
    sow: 'Karnataka SWP Pump Installation & VFD Setup',
    password: '••••••••',
    approved: true,
    profile_status: 'Complete',
    created_at: '2025-01-15 11:20:00',
  },
  {
    id: 4,
    vendor_id: 'VEND-004',
    name: 'Narendra Singh Baghel',
    company_name: 'Baghel Solar Enterprises',
    contact_person: 'Narendra Singh Baghel',
    email: 'narendra@baghelsolar.com',
    phone: '9988776655',
    type_of_entity: 'Limited Liability Partnership (LLP)',
    register_for: 'Installer',
    state: 'Uttar Pradesh',
    gst_number: '09AABCN6732B1Z4',
    status: 'Active',
    account_number: '0834101009843',
    ifsc_code: 'PUNB0083400',
    bank_name: 'Punjab National Bank',
    sow: 'Kusum C & Resco Solar Installation',
    password: '••••••••',
    approved: true,
    profile_status: 'Complete',
    created_at: '2025-01-18 16:45:00',
  },
  {
    id: 5,
    vendor_id: 'VEND-005',
    name: 'Sanjeev Kumar',
    company_name: 'Apex Green Energy',
    contact_person: 'Sanjeev Kumar',
    email: 'sanjeev@apexgreen.in',
    phone: '9470661676',
    type_of_entity: 'Private Limited Company',
    register_for: 'Supplier',
    state: 'Jammu',
    gst_number: '01AABCA3412B1Z9',
    status: 'Active',
    account_number: '623401928374',
    ifsc_code: 'SBIN0006234',
    bank_name: 'State Bank of India',
    sow: '70MW SRT Modules & Inverter Supply',
    password: '••••••••',
    approved: true,
    profile_status: 'Complete',
    created_at: '2025-01-20 09:10:00',
  },
  {
    id: 6,
    vendor_id: 'VEND-006',
    name: 'Ambuj Kumar Kharee',
    company_name: 'Kharee Solar Services',
    contact_person: 'Ambuj Kharee',
    email: 'ambuj@khareesolar.com',
    phone: '9839808927',
    type_of_entity: 'Individual/ Sole Proprietorship',
    register_for: 'Installer',
    state: 'Punjab',
    gst_number: '03AABCK9921B1Z3',
    status: 'Inactive',
    account_number: '198273645012',
    ifsc_code: 'BARB0PUNJAB',
    bank_name: 'Bank of Baroda',
    sow: 'Punjab Solar High Mast & Mini Grid',
    password: '••••••••',
    approved: false,
    profile_status: 'Pending Review',
    created_at: '2025-01-22 13:00:00',
  },
];

const INITIAL_DLE_USERS: DleUserItem[] = [
  {
    id: 1,
    state: 'Assam',
    name: 'Debojit Sarma',
    email: 'debojit@assam-dle.gov.in',
    contact: '9864012345',
    emergency_contact: '9864098765',
    district: 'Kamrup',
    block: 'Hajo',
    panchayat: 'Sualkuchi GP',
    address: 'Near Old Post Office, Hajo Bazar, Kamrup 781102',
    police_verification: 'Verified',
    documents: 'pv_debojit_sarma.pdf',
    approval_status: 'Approved',
    status: 'Active',
    created_at: '2025-01-14 11:30:00',
  },
  {
    id: 2,
    state: 'Bihar',
    name: 'Pramod Kumar Yadav',
    email: 'pramod.dle@bihar.in',
    contact: '9431023456',
    emergency_contact: '9431087654',
    district: 'Patna',
    block: 'Danapur',
    panchayat: 'Tarapur GP',
    address: 'Plot 42, Danapur Cantt Road, Patna 801503',
    police_verification: 'Verified',
    documents: 'doc_pramod_yadav.pdf',
    approval_status: 'Approved',
    status: 'Active',
    created_at: '2025-01-16 15:45:00',
  },
  {
    id: 3,
    state: 'Karnataka',
    name: 'Manjunatha B.R.',
    email: 'manjunath.dle@karnataka.gov.in',
    contact: '9900123456',
    emergency_contact: '9900987654',
    district: 'Tumakuru',
    block: 'Tiptur',
    panchayat: 'Kibbanahalli GP',
    address: 'Main Road, Tiptur Rural, Tumakuru 572201',
    police_verification: 'Verified',
    documents: 'pv_manjunatha.pdf',
    approval_status: 'Approved',
    status: 'Active',
    created_at: '2025-01-18 10:20:00',
  },
  {
    id: 4,
    state: 'Uttar Pradesh',
    name: 'Shyam Sundar Dixit',
    email: 'shyam.dixit@up-dle.in',
    contact: '9450123456',
    emergency_contact: '9450987654',
    district: 'Varanasi',
    block: 'Pindra',
    panchayat: 'Karkhiyaon GP',
    address: 'Village Karkhiyaon, Pindra, Varanasi 221206',
    police_verification: 'Pending',
    documents: 'doc_shyam_dixit.pdf',
    approval_status: 'Pending',
    status: 'Active',
    created_at: '2025-01-20 12:10:00',
  },
];

const INITIAL_WORK_ORDERS: WorkOrderItem[] = [
  {
    id: 1,
    workorder_id: 'WO-2025-001',
    workorder: 'Assam Solar Water Pump Scheme - Phase 1',
    workorder_number: 'AS-SWP-2025-101',
    state: 'Assam',
    project_head: 'Rajeev Talukdar',
    order_quantity: 500,
    email: 'rajeev.talukdar@klkenergy.com',
    phone: '9864112233',
    file: 'po_assam_swp_phase1.pdf',
    date: '2025-01-05',
    created_at: '2025-01-05 10:00:00',
  },
  {
    id: 2,
    workorder_id: 'WO-2025-002',
    workorder: 'Karnataka PM-KUSUM Component B Pump Project',
    workorder_number: 'KA-SWP-2025-204',
    state: 'Karnataka',
    project_head: 'Srinivasa Rao',
    order_quantity: 750,
    email: 'srinivas.rao@klkenergy.com',
    phone: '9900223344',
    file: 'po_karnataka_swp_204.pdf',
    date: '2025-01-08',
    created_at: '2025-01-08 14:30:00',
  },
  {
    id: 3,
    workorder_id: 'WO-2025-003',
    workorder: 'Bihar Street Lighting & Mini-Grid Expansion',
    workorder_number: 'BR-SSL-2025-309',
    state: 'Bihar',
    project_head: 'Anil Kumar Jha',
    order_quantity: 1200,
    email: 'anil.jha@klkenergy.com',
    phone: '9431334455',
    file: 'po_bihar_ssl_309.pdf',
    date: '2025-01-12',
    created_at: '2025-01-12 11:15:00',
  },
  {
    id: 4,
    workorder_id: 'WO-2025-004',
    workorder: 'Uttar Pradesh Kusum C Feeder Solarization',
    workorder_number: 'UP-KC-2025-412',
    state: 'Uttar Pradesh',
    project_head: 'Mahesh Chandra Sharma',
    order_quantity: 350,
    email: 'mahesh.sharma@klkenergy.com',
    phone: '9450445566',
    file: 'po_up_kusumc_412.pdf',
    date: '2025-01-16',
    created_at: '2025-01-16 16:00:00',
  },
];

const INITIAL_ASSIGNMENTS: WorkOrderAssignItem[] = [
  {
    id: 1,
    assign_id: 'ASN-001',
    workorder: 'AS-SWP-2025-101',
    vendor: 'Yashvendra Singh',
    vendor_id: 1,
    state: 'Assam',
    district: 'Kamrup',
    block: 'Hajo',
    start_date: '2025-01-10',
    end_date: '2025-03-31',
    quantity: 150,
    remarks: 'Complete 3HP & 5HP solar pump borewell & panel mounts',
    status: 'In Progress',
    created_at: '2025-01-10 12:00:00',
  },
  {
    id: 2,
    assign_id: 'ASN-002',
    workorder: 'KA-SWP-2025-204',
    vendor: 'Surender Kumar',
    vendor_id: 3,
    state: 'Karnataka',
    district: 'Tumakuru',
    block: 'Tiptur',
    start_date: '2025-01-15',
    end_date: '2025-04-15',
    quantity: 200,
    remarks: 'Field mobilization and VFD inverter setup with earthing',
    status: 'In Progress',
    created_at: '2025-01-15 14:30:00',
  },
  {
    id: 3,
    assign_id: 'ASN-003',
    workorder: 'BR-SSL-2025-309',
    vendor: 'Kunal Kishor',
    vendor_id: 2,
    state: 'Bihar',
    district: 'Patna',
    block: 'Danapur',
    start_date: '2025-01-20',
    end_date: '2025-04-30',
    quantity: 350,
    remarks: 'Solar high mast poles and luminaire installations',
    status: 'In Progress',
    created_at: '2025-01-20 10:45:00',
  },
];

const INITIAL_RM_REQUESTS: RmRequestItem[] = [
  {
    id: 1,
    required_date: '2025-02-10',
    workorder: 'AS-SWP-2025-101',
    address: 'Village Ramdia, Hajo Block, Kamrup, Assam',
    remarks: 'Pump controller flashing error code E-04 (Under-voltage). Need immediate technician visit.',
    product: '5HP Submersible Solar Pump & Inverter',
    status: 'In Progress',
    vendor_name: 'Yashvendra Singh',
    created_at: '2025-01-25 09:30:00',
  },
  {
    id: 2,
    required_date: '2025-02-12',
    workorder: 'KA-SWP-2025-204',
    address: 'Kibbanahalli Farm Cluster, Tiptur, Tumakuru, Karnataka',
    remarks: 'Module cable damaged by rodent. Replacement connector and continuity testing required.',
    product: '335W Monocrystalline Solar PV Module',
    status: 'Pending',
    vendor_name: 'Surender Kumar',
    created_at: '2025-01-26 14:10:00',
  },
  {
    id: 3,
    required_date: '2025-02-15',
    workorder: 'BR-SSL-2025-309',
    address: 'Panchayat Bhawan Square, Danapur, Patna, Bihar',
    remarks: 'Battery backup timing dropped below 4 hours. Inspection of Lithium battery pack needed.',
    product: '12.8V 30Ah LiFePO4 Battery Pack',
    status: 'Resolved',
    vendor_name: 'Kunal Kishor',
    created_at: '2025-01-22 16:20:00',
  },
];

const INITIAL_PAYMENTS: PaymentRecordItem[] = [
  {
    id: 1,
    date: '2025-01-20',
    workorder: 'AS-SWP-2025-101',
    vendor_name: 'Yashvendra Singh',
    project_head: 'Rajeev Talukdar',
    payment_mode: 'NEFT/RTGS',
    amount: 450000,
    file: 'receipt_neft_450k.pdf',
    status: 'Completed',
    remarks: 'First milestone 80% disbursement for 25 completed sites',
  },
  {
    id: 2,
    date: '2025-01-22',
    workorder: 'KA-SWP-2025-204',
    vendor_name: 'Surender Kumar',
    project_head: 'Srinivasa Rao',
    payment_mode: 'NEFT/RTGS',
    amount: 620000,
    file: 'receipt_neft_620k.pdf',
    status: 'Completed',
    remarks: 'Installation and civil foundation milestone payment',
  },
  {
    id: 3,
    date: '2025-01-26',
    workorder: 'BR-SSL-2025-309',
    vendor_name: 'Kunal Kishor',
    project_head: 'Anil Kumar Jha',
    payment_mode: 'Online',
    amount: 280000,
    file: 'receipt_upi_280k.pdf',
    status: 'Completed',
    remarks: 'Batch delivery of 150 street lighting poles',
  },
];

const INITIAL_COMPLAINTS: VendorComplaintItem[] = [
  {
    id: 1,
    complaint_id: 'CMP-2025-001',
    complaint_date: '2025-01-20',
    complaint: 'Solar pump running water output pressure is very low during afternoon peak sunlight.',
    state: 'Assam',
    name: 'Biren Das',
    mobile: '9864223344',
    district: 'Kamrup',
    location: 'Hajo, Village Sualkuchi',
    site: 'SITE-AS-1029',
    workorder: 'AS-SWP-2025-101',
    document: 'doc_pump_low_flow.jpg',
    created_by: 'Field Officer',
    assigned_to: 'Yashvendra Singh',
    status: 'Open',
    remarks: 'Assigned to vendor for technician on-site verification within 48h.',
  },
  {
    id: 2,
    complaint_id: 'CMP-2025-002',
    complaint_date: '2025-01-22',
    complaint: 'Inverter MC4 connector melted due to loose crimping at junction box.',
    state: 'Karnataka',
    name: 'Basavaraj Patil',
    mobile: '9900334455',
    district: 'Tumakuru',
    location: 'Tiptur Rural',
    site: 'SITE-KA-2041',
    workorder: 'KA-SWP-2025-204',
    document: 'doc_connector_melt.jpg',
    created_by: 'DLE Operator',
    assigned_to: 'Surender Kumar',
    status: 'Assigned',
    remarks: 'Technician dispatched with replacement high-grade MC4 connectors.',
  },
  {
    id: 3,
    complaint_id: 'CMP-2025-003',
    complaint_date: '2025-01-18',
    complaint: 'High mast street light pole light turns off intermittently after 2 hours.',
    state: 'Bihar',
    name: 'Rameshwar Singh',
    mobile: '9431445566',
    district: 'Patna',
    location: 'Danapur Ward 4',
    site: 'SITE-BR-3098',
    workorder: 'BR-SSL-2025-309',
    document: 'doc_light_flicker.jpg',
    created_by: 'Super Admin',
    assigned_to: 'Kunal Kishor',
    status: 'Closed',
    remarks: 'BMS controller re-programmed and solar sensor cleaned. Fully resolved.',
  },
];

const INITIAL_DAILY_PROGRESS: VendorDailyProgressItem[] = [
  {
    id: 1,
    sno: 1,
    date: '2025-01-24',
    workorder: 'AS-SWP-2025-101',
    state: 'Assam',
    district: 'Kamrup',
    workorder_quantity: 12,
    images: ['https://images.unsplash.com/photo-1509391365360-2e959784a276?w=600&auto=format&fit=crop&q=80', 'https://images.unsplash.com/photo-1508873696983-2df5293cb395?w=600&auto=format&fit=crop&q=80'],
    report: 'daily_progress_as101_24jan.pdf',
    vendor_name: 'Yashvendra Singh',
    vendor_id: 1,
  },
  {
    id: 2,
    sno: 2,
    date: '2025-01-25',
    workorder: 'KA-SWP-2025-204',
    state: 'Karnataka',
    district: 'Tumakuru',
    workorder_quantity: 15,
    images: ['https://images.unsplash.com/photo-1497440001374-f26997328c1b?w=600&auto=format&fit=crop&q=80', 'https://images.unsplash.com/photo-1509391365360-2e959784a276?w=600&auto=format&fit=crop&q=80'],
    report: 'daily_progress_ka204_25jan.pdf',
    vendor_name: 'Surender Kumar',
    vendor_id: 3,
  },
  {
    id: 3,
    sno: 3,
    date: '2025-01-26',
    workorder: 'BR-SSL-2025-309',
    state: 'Bihar',
    district: 'Patna',
    workorder_quantity: 25,
    images: ['https://images.unsplash.com/photo-1508873696983-2df5293cb395?w=600&auto=format&fit=crop&q=80'],
    report: 'daily_progress_br309_26jan.pdf',
    vendor_name: 'Kunal Kishor',
    vendor_id: 2,
  },
];

// Helper to safely read and write to storage
function getStored<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(`klk_ops_${key}`);
    if (raw) return JSON.parse(raw);
  } catch {}
  return fallback;
}

function setStored<T>(key: string, val: T): void {
  try {
    localStorage.setItem(`klk_ops_${key}`, JSON.stringify(val));
  } catch {}
}

// ─────────────────────────────────────────────────────────────────────────────
// Service Implementation
// ─────────────────────────────────────────────────────────────────────────────

class VendorOperationsService {
  private getHeaders(isMultipart = false): Record<string, string> {
    const token = authService.getToken() || localStorage.getItem('token');
    const headers: Record<string, string> = { Accept: 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    if (!isMultipart) headers['Content-Type'] = 'application/json';
    return headers;
  }

  // ── 1. Vendors Master ──
  async getVendors(): Promise<VendorMasterItem[]> {
    try {
      const res = await fetch(VENDOR_MANAGEMENT_COMMON_API.LIST_VENDORS, {
        method: 'GET',
        headers: this.getHeaders(),
      });
      if (res.ok) {
        const json = await res.json();
        const list = json.data || (Array.isArray(json) ? json : null);
        if (Array.isArray(list) && list.length > 0) return list;
      }
    } catch {}
    return getStored<VendorMasterItem[]>('vendors', INITIAL_VENDORS);
  }

  async createVendor(data: Omit<VendorMasterItem, 'id'>): Promise<VendorMasterItem> {
    const list = getStored<VendorMasterItem[]>('vendors', INITIAL_VENDORS);
    const newVendor: VendorMasterItem = {
      ...data,
      id: Date.now(),
      vendor_id: `VEND-${String(list.length + 1).padStart(3, '0')}`,
      approved: data.approved ?? true,
      profile_status: data.profile_status ?? 'Complete',
      created_at: new Date().toISOString().replace('T', ' ').slice(0, 19),
    };
    try {
      await fetch(VENDOR_MANAGEMENT_COMMON_API.CREATE_VENDOR, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(data),
      });
    } catch {}
    const updated = [newVendor, ...list];
    setStored('vendors', updated);
    return newVendor;
  }

  async updateVendorStatus(id: number, status: 'Active' | 'Inactive'): Promise<void> {
    const list = getStored<VendorMasterItem[]>('vendors', INITIAL_VENDORS);
    const updated = list.map((v) => (v.id === id ? { ...v, status } : v));
    setStored('vendors', updated);
  }

  // ── 2. DLE Users ──
  async getDleUsers(): Promise<DleUserItem[]> {
    try {
      const res = await fetch(`${API_PREFIX}/admin/dle-users`, {
        method: 'GET',
        headers: this.getHeaders(),
      });
      if (res.ok) {
        const json = await res.json();
        const list = json.data || (Array.isArray(json) ? json : null);
        if (Array.isArray(list) && list.length > 0) return list;
      }
    } catch {}
    return getStored<DleUserItem[]>('dle_users', INITIAL_DLE_USERS);
  }

  async updateDleStatus(id: number, approval_status: 'Approved' | 'Pending' | 'Rejected'): Promise<void> {
    const list = getStored<DleUserItem[]>('dle_users', INITIAL_DLE_USERS);
    const updated = list.map((u) => (u.id === id ? { ...u, approval_status } : u));
    setStored('dle_users', updated);
  }

  // ── 3. Work Orders ──
  async getWorkOrders(): Promise<WorkOrderItem[]> {
    try {
      const res = await fetch(`${API_PREFIX}/admin/workorders`, {
        method: 'GET',
        headers: this.getHeaders(),
      });
      if (res.ok) {
        const json = await res.json();
        const list = json.data || (Array.isArray(json) ? json : null);
        if (Array.isArray(list) && list.length > 0) return list;
      }
    } catch {}
    return getStored<WorkOrderItem[]>('work_orders', INITIAL_WORK_ORDERS);
  }

  async createWorkOrder(data: Omit<WorkOrderItem, 'id'>): Promise<WorkOrderItem> {
    const list = getStored<WorkOrderItem[]>('work_orders', INITIAL_WORK_ORDERS);
    const newWo: WorkOrderItem = {
      ...data,
      id: Date.now(),
      workorder_id: `WO-2025-${String(list.length + 1).padStart(3, '0')}`,
      date: data.date || new Date().toISOString().slice(0, 10),
      created_at: new Date().toISOString().replace('T', ' ').slice(0, 19),
    };
    const updated = [newWo, ...list];
    setStored('work_orders', updated);
    return newWo;
  }

  // ── 4. Work Order Assignments ──
  async getAssignments(): Promise<WorkOrderAssignItem[]> {
    try {
      const res = await fetch(VENDOR_MANAGEMENT_COMMON_API.ALL_ALLOTTED_SITES, {
        method: 'GET',
        headers: this.getHeaders(),
      });
      if (res.ok) {
        const json = await res.json();
        const list = json.data || (Array.isArray(json) ? json : null);
        if (Array.isArray(list) && list.length > 0) return list;
      }
    } catch {}
    return getStored<WorkOrderAssignItem[]>('assignments', INITIAL_ASSIGNMENTS);
  }

  async createAssignment(data: Omit<WorkOrderAssignItem, 'id'>): Promise<WorkOrderAssignItem> {
    const list = getStored<WorkOrderAssignItem[]>('assignments', INITIAL_ASSIGNMENTS);
    const newAssign: WorkOrderAssignItem = {
      ...data,
      id: Date.now(),
      assign_id: `ASN-${String(list.length + 1).padStart(3, '0')}`,
      status: 'Assigned',
      created_at: new Date().toISOString().replace('T', ' ').slice(0, 19),
    };
    const updated = [newAssign, ...list];
    setStored('assignments', updated);
    return newAssign;
  }

  // ── 5. Return & Maintenance ──
  async getRmRequests(): Promise<RmRequestItem[]> {
    try {
      const res = await fetch(`${API_PREFIX}/admin/rm-requests`, {
        method: 'GET',
        headers: this.getHeaders(),
      });
      if (res.ok) {
        const json = await res.json();
        const list = json.data || (Array.isArray(json) ? json : null);
        if (Array.isArray(list) && list.length > 0) return list;
      }
    } catch {}
    return getStored<RmRequestItem[]>('rm_requests', INITIAL_RM_REQUESTS);
  }

  async updateRmStatus(id: number, status: 'Pending' | 'In Progress' | 'Resolved'): Promise<void> {
    const list = getStored<RmRequestItem[]>('rm_requests', INITIAL_RM_REQUESTS);
    const updated = list.map((r) => (r.id === id ? { ...r, status } : r));
    setStored('rm_requests', updated);
  }

  // ── 6. Payments ──
  async getPayments(): Promise<PaymentRecordItem[]> {
    try {
      const res = await fetch(VENDOR_MANAGEMENT_COMMON_API.ALL_CLAIMS, {
        method: 'GET',
        headers: this.getHeaders(),
      });
      if (res.ok) {
        const json = await res.json();
        const list = json.data || (Array.isArray(json) ? json : null);
        if (Array.isArray(list) && list.length > 0) return list;
      }
    } catch {}
    return getStored<PaymentRecordItem[]>('payments', INITIAL_PAYMENTS);
  }

  // ── 7. Vendor Complaints ──
  async getComplaints(): Promise<VendorComplaintItem[]> {
    try {
      const res = await fetch(VENDOR_MANAGEMENT_COMMON_API.ALL_COMPLAINTS, {
        method: 'GET',
        headers: this.getHeaders(),
      });
      if (res.ok) {
        const json = await res.json();
        const list = json.data || (Array.isArray(json) ? json : null);
        if (Array.isArray(list) && list.length > 0) return list;
      }
    } catch {}
    return getStored<VendorComplaintItem[]>('complaints', INITIAL_COMPLAINTS);
  }

  async updateComplaint(id: number, patch: Partial<VendorComplaintItem>): Promise<void> {
    const list = getStored<VendorComplaintItem[]>('complaints', INITIAL_COMPLAINTS);
    const updated = list.map((c) => (c.id === id ? { ...c, ...patch } : c));
    setStored('complaints', updated);
  }

  // ── 8. Vendor Daily Progress ──
  async getDailyProgress(filters?: { start_date?: string; till_date?: string; vendor?: string }): Promise<VendorDailyProgressItem[]> {
    try {
      const q = new URLSearchParams();
      if (filters?.start_date) q.append('start_date', filters.start_date);
      if (filters?.till_date) q.append('till_date', filters.till_date);
      if (filters?.vendor) q.append('vendor', filters.vendor);

      const res = await fetch(`${VENDOR_MANAGEMENT_COMMON_API.ALL_DAILY_REPORTS}?${q.toString()}`, {
        method: 'GET',
        headers: this.getHeaders(),
      });
      if (res.ok) {
        const json = await res.json();
        const list = json.data || (Array.isArray(json) ? json : null);
        if (Array.isArray(list) && list.length > 0) return list;
      }
    } catch {}

    let list = getStored<VendorDailyProgressItem[]>('daily_progress', INITIAL_DAILY_PROGRESS);
    if (filters?.vendor && filters.vendor !== 'All' && filters.vendor.trim()) {
      list = list.filter((p) => p.vendor_name === filters.vendor || String(p.vendor_id) === filters.vendor);
    }
    if (filters?.start_date) {
      list = list.filter((p) => p.date >= filters.start_date!);
    }
    if (filters?.till_date) {
      list = list.filter((p) => p.date <= filters.till_date!);
    }
    return list;
  }
}

export const vendorOperationsService = new VendorOperationsService();
export default vendorOperationsService;
