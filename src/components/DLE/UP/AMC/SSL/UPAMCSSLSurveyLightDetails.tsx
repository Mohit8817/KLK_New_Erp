import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { PageHead } from '../../../../shell/PageHead';
import { dleService } from '../../../../../services/dleServices';

const RESPONSIVE_CSS = `
  .ax-detail-page {
    width: 100%;
    max-width: 100%;
    overflow-x: hidden;
    box-sizing: border-box;
  }
  .ax-detail-page .ax-card {
    overflow: hidden;
  }
  .ax-detail-page .ax-card__header {
    display: flex;
    flex-direction: row;
    align-items: flex-start;
    justify-content: space-between;
    gap: var(--ax-space-3);
    flex-wrap: wrap;
  }
  .ax-detail-page .ax-detail-badges {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--ax-space-2);
  }
  .ax-detail-page .ax-detail-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: var(--ax-space-3);
  }
  .ax-detail-page .ax-photos-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: var(--ax-space-4);
  }
  .ax-detail-page .ax-photo-card {
    overflow: hidden;
    border: 1px solid var(--ax-border);
    border-radius: var(--ax-radius-md);
    background: var(--ax-surface-subtle);
    display: flex;
    flex-direction: column;
  }
  .ax-detail-page .ax-photo-img-wrap {
    position: relative;
    height: 220px;
    background: #090d16;
    cursor: pointer;
  }

  /* Tablet: 641px - 1024px */
  @media (max-width: 1024px) {
    .ax-detail-page .ax-detail-grid {
      grid-template-columns: repeat(3, 1fr);
    }
  }

  /* Small Tablet / Big Phones: 481px - 768px */
  @media (max-width: 768px) {
    .ax-detail-page .ax-card__header {
      flex-direction: column;
      align-items: stretch;
      gap: var(--ax-space-3);
    }
    .ax-detail-page .ax-detail-grid {
      grid-template-columns: repeat(2, 1fr);
      gap: var(--ax-space-2);
    }
    .ax-detail-page .ax-photos-grid {
      grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
      gap: var(--ax-space-3);
    }
    .ax-detail-page .ax-photo-img-wrap {
      height: 190px;
    }
  }

  /* Mobile Phone: <= 480px */
  @media (max-width: 480px) {
    .ax-detail-page {
      padding-inline: 0 !important;
    }
    .ax-detail-page .ax-card__body {
      padding: var(--ax-space-3) !important;
    }
    .ax-detail-page .ax-card__header {
      padding: var(--ax-space-3) var(--ax-space-3) var(--ax-space-2) !important;
    }
    .ax-detail-page .ax-detail-grid {
      grid-template-columns: 1fr;
      gap: var(--ax-space-2);
    }
    .ax-detail-page .ax-photos-grid {
      grid-template-columns: 1fr;
      gap: var(--ax-space-3);
    }
    .ax-detail-page .ax-photo-img-wrap {
      height: 210px;
    }
    .ax-detail-page .ax-detail-badges {
      gap: 6px;
    }
    .ax-detail-page .ax-detail-badges .ax-badge {
      font-size: 11px;
      padding: 3px 8px;
    }
    .ax-detail-page .ax-page-head .ax-btn {
      width: 100%;
      justify-content: center;
    }
  }
`;

