import { useState, useMemo, useEffect, useCallback, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { PageHead } from '../../../../shell/PageHead';
import { useFocusTrap } from '../../../../../hooks/useFocusTrap';
import {
  jammuRescoService,
  normalizeRescoStatus,
  type JammuRescoInstalledSiteItem,
} from '../../jammu-services';
import { getJammuMediaCandidates, resolveJammuMediaUrl } from '../../jammu-services/jammuSrt70mwService';
import {
  Pagination,
  usePagination,
  SearchInput,
  TableExportToolbar,
  TableEmptyState,
  type ExportColumn,
} from '../../../../../common';

const DASH = '—';

const escapeHtml = (s: string) =>
  String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

type Tone = 'success' | 'warning' | 'danger' | 'neutral' | 'info';

const Badge = ({ tone, children }: { tone: Tone; children: ReactNode }) => (
  <span className={`ax-badge ax-badge--soft ax-badge--${tone}`}>{children}</span>
);

const VerifyBadge = ({ value, raw }: { value?: number; raw?: any }) => {
  const r = String(raw ?? '').toLowerCase().trim();
  const v = Number(value ?? 0);
  if (v === 1 || r === '1' || r === 'approved' || r === 'complete') return <Badge tone="success">Approved</Badge>;
  if (v === 2 || r === '2' || r === 'rejected' || r === 'reject') return <Badge tone="danger">Rejected</Badge>;
  return <Badge tone="warning">Pending</Badge>;
};

const DocBadge = ({ status }: { status?: number }) => {
  const s = Number(status ?? 0);
  if (s === 2) return <Badge tone="success">Complete</Badge>;
  if (s === 3) return <Badge tone="danger">Rejected</Badge>;
  if (s === 1) return <Badge tone="info">Pending</Badge>;
  return <Badge tone="neutral">Not Submitted</Badge>;
};

const ClaimBadge = ({ status }: { status?: number }) => {
  const s = Number(status ?? 0);
  if (s === 2) return <Badge tone="success">Approved</Badge>;
  if (s === 3) return <Badge tone="danger">Rejected</Badge>;
  if (s === 1) return <Badge tone="info">Raised</Badge>;
  return <Badge tone="neutral">Not Raised</Badge>;
};

const pick = (row: any, ...keys: string[]): string => {
  for (const k of keys) {
    const v = row?.[k];
    if (v !== null && v !== undefined && v !== '') return String(v);
  }
  return '';
};

const ALIASES: Record<string, string[]> = {
  site_name: ['site_name', 'siteName', 'name', 'Site Name'],
  ca_no: ['ca_no', 'caNumber', 'cano', 'consumer_no', 'account_no'],
  department: ['department', 'dept', 'dept_name', 'division'],
  contact_person: ['contact_person', 'agency_contact_person', 'nodal_person', 'person_name', 'contact_name'],
  contact_number: ['contact_number', 'agency_contact_number', 'nodal_contact', 'contact_no', 'mobile', 'phone'],
  inverter_no: ['inverter_no', 'inverter_serial_no', 'inverter_serial'],
  meter_no: ['meter_no', 'solar_meter_no', 'solarmeter_no', 'solar_meter'],
  nm_sm_no: ['nm_sm_no', 'net_meter_no', 'net_meter', 'netmeter_no', 'nmsm_no'],
  loger_no: ['loger_no', 'logger_no', 'logger', 'loger'],
  latitude: ['latitude', 'inst_latitude', 'lat'],
  longitude: ['longitude', 'inst_longitude', 'long', 'lng'],
  remark: ['remark', 'remarks', 'inst_remarks', 'approved_remarks'],
  district: ['district', 'District'],
};

const txt = (row: any, key: string): string => {
  const keys = ALIASES[key] ?? [key];
  return pick(row, ...keys);
};

export interface StatusMeta {
  key: string;
  label: string;
  tone: 'accent' | 'emerald' | 'amber' | 'cyan' | 'violet';
  desc: string;
}

export const RESCO_STATUS_LIST: StatusMeta[] = [
  { key: 'total', label: 'All Allocated Sites', tone: 'accent', desc: 'All rooftop solar RESCO projects allocated across Jammu & Kashmir' },
  { key: 'complete', label: 'Installed Sites', tone: 'emerald', desc: 'Sites where solar plant installation is completed with evidence' },
  { key: 'pending', label: 'Pending Installation', tone: 'amber', desc: 'Assigned sites awaiting field installation execution' },
  { key: 'material_dispatch', label: 'Material Dispatched', tone: 'cyan', desc: 'Solar modules, inverters, and BOS dispatched to site' },
  { key: 'verify_pending', label: 'Verification Pending', tone: 'amber', desc: 'Installed sites awaiting departmental or QA inspection audit' },
  { key: 'verify_approved', label: 'Verify Approved', tone: 'emerald', desc: 'Sites successfully inspected and authorized by auditors' },
  { key: 'verify_reject', label: 'Verification Rejected', tone: 'amber', desc: 'Sites flagged with rework or audit discrepancies' },
  { key: 'claim1_approved', label: 'Stage 1 Claim (80% Paid)', tone: 'violet', desc: 'Milestone 1 (80%) sanctioned and disbursed' },
  { key: 'claim2_approved', label: 'Stage 2 Claim (20% Paid)', tone: 'emerald', desc: 'Milestone 2 (20%) final payment settled' },
  { key: 'claim3_approved', label: 'Stage 3 Claim', tone: 'cyan', desc: 'Final documentation and warranty closure' },
];

const STATUS_META_MAP: Record<string, StatusMeta> = Object.fromEntries(
  RESCO_STATUS_LIST.map((m) => [m.key, m])
);

const ZOOM_STEPS = [1, 1.5, 2, 3];

function ImagePreviewModal({ url, title, onClose }: { url: string; title: string; onClose: () => void }) {
  const [zoomIdx, setZoomIdx] = useState(0);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const zoom = ZOOM_STEPS[zoomIdx];
  const dialogRef = useRef<HTMLDivElement>(null);
  useFocusTrap(dialogRef, true);

  const isPdf = /\.pdf($|\?)/i.test(url);
  const isHeic = /\.heic($|\?)/i.test(url);
  const isDoc = /\.(docx?|xlsx?)($|\?)/i.test(url);

  useEffect(() => {
    setZoomIdx(0);
    setStatus(isPdf || isHeic || isDoc ? 'ready' : 'loading');
  }, [url, isPdf, isHeic, isDoc]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return createPortal(
    <div className="ax-modal" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="ax-modal__backdrop" />
      <div
        ref={dialogRef}
        className="ax-modal__dialog ax-modal__dialog--lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="ax-modal__header">
          <div>
            <h4 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: 'var(--ax-text-strong, #0f172a)' }}>
              {title || 'Installation Photo Preview'}
            </h4>
          </div>
          <button type="button" className="ax-modal__close" onClick={onClose} aria-label="Close dialog">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="ax-modal__body" style={{ padding: 0 }}>
          <div className="ula-m-stage" style={{ minHeight: isPdf ? '75vh' : 'auto' }}>
            {status === 'loading' && (
              <div className="ula-m-stage__msg">
                <span className="ax-spinner" /> Loading media...
              </div>
            )}
            {status === 'error' && (
              <div className="ula-m-stage__msg">Media could not be loaded. Try opening it in a new tab.</div>
            )}

            {isPdf ? (
              <iframe
                src={url}
                title={title || 'PDF Document Preview'}
                style={{ width: '100%', height: '75vh', border: 'none', background: '#fff' }}
              />
            ) : isHeic || isDoc ? (
              <div style={{ padding: 40, textAlign: 'center', color: '#fff' }}>
                <p style={{ fontSize: 14, marginBottom: 12 }}>
                  Direct in-browser preview is not supported for this file format ({isHeic ? 'HEIC' : 'DOC'}).
                </p>
                <a
                  href={url}
                  download
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    display: 'inline-block',
                    padding: '8px 18px',
                    borderRadius: 6,
                    background: '#2563eb',
                    color: '#fff',
                    fontWeight: 700,
                    fontSize: 13,
                    textDecoration: 'none',
                  }}
                >
                  Download / Open File
                </a>
              </div>
            ) : (
              <img
                key={url}
                src={url}
                alt={title || 'Preview'}
                onLoad={() => setStatus('ready')}
                onError={() => setStatus('error')}
                style={{
                  display: status === 'ready' ? 'block' : 'none',
                  margin: 'auto',
                  borderRadius: 0,
                  ...(zoom === 1
                    ? { maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }
                    : { width: `${zoom * 100}%`, maxWidth: 'none', maxHeight: 'none', height: 'auto' }),
                }}
              />
            )}
          </div>
        </div>

        <div className="ax-modal__footer" style={{ justifyContent: 'space-between' }}>
          {!isPdf && !isHeic && !isDoc ? (
            <div className="ula-m-zoom" role="group" aria-label="Zoom">
              <button
                type="button"
                className="ax-btn ax-btn--secondary ax-btn--sm"
                onClick={() => setZoomIdx((i) => Math.max(0, i - 1))}
                disabled={zoomIdx === 0}
              >
                −
              </button>
              <span className="ula-m-zoom__val">{Math.round(zoom * 100)}%</span>
              <button
                type="button"
                className="ax-btn ax-btn--secondary ax-btn--sm"
                onClick={() => setZoomIdx((i) => Math.min(ZOOM_STEPS.length - 1, i + 1))}
                disabled={zoomIdx === ZOOM_STEPS.length - 1}
              >
                +
              </button>
            </div>
          ) : (
            <div />
          )}
          <div style={{ display: 'flex', gap: 8 }}>
            <a
              href={url}
              target="_blank"
              rel="noreferrer"
              className="ax-btn ax-btn--secondary ax-btn--sm"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
            >
              <span>Open in new tab</span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
            </a>
            <button
              type="button"
              className="ax-btn ax-btn--primary ax-btn--sm"
              onClick={onClose}
              style={{ background: '#2563eb', borderColor: '#2563eb', color: '#fff' }}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

