import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

/* ──────────────────────────────────────────────────────────────
   Crisp SVG Icons Matching the Theme
   ────────────────────────────────────────────────────────────── */
const ICONS = {
  // User tab & field icon
  user: (
    <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  ),
  // Vendor tab & field icon (Storefront)
  vendor: (
    <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l1 11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2l1-11" />
      <path d="M3 9l2-6h14l2 6" />
      <path d="M9 22v-8h6v8" />
    </svg>
  ),
  // Lock icon
  lock: (
    <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  ),
  // Eye icon (show password)
  eye: (
    <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ),
  // Eye off icon (hide password)
  eyeOff: (
    <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  ),
  // Login button arrow into door icon
  loginArrow: (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 4h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4" />
      <polyline points="10 16 14 12 10 8" />
      <line x1="14" y1="12" x2="4" y2="12" />
    </svg>
  ),
  // Alert circle
  alert: (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  ),
  // Checkmark circle
  check: (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
};

/* Shared input styling so every field looks identical */
const INPUT_BASE =
  'w-full h-10 bg-[#F8FAFD] border-[1.5px] border-[#DCE4EF] hover:border-[#C3D0E2] focus:border-[#1A66FF] focus:ring-4 focus:ring-[#1A66FF]/12 focus:bg-white text-slate-900 text-[15px] rounded-xl pl-12 transition-all duration-150 outline-none font-medium placeholder:text-slate-400 placeholder:font-normal disabled:opacity-60';

const LABEL_BASE = 'block text-[13px] font-semibold text-slate-700';
const ICON_WRAP =
  'absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-[#1A66FF] transition-colors';

export function SolarLoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { loginUser, loginVendor, isAuthenticated } = useAuth();

  const [activeTab, setActiveTab] = useState<'user' | 'vendor'>('user');
  const [email, setEmail] = useState('');
  const [vendorId, setVendorId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Auto redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      const from = (location.state as any)?.from?.pathname || '/';
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, location]);

  const handleTabChange = (tab: 'user' | 'vendor') => {
    setActiveTab(tab);
    setErrorMessage('');
    setSuccessMessage('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (activeTab === 'user') {
      if (!email.trim()) {
        setErrorMessage('Please enter your User Email');
        return;
      }
      if (!password) {
        setErrorMessage('Please enter your Password');
        return;
      }

      setLoading(true);
      try {
        const res = await loginUser(email, password, rememberMe);
        if (res.success) {
          setSuccessMessage(res.message || 'Login successful! Redirecting to ERP...');
          setTimeout(() => {
            const from = (location.state as any)?.from?.pathname || '/';
            navigate(from, { replace: true });
          }, 600);
        } else {
          setErrorMessage(res.message || 'Credentials do not match.');
        }
      } catch (err: any) {
        setErrorMessage(err.message || 'Unable to connect to server. Please try again.');
      } finally {
        setLoading(false);
      }
    } else {
      // Vendor login
      if (!vendorId.trim()) {
        setErrorMessage('The vendor id field is required.');
        return;
      }
      if (!password) {
        setErrorMessage('The password field is required.');
        return;
      }

      setLoading(true);
      try {
        const res = await loginVendor(vendorId, password, rememberMe);
        if (res.success) {
          setSuccessMessage(res.message || 'Vendor login successful! Redirecting to ERP...');
          setTimeout(() => {
            const from = (location.state as any)?.from?.pathname || '/';
            navigate(from, { replace: true });
          }, 600);
        } else {
          setErrorMessage(res.message || 'Invalid Vendor ID or password.');
        }
      } catch (err: any) {
        setErrorMessage(err.message || 'Unable to connect to server. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="login-root-container min-h-screen w-full flex items-center justify-center lg:justify-end overflow-x-hidden font-sans relative selection:bg-blue-600 selection:text-white">
      {/* ────────────────────────────────────────────────────────
          Responsive Background Strategy:
          - Mobile & Tablet (< 1024px): uses `/images/bg.png`
          - Desktop (>= 1024px): uses `/images/solar-login-bg.png` with 100% 100% fit (no cut-off at bottom)
          ──────────────────────────────────────────────────────── */}
      <style>{`
        .login-root-container {
          background-image: url('/images/bg.png');
          background-size: cover;
          background-position: center top;
          background-repeat: no-repeat;
          background-color: #F4F8FD;
          min-height: 100vh;
        }
        @media (min-width: 1024px) {
          .login-root-container {
            background-image: url('/images/solar-login-bg.png');
            background-size: 100% 100%;
            background-position: center center;
            height: 100vh;
            max-height: 100vh;
            overflow-y: auto;
          }
        }
        @keyframes klkFadeIn {
          from { opacity: 0; transform: translateY(-4px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn { animation: klkFadeIn 0.22s ease-out both; }
        @media (prefers-reduced-motion: reduce) {
          .animate-fadeIn { animation: none; }
        }
      `}</style>

      {/* Subtle overlay on mobile only so card stands out clearly against the mobile portrait background */}
      <div className="absolute inset-0 bg-slate-900/15 backdrop-blur-[1px] lg:hidden z-0 pointer-events-none" />

      {/* ────────────────────────────────────────────────────────
          RIGHT SECTION: Login Card
          ──────────────────────────────────────────────────────── */}
      <div className="relative z-10 w-full xl:w-[45%] flex items-center justify-center px-4 py-8 sm:px-8 lg:px-6 xl:pr-14 2xl:pr-24">

        {/* Card */}
        <div className="w-full max-w-[420px] sm:max-w-[460px] bg-white/95 backdrop-blur-md rounded-[28px] shadow-[0_24px_60px_-12px_rgba(10,35,80,0.16),0_0_1px_1px_rgba(0,0,0,0.03)] border border-slate-100 px-6 py-6 sm:px-8 sm:py-6 relative z-20 flex flex-col gap-3">

          {/* Brand Logo */}
          <div className="flex items-center justify-center">
            <img
              src="/logo-full.png"
              alt="KLK Ventures"
              className="h-9 sm:h-10 w-auto object-contain max-w-[180px]"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/logo-abbr.png';
              }}
            />
          </div>

          {/* Card Header: Title + Royal Blue Underline Bar */}
          <div className="flex flex-col items-center text-center gap-1.5">
            <h2 className="text-xl sm:text-2xl leading-tight font-extrabold text-[#0A234A] tracking-tight">
              {activeTab === 'user' ? 'User Login' : 'Vendor Login'}
            </h2>
            <div className="h-1 w-10 rounded-full bg-[#1A66FF]" />
            <p className="text-[13px] text-slate-500 leading-snug">
              {activeTab === 'user'
                ? 'Logging in as User — sign in with your email'
                : 'Logging in as Vendor — sign in with your Vendor ID'}
            </p>
          </div>

          {/* Toggle Switcher: User vs Vendor */}
          <div
            role="tablist"
            aria-label="Login type"
            className="bg-[#EEF3FA] p-1.5 rounded-full grid grid-cols-2 gap-1.5 border border-slate-200/60"
          >
            {(['user', 'vendor'] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                role="tab"
                aria-selected={activeTab === tab}
                onClick={() => handleTabChange(tab)}
                className={`flex items-center justify-center gap-2 h-9 rounded-full text-sm font-semibold transition-all duration-200 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-[#1A66FF]/50 ${
                  activeTab === tab
                    ? 'bg-[#1A66FF] text-white shadow-[0_2px_8px_rgba(26,102,255,0.35)]'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                }`}
              >
                {ICONS[tab]}
                <span>{tab === 'user' ? 'User' : 'Vendor'}</span>
              </button>
            ))}
          </div>

          {/* Error Feedback Banner */}
          {errorMessage && (
            <div
              role="alert"
              className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-[13px] text-rose-700 flex items-start gap-2.5 animate-fadeIn"
            >
              <span className="text-rose-500 mt-px shrink-0">{ICONS.alert}</span>
              <span className="font-medium leading-snug">{errorMessage}</span>
            </div>
          )}

          {/* Success Feedback Banner */}
          {successMessage && (
            <div
              role="status"
              className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-[13px] text-emerald-800 flex items-start gap-2.5 animate-fadeIn"
            >
              <span className="text-emerald-500 mt-px shrink-0">{ICONS.check}</span>
              <span className="font-medium leading-snug">{successMessage}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-3" noValidate>
            {activeTab === 'user' ? (
              /* User Email Input */
              <div className="flex flex-col gap-1.5">
                <label htmlFor="login-email" className={LABEL_BASE}>
                  User Email
                </label>
                <div className="relative group">
                  <div className={ICON_WRAP}>{ICONS.user}</div>
                  <input
                    id="login-email"
                    type="email"
                    name="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter User Email"
                    className={`${INPUT_BASE} pr-4`}
                    disabled={loading}
                  />
                </div>
              </div>
            ) : (
              /* Vendor ID Input */
              <div className="flex flex-col gap-1.5">
                <label htmlFor="login-vendor" className={LABEL_BASE}>
                  Vendor ID
                </label>
                <div className="relative group">
                  <div className={ICON_WRAP}>{ICONS.vendor}</div>
                  <input
                    id="login-vendor"
                    type="text"
                    name="vendor_id"
                    autoComplete="username"
                    value={vendorId}
                    onChange={(e) => setVendorId(e.target.value)}
                    placeholder="KLK29045"
                    className={`${INPUT_BASE} pr-4`}
                    disabled={loading}
                  />
                </div>
              </div>
            )}

            {/* Password Input */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="login-password" className={LABEL_BASE}>
                Password
              </label>
              <div className="relative group">
                <div className={ICON_WRAP}>{ICONS.lock}</div>
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter Password"
                  className={`${INPUT_BASE} pr-12`}
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute inset-y-0 right-0 w-12 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors cursor-pointer outline-none focus-visible:text-[#1A66FF]"
                >
                  {showPassword ? ICONS.eyeOff : ICONS.eye}
                </button>
              </div>
            </div>

            {/* Action Row: Remember Me & Forgot Password */}
            <div className="flex items-center justify-between gap-3 text-[13px]">
              <label className="inline-flex items-center gap-2 cursor-pointer select-none text-slate-600 hover:text-slate-800 font-medium">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 focus:ring-[#1A66FF] accent-[#1A66FF]"
                />
                <span>Remember session</span>
              </label>

              <a
                href="https://klkerp.com/forgot-password"
                target="_blank"
                rel="noreferrer"
                className="font-semibold text-[#1A66FF] hover:text-[#1554D8] hover:underline underline-offset-2"
              >
                Forgot Password?
              </a>
            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 px-6 bg-[#1A66FF] hover:bg-[#1554D8] active:scale-[0.99] text-white font-bold text-base rounded-xl shadow-[0_4px_16px_rgba(26,102,255,0.35)] hover:shadow-[0_6px_22px_rgba(26,102,255,0.45)] flex items-center justify-center gap-2.5 transition-all duration-150 cursor-pointer outline-none focus-visible:ring-4 focus-visible:ring-[#1A66FF]/30 disabled:opacity-60 disabled:cursor-not-allowed disabled:shadow-none"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  {ICONS.loginArrow}
                  <span>Login</span>
                </>
              )}
            </button>
          </form>

          {/* Card Footer Divider with KLK Emblem */}
          <div className="flex items-center gap-3">
            <div className="flex-1 border-t border-slate-200" />
            <span className="text-slate-500 text-xs sm:text-[13px] font-semibold flex items-center gap-2 whitespace-nowrap">
              <img src="/logo-abbr.png" alt="" className="h-5 w-auto object-contain opacity-85" />
              <span>KLK Solar ERP System</span>
            </span>
            <div className="flex-1 border-t border-slate-200" />
          </div>

          {/* Development / Testing Quick Credentials Helper */}
          <div className="text-center">
            <button
              type="button"
              onClick={() => {
                if (activeTab === 'user') {
                  setEmail('admin@klkerp.com');
                  setPassword('admin123');
                } else {
                  setVendorId('KLK29045');
                  setPassword('vendor123');
                }
              }}
              className="text-xs text-slate-400 hover:text-[#1A66FF] transition-colors underline underline-offset-2 cursor-pointer"
            >
              Auto-fill sample credentials
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SolarLoginPage;