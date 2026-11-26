import { useState, useRef, useEffect, useMemo, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { PageHead } from '../../../../shell/PageHead';
import {
  upSsl18wAdminService,
  type UpVendorItem,
  type UpSsl18wPanchayatItem,
} from '../../up-services';
import {
  SINGLE_CARD_FORM_CSS,
  FloatingInput,
  UploadDropzone,
  StatusFeedbackBanners,
  parseStringArray,
} from '../upInstallationShared';

export function UPSSL18WAssignInstallation() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('edit') || searchParams.get('id');
  const isEditing = Boolean(editId);

  // Dynamic API Options
  const [vendorList, setVendorList] = useState<UpVendorItem[]>([]);
  const [districtList, setDistrictList] = useState<string[]>([]);
  const [blockList, setBlockList] = useState<string[]>([]);
  const [panchayatList, setPanchayatList] = useState<UpSsl18wPanchayatItem[]>([]);
  const [fetchingBlocks, setFetchingBlocks] = useState(false);
  const [fetchingPanchayats, setFetchingPanchayats] = useState(false);

  // Form State (exact params: vendor, state, district, block, panchayat[], ldate, sitecount, volume, file, remark)
  const [vendor, setVendor] = useState('');
  const [stateName, setStateName] = useState('UP');
  const [district, setDistrict] = useState('');
  const [block, setBlock] = useState('');
  const [selectedPanchayats, setSelectedPanchayats] = useState<string[]>([]);
  const [panchayatSearch, setPanchayatSearch] = useState('');
  const [ldate, setLdate] = useState('');
  const [sitecount, setSitecount] = useState('');
  const [volume, setVolume] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | undefined>(undefined);
  const [existingFileName, setExistingFileName] = useState<string | undefined>(undefined);
  const [remark, setRemark] = useState('');

  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const editHydratedDistrictRef = useRef(false);
  const editHydratedBlockRef = useRef(false);

  // Section refs
  const sec1 = useRef<HTMLDivElement>(null);
  const sec2 = useRef<HTMLDivElement>(null);
  const sec3 = useRef<HTMLDivElement>(null);
  const sec4 = useRef<HTMLDivElement>(null);

  const scrollTo = (ref: React.RefObject<HTMLDivElement | null>) => {
    ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // Load initial data (Create #1 vs Edit #7)
  useEffect(() => {
    let cancelled = false;
    setInitialLoading(true);
    setErrorMsg('');

    const load = async () => {
      try {
        if (editId) {
          const res = await upSsl18wAdminService.getEditAssign(editId);
          if (cancelled) return;
          editHydratedDistrictRef.current = true;
          editHydratedBlockRef.current = true;
          setVendorList(res.vendors);
          setDistrictList(res.district.map((d) => d.district).filter(Boolean));
          setBlockList(res.block.map((b) => b.block).filter(Boolean));
          setPanchayatList(res.panchayat);

          const a = res.assignedsite;
          if (a) {
            if (a.vendor) setVendor(String(a.vendor));
            if (a.state) setStateName(a.state.toUpperCase());
            if (a.district) setDistrict(a.district);
            if (a.block) setBlock(a.block);
            const preselected = parseStringArray(a.village);
            setSelectedPanchayats(preselected);
            if (a.deadline_date) setLdate(String(a.deadline_date).slice(0, 10));
            if (a.site_count) setSitecount(String(a.site_count));
            if (a.volume !== null && a.volume !== undefined) setVolume(String(a.volume));
            if (a.remarks) setRemark(a.remarks);
            if (a.file) setExistingFileName(String(a.file).split('/').pop());
          }
        } else {
          const res = await upSsl18wAdminService.getAssignFormData();
          if (cancelled) return;
          setVendorList(res.vendors);
          setDistrictList(res.districts.map((d) => d.district).filter(Boolean));
        }
      } catch (err: any) {
        if (!cancelled) setErrorMsg(err?.message || 'Failed to load SSL 18W assignment form data.');
      } finally {
        if (!cancelled) setInitialLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [editId]);

  // 2. Fetch Block when District changes
  useEffect(() => {
    if (!district) {
      setBlockList([]);
      setBlock('');
      setPanchayatList([]);
      setSelectedPanchayats([]);
      return;
    }
    if (editHydratedDistrictRef.current) {
      editHydratedDistrictRef.current = false;
      return;
    }

    let cancelled = false;
    setFetchingBlocks(true);
    setBlock('');
    setPanchayatList([]);
    setSelectedPanchayats([]);
    setSitecount('');

    upSsl18wAdminService
      .fetchBlocks(district)
      .then((list) => {
        if (!cancelled) setBlockList(list.map((b) => b.block).filter(Boolean));
      })
      .catch((err: any) => {
        if (!cancelled) {
          setBlockList([]);
          setErrorMsg(err?.message || 'Failed to fetch blocks for selected district.');
        }
      })
      .finally(() => {
        if (!cancelled) setFetchingBlocks(false);
      });

    return () => {
      cancelled = true;
    };
  }, [district]);

  // 3. Fetch Panchayat when Block changes
  useEffect(() => {
    if (!district || !block) {
      if (!editHydratedBlockRef.current) {
        setPanchayatList([]);
        setSelectedPanchayats([]);
      }
      return;
    }
    if (editHydratedBlockRef.current) {
      editHydratedBlockRef.current = false;
      return;
    }

    let cancelled = false;
    setFetchingPanchayats(true);
    setSelectedPanchayats([]);
    setSitecount('');
    setPanchayatSearch('');

    upSsl18wAdminService
      .fetchPanchayats(district, block)
      .then((list) => {
        if (!cancelled) setPanchayatList(list);
      })
      .catch((err: any) => {
        if (!cancelled) {
          setPanchayatList([]);
          setErrorMsg(err?.message || 'Failed to fetch panchayats for selected block.');
        }
      })
      .finally(() => {
        if (!cancelled) setFetchingPanchayats(false);
      });

    return () => {
      cancelled = true;
    };
  }, [district, block]);

  const filteredPanchayats = useMemo(() => {
    const q = panchayatSearch.trim().toLowerCase();
    if (!q) return panchayatList;
    return panchayatList.filter((p) => p.panchayat.toLowerCase().includes(q));
  }, [panchayatList, panchayatSearch]);

  const recalcSiteCount = (nextSelected: string[]) => {
    const sum = panchayatList
      .filter((p) => nextSelected.includes(p.panchayat))
      .reduce((acc, p) => acc + (Number(p.count) || 0), 0);
    setSitecount(sum > 0 ? String(sum) : '');
  };

  const togglePanchayat = (name: string) => {
    const next = selectedPanchayats.includes(name)
      ? selectedPanchayats.filter((p) => p !== name)
      : [...selectedPanchayats, name];
    setSelectedPanchayats(next);
    recalcSiteCount(next);
  };

  const handleSelectAllPanchayats = () => {
    if (selectedPanchayats.length === filteredPanchayats.length && filteredPanchayats.length > 0) {
      setSelectedPanchayats([]);
      setSitecount('');
    } else {
      const next = filteredPanchayats.map((p) => p.panchayat);
      setSelectedPanchayats(next);
      recalcSiteCount(next);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!vendor) return setErrorMsg('Vendor Name is required.');
    if (!stateName) return setErrorMsg('State is required.');
    if (!district) return setErrorMsg('District is required.');
    if (!block) return setErrorMsg('Block is required.');
    if (selectedPanchayats.length === 0) return setErrorMsg('Please select at least one Panchayat.');
    if (!ldate) return setErrorMsg('Deadline Date is required.');
    const countNum = Number(sitecount);
    if (!countNum || countNum < 1) return setErrorMsg('Site Count must be at least 1.');
    if (!isEditing && !file) return setErrorMsg('Please upload an assignment document file.');

    setLoading(true);
    try {
      const fd = new FormData();
      if (isEditing && editId) {
        fd.append('id', editId);
      }
      fd.append('vendor', vendor);
      fd.append('state', stateName);
      fd.append('district', district);
      fd.append('block', block);
      selectedPanchayats.forEach((p) => fd.append('panchayat[]', p));
      fd.append('ldate', ldate);
      fd.append('sitecount', String(Math.floor(countNum)));
      if (volume.trim()) fd.append('volume', volume.trim());
      if (remark.trim()) fd.append('remark', remark.trim());
      if (file) fd.append('file', file);

      const res = isEditing
        ? await upSsl18wAdminService.updateAssign(fd)
        : await upSsl18wAdminService.storeAssign(fd);

      setSuccessMsg(
        res?.message ||
          `UP SSL-18W sites (${countNum}) successfully ${isEditing ? 'updated' : 'assigned'}!`
      );
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setTimeout(() => {
        navigate('/vendor-management/up/ssl18w/installation/view-assign');
      }, 1300);
    } catch (err: any) {
      setErrorMsg(err?.message || `Failed to ${isEditing ? 'update' : 'assign'} SSL 18W installation sites.`);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ax-page swp-inst-form">
      <style>{SINGLE_CARD_FORM_CSS}</style>

      <PageHead
        title={isEditing ? `Edit UP SSL-18W Assignment #${editId}` : 'Assign UP SSL-18W Installation Sites'}
        subtitle="The field labels marked with * are required input fields."
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Vendor Management', href: '/vendor-management' },
          { label: 'Uttar Pradesh', href: '/vendor-management/up' },
          { label: 'Installation' },
          { label: 'SSL 18W', href: '/vendor-management/up/ssl18w/installation/dashboard' },
          { label: isEditing ? 'Edit Assignment' : 'Assign Sites' },
        ]}
        actions={
          <Link
            to="/vendor-management/up/ssl18w/installation/view-assign"
            className="ax-btn ax-btn--primary ax-btn--sm"
          >
            View Assigned Sites
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
                {isEditing ? `Edit UP SSL-18W Installation Data (#${editId})` : 'Add Assign UP SSL-18W Installation Data'}
              </h2>
              <p className="ax-card__subtitle" style={{ fontSize: '0.85rem', color: '#ef4444', margin: '4px 0 0' }}>
                The field labels marked with * are required input fields.
              </p>
            </div>
            {initialLoading && (
              <span style={{ fontSize: 12, color: '#2563eb', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <span className="ax-spinner" /> Loading form options...
              </span>
            )}
          </div>

          <div className="swp-section-pills">
            <button type="button" className="swp-section-pill-btn" onClick={() => scrollTo(sec1)}>
              <span className="pill-num">1</span> Vendor & State
            </button>
            <button type="button" className="swp-section-pill-btn" onClick={() => scrollTo(sec2)}>
              <span className="pill-num">2</span> District & Block
            </button>
            <button type="button" className="swp-section-pill-btn" onClick={() => scrollTo(sec3)}>
              <span className="pill-num">3</span> Panchayat {selectedPanchayats.length > 0 ? `(${selectedPanchayats.length})` : ''}
            </button>
            <button type="button" className="swp-section-pill-btn" onClick={() => scrollTo(sec4)}>
              <span className="pill-num">4</span> Deadline, Count & File
            </button>
          </div>
        </div>

        <div className="ax-card__body">
          {/* Section 1: Vendor Name * & State * */}
          <div ref={sec1} className="swp-section-block">
            <div className="swp-section-header">
              <div className="swp-section-title-wrap">
                <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>
                  1. Vendor Name & State <span style={{ color: '#ef4444' }}>*</span>
                </h3>
                <span style={{ fontSize: '12px', color: 'var(--ax-text-muted, #64748b)' }}>
                  Choose empaneled vendor and confirm state (UP)
                </span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
              <div className="ax-float">
                <select
                  id="ssl18w_vendor"
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
                <label htmlFor="ssl18w_vendor" className="ax-float__label floating">
                  Vendor Name <span style={{ color: '#ef4444' }}>*</span>
                </label>
              </div>

              <div className="ax-float">
                <select
                  id="ssl18w_state"
                  className="ax-float__input"
                  value={stateName}
                  onChange={(e) => setStateName(e.target.value)}
                  disabled={loading}
                  required
                >
                  <option value="UP">UP</option>
                </select>
                <label htmlFor="ssl18w_state" className="ax-float__label floating">
                  State <span style={{ color: '#ef4444' }}>*</span>
                </label>
              </div>
            </div>
          </div>

          <hr className="swp-section-divider" />

          {/* Section 2: District * & Block * */}
          <div ref={sec2} className="swp-section-block">
            <div className="swp-section-header">
              <div className="swp-section-title-wrap">
                <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>2. District & Block</h3>
                <span style={{ fontSize: '12px', color: 'var(--ax-text-muted, #64748b)' }}>
                  Districts with feasible, unassigned, installation-pending SSL 18W sites
                </span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
              <div className="ax-float">
                <select
                  id="ssl18w_district"
                  className="ax-float__input"
                  value={district}
                  onChange={(e) => {
                    editHydratedDistrictRef.current = false;
                    setDistrict(e.target.value);
                  }}
                  disabled={loading || initialLoading}
                  required
                >
                  <option value="">-- Select District --</option>
                  {districtList.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
                <label htmlFor="ssl18w_district" className="ax-float__label floating">
                  District <span style={{ color: '#ef4444' }}>*</span>
                </label>
              </div>

              <div className="ax-float">
                <select
                  id="ssl18w_block"
                  className="ax-float__input"
                  value={block}
                  onChange={(e) => {
                    editHydratedBlockRef.current = false;
                    setBlock(e.target.value);
                  }}
                  disabled={loading || !district || fetchingBlocks}
                  required
                >
                  <option value="">{fetchingBlocks ? 'Loading blocks...' : '-- Select Block --'}</option>
                  {blockList.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
                <label htmlFor="ssl18w_block" className="ax-float__label floating">
                  Block <span style={{ color: '#ef4444' }}>*</span>
                </label>
              </div>
            </div>
          </div>

          <hr className="swp-section-divider" />

          {/* Section 3: Panchayat * */}
          <div ref={sec3} className="swp-section-block">
            <div className="swp-section-header">
              <div className="swp-section-title-wrap">
                <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>
                  3. Panchayat <span style={{ color: '#ef4444' }}>*</span>
                </h3>
                <span style={{ fontSize: '12px', color: 'var(--ax-text-muted, #64748b)' }}>
                  {block
                    ? `Select one or more panchayats in ${block}, ${district}. All feasible unassigned lights in selected panchayats will be assigned.`
                    : 'Choose District & Block above to load available panchayats and light counts.'}
                </span>
              </div>
              {block && panchayatList.length > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span className="ax-badge ax-badge--soft ax-badge--accent" style={{ fontWeight: 600 }}>
                    {selectedPanchayats.length} of {panchayatList.length} selected
                  </span>
                  <button type="button" className="ax-btn ax-btn--secondary ax-btn--xs" onClick={handleSelectAllPanchayats}>
                    {selectedPanchayats.length === filteredPanchayats.length && filteredPanchayats.length > 0
                      ? 'Deselect All'
                      : 'Select All'}
                  </button>
                </div>
              )}
            </div>

            {!block ? (
              <div style={{ padding: '24px 16px', textAlign: 'center', background: '#f8fafc', borderRadius: 8, border: '1px dashed #cbd5e1', color: '#64748b', fontSize: 13 }}>
                -- Select District & Block to Load Panchayats --
              </div>
            ) : fetchingPanchayats ? (
              <div style={{ padding: '28px 16px', textAlign: 'center', background: '#f8fafc', borderRadius: 8, color: '#2563eb', fontSize: 13 }}>
                <span className="ax-spinner" style={{ marginRight: 8 }} /> Fetching panchayats in <b>{block}</b>...
              </div>
            ) : panchayatList.length === 0 ? (
              <div style={{ padding: '24px 16px', textAlign: 'center', background: '#f8fafc', borderRadius: 8, border: '1px dashed #cbd5e1', color: '#64748b', fontSize: 13 }}>
                No unassigned feasible panchayats found in <b>{block}</b>.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ maxWidth: 360 }}>
                  <input
                    type="text"
                    value={panchayatSearch}
                    onChange={(e) => setPanchayatSearch(e.target.value)}
                    placeholder="Filter panchayats by name..."
                    className="ax-input ax-input--sm"
                    style={{ width: '100%', height: 38, borderRadius: 6, fontSize: 13 }}
                  />
                </div>

                <div className="swp-site-list">
                  {filteredPanchayats.map((item) => {
                    const isChecked = selectedPanchayats.includes(item.panchayat);
                    return (
                      <div
                        key={item.panchayat}
                        className={`swp-site-item ${isChecked ? 'selected' : ''}`}
                        onClick={() => togglePanchayat(item.panchayat)}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => togglePanchayat(item.panchayat)}
                          onClick={(e) => e.stopPropagation()}
                          style={{ width: 16, height: 16, marginTop: 2, cursor: 'pointer', accentColor: '#2563eb' }}
                        />
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: '#1e293b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {item.panchayat}
                          </div>
                          <div style={{ fontSize: 11, color: '#2563eb', fontWeight: 600, marginTop: 2 }}>
                            {item.count} Light{item.count === 1 ? '' : 's'} available
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {selectedPanchayats.length > 0 && (
                  <div style={{ fontSize: 12, color: '#16a34a', fontWeight: 500 }}>
                    ✓ {selectedPanchayats.length} panchayat(s) selected · Total lights: {sitecount || 0}
                  </div>
                )}
              </div>
            )}
          </div>

          <hr className="swp-section-divider" />

          {/* Section 4: Deadline Date *, Site Count *, Volume, File *, Remarks */}
          <div ref={sec4} className="swp-section-block">
            <div className="swp-section-header">
              <div className="swp-section-title-wrap">
                <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>4. Deadline, Site Count, File & Remarks</h3>
                <span style={{ fontSize: '12px', color: 'var(--ax-text-muted, #64748b)' }}>
                  Confirm deadline date, total light count, work order attachment, and remarks
                </span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 20 }}>
              <FloatingInput
                label="Deadline Date"
                name="ldate"
                type="date"
                required
                value={ldate}
                onChange={(e) => setLdate(e.target.value)}
                disabled={loading}
              />
              <FloatingInput
                label="Site Count"
                name="sitecount"
                type="number"
                min={1}
                required
                value={sitecount}
                onChange={(e) => setSitecount(e.target.value)}
                disabled={loading}
              />
              <FloatingInput
                label="Volume (Optional)"
                name="volume"
                type="number"
                value={volume}
                onChange={(e) => setVolume(e.target.value)}
                disabled={loading}
              />
              <FloatingInput
                label="Remarks"
                name="remark"
                value={remark}
                onChange={(e) => setRemark(e.target.value)}
                disabled={loading}
              />
            </div>

            <div style={{ maxWidth: 540 }}>
              <UploadDropzone
                id="ssl18w_file"
                label="File"
                required={!isEditing}
                accept=".pdf,.jpg,.jpeg,.png,.docx,.xlsx"
                helperText="PDF, JPG, JPEG, PNG, DOCX or XLSX"
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
            <Link to="/vendor-management/up/ssl18w/installation/view-assign" className="ax-btn ax-btn--secondary">
              Cancel
            </Link>
            <button
              type="submit"
              className="ax-btn ax-btn--primary"
              disabled={
                loading ||
                !vendor ||
                !district ||
                !block ||
                selectedPanchayats.length === 0 ||
                !ldate ||
                !sitecount ||
                (!file && !isEditing)
              }
              style={{ minWidth: 210, fontWeight: 700 }}
            >
              {loading ? (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                  <span className="ax-spinner" /> {isEditing ? 'Updating...' : 'Assigning...'}
                </span>
              ) : isEditing ? (
                `Update SSL-18W Assignment`
              ) : (
                `Assign (${sitecount || 0}) SSL-18W Sites →`
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

export default UPSSL18WAssignInstallation;
