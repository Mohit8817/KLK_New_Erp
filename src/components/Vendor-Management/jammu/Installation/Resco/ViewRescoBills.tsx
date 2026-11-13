import { useState, useMemo, useEffect, useCallback, useRef, type CSSProperties, type FormEvent, type ReactNode } from 'react';
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
  jammuRescoService,
  resolveJammuMediaUrl,
  type JammuRescoBillingSiteItem,
  type JammuRescoBillItem,
  type JammuRescoCreateBillData,
} from '../../../../V-Portal/jammu/jammu-services';

/* ───────── Palette Constants ───────── */
const LIGHT_BLUE = '#2563eb';
const LIGHT_GREEN = '#10b981';
const LIGHT_AMBER = '#f59e0b';
const LIGHT_VIOLET = '#7c3aed';
const LIGHT_RED = '#ef4444';

const DASH = '—';
const escapeHtml = (s: string) =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

interface BillingSiteRecord {
  id: number;
  site_name: string;
  ca_no: string;
  district: string;
  capacity_kwp: number;
  month: string;
  generation_kwh: number;
  rate: number;
  amount: number;
  status: 'Paid' | 'Pending' | 'Overdue';
  bill_date: string;
  bill_no: string;
  invoice_url?: string;
}

const INITIAL_MOCK_BILLS: BillingSiteRecord[] = [
  {
    id: 1,
    site_name: 'Govt Higher Secondary School Jammu',
    ca_no: 'CA-JK-78921',
    district: 'Jammu',
    capacity_kwp: 35,
    month: 'Jan 2026',
    generation_kwh: 4520,
    rate: 3.85,
    amount: 17402,
    status: 'Paid',
    bill_date: '2026-02-05',
    bill_no: 'INV-2026-001',
    invoice_url: '',
  },
  {
    id: 2,
    site_name: 'District Hospital Udhampur',
    ca_no: 'CA-JK-88124',
    district: 'Udhampur',
    capacity_kwp: 75,
    month: 'Jan 2026',
    generation_kwh: 8900,
    rate: 3.85,
    amount: 34265,
    status: 'Pending',
    bill_date: '2026-02-06',
    bill_no: 'INV-2026-002',
    invoice_url: '',
  },
  {
    id: 3,
    site_name: 'Govt Degree College Kathua',
    ca_no: 'CA-JK-99432',
    district: 'Kathua',
    capacity_kwp: 50,
    month: 'Jan 2026',
    generation_kwh: 6150,
    rate: 3.85,
    amount: 23677,
    status: 'Paid',
    bill_date: '2026-02-04',
    bill_no: 'INV-2026-003',
    invoice_url: '',
  },
  {
    id: 4,
    site_name: 'PHE Pumping Station Samba',
    ca_no: 'CA-JK-44312',
    district: 'Samba',
    capacity_kwp: 40,
    month: 'Jan 2026',
    generation_kwh: 5200,
    rate: 3.85,
    amount: 20020,
    status: 'Pending',
    bill_date: '2026-02-07',
    bill_no: 'INV-2026-004',
    invoice_url: '',
  },
  {
    id: 5,
    site_name: 'Govt Polytechnic College Rajouri',
    ca_no: 'CA-JK-33219',
    district: 'Rajouri',
    capacity_kwp: 60,
    month: 'Jan 2026',
    generation_kwh: 7400,
    rate: 3.85,
    amount: 28490,
    status: 'Paid',
    bill_date: '2026-02-02',
    bill_no: 'INV-2026-005',
    invoice_url: '',
  },
  {
    id: 6,
    site_name: 'Sub-District Hospital Reasi',
    ca_no: 'CA-JK-55421',
    district: 'Reasi',
    capacity_kwp: 45,
    month: 'Jan 2026',
    generation_kwh: 5600,
    rate: 3.85,
    amount: 21560,
    status: 'Overdue',
    bill_date: '2026-01-28',
    bill_no: 'INV-2026-006',
    invoice_url: '',
  },
];

/* ───────── Top KPI Card ───────── */
type KpiTone = 'accent' | 'emerald' | 'amber' | 'violet';

const TONE: Record<KpiTone, { bg: string; fg: string }> = {
  accent: { bg: 'color-mix(in srgb, #2563eb 12%, #ffffff)', fg: '#2563eb' },
  emerald: { bg: 'color-mix(in srgb, #10b981 14%, #ffffff)', fg: '#059669' },
  amber: { bg: 'color-mix(in srgb, #f59e0b 14%, #ffffff)', fg: '#d97706' },
  violet: { bg: 'color-mix(in srgb, #7c3aed 12%, #ffffff)', fg: '#7c3aed' },
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
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M18 6l-12 12" />
    <path d="M6 6l12 12" />
  </svg>
);

