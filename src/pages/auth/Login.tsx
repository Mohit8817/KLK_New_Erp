import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

/* ───────────── Icons ───────────── */
const sp = {
  viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2,
  strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const,
};
const I = {
  user: (s = 20) => (<svg {...sp} width={s} height={s}><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>),
  vendor: (s = 16) => (<svg {...sp} width={s} height={s}><path d="M3 9l1 11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2l1-11" /><path d="M3 9l2-6h14l2 6" /><path d="M9 22v-8h6v8" /></svg>),
  lock: (<svg {...sp} width="16" height="16"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>),
  eye: (<svg {...sp} width="17" height="17"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>),
  eyeOff: (<svg {...sp} width="17" height="17"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" /></svg>),
  alert: (<svg {...sp} width="16" height="16"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>),
  check: (<svg {...sp} width="16" height="16" strokeWidth={2.5}><polyline points="20 6 9 17 4 12" /></svg>),
  globe: (<svg {...sp} width="14" height="14"><circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" /></svg>),
  chevron: (<svg {...sp} width="12" height="12"><polyline points="6 9 12 15 18 9" /></svg>),
};


const TASKS = [
  'Identify code optimization opportunities and performance improvements',
  'Reconcile vendor invoices against purchase orders',
  'Generate weekly solar installation progress report',
  'Flag delayed material deliveries across sites',
];

/* ───────────── Styles ───────────── */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
.ag-root, .ag-root * { box-sizing: border-box; }
.ag-root {
  min-height: 100vh; width: 100%; display: flex; align-items: center; justify-content: center;
  padding: 48px; background: #E3E5E9;
  font-family: 'Inter', system-ui, -apple-system, 'Segoe UI', Roboto, Arial, sans-serif; color: #0B0B0F;
}
.ag-frame {
  width: 100%;  height: min(860px, calc(100vh - 76px)); min-height: 640px;
  display: grid; grid-template-columns: 1fr 1fr; gap: 0;
  padding: 16px; border-radius: 22px; background: #ECEDF0;
  border: 2px solid #F6F7F9; box-shadow: 0 40px 80px -30px rgba(20,30,60,.25);
}

.ag-left { position: relative; display: flex; flex-direction: column; padding: 14px 30px 8px; min-width: 0; }
.ag-top { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; }
.ag-brand { display: flex; align-items: center; gap: 10px; }
.ag-brand-mark { width: 56px; height: 56px; border-radius: 9px; background: #dedfe3; display: grid; place-items: center; overflow: hidden; }
.ag-brand-mark img { width: 42px; height: 42px; object-fit: contain; }
.ag-brand b { display: block; font-size: 14px; line-height: 1.1; font-weight: 700; }
.ag-brand small { display: block; font-size: 10px; color: #555; letter-spacing: .02em; }
.ag-signup { display: flex; align-items: center; gap: 10px; font-size: 12px; color: #555; }
.ag-signup a {
  height: 32px; padding: 0 12px; display: inline-flex; align-items: center; border-radius: 6px;
  background: #fff; border: 1px solid #DADCE1; color: #0B0B0F; font-weight: 500; text-decoration: none; transition: box-shadow .2s, transform .2s;
}
.ag-signup a:hover { box-shadow: 0 4px 12px rgba(0,0,0,.08); transform: translateY(-1px); }

.ag-center { flex: 1; display: flex; align-items: center; justify-content: center; }
.ag-form-wrap { width: 100%; max-width: 352px; display: flex; flex-direction: column; align-items: center; text-align: center; }
.ag-form-wrap > * { animation: agRise .6s cubic-bezier(.2,.7,.2,1) both; }
.ag-form-wrap > *:nth-child(1) { animation-delay: .05s; }
.ag-form-wrap > *:nth-child(2) { animation-delay: .12s; }
.ag-form-wrap > *:nth-child(3) { animation-delay: .18s; }
.ag-form-wrap > *:nth-child(4) { animation-delay: .25s; }
.ag-form-wrap > *:nth-child(5) { animation-delay: .32s; }
.ag-form-wrap > *:nth-child(6) { animation-delay: .38s; }

.ag-icon-box {
  width: 58px; height: 58px; border-radius: 16px; padding: 5px; background: #E4E6EA;
  box-shadow: inset 0 0 0 1px #DDE0E5; margin-bottom: 18px;
}
.ag-icon-box > div {
  width: 100%; height: 100%; border-radius: 12px; background: #F8F8FA; display: grid; place-items: center;
  color: #0B0B0F; box-shadow: 0 2px 6px rgba(0,0,0,.06);
}
.ag-icon-box svg { transition: transform .35s cubic-bezier(.3,1.4,.5,1); }
.ag-icon-box.swap svg { transform: scale(1.12) rotate(-6deg); }
.ag-title { margin: 0; font-size: 30px; line-height: 1.15; font-weight: 500; letter-spacing: -.01em; }
.ag-sub { margin: 8px 0 22px; font-size: 13px; color: #555; }

.ag-tabs { position: relative; width: 100%; display: grid; grid-template-columns: 1fr 1fr; padding: 3px; border-radius: 8px; background: #DFE1E6; margin-bottom: 14px; }
.ag-tabs-pill { position: absolute; top: 3px; bottom: 3px; left: 3px; width: calc(50% - 3px); border-radius: 6px; background: #fff; box-shadow: 0 1px 4px rgba(0,0,0,.1); transition: transform .3s cubic-bezier(.3,.9,.3,1); }
.ag-tabs[data-tab="vendor"] .ag-tabs-pill { transform: translateX(100%); }
.ag-tab { position: relative; z-index: 1; height: 32px; border: 0; background: transparent; display: flex; align-items: center; justify-content: center; gap: 7px; font: inherit; font-size: 12.5px; font-weight: 500; color: #666; cursor: pointer; transition: color .2s; }
.ag-tab.active { color: #0B0B0F; }
.ag-tab:focus-visible, .ag-btn:focus-visible, .ag-input:focus-visible, .ag-eye:focus-visible { outline: 2px solid #3B73F5; outline-offset: 2px; }

.ag-form { width: 100%; display: flex; flex-direction: column; gap: 10px; margin: 0; }
.ag-field { position: relative; }
.ag-input {
  width: 100%; height: 40px; padding: 0 14px; border-radius: 8px; border: 1px solid #DADCE1; background: #fff;
  font: inherit; font-size: 12.5px; font-weight: 500; color: #0B0B0F; outline: none; transition: border-color .2s, box-shadow .2s;
}
.ag-input.has-eye { padding-right: 40px; }
.ag-input::placeholder { color: #0B0B0F; font-weight: 500; }
.ag-input:focus { border-color: #3B73F5; box-shadow: 0 0 0 4px rgba(59,115,245,.14); }
.ag-input:disabled { opacity: .6; }
.ag-eye { position: absolute; top: 0; bottom: 0; right: 0; width: 40px; border: 0; background: transparent; color: #8A8F99; display: grid; place-items: center; cursor: pointer; }
.ag-eye:hover { color: #333; }

.ag-row { display: flex; justify-content: space-between; align-items: center; font-size: 12px; color: #555; margin: 2px 0 2px; }
.ag-row label { display: inline-flex; align-items: center; gap: 7px; cursor: pointer; }
.ag-row input { accent-color: #0B0B0F; margin: 0; }
.ag-row a { color: #0B0B0F; text-decoration: underline; text-underline-offset: 2px; }

.ag-btn {
  width: 100%; height: 40px; border: 0; border-radius: 8px; background: #000; color: #fff;
  font: inherit; font-size: 13px; font-weight: 500; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px;
  box-shadow: 0 10px 22px -8px rgba(0,0,0,.45); transition: transform .15s, box-shadow .2s;
}
.ag-btn:hover { transform: translateY(-1px); box-shadow: 0 14px 26px -8px rgba(0,0,0,.5); }
.ag-btn:active { transform: scale(.99); }
.ag-btn:disabled { opacity: .65; cursor: not-allowed; transform: none; }
.ag-spin { width: 16px; height: 16px; animation: agSpin .9s linear infinite; }

.ag-alert { display: flex; gap: 8px; align-items: flex-start; text-align: left; padding: 10px 12px; border-radius: 8px; font-size: 12px; font-weight: 500; animation: agPop .25s ease-out both; }
.ag-alert svg { flex-shrink: 0; margin-top: 1px; }
.ag-alert.error { background: #FFF1F2; border: 1px solid #FECDD3; color: #BE123C; }
.ag-alert.success { background: #ECFDF5; border: 1px solid #A7F3D0; color: #065F46; }

.ag-terms { margin: 14px 0 0; font-size: 10.5px; color: #555; }
.ag-terms a { color: #333; text-decoration: underline; }
.ag-fill { margin-top: 10px; background: none; border: 0; padding: 0; font: inherit; font-size: 11px; color: #8A8F99; text-decoration: underline; cursor: pointer; }
.ag-fill:hover { color: #3B73F5; }

.ag-foot { display: flex; justify-content: space-between; align-items: center; font-size: 11px; color: #444; }
.ag-lang { display: inline-flex; align-items: center; gap: 6px; }
.ag-lang select { appearance: none; border: 0; background: transparent; font: inherit; color: inherit; cursor: pointer; padding-right: 4px; }

/* ── Right ── */
.ag-right {
  position: relative; overflow: hidden; border-radius: 14px; min-width: 0;
  background: linear-gradient(180deg, #FAFAFC 0%, #F1F4FC 22%, #CFDDFF 48%, #8FB0FF 72%, #5C8CFA 100%);
}
.ag-right-copy { position: relative; z-index: 3; padding: 28px 26px 0; max-width: 360px; }
.ag-right-copy h2 { margin: 0 0 14px; font-size: 31px; line-height: 1.08; font-weight: 500; letter-spacing: -.015em; }
.ag-right-copy p { margin: 0; font-size: 13px; line-height: 1.55; color: #444; max-width: 310px; }

.ag-tiles-mask { position: absolute; inset: 0; z-index: 1; -webkit-mask-image: linear-gradient(45deg, transparent 18%, #000 62%); mask-image: linear-gradient(45deg, transparent 18%, #000 62%); }
.ag-tiles {
  position: absolute; top: 90px; right: -150px; width: 470px; display: grid; grid-template-columns: repeat(5, 1fr); gap: 12px;
  transform: rotateX(60deg) rotateZ(45deg); transform-origin: center;
}
.ag-tile {
  aspect-ratio: 1; border-radius: 18px; background: linear-gradient(135deg, rgba(255,255,255,.75), rgba(255,255,255,.18));
  border: 1px solid rgba(255,255,255,.8); box-shadow: 0 8px 20px rgba(80,110,190,.12);
  animation: agGlow 5s ease-in-out infinite;
}

.ag-hero { position: absolute; z-index: 2; top: 62px; right: 56px; width: 190px; animation: agFloat 4.5s ease-in-out infinite; filter: drop-shadow(0 22px 22px rgba(40,90,240,.35)); }
.ag-hero-glow { position: absolute; z-index: 1; top: 120px; right: 40px; width: 220px; height: 90px; border-radius: 50%; background: rgba(59,115,245,.35); filter: blur(28px); animation: agGlowPulse 4.5s ease-in-out infinite; }

.ag-feed { position: absolute; z-index: 3; left: 24px; right: 24px; bottom: 0; height: 250px; overflow: hidden; display: flex; flex-direction: column; gap: 12px;
  -webkit-mask-image: linear-gradient(180deg, #000 70%, transparent 100%); mask-image: linear-gradient(180deg, #000 70%, transparent 100%); }
.ag-card {
  display: flex; align-items: center; gap: 14px; min-height: 74px; padding: 14px 20px 14px 14px; border-radius: 22px; color: #fff; font-size: 13.5px; line-height: 1.4;
  background: rgba(255,255,255,.16); border: 1px solid rgba(255,255,255,.22); backdrop-filter: blur(6px);
  animation: agSlideIn .55s cubic-bezier(.2,.8,.2,1) both;
}
.ag-card:nth-child(2) { opacity: .85; }
.ag-card:nth-child(3) { opacity: .5; }
.ag-dot-ring { width: 30px; height: 30px; border-radius: 50%; flex-shrink: 0; background: rgba(255,255,255,.35); display: grid; place-items: center; }
.ag-dot-ring i { width: 18px; height: 18px; border-radius: 50%; background: #fff; display: block; }
.ag-card-body { flex: 1; min-width: 0; }
.ag-caret { display: inline-block; width: 1px; height: 1em; background: #fff; margin-left: 2px; vertical-align: text-bottom; animation: agBlink .8s steps(1) infinite; }
.ag-skel { display: block; height: 5px; border-radius: 4px; background: rgba(255,255,255,.55); }
.ag-skel + .ag-skel { margin-top: 6px; width: 100px !important; opacity: .55; }
.ag-status { display: inline-flex; align-items: center; gap: 8px; font-size: 13px; color: rgba(255,255,255,.92); white-space: nowrap; }
.ag-status i { width: 9px; height: 9px; border-radius: 50%; display: block; }
.ag-status.working i { background: #F2693A; animation: agPulse 1.2s ease-in-out infinite; }
.ag-status.done i { background: #38D878; }

@keyframes agRise { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: none; } }
@keyframes agPop { from { opacity: 0; transform: translateY(-4px) scale(.98); } to { opacity: 1; transform: none; } }
@keyframes agSpin { to { transform: rotate(360deg); } }
@keyframes agFloat { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-12px); } }
@keyframes agGlowPulse { 0%,100% { opacity: .55; transform: scale(1); } 50% { opacity: .3; transform: scale(.9); } }
@keyframes agGlow { 0%,100% { opacity: .75; } 50% { opacity: 1; } }
@keyframes agSlideIn { from { opacity: 0; transform: translateY(-18px); } to { opacity: 1; transform: none; } }
@keyframes agBlink { 50% { opacity: 0; } }
@keyframes agPulse { 0%,100% { box-shadow: 0 0 0 0 rgba(242,105,58,.6); } 50% { box-shadow: 0 0 0 6px rgba(242,105,58,0); } }
.ag-tile:nth-child(3n) { animation-delay: .6s; } .ag-tile:nth-child(4n) { animation-delay: 1.3s; } .ag-tile:nth-child(5n) { animation-delay: 2.1s; }

@media (prefers-reduced-motion: reduce) {
  .ag-root * { animation: none !important; transition: none !important; }
}
@media (max-width: 1023px) {
  .ag-root { padding: 0; }
  .ag-frame { grid-template-columns: 1fr; height: auto; min-height: 100vh; border-radius: 0; border: 0; padding: 8px; }
  .ag-right { display: none; }
  .ag-left { padding: 16px; }
  .ag-center { padding: 32px 0; }
  .ag-signup span { display: none; }
}
`;

/* ───────────── Hero tile (isometric) ───────────── */
const HeroTile = () => (
  <svg className="ag-hero" viewBox="0 0 200 170" aria-hidden="true">
    <defs>
      <linearGradient id="agTop" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#5E92FF" /><stop offset="1" stopColor="#2F63F0" /></linearGradient>
      <linearGradient id="agSide" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#2552D6" /><stop offset="1" stopColor="#1E43B8" /></linearGradient>
    </defs>
    <path d="M100 38 L186 82 Q196 88 186 94 L108 136 Q100 140 92 136 L14 94 Q4 88 14 82 Z" fill="url(#agSide)" />
    <path d="M100 18 L186 62 Q196 68 186 74 L108 116 Q100 120 92 116 L14 74 Q4 68 14 62 Z" fill="url(#agTop)" />
    <path d="M100 46 C108 46 112 54 118 58 C124 62 134 62 134 68 C134 74 124 74 118 78 C112 82 108 90 100 90 C92 90 88 82 82 78 C76 74 66 74 66 68 C66 62 76 62 82 58 C88 54 92 46 100 46 Z" fill="#fff" />
    <path d="M100 58 L106 68 L100 78 L94 68 Z" fill="#3B73F5" />
  </svg>
);

/* ───────────── Animated task feed ───────────── */
function TaskFeed() {
  const [idx, setIdx] = useState(0);
  const [typed, setTyped] = useState('');
  const [done, setDone] = useState(false);
  const text = TASKS[idx % TASKS.length];

  useEffect(() => {
    setTyped(''); setDone(false);
    let i = 0;
    const t = setInterval(() => {
      i += 1;
      setTyped(text.slice(0, i));
      if (i >= text.length) {
        clearInterval(t);
        setTimeout(() => setDone(true), 900);
        setTimeout(() => setIdx((n) => n + 1), 2200);
      }
    }, 38);
    return () => clearInterval(t);
  }, [idx, text]);

  return (
    <div className="ag-feed" aria-hidden="true">
      <div className="ag-card" key={`a-${idx}`}>
        <span className="ag-dot-ring"><i /></span>
        <div className="ag-card-body">{typed}{!done && <span className="ag-caret" />}</div>
        <span className={`ag-status ${done ? 'done' : 'working'}`}>{done ? 'Done' : 'Working...'}<i /></span>
      </div>
      {[1, 2].map((n) => (
        <div className="ag-card" key={`p-${idx}-${n}`}>
          <span className="ag-dot-ring"><i /></span>
          <div className="ag-card-body"><span className="ag-skel" style={{ width: n === 1 ? 50 : 40 }} /><span className="ag-skel" /></div>
          <span className="ag-status done">Done<i /></span>
        </div>
      ))}
    </div>
  );
}

export function SolarLoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loginUser, loginVendor, isAuthenticated } = useAuth();

  const [activeTab, setActiveTab] = useState<'user' | 'vendor'>('user');
  const [email, setEmail] = useState('');
  const [vendorId, setVendorId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tabParam = params.get('type') || params.get('tab') || params.get('portal');
    if (tabParam === 'vendor') setActiveTab('vendor');
  }, [location.search]);

  const redirectTo = (type?: 'user' | 'vendor') => {
    const isVendor =
      type === 'vendor' || activeTab === 'vendor' || user?.role === 'vendor' || !!user?.vendor_id ||
      (user?.user_type && String(user.user_type).toLowerCase() === 'vendor');
    const fromPath = (location.state as any)?.from?.pathname;
    if (isVendor) {
      if (fromPath && ['/v-dashboard', '/vendor', '/assam', '/jammu', '/up'].some((p) => fromPath.startsWith(p))) return fromPath;
      return '/v-dashboard';
    }
    if (fromPath && fromPath !== '/login' && fromPath !== '/' && !fromPath.startsWith('/v-dashboard') && !fromPath.startsWith('/vendor')) return fromPath;
    return '/';
  };

  useEffect(() => {
    if (isAuthenticated) {
      const isVendorUser =
        user?.role === 'vendor' || !!user?.vendor_id ||
        (user?.user_type && String(user.user_type).toLowerCase() === 'vendor') || activeTab === 'vendor';
      navigate(isVendorUser ? '/v-dashboard' : redirectTo('user'), { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, navigate, location, user]);

  const handleTabChange = (tab: 'user' | 'vendor') => {
    setActiveTab(tab); setErrorMessage(''); setSuccessMessage('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(''); setSuccessMessage('');

    if (activeTab === 'user') {
      if (!email.trim()) return setErrorMessage('Please enter your User Email');
      if (!password) return setErrorMessage('Please enter your Password');
      setLoading(true);
      try {
        const res = await loginUser(email, password, rememberMe);
        if (res.success) {
          setSuccessMessage(res.message || 'Login successful! Redirecting to ERP...');
          setTimeout(() => navigate(redirectTo('user'), { replace: true }), 500);
        } else setErrorMessage(res.message || 'Credentials do not match.');
      } catch (err: any) {
        setErrorMessage(err.message || 'Unable to connect to server. Please try again.');
      } finally { setLoading(false); }
    } else {
      if (!vendorId.trim()) return setErrorMessage('The vendor id field is required.');
      if (!password) return setErrorMessage('The password field is required.');
      setLoading(true);
      try {
        const res = await loginVendor(vendorId, password, rememberMe);
        if (res.success) {
          setSuccessMessage(res.message || 'Vendor login successful! Redirecting to V-Portal...');
          setTimeout(() => navigate('/v-dashboard', { replace: true }), 500);
        } else setErrorMessage(res.message || 'Invalid Vendor ID or password.');
      } catch (err: any) {
        setErrorMessage(err.message || 'Unable to connect to server. Please try again.');
      } finally { setLoading(false); }
    }
  };

  const isUser = activeTab === 'user';

  return (
    <div className="ag-root">
      <style>{CSS}</style>
      <div className="ag-frame">
        {/* ───── LEFT ───── */}
        <section className="ag-left">
          <header className="ag-top">
            <div className="ag-brand">
              <div className="ag-brand-mark"><img src="/logo-abbr.png" alt="" /></div>
              <div><b>KLK Ventures</b><small>SOLAR ERP</small></div>
            </div>
 
          </header>

          <div className="ag-center">
            <div className="ag-form-wrap">
              <div className={`ag-icon-box${isUser ? '' : ' swap'}`}>
                <div>{isUser ? I.user(22) : I.vendor(22)}</div>
              </div>
              <h1 className="ag-title">Welcome back!</h1>
              <p className="ag-sub">
                {isUser ? 'Sign in to continue where you left off.' : 'Sign in with your Vendor ID to open V-Portal.'}
              </p>

              <div role="tablist" aria-label="Login type" className="ag-tabs" data-tab={activeTab}>
                <span className="ag-tabs-pill" />
                {(['user', 'vendor'] as const).map((tab) => (
                  <button
                    key={tab} type="button" role="tab" aria-selected={activeTab === tab}
                    className={`ag-tab${activeTab === tab ? ' active' : ''}`} onClick={() => handleTabChange(tab)}
                  >
                    {tab === 'user' ? I.user(15) : I.vendor(15)}
                    <span>{tab === 'user' ? 'User' : 'Vendor'}</span>
                  </button>
                ))}
              </div>

              <form onSubmit={handleSubmit} className="ag-form" noValidate>
                {errorMessage && <div role="alert" className="ag-alert error">{I.alert}<span>{errorMessage}</span></div>}
                {successMessage && <div role="status" className="ag-alert success">{I.check}<span>{successMessage}</span></div>}

                <div className="ag-field">
                  {isUser ? (
                    <input
                      type="email" name="email" autoComplete="email" aria-label="Email address"
                      value={email} onChange={(e) => setEmail(e.target.value)}
                      placeholder="Email address" className="ag-input" disabled={loading}
                    />
                  ) : (
                    <input
                      type="text" name="vendor_id" autoComplete="username" aria-label="Vendor ID"
                      value={vendorId} onChange={(e) => setVendorId(e.target.value)}
                      placeholder="Vendor ID (e.g. KLK29045)" className="ag-input" disabled={loading}
                    />
                  )}
                </div>

                <div className="ag-field">
                  <input
                    type={showPassword ? 'text' : 'password'} name="password" autoComplete="current-password" aria-label="Password"
                    value={password} onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password" className="ag-input has-eye" disabled={loading}
                  />
                  <button type="button" className="ag-eye" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? 'Hide password' : 'Show password'}>
                    {showPassword ? I.eyeOff : I.eye}
                  </button>
                </div>

                <div className="ag-row">
                  <label>
                    <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} />
                    <span>Remember session</span>
                  </label>
                  <a href="https://klkerp.com/forgot-password" target="_blank" rel="noreferrer">Forgot password?</a>
                </div>

                <button type="submit" disabled={loading} className="ag-btn">
                  {loading ? (
                    <>
                      <svg className="ag-spin" fill="none" viewBox="0 0 24 24">
                        <circle opacity="0.25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path opacity="0.9" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      <span>Signing in...</span>
                    </>
                  ) : (
                    <span>{isUser ? 'Login with Email' : 'Login as Vendor'}</span>
                  )}
                </button>
              </form>

              <p className="ag-terms">By continuing, you acknowledge KLK Ventures <a href="https://klkerp.com" target="_blank" rel="noreferrer">Privacy Policy</a>.</p>
              <button
                type="button" className="ag-fill"
                onClick={() => {
                  if (isUser) { setEmail('admin@klkerp.com'); setPassword('admin123'); }
                  else { setVendorId('KLK29045'); setPassword('vendor123'); }
                }}
              >
                Auto-fill sample credentials
              </button>
            </div>
          </div>

          <footer className="ag-foot">
            <span>© 2026 KLK Ventures</span>
            <span className="ag-lang">{I.globe}<select aria-label="Language" defaultValue="ENG"><option>ENG</option><option>हिं</option></select>{I.chevron}</span>
          </footer>
        </section>

        {/* ───── RIGHT ───── */}
        <aside className="ag-right" aria-hidden="true">
          <div className="ag-right-copy">
            <h2>Build, Deploy &amp; Manage Solar Projects</h2>
            <p>Manage every vendor, work order, and site update from one intelligent ERP platform built for modern solar teams.</p>
          </div>
          <div className="ag-tiles-mask" style={{ perspective: 1200 }}>
            <div className="ag-tiles">{Array.from({ length: 25 }).map((_, i) => <div className="ag-tile" key={i} />)}</div>
          </div>
          <div className="ag-hero-glow" />
          <HeroTile />
          <TaskFeed />
        </aside>
      </div>
    </div>
  );
}

export default SolarLoginPage;