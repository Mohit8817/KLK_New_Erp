import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { PageHead } from '../../../../shell/PageHead';
import type { UpAssignedDataResponse } from '../../up-services';
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
import {
  DASH,
  Modal,
  ImagePreviewModal,
  PAGE_CSS,
  OVERLAY_CSS,
  X_ICON,
  ICON_REFRESH,
  actionsRowStyle,
  footerStyle,
  centerCell,
  pick,
  DocThumb,
  docUrlOf,
  type DetailField,
  type ComplaintColumn,
} from '../CommonSharedComplaints/UpComplaintsShared';

type Tab = 'open' | 'approved' | 'close';
const TAB_LABEL: Record<Tab, string> = { open: 'Open', approved: 'Approved', close: 'Closed' };

const num = (x: unknown) => (Number(x) || 0).toLocaleString('en-IN');

/* ───────── KPI card (same as Bihar Assigned Lights) ───────── */
type KpiTone = 'accent' | 'cyan' | 'emerald' | 'amber';

const TONE: Record<KpiTone, { bg: string; fg: string }> = {
  accent: { bg: 'rgba(37, 99, 235, 0.12)', fg: '#2563eb' },
  cyan: { bg: 'color-mix(in oklab, var(--ax-viz-cyan, #06b6d4) 14%, transparent)', fg: '#0891b2' },
  emerald: { bg: 'color-mix(in oklab, var(--ax-viz-emerald, #10b981) 14%, transparent)', fg: '#16a34a' },
  amber: { bg: 'color-mix(in oklab, var(--ax-viz-amber, #f59e0b) 14%, transparent)', fg: '#d97706' },
};

