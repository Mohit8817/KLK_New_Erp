import { useState, useEffect, useRef, useCallback, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PageHead } from '../../../../shell/PageHead';
import {
  jammuSurveyAdminService,
  type JKRescoSurveyVendorOption,
  type JKRescoSurveyVolumeOption,
  type JKRescoSurveySiteItem,
} from '../jammuSurveyAdminService';

/* ───────────────── Unified Single-Card Layout with Floating Labels & Section Nav Pills ───────────────── */
const SINGLE_CARD_FORM_CSS = `
.solar-erp-page {
  --asw-primary: #2563eb;
  --asw-primary-rgb: 37, 99, 235;
}
.resco-survey-form .ax-card {
  border: 1px solid var(--ax-border, #e2e8f0);
  border-radius: var(--ax-radius-xl, 16px);
  background: var(--ax-surface-solid, #ffffff);
  box-shadow: var(--ax-shadow-sm, 0 1px 3px rgba(0, 0, 0, 0.05));
  overflow: hidden;
}
.resco-survey-form .ax-card__header {
  padding: var(--ax-space-5, 20px) var(--ax-space-6, 24px);
  border-bottom: 1px solid var(--ax-border-subtle, #f1f5f9);
  background: var(--ax-surface-subtle, #f8fafc);
  display: flex;
  flex-direction: column;
  gap: var(--ax-space-4, 16px);
}
.resco-survey-form .ax-card__body { padding: var(--ax-space-6, 24px); }

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
  border: 1px solid var(--ax-border, #cbd5e1);
  color: var(--ax-text, #0f172a);
  cursor: pointer;
  transition: all var(--ax-motion-fast, 0.15s) var(--ax-ease-standard, ease);
}
.resco-section-pill-btn:hover {
  border-color: #2563eb;
  color: #2563eb;
  background: color-mix(in srgb, #2563eb 6%, var(--ax-surface-solid, #ffffff));
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
.ax-float__input:disabled { opacity: .75; cursor: not-allowed; background: var(--ax-surface-subtle, #f8fafc); }

.ax-float__label {
  position: absolute;
  inset-inline-start: 12px;
  top: 50%;
  transform: translateY(-50%);
  margin: 0;
  padding: 0 4px;
  font-size: var(--ax-text-sm, 13.5px);
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

.sites-checkbox-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 12px;
  max-height: 380px;
  overflow-y: auto;
  padding: 12px;
  border: 1px solid var(--ax-border, #cbd5e1);
  border-radius: 8px;
  background: #f8fafc;
}
.site-check-card {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 6px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  cursor: pointer;
  transition: all 0.15s ease;
}
.site-check-card:hover {
  border-color: #2563eb;
  background: #eff6ff;
}
.site-check-card.selected {
  border-color: #2563eb;
  background: #eff6ff;
  box-shadow: 0 0 0 1px #2563eb;
}
`;

/* ───────────────── Modern Upload Dropzone ───────────────── */
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
  accept = '.pdf,.jpg,.jpeg,.png',
  file,
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
          padding: file ? '12px 14px' : '22px 16px',
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
        {file ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, textAlign: 'left' }}>
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
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ax-text-strong, #1e293b)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {file.name}
                </div>
                <div style={{ fontSize: 11, color: 'var(--ax-text-muted, #64748b)', marginTop: 2 }}>
                  {(file.size / 1024).toFixed(0)} KB &bull; Ready to upload
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
              Click to upload or drag &amp; drop
            </div>
            <div style={{ fontSize: 11, color: 'var(--ax-text-muted, #64748b)', marginTop: 3 }}>
              PDF, JPG, JPEG or PNG (Max 5 MB) &bull; Work Order / Sanction Letter
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

