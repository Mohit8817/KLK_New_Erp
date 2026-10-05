import { authService } from './authService';

/** "Uttar Pradesh" / "UP" → "up", baaki lowercase */
export const normState = (s: any): string => {
  const v = String(s ?? '').trim().toLowerCase();
  return v === 'uttar pradesh' || v === 'u.p.' ? 'up' : v;
};

const loginUser = (): any => {
  const raw = authService.getRawResponse();
  return raw?.user ?? raw?.data?.user ?? authService.getSession() ?? null;
};

/** API ka asli role: "0" = sab states, "1" = sirf assigned states */
export const getRoleLevel = (): string | null => {
  const r = loginUser()?.role;
  return r === null || r === undefined ? null : String(r).trim();
};

export const getAllowedStates = (): string[] | 'ALL' => {
  if (getRoleLevel() === '0') return 'ALL';

  const u = loginUser();
  let list: any = u?.state_access; // '["bihar"]' (JSON string) ya array

  if (typeof list === 'string') {
    try { list = JSON.parse(list); } catch { list = list.split(','); }
  }
  if (!Array.isArray(list) || !list.length) list = u?.state ? [u.state] : [];

  return [...new Set(list.map(normState).filter(Boolean))] as string[];
};

export const canAccessState = (state: string): boolean => {
  const allowed = getAllowedStates();
  return allowed === 'ALL' || allowed.includes(normState(state));
};

/** 'dle/bihar/ssl/...' → 'bihar'; 'dle/dashboard', 'dle/users' → null (sabke liye) */
export const stateOfSlug = (slug: string): string | null => {
  const m = slug.replace(/^\/+/, '').match(/^dle\/([^/]+)\//);
  return m ? normState(m[1]) : null;
};

export const canAccessSlug = (slug: string): boolean => {
  const st = stateOfSlug(slug);
  return !st || canAccessState(st);
};

/** Records ko state se filter (role 0 → sab dikhe) */
export const filterByState = <T = any>(list: T[]): T[] => {
  const allowed = getAllowedStates();
  if (allowed === 'ALL') return list;
  return list.filter((u: any) => allowed.includes(normState(u?.state ?? u?.state_name)));
};

/** Sidebar / breadcrumb / command palette ke nodes filter */
export const filterNavNodes = <T extends { slug: string }>(nodes: T[]): T[] =>
  nodes.filter((n) => canAccessSlug(n.slug));