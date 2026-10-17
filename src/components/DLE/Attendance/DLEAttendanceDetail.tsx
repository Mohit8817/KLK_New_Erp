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

const InfoCard = ({ label, value, sub, icon }: { label: string; value: string; sub?: string; icon?: React.ReactNode }) => (
  <div style={{
    padding: '14px 16px',
    background: 'var(--ax-surface-subtle, #f8fafc)',
    border: '1px solid var(--ax-border, #e2e8f0)',
    borderRadius: 10,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
  }}>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
      <span style={{
        fontSize: 11,
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        color: 'var(--ax-text-subtle)',
        fontWeight: 700,
      }}>
        {label}
      </span>
      {icon && <span style={{ color: 'var(--ax-text-subtle)' }}>{icon}</span>}
    </div>
    <div style={{
      color: 'var(--ax-text-strong)',
      fontSize: 15,
      fontWeight: 700,
      overflowWrap: 'anywhere',
    }}>
      {value || '—'}
    </div>
    {sub && (
      <div style={{ fontSize: 11.5, color: 'var(--ax-text-muted)', marginTop: 4 }}>
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
    <div>
      {/* Top Page Breadcrumb & Quick Actions */}
      <PageHead
        title="Attendance Session Details"
        subtitle={`Technician: ${record.user_name} · Date: ${formatDate(record.attendance_date)} · Record ID #${record.id}`}
        breadcrumbs={[
          { label: 'DLE Portal', href: '/dle/dashboard' },
          { label: 'Attendance', href: '/dle/attendance' },
          { label: `${record.user_name} (#${record.id})` },
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
            <button
              type="button"
              className="ax-btn ax-btn--primary ax-btn--sm"
              onClick={() => navigate(`/dle/users/${record.user_id}`)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 500 }}
            >
              <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              <span>View User Profile & Docs</span>
            </button>
          </div>
        }
      />

      {/* FULL-WIDTH HERO PROFILE & SHIFT BANNER */}
      <div style={{
        background: 'var(--ax-surface-solid, #ffffff)',
        border: '1px solid var(--ax-border, #e2e8f0)',
        borderRadius: 16,
        padding: '20px 24px',
        marginBottom: 20,
        boxShadow: '0 2px 6px rgba(0, 0, 0, 0.03)',
      }}>
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
          paddingBottom: 18,
          borderBottom: '1px solid var(--ax-border, #f1f5f9)',
        }}>
          {/* Technician Identity */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{
              width: 56,
              height: 56,
              borderRadius: 14,
              background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
              color: '#1d4ed8',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 20,
              fontWeight: 800,
              flexShrink: 0,
              boxShadow: '0 2px 8px rgba(37, 99, 235, 0.15)',
            }}>
              {getInitials(record.user_name)}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <h2 style={{ margin: 0, fontSize: 19, fontWeight: 800, color: 'var(--ax-text-strong)' }}>
                  {record.user_name}
                </h2>
                <span style={{
                  padding: '2px 8px',
                  borderRadius: 6,
                  background: '#f1f5f9',
                  color: '#475569',
                  fontSize: 11.5,
                  fontWeight: 700,
                }}>
                  User #{record.user_id}
                </span>
                <span style={{
                  padding: '2px 8px',
                  borderRadius: 6,
                  background: '#eff6ff',
                  color: '#2563eb',
                  fontSize: 11.5,
                  fontWeight: 700,
                }}>
                  Company: {record.company_id}
                </span>
              </div>
              <div style={{ fontSize: 13, color: 'var(--ax-text-muted)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <span>📞 {record.user_contact_no || 'No contact'}</span>
                <span style={{ color: 'var(--ax-border, #cbd5e1)' }}>•</span>
                <span>✉️ {record.user_email || 'No email registered'}</span>
                <span style={{ color: 'var(--ax-border, #cbd5e1)' }}>•</span>
                <span>📍 {[record.user_district, record.user_state].filter(Boolean).join(', ') || '—'}</span>
              </div>
            </div>
          </div>

          {/* Status & Live Shift Counter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 14px',
              borderRadius: 20,
              background: status.bg,
              border: `1px solid ${status.border}`,
              color: status.color,
              fontSize: 13,
              fontWeight: 700,
            }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: status.dotColor }} />
              <span>{status.label}</span>
            </div>

            <div style={{
              padding: '6px 14px',
              borderRadius: 20,
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              color: '#0f172a',
              fontSize: 13,
              fontWeight: 700,
            }}>
              Duration: <span style={{ color: dur.isOngoing ? '#059669' : '#2563eb' }}>{dur.text}</span>
            </div>

            {record.punch_out_auto && (
              <div style={{
                padding: '6px 14px',
                borderRadius: 20,
                background: '#fffbeb',
                color: '#b45309',
                fontSize: 12.5,
                fontWeight: 700,
                border: '1px solid #fde68a',
              }}>
                ⚠️ Auto Closed by System
              </div>
            )}
          </div>
        </div>

        {/* Quick Horizontal Metrics Row */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 14,
          paddingTop: 16,
        }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ax-text-subtle)' }}>Attendance Date</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--ax-text-strong)', marginTop: 2 }}>{formatDate(record.attendance_date)}</div>
          </div>

          <div>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ax-text-subtle)' }}>Punch In Time</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#047857', marginTop: 2 }}>{formatTime(record.punch_in_at)}</div>
          </div>

          <div>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ax-text-subtle)' }}>Punch Out Time</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: record.punch_out_at ? '#1d4ed8' : '#64748b', marginTop: 2 }}>
              {record.punch_out_at ? formatTime(record.punch_out_at) : 'Still Open'}
            </div>
          </div>

          <div>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ax-text-subtle)' }}>Field Region</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--ax-text-strong)', marginTop: 2 }}>
              {[record.user_block, record.user_district].filter(Boolean).join(', ') || '—'}
            </div>
          </div>

          <div>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ax-text-subtle)' }}>Panchayat</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--ax-text-strong)', marginTop: 2 }}>
              {record.user_panchayat || '—'}
            </div>
          </div>
        </div>
      </div>

      {/* TWO EQUAL BALANCED COLUMNS (6 COLS & 6 COLS) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(460px, 1fr))',
        gap: 20,
      }}>
        {/* COLUMN 1: PUNCH TIME & GPS VERIFICATION */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Card 1: Punch In Verification */}
          <div style={{
            background: 'var(--ax-surface-solid, #ffffff)',
            border: '1px solid #a7f3d0',
            borderRadius: 16,
            padding: 22,
            boxShadow: '0 2px 6px rgba(0, 0, 0, 0.02)',
            position: 'relative',
            overflow: 'hidden',
          }}>
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: 4,
              background: 'linear-gradient(90deg, #10b981, #059669)',
            }} />

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#10b981' }} />
                <h4 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#065f46' }}>
                  Punch In Verification
                </h4>
              </div>
              <span style={{
                fontSize: 16,
                fontWeight: 800,
                color: '#047857',
                background: '#ecfdf5',
                padding: '4px 10px',
                borderRadius: 8,
                border: '1px solid #a7f3d0',
              }}>
                {formatTime(record.punch_in_at)}
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
              <div style={{ fontSize: 13, color: '#065f46' }}>
                <span style={{ color: 'var(--ax-text-subtle)' }}>Exact Timestamp: </span>
                <strong>{record.punch_in_at || '—'}</strong>
              </div>

              <div style={{
                padding: '12px 14px',
                borderRadius: 10,
                background: '#f0fdf4',
                border: '1px solid #d1fae5',
                fontSize: 13,
                color: '#065f46',
              }}>
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: '#059669', marginBottom: 2 }}>
                  GPS Coordinates
                </div>
                {record.punch_in_latitude && record.punch_in_longitude ? (
                  <div style={{ fontWeight: 700, fontSize: 14 }}>
                    Latitude: {record.punch_in_latitude} · Longitude: {record.punch_in_longitude}
                  </div>
                ) : (
                  <div style={{ color: '#64748b' }}>GPS coordinates not recorded for this punch</div>
                )}
              </div>
            </div>

            {record.punch_in_latitude && record.punch_in_longitude && (
              <a
                href={`https://www.google.com/maps?q=${record.punch_in_latitude},${record.punch_in_longitude}`}
                target="_blank"
                rel="noreferrer"
                className="ax-btn ax-btn--sm"
                style={{
                  width: '100%',
                  background: '#10b981',
                  color: '#ffffff',
                  border: 'none',
                  fontWeight: 700,
                  fontSize: 13,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  padding: '9px 16px',
                  borderRadius: 8,
                  textDecoration: 'none',
                  boxShadow: '0 2px 4px rgba(16, 185, 129, 0.25)',
                }}
              >
                <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                <span>Open Punch In Location on Google Maps ↗</span>
              </a>
            )}
          </div>

          {/* Card 2: Punch Out Verification */}
          <div style={{
            background: 'var(--ax-surface-solid, #ffffff)',
            border: '1px solid #bfdbfe',
            borderRadius: 16,
            padding: 22,
            boxShadow: '0 2px 6px rgba(0, 0, 0, 0.02)',
            position: 'relative',
            overflow: 'hidden',
          }}>
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: 4,
              background: 'linear-gradient(90deg, #3b82f6, #1d4ed8)',
            }} />

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#3b82f6' }} />
                <h4 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#1e40af' }}>
                  Punch Out Verification
                </h4>
              </div>
              <span style={{
                fontSize: 16,
                fontWeight: 800,
                color: record.punch_out_at ? '#1d4ed8' : '#047857',
                background: record.punch_out_at ? '#eff6ff' : '#ecfdf5',
                padding: '4px 10px',
                borderRadius: 8,
                border: `1px solid ${record.punch_out_at ? '#bfdbfe' : '#a7f3d0'}`,
              }}>
                {record.punch_out_at ? formatTime(record.punch_out_at) : 'Still On Duty'}
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
              <div style={{ fontSize: 13, color: '#1e40af' }}>
                <span style={{ color: 'var(--ax-text-subtle)' }}>Exact Timestamp: </span>
                <strong>{record.punch_out_at || 'Shift in progress (Pending)'}</strong>
              </div>

              <div style={{
                padding: '12px 14px',
                borderRadius: 10,
                background: '#eff6ff',
                border: '1px solid #dbeafe',
                fontSize: 13,
                color: '#1e40af',
              }}>
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: '#2563eb', marginBottom: 2 }}>
                  GPS Coordinates
                </div>
                {record.punch_out_latitude && record.punch_out_longitude ? (
                  <div style={{ fontWeight: 700, fontSize: 14 }}>
                    Latitude: {record.punch_out_latitude} · Longitude: {record.punch_out_longitude}
                  </div>
                ) : (
                  <div style={{ color: '#64748b' }}>
                    {record.punch_out_at ? 'GPS coordinates not recorded' : 'Awaiting technician punch out'}
                  </div>
                )}
              </div>
            </div>

            {record.punch_out_latitude && record.punch_out_longitude ? (
              <a
                href={`https://www.google.com/maps?q=${record.punch_out_latitude},${record.punch_out_longitude}`}
                target="_blank"
                rel="noreferrer"
                className="ax-btn ax-btn--sm"
                style={{
                  width: '100%',
                  background: '#2563eb',
                  color: '#ffffff',
                  border: 'none',
                  fontWeight: 700,
                  fontSize: 13,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  padding: '9px 16px',
                  borderRadius: 8,
                  textDecoration: 'none',
                  boxShadow: '0 2px 4px rgba(37, 99, 235, 0.25)',
                }}
              >
                <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                <span>Open Punch Out Location on Google Maps ↗</span>
              </a>
            ) : (
              <div style={{
                textAlign: 'center',
                padding: '8px',
                fontSize: 12,
                color: 'var(--ax-text-muted)',
                background: '#f8fafc',
                borderRadius: 8,
              }}>
                {record.punch_out_at ? 'No GPS location available' : 'Active shift — technician has not yet punched out'}
              </div>
            )}
          </div>
        </div>

        {/* COLUMN 2: SESSION INFORMATION & FIELD HIERARCHY */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Card 3: Session & Shift Information */}
          <div style={{
            background: 'var(--ax-surface-solid, #ffffff)',
            border: '1px solid var(--ax-border, #e2e8f0)',
            borderRadius: 16,
            padding: 22,
            boxShadow: '0 2px 6px rgba(0, 0, 0, 0.02)',
          }}>
            <h4 style={{ margin: '0 0 14px 0', fontSize: 16, fontWeight: 800, color: 'var(--ax-text-strong)' }}>
              Shift & Session Analytics
            </h4>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
              <InfoCard
                label="Attendance Date"
                value={formatDate(record.attendance_date)}
                sub={`Raw date: ${record.attendance_date}`}
              />
              <InfoCard
                label="Total Duration"
                value={dur.text}
                sub={dur.isOngoing ? 'Currently ongoing live' : 'Full recorded shift'}
              />
              <InfoCard
                label="Punch In Time"
                value={formatTime(record.punch_in_at)}
                sub="Field shift start"
              />
              <InfoCard
                label="Punch Out Time"
                value={formatTime(record.punch_out_at)}
                sub={record.punch_out_at ? 'Field shift exit' : 'Pending punch out'}
              />
              <InfoCard
                label="Auto Closed"
                value={record.punch_out_auto ? 'Yes (System Auto)' : 'No (Manual User Punch)'}
                sub="Closure mechanism"
              />
              <InfoCard
                label="Record ID"
                value={`#${record.id}`}
                sub={`User #${record.user_id}`}
              />
              <InfoCard
                label="Record Created At"
                value={record.created_at ? new Date(record.created_at).toLocaleString('en-IN') : '—'}
                sub="Server creation timestamp"
              />
              <InfoCard
                label="Record Updated At"
                value={record.updated_at ? new Date(record.updated_at).toLocaleString('en-IN') : '—'}
                sub="Last modification time"
              />
            </div>
          </div>

          {/* Card 4: Assigned Field Location Hierarchy */}
          <div style={{
            width:'100%',
            background: 'var(--ax-surface-solid, #ffffff)',
            border: '1px solid var(--ax-border, #e2e8f0)',
            borderRadius: 16,
            padding: 22,
            boxShadow: '0 2px 6px rgba(0, 0, 0, 0.02)',
          }}>
            <h4 style={{ margin: '0 0 14px 0', fontSize: 16, fontWeight: 800, color: 'var(--ax-text-strong)' }}>
              Assigned Field Location Hierarchy
            </h4>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
              <InfoCard
                label="State"
                value={record.user_state}
                sub="Provincial jurisdiction"
              />
              <InfoCard
                label="District"
                value={record.user_district}
                sub="District headquarters"
              />
              <InfoCard
                label="Block"
                value={record.user_block}
                sub="Sub-district block"
              />
              <InfoCard
                label="Panchayat"
                value={record.user_panchayat}
                sub="Local gram panchayat"
              />
            </div>

            <div style={{
              marginTop: 14,
              padding: '12px 14px',
              borderRadius: 10,
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: 12.5,
            }}>
              <span style={{ color: 'var(--ax-text-subtle)' }}>
                Field Assignment: <strong>{[record.user_panchayat, record.user_block, record.user_district, record.user_state].filter(Boolean).join(', ')}</strong>
              </span>
              <span style={{
                background: '#e0f2fe',
                color: '#0369a1',
                padding: '2px 8px',
                borderRadius: 6,
                fontWeight: 700,
                fontSize: 11,
              }}>
                Verified Zone
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DLEAttendanceDetail;
