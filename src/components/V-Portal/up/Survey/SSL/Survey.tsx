import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { PageHead } from '../../../../shell/PageHead';
import {
  upSurveyService,
  getUpSurveyMediaUrl,
  type UpSslSiteDropdownItem,
  type UpSslSiteRecord,
} from '../../up-services';

// CSS: Unified Single-Card Layout with Floating Labels & Section Dividers (same as Bihar SRT design)
const SINGLE_CARD_FORM_CSS = `
.up-single-card-form .ax-card { border: 1px solid var(--ax-border); border-radius: var(--ax-radius-xl); background: var(--ax-surface-solid); box-shadow: var(--ax-shadow-sm); overflow: hidden; }
.up-single-card-form .ax-card__header { padding: var(--ax-space-5) var(--ax-space-6); border-bottom: 1px solid var(--ax-border-subtle); background: var(--ax-surface-subtle); display: flex; flex-direction: column; gap: var(--ax-space-4); }
.up-single-card-form .ax-card__body { padding: var(--ax-space-6); }

.up-section-pills { display: flex; gap: var(--ax-space-2); overflow-x: auto; padding-bottom: 4px; scrollbar-width: thin; }
.up-section-pill-btn { display: inline-flex; align-items: center; gap: 6px; padding: 6px 14px; border-radius: var(--ax-radius-pill); font-size: var(--ax-text-xs); font-weight: 500; white-space: nowrap; background: var(--ax-surface-solid); border: 1px solid var(--ax-border); color: var(--ax-text); cursor: pointer; transition: all var(--ax-motion-fast) var(--ax-ease-standard); text-decoration: none; }
.up-section-pill-btn:hover { border-color: var(--ax-accent); color: var(--ax-accent); background: color-mix(in srgb, var(--ax-accent) 6%, var(--ax-surface-solid)); }
.up-section-pill-btn .pill-num { width: 18px; height: 18px; border-radius: 50%; background: var(--ax-surface-subtle); display: inline-flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 700; }

.up-section-block { padding-top: var(--ax-space-2); scroll-margin-top: 80px; }
.up-section-header { display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: var(--ax-space-2); margin-bottom: var(--ax-space-5); padding-bottom: var(--ax-space-3); border-bottom: 1px solid var(--ax-border-subtle); }
.up-section-title-wrap { display: flex; flex-direction: column; gap: 4px; }
.up-section-divider { border: 0; border-top: 1px dashed var(--ax-border); margin: var(--ax-space-8) 0 var(--ax-space-6); }

.ax-float { position: relative; width: 100%; }
.ax-float__input { width: 100%; height: 46px; padding: 12px 14px 4px 14px; font-size: var(--ax-text-sm); background: var(--ax-surface-solid); border: 1px solid var(--ax-border); border-radius: var(--ax-radius-md); color: var(--ax-text); outline: none; transition: border-color var(--ax-motion-fast) var(--ax-ease-standard), box-shadow var(--ax-motion-fast) var(--ax-ease-standard); }
.ax-float__input::placeholder { color: transparent; }
.ax-float__input:focus { border-color: var(--ax-accent); box-shadow: 0 0 0 3px color-mix(in srgb, var(--ax-accent) 20%, transparent); }
.ax-float__input[readonly] { background: var(--ax-surface-subtle); }
.ax-float__input:disabled { opacity: .7; cursor: not-allowed; background: var(--ax-surface-subtle); }

.ax-float__label { position: absolute; inset-inline-start: 12px; top: 50%; transform: translateY(-50%); margin: 0; padding: 0 4px; font-size: var(--ax-text-sm); color: var(--ax-text-subtle); background: var(--ax-surface-solid); border-radius: var(--ax-radius-xs); pointer-events: none; transition: top var(--ax-motion-fast) var(--ax-ease-standard), font-size var(--ax-motion-fast) var(--ax-ease-standard), color var(--ax-motion-fast) var(--ax-ease-standard); z-index: 2; white-space: nowrap; max-width: calc(100% - 24px); overflow: hidden; text-overflow: ellipsis; }

.ax-float__input:focus + .ax-float__label,
.ax-float__input:not(:placeholder-shown) + .ax-float__label,
.ax-float--select .ax-float__label,
.ax-float--file .ax-float__label { top: 0; transform: translateY(-50%); font-size: var(--ax-text-2xs); font-weight: 500; color: var(--ax-text-muted); }
.ax-float__input:focus + .ax-float__label { color: var(--ax-accent); }

.ax-float__input.is-invalid { border-color: var(--ax-danger-500) !important; }
.ax-float__input.is-invalid:focus { box-shadow: 0 0 0 3px color-mix(in srgb, var(--ax-danger-500) 24%, transparent) !important; }
.ax-float__input.is-invalid + .ax-float__label { color: var(--ax-danger-500) !important; }

.ax-float--area .ax-float__input { height: auto; min-height: 84px; padding-top: 18px; resize: vertical; }
.ax-float--area .ax-float__label { top: 18px; transform: none; }
.ax-float--area .ax-float__input:focus + .ax-float__label,
.ax-float--area .ax-float__input:not(:placeholder-shown) + .ax-float__label { top: 0; transform: translateY(-50%); }

.ax-field-feedback { display: flex; align-items: center; gap: 4px; margin-top: 4px; font-size: var(--ax-text-2xs); min-height: 16px; }
.ax-field-feedback--error { color: var(--ax-danger-500); }

.up-form-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: var(--ax-space-4); }
@media (min-width: 1024px) { .up-form-grid--3col { grid-template-columns: repeat(3, 1fr); } }
.up-form-col-span-full { grid-column: 1 / -1; }
.up-gps-cell { height: 46px; }

.up-form-sticky-bar { position: sticky; bottom: var(--ax-space-4); z-index: 30; margin-top: var(--ax-space-6); padding: var(--ax-space-3) var(--ax-space-5); background: var(--ax-surface-solid); border: 1px solid var(--ax-border); border-radius: var(--ax-radius-xl); box-shadow: var(--ax-shadow-lg); display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: var(--ax-space-3); backdrop-filter: blur(12px); }

@keyframes up-spin { to { transform: rotate(360deg); } }
`;