function InstallationThumbnail({
  src,
  alt,
  onPreview,
}: {
  src?: string | null;
  alt: string;
  onPreview: (url: string, title: string) => void;
}) {
  const [candidateIdx, setCandidateIdx] = useState(0);
  const [failed, setFailed] = useState(false);
  const candidates = useMemo(() => getJammuMediaCandidates(src), [src]);

  useEffect(() => {
    setCandidateIdx(0);
    setFailed(false);
  }, [src]);

  const resolved = candidates[candidateIdx] || (src ? resolveJammuMediaUrl(src) : null);

  if (!resolved || resolved === '—' || src === '—' || failed) {
    return <span style={{ color: 'var(--ax-text-subtle)' }}>{DASH}</span>;
  }

  const isPdf = /\.pdf($|\?)/i.test(resolved);
  const isHeic = /\.heic($|\?)/i.test(resolved);
  const isDoc = /\.(docx?|xlsx?)($|\?)/i.test(resolved);

  return (
    <div
      onClick={() => onPreview(resolved, alt)}
      title="Click to preview file"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 44,
        height: 44,
        borderRadius: 8,
        border: '1px solid #cbd5e1',
        background: '#f8fafc',
        cursor: 'pointer',
        overflow: 'hidden',
        position: 'relative',
        boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
        transition: 'all 0.15s ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'scale(1.06)';
        e.currentTarget.style.borderColor = '#2563eb';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'scale(1)';
        e.currentTarget.style.borderColor = '#cbd5e1';
      }}
    >
      {!isPdf && !isHeic && !isDoc ? (
        <img
          src={resolved}
          alt={alt}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          onError={() => {
            if (candidateIdx + 1 < candidates.length) {
              setCandidateIdx((prev) => prev + 1);
            } else {
              setFailed(true);
            }
          }}
        />
      ) : isPdf ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth={2} style={{ width: 18, height: 18 }}>
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
          </svg>
          <span style={{ fontSize: 9, fontWeight: 700, color: '#ef4444', lineHeight: 1 }}>PDF</span>
        </div>
      ) : isHeic ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth={2} style={{ width: 18, height: 18 }}>
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <polyline points="21 15 16 10 5 21" />
          </svg>
          <span style={{ fontSize: 9, fontWeight: 700, color: '#8b5cf6', lineHeight: 1 }}>HEIC</span>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth={2} style={{ width: 18, height: 18 }}>
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
          </svg>
          <span style={{ fontSize: 9, fontWeight: 700, color: '#2563eb', lineHeight: 1 }}>DOC</span>
        </div>
      )}
    </div>
  );
}

