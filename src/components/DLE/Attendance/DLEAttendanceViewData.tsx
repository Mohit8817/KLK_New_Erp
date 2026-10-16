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
      const day = parts[2].padStart(2, '0');
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const mIdx = parseInt(parts[1], 10) - 1;
      const monthName = months[mIdx] || parts[1];
      return `${day} ${monthName} ${parts[0]}`;
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

const getStatus = (r: AttendanceRecord): { label: string; color: string; bg: string; border: string; dotColor: string } => {
  if (!r.punch_out_at) {
    return {
      label: 'On Duty',
      color: '#047857',
      bg: '#ecfdf5',
      border: '#a7f3d0',
      dotColor: '#10b981',
    };
  }
  if (r.punch_out_auto) {
    return {
      label: 'Auto Out',
      color: '#b45309',
      bg: '#fffbeb',
      border: '#fde68a',
      dotColor: '#f59e0b',
    };
  }
  return {
    label: 'Completed',
    color: '#1d4ed8',
    bg: '#eff6ff',
    border: '#bfdbfe',
    dotColor: '#3b82f6',
  };
};

const getInitials = (name: string) => {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return name.slice(0, 2).toUpperCase() || 'U';
};

const getAvatarColor = (name: string) => {
  const colors = [
    { bg: '#dbeafe', color: '#1d4ed8' },
    { bg: '#d1fae5', color: '#047857' },
    { bg: '#ede9fe', color: '#6d28d9' },
    { bg: '#fef3c7', color: '#b45309' },
    { bg: '#fee2e2', color: '#b91c1c' },
    { bg: '#e0f2fe', color: '#0369a1' },
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
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

  // Distinct states & districts
  const availableStates = useMemo(() => {
    const s = new Set<string>();
    records.forEach((r) => { if (r.user_state && r.user_state !== 'NA') s.add(r.user_state); });
    return ['All', ...Array.from(s).sort()];
  }, [records]);

  const availableDistricts = useMemo(() => {
    const d = new Set<string>();
    records.forEach((r) => {
      if (stateFilter === 'All' || r.user_state === stateFilter) {
        if (r.user_district && r.user_district !== 'NA') d.add(r.user_district);
      }
    });
    return ['All', ...Array.from(d).sort()];
  }, [records, stateFilter]);

  const deferredQuery = useDeferredValue(searchQuery);

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
      if (stateFilter !== 'All' && r.user_state.toLowerCase() !== stateFilter.toLowerCase()) return false;

      // District
      if (districtFilter !== 'All' && r.user_district.toLowerCase() !== districtFilter.toLowerCase()) return false;

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
      'Punch In GPS',
      'Punch Out Time',
      'Punch Out GPS',
      'Auto Punched Out',
      'Duration',
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
        `"${r.punch_in_latitude && r.punch_in_longitude ? `${r.punch_in_latitude}, ${r.punch_in_longitude}` : ''}"`,
        `"${formatTime(r.punch_out_at)}"`,
        `"${r.punch_out_latitude && r.punch_out_longitude ? `${r.punch_out_latitude}, ${r.punch_out_longitude}` : ''}"`,
        `"${r.punch_out_auto ? 'Yes' : 'No'}"`,
        `"${dur.text}"`,
        `"${st.label}"`,
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Attendance_${myCompanyId || 'KLK'}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div>
      {/* Header */}
      <PageHead
        title="Attendance Monitoring"
        subtitle={`Field technician punch in/out & GPS tracking log · Company ID: ${myCompanyId || 'KLK19022025'}`}
        breadcrumbs={[
          { label: 'DLE Portal', href: '/dle/dashboard' },
          { label: 'Attendance' },
        ]}
        actions={
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <button
              type="button"
              className="ax-btn ax-btn--secondary ax-btn--sm"
              onClick={() => loadData()}
              disabled={loading}
              title="Refresh attendance"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 500 }}
            >
              <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }}>
                <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
              </svg>
              <span>Refresh</span>
            </button>
            <button
              type="button"
              className="ax-btn ax-btn--primary ax-btn--sm"
              onClick={handleExportCsv}
              disabled={loading || !filtered.length}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 500 }}
            >
              <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              <span>Export CSV</span>
            </button>
          </div>
        }
      />

      {/* KPI Cards Row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
        gap: 14,
        marginBottom: 16,
      }}>
        {/* Card 1: Total Records */}
        <div style={{
          background: 'var(--ax-surface-solid, #ffffff)',
          border: '1px solid var(--ax-border, #e2e8f0)',
          borderRadius: 14,
          padding: '16px 18px',
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        }}>
          <div style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
            color: '#2563eb',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}>
            <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ax-text-subtle)', letterSpacing: '0.04em' }}>
              Total Records
            </div>
            <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--ax-text-strong)', lineHeight: 1.2, marginTop: 2 }}>
              {loading ? '…' : metrics.total.toLocaleString()}
            </div>
            <div style={{ fontSize: 12, color: 'var(--ax-text-muted)', marginTop: 2 }}>
              {metrics.uniqueUsers} Technicians
            </div>
          </div>
        </div>

        {/* Card 2: Today's Punches */}
        <div style={{
          background: 'var(--ax-surface-solid, #ffffff)',
          border: '1px solid var(--ax-border, #e2e8f0)',
          borderRadius: 14,
          padding: '16px 18px',
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        }}>
          <div style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            background: 'linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)',
            color: '#7c3aed',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}>
            <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ax-text-subtle)', letterSpacing: '0.04em' }}>
              Today's Punches
            </div>
            <div style={{ fontSize: 24, fontWeight: 800, color: '#7c3aed', lineHeight: 1.2, marginTop: 2 }}>
              {loading ? '…' : metrics.todayCount.toLocaleString()}
            </div>
            <div style={{ fontSize: 12, color: 'var(--ax-text-muted)', marginTop: 2 }}>
              {formatDate(todayStr)}
            </div>
          </div>
        </div>

        {/* Card 3: Active Working */}
        <div style={{
          background: 'var(--ax-surface-solid, #ffffff)',
          border: '1px solid var(--ax-border, #e2e8f0)',
          borderRadius: 14,
          padding: '16px 18px',
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        }}>
          <div style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            background: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)',
            color: '#059669',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            position: 'relative',
          }}>
            <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ax-text-subtle)', letterSpacing: '0.04em' }}>
              On Duty (In Field)
            </div>
            <div style={{ fontSize: 24, fontWeight: 800, color: '#059669', lineHeight: 1.2, marginTop: 2, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>{loading ? '…' : metrics.working.toLocaleString()}</span>
              {!loading && metrics.working > 0 && (
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981', display: 'inline-block', boxShadow: '0 0 0 3px rgba(16, 185, 129, 0.3)' }} />
              )}
            </div>
            <div style={{ fontSize: 12, color: 'var(--ax-text-muted)', marginTop: 2 }}>
              Punch Out Pending
            </div>
          </div>
        </div>

        {/* Card 4: Completed */}
        <div style={{
          background: 'var(--ax-surface-solid, #ffffff)',
          border: '1px solid var(--ax-border, #e2e8f0)',
          borderRadius: 14,
          padding: '16px 18px',
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        }}>
          <div style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
            color: '#1d4ed8',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}>
            <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ax-text-subtle)', letterSpacing: '0.04em' }}>
              Shift Completed
            </div>
            <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--ax-text-strong)', lineHeight: 1.2, marginTop: 2 }}>
              {loading ? '…' : metrics.completed.toLocaleString()}
            </div>
            <div style={{ fontSize: 12, color: 'var(--ax-text-muted)', marginTop: 2 }}>
              Full Day Logged
            </div>
          </div>
        </div>

        {/* Card 5: Auto Closed */}
        <div style={{
          background: 'var(--ax-surface-solid, #ffffff)',
          border: '1px solid var(--ax-border, #e2e8f0)',
          borderRadius: 14,
          padding: '16px 18px',
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        }}>
          <div style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
            color: '#d97706',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}>
            <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 14 14" />
            </svg>
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ax-text-subtle)', letterSpacing: '0.04em' }}>
              Auto Closed
            </div>
            <div style={{ fontSize: 24, fontWeight: 800, color: '#d97706', lineHeight: 1.2, marginTop: 2 }}>
              {loading ? '…' : metrics.auto.toLocaleString()}
            </div>
            <div style={{ fontSize: 12, color: 'var(--ax-text-muted)', marginTop: 2 }}>
              System Closure
            </div>
          </div>
        </div>
      </div>

      {/* Main Container Card */}
      <div style={{
        background: 'var(--ax-surface-solid, #ffffff)',
        border: '1px solid var(--ax-border, #e2e8f0)',
        borderRadius: 14,
        overflow: 'hidden',
        boxShadow: '0 1px 4px rgba(0,0,0,0.03)',
      }}>
        {/* Top Control Bar: Status Tabs + Filters */}
        <div style={{
          padding: '14px 18px',
          borderBottom: '1px solid var(--ax-border, #e2e8f0)',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}>
          {/* Row 1: Status Segment Pills */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            overflowX: 'auto',
            paddingBottom: 2,
          }}>
            <button
              type="button"
              onClick={() => { setStatusFilter('all'); setPage(1); }}
              style={{
                padding: '6px 14px',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 600,
                border: '1px solid',
                borderColor: statusFilter === 'all' ? '#2563eb' : 'var(--ax-border, #e2e8f0)',
                background: statusFilter === 'all' ? '#eff6ff' : 'transparent',
                color: statusFilter === 'all' ? '#2563eb' : 'var(--ax-text-strong)',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                transition: 'all 0.15s ease',
              }}
            >
              <span>All Records</span>
              <span style={{
                background: statusFilter === 'all' ? '#2563eb' : 'var(--ax-surface-subtle, #f1f5f9)',
                color: statusFilter === 'all' ? '#ffffff' : 'var(--ax-text-muted)',
                padding: '1px 7px',
                borderRadius: 10,
                fontSize: 11,
              }}>
                {metrics.total}
              </span>
            </button>

            <button
              type="button"
              onClick={() => { setStatusFilter('working'); setPage(1); }}
              style={{
                padding: '6px 14px',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 600,
                border: '1px solid',
                borderColor: statusFilter === 'working' ? '#10b981' : 'var(--ax-border, #e2e8f0)',
                background: statusFilter === 'working' ? '#ecfdf5' : 'transparent',
                color: statusFilter === 'working' ? '#047857' : 'var(--ax-text-strong)',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                transition: 'all 0.15s ease',
              }}
            >
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#10b981' }} />
              <span>On Duty (Working)</span>
              <span style={{
                background: statusFilter === 'working' ? '#10b981' : 'var(--ax-surface-subtle, #f1f5f9)',
                color: statusFilter === 'working' ? '#ffffff' : 'var(--ax-text-muted)',
                padding: '1px 7px',
                borderRadius: 10,
                fontSize: 11,
              }}>
                {metrics.working}
              </span>
            </button>

            <button
              type="button"
              onClick={() => { setStatusFilter('completed'); setPage(1); }}
              style={{
                padding: '6px 14px',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 600,
                border: '1px solid',
                borderColor: statusFilter === 'completed' ? '#3b82f6' : 'var(--ax-border, #e2e8f0)',
                background: statusFilter === 'completed' ? '#eff6ff' : 'transparent',
                color: statusFilter === 'completed' ? '#1d4ed8' : 'var(--ax-text-strong)',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                transition: 'all 0.15s ease',
              }}
            >
              <span>Shift Completed</span>
              <span style={{
                background: statusFilter === 'completed' ? '#3b82f6' : 'var(--ax-surface-subtle, #f1f5f9)',
                color: statusFilter === 'completed' ? '#ffffff' : 'var(--ax-text-muted)',
                padding: '1px 7px',
                borderRadius: 10,
                fontSize: 11,
              }}>
                {metrics.completed}
              </span>
            </button>

            <button
              type="button"
              onClick={() => { setStatusFilter('auto'); setPage(1); }}
              style={{
                padding: '6px 14px',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 600,
                border: '1px solid',
                borderColor: statusFilter === 'auto' ? '#f59e0b' : 'var(--ax-border, #e2e8f0)',
                background: statusFilter === 'auto' ? '#fffbeb' : 'transparent',
                color: statusFilter === 'auto' ? '#b45309' : 'var(--ax-text-strong)',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                transition: 'all 0.15s ease',
              }}
            >
              <span>Auto Closed</span>
              <span style={{
                background: statusFilter === 'auto' ? '#f59e0b' : 'var(--ax-surface-subtle, #f1f5f9)',
                color: statusFilter === 'auto' ? '#ffffff' : 'var(--ax-text-muted)',
                padding: '1px 7px',
                borderRadius: 10,
                fontSize: 11,
              }}>
                {metrics.auto}
              </span>
            </button>
          </div>

          {/* Row 2: Search + Dropdowns in single row */}
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: 10,
            justifyContent: 'space-between',
          }}>
            {/* Search Input */}
            <div style={{ position: 'relative', flex: '1 1 300px', maxWidth: 440 }}>
              <svg
                width={15}
                height={15}
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
                placeholder="Search by technician name, phone, district, panchayat…"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
                style={{ paddingLeft: 36, width: '100%', borderRadius: 8, height: 36 }}
              />
            </div>

            {/* Filter Dropdowns Row */}
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8 }}>
              {/* State */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <select
                  className="ax-input ax-input--sm"
                  value={stateFilter}
                  onChange={(e) => {
                    setStateFilter(e.target.value);
                    setDistrictFilter('All');
                    setPage(1);
                  }}
                  style={{ minWidth: 120, height: 36, borderRadius: 8 }}
                >
                  {availableStates.map((s) => (
                    <option key={s} value={s}>{s === 'All' ? 'All States' : s}</option>
                  ))}
                </select>
              </div>

              {/* District */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <select
                  className="ax-input ax-input--sm"
                  value={districtFilter}
                  onChange={(e) => {
                    setDistrictFilter(e.target.value);
                    setPage(1);
                  }}
                  style={{ minWidth: 130, height: 36, borderRadius: 8 }}
                >
                  {availableDistricts.map((d) => (
                    <option key={d} value={d}>{d === 'All' ? 'All Districts' : d}</option>
                  ))}
                </select>
              </div>

              {/* Date */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <select
                  className="ax-input ax-input--sm"
                  value={dateFilter}
                  onChange={(e) => {
                    setDateFilter(e.target.value);
                    setPage(1);
                  }}
                  style={{ minWidth: 120, height: 36, borderRadius: 8 }}
                >
                  <option value="All">All Dates</option>
                  <option value="today">Today ({formatDate(todayStr)})</option>
                  <option value="yesterday">Yesterday</option>
                  <option value="custom">Custom Date…</option>
                </select>
              </div>

              {dateFilter === 'custom' && (
                <input
                  type="date"
                  className="ax-input ax-input--sm"
                  value={customDate}
                  onChange={(e) => {
                    setCustomDate(e.target.value);
                    setPage(1);
                  }}
                  style={{ minWidth: 140, height: 36, borderRadius: 8 }}
                />
              )}

              {/* Clear filters button */}
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
                  style={{ color: '#ef4444', height: 36, fontSize: 12 }}
                >
                  Reset
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Data Table */}
        <div className="ax-table-wrap" style={{ margin: 0, border: 'none' }}>
          <table className="ax-table" style={{ minWidth: 1000, width: '100%', borderCollapse: 'collapse' }} aria-busy={loading}>
            <thead>
              <tr style={{ background: 'var(--ax-surface-subtle, #f8fafc)', borderBottom: '1px solid var(--ax-border, #e2e8f0)' }}>
                <th style={{ padding: '12px 16px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ax-text-subtle)', textAlign: 'left', width: 50 }}>#</th>
                <th style={{ padding: '12px 16px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ax-text-subtle)', textAlign: 'left', minWidth: 220 }}>Technician</th>
                <th style={{ padding: '12px 16px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ax-text-subtle)', textAlign: 'left' }}>Location</th>
                <th style={{ padding: '12px 16px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ax-text-subtle)', textAlign: 'left' }}>Date</th>
                <th style={{ padding: '12px 16px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ax-text-subtle)', textAlign: 'left' }}>Punch In</th>
                <th style={{ padding: '12px 16px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ax-text-subtle)', textAlign: 'left' }}>Punch Out</th>
                <th style={{ padding: '12px 16px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ax-text-subtle)', textAlign: 'left' }}>Duration</th>
                <th style={{ padding: '12px 16px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ax-text-subtle)', textAlign: 'left' }}>Status</th>
                <th style={{ padding: '12px 16px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ax-text-subtle)', textAlign: 'center', width: 100 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && Array.from({ length: 8 }).map((_, i) => (
                <tr key={`skel-${i}`} style={{ borderBottom: '1px solid var(--ax-border, #f1f5f9)' }}>
                  {Array.from({ length: 9 }).map((__, j) => (
                    <td key={j} style={{ padding: '14px 16px' }}>
                      <span className={`block h-4 animate-pulse rounded bg-current opacity-10 ${j === 1 ? 'w-44' : j === 2 ? 'w-28' : 'w-16'}`} />
                    </td>
                  ))}
                </tr>
              ))}

              {!loading && pagedRecords.length === 0 && (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '60px 24px' }}>
                    <div style={{ maxWidth: 360, margin: '0 auto', textAlign: 'center' }}>
                      <div style={{
                        width: 56,
                        height: 56,
                        borderRadius: 16,
                        background: '#f1f5f9',
                        color: '#64748b',
                        display: 'grid',
                        placeItems: 'center',
                        margin: '0 auto 14px auto',
                      }}>
                        <svg width={28} height={28} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
                          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                          <line x1="16" y1="2" x2="16" y2="6" />
                          <line x1="8" y1="2" x2="8" y2="6" />
                          <line x1="3" y1="10" x2="21" y2="10" />
                        </svg>
                      </div>
                      <h4 style={{ margin: '0 0 6px 0', fontSize: 16, fontWeight: 700, color: 'var(--ax-text-strong)' }}>
                        No Records Found
                      </h4>
                      <p style={{ margin: 0, fontSize: 13, color: 'var(--ax-text-muted)', lineHeight: 1.5 }}>
                        There are no attendance records matching your active filters. Try changing or resetting filters.
                      </p>
                      {(searchQuery || statusFilter !== 'all' || stateFilter !== 'All' || districtFilter !== 'All' || dateFilter !== 'All') && (
                        <button
                          type="button"
                          className="ax-btn ax-btn--secondary ax-btn--sm"
                          style={{ marginTop: 14 }}
                          onClick={() => {
                            setSearchQuery('');
                            setStatusFilter('all');
                            setStateFilter('All');
                            setDistrictFilter('All');
                            setDateFilter('All');
                            setCustomDate('');
                            setPage(1);
                          }}
                        >
                          Clear All Filters
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )}

              {!loading && pagedRecords.map((r, idx) => {
                const status = getStatus(r);
                const dur = calculateDuration(r.punch_in_at, r.punch_out_at);
                const avatar = getAvatarColor(r.user_name);
                const inGps = r.punch_in_latitude && r.punch_in_longitude;
                const outGps = r.punch_out_latitude && r.punch_out_longitude;

                return (
                  <tr
                    key={r.id}
                    style={{
                      borderBottom: '1px solid var(--ax-border, #f1f5f9)',
                      transition: 'background-color 0.15s ease',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--ax-surface-subtle, #f8fafc)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                  >
                    {/* Index */}
                    <td style={{ padding: '12px 16px', fontSize: 12, color: 'var(--ax-text-subtle)' }}>
                      {startIdx + idx + 1}
                    </td>

                    {/* Technician Name & Avatar */}
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{
                          width: 36,
                          height: 36,
                          borderRadius: 10,
                          background: avatar.bg,
                          color: avatar.color,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 700,
                          fontSize: 13,
                          flexShrink: 0,
                          letterSpacing: '0.02em',
                        }}>
                          {getInitials(r.user_name)}
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <button
                            type="button"
                            onClick={() => navigate(`/dle/users/${r.user_id}`)}
                            style={{
                              background: 'none',
                              border: 'none',
                              padding: 0,
                              font: 'inherit',
                              fontWeight: 700,
                              fontSize: 13.5,
                              color: 'var(--ax-text-strong)',
                              cursor: 'pointer',
                              textAlign: 'left',
                              display: 'block',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              maxWidth: 200,
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.color = '#2563eb'; e.currentTarget.style.textDecoration = 'underline'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--ax-text-strong)'; e.currentTarget.style.textDecoration = 'none'; }}
                            title="Click to view technician profile"
                          >
                            {r.user_name}
                          </button>
                          <div style={{ fontSize: 12, color: 'var(--ax-text-muted)', display: 'flex', alignItems: 'center', gap: 6, marginTop: 1 }}>
                            <span>{r.user_contact_no || r.user_email || '—'}</span>
                            <span style={{ color: 'var(--ax-border, #cbd5e1)' }}>•</span>
                            <span style={{ fontSize: 11, color: 'var(--ax-text-subtle)' }}>#{r.user_id}</span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Location */}
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--ax-text-strong)' }}>
                        {r.user_district || '—'}
                      </div>
                      <div style={{ fontSize: 11.5, color: 'var(--ax-text-muted)', marginTop: 1 }}>
                        {[r.user_block, r.user_state].filter(Boolean).join(', ') || '—'}
                      </div>
                    </td>

                    {/* Date */}
                    <td style={{ padding: '12px 16px', fontSize: 12.5, fontWeight: 500, color: 'var(--ax-text-strong)', whiteSpace: 'nowrap' }}>
                      {formatDate(r.attendance_date)}
                    </td>

                    {/* Punch In */}
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--ax-text-strong)' }}>
                          {formatTime(r.punch_in_at)}
                        </span>
                        {inGps && (
                          <a
                            href={`https://www.google.com/maps?q=${r.punch_in_latitude},${r.punch_in_longitude}`}
                            target="_blank"
                            rel="noreferrer"
                            title={`Punch In GPS (${r.punch_in_latitude}, ${r.punch_in_longitude}) - View on Google Maps`}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              width: 22,
                              height: 22,
                              borderRadius: 6,
                              background: '#ecfdf5',
                              color: '#059669',
                              border: '1px solid #a7f3d0',
                            }}
                          >
                            <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                              <circle cx="12" cy="10" r="3" />
                            </svg>
                          </a>
                        )}
                      </div>
                    </td>

                    {/* Punch Out */}
                    <td style={{ padding: '12px 16px' }}>
                      {r.punch_out_at ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--ax-text-strong)' }}>
                            {formatTime(r.punch_out_at)}
                          </span>
                          {outGps && (
                            <a
                              href={`https://www.google.com/maps?q=${r.punch_out_latitude},${r.punch_out_longitude}`}
                              target="_blank"
                              rel="noreferrer"
                              title={`Punch Out GPS (${r.punch_out_latitude}, ${r.punch_out_longitude}) - View on Google Maps`}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: 22,
                                height: 22,
                                borderRadius: 6,
                                background: '#eff6ff',
                                color: '#2563eb',
                                border: '1px solid #bfdbfe',
                              }}
                            >
                              <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                                <circle cx="12" cy="10" r="3" />
                              </svg>
                            </a>
                          )}
                        </div>
                      ) : (
                        <div style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          padding: '3px 8px',
                          borderRadius: 6,
                          background: '#ecfdf5',
                          border: '1px solid #a7f3d0',
                          fontSize: 11.5,
                          fontWeight: 600,
                          color: '#047857',
                        }}>
                          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
                          <span>On Duty</span>
                        </div>
                      )}
                    </td>

                    {/* Duration */}
                    <td style={{ padding: '12px 16px', fontSize: 13, whiteSpace: 'nowrap' }}>
                      <span style={{
                        fontWeight: 600,
                        color: dur.isOngoing ? '#059669' : 'var(--ax-text-strong)',
                      }}>
                        {dur.text}
                      </span>
                    </td>

                    {/* Status Badge */}
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        padding: '4px 10px',
                        borderRadius: 20,
                        background: status.bg,
                        border: `1px solid ${status.border}`,
                        color: status.color,
                        fontSize: 12,
                        fontWeight: 600,
                        whiteSpace: 'nowrap',
                      }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: status.dotColor }} />
                        <span>{status.label}</span>
                      </div>
                    </td>

                    {/* Action */}
                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                      <button
                        type="button"
                        className="ax-btn ax-btn--ghost ax-btn--sm"
                        onClick={() => navigate(`/dle/attendance/${r.id}`, { state: { record: r } })}
                        title="View Full Attendance & GPS Details"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 5,
                          padding: '5px 10px',
                          borderRadius: 6,
                          fontSize: 12,
                          fontWeight: 600,
                          color: '#2563eb',
                        }}
                      >
                        <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                        <span>Details</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination Toolbar */}
        {!loading && totalItems > 0 && (
          <div style={{ padding: '12px 18px', borderTop: '1px solid var(--ax-border, #e2e8f0)', background: 'var(--ax-surface-subtle, #f8fafc)' }}>
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
          </div>
        )}
      </div>
    </div>
  );
}

export default DLEAttendanceViewData;
