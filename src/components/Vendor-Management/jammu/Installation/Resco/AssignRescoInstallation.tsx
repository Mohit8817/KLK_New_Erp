<<<<<<< HEAD
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
=======
import { useState, useRef, useMemo, type FormEvent, type ChangeEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PageHead } from '../../../../shell/PageHead';
import {
  JAMMU_RESCO_DISTRICTS,
  JAMMU_RESCO_VOLUMES,
  JAMMU_RESCO_VENDORS,
  JAMMU_RESCO_SITES_CATALOG,
  jammuRescoAdminService,
  type RescoSiteItem,
} from './jammuRescoAdminService';

// Unified Single-Card Layout with Floating Labels & Section Dividers
const SINGLE_CARD_FORM_CSS = `
.solar-erp-page {
  --asw-primary: #2559bf;
  --asw-primary-rgb: 37, 89, 191;
  --ax-primary: #2559bf;
  --ax-primary-hover: #1e4699;
  --ax-primary-rgb: 37, 89, 191;
}
.solar-erp-page .ax-btn--primary,
.solar-erp-page .ax-button--primary {
  background: #2559bf !important;
  border-color: #2559bf !important;
  color: #ffffff !important;
}
.solar-erp-page .ax-btn--primary:hover,
.solar-erp-page .ax-button--primary:hover {
  background: #1e4699 !important;
  border-color: #1e4699 !important;
}
.resco-inst-form .ax-card {
  border: 1px solid var(--ax-border, #e2e8f0);
  border-radius: var(--ax-radius-xl, 16px);
  background: var(--ax-surface-solid, #ffffff);
  box-shadow: var(--ax-shadow-sm, 0 1px 2px 0 rgba(0, 0, 0, 0.05));
  overflow: hidden;
}
.resco-inst-form .ax-card__header {
  padding: var(--ax-space-5, 20px) var(--ax-space-6, 24px);
  border-bottom: 1px solid var(--ax-border-subtle, #f1f5f9);
  background: var(--ax-surface-subtle, #f8fafc);
  display: flex;
  flex-direction: column;
  gap: var(--ax-space-4, 16px);
}
.resco-inst-form .ax-card__body { padding: var(--ax-space-6, 24px); }

/* Quick Section Nav Pills */
.resco-section-pills {
  display: flex;
  gap: var(--ax-space-2, 8px);
  overflow-x: auto;
  padding-bottom: 4px;
  scrollbar-width: thin;
}
.resco-section-pill-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border-radius: var(--ax-radius-pill, 9999px);
  font-size: var(--ax-text-xs, 12px);
  font-weight: 500;
  white-space: nowrap;
  background: var(--ax-surface-solid, #ffffff);
  border: 1px solid var(--ax-border, #e2e8f0);
  color: var(--ax-text, #1e293b);
  cursor: pointer;
  transition: all var(--ax-motion-fast, 150ms) var(--ax-ease-standard, ease);
}
.resco-section-pill-btn:hover {
  border-color: #2559bf;
  color: #2559bf;
  background: color-mix(in srgb, #2559bf 6%, var(--ax-surface-solid, #ffffff));
}
.resco-section-pill-btn .pill-num {
  width: 18px; height: 18px; border-radius: 50%;
  background: var(--ax-surface-subtle, #f1f5f9);
  display: inline-flex; align-items: center; justify-content: center;
  font-size: 10px; font-weight: 700;
}

/* Section Block */
.resco-section-block { padding-top: var(--ax-space-2, 8px); }
.resco-section-header {
  display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap;
  gap: var(--ax-space-2, 8px);
  margin-bottom: var(--ax-space-5, 20px);
  padding-bottom: var(--ax-space-3, 12px);
  border-bottom: 1px solid var(--ax-border-subtle, #f1f5f9);
}
.resco-section-title-wrap { display: flex; flex-direction: column; gap: 4px; }
.resco-section-divider {
  border: 0;
  border-top: 1px dashed var(--ax-border, #e2e8f0);
  margin: var(--ax-space-8, 32px) 0 var(--ax-space-6, 24px);
}

/* Floating Label Core */
.ax-float { position: relative; width: 100%; }
.ax-float__input {
  width: 100%;
  height: 46px;
  padding: 12px 14px 4px 14px;
  font-size: var(--ax-text-sm, 13px);
  background: var(--ax-surface-solid, #ffffff);
  border: 1px solid var(--ax-border, #cbd5e1);
  border-radius: var(--ax-radius-md, 8px);
  color: var(--ax-text, #0f172a);
  outline: none;
  transition: border-color var(--ax-motion-fast, 150ms) var(--ax-ease-standard, ease),
              box-shadow var(--ax-motion-fast, 150ms) var(--ax-ease-standard, ease);
}
.ax-float__input::placeholder { color: transparent; }
.ax-float__input:focus {
  border-color: #2559bf;
  box-shadow: 0 0 0 3px color-mix(in srgb, #2559bf 20%, transparent);
}
.ax-float__input:disabled { opacity: .7; cursor: not-allowed; background: var(--ax-surface-subtle, #f8fafc); }

.ax-float__label {
  position: absolute;
  inset-inline-start: 12px;
  top: 50%;
  transform: translateY(-50%);
  margin: 0;
  padding: 0 4px;
  font-size: var(--ax-text-sm, 13px);
  color: var(--ax-text-subtle, #64748b);
  background: var(--ax-surface-solid, #ffffff);
  border-radius: var(--ax-radius-xs, 4px);
  pointer-events: none;
  transition: top var(--ax-motion-fast, 150ms) var(--ax-ease-standard, ease),
              font-size var(--ax-motion-fast, 150ms) var(--ax-ease-standard, ease),
              color var(--ax-motion-fast, 150ms) var(--ax-ease-standard, ease);
  z-index: 2;
  white-space: nowrap;
  max-width: calc(100% - 24px);
  overflow: hidden;
  text-overflow: ellipsis;
}
.ax-float__label.floating {
  top: 0;
  font-size: 11px;
  font-weight: 500;
  color: #2559bf;
}
.ax-float__label.has-val:not(.floating) {
  top: 0;
  font-size: 11px;
  font-weight: 500;
  color: var(--ax-text-muted, #64748b);
}
`;

