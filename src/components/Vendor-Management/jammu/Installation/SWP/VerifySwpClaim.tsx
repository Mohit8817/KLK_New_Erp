import { useEffect, useMemo, useState, useCallback, useRef, type FormEvent, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { PageHead } from '../../../../shell/PageHead';
import { useFocusTrap } from '../../../../../hooks/useFocusTrap';
import {
  Pagination,
  usePagination,
  SearchInput,
  TableExportToolbar,
  TableEmptyState,
  type ExportColumn,
} from '../../../../../common';
import {
  jammuAdminSwpService,
  resolveJammuSwpMediaUrl,
} from './jammuSwpAdminService';

/* ───────── Responsive page CSS (Exact Solar ERP / Jammu SRT 70MW reference) ───────── */
const PAGE_CSS = `
  .solar-erp-page {
    --asw-primary: #2559bf;
    --asw-primary-rgb: 37, 89, 191;
  }
  .solar-erp-page .ax-btn--primary {
    background-color: #2559bf !important;
    border-color: #2559bf !important;
    color: #ffffff !important;
  }
  .solar-erp-page .ax-btn--primary:hover {
    background-color: #1d4699 !important;
    border-color: #1d4699 !important;
  }
  .solar-erp-page .ax-card { min-width: 0; }
  .solar-erp-page .ax-card__footer { width: 100%; box-sizing: border-box; }
  .solar-erp-page .ula-pagination-left {
    width: 100%; display: flex; justify-content: flex-start; align-items: center; margin: 0; overflow-x: auto;
  }
  .solar-erp-page .ula-pagination-left > * { margin-left: 0 !important; margin-right: 0 !important; }

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
    min-width: 200px;
    max-width: 240px;
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
    width: 100%;
  }
`;

/* ───────── Overlay CSS (modals) ───────── */
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
  .ax-modal__header {
    display: flex; align-items: center; justify-content: space-between;
    padding: 18px 24px; border-bottom: 1px solid var(--ax-border, #e2e8f0);
    background: var(--ax-surface-subtle, #f8fafc);
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
    display: flex; align-items: center; justify-content: flex-end; gap: 10px;
    padding: 16px 24px; border-top: 1px solid var(--ax-border, #e2e8f0);
    background: var(--ax-surface-subtle, #f8fafc);
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
const centerCell = { textAlign: 'center', padding: 24 } as const;

const X_ICON = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ width: 18, height: 18 }}>
    <path d="M18 6l-12 12" />
    <path d="M6 6l12 12" />
  </svg>
);

/* ── Top KPI Card Component ── */
type KpiTone = 'accent' | 'cyan' | 'emerald' | 'amber' | 'red';

const TONE: Record<KpiTone, { bg: string; fg: string }> = {
  accent: { bg: 'rgba(37, 89, 191, 0.12)', fg: '#2559bf' },
  cyan: { bg: 'color-mix(in oklab, var(--ax-viz-cyan, #06b6d4) 14%, transparent)', fg: '#0891b2' },
  emerald: { bg: 'color-mix(in oklab, var(--ax-viz-emerald, #10b981) 14%, transparent)', fg: '#16a34a' },
  amber: { bg: 'color-mix(in oklab, var(--ax-viz-amber, #f59e0b) 14%, transparent)', fg: '#d97706' },
  red: { bg: 'color-mix(in oklab, var(--ax-viz-red, #ef4444) 14%, transparent)', fg: '#dc2626' },
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
    <div className="ax-card" style={{ padding: '14px 18px', borderRadius: 12, minWidth: 0, background: '#fff', border: '1px solid #e2e8f0' }}>
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

/* ───────── Modal Dialog Component ───────── */
function Modal({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
  maxWidth = 540,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
  maxWidth?: number;
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
    <div className="ax-modal" role="dialog" aria-modal="true">
      <div className="ax-modal__backdrop" onClick={onClose} />
      <div ref={dialogRef} className="ax-modal__dialog" style={{ maxWidth }} tabIndex={-1}>
        <div className="ax-modal__header">
          <div>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#0f172a' }}>{title}</h3>
            {subtitle && <p style={{ margin: '4px 0 0 0', fontSize: 12.5, color: '#64748b' }}>{subtitle}</p>}
          </div>
          <button type="button" className="ax-modal__close" onClick={onClose} aria-label="Close dialog">
            {X_ICON}
          </button>
        </div>
        <div className="ax-modal__body">{children}</div>
        {footer && <div className="ax-modal__footer">{footer}</div>}
      </div>
    </div>,
    document.body
  );
}

/* ───────── Lightbox Modal ───────── */
function LightboxModal({
  open,
  onClose,
  url,
  title,
}: {
  open: boolean;
  onClose: () => void;
  url: string;
  title: string;
}) {
  const isPdf = /\.pdf($|\?)/i.test(url);

  if (!open) return null;

  return createPortal(
    <div className="ax-modal" role="dialog" aria-modal="true" style={{ zIndex: 10000 }}>
      <div className="ax-modal__backdrop" onClick={onClose} />
      <div
        className="ax-modal__dialog"
        style={{
          maxWidth: isPdf ? 1000 : 800,
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div className="ax-modal__header">
          <div>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#0f172a' }}>{title}</h3>
            <span style={{ fontSize: 11.5, color: '#64748b' }}>Invoice Inspection</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="ax-btn ax-btn--ghost ax-btn--sm"
              style={{ fontSize: 12 }}
            >
              Open Original ↗
            </a>
            <button type="button" className="ax-modal__close" onClick={onClose} aria-label="Close">
              {X_ICON}
            </button>
          </div>
        </div>
        <div className="ax-modal__body" style={{ padding: 12, display: 'flex', justifyContent: 'center', background: '#0b1120', minHeight: 460 }}>
          {isPdf ? (
            <iframe src={url} title={title} style={{ width: '100%', height: '70vh', border: 'none', borderRadius: 8, background: '#fff' }} />
          ) : (
            <img src={url} alt={title} style={{ maxWidth: '100%', maxHeight: '72vh', objectFit: 'contain', borderRadius: 8 }} />
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

export interface JammuSwpClaimRecord {
  id: number;
  vendorId?: number;
  vendorName: string;
  date: string;
  sites: Array<{ id: number; farmer_name?: string; f_farmer_name?: string }>;
  invoice?: string;
  amount: number | string;
  remarks: string;
  verifyRemarks: string;
  claimStatus: number; // 1 = Pending, 2 = Approved, 3 = Rejected
}

const fmtCurrency = (val: number | string | undefined | null) =>
  `₹${Number(val || 0).toLocaleString('en-IN')}`;

const escapeHtml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export function VerifySwpClaim() {
  const [claims, setClaims] = useState<JammuSwpClaimRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Verify Claim Modal (#14: id, status: 2|3, remarks)
  const [actionClaim, setActionClaim] = useState<JammuSwpClaimRecord | null>(null);
  const [claimStatus, setClaimStatus] = useState<'2' | '3'>('2');
  const [claimRemarks, setClaimRemarks] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Sites modal & Lightbox
  const [viewSitesClaim, setViewSitesClaim] = useState<JammuSwpClaimRecord | null>(null);
  const [lightbox, setLightbox] = useState<{ url: string; title: string } | null>(null);

  const fetchClaims = useCallback(async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await jammuAdminSwpService.getViewClaim();
      const rawList = Array.isArray(res.claims) ? res.claims : [];
      const mapped: JammuSwpClaimRecord[] = rawList.map((c: any) => ({
        id: c.id,
        vendorId: c.vendor_id || c.vendor?.id,
        vendorName: c.vendor_name || c.vendor?.name || c.vendor || (c.vendor_id ? `Vendor #${c.vendor_id}` : '—'),
        date: c.date || c.claim_date || c.created_at || '—',
        sites: Array.isArray(c.sites) ? c.sites : [],
        invoice: c.invoice || c.file || c.claim_invoice ? resolveJammuSwpMediaUrl(c.invoice || c.file || c.claim_invoice) : undefined,
        amount: c.amount || c.claim_amount || 0,
        remarks: c.remarks || c.claim_remarks || '—',
        verifyRemarks: c.approved_remarks || c.verify_remarks || c.inst_verify_remarks || '—',
        claimStatus: Number(c.claim_status ?? c.status ?? 1),
      }));
      setClaims(mapped);
    } catch (err: any) {
      console.error('Failed to fetch Jammu SWP claim requests:', err);
      setErrorMsg(err?.message || 'Failed to fetch Jammu SWP claim requests.');
      setClaims([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClaims();
  }, [fetchClaims]);

  // Submit Claim Audit
  const handleVerifyClaim = async (e: FormEvent) => {
    e.preventDefault();
    if (!actionClaim) return;
    setSubmitting(true);
    try {
      const targetStatus = Number(claimStatus);
      const res = await jammuAdminSwpService.updateClaimStatus({
        id: actionClaim.id,
        status: targetStatus,
        remarks: claimRemarks.trim() || undefined,
      });

      if (res.success || res.status) {
        setClaims((prev) =>
          prev.map((c) =>
            c.id === actionClaim.id
              ? {
                  ...c,
                  claimStatus: targetStatus,
                  verifyRemarks: claimRemarks || c.verifyRemarks,
                }
              : c
          )
        );
        setActionClaim(null);
        setClaimRemarks('');
        alert(res.message || 'Claim status updated successfully.');
      } else {
        alert(res.message || 'Failed to update claim status.');
      }
    } catch (err: any) {
      alert(err?.message || 'Failed to update claim status.');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredClaims = useMemo(() => {
    let list = claims;
    if (statusFilter !== 'all') {
      list = list.filter((c) => String(c.claimStatus) === statusFilter);
    }
    const q = searchQuery.trim().toLowerCase();
    if (!q) return list;
    return list.filter((c) => {
      const hay = [
        c.id,
        c.vendorName,
        c.date,
        c.amount,
        c.remarks,
        c.verifyRemarks,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return hay.includes(q);
    });
  }, [claims, searchQuery, statusFilter]);

  const pagination = usePagination(filteredClaims, { initialPageSize: 50 });

  useEffect(() => {
    pagination.setPage(1);
  }, [searchQuery, statusFilter]);

  // Summary counts
  const summary = useMemo(() => {
    return {
      total: claims.length,
      approved: claims.filter((c) => c.claimStatus === 2).length,
      rejected: claims.filter((c) => c.claimStatus === 3).length,
      pending: claims.filter((c) => c.claimStatus === 1).length,
    };
  }, [claims]);

  // Export Columns
  const exportCols: ExportColumn[] = [
    { header: 'S.No.', accessor: 'id' },
    { header: 'Vendor Name', accessor: 'vendorName' },
    { header: 'Date', accessor: 'date' },
    { header: 'Sites Count', accessor: 'sitesCount' },
    { header: 'Invoice', accessor: 'invoice' },
    { header: 'Amount (₹)', accessor: 'amount' },
    { header: 'Remarks', accessor: 'remarks' },
    { header: 'Verify Remarks', accessor: 'verifyRemarks' },
    { header: 'Status', accessor: 'status' },
  ];

  const exportDataFormatted = useMemo(() => {
    return filteredClaims.map((c, idx) => ({
      id: idx + 1,
      vendorName: c.vendorName,
      date: c.date,
      sitesCount: c.sites.length,
      invoice: c.invoice || '—',
      amount: c.amount,
      remarks: c.remarks,
      verifyRemarks: c.verifyRemarks,
      status: c.claimStatus === 2 ? 'Approved' : c.claimStatus === 3 ? 'Rejected' : 'Pending',
    }));
  }, [filteredClaims]);

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

  const copyToClipboard = async () => {
    if (!exportDataFormatted.length) return;
    const t = [
      exportCols.map((c) => c.header).join('\t'),
      ...exportDataFormatted.map((row) =>
        exportCols.map((c) => String((row as any)[c.accessor as string] || '')).join('\t')
      ),
    ].join('\n');
    try {
      await navigator.clipboard.writeText(t);
      alert('Data copied to clipboard!');
    } catch {
      const ta = document.createElement('textarea');
      ta.value = t;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      alert('Data copied to clipboard!');
    }
  };

  const exportToCSV = () => {
    if (!exportDataFormatted.length) return;
    const out = [
      exportCols.map((c) => c.header),
      ...exportDataFormatted.map((row) =>
        exportCols.map((c) => `"${String((row as any)[c.accessor as string] || '').replace(/"/g, '""')}"`)
      ),
    ];
    downloadTextFile(`\ufeff${out.map((r) => r.join(',')).join('\r\n')}`, `Jammu_SWP_Claims.csv`, 'text/csv');
  };

  const exportToExcel = () => {
    if (!exportDataFormatted.length) return;
    const tableHtml = `<table border="1"><thead><tr>${exportCols.map((c) => `<th>${escapeHtml(c.header)}</th>`).join('')}</tr></thead><tbody>${exportDataFormatted.map((row) => `<tr>${exportCols.map((c) => `<td>${escapeHtml(String((row as any)[c.accessor as string] || ''))}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
    downloadTextFile(`\ufeff<html xmlns:x="urn:schemas-microsoft-com:office:excel"><head><meta charset="UTF-8"/></head><body>${tableHtml}</body></html>`, `Jammu_SWP_Claims.xls`, 'application/vnd.ms-excel');
  };

  const exportToPDF = () => {
    if (!exportDataFormatted.length) return;
    const w = window.open('', '_blank', 'width=1200,height=800');
    if (!w) return;
    w.document.write(`<!doctype html><html><head><meta charset="UTF-8"/><title>Jammu SWP Installation Claims</title><style>
      *{box-sizing:border-box}body{font-family:Arial,sans-serif;padding:24px;color:#222}h1{font-size:20px;margin:0 0 16px}
      table{width:100%;border-collapse:collapse;font-size:11px}th,td{border:1px solid #d8dee6;padding:6px 8px;text-align:left;vertical-align:top}
      th{background:#f3f5f7;font-weight:700}@media print{body{padding:0}@page{size:landscape;margin:10mm}}
    </style></head><body><h1>Jammu SWP Installation Claim Request Data</h1><table><thead><tr>${exportCols.map((c) => `<th>${escapeHtml(c.header)}</th>`).join('')}</tr></thead><tbody>${exportDataFormatted.map((r) => `<tr>${exportCols.map((c) => `<td>${escapeHtml(String((r as any)[c.accessor as string] || ''))}</td>`).join('')}</tr>`).join('')}</tbody></table><script>window.onload=function(){window.print();};</script></body></html>`);
    w.document.close();
    w.focus();
  };

  return (
    <div className="solar-erp-page ax-page">
      <style>{PAGE_CSS}</style>
      <style>{OVERLAY_CSS}</style>

      {/* ── Page Header ── */}
      <PageHead
        title="Jammu SWP Installation - View Claim"
        subtitle="Verification and audit desk for solar water pump milestone claims, vendor submission invoices, and settlement requests across Jammu"
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Vendor Management', href: '/vendor-management' },
          { label: 'Jammu', href: '/vendor-management/jammu' },
          { label: 'SWP', href: '/vendor-management/jammu/installation/swp/dashboard' },
          { label: 'View Claim' },
        ]}
      />

      {errorMsg && (
        <div className="ax-card" style={{ padding: '12px 16px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, marginBottom: 16, color: '#dc2626', fontSize: 13 }}>
          {errorMsg}
        </div>
      )}

      {/* ── 4 KPI Cards matching user specification ── */}
      <div className="asw-cards-row">
        <KpiCard
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            </svg>
          }
          tone="accent"
          label="Total Request"
          value={summary.total}
          sub="All SWP milestone claims"
        />
        <KpiCard
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          }
          tone="emerald"
          label="Claim Approved"
          value={summary.approved}
          sub="Passed & ready for payment"
        />
        <KpiCard
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
          }
          tone="red"
          label="Claim Rejected"
          value={summary.rejected}
          sub="Disallowed claims"
        />
        <KpiCard
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          }
          tone="amber"
          label="Claim Pending"
          value={summary.pending}
          sub="Awaiting admin verification"
        />
      </div>

      {/* ── Main Data Card ── */}
      <section className="ax-card ax-col--12">
        <div className="ax-card__header">
          <div className="ax-card__titles">
            <h2 className="ax-card__title">View Jammu SWP Claim Request Data</h2>
            <p className="ax-card__subtitle">Showing {filteredClaims.length} claim record(s)</p>
          </div>
          <div className="ax-card__actions">
            <div className="ax-cluster" style={actionsRowStyle}>
              <select
                className="ax-form-control"
                style={{ width: 140, height: 32, fontSize: 12, borderRadius: 6, border: '1px solid #cbd5e1' }}
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="1">Pending (1)</option>
                <option value="2">Approved (2)</option>
                <option value="3">Rejected (3)</option>
              </select>

              {searchQuery.trim() !== '' && (
                <button
                  type="button"
                  className="ax-btn ax-btn--ghost ax-btn--sm"
                  onClick={() => setSearchQuery('')}
                  style={{ height: 30, padding: '0 8px', fontSize: 'var(--ax-text-xs)' }}
                >
                  Reset
                </button>
              )}
              <SearchInput
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Search vendor, amount, remarks..."
                size="sm"
              />
              <TableExportToolbar
                onCopy={copyToClipboard}
                onExportCSV={exportToCSV}
                onExportExcel={exportToExcel}
                onExportPDF={exportToPDF}
              />
            </div>
          </div>
        </div>

        {/* ── Horizontally Scrollable Table with Exact Columns ── */}
        <div className="ax-table-wrap">
          <table className="ax-table ax-table--hover ula-table--wide" style={{ whiteSpace: 'nowrap', minWidth: 1200 }}>
            <thead className="ax-table__head">
              <tr>
                <th className="ax-table__th" style={{ width: 60, textAlign: 'center' }}>S.No.</th>
                <th className="ax-table__th">vendor Name</th>
                <th className="ax-table__th">Date</th>
                <th className="ax-table__th" style={{ textAlign: 'center' }}>Sites</th>
                <th className="ax-table__th" style={{ width: 100, textAlign: 'center' }}>Invoice</th>
                <th className="ax-table__th" style={{ textAlign: 'right' }}>Amount</th>
                <th className="ax-table__th">Remarks</th>
                <th className="ax-table__th">Verify Remarks</th>
                <th className="ax-table__th" style={{ width: 110, textAlign: 'center' }}>Status</th>
                <th className="ax-table__th" style={{ width: 110, textAlign: 'center' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={10} style={centerCell}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                      <span className="ax-spinner" aria-hidden="true" />
                      <span>Loading Jammu SWP claim requests...</span>
                    </div>
                  </td>
                </tr>
              ) : pagination.paged.length === 0 ? (
                <tr>
                  <td colSpan={10} style={centerCell}>
                    <TableEmptyState title="No Claims Found" description="No Jammu SWP claim requests found matching criteria." />
                  </td>
                </tr>
              ) : (
                pagination.paged.map((row, idx) => {
                  const globalIdx = (pagination.curPage - 1) * pagination.pageSize + idx + 1;
                  const st = row.claimStatus;

                  return (
                    <tr key={row.id}>
                      {/* 1. S.No. */}
                      <td className="ax-table__td" style={{ textAlign: 'center', fontWeight: 600 }}>
                        {globalIdx}
                      </td>

                      {/* 2. vendor Name */}
                      <td className="ax-table__td" style={{ fontWeight: 600, color: '#0f172a' }}>
                        {row.vendorName}
                      </td>

                      {/* 3. Date */}
                      <td className="ax-table__td">{row.date}</td>

                      {/* 4. Sites */}
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        {row.sites.length > 0 ? (
                          <button
                            type="button"
                            onClick={() => setViewSitesClaim(row)}
                            className="ax-btn ax-btn--ghost ax-btn--xs"
                            style={{
                              color: '#2559bf',
                              fontWeight: 700,
                              background: '#eff6ff',
                              border: '1px solid #bfdbfe',
                              borderRadius: 9999,
                              padding: '2px 10px',
                            }}
                            title="Click to view associated sites"
                          >
                            {row.sites.length} Site{row.sites.length === 1 ? '' : 's'} ↗
                          </button>
                        ) : (
                          <span style={{ color: '#94a3b8' }}>—</span>
                        )}
                      </td>

                      {/* 5. Invoice */}
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        {row.invoice ? (
                          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                            {/\.(jpe?g|png|webp|gif|svg)$/i.test(row.invoice) ? (
                              <button
                                type="button"
                                onClick={() => setLightbox({ url: row.invoice!, title: `Claim #${row.id} Invoice` })}
                                style={{
                                  border: '1px solid #cbd5e1',
                                  borderRadius: 6,
                                  padding: 2,
                                  background: '#fff',
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                }}
                                title="Click to preview Invoice image"
                              >
                                <img
                                  src={row.invoice}
                                  alt="Invoice"
                                  style={{ width: 44, height: 44, borderRadius: 4, objectFit: 'cover' }}
                                />
                              </button>
                            ) : (
                              <a
                                href={row.invoice}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 4,
                                  padding: '5px 10px',
                                  borderRadius: 6,
                                  background: '#eff4fc',
                                  color: '#2559bf',
                                  textDecoration: 'none',
                                  fontSize: 12,
                                  fontWeight: 600,
                                  border: '1px solid #bfd3f8',
                                }}
                                title="Open / Download Invoice"
                              >
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                  <polyline points="14 2 14 8 20 8" />
                                </svg>
                                <span>Invoice</span>
                              </a>
                            )}
                          </div>
                        ) : (
                          <span style={{ color: '#94a3b8' }}>—</span>
                        )}
                      </td>

                      {/* 6. Amount */}
                      <td className="ax-table__td" style={{ textAlign: 'right', fontWeight: 700, color: '#0f172a' }}>
                        {fmtCurrency(row.amount)}
                      </td>

                      {/* 7. Remarks */}
                      <td className="ax-table__td" style={{ maxWidth: 160 }}>
                        <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#64748b' }} title={row.remarks}>
                          {row.remarks}
                        </div>
                      </td>

                      {/* 8. Verify Remarks */}
                      <td className="ax-table__td" style={{ maxWidth: 160 }}>
                        <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#64748b' }} title={row.verifyRemarks}>
                          {row.verifyRemarks}
                        </div>
                      </td>

                      {/* 9. Status */}
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            padding: '3px 10px',
                            borderRadius: 9999,
                            fontSize: 11.5,
                            fontWeight: 700,
                            background:
                              st === 2 ? '#ecfdf5' : st === 3 ? '#fef2f2' : '#fffbeb',
                            color:
                              st === 2 ? '#059669' : st === 3 ? '#dc2626' : '#d97706',
                            border: `1px solid ${
                              st === 2 ? '#a7f3d0' : st === 3 ? '#fecaca' : '#fde68a'
                            }`,
                          }}
                        >
                          {st === 2 ? 'Approved' : st === 3 ? 'Rejected' : 'Pending'}
                        </span>
                      </td>

                      {/* 10. Action */}
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        {st === 1 ? (
                          <button
                            type="button"
                            onClick={() => {
                              setActionClaim(row);
                              setClaimStatus('2');
                              setClaimRemarks(row.verifyRemarks !== '—' ? row.verifyRemarks : '');
                            }}
                            style={{
                              padding: '5px 12px',
                              borderRadius: 6,
                              fontSize: 12,
                              fontWeight: 600,
                              background: '#2559bf',
                              color: '#fff',
                              border: 'none',
                              cursor: 'pointer',
                            }}
                          >
                            Verify Claim
                          </button>
                        ) : (
                          <span style={{ fontSize: 12, color: '#64748b' }}>Processed</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* ── Table Footer with Pagination ── */}
        <div className="ax-card__footer" style={footerStyle}>
          <div className="ula-pagination-left">
            <Pagination
              currentPage={pagination.curPage}
              totalItems={pagination.totalItems}
              pageSize={pagination.pageSize}
              onPageChange={pagination.setPage}
              onPageSizeChange={pagination.setPageSize}
              pageSizeOptions={[10, 25, 50, 100, 200]}
            />
          </div>
        </div>
      </section>

      {/* ── Verify Claim Modal (#14) ── */}
      <Modal
        open={Boolean(actionClaim)}
        onClose={() => {
          if (!submitting) {
            setActionClaim(null);
            setClaimStatus('2');
            setClaimRemarks('');
          }
        }}
        title="Verify Claim Status"
        subtitle={actionClaim ? `Claim #${actionClaim.id} · ${actionClaim.vendorName} · ${fmtCurrency(actionClaim.amount)}` : undefined}
      >
        <form onSubmit={handleVerifyClaim} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 6, color: '#334155' }}>
              Status <span style={{ color: '#dc2626' }}>*</span>
            </label>
            <select
              value={claimStatus}
              onChange={(e) => setClaimStatus(e.target.value as '2' | '3')}
              required
              className="ax-form-control"
              style={{
                width: '100%',
                padding: '9px 12px',
                borderRadius: 8,
                border: '1px solid #cbd5e1',
                fontSize: 13,
                outline: 'none',
              }}
            >
              <option value="2">Approved (2)</option>
              <option value="3">Rejected (3)</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 6, color: '#334155' }}>
              Remark
            </label>
            <textarea
              rows={3}
              value={claimRemarks}
              onChange={(e) => setClaimRemarks(e.target.value)}
              placeholder="Enter audit approval or rejection rationale..."
              className="ax-form-control"
              style={{
                width: '100%',
                padding: '9px 12px',
                borderRadius: 8,
                border: '1px solid #cbd5e1',
                fontSize: 13,
                resize: 'vertical',
                outline: 'none',
              }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
            <button
              type="button"
              disabled={submitting}
              onClick={() => {
                setActionClaim(null);
                setClaimStatus('2');
                setClaimRemarks('');
              }}
              className="ax-btn ax-btn--secondary"
              style={{ padding: '8px 16px', fontSize: 13, borderRadius: 8 }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="ax-btn ax-btn--primary"
              style={{
                padding: '8px 20px',
                fontSize: 13,
                borderRadius: 8,
                background: '#2559bf',
                color: '#fff',
                fontWeight: 600,
                border: 'none',
                cursor: submitting ? 'not-allowed' : 'pointer',
              }}
            >
              {submitting ? 'Submitting...' : 'Submit'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ── Associated Sites Modal ── */}
      <Modal
        open={Boolean(viewSitesClaim)}
        onClose={() => setViewSitesClaim(null)}
        title={`Claim #${viewSitesClaim?.id} Associated Sites`}
        subtitle={`Vendor: ${viewSitesClaim?.vendorName} · ${viewSitesClaim?.sites.length || 0} Sites`}
        maxWidth={620}
      >
        <div style={{ maxHeight: 350, overflowY: 'auto' }}>
          <table className="ax-table" style={{ width: '100%', fontSize: 12.5, borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left' }}>
                <th style={{ padding: '8px 12px' }}>#</th>
                <th style={{ padding: '8px 12px' }}>Site ID</th>
                <th style={{ padding: '8px 12px' }}>Farmer / Applicant Name</th>
              </tr>
            </thead>
            <tbody>
              {(viewSitesClaim?.sites || []).map((s, i) => (
                <tr key={s.id || i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '8px 12px', fontWeight: 600 }}>{i + 1}</td>
                  <td style={{ padding: '8px 12px', fontFamily: 'monospace' }}>#{s.id}</td>
                  <td style={{ padding: '8px 12px', fontWeight: 600 }}>{s.farmer_name || s.f_farmer_name || `Farmer #${s.id}`}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Modal>

      {/* ── Lightbox Modal ── */}
      {lightbox && (
        <LightboxModal
          open={Boolean(lightbox)}
          onClose={() => setLightbox(null)}
          url={lightbox.url}
          title={lightbox.title}
        />
      )}
    </div>
  );
}

export default VerifySwpClaim;
