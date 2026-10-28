import { useState, useEffect, useRef, useMemo, type FormEvent, type ChangeEvent } from 'react';
import { Link, useNavigate, useLocation, useSearchParams, useParams } from 'react-router-dom';
import { PageHead } from '../../../../shell/PageHead';
import {
  biharSrtInstallationService,
  getSrtInstallationImageCandidates,
  type SrtSiteDropdownItem,
  type SrtSiteDetailItem,
} from '../../bihar-services/biharSrtInstallationService';

// Unified Single-Card Layout with Floating Labels & Section Dividers
const SINGLE_CARD_FORM_CSS = `
.srt-inst-form .ax-card {
  border: 1px solid var(--ax-border);
  border-radius: var(--ax-radius-xl);
  background: var(--ax-surface-solid);
  box-shadow: var(--ax-shadow-sm);
  overflow: hidden;
}
.srt-inst-form .ax-card__header {
  padding: var(--ax-space-5) var(--ax-space-6);
  border-bottom: 1px solid var(--ax-border-subtle);
  background: var(--ax-surface-subtle);
  display: flex;
  flex-direction: column;
  gap: var(--ax-space-4);
}
.srt-inst-form .ax-card__body { padding: var(--ax-space-6); }

/* Quick Section Nav Pills */
.srt-section-pills {
  display: flex;
  gap: var(--ax-space-2);
  overflow-x: auto;
  padding-bottom: 4px;
  scrollbar-width: thin;
}
.srt-section-pill-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border-radius: var(--ax-radius-pill);
  font-size: var(--ax-text-xs);
  font-weight: 500;
  white-space: nowrap;
  background: var(--ax-surface-solid);
  border: 1px solid var(--ax-border);
  color: var(--ax-text);
  cursor: pointer;
  transition: all var(--ax-motion-fast) var(--ax-ease-standard);
}
.srt-section-pill-btn:hover {
  border-color: var(--ax-accent);
  color: var(--ax-accent);
  background: color-mix(in srgb, var(--ax-accent) 6%, var(--ax-surface-solid));
}
.srt-section-pill-btn .pill-num {
  width: 18px; height: 18px; border-radius: 50%;
  background: var(--ax-surface-subtle);
  display: inline-flex; align-items: center; justify-content: center;
  font-size: 10px; font-weight: 700;
}

/* Section Block */
.srt-section-block { padding-top: var(--ax-space-2); }
.srt-section-header {
  display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap;
  gap: var(--ax-space-2);
  margin-bottom: var(--ax-space-5);
  padding-bottom: var(--ax-space-3);
  border-bottom: 1px solid var(--ax-border-subtle);
}
.srt-section-title-wrap { display: flex; flex-direction: column; gap: 4px; }
.srt-section-divider {
  border: 0;
  border-top: 1px dashed var(--ax-border);
  margin: var(--ax-space-8) 0 var(--ax-space-6);
}

/* Floating Label Core */
.ax-float { position: relative; width: 100%; }
.ax-float__input {
  width: 100%;
  height: 46px;
  padding: 12px 14px 4px 14px;
  font-size: var(--ax-text-sm);
  background: var(--ax-surface-solid);
  border: 1px solid var(--ax-border);
  border-radius: var(--ax-radius-md);
  color: var(--ax-text);
  outline: none;
  transition: border-color var(--ax-motion-fast) var(--ax-ease-standard),
              box-shadow var(--ax-motion-fast) var(--ax-ease-standard);
}
.ax-float__input::placeholder { color: transparent; }
.ax-float__input:focus {
  border-color: var(--ax-accent);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--ax-accent) 20%, transparent);
}
.ax-float__input:disabled { opacity: .6; cursor: not-allowed; }

.ax-float__label {
  position: absolute;
  inset-inline-start: 12px;
  top: 50%;
  transform: translateY(-50%);
  margin: 0;
  padding: 0 4px;
  font-size: var(--ax-text-sm);
  color: var(--ax-text-subtle);
  background: var(--ax-surface-solid);
  border-radius: var(--ax-radius-xs);
  pointer-events: none;
  transition: top var(--ax-motion-fast) var(--ax-ease-standard),
              font-size var(--ax-motion-fast) var(--ax-ease-standard),
              color var(--ax-motion-fast) var(--ax-ease-standard);
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
  color: var(--ax-accent);
}
.ax-float__label.has-val:not(.floating) {
  top: 0;
  font-size: 11px;
  font-weight: 500;
  color: var(--ax-text-muted);
}

/* Image Upload Cards */
.srt-upload-card {
  border: 1px dashed var(--ax-border);
  border-radius: var(--ax-radius-lg);
  padding: var(--ax-space-4);
  background: var(--ax-surface-subtle);
  transition: border-color var(--ax-motion-fast);
}
.srt-upload-card:hover { border-color: var(--ax-accent); }
.srt-upload-card__preview {
  position: relative;
  width: 100%;
  height: 140px;
  border-radius: var(--ax-radius-md);
  overflow: hidden;
  margin-top: var(--ax-space-2);
}
.srt-upload-card__preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.srt-upload-card__remove {
  position: absolute;
  top: 6px;
  right: 6px;
  background: rgba(0, 0, 0, 0.65);
  color: #fff;
  border: none;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 12px;
}

/* GPS Section 3 columns in 1 line */
.srt-gps-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
}
@media (max-width: 768px) {
  .srt-gps-grid {
    grid-template-columns: 1fr;
  }
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

/* ───────── Modern Upload Dropzone (matching Survey ULA / SRT200MW AddData) ───────── */
function ExistingThumbnail({ src, alt }: { src: string; alt: string }) {
  const candidates = useMemo(() => getSrtInstallationImageCandidates(src), [src]);
  const [candidateIdx, setCandidateIdx] = useState(0);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setCandidateIdx(0);
    setFailed(false);
  }, [src]);

  if (failed || candidateIdx >= candidates.length) {
    return (
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: 6,
          background: '#f1f5f9',
          color: '#64748b',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 10,
          border: '1px solid var(--ax-border)',
          flexShrink: 0,
        }}
      >
        Photo
      </div>
    );
  }

  return (
    <img
      src={candidates[candidateIdx]}
      alt={alt}
      style={{ width: 44, height: 44, objectFit: 'cover', borderRadius: 6, border: '1px solid var(--ax-border)', flexShrink: 0 }}
      onError={() => {
        if (candidateIdx + 1 < candidates.length) {
          setCandidateIdx((prev) => prev + 1);
        } else {
          setFailed(true);
        }
      }}
    />
  );
}

interface UploadDropzoneProps {
  id: string;
  label: string;
  required?: boolean;
  accept?: string;
  file: File | null;
  preview?: string;
  existingUrl?: string;
  onSelect: (file: File) => void;
  onRemove: () => void;
  error?: string;
}

function UploadDropzone({
  id,
  label,
  required,
  accept = 'image/*',
  file,
  preview,
  existingUrl,
  onSelect,
  onRemove,
  error,
}: UploadDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onRemove();
    if (inputRef.current) inputRef.current.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const chosen = e.dataTransfer.files?.[0];
    if (chosen) {
      onSelect(chosen);
    }
  };

  const hasNewFile = Boolean(file || preview);
  const hasExisting = Boolean(!hasNewFile && existingUrl);

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
        capture="environment"
        style={{ display: 'none' }}
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onSelect(f);
        }}
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
            : isHovered
            ? '1.5px dashed #94a3b8'
            : hasExisting
            ? '1.5px solid #cbd5e1'
            : '1.5px dashed #cbd5e1',
          borderRadius: 8,
          background: isDragging
            ? '#eff6ff'
            : error
            ? '#fef2f2'
            : isHovered
            ? '#fbfcfd'
            : hasExisting
            ? '#f8fafc'
            : '#ffffff',
          padding: hasNewFile || hasExisting ? '12px 14px' : '22px 16px',
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
        {hasNewFile ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, textAlign: 'left' }}>
              {preview ? (
                <img
                  src={preview}
                  alt={label}
                  style={{ width: 44, height: 44, objectFit: 'cover', borderRadius: 6, border: '1px solid var(--ax-border)', flexShrink: 0 }}
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
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ax-text-strong)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {file ? file.name : label}
                </div>
                <div style={{ fontSize: 11, color: 'var(--ax-text-muted)', marginTop: 2 }}>
                  {file ? `${(file.size / 1024).toFixed(0)} KB · Ready to upload` : 'New photo selected'}
                </div>
              </div>
            </div>
            <button
              type="button"
              className="ax-btn ax-btn--ghost ax-btn--sm"
              onClick={handleClear}
              style={{ color: '#ef4444', flexShrink: 0 }}
              title="Remove photo"
            >
              Remove
            </button>
          </div>
        ) : hasExisting ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, textAlign: 'left' }}>
              <ExistingThumbnail src={existingUrl!} alt={label} />
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ax-text-strong)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {label}
                </div>
                <div style={{ fontSize: 11, color: '#059669', marginTop: 2, fontWeight: 500 }}>
                  ✓ Existing Photo Attached
                </div>
                <div style={{ fontSize: 10.5, color: 'var(--ax-text-muted)' }}>
                  Click or drop to replace
                </div>
              </div>
            </div>
            <button
              type="button"
              className="ax-btn ax-btn--ghost ax-btn--sm"
              onClick={handleClear}
              style={{ color: '#ef4444', flexShrink: 0, fontSize: 11 }}
              title="Clear attached photo"
            >
              Clear
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
              PDF, JPG or PNG — single file
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

export function Bihar_Installation_SRT_InstallationDetails() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { id: paramId } = useParams<{ id?: string }>();

  const stateSite = (location.state as any)?.site;
  const editId = paramId || searchParams.get('id') || searchParams.get('site_id') || (stateSite?.id ? String(stateSite.id) : '');
  const isEditMode = Boolean(editId);

  // Site Dropdown & Detail State
  const [sitesList, setSitesList] = useState<SrtSiteDropdownItem[]>([]);
  const [loadingSites, setLoadingSites] = useState(true);
  const [selectedSiteId, setSelectedSiteId] = useState<string>(editId || '');
  const [siteDetail, setSiteDetail] = useState<SrtSiteDetailItem | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    contact_person: '',
    contact_number: '',
    ca_no: '',
    solarmeter_no: '',
    nm_sm_no: '',
    loger_no: '',
    inverter_no: '',
    inst_latitude: '',
    inst_longitude: '',
    inst_remarks: '',
  });

  // Photo Files & Previews
  const [files, setFiles] = useState<{
    panel_image: File | null;
    system_image: File | null;
    inverter_image: File | null;
    nm_sm_image: File | null;
    loger_image: File | null;
  }>({
    panel_image: null,
    system_image: null,
    inverter_image: null,
    nm_sm_image: null,
    loger_image: null,
  });

  const [previews, setPreviews] = useState<{
    panel_image: string;
    system_image: string;
    inverter_image: string;
    nm_sm_image: string;
    loger_image: string;
  }>({
    panel_image: '',
    system_image: '',
    inverter_image: '',
    nm_sm_image: '',
    loger_image: '',
  });

  // Existing photo URLs from backend (for edit mode)
  const [existingPhotos, setExistingPhotos] = useState<{
    panel_image?: string;
    system_image?: string;
    inverter_image?: string;
    nm_sm_image?: string;
    loger_image?: string;
  }>({});

  // UI state
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'danger'; text: string } | null>(null);
  const [gettingLocation, setGettingLocation] = useState(false);

  // Section refs for smooth scrolling
  const sec1 = useRef<HTMLDivElement>(null);
  const sec2 = useRef<HTMLDivElement>(null);
  const sec3 = useRef<HTMLDivElement>(null);
  const sec4 = useRef<HTMLDivElement>(null);
  const sec5 = useRef<HTMLDivElement>(null);
  const sec6 = useRef<HTMLDivElement>(null);

  const scrollTo = (ref: React.RefObject<HTMLDivElement | null>) => {
    ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // 1. Load pending site names
  useEffect(() => {
    const fetchSites = async () => {
      try {
        setLoadingSites(true);
        const data = await biharSrtInstallationService.fetchSiteNames();
        let list = Array.isArray(data) ? data : [];
        if (isEditMode && editId) {
          const exists = list.some((s) => String(s.id) === String(editId));
          if (!exists) {
            const fallbackLabel = stateSite?.site_name ? `${stateSite.site_name} (#${editId})` : `Site #${editId}`;
            list = [{ id: Number(editId), site_name: fallbackLabel }, ...list];
          }
        }
        setSitesList(list);
      } catch (err: any) {
        console.error('[SRT Installation] fetchSiteNames error:', err);
      } finally {
        setLoadingSites(false);
      }
    };
    fetchSites();
  }, [isEditMode, editId, stateSite?.site_name]);

  // 2. Load edit record when editId is provided
  useEffect(() => {
    if (!editId) return;

    let active = true;
    setLoadingDetail(true);

    const loadEditRecord = async () => {
      try {
        const [editRes, specRes] = await Promise.allSettled([
          biharSrtInstallationService.getEditInstallSite(editId),
          biharSrtInstallationService.fetchSiteDetail(editId),
        ]);

        if (!active) return;

        const editData = editRes.status === 'fulfilled' ? editRes.value : null;
        const specData = specRes.status === 'fulfilled' ? specRes.value : null;

        const merged: SrtSiteDetailItem = {
          id: Number(editId),
          ...(specData || {}),
          ...(stateSite || {}),
          ...(editData || {}),
        };

        setSiteDetail(merged);
        setSelectedSiteId(String(editId));

        // Prepopulate form fields
        setFormData({
          contact_person: editData?.contact_person ?? specData?.contact_person ?? stateSite?.contact_person ?? '',
          contact_number: editData?.contact_number ?? specData?.contact_number ?? stateSite?.contact_number ?? '',
          ca_no: editData?.ca_no ?? specData?.ca_no ?? stateSite?.ca_no ?? '',
          solarmeter_no: editData?.solarmeter_no ?? specData?.solarmeter_no ?? stateSite?.solarmeter_no ?? '',
          nm_sm_no: editData?.nm_sm_no ?? specData?.nm_sm_no ?? stateSite?.nm_sm_no ?? '',
          loger_no: editData?.loger_no ?? specData?.loger_no ?? stateSite?.loger_no ?? '',
          inverter_no: editData?.inverter_no ?? specData?.inverter_no ?? stateSite?.inverter_no ?? '',
          inst_latitude: String(editData?.inst_latitude ?? specData?.inst_latitude ?? stateSite?.inst_latitude ?? ''),
          inst_longitude: String(editData?.inst_longitude ?? specData?.inst_longitude ?? stateSite?.inst_longitude ?? ''),
          inst_remarks: editData?.inst_remarks ?? specData?.inst_remarks ?? stateSite?.inst_remarks ?? '',
        });

        // Prepopulate existing component photos
        setExistingPhotos({
          panel_image: editData?.panel_image || specData?.panel_image || stateSite?.panel_image || '',
          system_image: editData?.system_image || specData?.system_image || stateSite?.system_image || '',
          inverter_image: editData?.inverter_image || specData?.inverter_image || stateSite?.inverter_image || '',
          nm_sm_image: editData?.nm_sm_image || specData?.nm_sm_image || stateSite?.nm_sm_image || '',
          loger_image: editData?.loger_image || specData?.loger_image || stateSite?.loger_image || '',
        });

        // Ensure site dropdown displays the site
        const siteLabel = merged.site_name ? `${merged.site_name} (#${editId})` : `Site #${editId}`;
        setSitesList((prev) => {
          if (!prev.some((s) => String(s.id) === String(editId))) {
            return [{ id: Number(editId), site_name: siteLabel }, ...prev];
          }
          return prev;
        });
      } catch (err: any) {
        console.error('[SRT Installation] loadEditRecord error:', err);
        setFeedback({ type: 'danger', text: 'Failed to load installation details for editing.' });
      } finally {
        if (active) setLoadingDetail(false);
      }
    };

    loadEditRecord();

    return () => {
      active = false;
    };
  }, [editId]);

  // 3. Load site details on manual site selection (new mode)
  const handleSiteSelect = async (siteId: string) => {
    setSelectedSiteId(siteId);
    setSiteDetail(null);
    if (!siteId) return;

    try {
      setLoadingDetail(true);
      const detail = await biharSrtInstallationService.fetchSiteDetail(siteId);
      if (detail) {
        setSiteDetail(detail);
        setFormData((prev) => ({
          ...prev,
          contact_person: detail.contact_person || '',
          contact_number: detail.contact_number || '',
          ca_no: detail.ca_no || '',
          solarmeter_no: detail.solarmeter_no || '',
          nm_sm_no: detail.nm_sm_no || '',
          loger_no: detail.loger_no || '',
          inverter_no: detail.inverter_no || '',
        }));
      }
    } catch (err: any) {
      console.error('[SRT Installation] fetchSiteDetail error:', err);
      setFeedback({ type: 'danger', text: 'Failed to load site details.' });
    } finally {
      setLoadingDetail(false);
    }
  };
  // Text inputs handler
  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const removeFile = (field: keyof typeof files) => {
    setFiles((prev) => ({ ...prev, [field]: null }));
    if (previews[field]) {
      URL.revokeObjectURL(previews[field]);
      setPreviews((prev) => ({ ...prev, [field]: '' }));
    }
    // Also clear existing photo when user clicks clear
    setExistingPhotos((prev) => ({ ...prev, [field]: '' }));
  };

  // Geolocation
  const detectLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    setGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setFormData((prev) => ({
          ...prev,
          inst_latitude: String(pos.coords.latitude.toFixed(6)),
          inst_longitude: String(pos.coords.longitude.toFixed(6)),
        }));
        setGettingLocation(false);
      },
      (err) => {
        console.warn('Geolocation error:', err);
        alert('Could not retrieve GPS coordinates. Please enter manually.');
        setGettingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Form Submit
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedSiteId) {
      setFeedback({ type: 'danger', text: 'Please select a site first.' });
      scrollTo(sec1);
      return;
    }

    const hasPanel = Boolean(files.panel_image || existingPhotos.panel_image);
    const hasSystem = Boolean(files.system_image || existingPhotos.system_image);
    const hasInverter = Boolean(files.inverter_image || existingPhotos.inverter_image);
    const hasNmSm = Boolean(files.nm_sm_image || existingPhotos.nm_sm_image);
    const hasLoger = Boolean(files.loger_image || existingPhotos.loger_image);

    if (!hasPanel || !hasSystem || !hasInverter || !hasNmSm || !hasLoger) {
      setFeedback({ type: 'danger', text: 'All 5 installation photos are required. Please upload the missing photos.' });
      scrollTo(sec6);
      return;
    }

    try {
      setSubmitting(true);
      setFeedback(null);

      const fd = new FormData();
      fd.append('id', String(selectedSiteId));
      fd.append('srt_id', String(selectedSiteId));
      fd.append('contact_person', formData.contact_person);
      fd.append('contact_number', formData.contact_number);
      fd.append('ca_no', formData.ca_no);
      fd.append('solarmeter_no', formData.solarmeter_no);
      fd.append('nm_sm_no', formData.nm_sm_no);
      fd.append('loger_no', formData.loger_no);
      fd.append('inverter_no', formData.inverter_no);
      fd.append('inst_latitude', formData.inst_latitude);
      fd.append('inst_longitude', formData.inst_longitude);
      if (formData.inst_remarks) {
        fd.append('inst_remarks', formData.inst_remarks);
      }

      if (files.panel_image) fd.append('panel_image', files.panel_image);
      if (files.system_image) fd.append('system_image', files.system_image);
      if (files.inverter_image) fd.append('inverter_image', files.inverter_image);
      if (files.nm_sm_image) fd.append('nm_sm_image', files.nm_sm_image);
      if (files.loger_image) fd.append('loger_image', files.loger_image);

      if (isEditMode) {
        const res = await biharSrtInstallationService.updateInstallSite(fd);
        setFeedback({ type: 'success', text: res.message || 'Installation details updated successfully!' });
      } else {
        const res = await biharSrtInstallationService.storeInstallation(fd);
        setFeedback({ type: 'success', text: res.message || 'SRT Site Installed Successfully!' });
      }

      setTimeout(() => {
        navigate('/v/srt/allassignsite');
      }, 1500);
    } catch (err: any) {
      console.error('[SRT Installation] submit error:', err);
      setFeedback({
        type: 'danger',
        text: err?.message || (isEditMode ? 'Failed to update installation.' : 'Failed to submit SRT installation.'),
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="ax-page srt-inst-form">
      <style>{SINGLE_CARD_FORM_CSS}</style>

      {/* ── Page Head ── */}
      <PageHead
        title={isEditMode ? 'Edit SRT-Installation Details' : 'SRT-Installation Details'}
        subtitle={
          isEditMode
            ? `Editing installed site #${editId}. Modify details, component serial numbers, and component photos below.`
            : 'Capture rooftop solar installation execution data, serial numbers, geocoordinates, and verification photos.'
        }
        breadcrumbs={[
          { label: 'Home', href: '/v-dashboard' },
          { label: 'Bihar' },
          { label: 'Installation' },
          { label: 'SRT' },
          { label: isEditMode ? 'Edit Installation' : 'Installation Details' },
        ]}
        actions={
          <div style={{ display: 'inline-flex', gap: 'var(--ax-space-2)' }}>
            {isEditMode && (
              <Link to="/v/srt/installationsite" className="ax-btn ax-btn--ghost ax-btn--sm">
                + New Installation
              </Link>
            )}
            <Link to="/v/srt/allassignsite" className="ax-btn ax-btn--secondary ax-btn--sm">
              View Installed Sites
            </Link>
          </div>
        }
      />

      {feedback && (
        <div className={`ax-alert ax-alert--${feedback.type}`} style={{ marginBottom: 'var(--ax-space-4)' }}>
          <div className="ax-alert__title">{feedback.type === 'success' ? 'Success' : 'Error'}</div>
          <div className="ax-alert__text">{feedback.text}</div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="ax-card">
        {/* ── Header with Section Pills ── */}
        <div className="ax-card__header">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 className="ax-card__title" style={{ fontSize: '1.25rem', fontWeight: 700 }}>
                {isEditMode ? 'Edit Rooftop Solar Installation' : 'Rooftop Solar Installation Form'}
              </h2>
              <p className="ax-card__subtitle" style={{ fontSize: '0.85rem', color: 'var(--ax-text-muted)' }}>
                {isEditMode
                  ? 'Update installation details, equipment serials, and evidence photos for this site.'
                  : 'Fill out installation details and upload site completion evidence for department verification.'}
              </p>
            </div>
     
          </div>

          {/* Quick Nav Pills */}
          <div className="srt-section-pills">
            <button type="button" className="srt-section-pill-btn" onClick={() => scrollTo(sec1)}>
              <span className="pill-num">1</span> Site Selection
            </button>
            <button type="button" className="srt-section-pill-btn" onClick={() => scrollTo(sec2)}>
              <span className="pill-num">2</span> Beneficiary Info
            </button>
            <button type="button" className="srt-section-pill-btn" onClick={() => scrollTo(sec3)}>
              <span className="pill-num">3</span> Identifiers
            </button>
            <button type="button" className="srt-section-pill-btn" onClick={() => scrollTo(sec4)}>
              <span className="pill-num">4</span> Equipment Numbers
            </button>
            <button type="button" className="srt-section-pill-btn" onClick={() => scrollTo(sec5)}>
              <span className="pill-num">5</span> Geo & Remarks
            </button>
            <button type="button" className="srt-section-pill-btn" onClick={() => scrollTo(sec6)}>
              <span className="pill-num">6</span> Site Photos
            </button>
          </div>
        </div>

        <div className="ax-card__body">
          {/* ════════ Section 1: Site Selection ════════ */}
          <div ref={sec1} className="srt-section-block">
            <div className="srt-section-header">
              <div className="srt-section-title-wrap">
                <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>1. Select Rooftop Site</h3>
                <span style={{ fontSize: '12px', color: 'var(--ax-text-muted)' }}>
                  {isEditMode ? 'Selected site for editing' : 'Choose from accepted sites pending installation'}
                </span>
              </div>
            </div>

            <div className="ax-form-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
              <div className="ax-float">
                <select
                  id="site_id_select"
                  className="ax-float__input"
                  value={selectedSiteId}
                  onChange={(e) => handleSiteSelect(e.target.value)}
                  disabled={loadingSites || submitting || isEditMode}
                  required
                >
                  <option value="">-- Choose Assigned SRT Site --</option>
                  {sitesList.map((s) => (
                    <option key={s.id} value={s.id}>
                        {s.site_name}
                    </option>
                  ))}
                </select>
                <label htmlFor="site_id_select" className="ax-float__label floating">
                  Assigned Site <span style={{ color: 'var(--ax-danger)' }}>*</span>
                </label>
              </div>
            </div>

            {isEditMode && (
              <p style={{ margin: '8px 0 0', fontSize: '12px', color: 'var(--ax-text-muted)' }}>
                Site selection is fixed while editing site #{editId}. <Link to="/v/srt/installationsite" style={{ color: 'var(--ax-primary-default, #2563eb)' }}>Switch to new installation</Link>
              </p>
            )}

            {loadingDetail && (
              <div style={{ padding: '16px 0', color: 'var(--ax-accent)', fontSize: '13px' }}>
                Fetching site specifications & prefilled details...
              </div>
            )}
          </div>

          <hr className="srt-section-divider" />

          {/* ════════ Section 2: Beneficiary / Site Information ════════ */}
          <div ref={sec2} className="srt-section-block">
            <div className="srt-section-header">
              <div className="srt-section-title-wrap">
                <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>2. Site & Plant Information</h3>
                <span style={{ fontSize: '12px', color: 'var(--ax-text-muted)' }}>
                  Auto-populated details from sanction order
                </span>
              </div>
            </div>

            <div className="ax-form-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
              <FloatingInput label="Discom" name="discom" value={siteDetail?.discom || ''} onChange={() => {}} disabled />
              <FloatingInput label="Department" name="dept_name" value={siteDetail?.dept_name || ''} onChange={() => {}} disabled />
              <FloatingInput label="District" name="district" value={siteDetail?.district || ''} onChange={() => {}} disabled />
              <FloatingInput label="State" name="state" value={siteDetail?.state || 'Bihar'} onChange={() => {}} disabled />
              <FloatingInput label="Firm Name" name="firm_name" value={siteDetail?.firm_name || ''} onChange={() => {}} disabled />
              <FloatingInput label="Plant Capacity" name="plant_sc" value={siteDetail?.plant_sc || ''} onChange={() => {}} disabled />
              <FloatingInput label="Connection Phase" name="phase" value={siteDetail?.phase || ''} onChange={() => {}} disabled />
              <FloatingInput label="Sanction Load (kW)" name="sanction_load" value={siteDetail?.sanction_load || ''} onChange={() => {}} disabled />
              <div style={{ gridColumn: '1 / -1' }}>
                <FloatingInput label="Site Location / Address" name="location" value={siteDetail?.location || ''} onChange={() => {}} disabled />
              </div>
            </div>
          </div>

          <hr className="srt-section-divider" />

          {/* ════════ Section 3: Contact & Identifiers ════════ */}
          <div ref={sec3} className="srt-section-block">
            <div className="srt-section-header">
              <div className="srt-section-title-wrap">
                <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>3. Contact & CA Identifiers</h3>
                <span style={{ fontSize: '12px', color: 'var(--ax-text-muted)' }}>
                  Nodal contact person and discom CA consumer number
                </span>
              </div>
            </div>

            <div className="ax-form-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
              <FloatingInput
                label="Contact Person Name"
                name="contact_person"
                value={formData.contact_person}
                onChange={handleInputChange}
                required
              />
              <FloatingInput
                label="Contact Number"
                name="contact_number"
                value={formData.contact_number}
                onChange={handleInputChange}
                required
              />
              <FloatingInput
                label="CA Number"
                name="ca_no"
                value={formData.ca_no}
                onChange={handleInputChange}
                required
              />
            </div>
          </div>

          <hr className="srt-section-divider" />

          {/* ════════ Section 4: Meter & Equipment Serial Numbers ════════ */}
          <div ref={sec4} className="srt-section-block">
            <div className="srt-section-header">
              <div className="srt-section-title-wrap">
                <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>4. Meter & Equipment Serial Numbers</h3>
                <span style={{ fontSize: '12px', color: 'var(--ax-text-muted)' }}>
                  Installed solar meters, inverters, and datalogger serials
                </span>
              </div>
            </div>

            <div className="ax-form-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
              <FloatingInput
                label="Solar Meter Number"
                name="solarmeter_no"
                value={formData.solarmeter_no}
                onChange={handleInputChange}
                required
              />
              <FloatingInput
                label="Net / Smart Meter No"
                name="nm_sm_no"
                value={formData.nm_sm_no}
                onChange={handleInputChange}
                required
              />
              <FloatingInput
                label="Inverter Serial Number"
                name="inverter_no"
                value={formData.inverter_no}
                onChange={handleInputChange}
                required
              />
              <FloatingInput
                label="Datalogger Number"
                name="loger_no"
                value={formData.loger_no}
                onChange={handleInputChange}
                required
              />
            </div>
          </div>

          <hr className="srt-section-divider" />

          {/* ════════ Section 5: Geo Coordinates & Remarks ════════ */}
          <div ref={sec5} className="srt-section-block">
            <div className="srt-section-header">
              <div className="srt-section-title-wrap">
                <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>5. GPS Coordinates & Remarks</h3>
                <span style={{ fontSize: '12px', color: 'var(--ax-text-muted)' }}>
                  Exact site geotag coordinates
                </span>
              </div>
              <button
                type="button"
                className="ax-btn ax-btn--secondary ax-btn--sm"
                onClick={detectLocation}
                disabled={gettingLocation}
              >
                {gettingLocation ? 'Detecting GPS...' : '📍 Auto-detect GPS'}
              </button>
            </div>

            <div className="srt-gps-grid">
              <FloatingInput
                label="Latitude"
                name="inst_latitude"
                value={formData.inst_latitude}
                onChange={handleInputChange}
                required
              />
              <FloatingInput
                label="Longitude"
                name="inst_longitude"
                value={formData.inst_longitude}
                onChange={handleInputChange}
                required
              />
              <FloatingInput
                label="Installation Remarks (optional)"
                name="inst_remarks"
                value={formData.inst_remarks}
                onChange={handleInputChange}
              />
            </div>
          </div>

          <hr className="srt-section-divider" />

          {/* ════════ Section 6: Photo Uploads ════════ */}
          <div ref={sec6} className="srt-section-block">
            <div className="srt-section-header">
              <div className="srt-section-title-wrap">
                <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>6. Installation Photo Evidence</h3>
                <span style={{ fontSize: '12px', color: 'var(--ax-text-muted)' }}>
                  Upload clear photos of all 5 installed components (max 5MB each)
                </span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
                <UploadDropzone
                  id="panel_image"
                  label="1. Panel Image"
                  required
                  file={files.panel_image}
                  preview={previews.panel_image}
                  existingUrl={existingPhotos.panel_image}
                  onSelect={(f) => {
                    setFiles((prev) => ({ ...prev, panel_image: f }));
                    setPreviews((prev) => ({ ...prev, panel_image: URL.createObjectURL(f) }));
                  }}
                  onRemove={() => removeFile('panel_image')}
                />
                <UploadDropzone
                  id="system_image"
                  label="2. Complete System Photo"
                  required
                  file={files.system_image}
                  preview={previews.system_image}
                  existingUrl={existingPhotos.system_image}
                  onSelect={(f) => {
                    setFiles((prev) => ({ ...prev, system_image: f }));
                    setPreviews((prev) => ({ ...prev, system_image: URL.createObjectURL(f) }));
                  }}
                  onRemove={() => removeFile('system_image')}
                />
                <UploadDropzone
                  id="inverter_image"
                  label="3. Inverter Photo"
                  required
                  file={files.inverter_image}
                  preview={previews.inverter_image}
                  existingUrl={existingPhotos.inverter_image}
                  onSelect={(f) => {
                    setFiles((prev) => ({ ...prev, inverter_image: f }));
                    setPreviews((prev) => ({ ...prev, inverter_image: URL.createObjectURL(f) }));
                  }}
                  onRemove={() => removeFile('inverter_image')}
                />
                <UploadDropzone
                  id="nm_sm_image"
                  label="4. Net / Smart Meter Photo"
                  required
                  file={files.nm_sm_image}
                  preview={previews.nm_sm_image}
                  existingUrl={existingPhotos.nm_sm_image}
                  onSelect={(f) => {
                    setFiles((prev) => ({ ...prev, nm_sm_image: f }));
                    setPreviews((prev) => ({ ...prev, nm_sm_image: URL.createObjectURL(f) }));
                  }}
                  onRemove={() => removeFile('nm_sm_image')}
                />
                <UploadDropzone
                  id="loger_image"
                  label="5. Datalogger Photo"
                  required
                  file={files.loger_image}
                  preview={previews.loger_image}
                  existingUrl={existingPhotos.loger_image}
                  onSelect={(f) => {
                    setFiles((prev) => ({ ...prev, loger_image: f }));
                    setPreviews((prev) => ({ ...prev, loger_image: URL.createObjectURL(f) }));
                  }}
                  onRemove={() => removeFile('loger_image')}
                />
              </div>
          </div>

          {/* ════════ Submit Footer ════════ */}
          <div style={{ marginTop: '32px', paddingTop: '20px', borderTop: '1px solid var(--ax-border)', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <Link to="/v/srt/allassignsite" className="ax-btn ax-btn--secondary">
              Cancel
            </Link>
            <button
              type="submit"
              className="ax-btn ax-btn--primary"
              disabled={submitting || !selectedSiteId}
            >
              {submitting
                ? (isEditMode ? 'Updating Installation...' : 'Submitting Installation...')
                : (isEditMode ? 'Update Installation Details' : 'Submit Installation Report')}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

export default Bihar_Installation_SRT_InstallationDetails;
