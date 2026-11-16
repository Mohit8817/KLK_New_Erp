import { useState, useEffect, useRef, useMemo, type FormEvent, type ChangeEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { PageHead } from '../../../../shell/PageHead';
import {
  UP_DISTRICTS,
  UP_KUSUM_C_VENDORS,
  UP_KUSUM_C_VOLUMES,
  type UPKusumCAssignRecord,
  type UPFarmerInfo,
  INITIAL_ASSIGN_DATA,
} from './upKusumCTypes';

// Unified Single-Card Layout with Floating Labels & Section Dividers (matching Karnataka SWP reference)
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
.ax-float__input.is-invalid { border-color: #ef4444; }

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
.ax-float__input.is-invalid + .ax-float__label {
  color: #ef4444;
}
.kswp-field-error {
  margin-top: 4px;
  font-size: 11px;
  color: #ef4444;
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
  error?: string;
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
  error,
}: FloatingInputProps) {
  const [focused, setFocused] = useState(false);
  const hasVal = Boolean(value && String(value).length > 0);

  return (
    <div>
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
          className={`ax-float__input ${error ? 'is-invalid' : ''}`}
        />
        <label htmlFor={name} className={`ax-float__label ${focused ? 'floating' : hasVal ? 'has-val' : ''}`}>
          {label} {required && <span style={{ color: 'var(--ax-danger, #ef4444)' }}>*</span>}
        </label>
      </div>
      {error && <div className="kswp-field-error">{error}</div>}
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
  accept = '.pdf,.jpg,.jpeg,.png,.xlsx,.csv',
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
                    width: 38,
                    height: 38,
                    borderRadius: '50%',
                    background: '#ecfdf5',
                    color: '#10b981',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
              )}
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--ax-text-strong, #1e293b)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {file?.name || 'Attached Document'}
                </div>
                <div style={{ fontSize: 11, color: 'var(--ax-text-muted, #64748b)', marginTop: 2 }}>
                  {file ? `${(file.size / 1024).toFixed(0)} KB · Ready to upload` : 'Attached work order file'}
                </div>
              </div>
            </div>
            <button
              type="button"
              className="ax-btn ax-btn--ghost ax-btn--sm"
              onClick={handleClear}
              disabled={disabled}
              style={{ color: 'var(--ax-danger, #ef4444)', flexShrink: 0 }}
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
              PDF, JPG, JPEG, PNG or XLSX (Max 15 MB) — single file
            </div>
          </>
        )}
      </div>

      {error && <span style={{ fontSize: 11, color: '#ef4444', marginTop: 2 }}>{error}</span>}
    </div>
  );
}

/* ───────── UP Kusum C Applicant Site Model ───────── */
interface UPApplicantSite {
  id: number;
  farmer_name: string;
  father_name?: string;
  application_no?: string;
  village?: string;
  block?: string;
  district?: string;
  pump_capacity?: string;
  contact?: string;
}

// Generate realistic UP Kusum C applicants by district
function generateUPApplicantsForDistrict(distName: string): UPApplicantSite[] {
  const seedNames = [
    { name: 'Rameshwar Prasad Sharma', father: 'Kripa Shankar Sharma', block: 'Sadar', village: 'Rampur Khurd', hp: '7.5 HP' },
    { name: 'Satyendra Kumar Singh', father: 'Deo Narayan Singh', block: 'Bikapur', village: 'Fatehpur Grant', hp: '5.0 HP' },
    { name: 'Birendra Kumar Verma', father: 'Ram Asrey Verma', block: 'Sohawal', village: 'Kalyanpur', hp: '10.0 HP' },
    { name: 'Dinesh Chandra Yadav', father: 'Gauri Shankar Yadav', block: 'Mohanlalganj', village: 'Dariyapur', hp: '7.5 HP' },
    { name: 'Rajendra Singh Chauhan', father: 'Mahavir Singh', block: 'Bakshi Ka Talab', village: 'Behta', hp: '5.0 HP' },
    { name: 'Kamlesh Narayan Mishra', father: 'Sheetla Bux Mishra', block: 'Pipraich', village: 'Jangal Kaudiya', hp: '7.5 HP' },
    { name: 'Om Prakash Patel', father: 'Ram Dularey Patel', block: 'Koraon', village: 'Meja Road', hp: '10.0 HP' },
    { name: 'Santosh Kumar Maurya', father: 'Lalta Prasad Maurya', block: 'Chiraigaon', village: 'Sarai Mohana', hp: '5.0 HP' },
  ];

  const prefix = distName ? distName.slice(0, 3).toUpperCase() : 'UPC';
  return seedNames.map((item, idx) => ({
    id: 1000 + (distName ? distName.charCodeAt(0) * 10 : 100) + idx + 1,
    farmer_name: item.name,
    father_name: item.father,
    application_no: `UP-KC-${prefix}-${202500 + idx + 1}`,
    village: item.village,
    block: item.block,
    district: distName,
    pump_capacity: item.hp,
    contact: `+91 945${String(1000000 + idx * 83742).slice(0, 7)}`,
  }));
}

