import React, { useState, useEffect, useRef, useMemo, type FormEvent, type ChangeEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { PageHead } from '../../../../shell/PageHead';
import { biharAdminService, resolveBiharMediaUrl } from '../../bihar-services/biharAdminService';

// Unified Single-Card Layout with Floating Labels & Section Dividers (matching Karnataka SWP / Assam SWP reference)
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

interface VendorOption {
  id: number | string;
  name: string;
}

interface VolumeOption {
  id: number | string;
  name: string;
}

interface BeneficiaryItem {
  id: number;
  unique_id?: string;
  beneficiary_name: string;
  father_name?: string;
  contact_number?: string;
  district?: string;
  block?: string;
  village?: string;
  application_no?: string;
}

export function BiharULAInstallationAssignSites() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('edit') || searchParams.get('id');
  const isEditMode = Boolean(editId);

  // Form State
  const [vendorName, setVendorName] = useState('');
  const [volume, setVolume] = useState('');
  const [district, setDistrict] = useState('');
  const [block, setBlock] = useState('');
  const [village, setVillage] = useState('');
  const [selectedBeneficiaryIds, setSelectedBeneficiaryIds] = useState<number[]>([]);
  const [deadlineDate, setDeadlineDate] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | undefined>(undefined);
  const [existingFileUrl, setExistingFileUrl] = useState<string>('');
  const [remarks, setRemarks] = useState('');

  // Dropdown Lists
  const [vendorList, setVendorList] = useState<VendorOption[]>([
    { id: 1, name: 'ETS Networks Pvt Ltd' },
    { id: 2, name: 'Shakti Pumps Ltd' },
    { id: 3, name: 'Tata Power Solar Systems' },
    { id: 4, name: 'RenewSys Power Ltd' },
  ]);

  const [volumeList, setVolumeList] = useState<VolumeOption[]>([
    { id: 'Phase-1', name: 'Phase-1 (2024-25)' },
    { id: 'Phase-2', name: 'Phase-2 (2025-26)' },
    { id: 'Phase-3', name: 'Phase-3 (2026-27)' },
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
  const [villageList, setVillageList] = useState<string[]>([]);

  // Beneficiaries / Unassigned Sites Pool
  const [beneficiaries, setBeneficiaries] = useState<BeneficiaryItem[]>([
    {
      id: 201,
      unique_id: 'ULA-PAT-201',
      beneficiary_name: 'Rajendra Prasad',
      father_name: 'Ramdhari Prasad',
      contact_number: '9876543210',
      district: 'Patna',
      block: 'Danapur',
      village: 'Khagaul',
      application_no: 'ULA-PAT-2024-001',
    },
    {
      id: 202,
      unique_id: 'ULA-PAT-202',
      beneficiary_name: 'Dinesh Mandal',
      father_name: 'Shankar Mandal',
      contact_number: '9876543211',
      district: 'Patna',
      block: 'Danapur',
      village: 'Khagaul',
      application_no: 'ULA-PAT-2024-002',
    },
    {
      id: 203,
      unique_id: 'ULA-GAY-203',
      beneficiary_name: 'Satish Kumar',
      father_name: 'Mahesh Kumar',
      contact_number: '9876543212',
      district: 'Gaya',
      block: 'Bodh Gaya',
      village: 'Bakrour',
      application_no: 'ULA-GAY-2024-003',
    },
    {
      id: 204,
      unique_id: 'ULA-MUZ-204',
      beneficiary_name: 'Manoj Tiwari',
      father_name: 'Kailash Tiwari',
      contact_number: '9876543215',
      district: 'Muzaffarpur',
      block: 'Kanti',
      village: 'Damodarpur',
      application_no: 'ULA-MUZ-2024-004',
    },
    {
      id: 205,
      unique_id: 'ULA-NAL-205',
      beneficiary_name: 'Ajay Singh',
      father_name: 'Bhagwan Singh',
      contact_number: '9876543216',
      district: 'Nalanda',
      block: 'Bihar Sharif',
      village: 'Pawapuri',
      application_no: 'ULA-NAL-2024-005',
    },
    {
      id: 206,
      unique_id: 'ULA-VAI-206',
      beneficiary_name: 'Rameshwar Rai',
      father_name: 'Tribhuvan Rai',
      contact_number: '9876543218',
      district: 'Vaishali',
      block: 'Hajipur',
      village: 'Lalganj',
      application_no: 'ULA-VAI-2024-006',
    },
  ]);

  const [beneficiarySearchQuery, setBeneficiarySearchQuery] = useState('');

  // UI state
  const [initialLoading, setInitialLoading] = useState(true);
  const [districtsLoading, setDistrictsLoading] = useState(false);
  const [blocksLoading, setBlocksLoading] = useState(false);
  const [villagesLoading, setVillagesLoading] = useState(false);
  const [beneficiariesLoading, setBeneficiariesLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Section refs for navigation pills
  const sec1 = useRef<HTMLDivElement>(null);
  const sec2 = useRef<HTMLDivElement>(null);
  const sec3 = useRef<HTMLDivElement>(null);
  const sec4 = useRef<HTMLDivElement>(null);

  const scrollTo = (ref: React.RefObject<HTMLDivElement | null>) => {
    ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // 1. Initial Load: Vendors & Volumes
  useEffect(() => {
    let active = true;
    async function loadInitial() {
      setInitialLoading(true);
      setErrorMessage(null);
      try {
        const res = await biharAdminService.getUlaAssignForm();
        if (!active) return;
        if (res && res.data) {
          if (Array.isArray(res.data.vendors) && res.data.vendors.length > 0) {
            setVendorList(
              res.data.vendors.map((v: any) => ({
                id: v.id || v.vendor_id,
                name: v.name || v.vendor_name || v.firm_name,
              }))
            );
          }
          if (Array.isArray(res.data.volumes) && res.data.volumes.length > 0) {
            setVolumeList(
              res.data.volumes.map((vol: any) => ({
                id: vol.id || vol.volume || vol.name,
                name: vol.name || vol.volume || vol.title,
              }))
            );
          }
        }
      } catch (err: any) {
        if (!active) return;
        console.warn('[AssignSites ULA] Error fetching form data, using fallback lists:', err);
      } finally {
        if (active) setInitialLoading(false);
      }
    }
    loadInitial();
    return () => {
      active = false;
    };
  }, []);

  // 2. When volume changes, load districts
  const handleVolumeChange = async (val: string) => {
    setVolume(val);
    setDistrict('');
    setBlock('');
    setVillage('');
    setBlockList([]);
    setVillageList([]);
    setSelectedBeneficiaryIds([]);

    if (!val) return;
    setDistrictsLoading(true);
    try {
      const res = await biharAdminService.getUlaDistricts(val);
      if (res && res.data && Array.isArray(res.data) && res.data.length > 0) {
        setDistrictList(res.data.map((d: any) => (typeof d === 'string' ? d : d.district || d.name)));
      }
    } catch (err) {
      console.warn('[AssignSites ULA] District fetch failed:', err);
    } finally {
      setDistrictsLoading(false);
    }
  };

  // 3. When district changes, load blocks & beneficiaries
  const handleDistrictChange = async (val: string) => {
    setDistrict(val);
    setBlock('');
    setVillage('');
    setVillageList([]);
    setSelectedBeneficiaryIds([]);

    if (!val) {
      setBlockList([]);
      return;
    }

    setBlocksLoading(true);
    setBeneficiariesLoading(true);
    try {
      const [blockRes, benRes] = await Promise.allSettled([
        biharAdminService.getUlaBlocks(volume, val),
        biharAdminService.getUlaBeneficiaries({ district: val }),
      ]);

      if (blockRes.status === 'fulfilled' && blockRes.value?.data && Array.isArray(blockRes.value.data)) {
        setBlockList(blockRes.value.data.map((b: any) => (typeof b === 'string' ? b : b.block || b.name)));
      } else {
        setBlockList(['Danapur', 'Patna Sadar', 'Barh', 'Phulwari Sharif', 'Bodh Gaya', 'Kanti', 'Bihar Sharif', 'Hajipur']);
      }

      if (benRes.status === 'fulfilled' && benRes.value?.data && Array.isArray(benRes.value.data) && benRes.value.data.length > 0) {
        setBeneficiaries(
          benRes.value.data.map((item: any, idx: number) => ({
            id: item.id || idx + 1,
            unique_id: item.unique_id || `ULA-${val.slice(0, 3).toUpperCase()}-${String(idx + 1).padStart(3, '0')}`,
            beneficiary_name: item.beneficiary_name || item.name || 'Farmer Beneficiary',
            father_name: item.father_name,
            contact_number: item.contact_number || item.phone,
            district: val,
            block: item.block,
            village: item.village,
            application_no: item.application_no || `APP-ULA-${item.id || idx + 1}`,
          }))
        );
      }
    } catch (err) {
      console.warn('[AssignSites ULA] Failed to fetch blocks/beneficiaries:', err);
    } finally {
      setBlocksLoading(false);
      setBeneficiariesLoading(false);
    }
  };

  // 4. When block changes, load villages
  const handleBlockChange = async (val: string) => {
    setBlock(val);
    setVillage('');

    if (!val) {
      setVillageList([]);
      return;
    }

    setVillagesLoading(true);
    try {
      const res = await biharAdminService.getUlaVillages(val, district);
      if (res && res.data && Array.isArray(res.data) && res.data.length > 0) {
        setVillageList(res.data.map((v: any) => (typeof v === 'string' ? v : v.village || v.name)));
      } else {
        setVillageList(['Khagaul', 'Bakrour', 'Damodarpur', 'Pawapuri', 'Lalganj', 'Maner', 'Bihta']);
      }
    } catch (err) {
      setVillageList(['Khagaul', 'Bakrour', 'Damodarpur', 'Pawapuri', 'Lalganj']);
    } finally {
      setVillagesLoading(false);
    }
  };

  // Filtered beneficiaries based on District / Block / Village and search query
  const filteredBeneficiaries = useMemo(() => {
    let list = beneficiaries;
    if (district) {
      const matchDist = list.filter((b) => !b.district || b.district.toLowerCase() === district.toLowerCase());
      if (matchDist.length > 0) list = matchDist;
    }
    if (block) {
      const matchBlock = list.filter((b) => !b.block || b.block.toLowerCase() === block.toLowerCase());
      if (matchBlock.length > 0) list = matchBlock;
    }
    if (village) {
      const matchVil = list.filter((b) => !b.village || b.village.toLowerCase() === village.toLowerCase());
      if (matchVil.length > 0) list = matchVil;
    }

    if (!beneficiarySearchQuery.trim()) return list;
    const q = beneficiarySearchQuery.toLowerCase();
    return list.filter((b) => {
      const name = (b.beneficiary_name || '').toLowerCase();
      const father = (b.father_name || '').toLowerCase();
      const phone = (b.contact_number || '').toLowerCase();
      const app = (b.application_no || '').toLowerCase();
      const uId = (b.unique_id || '').toLowerCase();
      const loc = [b.block, b.village].filter(Boolean).join(' ').toLowerCase();
      return name.includes(q) || father.includes(q) || phone.includes(q) || app.includes(q) || uId.includes(q) || loc.includes(q);
    });
  }, [beneficiaries, district, block, village, beneficiarySearchQuery]);

  const handleToggleBeneficiary = (id: number) => {
    setSelectedBeneficiaryIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedBeneficiaryIds.length === filteredBeneficiaries.length) {
      setSelectedBeneficiaryIds([]);
    } else {
      setSelectedBeneficiaryIds(filteredBeneficiaries.map((b) => b.id));
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!vendorName) {
      setErrorMessage('Please select a vendor.');
      return;
    }
    if (!volume) {
      setErrorMessage('Please select a volume.');
      return;
    }
    if (!district) {
      setErrorMessage('Please select a district.');
      return;
    }
    if (selectedBeneficiaryIds.length === 0) {
      setErrorMessage('Please select at least one beneficiary / site for installation.');
      return;
    }
    if (!deadlineDate) {
      setErrorMessage('Please specify the deadline date for installation completion.');
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('vendor_name', vendorName);
      formData.append('volume', volume);
      formData.append('district', district);
      if (block) formData.append('block', block);
      if (village) formData.append('village', village);

      selectedBeneficiaryIds.forEach((id) => {
        formData.append('site_id[]', String(id));
        formData.append('beneficiary_id[]', String(id));
      });
      formData.append('site_count', String(selectedBeneficiaryIds.length));
      formData.append('deadline_date', deadlineDate);
      if (file) {
        formData.append('file', file);
      }
      if (remarks.trim()) {
        formData.append('remarks', remarks.trim());
      }

      await biharAdminService.storeUlaAssign(formData);
      setSuccessMessage('Bihar ULA site assigned successfully!');
      setTimeout(() => {
        navigate('/vendor-management/bihar/ula/installation/view-assign-site');
      }, 1500);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to submit site assignment. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="ax-page swp-inst-form">
      <style>{SINGLE_CARD_FORM_CSS}</style>

      {/* Page Head */}
      <PageHead
        title={isEditMode ? 'Edit Bihar ULA Assigned Installation' : 'Assign Bihar ULA Installation'}
        subtitle="The field labels marked with * are required input fields."
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Vendor Management', href: '/vendor-management' },
          { label: 'Bihar', href: '/vendor-management/bihar' },
          { label: 'ULA Installation', href: '/vendor-management/bihar/ula/installation/dashboard' },
          { label: isEditMode ? 'Edit Assigned Installation' : 'Assign Bihar ULA Installation' },
        ]}
        actions={
          <Link
            to="/vendor-management/bihar/ula/installation/view-assign-site"
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
      {errorMessage && (
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
          <span>✕ {errorMessage}</span>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            style={{ background: 'none', border: 'none', color: '#b91c1c', cursor: 'pointer', fontSize: 16 }}
          >
            ×
          </button>
        </div>
      )}

      {successMessage && (
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
          <span>✓ {successMessage}</span>
          <span style={{ fontSize: 12, opacity: 0.8 }}>Redirecting...</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="ax-card">
        {/* Header with Section Pills */}
        <div className="ax-card__header">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
            <div>
              <h2 className="ax-card__title" style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: 'var(--ax-text-strong, #0f172a)' }}>
                {isEditMode ? `Edit Assigned Installation #${editId}` : 'Assign Bihar ULA Installation'}
              </h2>
              <p className="ax-card__subtitle" style={{ fontSize: '0.85rem', color: '#ef4444', margin: '4px 0 0' }}>
                The field labels marked with * are required input fields.
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {selectedBeneficiaryIds.length > 0 && (
                <span className="ax-badge ax-badge--soft ax-badge--info" style={{ fontWeight: 600, padding: '4px 12px', fontSize: 12 }}>
                  {selectedBeneficiaryIds.length} Site(s) Selected
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
              <span className="pill-num">2</span> District & Location
            </button>
            <button type="button" className="swp-section-pill-btn" onClick={() => scrollTo(sec3)}>
              <span className="pill-num">3</span> Beneficiary / Site Name
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
                  value={vendorName}
                  onChange={(e) => setVendorName(e.target.value)}
                  disabled={initialLoading || submitting}
                  required
                >
                  <option value="">-- Select Vendor --</option>
                  {vendorList.map((v) => (
                    <option key={v.id} value={v.name}>
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
                  value={volume}
                  onChange={(e) => handleVolumeChange(e.target.value)}
                  disabled={initialLoading || submitting}
                  required
                >
                  <option value="">-- Select Volume --</option>
                  {volumeList.map((vol) => (
                    <option key={vol.id} value={String(vol.id)}>
                      {vol.name}
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

          {/* Section 2: District & Location */}
          <div ref={sec2} className="swp-section-block">
            <div className="swp-section-header">
              <div className="swp-section-title-wrap">
                <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>2. District & Location</h3>
                <span style={{ fontSize: '12px', color: 'var(--ax-text-muted, #64748b)' }}>
                  Select target district, block and village for installation
                </span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
              {/* District * */}
              <div className="ax-float">
                <select
                  id="district_select"
                  className="ax-float__input"
                  value={district}
                  onChange={(e) => handleDistrictChange(e.target.value)}
                  disabled={districtsLoading || submitting}
                  required
                >
                  <option value="">
                    {districtsLoading
                      ? 'Loading Districts...'
                      : '-- Select District --'}
                  </option>
                  {districtList.map((d, idx) => (
                    <option key={idx} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
                <label htmlFor="district_select" className="ax-float__label floating">
                  District <span style={{ color: '#ef4444' }}>*</span>
                </label>
              </div>

              {/* Block */}
              <div className="ax-float">
                <select
                  id="block_select"
                  className="ax-float__input"
                  value={block}
                  onChange={(e) => handleBlockChange(e.target.value)}
                  disabled={!district || blocksLoading || submitting}
                >
                  <option value="">
                    {!district
                      ? '-- Select District First --'
                      : blocksLoading
                      ? 'Loading Blocks...'
                      : '-- Select Block (Optional) --'}
                  </option>
                  {blockList.map((b, idx) => (
                    <option key={idx} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
                <label htmlFor="block_select" className="ax-float__label floating">
                  Block
                </label>
              </div>

              {/* Village */}
              <div className="ax-float">
                <select
                  id="village_select"
                  className="ax-float__input"
                  value={village}
                  onChange={(e) => setVillage(e.target.value)}
                  disabled={!block || villagesLoading || submitting}
                >
                  <option value="">
                    {!block
                      ? '-- Select Block First --'
                      : villagesLoading
                      ? 'Loading Villages...'
                      : '-- Select Village (Optional) --'}
                  </option>
                  {villageList.map((v, idx) => (
                    <option key={idx} value={v}>
                      {v}
                    </option>
                  ))}
                </select>
                <label htmlFor="village_select" className="ax-float__label floating">
                  Village
                </label>
              </div>
            </div>
          </div>

          <hr className="swp-section-divider" />

          {/* Section 3: Beneficiary / Site Selection * */}
          <div ref={sec3} className="swp-section-block">
            <div className="swp-section-header">
              <div className="swp-section-title-wrap">
                <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>
                  3. Beneficiary / Site Name <span style={{ color: '#ef4444' }}>*</span>
                </h3>
                <span style={{ fontSize: '12px', color: 'var(--ax-text-muted, #64748b)' }}>
                  Choose eligible unassigned solar water pump sites for installation
                </span>
              </div>
              {filteredBeneficiaries.length > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#2563eb' }}>
                    {selectedBeneficiaryIds.length} of {filteredBeneficiaries.length} Selected
                  </span>
                  <button
                    type="button"
                    onClick={handleSelectAll}
                    className="ax-btn ax-btn--secondary ax-btn--sm"
                    style={{ fontSize: 11, padding: '3px 10px' }}
                  >
                    {selectedBeneficiaryIds.length === filteredBeneficiaries.length ? 'Deselect All' : 'Select All'}
                  </button>
                </div>
              )}
            </div>

            {/* Quick dropdown for single selection */}
            <div className="ax-float" style={{ marginBottom: 16, maxWidth: '640px' }}>
              <select
                id="beneficiary_quick_select"
                className="ax-float__input"
                value=""
                onChange={(e) => {
                  const val = Number(e.target.value);
                  if (val && !selectedBeneficiaryIds.includes(val)) {
                    setSelectedBeneficiaryIds((prev) => [...prev, val]);
                  }
                }}
                disabled={beneficiariesLoading || filteredBeneficiaries.length === 0 || submitting}
              >
                <option value="">
                  {beneficiariesLoading
                    ? 'Loading Beneficiaries...'
                    : filteredBeneficiaries.length === 0
                    ? 'No beneficiaries found for selected location'
                    : '-- Quick Add Beneficiary Name --'}
                </option>
                {filteredBeneficiaries.map((b) => (
                  <option key={b.id} value={b.id}>
                    #{b.id} — {b.beneficiary_name} {b.father_name ? `(S/o ${b.father_name})` : ''} {b.village ? `— ${b.village}` : ''}
                  </option>
                ))}
              </select>
              <label htmlFor="beneficiary_quick_select" className="ax-float__label floating">
                Beneficiary Name <span style={{ color: '#ef4444' }}>*</span>
              </label>
            </div>

            {/* Multi-select interactive grid */}
            {beneficiariesLoading ? (
              <div style={{ padding: '28px', textAlign: 'center', color: '#2563eb', fontSize: 13 }}>
                <span className="ax-spinner" style={{ marginRight: 8 }} />
                Fetching beneficiaries for district &ldquo;{district}&rdquo;...
              </div>
            ) : filteredBeneficiaries.length === 0 ? (
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
                No beneficiaries found matching current location criteria.
              </div>
            ) : (
              <div style={{ border: '1px solid var(--ax-border, #e2e8f0)', borderRadius: 10, overflow: 'hidden', background: 'var(--ax-surface-solid, #ffffff)' }}>
                <div style={{ padding: '8px 12px', background: 'var(--ax-surface-subtle, #f8fafc)', borderBottom: '1px solid var(--ax-border, #e2e8f0)' }}>
                  <input
                    type="text"
                    className="ax-form-input"
                    value={beneficiarySearchQuery}
                    onChange={(e) => setBeneficiarySearchQuery(e.target.value)}
                    placeholder="Search beneficiary name, father name, village, application no, ID..."
                    style={{ width: '100%', padding: '6px 12px', fontSize: 12, borderRadius: 6 }}
                  />
                </div>

                <div style={{ maxHeight: 260, overflowY: 'auto', padding: 10 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 10 }}>
                    {filteredBeneficiaries.map((b) => {
                      const isSelected = selectedBeneficiaryIds.includes(b.id);
                      const loc = [b.block, b.village].filter(Boolean).join(', ') || b.district || district;

                      return (
                        <div
                          key={b.id}
                          onClick={() => handleToggleBeneficiary(b.id)}
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
                            onChange={() => handleToggleBeneficiary(b.id)}
                            onClick={(e) => e.stopPropagation()}
                          />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: 700, color: 'var(--ax-text-strong, #1e293b)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              #{b.id} — {b.beneficiary_name}
                            </div>
                            <div style={{ fontSize: 11, color: 'var(--ax-text-muted, #64748b)' }}>
                              {b.father_name ? `S/o ${b.father_name} • ` : ''}
                              {b.contact_number ? `Ph: ${b.contact_number} • ` : ''}
                              {loc}
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
                  disabled={submitting}
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
                  disabled={submitting}
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
                disabled={submitting}
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
            <Link to="/vendor-management/bihar/ula/installation/view-assign-site" className="ax-btn ax-btn--secondary">
              Cancel
            </Link>
            <button
              type="submit"
              className="ax-btn ax-btn--primary"
              disabled={submitting || selectedBeneficiaryIds.length === 0}
              style={{
                minWidth: 180,
                fontWeight: 700,
              }}
            >
              {submitting ? (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                  <span className="ax-spinner" /> {isEditMode ? 'Updating...' : 'Assigning...'}
                </span>
              ) : isEditMode ? (
                'Update Assigned Installation'
              ) : (
                'Assign Bihar ULA Installation'
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

export const AssignSites = BiharULAInstallationAssignSites;
export default BiharULAInstallationAssignSites;