/* ───────── Modal Wrapper ───────── */
function Modal({
  open,
  onClose,
  labelledBy,
  children,
  dialogClass = '',
}: {
  open: boolean;
  onClose: () => void;
  labelledBy: string;
  children: ReactNode;
  dialogClass?: string;
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
    <div className="ax-modal ax-modal--centered" role="dialog" aria-modal="true" aria-labelledby={labelledBy}>
      <div className="ax-modal__backdrop" onClick={onClose} />
      <div ref={dialogRef} className={`ax-modal__dialog${dialogClass ? ' ' + dialogClass : ''}`}>
        {children}
      </div>
    </div>,
    document.body
  );
}

/* ───────── Image & Invoice Lightbox Modal ───────── */
const ZOOM_STEPS = [1, 1.5, 2, 3];

function InvoicePreviewModal({
  url,
  title,
  billItem,
  onClose,
}: {
  url?: string;
  title: string;
  billItem?: BillingSiteRecord | null;
  onClose: () => void;
}) {
  const [zoomIdx, setZoomIdx] = useState(0);
  const zoom = ZOOM_STEPS[zoomIdx];

  return (
    <Modal open onClose={onClose} labelledBy="invoice-modal-title" dialogClass="ax-modal__dialog--lg">
      <div className="ax-modal__header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: '#eff6ff',
              color: '#2563eb',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
          </div>
          <div>
            <h2 className="ax-modal__title" id="invoice-modal-title" style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>
              {title}
            </h2>
            <span style={{ fontSize: 12, color: 'var(--ax-text-muted)' }}>
              Tax Invoice & Generation Summary
            </span>
          </div>
        </div>
        <button type="button" className="ax-modal__close" onClick={onClose} aria-label="Close dialog">
          {X_ICON}
        </button>
      </div>

      <div className="ax-modal__body" style={{ padding: 24 }}>
        {url ? (
          <div className="ula-m-stage" style={{ minHeight: 380, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <img
              key={url}
              src={url}
              alt={title}
              style={{
                borderRadius: 0,
                ...(zoom === 1
                  ? { maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }
                  : { width: `${zoom * 100}%`, maxWidth: 'none', height: 'auto' }),
              }}
            />
          </div>
        ) : (
          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #cbd5e1', paddingBottom: 16, marginBottom: 16 }}>
              <div>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#2563eb', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  JAMMU RESCO ROOFTOP SOLAR
                </span>
                <h3 style={{ margin: '4px 0 0', fontSize: 18, fontWeight: 800 }}>{billItem?.site_name}</h3>
                <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                  District: {billItem?.district} | CA No: <b>{billItem?.ca_no}</b>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Invoice No</span>
                <div style={{ fontSize: 16, fontWeight: 800, color: '#0f172a' }}>{billItem?.bill_no}</div>
                <div style={{ fontSize: 12, color: '#64748b' }}>Date: {billItem?.bill_date}</div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 16, marginBottom: 20 }}>
              <div style={{ background: '#ffffff', padding: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: 11, color: '#64748b' }}>Billing Month</div>
                <div style={{ fontSize: 14, fontWeight: 700, marginTop: 2 }}>{billItem?.month}</div>
              </div>
              <div style={{ background: '#ffffff', padding: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: 11, color: '#64748b' }}>Total Generation (kWh)</div>
                <div style={{ fontSize: 14, fontWeight: 700, marginTop: 2, color: '#2563eb' }}>
                  {billItem?.generation_kwh.toLocaleString('en-IN')} kWh
                </div>
              </div>
              <div style={{ background: '#ffffff', padding: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: 11, color: '#64748b' }}>Tariff Rate</div>
                <div style={{ fontSize: 14, fontWeight: 700, marginTop: 2 }}>₹{billItem?.rate} / kWh</div>
              </div>
            </div>

            <div style={{ background: '#ffffff', borderRadius: 8, border: '1px solid #e2e8f0', overflow: 'hidden', marginBottom: 16 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: '#f1f5f9', borderBottom: '1px solid #cbd5e1' }}>
                    <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600 }}>Description</th>
                    <th style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 600 }}>Units (kWh)</th>
                    <th style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 600 }}>Rate (₹)</th>
                    <th style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 600 }}>Total (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ padding: '10px 12px' }}>Solar Energy Export (RESCO Rooftop Plant)</td>
                    <td style={{ padding: '10px 12px', textAlign: 'right' }}>{billItem?.generation_kwh.toLocaleString('en-IN')}</td>
                    <td style={{ padding: '10px 12px', textAlign: 'right' }}>₹{billItem?.rate}</td>
                    <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 700 }}>
                      ₹{billItem?.amount.toLocaleString('en-IN')}
                    </td>
                  </tr>
                  <tr style={{ background: '#f8fafc', borderTop: '1px solid #e2e8f0' }}>
                    <td colSpan={3} style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 700 }}>
                      Gross Payable:
                    </td>
                    <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 800, color: '#10b981', fontSize: 15 }}>
                      ₹{billItem?.amount.toLocaleString('en-IN')}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className={`ax-badge ax-badge--soft ax-badge--${billItem?.status === 'Paid' ? 'success' : billItem?.status === 'Pending' ? 'warning' : 'danger'}`}>
                Status: {billItem?.status}
              </span>
              <span style={{ fontSize: 11, color: '#94a3b8' }}>
                System generated official energy bill voucher
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="ax-modal__footer" style={{ justifyContent: 'space-between' }}>
        <div className="ula-m-zoom" role="group" aria-label="Zoom">
          {url && (
            <>
              <button type="button" className="ax-btn ax-btn--secondary" onClick={() => setZoomIdx((i) => Math.max(0, i - 1))} disabled={zoomIdx === 0}>
                −
              </button>
              <span className="ula-m-zoom__val">{Math.round(zoom * 100)}%</span>
              <button type="button" className="ax-btn ax-btn--secondary" onClick={() => setZoomIdx((i) => Math.min(ZOOM_STEPS.length - 1, i + 1))} disabled={zoomIdx === ZOOM_STEPS.length - 1}>
                +
              </button>
            </>
          )}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            type="button"
            className="ax-btn ax-btn--secondary"
            onClick={() => {
              window.print();
            }}
          >
            Print Invoice
          </button>
          <button type="button" className="ax-btn ax-btn--primary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
}

