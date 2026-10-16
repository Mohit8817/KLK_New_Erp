import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { PageHead } from '../../shell/PageHead';
import { dleService, extractList, filterByCompany } from '../../../services/dleServices';
import { type UserRow, normalize, approvalClass } from './DLEManagementViewData';

/**
 * Documents DLE backend se serve hote hain (klkerp.com se nahi).
 * .env:
 *   VITE_DLE_API_BASE_URL=https://klkdle.klkventures.cloud   (already hai)
 *   VITE_FILE_PATH_PREFIX=/api/uploads    (agar backend /uploads pe serve kare to /uploads)
 *   VITE_R2_PUBLIC_URL=                   (optional: bucket public ho to direct R2 URL)
 */
const env = (import.meta as any).env || {};
const R2_FALLBACK = 'https://pub-21d2019fecbe4a96a88c93b2f091317a.r2.dev';
const R2_BASE = String(env.VITE_R2_PUBLIC_URL || env.R2_PUBLIC_URL || R2_FALLBACK).replace(/\/+$/, '');
const FILE_BASE = String(env.VITE_DLE_API_BASE_URL || env.VITE_FILE_BASE_URL || '').replace(/\/+$/, '');
const FILE_PREFIX = '/' + String(env.VITE_FILE_PATH_PREFIX ?? '/api/uploads').replace(/^\/+|\/+$/g, '');

