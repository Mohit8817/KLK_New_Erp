/*
 * Solar ERP — Jammu 70MW SRT Project Domain Data
 * Realistic operational datasets for Jammu & Kashmir Solar Rooftop ERP Dashboard.
 */

export interface PhaseDetailRow {
  srNo: number;
  phase: string;
  materialYetToDispatch: number;
  siteInstalled: number;
  siteNotInstalled: number;
  meterInstalled: number;
  meterNotInstalled: number;
  rmsInstalled: number;
  rmsNotInstalled: number;
  imagePending: number;
}

export interface ReportBifurcationRow {
  srNo: number;
  name: string; // Phase / District / Vendor / Work Order
  sites: number;
  totalCapacityKw: number;
  materialDispatchKw: number;
  materialPendingKw: number;
  installationCompleteKw: number;
  installationPendingKw: number;
  meterInstalled: number;
  meterPending: number;
  rmsInstalled: number;
  rmsPending: number;
  insurancePending: number;
  billPending: number;
  pay70DoneKw: number;
  pay70PendingKw: number;
  pay10DoneKw: number;
  pay10PendingKw: number;
}

export interface MaterialItem {
  id: string;
  name: string;
  category: string;
  specification: string;
  required: number;
  supplied: number;
  installed: number;
  inTransit: number;
  pending: number;
  unit: string;
  status: 'Adequate' | 'In Transit' | 'Critical Low' | 'Surplus';
  statusTone: 'success' | 'warning' | 'danger' | 'info';
}

export interface RecentProject {
  id: string;
  name: string;
  consumer: string;
  district: string;
  capacityKw: number;
  progress: number;
  status: 'Installed' | 'In Progress' | 'Meter Pending' | 'RMS Active' | 'Feasible';
  statusTone: 'success' | 'warning' | 'info' | 'accent' | 'neutral';
  phase: string;
  targetDate: string;
  leadEngineer: string;
}

export interface OperationActivity {
  id: string;
  time: string;
  date: string;
  title: string;
  description: string;
  district: string;
  tone: 'success' | 'info' | 'warning' | 'accent';
  icon: string;
}

export const JAMMU_SOLAR_OVERVIEW = {
  projectName: 'Jammu 70MW SRT Solar Rooftop Project',
  state: 'Jammu & Kashmir',
  region: 'Jammu Operations Hub',
  discom: 'JPDCL (Jammu Power Distribution Corporation Limited)',
  nodalAgency: 'JAKEDA (J&K Energy Development Agency)',
  scheme: 'MNRE Rooftop Solar Phase-II 70MW Grid-Connected',

  totalSites: 3086,
  surveyDone: 3086,
  surveyPending: 0,
  totalCapacityKw: 28381,

  cancelSites: 642,
  cancelCapacityKw: 5387,

  feasibleSites: 2444,
  feasibleCapacityKw: 22994,

  materialDispatchedKw: 20936,
  materialDispatchedSites: 2060,
  materialPendingKw: 2058,
  materialPendingSites: 384,

  installedKw: 17469,
  installedSites: 1568,
  installPendingKw: 5525,
  installPendingSites: 876,

  meterInstalledKw: 6159,
  meterInstalledSites: 593,
  meterPendingKw: 11310,
  meterPendingSites: 975,

  rmsInstalledKw: 9287,
  rmsInstalledSites: 816,
  rmsPendingKw: 8182,
  rmsPendingSites: 752,

  payment70DoneKw: 20936,
  payment70DoneSites: 2060,
  payment70PendingKw: 2058,
  payment70PendingSites: 384,

  payment10DoneKw: 413,
  payment10DoneSites: 53,
  payment10PendingKw: 22581,
  payment10PendingSites: 2391,

  amc1To5DoneKw: 0,
  amc1To5DoneSites: 0,
  amc1To5PendingKw: 22994,
  amc1To5PendingSites: 2444,

  // Financial summary (INR in Crores)
  totalProjectValueCr: 114.97, // 22.99 MW approx @ ~50k/kW
  subsidy70CrReleased: 80.48,
  subsidy10CrReleased: 1.58,
  outstandingPaymentCr: 32.91,
};

