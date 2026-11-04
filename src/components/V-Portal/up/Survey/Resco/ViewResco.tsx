import { createPortal } from 'react-dom';
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHead } from '../../../../shell/PageHead';
import { useFocusTrap } from '../../../../../hooks/useFocusTrap';
import {
  upSurveyService,
  getUpSurveyMediaUrl,
  type UpRescoSurveyRecord,
  type UpRescoSurveyCounts,
  type UpRescoBosProductData,
  type UpRescoBosMaterialItem,
} from '../../up-services';
import {
  TableExportToolbar,
  SearchInput,
  Pagination,
  TableEmptyState,
  KpiSkeleton,
  copyTableDataToClipboard,
  exportDataToCSV,
  exportDataToExcel,
  printTableData,
  type ExportColumn,
} from '../../../../../common';

const DASH = '—';

/* ───────── KPI Card (same style as Goa SRT) ───────── */
type KpiTone = 'accent' | 'emerald' | 'amber';

const TONE: Record<KpiTone, { bg: string; fg: string }> = {
  accent: { bg: 'rgba(var(--ax-accent-rgb), 0.12)', fg: 'var(--ax-accent)' },
  emerald: { bg: 'color-mix(in oklab, var(--ax-viz-emerald) 14%, transparent)', fg: 'var(--ax-viz-emerald)' },
  amber: { bg: 'color-mix(in oklab, var(--ax-viz-amber) 14%, transparent)', fg: 'var(--ax-viz-amber)' },
};

const svg = (children: ReactNode) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{children}</svg>
);