export function AssignRescoSurvey() {
  const navigate = useNavigate();

  // Master Data from API (Strictly Live)
  const [vendors, setVendors] = useState<JKRescoSurveyVendorOption[]>([]);
  const [volumes, setVolumes] = useState<JKRescoSurveyVolumeOption[]>([]);
  const [districts, setDistricts] = useState<string[]>([]);
  const [sites, setSites] = useState<JKRescoSurveySiteItem[]>([]);

  // Loading states
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [loadingSites, setLoadingSites] = useState(false);

  // Form State
  const [vendorId, setVendorId] = useState<string>('');
  const [volume, setVolume] = useState<string>('');
  const [district, setDistrict] = useState<string>('');
  const [selectedSiteIds, setSelectedSiteIds] = useState<number[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [remarks, setRemarks] = useState('');

  // Submit Feedback & Loading
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'danger'; text: string } | null>(null);

  // Section Refs for Quick Nav Pills
  const sec1 = useRef<HTMLDivElement>(null);
  const sec2 = useRef<HTMLDivElement>(null);
  const sec3 = useRef<HTMLDivElement>(null);
  const sec4 = useRef<HTMLDivElement>(null);

  const scrollTo = (ref: React.RefObject<HTMLDivElement | null>) => {
    ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // 1. Initial Load: Form Data (vendors & volumes from Live API)
  const loadInitialFormData = useCallback(async () => {
    setLoadingInitial(true);
    try {
      const data = await jammuSurveyAdminService.getRescoSurveyAssignFormData();
      setVendors(data.vendor || []);
      setVolumes(data.volumes || []);

      if (data.volumes && data.volumes.length > 0) {
        const firstVol = String(data.volumes[0].volume);
        setVolume(firstVol);
      }
    } catch (err: any) {
      console.error('[AssignRescoSurvey] initial form data load error:', err);
      setFeedback({
        type: 'danger',
        text: err?.message || 'Failed to fetch vendors and volumes from server.',
      });
    } finally {
      setLoadingInitial(false);
    }
  }, []);

  useEffect(() => {
    loadInitialFormData();
  }, [loadInitialFormData]);

  // 2. When Volume changes, fetch Districts from Live API
  useEffect(() => {
    if (!volume) {
      setDistricts([]);
      setDistrict('');
      return;
    }

    let active = true;
    const fetchDistricts = async () => {
      setLoadingDistricts(true);
      try {
        const dList = await jammuSurveyAdminService.fetchRescoSurveyDistrict(volume);
        if (active) {
          setDistricts(dList || []);
          if (dList && dList.length > 0) {
            setDistrict(dList[0]);
          } else {
            setDistrict('');
          }
        }
      } catch (err: any) {
        if (active) {
          console.warn('[AssignRescoSurvey] fetch districts error:', err);
          setDistricts([]);
          setDistrict('');
        }
      } finally {
        if (active) setLoadingDistricts(false);
      }
    };

    fetchDistricts();
    return () => {
      active = false;
    };
  }, [volume]);

  // 3. When District changes, fetch unassigned Sites from Live API
  useEffect(() => {
    if (!district) {
      setSites([]);
      setSelectedSiteIds([]);
      return;
    }

    let active = true;
    const fetchSitesForDistrict = async () => {
      setLoadingSites(true);
      try {
        const sList = await jammuSurveyAdminService.fetchRescoSurveySite(district);
        if (active) {
          setSites(sList || []);
          setSelectedSiteIds([]);
        }
      } catch (err: any) {
        if (active) {
          console.warn('[AssignRescoSurvey] fetch sites error:', err);
          setSites([]);
          setSelectedSiteIds([]);
        }
      } finally {
        if (active) setLoadingSites(false);
      }
    };

    fetchSitesForDistrict();
    return () => {
      active = false;
    };
  }, [district]);

  const handleToggleSite = (id: number) => {
    setSelectedSiteIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleSelectAllSites = () => {
    if (selectedSiteIds.length === sites.length) {
      setSelectedSiteIds([]);
    } else {
      setSelectedSiteIds(sites.map((s) => s.id));
    }
  };

  const handleReset = () => {
    setVendorId('');
    setSelectedSiteIds([]);
    setSelectedFile(null);
    setRemarks('');
    setFeedback(null);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    if (!vendorId) {
      setFeedback({ type: 'danger', text: 'Please select an authorized Vendor.' });
      scrollTo(sec1);
      return;
    }
    if (!volume) {
      setFeedback({ type: 'danger', text: 'Please select a Volume.' });
      scrollTo(sec1);
      return;
    }
    if (!district) {
      setFeedback({ type: 'danger', text: 'Please select a District.' });
      scrollTo(sec2);
      return;
    }
    if (!selectedSiteIds.length) {
      setFeedback({ type: 'danger', text: 'Please select at least one site to allocate for survey.' });
      scrollTo(sec3);
      return;
    }

    try {
      setSubmitting(true);
      const fd = new FormData();
      fd.append('vendor', vendorId);
      fd.append('volume', volume);
      fd.append('district', district);
      selectedSiteIds.forEach((sId) => {
        fd.append('site[]', String(sId));
      });
      if (selectedFile) fd.append('file', selectedFile);
      if (remarks.trim()) fd.append('remarks', remarks.trim());

      const res = await jammuSurveyAdminService.storeRescoSurveyAssign(fd);

      setFeedback({
        type: 'success',
        text: res.message || `Successfully allocated ${selectedSiteIds.length} site(s) to vendor.`,
      });

      // Clear site selection
      setSelectedSiteIds([]);
      setSelectedFile(null);
      setRemarks('');

      setTimeout(() => {
        navigate('/vendor-management/jammu/survey/resco/view-assign');
      }, 1500);
    } catch (err: any) {
      console.error('[AssignRescoSurvey] submit error:', err);
      setFeedback({
        type: 'danger',
        text: err?.message || 'Failed to submit RESCO survey assignment. Please check inputs and try again.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="solar-erp-page resco-survey-form">
      <style>{SINGLE_CARD_FORM_CSS}</style>

      {/* Page Head */}
      <PageHead
        title="Jammu RESCO Assign Survey"
        subtitle="Allocate rooftop solar feasibility surveys to registered vendors across Jammu & Kashmir districts and government departments."
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Vendor Management', href: '/vendor-management' },
          { label: 'Jammu', href: '/vendor-management/jammu/survey/resco/dashboard' },
          { label: 'Resco Survey', href: '/vendor-management/jammu/survey/resco/dashboard' },
          { label: 'Assign Survey' },
        ]}
        actions={
          <div style={{ display: 'inline-flex', gap: 8 }}>
            <Link
              to="/vendor-management/jammu/survey/resco/dashboard"
              className="ax-btn ax-btn--secondary ax-btn--sm"
            >
              &larr; Resco Dashboard
            </Link>
            <Link
              to="/vendor-management/jammu/survey/resco/view-assign"
              className="ax-btn ax-btn--primary ax-btn--sm"
            >
              View Assigned Surveys &rarr;
            </Link>
          </div>
        }
      />

      <div className="ax-container" style={{ paddingBottom: 40 }}>
        {feedback && (
          <div
            style={{
              padding: '12px 16px',
              borderRadius: 8,
              marginBottom: 16,
              fontSize: 13,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: feedback.type === 'success' ? '#ecfdf5' : '#fef2f2',
              border: `1px solid ${feedback.type === 'success' ? '#a7f3d0' : '#fecaca'}`,
              color: feedback.type === 'success' ? '#065f46' : '#b91c1c',
            }}
          >
            <span>{feedback.text}</span>
            <button
              type="button"
              onClick={() => setFeedback(null)}
              style={{
                background: 'none',
                border: 'none',
                color: 'inherit',
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: 14,
              }}
            >
              &times;
            </button>
          </div>
        )}

        <div className="ax-card">
          {/* Header with Quick Navigation Pills */}
          <div className="ax-card__header">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--ax-text-strong, #0f172a)' }}>
                  New RESCO Survey Allocation Form
                </h3>
                <p style={{ margin: '3px 0 0', fontSize: 12.5, color: 'var(--ax-text-muted, #64748b)' }}>
                  Controller: JKRescoSurveyController &bull; Real-time unassigned survey sites allocation
                </p>
              </div>

              <div className="resco-section-pills">
                <button type="button" className="resco-section-pill-btn" onClick={() => scrollTo(sec1)}>
                  <span className="pill-num">1</span> Vendor &amp; Volume
                </button>
                <button type="button" className="resco-section-pill-btn" onClick={() => scrollTo(sec2)}>
                  <span className="pill-num">2</span> District Scope
                </button>
                <button type="button" className="resco-section-pill-btn" onClick={() => scrollTo(sec3)}>
                  <span className="pill-num">3</span> Site Selection ({selectedSiteIds.length})
                </button>
                <button type="button" className="resco-section-pill-btn" onClick={() => scrollTo(sec4)}>
                  <span className="pill-num">4</span> Work Order &amp; Submit
                </button>
              </div>
            </div>
          </div>

          {/* Form Body */}
          <div className="ax-card__body">
            <form onSubmit={handleSubmit}>
              {/* ──────────────── SECTION 1: VENDOR & VOLUME ──────────────── */}
              <div ref={sec1} className="resco-section-block">
                <div className="resco-section-header">
                  <div className="resco-section-title-wrap">
                    <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: '#2563eb', letterSpacing: '0.04em' }}>
                      Step 1 of 4
                    </span>
                    <h4 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: 'var(--ax-text-strong, #0f172a)' }}>
                      Vendor &amp; Project Volume
                    </h4>
                  </div>
                  <span style={{ fontSize: 12, color: 'var(--ax-text-muted, #64748b)' }}>
                    Permissions: JK RESCO Survey Registered Parent Vendors
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
                  {/* Vendor Dropdown */}
                  <div className="ax-float">
                    <select
                      id="vendor_id"
                      value={vendorId}
                      onChange={(e) => setVendorId(e.target.value)}
                      required
                      disabled={loadingInitial || submitting}
                      className="ax-float__input"
                    >
                      <option value="">-- Select Vendor --</option>
                      {vendors.map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.name} (ID: #{v.id})
                        </option>
                      ))}
                    </select>
                    <label htmlFor="vendor_id" className="ax-float__label floating">
                      Assign To Vendor <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                  </div>

                  {/* Volume Dropdown */}
                  <div className="ax-float">
                    <select
                      id="volume"
                      value={volume}
                      onChange={(e) => setVolume(e.target.value)}
                      required
                      disabled={loadingInitial || submitting}
                      className="ax-float__input"
                    >
                      <option value="">-- Select Volume --</option>
                      {volumes.map((vol, idx) => (
                        <option key={idx} value={vol.volume}>
                          Volume {vol.volume}
                        </option>
                      ))}
                    </select>
                    <label htmlFor="volume" className="ax-float__label floating">
                      Project Volume <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                  </div>
                </div>
              </div>

              <hr className="resco-section-divider" />

              {/* ──────────────── SECTION 2: DISTRICT SCOPE ──────────────── */}
              <div ref={sec2} className="resco-section-block">
                <div className="resco-section-header">
                  <div className="resco-section-title-wrap">
                    <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: '#2563eb', letterSpacing: '0.04em' }}>
                      Step 2 of 4
                    </span>
                    <h4 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: 'var(--ax-text-strong, #0f172a)' }}>
                      District Geographic Scope
                    </h4>
                  </div>
                  <span style={{ fontSize: 12, color: 'var(--ax-text-muted, #64748b)' }}>
                    {loadingDistricts ? 'Fetching available districts...' : `${districts.length} District(s) found for Volume ${volume || '1'}`}
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
                  {/* District Dropdown */}
                  <div className="ax-float">
                    <select
                      id="district"
                      value={district}
                      onChange={(e) => setDistrict(e.target.value)}
                      required
                      disabled={loadingDistricts || submitting || !districts.length}
                      className="ax-float__input"
                    >
                      <option value="">-- Select District --</option>
                      {districts.map((d, idx) => (
                        <option key={idx} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                    <label htmlFor="district" className="ax-float__label floating">
                      District <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                  </div>
                </div>
              </div>

              <hr className="resco-section-divider" />

              {/* ──────────────── SECTION 3: SITE SELECTION ──────────────── */}
              <div ref={sec3} className="resco-section-block">
                <div className="resco-section-header">
                  <div className="resco-section-title-wrap">
                    <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: '#2563eb', letterSpacing: '0.04em' }}>
                      Step 3 of 4
                    </span>
                    <h4 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: 'var(--ax-text-strong, #0f172a)' }}>
                      Available Unassigned Survey Sites ({sites.length})
                    </h4>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: '#2563eb' }}>
                      {selectedSiteIds.length} of {sites.length} Selected
                    </span>
                    {sites.length > 0 && (
                      <button
                        type="button"
                        className="ax-btn ax-btn--ghost ax-btn--sm"
                        onClick={handleSelectAllSites}
                      >
                        {selectedSiteIds.length === sites.length ? 'Deselect All' : 'Select All'}
                      </button>
                    )}
                  </div>
                </div>

                {loadingSites ? (
                  <div style={{ padding: 30, textAlign: 'center', color: '#64748b' }}>
                    <div className="ax-spinner" style={{ margin: '0 auto 10px' }} />
                    Loading available sites for district &quot;{district}&quot;...
                  </div>
                ) : sites.length === 0 ? (
                  <div
                    style={{
                      padding: 30,
                      textAlign: 'center',
                      background: '#f8fafc',
                      borderRadius: 8,
                      border: '1px dashed #cbd5e1',
                      color: '#64748b',
                    }}
                  >
                    {district
                      ? `No unassigned survey sites found in "${district}". All sites may already be assigned or surveyed.`
                      : 'Please select a district above to view unassigned survey sites.'}
                  </div>
                ) : (
                  <div className="sites-checkbox-grid">
                    {sites.map((site) => {
                      const isChecked = selectedSiteIds.includes(site.id);
                      return (
                        <div
                          key={site.id}
                          className={`site-check-card ${isChecked ? 'selected' : ''}`}
                          onClick={() => handleToggleSite(site.id)}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleToggleSite(site.id)}
                            style={{ marginTop: 3, cursor: 'pointer' }}
                          />
                          <div style={{ minWidth: 0, flex: 1 }}>
                            <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>
                              {site.site_name}
                            </div>
                            <div style={{ fontSize: 11, color: '#64748b', marginTop: 2, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                              <span>ID: #{site.id}</span>
                              {site.ca_no && <span>CA: {site.ca_no}</span>}
                              {site.connected && <span>Conn: {site.connected}</span>}
                              {site.dept_name && <span>Dept: {site.dept_name}</span>}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <hr className="resco-section-divider" />

              {/* ──────────────── SECTION 4: ATTACHMENT & REMARKS ──────────────── */}
              <div ref={sec4} className="resco-section-block">
                <div className="resco-section-header">
                  <div className="resco-section-title-wrap">
                    <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: '#2563eb', letterSpacing: '0.04em' }}>
                      Step 4 of 4
                    </span>
                    <h4 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: 'var(--ax-text-strong, #0f172a)' }}>
                      Work Order Document &amp; Remarks
                    </h4>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
                  {/* File Upload Dropzone */}
                  <UploadDropzone
                    id="assign_file"
                    label="Sanction Letter / Allocation Document (Optional)"
                    file={selectedFile}
                    onSelect={(f) => setSelectedFile(f)}
                    onRemove={() => setSelectedFile(null)}
                    disabled={submitting}
                  />

                  {/* Remarks Input */}
                  <div className="ax-float">
                    <textarea
                      id="remarks"
                      value={remarks}
                      onChange={(e) => setRemarks(e.target.value)}
                      disabled={submitting}
                      placeholder="Special instructions or survey deadline notes..."
                      rows={4}
                      style={{ height: 'auto', minHeight: 110, padding: '16px 14px 8px' }}
                      className="ax-float__input"
                    />
                    <label htmlFor="remarks" className={`ax-float__label ${remarks ? 'has-val' : ''}`}>
                      Assignment Remarks (Optional)
                    </label>
                  </div>
                </div>
              </div>

              {/* Form Action Buttons */}
              <div
                style={{
                  marginTop: 32,
                  paddingTop: 20,
                  borderTop: '1px solid #e2e8f0',
                  display: 'flex',
                  justifyContent: 'flex-end',
                  alignItems: 'center',
                  gap: 12,
                }}
              >
                <button
                  type="button"
                  className="ax-btn ax-btn--secondary"
                  onClick={handleReset}
                  disabled={submitting}
                >
                  Reset Form
                </button>
                <button
                  type="submit"
                  className="ax-btn ax-btn--primary"
                  disabled={submitting || !selectedSiteIds.length || !vendorId}
                  style={{ fontWeight: 600 }}
                >
                  {submitting ? 'Assigning Survey Sites...' : `Allocate ${selectedSiteIds.length} Site(s) to Vendor`}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AssignRescoSurvey;
