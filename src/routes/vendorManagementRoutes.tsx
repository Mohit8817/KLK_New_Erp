import { lazy, type ReactElement } from 'react';
import { Route, Navigate } from 'react-router-dom';
import { wrap } from './routeHelpers';

// ═══════════════════════════════════════════════════════════════════════════
// SUPER ADMIN: VENDOR MANAGEMENT & USER MASTER
// ═══════════════════════════════════════════════════════════════════════════
const VendorManagementDashboard = lazy(() => import('../components/Vendor-Management/VendorManagementDashboard'));
const AdminVendorUsersDashboard = lazy(() => import('../components/Vendor-Management/users/AdminVendorUsersDashboard'));

// ═══════════════════════════════════════════════════════════════════════════
// SUPER ADMIN: ASSAM SWP
// ═══════════════════════════════════════════════════════════════════════════
const AssamSwpDashboard = lazy(() => import('../components/Vendor-Management/assam/Installation/Swp/AssamSwpDashboard'));
const AssignInstallation = lazy(() => import('../components/Vendor-Management/assam/Installation/Swp/AssignInstallation'));
const ViewAssignInstallation = lazy(() => import('../components/Vendor-Management/assam/Installation/Swp/ViewAssignInstallation'));
const VerifyInstallation = lazy(() => import('../components/Vendor-Management/assam/Installation/Swp/VerifyInstallation'));
const VerifyDocument = lazy(() => import('../components/Vendor-Management/assam/Installation/Swp/VerifyDocument'));
const VerifyClaim = lazy(() => import('../components/Vendor-Management/assam/Installation/Swp/VerifyClaim'));
const ViewPayment = lazy(() => import('../components/Vendor-Management/assam/Installation/Swp/ViewPayment'));
const StatusView = lazy(() => import('../components/Vendor-Management/assam/Installation/Swp/StatusView'));

// ═══════════════════════════════════════════════════════════════════════════
// SUPER ADMIN: KARNATAKA SWP (Installation & Material)
// ═══════════════════════════════════════════════════════════════════════════
const KarnatakaAdminSwpDashboard = lazy(() => import('../components/Vendor-Management/karnataka/Installation/Swp/KarnatakaSwpDashboard'));
const KarnatakaAdminAssignInstallation = lazy(() => import('../components/Vendor-Management/karnataka/Installation/Swp/AssignInstallation'));
const KarnatakaAdminViewAssignInstallation = lazy(() => import('../components/Vendor-Management/karnataka/Installation/Swp/ViewAssignInstallation'));
const KarnatakaAdminVerifyInstallation = lazy(() => import('../components/Vendor-Management/karnataka/Installation/Swp/VerifyInstallation'));
const KarnatakaAdminVerifyDocument = lazy(() => import('../components/Vendor-Management/karnataka/Installation/Swp/VerifyDocument'));
const KarnatakaAdminVerifyClaim = lazy(() => import('../components/Vendor-Management/karnataka/Installation/Swp/VerifyClaim'));
const KarnatakaAdminViewPayment = lazy(() => import('../components/Vendor-Management/karnataka/Installation/Swp/ViewPayment'));
const KarnatakaAdminDispatchMaterial = lazy(() => import('../components/Vendor-Management/karnataka/Material/Swp/DispatchMaterial'));
const KarnatakaAdminViewDispatchMaterial = lazy(() => import('../components/Vendor-Management/karnataka/Material/Swp/ViewDispatchMaterial'));
const KarnatakaAdminStatusView = lazy(() => import('../components/Vendor-Management/karnataka/Installation/Swp/StatusView'));

// ═══════════════════════════════════════════════════════════════════════════
// SUPER ADMIN: UTTAR PRADESH
// ═══════════════════════════════════════════════════════════════════════════
// Installation: Kusum C
const UPKusumCDashboard = lazy(() => import('../components/Vendor-Management/up').then(m => ({ default: m.UPKusumCDashboard })));
const UPKusumCAssignInstallation = lazy(() => import('../components/Vendor-Management/up').then(m => ({ default: m.UPKusumCAssignInstallation })));
const UPKusumCViewAssignInstallation = lazy(() => import('../components/Vendor-Management/up').then(m => ({ default: m.UPKusumCViewAssignInstallation })));
const UPKusumCVerifyInstallation = lazy(() => import('../components/Vendor-Management/up').then(m => ({ default: m.UPKusumCVerifyInstallation })));
const UPKusumCVerifyDocument = lazy(() => import('../components/Vendor-Management/up').then(m => ({ default: m.UPKusumCVerifyDocument })));
const UPKusumCVerifyClaim = lazy(() => import('../components/Vendor-Management/up').then(m => ({ default: m.UPKusumCVerifyClaim })));
const UPKusumCViewPayment = lazy(() => import('../components/Vendor-Management/up').then(m => ({ default: m.UPKusumCViewPayment })));

// Installation: Resco
const UPRescoInstallationDashboard = lazy(() => import('../components/Vendor-Management/up').then(m => ({ default: m.UPRescoInstallationDashboard })));
const UPRescoAssignInstallation = lazy(() => import('../components/Vendor-Management/up').then(m => ({ default: m.UPRescoAssignInstallation })));
const UPRescoViewAssignInstallation = lazy(() => import('../components/Vendor-Management/up').then(m => ({ default: m.UPRescoViewAssignInstallation })));
const UPRescoVerifyInstallation = lazy(() => import('../components/Vendor-Management/up').then(m => ({ default: m.UPRescoVerifyInstallation })));
const UPRescoVerifyDocument = lazy(() => import('../components/Vendor-Management/up').then(m => ({ default: m.UPRescoVerifyDocument })));
const UPRescoViewClaim = lazy(() => import('../components/Vendor-Management/up').then(m => ({ default: m.UPRescoViewClaim })));
const UPRescoViewPayment = lazy(() => import('../components/Vendor-Management/up').then(m => ({ default: m.UPRescoViewPayment })));
const UPRescoViewCreatedBills = lazy(() => import('../components/Vendor-Management/up').then(m => ({ default: m.UPRescoViewCreatedBills })));
const UPRescoViewAssignVendorInstallation = lazy(() => import('../components/Vendor-Management/up').then(m => ({ default: m.UPRescoViewAssignVendorInstallation })));

// Installation: SSL 18W
const UPSSL18WInstallationDashboard = lazy(() => import('../components/Vendor-Management/up').then(m => ({ default: m.UPSSL18WInstallationDashboard })));
const UPSSL18WAssignInstallation = lazy(() => import('../components/Vendor-Management/up').then(m => ({ default: m.UPSSL18WAssignInstallation })));
const UPSSL18WViewAssignInstallation = lazy(() => import('../components/Vendor-Management/up').then(m => ({ default: m.UPSSL18WViewAssignInstallation })));
const UPSSL18WVerifyInstallation = lazy(() => import('../components/Vendor-Management/up').then(m => ({ default: m.UPSSL18WVerifyInstallation })));
const UPSSL18WViewClaim = lazy(() => import('../components/Vendor-Management/up').then(m => ({ default: m.UPSSL18WViewClaim })));
const UPSSL18WViewPayment = lazy(() => import('../components/Vendor-Management/up').then(m => ({ default: m.UPSSL18WViewPayment })));

// AMC: Resco
const UPRescoAMCAssignSite = lazy(() => import('../components/Vendor-Management/up').then(m => ({ default: m.UPRescoAMCAssignSite })));
const UPRescoAMCViewAssignSite = lazy(() => import('../components/Vendor-Management/up').then(m => ({ default: m.UPRescoAMCViewAssignSite })));
const UPRescoAMCVerifySite = lazy(() => import('../components/Vendor-Management/up').then(m => ({ default: m.UPRescoAMCVerifySite })));
const UPRescoAMCClaimRequest = lazy(() => import('../components/Vendor-Management/up').then(m => ({ default: m.UPRescoAMCClaimRequest })));
const UPRescoAMCViewPayment = lazy(() => import('../components/Vendor-Management/up').then(m => ({ default: m.UPRescoAMCViewPayment })));

// AMC: Up SSL
const UPSSLAMCAssignLight = lazy(() => import('../components/Vendor-Management/up').then(m => ({ default: m.UPSSLAMCAssignLight })));
const UPSSLAMCViewAssignLight = lazy(() => import('../components/Vendor-Management/up').then(m => ({ default: m.UPSSLAMCViewAssignLight })));
const UPSSLAMCVerifyAssignLight = lazy(() => import('../components/Vendor-Management/up').then(m => ({ default: m.UPSSLAMCVerifyAssignLight })));
const UPSSLAMCClaimRequest = lazy(() => import('../components/Vendor-Management/up').then(m => ({ default: m.UPSSLAMCClaimRequest })));
const UPSSLAMCViewPayment = lazy(() => import('../components/Vendor-Management/up').then(m => ({ default: m.UPSSLAMCViewPayment })));

// AMC: Up SSL 18W
const UPSSL18WAMCAssignLight = lazy(() => import('../components/Vendor-Management/up').then(m => ({ default: m.UPSSL18WAMCAssignLight })));
const UPSSL18WAMCViewAssignLight = lazy(() => import('../components/Vendor-Management/up').then(m => ({ default: m.UPSSL18WAMCViewAssignLight })));
const UPSSL18WAMCVerifyAssignLight = lazy(() => import('../components/Vendor-Management/up').then(m => ({ default: m.UPSSL18WAMCVerifyAssignLight })));
const UPSSL18WAMCClaimRequest = lazy(() => import('../components/Vendor-Management/up').then(m => ({ default: m.UPSSL18WAMCClaimRequest })));
const UPSSL18WAMCViewPayment = lazy(() => import('../components/Vendor-Management/up').then(m => ({ default: m.UPSSL18WAMCViewPayment })));

// AMC: Solar Schemes
const UPKusumBAMCAssignSite = lazy(() => import('../components/Vendor-Management/up').then(m => ({ default: m.UPKusumBAMCAssignSite })));
const UPKusumBAMCViewAssignSite = lazy(() => import('../components/Vendor-Management/up').then(m => ({ default: m.UPKusumBAMCViewAssignSite })));
const UPKusumBAMCVerifySite = lazy(() => import('../components/Vendor-Management/up').then(m => ({ default: m.UPKusumBAMCVerifySite })));

const UPKusumCAMCAssignSite = lazy(() => import('../components/Vendor-Management/up').then(m => ({ default: m.UPKusumCAMCAssignSite })));
const UPKusumCAMCViewAssignSite = lazy(() => import('../components/Vendor-Management/up').then(m => ({ default: m.UPKusumCAMCViewAssignSite })));
const UPKusumCAMCVerifySite = lazy(() => import('../components/Vendor-Management/up').then(m => ({ default: m.UPKusumCAMCVerifySite })));

const UPPowerPackAMCAssignSite = lazy(() => import('../components/Vendor-Management/up').then(m => ({ default: m.UPPowerPackAMCAssignSite })));
const UPPowerPackAMCViewAssignSite = lazy(() => import('../components/Vendor-Management/up').then(m => ({ default: m.UPPowerPackAMCViewAssignSite })));
const UPPowerPackAMCVerifySite = lazy(() => import('../components/Vendor-Management/up').then(m => ({ default: m.UPPowerPackAMCVerifySite })));

const UPOngridAMCAssignSite = lazy(() => import('../components/Vendor-Management/up').then(m => ({ default: m.UPOngridAMCAssignSite })));
const UPOngridAMCViewAssignSite = lazy(() => import('../components/Vendor-Management/up').then(m => ({ default: m.UPOngridAMCViewAssignSite })));
const UPOngridAMCVerifySite = lazy(() => import('../components/Vendor-Management/up').then(m => ({ default: m.UPOngridAMCVerifySite })));

const UPOffgridAMCAssignSite = lazy(() => import('../components/Vendor-Management/up').then(m => ({ default: m.UPOffgridAMCAssignSite })));
const UPOffgridAMCViewAssignSite = lazy(() => import('../components/Vendor-Management/up').then(m => ({ default: m.UPOffgridAMCViewAssignSite })));
const UPOffgridAMCVerifySite = lazy(() => import('../components/Vendor-Management/up').then(m => ({ default: m.UPOffgridAMCVerifySite })));

// Survey: Resco Survey
const UPRescoSurveyDashboard = lazy(() => import('../components/Vendor-Management/up').then(m => ({ default: m.UPRescoSurveyDashboard })));
const UPRescoSurveyAssign = lazy(() => import('../components/Vendor-Management/up').then(m => ({ default: m.UPRescoSurveyAssign })));
const UPRescoSurveyAssignView = lazy(() => import('../components/Vendor-Management/up').then(m => ({ default: m.UPRescoSurveyAssignView })));
const UPRescoSurveyVerify = lazy(() => import('../components/Vendor-Management/up').then(m => ({ default: m.UPRescoSurveyVerify })));
const UPRescoSurveyAssignVendor = lazy(() => import('../components/Vendor-Management/up').then(m => ({ default: m.UPRescoSurveyAssignVendor })));

// ═══════════════════════════════════════════════════════════════════════════
// SUPER ADMIN: BIHAR
// ═══════════════════════════════════════════════════════════════════════════
// Survey
const BiharSRT200MWSurveyDashboard = lazy(() => import('../components/Vendor-Management/bihar').then(m => ({ default: m.BiharSRT200MWSurveyDashboard })));
const BiharSRT200MWSurveyStatusView = lazy(() => import('../components/Vendor-Management/bihar').then(m => ({ default: m.BiharSRT200MWSurveyStatusView })));
const BiharSRT200MWSurveyAssign = lazy(() => import('../components/Vendor-Management/bihar').then(m => ({ default: m.BiharSRT200MWSurveyAssign })));
const BiharSRT200MWSurveyAssignView = lazy(() => import('../components/Vendor-Management/bihar').then(m => ({ default: m.BiharSRT200MWSurveyAssignView })));
const BiharSRT200MWSurveyVerify = lazy(() => import('../components/Vendor-Management/bihar').then(m => ({ default: m.BiharSRT200MWSurveyVerify })));
const BiharULASurveyViewData = lazy(() => import('../components/Vendor-Management/bihar').then(m => ({ default: m.BiharULASurveyViewData })));

// Installation: SSL
const BiharSSLInstallationDashboard = lazy(() => import('../components/Vendor-Management/bihar').then(m => ({ default: m.BiharSSLInstallationDashboard })));
const BiharSSLInstallationAssignLight = lazy(() => import('../components/Vendor-Management/bihar').then(m => ({ default: m.BiharSSLInstallationAssignLight })));
const BiharSSLInstallationViewAssignLight = lazy(() => import('../components/Vendor-Management/bihar').then(m => ({ default: m.BiharSSLInstallationViewAssignLight })));
const BiharSSLInstallationVerifyLight = lazy(() => import('../components/Vendor-Management/bihar').then(m => ({ default: m.BiharSSLInstallationVerifyLight })));
const BiharSSLInstallationClaimRequest = lazy(() => import('../components/Vendor-Management/bihar').then(m => ({ default: m.BiharSSLInstallationClaimRequest })));
const BiharSSLInstallationPaymentRequest = lazy(() => import('../components/Vendor-Management/bihar').then(m => ({ default: m.BiharSSLInstallationPaymentRequest })));
const BiharSSLInstallationSupplyInspection = lazy(() => import('../components/Vendor-Management/bihar').then(m => ({ default: m.BiharSSLInstallationSupplyInspection })));
const BiharSSLInstallationInspectionRequest = lazy(() => import('../components/Vendor-Management/bihar').then(m => ({ default: m.BiharSSLInstallationInspectionRequest })));