/** "r2:userpolice/x.pdf" / "/api/uploads/userpolice/x.pdf" / "userpolice/x.pdf" → full URL */
const resolveUrl = (u: string): string => {
  if (!u) return '';
  const raw = u.trim().replace(/\\/g, '/');
  if (/^(blob:|data:)/i.test(raw)) return raw;

  // Storage key nikalo (r2: prefix ya /api/uploads, /uploads prefix hatao)
  let key = raw;
  const r2 = raw.match(/r2:(.+)$/i);
  if (r2) key = r2[1];
  else if (/^(https?:)?\/\//i.test(raw)) {
    return raw;
  } else {
    key = raw.replace(/^\/+/, '').replace(/^(?:api\/)?uploads\//i, '');
  }
  key = key.replace(/^\/+/, '');

  if (R2_BASE) return `${R2_BASE}/${key}`;
  return `${FILE_BASE}${FILE_PREFIX}/${key}`;
};

const cleanPath = (u: string) => u.split('?')[0].split('#')[0];
const isImage = (u: string) => /\.(jpe?g|png|gif|webp|bmp|svg|avif)$/i.test(cleanPath(u));
const isPdf = (u: string) => /\.pdf$/i.test(cleanPath(u));

const InfoCard = ({ label, value }: { label: string; value: string }) => (
  <div style={{
    padding: 'var(--ax-space-3) var(--ax-space-4)',
    background: 'var(--ax-surface-subtle)',
    border: '1px solid var(--ax-border)',
    borderRadius: 'var(--ax-radius-md)',
  }}>
    <div style={{
      fontSize: 'var(--ax-text-xs)',
      textTransform: 'uppercase',
      letterSpacing: '.06em',
      color: 'var(--ax-text-subtle)',
      marginBottom: 4,
    }}>{label}</div>
    <div style={{
      color: 'var(--ax-text-strong)',
      fontSize: 'var(--ax-text-sm)',
      fontWeight: 600,
      overflowWrap: 'anywhere',
    }}>{value || '—'}</div>
  </div>
);

export function DleUserDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState<UserRow | null>(
    (location.state as { user?: UserRow } | null)?.user ?? null,
  );
  const [loading, setLoading] = useState(!user);
  const [notFound, setNotFound] = useState(false);
  const [broken, setBroken] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (user) return;
    const ctrl = new AbortController();
    (async () => {
      try {
        const json = await dleService.getAdminUsers(ctrl.signal);
        const list = extractList(json);
        const mine = filterByCompany(list);
        const candidates = (mine.length ? mine : list).map(normalize);
        const found = candidates.find((x) => String(x.id) === String(id)) ?? null;
        setUser(found);
        setNotFound(!found);
      } catch (e) {
        if ((e as Error).name !== 'AbortError') setNotFound(true);
      } finally {
        setLoading(false);
      }
    })();
    return () => ctrl.abort();
  }, [id, user]);

  if (loading) {
    return (
      <div style={{ padding: 'var(--ax-space-10)', textAlign: 'center' }}>
        <div className="ax-spinner ax-spinner--primary" />
        <div style={{ marginTop: 'var(--ax-space-4)', color: 'var(--ax-text-muted)' }}>Loading user details…</div>
      </div>
    );
  }

  if (notFound || !user) {
    return (
      <div style={{ padding: 24 }}>
        <p>User not found.</p>
        <button className="ax-btn ax-btn--secondary" onClick={() => navigate(-1)}>← Back</button>
      </div>
    );
  }

  const infoFields: [string, string][] = [
    ['Name', user.name],
    ['Email', user.email],
    ['Contact', user.contact],
    ['Emergency Contact', user.emergency],
    ['State', user.state],
    ['District', user.district],
    ['Block', user.block],
    ['Panchayat', user.panchayat],
    ['Address', user.address],
    ['Police Verification', user.police],
    ['Status', user.status],
    ['Member Since', user.createdAt],
  ];

  return (
    <>
      <PageHead
        title={user.name}
        subtitle={`${user.email} · ${user.contact}`}
        actions={
          <button className="ax-btn ax-btn--secondary" onClick={() => navigate(-1)}>
            <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M5 12l14 0M5 12l6 6M5 12l6-6" />
            </svg>
            <span style={{ marginLeft: 6 }}>Back to List</span>
          </button>
        }
      />

      <div className="ax-dash-grid">
        {/* Approval badge + quick status */}
        <div className="ax-col--12" style={{ display: 'flex', gap: 'var(--ax-space-3)', flexWrap: 'wrap', alignItems: 'center' }}>
          <span className={`ax-badge ax-badge--soft ax-badge--pill ${approvalClass(user.approval)}`}>
            <span className="ax-badge__dot" />
            {user.approval}
          </span>
          <span className={`ax-badge ax-badge--soft ax-badge--pill ${user.status === 'Active' ? 'ax-badge--success' : 'ax-badge--neutral'}`}>
            {user.status}
          </span>
        </div>

        {/* User Info */}
        <section className="ax-card ax-col--12">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <h2 className="ax-card__title">User Information</h2>
              <p className="ax-card__subtitle">Complete profile and contact details</p>
            </div>
          </div>
          <div style={{ padding: 'var(--ax-space-4)' }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
              gap: 'var(--ax-space-3)',
            }}>
              {infoFields.map(([label, value]) => (
                <InfoCard key={label} label={label} value={value} />
              ))}
            </div>
          </div>
        </section>

        {/* Documents */}
        <section className="ax-card ax-col--12">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <h2 className="ax-card__title">Documents</h2>
              <p className="ax-card__subtitle">{user.documents.length} file{user.documents.length !== 1 ? 's' : ''} uploaded</p>
            </div>
          </div>

          {user.documents.length === 0 ? (
            <div style={{ padding: 'var(--ax-space-8)', textAlign: 'center', color: 'var(--ax-text-muted)', fontSize: 'var(--ax-text-sm)' }}>
              No documents uploaded by this user.
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
              gap: 'var(--ax-space-4)',
              padding: 'var(--ax-space-4)',
            }}>
              {user.documents.map((d, i) => {
                const src = resolveUrl(d.url);
                const failed = !!broken[src];
                const showImg = isImage(d.url) && !failed;
                const pdf = isPdf(d.url);
                return (
                  <a
                    key={`${d.url}-${i}`}
                    href={src}
                    target="_blank"
                    rel="noreferrer"
                    style={{ display: 'block', textDecoration: 'none' }}
                  >
                    <div style={{
                      border: '1px solid var(--ax-border)',
                      borderRadius: 'var(--ax-radius-md)',
                      overflow: 'hidden',
                      transition: 'box-shadow 0.15s',
                    }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = 'var(--ax-shadow-md)'; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = 'none'; }}
                    >
                      {showImg ? (
                        <img
                          src={src}
                          alt={d.label}
                          loading="lazy"
                          onError={() => setBroken((b) => ({ ...b, [src]: true }))}
                          style={{ width: '100%', height: 180, objectFit: 'cover', display: 'block' }}
                        />
                      ) : (
                        <div style={{
                          height: 180,
                          display: 'grid',
                          placeItems: 'center',
                          background: 'var(--ax-surface-subtle)',
                          color: 'var(--ax-text-subtle)',
                          fontSize: 'var(--ax-text-sm)',
                        }}>
                          <div style={{ textAlign: 'center', padding: 8 }}>
                            <svg width={32} height={32} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: 8, color: 'var(--ax-accent)' }}>
                              <path d="M14 3v4a1 1 0 0 0 1 1h4" />
                              <path d="M17 21h-10a2 2 0 0 1 -2 -2v-14a2 2 0 0 1 2 -2h7l5 5v11a2 2 0 0 1 -2 2z" />
                            </svg>
                            <div>
                              {failed ? 'Image unavailable — click to open' : pdf ? 'PDF — click to open' : 'Click to open'}
                            </div>
                          </div>
                        </div>
                      )}
                      <div style={{
                        padding: '10px 12px',
                        borderTop: '1px solid var(--ax-border)',
                        fontSize: 'var(--ax-text-sm)',
                        fontWeight: 600,
                        color: 'var(--ax-text-strong)',
                      }}>
                        {d.label}
                      </div>
                    </div>
                  </a>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </>
  );
}

export default DleUserDetail;