export const PHASE_DETAILS_DATA: PhaseDetailRow[] = [
  { srNo: 1, phase: 'Phase 1', materialYetToDispatch: 0, siteInstalled: 62, siteNotInstalled: 1, meterInstalled: 44, meterNotInstalled: 19, rmsInstalled: 61, rmsNotInstalled: 2, imagePending: 2 },
  { srNo: 2, phase: 'Phase 2', materialYetToDispatch: 0, siteInstalled: 176, siteNotInstalled: 91, meterInstalled: 104, meterNotInstalled: 163, rmsInstalled: 118, rmsNotInstalled: 149, imagePending: 25 },
  { srNo: 3, phase: 'Phase 3', materialYetToDispatch: 0, siteInstalled: 207, siteNotInstalled: 18, meterInstalled: 63, meterNotInstalled: 162, rmsInstalled: 108, rmsNotInstalled: 117, imagePending: 4 },
  { srNo: 4, phase: 'Phase 4', materialYetToDispatch: 0, siteInstalled: 57, siteNotInstalled: 11, meterInstalled: 33, meterNotInstalled: 35, rmsInstalled: 46, rmsNotInstalled: 22, imagePending: 64 },
  { srNo: 5, phase: 'Phase 5', materialYetToDispatch: 0, siteInstalled: 258, siteNotInstalled: 143, meterInstalled: 96, meterNotInstalled: 305, rmsInstalled: 98, rmsNotInstalled: 303, imagePending: 41 },
  { srNo: 6, phase: 'Phase 6', materialYetToDispatch: 1251, siteInstalled: 210, siteNotInstalled: 353, meterInstalled: 42, meterNotInstalled: 521, rmsInstalled: 66, rmsNotInstalled: 497, imagePending: 56 },
  { srNo: 7, phase: 'Phase 7', materialYetToDispatch: 0, siteInstalled: 52, siteNotInstalled: 6, meterInstalled: 34, meterNotInstalled: 24, rmsInstalled: 50, rmsNotInstalled: 8, imagePending: 58 },
  { srNo: 8, phase: 'Phase 8', materialYetToDispatch: 807, siteInstalled: 0, siteNotInstalled: 162, meterInstalled: 0, meterNotInstalled: 162, rmsInstalled: 0, rmsNotInstalled: 162, imagePending: 0 },
  { srNo: 9, phase: 'Phase NA', materialYetToDispatch: 0, siteInstalled: 546, siteNotInstalled: 91, meterInstalled: 188, meterNotInstalled: 449, rmsInstalled: 273, rmsNotInstalled: 364, imagePending: 246 },
];

