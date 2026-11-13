import { lazy, type ReactElement } from 'react';
import { Route, Navigate } from 'react-router-dom';
import { guarded, type PageComponent } from './routeHelpers';

// ═══════════════════════════════════════════════════════════════════════════
// V-PORTAL: DASHBOARD
// ═══════════════════════════════════════════════════════════════════════════
const VPortalDashboard = lazy(() => import('../components/V-Portal/VPortalDashboard'));

// ═══════════════════════════════════════════════════════════════════════════
// V-PORTAL: COMMON MODULES (Reports, Complaints, Users)
// ═══════════════════════════════════════════════════════════════════════════
const VendorDailyReport = lazy(() => import('../components/V-Portal/reports/DailyReport'));
const VendorAddReport = lazy(() => import('../components/V-Portal/reports/AddReport'));
const VendorViewReport = lazy(() => import('../components/V-Portal/reports/ViewReport'));

const VendorComplaintDashboard = lazy(() => import('../components/V-Portal/complaints/VendorComplaintDashboard'));
const VendorAddComplaint = lazy(() => import('../components/V-Portal/complaints/AddComplaint'));
const VendorViewComplaint = lazy(() => import('../components/V-Portal/complaints/ViewComplaint'));

const VendorUsersDashboard = lazy(() => import('../components/V-Portal/users/UsersDashboard'));
const VendorAddUser = lazy(() => import('../components/V-Portal/users/AddUser'));
const VendorViewUsers = lazy(() => import('../components/V-Portal/users/ViewUsers'));

// ═══════════════════════════════════════════════════════════════════════════
// V-PORTAL: ASSAM
// ═══════════════════════════════════════════════════════════════════════════
const AssamDashboard = lazy(() => import('../components/V-Portal/assam/Installation/Swp/AssamDashboard'));
const AssamInstallation = lazy(() => import('../components/V-Portal/assam/Installation/Swp/Installation'));
const AssamInstallationRequest = lazy(() => import('../components/V-Portal/assam/Installation/Swp/InstallationRequest'));
const AssamInstallationSite = lazy(() => import('../components/V-Portal/assam/Installation/Swp/InstallationSite'));
const AssamViewInstallation = lazy(() => import('../components/V-Portal/assam/Installation/Swp/ViewInstallation'));
const AssamViewPayment = lazy(() => import('../components/V-Portal/assam/Installation/Swp/ViewPayment'));
const AssamStatusView = lazy(() => import('../components/V-Portal/assam/Installation/Swp/StatusView'));

// ═══════════════════════════════════════════════════════════════════════════
// V-PORTAL: UTTAR PRADESH
// ═══════════════════════════════════════════════════════════════════════════
// Survey
const UPSurveySRTAdd = lazy(() => import('../components/V-Portal/up/Survey/SRT/AddSurvey'));
const UPSurveySRTView = lazy(() => import('../components/V-Portal/up/Survey/SRT/ViewSurvey'));
const UPSurveyRescoAssignedSurvey = lazy(() => import('../components/V-Portal/up/Survey/Resco/AssignedSurvey'));
const UPSurveyRescoAddResco = lazy(() => import('../components/V-Portal/up/Survey/Resco/AddResco'));
const UPSurveyRescoViewResco = lazy(() => import('../components/V-Portal/up/Survey/Resco/ViewResco'));
const UPSurveySSLSurvey = lazy(() => import('../components/V-Portal/up/Survey/SSL/Survey'));
const UPSurveySSLViewData = lazy(() => import('../components/V-Portal/up/Survey/SSL/ViewData'));

// Installation
const UPInstRescoDb = lazy(() => import('../components/V-Portal/up/Installation/Resco/Dashboard'));
const UPInstRescoAssigned = lazy(() => import('../components/V-Portal/up/Installation/Resco/AssignedSites'));
const UPInstRescoInstall = lazy(() => import('../components/V-Portal/up/Installation/Resco/InstallSite'));
const UPInstRescoDetail = lazy(() => import('../components/V-Portal/up/Installation/Resco/InstallationDetail'));
const UPInstRescoClaim = lazy(() => import('../components/V-Portal/up/Installation/Resco/ClaimRequest'));
const UPInstRescoBill = lazy(() => import('../components/V-Portal/up/Installation/Resco/MonthlyBill'));
const UPInstSSLDb = lazy(() => import('../components/V-Portal/up/Installation/SSL/Dashboard'));
const UPInstSSLAssigned = lazy(() => import('../components/V-Portal/up/Installation/SSL/AssignedLights'));
const UPInstSSLInstall = lazy(() => import('../components/V-Portal/up/Installation/SSL/InstallLight'));
const UPInstSSLDetail = lazy(() => import('../components/V-Portal/up/Installation/SSL/InstallationDetail'));
const UPInstSSLClaim = lazy(() => import('../components/V-Portal/up/Installation/SSL/ClaimRequest'));
const UPInstSSLStatusView = lazy(() => import('../components/V-Portal/up/Installation/SSL/StatusView'));
const UPInstKCDb = lazy(() => import('../components/V-Portal/up/Installation/KusumC/Dashboard'));
const UPInstKCReq = lazy(() => import('../components/V-Portal/up/Installation/KusumC/InstallationRequest'));
const UPInstKCInstall = lazy(() => import('../components/V-Portal/up/Installation/KusumC/InstallSite'));
const UPInstKCView = lazy(() => import('../components/V-Portal/up/Installation/KusumC/ViewInstallation'));
const UPInstKCPay = lazy(() => import('../components/V-Portal/up/Installation/KusumC/ViewPayment'));

// AMC
const UPAMCRescoViewAssign = lazy(() => import('../components/V-Portal/up/AMC/Resco/ViewAssignSite'));
const UPAMCRescoPending = lazy(() => import('../components/V-Portal/up/AMC/Resco/PendingAMC'));
const UPAMCRescoCompleted = lazy(() => import('../components/V-Portal/up/AMC/Resco/CompletedAMC'));
const UPAMCRescoPay = lazy(() => import('../components/V-Portal/up/AMC/Resco/Payment'));
const UPAMCKCViewAssign = lazy(() => import('../components/V-Portal/up/AMC/KusumC/ViewAssignAMC'));
const UPAMCKCPending = lazy(() => import('../components/V-Portal/up/AMC/KusumC/PendingAMC'));
const UPAMCKCCompleted = lazy(() => import('../components/V-Portal/up/AMC/KusumC/CompletedAMC'));
const UPAMCKBViewAssign = lazy(() => import('../components/V-Portal/up/AMC/KusumB/ViewAssignAMC'));
const UPAMCKBPending = lazy(() => import('../components/V-Portal/up/AMC/KusumB/PendingAMC'));
const UPAMCKBCompleted = lazy(() => import('../components/V-Portal/up/AMC/KusumB/CompletedAMC'));
const UPAMCPPViewAssign = lazy(() => import('../components/V-Portal/up/AMC/PowerPack/ViewAssignAMC'));
const UPAMCPPPending = lazy(() => import('../components/V-Portal/up/AMC/PowerPack/PendingAMC'));
const UPAMCPPCompleted = lazy(() => import('../components/V-Portal/up/AMC/PowerPack/CompletedAMC'));
const UPAMCOngridViewAssign = lazy(() => import('../components/V-Portal/up/AMC/Ongrid/ViewAssignAMC'));
const UPAMCOngridPending = lazy(() => import('../components/V-Portal/up/AMC/Ongrid/PendingAMC'));
const UPAMCOngridCompleted = lazy(() => import('../components/V-Portal/up/AMC/Ongrid/CompletedAMC'));
const UPAMCOffgridViewAssign = lazy(() => import('../components/V-Portal/up/AMC/Offgrid/ViewAssignAMC'));
const UPAMCOffgridPending = lazy(() => import('../components/V-Portal/up/AMC/Offgrid/PendingAMC'));
const UPAMCOffgridCompleted = lazy(() => import('../components/V-Portal/up/AMC/Offgrid/CompletedAMC'));
const UPAMCSSLViewAssign = lazy(() => import('../components/V-Portal/up/AMC/SSL/ViewAssignLight'));
const UPAMCSSLPending = lazy(() => import('../components/V-Portal/up/AMC/SSL/PendingAMC'));
const UPAMCSSLCompleted = lazy(() => import('../components/V-Portal/up/AMC/SSL/CompletedAMC'));
const UPAMCSSLPay = lazy(() => import('../components/V-Portal/up/AMC/SSL/Payment'));
const UPAMCSSL18WViewAssign = lazy(() => import('../components/V-Portal/up/AMC/SSL18W/ViewAssignLight'));
const UPAMCSSL18WPending = lazy(() => import('../components/V-Portal/up/AMC/SSL18W/PendingAMC'));
const UPAMCSSL18WCompleted = lazy(() => import('../components/V-Portal/up/AMC/SSL18W/CompletedAMC'));
const UPAMCSSL18WPay = lazy(() => import('../components/V-Portal/up/AMC/SSL18W/Payment'));

// Complaint
const UPComplaintRescoAdd = lazy(() => import('../components/V-Portal/up/Complaint/Resco/AddComplaint'));
const UPComplaintRescoView = lazy(() => import('../components/V-Portal/up/Complaint/Resco/ViewComplaint'));
const UPComplaintRescoAssigned = lazy(() => import('../components/V-Portal/up/Complaint/Resco/AssignedComplaint'));
const UPComplaintSSLAdd = lazy(() => import('../components/V-Portal/up/Complaint/SSL/AddComplaint'));
const UPComplaintSSLView = lazy(() => import('../components/V-Portal/up/Complaint/SSL/ViewComplaint'));
const UPComplaintSSLAssigned = lazy(() => import('../components/V-Portal/up/Complaint/SSL/AssignedComplaint'));
const UPComplaintKCAdd = lazy(() => import('../components/V-Portal/up/Complaint/KusumC/AddComplaint'));
const UPComplaintKCView = lazy(() => import('../components/V-Portal/up/Complaint/KusumC/ViewComplaint'));
const UPComplaintKCAssigned = lazy(() => import('../components/V-Portal/up/Complaint/KusumC/AssignedComplaint'));
const UPComplaintKBAdd = lazy(() => import('../components/V-Portal/up/Complaint/KusumB/AddComplaint'));
const UPComplaintKBView = lazy(() => import('../components/V-Portal/up/Complaint/KusumB/ViewComplaint'));
const UPComplaintKBAssigned = lazy(() => import('../components/V-Portal/up/Complaint/KusumB/AssignedComplaint'));
const UPComplaintOngridAdd = lazy(() => import('../components/V-Portal/up/Complaint/Ongrid/AddComplaint'));
const UPComplaintOngridView = lazy(() => import('../components/V-Portal/up/Complaint/Ongrid/ViewComplaint'));
const UPComplaintOngridAssigned = lazy(() => import('../components/V-Portal/up/Complaint/Ongrid/AssignedComplaint'));
const UPComplaintOffgridAdd = lazy(() => import('../components/V-Portal/up/Complaint/Offgrid/AddComplaint'));
const UPComplaintOffgridView = lazy(() => import('../components/V-Portal/up/Complaint/Offgrid/ViewComplaint'));
const UPComplaintOffgridAssigned = lazy(() => import('../components/V-Portal/up/Complaint/Offgrid/AssignedComplaint'));
const UPComplaintPPAdd = lazy(() => import('../components/V-Portal/up/Complaint/PowerPack/AddComplaint'));
const UPComplaintPPView = lazy(() => import('../components/V-Portal/up/Complaint/PowerPack/ViewComplaint'));
const UPComplaintPPAssigned = lazy(() => import('../components/V-Portal/up/Complaint/PowerPack/AssignedComplaint'));
const UPComplaintSRLMAdd = lazy(() => import('../components/V-Portal/up/Complaint/SRLMSRT/AddComplaint'));
const UPComplaintSRLMView = lazy(() => import('../components/V-Portal/up/Complaint/SRLMSRT/ViewComplaint'));
const UPComplaintSRLMAssigned = lazy(() => import('../components/V-Portal/up/Complaint/SRLMSRT/AssignedComplaint'));

