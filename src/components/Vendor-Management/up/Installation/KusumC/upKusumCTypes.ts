// UP Kusum C Installation Types & Mock Data

export const UP_DISTRICTS = [
  'Agra',
  'Aligarh',
  'Ambedkar Nagar',
  'Amethi',
  'Amroha',
  'Auraiya',
  'Ayodhya',
  'Azamgarh',
  'Baghpat',
  'Bahraich',
  'Ballia',
  'Balrampur',
  'Banda',
  'Barabanki',
  'Bareilly',
  'Basti',
  'Bhadohi',
  'Bijnor',
  'Budaun',
  'Bulandshahr',
  'Chandauli',
  'Chitrakoot',
  'Deoria',
  'Etah',
  'Etawah',
  'Farrukhabad',
  'Fatehpur',
  'Firozabad',
  'Gautam Buddha Nagar',
  'Ghaziabad',
  'Ghazipur',
  'Gonda',
  'Gorakhpur',
  'Hamirpur',
  'Hapur',
  'Hardoi',
  'Hathras',
  'Jalaun',
  'Jaunpur',
  'Jhansi',
  'Kannauj',
  'Kanpur Dehat',
  'Kanpur Nagar',
  'Kasganj',
  'Kaushambi',
  'Kheri',
  'Kushinagar',
  'Lalitpur',
  'Lucknow',
  'Maharajganj',
  'Mahoba',
  'Mainpuri',
  'Mathura',
  'Mau',
  'Meerut',
  'Mirzapur',
  'Moradabad',
  'Muzaffarnagar',
  'Pilibhit',
  'Pratapgarh',
  'Prayagraj',
  'Raebareli',
  'Rampur',
  'Saharanpur',
  'Sambhal',
  'Sant Kabir Nagar',
  'Shahjahanpur',
  'Shamli',
  'Shravasti',
  'Siddharthnagar',
  'Sitapur',
  'Sonbhadra',
  'Sultanpur',
  'Unnao',
  'Varanasi',
];

export const UP_KUSUM_C_VENDORS = [
  { id: 1, name: 'Krishna' },
  { id: 2, name: 'Manish' },
  { id: 3, name: 'UP Manish' },
  { id: 4, name: 'Priya' },
  { id: 5, name: 'dummy user' },
  { id: 6, name: 'Sumit' },
];

export const UP_KUSUM_C_VOLUMES = [
  { id: '1', name: 'Volume 1' },
  { id: '2', name: 'Volume 2' },
  { id: '3', name: 'Volume 3' },
  { id: '4', name: 'Volume 4' },
];

/* ───────── View Assign Types ───────── */
export interface UPFarmerInfo {
  id: number;
  farmer_name: string;
  contact?: string;
  village?: string;
  block?: string;
  deadline_date: string;
  bos: 'Yes' | 'No';
  vfd: 'Yes' | 'No';
  inverter: 'Yes' | 'No';
  structure: 'Yes' | 'No';
  image?: string;
  remarks?: string;
}

export interface UPKusumCAssignRecord {
  id: number;
  vendor: string;
  assign_date: string;
  state: string;
  district: string;
  applicant_name: string;
  deadline_date: string;
  site_count: number;
  file?: string;
  remarks?: string;
  status: 'Assigned' | 'Accepted' | 'Pending' | 'Completed';
  farmers: UPFarmerInfo[];
}

/* ───────── Verify Installation Types ───────── */
export interface UPKusumCInstallationRecord {
  id: number;
  vendor_name: string;
  state: string;
  district: string;
  block: string;
  village: string;
  applicant_name: string;
  vfd_no: string;
  inverter_no: string;
  module_serial_no: string;
  farmer_with_module_img?: string;
  inverter_vfd_farmer_img?: string;
  running_water_farmer_img?: string;
  remarks?: string;
  verify_status: 'Pending' | 'Approved' | 'Rejected';
  verify_date?: string;
  verify_by?: string;
  verify_remarks?: string;
}

/* ───────── Verify Document Types ───────── */
export interface UPKusumCDocumentRecord {
  id: number;
  state: string;
  district: string;
  block: string;
  village: string;
  applicant_name: string;
  document_file?: string;
  submit_date: string;
  remarks?: string;
  verify_status: 'Pending' | 'Approved' | 'Rejected';
  verify_remarks?: string;
}