interface FloatingInputProps {
  label: string;
  name: string;
  value: string;
  onChange: (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  required?: boolean;
  disabled?: boolean;
  type?: string;
  placeholder?: string;
}

function FloatingInput({ label, name, value, onChange, required, disabled, type = 'text', placeholder }: FloatingInputProps) {
  const [focused, setFocused] = useState(false);
  const hasVal = Boolean(value && String(value).length > 0);

  return (
    <div className="ax-float">
      <input
        type={type}
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        required={required}
        disabled={disabled}
        placeholder={placeholder || label}
        className="ax-float__input"
      />
      <label htmlFor={name} className={`ax-float__label ${focused ? 'floating' : hasVal ? 'has-val' : ''}`}>
        {label} {required && <span style={{ color: '#ef4444' }}>*</span>}
      </label>
    </div>
  );
}

interface UploadDropzoneProps {
  id: string;
  label: string;
  required?: boolean;
  disabled?: boolean;
  accept?: string;
  file: File | null;
  onSelect: (file: File) => void;
  onRemove: () => void;
  error?: string;
}

function UploadDropzone({
  id,
  label,
  required,
  disabled,
  accept = '.pdf,.doc,.docx,.jpg,.jpeg,.png',
  file,
  onSelect,
  onRemove,
  error,
}: UploadDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (disabled) return;
    onRemove();
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label
        htmlFor={id}
        style={{
          fontSize: '12.5px',
          fontWeight: 600,
          color: error ? '#ef4444' : '#334155',
          display: 'flex',
          alignItems: 'center',
          gap: 4,
        }}
      >
        <span>{label}</span>
        {required && <span style={{ color: '#ef4444' }}>*</span>}
      </label>

      <input
        ref={inputRef}
        id={id}
        type="file"
        accept={accept}
        disabled={disabled}
        style={{ display: 'none' }}
        onChange={(e) => {
          if (disabled) return;
          const f = e.target.files?.[0];
          if (f) onSelect(f);
        }}
      />

      <div
        onClick={() => {
          if (!disabled) inputRef.current?.click();
        }}
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          if (disabled) return;
          setIsDragging(false);
          const chosen = e.dataTransfer.files?.[0];
          if (chosen) onSelect(chosen);
        }}
        role="button"
        tabIndex={disabled ? -1 : 0}
        style={{
          border: isDragging ? '1.5px dashed #2559bf' : '1.5px dashed #cbd5e1',
          borderRadius: 8,
          background: isDragging ? '#eff6ff' : '#ffffff',
          padding: file ? '12px 14px' : '22px 16px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          cursor: disabled ? 'not-allowed' : 'pointer',
          minHeight: 110,
        }}
      >
        {file ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  background: '#ecfdf5',
                  color: '#10b981',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path d="M20 6L9 17l-5-5" />
                </svg>
              </div>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#1e293b' }}>{file.name}</div>
                <div style={{ fontSize: 11, color: '#64748b' }}>{(file.size / 1024).toFixed(0)} KB · Ready to upload</div>
              </div>
            </div>
            <button
              type="button"
              className="ax-btn ax-btn--ghost ax-btn--sm"
              onClick={handleClear}
              style={{ color: '#ef4444' }}
            >
              Remove
            </button>
          </div>
        ) : (
          <>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#eff6ff', color: '#2559bf', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 6 }}>
              <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" />
                <path d="M12 12v9" />
                <path d="m8 16 4-4 4 4" />
              </svg>
            </div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#1e293b' }}>Click to upload or drag &amp; drop PO Document</div>
            <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>PDF, DOC, DOCX, JPG or PNG (Max 10MB)</div>
          </>
        )}
      </div>
    </div>
  );
}
>>>>>>> 70f527ba60f555fe6ad1fa61874f359bd66bf9d7