// ═══════════════════════════════════════════════════════════════════════════
// V-PORTAL: JAMMU
// ═══════════════════════════════════════════════════════════════════════════
const JammuDashboard = lazy(() => import('../components/V-Portal/jammu/Installation/SRT_70MW/JammuDashboard'));
const JammuAddSRT70MWSingleCard = lazy(() => import('../components/V-Portal/jammu/Survey/SRT_70MW/AddJammuSRT70MWSingleCard'));
const JMSurveyRescoAssign = lazy(() => import('../components/V-Portal/jammu/Survey/Resco/Assign_Survey'));
const JMSurveyRescoPending = lazy(() => import('../components/V-Portal/jammu/Survey/Resco/Pending_Survey'));
const JMSurveyRescoView = lazy(() => import('../components/V-Portal/jammu/Survey/Resco/View_Survey'));
const JMSurveySRTView = lazy(() => import('../components/V-Portal/jammu/Survey/SRT_70MW/ViewData'));

const JMInstRescoDb = lazy(() => import('../components/V-Portal/jammu/Installation/Resco/RescoDashboard'));
const JMInstRescoAssigned = lazy(() => import('../components/V-Portal/jammu/Installation/Resco/RescoAssignedSites'));
const JMInstRescoInstall = lazy(() => import('../components/V-Portal/jammu/Installation/Resco/RescoInstallSite'));
const JMInstRescoDetail = lazy(() => import('../components/V-Portal/jammu/Installation/Resco/RescoInstallationDetails'));
const JMInstRescoClaim = lazy(() => import('../components/V-Portal/jammu/Installation/Resco/RescoClaimRequest'));
const JMInstRescoStatusView = lazy(() => import('../components/V-Portal/jammu/Installation/Resco/RescoStatusView'));

const JMInstSRTAssign = lazy(() => import('../components/V-Portal/jammu/Installation/SRT_70MW/AssignSite'));
const JMInstSRTInstall = lazy(() => import('../components/V-Portal/jammu/Installation/SRT_70MW/InstallSites'));
const JMInstSRTDetail = lazy(() => import('../components/V-Portal/jammu/Installation/SRT_70MW/InstallationDetails'));
const JMInstSRTClaim = lazy(() => import('../components/V-Portal/jammu/Installation/SRT_70MW/ClaimRequest'));
const JMInstSRTStatusView = lazy(() => import('../components/V-Portal/jammu/Installation/SRT_70MW/StatusView'));

const JMInstSSLDb = lazy(() => import('../components/V-Portal/jammu/Installation/SSL/SSLDashboard'));
const JMInstSSLAssign = lazy(() => import('../components/V-Portal/jammu/Installation/SSL/AssignLights'));
const JMInstSSLInstall = lazy(() => import('../components/V-Portal/jammu/Installation/SSL/InstallLights'));
const JMInstSSLDetail = lazy(() => import('../components/V-Portal/jammu/Installation/SSL/SSLInstallationDetails'));
const JMInstSSLClaim = lazy(() => import('../components/V-Portal/jammu/Installation/SSL/SSLClaimRequest'));
const JMInstSSLStatusView = lazy(() => import('../components/V-Portal/jammu/Installation/SSL/SSLStatusView'));

const JMInstSWPDb = lazy(() => import('../components/V-Portal/jammu/Installation/SWP/SWPDashboard'));
const JMInstSWPReq = lazy(() => import('../components/V-Portal/jammu/Installation/SWP/SWPInstallationRequest'));
const JMInstSWPSite = lazy(() => import('../components/V-Portal/jammu/Installation/SWP/SWPInstallationSite'));
const JMInstSWPView = lazy(() => import('../components/V-Portal/jammu/Installation/SWP/SWPViewInstallation'));
const JMInstSWPPay = lazy(() => import('../components/V-Portal/jammu/Installation/SWP/SWPViewPayment'));
const JMInstSWPStatusView = lazy(() => import('../components/V-Portal/jammu/Installation/SWP/SWPStatusView'));

const JMExpRequest = lazy(() => import('../components/V-Portal/jammu/InstallationExpenses/SRT_70MW/RequestExpenses'));
const JMExpView = lazy(() => import('../components/V-Portal/jammu/InstallationExpenses/SRT_70MW/ViewExpenses'));
const JMExpPay = lazy(() => import('../components/V-Portal/jammu/InstallationExpenses/SRT_70MW/ViewPayments'));

const JMAMCRescoAssign = lazy(() => import('../components/V-Portal/jammu/AMC/Resco/AMCRescoAssignSurvey'));
const JMAMCRescoPending = lazy(() => import('../components/V-Portal/jammu/AMC/Resco/AMCRescoPendingSurvey'));
const JMAMCRescoView = lazy(() => import('../components/V-Portal/jammu/AMC/Resco/AMCRescoViewSurvey'));
const JMAMCSSLViewAssign = lazy(() => import('../components/V-Portal/jammu/AMC/SSL/ViewAssignAMC'));

// ═══════════════════════════════════════════════════════════════════════════
// V-PORTAL: BIHAR
// ═══════════════════════════════════════════════════════════════════════════
// Survey
const BiharSurveySRT200MWAdd = lazy(() => import('../components/V-Portal/bihar/Survey/SRT200MW/AddData'));
const BiharSurveySRT200MWView = lazy(() => import('../components/V-Portal/bihar/Survey/SRT200MW/ViewData'));
const BiharSurveyULAAdd = lazy(() => import('../components/V-Portal/bihar/Survey/ULA/AddData'));
const BiharSurveyULAView = lazy(() => import('../components/V-Portal/bihar/Survey/ULA/ViewData'));

// Installation
const BiharInstSSLDb = lazy(() => import('../components/V-Portal/bihar/Installation/SSL/Dashboard'));
const BiharInstSSLAssign = lazy(() => import('../components/V-Portal/bihar/Installation/SSL/AssignedLights'));
const BiharInstSSLInstall = lazy(() => import('../components/V-Portal/bihar/Installation/SSL/InstallLight'));
const BiharInstSSLDetail = lazy(() => import('../components/V-Portal/bihar/Installation/SSL/InstallationDetail'));
const BiharInstSSLClaim = lazy(() => import('../components/V-Portal/bihar/Installation/SSL/ClaimRequest'));
const BiharInstSSLSupplyInspect = lazy(() => import('../components/V-Portal/bihar/Installation/SSL/SupplyInspection'));
const BiharInstSSLInstallInspect = lazy(() => import('../components/V-Portal/bihar/Installation/SSL/InstallationInspection'));

const BiharInstSRTDb = lazy(() => import('../components/V-Portal/bihar/Installation/SRT/Dashboard'));
const BiharInstSRTRequest = lazy(() => import('../components/V-Portal/bihar/Installation/SRT/RequestAccept'));
const BiharInstSRTDetails = lazy(() => import('../components/V-Portal/bihar/Installation/SRT/InstallationDetails'));
const BiharInstSRTView = lazy(() => import('../components/V-Portal/bihar/Installation/SRT/ViewInstallation'));
const BiharInstSRTClaim = lazy(() => import('../components/V-Portal/bihar/Installation/SRT/ClaimRequest'));

const BiharInstULADb = lazy(() => import('../components/V-Portal/bihar/Installation/ULA/Dashboard'));
const BiharInstULARequest = lazy(() => import('../components/V-Portal/bihar/Installation/ULA/RequestAccept'));
const BiharInstULAAssignDetail = lazy(() => import('../components/V-Portal/bihar/Installation/ULA/AssignSiteDetail'));
const BiharInstULADetails = lazy(() => import('../components/V-Portal/bihar/Installation/ULA/InstallationDetails'));
const BiharInstULAView = lazy(() => import('../components/V-Portal/bihar/Installation/ULA/ViewInstallation'));
const BiharInstULAAddPay = lazy(() => import('../components/V-Portal/bihar/Installation/ULA/AddPayment'));
const BiharInstULAPay = lazy(() => import('../components/V-Portal/bihar/Installation/ULA/Payment'));
const Bihar_Installation_ULA_PendingInstallation = lazy(() => import('../components/V-Portal/bihar/Installation/ULA/PenidngInstallation'));

// AMC
const BiharAMCSSLAdd = lazy(() => import('../components/V-Portal/bihar/AMC/SSL/AddData'));
const BiharAMCSSLView = lazy(() => import('../components/V-Portal/bihar/AMC/SSL/ViewData'));
const BiharAMCSSLComplaint = lazy(() => import('../components/V-Portal/bihar/AMC/SSL/ComplaintRaised'));
const BiharAMCSRTAdd = lazy(() => import('../components/V-Portal/bihar/AMC/SRT/AddData'));
const BiharAMCSRTView = lazy(() => import('../components/V-Portal/bihar/AMC/SRT/ViewData'));
const BiharAMCSRTComplaint = lazy(() => import('../components/V-Portal/bihar/AMC/SRT/ComplaintRaised'));

// Complaints
const BiharComplaintSSLAdd = lazy(() => import('../components/V-Portal/bihar/Complaints/SSL/AddComplaint'));
const BiharComplaintSSLView = lazy(() => import('../components/V-Portal/bihar/Complaints/SSL/ViewComplaint'));
const BiharComplaintSSLAssign = lazy(() => import('../components/V-Portal/bihar/Complaints/SSL/AssignedComplaint'));
const BiharComplaintSRTAdd = lazy(() => import('../components/V-Portal/bihar/Complaints/SRT/AddComplaint'));
const BiharComplaintSRTView = lazy(() => import('../components/V-Portal/bihar/Complaints/SRT/ViewComplaint'));
const BiharComplaintSRTAssign = lazy(() => import('../components/V-Portal/bihar/Complaints/SRT/AssignedComplaint'));

