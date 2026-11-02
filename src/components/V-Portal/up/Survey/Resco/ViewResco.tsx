import { createPortal } from 'react-dom';
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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

type KpiTone = 'accent' | 'emerald' | 'amber';

const TONE: Record<KpiTone, { bg: string; fg: string }> = {
  accent: { bg: 'rgba(37, 99, 235, 0.12)', fg: '#2563eb' },
  emerald: { bg: 'color-mix(in oklab, var(--ax-viz-emerald, #10b981) 14%, transparent)', fg: '#16a34a' },
  amber: { bg: 'color-mix(in oklab, var(--ax-viz-amber, #f59e0b) 14%, transparent)', fg: '#d97706' },
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
    <div className="ax-card ax-col--4" style={{ padding: '16px 20px', borderRadius: 12, minWidth: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
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
      <div style={{ fontSize: 26, fontWeight: 800, color: t.fg, marginTop: 4, fontFamily: 'var(--ax-font-display)' }}>
        {value}
      </div>
      <div style={{ fontSize: 12, color: 'var(--ax-text-muted)', marginTop: 2 }}>
        {sub}
      </div>
    </div>
  );
}

const PAGE_CSS = `
  .solar-erp-page .ax-card { min-width: 0; }
  .solar-erp-page .ax-card__footer { width: 100%; box-sizing: border-box; }
  .solar-erp-page .ula-pagination-left {
    width: 100%; display: flex; justify-content: flex-start; align-items: center; margin: 0; overflow-x: auto;
  }
  .solar-erp-page .ula-pagination-left > * { margin-left: 0 !important; margin-right: 0 !important; }

  .solar-erp-page img,
  .solar-erp-page .ax-card img {
    border-radius: 0 !important;
  }

  .bos-badge {
    display: inline-flex;
    align-items: center;
    padding: 2px 8px;
    border-radius: 9999px;
    font-size: 11px;
    font-weight: 700;
  }
  .bos-badge--pending {
    background: #fef3c7;
    color: #b45309;
    border: 1px solid #fde68a;
  }
  .bos-badge--submitted {
    background: #dcfce7;
    color: #15803d;
    border: 1px solid #bbf7d0;
  }
`;

/* ── Modal 1: Submit BOS File ── */
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
  const dialogRef = useRef<HTMLDivElement>(null);
  useFocusTrap(dialogRef, open);

  const [file, setFile] = useState<File | null>(null);
  const [remarks, setRemarks] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!open) return;
    setFile(null);
    setRemarks('');
    setErrorMsg('');
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open || !item) return null;

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

  return createPortal(
    <div
      className="ax-modal-backdrop"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(3px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        overflowY: 'auto',
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="bos-file-title"
        className="ax-card"
        style={{
          width: '100%',
          maxWidth: 520,
          boxShadow: '0 20px 25px -5px rgba(0,0,0,0.25)',
          borderRadius: 16,
          background: 'var(--ax-surface-solid, #ffffff)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--ax-border, #e2e8f0)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--ax-surface-subtle, #f8fafc)',
          }}
        >
          <div>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#2563eb', textTransform: 'uppercase' }}>
              Bill of Supply
            </span>
            <h3 id="bos-file-title" style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--ax-text, #0f172a)' }}>
              Submit BOS File — {item.site_name || `Site #${item.id}`}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="ax-btn ax-btn--subtle"
            style={{ padding: '6px 12px', fontSize: 12, borderRadius: 6 }}
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: 20 }}>
          {errorMsg && (
            <div
              style={{
                padding: '10px 14px',
                borderRadius: 8,
                marginBottom: 16,
                background: '#fef2f2',
                border: '1px solid #fecaca',
                color: '#991b1b',
                fontSize: 13,
              }}
            >
              {errorMsg}
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, marginBottom: 5 }}>
                BOS Document / Spreadsheet *
              </label>
              <input
                type="file"
                accept=".png,.jpg,.jpeg,.pdf,.xls,.xlsx"
                onChange={(e) => e.target.files && setFile(e.target.files[0])}
                className="ax-input"
                style={{ width: '100%', padding: '8px 12px', borderRadius: 8 }}
                required
              />
              <span style={{ fontSize: 11, color: 'var(--ax-text-muted)', marginTop: 4, display: 'block' }}>
                Allowed formats: PDF, JPG, PNG, XLS, XLSX
              </span>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, marginBottom: 5 }}>
                BOS Remarks (optional)
              </label>
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

          <div
            style={{
              marginTop: 20,
              paddingTop: 16,
              borderTop: '1px solid var(--ax-border, #e2e8f0)',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: 10,
            }}
          >
            <button
              type="button"
              onClick={onClose}
              className="ax-btn ax-btn--subtle"
              disabled={submitting}
              style={{ padding: '8px 16px', borderRadius: 8 }}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="ax-btn ax-btn--primary"
              disabled={submitting}
              style={{
                padding: '8px 20px',
                borderRadius: 8,
                background: '#2563eb',
                color: '#ffffff',
                fontWeight: 600,
              }}
            >
              {submitting ? 'Submitting...' : 'Upload BOS File'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}

