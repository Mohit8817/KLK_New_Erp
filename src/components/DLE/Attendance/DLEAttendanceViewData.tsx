import React, { useCallback, useEffect, useMemo, useState, useDeferredValue } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHead } from '../../shell/PageHead';
import { Pagination } from '../../../common';
import { dleService, getLoginCompanyId } from '../../../services/dleServices';
import { filterByState } from '../../../services/stateAccess';

export interface AttendanceRecord {
  id: string;
  user_id: string;
  company_id: string;
  attendance_date: string;
  punch_in_at: string;
  punch_in_latitude: string | null;
  punch_in_longitude: string | null;
  punch_out_at: string | null;
  punch_out_latitude: string | null;
  punch_out_longitude: string | null;
  punch_out_auto: boolean;
  created_at: string;
  updated_at: string;
  user_name: string;
  user_email: string;
  user_contact_no: string;
  user_state: string;
  user_district: string;
  user_block: string;
  user_panchayat: string;
}

/* Helpers */
const str = (v: unknown): string => (v === null || v === undefined ? '' : String(v).trim());

const formatTime = (iso?: string | null): string => {
  if (!iso) return '—';
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
  } catch {
    return iso;
  }
};

const formatDate = (dateStr?: string | null): string => {
  if (!dateStr) return '—';
  try {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`;
  } catch {
    return dateStr;
  }
};

const calculateDuration = (inIso?: string | null, outIso?: string | null): { text: string; hours: number; isOngoing: boolean } => {
  if (!inIso) return { text: '—', hours: 0, isOngoing: false };
  const inTime = new Date(inIso).getTime();
  if (isNaN(inTime)) return { text: '—', hours: 0, isOngoing: false };

  if (!outIso) {
    const now = Date.now();
    const diffMs = Math.max(0, now - inTime);
    const hrs = Math.floor(diffMs / (1000 * 60 * 60));
    const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return { text: `${hrs}h ${mins}m`, hours: hrs + mins / 60, isOngoing: true };
  }

  const outTime = new Date(outIso).getTime();
  if (isNaN(outTime)) return { text: '—', hours: 0, isOngoing: false };

  const diffMs = Math.max(0, outTime - inTime);
  const hrs = Math.floor(diffMs / (1000 * 60 * 60));
  const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  return { text: `${hrs}h ${mins}m`, hours: hrs + mins / 60, isOngoing: false };
};

const getStatus = (r: AttendanceRecord): { label: string; badgeClass: string; color: string; bg: string } => {
  if (!r.punch_out_at) {
    return { label: 'Working (In)', badgeClass: 'ax-badge--success', color: '#10b981', bg: 'rgba(16, 185, 129, 0.12)' };
  }
  if (r.punch_out_auto) {
    return { label: 'Auto Out', badgeClass: 'ax-badge--warning', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.12)' };
  }
  return { label: 'Completed', badgeClass: 'ax-badge--neutral', color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.12)' };
};

export function DLEAttendanceViewData() {
  const navigate = useNavigate();
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'working' | 'completed' | 'auto'>('all');
  const [stateFilter, setStateFilter] = useState('All');
  const [districtFilter, setDistrictFilter] = useState('All');
  const [dateFilter, setDateFilter] = useState('All');
  const [customDate, setCustomDate] = useState('');
  const [selectedRecord, setSelectedRecord] = useState<AttendanceRecord | null>(null);

  // Pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const myCompanyId = getLoginCompanyId();

  // Load attendance
  const loadData = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    try {
      const res: any = await dleService.getAttendanceList(undefined, signal);
      const rawList: any[] = Array.isArray(res?.data)
        ? res.data
        : Array.isArray(res)
        ? res
        : [];

      // 1. Company ID filter matching
      const targetCompany = String(myCompanyId || res?.meta?.company_id || '').trim().toLowerCase();
      let companyFiltered = rawList;
      if (targetCompany) {
        const matched = rawList.filter((item) => {
          const itemComp = String(item.company_id || item.companyId || '').trim().toLowerCase();
          return !itemComp || itemComp === 'null' || itemComp === 'undefined' || itemComp === targetCompany;
        });
        if (matched.length > 0) {
          companyFiltered = matched;
        }
      }

      // 2. Role-based State Access filter
      const stateFiltered = filterByState(companyFiltered);

      // Normalize records
      const normalized: AttendanceRecord[] = stateFiltered.map((r, i) => ({
        id: str(r.id || `att-${i}`),
        user_id: str(r.user_id),
        company_id: str(r.company_id),
        attendance_date: str(r.attendance_date),
        punch_in_at: str(r.punch_in_at),
        punch_in_latitude: r.punch_in_latitude ? str(r.punch_in_latitude) : null,
        punch_in_longitude: r.punch_in_longitude ? str(r.punch_in_longitude) : null,
        punch_out_at: r.punch_out_at ? str(r.punch_out_at) : null,
        punch_out_latitude: r.punch_out_latitude ? str(r.punch_out_latitude) : null,
        punch_out_longitude: r.punch_out_longitude ? str(r.punch_out_longitude) : null,
        punch_out_auto: Boolean(r.punch_out_auto),
        created_at: str(r.created_at),
        updated_at: str(r.updated_at),
        user_name: str(r.user_name || 'Unknown User'),
        user_email: str(r.user_email),
        user_contact_no: str(r.user_contact_no),
        user_state: str(r.user_state),
        user_district: str(r.user_district),
        user_block: str(r.user_block),
        user_panchayat: str(r.user_panchayat),
      }));

      // Sort newest first by punch_in_at or attendance_date
      normalized.sort((a, b) => {
        const tA = new Date(a.punch_in_at || a.attendance_date).getTime() || 0;
        const tB = new Date(b.punch_in_at || b.attendance_date).getTime() || 0;
        return tB - tA;
      });

      setRecords(normalized);
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        console.error('Failed to load attendance list:', err);
        setRecords([]);
      }
    } finally {
      setLoading(false);
    }
  }, [myCompanyId]);

  useEffect(() => {
    const ctrl = new AbortController();
    loadData(ctrl.signal);
    return () => ctrl.abort();
  }, [loadData]);

  // Distinct states & districts for dropdowns
  const availableStates = useMemo(() => {
    const s = new Set<string>();
    records.forEach((r) => { if (r.user_state) s.add(r.user_state); });
    return ['All', ...Array.from(s).sort()];
  }, [records]);

  const availableDistricts = useMemo(() => {
    const d = new Set<string>();
    records.forEach((r) => {
      if (stateFilter === 'All' || r.user_state === stateFilter) {
        if (r.user_district) d.add(r.user_district);
      }
    });
    return ['All', ...Array.from(d).sort()];
  }, [records, stateFilter]);

  const deferredQuery = useDeferredValue(searchQuery);

  // Today string YYYY-MM-DD
  const todayStr = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }, []);

  const yesterdayStr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }, []);

  // Filtered list
  const filtered = useMemo(() => {
    const q = deferredQuery.trim().toLowerCase();

    return records.filter((r) => {
      // Search
      if (q) {
        const matchesQ =
          r.user_name.toLowerCase().includes(q) ||
          r.user_email.toLowerCase().includes(q) ||
          r.user_contact_no.toLowerCase().includes(q) ||
          r.user_district.toLowerCase().includes(q) ||
          r.user_block.toLowerCase().includes(q) ||
          r.user_panchayat.toLowerCase().includes(q) ||
          r.user_state.toLowerCase().includes(q) ||
          r.id.toLowerCase().includes(q);
        if (!matchesQ) return false;
      }

      // Status
      if (statusFilter === 'working' && r.punch_out_at) return false;
      if (statusFilter === 'completed' && (!r.punch_out_at || r.punch_out_auto)) return false;
      if (statusFilter === 'auto' && (!r.punch_out_at || !r.punch_out_auto)) return false;

      // State
      if (stateFilter !== 'All' && r.user_state !== stateFilter) return false;

      // District
      if (districtFilter !== 'All' && r.user_district !== districtFilter) return false;

      // Date preset
      if (dateFilter === 'today' && r.attendance_date !== todayStr) return false;
      if (dateFilter === 'yesterday' && r.attendance_date !== yesterdayStr) return false;
      if (dateFilter === 'custom' && customDate && r.attendance_date !== customDate) return false;

      return true;
    });
  }, [records, deferredQuery, statusFilter, stateFilter, districtFilter, dateFilter, customDate, todayStr, yesterdayStr]);

  // Summary Metrics
  const metrics = useMemo(() => {
    const total = records.length;
    let working = 0;
    let completed = 0;
    let auto = 0;
    let todayCount = 0;
    const uniqueEmployees = new Set<string>();

    records.forEach((r) => {
      if (r.user_id) uniqueEmployees.add(r.user_id);
      if (!r.punch_out_at) working++;
      else if (r.punch_out_auto) auto++;
      else completed++;

      if (r.attendance_date === todayStr) todayCount++;
    });

    return {
      total,
      working,
      completed,
      auto,
      todayCount,
      uniqueUsers: uniqueEmployees.size,
    };
  }, [records, todayStr]);

  // Pagination slice
  const totalItems = filtered.length;
  const startIdx = (page - 1) * pageSize;
  const pagedRecords = useMemo(() => filtered.slice(startIdx, startIdx + pageSize), [filtered, startIdx, pageSize]);

  // Export to CSV
  const handleExportCsv = () => {
    if (!filtered.length) return;
    const headers = [
      'Record ID',
      'Employee Name',
      'Email',
      'Contact',
      'State',
      'District',
      'Block',
      'Panchayat',
      'Date',
      'Punch In Time',
      'Punch In Latitude',
      'Punch In Longitude',
      'Punch Out Time',
      'Punch Out Latitude',
      'Punch Out Longitude',
      'Auto Punched Out',
      'Duration Hours',
      'Status',
    ];

    const rows = filtered.map((r) => {
      const dur = calculateDuration(r.punch_in_at, r.punch_out_at);
      const st = getStatus(r);
      return [
        `"${r.id}"`,
        `"${r.user_name.replace(/"/g, '""')}"`,
        `"${r.user_email}"`,
        `"${r.user_contact_no}"`,
        `"${r.user_state}"`,
        `"${r.user_district}"`,
        `"${r.user_block}"`,
        `"${r.user_panchayat}"`,
        `"${r.attendance_date}"`,
        `"${formatTime(r.punch_in_at)}"`,
        `"${r.punch_in_latitude || ''}"`,
        `"${r.punch_in_longitude || ''}"`,
        `"${formatTime(r.punch_out_at)}"`,
        `"${r.punch_out_latitude || ''}"`,
        `"${r.punch_out_longitude || ''}"`,
        `"${r.punch_out_auto ? 'Yes' : 'No'}"`,
        `"${dur.text}"`,
        `"${st.label}"`,
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Attendance_Report_${myCompanyId || 'KLK'}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <>
      <PageHead
        title="Attendance Records"
        subtitle={`Live biometric & GPS field punch log for company ${myCompanyId || 'KLK Ventures'}`}
        breadcrumbs={[
          { label: 'DLE', href: '/dle/dashboard' },
          { label: 'Attendance' },
        ]}
        actions={
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <button
              type="button"
              className="ax-btn ax-btn--secondary ax-btn--sm"
              onClick={() => loadData()}
              disabled={loading}
              title="Refresh attendance records"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }}>
                <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
              </svg>
              <span>Refresh</span>
            </button>
            <button
              type="button"
              className="ax-btn ax-btn--primary ax-btn--sm"
              onClick={handleExportCsv}
              disabled={loading || !filtered.length}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              <span>Export CSV</span>
            </button>
          </div>
        }
      />

      <div className="ax-dash-grid">
        {/* KPI Cards Row */}
        <div className="ax-col--12">
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: 'var(--ax-space-3, 12px)',
            marginBottom: 'var(--ax-space-2, 8px)',
          }}>
            {/* Card 1: Total Records */}
            <div className="ax-card" style={{ padding: '16px 20px', borderLeft: '4px solid #2563eb' }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ax-text-subtle)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Total Records
              </div>
              <div style={{ fontSize: 26, fontWeight: 700, color: 'var(--ax-text-strong)', marginTop: 4 }}>
                {loading ? '…' : metrics.total.toLocaleString()}
              </div>
              <div style={{ fontSize: 12, color: 'var(--ax-text-muted)', marginTop: 4 }}>
                {metrics.uniqueUsers} Unique Employees
              </div>
            </div>

            {/* Card 2: Today's Punches */}
            <div className="ax-card" style={{ padding: '16px 20px', borderLeft: '4px solid #8b5cf6' }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ax-text-subtle)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Today's Punches
              </div>
              <div style={{ fontSize: 26, fontWeight: 700, color: 'var(--ax-text-strong)', marginTop: 4 }}>
                {loading ? '…' : metrics.todayCount.toLocaleString()}
              </div>
              <div style={{ fontSize: 12, color: '#8b5cf6', marginTop: 4, fontWeight: 500 }}>
                {formatDate(todayStr)}
              </div>
            </div>

            {/* Card 3: Active Working */}
            <div className="ax-card" style={{ padding: '16px 20px', borderLeft: '4px solid #10b981' }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ax-text-subtle)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Currently Working
              </div>
              <div style={{ fontSize: 26, fontWeight: 700, color: '#10b981', marginTop: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>{loading ? '…' : metrics.working.toLocaleString()}</span>
                {!loading && metrics.working > 0 && (
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981', display: 'inline-block', boxShadow: '0 0 0 3px rgba(16, 185, 129, 0.3)' }} />
                )}
              </div>
              <div style={{ fontSize: 12, color: 'var(--ax-text-muted)', marginTop: 4 }}>
                Punch Out Pending
              </div>
            </div>

            {/* Card 4: Completed */}
            <div className="ax-card" style={{ padding: '16px 20px', borderLeft: '4px solid #3b82f6' }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ax-text-subtle)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Punched Out
              </div>
              <div style={{ fontSize: 26, fontWeight: 700, color: 'var(--ax-text-strong)', marginTop: 4 }}>
                {loading ? '…' : metrics.completed.toLocaleString()}
              </div>
              <div style={{ fontSize: 12, color: 'var(--ax-text-muted)', marginTop: 4 }}>
                Full Day Completed
              </div>
            </div>

            {/* Card 5: Auto Out */}
            <div className="ax-card" style={{ padding: '16px 20px', borderLeft: '4px solid #f59e0b' }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ax-text-subtle)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Auto Closed
              </div>
              <div style={{ fontSize: 26, fontWeight: 700, color: '#f59e0b', marginTop: 4 }}>
                {loading ? '…' : metrics.auto.toLocaleString()}
              </div>
              <div style={{ fontSize: 12, color: 'var(--ax-text-muted)', marginTop: 4 }}>
                System Punch Out
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Search Bar */}
        <section className="ax-card ax-col--12" style={{ padding: 0 }}>
          <div style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--ax-border, #e2e8f0)',
            display: 'flex',
            flexWrap: 'wrap',
            gap: 12,
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            {/* Search */}
            <div style={{ position: 'relative', minWidth: 260, flex: '1 1 280px' }}>
              <svg
                width={16}
                height={16}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--ax-text-subtle)' }}
              >
                <circle cx={11} cy={11} r={8} />
                <line x1={21} y1={21} x2={16.65} y2={16.65} />
              </svg>
              <input
                type="search"
                className="ax-input ax-input--sm"
                placeholder="Search name, phone, email, district, block…"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
                style={{ paddingLeft: 36, width: '100%' }}
              />
            </div>

            {/* Filter Group */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
              {/* Status Filter */}
              <select
                className="ax-input ax-input--sm"
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value as any);
                  setPage(1);
                }}
                style={{ minWidth: 140 }}
              >
                <option value="all">All Statuses</option>
                <option value="working">🟢 Working (In)</option>
                <option value="completed">🔵 Punched Out</option>
                <option value="auto">🟠 Auto Closed</option>
              </select>

              {/* State Filter */}
              <select
                className="ax-input ax-input--sm"
                value={stateFilter}
                onChange={(e) => {
                  setStateFilter(e.target.value);
                  setDistrictFilter('All');
                  setPage(1);
                }}
                style={{ minWidth: 120 }}
              >
                {availableStates.map((s) => (
                  <option key={s} value={s}>{s === 'All' ? 'All States' : s}</option>
                ))}
              </select>

              {/* District Filter */}
              <select
                className="ax-input ax-input--sm"
                value={districtFilter}
                onChange={(e) => {
                  setDistrictFilter(e.target.value);
                  setPage(1);
                }}
                style={{ minWidth: 130 }}
              >
                {availableDistricts.map((d) => (
                  <option key={d} value={d}>{d === 'All' ? 'All Districts' : d}</option>
                ))}
              </select>

              {/* Date Filter */}
              <select
                className="ax-input ax-input--sm"
                value={dateFilter}
                onChange={(e) => {
                  setDateFilter(e.target.value);
                  setPage(1);
                }}
                style={{ minWidth: 120 }}
              >
                <option value="All">All Dates</option>
                <option value="today">Today</option>
                <option value="yesterday">Yesterday</option>
                <option value="custom">Custom Date</option>
              </select>

              {dateFilter === 'custom' && (
                <input
                  type="date"
                  className="ax-input ax-input--sm"
                  value={customDate}
                  onChange={(e) => {
                    setCustomDate(e.target.value);
                    setPage(1);
                  }}
                  style={{ minWidth: 140 }}
                />
              )}

              {/* Clear filters */}
              {(searchQuery || statusFilter !== 'all' || stateFilter !== 'All' || districtFilter !== 'All' || dateFilter !== 'All') && (
                <button
                  type="button"
                  className="ax-btn ax-btn--ghost ax-btn--sm"
                  onClick={() => {
                    setSearchQuery('');
                    setStatusFilter('all');
                    setStateFilter('All');
                    setDistrictFilter('All');
                    setDateFilter('All');
                    setCustomDate('');
                    setPage(1);
                  }}
                  style={{ color: '#ef4444' }}
                >
                  Clear Filters
                </button>
              )}
            </div>
          </div>

          {/* Table Container */}
          <div className="ax-table-wrap">
            <table className="ax-table ax-table--hover" style={{ minWidth: 980 }} aria-busy={loading}>
              <caption className="ax-visually-hidden">Attendance Records</caption>
              <thead className="ax-table__head">
                <tr>
                  <th className="ax-table__th ax-table__th--num" style={{ width: 60 }}>Sr.</th>
                  <th className="ax-table__th">Employee</th>
                  <th className="ax-table__th">Location (State / District)</th>
                  <th className="ax-table__th">Date</th>
                  <th className="ax-table__th">Punch In</th>
                  <th className="ax-table__th">Punch Out</th>
                  <th className="ax-table__th">Duration</th>
                  <th className="ax-table__th">Status</th>
                  <th className="ax-table__th" style={{ textAlign: 'center', width: 90 }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  Array.from({ length: 6 }).map((_, i) => (
                    <tr key={`skel-${i}`} className="ax-table__row" aria-hidden="true">
                      {Array.from({ length: 9 }).map((__, j) => (
                        <td key={j} className="ax-table__td">
                          <span className={`block h-3.5 animate-pulse rounded bg-current opacity-10 ${j === 1 ? 'w-36' : 'w-16'}`} />
                        </td>
                      ))}
                    </tr>
                  ))
                )}

                {!loading && pagedRecords.length === 0 && (
                  <tr>
                    <td colSpan={9} style={{ textAlign: 'center', padding: '48px 24px' }}>
                      <div style={{ color: 'var(--ax-text-subtle)', marginBottom: 8 }}>
                        <svg width={36} height={36} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto 8px auto', opacity: 0.5 }}>
                          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                          <line x1="16" y1="2" x2="16" y2="6" />
                          <line x1="8" y1="2" x2="8" y2="6" />
                          <line x1="3" y1="10" x2="21" y2="10" />
                        </svg>
                        <h4 style={{ margin: 0, fontWeight: 600, color: 'var(--ax-text-strong)' }}>No Attendance Records Found</h4>
                        <p style={{ margin: '4px 0 0 0', fontSize: 13 }}>No records match your active search or filters.</p>
                      </div>
                    </td>
                  </tr>
                )}

                {!loading && pagedRecords.map((r, idx) => {
                  const status = getStatus(r);
                  const dur = calculateDuration(r.punch_in_at, r.punch_out_at);
                  const inGps = r.punch_in_latitude && r.punch_in_longitude;
                  const outGps = r.punch_out_latitude && r.punch_out_longitude;

                  return (
                    <tr key={r.id} className="ax-table__row">
                      {/* Sr */}
                      <td className="ax-table__td ax-table__td--num ax-num" style={{ color: 'var(--ax-text-subtle)' }}>
                        {startIdx + idx + 1}
                      </td>

                      {/* Employee */}
                      <td className="ax-table__td">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{
                            width: 32,
                            height: 32,
                            borderRadius: '50%',
                            background: 'rgba(37, 99, 235, 0.1)',
                            color: '#2563eb',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 700,
                            fontSize: 13,
                            flexShrink: 0,
                          }}>
                            {r.user_name.charAt(0).toUpperCase() || 'U'}
                          </div>
                          <div>
                            <button
                              type="button"
                              onClick={() => navigate(`/dle/users/${r.user_id}`)}
                              style={{
                                background: 'none',
                                border: 'none',
                                padding: 0,
                                font: 'inherit',
                                fontWeight: 600,
                                color: 'var(--ax-text-strong)',
                                cursor: 'pointer',
                                textAlign: 'left',
                              }}
                              onMouseEnter={(e) => { e.currentTarget.style.color = '#2563eb'; e.currentTarget.style.textDecoration = 'underline'; }}
                              onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--ax-text-strong)'; e.currentTarget.style.textDecoration = 'none'; }}
                              title="Click to view profile & documents"
                            >
                              {r.user_name}
                            </button>
                            <div style={{ fontSize: 12, color: 'var(--ax-text-muted)' }}>
                              {r.user_contact_no || r.user_email || '—'}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Location */}
                      <td className="ax-table__td">
                        <div style={{ fontWeight: 500, color: 'var(--ax-text-strong)' }}>
                          {r.user_district || '—'}
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--ax-text-muted)' }}>
                          {[r.user_block, r.user_state].filter(Boolean).join(', ')}
                        </div>
                      </td>

                      {/* Date */}
                      <td className="ax-table__td ax-num" style={{ whiteSpace: 'nowrap' }}>
                        {formatDate(r.attendance_date)}
                      </td>

                      {/* Punch In */}
                      <td className="ax-table__td">
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontWeight: 600, color: 'var(--ax-text-strong)' }}>
                            {formatTime(r.punch_in_at)}
                          </span>
                          {inGps && (
                            <a
                              href={`https://www.google.com/maps?q=${r.punch_in_latitude},${r.punch_in_longitude}`}
                              target="_blank"
                              rel="noreferrer"
                              title={`View In GPS (${r.punch_in_latitude}, ${r.punch_in_longitude}) on Google Maps`}
                              style={{ color: '#2563eb', display: 'inline-flex' }}
                            >
                              <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                                <circle cx="12" cy="10" r="3" />
                              </svg>
                            </a>
                          )}
                        </div>
                      </td>

                      {/* Punch Out */}
                      <td className="ax-table__td">
                        {r.punch_out_at ? (
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ fontWeight: 600, color: 'var(--ax-text-strong)' }}>
                              {formatTime(r.punch_out_at)}
                            </span>
                            {outGps && (
                              <a
                                href={`https://www.google.com/maps?q=${r.punch_out_latitude},${r.punch_out_longitude}`}
                                target="_blank"
                                rel="noreferrer"
                                title={`View Out GPS (${r.punch_out_latitude}, ${r.punch_out_longitude}) on Google Maps`}
                                style={{ color: '#2563eb', display: 'inline-flex' }}
                              >
                                <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                                  <circle cx="12" cy="10" r="3" />
                                </svg>
                              </a>
                            )}
                          </div>
                        ) : (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#10b981', fontWeight: 600 }}>
                            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981' }} />
                            Working
                          </span>
                        )}
                      </td>

                      {/* Duration */}
                      <td className="ax-table__td ax-num" style={{ whiteSpace: 'nowrap' }}>
                        <span style={{ fontWeight: 500, color: dur.isOngoing ? '#10b981' : 'var(--ax-text-strong)' }}>
                          {dur.text}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="ax-table__td">
                        <span
                          className={`ax-badge ax-badge--soft ${status.badgeClass}`}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}
                        >
                          <span style={{ width: 6, height: 6, borderRadius: '50%', background: status.color }} />
                          {status.label}
                        </span>
                      </td>

                      {/* Action */}
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        <button
                          type="button"
                          className="ax-btn ax-btn--ghost ax-btn--sm"
                          onClick={() => setSelectedRecord(r)}
                          title="View Attendance Details"
                          style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 8px' }}
                        >
                          <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                            <circle cx="12" cy="12" r="3" />
                          </svg>
                          <span style={{ fontSize: 12 }}>View</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {!loading && totalItems > 0 && (
            <Pagination
              currentPage={page}
              totalItems={totalItems}
              pageSize={pageSize}
              setPage={setPage}
              onPageSizeChange={(newSize) => {
                setPageSize(newSize);
                setPage(1);
              }}
              pageSizeOptions={[10, 20, 50, 100]}
              showSummary
              rangeStart={startIdx + 1}
              rangeEnd={Math.min(startIdx + pageSize, totalItems)}
            />
          )}
        </section>
      </div>

      {/* Detailed Modal */}
      {selectedRecord && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Attendance Session Details"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            backgroundColor: 'rgba(0, 0, 0, 0.45)',
            backdropFilter: 'blur(3px)',
            display: 'grid',
            placeItems: 'center',
            padding: 16,
          }}
          onClick={() => setSelectedRecord(null)}
        >
          <div
            className="ax-card"
            style={{
              width: '100%',
              maxWidth: 580,
              maxHeight: '90vh',
              overflowY: 'auto',
              borderRadius: 12,
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.25)',
              padding: 0,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{
              padding: '16px 20px',
              borderBottom: '1px solid var(--ax-border, #e2e8f0)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'var(--ax-surface-subtle, #f8fafc)',
            }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--ax-text-strong)' }}>
                  Attendance Session Details
                </h3>
                <div style={{ fontSize: 12, color: 'var(--ax-text-muted)', marginTop: 2 }}>
                  Record ID #{selectedRecord.id} · Date: {formatDate(selectedRecord.attendance_date)}
                </div>
              </div>
              <button
                type="button"
                className="ax-btn ax-btn--ghost ax-btn--sm"
                onClick={() => setSelectedRecord(null)}
                style={{ padding: 4 }}
                aria-label="Close modal"
              >
                <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <line x1={18} y1={6} x2={6} y2={18} />
                  <line x1={6} y1={6} x2={18} y2={18} />
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Employee Summary Card */}
              <div style={{
                padding: '12px 16px',
                borderRadius: 8,
                background: 'var(--ax-surface-subtle, #f8fafc)',
                border: '1px solid var(--ax-border, #e2e8f0)',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
              }}>
                <div style={{
                  width: 44,
                  height: 44,
                  borderRadius: '50%',
                  background: 'rgba(37, 99, 235, 0.1)',
                  color: '#2563eb',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 18,
                  fontWeight: 700,
                  flexShrink: 0,
                }}>
                  {selectedRecord.user_name.charAt(0).toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--ax-text-strong)' }}>
                    {selectedRecord.user_name}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--ax-text-muted)' }}>
                    {selectedRecord.user_email} · {selectedRecord.user_contact_no}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--ax-text-subtle)', marginTop: 2 }}>
                    Company: <strong>{selectedRecord.company_id}</strong> · User ID: #{selectedRecord.user_id}
                  </div>
                </div>
                <button
                  type="button"
                  className="ax-btn ax-btn--secondary ax-btn--sm"
                  onClick={() => {
                    navigate(`/dle/users/${selectedRecord.user_id}`);
                  }}
                  style={{ fontSize: 12 }}
                >
                  View Profile
                </button>
              </div>

              {/* Status and Duration Pill */}
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <div style={{ flex: 1, padding: 12, borderRadius: 8, border: '1px solid var(--ax-border, #e2e8f0)' }}>
                  <div style={{ fontSize: 11, textTransform: 'uppercase', color: 'var(--ax-text-subtle)', fontWeight: 600 }}>Status</div>
                  <div style={{ marginTop: 4, display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600, color: getStatus(selectedRecord).color }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: getStatus(selectedRecord).color }} />
                    {getStatus(selectedRecord).label}
                  </div>
                </div>
                <div style={{ flex: 1, padding: 12, borderRadius: 8, border: '1px solid var(--ax-border, #e2e8f0)' }}>
                  <div style={{ fontSize: 11, textTransform: 'uppercase', color: 'var(--ax-text-subtle)', fontWeight: 600 }}>Total Duration</div>
                  <div style={{ marginTop: 4, fontWeight: 700, fontSize: 16, color: 'var(--ax-text-strong)' }}>
                    {calculateDuration(selectedRecord.punch_in_at, selectedRecord.punch_out_at).text}
                  </div>
                </div>
              </div>

              {/* Punch In Details */}
              <div style={{
                padding: '14px 16px',
                borderRadius: 8,
                border: '1px solid #10b98133',
                background: 'rgba(16, 185, 129, 0.04)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontWeight: 700, color: '#059669', fontSize: 13, textTransform: 'uppercase' }}>
                    Punch In
                  </span>
                  <span style={{ fontWeight: 700, fontSize: 15, color: 'var(--ax-text-strong)' }}>
                    {formatTime(selectedRecord.punch_in_at)}
                  </span>
                </div>
                <div style={{ fontSize: 12, color: 'var(--ax-text-muted)', marginTop: 4 }}>
                  Timestamp: {selectedRecord.punch_in_at || '—'}
                </div>
                {selectedRecord.punch_in_latitude && selectedRecord.punch_in_longitude ? (
                  <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12 }}>
                    <span style={{ color: 'var(--ax-text-subtle)' }}>
                      GPS: {selectedRecord.punch_in_latitude}, {selectedRecord.punch_in_longitude}
                    </span>
                    <a
                      href={`https://www.google.com/maps?q=${selectedRecord.punch_in_latitude},${selectedRecord.punch_in_longitude}`}
                      target="_blank"
                      rel="noreferrer"
                      className="ax-btn ax-btn--ghost ax-btn--sm"
                      style={{ color: '#2563eb', padding: '2px 8px', fontSize: 12 }}
                    >
                      Open Map ↗
                    </a>
                  </div>
                ) : (
                  <div style={{ fontSize: 12, color: 'var(--ax-text-subtle)', marginTop: 4 }}>GPS not recorded</div>
                )}
              </div>

              {/* Punch Out Details */}
              <div style={{
                padding: '14px 16px',
                borderRadius: 8,
                border: '1px solid #3b82f633',
                background: 'rgba(59, 130, 246, 0.04)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontWeight: 700, color: '#2563eb', fontSize: 13, textTransform: 'uppercase' }}>
                    Punch Out
                  </span>
                  <span style={{ fontWeight: 700, fontSize: 15, color: 'var(--ax-text-strong)' }}>
                    {selectedRecord.punch_out_at ? formatTime(selectedRecord.punch_out_at) : 'Still Open'}
                  </span>
                </div>
                <div style={{ fontSize: 12, color: 'var(--ax-text-muted)', marginTop: 4 }}>
                  Timestamp: {selectedRecord.punch_out_at || 'In progress'}
                </div>
                {selectedRecord.punch_out_latitude && selectedRecord.punch_out_longitude ? (
                  <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12 }}>
                    <span style={{ color: 'var(--ax-text-subtle)' }}>
                      GPS: {selectedRecord.punch_out_latitude}, {selectedRecord.punch_out_longitude}
                    </span>
                    <a
                      href={`https://www.google.com/maps?q=${selectedRecord.punch_out_latitude},${selectedRecord.punch_out_longitude}`}
                      target="_blank"
                      rel="noreferrer"
                      className="ax-btn ax-btn--ghost ax-btn--sm"
                      style={{ color: '#2563eb', padding: '2px 8px', fontSize: 12 }}
                    >
                      Open Map ↗
                    </a>
                  </div>
                ) : (
                  <div style={{ fontSize: 12, color: 'var(--ax-text-subtle)', marginTop: 4 }}>
                    {selectedRecord.punch_out_at ? 'GPS not recorded' : 'Awaiting punch out'}
                  </div>
                )}
              </div>

              {/* Location details */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: 10,
                fontSize: 12,
              }}>
                <div style={{ padding: '8px 12px', background: 'var(--ax-surface-subtle, #f8fafc)', borderRadius: 6, border: '1px solid var(--ax-border, #e2e8f0)' }}>
                  <span style={{ color: 'var(--ax-text-subtle)' }}>State: </span>
                  <strong style={{ color: 'var(--ax-text-strong)' }}>{selectedRecord.user_state || '—'}</strong>
                </div>
                <div style={{ padding: '8px 12px', background: 'var(--ax-surface-subtle, #f8fafc)', borderRadius: 6, border: '1px solid var(--ax-border, #e2e8f0)' }}>
                  <span style={{ color: 'var(--ax-text-subtle)' }}>District: </span>
                  <strong style={{ color: 'var(--ax-text-strong)' }}>{selectedRecord.user_district || '—'}</strong>
                </div>
                <div style={{ padding: '8px 12px', background: 'var(--ax-surface-subtle, #f8fafc)', borderRadius: 6, border: '1px solid var(--ax-border, #e2e8f0)' }}>
                  <span style={{ color: 'var(--ax-text-subtle)' }}>Block: </span>
                  <strong style={{ color: 'var(--ax-text-strong)' }}>{selectedRecord.user_block || '—'}</strong>
                </div>
                <div style={{ padding: '8px 12px', background: 'var(--ax-surface-subtle, #f8fafc)', borderRadius: 6, border: '1px solid var(--ax-border, #e2e8f0)' }}>
                  <span style={{ color: 'var(--ax-text-subtle)' }}>Panchayat: </span>
                  <strong style={{ color: 'var(--ax-text-strong)' }}>{selectedRecord.user_panchayat || '—'}</strong>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div style={{
              padding: '12px 20px',
              borderTop: '1px solid var(--ax-border, #e2e8f0)',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: 8,
              background: 'var(--ax-surface-subtle, #f8fafc)',
            }}>
              <button
                type="button"
                className="ax-btn ax-btn--secondary ax-btn--sm"
                onClick={() => setSelectedRecord(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default DLEAttendanceViewData;
