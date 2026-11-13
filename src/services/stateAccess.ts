import { authService } from './authService';

/** "Uttar Pradesh" / "UP" → "up", baaki lowercase */
export const normState = (s: any): string => {
  const v = String(s ?? '').trim().toLowerCase();
  if (v === 'uttar pradesh' || v === 'u.p.' || v === 'up') return 'up';
  if (v === 'arunachal pradesh' || v === 'arunachal' || v === 'ar') return 'arunachal';
  if (v === 'madhya pradesh' || v === 'm.p.' || v === 'mp') return 'mp';
  if (v === 'himachal pradesh' || v === 'h.p.' || v === 'hp') return 'hp';
  return v;
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
  const rawRole =
    u?.role_id ??
    u?.usertype ??
    u?.user_type ??
    session?.role_id ??
    session?.usertype ??
    session?.user_type ??
    u?.role ??
    session?.role;

  if (rawRole === 0 || rawRole === '0') return '0';
  if (rawRole === 1 || rawRole === '1') return '1';
  if (rawRole === 'super_admin' || rawRole === 'admin' || rawRole === 'all') return '0';
  return rawRole !== null && rawRole !== undefined ? String(rawRole).trim() : null;
};

export const getAllowedStates = (): string[] | 'ALL' => {
  if (getRoleLevel() === '0') return 'ALL';

  const u = loginUser();
  const session = authService.getSession();

  const isSuperAdmin =
    u?.usertype === '0' || u?.usertype === 0 ||
    session?.usertype === '0' || session?.usertype === 0 ||
    u?.user_type === '0' || u?.user_type === 0 ||
    session?.user_type === '0' || session?.user_type === 0 ||
    u?.role === '0' || u?.role === 0 ||
    session?.role === '0' || session?.role === 0 ||
    u?.role_id === '0' || u?.role_id === 0 ||
    session?.role_id === '0' || session?.role_id === 0 ||
    u?.role === 'super_admin' || session?.role === 'super_admin' ||
    u?.role === 'admin' || session?.role === 'admin';

  if (isSuperAdmin) {
    return 'ALL';
  }

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
  if (allowed === 'ALL') return true;
  const nState = normState(state);
  if (allowed.includes(nState)) return true;
  if (
    (nState === 'kashmir' && (allowed.includes('jammu') || allowed.includes('kashmir'))) ||
    (nState === 'jammu' && (allowed.includes('kashmir') || allowed.includes('jammu')))
  ) {
    return true;
  }
  return false;
};

const KNOWN_STATES = ['bihar', 'up', 'assam', 'jammu', 'jharkhand', 'kashmir', 'uttar pradesh', 'punjab', 'arunachal', 'goa', 'karnataka'];

/** 'dle/bihar/ssl/...' → 'bihar'; 'dle/up/...' → 'up'; 'up/survey/...' → 'up'; 'jammu/...' → 'jammu'; 'assam/...' → 'assam'; 'goa/...' → 'goa'; 'karnataka/...' → 'karnataka' */
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
  const mV = clean.match(/^(up|bihar|assam|jammu|jharkhand|kashmir|punjab|arunachal|goa|karnataka)\//);
  if (mV) return normState(mV[1]);
  if (clean.startsWith('up-') || clean.includes('/up/') || clean.includes('upssl') || clean === 'edit-ssl') return 'up';
  if (clean.startsWith('bihar-') || clean.includes('bihar') || clean.startsWith('ssl/') || clean.startsWith('srt/')) return 'bihar';
  if (clean.startsWith('jammu-') || clean.includes('jammu') || clean.startsWith('jk-') || clean.startsWith('jk/')) return 'jammu';
  if (clean.startsWith('kashmir-') || clean.includes('kashmir')) return 'kashmir';
  if (clean.startsWith('assam-') || clean.includes('assam')) return 'assam';
  if (clean.startsWith('punjab-') || clean.includes('punjab')) return 'punjab';
  if (clean.startsWith('goa-') || clean.includes('goa')) return 'goa';
  if (clean.startsWith('karnataka-') || clean.includes('karnataka')) return 'karnataka';
  return null;
};

export const canAccessSlug = (slug: string): boolean => {
  const allowed = getAllowedStates();
  if (allowed === 'ALL') return true;
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