/* ── Modal 2: Manage BOS Products (Fill BOS Products) ── */
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
  const dialogRef = useRef<HTMLDivElement>(null);
  useFocusTrap(dialogRef, open);

  const [loadingProducts, setLoadingProducts] = useState(false);
  const [bosData, setBosData] = useState<UpRescoBosProductData | null>(null);

  // Form Fields
  const [requiredDate, setRequiredDate] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  });
  const [vendorName, setVendorName] = useState('Vendor');
  const [siteName, setSiteName] = useState('');
  const [remarks, setRemarks] = useState('');

  // Materials row items
  const [materials, setMaterials] = useState<
    Array<{ product_id: number; qty: string | number; unit: string; product_remarks: string }>
  >([]);

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
                res.resco_bos.materials.map((m) => ({
                  product_id: Number(m.product_id),
                  qty: m.qty,
                  unit: m.unit || 'Nos',
                  product_remarks: m.product_remarks || '',
                }))
              );
            } else if (res.products && res.products.length > 0) {
              setMaterials([
                { product_id: res.products[0].id, qty: 1, unit: 'Nos', product_remarks: '' },
              ]);
            }
          } else if (res.products && res.products.length > 0) {
            setMaterials([
              { product_id: res.products[0].id, qty: 1, unit: 'Nos', product_remarks: '' },
            ]);
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

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, item, onClose]);

  if (!open || !item) return null;

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

    // Check duplicate products
    const pids = materials.map((m) => m.product_id);
    const hasDupes = new Set(pids).size !== pids.length;
    if (hasDupes) {
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

  return createPortal(
    <div
      className="ax-modal-backdrop"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(3px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        overflowY: 'auto',
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="bos-prod-title"
        className="ax-card"
        style={{
          width: '100%',
          maxWidth: 820,
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 25px -5px rgba(0,0,0,0.25)',
          borderRadius: 16,
          background: 'var(--ax-surface-solid, #ffffff)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--ax-border, #e2e8f0)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--ax-surface-subtle, #f8fafc)',
          }}
        >
          <div>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#16a34a', textTransform: 'uppercase' }}>
              BOS Product Management
            </span>
            <h3 id="bos-prod-title" style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--ax-text, #0f172a)' }}>
              Fill BOS Products — {item.site_name || `Site #${item.id}`}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="ax-btn ax-btn--subtle"
            style={{ padding: '6px 12px', fontSize: 12, borderRadius: 6 }}
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
          <div style={{ padding: 20, overflowY: 'auto', flex: 1 }}>
            {errorMsg && (
              <div
                style={{
                  padding: '10px 14px',
                  borderRadius: 8,
                  marginBottom: 16,
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  color: '#991b1b',
                  fontSize: 13,
                }}
              >
                {errorMsg}
              </div>
            )}

            {/* Header Form */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: 14,
                marginBottom: 20,
                padding: 14,
                borderRadius: 10,
                background: 'var(--ax-surface-subtle, #f8fafc)',
                border: '1px solid var(--ax-border, #e2e8f0)',
              }}
            >
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>
                  Required Date *
                </label>
                <input
                  type="date"
                  value={requiredDate}
                  onChange={(e) => setRequiredDate(e.target.value)}
                  className="ax-input"
                  style={{ width: '100%', padding: '7px 10px', borderRadius: 6, fontSize: 12.5 }}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>
                  Vendor Name *
                </label>
                <input
                  type="text"
                  value={vendorName}
                  onChange={(e) => setVendorName(e.target.value)}
                  className="ax-input"
                  style={{ width: '100%', padding: '7px 10px', borderRadius: 6, fontSize: 12.5 }}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>
                  Site Name *
                </label>
                <input
                  type="text"
                  value={siteName}
                  onChange={(e) => setSiteName(e.target.value)}
                  className="ax-input"
                  style={{ width: '100%', padding: '7px 10px', borderRadius: 6, fontSize: 12.5 }}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>
                  Remarks
                </label>
                <input
                  type="text"
                  placeholder="e.g. Urgent, High priority"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  className="ax-input"
                  style={{ width: '100%', padding: '7px 10px', borderRadius: 6, fontSize: 12.5 }}
                />
              </div>
            </div>

            {/* Line Items Table */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <h4 style={{ margin: 0, fontSize: 13.5, fontWeight: 700, color: 'var(--ax-text)' }}>
                  BOS Product Materials
                </h4>
                <button
                  type="button"
                  onClick={handleAddMaterial}
                  className="ax-btn ax-btn--subtle"
                  style={{ padding: '5px 12px', fontSize: 12, borderRadius: 6, color: '#2563eb' }}
                >
                  + Add Product Line
                </button>
              </div>

              {loadingProducts ? (
                <div style={{ padding: 30, textAlign: 'center', color: 'var(--ax-text-muted)' }}>
                  Loading product catalog...
                </div>
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
                            <select
                              value={m.product_id}
                              onChange={(e) => handleMaterialChange(idx, 'product_id', Number(e.target.value))}
                              style={{ width: '100%', padding: '6px 8px', borderRadius: 6, border: '1px solid var(--ax-border, #cbd5e1)' }}
                              required
                            >
                              {(bosData?.products || []).map((p) => (
                                <option key={p.id} value={p.id}>
                                  {p.name}
                                </option>
                              ))}
                              {(!bosData?.products || bosData.products.length === 0) && (
                                <option value={m.product_id}>Product #{m.product_id}</option>
                              )}
                            </select>
                          </td>
                          <td style={{ padding: 8 }}>
                            <input
                              type="number"
                              min="0"
                              step="any"
                              value={m.qty}
                              onChange={(e) => handleMaterialChange(idx, 'qty', e.target.value)}
                              style={{ width: '100%', padding: '6px 8px', borderRadius: 6, border: '1px solid var(--ax-border, #cbd5e1)' }}
                              required
                            />
                          </td>
                          <td style={{ padding: 8 }}>
                            <select
                              value={m.unit}
                              onChange={(e) => handleMaterialChange(idx, 'unit', e.target.value)}
                              style={{ width: '100%', padding: '6px 8px', borderRadius: 6, border: '1px solid var(--ax-border, #cbd5e1)' }}
                            >
                              <option value="Nos">Nos</option>
                              <option value="Set">Set</option>
                              <option value="Mtr">Mtr</option>
                              <option value="Kg">Kg</option>
                              <option value="Ltr">Ltr</option>
                            </select>
                          </td>
                          <td style={{ padding: 8 }}>
                            <input
                              type="text"
                              placeholder="e.g. Bifacial, Grade A"
                              value={m.product_remarks}
                              onChange={(e) => handleMaterialChange(idx, 'product_remarks', e.target.value)}
                              style={{ width: '100%', padding: '6px 8px', borderRadius: 6, border: '1px solid var(--ax-border, #cbd5e1)' }}
                            />
                          </td>
                          <td style={{ padding: 8, textAlign: 'center' }}>
                            <button
                              type="button"
                              onClick={() => handleRemoveMaterial(idx)}
                              disabled={materials.length <= 1}
                              style={{
                                background: 'transparent',
                                border: 'none',
                                color: materials.length <= 1 ? '#cbd5e1' : '#dc2626',
                                cursor: materials.length <= 1 ? 'not-allowed' : 'pointer',
                                fontSize: 16,
                              }}
                              title="Delete row"
                            >
                              🗑️
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          <div
            style={{
              padding: '12px 20px',
              borderTop: '1px solid var(--ax-border, #e2e8f0)',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: 10,
              background: 'var(--ax-surface-subtle, #f8fafc)',
            }}
          >
            <button
              type="button"
              onClick={onClose}
              className="ax-btn ax-btn--subtle"
              disabled={submitting}
              style={{ padding: '8px 16px', borderRadius: 8 }}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="ax-btn ax-btn--primary"
              disabled={submitting}
              style={{
                padding: '8px 24px',
                borderRadius: 8,
                background: '#16a34a',
                color: '#ffffff',
                fontWeight: 600,
              }}
            >
              {submitting ? 'Saving BOS...' : 'Save BOS Products'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}

/* ── Modal 3: View Full Survey Details ── */
function DetailModal({
  open,
  item,
  onClose,
}: {
  open: boolean;
  item: UpRescoSurveyRecord | null;
  onClose: () => void;
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

  if (!open || !item) return null;

  return createPortal(
    <div
      className="ax-modal-backdrop"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(3px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        overflowY: 'auto',
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="view-detail-title"
        className="ax-card"
        style={{
          width: '100%',
          maxWidth: 780,
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 25px -5px rgba(0,0,0,0.25)',
          borderRadius: 16,
          background: 'var(--ax-surface-solid, #ffffff)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--ax-border, #e2e8f0)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--ax-surface-subtle, #f8fafc)',
          }}
        >
          <div>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--ax-accent, #2563eb)', textTransform: 'uppercase' }}>
              Resco Feasibility Survey Record
            </span>
            <h3 id="view-detail-title" style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--ax-text, #0f172a)' }}>
              {item.site_name} {item.uid ? `(${item.uid})` : ''}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="ax-btn ax-btn--subtle"
            style={{ padding: '6px 12px', fontSize: 12, borderRadius: 6 }}
          >
            ✕
          </button>
        </div>

        <div style={{ padding: 20, overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>
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

          {/* Electrical & Roof Specifications */}
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
                    <img
                      src={getUpSurveyMediaUrl(item.image1 || item.building_image)}
                      alt="Building"
                      style={{ width: '100%', height: 100, objectFit: 'cover', border: '1px solid var(--ax-border)' }}
                    />
                  </a>
                  <span style={{ fontSize: 11, color: 'var(--ax-text-muted)', display: 'block', marginTop: 4 }}>Building</span>
                </div>
              )}
              {(item.image2 || item.roof_image) && (
                <div style={{ textAlign: 'center' }}>
                  <a href={getUpSurveyMediaUrl(item.image2 || item.roof_image)} target="_blank" rel="noreferrer">
                    <img
                      src={getUpSurveyMediaUrl(item.image2 || item.roof_image)}
                      alt="Roof"
                      style={{ width: '100%', height: 100, objectFit: 'cover', border: '1px solid var(--ax-border)' }}
                    />
                  </a>
                  <span style={{ fontSize: 11, color: 'var(--ax-text-muted)', display: 'block', marginTop: 4 }}>Roof</span>
                </div>
              )}
              {(item.image3 || item.control_room_image) && (
                <div style={{ textAlign: 'center' }}>
                  <a href={getUpSurveyMediaUrl(item.image3 || item.control_room_image)} target="_blank" rel="noreferrer">
                    <img
                      src={getUpSurveyMediaUrl(item.image3 || item.control_room_image)}
                      alt="Control Room"
                      style={{ width: '100%', height: 100, objectFit: 'cover', border: '1px solid var(--ax-border)' }}
                    />
                  </a>
                  <span style={{ fontSize: 11, color: 'var(--ax-text-muted)', display: 'block', marginTop: 4 }}>Control Room</span>
                </div>
              )}
              {item.image4 && (
                <div style={{ textAlign: 'center' }}>
                  <a href={getUpSurveyMediaUrl(item.image4)} target="_blank" rel="noreferrer">
                    <img
                      src={getUpSurveyMediaUrl(item.image4)}
                      alt="Meter"
                      style={{ width: '100%', height: 100, objectFit: 'cover', border: '1px solid var(--ax-border)' }}
                    />
                  </a>
                  <span style={{ fontSize: 11, color: 'var(--ax-text-muted)', display: 'block', marginTop: 4 }}>Meter</span>
                </div>
              )}
              {item.image5 && (
                <div style={{ textAlign: 'center' }}>
                  <a href={getUpSurveyMediaUrl(item.image5)} target="_blank" rel="noreferrer">
                    <img
                      src={getUpSurveyMediaUrl(item.image5)}
                      alt="Other"
                      style={{ width: '100%', height: 100, objectFit: 'cover', border: '1px solid var(--ax-border)' }}
                    />
                  </a>
                  <span style={{ fontSize: 11, color: 'var(--ax-text-muted)', display: 'block', marginTop: 4 }}>Other</span>
                </div>
              )}
              {(item.pdf_file || item.pdf) && (
                <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <a
                    href={getUpSurveyMediaUrl(item.pdf_file || item.pdf)}
                    target="_blank"
                    rel="noreferrer"
                    className="ax-btn ax-btn--subtle"
                    style={{ padding: '8px 12px', fontSize: 12 }}
                  >
                    📄 View PDF File
                  </a>
                  <span style={{ fontSize: 11, color: 'var(--ax-text-muted)', display: 'block', marginTop: 4 }}>Survey PDF</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div
          style={{
            padding: '12px 20px',
            borderTop: '1px solid var(--ax-border, #e2e8f0)',
            display: 'flex',
            justifyContent: 'flex-end',
            background: 'var(--ax-surface-subtle, #f8fafc)',
          }}
        >
          <button
            type="button"
            onClick={onClose}
            className="ax-btn ax-btn--primary"
            style={{ padding: '7px 18px', borderRadius: 8, fontSize: 13 }}
          >
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

/* ── Main ViewResco Component ── */
export function UP_Survey_Resco_ViewResco() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState<UpRescoSurveyRecord[]>([]);
  const [counts, setCounts] = useState<UpRescoSurveyCounts>({ total: 0, complete: 0, pending: 0 });
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Modals state
  const [bosFileItem, setBosFileItem] = useState<UpRescoSurveyRecord | null>(null);
  const [bosProdItem, setBosProdItem] = useState<UpRescoSurveyRecord | null>(null);
  const [detailItem, setDetailItem] = useState<UpRescoSurveyRecord | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

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
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Search filter across columns
  const filteredList = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return records;
    return records.filter((r) => {
      return (
        String(r.uid || `RESCO-${r.id}`).toLowerCase().includes(q) ||
        String(r.site_name || '').toLowerCase().includes(q) ||
        String(r.district || '').toLowerCase().includes(q) ||
        String(r.division || '').toLowerCase().includes(q) ||
        String(r.dept_name || '').toLowerCase().includes(q) ||
        String(r.ca_no || '').toLowerCase().includes(q) ||
        String(r.survey_address || r.site_address || '').toLowerCase().includes(q) ||
        String(r.agency_person_name || '').toLowerCase().includes(q) ||
        String(r.nodal_person || '').toLowerCase().includes(q) ||
        String(r.meter_number || '').toLowerCase().includes(q)
      );
    });
  }, [records, search]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredList.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pageData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredList.slice(start, start + pageSize);
  }, [filteredList, currentPage, pageSize]);

  // Export Columns definition
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
      { header: 'Free Space for Solar Installation (in Sq.Feet)', accessor: (r) => r.free_space_solar || DASH },
      { header: 'Free Space for Control Room/Inverter (in Sq.Feet)', accessor: (r) => r.free_space_inverter || DASH },
      { header: 'Earth Pit Position', accessor: (r) => r.earth_pit || DASH },
      { header: 'Age of Building', accessor: (r) => r.building_age || r.age_of_building || DASH },
      { header: 'Access to the Roof', accessor: (r) => r.roof_access || DASH },
      { header: 'Rooftop Height (Feet)', accessor: (r) => r.rooftop_height || DASH },
      { header: 'Parapet Height (Feet)', accessor: (r) => r.parapet_height || DASH },
      { header: 'No. of Floors', accessor: (r) => r.floors_number || DASH },
      { header: 'Water Source for Cleaning', accessor: (r) => r.water_source || DASH },
      { header: 'Access to Site', accessor: (r) => r.site_access || DASH },
      { header: 'Distance of Site from Main Road (km)', accessor: (r) => r.site_distance || DASH },
      { header: 'BOS Status', accessor: (r) => (Number(r.bos_status) === 1 ? 'Submitted' : 'Pending') },
      { header: 'BOS Remarks', accessor: (r) => r.bos_remarks || DASH },
    ],
    []
  );

  return (
    <div className="ax-page solar-erp-page">
      <style>{PAGE_CSS}</style>

      {/* Header */}
      <PageHead
        title="Welcome to, UP Resco Survey"
        subtitle="View completed Resco rooftop solar surveys, submit BOS files and generate BOS products"
        breadcrumbs={[
          { label: 'Home', href: '/v' },
          { label: 'UP Resco Survey' },
        ]}
      />

      {/* Toast Notification */}
      {toastMsg && (
        <div
          style={{
            padding: '12px 18px',
            borderRadius: 8,
            marginBottom: 20,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: '#ecfdf5',
            border: '1px solid #a7f3d0',
            color: '#065f46',
            fontSize: 13.5,
            fontWeight: 500,
          }}
        >
          <span>{toastMsg}</span>
          <button
            type="button"
            onClick={() => setToastMsg(null)}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'inherit' }}
          >
            ✕
          </button>
        </div>
      )}

      {/* 3 KPI Cards: Total, Survey Complete, Survey Pending (Strictly numbers only, NO 'Nos.') */}
      <div className="ax-dash-grid" style={{ marginBottom: 24, gap: 16 }}>
        {loading ? (
          <>
            <KpiSkeleton />
            <KpiSkeleton />
            <KpiSkeleton />
          </>
        ) : (
          <>
            <KpiCard
              icon={
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              }
              tone="accent"
              label="Total"
              value={counts.total}
              sub="Total Assign"
            />
            <KpiCard
              icon={
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              }
              tone="emerald"
              label="Survey Complete"
              value={counts.complete}
              sub="Complete"
            />
            <KpiCard
              icon={
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
              tone="amber"
              label="Survey Pending"
              value={counts.pending}
              sub="Pending"
            />
          </>
        )}
      </div>

      {/* Main Table Card */}
      <div className="ax-card">
        <div
          className="ax-card__header"
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 12,
            padding: '16px 20px',
            borderBottom: '1px solid var(--ax-border, #e2e8f0)',
          }}
        >
          <div>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--ax-text, #0f172a)' }}>
              View Resco Survey Information
            </h3>
            <span style={{ fontSize: 12, color: 'var(--ax-text-muted)' }}>
              Completed rooftop solar feasibility survey records
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <div style={{ width: 280 }}>
              <SearchInput
                placeholder="Search..."
                value={search}
                onChange={(v) => {
                  setSearch(v);
                  setPage(1);
                }}
              />
            </div>
            <TableExportToolbar
              onCopy={() => copyTableDataToClipboard('Resco_Surveys', filteredList, exportCols)}
              onExportCSV={() => exportDataToCSV('Resco_Surveys', filteredList, exportCols)}
              onExportExcel={() => exportDataToExcel('Resco_Surveys', filteredList, exportCols)}
              onPrint={() => printTableData('Vendor UP Resco Survey Records', filteredList, exportCols)}
            />
          </div>
        </div>

        {/* Table Body */}
        <div className="ax-card__body" style={{ padding: 0 }}>
          <div className="ax-table-wrapper" style={{ overflowX: 'auto', maxHeight: '68vh' }}>
            <table className="ax-table" style={{ width: '100%', borderCollapse: 'collapse', whiteSpace: 'nowrap' }}>
              <thead>
                <tr>
                  <th style={{ width: 50, textAlign: 'center' }}>Sr. No.</th>
                  <th>Unique ID</th>
                  <th>State</th>
                  <th>District</th>
                  <th>Division</th>
                  <th>Sub Division</th>
                  <th>Department</th>
                  <th>Site Name</th>
                  <th>Site Address</th>
                  <th>CA No.</th>
                  <th>Survey Address</th>
                  <th>Nearest Landmark</th>
                  <th>Agency Contact Person Name</th>
                  <th>Agency Contact Number</th>
                  <th>Nodal Person</th>
                  <th>Nodal Person Contact</th>
                  <th>Latitude</th>
                  <th>Longitude</th>
                  <th>Load Type</th>
                  <th>Connection Phase</th>
                  <th>Meter Connection Type</th>
                  <th>Meter Number</th>
                  <th>Meter Type</th>
                  <th>Sanction Load (KW/KVA)</th>
                  <th>Connected Load (KW)</th>
                  <th>Grid Power Availability</th>
                  <th>Three-Phase Availability</th>
                  <th>Missing Phase</th>
                  <th>LTDB Present</th>
                  <th>Roof Condition</th>
                  <th>Total Roof Area (Sq.Feet)</th>
                  <th>Free Space for Solar Installation (in Sq.Feet)</th>
                  <th>Free Space for Control Room/Inverter (in Sq.Feet)</th>
                  <th>Earth Pit Position</th>
                  <th>Age of Building</th>
                  <th>Access to the Roof</th>
                  <th>Rooftop Height (Feet)</th>
                  <th>Parapet Height (Feet)</th>
                  <th>No. of Floors (G+...)</th>
                  <th>Water Source for Cleaning</th>
                  <th>Access to Site</th>
                  <th>Distance of Site from Main Road (km)</th>
                  <th>Building Image</th>
                  <th>Roof Image</th>
                  <th>Control Room</th>
                  <th>Meter</th>
                  <th>Other Image</th>
                  <th>PDF</th>
                  <th>BOS Status</th>
                  <th>BOS File</th>
                  <th>BOS Remarks</th>
                  <th style={{ textAlign: 'center', position: 'sticky', right: 0, background: 'var(--ax-surface-subtle, #f8fafc)', zIndex: 2 }}>
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={52} style={{ textAlign: 'center', padding: 40, color: 'var(--ax-text-muted)' }}>
                      Loading Resco survey records...
                    </td>
                  </tr>
                ) : pageData.length === 0 ? (
                  <tr>
                    <td colSpan={52} style={{ padding: 40, textAlign: 'center' }}>
                      <TableEmptyState
                        title="No data available in table"
                        message={
                          search
                            ? 'No survey records match your search query.'
                            : 'There are currently no completed Resco surveys.'
                        }
                      />
                    </td>
                  </tr>
                ) : (
                  pageData.map((row, idx) => {
                    const srNo = (currentPage - 1) * pageSize + idx + 1;
                    const bImage = row.image1 || row.building_image;
                    const rImage = row.image2 || row.roof_image;
                    const cImage = row.image3 || row.control_room_image;
                    const mImage = row.image4;
                    const oImage = row.image5;
                    const pdfDoc = row.pdf_file || row.pdf;
                    const bosDoc = row.bos_file;
                    const isBosDone = Number(row.bos_status) === 1;

                    return (
                      <tr key={row.id || idx}>
                        <td style={{ textAlign: 'center' }}>{srNo}</td>
                        <td style={{ fontWeight: 600 }}>{row.uid || `RESCO-${row.id}`}</td>
                        <td>{(row.state || 'UP').toUpperCase()}</td>
                        <td>{row.district || DASH}</td>
                        <td>{row.division || DASH}</td>
                        <td>{row.sub_division || DASH}</td>
                        <td>{row.dept_name || DASH}</td>
                        <td style={{ fontWeight: 600, color: 'var(--ax-accent, #2563eb)' }}>{row.site_name || DASH}</td>
                        <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>{row.site_address || DASH}</td>
                        <td>{row.ca_no || DASH}</td>
                        <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>{row.survey_address || DASH}</td>
                        <td>{row.near_landmark || DASH}</td>
                        <td>{row.agency_person_name || DASH}</td>
                        <td>{row.agency_person_contact || DASH}</td>
                        <td>{row.nodal_person || DASH}</td>
                        <td>{row.contact_nodal || DASH}</td>
                        <td>{row.latitude || DASH}</td>
                        <td>{row.longitude || DASH}</td>
                        <td>{row.load_type || DASH}</td>
                        <td>{row.connection_phase || DASH}</td>
                        <td>{row.meter_connection || DASH}</td>
                        <td>{row.meter_number || DASH}</td>
                        <td>{row.meter_type || DASH}</td>
                        <td>{row.sanction_load || DASH}</td>
                        <td>{row.connected_load || DASH}</td>
                        <td>{row.grid_power || DASH}</td>
                        <td>{row.all_3_phase_ltdb || DASH}</td>
                        <td>{row.missing_phase || DASH}</td>
                        <td>{row.ltdb_present || DASH}</td>
                        <td>{row.roof_condition || DASH}</td>
                        <td>{row.area_roof || DASH}</td>
                        <td>{row.free_space_solar || DASH}</td>
                        <td>{row.free_space_inverter || DASH}</td>
                        <td>{row.earth_pit || DASH}</td>
                        <td>{row.building_age || row.age_of_building || DASH}</td>
                        <td>{row.roof_access || DASH}</td>
                        <td>{row.rooftop_height || DASH}</td>
                        <td>{row.parapet_height || DASH}</td>
                        <td>{row.floors_number || DASH}</td>
                        <td>{row.water_source || DASH}</td>
                        <td>{row.site_access || DASH}</td>
                        <td>{row.site_distance || DASH}</td>

                        {/* Image Links */}
                        <td>
                          {bImage ? (
                            <a href={getUpSurveyMediaUrl(bImage)} target="_blank" rel="noreferrer" style={{ color: '#2563eb', fontSize: 12 }}>
                              View
                            </a>
                          ) : DASH}
                        </td>
                        <td>
                          {rImage ? (
                            <a href={getUpSurveyMediaUrl(rImage)} target="_blank" rel="noreferrer" style={{ color: '#2563eb', fontSize: 12 }}>
                              View
                            </a>
                          ) : DASH}
                        </td>
                        <td>
                          {cImage ? (
                            <a href={getUpSurveyMediaUrl(cImage)} target="_blank" rel="noreferrer" style={{ color: '#2563eb', fontSize: 12 }}>
                              View
                            </a>
                          ) : DASH}
                        </td>
                        <td>
                          {mImage ? (
                            <a href={getUpSurveyMediaUrl(mImage)} target="_blank" rel="noreferrer" style={{ color: '#2563eb', fontSize: 12 }}>
                              View
                            </a>
                          ) : DASH}
                        </td>
                        <td>
                          {oImage ? (
                            <a href={getUpSurveyMediaUrl(oImage)} target="_blank" rel="noreferrer" style={{ color: '#2563eb', fontSize: 12 }}>
                              View
                            </a>
                          ) : DASH}
                        </td>
                        <td>
                          {pdfDoc ? (
                            <a href={getUpSurveyMediaUrl(pdfDoc)} target="_blank" rel="noreferrer" style={{ color: '#2563eb', fontSize: 12 }}>
                              PDF
                            </a>
                          ) : DASH}
                        </td>

                        {/* BOS Info */}
                        <td>
                          <span className={`bos-badge ${isBosDone ? 'bos-badge--submitted' : 'bos-badge--pending'}`}>
                            {isBosDone ? 'Submitted' : 'Pending'}
                          </span>
                        </td>
                        <td>
                          {bosDoc ? (
                            <a href={getUpSurveyMediaUrl(bosDoc)} target="_blank" rel="noreferrer" style={{ color: '#2563eb', fontSize: 12 }}>
                              BOS File
                            </a>
                          ) : DASH}
                        </td>
                        <td style={{ maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {row.bos_remarks || DASH}
                        </td>

                        {/* Sticky Action Column */}
                        <td
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
                            {/* View Detail */}
                            <button
                              type="button"
                              onClick={() => setDetailItem(row)}
                              className="ax-btn ax-btn--subtle"
                              style={{ padding: '4px 8px', fontSize: 11.5, borderRadius: 6 }}
                              title="View Details"
                            >
                              View
                            </button>

                            {/* Edit Survey */}
                            <button
                              type="button"
                              onClick={() => navigate(`/v/up/resco-survey?edit_id=${row.id}`)}
                              className="ax-btn ax-btn--subtle"
                              style={{ padding: '4px 8px', fontSize: 11.5, borderRadius: 6, color: '#d97706' }}
                              title="Edit Survey"
                            >
                              Edit
                            </button>

                            {/* Submit BOS File */}
                            <button
                              type="button"
                              onClick={() => setBosFileItem(row)}
                              className="ax-btn ax-btn--subtle"
                              style={{ padding: '4px 8px', fontSize: 11.5, borderRadius: 6, color: '#2563eb' }}
                              title="Submit BOS File"
                            >
                              BOS File
                            </button>

                            {/* Fill BOS Products */}
                            <button
                              type="button"
                              onClick={() => setBosProdItem(row)}
                              className="ax-btn ax-btn--subtle"
                              style={{ padding: '4px 8px', fontSize: 11.5, borderRadius: 6, color: '#16a34a' }}
                              title="Fill BOS Products"
                            >
                              BOS Products
                            </button>

                            {/* Download BOS PDF */}
                            {isBosDone && (
                              <button
                                type="button"
                                onClick={() => upSurveyService.downloadRescoBosPdf(row.id, row.site_name || 'Site')}
                                className="ax-btn ax-btn--primary"
                                style={{
                                  padding: '4px 8px',
                                  fontSize: 11.5,
                                  borderRadius: 6,
                                  background: '#dc2626',
                                  borderColor: '#dc2626',
                                  color: '#ffffff',
                                }}
                                title="Download BOS PDF"
                              >
                                PDF
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Table Footer with Pagination */}
        <div className="ax-card__footer" style={{ padding: '12px 20px', borderTop: '1px solid var(--ax-border, #e2e8f0)' }}>
          <div className="ula-pagination-left">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filteredList.length}
              pageSize={pageSize}
              onPageChange={(p) => setPage(p)}
              onPageSizeChange={(sz) => {
                setPageSize(sz);
                setPage(1);
              }}
            />
          </div>
        </div>
      </div>

      {/* Modals */}
      <DetailModal
        open={Boolean(detailItem)}
        item={detailItem}
        onClose={() => setDetailItem(null)}
      />

      <SubmitBosFileModal
        open={Boolean(bosFileItem)}
        item={bosFileItem}
        onClose={() => setBosFileItem(null)}
        onSuccess={(msg) => {
          setToastMsg(msg);
          loadData();
        }}
      />

      <ManageBosProductsModal
        open={Boolean(bosProdItem)}
        item={bosProdItem}
        onClose={() => setBosProdItem(null)}
        onSuccess={(msg) => {
          setToastMsg(msg);
          loadData();
        }}
      />
    </div>
  );
}

export const UPSurveyRescoViewResco = UP_Survey_Resco_ViewResco;
export default UP_Survey_Resco_ViewResco;
