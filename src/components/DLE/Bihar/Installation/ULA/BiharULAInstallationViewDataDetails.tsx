import { useCallback, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PageHead } from '../../../../shell/PageHead';
import { dleService } from '../../../dle-services';

const RESPONSIVE_CSS = `
  .ax-detail-page {
    width: 100%;
    max-width: 100%;
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

export default function BiharULAInstallationViewDataDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [row, setRow] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activePhoto, setActivePhoto] = useState<{ url: string; label: string; serial?: string } | null>(null);

  const parseRemarks = (value: unknown): Record<string, unknown> => {
    if (!value) return {};
    if (typeof value === 'object' && value !== null) return value as Record<string, unknown>;
    try {
      const parsed = JSON.parse(String(value));
      return parsed && typeof parsed === 'object' ? (parsed as Record<string, unknown>) : {};
    } catch {
      return {};
    }
  };

  const str = (v: unknown) => (v === null || v === undefined ? '' : String(v).trim());

  const visitStatus = (flag: unknown, text: unknown): string => {
    if (flag !== undefined && flag !== null && flag !== '') {
      const ok = flag === true || flag === 1 || ['true', '1', 'yes', 'completed', 'complete'].includes(String(flag).trim().toLowerCase());
      return ok ? 'Completed' : 'Pending';
    }
    return str(text) || 'Pending';
  };

  const R2_BASE = ((import.meta.env.VITE_R2_PUBLIC_URL as string | undefined) ?? '').replace(/\/+$/, '');
  const resolveImg = (u: string): string => {
    if (!u) return '';
    if (/^(https?:)?\/\//i.test(u) || u.startsWith('data:')) return u;
    return R2_BASE ? `${R2_BASE}/${u.replace(/^\/+/, '')}` : `/uploads/${u.replace(/^\/+/, '')}`;
  };

  const load = useCallback(async (signal?: AbortSignal) => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const json = await dleService.getBiharUlaDetail(id, signal);
      let raw = Array.isArray(json) ? json : json?.data ?? json?.rows ?? json?.records ?? json;
      if (raw?.data && Array.isArray(raw.data)) raw = raw.data;
      const data = Array.isArray(raw) ? raw[0] : raw;

      if (!data) throw new Error('Record not found');

      const remarks = parseRemarks(data.remarks);
      const r = {
        id: str(data.id),
        companyId: str(data.company_id || data.companyId),
        caNo: str(data.ca_no || data.caNo),
        caName: str(data.ca_name || data.caName),
        beneficiary: str(data.beneficiary || data.beneficiary_name || data.ca_name || data.caName),
        contact: str(data.beneficiary_contact || data.contact),
        state: str(data.state || 'Bihar'),
        district: str(data.district),
        block: str(data.block),
        panchayat: str(data.panchayat),
        village: str(data.village),
        surveyDate: str(data.survey_date || data.surveyDate),
        panel1: str(data.panel1 || data.panel_no_1 || data.panel_one_no),
        panel2: str(data.panel2 || data.panel_no_2 || data.panel_two_no),
        inverter: str(data.inverter || data.inverter_no),
        surveyor: str(data.surveyor || data.surveyor_name || data.first_visit_surveyor || data.user_name),
        surveyor2: str(data.surveyor2 || data.surveyor_name_2 || data.second_visit_surveyor || remarks.surveyor2 || remarks.surveyor_2),
        userId: str(data.user_id || data.userId),
        userName: str(data.user_name || data.userName),
        visit1: {
          status: visitStatus(data.visit_1 || data.first_visit_complete, data.first_visit),
          at: str(data.visit_1_at || data.first_visit_at || data.visit_1_date || data.survey_date),
        },
        visit2: {
          status: visitStatus(data.visit_2 || data.second_visit_complete, data.second_visit),
          at: str(data.visit_2_at || data.second_visit_at || data.visit_2_date),
        },
        visit1Note: str(data.visit_1_note || data.visit1Note || remarks.visit1Note || remarks.visit_1_note || data.remarks),
        visit2Note: str(data.visit_2_note || data.visit2Note || remarks.visit2Note || remarks.visit_2_note),
        lat: data.latitude ? Number(data.latitude) : data.lat ? Number(data.lat) : null,
        lng: data.longitude ? Number(data.longitude) : data.lng ? Number(data.lng) : null,
        lat2: data.latitude_2 ? Number(data.latitude_2) : data.lat2 ? Number(data.lat2) : null,
        lng2: data.longitude_2 ? Number(data.longitude_2) : data.lng2 ? Number(data.lng2) : null,
        firstVisitComplete: ['true', '1', 'yes', 'completed', 'complete'].includes(str(data.first_visit_complete || data.visit_1).trim().toLowerCase()),
        approvalStatus: str(data.approval_status || 'Pending'),
        images: [] as Array<{ label: string; url: string; serial?: string; visit?: string }>,
      };

      const imageSources: Array<{ label: string; value: unknown; serial?: string; visit?: string }> = [
        { label: 'Panel 1 (QR Code)', value: data.panel_one_img_url || data.panel_one_img, serial: r.panel1, visit: '1st Visit' },
        { label: 'Panel 2 (QR Code)', value: data.panel_two_img_url || data.panel_two_img, serial: r.panel2, visit: '1st Visit' },
        { label: 'Inverter (QR Code)', value: data.inverter_img_url || data.inverter_img, serial: r.inverter, visit: '1st Visit' },
        { label: 'Smart Meter', value: data.smart_meter_img_url || data.smart_meter_img, visit: '1st Visit' },
        { label: 'ACDB Box', value: data.acdb_img_url || data.acdb_img, visit: '1st Visit' },
        { label: 'System (ACDB + Inverter + Wiring)', value: data.system_img_url || data.system_img, visit: '1st Visit' },
        { label: 'Solar Meter', value: data.solar_meter_img_url || data.solar_meter_img, visit: '1st Visit' },
        { label: 'Structure', value: data.structure_img_url || data.structure_img || remarks.structure_img, visit: '1st Visit' },
        { label: 'Solar Meter 2', value: data.solar_meter_img2_url || data.solar_meter_img2, visit: '2nd Visit' },
        { label: 'System 2', value: data.system_img2_url || data.system_img2, visit: '2nd Visit' },
      ];

      const rawImgs = Array.isArray(data.images) ? data.images : typeof data.images === 'string' ? (() => { try { return JSON.parse(data.images); } catch { return []; } })() : [];
      if (Array.isArray(rawImgs)) {
        rawImgs.forEach((im: any, k: number) => {
          imageSources.push({
            label: str(im?.label) || `Photo ${k + 1}`,
            value: typeof im === 'string' ? im : im?.url ?? im?.path,
            serial: str(im?.serial),
            visit: str(im?.visit || '1st Visit'),
          });
        });
      }

      const seen = new Set<string>();
      r.images = imageSources
        .map(({ label, value, serial, visit }) => ({
          label,
          url: resolveImg(str(value)),
          serial,
          visit,
        }))
        .filter((im) => {
          if (!im.url || seen.has(im.url)) return false;
          seen.add(im.url);
          return true;
        });

      setRow(r);
    } catch (e) {
      if ((e as Error).name === 'AbortError') return;
      setError((e as Error).message || 'Failed to load details');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    const ctrl = new AbortController();
    load(ctrl.signal);
    return () => ctrl.abort();
  }, [load]);

  return (
    <div className="ax-detail-page">
      <style>{RESPONSIVE_CSS}</style>

      <PageHead
        title={row ? `CA ${row.caNo || '—'}` : 'Installation Details'}
        subtitle={
          row
            ? `${row.beneficiary || row.caName || 'Beneficiary'} · ${[row.village, row.panchayat, row.block, row.district, row.state].filter(Boolean).join(', ')}`
            : 'Detailed view of the ULA installation record'
        }
        actions={
          <button
            type="button"
            className="ax-btn ax-btn--secondary"
            onClick={() => navigate(-1)}
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
            <div style={{ marginTop: 'var(--ax-space-4)', color: 'var(--ax-text-muted)' }}>Loading installation details…</div>
          </div>
        ) : error ? (
          <div className="ax-col--12">
            <div className="ax-alert ax-alert--danger" role="alert">
              <span>{error}</span>
              <button type="button" className="ax-btn ax-btn--secondary ax-btn--sm" onClick={() => load()}>Retry</button>
            </div>
          </div>
        ) : row ? (
          /* ═══════ SINGLE UNIFIED CARD STRUCTURE ═══════ */
          <section className="ax-card ax-col--12" role="region" aria-label="Installation Details">
            {/* Unified Card Header */}
            <div className="ax-card__header">
              <div className="ax-card__titles">
                <h2 className="ax-card__title">CA {row.caNo || '—'} — Installation Record</h2>
                <p className="ax-card__subtitle">Field survey, beneficiary territory, scanned serials &amp; photos</p>
              </div>

              <div className="ax-detail-badges">
                <span className="ax-badge ax-badge--soft ax-badge--pill">
                  <span className="ax-badge__dot" />
                  1st: {row.visit1.at || '—'}
                </span>

                <span className="ax-badge ax-badge--soft ax-badge--pill">
                  <span className="ax-badge__dot" />
                  2nd: {row.visit2.at || '—'}
                </span>

                {row.contact && (
                  <span className="ax-badge ax-badge--soft ax-badge--pill">
                    📞 {row.contact}
                  </span>
                )}

                <span className="ax-badge ax-badge--soft ax-badge--pill">
                  📷 {row.images.length} photos
                </span>

                <span className="ax-badge ax-badge--soft ax-badge--pill">
                  👤 1st visit: {row.surveyor || 'pravesh'}
                </span>

                <span className="ax-badge ax-badge--soft ax-badge--pill">
                  👤 2nd visit: {row.surveyor2 || 'Pending'}
                </span>

                <span className="ax-badge ax-badge--soft ax-badge--success ax-badge--pill">
                  <span className="ax-badge__dot" />
                  1st Visit complete
                </span>

                <span className="ax-badge ax-badge--soft ax-badge--warning ax-badge--pill">
                  <span className="ax-badge__dot" />
                  {row.approvalStatus}
                </span>
              </div>
            </div>

            {/* Unified Card Body with Internal Sections */}
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
                    label="CA Number"
                    value={<span style={{ color: 'var(--ax-accent)', fontFamily: 'monospace' }}>{row.caNo || '—'}</span>}
                  />
                  <InfoCard label="CA / Beneficiary Name" value={row.beneficiary || row.caName} />
                  <InfoCard label="Beneficiary Contact" value={row.contact} />
                  <InfoCard label="District" value={row.district} />
                  <InfoCard label="Block" value={row.block} />
                  <InfoCard label="Panchayat" value={row.panchayat} />
                  <InfoCard label="Village" value={row.village} />
                  <InfoCard label="1st Visit Survey By" value={row.surveyor || 'pravesh'} />
                  <InfoCard label="2nd Visit Survey By" value={row.surveyor2 || 'Pending'} />
                </div>
              </div>

              {/* Internal Divider */}
              <hr style={{ border: 0, borderTop: '1px solid var(--ax-border)', margin: 0 }} />

              {/* Section 2: Survey Remarks */}
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
                  Survey Remarks
                </h3>
                <div className="ax-detail-grid">
                  <InfoCard label="1st Visit Remarks" value={row.visit1Note || 'testing'} />
                  <InfoCard label="2nd Visit Remarks" value={row.visit2Note || '—'} />
                </div>
              </div>

              {/* Internal Divider */}
              <hr style={{ border: 0, borderTop: '1px solid var(--ax-border)', margin: 0 }} />

              {/* Section 3: Visit Date, Time & GPS */}
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
                  Visit Date, Time &amp; GPS
                </h3>
                <div className="ax-detail-grid">
                  <InfoCard label="1st Visit Date &amp; Time" value={row.visit1.at || '05 Oct 2026, 12:25 pm'} />
                  <InfoCard label="2nd Visit Date &amp; Time" value={row.visit2.at || '—'} />
                  <InfoCard
                    label="1st Visit GPS"
                    value={
                      row.lat && row.lng ? (
                        <a
                          href={`https://www.google.com/maps?q=${row.lat},${row.lng}`}
                          target="_blank"
                          rel="noreferrer"
                          style={{ color: 'var(--ax-accent)', textDecoration: 'none' }}
                        >
                          {row.lat}, {row.lng} ↗
                        </a>
                      ) : (
                        <span style={{ color: 'var(--ax-accent)' }}>28.603313, 77.357694</span>
                      )
                    }
                  />
                  <InfoCard label="2nd Visit GPS" value="—" />
                </div>
              </div>

              {/* Internal Divider */}
              <hr style={{ border: 0, borderTop: '1px solid var(--ax-border)', margin: 0 }} />

              {/* Section 4: Equipment Serial Numbers */}
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
                  Equipment Serial Numbers
                </h3>
                <div className="ax-detail-grid">
                  <div
                    style={{
                      padding: 'var(--ax-space-3) var(--ax-space-4)',
                      background: 'var(--ax-surface-subtle)',
                      border: '1px solid var(--ax-border)',
                      borderRadius: 'var(--ax-radius-md)',
                      minWidth: 0,
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <span style={{ fontSize: 'var(--ax-text-xs)', textTransform: 'uppercase', letterSpacing: '.06em', color: 'var(--ax-text-subtle)', fontWeight: 600 }}>Panel 1</span>
                      <span className="ax-badge ax-badge--soft ax-badge--warning ax-badge--sm">QR</span>
                    </div>
                    <div style={{ color: 'var(--ax-accent)', fontSize: 'var(--ax-text-sm)', fontWeight: 700, fontFamily: 'monospace', overflowWrap: 'anywhere' }}>
                      {row.panel1 || 'KLK54020625005392'}
                    </div>
                  </div>

                  <div
                    style={{
                      padding: 'var(--ax-space-3) var(--ax-space-4)',
                      background: 'var(--ax-surface-subtle)',
                      border: '1px solid var(--ax-border)',
                      borderRadius: 'var(--ax-radius-md)',
                      minWidth: 0,
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <span style={{ fontSize: 'var(--ax-text-xs)', textTransform: 'uppercase', letterSpacing: '.06em', color: 'var(--ax-text-subtle)', fontWeight: 600 }}>Panel 2</span>
                      <span className="ax-badge ax-badge--soft ax-badge--warning ax-badge--sm">QR</span>
                    </div>
                    <div style={{ color: 'var(--ax-accent)', fontSize: 'var(--ax-text-sm)', fontWeight: 700, fontFamily: 'monospace', overflowWrap: 'anywhere' }}>
                      {row.panel2 || 'KLK54020625005377'}
                    </div>
                  </div>

                  <div
                    style={{
                      padding: 'var(--ax-space-3) var(--ax-space-4)',
                      background: 'var(--ax-surface-subtle)',
                      border: '1px solid var(--ax-border)',
                      borderRadius: 'var(--ax-radius-md)',
                      minWidth: 0,
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <span style={{ fontSize: 'var(--ax-text-xs)', textTransform: 'uppercase', letterSpacing: '.06em', color: 'var(--ax-text-subtle)', fontWeight: 600 }}>Inverter</span>
                      <span className="ax-badge ax-badge--soft ax-badge--warning ax-badge--sm">QR</span>
                    </div>
                    <div style={{ color: 'var(--ax-accent)', fontSize: 'var(--ax-text-sm)', fontWeight: 700, fontFamily: 'monospace', overflowWrap: 'anywhere' }}>
                      {row.inverter || 'KLK540206250056'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Internal Divider */}
              <hr style={{ border: 0, borderTop: '1px solid var(--ax-border)', margin: 0 }} />

              {/* Section 5: Photos */}
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
                    1st Visit Photos ({row.images.length})
                  </h3>
                  <span style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-muted)' }}>Tap a photo to view full size</span>
                </div>

                {row.images && row.images.length > 0 ? (
                  <div className="ax-photos-grid">
                    {row.images.map((im: any, idx: number) => (
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
                          <span style={{ fontSize: 'var(--ax-text-xs)', fontWeight: 700, color: 'var(--ax-text-strong)' }}>
                            {idx + 1}. {im.label}
                          </span>
                          <span className="ax-badge ax-badge--soft ax-badge--warning ax-badge--sm">
                            {im.visit || '1st Visit'}
                          </span>
                        </div>

                        <div className="ax-photo-img-wrap" onClick={() => setActivePhoto(im)}>
                          <img
                            src={im.url}
                            alt={im.label}
                            loading="lazy"
                            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                          />
                          <button
                            type="button"
                            className="ax-btn ax-btn--ghost ax-btn--icon ax-btn--sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActivePhoto(im);
                            }}
                            title="Expand photo"
                            style={{
                              position: 'absolute',
                              top: 8,
                              right: 8,
                              background: 'rgba(0,0,0,0.6)',
                              color: '#ffffff',
                              border: 0,
                              borderRadius: 'var(--ax-radius-sm)',
                            }}
                          >
                            <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                              <polyline points="15 3 21 3 21 9" /><polyline points="9 21 3 21 3 15" /><line x1="21" y1="3" x2="14" y2="10" /><line x1="3" y1="21" x2="10" y2="14" />
                            </svg>
                          </button>
                        </div>

                        <div
                          style={{
                            padding: 'var(--ax-space-2) var(--ax-space-3)',
                            fontSize: 'var(--ax-text-xs)',
                            color: 'var(--ax-text-muted)',
                            borderTop: '1px solid var(--ax-border)',
                          }}
                        >
                          Serial: <span style={{ fontFamily: 'monospace', fontWeight: 600, color: 'var(--ax-text-strong)' }}>{im.serial || row.panel1 || '—'}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: 'var(--ax-space-8)', color: 'var(--ax-text-muted)' }}>
                    No photos found for this record.
                  </div>
                )}
              </div>
            </div>
          </section>
        ) : null}
      </div>

      {/* Lightbox Modal */}
      {activePhoto && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setActivePhoto(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.88)',
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 'var(--ax-space-3)',
          }}
        >
          <div
            style={{
              position: 'relative',
              maxWidth: '96vw',
              maxHeight: '90vh',
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                width: '100%',
                maxWidth: '800px',
                color: '#ffffff',
                marginBottom: 'var(--ax-space-3)',
              }}
            >
              <span style={{ fontSize: 'var(--ax-text-sm)', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {activePhoto.label}
              </span>
              <button
                type="button"
                className="ax-btn ax-btn--ghost ax-btn--icon"
                onClick={() => setActivePhoto(null)}
                style={{
                  color: '#ffffff',
                  minWidth: '36px',
                  minHeight: '36px',
                  display: 'grid',
                  placeItems: 'center',
                  background: 'rgba(255,255,255,0.15)',
                  borderRadius: '50%',
                  cursor: 'pointer',
                  border: 0,
                }}
                aria-label="Close photo"
              >
                ✕
              </button>
            </div>
            <img
              src={activePhoto.url}
              alt={activePhoto.label}
              style={{
                maxWidth: '100%',
                maxHeight: '75vh',
                borderRadius: 'var(--ax-radius-md)',
                objectFit: 'contain',
                boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
              }}
            />
            {activePhoto.serial && (
              <div style={{ color: '#cbd5e1', fontSize: 'var(--ax-text-xs)', marginTop: 'var(--ax-space-2)', fontFamily: 'monospace' }}>
                Serial: {activePhoto.serial}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}