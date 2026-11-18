import { useState, useMemo, useEffect, useCallback, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { PageHead } from '../../../../shell/PageHead';
import { useFocusTrap } from '../../../../../hooks/useFocusTrap';
import {
  upInstallationService,
  resolveUpMediaUrl,
  type UpRescoDashboardCounts,
} from '../../up-services';
import {
  Pagination,
  usePagination,
  SearchInput,
  TableExportToolbar,
  TableEmptyState,
  copyTableDataToClipboard,
  exportDataToCSV,
  exportDataToExcel,
  printTableData,
  type ExportColumn,
} from '../../../../../common';

/* ───────── UI Constants & Helpers ───────── */
const DASH = '—';

const num = (x: unknown) => {
  const n = Number(x ?? 0);
  return isNaN(n) ? String(x ?? '0') : n.toLocaleString('en-IN');
};

const pickStr = (obj: any, ...keys: string[]): string => {
  if (!obj) return '';
  for (const k of keys) {
    const v = obj[k];
    if (v !== null && v !== undefined && String(v).trim() !== '') {
      return String(v).trim();
    }
  }
  return '';
};

const pickNum = (obj: any, ...keys: string[]): number | undefined => {
  if (!obj) return undefined;
  for (const k of keys) {
    const v = obj[k];
    if (v !== null && v !== undefined && v !== '' && !isNaN(Number(v))) {
      return Number(v);
    }
  }
  return undefined;
};

/* ───────── Status Catalog according to API spec (Endpoint 18 & 19) ───────── */
export interface StatusOption {
  id: string;
  label: string;
  group: 'Installation' | 'Verification' | 'Document' | 'Claim 1' | 'Claim 2' | 'Claim 3' | 'Payment 1' | 'Payment 2' | 'Payment 3';
  tone: 'accent' | 'cyan' | 'emerald' | 'amber' | 'violet' | 'pink' | 'red';
  countKey?: keyof UpRescoDashboardCounts | string;
}

export const RESCO_STATUS_OPTIONS: StatusOption[] = [
  // Installation
  { id: 'total', label: 'Total Sites', group: 'Installation', tone: 'accent', countKey: 'site_count' },
  { id: 'complete', label: 'Installation Complete', group: 'Installation', tone: 'emerald', countKey: 'complete' },
  { id: 'pending', label: 'Installation Pending', group: 'Installation', tone: 'amber', countKey: 'pending' },

  // Verification
  { id: 'verify-approved', label: 'Verify Approved', group: 'Verification', tone: 'emerald', countKey: 'verify_approved' },
  { id: 'verify-pending', label: 'Verify Pending', group: 'Verification', tone: 'amber', countKey: 'verify_pending' },
  { id: 'verify-reject', label: 'Verify Rejected', group: 'Verification', tone: 'red', countKey: 'verify_reject' },

  // Document
  { id: 'doc-approved', label: 'Doc Approved', group: 'Document', tone: 'emerald', countKey: 'doc_approved' },
  { id: 'doc-pending', label: 'Doc Pending', group: 'Document', tone: 'amber', countKey: 'doc_pending' },
  { id: 'doc-reject', label: 'Doc Rejected', group: 'Document', tone: 'red', countKey: 'doc_reject' },

  // Claim 1
  { id: 'inst-claim1-applicable', label: 'Claim 1 Applicable', group: 'Claim 1', tone: 'cyan', countKey: 'inst_claim1_applicable' },
  { id: 'inst-claim1-raised', label: 'Claim 1 Raised', group: 'Claim 1', tone: 'accent', countKey: 'inst_claim1_raised' },
  { id: 'inst-claim1-approved', label: 'Claim 1 Approved', group: 'Claim 1', tone: 'emerald', countKey: 'inst_claim1_approved' },
  { id: 'inst-claim1-pending', label: 'Claim 1 Pending', group: 'Claim 1', tone: 'amber', countKey: 'inst_claim1_pending' },
  { id: 'inst-claim1-reject', label: 'Claim 1 Rejected', group: 'Claim 1', tone: 'red', countKey: 'inst_claim1_reject' },

  // Claim 2
  { id: 'inst-claim2-applicable', label: 'Claim 2 Applicable', group: 'Claim 2', tone: 'cyan', countKey: 'inst_claim2_applicable' },
  { id: 'inst-claim2-raised', label: 'Claim 2 Raised', group: 'Claim 2', tone: 'accent', countKey: 'inst_claim2_raised' },
  { id: 'inst-claim2-approved', label: 'Claim 2 Approved', group: 'Claim 2', tone: 'emerald', countKey: 'inst_claim2_approved' },
  { id: 'inst-claim2-pending', label: 'Claim 2 Pending', group: 'Claim 2', tone: 'amber', countKey: 'inst_claim2_pending' },
  { id: 'inst-claim2-reject', label: 'Claim 2 Rejected', group: 'Claim 2', tone: 'red', countKey: 'inst_claim2_reject' },

  // Claim 3
  { id: 'inst-claim3-applicable', label: 'Claim 3 Applicable', group: 'Claim 3', tone: 'cyan', countKey: 'inst_claim3_applicable' },
  { id: 'inst-claim3-raised', label: 'Claim 3 Raised', group: 'Claim 3', tone: 'accent', countKey: 'inst_claim3_raised' },
  { id: 'inst-claim3-approved', label: 'Claim 3 Approved', group: 'Claim 3', tone: 'emerald', countKey: 'inst_claim3_approved' },
  { id: 'inst-claim3-pending', label: 'Claim 3 Pending', group: 'Claim 3', tone: 'amber', countKey: 'inst_claim3_pending' },
  { id: 'inst-claim3-reject', label: 'Claim 3 Rejected', group: 'Claim 3', tone: 'red', countKey: 'inst_claim3_reject' },

  // Payment 1
  { id: 'inst-pay1-complete', label: 'Payment 1 Complete', group: 'Payment 1', tone: 'emerald', countKey: 'inst_pay1_complete' },
  { id: 'inst-pay1-partially', label: 'Payment 1 Partial', group: 'Payment 1', tone: 'amber', countKey: 'inst_pay1_partially' },
  { id: 'inst-pay1-pending', label: 'Payment 1 Pending', group: 'Payment 1', tone: 'violet', countKey: 'inst_pay1_pending' },

  // Payment 2
  { id: 'inst-pay2-complete', label: 'Payment 2 Complete', group: 'Payment 2', tone: 'emerald', countKey: 'inst_pay2_complete' },
  { id: 'inst-pay2-partially', label: 'Payment 2 Partial', group: 'Payment 2', tone: 'amber', countKey: 'inst_pay2_partially' },
  { id: 'inst-pay2-pending', label: 'Payment 2 Pending', group: 'Payment 2', tone: 'violet', countKey: 'inst_pay2_pending' },

  // Payment 3
  { id: 'inst-pay3-complete', label: 'Payment 3 Complete', group: 'Payment 3', tone: 'emerald', countKey: 'inst_pay3_complete' },
  { id: 'inst-pay3-partially', label: 'Payment 3 Partial', group: 'Payment 3', tone: 'amber', countKey: 'inst_pay3_partially' },
  { id: 'inst-pay3-pending', label: 'Payment 3 Pending', group: 'Payment 3', tone: 'violet', countKey: 'inst_pay3_pending' },
];

const normalizeStatusKey = (s?: string): string => {
  if (!s) return 'total';
  const clean = s.toLowerCase().trim().replace(/_/g, '-');
  if (clean === 'site-count' || clean === 'all') return 'total';
  if (clean === 'installed') return 'complete';
  return clean;
};

/* ───────── UP Districts Reference List ───────── */
const DEFAULT_UP_DISTRICTS = [
  'Agra', 'Aligarh', 'Ambedkar Nagar', 'Amethi', 'Amroha', 'Auraiya', 'Ayodhya', 'Azamgarh',
  'Baghpat', 'Bahraich', 'Ballia', 'Balrampur', 'Banda', 'Barabanki', 'Bareilly', 'Basti',
  'Bhadohi', 'Bijnor', 'Budaun', 'Bulandshahr', 'Chandauli', 'Chitrakoot', 'Deoria', 'Etah',
  'Etawah', 'Farrukhabad', 'Fatehpur', 'Firozabad', 'Gautam Buddha Nagar', 'Ghaziabad',
  'Ghazipur', 'Gonda', 'Gorakhpur', 'Hamirpur', 'Hapur', 'Hardoi', 'Hathras', 'Jalaun',
  'Jaunpur', 'Jhansi', 'Kannauj', 'Kanpur Dehat', 'Kanpur Nagar', 'Kasganj', 'Kaushambi',
  'Kushinagar', 'Lakhimpur Kheri', 'Lalitpur', 'Lucknow', 'Maharajganj', 'Mahoba', 'Mainpuri',
  'Mathura', 'Mau', 'Meerut', 'Mirzapur', 'Moradabad', 'Muzaffarnagar', 'Pilibhit', 'Pratapgarh',
  'Prayagraj', 'Raebareli', 'Rampur', 'Saharanpur', 'Sambhal', 'Sant Kabir Nagar', 'Shahjahanpur',
  'Shamli', 'Shravasti', 'Siddharthnagar', 'Sitapur', 'Sonbhadra', 'Sultanpur', 'Unnao', 'Varanasi',
];

/* ───────── Lightbox with Zoom Modal ───────── */
const ZOOM_STEPS = [1, 1.5, 2, 3];

function ImagePreviewModal({ url, title, onClose }: { url: string; title: string; onClose: () => void }) {
  const [zoomIdx, setZoomIdx] = useState(0);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const zoom = ZOOM_STEPS[zoomIdx];
  const dialogRef = useRef<HTMLDivElement>(null);
  useFocusTrap(dialogRef, true);

  useEffect(() => {
    setZoomIdx(0);
    setStatus('loading');
  }, [url]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return createPortal(
    <div
      className="ax-modal"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(0,0,0,0.65)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
      }}
    >
      <div
        ref={dialogRef}
        className="ax-modal__dialog ax-modal__dialog--lg"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#fff',
          borderRadius: 12,
          overflow: 'hidden',
          width: '100%',
          maxWidth: 860,
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.3)',
        }}
      >
        <div
          className="ax-modal__header"
          style={{
            padding: '14px 18px',
            borderBottom: '1px solid var(--ax-border, #e2e8f0)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <h4 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>{title || 'Media Preview'}</h4>
          <button type="button" className="ax-btn ax-btn--ghost ax-btn--sm" onClick={onClose} aria-label="Close dialog">
            ✕
          </button>
        </div>

        <div className="ax-modal__body" style={{ padding: 0 }}>
          <div
            style={{
              position: 'relative',
              display: 'flex',
              overflow: 'auto',
              height: 'min(66vh, 560px)',
              background: 'var(--ax-surface-subtle, #f8fafc)',
            }}
          >
            {status === 'loading' && (
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontSize: 13, color: '#64748b' }}>
                <span className="ax-spinner" /> Loading image…
              </div>
            )}
            {status === 'error' && (
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, color: '#ef4444' }}>
                Image preview unavailable. Click &ldquo;Open Full&rdquo; below to view.
              </div>
            )}
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
          </div>
        </div>

        <div
          className="ax-modal__footer"
          style={{
            padding: '12px 18px',
            borderTop: '1px solid var(--ax-border, #e2e8f0)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <button
              type="button"
              className="ax-btn ax-btn--secondary ax-btn--sm"
              onClick={() => setZoomIdx((i) => Math.max(0, i - 1))}
              disabled={zoomIdx === 0}
            >
              −
            </button>
            <span style={{ minWidth: 44, textAlign: 'center', fontSize: 12, color: 'var(--ax-text-muted)' }}>
              {Math.round(zoom * 100)}%
            </span>
            <button
              type="button"
              className="ax-btn ax-btn--secondary ax-btn--sm"
              onClick={() => setZoomIdx((i) => Math.min(ZOOM_STEPS.length - 1, i + 1))}
              disabled={zoomIdx === ZOOM_STEPS.length - 1}
            >
              +
            </button>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <a href={url} target="_blank" rel="noreferrer" className="ax-btn ax-btn--secondary ax-btn--sm">
              Open Full
            </a>
            <button type="button" className="ax-btn ax-btn--primary ax-btn--sm" onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

/* ───────── Site Detail Modal ───────── */
function SiteDetailModal({ site, onClose, onPreview }: { site: any; onClose: () => void; onPreview: (url: string, title: string) => void }) {
  const dialogRef = useRef<HTMLDivElement>(null);
  useFocusTrap(dialogRef, true);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const images = [
    { label: 'System Overview Image', raw: site.system_image },
    { label: 'Inverter Image', raw: site.inverter_image },
    { label: 'Solar Panel Image', raw: site.panel_image },
    { label: 'Solar / Net Meter Image', raw: site.net_meter_smart_meter_image || site.nm_sm_image || site.meter_image },
    { label: 'Logger Image', raw: site.loger_image || site.logger_image },
  ].filter((img) => Boolean(img.raw));

  return createPortal(
    <div
      className="ax-modal"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9990,
        background: 'rgba(0,0,0,0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
    >
      <div
        ref={dialogRef}
        className="ax-modal__dialog"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#fff',
          borderRadius: 12,
          overflow: 'hidden',
          width: '100%',
          maxWidth: 780,
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.35)',
        }}
      >
        <div
          className="ax-modal__header"
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--ax-border, #e2e8f0)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>
              {pickStr(site, 'site_name', 'name') || `Site #${site.id}`}
            </h3>
            <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--ax-text-muted)' }}>
              District: <b>{pickStr(site, 'district') || DASH}</b> · ID: #{site.id}
            </p>
          </div>
          <button type="button" className="ax-btn ax-btn--ghost ax-btn--sm" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="ax-modal__body" style={{ padding: '18px 20px', overflowY: 'auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--ax-text-muted)', textTransform: 'uppercase' }}>Site Name</div>
              <div style={{ fontSize: 13, fontWeight: 600, marginTop: 2 }}>{pickStr(site, 'site_name', 'name') || DASH}</div>
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--ax-text-muted)', textTransform: 'uppercase' }}>District / State</div>
              <div style={{ fontSize: 13, fontWeight: 600, marginTop: 2 }}>{pickStr(site, 'district') || DASH}, {pickStr(site, 'state') || 'UP'}</div>
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--ax-text-muted)', textTransform: 'uppercase' }}>Department / Firm</div>
              <div style={{ fontSize: 13, marginTop: 2 }}>{pickStr(site, 'dept_name', 'department', 'firm_name') || DASH}</div>
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--ax-text-muted)', textTransform: 'uppercase' }}>CA / Account No.</div>
              <div style={{ fontSize: 13, marginTop: 2 }}>{pickStr(site, 'ca_no', 'account_no') || DASH}</div>
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--ax-text-muted)', textTransform: 'uppercase' }}>Contact Person</div>
              <div style={{ fontSize: 13, marginTop: 2 }}>
                {pickStr(site, 'contact_person', 'nodal_person') || DASH}
                {pickStr(site, 'contact_number', 'mobile') && (
                  <span style={{ color: 'var(--ax-text-muted)', fontSize: 12, marginLeft: 6 }}>
                    ({pickStr(site, 'contact_number', 'mobile')})
                  </span>
                )}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--ax-text-muted)', textTransform: 'uppercase' }}>Installation Date</div>
              <div style={{ fontSize: 13, marginTop: 2 }}>{pickStr(site, 'installation_date', 'inst_date') || DASH}</div>
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--ax-text-muted)', textTransform: 'uppercase' }}>Inverter Serial No.</div>
              <div style={{ fontSize: 13, fontFamily: 'monospace', marginTop: 2 }}>{pickStr(site, 'inverter_no') || DASH}</div>
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--ax-text-muted)', textTransform: 'uppercase' }}>Solar Meter No.</div>
              <div style={{ fontSize: 13, fontFamily: 'monospace', marginTop: 2 }}>{pickStr(site, 'solar_meter_no', 'solarmeter_no') || DASH}</div>
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--ax-text-muted)', textTransform: 'uppercase' }}>Net Meter / Logger No.</div>
              <div style={{ fontSize: 13, fontFamily: 'monospace', marginTop: 2 }}>
                {pickStr(site, 'net_smart_meter_no', 'nm_sm_no') || DASH} / {pickStr(site, 'loger_no', 'logger_no') || DASH}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--ax-text-muted)', textTransform: 'uppercase' }}>Physical Verification</div>
              <div style={{ marginTop: 2 }}>
                {Number(site.verify_status ?? site.inst_verify_status) === 1 ? (
                  <span className="ax-badge ax-badge--soft ax-badge--success">Approved</span>
                ) : Number(site.verify_status ?? site.inst_verify_status) === 2 ? (
                  <span className="ax-badge ax-badge--soft ax-badge--danger">Rejected</span>
                ) : (
                  <span className="ax-badge ax-badge--soft ax-badge--warning">Pending</span>
                )}
                {pickStr(site, 'verify_remarks', 'remark') && (
                  <div style={{ fontSize: 12, color: 'var(--ax-text-muted)', marginTop: 2 }}>
                    {pickStr(site, 'verify_remarks', 'remark')}
                  </div>
                )}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--ax-text-muted)', textTransform: 'uppercase' }}>Document Verification</div>
              <div style={{ marginTop: 2 }}>
                {Number(site.document_status ?? site.inst_doc_status) === 1 ? (
                  <span className="ax-badge ax-badge--soft ax-badge--success">Approved</span>
                ) : Number(site.document_status ?? site.inst_doc_status) === 2 ? (
                  <span className="ax-badge ax-badge--soft ax-badge--danger">Rejected</span>
                ) : (
                  <span className="ax-badge ax-badge--soft ax-badge--warning">Pending</span>
                )}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--ax-text-muted)', textTransform: 'uppercase' }}>Coordinates (Lat, Long)</div>
              <div style={{ fontSize: 12, marginTop: 2 }}>
                {pickStr(site, 'latitude', 'inst_latitude') || DASH}, {pickStr(site, 'longitude', 'inst_longitude') || DASH}
              </div>
            </div>
          </div>

          {/* Photo Gallery */}
          <div style={{ marginTop: 20 }}>
            <h4 style={{ fontSize: 13, fontWeight: 700, margin: '0 0 10px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Installation Photos ({images.length})
            </h4>
            {images.length === 0 ? (
              <div style={{ padding: 14, background: 'var(--ax-surface-subtle, #f8fafc)', borderRadius: 8, fontSize: 12, color: 'var(--ax-text-muted)' }}>
                No site photos uploaded yet for this installation.
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 10 }}>
                {images.map((img, i) => {
                  const resolved = resolveUpMediaUrl(img.raw);
                  return (
                    <div
                      key={i}
                      style={{
                        border: '1px solid var(--ax-border, #e2e8f0)',
                        borderRadius: 8,
                        overflow: 'hidden',
                        cursor: 'pointer',
                        background: '#f8fafc',
                      }}
                      onClick={() => onPreview(resolved, img.label)}
                    >
                      <div style={{ height: 95, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#000' }}>
                        <img
                          src={resolved}
                          alt={img.label}
                          style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }}
                          onError={(e) => {
                            (e.currentTarget as HTMLElement).style.display = 'none';
                          }}
                        />
                      </div>
                      <div style={{ padding: '6px 8px', fontSize: 11, fontWeight: 600, color: 'var(--ax-text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {img.label}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div
          className="ax-modal__footer"
          style={{
            padding: '12px 20px',
            borderTop: '1px solid var(--ax-border, #e2e8f0)',
            display: 'flex',
            justifyContent: 'flex-end',
          }}
        >
          <button type="button" className="ax-btn ax-btn--secondary ax-btn--sm" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

/* ───────── Main Component: UP_Installation_Resco_StatusView ───────── */
export function UP_Installation_Resco_StatusView() {
  const { status: paramStatus } = useParams<{ status?: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // Active status key from route param or search params (defaults to 'total')
  const currentStatus = useMemo(() => {
    return normalizeStatusKey(paramStatus || searchParams.get('status') || 'total');
  }, [paramStatus, searchParams]);

  const currentDistrict = searchParams.get('district') || '';

  // Component state
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sites, setSites] = useState<any[]>([]);
  const [counts, setCounts] = useState<UpRescoDashboardCounts | null>(null);
  const [districts, setDistricts] = useState<string[]>(DEFAULT_UP_DISTRICTS);
  const [selectedDistrict, setSelectedDistrict] = useState<string>(currentDistrict);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Search & Modals
  const [searchQuery, setSearchQuery] = useState('');
  const [previewImage, setPreviewImage] = useState<{ url: string; title: string } | null>(null);
  const [detailSite, setDetailSite] = useState<any | null>(null);
  const [activeGroup, setActiveGroup] = useState<string>('All');

  // Keep district state synced with search param
  useEffect(() => {
    setSelectedDistrict(searchParams.get('district') || '');
  }, [searchParams]);

  // Load summary counts from Endpoint 17 once
  const loadCounts = useCallback(async () => {
    try {
      const data = await upInstallationService.getRescoDashboard();
      if (data) {
        setCounts(data);
      }
    } catch (e) {
      console.warn('Could not fetch Resco dashboard counts:', e);
    }
  }, []);

  useEffect(() => {
    loadCounts();
  }, [loadCounts]);

  // Fetch status records according to Endpoint 18 or 19
  const loadData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setErrorMsg(null);

    try {
      let data: any[] = [];
      const dist = selectedDistrict && selectedDistrict !== 'All' ? selectedDistrict : '';

      if (dist) {
        // Endpoint 19: GET up/resco/installation/view-districtwise/{status}/{district}
        data = await upInstallationService.getRescoDashboardByDistrict(currentStatus, dist);
      } else {
        // Endpoint 18: GET up/resco/installation/view-dashboard/{status}
        data = await upInstallationService.getRescoDashboardByStatus(currentStatus);
      }

      setSites(Array.isArray(data) ? data : []);

      // Extract newly discovered districts
      if (Array.isArray(data) && data.length > 0) {
        const discovered = data
          .map((s) => pickStr(s, 'district', 'District'))
          .filter(Boolean);
        if (discovered.length > 0) {
          setDistricts((prev) => Array.from(new Set([...prev, ...discovered])).sort());
        }
      }
    } catch (err: any) {
      console.error('[UP Resco StatusView] Error fetching data:', err);
      setErrorMsg(err?.message || 'Failed to fetch status records from server. Please try again.');
      setSites([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [currentStatus, selectedDistrict]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Switch status (updates route & query params)
  const handleStatusChange = (newStatus: string) => {
    const norm = normalizeStatusKey(newStatus);
    const q = new URLSearchParams(searchParams);
    if (selectedDistrict && selectedDistrict !== 'All') {
      q.set('district', selectedDistrict);
    } else {
      q.delete('district');
    }
    navigate(`/v/up/resco-installation-view-dashboard/${norm}?${q.toString()}`);
  };

  // Switch district
  const handleDistrictChange = (dist: string) => {
    setSelectedDistrict(dist);
    const q = new URLSearchParams(searchParams);
    if (dist && dist !== 'All') {
      q.set('district', dist);
    } else {
      q.delete('district');
    }
    navigate(`/v/up/resco-installation-view-dashboard/${currentStatus}?${q.toString()}`);
  };

  // Filtered sites by local search query
  const filteredSites = useMemo(() => {
    if (!searchQuery.trim()) return sites;
    const q = searchQuery.toLowerCase().trim();
    return sites.filter((s) => {
      return (
        String(s.id || '').toLowerCase().includes(q) ||
        pickStr(s, 'site_name', 'name').toLowerCase().includes(q) ||
        pickStr(s, 'district').toLowerCase().includes(q) ||
        pickStr(s, 'inverter_no').toLowerCase().includes(q) ||
        pickStr(s, 'solar_meter_no', 'solarmeter_no').toLowerCase().includes(q) ||
        pickStr(s, 'ca_no').toLowerCase().includes(q) ||
        pickStr(s, 'contact_person').toLowerCase().includes(q) ||
        pickStr(s, 'contact_number').toLowerCase().includes(q)
      );
    });
  }, [sites, searchQuery]);

  // Pagination hook
  const p = usePagination({ data: filteredSites, initialPageSize: 25 });
  useEffect(() => {
    p.setPage(1);
  }, [searchQuery, currentStatus, selectedDistrict]);

  // Active status meta
  const activeMeta = useMemo(() => {
    return (
      RESCO_STATUS_OPTIONS.find((opt) => opt.id === currentStatus) || {
        id: currentStatus,
        label: currentStatus.replace(/-/g, ' ').toUpperCase(),
        group: 'Installation' as const,
        tone: 'accent' as const,
      }
    );
  }, [currentStatus]);

  // Status groups for pill organization
  const groups = useMemo(() => {
    const list: string[] = ['All'];
    RESCO_STATUS_OPTIONS.forEach((opt) => {
      if (!list.includes(opt.group)) list.push(opt.group);
    });
    return list;
  }, []);

  const visibleStatusOptions = useMemo(() => {
    if (activeGroup === 'All') return RESCO_STATUS_OPTIONS;
    return RESCO_STATUS_OPTIONS.filter((opt) => opt.group === activeGroup);
  }, [activeGroup]);

  // Export Columns definition
  const exportCols: ExportColumn<any>[] = useMemo(
    () => [
      { header: 'Sr. No.', accessor: (_, idx) => (idx !== undefined ? idx + 1 : 1) },
      { header: 'Site ID', accessor: (r) => `#${r.id}` },
      { header: 'Site Name', accessor: (r) => pickStr(r, 'site_name', 'name') || DASH },
      { header: 'District', accessor: (r) => pickStr(r, 'district') || DASH },
      { header: 'Contact Person', accessor: (r) => pickStr(r, 'contact_person') || DASH },
      { header: 'Contact Number', accessor: (r) => pickStr(r, 'contact_number') || DASH },
      { header: 'Installation Date', accessor: (r) => pickStr(r, 'installation_date', 'inst_date') || DASH },
      { header: 'Inverter No.', accessor: (r) => pickStr(r, 'inverter_no') || DASH },
      { header: 'Solar Meter No.', accessor: (r) => pickStr(r, 'solar_meter_no', 'solarmeter_no') || DASH },
      {
        header: 'Installation Status',
        accessor: (r) =>
          r.installation_date || r.inverter_no || Number(r.inst_status) === 1 ? 'Installed' : 'Pending',
      },
      {
        header: 'Verify Status',
        accessor: (r) =>
          Number(r.verify_status ?? r.inst_verify_status) === 1
            ? 'Approved'
            : Number(r.verify_status ?? r.inst_verify_status) === 2
            ? 'Rejected'
            : 'Pending',
      },
      {
        header: 'Document Status',
        accessor: (r) =>
          Number(r.document_status ?? r.inst_doc_status) === 1
            ? 'Approved'
            : Number(r.document_status ?? r.inst_doc_status) === 2
            ? 'Rejected'
            : 'Pending',
      },
      { header: 'Remarks', accessor: (r) => pickStr(r, 'remark', 'verify_remarks', 'remarks') || DASH },
    ],
    []
  );

  return (
    <div className="solar-erp-page ax-page">
      <PageHead
        title="UP Resco - Installation Status View"
        subtitle={
          <span style={{ fontSize: 'var(--ax-text-sm)', color: 'var(--ax-text-muted)' }}>
            Showing <b>{num(filteredSites.length)}</b> sites for status:{' '}
            <b style={{ color: 'var(--ax-text-strong)' }}>{activeMeta.label}</b>
            {selectedDistrict && selectedDistrict !== 'All' ? (
              <> in district <b style={{ color: 'var(--ax-accent)' }}>{selectedDistrict}</b></>
            ) : (
              ' across All Districts'
            )}{' '}
            · Uttar Pradesh Operations
          </span>
        }
        breadcrumbs={[
          { label: 'Home', href: '/v' },
          { label: 'Uttar Pradesh' },
          { label: 'Installation' },
          { label: 'Resco Dashboard', href: '/v/up/resco-installation-dashboard' },
          { label: activeMeta.label },
        ]}
        actions={
          <div className="ax-cluster" style={{ gap: 'var(--ax-space-2)', flexWrap: 'wrap', alignItems: 'center' }}>
            <Link to="/v/up/resco-installation-dashboard" className="ax-btn ax-btn--secondary ax-btn--sm">
              <svg
                style={{ width: 14, height: 14 }}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
              <span>Dashboard</span>
            </Link>
            <button
              type="button"
              className="ax-btn ax-btn--ghost ax-btn--sm"
              onClick={() => loadData(true)}
              disabled={refreshing || loading}
              title="Refresh status data"
            >
              <svg
                className={refreshing || loading ? 'ax-spinner' : ''}
                style={{ width: 14, height: 14 }}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M20 11a8.1 8.1 0 0 0 -15.5 -2m-.5 -4v4h4" />
                <path d="M4 13a8.1 8.1 0 0 0 15.5 2m.5 4v-4h-4" />
              </svg>
              <span>Refresh</span>
            </button>
            <Link to="/v/up/resco-view-assign-installation-sites" className="ax-btn ax-btn--secondary ax-btn--sm">
              Assigned Sites
            </Link>
            <Link to="/v/up/resco-install-site" className="ax-btn ax-btn--primary ax-btn--sm">
              + Install Site
            </Link>
          </div>
        }
      />

      {errorMsg && (
        <div
          className="ax-alert ax-alert--danger"
          style={{
            marginBottom: 16,
            padding: '12px 16px',
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid #ef4444',
            borderRadius: 8,
            color: '#b91c1c',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span>
            <b>Error loading records:</b> {errorMsg}
          </span>
          <button type="button" className="ax-btn ax-btn--sm ax-btn--secondary" onClick={() => loadData(true)}>
            Retry
          </button>
        </div>
      )}

      {/* Filter and Status Pill Selector Card */}
      <div
        className="ax-card"
        style={{
          marginBottom: 16,
          padding: '16px 20px',
          borderRadius: 'var(--ax-radius-lg)',
          background: 'var(--ax-bg-surface, #fff)',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Group Filter Tabs */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  color: 'var(--ax-text-muted)',
                  marginRight: 4,
                }}
              >
                Category:
              </span>
              {groups.map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setActiveGroup(g)}
                  className={`ax-btn ax-btn--sm ${activeGroup === g ? 'ax-btn--secondary' : 'ax-btn--ghost'}`}
                  style={{
                    height: 26,
                    padding: '0 10px',
                    fontSize: 12,
                    fontWeight: activeGroup === g ? 700 : 500,
                    borderRadius: 14,
                  }}
                >
                  {g}
                </button>
              ))}
            </div>

            {/* Live Count Summary */}
            <div style={{ fontSize: 12, color: 'var(--ax-text-muted)' }}>
              Total Sites Loaded:{' '}
              <b style={{ color: 'var(--ax-text-strong)', fontSize: 13 }}>{num(filteredSites.length)}</b>
            </div>
          </div>

          {/* Status Selection Pills */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
            {visibleStatusOptions.map((opt) => {
              const isActive = opt.id === currentStatus;
              const countVal = counts && opt.countKey ? (counts as any)[opt.countKey] : undefined;

              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => handleStatusChange(opt.id)}
                  className="ax-btn ax-btn--sm"
                  style={{
                    borderRadius: 20,
                    padding: '4px 12px',
                    fontSize: 12,
                    fontWeight: isActive ? 700 : 500,
                    background: isActive ? 'var(--ax-accent, #2563eb)' : 'var(--ax-surface-subtle, #f1f5f9)',
                    color: isActive ? '#fff' : 'var(--ax-text-strong, #334155)',
                    border: isActive
                      ? '1px solid var(--ax-accent, #2563eb)'
                      : '1px solid var(--ax-border, #cbd5e1)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    transition: 'all 0.15s ease',
                  }}
                >
                  <span>{opt.label}</span>
                  {countVal !== undefined && (
                    <span
                      style={{
                        fontSize: 11,
                        padding: '1px 6px',
                        borderRadius: 10,
                        background: isActive ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.06)',
                        color: isActive ? '#fff' : 'inherit',
                        fontWeight: 700,
                      }}
                    >
                      {num(countVal)}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* District selector bar */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 12,
              paddingTop: 12,
              borderTop: '1px solid var(--ax-border-subtle, #f1f5f9)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <label
                htmlFor="resco-district-select"
                style={{ fontSize: 12, fontWeight: 600, color: 'var(--ax-text-muted)' }}
              >
                Filter by District:
              </label>
              <select
                id="resco-district-select"
                className="ax-input ax-input--sm"
                style={{ height: 32, fontSize: 12, minWidth: 180 }}
                value={selectedDistrict || 'All'}
                onChange={(e) => handleDistrictChange(e.target.value)}
              >
                <option value="All">All Districts ({districts.length})</option>
                {districts.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
              {selectedDistrict && selectedDistrict !== 'All' && (
                <button
                  type="button"
                  className="ax-btn ax-btn--ghost ax-btn--sm"
                  style={{ height: 28, fontSize: 11 }}
                  onClick={() => handleDistrictChange('All')}
                >
                  Reset District
                </button>
              )}
            </div>

            <div style={{ fontSize: 12, color: 'var(--ax-text-muted)' }}>
              Active Endpoint:{' '}
              <code style={{ fontSize: 11, background: '#f1f5f9', padding: '2px 6px', borderRadius: 4 }}>
                {selectedDistrict && selectedDistrict !== 'All'
                  ? `GET up/resco/installation/view-districtwise/${currentStatus}/${selectedDistrict}`
                  : `GET up/resco/installation/view-dashboard/${currentStatus}`}
              </code>
            </div>
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="ax-card">
        <div
          className="ax-card__header"
          style={{
            padding: '14px 20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 12,
            borderBottom: '1px solid var(--ax-border, #e2e8f0)',
          }}
        >
          <div>
            <h3 className="ax-card__title" style={{ margin: 0, fontSize: 16 }}>
              {activeMeta.label}
            </h3>
            <p className="ax-card__subtitle" style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--ax-text-muted)' }}>
              Showing {num(filteredSites.length)} installations for status category &ldquo;{activeMeta.label}&rdquo;
            </p>
          </div>

          <div className="ax-card__actions" style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <SearchInput
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search site, district, inverter..."
              size="sm"
            />
            <TableExportToolbar
              onCopy={() => copyTableDataToClipboard(filteredSites, exportCols)}
              onExportCSV={() => exportDataToCSV(filteredSites, exportCols, `UP_Resco_${currentStatus}_${new Date().toISOString().slice(0, 10)}`)}
              onExportExcel={() => exportDataToExcel(filteredSites, exportCols, `UP_Resco_${currentStatus}_${new Date().toISOString().slice(0, 10)}`)}
              onExportPDF={() => printTableData(filteredSites, exportCols, `UP Resco - ${activeMeta.label}`)}
            />
          </div>
        </div>

        <div className="ax-table-wrap" style={{ overflowX: 'auto' }}>
          <table className="ax-table ax-table--hover" style={{ minWidth: 960 }}>
            <thead className="ax-table__head">
              <tr>
                <th className="ax-table__th" style={{ width: 60 }} scope="col">Sr. No.</th>
                <th className="ax-table__th" style={{ width: 90 }} scope="col">Site ID</th>
                <th className="ax-table__th" scope="col">Site Name</th>
                <th className="ax-table__th" scope="col">District</th>
                <th className="ax-table__th" scope="col">Contact</th>
                <th className="ax-table__th" scope="col">Equipment Serials</th>
                <th className="ax-table__th" scope="col">Install Status</th>
                <th className="ax-table__th" scope="col">Physical Verify</th>
                <th className="ax-table__th" scope="col">Document</th>
                <th className="ax-table__th" scope="col" style={{ textAlign: 'center', width: 120 }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={10} style={{ textAlign: 'center', padding: 36, color: 'var(--ax-text-muted)' }}>
                    <span className="ax-spinner" style={{ marginRight: 8 }} /> Loading status records from server…
                  </td>
                </tr>
              ) : filteredSites.length === 0 ? (
                <tr>
                  <td colSpan={10} style={{ padding: 0 }}>
                    <TableEmptyState
                      title={`No records for ${activeMeta.label}`}
                      message={
                        searchQuery
                          ? 'No sites match your search query. Try clearing the search box.'
                          : `There are currently 0 installations marked as "${activeMeta.label}"${selectedDistrict ? ` in ${selectedDistrict}` : ''}.`
                      }
                    />
                  </td>
                </tr>
              ) : (
                p.paged.map((site: any, idx: number) => {
                  const srNo = (p.curPage - 1) * p.pageSize + idx + 1;
                  const siteName = pickStr(site, 'site_name', 'name') || DASH;
                  const district = pickStr(site, 'district') || DASH;
                  const contactPerson = pickStr(site, 'contact_person', 'nodal_person');
                  const contactPhone = pickStr(site, 'contact_number', 'mobile');
                  const inverterNo = pickStr(site, 'inverter_no');
                  const meterNo = pickStr(site, 'solar_meter_no', 'solarmeter_no');
                  const instDate = pickStr(site, 'installation_date', 'inst_date');
                  const isInstalled = Boolean(instDate || inverterNo || Number(site.inst_status) === 1);

                  const verifyStatus = pickNum(site, 'verify_status', 'inst_verify_status');
                  const docStatus = pickNum(site, 'document_status', 'inst_doc_status');

                  return (
                    <tr key={site.id ?? idx} className="ax-table__row">
                      <td className="ax-table__td" style={{ color: 'var(--ax-text-muted)', fontWeight: 600 }}>
                        {srNo}
                      </td>
                      <td className="ax-table__td" style={{ fontFamily: 'monospace', fontWeight: 600 }}>
                        #{site.id}
                      </td>
                      <td className="ax-table__td" style={{ fontWeight: 600, color: 'var(--ax-text-strong)' }}>
                        <div style={{ maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {siteName}
                        </div>
                        {pickStr(site, 'ca_no') && (
                          <div style={{ fontSize: 11, color: 'var(--ax-text-muted)', fontWeight: 400 }}>
                            CA: {pickStr(site, 'ca_no')}
                          </div>
                        )}
                      </td>
                      <td className="ax-table__td">
                        <span className="ax-badge ax-badge--soft ax-badge--neutral" style={{ fontWeight: 600 }}>
                          {district}
                        </span>
                      </td>
                      <td className="ax-table__td">
                        <div style={{ fontSize: 12, fontWeight: 500 }}>{contactPerson || DASH}</div>
                        {contactPhone && (
                          <div style={{ fontSize: 11, color: 'var(--ax-text-muted)' }}>{contactPhone}</div>
                        )}
                      </td>
                      <td className="ax-table__td" style={{ fontSize: 12 }}>
                        <div>
                          <span style={{ color: 'var(--ax-text-muted)' }}>Inv:</span>{' '}
                          <code style={{ fontSize: 11 }}>{inverterNo || DASH}</code>
                        </div>
                        <div>
                          <span style={{ color: 'var(--ax-text-muted)' }}>Mtr:</span>{' '}
                          <code style={{ fontSize: 11 }}>{meterNo || DASH}</code>
                        </div>
                      </td>
                      <td className="ax-table__td">
                        {isInstalled ? (
                          <div>
                            <span className="ax-badge ax-badge--soft ax-badge--success" style={{ fontWeight: 600 }}>
                              Installed
                            </span>
                            {instDate && (
                              <div style={{ fontSize: 11, color: 'var(--ax-text-muted)', marginTop: 2 }}>
                                {instDate}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="ax-badge ax-badge--soft ax-badge--warning" style={{ fontWeight: 600 }}>
                            Pending
                          </span>
                        )}
                      </td>
                      <td className="ax-table__td">
                        {verifyStatus === 1 ? (
                          <span className="ax-badge ax-badge--soft ax-badge--success">Approved</span>
                        ) : verifyStatus === 2 ? (
                          <span className="ax-badge ax-badge--soft ax-badge--danger">Rejected</span>
                        ) : (
                          <span className="ax-badge ax-badge--soft ax-badge--warning">Pending</span>
                        )}
                      </td>
                      <td className="ax-table__td">
                        {docStatus === 1 ? (
                          <span className="ax-badge ax-badge--soft ax-badge--success">Approved</span>
                        ) : docStatus === 2 ? (
                          <span className="ax-badge ax-badge--soft ax-badge--danger">Rejected</span>
                        ) : (
                          <span className="ax-badge ax-badge--soft ax-badge--neutral">Pending</span>
                        )}
                      </td>
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        <button
                          type="button"
                          className="ax-btn ax-btn--secondary ax-btn--sm"
                          style={{ height: 26, padding: '0 8px', fontSize: 11 }}
                          onClick={() => setDetailSite(site)}
                        >
                          View Detail
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer with Pagination */}
        <div
          className="ax-card__footer"
          style={{
            borderTop: '1px solid var(--ax-border, #e2e8f0)',
            padding: '12px 18px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          <div style={{ fontSize: 12, color: 'var(--ax-text-muted)' }}>
            Showing{' '}
            <b>
              {filteredSites.length === 0 ? 0 : (p.curPage - 1) * p.pageSize + 1}
            </b>{' '}
            to <b>{Math.min(p.curPage * p.pageSize, filteredSites.length)}</b> of{' '}
            <b>{num(filteredSites.length)}</b> records
          </div>

          <Pagination
            currentPage={p.curPage}
            totalItems={filteredSites.length}
            pageSize={p.pageSize}
            onPageChange={p.setPage}
            onPageSizeChange={p.setPageSize}
            pageSizeOptions={[10, 25, 50, 100]}
          />
        </div>
      </div>

      {/* Lightbox Modal */}
      {previewImage && (
        <ImagePreviewModal
          url={previewImage.url}
          title={previewImage.title}
          onClose={() => setPreviewImage(null)}
        />
      )}

      {/* Detail Modal */}
      {detailSite && (
        <SiteDetailModal
          site={detailSite}
          onClose={() => setDetailSite(null)}
          onPreview={(url, title) => setPreviewImage({ url, title })}
        />
      )}
    </div>
  );
}

export default UP_Installation_Resco_StatusView;
