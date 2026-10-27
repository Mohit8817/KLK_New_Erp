<<<<<<< HEAD
﻿import { useCallback, useEffect, useMemo, useRef, useState, useDeferredValue, type FormEvent } from 'react';
=======
import { useCallback, useEffect, useMemo, useState, useDeferredValue, type CSSProperties, type FormEvent, type ReactNode } from 'react';
>>>>>>> f49923685403717f9e19cbf9dfbdf409606a2966
import { PageHead } from '../../../../shell/PageHead';
import {
  biharSslInstallationService,
  getMediaUrl,
  getCompanyId,
  type SslClaimRaisedItem,
} from '../../bihar-services';
import {
  TableExportToolbar,
  SearchInput,
  Pagination,
  TableEmptyState,
<<<<<<< HEAD
  TableSkeleton,
  KpiSkeleton,
  type ExportColumn,
  exportDataToCSV,
  exportDataToExcel,
  copyTableDataToClipboard,
  printTableData,
} from '../../../../../common';

const BLUE_PRIMARY = '#2563eb';
const GREEN_EMERALD = '#10b981';
const AMBER_WARNING = '#f59e0b';
const RED_DANGER = '#ef4444';

const ICON_CLAIMS = (
  <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
  </svg>
);
const ICON_RUPEE = (
  <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 3h12M6 8h12M6 13l8.5 8M6 13h3a4 4 0 0 0 0-8" />
  </svg>
);
const ICON_APPROVED = (
  <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);
const ICON_ELIGIBLE = (
  <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 18h6M10 22h4M12 2a7 7 0 0 0-4 12.7V17a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1v-2.3A7 7 0 0 0 12 2z" />
  </svg>
);