type Option = { value: string; label: string };
const MAX_FILE_SIZE = 5 * 1024 * 1024;

const SECTIONS = [
  { id: 'sec-1', num: '1', title: 'Select UID' },
  { id: 'sec-2', num: '2', title: 'Site Details' },
  { id: 'sec-3', num: '3', title: 'Mode & Coordinates' },
  { id: 'sec-4', num: '4', title: 'Demo Images' },
  { id: 'sec-5', num: '5', title: 'Uploaded Images' },
];

export function UP_Survey_SSL_Survey() {
  const [sites, setSites] = useState<UpSslSiteDropdownItem[]>([]);
  const [loadingSites, setLoadingSites] = useState(false);
  const [selectedSiteId, setSelectedSiteId] = useState<string>('');
  const [siteDetail, setSiteDetail] = useState<UpSslSiteRecord | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Survey input fields
  const [mode, setMode] = useState('Online');
  const [vRemarks, setVRemarks] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [image1, setImage1] = useState<File | null>(null);
  const [image2, setImage2] = useState<File | null>(null);

  const [locating, setLocating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string[]>>({});

  const clearError = (name: string) => {
    setValidationErrors((prev) => {
      if (!prev[name]) return prev;
      const next = { ...prev };
      delete next[name];
      return next;
    });
  };

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleImageChange = (setter: (f: File | null) => void, file: File | null) => {
    if (file && file.size > MAX_FILE_SIZE) {
      alert('File size exceeds 5MB limit.');
      return;
    }
    setter(file);
  };

  // Load assigned sites for dropdown (endpoint 1: up/ssl/survey/fetch-site)
  useEffect(() => {
    setLoadingSites(true);
    upSurveyService
      .getSslSites()
      .then((res) => setSites(res))
      .catch((err) => console.error('Error fetching assigned SSL sites:', err))
      .finally(() => setLoadingSites(false));
  }, []);

  // Fetch site details on select (endpoint 2: up/ssl/survey/fetches-record/{id})
  const handleSelectSite = async (siteIdStr: string) => {
    setSelectedSiteId(siteIdStr);
    clearError('site_id');
    if (!siteIdStr) {
      setSiteDetail(null);
      return;
    }
    setLoadingDetail(true);
    try {
      const detail = await upSurveyService.getSslRecord(siteIdStr);
      setSiteDetail(detail);
      if (detail?.remarks) setVRemarks(detail.remarks);
    } catch (err) {
      console.error('Error fetching site record:', err);
      setErrorMsg('Failed to load site details.');
    } finally {
      setLoadingDetail(false);
    }
  };

  // GPS detection
  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitude(pos.coords.latitude.toFixed(6));
        setLongitude(pos.coords.longitude.toFixed(6));
        setLocating(false);
      },
      (err) => {
        setLocating(false);
        alert(`Location error: ${err.message}`);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Submit survey (endpoint 3: up/ssl/survey/update-ssl)
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSuccessMsg(null);
    setErrorMsg(null);

    if (!selectedSiteId) {
      setValidationErrors({ site_id: ['Please select a site UID.'] });
      setErrorMsg('Please select a site UID.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('id', selectedSiteId);
      if (mode) fd.append('mode', mode);
      if (vRemarks) fd.append('v_remarks', vRemarks);
      if (latitude) fd.append('latitude', latitude);
      if (longitude) fd.append('longitude', longitude);
      if (image1) fd.append('image1', image1);
      if (image2) fd.append('image2', image2);

      const res = await upSurveyService.updateSslSurvey(fd);
      if (res.status) {
        setSuccessMsg(res.message || 'Details updated successfully.');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        // Re-fetch record to refresh uploaded images and status
        const updated = await upSurveyService.getSslRecord(selectedSiteId);
        if (updated) setSiteDetail(updated);
        setImage1(null);
        setImage2(null);
      } else {
        setErrorMsg(res.message || 'Failed to update survey details.');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Error occurred while submitting.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setSubmitting(false);
    }
  };

  const siteOptions: Option[] = sites.map((s) => ({ value: String(s.id), label: String(s.uid) }));
  const imagesList = siteDetail?.images || [];

  return (
    <div className="up-single-card-form">
      <style>{SINGLE_CARD_FORM_CSS}</style>

      <PageHead
        title="Update SSL Survey Status"
        subtitle={
          <span style={{ fontSize: 'var(--ax-text-sm)', color: 'var(--ax-text-muted)' }}>
            Record field survey inspection for assigned street light sites
          </span>
        }
        breadcrumbs={[
          { label: 'Home', href: '/v' },
          { label: 'Update SSL Survey Status' },
        ]}
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

      {/* Main Single Card Form */}
      <form onSubmit={handleSubmit} noValidate>
        <div className="ax-card">
          {/* Card Header with Title and Section Pills */}
          <div className="ax-card__header">
            <div>
              <span className="ax-card__eyebrow">SSL Survey</span>
              <h2 className="ax-card__title" style={{ margin: 0 }}>Update SSL Survey Status</h2>
              <p className="ax-card__subtitle" style={{ margin: '4px 0 0' }}>
                All survey fields organized inside one main card across 5 dedicated sections.
              </p>
            </div>

            <div className="up-section-pills" role="navigation" aria-label="Jump to section">
              {SECTIONS.map((s) => (
                <button key={s.id} type="button" onClick={() => scrollToSection(s.id)} className="up-section-pill-btn">
                  <span className="pill-num">{s.num}</span>
                  <span>{s.title}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="ax-card__body">
            {/* Section 1: Select UID */}
            <div id="sec-1" className="up-section-block">
              <SectionHeader num="1" total={5} title="Select UID" desc="Choose the assigned street light site to update." />
              <div className="up-form-grid up-form-grid--3col">
                <div className="up-form-col-span-full" style={{ maxWidth: 540 }}>
                  <FloatingSelect
                    id="up-ssl-site"
                    label="Select UID's"
                    required
                    placeholder={loadingSites ? 'Loading assigned sites...' : '-- Select --'}
                    value={selectedSiteId}
                    options={siteOptions}
                    disabled={loadingSites}
                    onChange={handleSelectSite}
                    error={validationErrors.site_id?.[0]}
                  />
                </div>
              </div>
            </div>

            <hr className="up-section-divider" />

            {/* Section 2: Site Details (read-only) */}
            <div id="sec-2" className="up-section-block">
              <SectionHeader
                num="2"
                total={5}
                title="Site Details"
                desc={loadingDetail ? 'Loading site details...' : 'Auto-populated from selected site record (Read-only).'}
              />
              <div className="up-form-grid up-form-grid--3col">
                <FloatingInput id="up-ssl-fy" label="Financial Year" readOnly value={siteDetail?.fy || siteDetail?.financial_year || ''} />
                <FloatingInput id="up-ssl-state" label="State" readOnly value={(siteDetail?.state || 'UP').toUpperCase()} />
                <FloatingInput id="up-ssl-district" label="District" readOnly value={siteDetail?.district || ''} />
                <FloatingInput id="up-ssl-village" label="Village" readOnly value={siteDetail?.village || ''} />
                <FloatingInput id="up-ssl-scheme" label="Scheme" readOnly value={siteDetail?.scheme || ''} />
                <FloatingInput id="up-ssl-vendor" label="Vendor" readOnly value={siteDetail?.vendor || ''} />
                <FloatingInput id="up-ssl-beneficiary" label="Beneficiary Name" readOnly value={siteDetail?.beneficiary_name || ''} />
                <FloatingInput id="up-ssl-uid" label="UID" readOnly value={siteDetail?.uid || (selectedSiteId ? `ID #${selectedSiteId}` : '')} />
                <FloatingInput id="up-ssl-contact" label="Contact" readOnly value={siteDetail?.contact || siteDetail?.contact_no || ''} />
                <FloatingInput id="up-ssl-material" label="Material Supply" readOnly value={siteDetail?.material_supply || ''} />
                <FloatingInput id="up-ssl-supply-date" label="Supply Date" readOnly value={siteDetail?.supply_date || ''} />
                <FloatingInput id="up-ssl-install" label="Install" readOnly value={siteDetail?.install || ''} />
                <FloatingInput id="up-ssl-installed-date" label="Installed Date" readOnly value={siteDetail?.installed_date || ''} />
                <FloatingInput id="up-ssl-payment" label="Payment 85%" readOnly value={siteDetail?.payment_85 || ''} />
                <FloatingInput id="up-ssl-amc1" label="AMC 1" readOnly value={String(siteDetail?.amc1 ?? '')} />
                <FloatingInput id="up-ssl-amc2" label="AMC 2" readOnly value={String(siteDetail?.amc2 ?? '')} />
                <FloatingInput id="up-ssl-amc3" label="AMC 3" readOnly value={String(siteDetail?.amc3 ?? '')} />
                <FloatingInput id="up-ssl-amc4" label="AMC 4" readOnly value={String(siteDetail?.amc4 ?? '')} />
                <FloatingInput id="up-ssl-amc5" label="AMC 5" readOnly value={String(siteDetail?.amc5 ?? '')} />
                <FloatingInput id="up-ssl-doc" label="Document Submitted" readOnly value={siteDetail?.doc_submit || siteDetail?.document_submitted || ''} />
              </div>
            </div>

            <hr className="up-section-divider" />

            {/* Section 3: Mode & Coordinates */}
            <div id="sec-3" className="up-section-block">
              <SectionHeader num="3" total={5} title="Mode & Coordinates" desc="Survey mode, GPS coordinates and remarks." />
              <div className="up-form-grid up-form-grid--3col">
                <FloatingSelect
                  id="up-ssl-mode"
                  label="Mode"
                  placeholder="-- Select Mode --"
                  options={[
                    { value: 'Online', label: 'ONLINE' },
                    { value: 'Offline', label: 'OFFLINE' },
                  ]}
                  value={mode}
                  onChange={setMode}
                />
                <FloatingInput id="up-ssl-lat" label="Latitude" placeholder="e.g. 26.8467" value={latitude} onChange={setLatitude} />
                <FloatingInput id="up-ssl-lng" label="Longitude" placeholder="e.g. 80.9462" value={longitude} onChange={setLongitude} />
                <div>
                  <button type="button" className="ax-btn ax-btn--secondary up-gps-cell" style={{ width: '100%' }} onClick={handleGetLocation} disabled={locating}>
                    <span className="ax-btn__label">{locating ? 'Detecting GPS...' : '📍 Get GPS'}</span>
                  </button>
                </div>
                <div className="up-form-col-span-full">
                  <FloatingTextarea id="up-ssl-remarks" label="Remarks" placeholder="Enter remarks..." value={vRemarks} onChange={setVRemarks} />
                </div>
              </div>
            </div>

            <hr className="up-section-divider" />

            {/* Section 4: Demo Images */}
            <div id="sec-4" className="up-section-block">
              <SectionHeader num="4" total={5} title="Demo Images" desc="Max 5 MB each (jpg, jpeg, png, webp)." />
              <div className="up-form-grid up-form-grid--3col">
                <FloatingFileInput
                  id="up-ssl-img1"
                  label="Demo 1 (Image 1)"
                  accept="image/jpeg,image/png,image/jpg,image/webp"
                  file={image1}
                  onChange={(file) => handleImageChange(setImage1, file)}
                />
                <FloatingFileInput
                  id="up-ssl-img2"
                  label="Demo 2 (Image 2)"
                  accept="image/jpeg,image/png,image/jpg,image/webp"
                  file={image2}
                  onChange={(file) => handleImageChange(setImage2, file)}
                />
              </div>
            </div>

            <hr className="up-section-divider" />

            {/* Section 5: Uploaded Images */}
            <div id="sec-5" className="up-section-block">
              <SectionHeader
                num="5"
                total={5}
                title="Uploaded Images"
                desc={imagesList.length > 0 ? `${imagesList.length} survey visit(s) recorded for this site.` : 'Previously uploaded survey visit images.'}
              />
              {imagesList.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--ax-space-4)' }}>
                  {imagesList.map((imgSet, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: 'var(--ax-space-4)',
                        borderRadius: 'var(--ax-radius-md)',
                        background: 'var(--ax-surface-subtle)',
                        border: '1px solid var(--ax-border)',
                      }}
                    >
                      <div className="ax-cluster" style={{ justifyContent: 'space-between', marginBottom: 'var(--ax-space-2)', fontSize: 'var(--ax-text-xs)' }}>
                        <div>
                          <span style={{ color: 'var(--ax-text-muted)' }}>Date: </span>
                          <strong>{imgSet.date || '—'}</strong> | <span style={{ color: 'var(--ax-text-muted)' }}>Mode: </span>
                          <strong>{imgSet.mode || '—'}</strong>
                        </div>
                        <div>
                          <span style={{ color: 'var(--ax-text-muted)' }}>Coordinates: </span>
                          <strong>{imgSet.latitude ? `${imgSet.latitude}, ${imgSet.longitude || imgSet.lognitude}` : '—'}</strong>
                        </div>
                      </div>
                      {imgSet.remarks && (
                        <div style={{ fontSize: 'var(--ax-text-xs)', marginBottom: 'var(--ax-space-2)' }}>
                          <span style={{ color: 'var(--ax-text-muted)' }}>Remarks: </span>
                          {imgSet.remarks}
                        </div>
                      )}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 'var(--ax-space-3)' }}>
                        {[imgSet.image1, imgSet.image2].map((img, i) =>
                          img ? (
                            <div key={i} style={{ textAlign: 'center' }}>
                              <a href={getUpSurveyMediaUrl(img)} target="_blank" rel="noreferrer">
                                <img
                                  src={getUpSurveyMediaUrl(img)}
                                  alt={`Visit ${idx + 1} Image ${i + 1}`}
                                  style={{ width: '100%', height: 120, objectFit: 'cover', borderRadius: 0, border: '1px solid var(--ax-border)' }}
                                />
                              </a>
                              <span style={{ fontSize: 11, color: 'var(--ax-text-muted)', display: 'block', marginTop: 4 }}>
                                Image {i + 1}
                              </span>
                            </div>
                          ) : null
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ fontSize: 'var(--ax-text-sm)', color: 'var(--ax-text-muted)', margin: 0 }}>
                  No previous survey visit records for this site.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Sticky Action Footer */}
        <div className="up-form-sticky-bar">
          <span className="ax-badge ax-badge--soft ax-badge--primary ax-badge--pill">Update Status</span>
          <div className="ax-cluster" style={{ gap: 'var(--ax-space-3)' }}>
            <button type="submit" disabled={submitting || !selectedSiteId} className="ax-btn ax-btn--primary" style={{ minWidth: 220 }}>
              {submitting ? (
                <>
                  <svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ animation: 'up-spin 1s linear infinite' }}><path d="M12 3a9 9 0 1 0 9 9" /></svg>
                  <span className="ax-btn__label">Submitting Survey...</span>
                </>
              ) : (
                <>
                  <svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l5 5l10 -10" /></svg>
                  <span className="ax-btn__label">Update SSL Survey Status</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>

      <footer style={{ marginTop: 'var(--ax-space-8)', textAlign: 'center', fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-muted)' }}>
        Copyright © <a href="https://klkerp.com" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--ax-primary)' }}>ETS NETWORKS</a>. All rights reserved.
      </footer>
    </div>
  );
}

export const UPSurveySSLSurvey = UP_Survey_SSL_Survey;
export default UP_Survey_SSL_Survey;

/* =========================================================================
 * Reusable Floating Components (same as Bihar SRT)
 * ========================================================================= */

function SectionHeader({ num, total, title, desc }: { num: string; total: number; title: string; desc?: ReactNode }) {
  return (
    <div className="up-section-header">
      <div className="up-section-title-wrap">
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

const Asterisk = () => <span style={{ color: 'var(--ax-danger-500)', marginLeft: 3 }}>*</span>;

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
  required?: boolean;
  readOnly?: boolean;
  maxLength?: number;
  placeholder?: string;
  value: string;
  onChange?: (val: string) => void;
  error?: string;
}

function FloatingInput({ id, label, type = 'text', required, readOnly, maxLength, placeholder = ' ', value, onChange, error }: FloatingInputProps) {
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
          maxLength={maxLength}
          onChange={(e) => onChange?.(e.target.value)}
          aria-invalid={Boolean(error)}
        />
        <label className="ax-float__label" htmlFor={id}>
          {label}
          {required && <Asterisk />}
        </label>
      </div>
      <FieldFeedback error={error} />
    </div>
  );
}

interface FloatingSelectProps {
  id: string;
  label: string;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  value: string;
  options: Option[];
  onChange: (val: string) => void;
  error?: string;
}

function FloatingSelect({ id, label, required, disabled, placeholder = '-- Select --', value, options, onChange, error }: FloatingSelectProps) {
  return (
    <div>
      <div className="ax-float ax-float--select">
        <select
          id={id}
          className={`ax-select ax-float__input ${error ? 'is-invalid' : ''}`}
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={Boolean(error)}
        >
          <option value="">{placeholder}</option>
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <label className="ax-float__label" htmlFor={id}>
          {label}
          {required && <Asterisk />}
        </label>
      </div>
      <FieldFeedback error={error} />
    </div>
  );
}

interface FloatingTextareaProps {
  id: string;
  label: string;
  required?: boolean;
  placeholder?: string;
  value: string;
  rows?: number;
  onChange: (val: string) => void;
  error?: string;
}

function FloatingTextarea({ id, label, required, placeholder = 'Enter Remarks...', value, rows = 3, onChange, error }: FloatingTextareaProps) {
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
        <label className="ax-float__label" htmlFor={id}>
          {label}
          {required && <Asterisk />}
        </label>
      </div>
      <FieldFeedback error={error} />
    </div>
  );
}

interface FloatingFileInputProps {
  id: string;
  label: string;
  required?: boolean;
  accept?: string;
  capture?: 'user' | 'environment';
  file: File | null;
  existingUrl?: string | null;
  onChange: (file: File | null) => void;
  error?: string;
}

function FloatingFileInput({ id, label, required, accept, capture, file, existingUrl, onChange, error }: FloatingFileInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

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

  const existingClean = existingUrl ? existingUrl.split('?')[0] : '';
  const existingName = existingClean ? existingClean.split('/').pop() : null;

  return (
    <div className={error ? 'is-invalid' : undefined} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
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
        {required && <Asterisk />}
      </label>

      <input
        ref={inputRef}
        id={id}
        type="file"
        accept={accept}
        capture={capture}
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
          background: isDragging
            ? '#eff6ff'
            : error
            ? '#fef2f2'
            : isHovered ? '#fbfcfd' : '#ffffff',
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
                  Existing file · Click to replace
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
              Click to upload or drag & drop
            </div>
            <div style={{ fontSize: 11, color: 'var(--ax-text-muted, #64748b)', marginTop: 3 }}>
              {accept === 'application/pdf' || accept === '.pdf' ? 'PDF file up to 5MB' : 'JPG, PNG or WEBP up to 5MB'}
            </div>
          </>
        )}
      </div>

      <FieldFeedback error={error} />
    </div>
  );
}