export const PHASE_WISE_REPORT: ReportBifurcationRow[] = [
  { srNo: 1, name: 'Phase 1', sites: 63, totalCapacityKw: 794, materialDispatchKw: 794, materialPendingKw: 0, installationCompleteKw: 789, installationPendingKw: 5, meterInstalled: 44, meterPending: 19, rmsInstalled: 61, rmsPending: 2, insurancePending: 2, billPending: 50, pay70DoneKw: 794, pay70PendingKw: 0, pay10DoneKw: 163, pay10PendingKw: 631 },
  { srNo: 2, name: 'Phase 2', sites: 267, totalCapacityKw: 1338, materialDispatchKw: 1338, materialPendingKw: 0, installationCompleteKw: 998, installationPendingKw: 340, meterInstalled: 104, meterPending: 163, rmsInstalled: 118, rmsPending: 149, insurancePending: 25, billPending: 166, pay70DoneKw: 1338, pay70PendingKw: 0, pay10DoneKw: 83, pay10PendingKw: 1255 },
  { srNo: 3, name: 'Phase 3', sites: 225, totalCapacityKw: 3992, materialDispatchKw: 3992, materialPendingKw: 0, installationCompleteKw: 3676, installationPendingKw: 316, meterInstalled: 63, meterPending: 162, rmsInstalled: 108, rmsPending: 117, insurancePending: 4, billPending: 85, pay70DoneKw: 3992, pay70PendingKw: 0, pay10DoneKw: 100, pay10PendingKw: 3892 },
  { srNo: 4, name: 'Phase 4', sites: 68, totalCapacityKw: 734, materialDispatchKw: 734, materialPendingKw: 0, installationCompleteKw: 691, installationPendingKw: 43, meterInstalled: 33, meterPending: 35, rmsInstalled: 46, rmsPending: 22, insurancePending: 64, billPending: 624, pay70DoneKw: 734, pay70PendingKw: 0, pay10DoneKw: 0, pay10PendingKw: 734 },
  { srNo: 5, name: 'Phase 5', sites: 401, totalCapacityKw: 4918, materialDispatchKw: 4918, materialPendingKw: 0, installationCompleteKw: 3676, installationPendingKw: 1242, meterInstalled: 96, meterPending: 305, rmsInstalled: 98, rmsPending: 303, insurancePending: 41, billPending: 767, pay70DoneKw: 4918, pay70PendingKw: 0, pay10DoneKw: 0, pay10PendingKw: 4918 },
  { srNo: 6, name: 'Phase 6', sites: 563, totalCapacityKw: 3891, materialDispatchKw: 2640, materialPendingKw: 1251, installationCompleteKw: 1804, installationPendingKw: 2087, meterInstalled: 42, meterPending: 521, rmsInstalled: 66, rmsPending: 497, insurancePending: 56, billPending: 645, pay70DoneKw: 2640, pay70PendingKw: 1251, pay10DoneKw: 0, pay10PendingKw: 3891 },
  { srNo: 7, name: 'Phase 7', sites: 58, totalCapacityKw: 551, materialDispatchKw: 551, materialPendingKw: 0, installationCompleteKw: 509, installationPendingKw: 42, meterInstalled: 34, meterPending: 24, rmsInstalled: 50, rmsPending: 8, insurancePending: 58, billPending: 551, pay70DoneKw: 551, pay70PendingKw: 0, pay10DoneKw: 67, pay10PendingKw: 484 },
  { srNo: 8, name: 'Phase 8', sites: 162, totalCapacityKw: 807, materialDispatchKw: 0, materialPendingKw: 807, installationCompleteKw: 0, installationPendingKw: 807, meterInstalled: 0, meterPending: 162, rmsInstalled: 0, rmsPending: 162, insurancePending: 0, billPending: 0, pay70DoneKw: 0, pay70PendingKw: 807, pay10DoneKw: 0, pay10PendingKw: 807 },
  { srNo: 9, name: 'Phase NA', sites: 637, totalCapacityKw: 5969, materialDispatchKw: 5969, materialPendingKw: 0, installationCompleteKw: 5326, installationPendingKw: 643, meterInstalled: 188, meterPending: 449, rmsInstalled: 273, rmsPending: 364, insurancePending: 246, billPending: 1368, pay70DoneKw: 5969, pay70PendingKw: 0, pay10DoneKw: 0, pay10PendingKw: 5969 },
];