/* ───────── Verify Claim Types ───────── */
export interface UPKusumCClaimRecord {
  id: number;
  date: string;
  sites: string;
  invoice: string;
  amount: number;
  remarks: string;
  verify_remarks?: string;
  status: 'Pending' | 'Approved' | 'Rejected';
}

/* ───────── View Payment Types ───────── */
export interface UPKusumCPaymentRecord {
  id: number;
  date: string;
  vendor: string;
  sites: string;
  invoice: string;
  amount: number;
  remarks: string;
  pay_amount: number;
  balance_amount: number;
  pay_date?: string;
  pay_remarks?: string;
  pay_status: 'Paid' | 'Partially Paid' | 'Pending';
}

/* ───────── Initial Mock Data ───────── */

export const INITIAL_ASSIGN_DATA: UPKusumCAssignRecord[] = [
  {
    id: 1,
    vendor: 'utkarsh',
    assign_date: '2025-09-23',
    state: 'UP',
    district: 'Velit non architecto',
    applicant_name: 'Austin Simmons / Kim Small',
    deadline_date: '2025-09-23',
    site_count: 2,
    file: 'assignment_wo_utkarsh_01.pdf',
    remarks: 'testing work order',
    status: 'Assigned',
    farmers: [
      {
        id: 1,
        farmer_name: 'Austin Simmons',
        contact: '+91 98765 43210',
        village: 'Rampur Khurd',
        block: 'Mohanlalganj',
        deadline_date: '2025-09-23',
        bos: 'No',
        vfd: 'No',
        inverter: 'No',
        structure: 'No',
        image: 'https://images.unsplash.com/photo-1509391365360-2e959784a276?w=400&auto=format&fit=crop&q=60',
        remarks: 'testing farmer allocation',
      },
      {
        id: 2,
        farmer_name: 'Kim Small',
        contact: '+91 98123 45678',
        village: 'Kalyanpur',
        block: 'Bakshi Ka Talab',
        deadline_date: '2025-09-23',
        bos: 'No',
        vfd: 'No',
        inverter: 'No',
        structure: 'No',
        image: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=400&auto=format&fit=crop&q=60',
        remarks: 'testing farmer allocation 2',
      },
    ],
  },
  {
    id: 2,
    vendor: 'Krishna',
    assign_date: '2025-10-05',
    state: 'UP',
    district: 'Ayodhya',
    applicant_name: 'Ram Charan Verma',
    deadline_date: '2025-10-25',
    site_count: 3,
    file: 'wo_ayodhya_kusumc_02.pdf',
    remarks: 'Priority feeder solarization',
    status: 'Accepted',
    farmers: [
      {
        id: 3,
        farmer_name: 'Ram Charan Verma',
        contact: '+91 94500 12345',
        village: 'Bikapur',
        block: 'Bikapur',
        deadline_date: '2025-10-25',
        bos: 'Yes',
        vfd: 'Yes',
        inverter: 'No',
        structure: 'Yes',
        image: 'https://images.unsplash.com/photo-1497440001374-f26997328c1b?w=400&auto=format&fit=crop&q=60',
        remarks: 'Structure installed, inverter pending dispatch',
      },
    ],
  },
  {
    id: 3,
    vendor: 'UP Manish',
    assign_date: '2025-10-12',
    state: 'UP',
    district: 'Gorakhpur',
    applicant_name: 'Dinesh Yadav',
    deadline_date: '2025-11-02',
    site_count: 1,
    file: 'wo_gorakhpur_kusumc_03.pdf',
    remarks: 'Kusum C solar pump grid-connected installation',
    status: 'Assigned',
    farmers: [
      {
        id: 4,
        farmer_name: 'Dinesh Yadav',
        contact: '+91 97920 88776',
        village: 'Pipraich',
        block: 'Pipraich',
        deadline_date: '2025-11-02',
        bos: 'No',
        vfd: 'No',
        inverter: 'No',
        structure: 'No',
        remarks: 'Awaiting site civil work',
      },
    ],
  },
];

