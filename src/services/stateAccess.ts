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
  if (allowed === 'ALL') return true;
  const nState = normState(state);
  if (allowed.includes(nState)) return true;
  if (
    (nState === 'kashmir' && (allowed.includes('jammu') || allowed.includes('kashmir'))) ||
    (nState === 'jammu' && (allowed.includes('kashmir') || allowed.includes('jammu')))
  ) {
    return true;
  }
  // Arunachal Pradesh is always accessible to active users/admins so newly registered state is not blocked by stale session cache
  if (nState === 'arunachal') return true;
  return false;
};

<<<<<<< HEAD
const KNOWN_STATES = ['bihar', 'up', 'assam', 'jammu', 'jharkhand', 'kashmir', 'uttar pradesh', 'punjab', 'arunachal', 'goa'];
=======
const KNOWN_STATES = ['bihar', 'up', 'assam', 'jammu', 'jharkhand', 'kashmir', 'uttar pradesh', 'punjab', 'karnataka', 'arunachal'];
>>>>>>> 2f0aa566777502bc3b3e798fde4619376ae6a976

/** 'dle/bihar/ssl/...' → 'bihar'; 'dle/up/...' → 'up'; 'up/survey/...' → 'up'; 'jammu/...' → 'jammu'; 'assam/...' → 'assam'; 'goa/...' → 'goa' */
export const stateOfSlug = (slug: string): string | null => {
  let clean = slug.replace(/^\/+/, '');
  if (clean.startsWith('v/')) {
    clean = clean.slice(2);
  }
  if (clean.startsWith('vendor-management/')) {
    clean = clean.slice('vendor-management/'.length);
  }
  const mDle = clean.match(/^dle\/([^/]+)\//);
  if (mDle) {
    const candidate = normState(mDle[1]);
    if (KNOWN_STATES.includes(candidate)) return candidate;
    return null;
  }
<<<<<<< HEAD
  const mV = clean.match(/^(up|bihar|assam|jammu|jharkhand|kashmir|punjab|arunachal|goa)\//);
=======
  const mV = clean.match(/^(up|bihar|assam|jammu|jharkhand|kashmir|punjab|karnataka|arunachal)\//);
>>>>>>> 2f0aa566777502bc3b3e798fde4619376ae6a976
  if (mV) return normState(mV[1]);
  if (clean.startsWith('up-') || clean.includes('/up/')) return 'up';
  if (clean.startsWith('bihar-') || clean.includes('bihar')) return 'bihar';
  if (clean.startsWith('jammu-') || clean.includes('jammu')) return 'jammu';
  if (clean.startsWith('assam-') || clean.includes('assam')) return 'assam';
<<<<<<< HEAD
  if (clean.startsWith('punjab-') || clean.includes('punjab')) return 'punjab';
<<<<<<< HEAD
  if (clean.startsWith('goa-') || clean.includes('goa')) return 'goa';
<<<<<<< HEAD
  if (clean.startsWith('arunachal-') || clean.includes('arunachal')) return 'arunachal';
=======
=======
<<<<<<< HEAD
  if (clean.startsWith('karnataka-') || clean.includes('karnataka')) return 'karnataka';
  if (clean.startsWith('arunachal-') || clean.includes('arunachal')) return 'arunachal';
=======
=======
  if (clean.startsWith('ssl/') || clean.startsWith('ssl-')) return 'bihar';
>>>>>>> b7724a26675275e33c5aa8bd0f2e9734dbf67476
>>>>>>> 8be1db7d031b24c01d566bfdbc9e881ffbd01328
>>>>>>> 2f0aa566777502bc3b3e798fde4619376ae6a976
>>>>>>> d4adf8f03a1ac675a3bb647f845cbc7e6e0e48db
  return null;
};

export const canAccessSlug = (slug: string): boolean => {
  const clean = slug.replace(/^\/+/, '');
  if (clean.startsWith('v/') || clean.startsWith('ssl/') || clean.startsWith('vendor/') || clean.startsWith('v-')) {
    return true;
  }
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