export const DISTRICT_WISE_REPORT: ReportBifurcationRow[] = [
  { srNo: 1, name: 'Jammu', sites: 980, totalCapacityKw: 9240, materialDispatchKw: 8750, materialPendingKw: 490, installationCompleteKw: 7420, installationPendingKw: 1820, meterInstalled: 270, meterPending: 710, rmsInstalled: 360, rmsPending: 620, insurancePending: 140, billPending: 1520, pay70DoneKw: 8750, pay70PendingKw: 490, pay10DoneKw: 210, pay10PendingKw: 9030 },
  { srNo: 2, name: 'Kathua', sites: 420, totalCapacityKw: 4120, materialDispatchKw: 3860, materialPendingKw: 260, installationCompleteKw: 3180, installationPendingKw: 940, meterInstalled: 110, meterPending: 310, rmsInstalled: 145, rmsPending: 275, insurancePending: 78, billPending: 820, pay70DoneKw: 3860, pay70PendingKw: 260, pay10DoneKw: 80, pay10PendingKw: 4040 },
  { srNo: 3, name: 'Samba', sites: 340, totalCapacityKw: 3340, materialDispatchKw: 3200, materialPendingKw: 140, installationCompleteKw: 2640, installationPendingKw: 700, meterInstalled: 95, meterPending: 245, rmsInstalled: 120, rmsPending: 220, insurancePending: 65, billPending: 640, pay70DoneKw: 3200, pay70PendingKw: 140, pay10DoneKw: 65, pay10PendingKw: 3275 },
  { srNo: 4, name: 'Udhampur', sites: 260, totalCapacityKw: 2480, materialDispatchKw: 2150, materialPendingKw: 330, installationCompleteKw: 1820, installationPendingKw: 660, meterInstalled: 62, meterPending: 198, rmsInstalled: 88, rmsPending: 172, insurancePending: 82, billPending: 510, pay70DoneKw: 2150, pay70PendingKw: 330, pay10DoneKw: 38, pay10PendingKw: 2442 },
  { srNo: 5, name: 'Rajouri', sites: 154, totalCapacityKw: 1390, materialDispatchKw: 1120, materialPendingKw: 270, installationCompleteKw: 940, installationPendingKw: 450, meterInstalled: 28, meterPending: 126, rmsInstalled: 42, rmsPending: 112, insurancePending: 42, billPending: 280, pay70DoneKw: 1120, pay70PendingKw: 270, pay10DoneKw: 20, pay10PendingKw: 1370 },
  { srNo: 6, name: 'Poonch', sites: 92, totalCapacityKw: 820, materialDispatchKw: 680, materialPendingKw: 140, installationCompleteKw: 560, installationPendingKw: 260, meterInstalled: 16, meterPending: 76, rmsInstalled: 24, rmsPending: 68, insurancePending: 30, billPending: 190, pay70DoneKw: 680, pay70PendingKw: 140, pay10DoneKw: 0, pay10PendingKw: 820 },
  { srNo: 7, name: 'Doda', sites: 74, totalCapacityKw: 644, materialDispatchKw: 490, materialPendingKw: 154, installationCompleteKw: 380, installationPendingKw: 264, meterInstalled: 9, meterPending: 65, rmsInstalled: 15, rmsPending: 59, insurancePending: 22, billPending: 126, pay70DoneKw: 490, pay70PendingKw: 154, pay10DoneKw: 0, pay10PendingKw: 644 },
  { srNo: 8, name: 'Ramban', sites: 48, totalCapacityKw: 390, materialDispatchKw: 286, materialPendingKw: 104, installationCompleteKw: 219, installationPendingKw: 171, meterInstalled: 6, meterPending: 42, rmsInstalled: 10, rmsPending: 38, insurancePending: 14, billPending: 70, pay70DoneKw: 286, pay70PendingKw: 104, pay10DoneKw: 0, pay10PendingKw: 390 },
  { srNo: 9, name: 'Reasi', sites: 46, totalCapacityKw: 360, materialDispatchKw: 250, materialPendingKw: 110, installationCompleteKw: 190, installationPendingKw: 170, meterInstalled: 5, meterPending: 41, rmsInstalled: 9, rmsPending: 37, insurancePending: 12, billPending: 60, pay70DoneKw: 250, pay70PendingKw: 110, pay10DoneKw: 0, pay10PendingKw: 360 },
  { srNo: 10, name: 'Kishtwar', sites: 30, totalCapacityKw: 210, materialDispatchKw: 150, materialPendingKw: 60, installationCompleteKw: 120, installationPendingKw: 90, meterInstalled: 3, meterPending: 27, rmsInstalled: 7, rmsPending: 23, insurancePending: 9, billPending: 40, pay70DoneKw: 150, pay70PendingKw: 60, pay10DoneKw: 0, pay10PendingKw: 210 },
];

