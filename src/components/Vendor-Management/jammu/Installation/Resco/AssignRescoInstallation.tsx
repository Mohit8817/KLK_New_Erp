import { useState, useRef, useEffect, useMemo, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { PageHead } from '../../../../shell/PageHead';
import {
  jammuRescoAdminService,
  type VendorItem,
  type VolumeItem,
  type DistrictItem,
  type SiteItem,
} from './jammuRescoAdminService';
import {
  SINGLE_CARD_FORM_CSS,
  FloatingInput,
  UploadDropzone,
  StatusFeedbackBanners,
} from '../../../up/Installation/upInstallationShared';

export function AssignRescoInstallation() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('edit') || searchParams.get('id');
  const isEditing = Boolean(editId);

  // Dynamic API Options (Strictly live - zero fake fallback)
  const [vendorList, setVendorList] = useState<VendorItem[]>([]);
  const [volumeList, setVolumeList] = useState<VolumeItem[]>([]);
  const [districtList, setDistrictList] = useState<DistrictItem[]>([]);
  const [availableSites, setAvailableSites] = useState<SiteItem[]>([]);
  const [fetchingDistricts, setFetchingDistricts] = useState(false);
  const [fetchingSites, setFetchingSites] = useState(false);

  // Form State - strictly 'jammu' (never 'kashmir')
  const [vendor, setVendor] = useState('');
  const [volume, setVolume] = useState('');
  const [district, setDistrict] = useState('');
  const [selectedSiteIds, setSelectedSiteIds] = useState<number[]>([]);
  const [deadlineDate, setDeadlineDate] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | undefined>(undefined);
  const [existingFileName, setExistingFileName] = useState<string | undefined>(undefined);
  const [remarks, setRemarks] = useState('');
  const [purpose, setPurpose] = useState('installation');

  const [siteSearch, setSiteSearch] = useState('');
  const [quickSiteId, setQuickSiteId] = useState('');

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
          const editRes = await jammuRescoAdminService.getEditAssign(editId);
          if (cancelled) return;
          editHydratedRef.current = true;
          if (editRes) {
            if (Array.isArray(editRes.vendor) && editRes.vendor.length > 0) setVendorList(editRes.vendor);
            if (Array.isArray(editRes.volumes) && editRes.volumes.length > 0) setVolumeList(editRes.volumes);
            if (Array.isArray(editRes.districts) && editRes.districts.length > 0) setDistrictList(editRes.districts);

            const a = editRes.assign || (editRes as any).assigns || editRes;
            if (a) {
              if (a.vendor) setVendor(String(a.vendor));
              if (a.volume) setVolume(String(a.volume));
              if (a.district) setDistrict(a.district);
              if (a.deadline_date) setDeadlineDate(String(a.deadline_date).slice(0, 10));
              if (a.remarks) setRemarks(a.remarks);
              if (a.purpose) setPurpose(a.purpose);
              if (a.file) setExistingFileName(String(a.file).split('/').pop());

              // Parse assigned sites
              let assignedIds: number[] = [];
              try {
                const parsed = typeof a.site_name === 'string' ? JSON.parse(a.site_name) : a.site_name;
                if (Array.isArray(parsed)) assignedIds = parsed.map(Number);
                else if (parsed) assignedIds = [Number(parsed)];
              } catch {
                if (a.site_name) assignedIds = String(a.site_name).split(',').map(Number);
              }
              if (assignedIds.length === 0 && a.site_id) {
                try {
                  const pId = typeof a.site_id === 'string' ? JSON.parse(a.site_id) : a.site_id;
                  if (Array.isArray(pId)) assignedIds = pId.map(Number);
                  else if (pId) assignedIds = [Number(pId)];
                } catch {
                  assignedIds = String(a.site_id).split(',').map(Number);
                }
              }
              setSelectedSiteIds(assignedIds);

              const editSites: SiteItem[] = Array.isArray(editRes.sites)
                ? editRes.sites
                : Array.isArray((editRes as any).site_names)
                ? (editRes as any).site_names
                : [];
              setAvailableSites(editSites);
            }
          }
        } else {
          const res = await jammuRescoAdminService.getAssignFormData();
          if (cancelled) return;
          setVendorList(res.vendor || []);
          setVolumeList(res.volumes || []);

          // Auto-select first volume if available
          const firstVol = (res.volumes?.[0] as any)?.volume || (typeof res.volumes?.[0] === 'string' ? res.volumes[0] : '1');
          if (firstVol) {
            setVolume(String(firstVol));
            setFetchingDistricts(true);
            const dists = await jammuRescoAdminService.fetchDistricts(firstVol);
            if (cancelled) return;
            setDistrictList(dists || []);
            setFetchingDistricts(false);
          }
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

  // 2. Volume Change -> Reload Districts
  useEffect(() => {
    if (!volume || editHydratedRef.current) return;
    let cancelled = false;
    setFetchingDistricts(true);
    jammuRescoAdminService
      .fetchDistricts(volume)
      .then((dists) => {
        if (!cancelled) {
          setDistrictList(dists || []);
          if (!dists.some((d) => d.district === district)) {
            setDistrict('');
            setAvailableSites([]);
            setSelectedSiteIds([]);
          }
        }
      })
      .catch((err: any) => {
        if (!cancelled) setErrorMsg(err?.message || 'Failed to fetch districts.');
      })
      .finally(() => {
        if (!cancelled) setFetchingDistricts(false);
      });

    return () => {
      cancelled = true;
    };
  }, [volume]);

  // 3. District Change -> Fetch Unassigned Sites
  useEffect(() => {
    if (!district || !volume) {
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

    jammuRescoAdminService
      .fetchSites(volume, district)
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
  }, [district, volume]);

  const filteredSites = useMemo(() => {
    const q = siteSearch.trim().toLowerCase();
    if (!q) return availableSites;
    return availableSites.filter(
      (s) =>
        String(s.id).includes(q) ||
        (s.site_name || '').toLowerCase().includes(q) ||
        (s.farmer_name || '').toLowerCase().includes(q) ||
        (s.unique_id || '').toLowerCase().includes(q) ||
        (s.ca_no || '').toLowerCase().includes(q) ||
        (s.location || '').toLowerCase().includes(q) ||
        (s.department || '').toLowerCase().includes(q)
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
    if (!volume) return setErrorMsg('Volume is required.');
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
      fd.append('volume', volume);
      fd.append('state', 'jammu');
      fd.append('district', district);
      if (deadlineDate) fd.append('deadline_date', deadlineDate);
      if (remarks.trim()) fd.append('remarks', remarks.trim());
      if (purpose.trim()) fd.append('purpose', purpose.trim());
      if (file) fd.append('file', file);

      // Append site IDs matching all controller expectation styles
      selectedSiteIds.forEach((id) => {
        fd.append('site[]', String(id));
        fd.append('site_name[]', String(id));
        fd.append('site_id[]', String(id));
      });

      let res;
      if (isEditing && editId) {
        res = await jammuRescoAdminService.updateAssign(editId, fd);
      } else {
        res = await jammuRescoAdminService.storeAssign(fd);
      }

      if (res.success) {
        setSuccessMsg(
          res.message ||
            `${selectedSiteIds.length} Jammu RESCO site(s) successfully ${isEditing ? 'updated' : 'assigned'}!`
        );
        window.scrollTo({ top: 0, behavior: 'smooth' });
        setTimeout(() => {
          navigate('/vendor-management/jammu/installation/resco/view-assign-installation');
        }, 1300);
      } else {
        setErrorMsg(res.message || 'Validation failed. Please check form inputs.');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch (err: any) {
      setErrorMsg(err?.message || `Failed to ${isEditing ? 'update' : 'assign'} Jammu RESCO site(s).`);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ax-page swp-inst-form">
      <style>{SINGLE_CARD_FORM_CSS}</style>

      <PageHead
        title={isEditing ? `Edit Jammu RESCO Installation #${editId}` : 'Assign Jammu RESCO Installation'}
        subtitle="The field labels marked with * are required input fields."
        breadcrumbs={[
          { label: 'ERP Dashboard', href: '/' },
          { label: 'Vendor Management', href: '/vendor-management' },
          { label: 'Jammu', href: '/vendor-management/jammu' },
          { label: 'Installation', href: '/vendor-management/jammu/installation/resco' },
          { label: 'RESCO', href: '/vendor-management/jammu/installation/resco' },
          { label: isEditing ? 'Edit Assignment' : 'Assign Installation' },
        ]}
        actions={
          <Link
            to="/vendor-management/jammu/installation/resco/view-assign-installation"
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
                {isEditing ? `Edit Jammu RESCO Installation (#${editId})` : 'Assign Jammu RESCO Installation'}
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
              <span className="pill-num">2</span> State, Volume & District
            </button>
            <button type="button" className="swp-section-pill-btn" onClick={() => scrollTo(sec3)}>
              <span className="pill-num">3</span> Site Name {selectedSiteIds.length > 0 ? `(${selectedSiteIds.length})` : ''}
            </button>
            <button type="button" className="swp-section-pill-btn" onClick={() => scrollTo(sec4)}>
              <span className="pill-num">4</span> Deadline, Work Order File & Remarks
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
                  Select empaneled vendor for Jammu RESCO installation
                </span>
              </div>
            </div>

            <div style={{ maxWidth: 480 }}>
              <div className="ax-float">
                <select
                  id="jammu_resco_vendor"
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
                <label htmlFor="jammu_resco_vendor" className="ax-float__label floating">
                  Vendor Name <span style={{ color: '#ef4444' }}>*</span>
                </label>
              </div>
            </div>
          </div>

          <hr className="swp-section-divider" />

          {/* Section 2: State *, Volume * & District * */}
          <div ref={sec2} className="swp-section-block">
            <div className="swp-section-header">
              <div className="swp-section-title-wrap">
                <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>
                  2. State, Volume & District <span style={{ color: '#ef4444' }}>*</span>
                </h3>
                <span style={{ fontSize: '12px', color: 'var(--ax-text-muted, #64748b)' }}>
                  Select volume and district to load eligible unassigned RESCO rooftop sites in Jammu
                </span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
              <div className="ax-float">
                <input
                  type="text"
                  id="jammu_resco_state"
                  className="ax-float__input"
                  value="Jammu"
                  readOnly
                  disabled
                />
                <label htmlFor="jammu_resco_state" className="ax-float__label floating">
                  State <span style={{ color: '#ef4444' }}>*</span>
                </label>
              </div>

              <div className="ax-float">
                <select
                  id="jammu_resco_volume"
                  className="ax-float__input"
                  value={volume}
                  onChange={(e) => {
                    editHydratedRef.current = false;
                    setVolume(e.target.value);
                  }}
                  disabled={loading || initialLoading}
                  required
                >
                  <option value="">-- Select Volume --</option>
                  {volumeList.map((vol, idx) => {
                    const val = typeof vol === 'object' && vol !== null ? (vol as any).volume : vol;
                    return (
                      <option key={idx} value={String(val)}>
                        Volume {val}
                      </option>
                    );
                  })}
                </select>
                <label htmlFor="jammu_resco_volume" className="ax-float__label floating">
                  Volume <span style={{ color: '#ef4444' }}>*</span>
                </label>
              </div>

              <div className="ax-float">
                <select
                  id="jammu_resco_district"
                  className="ax-float__input"
                  value={district}
                  onChange={(e) => {
                    editHydratedRef.current = false;
                    setDistrict(e.target.value);
                  }}
                  disabled={loading || fetchingDistricts || !volume}
                  required
                >
                  <option value="">
                    {fetchingDistricts
                      ? 'Loading districts...'
                      : !volume
                      ? '-- Select Volume First --'
                      : '-- Select District --'}
                  </option>
                  {districtList.map((d, i) => {
                    const dName = typeof d === 'string' ? d : d.district;
                    return (
                      <option key={i} value={dName}>
                        {dName}
                      </option>
                    );
                  })}
                </select>
                <label htmlFor="jammu_resco_district" className="ax-float__label floating">
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
                    ? `Select unassigned feasible RESCO rooftop sites in ${district}`
                    : 'Choose Volume & District above to fetch unassigned sites.'}
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
                -- Select Volume & District to Load Unassigned Sites --
              </div>
            ) : fetchingSites ? (
              <div style={{ padding: '28px 16px', textAlign: 'center', background: '#f8fafc', borderRadius: 8, color: '#2563eb', fontSize: 13 }}>
                <span className="ax-spinner" style={{ marginRight: 8 }} />
                Fetching unassigned sites for <b>{district}</b>...
              </div>
            ) : availableSites.length === 0 ? (
              <div style={{ padding: '24px 16px', textAlign: 'center', background: '#f8fafc', borderRadius: 8, border: '1px dashed #cbd5e1', color: '#64748b', fontSize: 13 }}>
                No unassigned sites available in <b>{district}</b> for Volume <b>{volume}</b>.
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
                        {s.site_name || s.farmer_name} {s.unique_id ? `(${s.unique_id})` : ''} — #{s.id}
                      </option>
                    ))}
                  </select>

                  <input
                    type="text"
                    value={siteSearch}
                    onChange={(e) => setSiteSearch(e.target.value)}
                    placeholder="Search sites by ID, unique code or site name..."
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
                            {s.site_name || s.farmer_name}
                          </div>
                          <div style={{ fontSize: 11, color: '#64748b', display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 2 }}>
                            <span>ID: <b>#{s.id}</b></span>
                            {s.unique_id && <span>UID: <b>{s.unique_id}</b></span>}
                            {s.ca_no && <span>CA: <b>{s.ca_no}</b></span>}
                            {s.plant_sc && <span>Capacity: <b>{s.plant_sc} kW</b></span>}
                            {s.department && <span>Dept: <b>{s.department}</b></span>}
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

          {/* Section 4: Deadline, Work Order File & Remarks */}
          <div ref={sec4} className="swp-section-block">
            <div className="swp-section-header">
              <div className="swp-section-title-wrap">
                <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>
                  4. Deadline, Work Order File & Remarks
                </h3>
                <span style={{ fontSize: '12px', color: 'var(--ax-text-muted, #64748b)' }}>
                  Set deadline date, attach assignment work order (PDF/Image, max 5 MB), and add remarks
                </span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16, marginBottom: 20 }}>
              <div className="ax-float">
                <input
                  type="date"
                  id="jammu_resco_deadline"
                  className="ax-float__input"
                  value={deadlineDate}
                  onChange={(e) => setDeadlineDate(e.target.value)}
                  disabled={loading}
                  required
                />
                <label htmlFor="jammu_resco_deadline" className="ax-float__label floating">
                  Deadline <span style={{ color: '#ef4444' }}>*</span>
                </label>
              </div>

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
                id="jammu_resco_file"
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
            <Link to="/vendor-management/jammu/installation/resco/view-assign-installation" className="ax-btn ax-btn--secondary">
              Cancel
            </Link>
            <button
              type="submit"
              className="ax-btn ax-btn--primary"
              disabled={loading || !vendor || !district || !volume || selectedSiteIds.length === 0}
              style={{ minWidth: 200, fontWeight: 700 }}
            >
              {loading ? (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                  <span className="ax-spinner" /> {isEditing ? 'Updating...' : 'Assigning...'}
                </span>
              ) : isEditing ? (
                `Update Assignment (${selectedSiteIds.length} Sites)`
              ) : (
                `Assign (${selectedSiteIds.length}) Jammu RESCO Sites →`
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

export default AssignRescoInstallation;