export function AssignRescoInstallation() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('edit') || searchParams.get('id');
  const isEditing = Boolean(editId);

<<<<<<< HEAD
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
=======
  // Form states matching required fields
  const [vendorName, setVendorName] = useState('');
  const [volume, setVolume] = useState('');
  const [district, setDistrict] = useState('');
  const [selectedSiteIds, setSelectedSiteIds] = useState<number[]>([]);
  const [siteSearch, setSiteSearch] = useState('');
>>>>>>> 70f527ba60f555fe6ad1fa61874f359bd66bf9d7
  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | undefined>(undefined);
  const [existingFileName, setExistingFileName] = useState<string | undefined>(undefined);
  const [remarks, setRemarks] = useState('');
  const [purpose, setPurpose] = useState('installation');

<<<<<<< HEAD
  const [siteSearch, setSiteSearch] = useState('');
  const [quickSiteId, setQuickSiteId] = useState('');

  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
=======
  // Status feedback
  const [submitting, setSubmitting] = useState(false);
>>>>>>> 70f527ba60f555fe6ad1fa61874f359bd66bf9d7
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

<<<<<<< HEAD
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
=======
  // Filtered sites based on selected district and search query
  const eligibleSites = useMemo(() => {
    let list = JAMMU_RESCO_SITES_CATALOG;
    if (district) {
      list = list.filter((s) => s.district.toLowerCase() === district.toLowerCase());
    }
    if (siteSearch.trim()) {
      const q = siteSearch.trim().toLowerCase();
      list = list.filter(
        (s) =>
          s.site_name.toLowerCase().includes(q) ||
          (s.ca_no && s.ca_no.toLowerCase().includes(q)) ||
          (s.department && s.department.toLowerCase().includes(q))
      );
    }
    return list;
  }, [district, siteSearch]);

  const handleToggleSite = (id: number) => {
    setSelectedSiteIds((prev) => (prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]));
  };

  const handleSelectAll = () => {
    if (selectedSiteIds.length === eligibleSites.length) {
      setSelectedSiteIds([]);
    } else {
      setSelectedSiteIds(eligibleSites.map((s) => s.id));
>>>>>>> 70f527ba60f555fe6ad1fa61874f359bd66bf9d7
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

<<<<<<< HEAD
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
=======
    if (!vendorName) return setErrorMsg('Vendor Name is required.');
    if (!volume) return setErrorMsg('Volume is required.');
    if (!district) return setErrorMsg('District is required.');
    if (selectedSiteIds.length === 0) return setErrorMsg('Please select at least one Site Name.');

    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('vendor', vendorName);
      fd.append('volume', volume);
      fd.append('district', district);
      selectedSiteIds.forEach((id) => fd.append('site_id[]', String(id)));
      if (file) fd.append('file', file);
      if (remarks.trim()) fd.append('remarks', remarks.trim());

      const res = await jammuRescoAdminService.submitAssignInstallation(fd);
      setSuccessMsg(res.message || 'Jammu RESCO Installation Assigned Successfully!');

      setTimeout(() => {
        navigate('/vendor-management/jammu/installation/resco/view-assign-installation');
      }, 1500);
    } catch (err: any) {
      console.error('Submit assign error:', err);
      setErrorMsg(err?.message || 'Failed to assign RESCO installation.');
>>>>>>> 70f527ba60f555fe6ad1fa61874f359bd66bf9d7
    } finally {
      setLoading(false);
    }
  };

  return (
<<<<<<< HEAD
    <div className="ax-page swp-inst-form">
=======
    <div className="solar-erp-page resco-inst-form">
>>>>>>> 70f527ba60f555fe6ad1fa61874f359bd66bf9d7
      <style>{SINGLE_CARD_FORM_CSS}</style>

      <PageHead
<<<<<<< HEAD
        title={isEditing ? `Edit Jammu RESCO Installation #${editId}` : 'Assign Jammu RESCO Installation'}
        subtitle="The field labels marked with * are required input fields."
        breadcrumbs={[
          { label: 'ERP Dashboard', href: '/' },
          { label: 'Vendor Management', href: '/vendor-management' },
          { label: 'Jammu', href: '/vendor-management/jammu' },
          { label: 'Installation', href: '/vendor-management/jammu/installation/resco' },
          { label: 'RESCO', href: '/vendor-management/jammu/installation/resco' },
          { label: isEditing ? 'Edit Assignment' : 'Assign Installation' },
=======
        title="Assign Jammu Resco Installation"
        subtitle="The field labels marked with * are required input fields."
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Vendor Management', href: '/vendor-management' },
          { label: 'Jammu', href: '/vendor-management/jammu' },
          { label: 'RESCO Installation', href: '/vendor-management/jammu/installation/resco/dashboard' },
          { label: 'Assign Jammu Resco Installation' },
>>>>>>> 70f527ba60f555fe6ad1fa61874f359bd66bf9d7
        ]}
        actions={
          <Link
            to="/vendor-management/jammu/installation/resco/view-assign-installation"
            className="ax-btn ax-btn--primary ax-btn--sm"
          >
<<<<<<< HEAD
            View Assigned Installations
=======
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ marginRight: 6 }}
            >
              <path d="M10 12a2 2 0 1 0 4 0a2 2 0 0 0 -4 0" />
              <path d="M21 12c-2.4 4 -5.4 6 -9 6c-3.6 0 -6.6 -2 -9 -6c2.4 -4 5.4 -6 9 -6c3.6 0 6.6 2 9 6" />
            </svg>
            View Assign Jammu Resco Installation
