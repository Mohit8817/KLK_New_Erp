import { useState, useRef, useEffect, useMemo, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PageHead } from '../../../../shell/PageHead';
import {
  jammuSurveyAdminService,
  type JammuSrt70SurveySiteItem,
} from '../jammuSurveyAdminService';
import {
  SINGLE_CARD_FORM_CSS,
  FloatingInput,
  UploadDropzone,
  StatusFeedbackBanners,
} from '../../../up/Installation/upInstallationShared';

export function AssignSrt70MWSurvey() {
  const navigate = useNavigate();

  // Dynamic API Options (Strictly live - zero fake fallback)
  const [vendorList, setVendorList] = useState<Array<{ id: number; name: string }>>([]);
  const [districtList, setDistrictList] = useState<Array<{ district: string }>>([]);
  const [availableSites, setAvailableSites] = useState<JammuSrt70SurveySiteItem[]>([]);
  const [fetchingDistricts, setFetchingDistricts] = useState(false);
  const [fetchingSites, setFetchingSites] = useState(false);

  // Form State - strictly 'jammu' (never 'kashmir')
  const [vendor, setVendor] = useState('');
  const [district, setDistrict] = useState('');
  const [selectedSiteIds, setSelectedSiteIds] = useState<number[]>([]);
  const [siteSearch, setSiteSearch] = useState('');
  const [quickSiteId, setQuickSiteId] = useState('');
  const [purpose, setPurpose] = useState('survey');
  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | undefined>(undefined);
  const [remarks, setRemarks] = useState('');

  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Section refs for smooth navigation pills
  const sec1 = useRef<HTMLDivElement>(null);
  const sec2 = useRef<HTMLDivElement>(null);
  const sec3 = useRef<HTMLDivElement>(null);
  const sec4 = useRef<HTMLDivElement>(null);

  const scrollTo = (ref: React.RefObject<HTMLDivElement | null>) => {
    ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // 1. Initial Load: Form Data (Vendors and Districts)
  useEffect(() => {
    let cancelled = false;
    setInitialLoading(true);
    setErrorMsg('');

    const loadFormData = async () => {
      try {
        setFetchingDistricts(true);
        const res = await jammuSurveyAdminService.getSrt70SurveyAssignFormData();
        if (cancelled) return;

        setVendorList(Array.isArray(res.vendor) ? res.vendor : []);
        setDistrictList(Array.isArray(res.districts) ? res.districts : []);
      } catch (err: any) {
        if (!cancelled) {
          setErrorMsg(err?.message || 'Failed to load Jammu SRT 70MW survey assignment form data.');
        }
      } finally {
        if (!cancelled) {
          setInitialLoading(false);
          setFetchingDistricts(false);
        }
      }
    };

    loadFormData();
    return () => {
      cancelled = true;
    };
  }, []);

  // 2. Fetch unassigned survey sites when district changes
  useEffect(() => {
    if (!district) {
      setAvailableSites([]);
      setSelectedSiteIds([]);
      return;
    }

    let cancelled = false;
    setFetchingSites(true);
    setSelectedSiteIds([]);
    setSiteSearch('');
    setQuickSiteId('');

    jammuSurveyAdminService
      .fetchSrt70SurveySite(district)
      .then((sites) => {
        if (!cancelled) {
          setAvailableSites(Array.isArray(sites) ? sites : []);
        }
      })
      .catch((err: any) => {
        if (!cancelled) {
          setAvailableSites([]);
          setErrorMsg(err?.message || `Failed to fetch unassigned sites for ${district}.`);
        }
      })
      .finally(() => {
        if (!cancelled) setFetchingSites(false);
      });

    return () => {
      cancelled = true;
    };
  }, [district]);

  // Filtered sites based on site search input
  const filteredSites = useMemo(() => {
    const q = siteSearch.trim().toLowerCase();
    if (!q) return availableSites;
    return availableSites.filter(
      (s) =>
        String(s.id).includes(q) ||
        (s.site_name || '').toLowerCase().includes(q) ||
        (s.site_code || '').toLowerCase().includes(q) ||
        (s.ca_no || '').toLowerCase().includes(q) ||
        (s.contact_person || '').toLowerCase().includes(q)
    );
  }, [availableSites, siteSearch]);

  const toggleSite = (id: number) => {
    setSelectedSiteIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedSiteIds.length === filteredSites.length && filteredSites.length > 0) {
      setSelectedSiteIds([]);
    } else {
      setSelectedSiteIds(filteredSites.map((s) => s.id));
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!vendor) return setErrorMsg('Vendor Name is required.');
    if (!district) return setErrorMsg('District is required.');
    if (selectedSiteIds.length === 0) return setErrorMsg('Please select at least one site.');
    if (file && file.size > 5 * 1024 * 1024) return setErrorMsg('File size must not exceed 5 MB.');

    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('vendor', vendor);
      fd.append('state', 'jammu');
      fd.append('district', district);
      selectedSiteIds.forEach((id) => fd.append('site[]', String(id)));
      if (file) fd.append('file', file);
      if (remarks.trim()) fd.append('remarks', remarks.trim());
      if (purpose.trim()) fd.append('purpose', purpose.trim());

      const res = await jammuSurveyAdminService.storeSrt70SurveyAssign(fd);

      if (res.success) {
        setSuccessMsg(
          res.message ||
            `${selectedSiteIds.length} Jammu SRT 70MW site(s) successfully assigned for survey!`
        );
        window.scrollTo({ top: 0, behavior: 'smooth' });
        setTimeout(() => {
          navigate('/vendor-management/jammu/survey/srt-70mw/view-assign');
        }, 1300);
      } else {
        setErrorMsg(res.message || 'Validation failed. Please check form inputs.');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to assign Jammu SRT 70MW survey sites.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ax-page swp-inst-form">
      <style>{SINGLE_CARD_FORM_CSS}</style>

      <PageHead
        title="Assign Jammu SRT 70MW Survey"
        subtitle="The field labels marked with * are required input fields."
        breadcrumbs={[
          { label: 'ERP Dashboard', href: '/' },
          { label: 'Vendor Management', href: '/vendor-management' },
          { label: 'Jammu' },
          { label: 'Survey', href: '/vendor-management/jammu/survey/srt-70mw/dashboard' },
          { label: 'SRT 70MW', href: '/vendor-management/jammu/survey/srt-70mw/dashboard' },
          { label: 'Assign Survey' },
        ]}
        actions={
          <div style={{ display: 'flex', gap: 8 }}>
            <Link
              to="/vendor-management/jammu/survey/srt-70mw/dashboard"
              className="ax-btn ax-btn--secondary ax-btn--sm"
            >
              Survey Dashboard
            </Link>
            <Link
              to="/vendor-management/jammu/survey/srt-70mw/view-assign"
              className="ax-btn ax-btn--primary ax-btn--sm"
            >
              View Assigned Surveys
            </Link>
          </div>
        }
      />

      <StatusFeedbackBanners
        errorMsg={errorMsg}
        successMsg={successMsg}
        onClearError={() => setErrorMsg('')}
        onClearSuccess={() => setSuccessMsg('')}
      />

      <form onSubmit={handleSubmit} className="ax-card">
        <div className="ax-card__header">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
            <div>
              <h2 className="ax-card__title" style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: 'var(--ax-text-strong, #0f172a)' }}>
                Assign Jammu SRT 70MW Survey
              </h2>
              <p className="ax-card__subtitle" style={{ fontSize: '0.85rem', color: '#ef4444', margin: '4px 0 0' }}>
                The field labels marked with * are required input fields.
              </p>
            </div>
            {initialLoading && (
              <span style={{ fontSize: 12, color: '#2563eb', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <span className="ax-spinner" /> Loading master options...
              </span>
            )}
          </div>

          <div className="swp-section-pills">
            <button type="button" className="swp-section-pill-btn" onClick={() => scrollTo(sec1)}>
              <span className="pill-num">1</span> Vendor Name
            </button>
            <button type="button" className="swp-section-pill-btn" onClick={() => scrollTo(sec2)}>
              <span className="pill-num">2</span> State & District
            </button>
            <button type="button" className="swp-section-pill-btn" onClick={() => scrollTo(sec3)}>
              <span className="pill-num">3</span> Site Name {selectedSiteIds.length > 0 ? `(${selectedSiteIds.length})` : ''}
            </button>
            <button type="button" className="swp-section-pill-btn" onClick={() => scrollTo(sec4)}>
              <span className="pill-num">4</span> Purpose, File & Remarks
            </button>
          </div>
        </div>

        <div className="ax-card__body">
          {/* Section 1: Vendor Name * */}
          <div ref={sec1} className="swp-section-block">
            <div className="swp-section-header">
              <div className="swp-section-title-wrap">
                <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>
                  1. Vendor Name <span style={{ color: '#ef4444' }}>*</span>
                </h3>
                <span style={{ fontSize: '12px', color: 'var(--ax-text-muted, #64748b)' }}>
                  Select empaneled survey vendor for Jammu SRT 70MW
                </span>
              </div>
            </div>

            <div style={{ maxWidth: 480 }}>
              <div className="ax-float">
                <select
                  id="jammu_srt_vendor"
                  className="ax-float__input"
                  value={vendor}
                  onChange={(e) => setVendor(e.target.value)}
                  disabled={loading || initialLoading}
                  required
                >
                  <option value="">-- Select Survey Vendor --</option>
                  {vendorList.map((v) => (
                    <option key={v.id} value={String(v.id)}>
                      {v.name}
                    </option>
                  ))}
                </select>
                <label htmlFor="jammu_srt_vendor" className="ax-float__label floating">
                  Vendor Name <span style={{ color: '#ef4444' }}>*</span>
                </label>
              </div>
            </div>
          </div>

          <hr className="swp-section-divider" />

          {/* Section 2: State & District * */}
          <div ref={sec2} className="swp-section-block">
            <div className="swp-section-header">
              <div className="swp-section-title-wrap">
                <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>2. State & District</h3>
                <span style={{ fontSize: '12px', color: 'var(--ax-text-muted, #64748b)' }}>
                  Select state and district to load unassigned SRT 70MW survey sites
                </span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
              <div className="ax-float">
                <input
                  type="text"
                  id="jammu_srt_state"
                  className="ax-float__input"
                  value="Jammu"
                  readOnly
                  disabled
                  placeholder="State"
                />
                <label htmlFor="jammu_srt_state" className="ax-float__label floating">
                  State <span style={{ color: '#ef4444' }}>*</span>
                </label>
              </div>

              <div className="ax-float">
                <select
                  id="jammu_srt_district"
                  className="ax-float__input"
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  disabled={loading || fetchingDistricts}
                  required
                >
                  <option value="">
                    {fetchingDistricts ? 'Loading districts...' : '-- Select District --'}
                  </option>
                  {districtList.map((d) => (
                    <option key={d.district} value={d.district}>
                      {d.district}
                    </option>
                  ))}
                </select>
                <label htmlFor="jammu_srt_district" className="ax-float__label floating">
                  District <span style={{ color: '#ef4444' }}>*</span>
                </label>
              </div>
            </div>
          </div>

          <hr className="swp-section-divider" />

          {/* Section 3: Site Name * */}
          <div ref={sec3} className="swp-section-block">
            <div className="swp-section-header">
              <div className="swp-section-title-wrap">
                <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>
                  3. Site Name <span style={{ color: '#ef4444' }}>*</span>
                </h3>
                <span style={{ fontSize: '12px', color: 'var(--ax-text-muted, #64748b)' }}>
                  {district
                    ? `Select unassigned SRT 70MW survey sites in ${district}`
                    : 'Choose District above to fetch unassigned survey sites.'}
                </span>
              </div>
              {district && availableSites.length > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span className="ax-badge ax-badge--soft ax-badge--accent" style={{ fontWeight: 600 }}>
                    {selectedSiteIds.length} of {availableSites.length} selected
                  </span>
                  <button
                    type="button"
                    className="ax-btn ax-btn--secondary ax-btn--xs"
                    onClick={handleSelectAll}
                  >
                    {selectedSiteIds.length === filteredSites.length && filteredSites.length > 0
                      ? 'Deselect All'
                      : 'Select All'}
                  </button>
                </div>
              )}
            </div>

            {!district ? (
              <div style={{ padding: '24px 16px', textAlign: 'center', background: '#f8fafc', borderRadius: 8, border: '1px dashed #cbd5e1', color: '#64748b', fontSize: 13 }}>
                -- Select District to Load Unassigned Survey Sites --
              </div>
            ) : fetchingSites ? (
              <div style={{ padding: '28px 16px', textAlign: 'center', background: '#f8fafc', borderRadius: 8, color: '#2563eb', fontSize: 13 }}>
                <span className="ax-spinner" style={{ marginRight: 8 }} />
                Fetching unassigned sites for <b>{district}</b>...
              </div>
            ) : availableSites.length === 0 ? (
              <div style={{ padding: '24px 16px', textAlign: 'center', background: '#f8fafc', borderRadius: 8, border: '1px dashed #cbd5e1', color: '#64748b', fontSize: 13 }}>
                No unassigned survey sites available in <b>{district}</b>.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 12 }}>
                  <select
                    className="ax-input ax-input--sm"
                    style={{ width: '100%', height: 38, borderRadius: 6, fontSize: 13 }}
                    value={quickSiteId}
                    onChange={(e) => {
                      const val = e.target.value;
                      setQuickSiteId(val);
                      if (val) {
                        const numId = Number(val);
                        if (!selectedSiteIds.includes(numId)) {
                          setSelectedSiteIds((prev) => [...prev, numId]);
                        }
                      }
                    }}
                    disabled={loading}
                  >
                    <option value="">-- Quick Add Site ({availableSites.length}) --</option>
                    {availableSites.map((s) => (
                      <option key={s.id} value={String(s.id)}>
                        {selectedSiteIds.includes(s.id) ? '✓ ' : ''}
                        {s.site_name} {s.site_code ? `(${s.site_code})` : ''} — #{s.id}
                      </option>
                    ))}
                  </select>

                  <input
                    type="text"
                    value={siteSearch}
                    onChange={(e) => setSiteSearch(e.target.value)}
                    placeholder="Search sites by ID, code or name..."
                    className="ax-input ax-input--sm"
                    style={{ width: '100%', height: 38, borderRadius: 6, fontSize: 13 }}
                  />
                </div>

                <div className="swp-site-list">
                  {filteredSites.map((s) => {
                    const isChecked = selectedSiteIds.includes(s.id);
                    return (
                      <div
                        key={s.id}
                        className={`swp-site-item ${isChecked ? 'selected' : ''}`}
                        onClick={() => toggleSite(s.id)}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleSite(s.id)}
                          onClick={(e) => e.stopPropagation()}
                          style={{ width: 16, height: 16, marginTop: 2, cursor: 'pointer', accentColor: '#2563eb' }}
                        />
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: '#1e293b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {s.site_name}
                          </div>
                          <div style={{ fontSize: 11, color: '#64748b', display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 2 }}>
                            <span>ID: <b>#{s.id}</b></span>
                            {s.site_code && <span>Code: <b>{s.site_code}</b></span>}
                            {s.sanction_load && <span>Load: <b>{s.sanction_load} kW</b></span>}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {selectedSiteIds.length > 0 && (
                  <div style={{ fontSize: 12, color: '#16a34a', fontWeight: 500 }}>
                    ✓ {selectedSiteIds.length} site(s) selected for survey assignment
                  </div>
                )}
              </div>
            )}
          </div>

          <hr className="swp-section-divider" />

          {/* Section 4: Purpose, Work Order File & Remarks */}
          <div ref={sec4} className="swp-section-block">
            <div className="swp-section-header">
              <div className="swp-section-title-wrap">
                <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>4. Purpose, Work Order File & Remarks</h3>
                <span style={{ fontSize: '12px', color: 'var(--ax-text-muted, #64748b)' }}>
                  Set purpose, attach assignment work order (PDF/Image, max 5 MB), and add remarks
                </span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16, marginBottom: 20 }}>
              <FloatingInput
                label="Purpose"
                name="purpose"
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                disabled={loading}
                placeholder="survey"
              />
              <FloatingInput
                label="Remarks"
                name="remarks"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                disabled={loading}
                placeholder="Optional survey instructions or notes"
              />
            </div>

            <div style={{ maxWidth: 540 }}>
              <UploadDropzone
                id="jammu_srt_survey_file"
                label="Work Order File"
                required={false}
                accept=".pdf,.jpg,.jpeg,.png"
                helperText="PDF, JPG, JPEG or PNG (Max 5 MB)"
                disabled={loading}
                file={file}
                preview={filePreview}
                onSelect={(selected) => {
                  setFile(selected);
                  if (selected.type.startsWith('image/')) {
                    setFilePreview(URL.createObjectURL(selected));
                  } else {
                    setFilePreview(undefined);
                  }
                }}
                onRemove={() => {
                  setFile(null);
                  if (filePreview) {
                    URL.revokeObjectURL(filePreview);
                    setFilePreview(undefined);
                  }
                }}
              />
            </div>
          </div>

          <div style={{ marginTop: 32, paddingTop: 20, borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
            <Link to="/vendor-management/jammu/survey/srt-70mw/view-assign" className="ax-btn ax-btn--secondary">
              Cancel
            </Link>
            <button
              type="submit"
              className="ax-btn ax-btn--primary"
              disabled={loading || !vendor || !district || selectedSiteIds.length === 0}
              style={{ minWidth: 200, fontWeight: 700 }}
            >
              {loading ? (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                  <span className="ax-spinner" /> Assigning...
                </span>
              ) : (
                `Assign (${selectedSiteIds.length}) Jammu SRT Sites →`
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

export default AssignSrt70MWSurvey;