// ═══════════════════════════════════════════════════════════════════════════
// V-PORTAL: PUNJAB & ARUNACHAL
// ═══════════════════════════════════════════════════════════════════════════
const PunjabInstSSLDb = lazy(() => import('../components/V-Portal/punjab/Installation/SSL/Dashboard'));
const PunjabInstSSLAssign = lazy(() => import('../components/V-Portal/punjab/Installation/SSL/AssignedLights'));
const PunjabInstSSLInstall = lazy(() => import('../components/V-Portal/punjab/Installation/SSL/InstallLight'));
const PunjabInstSSLDetail = lazy(() => import('../components/V-Portal/punjab/Installation/SSL/InstallationDetail'));
const PunjabInstSSLStatusView = lazy(() => import('../components/V-Portal/punjab/Installation/SSL/StatusView'));

const ArunachalInstSHLDb = lazy(() => import('../components/V-Portal/arunachal/Installation/SHL/Dashboard'));
const ArunachalInstSHLAssign = lazy(() => import('../components/V-Portal/arunachal/Installation/SHL/AssignedLights'));
const ArunachalInstSHLInstall = lazy(() => import('../components/V-Portal/arunachal/Installation/SHL/InstallLight'));
const ArunachalInstSHLDetail = lazy(() => import('../components/V-Portal/arunachal/Installation/SHL/InstallationDetail'));
const ArunachalInstSHLStatusView = lazy(() => import('../components/V-Portal/arunachal/Installation/SHL/StatusView'));

// ═══════════════════════════════════════════════════════════════════════════
// V-PORTAL: GOA
// ═══════════════════════════════════════════════════════════════════════════
const GoaInstSRTDb = lazy(() => import('../components/V-Portal/goa/Installation/SRT/Dashboard'));
const GoaInstSRTRequest = lazy(() => import('../components/V-Portal/goa/Installation/SRT/RequestAccept'));
const GoaInstSRTDetails = lazy(() => import('../components/V-Portal/goa/Installation/SRT/InstallationDetails'));
const GoaInstSRTView = lazy(() => import('../components/V-Portal/goa/Installation/SRT/ViewInstallation'));
const GoaInstSRTClaim = lazy(() => import('../components/V-Portal/goa/Installation/SRT/ClaimRequest'));
const GoaInstSRTStatusView = lazy(() => import('../components/V-Portal/goa/Installation/SRT/StatusView'));
const GoaSurveySRTAdd = lazy(() => import('../components/V-Portal/goa/Survey/SRT/AddData'));
const GoaSurveySRTView = lazy(() => import('../components/V-Portal/goa/Survey/SRT/ViewData'));
const GoaAmcSRTAdd = lazy(() => import('../components/V-Portal/goa/AMC/SRT/AddData'));
const GoaAmcSRTView = lazy(() => import('../components/V-Portal/goa/AMC/SRT/ViewData'));
const GoaAmcSRTComplaint = lazy(() => import('../components/V-Portal/goa/AMC/SRT/ComplaintRaised'));

// ═══════════════════════════════════════════════════════════════════════════
// V-PORTAL: KARNATAKA
// ═══════════════════════════════════════════════════════════════════════════
const KarnatakaDashboard = lazy(() => import('../components/V-Portal/karnataka/Installation/Swp/KarnatakaDashboard'));
const KarnatakaInstallation = lazy(() => import('../components/V-Portal/karnataka/Installation/Swp/Installation'));
const KarnatakaInstallationRequest = lazy(() => import('../components/V-Portal/karnataka/Installation/Swp/InstallationRequest'));
const KarnatakaInstallationSite = lazy(() => import('../components/V-Portal/karnataka/Installation/Swp/InstallationSite'));
const KarnatakaViewInstallation = lazy(() => import('../components/V-Portal/karnataka/Installation/Swp/ViewInstallation'));
const KarnatakaAddPayment = lazy(() => import('../components/V-Portal/karnataka/Installation/Swp/AddPayment'));
const KarnatakaViewPayment = lazy(() => import('../components/V-Portal/karnataka/Installation/Swp/ViewPayment'));
const KarnatakaMaterialDetails = lazy(() => import('../components/V-Portal/karnataka/Installation/Swp/MaterialDetails'));
const KarnatakaStatusView = lazy(() => import('../components/V-Portal/karnataka/Installation/Swp/StatusView'));

// ═══════════════════════════════════════════════════════════════════════════
// V-PORTAL: KASHMIR
// ═══════════════════════════════════════════════════════════════════════════
const KashmirSurveySRT70MWAdd = lazy(() => import('../components/V-Portal/kashmir/Survey/SRT_70MW/AddData'));
const KashmirSurveySRT70MWView = lazy(() => import('../components/V-Portal/kashmir/Survey/SRT_70MW/ViewData'));
const KashmirInstSRT70MWDb = lazy(() => import('../components/V-Portal/kashmir/Installation/SRT_70MW/Dashboard'));
const KashmirInstSRT70MWStatus = lazy(() => import('../components/V-Portal/kashmir/Installation/SRT_70MW/StatusView'));
const KashmirInstSRT70MWAssign = lazy(() => import('../components/V-Portal/kashmir/Installation/SRT_70MW/AssignSite'));
const KashmirInstSRT70MWInstall = lazy(() => import('../components/V-Portal/kashmir/Installation/SRT_70MW/InstallSites'));
const KashmirInstSRT70MWDetail = lazy(() => import('../components/V-Portal/kashmir/Installation/SRT_70MW/InstallationDetails'));
const KashmirInstSRT70MWClaim = lazy(() => import('../components/V-Portal/kashmir/Installation/SRT_70MW/ClaimRequest'));
const KashmirExpensesRequest = lazy(() => import('../components/V-Portal/kashmir/InstallationExpenses/SRT_70MW/RequestExpenses'));
const KashmirExpensesView = lazy(() => import('../components/V-Portal/kashmir/InstallationExpenses/SRT_70MW/ViewExpenses'));
const KashmirExpensesPayment = lazy(() => import('../components/V-Portal/kashmir/InstallationExpenses/SRT_70MW/ViewPayments'));