>>>>>>> 70f527ba60f555fe6ad1fa61874f359bd66bf9d7
          </Link>
        }
      />

<<<<<<< HEAD
      <StatusFeedbackBanners
        errorMsg={errorMsg}
        successMsg={successMsg}
        onClearError={() => setErrorMsg('')}
        onClearSuccess={() => setSuccessMsg('')}
      />
=======
      {/* Status Feedback Banners */}
      {errorMsg && (
        <div
          style={{
            padding: '12px 16px',
            background: '#fef2f2',
            border: '1px solid #fecaca',
            color: '#b91c1c',
            borderRadius: 8,
            marginBottom: 16,
            fontSize: 13,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span>✕ {errorMsg}</span>
          <button
            type="button"
            onClick={() => setErrorMsg('')}
            style={{ background: 'none', border: 'none', color: '#b91c1c', cursor: 'pointer', fontSize: 16 }}
          >
            ×
          </button>
        </div>
      )}

      {successMsg && (
        <div
          style={{
            padding: '12px 16px',
            background: '#ecfdf5',
            border: '1px solid #a7f3d0',
            color: '#065f46',
            borderRadius: 8,
            marginBottom: 16,
            fontSize: 13,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span>✓ {successMsg}</span>
          <span style={{ fontSize: 12, opacity: 0.8 }}>Redirecting to View Assigned...</span>
        </div>
      )}
>>>>>>> 70f527ba60f555fe6ad1fa61874f359bd66bf9d7

      {/* Main Single Card Form */}
      <form onSubmit={handleSubmit} className="ax-card">
<<<<<<< HEAD
        <div className="ax-card__header">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
            <div>
              <h2 className="ax-card__title" style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: 'var(--ax-text-strong, #0f172a)' }}>
                {isEditing ? `Edit Jammu RESCO Installation (#${editId})` : 'Assign Jammu RESCO Installation'}
=======
        {/* Header with Section Pills */}
        <div className="ax-card__header">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
            <div>
              <h2 className="ax-card__title" style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: '#0f172a' }}>
                Assign Jammu Resco Installation
