import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

/* ───────────── Quick switches (true / false) ───────────── */
const SHOW_SOCIAL = true;        // "Or continue with" + 4 social buttons (image jaisa)
const SHOW_REMEMBER_ROW = true;  // Remember session + Forgot password (false = bilkul image jaisa)
const SHOW_DEMO_FILL = false;    // sample credentials auto-fill (sirf dev ke liye)
const SLIDE_MS = 5000;           // right panel slide + progress bar speed

/* ───────────── Right-panel slides (copy yahan edit karo) ───────────── */
const SLIDES = [
  { h: 'A Unified Hub for Smarter Solar Project Management', p: 'KLK ERP empowers you with a unified command center— delivering deep insights and a 360° view of every site, vendor and work order.' },
  { h: 'Real-time Visibility Across Every Installation', p: 'Track survey, installation and approval status for each site live — from the field all the way to the national portal.' },
  { h: 'Vendor & Work Order Management Made Simple', p: 'Assign, monitor and reconcile vendor work orders and invoices with complete transparency and fewer follow-ups.' },
  { h: 'Smarter Inventory, Faster Deliveries', p: 'Stay ahead of material shortages and dispatch delays with intelligent stock and logistics tracking.' },
];

/* ───────────── Icons ───────────── */
const sp = {
  viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2,
  strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const,
};
const I = {
  vendor: (s = 18) => (<svg {...sp} width={s} height={s}><path d="M3 9l1 11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2l1-11" /><path d="M3 9l2-6h14l2 6" /><path d="M9 22v-8h6v8" /></svg>),
  mail: (s = 18) => (<svg {...sp} width={s} height={s} strokeWidth={1.7}><rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /></svg>),
  lock: (s = 18) => (<svg {...sp} width={s} height={s} strokeWidth={1.7}><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>),
  eye: (<svg {...sp} width="18" height="18" strokeWidth={1.7}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>),
  eyeOff: (<svg {...sp} width="18" height="18" strokeWidth={1.7}><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" /></svg>),
  alert: (<svg {...sp} width="16" height="16"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>),
  check: (<svg {...sp} width="16" height="16" strokeWidth={2.5}><polyline points="20 6 9 17 4 12" /></svg>),
  chevron: (s = 8) => (<svg {...sp} width={s} height={s}><polyline points="6 9 12 15 18 9" /></svg>),
  refresh: (<svg {...sp} width="7" height="7"><path d="M21 12a9 9 0 1 1-3-6.7L21 8" /><path d="M21 3v5h-5" /></svg>),
};

const SOCIAL = [
  { name: 'Google', icon: (<svg viewBox="0 0 24 24" width="22" height="22"><path fill="#4285F4" d="M23.52 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.46a5.52 5.52 0 0 1-2.4 3.62v3h3.88c2.27-2.09 3.58-5.17 3.58-8.81z" /><path fill="#34A853" d="M12 24c3.24 0 5.96-1.07 7.94-2.91l-3.88-3c-1.08.72-2.45 1.15-4.06 1.15-3.12 0-5.77-2.11-6.71-4.95H1.28v3.1A12 12 0 0 0 12 24z" /><path fill="#FBBC05" d="M5.29 14.29A7.2 7.2 0 0 1 4.91 12c0-.8.14-1.57.38-2.29V6.61H1.28A12 12 0 0 0 0 12c0 1.94.46 3.77 1.28 5.39l4.01-3.1z" /><path fill="#EA4335" d="M12 4.76c1.76 0 3.34.61 4.59 1.8l3.44-3.44C17.95 1.19 15.23 0 12 0A12 12 0 0 0 1.28 6.61l4.01 3.1C6.23 6.87 8.88 4.76 12 4.76z" /></svg>) },
  { name: 'Apple', icon: (<svg viewBox="0 0 24 24" width="22" height="22"><path fill="#111" d="M16.365 1.43c0 1.14-.493 2.27-1.177 3.08-.744.9-1.99 1.57-2.987 1.57-.12 0-.23-.02-.3-.03-.01-.06-.04-.22-.04-.39 0-1.15.572-2.27 1.206-2.98.804-.94 2.142-1.64 3.248-1.68.03.13.05.28.05.43zm4.565 15.71c-.03.07-.463 1.58-1.518 3.12-.945 1.34-1.94 2.71-3.43 2.71-1.517 0-1.9-.88-3.63-.88-1.698 0-2.302.91-3.67.91-1.377 0-2.332-1.26-3.428-2.8-1.287-1.82-2.323-4.63-2.323-7.28 0-4.28 2.797-6.55 5.552-6.55 1.448 0 2.675.95 3.6.95.865 0 2.222-1.01 3.902-1.01.613 0 2.886.06 4.374 2.19-.13.09-2.383 1.37-2.383 4.19 0 3.26 2.854 4.42 2.955 4.45z" /></svg>) },
  { name: 'Facebook', icon: (<svg viewBox="0 0 24 24" width="22" height="22"><path fill="#1877F2" d="M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.8-4.7 4.54-4.7 1.31 0 2.68.24 2.68.24v2.97h-1.51c-1.49 0-1.96.93-1.96 1.89v2.26h3.33l-.53 3.49h-2.8V24C19.61 23.1 24 18.1 24 12.07z" /></svg>) },
  { name: 'X', icon: (<svg viewBox="0 0 24 24" width="22" height="22"><circle cx="12" cy="12" r="12" fill="#111" /><path fill="#fff" transform="translate(5.6 5.6) scale(.6)" d="M17.53 3H20.4l-6.27 7.17L21.5 21h-5.77l-4.52-5.91L6.04 21H3.17l6.71-7.67L2.8 3h5.92l4.08 5.4L17.53 3zm-1.01 16.3h1.59L7.85 4.62H6.15L16.52 19.3z" /></svg>) },
];

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
.ag-root, .ag-root * { box-sizing: border-box; }
.ag-root {
  --navy: #0B2447; --muted: #5F6C7B; --line: #D8E0EA; --blue: #2563EB; --blue-d: #1D4ED8;
  height: 100vh; height: 100dvh; width: 100%; display: flex; overflow: hidden; padding: 0;
  background: #fff; font-family: 'Inter', system-ui, -apple-system, 'Segoe UI', Roboto, Arial, sans-serif; color: var(--navy);
}
.ag-frame {
  width: 100%; height: 100%;
  display: grid; grid-template-columns: 656fr 704fr; gap: 16px; padding: 16px;
  background: #fff; border-radius: 0;
}

/* ── Left ── */
.ag-left { display: flex; flex-direction: column; min-width: 0; min-height: 0; overflow-y: auto; padding: 20px 20px 22px; border: 1px solid #E4E9F0; border-radius: 20px; background: #fff; }
.ag-brand { display: flex; align-items: center; gap: 9px; font-size: 20px; font-weight: 500; letter-spacing: -.01em; }
.ag-brand-mark { width: 28px; height: 28px; border-radius: 8px; display: grid; place-items: center; background: linear-gradient(180deg,#3F83F4,#1D4FD0); }
.ag-brand-mark img { width: 17px; height: 17px; object-fit: contain; }

.ag-center { flex: 1; display: flex; align-items: center; justify-content: center; padding: 8px 0; }
.ag-form-wrap { width: 100%; max-width: 502px; display: flex; flex-direction: column; }
.ag-form-wrap > * { animation: agRise .6s cubic-bezier(.2,.7,.2,1) both; }
.ag-form-wrap > *:nth-child(2) { animation-delay: .06s; } .ag-form-wrap > *:nth-child(3) { animation-delay: .12s; }
.ag-form-wrap > *:nth-child(4) { animation-delay: .18s; } .ag-form-wrap > *:nth-child(5) { animation-delay: .24s; }

.ag-title { margin: 0; text-align: center; font-size: 26px; line-height: 1.2; font-weight: 500; letter-spacing: -.01em; }
.ag-sub { margin: 14px auto 26px; max-width: 340px; min-height: 50px; text-align: center; font-size: 16px; line-height: 25px; color: var(--muted); }

.ag-tabs { position: relative; width: 436px; max-width: 100%; align-self: center; display: grid; grid-template-columns: 1fr 1fr; padding: 4px; margin-bottom: 40px; border: 1px solid #E1E7EF; border-radius: 10px; background: #fff; }
.ag-tabs-pill { position: absolute; top: 4px; bottom: 4px; left: 4px; width: calc(50% - 4px); border-radius: 8px; background: #E8EEF8; transition: transform .3s cubic-bezier(.3,.9,.3,1); }
.ag-tabs[data-tab="vendor"] .ag-tabs-pill { transform: translateX(100%); }
.ag-tab { position: relative; z-index: 1; height: 44px; border: 0; background: transparent; font: inherit; font-size: 16px; font-weight: 500; color: var(--muted); cursor: pointer; transition: color .2s; }
.ag-tab.active { color: #1B2B44; }
.ag-tab:focus-visible, .ag-btn:focus-visible, .ag-input:focus-visible, .ag-eye:focus-visible, .ag-soc:focus-visible { outline: 2px solid var(--blue); outline-offset: 2px; }

.ag-form { width: 100%; display: flex; flex-direction: column; margin: 0; }
.ag-group { margin-bottom: 22px; }
.ag-label { display: block; margin-bottom: 10px; font-size: 14.5px; font-weight: 500; color: var(--navy); }
.ag-label i { font-style: normal; color: var(--blue); margin-left: 3px; }
.ag-field { position: relative; }
.ag-ico { position: absolute; top: 0; bottom: 0; left: 14px; display: grid; place-items: center; color: #6B7A8D; pointer-events: none; }
.ag-input {
  width: 100%; height: 43px; padding: 0 14px 0 44px; border-radius: 8px; border: 1px solid var(--line); background: #fff;
  font: inherit; font-size: 14.5px; color: var(--navy); outline: none; transition: border-color .2s, box-shadow .2s;
}
.ag-input.has-eye { padding-right: 44px; }
.ag-input::placeholder { color: #8794A3; }
.ag-input:focus { border-color: var(--blue); box-shadow: 0 0 0 4px rgba(37,99,235,.12); }
.ag-input:disabled { opacity: .6; }
.ag-eye { position: absolute; top: 0; bottom: 0; right: 0; width: 44px; border: 0; background: transparent; color: #7A8797; display: grid; place-items: center; cursor: pointer; }
.ag-eye:hover { color: var(--navy); }

.ag-row { display: flex; justify-content: space-between; align-items: center; margin: -4px 0 0; font-size: 13.5px; color: var(--muted); }
.ag-row label { display: inline-flex; align-items: center; gap: 8px; cursor: pointer; }
.ag-row input { accent-color: var(--blue); margin: 0; }
.ag-row a { color: var(--blue); text-decoration: none; }
.ag-row a:hover { text-decoration: underline; }

.ag-btn {
  width: 100%; height: 50px; margin-top: 24px; border-radius: 8px; border: 1px solid #1B46B8; color: #fff;
  background: linear-gradient(180deg, #3A7BF0 0%, #1F55D6 100%);
  font: inherit; font-size: 16px; font-weight: 500; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px;
  box-shadow: inset 0 1px 0 rgba(255,255,255,.28), 0 8px 16px -8px rgba(29,78,216,.6); transition: filter .2s, transform .15s;
}
.ag-btn:hover { filter: brightness(1.06); }
.ag-btn:active { transform: scale(.995); }
.ag-btn:disabled { opacity: .7; cursor: not-allowed; filter: none; }
.ag-spin { width: 16px; height: 16px; animation: agSpin .9s linear infinite; }

.ag-alert { display: flex; gap: 8px; align-items: flex-start; padding: 10px 12px; margin-bottom: 18px; border-radius: 8px; font-size: 13px; font-weight: 500; animation: agPop .25s ease-out both; }
.ag-alert svg { flex-shrink: 0; margin-top: 1px; }
.ag-alert.error { background: #FFF1F2; border: 1px solid #FECDD3; color: #BE123C; }
.ag-alert.success { background: #ECFDF5; border: 1px solid #A7F3D0; color: #065F46; }

.ag-or { display: flex; align-items: center; gap: 14px; margin: 28px 0 24px; font-size: 15px; color: #66758A; }
.ag-or::before, .ag-or::after { content: ''; flex: 1; height: 1px; background: #DCE3EC; }
.ag-socials { display: flex; justify-content: center; gap: 12px; }
.ag-soc { width: 56px; height: 56px; border-radius: 10px; border: 1px solid #EEF2F7; background: #F3F6FA; display: grid; place-items: center; cursor: pointer; box-shadow: 0 2px 6px rgba(15,40,90,.06); transition: transform .2s, box-shadow .2s; }
.ag-soc:hover { transform: translateY(-2px); box-shadow: 0 8px 16px rgba(15,40,90,.1); }
.ag-fill { align-self: center; margin-top: 14px; background: none; border: 0; padding: 0; font: inherit; font-size: 12px; color: #8794A3; text-decoration: underline; cursor: pointer; }

.ag-foot { display: flex; justify-content: center; flex-wrap: wrap; align-items: center; gap: 4px 10px; font-size: 13.5px; color: #6B7785; text-align: center; }
.ag-foot a { color: var(--blue); text-decoration: none; }
.ag-foot a:hover { text-decoration: underline; }
.ag-foot s { text-decoration: none; color: #B4BECB; }

/* ── Right ── */
.ag-right {
  position: relative; overflow: hidden; border-radius: 20px; min-width: 0;
  background: radial-gradient(120% 60% at 50% 0%, #1d67df 0%, rgba(14, 53, 115, 0.25) 70%), linear-gradient(180deg, #12408ece 0%, #0b2c6aec 48%, #071D4B 100%);
}
.ag-right::before {
  content: ''; position: absolute; inset: 0;
  background-image: linear-gradient(rgba(255,255,255,.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.05) 1px, transparent 1px);
  background-size: 64px 64px;
}
.ag-right::after {
  content: ''; position: absolute; inset: 0; background-repeat: no-repeat; background-size: 64px 64px;
  background-image: linear-gradient(rgba(255,255,255,.045), rgba(255,255,255,.045)), linear-gradient(rgba(255,255,255,.045), rgba(255,255,255,.045)), linear-gradient(rgba(255,255,255,.045), rgba(255,255,255,.045)), linear-gradient(rgba(255,255,255,.045), rgba(255,255,255,.045));
  background-position: 64px 128px, 448px 64px, 512px 576px, 128px 640px;
}
.ag-canvas { position: absolute; top: 50%; left: 50%; width: 704px; height: 900px; transform-origin: center center; z-index: 2; }

.ag-fc { position: absolute; padding: 5px; border-radius: 16px; background: rgba(255,255,255,.16); border: 1px solid rgba(255,255,255,.34); box-shadow: 0 24px 44px -14px rgba(2,10,40,.55); backdrop-filter: blur(6px); }
.ag-fc.c1 { left: 186px; top: 68px; width: 252px; height: 236px; z-index: 1; animation: agFloat 6s ease-in-out infinite; }
.ag-fc.c2 { left: 336px; top: 217px; width: 273px; height: 233px; z-index: 2; animation: agFloat 7s ease-in-out -2s infinite; }
.ag-fc.c3 { left: 130px; top: 340px; width: 259px; height: 228px; z-index: 3; animation: agFloat 6.5s ease-in-out -4s infinite; }
.ag-in { position: relative; height: 100%; padding: 10px 11px; border-radius: 11px; background: #fff; overflow: hidden; color: var(--navy); }
.ag-hd { display: flex; justify-content: space-between; align-items: center; font-size: 9.5px; font-weight: 500; }
.ag-hd span { display: inline-flex; align-items: center; gap: 3px; font-size: 6.5px; font-weight: 400; color: #7A8797; }
.ag-mid { display: flex; align-items: center; gap: 14px; margin-top: 8px; }
.ag-mid strong { display: block; font-size: 15px; font-weight: 600; }
.ag-mid em { display: block; font-style: normal; font-size: 7.5px; color: #7A8797; margin-bottom: 8px; }
.ag-mid ul { list-style: none; margin: 0; padding: 0; display: grid; gap: 5px; font-size: 6.5px; color: #7A8797; }
.ag-mid li { display: flex; align-items: center; gap: 5px; }
.ag-mid li i { width: 4px; height: 4px; border-radius: 50%; }
.ag-sub2 { margin-top: 12px; font-size: 8.5px; font-weight: 500; }
.ag-rows { display: grid; grid-template-columns: 1fr 1fr; gap: 26px; margin-top: 8px; font-size: 6px; color: #7A8797; }
.ag-rows span { display: flex; justify-content: space-between; }
.ag-bar { display: block; height: 3px; margin-top: 5px; border-radius: 3px; background: #E3EBF5; }
.ag-bar b { display: block; height: 100%; border-radius: inherit; background: #2F6FE0; }
.ag-bar.y b { background: #F5B82E; }
.ag-dark { position: absolute; left: 11px; right: 11px; bottom: 10px; height: 20px; border-radius: 5px; background: #29405F; color: #fff; display: grid; place-items: center; font-size: 7px; font-weight: 500; }

.ag-sec { margin-top: 8px; padding: 8px 9px 7px; border: 1px solid #EAEFF5; border-radius: 8px; }
.ag-sec h6 { margin: 0; font-size: 8px; font-weight: 500; }
.ag-sec p { margin: 2px 0 0; font-size: 6px; color: #7A8797; }
.ag-amt { margin-top: 6px; font-size: 12.5px; font-weight: 600; }
.ag-amt span { margin-left: 3px; font-size: 6px; font-weight: 500; color: #2F6FE0; }
.ag-sec .ag-bar { height: 4px; margin-top: 6px; }
.ag-sec-ft { display: flex; justify-content: space-between; margin-top: 6px; font-size: 5.8px; color: #7A8797; }
.ag-sec-ft b { font-weight: 500; color: #2F6FE0; }

.ag-tot { margin-top: 10px; font-size: 6px; color: #7A8797; }
.ag-tamt { display: flex; justify-content: space-between; align-items: center; margin-top: 3px; font-size: 15px; font-weight: 600; }
.ag-chip { padding: 2px 5px; border-radius: 3px; background: #FFF3D1; color: #C98A00; font-size: 6px; font-weight: 500; }
.ag-item { display: flex; justify-content: space-between; align-items: center; padding: 6px 7px; }
.ag-item b { display: block; font-size: 7px; font-weight: 500; }
.ag-item small { display: block; margin-top: 2px; font-size: 5.8px; color: #7A8797; }
.ag-item .r { text-align: right; }
.ag-item .r em { display: block; margin-top: 2px; font-style: normal; font-size: 5.8px; color: #16A34A; }
.ag-item.box { margin-top: 7px; border: 1px solid #EAEFF5; border-radius: 6px; }
.ag-soft { margin-top: 6px; padding: 2px 5px; border-radius: 6px; background: #F7F9FC; }

.ag-copy { position: absolute; left: 0; right: 0; top: 632px; padding: 0 40px; display: flex; flex-direction: column; align-items: center; text-align: center; }
.ag-logo { width: 78px; height: 78px; border-radius: 20px; display: grid; place-items: center; background: linear-gradient(180deg,#3F83F4,#1D4FD0); border: 1px solid rgba(255,255,255,.4); box-shadow: 0 14px 30px -8px rgba(37,99,235,.65), inset 0 1px 0 rgba(255,255,255,.35); }
.ag-logo img { width: 40px; height: 40px; object-fit: contain; }
.ag-slide { display: flex; flex-direction: column; align-items: center; animation: agFade .6s ease both; }
.ag-h { margin: 28px 0 0; max-width: 520px; font-size: 32px; line-height: 1.28; font-weight: 500; letter-spacing: -.02em; text-wrap: balance;
  background: linear-gradient(180deg, rgba(255,255,255,.94), rgba(255,255,255,.62)); -webkit-background-clip: text; background-clip: text; color: transparent; -webkit-text-fill-color: transparent; }
.ag-p { margin: 16px 0 0; max-width: 490px; font-size: 15.5px; line-height: 1.5; color: rgba(255,255,255,.66); text-wrap: balance; }

.ag-bars { position: absolute; left: 20px; right: 20px; bottom: 21px; z-index: 3; display: grid; grid-template-columns: repeat(4, 1fr); gap: 9px; }
.ag-seg { height: 6px; border-radius: 3px; background: rgba(255,255,255,.2); overflow: hidden; }
.ag-seg i { display: block; height: 100%; width: 0; border-radius: inherit; background: #fff; }
.ag-seg.done i { width: 100%; }
.ag-seg.active i { animation: agBar linear forwards; }

@keyframes agRise { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: none; } }
@keyframes agFade { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
@keyframes agPop { from { opacity: 0; transform: translateY(-4px) scale(.98); } to { opacity: 1; transform: none; } }
@keyframes agSpin { to { transform: rotate(360deg); } }
@keyframes agFloat { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-7px); } }
@keyframes agBar { from { width: 0; } to { width: 100%; } }

@media (prefers-reduced-motion: reduce) {
  .ag-root * { animation: none !important; transition: none !important; }
  .ag-seg.active i { width: 100%; }
}
@media (max-height: 820px) and (min-width: 1024px) {
  .ag-sub { margin-bottom: 18px; } .ag-tabs { margin-bottom: 26px; } .ag-group { margin-bottom: 16px; }
  .ag-or { margin: 20px 0 16px; }
}
@media (max-width: 1023px) {
  .ag-root { height: auto; min-height: 100vh; overflow: visible; }
  .ag-frame { grid-template-columns: 1fr; height: auto; min-height: 100vh; border-radius: 0; padding: 10px; }
  .ag-right { display: none; }
  .ag-left { padding: 16px; }
  .ag-center { padding: 32px 0; }
}
@media (max-width: 520px) { .ag-title { font-size: 23px; } .ag-sub { font-size: 15px; } }
`;

/* ───────────── Donut (Project Overview card) ───────────── */
const Donut = () => {
  const r = 34; const c = 2 * Math.PI * r;
  const arc = (a: number, b: number, color: string) => (
    <circle cx="42" cy="42" r={r} fill="none" stroke={color} strokeWidth="9" strokeLinecap="round"
      strokeDasharray={`${(b - a) * c} ${c}`} strokeDashoffset={-a * c} transform="rotate(-90 42 42)" />
  );
  return (
    <svg viewBox="0 0 84 84" width="84" height="84" aria-hidden="true">
      {arc(0.17, 0.97, '#2F6FE0')}{arc(0.015, 0.1, '#F5B82E')}{arc(0.115, 0.14, '#F0605D')}
    </svg>
  );
};

/* ───────────── Right panel (floating cards + copy + progress) ───────────── */
function RightPanel() {
  const ref = useRef<HTMLElement>(null);
  const [scale, setScale] = useState(1);
  const [slide, setSlide] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const calc = () => {
      const { width, height } = el.getBoundingClientRect();
      if (width > 0 && height > 0) setScale(Math.min(1.25, width / 704, height / 960));
    };
    calc();
    const ro = new ResizeObserver(calc);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setSlide((s) => (s + 1) % SLIDES.length), SLIDE_MS);
    return () => clearTimeout(t);
  }, [slide]);

  return (
    <aside className="ag-right" ref={ref} aria-hidden="true">
      <div className="ag-canvas" style={{ transform: `translate(-50%, -50%) scale(${scale})` }}>
        {/* Card 1 */}
        <div className="ag-fc c1"><div className="ag-in">
          <div className="ag-hd"><b style={{ fontWeight: 500 }}>Project Overview</b><span>This Month {I.chevron(7)}</span></div>
          <div className="ag-mid">
            <Donut />
            <div>
              <strong>1,248</strong><em>Installed</em>
              <ul>
                <li><i style={{ background: '#F5B82E' }} />Surveyed Sites</li>
                <li><i style={{ background: '#F0605D' }} />Pending Approval</li>
                <li><i style={{ background: '#2F6FE0' }} />In Transit</li>
              </ul>
            </div>
          </div>
          <div className="ag-sub2">Upcoming Dispatches</div>
          <div className="ag-rows">
            <div><span><b style={{ fontWeight: 500, color: '#0B2447' }}>Street Light 40W</b></span><span>198 of 299 units</span><i className="ag-bar"><b style={{ width: '66%' }} /></i></div>
            <div><span><b style={{ fontWeight: 500, color: '#0B2447' }}>Solar Panels</b><span>1,200</span></span><i className="ag-bar y"><b style={{ width: '48%' }} /></i></div>
          </div>
          <div className="ag-dark">Explore All Projects</div>
        </div></div>

        {/* Card 2 */}
        <div className="ag-fc c2"><div className="ag-in">
          <div className="ag-hd"><b style={{ fontWeight: 500 }}>Work Orders</b></div>
          <div className="ag-sec">
            <h6>Lucknow Phase-2</h6><p>Due date - Nov 09, 2026</p>
            <div className="ag-amt">1,900<span>/ 6,500</span></div>
            <i className="ag-bar"><b style={{ width: '29%' }} /></i>
            <div className="ag-sec-ft"><span>Units Pending to Complete</span><b>4,600 (71%)</b></div>
          </div>
          <div className="ag-sec">
            <h6>Patna Phase-1</h6><p>Due date - Nov 18, 2026</p>
            <div className="ag-amt">12,000<span>/ 20,000</span></div>
            <i className="ag-bar y"><b style={{ width: '60%' }} /></i>
            <div className="ag-sec-ft"><span>Units Pending to Complete</span><b>8,000 (40%)</b></div>
          </div>
        </div></div>

        {/* Card 3 */}
        <div className="ag-fc c3"><div className="ag-in">
          <div className="ag-hd"><b style={{ fontWeight: 500, fontSize: 8.5 }}>Material Stock</b><span>{I.refresh} Updated just now</span></div>
          <div className="ag-tot">Total value</div>
          <div className="ag-tamt">₹ 17,36,600<span className="ag-chip">↑ 12%</span></div>
          <div className="ag-item box"><div><b>Solar Panel 540W</b><small>Waaree · 40 units</small></div><div className="r"><b>₹1,100</b><em>+3.8%</em></div></div>
          <div className="ag-soft">
            <div className="ag-item"><div><b>Inverter 5kW</b><small>Luminous · 25 units</small></div><div className="r"><b>₹700</b><em>+2.5%</em></div></div>
            <div className="ag-item"><div><b>Li-ion Battery</b><small>Exide · 60 units</small></div><div className="r"><b>₹1,400</b><em>+6.2%</em></div></div>
          </div>
          <div className="ag-dark">Review Inventory</div>
        </div></div>

        {/* Logo + copy */}
        <div className="ag-copy">
          <div className="ag-logo"><img src="/logo-abbr.png" alt="" /></div>
          <div className="ag-slide" key={slide}>
            <h2 className="ag-h">{SLIDES[slide].h}</h2>
            <p className="ag-p">{SLIDES[slide].p}</p>
          </div>
        </div>
      </div>

      <div className="ag-bars">
        {SLIDES.map((_, n) => {
          const state = n < slide ? 'done' : n === slide ? 'active' : '';
          return (
            <div className={`ag-seg ${state}`} key={`${n}-${state}`}>
              <i style={state === 'active' ? { animationDuration: `${SLIDE_MS}ms` } : undefined} />
            </div>
          );
        })}
      </div>
    </aside>
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

           <RightPanel />
        {/* ───── LEFT ───── */}
        <section className="ag-left">
          <header className="ag-brand">
            <span className="ag-brand-mark"><img src="/logo-abbr.png" alt="" /></span>
            <span>KLK Ventures</span>
          </header>

          <div className="ag-center">
            <div className="ag-form-wrap">
              <div>
                <h1 className="ag-title">Welcome to KLK ERP</h1>
                <p className="ag-sub">
                  {isUser ? 'Start your experience with KLK ERP by signing in to your user account.' : 'Sign in with your Vendor ID and password to open the V-Portal.'}
                </p>
              </div>

              <div role="tablist" aria-label="Login type" className="ag-tabs" data-tab={activeTab}>
                <span className="ag-tabs-pill" />
                {(['user', 'vendor'] as const).map((tab) => (
                  <button
                    key={tab} type="button" role="tab" aria-selected={activeTab === tab}
                    className={`ag-tab${activeTab === tab ? ' active' : ''}`} onClick={() => handleTabChange(tab)}
                  >
                    {tab === 'user' ? 'User Login' : 'Vendor Login'}
                  </button>
                ))}
              </div>

              <form onSubmit={handleSubmit} className="ag-form" noValidate>
                {errorMessage && <div role="alert" className="ag-alert error">{I.alert}<span>{errorMessage}</span></div>}
                {successMessage && <div role="status" className="ag-alert success">{I.check}<span>{successMessage}</span></div>}

                <div className="ag-group">
                  {isUser ? (
                    <>
                      <label className="ag-label" htmlFor="ag-email">Email Address<i>*</i></label>
                      <div className="ag-field">
                        <span className="ag-ico">{I.mail()}</span>
                        <input
                          id="ag-email" type="email" name="email" autoComplete="email"
                          value={email} onChange={(e) => setEmail(e.target.value)}
                          placeholder="Enter your email address" className="ag-input" disabled={loading}
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      <label className="ag-label" htmlFor="ag-vendor">Vendor ID<i>*</i></label>
                      <div className="ag-field">
                        <span className="ag-ico">{I.vendor()}</span>
                        <input
                          id="ag-vendor" type="text" name="vendor_id" autoComplete="username"
                          value={vendorId} onChange={(e) => setVendorId(e.target.value)}
                          placeholder="Enter your vendor ID (e.g. KLK29045)" className="ag-input" disabled={loading}
                        />
                      </div>
                    </>
                  )}
                </div>

                <div className="ag-group" style={SHOW_REMEMBER_ROW ? undefined : { marginBottom: 0 }}>
                  <label className="ag-label" htmlFor="ag-pass">Password<i>*</i></label>
                  <div className="ag-field">
                    <span className="ag-ico">{I.lock()}</span>
                    <input
                      id="ag-pass" type={showPassword ? 'text' : 'password'} name="password" autoComplete="current-password"
                      value={password} onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password" className="ag-input has-eye" disabled={loading}
                    />
                    <button type="button" className="ag-eye" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? 'Hide password' : 'Show password'}>
                      {showPassword ? I.eyeOff : I.eye}
                    </button>
                  </div>
                </div>

                {SHOW_REMEMBER_ROW && (
                  <div className="ag-row">
                    <label>
                      <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} />
                      <span>Remember session</span>
                    </label>
                    <a href="https://klkerp.com/forgot-password" target="_blank" rel="noreferrer">Forgot password?</a>
                  </div>
                )}

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
                    <span>{isUser ? 'Sign In' : 'Sign In as Vendor'}</span>
                  )}
                </button>
              </form>

              {SHOW_SOCIAL && (
                <>
                  <div className="ag-or">Or continue with</div>
                  <div className="ag-socials">
                    {SOCIAL.map((s) => (
                      <button
                        key={s.name} type="button" className="ag-soc" aria-label={`Continue with ${s.name}`}
                        onClick={() => { setSuccessMessage(''); setErrorMessage(`${s.name} login is not enabled yet. Please sign in with your ${isUser ? 'email' : 'Vendor ID'}.`); }}
                      >
                        {s.icon}
                      </button>
                    ))}
                  </div>
                </>
              )}

              {SHOW_DEMO_FILL && (
                <button
                  type="button" className="ag-fill"
                  onClick={() => {
                    if (isUser) { setEmail('admin@klkerp.com'); setPassword('admin123'); }
                    else { setVendorId('KLK29045'); setPassword('vendor123'); }
                  }}
                >
                  Auto-fill sample credentials
                </button>
              )}
            </div>
          </div>

          <footer className="ag-foot">
            <span>Copyright : KLK Ventures, All Rights Reserved</span>
            <a href="https://klkerp.com" target="_blank" rel="noreferrer">Terms &amp; Conditions</a>
            <s>|</s>
            <a href="https://klkerp.com" target="_blank" rel="noreferrer">Privacy Policy</a>
          </footer>
        </section>

        {/* ───── RIGHT ───── */}
     
      </div>
    </div>
  );
}

export default SolarLoginPage;