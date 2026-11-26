import { useState, useRef, useEffect, useMemo, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { PageHead } from '../../../../shell/PageHead';
import {
  jammuSrt70mwAdminService,
  type VendorItem,
  type DistrictItem,
  type SiteItem,
} from './jammuSrt70mwAdminService';
import {
  SINGLE_CARD_FORM_CSS,
  FloatingInput,
  UploadDropzone,
  StatusFeedbackBanners,
} from '../../../up/Installation/upInstallationShared';

export function AssignSrtSites() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('edit') || searchParams.get('id');
  const isEditing = Boolean(editId);

  // Dynamic API Options (Strictly live - zero fake fallback)
  const [vendorList, setVendorList] = useState<VendorItem[]>([]);
  const [districtList, setDistrictList] = useState<DistrictItem[]>([]);
  const [availableSites, setAvailableSites] = useState<SiteItem[]>([]);
  const [fetchingDistricts, setFetchingDistricts] = useState(false);
  const [fetchingSites, setFetchingSites] = useState(false);

  // Form State - strictly 'jammu' (never 'kashmir')
  const [vendor, setVendor] = useState('');
  const stateName = 'jammu';
  const [district, setDistrict] = useState('');
  const [selectedSiteIds, setSelectedSiteIds] = useState<number[]>([]);
  const [siteSearch, setSiteSearch] = useState('');
  const [quickSiteId, setQuickSiteId] = useState('');
  const [purpose, setPurpose] = useState('installation');
  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | undefined>(undefined);
  const [existingFileName, setExistingFileName] = useState<string | undefined>(undefined);
  const [remarks, setRemarks] = useState('');

  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Track if edit data just hydrated so effects don't wipe preselected values
  const editHydratedRef = useRef(false);

  // Section refs for smooth navigation pills
  const sec1 = useRef<HTMLDivElement>(null);
  const sec2 = useRef<HTMLDivElement>(null);
  const sec3 = useRef<HTMLDivElement>(null);
  const sec4 = useRef<HTMLDivElement>(null);

  const scrollTo = (ref: React.RefObject<HTMLDivElement | null>) => {
    ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // 1. Initial Load: Form Data & Master Options
  useEffect(() => {
    let cancelled = false;
    setInitialLoading(true);
    setErrorMsg('');

    const load = async () => {
      try {
        if (editId) {
          const editRes = await jammuSrt70mwAdminService.getEditAssign(editId);
          if (cancelled) return;
          editHydratedRef.current = true;
          if (editRes) {
            if (editRes.vendor && editRes.vendor.length > 0) setVendorList(editRes.vendor);
            if (editRes.districts && editRes.districts.length > 0) setDistrictList(editRes.districts);

            const a = editRes.assignSrt;
            if (a) {
              if (a.vendor) setVendor(String(a.vendor));
              if (a.district) setDistrict(a.district);
              if (a.purpose) setPurpose(a.purpose);
              if (a.remarks) setRemarks(a.remarks);
              if (a.file) setExistingFileName(String(a.file).split('/').pop());

              // Parse assigned sites
              let assignedIds: number[] = [];
              try {
                const parsed = typeof a.site_name === 'string' ? JSON.parse(a.site_name) : a.site_name;
                if (Array.isArray(parsed)) assignedIds = parsed.map(Number);
                else if (parsed) assignedIds = [Number(parsed)];
              } catch {
                if (a.site_name) assignedIds = [Number(a.site_name)];
              }
              setSelectedSiteIds(assignedIds);

              const editSites: SiteItem[] = Array.isArray(editRes.sites) ? editRes.sites : [];
              setAvailableSites(editSites);
            }
          }
        } else {
          const res = await jammuSrt70mwAdminService.getAssignFormData();
          if (cancelled) return;
          setVendorList(res.vendor || []);

          setFetchingDistricts(true);
          const dists = await jammuSrt70mwAdminService.fetchDistricts('jammu');
          if (cancelled) return;
          setDistrictList(dists || []);
          setFetchingDistricts(false);
        }
      } catch (err: any) {
        if (!cancelled) setErrorMsg(err?.message || 'Failed to load assignment form data.');
      } finally {
        if (!cancelled) setInitialLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [editId]);

  // 2. Fetch unassigned sites when district changes
  useEffect(() => {
    if (!district) {
      if (!editHydratedRef.current) {
        setAvailableSites([]);
        setSelectedSiteIds([]);
      }
      return;
    }

    if (editHydratedRef.current) {
      editHydratedRef.current = false;
      return;
    }

    let cancelled = false;
    setFetchingSites(true);
    setSelectedSiteIds([]);
    setSiteSearch('');
    setQuickSiteId('');

    jammuSrt70mwAdminService
      .fetchSites('jammu', district)
      .then((sites) => {
        if (!cancelled) setAvailableSites(Array.isArray(sites) ? sites : []);
      })
      .catch((err: any) => {
        if (!cancelled) {
          setAvailableSites([]);
          setErrorMsg(err?.message || 'Failed to fetch unassigned sites.');
        }
      })
      .finally(() => {
        if (!cancelled) setFetchingSites(false);
      });

    return () => {
      cancelled = true;
    };
  }, [district]);

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
      if (isEditing && editId) {
        fd.append('id', editId);
      }
      fd.append('vendor', vendor);
      fd.append('state', 'jammu');
      fd.append('district', district);
      selectedSiteIds.forEach((id) => fd.append('site[]', String(id)));
      if (file) fd.append('file', file);
      if (remarks.trim()) fd.append('remarks', remarks.trim());
      if (purpose.trim()) fd.append('purpose', purpose.trim());

      let res;
      if (isEditing) {
        res = await jammuSrt70mwAdminService.updateAssign(fd);
      } else {
        res = await jammuSrt70mwAdminService.storeAssign(fd);
      }

      if (res.success) {
        setSuccessMsg(
          res.message ||
            `${selectedSiteIds.length} Jammu SRT site(s) successfully ${isEditing ? 'updated' : 'assigned'}!`
        );
        window.scrollTo({ top: 0, behavior: 'smooth' });
        setTimeout(() => {
          navigate('/vendor-management/jammu/installation/srt-70mw/view-assign');
        }, 1300);
      } else {
        setErrorMsg(res.message || 'Validation failed. Please check form inputs.');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch (err: any) {
      setErrorMsg(err?.message || `Failed to ${isEditing ? 'update' : 'assign'} Jammu SRT site(s).`);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ax-page swp-inst-form">
      <style>{SINGLE_CARD_FORM_CSS}</style>

      <PageHead
        title={isEditing ? `Edit Jammu SRT 70MW Installation #${editId}` : 'Assign Jammu SRT 70MW Installation'}
        subtitle="The field labels marked with * are required input fields."
        breadcrumbs={[
          { label: 'ERP Dashboard', href: '/' },
          { label: 'Vendor Management', href: '/vendor-management' },
          { label: 'Jammu' },
          { label: 'Installation', href: '/vendor-management/jammu/installation/srt-70mw' },
          { label: 'SRT 70MW', href: '/vendor-management/jammu/installation/srt-70mw' },
          { label: isEditing ? 'Edit Assignment' : 'Assign Sites' },
        ]}
        actions={
          <Link
            to="/vendor-management/jammu/installation/srt-70mw/view-assign"
            className="ax-btn ax-btn--primary ax-btn--sm"
          >
            View Assigned Installations
          </Link>
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
                {isEditing ? `Edit Jammu SRT 70MW Installation (#${editId})` : 'Assign Jammu SRT 70MW Installation'}
              </h2>
              <p className="ax-card__subtitle" style={{ fontSize: '0.85rem', color: '#ef4444', margin: '4px 0 0' }}>
                The field labels marked with * are required input fields.
              </p>
            </div>
            {initialLoading && (
              <span style={{ fontSize: 12, color: '#2563eb', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <span className="ax-spinner" /> Loading master data...
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
                  Select empaneled vendor for Jammu SRT 70MW installation
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
                  <option value="">-- Select Vendor --</option>
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
                  Select state and district to load feasible and unassigned SRT 70MW sites
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
                  onChange={(e) => {
                    editHydratedRef.current = false;
                    setDistrict(e.target.value);
                  }}
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
                    ? `Select unassigned feasible SRT 70MW rooftop sites in ${district}`
                    : 'Choose State & District above to fetch unassigned sites.'}
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
                -- Select State & District to Load Unassigned Sites --
              </div>
            ) : fetchingSites ? (
              <div style={{ padding: '28px 16px', textAlign: 'center', background: '#f8fafc', borderRadius: 8, color: '#2563eb', fontSize: 13 }}>
                <span className="ax-spinner" style={{ marginRight: 8 }} />
                Fetching unassigned sites for <b>{district}</b>...
              </div>
            ) : availableSites.length === 0 ? (
              <div style={{ padding: '24px 16px', textAlign: 'center', background: '#f8fafc', borderRadius: 8, border: '1px dashed #cbd5e1', color: '#64748b', fontSize: 13 }}>
                No unassigned sites available in <b>{district}</b>.
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
                    placeholder="Search sites by ID, site code or site name..."
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
                    ✓ {selectedSiteIds.length} site(s) selected for assignment
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
                placeholder="installation"
              />
              <FloatingInput
                label="Remarks"
                name="remarks"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                disabled={loading}
                placeholder="Optional installation instructions or notes"
              />
            </div>

            <div style={{ maxWidth: 540 }}>
              <UploadDropzone
                id="jammu_srt_file"
                label="Work Order File"
                required={false}
                accept=".pdf,.jpg,.jpeg,.png"
                helperText="PDF, JPG, JPEG or PNG (Max 5 MB)"
                existingFileLabel={existingFileName}
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
            <Link to="/vendor-management/jammu/installation/srt-70mw/view-assign" className="ax-btn ax-btn--secondary">
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
                  <span className="ax-spinner" /> {isEditing ? 'Updating...' : 'Assigning...'}
                </span>
              ) : isEditing ? (
                `Update Assignment (${selectedSiteIds.length} Sites)`
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

export default AssignSrtSites;