const num = (x: unknown) => (Number(x) || 0).toLocaleString('en-IN');
const cur = (x: unknown) => `₹${(Number(x) || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

const MODAL_FIELD_STYLES = `
  .ax-modern-field {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .ax-modern-label {
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 12px;
    font-weight: 600;
    color: var(--ax-text-strong, #1e293b);
    letter-spacing: 0.02em;
    margin: 0;
  }
  .ax-modern-req {
    color: #ef4444;
    font-weight: 700;
    margin-left: 3px;
  }
  .ax-modern-input-wrap {
    display: flex;
    align-items: center;
    border: 1.5px solid var(--ax-border, #cbd5e1);
    border-radius: 9px;
    background: var(--ax-surface-solid, #ffffff);
    transition: all 0.2s ease;
    overflow: hidden;
  }
  .ax-modern-input-wrap:focus-within {
    border-color: var(--ax-accent, #3b82f6);
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--ax-accent, #3b82f6) 18%, transparent);
  }
  .ax-modern-addon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0 13px;
    height: 42px;
    background: var(--ax-surface-subtle, #f8fafc);
    border-right: 1.5px solid var(--ax-border, #cbd5e1);
    color: var(--ax-text-muted, #64748b);
    font-size: 14px;
    font-weight: 700;
    user-select: none;
  }
  .ax-modern-input {
    width: 100%;
    height: 42px;
    padding: 0 14px;
    border: none;
    outline: none;
    font-size: 13.5px;
    color: var(--ax-text-strong, #0f172a);
    background: transparent;
  }
  .ax-modern-input::placeholder {
    color: var(--ax-text-muted, #94a3b8);
  }
  .ax-modern-textarea {
    width: 100%;
    min-height: 90px;
    padding: 10px 14px;
    border: 1.5px solid var(--ax-border, #cbd5e1);
    border-radius: 9px;
    font-size: 13px;
    color: var(--ax-text-strong, #0f172a);
    background: var(--ax-surface-solid, #ffffff);
    outline: none;
    transition: all 0.2s ease;
    resize: vertical;
    line-height: 1.5;
  }
  .ax-modern-textarea:focus {
    border-color: var(--ax-accent, #3b82f6);
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--ax-accent, #3b82f6) 18%, transparent);
  }
  .ax-modern-dropzone {
    border: 1.5px dashed var(--ax-border, #cbd5e1);
    border-radius: 10px;
    padding: 16px;
    background: var(--ax-surface-subtle, #f8fafc);
    text-align: center;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 8px;
  }
  .ax-modern-dropzone:hover {
    border-color: var(--ax-accent, #3b82f6);
    background: color-mix(in srgb, var(--ax-accent, #3b82f6) 5%, var(--ax-surface-subtle, #f8fafc));
  }
  .ax-modern-dropzone__icon {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: color-mix(in srgb, var(--ax-accent, #3b82f6) 10%, #ffffff);
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .ax-modern-file-chip {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 14px;
    background: #f0fdf4;
    border: 1.5px solid #86efac;
    border-radius: 9px;
  }
  .ax-modern-file-chip__icon {
    width: 32px;
    height: 32px;
    border-radius: 8px;
    background: #dcfce7;
    display: flex;
    align-items: center;
    justify-content: center;
  }
`;

export function Bihar_Installation_SSL_ClaimRequest() {
  const [loading, setLoading] = useState(true);
  const [claims, setClaims] = useState<SslClaimRaisedItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const raiseFileRef = useRef<HTMLInputElement>(null);
  const editFileRef = useRef<HTMLInputElement>(null);
  const [eligibleSiteIds, setEligibleSiteIds] = useState<number[]>([]);

  // Raise Claim Modal State
  const [raiseModalOpen, setRaiseModalOpen] = useState(false);
  const [claimAmount, setClaimAmount] = useState('');
  const [siteIdsInput, setSiteIdsInput] = useState('');
  const [claimInvoiceFile, setClaimInvoiceFile] = useState<File | null>(null);
  const [raiseSubmitting, setRaiseSubmitting] = useState(false);
  const [raiseError, setRaiseError] = useState<string | null>(null);
  const [raiseSuccess, setRaiseSuccess] = useState<string | null>(null);

  // Edit Claim Modal State
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingClaim, setEditingClaim] = useState<SslClaimRaisedItem | null>(null);
  const [editAmount, setEditAmount] = useState('');
  const [editInvoiceFile, setEditInvoiceFile] = useState<File | null>(null);
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const deferredQuery = useDeferredValue(searchQuery);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [claimList, installedData] = await Promise.all([
        biharSslInstallationService.getViewClaimDetails(),
        biharSslInstallationService.getViewInstalledLights(),
      ]);
      setClaims(Array.isArray(claimList) ? claimList : []);
      if (installedData?.claimed_applicable_ids) {
        setEligibleSiteIds(installedData.claimed_applicable_ids);
        setSiteIdsInput(installedData.claimed_applicable_ids.join(', '));
      }
    } catch (err) {
      console.error('[ClaimRequest] error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Filtered claims
  const filtered = useMemo(() => {
    const q = deferredQuery.trim().toLowerCase();
    return claims.filter((c) => {
      if (q) {
        const matches =
          (c.vendor_name && c.vendor_name.toLowerCase().includes(q)) ||
          (c.vendor && c.vendor.toLowerCase().includes(q)) ||
          (c.state && c.state.toLowerCase().includes(q)) ||
          String(c.claim_amount).includes(q) ||
          String(c.claim_site_count).includes(q);
        if (!matches) return false;
      }
      if (statusFilter !== 'all' && String(c.claim_status) !== statusFilter) {
        return false;
      }
      return true;
    });
  }, [claims, deferredQuery, statusFilter]);

  // Summary Metrics
  const metrics = useMemo(() => {
    const totalClaims = claims.length;
    let totalClaimAmount = 0;
    let approvedCount = 0;
    let pendingCount = 0;

    claims.forEach((c) => {
      totalClaimAmount += Number(c.claim_amount) || 0;
      if (c.claim_status === 1) approvedCount++;
      else if (c.claim_status === 0) pendingCount++;
    });

    return {
      totalClaims,
      totalClaimAmount,
      approvedCount,
      pendingCount,
      eligibleSitesCount: eligibleSiteIds.length,
    };
  }, [claims, eligibleSiteIds]);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(100);

  useEffect(() => {
    setCurrentPage(1);
  }, [deferredQuery, statusFilter]);

  const paginated = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, currentPage, pageSize]);

  // Handle Raise Claim Submit
  const handleRaiseSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setRaiseError(null);
    setRaiseSuccess(null);

    const cleanSites = siteIdsInput
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    if (cleanSites.length < 100) {
      setRaiseError(`Minimum 100 eligible sites required to raise a claim. Currently provided: ${cleanSites.length}`);
      return;
    }
    if (!claimAmount || Number(claimAmount) <= 0) {
      setRaiseError('Please enter a valid claim amount.');
      return;
    }
    if (!claimInvoiceFile) {
      setRaiseError('Please select a claim invoice file.');
      return;
    }

    setRaiseSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('claim_amount', claimAmount.trim());
      fd.append('claim_invoice', claimInvoiceFile);
      fd.append('site_ids', cleanSites.join(','));

      const res = await biharSslInstallationService.raiseClaim(fd);
      setRaiseSuccess(res.message || 'Claim Raised Successfully!!!');
      await loadData();
      setTimeout(() => {
        setRaiseModalOpen(false);
        setClaimAmount('');
        setClaimInvoiceFile(null);
      }, 1200);
    } catch (err: any) {
      console.error('[Raise Claim] error:', err);
      setRaiseError(err.message || 'Failed to raise claim request.');
    } finally {
      setRaiseSubmitting(false);
    }
  };

  // Open Edit Claim Modal
  const handleOpenEdit = (claim: SslClaimRaisedItem) => {
    setEditingClaim(claim);
    setEditAmount(String(claim.claim_amount || ''));
    setEditInvoiceFile(null);
    setEditError(null);
    setEditModalOpen(true);
  };

  // Handle Update Claim Submit
  const handleEditSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingClaim) return;

    setEditError(null);
    if (!editAmount || Number(editAmount) <= 0) {
      setEditError('Please enter a valid claim amount.');
      return;
    }

    setEditSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('site_ids', String(editingClaim.id));
      fd.append('claim_amount', editAmount.trim());
      if (editInvoiceFile) {
        fd.append('claim_invoice', editInvoiceFile);
      }

      await biharSslInstallationService.updateClaimRaised(fd);
      await loadData();
      setEditModalOpen(false);
      setEditingClaim(null);
    } catch (err: any) {
      console.error('[Update Claim] error:', err);
      setEditError(err.message || 'Failed to update claim raised.');
    } finally {
      setEditSubmitting(false);
    }
  };

  // Handle Download PDF
  const handleDownloadPdf = async (claimId: number) => {
    try {
      const blob = await biharSslInstallationService.downloadClaimPdf(claimId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Bihar_SSL_Claim_${claimId}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      alert(`Could not download PDF: ${err.message}`);
    }
  };

  // Export Columns
  const exportCols: ExportColumn<SslClaimRaisedItem>[] = [
    { header: 'Vendor Name', accessor: (r) => r.vendor_name || r.vendor || '—' },
    { header: 'State', accessor: 'state' },
    { header: 'Claim Raised Date', accessor: 'claim_raised_date' },
    { header: 'Site Count', accessor: 'claim_site_count' },
    { header: 'Claim Amount', accessor: 'claim_amount' },
    { header: 'Claim Update Date', accessor: 'claim_update_date' },
    {
      header: 'Claim Status',
      accessor: (r) => (r.claim_status === 1 ? 'Approved' : r.claim_status === 2 ? 'Rejected' : 'Pending'),
    },
    { header: 'Payment Status', accessor: 'payment_status' },
    { header: 'Payment Date', accessor: 'payment_date' },
    { header: 'Payment Amount', accessor: 'payment_amount' },
  ];

  return (
    <div className="ax-page solar-erp-page">
      <PageHead
        title="View SSL Claim Request"
        subtitle="Manage vendor installation payment claims and billing certifications (Min. 100 Sites)"
        breadcrumbs={[
          { label: 'Bihar' },
          { label: 'Installation' },
          { label: 'SSL', href: '/v/ssl/installation-dashboard' },
          { label: 'Claim Request' },
        ]}
        actions={
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button
              type="button"
              className="ax-btn ax-btn--primary ax-btn--sm"
              onClick={() => {
                setRaiseError(null);
                setRaiseSuccess(null);
                setRaiseModalOpen(true);
              }}
            >
              <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <line x1={12} y1={5} x2={12} y2={19} />
                <line x1={5} y1={12} x2={19} y2={12} />
              </svg>
              <span>Raise Claim</span>
            </button>
            <button
              type="button"
              className="ax-btn ax-btn--ghost ax-btn--sm"
              onClick={loadData}
              title="Refresh claims"
            >
              <svg
                width={14}
                height={14}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }}
              >
                <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
              </svg>
              <span>Refresh</span>
            </button>
          </div>
        }
      />

      {/* ── KPI Row ── */}
      {loading ? (
        <KpiSkeleton count={4} />
      ) : (
        <div className="ax-dash-grid" style={{ marginBottom: 18 }}>
          <div className="ax-card ax-col--3" style={{ padding: '14px 18px', borderRadius: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <span style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(37, 99, 235, 0.12)', color: BLUE_PRIMARY, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {ICON_CLAIMS}
              </span>
              <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ax-text-muted)', letterSpacing: '0.04em' }}>
                Total Claims Raised
              </span>
            </div>
            <div style={{ fontSize: 24, fontWeight: 800, color: BLUE_PRIMARY, marginTop: 4 }}>
              {num(metrics.totalClaims)}
            </div>
            <div style={{ fontSize: 12, color: 'var(--ax-text-muted)', marginTop: 2 }}>
              Submitted invoices
            </div>
          </div>

          <div className="ax-card ax-col--3" style={{ padding: '14px 18px', borderRadius: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <span style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(100, 116, 139, 0.12)', color: 'var(--ax-text-strong)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {ICON_RUPEE}
              </span>
              <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ax-text-muted)', letterSpacing: '0.04em' }}>
                Total Claim Amount
              </span>
            </div>
            <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--ax-text-strong)', marginTop: 4 }}>
              {cur(metrics.totalClaimAmount)}
            </div>
            <div style={{ fontSize: 12, color: 'var(--ax-text-muted)', marginTop: 2 }}>
              Combined billing value
            </div>
          </div>

          <div className="ax-card ax-col--3" style={{ padding: '14px 18px', borderRadius: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <span style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(16, 185, 129, 0.14)', color: GREEN_EMERALD, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {ICON_APPROVED}
              </span>
              <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ax-text-muted)', letterSpacing: '0.04em' }}>
                Claims Approved
              </span>
            </div>
            <div style={{ fontSize: 24, fontWeight: 800, color: GREEN_EMERALD, marginTop: 4 }}>
              {num(metrics.approvedCount)}
            </div>
            <div style={{ fontSize: 12, color: 'var(--ax-text-muted)', marginTop: 2 }}>
              {num(metrics.pendingCount)} pending approval
            </div>
          </div>

          <div className="ax-card ax-col--3" style={{ padding: '14px 18px', borderRadius: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <span style={{ width: 28, height: 28, borderRadius: 8, background: metrics.eligibleSitesCount >= 100 ? 'rgba(16, 185, 129, 0.14)' : 'rgba(245, 158, 11, 0.14)', color: metrics.eligibleSitesCount >= 100 ? GREEN_EMERALD : AMBER_WARNING, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {ICON_ELIGIBLE}
              </span>
              <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ax-text-muted)', letterSpacing: '0.04em' }}>
                Eligible Sites Available
              </span>
            </div>
            <div style={{ fontSize: 24, fontWeight: 800, color: metrics.eligibleSitesCount >= 100 ? GREEN_EMERALD : AMBER_WARNING, marginTop: 4 }}>
              {num(metrics.eligibleSitesCount)}
            </div>
            <div style={{ fontSize: 12, color: 'var(--ax-text-muted)', marginTop: 2 }}>
              {metrics.eligibleSitesCount >= 100 ? 'Eligible to raise claim' : 'Need min 100 sites'}
            </div>
=======
  usePagination,
  TableSkeleton,
  KpiSkeleton,
  copyTableDataToClipboard,
  exportDataToCSV,
  exportDataToExcel,
  printTableData,
  type ExportColumn,
} from '../../../../../common';

/* ── Colors & Formatter ── */
const DASH = '—';
const cur = (x: unknown) => `₹${(Number(x) || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

type KpiTone = 'blue' | 'cyan' | 'emerald' | 'amber';

const KPI_TONE: Record<KpiTone, { bg: string; fg: string }> = {
  blue: { bg: 'color-mix(in srgb, var(--ax-accent, #2563eb) 12%, transparent)', fg: 'var(--ax-accent, #2563eb)' },
  cyan: { bg: 'color-mix(in srgb, #06b6d4 14%, transparent)', fg: '#0891b2' },
  emerald: { bg: 'color-mix(in srgb, #10b981 14%, transparent)', fg: '#059669' },
  amber: { bg: 'color-mix(in srgb, #f59e0b 14%, transparent)', fg: '#d97706' },
};

/* ── ULA Payment KPI & Page Styling ── */
const PAGE_CSS = `
  .solar-erp-page { --bsv-card-radius: var(--ax-radius-lg); --ula-accent: var(--ax-accent, #2563eb); }
  .solar-erp-page .ax-dash-grid { align-items: stretch; gap: var(--ax-space-4); margin-bottom: var(--ax-space-5); }
  .solar-erp-page .bsv-payment-kpi {
    min-width: 0;
    overflow: hidden;
    border: 1px solid var(--ax-border);
    border-radius: var(--bsv-card-radius);
    background: var(--ax-bg-surface, var(--ax-surface-solid));
    box-shadow: var(--ax-shadow-sm);
    transition: box-shadow .18s ease, border-color .18s ease, transform .18s ease;
  }
  .solar-erp-page .bsv-payment-kpi:hover {
    box-shadow: var(--ax-shadow-md);
    border-color: var(--ax-border);
    transform: translateY(-1px);
  }
  .solar-erp-page .bsv-payment-kpi__body {
    height: 100%;
    padding: 12px 14px;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .solar-erp-page .bsv-payment-kpi__head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 6px;
    min-width: 0;
  }
  .solar-erp-page .bsv-payment-kpi__title-wrap {
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 0;
  }
  .solar-erp-page .bsv-payment-kpi__icon {
    width: 28px;
    height: 28px;
    flex-shrink: 0;
    border-radius: var(--ax-radius-md);
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }
  .solar-erp-page .bsv-payment-kpi__icon svg { width: 16px; height: 16px; }
  .solar-erp-page .bsv-payment-kpi__label {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 12px;
    font-weight: 600;
    color: var(--ax-text-muted);
  }
  .solar-erp-page .bsv-payment-kpi__caption {
    margin-top: 2px;
    font-size: 11px;
    line-height: 1.35;
    color: var(--ax-text-muted);
  }
  .solar-erp-page .bsv-payment-kpi__value-row {
    display: flex;
    align-items: baseline;
    gap: 6px;
    flex-wrap: wrap;
    min-width: 0;
  }
  .solar-erp-page .bsv-payment-kpi__value {
    font-family: var(--ax-font-display);
    font-size: 1.35rem;
    line-height: 1.1;
    font-weight: 700;
    color: var(--ax-text-strong);
    font-variant-numeric: tabular-nums;
  }
  .solar-erp-page .bsv-payment-kpi__unit {
    font-size: 11px;
    font-weight: 500;
    color: var(--ax-text-muted);
  }

  /* Table Card */
  .solar-erp-page .ax-card {
    min-width: 0;
    border: 1px solid var(--ax-border-subtle, #e2e8f0);
    border-radius: var(--ax-radius-xl, 16px);
    box-shadow: var(--ax-shadow-sm, 0 2px 8px rgba(15,23,42,.04));
    overflow: hidden;
    background: var(--ax-surface-solid, #fff);
  }
  .solar-erp-page .ax-card__header {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 14px;
    padding: 16px 20px;
    background: var(--ax-surface-subtle, #f8fafc);
    border-bottom: 1px solid var(--ax-border-subtle, #e2e8f0);
  }
  .solar-erp-page .ax-card__titles {
    flex: 1 1 220px;
    min-width: 180px;
    max-width: 100%;
  }
  .solar-erp-page .ax-card__title {
    font-size: var(--ax-text-lg, 17px);
    font-weight: 700;
    color: var(--ax-text-strong, #0f172a);
    margin: 0;
  }
  .solar-erp-page .ax-card__subtitle {
    margin: 3px 0 0 0;
    font-size: 12px;
    color: var(--ax-text-muted, #64748b);
  }
  .solar-erp-page .ax-card__actions {
    flex: 0 1 auto;
    min-width: 0;
    margin-left: auto;
    display: flex;
    align-items: center;
    justify-content: flex-end;
    flex-wrap: wrap;
    gap: 8px;
  }

  /* Table */
  .solar-erp-page .ax-table-wrap {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }
  .solar-erp-page .ula-table--wide { min-width: 1800px; white-space: nowrap; }
  .solar-erp-page .ax-table { border-collapse: separate; border-spacing: 0; }
  .solar-erp-page .ax-table__th {
    padding: 12px 14px;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: .05em;
    text-transform: uppercase;
    color: var(--ax-text-muted, #64748b);
    background: var(--ax-surface-subtle, #f8fafc);
    border-bottom: 1px solid var(--ax-border, #e2e8f0);
    white-space: nowrap;
  }
  .solar-erp-page .ax-table__td {
    padding: 11px 14px;
    vertical-align: middle;
    font-size: var(--ax-text-sm, 13px);
    border-bottom: 1px solid var(--ax-border-subtle, #edf2f7);
  }
  .solar-erp-page .ax-table__row:last-child .ax-table__td { border-bottom: 0; }
  .solar-erp-page .ax-table--hover .ax-table__row:hover .ax-table__td {
    background: color-mix(in srgb, var(--ula-accent) 4%, var(--ax-surface-solid, #fff));
  }
  .solar-erp-page .ula-sticky-first th:first-child,
  .solar-erp-page .ula-sticky-first td:first-child {
    position: sticky;
    left: 0;
    z-index: 2;
    background: var(--ax-surface-solid, #fff);
    box-shadow: 1px 0 0 var(--ax-border-subtle, #e2e8f0);
  }
  .solar-erp-page .ula-sticky-first th:first-child {
    z-index: 3;
    background: var(--ax-surface-subtle, #f8fafc);
  }

  /* Left-aligned ULA Pagination */
  .solar-erp-page .ax-card__footer {
    width: 100%;
    box-sizing: border-box;
    background: var(--ax-surface-subtle, #f8fafc);
    padding: 10px 16px;
    border-top: 1px solid var(--ax-border-subtle, #e2e8f0);
  }
  .solar-erp-page .ula-pagination-left {
    width: 100%;
    display: flex;
    justify-content: flex-start;
    align-items: center;
    margin: 0;
    overflow-x: auto;
  }
  .solar-erp-page .ula-pagination-left > * { margin-left: 0 !important; margin-right: 0 !important; }

  /* Modal */
  .solar-erp-page .ax-modal {
    border: 1px solid var(--ax-border, #e2e8f0);
    border-radius: var(--ax-radius-xl, 16px);
    box-shadow: 0 24px 70px rgba(15,23,42,.2);
    overflow: hidden;
  }
  .solar-erp-page .ax-modal__header {
    background: var(--ax-surface-subtle, #f8fafc);
    border-bottom: 1px solid var(--ax-border-subtle, #e2e8f0);
  }
`;

const ICON_PROPS = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.75,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
};

const ICON_REFRESH = (
  <svg className="ax-btn__icon" {...ICON_PROPS}>
    <path d="M20 11a8.1 8.1 0 0 0 -15.5 -2m-.5 -4v4h4" />
    <path d="M4 13a8.1 8.1 0 0 0 15.5 2m.5 4v-4h-4" />
  </svg>
);

const ICON_PLUS = (
  <svg className="ax-btn__icon" {...ICON_PROPS}>
    <path d="M12 5l0 14" />
    <path d="M5 12l14 0" />
  </svg>
);

const ICON_EDIT = (
  <svg style={{ width: 14, height: 14 }} {...ICON_PROPS}>
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
  </svg>
);

function PaymentKpiCard({
  icon,
  tone,
  label,
  value,
  unit,
  sub,
  badge,
}: {
  icon: ReactNode;
  tone: KpiTone;
  label: string;
  value: ReactNode;
  unit?: string;
  sub: string;
  badge: string;
}) {
  const t = KPI_TONE[tone];
  return (
    <div className="bsv-payment-kpi ax-col--3" role="region" aria-label={label}>
      <div className="bsv-payment-kpi__body">
        <div className="bsv-payment-kpi__head">
          <div className="bsv-payment-kpi__title-wrap">
            <span className="bsv-payment-kpi__icon" style={{ background: t.bg, color: t.fg }}>
              <svg {...ICON_PROPS}>{icon}</svg>
            </span>
            <span className="bsv-payment-kpi__label">{label}</span>
>>>>>>> f49923685403717f9e19cbf9dfbdf409606a2966
          </div>
          <span className="ax-badge ax-badge--soft ax-badge--neutral ax-badge--pill">{badge}</span>
        </div>
<<<<<<< HEAD
      )}

      {/* ── Table Container ── */}
      <section className="ax-card" style={{ borderRadius: 12, overflow: 'hidden' }}>
        <div
          className="ax-card__header"
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--ax-border, #e2e8f0)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          {/* Status Tabs */}
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button
              type="button"
              className={`ax-btn ax-btn--sm ${statusFilter === 'all' ? 'ax-btn--primary' : 'ax-btn--secondary'}`}
              onClick={() => { setStatusFilter('all'); setCurrentPage(1); }}
            >
              All Claims ({claims.length})
            </button>
            <button
              type="button"
              className={`ax-btn ax-btn--sm ${statusFilter === '0' ? 'ax-btn--primary' : 'ax-btn--secondary'}`}
              onClick={() => { setStatusFilter('0'); setCurrentPage(1); }}
            >
              Pending ({metrics.pendingCount})
            </button>
            <button
              type="button"
              className={`ax-btn ax-btn--sm ${statusFilter === '1' ? 'ax-btn--primary' : 'ax-btn--secondary'}`}
              onClick={() => { setStatusFilter('1'); setCurrentPage(1); }}
            >
              Approved ({metrics.approvedCount})
            </button>
          </div>

          {/* Search & Export Toolbar */}
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <SearchInput
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search vendor, amount…"
              size="sm"
              ariaLabel="Search claim requests"
            />
            <TableExportToolbar
              onCopy={() => copyTableDataToClipboard(filtered, exportCols)}
              onExportCSV={() => exportDataToCSV('Bihar_SSL_Claims', filtered, exportCols)}
              onExportExcel={() => exportDataToExcel('Bihar_SSL_Claims', filtered, exportCols)}
              onExportPDF={() => printTableData('Bihar SSL Claim Requests', filtered, exportCols)}
            />
          </div>
        </div>

        {/* Data Table */}
        {loading ? (
          <TableSkeleton columns={14} rows={6} showCard={false} />
        ) : (
          <div className="ax-table-wrap" style={{ margin: 0, border: 'none' }}>
            <table className="ax-table ax-table--hover" style={{ width: '100%', borderCollapse: 'collapse', minWidth: 1200 }}>
              <thead>
                <tr style={{ background: 'var(--ax-surface-subtle, #f8fafc)', borderBottom: '1px solid var(--ax-border, #e2e8f0)' }}>
                  <th style={{ padding: '10px 12px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ax-text-subtle)', width: 50 }}>Sr. No.</th>
                  <th style={{ padding: '10px 12px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ax-text-subtle)', textAlign: 'left' }}>Vendor Name</th>
                  <th style={{ padding: '10px 12px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ax-text-subtle)', textAlign: 'left' }}>State</th>
                  <th style={{ padding: '10px 12px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ax-text-subtle)', textAlign: 'left' }}>Claim Raised Date</th>
                  <th style={{ padding: '10px 12px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ax-text-subtle)', textAlign: 'right' }}>Site Count</th>
                  <th style={{ padding: '10px 12px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ax-text-subtle)', textAlign: 'center' }}>Claim Invoice</th>
                  <th style={{ padding: '10px 12px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ax-text-subtle)', textAlign: 'right' }}>Claim Amount</th>
                  <th style={{ padding: '10px 12px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ax-text-subtle)', textAlign: 'left' }}>Claim Update Date</th>
                  <th style={{ padding: '10px 12px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ax-text-subtle)', textAlign: 'center' }}>Claim Status</th>
                  <th style={{ padding: '10px 12px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ax-text-subtle)', textAlign: 'center' }}>Payment Status</th>
                  <th style={{ padding: '10px 12px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ax-text-subtle)', textAlign: 'left' }}>Payment Date</th>
                  <th style={{ padding: '10px 12px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ax-text-subtle)', textAlign: 'right' }}>Payment Amount</th>
                  <th style={{ padding: '10px 12px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ax-text-subtle)', textAlign: 'left' }}>Payment Remark</th>
                  <th style={{ padding: '10px 12px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ax-text-subtle)', textAlign: 'center', width: 120 }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {paginated.length === 0 ? (
                  <tr>
                    <td colSpan={14} style={{ padding: 40, textAlign: 'center' }}>
                      <TableEmptyState
                        title="No Claims Found"
                        message={searchQuery ? `No records match "${searchQuery}"` : 'No claim requests available.'}
                      />
                    </td>
                  </tr>
                ) : (
                  paginated.map((r, idx) => {
                    const rowNum = (currentPage - 1) * pageSize + idx + 1;
                    const invoiceUrl = getMediaUrl(r.claim_invoice);
                    const isApproved = r.claim_status === 1;
                    const isRejected = r.claim_status === 2;

                    return (
                      <tr key={r.id || idx} style={{ borderBottom: '1px solid var(--ax-border, #f1f5f9)' }}>
                        <td style={{ padding: '10px 12px', fontSize: 12, color: 'var(--ax-text-subtle)' }}>{rowNum}</td>
                        <td style={{ padding: '10px 12px', fontWeight: 700, color: 'var(--ax-text-strong)' }}>
                          {r.vendor_name || r.vendor || '—'}
                        </td>
                        <td style={{ padding: '10px 12px', textTransform: 'capitalize' }}>{r.state || 'Bihar'}</td>
                        <td style={{ padding: '10px 12px', fontSize: 12.5 }}>{r.claim_raised_date || '—'}</td>
                        <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 700, color: BLUE_PRIMARY }}>
                          {num(r.claim_site_count)}
                        </td>
                        <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                          {invoiceUrl ? (
                            <a
                              href={invoiceUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="ax-btn ax-btn--ghost ax-btn--sm"
                              style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: BLUE_PRIMARY }}
                            >
                              <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                <polyline points="14 2 14 8 20 8" />
                              </svg>
                              <span>Invoice</span>
                            </a>
                          ) : (
                            <span style={{ color: 'var(--ax-text-subtle)', fontSize: 12 }}>—</span>
                          )}
                        </td>
                        <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 700 }}>
                          {cur(r.claim_amount)}
                        </td>
                        <td style={{ padding: '10px 12px', fontSize: 12.5 }}>{r.claim_update_date || '—'}</td>
                        <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                          <span
                            style={{
                              display: 'inline-block',
                              padding: '2px 8px',
                              borderRadius: 6,
                              fontSize: 11,
                              fontWeight: 700,
                              background: isApproved ? '#ecfdf5' : isRejected ? '#fef2f2' : '#fffbeb',
                              color: isApproved ? GREEN_EMERALD : isRejected ? RED_DANGER : AMBER_WARNING,
                            }}
                          >
                            {isApproved ? 'Approved' : isRejected ? 'Rejected' : 'Pending'}
                          </span>
                        </td>
                        <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                          <span
                            style={{
                              display: 'inline-block',
                              padding: '2px 8px',
                              borderRadius: 6,
                              fontSize: 11,
                              fontWeight: 700,
                              background: r.payment_status === 1 || r.payment_status === 'Paid' ? '#ecfdf5' : '#fffbeb',
                              color: r.payment_status === 1 || r.payment_status === 'Paid' ? GREEN_EMERALD : AMBER_WARNING,
                            }}
                          >
                            {r.payment_status || 'Pending'}
                          </span>
                        </td>
                        <td style={{ padding: '10px 12px', fontSize: 12.5 }}>{r.payment_date || '—'}</td>
                        <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 600 }}>
                          {r.payment_amount ? cur(r.payment_amount) : '—'}
                        </td>
                        <td style={{ padding: '10px 12px', fontSize: 12, maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={r.payment_remark || ''}>
                          {r.payment_remark || '—'}
                        </td>
                        <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                          <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                         
                            <button
                              type="button"
                              className="ax-btn ax-btn--secondary ax-btn--sm"
                              onClick={() => handleOpenEdit(r)}
                              title="Update claim details"
                            >
                              Edit
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        <div className="ax-card__footer" style={{ padding: '12px 20px', borderTop: '1px solid var(--ax-border, #e2e8f0)' }}>
          <div className="ula-pagination-left">
            <Pagination
              currentPage={currentPage}
              totalItems={filtered.length}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
              onPageSizeChange={(sz) => {
                setPageSize(sz);
                setCurrentPage(1);
              }}
              pageSizeOptions={[25, 50, 100, 200]}
            />
          </div>
        </div>
      </section>

            <style>{MODAL_FIELD_STYLES}</style>

      {/* ── Raise Claim Modal (Minimum 100 Sites Rule) ── */}
      {raiseModalOpen && (
        <div
          className="ax-modal"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: 20,
          }}
          onClick={() => {
            if (!raiseSubmitting) setRaiseModalOpen(false);
          }}
        >
          <div
            className="ax-modal__dialog"
            style={{
              background: '#fff',
              borderRadius: 16,
              maxWidth: 600,
              width: '100%',
              overflow: 'hidden',
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
              border: '1px solid var(--ax-border, #e2e8f0)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="ax-modal__header"
              style={{
                padding: '18px 24px',
                borderBottom: '1px solid var(--ax-border, #e2e8f0)',
                background: 'var(--ax-surface-subtle, #f8fafc)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <h4 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: 'var(--ax-text-strong, #0f172a)' }}>
                  Raise SSL Installation Claim
                </h4>
                <p style={{ margin: '3px 0 0', fontSize: 12, color: 'var(--ax-text-muted, #64748b)' }}>
                  Minimum 100 verified eligible sites required by policy
                </p>
              </div>
              <button
                type="button"
                className="ax-btn ax-btn--ghost ax-btn--sm"
                style={{ width: 32, height: 32, padding: 0, borderRadius: '50%' }}
                onClick={() => {
                  if (!raiseSubmitting) setRaiseModalOpen(false);
                }}
                disabled={raiseSubmitting}
                aria-label="Close dialog"
              >
                ✕
              </button>
            </div>

            <div className="ax-modal__body" style={{ padding: 24 }}>
              {raiseSuccess && (
                <div style={{ padding: 12, marginBottom: 16, borderRadius: 8, background: '#ecfdf5', color: '#065f46', fontSize: 13, fontWeight: 600, border: '1px solid #a7f3d0' }}>
                  ✓ {raiseSuccess}
                </div>
              )}
              {raiseError && (
                <div style={{ padding: 12, marginBottom: 16, borderRadius: 8, background: '#fef2f2', color: '#991b1b', fontSize: 13, fontWeight: 600, border: '1px solid #fecaca' }}>
                  ⚠ {raiseError}
                </div>
              )}

              <form onSubmit={handleRaiseSubmit}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {/* Claim Amount */}
                  <div className="ax-modern-field">
                    <label className="ax-modern-label" htmlFor="rc-claim-amount">
                      <span>Claim Amount (₹)</span>
                      <span className="ax-modern-req">*</span>
                    </label>
                    <div className="ax-modern-input-wrap">
                      <span className="ax-modern-addon">₹</span>
                      <input
                        id="rc-claim-amount"
                        type="number"
                        step="0.01"
                        min="0"
                        className="ax-modern-input"
                        placeholder="e.g. 250000.00"
                        value={claimAmount}
                        onChange={(e) => setClaimAmount(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  {/* Claim Invoice Document */}
                  <div className="ax-modern-field">
                    <label className="ax-modern-label">
                      <span>Claim Invoice Document (PDF / Image)</span>
                      <span className="ax-modern-req">*</span>
                    </label>
                    <input
                      ref={raiseFileRef}
                      type="file"
                      accept=".pdf,image/*"
                      style={{ display: 'none' }}
                      onChange={(e) => setClaimInvoiceFile(e.target.files?.[0] || null)}
                    />
                    {!claimInvoiceFile ? (
                      <div
                        className="ax-modern-dropzone"
                        onClick={() => raiseFileRef.current?.click()}
                        role="button"
                        tabIndex={0}
                      >
                        <div className="ax-modern-dropzone__icon">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ width: 22, height: 22, color: 'var(--ax-primary, #3b82f6)' }}>
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                            <polyline points="17 8 12 3 7 8" />
                            <line x1="12" y1="3" x2="12" y2="15" />
                          </svg>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ax-text-strong, #1e293b)' }}>
                            Click to upload invoice document
                          </div>
                          <div style={{ fontSize: 11.5, color: 'var(--ax-text-muted, #64748b)', marginTop: 2 }}>
                            PDF or Image formats allowed (Max 5 MB)
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="ax-modern-file-chip">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                          <span className="ax-modern-file-chip__icon">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ width: 18, height: 18, color: '#059669' }}>
                              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                              <polyline points="14 2 14 8 20 8" />
                              <line x1="16" y1="13" x2="8" y2="13" />
                              <line x1="16" y1="17" x2="8" y2="17" />
                              <polyline points="10 9 9 9 8 9" />
                            </svg>
                          </span>
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ax-text-strong, #1e293b)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {claimInvoiceFile.name}
                            </div>
                            <div style={{ fontSize: 11.5, color: 'var(--ax-text-muted, #64748b)' }}>
                              {(claimInvoiceFile.size / 1024).toFixed(1)} KB
                            </div>
                          </div>
                        </div>
                        <button
                          type="button"
                          className="ax-btn ax-btn--ghost ax-btn--sm"
                          style={{ padding: '4px 8px', fontSize: 12, color: '#ef4444' }}
                          onClick={() => setClaimInvoiceFile(null)}
                        >
                          Remove
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Site IDs */}
                  <div className="ax-modern-field">
                    <div className="ax-modern-label">
                      <span>Site IDs (Comma-separated) <span className="ax-modern-req">*</span></span>
                      <span
                        style={{
                          fontSize: 11.5,
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: 999,
                          background: siteIdsInput.split(',').filter((s) => s.trim()).length >= 100 ? '#ecfdf5' : '#fef2f2',
                          color: siteIdsInput.split(',').filter((s) => s.trim()).length >= 100 ? '#065f46' : '#991b1b',
                          border: '1px solid #cbd5e1',
                        }}
                      >
                        Count: {siteIdsInput.split(',').filter((s) => s.trim()).length} / 100 required
                      </span>
                    </div>
                    <textarea
                      className="ax-modern-textarea"
                      rows={4}
                      placeholder="e.g. 101, 102, 103..."
                      value={siteIdsInput}
                      onChange={(e) => setSiteIdsInput(e.target.value)}
                      required
                      style={{ fontFamily: 'var(--ax-font-mono, monospace)', fontSize: 12.5 }}
                    />
                    <small style={{ color: 'var(--ax-text-muted, #64748b)', fontSize: 11.5, marginTop: 2 }}>
                      Auto-populated from your {eligibleSiteIds.length} eligible installed sites.
                    </small>
                  </div>
                </div>

                <div style={{ marginTop: 22, display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                  <button
                    type="button"
                    className="ax-btn ax-btn--secondary"
                    onClick={() => setRaiseModalOpen(false)}
                    disabled={raiseSubmitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="ax-btn ax-btn--primary"
                    disabled={raiseSubmitting}
                  >
                    {raiseSubmitting ? 'Submitting…' : 'Submit Claim Request'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ── Edit Claim Raised Modal (API 12) ── */}
      {editModalOpen && editingClaim && (
        <div
          className="ax-modal"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: 20,
          }}
          onClick={() => {
            if (!editSubmitting) setEditModalOpen(false);
          }}
        >
          <div
            className="ax-modal__dialog"
            style={{
              background: '#fff',
              borderRadius: 16,
              maxWidth: 520,
              width: '100%',
              overflow: 'hidden',
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
              border: '1px solid var(--ax-border, #e2e8f0)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="ax-modal__header"
              style={{
                padding: '18px 24px',
                borderBottom: '1px solid var(--ax-border, #e2e8f0)',
                background: 'var(--ax-surface-subtle, #f8fafc)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <h4 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: 'var(--ax-text-strong, #0f172a)' }}>
                  Update Claim Request (#{editingClaim.id})
                </h4>
                <p style={{ margin: '3px 0 0', fontSize: 12, color: 'var(--ax-text-muted, #64748b)' }}>
                  Modify claim amount or replace the invoice document
                </p>
              </div>
              <button
                type="button"
                className="ax-btn ax-btn--ghost ax-btn--sm"
                style={{ width: 32, height: 32, padding: 0, borderRadius: '50%' }}
                onClick={() => {
                  if (!editSubmitting) setEditModalOpen(false);
                }}
                disabled={editSubmitting}
                aria-label="Close dialog"
              >
                ✕
              </button>
            </div>

            <div className="ax-modal__body" style={{ padding: 24 }}>
              {editError && (
                <div style={{ padding: 12, marginBottom: 16, borderRadius: 8, background: '#fef2f2', color: '#991b1b', fontSize: 13, fontWeight: 600, border: '1px solid #fecaca' }}>
                  ⚠ {editError}
                </div>
              )}

              <form onSubmit={handleEditSubmit}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {/* Amount Field */}
                  <div className="ax-modern-field">
                    <label className="ax-modern-label" htmlFor="ec-claim-amount">
                      <span>Claim Amount (₹)</span>
                      <span className="ax-modern-req">*</span>
                    </label>
                    <div className="ax-modern-input-wrap">
                      <span className="ax-modern-addon">₹</span>
                      <input
                        id="ec-claim-amount"
                        type="number"
                        step="0.01"
                        min="0"
                        className="ax-modern-input"
                        value={editAmount}
                        onChange={(e) => setEditAmount(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  {/* Document Upload */}
                  <div className="ax-modern-field">
                    <div className="ax-modern-label">
                      <span>Replace Invoice Document</span>
                      <span style={{ fontSize: 11, color: 'var(--ax-text-muted, #64748b)' }}>(Optional)</span>
                    </div>
                    <input
                      ref={editFileRef}
                      type="file"
                      accept=".pdf,image/*"
                      style={{ display: 'none' }}
                      onChange={(e) => setEditInvoiceFile(e.target.files?.[0] || null)}
                    />
                    {!editInvoiceFile ? (
                      <div
                        className="ax-modern-dropzone"
                        onClick={() => editFileRef.current?.click()}
                        role="button"
                        tabIndex={0}
                      >
                        <div className="ax-modern-dropzone__icon">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ width: 22, height: 22, color: 'var(--ax-primary, #3b82f6)' }}>
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                            <polyline points="17 8 12 3 7 8" />
                            <line x1="12" y1="3" x2="12" y2="15" />
                          </svg>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ax-text-strong, #1e293b)' }}>
                            Click to upload replacement invoice
                          </div>
                          <div style={{ fontSize: 11.5, color: 'var(--ax-text-muted, #64748b)', marginTop: 2 }}>
                            {editingClaim.claim_invoice ? 'Existing invoice already attached. Upload only to replace.' : 'PDF or Image (Max 5 MB)'}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="ax-modern-file-chip">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                          <span className="ax-modern-file-chip__icon">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ width: 18, height: 18, color: '#059669' }}>
                              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                              <polyline points="14 2 14 8 20 8" />
                              <line x1="16" y1="13" x2="8" y2="13" />
                              <line x1="16" y1="17" x2="8" y2="17" />
                              <polyline points="10 9 9 9 8 9" />
                            </svg>
                          </span>
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ax-text-strong, #1e293b)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {editInvoiceFile.name}
                            </div>
                            <div style={{ fontSize: 11.5, color: 'var(--ax-text-muted, #64748b)' }}>
                              {(editInvoiceFile.size / 1024).toFixed(1)} KB (New file)
                            </div>
                          </div>
                        </div>
                        <button
                          type="button"
                          className="ax-btn ax-btn--ghost ax-btn--sm"
                          style={{ padding: '4px 8px', fontSize: 12, color: '#ef4444' }}
                          onClick={() => setEditInvoiceFile(null)}
                        >
                          Remove
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div style={{ marginTop: 22, display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                  <button
                    type="button"
                    className="ax-btn ax-btn--secondary"
                    onClick={() => setEditModalOpen(false)}
                    disabled={editSubmitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="ax-btn ax-btn--primary"
                    disabled={editSubmitting}
                  >
                    {editSubmitting ? 'Updating…' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
=======
        <div className="bsv-payment-kpi__value-row">
          <span className="bsv-payment-kpi__value">{value}</span>
          {unit && <span className="bsv-payment-kpi__unit">{unit}</span>}
        </div>
        <div className="bsv-payment-kpi__caption">{sub}</div>
      </div>
>>>>>>> f49923685403717f9e19cbf9dfbdf409606a2966
    </div>
  );
}

export function Bihar_Installation_SSL_ClaimRequest() {
  const [loading, setLoading] = useState(true);
  const [claims, setClaims] = useState<SslClaimRaisedItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Eligible sites for claim
  const [eligibleSiteIds, setEligibleSiteIds] = useState<number[]>([]);

  // Raise Claim Modal State
  const [raiseModalOpen, setRaiseModalOpen] = useState(false);
  const [claimAmount, setClaimAmount] = useState('');
  const [siteIdsInput, setSiteIdsInput] = useState('');
  const [claimInvoiceFile, setClaimInvoiceFile] = useState<File | null>(null);
  const [raiseSubmitting, setRaiseSubmitting] = useState(false);
  const [raiseError, setRaiseError] = useState<string | null>(null);
  const [raiseSuccess, setRaiseSuccess] = useState<string | null>(null);

  // Edit Claim Modal State
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingClaim, setEditingClaim] = useState<SslClaimRaisedItem | null>(null);
  const [editAmount, setEditAmount] = useState('');
  const [editInvoiceFile, setEditInvoiceFile] = useState<File | null>(null);
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const deferredQuery = useDeferredValue(searchQuery);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [claimList, installedData] = await Promise.all([
        biharSslInstallationService.getViewClaimDetails(),
        biharSslInstallationService.getViewInstalledLights(),
      ]);
      setClaims(Array.isArray(claimList) ? claimList : []);
      if (installedData?.claimed_applicable_ids) {
        setEligibleSiteIds(installedData.claimed_applicable_ids);
        setSiteIdsInput(installedData.claimed_applicable_ids.join(', '));
      }
    } catch (err) {
      console.error('[ClaimRequest] error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Filtered claims
  const filtered = useMemo(() => {
    const q = deferredQuery.trim().toLowerCase();
    return claims.filter((c) => {
      if (q) {
        const matches =
          (c.vendor_name && c.vendor_name.toLowerCase().includes(q)) ||
          (c.vendor && c.vendor.toLowerCase().includes(q)) ||
          (c.state && c.state.toLowerCase().includes(q)) ||
          String(c.claim_amount).includes(q) ||
          String(c.claim_site_count).includes(q);
        if (!matches) return false;
      }
      if (statusFilter !== 'all' && String(c.claim_status) !== statusFilter) {
        return false;
      }
      return true;
    });
  }, [claims, deferredQuery, statusFilter]);

  // Summary Metrics
  const metrics = useMemo(() => {
    const totalClaims = claims.length;
    let totalClaimAmount = 0;
    let approvedCount = 0;
    let pendingCount = 0;

    claims.forEach((c) => {
      totalClaimAmount += Number(c.claim_amount) || 0;
      if (c.claim_status === 1) approvedCount++;
      else if (c.claim_status === 0) pendingCount++;
    });

    return {
      totalClaims,
      totalClaimAmount,
      approvedCount,
      pendingCount,
      eligibleSitesCount: eligibleSiteIds.length,
    };
  }, [claims, eligibleSiteIds]);

  // Pagination hook
  const pagination = usePagination({ data: filtered, initialPageSize: 15 });

  // Handle Raise Claim Submit
  const handleRaiseSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setRaiseError(null);
    setRaiseSuccess(null);

    const cleanSites = siteIdsInput
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    if (cleanSites.length < 100) {
      setRaiseError(`Minimum 100 eligible sites required to raise a claim. Currently provided: ${cleanSites.length}`);
      return;
    }
    if (!claimAmount || Number(claimAmount) <= 0) {
      setRaiseError('Please enter a valid claim amount.');
      return;
    }
    if (!claimInvoiceFile) {
      setRaiseError('Please select a claim invoice file.');
      return;
    }

    setRaiseSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('amount', claimAmount.trim());
      fd.append('file', claimInvoiceFile);
      cleanSites.forEach((sid) => {
        fd.append('site_id[]', sid);
      });

      const res = await biharSslInstallationService.raiseClaimStore(fd);
      setRaiseSuccess(res.message || 'Payment claim raised successfully!');
      await loadData();
      setTimeout(() => {
        setRaiseModalOpen(false);
        setClaimAmount('');
        setClaimInvoiceFile(null);
      }, 1000);
    } catch (err: any) {
      console.error('[Raise Claim] error:', err);
      setRaiseError(err.message || 'Failed to submit claim.');
    } finally {
      setRaiseSubmitting(false);
    }
  };

  // Open Edit Claim Modal
  const handleOpenEdit = (claim: SslClaimRaisedItem) => {
    setEditingClaim(claim);
    setEditAmount(String(claim.claim_amount || ''));
    setEditInvoiceFile(null);
    setEditError(null);
    setEditModalOpen(true);
  };

  // Submit Edit Claim
  const handleEditSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingClaim) return;
    setEditError(null);

    if (!editAmount || Number(editAmount) <= 0) {
      setEditError('Please enter a valid claim amount.');
      return;
    }

    setEditSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('claim_id', String(editingClaim.id));
      fd.append('amount', editAmount.trim());
      if (editInvoiceFile) {
        fd.append('file', editInvoiceFile);
      }

      await biharSslInstallationService.updateClaimStore(fd);
      await loadData();
      setEditModalOpen(false);
      setEditingClaim(null);
    } catch (err: any) {
      console.error('[Edit Claim] error:', err);
      setEditError(err.message || 'Failed to update claim.');
    } finally {
      setEditSubmitting(false);
    }
  };

  // Export Columns
  const exportCols: ExportColumn<SslClaimRaisedItem>[] = [
    { header: 'Vendor Name', accessor: (r) => r.vendor_name || r.vendor || DASH },
    { header: 'State', accessor: 'state' },
    { header: 'Claim Raised Date', accessor: 'claim_raised_date' },
    { header: 'Site Count', accessor: 'claim_site_count' },
    { header: 'Claim Amount', accessor: (r) => cur(r.claim_amount) },
    { header: 'Claim Update Date', accessor: 'claim_update_date' },
    {
      header: 'Claim Status',
      accessor: (r) => (r.claim_status === 1 ? 'Approved' : 'Pending'),
    },
    {
      header: 'Payment Status',
      accessor: (r) => (r.payment_status === 1 ? 'Paid' : 'Pending'),
    },
    { header: 'Payment Date', accessor: 'payment_date' },
    { header: 'Payment Amount', accessor: (r) => cur(r.payment_amount) },
    { header: 'Payment Remark', accessor: 'payment_remark' },
  ];

  const handleCopy = () => copyTableDataToClipboard(filtered, exportCols);
  const handleExportCSV = () => exportDataToCSV('Bihar_SSL_Claim_Requests', filtered, exportCols);
  const handleExportExcel = () => exportDataToExcel('Bihar_SSL_Claim_Requests', filtered, exportCols);
  const handleExportPDF = () => printTableData('Bihar SSL Claim Requests', filtered, exportCols);

  return (
    <div className="ax-page solar-erp-page">
      <style>{PAGE_CSS}</style>

      {/* ── Page Head ── */}
      <PageHead
        title="View SSL Claim Request"
        subtitle="Manage SSL installation payment claims, verification status, and disbursements"
        breadcrumbs={[
          { label: 'Home', href: '/v-dashboard' },
          { label: 'Bihar' },
          { label: 'Installation' },
          { label: 'SSL', href: '/v/ssl/installation-dashboard' },
          { label: 'Claim Request' },
        ]}
        actions={
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span className="ax-badge ax-badge--soft ax-badge--accent ax-badge--pill" style={{ fontWeight: 600 }}>
              Company ID: {getCompanyId()}
            </span>
            <button
              type="button"
              className="ax-btn ax-btn--primary ax-btn--sm"
              onClick={() => {
                setRaiseError(null);
                setRaiseSuccess(null);
                setRaiseModalOpen(true);
              }}
            >
              {ICON_PLUS}
              <span className="ax-btn__label">Raise Claim</span>
            </button>
            <button
              type="button"
              className="ax-btn ax-btn--secondary ax-btn--sm"
              onClick={loadData}
              disabled={loading}
              title="Refresh list"
            >
              {ICON_REFRESH}
              <span className="ax-btn__label">Refresh</span>
            </button>
          </div>
        }
      />

      {/* ── Payment KPI Row (ULA Style) ── */}
      {loading ? (
        <KpiSkeleton count={4} />
      ) : (
        <div className="ax-dash-grid">
          {/* KPI 1: Total Claims */}
          <PaymentKpiCard
            icon={<path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />}
            tone="blue"
            label="Total Claims Raised"
            value={cur(metrics.totalClaimAmount)}
            sub={`${metrics.totalClaims} batches submitted`}
            badge="All Time"
          />

          {/* KPI 2: Approved Claims */}
          <PaymentKpiCard
            icon={
              <>
                <path d="M9 12l2 2 4-4" />
                <circle cx="12" cy="12" r="9" />
              </>
            }
            tone="emerald"
            label="Approved Claims"
            value={metrics.approvedCount}
            unit="approved"
            sub="Passed inspection audit"
            badge="Approved"
          />

          {/* KPI 3: Pending Claims */}
          <PaymentKpiCard
            icon={
              <>
                <circle cx="12" cy="12" r="9" />
                <path d="M12 7v5l3 2" />
              </>
            }
            tone="amber"
            label="Pending Review"
            value={metrics.pendingCount}
            unit="in review"
            sub="Awaiting finance processing"
            badge="Pending"
          />

          {/* KPI 4: Eligible Sites */}
          <PaymentKpiCard
            icon={
              <>
                <rect x="3" y="4" width="18" height="16" rx="2" />
                <line x1="9" y1="9" x2="15" y2="9" />
                <line x1="9" y1="13" x2="15" y2="13" />
              </>
            }
            tone="cyan"
            label="Claim-Eligible Sites"
            value={metrics.eligibleSitesCount}
            unit="lights ready"
            sub="Min 100 lights needed to raise claim"
            badge="Min 100"
          />
        </div>
      )}

      {/* ── Table Card ── */}
      <section className="ax-card ax-col--12">
        <div className="ax-card__header">
          <div className="ax-card__titles">
            <h2 className="ax-card__title">View SSL Claim Request</h2>
            <p className="ax-card__subtitle" style={{ fontFamily: 'var(--ax-font-mono)' }}>
              {filtered.length} of {claims.length} records
            </p>
          </div>

          <div className="ax-card__actions">
            {/* Status Filter */}
            <select
              className="ax-input ax-input--sm"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                pagination.setPage(1);
              }}
              style={{ minWidth: 140, height: 32, borderRadius: 'var(--ax-radius-md)' }}
            >
              <option value="all">All Status</option>
              <option value="1">Approved</option>
              <option value="0">Pending</option>
            </select>

            {/* Search Input */}
            <SearchInput
              value={searchQuery}
              onChange={(val) => {
                setSearchQuery(val);
                pagination.setPage(1);
              }}
              placeholder="Search vendor, state, amount…"
              ariaLabel="Search claims"
            />

            {/* Export Toolbar */}
            <TableExportToolbar
              onCopy={handleCopy}
              onExportCSV={handleExportCSV}
              onExportExcel={handleExportExcel}
              onExportPDF={handleExportPDF}
            />
          </div>
        </div>

        {/* Data Table */}
        {loading ? (
          <TableSkeleton columns={14} rows={8} showCard={false} />
        ) : filtered.length === 0 ? (
          <TableEmptyState
            title="No Data Available in Table"
            message={
              searchQuery || statusFilter !== 'all'
                ? 'No claim requests match your search criteria.'
                : 'No SSL claim requests raised yet. Click "Raise Claim" to submit a new claim.'
            }
            onClear={() => {
              setSearchQuery('');
              setStatusFilter('all');
            }}
            clearLabel="Reset Filters"
          />
        ) : (
          <>
            <div className="ax-table-wrap">
              <table className="ax-table ax-table--hover ula-table--wide ula-sticky-first">
                <caption className="ax-visually-hidden">SSL Claim Requests</caption>
                <thead className="ax-table__head">
                  <tr>
                    <th className="ax-table__th" scope="col" style={{ width: 50 }}>
                      Sr. No.
                    </th>
                    <th className="ax-table__th" scope="col">
                      Vendor Name
                    </th>
                    <th className="ax-table__th" scope="col">
                      State
                    </th>
                    <th className="ax-table__th" scope="col">
                      Claim Raised Date
                    </th>
                    <th className="ax-table__th" scope="col" style={{ textAlign: 'right' }}>
                      Site Count
                    </th>
                    <th className="ax-table__th" scope="col" style={{ textAlign: 'center' }}>
                      Claim Invoice
                    </th>
                    <th className="ax-table__th" scope="col" style={{ textAlign: 'right' }}>
                      Claim Amount
                    </th>
                    <th className="ax-table__th" scope="col">
                      Claim Update Date
                    </th>
                    <th className="ax-table__th" scope="col" style={{ textAlign: 'center' }}>
                      Claim Status
                    </th>
                    <th className="ax-table__th" scope="col" style={{ textAlign: 'center' }}>
                      Payment Status
                    </th>
                    <th className="ax-table__th" scope="col">
                      Payment Date
                    </th>
                    <th className="ax-table__th" scope="col" style={{ textAlign: 'right' }}>
                      Payment Amount
                    </th>
                    <th className="ax-table__th" scope="col">
                      Payment Remark
                    </th>
                    <th className="ax-table__th" scope="col" style={{ textAlign: 'center', width: 90 }}>
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {pagination.paged.map((c, idx) => {
                    const rowNum = (pagination.curPage - 1) * pagination.pageSize + idx + 1;
                    const isApproved = c.claim_status === 1;
                    const isPaid = c.payment_status === 1;
                    const invoiceUrl = getMediaUrl(c.claim_invoice || c.file);

                    return (
                      <tr key={c.id || idx} className="ax-table__row">
                        <td className="ax-table__td" style={{ color: 'var(--ax-text-muted)' }}>
                          {rowNum}
                        </td>
                        <td
                          className="ax-table__td"
                          style={{ fontWeight: 'var(--ax-weight-semibold)' as any, color: 'var(--ax-text-strong)' }}
                        >
                          {c.vendor_name || c.vendor || DASH}
                        </td>
                        <td className="ax-table__td" style={{ textTransform: 'capitalize' }}>
                          {c.state || 'Bihar'}
                        </td>
                        <td className="ax-table__td">{c.claim_raised_date || DASH}</td>
                        <td className="ax-table__td" style={{ textAlign: 'right' }}>
                          <span className="ax-badge ax-badge--soft ax-badge--neutral ax-badge--pill">
                            {c.claim_site_count ? `${c.claim_site_count} Sites` : DASH}
                          </span>
                        </td>
                        <td className="ax-table__td" style={{ textAlign: 'center' }}>
                          {invoiceUrl ? (
                            <a
                              href={invoiceUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="ax-badge ax-badge--soft ax-badge--neutral"
                              style={{ textDecoration: 'none', cursor: 'pointer' }}
                            >
                              Invoice ↗
                            </a>
                          ) : (
                            <span style={{ color: 'var(--ax-text-subtle)' }}>{DASH}</span>
                          )}
                        </td>
                        <td
                          className="ax-table__td"
                          style={{
                            textAlign: 'right',
                            fontWeight: 700,
                            color: 'var(--ax-text-strong)',
                            fontFamily: 'var(--ax-font-mono)',
                          }}
                        >
                          {cur(c.claim_amount)}
                        </td>
                        <td className="ax-table__td">{c.claim_update_date || DASH}</td>
                        <td className="ax-table__td" style={{ textAlign: 'center' }}>
                          <span
                            className={`ax-badge ax-badge--soft ax-badge--pill ${
                              isApproved ? 'ax-badge--success' : 'ax-badge--warning'
                            }`}
                          >
                            <span className="ax-badge__dot" />
                            {isApproved ? 'Approved' : 'Pending'}
                          </span>
                        </td>
                        <td className="ax-table__td" style={{ textAlign: 'center' }}>
                          <span
                            className={`ax-badge ax-badge--soft ax-badge--pill ${
                              isPaid ? 'ax-badge--success' : 'ax-badge--warning'
                            }`}
                          >
                            {isPaid ? 'Paid' : 'Pending'}
                          </span>
                        </td>
                        <td className="ax-table__td">{c.payment_date || DASH}</td>
                        <td className="ax-table__td" style={{ textAlign: 'right', fontFamily: 'var(--ax-font-mono)' }}>
                          {c.payment_amount ? cur(c.payment_amount) : DASH}
                        </td>
                        <td
                          className="ax-table__td"
                          style={{ maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis' }}
                          title={c.payment_remark || undefined}
                        >
                          {c.payment_remark || DASH}
                        </td>
                        <td className="ax-table__td" style={{ textAlign: 'center' }}>
                          {isApproved ? (
                            <span className="ax-badge ax-badge--soft ax-badge--success" style={{ fontSize: 11 }}>
                              ✓ Locked
                            </span>
                          ) : (
                            <button
                              type="button"
                              className="ax-btn ax-btn--secondary ax-btn--xs"
                              onClick={() => handleOpenEdit(c)}
                              title="Edit Claim"
                              style={{ gap: 4 }}
                            >
                              {ICON_EDIT}
                              <span>Edit</span>
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Left-aligned ULA Pagination */}
            <div className="ax-card__footer">
              <div className="ula-pagination-left">
                <Pagination
                  currentPage={pagination.curPage}
                  totalItems={filtered.length}
                  pageSize={pagination.pageSize}
                  onPageChange={pagination.setPage}
                  onPageSizeChange={pagination.setPageSize}
                  pageSizeOptions={[10, 15, 25, 50, 100]}
                />
              </div>
            </div>
          </>
        )}
      </section>

      {/* ── Raise Claim Modal ── */}
      {raiseModalOpen && (
        <div className="ax-modal ax-modal--centered" role="dialog" aria-modal="true">
          <div className="ax-modal__backdrop" onClick={() => !raiseSubmitting && setRaiseModalOpen(false)} />
          <div className="ax-modal__dialog" style={{ maxWidth: 520 }}>
            <div className="ax-modal__header">
              <h3 className="ax-modal__title">Raise SSL Payment Claim</h3>
              <button
                type="button"
                className="ax-modal__close"
                onClick={() => setRaiseModalOpen(false)}
                disabled={raiseSubmitting}
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleRaiseSubmit}>
              <div className="ax-modal__body">
                {raiseError && (
                  <div className="ax-alert ax-alert--danger" style={{ marginBottom: 14 }}>
                    <div className="ax-alert__text">{raiseError}</div>
                  </div>
                )}
                {raiseSuccess && (
                  <div className="ax-alert ax-alert--success" style={{ marginBottom: 14 }}>
                    <div className="ax-alert__text">{raiseSuccess}</div>
                  </div>
                )}

                <div
                  style={{
                    padding: '10px 14px',
                    borderRadius: 8,
                    background: 'var(--ax-surface-subtle)',
                    border: '1px solid var(--ax-border)',
                    marginBottom: 16,
                    fontSize: 12.5,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>Eligible Verified Lights:</span>
                    <span className="ax-badge ax-badge--soft ax-badge--info ax-badge--pill">
                      {eligibleSiteIds.length} lights
                    </span>
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--ax-text-muted)', marginTop: 4 }}>
                    Note: A minimum of 100 verified light points is required to submit a payment claim.
                  </div>
                </div>

                <div style={{ marginBottom: 14 }}>
                  <label style={{ display: 'block', fontSize: 12.5, fontWeight: 650, marginBottom: 6 }}>
                    Eligible Site IDs (Comma Separated) <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <textarea
                    className="ax-input"
                    rows={3}
                    value={siteIdsInput}
                    onChange={(e) => setSiteIdsInput(e.target.value)}
                    placeholder="e.g. 101, 102, 103..."
                    style={{ width: '100%', borderRadius: 8, fontSize: 12, resize: 'vertical' }}
                    required
                  />
                </div>

                <div style={{ marginBottom: 14 }}>
                  <label style={{ display: 'block', fontSize: 12.5, fontWeight: 650, marginBottom: 6 }}>
                    Claim Amount (₹) <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    className="ax-input"
                    value={claimAmount}
                    onChange={(e) => setClaimAmount(e.target.value)}
                    placeholder="Enter claim invoice amount"
                    style={{ width: '100%', height: 40, borderRadius: 8 }}
                    required
                  />
                </div>

                <div style={{ marginBottom: 14 }}>
                  <label style={{ display: 'block', fontSize: 12.5, fontWeight: 650, marginBottom: 6 }}>
                    Claim Invoice File (PDF/Image) <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="file"
                    accept=".pdf,image/*"
                    onChange={(e) => setClaimInvoiceFile(e.target.files?.[0] || null)}
                    className="ax-input"
                    style={{ width: '100%', height: 40 }}
                    required
                  />
                </div>
              </div>

              <div className="ax-modal__footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                <button
                  type="button"
                  className="ax-btn ax-btn--secondary"
                  onClick={() => setRaiseModalOpen(false)}
                  disabled={raiseSubmitting}
                >
                  Cancel
                </button>
                <button type="submit" className="ax-btn ax-btn--primary" disabled={raiseSubmitting}>
                  {raiseSubmitting ? 'Submitting…' : 'Submit Claim'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Edit Claim Modal ── */}
      {editModalOpen && editingClaim && (
        <div className="ax-modal ax-modal--centered" role="dialog" aria-modal="true">
          <div className="ax-modal__backdrop" onClick={() => !editSubmitting && setEditModalOpen(false)} />
          <div className="ax-modal__dialog" style={{ maxWidth: 480 }}>
            <div className="ax-modal__header">
              <h3 className="ax-modal__title">Edit Claim #{editingClaim.id}</h3>
              <button
                type="button"
                className="ax-modal__close"
                onClick={() => setEditModalOpen(false)}
                disabled={editSubmitting}
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleEditSubmit}>
              <div className="ax-modal__body">
                {editError && (
                  <div className="ax-alert ax-alert--danger" style={{ marginBottom: 14 }}>
                    <div className="ax-alert__text">{editError}</div>
                  </div>
                )}

                <div style={{ marginBottom: 14 }}>
                  <label style={{ display: 'block', fontSize: 12.5, fontWeight: 650, marginBottom: 6 }}>
                    Claim Amount (₹) <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    className="ax-input"
                    value={editAmount}
                    onChange={(e) => setEditAmount(e.target.value)}
                    style={{ width: '100%', height: 40, borderRadius: 8 }}
                    required
                  />
                </div>

                <div style={{ marginBottom: 14 }}>
                  <label style={{ display: 'block', fontSize: 12.5, fontWeight: 650, marginBottom: 6 }}>
                    Update Invoice File (Optional)
                  </label>
                  <input
                    type="file"
                    accept=".pdf,image/*"
                    onChange={(e) => setEditInvoiceFile(e.target.files?.[0] || null)}
                    className="ax-input"
                    style={{ width: '100%', height: 40 }}
                  />
                </div>
              </div>

              <div className="ax-modal__footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                <button
                  type="button"
                  className="ax-btn ax-btn--secondary"
                  onClick={() => setEditModalOpen(false)}
                  disabled={editSubmitting}
                >
                  Cancel
                </button>
                <button type="submit" className="ax-btn ax-btn--primary" disabled={editSubmitting}>
                  {editSubmitting ? 'Updating…' : 'Update Claim'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Bihar_Installation_SSL_ClaimRequest;