// Installation: SRT
const BiharSRTInstallationDashboard = lazy(() => import('../components/Vendor-Management/bihar').then(m => ({ default: m.BiharSRTInstallationDashboard })));
const BiharSRTInstallationAssignSites = lazy(() => import('../components/Vendor-Management/bihar').then(m => ({ default: m.BiharSRTInstallationAssignSites })));
const BiharSRTInstallationViewAssignSites = lazy(() => import('../components/Vendor-Management/bihar').then(m => ({ default: m.BiharSRTInstallationViewAssignSites })));
const BiharSRTInstallationVerifySites = lazy(() => import('../components/Vendor-Management/bihar').then(m => ({ default: m.BiharSRTInstallationVerifySites })));
const BiharSRTInstallationViewClaim = lazy(() => import('../components/Vendor-Management/bihar').then(m => ({ default: m.BiharSRTInstallationViewClaim })));
const BiharSRTInstallationViewPayment = lazy(() => import('../components/Vendor-Management/bihar').then(m => ({ default: m.BiharSRTInstallationViewPayment })));

// Installation: ULA
const BiharVMULAInstallationDashboard = lazy(() => import('../components/Vendor-Management/bihar').then(m => ({ default: m.BiharULAInstallationDashboard })));
const BiharULAInstallationStatusView = lazy(() => import('../components/Vendor-Management/bihar').then(m => ({ default: m.BiharULAInstallationStatusView })));
const BiharULAInstallationAssignSites = lazy(() => import('../components/Vendor-Management/bihar').then(m => ({ default: m.BiharULAInstallationAssignSites })));
const BiharULAInstallationViewAssignSites = lazy(() => import('../components/Vendor-Management/bihar').then(m => ({ default: m.BiharULAInstallationViewAssignSites })));
const BiharULAInstallationStructureApproval = lazy(() => import('../components/Vendor-Management/bihar').then(m => ({ default: m.BiharULAInstallationStructureApproval })));
const BiharULAInstallationViewSite = lazy(() => import('../components/Vendor-Management/bihar').then(m => ({ default: m.BiharULAInstallationViewSite })));
const BiharULAInstallationViewDocument = lazy(() => import('../components/Vendor-Management/bihar').then(m => ({ default: m.BiharULAInstallationViewDocument })));
const BiharULAInstallationViewClaim = lazy(() => import('../components/Vendor-Management/bihar').then(m => ({ default: m.BiharULAInstallationViewClaim })));
const BiharULAInstallationViewPayment = lazy(() => import('../components/Vendor-Management/bihar').then(m => ({ default: m.BiharULAInstallationViewPayment })));

// AMC: SSL
const BiharSSLAMCDashboard = lazy(() => import('../components/Vendor-Management/bihar').then(m => ({ default: m.BiharSSLAMCDashboard })));
const BiharSSLAMCAssignSSL = lazy(() => import('../components/Vendor-Management/bihar').then(m => ({ default: m.BiharSSLAMCAssignSSL })));
const BiharSSLAMCVerrifyAMC = lazy(() => import('../components/Vendor-Management/bihar').then(m => ({ default: m.BiharSSLAMCVerrifyAMC })));
const BiharSSLAMCStatusView = lazy(() => import('../components/Vendor-Management/bihar').then(m => ({ default: m.BiharSSLAMCStatusView })));

// AMC: SRT
const BiharSRTAMCDashboard = lazy(() => import('../components/Vendor-Management/bihar').then(m => ({ default: m.BiharSRTAMCDashboard })));
const BiharSRTAMCAssignSRT = lazy(() => import('../components/Vendor-Management/bihar').then(m => ({ default: m.BiharSRTAMCAssignSRT })));
const BiharSRTAMCAssignViewSite = lazy(() => import('../components/Vendor-Management/bihar').then(m => ({ default: m.BiharSRTAMCAssignViewSite })));
const BiharSRTAMCVerifySite = lazy(() => import('../components/Vendor-Management/bihar').then(m => ({ default: m.BiharSRTAMCVerifySite })));



// ═══════════════════════════════════════════════════════════════════════════
// SUPER ADMIN: KASHMIR
// ═══════════════════════════════════════════════════════════════════════════
// Installation: SRT 70MW
const KashmirSRT70MWInstallationDashboard = lazy(() => import('../components/Vendor-Management/kashmir').then(m => ({ default: m.KashmirSRT70MWInstallationDashboard })));
const KashmirSRT70MWInstallationAssignSites = lazy(() => import('../components/Vendor-Management/kashmir').then(m => ({ default: m.KashmirSRT70MWInstallationAssignSites })));
const KashmirSRT70MWInstallationViewAssignSites = lazy(() => import('../components/Vendor-Management/kashmir').then(m => ({ default: m.KashmirSRT70MWInstallationViewAssignSites })));
const KashmirSRT70MWInstallationVerifySites = lazy(() => import('../components/Vendor-Management/kashmir').then(m => ({ default: m.KashmirSRT70MWInstallationVerifySites })));
const KashmirSRT70MWInstallationViewClaim = lazy(() => import('../components/Vendor-Management/kashmir').then(m => ({ default: m.KashmirSRT70MWInstallationViewClaim })));
const KashmirSRT70MWInstallationViewPayment = lazy(() => import('../components/Vendor-Management/kashmir').then(m => ({ default: m.KashmirSRT70MWInstallationViewPayment })));
const KashmirSRT70MWInstallationStatusView = lazy(() => import('../components/Vendor-Management/kashmir').then(m => ({ default: m.KashmirSRT70MWInstallationStatusView })));

// Expense: SRT 70MW
const KashmirSRT70MWExpenseClaimRequests = lazy(() => import('../components/Vendor-Management/kashmir').then(m => ({ default: m.KashmirSRT70MWExpenseClaimRequests })));
const KashmirSRT70MWExpenseViewPayments = lazy(() => import('../components/Vendor-Management/kashmir').then(m => ({ default: m.KashmirSRT70MWExpenseViewPayments })));

// ═══════════════════════════════════════════════════════════════════════════
// SUPER ADMIN: GOA
// ═══════════════════════════════════════════════════════════════════════════
// Survey
const GoaSRTSurveyDashboard = lazy(() => import('../components/Vendor-Management/goa').then(m => ({ default: m.GoaSRTSurveyDashboard })));
const GoaSRTSurveyAssign = lazy(() => import('../components/Vendor-Management/goa').then(m => ({ default: m.GoaSRTSurveyAssign })));
const GoaSRTSurveyAssignView = lazy(() => import('../components/Vendor-Management/goa').then(m => ({ default: m.GoaSRTSurveyAssignView })));
const GoaSRTSurveyVerify = lazy(() => import('../components/Vendor-Management/goa').then(m => ({ default: m.GoaSRTSurveyVerify })));

// Installation
const GoaSRTInstallationDashboard = lazy(() => import('../components/Vendor-Management/goa').then(m => ({ default: m.GoaSRTInstallationDashboard })));
const GoaSRTInstallationAssignSites = lazy(() => import('../components/Vendor-Management/goa').then(m => ({ default: m.GoaSRTInstallationAssignSites })));
const GoaSRTInstallationViewAssignSites = lazy(() => import('../components/Vendor-Management/goa').then(m => ({ default: m.GoaSRTInstallationViewAssignSites })));
const GoaSRTInstallationVerifySites = lazy(() => import('../components/Vendor-Management/goa').then(m => ({ default: m.GoaSRTInstallationVerifySites })));
const GoaSRTInstallationViewClaim = lazy(() => import('../components/Vendor-Management/goa').then(m => ({ default: m.GoaSRTInstallationViewClaim })));
const GoaSRTInstallationViewPayment = lazy(() => import('../components/Vendor-Management/goa').then(m => ({ default: m.GoaSRTInstallationViewPayment })));

// AMC
const GoaSRTAMCDashboard = lazy(() => import('../components/Vendor-Management/goa').then(m => ({ default: m.GoaSRTAMCDashboard })));
const GoaSRTAMCAssignSRT = lazy(() => import('../components/Vendor-Management/goa').then(m => ({ default: m.GoaSRTAMCAssignSRT })));
const GoaSRTAMCAssignViewSite = lazy(() => import('../components/Vendor-Management/goa').then(m => ({ default: m.GoaSRTAMCAssignViewSite })));
const GoaSRTAMCVerifySite = lazy(() => import('../components/Vendor-Management/goa').then(m => ({ default: m.GoaSRTAMCVerifySite })));



// ═══════════════════════════════════════════════════════════════════════════
// SUPER ADMIN: VENDOR OPERATIONS
// ═══════════════════════════════════════════════════════════════════════════
const VendorAddData = lazy(() => import('../components/Vendor-Management/operations').then(m => ({ default: m.VendorAddData })));
const VendorViewData = lazy(() => import('../components/Vendor-Management/operations').then(m => ({ default: m.VendorViewData })));
const VendorDLEUsersViewData = lazy(() => import('../components/Vendor-Management/operations').then(m => ({ default: m.VendorDLEUsersViewData })));
const VendorWorkOrderAdd = lazy(() => import('../components/Vendor-Management/operations').then(m => ({ default: m.VendorWorkOrderAdd })));
const VendorWorkOrderView = lazy(() => import('../components/Vendor-Management/operations').then(m => ({ default: m.VendorWorkOrderView })));
const VendorWorkOrderAssignAdd = lazy(() => import('../components/Vendor-Management/operations').then(m => ({ default: m.VendorWorkOrderAssignAdd })));
const VendorWorkOrderAssignView = lazy(() => import('../components/Vendor-Management/operations').then(m => ({ default: m.VendorWorkOrderAssignView })));
const VendorReturnMaintenanceView = lazy(() => import('../components/Vendor-Management/operations').then(m => ({ default: m.VendorReturnMaintenanceView })));
const VendorPaymentView = lazy(() => import('../components/Vendor-Management/operations').then(m => ({ default: m.VendorPaymentView })));
const VendorComplaintView = lazy(() => import('../components/Vendor-Management/operations').then(m => ({ default: m.VendorComplaintView })));
const VendorDailyProgressReport = lazy(() => import('../components/Vendor-Management/operations').then(m => ({ default: m.VendorDailyProgressReport })));



// ── SUPER ADMIN: ARUNACHAL SHL ──
const ArunachalShlDashboard = lazy(() => import('../components/Vendor-Management/arunachal/Installation/SHL/ArunachalShlDashboard'));
const ArunachalAssignLights = lazy(() => import('../components/Vendor-Management/arunachal/Installation/SHL/AssignLights'));
const ArunachalViewAssignLights = lazy(() => import('../components/Vendor-Management/arunachal/Installation/SHL/ViewAssignLights'));
const ArunachalVerifyLights = lazy(() => import('../components/Vendor-Management/arunachal/Installation/SHL/VerifyLights'));
const ArunachalShlStatusView = lazy(() => import('../components/Vendor-Management/arunachal/Installation/SHL/StatusView'));

// ── SUPER ADMIN: PUNJAB SSL ──
const PunjabSslDashboard = lazy(() => import('../components/Vendor-Management/punjab/Installation/SSL/PunjabSslDashboard'));
const PunjabAssignLights = lazy(() => import('../components/Vendor-Management/punjab/Installation/SSL/AssignLights'));
const PunjabViewAssignLights = lazy(() => import('../components/Vendor-Management/punjab/Installation/SSL/ViewAssignLights'));
const PunjabVerifyLights = lazy(() => import('../components/Vendor-Management/punjab/Installation/SSL/VerifyLights'));
const PunjabSslStatusView = lazy(() => import('../components/Vendor-Management/punjab/Installation/SSL/StatusView'));
const PunjabInstallLight = lazy(() => import('../components/V-Portal/punjab/Installation/SSL/InstallLight'));



// ── SUPER ADMIN: JAMMU SURVEY ──
const JammuVerifySrt70MWSurvey = lazy(() => import('../components/Vendor-Management/jammu/Survey/SRT_70MW/VerifySrt70MWSurvey'));
const JammuRescoDashboard = lazy(() => import('../components/Vendor-Management/jammu/Survey/Resco/RescoDashboard'));
const JammuAssignRescoSurvey = lazy(() => import('../components/Vendor-Management/jammu/Survey/Resco/AssignRescoSurvey'));
const JammuAssignViewSurvey = lazy(() => import('../components/Vendor-Management/jammu/Survey/Resco/AssignViewSurvey'));
const JammuAssignedSurveyVendor = lazy(() => import('../components/Vendor-Management/jammu/Survey/Resco/AssignedSurveyVendor'));
const JammuVerifySurvey = lazy(() => import('../components/Vendor-Management/jammu/Survey/Resco/VerifySurvey'));

// ── SUPER ADMIN: JAMMU INSTALLATION - SRT ──
const JammuSrtDashboard = lazy(() => import('../components/Vendor-Management/jammu/Installation/SRT_70MW/SrtDashboard'));
const JammuAssignSrtSites = lazy(() => import('../components/Vendor-Management/jammu/Installation/SRT_70MW/AssignSrtSites'));
const JammuViewAssignSrtSites = lazy(() => import('../components/Vendor-Management/jammu/Installation/SRT_70MW/ViewAssignSrtSites'));
const JammuVerifySrtSites = lazy(() => import('../components/Vendor-Management/jammu/Installation/SRT_70MW/VerifySrtSites'));
const JammuViewSrtClaim = lazy(() => import('../components/Vendor-Management/jammu/Installation/SRT_70MW/ViewSrtClaim'));
const JammuViewSrtPayment = lazy(() => import('../components/Vendor-Management/jammu/Installation/SRT_70MW/ViewSrtPayment'));

// ── SUPER ADMIN: JAMMU INSTALLATION - SSL ──
const JammuSslDashboard = lazy(() => import('../components/Vendor-Management/jammu/Installation/SSL/SslDashboard'));
const JammuAssignSslLights = lazy(() => import('../components/Vendor-Management/jammu/Installation/SSL/AssignSslLights'));
const JammuViewAssignSslLights = lazy(() => import('../components/Vendor-Management/jammu/Installation/SSL/ViewAssignSslLights'));
const JammuVerifySslLights = lazy(() => import('../components/Vendor-Management/jammu/Installation/SSL/VerifySslLights'));
const JammuSslClaimRequest = lazy(() => import('../components/Vendor-Management/jammu/Installation/SSL/SslClaimRequest'));
const JammuSslPaymentRequest = lazy(() => import('../components/Vendor-Management/jammu/Installation/SSL/SslPaymentRequest'));

