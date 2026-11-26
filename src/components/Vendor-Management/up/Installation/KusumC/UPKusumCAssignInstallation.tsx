import { useState, useRef, useEffect, useMemo, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { PageHead } from '../../../../shell/PageHead';
import {
  upKusumCAdminService,
  type UpVendorItem,
  type UpKusumCVolumeItem,
  type UpKusumCApplicantItem,
} from '../../up-services';
import {
  SINGLE_CARD_FORM_CSS,
  FloatingInput,
  UploadDropzone,
  StatusFeedbackBanners,
} from '../upInstallationShared';

export function UPKusumCAssignInstallation() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('edit') || searchParams.get('id');
  const reassignId = searchParams.get('reassign');
  const activeId = editId || reassignId;
  const isReassign = Boolean(reassignId && !editId);
  const isEditing = Boolean(activeId);

  // Dynamic API Options
  const [vendorList, setVendorList] = useState<UpVendorItem[]>([]);
  const [volumeList, setVolumeList] = useState<UpKusumCVolumeItem[]>([]);
  const [districtList, setDistrictList] = useState<string[]>([]);
  const [availableApplicants, setAvailableApplicants] = useState<UpKusumCApplicantItem[]>([]);
  const [fetchingDistricts, setFetchingDistricts] = useState(false);
  const [fetchingApplicants, setFetchingApplicants] = useState(false);

  // Form State
  const [vendor, setVendor] = useState('');
  const [volume, setVolume] = useState('');
  const [district, setDistrict] = useState('');
  const [selectedApplicantIds, setSelectedApplicantIds] = useState<number[]>([]);
  const [applicantSearch, setApplicantSearch] = useState('');
  const [quickApplicantId, setQuickApplicantId] = useState('');
  const [deadlineDate, setDeadlineDate] = useState('');
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

  // Load initial data (Create vs Edit vs Reassign)
  useEffect(() => {
    let cancelled = false;
    setInitialLoading(true);
    setErrorMsg('');

    const load = async () => {
      try {
        if (isReassign && reassignId) {
          const [reassignRes, baseRes] = await Promise.all([
            upKusumCAdminService.getEditReassign(reassignId),
            upKusumCAdminService.getAssignFormData().catch(() => ({ vendors: [], volumes: [] })),
          ]);
          if (cancelled) return;
          const a = reassignRes.assign;
          setVendorList(reassignRes.vendors.length ? reassignRes.vendors : baseRes.vendors);
          setVolumeList(baseRes.volumes);
          if (a) {
            editHydratedRef.current = true;
            if (a.vendor) setVendor(String(a.vendor));
            if (a.volume) setVolume(String(a.volume));
            if (a.district) {
              setDistrict(a.district);
              setDistrictList([a.district]);
            }
            if (a.deadline_date) setDeadlineDate(String(a.deadline_date).slice(0, 10));
            if (a.remarks) setRemarks(a.remarks);
            if (a.file) setExistingFileName(String(a.file).split('/').pop());

            const existingSites: UpKusumCApplicantItem[] = Array.isArray(a.site_id)
              ? a.site_id
                  .filter((s: any) => s && typeof s === 'object')
                  .map((s: any) => ({
                    id: Number(s.id),
                    f_farmer_name: s.f_farmer_name || s.farmer_name || `Applicant #${s.id}`,
                    f_father_name: s.f_father_name || s.father_name || '',
                  }))
              : [];
            if (existingSites.length) {
              setAvailableApplicants(existingSites);
              setSelectedApplicantIds(existingSites.map((s) => s.id));
            }
          }
        } else if (editId) {
          const editRes = await upKusumCAdminService.getEditAssign(editId);
          if (cancelled) return;
          editHydratedRef.current = true;
          setVendorList(editRes.vendors);
          setVolumeList(editRes.volumes);
          const distNames = editRes.districts.map((d: any) => d.f_district || d.district || String(d)).filter(Boolean);
          setDistrictList(distNames);

          const a = editRes.assign;
          if (a) {
            if (a.vendor) setVendor(String(a.vendor));
            if (a.volume) setVolume(String(a.volume));
            if (a.district) setDistrict(a.district);
            if (a.deadline_date) setDeadlineDate(String(a.deadline_date).slice(0, 10));
            if (a.remarks) setRemarks(a.remarks);
            if (a.file) setExistingFileName(String(a.file).split('/').pop());

            const assignedSites: UpKusumCApplicantItem[] = Array.isArray(a.site_id)
              ? a.site_id
                  .map((s: any) =>
                    typeof s === 'object'
                      ? {
                          id: Number(s.id),
                          f_farmer_name: s.f_farmer_name || `Applicant #${s.id}`,
                          f_father_name: s.f_father_name || '',
                        }
                      : { id: Number(s), f_farmer_name: `Applicant #${s}` }
                  )
                  .filter((s) => !isNaN(s.id) && s.id > 0)
              : [];

            // Merge assigned sites + unassigned applicant_names
            const map = new Map<number, UpKusumCApplicantItem>();
            assignedSites.forEach((s) => map.set(s.id, s));
            editRes.applicant_names.forEach((s) => {
              if (!map.has(Number(s.id))) map.set(Number(s.id), s);
            });
            setAvailableApplicants(Array.from(map.values()));
            setSelectedApplicantIds(assignedSites.map((s) => s.id));
          }
        } else {
          const res = await upKusumCAdminService.getAssignFormData();
          if (cancelled) return;
          setVendorList(res.vendors);
          setVolumeList(res.volumes);
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
  }, [editId, reassignId, isReassign]);

  // 2. Fetch Districts when Volume changes
  useEffect(() => {
    if (!volume) {
      setDistrictList([]);
      setDistrict('');
      setAvailableApplicants([]);
      setSelectedApplicantIds([]);
      return;
    }

    if (editHydratedRef.current) {
      return;
    }

    let cancelled = false;
    setFetchingDistricts(true);
    setDistrict('');
    setAvailableApplicants([]);
    setSelectedApplicantIds([]);

    upKusumCAdminService
      .fetchDistricts(volume)
      .then((list) => {
        if (!cancelled) {
          setDistrictList(list.map((d) => d.f_district).filter(Boolean));
        }
      })
      .catch((err: any) => {
        if (!cancelled) {
          setDistrictList([]);
          setErrorMsg(err?.message || 'Failed to fetch districts for selected volume.');
        }
      })
      .finally(() => {
        if (!cancelled) setFetchingDistricts(false);
      });

    return () => {
      cancelled = true;
    };
  }, [volume]);

  // 3. Fetch Applicants when District changes
  useEffect(() => {
    if (!volume || !district) {
      if (!editHydratedRef.current) {
        setAvailableApplicants([]);
        setSelectedApplicantIds([]);
      }
      return;
    }

    if (editHydratedRef.current) {
      editHydratedRef.current = false;
      return;
    }

    let cancelled = false;
    setFetchingApplicants(true);
    setSelectedApplicantIds([]);
    setApplicantSearch('');
    setQuickApplicantId('');

    upKusumCAdminService
      .fetchApplicants(volume, district)
      .then((list) => {
        if (!cancelled) setAvailableApplicants(list);
      })
      .catch((err: any) => {
        if (!cancelled) {
          setAvailableApplicants([]);
          setErrorMsg(err?.message || 'Failed to fetch unassigned applicants.');
        }
      })
      .finally(() => {
        if (!cancelled) setFetchingApplicants(false);
      });

    return () => {
      cancelled = true;
    };
  }, [volume, district]);

  const filteredApplicants = useMemo(() => {
    const q = applicantSearch.trim().toLowerCase();
    if (!q) return availableApplicants;
    return availableApplicants.filter(
      (a) =>
        String(a.id).includes(q) ||
        (a.f_farmer_name || '').toLowerCase().includes(q) ||
        (a.f_father_name || '').toLowerCase().includes(q) ||
        (a.f_village || '').toLowerCase().includes(q)
    );
  }, [availableApplicants, applicantSearch]);

  const toggleApplicant = (id: number) => {
    setSelectedApplicantIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedApplicantIds.length === filteredApplicants.length && filteredApplicants.length > 0) {
      setSelectedApplicantIds([]);
    } else {
      setSelectedApplicantIds(filteredApplicants.map((a) => a.id));
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!vendor) return setErrorMsg('Vendor Name is required.');
    if (!volume) return setErrorMsg('Volume is required.');
    if (!district) return setErrorMsg('District is required.');
    if (selectedApplicantIds.length === 0) return setErrorMsg('Please select at least one applicant.');
    if (!deadlineDate) return setErrorMsg('Deadline date is required.');
    if (file && file.size > 5 * 1024 * 1024) return setErrorMsg('File size must not exceed 5 MB.');

    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('vendor', vendor);
      fd.append('volume', volume);
      fd.append('district', district);
      selectedApplicantIds.forEach((id) => fd.append('applicant_name[]', String(id)));
      if (deadlineDate) fd.append('deadline_date', deadlineDate);
      if (file) fd.append('file', file);
      if (remarks.trim()) fd.append('remarks', remarks.trim());

      let res;
      if (isEditing && activeId) {
        res = await upKusumCAdminService.updateAssign(activeId, fd);
      } else {
        res = await upKusumCAdminService.storeAssign(fd);
      }

      setSuccessMsg(
        res?.message ||
          `${selectedApplicantIds.length} UP Kusum C site(s) successfully ${isEditing ? 'updated' : 'assigned'}!`
      );
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setTimeout(() => {
        navigate('/vendor-management/up/kusumc/installation/view-assign');
      }, 1300);
    } catch (err: any) {
      setErrorMsg(err?.message || `Failed to ${isEditing ? 'update' : 'assign'} Kusum C installation.`);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ax-page swp-inst-form">
      <style>{SINGLE_CARD_FORM_CSS}</style>

      <PageHead
        title={
          isReassign
            ? `Reassign UP Kusum C Installation #${activeId}`
            : isEditing
            ? `Edit UP Kusum C Installation #${activeId}`
            : 'Assign UP Kusum C Installation'
        }
        subtitle="The field labels marked with * are required input fields."
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Vendor Management', href: '/vendor-management' },
          { label: 'Uttar Pradesh', href: '/vendor-management/up' },
          { label: 'Installation' },
          { label: 'Kusum C', href: '/vendor-management/up/kusumc/installation/dashboard' },
          { label: isReassign ? 'Reassign' : isEditing ? 'Edit Assignment' : 'Assign Installation' },
        ]}
        actions={
          <Link
            to="/vendor-management/up/kusumc/installation/view-assign"
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
                {isReassign
                  ? `Reassign UP Kusum C Installation (#${activeId})`
                  : isEditing
                  ? `Edit UP Kusum C Installation (#${activeId})`
                  : 'Assign UP Kusum C Installation'}
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
              <span className="pill-num">2</span> Volume & District
            </button>
            <button type="button" className="swp-section-pill-btn" onClick={() => scrollTo(sec3)}>
              <span className="pill-num">3</span> Applicant Name {selectedApplicantIds.length > 0 ? `(${selectedApplicantIds.length})` : ''}
            </button>
            <button type="button" className="swp-section-pill-btn" onClick={() => scrollTo(sec4)}>
              <span className="pill-num">4</span> Deadline, File & Remarks
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
                  Select empaneled vendor for Uttar Pradesh Kusum C installation
                </span>
              </div>
            </div>

            <div style={{ maxWidth: 480 }}>
              <div className="ax-float">
                <select
                  id="kusumc_vendor"
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
                <label htmlFor="kusumc_vendor" className="ax-float__label floating">
                  Vendor Name <span style={{ color: '#ef4444' }}>*</span>
                </label>
              </div>
            </div>
          </div>

          <hr className="swp-section-divider" />

          {/* Section 2: Volume * & District * */}
          <div ref={sec2} className="swp-section-block">
            <div className="swp-section-header">
              <div className="swp-section-title-wrap">
                <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>2. Volume & District</h3>
                <span style={{ fontSize: '12px', color: 'var(--ax-text-muted, #64748b)' }}>
                  Select Kusum C volume to load unassigned districts (Volumes 1 & 2 excluded)
                </span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
              <div className="ax-float">
                <select
                  id="kusumc_volume"
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
                  {volumeList.map((v) => (
                    <option key={v.volume} value={String(v.volume)}>
                      Volume {v.volume}
                    </option>
                  ))}
                </select>
                <label htmlFor="kusumc_volume" className="ax-float__label floating">
                  Volume <span style={{ color: '#ef4444' }}>*</span>
                </label>
              </div>

              <div className="ax-float">
                <select
                  id="kusumc_district"
                  className="ax-float__input"
                  value={district}
                  onChange={(e) => {
                    editHydratedRef.current = false;
                    setDistrict(e.target.value);
                  }}
                  disabled={loading || !volume || fetchingDistricts}
                  required
                >
                  <option value="">
                    {fetchingDistricts ? 'Loading districts...' : '-- Select District --'}
                  </option>
                  {districtList.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
                <label htmlFor="kusumc_district" className="ax-float__label floating">
                  District <span style={{ color: '#ef4444' }}>*</span>
                </label>
              </div>
            </div>
          </div>

          <hr className="swp-section-divider" />

          {/* Section 3: Applicant Name * */}
          <div ref={sec3} className="swp-section-block">
            <div className="swp-section-header">
              <div className="swp-section-title-wrap">
                <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>
                  3. Applicant Name <span style={{ color: '#ef4444' }}>*</span>
                </h3>
                <span style={{ fontSize: '12px', color: 'var(--ax-text-muted, #64748b)' }}>
                  {district
                    ? `Select unassigned Kusum C applicants in ${district} (Volume ${volume})`
                    : 'Choose Volume & District above to fetch unassigned applicants.'}
                </span>
              </div>
              {district && availableApplicants.length > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span className="ax-badge ax-badge--soft ax-badge--accent" style={{ fontWeight: 600 }}>
                    {selectedApplicantIds.length} of {availableApplicants.length} selected
                  </span>
                  <button
                    type="button"
                    className="ax-btn ax-btn--secondary ax-btn--xs"
                    onClick={handleSelectAll}
                  >
                    {selectedApplicantIds.length === filteredApplicants.length && filteredApplicants.length > 0
                      ? 'Deselect All'
                      : 'Select All'}
                  </button>
                </div>
              )}
            </div>

            {!district ? (
              <div style={{ padding: '24px 16px', textAlign: 'center', background: '#f8fafc', borderRadius: 8, border: '1px dashed #cbd5e1', color: '#64748b', fontSize: 13 }}>
                -- Select Volume & District to Load Unassigned Applicants --
              </div>
            ) : fetchingApplicants ? (
              <div style={{ padding: '28px 16px', textAlign: 'center', background: '#f8fafc', borderRadius: 8, color: '#2563eb', fontSize: 13 }}>
                <span className="ax-spinner" style={{ marginRight: 8 }} />
                Fetching unassigned applicants for <b>{district}</b>...
              </div>
            ) : availableApplicants.length === 0 ? (
              <div style={{ padding: '24px 16px', textAlign: 'center', background: '#f8fafc', borderRadius: 8, border: '1px dashed #cbd5e1', color: '#64748b', fontSize: 13 }}>
                No unassigned applicants available in <b>{district}</b> (Volume {volume}).
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 12 }}>
                  <select
                    className="ax-input ax-input--sm"
                    style={{ width: '100%', height: 38, borderRadius: 6, fontSize: 13 }}
                    value={quickApplicantId}
                    onChange={(e) => {
                      const val = e.target.value;
                      setQuickApplicantId(val);
                      if (val) {
                        const numId = Number(val);
                        if (!selectedApplicantIds.includes(numId)) {
                          setSelectedApplicantIds((prev) => [...prev, numId]);
                        }
                      }
                    }}
                    disabled={loading}
                  >
                    <option value="">-- Quick Add Applicant ({availableApplicants.length}) --</option>
                    {availableApplicants.map((a) => (
                      <option key={a.id} value={String(a.id)}>
                        {selectedApplicantIds.includes(a.id) ? '✓ ' : ''}
                        {a.f_farmer_name} {a.f_father_name ? `(S/o ${a.f_father_name})` : ''} — #{a.id}
                      </option>
                    ))}
                  </select>

                  <input
                    type="text"
                    value={applicantSearch}
                    onChange={(e) => setApplicantSearch(e.target.value)}
                    placeholder="Search applicants by ID, farmer or father name..."
                    className="ax-input ax-input--sm"
                    style={{ width: '100%', height: 38, borderRadius: 6, fontSize: 13 }}
                  />
                </div>

                <div className="swp-site-list">
                  {filteredApplicants.map((app) => {
                    const isChecked = selectedApplicantIds.includes(app.id);
                    return (
                      <div
                        key={app.id}
                        className={`swp-site-item ${isChecked ? 'selected' : ''}`}
                        onClick={() => toggleApplicant(app.id)}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleApplicant(app.id)}
                          onClick={(e) => e.stopPropagation()}
                          style={{ width: 16, height: 16, marginTop: 2, cursor: 'pointer', accentColor: '#2563eb' }}
                        />
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: '#1e293b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {app.f_farmer_name}
                          </div>
                          <div style={{ fontSize: 11, color: '#64748b', display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 2 }}>
                            <span>ID: <b>#{app.id}</b></span>
                            {app.f_father_name && <span>S/o <b>{app.f_father_name}</b></span>}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {selectedApplicantIds.length > 0 && (
                  <div style={{ fontSize: 12, color: '#16a34a', fontWeight: 500 }}>
                    ✓ {selectedApplicantIds.length} applicant site(s) selected for assignment
                  </div>
                )}
              </div>
            )}
          </div>

          <hr className="swp-section-divider" />

          {/* Section 4: Deadline *, File * & Remarks */}
          <div ref={sec4} className="swp-section-block">
            <div className="swp-section-header">
              <div className="swp-section-title-wrap">
                <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>4. Deadline, Work Order File & Remarks</h3>
                <span style={{ fontSize: '12px', color: 'var(--ax-text-muted, #64748b)' }}>
                  Set installation completion deadline, attach assignment work order (PDF/Image, max 5 MB), and add remarks
                </span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16, marginBottom: 20 }}>
              <FloatingInput
                label="Deadline"
                name="deadline_date"
                type="date"
                required
                value={deadlineDate}
                onChange={(e) => setDeadlineDate(e.target.value)}
                disabled={loading}
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
                id="kusumc_file"
                label="File"
                required={!isEditing}
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
            <Link to="/vendor-management/up/kusumc/installation/view-assign" className="ax-btn ax-btn--secondary">
              Cancel
            </Link>
            <button
              type="submit"
              className="ax-btn ax-btn--primary"
              disabled={loading || !vendor || !volume || !district || selectedApplicantIds.length === 0 || !deadlineDate}
              style={{ minWidth: 200, fontWeight: 700 }}
            >
              {loading ? (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                  <span className="ax-spinner" /> {isEditing ? 'Updating...' : 'Assigning...'}
                </span>
              ) : isEditing ? (
                `Update Assignment (${selectedApplicantIds.length} Sites)`
              ) : (
                `Assign (${selectedApplicantIds.length}) Kusum C Sites →`
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

export default UPKusumCAssignInstallation;
