import {
  useState,
  useMemo,
  useEffect,
  useCallback,
  useRef,
  type CSSProperties,
  type FormEvent,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { PageHead } from '../../../../shell/PageHead';
import { useFocusTrap } from '../../../../../hooks/useFocusTrap';
import {
  upInstallationService,
  getUpMediaCandidates,
  resolveUpMediaUrl,
  type UpKusumCInstalledSiteItem,
  type UpKusumCInstalledCounts,
  type UpKusumCClaimPaymentItem,
} from '../../up-services';
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
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

type Tone = 'success' | 'warning' | 'danger' | 'neutral' | 'info';

const Badge = ({ tone, children }: { tone: Tone; children: ReactNode }) => (
  <span className={`ax-badge ax-badge--soft ax-badge--${tone}`}>{children}</span>
);

const VerifyBadge = ({ value, raw }: { value: number; raw?: any }) => {
  const r = String(raw ?? '').toLowerCase().trim();
  if (value === 1 || r === '1' || r === 'approved') return <Badge tone="success">Approved</Badge>;
  if (value === 2 || r === '2' || r === 'rejected' || r === 'reject') return <Badge tone="danger">Rejected</Badge>;
  return <Badge tone="warning">Pending</Badge>;
};

const DocBadge = ({ status }: { status?: number; docUrl?: string | null }) => {
  const s = Number(status ?? 0);
  if (s === 2) return <Badge tone="success">Approved</Badge>;
  if (s === 3) return <Badge tone="danger">Reject</Badge>;
  if (s === 1) return <Badge tone="info">Submitted</Badge>;
  return <Badge tone="warning">Pending</Badge>;
};

/* ── Comprehensive Claim Status Resolution (0: Not Applicable, 1: Claim Applicable, 2: Approved, 3: Reject) ── */
type ClaimStatusKey =
  | 'not_applicable'
  | 'Raised'
  | 'approved'
  | 'rejected'
  | 'paid'
  | 'partially_paid';

interface SiteClaimInfo {
  key: ClaimStatusKey;
  label: string;
  tone: Tone;
  amount?: string | number | null;
  claimId?: number;
  remarks?: string | null;
}

const getVerifyVal = (row: UpKusumCInstalledSiteItem): number => {
  const raw = row.inst_verify_status ?? row.verify_status ?? 0;
  const str = String(raw).toLowerCase().trim();
  if (str === 'approved' || Number(raw) === 1) return 1;
  if (str === 'rejected' || str === 'reject' || Number(raw) === 2) return 2;
  return 0;
};

const getRawDoc = (row: UpKusumCInstalledSiteItem): string | null => {
  const raw =
    row.inst_doc ||
    row.hoc_photo ||
    row.doc_hoc_photo ||
    (row as any).doc_file ||
    (row as any).document ||
    null;
  if (!raw || String(raw).trim() === '' || raw === DASH) return null;
  return String(raw).trim();
};

function parseClaimSiteIds(raw: unknown): number[] {
  if (Array.isArray(raw)) {
    return raw.map((x) => Number(x)).filter((n) => !Number.isNaN(n) && n > 0);
  }
  if (typeof raw === 'number' && !Number.isNaN(raw)) return [raw];
  if (typeof raw === 'string') {
    const s = raw.trim();
    if (!s) return [];
    if (s.startsWith('[')) {
      try {
        const parsed = JSON.parse(s);
        if (Array.isArray(parsed)) {
          return parsed.map((x) => Number(x)).filter((n) => !Number.isNaN(n) && n > 0);
        }
      } catch {
        // fallback below
      }
    }
    return s
      .replace(/^\[|\]$/g, '')
      .split(',')
      .map((p) => Number(p.replace(/["']/g, '').trim()))
      .filter((n) => !Number.isNaN(n) && n > 0);
  }
  return [];
}

function resolveSiteClaimInfo(
  row: UpKusumCInstalledSiteItem,
  claimedSiteMap?: Map<number, UpKusumCClaimPaymentItem>,
  _claimableSiteIds?: Set<number>
): SiteClaimInfo {
  const siteId = Number(row.id);
  const claimRec = claimedSiteMap?.get(siteId);
  const payStatus = Number(row.inst_pay_status ?? row.payment_status ?? row.pay_status ?? 0);
  const rawClaimStatus = Number(row.inst_claim_status ?? row.claim_status ?? 0);
  const amount = (row as any).inst_claim_amount ?? claimRec?.amount ?? null;
  const claimId = claimRec?.id;
  const remarks = claimRec?.remarks || null;

  // 1. Payment settlement states (highest priority)
  if (payStatus === 1) {
    return { key: 'paid', label: 'Paid', tone: 'success',  claimId, remarks };
  }
  if (payStatus === 2) {
    return { key: 'partially_paid', label: 'Partially Paid', tone: 'warning',  remarks };
  }

  // 2. Claim verification states (from linked claim record)
  if (claimRec) {
    const cs = Number(claimRec.claim_status ?? 0);
    if (cs === 2) {
      return { key: 'approved', label: 'Approved', tone: 'success', amount, claimId, remarks };
    }
    if (cs === 3) {
      return { key: 'rejected', label: 'Reject', tone: 'danger', amount, claimId, remarks };
    }
    if (cs === 1) {
      return { key: 'Raised', label: 'Raised', tone: 'info', amount, claimId, remarks };
    }
  }

  if (rawClaimStatus === 1) {
    return { key: 'Raised', label: 'Raised', tone: 'info', amount };
  }
  if (rawClaimStatus === 2) {
    return { key: 'approved', label: 'Approved', tone: 'success', amount };
  }
  if (rawClaimStatus === 3) {
    return { key: 'rejected', label: 'Reject', tone: 'danger', amount };
  }
  return { key: 'not_applicable', label: 'Not Applicable', tone: 'neutral', amount };
}

const ClaimStatusBadge = ({ info }: { info: SiteClaimInfo }) => (
  <div style={{ display: 'inline-flex', flexDirection: 'column', gap: 2, alignItems: 'flex-start' }}>
    <Badge tone={info.tone}>{info.label}</Badge>
    {(info.claimId || info.amount) && (
      <span
        style={{
          fontSize: 10.5,
          color: 'var(--ax-text-muted, #64748b)',
          fontFamily: 'var(--ax-font-mono)',
        }}
        title={info.remarks || undefined}
      >
        {info.claimId ? `#${info.claimId}` : ''}
        {info.claimId && info.amount ? ' · ' : ''}
        {info.amount ? `₹${Number(info.amount).toLocaleString('en-IN')}` : ''}
      </span>
    )}
  </div>
);

/* ───────── Field Helpers ───────── */
const getStateName = (row: UpKusumCInstalledSiteItem): string =>
  (row.state || row.f_state || 'UP').trim();

const getDistrict = (row: UpKusumCInstalledSiteItem): string =>
  (row.f_district || row.district || '').trim();

const getBlockVillage = (row: UpKusumCInstalledSiteItem): string => {
  const blk = (row.f_block || row.block || row.f_tehsil || '').trim();
  const vil = (row.f_village || row.village || '').trim();
  if (blk && vil) return `${blk}, ${vil}`;
  return blk || vil || '';
};

const getFarmerName = (row: UpKusumCInstalledSiteItem): string =>
  (row.f_farmer_name || row.farmer_name || row.applicant_name || row.beneficiary_name || '').trim();

const getFatherName = (row: UpKusumCInstalledSiteItem): string =>
  (row.f_father_name || row.father_name || '').trim();

const getContact = (row: UpKusumCInstalledSiteItem): string =>
  (row.f_contact || row.contact_no || '').trim();

export const parseModuleSerials = (val: any): string[] => {
  if (val === null || val === undefined) return [];

  // If array
  if (Array.isArray(val)) {
    return val
      .flatMap((item) => parseModuleSerials(item))
      .filter((s) => s && s !== DASH && s !== 'null' && s !== 'undefined');
  }

  // If object
  if (typeof val === 'object') {
    return Object.values(val)
      .flatMap((item) => parseModuleSerials(item))
      .filter((s) => s && s !== DASH && s !== 'null' && s !== 'undefined');
  }

  let str = String(val).trim();
  if (!str || str === '[]' || str === '[""]' || str === "['']" || str === DASH) return [];

  // Attempt JSON parse
  if (
    (str.startsWith('[') && str.endsWith(']')) ||
    (str.startsWith('{') && str.endsWith('}')) ||
    (str.startsWith('"') && str.endsWith('"'))
  ) {
    try {
      const parsed = JSON.parse(str);
      if (Array.isArray(parsed) || typeof parsed === 'object') {
        const res = parseModuleSerials(parsed);
        if (res.length > 0) return res;
      } else if (typeof parsed === 'string' && parsed !== str) {
        const res = parseModuleSerials(parsed);
        if (res.length > 0) return res;
      }
    } catch {
      // continue below
    }
  }

  // Check PHP serialized: a:2:{i:0;s:5:"MOD01";i:1;s:5:"MOD02";}
  if (/^a:\d+:{/.test(str)) {
    const matches = str.match(/s:\d+:"([^"]+)";/g);
    if (matches) {
      return matches
        .map((m) => m.replace(/^s:\d+:"([^"]+)";$/, '$1').trim())
        .filter(Boolean);
    }
  }

  // Strip wrapping brackets or quotes
  str = str.replace(/^[\[{\("']+|[\]}\)"']+$/g, '');

  // Split by common delimiters
  const tokens = str.split(/[,;\n\r|\t]+|\s{2,}/);
  const result: string[] = [];
  for (const t of tokens) {
    const clean = t.replace(/[\[\]"']/g, '').trim();
    if (
      clean &&
      clean !== DASH &&
      clean.toLowerCase() !== 'null' &&
      clean.toLowerCase() !== 'undefined' &&
      clean.toLowerCase() !== 'n/a' &&
      clean.toLowerCase() !== 'na'
    ) {
      result.push(clean);
    }
  }
  return result;
};

export const getRowModuleSerials = (row: any): string[] => {
  if (!row || typeof row !== 'object') return [];
  const candidates = [
    row.module_serial_no,
    row.module_serials,
    row.module_no,
    row.modules,
    row.module_serial,
    row.module_numbers,
    row.mod_serial_no,
    row.modules_serial_no,
    row.solar_module_no,
    row.panel_no,
    row.serials,
  ];

  for (const c of candidates) {
    if (c !== undefined && c !== null) {
      const parsed = parseModuleSerials(c);
      if (parsed.length > 0) return parsed;
    }
  }
  return [];
};

const fmtSerials = (val?: any): string => {
  if (!val) return DASH;
  if (typeof val === 'object' && ('id' in val || 'applicant_name' in val || 'f_farmer_name' in val)) {
    const list = getRowModuleSerials(val);
    return list.length > 0 ? list.join(', ') : DASH;
  }
  const list = parseModuleSerials(val);
  return list.length > 0 ? list.join(', ') : DASH;
};

/* ───────── Solar Module Serials Modal (Displays all module serial numbers) ───────── */
interface ModuleSerialsModalProps {
  serials: string[];
  siteTitle?: string;
  farmerName?: string;
  siteId?: number | string;
  pumpCapacity?: string;
  district?: string;
  onClose: () => void;
}

function ModuleSerialsModal({
  serials,
  siteTitle,
  farmerName,
  siteId,
  pumpCapacity,
  district,
  onClose,
}: ModuleSerialsModalProps) {
  const [copiedAll, setCopiedAll] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [search, setSearch] = useState('');

  const filteredSerials = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return serials;
    return serials.filter((s) => s.toLowerCase().includes(q));
  }, [serials, search]);

  const handleCopyAll = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    navigator.clipboard?.writeText(serials.join(', '));
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  };

  const handleCopySingle = (sn: string, idx: number, e?: React.MouseEvent) => {
    e?.stopPropagation();
    navigator.clipboard?.writeText(sn);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 1500);
  };

  return (
    <Modal
      open
      onClose={onClose}
      labelledBy="kusumc-module-serials-title"
      dialogClass="ax-modal__dialog--md"
      dialogStyle={{ maxWidth: 640 }}
    >
      <div
        className="ax-modal__header"
        style={{
          padding: '16px 20px',
          borderBottom: '1px solid var(--ax-border, #e2e8f0)',
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ flex: 1, minWidth: 0, paddingRight: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <h3
              id="kusumc-module-serials-title"
              style={{
                margin: 0,
                fontSize: 17,
                fontWeight: 700,
                color: 'var(--ax-text-strong, #0f172a)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <span>Solar Module Serials</span>
            </h3>
            <span
              className="ax-badge ax-badge--soft ax-badge--primary"
              style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 9999 }}
            >
              {serials.length} {serials.length === 1 ? 'Module' : 'Modules'}
            </span>
          </div>

          <div
            style={{
              marginTop: 4,
              fontSize: 12,
              color: 'var(--ax-text-muted, #64748b)',
              display: 'flex',
              flexWrap: 'wrap',
              gap: '6px 12px',
              alignItems: 'center',
            }}
          >
            {farmerName && (
              <span>
                Farmer: <b style={{ color: 'var(--ax-text-strong, #1e293b)' }}>{farmerName}</b>
              </span>
            )}
            {siteId !== undefined && siteId !== null && siteId !== '' && (
              <span>
                Site ID: <b style={{ color: 'var(--ax-text-strong, #1e293b)' }}>#{siteId}</b>
              </span>
            )}
            {district && district !== DASH && <span>District: <b>{district}</b></span>}
            {pumpCapacity && pumpCapacity !== DASH && <span>Capacity: <b>{pumpCapacity}</b></span>}
            {!farmerName && !siteId && siteTitle && <span>{siteTitle}</span>}
          </div>
        </div>

        <button
          type="button"
          className="ax-modal__close"
          onClick={onClose}
          aria-label="Close dialog"
          style={{
            background: 'transparent',
            border: 'none',
            fontSize: 20,
            cursor: 'pointer',
            color: '#64748b',
            padding: 4,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 6,
          }}
        >
          ✕
        </button>
      </div>

      <div className="ax-modal__body" style={{ padding: '16px 20px', maxHeight: '60vh', overflowY: 'auto' }}>
        {serials.length > 4 && (
          <div style={{ marginBottom: 12 }}>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                placeholder="Search module serial number…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="ax-input"
                style={{
                  width: '100%',
                  padding: '8px 12px 8px 32px',
                  fontSize: 13,
                  borderRadius: 6,
                  border: '1px solid var(--ax-border, #cbd5e1)',
                  background: '#ffffff',
                }}
              />
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{
                  position: 'absolute',
                  left: 10,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: 14,
                  height: 14,
                  color: '#94a3b8',
                }}
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  style={{
                    position: 'absolute',
                    right: 8,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#94a3b8',
                    fontSize: 14,
                    padding: 2,
                  }}
                  title="Clear search"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        )}

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
            gap: 8,
          }}
        >
          {filteredSerials.map((sn, idx) => (
            <div
              key={`${sn}-${idx}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 10px',
                borderRadius: 6,
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                transition: 'all 0.15s ease',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0, flex: 1 }}>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    color: '#64748b',
                    background: '#e2e8f0',
                    borderRadius: 4,
                    padding: '2px 5px',
                    fontFamily: 'monospace',
                    flexShrink: 0,
                  }}
                >
                  #{idx + 1}
                </span>
                <span
                  style={{
                    fontFamily: 'var(--ax-font-mono, monospace)',
                    fontSize: 12,
                    fontWeight: 600,
                    color: '#0f172a',
                    wordBreak: 'break-all',
                    letterSpacing: '0.02em',
                  }}
                >
                  {sn}
                </span>
              </div>
              <button
                type="button"
                onClick={(e) => handleCopySingle(sn, idx, e)}
                style={{
                  background: copiedIdx === idx ? '#dcfce7' : '#ffffff',
                  border: `1px solid ${copiedIdx === idx ? '#86efac' : '#cbd5e1'}`,
                  color: copiedIdx === idx ? '#15803d' : '#475569',
                  cursor: 'pointer',
                  fontSize: 11,
                  fontWeight: 600,
                  padding: '3px 7px',
                  borderRadius: 4,
                  marginLeft: 8,
                  flexShrink: 0,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 3,
                }}
                title="Copy serial number"
              >
                {copiedIdx === idx ? '✓ Copied' : 'Copy'}
              </button>
            </div>
          ))}
          {filteredSerials.length === 0 && (
            <div
              style={{
                gridColumn: '1 / -1',
                padding: '24px 16px',
                textAlign: 'center',
                color: '#64748b',
                background: '#f8fafc',
                borderRadius: 8,
                border: '1px dashed #cbd5e1',
                fontSize: 13,
              }}
            >
              No module serials match "<b>{search}</b>"
            </div>
          )}
        </div>
      </div>

      <div
        className="ax-modal__footer"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '12px 20px',
          borderTop: '1px solid var(--ax-border, #e2e8f0)',
          background: '#f8fafc',
          borderBottomLeftRadius: 'inherit',
          borderBottomRightRadius: 'inherit',
        }}
      >
        <button
          type="button"
          onClick={handleCopyAll}
          className="ax-btn ax-btn--secondary ax-btn--sm"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
        >
          {copiedAll ? (
            <span style={{ color: '#16a34a', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              ✓ Copied All ({serials.length})
            </span>
          ) : (
            <>
              <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
              </svg>
              <span>Copy All ({serials.length})</span>
            </>
          )}
        </button>

        <button type="button" onClick={onClose} className="ax-btn ax-btn--primary ax-btn--sm">
          Close
        </button>
      </div>
    </Modal>
  );
}

function ModuleSerialsCell({
  serials,
  siteTitle,
  farmerName,
  siteId,
  pumpCapacity,
  district,
}: {
  serials: string[];
  siteTitle?: string;
  farmerName?: string;
  siteId?: number | string;
  pumpCapacity?: string;
  district?: string;
}) {
  const [copied, setCopied] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  if (!serials || serials.length === 0) {
    return <span style={{ color: 'var(--ax-text-subtle, #94a3b8)' }}>{DASH}</span>;
  }

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard?.writeText(serials.join(', '));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const maxInitial = 2;
  const hasMore = serials.length > maxInitial;
  const visible = serials.slice(0, maxInitial);

  return (
    <>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          gap: 4,
          minWidth: 140,
          maxWidth: 260,
        }}
        title={serials.join(', ')}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, alignItems: 'center' }}>
          {visible.map((sn, idx) => (
            <span
              key={`${sn}-${idx}`}
              onClick={() => setModalOpen(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                padding: '2px 6px',
                borderRadius: 4,
                background: '#f1f5f9',
                border: '1px solid #cbd5e1',
                fontFamily: 'var(--ax-font-mono, monospace)',
                fontSize: 11,
                fontWeight: 600,
                color: '#0f172a',
                lineHeight: 1.3,
                wordBreak: 'break-all',
                cursor: 'pointer',
              }}
              title="Click to view all module serials"
            >
              {sn}
            </span>
          ))}
        </div>

        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 11, marginTop: 1 }}>
          {hasMore && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setModalOpen(true);
              }}
              style={{
                background: 'transparent',
                border: 'none',
                padding: 0,
                color: 'var(--asw-primary, #2563eb)',
                fontWeight: 600,
                fontSize: 11,
                cursor: 'pointer',
                textDecoration: 'underline',
              }}
              title="Click to view all module serials in modal"
            >
              +{serials.length - maxInitial} more
            </button>
          )}
          <button
            type="button"
            onClick={handleCopy}
            style={{
              background: 'transparent',
              border: 'none',
              padding: 0,
              color: copied ? '#16a34a' : 'var(--ax-text-muted, #64748b)',
              fontSize: 11,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 2,
            }}
            title="Copy module serial numbers"
          >
            {copied ? '✓ Copied' : 'Copy'}
          </button>
          {!hasMore && serials.length > 0 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setModalOpen(true);
              }}
              style={{
                background: 'transparent',
                border: 'none',
                padding: 0,
                color: 'var(--ax-text-muted, #64748b)',
                fontSize: 11,
                cursor: 'pointer',
                textDecoration: 'underline',
              }}
              title="View all serial details in modal"
            >
              View
            </button>
          )}
        </div>
      </div>

      {modalOpen && (
        <ModuleSerialsModal
          serials={serials}
          siteTitle={siteTitle}
          farmerName={farmerName}
          siteId={siteId}
          pumpCapacity={pumpCapacity}
          district={district}
          onClose={() => setModalOpen(false)}
        />
      )}
    </>
  );
}

/* ───────── Modal (Exact Assam SWP Design System Dialog) ───────── */
const X_ICON = (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.75}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M18 6l-12 12" />
    <path d="M6 6l12 12" />
  </svg>
);

function Modal({
  open,
  onClose,
  labelledBy,
  describedBy,
  role = 'dialog',
  centered = true,
  dialogClass = '',
  dialogStyle,
  modalStyle,
  closeOnBackdrop = true,
  children,
}: {
  open: boolean;
  onClose: () => void;
  labelledBy: string;
  describedBy?: string;
  role?: 'dialog' | 'alertdialog';
  centered?: boolean;
  dialogClass?: string;
  dialogStyle?: CSSProperties;
  modalStyle?: CSSProperties;
  closeOnBackdrop?: boolean;
  children: ReactNode;
}) {
  const dialogRef = useRef<HTMLDivElement>(null);
  useFocusTrap(dialogRef, open);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;
  return createPortal(
    <div
      className={`ax-modal${centered ? ' ax-modal--centered' : ''}`}
      role={role}
      aria-modal="true"
      aria-labelledby={labelledBy}
      aria-describedby={describedBy}
      style={modalStyle}
    >
      <div className="ax-modal__backdrop" onClick={() => closeOnBackdrop && onClose()} />
      <div
        ref={dialogRef}
        className={`ax-modal__dialog${dialogClass ? ' ' + dialogClass : ''}`}
        style={dialogStyle}
      >
        {children}
      </div>
    </div>,
    document.body
  );
}

/* ───────── Image Preview Modal (Interactive Zoom) ───────── */
const ZOOM_STEPS = [1, 1.5, 2, 3];

function ImagePreviewModal({ url, title, onClose }: { url: string; title: string; onClose: () => void }) {
  const [zoomIdx, setZoomIdx] = useState(0);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const zoom = ZOOM_STEPS[zoomIdx];

  useEffect(() => {
    setZoomIdx(0);
    setStatus('loading');
  }, [url]);

  return (
    <Modal open onClose={onClose} labelledBy="kusumc-preview-title" dialogClass="ax-modal__dialog--lg">
      <div className="ax-modal__header">
        <h2 className="ax-modal__title" id="kusumc-preview-title">
          {title || 'Media Preview'}
        </h2>
        <button type="button" className="ax-modal__close" onClick={onClose} aria-label="Close dialog">
          {X_ICON}
        </button>
      </div>

      <div className="ax-modal__body" style={{ padding: 0 }}>
        <div className="ula-m-stage">
          {status === 'loading' && (
            <div className="ula-m-stage__msg">
              <span className="ax-spinner" /> Loading image…
            </div>
          )}
          {status === 'error' && (
            <div className="ula-m-stage__msg">Image could not be loaded. Try opening it in a new tab.</div>
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

      <div className="ax-modal__footer" style={{ justifyContent: 'space-between' }}>
        <div className="ula-m-zoom" role="group" aria-label="Zoom">
          <button
            type="button"
            className="ax-btn ax-btn--secondary"
            onClick={() => setZoomIdx((i) => Math.max(0, i - 1))}
            disabled={zoomIdx === 0}
            aria-label="Zoom out"
          >
            −
          </button>
          <span className="ula-m-zoom__val">{Math.round(zoom * 100)}%</span>
          <button
            type="button"
            className="ax-btn ax-btn--secondary"
            onClick={() => setZoomIdx((i) => Math.min(ZOOM_STEPS.length - 1, i + 1))}
            disabled={zoomIdx === ZOOM_STEPS.length - 1}
            aria-label="Zoom in"
          >
            +
          </button>
        </div>
        <div className="ula-m-zoom">
          <a href={url} target="_blank" rel="noreferrer" className="ax-btn ax-btn--ghost">
            Open in new tab ↗
          </a>
          <button type="button" className="ax-btn ax-btn--primary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
}

/* ── Modern Image Placeholder & Interactive Thumbnail ── */
function ImagePlaceholder({
  size = 36,
  label = 'No photograph uploaded',
}: {
  size?: number;
  label?: string;
}) {
  return (
    <div
      className="ax-img-placeholder"
      style={{
        width: size,
        height: size,
        borderRadius: 6,
        border: '1px dashed var(--ax-border, #cbd5e1)',
        background: 'var(--ax-surface-subtle, #f8fafc)',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--ax-text-muted, #94a3b8)',
        flexShrink: 0,
        cursor: 'default',
        userSelect: 'none',
        margin: '0 auto',
        boxSizing: 'border-box',
        transition: 'all 0.18s ease',
      }}
      title={label}
      aria-label={label}
    >
      <svg
        viewBox="0 0 24 24"
        width={Math.max(14, Math.round(size * 0.48))}
        height={Math.max(14, Math.round(size * 0.48))}
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        style={{ opacity: 0.7 }}
      >
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
        <circle cx="8.5" cy="8.5" r="1.5" />
        <polyline points="21 15 16 10 5 21" />
      </svg>
    </div>
  );
}

/* ── Interactive Image Thumbnail (Modern Polished with Fallback Placeholder) ── */
function InstallationThumbnail({
  src,
  alt,
  onPreview,
  size = 36,
}: {
  src?: string | null;
  alt: string;
  onPreview: (url: string, title: string) => void;
  size?: number;
}) {
  const candidates = useMemo(() => (src ? getUpMediaCandidates(src) : []), [src]);
  const [candidateIdx, setCandidateIdx] = useState(0);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setCandidateIdx(0);
    setFailed(false);
  }, [src]);

  if (!src || failed || candidateIdx >= candidates.length) {
    return <ImagePlaceholder size={size} label={`No image — ${alt}`} />;
  }

  const currentUrl = candidates[candidateIdx];

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: size,
        height: size,
        flexShrink: 0,
        margin: '0 auto',
      }}
    >
      <img
        src={currentUrl}
        alt={alt}
        style={{
          width: size,
          height: size,
          borderRadius: 6,
          objectFit: 'cover',
          cursor: 'zoom-in',
          border: '1px solid var(--ax-border, #cbd5e1)',
          background: 'var(--ax-surface-subtle, #f8fafc)',
          display: 'block',
          flexShrink: 0,
          boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
          transition: 'transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.08)';
          e.currentTarget.style.boxShadow = '0 4px 10px rgba(0, 0, 0, 0.14)';
          e.currentTarget.style.borderColor = 'var(--ax-primary-default, #2563eb)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.style.boxShadow = '0 1px 2px rgba(0, 0, 0, 0.05)';
          e.currentTarget.style.borderColor = 'var(--ax-border, #cbd5e1)';
        }}
        onError={() => {
          if (candidateIdx + 1 < candidates.length) {
            setCandidateIdx((prev) => prev + 1);
          } else {
            setFailed(true);
          }
        }}
        onClick={() => onPreview(currentUrl, alt)}
        title="Click to preview photograph"
      />
    </div>
  );
}

/* ── Action Dropdown (Portal to <body> so the table never clips it — Exact Assam SWP Pattern) ── */
const MENU_W = 170;

function RowActionDropdown({
  canEdit,
  canSubmitDoc,
  onEdit,
  onSubmitDoc,
}: {
  canEdit: boolean;
  canSubmitDoc: boolean;
  onEdit: () => void;
  onSubmitDoc: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const itemCount = (canEdit ? 1 : 0) + (canSubmitDoc ? 1 : 0);
  const menuH = Math.max(42, itemCount * 36 + 8);

  const toggle = () => {
    if (open) {
      setOpen(false);
      return;
    }
    const b = btnRef.current;
    if (!b) return;
    const r = b.getBoundingClientRect();
    const spaceBelow = window.innerHeight - r.bottom;
    const top = spaceBelow < menuH + 8 && r.top > menuH + 8 ? r.top - menuH - 4 : r.bottom + 4;
    const left = Math.max(8, Math.min(r.right - MENU_W, window.innerWidth - MENU_W - 8));
    setPos({ top, left });
    setOpen(true);
  };

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (btnRef.current?.contains(t) || menuRef.current?.contains(t)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    const close = () => setOpen(false);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    window.addEventListener('scroll', close, true);
    window.addEventListener('resize', close);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('scroll', close, true);
      window.removeEventListener('resize', close);
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        ref={btnRef}
        className="ax-btn ax-btn--secondary ax-btn--sm ula-action-btn"
        onClick={toggle}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <span>Action</span>
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            width: 12,
            height: 12,
            transform: open ? 'rotate(180deg)' : 'none',
            transition: 'transform 0.15s ease',
          }}
          aria-hidden="true"
        >
          <path d="M6 9l6 6l6 -6" />
        </svg>
      </button>

      {open &&
        pos &&
        createPortal(
          <div
            ref={menuRef}
            className="ula-menu"
            role="menu"
            style={{ top: pos.top, left: pos.left, width: MENU_W }}
          >
            {canEdit && (
              <button
                type="button"
                className="ula-menu__item"
                role="menuitem"
                onClick={() => {
                  setOpen(false);
                  onEdit();
                }}
              >
                Edit Details
              </button>
            )}
            {canSubmitDoc && (
              <button
                type="button"
                className="ula-menu__item"
                role="menuitem"
                onClick={() => {
                  setOpen(false);
                  onSubmitDoc();
                }}
              >
                Submit Document
              </button>
            )}
          </div>,
          document.body
        )}
    </>
  );
}

/* ───────── Overlay CSS (Exact Assam SWP Design System) ───────── */
const OVERLAY_CSS = `
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
  .ax-modal__dialog--md { max-width: 580px; }
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
  .ax-modal__body {
    padding: 24px; overflow-y: auto; max-height: calc(85vh - 120px);
  }
  .ax-modal__footer {
    padding: 16px 24px;
    border-top: 1px solid var(--ax-border, #e2e8f0);
    background: var(--ax-surface-subtle, #f8fafc);
    display: flex; align-items: center; justify-content: flex-end; gap: 10px;
  }

  .ax-modern-field {
    display: flex; flex-direction: column; gap: 6px;
  }
  .ax-modern-label {
    display: flex; align-items: center; justify-content: space-between;
    font-size: 12px; font-weight: 600; color: var(--ax-text-strong, #1e293b);
    letter-spacing: 0.02em; margin: 0;
  }
  .ax-modern-req {
    color: #ef4444; font-weight: 700; margin-left: 3px;
  }
  .ax-modern-dropzone {
    border: 1.5px dashed var(--ax-border, #cbd5e1);
    border-radius: 10px; padding: 18px 16px;
    background: var(--ax-surface-subtle, #f8fafc);
    text-align: center; cursor: pointer; transition: all 0.2s ease;
    display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px;
  }
  .ax-modern-dropzone:hover {
    border-color: var(--ax-accent, #2563eb);
    background: color-mix(in srgb, var(--ax-accent, #2563eb) 5%, var(--ax-surface-subtle, #f8fafc));
  }
  .ax-modern-dropzone__icon {
    width: 42px; height: 42px; border-radius: 50%;
    background: color-mix(in srgb, var(--ax-accent, #2563eb) 10%, #ffffff);
    display: flex; align-items: center; justify-content: center;
  }
  .ax-modern-file-chip {
    display: flex; align-items: center; justify-content: space-between;
    padding: 10px 14px; background: #f0fdf4; border: 1.5px solid #86efac; border-radius: 9px;
  }
  .ax-modern-file-chip__icon {
    width: 32px; height: 32px; border-radius: 8px;
    background: #dcfce7; display: flex; align-items: center; justify-content: center;
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

  .ula-m-grid { display: grid; grid-template-columns: 1fr 1fr; gap: var(--ax-space-4, 16px); }
  .ula-m-full { grid-column: 1 / -1; }

  .ula-action-btn {
    display: inline-flex; align-items: center; gap: 6px; height: 30px; padding: 0 12px;
    font-size: 12px; font-weight: 500; border-radius: 0; cursor: pointer;
  }
  .ula-menu {
    position: fixed; z-index: 99999; box-sizing: border-box;
    display: flex; flex-direction: column; padding: 4px 0; text-align: left;
    background: var(--ax-surface-solid, #ffffff); border: 1px solid var(--ax-border, #e2e8f0); border-radius: 0;
    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.14), 0 8px 10px -6px rgba(0, 0, 0, 0.08);
  }
  .ula-menu__item {
    display: block; width: 100%; box-sizing: border-box; margin: 0; padding: 8px 14px;
    font: inherit; font-size: 12px; font-weight: 500; text-align: left; text-decoration: none;
    color: var(--ax-text, #0f172a); background: transparent; border: 0; border-radius: 0; cursor: pointer;
  }
  .ula-menu__item:hover, .ula-menu__item:focus-visible { background: var(--ax-surface-subtle, #f1f5f9); outline: none; }

  @media (max-width: 560px) {
    .ula-m-grid { grid-template-columns: 1fr; }
    .ula-m-stage { height: 56vh; }
  }
`;

/* ───────── Responsive Page CSS (Exact Assam SWP Reference) ───────── */
const PAGE_CSS = `
  .solar-erp-page {
    --asw-primary: #2563eb;
    --asw-primary-rgb: 37, 99, 235;
  }
  .solar-erp-page .ax-card { min-width: 0; }
  .solar-erp-page .ax-card__footer { width: 100%; box-sizing: border-box; }
  .solar-erp-page .ula-pagination-left {
    width: 100%; display: flex; justify-content: flex-start; align-items: center; margin: 0; overflow-x: auto;
  }
  .solar-erp-page .ula-pagination-left > * { margin-left: 0 !important; margin-right: 0 !important; }

  .solar-erp-page img,
  .solar-erp-page .ula-table--wide img,
  .solar-erp-page .ax-card img {
    border-radius: 0 !important;
  }

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

  .solar-erp-page .ax-card__header {
    display: flex;
    flex-wrap: nowrap;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
  }
  .solar-erp-page .ax-card__titles {
    flex: 1 1 220px;
    min-width: 220px;
    max-width: 100%;
  }
  .solar-erp-page .ax-card__title,
  .solar-erp-page .ax-card__eyebrow,
  .solar-erp-page .ax-card__subtitle {
    max-width: none;
    word-break: normal;
    overflow-wrap: normal;
    hyphens: none;
  }
  .solar-erp-page .ax-card__subtitle { line-height: 1.45; }

  .solar-erp-page .ax-card__actions {
    flex: 0 1 auto;
    min-width: 0;
    margin-left: auto;
    display: flex;
    align-items: center;
    justify-content: flex-end;
    flex-wrap: nowrap;
    gap: 8px;
  }
  .solar-erp-page .ax-card__actions .ax-cluster {
    flex-wrap: nowrap !important;
    min-width: 0;
    justify-content: flex-end;
  }
  .solar-erp-page .ax-card__actions .ax-search,
  .solar-erp-page .ax-card__actions [class*="search"] {
    flex: 1 1 140px;
    min-width: 190px;
    max-width: 230px;
  }
  .solar-erp-page .ax-card__actions input { min-width: 0; width: 100%; }
  .solar-erp-page .ax-card__actions .ax-export-toolbar,
  .solar-erp-page .ax-card__actions [class*="export-toolbar"] {
    flex: 0 1 auto;
    min-width: 0;
    flex-wrap: nowrap;
    gap: 4px;
  }
  .solar-erp-page .ax-export-toolbar__button {
    padding-inline: 8px !important;
    min-width: 0;
  }

  .solar-erp-page .ax-table-wrap {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }

  @media (max-width: 1200px) {
    .solar-erp-page .ax-export-toolbar__button {
      font-size: 0;
      gap: 0;
      padding: 0 8px !important;
      justify-content: center;
    }
    .solar-erp-page .ax-export-toolbar__button svg {
      width: 16px;
      height: 16px;
      flex-shrink: 0;
    }
    .solar-erp-page .ax-card__actions .ax-search,
    .solar-erp-page .ax-card__actions [class*="search"] { max-width: 170px; }
  }

  @media (max-width: 900px) {
    .solar-erp-page .ax-card__header {
      flex-direction: column;
      flex-wrap: nowrap;
      align-items: stretch;
      gap: 10px;
    }
    .solar-erp-page .ax-card__titles {
      flex: 0 0 auto;
      min-width: 0;
      width: 100%;
      max-width: 100%;
    }
    .solar-erp-page .ax-card__title {
      font-family: var(--ax-font-display);
      font-size: var(--ax-text-md);
      line-height: var(--ax-leading-md);
    }
    .solar-erp-page .ax-card__actions {
      flex: 0 0 auto;
      width: 100%;
      margin-left: 0;
      flex-wrap: wrap;
      justify-content: flex-start;
    }
    .solar-erp-page .ax-card__actions .ax-cluster {
      flex-wrap: wrap !important;
      width: 100%;
      justify-content: flex-start;
      gap: 8px;
    }
    .solar-erp-page .ax-card__actions .ax-search,
    .solar-erp-page .ax-card__actions [class*="search"] {
      flex: 1 1 100%;
      width: 100%;
      max-width: 100%;
      min-width: 0;
    }
    .solar-erp-page .ax-card__actions .ax-export-toolbar,
    .solar-erp-page .ax-card__actions [class*="export-toolbar"] {
      flex: 1 1 100%;
      flex-wrap: wrap;
      justify-content: flex-start;
      gap: 6px;
    }
    .solar-erp-page .ax-export-toolbar__button {
      font-size: 12px;
      gap: 4px;
      height: 30px;
      padding: 0 8px !important;
    }
  }

  @media (max-width: 490px) {
    .solar-erp-page .ax-export-toolbar__button {
      font-size: 11px;
      height: 28px;
      padding: 0 6px !important;
    }
    .solar-erp-page .ax-export-toolbar { gap: 4px; }
  }
`;

const actionsRowStyle = {
  gap: 'var(--ax-space-2)',
  flexWrap: 'wrap',
  alignItems: 'center',
  justifyContent: 'flex-end',
  width: '100%',
} as const;

const footerStyle = {
  borderTop: '1px solid var(--ax-border, #e2e8f0)',
  padding: 'var(--ax-space-3) var(--ax-space-4)',
  display: 'flex',
  justifyContent: 'flex-start',
  alignItems: 'center',
  width: '100%',
  boxSizing: 'border-box',
} as const;

const centerCell = { textAlign: 'center', padding: 24 } as const;
const monoCell = { fontFamily: 'var(--ax-font-mono)', fontSize: '12px' } as const;

/* ── Top KPI Card Component (Exact Assam SWP Design) ── */
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
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            textTransform: 'uppercase',
            color: 'var(--ax-text-muted)',
            letterSpacing: '0.04em',
          }}
        >
          {label}
        </span>
      </div>
      <div
        style={{
          fontSize: 24,
          fontWeight: 800,
          color: t.fg,
          marginTop: 4,
          fontFamily: 'var(--ax-font-display)',
        }}
      >
        {value}
      </div>
      <div style={{ fontSize: 12, color: 'var(--ax-text-muted)', marginTop: 2 }}>{sub}</div>
    </div>
  );
}

/* ── Table Headers (Exact Assam SWP Column Pattern for UP Kusum-C) ── */
const COMMON_HEADERS = [
  'Sr. No.',
  'State',
  'District',
  'Block / Village',
  'Farmer Name',
  'Father Name',
  'Contact Number',
  'Customer No.',
  'Pump Capacity',
  'Inverter No.',
  'VFD No.',
  'Module Serials',
  'Module Photo',
  'Inverter & VFD Photo',
  'Running Water Photo',
  'Latitude',
  'Longitude',
  'Remark',
  'Verify Status',
  'Document Status',
  'Claim Status',
  'Action',
];

const UPLOADED_DOCS_KEY = 'up_kusumc_uploaded_docs';

export function UP_Installation_KusumC_ViewInstallation() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [sites, setSites] = useState<UpKusumCInstalledSiteItem[]>([]);
  const [installDetail, setInstallDetail] = useState<UpKusumCInstalledCounts | null>(null);
  const [assignCount, setAssignCount] = useState<number>(0);
  const [claimPayments, setClaimPayments] = useState<UpKusumCClaimPaymentItem[]>([]);
  const [claimableSiteIds, setClaimableSiteIds] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState(() => searchParams.get('district') || searchParams.get('search') || '');
  const [statusFilter, setStatusFilter] = useState(() => searchParams.get('status') || 'all');
  const [claimFilter, setClaimFilter] = useState<'all' | ClaimStatusKey>('all');

  // Photo preview modal (interactive lightbox)
  const [preview, setPreview] = useState<{ url: string; title: string } | null>(null);
  const openPreview = useCallback((url: string, title: string) => setPreview({ url, title }), []);
  const closePreview = useCallback(() => setPreview(null), []);

  // Document submit modal (HOC upload)
  const [docModalSite, setDocModalSite] = useState<UpKusumCInstalledSiteItem | null>(null);
  const [docFile, setDocFile] = useState<File | null>(null);
  const [docDate, setDocDate] = useState('');
  const [docRemarks, setDocRemarks] = useState('');
  const [docSubmitting, setDocSubmitting] = useState(false);
  const [docError, setDocError] = useState<string | null>(null);
  const docFileRef = useRef<HTMLInputElement>(null);
  const closeDocModal = useCallback(() => {
    setDocModalSite(null);
    setDocFile(null);
    setDocDate('');
    setDocRemarks('');
    setDocError(null);
    if (docFileRef.current) docFileRef.current.value = '';
  }, []);

  // Toast / feedback message
  const [toastMsg, setToastMsg] = useState<{ type: 'success' | 'danger'; text: string } | null>(null);

  useEffect(() => {
    if (!toastMsg) return;
    const t = window.setTimeout(() => setToastMsg(null), 4000);
    return () => window.clearTimeout(t);
  }, [toastMsg]);

  const getUploadedDocsFromStorage = useCallback(
    (): Record<string, { id: string; fileName: string; uploadedAt: string; status: number }> => {
      try {
        const raw = localStorage.getItem(UPLOADED_DOCS_KEY);
        if (raw) return JSON.parse(raw);
      } catch {
        // ignore storage errors
      }
      return {};
    },
    []
  );

  const saveUploadedDocToStorage = useCallback(
    (item: { id: string; fileName: string; uploadedAt: string; status: number }) => {
      try {
        const map = getUploadedDocsFromStorage();
        map[item.id] = item;
        localStorage.setItem(UPLOADED_DOCS_KEY, JSON.stringify(map));
      } catch {
        // ignore storage errors
      }
    },
    [getUploadedDocsFromStorage]
  );

  // Load real installation sites + claims status (read-only) from UP Kusum-C APIs
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [installedRes, claimsRes] = await Promise.all([
        upInstallationService.getKusumCInstalledSites(),
        upInstallationService.getKusumCClaims().catch(() => ({ payments: [], sites: [] })),
      ]);

      const mergedSites = (installedRes?.sites || []).map((s) => {
        return s;
      });

      setSites(mergedSites);
      setInstallDetail(installedRes?.has_install_detail ? installedRes.install_detail : null);
      setAssignCount(Number(installedRes?.assign ?? 0));
      setClaimPayments(claimsRes?.payments || []);
      setClaimableSiteIds(new Set((claimsRes?.sites || []).map((x) => Number(x.id))));
    } catch (err: any) {
      console.error('[UP Kusum-C ViewInstallation] load error:', err);
      setToastMsg({ type: 'danger', text: err?.message || 'Failed to load installation sites from server.' });
    } finally {
      setLoading(false);
    }
  }, [getUploadedDocsFromStorage]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const allSites = sites;

  // Map siteId -> latest claim record (highest claim id wins so re-claims after rejection show latest status)
  const claimedSiteMap = useMemo(() => {
    const map = new Map<number, UpKusumCClaimPaymentItem>();
    const sorted = [...claimPayments].sort((a, b) => Number(a.id || 0) - Number(b.id || 0));
    sorted.forEach((p) => {
      parseClaimSiteIds(p.site_id).forEach((sid) => {
        map.set(sid, p);
      });
    });
    return map;
  }, [claimPayments]);

  // Submit HOC Document Form (multipart upload)
  const handleDocSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!docModalSite) return;
    if (!docFile) {
      setDocError('Please select a document file to upload (PDF, JPG, PNG).');
      return;
    }
    if (!docDate.trim()) {
      setDocError('Please select the document submission date.');
      return;
    }
    if (!docRemarks.trim()) {
      setDocError('Please enter remarks.');
      return;
    }
    setDocError(null);
    setDocSubmitting(true);
    try {
      const rowId = String(docModalSite.id);
      const selectedDate = docDate.trim();
      const finalRemarks = docRemarks.trim();

      const fd = new FormData();
      fd.append('id', rowId);
      fd.append('site_id', rowId);
      fd.append('doc_file', docFile);
      fd.append('file', docFile);
      fd.append('inst_doc', docFile);
      fd.append('inst_doc_file', docFile);
      fd.append('document_file', docFile);
      fd.append('document', docFile);
      fd.append('hoc_file', docFile);
      fd.append('hoc_photo', docFile);
      fd.append('date', selectedDate);
      fd.append('doc_date', selectedDate);
      fd.append('inst_doc_date', selectedDate);
      fd.append('doc_hoc_date', selectedDate);
      fd.append('remarks', finalRemarks);
      fd.append('doc_remarks', finalRemarks);
      fd.append('inst_doc_remarks', finalRemarks);

      const res = await upInstallationService.submitKusumCHoc(fd);
      if (res?.status === false) {
        const errMsg =
          res?.message ||
          (res?.errors ? Object.values(res.errors).flat().join(', ') : 'Failed to submit installation document.');
        setDocError(errMsg);
        return;
      }

      saveUploadedDocToStorage({
        id: rowId,
        fileName: docFile.name,
        uploadedAt: selectedDate,
        status: 1,
      });

      setToastMsg({ type: 'success', text: `Document submitted successfully for Site #${rowId}!` });
      closeDocModal();
      await loadData();
    } catch (err: any) {
      setDocError(err?.message || 'Failed to submit installation document.');
    } finally {
      setDocSubmitting(false);
    }
  };

  // Filtered sites (Verify Status + Claim Status + Search)
  const filteredSites = useMemo(() => {
    let list = allSites;

    if (statusFilter === 'approved') list = list.filter((s) => getVerifyVal(s) === 1);
    else if (statusFilter === 'rejected') list = list.filter((s) => getVerifyVal(s) === 2);
    else if (statusFilter === 'pending') list = list.filter((s) => getVerifyVal(s) === 0);

    if (claimFilter !== 'all') {
      list = list.filter((s) => resolveSiteClaimInfo(s, claimedSiteMap, claimableSiteIds).key === claimFilter);
    }

    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter((s) => {
        const ser = fmtSerials(s).toLowerCase();
        const lat = String(s.latitude || (s as any).inst_latitude || '').toLowerCase();
        const lng = String(s.longitude || (s as any).inst_longitude || '').toLowerCase();
        const claimLabel = resolveSiteClaimInfo(s, claimedSiteMap, claimableSiteIds).label.toLowerCase();
        return (
          String(s.id).includes(q) ||
          getStateName(s).toLowerCase().includes(q) ||
          getDistrict(s).toLowerCase().includes(q) ||
          getBlockVillage(s).toLowerCase().includes(q) ||
          getFarmerName(s).toLowerCase().includes(q) ||
          getFatherName(s).toLowerCase().includes(q) ||
          getContact(s).toLowerCase().includes(q) ||
          String(s.f_customer_no || '').toLowerCase().includes(q) ||
          String(s.pump_capacity || '').toLowerCase().includes(q) ||
          String(s.Inverter_no || s.inverter_no || s.inverter_serial_no || '').toLowerCase().includes(q) ||
          String(s.vfd_no || s.vfd_serial_no || '').toLowerCase().includes(q) ||
          lat.includes(q) ||
          lng.includes(q) ||
          ser.includes(q) ||
          claimLabel.includes(q)
        );
      });
    }
    return list;
  }, [allSites, search, statusFilter, claimFilter, claimedSiteMap, claimableSiteIds]);

  const { paginatedData, currentPage, pageSize, totalItems, setPage, setPageSize } = usePagination({
    data: filteredSites,
    initialPageSize: 100,
  });

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, claimFilter, setPage]);

  const hasFilters = search.trim() !== '' || statusFilter !== 'all' || claimFilter !== 'all';
  const resetFilters = () => {
    setSearch('');
    setStatusFilter('all');
    setClaimFilter('all');
    setPage(1);
  };

  // Summary counts for 4 KPI Cards (Exact Assam SWP Structure)
  const approvedCount =
    installDetail?.verify_approved ?? allSites.filter((s) => getVerifyVal(s) === 1).length;
  const pendingCount =
    installDetail?.verify_pending ?? allSites.filter((s) => getVerifyVal(s) === 0).length;
  const rejectedCount =
    installDetail?.verify_reject ?? allSites.filter((s) => getVerifyVal(s) === 2).length;
  const totalAssignedCount =
    installDetail?.total_assign ?? installDetail?.total ?? (assignCount || allSites.length);
  const installedCount = installDetail?.complete ?? allSites.length;
  const paidCount =
    installDetail?.paid ??
    allSites.filter((s) => Number(s.inst_pay_status ?? s.payment_status ?? s.pay_status ?? 0) === 1).length;
  const claimApprovedCount =
    installDetail?.claim_approved ??
    allSites.filter((s) => {
      const info = resolveSiteClaimInfo(s, claimedSiteMap, claimableSiteIds);
      return info.key === 'approved' || info.key === 'paid' || info.key === 'partially_paid';
    }).length;

  // Export columns
  const exportCols = useMemo<ExportColumn<UpKusumCInstalledSiteItem>[]>(
    () => [
      {
        header: 'Sr. No.',
        accessor: (_r: UpKusumCInstalledSiteItem, idx?: number) => (idx !== undefined ? idx + 1 : ''),
      },
      { header: 'State', accessor: (r: UpKusumCInstalledSiteItem) => getStateName(r).toUpperCase() || 'UP' },
      { header: 'District', accessor: (r: UpKusumCInstalledSiteItem) => getDistrict(r) },
      { header: 'Block / Village', accessor: (r: UpKusumCInstalledSiteItem) => getBlockVillage(r) },
      { header: 'Farmer Name', accessor: (r: UpKusumCInstalledSiteItem) => getFarmerName(r) },
      { header: 'Father Name', accessor: (r: UpKusumCInstalledSiteItem) => getFatherName(r) },
      { header: 'Contact Number', accessor: (r: UpKusumCInstalledSiteItem) => getContact(r) },
      { header: 'Customer No.', accessor: (r: UpKusumCInstalledSiteItem) => r.f_customer_no || '' },
      { header: 'Pump Capacity', accessor: (r: UpKusumCInstalledSiteItem) => r.pump_capacity || '' },
      {
        header: 'Inverter No.',
        accessor: (r: UpKusumCInstalledSiteItem) => r.Inverter_no || r.inverter_no || r.inverter_serial_no || '',
      },
      { header: 'VFD No.', accessor: (r: UpKusumCInstalledSiteItem) => r.vfd_no || r.vfd_serial_no || '' },
      { header: 'Module Serials', accessor: (r: UpKusumCInstalledSiteItem) => fmtSerials(r) },
      {
        header: 'Module Photo',
        accessor: (r: UpKusumCInstalledSiteItem) => r.module_image || r.farmer_module_image || r.f_module_image || '',
      },
      {
        header: 'Inverter & VFD Photo',
        accessor: (r: UpKusumCInstalledSiteItem) => r.inverter_vfd_image || r.inverter_image || r.vfd_image || '',
      },
      {
        header: 'Running Water Photo',
        accessor: (r: UpKusumCInstalledSiteItem) => r.running_water_image || r.water_image || '',
      },
      { header: 'Latitude', accessor: (r: UpKusumCInstalledSiteItem) => r.latitude || (r as any).inst_latitude || '' },
      { header: 'Longitude', accessor: (r: UpKusumCInstalledSiteItem) => r.longitude || (r as any).inst_longitude || '' },
      { header: 'Remark', accessor: (r: UpKusumCInstalledSiteItem) => r.inst_remarks || r.remarks || '' },
      {
        header: 'Verify Status',
        accessor: (r: UpKusumCInstalledSiteItem) => {
          const v = getVerifyVal(r);
          if (v === 1) return 'Approved';
          if (v === 2) return 'Rejected';
          return 'Pending';
        },
      },
      {
        header: 'Document Status',
        accessor: (r: UpKusumCInstalledSiteItem) => {
          const s = Number(r.inst_doc_status ?? r.document_status ?? 0);
          if (s === 2) return 'Approved';
          if (s === 3) return 'Reject';
          if (s === 1) return 'Submitted';
          return 'Pending';
        },
      },
      {
        header: 'Claim Status',
        accessor: (r: UpKusumCInstalledSiteItem) => resolveSiteClaimInfo(r, claimedSiteMap, claimableSiteIds).label,
      },
    ],
    [claimedSiteMap, claimableSiteIds]
  );

  const stamp = new Date().toISOString().slice(0, 10);
  const fileBase = 'UP_KusumC_Completed_Installations';
  const fileTitle = 'UP Kusum-C Completed Installation Register';

  const getExportValue = <T,>(row: T, column: ExportColumn<T>, index: number) => {
    if (typeof column.accessor === 'function') return (column.accessor as any)(row, index);
    return (row as unknown as Record<string, unknown>)[column.accessor as string];
  };

  const escapeExportValue = (value: unknown) => (value === null || value === undefined ? '' : String(value));

  const downloadTextFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: `${mimeType};charset=utf-8;` });
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
    const out = [
      columns.map((c) => escapeExportValue(c.header)),
      ...list.map((row, idx) => columns.map((c) => escapeExportValue(getExportValue(row, c, idx)))),
    ];
    const csv = out.map((r) => r.map((v) => `"${(v ?? '').replace(/"/g, '""')}"`).join(',')).join('\r\n');
    downloadTextFile(`\ufeff${csv}`, `${filename}.csv`, 'text/csv');
  };

  const copyToClipboard = async <T,>(list: T[], columns: ExportColumn<T>[]) => {
    if (!list.length || !columns.length) return;
    const t = [
      columns.map((c) => c.header).join('\t'),
      ...list.map((row, idx) =>
        columns.map((c) => escapeExportValue(getExportValue(row, c, idx))).join('\t')
      ),
    ].join('\n');
    try {
      await navigator.clipboard.writeText(t);
      setToastMsg({ type: 'success', text: 'Table data copied to clipboard!' });
    } catch {
      const ta = document.createElement('textarea');
      ta.value = t;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setToastMsg({ type: 'success', text: 'Table data copied to clipboard!' });
    }
  };

  const exportToExcel = <T,>(list: T[], columns: ExportColumn<T>[], filename: string) => {
    if (!list.length || !columns.length) return;
    const tableHtml = `<table border="1"><thead><tr>${columns
      .map((c) => `<th>${escapeHtml(escapeExportValue(c.header))}</th>`)
      .join('')}</tr></thead><tbody>${list
      .map(
        (row, idx) =>
          `<tr>${columns
            .map((c) => `<td>${escapeHtml(escapeExportValue(getExportValue(row, c, idx)))}</td>`)
            .join('')}</tr>`
      )
      .join('')}</tbody></table>`;
    const html = `<html xmlns:x="urn:schemas-microsoft-com:office:excel"><head><meta charset="UTF-8" /></head><body>${tableHtml}</body></html>`;
    downloadTextFile(`\ufeff${html}`, `${filename}.xls`, 'application/vnd.ms-excel');
  };

  const exportToPDF = <T,>(list: T[], columns: ExportColumn<T>[], title: string) => {
    if (!list.length || !columns.length) return;
    const body = list.map((row, idx) =>
      columns.map((c) => escapeHtml(escapeExportValue(getExportValue(row, c, idx))))
    );
    const w = window.open('', '_blank', 'width=1200,height=800');
    if (!w) return;
    w.document.write(`<!doctype html><html><head><meta charset="UTF-8" /><title>${escapeHtml(title)}</title><style>
      *{box-sizing:border-box}body{font-family:Arial,sans-serif;padding:24px;color:#222}h1{font-size:20px;margin:0 0 16px}
      table{width:100%;border-collapse:collapse;font-size:10px}th,td{border:1px solid #d8dee6;padding:6px 6px;text-align:left;vertical-align:top}
      th{background:#f3f5f7;font-weight:700}@media print{body{padding:0}@page{size:landscape;margin:10mm}}
    </style></head><body><h1>${escapeHtml(title)}</h1><table><thead><tr>${columns
      .map((c) => `<th>${escapeHtml(escapeExportValue(c.header))}</th>`)
      .join('')}</tr></thead><tbody>${body
      .map((r) => `<tr>${r.map((v) => `<td>${v}</td>`).join('')}</tr>`)
      .join('')}</tbody></table><script>window.onload=function(){window.print();};</script></body></html>`);
    w.document.close();
    w.focus();
  };

  const headers = COMMON_HEADERS;
  const TOTAL_COLUMNS = headers.length;

  return (
    <div className="solar-erp-page">
      <style>{PAGE_CSS}</style>
      <style>{OVERLAY_CSS}</style>

      {/* ── Page Head (Exact Assam SWP Pattern) ── */}
      <PageHead
        title="View Kusum-C Installed Sites"
        subtitle="Master register of completed solar water pump installations, verification evidence, photographs, and compliance documents"
        breadcrumbs={[
          { label: 'Home', href: '/v-dashboard' },
          { label: 'Uttar Pradesh' },
          { label: 'Installation' },
          { label: 'Kusum C', href: '/v/up/kusum-c-installation-dashboard' },
          { label: 'View Installation' },
        ]}
        actions={
          <div style={{ display: 'inline-flex', gap: 'var(--ax-space-2)' }}>
            <Link to="/v/up/kusum-c-installation-claim" className="ax-btn ax-btn--secondary ax-btn--sm">
              <span className="ax-btn__label">View Payment</span>
            </Link>
            <Link to="/v/up/install-kusum-c-site" className="ax-btn ax-btn--primary ax-btn--sm">
              <span className="ax-btn__label">+ New Installation</span>
            </Link>
          </div>
        }
      />

      {toastMsg && (
        <div
          className={`ax-alert ax-alert--${toastMsg.type}`}
          style={{ marginBottom: 'var(--ax-space-4)' }}
          role="status"
        >
          <div className="ax-alert__title">{toastMsg.type === 'success' ? 'Success' : 'Error'}</div>
          <div className="ax-alert__text">{toastMsg.text}</div>
        </div>
      )}

      {/* ── Top Metric KPI Cards (Exact Assam SWP 4 cards in 1 row) ── */}
      <div className="asw-cards-row">
        <KpiCard
          tone="accent"
          label="Total Accepted"
          value={Number(totalAssignedCount || 0).toLocaleString('en-IN')}
          sub="Assigned for installation"
          icon={
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="4" y="4" width="16" height="16" rx="2" />
              <path d="M8 9h8M8 13h8M8 17h5" />
            </svg>
          }
        />

        <KpiCard
          tone="emerald"
          label="Installed Sites"
          value={Number(installedCount || 0).toLocaleString('en-IN')}
          sub="Equipment & photos uploaded"
          icon={
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 3l7 3v5c0 4.5-3 8.2-7 10-4-1.8-7-5.5-7-10V6l7-3z" />
              <path d="M9 12l2 2 4-4" />
            </svg>
          }
        />

        <KpiCard
          tone="cyan"
          label="Verify Approved"
          value={Number(approvedCount || 0).toLocaleString('en-IN')}
          sub={`${pendingCount} audit pending`}
          icon={
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="9" />
              <polyline points="12 7 12 12 15 15" />
            </svg>
          }
        />

        <KpiCard
          tone="violet"
          label="Payment Settled"
          value={Number(paidCount || 0).toLocaleString('en-IN')}
          sub={`${claimApprovedCount} claims approved`}
          icon={
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="12" y1="1" x2="12" y2="23" />
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          }
        />
      </div>

      {/* ── Main Table Card (Exact Assam SWP Single-Table Card Pattern) ── */}
      <section
        className="ax-card ax-col--12"
        id="kusumc-tabpanel"
        role="tabpanel"
        aria-label="UP Kusum-C Installations"
      >
        <div className="ax-card__header">
          <div className="ax-card__titles">
            <h2 className="ax-card__title">Completed Kusum-C Installation Data</h2>
            <p className="ax-card__subtitle">
              <span className="ax-num">{filteredSites.length}</span> of{' '}
              <span className="ax-num">{allSites.length}</span> installations · Approved{' '}
              <b className="ax-num">{approvedCount}</b> · Pending <b className="ax-num">{pendingCount}</b> ·
              Rejected <b className="ax-num">{rejectedCount}</b>
            </p>
          </div>
          <div className="ax-card__actions">
            <div className="ax-cluster" style={actionsRowStyle}>
              <select
                id="kusumc_status_filter"
                className="ax-input ax-input--sm"
                style={{ width: 135, height: 32, fontSize: 'var(--ax-text-xs)' }}
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                aria-label="Filter by verify status"
              >
                <option value="all">All Status</option>
                <option value="approved">Approved</option>
                <option value="pending">Pending</option>
                <option value="rejected">Rejected</option>
              </select>

              <select
                id="kusumc_claim_filter"
                className="ax-input ax-input--sm"
                style={{ width: 165, height: 32, fontSize: 'var(--ax-text-xs)' }}
                value={claimFilter}
                onChange={(e) => {
                  setClaimFilter(e.target.value as 'all' | ClaimStatusKey);
                  setPage(1);
                }}
                aria-label="Filter by claim status"
              >
                <option value="all">All Claim Status</option>
                <option value="not_applicable">Not Applicable</option>
                <option value="Raised">Claim Applicable</option>
                <option value="approved">Approved</option>
                <option value="rejected">Reject</option>
                <option value="paid">Paid</option>
                <option value="partially_paid">Partially Paid</option>
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

              <SearchInput
                value={search}
                onChange={setSearch}
                placeholder="Search farmer, serial, customer, district…"
                size="sm"
                ariaLabel="Search installed sites"
              />

              <TableExportToolbar
                onCopy={() => copyToClipboard(filteredSites, exportCols)}
                onExportCSV={() => exportToCSV(filteredSites, exportCols, `${fileBase}_${stamp}`)}
                onExportExcel={() => exportToExcel(filteredSites, exportCols, `${fileBase}_${stamp}`)}
                onExportPDF={() => exportToPDF(filteredSites, exportCols, fileTitle)}
              />
            </div>
          </div>
        </div>

        <div className="ax-table-wrap">
          <table
            className="ax-table ax-table--hover ula-table--wide"
            style={{ whiteSpace: 'nowrap', minWidth: 2800 }}
          >
            <caption className="ax-visually-hidden">Completed Kusum-C Installation Data</caption>
            <thead className="ax-table__head">
              <tr>
                {headers.map((h) => (
                  <th
                    key={h}
                    className="ax-table__th"
                    scope="col"
                    style={h === 'Action' ? { textAlign: 'center' } : undefined}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody aria-busy={loading}>
              {loading && (
                <tr>
                  <td className="ax-table__td" colSpan={TOTAL_COLUMNS} style={centerCell}>
                    <span className="ax-spinner" style={{ marginRight: 8 }} /> Loading installation records from
                    server…
                  </td>
                </tr>
              )}
              {!loading && filteredSites.length === 0 && (
                <tr>
                  <td className="ax-table__td" colSpan={TOTAL_COLUMNS} style={{ padding: 0 }}>
                    <TableEmptyState
                      title="No completed installation records found"
                      message={
                        hasFilters
                          ? 'No records match your filters or search. Try clearing your query.'
                          : 'Completed sites will appear here once installation work is recorded via the installation form.'
                      }
                      onClear={hasFilters ? resetFilters : undefined}
                      clearLabel="Clear filters"
                    />
                  </td>
                </tr>
              )}
              {!loading &&
                paginatedData.map((row, index) => {
                  const lat = String(row.latitude || (row as any).inst_latitude || '');
                  const lng = String(row.longitude || (row as any).inst_longitude || '');
                  const hasGeo =
                    lat !== '' && lng !== '' && !Number.isNaN(Number(lat)) && !Number.isNaN(Number(lng));
                  const farmerName = getFarmerName(row);
                  const farmerLabel = farmerName || `Site ${row.id}`;
                  const rawDoc = getRawDoc(row);
                  const docUrl = rawDoc ? resolveUpMediaUrl(rawDoc) : null;
                  const moduleImg = row.module_image || row.farmer_module_image || row.f_module_image;
                  const invImg = row.inverter_vfd_image || row.inverter_image || row.vfd_image;
                  const waterImg = row.running_water_image || row.water_image;
                  const moduleSerialsList = getRowModuleSerials(row);
                  const blockVillage = getBlockVillage(row);

                  const vStatus = getVerifyVal(row);
                  const isVerifyApproved = vStatus === 1;
                  const dStatus = Number(row.inst_doc_status ?? row.document_status ?? 0);
                  const hasDoc = Boolean(rawDoc);
                  const canEdit = !isVerifyApproved;
                  const canSubmitDoc = dStatus !== 2 && !(dStatus === 1 && hasDoc);
                  const isRowLocked = !canEdit && !canSubmitDoc;

                  const claimInfo = resolveSiteClaimInfo(row, claimedSiteMap, claimableSiteIds);

                  return (
                    <tr key={row.id} className="ax-table__row">
                      <td className="ax-table__td ax-num">{(currentPage - 1) * pageSize + index + 1}</td>
                      <td className="ax-table__td" style={{ textTransform: 'uppercase' }}>
                        {getStateName(row) || 'UP'}
                      </td>
                      <td className="ax-table__td">
                        <b>{getDistrict(row) || DASH}</b>
                      </td>
                      <td className="ax-table__td">{blockVillage || DASH}</td>
                      <td className="ax-table__td">
                        <span style={{ fontWeight: 600, color: 'var(--ax-text-strong)' }}>
                          {farmerName || DASH}
                        </span>
                      </td>
                      <td className="ax-table__td">{getFatherName(row) || DASH}</td>
                      <td className="ax-table__td" style={monoCell}>
                        {getContact(row) || DASH}
                      </td>
                      <td className="ax-table__td" style={monoCell}>
                        {row.f_customer_no || DASH}
                      </td>
                      <td className="ax-table__td" style={{ fontWeight: 600, color: 'var(--asw-primary)' }}>
                        {row.pump_capacity || DASH}
                      </td>
                      <td className="ax-table__td" style={monoCell}>
                        {row.Inverter_no || row.inverter_no || row.inverter_serial_no || DASH}
                      </td>
                      <td className="ax-table__td" style={monoCell}>
                        {row.vfd_no || row.vfd_serial_no || DASH}
                      </td>
                      <td className="ax-table__td" style={{ verticalAlign: 'middle' }}>
                        <ModuleSerialsCell
                          serials={moduleSerialsList}
                          siteTitle={`${farmerLabel}${row.id ? ` · Site #${row.id}` : ''}`}
                          farmerName={farmerLabel}
                          siteId={row.id}
                          pumpCapacity={row.pump_capacity || (row as any).volume}
                          district={getDistrict(row)}
                        />
                      </td>

                      {/* Photo Thumbnails: NO BORDER RADIUS, Real Candidates, Click-to-Zoom */}
                      <td className="ax-table__td">
                        <InstallationThumbnail
                          src={moduleImg}
                          alt={`${farmerLabel} - Module Photo`}
                          onPreview={openPreview}
                        />
                      </td>
                      <td className="ax-table__td">
                        <InstallationThumbnail
                          src={invImg}
                          alt={`${farmerLabel} - Inverter & VFD Photo`}
                          onPreview={openPreview}
                        />
                      </td>
                      <td className="ax-table__td">
                        <InstallationThumbnail
                          src={waterImg}
                          alt={`${farmerLabel} - Running Water Photo`}
                          onPreview={openPreview}
                        />
                      </td>

                      {/* Geolocation */}
                      <td className="ax-table__td">
                        {hasGeo ? (
                          <a
                            href={`https://www.google.com/maps?q=${lat},${lng}`}
                            target="_blank"
                            rel="noreferrer"
                            style={{
                              color: 'var(--ax-primary-default, #2563eb)',
                              textDecoration: 'none',
                              fontWeight: 600,
                            }}
                            title="Open location in Google Maps"
                          >
                            {lat}
                          </a>
                        ) : (
                          lat || DASH
                        )}
                      </td>
                      <td className="ax-table__td">{lng || DASH}</td>

                      {/* Remarks */}
                      <td
                        className="ax-table__td"
                        style={{ maxWidth: 200, whiteSpace: 'normal', fontSize: '12px' }}
                      >
                        {row.inst_remarks || row.remarks || DASH}
                      </td>

                      {/* Verify Status */}
                      <td className="ax-table__td">
                        <VerifyBadge value={vStatus} raw={row.inst_verify_status ?? row.verify_status} />
                      </td>

                      {/* Document Status */}
                      <td className="ax-table__td">
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                          <DocBadge status={dStatus} docUrl={docUrl} />
                          {docUrl && (
                            <a
                              href={docUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                fontSize: 11,
                                fontWeight: 600,
                                color: 'var(--asw-primary)',
                                textDecoration: 'none',
                              }}
                              title="View uploaded HOC document"
                            >
                              View ↗
                            </a>
                          )}
                        </div>
                      </td>

                      {/* Claim Status (Display-Only — All Claim States; Claiming is via View Payment Page) */}
                      <td className="ax-table__td">
                        <ClaimStatusBadge info={claimInfo} />
                      </td>

                      {/* Action: Locked when both Verify & Document actions are locked, otherwise RowActionDropdown */}
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        {isRowLocked ? (
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
                            title="Installation Verified & Document Submitted. Actions are locked."
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
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, justifyContent: 'center' }}>
                           
                            <RowActionDropdown
                              canEdit={canEdit}
                              canSubmitDoc={canSubmitDoc}
                              onEdit={() =>
                                navigate(`/v/up/install-kusum-c-site?edit_id=${row.id}`, {
                                  state: { editItem: row },
                                })
                              }
                              onSubmitDoc={() => {
                                setDocModalSite(row);
                                setDocFile(null);
                                setDocDate('');
                                setDocRemarks('');
                                setDocError(null);
                              }}
                            />
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>

        {/* ── Table Footer (Exact Assam SWP Pagination Structure) ── */}
        <div className="ax-card__footer" style={footerStyle}>
          <div className="ula-pagination-left">
            <Pagination
              currentPage={currentPage}
              totalItems={totalItems}
              pageSize={pageSize}
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
              pageSizeOptions={[10, 25, 50, 100, 200]}
            />
          </div>
        </div>
      </section>

      {/* ── Photo Preview Modal (Zoom, Open in Tab) ── */}
      {preview && <ImagePreviewModal url={preview.url} title={preview.title} onClose={closePreview} />}

      {/* ── Document Submit Modal (Exact Assam SWP Modern Dropzone Modal) ── */}
      <Modal
        open={!!docModalSite}
        onClose={closeDocModal}
        labelledBy="kusumc-doc-title"
        dialogClass="ax-modal__dialog--md"
      >
        {docModalSite && (
          <form onSubmit={handleDocSubmit}>
            <div className="ax-modal__header">
              <div>
                <h4
                  style={{ margin: 0, fontSize: 17, fontWeight: 700, color: 'var(--ax-text-strong, #0f172a)' }}
                  id="kusumc-doc-title"
                >
                  Submit Installation Document (HOC)
                </h4>
                <p style={{ margin: '3px 0 0', fontSize: 12, color: 'var(--ax-text-muted, #64748b)' }}>
                  Site: <b>{getFarmerName(docModalSite) || DASH}</b> ({docModalSite.id})
                  {getDistrict(docModalSite) ? ` · ${getDistrict(docModalSite)}` : ''}
                </p>
              </div>
              <button
                type="button"
                className="ax-modal__close"
                onClick={closeDocModal}
                disabled={docSubmitting}
                aria-label="Close dialog"
              >
                ✕
              </button>
            </div>

            <div className="ax-modal__body" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
              {docError && (
                <div
                  style={{
                    padding: 12,
                    borderRadius: 8,
                    background: '#fef2f2',
                    color: '#991b1b',
                    fontSize: 13,
                    fontWeight: 600,
                    border: '1px solid #fecaca',
                  }}
                >
                  ✕ {docError}
                </div>
              )}

              <p
                style={{
                  margin: 0,
                  fontSize: 12.5,
                  color: 'var(--ax-text-muted, #64748b)',
                  background: 'var(--ax-surface-subtle, #f8fafc)',
                  padding: '10px 14px',
                  borderRadius: 8,
                  border: '1px solid var(--ax-border, #e2e8f0)',
                }}
              >
                The field labels marked with <span className="ax-modern-req" style={{ marginLeft: 0 }}>*</span> are
                required fields.
              </p>

              {/* Document * */}
              <div className="ax-modern-field">
                <label className="ax-modern-label" htmlFor="kusumc-doc-file">
                  <span>
                    Document <span className="ax-modern-req">*</span>
                  </span>
                  <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--ax-text-muted, #64748b)' }}>
                    PDF, JPG, PNG (Max 5 MB)
                  </span>
                </label>
                <input
                  id="kusumc-doc-file"
                  ref={docFileRef}
                  type="file"
                  accept=".pdf,image/*"
                  className="ax-input"
                  style={{ width: '100%', padding: '8px 10px' }}
                  onChange={(e) => setDocFile(e.target.files?.[0] || null)}
                  required
                  disabled={docSubmitting}
                />
                {docFile && (
                  <div className="ax-modern-file-chip">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                      <span className="ax-modern-file-chip__icon">
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={2}
                          style={{ width: 18, height: 18, color: '#059669' }}
                        >
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                          <polyline points="14 2 14 8 20 8" />
                          <line x1="16" y1="13" x2="8" y2="13" />
                          <line x1="16" y1="17" x2="8" y2="17" />
                          <polyline points="10 9 9 9 8 9" />
                        </svg>
                      </span>
                      <div style={{ minWidth: 0 }}>
                        <div
                          style={{
                            fontSize: 13,
                            fontWeight: 600,
                            color: 'var(--ax-text-strong, #1e293b)',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {docFile.name}
                        </div>
                        <div style={{ fontSize: 11.5, color: 'var(--ax-text-muted, #64748b)' }}>
                          {(docFile.size / 1024).toFixed(1)} KB
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="ax-btn ax-btn--ghost ax-btn--sm"
                      style={{ padding: '4px 8px', fontSize: 12, color: '#ef4444' }}
                      onClick={() => {
                        setDocFile(null);
                        if (docFileRef.current) docFileRef.current.value = '';
                      }}
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>

              {/* Date * */}
              <div className="ax-modern-field">
                <label className="ax-modern-label" htmlFor="kusumc-doc-date">
                  <span>
                    Date <span className="ax-modern-req">*</span>
                  </span>
                </label>
                <input
                  id="kusumc-doc-date"
                  type="date"
                  className="ax-input"
                  style={{ width: '100%' }}
                  placeholder="dd-mm-yyyy"
                  value={docDate}
                  onChange={(e) => setDocDate(e.target.value)}
                  required
                  disabled={docSubmitting}
                />
              </div>

              {/* Remarks * */}
              <div className="ax-modern-field">
                <label className="ax-modern-label" htmlFor="kusumc-doc-remarks">
                  <span>
                    Remarks <span className="ax-modern-req">*</span>
                  </span>
                </label>
                <textarea
                  id="kusumc-doc-remarks"
                  className="ax-input"
                  rows={3}
                  placeholder="Enter remarks..."
                  value={docRemarks}
                  onChange={(e) => setDocRemarks(e.target.value)}
                  required
                  disabled={docSubmitting}
                />
              </div>
            </div>

            <div className="ax-modal__footer">
              <button
                type="button"
                className="ax-btn ax-btn--secondary"
                onClick={closeDocModal}
                disabled={docSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="ax-btn ax-btn--primary"
                disabled={docSubmitting}
              >
                {docSubmitting ? 'Submitting…' : 'Submit Document'}
              </button>
            </div>
          </form>
        )}
      </Modal>

    </div>
  );
}

export default UP_Installation_KusumC_ViewInstallation;