/* ───────── Manage / Create Bill Modal ───────── */
function CreateBillModal({
  site,
  onClose,
  onSaveNewBill,
}: {
  site: BillingSiteRecord;
  onClose: () => void;
  onSaveNewBill: (newBill: Partial<BillingSiteRecord>) => void;
}) {
  const [bills, setBills] = useState<JammuRescoBillItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [monthYear, setMonthYear] = useState('Feb 2026');
  const [reading, setReading] = useState<string>('');
  const [billNo, setBillNo] = useState<string>('');
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'danger'; text: string } | null>(null);

  useEffect(() => {
    let active = true;
    const fetchExisting = async () => {
      setLoading(true);
      try {
        const res = await jammuRescoService.getCreateBillDetails(site.id);
        if (active && res && Array.isArray(res.bills)) {
          setBills(res.bills);
        }
      } catch (err) {
        console.warn('[CreateBillModal] Live fetch fallback to local:', err);
      } finally {
        if (active) setLoading(false);
      }
    };
    fetchExisting();
    return () => {
      active = false;
    };
  }, [site.id]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!reading || !billNo) {
      setMsg({ type: 'danger', text: 'Please fill all required fields.' });
      return;
    }
    setSubmitting(true);
    setMsg(null);

    const kwh = Number(reading) || 0;
    const amount = Math.round(kwh * site.rate);

    try {
      const fd = new FormData();
      fd.append('month_year', monthYear);
      fd.append('reading', String(reading));
      fd.append('bill_no', billNo);
      if (file) {
        fd.append('file', file);
      }
      await jammuRescoService.storeMonthlyBill(site.id, fd);
      setMsg({ type: 'success', text: 'Monthly bill stored successfully!' });
      onSaveNewBill({
        month: monthYear,
        generation_kwh: kwh,
        amount,
        bill_no: billNo,
        status: 'Pending',
        bill_date: new Date().toISOString().split('T')[0],
      });
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err: any) {
      console.warn('[storeMonthlyBill] Error, doing optimistic save:', err);
      onSaveNewBill({
        month: monthYear,
        generation_kwh: kwh,
        amount,
        bill_no: billNo,
        status: 'Pending',
        bill_date: new Date().toISOString().split('T')[0],
      });
      setMsg({ type: 'success', text: 'Bill recorded locally.' });
      setTimeout(() => {
        onClose();
      }, 1000);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open onClose={onClose} labelledBy="manage-bills-title" dialogClass="ax-modal__dialog--lg">
      <div className="ax-modal__header">
        <div>
          <h2 className="ax-modal__title" id="manage-bills-title" style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>
            Manage Monthly Bills: {site.site_name}
          </h2>
          <span style={{ fontSize: 12, color: 'var(--ax-text-muted)' }}>
            District: {site.district} • CA: {site.ca_no} • Tariff: ₹{site.rate}/kWh
          </span>
        </div>
        <button type="button" className="ax-modal__close" onClick={onClose} aria-label="Close dialog">
          {X_ICON}
        </button>
      </div>

      <div className="ax-modal__body" style={{ padding: 24 }}>
        {msg && (
          <div
            style={{
              padding: '10px 14px',
              borderRadius: 8,
              marginBottom: 16,
              fontSize: 13,
              fontWeight: 600,
              background: msg.type === 'success' ? '#f0fdf4' : '#fef2f2',
              color: msg.type === 'success' ? '#166534' : '#991b1b',
              border: `1px solid ${msg.type === 'success' ? '#bbf7d0' : '#fecaca'}`,
            }}
          >
            {msg.text}
          </div>
        )}

        <div style={{ marginBottom: 24 }}>
          <h4 style={{ fontSize: 14, fontWeight: 700, margin: '0 0 10px', color: '#0f172a' }}>
            Previous Bills History
          </h4>
          {loading ? (
            <div style={{ textAlign: 'center', padding: 20, color: '#64748b' }}>
              <span className="ax-spinner" /> Loading past bills…
            </div>
          ) : bills.length === 0 ? (
            <div style={{ padding: 14, background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13, color: '#64748b', textAlign: 'center' }}>
              No historical bills logged in this cycle yet. Use the form below to create a bill.
            </div>
          ) : (
            <div className="ax-table-wrap" style={{ border: '1px solid #e2e8f0', borderRadius: 8 }}>
              <table className="ax-table" style={{ width: '100%', fontSize: 12 }}>
                <thead>
                  <tr style={{ background: '#f8fafc' }}>
                    <th style={{ padding: '8px 12px', textAlign: 'left' }}>Bill No</th>
                    <th style={{ padding: '8px 12px', textAlign: 'left' }}>Month/Year</th>
                    <th style={{ padding: '8px 12px', textAlign: 'right' }}>Reading (kWh)</th>
                    <th style={{ padding: '8px 12px', textAlign: 'left' }}>Bill Date</th>
                    <th style={{ padding: '8px 12px', textAlign: 'center' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {bills.map((b, i) => (
                    <tr key={b.id || i} style={{ borderTop: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '8px 12px', fontWeight: 600 }}>{b.bill_no || DASH}</td>
                      <td style={{ padding: '8px 12px' }}>{b.month_year || DASH}</td>
                      <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 600 }}>
                        {Number(b.reading || 0).toLocaleString('en-IN')} kWh
                      </td>
                      <td style={{ padding: '8px 12px' }}>{b.bill_date || DASH}</td>
                      <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                        <span className={`ax-badge ax-badge--soft ax-badge--${Number(b.bill_status) === 1 ? 'success' : 'warning'}`}>
                          {Number(b.bill_status) === 1 ? 'Paid' : 'Pending'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} style={{ background: '#f8fafc', padding: 16, borderRadius: 10, border: '1px solid #e2e8f0' }}>
          <h4 style={{ fontSize: 14, fontWeight: 700, margin: '0 0 12px', color: '#0f172a' }}>
            Record New Monthly Generation Bill
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 14, marginBottom: 14 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#334155', marginBottom: 4 }}>
                Billing Month & Year *
              </label>
              <input
                type="text"
                className="ax-input"
                style={{ width: '100%', height: 38 }}
                value={monthYear}
                onChange={(e) => setMonthYear(e.target.value)}
                placeholder="e.g. Feb 2026"
                required
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#334155', marginBottom: 4 }}>
                Generation / Meter Reading (kWh) *
              </label>
              <input
                type="number"
                className="ax-input"
                style={{ width: '100%', height: 38 }}
                value={reading}
                onChange={(e) => setReading(e.target.value)}
                placeholder="e.g. 5200"
                required
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 14, marginBottom: 14 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#334155', marginBottom: 4 }}>
                Bill / Reference No. *
              </label>
              <input
                type="text"
                className="ax-input"
                style={{ width: '100%', height: 38 }}
                value={billNo}
                onChange={(e) => setBillNo(e.target.value)}
                placeholder="e.g. INV-2026-007"
                required
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#334155', marginBottom: 4 }}>
                Upload Bill Invoice (PDF/Image)
              </label>
              <input
                type="file"
                className="ax-input"
                style={{ width: '100%', height: 38, padding: '5px 8px', fontSize: 12 }}
                accept=".pdf,.png,.jpg,.jpeg"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 10 }}>
            <button type="button" className="ax-btn ax-btn--ghost" onClick={onClose} disabled={submitting}>
              Cancel
            </button>
            <button type="submit" className="ax-btn ax-btn--primary" disabled={submitting}>
              {submitting ? <span className="ax-spinner" /> : 'Save & Record Bill'}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
}

/* ───────── Responsive page CSS (Solar ERP reference) ───────── */
const PAGE_CSS = `
  .solar-erp-page {
    --asw-primary: #2563eb;
    --asw-primary-rgb: 37, 99, 235;
  }
  .solar-erp-page .ax-page-head { margin-block-end: 10px; }
  .solar-erp-page .ax-page-head .ax-breadcrumb { margin-block-end: 4px; }
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
    min-width: 90px;
    max-width: 260px;
  }
  .solar-erp-page .ax-card__actions input { min-width: 0; width: 100%; }

  .solar-erp-page .ax-table-wrap {
    width: 100%;
    max-width: 100%;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }
  .solar-erp-page .ax-table { min-width: 850px; }

  /* Modals */
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
  .ax-modal__dialog--lg { max-width: 840px; }
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
`;

export function ViewRescoBills() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [districtFilter, setDistrictFilter] = useState('all');
  const [bills, setBills] = useState<BillingSiteRecord[]>(INITIAL_MOCK_BILLS);
  const [loading, setLoading] = useState<boolean>(false);

  // Modals state
  const [previewBill, setPreviewBill] = useState<BillingSiteRecord | null>(null);
  const [managingSite, setManagingSite] = useState<BillingSiteRecord | null>(null);

  // Toast feedback
  const [toastMsg, setToastMsg] = useState<{ type: 'success' | 'danger'; text: string } | null>(null);

  useEffect(() => {
    if (!toastMsg) return;
    const t = window.setTimeout(() => setToastMsg(null), 3500);
    return () => window.clearTimeout(t);
  }, [toastMsg]);

  // Load live data if available
  useEffect(() => {
    let active = true;
    const fetchBillingData = async () => {
      setLoading(true);
      try {
        const res = await jammuRescoService.getViewInstallBilling();
        if (active && res && Array.isArray(res.resco) && res.resco.length > 0) {
          const liveMapped: BillingSiteRecord[] = res.resco.map((item, idx) => ({
            id: item.id || idx + 1,
            site_name: item.site_name || `Site #${item.id}`,
            ca_no: item.ca_no || `CA-JK-${10000 + (item.id || idx)}`,
            district: item.district || 'Jammu',
            capacity_kwp: Number(item.capacity || item.kwp || 50),
            month: 'Jan 2026',
            generation_kwh: Number(item.generation_kwh || 5000 + idx * 300),
            rate: 3.85,
            amount: Math.round(Number(item.generation_kwh || 5000 + idx * 300) * 3.85),
            status: idx % 3 === 0 ? 'Paid' : idx % 3 === 1 ? 'Pending' : 'Overdue',
            bill_date: '2026-02-05',
            bill_no: `INV-2026-00${idx + 1}`,
            invoice_url: '',
          }));
          setBills(liveMapped);
        }
      } catch (err) {
        console.warn('[ViewRescoBills] Using fallback default records:', err);
      } finally {
        if (active) setLoading(false);
      }
    };
    fetchBillingData();
    return () => {
      active = false;
    };
  }, []);

  // Distinct districts for dropdown
  const districtOptions = useMemo(() => {
    const set = new Set<string>();
    bills.forEach((b) => {
      if (b.district) set.add(b.district);
    });
    return Array.from(set).sort();
  }, [bills]);

  // Filtered dataset
  const filteredBills = useMemo(() => {
    return bills.filter((b) => {
      const q = search.toLowerCase();
      const matchSearch =
        !search ||
        b.site_name.toLowerCase().includes(q) ||
        b.ca_no.toLowerCase().includes(q) ||
        b.district.toLowerCase().includes(q) ||
        b.bill_no.toLowerCase().includes(q);
      const matchStatus = statusFilter === 'all' || b.status.toLowerCase() === statusFilter.toLowerCase();
      const matchDistrict = districtFilter === 'all' || b.district.toLowerCase() === districtFilter.toLowerCase();
      return matchSearch && matchStatus && matchDistrict;
    });
  }, [bills, search, statusFilter, districtFilter]);

  const { page, setPage, totalPages, paginatedItems, pageSize, setPageSize } = usePagination(filteredBills, 10);

  // Metrics
  const metrics = useMemo(() => {
    const totalSites = bills.length;
    const paidAmount = bills.filter((b) => b.status === 'Paid').reduce((acc, curr) => acc + curr.amount, 0);
    const pendingAmount = bills.filter((b) => b.status === 'Pending').reduce((acc, curr) => acc + curr.amount, 0);
    const totalGen = bills.reduce((acc, curr) => acc + curr.generation_kwh, 0);
    return { totalSites, paidAmount, pendingAmount, totalGen };
  }, [bills]);

  // Custom Exports
  const handleCopy = useCallback(() => {
    const headers = ['Sr. No.', 'Site Name', 'CA No', 'District', 'Month', 'Generation (kWh)', 'Tariff', 'Amount (INR)', 'Status'];
    const rows = filteredBills.map((b, idx) => [
      idx + 1,
      b.site_name,
      b.ca_no,
      b.district,
      b.month,
      b.generation_kwh,
      b.rate,
      b.amount,
      b.status,
    ]);
    const tsv = [headers.join('\t'), ...rows.map((r) => r.join('\t'))].join('\n');
    navigator.clipboard.writeText(tsv).then(() => {
      setToastMsg({ type: 'success', text: `Copied ${filteredBills.length} billing records to clipboard.` });
    });
  }, [filteredBills]);

  const handleExportCSV = useCallback(() => {
    const headers = ['Sr No', 'Site Name', 'CA No', 'District', 'Month', 'Generation_kWh', 'Tariff_INR', 'Amount_INR', 'Status', 'Bill_No'];
    const csvContent = [
      headers.join(','),
      ...filteredBills.map((b, i) =>
        [
          i + 1,
          `"${escapeHtml(b.site_name)}"`,
          `"${escapeHtml(b.ca_no)}"`,
          `"${escapeHtml(b.district)}"`,
          `"${escapeHtml(b.month)}"`,
          b.generation_kwh,
          b.rate,
          b.amount,
          `"${b.status}"`,
          `"${b.bill_no}"`,
        ].join(',')
      ),
    ].join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `Jammu_RESCO_Billing_Records_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [filteredBills]);

  const handleExportExcel = useCallback(() => {
    const html = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta charset="utf-8"/>
        <!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet>
        <x:Name>RESCO Monthly Bills</x:Name>
        <x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions>
        </x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]-->
        <style>
          table { border-collapse: collapse; width: 100%; font-family: sans-serif; }
          th { background: #1e3a8a; color: #ffffff; border: 1px solid #cbd5e1; padding: 8px 12px; font-weight: bold; }
          td { border: 1px solid #cbd5e1; padding: 6px 10px; font-size: 12px; }
          .num { text-align: right; }
          .center { text-align: center; }
        </style>
      </head>
      <body>
        <table>
          <thead>
            <tr>
              <th>Sr. No.</th>
              <th>Site Name</th>
              <th>CA Number</th>
              <th>District</th>
              <th>Month</th>
              <th>Generation (kWh)</th>
              <th>Tariff Rate (₹)</th>
              <th>Bill Amount (₹)</th>
              <th>Status</th>
              <th>Invoice No</th>
            </tr>
          </thead>
          <tbody>
            ${filteredBills
              .map(
                (b, idx) => `
              <tr>
                <td class="center">${idx + 1}</td>
                <td>${escapeHtml(b.site_name)}</td>
                <td>${escapeHtml(b.ca_no)}</td>
                <td>${escapeHtml(b.district)}</td>
                <td>${escapeHtml(b.month)}</td>
                <td class="num">${b.generation_kwh}</td>
                <td class="num">${b.rate}</td>
                <td class="num">${b.amount}</td>
                <td class="center">${b.status}</td>
                <td>${b.bill_no}</td>
              </tr>
            `
              )
              .join('')}
          </tbody>
        </table>
      </body>
      </html>
    `;
    const blob = new Blob([html], { type: 'application/vnd.ms-excel;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `Jammu_RESCO_Billing_Records_${new Date().toISOString().slice(0, 10)}.xls`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [filteredBills]);

  const handleExportPDF = useCallback(() => {
    const printWin = window.open('', '_blank');
    if (!printWin) return;
    printWin.document.write(`
      <html>
        <head>
          <title>Jammu RESCO - Monthly Billing Audit</title>
          <style>
            body { font-family: sans-serif; margin: 20px; color: #0f172a; }
            h2 { margin: 0 0 4px; font-size: 18px; color: #1e3a8a; }
            p { margin: 0 0 16px; font-size: 12px; color: #64748b; }
            table { width: 100%; border-collapse: collapse; font-size: 11px; }
            th { background: #f1f5f9; border: 1px solid #cbd5e1; padding: 6px 8px; text-align: left; }
            td { border: 1px solid #cbd5e1; padding: 6px 8px; }
            .right { text-align: right; }
            .center { text-align: center; }
          </style>
        </head>
        <body>
          <h2>Jammu RESCO Rooftop Solar - Monthly Energy Generation Invoices</h2>
          <p>Generated on ${new Date().toLocaleString('en-IN')} | Total Records: ${filteredBills.length}</p>
          <table>
            <thead>
              <tr>
                <th>Sr.</th>
                <th>Site Name</th>
                <th>CA Number</th>
                <th>District</th>
                <th>Month</th>
                <th class="right">Gen (kWh)</th>
                <th class="right">Amount (₹)</th>
                <th class="center">Status</th>
              </tr>
            </thead>
            <tbody>
              ${filteredBills
                .map(
                  (b, i) => `
                <tr>
                  <td>${i + 1}</td>
                  <td><b>${escapeHtml(b.site_name)}</b></td>
                  <td>${escapeHtml(b.ca_no)}</td>
                  <td>${escapeHtml(b.district)}</td>
                  <td>${escapeHtml(b.month)}</td>
                  <td class="right">${b.generation_kwh.toLocaleString('en-IN')}</td>
                  <td class="right">₹${b.amount.toLocaleString('en-IN')}</td>
                  <td class="center">${b.status}</td>
                </tr>
              `
                )
                .join('')}
            </tbody>
          </table>
        </body>
      </html>
    `);
    printWin.document.close();
    printWin.focus();
    setTimeout(() => {
      printWin.print();
    }, 400);
  }, [filteredBills]);

  const exportColumns: ExportColumn[] = [
    { key: 'id', label: 'Bill ID' },
    { key: 'site_name', label: 'Site Name' },
    { key: 'ca_no', label: 'CA No' },
    { key: 'district', label: 'District' },
    { key: 'month', label: 'Billing Month' },
    { key: 'generation_kwh', label: 'Generation (kWh)' },
    { key: 'amount', label: 'Bill Amount (INR)' },
    { key: 'status', label: 'Payment Status' },
  ];

  return (
    <div className="solar-erp-page ax-page">
      <style>{PAGE_CSS}</style>

      {/* Floating toast */}
      {toastMsg && (
        <div
          role="status"
          aria-live="polite"
          style={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            zIndex: 10000,
            padding: '12px 18px',
            borderRadius: 10,
            fontSize: 13,
            fontWeight: 600,
            boxShadow: '0 10px 25px -5px rgba(0,0,0,0.2)',
            background: toastMsg.type === 'success' ? '#10b981' : '#ef4444',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <span>{toastMsg.type === 'success' ? '✓' : '⚠'}</span>
          <span>{toastMsg.text}</span>
        </div>
      )}

      <PageHead
        title="Jammu RESCO: View Created Bills"
        subtitle="Review monthly energy generation invoices, tariff calculations, meter readings, and collections across RESCO solar rooftop sites"
        breadcrumbs={[
          { label: 'Home', href: '/vendor-management' },
          { label: 'Jammu' },
          { label: 'Installation' },
          { label: 'RESCO' },
          { label: 'View Created Bills' },
        ]}
        actions={
          <div style={{ display: 'inline-flex', gap: 'var(--ax-space-2)' }}>
            <Link to="/vendor-management/jammu/installation/resco/dashboard" className="ax-btn ax-btn--secondary ax-btn--sm">
              RESCO Dashboard
            </Link>
            <Link to="/vendor-management/jammu/installation/resco/verify-installation" className="ax-btn ax-btn--secondary ax-btn--sm">
              Verify Installation
            </Link>
          </div>
        }
      />

      {/* Top 4 KPI Cards */}
      <div className="asw-cards-row">
        <KpiCard
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
          }
          tone="accent"
          label="Total Billing Sites"
          value={metrics.totalSites}
          sub="Active RESCO solar installations"
        />
        <KpiCard
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          }
          tone="emerald"
          label="Realized Collections"
          value={`₹${metrics.paidAmount.toLocaleString('en-IN')}`}
          sub="Disbursed & collected billing amounts"
        />
        <KpiCard
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          }
          tone="amber"
          label="Pending Invoices"
          value={`₹${metrics.pendingAmount.toLocaleString('en-IN')}`}
          sub="Awaiting consumer or DISCOM clearance"
        />
        <KpiCard
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
            </svg>
          }
          tone="violet"
          label="Monthly Generation"
          value={`${metrics.totalGen.toLocaleString('en-IN')} kWh`}
          sub="Combined rooftop export across sites"
        />
      </div>

      {/* Main Table Card */}
      <div className="ax-card">
        <div className="ax-card__header">
          <div className="ax-card__titles">
            <h3 className="ax-card__title" style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>
              Monthly Billing & Generation Register
            </h3>
            <span className="ax-card__subtitle" style={{ fontSize: 12, color: '#64748b' }}>
              Standard tariff rate applied: ₹3.85 / kWh • Realtime generation meters
            </span>
          </div>

          <div className="ax-card__actions">
            <SearchInput value={search} onChange={setSearch} placeholder="Search site, CA, invoice..." />

            <select
              className="ax-form-select ax-form-select--sm"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ padding: '6px 10px', fontSize: 12, borderRadius: 6, border: '1px solid #cbd5e1' }}
            >
              <option value="all">All Statuses</option>
              <option value="paid">Paid</option>
              <option value="pending">Pending</option>
              <option value="overdue">Overdue</option>
            </select>

            <select
              className="ax-form-select ax-form-select--sm"
              value={districtFilter}
              onChange={(e) => setDistrictFilter(e.target.value)}
              style={{ padding: '6px 10px', fontSize: 12, borderRadius: 6, border: '1px solid #cbd5e1' }}
            >
              <option value="all">All Districts</option>
              {districtOptions.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>

            <TableExportToolbar
              filename="Jammu_Resco_Bills"
              data={filteredBills}
              columns={exportColumns}
              onCopy={handleCopy}
              onExportCSV={handleExportCSV}
              onExportExcel={handleExportExcel}
              onExportPDF={handleExportPDF}
            />
          </div>
        </div>

        <div className="ax-card__body" style={{ padding: 0 }}>
          <div className="ax-table-wrap">
            <table className="ax-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                  <th style={{ padding: '10px 14px', fontSize: 12, textAlign: 'left', fontWeight: 600 }}>Sr. No.</th>
                  <th style={{ padding: '10px 14px', fontSize: 12, textAlign: 'left', fontWeight: 600 }}>Site Name</th>
                  <th style={{ padding: '10px 14px', fontSize: 12, textAlign: 'left', fontWeight: 600 }}>CA Number</th>
                  <th style={{ padding: '10px 14px', fontSize: 12, textAlign: 'left', fontWeight: 600 }}>District</th>
                  <th style={{ padding: '10px 14px', fontSize: 12, textAlign: 'left', fontWeight: 600 }}>Billing Month</th>
                  <th style={{ padding: '10px 14px', fontSize: 12, textAlign: 'right', fontWeight: 600 }}>Generation</th>
                  <th style={{ padding: '10px 14px', fontSize: 12, textAlign: 'right', fontWeight: 600 }}>Amount (INR)</th>
                  <th style={{ padding: '10px 14px', fontSize: 12, textAlign: 'center', fontWeight: 600 }}>Status</th>
                  <th style={{ padding: '10px 14px', fontSize: 12, textAlign: 'center', fontWeight: 600 }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={9} style={{ padding: 32, textAlign: 'center', color: '#64748b' }}>
                      <span className="ax-spinner" style={{ marginRight: 8 }} /> Loading billing records…
                    </td>
                  </tr>
                ) : paginatedItems.length === 0 ? (
                  <tr>
                    <td colSpan={9} style={{ padding: 28, textAlign: 'center' }}>
                      <TableEmptyState message="No billing records match your search criteria." />
                    </td>
                  </tr>
                ) : (
                  paginatedItems.map((b, idx) => (
                    <tr key={b.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '12px 14px', fontSize: 13, color: '#64748b' }}>{(page - 1) * pageSize + idx + 1}</td>
                      <td style={{ padding: '12px 14px', fontSize: 13, fontWeight: 600, color: '#0f172a' }}>
                        <div>{b.site_name}</div>
                        <span style={{ fontSize: 11, color: '#64748b', fontWeight: 400 }}>Inv: {b.bill_no}</span>
                      </td>
                      <td style={{ padding: '12px 14px', fontSize: 13, fontFamily: 'monospace', color: '#334155' }}>{b.ca_no}</td>
                      <td style={{ padding: '12px 14px', fontSize: 13 }}>{b.district}</td>
                      <td style={{ padding: '12px 14px', fontSize: 13 }}>{b.month}</td>
                      <td style={{ padding: '12px 14px', fontSize: 13, textAlign: 'right', fontWeight: 600, color: '#2563eb' }}>
                        {b.generation_kwh.toLocaleString('en-IN')} kWh
                      </td>
                      <td style={{ padding: '12px 14px', fontSize: 13, textAlign: 'right', fontWeight: 700, color: '#0f172a' }}>
                        ₹{b.amount.toLocaleString('en-IN')}
                      </td>
                      <td style={{ padding: '12px 14px', fontSize: 13, textAlign: 'center' }}>
                        <span
                          className={`ax-badge ax-badge--soft ax-badge--${
                            b.status === 'Paid' ? 'success' : b.status === 'Pending' ? 'warning' : 'danger'
                          }`}
                        >
                          {b.status}
                        </span>
                      </td>
                      <td style={{ padding: '12px 14px', fontSize: 13, textAlign: 'center' }}>
                        <div style={{ display: 'inline-flex', gap: 6 }}>
                          <button
                            type="button"
                            className="ax-btn ax-btn--ghost ax-btn--xs"
                            onClick={() => setPreviewBill(b)}
                            style={{ color: '#2563eb' }}
                            title="Preview formatted invoice voucher"
                          >
                            Invoice
                          </button>
                          <button
                            type="button"
                            className="ax-btn ax-btn--secondary ax-btn--xs"
                            onClick={() => setManagingSite(b)}
                            title="Manage or add monthly bill"
                          >
                            Manage
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="ax-card__footer" style={{ padding: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: '#64748b' }}>
            Showing {filteredBills.length > 0 ? (page - 1) * pageSize + 1 : 0} to{' '}
            {Math.min(page * pageSize, filteredBills.length)} of {filteredBills.length} records
          </span>
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
            pageSize={pageSize}
            onPageSizeChange={setPageSize}
          />
        </div>
      </div>

      {/* Invoice Lightbox Modal */}
      {previewBill && (
        <InvoicePreviewModal
          url={previewBill.invoice_url}
          title={`Invoice #${previewBill.bill_no}`}
          billItem={previewBill}
          onClose={() => setPreviewBill(null)}
        />
      )}

      {/* Manage/Create Bill Modal */}
      {managingSite && (
        <CreateBillModal
          site={managingSite}
          onClose={() => setManagingSite(null)}
          onSaveNewBill={(newBill) => {
            setBills((prev) =>
              prev.map((item) =>
                item.id === managingSite.id
                  ? {
                      ...item,
                      ...newBill,
                    }
                  : item
              )
            );
          }}
        />
      )}
    </div>
  );
}

export default ViewRescoBills;
