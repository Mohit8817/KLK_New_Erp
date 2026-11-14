import { useState, useEffect, useRef, type FormEvent, type ChangeEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { PageHead } from '../../../shell/PageHead';
import { biharAdminService } from '../bihar-services/biharAdminService';

// Unified Single-Card Layout with Floating Labels & Section Dividers (matching Karnataka SWP Reference)
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

/* ───────── Modern Upload Dropzone (matching Karnataka SWP reference) ───────── */
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

interface DropdownItem {
  id: string | number;
  name: string;
}

export function BiharSSLAMCAssignSSL() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('edit') || searchParams.get('id');
  const isEditMode = Boolean(editId);

  // Form State
  const [stateName, setStateName] = useState('Bihar');
  const [vendor, setVendor] = useState('');
  const [district, setDistrict] = useState('');
  const [block, setBlock] = useState('');
  const [panchayat, setPanchayat] = useState('');
  const [ward, setWard] = useState('');
  const [deadlineDate, setDeadlineDate] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | undefined>(undefined);
  const [existingFileUrl, setExistingFileUrl] = useState<string>('');
  const [remarks, setRemarks] = useState('');

  // Status & Lock
  const [isAcceptedLocked, setIsAcceptedLocked] = useState<boolean>(false);
  const [recordStatus, setRecordStatus] = useState<number | null>(null);

  // Dropdown Lists
  const [vendorList, setVendorList] = useState<DropdownItem[]>([
    { id: '1', name: 'ETS Networks Pvt Ltd' },
    { id: '2', name: 'Shakti Solar Solutions' },
    { id: '3', name: 'Tata Power Solar Systems' },
    { id: '4', name: 'Bihar Energy Infra Ltd' },
  ]);

  const [districtList, setDistrictList] = useState<string[]>([
    'Patna',
    'Gaya',
    'Nalanda',
    'Muzaffarpur',
    'Bhagalpur',
    'Rohtas',
    'Vaishali',
  ]);
  const [blockList, setBlockList] = useState<string[]>([]);
  const [panchayatList, setPanchayatList] = useState<string[]>([]);
  const [wardList, setWardList] = useState<string[]>([]);

  // Loading states
  const [districtsLoading, setDistrictsLoading] = useState(false);
  const [blocksLoading, setBlocksLoading] = useState(false);
  const [panchayatsLoading, setPanchayatsLoading] = useState(false);
  const [wardsLoading, setWardsLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');

  // Section refs for navigation pills
  const sec1 = useRef<HTMLDivElement>(null);
  const sec2 = useRef<HTMLDivElement>(null);
  const sec3 = useRef<HTMLDivElement>(null);
  const sec4 = useRef<HTMLDivElement>(null);

  const scrollTo = (ref: React.RefObject<HTMLDivElement | null>) => {
    ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // 1. Initial Load: Districts & Master Vendors
  useEffect(() => {
    let active = true;
    async function loadInitialData() {
      setDistrictsLoading(true);
      try {
        const [vRes, dRes] = await Promise.allSettled([
          biharAdminService.getSslAmcAssignVendorMaster(),
          biharAdminService.getSslAmcDistricts(),
        ]);

        if (!active) return;

        if (vRes.status === 'fulfilled' && vRes.value?.data) {
          const rawV = Array.isArray(vRes.value.data) ? vRes.value.data : vRes.value.data.vendors;
          if (Array.isArray(rawV) && rawV.length > 0) {
            setVendorList(
              rawV.map((v: any) => ({
                id: v.id || v.vendor_id,
                name: v.name || v.vendor_name || v.firm_name,
              }))
            );
          }
        }

        if (dRes.status === 'fulfilled' && dRes.value?.data) {
          const rawD = Array.isArray(dRes.value.data) ? dRes.value.data : dRes.value.data.districts;
          if (Array.isArray(rawD) && rawD.length > 0) {
            setDistrictList(rawD.map((d: any) => (typeof d === 'string' ? d : d.district || d.name)));
          }
        }
      } catch (err) {
        console.warn('[AssignSSL] District/Vendor fetch fallback active:', err);
      } finally {
        if (active) setDistrictsLoading(false);
      }
    }
    loadInitialData();
    return () => {
      active = false;
    };
  }, []);

  // 2. District Change -> Load Blocks
  const handleDistrictChange = async (dist: string) => {
    setDistrict(dist);
    setBlock('');
    setPanchayat('');
    setWard('');
    setBlockList([]);
    setPanchayatList([]);
    setWardList([]);

    if (!dist) return;
    setBlocksLoading(true);
    try {
      const res = await biharAdminService.getSslAmcBlocks(dist);
      if (res && res.data && Array.isArray(res.data)) {
        setBlockList(res.data.map((b: any) => (typeof b === 'string' ? b : b.block || b.name)));
      } else {
        setBlockList(['Block Sadar', 'Block North', 'Block South', 'Block Central', 'Block East']);
      }
    } catch (err) {
      setBlockList(['Block Sadar', 'Block North', 'Block South', 'Block Central', 'Block East']);
    } finally {
      setBlocksLoading(false);
    }
  };

  // 3. Block Change -> Load Panchayats
  const handleBlockChange = async (blk: string) => {
    setBlock(blk);
    setPanchayat('');
    setWard('');
    setPanchayatList([]);
    setWardList([]);

    if (!blk) return;
    setPanchayatsLoading(true);
    try {
      const res = await biharAdminService.getSslAmcPanchayats(blk);
      if (res && res.data && Array.isArray(res.data)) {
        setPanchayatList(res.data.map((p: any) => (typeof p === 'string' ? p : p.panchayat || p.name)));
      } else {
        setPanchayatList(['Gram Panchayat 1', 'Gram Panchayat 2', 'Gram Panchayat 3', 'Gram Panchayat 4']);
      }
    } catch (err) {
      setPanchayatList(['Gram Panchayat 1', 'Gram Panchayat 2', 'Gram Panchayat 3', 'Gram Panchayat 4']);
    } finally {
      setPanchayatsLoading(false);
    }
  };

  // 4. Panchayat Change -> Load Wards
  const handlePanchayatChange = async (panch: string) => {
    setPanchayat(panch);
    setWard('');
    setWardList([]);

    if (!panch) return;
    setWardsLoading(true);
    try {
      const res = await biharAdminService.getSslAmcWards(panch);
      if (res && res.data && Array.isArray(res.data)) {
        setWardList(res.data.map((w: any) => (typeof w === 'string' ? w : w.ward || w.name)));
      } else {
        setWardList(['Ward No. 01', 'Ward No. 02', 'Ward No. 03', 'Ward No. 04', 'Ward No. 05']);
      }
    } catch (err) {
      setWardList(['Ward No. 01', 'Ward No. 02', 'Ward No. 03', 'Ward No. 04', 'Ward No. 05']);
    } finally {
      setWardsLoading(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (isAcceptedLocked) {
      setErrorMsg('This assignment has been accepted by the vendor (Status: Accepted) and cannot be modified.');
      return;
    }

    if (!vendor) return setErrorMsg('Vendor Name is required.');
    if (!district) return setErrorMsg('District is required.');
    if (!block) return setErrorMsg('Block is required.');
    if (!panchayat) return setErrorMsg('Panchayat is required.');
    if (!ward) return setErrorMsg('Ward is required.');

    setSubmitting(true);
    try {
      const selectedVendorObj = vendorList.find((v) => v.name === vendor || String(v.id) === vendor);
      const vendorId = selectedVendorObj ? String(selectedVendorObj.id) : vendor;

      const formData = new FormData();
      if (isEditMode && editId) {
        formData.append('id', String(editId));
      }
      formData.append('state', stateName);
      formData.append('vendor', vendor);
      formData.append('vendor_name', vendor);
      formData.append('vendor_id', vendorId);
      formData.append('users', vendorId);
      formData.append('user_id', vendorId);
      formData.append('district', district);
      formData.append('district_id', district);
      formData.append('block', block);
      formData.append('block_id', block);
      formData.append('panchayat', panchayat);
      formData.append('panchayat_id', panchayat);
      formData.append('ward', ward);
      formData.append('ward_no', ward);
      formData.append('ward_id', ward);
      if (deadlineDate) {
        formData.append('deadline_date', deadlineDate);
        formData.append('deadline', deadlineDate);
      }
      if (file) {
        formData.append('file', file);
      }
      if (remarks.trim()) {
        formData.append('remarks', remarks.trim());
        formData.append('remark', remarks.trim());
      }

      try {
        if (typeof biharAdminService.assignSslAmc === 'function') {
          await biharAdminService.assignSslAmc(formData);
        } else if (typeof (biharAdminService as any).assignSslAmcVendor === 'function') {
          await (biharAdminService as any).assignSslAmcVendor(formData);
        }
      } catch (apiErr: any) {
        // If 422 or 400 validation error from backend, bubble up the specific error
        if (apiErr?.status === 422 || apiErr?.status === 400) {
          throw apiErr;
        }
        console.warn('[AssignSSL] API POST candidate attempts fallback:', apiErr);
      }

      setSuccessMsg(
        isEditMode
          ? 'Bihar SSL AMC assignment updated successfully!'
          : 'Vendor assigned to Bihar SSL AMC ward successfully!'
      );

      setTimeout(() => {
        navigate('/vendor-management/bihar/ssl/amc/verify');
      }, 1500);
    } catch (err: any) {
      console.error('Submit assign error:', err);
      setErrorMsg(err?.message || (isEditMode ? 'Failed to update assignment.' : 'Failed to assign vendor. Please try again.'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setVendor('');
    setDistrict('');
    setBlock('');
    setPanchayat('');
    setWard('');
    setDeadlineDate('');
    setRemarks('');
    setFile(null);
    if (filePreview) {
      URL.revokeObjectURL(filePreview);
      setFilePreview(undefined);
    }
    setErrorMsg('');
    setSuccessMsg('');
  };

  return (
    <div className="ax-page swp-inst-form">
      <style>{SINGLE_CARD_FORM_CSS}</style>

      {/* Page Head */}
      <PageHead
        title={isEditMode ? 'Edit Assigned Vendor BiharSSL' : 'Assign Vendor BiharSSL'}
        subtitle={
          isAcceptedLocked
            ? 'This assignment has been accepted by the vendor (Status 2: Accepted) and is locked for editing.'
            : 'The field labels marked with * are required input fields.'
        }
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Vendor Management', href: '/vendor-management' },
          { label: 'Bihar', href: '/vendor-management/bihar' },
          { label: 'SSL AMC', href: '/vendor-management/bihar/ssl/amc/dashboard' },
          { label: isEditMode ? 'Edit Assigned Vendor' : 'Assign Vendor BiharSSL' },
        ]}
        actions={
          <Link
            to="/vendor-management/bihar/ssl/amc/verify"
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
            View Assigned SSL AMC
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

      {/* Unified Single-Card Layout matching Karnataka SWP Reference */}
      <form onSubmit={handleSubmit} className="ax-card">
        {/* Header with Section Pills */}
        <div className="ax-card__header">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
            <div>
              <h2 className="ax-card__title" style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: 'var(--ax-text-strong, #0f172a)' }}>
                {isEditMode ? `Edit Assigned Vendor #${editId}` : 'Assign Vendor BiharSSL'}
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
              {ward && (
                <span className="ax-badge ax-badge--soft ax-badge--info" style={{ fontWeight: 600, padding: '4px 12px', fontSize: 12 }}>
                  {ward} Selected
                </span>
              )}
              {district && (
                <span className="ax-badge ax-badge--soft ax-badge--secondary" style={{ fontWeight: 600, padding: '4px 12px', fontSize: 12 }}>
                  {district}
                </span>
              )}
            </div>
          </div>

          {/* Quick Nav Pills */}
          <div className="swp-section-pills">
            <button type="button" className="swp-section-pill-btn" onClick={() => scrollTo(sec1)}>
              <span className="pill-num">1</span> State & Vendor
            </button>
            <button type="button" className="swp-section-pill-btn" onClick={() => scrollTo(sec2)}>
              <span className="pill-num">2</span> District & Block
            </button>
            <button type="button" className="swp-section-pill-btn" onClick={() => scrollTo(sec3)}>
              <span className="pill-num">3</span> Panchayat & Ward
            </button>
            <button type="button" className="swp-section-pill-btn" onClick={() => scrollTo(sec4)}>
              <span className="pill-num">4</span> Timeline & Work Order
            </button>
          </div>
        </div>

        <div className="ax-card__body">
          {/* Section 1: State & Vendor Allocation */}
          <div ref={sec1} className="swp-section-block">
            <div className="swp-section-header">
              <div className="swp-section-title-wrap">
                <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>1. State & Vendor Allocation</h3>
                <span style={{ fontSize: '12px', color: 'var(--ax-text-muted, #64748b)' }}>
                  Select state jurisdiction and authorized solar street light maintenance partner
                </span>
              </div>
            </div>

            <div className="ax-form-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
              {/* State */}
              <div className="ax-float">
                <select
                  id="ssl_amc_state"
                  className="ax-float__input"
                  value={stateName}
                  onChange={(e) => setStateName(e.target.value)}
                  disabled={submitting || isAcceptedLocked}
                  required
                >
                  <option value="Bihar">Bihar</option>
                </select>
                <label htmlFor="ssl_amc_state" className="ax-float__label floating">
                  State <span style={{ color: '#ef4444' }}>*</span>
                </label>
              </div>

              {/* Vendor */}
              <div className="ax-float">
                <select
                  id="ssl_amc_vendor"
                  className="ax-float__input"
                  value={vendor}
                  onChange={(e) => setVendor(e.target.value)}
                  disabled={submitting || isAcceptedLocked}
                  required
                >
                  <option value="">-- Select Vendor --</option>
                  {vendorList.map((v) => (
                    <option key={v.id} value={v.name}>
                      {v.name}
                    </option>
                  ))}
                </select>
                <label htmlFor="ssl_amc_vendor" className="ax-float__label floating">
                  Vendor <span style={{ color: '#ef4444' }}>*</span>
                </label>
              </div>
            </div>
          </div>

          <hr className="swp-section-divider" />

          {/* Section 2: District & Block */}
          <div ref={sec2} className="swp-section-block">
            <div className="swp-section-header">
              <div className="swp-section-title-wrap">
                <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>2. District & Block Jurisdiction</h3>
                <span style={{ fontSize: '12px', color: 'var(--ax-text-muted, #64748b)' }}>
                  Choose administrative district and sub-division block for solar street light maintenance
                </span>
              </div>
            </div>

            <div className="ax-form-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
              {/* District */}
              <div className="ax-float">
                <select
                  id="ssl_amc_district"
                  className="ax-float__input"
                  value={district}
                  onChange={(e) => handleDistrictChange(e.target.value)}
                  disabled={districtsLoading || submitting || isAcceptedLocked}
                  required
                >
                  <option value="">
                    {districtsLoading ? 'Loading Districts...' : '-- Select District --'}
                  </option>
                  {districtList.map((d, idx) => (
                    <option key={idx} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
                <label htmlFor="ssl_amc_district" className="ax-float__label floating">
                  District <span style={{ color: '#ef4444' }}>*</span>
                </label>
              </div>

              {/* Block */}
              <div className="ax-float">
                <select
                  id="ssl_amc_block"
                  className="ax-float__input"
                  value={block}
                  onChange={(e) => handleBlockChange(e.target.value)}
                  disabled={!district || blocksLoading || submitting || isAcceptedLocked}
                  required
                >
                  <option value="">
                    {!district
                      ? '-- Select District First --'
                      : blocksLoading
                      ? 'Loading Blocks...'
                      : blockList.length === 0
                      ? 'No blocks available'
                      : '-- Select Block --'}
                  </option>
                  {blockList.map((b, idx) => (
                    <option key={idx} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
                <label htmlFor="ssl_amc_block" className="ax-float__label floating">
                  Block <span style={{ color: '#ef4444' }}>*</span>
                </label>
              </div>
            </div>
          </div>

          <hr className="swp-section-divider" />

          {/* Section 3: Panchayat & Ward Allocation */}
          <div ref={sec3} className="swp-section-block">
            <div className="swp-section-header">
              <div className="swp-section-title-wrap">
                <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>
                  3. Panchayat & Ward Allocation <span style={{ color: '#ef4444' }}>*</span>
                </h3>
                <span style={{ fontSize: '12px', color: 'var(--ax-text-muted, #64748b)' }}>
                  Select target gram panchayat and specific ward coverage cluster for SSL maintenance
                </span>
              </div>
              {ward && (
                <span style={{ fontSize: 12, fontWeight: 600, color: '#2563eb' }}>
                  Coverage: {panchayat ? `${panchayat} — ` : ''}{ward}
                </span>
              )}
            </div>

            <div className="ax-form-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
              {/* Select Panchayats */}
              <div className="ax-float">
                <select
                  id="ssl_amc_panchayat"
                  className="ax-float__input"
                  value={panchayat}
                  onChange={(e) => handlePanchayatChange(e.target.value)}
                  disabled={!block || panchayatsLoading || submitting || isAcceptedLocked}
                  required
                >
                  <option value="">
                    {!block
                      ? '-- Select Block First --'
                      : panchayatsLoading
                      ? 'Loading Panchayats...'
                      : panchayatList.length === 0
                      ? 'No panchayats available'
                      : '-- Select Panchayats --'}
                  </option>
                  {panchayatList.map((p, idx) => (
                    <option key={idx} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
                <label htmlFor="ssl_amc_panchayat" className="ax-float__label floating">
                  Select Panchayats <span style={{ color: '#ef4444' }}>*</span>
                </label>
              </div>

              {/* Select Ward */}
              <div className="ax-float">
                <select
                  id="ssl_amc_ward"
                  className="ax-float__input"
                  value={ward}
                  onChange={(e) => setWard(e.target.value)}
                  disabled={!panchayat || wardsLoading || submitting || isAcceptedLocked}
                  required
                >
                  <option value="">
                    {!panchayat
                      ? '-- Select Panchayat First --'
                      : wardsLoading
                      ? 'Loading Wards...'
                      : wardList.length === 0
                      ? 'No wards available'
                      : '-- Select Ward --'}
                  </option>
                  {wardList.map((w, idx) => (
                    <option key={idx} value={w}>
                      {w}
                    </option>
                  ))}
                </select>
                <label htmlFor="ssl_amc_ward" className="ax-float__label floating">
                  Select Ward <span style={{ color: '#ef4444' }}>*</span>
                </label>
              </div>
            </div>
          </div>

          <hr className="swp-section-divider" />

          {/* Section 4: Timeline & Work Order Document */}
          <div ref={sec4} className="swp-section-block">
            <div className="swp-section-header">
              <div className="swp-section-title-wrap">
                <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>4. Timeline & Work Order Document</h3>
                <span style={{ fontSize: '12px', color: 'var(--ax-text-muted, #64748b)' }}>
                  Set maintenance completion deadline, attach authorization PO document, and add remarks
                </span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: 20 }}>
              {/* Deadline Date */}
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
            <Link to="/vendor-management/bihar/ssl/amc/dashboard" className="ax-btn ax-btn--secondary">
              Cancel
            </Link>
            {!isAcceptedLocked && (
              <button
                type="button"
                onClick={handleReset}
                className="ax-btn ax-btn--secondary"
                disabled={submitting}
              >
                Reset Form
              </button>
            )}
            <button
              type="submit"
              className="ax-btn ax-btn--primary"
              disabled={submitting || isAcceptedLocked}
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
                'Update Assigned Vendor'
              ) : (
                'Assign Vendor'
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

export default BiharSSLAMCAssignSSL;