const InfoCard = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div
    style={{
      padding: 'var(--ax-space-3) var(--ax-space-4)',
      background: 'var(--ax-surface-subtle)',
      border: '1px solid var(--ax-border)',
      borderRadius: 'var(--ax-radius-md)',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      minWidth: 0,
    }}
  >
    <div
      style={{
        fontSize: 'var(--ax-text-xs)',
        textTransform: 'uppercase',
        letterSpacing: '.06em',
        color: 'var(--ax-text-subtle)',
        marginBottom: 4,
        fontWeight: 600,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </div>
    <div
      style={{
        color: 'var(--ax-text-strong)',
        fontSize: 'var(--ax-text-sm)',
        fontWeight: 600,
        overflowWrap: 'anywhere',
        wordBreak: 'break-word',
      }}
    >
      {value || '—'}
    </div>
  </div>
);

export default function UPAMCSSLSurveyLightDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [raw, setRaw] = useState<any>(location.state?.row || null);
  const [loading, setLoading] = useState(!location.state?.row);
  const [error, setError] = useState<string | null>(null);
  const [activePhoto, setActivePhoto] = useState<{ url: string; label: string } | null>(null);

  const str = (v: unknown) => (v === null || v === undefined ? '' : String(v).trim());

  const R2_BASE = ((import.meta.env.VITE_R2_PUBLIC_URL as string | undefined) ?? '').replace(/\/+$/, '');
  const UPLOADS_BASE = ((import.meta.env.VITE_UPLOADS_BASE_URL as string | undefined) ?? '').replace(/\/+$/, '');
  const resolveImg = (u: string): string => {
    if (!u) return '';
    if (/^(https?:)?\/\//i.test(u) || u.startsWith('data:')) return u;
    if (u.startsWith('r2:')) return R2_BASE ? `${R2_BASE}/${u.slice(3).replace(/^\/+/, '')}` : `/uploads/${u.slice(3).replace(/^\/+/, '')}`;
    if (u.startsWith('/')) return `${UPLOADS_BASE}${u}`;
    return R2_BASE ? `${R2_BASE}/${u}` : `${UPLOADS_BASE}/${u}`;
  };

  const fmtDate = (v: unknown): string => {
    const s = str(v);
    if (!s) return '';
    const m = s.match(/^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2}))?/);
    if (m) {
      const d = `${m[3]}-${m[2]}-${m[1]}`;
      return m[4] ? `${d}, ${m[4]}:${m[5]}` : d;
    }
    return s;
  };

  const load = useCallback(async (signal?: AbortSignal) => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let res: any;
      try {
        res = await dleService.getUpAmcLight({ id }, signal);
      } catch {
        res = await dleService.getUpAmcLightList(signal);
      }

      let list = Array.isArray(res) ? res : res?.data ?? res?.rows ?? res?.records ?? res;
      if (list?.data && Array.isArray(list.data)) list = list.data;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let found: any = null;
      if (Array.isArray(list)) {
        found = list.find((item: any) => String(item.id) === String(id) || String(item.ssl_id) === String(id) || String(item.unique_id) === String(id)) || list[0];
      } else {
        found = list;
      }

      if (!found) throw new Error('Survey record not found');
      setRaw(found);
    } catch (e) {
      if ((e as Error).name === 'AbortError') return;
      setError((e as Error).message || 'Failed to load survey details');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (!raw) {
      const ctrl = new AbortController();
      load(ctrl.signal);
      return () => ctrl.abort();
    }
  }, [raw, load]);

  // Normalized data object supporting both API response and row state
  const data = useMemo(() => {
    if (!raw) return null;
    const r = raw;
    const lw = r.light_working !== undefined
      ? (r.light_working === '1' || r.light_working === 1 || r.light_working === true || String(r.light_working).toLowerCase() === 'working')
      : Boolean(r.lightWorking);
    const cr = r.complaint_raised !== undefined
      ? (r.complaint_raised === 1 || r.complaint_raised === '1' || String(r.complaint_raised).toLowerCase() === 'raised')
      : (r.complaint === 'Raised');
    const ap = r.approval_status !== undefined
      ? (r.approval_status === 1 || r.approval_status === '1' || r.approval === 'Approved' ? 'Approved' : r.approval_status === 2 || r.approval_status === '2' || r.approval === 'Rejected' ? 'Rejected' : 'Pending')
      : str(r.approval || 'Pending');

    return {
      id: str(r.id),
      companyId: str(r.company_id || r.companyId || 'KLK19022025'),
      userId: str(r.user_id || r.userId),
      state: str(r.state || 'Uttar Pradesh'),
      district: str(r.district || r.district_name),
      block: str(r.block || r.block_name),
      panchayat: str(r.panchayat || r.panchayat_name),
      wardNo: str(r.ward_no || r.ward || r.wardNo),
      volume: str(r.volume),
      sslId: str(r.ssl_id || r.unique_id || r.sslId || r.id),
      poleNo: str(r.pole_no || r.pole || r.poleNo),
      amcDate: fmtDate(r.amc_date || r.amcDate),
      nextAmcDate: fmtDate(r.next_amc_date || r.nextAmcDate),
      periodStart: fmtDate(r.period_start || r.periodStart),
      periodEnd: fmtDate(r.period_end || r.periodEnd),
      quarterNo: str(r.quarter_no || r.quarter || r.quarterNo || '1'),
      beneficiaryName: str(r.beneficiary_name || r.beneficiary || r.beneficiaryName),
      beneficiaryContact: str(r.beneficiary_contact || r.contact || r.beneficiaryContact),
      lightWorking: lw,
      complaintRaised: cr,
      complaintRef: str(r.complaint_ref || r.complaintRef),
      latitude: str(r.latitude || r.lat),
      longitude: str(r.longitude || r.lng),
      remarks: str(r.remarks),
      approvalStatus: ap,
      approvalDate: fmtDate(r.approval_date || r.approvalDate),
      approvalRemarks: str(r.approval_remarks || r.approvalRemarks),
      approvalBy: str(r.approval_by || r.approvalBy),
      createdAt: fmtDate(r.created_at || r.createdAt),
      updatedAt: fmtDate(r.updated_at || r.updatedAt),
      image1: resolveImg(str(r.image_1 || r.image1 || r.light_image)),
      image2: resolveImg(str(r.image_2 || r.image2 || r.after_image)),
    };
  }, [raw]);

  // Collect photos
  const images = useMemo(() => {
    if (!data) return [];
    const list: Array<{ label: string; url: string }> = [];
    if (data.image1) list.push({ label: 'Survey Photo 1 (Light & Pole Installation)', url: data.image1 });
    if (data.image2) list.push({ label: 'Survey Photo 2 (Working Light & Environment)', url: data.image2 });

    if (Array.isArray(raw?.images)) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      raw.images.forEach((im: any, idx: number) => {
        const u = resolveImg(typeof im === 'string' ? im : im?.url || im?.path);
        if (u && !list.some((x) => x.url === u)) {
          list.push({ label: str(im?.label) || `Survey Photo ${idx + 1}`, url: u });
        }
      });
    }
    return list;
  }, [data, raw]);

  return (
    <div className="ax-detail-page">
      <style>{RESPONSIVE_CSS}</style>

      <PageHead
        title={data ? `SSL ${data.sslId}` : 'Survey Light Details'}
        subtitle={
          data
            ? `${data.beneficiaryName || 'Beneficiary'} · ${[data.wardNo, data.panchayat, data.block, data.district, data.state].filter(Boolean).join(', ')}`
            : 'Detailed UP AMC light survey verification'
        }
        actions={
          <button
            type="button"
            className="ax-btn ax-btn--secondary"
            onClick={() => navigate('/dle/up/ssl/amc/view-verify-light')}
          >
            <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            <span style={{ marginLeft: 6 }}>Back to List</span>
          </button>
        }
      />

      <div className="ax-dash-grid">
        {loading ? (
          <div className="ax-col--12" style={{ padding: 'var(--ax-space-10)', textAlign: 'center' }}>
            <div className="ax-spinner ax-spinner--primary" />
            <div style={{ marginTop: 'var(--ax-space-4)', color: 'var(--ax-text-muted)' }}>Loading survey details…</div>
          </div>
        ) : error ? (
          <div className="ax-col--12">
            <div className="ax-alert ax-alert--danger" role="alert">
              <span>{error}</span>
              <button type="button" className="ax-btn ax-btn--secondary ax-btn--sm" onClick={() => load()}>Retry</button>
            </div>
          </div>
        ) : data ? (
          /* ═══════ SINGLE UNIFIED CARD STRUCTURE ═══════ */
          <section className="ax-card ax-col--12" role="region" aria-label="Survey Light Details">
            {/* Unified Card Header with Title and Status Badges */}
            <div className="ax-card__header">
              <div className="ax-card__titles">
                <h2 className="ax-card__title">SSL {data.sslId} — Survey Record</h2>
                <p className="ax-card__subtitle">Field inspection, beneficiary territory and equipment photos</p>
              </div>

              <div className="ax-detail-badges">
                <span className="ax-badge ax-badge--soft ax-badge--pill">
                  <span className="ax-badge__dot" />
                  AMC: {data.amcDate || '—'}
                </span>

                <span className="ax-badge ax-badge--soft ax-badge--pill">
                  <span className="ax-badge__dot" />
                  Next AMC: {data.nextAmcDate || '—'}
                </span>

                <span className="ax-badge ax-badge--soft ax-badge--pill">
                  Quarter {data.quarterNo}
                </span>

                {data.beneficiaryContact && (
                  <span className="ax-badge ax-badge--soft ax-badge--pill">
                    📞 {data.beneficiaryContact}
                  </span>
                )}

                <span className={`ax-badge ax-badge--soft ax-badge--pill ${data.lightWorking ? 'ax-badge--success' : 'ax-badge--danger'}`}>
                  <span className="ax-badge__dot" />
                  {data.lightWorking ? 'Light Working' : 'Not Working'}
                </span>

                <span className={`ax-badge ax-badge--soft ax-badge--pill ${data.complaintRaised ? 'ax-badge--danger' : 'ax-badge--neutral'}`}>
                  <span className="ax-badge__dot" />
                  {data.complaintRaised ? 'Complaint Raised' : 'No Complaint'}
                </span>

                <span className={`ax-badge ax-badge--soft ax-badge--pill ${data.approvalStatus === 'Approved' ? 'ax-badge--success' : data.approvalStatus === 'Rejected' ? 'ax-badge--danger' : 'ax-badge--warning'}`}>
                  <span className="ax-badge__dot" />
                  {data.approvalStatus}
                </span>
              </div>
            </div>

            {/* Unified Card Body */}
            <div className="ax-card__body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--ax-space-6)' }}>
              
              {/* Section 1: Consumer & Location */}
              <div>
                <h3
                  style={{
                    fontSize: 'var(--ax-text-xs)',
                    fontWeight: 700,
                    color: 'var(--ax-text-strong)',
                    textTransform: 'uppercase',
                    letterSpacing: '.06em',
                    marginBottom: 'var(--ax-space-3)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--ax-space-2)',
                  }}
                >
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--ax-accent)', display: 'inline-block' }} />
                  Consumer &amp; Location Details
                </h3>
                <div className="ax-detail-grid">
                  <InfoCard
                    label="SSL / Unique ID"
                    value={<span style={{ color: 'var(--ax-accent)', fontFamily: 'monospace' }}>{data.sslId}</span>}
                  />
                  <InfoCard label="Beneficiary Name" value={data.beneficiaryName} />
                  <InfoCard label="Beneficiary Contact" value={data.beneficiaryContact} />
                  <InfoCard label="District" value={data.district} />
                  <InfoCard label="Block" value={data.block} />
                  <InfoCard label="Panchayat" value={data.panchayat} />
                  <InfoCard label="Ward Number" value={data.wardNo} />
                  <InfoCard
                    label="Pole Number"
                    value={<span style={{ color: 'var(--ax-accent)', fontWeight: 700 }}>Pole {data.poleNo || '—'}</span>}
                  />
                  <InfoCard label="State" value={data.state} />
                </div>
              </div>

              {/* Internal Divider */}
              <hr style={{ border: 0, borderTop: '1px solid var(--ax-border)', margin: 0 }} />

              {/* Section 2: AMC & Maintenance Details */}
              <div>
                <h3
                  style={{
                    fontSize: 'var(--ax-text-xs)',
                    fontWeight: 700,
                    color: 'var(--ax-text-strong)',
                    textTransform: 'uppercase',
                    letterSpacing: '.06em',
                    marginBottom: 'var(--ax-space-3)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--ax-space-2)',
                  }}
                >
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--ax-accent)', display: 'inline-block' }} />
                  AMC &amp; Maintenance Details
                </h3>
                <div className="ax-detail-grid">
                  <InfoCard label="AMC Date" value={data.amcDate} />
                  <InfoCard label="Next AMC Date" value={data.nextAmcDate} />
                  <InfoCard label="Quarter Number" value={`Quarter ${data.quarterNo}`} />
                  <InfoCard
                    label="Warranty / Period"
                    value={data.periodStart && data.periodEnd ? `${data.periodStart} to ${data.periodEnd}` : '—'}
                  />
                  <InfoCard
                    label="Company ID"
                    value={<span style={{ fontFamily: 'monospace' }}>{data.companyId}</span>}
                  />
                  <InfoCard label="Surveyor User ID" value={data.userId ? `User #${data.userId}` : '—'} />
                  <InfoCard label="Complaint Reference" value={data.complaintRef || 'None'} />
                  <InfoCard label="Survey Remarks" value={data.remarks || 'No remarks recorded'} />
                  <InfoCard
                    label="Light Working"
                    value={
                      <span className={`ax-badge ax-badge--soft ax-badge--sm ${data.lightWorking ? 'ax-badge--success' : 'ax-badge--danger'}`}>
                        {data.lightWorking ? 'Working' : 'Not Working'}
                      </span>
                    }
                  />
                </div>
              </div>

              {/* Internal Divider */}
              <hr style={{ border: 0, borderTop: '1px solid var(--ax-border)', margin: 0 }} />

              {/* Section 3: GPS & Timestamps */}
              <div>
                <h3
                  style={{
                    fontSize: 'var(--ax-text-xs)',
                    fontWeight: 700,
                    color: 'var(--ax-text-strong)',
                    textTransform: 'uppercase',
                    letterSpacing: '.06em',
                    marginBottom: 'var(--ax-space-3)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--ax-space-2)',
                  }}
                >
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--ax-accent)', display: 'inline-block' }} />
                  Visit GPS &amp; Timestamps
                </h3>
                <div className="ax-detail-grid">
                  <InfoCard
                    label="GPS Coordinates"
                    value={
                      data.latitude && data.longitude ? (
                        <a
                          href={`https://www.google.com/maps?q=${data.latitude},${data.longitude}`}
                          target="_blank"
                          rel="noreferrer"
                          style={{ color: 'var(--ax-accent)', textDecoration: 'none' }}
                        >
                          {data.latitude}, {data.longitude} ↗
                        </a>
                      ) : (
                        '—'
                      )
                    }
                  />
                  <InfoCard label="Record Created At" value={data.createdAt} />
                  <InfoCard label="Last Updated At" value={data.updatedAt} />
                  <InfoCard label="Approval Status" value={data.approvalStatus} />
                </div>
              </div>

              {/* Internal Divider */}
              <hr style={{ border: 0, borderTop: '1px solid var(--ax-border)', margin: 0 }} />

              {/* Section 4: Survey Photos */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--ax-space-3)', flexWrap: 'wrap', gap: 6 }}>
                  <h3
                    style={{
                      fontSize: 'var(--ax-text-xs)',
                      fontWeight: 700,
                      color: 'var(--ax-text-strong)',
                      textTransform: 'uppercase',
                      letterSpacing: '.06em',
                      margin: 0,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'var(--ax-space-2)',
                    }}
                  >
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--ax-accent)', display: 'inline-block' }} />
                    Survey Photos ({images.length})
                  </h3>
                  <span style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-muted)' }}>Tap any photo to view full size</span>
                </div>

                {images.length > 0 ? (
                  <div className="ax-photos-grid">
                    {images.map((im, idx) => (
                      <div key={im.url + idx} className="ax-photo-card">
                        <div
                          style={{
                            padding: 'var(--ax-space-2) var(--ax-space-3)',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            borderBottom: '1px solid var(--ax-border)',
                          }}
                        >
                          <span style={{ fontSize: 'var(--ax-text-xs)', fontWeight: 600, color: 'var(--ax-text-strong)' }}>
                            {im.label}
                          </span>
                          <span className="ax-badge ax-badge--soft ax-badge--xs">Photo {idx + 1}</span>
                        </div>
                        <div
                          className="ax-photo-img-wrap"
                          onClick={() => setActivePhoto(im)}
                          title="Click to zoom photo"
                        >
                          <img
                            src={im.url}
                            alt={im.label}
                            loading="lazy"
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            onError={(e) => {
                              // If image fails, show placeholder background
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                          <div
                            style={{
                              position: 'absolute',
                              right: 8,
                              bottom: 8,
                              background: 'rgba(0,0,0,0.65)',
                              color: '#fff',
                              borderRadius: 'var(--ax-radius-pill)',
                              padding: '2px 8px',
                              fontSize: '11px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 4,
                            }}
                          >
                            <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                              <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
                            </svg>
                            Zoom
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div
                    style={{
                      padding: 'var(--ax-space-6)',
                      background: 'var(--ax-surface-subtle)',
                      borderRadius: 'var(--ax-radius-md)',
                      textAlign: 'center',
                      color: 'var(--ax-text-muted)',
                      border: '1px dashed var(--ax-border)',
                      fontSize: 'var(--ax-text-sm)',
                    }}
                  >
                    No survey photos uploaded for this record
                  </div>
                )}
              </div>

            </div>
          </section>
        ) : null}
      </div>

      {/* Photo Lightbox Modal */}
      {activePhoto && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setActivePhoto(null)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            background: 'rgba(0, 0, 0, 0.85)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 'var(--ax-space-4)',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'relative',
              maxWidth: '92vw',
              maxHeight: '88vh',
              display: 'flex',
              flexDirection: 'column',
              background: 'var(--ax-surface-solid)',
              borderRadius: 'var(--ax-radius-lg)',
              overflow: 'hidden',
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.5)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: 'var(--ax-space-3) var(--ax-space-4)',
                borderBottom: '1px solid var(--ax-border)',
              }}
            >
              <span style={{ fontWeight: 600, fontSize: 'var(--ax-text-sm)', color: 'var(--ax-text-strong)' }}>
                {activePhoto.label}
              </span>
              <button
                type="button"
                className="ax-btn ax-btn--ghost ax-btn--icon ax-btn--sm"
                onClick={() => setActivePhoto(null)}
                aria-label="Close"
              >
                ✕
              </button>
            </div>
            <div style={{ flex: 1, minHeight: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#000', overflow: 'hidden' }}>
              <img
                src={activePhoto.url}
                alt={activePhoto.label}
                style={{ maxWidth: '100%', maxHeight: '78vh', objectFit: 'contain' }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
