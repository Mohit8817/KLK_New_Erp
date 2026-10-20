import { useState, useMemo, useEffect, useCallback, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PageHead } from '../../../../shell/PageHead';
import { biharUlaInstallationService } from '../../../../../services/biharUlaInstallationService';
import { SearchInput, TableEmptyState, Pagination } from '../../../../../common';

const ICON_CHECK = (
  <svg style={{ width: 14, height: 14 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const ICON_UPLOAD = (
  <svg style={{ width: 18, height: 18 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2 -2v-2" />
    <polyline points="7 9 12 4 17 9" />
    <line x1="12" y1="4" x2="12" y2="16" />
  </svg>
);

export function Bihar_Installation_ULA_AddPayment() {
  const navigate = useNavigate();
  const [paymentType, setPaymentType] = useState<string>('50');
  const [claimDate, setClaimDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [remarks, setRemarks] = useState<string>('');
  const [invoiceFile, setInvoiceFile] = useState<File | null>(null);

  // Eligible Sites
  const [eligibleSites, setEligibleSites] = useState<any[]>([]);
  const [loadingSites, setLoadingSites] = useState(false);
  const [selectedSiteIds, setSelectedSiteIds] = useState<number[]>([]);

  // Search & Pagination for eligible sites table
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Status & Feedback
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Load eligible sites when paymentType changes
  const loadEligibleSites = useCallback(async (typeVal: string) => {
    setLoadingSites(true);
    setErrorMsg(null);
    setSelectedSiteIds([]);
    try {
      const data = await biharUlaInstallationService.fetchClaimEligibleSites(Number(typeVal));
      setEligibleSites(data || []);
    } catch (err: any) {
      console.error('Error fetching claim eligible sites:', err);
      setErrorMsg('Failed to load eligible sites for this claim type.');
      setEligibleSites([]);
    } finally {
      setLoadingSites(false);
    }
  }, []);

  useEffect(() => {
    loadEligibleSites(paymentType);
  }, [paymentType, loadEligibleSites]);

  // Select / Deselect individual site
  const toggleSiteSelect = (id: number) => {
    setSelectedSiteIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Select All
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedSiteIds(filteredSites.map((s) => s.id));
    } else {
      setSelectedSiteIds([]);
    }
  };

  // Filtered sites
  const filteredSites = useMemo(() => {
    if (!search.trim()) return eligibleSites;
    const q = search.toLowerCase();
    return eligibleSites.filter((s) =>
      s.beneficiary_name?.toLowerCase().includes(q) ||
      s.ca_no?.toLowerCase().includes(q) ||
      s.district?.toLowerCase().includes(q) ||
      s.block?.toLowerCase().includes(q) ||
      s.village?.toLowerCase().includes(q) ||
      String(s.id).includes(q)
    );
  }, [eligibleSites, search]);

  // Paginated sites
  const paginatedSites = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredSites.slice(start, start + pageSize);
  }, [filteredSites, currentPage, pageSize]);

  const allFilteredSelected = filteredSites.length > 0 && filteredSites.every((s) => selectedSiteIds.includes(s.id));

  // Submit Claim
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (selectedSiteIds.length === 0) {
      setErrorMsg('Please select at least one site to raise a payment claim.');
      return;
    }
    if (!claimDate) {
      setErrorMsg('Claim date is required.');
      return;
    }
    if (!remarks.trim()) {
      setErrorMsg('Remarks are required.');
      return;
    }
    if (!invoiceFile) {
      setErrorMsg('Invoice file is required.');
      return;
    }

    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('payment_type', paymentType);
      selectedSiteIds.forEach((id, idx) => {
        fd.append(`site_id[${idx}]`, String(id));
      });
      fd.append('date', claimDate);
      fd.append('remarks', remarks.trim());
      fd.append('file', invoiceFile);

      const resp = await biharUlaInstallationService.storeClaim(fd);
      setSuccessMsg(resp.message || 'Payment claim submitted successfully!');
      setTimeout(() => {
        navigate('/v/bihar/ula-installation-view-payment');
      }, 1500);
    } catch (err: any) {
      console.error('Failed to submit claim:', err);
      setErrorMsg(err?.message || 'Failed to submit payment claim.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="ax-page">
      <PageHead
        title="Bihar - Installation > ULA > Add Payment Claim"
        subtitle="Submit 50% advance or 30% final installation claim with supporting tax invoice"
        breadcrumbs={[
          { label: 'Bihar' },
          { label: 'Installation' },
          { label: 'ULA' },
          { label: 'Add Payment' },
        ]}
        actions={
          <Link to="/v/bihar/ula-installation-view-payment" className="ax-btn ax-btn--secondary ax-btn--sm">
            View All Claims
          </Link>
        }
      />

      {errorMsg && (
        <div className="ax-alert ax-alert--danger" style={{ marginBottom: 'var(--ax-space-4)' }}>
          <div className="ax-alert__title">Error</div>
          <div className="ax-alert__text">{errorMsg}</div>
        </div>
      )}

      {successMsg && (
        <div className="ax-alert ax-alert--success" style={{ marginBottom: 'var(--ax-space-4)' }}>
          <div className="ax-alert__title">Success</div>
          <div className="ax-alert__text">{successMsg}</div>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="ax-dash-grid">
          {/* ── STEP 1: Select Claim Stage ── */}
          <div className="ax-card ax-col--12">
            <div className="ax-card__header">
              <h3 className="ax-card__title">1. Claim Type & Batch Parameters</h3>
              <p className="ax-card__subtitle">Choose whether you are claiming 50% (structure stage) or 30% (final electric stage)</p>
            </div>
            <div className="ax-card__body">
              <div className="ax-dash-grid">
                <div className="ax-col--4">
                  <div className="ax-field">
                    <label className="ax-field__label" htmlFor="payment_type">
                      Claim Stage <span style={{ color: 'var(--ax-danger)' }}>*</span>
                    </label>
                    <select
                      id="payment_type"
                      className="ax-input"
                      value={paymentType}
                      onChange={(e) => setPaymentType(e.target.value)}
                      required
                    >
                      <option value="50">50% Advance Claim (Structure Complete)</option>
                      <option value="30">30% Final Installation Claim</option>
                    </select>
                  </div>
                </div>

                <div className="ax-col--4">
                  <div className="ax-field">
                    <label className="ax-field__label" htmlFor="claim_date">
                      Claim Date <span style={{ color: 'var(--ax-danger)' }}>*</span>
                    </label>
                    <input
                      id="claim_date"
                      type="date"
                      className="ax-input"
                      value={claimDate}
                      onChange={(e) => setClaimDate(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="ax-col--4">
                  <div className="ax-field">
                    <label className="ax-field__label" htmlFor="invoice_file">
                      Invoice Document (PDF/JPG max 2MB) <span style={{ color: 'var(--ax-danger)' }}>*</span>
                    </label>
                    <input
                      id="invoice_file"
                      type="file"
                      accept=".pdf,image/jpeg,image/png,image/jpg"
                      className="ax-input"
                      onChange={(e) => setInvoiceFile(e.target.files?.[0] || null)}
                      required
                    />
                  </div>
                </div>

                <div className="ax-col--12">
                  <div className="ax-field">
                    <label className="ax-field__label" htmlFor="remarks">
                      Vendor Claim Remarks <span style={{ color: 'var(--ax-danger)' }}>*</span>
                    </label>
                    <input
                      id="remarks"
                      type="text"
                      className="ax-input"
                      placeholder="e.g. Submitting invoice for batch installation completed across Muzaffarpur & Samastipur"
                      value={remarks}
                      onChange={(e) => setRemarks(e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── STEP 2: Select Eligible Sites ── */}
          <div className="ax-card ax-col--12">
            <div className="ax-card__header">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', flexWrap: 'wrap', gap: 'var(--ax-space-2)' }}>
                <div>
                  <h3 className="ax-card__title">2. Select Eligible Beneficiary Sites</h3>
                  <p className="ax-card__subtitle">
                    Select sites from the eligible list to attach to this invoice ({eligibleSites.length} available)
                  </p>
                </div>
                <div className="ax-cluster" style={{ gap: 'var(--ax-space-2)' }}>
                  <span className="ax-badge ax-badge--soft ax-badge--info">
                    Selected: <b>{selectedSiteIds.length} Sites</b>
                  </span>
                </div>
              </div>
            </div>

            <div className="ax-card__body">
              <div style={{ marginBottom: 'var(--ax-space-3)', maxWidth: 300 }}>
                <SearchInput
                  value={search}
                  onChange={setSearch}
                  placeholder="Search eligible sites..."
                />
              </div>

              <div className="ax-table-wrap">
                <table className="ax-table ax-table--hover">
                  <thead>
                    <tr>
                      <th style={{ width: 40, textAlign: 'center' }}>
                        <input
                          type="checkbox"
                          checked={allFilteredSelected}
                          onChange={(e) => handleSelectAll(e.target.checked)}
                          disabled={filteredSites.length === 0}
                          aria-label="Select all"
                        />
                      </th>
                      <th>Sr.</th>
                      <th>Beneficiary Name</th>
                      <th>CA Number</th>
                      <th>Contact No.</th>
                      <th>District</th>
                      <th>Block</th>
                      <th>Village</th>
                      <th>Structure Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loadingSites ? (
                      <tr>
                        <td colSpan={9} style={{ textAlign: 'center', padding: 'var(--ax-space-6)' }}>
                          <span className="ax-spinner" /> Loading eligible sites...
                        </td>
                      </tr>
                    ) : paginatedSites.length === 0 ? (
                      <tr>
                        <td colSpan={9}>
                          <TableEmptyState
                            title="No eligible sites found"
                            message="There are currently no approved sites awaiting this payment claim type."
                          />
                        </td>
                      </tr>
                    ) : (
                      paginatedSites.map((s, index) => {
                        const isSelected = selectedSiteIds.includes(s.id);
                        return (
                          <tr
                            key={s.id}
                            onClick={() => toggleSiteSelect(s.id)}
                            style={{ cursor: 'pointer', backgroundColor: isSelected ? 'var(--ax-bg-subtle)' : undefined }}
                          >
                            <td style={{ textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => toggleSiteSelect(s.id)}
                              />
                            </td>
                            <td>{(currentPage - 1) * pageSize + index + 1}</td>
                            <td style={{ fontWeight: 600 }}>{s.beneficiary_name || '—'}</td>
                            <td>{s.ca_no || '—'}</td>
                            <td>{s.contact_no || '—'}</td>
                            <td>{s.district || '—'}</td>
                            <td>{s.block || '—'}</td>
                            <td>{s.village || '—'}</td>
                            <td>
                              <span className="ax-badge ax-badge--soft ax-badge--success">Eligible</span>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              <div style={{ marginTop: 'var(--ax-space-3)' }}>
                <Pagination
                  currentPage={currentPage}
                  totalCount={filteredSites.length}
                  pageSize={pageSize}
                  onPageChange={setCurrentPage}
                  onPageSizeChange={setPageSize}
                />
              </div>
            </div>
          </div>

          {/* ── Submit Action Toolbar ── */}
          <div className="ax-col--12" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'var(--ax-space-2)' }}>
            <div style={{ fontSize: 'var(--ax-text-sm)', color: 'var(--ax-text-muted)' }}>
              Total Sites Selected for Claim: <b style={{ color: 'var(--ax-text-strong)' }}>{selectedSiteIds.length}</b>
            </div>

            <div className="ax-cluster" style={{ gap: 'var(--ax-space-2)' }}>
              <button
                type="button"
                className="ax-btn ax-btn--secondary"
                onClick={() => {
                  setSelectedSiteIds([]);
                  setRemarks('');
                  setInvoiceFile(null);
                }}
                disabled={submitting}
              >
                Reset Selection
              </button>
              <button
                type="submit"
                className="ax-btn ax-btn--primary"
                disabled={submitting || selectedSiteIds.length === 0}
              >
                {submitting ? <span className="ax-spinner" /> : ICON_UPLOAD}
                <span className="ax-btn__label">
                  {submitting ? 'Submitting Claim...' : `Submit ${paymentType}% Payment Claim`}
                </span>
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

export default Bihar_Installation_ULA_AddPayment;
