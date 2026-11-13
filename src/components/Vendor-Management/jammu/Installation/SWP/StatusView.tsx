import { useState, useMemo, useEffect, useCallback, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
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
  type JammuSwpInstalledSiteItem,
} from './jammuSwpAdminService';

const DASH = '—';

type Tone = 'success' | 'warning' | 'danger' | 'neutral' | 'info';

const Badge = ({ tone, children }: { tone: Tone; children: ReactNode }) => (
  <span className={`ax-badge ax-badge--soft ax-badge--${tone}`} style={{ padding: '3px 10px', borderRadius: 9999, fontSize: 11, fontWeight: 700 }}>
    {children}
  </span>
);

const VerifyBadge = ({ value }: { value: number }) => {
  if (value === 1) return <Badge tone="success">Approved</Badge>;
  if (value === 2) return <Badge tone="danger">Rejected</Badge>;
  return <Badge tone="warning">Pending</Badge>;
};

const DocBadge = ({ status }: { status?: number }) => {
  const s = Number(status ?? 0);
  if (s === 2) return <Badge tone="success">Approved</Badge>;
  if (s === 3) return <Badge tone="danger">Rejected</Badge>;
  if (s === 1) return <Badge tone="warning">Submitted</Badge>;
  return <Badge tone="neutral">Not Submitted</Badge>;
};

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

  .solar-erp-page .ax-table-wrap {
    width: 100%;
    max-width: 100%;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }
  .solar-erp-page .ax-table { min-width: 980px; }
