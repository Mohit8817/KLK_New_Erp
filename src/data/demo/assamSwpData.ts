/**
 * Assam Solar Water Pump (SWP) & Solar Installation Project Domain Data
 * Derived from Assam Operations API dataset
 */

export interface AssamSwpSummary {
  site_count: number;
  complete: number;
  pending: number;
  verify_pending: number;
  verify_approved: number;
  verify_reject: number;
  doc_approved: number;
  doc_pending: number;
  doc_reject: number;
  inst_claim_raised: number;
  inst_claim_approved: number;
  inst_claim_reject: number;
  inst_pay_complete: number;
  inst_pay_partially: number;
  inst_pay_pending: number;
}

export interface DistrictInstallItem {
  district: string;
  inst_complete: number;
}

export interface DistrictWiseItem {
  district: string;
  site_count: number;
  complete: number;
  pending: number;
  verify_pending: number;
  verify_approved: number;
  verify_reject: number;
  doc_approved: number;
  doc_pending: number;
  doc_reject: number;
  inst_claim_raised: number;
  inst_claim_approved: number;
  inst_claim_reject: number;
  inst_pay_complete: number;
  inst_pay_partially: number;
  inst_pay_pending: number;
}

export interface MonthlyInstallationItem {
  month_year: string;
  monthly_installations: number;
}

export interface AssamDashboardData {
  swp: AssamSwpSummary;
  district_install: DistrictInstallItem[];
  districtwise: DistrictWiseItem[];
  monthly_installations: MonthlyInstallationItem[];
}

export const ASSAM_DASHBOARD_DATA: AssamDashboardData = {
  swp: {
    site_count: 18,
    complete: 12,
    pending: 6,
    verify_pending: 12,
    verify_approved: 0,
    verify_reject: 0,
    doc_approved: 0,
    doc_pending: 4,
    doc_reject: 0,
    inst_claim_raised: 0,
    inst_claim_approved: 0,
    inst_claim_reject: 0,
    inst_pay_complete: 0,
    inst_pay_partially: 0,
    inst_pay_pending: 0,
  },
  district_install: [
    {
      district: 'assam',
      inst_complete: 2,
    },
    {
      district: 'District',
      inst_complete: 4,
    },
    {
      district: 'Lucknow',
      inst_complete: 5,
    },
    {
      district: 'up',
      inst_complete: 1,
    },
  ],
  districtwise: [
    {
      district: 'assam',
      site_count: 3,
      complete: 2,
      pending: 1,
      verify_pending: 2,
      verify_approved: 0,
      verify_reject: 0,
      doc_approved: 0,
      doc_pending: 1,
      doc_reject: 0,
      inst_claim_raised: 0,
      inst_claim_approved: 0,
      inst_claim_reject: 0,
      inst_pay_complete: 0,
      inst_pay_partially: 0,
      inst_pay_pending: 0,
    },
    {
      district: 'District',
      site_count: 4,
      complete: 4,
      pending: 0,
      verify_pending: 4,
      verify_approved: 0,
      verify_reject: 0,
      doc_approved: 0,
      doc_pending: 2,
      doc_reject: 0,
      inst_claim_raised: 0,
      inst_claim_approved: 0,
      inst_claim_reject: 0,
      inst_pay_complete: 0,
      inst_pay_partially: 0,
      inst_pay_pending: 0,
    },
    {
      district: 'Lucknow',
      site_count: 10,
      complete: 5,
      pending: 5,
      verify_pending: 5,
      verify_approved: 0,
      verify_reject: 0,
      doc_approved: 0,
      doc_pending: 1,
      doc_reject: 0,
      inst_claim_raised: 0,
      inst_claim_approved: 0,
      inst_claim_reject: 0,
      inst_pay_complete: 0,
      inst_pay_partially: 0,
      inst_pay_pending: 0,
    },
    {
      district: 'up',
      site_count: 1,
      complete: 1,
      pending: 0,
      verify_pending: 1,
      verify_approved: 0,
      verify_reject: 0,
      doc_approved: 0,
      doc_pending: 0,
      doc_reject: 0,
      inst_claim_raised: 0,
      inst_claim_approved: 0,
      inst_claim_reject: 0,
      inst_pay_complete: 0,
      inst_pay_partially: 0,
      inst_pay_pending: 0,
    },
  ],
  monthly_installations: [
    {
      month_year: '2026-06',
      monthly_installations: 8,
    },
    {
      month_year: '2026-07',
      monthly_installations: 4,
    },
  ],
};

