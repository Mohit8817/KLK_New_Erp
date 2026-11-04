import { useEffect, useState, useCallback, type FormEvent, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { PageHead } from '../../shell/PageHead';
import {
  vendorCommonService,
  type VendorProfileResponse,
  type VendorSubUserItem,
} from '../common-services/vendorCommonService';

/* ───────── Responsive page CSS (Matching Reference Code) ───────── */
const PAGE_CSS = `
  .solar-erp-page {
    --asw-primary: #2563eb;
    --asw-primary-rgb: 37, 99, 235;
  }
  .solar-erp-page .ax-card { min-width: 0; }
  .solar-erp-page .asw-cards-row {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: var(--ax-space-4, 16px);
    margin-bottom: var(--ax-space-5, 20px);
  }
  @media (max-width: 992px) {
    .solar-erp-page .asw-cards-row {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }
  @media (max-width: 520px) {
    .solar-erp-page .asw-cards-row {
      grid-template-columns: 1fr;
    }
  }

  .users-dash-grid {
    display: grid;
    grid-template-columns: 1.8fr 1.2fr;
    gap: var(--ax-space-4, 16px);
  }
  @media (max-width: 900px) {
    .users-dash-grid {
      grid-template-columns: 1fr;
    }
  }

  /* Modal Details Styles */
  .ax-modal {
    position: fixed; inset: 0; z-index: 9999;
    background: rgba(15, 23, 42, 0.65);
    backdrop-filter: blur(6px);
    display: flex; align-items: center; justify-content: center;
    padding: 20px;
  }
  .ax-modal__backdrop {
    position: fixed; inset: 0; background: transparent;
  }
  .ax-modal__dialog {
    position: relative; z-index: 1; background: #ffffff;
    border-radius: 16px; border: 1px solid var(--ax-border, #e2e8f0);
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
    overflow: hidden; width: 100%;
  }
  .ax-modal__header {
    padding: 16px 20px;
    border-bottom: 1px solid var(--ax-border, #e2e8f0);
    background: var(--ax-surface-subtle, #f8fafc);
    display: flex; align-items: center; justify-content: space-between;
  }
  .ax-modal__close {
    width: 32px; height: 32px; padding: 0; border-radius: 50%;
    border: none; background: transparent; cursor: pointer;
    display: inline-flex; align-items: center; justify-content: center;
    color: var(--ax-text-muted, #64748b); font-size: 15px; font-weight: 700;
  }
  .ax-modal__close:hover {
    background: rgba(0, 0, 0, 0.05);
    color: var(--ax-text-strong, #0f172a);
  }
  .ax-modal__body {
    padding: 20px; overflow-y: auto; max-height: calc(85vh - 120px);
  }
  .ax-modal__footer {
    padding: 14px 20px;
    border-top: 1px solid var(--ax-border, #e2e8f0);
    background: var(--ax-surface-subtle, #f8fafc);
    display: flex; align-items: center; justify-content: flex-end; gap: 10px;
  }
`;

type Tone = 'success' | 'warning' | 'danger' | 'neutral' | 'info';
const Badge = ({ tone, children }: { tone: Tone; children: ReactNode }) => (
  <span className={`ax-badge ax-badge--soft ax-badge--${tone} ax-badge--pill`}>
    <span className="ax-badge__dot" />
    {children}
  </span>
);

type KpiTone = 'accent' | 'cyan' | 'emerald' | 'amber' | 'violet';

const TONE: Record<KpiTone, { bg: string; fg: string }> = {
  accent: { bg: 'rgba(37, 99, 235, 0.12)', fg: '#2563eb' },
  cyan: { bg: 'color-mix(in oklab, var(--ax-viz-cyan, #06b6d4) 14%, transparent)', fg: '#0891b2' },
  emerald: { bg: 'color-mix(in oklab, var(--ax-viz-emerald, #10b981) 14%, transparent)', fg: '#16a34a' },
  amber: { bg: 'color-mix(in oklab, var(--ax-viz-amber, #f59e0b) 14%, transparent)', fg: '#d97706' },
  violet: { bg: 'color-mix(in oklab, var(--ax-viz-violet, #8b5cf6) 14%, transparent)', fg: '#7c3aed' },
};

function KpiCard({
  icon,
  tone,
  label,
  value,
  sub,
}: {
  icon: ReactNode;
  tone: KpiTone;
  label: string;
  value: ReactNode;
  sub: string;
}) {
  const t = TONE[tone];
  return (
    <div className="ax-card" style={{ padding: '14px 18px', borderRadius: 12, minWidth: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        <span
          style={{
            width: 28,
            height: 28,
            borderRadius: 8,
            background: t.bg,
            color: t.fg,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <span style={{ width: 15, height: 15, display: 'inline-flex' }}>{icon}</span>
        </span>
        <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ax-text-muted)', letterSpacing: '0.04em' }}>
          {label}
        </span>
      </div>
      <div style={{ fontSize: 24, fontWeight: 800, color: t.fg, marginTop: 4, fontFamily: 'var(--ax-font-display)' }}>
        {value}
      </div>
      <div style={{ fontSize: 12, color: 'var(--ax-text-muted)', marginTop: 2 }}>
        {sub}
      </div>
    </div>
  );
}

const X_ICON = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ width: 16, height: 16 }}>
    <path d="M18 6l-12 12" />
    <path d="M6 6l12 12" />
  </svg>
);

export function UsersDashboard() {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<VendorProfileResponse | null>(null);
  const [subUsers, setSubUsers] = useState<VendorSubUserItem[]>([]);
  const [toastMsg, setToastMsg] = useState<{ type: 'success' | 'danger'; text: string } | null>(null);

  // Change Password Modal
  const [pwdModalOpen, setPwdModalOpen] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submittingPwd, setSubmittingPwd] = useState(false);

  useEffect(() => {
    if (!toastMsg) return;
    const t = window.setTimeout(() => setToastMsg(null), 4000);
    return () => window.clearTimeout(t);
  }, [toastMsg]);

  // Load Vendor Profile (B1) & Sub-Users (B6)
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [profData, usersData] = await Promise.all([
        vendorCommonService.getVendorProfile(),
        vendorCommonService.getSubUsers(),
      ]);
      setProfile(profData);
      setSubUsers(Array.isArray(usersData) ? usersData : []);
    } catch (err: any) {
      console.error('[UsersDashboard] load error:', err);
      setToastMsg({ type: 'danger', text: err?.message || 'Failed to load vendor profile & users.' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Password Submit (B3)
  const handleChangePassword = async (e: FormEvent) => {
    e.preventDefault();
    if (!oldPassword || !newPassword || !confirmPassword) {
      setToastMsg({ type: 'danger', text: 'All password fields are required.' });
      return;
    }
    if (newPassword.length < 8) {
      setToastMsg({ type: 'danger', text: 'New password must be at least 8 characters.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setToastMsg({ type: 'danger', text: 'New password and confirmation do not match.' });
      return;
    }

    setSubmittingPwd(true);
    try {
      const res = await vendorCommonService.changeVendorPassword({
        old_password: oldPassword,
        password: newPassword,
        password_confirmation: confirmPassword,
      });

      setToastMsg({ type: 'success', text: res?.message || 'Password changed successfully!' });
      setPwdModalOpen(false);
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      console.error('[UsersDashboard] change password error:', err);
      setToastMsg({ type: 'danger', text: err?.message || 'Failed to change password. Please verify current password.' });
    } finally {
      setSubmittingPwd(false);
    }
  };

  const v = profile?.vendor;
  const activeCount = subUsers.filter((u) => Number(u.status) === 1).length;
  const inactiveCount = subUsers.filter((u) => Number(u.status) === 0).length;
  const fieldWorkCount = subUsers.filter((u) => u.register_for === 'field-work').length;
  const docCount = subUsers.filter((u) => u.register_for === 'documentation').length;

  return (
    <div className="solar-erp-page">
      <style>{PAGE_CSS}</style>

      {/* ── Page Head ── */}
      <PageHead
        title="Vendor Users & Profile"
        subtitle="Manage master vendor profile credentials, monitor authorized sub-user accounts, and configure permissions"
        breadcrumbs={[
          { label: 'Home', href: '/v-dashboard' },
          { label: 'Users' },
          { label: 'Overview' },
        ]}
        actions={
          <div style={{ display: 'inline-flex', gap: 'var(--ax-space-2)' }}>
            <button
              type="button"
              className="ax-btn ax-btn--secondary ax-btn--sm"
              onClick={loadData}
              disabled={loading}
            >
              <svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M20 11a8.1 8.1 0 0 0 -15.5 -2m-.5 -4v4h4" />
                <path d="M4 13a8.1 8.1 0 0 0 15.5 2m.5 4v-4h-4" />
              </svg>
              <span className="ax-btn__label">Refresh</span>
            </button>
            <button
              type="button"
              className="ax-btn ax-btn--ghost ax-btn--sm"
              onClick={() => setPwdModalOpen(true)}
            >
              Change Password
            </button>
            <Link to="/v/users/add-user" className="ax-btn ax-btn--primary ax-btn--sm">
              <span className="ax-btn__label">+ Add Sub-User</span>
            </Link>
          </div>
        }
      />

      {toastMsg && (
        <div className={`ax-alert ax-alert--${toastMsg.type}`} style={{ marginBottom: 'var(--ax-space-4)' }} role="status">
          <div className="ax-alert__title">{toastMsg.type === 'success' ? 'Success' : 'Error'}</div>
          <div className="ax-alert__text">{toastMsg.text}</div>
        </div>
      )}

      {/* ── Top Metric KPI Cards ── */}
      <div className="asw-cards-row">
        <KpiCard
          tone="accent"
          label="Sub-Users Registered"
          value={`${subUsers.length} / 5`}
          sub="Maximum 5 sub-users allowed"
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          }
        />

        <KpiCard
          tone="emerald"
          label="Active Accounts"
          value={activeCount.toLocaleString('en-IN')}
          sub={`${inactiveCount} currently disabled`}
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 3l7 3v5c0 4.5-3 8.2-7 10-4-1.8-7-5.5-7-10V6l7-3z" />
              <path d="M9 12l2 2 4-4" />
            </svg>
          }
        />

        <KpiCard
          tone="cyan"
          label="Field Work Staff"
          value={fieldWorkCount.toLocaleString('en-IN')}
          sub="On-site operations staff"
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          }
        />

        <KpiCard
          tone="violet"
          label="Documentation Staff"
          value={docCount.toLocaleString('en-IN')}
          sub="Back-office paperwork staff"
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
            </svg>
          }
        />
      </div>

      {/* ── Main Users Overview Grid ── */}
      <div className="users-dash-grid">
        {/* Left Column: Vendor Master Profile Card (B1) */}
        <div className="ax-card" style={{ padding: '20px 24px', borderRadius: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
            <div>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>Vendor Master Profile</h3>
              <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--ax-text-muted)' }}>
                Authenticated enterprise credentials and banking records
              </p>
            </div>
            {v?.status != null && (
              <Badge tone={Number(v.status) === 1 ? 'success' : 'warning'}>
                {Number(v.status) === 1 ? 'Active Account' : 'Inactive'}
              </Badge>
            )}
          </div>

          {loading ? (
            <div style={{ padding: 32, textAlign: 'center', color: 'var(--ax-text-muted)' }}>
              <span className="ax-spinner" style={{ marginRight: 8 }} /> Loading profile…
            </div>
          ) : !v ? (
            <div style={{ padding: 24, textAlign: 'center', color: 'var(--ax-text-muted)' }}>
              Profile information not available.
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px 20px', fontSize: 13 }}>
              <div>
                <span style={{ color: 'var(--ax-text-muted)', display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>Vendor Code / ID</span>
                <b style={{ color: '#2563eb', fontFamily: 'monospace' }}>{v.vendor_id || `#${v.id}`}</b>
              </div>

              <div>
                <span style={{ color: 'var(--ax-text-muted)', display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>Company / Name</span>
                <b>{v.name || '—'}</b>
              </div>

              <div>
                <span style={{ color: 'var(--ax-text-muted)', display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>Contact Number</span>
                <b>{v.contact || '—'}</b>
              </div>

              <div>
                <span style={{ color: 'var(--ax-text-muted)', display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>Email Address</span>
                <b>{v.email || '—'}</b>
              </div>

              <div>
                <span style={{ color: 'var(--ax-text-muted)', display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>GST Number</span>
                <b style={{ fontFamily: 'monospace' }}>{v.gst || '—'}</b>
              </div>

              <div>
                <span style={{ color: 'var(--ax-text-muted)', display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>State / Jurisdiction</span>
                <b>{profile?.state ? profile.state.toUpperCase() : 'UP'}</b>
              </div>

              <div>
                <span style={{ color: 'var(--ax-text-muted)', display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>Bank Name</span>
                <b>{v.bank || '—'}</b>
              </div>

              <div>
                <span style={{ color: 'var(--ax-text-muted)', display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>Bank Account No.</span>
                <b style={{ fontFamily: 'monospace' }}>{v.account_no || '—'}</b>
              </div>

              <div style={{ gridColumn: 'span 2' }}>
                <span style={{ color: 'var(--ax-text-muted)', display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>IFSC Code</span>
                <b style={{ fontFamily: 'monospace' }}>{v.ifsc || '—'}</b>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Sub-Users Management Overview */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="ax-card" style={{ padding: '20px 24px', borderRadius: 14 }}>
            <h3 style={{ margin: '0 0 6px 0', fontSize: 15, fontWeight: 700 }}>Sub-User Quota</h3>
            <p style={{ margin: '0 0 14px 0', fontSize: 12, color: 'var(--ax-text-muted)' }}>
              Each vendor account is permitted to register up to <b>5 sub-users</b> for field work and documentation tasks.
            </p>

            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                <span>Used Quota: <b>{subUsers.length} / 5</b></span>
                <span style={{ fontWeight: 600, color: subUsers.length >= 5 ? '#ef4444' : '#16a34a' }}>
                  {5 - subUsers.length} remaining
                </span>
              </div>
              <div className="ax-progress ax-progress--sm">
                <div className="ax-progress__track">
                  <div
                    className="ax-progress__fill"
                    style={{
                      width: `${(subUsers.length / 5) * 100}%`,
                      background: subUsers.length >= 5 ? '#ef4444' : '#2563eb',
                    }}
                  />
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <Link
                to="/v/users/add-user"
                className={`ax-btn ax-btn--primary ${subUsers.length >= 5 ? 'disabled' : ''}`}
                style={{ width: '100%', justifyContent: 'center' }}
              >
                + Create Sub-User
              </Link>
              <Link to="/v/users/view-users" className="ax-btn ax-btn--secondary" style={{ width: '100%', justifyContent: 'center' }}>
                View Sub-Users List ({subUsers.length})
              </Link>
            </div>
          </div>

          <div className="ax-card" style={{ padding: '16px 20px', borderRadius: 14, background: '#eff6ff', border: '1px solid #bfdbfe' }}>
            <h4 style={{ margin: '0 0 6px 0', fontSize: 13, fontWeight: 700, color: '#1e40af' }}>
              WhatsApp Automated Notification
            </h4>
            <p style={{ margin: 0, fontSize: 12, color: '#1e3a8a', lineHeight: 1.5 }}>
              When a new sub-user is created, their system-generated User ID and Password are automatically dispatched via WhatsApp message to their mobile number and the admin.
            </p>
          </div>
        </div>
      </div>

      {/* ── Change Password Modal (B3) ── */}
      {pwdModalOpen && (
        <div className="ax-modal" role="dialog" aria-modal="true" aria-labelledby="change-pwd-title">
          <div className="ax-modal__backdrop" onClick={() => !submittingPwd && setPwdModalOpen(false)} />
          <div className="ax-modal__dialog" style={{ maxWidth: 440 }}>
            <form onSubmit={handleChangePassword}>
              <div className="ax-modal__header">
                <div>
                  <h3 id="change-pwd-title" style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>
                    Change Vendor Password
                  </h3>
                  <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--ax-text-muted)' }}>
                    Verify your current password to set a new security credential.
                  </p>
                </div>
                <button
                  type="button"
                  className="ax-modal__close"
                  onClick={() => setPwdModalOpen(false)}
                  disabled={submittingPwd}
                  aria-label="Close dialog"
                >
                  {X_ICON}
                </button>
              </div>

              <div className="ax-modal__body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <label htmlFor="modal_old_password" style={{ fontSize: 12, fontWeight: 600 }}>
                    Current Password <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    id="modal_old_password"
                    type="password"
                    className="ax-input"
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    placeholder="Enter current password"
                    required
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <label htmlFor="modal_new_password" style={{ fontSize: 12, fontWeight: 600 }}>
                    New Password (Min 8 chars) <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    id="modal_new_password"
                    type="password"
                    className="ax-input"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    required
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <label htmlFor="modal_confirm_password" style={{ fontSize: 12, fontWeight: 600 }}>
                    Confirm New Password <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    id="modal_confirm_password"
                    type="password"
                    className="ax-input"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter new password"
                    required
                  />
                </div>
              </div>

              <div className="ax-modal__footer">
                <button
                  type="button"
                  className="ax-btn ax-btn--secondary"
                  onClick={() => setPwdModalOpen(false)}
                  disabled={submittingPwd}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="ax-btn ax-btn--primary"
                  disabled={submittingPwd}
                >
                  {submittingPwd ? 'Updating Password…' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default UsersDashboard;