>>>>>>> 70f527ba60f555fe6ad1fa61874f359bd66bf9d7
              </h2>
              <p className="ax-card__subtitle" style={{ fontSize: '0.85rem', color: '#ef4444', margin: '4px 0 0' }}>
                The field labels marked with * are required input fields.
              </p>
            </div>
<<<<<<< HEAD
            {initialLoading && (
              <span style={{ fontSize: 12, color: '#2563eb', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <span className="ax-spinner" /> Loading master data...
=======
            {selectedSiteIds.length > 0 && (
              <span className="ax-badge ax-badge--soft ax-badge--info" style={{ fontWeight: 600, padding: '4px 12px', fontSize: 12 }}>
                {selectedSiteIds.length} Site(s) Selected
>>>>>>> 70f527ba60f555fe6ad1fa61874f359bd66bf9d7
              </span>
            )}
          </div>

<<<<<<< HEAD
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
=======
          {/* Quick Nav Pills */}
          <div className="resco-section-pills">
            <button type="button" className="resco-section-pill-btn" onClick={() => scrollTo(sec1)}>
              <span className="pill-num">1</span> Vendor Name &amp; Volume
            </button>
            <button type="button" className="resco-section-pill-btn" onClick={() => scrollTo(sec2)}>
              <span className="pill-num">2</span> District
            </button>
            <button type="button" className="resco-section-pill-btn" onClick={() => scrollTo(sec3)}>
              <span className="pill-num">3</span> Site Name
            </button>
            <button type="button" className="resco-section-pill-btn" onClick={() => scrollTo(sec4)}>
              <span className="pill-num">4</span> File &amp; Remarks
>>>>>>> 70f527ba60f555fe6ad1fa61874f359bd66bf9d7
            </button>
          </div>
        </div>

        <div className="ax-card__body">
<<<<<<< HEAD
          {/* Section 1: Vendor Name * */}
          <div ref={sec1} className="swp-section-block">
            <div className="swp-section-header">
              <div className="swp-section-title-wrap">
                <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>
                  1. Vendor Name <span style={{ color: '#ef4444' }}>*</span>
                </h3>
                <span style={{ fontSize: '12px', color: 'var(--ax-text-muted, #64748b)' }}>
                  Select empaneled vendor for Jammu RESCO installation
=======
          {/* Section 1: Vendor Name * & Volume * */}
          <div ref={sec1} className="resco-section-block">
            <div className="resco-section-header">
              <div className="resco-section-title-wrap">
                <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>1. Vendor &amp; Volume Allocation</h3>
                <span style={{ fontSize: '12px', color: '#64748b' }}>
                  Select authorized EPC vendor partner and allocation volume
>>>>>>> 70f527ba60f555fe6ad1fa61874f359bd66bf9d7
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
<<<<<<< HEAD
                  {vendorList.map((v) => (
                    <option key={v.id} value={String(v.id)}>
=======
                  {JAMMU_RESCO_VENDORS.map((v) => (
                    <option key={v.id} value={v.id}>
>>>>>>> 70f527ba60f555fe6ad1fa61874f359bd66bf9d7
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

<<<<<<< HEAD
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

=======
              {/* Volume * */}
>>>>>>> 70f527ba60f555fe6ad1fa61874f359bd66bf9d7
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
<<<<<<< HEAD
                  {volumeList.map((vol, idx) => {
                    const val = typeof vol === 'object' && vol !== null ? (vol as any).volume : vol;
                    return (
                      <option key={idx} value={String(val)}>
                        Volume {val}
                      </option>
                    );
                  })}
=======
                  {JAMMU_RESCO_VOLUMES.map((vol) => (
                    <option key={vol} value={vol}>
                      Volume {vol}
                    </option>
                  ))}
>>>>>>> 70f527ba60f555fe6ad1fa61874f359bd66bf9d7
                </select>
                <label htmlFor="jammu_resco_volume" className="ax-float__label floating">
                  Volume <span style={{ color: '#ef4444' }}>*</span>
                </label>
              </div>
<<<<<<< HEAD

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
=======
            </div>
          </div>

          <hr className="resco-section-divider" />

          {/* Section 2: District * */}
          <div ref={sec2} className="resco-section-block">
            <div className="resco-section-header">
              <div className="resco-section-title-wrap">
                <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>2. District Allocation</h3>
                <span style={{ fontSize: '12px', color: '#64748b' }}>
                  Choose targeted Jammu &amp; Kashmir district for rooftop solar installation
                </span>
              </div>
            </div>

            <div style={{ maxWidth: '480px' }}>
              <div className="ax-float">
                <select
                  id="district_select"
                  className="ax-float__input"
                  value={district}
                  onChange={(e) => {
                    setDistrict(e.target.value);
                    setSelectedSiteIds([]);
                  }}
                  disabled={submitting}
                  required
                >
                  <option value="">-- Select District --</option>
                  {JAMMU_RESCO_DISTRICTS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
>>>>>>> 70f527ba60f555fe6ad1fa61874f359bd66bf9d7
                </select>
                <label htmlFor="jammu_resco_district" className="ax-float__label floating">
                  District <span style={{ color: '#ef4444' }}>*</span>
                </label>
              </div>
            </div>
          </div>

          <hr className="swp-section-divider" />

          {/* Section 3: Site Name * */}
<<<<<<< HEAD
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
=======
          <div ref={sec3} className="resco-section-block">
            <div className="resco-section-header">
              <div className="resco-section-title-wrap">
                <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>
                  3. Site Name <span style={{ color: '#ef4444' }}>*</span>
                </h3>
                <span style={{ fontSize: '12px', color: '#64748b' }}>
                  Select eligible rooftop institutional or government sites to allocate
>>>>>>> 70f527ba60f555fe6ad1fa61874f359bd66bf9d7
                </span>
              </div>
              {eligibleSites.length > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#2559bf' }}>
                    {selectedSiteIds.length} of {eligibleSites.length} Selected
                  </span>
                  <button
                    type="button"
                    onClick={handleSelectAll}
                    className="ax-btn ax-btn--secondary ax-btn--sm"
                    style={{ fontSize: 11, padding: '3px 10px' }}
                  >
                    {selectedSiteIds.length === eligibleSites.length ? 'Deselect All' : 'Select All'}
                  </button>
                </div>
              )}
            </div>

<<<<<<< HEAD
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
=======
            {/* Quick dropdown for Site Name */}
            <div className="ax-float" style={{ marginBottom: 16, maxWidth: '640px' }}>
              <select
                id="site_quick_dropdown"
                className="ax-float__input"
                value=""
                onChange={(e) => {
                  const val = Number(e.target.value);
                  if (val && !selectedSiteIds.includes(val)) {
                    setSelectedSiteIds((prev) => [...prev, val]);
                  }
                }}
                disabled={submitting || eligibleSites.length === 0}
              >
                <option value="">
                  {eligibleSites.length === 0
                    ? '-- No sites available for selected district --'
                    : '-- Select Site Name --'}
                </option>
                {eligibleSites.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.site_name} ({s.capacity_kw ? `${s.capacity_kw} kW` : ''} • {s.district})
                  </option>
                ))}
              </select>
              <label htmlFor="site_quick_dropdown" className="ax-float__label floating">
                Site Name <span style={{ color: '#ef4444' }}>*</span>
              </label>
            </div>

            {/* Site search & selectable cards */}
            <div style={{ border: '1px solid #e2e8f0', borderRadius: 10, overflow: 'hidden', background: '#ffffff' }}>
              <div style={{ padding: '8px 12px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <input
                  type="text"
                  className="ax-form-input"
                  value={siteSearch}
                  onChange={(e) => setSiteSearch(e.target.value)}
                  placeholder="Filter site name, department, CA number..."
                  style={{ width: '100%', padding: '6px 12px', fontSize: 12, borderRadius: 6, border: '1px solid #cbd5e1' }}
                />
              </div>

              <div style={{ maxHeight: 260, overflowY: 'auto', padding: 10 }}>
                {eligibleSites.length === 0 ? (
                  <div style={{ padding: 20, textAlign: 'center', color: '#64748b', fontSize: 13 }}>
                    No rooftop sites found matching your filter.
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 10 }}>
                    {eligibleSites.map((s) => {
                      const isSelected = selectedSiteIds.includes(s.id);
                      return (
                        <div
                          key={s.id}
                          onClick={() => handleToggleSite(s.id)}
                          style={{
                            padding: '8px 12px',
                            borderRadius: 8,
                            border: `1.5px solid ${isSelected ? '#2559bf' : '#e2e8f0'}`,
                            background: isSelected ? '#eff6ff' : '#ffffff',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 10,
                            fontSize: 12,
                            transition: 'all 0.15s ease',
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleSite(s.id)}
                            onClick={(e) => e.stopPropagation()}
                          />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: 700, color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {s.site_name}
                            </div>
                            <div style={{ fontSize: 11, color: '#64748b' }}>
                              {s.capacity_kw ? `${s.capacity_kw} kW • ` : ''}
                              {s.district} • {s.department || 'Govt Building'}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          <hr className="resco-section-divider" />

          {/* Section 4: File & Remarks */}
          <div ref={sec4} className="resco-section-block">
            <div className="resco-section-header">
              <div className="resco-section-title-wrap">
                <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>4. Work Order PO File &amp; Remarks</h3>
                <span style={{ fontSize: '12px', color: '#64748b' }}>
                  Attach formal sanction/PO document and optional vendor instructions
                </span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: 20 }}>
              {/* Remarks */}
              <div>
                <FloatingInput
                  label="Remarks"
                  name="remarks"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  disabled={submitting}
                  placeholder="Enter assignment remarks, priority instructions..."
                />
              </div>
>>>>>>> 70f527ba60f555fe6ad1fa61874f359bd66bf9d7
            </div>

            {/* File Dropzone */}
            <div style={{ maxWidth: 540 }}>
              <UploadDropzone
                id="assign_file"
                label="File"
                file={file}
                onSelect={setFile}
                onRemove={() => setFile(null)}
                disabled={submitting}
              />
            </div>
          </div>

<<<<<<< HEAD
          <div style={{ marginTop: 32, paddingTop: 20, borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
=======
          {/* Submit Footer */}
          <div style={{ marginTop: '32px', paddingTop: '20px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '12px' }}>
>>>>>>> 70f527ba60f555fe6ad1fa61874f359bd66bf9d7
            <Link to="/vendor-management/jammu/installation/resco/view-assign-installation" className="ax-btn ax-btn--secondary">
              Cancel
            </Link>
            <button
              type="submit"
              className="ax-btn ax-btn--primary"
<<<<<<< HEAD
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
=======
              disabled={submitting || selectedSiteIds.length === 0}
              style={{ minWidth: 180, fontWeight: 700 }}
            >
              {submitting ? (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                  <span className="ax-spinner" /> Assigning...
                </span>
              ) : (
                'Assign Jammu Resco Installation'
>>>>>>> 70f527ba60f555fe6ad1fa61874f359bd66bf9d7
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

export default AssignRescoInstallation;
