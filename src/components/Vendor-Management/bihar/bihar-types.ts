// Clean Shared Domain Interfaces & Master Constants for Bihar Vendor Management
// (Pure TypeScript types and official geographic lists only - NO MOCK DATA)

export const BIHAR_DISTRICTS = [
  'Araria', 'Arwal', 'Aurangabad', 'Banka', 'Begusarai', 'Bhagalpur', 'Bhojpur', 'Buxar',
  'Darbhanga', 'East Champaran', 'Gaya', 'Gopalganj', 'Jamui', 'Jehanabad', 'Kaimur', 'Katihar',
  'Khagaria', 'Kishanganj', 'Lakhisarai', 'Madhepura', 'Madhubani', 'Munger', 'Muzaffarpur',
  'Nalanda', 'Nawada', 'Patna', 'Purnia', 'Rohtas', 'Saharsa', 'Samastipur', 'Saran',
  'Sheikhpura', 'Sheohar', 'Sitamarhi', 'Siwan', 'Supaul', 'Vaishali', 'West Champaran',
] as const;

export const BIHAR_VOLUMES = ['Volume 1', 'Volume 2', 'Volume 3', 'Volume 4', 'Volume 5'] as const;

export const BIHAR_SUPPLY_INSP_CODES = [
  'INSP-VOL1-2026-001',
  'INSP-VOL1-2026-002',
  'INSP-VOL2-2026-005',
  'INSP-VOL3-2026-009',
  'INSP-VOL4-2026-012',
  'INSP-VOL5-2026-018',
] as const;

export interface BiharVendor {
  id: number;
  name: string;
  vendor_code?: string;
  contact_person?: string;
  mobile?: string;
  email?: string;
  status?: number;
}

export interface BiharSitePoolItem {
  id: number;
  site_name: string;
  district: string;
  ca_no?: string;
  department?: string;
  sanction_load?: string;
  address?: string;
  assigned?: boolean;
}

// ── SRT 200MW Survey ──
export interface BiharSRTAssignRecord {
  id: number;
  vendor: string;
  vendor_code?: string;
  assign_date: string;
  state: string;
  district: string;
  site_name: string;
  site_count: number;
  ca_no?: string;
  department?: string;
  deadline_date?: string;
  file?: string | null;
  remarks?: string;
  status: 0 | 1 | 2; // 0 = Pending, 1 = Approved, 2 = Accepted
  survey_completed?: boolean;
}

export interface BiharSRTVerifySiteItem {
  id: number;
  sr_no?: number;
  uid: string;
  vendor_name: string;
  state: string;
  district: string;
  division?: string;
  sub_division?: string;
  department?: string;
  site_name: string;
  site_address?: string;
  ca_no?: string;
  survey_address?: string;
  near_landmark?: string;
  agency_person_name?: string;
  agency_person_contact?: string;
  nodal_person?: string;
  contact_nodal?: string;
  latitude?: string;
  longitude?: string;
  load_type?: string;
  connection_phase?: string;
  meter_connection?: string;
  meter_number?: string;
  meter_type?: string;
  sanction_load?: string;
  connected_load?: string;
  grid_power?: string;
  all_3_phase_ltdb?: string;
  missing_phase?: string;
  ltdb_present?: string;
  roof_condition?: string;
  area_roof?: string;
  free_space_solar?: string;
  free_space_inverter?: string;
  earth_pit?: string;
  site_feasible?: string;
  building_age?: string;
  roof_access?: string;
  rooftop_height?: string;
  parapet_height?: string;
  floors_number?: string;
  water_source?: string;
  site_access?: string;
  site_distance?: string;
  image1?: string; // Building Image
  image2?: string; // Roof Image
  image3?: string; // Control Room
  image4?: string; // Other Image
  pdf_file?: string;
  survey_remarks?: string;
  survey_verify_status: 0 | 1 | 2; // 0 = Pending, 1 = Approved, 2 = Rejected
  verify_remarks?: string;
  reverify_status?: string;
  verified_at?: string;
  verified_by?: string;
}