export const VENDOR_WISE_REPORT: ReportBifurcationRow[] = [
  { srNo: 1, name: 'Tata Power Solar Systems', sites: 890, totalCapacityKw: 8400, materialDispatchKw: 8100, materialPendingKw: 300, installationCompleteKw: 7200, installationPendingKw: 1200, meterInstalled: 260, meterPending: 630, rmsInstalled: 340, rmsPending: 550, insurancePending: 160, billPending: 1480, pay70DoneKw: 8100, pay70PendingKw: 300, pay10DoneKw: 220, pay10PendingKw: 8180 },
  { srNo: 2, name: 'Waaree Energies Ltd', sites: 640, totalCapacityKw: 6150, materialDispatchKw: 5600, materialPendingKw: 550, installationCompleteKw: 4800, installationPendingKw: 1350, meterInstalled: 160, meterPending: 480, rmsInstalled: 220, rmsPending: 420, insurancePending: 130, billPending: 1120, pay70DoneKw: 5600, pay70PendingKw: 550, pay10DoneKw: 110, pay10PendingKw: 6040 },
  { srNo: 3, name: 'Adani Solar / Mundra Solar', sites: 430, totalCapacityKw: 4020, materialDispatchKw: 3750, materialPendingKw: 270, installationCompleteKw: 2950, installationPendingKw: 1070, meterInstalled: 98, meterPending: 332, rmsInstalled: 135, rmsPending: 295, insurancePending: 95, billPending: 750, pay70DoneKw: 3750, pay70PendingKw: 270, pay10DoneKw: 83, pay10PendingKw: 3937 },
  { srNo: 4, name: 'Vikram Solar Limited', sites: 284, totalCapacityKw: 2624, materialDispatchKw: 2186, materialPendingKw: 438, installationCompleteKw: 1619, installationPendingKw: 1005, meterInstalled: 56, meterPending: 228, rmsInstalled: 80, rmsPending: 204, insurancePending: 68, billPending: 560, pay70DoneKw: 2186, pay70PendingKw: 438, pay10DoneKw: 0, pay10PendingKw: 2624 },
  { srNo: 5, name: 'Goldi Solar Pvt Ltd', sites: 200, totalCapacityKw: 1800, materialDispatchKw: 1300, materialPendingKw: 500, installationCompleteKw: 900, installationPendingKw: 900, meterInstalled: 30, meterPending: 170, rmsInstalled: 45, rmsPending: 155, insurancePending: 43, billPending: 346, pay70DoneKw: 1300, pay70PendingKw: 500, pay10DoneKw: 0, pay10PendingKw: 1800 },
];

export const WORK_ORDER_REPORT: ReportBifurcationRow[] = [
  { srNo: 1, name: 'WO-JAM-001 (Urban Rooftop Tier-1)', sites: 720, totalCapacityKw: 7200, materialDispatchKw: 6900, materialPendingKw: 300, installationCompleteKw: 6100, installationPendingKw: 1100, meterInstalled: 230, meterPending: 490, rmsInstalled: 310, rmsPending: 410, insurancePending: 120, billPending: 1240, pay70DoneKw: 6900, pay70PendingKw: 300, pay10DoneKw: 180, pay10PendingKw: 7020 },
  { srNo: 2, name: 'WO-JAM-002 (Govt Institutional Sites)', sites: 480, totalCapacityKw: 5400, materialDispatchKw: 5100, materialPendingKw: 300, installationCompleteKw: 4350, installationPendingKw: 1050, meterInstalled: 140, meterPending: 340, rmsInstalled: 195, rmsPending: 285, insurancePending: 105, billPending: 960, pay70DoneKw: 5100, pay70PendingKw: 300, pay10DoneKw: 115, pay10PendingKw: 5285 },
  { srNo: 3, name: 'WO-JAM-003 (Industrial Kathua/Samba)', sites: 410, totalCapacityKw: 4350, materialDispatchKw: 3950, materialPendingKw: 400, installationCompleteKw: 3120, installationPendingKw: 1230, meterInstalled: 105, meterPending: 305, rmsInstalled: 140, rmsPending: 270, insurancePending: 92, billPending: 810, pay70DoneKw: 3950, pay70PendingKw: 400, pay10DoneKw: 78, pay10PendingKw: 4272 },
  { srNo: 4, name: 'WO-JAM-004 (Udhampur & Hill Terrains)', sites: 380, totalCapacityKw: 3100, materialDispatchKw: 2650, materialPendingKw: 450, installationCompleteKw: 2050, installationPendingKw: 1050, meterInstalled: 68, meterPending: 312, rmsInstalled: 95, rmsPending: 285, insurancePending: 84, billPending: 620, pay70DoneKw: 2650, pay70PendingKw: 450, pay10DoneKw: 40, pay10PendingKw: 3060 },
  { srNo: 5, name: 'WO-JAM-005 (Residential Clusters Phase V)', sites: 290, totalCapacityKw: 1850, materialDispatchKw: 1480, materialPendingKw: 370, installationCompleteKw: 1150, installationPendingKw: 700, meterInstalled: 42, meterPending: 248, rmsInstalled: 58, rmsPending: 232, insurancePending: 60, billPending: 410, pay70DoneKw: 1480, pay70PendingKw: 370, pay10DoneKw: 0, pay10PendingKw: 1850 },
  { srNo: 6, name: 'WO-JAM-006 (Border Villages SRT Expansion)', sites: 164, totalCapacityKw: 1094, materialDispatchKw: 856, materialPendingKw: 238, installationCompleteKw: 699, installationPendingKw: 395, meterInstalled: 19, meterPending: 145, rmsInstalled: 22, rmsPending: 142, insurancePending: 35, billPending: 216, pay70DoneKw: 856, pay70PendingKw: 238, pay10DoneKw: 0, pay10PendingKw: 1094 },
];

