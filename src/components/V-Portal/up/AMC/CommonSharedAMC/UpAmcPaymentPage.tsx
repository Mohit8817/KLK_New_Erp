import { useState, useMemo, useEffect, useCallback, useRef, type FormEvent, type ReactNode } from 'react';
import { PageHead } from '../../../../shell/PageHead';
import { useFocusTrap } from '../../../../../hooks/useFocusTrap';
import { resolveUpMediaUrl } from '../../up-services';
import {
  SearchInput,
  TableEmptyState,
} from '../../../../../common';

export const DASH = '—';

const X_ICON = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M18 6l-12 12" />
    <path d="M6 6l12 12" />
  </svg>
);

const ICON_REFRESH = (
  <svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M20 11a8.1 8.1 0 0 0 -15.5 -2m-.5 -4v4h4" />
    <path d="M4 13a8.1 8.1 0 0 0 15.5 2m.5 4v-4h-4" />
  </svg>
);

const ICON_PLUS = (
  <svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 5v14" />
    <path d="M5 12h14" />
  </svg>
);

function Modal({
  open,
  onClose,
  labelledBy,
  dialogClass = '',
  children,
}: {
  open: boolean;
  onClose: () => void;
  labelledBy: string;
  dialogClass?: string;
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
  return (
    <div className="ax-modal ax-modal--centered" role="dialog" aria-modal="true" aria-labelledby={labelledBy}>
      <div className="ax-modal__backdrop" onClick={onClose} />
      <div ref={dialogRef} className={`ax-modal__dialog${dialogClass ? ' ' + dialogClass : ''}`}>
        {children}
      </div>
    </div>
  );
}

export interface UpAmcPaymentPageProps {
  title: string;
  subtitle: string;
  breadcrumbs: { label: string; href?: string }[];
  projectName: string;
  onFetchClaimData: () => Promise<{ status: boolean; data?: { payments?: any[]; sites?: any[] }; message?: string }>;
  onStoreClaim: (formData: FormData) => Promise<{ status: boolean; message?: string; errors?: Record<string, string[]> }>;
}

export function UpAmcPaymentPage(props: UpAmcPaymentPageProps) {
  const { title, subtitle, breadcrumbs, projectName, onFetchClaimData, onStoreClaim } = props;

  const [activeTab, setActiveTab] = useState<'sites' | 'payments'>('sites');
  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState<any[]>([]);
  const [sites, setSites] = useState<any[]>([]);
  const [selectedSiteIds, setSelectedSiteIds] = useState<number[]>([]);
  const [search, setSearch] = useState('');

  // Raise claim modal
  const [showRaiseModal, setShowRaiseModal] = useState(false);
  const [claimAmount, setClaimAmount] = useState('');
  const [claimRemarks, setClaimRemarks] = useState('');
  const [claimFile, setClaimFile] = useState<File | null>(null);
  const [submittingClaim, setSubmittingClaim] = useState(false);

  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res: any = await onFetchClaimData();
      if (res?.status) {
        const rawPayments = res.data?.payments ?? res.payments ?? [];
        const rawSites = res.data?.sites ?? res.data?.lights ?? res.sites ?? res.lights ?? [];
        setPayments(Array.isArray(rawPayments) ? rawPayments : []);
        setSites(Array.isArray(rawSites) ? rawSites : []);
      } else {
        setPayments([]);
        setSites([]);
        if (res?.message) setToast({ type: 'error', message: res.message });
      }
    } catch (err: any) {
      setPayments([]);
      setSites([]);
      setToast({ type: 'error', message: err?.message || 'Failed to load claims data.' });
    } finally {
      setLoading(false);
    }
  }, [onFetchClaimData]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Filtered sites
  const filteredSites = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return sites;
    return sites.filter((s) => {
      const hay = [
        s.site_name,
        s.district,
        s.beneficiary_name,
        s.beneficiary_contact,
        s.report_month,
        s.report_year,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return hay.includes(q);
    });
  }, [sites, search]);

  // Filtered payments
  const filteredPayments = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return payments;
    return payments.filter((p) => {
      const hay = [p.id, p.amount, p.remarks, p.type, p.project]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return hay.includes(q);
    });
  }, [payments, search]);

  const toggleSelectSite = (id: number) => {
    setSelectedSiteIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleSelectAllSites = () => {
    if (selectedSiteIds.length === filteredSites.length) {
      setSelectedSiteIds([]);
    } else {
      setSelectedSiteIds(filteredSites.map((s) => s.id));
    }
  };

  const selectedSitesList = useMemo(() => {
    return sites.filter((s) => selectedSiteIds.includes(s.id));
  }, [sites, selectedSiteIds]);

  const selectedSiteValue = useMemo(() => {
    if (selectedSiteIds.length === 0) return '';
    if (sites.length > 1 && selectedSiteIds.length === sites.length) return 'all';
    if (selectedSiteIds.length === 1) return String(selectedSiteIds[0]);
    return String(selectedSiteIds[0]);
  }, [selectedSiteIds, sites.length]);

  const handleSiteSelectChange = (val: string) => {
    if (!val) {
      setSelectedSiteIds([]);
    } else if (val === 'all') {
      setSelectedSiteIds(sites.map((s) => s.id));
    } else {
      setSelectedSiteIds([Number(val)]);
    }
  };

  const handleOpenAddPaymentModal = () => {
    setClaimAmount('');
    setClaimRemarks('');
    setClaimFile(null);
    setShowRaiseModal(true);
  };

  const handleRowClaim = (siteId: number) => {
    setSelectedSiteIds([siteId]);
    setClaimAmount('');
    setClaimRemarks('');
    setClaimFile(null);
    setShowRaiseModal(true);
  };

  const handleClaimSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (selectedSiteIds.length === 0) {
      setToast({ type: 'error', message: 'Please select at least 1 site to claim payment.' });
      return;
    }
    if (!claimAmount || Number(claimAmount) <= 0) {
      setToast({ type: 'error', message: 'Please enter a valid amount.' });
      return;
    }
    if (!claimFile) {
      setToast({ type: 'error', message: 'Invoice document is required.' });
      return;
    }
    if (!claimRemarks.trim()) {
      setToast({ type: 'error', message: 'Remarks are required.' });
      return;
    }

    setSubmittingClaim(true);
    try {
      const fd = new FormData();
      fd.append('amount', claimAmount);
      fd.append('claim_amount', claimAmount);
      fd.append('remarks', claimRemarks.trim());
      fd.append('remark', claimRemarks.trim());
      fd.append('file', claimFile);
      fd.append('invoice', claimFile);
      fd.append('claim_invoice', claimFile);

      if (selectedSiteIds.length === 1) {
        fd.append('site_id', String(selectedSiteIds[0]));
        fd.append('resco_id', String(selectedSiteIds[0]));
        fd.append('id', String(selectedSiteIds[0]));
      }
      selectedSiteIds.forEach((sid) => {
        fd.append('site_id[]', String(sid));
        fd.append('resco_id[]', String(sid));
      });
      if (selectedSiteIds.length > 0) {
        fd.append('site_ids', selectedSiteIds.join(','));
      }

      const res = await onStoreClaim(fd);
      if (res.status) {
        setToast({ type: 'success', message: res.message || 'Payment claim submitted successfully!' });
        setShowRaiseModal(false);
        setSelectedSiteIds([]);
        loadData();
      } else {
        setToast({ type: 'error', message: res.message || 'Failed to submit payment claim.' });
      }
    } catch (err: any) {
      setToast({ type: 'error', message: err?.message || 'Error occurred.' });
    } finally {
      setSubmittingClaim(false);
    }
  };

  return (
    <div className="solar-erp-page">
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
            <button
              type="button"
              className="ax-btn ax-btn--primary ax-btn--sm"
              onClick={handleOpenAddPaymentModal}
            >
              {ICON_PLUS}
              <span className="ax-btn__label">Add Payment</span>
            </button>
          </div>
        }
      />

      {toast && (
        <div className={`ax-alert ax-alert--${toast.type === 'success' ? 'success' : 'danger'}`} style={{ marginBottom: 16 }}>
          <div className="ax-alert__title">{toast.type === 'success' ? 'Success' : 'Error'}</div>
          <div className="ax-alert__text">{toast.message}</div>
        </div>
      )}

      {/* ── Tabs ── */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <button
          type="button"
          className={`ax-btn ax-btn--sm ${activeTab === 'sites' ? 'ax-btn--primary' : 'ax-btn--secondary'}`}
          onClick={() => setActiveTab('sites')}
        >
          Verified Sites Eligible for Claim ({sites.length})
        </button>
        <button
          type="button"
          className={`ax-btn ax-btn--sm ${activeTab === 'payments' ? 'ax-btn--primary' : 'ax-btn--secondary'}`}
          onClick={() => setActiveTab('payments')}
        >
          Payment / Claim History ({payments.length})
        </button>
      </div>

      <div className="ax-dash-grid">
        <section className="ax-card ax-col--12">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <h2 className="ax-card__title">
                {activeTab === 'sites' ? 'Verified Sites Pending Payment Claim' : 'Submitted Payment Claims'}
              </h2>
              <p className="ax-card__subtitle">
                {activeTab === 'sites'
                  ? 'Select verified sites to generate an invoice and claim payment'
                  : 'Track the verification and payout status of previous claims'}
              </p>
            </div>
            <div className="ax-card__actions">
              <SearchInput
                value={search}
                onChange={setSearch}
                placeholder="Search records…"
                size="sm"
                ariaLabel="Search records"
              />
            </div>
          </div>

          <div className="ax-table-wrap">
            {activeTab === 'sites' ? (
              <table className="ax-table ax-table--hover" style={{ whiteSpace: 'nowrap', minWidth: 1000 }}>
                <thead className="ax-table__head">
                  <tr>
                    <th className="ax-table__th" style={{ width: 40, textAlign: 'center' }}>
                      <input
                        type="checkbox"
                        checked={filteredSites.length > 0 && selectedSiteIds.length === filteredSites.length}
                        onChange={toggleSelectAllSites}
                      />
                    </th>
                    <th className="ax-table__th">Sr. No.</th>
                    <th className="ax-table__th">Site / Beneficiary</th>
                    <th className="ax-table__th">District</th>
                    <th className="ax-table__th">Contact</th>
                    <th className="ax-table__th">Period</th>
                    <th className="ax-table__th">AMC Date</th>
                    <th className="ax-table__th">Verification Status</th>
                    <th className="ax-table__th" style={{ textAlign: 'center', width: 110 }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {loading && (
                    <tr>
                      <td colSpan={9} style={{ textAlign: 'center', padding: 24 }}>
                        <span className="ax-spinner" style={{ marginRight: 8 }} /> Loading eligible sites…
                      </td>
                    </tr>
                  )}
                  {!loading && filteredSites.length === 0 && (
                    <tr>
                      <td colSpan={9} style={{ padding: 0 }}>
                        <TableEmptyState
                          title="No eligible sites found"
                          message="No verified sites are currently pending payment claim."
                        />
                      </td>
                    </tr>
                  )}
                  {!loading &&
                    filteredSites.map((site, idx) => (
                      <tr key={site.id} className="ax-table__row">
                        <td className="ax-table__td" style={{ textAlign: 'center' }}>
                          <input
                            type="checkbox"
                            checked={selectedSiteIds.includes(site.id)}
                            onChange={() => toggleSelectSite(site.id)}
                          />
                        </td>
                        <td className="ax-table__td ax-num">{idx + 1}</td>
                        <td className="ax-table__td" style={{ fontWeight: 600 }}>
                          {site.site_name || site.beneficiary_name || `Site #${site.id}`}
                        </td>
                        <td className="ax-table__td">{site.district || DASH}</td>
                        <td className="ax-table__td">{site.beneficiary_contact || DASH}</td>
                        <td className="ax-table__td">{site.month_year || `${site.report_month || ''}-${site.report_year || ''}` || DASH}</td>
                        <td className="ax-table__td">{site.amc_date || site.date || DASH}</td>
                        <td className="ax-table__td">
                          <span className="ax-badge ax-badge--soft ax-badge--success">Verified</span>
                        </td>
                        <td className="ax-table__td" style={{ textAlign: 'center' }}>
                          <button
                            type="button"
                            className="ax-btn ax-btn--primary ax-btn--xs"
                            onClick={() => handleRowClaim(site.id)}
                            style={{ fontWeight: 600, padding: '4px 10px' }}
                          >
                            + Claim
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            ) : (
              <table className="ax-table ax-table--hover" style={{ whiteSpace: 'nowrap', minWidth: 900 }}>
                <thead className="ax-table__head">
                  <tr>
                    <th className="ax-table__th">Claim ID</th>
                    <th className="ax-table__th">Claim Amount (₹)</th>
                    <th className="ax-table__th">Sites Included</th>
                    <th className="ax-table__th">Remarks</th>
                    <th className="ax-table__th">Invoice Document</th>
                    <th className="ax-table__th">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {loading && (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', padding: 24 }}>
                        <span className="ax-spinner" style={{ marginRight: 8 }} /> Loading claims…
                      </td>
                    </tr>
                  )}
                  {!loading && filteredPayments.length === 0 && (
                    <tr>
                      <td colSpan={6} style={{ padding: 0 }}>
                        <TableEmptyState
                          title="No payment claims found"
                          message="No payment claims have been raised yet."
                        />
                      </td>
                    </tr>
                  )}
                  {!loading &&
                    filteredPayments.map((p) => (
                      <tr key={p.id} className="ax-table__row">
                        <td className="ax-table__td ax-num">#{p.id}</td>
                        <td className="ax-table__td" style={{ fontWeight: 700, color: 'var(--ax-primary-default, #2563eb)' }}>
                          ₹{Number(p.amount || 0).toLocaleString('en-IN')}
                        </td>
                        <td className="ax-table__td">{p.site_id || DASH}</td>
                        <td className="ax-table__td">{p.remarks || DASH}</td>
                        <td className="ax-table__td">
                          {p.file ? (
                            <a
                              href={resolveUpMediaUrl(p.file)}
                              target="_blank"
                              rel="noreferrer"
                              className="ax-btn ax-btn--ghost ax-btn--sm"
                            >
                              View Invoice ↗
                            </a>
                          ) : (
                            DASH
                          )}
                        </td>
                        <td className="ax-table__td">
                          <span className={`ax-badge ax-badge--soft ${Number(p.claim_status) === 1 ? 'ax-badge--success' : Number(p.claim_status) === 2 ? 'ax-badge--danger' : 'ax-badge--info'}`}>
                            {Number(p.claim_status) === 1 ? 'Approved' : Number(p.claim_status) === 2 ? 'Rejected' : 'Submitted'}
                          </span>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            )}
          </div>
        </section>
      </div>

      {/* ── Add Payment Modal ── */}
      <Modal open={showRaiseModal} onClose={() => setShowRaiseModal(false)} labelledBy="add-payment-modal-title">
        <form onSubmit={handleClaimSubmit}>
          <div
            className="ax-modal__header"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '16px 20px',
              borderBottom: '1px solid var(--ax-border, #e2e8f0)',
            }}
          >
            <div>
              <h2 className="ax-modal__title" id="add-payment-modal-title" style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>
                Add Payment
              </h2>
              <p style={{ fontSize: 12, color: 'var(--ax-text-muted, #64748b)', margin: '2px 0 0 0' }}>
                Select site, upload invoice and submit payment claim ({projectName})
              </p>
            </div>
            <button
              type="button"
              className="ax-modal__close"
              onClick={() => setShowRaiseModal(false)}
              aria-label="Close"
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: 4,
                borderRadius: 4,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--ax-text-muted, #64748b)',
              }}
            >
              {X_ICON}
            </button>
          </div>

          <div className="ax-modal__body" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Field 1: Select Site */}
            <div>
              <label
                htmlFor="amc-claim-site-select"
                style={{ fontSize: 13, fontWeight: 600, color: 'var(--ax-text-strong, #1e293b)', display: 'block', marginBottom: 6 }}
              >
                Select Site <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <select
                id="amc-claim-site-select"
                className="ax-input ax-select"
                value={selectedSiteValue}
                onChange={(e) => handleSiteSelectChange(e.target.value)}
                required
                style={{ width: '100%', height: 42, borderRadius: 6, fontSize: 13 }}
              >
                <option value="">-- Select --</option>
                {sites.length > 1 && (
                  <option value="all">★ All Verified Sites ({sites.length} sites)</option>
                )}
                {sites.map((s) => {
                  const sName = s.site_name || s.beneficiary_name || `Site #${s.id}`;
                  const sDist = s.district ? ` (${s.district})` : '';
                  const sPeriod = s.month_year || (s.report_month && s.report_year ? ` · ${s.report_month}-${s.report_year}` : '');
                  return (
                    <option key={s.id} value={String(s.id)}>
                      {sName}{sDist}{sPeriod} [ID: {s.id}]
                    </option>
                  );
                })}
              </select>

              {/* Selected site info pill / badge */}
              {selectedSitesList.length > 0 && (
                <div
                  style={{
                    marginTop: 8,
                    padding: '8px 12px',
                    borderRadius: 6,
                    background: 'var(--ax-surface-subtle, #f8fafc)',
                    border: '1px solid var(--ax-border, #e2e8f0)',
                    fontSize: 12,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: 6,
                  }}
                >
                  <span style={{ fontWeight: 600, color: 'var(--ax-primary-default, #2563eb)' }}>
                    {selectedSitesList.length === 1
                      ? `Selected: ${selectedSitesList[0].site_name || selectedSitesList[0].beneficiary_name || `Site #${selectedSitesList[0].id}`}`
                      : `${selectedSitesList.length} sites selected for claim`}
                  </span>
                  {selectedSitesList.length === 1 && selectedSitesList[0].district && (
                    <span style={{ color: 'var(--ax-text-muted, #64748b)' }}>
                      District: {selectedSitesList[0].district}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Field 2: Invoice */}
            <div>
              <label
                htmlFor="amc-claim-invoice-file"
                style={{ fontSize: 13, fontWeight: 600, color: 'var(--ax-text-strong, #1e293b)', display: 'block', marginBottom: 6 }}
              >
                Invoice <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                id="amc-claim-invoice-file"
                type="file"
                accept="image/*,.pdf,.doc,.docx"
                className="ax-input"
                onChange={(e) => setClaimFile(e.target.files?.[0] || null)}
                required
                style={{ width: '100%', height: 42, padding: '8px 12px', borderRadius: 6, fontSize: 13 }}
              />
              <div style={{ fontSize: 11, color: 'var(--ax-text-muted, #64748b)', marginTop: 4 }}>
                {claimFile ? (
                  <span style={{ color: '#059669', fontWeight: 600 }}>
                    Selected: {claimFile.name} ({(claimFile.size / 1024).toFixed(0)} KB)
                  </span>
                ) : (
                  'No file chosen'
                )}
              </div>
            </div>

            {/* Field 3: Amount */}
            <div>
              <label
                htmlFor="amc-claim-amount"
                style={{ fontSize: 13, fontWeight: 600, color: 'var(--ax-text-strong, #1e293b)', display: 'block', marginBottom: 6 }}
              >
                Amount <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                id="amc-claim-amount"
                type="number"
                step="0.01"
                min="1"
                className="ax-input"
                placeholder="Enter Amount"
                value={claimAmount}
                onChange={(e) => setClaimAmount(e.target.value)}
                required
                style={{ width: '100%', height: 42, borderRadius: 6, fontSize: 13 }}
              />
            </div>

            {/* Field 4: Remarks */}
            <div>
              <label
                htmlFor="amc-claim-remarks"
                style={{ fontSize: 13, fontWeight: 600, color: 'var(--ax-text-strong, #1e293b)', display: 'block', marginBottom: 6 }}
              >
                Remarks <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <textarea
                id="amc-claim-remarks"
                className="ax-input"
                rows={3}
                placeholder="Enter Remarks"
                value={claimRemarks}
                onChange={(e) => setClaimRemarks(e.target.value)}
                required
                style={{ width: '100%', borderRadius: 6, fontSize: 13, padding: '10px 12px' }}
              />
            </div>
          </div>

          <div
            className="ax-modal__footer"
            style={{
              padding: '14px 20px',
              borderTop: '1px solid var(--ax-border, #e2e8f0)',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: 8,
            }}
          >
            <button
              type="button"
              className="ax-btn ax-btn--ghost"
              onClick={() => setShowRaiseModal(false)}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="ax-btn ax-btn--primary"
              disabled={submittingClaim || selectedSiteIds.length === 0}
            >
              {submittingClaim ? 'Submitting…' : 'Add Payment'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