// ── ULA Survey ──
export interface BiharULASurveyItem {
  id: number;
  sr_no?: number;
  survey_date: string;
  vendor_name: string;
  district: string;
  block?: string;
  panchayat?: string;
  village?: string;
  address?: string;
  consumer_name: string;
  gender?: 'Male' | 'Female' | 'Other';
  contact_no?: string;
  aadhar_no?: string;
  ca_number?: string;
  smart_meter?: 'Yes' | 'No';
  smart_meter_no?: string;
  meter_functional?: 'Yes' | 'No';
  feasible?: 'Yes' | 'No';
  latitude?: string;
  longitude?: string;
  electricity_bill_photo?: string;
  consent_form_photo?: string;
  aadhar_card_photo?: string;
  remarks?: string;
  status: 'Complete' | 'Pending';
  verify_status: 'Pending' | 'Approved' | 'Rejected';
  verify_remarks?: string;
  verify_by?: string;
}

// ── SSL Installation ──
export interface BiharSSLAssignRecord {
  id: number;
  vendor: string;
  vendor_id?: string | number;
  vendor_firm?: string;
  vendor_contact?: string;
  company_id?: string;
  state: string;
  volume: string;
  district: string;
  block: string;
  panchayat: string;
  ward_no?: string;
  pole_no?: string;
  assign_date: string;
  deadline_date: string;
  site_count: number;
  data_match?: string;
  unique_id_file?: string | null;
  battery_no_file?: string | null;
  sim_no_file?: string | null;
  panel_no_file?: string | null;
  imei_no_file?: string | null;
  remarks?: string;
  status: 0 | 1 | 2; // 0 Pending, 1 Approved, 2 Accepted
}

export interface BiharSSLVerifyLightItem {
  id: number;
  vendor: string;
  uid: string;
  state: string;
  phase?: string;
  district: string;
  district_code?: string;
  block: string;
  block_code?: string;
  panchayat: string;
  panchyat?: string;
  panchayat_code?: string;
  ward_no?: string;
  pole_no?: string;
  beneficiary_name?: string;
  beneficiary_contact?: string;
  contact_no?: string;
  latitude?: string;
  longitude?: string;
  uuid_no?: string;
  imei_no?: string;
  light_no?: string;
  battery_no?: string;
  battery_serial_no?: string;
  panel_no?: string;
  module_no?: string;
  light_image?: string;
  light_file?: string;
  remark?: string;
  inst_remark?: string;
  verify_status: 'Pending' | 'Approved' | 'Rejected';
  inst_verify_status?: number | string;
  reverify_status?: string;
  installation_assigned_by?: string;
  installation_vendor?: string | number;
  installed_by?: string | number;
  date_of_installation?: string;
  inst_date?: string;
  [key: string]: any;
}

// ── SRT Installation ──
export interface BiharSRTInstAssignRecord {
  id: number;
  vendor: string;
  assign_date: string;
  state: string;
  district: string;
  site_name: string;
  site_count: number;
  deadline_date?: string;
  remarks?: string;
  status: 0 | 1 | 2;
}

export interface BiharSRTInstVerifySiteItem {
  id: number;
  company_id?: string;
  unique_id?: string | null;
  discom?: string;
  state?: string;
  volume?: string;
  district?: string;
  dept_name?: string;
  site_name?: string;
  location?: string;
  firm_name?: string;
  ca_no?: string;
  sanction_load?: string;
  plant_sc?: string;
  vendor?: string;
  contact_person?: string;
  contact_number?: string;
  installation_status?: string;
  installation_date?: string | null;
  inst_remarks?: string;
  solarmeter_no?: string | null;
  inverter_no?: string | null;
  nm_sm_no?: string | null;
  loger_no?: string | null;
  inst_latitude?: string | null;
  inst_longitude?: string | null;
  cr_doc?: string | null;
  survey_status?: number;
  verify_status?: string;
}

export interface BiharSRTClaimItem {
  id: number;
  state: string;
  vendor_name: string;
  claim_raised_date: string;
  site_count: number;
  claim_invoice_no: string;
  claim_amount: number;
  claim_doc?: string;
  status: 0 | 1 | 2;
  action_remarks?: string;
}

export interface BiharSRTPaymentItem {
  id: number;
  vendor_name: string;
  payment_type: '70%' | '15% A' | '15% B';
  invoice_no: string;
  site_count: number;
  total_amount: number;
  tds_amount: number;
  net_payable: number;
  utr_no?: string;
  payment_date?: string;
  status: 'Pending' | 'Processed' | 'Rejected';
}
