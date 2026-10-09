import { useCallback, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PageHead } from '../../../../shell/PageHead';
import { dleService } from '../../../../../services/dleServices';

// Icons mapping matching the old one
const svg = (d: string, cls?: string) => (
  <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d={d} />
  </svg>
);
const ICON = {
  arrowL: svg("M5 12l14 0 M5 12l6 6 M5 12l6 -6", "ax-btn__icon"),
};

export default function BiharULAInstallationViewDataDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [row, setRow] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const parseRemarks = (value: unknown): Record<string, unknown> => {
    if (!value) return {};
    if (typeof value === 'object' && value !== null) return value as Record<string, unknown>;
    try {
      const parsed = JSON.parse(String(value));
      return parsed && typeof parsed === 'object' ? parsed as Record<string, unknown> : {};
    } catch {
      return {};
    }
  };

  const str = (v: unknown) => (v === null || v === undefined ? '' : String(v));

  const visitStatus = (flag: unknown, text: unknown): string => {
    if (flag !== undefined && flag !== null && flag !== '') {
      const ok = flag === true || flag === 1 || ['true', '1', 'yes', 'completed', 'complete'].includes(String(flag).trim().toLowerCase());
      return ok ? 'Completed' : 'Pending';
    }
    return str(text) || 'Pending';
  };

  const visitClass = (st: string) => st === 'Completed' ? 'ax-badge--success' : 'ax-badge--warning';

  const R2_BASE = ((import.meta.env.VITE_R2_PUBLIC_URL as string | undefined) ?? '').replace(/\/+$/, '');
  const resolveImg = (u: string): string => {
    if (!u) return '';
    if (/^(https?:)?\/\//i.test(u) || u.startsWith('data:')) return u;
    return R2_BASE ? `${R2_BASE}/${u.replace(/^\/+/, '')}` : u;
  };

  const load = useCallback(async (signal?: AbortSignal) => {
    if (!id) return;
    setLoading(true);
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
        beneficiary: str(data.beneficiary || data.beneficiary_name),
        contact: str(data.beneficiary_contact || data.contact),
        state: str(data.state),
        district: str(data.district),
        block: str(data.block),
        panchayat: str(data.panchayat),
        village: str(data.village),
        surveyDate: str(data.survey_date || data.surveyDate),
        panel1: str(data.panel1 || data.panel_no_1),
        panel2: str(data.panel2 || data.panel_no_2),
        inverter: str(data.inverter || data.inverter_no),
        surveyor: str(data.surveyor || data.surveyor_name),
        surveyor2: str(data.surveyor2 || data.surveyor_name_2 || remarks.surveyor2 || remarks.surveyor_2),
        userId: str(data.user_id || data.userId),
        userName: str(data.user_name || data.userName),
        userId2: str(data.user_id_2 || data.userId2),
        userName2: str(data.user_name_2 || data.userName2),
        visit1: {
          status: visitStatus(data.visit_1, data.first_visit),
          at: str(data.visit_1_at || data.first_visit_at || data.visit_1_date || data.first_visit_date),
        },
        visit2: {
          status: visitStatus(data.visit_2, data.second_visit),
          at: str(data.visit_2_at || data.second_visit_at || data.visit_2_date || data.second_visit_date),
        },
        visit1Note: str(data.visit_1_note || data.visit1Note || remarks.visit1Note),
        visit2Note: str(data.visit_2_note || data.visit2Note || remarks.visit2Note),
        secondVisitAt: str(data.second_visit_at || data.secondVisitAt),
        modification: str(data.modification || remarks.modification),
        remarks: str(data.remarks),
        lat: data.latitude ? Number(data.latitude) : data.lat ? Number(data.lat) : null,
        lng: data.longitude ? Number(data.longitude) : data.lng ? Number(data.lng) : null,
        lat2: data.latitude_2 ? Number(data.latitude_2) : data.lat2 ? Number(data.lat2) : null,
        lng2: data.longitude_2 ? Number(data.longitude_2) : data.lng2 ? Number(data.lng2) : null,
        firstVisitComplete: ['true', '1', 'yes', 'completed', 'complete'].includes(str(data.first_visit_complete || data.visit_1).trim().toLowerCase()),
        secondVisitComplete: ['true', '1', 'yes', 'completed', 'complete'].includes(str(data.second_visit_complete || data.visit_2).trim().toLowerCase()),
        images: [] as { label: string; url: string }[],
      };

      const imageSources: Array<{ label: string; value: unknown }> = [
        { label: 'Panel 1', value: data.panel_one_img_url || data.panel_one_img },
        { label: 'Panel 2', value: data.panel_two_img_url || data.panel_two_img },
        { label: 'Inverter', value: data.inverter_img_url || data.inverter_img },
        { label: 'Smart Meter', value: data.smart_meter_img_url || data.smart_meter_img },
        { label: 'ACDB', value: data.acdb_img_url || data.acdb_img },
        { label: 'System', value: data.system_img_url || data.system_img },
        { label: 'Solar Meter', value: data.solar_meter_img_url || data.solar_meter_img },
        { label: 'Solar Meter 2', value: data.solar_meter_img2_url || data.solar_meter_img2 },
        { label: 'System 2', value: data.system_img2_url || data.system_img2 },
        { label: 'Structure', value: data.structure_img_url || data.structure_img || remarks.structure_img },
      ];

      const rawImgs = Array.isArray(data.images) ? data.images : typeof data.images === 'string' ? (() => { try { return JSON.parse(data.images); } catch { return []; } })() : [];
      if (Array.isArray(rawImgs)) {
        rawImgs.forEach((im: any, k: number) => {
          imageSources.push({
            label: str(im?.label) || `Photo ${k + 1}`,
            value: typeof im === 'string' ? im : im?.url ?? im?.path,
          });
        });
      }

      const seen = new Set<string>();
      r.images = imageSources
        .map(({ label, value }) => ({ label, url: resolveImg(str(value)) }))
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
    <>
      <PageHead
        title={row ? `Installation Details · ${row.caNo}` : 'Installation Details'}
        subtitle="Detailed view of the ULA installation record"
        actions={
          <button type="button" className="ax-btn ax-btn--secondary" onClick={() => navigate(-1)}>
            <span className="ax-btn__icon">{ICON.arrowL}</span>
            <span className="ax-btn__label">Back to List</span>
          </button>
        }
      />

      <div className="ax-dash-grid">
        {loading ? (
          <div className="ax-col--12" style={{ padding: 'var(--ax-space-10)', textAlign: 'center' }}>
            <div className="ax-spinner ax-spinner--primary" />
            <div style={{ marginTop: 'var(--ax-space-4)', color: 'var(--ax-text-muted)' }}>Loading details...</div>
          </div>
        ) : error ? (
          <div className="ax-col--12">
            <div className="ax-alert ax-alert--danger" role="alert">
              <span>{error}</span>
              <button type="button" className="ax-btn ax-btn--secondary ax-btn--sm" onClick={() => load()}>Retry</button>
            </div>
          </div>
        ) : row && (
          <section className="ax-card ax-col--12">
            <div className="ax-card__body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--ax-space-5)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 'var(--ax-space-4)' }}>
                {[
                  ['CA No.', row.caNo],
                  ['CA Name', row.caName],
                  ['Beneficiary', row.beneficiary],
                  ['Contact', row.contact],
                  ['State', row.state],
                  ['District', row.district],
                  ['Block', row.block],
                  ['Panchayat', row.panchayat],
                  ['Village', row.village],
                  ['Survey Date', row.surveyDate],
                  ['1st Surveyor', row.surveyor],
                  ['2nd Surveyor', row.surveyor2],
                  ['Panel 1 No.', row.panel1],
                  ['Panel 2 No.', row.panel2],
                  ['Inverter No.', row.inverter],
                ].map(([k, v]) => (
                  <div key={k} style={{ padding: 'var(--ax-space-3) var(--ax-space-4)', background: 'var(--ax-surface-subtle)', border: '1px solid var(--ax-border)', borderRadius: 'var(--ax-radius-md)' }}>
                    <div style={{ fontSize: 'var(--ax-text-xs)', textTransform: 'uppercase', letterSpacing: '.06em', color: 'var(--ax-text-subtle)' }}>{k}</div>
                    <div style={{ marginTop: 4, color: 'var(--ax-text-strong)', fontSize: 'var(--ax-text-sm)', fontWeight: 600 }}>{v || '—'}</div>
                  </div>
                ))}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 'var(--ax-space-4)' }}>
                {[['1st Visit', row.visit1, row.visit1Note], ['2nd Visit', row.visit2, row.visit2Note]].map(([label, visit, note]) => {
                  const v = visit as any;
                  return (
                    <div key={label as string} style={{ padding: 'var(--ax-space-4)', border: '1px solid var(--ax-border)', borderRadius: 'var(--ax-radius-md)' }}>
                      <div style={{ fontSize: 'var(--ax-text-xs)', textTransform: 'uppercase', letterSpacing: '.06em', color: 'var(--ax-text-subtle)', marginBottom: 8 }}>{label as string}</div>
                      <span className={`ax-badge ax-badge--soft ax-badge--pill ${visitClass(v.status)}`}>
                        <span className="ax-badge__dot" />
                        {v.status}
                      </span>
                      {v.at && <div className="ax-num" style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-subtle)', marginTop: 8 }}>{v.at}</div>}
                      {note && <div style={{ marginTop: 12, fontSize: 'var(--ax-text-sm)', color: 'var(--ax-text-strong)', padding: 'var(--ax-space-3)', background: 'var(--ax-surface-subtle)', borderRadius: 'var(--ax-radius-sm)' }}>{note as string}</div>}
                    </div>
                  );
                })}
              </div>

              {row.lat !== null && row.lng !== null && (
                <div>
                  <div style={{ fontSize: 'var(--ax-text-xs)', textTransform: 'uppercase', letterSpacing: '.06em', color: 'var(--ax-text-subtle)', marginBottom: 8 }}>Location</div>
                  <a className="ax-btn ax-btn--secondary ax-btn--sm" href={`https://www.google.com/maps?q=${row.lat},${row.lng}`} target="_blank" rel="noreferrer">
                    Open in Google Maps
                  </a>
                </div>
              )}

              <div>
                <div style={{ fontSize: 'var(--ax-text-xs)', textTransform: 'uppercase', letterSpacing: '.06em', color: 'var(--ax-text-subtle)', marginBottom: 16 }}>Images</div>
                {row.images.length ? (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(240px,1fr))', gap: 'var(--ax-space-4)' }}>
                    {row.images.map((im: any) => (
                      <a key={im.url} href={im.url} target="_blank" rel="noreferrer" style={{ display: 'block' }}>
                        <img src={im.url} alt={im.label} loading="lazy" style={{ width: '100%', aspectRatio: '4/3', objectFit: 'cover', borderRadius: 'var(--ax-radius-md)', border: '1px solid var(--ax-border)' }} />
                        <div style={{ fontSize: 'var(--ax-text-sm)', fontWeight: 500, color: 'var(--ax-text-strong)', marginTop: 8 }}>{im.label}</div>
                      </a>
                    ))}
                  </div>
                ) : (
                  <div style={{ color: 'var(--ax-text-muted)', fontSize: 'var(--ax-text-sm)' }}>No images available for this record.</div>
                )}
              </div>
            </div>
          </section>
        )}
      </div>
    </>
  );
}