type KpiTone = 'accent' | 'cyan' | 'emerald' | 'amber' | 'violet';

const TONE: Record<KpiTone, { bg: string; fg: string }> = {
  accent: { bg: 'rgba(37, 99, 235, 0.12)', fg: '#2563eb' },
  cyan: { bg: 'rgba(6, 182, 212, 0.12)', fg: '#0891b2' },
  emerald: { bg: 'rgba(16, 185, 129, 0.12)', fg: '#16a34a' },
  amber: { bg: 'rgba(245, 158, 11, 0.12)', fg: '#d97706' },
  violet: { bg: 'rgba(139, 92, 246, 0.12)', fg: '#7c3aed' },
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
        <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--ax-text-muted, #64748b)' }}>
          {label}
        </span>
      </div>
      <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--ax-text-strong, #0f172a)', lineHeight: 1.2 }}>
        {value}
      </div>
      <div style={{ fontSize: '11.5px', color: 'var(--ax-text-muted, #64748b)', marginTop: 4 }}>
        {sub}
      </div>
    </div>
  );
}

const OVERLAY_CSS = `
  .ax-modal {
    position: fixed; inset: 0; z-index: 9999;
    background: rgba(15, 23, 42, 0.65);
    backdrop-filter: blur(6px);
    display: flex; align-items: center; justify-content: center;
    padding: 20px;
  }
  .ax-modal__backdrop { position: fixed; inset: 0; background: transparent; }
  .ax-modal__dialog {
    position: relative; z-index: 1; background: #ffffff;
    border-radius: 16px; border: 1px solid var(--ax-border, #e2e8f0);
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
    overflow: hidden; width: 100%;
  }
  .ax-modal__dialog--lg { max-width: 900px; }
  .ax-modal__header {
    padding: 18px 24px;
    border-bottom: 1px solid var(--ax-border, #e2e8f0);
    background: var(--ax-surface-subtle, #f8fafc);
    display: flex; align-items: center; justify-content: space-between;
  }
  .ax-modal__close {
    width: 32px; height: 32px; padding: 0; border-radius: 50%;
    border: none; background: transparent; cursor: pointer;
    display: inline-flex; align-items: center; justify-content: center;
    color: var(--ax-text-muted, #64748b); font-size: 15px; font-weight: 700;
    transition: all 0.15s ease;
  }
  .ax-modal__close:hover {
    background: var(--ax-surface-hover, #e2e8f0);
    color: var(--ax-text-strong, #0f172a);
  }
  .ax-modal__body { padding: 24px; overflow-y: auto; max-height: calc(85vh - 120px); }
  .ax-modal__footer {
    padding: 16px 24px;
    border-top: 1px solid var(--ax-border, #e2e8f0);
    background: var(--ax-surface-subtle, #f8fafc);
    display: flex; align-items: center; justify-content: flex-end; gap: 10px;
  }
  .ax-modal img { border-radius: 0 !important; }

  .ula-m-stage {
    position: relative; display: flex; overflow: auto;
    height: min(66vh, 600px); background: var(--ax-surface-subtle, #f1f5f9);
  }
  .ula-m-stage__msg {
    position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; gap: 8px;
    font-size: 13px; color: var(--ax-text-muted, #64748b); text-align: center; padding: 16px;
  }
  .ula-m-zoom { display: inline-flex; align-items: center; gap: 8px; }
  .ula-m-zoom__val { min-width: 44px; text-align: center; font-size: 12px; color: var(--ax-text-muted, #64748b); }
`;

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
  .solar-erp-page img,
  .solar-erp-page .ax-card img {
    border-radius: 0 !important;
  }
  .solar-erp-page .ula-pagination-left {
    width: 100%; display: flex; justify-content: flex-start; align-items: center; margin: 0; overflow-x: auto;
  }