function KpiCard({ icon, tone, label, value, sub }: { icon: ReactNode; tone: KpiTone; label: string; value: ReactNode; sub: string }) {
  const t = TONE[tone];
  return (
    <div className="ax-card" style={{ padding: '14px 18px', borderRadius: 12, minWidth: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        <span
          style={{
            width: 28, height: 28, borderRadius: 8, background: t.bg, color: t.fg,
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}
        >
          <span style={{ width: 15, height: 15, display: 'inline-flex' }}>{icon}</span>
        </span>
        <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ax-text-muted)', letterSpacing: '0.04em' }}>
          {label}
        </span>
      </div>
      <div style={{ fontSize: 24, fontWeight: 800, color: t.fg, marginTop: 4, fontFamily: 'var(--ax-font-display)' }}>{value}</div>
      <div style={{ fontSize: 12, color: 'var(--ax-text-muted)', marginTop: 2 }}>{sub}</div>
    </div>
  );
}

const ASSIGNED_CSS = `
  .solar-erp-page .asw-cards-row {
    display: grid; grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: var(--ax-space-4, 16px); margin-bottom: var(--ax-space-5, 20px);
  }
  @media (max-width: 992px) { .solar-erp-page .asw-cards-row { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
  @media (max-width: 520px) { .solar-erp-page .asw-cards-row { grid-template-columns: 1fr; } }
  .ax-modal .ula-m-note { margin: 0; font-size: var(--ax-text-sm, 13px); color: var(--ax-text-muted, #64748b); }
  .ax-modal textarea.ax-input { resize: vertical; min-height: 84px; line-height: 1.45; }
  .ax-modal .ula-m-two { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: var(--ax-space-4, 16px); }
  @media (max-width: 560px) { .ax-modal .ula-m-two { grid-template-columns: minmax(0, 1fr); } }
`;

const Req = () => <span style={{ color: 'var(--ax-danger-500)' }} aria-hidden="true">*</span>;

const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

/* ───────── Close complaint modal ───────── */
export interface CloseValues {
  remarks: string;
  date: string;
  file: File;
  resolvedBy: string;
  email: string;
  mobile: string;
  closeSms: 'Yes' | 'No';
  file1: File | null;
}

export interface CloseConfig<T> {
  heading: string;
  /** 'resolver' adds Resolved By / Mobile / Email / Send SMS / extra file. */
  variant?: 'simple' | 'resolver';
  summary: (item: T) => { label: string; value: string }[];
  remarksPlaceholder: string;
  fileLabel: string;
  fileHint?: string;
  defaultSuccess: string;
  /** resolver variant: make the email mandatory. */
  emailRequired?: boolean;
  /** resolver variant: default for the Send SMS radio. */
  smsDefault?: 'Yes' | 'No';
  file1Label?: string;
  submit: (v: CloseValues, item: T) => Promise<{ status?: boolean | number; message?: string; errors?: Record<string, unknown> }>;
}

function CloseModal<T extends object>({
  item,
  cfg,
  onClose,
  onSuccess,
}: {
  item: T | null;
  cfg: CloseConfig<T>;
  onClose: () => void;
  onSuccess: (msg: string) => void;
}) {
  const resolver = cfg.variant === 'resolver';
  const [remarks, setRemarks] = useState('');
  const [date, setDate] = useState(todayStr);
  const [file, setFile] = useState<File | null>(null);
  const [file1, setFile1] = useState<File | null>(null);
  const [resolvedBy, setResolvedBy] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [closeSms, setCloseSms] = useState<'Yes' | 'No'>(cfg.smsDefault ?? 'No');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!item) return;
    setRemarks('');
    setDate(todayStr());
    setFile(null);
    setFile1(null);
    setResolvedBy('');
    setEmail('');
    setMobile('');
    setCloseSms(cfg.smsDefault ?? 'No');
    setError('');
  }, [item]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!item) return;
    if (resolver && !resolvedBy.trim()) return setError('Resolved By name is required.');
    if (resolver && cfg.emailRequired && !/\S+@\S+\.\S+/.test(email.trim())) return setError('A valid Resolver Email is required.');
    if (resolver && !/^\d{10}$/.test(mobile.trim())) return setError('10-digit Resolver Mobile is required.');
    if (!remarks.trim()) return setError('Resolution remarks are required.');
    if (!file) return setError('Resolution verification document / photo is required.');

    setSubmitting(true);
    setError('');
    try {
      const res = await cfg.submit(
        { remarks: remarks.trim(), date, file, resolvedBy: resolvedBy.trim(), email: email.trim(), mobile: mobile.trim(), closeSms, file1 },
        item
      );
      if (res.status) {
        onSuccess(res.message || cfg.defaultSuccess);
        onClose();
      } else {
        const extra = res.errors
          ? Object.values(res.errors).map((v) => (Array.isArray(v) ? String(v[0]) : String(v))).join(' ')
          : '';
        setError([res.message || 'Failed to close complaint.', extra].filter(Boolean).join(' '));
      }
    } catch (err: any) {
      setError(err?.message || 'Error occurred while closing complaint.');
    } finally {
      setSubmitting(false);
    }
  };

  const close = () => !submitting && onClose();

  return (
    <Modal open={!!item} onClose={close} labelledBy="up-assigned-close-title">
      {item && (
        <form onSubmit={handleSubmit}>
          <div className="ax-modal__header">
            <h2 className="ax-modal__title" id="up-assigned-close-title">
              {cfg.heading} #{pick(item, ['complaint_id', 'id'])}
            </h2>
            <button type="button" className="ax-modal__close" onClick={close} disabled={submitting} aria-label="Close dialog">
              {X_ICON}
            </button>
          </div>

          <div className="ax-modal__body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--ax-space-5)' }}>
            {error && (
              <div className="ax-alert ax-alert--danger" role="alert">
                <div className="ax-alert__text">{error}</div>
              </div>
            )}

            <div className="ula-m-info">
              {cfg.summary(item).map((s) => (
                <div key={s.label}><span>{s.label}: </span><b>{s.value}</b></div>
              ))}
            </div>

            <p className="ula-m-note">The field labels marked with * are required fields.</p>

            {resolver && (
              <div className="ula-m-two">
                <div className="ax-field">
                  <label className="ax-label" htmlFor="up-cl-by">Resolved By <Req /></label>
                  <input id="up-cl-by" className="ax-input" placeholder="Technician / Engineer name" value={resolvedBy} onChange={(e) => setResolvedBy(e.target.value)} required />
                </div>
                <div className="ax-field">
                  <label className="ax-label" htmlFor="up-cl-mobile">Resolver Mobile <Req /></label>
                  <input id="up-cl-mobile" type="tel" maxLength={10} className="ax-input" placeholder="10-digit mobile" value={mobile} onChange={(e) => setMobile(e.target.value.replace(/\D/g, ''))} required />
                </div>
                <div className="ax-field">
                  <label className="ax-label" htmlFor="up-cl-email">Resolver Email {cfg.emailRequired && <Req />}</label>
                  <input id="up-cl-email" type="email" required={cfg.emailRequired} className="ax-input" placeholder="resolver@vendor.com" value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <div className="ax-field">
                  <label className="ax-label" htmlFor="up-cl-date-r">Resolution Date <Req /></label>
                  <input id="up-cl-date-r" type="date" className="ax-input" value={date} onChange={(e) => setDate(e.target.value)} required />
                </div>
              </div>
            )}

            {!resolver && (
              <div className="ax-field">
                <label className="ax-label" htmlFor="up-cl-date">Resolution Date <Req /></label>
                <input id="up-cl-date" type="date" className="ax-input" value={date} onChange={(e) => setDate(e.target.value)} required />
              </div>
            )}

            <div className="ax-field">
              <label className="ax-label" htmlFor="up-cl-remarks">Resolution Remarks <Req /></label>
              <textarea
                id="up-cl-remarks"
                className="ax-input"
                rows={3}
                placeholder={cfg.remarksPlaceholder}
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                required
              />
            </div>

            <div className={resolver ? 'ula-m-two' : undefined}>
              <div className="ax-field">
                <label className="ax-label" htmlFor="up-cl-file">{cfg.fileLabel} <Req /></label>
                <input
                  id="up-cl-file"
                  type="file"
                  accept="image/*,.pdf,.doc,.docx"
                  className="ax-input"
                  required
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                />
                <span className="ax-help">{file ? file.name : cfg.fileHint || 'Image, PDF or document'}</span>
              </div>
              {resolver && (
                <div className="ax-field">
                  <label className="ax-label" htmlFor="up-cl-file1">{cfg.file1Label || 'Additional File'}</label>
                  <input id="up-cl-file1" type="file" accept="image/*,.pdf" className="ax-input" onChange={(e) => setFile1(e.target.files?.[0] || null)} />
                  <span className="ax-help">{file1 ? file1.name : 'Optional'}</span>
                </div>
              )}
            </div>

            {resolver && (
              <div className="ax-field">
                <span className="ax-label">Send Close SMS to Customer</span>
                <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
                  {(['Yes', 'No'] as const).map((v) => (
                    <label key={v} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 13 }}>
                      <input type="radio" name="up-close-sms" value={v} checked={closeSms === v} onChange={() => setCloseSms(v)} />
                      <span>{v}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="ax-modal__footer">
            <button type="button" className="ax-btn ax-btn--ghost" onClick={close} disabled={submitting}>Cancel</button>
            <button type="submit" className="ax-btn ax-btn--primary" disabled={submitting}>
              {submitting ? <span className="ax-spinner" /> : 'Submit resolution'}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}

/* ───────── Details modal ───────── */
function DetailViewModal<T extends object>({
  row,
  eyebrow,
  fields,
  onClose,
  onPreview,
}: {
  row: T | null;
  eyebrow: string;
  fields: (row: T) => DetailField[];
  onClose: () => void;
  onPreview: (url: string, title: string) => void;
}) {
  return (
    <Modal open={!!row} onClose={onClose} labelledBy="up-assigned-detail-title">
      {row && (
        <>
          <div className="ax-modal__header">
            <div>
              <p className="ula-m-field__label" style={{ margin: 0 }}>{eyebrow}</p>
              <h2 className="ax-modal__title" id="up-assigned-detail-title">
                Complaint #{pick(row, ['complaint_id', 'id'])}
              </h2>
            </div>
            <button type="button" className="ax-modal__close" onClick={onClose} aria-label="Close dialog">{X_ICON}</button>
          </div>

          <div className="ax-modal__body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--ax-space-5)' }}>
            <div className="ula-m-grid">
              {fields(row).map((f) => (
                <div key={f.label}>
                  <div className="ula-m-field__label">{f.label}</div>
                  <div className="ula-m-field__value">{f.value}</div>
                </div>
              ))}
            </div>

            <div>
              <div className="ula-m-field__label" style={{ marginBottom: 4 }}>Complaint Description</div>
              <div className="ula-m-desc">{pick(row, ['complaint'])}</div>
            </div>

            {docUrlOf(row) && (
              <div>
                <div className="ula-m-field__label" style={{ marginBottom: 6 }}>Attached Document / Photo</div>
                <DocThumb url={docUrlOf(row)} alt="Document" onPreview={onPreview} size={96} />
              </div>
            )}
          </div>

          <div className="ax-modal__footer">
            <button type="button" className="ax-btn ax-btn--primary" onClick={onClose}>Close</button>
          </div>
        </>
      )}
    </Modal>
  );
}

/* ───────── Generic assigned-complaints page ───────── */
export interface AssignedPageProps<T extends object> {
  title: string;
  subtitle: string;
  breadcrumbs: { label: string; href?: string }[];
  cardTitle: string;
  kpiSub: { total: string; open: string; approved: string; close: string };
  searchPlaceholder?: string;
  fetchData: () => Promise<UpAssignedDataResponse<T>>;
  columns: ComplaintColumn<T>[];
  searchFields: (row: T) => unknown[];
  exportName: string;
  exportTitle: string;
  close: CloseConfig<T>;
  /** Adds a View button + details modal. */
  detail?: { eyebrow: string; fields: (row: T) => DetailField[] };
  /** Allow closing from the Approved tab too. */
  closeOnApproved?: boolean;
}

const EMPTY = {
  open: [], approved: [], close: [],
  total_complaint: 0, open_complaint: 0, approved_complaint: 0, close_complaint: 0,
};

export function AssignedComplaintPage<T extends object>(props: AssignedPageProps<T>) {
  const { title, subtitle, breadcrumbs, cardTitle, kpiSub, columns, searchFields, exportName, exportTitle, close } = props;

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<UpAssignedDataResponse<T>>(EMPTY as unknown as UpAssignedDataResponse<T>);
  const [activeTab, setActiveTab] = useState<Tab>('open');
  const [search, setSearch] = useState('');
  const [district, setDistrict] = useState('All');
  const [closingItem, setClosingItem] = useState<T | null>(null);
  const [detailRow, setDetailRow] = useState<T | null>(null);
  const [preview, setPreview] = useState<{ url: string; title: string } | null>(null);
  const [toastMsg, setToastMsg] = useState<{ type: 'success' | 'danger'; text: string } | null>(null);

  const openPreview = useCallback((url: string, t: string) => setPreview({ url, title: t }), []);
  const closePreview = useCallback(() => setPreview(null), []);

  useEffect(() => {
    if (!toastMsg) return;
    const t = window.setTimeout(() => setToastMsg(null), 4000);
    return () => window.clearTimeout(t);
  }, [toastMsg]);

  const fetchRef = useRef(props.fetchData);
  fetchRef.current = props.fetchData;

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchRef.current();
      setData(res);
    } catch (err: any) {
      console.error(`[${exportName}] load error:`, err);
      setToastMsg({ type: 'danger', text: err?.message || 'Failed to load assigned complaints.' });
    } finally {
      setLoading(false);
    }
  }, [exportName, fetchRef]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const currentList: T[] = useMemo(() => {
    if (activeTab === 'approved') return data.approved || [];
    if (activeTab === 'close') return data.close || [];
    return data.open || [];
  }, [activeTab, data]);

  const districts = useMemo(() => {
    const set = new Set<string>();
    [...(data.open || []), ...(data.approved || []), ...(data.close || [])].forEach((r) => {
      const d = (r as Record<string, any>).district;
      if (d) set.add(String(d));
    });
    return Array.from(set).sort();
  }, [data]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return currentList.filter((r) => {
      if (district !== 'All' && (r as Record<string, any>).district !== district) return false;
      if (!q) return true;
      return searchFields(r).some((v) => String(v ?? '').toLowerCase().includes(q));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentList, search, district]);

  const { paginatedData, currentPage, pageSize, totalItems, setPage, setPageSize } =
    usePagination({ data: filtered, initialPageSize: 100 });

  useEffect(() => {
    setPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, district, activeTab]);

  const hasFilters = search.trim() !== '' || district !== 'All';
  const resetFilters = () => {
    setSearch('');
    setDistrict('All');
    setPage(1);
  };

  const exportCols: ExportColumn<T>[] = useMemo(
    () => [
      { header: 'Sr. No.', accessor: (_r: T, i: number) => i + 1 },
      ...columns
        .filter((c) => c.exportValue)
        .map((c) => ({ header: c.header, accessor: (r: T, i: number) => c.exportValue!(r, i) })),
      { header: 'Action Status', accessor: () => TAB_LABEL[activeTab] },
    ] as ExportColumn<T>[],
    [columns, activeTab]
  );

  const stamp = new Date().toISOString().slice(0, 10);
  const TOTAL_COLUMNS = columns.length + 2;

  const tabCount: Record<Tab, number> = {
    open: data.open?.length ?? 0,
    approved: data.approved?.length ?? 0,
    close: data.close?.length ?? 0,
  };

  return (
    <div className="solar-erp-page">
      <style>{PAGE_CSS}</style>
      <style>{OVERLAY_CSS}</style>
      <style>{ASSIGNED_CSS}</style>

      {/* ── Page Head ── */}
      <PageHead
        title={title}
        subtitle={subtitle}
        breadcrumbs={breadcrumbs}
        actions={
          <div style={{ display: 'inline-flex', gap: 'var(--ax-space-2)' }}>
            <button type="button" className="ax-btn ax-btn--secondary ax-btn--sm" onClick={loadData} disabled={loading}>
              {ICON_REFRESH}
              <span className="ax-btn__label">Refresh</span>
            </button>
          </div>
        }
      />

      {toastMsg && (
        <div className={`ax-alert ax-alert--${toastMsg.type}`} style={{ marginBottom: 'var(--ax-space-4)' }} role="status">
          <div className="ax-alert__title">{toastMsg.type === 'success' ? 'Success' : 'Error'}</div>
          <div className="ax-alert__text">{toastMsg.text}</div>
        </div>
      )}

      {/* ── KPI cards (4 in a row) ── */}
      <div className="asw-cards-row">
        <KpiCard
          tone="accent" label="Total Complaints" value={num(data.total_complaint)} sub={kpiSub.total}
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
          }
        />
        <KpiCard
          tone="amber" label="Open Complaints" value={num(data.open_complaint)} sub={kpiSub.open}
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          }
        />
        <KpiCard
          tone="cyan" label="Pending Approval" value={num(data.approved_complaint)} sub={kpiSub.approved}
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          }
        />
        <KpiCard
          tone="emerald" label="Resolved Complaints" value={num(data.close_complaint)} sub={kpiSub.close}
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          }
        />
      </div>

      {/* ── Status tabs above the table ── */}
      <div style={{ marginBottom: 'var(--ax-space-3, 12px)' }}>
        <div className="ax-cluster" role="tablist" aria-label="Complaint status tabs" style={{ gap: 'var(--ax-space-2)' }}>
          {(['open', 'approved', 'close'] as Tab[]).map((t) => (
            <button
              key={t}
              type="button"
              role="tab"
              aria-selected={activeTab === t}
              className={`ax-btn ax-btn--sm ${activeTab === t ? 'ax-btn--primary' : 'ax-btn--secondary'}`}
              onClick={() => setActiveTab(t)}
            >
              <span className="ax-btn__label">{TAB_LABEL[t]} ({tabCount[t]})</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Main table card ── */}
      <section className="ax-card ax-col--12" role="tabpanel" aria-label={cardTitle}>
        <div className="ax-card__header">
          <div className="ax-card__titles">
            <h2 className="ax-card__title">{cardTitle}</h2>
            <p className="ax-card__subtitle">
              <span className="ax-num">{filtered.length}</span> of <span className="ax-num">{currentList.length}</span> {TAB_LABEL[activeTab].toLowerCase()} complaints
            </p>
          </div>
          <div className="ax-card__actions">
            <div className="ax-cluster" style={actionsRowStyle}>
              <select
                className="ax-input ax-input--sm"
                style={{ width: 140, height: 32, fontSize: 'var(--ax-text-xs)' }}
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                aria-label="Filter by district"
              >
                <option value="All">All Districts</option>
                {districts.map((d) => (
                  <option key={d} value={d}>{d}</option>
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

              <SearchInput
                value={search}
                onChange={setSearch}
                placeholder={props.searchPlaceholder || 'Search ID, name, district, contact…'}
                size="sm"
                ariaLabel="Search assigned complaints"
              />

              <TableExportToolbar
                onCopy={() => copyTableDataToClipboard(filtered, exportCols)}
                onExportCSV={() => exportDataToCSV(`${exportName}_${activeTab}_${stamp}`, filtered, exportCols)}
                onExportExcel={() => exportDataToExcel(`${exportName}_${activeTab}_${stamp}`, filtered, exportCols)}
                onExportPDF={() => printTableData(`${exportTitle} (${TAB_LABEL[activeTab]})`, filtered, exportCols)}
              />
            </div>
          </div>
        </div>

        <div className="ax-table-wrap">
          <table className="ax-table ax-table--hover" style={{ whiteSpace: 'nowrap', minWidth: Math.max(1200, TOTAL_COLUMNS * 130) }}>
            <caption className="ax-visually-hidden">{cardTitle}</caption>
            <thead className="ax-table__head">
              <tr>
                <th className="ax-table__th" scope="col">Sr. No.</th>
                {columns.map((c) => (
                  <th key={c.header} className="ax-table__th" scope="col">{c.header}</th>
                ))}
                <th className="ax-table__th" scope="col" style={{ textAlign: 'center' }}>Action</th>
              </tr>
            </thead>
            <tbody aria-busy={loading}>
              {loading && (
                <tr>
                  <td className="ax-table__td" colSpan={TOTAL_COLUMNS} style={centerCell}>
                    <span className="ax-spinner" style={{ marginRight: 8 }} /> Loading assigned complaints…
                  </td>
                </tr>
              )}
              {!loading && filtered.length === 0 && (
                <tr>
                  <td className="ax-table__td" colSpan={TOTAL_COLUMNS} style={{ padding: 0 }}>
                    <TableEmptyState
                      title="No complaints in this category"
                      message={
                        hasFilters
                          ? 'No records match your filters or search. Try clearing your query.'
                          : `No ${TAB_LABEL[activeTab].toLowerCase()} complaints right now.`
                      }
                      onClear={hasFilters ? resetFilters : undefined}
                      clearLabel="Clear filters"
                    />
                  </td>
                </tr>
              )}
              {!loading &&
                paginatedData.map((row, index) => {
                  const serial = (currentPage - 1) * pageSize + index + 1;
                  const key = pick(row, ['id', 'complaint_id'], String(serial));
                  const canClose = activeTab === 'open' || (!!props.closeOnApproved && activeTab === 'approved');
                  return (
                    <tr key={`${key}-${serial}`} className="ax-table__row">
                      <td className="ax-table__td ax-num">{serial}</td>
                      {columns.map((c) => (
                        <td key={c.header} className="ax-table__td">
                          {c.cell(row, { serial, openPreview })}
                        </td>
                      ))}
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        <div style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
                        {props.detail && (
                          <button type="button" className="ax-btn ax-btn--secondary ax-btn--sm" onClick={() => setDetailRow(row)}>
                            View
                          </button>
                        )}
                        {canClose ? (
                          <button type="button" className="ax-btn ax-btn--primary ax-btn--sm" onClick={() => setClosingItem(row)}>
                            Close Complaint
                          </button>
                        ) : activeTab === 'approved' ? (
                          <span className="ax-badge ax-badge--soft ax-badge--info">Under Review</span>
                        ) : (
                          <span className="ax-badge ax-badge--soft ax-badge--success">Resolved</span>
                        )}
                        </div>
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
              totalItems={totalItems}
              pageSize={pageSize}
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
              pageSizeOptions={[25, 50, 100, 200]}
            />
          </div>
        </div>
      </section>

      {preview && <ImagePreviewModal url={preview.url} title={preview.title} onClose={closePreview} />}

      {props.detail && (
        <DetailViewModal
          row={detailRow}
          eyebrow={props.detail.eyebrow}
          fields={props.detail.fields}
          onClose={() => setDetailRow(null)}
          onPreview={openPreview}
        />
      )}

      <CloseModal
        item={closingItem}
        cfg={close}
        onClose={() => setClosingItem(null)}
        onSuccess={(msg) => {
          setToastMsg({ type: 'success', text: msg });
          loadData();
        }}
      />
    </div>
  );
}

export { DASH };