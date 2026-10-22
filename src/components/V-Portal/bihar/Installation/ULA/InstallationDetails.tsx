import { useState, useEffect, useCallback, useRef, useMemo, type FormEvent, type ChangeEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PageHead } from '../../../../shell/PageHead';
import {
  biharUlaInstallationService,
  type SiteDetailResponse,
} from '../../../../../services/biharUlaInstallationService';

/* ── Inline SVG Icons matching the target UI ── */
const ICON_CROSSHAIR = (
  <svg style={{ width: 15, height: 15 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="10" />
    <line x1="22" y1="12" x2="18" y2="12" />
    <line x1="6" y1="12" x2="2" y2="12" />
    <line x1="12" y1="6" x2="12" y2="2" />
    <line x1="12" y1="22" x2="12" y2="18" />
  </svg>
);

const ICON_CAMERA = (
  <svg style={{ width: 15, height: 15 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
    <circle cx="12" cy="13" r="4" />
  </svg>
);

const ICON_GALLERY = (
  <svg style={{ width: 15, height: 15 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
    <circle cx="8.5" cy="8.5" r="1.5" />
    <polyline points="21 15 16 10 5 21" />
  </svg>
);

const ICON_NOT_CAPTURED = (
  <svg style={{ width: 15, height: 15 }} viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="9" />
  </svg>
);

const ICON_CAPTURED = (
  <svg style={{ width: 15, height: 15 }} viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const ICON_CANCEL = (
  <svg style={{ width: 16, height: 16 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="10" />
    <line x1="15" y1="9" x2="9" y2="15" />
    <line x1="9" y1="9" x2="15" y2="15" />
  </svg>
);

const ICON_SUBMIT = (
  <svg style={{ width: 16, height: 16 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <line x1="22" y1="2" x2="11" y2="13" />
    <polygon points="22 2 15 22 11 13 2 9 22 2" />
  </svg>
);

const ICON_TRASH = (
  <svg style={{ width: 12, height: 12 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

export function Bihar_Installation_ULA_InstallationDetails() {
  const navigate = useNavigate();

  // ── Step 1: Site Selection ──
  const [siteOptions, setSiteOptions] = useState<{ id: number; beneficiary_name: string }[]>([]);
  const [loadingSites, setLoadingSites] = useState(true);
  const [selectedSiteId, setSelectedSiteId] = useState<string>('');
  const [siteDetails, setSiteDetails] = useState<SiteDetailResponse | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // ── Step 2: Installation & GPS ──
  const [beneficiaryName, setBeneficiaryName] = useState('');
  const [contactNo, setContactNo] = useState('');
  const [caNumber, setCaNumber] = useState('');
  const [moduleSerial1, setModuleSerial1] = useState('');
  const [moduleSerial2, setModuleSerial2] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [gpsDetecting, setGpsDetecting] = useState(false);
  const [gpsStatusMsg, setGpsStatusMsg] = useState<string | null>(null);

  // ── Step 3: Photos ──
  // 1. Foundation & Fastener (1 to 4 photos)
  const [fastenerPhotos, setFastenerPhotos] = useState<File[]>([]);
  const [fastenerPreviews, setFastenerPreviews] = useState<string[]>([]);
  const fastenerCameraRef = useRef<HTMLInputElement>(null);
  const fastenerGalleryRef = useRef<HTMLInputElement>(null);

  // 2. Structure (1 photo)
  const [structurePhoto, setStructurePhoto] = useState<File | null>(null);
  const [structurePreview, setStructurePreview] = useState<string | null>(null);
  const structureCameraRef = useRef<HTMLInputElement>(null);
  const structureGalleryRef = useRef<HTMLInputElement>(null);

  // 3. Module Serial Number 1 (1 photo)
  const [module1Photo, setModule1Photo] = useState<File | null>(null);
  const [module1Preview, setModule1Preview] = useState<string | null>(null);
  const module1CameraRef = useRef<HTMLInputElement>(null);
  const module1GalleryRef = useRef<HTMLInputElement>(null);

  // 4. Module Serial Number 2 (1 photo)
  const [module2Photo, setModule2Photo] = useState<File | null>(null);
  const [module2Preview, setModule2Preview] = useState<string | null>(null);
  const module2CameraRef = useRef<HTMLInputElement>(null);
  const module2GalleryRef = useRef<HTMLInputElement>(null);

  // Preview Modal for clicked image
  const [modalImage, setModalImage] = useState<{ url: string; title: string } | null>(null);

  // ── Submission State ──
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Load site dropdown options
  const loadSites = useCallback(async () => {
    setLoadingSites(true);
    try {
      const names = await biharUlaInstallationService.fetchSiteNames();
      setSiteOptions(names || []);
    } catch (err: any) {
      console.error('[ULA Installation] fetchSiteNames error:', err);
    } finally {
      setLoadingSites(false);
    }
  }, []);

  useEffect(() => {
    loadSites();
  }, [loadSites]);

  // Auto GPS location on initial page load
  const handleDetectGps = useCallback(() => {
    if (!navigator.geolocation) {
      setGpsStatusMsg('Geolocation is not supported by your browser.');
      return;
    }
    setGpsDetecting(true);
    setGpsStatusMsg('Locating coordinates via satellite GPS…');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude.toFixed(6);
        const lng = pos.coords.longitude.toFixed(6);
        setLatitude(lat);
        setLongitude(lng);
        setGpsDetecting(false);
        setGpsStatusMsg(`GPS Lock Acquired (Accuracy: ±${Math.round(pos.coords.accuracy || 5)}m)`);
      },
      (err) => {
        setGpsDetecting(false);
        setGpsStatusMsg(`Unable to lock GPS: ${err.message}. Please enter manually or retry.`);
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
    );
  }, []);

  useEffect(() => {
    handleDetectGps();
  }, [handleDetectGps]);

  // Load site details when dropdown changes
  const handleSiteChange = async (siteIdStr: string) => {
    setSelectedSiteId(siteIdStr);
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!siteIdStr) {
      setSiteDetails(null);
      setBeneficiaryName('');
      setContactNo('');
      setCaNumber('');
      return;
    }

    setLoadingDetails(true);
    try {
      const details = await biharUlaInstallationService.fetchSiteDetails(siteIdStr);
      setSiteDetails(details);
      if (details) {
        if (details.beneficiary_name) setBeneficiaryName(details.beneficiary_name);
        if (details.contact_no) setContactNo(details.contact_no);
        if (details.ca_no) setCaNumber(details.ca_no);
      }
    } catch (err: any) {
      console.error('[ULA Installation] fetchSiteDetails error:', err);
      setErrorMsg('Failed to load beneficiary details for this site.');
    } finally {
      setLoadingDetails(false);
    }
  };

  // ── Foundation & Fastener Multi-File Handler (up to 4) ──
  const handleFastenerFiles = (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const remainingSlots = 4 - fastenerPhotos.length;
    if (remainingSlots <= 0) {
      alert('Maximum 4 photos allowed for Foundation & Fastener.');
      e.target.value = '';
      return;
    }

    const validFiles: File[] = [];
    for (const f of files.slice(0, remainingSlots)) {
      if (f.size > 2 * 1024 * 1024) {
        alert(`File "${f.name}" exceeds the 2 MB limit.`);
      } else {
        validFiles.push(f);
      }
    }

    if (validFiles.length) {
      setFastenerPhotos((prev) => [...prev, ...validFiles]);
      setFastenerPreviews((prev) => [
        ...prev,
        ...validFiles.map((f) => URL.createObjectURL(f)),
      ]);
    }
    e.target.value = '';
  };

  const removeFastenerPhoto = (index: number) => {
    setFastenerPhotos((prev) => prev.filter((_, i) => i !== index));
    setFastenerPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  // ── Single Photo Handler ──
  const handleSinglePhoto = (
    e: ChangeEvent<HTMLInputElement>,
    setter: (f: File | null) => void,
    previewSetter: (u: string | null) => void
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert(`File "${file.name}" exceeds the 2 MB limit.`);
      e.target.value = '';
      return;
    }

    setter(file);
    previewSetter(URL.createObjectURL(file));
    e.target.value = '';
  };

  const removeSinglePhoto = (
    setter: (f: File | null) => void,
    previewSetter: (u: string | null) => void
  ) => {
    setter(null);
    previewSetter(null);
  };

  // Calculate captured photos count out of 4 sections
  const capturedCount = useMemo(() => {
    let count = 0;
    if (fastenerPhotos.length > 0) count++;
    if (structurePhoto) count++;
    if (module1Photo) count++;
    if (module2Photo) count++;
    return count;
  }, [fastenerPhotos.length, structurePhoto, module1Photo, module2Photo]);

  // Form Reset / Cancel
  const handleCancel = () => {
    if (window.confirm('Are you sure you want to cancel? Any unsaved inputs will be lost.')) {
      navigate('/v/bihar/ula-installation-view-site');
    }
  };

  // Form Submit
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    // Validations
    if (!selectedSiteId) {
      setErrorMsg('Please select a Site Name from the dropdown.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (!beneficiaryName.trim()) {
      setErrorMsg('Beneficiary Name is required.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (!contactNo.trim()) {
      setErrorMsg('Contact Number is required.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (!caNumber.trim()) {
      setErrorMsg('CA Number is required.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (!moduleSerial1.trim()) {
      setErrorMsg('Module Serial Number 1 is required.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (!moduleSerial2.trim()) {
      setErrorMsg('Module Serial Number 2 is required.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (!latitude.trim() || !longitude.trim()) {
      setErrorMsg('GPS Location (Latitude and Longitude) is required. Please click "Retry GPS Lock".');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (fastenerPhotos.length === 0) {
      setErrorMsg('Please capture at least 1 photo for Foundation & Fastener (1 to 4 allowed).');
      return;
    }
    if (!structurePhoto) {
      setErrorMsg('Structure photo is required.');
      return;
    }
    if (!module1Photo) {
      setErrorMsg('Photo for Module with Serial Number 1 is required.');
      return;
    }
    if (!module2Photo) {
      setErrorMsg('Photo for Module with Serial Number 2 is required.');
      return;
    }

    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('site_id', selectedSiteId);
      fd.append('beneficiary_name', beneficiaryName.trim());
      fd.append('contact_no', contactNo.trim());
      fd.append('ca_no', caNumber.trim());

      // GPS Coordinates (appending both keys for backend resilience)
      fd.append('inst_latitude', latitude.trim());
      fd.append('latitude', latitude.trim());
      fd.append('inst_longitude', longitude.trim());
      fd.append('longitude', longitude.trim());

      // Module Serial Numbers (exactly 2)
      fd.append('module_serial_no[]', moduleSerial1.trim());
      fd.append('module_serial_no[]', moduleSerial2.trim());

      // Structure Photo
      fd.append('structure_image', structurePhoto);

      // Foundation & Fastener (1 to 4 photos)
      fastenerPhotos.forEach((file) => {
        fd.append('foundation_fastener_images[]', file);
      });

      // Module Serial Photos (exactly 2 photos)
      fd.append('module_serial_image[]', module1Photo);
      fd.append('module_serial_image[]', module2Photo);

      const resp = await biharUlaInstallationService.storeStructureInstall(fd);
      setSuccessMsg(resp.message || 'Site Structure Installation saved successfully!');

      // Redirect after brief delay
      setTimeout(() => {
        navigate('/v/bihar/ula-installation-view-site');
      }, 1500);
    } catch (err: any) {
      console.error('[ULA Installation] submit error:', err);
      setErrorMsg(err?.message || 'Failed to submit site installation data. Please verify inputs.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="ax-page">
      {/* ── Page Header ── */}
      <PageHead
        title="ULA Installation"
        subtitle="Bihar ULA Installation & Physical Site Verification"
        breadcrumbs={[
          { label: 'Bihar' },
          { label: 'Installation' },
          { label: 'ULA' },
          { label: 'Installation Details' },
        ]}
        actions={
          <Link to="/v/bihar/ula-installation-view-site" className="ax-btn ax-btn--secondary ax-btn--sm">
            View Installed Sites
          </Link>
        }
      />

      {/* ── Alerts ── */}
      {errorMsg && (
        <div className="ax-alert ax-alert--danger" style={{ marginBottom: 'var(--ax-space-4)' }}>
          <div className="ax-alert__title">Error</div>
          <div className="ax-alert__text">{errorMsg}</div>
        </div>
      )}

      {successMsg && (
        <div className="ax-alert ax-alert--success" style={{ marginBottom: 'var(--ax-space-4)' }}>
          <div className="ax-alert__title">Success</div>
          <div className="ax-alert__text">{successMsg}</div>
        </div>
      )}

      {/* ── Main Form Card ── */}
      <form onSubmit={handleSubmit}>
        <div
          className="ax-card"
          style={{
            padding: '28px 32px',
            background: 'var(--ax-surface-solid)',
            borderRadius: 'var(--ax-radius-xl)',
            boxShadow: 'var(--ax-shadow-sm)',
            border: '1px solid var(--ax-border)',
          }}
        >
          {/* ══════════════════════════════════════════════════════════
              SECTION 1: SITE
             ══════════════════════════════════════════════════════════ */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
            <span
              style={{
                width: 28,
                height: 28,
                borderRadius: '50%',
                background: '#8B263E',
                color: '#ffffff',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '14px',
                flexShrink: 0,
              }}
            >
              1
            </span>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#8B263E', letterSpacing: '-0.01em' }}>
              Site
            </h3>
          </div>

          <div className="ax-field" style={{ maxWidth: '100%', marginBottom: '28px' }}>
            <label
              className="ax-field__label"
              htmlFor="site_select"
              style={{ fontWeight: 600, fontSize: '14px', marginBottom: '8px', color: 'var(--ax-text-strong)' }}
            >
              Site Name <span style={{ color: 'var(--ax-danger, #dc2626)' }}>*</span>
            </label>
            <select
              id="site_select"
              className="ax-input"
              value={selectedSiteId}
              onChange={(e) => handleSiteChange(e.target.value)}
              disabled={loadingSites}
              required
              style={{ height: '42px', fontSize: '14px', cursor: 'pointer' }}
            >
              <option value="">{loadingSites ? 'Loading sites...' : 'Select Site Name'}</option>
              {siteOptions.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.beneficiary_name} {s.id ? `(#${s.id})` : ''}
                </option>
              ))}
            </select>
            {loadingDetails && (
              <span style={{ fontSize: '12px', color: 'var(--ax-text-muted)', marginTop: '4px', display: 'block' }}>
                <span className="ax-spinner" /> Fetching beneficiary details…
              </span>
            )}
          </div>

          {/* Horizontal Divider */}
          <hr style={{ border: 'none', borderTop: '1px solid var(--ax-border-subtle, #e2e8f0)', margin: '28px 0' }} />

          {/* ══════════════════════════════════════════════════════════
              SECTION 2: INSTALLATION & GPS
             ══════════════════════════════════════════════════════════ */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '22px' }}>
            <span
              style={{
                width: 28,
                height: 28,
                borderRadius: '50%',
                background: '#8B263E',
                color: '#ffffff',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '14px',
                flexShrink: 0,
              }}
            >
              2
            </span>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#8B263E', letterSpacing: '-0.01em' }}>
              Installation & GPS
            </h3>
          </div>

          {/* Row 1: Beneficiary Name, Contact No, CA Number */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '20px',
              marginBottom: '20px',
            }}
          >
            <div className="ax-field">
              <label
                className="ax-field__label"
                style={{ fontWeight: 600, fontSize: '13px', marginBottom: '6px', color: 'var(--ax-text-strong)' }}
              >
                Beneficiary Name <span style={{ color: 'var(--ax-danger, #dc2626)' }}>*</span>
              </label>
              <input
                type="text"
                className="ax-input"
                placeholder="Enter Beneficiary Name"
                value={beneficiaryName}
                onChange={(e) => setBeneficiaryName(e.target.value)}
                required
                style={{ height: '40px' }}
              />
            </div>

            <div className="ax-field">
              <label
                className="ax-field__label"
                style={{ fontWeight: 600, fontSize: '13px', marginBottom: '6px', color: 'var(--ax-text-strong)' }}
              >
                Contact No. <span style={{ color: 'var(--ax-danger, #dc2626)' }}>*</span>
              </label>
              <input
                type="tel"
                maxLength={15}
                className="ax-input"
                placeholder="Enter Contact Number"
                value={contactNo}
                onChange={(e) => setContactNo(e.target.value)}
                required
                style={{ height: '40px' }}
              />
            </div>

            <div className="ax-field">
              <label
                className="ax-field__label"
                style={{ fontWeight: 600, fontSize: '13px', marginBottom: '6px', color: 'var(--ax-text-strong)' }}
              >
                CA Number <span style={{ color: 'var(--ax-danger, #dc2626)' }}>*</span>
              </label>
              <input
                type="text"
                className="ax-input"
                placeholder="Enter CA Number"
                value={caNumber}
                onChange={(e) => setCaNumber(e.target.value)}
                required
                style={{ height: '40px' }}
              />
            </div>
          </div>

          {/* Row 2: Module Serial Number 1, Module Serial Number 2 */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '20px',
              marginBottom: '28px',
            }}
          >
            <div className="ax-field">
              <label
                className="ax-field__label"
                style={{ fontWeight: 600, fontSize: '13px', marginBottom: '6px', color: 'var(--ax-text-strong)' }}
              >
                Module Serial Number 1 <span style={{ color: 'var(--ax-danger, #dc2626)' }}>*</span>
              </label>
              <input
                type="text"
                className="ax-input"
                placeholder="Enter Module Serial No 1"
                value={moduleSerial1}
                onChange={(e) => setModuleSerial1(e.target.value)}
                required
                style={{ height: '40px' }}
              />
            </div>

            <div className="ax-field">
              <label
                className="ax-field__label"
                style={{ fontWeight: 600, fontSize: '13px', marginBottom: '6px', color: 'var(--ax-text-strong)' }}
              >
                Module Serial Number 2 <span style={{ color: 'var(--ax-danger, #dc2626)' }}>*</span>
              </label>
              <input
                type="text"
                className="ax-input"
                placeholder="Enter Module Serial No 2"
                value={moduleSerial2}
                onChange={(e) => setModuleSerial2(e.target.value)}
                required
                style={{ height: '40px' }}
              />
            </div>
          </div>

          {/* GPS Location Subsection */}
          <div style={{ marginTop: '16px', marginBottom: '24px' }}>
            <h4
              style={{
                margin: '0 0 14px 0',
                fontSize: '16px',
                fontWeight: 700,
                color: 'var(--ax-text-strong)',
                letterSpacing: '-0.01em',
              }}
            >
              GPS Location
            </h4>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '20px',
                marginBottom: '14px',
              }}
            >
              <div className="ax-field">
                <label
                  className="ax-field__label"
                  style={{ fontWeight: 600, fontSize: '13px', marginBottom: '6px', color: 'var(--ax-text-strong)' }}
                >
                  Latitude <span style={{ color: 'var(--ax-danger, #dc2626)' }}>*</span>
                </label>
                <input
                  type="text"
                  className="ax-input"
                  placeholder="Latitude"
                  value={latitude}
                  onChange={(e) => setLatitude(e.target.value)}
                  required
                  style={{ height: '40px', background: 'var(--ax-surface-subtle, #f8fafc)' }}
                />
              </div>

              <div className="ax-field">
                <label
                  className="ax-field__label"
                  style={{ fontWeight: 600, fontSize: '13px', marginBottom: '6px', color: 'var(--ax-text-strong)' }}
                >
                  Longitude <span style={{ color: 'var(--ax-danger, #dc2626)' }}>*</span>
                </label>
                <input
                  type="text"
                  className="ax-input"
                  placeholder="Longitude"
                  value={longitude}
                  onChange={(e) => setLongitude(e.target.value)}
                  required
                  style={{ height: '40px', background: 'var(--ax-surface-subtle, #f8fafc)' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap', marginTop: '6px' }}>
              <button
                type="button"
                className="ax-btn ax-btn--secondary ax-btn--sm"
                onClick={handleDetectGps}
                disabled={gpsDetecting}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontWeight: 500,
                  borderRadius: '6px',
                  padding: '6px 14px',
                }}
              >
                {gpsDetecting ? <span className="ax-spinner" /> : ICON_CROSSHAIR}
                <span>{gpsDetecting ? 'Locking GPS…' : 'Retry GPS Lock'}</span>
              </button>

              {gpsStatusMsg && (
                <span
                  style={{
                    fontSize: '12px',
                    color: latitude && longitude ? 'var(--ax-success-600, #16a34a)' : 'var(--ax-text-muted)',
                    fontWeight: 500,
                  }}
                >
                  {latitude && longitude ? '✓ ' : ''}
                  {gpsStatusMsg}
                </span>
              )}
            </div>
          </div>

          {/* Horizontal Divider */}
          <hr style={{ border: 'none', borderTop: '1px solid var(--ax-border-subtle, #e2e8f0)', margin: '28px 0' }} />

          {/* ══════════════════════════════════════════════════════════
              SECTION 3: PHOTOS
             ══════════════════════════════════════════════════════════ */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
            <span
              style={{
                width: 28,
                height: 28,
                borderRadius: '50%',
                background: '#8B263E',
                color: '#ffffff',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '14px',
                flexShrink: 0,
              }}
            >
              3
            </span>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#8B263E', letterSpacing: '-0.01em' }}>
              Photos
            </h3>
          </div>

          <p style={{ margin: '4px 0 16px 0', fontSize: '13px', color: 'var(--ax-text-muted)' }}>
            {capturedCount} of 4 photos captured
          </p>

          <p
            style={{
              margin: '0 0 20px 0',
              fontSize: '13px',
              color: 'var(--ax-text-subtle)',
              lineHeight: 1.5,
            }}
          >
            Use <strong>Camera</strong> to capture a fresh photo on site, or <strong>Gallery</strong> to pick an existing one. GPS coordinates are saved automatically with the survey.
          </p>

          {/* ── 4 Photo Cards Grid ── */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: '18px',
              marginTop: '12px',
            }}
          >
            {/* Card 1: 2. Foundation & Fastener */}
            <div
              style={{
                border: '1px solid var(--ax-border, #e2e8f0)',
                borderRadius: '8px',
                padding: '16px',
                background: 'var(--ax-surface-solid, #ffffff)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                minHeight: '170px',
              }}
            >
              <div>
                <h4 style={{ margin: '0 0 2px 0', fontSize: '15px', fontWeight: 600, color: 'var(--ax-text-strong)' }}>
                  2. Foundation & Fastener
                </h4>
                <p style={{ margin: '0 0 14px 0', fontSize: '12px', color: 'var(--ax-text-muted)' }}>
                  Select 1 to 4 photos.
                </p>

                {/* Hidden File Inputs */}
                <input
                  type="file"
                  ref={fastenerCameraRef}
                  accept="image/*"
                  capture="environment"
                  style={{ display: 'none' }}
                  onChange={handleFastenerFiles}
                />
                <input
                  type="file"
                  ref={fastenerGalleryRef}
                  accept="image/*"
                  multiple
                  style={{ display: 'none' }}
                  onChange={handleFastenerFiles}
                />

                {/* Action Buttons */}
                <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
                  <button
                    type="button"
                    className="ax-btn ax-btn--secondary ax-btn--sm"
                    style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                    onClick={() => fastenerCameraRef.current?.click()}
                    disabled={fastenerPhotos.length >= 4}
                  >
                    {ICON_CAMERA}
                    <span>Camera</span>
                  </button>
                  <button
                    type="button"
                    className="ax-btn ax-btn--secondary ax-btn--sm"
                    style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                    onClick={() => fastenerGalleryRef.current?.click()}
                    disabled={fastenerPhotos.length >= 4}
                  >
                    {ICON_GALLERY}
                    <span>Gallery</span>
                  </button>
                </div>

                {/* Thumbnail Previews if any */}
                {fastenerPreviews.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '10px' }}>
                    {fastenerPreviews.map((url, i) => (
                      <div
                        key={i}
                        style={{
                          position: 'relative',
                          width: '52px',
                          height: '52px',
                          borderRadius: '6px',
                          overflow: 'hidden',
                          border: '1px solid var(--ax-border)',
                          cursor: 'pointer',
                        }}
                        onClick={() => setModalImage({ url, title: `Foundation & Fastener Photo #${i + 1}` })}
                      >
                        <img src={url} alt={`Fastener ${i + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeFastenerPhoto(i);
                          }}
                          style={{
                            position: 'absolute',
                            top: 2,
                            right: 2,
                            width: 16,
                            height: 16,
                            borderRadius: '50%',
                            background: 'rgba(0,0,0,0.65)',
                            color: '#fff',
                            border: 'none',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: 0,
                          }}
                          title="Remove photo"
                        >
                          {ICON_TRASH}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Status Indicator */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
                {fastenerPhotos.length === 0 ? (
                  <>
                    {ICON_NOT_CAPTURED}
                    <span style={{ color: '#dc2626', fontWeight: 500 }}>Not captured</span>
                  </>
                ) : (
                  <>
                    {ICON_CAPTURED}
                    <span style={{ color: '#16a34a', fontWeight: 600 }}>
                      {fastenerPhotos.length} of 4 captured
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Card 2: 3. Structure */}
            <div
              style={{
                border: '1px solid var(--ax-border, #e2e8f0)',
                borderRadius: '8px',
                padding: '16px',
                background: 'var(--ax-surface-solid, #ffffff)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                minHeight: '170px',
              }}
            >
              <div>
                <h4 style={{ margin: '0 0 2px 0', fontSize: '15px', fontWeight: 600, color: 'var(--ax-text-strong)' }}>
                  3. Structure
                </h4>
                <p style={{ margin: '0 0 14px 0', fontSize: '12px', color: 'var(--ax-text-muted)' }}>
                  &nbsp;
                </p>

                {/* Hidden File Inputs */}
                <input
                  type="file"
                  ref={structureCameraRef}
                  accept="image/*"
                  capture="environment"
                  style={{ display: 'none' }}
                  onChange={(e) => handleSinglePhoto(e, setStructurePhoto, setStructurePreview)}
                />
                <input
                  type="file"
                  ref={structureGalleryRef}
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={(e) => handleSinglePhoto(e, setStructurePhoto, setStructurePreview)}
                />

                {/* Action Buttons */}
                <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
                  <button
                    type="button"
                    className="ax-btn ax-btn--secondary ax-btn--sm"
                    style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                    onClick={() => structureCameraRef.current?.click()}
                  >
                    {ICON_CAMERA}
                    <span>Camera</span>
                  </button>
                  <button
                    type="button"
                    className="ax-btn ax-btn--secondary ax-btn--sm"
                    style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                    onClick={() => structureGalleryRef.current?.click()}
                  >
                    {ICON_GALLERY}
                    <span>Gallery</span>
                  </button>
                </div>

                {/* Thumbnail Preview */}
                {structurePreview && (
                  <div
                    style={{
                      position: 'relative',
                      width: '52px',
                      height: '52px',
                      borderRadius: '6px',
                      overflow: 'hidden',
                      border: '1px solid var(--ax-border)',
                      marginBottom: '10px',
                      cursor: 'pointer',
                    }}
                    onClick={() => setModalImage({ url: structurePreview, title: 'Structure Photo' })}
                  >
                    <img src={structurePreview} alt="Structure" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeSinglePhoto(setStructurePhoto, setStructurePreview);
                      }}
                      style={{
                        position: 'absolute',
                        top: 2,
                        right: 2,
                        width: 16,
                        height: 16,
                        borderRadius: '50%',
                        background: 'rgba(0,0,0,0.65)',
                        color: '#fff',
                        border: 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: 0,
                      }}
                      title="Remove photo"
                    >
                      {ICON_TRASH}
                    </button>
                  </div>
                )}
              </div>

              {/* Status Indicator */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
                {!structurePhoto ? (
                  <>
                    {ICON_NOT_CAPTURED}
                    <span style={{ color: '#dc2626', fontWeight: 500 }}>Not captured</span>
                  </>
                ) : (
                  <>
                    {ICON_CAPTURED}
                    <span style={{ color: '#16a34a', fontWeight: 600 }}>Captured</span>
                  </>
                )}
              </div>
            </div>

            {/* Card 3: Module with Serial Number 1 */}
            <div
              style={{
                border: '1px solid var(--ax-border, #e2e8f0)',
                borderRadius: '8px',
                padding: '16px',
                background: 'var(--ax-surface-solid, #ffffff)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                minHeight: '170px',
              }}
            >
              <div>
                <h4 style={{ margin: '0 0 2px 0', fontSize: '15px', fontWeight: 600, color: 'var(--ax-text-strong)' }}>
                  Module with Serial Number 1
                </h4>
                <p style={{ margin: '0 0 14px 0', fontSize: '12px', color: 'var(--ax-text-muted)' }}>
                  Serial number must match the allocation.
                </p>

                {/* Hidden File Inputs */}
                <input
                  type="file"
                  ref={module1CameraRef}
                  accept="image/*"
                  capture="environment"
                  style={{ display: 'none' }}
                  onChange={(e) => handleSinglePhoto(e, setModule1Photo, setModule1Preview)}
                />
                <input
                  type="file"
                  ref={module1GalleryRef}
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={(e) => handleSinglePhoto(e, setModule1Photo, setModule1Preview)}
                />

                {/* Action Buttons */}
                <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
                  <button
                    type="button"
                    className="ax-btn ax-btn--secondary ax-btn--sm"
                    style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                    onClick={() => module1CameraRef.current?.click()}
                  >
                    {ICON_CAMERA}
                    <span>Camera</span>
                  </button>
                  <button
                    type="button"
                    className="ax-btn ax-btn--secondary ax-btn--sm"
                    style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                    onClick={() => module1GalleryRef.current?.click()}
                  >
                    {ICON_GALLERY}
                    <span>Gallery</span>
                  </button>
                </div>

                {/* Thumbnail Preview */}
                {module1Preview && (
                  <div
                    style={{
                      position: 'relative',
                      width: '52px',
                      height: '52px',
                      borderRadius: '6px',
                      overflow: 'hidden',
                      border: '1px solid var(--ax-border)',
                      marginBottom: '10px',
                      cursor: 'pointer',
                    }}
                    onClick={() => setModalImage({ url: module1Preview, title: 'Module Serial #1 Photo' })}
                  >
                    <img src={module1Preview} alt="Module 1" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeSinglePhoto(setModule1Photo, setModule1Preview);
                      }}
                      style={{
                        position: 'absolute',
                        top: 2,
                        right: 2,
                        width: 16,
                        height: 16,
                        borderRadius: '50%',
                        background: 'rgba(0,0,0,0.65)',
                        color: '#fff',
                        border: 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: 0,
                      }}
                      title="Remove photo"
                    >
                      {ICON_TRASH}
                    </button>
                  </div>
                )}
              </div>

              {/* Status Indicator */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
                {!module1Photo ? (
                  <>
                    {ICON_NOT_CAPTURED}
                    <span style={{ color: '#dc2626', fontWeight: 500 }}>Not captured</span>
                  </>
                ) : (
                  <>
                    {ICON_CAPTURED}
                    <span style={{ color: '#16a34a', fontWeight: 600 }}>Captured</span>
                  </>
                )}
              </div>
            </div>

            {/* Card 4: Module with Serial Number 2 */}
            <div
              style={{
                border: '1px solid var(--ax-border, #e2e8f0)',
                borderRadius: '8px',
                padding: '16px',
                background: 'var(--ax-surface-solid, #ffffff)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                minHeight: '170px',
              }}
            >
              <div>
                <h4 style={{ margin: '0 0 2px 0', fontSize: '15px', fontWeight: 600, color: 'var(--ax-text-strong)' }}>
                  Module with Serial Number 2
                </h4>
                <p style={{ margin: '0 0 14px 0', fontSize: '12px', color: 'var(--ax-text-muted)' }}>
                  Serial number must match the allocation.
                </p>

                {/* Hidden File Inputs */}
                <input
                  type="file"
                  ref={module2CameraRef}
                  accept="image/*"
                  capture="environment"
                  style={{ display: 'none' }}
                  onChange={(e) => handleSinglePhoto(e, setModule2Photo, setModule2Preview)}
                />
                <input
                  type="file"
                  ref={module2GalleryRef}
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={(e) => handleSinglePhoto(e, setModule2Photo, setModule2Preview)}
                />

                {/* Action Buttons */}
                <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
                  <button
                    type="button"
                    className="ax-btn ax-btn--secondary ax-btn--sm"
                    style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                    onClick={() => module2CameraRef.current?.click()}
                  >
                    {ICON_CAMERA}
                    <span>Camera</span>
                  </button>
                  <button
                    type="button"
                    className="ax-btn ax-btn--secondary ax-btn--sm"
                    style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                    onClick={() => module2GalleryRef.current?.click()}
                  >
                    {ICON_GALLERY}
                    <span>Gallery</span>
                  </button>
                </div>

                {/* Thumbnail Preview */}
                {module2Preview && (
                  <div
                    style={{
                      position: 'relative',
                      width: '52px',
                      height: '52px',
                      borderRadius: '6px',
                      overflow: 'hidden',
                      border: '1px solid var(--ax-border)',
                      marginBottom: '10px',
                      cursor: 'pointer',
                    }}
                    onClick={() => setModalImage({ url: module2Preview, title: 'Module Serial #2 Photo' })}
                  >
                    <img src={module2Preview} alt="Module 2" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeSinglePhoto(setModule2Photo, setModule2Preview);
                      }}
                      style={{
                        position: 'absolute',
                        top: 2,
                        right: 2,
                        width: 16,
                        height: 16,
                        borderRadius: '50%',
                        background: 'rgba(0,0,0,0.65)',
                        color: '#fff',
                        border: 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: 0,
                      }}
                      title="Remove photo"
                    >
                      {ICON_TRASH}
                    </button>
                  </div>
                )}
              </div>

              {/* Status Indicator */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
                {!module2Photo ? (
                  <>
                    {ICON_NOT_CAPTURED}
                    <span style={{ color: '#dc2626', fontWeight: 500 }}>Not captured</span>
                  </>
                ) : (
                  <>
                    {ICON_CAPTURED}
                    <span style={{ color: '#16a34a', fontWeight: 600 }}>Captured</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* ══════════════════════════════════════════════════════════
              BOTTOM ACTION BAR (Deep Purple matching Screenshot 2)
             ══════════════════════════════════════════════════════════ */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              alignItems: 'center',
              gap: '12px',
              padding: '14px 24px',
              background: '#e1e1e3',
              borderRadius: '8px',
              marginTop: '36px',
            }}
          >
            <button
              type="button"
              onClick={handleCancel}
              style={{
                background: '#ffffff',
                color: '#1e1b4b',
                border: 'none',
                borderRadius: '999px',
                padding: '8px 22px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                transition: 'opacity 0.2s',
              }}
            >
              {ICON_CANCEL}
              <span>Cancel</span>
            </button>

            <button
              type="submit"
              disabled={submitting}
              style={{
                background: '#ffffff',
                color: '#1e1b4b',
                border: 'none',
                borderRadius: '999px',
                padding: '8px 26px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: submitting ? 'not-allowed' : 'pointer',
                opacity: submitting ? 0.75 : 1,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                transition: 'opacity 0.2s',
              }}
            >
              {submitting ? <span className="ax-spinner" /> : ICON_SUBMIT}
              <span>{submitting ? 'Submitting…' : 'Submit'}</span>
            </button>
          </div>
        </div>
      </form>

      {/* ── Photo Preview Lightbox Modal ── */}
      {modalImage && (
        <div
          className="ax-modal-backdrop"
          onClick={() => setModalImage(null)}
          style={{ zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <div
            className="ax-modal"
            style={{ maxWidth: 640, width: '90%', padding: '16px', background: '#fff', borderRadius: '12px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 600 }}>{modalImage.title}</h4>
              <button
                type="button"
                className="ax-btn ax-btn--ghost ax-btn--sm"
                onClick={() => setModalImage(null)}
              >
                ✕
              </button>
            </div>
            <div style={{ maxHeight: '70vh', overflow: 'hidden', borderRadius: '8px', display: 'flex', justifyContent: 'center', background: '#000' }}>
              <img src={modalImage.url} alt={modalImage.title} style={{ maxWidth: '100%', maxHeight: '68vh', objectFit: 'contain' }} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Bihar_Installation_ULA_InstallationDetails;
