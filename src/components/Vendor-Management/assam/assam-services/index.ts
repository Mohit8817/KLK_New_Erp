export * from './assamAdminService';
export { assamAdminService, default } from './assamAdminService';

// Re-export V-Portal helpers and shared types for convenience
export {
  assamSwpService,
  normalizeAssamDashboardStatus,
  type AssamDashboardStatus,
  type AssamSwpDashboardResponse,
  type DistrictWiseDetail,
  type InstalledSiteItem,
  type DistrictInstallItem,
  type DistrictMonthItem,
} from '../../../V-Portal/assam/assam-services';