`;

const OVERLAY_CSS = `
  .ax-modal {
    position: fixed; inset: 0; z-index: 9999;
    background: rgba(15, 23, 42, 0.65);
    backdrop-filter: blur(6px);
    display: flex; align-items: center; justify-content: center;
    padding: 20px;
  }
  .ax-modal__backdrop { position: fixed; inset: 0; background: transparent; }
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
  }
  .ax-modal__body { padding: 24px; overflow-y: auto; max-height: calc(85vh - 120px); }
  .ax-modal__footer {
    display: flex; align-items: center; justify-content: flex-end; gap: 10px;
    padding: 16px 24px; border-top: 1px solid var(--ax-border, #e2e8f0);
    background: var(--ax-surface-subtle, #f8fafc);
  }
`;

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

export function StatusView() {
  const [searchParams, setSearchParams] = useSearchParams();
  const rawStatus = searchParams.get('status') || 'all';
  const rawDistrict = searchParams.get('district') || 'all';

  const [sites, setSites] = useState<JammuSwpInstalledSiteItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const [detailModalOpen, setDetailModalOpen] = useState<boolean>(false);
  const [selectedSite, setSelectedSite] = useState<JammuSwpInstalledSiteItem | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await jammuAdminSwpService.getInstalledSites();
      setSites(res.sites || []);
    } catch {
      // fallback
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const districtOptions = useMemo(
    () => [...new Set(sites.map((s) => s.district).filter(Boolean))].sort(),
    [sites]
  );

  const handleStatusChange = (newStatus: string) => {
    const p = new URLSearchParams(searchParams);
    if (newStatus === 'all') p.delete('status');
    else p.set('status', newStatus);
    setSearchParams(p);
  };

  const handleDistrictChange = (newDistrict: string) => {
    const p = new URLSearchParams(searchParams);
    if (newDistrict === 'all') p.delete('district');
    else p.set('district', newDistrict);
    setSearchParams(p);
  };

  const filteredSites = useMemo(() => {
    return sites.filter((site) => {
      if (rawDistrict !== 'all' && (site.district || '').toLowerCase() !== rawDistrict.toLowerCase()) {
        return false;
      }

      if (rawStatus === 'verify-approved' && Number(site.verify_status) !== 1) return false;
      if (rawStatus === 'verify-pending' && Number(site.verify_status ?? 0) !== 0) return false;
      if (rawStatus === 'verify-reject' && Number(site.verify_status) !== 2) return false;
      if (rawStatus === 'doc-approved' && Number(site.doc_verify_status) !== 2) return false;
      if (rawStatus === 'doc-pending' && Number(site.doc_verify_status ?? 0) > 1) return false;

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      return (
        String(site.id).includes(q) ||
        (site.f_farmer_name || '').toLowerCase().includes(q) ||
        (site.f_farmer_id || '').toLowerCase().includes(q) ||
        (site.district || '').toLowerCase().includes(q) ||
        (site.vendor_name || '').toLowerCase().includes(q)
      );
    });
  }, [sites, rawStatus, rawDistrict, searchQuery]);

  const pagination = usePagination({
    totalItems: filteredSites.length,
    initialPageSize: 10,
  });

  const pagedSites = useMemo(() => {
    const start = (pagination.currentPage - 1) * pagination.pageSize;
    return filteredSites.slice(start, start + pagination.pageSize);
  }, [filteredSites, pagination.currentPage, pagination.pageSize]);

  const exportColumns: ExportColumn[] = useMemo(
    () => [
      { key: 'id', header: 'Site ID' },
      { key: 'vendor_name', header: 'Contractor Vendor' },
      { key: 'f_farmer_name', header: 'Farmer Name' },
      { key: 'f_farmer_id', header: 'Farmer ID' },
      { key: 'contact_no', header: 'Contact' },
      { key: 'district', header: 'District' },
      { key: 'block', header: 'Block' },
      { key: 'pump_capacity', header: 'Capacity' },
      { key: 'verify_status', header: 'Audit Status' },
    ],
    []
  );

  return (
    <div className="solar-erp-page ax-page">
      <style>{PAGE_CSS}</style>
      <style>{OVERLAY_CSS}</style>

      {/* Page Header */}
      <PageHead
        eyebrow="Super Admin · Vendor Management"
        title="Jammu SWP Installation Status Details"
        subtitle="Field installation progress, equipment serial verification, and farmer commissioning logs across Jammu & Kashmir."
      />

      {/* Breadcrumbs */}
      <nav aria-label="Breadcrumb" style={{ marginBottom: 16 }}>
        <ol className="ax-breadcrumb" style={{ display: 'flex', gap: 6, listStyle: 'none', padding: 0, margin: 0, fontSize: 13, color: 'var(--ax-text-muted)' }}>
          <li><Link to="/vendor-management" style={{ color: '#2563eb' }}>Home</Link></li>
          <li>/</li>
          <li><Link to="/vendor-management" style={{ color: '#2563eb' }}>Vendor Management</Link></li>
          <li>/</li>
          <li><Link to="/vendor-management/jammu" style={{ color: '#2563eb' }}>Jammu</Link></li>
          <li>/</li>
          <li><Link to="/vendor-management/jammu/installation/swp/dashboard" style={{ color: '#2563eb' }}>SWP Installation</Link></li>
          <li>/</li>
          <li style={{ color: 'var(--ax-text-strong)', fontWeight: 600 }}>Status View</li>
        </ol>
      </nav>

      {/* 4 KPI Cards */}
      <div className="asw-cards-row">
        <div className="ax-card" style={{ padding: '14px 18px', borderRadius: 12, background: '#ffffff', border: '1px solid #e2e8f0' }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: '#64748b' }}>Filtered Sites</span>
          <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#0f172a' }}>{filteredSites.length}</div>
          <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>In active selection</div>
        </div>
        <div className="ax-card" style={{ padding: '14px 18px', borderRadius: 12, background: '#ffffff', border: '1px solid #e2e8f0' }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: '#64748b' }}>Selected Status</span>
          <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#2563eb', textTransform: 'capitalize' }}>{rawStatus}</div>
          <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>Workflow filter</div>
        </div>
        <div className="ax-card" style={{ padding: '14px 18px', borderRadius: 12, background: '#ffffff', border: '1px solid #e2e8f0' }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: '#64748b' }}>Selected District</span>
          <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#10b981' }}>{rawDistrict === 'all' ? 'All Districts' : rawDistrict}</div>
          <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>Regional boundary</div>
        </div>
        <div className="ax-card" style={{ padding: '14px 18px', borderRadius: 12, background: '#ffffff', border: '1px solid #e2e8f0' }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: '#64748b' }}>Total Master Records</span>
          <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#0f172a' }}>{sites.length}</div>
          <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>Installed sites</div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="ax-card" style={{ borderRadius: 12, background: '#ffffff', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <div className="ax-card__header" style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0' }}>
          <div className="ax-card__titles">
            <h3 className="ax-card__title" style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0 }}>
              Installation Status Register
            </h3>
            <p className="ax-card__subtitle" style={{ fontSize: 12, color: '#64748b', margin: '2px 0 0' }}>
              Showing {filteredSites.length} sites in UT Jammu & Kashmir
            </p>
          </div>

          <div className="ax-card__actions">
            <div className="ax-cluster">
              <select
                value={rawStatus}
                onChange={(e) => handleStatusChange(e.target.value)}
                className="ax-form-control"
                style={{ padding: '6px 12px', fontSize: 12, borderRadius: 6, border: '1px solid #cbd5e1' }}
              >
                <option value="all">All Stages</option>
                <option value="verify-approved">Audit Approved</option>
                <option value="verify-pending">Audit Pending</option>
                <option value="verify-reject">Audit Rejected</option>
                <option value="doc-approved">HOC Approved</option>
                <option value="doc-pending">HOC Pending</option>
              </select>

              <select
                value={rawDistrict}
                onChange={(e) => handleDistrictChange(e.target.value)}
                className="ax-form-control"
                style={{ padding: '6px 12px', fontSize: 12, borderRadius: 6, border: '1px solid #cbd5e1' }}
              >
                <option value="all">All Districts ({districtOptions.length})</option>
                {districtOptions.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>

              <SearchInput
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Search farmer, ID..."
              />

              <TableExportToolbar
                data={filteredSites}
                columns={exportColumns}
                filename="Jammu_SWP_Status_View"
              />
            </div>
          </div>
        </div>

        <div className="ax-table-wrap">
          <table className="ax-table ax-table--hover" style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0', color: '#475569', fontWeight: 700, textAlign: 'left' }}>
                <th style={{ padding: '12px 16px' }}>Site ID</th>
                <th style={{ padding: '12px 14px' }}>Vendor</th>
                <th style={{ padding: '12px 14px' }}>Farmer Details</th>
                <th style={{ padding: '12px 14px' }}>Location</th>
                <th style={{ padding: '12px 14px' }}>Capacity</th>
                <th style={{ padding: '12px 14px', textAlign: 'center' }}>Audit Status</th>
                <th style={{ padding: '12px 14px', textAlign: 'center' }}>HOC Doc</th>
                <th style={{ padding: '12px 16px', textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} style={centerCell}>Loading status records...</td>
                </tr>
              ) : pagedSites.length === 0 ? (
                <tr>
                  <td colSpan={8} style={centerCell}>
                    <TableEmptyState message="No sites found matching criteria." />
                  </td>
                </tr>
              ) : (
                pagedSites.map((site) => (
                  <tr key={site.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '12px 16px', fontWeight: 600, color: '#2563eb' }}>
                      #{site.id}
                    </td>
                    <td style={{ padding: '12px 14px', fontWeight: 600, color: '#0f172a' }}>
                      {site.vendor_name || DASH}
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ fontWeight: 700, color: '#0f172a' }}>{site.f_farmer_name}</div>
                      <div style={{ fontSize: 11, color: '#64748b' }}>ID: {site.f_farmer_id || DASH}</div>
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ fontWeight: 600, color: '#334155' }}>{site.district}</div>
                      <div style={{ fontSize: 11, color: '#64748b' }}>{site.block || DASH}</div>
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: '#10b981', background: '#ecfdf5', padding: '2px 8px', borderRadius: 4 }}>
                        {site.pump_capacity || '5.0 HP'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                      <VerifyBadge value={Number(site.verify_status ?? 0)} />
                    </td>
                    <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                      <DocBadge status={site.doc_verify_status} />
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                      <button
                        type="button"
                        className="ax-btn ax-btn--ghost ax-btn--sm"
                        onClick={() => { setSelectedSite(site); setDetailModalOpen(true); }}
                        style={{ padding: '4px 8px', fontSize: 11, color: '#2563eb' }}
                      >
                        Details
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="ax-card__footer" style={footerStyle}>
          <div className="ula-pagination-left">
            <Pagination
              currentPage={pagination.currentPage}
              totalPages={pagination.totalPages}
              onPageChange={pagination.setCurrentPage}
            />
          </div>
        </div>
      </div>

      {/* Details Modal */}
      {detailModalOpen && selectedSite && (
        <div className="ax-modal" role="dialog" aria-modal="true">
          <div className="ax-modal__backdrop" onClick={() => setDetailModalOpen(false)} />
          <div className="ax-modal__dialog" style={{ maxWidth: 600, width: '92%' }}>
            <div className="ax-modal__header">
              <div>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#0f172a' }}>
                  Site #{selectedSite.id} Details
                </h3>
                <p style={{ margin: '2px 0 0', fontSize: 12, color: '#64748b' }}>
                  {selectedSite.f_farmer_name} ({selectedSite.district})
                </p>
              </div>
              <button type="button" className="ax-modal__close" onClick={() => setDetailModalOpen(false)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ width: 16, height: 16 }}>
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="ax-modal__body">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 14 }}>
                <div>
                  <span style={{ fontSize: 11, color: '#64748b' }}>Farmer Name</span>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{selectedSite.f_farmer_name}</div>
                </div>
                <div>
                  <span style={{ fontSize: 11, color: '#64748b' }}>Farmer ID</span>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#2563eb' }}>{selectedSite.f_farmer_id || DASH}</div>
                </div>
                <div>
                  <span style={{ fontSize: 11, color: '#64748b' }}>District & Block</span>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{selectedSite.district}, {selectedSite.block || DASH}</div>
                </div>
                <div>
                  <span style={{ fontSize: 11, color: '#64748b' }}>Contact Phone</span>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{selectedSite.contact_no || DASH}</div>
                </div>
                <div>
                  <span style={{ fontSize: 11, color: '#64748b' }}>Pump Rating</span>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#10b981' }}>{selectedSite.pump_capacity || '5.0 HP'}</div>
                </div>
                <div>
                  <span style={{ fontSize: 11, color: '#64748b' }}>Contractor Vendor</span>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{selectedSite.vendor_name || DASH}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default StatusView;