// ═══════════════════════════════════════════════════════════════════════════
// V-PORTAL ROUTE MAP
// ═══════════════════════════════════════════════════════════════════════════
export const vPortalRoutesMap: Record<string, PageComponent> = {
  // ─────────────────────────────────────────────────────────────────────────
  // Dashboards
  // ─────────────────────────────────────────────────────────────────────────
  'v-dashboard': VPortalDashboard,
  'v-portal': VPortalDashboard,
  'vendor/dashboard': VPortalDashboard,

  // ─────────────────────────────────────────────────────────────────────────
  // Common Modules: Reports
  // ─────────────────────────────────────────────────────────────────────────
  'v/reports': VendorDailyReport,
  'v/reports/daily-report': VendorDailyReport,
  'v/reports/add-report': VendorAddReport,
  'v/reports/view-report': VendorViewReport,
  'v/vendor-daily-view-progress': VendorDailyReport,
  'v/vendor-add-progress': VendorAddReport,
  'v/vendor-view-progress': VendorViewReport,

  // ─────────────────────────────────────────────────────────────────────────
  // Common Modules: Complaints
  // ─────────────────────────────────────────────────────────────────────────
  'v/complaints': VendorComplaintDashboard,
  'v/complaints/vendor-complaint': VendorComplaintDashboard,
  'v/complaints/add-complaint': VendorAddComplaint,
  'v/complaints/view-complaint': VendorViewComplaint,

  // ─────────────────────────────────────────────────────────────────────────
  // Common Modules: Users
  // ─────────────────────────────────────────────────────────────────────────
  'v/users': VendorUsersDashboard,
  'v/users/overview': VendorUsersDashboard,
  'v/users/add-user': VendorAddUser,
  'v/users/view-users': VendorViewUsers,
  'v/vendor-add-user': VendorAddUser,
  'v/vendor-view-user': VendorViewUsers,

  // ─────────────────────────────────────────────────────────────────────────
  // Assam
  // ─────────────────────────────────────────────────────────────────────────
  'v/assam/installation/swp/dashboard': AssamDashboard,
  'v/assam/installation/swp/request': AssamInstallationRequest,
  'v/assam/installation/swp/site': AssamInstallationSite,
  'v/assam/installation/swp/view': AssamViewInstallation,
  'v/assam/installation/swp/payment': AssamViewPayment,
  'v/assam/installation/swp/status-view': AssamStatusView,
  'v/assam/installation/swp/status': AssamStatusView,
  'assam': AssamDashboard,
  'assam/dashboard': AssamDashboard,
  'assam/installation': AssamInstallation,
  'assam/swp': AssamDashboard,
  'assam/swp/dashboard': AssamDashboard,
  'assam/swp/installation-request': AssamInstallationRequest,
  'assam/installation-request': AssamInstallationRequest,
  'assam/swp/installation-site': AssamInstallationSite,
  'assam/installation-site': AssamInstallationSite,
  'assam/swp/add-installation': AssamInstallationSite,
  'assam/add-installation': AssamInstallationSite,
  'assam/swp/view-installation': AssamViewInstallation,
  'assam/view-installation': AssamViewInstallation,
  'assam/swp/view-payment': AssamViewPayment,
  'assam/view-payment': AssamViewPayment,
  'assam/swp/status-view': AssamStatusView,
  'assam/status-view': AssamStatusView,

  // ─────────────────────────────────────────────────────────────────────────
  // Uttar Pradesh: Survey
  // ─────────────────────────────────────────────────────────────────────────
  'v/up/srt-surveys/create': UPSurveySRTAdd,
  'v/up/srt-surveys/view': UPSurveySRTView,
  'up/srt-surveys/create': UPSurveySRTAdd,
  'up/srt-surveys/view': UPSurveySRTView,
  'v/up/view-assigned-resco-survey': UPSurveyRescoAssignedSurvey,
  'v/up/resco-survey': UPSurveyRescoAddResco,
  'v/up/view-resco-survey': UPSurveyRescoViewResco,
  'up/view-assigned-resco-survey': UPSurveyRescoAssignedSurvey,
  'up/resco-survey': UPSurveyRescoAddResco,
  'up/view-resco-survey': UPSurveyRescoViewResco,
  'up/survey/resco/assigned-survey': UPSurveyRescoAssignedSurvey,
  'up/survey/resco/add-resco': UPSurveyRescoAddResco,
  'up/survey/resco/view-resco': UPSurveyRescoViewResco,
  'v/edit-ssl': UPSurveySSLSurvey,
  'v/view-upssl': UPSurveySSLViewData,
  'edit-ssl': UPSurveySSLSurvey,
  'view-upssl': UPSurveySSLViewData,
  'up/survey/ssl/survey': UPSurveySSLSurvey,
  'up/survey/ssl/view-data': UPSurveySSLViewData,

  // ─────────────────────────────────────────────────────────────────────────
  // Uttar Pradesh: Installation
  // ─────────────────────────────────────────────────────────────────────────
  'v/up/resco-installation-dashboard': UPInstRescoDb,
  'v/up/resco-view-assign-installation-sites': UPInstRescoAssigned,
  'v/up/resco-install-site': UPInstRescoInstall,
  'v/up/resco-view-install-site': UPInstRescoDetail,
  'v/up/resco-installation-claim': UPInstRescoClaim,
  'v/up/resco-view-install': UPInstRescoBill,
  'up/resco-installation-dashboard': UPInstRescoDb,
  'up/resco-view-assign-installation-sites': UPInstRescoAssigned,
  'up/resco-install-site': UPInstRescoInstall,
  'up/resco-view-install-site': UPInstRescoDetail,
  'up/resco-installation-claim': UPInstRescoClaim,
  'up/resco-view-install': UPInstRescoBill,
  'up/installation/resco/dashboard': UPInstRescoDb,
  'up/installation/resco/assigned-sites': UPInstRescoAssigned,
  'up/installation/resco/install-site': UPInstRescoInstall,
  'up/installation/resco/installation-detail': UPInstRescoDetail,
  'up/installation/resco/claim-request': UPInstRescoClaim,
  'up/installation/resco/monthly-bill': UPInstRescoBill,
  'v/up/ssl-18w-installation-dashboard': UPInstSSLDb,
  'v/up/ssl-18w-installation-dashboard-status': UPInstSSLStatusView,
  'v/up/ssl-installation-status-view': UPInstSSLStatusView,
  'v/up/view-18w-assign-installation-sites': UPInstSSLAssigned,
  'v/up/ssl-install-18w-light': UPInstSSLInstall,
  'v/up/ssl-view-installed-18w-light': UPInstSSLDetail,
  'v/up/ssl-view-installation-18w-claim': UPInstSSLClaim,
  'up/ssl-18w-installation-dashboard': UPInstSSLDb,
  'up/ssl-18w-installation-dashboard-status': UPInstSSLStatusView,
  'up/ssl-installation-status-view': UPInstSSLStatusView,
  'up/view-18w-assign-installation-sites': UPInstSSLAssigned,
  'up/ssl-install-18w-light': UPInstSSLInstall,
  'up/ssl-view-installed-18w-light': UPInstSSLDetail,
  'up/ssl-view-installation-18w-claim': UPInstSSLClaim,
  'up/installation/ssl/dashboard': UPInstSSLDb,
  'up/installation/ssl/status-view': UPInstSSLStatusView,
  'up/installation/ssl/assigned-lights': UPInstSSLAssigned,
  'up/installation/ssl/install-light': UPInstSSLInstall,
  'up/installation/ssl/installation-detail': UPInstSSLDetail,
  'up/installation/ssl/claim-request': UPInstSSLClaim,
  'v/up/kusum-c-installation-dashboard': UPInstKCDb,
  'v/up/view-kusum-c-assign-installation-sites': UPInstKCReq,
  'v/up/install-kusum-c-site': UPInstKCInstall,
  'v/up/view-kusum-c-install-site': UPInstKCView,
  'v/up/kusum-c-installation-claim': UPInstKCPay,
  'up/kusum-c-installation-dashboard': UPInstKCDb,
  'up/view-kusum-c-assign-installation-sites': UPInstKCReq,
  'up/install-kusum-c-site': UPInstKCInstall,
  'up/view-kusum-c-install-site': UPInstKCView,
  'up/kusum-c-installation-claim': UPInstKCPay,
  'up/installation/kusum-c/dashboard': UPInstKCDb,
  'up/installation/kusum-c/installation-request': UPInstKCReq,
  'up/installation/kusum-c/install-site': UPInstKCInstall,
  'up/installation/kusum-c/view-installation': UPInstKCView,
  'up/installation/kusum-c/view-payment': UPInstKCPay,

  // ─────────────────────────────────────────────────────────────────────────
  // Uttar Pradesh: AMC
  // ─────────────────────────────────────────────────────────────────────────
  'v/up-resco-amc-view-assign-site': UPAMCRescoViewAssign,
  'v/up-resco-amc-create-site': UPAMCRescoPending,
  'v/up-resco-amc-view-site': UPAMCRescoCompleted,
  'v/up-resco-amc-claim-site': UPAMCRescoPay,
  'up-resco-amc-view-assign-site': UPAMCRescoViewAssign,
  'up-resco-amc-create-site': UPAMCRescoPending,
  'up-resco-amc-view-site': UPAMCRescoCompleted,
  'up-resco-amc-claim-site': UPAMCRescoPay,
  'up/amc/resco/view-assign-site': UPAMCRescoViewAssign,
  'up/amc/resco/pending-amc': UPAMCRescoPending,
  'up/amc/resco/completed-amc': UPAMCRescoCompleted,
  'up/amc/resco/payment': UPAMCRescoPay,
  'v/up/kusumc/amc/fetch-view-assign-site': UPAMCKCViewAssign,
  'v/up/kusumc/amc/assign-site': UPAMCKCPending,
  'v/up/kusumc/amc/completed-details': UPAMCKCCompleted,
  'up/kusumc/amc/fetch-view-assign-site': UPAMCKCViewAssign,
  'up/kusumc/amc/assign-site': UPAMCKCPending,
  'up/kusumc/amc/completed-details': UPAMCKCCompleted,
  'up/amc/kusum-c/view-assign-amc': UPAMCKCViewAssign,
  'up/amc/kusum-c/pending-amc': UPAMCKCPending,
  'up/amc/kusum-c/completed-amc': UPAMCKCCompleted,
  'v/up/kusumb/amc/amc/fetch-view-assign-site': UPAMCKBViewAssign,
  'v/up/kusumb/amc/assign-site': UPAMCKBPending,
  'v/up/kusumb/amc/completed-details': UPAMCKBCompleted,
  'up/kusumb/amc/amc/fetch-view-assign-site': UPAMCKBViewAssign,
  'up/kusumb/amc/assign-site': UPAMCKBPending,
  'up/kusumb/amc/completed-details': UPAMCKBCompleted,
  'up/amc/kusum-b/view-assign-amc': UPAMCKBViewAssign,
  'up/amc/kusum-b/pending-amc': UPAMCKBPending,
  'up/amc/kusum-b/completed-amc': UPAMCKBCompleted,
  'v/up/powerpack/amc/amc/fetch-view-assign-site': UPAMCPPViewAssign,
  'v/up/powerpack/amc/assign-site': UPAMCPPPending,
  'v/up/powerpack/amc/completed-details': UPAMCPPCompleted,
  'up/powerpack/amc/amc/fetch-view-assign-site': UPAMCPPViewAssign,
  'up/powerpack/amc/assign-site': UPAMCPPPending,
  'up/powerpack/amc/completed-details': UPAMCPPCompleted,
  'up/amc/powerpack/view-assign-amc': UPAMCPPViewAssign,
  'up/amc/powerpack/pending-amc': UPAMCPPPending,
  'up/amc/powerpack/completed-amc': UPAMCPPCompleted,
  'v/up/ongrid/amc/amc/fetch-view-assign-site': UPAMCOngridViewAssign,
  'v/up/ongrid/amc/assign-site': UPAMCOngridPending,
  'v/up/ongrid/amc/completed-details': UPAMCOngridCompleted,
  'up/ongrid/amc/amc/fetch-view-assign-site': UPAMCOngridViewAssign,
  'up/ongrid/amc/assign-site': UPAMCOngridPending,
  'up/ongrid/amc/completed-details': UPAMCOngridCompleted,
  'up/amc/ongrid/view-assign-amc': UPAMCOngridViewAssign,
  'up/amc/ongrid/pending-amc': UPAMCOngridPending,
  'up/amc/ongrid/completed-amc': UPAMCOngridCompleted,
  'v/up/offgrid/amc/amc/fetch-view-assign-site': UPAMCOffgridViewAssign,
  'v/up/offgrid/amc/assign-site': UPAMCOffgridPending,
  'v/up/offgrid/amc/completed-details': UPAMCOffgridCompleted,
  'up/offgrid/amc/amc/fetch-view-assign-site': UPAMCOffgridViewAssign,
  'up/offgrid/amc/assign-site': UPAMCOffgridPending,
  'up/offgrid/amc/completed-details': UPAMCOffgridCompleted,
  'up/amc/offgrid/view-assign-amc': UPAMCOffgridViewAssign,
  'up/amc/offgrid/pending-amc': UPAMCOffgridPending,
  'up/amc/offgrid/completed-amc': UPAMCOffgridCompleted,
  'v/up/ssl/amc/amc/fetch-view-assign-site': UPAMCSSLViewAssign,
  'v/up/ssl/amc/assign-site': UPAMCSSLPending,
  'v/up/ssl/amc/completed-details': UPAMCSSLCompleted,
  'v/up/ssl/amc/view-payment': UPAMCSSLPay,
  'up/ssl/amc/amc/fetch-view-assign-site': UPAMCSSLViewAssign,
  'up/ssl/amc/assign-site': UPAMCSSLPending,
  'up/ssl/amc/completed-details': UPAMCSSLCompleted,
  'up/ssl/amc/view-payment': UPAMCSSLPay,
  'up/amc/ssl/view-assign-light': UPAMCSSLViewAssign,
  'up/amc/ssl/pending-amc': UPAMCSSLPending,
  'up/amc/ssl/completed-amc': UPAMCSSLCompleted,
  'up/amc/ssl/payment': UPAMCSSLPay,
  'v/up/ssl18w/amc/amc/fetch-view-assign-site': UPAMCSSL18WViewAssign,
  'v/up/ssl18w/amc/assign-site': UPAMCSSL18WPending,
  'v/up/ssl18w/amc/completed-details': UPAMCSSL18WCompleted,
  'v/up/ssl18w/amc/view-payment': UPAMCSSL18WPay,
  'up/ssl18w/amc/amc/fetch-view-assign-site': UPAMCSSL18WViewAssign,
  'up/ssl18w/amc/assign-site': UPAMCSSL18WPending,
  'up/ssl18w/amc/completed-details': UPAMCSSL18WCompleted,
  'up/ssl18w/amc/view-payment': UPAMCSSL18WPay,
  'up/amc/ssl-18w/view-assign-light': UPAMCSSL18WViewAssign,
  'up/amc/ssl-18w/pending-amc': UPAMCSSL18WPending,
  'up/amc/ssl-18w/completed-amc': UPAMCSSL18WCompleted,
  'up/amc/ssl-18w/payment': UPAMCSSL18WPay,
  'v/up-ssl-amc-view-assign-light': UPAMCSSLViewAssign,
  'v/up-ssl-amc-create-light': UPAMCSSLPending,
  'v/up-ssl-amc-view-light': UPAMCSSLCompleted,
  'v/up-ssl-amc-claim-light': UPAMCSSLPay,
  'v/up-ssl18w-amc-view-assign-light': UPAMCSSL18WViewAssign,
  'v/up-ssl18w-amc-create-light': UPAMCSSL18WPending,
  'v/up-ssl18w-amc-view-light': UPAMCSSL18WCompleted,
  'v/up-ssl18w-amc-claim-light': UPAMCSSL18WPay,
  'up-ssl-amc-view-assign-light': UPAMCSSLViewAssign,
  'up-ssl-amc-create-light': UPAMCSSLPending,
  'up-ssl-amc-view-light': UPAMCSSLCompleted,
  'up-ssl-amc-claim-light': UPAMCSSLPay,
  'up-ssl18w-amc-view-assign-light': UPAMCSSL18WViewAssign,
  'up-ssl18w-amc-create-light': UPAMCSSL18WPending,
  'up-ssl18w-amc-view-light': UPAMCSSL18WCompleted,
  'up-ssl18w-amc-claim-light': UPAMCSSL18WPay,

  // ─────────────────────────────────────────────────────────────────────────
  // Uttar Pradesh: Complaints
  // ─────────────────────────────────────────────────────────────────────────
  'v/up-complaint-resco-create': UPComplaintRescoAdd,
  'v/up-complaint-resco-view': UPComplaintRescoView,
  'v/up-complaint-resco-assigned': UPComplaintRescoAssigned,
  'up-complaint-resco-create': UPComplaintRescoAdd,
  'up-complaint-resco-view': UPComplaintRescoView,
  'up-complaint-resco-assigned': UPComplaintRescoAssigned,
  'v/up-complaint-ssl-create': UPComplaintSSLAdd,
  'v/up-complaint-ssl-view': UPComplaintSSLView,
  'v/up-complaint-ssl-assigned': UPComplaintSSLAssigned,
  'up-complaint-ssl-create': UPComplaintSSLAdd,
  'up-complaint-ssl-view': UPComplaintSSLView,
  'up-complaint-ssl-assigned': UPComplaintSSLAssigned,
  'v/up-complaint-kusumc-create': UPComplaintKCAdd,
  'v/up-complaint-kusumc-view': UPComplaintKCView,
  'v/up-complaint-kusumc-assigned': UPComplaintKCAssigned,
  'up-complaint-kusumc-create': UPComplaintKCAdd,
  'up-complaint-kusumc-view': UPComplaintKCView,
  'up-complaint-kusumc-assigned': UPComplaintKCAssigned,
  'v/up-complaint-kusumb-create': UPComplaintKBAdd,
  'v/up-complaint-kusumb-view': UPComplaintKBView,
  'v/up-complaint-kusumb-assigned': UPComplaintKBAssigned,
  'up-complaint-kusumb-create': UPComplaintKBAdd,
  'up-complaint-kusumb-view': UPComplaintKBView,
  'up-complaint-kusumb-assigned': UPComplaintKBAssigned,
  'v/up-complaint-ongrid-create': UPComplaintOngridAdd,
  'v/up-complaint-ongrid-view': UPComplaintOngridView,
  'v/up-complaint-ongrid-assigned': UPComplaintOngridAssigned,
  'up-complaint-ongrid-create': UPComplaintOngridAdd,
  'up-complaint-ongrid-view': UPComplaintOngridView,
  'up-complaint-ongrid-assigned': UPComplaintOngridAssigned,
  'v/up-complaint-offgrid-create': UPComplaintOffgridAdd,
  'v/up-complaint-offgrid-view': UPComplaintOffgridView,
  'v/up-complaint-offgrid-assigned': UPComplaintOffgridAssigned,
  'up-complaint-offgrid-create': UPComplaintOffgridAdd,
  'up-complaint-offgrid-view': UPComplaintOffgridView,
  'up-complaint-offgrid-assigned': UPComplaintOffgridAssigned,
  'v/up-complaint-powerpack-create': UPComplaintPPAdd,
  'v/up-complaint-powerpack-view': UPComplaintPPView,
  'v/up-complaint-powerpack-assigned': UPComplaintPPAssigned,
  'up-complaint-powerpack-create': UPComplaintPPAdd,
  'up-complaint-powerpack-view': UPComplaintPPView,
  'up-complaint-powerpack-assigned': UPComplaintPPAssigned,
  'v/up-complaint-srlmsrt-create': UPComplaintSRLMAdd,
  'v/up-complaint-srlmsrt-view': UPComplaintSRLMView,
  'v/up-complaint-srlmsrt-assigned': UPComplaintSRLMAssigned,
  'up-complaint-srlmsrt-create': UPComplaintSRLMAdd,
  'up-complaint-srlmsrt-view': UPComplaintSRLMView,
  'up-complaint-srlmsrt-assigned': UPComplaintSRLMAssigned,
  'v/complaint/up/resco-add-complaint': UPComplaintRescoAdd,
  'v/complaint/up/resco-view-complaint': UPComplaintRescoView,
  'v/complaint/up/resco-assign-complaint': UPComplaintRescoAssigned,
  'v/complaint/up/ssl-add-complaint': UPComplaintSSLAdd,
  'v/complaint/up/ssl-view-complaint': UPComplaintSSLView,
  'v/complaint/up/ssl-assign-complaint': UPComplaintSSLAssigned,
  'v/complaint/up/swp-add-complaint': UPComplaintKCAdd,
  'v/complaint/up/swp-view-complaint': UPComplaintKCView,
  'v/complaint/up/swp-assign-complaint': UPComplaintKCAssigned,
  'v/complaint/up/kusumb-add-complaint': UPComplaintKBAdd,
  'v/complaint/up/kusumb-view-complaint': UPComplaintKBView,
  'v/complaint/up/kusumb-assign-complaint': UPComplaintKBAssigned,
  'v/complaint/up/ongrid-add-complaint': UPComplaintOngridAdd,
  'v/complaint/up/ongrid-view-complaint': UPComplaintOngridView,
  'v/complaint/up/ongrid-assign-complaint': UPComplaintOngridAssigned,
  'v/complaint/up/offgrid-add-complaint': UPComplaintOffgridAdd,
  'v/complaint/up/offgrid-view-complaint': UPComplaintOffgridView,
  'v/complaint/up/offgrid-assign-complaint': UPComplaintOffgridAssigned,
  'v/complaint/up/powerpack/add-complaint': UPComplaintPPAdd,
  'v/complaint/up/powerpack-view-complaint': UPComplaintPPView,
  'v/complaint/up/powerpack-assign-complaint': UPComplaintPPAssigned,
  'v/complaint/up/srlmsrt/add-complaint': UPComplaintSRLMAdd,
  'v/complaint/up/srlmsrt/view-complaint': UPComplaintSRLMView,
  'v/complaint/up/srlmsrt/assign-complaint': UPComplaintSRLMAssigned,
  'v/complaint/up/kusumc-add-complaint': UPComplaintKCAdd,
  'v/complaint/up/kusumc-view-complaint': UPComplaintKCView,
  'v/complaint/up/kusumc-assign-complaint': UPComplaintKCAssigned,

  // ─────────────────────────────────────────────────────────────────────────
  // Jammu
  // ─────────────────────────────────────────────────────────────────────────
  'v/jammu/survey/resco/assign': JMSurveyRescoAssign,
  'v/jammu/survey/resco/pending': JMSurveyRescoPending,
  'v/jammu/survey/resco/view': JMSurveyRescoView,
  'jammu/survey/resco/assign': JMSurveyRescoAssign,
  'jammu/survey/resco/pending': JMSurveyRescoPending,
  'jammu/survey/resco/view': JMSurveyRescoView,
  'v/jammu/survey/srt/view': JMSurveySRTView,
  'jammu/survey/srt/view': JMSurveySRTView,
  'v/jammu/survey/srt/add-card': JammuAddSRT70MWSingleCard,
  'jammu/survey/srt/add-card': JammuAddSRT70MWSingleCard,
  'v/jammu/installation/resco/dashboard': JMInstRescoDb,
  'v/jammu/installation/resco/assigned-sites': JMInstRescoAssigned,
  'v/jammu/installation/resco/install-site': JMInstRescoInstall,
  'v/jammu/installation/resco/installation-detail': JMInstRescoDetail,
  'v/jammu/installation/resco/claim-request': JMInstRescoClaim,
  'v/jammu/installation/resco/status-view': JMInstRescoStatusView,
  'jammu/installation/resco/dashboard': JMInstRescoDb,
  'jammu/installation/resco/assigned-sites': JMInstRescoAssigned,
  'jammu/installation/resco/install-site': JMInstRescoInstall,
  'jammu/installation/resco/installation-detail': JMInstRescoDetail,
  'jammu/installation/resco/claim-request': JMInstRescoClaim,
  'jammu/installation/resco/status-view': JMInstRescoStatusView,
  'v/jammu/installation/srt/dashboard': JammuDashboard,
  'jammu/installation/srt/dashboard': JammuDashboard,
  'v/jammu/installation/srt/assign-site': JMInstSRTAssign,
  'v/jammu/installation/srt/install-sites': JMInstSRTInstall,
  'v/jammu/installation/srt/installation-detail': JMInstSRTDetail,
  'v/jammu/installation/srt/claim-request': JMInstSRTClaim,
  'v/jammu/installation/srt/status-view': JMInstSRTStatusView,
  'jammu/installation/srt/assign-site': JMInstSRTAssign,
  'jammu/installation/srt/install-sites': JMInstSRTInstall,
  'jammu/installation/srt/installation-detail': JMInstSRTDetail,
  'jammu/installation/srt/claim-request': JMInstSRTClaim,
  'jammu/installation/srt/status-view': JMInstSRTStatusView,
  'v/jammu/installation/ssl/dashboard': JMInstSSLDb,
  'v/jammu/installation/ssl/assign-lights': JMInstSSLAssign,
  'v/jammu/installation/ssl/install-lights': JMInstSSLInstall,
  'v/jammu/installation/ssl/installation-detail': JMInstSSLDetail,
  'v/jammu/installation/ssl/claim-request': JMInstSSLClaim,
  'v/jammu/installation/ssl/status-view': JMInstSSLStatusView,
  'jammu/installation/ssl/dashboard': JMInstSSLDb,
  'jammu/installation/ssl/assign-lights': JMInstSSLAssign,
  'jammu/installation/ssl/install-lights': JMInstSSLInstall,
  'jammu/installation/ssl/installation-detail': JMInstSSLDetail,
  'jammu/installation/ssl/claim-request': JMInstSSLClaim,
  'jammu/installation/ssl/status-view': JMInstSSLStatusView,
  'v/jammu/installation/swp/dashboard': JMInstSWPDb,
  'v/jammu/installation/swp/request': JMInstSWPReq,
  'v/jammu/installation/swp/site': JMInstSWPSite,
  'v/jammu/installation/swp/view': JMInstSWPView,
  'v/jammu/installation/swp/payment': JMInstSWPPay,
  'v/jammu/installation/swp/status-view': JMInstSWPStatusView,
  'jammu/installation/swp/dashboard': JMInstSWPDb,
  'jammu/installation/swp/request': JMInstSWPReq,
  'jammu/installation/swp/site': JMInstSWPSite,
  'jammu/installation/swp/view': JMInstSWPView,
  'jammu/installation/swp/payment': JMInstSWPPay,
  'jammu/installation/swp/status-view': JMInstSWPStatusView,
  'v/jammu/installation-expenses/srt/request': JMExpRequest,
  'v/jammu/installation-expenses/srt/view': JMExpView,
  'v/jammu/installation-expenses/srt/view-payments': JMExpPay,
  'jammu/installation-expenses/srt/request': JMExpRequest,
  'jammu/installation-expenses/srt/view': JMExpView,
  'jammu/installation-expenses/srt/view-payments': JMExpPay,
  'v/jammu/amc/resco/assign': JMAMCRescoAssign,
  'v/jammu/amc/resco/pending': JMAMCRescoPending,
  'v/jammu/amc/resco/view': JMAMCRescoView,
  'jammu/amc/resco/assign': JMAMCRescoAssign,
  'jammu/amc/resco/pending': JMAMCRescoPending,
  'jammu/amc/resco/view': JMAMCRescoView,
  'v/jammu/amc/ssl/view-assign': JMAMCSSLViewAssign,
  'jammu/amc/ssl/view-assign': JMAMCSSLViewAssign,
  'v/jammu/survey/resco/assign-survey': JMSurveyRescoAssign,
  'v/jammu/survey/resco/pending-survey': JMSurveyRescoPending,
  'v/jammu/survey/resco/view-survey': JMSurveyRescoView,
  'v/jammu/survey/srt-70mw/add-srt': JammuAddSRT70MWSingleCard,
  'v/jammu/survey/srt-70mw/view-data': JMSurveySRTView,
  'v/jammu/installation/resco/installation-details': JMInstRescoDetail,
  'v/jammu/installation/srt-70mw/dashboard': JammuDashboard,
  'v/jammu/installation/srt-70mw/assign-site': JMInstSRTAssign,
  'v/jammu/installation/srt-70mw/install-sites': JMInstSRTInstall,
  'v/jammu/installation/srt-70mw/installation-details': JMInstSRTDetail,
  'v/jammu/installation/srt-70mw/claim-request': JMInstSRTClaim,
  'v/jammu/installation/ssl/installation-details': JMInstSSLDetail,
  'v/jammu/installation/swp/installation-request': JMInstSWPReq,
  'v/jammu/installation/swp/installation-site': JMInstSWPSite,
  'v/jammu/installation/swp/view-installation': JMInstSWPView,
  'v/jammu/installation/swp/view-payment': JMInstSWPPay,
  'v/jammu/installation-expenses/srt-70mw/request-expenses': JMExpRequest,
  'v/jammu/installation-expenses/srt-70mw/view-expenses': JMExpView,
  'v/jammu/installation-expenses/srt-70mw/view-payments': JMExpPay,
  'v/jammu/amc/resco/assign-survey': JMAMCRescoAssign,
  'v/jammu/amc/resco/pending-survey': JMAMCRescoPending,
  'v/jammu/amc/resco/view-survey': JMAMCRescoView,
  'v/jammu/amc/ssl/view-assign-amc': JMAMCSSLViewAssign,
  'v/jammu/installation/srt-70mw/status-view': JMInstSRTStatusView,
  'v/jammu/installation/swp/status': JMInstSWPStatusView,
  'v/jammu-install-swp-site': JMInstSWPSite,

  // ─────────────────────────────────────────────────────────────────────────
  // Bihar: Survey
  // ─────────────────────────────────────────────────────────────────────────
  'v/bihar/survey/srt200mw/add': BiharSurveySRT200MWAdd,
  'v/bihar/survey/srt200mw/view': BiharSurveySRT200MWView,
  'bihar/survey/srt200mw/add': BiharSurveySRT200MWAdd,
  'bihar/survey/srt200mw/view': BiharSurveySRT200MWView,
  'v/bihar/survey/ula/add': BiharSurveyULAAdd,
  'v/bihar/survey/ula/view': BiharSurveyULAView,
  'bihar/survey/ula/add': BiharSurveyULAAdd,
  'bihar/survey/ula/view': BiharSurveyULAView,
  'v/bihar/srt200mw-survey': BiharSurveySRT200MWAdd,
  'v/bihar/view-srt200mw-survey': BiharSurveySRT200MWView,
  'v/bihar/ula-surveys/create': BiharSurveyULAAdd,
  'v/bihar/ula-surveys/view': BiharSurveyULAView,

  // ─────────────────────────────────────────────────────────────────────────
  // Bihar: Installation
  // ─────────────────────────────────────────────────────────────────────────
  'v/bihar/installation/ssl/dashboard': BiharInstSSLDb,
  'v/bihar/installation/ssl/assign-lights': BiharInstSSLAssign,
  'v/bihar/installation/ssl/install-lights': BiharInstSSLInstall,
  'v/bihar/installation/ssl/installation-detail': BiharInstSSLDetail,
  'v/bihar/installation/ssl/claim-request': BiharInstSSLClaim,
  'v/bihar/installation/ssl/supply-inspection': BiharInstSSLSupplyInspect,
  'v/bihar/installation/ssl/installation-inspection': BiharInstSSLInstallInspect,
  'bihar/installation/ssl/dashboard': BiharInstSSLDb,
  'bihar/installation/ssl/assign-lights': BiharInstSSLAssign,
  'bihar/installation/ssl/install-lights': BiharInstSSLInstall,
  'bihar/installation/ssl/installation-detail': BiharInstSSLDetail,
  'bihar/installation/ssl/claim-request': BiharInstSSLClaim,
  'bihar/installation/ssl/supply-inspection': BiharInstSSLSupplyInspect,
  'bihar/installation/ssl/installation-inspection': BiharInstSSLInstallInspect,
  'v/bihar/installation/srt/dashboard': BiharInstSRTDb,
  'v/bihar/installation/srt/request': BiharInstSRTRequest,
  'v/bihar/installation/srt/installation-detail': BiharInstSRTDetails,
  'v/bihar/installation/srt/view-installation': BiharInstSRTView,
  'v/bihar/installation/srt/claim-request': BiharInstSRTClaim,
  'bihar/installation/srt/dashboard': BiharInstSRTDb,
  'bihar/installation/srt/request': BiharInstSRTRequest,
  'bihar/installation/srt/installation-detail': BiharInstSRTDetails,
  'bihar/installation/srt/view-installation': BiharInstSRTView,
  'bihar/installation/srt/claim-request': BiharInstSRTClaim,
  'v/bihar/installation/ula/dashboard': BiharInstULADb,
  'v/bihar/installation/ula/request': BiharInstULARequest,
  'v/bihar/installation/ula/assign-detail': BiharInstULAAssignDetail,
  'v/bihar/installation/ula/installation-detail': BiharInstULADetails,
  'v/bihar/installation/ula/view-installation': BiharInstULAView,
  'v/bihar/installation/ula/add-payment': BiharInstULAAddPay,
  'v/bihar/installation/ula/payment': BiharInstULAPay,
  'v/bihar/installation/ula/pending-installation': Bihar_Installation_ULA_PendingInstallation,
  'bihar/installation/ula/dashboard': BiharInstULADb,
  'bihar/installation/ula/request': BiharInstULARequest,
  'bihar/installation/ula/assign-detail': BiharInstULAAssignDetail,
  'bihar/installation/ula/installation-detail': BiharInstULADetails,
  'bihar/installation/ula/view-installation': BiharInstULAView,
  'bihar/installation/ula/add-payment': BiharInstULAAddPay,
  'bihar/installation/ula/payment': BiharInstULAPay,
  'bihar/installation/ula/pending-installation': Bihar_Installation_ULA_PendingInstallation,
  'v/ssl/installation-dashboard': BiharInstSSLDb,
  'v/ssl/view-assigned-ssl-site': BiharInstSSLAssign,
  'v/ssl/update-ssl-site-deatils': BiharInstSSLInstall,
  'v/ssl/view-ssl-complete-site': BiharInstSSLDetail,
  'v/ssl/view-claim-request-deatils': BiharInstSSLClaim,
  'v/bihar/ssl-light-supply-inspection': BiharInstSSLSupplyInspect,
  'v/bihar/ssl-light-installation-inspection': BiharInstSSLInstallInspect,
  'v/bihar/vendor-srt-installation-dashboard': BiharInstSRTDb,
  'v/srt/viewassignsite': BiharInstSRTRequest,
  'v/srt/installationsite': BiharInstSRTDetails,
  'v/srt/allassignsite': BiharInstSRTView,
  'v/srt/paymentsrtVendor': BiharInstSRTClaim,
  'v/bihar/ula-installation-dashboard': BiharInstULADb,
  'v/bihar/ula-installation-view-assign-site': BiharInstULARequest,
  'v/bihar/ula-installation-pending-structure-site': BiharInstULADetails,
  'v/bihar/ula-installation-view-site': BiharInstULAView,
  'v/bihar/ula-installation-claim': BiharInstULAAddPay,
  'v/bihar/ula-installation-view-payment': BiharInstULAPay,
  'v/bihar/ssl/installation-dashboard': BiharInstSSLDb,
  'v/bihar/ssl/view-assigned-ssl-site': BiharInstSSLAssign,
  'v/bihar/ssl/update-ssl-site-deatils': BiharInstSSLInstall,
  'v/bihar/ssl/view-ssl-complete-site': BiharInstSSLDetail,
  'v/bihar/ssl/view-claim-request-deatils': BiharInstSSLClaim,
  'v/bihar/srt-installation-dashboard': BiharInstSRTDb,
  'v/bihar/srt-installation-view-site': BiharInstSRTView,
  'v/bihar/srt-installation-site': BiharInstSRTDetails,
  'v/bihar/srt-installation-view-assign-site': BiharInstSRTRequest,
  'v/bihar/srt/viewassignsite': BiharInstSRTRequest,
  'v/bihar/srt/installationsite': BiharInstSRTDetails,
  'v/bihar/srt/allassignsite': BiharInstSRTView,
  'v/bihar/srt/paymentsrtVendor': BiharInstSRTClaim,
  'v/bihar/ula-installation-view-assign-site-detail': BiharInstULAAssignDetail,
  'v/bihar/ula-installation-structure-edit-site/:id': BiharInstULADetails,
  'v/bihar/ula-installation-structure-edit-site': BiharInstULADetails,
  'v/bihar/ula-installation-pending-site/:id': BiharInstULADetails,
  'v/bihar/ula-installation-pending-site': BiharInstULADetails,
  'v/bihar-edit-ssl': BiharAMCSSLAdd,
  'bihar-edit-ssl': BiharAMCSSLAdd,
  'v/bihar/edit-ssl': BiharAMCSSLAdd,
  'v/bihar-view-ssl': BiharAMCSSLView,
  'bihar-view-ssl': BiharAMCSSLView,
  'v/bihar/view-ssl': BiharAMCSSLView,
  'bihar/ula-installation-structure-edit-site/:id': BiharInstULADetails,
  'bihar/ula-installation-pending-site/:id': BiharInstULADetails,

  // ─────────────────────────────────────────────────────────────────────────
  // Bihar: AMC
  // ─────────────────────────────────────────────────────────────────────────
  'v/bihar/amc/ssl/add': BiharAMCSSLAdd,
  'v/bihar/amc/ssl/view': BiharAMCSSLView,
  'bihar/amc/ssl/add': BiharAMCSSLAdd,
  'bihar/amc/ssl/view': BiharAMCSSLView,
  'v/bihar/amc/srt/add': BiharAMCSRTAdd,
  'v/bihar/amc/srt/view': BiharAMCSRTView,
  'bihar/amc/srt/add': BiharAMCSRTAdd,
  'bihar/amc/srt/view': BiharAMCSRTView,
  'v/edit-biharssl': BiharAMCSSLAdd,
  'v/view-biharssl': BiharAMCSSLView,
  'v/bihar-add-srt-amc': BiharAMCSRTAdd,
  'v/bihar-view-srt-amc': BiharAMCSRTView,
  'v/edit-bihar-ssl': BiharAMCSSLAdd,
  'edit-bihar-ssl': BiharAMCSSLAdd,
  'v/bihar-add-ssl-amc': BiharAMCSSLAdd,
  'bihar-add-ssl-amc': BiharAMCSSLAdd,
  'v/bihar/add-ssl-amc': BiharAMCSSLAdd,
  'v/bihar/ssl/amc/add': BiharAMCSSLAdd,
  'edit-biharssl': BiharAMCSSLAdd,
  'v/view-bihar-ssl': BiharAMCSSLView,
  'view-bihar-ssl': BiharAMCSSLView,
  'v/bihar-view-ssl-amc': BiharAMCSSLView,
  'bihar-view-ssl-amc': BiharAMCSSLView,
  'v/bihar/view-ssl-amc': BiharAMCSSLView,
  'v/bihar/ssl/amc/view': BiharAMCSSLView,
  'view-biharssl': BiharAMCSSLView,
  'v/bihar/srt/amc/add': BiharAMCSRTAdd,
  'bihar-add-srt-amc': BiharAMCSRTAdd,
  'v/bihar/add-srt-amc': BiharAMCSRTAdd,
  'v/bihar/srt/amc/view': BiharAMCSRTView,
  'bihar-view-srt-amc': BiharAMCSRTView,
  'v/bihar/view-srt-amc': BiharAMCSRTView,

  // ─────────────────────────────────────────────────────────────────────────
  // Bihar: Complaints
  // ─────────────────────────────────────────────────────────────────────────
  'v/bihar/amc/ssl/complaint': BiharAMCSSLComplaint,
  'bihar/amc/ssl/complaint': BiharAMCSSLComplaint,
  'v/bihar/amc/srt/complaint': BiharAMCSRTComplaint,
  'bihar/amc/srt/complaint': BiharAMCSRTComplaint,
  'v/bihar/complaint/ssl/add': BiharComplaintSSLAdd,
  'v/bihar/complaint/ssl/view': BiharComplaintSSLView,
  'v/bihar/complaint/ssl/assigned': BiharComplaintSSLAssign,
  'bihar/complaint/ssl/add': BiharComplaintSSLAdd,
  'bihar/complaint/ssl/view': BiharComplaintSSLView,
  'bihar/complaint/ssl/assigned': BiharComplaintSSLAssign,
  'v/bihar/complaint/srt/add': BiharComplaintSRTAdd,
  'v/bihar/complaint/srt/view': BiharComplaintSRTView,
  'v/bihar/complaint/srt/assigned': BiharComplaintSRTAssign,
  'bihar/complaint/srt/add': BiharComplaintSRTAdd,
  'bihar/complaint/srt/view': BiharComplaintSRTView,
  'bihar/complaint/srt/assigned': BiharComplaintSRTAssign,
  'v/ssl/view-bihar-ssl-complaint': BiharAMCSSLComplaint,
  'v/bihar-view-srt-amc-complaint': BiharAMCSRTComplaint,
  'v/complaint/bihar/ssl-add-complaint': BiharComplaintSSLAdd,
  'v/complaint/bihar/ssl-view-complaint': BiharComplaintSSLView,
  'v/complaint/bihar/ssl-assign-complaint': BiharComplaintSSLAssign,
  'v/complaint/bihar/srt-add-complaint': BiharComplaintSRTAdd,
  'v/complaint/bihar/srt-view-complaint': BiharComplaintSRTView,
  'v/complaint/bihar/srt-assign-complaint': BiharComplaintSRTAssign,
  'v/bihar-view-ssl-complaint': BiharAMCSSLComplaint,
  'bihar-view-ssl-complaint': BiharAMCSSLComplaint,
  'v/view-bihar-ssl-complaint': BiharAMCSSLComplaint,
  'view-bihar-ssl-complaint': BiharAMCSSLComplaint,
  'v/bihar-view-ssl-amc-complaint': BiharAMCSSLComplaint,
  'bihar-view-ssl-amc-complaint': BiharAMCSSLComplaint,
  'v/bihar/ssl/amc/complaint': BiharAMCSSLComplaint,
  'v/bihar/ssl/view-complaint': BiharAMCSSLComplaint,
  'v/bihar/srt/amc/complaint': BiharAMCSRTComplaint,
  'bihar-view-srt-amc-complaint': BiharAMCSRTComplaint,
  'v/bihar/view-srt-amc-complaint': BiharAMCSRTComplaint,

  // ─────────────────────────────────────────────────────────────────────────
  // Punjab
  // ─────────────────────────────────────────────────────────────────────────
  'v/punjab/installation/ssl/dashboard': PunjabInstSSLDb,
  'v/punjab/installation/ssl/assign-lights': PunjabInstSSLAssign,
  'v/punjab/installation/ssl/install-lights': PunjabInstSSLInstall,
  'v/punjab/installation/ssl/installation-detail': PunjabInstSSLDetail,
  'v/punjab/installation/ssl/status-view': PunjabInstSSLStatusView,
  'punjab/installation/ssl/dashboard': PunjabInstSSLDb,
  'punjab/installation/ssl/assign-lights': PunjabInstSSLAssign,
  'punjab/installation/ssl/install-lights': PunjabInstSSLInstall,
  'punjab/installation/ssl/installation-detail': PunjabInstSSLDetail,
  'punjab/installation/ssl/status-view': PunjabInstSSLStatusView,
  'v/punjab/ssl/installation/dashboard': PunjabInstSSLDb,
  'v/punjab/ssl/installation/view-assigned-light': PunjabInstSSLAssign,
  'v/punjab/ssl/installation/update-light-deatils': PunjabInstSSLInstall,
  'v/punjab/ssl/installation/complete-light': PunjabInstSSLDetail,
  'v/punjab/ssl/installation/install-light': PunjabInstSSLInstall,
  'v/punjab/ssl/installation/status-view': PunjabInstSSLStatusView,
  'v/punjab/ssl/installation/dashboard-status': PunjabInstSSLStatusView,
  'v/punjab/ssl/installation/view-dashboard': PunjabInstSSLStatusView,
  'v/punjab/ssl/installation/site': PunjabInstSSLInstall,
  'v/punjab/ssl/installation/view': PunjabInstSSLDetail,

  // ─────────────────────────────────────────────────────────────────────────
  // Arunachal
  // ─────────────────────────────────────────────────────────────────────────
  'v/arunachal/installation/shl/dashboard': ArunachalInstSHLDb,
  'v/arunachal/installation/shl/assign-lights': ArunachalInstSHLAssign,
  'v/arunachal/installation/shl/install-lights': ArunachalInstSHLInstall,
  'v/arunachal/installation/shl/installation-detail': ArunachalInstSHLDetail,
  'v/arunachal/installation/shl/status-view': ArunachalInstSHLStatusView,
  'arunachal/installation/shl/dashboard': ArunachalInstSHLDb,
  'arunachal/installation/shl/assign-lights': ArunachalInstSHLAssign,
  'arunachal/installation/shl/install-lights': ArunachalInstSHLInstall,
  'arunachal/installation/shl/installation-detail': ArunachalInstSHLDetail,
  'arunachal/installation/shl/status-view': ArunachalInstSHLStatusView,
  'v/arunachal/shl/installation/dashboard': ArunachalInstSHLDb,
  'v/arunachal/shl/installation/view-assigned-light': ArunachalInstSHLAssign,
  'v/arunachal/shl/installation/install-light': ArunachalInstSHLInstall,
  'v/arunachal/shl/installation/view-installation': ArunachalInstSHLDetail,
  'v/arunachal/shl/installation/install': ArunachalInstSHLInstall,
  'v/arunachal/shl/installation/update': ArunachalInstSHLInstall,
  'v/arunachal/shl/installation/complete-light': ArunachalInstSHLDetail,
  'v/arunachal/shl/installation/status-view': ArunachalInstSHLStatusView,
  'v/arunachal/shl/installation/dashboard-status': ArunachalInstSHLStatusView,
  'v/arunachal/shl/installation/view-dashboard/:status': ArunachalInstSHLStatusView,
  'v/arunachal/shl/installation/view-dashboard': ArunachalInstSHLStatusView,
  'v/arunachal/shl/installation/districtwise-data/:status/:district': ArunachalInstSHLStatusView,
  'arunachal/shl/installation/view-dashboard/:status': ArunachalInstSHLStatusView,
  'arunachal/shl/installation/districtwise-data/:status/:district': ArunachalInstSHLStatusView,

  // ─────────────────────────────────────────────────────────────────────────
  // Goa
  // ─────────────────────────────────────────────────────────────────────────
  'v/goa/installation/srt/dashboard': GoaInstSRTDb,
  'v/goa/installation/srt/request': GoaInstSRTRequest,
  'v/goa/installation/srt/installation-detail': GoaInstSRTDetails,
  'v/goa/installation/srt/view-installation': GoaInstSRTView,
  'v/goa/installation/srt/claim-request': GoaInstSRTClaim,
  'v/goa/installation/srt/status-view': GoaInstSRTStatusView,
  'goa/installation/srt/dashboard': GoaInstSRTDb,
  'goa/installation/srt/request': GoaInstSRTRequest,
  'goa/installation/srt/installation-detail': GoaInstSRTDetails,
  'goa/installation/srt/view-installation': GoaInstSRTView,
  'goa/installation/srt/claim-request': GoaInstSRTClaim,
  'goa/installation/srt/status-view': GoaInstSRTStatusView,
  'v/goa/survey/srt/add': GoaSurveySRTAdd,
  'v/goa/survey/srt/view': GoaSurveySRTView,
  'goa/survey/srt/add': GoaSurveySRTAdd,
  'goa/survey/srt/view': GoaSurveySRTView,
  'v/goa/amc/srt/add': GoaAmcSRTAdd,
  'v/goa/amc/srt/view': GoaAmcSRTView,
  'v/goa/amc/srt/complaint': GoaAmcSRTComplaint,
  'goa/amc/srt/add': GoaAmcSRTAdd,
  'goa/amc/srt/view': GoaAmcSRTView,
  'goa/amc/srt/complaint': GoaAmcSRTComplaint,
  'v/goa/srt-survey': GoaSurveySRTAdd,
  'v/goa/view-survey': GoaSurveySRTView,
  'v/goa/vendor-srt-installation-dashboard': GoaInstSRTDb,
  'v/goa/srt/viewassignsite': GoaInstSRTRequest,
  'v/goa/srt/installationsite': GoaInstSRTDetails,
  'v/goa/srt/allassignsite': GoaInstSRTView,
  'v/goa/srt/paymentsrtVendor': GoaInstSRTClaim,
  'v/goa-add-srt-amc': GoaAmcSRTAdd,
  'v/goa-view-srt-amc': GoaAmcSRTView,
  'v/goa-view-srt-amc-complaint': GoaAmcSRTComplaint,
  'v/goa/srt/installation/dashboard': GoaInstSRTDb,
  'v/goa/srt-installation-dashboard': GoaInstSRTDb,
  'v/goa/srt/dashboard': GoaInstSRTDb,
  'v/goa': GoaInstSRTDb,
  'v/goa/srt/installation-request': GoaInstSRTRequest,
  'v/goa/srt/view-assign-site': GoaInstSRTRequest,
  'v/goa/srt/view': GoaInstSRTRequest,
  'v/goa/srt/installation/view-assign-site': GoaInstSRTRequest,
  'v/goa/srt/assign-srt': GoaInstSRTRequest,
  'v/goa/srt/installation-details': GoaInstSRTDetails,
  'v/goa/srt/installation-site': GoaInstSRTDetails,
  'v/goa/srt/installation/install-site': GoaInstSRTDetails,
  'v/goa/srt/installation/installationsite': GoaInstSRTDetails,
  'v/goa/srt/view-installation': GoaInstSRTView,
  'v/goa/srt/installation/allassignsite': GoaInstSRTView,
  'v/goa/srt/installation/view-installation': GoaInstSRTView,
  'v/goa/srt/verificationsite': GoaInstSRTView,
  'v/goa/srt/paymentsrtvendor': GoaInstSRTClaim,
  'v/goa/srt/claimsite': GoaInstSRTClaim,
  'v/goa/srt/claim-request': GoaInstSRTClaim,
  'v/goa/srt/assignsrtpayment': GoaInstSRTClaim,
  'v/goa/srt/view-claim': GoaInstSRTClaim,
  'v/goa/srt/installation/claimsite': GoaInstSRTClaim,
  'v/goa/srt/installation/view-payment': GoaInstSRTClaim,
  'v/goa/srt/installation/status-view': GoaInstSRTStatusView,
  'v/goa/srt/status-view': GoaInstSRTStatusView,
  'v/goa/srt/installation/dashboard/view-data/:status': GoaInstSRTStatusView,
  'v/goa/srt/installation/dashboard/districtwise/:status/:district': GoaInstSRTStatusView,
  'v/goa/srt/survey': GoaSurveySRTAdd,
  'v/goa/srt/view-survey': GoaSurveySRTView,
  'goa-add-srt-amc': GoaAmcSRTAdd,
  'v/goa/add-srt-amc': GoaAmcSRTAdd,
  'v/goa/srt/amc/add': GoaAmcSRTAdd,
  'goa-view-srt-amc': GoaAmcSRTView,
  'v/goa/view-srt-amc': GoaAmcSRTView,
  'v/goa/srt/amc/view': GoaAmcSRTView,
  'goa-view-srt-amc-complaint': GoaAmcSRTComplaint,
  'v/goa/view-srt-amc-complaint': GoaAmcSRTComplaint,
  'v/goa/srt/amc/complaint': GoaAmcSRTComplaint,
  'goa/srt/installation/dashboard/view-data/:status': GoaInstSRTStatusView,
  'goa/srt/installation/dashboard/districtwise/:status/:district': GoaInstSRTStatusView,

  // ─────────────────────────────────────────────────────────────────────────
  // Karnataka
  // ─────────────────────────────────────────────────────────────────────────
  'v/karnataka/installation/swp/dashboard': KarnatakaDashboard,
  'v/karnataka/installation/swp/installation': KarnatakaInstallation,
  'v/karnataka/installation/swp/request': KarnatakaInstallationRequest,
  'v/karnataka/installation/swp/site': KarnatakaInstallationSite,
  'v/karnataka/installation/swp/view': KarnatakaViewInstallation,
  'v/karnataka/installation/swp/add-payment': KarnatakaAddPayment,
  'v/karnataka/installation/swp/view-payment': KarnatakaViewPayment,
  'v/karnataka/installation/swp/material-details': KarnatakaMaterialDetails,
  'v/karnataka/installation/swp/status-view': KarnatakaStatusView,
  'karnataka/installation/swp/dashboard': KarnatakaDashboard,
  'karnataka/installation/swp/installation': KarnatakaInstallation,
  'karnataka/installation/swp/request': KarnatakaInstallationRequest,
  'karnataka/installation/swp/site': KarnatakaInstallationSite,
  'karnataka/installation/swp/view': KarnatakaViewInstallation,
  'karnataka/installation/swp/add-payment': KarnatakaAddPayment,
  'karnataka/installation/swp/view-payment': KarnatakaViewPayment,
  'karnataka/installation/swp/material-details': KarnatakaMaterialDetails,
  'karnataka/installation/swp/status-view': KarnatakaStatusView,
  'karnataka/dashboard': KarnatakaDashboard,
  'karnataka/installation': KarnatakaInstallation,
  'karnataka/installation-request': KarnatakaInstallationRequest,
  'karnataka/swp/installation-request': KarnatakaInstallationRequest,
  'karnataka/installation-site': KarnatakaInstallationSite,
  'karnataka/swp/installation-site': KarnatakaInstallationSite,
  'karnataka/swp/add-installation': KarnatakaInstallationSite,
  'karnataka/add-installation': KarnatakaInstallationSite,
  'karnataka/swp/view-installation': KarnatakaViewInstallation,
  'karnataka/view-installation': KarnatakaViewInstallation,
  'karnataka/swp/add-payment': KarnatakaAddPayment,
  'karnataka/add-payment': KarnatakaAddPayment,
  'karnataka/swp/view-payment': KarnatakaViewPayment,
  'karnataka/view-payment': KarnatakaViewPayment,
  'karnataka/swp/material-details': KarnatakaMaterialDetails,
  'karnataka/material-details': KarnatakaMaterialDetails,
  'karnataka/swp/status-view': KarnatakaStatusView,
  'karnataka/status-view': KarnatakaStatusView,
  'v/karnataka/installation/swp/payment': KarnatakaViewPayment,
  'v/karnataka/installation/swp/installation-request': KarnatakaInstallationRequest,
  'v/karnataka/installation/swp/installation-site': KarnatakaInstallationSite,
  'v/karnataka/installation/swp/view-installation': KarnatakaViewInstallation,
  'v/karnataka/installation/swp/status': KarnatakaStatusView,

  // ─────────────────────────────────────────────────────────────────────────
  // Kashmir
  // ─────────────────────────────────────────────────────────────────────────
  'v/kashmir/srt70mw/survey-add': KashmirSurveySRT70MWAdd,
  'kashmir/srt70mw/survey-add': KashmirSurveySRT70MWAdd,
  'v/kashmir/srt70mw/survey-view': KashmirSurveySRT70MWView,
  'kashmir/srt70mw/survey-view': KashmirSurveySRT70MWView,
  'v/kashmir/srt70mw/survey-edit/:id': KashmirSurveySRT70MWAdd,
  'kashmir/srt70mw/survey-edit/:id': KashmirSurveySRT70MWAdd,
  'v/kashmir/srt/70mw/installation/dashboard': KashmirInstSRT70MWDb,
  'kashmir/srt/70mw/installation/dashboard': KashmirInstSRT70MWDb,
  'v/kashmir/srt/70mw/installation/status-view': KashmirInstSRT70MWStatus,
  'kashmir/srt/70mw/installation/status-view': KashmirInstSRT70MWStatus,
  'v/kashmir/srt/70mw-installation-view-dashboard/:status': KashmirInstSRT70MWStatus,
  'kashmir/srt/70mw-installation-view-dashboard/:status': KashmirInstSRT70MWStatus,
  'v/kashmir/srt/70mw-installation-districtwise/:status/:district': KashmirInstSRT70MWStatus,
  'kashmir/srt/70mw-installation-districtwise/:status/:district': KashmirInstSRT70MWStatus,
  'v/kashmir/srt/70mw/installation/assign-site': KashmirInstSRT70MWAssign,
  'kashmir/srt/70mw/installation/assign-site': KashmirInstSRT70MWAssign,
  'v/kashmir/srt/70mw/installation/site': KashmirInstSRT70MWInstall,
  'kashmir/srt/70mw/installation/site': KashmirInstSRT70MWInstall,
  'v/kashmir/srt/70mw/installation/install-site': KashmirInstSRT70MWInstall,
  'kashmir/srt/70mw/installation/install-site': KashmirInstSRT70MWInstall,
  'v/kashmir/srt/70mw/install-site': KashmirInstSRT70MWInstall,
  'kashmir/srt/70mw/install-site': KashmirInstSRT70MWInstall,
  'v/kashmir/srt/70mw/view-install-sites': KashmirInstSRT70MWDetail,
  'kashmir/srt/70mw/view-install-sites': KashmirInstSRT70MWDetail,
  'v/kashmir/srt70mw/view-claim-request': KashmirInstSRT70MWClaim,
  'kashmir/srt70mw/view-claim-request': KashmirInstSRT70MWClaim,
  'v/kashmir/srt70mw/installation-expenses-create': KashmirExpensesRequest,
  'kashmir/srt70mw/installation-expenses-create': KashmirExpensesRequest,
  'v/kashmir/srt70mw/installation-expenses': KashmirExpensesView,
  'kashmir/srt70mw/installation-expenses': KashmirExpensesView,
  'v/kashmir/srt70mw/installation-expenses-view-payment': KashmirExpensesPayment,
  'kashmir/srt70mw/installation-expenses-view-payment': KashmirExpensesPayment,

  // ─────────────────────────────────────────────────────────────────────────
  // Other / Aliases
  // ─────────────────────────────────────────────────────────────────────────
  'v/vendor-add-complaint': VendorAddComplaint,
  'v/vendor-view-complaint': VendorViewComplaint,
  // Missing Aliases
  'jammu/installation/srt-70mw/dashboard': JammuDashboard,
  'jammu/survey/resco/view-survey': JMSurveyRescoView,
  'jammu/installation-expenses/srt-70mw/view-expenses': JMExpView,
  
};

export const vPortalRoutes: ReactElement[] = [
  <Route key="v.root.redirect" path="v" element={<Navigate to="/v-dashboard" replace />} />,
  <Route key="v.root.slash.redirect" path="v/" element={<Navigate to="/v-dashboard" replace />} />,
  <Route key="v.dash.redirect" path="v/dashboard" element={<Navigate to="/v-dashboard" replace />} />,
  ...Object.entries(vPortalRoutesMap).map(([slug, C]) => (
    <Route key={`v.${slug}`} path={slug} element={guarded(slug, C)} />
  )),
];
