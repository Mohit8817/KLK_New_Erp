export const STATE_NAME = 'Jammu';

// ── 1. Survey System ──
// SRT 70MW Survey
export { default as VerifySrt70MWSurvey } from './Survey/SRT_70MW/VerifySrt70MWSurvey';

// RESCO Survey
export { default as RescoDashboard } from './Survey/Resco/RescoDashboard';
export { default as AssignRescoSurvey } from './Survey/Resco/AssignRescoSurvey';
export { default as AssignViewSurvey } from './Survey/Resco/AssignViewSurvey';
export { default as AssignedSurveyVendor } from './Survey/Resco/AssignedSurveyVendor';
export { default as VerifySurvey } from './Survey/Resco/VerifySurvey';

// ── 2. Installation System ──
// SRT (70MW Rooftop)
export { default as SrtDashboard } from './Installation/SRT_70MW/SrtDashboard';
export { default as AssignSrtSites } from './Installation/SRT_70MW/AssignSrtSites';
export { default as ViewAssignSrtSites } from './Installation/SRT_70MW/ViewAssignSrtSites';
export { default as VerifySrtSites } from './Installation/SRT_70MW/VerifySrtSites';
export { default as ViewSrtClaim } from './Installation/SRT_70MW/ViewSrtClaim';
export { default as ViewSrtPayment } from './Installation/SRT_70MW/ViewSrtPayment';

// SSL (Solar Street Light)
export { default as SslDashboard } from './Installation/SSL/SslDashboard';
export { default as AssignSslLights } from './Installation/SSL/AssignSslLights';
export { default as ViewAssignSslLights } from './Installation/SSL/ViewAssignSslLights';
export { default as VerifySslLights } from './Installation/SSL/VerifySslLights';
export { default as SslClaimRequest } from './Installation/SSL/SslClaimRequest';
export { default as SslPaymentRequest } from './Installation/SSL/SslPaymentRequest';

// SWP (Solar Water Pump)
export { default as SwpDashboard } from './Installation/SWP/SwpDashboard';
export { default as AssignSwpInstallation } from './Installation/SWP/AssignSwpInstallation';
export { default as ViewAssignSwpInstallation } from './Installation/SWP/ViewAssignSwpInstallation';
export { default as VerifySwpInstallation } from './Installation/SWP/VerifySwpInstallation';
export { default as VerifySwpDocument } from './Installation/SWP/VerifySwpDocument';
export { default as VerifySwpClaim } from './Installation/SWP/VerifySwpClaim';
export { default as ViewSwpPayment } from './Installation/SWP/ViewSwpPayment';

// RESCO Installation
export { default as RescoInstallationDashboard } from './Installation/Resco/RescoDashboard';
export { default as AssignRescoInstallation } from './Installation/Resco/AssignRescoInstallation';
export { default as ViewAssignRescoInstallation } from './Installation/Resco/ViewAssignRescoInstallation';
export { default as ViewAssignVendorInstallation } from './Installation/Resco/ViewAssignVendorInstallation';
export { default as VerifyRescoInstallation } from './Installation/Resco/VerifyRescoInstallation';
export { default as VerifyRescoDocument } from './Installation/Resco/VerifyRescoDocument';
export { default as ViewRescoClaim } from './Installation/Resco/ViewRescoClaim';
export { default as ViewRescoPayment } from './Installation/Resco/ViewRescoPayment';
export { default as ViewRescoBills } from './Installation/Resco/ViewRescoBills';

// ── 3. Installation Expense System ──
// SRT 70MW Expense
export { default as SrtExpenseClaimRequests } from './Expenses/SRT_70MW/SrtExpenseClaimRequests';
export { default as SrtExpenseViewPayments } from './Expenses/SRT_70MW/SrtExpenseViewPayments';
