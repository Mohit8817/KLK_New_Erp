import { useEffect, useMemo, useRef, useState, useCallback, type FormEvent, type ReactNode } from 'react';
import { Link, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { PageHead } from '../../../../shell/PageHead';
import {
  biharUlaInstallationService,
  type StructureSiteItem,
} from '../../bihar-services';

/* ── Route to go back to after a successful save ── */
const LIST_ROUTE = '/v/bihar/ula-installation-view-site';

/* ── Base URLs for media assets (same logic as the list page) ── */
const BACKEND_BASE = (import.meta.env.VITE_API_BASE_URL || 'https://klkerp.com/api')
  .replace(/\/api\/?$/, '')
  .replace(/\/+$/, '');

const R2_BASE = ((import.meta.env.VITE_R2_PUBLIC_URL as string | undefined) ?? '').replace(/\/+$/, '');

function getImageCandidates(path?: string | null): string[] {
  if (!path || typeof path !== 'string') return [];
  const clean = path.trim();
  if (!clean) return [];

  if (/^(https?:)?\/\//i.test(clean) || clean.startsWith('data:') || clean.startsWith('blob:')) {
    return [clean];
  }

  if (clean.startsWith('r2:')) {
    const key = clean.slice(3).replace(/^\/+/, '');
    const urls: string[] = [];
    if (R2_BASE) urls.push(`${R2_BASE}/${key}`);
    urls.push(`${BACKEND_BASE}/uploads/${key}`);
    return urls;
  }

  const normalized = clean.replace(/^\/+/, '');
  const filename = normalized.split('/').pop() || normalized;
  const candidates: string[] = [];

  if (normalized.startsWith('uploads/') || normalized.startsWith('storage/')) {
    candidates.push(`${BACKEND_BASE}/${normalized}`);
  }
  candidates.push(`${BACKEND_BASE}/uploads/bihar/installation/ula/${filename}`);
  candidates.push(`${BACKEND_BASE}/uploads/bihar/installation/${filename}`);
  candidates.push(`${BACKEND_BASE}/uploads/bihar/survey/ula/${filename}`);
  candidates.push(`${BACKEND_BASE}/uploads/bihar/survey/${filename}`);
  candidates.push(`${BACKEND_BASE}/uploads/${filename}`);
  candidates.push(`${BACKEND_BASE}/${normalized}`);
  if (R2_BASE) {
    candidates.push(`${R2_BASE}/uploads/bihar/installation/ula/${filename}`);
    candidates.push(`${R2_BASE}/${filename}`);
  }
  candidates.push(`https://pub-21d2019fecbe4a96a88c93b2f091317a.r2.dev/${filename}`);

  return Array.from(new Set(candidates));
}

/* ── Field helper ── */
const pick = (site: StructureSiteItem | null, ...keys: string[]): string => {
  if (!site) return '';
  const rec = site as unknown as Record<string, unknown>;
  for (const k of keys) {
    const v = rec[k];
    if (v !== null && v !== undefined && v !== '') return String(v);
  }
  return '';
};

/* ── Upload config ── */
const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'];

const PHOTO_FIELDS = [
  { key: 'complete_photo', label: 'Complete Photo with Beneficiary', existing: ['complete_photo'] },
  { key: 'inverter_image', label: 'Inverter with Serial Number', existing: ['inverter_image'] },
  { key: 'earthing_image', label: 'Earthing', existing: ['earthing_image'] },
  { key: 'acdb_image', label: 'ACDB', existing: ['acdb_image'] },
  { key: 'solar_meter_image', label: 'Solar Meter (Number)', existing: ['solar_meter_image', 'solarmeter_image'] },
  { key: 'la_image', label: 'LA', existing: ['la_image'] },
] as const;

type PhotoKey = (typeof PHOTO_FIELDS)[number]['key'];

const formatSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

const SECTIONS = [
  { id: 'sec-1', num: '1', title: 'Site Details' },
  { id: 'sec-2', num: '2', title: 'Installation Details' },
  { id: 'sec-3', num: '3', title: 'Installation Photos' },
  { id: 'sec-4', num: '4', title: 'Remarks' },
];

// CSS: Unified Single-Card Layout with Floating Labels & Section Dividers (same as SRT 200MW Add Survey)
const SINGLE_CARD_FORM_CSS = `
.bihar-single-card-form .ax-card { border: 1px solid var(--ax-border); border-radius: var(--ax-radius-xl); background: var(--ax-surface-solid); box-shadow: var(--ax-shadow-sm); overflow: hidden; }
.bihar-single-card-form .ax-card__header { padding: var(--ax-space-5) var(--ax-space-6); border-bottom: 1px solid var(--ax-border-subtle); background: var(--ax-surface-subtle); display: flex; flex-direction: column; gap: var(--ax-space-4); }
.bihar-single-card-form .ax-card__body { padding: var(--ax-space-6); }

.bihar-section-pills { display: flex; gap: var(--ax-space-2); overflow-x: auto; padding-bottom: 4px; scrollbar-width: thin; }
.bihar-section-pill-btn { display: inline-flex; align-items: center; gap: 6px; padding: 6px 14px; border-radius: var(--ax-radius-pill); font-size: var(--ax-text-xs); font-weight: 500; white-space: nowrap; background: var(--ax-surface-solid); border: 1px solid var(--ax-border); color: var(--ax-text); cursor: pointer; transition: all var(--ax-motion-fast) var(--ax-ease-standard); text-decoration: none; }
.bihar-section-pill-btn:hover { border-color: var(--ax-accent); color: var(--ax-accent); background: color-mix(in srgb, var(--ax-accent) 6%, var(--ax-surface-solid)); }
.bihar-section-pill-btn .pill-num { width: 18px; height: 18px; border-radius: 50%; background: var(--ax-surface-subtle); display: inline-flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 700; }

.bihar-section-block { padding-top: var(--ax-space-2); scroll-margin-top: 80px; }
.bihar-section-header { display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: var(--ax-space-2); margin-bottom: var(--ax-space-5); padding-bottom: var(--ax-space-3); border-bottom: 1px solid var(--ax-border-subtle); }
.bihar-section-title-wrap { display: flex; flex-direction: column; gap: 4px; }
.bihar-section-divider { border: 0; border-top: 1px dashed var(--ax-border); margin: var(--ax-space-8) 0 var(--ax-space-6); }

.ax-float { position: relative; width: 100%; }
.ax-float__input { width: 100%; height: 46px; padding: 12px 14px 4px 14px; font-size: var(--ax-text-sm); background: var(--ax-surface-solid); border: 1px solid var(--ax-border); border-radius: var(--ax-radius-md); color: var(--ax-text); outline: none; transition: border-color var(--ax-motion-fast) var(--ax-ease-standard), box-shadow var(--ax-motion-fast) var(--ax-ease-standard); }
.ax-float__input::placeholder { color: transparent; }
.ax-float__input:focus { border-color: var(--ax-accent); box-shadow: 0 0 0 3px color-mix(in srgb, var(--ax-accent) 20%, transparent); }
.ax-float__input[readonly] { background: var(--ax-surface-subtle); }

.ax-float__label { position: absolute; inset-inline-start: 12px; top: 50%; transform: translateY(-50%); margin: 0; padding: 0 4px; font-size: var(--ax-text-sm); color: var(--ax-text-subtle); background: var(--ax-surface-solid); border-radius: var(--ax-radius-xs); pointer-events: none; transition: top var(--ax-motion-fast) var(--ax-ease-standard), font-size var(--ax-motion-fast) var(--ax-ease-standard), color var(--ax-motion-fast) var(--ax-ease-standard); z-index: 2; white-space: nowrap; max-width: calc(100% - 24px); overflow: hidden; text-overflow: ellipsis; }

.ax-float__input:focus + .ax-float__label,
.ax-float__input:not(:placeholder-shown) + .ax-float__label,
.ax-float--select .ax-float__label,
.ax-float--file .ax-float__label { top: 0; transform: translateY(-50%); font-size: var(--ax-text-2xs); font-weight: 500; color: var(--ax-text-muted); }
.ax-float__input:focus + .ax-float__label { color: var(--ax-accent); }

.ax-float__input.is-invalid { border-color: var(--ax-danger-500) !important; }
.ax-float__input.is-invalid:focus { box-shadow: 0 0 0 3px color-mix(in srgb, var(--ax-danger-500) 24%, transparent) !important; }
.ax-float__input.is-invalid + .ax-float__label, .ax-float--file.is-invalid .ax-float__label { color: var(--ax-danger-500) !important; }

.ax-float--area .ax-float__input { height: auto; min-height: 84px; padding-top: 18px; resize: vertical; }
.ax-float--area .ax-float__label { top: 18px; transform: none; }
.ax-float--area .ax-float__input:focus + .ax-float__label,
.ax-float--area .ax-float__input:not(:placeholder-shown) + .ax-float__label { top: 0; transform: translateY(-50%); }

.ax-field-feedback { display: flex; align-items: center; gap: 4px; margin-top: 4px; font-size: var(--ax-text-2xs); min-height: 16px; }
.ax-field-feedback--error { color: var(--ax-danger-500); }

.bihar-form-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: var(--ax-space-4); }
@media (min-width: 1024px) { .bihar-form-grid--3col { grid-template-columns: repeat(3, 1fr); } }
.bihar-form-col-span-full { grid-column: 1 / -1; }

.bihar-form-sticky-bar { position: sticky; bottom: var(--ax-space-4); z-index: 30; margin-top: var(--ax-space-6); padding: var(--ax-space-3) var(--ax-space-5); background: var(--ax-surface-solid); border: 1px solid var(--ax-border); border-radius: var(--ax-radius-xl); box-shadow: var(--ax-shadow-lg); display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: var(--ax-space-3); backdrop-filter: blur(12px); }

.ula-photo-note { margin: 0 0 var(--ax-space-4); font-size: var(--ax-text-xs); color: var(--ax-text-muted); line-height: 1.5; }
.ula-photo-view { font-size: 11px; color: var(--ax-primary-default, #2563eb); text-decoration: none; }
.ula-photo-view:hover { text-decoration: underline; }
.bihar-single-card-form img { border-radius: 0; }
@keyframes spin { to { transform: rotate(360deg); } }
`;

export function Bihar_Installation_ULA_PendingInstallation() {
  const { id: paramId } = useParams<{ id?: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();

  const stateSite = (location.state as { site?: StructureSiteItem } | null)?.site ?? null;
  const targetId = paramId || searchParams.get('id') || searchParams.get('site_id') || (stateSite?.id ? String(stateSite.id) : '');

  const [site, setSite] = useState<StructureSiteItem | null>(stateSite);
  const [loadingSite, setLoadingSite] = useState(Boolean(targetId) && !stateSite);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Available sites list if user opened the page directly without a selected site
  const [availableSites, setAvailableSites] = useState<StructureSiteItem[]>([]);
  const [loadingAvailable, setLoadingAvailable] = useState(false);

  // Form state
  const [inverterNo, setInverterNo] = useState('');
  const [solarMeterNo, setSolarMeterNo] = useState('');
  const [nmSmNo, setNmSmNo] = useState('');
  const [logerNo, setLogerNo] = useState('');
  const [remarks, setRemarks] = useState('');
  const [files, setFiles] = useState<Record<PhotoKey, File | null>>({
    complete_photo: null,
    inverter_image: null,
    earthing_image: null,
    acdb_image: null,
    solar_meter_image: null,
    la_image: null,
  });

  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Load available sites if no site is selected
  useEffect(() => {
    let active = true;
    setLoadingAvailable(true);
    biharUlaInstallationService.getViewInstalledSites()
      .then((list) => {
        if (!active) return;
        setAvailableSites(Array.isArray(list) ? list : []);
      })
      .catch((err) => console.error('[PendingInstallation] fetch available sites error:', err))
      .finally(() => {
        if (active) setLoadingAvailable(false);
      });
    return () => {
      active = false;
    };
  }, []);

  // Load fresh site data by ID
  const loadSiteById = useCallback(async (sid: string | number) => {
    if (!sid) return;
    setLoadingSite(true);
    setLoadError(null);
    try {
      const fresh = await biharUlaInstallationService.getPendingInstallSite(sid);
      if (fresh) {
        setSite(fresh);
      } else {
        const fallback = availableSites.find((s) => String(s.id) === String(sid));
        if (fallback) {
          setSite(fallback);
        } else if (!site) {
          setLoadError('Site details could not be loaded.');
        }
      }
    } catch (err: any) {
      if (!site) setLoadError(err?.message || 'Failed to load site details.');
    } finally {
      setLoadingSite(false);
    }
  }, [availableSites, site]);

  useEffect(() => {
    if (targetId) {
      loadSiteById(targetId);
    }
  }, [targetId, loadSiteById]);

  // Prefill once per fresh site data
  useEffect(() => {
    if (!site) return;
    setInverterNo(pick(site, 'inverter_no'));
    setSolarMeterNo(pick(site, 'solarmeter_no', 'solar_meter_no'));
    setNmSmNo(pick(site, 'nm_sm_no', 'net_smart_meter_no', 'smart_meter_no'));
    setLogerNo(pick(site, 'loger_no'));
    setRemarks(pick(site, 'inst_remarks', 'remarks'));
  }, [site]);

  const clearError = (name: string) =>
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next[name];
      return next;
    });

  const existingPath = (keys: readonly string[]) => pick(site, ...keys);

  const capturedCount = PHOTO_FIELDS.filter((p) => files[p.key] || existingPath(p.existing)).length;

  const isSiteApproved = Boolean(
    site && (
      Number((site as any).inst_verify_status ?? (site as any).verify_status) === 1 ||
      String((site as any).inst_verify_status ?? (site as any).verify_status ?? '').toLowerCase() === 'approved' ||
      Number((site as any).status) === 1
    )
  );

  const handleFileChange = (key: PhotoKey, file: File | null) => {
    setErrorMsg(null);
    clearError(key);
    if (file) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        setFiles((p) => ({ ...p, [key]: null }));
        setFieldErrors((p) => ({ ...p, [key]: ['Only JPG, PNG, WEBP or PDF files are allowed.'] }));
        return;
      }
      if (file.size > MAX_BYTES) {
        setFiles((p) => ({ ...p, [key]: null }));
        setFieldErrors((p) => ({ ...p, [key]: [`File is ${formatSize(file.size)}. Maximum allowed size is 5 MB.`] }));
        return;
      }
    }
    setFiles((p) => ({ ...p, [key]: file }));
  };

  const scrollToSection = (sid: string) => {
    document.getElementById(sid)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!site) return;
    if (isSiteApproved) {
      setErrorMsg('This site installation is already Approved. Editing is locked.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    setErrorMsg(null);
    setSuccessMsg(null);
    setFieldErrors({});
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('site_id', String(site.id));
      fd.append('inverter_no', inverterNo.trim());
      fd.append('solarmeter_no', solarMeterNo.trim());
      fd.append('nm_sm_no', nmSmNo.trim());
      fd.append('loger_no', logerNo.trim());
      fd.append('inst_remarks', remarks.trim());
      PHOTO_FIELDS.forEach(({ key }) => {
        const f = files[key];
        if (f) fd.append(key, f);
      });

      const resp = await biharUlaInstallationService.storeInstallation(fd);
      setSuccessMsg(resp?.message || 'Installation Updated Successfully!!!');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setTimeout(() => navigate(LIST_ROUTE, { replace: true }), 1500);
    } catch (err: any) {
      // Service throws Error(message); 422 field errors (if attached) are in err.errors
      setErrorMsg(err?.message || 'Failed to save installation.');
      const errs = err?.errors ?? err?.response?.data?.errors;
      if (errs && typeof errs === 'object') setFieldErrors(errs);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setSubmitting(false);
    }
  };

  const err = (k: string) => fieldErrors[k]?.[0];

  return (
    <div className="bihar-single-card-form">
      <style>{SINGLE_CARD_FORM_CSS}</style>

      <PageHead
        title="ULA Pending Installation"
        subtitle={
          <span style={{ fontSize: 'var(--ax-text-sm)', color: 'var(--ax-text-muted)' }}>
            Record electrical commissioning details and installation photos for this site
          </span>
        }
        breadcrumbs={[
          { label: 'Home', href: '/v-dashboard' },
          { label: 'ULA Installation', href: LIST_ROUTE },
          { label: 'Pending Installation' },
        ]}
        actions={
          <Link to={LIST_ROUTE} className="ax-btn ax-btn--secondary ax-btn--pill">
            <svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12l14 0" /><path d="M5 12l6 6" /><path d="M5 12l6 -6" /></svg>
            <span className="ax-btn__label">Installation List</span>
          </Link>
        }
      />

      {/* Success Banner */}
      {successMsg && (
        <div className="ax-alert ax-alert--success" role="status" style={{ marginBottom: 'var(--ax-space-6)' }}>
          <span className="ax-alert__icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l5 5l10 -10" /></svg>
          </span>
          <div className="ax-alert__content">
            <h3 className="ax-alert__title" style={{ fontSize: 'var(--ax-text-base)', fontWeight: 600 }}>{successMsg}</h3>
          </div>
        </div>
      )}

      {/* Error Banner */}
      {errorMsg && (
        <div className="ax-alert ax-alert--danger" role="alert" style={{ marginBottom: 'var(--ax-space-6)' }}>
          <span className="ax-alert__icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M12 9v4" /><path d="M10.363 3.591l-8.106 13.534a1.914 1.914 0 0 0 1.636 2.871h16.214a1.914 1.914 0 0 0 1.636 -2.87l-8.106 -13.536a1.914 1.914 0 0 0 -3.274 0" /><path d="M12 16h.01" /></svg>
          </span>
          <div className="ax-alert__content">
            <h4 className="ax-alert__title" style={{ fontWeight: 600 }}>{errorMsg}</h4>
          </div>
        </div>
      )}

      {/* Approved Lock Warning */}
      {isSiteApproved && (
        <div className="ax-alert ax-alert--warning" role="alert" style={{ marginBottom: 'var(--ax-space-6)' }}>
          <span className="ax-alert__icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </span>
          <div className="ax-alert__content">
            <h4 className="ax-alert__title" style={{ fontWeight: 600 }}>Installation Approved — Editing Locked</h4>
            <p className="ax-alert__message" style={{ margin: '4px 0 0' }}>
              This site installation has already been approved by administration. Editing is locked.
            </p>
          </div>
        </div>
      )}

      {loadingSite && (
        <div className="ax-card">
          <div className="ax-card__body" style={{ textAlign: 'center', color: 'var(--ax-text-muted)' }}>
            <span className="ax-spinner" style={{ marginRight: 8 }} /> Loading site details…
          </div>
        </div>
      )}

      {!loadingSite && !site && (
        <div className="ax-card" style={{ marginBottom: 'var(--ax-space-6)' }}>
          <div className="ax-card__header">
            <div>
              <h3 className="ax-card__title" style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>
                Select Site for Pending Installation
              </h3>
              <p className="ax-card__subtitle" style={{ margin: '4px 0 0', fontSize: '12px', color: 'var(--ax-text-muted)' }}>
                Choose a structure-completed site to enter final installation commissioning details and photos.
              </p>
            </div>
          </div>
          <div className="ax-card__body">
            {loadingAvailable ? (
              <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--ax-text-muted)' }}>
                <span className="ax-spinner" style={{ marginRight: 8 }} /> Loading available sites…
              </div>
            ) : availableSites.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 540 }}>
                <label htmlFor="ula-pending-site-select" style={{ fontSize: '13px', fontWeight: 600, color: 'var(--ax-text)' }}>
                  Available Structure-Complete Sites ({availableSites.length})
                </label>
                <select
                  id="ula-pending-site-select"
                  className="ax-float__input"
                  style={{ height: 46 }}
                  defaultValue=""
                  onChange={(e) => {
                    if (e.target.value) {
                      loadSiteById(e.target.value);
                    }
                  }}
                >
                  <option value="">-- Choose a Pending Site --</option>
                  {availableSites.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.beneficiary_name ? `${s.beneficiary_name} (Site #${s.id})` : `Site #${s.id}`}
                      {s.district ? ` - ${s.district}` : ''}
                      {s.ca_no ? ` [CA: ${s.ca_no}]` : ''}
                    </option>
                  ))}
                </select>
                <span style={{ fontSize: '11.5px', color: 'var(--ax-text-muted)' }}>
                  Selecting a site will load its details and allow you to record electrical meters & photographs.
                </span>
              </div>
            ) : (
              <div style={{ padding: '12px 0' }}>
                <p style={{ margin: '0 0 12px', color: 'var(--ax-text-muted)' }}>
                  {loadError || 'No pending installation sites found. Please check if structure work has been submitted.'}
                </p>
                <button
                  type="button"
                  className="ax-btn ax-btn--secondary ax-btn--sm"
                  onClick={() => navigate(LIST_ROUTE)}
                >
                  Go to Installation List
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {!loadingSite && site && (
        <form onSubmit={handleSubmit}>
          <div className="ax-card">
            {/* Card Header with Title and Section Pills */}
            <div className="ax-card__header">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
                <div>
                  <h2 className="ax-card__title" style={{ margin: 0 }}>Pending Installation</h2>
                  <p className="ax-card__subtitle" style={{ margin: '4px 0 0' }}>
                    Site details, meter numbers and installation photos in one place.
                  </p>
                </div>
                {availableSites.length > 1 && (
                  <button
                    type="button"
                    className="ax-btn ax-btn--ghost ax-btn--sm"
                    onClick={() => setSite(null)}
                    style={{ fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                  >
                    <span>⇄</span>
                    <span>Change Site</span>
                  </button>
                )}
              </div>

              <div className="bihar-section-pills" role="navigation" aria-label="Jump to section">
                {SECTIONS.map((s) => (
                  <button key={s.id} type="button" onClick={() => scrollToSection(s.id)} className="bihar-section-pill-btn">
                    <span className="pill-num">{s.num}</span>
                    <span>{s.title}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="ax-card__body">
              {/* Section 1: Site Details (read-only) */}
              <div id="sec-1" className="bihar-section-block">
                <SectionHeader num="1" total={SECTIONS.length} title="Site Details" desc="Auto-populated from the site record (Read-only)." />
                <div className="bihar-form-grid bihar-form-grid--3col">
                  <FloatingInput id="pi-discom" label="Discom" readOnly value={pick(site, 'discom', 'discom_name')} />
                  <FloatingInput id="pi-state" label="State" readOnly value={pick(site, 'state') || 'Bihar'} />
                  <FloatingInput id="pi-district" label="District" readOnly value={pick(site, 'district')} />
                  <FloatingInput id="pi-block" label="Block" readOnly value={pick(site, 'block')} />
                  <FloatingInput id="pi-village" label="Village" readOnly value={pick(site, 'village')} />
                  <FloatingInput id="pi-name" label="Beneficiary Name" readOnly value={pick(site, 'beneficiary_name')} />
                  <FloatingInput id="pi-contact" label="Beneficiary Contact" readOnly value={pick(site, 'contact_no', 'beneficiary_contact')} />
                  <FloatingInput id="pi-ca" label="CA Number" readOnly value={pick(site, 'ca_no')} />
                  <FloatingInput id="pi-location" label="Location" readOnly value={pick(site, 'location', 'address')} />
                  <FloatingInput id="pi-load" label="Sanction Load" readOnly value={pick(site, 'sanction_load', 'sanctioned_load', 'load')} />
                </div>
              </div>

              <hr className="bihar-section-divider" />

              {/* Section 2: Installation Details */}
              <div id="sec-2" className="bihar-section-block">
                <SectionHeader num="2" total={SECTIONS.length} title="Installation Details" desc="Serial numbers of the installed equipment. Each number must be unique." />
                <div className="bihar-form-grid bihar-form-grid--3col">
                  <FloatingInput id="pi-inv" label="Inverter Number" placeholder="Enter Inverter Number" value={inverterNo} onChange={(v) => { setInverterNo(v); clearError('inverter_no'); }} error={err('inverter_no')} />
                  <FloatingInput id="pi-sm" label="Solar Meter Number" placeholder="Enter Solar Meter Number" value={solarMeterNo} onChange={(v) => { setSolarMeterNo(v); clearError('solarmeter_no'); }} error={err('solarmeter_no')} />
                  <FloatingInput id="pi-nm" label="Net Meter/Smart Meter Number" placeholder="Enter Net/Smart Meter Number" value={nmSmNo} onChange={(v) => { setNmSmNo(v); clearError('nm_sm_no'); }} error={err('nm_sm_no')} />
                  <FloatingInput id="pi-log" label="RMS Logger Number" placeholder="Enter RMS Logger Number" value={logerNo} onChange={(v) => { setLogerNo(v); clearError('loger_no'); }} error={err('loger_no')} />
                </div>
              </div>

              <hr className="bihar-section-divider" />

              {/* Section 3: Photos */}
              <div id="sec-3" className="bihar-section-block">
                <SectionHeader
                  num="3"
                  total={SECTIONS.length}
                  title="Upload Installation Photos"
                  desc={`${capturedCount} of ${PHOTO_FIELDS.length} photos captured`}
                />
                <p className="ula-photo-note">
                  Already captured photos are shown below. Choose a new photo only if you want to replace/update it — leave it as is otherwise. (JPG, PNG, WEBP or PDF, max 5 MB)
                </p>
                <div className="bihar-form-grid bihar-form-grid--3col">
                  {PHOTO_FIELDS.map(({ key, label, existing }, i) => (
                    <FloatingFileInput
                      key={key}
                      id={`pi-${key}`}
                      label={`${i + 1}. ${label}`}
                      accept="image/*,.pdf"
                      file={files[key]}
                      existing={existingPath(existing)}
                      onChange={(file) => handleFileChange(key, file)}
                      error={err(key)}
                    />
                  ))}
                </div>
              </div>

              <hr className="bihar-section-divider" />

              {/* Section 4: Remarks */}
              <div id="sec-4" className="bihar-section-block">
                <SectionHeader num="4" total={SECTIONS.length} title="Remarks" desc="Any note about the installation work." />
                <div className="bihar-form-grid">
                  <div className="bihar-form-col-span-full">
                    <FloatingTextarea id="pi-rem" label="Remarks" placeholder="Enter the Remark..." value={remarks} onChange={(v) => { setRemarks(v); clearError('inst_remarks'); }} error={err('inst_remarks')} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sticky Action Footer */}
          <div className="bihar-form-sticky-bar">
            <span className="ax-badge ax-badge--soft ax-badge--primary ax-badge--pill">
              {capturedCount} / {PHOTO_FIELDS.length} photos
            </span>
            <div className="ax-cluster" style={{ gap: 'var(--ax-space-3)' }}>
              <button type="button" className="ax-btn ax-btn--secondary" onClick={() => navigate(-1)} disabled={submitting}>
                <span className="ax-btn__label">Cancel</span>
              </button>
              <button
                type="submit"
                disabled={submitting || isSiteApproved}
                className="ax-btn ax-btn--primary"
                style={{ minWidth: 200, ...(isSiteApproved ? { opacity: 0.6, cursor: 'not-allowed' } : {}) }}
                title={isSiteApproved ? 'Installation is approved — editing locked' : undefined}
              >
                {submitting ? (
                  <>
                    <svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ animation: 'spin 1s linear infinite' }}><path d="M12 3a9 9 0 1 0 9 9" /></svg>
                    <span className="ax-btn__label">Saving Installation...</span>
                  </>
                ) : isSiteApproved ? (
                  <>
                    <svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                    <span className="ax-btn__label">Approved (Locked)</span>
                  </>
                ) : (
                  <>
                    <svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l5 5l10 -10" /></svg>
                    <span className="ax-btn__label">Save Installation</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}

/* =========================================================================
 * Helper Reusable Floating Components (same as SRT 200MW Add Survey)
 * ========================================================================= */

function SectionHeader({ num, total, title, desc }: { num: string; total: number; title: string; desc?: ReactNode }) {
  return (
    <div className="bihar-section-header">
      <div className="bihar-section-title-wrap">
        <div className="ax-cluster" style={{ gap: 'var(--ax-space-2)', alignItems: 'center' }}>
          <span className="ax-badge ax-badge--soft ax-badge--primary ax-badge--pill" style={{ fontWeight: 600 }}>
            Section {num} of {total}
          </span>
          <h3 style={{ fontSize: 'var(--ax-text-base)', fontWeight: 600, margin: 0, color: 'var(--ax-text-strong)' }}>{title}</h3>
        </div>
        {desc && <p style={{ margin: '4px 0 0', fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-muted)' }}>{desc}</p>}
      </div>
    </div>
  );
}

function FieldFeedback({ error }: { error?: string }) {
  if (error) {
    return (
      <span className="ax-field-feedback ax-field-feedback--error" role="alert">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ width: 12, height: 12 }}>
          <circle cx="12" cy="12" r="9" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        {error}
      </span>
    );
  }
  return <span className="ax-field-feedback" />;
}

interface FloatingInputProps {
  id: string;
  label: string;
  type?: string;
  readOnly?: boolean;
  placeholder?: string;
  value: string;
  onChange?: (val: string) => void;
  error?: string;
}

function FloatingInput({ id, label, type = 'text', readOnly, placeholder = ' ', value, onChange, error }: FloatingInputProps) {
  return (
    <div>
      <div className="ax-float">
        <input
          id={id}
          type={type}
          className={`ax-input ax-float__input ${error ? 'is-invalid' : ''}`}
          placeholder={placeholder}
          value={value}
          readOnly={readOnly}
          onChange={(e) => onChange?.(e.target.value)}
          aria-invalid={Boolean(error)}
        />
        <label className="ax-float__label" htmlFor={id}>{label}</label>
      </div>
      <FieldFeedback error={error} />
    </div>
  );
}

interface FloatingTextareaProps {
  id: string;
  label: string;
  placeholder?: string;
  value: string;
  rows?: number;
  onChange: (val: string) => void;
  error?: string;
}

function FloatingTextarea({ id, label, placeholder = 'Enter Remarks...', value, rows = 3, onChange, error }: FloatingTextareaProps) {
  return (
    <div>
      <div className="ax-float ax-float--area">
        <textarea
          id={id}
          rows={rows}
          className={`ax-textarea ax-float__input ${error ? 'is-invalid' : ''}`}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={Boolean(error)}
        />
        <label className="ax-float__label" htmlFor={id}>{label}</label>
      </div>
      <FieldFeedback error={error} />
    </div>
  );
}

interface FloatingFileInputProps {
  id: string;
  label: string;
  accept?: string;
  file: File | null;
  existing?: string | null;
  onChange: (file: File | null) => void;
  error?: string;
}

function FloatingFileInput({ id, label, accept, file, existing, onChange, error }: FloatingFileInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const existingName = existing ? existing.split('/').pop() : null;
  const existingUrl = useMemo(() => (existing ? getImageCandidates(existing)[0] : ''), [existing]);

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const chosen = e.dataTransfer.files?.[0];
    if (chosen) onChange(chosen);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label
        htmlFor={id}
        style={{
          fontSize: '12px',
          fontWeight: 600,
          color: error ? 'var(--ax-danger-500, #ef4444)' : 'var(--ax-text-strong, #334155)',
          display: 'flex',
          alignItems: 'center',
          gap: 4,
        }}
      >
        <span>{label}</span>
      </label>

      <input
        ref={inputRef}
        id={id}
        type="file"
        accept={accept}
        style={{ display: 'none' }}
        onChange={(e) => onChange(e.target.files?.[0] || null)}
      />

      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        style={{
          border: isDragging
            ? '1.5px dashed #2563eb'
            : error
            ? '1.5px dashed var(--ax-danger-500, #ef4444)'
            : isHovered ? '1.5px dashed #94a3b8' : '1.5px dashed #cbd5e1',
          borderRadius: 8,
          background: isDragging ? '#eff6ff' : error ? '#fef2f2' : isHovered ? '#fbfcfd' : '#ffffff',
          padding: file || existingName ? '12px 16px' : '22px 16px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          minHeight: 110,
        }}
      >
        {file ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, textAlign: 'left' }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#ecfdf5', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ax-text-strong)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {file.name}
                </div>
                <div style={{ fontSize: 11, color: 'var(--ax-text-muted)', marginTop: 2 }}>
                  {(file.size / 1024).toFixed(0)} KB · Ready to upload
                </div>
              </div>
            </div>
            <button type="button" className="ax-btn ax-btn--ghost ax-btn--sm" onClick={handleClear} style={{ color: '#ef4444', flexShrink: 0 }} title="Remove file">
              Remove
            </button>
          </div>
        ) : existingName ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, textAlign: 'left' }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#eff6ff', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                </svg>
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ax-text-strong)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {existingName}
                </div>
                <div style={{ fontSize: 11, color: 'var(--ax-text-muted)', marginTop: 2 }}>
                  Captured · Click to replace
                </div>
              </div>
            </div>
            <span className="ax-btn ax-btn--secondary ax-btn--sm" style={{ flexShrink: 0, pointerEvents: 'none' }}>
              Replace
            </span>
          </div>
        ) : (
          <>
            <div style={{ width: 38, height: 38, borderRadius: '50%', background: '#eff6ff', color: '#3b82f6', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 6 }}>
              <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" />
                <path d="M12 12v9" />
                <path d="m8 16 4-4 4 4" />
              </svg>
            </div>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ax-text-strong, #1e293b)' }}>
              Not captured · Click to upload or drag &amp; drop
            </div>
            <div style={{ fontSize: 11, color: 'var(--ax-text-muted, #64748b)', marginTop: 3 }}>
              JPG, PNG, WEBP or PDF — single file
            </div>
          </>
        )}
      </div>

      {existingUrl && !file && (
        <a className="ula-photo-view" href={existingUrl} target="_blank" rel="noreferrer">
          View captured file ↗
        </a>
      )}

      <FieldFeedback error={error} />
    </div>
  );
}

export default Bihar_Installation_ULA_PendingInstallation;