import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { PageHead } from '../../../../shell/PageHead';
import {
  INITIAL_ASSIGN_DATA,
  UP_DISTRICTS,
  UP_KUSUM_C_VENDORS,
  type UPKusumCAssignRecord,
  type UPFarmerInfo,
} from './upKusumCTypes';

export function UPKusumCViewAssignInstallation() {
  const [data] = useState<UPKusumCAssignRecord[]>(INITIAL_ASSIGN_DATA);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedVendor, setSelectedVendor] = useState<string>('');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [selectedRecord, setSelectedRecord] = useState<UPKusumCAssignRecord | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  // Filtered Data
  const filteredData = useMemo(() => {
    return data.filter((item) => {
      const q = searchTerm.toLowerCase();
      const matchesSearch =
        !q ||
        item.vendor.toLowerCase().includes(q) ||
        item.district.toLowerCase().includes(q) ||
        item.applicant_name.toLowerCase().includes(q) ||
        (item.remarks || '').toLowerCase().includes(q);

      const matchesVendor = !selectedVendor || item.vendor === selectedVendor;
      const matchesDistrict = !selectedDistrict || item.district === selectedDistrict;
      const matchesStatus = !selectedStatus || item.status === selectedStatus;

      return matchesSearch && matchesVendor && matchesDistrict && matchesStatus;
    });
  }, [data, searchTerm, selectedVendor, selectedDistrict, selectedStatus]);

  // Pagination calculation
  const totalItems = filteredData.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const pagedData = filteredData.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const resetFilters = () => {
    setSearchTerm('');
    setSelectedVendor('');
    setSelectedDistrict('');
    setSelectedStatus('');
    setCurrentPage(1);
  };

  const handleExportCSV = () => {
    const headers = ['Sr. No.', 'Vendor', 'Assign Date', 'State', 'District', 'Applicant Name', 'Deadline', 'Count', 'Remarks', 'Status'];
    const rows = filteredData.map((item, idx) => [
      idx + 1,
      `"${item.vendor}"`,
      `"${item.assign_date}"`,
      `"${item.state}"`,
      `"${item.district}"`,
      `"${item.applicant_name}"`,
      `"${item.deadline_date}"`,
      item.site_count,
      `"${item.remarks || ''}"`,
      `"${item.status}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `UP_Kusum_C_Assigned_Installations_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="ax-page" style={{ maxWidth: 1400, margin: '0 auto', paddingBottom: 40 }}>
      {/* Page Head */}
      <PageHead
        title="View Assign UP Kusum-C Installation"
        subtitle="Manage assigned vendor work orders, view farmer allocations, and authorize dispatches"
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Vendor Management', href: '/vendor-management' },
          { label: 'Uttar Pradesh', href: '/vendor-management/up' },
          { label: 'Kusum C', href: '/vendor-management/up/kusumc/installation/dashboard' },
          { label: 'View Assign UP Kusum-C Installation' },
        ]}
        actions={
          <Link
            to="/vendor-management/up/kusumc/installation/assign"
            className="ax-btn ax-btn--primary ax-btn--sm"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ marginRight: 6 }}
            >
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Assign Installation
          </Link>
        }
      />

      {/* KPI Stat Cards (Matching Specification) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 16,
          marginBottom: 20,
        }}
      >
        {/* Total Metric Card */}
        <div
          className="ax-card"
          style={{
            padding: '16px 20px',
            borderLeft: '4px solid #3b82f6',
            background: 'var(--ax-surface-solid, #ffffff)',
          }}
        >
          <div style={{ fontSize: 12, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Total Allocation
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#1e293b', marginTop: 4 }}>
            310 <span style={{ fontSize: 13, fontWeight: 500, color: '#64748b' }}>/ 1 / 1 / 308</span>
          </div>
          <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>
            Total / Assign / Accept / Not Assigned
          </div>
        </div>

        {/* Installation Status Metric Card */}
        <div
          className="ax-card"
          style={{
            padding: '16px 20px',
            borderLeft: '4px solid #10b981',
            background: 'var(--ax-surface-solid, #ffffff)',
          }}
        >
          <div style={{ fontSize: 12, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Installation Status
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#1e293b', marginTop: 4 }}>
            0 <span style={{ fontSize: 13, fontWeight: 500, color: '#64748b' }}>/ 1</span>
          </div>
          <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>
            Complete / Pending
          </div>
        </div>

        {/* Verify Status Metric Card */}
        <div
          className="ax-card"
          style={{
            padding: '16px 20px',
            borderLeft: '4px solid #f59e0b',
            background: 'var(--ax-surface-solid, #ffffff)',
          }}
        >
          <div style={{ fontSize: 12, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Verify Status
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#1e293b', marginTop: 4 }}>
            0 <span style={{ fontSize: 13, fontWeight: 500, color: '#64748b' }}>/ 1 / 0</span>
          </div>
          <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>
            Complete / Pending / Reject
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="ax-card" style={{ overflow: 'hidden' }}>
        {/* Table Header / Toolbar */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--ax-border, #e2e8f0)',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            background: 'var(--ax-surface-subtle, #f8fafc)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, color: '#0f172a' }}>
              View Assign UP Kusum-C Installation
            </h3>
            <span className="ax-badge ax-badge--soft ax-badge--info" style={{ fontWeight: 600 }}>
              {filteredData.length} Records
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <button
              type="button"
              className="ax-btn ax-btn--secondary ax-btn--sm"
              onClick={handleExportCSV}
              title="Export as CSV"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 5 }}>
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              CSV
            </button>
            <button
              type="button"
              className="ax-btn ax-btn--secondary ax-btn--sm"
              onClick={() => window.print()}
              title="Print Table"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 5 }}>
                <polyline points="6 9 6 2 18 2 18 9" />
                <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                <rect x="6" y="14" width="12" height="8" />
              </svg>
              Print
            </button>
          </div>
        </div>

        {/* Filters Bar */}
        <div
          style={{
            padding: '12px 20px',
            borderBottom: '1px solid var(--ax-border, #e2e8f0)',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: 12,
            background: '#ffffff',
          }}
        >
          {/* Search */}
          <div style={{ flex: '1 1 220px', minWidth: 200, position: 'relative' }}>
            <input
              type="text"
              className="ax-form-input"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search: vendor, district, applicant, remarks..."
              style={{
                width: '100%',
                padding: '7px 12px',
                fontSize: 13,
                borderRadius: 6,
                border: '1px solid #cbd5e1',
              }}
            />
          </div>

          {/* Vendor Filter */}
          <div style={{ minWidth: 160 }}>
            <select
              className="ax-form-input"
              value={selectedVendor}
              onChange={(e) => {
                setSelectedVendor(e.target.value);
                setCurrentPage(1);
              }}
              style={{ width: '100%', padding: '7px 10px', fontSize: 13, borderRadius: 6, border: '1px solid #cbd5e1' }}
            >
              <option value="">-- All Vendors --</option>
              {UP_KUSUM_C_VENDORS.map((v) => (
                <option key={v.id} value={v.name}>
                  {v.name}
                </option>
              ))}
            </select>
          </div>

          {/* District Filter */}
          <div style={{ minWidth: 160 }}>
            <select
              className="ax-form-input"
              value={selectedDistrict}
              onChange={(e) => {
                setSelectedDistrict(e.target.value);
                setCurrentPage(1);
              }}
              style={{ width: '100%', padding: '7px 10px', fontSize: 13, borderRadius: 6, border: '1px solid #cbd5e1' }}
            >
              <option value="">-- All Districts --</option>
              {UP_DISTRICTS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div style={{ minWidth: 140 }}>
            <select
              className="ax-form-input"
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setCurrentPage(1);
              }}
              style={{ width: '100%', padding: '7px 10px', fontSize: 13, borderRadius: 6, border: '1px solid #cbd5e1' }}
            >
              <option value="">-- All Status --</option>
              <option value="Assigned">Assigned</option>
              <option value="Accepted">Accepted</option>
              <option value="Pending">Pending</option>
              <option value="Completed">Completed</option>
            </select>
          </div>

          {(searchTerm || selectedVendor || selectedDistrict || selectedStatus) && (
            <button
              type="button"
              className="ax-btn ax-btn--ghost ax-btn--sm"
              onClick={resetFilters}
              style={{ color: '#ef4444' }}
            >
              Reset
            </button>
          )}
        </div>

        {/* Table Body */}
        <div style={{ overflowX: 'auto' }}>
          <table className="ax-table ax-table--hover" style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
            <thead style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              <tr>
                <th style={{ padding: '10px 12px', textAlign: 'center', width: 60, fontWeight: 600, color: '#475569' }}>Sr. No.</th>
                <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600, color: '#475569' }}>Vendor</th>
                <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600, color: '#475569' }}>Assign Date</th>
                <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600, color: '#475569' }}>State</th>
                <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600, color: '#475569' }}>District</th>
                <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600, color: '#475569' }}>Applicant Name - Deadline</th>
                <th style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 600, color: '#475569' }}>Count</th>
                <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600, color: '#475569' }}>File</th>
                <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600, color: '#475569' }}>Remarks</th>
                <th style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 600, color: '#475569' }}>Status</th>
                <th style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 600, color: '#475569' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {pagedData.length === 0 ? (
                <tr>
                  <td colSpan={11} style={{ textAlign: 'center', padding: '36px 20px', color: '#64748b' }}>
                    No assignment records match your filter criteria.
                  </td>
                </tr>
              ) : (
                pagedData.map((item, idx) => {
                  const srNo = (currentPage - 1) * pageSize + idx + 1;
                  return (
                    <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '10px 12px', textAlign: 'center', color: '#64748b', fontWeight: 500 }}>
                        {srNo}
                      </td>
                      <td style={{ padding: '10px 12px', fontWeight: 600, color: '#0f172a' }}>
                        {item.vendor}
                      </td>
                      <td style={{ padding: '10px 12px', color: '#334155' }}>
                        {item.assign_date}
                      </td>
                      <td style={{ padding: '10px 12px', color: '#334155', textTransform: 'uppercase' }}>
                        {item.state}
                      </td>
                      <td style={{ padding: '10px 12px', color: '#334155' }}>
                        {item.district}
                      </td>
                      <td style={{ padding: '10px 12px' }}>
                        <div style={{ fontWeight: 600, color: '#1e293b' }}>{item.applicant_name}</div>
                        <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
                          Deadline: <span style={{ color: '#ef4444', fontWeight: 500 }}>{item.deadline_date}</span>
                        </div>
                      </td>
                      <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: 26,
                            height: 26,
                            borderRadius: '50%',
                            background: '#eff6ff',
                            color: '#2563eb',
                            fontWeight: 700,
                            fontSize: 12,
                          }}
                        >
                          {item.site_count}
                        </span>
                      </td>
                      <td style={{ padding: '10px 12px' }}>
                        {item.file ? (
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                              color: '#2563eb',
                              fontSize: 12,
                              cursor: 'pointer',
                              textDecoration: 'underline',
                            }}
                            title={item.file}
                          >
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                              <polyline points="14 2 14 8 20 8" />
                            </svg>
                            WO Document
                          </span>
                        ) : (
                          <span style={{ color: '#94a3b8' }}>—</span>
                        )}
                      </td>
                      <td style={{ padding: '10px 12px', color: '#64748b', maxWidth: 180, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {item.remarks || '—'}
                      </td>
                      <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                        <span
                          className={`ax-badge ${
                            item.status === 'Accepted'
                              ? 'ax-badge--soft ax-badge--success'
                              : item.status === 'Assigned'
                              ? 'ax-badge--soft ax-badge--info'
                              : 'ax-badge--soft ax-badge--warning'
                          }`}
                          style={{ fontWeight: 600, fontSize: 11, padding: '3px 8px' }}
                        >
                          {item.status}
                        </span>
                      </td>
                      <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                        <button
                          type="button"
                          className="ax-btn ax-btn--secondary ax-btn--sm"
                          onClick={() => setSelectedRecord(item)}
                          style={{ fontSize: 11, padding: '4px 8px' }}
                          title="View Farmer & Equipment Details"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div
          style={{
            padding: '12px 20px',
            borderTop: '1px solid var(--ax-border, #e2e8f0)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 12,
            background: 'var(--ax-surface-subtle, #f8fafc)',
            fontSize: 12.5,
            color: '#64748b',
          }}
        >
          <div>
            Showing {totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1} to{' '}
            {Math.min(currentPage * pageSize, totalItems)} of {totalItems} entries
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span>Show</span>
              <select
                className="ax-form-input"
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                style={{ padding: '3px 6px', fontSize: 12, borderRadius: 4 }}
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
              <span>entries</span>
            </div>

            <div style={{ display: 'flex', gap: 4 }}>
              <button
                type="button"
                className="ax-btn ax-btn--secondary ax-btn--sm"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                style={{ padding: '3px 8px', fontSize: 11 }}
              >
                Previous
              </button>
              <span style={{ padding: '4px 8px', fontWeight: 600, color: '#1e293b' }}>
                {currentPage} / {totalPages}
              </span>
              <button
                type="button"
                className="ax-btn ax-btn--secondary ax-btn--sm"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                style={{ padding: '3px 8px', fontSize: 11 }}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Farmer Info Nested Detail Modal (Matching Specification) ── */}
      {selectedRecord && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(3px)',
            zIndex: 1050,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
          }}
          onClick={() => setSelectedRecord(null)}
        >
          <div
            className="ax-card"
            style={{
              width: '100%',
              maxWidth: 900,
              maxHeight: '85vh',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: '16px 20px',
                borderBottom: '1px solid #e2e8f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: '#f8fafc',
              }}
            >
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, color: '#0f172a' }}>
                  Farmer Info & Equipment Status
                </h3>
                <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                  Vendor: <strong>{selectedRecord.vendor}</strong> · District: <strong>{selectedRecord.district}</strong> · Assign Date: <strong>{selectedRecord.assign_date}</strong>
                </div>
              </div>
              <button
                type="button"
                className="ax-btn ax-btn--ghost ax-btn--sm"
                onClick={() => setSelectedRecord(null)}
                style={{ fontSize: 18, lineHeight: 1 }}
              >
                ×
              </button>
            </div>

            {/* Modal Content Table */}
            <div style={{ padding: 20, overflowY: 'auto' }}>
              <table className="ax-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead style={{ background: '#f1f5f9', borderBottom: '1px solid #cbd5e1' }}>
                  <tr>
                    <th style={{ padding: '8px 10px', textAlign: 'center', width: 50 }}>Sr. No.</th>
                    <th style={{ padding: '8px 10px', textAlign: 'left' }}>Farmer Info</th>
                    <th style={{ padding: '8px 10px', textAlign: 'center' }}>BOS</th>
                    <th style={{ padding: '8px 10px', textAlign: 'center' }}>VFD</th>
                    <th style={{ padding: '8px 10px', textAlign: 'center' }}>Inverter</th>
                    <th style={{ padding: '8px 10px', textAlign: 'center' }}>Structure</th>
                    <th style={{ padding: '8px 10px', textAlign: 'center' }}>Action / Image</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedRecord.farmers && selectedRecord.farmers.length > 0 ? (
                    selectedRecord.farmers.map((farmer: UPFarmerInfo, fIdx: number) => (
                      <tr key={farmer.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '10px', textAlign: 'center', color: '#64748b' }}>
                          {fIdx + 1}
                        </td>
                        <td style={{ padding: '10px' }}>
                          <div style={{ fontWeight: 700, color: '#0f172a' }}>{farmer.farmer_name}</div>
                          {farmer.contact && (
                            <div style={{ fontSize: 11, color: '#64748b' }}>Contact: {farmer.contact}</div>
                          )}
                          <div style={{ fontSize: 11, color: '#64748b' }}>
                            {farmer.village ? `${farmer.village}, ` : ''}{farmer.block ? `${farmer.block}` : ''}
                          </div>
                          <div style={{ fontSize: 11, color: '#ef4444', fontWeight: 500, marginTop: 2 }}>
                            Deadline: {farmer.deadline_date}
                          </div>
                        </td>
                        <td style={{ padding: '10px', textAlign: 'center' }}>
                          <span
                            className={`ax-badge ${farmer.bos === 'Yes' ? 'ax-badge--soft ax-badge--success' : 'ax-badge--soft ax-badge--danger'}`}
                            style={{ fontSize: 11, padding: '2px 8px' }}
                          >
                            {farmer.bos}
                          </span>
                        </td>
                        <td style={{ padding: '10px', textAlign: 'center' }}>
                          <span
                            className={`ax-badge ${farmer.vfd === 'Yes' ? 'ax-badge--soft ax-badge--success' : 'ax-badge--soft ax-badge--danger'}`}
                            style={{ fontSize: 11, padding: '2px 8px' }}
                          >
                            {farmer.vfd}
                          </span>
                        </td>
                        <td style={{ padding: '10px', textAlign: 'center' }}>
                          <span
                            className={`ax-badge ${farmer.inverter === 'Yes' ? 'ax-badge--soft ax-badge--success' : 'ax-badge--soft ax-badge--danger'}`}
                            style={{ fontSize: 11, padding: '2px 8px' }}
                          >
                            {farmer.inverter}
                          </span>
                        </td>
                        <td style={{ padding: '10px', textAlign: 'center' }}>
                          <span
                            className={`ax-badge ${farmer.structure === 'Yes' ? 'ax-badge--soft ax-badge--success' : 'ax-badge--soft ax-badge--danger'}`}
                            style={{ fontSize: 11, padding: '2px 8px' }}
                          >
                            {farmer.structure}
                          </span>
                        </td>
                        <td style={{ padding: '10px', textAlign: 'center' }}>
                          {farmer.image ? (
                            <button
                              type="button"
                              className="ax-btn ax-btn--secondary ax-btn--sm"
                              onClick={() => setPreviewImage(farmer.image || null)}
                              style={{ fontSize: 11, padding: '3px 8px', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                            >
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                                <circle cx="8.5" cy="8.5" r="1.5" />
                                <polyline points="21 15 16 10 5 21" />
                              </svg>
                              Image
                            </button>
                          ) : (
                            <span style={{ fontSize: 11, color: '#94a3b8' }}>testing</span>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} style={{ textAlign: 'center', padding: 20, color: '#64748b' }}>
                        No individual farmer data registered for this work order.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Modal Footer */}
            <div
              style={{
                padding: '12px 20px',
                borderTop: '1px solid #e2e8f0',
                display: 'flex',
                justifyContent: 'flex-end',
                background: '#f8fafc',
              }}
            >
              <button
                type="button"
                className="ax-btn ax-btn--secondary"
                onClick={() => setSelectedRecord(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Image Preview Modal ── */}
      {previewImage && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.85)',
            zIndex: 1100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
          }}
          onClick={() => setPreviewImage(null)}
        >
          <div style={{ position: 'relative', maxWidth: '90vw', maxHeight: '90vh' }}>
            <img
              src={previewImage}
              alt="Site Preview"
              style={{ maxWidth: '100%', maxHeight: '85vh', borderRadius: 8, objectFit: 'contain' }}
            />
            <button
              type="button"
              onClick={() => setPreviewImage(null)}
              style={{
                position: 'absolute',
                top: -36,
                right: 0,
                background: 'none',
                border: 'none',
                color: '#ffffff',
                fontSize: 26,
                cursor: 'pointer',
              }}
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Footer copyright */}
    </div>
  );
}

export default UPKusumCViewAssignInstallation;
