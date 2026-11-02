import { createPortal } from 'react-dom';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { PageHead } from '../../../../shell/PageHead';
import { useFocusTrap } from '../../../../../hooks/useFocusTrap';
import {
  upSurveyService,
  getUpSurveyMediaUrl,
  type UpSrtSurveyRecord,
} from '../../up-services';
import {
  TableExportToolbar,
  SearchInput,
  Pagination,
  TableEmptyState,
  copyTableDataToClipboard,
  exportDataToCSV,
  exportDataToExcel,
  printTableData,
  type ExportColumn,
} from '../../../../../common';

const DASH = '—';

/* ── Modal: View Details ── */
function DetailModal({
  open,
  item,
  onClose,
}: {
  open: boolean;
  item: UpSrtSurveyRecord | null;
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
        aria-labelledby="srt-detail-title"
        className="ax-card"
        style={{
          width: '100%',
          maxWidth: 740,
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
            <span style={{ fontSize: 11, fontWeight: 700, color: '#2563eb', textTransform: 'uppercase' }}>
              SRT Survey Details
            </span>
            <h3 id="srt-detail-title" style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--ax-text, #0f172a)' }}>
              {item.beneficiary} ({item.ca_no || `Survey #${item.id}`})
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
          {/* Location */}
          <div style={{ padding: 14, borderRadius: 10, background: 'var(--ax-surface-subtle, #f8fafc)', border: '1px solid var(--ax-border, #e2e8f0)' }}>
            <h4 style={{ margin: '0 0 10px', fontSize: 13, fontWeight: 700 }}>Location Details</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, fontSize: 12.5 }}>
              <div><span style={{ color: 'var(--ax-text-muted)' }}>District: </span><strong>{item.district || DASH}</strong></div>
              <div><span style={{ color: 'var(--ax-text-muted)' }}>Block: </span><strong>{item.block || DASH}</strong></div>
              <div><span style={{ color: 'var(--ax-text-muted)' }}>Panchayat: </span><strong>{item.panchayat || DASH}</strong></div>
              <div><span style={{ color: 'var(--ax-text-muted)' }}>Village: </span><strong>{item.village || DASH}</strong></div>
              <div><span style={{ color: 'var(--ax-text-muted)' }}>Ward No.: </span><strong>{item.ward_no || DASH}</strong></div>
              <div><span style={{ color: 'var(--ax-text-muted)' }}>Coordinates: </span><strong>{item.latitude ? `${item.latitude}, ${item.longitude}` : DASH}</strong></div>
              <div style={{ gridColumn: 'span 3' }}><span style={{ color: 'var(--ax-text-muted)' }}>Address: </span><strong>{item.address || DASH}</strong></div>
            </div>
          </div>

          {/* Beneficiary */}
          <div style={{ padding: 14, borderRadius: 10, background: 'var(--ax-surface-subtle, #f8fafc)', border: '1px solid var(--ax-border, #e2e8f0)' }}>
            <h4 style={{ margin: '0 0 10px', fontSize: 13, fontWeight: 700 }}>Beneficiary Details</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, fontSize: 12.5 }}>
              <div><span style={{ color: 'var(--ax-text-muted)' }}>Beneficiary: </span><strong>{item.beneficiary || DASH}</strong></div>
              <div><span style={{ color: 'var(--ax-text-muted)' }}>Phone No.: </span><strong>{item.phone || DASH}</strong></div>
              <div><span style={{ color: 'var(--ax-text-muted)' }}>Email: </span><strong>{item.email || DASH}</strong></div>
              <div><span style={{ color: 'var(--ax-text-muted)' }}>Aadhaar No.: </span><strong>{item.aadhaar_no || DASH}</strong></div>
              <div><span style={{ color: 'var(--ax-text-muted)' }}>PAN No.: </span><strong>{item.pan_no || DASH}</strong></div>
              <div><span style={{ color: 'var(--ax-text-muted)' }}>CA No.: </span><strong>{item.ca_no || DASH}</strong></div>
            </div>
          </div>

          {/* Electricity & Rooftop */}
          <div style={{ padding: 14, borderRadius: 10, background: 'var(--ax-surface-subtle, #f8fafc)', border: '1px solid var(--ax-border, #e2e8f0)' }}>
            <h4 style={{ margin: '0 0 10px', fontSize: 13, fontWeight: 700 }}>Electricity & Rooftop Details</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, fontSize: 12.5 }}>
              <div><span style={{ color: 'var(--ax-text-muted)' }}>Sanctioned Load: </span><strong>{item.sanctioned_load || DASH} kW</strong></div>
              <div><span style={{ color: 'var(--ax-text-muted)' }}>Load Demand: </span><strong>{item.load_demand || DASH} kW</strong></div>
              <div><span style={{ color: 'var(--ax-text-muted)' }}>Consumption: </span><strong>{item.consumption || DASH} Units/M</strong></div>
              <div><span style={{ color: 'var(--ax-text-muted)' }}>Quotation: </span><strong>₹{item.quotation || DASH}</strong></div>
              <div><span style={{ color: 'var(--ax-text-muted)' }}>Rooftop Area: </span><strong>{item.area_sqft || DASH} Sq.Ft</strong></div>
            </div>
          </div>

          {/* Bank */}
          <div style={{ padding: 14, borderRadius: 10, background: 'var(--ax-surface-subtle, #f8fafc)', border: '1px solid var(--ax-border, #e2e8f0)' }}>
            <h4 style={{ margin: '0 0 10px', fontSize: 13, fontWeight: 700 }}>Bank Details</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, fontSize: 12.5 }}>
              <div><span style={{ color: 'var(--ax-text-muted)' }}>Bank Name: </span><strong>{item.bank || DASH}</strong></div>
              <div><span style={{ color: 'var(--ax-text-muted)' }}>Account Holder: </span><strong>{item.account_holder || DASH}</strong></div>
              <div><span style={{ color: 'var(--ax-text-muted)' }}>Account No.: </span><strong>{item.account_no || DASH}</strong></div>
              <div><span style={{ color: 'var(--ax-text-muted)' }}>IFSC Code: </span><strong>{item.ifsc || DASH}</strong></div>
            </div>
          </div>

          {/* Documents */}
          <div style={{ padding: 14, borderRadius: 10, background: 'var(--ax-surface-subtle, #f8fafc)', border: '1px solid var(--ax-border, #e2e8f0)' }}>
            <h4 style={{ margin: '0 0 10px', fontSize: 13, fontWeight: 700 }}>Survey Documents</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10 }}>
              {item.aadhaar_photo && (
                <div style={{ textAlign: 'center' }}>
                  <a href={getUpSurveyMediaUrl(item.aadhaar_photo)} target="_blank" rel="noreferrer">
                    <img src={getUpSurveyMediaUrl(item.aadhaar_photo)} alt="Aadhaar" style={{ width: '100%', height: 90, objectFit: 'cover', border: '1px solid var(--ax-border)' }} />
                  </a>
                  <span style={{ fontSize: 11, color: 'var(--ax-text-muted)', display: 'block', marginTop: 4 }}>Aadhaar</span>
                </div>
              )}
              {item.pan_photo && (
                <div style={{ textAlign: 'center' }}>
                  <a href={getUpSurveyMediaUrl(item.pan_photo)} target="_blank" rel="noreferrer">
                    <img src={getUpSurveyMediaUrl(item.pan_photo)} alt="PAN" style={{ width: '100%', height: 90, objectFit: 'cover', border: '1px solid var(--ax-border)' }} />
                  </a>
                  <span style={{ fontSize: 11, color: 'var(--ax-text-muted)', display: 'block', marginTop: 4 }}>PAN</span>
                </div>
              )}
              {item.electricity_bill && (
                <div style={{ textAlign: 'center' }}>
                  <a href={getUpSurveyMediaUrl(item.electricity_bill)} target="_blank" rel="noreferrer">
                    <img src={getUpSurveyMediaUrl(item.electricity_bill)} alt="Electricity Bill" style={{ width: '100%', height: 90, objectFit: 'cover', border: '1px solid var(--ax-border)' }} />
                  </a>
                  <span style={{ fontSize: 11, color: 'var(--ax-text-muted)', display: 'block', marginTop: 4 }}>Electricity Bill</span>
                </div>
              )}
              {item.bank_passbook && (
                <div style={{ textAlign: 'center' }}>
                  <a href={getUpSurveyMediaUrl(item.bank_passbook)} target="_blank" rel="noreferrer">
                    <img src={getUpSurveyMediaUrl(item.bank_passbook)} alt="Passbook" style={{ width: '100%', height: 90, objectFit: 'cover', border: '1px solid var(--ax-border)' }} />
                  </a>
                  <span style={{ fontSize: 11, color: 'var(--ax-text-muted)', display: 'block', marginTop: 4 }}>Passbook</span>
                </div>
              )}
              {item.rooftop_photo && (
                <div style={{ textAlign: 'center' }}>
                  <a href={getUpSurveyMediaUrl(item.rooftop_photo)} target="_blank" rel="noreferrer">
                    <img src={getUpSurveyMediaUrl(item.rooftop_photo)} alt="Rooftop" style={{ width: '100%', height: 90, objectFit: 'cover', border: '1px solid var(--ax-border)' }} />
                  </a>
                  <span style={{ fontSize: 11, color: 'var(--ax-text-muted)', display: 'block', marginTop: 4 }}>Rooftop</span>
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

export function UP_Survey_SRT_ViewSurvey() {
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState<UpSrtSurveyRecord[]>([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [detailItem, setDetailItem] = useState<UpSrtSurveyRecord | null>(null);

  const loadData = useCallback(() => {
    setLoading(true);
    upSurveyService
      .getViewSrtSurveys()
      .then((res) => {
        setRecords(res);
      })
      .catch((err) => {
        console.error('Error fetching SRT surveys:', err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Filter list
  const filteredList = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return records;
    return records.filter((r) => {
      return (
        String(r.district || '').toLowerCase().includes(q) ||
        String(r.block || '').toLowerCase().includes(q) ||
        String(r.panchayat || '').toLowerCase().includes(q) ||
        String(r.village || '').toLowerCase().includes(q) ||
        String(r.beneficiary || '').toLowerCase().includes(q) ||
        String(r.phone || '').toLowerCase().includes(q) ||
        String(r.email || '').toLowerCase().includes(q) ||
        String(r.aadhaar_no || '').toLowerCase().includes(q) ||
        String(r.ca_no || '').toLowerCase().includes(q)
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

  // Export Columns definition (34 columns)
  const exportCols: ExportColumn<UpSrtSurveyRecord>[] = useMemo(
    () => [
      { header: 'Sr. No.', accessor: (_r, i) => i + 1 },
      { header: 'Survey Date', accessor: (r) => r.survey_date || DASH },
      { header: 'District', accessor: (r) => r.district || DASH },
      { header: 'Block', accessor: (r) => r.block || DASH },
      { header: 'Panchayat', accessor: (r) => r.panchayat || DASH },
      { header: 'Village', accessor: (r) => r.village || DASH },
      { header: 'Ward No.', accessor: (r) => r.ward_no || DASH },
      { header: 'Address', accessor: (r) => r.address || DASH },
      { header: 'Beneficiary', accessor: (r) => r.beneficiary || DASH },
      { header: 'Phone', accessor: (r) => r.phone || DASH },
      { header: 'Email', accessor: (r) => r.email || DASH },
      { header: 'Aadhaar No.', accessor: (r) => r.aadhaar_no || DASH },
      { header: 'PAN No.', accessor: (r) => r.pan_no || DASH },
      { header: 'CA No.', accessor: (r) => r.ca_no || DASH },
      { header: 'Sanctioned Load', accessor: (r) => r.sanctioned_load || DASH },
      { header: 'Load Demand', accessor: (r) => r.load_demand || DASH },
      { header: 'Consumption', accessor: (r) => r.consumption || DASH },
      { header: 'Quotation', accessor: (r) => r.quotation || DASH },
      { header: 'Area (sq ft)', accessor: (r) => r.area_sqft || DASH },
      { header: 'Bank', accessor: (r) => r.bank || DASH },
      { header: 'Account Holder', accessor: (r) => r.account_holder || DASH },
      { header: 'Account No.', accessor: (r) => r.account_no || DASH },
      { header: 'IFSC', accessor: (r) => r.ifsc || DASH },
      { header: 'Latitude', accessor: (r) => r.latitude || DASH },
      { header: 'Longitude', accessor: (r) => r.longitude || DASH },
      { header: 'Remark', accessor: (r) => r.remark || DASH },
      { header: 'Verification', accessor: (r) => r.verification || 'Pending' },
      { header: 'Verify By', accessor: (r) => r.verify_by || '-' },
    ],
    []
  );

  return (
    <div className="ax-page solar-erp-page">
      <style>{`
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
      `}</style>

      {/* Header */}
      <PageHead
        title="Welcome to, View UP SRT Survey"
        subtitle="Rooftop solar survey verification records for Uttar Pradesh"
        breadcrumbs={[
          { label: 'Home', href: '/v' },
          { label: 'UP SRT Survey' },
        ]}
      />

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
              UP SRT Survey Records
            </h3>
            <span style={{ fontSize: 12, color: 'var(--ax-text-muted)' }}>
              Beneficiary rooftop installation survey verifications
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
              onCopy={() => copyTableDataToClipboard('UP_SRT_Surveys', filteredList, exportCols)}
              onExportCSV={() => exportDataToCSV('UP_SRT_Surveys', filteredList, exportCols)}
              onExportExcel={() => exportDataToExcel('UP_SRT_Surveys', filteredList, exportCols)}
              onPrint={() => printTableData('Vendor UP SRT Survey Records', filteredList, exportCols)}
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
                  <th>Survey Date</th>
                  <th>District</th>
                  <th>Block</th>
                  <th>Panchayat</th>
                  <th>Village</th>
                  <th>Ward No.</th>
                  <th>Address</th>
                  <th>Beneficiary</th>
                  <th>Phone</th>
                  <th>Email</th>
                  <th>Aadhaar No.</th>
                  <th>PAN No.</th>
                  <th>CA No.</th>
                  <th>Sanctioned Load</th>
                  <th>Load Demand</th>
                  <th>Consumption</th>
                  <th>Quotation</th>
                  <th>Area (sq ft)</th>
                  <th>Bank</th>
                  <th>Account Holder</th>
                  <th>Account No.</th>
                  <th>IFSC</th>
                  <th>Latitude</th>
                  <th>Longitude</th>
                  <th>Aadhaar Photo</th>
                  <th>PAN Photo</th>
                  <th>Electricity Bill</th>
                  <th>Bank Passbook</th>
                  <th>Rooftop Photo</th>
                  <th>Remark</th>
                  <th>Verification</th>
                  <th>Verify By</th>
                  <th style={{ textAlign: 'center', position: 'sticky', right: 0, background: 'var(--ax-surface-subtle, #f8fafc)', zIndex: 2 }}>
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={34} style={{ textAlign: 'center', padding: 40, color: 'var(--ax-text-muted)' }}>
                      Loading SRT survey records...
                    </td>
                  </tr>
                ) : pageData.length === 0 ? (
                  <tr>
                    <td colSpan={34} style={{ padding: 40, textAlign: 'center' }}>
                      <TableEmptyState
                        title="No data available in table"
                        message={
                          search
                            ? 'No survey records match your search query.'
                            : 'There are currently no SRT survey records.'
                        }
                      />
                    </td>
                  </tr>
                ) : (
                  pageData.map((row, idx) => {
                    const srNo = (currentPage - 1) * pageSize + idx + 1;

                    return (
                      <tr key={row.id || idx}>
                        <td style={{ textAlign: 'center' }}>{srNo}</td>
                        <td>{row.survey_date || DASH}</td>
                        <td>{row.district || DASH}</td>
                        <td>{row.block || DASH}</td>
                        <td>{row.panchayat || DASH}</td>
                        <td>{row.village || DASH}</td>
                        <td>{row.ward_no || DASH}</td>
                        <td style={{ maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis' }}>{row.address || DASH}</td>
                        <td style={{ fontWeight: 600, color: 'var(--ax-accent, #2563eb)' }}>{row.beneficiary || DASH}</td>
                        <td>{row.phone || DASH}</td>
                        <td>{row.email || DASH}</td>
                        <td>{row.aadhaar_no || DASH}</td>
                        <td>{row.pan_no || DASH}</td>
                        <td>{row.ca_no || DASH}</td>
                        <td>{row.sanctioned_load || DASH}</td>
                        <td>{row.load_demand || DASH}</td>
                        <td>{row.consumption || DASH}</td>
                        <td>{row.quotation ? `₹${row.quotation}` : DASH}</td>
                        <td>{row.area_sqft || DASH}</td>
                        <td>{row.bank || DASH}</td>
                        <td>{row.account_holder || DASH}</td>
                        <td>{row.account_no || DASH}</td>
                        <td>{row.ifsc || DASH}</td>
                        <td>{row.latitude || DASH}</td>
                        <td>{row.longitude || DASH}</td>

                        {/* Photos */}
                        <td>
                          {row.aadhaar_photo ? (
                            <a href={getUpSurveyMediaUrl(row.aadhaar_photo)} target="_blank" rel="noreferrer" style={{ color: '#2563eb', fontSize: 12 }}>
                              Survey document
                            </a>
                          ) : DASH}
                        </td>
                        <td>
                          {row.pan_photo ? (
                            <a href={getUpSurveyMediaUrl(row.pan_photo)} target="_blank" rel="noreferrer" style={{ color: '#2563eb', fontSize: 12 }}>
                              Survey document
                            </a>
                          ) : DASH}
                        </td>
                        <td>
                          {row.electricity_bill ? (
                            <a href={getUpSurveyMediaUrl(row.electricity_bill)} target="_blank" rel="noreferrer" style={{ color: '#2563eb', fontSize: 12 }}>
                              Survey document
                            </a>
                          ) : DASH}
                        </td>
                        <td>
                          {row.bank_passbook ? (
                            <a href={getUpSurveyMediaUrl(row.bank_passbook)} target="_blank" rel="noreferrer" style={{ color: '#2563eb', fontSize: 12 }}>
                              Survey document
                            </a>
                          ) : DASH}
                        </td>
                        <td>
                          {row.rooftop_photo ? (
                            <a href={getUpSurveyMediaUrl(row.rooftop_photo)} target="_blank" rel="noreferrer" style={{ color: '#2563eb', fontSize: 12 }}>
                              Survey document
                            </a>
                          ) : DASH}
                        </td>

                        <td>{row.remark || DASH}</td>
                        <td>
                          <span
                            style={{
                              padding: '2px 8px',
                              borderRadius: 9999,
                              fontSize: 11,
                              fontWeight: 600,
                              background: '#fef3c7',
                              color: '#92400e',
                              border: '1px solid #fde68a',
                            }}
                          >
                            {row.verification || 'Pending'}
                          </span>
                        </td>
                        <td>{row.verify_by || '-'}</td>

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
                          <button
                            type="button"
                            onClick={() => setDetailItem(row)}
                            className="ax-btn ax-btn--subtle"
                            style={{ padding: '4px 10px', fontSize: 11.5, borderRadius: 6 }}
                          >
                            View
                          </button>
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

      {/* Detail Modal */}
      <DetailModal
        open={Boolean(detailItem)}
        item={detailItem}
        onClose={() => setDetailItem(null)}
      />
    </div>
  );
}

export const UPSurveySRTView = UP_Survey_SRT_ViewSurvey;
export default UP_Survey_SRT_ViewSurvey;
