/**
 * Jammu RESCO Rooftop Solar Survey Data Types & Storage
 * Real API-aligned data types and empty persistence state
 */

export interface AssignedRescoSite {
  srNo: number;
  id: string;
  vendor: string;
  assignDate: string;
  state: string;
  district: string;
  division: string;
  subDivision: string;
  department: string;
  siteName: string;
  location: string;
  caNo: string;
  siteCount: number;
  fileUrl: string;
  remarks: string;
  surveyStatus: 'pending' | 'completed';
}

export interface RescoSurveyRecord {
  srNo: number;
  uniqueId: string;
  state: string;
  district: string;
  division: string;
  subDivision: string;
  department: string;
  siteName: string;
  siteAddress: string;
  caNo: string;
  surveyAddress: string;
  nearestLandmark: string;
  agencyContactPerson: string;
  agencyContactNo: string;
  nodalPerson: string;
  nodalPersonContact: string;
  latitude: string;
  longitude: string;
  loadType: string;
  connectionPhase: string;
  meterConnectionType: string;
  meterNumber: string;
  meterType: string;
  sanctionLoadKw: string;
  connectedLoadKw: string;
  gridPowerAvailability: string;
  threePhaseAvailability: string;
  missingPhase: string;
  ltdbPresent: string;
  roofCondition: string;
  totalRoofAreaSqFt: number;
  freeSpaceSolarSqFt: number;
  freeSpaceControlRoomSqFt: number;
  earthPitPosition: string;
  ageOfBuilding: string;
  accessToRoof: string;
  rooftopHeightFt: number;
  parapetHeightFt: number;
  noOfFloors: string;
  waterSourceForCleaning: string;
  accessToSite: string;
  distanceFromMainRoadKm: number;
  siteFeasible: string;
  surveyRemarks: string;
  buildingImage: string;
  roofImage: string;
  controlRoomImage: string;
  meterImage: string;
  otherImage: string;
  pdfUrl: string;
  bosStatus: string;
  bosFile: string;
  bosRemarks: string;
}

export const INITIAL_ASSIGNED_SITES: AssignedRescoSite[] = [];
export const INITIAL_RESCO_SURVEYS: RescoSurveyRecord[] = [];

/* ───────── Local Storage Persistence Helpers ───────── */
const RESCO_SITES_STORAGE_KEY = 'jammu_resco_assigned_sites_v1';
const RESCO_SURVEYS_STORAGE_KEY = 'jammu_resco_surveys_v1';

export function getStoredAssignedSites(): AssignedRescoSite[] {
  try {
    const raw = localStorage.getItem(RESCO_SITES_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Exclude any legacy mock records
        return parsed.filter((item) => !String(item?.id || '').startsWith('JK-RESCO-'));
      }
    }
  } catch {}
  return [];
}

export function saveAssignedSites(sites: AssignedRescoSite[]): void {
  try {
    localStorage.setItem(RESCO_SITES_STORAGE_KEY, JSON.stringify(sites));
  } catch {}
}

export function getStoredRescoSurveys(): RescoSurveyRecord[] {
  try {
    const raw = localStorage.getItem(RESCO_SURVEYS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Exclude any legacy mock records
        return parsed.filter((item) => !String(item?.uniqueId || '').startsWith('JK-RESCO-'));
      }
    }
  } catch {}
  return [];
}

export function saveRescoSurveys(surveys: RescoSurveyRecord[]): void {
  try {
    localStorage.setItem(RESCO_SURVEYS_STORAGE_KEY, JSON.stringify(surveys));
  } catch {}
}