// ── SUPER ADMIN: JAMMU INSTALLATION - SWP ──
const JammuSwpDashboard = lazy(() => import('../components/Vendor-Management/jammu/Installation/SWP/SwpDashboard'));
const JammuAssignSwpInstallation = lazy(() => import('../components/Vendor-Management/jammu/Installation/SWP/AssignSwpInstallation'));
const JammuViewAssignSwpInstallation = lazy(() => import('../components/Vendor-Management/jammu/Installation/SWP/ViewAssignSwpInstallation'));
const JammuVerifySwpInstallation = lazy(() => import('../components/Vendor-Management/jammu/Installation/SWP/VerifySwpInstallation'));
const JammuVerifySwpDocument = lazy(() => import('../components/Vendor-Management/jammu/Installation/SWP/VerifySwpDocument'));
const JammuVerifySwpClaim = lazy(() => import('../components/Vendor-Management/jammu/Installation/SWP/VerifySwpClaim'));
const JammuViewSwpPayment = lazy(() => import('../components/Vendor-Management/jammu/Installation/SWP/ViewSwpPayment'));
const JammuSwpStatusView = lazy(() => import('../components/Vendor-Management/jammu/Installation/SWP/StatusView'));

// ── SUPER ADMIN: JAMMU INSTALLATION - RESCO ──
const JammuRescoInstDashboard = lazy(() => import('../components/Vendor-Management/jammu/Installation/Resco/RescoDashboard'));
const JammuAssignRescoInstallation = lazy(() => import('../components/Vendor-Management/jammu/Installation/Resco/AssignRescoInstallation'));
const JammuViewAssignRescoInstallation = lazy(() => import('../components/Vendor-Management/jammu/Installation/Resco/ViewAssignRescoInstallation'));
const JammuViewAssignVendorInstallation = lazy(() => import('../components/Vendor-Management/jammu/Installation/Resco/ViewAssignVendorInstallation'));
const JammuVerifyRescoInstallation = lazy(() => import('../components/Vendor-Management/jammu/Installation/Resco/VerifyRescoInstallation'));
const JammuVerifyRescoDocument = lazy(() => import('../components/Vendor-Management/jammu/Installation/Resco/VerifyRescoDocument'));
const JammuViewRescoClaim = lazy(() => import('../components/Vendor-Management/jammu/Installation/Resco/ViewRescoClaim'));
const JammuViewRescoPayment = lazy(() => import('../components/Vendor-Management/jammu/Installation/Resco/ViewRescoPayment'));
const JammuViewRescoBills = lazy(() => import('../components/Vendor-Management/jammu/Installation/Resco/ViewRescoBills'));

// ── SUPER ADMIN: JAMMU EXPENSES - SRT ──
const JammuSrtExpenseClaimRequests = lazy(() => import('../components/Vendor-Management/jammu/Expenses/SRT_70MW/SrtExpenseClaimRequests'));
const JammuSrtExpenseViewPayments = lazy(() => import('../components/Vendor-Management/jammu/Expenses/SRT_70MW/SrtExpenseViewPayments'));