`;

const actionsRowStyle = { gap: 'var(--ax-space-2)', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'flex-end', width: '100%' } as const;
const footerStyle = {
  borderTop: '1px solid var(--ax-border, #e2e8f0)',
  padding: 'var(--ax-space-3) var(--ax-space-4)',
  display: 'flex',
  justifyContent: 'flex-start',
  alignItems: 'center',
  width: '100%',
  boxSizing: 'border-box',
} as const;
const monoCell = { fontFamily: 'var(--ax-font-mono, monospace)', fontSize: 'var(--ax-text-xs, 12px)' } as const;

export function RescoStatusView() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const rawStatus = searchParams.get('status') || 'complete';
  const activeStatus = normalizeRescoStatus(rawStatus);
  const activeDistrict = (searchParams.get('district') || '').trim();

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [sites, setSites] = useState<JammuRescoInstalledSiteItem[]>([]);
  const [search, setSearch] = useState<string>('');
  const [allDistricts, setAllDistricts] = useState<string[]>([]);

  const [preview, setPreview] = useState<{ url: string; title: string } | null>(null);
  const openPreview = useCallback((url: string, title: string) => setPreview({ url, title }), []);
  const closePreview = useCallback(() => setPreview(null), []);

  // Fetch sites based on activeStatus & district
  useEffect(() => {
    let cancelled = false;
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        let list: JammuRescoInstalledSiteItem[] = [];
        if (activeDistrict && activeDistrict !== 'All' && activeDistrict !== 'all') {
          list = await jammuRescoService.getDistrictWiseData(activeStatus, activeDistrict);
        } else {
          list = await jammuRescoService.getStatusWiseData(activeStatus);
        }
        if (!cancelled) {
          setSites(Array.isArray(list) ? list : []);
        }
      } catch (err: any) {
        if (!cancelled) {
          console.error('[RescoStatusView] fetch error:', err);
          setError(err?.message || 'Failed to load RESCO status records from server.');
          setSites([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchData();
    return () => {
      cancelled = true;
    };
  }, [activeStatus, activeDistrict]);

  // Load districts list from Dashboard
  useEffect(() => {
    let cancelled = false;
    jammuRescoService
      .getDashboard()
      .then((dash) => {
        if (cancelled) return;
        const dInstall = Array.isArray(dash?.district_install) ? dash.district_install : [];
        const names = Array.from(new Set(dInstall.map((d: any) => (d.district || '').trim()).filter(Boolean))).sort();
        if (names.length > 0) setAllDistricts(names);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const currentStatusMeta: StatusMeta = STATUS_META_MAP[activeStatus] || {
    key: activeStatus,
    label: activeStatus.replace(/[-_]/g, ' ').toUpperCase(),
    tone: 'accent',
    desc: `Drilling down RESCO rooftop solar sites by status: "${activeStatus}"`,
  };

  const districtOptions = useMemo(() => {
    const set = new Set<string>(allDistricts);
    sites.forEach((s) => {
      const d = txt(s, 'district').trim();
      if (d) set.add(d);
    });
    if (activeDistrict && activeDistrict !== 'All' && activeDistrict !== 'all') {
      set.add(activeDistrict);
    }
    return Array.from(set).sort();
  }, [allDistricts, sites, activeDistrict]);

  const filteredSites = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return sites;
    return sites.filter((s) => {
      const uid = String(s.unique_id || s.id || '').toLowerCase();
      const dist = txt(s, 'district').toLowerCase();
      const name = txt(s, 'site_name').toLowerCase();
      const dept = txt(s, 'department').toLowerCase();
      const ca = txt(s, 'ca_no').toLowerCase();
      const vendor = String(s.vendor_name || s.inst_vendor || '').toLowerCase();
      const cp = txt(s, 'contact_person').toLowerCase();
      const cNo = txt(s, 'contact_number').toLowerCase();
      const inv = txt(s, 'inverter_no').toLowerCase();
      const meter = txt(s, 'meter_no').toLowerCase();
      const net = txt(s, 'nm_sm_no').toLowerCase();
      const log = txt(s, 'loger_no').toLowerCase();

      return (
        uid.includes(q) ||
        dist.includes(q) ||
        name.includes(q) ||
        dept.includes(q) ||
        ca.includes(q) ||
        vendor.includes(q) ||
        cp.includes(q) ||
        cNo.includes(q) ||
        inv.includes(q) ||
        meter.includes(q) ||
        net.includes(q) ||
        log.includes(q)
      );
    });
  }, [sites, search]);

  const {
    page: currentPage,
    pageSize,
    setPage,
    setPageSize,
    paginatedData,
    totalItems,
  } = usePagination({ data: filteredSites, initialPageSize: 10 });

  useEffect(() => {
    setPage(1);
  }, [search, activeStatus, activeDistrict]);

  const handleStatusChange = (newStatus: string) => {
    const valid = normalizeRescoStatus(newStatus);
    const p = new URLSearchParams(searchParams);
    p.set('status', valid);
    setSearchParams(p);
    setPage(1);
  };

  const handleDistrictChange = (newDistrict: string) => {
    const p = new URLSearchParams(searchParams);
    if (!newDistrict || newDistrict === 'All' || newDistrict === 'all') {
      p.delete('district');
    } else {
      p.set('district', newDistrict);
    }
    setSearchParams(p);
    setPage(1);
  };

  const resetFilters = () => {
    setSearch('');
    const p = new URLSearchParams();
    p.set('status', activeStatus);
    setSearchParams(p);
    setPage(1);
  };

  const hasFilters = Boolean(search || (activeDistrict && activeDistrict !== 'All' && activeDistrict !== 'all'));

  const approvedCount = useMemo(
    () => sites.filter((s) => Number(s.inst_verify_status ?? s.verify_status) === 1).length,
    [sites]
  );
  const pendingAuditCount = useMemo(
    () => sites.filter((s) => !s.inst_verify_status || Number(s.inst_verify_status ?? s.verify_status) === 0).length,
    [sites]
  );
  const settledCount = useMemo(
    () => sites.filter((s) => Number(s.inst_claim1_status ?? 0) === 2 || Number(s.inst_claim2_status ?? 0) === 2).length,
    [sites]
  );

  const exportCols: ExportColumn<JammuRescoInstalledSiteItem>[] = useMemo(
    () => [
      {
        header: 'Sr. No.',
        accessor: (_r: JammuRescoInstalledSiteItem, idx?: number) => (idx !== undefined ? idx + 1 : 1),
      } as any,
      { header: 'Unique Id', accessor: (r: JammuRescoInstalledSiteItem) => r.unique_id || r.id },
      { header: 'State', accessor: (r: JammuRescoInstalledSiteItem) => r.state || 'Jammu & Kashmir' },
      { header: 'District', accessor: (r: JammuRescoInstalledSiteItem) => txt(r, 'district') || DASH },
      { header: 'Department', accessor: (r: JammuRescoInstalledSiteItem) => txt(r, 'department') || DASH },
      { header: 'Site Name', accessor: (r: JammuRescoInstalledSiteItem) => txt(r, 'site_name') || DASH },
      { header: 'CA Number', accessor: (r: JammuRescoInstalledSiteItem) => txt(r, 'ca_no') || DASH },
      { header: 'Capacity (kW)', accessor: (r: JammuRescoInstalledSiteItem) => r.plant_sc || r.sanction_load || DASH },
      { header: 'Vendor', accessor: (r: JammuRescoInstalledSiteItem) => r.vendor_name || r.inst_vendor || DASH },
      { header: 'Contact Person', accessor: (r: JammuRescoInstalledSiteItem) => txt(r, 'contact_person') || DASH },
      { header: 'Contact Number', accessor: (r: JammuRescoInstalledSiteItem) => txt(r, 'contact_number') || DASH },
      { header: 'Inverter No.', accessor: (r: JammuRescoInstalledSiteItem) => txt(r, 'inverter_no') || DASH },
      { header: 'Solar Meter No', accessor: (r: JammuRescoInstalledSiteItem) => txt(r, 'meter_no') || DASH },
      { header: 'Net Meter No', accessor: (r: JammuRescoInstalledSiteItem) => txt(r, 'nm_sm_no') || DASH },
      { header: 'Logger No', accessor: (r: JammuRescoInstalledSiteItem) => txt(r, 'loger_no') || DASH },
      { header: 'Latitude', accessor: (r: JammuRescoInstalledSiteItem) => txt(r, 'latitude') || DASH },
      { header: 'Longitude', accessor: (r: JammuRescoInstalledSiteItem) => txt(r, 'longitude') || DASH },
      { header: 'Remark', accessor: (r: JammuRescoInstalledSiteItem) => txt(r, 'remark') || '' },
      {
        header: 'Verify Status',
        accessor: (r: JammuRescoInstalledSiteItem) => {
          const v = Number(r.inst_verify_status ?? r.verify_status);
          if (v === 1) return 'Approved';
          if (v === 2) return 'Rejected';
          return 'Pending';
        },
      },
      {
        header: 'Claim 1 Status',
        accessor: (r: JammuRescoInstalledSiteItem) =>
          Number(r.inst_claim1_status ?? 0) === 2 ? 'Approved' : Number(r.inst_claim1_status ?? 0) === 1 ? 'Raised' : 'Not Raised',
      },
      {
        header: 'Claim 2 Status',
        accessor: (r: JammuRescoInstalledSiteItem) =>
          Number(r.inst_claim2_status ?? 0) === 2 ? 'Approved' : Number(r.inst_claim2_status ?? 0) === 1 ? 'Raised' : 'Not Raised',
      },
    ],
    []
  );

  const stamp = new Date().toISOString().slice(0, 10);
  const fileBase = `Jammu_RESCO_${activeStatus}_Sites`;
  const fileTitle = `Jammu RESCO ${currentStatusMeta.label} Register`;

  const getExportValue = <T,>(row: T, column: ExportColumn<T>, index: number) => {
    if (typeof column.accessor === 'function') {
      return column.accessor(row, index);
    }
    return (row as Record<string, any>)[column.accessor as string] ?? '';
  };

  const escapeExportValue = (value: unknown): string => {
    if (value === null || value === undefined) return '';
    return String(value).replace(/"/g, '""');
  };

  const downloadTextFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const exportToCSV = <T,>(list: T[], columns: ExportColumn<T>[], filename: string) => {
    if (!list.length || !columns.length) return;
    const headerRow = columns.map((c) => `"${escapeExportValue(c.header)}"`).join(',');
    const rows = list.map((row, index) =>
      columns.map((c) => `"${escapeExportValue(getExportValue(row, c, index))}"`).join(',')
    );
    const csv = [headerRow, ...rows].join('\r\n');
    downloadTextFile(`\ufeff${csv}`, `${filename}.csv`, 'text/csv');
  };

  const exportToExcel = <T,>(list: T[], columns: ExportColumn<T>[], filename: string) => {
    if (!list.length || !columns.length) return;
    const tableHtml = `<table border="1"><thead><tr>${columns.map((c) => `<th>${escapeHtml(escapeExportValue(c.header))}</th>`).join('')}</tr></thead><tbody>${list.map((row, idx) => `<tr>${columns.map((c) => `<td>${escapeHtml(escapeExportValue(getExportValue(row, c, idx)))}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
    const html = `<html xmlns:x="urn:schemas-microsoft-com:office:excel"><head><meta charset="UTF-8" /></head><body>${tableHtml}</body></html>`;
    downloadTextFile(`\ufeff${html}`, `${filename}.xls`, 'application/vnd.ms-excel');
  };

  const exportToPDF = <T,>(list: T[], columns: ExportColumn<T>[], title: string) => {
    if (!list.length || !columns.length) return;
    const body = list.map((row, idx) => columns.map((c) => escapeHtml(escapeExportValue(getExportValue(row, c, idx)))));
    const w = window.open('', '_blank', 'width=1200,height=800');
    if (!w) return;
    w.document.write(`<!doctype html><html><head><meta charset="UTF-8" /><title>${escapeHtml(title)}</title><style>
      *{box-sizing:border-box}body{font-family:Arial,sans-serif;padding:24px;color:#222}h1{font-size:20px;margin:0 0 16px}
      table{width:100%;border-collapse:collapse;font-size:10px}th,td{border:1px solid #d8dee6;padding:6px 6px;text-align:left;vertical-align:top}
      th{background:#f3f5f7;font-weight:700}@media print{body{padding:0}@page{size:landscape;margin:10mm}}
    </style></head><body><h1>${escapeHtml(title)}</h1><table><thead><tr>${columns.map((c) => `<th>${escapeHtml(escapeExportValue(c.header))}</th>`).join('')}</tr></thead><tbody>${body.map((r) => `<tr>${r.map((v) => `<td>${v}</td>`).join('')}</tr>`).join('')}</tbody></table><script>window.onload=function(){window.print();};</script></body></html>`);
    w.document.close();
    w.focus();
  };

  return (
    <div className="solar-erp-page">
      <style>{PAGE_CSS}</style>
      <style>{OVERLAY_CSS}</style>

      {/* ── Page Head ── */}
      <PageHead
        title={`Jammu RESCO: ${currentStatusMeta.label}`}
        subtitle={`${currentStatusMeta.desc} · Showing records for ${activeDistrict ? `District: ${activeDistrict}` : 'All Jammu & Kashmir Districts'}`}
        breadcrumbs={[
          { label: 'ERP Dashboard', href: '/' },
          { label: 'Vendor Management', href: '/vendor-management' },
          { label: 'Jammu' },
          { label: 'Installation' },
          { label: 'RESCO' },
          { label: 'Dashboard', href: '/v/jammu/installation/resco/dashboard' },
          { label: currentStatusMeta.label },
        ]}
        actions={
          <div style={{ display: 'inline-flex', gap: 'var(--ax-space-2)' }}>
            <Link to="/v/jammu/installation/resco/dashboard" className="ax-btn ax-btn--secondary ax-btn--sm">
              <span className="ax-btn__label">← Back to Dashboard</span>
            </Link>
            <Link to="/v/jammu/installation/resco/installation-details" className="ax-btn ax-btn--primary ax-btn--sm">
              <span className="ax-btn__label">Verify Sites Register →</span>
            </Link>
          </div>
        }
      />

      {error && (
        <div className="ax-alert ax-alert--danger" style={{ marginBottom: 'var(--ax-space-4)' }} role="alert">
          <div className="ax-alert__title">Failed to load data</div>
          <div className="ax-alert__text">{error}</div>
        </div>
      )}

      {/* ── Top Metric KPI Cards ── */}
      <div className="asw-cards-row">
        <KpiCard
          tone="accent"
          label="Category Total"
          value={loading ? '…' : sites.length.toLocaleString('en-IN')}
          sub={`Status: "${currentStatusMeta.key}"`}
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <rect x="4" y="4" width="16" height="16" rx="2" />
              <path d="M8 9h8M8 13h8M8 17h5" />
            </svg>
          }
        />

        <KpiCard
          tone="cyan"
          label="Selected Territory"
          value={activeDistrict || 'All Districts'}
          sub={activeDistrict ? 'Single district filter active' : `${districtOptions.length} districts recorded`}
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 11a3 3 0 1 0 6 0a3 3 0 0 0 -6 0" />
              <path d="M17.657 16.657l-4.243 4.243a2 2 0 0 1 -2.827 0l-4.244 -4.243a8 8 0 1 1 11.314 0" />
            </svg>
          }
        />

        <KpiCard
          tone="emerald"
          label="Audit Approved"
          value={loading ? '…' : approvedCount.toLocaleString('en-IN')}
          sub={`${pendingAuditCount} audit pending in this view`}
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="9" />
              <polyline points="12 7 12 12 15 15" />
            </svg>
          }
        />

        <KpiCard
          tone="violet"
          label="Payment Settled"
          value={loading ? '…' : settledCount.toLocaleString('en-IN')}
          sub="Disbursed vendor payment sites"
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="1" x2="12" y2="23" />
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          }
        />
      </div>

      {/* ── Main Table Card ── */}
      <section className="ax-card ax-col--12" id="resco-status-tabpanel" role="tabpanel" aria-label="Jammu RESCO Status Sites Data">
        <div className="ax-card__header">
          <div className="ax-card__titles">
            <h2 className="ax-card__title">
              {currentStatusMeta.label} Table
            </h2>
            <p className="ax-card__subtitle">
              <span className="ax-num">{filteredSites.length}</span> of <span className="ax-num">{sites.length}</span> sites
              {' '}· Status: <b>{currentStatusMeta.label}</b>
              {activeDistrict ? ` · District: ${activeDistrict}` : ' · All Districts'}
            </p>
          </div>
          <div className="ax-card__actions">
            <div className="ax-cluster" style={actionsRowStyle}>
              {/* Category Status Dropdown */}
              <select
                id="resco_status_category_select"
                className="ax-input ax-input--sm"
                style={{ width: 190, height: 32, fontSize: 'var(--ax-text-xs)' }}
                value={activeStatus}
                onChange={(e) => handleStatusChange(e.target.value)}
                aria-label="Filter by installation status category"
              >
                {RESCO_STATUS_LIST.map((meta) => (
                  <option key={meta.key} value={meta.key}>
                    {meta.label}
                  </option>
                ))}
              </select>

              {/* District Dropdown */}
              <select
                id="resco_district_filter"
                className="ax-input ax-input--sm"
                style={{ width: 140, height: 32, fontSize: 'var(--ax-text-xs)' }}
                value={activeDistrict || 'All'}
                onChange={(e) => handleDistrictChange(e.target.value)}
                aria-label="Filter by district"
              >
                <option value="All">All Districts</option>
                {districtOptions.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>

              {hasFilters && (
                <button
                  type="button"
                  className="ax-btn ax-btn--ghost ax-btn--sm"
                  onClick={resetFilters}
                  style={{ height: 30, padding: '0 8px', fontSize: 'var(--ax-text-xs)' }}
                >
                  Reset
                </button>
              )}

              <div style={{ width: 220 }}>
                <SearchInput
                  value={search}
                  onChange={(val) => {
                    setSearch(val);
                    setPage(1);
                  }}
                  placeholder="Search UID, site, CA no..."
                  size="sm"
                  ariaLabel="Search status records"
                />
              </div>

              <TableExportToolbar
                onExportCSV={() => exportToCSV(filteredSites, exportCols, `${fileBase}_${stamp}`)}
                onExportExcel={() => exportToExcel(filteredSites, exportCols, `${fileBase}_${stamp}`)}
                onExportPDF={() => exportToPDF(filteredSites, exportCols, fileTitle)}
              />
            </div>
          </div>
        </div>

        {/* ── Table Container ── */}
        <div className="ax-table-wrap ula-table--wide" style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <table className="ax-table ax-table--hover" style={{ whiteSpace: 'nowrap', minWidth: 2000 }}>
            <thead className="ax-table__head">
              <tr className="ax-table__header-row">
                <th className="ax-table__th ax-num" style={{ width: 50 }}>Sr. No.</th>
                <th className="ax-table__th" style={{ width: 90 }}>Unique Id</th>
                <th className="ax-table__th">State</th>
                <th className="ax-table__th">District</th>
                <th className="ax-table__th">Department</th>
                <th className="ax-table__th">Site Name</th>
                <th className="ax-table__th">CA Number</th>
                <th className="ax-table__th">Capacity</th>
                <th className="ax-table__th">Vendor</th>
                <th className="ax-table__th">Contact Person</th>
                <th className="ax-table__th">Contact Number</th>
                <th className="ax-table__th">Inverter No.</th>
                <th className="ax-table__th">Solar Meter</th>
                <th className="ax-table__th">Net Meter</th>
                <th className="ax-table__th">Logger No</th>
                <th className="ax-table__th" style={{ textAlign: 'center', width: 80 }}>Site Photo</th>
                <th className="ax-table__th" style={{ textAlign: 'center', width: 80 }}>Inverter Photo</th>
                <th className="ax-table__th">Latitude</th>
                <th className="ax-table__th">Longitude</th>
                <th className="ax-table__th" style={{ minWidth: 140 }}>Remarks</th>
                <th className="ax-table__th">Verify Status</th>
                <th className="ax-table__th">Doc Status</th>
                <th className="ax-table__th">Claim 1</th>
                <th className="ax-table__th" style={{ textAlign: 'center', width: 90 }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={24} style={{ textAlign: 'center', padding: '48px 24px' }}>
                    <span className="ax-spinner" />
                    <p style={{ marginTop: 8, fontSize: '13px', color: 'var(--ax-text-muted)' }}>
                      Fetching {currentStatusMeta.label} records from server...
                    </p>
                  </td>
                </tr>
              )}

              {!loading && filteredSites.length === 0 && (
                <tr>
                  <td colSpan={24} style={{ padding: 0 }}>
                    <TableEmptyState
                      title="No RESCO Site Records Found"
                      message={
                        hasFilters
                          ? 'No records match your filters or search. Try clearing your query.'
                          : `No sites are currently categorized under "${currentStatusMeta.label}".`
                      }
                      onClear={hasFilters ? resetFilters : undefined}
                      clearLabel="Clear filters"
                    />
                  </td>
                </tr>
              )}

              {!loading &&
                paginatedData.map((row, index) => {
                  const lat = txt(row, 'latitude');
                  const lng = txt(row, 'longitude');
                  const hasGeo = lat !== '' && lng !== '' && !Number.isNaN(Number(lat)) && !Number.isNaN(Number(lng));
                  const siteLabel = txt(row, 'site_name') || `Site ${row.id}`;
                  const photoMain = row.system_image || row.inst_system_image || row.file || row.panel_image;
                  const photoInv = row.inverter_image || row.inst_inverter_image;
                  const vStatus = Number(row.inst_verify_status ?? row.verify_status ?? 0);
                  const isVerifyApproved = vStatus === 1;
                  const docStatus = Number(row.inst_doc_status ?? row.document_status ?? 0);
                  const c1Status = Number(row.inst_claim1_status ?? 0);

                  return (
                    <tr key={row.id || index} className="ax-table__row">
                      <td className="ax-table__td ax-num">{(currentPage - 1) * pageSize + index + 1}</td>
                      <td className="ax-table__td">
                        <span className="ax-badge" style={{ background: 'rgba(37, 99, 235, 0.12)', color: '#2563eb', fontWeight: 700 }}>
                          {row.unique_id || row.id}
                        </span>
                      </td>
                      <td className="ax-table__td">{txt(row, 'state')?.toUpperCase() || 'JAMMU & KASHMIR'}</td>
                      <td className="ax-table__td"><b>{txt(row, 'district') || DASH}</b></td>
                      <td className="ax-table__td">{txt(row, 'department') || DASH}</td>
                      <td className="ax-table__td" style={{ fontWeight: 600, color: 'var(--ax-text-strong)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {siteLabel}
                      </td>
                      <td className="ax-table__td" style={monoCell}>{txt(row, 'ca_no') || DASH}</td>
                      <td className="ax-table__td">{row.plant_sc || row.sanction_load ? `${row.plant_sc || row.sanction_load} kW` : DASH}</td>
                      <td className="ax-table__td">
                        <span style={{ fontWeight: 600, color: 'var(--ax-text-strong)' }}>
                          {row.vendor_name || row.inst_vendor || DASH}
                        </span>
                      </td>
                      <td className="ax-table__td">{txt(row, 'contact_person') || DASH}</td>
                      <td className="ax-table__td" style={monoCell}>{txt(row, 'contact_number') || DASH}</td>
                      <td className="ax-table__td" style={monoCell}>{txt(row, 'inverter_no') || DASH}</td>
                      <td className="ax-table__td" style={monoCell}>{txt(row, 'meter_no') || DASH}</td>
                      <td className="ax-table__td" style={monoCell}>{txt(row, 'nm_sm_no') || DASH}</td>
                      <td className="ax-table__td" style={monoCell}>{txt(row, 'loger_no') || DASH}</td>

                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        <InstallationThumbnail
                          src={photoMain}
                          alt={`${siteLabel} - System`}
                          onPreview={openPreview}
                        />
                      </td>

                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        <InstallationThumbnail
                          src={photoInv}
                          alt={`${siteLabel} - Inverter`}
                          onPreview={openPreview}
                        />
                      </td>

                      <td className="ax-table__td">
                        {hasGeo ? (
                          <a
                            href={`https://www.google.com/maps?q=${lat},${lng}`}
                            target="_blank"
                            rel="noreferrer"
                            style={{ color: 'var(--ax-primary-default, #2563eb)', textDecoration: 'none', fontWeight: 600 }}
                            title="Open location in Google Maps"
                          >
                            {lat}
                          </a>
                        ) : (
                          lat || DASH
                        )}
                      </td>
                      <td className="ax-table__td">{lng || DASH}</td>

                      <td className="ax-table__td" style={{ maxWidth: 180, whiteSpace: 'normal', fontSize: '12px' }}>
                        {txt(row, 'remark') || DASH}
                      </td>

                      <td className="ax-table__td">
                        <VerifyBadge value={vStatus} raw={row.inst_verify_status} />
                      </td>
                      <td className="ax-table__td">
                        <DocBadge status={docStatus} />
                      </td>
                      <td className="ax-table__td">
                        <ClaimBadge status={c1Status} />
                      </td>

                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        {isVerifyApproved ? (
                          <span
                            className="ax-badge ax-badge--soft"
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 5,
                              padding: '5px 11px',
                              fontSize: '11.5px',
                              fontWeight: 600,
                              color: 'var(--ax-text-muted, #64748b)',
                              background: 'var(--ax-surface-subtle, #f1f5f9)',
                              border: '1px solid var(--ax-border, #cbd5e1)',
                              borderRadius: 6,
                              cursor: 'not-allowed',
                              userSelect: 'none',
                            }}
                            title="Installation Verified & Approved. Actions are locked."
                          >
                            <svg
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth={2}
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              style={{ width: 13, height: 13, color: '#64748b' }}
                              aria-hidden="true"
                            >
                              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                            </svg>
                            <span>Locked</span>
                          </span>
                        ) : (
                          <button
                            type="button"
                            className="ax-btn ax-btn--secondary ax-btn--sm"
                            style={{ padding: '4px 10px', fontSize: '12px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}
                            onClick={() => navigate(`/v/jammu/installation/resco/installation-details`)}
                          >
                            Review
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>

        <div className="ax-card__footer" style={footerStyle}>
          <div className="ula-pagination-left">
            <Pagination
              currentPage={currentPage}
              curPage={currentPage}
              totalItems={totalItems}
              total={totalItems}
              pageSize={pageSize}
              onPageChange={setPage}
              setPage={setPage}
              onPageSizeChange={setPageSize}
              pageSizeOptions={[10, 25, 50, 100, 200]}
            />
          </div>
        </div>
      </section>

      {/* ── Photo Preview Modal ── */}
      {preview && <ImagePreviewModal url={preview.url} title={preview.title} onClose={closePreview} />}
    </div>
  );
}

export const StatusView = RescoStatusView;
export default RescoStatusView;