export const INITIAL_INSTALLATION_DATA: UPKusumCInstallationRecord[] = [
  {
    id: 1,
    vendor_name: 'Krishna',
    state: 'UP',
    district: 'Lucknow',
    block: 'Sarojini Nagar',
    village: 'Bhatgaon',
    applicant_name: 'Rameshwar Singh',
    vfd_no: 'VFD-UP-2025-8812',
    inverter_no: 'INV-UP-4491',
    module_serial_no: 'MOD-2025-9921',
    farmer_with_module_img: 'https://images.unsplash.com/photo-1509391365360-2e959784a276?w=600&auto=format&fit=crop&q=80',
    inverter_vfd_farmer_img: 'https://images.unsplash.com/photo-1497440001374-f26997328c1b?w=600&auto=format&fit=crop&q=80',
    running_water_farmer_img: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=600&auto=format&fit=crop&q=80',
    remarks: 'Discharge 4.5 LPS with grid sync completed',
    verify_status: 'Pending',
  },
  {
    id: 2,
    vendor_name: 'Manish',
    state: 'UP',
    district: 'Kanpur Nagar',
    block: 'Kalyanpur',
    village: 'Bithoor',
    applicant_name: 'Suresh Kumar Gupta',
    vfd_no: 'VFD-UP-2025-9102',
    inverter_no: 'INV-UP-5512',
    module_serial_no: 'MOD-2025-8841',
    farmer_with_module_img: 'https://images.unsplash.com/photo-1508873696983-2df5293cb395?w=600&auto=format&fit=crop&q=80',
    inverter_vfd_farmer_img: 'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=600&auto=format&fit=crop&q=80',
    running_water_farmer_img: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=600&auto=format&fit=crop&q=80',
    remarks: '7.5 HP Kusum C pump fully commissioned',
    verify_status: 'Pending',
  },
  {
    id: 3,
    vendor_name: 'Priya',
    state: 'UP',
    district: 'Ayodhya',
    block: 'Sohawal',
    village: 'Raunahi',
    applicant_name: 'Vijay Bahadur',
    vfd_no: 'VFD-UP-2025-7761',
    inverter_no: 'INV-UP-3321',
    module_serial_no: 'MOD-2025-7712',
    farmer_with_module_img: 'https://images.unsplash.com/photo-1509391365360-2e959784a276?w=600&auto=format&fit=crop&q=80',
    inverter_vfd_farmer_img: 'https://images.unsplash.com/photo-1497440001374-f26997328c1b?w=600&auto=format&fit=crop&q=80',
    running_water_farmer_img: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=600&auto=format&fit=crop&q=80',
    remarks: 'Earthing and lightening arrester verified on site',
    verify_status: 'Pending',
  },
  {
    id: 4,
    vendor_name: 'Sumit',
    state: 'UP',
    district: 'Varanasi',
    block: 'Arajiline',
    village: 'Raja Talab',
    applicant_name: 'Anand Prakash',
    vfd_no: 'VFD-UP-2025-6612',
    inverter_no: 'INV-UP-2219',
    module_serial_no: 'MOD-2025-6610',
    farmer_with_module_img: 'https://images.unsplash.com/photo-1508873696983-2df5293cb395?w=600&auto=format&fit=crop&q=80',
    inverter_vfd_farmer_img: 'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=600&auto=format&fit=crop&q=80',
    running_water_farmer_img: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=600&auto=format&fit=crop&q=80',
    remarks: 'Commissioning certificate signed by farmer',
    verify_status: 'Pending',
  },
  {
    id: 5,
    vendor_name: 'utkarsh',
    state: 'UP',
    district: 'Bareilly',
    block: 'Fatehganj',
    village: 'Meerganj',
    applicant_name: 'Mahesh Chandra',
    vfd_no: 'VFD-UP-2025-5511',
    inverter_no: 'INV-UP-1102',
    module_serial_no: 'MOD-2025-5540',
    farmer_with_module_img: 'https://images.unsplash.com/photo-1509391365360-2e959784a276?w=600&auto=format&fit=crop&q=80',
    inverter_vfd_farmer_img: 'https://images.unsplash.com/photo-1497440001374-f26997328c1b?w=600&auto=format&fit=crop&q=80',
    running_water_farmer_img: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=600&auto=format&fit=crop&q=80',
    remarks: 'Inspected and certified by field engineer',
    verify_status: 'Approved',
    verify_date: '2025-10-18',
    verify_by: 'Super Admin',
    verify_remarks: 'Installation meets all MNRE and UPNEDA guidelines',
  },
  {
    id: 6,
    vendor_name: 'UP Manish',
    state: 'UP',
    district: 'Prayagraj',
    block: 'Phulpur',
    village: 'Sahso',
    applicant_name: 'Tribhuvan Nath',
    vfd_no: 'VFD-UP-2025-4401',
    inverter_no: 'INV-UP-0099',
    module_serial_no: 'MOD-2025-4422',
    farmer_with_module_img: 'https://images.unsplash.com/photo-1508873696983-2df5293cb395?w=600&auto=format&fit=crop&q=80',
    inverter_vfd_farmer_img: 'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=600&auto=format&fit=crop&q=80',
    running_water_farmer_img: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=600&auto=format&fit=crop&q=80',
    remarks: 'Discharge verified with digital flow meter',
    verify_status: 'Approved',
    verify_date: '2025-10-20',
    verify_by: 'Super Admin',
    verify_remarks: 'All photos geotagged and verified',
  },
];