export const MONTHLY_INSTALLATION_SERIES = [
  { month: 'Jan', capacityKw: 1240, panelsInstalled: 2296, sitesEnergized: 112 },
  { month: 'Feb', capacityKw: 1580, panelsInstalled: 2925, sitesEnergized: 145 },
  { month: 'Mar', capacityKw: 2150, panelsInstalled: 3980, sitesEnergized: 198 },
  { month: 'Apr', capacityKw: 1890, panelsInstalled: 3500, sitesEnergized: 172 },
  { month: 'May', capacityKw: 2340, panelsInstalled: 4330, sitesEnergized: 210 },
  { month: 'Jun', capacityKw: 2710, panelsInstalled: 5018, sitesEnergized: 244 },
  { month: 'Jul', capacityKw: 1960, panelsInstalled: 3629, sitesEnergized: 178 },
  { month: 'Aug', capacityKw: 2180, panelsInstalled: 4037, sitesEnergized: 196 },
  { month: 'Sep', capacityKw: 1419, panelsInstalled: 2627, sitesEnergized: 113 },
];

export const SOLAR_MATERIALS_DATA: MaterialItem[] = [
  {
    id: 'MAT-001',
    name: 'Solar PV Modules (540Wp)',
    category: 'Solar Panels',
    specification: 'Mono PERC Half-Cut 144 Cells, IP68 Junction',
    required: 42580,
    supplied: 38400,
    installed: 32350,
    inTransit: 2400,
    pending: 1780,
    unit: 'Nos.',
    status: 'Adequate',
    statusTone: 'success',
  },
  {
    id: 'MAT-002',
    name: 'On-Grid String Inverter (10kW)',
    category: 'Inverter',
    specification: '3-Phase Dual MPPT, 98.6% Efficiency, WiFi/RS485',
    required: 1480,
    supplied: 1320,
    installed: 1060,
    inTransit: 110,
    pending: 50,
    unit: 'Units',
    status: 'Adequate',
    statusTone: 'success',
  },
  {
    id: 'MAT-003',
    name: 'Single-Phase Inverter (5kW)',
    category: 'Inverter',
    specification: 'Dual MPPT, Anti-Islanding Protection, LCD Display',
    required: 1820,
    supplied: 1610,
    installed: 1320,
    inTransit: 140,
    pending: 70,
    unit: 'Units',
    status: 'Adequate',
    statusTone: 'success',
  },
  {
    id: 'MAT-004',
    name: 'Module Mounting Structure (MMS)',
    category: 'Mounting Structure',
    specification: 'Hot-Dip Galvanized Iron (80 Microns), 150 km/h wind rated',
    required: 2444,
    supplied: 2310,
    installed: 1940,
    inTransit: 80,
    pending: 54,
    unit: 'Sets',
    status: 'Adequate',
    statusTone: 'success',
  },
  {
    id: 'MAT-005',
    name: 'Bi-Directional Net Meter',
    category: 'Metering',
    specification: '3-Phase 4-Wire DLMS/COSEM compliant, Class 1.0 (JPDCL approved)',
    required: 2444,
    supplied: 1200,
    installed: 604,
    inTransit: 350,
    pending: 890,
    unit: 'Nos.',
    status: 'In Transit',
    statusTone: 'warning',
  },
  {
    id: 'MAT-006',
    name: 'Remote Monitoring System (RMS) Gateway',
    category: 'RMS / Telemetry',
    specification: '4G IoT Smart Dongle with MQTT / MNRE portal sync',
    required: 2444,
    supplied: 1450,
    installed: 820,
    inTransit: 280,
    pending: 714,
    unit: 'Units',
    status: 'In Transit',
    statusTone: 'warning',
  },
  {
    id: 'MAT-007',
    name: 'Solar DC Cable 4.0 sq.mm',
    category: 'Cables',
    specification: 'EN 50618 XLPO Insulated, Halogen Free, UV Resistant',
    required: 185000,
    supplied: 172000,
    installed: 148500,
    inTransit: 8000,
    pending: 5000,
    unit: 'Mtrs',
    status: 'Adequate',
    statusTone: 'success',
  },
  {
    id: 'MAT-008',
    name: 'AC Distribution Box (ACDB) with SPD',
    category: 'Junction Box',
    specification: 'IP65 Weatherproof Enclosure with Type II SPD & MCB',
    required: 2444,
    supplied: 2190,
    installed: 1780,
    inTransit: 160,
    pending: 94,
    unit: 'Boxes',
    status: 'Adequate',
    statusTone: 'success',
  },
  {
    id: 'MAT-009',
    name: 'Chemical Earthing Kit & Electrodes',
    category: 'Safety & Protection',
    specification: 'Copper Bonded Rods (17.2mm x 3m) + 25kg BFC Compound',
    required: 4888,
    supplied: 4320,
    installed: 3640,
    inTransit: 320,
    pending: 248,
    unit: 'Sets',
    status: 'Adequate',
    statusTone: 'success',
  },
  {
    id: 'MAT-010',
    name: 'Lightning Arrester (ESE Type)',
    category: 'Safety & Protection',
    specification: 'Early Streamer Emission, 60m Protection Radius, SS304',
    required: 640,
    supplied: 540,
    installed: 430,
    inTransit: 50,
    pending: 50,
    unit: 'Units',
    status: 'Surplus',
    statusTone: 'info',
  },
];

