export const STATE_NAME = 'Bihar';

// Survey
export { AssignBiharSRT200MWSurvey, AssignBiharSRT200MWSurvey as BiharSRT200MWSurveyAssign } from './Survey/SRT_200MW/AssignSurvey';
export { ViewAssignBiharSRT200MWSurvey, ViewAssignBiharSRT200MWSurvey as BiharSRT200MWSurveyAssignView } from './Survey/SRT_200MW/ViewAssignSurvey';
export { VerifyBiharSRT200Survey, VerifyBiharSRT200Survey as BiharSRT200MWSurveyVerify } from './Survey/SRT_200MW/VerifySurvey';
export { BiharSRT200MWSurveyDashboard } from './Survey/SRT_200MW/SRT200MWSurveyDashboard';
export { BiharSRT200MWSurveyStatusView } from './Survey/SRT_200MW/StatusView';
export { BiharULASurveyViewData } from './Survey/ULA/ViewULASurvey';

// Installation: SSL
export { BiharSSLInstallationDashboard } from './Installation/SSL/SSLInstallationDashboard';
export { BiharSSLInstallationAssignLight } from './Installation/SSL/AssignLight';
export { BiharSSLInstallationViewAssignLight } from './Installation/SSL/ViewAssignLight';
export { BiharSSLInstallationVerifyLight } from './Installation/SSL/VerifyLight';
export { BiharSSLInstallationClaimRequest } from './Installation/SSL/ClaimRequest';
export { BiharSSLInstallationPaymentRequest } from './Installation/SSL/PaymentRequest';
export { BiharSSLInstallationSupplyInspection } from './Installation/SSL/SupplyInspection';
export { BiharSSLInstallationInspectionRequest } from './Installation/SSL/InstallationInspection';

// Installation: SRT
export { BiharSRTInstallationDashboard } from './Installation/SRT/SRTInstallationDashboard';
export { BiharSRTInstallationAssignSites } from './Installation/SRT/AssignSites';
export { BiharSRTInstallationViewAssignSites } from './Installation/SRT/ViewAssignSites';
export { BiharSRTInstallationVerifySites } from './Installation/SRT/VerifySites';
export { BiharSRTInstallationViewClaim } from './Installation/SRT/ViewClaim';
export { BiharSRTInstallationViewPayment } from './Installation/SRT/ViewPayment';

// Installation: ULA
export { BiharULAInstallationDashboard } from './Installation/ULA/ULAInstallationDashboard';
export { BiharULAInstallationStatusView } from './Installation/ULA/StatusView';
export { BiharULAInstallationAssignSites } from './Installation/ULA/AssignSites';
export { BiharULAInstallationViewAssignSites } from './Installation/ULA/ViewAssignSites';
export { BiharULAInstallationStructureApproval } from './Installation/ULA/StructureApproval';
export { BiharULAInstallationViewSite } from './Installation/ULA/VerifyInstallation';
export { BiharULAInstallationViewDocument } from './Installation/ULA/ViewDocument';
export { BiharULAInstallationViewClaim } from './Installation/ULA/ViewClaim';
export { BiharULAInstallationViewPayment } from './Installation/ULA/ViewPayment';

// AMC: SSL
export { BiharSSLAMCDashboard } from './AMC/SSLAMCDashboard';
export { BiharSSLAMCAssignSSL } from './AMC/AssignSSL';
export { BiharSSLAMCVerrifyAMC } from './AMC/VerifyAMC';
export { BiharSSLAMCStatusView } from './AMC/StatusView';

// AMC: SRT
export { BiharSRTAMCDashboard } from './AMC/SRTAMCDashboard';
export { BiharSRTAMCAssignSRT } from './AMC/AssignSRT';
export { BiharSRTAMCAssignViewSite } from './AMC/ViewAssignSRT';
export { BiharSRTAMCVerifySite } from './AMC/VerifySRT';

export * from './bihar-types';
export * from './bihar-services/biharAdminService';