export const INITIAL_DOCUMENT_DATA: UPKusumCDocumentRecord[] = [
  {
    id: 1,
    state: 'UP',
    district: 'Lucknow',
    block: 'Sarojini Nagar',
    village: 'Bhatgaon',
    applicant_name: 'Rameshwar Singh',
    document_file: 'docs/kusumc/rameshwar_joint_inspection.pdf',
    submit_date: '2025-10-12',
    remarks: 'Joint Inspection Report, JIR signed by farmer and Discom JE',
    verify_status: 'Pending',
  },
  {
    id: 2,
    state: 'UP',
    district: 'Kanpur Nagar',
    block: 'Kalyanpur',
    village: 'Bithoor',
    applicant_name: 'Suresh Kumar Gupta',
    document_file: 'docs/kusumc/suresh_wcr_report.pdf',
    submit_date: '2025-10-14',
    remarks: 'Work Completion Report, invoice and warranty card attached',
    verify_status: 'Approved',
    verify_remarks: 'All documents duly signed and verified with portal records',
  },
  {
    id: 3,
    state: 'UP',
    district: 'Ayodhya',
    block: 'Sohawal',
    village: 'Raunahi',
    applicant_name: 'Vijay Bahadur',
    document_file: 'docs/kusumc/vijay_farmer_handover.pdf',
    submit_date: '2025-10-16',
    remarks: 'Handover Certificate and GPS geo-tagged site log',
    verify_status: 'Pending',
  },
];

export const INITIAL_CLAIM_DATA: UPKusumCClaimRecord[] = [
  {
    id: 1,
    date: '2025-10-15',
    sites: '3 Sites (Lucknow, Ayodhya)',
    invoice: 'INV-UP-KC-2025-001',
    amount: 540000,
    remarks: '70% Installation milestone claim for verified sites',
    status: 'Pending',
  },
  {
    id: 2,
    date: '2025-10-18',
    sites: '2 Sites (Bareilly, Prayagraj)',
    invoice: 'INV-UP-KC-2025-002',
    amount: 360000,
    remarks: '100% Final milestone claim after joint inspection',
    verify_remarks: 'Verified against portal approved site reports',
    status: 'Approved',
  },
  {
    id: 3,
    date: '2025-10-22',
    sites: '1 Site (Kanpur)',
    invoice: 'INV-UP-KC-2025-003',
    amount: 180000,
    remarks: 'Milestone 1 pump & module delivery claim',
    status: 'Pending',
  },
];

export const INITIAL_PAYMENT_DATA: UPKusumCPaymentRecord[] = [
  {
    id: 1,
    date: '2025-10-19',
    vendor: 'utkarsh',
    sites: 'Bareilly (2 Sites)',
    invoice: 'INV-UP-KC-2025-002',
    amount: 360000,
    remarks: 'Approved final milestone claim',
    pay_amount: 360000,
    balance_amount: 0,
    pay_date: '2025-10-21',
    pay_remarks: 'Full payment disbursed via RTGS',
    pay_status: 'Paid',
  },
  {
    id: 2,
    date: '2025-10-20',
    vendor: 'Krishna',
    sites: 'Lucknow (3 Sites)',
    invoice: 'INV-UP-KC-2025-001',
    amount: 540000,
    remarks: 'Installation 70% claim approved partially',
    pay_amount: 300000,
    balance_amount: 240000,
    pay_date: '2025-10-23',
    pay_remarks: 'First tranche released, balance upon JIR signoff',
    pay_status: 'Partially Paid',
  },
  {
    id: 3,
    date: '2025-10-24',
    vendor: 'Manish',
    sites: 'Kanpur (1 Site)',
    invoice: 'INV-UP-KC-2025-003',
    amount: 180000,
    remarks: 'Milestone 1 invoice pending finance clearance',
    pay_amount: 0,
    balance_amount: 180000,
    pay_status: 'Pending',
  },
];
