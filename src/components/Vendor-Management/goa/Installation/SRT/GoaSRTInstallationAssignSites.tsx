import { useState, useRef, useEffect, useMemo, type FormEvent, type ChangeEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { PageHead } from '../../../../shell/PageHead';
import {
  goaAdminService,
  type GoaVendor,
  type GoaDistrictItem,
  type GoaSiteItem,
} from '../../goa-services';

// Unified Single-Card Layout with Floating Labels & Section Dividers (matching user reference)
const SINGLE_CARD_FORM_CSS = `
.swp-inst-form .ax-card {
  border: 1px solid var(--ax-border, #e2e8f0);
  border-radius: var(--ax-radius-xl, 16px);
  background: var(--ax-surface-solid, #ffffff);
  box-shadow: var(--ax-shadow-sm, 0 1px 3px rgba(0,0,0,0.05));
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
  border: 1px solid var(--ax-border, #cbd5e1);
  color: var(--ax-text, #1e293b);
  cursor: pointer;
  transition: all var(--ax-motion-fast, 0.15s) var(--ax-ease-standard, ease);
}
.swp-section-pill-btn:hover {
  border-color: #2563eb;
  color: #2563eb;
  background: color-mix(in srgb, #2563eb 6%, #ffffff);
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

/* Site Selection List & Cards */
.swp-site-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 12px;
  max-height: 320px;
  overflow-y: auto;
  padding: 12px;
  background: var(--ax-surface-subtle, #f8fafc);
  border: 1px solid var(--ax-border, #cbd5e1);
  border-radius: var(--ax-radius-md, 8px);
}
.swp-site-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 10px 12px;
  background: #ffffff;
  border: 1px solid var(--ax-border, #e2e8f0);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s ease;
  user-select: none;
}
.swp-site-item:hover {
  border-color: #3b82f6;
  background: #f0f7ff;
}
.swp-site-item.selected {
  border-color: #3b82f6;
  background: #eff6ff;
  box-shadow: 0 0 0 1px #3b82f6;
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
  transition: border-color var(--ax-motion-fast, 0.15s) ease,
              box-shadow var(--ax-motion-fast, 0.15s) ease;
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
  transition: top var(--ax-motion-fast, 0.15s) ease,
              font-size var(--ax-motion-fast, 0.15s) ease,
              color var(--ax-motion-fast, 0.15s) ease;
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
  accept = '.pdf,.jpg,.jpeg,.png,.docx,.xlsx',
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
              Click to upload or drag & drop installation work order document
            </div>
            <div style={{ fontSize: 11, color: 'var(--ax-text-muted, #64748b)', marginTop: 3 }}>
              PDF, JPG, JPEG, PNG, DOCX or XLSX (Max 15 MB)
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

export function GoaSRTInstallationAssignSites() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('edit');
  const isEditing = Boolean(editId);

  // Dynamic Options from API
  const [vendorList, setVendorList] = useState<GoaVendor[]>([]);
  const [districtList, setDistrictList] = useState<string[]>(['North Goa', 'South Goa']);
  const [availableSites, setAvailableSites] = useState<GoaSiteItem[]>([]);
  const [fetchingSites, setFetchingSites] = useState<boolean>(false);

  // Form State
  const [vendor, setVendor] = useState<string>('');
  const [stateName, setStateName] = useState<string>('Goa');
  const [district, setDistrict] = useState<string>('');
  const [selectedSiteIds, setSelectedSiteIds] = useState<number[]>([]);
  const [siteSearchQuery, setSiteSearchQuery] = useState<string>('');
  const [selectedSiteDropdownId, setSelectedSiteDropdownId] = useState<string>('');
  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | undefined>(undefined);
  const [remarks, setRemarks] = useState<string>('');

  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');

  // Section refs for smooth navigation pills
  const sec1 = useRef<HTMLDivElement>(null);
  const sec2 = useRef<HTMLDivElement>(null);
  const sec3 = useRef<HTMLDivElement>(null);
  const sec4 = useRef<HTMLDivElement>(null);

  const scrollTo = (ref: React.RefObject<HTMLDivElement | null>) => {
    ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // 8. Edit Assign (fetch data if editId is provided)
  useEffect(() => {
    if (!editId) return;
    let cancelled = false;
    setLoading(true);
    goaAdminService
      .getEditAssign(editId)
      .then((res: any) => {
        if (cancelled) return;
        const payload = res?.data || res;
        const assign = payload?.assignedSite || payload?.assignSrt || payload;
        if (assign) {
          if (assign.vendor) setVendor(String(assign.vendor));
          if (assign.state) setStateName(assign.state);
          if (assign.district) setDistrict(assign.district);

          const parsedIds: number[] = [];
          if (assign.site) {
            if (Array.isArray(assign.site)) {
              assign.site.forEach((s: any) => {
                const n = Number(typeof s === 'object' ? s.id : s);
                if (!isNaN(n) && n > 0 && !parsedIds.includes(n)) parsedIds.push(n);
              });
            } else if (!isNaN(Number(assign.site)) && Number(assign.site) > 0) {
              parsedIds.push(Number(assign.site));
            }
          }
          if (assign.site_name) {
            try {
              const parsed = typeof assign.site_name === 'string' ? JSON.parse(assign.site_name) : assign.site_name;
              if (Array.isArray(parsed)) {
                parsed.forEach((p: any) => {
                  const n = Number(typeof p === 'object' ? p.id : p);
                  if (!isNaN(n) && n > 0 && !parsedIds.includes(n)) parsedIds.push(n);
                });
              } else if (!isNaN(Number(parsed)) && Number(parsed) > 0 && !parsedIds.includes(Number(parsed))) {
                parsedIds.push(Number(parsed));
              }
            } catch {
              const parts = String(assign.site_name).split(',');
              parts.forEach((pt) => {
                const clean = pt.trim().replace(/[\[\]"]/g, '');
                const n = Number(clean);
                if (!isNaN(n) && n > 0 && !parsedIds.includes(n)) parsedIds.push(n);
              });
            }
          }
          if (parsedIds.length > 0) {
            setSelectedSiteIds(parsedIds);
          }
          if (assign.remarks) setRemarks(assign.remarks);
        }
      })
      .catch((err) => {
        console.warn('Failed to load edit assign data:', err);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [editId]);

  // Fetch Vendors and Districts on component mount
  useEffect(() => {
    let cancelled = false;
    const loadInitialData = async () => {
      try {
        const [vRes, dRes] = await Promise.allSettled([
          goaAdminService.getVendors(),
          goaAdminService.getDistricts('Goa'),
        ]);

        if (!cancelled) {
          if (vRes.status === 'fulfilled' && Array.isArray(vRes.value)) {
            setVendorList(vRes.value);
          } else {
            setVendorList([]);
          }

          if (dRes.status === 'fulfilled' && Array.isArray(dRes.value)) {
            const names = dRes.value.map((d: any) => (typeof d === 'string' ? d : d.district)).filter(Boolean);
            setDistrictList(names.length > 0 ? names : ['North Goa', 'South Goa']);
          }
        }
      } catch (e) {
        console.warn('Initial assign data load error:', e);
      }
    };

    loadInitialData();
    return () => {
      cancelled = true;
    };
  }, []);

  // Fetch Sites when district changes
  useEffect(() => {
    if (!district) {
      setAvailableSites([]);
      setSelectedSiteIds([]);
      setSiteSearchQuery('');
      setSelectedSiteDropdownId('');
      return;
    }

    let cancelled = false;
    setFetchingSites(true);
    if (!isEditing) {
      setSelectedSiteIds([]);
    }
    setSiteSearchQuery('');
    setSelectedSiteDropdownId('');

    goaAdminService
      .getSites(stateName || 'Goa', district)
      .then((sites) => {
        if (!cancelled && Array.isArray(sites)) {
          setAvailableSites(sites);
        }
      })
      .catch((err) => {
        console.warn('Failed to fetch unassigned sites for district:', district, err);
        if (!cancelled) setAvailableSites([]);
      })
      .finally(() => {
        if (!cancelled) setFetchingSites(false);
      });

    return () => {
      cancelled = true;
    };
  }, [district, stateName, isEditing]);

  // Filter sites for search query
  const filteredSites = useMemo(() => {
    const q = siteSearchQuery.trim().toLowerCase();
    if (!q) return availableSites;
    return availableSites.filter((s) =>
      String(s.id).includes(q) ||
      (s.site_name || '').toLowerCase().includes(q) ||
      (s.unique_id && String(s.unique_id).toLowerCase().includes(q)) ||
      (s.sanction_load && String(s.sanction_load).toLowerCase().includes(q))
    );
  }, [availableSites, siteSearchQuery]);

  const toggleSite = (siteId: number) => {
    setSelectedSiteIds((prev) =>
      prev.includes(siteId) ? prev.filter((id) => id !== siteId) : [...prev, siteId]
    );
  };

  const handleSelectAllSites = () => {
    if (selectedSiteIds.length === filteredSites.length && filteredSites.length > 0) {
      setSelectedSiteIds([]);
    } else {
      setSelectedSiteIds(filteredSites.map((s) => s.id));
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!vendor) return setErrorMsg('Vendor Name is required.');
    if (!stateName) return setErrorMsg('State is required.');
    if (!district) return setErrorMsg('District is required.');
    if (selectedSiteIds.length === 0) return setErrorMsg('Please select at least one site to assign.');
    if (!file && !isEditing) return setErrorMsg('Please upload a work order or site assignment document file.');

    setLoading(true);
    try {
      const fd = new FormData();
      // Vendor ID or Name
      const matchedVendor = vendorList.find((v) => String(v.id) === String(vendor) || v.name === vendor);
      fd.append('vendor', matchedVendor ? String(matchedVendor.id) : vendor);
      fd.append('state', stateName);
      fd.append('district', district);

      // site[] array of integers
      selectedSiteIds.forEach((id) => {
        fd.append('site[]', String(id));
      });

      // Selected site names (comma-separated for backwards compatibility)
      const selectedNames = selectedSiteIds
        .map((id) => availableSites.find((s) => s.id === id)?.site_name || String(id))
        .join(', ');
      fd.append('site_name', selectedNames);

      if (file) {
        fd.append('file', file);
      }
      if (remarks.trim()) {
        fd.append('remarks', remarks.trim());
      }

      let res: any;
      if (isEditing && editId) {
        res = await goaAdminService.updateAssign(editId, fd);
      } else {
        res = await goaAdminService.storeAssign(fd);
      }

      const msg = res?.message || `${selectedSiteIds.length} Goa SRT Installation site(s) successfully ${isEditing ? 'updated' : 'assigned'}!`;
      setSuccessMsg(msg);
      setTimeout(() => {
        navigate('/vendor-management/goa/srt/installation/view-assign');
      }, 1500);
    } catch (err: any) {
      setErrorMsg(err?.message || `Failed to ${isEditing ? 'update' : 'assign'} site installation.`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ax-page swp-inst-form">
      <style>{SINGLE_CARD_FORM_CSS}</style>

      {/* Page Head */}
      <PageHead
        title={isEditing ? 'Edit Goa SRT Installation Assignment' : 'Assign Goa SRT Installation'}
        subtitle="The field labels marked with * are required input fields."
        breadcrumbs={[
          { label: 'ERP Dashboard', href: '/' },
          { label: 'Vendor Management', href: '/vendor-management' },
          { label: 'Goa' },
          { label: 'Installation' },
          { label: 'SRT' },
          { label: isEditing ? 'Edit Assignment' : 'Assign Sites' },
        ]}
        actions={
          <Link
            to="/vendor-management/goa/srt/installation/view-assign"
            className="ax-btn ax-btn--primary ax-btn--sm"
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
            View Assigned Sites
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

      <form onSubmit={handleSubmit} className="ax-card">
        {/* Header with Section Pills */}
        <div className="ax-card__header">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
            <div>
              <h2 className="ax-card__title" style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: 'var(--ax-text-strong, #0f172a)' }}>
                Assign Goa SRT Installation
              </h2>
              <p className="ax-card__subtitle" style={{ fontSize: '0.85rem', color: '#ef4444', margin: '4px 0 0' }}>
                The field labels marked with * are required input fields.
              </p>
            </div>
          </div>

          {/* Quick Nav Pills */}
          <div className="swp-section-pills">
            <button type="button" className="swp-section-pill-btn" onClick={() => scrollTo(sec1)}>
              <span className="pill-num">1</span> Vendor Name
            </button>
            <button type="button" className="swp-section-pill-btn" onClick={() => scrollTo(sec2)}>
              <span className="pill-num">2</span> State & District
            </button>
            <button type="button" className="swp-section-pill-btn" onClick={() => scrollTo(sec3)}>
              <span className="pill-num">3</span> Sites {selectedSiteIds.length > 0 ? `(${selectedSiteIds.length})` : ''}
            </button>
            <button type="button" className="swp-section-pill-btn" onClick={() => scrollTo(sec4)}>
              <span className="pill-num">4</span> File & Remarks
            </button>
          </div>
        </div>

        <div className="ax-card__body">
          {/* Section 1: Vendor Name * */}
          <div ref={sec1} className="swp-section-block">
            <div className="swp-section-header">
              <div className="swp-section-title-wrap">
                <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>
                  1. Vendor Name <span style={{ color: '#ef4444' }}>*</span>
                </h3>
                <span style={{ fontSize: '12px', color: 'var(--ax-text-muted, #64748b)' }}>
                  Select authorized empaneled contractor for installation execution
                </span>
              </div>
            </div>

            <div style={{ maxWidth: '480px' }}>
              <div className="ax-float">
                <select
                  id="vendor_select"
                  className="ax-float__input"
                  value={vendor}
                  onChange={(e) => setVendor(e.target.value)}
                  disabled={loading}
                  required
                >
                  <option value="">-- Select Vendor --</option>
                  {vendorList.map((v) => (
                    <option key={v.id || v.name} value={v.id ? String(v.id) : v.name}>
                      {v.name}
                    </option>
                  ))}
                </select>
                <label htmlFor="vendor_select" className="ax-float__label floating">
                  Vendor Name <span style={{ color: '#ef4444' }}>*</span>
                </label>
              </div>
            </div>
          </div>

          <hr className="swp-section-divider" />

          {/* Section 2: State * & District * */}
          <div ref={sec2} className="swp-section-block">
            <div className="swp-section-header">
              <div className="swp-section-title-wrap">
                <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>2. State & District</h3>
                <span style={{ fontSize: '12px', color: 'var(--ax-text-muted, #64748b)' }}>
                  Choose state and target district within Goa
                </span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
              {/* State * */}
              <div className="ax-float">
                <select
                  id="state_select"
                  className="ax-float__input"
                  value={stateName}
                  onChange={(e) => setStateName(e.target.value)}
                  disabled={loading}
                  required
                >
                  <option value="Goa">Goa</option>
                </select>
                <label htmlFor="state_select" className="ax-float__label floating">
                  State <span style={{ color: '#ef4444' }}>*</span>
                </label>
              </div>

              {/* District * */}
              <div className="ax-float">
                <select
                  id="district_select"
                  className="ax-float__input"
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  disabled={loading}
                  required
                >
                  <option value="">-- Select District --</option>
                  {districtList.map((d) => (
                    <option key={d} value={d}>
                      {d}
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

          {/* Section 3: Site Selection * */}
          <div ref={sec3} className="swp-section-block">
            <div className="swp-section-header">
              <div className="swp-section-title-wrap">
                <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0, color: 'var(--ax-text-strong, #0f172a)' }}>
                  3. Unassigned Installation Sites <span style={{ color: '#ef4444' }}>*</span>
                </h3>
                <span style={{ fontSize: '12px', color: 'var(--ax-text-muted, #64748b)' }}>
                  {district
                    ? `Select one or more unassigned sites in ${district} for this installation assignment.`
                    : 'Please select a district above first to fetch available unassigned sites.'}
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
                    onClick={handleSelectAllSites}
                  >
                    {selectedSiteIds.length === filteredSites.length && filteredSites.length > 0
                      ? 'Deselect All'
                      : 'Select All'}
                  </button>
                </div>
              )}
            </div>

            {/* State A: No district selected */}
            {!district ? (
              <div
                style={{
                  padding: '24px 16px',
                  textAlign: 'center',
                  background: '#f8fafc',
                  borderRadius: 8,
                  border: '1px dashed #cbd5e1',
                  color: '#64748b',
                  fontSize: 13,
                }}
              >
                -- Select District to Load Sites --
              </div>
            ) : fetchingSites ? (
              /* State B: Loading */
              <div
                style={{
                  padding: '28px 16px',
                  textAlign: 'center',
                  background: '#f8fafc',
                  borderRadius: 8,
                  color: '#2563eb',
                  fontSize: 13,
                }}
              >
                <span className="ax-spinner" style={{ marginRight: 8 }} />
                Fetching unassigned sites for district "<b>{district}</b>"...
              </div>
            ) : availableSites.length === 0 ? (
              /* State C: Empty */
              <div
                style={{
                  padding: '24px 16px',
                  textAlign: 'center',
                  background: '#f8fafc',
                  borderRadius: 8,
                  border: '1px dashed #cbd5e1',
                  color: '#64748b',
                  fontSize: 13,
                }}
              >
                No unassigned sites available in <b>{district}</b>. All sites in this district may have already been assigned or completed.
              </div>
            ) : (
              /* State D: Sites loaded */
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {/* Quick Select & Search Controls */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 12 }}>
                  {/* Quick Dropdown */}
                  <div>
                    <select
                      id="quick_site_dropdown"
                      className="ax-input ax-input--sm"
                      style={{ width: '100%', height: 38, borderRadius: 6, fontSize: 13 }}
                      value={selectedSiteDropdownId}
                      onChange={(e) => {
                        const val = e.target.value;
                        setSelectedSiteDropdownId(val);
                        if (val) {
                          const numId = Number(val);
                          if (!selectedSiteIds.includes(numId)) {
                            setSelectedSiteIds((prev) => [...prev, numId]);
                          }
                        }
                      }}
                      disabled={loading}
                    >
                      <option value="">-- Quick Select Site from List ({availableSites.length}) --</option>
                      {availableSites.map((s) => {
                        const isSelected = selectedSiteIds.includes(s.id);
                        return (
                          <option key={s.id} value={String(s.id)}>
                            {isSelected ? '✓ ' : ''}{s.site_name} (ID: {s.id}{s.sanction_load ? `, ${s.sanction_load} kW` : ''})
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  {/* Search Input */}
                  <div>
                    <input
                      type="text"
                      value={siteSearchQuery}
                      onChange={(e) => setSiteSearchQuery(e.target.value)}
                      placeholder="Search sites by ID, name, or load..."
                      className="ax-input ax-input--sm"
                      style={{ width: '100%', height: 38, borderRadius: 6, fontSize: 13 }}
                    />
                  </div>
                </div>

                {/* Checkbox Grid / List */}
                <div className="swp-site-list">
                  {filteredSites.map((site) => {
                    const isChecked = selectedSiteIds.includes(site.id);
                    return (
                      <div
                        key={site.id}
                        className={`swp-site-item ${isChecked ? 'selected' : ''}`}
                        onClick={() => toggleSite(site.id)}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleSite(site.id)}
                          onClick={(e) => e.stopPropagation()}
                          style={{ width: 16, height: 16, marginTop: 2, cursor: 'pointer', accentColor: '#2563eb' }}
                        />
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div
                            style={{
                              fontSize: 13,
                              fontWeight: 600,
                              color: 'var(--ax-text-strong, #1e293b)',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                            title={site.site_name}
                          >
                            {site.site_name}
                          </div>
                          <div
                            style={{
                              fontSize: 11,
                              color: 'var(--ax-text-muted, #64748b)',
                              display: 'flex',
                              gap: 8,
                              flexWrap: 'wrap',
                              marginTop: 2,
                            }}
                          >
                            <span>ID: <b>{site.id}</b></span>
                            {site.unique_id && <span>UID: <b>{site.unique_id}</b></span>}
                            {site.sanction_load && <span>Load: <b>{site.sanction_load} kW</b></span>}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {filteredSites.length === 0 && (
                  <div style={{ padding: 12, textAlign: 'center', color: '#64748b', fontSize: 12 }}>
                    No sites matching "{siteSearchQuery}"
                  </div>
                )}

                {selectedSiteIds.length > 0 && (
                  <div style={{ fontSize: 12, color: '#16a34a', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span>✓ {selectedSiteIds.length} site(s) selected for assignment</span>
                  </div>
                )}
              </div>
            )}
          </div>

          <hr className="swp-section-divider" />

          {/* Section 4: File * & Remarks */}
          <div ref={sec4} className="swp-section-block">
            <div className="swp-section-header">
              <div className="swp-section-title-wrap">
                <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>4. Work Order File & Remarks</h3>
                <span style={{ fontSize: '12px', color: 'var(--ax-text-muted, #64748b)' }}>
                  Attach bill of materials or work order authorization and enter installation instructions
                </span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: 20 }}>
              {/* Remarks */}
              <div style={{ gridColumn: 'span 1' }}>
                <FloatingInput
                  label="Remarks"
                  name="remarks"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  disabled={loading}
                  placeholder="Optional installation notes or hardware specs"
                />
              </div>
            </div>

            {/* File Dropzone */}
            <div style={{ maxWidth: 540 }}>
              <UploadDropzone
                id="install_file"
                label="File"
                required
                accept=".pdf,.jpg,.jpeg,.png,.docx,.xlsx"
                disabled={loading}
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
            <Link to="/vendor-management/goa/srt/installation/view-assign" className="ax-btn ax-btn--secondary">
              Cancel
            </Link>
            <button
              type="submit"
              className="ax-btn ax-btn--primary"
              disabled={loading || !vendor || !district || selectedSiteIds.length === 0 || (!file && !isEditing)}
              style={{ minWidth: 180, fontWeight: 700 }}
            >
              {loading ? (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                  <span className="ax-spinner" /> {isEditing ? 'Updating...' : 'Assigning...'}
                </span>
              ) : (
                isEditing
                  ? `Update Assignment (${selectedSiteIds.length} Sites)`
                  : `Assign (${selectedSiteIds.length}) Goa SRT Sites →`
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

export default GoaSRTInstallationAssignSites;
