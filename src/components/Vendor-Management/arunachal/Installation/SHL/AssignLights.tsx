import { useState, useEffect, useRef, useMemo, type FormEvent, type ChangeEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { PageHead } from '../../../../shell/PageHead';
import {
  arunachalAdminService,
  resolveArunachalMediaUrl,
  type VendorItem,
  type VolumeItem,
  type DistrictItem,
  type BlockItem,
  type PanchayatItem,
} from '../../arunachal-services';

// Unified Single-Card Layout with Floating Labels & Section Dividers
const SINGLE_CARD_FORM_CSS = `
.shl-inst-form .ax-card {
  border: 1px solid var(--ax-border, #e2e8f0);
  border-radius: var(--ax-radius-xl, 16px);
  background: var(--ax-surface-solid, #ffffff);
  box-shadow: var(--ax-shadow-sm, 0 1px 2px 0 rgba(0, 0, 0, 0.05));
  overflow: hidden;
}
.shl-inst-form .ax-card__header {
  padding: var(--ax-space-5, 20px) var(--ax-space-6, 24px);
  border-bottom: 1px solid var(--ax-border-subtle, #f1f5f9);
  background: var(--ax-surface-subtle, #f8fafc);
  display: flex;
  flex-direction: column;
  gap: var(--ax-space-4, 16px);
}
.shl-inst-form .ax-card__body { padding: var(--ax-space-6, 24px); }

/* Quick Section Nav Pills */
.shl-section-pills {
  display: flex;
  gap: var(--ax-space-2, 8px);
  overflow-x: auto;
  padding-bottom: 4px;
  scrollbar-width: thin;
}
.shl-section-pill-btn {
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
.shl-section-pill-btn:hover {
  border-color: #2563eb;
  color: #2563eb;
  background: color-mix(in srgb, #2563eb 6%, var(--ax-surface-solid, #ffffff));
}
.shl-section-pill-btn .pill-num {
  width: 18px; height: 18px; border-radius: 50%;
  background: var(--ax-surface-subtle, #f1f5f9);
  display: inline-flex; align-items: center; justify-content: center;
  font-size: 10px; font-weight: 700;
}

/* Section Block */
.shl-section-block { padding-top: var(--ax-space-2, 8px); }
.shl-section-header {
  display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap;
  gap: var(--ax-space-2, 8px);
  margin-bottom: var(--ax-space-5, 20px);
  padding-bottom: var(--ax-space-3, 12px);
  border-bottom: 1px solid var(--ax-border-subtle, #f1f5f9);
}
.shl-section-title-wrap { display: flex; flex-direction: column; gap: 4px; }
.shl-section-divider {
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

/* ───────── Modern Upload Dropzone ───────── */
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
                  style={{ width: 44, height: 44, objectFit: 'cover', borderRadius: 6, border: '1px solid var(--ax-border)' }}
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

export function AssignLights() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('edit') || searchParams.get('id');
  const isEditMode = Boolean(editId);

  // Master datasets
  const [vendors, setVendors] = useState<VendorItem[]>([]);
  const [volumes, setVolumes] = useState<VolumeItem[]>([]);
  const [districts, setDistricts] = useState<DistrictItem[]>([]);
  const [blocks, setBlocks] = useState<BlockItem[]>([]);
  const [panchayats, setPanchayats] = useState<PanchayatItem[]>([]);

  // Form values
  const [selectedVendor, setSelectedVendor] = useState<string>('');
  const [selectedVolume, setSelectedVolume] = useState<string>('');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('');
  const [selectedBlock, setSelectedBlock] = useState<string>('');
  const [selectedPanchayats, setSelectedPanchayats] = useState<string[]>([]);
  const [deadlineDate, setDeadlineDate] = useState<string>('');
  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | undefined>(undefined);
  const [existingFileUrl, setExistingFileUrl] = useState<string>('');
  const [remarks, setRemarks] = useState<string>('');

  // Status & Lock
  const [isAcceptedLocked, setIsAcceptedLocked] = useState<boolean>(false);
  const [recordStatus, setRecordStatus] = useState<number | null>(null);
  const initialLoadedRef = useRef<{ volume?: string; district?: string; block?: string }>({});

  // Loading Status
  const [initialLoading, setInitialLoading] = useState<boolean>(true);
  const [districtsLoading, setDistrictsLoading] = useState<boolean>(false);
  const [blocksLoading, setBlocksLoading] = useState<boolean>(false);
  const [panchayatsLoading, setPanchayatsLoading] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');

  const [panchayatFilterQuery, setPanchayatFilterQuery] = useState<string>('');

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
          const editData = await arunachalAdminService.getEditAssign(editId);
          if (!active) return;
          const assignObj =
            (editData as any).assignShl ||
            (editData as any).assign_shl ||
            (editData as any).assign ||
            (editData as any).assigned ||
            (editData as any).arunachalshl ||
            (editData as any).shl;

          const rawVendors = (editData as any).vendor || (editData as any).vendors || [];
          const rawVolumes = (editData as any).volumes || (editData as any).volume || [];
          const rawDistricts = (editData as any).districts || (editData as any).district || [];
          const rawBlocks = (editData as any).blocks || (editData as any).block || [];
          const rawPanchayats = (editData as any).panchayats || (editData as any).panchayat || [];

          if (assignObj) {
            const vol = assignObj.volume ? String(assignObj.volume) : '';
            const dist = assignObj.district || '';
            const blk = assignObj.block || '';
            initialLoadedRef.current = { volume: vol, district: dist, block: blk };

            setSelectedVendor(assignObj.vendor ? String(assignObj.vendor) : '');
            setSelectedVolume(vol);
            setSelectedDistrict(dist);
            setSelectedBlock(blk);
            setDeadlineDate(
              assignObj.ldate
                ? assignObj.ldate.split(' ')[0]
                : assignObj.deadline_date
                ? assignObj.deadline_date.split(' ')[0]
                : ''
            );
            setRemarks(assignObj.remark || assignObj.remarks || '');
            if ((assignObj as any).file) {
              setExistingFileUrl(resolveArunachalMediaUrl((assignObj as any).file));
            }

            let parsedPanchayats: string[] = [];
            if (Array.isArray(assignObj.panchayat)) {
              parsedPanchayats = assignObj.panchayat.map((p: any) => String(p).trim()).filter(Boolean);
            } else if (typeof assignObj.panchayat === 'string' && assignObj.panchayat.trim()) {
              try {
                const rawParsed = JSON.parse(assignObj.panchayat);
                if (Array.isArray(rawParsed)) {
                  parsedPanchayats = rawParsed.map((p: any) => String(p).trim()).filter(Boolean);
                } else {
                  parsedPanchayats = assignObj.panchayat.split(',').map((p: any) => p.trim()).filter(Boolean);
                }
              } catch {
                parsedPanchayats = assignObj.panchayat.split(',').map((p: any) => p.trim()).filter(Boolean);
              }
            }
            setSelectedPanchayats(parsedPanchayats);

            // Reconcile and ensure all assigned panchayats are in the panchayats list
            const pArr: PanchayatItem[] = Array.isArray(rawPanchayats)
              ? rawPanchayats.map((p: any) => (typeof p === 'string' ? { panchayat: p } : p))
              : [];
            const existingNames = new Set(pArr.map((p) => p.panchayat));
            parsedPanchayats.forEach((name) => {
              if (!existingNames.has(name)) {
                pArr.push({ panchayat: name, count: 1 });
              }
            });

            setVendors(Array.isArray(rawVendors) ? rawVendors : []);
            setVolumes(
              (Array.isArray(rawVolumes) ? rawVolumes : []).map((v: any) =>
                typeof v === 'string' ? { volume: v } : v
              )
            );
            setDistricts(
              (Array.isArray(rawDistricts) ? rawDistricts : []).map((d: any) =>
                typeof d === 'string' ? { district: d } : d
              )
            );
            setBlocks(
              (Array.isArray(rawBlocks) ? rawBlocks : []).map((b: any) =>
                typeof b === 'string' ? { block: b } : b
              )
            );
            setPanchayats(pArr);

            const st = Number((assignObj as any).status);
            setRecordStatus(isNaN(st) ? null : st);
            if (st === 2) {
              setIsAcceptedLocked(true);
            }
          }
        } else {
          const { vendors: vList, volumes: volList } = await arunachalAdminService.getAssignFormData();
          if (!active) return;
          setVendors(vList || []);
          setVolumes(volList || []);
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
    if (isEditMode) return;
    if (!selectedVolume) {
      setDistricts([]);
      setSelectedDistrict('');
      setBlocks([]);
      setSelectedBlock('');
      setPanchayats([]);
      setSelectedPanchayats([]);
      return;
    }

    let active = true;
    const loadDistricts = async () => {
      setDistrictsLoading(true);
      setErrorMsg('');
      try {
        const dList = await arunachalAdminService.fetchDistricts(selectedVolume);
        if (!active) return;
        setDistricts(dList || []);
        setSelectedDistrict('');
        setBlocks([]);
        setSelectedBlock('');
        setPanchayats([]);
        setSelectedPanchayats([]);
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

  // 3. District Change -> Fetch Blocks
  useEffect(() => {
    if (isEditMode) return;
    if (!selectedDistrict || !selectedVolume) {
      setBlocks([]);
      setSelectedBlock('');
      setPanchayats([]);
      setSelectedPanchayats([]);
      return;
    }

    let active = true;
    const loadBlocks = async () => {
      setBlocksLoading(true);
      setErrorMsg('');
      try {
        const bList = await arunachalAdminService.fetchBlocks(selectedVolume, selectedDistrict);
        if (!active) return;
        setBlocks(bList || []);
        setSelectedBlock('');
        setPanchayats([]);
        setSelectedPanchayats([]);
      } catch (err: any) {
        if (!active) return;
        console.error('Blocks fetch error:', err);
        setErrorMsg(err?.message || 'Failed to fetch blocks.');
      } finally {
        if (active) setBlocksLoading(false);
      }
    };
    loadBlocks();
    return () => {
      active = false;
    };
  }, [selectedDistrict, selectedVolume, isEditMode]);

  // 4. Block Change -> Fetch Panchayats
  useEffect(() => {
    if (isEditMode) return;
    if (!selectedBlock || !selectedDistrict || !selectedVolume) {
      setPanchayats([]);
      setSelectedPanchayats([]);
      return;
    }

    let active = true;
    const loadPanchayats = async () => {
      setPanchayatsLoading(true);
      setErrorMsg('');
      try {
        const pList = await arunachalAdminService.fetchPanchayats(selectedVolume, selectedDistrict, selectedBlock);
        if (!active) return;
        setPanchayats(pList || []);
        setSelectedPanchayats([]);
      } catch (err: any) {
        if (!active) return;
        console.error('Panchayats fetch error:', err);
        setErrorMsg(err?.message || 'Failed to fetch panchayats.');
      } finally {
        if (active) setPanchayatsLoading(false);
      }
    };
    loadPanchayats();
    return () => {
      active = false;
    };
  }, [selectedBlock, selectedDistrict, selectedVolume, isEditMode]);

  const handleTogglePanchayat = (name: string) => {
    if (isAcceptedLocked || isEditMode) return;
    setSelectedPanchayats((prev) =>
      prev.includes(name) ? prev.filter((p) => p !== name) : [...prev, name]
    );
  };

  const handleSelectAll = () => {
    if (isAcceptedLocked || isEditMode) return;
    if (selectedPanchayats.length === panchayats.length) {
      setSelectedPanchayats([]);
    } else {
      setSelectedPanchayats(panchayats.map((p) => p.panchayat));
    }
  };

  const filteredPanchayats = useMemo(() => {
    const q = panchayatFilterQuery.trim().toLowerCase();
    if (!q) return panchayats;
    return panchayats.filter((p) => p.panchayat.toLowerCase().includes(q));
  }, [panchayats, panchayatFilterQuery]);

  const selectedLightsTally = useMemo(() => {
    return panchayats
      .filter((p) => selectedPanchayats.includes(p.panchayat))
      .reduce((sum, p) => sum + (Number(p.count) || 0), 0);
  }, [panchayats, selectedPanchayats]);

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
    if (!selectedBlock) return setErrorMsg('Block is required.');
    if (selectedPanchayats.length === 0) return setErrorMsg('Please select at least one panchayat.');
    if (!deadlineDate) return setErrorMsg('Deadline Date is required.');

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('vendor', selectedVendor);
      formData.append('state', 'arunachal');
      formData.append('volume', selectedVolume);
      formData.append('district', selectedDistrict);
      formData.append('block', selectedBlock);
      selectedPanchayats.forEach((panchayatName) => {
        formData.append('panchayat[]', panchayatName);
      });
      formData.append('ldate', deadlineDate);
      if (file) {
        formData.append('file', file);
      }
      if (remarks.trim()) {
        formData.append('remark', remarks.trim());
      }

      let res;
      if (isEditMode && editId) {
        formData.append('id', String(editId));
        res = await arunachalAdminService.updateAssign(formData);
        setSuccessMsg(res.message || 'Assigned Lights Updated Successfully!');
      } else {
        res = await arunachalAdminService.storeAssign(formData);
        setSuccessMsg(res.message || 'Lights Assigned Successfully!');
      }

      setTimeout(() => {
        navigate('/vendor-management/arunachal/shl/view-assign');
      }, 1500);
    } catch (err: any) {
      console.error('Submit assign error:', err);
      setErrorMsg(err?.message || (isEditMode ? 'Failed to update assignment.' : 'Failed to assign lights.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="ax-page shl-inst-form">
      <style>{SINGLE_CARD_FORM_CSS}</style>

      {/* Page Head */}
      <PageHead
        title={isEditMode ? 'Edit Arunachal SHL Assigned Lights' : 'Arunachal Pradesh SHL Installation Assign Lights'}
        subtitle={
          isAcceptedLocked
            ? 'This assignment has been accepted by the vendor (Status 2: Accepted) and is locked for editing.'
            : isEditMode
            ? 'Update deadline date, remarks, and work order document. Territory allocation is locked to this assignment.'
            : 'The field labels marked with * are required input fields.'
        }
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Vendor Management', href: '/vendor-management' },
          { label: 'Arunachal SHL', href: '/vendor-management/arunachal/shl/dashboard' },
          { label: isEditMode ? 'Edit Assigned Lights' : 'Assign Lights' },
        ]}
        actions={
          <Link
            to="/vendor-management/arunachal/shl/view-assign"
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
            View Assigned Lights
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

      {/* Edit Mode Notice Banner */}
      {isEditMode && !isAcceptedLocked && (
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
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ flexShrink: 0, color: '#2563eb' }}
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="16" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12.01" y2="8" />
          </svg>
          <div>
            <div style={{ fontWeight: 700, fontSize: 13, color: '#1d4ed8', marginBottom: 2 }}>
              Edit Mode — Assigned Lights #{editId}
            </div>
            <div>
              Territory & vendor allocation (Vendor, Volume, District, Block, and assigned Panchayats) is locked to this assignment record. You can update the completion deadline date, remarks, and work order file.
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
          <span>{errorMsg}</span>
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
          <span>{successMsg}</span>
          <span style={{ fontSize: 12, opacity: 0.8 }}>Redirecting...</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="ax-card">
        {/* Header with Section Pills */}
        <div className="ax-card__header">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
            <div>
              <h2 className="ax-card__title" style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: 'var(--ax-text-strong, #0f172a)' }}>
                {isEditMode ? `Edit Assigned Lights #${editId}` : 'SHL Installation Assign Lights'}
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
              {selectedPanchayats.length > 0 && (
                <span className="ax-badge ax-badge--soft ax-badge--info" style={{ fontWeight: 600, padding: '4px 12px', fontSize: 12 }}>
                  {selectedPanchayats.length} Panchayat(s) &bull; {selectedLightsTally} Lights
                </span>
              )}
            </div>
          </div>

          {/* Quick Nav Pills */}
          <div className="shl-section-pills">
            <button type="button" className="shl-section-pill-btn" onClick={() => scrollTo(sec1)}>
              <span className="pill-num">1</span> Vendor & Volume
            </button>
            <button type="button" className="shl-section-pill-btn" onClick={() => scrollTo(sec2)}>
              <span className="pill-num">2</span> District & Block
            </button>
            <button type="button" className="shl-section-pill-btn" onClick={() => scrollTo(sec3)}>
              <span className="pill-num">3</span> Panchayat Allocation
            </button>
            <button type="button" className="shl-section-pill-btn" onClick={() => scrollTo(sec4)}>
              <span className="pill-num">4</span> Timeline & Work Order
            </button>
          </div>
        </div>

        <div className="ax-card__body">
          {/* Section 1: Vendor Name & Volume */}
          <div ref={sec1} className="shl-section-block">
            <div className="shl-section-header">
              <div className="shl-section-title-wrap">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>1. Vendor & Volume Allocation</h3>
                  {isEditMode && (
                    <span
                      style={{
                        fontSize: 11,
                        background: '#f1f5f9',
                        color: '#475569',
                        border: '1px solid #cbd5e1',
                        padding: '2px 8px',
                        borderRadius: 4,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                        fontWeight: 600,
                      }}
                    >
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                      </svg>
                      Locked in Edit
                    </span>
                  )}
                </div>
                <span style={{ fontSize: '12px', color: 'var(--ax-text-muted, #64748b)' }}>
                  {isEditMode ? 'Allocated partner vendor and project volume' : 'Select authorized partner vendor and project volume'}
                </span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
              {/* Vendor Name * */}
              <div className="ax-float">
                <select
                  id="vendor_select"
                  className="ax-float__input"
                  value={selectedVendor}
                  onChange={(e) => setSelectedVendor(e.target.value)}
                  disabled={isEditMode || initialLoading || submitting || isAcceptedLocked}
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

              {/* State * (Read only) */}
              <div className="ax-float">
                <input
                  type="text"
                  id="state_input"
                  className="ax-float__input"
                  value="Arunachal Pradesh"
                  readOnly
                  disabled
                />
                <label htmlFor="state_input" className="ax-float__label floating">
                  State <span style={{ color: '#ef4444' }}>*</span>
                </label>
              </div>

              {/* Volume * */}
              <div className="ax-float">
                <select
                  id="volume_select"
                  className="ax-float__input"
                  value={selectedVolume}
                  onChange={(e) => setSelectedVolume(e.target.value)}
                  disabled={isEditMode || initialLoading || submitting || isAcceptedLocked}
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

          <hr className="shl-section-divider" />

          {/* Section 2: District & Block */}
          <div ref={sec2} className="shl-section-block">
            <div className="shl-section-header">
              <div className="shl-section-title-wrap">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>2. District & Block</h3>
                  {isEditMode && (
                    <span
                      style={{
                        fontSize: 11,
                        background: '#f1f5f9',
                        color: '#475569',
                        border: '1px solid #cbd5e1',
                        padding: '2px 8px',
                        borderRadius: 4,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                        fontWeight: 600,
                      }}
                    >
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                      </svg>
                      Locked in Edit
                    </span>
                  )}
                </div>
                <span style={{ fontSize: '12px', color: 'var(--ax-text-muted, #64748b)' }}>
                  {isEditMode ? 'Allocated district and block' : 'Select district and block within the allocated volumes'}
                </span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
              {/* District * */}
              <div className="ax-float">
                <select
                  id="district_select"
                  className="ax-float__input"
                  value={selectedDistrict}
                  onChange={(e) => setSelectedDistrict(e.target.value)}
                  disabled={isEditMode || !selectedVolume || districtsLoading || submitting || isAcceptedLocked}
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

              {/* Block * */}
              <div className="ax-float">
                <select
                  id="block_select"
                  className="ax-float__input"
                  value={selectedBlock}
                  onChange={(e) => setSelectedBlock(e.target.value)}
                  disabled={isEditMode || !selectedDistrict || blocksLoading || submitting || isAcceptedLocked}
                  required
                >
                  <option value="">
                    {blocksLoading
                      ? 'Loading Blocks...'
                      : !selectedDistrict
                      ? '-- Select District First --'
                      : '-- Select Block --'}
                  </option>
                  {blocks.map((b, idx) => (
                    <option key={idx} value={b.block}>
                      {b.block}
                    </option>
                  ))}
                </select>
                <label htmlFor="block_select" className="ax-float__label floating">
                  Block <span style={{ color: '#ef4444' }}>*</span>
                </label>
              </div>
            </div>
          </div>

          <hr className="shl-section-divider" />

          {/* Section 3: Panchayat Allocation * */}
          <div ref={sec3} className="shl-section-block">
            <div className="shl-section-header">
              <div className="shl-section-title-wrap">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>
                    3. Panchayat Allocation <span style={{ color: '#ef4444' }}>*</span>
                  </h3>
                  {isEditMode && (
                    <span
                      style={{
                        fontSize: 11,
                        background: '#f1f5f9',
                        color: '#475569',
                        border: '1px solid #cbd5e1',
                        padding: '2px 8px',
                        borderRadius: 4,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                        fontWeight: 600,
                      }}
                    >
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                      </svg>
                      Locked to Work Order #{editId}
                    </span>
                  )}
                </div>
                <span style={{ fontSize: '12px', color: 'var(--ax-text-muted, #64748b)' }}>
                  {isEditMode
                    ? 'Panchayats allocated to this work order assignment'
                    : 'Choose eligible panchayats with available solar street lights for installation'}
                </span>
              </div>
              {panchayats.length > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#2563eb' }}>
                    {selectedPanchayats.length} of {panchayats.length} Selected ({selectedLightsTally} Lights)
                  </span>
                  {!isEditMode && (
                    <button
                      type="button"
                      onClick={handleSelectAll}
                      disabled={isAcceptedLocked || isEditMode}
                      className="ax-btn ax-btn--secondary ax-btn--sm"
                      style={{ fontSize: 11, padding: '3px 10px', opacity: (isAcceptedLocked || isEditMode) ? 0.6 : 1 }}
                    >
                      {selectedPanchayats.length === panchayats.length ? 'Deselect All' : 'Select All'}
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Quick dropdown for Panchayat */}
            <div className="ax-float" style={{ marginBottom: 16, maxWidth: '640px' }}>
              <select
                id="panchayat_dropdown"
                className="ax-float__input"
                value=""
                onChange={(e) => {
                  const val = e.target.value.trim();
                  if (val && !selectedPanchayats.includes(val)) {
                    setSelectedPanchayats((prev) => [...prev, val]);
                  }
                }}
                disabled={isEditMode || !selectedBlock || panchayatsLoading || panchayats.length === 0 || submitting || isAcceptedLocked}
              >
                <option value="">
                  {isEditMode
                    ? '-- Panchayats Locked in Edit Mode --'
                    : !selectedBlock
                    ? '-- Select Block First --'
                    : panchayatsLoading
                    ? 'Loading Panchayats...'
                    : panchayats.length === 0
                    ? 'No panchayat available'
                    : '-- Select Panchayat Name --'}
                </option>
                {panchayats.map((p, idx) => (
                  <option key={idx} value={p.panchayat}>
                    {p.panchayat} {p.count !== undefined ? `(${p.count} lights available)` : ''}
                  </option>
                ))}
              </select>
              <label htmlFor="panchayat_dropdown" className="ax-float__label floating">
                Panchayat <span style={{ color: '#ef4444' }}>*</span>
              </label>
            </div>

            {!selectedBlock ? (
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
                -- Select District & Block to Load Panchayats --
              </div>
            ) : panchayatsLoading ? (
              <div style={{ padding: '28px', textAlign: 'center', color: '#2563eb', fontSize: 13 }}>
                <span className="ax-spinner" style={{ marginRight: 8 }} />
                Fetching panchayats for block &ldquo;{selectedBlock}&rdquo;...
              </div>
            ) : panchayats.length === 0 ? (
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
                No panchayat available
              </div>
            ) : (
              <div style={{ border: '1px solid var(--ax-border, #e2e8f0)', borderRadius: 10, overflow: 'hidden', background: 'var(--ax-surface-solid, #ffffff)' }}>
                <div style={{ padding: '8px 12px', background: 'var(--ax-surface-subtle, #f8fafc)', borderBottom: '1px solid var(--ax-border, #e2e8f0)' }}>
                  <input
                    type="text"
                    className="ax-form-input"
                    value={panchayatFilterQuery}
                    onChange={(e) => setPanchayatFilterQuery(e.target.value)}
                    placeholder="Search panchayat name..."
                    disabled={isAcceptedLocked}
                    style={{ width: '100%', padding: '6px 12px', fontSize: 12, borderRadius: 6 }}
                  />
                </div>

                <div style={{ maxHeight: 260, overflowY: 'auto', padding: 10 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 10 }}>
                    {filteredPanchayats.map((p, idx) => {
                      const isSelected = selectedPanchayats.includes(p.panchayat);
                      return (
                        <div
                          key={idx}
                          onClick={() => handleTogglePanchayat(p.panchayat)}
                          style={{
                            padding: '8px 12px',
                            borderRadius: 8,
                            border: `1.5px solid ${isSelected ? '#3b82f6' : 'var(--ax-border, #e2e8f0)'}`,
                            background: isSelected ? '#eff6ff' : 'var(--ax-surface-solid, #ffffff)',
                            cursor: (isAcceptedLocked || isEditMode) ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 10,
                            fontSize: 12,
                            opacity: (isAcceptedLocked || isEditMode) ? 0.9 : 1,
                            transition: 'all 0.15s ease',
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            disabled={isAcceptedLocked || isEditMode}
                            onChange={() => handleTogglePanchayat(p.panchayat)}
                            onClick={(e) => e.stopPropagation()}
                          />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: 700, color: 'var(--ax-text-strong, #1e293b)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {p.panchayat}
                            </div>
                            <div style={{ fontSize: 11, color: 'var(--ax-text-muted, #64748b)' }}>
                              {isEditMode ? 'Assigned under this order' : (p.count !== undefined ? `${p.count} lights available` : 'Available for allocation')}
                            </div>
                          </div>
                          {p.count !== undefined && (
                            <span
                              style={{
                                fontSize: 11,
                                fontWeight: 600,
                                padding: '2px 8px',
                                borderRadius: 12,
                                background: isSelected ? '#dbeafe' : '#f1f5f9',
                                color: isSelected ? '#1e40af' : '#475569',
                              }}
                            >
                              {p.count}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>

          <hr className="shl-section-divider" />

          {/* Section 4: Timeline & Work Order */}
          <div ref={sec4} className="shl-section-block">
            <div className="shl-section-header">
              <div className="shl-section-title-wrap">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>4. Timeline & Work Order</h3>
                  {isEditMode && (
                    <span
                      style={{
                        fontSize: 11,
                        background: '#ecfdf5',
                        color: '#047857',
                        border: '1px solid #a7f3d0',
                        padding: '2px 8px',
                        borderRadius: 4,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                        fontWeight: 600,
                      }}
                    >
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 20h9" />
                        <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                      </svg>
                      Editable Fields
                    </span>
                  )}
                </div>
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
            <Link to="/vendor-management/arunachal/shl/view-assign" className="ax-btn ax-btn--secondary">
              Cancel
            </Link>
            <button
              type="submit"
              className="ax-btn ax-btn--primary"
              disabled={submitting || selectedPanchayats.length === 0 || isAcceptedLocked}
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
                'Update Assigned Lights'
              ) : (
                'Assign Arunachal SHL Lights'
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

export default AssignLights;
