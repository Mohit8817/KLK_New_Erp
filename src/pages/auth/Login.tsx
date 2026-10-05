import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

/* ──────────────────────────────────────────────────────────────
   SVG Icons
   ────────────────────────────────────────────────────────────── */
const svgProps = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

const ICONS = {
  user: (
    <svg {...svgProps} width="19" height="19">
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  ),
  vendor: (
    <svg {...svgProps} width="19" height="19">
      <path d="M3 9l1 11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2l1-11" />
      <path d="M3 9l2-6h14l2 6" />
      <path d="M9 22v-8h6v8" />
    </svg>
  ),
  lock: (
    <svg {...svgProps} width="19" height="19">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  ),
  eye: (
    <svg {...svgProps} width="19" height="19">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ),
  eyeOff: (
    <svg {...svgProps} width="19" height="19">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  ),
  loginArrow: (
    <svg {...svgProps} width="20" height="20" strokeWidth={2.3}>
      <path d="M14 4h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4" />
      <polyline points="10 16 14 12 10 8" />
      <line x1="14" y1="12" x2="4" y2="12" />
    </svg>
  ),
  alert: (
    <svg {...svgProps} width="18" height="18">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  ),
  check: (
    <svg {...svgProps} width="18" height="18" strokeWidth={2.5}>
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
};

/* ──────────────────────────────────────────────────────────────
   Scoped styles (no Tailwind / no external CSS needed)
   ────────────────────────────────────────────────────────────── */
const LOGIN_CSS = `
.klk-login-root, .klk-login-root * { box-sizing: border-box; }

.klk-login-root {
  position: relative;
  min-height: 100vh;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow-x: hidden;
  font-family: 'Segoe UI', system-ui, -apple-system, Roboto, Arial, sans-serif;
  background-color: #F4F8FD;
  background-image: url('/images/bg.png');
  background-size: cover;
  background-position: center top;
  background-repeat: no-repeat;
}

.klk-login-overlay {
  position: absolute;
  inset: 0;
  background: rgba(15, 23, 42, 0.15);
  pointer-events: none;
  z-index: 0;
}

.klk-login-side {
  position: relative;
  z-index: 1;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 32px 16px;
}

.klk-login-card {
  width: 100%;
  max-width: 440px;
  background: rgba(255, 255, 255, 0.96);
  border: 1px solid #EEF2F7;
  border-radius: 28px;
  box-shadow: 0 24px 60px -12px rgba(10, 35, 80, 0.16), 0 0 1px 1px rgba(0, 0, 0, 0.03);
  padding: 24px 28px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.klk-login-logo { display: flex; justify-content: center; }
.klk-login-logo img { height: 40px; width: auto; max-width: 180px; object-fit: contain; }

.klk-login-head { display: flex; flex-direction: column; align-items: center; text-align: center; gap: 6px; }
.klk-login-title { margin: 0; font-size: 24px; line-height: 1.2; font-weight: 800; color: #0A234A; letter-spacing: -0.01em; }
.klk-login-bar { height: 4px; width: 40px; border-radius: 999px; background: #1A66FF; }
.klk-login-sub { margin: 0; font-size: 13px; color: #64748B; line-height: 1.35; }

/* Tabs */
.klk-login-tabs {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px;
  padding: 6px;
  background: #EEF3FA;
  border: 1px solid rgba(203, 213, 225, 0.6);
  border-radius: 999px;
}
.klk-login-tab {
  display: flex; align-items: center; justify-content: center; gap: 8px;
  height: 36px;
  border: 0; border-radius: 999px;
  background: transparent; color: #475569;
  font: inherit; font-size: 14px; font-weight: 600;
  cursor: pointer; transition: all .2s;
}
.klk-login-tab:hover { background: rgba(255,255,255,.6); color: #0F172A; }
.klk-login-tab.active { background: #1A66FF; color: #fff; box-shadow: 0 2px 8px rgba(26,102,255,.35); }
.klk-login-tab svg, .klk-login-field svg { flex-shrink: 0; }

/* Alerts */
.klk-login-alert {
  display: flex; align-items: flex-start; gap: 10px;
  padding: 12px; border-radius: 12px; font-size: 13px; font-weight: 500; line-height: 1.35;
  animation: klkFadeIn .22s ease-out both;
}
.klk-login-alert svg { margin-top: 1px; flex-shrink: 0; }
.klk-login-alert.error   { background: #FFF1F2; border: 1px solid #FECDD3; color: #BE123C; }
.klk-login-alert.success { background: #ECFDF5; border: 1px solid #A7F3D0; color: #065F46; }

/* Form */
.klk-login-form { display: flex; flex-direction: column; gap: 14px; margin: 0; }
.klk-login-group { display: flex; flex-direction: column; gap: 6px; }
.klk-login-label { font-size: 13px; font-weight: 600; color: #334155; }

.klk-login-field { position: relative; }
.klk-login-icon {
  position: absolute; top: 0; bottom: 0; left: 0; width: 48px;
  display: flex; align-items: center; justify-content: center;
  color: #94A3B8; pointer-events: none; transition: color .15s;
}
.klk-login-field:focus-within .klk-login-icon { color: #1A66FF; }

.klk-login-input {
  display: block; width: 100%; height: 42px;
  padding: 0 16px 0 48px;
  background: #F8FAFD;
  border: 1.5px solid #DCE4EF;
  border-radius: 12px;
  font: inherit; font-size: 15px; font-weight: 500; color: #0F172A;
  outline: none; transition: all .15s;
}
.klk-login-input.has-toggle { padding-right: 48px; }
.klk-login-input::placeholder { color: #94A3B8; font-weight: 400; }
.klk-login-input:hover { border-color: #C3D0E2; }
.klk-login-input:focus { border-color: #1A66FF; background: #fff; box-shadow: 0 0 0 4px rgba(26,102,255,.12); }
.klk-login-input:disabled { opacity: .6; }

.klk-login-eye {
  position: absolute; top: 0; bottom: 0; right: 0; width: 48px;
  display: flex; align-items: center; justify-content: center;
  background: transparent; border: 0; color: #94A3B8; cursor: pointer; transition: color .15s;
}
.klk-login-eye:hover { color: #475569; }

.klk-login-row { display: flex; align-items: center; justify-content: space-between; gap: 12px; font-size: 13px; }
.klk-login-remember { display: inline-flex; align-items: center; gap: 8px; cursor: pointer; user-select: none; color: #475569; font-weight: 500; }
.klk-login-remember input { width: 16px; height: 16px; margin: 0; accent-color: #1A66FF; }
.klk-login-forgot { color: #1A66FF; font-weight: 600; text-decoration: none; }
.klk-login-forgot:hover { color: #1554D8; text-decoration: underline; text-underline-offset: 2px; }

.klk-login-btn {
  width: 100%; height: 44px; padding: 0 24px;
  display: flex; align-items: center; justify-content: center; gap: 10px;
  background: #1A66FF; color: #fff;
  border: 0; border-radius: 12px;
  font: inherit; font-size: 16px; font-weight: 700;
  box-shadow: 0 4px 16px rgba(26,102,255,.35);
  cursor: pointer; transition: all .15s;
}
.klk-login-btn:hover { background: #1554D8; box-shadow: 0 6px 22px rgba(26,102,255,.45); }
.klk-login-btn:active { transform: scale(.99); }
.klk-login-btn:disabled { opacity: .6; cursor: not-allowed; box-shadow: none; }

.klk-login-spin { width: 20px; height: 20px; animation: klkSpin 1s linear infinite; }

/* Footer */
.klk-login-divider { display: flex; align-items: center; gap: 12px; }
.klk-login-divider .line { flex: 1; border-top: 1px solid #E2E8F0; }
.klk-login-divider .text { display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 600; color: #64748B; white-space: nowrap; }
.klk-login-divider img { height: 20px; width: auto; object-fit: contain; opacity: .85; }

.klk-login-fill-wrap { text-align: center; }
.klk-login-fill {
  background: none; border: 0; padding: 0; cursor: pointer;
  font: inherit; font-size: 12px; color: #94A3B8;
  text-decoration: underline; text-underline-offset: 2px; transition: color .15s;
}
.klk-login-fill:hover { color: #1A66FF; }

@keyframes klkFadeIn { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: none; } }
@keyframes klkSpin { to { transform: rotate(360deg); } }
@media (prefers-reduced-motion: reduce) {
  .klk-login-alert, .klk-login-spin { animation: none; }
}

/* ── Tablet / small laptop ── */
@media (min-width: 640px) {
  .klk-login-side { padding: 32px; }
  .klk-login-card { max-width: 460px; padding: 24px 32px; }
}

/* ── Desktop: wide background, card on the right white area ── */
@media (min-width: 1024px) {
  .klk-login-root {
    justify-content: flex-end;
    height: 100vh;
    max-height: 100vh;
    overflow-y: auto;
    background-image: url('/images/solar-login-bg.png');
    background-size: 100% 100%;
    background-position: center center;
  }
  .klk-login-overlay { display: none; }
  .klk-login-side { width: 48%; padding: 24px 24px; }
}
@media (min-width: 1280px) {
  .klk-login-side { width: 45%; padding-right: 56px; }
}
@media (min-width: 1536px) {
  .klk-login-side { padding-right: 96px; }
}
`;

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

  const redirectTo = () => (location.state as any)?.from?.pathname || '/';

  // Auto redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate(redirectTo(), { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      if (!email.trim()) return setErrorMessage('Please enter your User Email');
      if (!password) return setErrorMessage('Please enter your Password');

      setLoading(true);
      try {
        const res = await loginUser(email, password, rememberMe);
        if (res.success) {
          setSuccessMessage(res.message || 'Login successful! Redirecting to ERP...');
          setTimeout(() => navigate(redirectTo(), { replace: true }), 600);
        } else {
          setErrorMessage(res.message || 'Credentials do not match.');
        }
      } catch (err: any) {
        setErrorMessage(err.message || 'Unable to connect to server. Please try again.');
      } finally {
        setLoading(false);
      }
    } else {
      if (!vendorId.trim()) return setErrorMessage('The vendor id field is required.');
      if (!password) return setErrorMessage('The password field is required.');

      setLoading(true);
      try {
        const res = await loginVendor(vendorId, password, rememberMe);
        if (res.success) {
          setSuccessMessage(res.message || 'Vendor login successful! Redirecting to ERP...');
          setTimeout(() => navigate(redirectTo(), { replace: true }), 600);
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
    <div className="klk-login-root">
      <style>{LOGIN_CSS}</style>

      {/* Mobile overlay */}
      <div className="klk-login-overlay" />

      <div className="klk-login-side">
        <div className="klk-login-card">
          {/* Logo */}
          <div className="klk-login-logo">
            <img
              src="/logo-full.png"
              alt="KLK Ventures"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/logo-abbr.png';
              }}
            />
          </div>

          {/* Header */}
          <div className="klk-login-head">
            <h2 className="klk-login-title">{activeTab === 'user' ? 'User Login' : 'Vendor Login'}</h2>
            <div className="klk-login-bar" />
            <p className="klk-login-sub">
              {activeTab === 'user'
                ? 'Logging in as User — sign in with your email'
                : 'Logging in as Vendor — sign in with your Vendor ID'}
            </p>
          </div>

          {/* Tabs */}
          <div role="tablist" aria-label="Login type" className="klk-login-tabs">
            {(['user', 'vendor'] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                role="tab"
                aria-selected={activeTab === tab}
                onClick={() => handleTabChange(tab)}
                className={`klk-login-tab${activeTab === tab ? ' active' : ''}`}
              >
                {ICONS[tab]}
                <span>{tab === 'user' ? 'User' : 'Vendor'}</span>
              </button>
            ))}
          </div>

          {errorMessage && (
            <div role="alert" className="klk-login-alert error">
              {ICONS.alert}
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div role="status" className="klk-login-alert success">
              {ICONS.check}
              <span>{successMessage}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="klk-login-form" noValidate>
            {activeTab === 'user' ? (
              <div className="klk-login-group">
                <label htmlFor="login-email" className="klk-login-label">User Email</label>
                <div className="klk-login-field">
                  <div className="klk-login-icon">{ICONS.user}</div>
                  <input
                    id="login-email"
                    type="email"
                    name="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter User Email"
                    className="klk-login-input"
                    disabled={loading}
                  />
                </div>
              </div>
            ) : (
              <div className="klk-login-group">
                <label htmlFor="login-vendor" className="klk-login-label">Vendor ID</label>
                <div className="klk-login-field">
                  <div className="klk-login-icon">{ICONS.vendor}</div>
                  <input
                    id="login-vendor"
                    type="text"
                    name="vendor_id"
                    autoComplete="username"
                    value={vendorId}
                    onChange={(e) => setVendorId(e.target.value)}
                    placeholder="KLK29045"
                    className="klk-login-input"
                    disabled={loading}
                  />
                </div>
              </div>
            )}

            <div className="klk-login-group">
              <label htmlFor="login-password" className="klk-login-label">Password</label>
              <div className="klk-login-field">
                <div className="klk-login-icon">{ICONS.lock}</div>
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter Password"
                  className="klk-login-input has-toggle"
                  disabled={loading}
                />
                <button
                  type="button"
                  className="klk-login-eye"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? ICONS.eyeOff : ICONS.eye}
                </button>
              </div>
            </div>

            <div className="klk-login-row">
              <label className="klk-login-remember">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <span>Remember session</span>
              </label>

              <a
                href="https://klkerp.com/forgot-password"
                target="_blank"
                rel="noreferrer"
                className="klk-login-forgot"
              >
                Forgot Password?
              </a>
            </div>

            <button type="submit" disabled={loading} className="klk-login-btn">
              {loading ? (
                <>
                  <svg className="klk-login-spin" fill="none" viewBox="0 0 24 24">
                    <circle opacity="0.25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path opacity="0.75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
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

          {/* Footer */}
          <div className="klk-login-divider">
            <div className="line" />
            <span className="text">
              <img src="/logo-abbr.png" alt="" />
              <span>KLK Solar ERP System</span>
            </span>
            <div className="line" />
          </div>

          <div className="klk-login-fill-wrap">
            <button
              type="button"
              className="klk-login-fill"
              onClick={() => {
                if (activeTab === 'user') {
                  setEmail('admin@klkerp.com');
                  setPassword('admin123');
                } else {
                  setVendorId('KLK29045');
                  setPassword('vendor123');
                }
              }}
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