function KpiCard({
  icon,
  tone,
  label,
  value,
  sub,
  active,
  onClick,
}: {
  icon: ReactNode;
  tone: KpiTone;
  label: string;
  value: ReactNode;
  sub: ReactNode;
  active?: boolean;
  onClick?: () => void;
}) {
  const t = TONE[tone];
  return (
    <div
      className={`ax-card ax-col--4 ${active ? 'is-active-filter' : ''}`}
      onClick={onClick}
      style={{
        padding: '16px 20px',
        borderRadius: 12,
        cursor: onClick ? 'pointer' : 'default',
        boxShadow: active ? `0 0 0 1px ${t.fg}22` : undefined,
        transition: 'all 0.2s ease',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <span
          style={{
            width: 30,
            height: 30,
            borderRadius: 8,
            background: t.bg,
            color: t.fg,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <span style={{ width: 16, height: 16, display: 'inline-flex' }}>{icon}</span>
        </span>
        <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ax-text-muted)', letterSpacing: '0.04em' }}>
          {label}
        </span>
      </div>
      <div style={{ fontSize: 24, fontWeight: 800, color: t.fg, marginTop: 4 }}>{value}</div>
      <div style={{ fontSize: 12, color: 'var(--ax-text-muted)', marginTop: 4 }}>{sub}</div>
    </div>
  );
}

/* ───────── Responsive page CSS (Punjab-style footer, no tfoot) ───────── */
const PAGE_CSS = `
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
  }
  .solar-erp-page .ax-table th,
  .solar-erp-page .ax-table td {
    white-space: nowrap;
    vertical-align: middle;
  }

  @media (max-width: 1100px) {
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
    .solar-erp-page .ax-card__actions [class*="search"] { max-width: 180px; }
  }

  @media (max-width: 760px) {
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
    .solar-erp-page .ax-card__actions {
      width: 100%;
      justify-content: stretch;
      margin-left: 0;
    }
    .solar-erp-page .ax-card__actions .ax-cluster {
      width: 100%;
      flex-wrap: wrap !important;
    }
    .solar-erp-page .ax-card__actions .ax-search,
    .solar-erp-page .ax-card__actions [class*="search"] {
      flex: 1 1 100%;
      max-width: 100%;
    }
  }

  @media (max-width: 900px) {
    .solar-erp-page .ax-dash-grid > .ax-card {
      grid-column: span 12 !important;
    }
  }
`;

const OVERLAY_CSS = `
  .ax-modal img { border-radius: 0 !important; }

  .ula-m-stage {
    position: relative; display: flex; overflow: auto;
    height: min(66vh, 600px); background: var(--ax-surface-subtle, #f1f5f9);
  }
  .ula-m-stage__msg {
    position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; gap: 8px;
    font-size: 13px; color: var(--ax-text-muted, #64748b); text-align: center; padding: 16px;
  }

  @media (max-width: 560px) {
    .ula-m-stage { height: 56vh; }
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

const X_ICON = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M18 6l-12 12" />
    <path d="M6 6l12 12" />
  </svg>
);

/* ───────── UI Modal Component ───────── */
function Modal({
  open,
  onClose,
  labelledBy,
  centered = true,
  dialogClass = '',
  dialogStyle,
  closeOnBackdrop = true,
  children,
}: {
  open: boolean;
  onClose: () => void;
  labelledBy: string;
  centered?: boolean;
  dialogClass?: string;
  dialogStyle?: CSSProperties;
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
      role="dialog"
      aria-modal="true"
      aria-labelledby={labelledBy}
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

/* ───────── Modal 1: Submit BOS File ───────── */
function SubmitBosFileModal({
  open,
  item,
  onClose,
  onSuccess,
}: {
  open: boolean;
  item: UpRescoSurveyRecord | null;
  onClose: () => void;
  onSuccess: (msg: string) => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [remarks, setRemarks] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!open) return;
    setFile(null);
    setRemarks('');
    setErrorMsg('');
  }, [open]);

  if (!item) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setErrorMsg('Please select a BOS file (png, jpg, jpeg, pdf, xls or xlsx).');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');

    const fd = new FormData();
    fd.append('site_id', String(item.id));
    fd.append('bos_file', file);
    if (remarks) fd.append('bos_remarks', remarks);

    try {
      const res = await upSurveyService.submitRescoBos(fd);
      if (res.status) {
        onSuccess(res.message || 'BOS Submit Successfully!!!');
        onClose();
      } else {
        setErrorMsg(res.message || 'Failed to submit BOS file.');
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Error occurred during submission.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} labelledBy="bos-file-title" dialogStyle={{ maxWidth: 520 }}>
      <div className="ax-modal__header">
        <div>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#2563eb', textTransform: 'uppercase' }}>Bill of Supply</span>
          <h2 className="ax-modal__title" id="bos-file-title">Submit BOS File — {item.site_name || `Site #${item.id}`}</h2>
        </div>
        <button type="button" className="ax-modal__close" onClick={onClose} aria-label="Close dialog">{X_ICON}</button>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="ax-modal__body" style={{ padding: 20 }}>
          {errorMsg && (
            <div style={{ padding: '10px 14px', borderRadius: 8, marginBottom: 16, background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', fontSize: 13 }}>
              {errorMsg}
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, marginBottom: 5 }}>BOS Document / Spreadsheet *</label>
              <input
                type="file"
                accept=".png,.jpg,.jpeg,.pdf,.xls,.xlsx"
                onChange={(e) => e.target.files && setFile(e.target.files[0])}
                className="ax-input"
                style={{ width: '100%', padding: '8px 12px', borderRadius: 8 }}
                required
              />
              <span style={{ fontSize: 11, color: 'var(--ax-text-muted)', marginTop: 4, display: 'block' }}>Allowed formats: PDF, JPG, PNG, XLS, XLSX</span>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, marginBottom: 5 }}>BOS Remarks (optional)</label>
              <textarea
                rows={3}
                placeholder="Enter remarks or procurement notes for BOS..."
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                className="ax-input"
                style={{ width: '100%', padding: '10px 12px', borderRadius: 8, resize: 'vertical' }}
              />
            </div>
          </div>
        </div>

        <div className="ax-modal__footer" style={{ justifyContent: 'flex-end' }}>
          <button type="button" onClick={onClose} className="ax-btn ax-btn--secondary" disabled={submitting}>Cancel</button>
          <button type="submit" className="ax-btn ax-btn--primary" disabled={submitting}>
            {submitting ? 'Submitting...' : 'Upload BOS File'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

/* ───────── Modal 2: Manage BOS Products ───────── */
function ManageBosProductsModal({
  open,
  item,
  onClose,
  onSuccess,
}: {
  open: boolean;
  item: UpRescoSurveyRecord | null;
  onClose: () => void;
  onSuccess: (msg: string) => void;
}) {
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [bosData, setBosData] = useState<UpRescoBosProductData | null>(null);
  const [requiredDate, setRequiredDate] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  });
  const [vendorName, setVendorName] = useState('Vendor');
  const [siteName, setSiteName] = useState('');
  const [remarks, setRemarks] = useState('');
  const [materials, setMaterials] = useState<Array<{ product_id: number; qty: string | number; unit: string; product_remarks: string }>>([]);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!open || !item) return;
    setErrorMsg('');
    setSiteName(item.site_name || '');
    setLoadingProducts(true);

    upSurveyService
      .fetchRescoBosProducts(item.id)
      .then((res) => {
        if (res) {
          setBosData(res);
          if (res.resco_bos) {
            setRequiredDate(res.resco_bos.req_date || requiredDate);
            setVendorName(res.resco_bos.vendor_name || 'Vendor');
            setSiteName(res.resco_bos.site_name || item.site_name || '');
            setRemarks(res.resco_bos.remarks || '');
            if (Array.isArray(res.resco_bos.materials) && res.resco_bos.materials.length > 0) {
              setMaterials(
                res.resco_bos.materials.map((m: UpRescoBosMaterialItem) => ({
                  product_id: Number(m.product_id),
                  qty: m.qty,
                  unit: m.unit || 'Nos',
                  product_remarks: m.product_remarks || '',
                }))
              );
            } else if (res.products && res.products.length > 0) {
              setMaterials([{ product_id: res.products[0].id, qty: 1, unit: 'Nos', product_remarks: '' }]);
            }
          } else if (res.products && res.products.length > 0) {
            setMaterials([{ product_id: res.products[0].id, qty: 1, unit: 'Nos', product_remarks: '' }]);
          }
        }
      })
      .catch((err) => {
        console.error('Error fetching BOS product data:', err);
        setErrorMsg('Failed to fetch available BOS products.');
      })
      .finally(() => {
        setLoadingProducts(false);
      });
  }, [open, item]);

  if (!item) return null;

  const handleAddMaterial = () => {
    const firstProdId = bosData?.products?.[0]?.id || 0;
    setMaterials([...materials, { product_id: firstProdId, qty: 1, unit: 'Nos', product_remarks: '' }]);
  };

  const handleRemoveMaterial = (index: number) => {
    setMaterials(materials.filter((_, i) => i !== index));
  };

  const handleMaterialChange = (index: number, field: string, value: any) => {
    const next = [...materials];
    (next[index] as any)[field] = value;
    setMaterials(next);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (materials.length === 0) {
      setErrorMsg('Please add at least one BOS product line item.');
      return;
    }
    const pids = materials.map((m) => m.product_id);
    if (new Set(pids).size !== pids.length) {
      setErrorMsg('Duplicate products selected. Please select each product only once.');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');

    try {
      const res = await upSurveyService.storeRescoBosProducts({
        site_id: item.id,
        required_date: requiredDate,
        vendor_name: vendorName,
        site_name: siteName,
        remarks,
        products: materials.map((m) => Number(m.product_id)),
        quantities: materials.map((m) => m.qty),
        units: materials.map((m) => m.unit),
        product_remarks: materials.map((m) => m.product_remarks || ''),
      });
      if (res.status) {
        onSuccess(res.message || 'BOS Products saved successfully!');
        onClose();
      } else {
        setErrorMsg(res.message || 'Failed to save BOS products.');
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Error occurred while saving BOS products.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} labelledBy="bos-prod-title" dialogStyle={{ maxWidth: 820, maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
      <div className="ax-modal__header">
        <div>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#16a34a', textTransform: 'uppercase' }}>BOS Product Management</span>
          <h2 className="ax-modal__title" id="bos-prod-title">Fill BOS Products — {item.site_name || `Site #${item.id}`}</h2>
        </div>
        <button type="button" className="ax-modal__close" onClick={onClose} aria-label="Close dialog">{X_ICON}</button>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
        <div className="ax-modal__body" style={{ padding: 20, overflowY: 'auto', flex: 1 }}>
          {errorMsg && (
            <div style={{ padding: '10px 14px', borderRadius: 8, marginBottom: 16, background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', fontSize: 13 }}>
              {errorMsg}
            </div>
          )}

          {/* Header Form */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14, marginBottom: 20, padding: 14, borderRadius: 10, background: 'var(--ax-surface-subtle, #f8fafc)', border: '1px solid var(--ax-border, #e2e8f0)' }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Required Date *</label>
              <input type="date" value={requiredDate} onChange={(e) => setRequiredDate(e.target.value)} className="ax-input" style={{ width: '100%', padding: '7px 10px', borderRadius: 6, fontSize: 12.5 }} required />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Vendor Name *</label>
              <input type="text" value={vendorName} onChange={(e) => setVendorName(e.target.value)} className="ax-input" style={{ width: '100%', padding: '7px 10px', borderRadius: 6, fontSize: 12.5 }} required />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Site Name *</label>
              <input type="text" value={siteName} onChange={(e) => setSiteName(e.target.value)} className="ax-input" style={{ width: '100%', padding: '7px 10px', borderRadius: 6, fontSize: 12.5 }} required />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Remarks</label>
              <input type="text" placeholder="e.g. Urgent, High priority" value={remarks} onChange={(e) => setRemarks(e.target.value)} className="ax-input" style={{ width: '100%', padding: '7px 10px', borderRadius: 6, fontSize: 12.5 }} />
            </div>
          </div>

          {/* Line Items Table */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <h4 style={{ margin: 0, fontSize: 13.5, fontWeight: 700, color: 'var(--ax-text)' }}>BOS Product Materials</h4>
              <button type="button" onClick={handleAddMaterial} className="ax-btn ax-btn--ghost ax-btn--sm" style={{ color: '#2563eb' }}>+ Add Product Line</button>
            </div>

            {loadingProducts ? (
              <div style={{ padding: 30, textAlign: 'center', color: 'var(--ax-text-muted)' }}><span className="ax-spinner" /> Loading product catalog...</div>
            ) : (
              <div style={{ border: '1px solid var(--ax-border, #e2e8f0)', borderRadius: 8, overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
                  <thead>
                    <tr style={{ background: 'var(--ax-surface-subtle, #f8fafc)', borderBottom: '1px solid var(--ax-border, #e2e8f0)' }}>
                      <th style={{ padding: '8px 12px', textAlign: 'left' }}>Product *</th>
                      <th style={{ padding: '8px 12px', textAlign: 'left', width: 100 }}>Quantity *</th>
                      <th style={{ padding: '8px 12px', textAlign: 'left', width: 100 }}>Unit *</th>
                      <th style={{ padding: '8px 12px', textAlign: 'left' }}>Item Remarks</th>
                      <th style={{ padding: '8px 12px', textAlign: 'center', width: 60 }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {materials.map((m, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid var(--ax-border, #f1f5f9)' }}>
                        <td style={{ padding: 8 }}>
                          <select value={m.product_id} onChange={(e) => handleMaterialChange(idx, 'product_id', Number(e.target.value))} style={{ width: '100%', padding: '6px 8px', borderRadius: 6, border: '1px solid var(--ax-border, #cbd5e1)' }} required>
                            {(bosData?.products || []).map((p) => (<option key={p.id} value={p.id}>{p.name}</option>))}
                            {(!bosData?.products || bosData.products.length === 0) && (<option value={m.product_id}>Product #{m.product_id}</option>)}
                          </select>
                        </td>
                        <td style={{ padding: 8 }}>
                          <input type="number" min="0" step="any" value={m.qty} onChange={(e) => handleMaterialChange(idx, 'qty', e.target.value)} style={{ width: '100%', padding: '6px 8px', borderRadius: 6, border: '1px solid var(--ax-border, #cbd5e1)' }} required />
                        </td>
                        <td style={{ padding: 8 }}>
                          <select value={m.unit} onChange={(e) => handleMaterialChange(idx, 'unit', e.target.value)} style={{ width: '100%', padding: '6px 8px', borderRadius: 6, border: '1px solid var(--ax-border, #cbd5e1)' }}>
                            <option value="Nos">Nos</option>
                            <option value="Set">Set</option>
                            <option value="Mtr">Mtr</option>
                            <option value="Kg">Kg</option>
                            <option value="Ltr">Ltr</option>
                          </select>
                        </td>
                        <td style={{ padding: 8 }}>
                          <input type="text" placeholder="e.g. Bifacial, Grade A" value={m.product_remarks} onChange={(e) => handleMaterialChange(idx, 'product_remarks', e.target.value)} style={{ width: '100%', padding: '6px 8px', borderRadius: 6, border: '1px solid var(--ax-border, #cbd5e1)' }} />
                        </td>
                        <td style={{ padding: 8, textAlign: 'center' }}>
                          <button type="button" onClick={() => handleRemoveMaterial(idx)} disabled={materials.length <= 1} className="ax-btn ax-btn--ghost ax-btn--xs" style={{ color: materials.length <= 1 ? '#cbd5e1' : '#dc2626' }} title="Delete row">✕</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <div className="ax-modal__footer" style={{ justifyContent: 'flex-end' }}>
          <button type="button" onClick={onClose} className="ax-btn ax-btn--secondary" disabled={submitting}>Cancel</button>
          <button type="submit" className="ax-btn ax-btn--primary" disabled={submitting} style={{ background: '#16a34a', borderColor: '#16a34a' }}>
            {submitting ? 'Saving BOS...' : 'Save BOS Products'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

/* ───────── Modal 3: View Full Survey Details ───────── */
function DetailModal({
  open,
  item,
  onClose,
}: {
  open: boolean;
  item: UpRescoSurveyRecord | null;
  onClose: () => void;
}) {
  if (!item) return null;

  return (
    <Modal open={open} onClose={onClose} labelledBy="view-detail-title" dialogStyle={{ maxWidth: 780, maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
      <div className="ax-modal__header">
        <div>
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--ax-accent, #2563eb)', textTransform: 'uppercase' }}>Resco Feasibility Survey Record</span>
          <h2 className="ax-modal__title" id="view-detail-title">{item.site_name} {item.uid ? `(${item.uid})` : ''}</h2>
        </div>
        <button type="button" className="ax-modal__close" onClick={onClose} aria-label="Close dialog">{X_ICON}</button>
      </div>

      <div className="ax-modal__body" style={{ padding: 20, overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* General Info */}
        <div style={{ padding: 14, borderRadius: 10, background: 'var(--ax-surface-subtle, #f8fafc)', border: '1px solid var(--ax-border, #e2e8f0)' }}>
          <h4 style={{ margin: '0 0 10px', fontSize: 13, fontWeight: 700 }}>General Information</h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, fontSize: 12.5 }}>
            <div><span style={{ color: 'var(--ax-text-muted)' }}>Unique ID: </span><strong>{item.uid || `RESCO-${item.id}`}</strong></div>
            <div><span style={{ color: 'var(--ax-text-muted)' }}>State / District: </span><strong>{(item.state || 'UP').toUpperCase()}, {item.district || DASH}</strong></div>
            <div><span style={{ color: 'var(--ax-text-muted)' }}>Division / Sub: </span><strong>{item.division || DASH} / {item.sub_division || DASH}</strong></div>
            <div><span style={{ color: 'var(--ax-text-muted)' }}>Department: </span><strong>{item.dept_name || DASH}</strong></div>
            <div><span style={{ color: 'var(--ax-text-muted)' }}>CA No.: </span><strong>{item.ca_no || DASH}</strong></div>
            <div><span style={{ color: 'var(--ax-text-muted)' }}>Coordinates: </span><strong>{item.latitude ? `${item.latitude}, ${item.longitude}` : DASH}</strong></div>
            <div style={{ gridColumn: 'span 3' }}><span style={{ color: 'var(--ax-text-muted)' }}>Site Address: </span><strong>{item.survey_address || item.site_address || DASH}</strong></div>
            <div style={{ gridColumn: 'span 3' }}><span style={{ color: 'var(--ax-text-muted)' }}>Nearest Landmark: </span><strong>{item.near_landmark || DASH}</strong></div>
          </div>
        </div>

        {/* Contact Details */}
        <div style={{ padding: 14, borderRadius: 10, background: 'var(--ax-surface-subtle, #f8fafc)', border: '1px solid var(--ax-border, #e2e8f0)' }}>
          <h4 style={{ margin: '0 0 10px', fontSize: 13, fontWeight: 700 }}>Contact Persons</h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, fontSize: 12.5 }}>
            <div><span style={{ color: 'var(--ax-text-muted)' }}>Agency Contact Person: </span><strong>{item.agency_person_name || DASH}</strong></div>
            <div><span style={{ color: 'var(--ax-text-muted)' }}>Agency Contact No.: </span><strong>{item.agency_person_contact || DASH}</strong></div>
            <div><span style={{ color: 'var(--ax-text-muted)' }}>Nodal Person: </span><strong>{item.nodal_person || DASH}</strong></div>
            <div><span style={{ color: 'var(--ax-text-muted)' }}>Nodal Person Contact: </span><strong>{item.contact_nodal || DASH}</strong></div>
          </div>
        </div>

        {/* Electrical & Rooftop */}
        <div style={{ padding: 14, borderRadius: 10, background: 'var(--ax-surface-subtle, #f8fafc)', border: '1px solid var(--ax-border, #e2e8f0)' }}>
          <h4 style={{ margin: '0 0 10px', fontSize: 13, fontWeight: 700 }}>Technical & Rooftop Details</h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, fontSize: 12.5 }}>
            <div><span style={{ color: 'var(--ax-text-muted)' }}>Load Type: </span><strong>{item.load_type || DASH}</strong></div>
            <div><span style={{ color: 'var(--ax-text-muted)' }}>Connection Phase: </span><strong>{item.connection_phase || DASH}</strong></div>
            <div><span style={{ color: 'var(--ax-text-muted)' }}>Meter Type & No.: </span><strong>{item.meter_type || DASH} ({item.meter_number || DASH})</strong></div>
            <div><span style={{ color: 'var(--ax-text-muted)' }}>Sanction Load: </span><strong>{item.sanction_load || DASH} KW</strong></div>
            <div><span style={{ color: 'var(--ax-text-muted)' }}>Connected Load: </span><strong>{item.connected_load || DASH} KW</strong></div>
            <div><span style={{ color: 'var(--ax-text-muted)' }}>Grid Power: </span><strong>{item.grid_power || DASH}</strong></div>
            <div><span style={{ color: 'var(--ax-text-muted)' }}>Total Roof Area: </span><strong>{item.area_roof || DASH} Sq.Ft</strong></div>
            <div><span style={{ color: 'var(--ax-text-muted)' }}>Solar Free Space: </span><strong>{item.free_space_solar || DASH} Sq.Ft</strong></div>
            <div><span style={{ color: 'var(--ax-text-muted)' }}>Control Room Space: </span><strong>{item.free_space_inverter || DASH} Sq.Ft</strong></div>
            <div><span style={{ color: 'var(--ax-text-muted)' }}>Roof Condition: </span><strong>{item.roof_condition || DASH}</strong></div>
            <div><span style={{ color: 'var(--ax-text-muted)' }}>Earth Pit: </span><strong>{item.earth_pit || DASH}</strong></div>
            <div><span style={{ color: 'var(--ax-text-muted)' }}>Building Age: </span><strong>{item.building_age || item.age_of_building || DASH}</strong></div>
            <div><span style={{ color: 'var(--ax-text-muted)' }}>Roof Access: </span><strong>{item.roof_access || DASH}</strong></div>
            <div><span style={{ color: 'var(--ax-text-muted)' }}>Rooftop Height: </span><strong>{item.rooftop_height || DASH} Ft</strong></div>
            <div><span style={{ color: 'var(--ax-text-muted)' }}>Parapet Height: </span><strong>{item.parapet_height || DASH} Ft</strong></div>
            <div><span style={{ color: 'var(--ax-text-muted)' }}>Floors: </span><strong>{item.floors_number || DASH}</strong></div>
            <div><span style={{ color: 'var(--ax-text-muted)' }}>Water Source: </span><strong>{item.water_source || DASH}</strong></div>
            <div><span style={{ color: 'var(--ax-text-muted)' }}>Distance from Road: </span><strong>{item.site_distance || DASH} km</strong></div>
          </div>
        </div>

        {/* Remarks */}
        <div style={{ padding: 14, borderRadius: 10, background: 'var(--ax-surface-subtle, #f8fafc)', border: '1px solid var(--ax-border, #e2e8f0)' }}>
          <h4 style={{ margin: '0 0 6px', fontSize: 13, fontWeight: 700 }}>Survey Remarks</h4>
          <p style={{ margin: 0, fontSize: 12.5 }}>{item.survey_remarks || DASH}</p>
        </div>

        {/* Photos & Files */}
        <div style={{ padding: 14, borderRadius: 10, background: 'var(--ax-surface-subtle, #f8fafc)', border: '1px solid var(--ax-border, #e2e8f0)' }}>
          <h4 style={{ margin: '0 0 10px', fontSize: 13, fontWeight: 700 }}>Attached Images & Documents</h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
            {(item.image1 || item.building_image) && (
              <div style={{ textAlign: 'center' }}>
                <a href={getUpSurveyMediaUrl(item.image1 || item.building_image)} target="_blank" rel="noreferrer">
                  <img src={getUpSurveyMediaUrl(item.image1 || item.building_image)} alt="Building" style={{ width: '100%', height: 100, objectFit: 'cover', border: '1px solid var(--ax-border)' }} />
                </a>
                <span style={{ fontSize: 11, color: 'var(--ax-text-muted)', display: 'block', marginTop: 4 }}>Building</span>
              </div>
            )}
            {(item.image2 || item.roof_image) && (
              <div style={{ textAlign: 'center' }}>
                <a href={getUpSurveyMediaUrl(item.image2 || item.roof_image)} target="_blank" rel="noreferrer">
                  <img src={getUpSurveyMediaUrl(item.image2 || item.roof_image)} alt="Roof" style={{ width: '100%', height: 100, objectFit: 'cover', border: '1px solid var(--ax-border)' }} />
                </a>
                <span style={{ fontSize: 11, color: 'var(--ax-text-muted)', display: 'block', marginTop: 4 }}>Roof</span>
              </div>
            )}
            {(item.image3 || item.control_room_image) && (
              <div style={{ textAlign: 'center' }}>
                <a href={getUpSurveyMediaUrl(item.image3 || item.control_room_image)} target="_blank" rel="noreferrer">
                  <img src={getUpSurveyMediaUrl(item.image3 || item.control_room_image)} alt="Control Room" style={{ width: '100%', height: 100, objectFit: 'cover', border: '1px solid var(--ax-border)' }} />
                </a>
                <span style={{ fontSize: 11, color: 'var(--ax-text-muted)', display: 'block', marginTop: 4 }}>Control Room</span>
              </div>
            )}
            {item.image4 && (
              <div style={{ textAlign: 'center' }}>
                <a href={getUpSurveyMediaUrl(item.image4)} target="_blank" rel="noreferrer">
                  <img src={getUpSurveyMediaUrl(item.image4)} alt="Meter" style={{ width: '100%', height: 100, objectFit: 'cover', border: '1px solid var(--ax-border)' }} />
                </a>
                <span style={{ fontSize: 11, color: 'var(--ax-text-muted)', display: 'block', marginTop: 4 }}>Meter</span>
              </div>
            )}
            {item.image5 && (
              <div style={{ textAlign: 'center' }}>
                <a href={getUpSurveyMediaUrl(item.image5)} target="_blank" rel="noreferrer">
                  <img src={getUpSurveyMediaUrl(item.image5)} alt="Other" style={{ width: '100%', height: 100, objectFit: 'cover', border: '1px solid var(--ax-border)' }} />
                </a>
                <span style={{ fontSize: 11, color: 'var(--ax-text-muted)', display: 'block', marginTop: 4 }}>Other</span>
              </div>
            )}
            {(item.pdf_file || item.pdf) && (
              <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <a href={getUpSurveyMediaUrl(item.pdf_file || item.pdf)} target="_blank" rel="noreferrer" className="ax-btn ax-btn--ghost ax-btn--sm">View PDF File</a>
                <span style={{ fontSize: 11, color: 'var(--ax-text-muted)', display: 'block', marginTop: 4 }}>Survey PDF</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="ax-modal__footer" style={{ justifyContent: 'flex-end' }}>
        <button type="button" onClick={onClose} className="ax-btn ax-btn--primary">Close</button>
      </div>
    </Modal>
  );
}

/* ───────── Helper: is survey considered complete ───────── */
function isSurveyComplete(r: UpRescoSurveyRecord): boolean {
  return Boolean(r.latitude && r.longitude && r.site_name);
}

const TOTAL_COLUMNS = 52;

/* ═══════════════════════════════════════════════════════════
   Main Page Component
   ═══════════════════════════════════════════════════════════ */
export function UP_Survey_Resco_ViewResco() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState<UpRescoSurveyRecord[]>([]);
  const [counts, setCounts] = useState<UpRescoSurveyCounts>({ total: 0, complete: 0, pending: 0 });

  // Filters
  const [search, setSearch] = useState('');
  const [districtFilter, setDistrictFilter] = useState('all');
  const [bosFilter, setBosFilter] = useState<'all' | 'pending' | 'submitted'>('all');
  const [surveyFilter, setSurveyFilter] = useState<'all' | 'complete' | 'pending'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(100);

  // Modals
  const [bosFileItem, setBosFileItem] = useState<UpRescoSurveyRecord | null>(null);
  const [bosProdItem, setBosProdItem] = useState<UpRescoSurveyRecord | null>(null);
  const [detailItem, setDetailItem] = useState<UpRescoSurveyRecord | null>(null);

  // Feedback
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'danger'; text: string } | null>(null);

  const loadData = useCallback(() => {
    setLoading(true);
    upSurveyService
      .getViewRescoSurveys()
      .then((res) => {
        setRecords(res.resco);
        setCounts(res.survey_detail);
      })
      .catch((err) => {
        console.error('Error fetching Resco surveys:', err);
        setFeedbackMsg({ type: 'danger', text: err?.message || 'Failed to load Resco surveys.' });
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Auto-dismiss feedback
  useEffect(() => {
    if (!feedbackMsg) return;
    const t = window.setTimeout(() => setFeedbackMsg(null), 4000);
    return () => window.clearTimeout(t);
  }, [feedbackMsg]);

  // Distinct districts
  const districts = useMemo(() => {
    const set = new Set<string>();
    records.forEach((r) => {
      if (r.district && r.district.trim()) set.add(r.district.trim());
    });
    return Array.from(set).sort();
  }, [records]);

  // Filtered records
  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      // Survey filter (KPI)
      if (surveyFilter === 'complete' && !isSurveyComplete(r)) return false;
      if (surveyFilter === 'pending' && isSurveyComplete(r)) return false;

      // BOS filter
      if (bosFilter === 'submitted' && Number(r.bos_status) !== 1) return false;
      if (bosFilter === 'pending' && Number(r.bos_status) === 1) return false;

      // District filter
      if (districtFilter !== 'all' && (r.district || '').toLowerCase() !== districtFilter.toLowerCase()) return false;

      // Search
      if (search.trim()) {
        const q = search.toLowerCase();
        const haystack = [
          r.uid || `RESCO-${r.id}`,
          r.site_name,
          r.district,
          r.division,
          r.dept_name,
          r.ca_no,
          r.survey_address || r.site_address,
          r.agency_person_name,
          r.nodal_person,
          r.meter_number,
          String(r.id),
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }

      return true;
    });
  }, [records, surveyFilter, bosFilter, districtFilter, search]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredRecords.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedData = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return filteredRecords.slice(start, start + pageSize);
  }, [filteredRecords, safePage, pageSize]);

  const hasFilters = search.trim() !== '' || districtFilter !== 'all' || bosFilter !== 'all' || surveyFilter !== 'all';
  const resetFilters = () => {
    setSearch('');
    setDistrictFilter('all');
    setBosFilter('all');
    setSurveyFilter('all');
    setCurrentPage(1);
  };

  const setSurvey = (s: 'all' | 'complete' | 'pending') => {
    setSurveyFilter(s);
    setCurrentPage(1);
  };

  // Export columns
  const exportCols: ExportColumn<UpRescoSurveyRecord>[] = useMemo(
    () => [
      { header: 'Sr. No.', accessor: (_r, i) => i + 1 },
      { header: 'Unique ID', accessor: (r) => r.uid || `RESCO-${r.id}` },
      { header: 'State', accessor: (r) => (r.state || 'UP').toUpperCase() },
      { header: 'District', accessor: (r) => r.district || DASH },
      { header: 'Division', accessor: (r) => r.division || DASH },
      { header: 'Sub Division', accessor: (r) => r.sub_division || DASH },
      { header: 'Department', accessor: (r) => r.dept_name || DASH },
      { header: 'Site Name', accessor: (r) => r.site_name || DASH },
      { header: 'Site Address', accessor: (r) => r.site_address || DASH },
      { header: 'CA No.', accessor: (r) => r.ca_no || DASH },
      { header: 'Survey Address', accessor: (r) => r.survey_address || DASH },
      { header: 'Nearest Landmark', accessor: (r) => r.near_landmark || DASH },
      { header: 'Agency Contact Person Name', accessor: (r) => r.agency_person_name || DASH },
      { header: 'Agency Contact Number', accessor: (r) => r.agency_person_contact || DASH },
      { header: 'Nodal Person', accessor: (r) => r.nodal_person || DASH },
      { header: 'Nodal Person Contact', accessor: (r) => r.contact_nodal || DASH },
      { header: 'Latitude', accessor: (r) => r.latitude || DASH },
      { header: 'Longitude', accessor: (r) => r.longitude || DASH },
      { header: 'Load Type', accessor: (r) => r.load_type || DASH },
      { header: 'Connection Phase', accessor: (r) => r.connection_phase || DASH },
      { header: 'Meter Connection Type', accessor: (r) => r.meter_connection || DASH },
      { header: 'Meter Number', accessor: (r) => r.meter_number || DASH },
      { header: 'Meter Type', accessor: (r) => r.meter_type || DASH },
      { header: 'Sanction Load (KW/KVA)', accessor: (r) => r.sanction_load || DASH },
      { header: 'Connected Load (KW)', accessor: (r) => r.connected_load || DASH },
      { header: 'Grid Power Availability', accessor: (r) => r.grid_power || DASH },
      { header: 'Three-Phase Availability', accessor: (r) => r.all_3_phase_ltdb || DASH },
      { header: 'Missing Phase', accessor: (r) => r.missing_phase || DASH },
      { header: 'LTDB Present', accessor: (r) => r.ltdb_present || DASH },
      { header: 'Roof Condition', accessor: (r) => r.roof_condition || DASH },
      { header: 'Total Roof Area (Sq.Feet)', accessor: (r) => r.area_roof || DASH },
      { header: 'Free Space for Solar (Sq.Feet)', accessor: (r) => r.free_space_solar || DASH },
      { header: 'Free Space for Inverter (Sq.Feet)', accessor: (r) => r.free_space_inverter || DASH },
      { header: 'Earth Pit Position', accessor: (r) => r.earth_pit || DASH },
      { header: 'Age of Building', accessor: (r) => r.building_age || r.age_of_building || DASH },
      { header: 'Access to Roof', accessor: (r) => r.roof_access || DASH },
      { header: 'Rooftop Height (Feet)', accessor: (r) => r.rooftop_height || DASH },
      { header: 'Parapet Height (Feet)', accessor: (r) => r.parapet_height || DASH },
      { header: 'No. of Floors', accessor: (r) => r.floors_number || DASH },
      { header: 'Water Source', accessor: (r) => r.water_source || DASH },
      { header: 'Access to Site', accessor: (r) => r.site_access || DASH },
      { header: 'Distance from Main Road (km)', accessor: (r) => r.site_distance || DASH },
      { header: 'BOS Status', accessor: (r) => (Number(r.bos_status) === 1 ? 'Submitted' : 'Pending') },
      { header: 'BOS Remarks', accessor: (r) => r.bos_remarks || DASH },
    ],
    []
  );

  return (
    <div className="solar-erp-page">
      <style>{PAGE_CSS}</style>
      <style>{OVERLAY_CSS}</style>

      {/* ── Page Head ── */}
      <PageHead
        title="View UP Resco Survey"
        subtitle="View completed Resco rooftop solar surveys, submit BOS files and generate BOS products"
        breadcrumbs={[
          { label: 'Home', href: '/v-dashboard' },
          { label: 'View UP Resco Survey' },
          { label: 'Resco Survey Records' },
        ]}
        actions={
          <div className="ax-cluster" style={{ gap: 'var(--ax-space-2)' }}>
            <button
              type="button"
              className="ax-btn ax-btn--secondary ax-btn--sm"
              onClick={loadData}
              disabled={loading}
            >
              <span className={loading ? 'ax-spinner' : ''}>{ICON_REFRESH}</span>
              <span className="ax-btn__label">Refresh</span>
            </button>
          </div>
        }
      />

      {/* ── Feedback Alert ── */}
      {feedbackMsg && (
        <div
          className={`ax-alert ax-alert--${feedbackMsg.type}`}
          style={{ marginBottom: 'var(--ax-space-4)' }}
          role="status"
        >
          <div className="ax-alert__content">{feedbackMsg.text}</div>
          <button type="button" className="ax-btn ax-btn--ghost ax-btn--xs" onClick={() => setFeedbackMsg(null)} aria-label="Dismiss alert">{X_ICON}</button>
        </div>
      )}

      {/* ── KPI Cards (click to filter) ── */}
      <div className="ax-dash-grid" style={{ marginBottom: 'var(--ax-space-4)' }}>
        {loading ? (
          <>
            <KpiSkeleton />
            <KpiSkeleton />
            <KpiSkeleton />
          </>
        ) : (
          <>
            <KpiCard
              tone="accent"
              label="Total Surveys"
              value={counts.total.toLocaleString('en-IN')}
              sub="All assigned surveys"
              active={surveyFilter === 'all'}
              onClick={() => setSurvey('all')}
              icon={svg(
                <>
                  <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
                  <rect x="9" y="3" width="6" height="4" rx="2" />
                  <path d="M9 14l2 2 4-4" />
                </>
              )}
            />
            <KpiCard
              tone="emerald"
              label="Survey Complete"
              value={counts.complete.toLocaleString('en-IN')}
              sub="Completed surveys"
              active={surveyFilter === 'complete'}
              onClick={() => setSurvey('complete')}
              icon={svg(
                <>
                  <circle cx="12" cy="12" r="9" />
                  <path d="M9 12l2 2 4-4" />
                </>
              )}
            />
            <KpiCard
              tone="amber"
              label="Survey Pending"
              value={counts.pending.toLocaleString('en-IN')}
              sub="Awaiting completion"
              active={surveyFilter === 'pending'}
              onClick={() => setSurvey('pending')}
              icon={svg(
                <>
                  <circle cx="12" cy="12" r="9" />
                  <path d="M12 7v5l3 3" />
                </>
              )}
            />
          </>
        )}
      </div>

      {/* ── Main Table Card ── */}
      <div className="ax-dash-grid">
        <section className="ax-card ax-col--12" role="region" aria-label="Resco Survey Records">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <span className="ax-card__eyebrow">RESCO SURVEYS</span>
              <h2 className="ax-card__title">View Resco Survey Information</h2>
              <p className="ax-card__subtitle ax-num" style={{ fontFamily: 'var(--ax-font-mono)' }}>
                {filteredRecords.length} of {records.length} records
              </p>
            </div>
            <div className="ax-card__actions">
              <div className="ax-cluster" style={actionsRowStyle}>
                {districts.length > 0 && (
                  <select
                    className="ax-input ax-input--sm"
                    style={{ width: 140, height: 32, fontSize: 'var(--ax-text-xs)' }}
                    value={districtFilter}
                    onChange={(e) => { setDistrictFilter(e.target.value); setCurrentPage(1); }}
                    aria-label="Filter by district"
                  >
                    <option value="all">All Districts</option>
                    {districts.map((d) => (<option key={d} value={d}>{d}</option>))}
                  </select>
                )}

                <select
                  className="ax-input ax-input--sm"
                  style={{ width: 140, height: 32, fontSize: 'var(--ax-text-xs)' }}
                  value={bosFilter}
                  onChange={(e) => { setBosFilter(e.target.value as any); setCurrentPage(1); }}
                  aria-label="Filter by BOS status"
                >
                  <option value="all">All BOS Status</option>
                  <option value="pending">BOS Pending</option>
                  <option value="submitted">BOS Submitted</option>
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
                  onChange={(val) => { setSearch(val); setCurrentPage(1); }}
                  placeholder="Search site, district, CA no…"
                  size="sm"
                  ariaLabel="Search surveys"
                />

                <TableExportToolbar
                  onCopy={() => copyTableDataToClipboard(filteredRecords, exportCols)}
                  onExportCSV={() => exportDataToCSV('Resco_Surveys', filteredRecords, exportCols)}
                  onExportExcel={() => exportDataToExcel('Resco_Surveys', filteredRecords, exportCols)}
                  onExportPDF={() => printTableData('Vendor UP Resco Survey Records', filteredRecords, exportCols)}
                />
              </div>
            </div>
          </div>

          {/* ── Table ── */}
          <div className="ax-table-wrap">
            <table className="ax-table ax-table--hover ula-table--wide" style={{ whiteSpace: 'nowrap', minWidth: 3200 }}>
              <caption className="ax-visually-hidden">View Resco Survey Records</caption>
              <thead className="ax-table__head">
                <tr>
                  <th className="ax-table__th" scope="col" style={{ width: 60 }}>Sr. No.</th>
                  <th className="ax-table__th" scope="col">Unique ID</th>
                  <th className="ax-table__th" scope="col">State</th>
                  <th className="ax-table__th" scope="col">District</th>
                  <th className="ax-table__th" scope="col">Division</th>
                  <th className="ax-table__th" scope="col">Sub Division</th>
                  <th className="ax-table__th" scope="col">Department</th>
                  <th className="ax-table__th" scope="col" style={{ minWidth: 160 }}>Site Name</th>
                  <th className="ax-table__th" scope="col" style={{ minWidth: 180 }}>Site Address</th>
                  <th className="ax-table__th" scope="col">CA No.</th>
                  <th className="ax-table__th" scope="col" style={{ minWidth: 180 }}>Survey Address</th>
                  <th className="ax-table__th" scope="col">Nearest Landmark</th>
                  <th className="ax-table__th" scope="col">Agency Contact Person</th>
                  <th className="ax-table__th" scope="col">Agency Contact No.</th>
                  <th className="ax-table__th" scope="col">Nodal Person</th>
                  <th className="ax-table__th" scope="col">Nodal Person Contact</th>
                  <th className="ax-table__th" scope="col">Latitude</th>
                  <th className="ax-table__th" scope="col">Longitude</th>
                  <th className="ax-table__th" scope="col">Load Type</th>
                  <th className="ax-table__th" scope="col">Connection Phase</th>
                  <th className="ax-table__th" scope="col">Meter Connection</th>
                  <th className="ax-table__th" scope="col">Meter Number</th>
                  <th className="ax-table__th" scope="col">Meter Type</th>
                  <th className="ax-table__th" scope="col">Sanction Load</th>
                  <th className="ax-table__th" scope="col">Connected Load</th>
                  <th className="ax-table__th" scope="col">Grid Power</th>
                  <th className="ax-table__th" scope="col">3-Phase Avail.</th>
                  <th className="ax-table__th" scope="col">Missing Phase</th>
                  <th className="ax-table__th" scope="col">LTDB Present</th>
                  <th className="ax-table__th" scope="col">Roof Condition</th>
                  <th className="ax-table__th" scope="col">Roof Area (Sq.Ft)</th>
                  <th className="ax-table__th" scope="col">Solar Free Space</th>
                  <th className="ax-table__th" scope="col">Inverter Free Space</th>
                  <th className="ax-table__th" scope="col">Earth Pit</th>
                  <th className="ax-table__th" scope="col">Building Age</th>
                  <th className="ax-table__th" scope="col">Roof Access</th>
                  <th className="ax-table__th" scope="col">Rooftop Height</th>
                  <th className="ax-table__th" scope="col">Parapet Height</th>
                  <th className="ax-table__th" scope="col">Floors</th>
                  <th className="ax-table__th" scope="col">Water Source</th>
                  <th className="ax-table__th" scope="col">Site Access</th>
                  <th className="ax-table__th" scope="col">Distance from Road</th>
                  <th className="ax-table__th" scope="col" style={{ textAlign: 'center' }}>Building Img</th>
                  <th className="ax-table__th" scope="col" style={{ textAlign: 'center' }}>Roof Img</th>
                  <th className="ax-table__th" scope="col" style={{ textAlign: 'center' }}>Control Room</th>
                  <th className="ax-table__th" scope="col" style={{ textAlign: 'center' }}>Meter Img</th>
                  <th className="ax-table__th" scope="col" style={{ textAlign: 'center' }}>Other Img</th>
                  <th className="ax-table__th" scope="col" style={{ textAlign: 'center' }}>PDF</th>
                  <th className="ax-table__th" scope="col" style={{ width: 100 }}>BOS Status</th>
                  <th className="ax-table__th" scope="col" style={{ textAlign: 'center' }}>BOS File</th>
                  <th className="ax-table__th" scope="col" style={{ minWidth: 140 }}>BOS Remarks</th>
                  <th className="ax-table__th" scope="col" style={{ width: 260, textAlign: 'center', position: 'sticky', right: 0, background: 'var(--ax-surface-subtle, #f8fafc)', zIndex: 2 }}>Action</th>
                </tr>
              </thead>
              <tbody aria-busy={loading}>
                {loading && (
                  <tr>
                    <td className="ax-table__td" colSpan={TOTAL_COLUMNS} style={{ textAlign: 'center', padding: 32 }}>
                      <span className="ax-spinner" style={{ marginRight: 8 }} /> Loading Resco survey records…
                    </td>
                  </tr>
                )}
                {!loading && filteredRecords.length === 0 && (
                  <tr>
                    <td className="ax-table__td" colSpan={TOTAL_COLUMNS} style={{ padding: 0 }}>
                      <TableEmptyState
                        title="No data available in table"
                        message={hasFilters ? 'No records match your filters or search. Try clearing your query.' : 'Resco survey records will appear here once completed.'}
                        onClear={hasFilters ? resetFilters : undefined}
                      />
                    </td>
                  </tr>
                )}
                {!loading &&
                  paginatedData.map((row, index) => {
                    const srNo = (safePage - 1) * pageSize + index + 1;
                    const bImage = row.image1 || row.building_image;
                    const rImage = row.image2 || row.roof_image;
                    const cImage = row.image3 || row.control_room_image;
                    const mImage = row.image4;
                    const oImage = row.image5;
                    const pdfDoc = row.pdf_file || row.pdf;
                    const bosDoc = row.bos_file;
                    const isBosDone = Number(row.bos_status) === 1;

                    return (
                      <tr key={row.id || index} className="ax-table__row">
                        <td className="ax-table__td ax-num">{srNo}</td>
                        <td className="ax-table__td" style={{ fontWeight: 600 }}>{row.uid || `RESCO-${row.id}`}</td>
                        <td className="ax-table__td">{(row.state || 'UP').toUpperCase()}</td>
                        <td className="ax-table__td">{row.district || DASH}</td>
                        <td className="ax-table__td">{row.division || DASH}</td>
                        <td className="ax-table__td">{row.sub_division || DASH}</td>
                        <td className="ax-table__td">{row.dept_name || DASH}</td>
                        <td className="ax-table__td" style={{ fontWeight: 600, color: 'var(--ax-accent)' }}>{row.site_name || DASH}</td>
                        <td className="ax-table__td" style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>{row.site_address || DASH}</td>
                        <td className="ax-table__td">{row.ca_no || DASH}</td>
                        <td className="ax-table__td" style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>{row.survey_address || DASH}</td>
                        <td className="ax-table__td">{row.near_landmark || DASH}</td>
                        <td className="ax-table__td">{row.agency_person_name || DASH}</td>
                        <td className="ax-table__td">{row.agency_person_contact || DASH}</td>
                        <td className="ax-table__td">{row.nodal_person || DASH}</td>
                        <td className="ax-table__td">{row.contact_nodal || DASH}</td>
                        <td className="ax-table__td">{row.latitude || DASH}</td>
                        <td className="ax-table__td">{row.longitude || DASH}</td>
                        <td className="ax-table__td">{row.load_type || DASH}</td>
                        <td className="ax-table__td">{row.connection_phase || DASH}</td>
                        <td className="ax-table__td">{row.meter_connection || DASH}</td>
                        <td className="ax-table__td">{row.meter_number || DASH}</td>
                        <td className="ax-table__td">{row.meter_type || DASH}</td>
                        <td className="ax-table__td">{row.sanction_load || DASH}</td>
                        <td className="ax-table__td">{row.connected_load || DASH}</td>
                        <td className="ax-table__td">{row.grid_power || DASH}</td>
                        <td className="ax-table__td">{row.all_3_phase_ltdb || DASH}</td>
                        <td className="ax-table__td">{row.missing_phase || DASH}</td>
                        <td className="ax-table__td">{row.ltdb_present || DASH}</td>
                        <td className="ax-table__td">{row.roof_condition || DASH}</td>
                        <td className="ax-table__td">{row.area_roof || DASH}</td>
                        <td className="ax-table__td">{row.free_space_solar || DASH}</td>
                        <td className="ax-table__td">{row.free_space_inverter || DASH}</td>
                        <td className="ax-table__td">{row.earth_pit || DASH}</td>
                        <td className="ax-table__td">{row.building_age || row.age_of_building || DASH}</td>
                        <td className="ax-table__td">{row.roof_access || DASH}</td>
                        <td className="ax-table__td">{row.rooftop_height || DASH}</td>
                        <td className="ax-table__td">{row.parapet_height || DASH}</td>
                        <td className="ax-table__td">{row.floors_number || DASH}</td>
                        <td className="ax-table__td">{row.water_source || DASH}</td>
                        <td className="ax-table__td">{row.site_access || DASH}</td>
                        <td className="ax-table__td">{row.site_distance || DASH}</td>

                        {/* Image links */}
                        <td className="ax-table__td" style={{ textAlign: 'center' }}>
                          {bImage ? (<a href={getUpSurveyMediaUrl(bImage)} target="_blank" rel="noreferrer" style={{ color: 'var(--ax-accent)', fontSize: 12 }}>View</a>) : DASH}
                        </td>
                        <td className="ax-table__td" style={{ textAlign: 'center' }}>
                          {rImage ? (<a href={getUpSurveyMediaUrl(rImage)} target="_blank" rel="noreferrer" style={{ color: 'var(--ax-accent)', fontSize: 12 }}>View</a>) : DASH}
                        </td>
                        <td className="ax-table__td" style={{ textAlign: 'center' }}>
                          {cImage ? (<a href={getUpSurveyMediaUrl(cImage)} target="_blank" rel="noreferrer" style={{ color: 'var(--ax-accent)', fontSize: 12 }}>View</a>) : DASH}
                        </td>
                        <td className="ax-table__td" style={{ textAlign: 'center' }}>
                          {mImage ? (<a href={getUpSurveyMediaUrl(mImage)} target="_blank" rel="noreferrer" style={{ color: 'var(--ax-accent)', fontSize: 12 }}>View</a>) : DASH}
                        </td>
                        <td className="ax-table__td" style={{ textAlign: 'center' }}>
                          {oImage ? (<a href={getUpSurveyMediaUrl(oImage)} target="_blank" rel="noreferrer" style={{ color: 'var(--ax-accent)', fontSize: 12 }}>View</a>) : DASH}
                        </td>
                        <td className="ax-table__td" style={{ textAlign: 'center' }}>
                          {pdfDoc ? (<a href={getUpSurveyMediaUrl(pdfDoc)} target="_blank" rel="noreferrer" style={{ color: 'var(--ax-accent)', fontSize: 12 }}>PDF</a>) : DASH}
                        </td>

                        {/* BOS info */}
                        <td className="ax-table__td">
                          {isBosDone ? (
                            <span className="ax-badge ax-badge--soft ax-badge--success" style={{ fontWeight: 600 }}>Submitted</span>
                          ) : (
                            <span className="ax-badge ax-badge--soft ax-badge--warning" style={{ fontWeight: 600 }}>Pending</span>
                          )}
                        </td>
                        <td className="ax-table__td" style={{ textAlign: 'center' }}>
                          {bosDoc ? (<a href={getUpSurveyMediaUrl(bosDoc)} target="_blank" rel="noreferrer" style={{ color: 'var(--ax-accent)', fontSize: 12 }}>BOS File</a>) : DASH}
                        </td>
                        <td className="ax-table__td" style={{ maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis' }}>{row.bos_remarks || DASH}</td>

                        {/* Sticky Action Column */}
                        <td
                          className="ax-table__td"
                          style={{
                            textAlign: 'center',
                            position: 'sticky',
                            right: 0,
                            background: 'var(--ax-surface-solid, #ffffff)',
                            zIndex: 2,
                            boxShadow: '-2px 0 6px rgba(0,0,0,0.05)',
                          }}
                        >
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                            <button type="button" onClick={() => setDetailItem(row)} className="ax-btn ax-btn--subtle ax-btn--xs" style={{ fontSize: 11 }} title="View Details">View</button>
                            <button type="button" onClick={() => navigate(`/v/up/resco-survey?edit_id=${row.id}`)} className="ax-btn ax-btn--subtle ax-btn--xs" style={{ fontSize: 11, color: '#d97706' }} title="Edit Survey">Edit</button>
                            <button type="button" onClick={() => setBosFileItem(row)} className="ax-btn ax-btn--subtle ax-btn--xs" style={{ fontSize: 11, color: 'var(--ax-accent)' }} title="Submit BOS File">BOS File</button>
                            <button type="button" onClick={() => setBosProdItem(row)} className="ax-btn ax-btn--subtle ax-btn--xs" style={{ fontSize: 11, color: '#16a34a' }} title="Fill BOS Products">BOS Products</button>
                            {isBosDone && (
                              <button
                                type="button"
                                onClick={() => upSurveyService.downloadRescoBosPdf(row.id, row.site_name || 'Site')}
                                className="ax-btn ax-btn--primary ax-btn--xs"
                                style={{ fontSize: 11, background: '#dc2626', borderColor: '#dc2626' }}
                                title="Download BOS PDF"
                              >
                                PDF
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>

          {/* ── Footer ── */}
          <div className="ax-card__footer" style={footerStyle}>
            <div className="ula-pagination-left">
              <Pagination
                currentPage={safePage}
                pageSize={pageSize}
                totalItems={filteredRecords.length}
                onPageChange={setCurrentPage}
                onPageSizeChange={(size) => { setPageSize(size); setCurrentPage(1); }}
                pageSizeOptions={[25, 50, 100, 200, 300]}
              />
            </div>
          </div>
        </section>
      </div>

      {/* ── Modals ── */}
      <DetailModal open={Boolean(detailItem)} item={detailItem} onClose={() => setDetailItem(null)} />
      <SubmitBosFileModal open={Boolean(bosFileItem)} item={bosFileItem} onClose={() => setBosFileItem(null)} onSuccess={(msg) => { setFeedbackMsg({ type: 'success', text: msg }); loadData(); }} />
      <ManageBosProductsModal open={Boolean(bosProdItem)} item={bosProdItem} onClose={() => setBosProdItem(null)} onSuccess={(msg) => { setFeedbackMsg({ type: 'success', text: msg }); loadData(); }} />
    </div>
  );
}

export const UPSurveyRescoViewResco = UP_Survey_Resco_ViewResco;
export default UP_Survey_Resco_ViewResco;