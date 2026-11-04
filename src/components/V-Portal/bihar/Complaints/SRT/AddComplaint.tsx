import { useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { PageHead } from '../../../../shell/PageHead';
import { biharComplaintService, getMediaUrl, type SrtSiteDetailsResponse } from '../../bihar-services';

// CSS: Unified Single-Card Layout with Floating Labels & Section Dividers (matching Kashmir golden reference design)
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

.bihar-form-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: var(--ax-space-4); }
@media (min-width: 1024px) { .bihar-form-grid--3col { grid-template-columns: repeat(3, 1fr); } }
.bihar-form-col-span-full { grid-column: 1 / -1; }
.bihar-gps-cell { height: 46px; }

.bihar-form-sticky-bar { position: sticky; bottom: var(--ax-space-4); z-index: 30; margin-top: var(--ax-space-6); padding: var(--ax-space-3) var(--ax-space-5); background: var(--ax-surface-solid); border: 1px solid var(--ax-border); border-radius: var(--ax-radius-xl); box-shadow: var(--ax-shadow-lg); display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: var(--ax-space-3); backdrop-filter: blur(12px); }

@keyframes bihar-spin { to { transform: rotate(360deg); } }
`;

type FileKey = 'file' | 'file2' | 'file3' | 'file4';
type Option = { value: string; label: string };

const FILE_KEYS: FileKey[] = ['file', 'file2', 'file3', 'file4'];
const opts = (arr: string[]): Option[] => arr.map((v) => ({ value: v, label: v }));

const SECTIONS = [
  { id: 'sec-location', num: '1', title: 'Site Selection' },
  { id: 'sec-plant', num: '2', title: 'Plant & CA Details' },
  { id: 'sec-grievance', num: '3', title: 'Grievance Details' },
  { id: 'sec-documents', num: '4', title: 'Upload Proofs (4 Files)' },
];

const TOTAL_SECTIONS = SECTIONS.length;

export function Bihar_Complaint_SRT_AddComplaint() {
  const navigate = useNavigate();

  // Edit mode: /v/complaint/bihar/srt-add-complaint?edit=<id>
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('edit');
  const isEdit = !!editId;
  const [existingFiles, setExistingFiles] = useState<Record<FileKey, string>>({ file: '', file2: '', file3: '', file4: '' });
  const [loadingEdit, setLoadingEdit] = useState(false);

  // Cascade dropdown states (API 1, 2)
  const [districts, setDistricts] = useState<string[]>([]);
  const [siteNames, setSiteNames] = useState<string[]>([]);

  // Loading states
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [loadingSiteNames, setLoadingSiteNames] = useState(false);
  const [loadingSiteDetails, setLoadingSiteDetails] = useState(false);
  const [fetchingLoc, setFetchingLoc] = useState(false);

  // Form State (Exact SRT Store fields from API documentation)
  const [formData, setFormData] = useState({
    district: '',
    site_name: '',
    discom: 'NBPDCL',
    dept_name: '',
    location: '',
    firm_name: 'ABC Solar Tech',
    ca_no: '',
    sanction_load: '5',
    plant_sc: '5',
    wo_no: 'WO/2026/5',
    phase: '3',
    latitude: '',
    longitude: '',
    complaint: '',
    sms: 'Yes',
  });

  // Files: All 4 files required on add; optional on edit (only new ones are sent)
  const [files, setFiles] = useState<Record<FileKey, File | null>>({
    file: null,
    file2: null,
    file3: null,
    file4: null,
  });

  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // 1. Initial Load: Districts (GET /bihar/srt/complaint/add)
  useEffect(() => {
    (async () => {
      setLoadingDistricts(true);
      try {
        const list = await biharComplaintService.getSrtDistricts();
        setDistricts(list);
      } catch (err) {
        console.error('Error fetching SRT districts:', err);
      } finally {
        setLoadingDistricts(false);
      }
    })();
  }, []);

  // 1b. Edit mode: load complaint and prefill form
  useEffect(() => {
    if (!editId) return;
    (async () => {
      setLoadingEdit(true);
      try {
        const list = await biharComplaintService.getViewSrtComplaints();
        const d: any = list.find((x) => String(x.id) === String(editId));
        if (!d) {
          setErrorMsg('Complaint data could not be loaded.');
          return;
        }
        setFormData({
          district: d.district || '',
          site_name: d.site_name || '',
          discom: d.discom || 'NBPDCL',
          dept_name: d.dept_name || '',
          location: d.location || '',
          firm_name: d.firm_name || '',
          ca_no: d.ca_no || '',
          sanction_load: d.sanction_load != null ? String(d.sanction_load) : '',
          plant_sc: d.plant_sc != null ? String(d.plant_sc) : '',
          wo_no: d.wo_no || '',
          phase: d.phase != null ? String(d.phase) : '3',
          latitude: d.latitude ? String(d.latitude) : '',
          longitude: d.longitude ? String(d.longitude) : '',
          complaint: d.complaint || '',
          sms: 'Yes',
        });
        setExistingFiles({ file: d.file || '', file2: d.file2 || '', file3: d.file3 || '', file4: d.file4 || '' });
        if (d.district) {
          const list = await biharComplaintService.getSrtSiteNames(d.district);
          setSiteNames(d.site_name && !list.includes(d.site_name) ? [d.site_name, ...list] : list);
        }
      } catch (err: any) {
        console.error('Error loading complaint for edit:', err);
        setErrorMsg(err?.message || 'Failed to load complaint for edit.');
      } finally {
        setLoadingEdit(false);
      }
    })();
  }, [editId]);

  // 2. District change -> GET /bihar/srt/complaint/get-site-names?district=...
  const handleDistrictChange = async (district: string) => {
    setFormData((prev) => ({
      ...prev,
      district,
      site_name: '',
      dept_name: '',
      location: '',
      ca_no: '',
    }));
    setSiteNames([]);
    clearError('district');
    if (!district) return;

    setLoadingSiteNames(true);
    try {
      const list = await biharComplaintService.getSrtSiteNames(district);
      setSiteNames(list);
    } catch (err) {
      console.error('Error fetching site names:', err);
    } finally {
      setLoadingSiteNames(false);
    }
  };

  // 3. Site Name select -> Auto-fill GET /bihar/srt/complaint/get-sites?district=...&site_name=...
  const handleSiteNameSelect = async (site_name: string) => {
    setFormData((prev) => ({ ...prev, site_name }));
    clearError('site_name');
    if (!site_name || !formData.district) return;

    setLoadingSiteDetails(true);
    try {
      const details: SrtSiteDetailsResponse | null = await biharComplaintService.getSrtSiteDetails(
        formData.district,
        site_name
      );

      if (details) {
        setFormData((prev) => ({
          ...prev,
          discom: details.discom || prev.discom,
          dept_name: details.dept_name || prev.dept_name,
          site_name: details.site_name || site_name,
          location: details.location || prev.location,
          firm_name: details.firm_name || prev.firm_name,
          ca_no: details.ca_no || prev.ca_no,
          sanction_load: String(details.sanction_load || prev.sanction_load),
          plant_sc: details.plant_sc || prev.plant_sc,
          wo_no: details.wo_no || prev.wo_no,
          phase: details.phase || prev.phase,
          latitude: (details as any).latitude ? String((details as any).latitude) : prev.latitude,
          longitude: (details as any).longitude ? String((details as any).longitude) : prev.longitude,
        }));
      }
    } catch (err) {
      console.error('Error fetching site details:', err);
    } finally {
      setLoadingSiteDetails(false);
    }
  };

  const clearError = (name: string) => {
    setErrors((prev) => {
      if (!prev[name]) return prev;
      const next = { ...prev };
      delete next[name];
      return next;
    });
  };

  const setField = (name: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    clearError(name);
  };

  // Shortcut props for floating fields
  const f = (name: keyof typeof formData) => ({
    value: formData[name],
    onChange: (v: string) => setField(name, v),
    error: errors[name],
  });

  const handleFileChange = (key: FileKey, file: File | null) => {
    setFiles((prev) => ({ ...prev, [key]: file }));
    clearError(key);
  };

  const fetchLocation = () => {
    if (!navigator.geolocation) {
      setErrors((prev) => ({ ...prev, latitude: 'Location services not supported by browser.' }));
      return;
    }
    setFetchingLoc(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setFormData((prev) => ({
          ...prev,
          latitude: pos.coords.latitude.toFixed(6),
          longitude: pos.coords.longitude.toFixed(6),
        }));
        clearError('latitude');
        clearError('longitude');
        setFetchingLoc(false);
      },
      (err) => {
        setFetchingLoc(false);
        setErrors((prev) => ({
          ...prev,
          latitude: err.code === 1 ? 'Location permission denied. Please allow location access.' : 'Unable to retrieve location.',
        }));
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.district) newErrors.district = 'District is required.';
    if (!formData.discom) newErrors.discom = 'Discom is required.';
    if (!formData.dept_name) newErrors.dept_name = 'Department Name is required.';
    if (!formData.location) newErrors.location = 'Location is required.';
    if (!formData.firm_name) newErrors.firm_name = 'Firm Name is required.';
    if (!formData.ca_no) newErrors.ca_no = 'CA Number is required.';
    if (!formData.sanction_load) newErrors.sanction_load = 'Sanction Load is required.';
    if (!formData.plant_sc) newErrors.plant_sc = 'Plant SC is required.';
    if (!formData.wo_no) newErrors.wo_no = 'Work Order No is required.';
    if (!formData.phase) newErrors.phase = 'Phase is required.';
    if (!formData.complaint.trim()) newErrors.complaint = 'Please describe the rooftop plant complaint.';

    if (!isEdit) {
      if (!files.file) newErrors.file = 'File 1 (Inverter / Meter Photo) is required.';
      if (!files.file2) newErrors.file2 = 'File 2 (Rooftop Array Photo) is required.';
      if (!files.file3) newErrors.file3 = 'File 3 (ACDB / DCDB Panel Photo) is required.';
      if (!files.file4) newErrors.file4 = 'File 4 (Test Sheet / Document) is required.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!validate()) {
      setErrorMsg('Please resolve all validation errors before submitting.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setSubmitting(true);
    try {
      const fd = new FormData();
      if (editId) fd.append('srt_id', editId);
      fd.append('discom', formData.discom);
      fd.append('district', formData.district);
      fd.append('dept_name', formData.dept_name);
      fd.append('location', formData.location);
      fd.append('firm_name', formData.firm_name);
      fd.append('ca_no', formData.ca_no);
      fd.append('sanction_load', formData.sanction_load);
      fd.append('plant_sc', formData.plant_sc);
      fd.append('wo_no', formData.wo_no);
      fd.append('phase', formData.phase);
      fd.append('complaint', formData.complaint);
      fd.append('sms', formData.sms);

      if (formData.latitude) fd.append('latitude', formData.latitude);
      if (formData.longitude) fd.append('longitude', formData.longitude);

      FILE_KEYS.forEach((k) => {
        if (files[k]) {
          fd.append(k, files[k] as Blob);
        }
      });

      const resp = isEdit
        ? await biharComplaintService.updateSrtComplaint(fd)
        : await biharComplaintService.storeSrtComplaint(fd);

      if (resp.success) {
        setSuccessMsg(resp.message || (isEdit ? 'Complaint updated successfully!' : 'Complaint registered successfully!'));
        window.scrollTo({ top: 0, behavior: 'smooth' });
        setTimeout(() => {
          navigate('/v/complaint/bihar/srt-view-complaint');
        }, 1500);
      } else {
        setErrorMsg(resp.message || 'Failed to submit complaint. Please check your data.');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch (err: any) {
      console.error('Submission error:', err);
      setErrorMsg(err?.message || 'Server error while submitting complaint.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bihar-single-card-form">
      <style>{SINGLE_CARD_FORM_CSS}</style>

      <PageHead
        title={isEdit ? 'Edit SRT Rooftop Complaint' : 'Register SRT Rooftop Complaint'}
        subtitle={
          <span style={{ fontSize: 'var(--ax-text-sm)', color: 'var(--ax-text-muted)' }}>
            {isEdit
              ? 'Update site details, technical parameters, or replace uploaded proof documents'
              : 'Log solar rooftop plant breakdown, inverter failure, generation drop, or net-meter issue ticket'}
          </span>
        }
        breadcrumbs={[
          { label: 'Home', href: '/v-dashboard' },
          { label: 'Bihar' },
          { label: 'Complaints' },
          { label: 'SRT', href: '/v/complaint/bihar/srt-view-complaint' },
          { label: isEdit ? 'Edit Complaint' : 'Add Complaint' },
        ]}
        actions={
          <Link to="/v/complaint/bihar/srt-view-complaint" className="ax-btn ax-btn--secondary ax-btn--pill">
            <svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12l14 0" /><path d="M5 12l6 6" /><path d="M5 12l6 -6" /></svg>
            <span className="ax-btn__label">Complaint List</span>
          </Link>
        }
      />

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

      <form onSubmit={handleSubmit} noValidate>
        <div className="ax-card">
          <div className="ax-card__header">
            <div>
              <h2 className="ax-card__title" style={{ margin: 0 }}>
                {isEdit ? 'Edit Vendor SRT Rooftop Complaint' : 'Add Vendor SRT Rooftop Complaint'}
              </h2>
              <p className="ax-card__subtitle" style={{ margin: '4px 0 0' }}>
                {loadingEdit
                  ? 'Loading complaint data...'
                  : 'Select District and Site Name to auto-populate plant specifications from the database.'}
              </p>
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
            {/* ═════════ SECTION 1: SITE SELECTION ═════════ */}
            <div id="sec-location" className="bihar-section-block">
              <SectionHeader num="1" title="Site & Authority Selection" desc="Select District and Site Name to auto-fill department, location, and firm parameters." />
              <div className="bihar-form-grid bihar-form-grid--3col">
                <FloatingSelect
                  id="srt-district"
                  label="District"
                  required
                  placeholder={loadingDistricts ? 'Loading districts...' : '-- Select District --'}
                  value={formData.district}
                  options={opts(districts)}
                  disabled={loadingDistricts}
                  onChange={handleDistrictChange}
                  error={errors.district}
                />
                <FloatingSelect
                  id="srt-sitename"
                  label="Site Name"
                  required
                  placeholder={!formData.district ? 'Select District First' : loadingSiteNames ? 'Loading sites...' : '-- Select Site Name --'}
                  value={formData.site_name}
                  options={opts(siteNames)}
                  disabled={!formData.district || loadingSiteNames}
                  onChange={handleSiteNameSelect}
                  error={errors.site_name}
                />
                <FloatingSelect
                  id="srt-discom"
                  label="Discom"
                  required
                  options={[
                    { value: 'NBPDCL', label: 'NBPDCL (North Bihar)' },
                    { value: 'SBPDCL', label: 'SBPDCL (South Bihar)' },
                  ]}
                  {...f('discom')}
                />
                <FloatingInput id="srt-dept" label="Department Name" required placeholder="e.g. Health Department" {...f('dept_name')} />
                <FloatingInput id="srt-loc" label="Location / Substation" required placeholder="e.g. PHC Bihta" {...f('location')} />
                <FloatingInput id="srt-firm" label="Firm Name" required placeholder="e.g. Solar Tech Ltd" {...f('firm_name')} />
              </div>
            </div>

            <hr className="bihar-section-divider" />

            {/* ═════════ SECTION 2: PLANT & CA DETAILS ═════════ */}
            <div id="sec-plant" className="bihar-section-block">
              <SectionHeader
                num="2"
                title="Rooftop Plant & Electrical Details"
                desc={loadingSiteDetails ? 'Auto-fetching plant details from database...' : 'CA number, capacity, work order, connection phase, and site coordinates.'}
              />
              <div className="bihar-form-grid bihar-form-grid--3col">
                <FloatingInput id="srt-ca" label="CA Number" required placeholder="e.g. CA-1002345" {...f('ca_no')} />
                <FloatingInput id="srt-sanc-load" label="Sanction Load (kW)" required placeholder="e.g. 10" {...f('sanction_load')} />
                <FloatingInput id="srt-plant-sc" label="Plant Capacity SC (kW)" required placeholder="e.g. 10" {...f('plant_sc')} />
                <FloatingInput id="srt-wo" label="Work Order No" required placeholder="e.g. WO/2026/01" {...f('wo_no')} />
                <FloatingSelect
                  id="srt-phase"
                  label="Connection Phase"
                  required
                  options={[
                    { value: '1', label: '1 (Single Phase)' },
                    { value: '3', label: '3 (3 Phase)' },
                  ]}
                  {...f('phase')}
                />
                <FloatingInput id="srt-lat" label="Latitude" placeholder="25.5941" {...f('latitude')} />
                <FloatingInput id="srt-lng" label="Longitude" placeholder="85.1376" {...f('longitude')} />
                <div>
                  <button
                    type="button"
                    className="ax-btn ax-btn--secondary"
                    onClick={fetchLocation}
                    disabled={fetchingLoc}
                    style={{ height: 46, width: '100%' }}
                  >
                    <svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <circle cx="12" cy="12" r="3" />
                      <path d="M12 2v3" />
                      <path d="M12 19v3" />
                      <path d="M2 12h3" />
                      <path d="M19 12h3" />
                    </svg>
                    <span className="ax-btn__label">{fetchingLoc ? 'Fetching GPS...' : 'Fetch Current Location'}</span>
                  </button>
                  <span className="ax-field-feedback" />
                </div>
              </div>
            </div>

            <hr className="bihar-section-divider" />

            {/* ═════════ SECTION 3: GRIEVANCE DETAILS ═════════ */}
            <div id="sec-grievance" className="bihar-section-block">
              <SectionHeader num="3" title="Grievance & Issue Description" desc="Describe the plant breakdown observation or equipment defect." />
              <div className="bihar-form-grid bihar-form-grid--3col">
                <FloatingSelect id="cs-sms" label="Send SMS / WhatsApp Notification?" options={[{ value: 'Yes', label: 'Yes (Notify)' }, { value: 'No', label: 'No' }]} {...f('sms')} />
                <div className="bihar-form-col-span-full">
                  <FloatingTextarea
                    id="cs-complaint"
                    label={`Detailed Complaint Description (${formData.complaint.length}/2000)`}
                    required
                    maxLength={2000}
                    placeholder="Explain the breakdown observation in detail (e.g. Inverter not working, generation drop to zero during daytime, error code on display)..."
                    {...f('complaint')}
                  />
                </div>
              </div>
            </div>

            <hr className="bihar-section-divider" />

            {/* ═════════ SECTION 4: UPLOAD PROOFS (4 FILES) ═════════ */}
            <div id="sec-documents" className="bihar-section-block">
              <SectionHeader
                num="4"
                title={isEdit ? 'Proof Documents' : 'Upload Proof Documents (All 4 Files Required)'}
                desc={
                  isEdit
                    ? 'Select a new photo only if you wish to replace an existing one. Otherwise, existing files will be retained.'
                    : 'Attach photographs of inverter error, solar panels, control panel, and inspection sheet.'
                }
              />
              <div className="bihar-form-grid bihar-form-grid--3col">
                <FloatingFileInput
                  id="srt-file"
                  label="1. Inverter / Defect Display"
                  required={!isEdit}
                  accept="image/*"
                  file={files.file}
                  existingUrl={existingFiles.file ? getMediaUrl(existingFiles.file) : null}
                  onChange={(x) => handleFileChange('file', x)}
                  error={errors.file}
                />
                <FloatingFileInput
                  id="srt-file2"
                  label="2. Solar Rooftop Array Photo"
                  required={!isEdit}
                  accept="image/*"
                  file={files.file2}
                  existingUrl={existingFiles.file2 ? getMediaUrl(existingFiles.file2) : null}
                  onChange={(x) => handleFileChange('file2', x)}
                  error={errors.file2}
                />
                <FloatingFileInput
                  id="srt-file3"
                  label="3. ACDB / DCDB / RMS Panel"
                  required={!isEdit}
                  accept="image/*"
                  file={files.file3}
                  existingUrl={existingFiles.file3 ? getMediaUrl(existingFiles.file3) : null}
                  onChange={(x) => handleFileChange('file3', x)}
                  error={errors.file3}
                />
                <FloatingFileInput
                  id="srt-file4"
                  label="4. Net Meter / Test Sheet"
                  required={!isEdit}
                  accept="image/*,application/pdf"
                  file={files.file4}
                  existingUrl={existingFiles.file4 ? getMediaUrl(existingFiles.file4) : null}
                  onChange={(x) => handleFileChange('file4', x)}
                  error={errors.file4}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Sticky Action Footer */}
        <div className="bihar-form-sticky-bar">
          <span className="ax-badge ax-badge--soft ax-badge--primary ax-badge--pill">
            {isEdit ? 'Edit Mode' : 'New Complaint'}
          </span>
          <div className="ax-cluster" style={{ gap: 'var(--ax-space-3)' }}>
            <button type="button" className="ax-btn ax-btn--secondary" onClick={() => navigate('/v/complaint/bihar/srt-view-complaint')} disabled={submitting}>
              <span className="ax-btn__label">Cancel</span>
            </button>
            <button type="submit" disabled={submitting || loadingEdit} className="ax-btn ax-btn--primary" style={{ minWidth: 200 }}>
              {submitting ? (
                <>
                  <svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ animation: 'bihar-spin 1s linear infinite' }}><path d="M12 3a9 9 0 1 0 9 9" /></svg>
                  <span className="ax-btn__label">{isEdit ? 'Updating Complaint...' : 'Submitting Complaint...'}</span>
                </>
              ) : (
                <>
                  <svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l5 5l10 -10" /></svg>
                  <span className="ax-btn__label">{isEdit ? 'Update Complaint' : 'Submit Complaint'}</span>
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

export default Bihar_Complaint_SRT_AddComplaint;

/* =========================================================================
 * Reusable Floating Components (Golden Reference: Kashmir / Bihar Survey Design)
 * ========================================================================= */

function SectionHeader({ num, title, desc }: { num: string; title: string; desc?: ReactNode }) {
  return (
    <div className="bihar-section-header">
      <div className="bihar-section-title-wrap">
        <div className="ax-cluster" style={{ gap: 'var(--ax-space-2)', alignItems: 'center' }}>
          <span className="ax-badge ax-badge--soft ax-badge--primary ax-badge--pill" style={{ fontWeight: 600 }}>
            Section {num} of {TOTAL_SECTIONS}
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
  step?: string;
  required?: boolean;
  readOnly?: boolean;
  maxLength?: number;
  placeholder?: string;
  value: string;
  onChange?: (val: string) => void;
  error?: string;
}

function FloatingInput({ id, label, type = 'text', step, required, readOnly, maxLength, placeholder = ' ', value, onChange, error }: FloatingInputProps) {
  return (
    <div>
      <div className={`ax-float${type === 'date' ? ' ax-float--select' : ''}`}>
        <input
          id={id}
          type={type}
          step={step}
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
  maxLength?: number;
  onChange: (val: string) => void;
  error?: string;
}

function FloatingTextarea({ id, label, required, placeholder = 'Enter Remarks...', value, rows = 3, maxLength, onChange, error }: FloatingTextareaProps) {
  return (
    <div>
      <div className="ax-float ax-float--area">
        <textarea
          id={id}
          rows={rows}
          maxLength={maxLength}
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
  file: File | null;
  existingUrl?: string | null;
  onChange: (file: File | null) => void;
  error?: string;
}

const IMG_RE = /\.(png|jpe?g|webp|gif|svg)$/i;

function FloatingFileInput({ id, label, required, accept, file, existingUrl, onChange, error }: FloatingFileInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const objectUrl = useMemo(
    () => (file && file.type.startsWith('image/') ? URL.createObjectURL(file) : null),
    [file]
  );
  useEffect(() => {
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [objectUrl]);

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
  const existingIsImage = Boolean(existingClean && IMG_RE.test(existingClean));

  const thumbStyle = {
    width: 44,
    height: 44,
    objectFit: 'cover' as const,
    borderRadius: 0,
    border: '1px solid var(--ax-border)',
    flexShrink: 0,
  };

  const iconCircle = (bg: string, fg: string, children: ReactNode) => (
    <div
      style={{
        width: 36,
        height: 36,
        borderRadius: '50%',
        background: bg,
        color: fg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      {children}
    </div>
  );

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
              {objectUrl ? (
                <img src={objectUrl} alt={label} style={thumbStyle} />
              ) : (
                iconCircle('#ecfdf5', '#10b981',
                  <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                )
              )}
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ax-text-strong)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {file.name}
                </div>
                <div style={{ fontSize: 11, color: 'var(--ax-text-muted)', marginTop: 2 }}>
                  {(file.size / 1024).toFixed(0)} KB · Ready to upload
                </div>
              </div>
            </div>
            <button
              type="button"
              className="ax-btn ax-btn--ghost ax-btn--sm"
              onClick={handleClear}
              style={{ color: '#ef4444', flexShrink: 0 }}
              title="Remove file"
            >
              Remove
            </button>
          </div>
        ) : existingName ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, textAlign: 'left' }}>
              {existingIsImage && existingUrl ? (
                <img src={existingUrl} alt={label} style={thumbStyle} />
              ) : (
                iconCircle('#eff6ff', '#3b82f6',
                  <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                  </svg>
                )
              )}
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
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: '50%',
                background: '#eff6ff',
                color: '#3b82f6',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 6,
              }}
            >
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
              {accept?.includes('application/pdf') ? 'PDF, JPG, PNG or WEBP · Max 5MB' : 'JPG, PNG or WEBP · Max 5MB'}
            </div>
          </>
        )}
      </div>

      <FieldFeedback error={error} />
    </div>
  );
}