export const vendorManagementRoutes: ReactElement[] = [
  // ── SUPER ADMIN: VENDOR MANAGEMENT ──
  <Route key="vm.dashboard" path="vendor-management" element={wrap(VendorManagementDashboard)} />,
  <Route key="vm.users" path="vendor-management/users" element={wrap(AdminVendorUsersDashboard)} />,

  // ── ASSAM SWP ──
  <Route key="vm.assam.swp.dashboard" path="vendor-management/assam/swp/dashboard" element={wrap(AssamSwpDashboard)} />,
  <Route key="vm.assam.swp.assign" path="vendor-management/assam/swp/assign-installation" element={wrap(AssignInstallation)} />,
  <Route key="vm.assam.swp.view-assign" path="vendor-management/assam/swp/view-assign-installation" element={wrap(ViewAssignInstallation)} />,
  <Route key="vm.assam.swp.verify" path="vendor-management/assam/swp/verify-installation" element={wrap(VerifyInstallation)} />,
  <Route key="vm.assam.swp.verify-doc" path="vendor-management/assam/swp/verify-document" element={wrap(VerifyDocument)} />,
  <Route key="vm.assam.swp.verify-claim" path="vendor-management/assam/swp/verify-claim" element={wrap(VerifyClaim)} />,
  <Route key="vm.assam.swp.view-payment" path="vendor-management/assam/swp/view-payment" element={wrap(ViewPayment)} />,
  <Route key="vm.assam.swp.status-view" path="vendor-management/assam/swp/status-view" element={wrap(StatusView)} />,
  <Route key="vm.assam.swp.req-alias" path="vendor-management/assam/swp/request" element={wrap(ViewAssignInstallation)} />,
  <Route key="vm.assam.swp.site-alias" path="vendor-management/assam/swp/site" element={wrap(AssignInstallation)} />,
  <Route key="vm.assam.swp.view-alias" path="vendor-management/assam/swp/view" element={wrap(VerifyInstallation)} />,
  <Route key="vm.assam.swp.pay-alias" path="vendor-management/assam/swp/payment" element={wrap(ViewPayment)} />,

  // ── KARNATAKA SWP INSTALLATION ──
  <Route key="vm.ktk.root" path="vendor-management/karnataka" element={wrap(KarnatakaAdminSwpDashboard)} />,
  <Route key="vm.ktk.inst" path="vendor-management/karnataka/installation" element={wrap(KarnatakaAdminSwpDashboard)} />,
  <Route key="vm.ktk.swp.db" path="vendor-management/karnataka/swp/dashboard" element={wrap(KarnatakaAdminSwpDashboard)} />,
  <Route key="vm.ktk.swp.db2" path="vendor-management/karnataka/swp-installation-dashboard" element={wrap(KarnatakaAdminSwpDashboard)} />,
  <Route key="vm.ktk.swp.db3" path="karnataka/swp-installation-dashboard" element={wrap(KarnatakaAdminSwpDashboard)} />,

  <Route key="vm.ktk.swp.assign" path="vendor-management/karnataka/swp/assign-installation" element={wrap(KarnatakaAdminAssignInstallation)} />,
  <Route key="vm.ktk.swp.assign2" path="vendor-management/karnataka-swp-installation-assign" element={wrap(KarnatakaAdminAssignInstallation)} />,
  <Route key="vm.ktk.swp.assign3" path="karnataka-swp-installation-assign" element={wrap(KarnatakaAdminAssignInstallation)} />,

  <Route key="vm.ktk.swp.vassign" path="vendor-management/karnataka/swp/view-assign-installation" element={wrap(KarnatakaAdminViewAssignInstallation)} />,
  <Route key="vm.ktk.swp.vassign2" path="vendor-management/karnataka-view-assign-swp-installation" element={wrap(KarnatakaAdminViewAssignInstallation)} />,
  <Route key="vm.ktk.swp.vassign3" path="karnataka-view-assign-swp-installation" element={wrap(KarnatakaAdminViewAssignInstallation)} />,

  <Route key="vm.ktk.swp.verify" path="vendor-management/karnataka/swp/verify-installation" element={wrap(KarnatakaAdminVerifyInstallation)} />,
  <Route key="vm.ktk.swp.verify2" path="vendor-management/karnataka-verify-swp-installation" element={wrap(KarnatakaAdminVerifyInstallation)} />,
  <Route key="vm.ktk.swp.verify3" path="karnataka-verify-swp-installation" element={wrap(KarnatakaAdminVerifyInstallation)} />,

  <Route key="vm.ktk.swp.vdoc" path="vendor-management/karnataka/swp/verify-document" element={wrap(KarnatakaAdminVerifyDocument)} />,
  <Route key="vm.ktk.swp.vdoc2" path="vendor-management/karnataka-verify-swp-doc" element={wrap(KarnatakaAdminVerifyDocument)} />,
  <Route key="vm.ktk.swp.vdoc3" path="karnataka-verify-swp-doc" element={wrap(KarnatakaAdminVerifyDocument)} />,

  <Route key="vm.ktk.swp.vclaim" path="vendor-management/karnataka/swp/verify-claim" element={wrap(KarnatakaAdminVerifyClaim)} />,
  <Route key="vm.ktk.swp.vclaim2" path="vendor-management/karnataka-view-swp-installation-claim-request" element={wrap(KarnatakaAdminVerifyClaim)} />,
  <Route key="vm.ktk.swp.vclaim3" path="karnataka-view-swp-installation-claim-request" element={wrap(KarnatakaAdminVerifyClaim)} />,

  <Route key="vm.ktk.swp.vpay" path="vendor-management/karnataka/swp/view-payment" element={wrap(KarnatakaAdminViewPayment)} />,
  <Route key="vm.ktk.swp.vpay2" path="vendor-management/karnataka-view-swp-installation-payment" element={wrap(KarnatakaAdminViewPayment)} />,
  <Route key="vm.ktk.swp.vpay3" path="karnataka-view-swp-installation-payment" element={wrap(KarnatakaAdminViewPayment)} />,

  // ── KARNATAKA SWP MATERIAL ──
  <Route key="vm.ktk.mat.disp" path="vendor-management/karnataka/swp/material-dispatch" element={wrap(KarnatakaAdminDispatchMaterial)} />,
  <Route key="vm.ktk.mat.disp2" path="vendor-management/karnataka/swp-material-dispatch" element={wrap(KarnatakaAdminDispatchMaterial)} />,
  <Route key="vm.ktk.mat.disp3" path="karnataka/swp-material-dispatch" element={wrap(KarnatakaAdminDispatchMaterial)} />,

  <Route key="vm.ktk.mat.vdisp" path="vendor-management/karnataka/swp/view-material-dispatch" element={wrap(KarnatakaAdminViewDispatchMaterial)} />,
  <Route key="vm.ktk.mat.vdisp2" path="vendor-management/karnataka/swp-view-material-dispatch" element={wrap(KarnatakaAdminViewDispatchMaterial)} />,
  <Route key="vm.ktk.mat.vdisp3" path="karnataka/swp-view-material-dispatch" element={wrap(KarnatakaAdminViewDispatchMaterial)} />,

  <Route key="vm.ktk.swp.status" path="vendor-management/karnataka/swp/status-view" element={wrap(KarnatakaAdminStatusView)} />,
  <Route key="vm.ktk.swp.status2" path="karnataka/swp/status-view" element={wrap(KarnatakaAdminStatusView)} />,

  // ── UTTAR PRADESH ROOT ──
  <Route key="vm.up.root" path="vendor-management/up" element={wrap(UPKusumCDashboard)} />,
  <Route key="vm.up.inst" path="vendor-management/up/installation" element={wrap(UPKusumCDashboard)} />,

  // UP Installation: Kusum C
  <Route key="vm.up.kc.db" path="vendor-management/up/kusumc/installation/dashboard" element={wrap(UPKusumCDashboard)} />,
  <Route key="vm.up.kc.db2" path="vendor-management/up-dashboard-kusum-c-installation" element={wrap(UPKusumCDashboard)} />,
  <Route key="vm.up.kc.db3" path="up-dashboard-kusum-c-installation" element={wrap(UPKusumCDashboard)} />,

  <Route key="vm.up.kc.assign" path="vendor-management/up/kusumc/installation/assign" element={wrap(UPKusumCAssignInstallation)} />,
  <Route key="vm.up.kc.assign2" path="vendor-management/up/assign-kusum-c-installation" element={wrap(UPKusumCAssignInstallation)} />,
  <Route key="vm.up.kc.assign3" path="up/assign-kusum-c-installation" element={wrap(UPKusumCAssignInstallation)} />,

  <Route key="vm.up.kc.vassign" path="vendor-management/up/kusumc/installation/view-assign" element={wrap(UPKusumCViewAssignInstallation)} />,
  <Route key="vm.up.kc.vassign2" path="vendor-management/up/view-assign-kusum-c-installation" element={wrap(UPKusumCViewAssignInstallation)} />,
  <Route key="vm.up.kc.vassign3" path="up/view-assign-kusum-c-installation" element={wrap(UPKusumCViewAssignInstallation)} />,

  <Route key="vm.up.kc.verify" path="vendor-management/up/kusumc/installation/verify" element={wrap(UPKusumCVerifyInstallation)} />,
  <Route key="vm.up.kc.verify2" path="vendor-management/up/verify-kusum-c-installation" element={wrap(UPKusumCVerifyInstallation)} />,
  <Route key="vm.up.kc.verify3" path="up/verify-kusum-c-installation" element={wrap(UPKusumCVerifyInstallation)} />,

  <Route key="vm.up.kc.vdoc" path="vendor-management/up/kusumc/installation/verify-doc" element={wrap(UPKusumCVerifyDocument)} />,
  <Route key="vm.up.kc.vdoc2" path="vendor-management/up/verify-kusum-c-doc" element={wrap(UPKusumCVerifyDocument)} />,
  <Route key="vm.up.kc.vdoc3" path="up/verify-kusum-c-doc" element={wrap(UPKusumCVerifyDocument)} />,

  <Route key="vm.up.kc.vclaim" path="vendor-management/up/kusumc/installation/verify-claim" element={wrap(UPKusumCVerifyClaim)} />,
  <Route key="vm.up.kc.vclaim2" path="vendor-management/up/view-kusum-c-installation-claim-request" element={wrap(UPKusumCVerifyClaim)} />,
  <Route key="vm.up.kc.vclaim3" path="up/view-kusum-c-installation-claim-request" element={wrap(UPKusumCVerifyClaim)} />,

  <Route key="vm.up.kc.vpay" path="vendor-management/up/kusumc/installation/view-payment" element={wrap(UPKusumCViewPayment)} />,
  <Route key="vm.up.kc.vpay2" path="vendor-management/up/view-kusum-c-installation-payment" element={wrap(UPKusumCViewPayment)} />,
  <Route key="vm.up.kc.vpay3" path="up/view-kusum-c-installation-payment" element={wrap(UPKusumCViewPayment)} />,

  // UP Installation: Resco
  <Route key="vm.up.resco.db" path="vendor-management/up/resco/installation/dashboard" element={wrap(UPRescoInstallationDashboard)} />,
  <Route key="vm.up.resco.db2" path="vendor-management/up/resco-installation-dashboard" element={wrap(UPRescoInstallationDashboard)} />,
  <Route key="vm.up.resco.db3" path="up/resco-installation-dashboard" element={wrap(UPRescoInstallationDashboard)} />,

  <Route key="vm.up.resco.assign" path="vendor-management/up/resco/installation/assign" element={wrap(UPRescoAssignInstallation)} />,
  <Route key="vm.up.resco.assign2" path="vendor-management/up/resco-installation-assign" element={wrap(UPRescoAssignInstallation)} />,
  <Route key="vm.up.resco.assign3" path="up/resco-installation-assign" element={wrap(UPRescoAssignInstallation)} />,

  <Route key="vm.up.resco.vassign" path="vendor-management/up/resco/installation/view-assign" element={wrap(UPRescoViewAssignInstallation)} />,
  <Route key="vm.up.resco.vassign2" path="vendor-management/up/resco-view-assign-installation" element={wrap(UPRescoViewAssignInstallation)} />,
  <Route key="vm.up.resco.vassign3" path="up/resco-view-assign-installation" element={wrap(UPRescoViewAssignInstallation)} />,

  <Route key="vm.up.resco.verify" path="vendor-management/up/resco/installation/verify" element={wrap(UPRescoVerifyInstallation)} />,
  <Route key="vm.up.resco.verify2" path="vendor-management/up/resco-verify-installation" element={wrap(UPRescoVerifyInstallation)} />,
  <Route key="vm.up.resco.verify3" path="up/resco-verify-installation" element={wrap(UPRescoVerifyInstallation)} />,

  <Route key="vm.up.resco.vdoc" path="vendor-management/up/resco/installation/verify-doc" element={wrap(UPRescoVerifyDocument)} />,
  <Route key="vm.up.resco.vdoc2" path="vendor-management/up/resco-verify-doc" element={wrap(UPRescoVerifyDocument)} />,
  <Route key="vm.up.resco.vdoc3" path="up/resco-verify-doc" element={wrap(UPRescoVerifyDocument)} />,

  <Route key="vm.up.resco.vclaim" path="vendor-management/up/resco/installation/view-claim" element={wrap(UPRescoViewClaim)} />,
  <Route key="vm.up.resco.vclaim2" path="vendor-management/up/resco-view-installation-claim" element={wrap(UPRescoViewClaim)} />,
  <Route key="vm.up.resco.vclaim3" path="up/resco-view-installation-claim" element={wrap(UPRescoViewClaim)} />,

  <Route key="vm.up.resco.vpay" path="vendor-management/up/resco/installation/view-payment" element={wrap(UPRescoViewPayment)} />,
  <Route key="vm.up.resco.vpay2" path="vendor-management/up/resco-view-installation-payment" element={wrap(UPRescoViewPayment)} />,
  <Route key="vm.up.resco.vpay3" path="up/resco-view-installation-payment" element={wrap(UPRescoViewPayment)} />,

  <Route key="vm.up.resco.cbill" path="vendor-management/up/resco/installation/view-create-bill" element={wrap(UPRescoViewCreatedBills)} />,
  <Route key="vm.up.resco.cbill2" path="vendor-management/up/resco-installation-view-create-bill" element={wrap(UPRescoViewCreatedBills)} />,
  <Route key="vm.up.resco.cbill3" path="up/resco-installation-view-create-bill" element={wrap(UPRescoViewCreatedBills)} />,

  <Route key="vm.up.resco.vav" path="vendor-management/up/resco/installation/view-assign-vendor" element={wrap(UPRescoViewAssignVendorInstallation)} />,
  <Route key="vm.up.resco.vav2" path="vendor-management/up/resco-view-assign-v-installation" element={wrap(UPRescoViewAssignVendorInstallation)} />,
  <Route key="vm.up.resco.vav3" path="up/resco-view-assign-v-installation" element={wrap(UPRescoViewAssignVendorInstallation)} />,

  // UP Installation: SSL 18W
  <Route key="vm.up.ssl18.db" path="vendor-management/up/ssl18w/installation/dashboard" element={wrap(UPSSL18WInstallationDashboard)} />,
  <Route key="vm.up.ssl18.db2" path="vendor-management/up/ssl-18w-installation-dashboard" element={wrap(UPSSL18WInstallationDashboard)} />,
  <Route key="vm.up.ssl18.db3" path="up/ssl-18w-installation-dashboard" element={wrap(UPSSL18WInstallationDashboard)} />,

  <Route key="vm.up.ssl18.assign" path="vendor-management/up/ssl18w/installation/assign" element={wrap(UPSSL18WAssignInstallation)} />,
  <Route key="vm.up.ssl18.assign2" path="vendor-management/up/ssl-18w-installation-assign" element={wrap(UPSSL18WAssignInstallation)} />,
  <Route key="vm.up.ssl18.assign3" path="up/ssl-18w-installation-assign" element={wrap(UPSSL18WAssignInstallation)} />,

  <Route key="vm.up.ssl18.vassign" path="vendor-management/up/ssl18w/installation/view-assign" element={wrap(UPSSL18WViewAssignInstallation)} />,
  <Route key="vm.up.ssl18.vassign2" path="vendor-management/up/ssl-18w-view-assign-installation" element={wrap(UPSSL18WViewAssignInstallation)} />,
  <Route key="vm.up.ssl18.vassign3" path="up/ssl-18w-view-assign-installation" element={wrap(UPSSL18WViewAssignInstallation)} />,

  <Route key="vm.up.ssl18.verify" path="vendor-management/up/ssl18w/installation/verify" element={wrap(UPSSL18WVerifyInstallation)} />,
  <Route key="vm.up.ssl18.verify2" path="vendor-management/up/ssl-18w-installation" element={wrap(UPSSL18WVerifyInstallation)} />,
  <Route key="vm.up.ssl18.verify3" path="up/ssl-18w-installation" element={wrap(UPSSL18WVerifyInstallation)} />,





        /*  Super Admin: Arunachal SHL Routes  */
              <Route path="vendor-management/arunachal/shl/dashboard" element={wrap(ArunachalShlDashboard)} />,
              <Route path="vendor-management/arunachal/shl/assign-installation" element={wrap(ArunachalAssignLights)} />,
              <Route path="vendor-management/arunachal/shl/assign-light" element={wrap(ArunachalAssignLights)} />,
              <Route path="vendor-management/arunachal/shl/view-assign-installation" element={wrap(ArunachalViewAssignLights)} />,
              <Route path="vendor-management/arunachal/shl/view-assign" element={wrap(ArunachalViewAssignLights)} />,
              <Route path="vendor-management/arunachal/shl/verify-installation" element={wrap(ArunachalVerifyLights)} />,
              <Route path="vendor-management/arunachal/shl/verify" element={wrap(ArunachalVerifyLights)} />,
              <Route path="vendor-management/arunachal/shl/verify-document" element={wrap(ArunachalVerifyLights)} />,
              <Route path="vendor-management/arunachal/shl/verify-claim" element={wrap(ArunachalShlStatusView)} />,
              <Route path="vendor-management/arunachal/shl/view-payment" element={wrap(ArunachalShlStatusView)} />,
              <Route path="vendor-management/arunachal/shl/status-view" element={wrap(ArunachalShlStatusView)} />,
              <Route path="vendor-management/arunachal/installation" element={wrap(ArunachalShlDashboard)} />,
              <Route path="vendor-management/arunachal/dashboard" element={wrap(ArunachalShlDashboard)} />,
              <Route path="vendor-management/arunachal/shl" element={wrap(ArunachalShlDashboard)} />,
              <Route path="vendor-management/arunachal" element={wrap(ArunachalShlDashboard)} />,
              /*  Route aliases for compatibility  */
              <Route path="arunachal/shl/installation/dashboard" element={wrap(ArunachalShlDashboard)} />,
              <Route path="arunachal/shl/installation/assign-installation" element={wrap(ArunachalAssignLights)} />,
              <Route path="arunachal/shl/installation/assign-light" element={wrap(ArunachalAssignLights)} />,
              <Route path="arunachal/shl/installation/view-assign-installation" element={wrap(ArunachalViewAssignLights)} />,
              <Route path="arunachal/shl/installation/view-assign" element={wrap(ArunachalViewAssignLights)} />,
              <Route path="arunachal/shl/installation/assign/view" element={wrap(ArunachalViewAssignLights)} />,
              <Route path="arunachal/shl/installation/verify-installation" element={wrap(ArunachalVerifyLights)} />,
              <Route path="arunachal/shl/installation/verify" element={wrap(ArunachalVerifyLights)} />,
              <Route path="arunachal/shl/installation/verify-document" element={wrap(ArunachalVerifyLights)} />,
              <Route path="arunachal/shl/installation/verify-claim" element={wrap(ArunachalShlStatusView)} />,
              <Route path="arunachal/shl/installation/view-payment" element={wrap(ArunachalShlStatusView)} />,
              <Route path="arunachal/shl/installation/status-view" element={wrap(ArunachalShlStatusView)} />,

        /*  Super Admin: Punjab SSL Routes  */
              <Route path="vendor-management/punjab/ssl/dashboard" element={wrap(PunjabSslDashboard)} />,
              <Route path="vendor-management/punjab/ssl/assign-installation" element={wrap(PunjabAssignLights)} />,
              <Route path="vendor-management/punjab/ssl/assign-lights" element={wrap(PunjabAssignLights)} />,
              <Route path="vendor-management/punjab/ssl/assign-light" element={wrap(PunjabAssignLights)} />,
              <Route path="vendor-management/punjab/ssl/view-assign-installation" element={wrap(PunjabViewAssignLights)} />,
              <Route path="vendor-management/punjab/ssl/view-assign-lights" element={wrap(PunjabViewAssignLights)} />,
              <Route path="vendor-management/punjab/ssl/view-assign" element={wrap(PunjabViewAssignLights)} />,
              <Route path="vendor-management/punjab/ssl/verify-installation" element={wrap(PunjabVerifyLights)} />,
              <Route path="vendor-management/punjab/ssl/verify-lights" element={wrap(PunjabVerifyLights)} />,
              <Route path="vendor-management/punjab/ssl/verify" element={wrap(PunjabVerifyLights)} />,
              <Route path="vendor-management/punjab/ssl/status-view" element={wrap(PunjabSslStatusView)} />,
              <Route path="vendor-management/punjab/installation" element={wrap(PunjabSslDashboard)} />,
              <Route path="vendor-management/punjab/dashboard" element={wrap(PunjabSslDashboard)} />,
              <Route path="vendor-management/punjab/ssl" element={wrap(PunjabSslDashboard)} />,
              <Route path="vendor-management/punjab" element={wrap(PunjabSslDashboard)} />,

              /*  Direct Compatibility Aliases matching user request URLs  */
              <Route path="punjab/ssl/installation/assign-lights" element={wrap(PunjabAssignLights)} />,
              <Route path="punjab/ssl/installation/assign-installation" element={wrap(PunjabAssignLights)} />,
              <Route path="punjab/ssl/installation/view-assign-lights" element={wrap(PunjabViewAssignLights)} />,
              <Route path="punjab/ssl/installation/view-assign" element={wrap(PunjabViewAssignLights)} />,
              <Route path="punjab/ssl/installation/verify-lights" element={wrap(PunjabVerifyLights)} />,
              <Route path="punjab/ssl/installation/verify-installation" element={wrap(PunjabVerifyLights)} />,
              <Route path="punjab/ssl/installation/dashboard" element={wrap(PunjabSslDashboard)} />,
              <Route path="punjab/ssl/installation/status-view" element={wrap(PunjabSslStatusView)} />,
              <Route path="punjab/ssl/installation/view-dashboard/:status" element={wrap(PunjabSslStatusView)} />,
              <Route path="punjab/ssl/installation/districtwise-data/:status/:district" element={wrap(PunjabSslStatusView)} />,

        /*  Super Admin: Jammu Survey Routes  */
              <Route path="vendor-management/jammu/survey/srt-70mw/verify" element={wrap(JammuVerifySrt70MWSurvey)} />,
              <Route path="vendor-management/jammu/survey/srt-70mw" element={wrap(JammuVerifySrt70MWSurvey)} />,
              <Route path="vendor-management/jammu/survey/resco/dashboard" element={wrap(JammuRescoDashboard)} />,
              <Route path="vendor-management/jammu/survey/resco/assign" element={wrap(JammuAssignRescoSurvey)} />,
              <Route path="vendor-management/jammu/survey/resco/assign-survey" element={wrap(JammuAssignRescoSurvey)} />,
              <Route path="vendor-management/jammu/survey/resco/view-assign" element={wrap(JammuAssignViewSurvey)} />,
              <Route path="vendor-management/jammu/survey/resco/assigned-vendor" element={wrap(JammuAssignedSurveyVendor)} />,
              <Route path="vendor-management/jammu/survey/resco/pending-survey" element={wrap(JammuAssignedSurveyVendor)} />,
              <Route path="vendor-management/jammu/survey/resco/verify" element={wrap(JammuVerifySurvey)} />,
              <Route path="vendor-management/jammu/survey/resco/view-survey" element={wrap(JammuVerifySurvey)} />,
              <Route path="vendor-management/jammu/survey/resco" element={wrap(JammuRescoDashboard)} />,
              <Route path="vendor-management/jammu/survey" element={wrap(JammuRescoDashboard)} />,
              <Route path="vendor-management/jammu" element={wrap(JammuRescoDashboard)} />,

              /*  Jammu Survey Direct Compatibility Aliases  */
              <Route path="jammu/srt70mw-survey-verify" element={wrap(JammuVerifySrt70MWSurvey)} />,
              <Route path="jk/resco-survey-assign" element={wrap(JammuAssignRescoSurvey)} />,
              <Route path="jk/resco-survey-assign-view" element={wrap(JammuAssignViewSurvey)} />,
              <Route path="jk/resco-survey-assign-vendor" element={wrap(JammuAssignedSurveyVendor)} />,
              <Route path="jk/resco-survey-verify" element={wrap(JammuVerifySurvey)} />,

        /*  Super Admin: Jammu Installation Routes - SRT 70MW  */
              <Route path="vendor-management/jammu/installation/srt-70mw/dashboard" element={wrap(JammuSrtDashboard)} />,
              <Route path="vendor-management/jammu/installation/srt-70mw/assign-sites" element={wrap(JammuAssignSrtSites)} />,
              <Route path="vendor-management/jammu/installation/srt-70mw/view-assign-sites" element={wrap(JammuViewAssignSrtSites)} />,
              <Route path="vendor-management/jammu/installation/srt-70mw/verify-sites" element={wrap(JammuVerifySrtSites)} />,
              <Route path="vendor-management/jammu/installation/srt-70mw/view-claim" element={wrap(JammuViewSrtClaim)} />,
              <Route path="vendor-management/jammu/installation/srt-70mw/view-payment" element={wrap(JammuViewSrtPayment)} />,
              <Route path="vendor-management/jammu/installation/srt-70mw" element={wrap(JammuSrtDashboard)} />,

              /*  Jammu SRT 70MW Direct & Compatibility Aliases  */
              <Route path="vendor-management/jammu/srt/dashboard" element={wrap(JammuSrtDashboard)} />,
              <Route path="vendor-management/jammu/srt/assign-sites" element={wrap(JammuAssignSrtSites)} />,
              <Route path="vendor-management/jammu/srt/view-assign" element={wrap(JammuViewAssignSrtSites)} />,
              <Route path="vendor-management/jammu/srt/view-assign-sites" element={wrap(JammuViewAssignSrtSites)} />,
              <Route path="vendor-management/jammu/srt/verify-sites" element={wrap(JammuVerifySrtSites)} />,
              <Route path="vendor-management/jammu/srt/view-claim" element={wrap(JammuViewSrtClaim)} />,
              <Route path="vendor-management/jammu/srt/view-payment" element={wrap(JammuViewSrtPayment)} />,
              <Route path="vendor-management/jammu/srt" element={wrap(JammuSrtDashboard)} />,
              <Route path="jammu/assign-installation-srt70mw" element={wrap(JammuAssignSrtSites)} />,
              <Route path="jammu/view-assign-installation-srt70mw" element={wrap(JammuViewAssignSrtSites)} />,
              <Route path="jammu/verify-srt70mw-installation" element={wrap(JammuVerifySrtSites)} />,
              <Route path="jammu/claim-srt70mw-installation" element={wrap(JammuViewSrtClaim)} />,
              <Route path="jammu/view-claim-srt70mw" element={wrap(JammuViewSrtClaim)} />,
              <Route path="jammu/payment-srt70mw-installation" element={wrap(JammuViewSrtPayment)} />,
              <Route path="jammu/view-payment-srt70mw" element={wrap(JammuViewSrtPayment)} />,

        /*  Super Admin: Jammu Installation Routes - SSL  */
              <Route path="vendor-management/jammu/installation/ssl/dashboard" element={wrap(JammuSslDashboard)} />,
              <Route path="vendor-management/jammu/installation/ssl/assign-lights" element={wrap(JammuAssignSslLights)} />,
              <Route path="vendor-management/jammu/installation/ssl/view-assign-lights" element={wrap(JammuViewAssignSslLights)} />,
              <Route path="vendor-management/jammu/installation/ssl/verify-lights" element={wrap(JammuVerifySslLights)} />,
              <Route path="vendor-management/jammu/installation/ssl/claim-request" element={wrap(JammuSslClaimRequest)} />,
              <Route path="vendor-management/jammu/installation/ssl/payment-request" element={wrap(JammuSslPaymentRequest)} />,
              <Route path="vendor-management/jammu/installation/ssl" element={wrap(JammuSslDashboard)} />,
              /*  Jammu SSL Shorthand Aliases  */
              <Route path="vendor-management/jammu/ssl/dashboard" element={wrap(JammuSslDashboard)} />,
              <Route path="vendor-management/jammu/ssl/assign-light" element={wrap(JammuAssignSslLights)} />,
              <Route path="vendor-management/jammu/ssl/assign-lights" element={wrap(JammuAssignSslLights)} />,
              <Route path="vendor-management/jammu/ssl/view-assign" element={wrap(JammuViewAssignSslLights)} />,
              <Route path="vendor-management/jammu/ssl/view-assigned" element={wrap(JammuViewAssignSslLights)} />,
              <Route path="vendor-management/jammu/ssl/view-assign-lights" element={wrap(JammuViewAssignSslLights)} />,
              <Route path="vendor-management/jammu/ssl/verify" element={wrap(JammuVerifySslLights)} />,
              <Route path="vendor-management/jammu/ssl/verify-lights" element={wrap(JammuVerifySslLights)} />,
              <Route path="vendor-management/jammu/ssl/claim-request" element={wrap(JammuSslClaimRequest)} />,
              <Route path="vendor-management/jammu/ssl/payment-request" element={wrap(JammuSslPaymentRequest)} />,
              <Route path="vendor-management/jammu/ssl" element={wrap(JammuSslDashboard)} />,

        /*  Super Admin: Jammu Installation Routes - SWP  */
              <Route path="vendor-management/jammu/installation/swp/dashboard" element={wrap(JammuSwpDashboard)} />,
              <Route path="vendor-management/jammu/installation/swp/assign-installation" element={wrap(JammuAssignSwpInstallation)} />,
              <Route path="vendor-management/jammu/installation/swp/assign" element={wrap(JammuAssignSwpInstallation)} />,
              <Route path="vendor-management/jammu/installation/swp/view-assign-installation" element={wrap(JammuViewAssignSwpInstallation)} />,
              <Route path="vendor-management/jammu/installation/swp/view-assign" element={wrap(JammuViewAssignSwpInstallation)} />,
              <Route path="vendor-management/jammu/installation/swp/verify-installation" element={wrap(JammuVerifySwpInstallation)} />,
              <Route path="vendor-management/jammu/installation/swp/verify-document" element={wrap(JammuVerifySwpDocument)} />,
              <Route path="vendor-management/jammu/installation/swp/verify-claim" element={wrap(JammuVerifySwpClaim)} />,
              <Route path="vendor-management/jammu/installation/swp/view-payment" element={wrap(JammuViewSwpPayment)} />,
              <Route path="vendor-management/jammu/installation/swp/status-view" element={wrap(JammuSwpStatusView)} />,
              <Route path="vendor-management/jammu/installation/swp" element={wrap(JammuSwpDashboard)} />,
              <Route path="vendor-management/jammu/swp/dashboard" element={wrap(JammuSwpDashboard)} />,
              <Route path="vendor-management/jammu/swp/assign-installation" element={wrap(JammuAssignSwpInstallation)} />,
              <Route path="vendor-management/jammu/swp/assign" element={wrap(JammuAssignSwpInstallation)} />,
              <Route path="vendor-management/jammu/swp/view-assign-installation" element={wrap(JammuViewAssignSwpInstallation)} />,
              <Route path="vendor-management/jammu/swp/view-assign" element={wrap(JammuViewAssignSwpInstallation)} />,
              <Route path="vendor-management/jammu/swp/verify-installation" element={wrap(JammuVerifySwpInstallation)} />,
              <Route path="vendor-management/jammu/swp/verify-document" element={wrap(JammuVerifySwpDocument)} />,
              <Route path="vendor-management/jammu/swp/verify-claim" element={wrap(JammuVerifySwpClaim)} />,
              <Route path="vendor-management/jammu/swp/view-payment" element={wrap(JammuViewSwpPayment)} />,
              <Route path="vendor-management/jammu/swp/status-view" element={wrap(JammuSwpStatusView)} />,
              <Route path="vendor-management/jammu/swp" element={wrap(JammuSwpDashboard)} />,

        /*  Super Admin: Jammu Installation Routes - RESCO  */
              <Route path="vendor-management/jammu/installation/resco/dashboard" element={wrap(JammuRescoInstDashboard)} />,
              <Route path="vendor-management/jammu/installation/resco/assign-installation" element={wrap(JammuAssignRescoInstallation)} />,
              <Route path="vendor-management/jammu/installation/resco/view-assign-installation" element={wrap(JammuViewAssignRescoInstallation)} />,
              <Route path="vendor-management/jammu/installation/resco/view-assign-vendor-installation" element={wrap(JammuViewAssignVendorInstallation)} />,
              <Route path="vendor-management/jammu/installation/resco/verify-installation" element={wrap(JammuVerifyRescoInstallation)} />,
              <Route path="vendor-management/jammu/installation/resco/verify-document" element={wrap(JammuVerifyRescoDocument)} />,
              <Route path="vendor-management/jammu/installation/resco/view-claim" element={wrap(JammuViewRescoClaim)} />,
              <Route path="vendor-management/jammu/installation/resco/view-payment" element={wrap(JammuViewRescoPayment)} />,
              <Route path="vendor-management/jammu/installation/resco/view-bills" element={wrap(JammuViewRescoBills)} />,
              <Route path="vendor-management/jammu/installation/resco" element={wrap(JammuRescoInstDashboard)} />,
              <Route path="vendor-management/jammu/installation" element={wrap(JammuSrtDashboard)} />,

        /*  Super Admin: Jammu Expenses Routes - SRT 70MW  */
              <Route path="vendor-management/jammu/expenses/srt-70mw/claim-requests" element={wrap(JammuSrtExpenseClaimRequests)} />,
              <Route path="vendor-management/jammu/expenses/srt-70mw/view-payments" element={wrap(JammuSrtExpenseViewPayments)} />,
              <Route path="vendor-management/jammu/expenses/srt-70mw" element={wrap(JammuSrtExpenseClaimRequests)} />,
              <Route path="vendor-management/jammu/expenses" element={wrap(JammuSrtExpenseClaimRequests)} />,






  <Route key="vm.up.ssl18.vclaim" path="vendor-management/up/ssl18w/installation/view-claim" element={wrap(UPSSL18WViewClaim)} />,
  <Route key="vm.up.ssl18.vclaim2" path="vendor-management/up/ssl-18w-installation-claim" element={wrap(UPSSL18WViewClaim)} />,
  <Route key="vm.up.ssl18.vclaim3" path="up/ssl-18w-installation-claim" element={wrap(UPSSL18WViewClaim)} />,

  <Route key="vm.up.ssl18.vpay" path="vendor-management/up/ssl18w/installation/view-payment" element={wrap(UPSSL18WViewPayment)} />,
  <Route key="vm.up.ssl18.vpay2" path="vendor-management/up/ssl-18w-installation-payment" element={wrap(UPSSL18WViewPayment)} />,
  <Route key="vm.up.ssl18.vpay3" path="up/ssl-18w-installation-payment" element={wrap(UPSSL18WViewPayment)} />,

  // UP AMC: Resco
  <Route key="vm.up.amc.resco.assign" path="vendor-management/up/resco/amc/assign-site" element={wrap(UPRescoAMCAssignSite)} />,
  <Route key="vm.up.amc.resco.assign2" path="up/resco/amc/assign-site" element={wrap(UPRescoAMCAssignSite)} />,

  <Route key="vm.up.amc.resco.vassign" path="vendor-management/up/resco/amc/view-assign-site" element={wrap(UPRescoAMCViewAssignSite)} />,
  <Route key="vm.up.amc.resco.vassign2" path="up/resco/amc/view-assign-site" element={wrap(UPRescoAMCViewAssignSite)} />,

  <Route key="vm.up.amc.resco.verify" path="vendor-management/up/resco/amc/verify-site" element={wrap(UPRescoAMCVerifySite)} />,
  <Route key="vm.up.amc.resco.verify2" path="up/resco/amc/verify-site" element={wrap(UPRescoAMCVerifySite)} />,

  <Route key="vm.up.amc.resco.claim" path="vendor-management/up/resco/amc/claim-request" element={wrap(UPRescoAMCClaimRequest)} />,
  <Route key="vm.up.amc.resco.claim2" path="up/resco/amc/claim-request" element={wrap(UPRescoAMCClaimRequest)} />,

  <Route key="vm.up.amc.resco.vpay" path="vendor-management/up/resco/amc/view-payment" element={wrap(UPRescoAMCViewPayment)} />,
  <Route key="vm.up.amc.resco.vpay2" path="up/resco/amc/view-payment" element={wrap(UPRescoAMCViewPayment)} />,

  // UP AMC: Up SSL
  <Route key="vm.up.amc.ssl.assign" path="vendor-management/up/ssl/amc/assign-light" element={wrap(UPSSLAMCAssignLight)} />,
  <Route key="vm.up.amc.ssl.assign2" path="up/ssl/amc/assign-light" element={wrap(UPSSLAMCAssignLight)} />,

  <Route key="vm.up.amc.ssl.vassign" path="vendor-management/up/ssl/amc/view-assign-light" element={wrap(UPSSLAMCViewAssignLight)} />,
  <Route key="vm.up.amc.ssl.vassign2" path="up/ssl/amc/view-assign-light" element={wrap(UPSSLAMCViewAssignLight)} />,

  <Route key="vm.up.amc.ssl.verify" path="vendor-management/up/ssl/amc/verify-assign-light" element={wrap(UPSSLAMCVerifyAssignLight)} />,
  <Route key="vm.up.amc.ssl.verify2" path="up/ssl/amc/verify-assign-light" element={wrap(UPSSLAMCVerifyAssignLight)} />,

  <Route key="vm.up.amc.ssl.claim" path="vendor-management/up/ssl/amc/claim-request" element={wrap(UPSSLAMCClaimRequest)} />,
  <Route key="vm.up.amc.ssl.claim2" path="up/ssl/amc/claim-request" element={wrap(UPSSLAMCClaimRequest)} />,

  <Route key="vm.up.amc.ssl.vpay" path="vendor-management/up/ssl/amc/view-payment" element={wrap(UPSSLAMCViewPayment)} />,
  <Route key="vm.up.amc.ssl.vpay2" path="up/ssl/amc/view-payment" element={wrap(UPSSLAMCViewPayment)} />,

  // UP AMC: Up SSL 18W
  <Route key="vm.up.amc.ssl18.assign" path="vendor-management/up/ssl18w/amc/assign-light" element={wrap(UPSSL18WAMCAssignLight)} />,
  <Route key="vm.up.amc.ssl18.assign2" path="up/ssl18w/amc/assign-light" element={wrap(UPSSL18WAMCAssignLight)} />,

  <Route key="vm.up.amc.ssl18.vassign" path="vendor-management/up/ssl18w/amc/view-assign-light" element={wrap(UPSSL18WAMCViewAssignLight)} />,
  <Route key="vm.up.amc.ssl18.vassign2" path="up/ssl18w/amc/view-assign-light" element={wrap(UPSSL18WAMCViewAssignLight)} />,

  <Route key="vm.up.amc.ssl18.verify" path="vendor-management/up/ssl18w/amc/verify-assign-light" element={wrap(UPSSL18WAMCVerifyAssignLight)} />,
  <Route key="vm.up.amc.ssl18.verify2" path="up/ssl18w/amc/verify-assign-light" element={wrap(UPSSL18WAMCVerifyAssignLight)} />,

  <Route key="vm.up.amc.ssl18.claim" path="vendor-management/up/ssl18w/amc/claim-request" element={wrap(UPSSL18WAMCClaimRequest)} />,
  <Route key="vm.up.amc.ssl18.claim2" path="up/ssl18w/amc/claim-request" element={wrap(UPSSL18WAMCClaimRequest)} />,

  <Route key="vm.up.amc.ssl18.vpay" path="vendor-management/up/ssl18w/amc/view-payment" element={wrap(UPSSL18WAMCViewPayment)} />,
  <Route key="vm.up.amc.ssl18.vpay2" path="up/ssl18w/amc/view-payment" element={wrap(UPSSL18WAMCViewPayment)} />,

  // UP AMC: Solar Schemes
  <Route key="vm.up.amc.kb.assign" path="vendor-management/up/kusumb/amc/assign-site" element={wrap(UPKusumBAMCAssignSite)} />,
  <Route key="vm.up.amc.kb.assign2" path="up/kusumb/amc/assign-site" element={wrap(UPKusumBAMCAssignSite)} />,
  <Route key="vm.up.amc.kb.vassign" path="vendor-management/up/kusumb/amc/view-assign-site" element={wrap(UPKusumBAMCViewAssignSite)} />,
  <Route key="vm.up.amc.kb.vassign2" path="up/kusumb/amc/view-assigne-site" element={wrap(UPKusumBAMCViewAssignSite)} />,
  <Route key="vm.up.amc.kb.vassign3" path="up/kusumb/amc/view-assign-site" element={wrap(UPKusumBAMCViewAssignSite)} />,
  <Route key="vm.up.amc.kb.verify" path="vendor-management/up/kusumb/amc/verify-site" element={wrap(UPKusumBAMCVerifySite)} />,
  <Route key="vm.up.amc.kb.verify2" path="up/kusumb/amc/verify-site" element={wrap(UPKusumBAMCVerifySite)} />,

  <Route key="vm.up.amc.kc.assign" path="vendor-management/up/kusumc/amc/assign-site" element={wrap(UPKusumCAMCAssignSite)} />,
  <Route key="vm.up.amc.kc.assign2" path="up/kusumc/amc/assign-site" element={wrap(UPKusumCAMCAssignSite)} />,
  <Route key="vm.up.amc.kc.vassign" path="vendor-management/up/kusumc/amc/view-assign-site" element={wrap(UPKusumCAMCViewAssignSite)} />,
  <Route key="vm.up.amc.kc.vassign2" path="up/kusumc/amc/view-assign-site" element={wrap(UPKusumCAMCViewAssignSite)} />,
  <Route key="vm.up.amc.kc.verify" path="vendor-management/up/kusumc/amc/verify-site" element={wrap(UPKusumCAMCVerifySite)} />,
  <Route key="vm.up.amc.kc.verify2" path="up/kusumc/amc/verify-site" element={wrap(UPKusumCAMCVerifySite)} />,

  <Route key="vm.up.amc.pp.assign" path="vendor-management/up/powerpack/amc/assign-site" element={wrap(UPPowerPackAMCAssignSite)} />,
  <Route key="vm.up.amc.pp.assign2" path="up/powerpack/amc/assign-site" element={wrap(UPPowerPackAMCAssignSite)} />,
  <Route key="vm.up.amc.pp.vassign" path="vendor-management/up/powerpack/amc/view-assign-site" element={wrap(UPPowerPackAMCViewAssignSite)} />,
  <Route key="vm.up.amc.pp.vassign2" path="up/powerpack/amc/view-assigne-site" element={wrap(UPPowerPackAMCViewAssignSite)} />,
  <Route key="vm.up.amc.pp.vassign3" path="up/powerpack/amc/view-assign-site" element={wrap(UPPowerPackAMCViewAssignSite)} />,
  <Route key="vm.up.amc.pp.verify" path="vendor-management/up/powerpack/amc/verify-site" element={wrap(UPPowerPackAMCVerifySite)} />,
  <Route key="vm.up.amc.pp.verify2" path="up/powerpack/amc/verify-site" element={wrap(UPPowerPackAMCVerifySite)} />,

  <Route key="vm.up.amc.ongrid.assign" path="vendor-management/up/ongrid/amc/assign-site" element={wrap(UPOngridAMCAssignSite)} />,
  <Route key="vm.up.amc.ongrid.assign2" path="up/ongrid/amc/assign-site" element={wrap(UPOngridAMCAssignSite)} />,
  <Route key="vm.up.amc.ongrid.vassign" path="vendor-management/up/ongrid/amc/view-assign-site" element={wrap(UPOngridAMCViewAssignSite)} />,
  <Route key="vm.up.amc.ongrid.vassign2" path="up/ongrid/amc/view-assigne-site" element={wrap(UPOngridAMCViewAssignSite)} />,
  <Route key="vm.up.amc.ongrid.vassign3" path="up/ongrid/amc/view-assign-site" element={wrap(UPOngridAMCViewAssignSite)} />,
  <Route key="vm.up.amc.ongrid.verify" path="vendor-management/up/ongrid/amc/verify-site" element={wrap(UPOngridAMCVerifySite)} />,
  <Route key="vm.up.amc.ongrid.verify2" path="up/ongrid/amc/verify-site" element={wrap(UPOngridAMCVerifySite)} />,

  <Route key="vm.up.amc.offgrid.assign" path="vendor-management/up/offgrid/amc/assign-site" element={wrap(UPOffgridAMCAssignSite)} />,
  <Route key="vm.up.amc.offgrid.assign2" path="up/offgrid/amc/assign-site" element={wrap(UPOffgridAMCAssignSite)} />,
  <Route key="vm.up.amc.offgrid.vassign" path="vendor-management/up/offgrid/amc/view-assign-site" element={wrap(UPOffgridAMCViewAssignSite)} />,
  <Route key="vm.up.amc.offgrid.vassign2" path="up/offgrid/amc/view-assigne-site" element={wrap(UPOffgridAMCViewAssignSite)} />,
  <Route key="vm.up.amc.offgrid.vassign3" path="up/offgrid/amc/view-assign-site" element={wrap(UPOffgridAMCViewAssignSite)} />,
  <Route key="vm.up.amc.offgrid.verify" path="vendor-management/up/offgrid/amc/verify-site" element={wrap(UPOffgridAMCVerifySite)} />,
  <Route key="vm.up.amc.offgrid.verify2" path="up/offgrid/amc/verify-site" element={wrap(UPOffgridAMCVerifySite)} />,

  // UP Survey: Resco Survey
  <Route key="vm.up.survey.resco.db" path="vendor-management/up/resco/survey/dashboard" element={wrap(UPRescoSurveyDashboard)} />,
  <Route key="vm.up.survey.resco.db2" path="vendor-management/up/resco-survey-dashboard" element={wrap(UPRescoSurveyDashboard)} />,
  <Route key="vm.up.survey.resco.db3" path="up/resco-survey-dashboard" element={wrap(UPRescoSurveyDashboard)} />,

  <Route key="vm.up.survey.resco.assign" path="vendor-management/up/resco/survey/assign" element={wrap(UPRescoSurveyAssign)} />,
  <Route key="vm.up.survey.resco.assign2" path="vendor-management/up/resco-survey-assign" element={wrap(UPRescoSurveyAssign)} />,
  <Route key="vm.up.survey.resco.assign3" path="up/resco-survey-assign" element={wrap(UPRescoSurveyAssign)} />,

  <Route key="vm.up.survey.resco.vassign" path="vendor-management/up/resco/survey/assign-view" element={wrap(UPRescoSurveyAssignView)} />,
  <Route key="vm.up.survey.resco.vassign2" path="vendor-management/up/resco-survey-assign-view" element={wrap(UPRescoSurveyAssignView)} />,
  <Route key="vm.up.survey.resco.vassign3" path="up/resco-survey-assign-view" element={wrap(UPRescoSurveyAssignView)} />,

  <Route key="vm.up.survey.resco.verify" path="vendor-management/up/resco/survey/verify" element={wrap(UPRescoSurveyVerify)} />,
  <Route key="vm.up.survey.resco.verify2" path="vendor-management/up/resco-survey-verify" element={wrap(UPRescoSurveyVerify)} />,
  <Route key="vm.up.survey.resco.verify3" path="up/resco-survey-verify" element={wrap(UPRescoSurveyVerify)} />,

  <Route key="vm.up.survey.resco.av" path="vendor-management/up/resco/survey/assign-vendor" element={wrap(UPRescoSurveyAssignVendor)} />,
  <Route key="vm.up.survey.resco.av2" path="vendor-management/up/resco-survey-assign-vendor" element={wrap(UPRescoSurveyAssignVendor)} />,
  <Route key="vm.up.survey.resco.av3" path="up/resco-survey-assign-vendor" element={wrap(UPRescoSurveyAssignVendor)} />,

  // ── SUPER ADMIN: BIHAR ──
  <Route key="vm.bihar.root" path="vendor-management/bihar" element={wrap(BiharSRT200MWSurveyDashboard)} />,
  <Route key="vm.bihar.inst" path="vendor-management/bihar/installation" element={wrap(BiharSSLInstallationDashboard)} />,

  // Bihar Survey: SRT 200MW
  <Route key="vm.bihar.srt200.db" path="vendor-management/bihar/srt200mw/survey/dashboard" element={wrap(BiharSRT200MWSurveyDashboard)} />,
  <Route key="vm.bihar.srt200.db2" path="vendor-management/bihar/srt200mw-survey-dashbboard" element={wrap(BiharSRT200MWSurveyDashboard)} />,
  <Route key="vm.bihar.srt200.db3" path="bihar/srt200mw-survey-dashbboard" element={wrap(BiharSRT200MWSurveyDashboard)} />,

  <Route key="vm.bihar.srt200.status" path="vendor-management/bihar/srt200mw/survey/status-view" element={wrap(BiharSRT200MWSurveyStatusView)} />,
  <Route key="vm.bihar.srt200.status2" path="vendor-management/bihar/srt200mw-survey-status-view" element={wrap(BiharSRT200MWSurveyStatusView)} />,
  <Route key="vm.bihar.srt200.status3" path="bihar/srt200mw/survey/status-view" element={wrap(BiharSRT200MWSurveyStatusView)} />,
  <Route key="vm.bihar.srt200.status4" path="bihar/srt200mw-survey-status-view" element={wrap(BiharSRT200MWSurveyStatusView)} />,

  <Route key="vm.bihar.srt200.assign" path="vendor-management/bihar/srt200mw/survey/assign" element={wrap(BiharSRT200MWSurveyAssign)} />,
  <Route key="vm.bihar.srt200.assign2" path="vendor-management/bihar/srt200mw-survey-assign" element={wrap(BiharSRT200MWSurveyAssign)} />,
  <Route key="vm.bihar.srt200.assign3" path="bihar/srt200mw-survey-assign" element={wrap(BiharSRT200MWSurveyAssign)} />,

  <Route key="vm.bihar.srt200.vassign" path="vendor-management/bihar/srt200mw/survey/assign-view" element={wrap(BiharSRT200MWSurveyAssignView)} />,
  <Route key="vm.bihar.srt200.vassign2" path="vendor-management/bihar/srt200mw-survey-assign-view" element={wrap(BiharSRT200MWSurveyAssignView)} />,
  <Route key="vm.bihar.srt200.vassign3" path="bihar/srt200mw-survey-assign-view" element={wrap(BiharSRT200MWSurveyAssignView)} />,

  <Route key="vm.bihar.srt200.verify" path="vendor-management/bihar/srt200mw/survey/verify" element={wrap(BiharSRT200MWSurveyVerify)} />,
  <Route key="vm.bihar.srt200.verify2" path="vendor-management/bihar/srt200mw-survey-verify" element={wrap(BiharSRT200MWSurveyVerify)} />,
  <Route key="vm.bihar.srt200.verify3" path="bihar/srt200mw-survey-verify" element={wrap(BiharSRT200MWSurveyVerify)} />,

  // Bihar Survey: ULA
  <Route key="vm.bihar.ula.survey.view" path="vendor-management/bihar/ula/survey/view" element={wrap(BiharULASurveyViewData)} />,
  <Route key="vm.bihar.ula.survey.view2" path="bihar/ula/survey/view" element={wrap(BiharULASurveyViewData)} />,

  // Bihar Installation: SSL
  <Route key="vm.bihar.ssl.inst.db" path="vendor-management/bihar/ssl/installation/dashboard" element={wrap(BiharSSLInstallationDashboard)} />,
  <Route key="vm.bihar.ssl.inst.db2" path="vendor-management/bihar/ssl-installation-dashboard" element={wrap(BiharSSLInstallationDashboard)} />,
  <Route key="vm.bihar.ssl.inst.db3" path="bihar/ssl-installation-dashboard" element={wrap(BiharSSLInstallationDashboard)} />,

  <Route key="vm.bihar.ssl.inst.assign" path="vendor-management/bihar/ssl/installation/assign" element={wrap(BiharSSLInstallationAssignLight)} />,
  <Route key="vm.bihar.ssl.inst.assign2" path="vendor-management/vendor/assign-ssl-sites" element={wrap(BiharSSLInstallationAssignLight)} />,
  <Route key="vm.bihar.ssl.inst.assign3" path="vendor/assign-ssl-sites" element={wrap(BiharSSLInstallationAssignLight)} />,

  <Route key="vm.bihar.ssl.inst.vassign" path="vendor-management/bihar/ssl/installation/view-assign" element={wrap(BiharSSLInstallationViewAssignLight)} />,
  <Route key="vm.bihar.ssl.inst.vassign2" path="vendor-management/vendor/view-assign-ssl-sites" element={wrap(BiharSSLInstallationViewAssignLight)} />,
  <Route key="vm.bihar.ssl.inst.vassign3" path="vendor/view-assign-ssl-sites" element={wrap(BiharSSLInstallationViewAssignLight)} />,

  <Route key="vm.bihar.ssl.inst.verify" path="vendor-management/bihar/ssl/installation/verify" element={wrap(BiharSSLInstallationVerifyLight)} />,
  <Route key="vm.bihar.ssl.inst.verify2" path="vendor-management/ssl/view-bihar-all-complete-ssl-site" element={wrap(BiharSSLInstallationVerifyLight)} />,
  <Route key="vm.bihar.ssl.inst.verify3" path="ssl/view-bihar-all-complete-ssl-site" element={wrap(BiharSSLInstallationVerifyLight)} />,

  <Route key="vm.bihar.ssl.inst.claim" path="vendor-management/bihar/ssl/installation/claim-request" element={wrap(BiharSSLInstallationClaimRequest)} />,
  <Route key="vm.bihar.ssl.inst.claim2" path="vendor-management/bihar/ssl-installation-claim-request" element={wrap(BiharSSLInstallationClaimRequest)} />,
  <Route key="vm.bihar.ssl.inst.claim3" path="bihar/ssl-installation-claim-request" element={wrap(BiharSSLInstallationClaimRequest)} />,

  <Route key="vm.bihar.ssl.inst.pay" path="vendor-management/bihar/ssl/installation/payment-request" element={wrap(BiharSSLInstallationPaymentRequest)} />,
  <Route key="vm.bihar.ssl.inst.pay2" path="vendor-management/bihar/view-ssl-payment-request" element={wrap(BiharSSLInstallationPaymentRequest)} />,
  <Route key="vm.bihar.ssl.inst.pay3" path="bihar/view-ssl-payment-request" element={wrap(BiharSSLInstallationPaymentRequest)} />,

  <Route key="vm.bihar.ssl.inst.supinsp" path="vendor-management/bihar/ssl/installation/supply-inspection" element={wrap(BiharSSLInstallationSupplyInspection)} />,
  <Route key="vm.bihar.ssl.inst.supinsp2" path="vendor-management/bihar/view-ssl-supply-installation-request" element={wrap(BiharSSLInstallationSupplyInspection)} />,
  <Route key="vm.bihar.ssl.inst.supinsp3" path="bihar/view-ssl-supply-installation-request" element={wrap(BiharSSLInstallationSupplyInspection)} />,

  <Route key="vm.bihar.ssl.inst.insp" path="vendor-management/bihar/ssl/installation/installation-inspection" element={wrap(BiharSSLInstallationInspectionRequest)} />,
  <Route key="vm.bihar.ssl.inst.insp2" path="vendor-management/bihar/view-ssl-installation-inspection-request" element={wrap(BiharSSLInstallationInspectionRequest)} />,
  <Route key="vm.bihar.ssl.inst.insp3" path="bihar/view-ssl-installation-inspection-request" element={wrap(BiharSSLInstallationInspectionRequest)} />,

  // Bihar Installation: SRT
  <Route key="vm.bihar.srt.inst.db" path="vendor-management/bihar/srt/installation/dashboard" element={wrap(BiharSRTInstallationDashboard)} />,
  <Route key="vm.bihar.srt.inst.db2" path="vendor-management/bihar/srt-installation-dashboard" element={wrap(BiharSRTInstallationDashboard)} />,
  <Route key="vm.bihar.srt.inst.db3" path="bihar/srt-installation-dashboard" element={wrap(BiharSRTInstallationDashboard)} />,

  <Route key="vm.bihar.srt.inst.assign" path="vendor-management/bihar/srt/installation/assign" element={wrap(BiharSRTInstallationAssignSites)} />,
  <Route key="vm.bihar.srt.inst.assign_sites" path="vendor-management/bihar/srt/installation/assign-sites" element={wrap(BiharSRTInstallationAssignSites)} />,
  <Route key="vm.bihar.srt.inst.assign_short" path="bihar/srt/installation/assign" element={wrap(BiharSRTInstallationAssignSites)} />,
  <Route key="vm.bihar.srt.inst.assign_sites_short" path="bihar/srt/installation/assign-sites" element={wrap(BiharSRTInstallationAssignSites)} />,
  <Route key="vm.bihar.srt.inst.assign2" path="vendor-management/srt/assign-srt" element={wrap(BiharSRTInstallationAssignSites)} />,
  <Route key="vm.bihar.srt.inst.assign3" path="srt/assign-srt" element={wrap(BiharSRTInstallationAssignSites)} />,

  <Route key="vm.bihar.srt.inst.vassign" path="vendor-management/bihar/srt/installation/view-assign" element={wrap(BiharSRTInstallationViewAssignSites)} />,
  <Route key="vm.bihar.srt.inst.vassign_sites" path="vendor-management/bihar/srt/installation/view-assign-sites" element={wrap(BiharSRTInstallationViewAssignSites)} />,
  <Route key="vm.bihar.srt.inst.vassign_short" path="bihar/srt/installation/view-assign" element={wrap(BiharSRTInstallationViewAssignSites)} />,
  <Route key="vm.bihar.srt.inst.vassign_sites_short" path="bihar/srt/installation/view-assign-sites" element={wrap(BiharSRTInstallationViewAssignSites)} />,
  <Route key="vm.bihar.srt.inst.vassign2" path="vendor-management/srt/view" element={wrap(BiharSRTInstallationViewAssignSites)} />,
  <Route key="vm.bihar.srt.inst.vassign3" path="srt/view" element={wrap(BiharSRTInstallationViewAssignSites)} />,

  <Route key="vm.bihar.srt.inst.verify" path="vendor-management/bihar/srt/installation/verify" element={wrap(BiharSRTInstallationVerifySites)} />,
  <Route key="vm.bihar.srt.inst.verify_sites" path="vendor-management/bihar/srt/installation/verify-sites" element={wrap(BiharSRTInstallationVerifySites)} />,
  <Route key="vm.bihar.srt.inst.verify_short" path="bihar/srt/installation/verify" element={wrap(BiharSRTInstallationVerifySites)} />,
  <Route key="vm.bihar.srt.inst.verify_sites_short" path="bihar/srt/installation/verify-sites" element={wrap(BiharSRTInstallationVerifySites)} />,
  <Route key="vm.bihar.srt.inst.verify2" path="vendor-management/srt/verificationsite" element={wrap(BiharSRTInstallationVerifySites)} />,
  <Route key="vm.bihar.srt.inst.verify3" path="srt/verificationsite" element={wrap(BiharSRTInstallationVerifySites)} />,

  <Route key="vm.bihar.srt.inst.claim" path="vendor-management/bihar/srt/installation/claim" element={wrap(BiharSRTInstallationViewClaim)} />,
  <Route key="vm.bihar.srt.inst.claim_view" path="vendor-management/bihar/srt/installation/view-claim" element={wrap(BiharSRTInstallationViewClaim)} />,
  <Route key="vm.bihar.srt.inst.claim_short" path="bihar/srt/installation/claim" element={wrap(BiharSRTInstallationViewClaim)} />,
  <Route key="vm.bihar.srt.inst.claim_view_short" path="bihar/srt/installation/view-claim" element={wrap(BiharSRTInstallationViewClaim)} />,
  <Route key="vm.bihar.srt.inst.claim2" path="vendor-management/srt/claimsite" element={wrap(BiharSRTInstallationViewClaim)} />,
  <Route key="vm.bihar.srt.inst.claim3" path="srt/claimsite" element={wrap(BiharSRTInstallationViewClaim)} />,

  <Route key="vm.bihar.srt.inst.pay" path="vendor-management/bihar/srt/installation/payment" element={wrap(BiharSRTInstallationViewPayment)} />,
  <Route key="vm.bihar.srt.inst.pay_view" path="vendor-management/bihar/srt/installation/view-payment" element={wrap(BiharSRTInstallationViewPayment)} />,
  <Route key="vm.bihar.srt.inst.pay_short" path="bihar/srt/installation/payment" element={wrap(BiharSRTInstallationViewPayment)} />,
  <Route key="vm.bihar.srt.inst.pay_view_short" path="bihar/srt/installation/view-payment" element={wrap(BiharSRTInstallationViewPayment)} />,
  <Route key="vm.bihar.srt.inst.pay2" path="vendor-management/srt/assignsrtpayment" element={wrap(BiharSRTInstallationViewPayment)} />,
  <Route key="vm.bihar.srt.inst.pay3" path="srt/assignsrtpayment" element={wrap(BiharSRTInstallationViewPayment)} />,

  // Bihar Installation: ULA
  <Route key="vm.bihar.ula.inst.db" path="vendor-management/bihar/ula/installation/dashboard" element={wrap(BiharVMULAInstallationDashboard)} />,
  <Route key="vm.bihar.ula.inst.db2" path="vendor-management/bihar/ula-installation-dashboard" element={wrap(BiharVMULAInstallationDashboard)} />,
  <Route key="vm.bihar.ula.inst.db3" path="bihar/ula/installation/dashboard" element={wrap(BiharVMULAInstallationDashboard)} />,

  <Route key="vm.bihar.ula.inst.status" path="vendor-management/bihar/ula/installation/status-view" element={wrap(BiharULAInstallationStatusView)} />,
  <Route key="vm.bihar.ula.inst.status2" path="vendor-management/bihar/ula-installation-status-view" element={wrap(BiharULAInstallationStatusView)} />,
  <Route key="vm.bihar.ula.inst.status3" path="bihar/ula/installation/status-view" element={wrap(BiharULAInstallationStatusView)} />,
  <Route key="vm.bihar.ula.inst.status4" path="bihar/ula-installation-status-view" element={wrap(BiharULAInstallationStatusView)} />,

  <Route key="vm.bihar.ula.inst.cassign" path="vendor-management/bihar/ula/installation/create-assign-site" element={wrap(BiharULAInstallationAssignSites)} />,
  <Route key="vm.bihar.ula.inst.cassign2" path="bihar/ula/installation/create-assign-site" element={wrap(BiharULAInstallationAssignSites)} />,

  <Route key="vm.bihar.ula.inst.vassign" path="vendor-management/bihar/ula/installation/view-assign-site" element={wrap(BiharULAInstallationViewAssignSites)} />,
  <Route key="vm.bihar.ula.inst.vassign2" path="bihar/ula/installation/view-assign-site" element={wrap(BiharULAInstallationViewAssignSites)} />,

  <Route key="vm.bihar.ula.inst.sapp" path="vendor-management/bihar/ula/installation/structure-approval-site" element={wrap(BiharULAInstallationStructureApproval)} />,
  <Route key="vm.bihar.ula.inst.sapp2" path="bihar/ula/installation/structure-approval-site" element={wrap(BiharULAInstallationStructureApproval)} />,

  <Route key="vm.bihar.ula.inst.vsite" path="vendor-management/bihar/ula/installation/view-site" element={wrap(BiharULAInstallationViewSite)} />,
  <Route key="vm.bihar.ula.inst.vsite2" path="bihar/ula/installation/view-site" element={wrap(BiharULAInstallationViewSite)} />,

  <Route key="vm.bihar.ula.inst.vdoc" path="vendor-management/bihar/ula/installation/view-document" element={wrap(BiharULAInstallationViewDocument)} />,
  <Route key="vm.bihar.ula.inst.vdoc2" path="bihar/ula/installation/view-document" element={wrap(BiharULAInstallationViewDocument)} />,

  <Route key="vm.bihar.ula.inst.vclaim" path="vendor-management/bihar/ula/installation/view-claim" element={wrap(BiharULAInstallationViewClaim)} />,
  <Route key="vm.bihar.ula.inst.vclaim2" path="bihar/ula/installation/view-claim" element={wrap(BiharULAInstallationViewClaim)} />,

  <Route key="vm.bihar.ula.inst.vpay" path="vendor-management/bihar/ula/installation/view-payment" element={wrap(BiharULAInstallationViewPayment)} />,
  <Route key="vm.bihar.ula.inst.vpay2" path="bihar/ula/installation/view-payment" element={wrap(BiharULAInstallationViewPayment)} />,

  // Bihar AMC: SSL
  <Route key="vm.bihar.amc.ssl.db" path="vendor-management/bihar/ssl/amc/dashboard" element={wrap(BiharSSLAMCDashboard)} />,
  <Route key="vm.bihar.amc.ssl.db2" path="vendor-management/bihar-ssl-amc-dashboard" element={wrap(BiharSSLAMCDashboard)} />,
  <Route key="vm.bihar.amc.ssl.db3" path="bihar-ssl-amc-dashboard" element={wrap(BiharSSLAMCDashboard)} />,

  <Route key="vm.bihar.amc.ssl.assign" path="vendor-management/bihar/ssl/amc/assign" element={wrap(BiharSSLAMCAssignSSL)} />,
  <Route key="vm.bihar.amc.ssl.assign2" path="vendor-management/assign-vendor-biharssl" element={wrap(BiharSSLAMCAssignSSL)} />,
  <Route key="vm.bihar.amc.ssl.assign3" path="assign-vendor-biharssl" element={wrap(BiharSSLAMCAssignSSL)} />,

  <Route key="vm.bihar.amc.ssl.verify" path="vendor-management/bihar/ssl/amc/verify" element={wrap(BiharSSLAMCVerrifyAMC)} />,
  <Route key="vm.bihar.amc.ssl.verify2" path="vendor-management/bihar-ssl-amc-verify" element={wrap(BiharSSLAMCVerrifyAMC)} />,
  <Route key="vm.bihar.amc.ssl.verify3" path="bihar-ssl-amc-verify" element={wrap(BiharSSLAMCVerrifyAMC)} />,

  <Route key="vm.bihar.amc.ssl.status" path="vendor-management/bihar/ssl/amc/status-view" element={wrap(BiharSSLAMCStatusView)} />,
  <Route key="vm.bihar.amc.ssl.status2" path="vendor-management/bihar-ssl-amc-status-view" element={wrap(BiharSSLAMCStatusView)} />,
  <Route key="vm.bihar.amc.ssl.status3" path="bihar/ssl/amc/status-view" element={wrap(BiharSSLAMCStatusView)} />,
  <Route key="vm.bihar.amc.ssl.status4" path="bihar-ssl-amc-status-view" element={wrap(BiharSSLAMCStatusView)} />,

  // Bihar AMC: SRT
  <Route key="vm.bihar.amc.srt.db" path="vendor-management/bihar/srt/amc/dashboard" element={wrap(BiharSRTAMCDashboard)} />,
  <Route key="vm.bihar.amc.srt.db2" path="vendor-management/bihar/bihar-srt-amc-dashboard" element={wrap(BiharSRTAMCDashboard)} />,
  <Route key="vm.bihar.amc.srt.db3" path="bihar/bihar-srt-amc-dashboard" element={wrap(BiharSRTAMCDashboard)} />,

  <Route key="vm.bihar.amc.srt.assign" path="vendor-management/bihar/srt/amc/assign" element={wrap(BiharSRTAMCAssignSRT)} />,
  <Route key="vm.bihar.amc.srt.assign2" path="vendor-management/assign-vendor-srt-bihar" element={wrap(BiharSRTAMCAssignSRT)} />,
  <Route key="vm.bihar.amc.srt.assign3" path="assign-vendor-srt-bihar" element={wrap(BiharSRTAMCAssignSRT)} />,

  <Route key="vm.bihar.amc.srt.vassign" path="vendor-management/bihar/srt/amc/view-assign" element={wrap(BiharSRTAMCAssignViewSite)} />,
  <Route key="vm.bihar.amc.srt.vassign2" path="vendor-management/bihar-srt-amc-assign-site-view" element={wrap(BiharSRTAMCAssignViewSite)} />,
  <Route key="vm.bihar.amc.srt.vassign3" path="bihar-srt-amc-assign-site-view" element={wrap(BiharSRTAMCAssignViewSite)} />,

  <Route key="vm.bihar.amc.srt.verify" path="vendor-management/bihar/srt/amc/verify" element={wrap(BiharSRTAMCVerifySite)} />,
  <Route key="vm.bihar.amc.srt.verify2" path="vendor-management/bihar-amc-srt-site-verify" element={wrap(BiharSRTAMCVerifySite)} />,
  <Route key="vm.bihar.amc.srt.verify3" path="bihar-amc-srt-site-verify" element={wrap(BiharSRTAMCVerifySite)} />,

  // ── SUPER ADMIN: JAMMU ──


  // ── SUPER ADMIN: KASHMIR ──
  <Route key="vm.kashmir.root" path="vendor-management/kashmir" element={wrap(KashmirSRT70MWInstallationDashboard)} />,
  <Route key="vm.kashmir.inst" path="vendor-management/kashmir/installation" element={wrap(KashmirSRT70MWInstallationDashboard)} />,

  // Kashmir Installation: SRT 70MW
  <Route key="vm.kashmir.srt.inst.db" path="vendor-management/kashmir/srt70mw/installation/dashboard" element={wrap(KashmirSRT70MWInstallationDashboard)} />,
  <Route key="vm.kashmir.srt.inst.db2" path="kashmir/srt70mw/installation-dashboard" element={wrap(KashmirSRT70MWInstallationDashboard)} />,

  <Route key="vm.kashmir.srt.inst.assign" path="vendor-management/kashmir/srt70mw/installation/assign" element={wrap(KashmirSRT70MWInstallationAssignSites)} />,
  <Route key="vm.kashmir.srt.inst.assign2" path="vendor-management/kashmir/assign-installation-srt70mw" element={wrap(KashmirSRT70MWInstallationAssignSites)} />,
  <Route key="vm.kashmir.srt.inst.assign3" path="kashmir/assign-installation-srt70mw" element={wrap(KashmirSRT70MWInstallationAssignSites)} />,

  <Route key="vm.kashmir.srt.inst.vassign" path="vendor-management/kashmir/srt70mw/installation/view-assign" element={wrap(KashmirSRT70MWInstallationViewAssignSites)} />,
  <Route key="vm.kashmir.srt.inst.vassign2" path="vendor-management/kashmir/view-assign-installation-srt70mw" element={wrap(KashmirSRT70MWInstallationViewAssignSites)} />,
  <Route key="vm.kashmir.srt.inst.vassign3" path="kashmir/view-assign-installation-srt70mw" element={wrap(KashmirSRT70MWInstallationViewAssignSites)} />,

  <Route key="vm.kashmir.srt.inst.verify" path="vendor-management/kashmir/srt70mw/installation/verify" element={wrap(KashmirSRT70MWInstallationVerifySites)} />,
  <Route key="vm.kashmir.srt.inst.verify2" path="vendor-management/kashmir/verify-srt70mw-installation" element={wrap(KashmirSRT70MWInstallationVerifySites)} />,
  <Route key="vm.kashmir.srt.inst.verify3" path="kashmir/verify-srt70mw-installation" element={wrap(KashmirSRT70MWInstallationVerifySites)} />,

  <Route key="vm.kashmir.srt.inst.claim" path="vendor-management/kashmir/srt70mw/installation/view-claim" element={wrap(KashmirSRT70MWInstallationViewClaim)} />,
  <Route key="vm.kashmir.srt.inst.claim2" path="vendor-management/kashmir/view-srt70mw-claim-request" element={wrap(KashmirSRT70MWInstallationViewClaim)} />,
  <Route key="vm.kashmir.srt.inst.claim3" path="kashmir/view-srt70mw-claim-request" element={wrap(KashmirSRT70MWInstallationViewClaim)} />,

  <Route key="vm.kashmir.srt.inst.pay" path="vendor-management/kashmir/srt70mw/installation/view-payment" element={wrap(KashmirSRT70MWInstallationViewPayment)} />,
  <Route key="vm.kashmir.srt.inst.pay2" path="vendor-management/kashmir/view-srt70mw-payment-request" element={wrap(KashmirSRT70MWInstallationViewPayment)} />,
  <Route key="vm.kashmir.srt.inst.pay3" path="kashmir/view-srt70mw-payment-request" element={wrap(KashmirSRT70MWInstallationViewPayment)} />,

  <Route key="vm.kashmir.srt.inst.status" path="vendor-management/kashmir/srt70mw/installation/status-view" element={wrap(KashmirSRT70MWInstallationStatusView)} />,
  <Route key="vm.kashmir.srt.inst.status2" path="kashmir/srt70mw/installation/status-view" element={wrap(KashmirSRT70MWInstallationStatusView)} />,

  // Kashmir Expense: SRT 70MW
  <Route key="vm.kashmir.exp.claim" path="vendor-management/kashmir/srt70mw/expense/claim-requests" element={wrap(KashmirSRT70MWExpenseClaimRequests)} />,
  <Route key="vm.kashmir.exp.claim2" path="vendor-management/kashmir/srt-installation-claim-expense" element={wrap(KashmirSRT70MWExpenseClaimRequests)} />,
  <Route key="vm.kashmir.exp.claim3" path="kashmir/srt-installation-claim-expense" element={wrap(KashmirSRT70MWExpenseClaimRequests)} />,

  <Route key="vm.kashmir.exp.pay" path="vendor-management/kashmir/srt70mw/expense/view-payments" element={wrap(KashmirSRT70MWExpenseViewPayments)} />,
  <Route key="vm.kashmir.exp.pay2" path="vendor-management/kashmir/srt-installation-view-payment-expense" element={wrap(KashmirSRT70MWExpenseViewPayments)} />,
  <Route key="vm.kashmir.exp.pay3" path="kashmir/srt-installation-view-payment-expense" element={wrap(KashmirSRT70MWExpenseViewPayments)} />,

  // ── SUPER ADMIN: GOA ──
  <Route key="vm.goa.root" path="vendor-management/goa" element={wrap(GoaSRTSurveyDashboard)} />,
  <Route key="vm.goa.inst" path="vendor-management/goa/installation" element={wrap(GoaSRTInstallationDashboard)} />,

  // Goa Survey: SRT
  <Route key="vm.goa.survey.db" path="vendor-management/goa/srt/survey/dashboard" element={wrap(GoaSRTSurveyDashboard)} />,
  <Route key="vm.goa.survey.db2" path="vendor-management/goa/srt/survey-dashbboard" element={wrap(GoaSRTSurveyDashboard)} />,
  <Route key="vm.goa.survey.db3" path="goa/srt/survey-dashbboard" element={wrap(GoaSRTSurveyDashboard)} />,

  <Route key="vm.goa.survey.assign" path="vendor-management/goa/srt/survey/assign" element={wrap(GoaSRTSurveyAssign)} />,
  <Route key="vm.goa.survey.assign2" path="vendor-management/goa/srt/survey-assign" element={wrap(GoaSRTSurveyAssign)} />,
  <Route key="vm.goa.survey.assign3" path="goa/srt/survey-assign" element={wrap(GoaSRTSurveyAssign)} />,

  <Route key="vm.goa.survey.vassign" path="vendor-management/goa/srt/survey/assign-view" element={wrap(GoaSRTSurveyAssignView)} />,
  <Route key="vm.goa.survey.vassign2" path="vendor-management/goa/srt/survey-assign-view" element={wrap(GoaSRTSurveyAssignView)} />,
  <Route key="vm.goa.survey.vassign3" path="goa/srt/survey-assign-view" element={wrap(GoaSRTSurveyAssignView)} />,

  <Route key="vm.goa.survey.verify" path="vendor-management/goa/srt/survey/verify" element={wrap(GoaSRTSurveyVerify)} />,
  <Route key="vm.goa.survey.verify2" path="vendor-management/goa/srt/survey-verify" element={wrap(GoaSRTSurveyVerify)} />,
  <Route key="vm.goa.survey.verify3" path="goa/srt/survey-verify" element={wrap(GoaSRTSurveyVerify)} />,

  // Goa Installation: SRT
  <Route key="vm.goa.inst.db" path="vendor-management/goa/srt/installation/dashboard" element={wrap(GoaSRTInstallationDashboard)} />,
  <Route key="vm.goa.inst.db2" path="vendor-management/goa/srt-installation-dashboard" element={wrap(GoaSRTInstallationDashboard)} />,
  <Route key="vm.goa.inst.db3" path="goa/srt-installation-dashboard" element={wrap(GoaSRTInstallationDashboard)} />,

  <Route key="vm.goa.inst.assign" path="vendor-management/goa/srt/installation/assign" element={wrap(GoaSRTInstallationAssignSites)} />,
  <Route key="vm.goa.inst.assign2" path="vendor-management/goa/srt/assign-srt" element={wrap(GoaSRTInstallationAssignSites)} />,
  <Route key="vm.goa.inst.assign3" path="goa/srt/assign-srt" element={wrap(GoaSRTInstallationAssignSites)} />,

  <Route key="vm.goa.inst.vassign" path="vendor-management/goa/srt/installation/view-assign" element={wrap(GoaSRTInstallationViewAssignSites)} />,
  <Route key="vm.goa.inst.vassign2" path="vendor-management/goa/srt/view" element={wrap(GoaSRTInstallationViewAssignSites)} />,
  <Route key="vm.goa.inst.vassign3" path="goa/srt/view" element={wrap(GoaSRTInstallationViewAssignSites)} />,

  <Route key="vm.goa.inst.verify" path="vendor-management/goa/srt/installation/verify" element={wrap(GoaSRTInstallationVerifySites)} />,
  <Route key="vm.goa.inst.verify2" path="vendor-management/goa/srt/verificationsite" element={wrap(GoaSRTInstallationVerifySites)} />,
  <Route key="vm.goa.inst.verify3" path="goa/srt/verificationsite" element={wrap(GoaSRTInstallationVerifySites)} />,

  <Route key="vm.goa.inst.claim" path="vendor-management/goa/srt/installation/claim" element={wrap(GoaSRTInstallationViewClaim)} />,
  <Route key="vm.goa.inst.claim2" path="vendor-management/goa/srt/claimsite" element={wrap(GoaSRTInstallationViewClaim)} />,
  <Route key="vm.goa.inst.claim3" path="goa/srt/claimsite" element={wrap(GoaSRTInstallationViewClaim)} />,

  <Route key="vm.goa.inst.pay" path="vendor-management/goa/srt/installation/payment" element={wrap(GoaSRTInstallationViewPayment)} />,
  <Route key="vm.goa.inst.pay2" path="vendor-management/goa/srt/assignsrtpayment" element={wrap(GoaSRTInstallationViewPayment)} />,
  <Route key="vm.goa.inst.pay3" path="goa/srt/assignsrtpayment" element={wrap(GoaSRTInstallationViewPayment)} />,

  // Goa AMC: SRT
  <Route key="vm.goa.amc.db" path="vendor-management/goa/srt/amc/dashboard" element={wrap(GoaSRTAMCDashboard)} />,
  <Route key="vm.goa.amc.db2" path="vendor-management/goa/goa-srt-amc-dashboard" element={wrap(GoaSRTAMCDashboard)} />,
  <Route key="vm.goa.amc.db3" path="goa/goa-srt-amc-dashboard" element={wrap(GoaSRTAMCDashboard)} />,

  <Route key="vm.goa.amc.assign" path="vendor-management/goa/srt/amc/assign" element={wrap(GoaSRTAMCAssignSRT)} />,
  <Route key="vm.goa.amc.assign2" path="vendor-management/assign-vendor-srt-goa" element={wrap(GoaSRTAMCAssignSRT)} />,
  <Route key="vm.goa.amc.assign3" path="assign-vendor-srt-goa" element={wrap(GoaSRTAMCAssignSRT)} />,

  <Route key="vm.goa.amc.vassign" path="vendor-management/goa/srt/amc/view-assign" element={wrap(GoaSRTAMCAssignViewSite)} />,
  <Route key="vm.goa.amc.vassign2" path="vendor-management/goa-srt-amc-assign-site-view" element={wrap(GoaSRTAMCAssignViewSite)} />,
  <Route key="vm.goa.amc.vassign3" path="goa-srt-amc-assign-site-view" element={wrap(GoaSRTAMCAssignViewSite)} />,

  <Route key="vm.goa.amc.verify" path="vendor-management/goa/srt/amc/verify" element={wrap(GoaSRTAMCVerifySite)} />,
  <Route key="vm.goa.amc.verify2" path="vendor-management/goa-amc-srt-site-verify" element={wrap(GoaSRTAMCVerifySite)} />,
  <Route key="vm.goa.amc.verify3" path="goa-amc-srt-site-verify" element={wrap(GoaSRTAMCVerifySite)} />,



  // Punjab Installation: SSL


  // ── SUPER ADMIN: VENDOR OPERATIONS ──
  // Vendor Master
  <Route key="vm.ops.vendor.add" path="vendor-management/vendor/add" element={wrap(VendorAddData)} />,
  <Route key="vm.ops.vendor.add2" path="add-vendor" element={wrap(VendorAddData)} />,
  <Route key="vm.ops.vendor.view" path="vendor-management/vendor/view" element={wrap(VendorViewData)} />,
  <Route key="vm.ops.vendor.view2" path="view-vendor" element={wrap(VendorViewData)} />,

  // DLE Users
  <Route key="vm.ops.dle.users" path="vendor-management/dle-users" element={wrap(VendorDLEUsersViewData)} />,

  // Work Order
  <Route key="vm.ops.wo.add" path="vendor-management/workorder/add" element={wrap(VendorWorkOrderAdd)} />,
  <Route key="vm.ops.wo.add2" path="vendor/add-workorder" element={wrap(VendorWorkOrderAdd)} />,
  <Route key="vm.ops.wo.view" path="vendor-management/workorder/view" element={wrap(VendorWorkOrderView)} />,
  <Route key="vm.ops.wo.view2" path="vendor/view-workorder" element={wrap(VendorWorkOrderView)} />,

  // Work Order Assign
  <Route key="vm.ops.woa.add" path="vendor-management/workorder-assign/add" element={wrap(VendorWorkOrderAssignAdd)} />,
  <Route key="vm.ops.woa.add2" path="vendor/add-workorder-assign" element={wrap(VendorWorkOrderAssignAdd)} />,
  <Route key="vm.ops.woa.view" path="vendor-management/workorder-assign/view" element={wrap(VendorWorkOrderAssignView)} />,
  <Route key="vm.ops.woa.view2" path="vendor/view-workorder-assign" element={wrap(VendorWorkOrderAssignView)} />,

  // Return & Maintenance
  <Route key="vm.ops.rm.view" path="vendor-management/rm-request/view" element={wrap(VendorReturnMaintenanceView)} />,
  <Route key="vm.ops.rm.view2" path="vendor/view-rm-request" element={wrap(VendorReturnMaintenanceView)} />,

  // Payments
  <Route key="vm.ops.pay.view" path="vendor-management/payment/view" element={wrap(VendorPaymentView)} />,
  <Route key="vm.ops.pay.view2" path="view-payment" element={wrap(VendorPaymentView)} />,

  // Vendor Complaint
  <Route key="vm.ops.comp.view" path="vendor-management/complaint/view" element={wrap(VendorComplaintView)} />,
  <Route key="vm.ops.comp.view2" path="view-vendor-complaint" element={wrap(VendorComplaintView)} />,

  // Vendor Report
  <Route key="vm.ops.rep.view" path="vendor-management/report/view-daily-progress" element={wrap(VendorDailyProgressReport)} />,
  <Route key="vm.ops.rep.view2" path="view-daily-progress" element={wrap(VendorDailyProgressReport)} />,
  // Additional Route Aliases & Missing Navigation Targets
  <Route key="vm.jammu.db.alias1" path="jammu/dashboard" element={<Navigate to="/vendor-management/jammu/installation/srt-70mw/dashboard" replace />} />,
  <Route key="vm.jammu.db.alias2" path="vendor-management/jammu/dashboard" element={<Navigate to="/vendor-management/jammu/installation/srt-70mw/dashboard" replace />} />,
  <Route key="vm.jammu.db.alias3" path="jammu/installation/srt-70mw/dashboard" element={wrap(JammuSrtDashboard)} />,

  <Route key="vm.bihar.ula.pay1" path="vendor-management/bihar/ula/installation/payment-view" element={wrap(BiharULAInstallationViewPayment)} />,
  <Route key="vm.bihar.ula.pay2" path="bihar/ula/installation/payment-view" element={wrap(BiharULAInstallationViewPayment)} />,

  <Route key="vm.jammu.resco.vsurv1" path="vendor-management/jammu/survey/resco/verify-survey" element={wrap(JammuVerifySurvey)} />,
  <Route key="vm.jammu.resco.vsurv2" path="jammu/survey/resco/verify-survey" element={wrap(JammuVerifySurvey)} />,

  <Route key="vm.jammu.srt.vsurv1" path="vendor-management/jammu/survey/srt-70mw/verify-survey" element={wrap(JammuVerifySrt70MWSurvey)} />,
  <Route key="vm.jammu.srt.vsurv2" path="jammu/survey/srt-70mw/verify-survey" element={wrap(JammuVerifySrt70MWSurvey)} />,

  <Route key="vm.punjab.ssl.inst1" path="vendor-management/punjab/ssl/install-light" element={wrap(PunjabInstallLight)} />,
  <Route key="vm.punjab.ssl.inst2" path="punjab/ssl/install-light" element={wrap(PunjabInstallLight)} />,
  <Route key="vm.punjab.ssl.inst3" path="punjab/ssl/installation/install-light" element={wrap(PunjabInstallLight)} />,

  // State Root Shortcuts
  <Route key="vm.root.bihar" path="bihar" element={<Navigate to="/vendor-management/bihar" replace />} />,
  <Route key="vm.root.karnataka" path="karnataka" element={<Navigate to="/vendor-management/karnataka" replace />} />,
  <Route key="vm.root.assam" path="assam" element={<Navigate to="/vendor-management/assam/swp/dashboard" replace />} />,
  <Route key="vm.root.up" path="up" element={<Navigate to="/vendor-management/up/kusumc/installation/dashboard" replace />} />,
  <Route key="vm.root.jammu" path="jammu" element={<Navigate to="/vendor-management/jammu/installation/srt-70mw/dashboard" replace />} />,
];