export const RECENT_SOLAR_PROJECTS: RecentProject[] = [
  {
    id: 'JAM-SOL-001',
    name: 'Jammu Solar Village Cluster Phase-1',
    consumer: 'Madan Lal Sharma & 14 Neighbours',
    district: 'Jammu',
    capacityKw: 75,
    progress: 98,
    status: 'RMS Active',
    statusTone: 'accent',
    phase: 'Phase 1',
    targetDate: '15 Sep 2026',
    leadEngineer: 'Er. Rajesh Tickoo',
  },
  {
    id: 'JAM-SOL-002',
    name: 'Kathua Govt Degree College Rooftop',
    consumer: 'Principal Higher Education, Kathua',
    district: 'Kathua',
    capacityKw: 150,
    progress: 88,
    status: 'Installed',
    statusTone: 'success',
    phase: 'Phase 2',
    targetDate: '28 Sep 2026',
    leadEngineer: 'Er. Sunita Verma',
  },
  {
    id: 'JAM-SOL-003',
    name: 'Samba Industrial Complex Feeder 4',
    consumer: 'JK Cement Ltd Warehouse #2',
    district: 'Samba',
    capacityKw: 250,
    progress: 74,
    status: 'Meter Pending',
    statusTone: 'warning',
    phase: 'Phase 3',
    targetDate: '05 Oct 2026',
    leadEngineer: 'Er. Tariq Lone',
  },
  {
    id: 'JAM-SOL-004',
    name: 'Udhampur Sub-District Hospital',
    consumer: 'Chief Medical Officer Udhampur',
    district: 'Udhampur',
    capacityKw: 100,
    progress: 62,
    status: 'In Progress',
    statusTone: 'info',
    phase: 'Phase 4',
    targetDate: '12 Oct 2026',
    leadEngineer: 'Er. Anil Bhat',
  },
  {
    id: 'JAM-SOL-005',
    name: 'Gandhi Nagar Grid Rooftop Array',
    consumer: 'J&K Secretariat Staff Colony',
    district: 'Jammu',
    capacityKw: 80,
    progress: 100,
    status: 'Installed',
    statusTone: 'success',
    phase: 'Phase 1',
    targetDate: '02 Sep 2026',
    leadEngineer: 'Er. Rajesh Tickoo',
  },
  {
    id: 'JAM-SOL-006',
    name: 'Rajouri Border Tehsil Panchayat',
    consumer: 'Rural Development Dept Rajouri',
    district: 'Rajouri',
    capacityKw: 45,
    progress: 40,
    status: 'In Progress',
    statusTone: 'info',
    phase: 'Phase 6',
    targetDate: '20 Oct 2026',
    leadEngineer: 'Er. Vikram Choudhary',
  },
  {
    id: 'JAM-SOL-007',
    name: 'Bari Brahmana Export Facility',
    consumer: 'Himalayan Cold Storage Ltd',
    district: 'Samba',
    capacityKw: 120,
    progress: 84,
    status: 'Meter Pending',
    statusTone: 'warning',
    phase: 'Phase 5',
    targetDate: '18 Oct 2026',
    leadEngineer: 'Er. Sunita Verma',
  },
  {
    id: 'JAM-SOL-008',
    name: 'Doda Hill Town Water Pump Station',
    consumer: 'Jal Shakti Department Doda',
    district: 'Doda',
    capacityKw: 60,
    progress: 25,
    status: 'Feasible',
    statusTone: 'neutral',
    phase: 'Phase 8',
    targetDate: '30 Oct 2026',
    leadEngineer: 'Er. Anil Bhat',
  },
];

