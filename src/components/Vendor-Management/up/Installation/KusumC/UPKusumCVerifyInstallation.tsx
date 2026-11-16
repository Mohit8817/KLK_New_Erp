import { useState, useMemo } from 'react';
import { PageHead } from '../../../../shell/PageHead';
import {
  INITIAL_INSTALLATION_DATA,
  UP_DISTRICTS,
  UP_KUSUM_C_VENDORS,
  type UPKusumCInstallationRecord,
} from './upKusumCTypes';

export function UPKusumCVerifyInstallation() {
  const [data, setData] = useState<UPKusumCInstallationRecord[]>(INITIAL_INSTALLATION_DATA);
  const [activeTab, setActiveTab] = useState<'pending' | 'approved_rejected'>('pending');

  // Filters
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedVendor, setSelectedVendor] = useState<string>('');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('');

  // Pagination
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  // Verification Modal State
  const [verifyModalItem, setVerifyModalItem] = useState<UPKusumCInstallationRecord | null>(null);
  const [verifyAction, setVerifyAction] = useState<'Approved' | 'Rejected'>('Approved');
  const [verifyRemarksInput, setVerifyRemarksInput] = useState<string>('');
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Image Modal
  const [previewImage, setPreviewImage] = useState<{ url: string; title: string } | null>(null);

  // Counts
  const pendingCount = data.filter((item) => item.verify_status === 'Pending').length;
  const approvedCount = data.filter((item) => item.verify_status === 'Approved').length;
  const rejectedCount = data.filter((item) => item.verify_status === 'Rejected').length;
  const totalCompleted = approvedCount + rejectedCount;

  // Filtered rows
  const filteredData = useMemo(() => {
    return data.filter((item) => {
      // Tab filter
      if (activeTab === 'pending' && item.verify_status !== 'Pending') return false;
      if (activeTab === 'approved_rejected' && item.verify_status === 'Pending') return false;

      const q = searchTerm.toLowerCase();
      const matchesSearch =
        !q ||
        item.vendor_name.toLowerCase().includes(q) ||
        item.district.toLowerCase().includes(q) ||
        item.block.toLowerCase().includes(q) ||
        item.village.toLowerCase().includes(q) ||
        item.applicant_name.toLowerCase().includes(q) ||
        item.vfd_no.toLowerCase().includes(q) ||
        item.inverter_no.toLowerCase().includes(q) ||
        item.module_serial_no.toLowerCase().includes(q) ||
        (item.remarks || '').toLowerCase().includes(q);

      const matchesVendor = !selectedVendor || item.vendor_name === selectedVendor;
      const matchesDistrict = !selectedDistrict || item.district === selectedDistrict;

      return matchesSearch && matchesVendor && matchesDistrict;
    });
  }, [data, activeTab, searchTerm, selectedVendor, selectedDistrict]);

  // Pagination slice
  const totalItems = filteredData.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const pagedData = filteredData.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleOpenVerifyModal = (item: UPKusumCInstallationRecord) => {
    setVerifyModalItem(item);
    setVerifyAction('Approved');
    setVerifyRemarksInput('');
  };

  const handleConfirmVerification = () => {
    if (!verifyModalItem) return;
    setIsVerifying(true);

    setTimeout(() => {
      setData((prev) =>
        prev.map((rec) =>
          rec.id === verifyModalItem.id
            ? {
                ...rec,
                verify_status: verifyAction,
                verify_date: new Date().toISOString().slice(0, 10),
                verify_by: 'Super Admin',
                verify_remarks: verifyRemarksInput || (verifyAction === 'Approved' ? 'Verified and approved' : 'Rejected due to discrepancies'),
              }
            : rec
        )
      );

      setIsVerifying(false);
      setToastMsg(`Installation for ${verifyModalItem.applicant_name} marked as ${verifyAction}!`);
      setVerifyModalItem(null);
      setTimeout(() => setToastMsg(null), 3000);
    }, 500);
  };

  const handleExportCSV = () => {
    const headers = [
      'Sr. No.',
      'Vendor Name',
      'State',
      'District',
      'Block',
      'Village',
      'Applicant Name',
      'VFD No.',
      'Inverter No.',
      'Module Serial No.',
      'Remarks',
      'Verify Status',
      'Verify Date',
      'Verify By',
      'Verify Remarks',
    ];

    const rows = filteredData.map((item, idx) => [
      idx + 1,
      `"${item.vendor_name}"`,
      `"${item.state}"`,
      `"${item.district}"`,
      `"${item.block}"`,
      `"${item.village}"`,
      `"${item.applicant_name}"`,
      `"${item.vfd_no}"`,
      `"${item.inverter_no}"`,
      `"${item.module_serial_no}"`,
      `"${item.remarks || ''}"`,
      `"${item.verify_status}"`,
      `"${item.verify_date || ''}"`,
      `"${item.verify_by || ''}"`,
      `"${item.verify_remarks || ''}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `UP_Kusum_C_Installation_${activeTab}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="ax-page" style={{ maxWidth: 1400, margin: '0 auto', paddingBottom: 40 }}>
      {/* Page Head */}
      <PageHead
        title="Verify Kusum-C Installation"
        subtitle="Review vendor proof of installations, inspect geo-tagged module photos, VFD, inverter, and running water discharge"
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Vendor Management', href: '/vendor-management' },
          { label: 'Uttar Pradesh', href: '/vendor-management/up' },
          { label: 'Kusum C', href: '/vendor-management/up/kusumc/installation/dashboard' },
          { label: 'Verify Kusum-C Installation' },
        ]}
      />

      {/* Toast Notification */}
      {toastMsg && (
        <div
          style={{
            padding: '12px 18px',
            background: '#ecfdf5',
            border: '1px solid #a7f3d0',
            color: '#065f46',
            borderRadius: 8,
            marginBottom: 16,
            fontSize: 13,
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span>✓ {toastMsg}</span>
          <button
            type="button"
            onClick={() => setToastMsg(null)}
            style={{ background: 'none', border: 'none', color: '#065f46', cursor: 'pointer', fontSize: 16 }}
          >
            ×
          </button>
        </div>
      )}

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
            Total Sites
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#1e293b', marginTop: 4 }}>
            329 <span style={{ fontSize: 13, fontWeight: 500, color: '#64748b' }}>/ 6 / 331</span>
          </div>
          <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>
            Total / Assigned / Not Assigned
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
            6 <span style={{ fontSize: 13, fontWeight: 500, color: '#64748b' }}>/ 0</span>
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
            {approvedCount} <span style={{ fontSize: 13, fontWeight: 500, color: '#64748b' }}>/ {pendingCount} / {rejectedCount}</span>
          </div>
          <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>
            Complete / Pending / Reject
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="ax-card" style={{ overflow: 'hidden' }}>
        {/* Report Wise Bifurcation Tabs */}
        <div
          style={{
            padding: '16px 20px 0 20px',
            borderBottom: '1px solid var(--ax-border, #e2e8f0)',
            background: 'var(--ax-surface-subtle, #f8fafc)',
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
            <div>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Report Wise Bifurcation
              </span>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                type="button"
                className="ax-btn ax-btn--secondary ax-btn--sm"
                onClick={handleExportCSV}
              >
                CSV Export
              </button>
              <button
                type="button"
                className="ax-btn ax-btn--secondary ax-btn--sm"
                onClick={() => window.print()}
              >
                Print
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type="button"
              onClick={() => {
                setActiveTab('pending');
                setCurrentPage(1);
              }}
              style={{
                padding: '8px 18px',
                border: 'none',
                background: 'transparent',
                borderBottom: activeTab === 'pending' ? '3px solid #2563eb' : '3px solid transparent',
                color: activeTab === 'pending' ? '#2563eb' : '#64748b',
                fontWeight: activeTab === 'pending' ? 700 : 500,
                fontSize: 13,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              Verification Pending
              <span
                style={{
                  background: activeTab === 'pending' ? '#eff6ff' : '#f1f5f9',
                  color: activeTab === 'pending' ? '#2563eb' : '#64748b',
                  padding: '2px 8px',
                  borderRadius: 12,
                  fontSize: 11,
                  fontWeight: 700,
                }}
              >
                {pendingCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('approved_rejected');
                setCurrentPage(1);
              }}
              style={{
                padding: '8px 18px',
                border: 'none',
                background: 'transparent',
                borderBottom: activeTab === 'approved_rejected' ? '3px solid #2563eb' : '3px solid transparent',
                color: activeTab === 'approved_rejected' ? '#2563eb' : '#64748b',
                fontWeight: activeTab === 'approved_rejected' ? 700 : 500,
                fontSize: 13,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              Approved/Rejected Data
              <span
                style={{
                  background: activeTab === 'approved_rejected' ? '#eff6ff' : '#f1f5f9',
                  color: activeTab === 'approved_rejected' ? '#2563eb' : '#64748b',
                  padding: '2px 8px',
                  borderRadius: 12,
                  fontSize: 11,
                  fontWeight: 700,
                }}
              >
                {totalCompleted}
              </span>
            </button>
          </div>
        </div>

        {/* Filters Toolbar */}
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
          <div style={{ flex: '1 1 240px', minWidth: 220 }}>
            <input
              type="text"
              className="ax-form-input"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search: vendor, applicant, VFD no., inverter, serial no..."
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

          {(searchTerm || selectedVendor || selectedDistrict) && (
            <button
              type="button"
              className="ax-btn ax-btn--ghost ax-btn--sm"
              onClick={() => {
                setSearchTerm('');
                setSelectedVendor('');
                setSelectedDistrict('');
                setCurrentPage(1);
              }}
              style={{ color: '#ef4444' }}
            >
              Reset
            </button>
          )}
        </div>

        {/* Table Content */}
        <div style={{ overflowX: 'auto' }}>
          <table className="ax-table ax-table--hover" style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              <tr>
                <th style={{ padding: '10px 10px', textAlign: 'center', width: 50, fontWeight: 600, color: '#475569' }}>Sr. No.</th>
                <th style={{ padding: '10px 10px', textAlign: 'left', fontWeight: 600, color: '#475569' }}>Vendor Name</th>
                <th style={{ padding: '10px 10px', textAlign: 'left', fontWeight: 600, color: '#475569' }}>State</th>
                <th style={{ padding: '10px 10px', textAlign: 'left', fontWeight: 600, color: '#475569' }}>District</th>
                <th style={{ padding: '10px 10px', textAlign: 'left', fontWeight: 600, color: '#475569' }}>Block</th>
                <th style={{ padding: '10px 10px', textAlign: 'left', fontWeight: 600, color: '#475569' }}>Village</th>
                <th style={{ padding: '10px 10px', textAlign: 'left', fontWeight: 600, color: '#475569' }}>Applicant Name</th>
                <th style={{ padding: '10px 10px', textAlign: 'left', fontWeight: 600, color: '#475569' }}>VFD No.</th>
                <th style={{ padding: '10px 10px', textAlign: 'left', fontWeight: 600, color: '#475569' }}>Inverter No.</th>
                <th style={{ padding: '10px 10px', textAlign: 'left', fontWeight: 600, color: '#475569' }}>Module Serial No.</th>
                <th style={{ padding: '10px 10px', textAlign: 'center', fontWeight: 600, color: '#475569' }}>Farmer With Module</th>
                <th style={{ padding: '10px 10px', textAlign: 'center', fontWeight: 600, color: '#475569' }}>Inverter & VFD</th>
                <th style={{ padding: '10px 10px', textAlign: 'center', fontWeight: 600, color: '#475569' }}>Running Water</th>
                <th style={{ padding: '10px 10px', textAlign: 'left', fontWeight: 600, color: '#475569' }}>Remarks</th>

                {activeTab === 'approved_rejected' && (
                  <>
                    <th style={{ padding: '10px 10px', textAlign: 'center', fontWeight: 600, color: '#475569' }}>Verify Status</th>
                    <th style={{ padding: '10px 10px', textAlign: 'left', fontWeight: 600, color: '#475569' }}>Verify Date</th>
                    <th style={{ padding: '10px 10px', textAlign: 'left', fontWeight: 600, color: '#475569' }}>Verify By</th>
                    <th style={{ padding: '10px 10px', textAlign: 'left', fontWeight: 600, color: '#475569' }}>Verify Remarks</th>
                  </>
                )}

                <th style={{ padding: '10px 10px', textAlign: 'center', fontWeight: 600, color: '#475569' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {pagedData.length === 0 ? (
                <tr>
                  <td colSpan={activeTab === 'approved_rejected' ? 19 : 15} style={{ textAlign: 'center', padding: '36px 20px', color: '#64748b' }}>
                    No installation records found for {activeTab === 'pending' ? 'Verification Pending' : 'Approved/Rejected Data'}.
                  </td>
                </tr>
              ) : (
                pagedData.map((item, idx) => {
                  const srNo = (currentPage - 1) * pageSize + idx + 1;
                  return (
                    <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '10px 10px', textAlign: 'center', color: '#64748b' }}>{srNo}</td>
                      <td style={{ padding: '10px 10px', fontWeight: 600, color: '#0f172a' }}>{item.vendor_name}</td>
                      <td style={{ padding: '10px 10px', textTransform: 'uppercase' }}>{item.state}</td>
                      <td style={{ padding: '10px 10px' }}>{item.district}</td>
                      <td style={{ padding: '10px 10px' }}>{item.block}</td>
                      <td style={{ padding: '10px 10px' }}>{item.village}</td>
                      <td style={{ padding: '10px 10px', fontWeight: 600, color: '#1e293b' }}>{item.applicant_name}</td>
                      <td style={{ padding: '10px 10px', fontFamily: 'monospace', fontSize: 11 }}>{item.vfd_no}</td>
                      <td style={{ padding: '10px 10px', fontFamily: 'monospace', fontSize: 11 }}>{item.inverter_no}</td>
                      <td style={{ padding: '10px 10px', fontFamily: 'monospace', fontSize: 11 }}>{item.module_serial_no}</td>

                      {/* Photo 1: Farmer with Module */}
                      <td style={{ padding: '10px 10px', textAlign: 'center' }}>
                        {item.farmer_with_module_img ? (
                          <img
                            src={item.farmer_with_module_img}
                            alt="Farmer Module"
                            onClick={() => setPreviewImage({ url: item.farmer_with_module_img!, title: `Farmer With Module - ${item.applicant_name}` })}
                            style={{ width: 36, height: 36, objectFit: 'cover', borderRadius: 4, cursor: 'pointer', border: '1px solid #cbd5e1' }}
                            title="Click to zoom"
                          />
                        ) : (
                          <span style={{ color: '#94a3b8' }}>—</span>
                        )}
                      </td>

                      {/* Photo 2: Inverter & VFD */}
                      <td style={{ padding: '10px 10px', textAlign: 'center' }}>
                        {item.inverter_vfd_farmer_img ? (
                          <img
                            src={item.inverter_vfd_farmer_img}
                            alt="Inverter & VFD"
                            onClick={() => setPreviewImage({ url: item.inverter_vfd_farmer_img!, title: `Inverter and VFD - ${item.applicant_name}` })}
                            style={{ width: 36, height: 36, objectFit: 'cover', borderRadius: 4, cursor: 'pointer', border: '1px solid #cbd5e1' }}
                            title="Click to zoom"
                          />
                        ) : (
                          <span style={{ color: '#94a3b8' }}>—</span>
                        )}
                      </td>

                      {/* Photo 3: Running Water */}
                      <td style={{ padding: '10px 10px', textAlign: 'center' }}>
                        {item.running_water_farmer_img ? (
                          <img
                            src={item.running_water_farmer_img}
                            alt="Running Water"
                            onClick={() => setPreviewImage({ url: item.running_water_farmer_img!, title: `Running Water Discharge - ${item.applicant_name}` })}
                            style={{ width: 36, height: 36, objectFit: 'cover', borderRadius: 4, cursor: 'pointer', border: '1px solid #cbd5e1' }}
                            title="Click to zoom"
                          />
                        ) : (
                          <span style={{ color: '#94a3b8' }}>—</span>
                        )}
                      </td>

                      <td style={{ padding: '10px 10px', color: '#64748b', maxWidth: 160, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {item.remarks || '—'}
                      </td>

                      {/* Tab 2 Columns */}
                      {activeTab === 'approved_rejected' && (
                        <>
                          <td style={{ padding: '10px 10px', textAlign: 'center' }}>
                            <span
                              className={`ax-badge ${
                                item.verify_status === 'Approved'
                                  ? 'ax-badge--soft ax-badge--success'
                                  : 'ax-badge--soft ax-badge--danger'
                              }`}
                              style={{ fontWeight: 600, fontSize: 11, padding: '2px 8px' }}
                            >
                              {item.verify_status}
                            </span>
                          </td>
                          <td style={{ padding: '10px 10px', color: '#334155' }}>{item.verify_date || '—'}</td>
                          <td style={{ padding: '10px 10px', color: '#334155' }}>{item.verify_by || '—'}</td>
                          <td style={{ padding: '10px 10px', color: '#64748b', maxWidth: 180, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {item.verify_remarks || '—'}
                          </td>
                        </>
                      )}

                      {/* Action Button */}
                      <td style={{ padding: '10px 10px', textAlign: 'center' }}>
                        {activeTab === 'pending' ? (
                          <button
                            type="button"
                            className="ax-btn ax-btn--primary ax-btn--sm"
                            onClick={() => handleOpenVerifyModal(item)}
                            style={{ fontSize: 11, padding: '4px 10px', fontWeight: 600 }}
                          >
                            Verify
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="ax-btn ax-btn--secondary ax-btn--sm"
                            disabled
                            style={{
                              fontSize: 11,
                              padding: '3px 8px',
                              opacity: 0.85,
                              cursor: 'not-allowed',
                              background: '#f1f5f9',
                              color: '#64748b',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                            }}
                            title="Verification Completed & Locked"
                          >
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                            </svg>
                            Locked
                          </button>
                        )}
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

      {/* ── Verification Action Modal ── */}
      {verifyModalItem && (
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
          onClick={() => setVerifyModalItem(null)}
        >
          <div
            className="ax-card"
            style={{
              width: '100%',
              maxWidth: 540,
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
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
                  Verify Kusum C Installation
                </h3>
                <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                  Applicant: <strong>{verifyModalItem.applicant_name}</strong> · {verifyModalItem.district}
                </div>
              </div>
              <button
                type="button"
                className="ax-btn ax-btn--ghost ax-btn--sm"
                onClick={() => setVerifyModalItem(null)}
                style={{ fontSize: 18, lineHeight: 1 }}
              >
                ×
              </button>
            </div>

            <div style={{ padding: 20 }}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#334155', display: 'block', marginBottom: 8 }}>
                  Verification Decision <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <div style={{ display: 'flex', gap: 16 }}>
                  <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 13, fontWeight: 500 }}>
                    <input
                      type="radio"
                      name="verifyAction"
                      checked={verifyAction === 'Approved'}
                      onChange={() => setVerifyAction('Approved')}
                    />
                    <span style={{ color: '#16a34a', fontWeight: 700 }}>Approve Installation</span>
                  </label>
                  <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 13, fontWeight: 500 }}>
                    <input
                      type="radio"
                      name="verifyAction"
                      checked={verifyAction === 'Rejected'}
                      onChange={() => setVerifyAction('Rejected')}
                    />
                    <span style={{ color: '#dc2626', fontWeight: 700 }}>Reject Installation</span>
                  </label>
                </div>
              </div>

              <div style={{ marginBottom: 12 }}>
                <label htmlFor="verifyRemarksInput" style={{ fontSize: 13, fontWeight: 600, color: '#334155', display: 'block', marginBottom: 6 }}>
                  Verification Remarks
                </label>
                <textarea
                  id="verifyRemarksInput"
                  className="ax-form-input"
                  rows={3}
                  value={verifyRemarksInput}
                  onChange={(e) => setVerifyRemarksInput(e.target.value)}
                  placeholder={
                    verifyAction === 'Approved'
                      ? 'e.g. Pump discharge and wiring inspected and approved.'
                      : 'e.g. Inverter serial number does not match documentation.'
                  }
                  style={{ width: '100%', padding: '8px 12px', fontSize: 13, borderRadius: 6, border: '1px solid #cbd5e1' }}
                />
              </div>
            </div>

            <div
              style={{
                padding: '12px 20px',
                borderTop: '1px solid #e2e8f0',
                display: 'flex',
                justifyContent: 'flex-end',
                gap: 10,
                background: '#f8fafc',
              }}
            >
              <button
                type="button"
                className="ax-btn ax-btn--secondary"
                onClick={() => setVerifyModalItem(null)}
                disabled={isVerifying}
              >
                Cancel
              </button>
              <button
                type="button"
                className={`ax-btn ${verifyAction === 'Approved' ? 'ax-btn--primary' : 'ax-btn--danger'}`}
                onClick={handleConfirmVerification}
                disabled={isVerifying}
                style={{ minWidth: 140, fontWeight: 700 }}
              >
                {isVerifying ? 'Saving...' : `Confirm ${verifyAction}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Image Viewer Zoom Modal ── */}
      {previewImage && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.85)',
            zIndex: 1100,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
          }}
          onClick={() => setPreviewImage(null)}
        >
          <div style={{ color: '#ffffff', fontSize: 14, fontWeight: 600, marginBottom: 10 }}>
            {previewImage.title}
          </div>
          <div style={{ position: 'relative', maxWidth: '90vw', maxHeight: '85vh' }}>
            <img
              src={previewImage.url}
              alt={previewImage.title}
              style={{ maxWidth: '100%', maxHeight: '80vh', borderRadius: 8, objectFit: 'contain' }}
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
      <footer className="up-page-footer" style={{ marginTop: 28, padding: 16, textAlign: 'center', fontSize: 12.5, color: '#64748b', borderTop: '1px solid #e2e8f0' }}>
        Copyright © ETS NETWORKS. All rights reserved.
      </footer>
    </div>
  );
}

export default UPKusumCVerifyInstallation;
