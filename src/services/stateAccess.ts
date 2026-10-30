import { authService } from './authService';

/** "Uttar Pradesh" / "UP" → "up", baaki lowercase */
export const normState = (s: any): string => {
  const v = String(s ?? '').trim().toLowerCase();
  return v === 'uttar pradesh' || v === 'u.p.' ? 'up' : v;
};

const loginUser = (): any => {
  const raw = authService.getRawResponse();
  const session = authService.getSession();
  return raw?.user ?? raw?.data?.user ?? raw?.data ?? session?.user ?? session ?? null;
};

/** API ka asli role: "0" = sab states, "1" = sirf assigned states */
export const getRoleLevel = (): string | null => {
  const u = loginUser();
  const session = authService.getSession();
  const rawRole = u?.role_id ?? u?.role;
  if (rawRole === 0 || rawRole === '0') return '0';
  if (rawRole === 1 || rawRole === '1') return '1';
  if (session?.role_id === 0 || session?.role_id === '0') return '0';
  if (session?.role_id === 1 || session?.role_id === '1') return '1';
  return rawRole !== null && rawRole !== undefined ? String(rawRole).trim() : null;
};

export const getAllowedStates = (): string[] | 'ALL' => {
  if (getRoleLevel() === '0') return 'ALL';

  const u = loginUser();
  const session = authService.getSession();
  if (session?.role === 'vendor' || u?.role === 'vendor' || session?.vendor_id || u?.vendor_id) {
    return 'ALL';
  }

  let list: any =
    u?.state_access ??
    session?.state_access ??
    u?.state_accesses ??
    session?.state_accesses ??
    u?.states ??
    session?.states;

  if (typeof list === 'string') {
    try { list = JSON.parse(list); } catch { list = list.split(','); }
  }
  if (!Array.isArray(list) || !list.length) {
    const st = u?.state ?? session?.state ?? u?.state_name ?? session?.state_name;
    list = st ? [st] : [];
  }

  return [...new Set(list.map(normState).filter(Boolean))] as string[];
};

export const canAccessState = (state: string): boolean => {
  const allowed = getAllowedStates();
  return allowed === 'ALL' || allowed.includes(normState(state));
};

const KNOWN_STATES = ['bihar', 'up', 'assam', 'jammu', 'jharkhand', 'kashmir', 'uttar pradesh', 'punjab', 'karnataka', 'arunachal'];

/** 'dle/bihar/ssl/...' → 'bihar'; 'dle/up/...' → 'up'; 'up/survey/...' → 'up'; 'jammu/...' → 'jammu'; 'assam/...' → 'assam' */
export const stateOfSlug = (slug: string): string | null => {
  let clean = slug.replace(/^\/+/, '');
  if (clean.startsWith('v/')) {
    clean = clean.slice(2);
  }
  const mDle = clean.match(/^dle\/([^/]+)\//);
  if (mDle) {
    const candidate = normState(mDle[1]);
    if (KNOWN_STATES.includes(candidate)) return candidate;
    return null;
  }
  const mV = clean.match(/^(up|bihar|assam|jammu|jharkhand|kashmir|punjab|karnataka|arunachal)\//);
  if (mV) return normState(mV[1]);
  if (clean.startsWith('up-') || clean.includes('/up/')) return 'up';
  if (clean.startsWith('bihar-') || clean.includes('bihar')) return 'bihar';
  if (clean.startsWith('jammu-') || clean.includes('jammu')) return 'jammu';
  if (clean.startsWith('assam-') || clean.includes('assam')) return 'assam';
  if (clean.startsWith('punjab-') || clean.includes('punjab')) return 'punjab';
  if (clean.startsWith('karnataka-') || clean.includes('karnataka')) return 'karnataka';
  if (clean.startsWith('arunachal-') || clean.includes('arunachal')) return 'arunachal';
  return null;
};

export const canAccessSlug = (slug: string): boolean => {
  const st = stateOfSlug(slug);
  return !st || canAccessState(st);
};

/** Records ko state se filter (role 0 → sab dikhe) */
export const filterByState = <T = any>(list: T[]): T[] => {
  const allowed = getAllowedStates();
  if (allowed === 'ALL') return list;
  return list.filter((u: any) => {
    const raw = u?.state ?? u?.state_name ?? u?.user_state;
    if (!raw) return true;
    return allowed.includes(normState(raw));
  });
};

/** Sidebar / breadcrumb / command palette ke nodes filter */
export const filterNavNodes = <T extends { slug: string }>(nodes: T[]): T[] =>
  nodes.filter((n) => canAccessSlug(n.slug));