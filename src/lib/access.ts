/*
 * KLK ERP — shared access control (STATIC abhi).
 * Dashboard, Sidebar aur RequireAccess teeno yahin se import karte hain,
 * isliye ek jagah badlo to sab jagah lock/unlock ho jata hai.
 * Baad mein ACCESS ko API / auth context se replace karna hai.
 *
 * NOTE: ye sirf UI-level control hai. Asli security ke liye backend API
 * har request par permission verify kare.
 */

export type ModuleKey = 'dle' | 'vendor' | 'gallery' | 'complaints';

export const ACCESS: { role: string; states: string[]; modules: Record<ModuleKey, boolean> } = {
  role: 'Operations Manager',
  states: ['up', 'bihar', 'haryana', 'punjab', 'jharkhand', 'assam', 'kashmir', 'goa', 'karnataka'],
  modules: { dle: true, vendor: true, gallery: true, complaints: false },
};

export const hasStateAccess = (id: string) => ACCESS.states.includes(id);
export const hasModuleAccess = (key: ModuleKey) => ACCESS.modules[key];

export const RESTRICTED_MSG = (label: string) =>
  `${label}: access restricted. Contact your administrator to request access.`;

/* Manifest section -> state id (DLE portal ke sections) */
export const SECTION_STATE: Record<string, string> = {
  DLE_BIHAR: 'bihar',
  DLE_UP: 'up',
};

/* URL prefix -> module */
const PATH_MODULES: Array<[string, ModuleKey]> = [
  ['/dle', 'dle'],
  ['/vendor', 'vendor'],
  ['/apps/gallery', 'gallery'],
  ['/gallery', 'gallery'],
  ['/complaints', 'complaints'],
];
export const moduleFromPath = (pathname: string): ModuleKey | undefined =>
  PATH_MODULES.find(([p]) => pathname === p || pathname.startsWith(p + '/'))?.[1];

/* /dle/bihar/... -> 'bihar' ; /dle/up/... -> 'up' */
export const stateFromPath = (pathname: string): string | undefined => {
  const m = pathname.match(/^\/dle\/([^/]+)/);
  return m && Object.values(SECTION_STATE).includes(m[1]) ? m[1] : undefined;
};