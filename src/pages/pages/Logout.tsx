/*
 * KLK Solar ERP System — Logout / signed-out screen (route "pages/logout").
 */
import { useEffect, useRef, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCustomizer } from '../../context/CustomizerContext';
import { useAuth } from '../../context/AuthContext';

export function Logout() {
  const [seconds, setSeconds] = useState(6);
  const [cancelled, setCancelled] = useState(false);
  const cancelledRef = useRef(false);
  const navigate = useNavigate();
  const { toggleTheme } = useCustomizer();
  const { user, logout } = useAuth();
  const [loggedOutUser] = useState(user);

  // Trigger logout session cleanup immediately on reaching this page
  useEffect(() => {
    logout();
  }, [logout]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      if (cancelledRef.current) return;
      setSeconds((s) => {
        if (s <= 1) {
          clearInterval(timer);
          navigate('/login');
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [navigate]);

  const cancel = () => {
    cancelledRef.current = true;
    setCancelled(true);
  };

  return (
    <>
      <div style={{ position: 'fixed', top: 'var(--ax-space-5)', right: 'var(--ax-space-6)', zIndex: 5, display: 'flex', gap: 'var(--ax-space-2)', alignItems: 'center' }}>
        <button type="button" className="ax-btn ax-btn--ghost ax-btn--icon" aria-label="Toggle color theme" onClick={() => toggleTheme()}>
          <svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 3c.132 0 .263 0 .393 0a7.5 7.5 0 0 0 7.92 12.446a9 9 0 1 1 -8.313 -12.454l0 .008" /></svg>
        </button>
      </div>

      <main className="ax-center" id="ax-main" style={{ position: 'relative', zIndex: 1, width: '100%', padding: 'var(--ax-space-6)' }}>
        <div style={{ width: '100%', maxWidth: 440, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--ax-space-6)' }}>
          <Link to="/login" aria-label="KLK Solar ERP home" style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--ax-space-3)', textDecoration: 'none' }}>
            <span aria-hidden="true" style={{ display: 'inline-grid', placeItems: 'center', width: 44, height: 44, borderRadius: 'var(--ax-radius-md)', background: '#1A66FF', color: '#fff', boxShadow: '0 8px 22px -8px rgba(26,102,255,.7)' }}>
              <svg viewBox="0 0 24 24" width={26} height={26} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="12" rx="2" />
                <path d="M3 10h18" />
                <path d="M9 4v12" />
                <path d="M15 4v12" />
                <path d="M8 20h8" />
                <path d="M12 16v4" />
              </svg>
            </span>
            <span style={{ fontFamily: 'var(--ax-font-display)', fontWeight: 700, fontSize: 'var(--ax-text-xl)', color: 'var(--ax-text-strong)', letterSpacing: '.01em' }}>
              KLK Solar ERP
            </span>
          </Link>

          <div className="ax-glass" style={{ width: '100%', borderRadius: 'var(--ax-radius-xl)', padding: 'var(--ax-space-8)', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 'var(--ax-space-5)' }}>
            <span aria-hidden="true" style={{ display: 'inline-grid', placeItems: 'center', width: 64, height: 64, borderRadius: '50%', background: 'rgba(26,102,255,0.1)', color: '#1A66FF' }}>
              <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 8v-2a2 2 0 0 0 -2 -2h-7a2 2 0 0 0 -2 2v12a2 2 0 0 0 2 2h7a2 2 0 0 0 2 -2v-2" />
                <path d="M9 12h12l-3 -3" />
                <path d="M18 15l3 -3" />
              </svg>
            </span>

            <h1 style={{ margin: 0, fontFamily: 'var(--ax-font-display)', fontWeight: 700, fontSize: 'var(--ax-text-2xl)', color: 'var(--ax-text-strong)' }}>You've signed out</h1>
            <p style={{ margin: 0, fontSize: 'var(--ax-text-md)', color: 'var(--ax-text-muted)', lineHeight: 1.55 }}>Your ERP session on this device has ended securely. Sign back in any time to return to your workspace.</p>

            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--ax-space-3)', padding: 'var(--ax-space-3) var(--ax-space-4)', width: '100%', background: 'var(--ax-surface-subtle)', border: '1px solid var(--ax-border)', borderRadius: 'var(--ax-radius-md)', textAlign: 'start' }}>
              <span className="ax-avatar ax-avatar--squircle" style={{ background: 'rgba(26,102,255,0.15)', color: '#1A66FF', flex: '0 0 auto', fontWeight: 600 }}>
                {loggedOutUser?.name ? loggedOutUser.name.slice(0, 2).toUpperCase() : 'KL'}
              </span>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 'var(--ax-weight-medium)', color: 'var(--ax-text-strong)' }} className="ax-text-truncate">
                  {loggedOutUser?.name || (loggedOutUser?.role === 'vendor' ? `Vendor (${loggedOutUser?.vendor_id})` : 'Solar ERP User')}
                </div>
                <div style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-subtle)' }} className="ax-text-truncate">
                  {loggedOutUser?.email || (loggedOutUser?.vendor_id ? `ID: ${loggedOutUser.vendor_id}` : 'Session Closed')}
                </div>
              </div>
              <span className="ax-badge ax-badge--soft ax-badge--success ax-badge--pill" style={{ marginInlineStart: 'auto', flex: '0 0 auto' }}>
                <span className="ax-badge__dot" />Logged Out
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--ax-space-3)', width: '100%' }}>
              <Link className="ax-btn ax-btn--primary ax-btn--block" to="/login" style={{ background: '#1A66FF', borderColor: '#1A66FF' }}>
                <svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M15 8v-2a2 2 0 0 0 -2 -2h-7a2 2 0 0 0 -2 2v12a2 2 0 0 0 2 2h7a2 2 0 0 0 2 -2v-2" /><path d="M21 12h-13l3 -3" /><path d="M11 15l-3 -3" /></svg>
                <span className="ax-btn__label">Sign in again</span>
              </Link>
            </div>

            <p style={{ margin: 0, fontSize: 'var(--ax-text-sm)', color: 'var(--ax-text-subtle)' }} aria-live="polite">
              Redirecting to sign in in <b className="ax-num" style={{ fontFamily: 'var(--ax-font-mono)', color: 'var(--ax-text)' }}>{seconds}</b> seconds…
              {!cancelled && <button type="button" className="ax-btn ax-btn--link ax-btn--sm" onClick={cancel} style={{ padding: 0, minHeight: 'auto', marginInlineStart: 8 }}>Stay here</button>}
              {cancelled && <span style={{ color: 'var(--ax-text-subtle)', marginInlineStart: 8 }}>Auto-redirect paused.</span>}
            </p>
          </div>
        </div>
      </main>
    </>
  );
}

export default Logout;