export interface FarmerOption {
  id: string;
  farmerName: string;
  fatherName: string;
  state: string;
  district: string;
  block: string;
  village: string;
  sanctionedPumpHp: string;
}

export const SAMPLE_FARMERS: FarmerOption[] = [
  {
    id: 'FARMER-001',
    farmerName: 'Ramesh Kalita',
    fatherName: 'Prabin Kalita',
    state: 'Assam',
    district: 'Kamrup',
    block: 'Rampur Block',
    village: 'Boko Village',
    sanctionedPumpHp: '5 HP DC Submersible',
  },
  {
    id: 'FARMER-002',
    farmerName: 'Bikash Saikia',
    fatherName: 'Tarun Saikia',
    state: 'Assam',
    district: 'Nagaon',
    block: 'Kampur Block',
    village: 'Raha Village',
    sanctionedPumpHp: '3 HP Surface Solar',
  },
  {
    id: 'FARMER-003',
    farmerName: 'Anil Barman',
    fatherName: 'Hemanta Barman',
    state: 'Assam',
    district: 'Barpeta',
    block: 'Mandia Block',
    village: 'Chenga Village',
    sanctionedPumpHp: '5 HP AC Submersible',
  },
  {
    id: 'FARMER-004',
    farmerName: 'Mohit Kumar',
    fatherName: 'Suresh Kumar',
    state: 'Assam',
    district: 'Lucknow',
    block: 'East Block',
    village: 'Sonapur',
    sanctionedPumpHp: '7.5 HP Solar Pump',
  },
  {
    id: 'FARMER-005',
    farmerName: 'Deepak Roy',
    fatherName: 'Mukul Roy',
    state: 'Assam',
    district: 'District',
    block: 'West Block',
    village: 'Palasbari',
    sanctionedPumpHp: '3 HP DC Pump',
  },
];

export interface InstallationRecord {
  id: string;
  srNo: number;
  state: string;
  district: string;
  block: string;
  village: string;
  applicantName: string;
  fatherName?: string;
  vfdNo: string;
  inverterNo: string;
  moduleSerialNos: string[];
  latitude: string;
  longitude: string;
  farmerWithModuleImg: string;
  inverterVfdFarmerImg: string;
  runningWaterFarmerImg: string;
  remarks: string;
  verifyStatus: 'Pending' | 'Complete' | 'Reject';
  verifyRemarks: string;
  documentStatus: 'Pending' | 'Submitted' | 'Approved' | 'Reject';
  docVerifyRemarks: string;
  claimStatus: 'Pending' | 'Raised' | 'Approved' | 'Reject';
  paymentStatus: 'Pending' | 'Partially' | 'Complete';
}

