import { useState, useEffect, useCallback, type FormEvent, type ChangeEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PageHead } from '../../../../shell/PageHead';
import {
  biharUlaInstallationService,
  type SiteDetailResponse,
} from '../../../../../services/biharUlaInstallationService';

const ICON_MAP_PIN = (
  <svg style={{ width: 14, height: 14 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M9 11a3 3 0 1 0 6 0a3 3 0 0 0 -6 0" />
    <path d="M17.657 16.657l-4.243 4.243a2 2 0 0 1 -2.827 0l-4.244 -4.243a8 8 0 1 1 11.314 0z" />
  </svg>
);

const ICON_UPLOAD = (
  <svg style={{ width: 18, height: 18 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2 -2v-2" />
    <polyline points="7 9 12 4 17 9" />
    <line x1="12" y1="4" x2="12" y2="16" />
  </svg>
);

export function Bihar_Installation_ULA_InstallationDetails() {
  const navigate = useNavigate();
  const [siteOptions, setSiteOptions] = useState<{ id: number; beneficiary_name: string }[]>([]);
  const [loadingSites, setLoadingSites] = useState(true);
  const [selectedSiteId, setSelectedSiteId] = useState<string>('');
  const [siteDetails, setSiteDetails] = useState<SiteDetailResponse | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Form Fields
  const [moduleSerial1, setModuleSerial1] = useState('');
  const [moduleSerial2, setModuleSerial2] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [gpsDetecting, setGpsDetecting] = useState(false);

  // File Uploads
  const [structureImage, setStructureImage] = useState<File | null>(null);
  const [structureImagePreview, setStructureImagePreview] = useState<string | null>(null);

  const [fastener1, setFastener1] = useState<File | null>(null);
  const [fastener1Preview, setFastener1Preview] = useState<string | null>(null);
  const [fastener2, setFastener2] = useState<File | null>(null);
  const [fastener2Preview, setFastener2Preview] = useState<string | null>(null);
  const [fastener3, setFastener3] = useState<File | null>(null);
  const [fastener3Preview, setFastener3Preview] = useState<string | null>(null);
  const [fastener4, setFastener4] = useState<File | null>(null);
  const [fastener4Preview, setFastener4Preview] = useState<string | null>(null);

  const [modSerialImg1, setModSerialImg1] = useState<File | null>(null);
  const [modSerialImg1Preview, setModSerialImg1Preview] = useState<string | null>(null);
  const [modSerialImg2, setModSerialImg2] = useState<File | null>(null);
  const [modSerialImg2Preview, setModSerialImg2Preview] = useState<string | null>(null);

  // Feedback & Submission
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
      console.error('Failed to fetch site names:', err);
    } finally {
      setLoadingSites(false);
    }
  }, []);

  useEffect(() => {
    loadSites();
  }, [loadSites]);

  // Load site details when dropdown changes
  const handleSiteChange = async (siteIdStr: string) => {
    setSelectedSiteId(siteIdStr);
    setErrorMsg(null);
    setSuccessMsg(null);
    if (!siteIdStr) {
      setSiteDetails(null);
      return;
    }
    setLoadingDetails(true);
    try {
      const details = await biharUlaInstallationService.fetchSiteDetails(siteIdStr);
      setSiteDetails(details);
    } catch (err: any) {
      console.error('Failed to load site details:', err);
      setErrorMsg('Failed to load beneficiary details for this site.');
    } finally {
      setLoadingDetails(false);
    }
  };

  // Auto detect GPS coordinates
  const handleDetectGps = () => {
    if (!navigator.geolocation) {
      setErrorMsg('Geolocation is not supported by your browser.');
      return;
    }
    setGpsDetecting(true);
    setErrorMsg(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitude(pos.coords.latitude.toFixed(6));
        setLongitude(pos.coords.longitude.toFixed(6));
        setGpsDetecting(false);
      },
      (err) => {
        setGpsDetecting(false);
        setErrorMsg(`Unable to fetch location: ${err.message}. Please enter manually.`);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Helper for image handling
  const handleFileChange = (
    e: ChangeEvent<HTMLInputElement>,
    setter: (f: File | null) => void,
    previewSetter: (u: string | null) => void
  ) => {
    const file = e.target.files?.[0];
    if (!file) {
      setter(null);
      previewSetter(null);
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      alert('File size exceeds 2 MB limit.');
      e.target.value = '';
      return;
    }
    setter(file);
    previewSetter(URL.createObjectURL(file));
  };

  // Form Submit
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!selectedSiteId) {
      setErrorMsg('Please select a site from the list.');
      return;
    }
    if (!moduleSerial1.trim() || !moduleSerial2.trim()) {
      setErrorMsg('Both Module Serial Numbers 1 & 2 are required.');
      return;
    }
    if (!latitude.trim() || !longitude.trim()) {
      setErrorMsg('Both Latitude and Longitude are required.');
      return;
    }
    if (!structureImage) {
      setErrorMsg('Structure image is required.');
      return;
    }
    if (!fastener1) {
      setErrorMsg('Foundation & Fastener Image 1 is required.');
      return;
    }
    if (!modSerialImg1 || !modSerialImg2) {
      setErrorMsg('Both Module Serial Photos 1 & 2 are required.');
      return;
    }

    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('site_id', selectedSiteId);
      fd.append('module_serial_no[0]', moduleSerial1.trim());
      fd.append('module_serial_no[1]', moduleSerial2.trim());
      fd.append('latitude', latitude.trim());
      fd.append('longitude', longitude.trim());
      fd.append('structure_image', structureImage);
      fd.append('foundation_fastener_images[0]', fastener1);
      if (fastener2) fd.append('foundation_fastener_images[1]', fastener2);
      if (fastener3) fd.append('foundation_fastener_images[2]', fastener3);
      if (fastener4) fd.append('foundation_fastener_images[3]', fastener4);
      fd.append('module_serial_image[0]', modSerialImg1);
      fd.append('module_serial_image[1]', modSerialImg2);

      const resp = await biharUlaInstallationService.storeStructureInstall(fd);
      setSuccessMsg(resp.message || 'Structure Installation saved successfully!');
      
      // Reset form after brief pause or navigate
      setTimeout(() => {
        navigate('/v/bihar/ula-installation-view-site');
      }, 1500);
    } catch (err: any) {
      console.error('Failed to submit structure:', err);
      setErrorMsg(err?.message || 'Failed to submit structure installation data.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="ax-page">
      <PageHead
        title="Bihar - Installation > ULA > Add Installation"
        subtitle="Submit structure erection, module serial numbers, and physical site verification media"
        breadcrumbs={[
          { label: 'Bihar' },
          { label: 'Installation' },
          { label: 'ULA' },
          { label: 'Add Installation' },
        ]}
        actions={
          <Link to="/v/bihar/ula-installation-view-site" className="ax-btn ax-btn--secondary ax-btn--sm">
            View Installed Sites
          </Link>
        }
      />

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

      <form onSubmit={handleSubmit}>
        <div className="ax-dash-grid">
          {/* ── SECTION 1: Site Selection & Beneficiary Info ── */}
          <div className="ax-card ax-col--12">
            <div className="ax-card__header">
              <h3 className="ax-card__title">1. Site Selection & Beneficiary Details</h3>
              <p className="ax-card__subtitle">Select an accepted installation site to auto-populate consumer information</p>
            </div>
            <div className="ax-card__body">
              <div className="ax-dash-grid">
                <div className="ax-col--6">
                  <div className="ax-field">
                    <label className="ax-field__label" htmlFor="site_select">
                      Select Accepted Site <span style={{ color: 'var(--ax-danger)' }}>*</span>
                    </label>
                    <select
                      id="site_select"
                      className="ax-input"
                      value={selectedSiteId}
                      onChange={(e) => handleSiteChange(e.target.value)}
                      disabled={loadingSites}
                      required
                    >
                      <option value="">{loadingSites ? 'Loading sites...' : '-- Select Site --'}</option>
                      {siteOptions.map((s) => (
                        <option key={s.id} value={s.id}>
                          #{s.id} — {s.beneficiary_name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="ax-col--6">
                  <div className="ax-field">
                    <label className="ax-field__label">Consumer / Beneficiary Name</label>
                    <input
                      type="text"
                      className="ax-input"
                      value={loadingDetails ? 'Loading...' : siteDetails?.beneficiary_name || '—'}
                      readOnly
                      disabled
                    />
                  </div>
                </div>

                <div className="ax-col--4">
                  <div className="ax-field">
                    <label className="ax-field__label">CA Number</label>
                    <input
                      type="text"
                      className="ax-input"
                      value={siteDetails?.ca_no || '—'}
                      readOnly
                      disabled
                    />
                  </div>
                </div>

                <div className="ax-col--4">
                  <div className="ax-field">
                    <label className="ax-field__label">Contact Number</label>
                    <input
                      type="text"
                      className="ax-input"
                      value={siteDetails?.contact_no || '—'}
                      readOnly
                      disabled
                    />
                  </div>
                </div>

                <div className="ax-col--4">
                  <div className="ax-field">
                    <label className="ax-field__label">District</label>
                    <input
                      type="text"
                      className="ax-input"
                      value={siteDetails?.district || '—'}
                      readOnly
                      disabled
                    />
                  </div>
                </div>

                <div className="ax-col--4">
                  <div className="ax-field">
                    <label className="ax-field__label">Block</label>
                    <input
                      type="text"
                      className="ax-input"
                      value={siteDetails?.block || '—'}
                      readOnly
                      disabled
                    />
                  </div>
                </div>

                <div className="ax-col--4">
                  <div className="ax-field">
                    <label className="ax-field__label">Village</label>
                    <input
                      type="text"
                      className="ax-input"
                      value={siteDetails?.village || '—'}
                      readOnly
                      disabled
                    />
                  </div>
                </div>

                <div className="ax-col--4">
                  <div className="ax-field">
                    <label className="ax-field__label">Address</label>
                    <input
                      type="text"
                      className="ax-input"
                      value={siteDetails?.address || '—'}
                      readOnly
                      disabled
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── SECTION 2: Technical & Module Details ── */}
          <div className="ax-card ax-col--12">
            <div className="ax-card__header">
              <h3 className="ax-card__title">2. Module Serial Numbers & GPS Coordinates</h3>
              <p className="ax-card__subtitle">Enter barcode serials of the installed panels and geo-coordinates</p>
            </div>
            <div className="ax-card__body">
              <div className="ax-dash-grid">
                <div className="ax-col--6">
                  <div className="ax-field">
                    <label className="ax-field__label" htmlFor="mod_1">
                      Module Serial No. 1 <span style={{ color: 'var(--ax-danger)' }}>*</span>
                    </label>
                    <input
                      id="mod_1"
                      type="text"
                      className="ax-input"
                      placeholder="e.g. MOD-ULA-00123"
                      value={moduleSerial1}
                      onChange={(e) => setModuleSerial1(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="ax-col--6">
                  <div className="ax-field">
                    <label className="ax-field__label" htmlFor="mod_2">
                      Module Serial No. 2 <span style={{ color: 'var(--ax-danger)' }}>*</span>
                    </label>
                    <input
                      id="mod_2"
                      type="text"
                      className="ax-input"
                      placeholder="e.g. MOD-ULA-00124"
                      value={moduleSerial2}
                      onChange={(e) => setModuleSerial2(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="ax-col--4">
                  <div className="ax-field">
                    <label className="ax-field__label" htmlFor="lat">
                      Latitude <span style={{ color: 'var(--ax-danger)' }}>*</span>
                    </label>
                    <input
                      id="lat"
                      type="text"
                      className="ax-input"
                      placeholder="e.g. 25.594095"
                      value={latitude}
                      onChange={(e) => setLatitude(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="ax-col--4">
                  <div className="ax-field">
                    <label className="ax-field__label" htmlFor="lng">
                      Longitude <span style={{ color: 'var(--ax-danger)' }}>*</span>
                    </label>
                    <input
                      id="lng"
                      type="text"
                      className="ax-input"
                      placeholder="e.g. 85.137566"
                      value={longitude}
                      onChange={(e) => setLongitude(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="ax-col--4" style={{ display: 'flex', alignItems: 'flex-end' }}>
                  <button
                    type="button"
                    className="ax-btn ax-btn--secondary"
                    style={{ width: '100%', height: 38 }}
                    onClick={handleDetectGps}
                    disabled={gpsDetecting}
                  >
                    {gpsDetecting ? <span className="ax-spinner" /> : ICON_MAP_PIN}
                    <span className="ax-btn__label">
                      {gpsDetecting ? 'Detecting GPS...' : 'Auto-Detect Current Location'}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* ── SECTION 3: Physical Photos ── */}
          <div className="ax-card ax-col--12">
            <div className="ax-card__header">
              <h3 className="ax-card__title">3. Structure & Fasteners Verification Photos</h3>
              <p className="ax-card__subtitle">Upload clear site photos showing structure erection and foundation fasteners (JPG/PNG max 2MB)</p>
            </div>
            <div className="ax-card__body">
              <div className="ax-dash-grid">
                {/* Structure Image */}
                <div className="ax-col--4">
                  <div className="ax-field">
                    <label className="ax-field__label">
                      Structure Full View <span style={{ color: 'var(--ax-danger)' }}>*</span>
                    </label>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/jpg"
                      className="ax-input"
                      onChange={(e) => handleFileChange(e, setStructureImage, setStructureImagePreview)}
                      required
                    />
                    {structureImagePreview && (
                      <div style={{ marginTop: 'var(--ax-space-2)' }}>
                        <img
                          src={structureImagePreview}
                          alt="Structure Preview"
                          style={{ width: '100%', height: 130, objectFit: 'cover', borderRadius: 'var(--ax-radius-sm)', border: '1px solid var(--ax-border-subtle)' }}
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Module Serial Photo 1 */}
                <div className="ax-col--4">
                  <div className="ax-field">
                    <label className="ax-field__label">
                      Module 1 Serial Photo <span style={{ color: 'var(--ax-danger)' }}>*</span>
                    </label>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/jpg"
                      className="ax-input"
                      onChange={(e) => handleFileChange(e, setModSerialImg1, setModSerialImg1Preview)}
                      required
                    />
                    {modSerialImg1Preview && (
                      <div style={{ marginTop: 'var(--ax-space-2)' }}>
                        <img
                          src={modSerialImg1Preview}
                          alt="Module 1 Serial"
                          style={{ width: '100%', height: 130, objectFit: 'cover', borderRadius: 'var(--ax-radius-sm)', border: '1px solid var(--ax-border-subtle)' }}
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Module Serial Photo 2 */}
                <div className="ax-col--4">
                  <div className="ax-field">
                    <label className="ax-field__label">
                      Module 2 Serial Photo <span style={{ color: 'var(--ax-danger)' }}>*</span>
                    </label>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/jpg"
                      className="ax-input"
                      onChange={(e) => handleFileChange(e, setModSerialImg2, setModSerialImg2Preview)}
                      required
                    />
                    {modSerialImg2Preview && (
                      <div style={{ marginTop: 'var(--ax-space-2)' }}>
                        <img
                          src={modSerialImg2Preview}
                          alt="Module 2 Serial"
                          style={{ width: '100%', height: 130, objectFit: 'cover', borderRadius: 'var(--ax-radius-sm)', border: '1px solid var(--ax-border-subtle)' }}
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Fasteners Photos 1-4 */}
                <div className="ax-col--3">
                  <div className="ax-field">
                    <label className="ax-field__label">
                      Foundation Fastener 1 <span style={{ color: 'var(--ax-danger)' }}>*</span>
                    </label>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/jpg"
                      className="ax-input"
                      onChange={(e) => handleFileChange(e, setFastener1, setFastener1Preview)}
                      required
                    />
                    {fastener1Preview && (
                      <div style={{ marginTop: 'var(--ax-space-2)' }}>
                        <img
                          src={fastener1Preview}
                          alt="Fastener 1"
                          style={{ width: '100%', height: 100, objectFit: 'cover', borderRadius: 'var(--ax-radius-sm)', border: '1px solid var(--ax-border-subtle)' }}
                        />
                      </div>
                    )}
                  </div>
                </div>

                <div className="ax-col--3">
                  <div className="ax-field">
                    <label className="ax-field__label">Foundation Fastener 2 (Optional)</label>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/jpg"
                      className="ax-input"
                      onChange={(e) => handleFileChange(e, setFastener2, setFastener2Preview)}
                    />
                    {fastener2Preview && (
                      <div style={{ marginTop: 'var(--ax-space-2)' }}>
                        <img
                          src={fastener2Preview}
                          alt="Fastener 2"
                          style={{ width: '100%', height: 100, objectFit: 'cover', borderRadius: 'var(--ax-radius-sm)', border: '1px solid var(--ax-border-subtle)' }}
                        />
                      </div>
                    )}
                  </div>
                </div>

                <div className="ax-col--3">
                  <div className="ax-field">
                    <label className="ax-field__label">Foundation Fastener 3 (Optional)</label>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/jpg"
                      className="ax-input"
                      onChange={(e) => handleFileChange(e, setFastener3, setFastener3Preview)}
                    />
                    {fastener3Preview && (
                      <div style={{ marginTop: 'var(--ax-space-2)' }}>
                        <img
                          src={fastener3Preview}
                          alt="Fastener 3"
                          style={{ width: '100%', height: 100, objectFit: 'cover', borderRadius: 'var(--ax-radius-sm)', border: '1px solid var(--ax-border-subtle)' }}
                        />
                      </div>
                    )}
                  </div>
                </div>

                <div className="ax-col--3">
                  <div className="ax-field">
                    <label className="ax-field__label">Foundation Fastener 4 (Optional)</label>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/jpg"
                      className="ax-input"
                      onChange={(e) => handleFileChange(e, setFastener4, setFastener4Preview)}
                    />
                    {fastener4Preview && (
                      <div style={{ marginTop: 'var(--ax-space-2)' }}>
                        <img
                          src={fastener4Preview}
                          alt="Fastener 4"
                          style={{ width: '100%', height: 100, objectFit: 'cover', borderRadius: 'var(--ax-radius-sm)', border: '1px solid var(--ax-border-subtle)' }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Submit Actions */}
          <div className="ax-col--12" style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--ax-space-3)', marginTop: 'var(--ax-space-2)' }}>
            <button
              type="button"
              className="ax-btn ax-btn--secondary"
              onClick={() => {
                setSelectedSiteId('');
                setSiteDetails(null);
                setModuleSerial1('');
                setModuleSerial2('');
                setLatitude('');
                setLongitude('');
                setStructureImage(null);
                setStructureImagePreview(null);
                setFastener1(null);
                setFastener1Preview(null);
                setFastener2(null);
                setFastener2Preview(null);
                setFastener3(null);
                setFastener3Preview(null);
                setFastener4(null);
                setFastener4Preview(null);
                setModSerialImg1(null);
                setModSerialImg1Preview(null);
                setModSerialImg2(null);
                setModSerialImg2Preview(null);
              }}
              disabled={submitting}
            >
              Reset Form
            </button>
            <button
              type="submit"
              className="ax-btn ax-btn--primary"
              disabled={submitting || !selectedSiteId}
            >
              {submitting ? <span className="ax-spinner" /> : ICON_UPLOAD}
              <span className="ax-btn__label">
                {submitting ? 'Submitting Installation...' : 'Save Structure Installation'}
              </span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

export default Bihar_Installation_ULA_InstallationDetails;