/* ───────── Main Component: UPKusumCAssignInstallation ───────── */
export function UPKusumCAssignInstallation() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('id') || searchParams.get('edit');
  const isEditMode = Boolean(editId);

  // Form fields matching Karnataka SWP pattern
  const [selectedVendor, setSelectedVendor] = useState<string>('');
  const [selectedVolume, setSelectedVolume] = useState<string>('3');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('');
  const [selectedApplicantIds, setSelectedApplicantIds] = useState<number[]>([]);
  const [customApplicantName, setCustomApplicantName] = useState<string>('');
  const [deadlineDate, setDeadlineDate] = useState<string>('');
  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | undefined>(undefined);
  const [remarks, setRemarks] = useState<string>('');

  // Datasets
  const [applicants, setApplicants] = useState<UPApplicantSite[]>([]);
  const [applicantFilterQuery, setApplicantFilterQuery] = useState<string>('');

  // Status & Validation
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Section refs for navigation pills (matching Karnataka SWP standard)
  const sec1 = useRef<HTMLDivElement>(null);
  const sec2 = useRef<HTMLDivElement>(null);
  const sec3 = useRef<HTMLDivElement>(null);
  const sec4 = useRef<HTMLDivElement>(null);

  const scrollTo = (ref: React.RefObject<HTMLDivElement | null>) => {
    ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const clearError = (name: string) => {
    setValidationErrors((prev) => {
      if (!prev[name]) return prev;
      const next = { ...prev };
      delete next[name];
      return next;
    });
  };

  // When district changes, load or generate available applicant farmers for that district
  useEffect(() => {
    if (!selectedDistrict) {
      setApplicants([]);
      setSelectedApplicantIds([]);
      return;
    }

    // Check if initial assign records already have farmers for this district
    const existingFarmers: UPApplicantSite[] = [];
    INITIAL_ASSIGN_DATA.forEach((rec) => {
      if (rec.district.toLowerCase() === selectedDistrict.toLowerCase() && Array.isArray(rec.farmers)) {
        rec.farmers.forEach((f) => {
          existingFarmers.push({
            id: f.id,
            farmer_name: f.farmer_name,
            father_name: 'Farmer Partner',
            application_no: `UP-KC-${rec.id}-${f.id}`,
            village: f.village || 'Village Area',
            block: f.block || 'Block Area',
            district: rec.district,
            pump_capacity: '7.5 HP',
            contact: f.contact,
          });
        });
      }
    });

    const generated = generateUPApplicantsForDistrict(selectedDistrict);
    const combined = [...existingFarmers, ...generated];
    setApplicants(combined);
    setSelectedApplicantIds([]);
  }, [selectedDistrict]);

  const handleToggleApplicant = (id: number) => {
    setSelectedApplicantIds((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
    clearError('applicant');
  };

  const handleSelectAll = () => {
    if (selectedApplicantIds.length === applicants.length && applicants.length > 0) {
      setSelectedApplicantIds([]);
    } else {
      setSelectedApplicantIds(applicants.map((a) => a.id));
      clearError('applicant');
    }
  };

  const filteredApplicants = useMemo(() => {
    const q = applicantFilterQuery.trim().toLowerCase();
    if (!q) return applicants;
    return applicants.filter((a) => {
      const name = a.farmer_name || '';
      const father = a.father_name || '';
      const appNo = a.application_no || '';
      const village = a.village || '';
      const block = a.block || '';
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

  // Validation
  const validate = () => {
    const errs: Record<string, string> = {};
    if (!selectedVendor) errs.vendor = 'Vendor Name is required.';
    if (!selectedVolume) errs.volume = 'Volume is required.';
    if (!selectedDistrict) errs.district = 'District is required.';
    if (selectedApplicantIds.length === 0 && !customApplicantName.trim()) {
      errs.applicant = 'Please choose at least one Applicant site or enter Applicant Name.';
    }
    if (!deadlineDate) errs.deadlineDate = 'Deadline Date is required.';
    if (!editId && !file) errs.file = 'Please upload the work order assignment file.';
    setValidationErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Submit Handler matching Karnataka SWP
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!validate()) {
      setErrorMsg('Please correct the highlighted fields before submitting.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setSubmitting(true);

    const chosenApplicantNames = applicants
      .filter((a) => selectedApplicantIds.includes(a.id))
      .map((a) => a.farmer_name);

    if (customApplicantName.trim() && !chosenApplicantNames.includes(customApplicantName.trim())) {
      chosenApplicantNames.push(customApplicantName.trim());
    }

    const applicantDisplay =
      chosenApplicantNames.length > 0 ? chosenApplicantNames.join(' / ') : 'Farmer Partner';

    setTimeout(() => {
      setSubmitting(false);
      setSuccessMsg(
        `Installation successfully assigned to vendor "${selectedVendor}" for applicant(s) "${applicantDisplay}" in ${selectedDistrict}, UP (Volume ${selectedVolume})!`
      );
      window.scrollTo({ top: 0, behavior: 'smooth' });

      // Save locally to reflect in View Assign list
      try {
        const newRecord: UPKusumCAssignRecord = {
          id: Date.now(),
          vendor: selectedVendor,
          assign_date: new Date().toISOString().slice(0, 10),
          state: 'Uttar Pradesh',
          district: selectedDistrict,
          applicant_name: applicantDisplay,
          deadline_date: deadlineDate,
          site_count: Math.max(1, selectedApplicantIds.length || 1),
          file: file ? file.name : 'assignment_wo.pdf',
          remarks: remarks || 'Assigned via Kusum C portal',
          status: 'Assigned',
          farmers: selectedApplicantIds.map((sid) => {
            const match = applicants.find((a) => a.id === sid);
            return {
              id: sid,
              farmer_name: match?.farmer_name || applicantDisplay,
              contact: match?.contact || '+91 94500 00000',
              village: match?.village || 'Village',
              block: match?.block || 'Block',
              deadline_date: deadlineDate,
              bos: 'No',
              vfd: 'No',
              inverter: 'No',
              structure: 'No',
              remarks: remarks,
            };
          }),
        };

        const existingRaw = localStorage.getItem('up_kusumc_assigned_installations');
        const list = existingRaw ? JSON.parse(existingRaw) : [];
        list.unshift(newRecord);
        localStorage.setItem('up_kusumc_assigned_installations', JSON.stringify(list));
      } catch (err) {
        console.warn('LocalStorage save error:', err);
      }

      // Navigate to View Assign page after brief delay
      setTimeout(() => {
        navigate('/vendor-management/up/kusumc/installation/view-assign');
      }, 1400);
    }, 700);
  };

  const handleReset = () => {
    setSelectedVendor('');
    setSelectedVolume('3');
    setSelectedDistrict('');
    setSelectedApplicantIds([]);
    setCustomApplicantName('');
    setDeadlineDate('');
    setRemarks('');
    setFile(null);
    if (filePreview) URL.revokeObjectURL(filePreview);
    setFilePreview(undefined);
    setValidationErrors({});
    setErrorMsg('');
    setSuccessMsg('');
  };

  return (
    <div className="ax-page swp-inst-form">
      <style>{SINGLE_CARD_FORM_CSS}</style>

      {/* Page Head matching Karnataka SWP standard */}
      <PageHead
        title="Assign UP Kusum C Installation"
        subtitle="The field labels marked with * are required input fields."
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Vendor Management', href: '/vendor-management' },
          { label: 'Uttar Pradesh', href: '/vendor-management/up' },
          { label: 'Kusum C', href: '/vendor-management/up/kusumc/installation/dashboard' },
          { label: 'Assign UP Kusum C Installation' },
        ]}
        actions={
          <Link
            to="/vendor-management/up/kusumc/installation/view-assign"
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

      {/* Main Single Card Form matching Karnataka SWP layout */}
      <form onSubmit={handleSubmit} className="ax-card" noValidate>
        {/* Header with Section Pills */}
        <div className="ax-card__header">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
            <div>
              <h2 className="ax-card__title" style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: 'var(--ax-text-strong, #0f172a)' }}>
                {isEditMode ? `Edit Assigned Installation #${editId}` : 'Assign UP Kusum C Installation'}
              </h2>
              <p className="ax-card__subtitle" style={{ fontSize: '0.85rem', color: '#ef4444', margin: '4px 0 0' }}>
                The field labels marked with * are required input fields.
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {selectedApplicantIds.length > 0 && (
                <span className="ax-badge ax-badge--soft ax-badge--info" style={{ fontWeight: 600, padding: '4px 12px', fontSize: 12 }}>
                  {selectedApplicantIds.length} Site(s) Selected
                </span>
              )}
              {selectedVendor && (
                <span className="ax-badge ax-badge--soft ax-badge--info" style={{ fontWeight: 600, padding: '4px 12px', fontSize: 12 }}>
                  Vendor: {selectedVendor}
                </span>
              )}
            </div>
          </div>

          {/* Quick Nav Pills matching Karnataka SWP */}
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
              <div>
                <div className="ax-float">
                  <select
                    id="vendor_select"
                    className={`ax-float__input ${validationErrors.vendor ? 'is-invalid' : ''}`}
                    value={selectedVendor}
                    onChange={(e) => {
                      setSelectedVendor(e.target.value);
                      clearError('vendor');
                    }}
                    disabled={submitting}
                    required
                  >
                    <option value="">-- Select Vendor --</option>
                    {UP_KUSUM_C_VENDORS.map((v) => (
                      <option key={v.id} value={v.name}>
                        {v.name}
                      </option>
                    ))}
                  </select>
                  <label htmlFor="vendor_select" className="ax-float__label floating">
                    Vendor Name <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                </div>
                {validationErrors.vendor && <div className="kswp-field-error">{validationErrors.vendor}</div>}
              </div>

              {/* Volume * */}
              <div>
                <div className="ax-float">
                  <select
                    id="volume_select"
                    className={`ax-float__input ${validationErrors.volume ? 'is-invalid' : ''}`}
                    value={selectedVolume}
                    onChange={(e) => {
                      setSelectedVolume(e.target.value);
                      clearError('volume');
                    }}
                    disabled={submitting}
                    required
                  >
                    <option value="">-- Select Volume --</option>
                    {UP_KUSUM_C_VOLUMES.map((vol) => (
                      <option key={vol.id} value={vol.name}>
                        {vol.name}
                      </option>
                    ))}
                  </select>
                  <label htmlFor="volume_select" className="ax-float__label floating">
                    Volume <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                </div>
                {validationErrors.volume && <div className="kswp-field-error">{validationErrors.volume}</div>}
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
              <div className="ax-float">
                <select
                  id="district_select"
                  className={`ax-float__input ${validationErrors.district ? 'is-invalid' : ''}`}
                  value={selectedDistrict}
                  onChange={(e) => {
                    setSelectedDistrict(e.target.value);
                    clearError('district');
                  }}
                  disabled={!selectedVolume || submitting}
                  required
                >
                  <option value="">
                    {!selectedVolume ? '-- Select Volume First --' : '-- Select District --'}
                  </option>
                  {UP_DISTRICTS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
                <label htmlFor="district_select" className="ax-float__label floating">
                  District <span style={{ color: '#ef4444' }}>*</span>
                </label>
              </div>
              {validationErrors.district && <div className="kswp-field-error">{validationErrors.district}</div>}
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
                    className="ax-btn ax-btn--secondary ax-btn--sm"
                    style={{ fontSize: 11, padding: '3px 10px' }}
                  >
                    {selectedApplicantIds.length === applicants.length ? 'Deselect All' : 'Select All'}
                  </button>
                </div>
              )}
            </div>

            {/* Quick dropdown for Applicant Name matching Karnataka SWP */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: 16 }}>
              <div className="ax-float">
                <select
                  id="applicant_dropdown"
                  className="ax-float__input"
                  value=""
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    if (val && !selectedApplicantIds.includes(val)) {
                      setSelectedApplicantIds((prev) => [...prev, val]);
                      clearError('applicant');
                    }
                  }}
                  disabled={!selectedDistrict || applicants.length === 0 || submitting}
                >
                  <option value="">
                    {!selectedDistrict
                      ? '-- Select District First --'
                      : applicants.length === 0
                      ? 'No applicant available'
                      : '-- Select Applicant Name --'}
                  </option>
                  {applicants.map((a) => {
                    const name = a.farmer_name || `Applicant #${a.id}`;
                    const father = a.father_name;
                    const loc = [a.block, a.village].filter(Boolean).join(', ');
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

              {/* Or manual applicant name entry */}
              <div className="ax-float">
                <input
                  type="text"
                  id="custom_applicant"
                  className="ax-float__input"
                  placeholder="Or enter applicant name manually"
                  value={customApplicantName}
                  onChange={(e) => {
                    setCustomApplicantName(e.target.value);
                    clearError('applicant');
                  }}
                  disabled={submitting}
                />
                <label htmlFor="custom_applicant" className={`ax-float__label ${customApplicantName ? 'floating' : ''}`}>
                  Custom / Direct Applicant Name
                </label>
              </div>
            </div>

            {validationErrors.applicant && (
              <div className="kswp-field-error" style={{ marginBottom: 12 }}>
                {validationErrors.applicant}
              </div>
            )}

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
                No applicant available for {selectedDistrict}
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
                    style={{ width: '100%', padding: '6px 12px', fontSize: 12, borderRadius: 6 }}
                  />
                </div>

                <div style={{ maxHeight: 260, overflowY: 'auto', padding: 10 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 10 }}>
                    {filteredApplicants.map((a) => {
                      const isSelected = selectedApplicantIds.includes(a.id);
                      const name = a.farmer_name || `Applicant #${a.id}`;
                      const father = a.father_name;
                      const appNo = a.application_no || `UP-KC-${a.id}`;
                      const loc = [a.block, a.village].filter(Boolean).join(', ') || selectedDistrict;

                      return (
                        <div
                          key={a.id}
                          onClick={() => handleToggleApplicant(a.id)}
                          style={{
                            padding: '8px 12px',
                            borderRadius: 8,
                            border: `1.5px solid ${isSelected ? '#3b82f6' : 'var(--ax-border, #e2e8f0)'}`,
                            background: isSelected ? '#eff6ff' : 'var(--ax-surface-solid, #ffffff)',
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
                  onChange={(e) => {
                    setDeadlineDate(e.target.value);
                    clearError('deadlineDate');
                  }}
                  disabled={submitting}
                  required
                  error={validationErrors.deadlineDate}
                />
              </div>

              {/* Remarks */}
              <div>
                <FloatingInput
                  label="Remarks"
                  name="remarks"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  disabled={submitting}
                  placeholder="Optional assignment remarks"
                />
              </div>
            </div>

            {/* File Dropzone matching Karnataka SWP standard */}
            <div style={{ maxWidth: 540 }}>
              <UploadDropzone
                id="assign_file"
                label="File"
                required={true}
                accept=".pdf,.jpg,.jpeg,.png,.xlsx,.csv"
                disabled={submitting}
                file={file}
                preview={filePreview}
                error={validationErrors.file}
                onSelect={(selected) => {
                  setFile(selected);
                  clearError('file');
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

          {/* Submit Footer matching Karnataka SWP standard */}
          <div
            style={{
              marginTop: '32px',
              paddingTop: '20px',
              borderTop: '1px solid var(--ax-border, #e2e8f0)',
              display: 'flex',
              justifyContent: 'flex-end',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            <button
              type="button"
              className="ax-btn ax-btn--secondary"
              onClick={handleReset}
              disabled={submitting}
            >
              Reset
            </button>
            <Link to="/vendor-management/up/kusumc/installation/view-assign" className="ax-btn ax-btn--secondary">
              Cancel
            </Link>
            <button
              type="submit"
              className="ax-btn ax-btn--primary"
              disabled={submitting}
              style={{
                minWidth: 180,
                fontWeight: 700,
              }}
            >
              {submitting ? (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                  <span className="ax-spinner" /> Assigning...
                </span>
              ) : isEditMode ? (
                'Update Assigned Installation'
              ) : (
                'Assign UP Kusum C Installation'
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

export default UPKusumCAssignInstallation;
