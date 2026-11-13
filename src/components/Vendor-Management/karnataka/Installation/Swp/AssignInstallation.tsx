import { useState, useEffect, useRef, useMemo, type FormEvent, type ChangeEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { PageHead } from '../../../../shell/PageHead';
import {
  karnatakaAdminService,
  resolveKarnatakaMediaUrl,
  type VendorItem,
  type VolumeItem,
  type DistrictItem,
  type ApplicantItem,
} from '../../karnataka-services';

// Unified Single-Card Layout with Floating Labels & Section Dividers (matching Assam SWP reference)
const SINGLE_CARD_FORM_CSS = `
.swp-inst-form .ax-card {
  border: 1px solid var(--ax-border, #e2e8f0);
  border-radius: var(--ax-radius-xl, 16px);
  background: var(--ax-surface-solid, #ffffff);
  box-shadow: var(--ax-shadow-sm, 0 1px 2px 0 rgba(0, 0, 0, 0.05));
  overflow: hidden;
}
.swp-inst-form .ax-card__header {
  padding: var(--ax-space-5, 20px) var(--ax-space-6, 24px);
  border-bottom: 1px solid var(--ax-border-subtle, #e2e8f0);
  background: var(--ax-surface-subtle, #f8fafc);
  display: flex;
  flex-direction: column;
  gap: var(--ax-space-4, 16px);
}
.swp-inst-form .ax-card__body { padding: var(--ax-space-6, 24px); }

/* Quick Section Nav Pills */
.swp-section-pills {
  display: flex;
  gap: var(--ax-space-2, 8px);
  overflow-x: auto;
  padding-bottom: 4px;
  scrollbar-width: thin;
}
.swp-section-pill-btn {
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
  transition: all var(--ax-motion-fast, 0.15s) var(--ax-ease-standard, ease);
}
.swp-section-pill-btn:hover {
  border-color: #2563eb;
  color: #2563eb;
  background: color-mix(in srgb, #2563eb 6%, var(--ax-surface-solid, #ffffff));
}
.swp-section-pill-btn .pill-num {
  width: 18px; height: 18px; border-radius: 50%;
  background: var(--ax-surface-subtle, #f1f5f9);
  display: inline-flex; align-items: center; justify-content: center;
  font-size: 10px; font-weight: 700;
}

/* Section Block */
.swp-section-block { padding-top: var(--ax-space-2, 8px); }
.swp-section-header {
  display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap;
  gap: var(--ax-space-2, 8px);
  margin-bottom: var(--ax-space-5, 20px);
  padding-bottom: var(--ax-space-3, 12px);
  border-bottom: 1px solid var(--ax-border-subtle, #e2e8f0);
}
.swp-section-title-wrap { display: flex; flex-direction: column; gap: 4px; }
.swp-section-divider {
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
  font-size: var(--ax-text-sm, 14px);
  background: var(--ax-surface-solid, #ffffff);
  border: 1px solid var(--ax-border, #cbd5e1);
  border-radius: var(--ax-radius-md, 8px);
  color: var(--ax-text, #0f172a);
  outline: none;
  transition: border-color var(--ax-motion-fast, 0.15s) var(--ax-ease-standard, ease),
              box-shadow var(--ax-motion-fast, 0.15s) var(--ax-ease-standard, ease);
}
.ax-float__input::placeholder { color: transparent; }
.ax-float__input:focus {
  border-color: #2563eb;
  box-shadow: 0 0 0 3px color-mix(in srgb, #2563eb 20%, transparent);
}
.ax-float__input:disabled { opacity: .7; cursor: not-allowed; background: var(--ax-surface-subtle, #f8fafc); }

.ax-float__label {
  position: absolute;
  inset-inline-start: 12px;
  top: 50%;
  transform: translateY(-50%);
  margin: 0;
  padding: 0 4px;
  font-size: var(--ax-text-sm, 14px);
  color: var(--ax-text-subtle, #64748b);
  background: var(--ax-surface-solid, #ffffff);
  border-radius: var(--ax-radius-xs, 4px);
  pointer-events: none;
  transition: top var(--ax-motion-fast, 0.15s) var(--ax-ease-standard, ease),
              font-size var(--ax-motion-fast, 0.15s) var(--ax-ease-standard, ease),
              color var(--ax-motion-fast, 0.15s) var(--ax-ease-standard, ease);
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
  color: #2563eb;
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
  onChange: (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
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
        {label} {required && <span style={{ color: 'var(--ax-danger, #ef4444)' }}>*</span>}
      </label>
    </div>
  );
}

/* ───────── Modern Upload Dropzone (matching Assam reference) ───────── */
interface UploadDropzoneProps {
  id: string;
  label: string;
  required?: boolean;
  disabled?: boolean;
  accept?: string;
  file: File | null;
  preview?: string;
  onSelect: (file: File) => void;
  onRemove: () => void;
  error?: string;
}

function UploadDropzone({
  id,
  label,
  required,
  disabled,
  accept = '.pdf,.jpg,.jpeg,.png',
  file,
  preview,
  onSelect,
  onRemove,
  error,
}: UploadDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (disabled) return;
    onRemove();
    if (inputRef.current) inputRef.current.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (disabled) return;
    setIsDragging(false);
    const chosen = e.dataTransfer.files?.[0];
    if (chosen) {
      onSelect(chosen);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label
        htmlFor={id}
        style={{
          fontSize: '12.5px',
          fontWeight: 600,
          color: error ? 'var(--ax-danger-500, #ef4444)' : 'var(--ax-text-strong, #334155)',
          display: 'flex',
          alignItems: 'center',
          gap: 4,
        }}
      >
        <span>{label}</span>
        {required && <span style={{ color: 'var(--ax-danger-500, #ef4444)' }}>*</span>}
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
        onDrop={handleDrop}
        onMouseEnter={() => {
          if (!disabled) setIsHovered(true);
        }}
        onMouseLeave={() => setIsHovered(false)}
        role="button"
        tabIndex={disabled ? -1 : 0}
        onKeyDown={(e) => {
          if (disabled) return;
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        style={{
          border: disabled
            ? '1.5px dashed #cbd5e1'
            : isDragging
            ? '1.5px dashed #2563eb'
            : error
            ? '1.5px dashed var(--ax-danger-500, #ef4444)'
            : isHovered
            ? '1.5px dashed #94a3b8'
            : '1.5px dashed #cbd5e1',
          borderRadius: 8,
          background: disabled
            ? 'var(--ax-surface-subtle, #f8fafc)'
            : isDragging
            ? '#eff6ff'
            : error
            ? '#fef2f2'
            : isHovered
            ? '#fbfcfd'
            : '#ffffff',
          opacity: disabled ? 0.75 : 1,
          padding: file || preview ? '12px 14px' : '22px 16px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          cursor: disabled ? 'not-allowed' : 'pointer',
          transition: 'all 0.2s ease',
          minHeight: 110,
        }}
      >
        {file || preview ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, textAlign: 'left' }}>
              {preview ? (
                <img
                  src={preview}
                  alt={label}
                  style={{ width: 44, height: 44, objectFit: 'cover', borderRadius: 6, border: '1px solid var(--ax-border, #cbd5e1)' }}
                />
              ) : (
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
                    flexShrink: 0,
                  }}
                >
                  <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                </div>
              )}
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ax-text-strong, #1e293b)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {file ? file.name : label}
                </div>
                <div style={{ fontSize: 11, color: 'var(--ax-text-muted, #64748b)', marginTop: 2 }}>
                  {file ? `${(file.size / 1024).toFixed(0)} KB · Ready to upload` : 'File selected'}
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
              PDF, JPG, JPEG or PNG (Max 5 MB) — single file
            </div>
          </>
        )}
      </div>

      {error && (
        <span style={{ fontSize: 11, color: 'var(--ax-danger-500, #ef4444)', marginTop: 2 }}>
          {error}
        </span>
      )}
    </div>
  );
}

export function AssignInstallation() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('edit') || searchParams.get('id');
  const isEditMode = Boolean(editId);

  // Master datasets
  const [vendors, setVendors] = useState<VendorItem[]>([]);
  const [volumes, setVolumes] = useState<VolumeItem[]>([]);
  const [districts, setDistricts] = useState<DistrictItem[]>([]);
  const [applicants, setApplicants] = useState<ApplicantItem[]>([]);

  // Form values
  const [selectedVendor, setSelectedVendor] = useState<string>('');
  const [selectedVolume, setSelectedVolume] = useState<string>('');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('');
  const [selectedApplicantIds, setSelectedApplicantIds] = useState<number[]>([]);
  const [deadlineDate, setDeadlineDate] = useState<string>('');
  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | undefined>(undefined);
  const [existingFileUrl, setExistingFileUrl] = useState<string>('');
  const [remarks, setRemarks] = useState<string>('');

  // Status & Lock
  const [isAcceptedLocked, setIsAcceptedLocked] = useState<boolean>(false);
  const [recordStatus, setRecordStatus] = useState<number | null>(null);
  const initialLoadedRef = useRef<{ volume?: string; district?: string }>({});

  // Loading Status
  const [initialLoading, setInitialLoading] = useState<boolean>(true);
  const [districtsLoading, setDistrictsLoading] = useState<boolean>(false);
  const [applicantsLoading, setApplicantsLoading] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');

  const [applicantFilterQuery, setApplicantFilterQuery] = useState<string>('');

  // Section refs for navigation pills
  const sec1 = useRef<HTMLDivElement>(null);
  const sec2 = useRef<HTMLDivElement>(null);
  const sec3 = useRef<HTMLDivElement>(null);
  const sec4 = useRef<HTMLDivElement>(null);

  const scrollTo = (ref: React.RefObject<HTMLDivElement | null>) => {
    ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // 1. Initial Load: Vendors & Volumes or Existing Assignment
  useEffect(() => {
    let active = true;
    const loadInit = async () => {
      setInitialLoading(true);
      setErrorMsg('');
      try {
        if (isEditMode && editId) {
          const editData = await karnatakaAdminService.getEditAssign(editId);
          if (!active) return;
          const { assign, vendors: vList, volumes: volList, districts: dList, applicant_names: aList } = editData;
          setVendors(Array.isArray(vList) ? vList : []);
          setVolumes(Array.isArray(volList) ? volList : []);
          setDistricts(Array.isArray(dList) ? dList : []);
          setApplicants(Array.isArray(aList) ? aList : []);

          if (assign) {
            const vol = assign.volume ? String(assign.volume) : '';
            const dist = assign.district ? String(assign.district) : '';
            initialLoadedRef.current = { volume: vol, district: dist };

            setSelectedVendor(assign.vendor ? String(assign.vendor) : (assign.vendor_id ? String(assign.vendor_id) : ''));
            setSelectedVolume(vol);
            setSelectedDistrict(dist);
            setDeadlineDate(assign.deadline_date ? assign.deadline_date.split(' ')[0] : '');
            setRemarks(assign.remarks || '');
            if (assign.file) {
              setExistingFileUrl(resolveKarnatakaMediaUrl(assign.file));
            }

            let parsedSites: number[] = [];
            if (Array.isArray(assign.site_id)) {
              parsedSites = assign.site_id.map((s: any) => Number(s)).filter((n: number) => !isNaN(n));
            } else if (typeof assign.site_id === 'string' && assign.site_id.trim()) {
              try {
                const rawParsed = JSON.parse(assign.site_id);
                if (Array.isArray(rawParsed)) {
                  parsedSites = rawParsed.map((s: any) => Number(s)).filter((n: number) => !isNaN(n));
                }
              } catch {
                parsedSites = assign.site_id.split(',').map((s) => Number(s.trim())).filter((n) => !isNaN(n));
              }
            }
            setSelectedApplicantIds(parsedSites);

            const st = Number(assign.status);
            setRecordStatus(st);
            if (st === 2) {
              setIsAcceptedLocked(true);
            }
          }
        } else {
          const data = await karnatakaAdminService.getAssignFormData();
          if (!active) return;
          setVendors(Array.isArray(data?.vendors) ? data.vendors : []);
          setVolumes(Array.isArray(data?.volumes) ? data.volumes : []);
        }
      } catch (err: any) {
        if (!active) return;
        console.error('Initial load error:', err);
        setErrorMsg(err?.message || (isEditMode ? 'Failed to fetch assignment details.' : 'Failed to fetch vendors and volumes.'));
      } finally {
        if (active) setInitialLoading(false);
      }
    };
    loadInit();
    return () => {
      active = false;
    };
  }, [editId, isEditMode]);

  // 2. Volume Change -> Fetch Districts
  useEffect(() => {
    if (!selectedVolume) {
      setDistricts([]);
      setSelectedDistrict('');
      setApplicants([]);
      setSelectedApplicantIds([]);
      return;
    }

    if (isEditMode && initialLoadedRef.current.volume === selectedVolume) {
      return;
    }

    let active = true;
    const loadDistricts = async () => {
      setDistrictsLoading(true);
      setErrorMsg('');
      try {
        const dList = await karnatakaAdminService.fetchDistricts(selectedVolume);
        if (!active) return;
        setDistricts(Array.isArray(dList) ? dList : []);
        setSelectedDistrict('');
        setApplicants([]);
        setSelectedApplicantIds([]);
      } catch (err: any) {
        if (!active) return;
        console.error('Districts fetch error:', err);
        setErrorMsg(err?.message || 'Failed to fetch districts.');
      } finally {
        if (active) setDistrictsLoading(false);
      }
    };
    loadDistricts();
    return () => {
      active = false;
    };
  }, [selectedVolume, isEditMode]);

  // 3. District Change -> Fetch Applicants
  useEffect(() => {
    if (!selectedDistrict || !selectedVolume) {
      setApplicants([]);
      setSelectedApplicantIds([]);
      return;
    }

    if (isEditMode && initialLoadedRef.current.district === selectedDistrict && initialLoadedRef.current.volume === selectedVolume) {
      return;
    }

    let active = true;
    const loadApplicants = async () => {
      setApplicantsLoading(true);
      setErrorMsg('');
      try {
        const aList = await karnatakaAdminService.fetchApplicants(selectedDistrict, selectedVolume);
        if (!active) return;
        setApplicants(Array.isArray(aList) ? aList : []);
        setSelectedApplicantIds([]);
      } catch (err: any) {
        if (!active) return;
        console.error('Applicants fetch error:', err);
        setErrorMsg(err?.message || 'Failed to fetch applicants.');
      } finally {
        if (active) setApplicantsLoading(false);
      }
    };
    loadApplicants();
    return () => {
      active = false;
    };
  }, [selectedDistrict, selectedVolume, isEditMode]);

  const handleToggleApplicant = (id: number) => {
    if (isAcceptedLocked) return;
    setSelectedApplicantIds((prev) => (prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]));
  };

  const handleSelectAll = () => {
    if (isAcceptedLocked) return;
    if (selectedApplicantIds.length === applicants.length) {
      setSelectedApplicantIds([]);
    } else {
      setSelectedApplicantIds(applicants.map((a) => a.id));
    }
  };

  const filteredApplicants = useMemo(() => {
    const q = applicantFilterQuery.trim().toLowerCase();
    if (!q) return applicants;
    return applicants.filter((a) => {
      const name = a.f_farmer_name || a.farmer_name || '';
      const father = a.f_father_name || a.father_name || '';
      const appNo = a.application_no || '';
      const village = a.village || '';
      const block = a.block || a.tehsil || '';
      return (
        String(a.id).includes(q) ||
        name.toLowerCase().includes(q) ||
        father.toLowerCase().includes(q) ||
        appNo.toLowerCase().includes(q) ||
        village.toLowerCase().includes(q) ||
        block.toLowerCase().includes(q)
      );
    });
  }, [applicants, applicantFilterQuery]);

  // Submit Handler
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (isAcceptedLocked) {
      setErrorMsg('This assignment has been accepted by the vendor (Status: Accepted) and cannot be modified.');
      return;
    }

    if (!selectedVendor) return setErrorMsg('Vendor Name is required.');
    if (!selectedVolume) return setErrorMsg('Volume is required.');
    if (!selectedDistrict) return setErrorMsg('District is required.');
    if (selectedApplicantIds.length === 0) return setErrorMsg('Please select at least one applicant site.');
    if (!deadlineDate) return setErrorMsg('Deadline Date is required.');

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('vendor', selectedVendor);
      formData.append('volume', selectedVolume);
      formData.append('district', selectedDistrict);
      selectedApplicantIds.forEach((siteId) => {
        formData.append('applicant_name[]', String(siteId));
        formData.append('site[]', String(siteId));
      });
      formData.append('deadline_date', deadlineDate);
      if (file) {
        formData.append('file', file);
      }
      if (remarks.trim()) {
        formData.append('remarks', remarks.trim());
      }

      let res;
      if (isEditMode && editId) {
        res = await karnatakaAdminService.updateAssign(editId, formData);
        setSuccessMsg(res.message || 'Assigned Installation Updated Successfully!');
      } else {
        res = await karnatakaAdminService.storeAssign(formData);
        setSuccessMsg(res.message || 'Installation Assigned Successfully!');
      }

      setTimeout(() => {
        navigate('/vendor-management/karnataka/swp/view-assign-installation');
      }, 1500);
    } catch (err: any) {
      console.error('Submit assign error:', err);
      setErrorMsg(err?.message || (isEditMode ? 'Failed to update assignment.' : 'Failed to assign installation.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="ax-page swp-inst-form">
      <style>{SINGLE_CARD_FORM_CSS}</style>

      {/* Page Head */}
      <PageHead
        title={isEditMode ? 'Edit Karnataka SWP Assigned Installation' : 'Assign Karnataka SWP Installation'}
        subtitle={
          isAcceptedLocked
            ? 'This assignment has been accepted by the vendor (Status 2: Accepted) and is locked for editing.'
            : 'The field labels marked with * are required input fields.'
        }
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Vendor Management', href: '/vendor-management' },
          { label: 'Karnataka SWP', href: '/vendor-management/karnataka/swp/dashboard' },
          { label: isEditMode ? 'Edit Assigned Installation' : 'Assign Karnataka SWP Installation' },
        ]}
        actions={
          <Link
            to="/vendor-management/karnataka/swp/view-assign-installation"
            className="ax-btn ax-btn--secondary ax-btn--sm"
          >
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
            View Assigned Installations
          </Link>
        }
      />

      {/* Accepted Locked Warning Banner */}
      {isAcceptedLocked && (
        <div
          style={{
            padding: '14px 18px',
            background: '#eff6ff',
            border: '1px solid #bfdbfe',
            borderRadius: 10,
            marginBottom: 16,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            color: '#1e40af',
            fontSize: 13,
          }}
        >
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ flexShrink: 0, color: '#2563eb' }}
          >
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          <div>
            <div style={{ fontWeight: 700, fontSize: 14, color: '#1d4ed8', marginBottom: 2 }}>
              Assignment Locked (Status: Accepted)
            </div>
            <div>
              This work order has already been accepted by the vendor (Status 2: Accepted). All fields are permanently locked for editing.
            </div>
          </div>
        </div>
      )}

      {/* Status Banners */}
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
          <span style={{ fontSize: 12, opacity: 0.8 }}>Redirecting...</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="ax-card">
        {/* Header with Section Pills */}
        <div className="ax-card__header">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
            <div>
              <h2 className="ax-card__title" style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: 'var(--ax-text-strong, #0f172a)' }}>
                {isEditMode ? `Edit Assigned Installation #${editId}` : 'Assign Karnataka SWP Installation'}
              </h2>
              <p className="ax-card__subtitle" style={{ fontSize: '0.85rem', color: isAcceptedLocked ? '#2563eb' : '#ef4444', margin: '4px 0 0' }}>
                {isAcceptedLocked
                  ? 'Locked: Vendor has accepted this assignment.'
                  : 'The field labels marked with * are required input fields.'}
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {isEditMode && recordStatus !== null && (
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '4px 10px',
                    borderRadius: 9999,
                    fontSize: 12,
                    fontWeight: 600,
                    background: recordStatus === 2 ? '#eff6ff' : recordStatus === 1 ? '#ecfdf5' : '#fffbeb',
                    color: recordStatus === 2 ? '#1d4ed8' : recordStatus === 1 ? '#047857' : '#b45309',
                    border: `1px solid ${recordStatus === 2 ? '#bfdbfe' : recordStatus === 1 ? '#a7f3d0' : '#fde68a'}`,
                  }}
                >
                  <span
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      background: recordStatus === 2 ? '#2563eb' : recordStatus === 1 ? '#10b981' : '#f59e0b',
                    }}
                  />
                  Status: {recordStatus === 2 ? 'Accepted' : recordStatus === 1 ? 'Approved' : 'Pending'}
                </span>
              )}
              {selectedApplicantIds.length > 0 && (
                <span className="ax-badge ax-badge--soft ax-badge--info" style={{ fontWeight: 600, padding: '4px 12px', fontSize: 12 }}>
                  {selectedApplicantIds.length} Site(s) Selected
                </span>
              )}
            </div>
          </div>

          {/* Quick Nav Pills */}
          <div className="swp-section-pills">
            <button type="button" className="swp-section-pill-btn" onClick={() => scrollTo(sec1)}>
              <span className="pill-num">1</span> Vendor & Volume
            </button>
            <button type="button" className="swp-section-pill-btn" onClick={() => scrollTo(sec2)}>
              <span className="pill-num">2</span> District
            </button>
            <button type="button" className="swp-section-pill-btn" onClick={() => scrollTo(sec3)}>
              <span className="pill-num">3</span> Applicant Name
            </button>
            <button type="button" className="swp-section-pill-btn" onClick={() => scrollTo(sec4)}>
              <span className="pill-num">4</span> Timeline & Work Order
            </button>
          </div>
        </div>

        <div className="ax-card__body">
          {/* Section 1: Vendor Name & Volume */}
          <div ref={sec1} className="swp-section-block">
            <div className="swp-section-header">
              <div className="swp-section-title-wrap">
                <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>1. Vendor & Volume Allocation</h3>
                <span style={{ fontSize: '12px', color: 'var(--ax-text-muted, #64748b)' }}>
                  Select authorized partner vendor and project volume
                </span>
              </div>
            </div>

            <div className="ax-form-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
              {/* Vendor Name * */}
              <div className="ax-float">
                <select
                  id="vendor_select"
                  className="ax-float__input"
                  value={selectedVendor}
                  onChange={(e) => setSelectedVendor(e.target.value)}
                  disabled={initialLoading || submitting || isAcceptedLocked}
                  required
                >
                  <option value="">-- Select Vendor --</option>
                  {vendors.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name}
                    </option>
                  ))}
                </select>
                <label htmlFor="vendor_select" className="ax-float__label floating">
                  Vendor Name <span style={{ color: '#ef4444' }}>*</span>
                </label>
              </div>

              {/* Volume * */}
              <div className="ax-float">
                <select
                  id="volume_select"
                  className="ax-float__input"
                  value={selectedVolume}
                  onChange={(e) => setSelectedVolume(e.target.value)}
                  disabled={initialLoading || submitting || isAcceptedLocked}
                  required
                >
                  <option value="">-- Select Volume --</option>
                  {volumes.map((vol, idx) => (
                    <option key={idx} value={vol.volume}>
                      {vol.volume}
                    </option>
                  ))}
                </select>
                <label htmlFor="volume_select" className="ax-float__label floating">
                  Volume <span style={{ color: '#ef4444' }}>*</span>
                </label>
              </div>
            </div>
          </div>

          <hr className="swp-section-divider" />

          {/* Section 2: District */}
          <div ref={sec2} className="swp-section-block">
            <div className="swp-section-header">
              <div className="swp-section-title-wrap">
                <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>2. District</h3>
                <span style={{ fontSize: '12px', color: 'var(--ax-text-muted, #64748b)' }}>
                  Select district from the volumes allocated
                </span>
              </div>
            </div>

            <div style={{ maxWidth: '480px' }}>
              {/* District * */}
              <div className="ax-float">
                <select
                  id="district_select"
                  className="ax-float__input"
                  value={selectedDistrict}
                  onChange={(e) => setSelectedDistrict(e.target.value)}
                  disabled={!selectedVolume || districtsLoading || submitting || isAcceptedLocked}
                  required
                >
                  <option value="">
                    {districtsLoading
                      ? 'Loading Districts...'
                      : !selectedVolume
                      ? '-- Select Volume First --'
                      : '-- Select District --'}
                  </option>
                  {districts.map((d, idx) => (
                    <option key={idx} value={d.district}>
                      {d.district}
                    </option>
                  ))}
                </select>
                <label htmlFor="district_select" className="ax-float__label floating">
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
                  Choose eligible unassigned solar water pump sites for installation
                </span>
              </div>
              {applicants.length > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#2563eb' }}>
                    {selectedApplicantIds.length} of {applicants.length} Selected
                  </span>
                  <button
                    type="button"
                    onClick={handleSelectAll}
                    disabled={isAcceptedLocked}
                    className="ax-btn ax-btn--secondary ax-btn--sm"
                    style={{ fontSize: 11, padding: '3px 10px', opacity: isAcceptedLocked ? 0.6 : 1 }}
                  >
                    {selectedApplicantIds.length === applicants.length ? 'Deselect All' : 'Select All'}
                  </button>
                </div>
              )}
            </div>

            {/* Quick dropdown for Applicant Name */}
            <div className="ax-float" style={{ marginBottom: 16, maxWidth: '640px' }}>
              <select
                id="applicant_dropdown"
                className="ax-float__input"
                value=""
                onChange={(e) => {
                  const val = Number(e.target.value);
                  if (val && !selectedApplicantIds.includes(val)) {
                    setSelectedApplicantIds((prev) => [...prev, val]);
                  }
                }}
                disabled={!selectedDistrict || applicantsLoading || applicants.length === 0 || submitting || isAcceptedLocked}
              >
                <option value="">
                  {!selectedDistrict
                    ? '-- Select District First --'
                    : applicantsLoading
                    ? 'Loading Applicants...'
                    : applicants.length === 0
                    ? 'No applicant available'
                    : '-- Select Applicant Name --'}
                </option>
                {applicants.map((a) => {
                  const name = a.f_farmer_name || a.farmer_name || `Applicant #${a.id}`;
                  const father = a.f_father_name || a.father_name;
                  const loc = [a.block || a.tehsil, a.village].filter(Boolean).join(', ');
                  return (
                    <option key={a.id} value={a.id}>
                      #{a.id} — {name} {father ? `(S/o ${father})` : ''} {loc ? `— ${loc}` : ''}
                    </option>
                  );
                })}
              </select>
              <label htmlFor="applicant_dropdown" className="ax-float__label floating">
                Applicant Name <span style={{ color: '#ef4444' }}>*</span>
              </label>
            </div>

            {!selectedDistrict ? (
              <div
                style={{
                  padding: '24px',
                  background: 'var(--ax-surface-subtle, #f8fafc)',
                  border: '1.5px dashed var(--ax-border, #cbd5e1)',
                  borderRadius: 10,
                  color: 'var(--ax-text-muted, #64748b)',
                  fontSize: 13,
                  textAlign: 'center',
                }}
              >
                -- Select District to Load Applicants --
              </div>
            ) : applicantsLoading ? (
              <div style={{ padding: '28px', textAlign: 'center', color: '#2563eb', fontSize: 13 }}>
                <span className="ax-spinner" style={{ marginRight: 8 }} />
                Fetching applicants for district &ldquo;{selectedDistrict}&rdquo;...
              </div>
            ) : applicants.length === 0 ? (
              <div
                style={{
                  padding: '16px',
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  borderRadius: 8,
                  color: '#b91c1c',
                  fontSize: 13,
                  textAlign: 'center',
                }}
              >
                No applicant available
              </div>
            ) : (
              <div style={{ border: '1px solid var(--ax-border, #e2e8f0)', borderRadius: 10, overflow: 'hidden', background: 'var(--ax-surface-solid, #ffffff)' }}>
                <div style={{ padding: '8px 12px', background: 'var(--ax-surface-subtle, #f8fafc)', borderBottom: '1px solid var(--ax-border, #e2e8f0)' }}>
                  <input
                    type="text"
                    className="ax-form-input"
                    value={applicantFilterQuery}
                    onChange={(e) => setApplicantFilterQuery(e.target.value)}
                    placeholder="Search applicant name, father name, village, application no, ID..."
                    disabled={isAcceptedLocked}
                    style={{ width: '100%', padding: '6px 12px', fontSize: 12, borderRadius: 6 }}
                  />
                </div>

                <div style={{ maxHeight: 260, overflowY: 'auto', padding: 10 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 10 }}>
                    {filteredApplicants.map((a) => {
                      const isSelected = selectedApplicantIds.includes(a.id);
                      const name = a.f_farmer_name || a.farmer_name || `Applicant #${a.id}`;
                      const father = a.f_father_name || a.father_name;
                      const appNo = a.application_no || `KA-${a.id}`;
                      const loc = [a.block || a.tehsil, a.village].filter(Boolean).join(', ') || selectedDistrict;

                      return (
                        <div
                          key={a.id}
                          onClick={() => handleToggleApplicant(a.id)}
                          style={{
                            padding: '8px 12px',
                            borderRadius: 8,
                            border: `1.5px solid ${isSelected ? '#3b82f6' : 'var(--ax-border, #e2e8f0)'}`,
                            background: isSelected ? '#eff6ff' : 'var(--ax-surface-solid, #ffffff)',
                            cursor: isAcceptedLocked ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 10,
                            fontSize: 12,
                            opacity: isAcceptedLocked ? 0.8 : 1,
                            transition: 'all 0.15s ease',
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            disabled={isAcceptedLocked}
                            onChange={() => handleToggleApplicant(a.id)}
                            onClick={(e) => e.stopPropagation()}
                          />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: 700, color: 'var(--ax-text-strong, #1e293b)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              #{a.id} — {name}
                            </div>
                            <div style={{ fontSize: 11, color: 'var(--ax-text-muted, #64748b)' }}>
                              {father ? `S/o ${father} • ` : ''}
                              App No: {appNo} • {loc}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>

          <hr className="swp-section-divider" />

          {/* Section 4: Timeline & Work Order */}
          <div ref={sec4} className="swp-section-block">
            <div className="swp-section-header">
              <div className="swp-section-title-wrap">
                <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>4. Timeline & Work Order</h3>
                <span style={{ fontSize: '12px', color: 'var(--ax-text-muted, #64748b)' }}>
                  Set completion deadline, attach PO document, and add vendor instructions
                </span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: 20 }}>
              {/* Deadline Date * */}
              <div>
                <FloatingInput
                  label="Deadline Date"
                  name="deadline_date"
                  type="date"
                  value={deadlineDate}
                  onChange={(e) => setDeadlineDate(e.target.value)}
                  disabled={isAcceptedLocked || submitting}
                  required
                />
              </div>

              {/* Remarks */}
              <div>
                <FloatingInput
                  label="Remarks"
                  name="remarks"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  disabled={isAcceptedLocked || submitting}
                  placeholder="Optional assignment remarks"
                />
              </div>
            </div>

            {/* Existing File Link */}
            {existingFileUrl && (
              <div style={{ marginBottom: 14, fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ color: 'var(--ax-text-muted, #64748b)' }}>Currently Attached PO Document:</span>
                <a
                  href={existingFileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: '#2563eb', fontWeight: 600, textDecoration: 'underline' }}
                >
                  View Attached File ↗
                </a>
              </div>
            )}

            {/* File Dropzone */}
            <div style={{ maxWidth: 540 }}>
              <UploadDropzone
                id="assign_file"
                label="File"
                accept=".pdf,.jpg,.jpeg,.png"
                disabled={isAcceptedLocked || submitting}
                file={file}
                preview={filePreview}
                onSelect={(selected) => {
                  setFile(selected);
                  if (selected && selected.type.startsWith('image/')) {
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

          {/* Submit Footer */}
          <div style={{ marginTop: '32px', paddingTop: '20px', borderTop: '1px solid var(--ax-border, #e2e8f0)', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '12px' }}>
            <Link to="/vendor-management/karnataka/swp/view-assign-installation" className="ax-btn ax-btn--secondary">
              Cancel
            </Link>
            <button
              type="submit"
              className="ax-btn ax-btn--primary"
              disabled={submitting || selectedApplicantIds.length === 0 || isAcceptedLocked}
              style={{
                minWidth: 180,
                fontWeight: 700,
                ...(isAcceptedLocked ? { background: '#94a3b8', borderColor: '#94a3b8', cursor: 'not-allowed' } : {}),
              }}
            >
              {isAcceptedLocked ? (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                  Assignment Locked
                </span>
              ) : submitting ? (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                  <span className="ax-spinner" /> {isEditMode ? 'Updating...' : 'Assigning...'}
                </span>
              ) : isEditMode ? (
                'Update Assigned Installation'
              ) : (
                'Assign Karnataka SWP Installation'
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

export default AssignInstallation;
