import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { PageHead } from '../../shell/PageHead';
import { dleService } from '../../../services/dleServices';
import { type AttendanceRecord } from './DLEAttendanceViewData';

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
      label: 'On Duty (Working)',
      color: '#047857',
      bg: '#ecfdf5',
      border: '#a7f3d0',
      dotColor: '#10b981',
    };
  }
  if (r.punch_out_auto) {
    return {
      label: 'Auto Punched Out',
      color: '#b45309',
      bg: '#fffbeb',
      border: '#fde68a',
      dotColor: '#f59e0b',
    };
  }
  return {
    label: 'Shift Completed',
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

const InfoItem = ({ label, value, sub }: { label: string; value: string; sub?: string }) => (
  <div style={{
    padding: '14px 16px',
    background: 'var(--ax-surface-subtle, #f8fafc)',
    border: '1px solid var(--ax-border, #e2e8f0)',
    borderRadius: 10,
  }}>
    <div style={{
      fontSize: 11,
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
      color: 'var(--ax-text-subtle)',
      fontWeight: 700,
      marginBottom: 4,
    }}>
      {label}
    </div>
    <div style={{
      color: 'var(--ax-text-strong)',
      fontSize: 14.5,
      fontWeight: 700,
      overflowWrap: 'anywhere',
    }}>
      {value || '—'}
    </div>
    {sub && (
      <div style={{ fontSize: 11.5, color: 'var(--ax-text-muted)', marginTop: 2 }}>
        {sub}
      </div>
    )}
  </div>
);

export function DLEAttendanceDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  const [record, setRecord] = useState<AttendanceRecord | null>(
    (location.state as { record?: AttendanceRecord } | null)?.record ?? null
  );
  const [loading, setLoading] = useState(!record);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (record) return;
    const ctrl = new AbortController();

    (async () => {
      try {
        const res: any = await dleService.getAttendanceList(undefined, ctrl.signal);
        const rawList: any[] = Array.isArray(res?.data)
          ? res.data
          : Array.isArray(res)
          ? res
          : [];

        const found = rawList.find((r) => String(r.id) === String(id));
        if (found) {
          setRecord({
            id: str(found.id),
            user_id: str(found.user_id),
            company_id: str(found.company_id),
            attendance_date: str(found.attendance_date),
            punch_in_at: str(found.punch_in_at),
            punch_in_latitude: found.punch_in_latitude ? str(found.punch_in_latitude) : null,
            punch_in_longitude: found.punch_in_longitude ? str(found.punch_in_longitude) : null,
            punch_out_at: found.punch_out_at ? str(found.punch_out_at) : null,
            punch_out_latitude: found.punch_out_latitude ? str(found.punch_out_latitude) : null,
            punch_out_longitude: found.punch_out_longitude ? str(found.punch_out_longitude) : null,
            punch_out_auto: Boolean(found.punch_out_auto),
            created_at: str(found.created_at),
            updated_at: str(found.updated_at),
            user_name: str(found.user_name || 'Unknown User'),
            user_email: str(found.user_email),
            user_contact_no: str(found.user_contact_no),
            user_state: str(found.user_state),
            user_district: str(found.user_district),
            user_block: str(found.user_block),
            user_panchayat: str(found.user_panchayat),
          });
        } else {
          setNotFound(true);
        }
      } catch (e) {
        if ((e as Error).name !== 'AbortError') setNotFound(true);
      } finally {
        setLoading(false);
      }
    })();

    return () => ctrl.abort();
  }, [id, record]);

  if (loading) {
    return (
      <div style={{ padding: '80px 20px', textAlign: 'center' }}>
        <div className="ax-spinner ax-spinner--primary" style={{ margin: '0 auto 16px auto' }} />
        <div style={{ color: 'var(--ax-text-muted)', fontSize: 14 }}>
          Loading attendance session details…
        </div>
      </div>
    );
  }

  if (notFound || !record) {
    return (
      <div style={{ maxWidth: 600, margin: '60px auto', textAlign: 'center', padding: 24 }}>
        <div style={{
          width: 56,
          height: 56,
          borderRadius: 16,
          background: '#fee2e2',
          color: '#b91c1c',
          display: 'grid',
          placeItems: 'center',
          margin: '0 auto 16px auto',
        }}>
          <svg width={28} height={28} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
          </svg>
        </div>
        <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--ax-text-strong)', margin: '0 0 8px 0' }}>
          Attendance Record Not Found
        </h3>
        <p style={{ color: 'var(--ax-text-muted)', fontSize: 13, marginBottom: 20 }}>
          The requested attendance record #{id} could not be located in your company records.
        </p>
        <button
          type="button"
          className="ax-btn ax-btn--secondary"
          onClick={() => navigate('/dle/attendance')}
        >
          ← Back to Attendance List
        </button>
      </div>
    );
  }

  const status = getStatus(record);
  const dur = calculateDuration(record.punch_in_at, record.punch_out_at);

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', paddingBottom: 48 }}>
      {/* Page Header */}
      <PageHead
        title={`${record.user_name} — Attendance Details`}
        subtitle={`Session Date: ${formatDate(record.attendance_date)} · Record ID #${record.id}`}
        breadcrumbs={[
          { label: 'DLE Portal', href: '/dle/dashboard' },
          { label: 'Attendance', href: '/dle/attendance' },
          { label: `Record #${record.id}` },
        ]}
        actions={
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <button
              type="button"
              className="ax-btn ax-btn--secondary ax-btn--sm"
              onClick={() => navigate('/dle/attendance')}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 500 }}
            >
              <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                <line x1="19" y1="12" x2="5" y2="12" />
                <polyline points="12 19 5 12 12 5" />
              </svg>
              <span>Back to List</span>
            </button>
          </div>
        }
      />

      {/* Status Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 12,
        marginBottom: 20,
        padding: '12px 18px',
        borderRadius: 12,
        background: 'var(--ax-surface-solid, #ffffff)',
        border: '1px solid var(--ax-border, #e2e8f0)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '5px 12px',
            borderRadius: 20,
            background: status.bg,
            border: `1px solid ${status.border}`,
            color: status.color,
            fontSize: 13,
            fontWeight: 700,
          }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: status.dotColor }} />
            <span>{status.label}</span>
          </div>

          <div style={{
            padding: '5px 12px',
            borderRadius: 20,
            background: '#f1f5f9',
            color: '#334155',
            fontSize: 12.5,
            fontWeight: 600,
          }}>
            Total Duration: <strong style={{ color: '#0f172a' }}>{dur.text}</strong>
          </div>

          {record.punch_out_auto && (
            <div style={{
              padding: '5px 12px',
              borderRadius: 20,
              background: '#fffbeb',
              color: '#b45309',
              fontSize: 12.5,
              fontWeight: 600,
              border: '1px solid #fde68a',
            }}>
              ⚠️ System Auto Closed
            </div>
          )}
        </div>

        <div style={{ fontSize: 12, color: 'var(--ax-text-muted)' }}>
          Company ID: <strong style={{ color: 'var(--ax-text-strong)' }}>{record.company_id}</strong>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 20 }}>
        {/* Left Column: Technician Profile Card (4 cols) */}
        <div style={{ gridColumn: 'span 4' }}>
          <div style={{
            background: 'var(--ax-surface-solid, #ffffff)',
            border: '1px solid var(--ax-border, #e2e8f0)',
            borderRadius: 14,
            padding: 24,
            textAlign: 'center',
            position: 'sticky',
            top: 20,
          }}>
            {/* Avatar */}
            <div style={{
              width: 72,
              height: 72,
              borderRadius: 20,
              background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
              color: '#1d4ed8',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 26,
              fontWeight: 800,
              margin: '0 auto 16px auto',
              boxShadow: '0 4px 14px rgba(37, 99, 235, 0.15)',
            }}>
              {getInitials(record.user_name)}
            </div>

            <h3 style={{ margin: '0 0 4px 0', fontSize: 18, fontWeight: 800, color: 'var(--ax-text-strong)' }}>
              {record.user_name}
            </h3>
            <div style={{ fontSize: 13, color: 'var(--ax-text-muted)', marginBottom: 16 }}>
              User ID #{record.user_id}
            </div>

            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
              textAlign: 'left',
              padding: '16px 0',
              borderTop: '1px solid var(--ax-border, #e2e8f0)',
              borderBottom: '1px solid var(--ax-border, #e2e8f0)',
              marginBottom: 18,
            }}>
              <div>
                <div style={{ fontSize: 11, textTransform: 'uppercase', color: 'var(--ax-text-subtle)', fontWeight: 700 }}>Contact Number</div>
                <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--ax-text-strong)', marginTop: 2 }}>
                  {record.user_contact_no || '—'}
                </div>
              </div>

              <div>
                <div style={{ fontSize: 11, textTransform: 'uppercase', color: 'var(--ax-text-subtle)', fontWeight: 700 }}>Email Address</div>
                <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--ax-text-strong)', marginTop: 2, overflowWrap: 'anywhere' }}>
                  {record.user_email || '—'}
                </div>
              </div>

              <div>
                <div style={{ fontSize: 11, textTransform: 'uppercase', color: 'var(--ax-text-subtle)', fontWeight: 700 }}>Assigned Region</div>
                <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--ax-text-strong)', marginTop: 2 }}>
                  {[record.user_district, record.user_state].filter(Boolean).join(', ') || '—'}
                </div>
              </div>
            </div>

            <button
              type="button"
              className="ax-btn ax-btn--primary ax-btn--sm"
              onClick={() => navigate(`/dle/users/${record.user_id}`)}
              style={{ width: '100%', justifyContent: 'center', gap: 6, fontWeight: 600 }}
            >
              <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              <span>View User Profile & Docs</span>
            </button>
          </div>
        </div>

        {/* Right Column: Attendance & GPS Details (8 cols) */}
        <div style={{ gridColumn: 'span 8', display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Punch In & Punch Out Comparison Grid */}
          <div style={{
            background: 'var(--ax-surface-solid, #ffffff)',
            border: '1px solid var(--ax-border, #e2e8f0)',
            borderRadius: 14,
            padding: 22,
          }}>
            <h4 style={{ margin: '0 0 16px 0', fontSize: 15, fontWeight: 700, color: 'var(--ax-text-strong)' }}>
              Punch Time & Location Verification
            </h4>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
              {/* Punch In Box */}
              <div style={{
                borderRadius: 12,
                border: '1px solid #a7f3d0',
                background: '#f0fdf4',
                padding: 18,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ fontWeight: 800, color: '#047857', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      🟢 Punch In
                    </span>
                    <span style={{ fontWeight: 800, fontSize: 18, color: '#065f46' }}>
                      {formatTime(record.punch_in_at)}
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: '#065f46', opacity: 0.85 }}>
                    Timestamp: <strong>{record.punch_in_at || '—'}</strong>
                  </div>
                </div>

                {record.punch_in_latitude && record.punch_in_longitude ? (
                  <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px solid rgba(4, 120, 87, 0.15)' }}>
                    <div style={{ fontSize: 12, color: '#065f46', marginBottom: 8 }}>
                      GPS: <strong>{record.punch_in_latitude}, {record.punch_in_longitude}</strong>
                    </div>
                    <a
                      href={`https://www.google.com/maps?q=${record.punch_in_latitude},${record.punch_in_longitude}`}
                      target="_blank"
                      rel="noreferrer"
                      className="ax-btn ax-btn--sm"
                      style={{
                        width: '100%',
                        background: '#ffffff',
                        color: '#047857',
                        border: '1px solid #a7f3d0',
                        fontWeight: 700,
                        fontSize: 12,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 6,
                        textDecoration: 'none',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                      }}
                    >
                      <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                        <circle cx="12" cy="10" r="3" />
                      </svg>
                      <span>Open Punch In Map ↗</span>
                    </a>
                  </div>
                ) : (
                  <div style={{ fontSize: 12, color: '#64748b', marginTop: 14 }}>
                    GPS coordinates not available
                  </div>
                )}
              </div>

              {/* Punch Out Box */}
              <div style={{
                borderRadius: 12,
                border: '1px solid #bfdbfe',
                background: '#eff6ff',
                padding: 18,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ fontWeight: 800, color: '#1d4ed8', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      🔵 Punch Out
                    </span>
                    <span style={{ fontWeight: 800, fontSize: 18, color: '#1e40af' }}>
                      {record.punch_out_at ? formatTime(record.punch_out_at) : 'Still Open'}
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: '#1e40af', opacity: 0.85 }}>
                    Timestamp: <strong>{record.punch_out_at || 'Shift in progress (Pending)'}</strong>
                  </div>
                </div>

                {record.punch_out_latitude && record.punch_out_longitude ? (
                  <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px solid rgba(29, 78, 216, 0.15)' }}>
                    <div style={{ fontSize: 12, color: '#1e40af', marginBottom: 8 }}>
                      GPS: <strong>{record.punch_out_latitude}, {record.punch_out_longitude}</strong>
                    </div>
                    <a
                      href={`https://www.google.com/maps?q=${record.punch_out_latitude},${record.punch_out_longitude}`}
                      target="_blank"
                      rel="noreferrer"
                      className="ax-btn ax-btn--sm"
                      style={{
                        width: '100%',
                        background: '#ffffff',
                        color: '#1d4ed8',
                        border: '1px solid #bfdbfe',
                        fontWeight: 700,
                        fontSize: 12,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 6,
                        textDecoration: 'none',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                      }}
                    >
                      <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                        <circle cx="12" cy="10" r="3" />
                      </svg>
                      <span>Open Punch Out Map ↗</span>
                    </a>
                  </div>
                ) : (
                  <div style={{ fontSize: 12, color: '#64748b', marginTop: 14 }}>
                    {record.punch_out_at ? 'GPS coordinates not available' : 'Awaiting punch out from field'}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Shift Details Grid */}
          <div style={{
            background: 'var(--ax-surface-solid, #ffffff)',
            border: '1px solid var(--ax-border, #e2e8f0)',
            borderRadius: 14,
            padding: 22,
          }}>
            <h4 style={{ margin: '0 0 16px 0', fontSize: 15, fontWeight: 700, color: 'var(--ax-text-strong)' }}>
              Session Information
            </h4>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
              <InfoItem label="Attendance Date" value={formatDate(record.attendance_date)} sub={record.attendance_date} />
              <InfoItem label="Shift Duration" value={dur.text} sub={dur.isOngoing ? 'Currently ongoing' : 'Total hours logged'} />
              <InfoItem label="Punch In Time" value={formatTime(record.punch_in_at)} sub="Field start time" />
              <InfoItem label="Punch Out Time" value={formatTime(record.punch_out_at)} sub={record.punch_out_at ? 'Field exit time' : 'Pending'} />
              <InfoItem label="Auto Punched Out" value={record.punch_out_auto ? 'Yes (System Auto)' : 'No (Manual User Punch)'} />
              <InfoItem label="Created At" value={record.created_at ? new Date(record.created_at).toLocaleString('en-IN') : '—'} />
            </div>
          </div>

          {/* Field Location Hierarchy */}
          <div style={{
            background: 'var(--ax-surface-solid, #ffffff)',
            border: '1px solid var(--ax-border, #e2e8f0)',
            borderRadius: 14,
            padding: 22,
          }}>
            <h4 style={{ margin: '0 0 16px 0', fontSize: 15, fontWeight: 700, color: 'var(--ax-text-strong)' }}>
              Assigned Field Location Hierarchy
            </h4>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12 }}>
              <InfoItem label="State" value={record.user_state} />
              <InfoItem label="District" value={record.user_district} />
              <InfoItem label="Block" value={record.user_block} />
              <InfoItem label="Panchayat" value={record.user_panchayat} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DLEAttendanceDetail;