export const SAMPLE_INSTALLATION_RECORDS: InstallationRecord[] = [
  {
    id: 'INS-001',
    srNo: 1,
    state: 'Assam',
    district: 'Kamrup',
    block: 'Rampur',
    village: 'Boko',
    applicantName: 'Ramesh Kalita',
    vfdNo: 'VFD-8921-X',
    inverterNo: 'INV-ASM-401',
    moduleSerialNos: ['SLR-MOD-8819', 'SLR-MOD-8820', 'SLR-MOD-8821'],
    latitude: '26.1445° N',
    longitude: '91.7362° E',
    farmerWithModuleImg: 'https://images.unsplash.com/photo-1509391365360-2e959784a276?w=150&auto=format&fit=crop&q=60',
    inverterVfdFarmerImg: 'https://images.unsplash.com/photo-1542332213-9b5a5a3fad35?w=150&auto=format&fit=crop&q=60',
    runningWaterFarmerImg: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=150&auto=format&fit=crop&q=60',
    remarks: 'Installation complete with discharge tested at 120 LPM',
    verifyStatus: 'Pending',
    verifyRemarks: 'Scheduled for joint inspection on 30-Sep',
    documentStatus: 'Pending',
    docVerifyRemarks: 'Awaiting signature from APDCL AE',
    claimStatus: 'Pending',
    paymentStatus: 'Pending',
  },
  {
    id: 'INS-002',
    srNo: 2,
    state: 'Assam',
    district: 'District',
    block: 'West Block',
    village: 'Palasbari',
    applicantName: 'Bikash Saikia',
    vfdNo: 'VFD-3302-K',
    inverterNo: 'INV-9921-B',
    moduleSerialNos: ['SLR-MOD-9011', 'SLR-MOD-9012', 'SLR-MOD-9013', 'SLR-MOD-9014'],
    latitude: '26.1120° N',
    longitude: '91.6840° E',
    farmerWithModuleImg: 'https://images.unsplash.com/photo-1508873696983-2df5293cb32b?w=150&auto=format&fit=crop&q=60',
    inverterVfdFarmerImg: 'https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?w=150&auto=format&fit=crop&q=60',
    runningWaterFarmerImg: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=150&auto=format&fit=crop&q=60',
    remarks: '5 HP Solar Pump mounted & water output normal',
    verifyStatus: 'Pending',
    verifyRemarks: 'Pending field survey',
    documentStatus: 'Submitted',
    docVerifyRemarks: 'Uploaded to APDCL Portal',
    claimStatus: 'Pending',
    paymentStatus: 'Pending',
  },
  {
    id: 'INS-003',
    srNo: 3,
    state: 'Assam',
    district: 'Lucknow',
    block: 'East Block',
    village: 'Sonapur',
    applicantName: 'Anil Barman',
    vfdNo: 'VFD-7841-A',
    inverterNo: 'INV-1044-L',
    moduleSerialNos: ['SLR-MOD-7411', 'SLR-MOD-7412', 'SLR-MOD-7413'],
    latitude: '26.1950° N',
    longitude: '91.8210° E',
    farmerWithModuleImg: 'https://images.unsplash.com/photo-1509391365360-2e959784a276?w=150&auto=format&fit=crop&q=60',
    inverterVfdFarmerImg: 'https://images.unsplash.com/photo-1542332213-9b5a5a3fad35?w=150&auto=format&fit=crop&q=60',
    runningWaterFarmerImg: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=150&auto=format&fit=crop&q=60',
    remarks: 'Dual tracking structure installed with auto-start VFD',
    verifyStatus: 'Pending',
    verifyRemarks: 'Inspection report drafted',
    documentStatus: 'Submitted',
    docVerifyRemarks: 'Documents verified by nodal officer',
    claimStatus: 'Pending',
    paymentStatus: 'Pending',
  },
  {
    id: 'INS-004',
    srNo: 4,
    state: 'Assam',
    district: 'Lucknow',
    block: 'Central Block',
    village: 'Khetri',
    applicantName: 'Mohd. Tariq',
    vfdNo: 'VFD-5512-P',
    inverterNo: 'INV-2041-N',
    moduleSerialNos: ['SLR-MOD-6501', 'SLR-MOD-6502'],
    latitude: '26.1011° N',
    longitude: '91.9540° E',
    farmerWithModuleImg: 'https://images.unsplash.com/photo-1508873696983-2df5293cb32b?w=150&auto=format&fit=crop&q=60',
    inverterVfdFarmerImg: 'https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?w=150&auto=format&fit=crop&q=60',
    runningWaterFarmerImg: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=150&auto=format&fit=crop&q=60',
    remarks: 'Ground water discharge verified at 95 LPM',
    verifyStatus: 'Pending',
    verifyRemarks: 'Pending vendor signoff',
    documentStatus: 'Pending',
    docVerifyRemarks: 'Farmer Aadhaar KYC pending',
    claimStatus: 'Pending',
    paymentStatus: 'Pending',
  },
  {
    id: 'INS-005',
    srNo: 5,
    state: 'Assam',
    district: 'District',
    block: 'North Block',
    village: 'Mirza',
    applicantName: 'Pooja Verma',
    vfdNo: 'VFD-1190-M',
    inverterNo: 'INV-8832-D',
    moduleSerialNos: ['SLR-MOD-4301', 'SLR-MOD-4302', 'SLR-MOD-4303'],
    latitude: '26.0820° N',
    longitude: '91.5320° E',
    farmerWithModuleImg: 'https://images.unsplash.com/photo-1509391365360-2e959784a276?w=150&auto=format&fit=crop&q=60',
    inverterVfdFarmerImg: 'https://images.unsplash.com/photo-1542332213-9b5a5a3fad35?w=150&auto=format&fit=crop&q=60',
    runningWaterFarmerImg: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=150&auto=format&fit=crop&q=60',
    remarks: 'Civil foundation cured & structure bolted',
    verifyStatus: 'Pending',
    verifyRemarks: 'Field test OK',
    documentStatus: 'Pending',
    docVerifyRemarks: 'Under review',
    claimStatus: 'Pending',
    paymentStatus: 'Pending',
  },
  {
    id: 'INS-006',
    srNo: 6,
    state: 'Assam',
    district: 'up',
    block: 'South Block',
    village: 'Chhaygaon',
    applicantName: 'Harbans Singh',
    vfdNo: 'VFD-6721-Q',
    inverterNo: 'INV-4411-K',
    moduleSerialNos: ['SLR-MOD-3321', 'SLR-MOD-3322', 'SLR-MOD-3323', 'SLR-MOD-3324'],
    latitude: '25.9870° N',
    longitude: '91.4110° E',
    farmerWithModuleImg: 'https://images.unsplash.com/photo-1508873696983-2df5293cb32b?w=150&auto=format&fit=crop&q=60',
    inverterVfdFarmerImg: 'https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?w=150&auto=format&fit=crop&q=60',
    runningWaterFarmerImg: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=150&auto=format&fit=crop&q=60',
    remarks: 'Controller programmed with remote monitoring capability',
    verifyStatus: 'Pending',
    verifyRemarks: 'Joint inspection pending',
    documentStatus: 'Submitted',
    docVerifyRemarks: 'All photos submitted',
    claimStatus: 'Pending',
    paymentStatus: 'Pending',
  },
  {
    id: 'INS-007',
    srNo: 7,
    state: 'Assam',
    district: 'Lucknow',
    block: 'Block-3',
    village: 'Bijoynagar',
    applicantName: 'Deepak Roy',
    vfdNo: 'VFD-4402-V',
    inverterNo: 'INV-5590-P',
    moduleSerialNos: ['SLR-MOD-2201', 'SLR-MOD-2202', 'SLR-MOD-2203'],
    latitude: '26.1200° N',
    longitude: '91.6100° E',
    farmerWithModuleImg: 'https://images.unsplash.com/photo-1509391365360-2e959784a276?w=150&auto=format&fit=crop&q=60',
    inverterVfdFarmerImg: 'https://images.unsplash.com/photo-1542332213-9b5a5a3fad35?w=150&auto=format&fit=crop&q=60',
    runningWaterFarmerImg: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=150&auto=format&fit=crop&q=60',
    remarks: 'Complete 3 HP SWP system operational',
    verifyStatus: 'Pending',
    verifyRemarks: 'Awaiting field visit',
    documentStatus: 'Pending',
    docVerifyRemarks: 'Initial document received',
    claimStatus: 'Pending',
    paymentStatus: 'Pending',
  },
  {
    id: 'INS-008',
    srNo: 8,
    state: 'Assam',
    district: 'District',
    block: 'Block-4',
    village: 'Hajo',
    applicantName: 'Sanjay Das',
    vfdNo: 'VFD-9981-L',
    inverterNo: 'INV-1102-S',
    moduleSerialNos: ['SLR-MOD-1101', 'SLR-MOD-1102', 'SLR-MOD-1103'],
    latitude: '26.2400° N',
    longitude: '91.5200° E',
    farmerWithModuleImg: 'https://images.unsplash.com/photo-1508873696983-2df5293cb32b?w=150&auto=format&fit=crop&q=60',
    inverterVfdFarmerImg: 'https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?w=150&auto=format&fit=crop&q=60',
    runningWaterFarmerImg: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=150&auto=format&fit=crop&q=60',
    remarks: 'Discharge 110 LPM verified in presence of village head',
    verifyStatus: 'Pending',
    verifyRemarks: 'Ready for verification',
    documentStatus: 'Submitted',
    docVerifyRemarks: 'Inspection form attached',
    claimStatus: 'Pending',
    paymentStatus: 'Pending',
  },
];

