import { useState, useEffect, useRef, useMemo, type FormEvent, type ChangeEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { PageHead } from '../../../../shell/PageHead';
import { biharAdminService } from '../../bihar-services/biharAdminService';
import { BIHAR_VOLUMES, BIHAR_SUPPLY_INSP_CODES } from '../../bihar-types';

// Unified Single-Card Layout with Floating Labels & Section Dividers (matching Assam SWP Reference)
const SINGLE_CARD_FORM_CSS = `
.swp-inst-form .ax-card {
  border: 1px solid var(--ax-border, #e2e8f0);
  border-radius: var(--ax-radius-xl, 16px);
  background: var(--ax-surface-solid, #ffffff);
  box-shadow: var(--ax-shadow-sm, 0 1px 3px 0 rgba(0, 0, 0, 0.05));
  overflow: hidden;
}
.swp-inst-form .ax-card__header {
  padding: var(--ax-space-5, 20px) var(--ax-space-6, 24px);
  border-bottom: 1px solid var(--ax-border-subtle, #f1f5f9);
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
  color: var(--ax-text, #334155);
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
  border-bottom: 1px solid var(--ax-border-subtle, #f1f5f9);
}
.swp-section-title-wrap { display: flex; flex-direction: column; gap: 4px; }
.swp-section-divider {
  border: 0;
  border-top: 1px dashed var(--ax-border, #cbd5e1);
  margin: var(--ax-space-8, 32px) 0 var(--ax-space-6, 24px);
}

/* Floating Label Core */
.ax-float { position: relative; width: 100%; }
.ax-float__input {
  width: 100%;
  height: 46px;
  padding: 12px 14px 4px 14px;
  font-size: var(--ax-text-sm, 13.5px);
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
  font-size: var(--ax-text-sm, 13px);
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
  min?: string | number;
  readOnly?: boolean;
}

function FloatingInput({
  label,
  name,
  value,
  onChange,
  required,
  disabled,
  type = 'text',
  placeholder,
  min,
  readOnly,
}: FloatingInputProps) {
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
        readOnly={readOnly}
        min={min}
        placeholder={placeholder || label}
        className="ax-float__input"
      />
      <label htmlFor={name} className={`ax-float__label ${focused ? 'floating' : hasVal ? 'has-val' : ''}`}>
        {label} {required && <span style={{ color: 'var(--ax-danger, #ef4444)' }}>*</span>}
      </label>
    </div>
  );
}

/* ───────── Modern Upload Dropzone (matching Assam SWP Reference) ───────── */
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
  hint?: string;
}

function UploadDropzone({
  id,
  label,
  required,
  disabled,
  accept = '.xlsx,.xls,.csv,.pdf,.jpg,.jpeg,.png',
  file,
  preview,
  onSelect,
  onRemove,
  error,
  hint = 'Supports Excel (XLSX, XLS), CSV, PDF (Max 15 MB) — single file',
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
              {hint}
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

export function BiharSSLInstallationAssignLight() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('edit') || searchParams.get('id');
  const isEditMode = Boolean(editId);

  // Form values
  const [vendorList, setVendorList] = useState<Array<{ id: number | string; name: string }>>([]);
  const [districtList, setDistrictList] = useState<string[]>([]);
  const [blockList, setBlockList] = useState<string[]>([]);
  const [panchayatList, setPanchayatList] = useState<string[]>([]);
  const [loadingVendors, setLoadingVendors] = useState<boolean>(false);
  const [loadingDistricts, setLoadingDistricts] = useState<boolean>(false);
  const [loadingBlocks, setLoadingBlocks] = useState<boolean>(false);

  const [selectedVendor, setSelectedVendor] = useState<string>('');
  const [stateVal] = useState<string>('Bihar');
  const [selectedVolume, setSelectedVolume] = useState<string>('');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('');
  const [selectedBlock, setSelectedBlock] = useState<string>('');
  const [panchayat, setPanchayat] = useState<string>('');
  const [wardNo, setWardNo] = useState<string>('');
  const [supplyInspCode, setSupplyInspCode] = useState<string>('');
  const [poleNo, setPoleNo] = useState<string>('');
  const [deadlineDate, setDeadlineDate] = useState<string>('');
  const [lightCount, setLightCount] = useState<string>('');
  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | undefined>(undefined);
  const [existingFileUrl, setExistingFileUrl] = useState<string>('');
  const [remarks, setRemarks] = useState<string>('');

  // Status & Lock
  const [isAcceptedLocked, setIsAcceptedLocked] = useState<boolean>(false);
  const [recordStatus, setRecordStatus] = useState<number | null>(null);

  // Loading & Feedback
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');
  const [fileError, setFileError] = useState<string>('');

  // Fetch vendors & master on mount
  useEffect(() => {
    let mounted = true;
    setLoadingVendors(true);
    biharAdminService
      .getSslAssignMaster()
      .then((res: any) => {
        if (!mounted) return;
        const list = res?.vendors || res?.data?.vendors || res?.data || (Array.isArray(res) ? res : []);
        if (Array.isArray(list)) {
          setVendorList(list.map((v: any) => ({ id: v.id || v.vendor_id, name: v.name || v.vendor_name || `Vendor #${v.id}` })));
        }
      })
      .catch((err) => console.warn('Failed to fetch SSL vendors:', err))
      .finally(() => {
        if (mounted) setLoadingVendors(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  // Fetch districts when volume changes
  useEffect(() => {
    if (!selectedVolume) {
      setDistrictList([]);
      return;
    }
    let mounted = true;
    setLoadingDistricts(true);
    biharAdminService
      .getSslDistrictsByVolume(selectedVolume)
      .then((res: any) => {
        if (!mounted) return;
        const list = res?.districts || res?.data?.districts || res?.data || (Array.isArray(res) ? res : []);
        setDistrictList(Array.isArray(list) ? list.map((d: any) => typeof d === 'string' ? d : d.district || d.name) : []);
      })
      .catch((err) => {
        console.warn('Failed to fetch districts by volume:', err);
        if (mounted) setDistrictList([]);
      })
      .finally(() => {
        if (mounted) setLoadingDistricts(false);
      });
    return () => {
      mounted = false;
    };
  }, [selectedVolume]);

  // Fetch blocks when district changes
  useEffect(() => {
    if (!selectedDistrict) {
      setBlockList([]);
      return;
    }
    let mounted = true;
    setLoadingBlocks(true);
    biharAdminService
      .getSslBlocksByDistrict(selectedDistrict)
      .then((res: any) => {
        if (!mounted) return;
        const list = res?.blocks || res?.data?.blocks || res?.data || (Array.isArray(res) ? res : []);
        setBlockList(Array.isArray(list) ? list.map((b: any) => typeof b === 'string' ? b : b.block || b.name) : []);
      })
      .catch((err) => {
        console.warn('Failed to fetch blocks:', err);
        if (mounted) setBlockList([]);
      })
      .finally(() => {
        if (mounted) setLoadingBlocks(false);
      });
    return () => {
      mounted = false;
    };
  }, [selectedDistrict]);

  // Fetch existing assignment if in edit mode
  useEffect(() => {
    if (!editId) return;
    let mounted = true;
    biharAdminService
      .getViewAssignSsl()
      .then((res: any) => {
        if (!mounted) return;
        const rawList =
          res?.data?.assignedsite ||
          res?.data?.assigned_site ||
          res?.data?.assignments ||
          res?.data?.assigned ||
          res?.data?.list ||
          (Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : []);
        const item = Array.isArray(rawList)
          ? rawList.find((r: any) => String(r.id) === String(editId))
          : null;
        if (item) {
          const vId = item.vendor ?? item.vendors?.id ?? item.vendors?.vendor_id ?? '';
          if (vId) setSelectedVendor(String(vId));
          if (item.volume) setSelectedVolume(String(item.volume).replace(/[^0-9]/g, '') || String(item.volume));
          if (item.district) setSelectedDistrict(String(item.district));
          if (item.block) setSelectedBlock(String(item.block));

          let pVal = item.panchayat || '';
          if (typeof pVal === 'string' && (pVal.startsWith('[') || pVal.startsWith('{'))) {
            try {
              const parsed = JSON.parse(pVal);
              pVal = Array.isArray(parsed) ? parsed.join(', ') : String(parsed);
            } catch {
              pVal = pVal.replace(/[\[\]"']/g, '').trim();
            }
          }
          setPanchayat(pVal);

          if (item.ward_no) setWardNo(String(item.ward_no));
          if (item.insp_code || item.supply_insp_code) setSupplyInspCode(String(item.insp_code || item.supply_insp_code));
          if (item.pole_no) setPoleNo(String(item.pole_no));
          if (item.ldate || item.deadline_date) setDeadlineDate(String(item.ldate || item.deadline_date));
          if (item.sitecount ?? item.site_count ?? item.light_count) {
            setLightCount(String(item.sitecount ?? item.site_count ?? item.light_count));
          }
          if (item.uid_file || item.unique_id_file) {
            setExistingFileUrl(String(item.uid_file || item.unique_id_file));
          }
          if (item.remark || item.remarks) {
            setRemarks(String(item.remark || item.remarks));
          }
          const stNum = Number(item.status);
          setRecordStatus(stNum);
          if (stNum === 2) {
            setIsAcceptedLocked(true);
          }
        }
      })
      .catch((err) => console.warn('Failed to load assignment for edit:', err));
    return () => {
      mounted = false;
    };
  }, [editId]);

  // Section refs for navigation pills
  const sec1 = useRef<HTMLDivElement>(null);
  const sec2 = useRef<HTMLDivElement>(null);
  const sec3 = useRef<HTMLDivElement>(null);
  const sec4 = useRef<HTMLDivElement>(null);

  const scrollTo = (ref: React.RefObject<HTMLDivElement | null>) => {
    ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // Submit Handler
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setFileError('');

    if (isAcceptedLocked) {
      setErrorMsg('This assignment has been accepted by the vendor (Status: Accepted) and cannot be modified.');
      return;
    }

    if (!selectedVendor) return setErrorMsg('Vendor Name is required.');
    if (!selectedVolume) return setErrorMsg('Volume is required.');
    if (!selectedDistrict) return setErrorMsg('District is required.');
    if (!selectedBlock) return setErrorMsg('Block is required.');
    if (!panchayat.trim()) return setErrorMsg('Panchayat is required.');
    if (!supplyInspCode) return setErrorMsg('Supply Insp Code is required.');
    if (!deadlineDate) return setErrorMsg('Deadline Date is required.');
    if (!lightCount || Number(lightCount) <= 0) return setErrorMsg('Please enter a valid Light Count.');
    if (!file && !existingFileUrl) {
      setFileError("Assigned Unique ID's File is required.");
      return setErrorMsg("Please upload Assigned Unique ID's File.");
    }

    setSubmitting(true);
    try {
      const fd = new FormData();
      if (isEditMode && editId) {
        fd.append('id', String(editId));
      }
      fd.append('vendor', selectedVendor);
      fd.append('state', stateVal);
      fd.append('volume', selectedVolume);
      fd.append('district', selectedDistrict);
      fd.append('block', selectedBlock);
      fd.append('panchayat', panchayat);
      fd.append('ward_no', wardNo);
      fd.append('pole_no', poleNo);
      fd.append('supply_insp_code', supplyInspCode);
      fd.append('deadline_date', deadlineDate);
      fd.append('light_count', lightCount);
      fd.append('remarks', remarks);
      if (file) {
        fd.append('file', file);
      }

      const res = await biharAdminService.storeSslAssign(fd);
      if (res?.success === false) {
        setErrorMsg(res?.message || 'Failed to save assignment.');
      } else {
        setSuccessMsg(
          res?.message ||
            (isEditMode
              ? `Assigned Installation #${editId} Updated Successfully!`
              : `Successfully assigned ${lightCount} SSL lights for ${panchayat}, ${selectedBlock}, ${selectedDistrict}! Work order dispatched.`)
        );
        setTimeout(() => {
          navigate('/vendor-management/bihar/ssl/installation/view-assign');
        }, 1500);
      }
    } catch (err: any) {
      console.error('Submit assign error:', err);
      setErrorMsg(err?.message || (isEditMode ? 'Failed to update assignment.' : 'Failed to assign installation sites.'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setSelectedVendor('');
    setSelectedVolume('');
    setSelectedDistrict('');
    setSelectedBlock('');
    setPanchayat('');
    setWardNo('');
    setSupplyInspCode('');
    setPoleNo('');
    setDeadlineDate('');
    setLightCount('');
    setRemarks('');
    setFile(null);
    if (filePreview) {
      URL.revokeObjectURL(filePreview);
      setFilePreview(undefined);
    }
    setFileError('');
    setErrorMsg('');
    setSuccessMsg('');
  };

  return (
    <div className="ax-page swp-inst-form">
      <style>{SINGLE_CARD_FORM_CSS}</style>

      {/* Page Head */}
      <PageHead
        title={isEditMode ? 'Edit Bihar SSL Assigned Installation' : 'Assign Bihar SSL Installation Sites'}
        subtitle={
          isAcceptedLocked
            ? 'This assignment has been accepted by the vendor (Status 2: Accepted) and is locked for editing.'
            : 'The field labels marked with * are required input fields.'
        }
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Vendor Management', href: '/vendor-management' },
          { label: 'Bihar SSL', href: '/vendor-management/bihar/ssl/installation/dashboard' },
          { label: isEditMode ? 'Edit Assigned Installation' : 'Assign Bihar SSL Installation Sites' },
        ]}
        actions={
          <Link
            to="/vendor-management/bihar/ssl/installation/view-assign"
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
            View Assigned SSL Sites
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

      {/* Unified Single-Card Layout matching Assam SWP Reference */}
      <form onSubmit={handleSubmit} className="ax-card">
        {/* Header with Section Pills */}
        <div className="ax-card__header">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
            <div>
              <h2 className="ax-card__title" style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: 'var(--ax-text-strong, #0f172a)' }}>
                {isEditMode ? `Edit Assigned Installation #${editId}` : 'Assign Bihar SSL Installation Sites'}
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
              {lightCount && Number(lightCount) > 0 && (
                <span className="ax-badge ax-badge--soft ax-badge--info" style={{ fontWeight: 600, padding: '4px 12px', fontSize: 12 }}>
                  {lightCount} Light(s) Allocated
                </span>
              )}
              {selectedDistrict && (
                <span className="ax-badge ax-badge--soft ax-badge--secondary" style={{ fontWeight: 600, padding: '4px 12px', fontSize: 12 }}>
                  {selectedDistrict}
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
              <span className="pill-num">2</span> District & Block
            </button>
            <button type="button" className="swp-section-pill-btn" onClick={() => scrollTo(sec3)}>
              <span className="pill-num">3</span> Location & Light Quota
            </button>
            <button type="button" className="swp-section-pill-btn" onClick={() => scrollTo(sec4)}>
              <span className="pill-num">4</span> Timeline & Work Order
            </button>
          </div>
        </div>

        <div className="ax-card__body">
          {/* Section 1: Vendor, State & Volume Allocation */}
          <div ref={sec1} className="swp-section-block">
            <div className="swp-section-header">
              <div className="swp-section-title-wrap">
                <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>1. Vendor & Volume Allocation</h3>
                <span style={{ fontSize: '12px', color: 'var(--ax-text-muted, #64748b)' }}>
                  Select authorized partner vendor, project state and allocated volume
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
                  disabled={submitting || isAcceptedLocked}
                  required
                >
                  <option value="">{loadingVendors ? '-- Loading Vendors... --' : '-- Select Vendor --'}</option>
                  {vendorList.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name}
                    </option>
                  ))}
                </select>
                <label htmlFor="vendor_select" className="ax-float__label floating">
                  Vendor Name <span style={{ color: '#ef4444' }}>*</span>
                </label>
              </div>

              {/* State * (Bihar) */}
              <FloatingInput
                label="State"
                name="state"
                value={stateVal}
                onChange={() => {}}
                disabled
                required
              />

              {/* Volume * */}
              <div className="ax-float">
                <select
                  id="volume_select"
                  className="ax-float__input"
                  value={selectedVolume}
                  onChange={(e) => setSelectedVolume(e.target.value)}
                  disabled={submitting || isAcceptedLocked}
                  required
                >
                  <option value="">-- Select Volume --</option>
                  {BIHAR_VOLUMES.map((vol, idx) => (
                    <option key={idx} value={vol}>
                      {vol}
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

          {/* Section 2: District & Block */}
          <div ref={sec2} className="swp-section-block">
            <div className="swp-section-header">
              <div className="swp-section-title-wrap">
                <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>2. District & Block Jurisdiction</h3>
                <span style={{ fontSize: '12px', color: 'var(--ax-text-muted, #64748b)' }}>
                  Select administrative district and sub-division block for solar street light installation
                </span>
              </div>
            </div>

            <div className="ax-form-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
              {/* District * */}
              <div className="ax-float">
                <select
                  id="district_select"
                  className="ax-float__input"
                  value={selectedDistrict}
                  onChange={(e) => {
                    setSelectedDistrict(e.target.value);
                    setSelectedBlock('');
                  }}
                  disabled={submitting || isAcceptedLocked}
                  required
                >
                  <option value="">{loadingDistricts ? '-- Loading Districts... --' : '-- Select District --'}</option>
                  {(districtList.length > 0 ? districtList : ['Patna', 'Gaya', 'Muzaffarpur', 'Nalanda', 'Bhagalpur']).map((d, idx) => (
                    <option key={idx} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
                <label htmlFor="district_select" className="ax-float__label floating">
                  District <span style={{ color: '#ef4444' }}>*</span>
                </label>
              </div>

              {/* Block * */}
              <div className="ax-float">
                <select
                  id="block_select"
                  className="ax-float__input"
                  value={selectedBlock}
                  onChange={(e) => setSelectedBlock(e.target.value)}
                  disabled={!selectedDistrict || submitting || isAcceptedLocked}
                  required
                >
                  <option value="">
                    {!selectedDistrict
                      ? '-- Select District First --'
                      : loadingBlocks
                      ? '-- Loading Blocks... --'
                      : '-- Select Block --'}
                  </option>
                  {blockList.map((b, idx) => (
                    <option key={idx} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
                <label htmlFor="block_select" className="ax-float__label floating">
                  Block <span style={{ color: '#ef4444' }}>*</span>
                </label>
              </div>
            </div>
          </div>

          <hr className="swp-section-divider" />

          {/* Section 3: Location & Light Quota */}
          <div ref={sec3} className="swp-section-block">
            <div className="swp-section-header">
              <div className="swp-section-title-wrap">
                <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>
                  3. Location & Light Allocation <span style={{ color: '#ef4444' }}>*</span>
                </h3>
                <span style={{ fontSize: '12px', color: 'var(--ax-text-muted, #64748b)' }}>
                  Specify gram panchayat, ward number, supply inspection code, and pole/light allocation quota
                </span>
              </div>
              {lightCount && Number(lightCount) > 0 && (
                <span style={{ fontSize: 12, fontWeight: 600, color: '#2563eb' }}>
                  {lightCount} Total Lights Quota
                </span>
              )}
            </div>

            <div className="ax-form-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
              {/* Panchayat * */}
              <FloatingInput
                label="Panchayat"
                name="panchayat"
                value={panchayat}
                onChange={(e) => setPanchayat(e.target.value)}
                disabled={submitting || isAcceptedLocked}
                placeholder="Enter Panchayat Name"
                required
              />

              {/* Ward No */}
              <FloatingInput
                label="Ward No"
                name="ward_no"
                value={wardNo}
                onChange={(e) => setWardNo(e.target.value)}
                disabled={submitting || isAcceptedLocked}
                placeholder="e.g. Ward 04"
              />

              {/* Supply Insp Code * */}
              <div className="ax-float">
                <select
                  id="supply_insp_code"
                  className="ax-float__input"
                  value={supplyInspCode}
                  onChange={(e) => setSupplyInspCode(e.target.value)}
                  disabled={submitting || isAcceptedLocked}
                  required
                >
                  <option value="">-- Select Supply Insp Code --</option>
                  {BIHAR_SUPPLY_INSP_CODES.map((code, idx) => (
                    <option key={idx} value={code}>
                      {code}
                    </option>
                  ))}
                </select>
                <label htmlFor="supply_insp_code" className="ax-float__label floating">
                  Supply Insp Code <span style={{ color: '#ef4444' }}>*</span>
                </label>
              </div>

              {/* Pole Numbers */}
              <FloatingInput
                label="Pole Numbers"
                name="pole_no"
                value={poleNo}
                onChange={(e) => setPoleNo(e.target.value)}
                disabled={submitting || isAcceptedLocked}
                placeholder="e.g. P-DAN-001 to P-DAN-150"
              />

              {/* Light Count * */}
              <FloatingInput
                label="Light Count"
                name="light_count"
                type="number"
                min={1}
                value={lightCount}
                onChange={(e) => setLightCount(e.target.value)}
                disabled={submitting || isAcceptedLocked}
                placeholder="Enter Light Count"
                required
              />
            </div>
          </div>

          <hr className="swp-section-divider" />

          {/* Section 4: Timeline & Work Order */}
          <div ref={sec4} className="swp-section-block">
            <div className="swp-section-header">
              <div className="swp-section-title-wrap">
                <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>4. Timeline & Work Order Documentation</h3>
                <span style={{ fontSize: '12px', color: 'var(--ax-text-muted, #64748b)' }}>
                  Set completion deadline, attach verified Unique ID file, and specify vendor instructions
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
                <span style={{ color: 'var(--ax-text-muted, #64748b)' }}>Currently Attached PO / Unique ID Document:</span>
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
                id="assign_unique_id_file"
                label="Assigned Unique ID's File"
                accept=".xlsx,.xls,.csv,.pdf,.jpg,.jpeg,.png"
                disabled={isAcceptedLocked || submitting}
                required={!isEditMode && !existingFileUrl}
                file={file}
                preview={filePreview}
                error={fileError}
                onSelect={(selected) => {
                  setFile(selected);
                  setFileError('');
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
                hint="Supports Excel (XLSX, XLS), CSV, PDF (Max 15 MB) — single file"
              />
            </div>
          </div>

          {/* Submit Footer */}
          <div style={{ marginTop: '32px', paddingTop: '20px', borderTop: '1px solid var(--ax-border, #e2e8f0)', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '12px' }}>
            <Link to="/vendor-management/bihar/ssl/installation/view-assign" className="ax-btn ax-btn--secondary">
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
                'Update Assigned Installation'
              ) : (
                'Assign Bihar SSL Installation Sites'
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

export default BiharSSLInstallationAssignLight;