export const RECENT_OPERATIONS_ACTIVITY: OperationActivity[] = [
  {
    id: 'ACT-101',
    time: '10:45 AM',
    date: 'Today',
    title: 'Net Meter Synchronized & Tested',
    description: 'JPDCL certified 150 kW bi-directional net meter at Kathua Govt College (JAM-SOL-002).',
    district: 'Kathua',
    tone: 'success',
    icon: 'meter',
  },
  {
    id: 'ACT-102',
    time: '09:15 AM',
    date: 'Today',
    title: 'Material Consignment Dispatched',
    description: '1,200 panels (540Wp) and 18 MMS structures left Bari Brahmana warehouse for Rajouri cluster.',
    district: 'Jammu',
    tone: 'info',
    icon: 'truck',
  },
  {
    id: 'ACT-103',
    time: '04:30 PM',
    date: 'Yesterday',
    title: '70% Subsidy Tranche Approved',
    description: 'JAKEDA sanctioned ₹4.82 Cr tranche for 312 completed sites across Phase 3 and Phase 5.',
    district: 'Jammu HQ',
    tone: 'accent',
    icon: 'cash',
  },
  {
    id: 'ACT-104',
    time: '02:10 PM',
    date: 'Yesterday',
    title: 'RMS Gateway Online (MNRE Telemetry)',
    description: '14 IoT gateways began transmitting real-time generation data to the National Solar Portal.',
    district: 'Samba',
    tone: 'success',
    icon: 'wifi',
  },
  {
    id: 'ACT-105',
    time: '11:20 AM',
    date: '20 Sep',
    title: 'Joint Field Inspection Completed',
    description: 'Site engineer Er. Anil Bhat cleared electrical layout & safety earthing for Udhampur Hospital site.',
    district: 'Udhampur',
    tone: 'warning',
    icon: 'check',
  },
];

export const WORKFORCE_STATS = {
  totalFieldPersonnel: 284,
  chiefEngineers: 6,
  siteEngineers: 42,
  qualitySupervisors: 28,
  certifiedTechnicians: 168,
  activeInstallationGangs: 38,
  jpdclLiaisonOfficers: 12,
};
