<<<<<<< HEAD
import { useState, useMemo, useRef, useEffect, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PageHead } from '../../../../shell/PageHead';
import {
  jammuRescoAdminService,
  type VendorItem,
} from './jammuRescoAdminService';
import {
  SINGLE_CARD_FORM_CSS,
  FloatingInput,
  UploadDropzone,
  StatusFeedbackBanners,
} from '../../../up/Installation/upInstallationShared';

export function ViewAssignVendorInstallation() {
  const navigate = useNavigate();

  // Dynamic API Options (Strictly live - zero fake fallback)
  const [vendorList, setVendorList] = useState<VendorItem[]>([]);
  const [srtRecords, setSrtRecords] = useState<any[]>([]);
  const [fetchingOptions, setFetchingOptions] = useState(true);
  const [fetchingSiteDetail, setFetchingSiteDetail] = useState(false);

  // Selected Site & Vendor
  const [selectedSiteId, setSelectedSiteId] = useState<string>('');
  const [selectedVendorId, setSelectedVendorId] = useState<string>('');

  // Unified vendors mapping and list (includes all vendors from API and any inst_vendor from srtRecords)
  const vendorMap = useMemo(() => {
    const map = new Map<number, string>();
    vendorList.forEach((v) => {
      map.set(Number(v.id), v.name);
    });
    srtRecords.forEach((s) => {
      const vid = Number(s.inst_vendor || 0);
      if (vid > 0 && !map.has(vid)) {
        map.set(vid, s.vendor_name || `Vendor #${vid}`);
      }
    });
    return map;
  }, [vendorList, srtRecords]);

  const combinedVendors = useMemo(() => {
    const list: { id: number; name: string }[] = [...vendorList];
    const existingIds = new Set(vendorList.map((v) => Number(v.id)));

    srtRecords.forEach((s) => {
      const vid = Number(s.inst_vendor || 0);
      if (vid > 0 && !existingIds.has(vid)) {
        existingIds.add(vid);
        list.push({
          id: vid,
          name: s.vendor_name || `Vendor #${vid}`,
        });
      }
    });

    return list.sort((a, b) => a.id - b.id);
  }, [vendorList, srtRecords]);

  const currentSite = useMemo(() => {
    return srtRecords.find((s) => String(s.id) === String(selectedSiteId));
  }, [srtRecords, selectedSiteId]);

  const currentSiteVendorId = Number(currentSite?.inst_vendor || 0);
  const currentSiteVendorName = currentSiteVendorId > 0 ? vendorMap.get(currentSiteVendorId) : null;

  // Handle immediate vendor synchronization when a site is picked
  const handleSiteSelect = (siteId: string) => {
    setSelectedSiteId(siteId);
    if (!siteId) {
      setSiteDetails(null);
      setSelectedVendorId('');
      return;
    }
    const found = srtRecords.find((r) => String(r.id) === String(siteId));
    if (found) {
      const vId = Number(found.inst_vendor ?? 0);
      if (vId > 0) {
        setSelectedVendorId(String(vId));
      }
    }
  };

  // Auto-populated General Information from fetchSiteDetail
  const [siteDetails, setSiteDetails] = useState<{
    id?: number;
    unique_id?: string;
    state?: string;
    district?: string;
    division?: string;
    sub_division?: string;
    dept_name?: string;
    site_name?: string;
    address?: string;
    location?: string;
    ca_no?: string;
    wo_no?: string;
    plant_sc?: string | number;
    inst_vendor?: number | string;
    vendor?: number | string;
  } | null>(null);

  // Form Fields: Contact & Address
  const [siteAddress, setSiteAddress] = useState('');
  const [landmark, setLandmark] = useState('');
  const [agencyPersonName, setAgencyPersonName] = useState('');
  const [agencyPersonContact, setAgencyPersonContact] = useState('');
  const [nodalPerson, setNodalPerson] = useState('');
  const [contactNodal, setContactNodal] = useState('');
  const [latitude, setLatitude] = useState('32.7266');
  const [longitude, setLongitude] = useState('74.8570');

  // Technical Information
  const [loadType, setLoadType] = useState('AC');
  const [connectionPhase, setConnectionPhase] = useState('3 Phase');
  const [meterConnection, setMeterConnection] = useState('LT');
  const [meterNumber, setMeterNumber] = useState('');
  const [meterType, setMeterType] = useState('Smart Meter');
  const [sanctionLoad, setSanctionLoad] = useState('');
  const [connectedLoad, setConnectedLoad] = useState('');
  const [gridPower, setGridPower] = useState('Yes');
  const [all3PhaseLtdb, setAll3PhaseLtdb] = useState('Yes');
  const [missingPhase, setMissingPhase] = useState('None');
  const [ltdbPresent, setLtdbPresent] = useState('Present');
  const [roofCondition, setRoofCondition] = useState('Feasible');
  const [areaRoof, setAreaRoof] = useState('');
  const [freeSpaceSolar, setFreeSpaceSolar] = useState('');
  const [freeSpaceInverter, setFreeSpaceInverter] = useState('');
  const [earthPit, setEarthPit] = useState('Ok');
=======
<<<<<<< HEAD
import { useState, useMemo, useRef, type FormEvent, type ChangeEvent } from 'react';
import { Link } from 'react-router-dom';
import { PageHead } from '../../../../shell/PageHead';
import {
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
.resco-feasibility-form .ax-card {
  border: 1px solid var(--ax-border, #e2e8f0);
  border-radius: var(--ax-radius-xl, 16px);
  background: var(--ax-surface-solid, #ffffff);
  box-shadow: var(--ax-shadow-sm, 0 1px 2px 0 rgba(0, 0, 0, 0.05));
  overflow: hidden;
}
.resco-feasibility-form .ax-card__header {
=======
<<<<<<< HEAD
import React from 'react';
import RescoInstallSite from '../../../../V-Portal/jammu/Installation/Resco/RescoInstallSite';

/**
 * Super Admin - Jammu RESCO Assigned Vendor Installation Desk
 * Review vendor site installation submissions, solar inverter specs, and installation progress
 */
export const ViewAssignVendorInstallation: React.FC = () => {
  return <RescoInstallSite />;
=======
import { useState, useEffect, useRef, useMemo, useCallback, type FormEvent, type ChangeEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { PageHead } from '../../../../shell/PageHead';
import { authService } from '../../../../../services/authService';
import { useAuth } from '../../../../../context/AuthContext';
import {
  jammuRescoService,
  type JammuRescoSiteNameItem,
  type JammuRescoSiteDetail,
} from '../../../../V-Portal/jammu/jammu-services';
import { CameraBarcodeScannerModal } from '../../../../V-Portal/jammu/Installation/Resco/CameraBarcodeScannerModal';

/* ───────── Unified Single-Card Layout matching Reference Design ───────── */
const SINGLE_CARD_FORM_CSS = `
.solar-erp-page {
  --asw-primary: #2563eb;
  --asw-primary-rgb: 37, 99, 235;
}
.jammu-inst-form .ax-card {
  border: 1px solid var(--ax-border, #e2e8f0);
  border-radius: var(--ax-radius-xl, 16px);
  background: var(--ax-surface-solid, #ffffff);
  box-shadow: var(--ax-shadow-sm, 0 1px 3px rgba(0, 0, 0, 0.05));
  overflow: hidden;
}
.jammu-inst-form .ax-card__header {
>>>>>>> 59fd9085bf4bc8a389c8081f5e629e98c59272e9
  padding: var(--ax-space-5, 20px) var(--ax-space-6, 24px);
  border-bottom: 1px solid var(--ax-border-subtle, #f1f5f9);
  background: var(--ax-surface-subtle, #f8fafc);
  display: flex;
  flex-direction: column;
  gap: var(--ax-space-4, 16px);
}
<<<<<<< HEAD
.resco-feasibility-form .ax-card__body { padding: var(--ax-space-6, 24px); }

/* Quick Section Nav Pills */
.resco-section-pills {
=======
.jammu-inst-form .ax-card__body { padding: var(--ax-space-6, 24px); }

/* Quick Section Nav Pills */
.swp-section-pills {
>>>>>>> 59fd9085bf4bc8a389c8081f5e629e98c59272e9
  display: flex;
  gap: var(--ax-space-2, 8px);
  overflow-x: auto;
  padding-bottom: 4px;
  scrollbar-width: thin;
}
<<<<<<< HEAD
.resco-section-pill-btn {
=======
.swp-section-pill-btn {
>>>>>>> 59fd9085bf4bc8a389c8081f5e629e98c59272e9
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border-radius: var(--ax-radius-pill, 9999px);
  font-size: var(--ax-text-xs, 12px);
  font-weight: 500;
  white-space: nowrap;
  background: var(--ax-surface-solid, #ffffff);
<<<<<<< HEAD
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
=======
  border: 1px solid var(--ax-border, #cbd5e1);
  color: var(--ax-text, #0f172a);
  cursor: pointer;
  transition: all var(--ax-motion-fast, 0.15s) var(--ax-ease-standard, ease);
}
.swp-section-pill-btn:hover {
  border-color: #2563eb;
  color: #2563eb;
  background: color-mix(in srgb, #2563eb 6%, var(--ax-surface-solid, #ffffff));
}
.swp-section-pill-btn .pill-num {
>>>>>>> 59fd9085bf4bc8a389c8081f5e629e98c59272e9
  width: 18px; height: 18px; border-radius: 50%;
  background: var(--ax-surface-subtle, #f1f5f9);
  display: inline-flex; align-items: center; justify-content: center;
  font-size: 10px; font-weight: 700;
}

/* Section Block */
<<<<<<< HEAD
.resco-section-block { padding-top: var(--ax-space-2, 8px); }
.resco-section-header {
=======
.swp-section-block { padding-top: var(--ax-space-2, 8px); }
.swp-section-header {
>>>>>>> 59fd9085bf4bc8a389c8081f5e629e98c59272e9
  display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap;
  gap: var(--ax-space-2, 8px);
  margin-bottom: var(--ax-space-5, 20px);
  padding-bottom: var(--ax-space-3, 12px);
  border-bottom: 1px solid var(--ax-border-subtle, #f1f5f9);
}
<<<<<<< HEAD
.resco-section-title-wrap { display: flex; flex-direction: column; gap: 4px; }
.resco-section-divider {
  border: 0;
  border-top: 1px dashed var(--ax-border, #e2e8f0);
=======
.swp-section-title-wrap { display: flex; flex-direction: column; gap: 4px; }
.swp-section-divider {
  border: 0;
  border-top: 1px dashed var(--ax-border, #cbd5e1);
>>>>>>> 59fd9085bf4bc8a389c8081f5e629e98c59272e9
  margin: var(--ax-space-8, 32px) 0 var(--ax-space-6, 24px);
}

/* Floating Label Core */
.ax-float { position: relative; width: 100%; }
.ax-float__input {
  width: 100%;
  height: 46px;
  padding: 12px 14px 4px 14px;
<<<<<<< HEAD
  font-size: var(--ax-text-sm, 13px);
=======
  font-size: var(--ax-text-sm, 13.5px);
>>>>>>> 59fd9085bf4bc8a389c8081f5e629e98c59272e9
  background: var(--ax-surface-solid, #ffffff);
  border: 1px solid var(--ax-border, #cbd5e1);
  border-radius: var(--ax-radius-md, 8px);
  color: var(--ax-text, #0f172a);
  outline: none;
<<<<<<< HEAD
  transition: border-color var(--ax-motion-fast, 150ms) var(--ax-ease-standard, ease),
              box-shadow var(--ax-motion-fast, 150ms) var(--ax-ease-standard, ease);
}
.ax-float__input::placeholder { color: transparent; }
.ax-float__input:focus {
  border-color: #2559bf;
  box-shadow: 0 0 0 3px color-mix(in srgb, #2559bf 20%, transparent);
}
.ax-float__input:disabled { opacity: .7; cursor: not-allowed; background: var(--ax-surface-subtle, #f8fafc); }
=======
  transition: border-color var(--ax-motion-fast, 0.15s) var(--ax-ease-standard, ease),
              box-shadow var(--ax-motion-fast, 0.15s) var(--ax-ease-standard, ease);
}
.ax-float__input::placeholder { color: transparent; }
.ax-float__input:focus::placeholder { color: #94a3b8; }
.ax-float__input:focus {
  border-color: #2563eb;
  box-shadow: 0 0 0 3px color-mix(in srgb, #2563eb 20%, transparent);
}
.ax-float__input:disabled { opacity: .75; cursor: not-allowed; background: var(--ax-surface-subtle, #f8fafc); }
>>>>>>> 59fd9085bf4bc8a389c8081f5e629e98c59272e9

.ax-float__label {
  position: absolute;
  inset-inline-start: 12px;
  top: 50%;
  transform: translateY(-50%);
  margin: 0;
  padding: 0 4px;
<<<<<<< HEAD
  font-size: var(--ax-text-sm, 13px);
=======
  font-size: var(--ax-text-sm, 13.5px);
>>>>>>> 59fd9085bf4bc8a389c8081f5e629e98c59272e9
  color: var(--ax-text-subtle, #64748b);
  background: var(--ax-surface-solid, #ffffff);
  border-radius: var(--ax-radius-xs, 4px);
  pointer-events: none;
<<<<<<< HEAD
  transition: top var(--ax-motion-fast, 150ms) var(--ax-ease-standard, ease),
              font-size var(--ax-motion-fast, 150ms) var(--ax-ease-standard, ease),
              color var(--ax-motion-fast, 150ms) var(--ax-ease-standard, ease);
=======
  transition: top var(--ax-motion-fast, 0.15s) var(--ax-ease-standard, ease),
              font-size var(--ax-motion-fast, 0.15s) var(--ax-ease-standard, ease),
              color var(--ax-motion-fast, 0.15s) var(--ax-ease-standard, ease);
>>>>>>> 59fd9085bf4bc8a389c8081f5e629e98c59272e9
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
<<<<<<< HEAD
  color: #2559bf;
=======
  color: #2563eb;
>>>>>>> 59fd9085bf4bc8a389c8081f5e629e98c59272e9
}
.ax-float__label.has-val:not(.floating) {
  top: 0;
  font-size: 11px;
  font-weight: 500;
  color: var(--ax-text-muted, #64748b);
}
<<<<<<< HEAD
`;

const RESCO_FEASIBILITY_VENDORS = [
  'NA',
  'Ajay sharma (ID: 42)',
  'Manish dubey (ID: 60)',
  'KAMAL (ID: 85)',
  'Raja (ID: 114)',
  'shivram (ID: 140)',
  'shiv (ID: 151)',
  'Adil Shah (ID: 178)',
  'krishna (ID: 183)',
  'utkarsh (ID: 184)',
  'Deepak Kumar (ID: 185)',
  'lekhpal (ID: 191)',
  'Rajinder kumar (ID: 192)',
  'RAKESH (ID: 194)',
  'Jammu TEsting (ID: 201)',
  'rajnish (ID: 222)',
  'bharti (ID: 223)',
  'bhavi (ID: 230)',
  'bhavi (ID: 231)',
  'Sumit12 (ID: 268)',
  '7006925961 (ID: 278)',
  'FIRDOS JI (ID: 279)',
  'Niraj Kumar singh (ID: 281)',
  '9149495760 (ID: 282)',
  'Fairoze ahmad bhat (ID: 283)',
  '9858272740 (ID: 284)',
  'Vinay Kumar Singh (ID: 285)',
  'GS SOLUTION (ID: 286)',
  'Indra Kumar (ID: 287)',
  'Sharafat (ID: 288)',
  'VIPIN KUMAR YADAV (ID: 289)',
  'SARFRAZ AHMED (ID: 300)',
  'Mohit (ID: 355)',
  'Mohit (ID: 356)',
];
=======

/* Upload dropzone grid */
.jammu-upload-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 16px;
  margin-top: 8px;
}
@media (max-width: 640px) {
  .jammu-upload-grid {
    grid-template-columns: 1fr;
  }
}
`;
>>>>>>> 59fd9085bf4bc8a389c8081f5e629e98c59272e9

interface FloatingInputProps {
  label: string;
  name: string;
  value: string;
<<<<<<< HEAD
  onChange: (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
=======
  onChange: (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
>>>>>>> 59fd9085bf4bc8a389c8081f5e629e98c59272e9
  required?: boolean;
  disabled?: boolean;
  type?: string;
  placeholder?: string;
<<<<<<< HEAD
}

function FloatingInput({ label, name, value, onChange, required, disabled, type = 'text', placeholder }: FloatingInputProps) {
  const [focused, setFocused] = useState(false);
  const hasVal = Boolean(value && String(value).length > 0);

  return (
    <div className="ax-float">
=======
  onCameraClick?: () => void;
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
  onCameraClick,
}: FloatingInputProps) {
  const [focused, setFocused] = useState(false);
  const hasVal = Boolean(value && String(value).length > 0);

  const inputNode = (
    <div className="ax-float" style={{ flex: 1, minWidth: 0 }}>
>>>>>>> 59fd9085bf4bc8a389c8081f5e629e98c59272e9
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
<<<<<<< HEAD
      />
      <label htmlFor={name} className={`ax-float__label ${focused ? 'floating' : hasVal ? 'has-val' : ''}`}>
        {label} {required && <span style={{ color: '#ef4444' }}>*</span>}
      </label>
    </div>
  );
}

function DropzoneMini({
  id,
  label,
  file,
  onSelect,
  required,
}: {
  id: string;
  label: string;
  file: File | null;
  onSelect: (f: File | null) => void;
  required?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <label style={{ fontSize: 12, fontWeight: 600, color: '#334155' }}>
        {label} {required && <span style={{ color: '#ef4444' }}>*</span>}
      </label>
      <input
        ref={inputRef}
        type="file"
        id={id}
=======
        style={onCameraClick ? { borderTopRightRadius: 0, borderBottomRightRadius: 0 } : undefined}
      />
      <label htmlFor={name} className={`ax-float__label ${focused ? 'floating' : hasVal ? 'has-val' : ''}`}>
        {label} {required && <span style={{ color: 'var(--ax-danger, #ef4444)' }}>*</span>}
      </label>
    </div>
  );

  if (onCameraClick) {
    return (
      <div style={{ display: 'flex', alignItems: 'stretch', width: '100%' }}>
        {inputNode}
        <button
          type="button"
          className="ax-btn ax-btn--secondary"
          onClick={onCameraClick}
          title={`Scan barcode for ${label}`}
          aria-label={`Scan barcode for ${label}`}
          style={{
            height: 46,
            padding: '0 12px',
            borderTopLeftRadius: 0,
            borderBottomLeftRadius: 0,
            borderLeft: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            color: '#2563eb',
            fontWeight: 600,
            fontSize: '12px',
            flexShrink: 0,
            background: 'var(--ax-surface-subtle, #f8fafc)',
            borderColor: 'var(--ax-border, #cbd5e1)',
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
            <circle cx="12" cy="13" r="4" />
          </svg>
          <span>Scan</span>
        </button>
      </div>
    );
  }

  return inputNode;
}

/* ───────── Upload Dropzone ───────── */
interface UploadDropzoneProps {
  id: string;
  label: string;
  required?: boolean;
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
  accept = 'image/*,application/pdf',
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
>>>>>>> 59fd9085bf4bc8a389c8081f5e629e98c59272e9
        style={{ display: 'none' }}
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onSelect(f);
        }}
      />
<<<<<<< HEAD
      <div
        onClick={() => inputRef.current?.click()}
        style={{
          border: '1.5px dashed #cbd5e1',
          borderRadius: 8,
          padding: '10px 12px',
          background: file ? '#eff6ff' : '#f8fafc',
          cursor: 'pointer',
          textAlign: 'center',
          fontSize: 12,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <span style={{ color: file ? '#2559bf' : '#64748b', fontWeight: file ? 600 : 400, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {file ? `✓ ${file.name}` : `Upload ${label}`}
        </span>
        {file && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSelect(null);
            }}
            style={{ border: 'none', background: 'none', color: '#ef4444', cursor: 'pointer', fontWeight: 700 }}
          >
            ✕
          </button>
        )}
      </div>
=======

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
            : '1.5px dashed #cbd5e1',
          borderRadius: 8,
          background: isDragging
            ? '#eff6ff'
            : error
            ? '#fef2f2'
            : isHovered
            ? '#fbfcfd'
            : '#ffffff',
          padding: file || preview ? '12px 14px' : '20px 16px',
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
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ax-text-strong, #0f172a)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
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
              title="Remove photo"
            >
              Remove
            </button>
          </div>
        ) : (
          <>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                background: '#eff6ff',
                color: '#3b82f6',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 6,
              }}
            >
              <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" />
                <path d="M12 12v9" />
                <path d="m8 16 4-4 4 4" />
              </svg>
            </div>
            <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--ax-text-strong, #1e293b)' }}>
              Choose File <span style={{ fontWeight: 400, color: 'var(--ax-text-muted, #64748b)', fontSize: 11.5 }}>No file chosen</span>
            </div>
            <div style={{ fontSize: 11, color: 'var(--ax-text-muted, #64748b)', marginTop: 2 }}>
              JPG, PNG or PDF (max 5 MB)
            </div>
          </>
        )}
      </div>

      {error && (
        <span style={{ fontSize: 11, color: 'var(--ax-danger-500, #ef4444)', marginTop: 2 }}>
          {error}
        </span>
      )}
>>>>>>> 59fd9085bf4bc8a389c8081f5e629e98c59272e9
    </div>
  );
}

<<<<<<< HEAD
export function ViewAssignVendorInstallation() {
  // Top selector states
  const [selectedSiteId, setSelectedSiteId] = useState<string>('');
  const [selectedVendor, setSelectedVendor] = useState<string>('');

  // Contact & Agency Information
  const [siteAddress, setSiteAddress] = useState('');
  const [nearestLandmark, setNearestLandmark] = useState('');
  const [agencyContactPerson, setAgencyContactPerson] = useState('');
  const [agencyContactNumber, setAgencyContactNumber] = useState('');
  const [nodalPerson, setNodalPerson] = useState('');
  const [nodalContact, setNodalContact] = useState('');

  // Technical Information
  const [typeOfLoad, setTypeOfLoad] = useState('AC');
  const [connectionPhase, setConnectionPhase] = useState('3 Phase');
  const [meterConnectionType, setMeterConnectionType] = useState('LT');
  const [meterNumber, setMeterNumber] = useState('');
  const [meterType, setMeterType] = useState('Smart Meter');
  const [sanctionLoad, setSanctionLoad] = useState('');
  const [instantaneousLoad, setInstantaneousLoad] = useState('');
  const [gridPowerHours, setGridPowerHours] = useState('Yes');
  const [threePhaseAvailable, setThreePhaseAvailable] = useState('Yes');
  const [phaseMissingName, setPhaseMissingName] = useState('None');
  const [ltdbPresent, setLtdbPresent] = useState('Present');
  const [roofCondition, setRoofCondition] = useState('Feasible');
  const [totalAreaRoof, setTotalAreaRoof] = useState('');
  const [freeSpaceSolar, setFreeSpaceSolar] = useState('');
  const [freeSpaceControlRoom, setFreeSpaceControlRoom] = useState('');
  const [earthPitPosition, setEarthPitPosition] = useState('Ok');
>>>>>>> 70f527ba60f555fe6ad1fa61874f359bd66bf9d7
  const [siteFeasible, setSiteFeasible] = useState('Feasible');
  const [surveyRemarks, setSurveyRemarks] = useState('');

  // Civil / Structural
<<<<<<< HEAD
  const [buildingAge, setBuildingAge] = useState('');
  const [roofAccess, setRoofAccess] = useState('Available');
  const [rooftopHeight, setRooftopHeight] = useState('');
  const [parapetHeight, setParapetHeight] = useState('');
  const [floorsNumber, setFloorsNumber] = useState('G+1');
  const [waterSource, setWaterSource] = useState('Available');
  const [siteAccess, setSiteAccess] = useState('Good');
  const [siteDistance, setSiteDistance] = useState('0');

  // Images & Documents
  const [buildingImage, setBuildingImage] = useState<File | null>(null);
  const [buildingImagePreview, setBuildingImagePreview] = useState<string | undefined>(undefined);

  const [roofImage, setRoofImage] = useState<File | null>(null);
  const [roofImagePreview, setRoofImagePreview] = useState<string | undefined>(undefined);

  const [controlRoomImage, setControlRoomImage] = useState<File | null>(null);
  const [controlRoomImagePreview, setControlRoomImagePreview] = useState<string | undefined>(undefined);

  const [meterImage, setMeterImage] = useState<File | null>(null);
  const [meterImagePreview, setMeterImagePreview] = useState<string | undefined>(undefined);

  const [otherImage, setOtherImage] = useState<File | null>(null);
  const [otherImagePreview, setOtherImagePreview] = useState<string | undefined>(undefined);

  const [pdfFile, setPdfFile] = useState<File | null>(null);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Section refs for smooth navigation pills
=======
  const [ageOfBuilding, setAgeOfBuilding] = useState('');
  const [staircaseAccess, setStaircaseAccess] = useState('Available');
  const [rooftopHeight, setRooftopHeight] = useState('');
  const [parapetHeight, setParapetHeight] = useState('');
  const [noOfFloors, setNoOfFloors] = useState('');
  const [waterSourceCleaning, setWaterSourceCleaning] = useState('');

  // Other Information & Evidence
  const [accessToSite, setAccessToSite] = useState('');
  const [distanceFromRoad, setDistanceFromRoad] = useState('');
  const [buildingImg, setBuildingImg] = useState<File | null>(null);
  const [roofImg, setRoofImg] = useState<File | null>(null);
  const [controlRoomImg, setControlRoomImg] = useState<File | null>(null);
  const [meterImg, setMeterImg] = useState<File | null>(null);
  const [otherImg, setOtherImg] = useState<File | null>(null);
  const [pdfDoc, setPdfDoc] = useState<File | null>(null);

  // Status feedback
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Section nav pills refs
>>>>>>> 70f527ba60f555fe6ad1fa61874f359bd66bf9d7
  const sec1 = useRef<HTMLDivElement>(null);
  const sec2 = useRef<HTMLDivElement>(null);
  const sec3 = useRef<HTMLDivElement>(null);
  const sec4 = useRef<HTMLDivElement>(null);
<<<<<<< HEAD
  const sec5 = useRef<HTMLDivElement>(null);
=======
>>>>>>> 70f527ba60f555fe6ad1fa61874f359bd66bf9d7

  const scrollTo = (ref: React.RefObject<HTMLDivElement | null>) => {
    ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

<<<<<<< HEAD
  // 1. Initial Load: View Assign Vendor data (vendors & srtRecords)
  useEffect(() => {
    let cancelled = false;
    setFetchingOptions(true);
    setErrorMsg('');

    jammuRescoAdminService
      .getViewAssignVendor()
      .then((res) => {
        if (!cancelled) {
          setVendorList(res.vendors || []);
          setSrtRecords(res.srtRecords || []);
        }
      })
      .catch((err: any) => {
        if (!cancelled) setErrorMsg(err?.message || 'Failed to load assigned vendor sites.');
      })
      .finally(() => {
        if (!cancelled) setFetchingOptions(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // 2. Fetch Site Detail when selectedSiteId changes
  useEffect(() => {
    if (!selectedSiteId) {
      setSiteDetails(null);
      return;
    }

    let cancelled = false;
    setFetchingSiteDetail(true);

    jammuRescoAdminService
      .fetchSiteDetail(selectedSiteId)
      .then((res) => {
        if (!cancelled && res.success && res.srt) {
          const s = res.srt;
          setSiteDetails(s);
          if (s.address) setSiteAddress(s.address);
          if (s.sanction_load || s.plant_sc) setSanctionLoad(String(s.sanction_load || s.plant_sc));
          if (s.latitude) setLatitude(String(s.latitude));
          if (s.longitude) setLongitude(String(s.longitude));
          const vId = Number(s.inst_vendor || s.vendor || 0);
          if (vId > 0) {
            setSelectedVendorId(String(vId));
          }
        }
      })
      .catch((err: any) => {
        if (!cancelled) setErrorMsg(err?.message || 'Failed to fetch site details.');
      })
      .finally(() => {
        if (!cancelled) setFetchingSiteDetail(false);
      });

    return () => {
      cancelled = true;
    };
=======
  // Currently selected site details
  const activeSite: RescoSiteItem | undefined = useMemo(() => {
    if (!selectedSiteId) return JAMMU_RESCO_SITES_CATALOG[0];
    return JAMMU_RESCO_SITES_CATALOG.find((s) => String(s.id) === selectedSiteId) || JAMMU_RESCO_SITES_CATALOG[0];
>>>>>>> 70f527ba60f555fe6ad1fa61874f359bd66bf9d7
  }, [selectedSiteId]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!selectedSiteId) return setErrorMsg('Please select a Site.');
<<<<<<< HEAD
    if (!selectedVendorId) return setErrorMsg('Please select a Vendor.');
    if (!siteAddress.trim()) return setErrorMsg('Site Address details are required.');
    if (!landmark.trim()) return setErrorMsg('Nearest Landmark is required.');
    if (!agencyPersonName.trim()) return setErrorMsg('Agency contact person name is required.');
    if (!agencyPersonContact.trim()) return setErrorMsg('Agency contact number is required.');
    if (!nodalPerson.trim()) return setErrorMsg('Nodal person name is required.');
    if (!contactNodal.trim()) return setErrorMsg('Nodal person contact is required.');
    if (!latitude.trim() || !longitude.trim()) return setErrorMsg('Latitude and Longitude are required.');
    if (!meterNumber.trim()) return setErrorMsg('Meter Number is required.');
    if (!sanctionLoad.trim()) return setErrorMsg('Sanction load is required.');
    if (!connectedLoad.trim()) return setErrorMsg('Connected load is required.');
    if (!areaRoof.trim()) return setErrorMsg('Total area of roof is required.');
    if (!freeSpaceSolar.trim()) return setErrorMsg('Free space for solar is required.');
    if (!freeSpaceInverter.trim()) return setErrorMsg('Free space for control room/inverter is required.');
    if (!buildingAge.trim()) return setErrorMsg('Building age is required.');
    if (!rooftopHeight.trim()) return setErrorMsg('Rooftop height is required.');
    if (!parapetHeight.trim()) return setErrorMsg('Parapet height is required.');
    if (!surveyRemarks.trim()) return setErrorMsg('Survey remarks are required.');
    if (!buildingImage) return setErrorMsg('Building Image is required.');
    if (!roofImage) return setErrorMsg('Roof Image is required.');
    if (!controlRoomImage) return setErrorMsg('Control Room Image is required.');

    setLoading(true);
    try {
      const fd = new FormData();

      // Target IDs (Integer and Aliases)
      const siteIdVal = String(selectedSiteId);
      const targetSurveyId = String(siteDetails?.survey_id || currentSite?.survey_id || siteIdVal);
      const siteNameText = siteDetails?.site_name || currentSite?.site_name || '';

      // Primary site_name (Rule: integer srt_surveys.id / jammu_rescos.id)
      fd.append('site_name', siteIdVal);
      fd.append('site_id', siteIdVal);
      fd.append('id', siteIdVal);
      fd.append('srt_id', siteIdVal);
      if (targetSurveyId && targetSurveyId !== siteIdVal) {
        fd.append('survey_id', targetSurveyId);
      } else {
        fd.append('survey_id', siteIdVal);
      }
      if (siteNameText) {
        fd.append('sitename', siteNameText);
        fd.append('name', siteNameText);
      }

      // Vendor (using selected or site's assigned vendor)
      const effectiveVendor =
        selectedVendorId ||
        String(siteDetails?.inst_vendor || siteDetails?.vendor || currentSite?.inst_vendor || '');
      if (effectiveVendor) {
        fd.append('vendor', effectiveVendor);
        fd.append('inst_vendor', effectiveVendor);
        fd.append('vendor_id', effectiveVendor);
      }

      // State & District matching site details
      const effectiveState = siteDetails?.state || currentSite?.state || 'jammu';
      const effectiveDistrict = siteDetails?.district || currentSite?.district || 'Jammu';
      fd.append('state', effectiveState);
      fd.append('district', effectiveDistrict);

      // Contact & Address
      fd.append('site_address', siteAddress.trim());
      fd.append('landmark', landmark.trim());
      fd.append('agency_person_name', agencyPersonName.trim());
      fd.append('agency_person_contact', agencyPersonContact.trim());
      fd.append('nodal_person', nodalPerson.trim());
      fd.append('contact_nodal', contactNodal.trim());

      // Coordinates
      const effectiveLat = latitude.trim() || (siteDetails?.latitude ? String(siteDetails.latitude).trim() : '32.7266');
      const effectiveLng = longitude.trim() || (siteDetails?.longitude ? String(siteDetails.longitude).trim() : '74.8570');
      fd.append('latitude', effectiveLat);
      fd.append('longitude', effectiveLng);

      // Technical Information
      fd.append('load_type', loadType);
      fd.append('connection_phase', connectionPhase);
      fd.append('meter_connection', meterConnection);
      fd.append('meter_number', meterNumber.trim());
      fd.append('meter_type', meterType);
      fd.append('sanction_load', sanctionLoad.trim());
      fd.append('connected_load', connectedLoad.trim());
      fd.append('grid_power', gridPower);
      fd.append('all_3_phase_ltdb', all3PhaseLtdb);
      fd.append('missing_phase', missingPhase.trim());
      fd.append('ltdb_present', ltdbPresent);
      fd.append('roof_condition', roofCondition);
      fd.append('area_roof', areaRoof.trim());
      fd.append('free_space_solar', freeSpaceSolar.trim());
      fd.append('free_space_inverter', freeSpaceInverter.trim());
      fd.append('earth_pit', earthPit);
      fd.append('site_feasible', siteFeasible);
      fd.append('survey_remarks', surveyRemarks.trim());

      // Civil & Structural
      fd.append('building_age', buildingAge.trim());
      fd.append('roof_access', roofAccess);
      fd.append('rooftop_height', rooftopHeight.trim());
      fd.append('parapet_height', parapetHeight.trim());
      fd.append('floors_number', floorsNumber);
      fd.append('water_source', waterSource);
      fd.append('site_access', siteAccess);
      fd.append('site_distance', siteDistance.trim());

      // Images & Document Attachments (both naming schemes)
      if (buildingImage) {
        fd.append('building_image', buildingImage);
        fd.append('image1', buildingImage);
      }
      if (roofImage) {
        fd.append('roof_image', roofImage);
        fd.append('image2', roofImage);
      }
      if (controlRoomImage) {
        fd.append('control_room_image', controlRoomImage);
        fd.append('image3', controlRoomImage);
      }
      if (meterImage) {
        fd.append('meter_image', meterImage);
        fd.append('image4', meterImage);
      }
      if (otherImage) {
        fd.append('other_image', otherImage);
        fd.append('image5', otherImage);
      }
      if (pdfFile) {
        fd.append('pdf', pdfFile);
        fd.append('pdf_file', pdfFile);
      }

      const res = await jammuRescoAdminService.storeSurvey(fd);
      if (res.success) {
        setSuccessMsg(res.message || 'Jammu RESCO Site Feasibility Survey submitted successfully!');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        setTimeout(() => {
          navigate('/vendor-management/jammu/installation/resco/view-assign-installation');
        }, 1400);
      } else {
        setErrorMsg(res.message || 'Validation failed. Please verify all inputs.');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to submit feasibility survey.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ax-page swp-inst-form">
      <style>{SINGLE_CARD_FORM_CSS}</style>

      <PageHead
        title="Jammu RESCO Assigned Vendor - Site Feasibility Report"
        subtitle="The field labels marked with * are required input fields."
        breadcrumbs={[
          { label: 'ERP Dashboard', href: '/' },
          { label: 'Vendor Management', href: '/vendor-management' },
          { label: 'Jammu', href: '/vendor-management/jammu' },
          { label: 'Installation', href: '/vendor-management/jammu/installation/resco' },
          { label: 'RESCO', href: '/vendor-management/jammu/installation/resco' },
=======
    if (!siteAddress) return setErrorMsg('Site Address (details) is required.');
    if (!nearestLandmark) return setErrorMsg('Nearest Landmark is required.');
    if (!meterNumber) return setErrorMsg('Meter Number is required.');
    if (!sanctionLoad) return setErrorMsg('Sanction Load (KW/KVA) is required.');
    if (!totalAreaRoof) return setErrorMsg('Total Area of Roof (in Sq.Feet) is required.');
=======
export const ViewAssignVendorInstallation: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, rawResponse } = useAuth();

  const paramSiteId = searchParams.get('id') || searchParams.get('site_id') || searchParams.get('resco_id');

  // Vendor name resolution
  const loginVendorName = useMemo(() => {
    const getCleanString = (val: any): string => {
      if (
        typeof val === 'string' &&
        val.trim() &&
        val.trim().toLowerCase() !== '[object object]' &&
        val.trim().toLowerCase() !== 'null' &&
        val.trim().toLowerCase() !== 'undefined' &&
        isNaN(Number(val.trim()))
      ) {
        return val.trim();
      }
      return '';
    };

    if (user) {
      const fromUser =
        getCleanString((user as any).vendor_name) ||
        getCleanString((user as any).vendor) ||
        getCleanString((user as any).name) ||
        getCleanString((user as any).username) ||
        getCleanString((user as any).email);
      if (fromUser) return fromUser;
    }

    if (rawResponse) {
      const fromRaw =
        getCleanString(rawResponse?.vendor?.name) ||
        getCleanString(rawResponse?.vendor?.vendor_name) ||
        getCleanString(rawResponse?.vendor) ||
        getCleanString(rawResponse?.vendor_name) ||
        getCleanString(rawResponse?.name) ||
        getCleanString(rawResponse?.user?.name) ||
        getCleanString(rawResponse?.data?.vendor?.name);
      if (fromRaw) return fromRaw;
    }

    try {
      const session = authService.getSession() as any;
      if (session) {
        const fromSession =
          getCleanString(session.vendor_name) ||
          getCleanString(session.vendor) ||
          getCleanString(session.name);
        if (fromSession) return fromSession;
      }
    } catch {}

    return 'App Testing';
  }, [user, rawResponse]);

  // Section 1: Dropdown sites list
  const [sitesList, setSitesList] = useState<JammuRescoSiteNameItem[]>([]);
  const [loadingSites, setLoadingSites] = useState(false);

  // Selected site and fetched specifications
  const [selectedSiteId, setSelectedSiteId] = useState<string>(paramSiteId || '');
  const [siteDetail, setSiteDetail] = useState<JammuRescoSiteDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Section 3: Fill this Form - User Manual Inputs
  const [vendorName, setVendorName] = useState<string>('App Testing');
  const [contactPerson, setContactPerson] = useState<string>('');
  const [contactNumber, setContactNumber] = useState<string>('');
  const [inverterNo, setInverterNo] = useState<string>('');
  const [solarMeterNo, setSolarMeterNo] = useState<string>('');
  const [nmSmNo, setNmSmNo] = useState<string>('');
  const [logerNo, setLogerNo] = useState<string>('');
  const [latitude, setLatitude] = useState<string>('');
  const [longitude, setLongitude] = useState<string>('');
  const [remarks, setRemarks] = useState<string>('');

  // Panel Numbers array
  const [panelNos, setPanelNos] = useState<string[]>(['']);

  // Section 4: File Uploads
  const [files, setFiles] = useState<{
    system_image: File | null;
    inverter_image: File | null;
    panel_image: File | null;
    nmsm_image: File | null;
    loger_image: File | null;
  }>({
    system_image: null,
    inverter_image: null,
    panel_image: null,
    nmsm_image: null,
    loger_image: null,
  });

  const [previews, setPreviews] = useState<{
    system_image?: string;
    inverter_image?: string;
    panel_image?: string;
    nmsm_image?: string;
    loger_image?: string;
  }>({});

  // Barcode Scanner Modal State
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scannerTargetField, setScannerTargetField] = useState<{
    type: 'field' | 'panel';
    name?: string;
    index?: number;
    title: string;
  } | null>(null);

  // Submission state
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<{ type: 'success' | 'danger'; text: string } | null>(null);

  useEffect(() => {
    if (!toastMsg) return;
    const t = window.setTimeout(() => setToastMsg(null), 4000);
    return () => window.clearTimeout(t);
  }, [toastMsg]);

  // Synchronize vendor name with logged in session
  useEffect(() => {
    if (loginVendorName && loginVendorName !== 'App Testing') {
      setVendorName(loginVendorName);
    }
  }, [loginVendorName]);

  // 1. Fetch dropdown sites list
  const loadSites = useCallback(async () => {
    setLoadingSites(true);
    try {
      const list = await jammuRescoService.getInstallableSiteNames();
      setSitesList(Array.isArray(list) ? list : []);
    } catch (err: any) {
      console.error('[Admin Vendor Installation] loadSites error:', err);
      setSitesList([]);
    } finally {
      setLoadingSites(false);
    }
  }, []);

  useEffect(() => {
    loadSites();
  }, [loadSites]);

  // 2. Fetch selected site details
  const loadSiteDetail = useCallback(async (siteId: string | number) => {
    if (!siteId) {
      setSiteDetail(null);
      return;
    }
    setLoadingDetail(true);
    try {
      const data = await jammuRescoService.getSiteDetails(siteId);
      setSiteDetail(data);

      if (data) {
        if (data.contact_person) setContactPerson(data.contact_person);
        if (data.contact_number) setContactNumber(data.contact_number);
        if (data.inst_vendor || data.vendor) {
          const v = String(data.inst_vendor || data.vendor).trim();
          if (v && isNaN(Number(v))) setVendorName(v);
        }
      }
    } catch (err: any) {
      console.error('[Admin Vendor Installation] loadSiteDetail error:', err);
    } finally {
      setLoadingDetail(false);
    }
  }, []);

  useEffect(() => {
    if (selectedSiteId) {
      loadSiteDetail(selectedSiteId);
    }
  }, [selectedSiteId, loadSiteDetail]);

  // Auto-fetch GPS Geolocation
  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      setToastMsg({ type: 'danger', text: 'Geolocation is not supported by your browser.' });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitude(pos.coords.latitude.toFixed(6));
        setLongitude(pos.coords.longitude.toFixed(6));
        setToastMsg({ type: 'success', text: 'Current GPS coordinates captured!' });
      },
      (err) => {
        console.warn('Geolocation error:', err);
        setToastMsg({ type: 'danger', text: 'Could not access GPS. Please allow location permissions.' });
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Barcode scanner trigger
  const handleOpenScanner = (target: { type: 'field' | 'panel'; name?: string; index?: number; title: string }) => {
    setScannerTargetField(target);
    setScannerOpen(true);
  };

  const handleBarcodeScanned = (scannedCode: string) => {
    if (!scannerTargetField) return;
    const clean = scannedCode.trim();

    if (scannerTargetField.type === 'field') {
      const fName = scannerTargetField.name;
      if (fName === 'inverter_no') setInverterNo(clean);
      else if (fName === 'solarmeter_no') setSolarMeterNo(clean);
      else if (fName === 'nm_sm_no') setNmSmNo(clean);
      else if (fName === 'loger_no') setLogerNo(clean);
    } else if (scannerTargetField.type === 'panel' && scannerTargetField.index !== undefined) {
      const idx = scannerTargetField.index;
      setPanelNos((prev) => {
        const next = [...prev];
        next[idx] = clean;
        return next;
      });
    }

    setToastMsg({ type: 'success', text: `Captured: ${clean}` });
    setScannerOpen(false);
  };

  // Dynamic Panel Serial Handlers
  const handlePanelChange = (idx: number, val: string) => {
    setPanelNos((prev) => {
      const copy = [...prev];
      copy[idx] = val;
      return copy;
    });
  };

  const handleAddPanel = () => {
    setPanelNos((prev) => [...prev, '']);
  };

  const handleRemovePanel = (idx: number) => {
    if (panelNos.length <= 1) {
      setPanelNos(['']);
      return;
    }
    setPanelNos((prev) => prev.filter((_, i) => i !== idx));
  };

  // File Handlers
  const handleFileSelect = (key: keyof typeof files, f: File) => {
    setFiles((prev) => ({ ...prev, [key]: f }));
    const objectUrl = URL.createObjectURL(f);
    setPreviews((prev) => {
      if (prev[key]) URL.revokeObjectURL(prev[key]!);
      return { ...prev, [key]: objectUrl };
    });
  };

  const handleFileRemove = (key: keyof typeof files) => {
    setFiles((prev) => ({ ...prev, [key]: null }));
    if (previews[key]) {
      URL.revokeObjectURL(previews[key]!);
      setPreviews((prev) => ({ ...prev, [key]: undefined }));
    }
  };

  // Submit Handler
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (!selectedSiteId) {
      setSubmitError('Please select a site from the dropdown list.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
>>>>>>> 59fd9085bf4bc8a389c8081f5e629e98c59272e9

    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('site_id', selectedSiteId);
<<<<<<< HEAD
      fd.append('vendor', selectedVendor);
      fd.append('site_address', siteAddress);
      fd.append('nearest_landmark', nearestLandmark);
      fd.append('meter_number', meterNumber);
      fd.append('sanction_load', sanctionLoad);
      fd.append('total_area_roof', totalAreaRoof);
      if (buildingImg) fd.append('building_img', buildingImg);
      if (roofImg) fd.append('roof_img', roofImg);

      const res = await jammuRescoAdminService.submitFeasibilityReport(fd);
      setSuccessMsg(res.message || 'Site Feasibility Report Submitted Successfully!');
    } catch (err: any) {
      console.error('Feasibility submit error:', err);
      setErrorMsg(err?.message || 'Failed to submit Site Feasibility Report.');
=======
      fd.append('id', selectedSiteId);
      fd.append('vendor_name', vendorName);
      fd.append('contact_person', contactPerson);
      fd.append('contact_number', contactNumber);
      fd.append('inverter_no', inverterNo);
      fd.append('solarmeter_no', solarMeterNo);
      fd.append('nm_sm_no', nmSmNo);
      fd.append('loger_no', logerNo);
      fd.append('inst_latitude', latitude);
      fd.append('inst_longitude', longitude);
      fd.append('remarks', remarks);

      // Panel numbers array
      const validPanels = panelNos.map((p) => p.trim()).filter(Boolean);
      validPanels.forEach((p, idx) => {
        fd.append(`panel_no[${idx}]`, p);
      });

      // Files
      if (files.system_image) fd.append('system_image', files.system_image);
      if (files.inverter_image) fd.append('inverter_image', files.inverter_image);
      if (files.panel_image) fd.append('panel_image', files.panel_image);
      if (files.nmsm_image) fd.append('nmsm_image', files.nmsm_image);
      if (files.loger_image) fd.append('loger_image', files.loger_image);

      const res = await jammuRescoService.submitInstallation(fd);
      setToastMsg({
        type: 'success',
        text: res.message || 'Installation submission recorded successfully!',
      });

      // Clear & navigate after success
      setTimeout(() => {
        navigate('/vendor-management/jammu/installation/resco/verify-installation');
      }, 1500);
    } catch (err: any) {
      console.error('[Admin Vendor Installation] submit error:', err);
      setSubmitError(err?.message || 'Failed to submit installation record. Please check inputs.');
      setToastMsg({ type: 'danger', text: err?.message || 'Installation submission failed.' });
>>>>>>> 59fd9085bf4bc8a389c8081f5e629e98c59272e9
    } finally {
      setSubmitting(false);
    }
  };

<<<<<<< HEAD
  return (
    <div className="solar-erp-page resco-feasibility-form">
      <style>{SINGLE_CARD_FORM_CSS}</style>

      {/* Page Header */}
      <PageHead
        title="Jammu Resco Assigned Site Vendor"
        subtitle="Site Feasibility Report and Technical Audit Form for Institutional Rooftop Solar Projects in Jammu & Kashmir."
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Vendor Management', href: '/vendor-management' },
          { label: 'Jammu', href: '/vendor-management/jammu' },
          { label: 'RESCO Installation', href: '/vendor-management/jammu/installation/resco/dashboard' },
>>>>>>> 70f527ba60f555fe6ad1fa61874f359bd66bf9d7
          { label: 'Site Feasibility Report' },
        ]}
        actions={
          <Link
            to="/vendor-management/jammu/installation/resco/view-assign-installation"
<<<<<<< HEAD
            className="ax-btn ax-btn--primary ax-btn--sm"
          >
            View Assigned Installations
=======
            className="ax-btn ax-btn--secondary ax-btn--sm"
          >
            ← View Assigned Sites
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

      <form onSubmit={handleSubmit} className="ax-card">
        <div className="ax-card__header">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
            <div>
              <h2 className="ax-card__title" style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: 'var(--ax-text-strong, #0f172a)' }}>
                Jammu RESCO Assigned Vendor - Site Feasibility Report
              </h2>
              <p className="ax-card__subtitle" style={{ fontSize: '0.85rem', color: '#ef4444', margin: '4px 0 0' }}>
                The field labels marked with * are required input fields.
              </p>
            </div>
            {fetchingOptions && (
              <span style={{ fontSize: 12, color: '#2563eb', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <span className="ax-spinner" /> Loading assigned sites...
              </span>
            )}
          </div>

          <div className="swp-section-pills">
            <button type="button" className="swp-section-pill-btn" onClick={() => scrollTo(sec1)}>
              <span className="pill-num">1</span> Site & Vendor
            </button>
            <button type="button" className="swp-section-pill-btn" onClick={() => scrollTo(sec2)}>
              <span className="pill-num">2</span> General Information
            </button>
            <button type="button" className="swp-section-pill-btn" onClick={() => scrollTo(sec3)}>
              <span className="pill-num">3</span> Technical Details
            </button>
            <button type="button" className="swp-section-pill-btn" onClick={() => scrollTo(sec4)}>
              <span className="pill-num">4</span> Civil & Structural
            </button>
            <button type="button" className="swp-section-pill-btn" onClick={() => scrollTo(sec5)}>
              <span className="pill-num">5</span> Photos & Documents
=======
      {/* Status Feedback Banners */}
      {errorMsg && (
        <div style={{ padding: '12px 16px', background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', borderRadius: 8, marginBottom: 16, fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span>✕ {errorMsg}</span>
          <button type="button" onClick={() => setErrorMsg('')} style={{ background: 'none', border: 'none', color: '#b91c1c', cursor: 'pointer', fontSize: 16 }}>×</button>
        </div>
      )}

      {successMsg && (
        <div style={{ padding: '12px 16px', background: '#ecfdf5', border: '1px solid #a7f3d0', color: '#065f46', borderRadius: 8, marginBottom: 16, fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span>✓ {successMsg}</span>
        </div>
      )}

      {/* Top Selectors Card */}
      <div className="ax-card" style={{ padding: 18, borderRadius: 12, marginBottom: 20 }}>
        <h3 style={{ margin: '0 0 14px', fontSize: 15, fontWeight: 700, color: '#0f172a' }}>
          Site Feasibility Report
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
          {/* Select Site * */}
          <div className="ax-float">
            <select
              id="select_site"
              className="ax-float__input"
              value={selectedSiteId}
              onChange={(e) => setSelectedSiteId(e.target.value)}
              required
            >
              <option value="">-- Select Site --</option>
              {JAMMU_RESCO_SITES_CATALOG.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.site_name} ({s.district})
                </option>
              ))}
            </select>
            <label htmlFor="select_site" className="ax-float__label floating">
              Select Site <span style={{ color: '#ef4444' }}>*</span>
            </label>
          </div>

          {/* Select Vendor * */}
          <div className="ax-float">
            <select
              id="select_vendor"
              className="ax-float__input"
              value={selectedVendor}
              onChange={(e) => setSelectedVendor(e.target.value)}
              required
            >
              <option value="">-- Vendor --</option>
              {RESCO_FEASIBILITY_VENDORS.map((v, i) => (
                <option key={i} value={v}>
                  {v}
                </option>
              ))}
            </select>
            <label htmlFor="select_vendor" className="ax-float__label floating">
              Select Vendor <span style={{ color: '#ef4444' }}>*</span>
            </label>
          </div>
        </div>
      </div>

      {/* General Information Card (Read-only summary) */}
      {activeSite && (
        <div className="ax-card" style={{ padding: 18, borderRadius: 12, marginBottom: 20 }}>
          <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: '#2559bf', marginBottom: 12, letterSpacing: '0.04em' }}>
            General Information
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, fontSize: 12 }}>
            <div><span style={{ color: '#64748b' }}>Unique ID:</span> <div style={{ fontWeight: 700, color: '#0f172a' }}>{activeSite.uid || `JK-RSC-${activeSite.id}`}</div></div>
            <div><span style={{ color: '#64748b' }}>State:</span> <div style={{ fontWeight: 600 }}>JAMMU &amp; KASHMIR</div></div>
            <div><span style={{ color: '#64748b' }}>District:</span> <div style={{ fontWeight: 600 }}>{activeSite.district}</div></div>
            <div><span style={{ color: '#64748b' }}>Division:</span> <div style={{ fontWeight: 600 }}>{activeSite.division || 'Division I'}</div></div>
            <div><span style={{ color: '#64748b' }}>Sub Division:</span> <div style={{ fontWeight: 600 }}>{activeSite.sub_division || 'HQ'}</div></div>
            <div><span style={{ color: '#64748b' }}>Department:</span> <div style={{ fontWeight: 600 }}>{activeSite.department || 'Govt Department'}</div></div>
            <div><span style={{ color: '#64748b' }}>Site Name:</span> <div style={{ fontWeight: 700, color: '#2559bf' }}>{activeSite.site_name}</div></div>
            <div><span style={{ color: '#64748b' }}>Location:</span> <div>{activeSite.location || activeSite.district}</div></div>
            <div><span style={{ color: '#64748b' }}>CA No:</span> <div style={{ fontFamily: 'monospace', fontWeight: 700 }}>{activeSite.ca_no || 'CA-JK-78921'}</div></div>
          </div>
        </div>
      )}

      {/* Fill this Form Single Card */}
      <form onSubmit={handleSubmit} className="ax-card">
        <div className="ax-card__header">
          <div>
            <h2 className="ax-card__title" style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0, color: '#0f172a' }}>
              Fill this Form
            </h2>
            <p className="ax-card__subtitle" style={{ fontSize: '0.85rem', color: '#ef4444', margin: '4px 0 0' }}>
              The field labels marked with * are input fields.
            </p>
          </div>

          {/* Quick Nav Pills */}
          <div className="resco-section-pills">
            <button type="button" className="resco-section-pill-btn" onClick={() => scrollTo(sec1)}>
              <span className="pill-num">1</span> Agency &amp; Contact
            </button>
            <button type="button" className="resco-section-pill-btn" onClick={() => scrollTo(sec2)}>
              <span className="pill-num">2</span> Technical Information
            </button>
            <button type="button" className="resco-section-pill-btn" onClick={() => scrollTo(sec3)}>
              <span className="pill-num">3</span> Civil / Structural
            </button>
            <button type="button" className="resco-section-pill-btn" onClick={() => scrollTo(sec4)}>
              <span className="pill-num">4</span> Other Info &amp; Evidence
>>>>>>> 70f527ba60f555fe6ad1fa61874f359bd66bf9d7
            </button>
          </div>
        </div>

        <div className="ax-card__body">
<<<<<<< HEAD
          {/* Section 1: Site & Vendor Selection */}
          <div ref={sec1} className="swp-section-block">
            <div className="swp-section-header">
              <div className="swp-section-title-wrap">
                <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>
                  1. Site & Vendor Selection <span style={{ color: '#ef4444' }}>*</span>
                </h3>
                <span style={{ fontSize: '12px', color: 'var(--ax-text-muted, #64748b)' }}>
                  Select the assigned RESCO site and vendor responsible for feasibility execution
                </span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
              <div className="ax-float">
                <select
                  id="jammu_resco_survey_site"
                  className="ax-float__input"
                  value={selectedSiteId}
                  onChange={(e) => handleSiteSelect(e.target.value)}
                  disabled={loading || fetchingOptions}
                  required
                >
                  <option value="">-- Select Site --</option>
                  {srtRecords.map((s) => {
                    const vid = Number(s.inst_vendor || 0);
                    const vName = vid > 0 ? vendorMap.get(vid) || `Vendor #${vid}` : null;
                    return (
                      <option key={s.id} value={String(s.id)}>
                        {s.site_name || s.farmer_name || `Site #${s.id}`} (Site ID: #{s.id}) {vid > 0 ? `— Vendor: ${vName} (ID: #${vid})` : '— (No Vendor Assigned)'}
                      </option>
                    );
                  })}
                </select>
                <label htmlFor="jammu_resco_survey_site" className="ax-float__label floating">
                  Select Site <span style={{ color: '#ef4444' }}>*</span>
                </label>
              </div>

              <div className="ax-float">
                <select
                  id="jammu_resco_survey_vendor"
                  className="ax-float__input"
                  value={selectedVendorId}
                  onChange={(e) => setSelectedVendorId(e.target.value)}
                  disabled={loading || fetchingOptions}
                  required
                >
                  <option value="">-- Select Vendor --</option>
                  {combinedVendors.map((v) => (
                    <option key={v.id} value={String(v.id)}>
                      {v.name} (Vendor ID: #{v.id})
                    </option>
                  ))}
                </select>
                <label htmlFor="jammu_resco_survey_vendor" className="ax-float__label floating">
                  Select Vendor <span style={{ color: '#ef4444' }}>*</span>
                </label>
              </div>

              {selectedSiteId && (
                <div
                  style={{
                    gridColumn: '1 / -1',
                    background: '#eff4fc',
                    border: '1px solid #bfd3f8',
                    borderRadius: 8,
                    padding: '10px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: 13,
                    color: '#1e40af',
                    flexWrap: 'wrap',
                    gap: 8,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <span>
                      <strong>Selected Site:</strong> {currentSite?.site_name || siteDetails?.site_name || `Site #${selectedSiteId}`} (Site ID: #{selectedSiteId})
                    </span>
                    <span style={{ color: '#94a3b8' }}>•</span>
                    <span>
                      <strong>Assigned Vendor (inst_vendor):</strong>{' '}
                      {currentSiteVendorId > 0 ? (
                        <span style={{ color: '#0f172a', fontWeight: 700 }}>
                          {currentSiteVendorName ? `${currentSiteVendorName} (ID: #${currentSiteVendorId})` : `Vendor #${currentSiteVendorId}`}
                        </span>
                      ) : (
                        <span style={{ color: '#64748b' }}>Not Assigned (0)</span>
                      )}
                    </span>
                  </div>

                  {currentSiteVendorId > 0 && selectedVendorId === String(currentSiteVendorId) && (
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                        padding: '3px 8px',
                        background: '#ecfdf5',
                        color: '#059669',
                        border: '1px solid #a7f3d0',
                        borderRadius: 6,
                        fontSize: 12,
                        fontWeight: 700,
                      }}
                    >
                      ✓ Vendor Auto-selected
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          <hr className="swp-section-divider" />

          {/* Section 2: General Information */}
          <div ref={sec2} className="swp-section-block">
            <div className="swp-section-header">
              <div className="swp-section-title-wrap">
                <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>
                  2. General Information
                </h3>
                <span style={{ fontSize: '12px', color: 'var(--ax-text-muted, #64748b)' }}>
                  {fetchingSiteDetail
                    ? 'Loading site master data...'
                    : 'Auto-populated from the central Jammu RESCO site database'}
                </span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
              <div className="ax-float">
                <input
                  type="text"
                  className="ax-float__input"
                  value={siteDetails?.unique_id || (siteDetails?.id ? `#${siteDetails.id}` : '—')}
                  readOnly
                  disabled
                />
                <label className="ax-float__label floating">Unique ID</label>
              </div>

              <div className="ax-float">
                <input
                  type="text"
                  className="ax-float__input"
                  value="JAMMU"
                  readOnly
                  disabled
                />
                <label className="ax-float__label floating">State</label>
              </div>

              <div className="ax-float">
                <input
                  type="text"
                  className="ax-float__input"
                  value={siteDetails?.district || '—'}
                  readOnly
                  disabled
                />
                <label className="ax-float__label floating">District</label>
              </div>

              <div className="ax-float">
                <input
                  type="text"
                  className="ax-float__input"
                  value={siteDetails?.division || '—'}
                  readOnly
                  disabled
                />
                <label className="ax-float__label floating">Division</label>
              </div>

              <div className="ax-float">
                <input
                  type="text"
                  className="ax-float__input"
                  value={siteDetails?.sub_division || '—'}
                  readOnly
                  disabled
                />
                <label className="ax-float__label floating">Sub Division</label>
              </div>

              <div className="ax-float">
                <input
                  type="text"
                  className="ax-float__input"
                  value={siteDetails?.dept_name || '—'}
                  readOnly
                  disabled
                />
                <label className="ax-float__label floating">Department</label>
              </div>

              <div className="ax-float">
                <input
                  type="text"
                  className="ax-float__input"
                  value={siteDetails?.site_name || '—'}
                  readOnly
                  disabled
                />
                <label className="ax-float__label floating">Site Name</label>
              </div>

              <div className="ax-float">
                <input
                  type="text"
                  className="ax-float__input"
                  value={siteDetails?.location || siteDetails?.address || '—'}
                  readOnly
                  disabled
                />
                <label className="ax-float__label floating">Location / Address</label>
              </div>

              <div className="ax-float">
                <input
                  type="text"
                  className="ax-float__input"
                  value={siteDetails?.ca_no || '—'}
                  readOnly
                  disabled
                />
                <label className="ax-float__label floating">CA Number</label>
              </div>

              <div className="ax-float">
                <input
                  type="text"
                  className="ax-float__input"
                  value={siteDetails?.plant_sc ? `${siteDetails.plant_sc} kW` : '—'}
                  readOnly
                  disabled
                />
                <label className="ax-float__label floating">Sanction Load</label>
              </div>

              <div className="ax-float">
                <input
                  type="text"
                  className="ax-float__input"
                  value={currentSiteVendorId > 0 ? (currentSiteVendorName ? `${currentSiteVendorName} (ID: #${currentSiteVendorId})` : `Vendor #${currentSiteVendorId}`) : '—'}
                  readOnly
                  disabled
                />
                <label className="ax-float__label floating">Assigned Vendor (inst_vendor)</label>
              </div>
            </div>
          </div>

          <hr className="swp-section-divider" />

          {/* Section 3: Contact & Technical Feasibility Details */}
          <div ref={sec3} className="swp-section-block">
            <div className="swp-section-header">
              <div className="swp-section-title-wrap">
                <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>
                  3. Contact & Technical Feasibility <span style={{ color: '#ef4444' }}>*</span>
                </h3>
                <span style={{ fontSize: '12px', color: 'var(--ax-text-muted, #64748b)' }}>
                  Enter site location contacts, electrical specifications, and rooftop availability
                </span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16, marginBottom: 16 }}>
              <FloatingInput
                label="Site Address (details)"
                name="site_address"
                value={siteAddress}
                onChange={(e) => setSiteAddress(e.target.value)}
                required
                disabled={loading}
                placeholder="Full address of the site"
              />
              <FloatingInput
                label="Nearest Landmark"
                name="landmark"
                value={landmark}
                onChange={(e) => setLandmark(e.target.value)}
                required
                disabled={loading}
                placeholder="Nearby recognizable landmark"
              />
              <FloatingInput
                label="Agency Contact Person Name"
                name="agency_person_name"
                value={agencyPersonName}
                onChange={(e) => setAgencyPersonName(e.target.value)}
                required
                disabled={loading}
                placeholder="Site executive name"
              />
              <FloatingInput
                label="Agency Contact Number"
                name="agency_person_contact"
                value={agencyPersonContact}
                onChange={(e) => setAgencyPersonContact(e.target.value)}
                required
                disabled={loading}
                placeholder="10-digit mobile number"
              />
              <FloatingInput
                label="Nodal Person Name"
                name="nodal_person"
                value={nodalPerson}
                onChange={(e) => setNodalPerson(e.target.value)}
                required
                disabled={loading}
                placeholder="Government / Agency nodal officer"
              />
              <FloatingInput
                label="Nodal Contact Number"
                name="contact_nodal"
                value={contactNodal}
                onChange={(e) => setContactNodal(e.target.value)}
                required
                disabled={loading}
                placeholder="Nodal officer contact"
              />
              <FloatingInput
                label="GPS Latitude"
                name="latitude"
                value={latitude}
                onChange={(e) => setLatitude(e.target.value)}
                required
                disabled={loading}
                placeholder="e.g. 32.726600"
              />
              <FloatingInput
                label="GPS Longitude"
                name="longitude"
                value={longitude}
                onChange={(e) => setLongitude(e.target.value)}
                required
                disabled={loading}
                placeholder="e.g. 74.857000"
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
              <div className="ax-float">
                <select
                  id="jammu_resco_load_type"
                  className="ax-float__input"
                  value={loadType}
                  onChange={(e) => setLoadType(e.target.value)}
                  disabled={loading}
                  required
                >
                  <option value="AC">AC</option>
                  <option value="DC">DC</option>
                </select>
                <label htmlFor="jammu_resco_load_type" className="ax-float__label floating">
                  Load Type <span style={{ color: '#ef4444' }}>*</span>
                </label>
              </div>

              <div className="ax-float">
                <select
                  id="jammu_resco_conn_phase"
                  className="ax-float__input"
                  value={connectionPhase}
                  onChange={(e) => setConnectionPhase(e.target.value)}
                  disabled={loading}
                  required
                >
                  <option value="3 Phase">3 Phase</option>
                  <option value="1 Phase">1 Phase</option>
                </select>
                <label htmlFor="jammu_resco_conn_phase" className="ax-float__label floating">
                  Connection Phase <span style={{ color: '#ef4444' }}>*</span>
                </label>
              </div>

              <div className="ax-float">
                <select
                  id="jammu_resco_meter_conn"
                  className="ax-float__input"
                  value={meterConnection}
                  onChange={(e) => setMeterConnection(e.target.value)}
                  disabled={loading}
                  required
                >
                  <option value="LT">LT</option>
                  <option value="HT">HT</option>
                </select>
                <label htmlFor="jammu_resco_meter_conn" className="ax-float__label floating">
                  Meter Connection <span style={{ color: '#ef4444' }}>*</span>
                </label>
              </div>

              <FloatingInput
                label="Meter Number"
                name="meter_number"
                value={meterNumber}
                onChange={(e) => setMeterNumber(e.target.value)}
                required
                disabled={loading}
                placeholder="Electricity meter serial number"
              />

              <div className="ax-float">
                <select
                  id="jammu_resco_meter_type"
                  className="ax-float__input"
                  value={meterType}
                  onChange={(e) => setMeterType(e.target.value)}
                  disabled={loading}
                  required
                >
                  <option value="Smart Meter">Smart Meter</option>
                  <option value="Electronic Meter">Electronic Meter</option>
                  <option value="Net Meter">Net Meter</option>
                </select>
                <label htmlFor="jammu_resco_meter_type" className="ax-float__label floating">
                  Meter Type <span style={{ color: '#ef4444' }}>*</span>
                </label>
              </div>

              <FloatingInput
                label="Sanction Load (kW)"
                name="sanction_load"
                value={sanctionLoad}
                onChange={(e) => setSanctionLoad(e.target.value)}
                required
                disabled={loading}
                placeholder="e.g. 10.0"
              />

              <FloatingInput
                label="Connected Load (kW)"
                name="connected_load"
                value={connectedLoad}
                onChange={(e) => setConnectedLoad(e.target.value)}
                required
                disabled={loading}
                placeholder="e.g. 8.5"
              />

              <div className="ax-float">
                <select
                  id="jammu_resco_grid_power"
                  className="ax-float__input"
                  value={gridPower}
                  onChange={(e) => setGridPower(e.target.value)}
                  disabled={loading}
                  required
                >
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
                <label htmlFor="jammu_resco_grid_power" className="ax-float__label floating">
                  Grid Power Available <span style={{ color: '#ef4444' }}>*</span>
                </label>
              </div>

              <div className="ax-float">
                <select
                  id="jammu_resco_all_3_phase"
                  className="ax-float__input"
                  value={all3PhaseLtdb}
                  onChange={(e) => setAll3PhaseLtdb(e.target.value)}
                  disabled={loading}
                  required
                >
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
                <label htmlFor="jammu_resco_all_3_phase" className="ax-float__label floating">
                  All 3 Phase LTDB <span style={{ color: '#ef4444' }}>*</span>
                </label>
              </div>

              <div className="ax-float">
                <select
                  id="jammu_resco_missing_phase"
                  className="ax-float__input"
                  value={missingPhase}
                  onChange={(e) => setMissingPhase(e.target.value)}
                  disabled={loading}
                  required
                >
                  <option value="None">None</option>
                  <option value="R">R Phase</option>
                  <option value="Y">Y Phase</option>
                  <option value="B">B Phase</option>
                </select>
                <label htmlFor="jammu_resco_missing_phase" className="ax-float__label floating">
                  Missing Phase <span style={{ color: '#ef4444' }}>*</span>
                </label>
              </div>

              <div className="ax-float">
                <select
                  id="jammu_resco_ltdb_present"
                  className="ax-float__input"
                  value={ltdbPresent}
                  onChange={(e) => setLtdbPresent(e.target.value)}
                  disabled={loading}
                  required
                >
                  <option value="Present">Present</option>
                  <option value="Not Present">Not Present</option>
                </select>
                <label htmlFor="jammu_resco_ltdb_present" className="ax-float__label floating">
                  LTDB Present <span style={{ color: '#ef4444' }}>*</span>
                </label>
              </div>

              <div className="ax-float">
                <select
                  id="jammu_resco_roof_condition"
                  className="ax-float__input"
                  value={roofCondition}
                  onChange={(e) => setRoofCondition(e.target.value)}
                  disabled={loading}
                  required
                >
                  <option value="Feasible">Feasible</option>
                  <option value="Not Feasible">Not Feasible</option>
                  <option value="Rework Required">Rework Required</option>
                </select>
                <label htmlFor="jammu_resco_roof_condition" className="ax-float__label floating">
                  Roof Condition <span style={{ color: '#ef4444' }}>*</span>
                </label>
              </div>

              <FloatingInput
                label="Total Area of Roof (sq.ft)"
                name="area_roof"
                value={areaRoof}
                onChange={(e) => setAreaRoof(e.target.value)}
                required
                disabled={loading}
                placeholder="e.g. 2500"
              />

              <FloatingInput
                label="Free Space for Solar (sq.ft)"
                name="free_space_solar"
                value={freeSpaceSolar}
                onChange={(e) => setFreeSpaceSolar(e.target.value)}
                required
                disabled={loading}
                placeholder="e.g. 1800"
              />

              <FloatingInput
                label="Free Space for Inverter (sq.ft)"
                name="free_space_inverter"
                value={freeSpaceInverter}
                onChange={(e) => setFreeSpaceInverter(e.target.value)}
                required
                disabled={loading}
                placeholder="e.g. 80"
              />

              <div className="ax-float">
                <select
                  id="jammu_resco_earth_pit"
                  className="ax-float__input"
                  value={earthPit}
                  onChange={(e) => setEarthPit(e.target.value)}
                  disabled={loading}
                  required
                >
                  <option value="Ok">Ok</option>
                  <option value="Needs Work">Needs Work</option>
                  <option value="Not Available">Not Available</option>
                </select>
                <label htmlFor="jammu_resco_earth_pit" className="ax-float__label floating">
                  Earth Pit Status <span style={{ color: '#ef4444' }}>*</span>
                </label>
              </div>

              <div className="ax-float">
                <select
                  id="jammu_resco_site_feasible"
                  className="ax-float__input"
                  value={siteFeasible}
                  onChange={(e) => setSiteFeasible(e.target.value)}
                  disabled={loading}
                  required
                >
                  <option value="Feasible">Feasible</option>
                  <option value="Not Feasible">Not Feasible</option>
                </select>
                <label htmlFor="jammu_resco_site_feasible" className="ax-float__label floating">
                  Site Feasibility <span style={{ color: '#ef4444' }}>*</span>
                </label>
              </div>

              <FloatingInput
                label="Survey Remarks"
                name="survey_remarks"
                value={surveyRemarks}
                onChange={(e) => setSurveyRemarks(e.target.value)}
                required
                disabled={loading}
                placeholder="Site feasibility observation notes"
              />
            </div>
          </div>

          <hr className="swp-section-divider" />

          {/* Section 4: Civil & Structural */}
          <div ref={sec4} className="swp-section-block">
            <div className="swp-section-header">
              <div className="swp-section-title-wrap">
                <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>
                  4. Civil & Structural Assessment <span style={{ color: '#ef4444' }}>*</span>
                </h3>
                <span style={{ fontSize: '12px', color: 'var(--ax-text-muted, #64748b)' }}>
                  Structural integrity, building age, rooftop height, access pathways, and water supply
                </span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
              <FloatingInput
                label="Building Age (Years)"
                name="building_age"
                value={buildingAge}
                onChange={(e) => setBuildingAge(e.target.value)}
                required
                disabled={loading}
                placeholder="e.g. 5"
              />

              <div className="ax-float">
                <select
                  id="jammu_resco_roof_access"
                  className="ax-float__input"
                  value={roofAccess}
                  onChange={(e) => setRoofAccess(e.target.value)}
                  disabled={loading}
                  required
                >
                  <option value="Available">Available (Stairs)</option>
                  <option value="Ladder Required">Ladder Required</option>
                  <option value="Not Available">Not Available</option>
                </select>
                <label htmlFor="jammu_resco_roof_access" className="ax-float__label floating">
                  Roof Access <span style={{ color: '#ef4444' }}>*</span>
                </label>
              </div>

              <FloatingInput
                label="Rooftop Height (m)"
                name="rooftop_height"
                value={rooftopHeight}
                onChange={(e) => setRooftopHeight(e.target.value)}
                required
                disabled={loading}
                placeholder="e.g. 12"
              />

              <FloatingInput
                label="Parapet Height (m)"
                name="parapet_height"
                value={parapetHeight}
                onChange={(e) => setParapetHeight(e.target.value)}
                required
                disabled={loading}
                placeholder="e.g. 1.2"
              />

              <div className="ax-float">
                <select
                  id="jammu_resco_floors_number"
                  className="ax-float__input"
                  value={floorsNumber}
                  onChange={(e) => setFloorsNumber(e.target.value)}
                  disabled={loading}
                  required
                >
                  <option value="G">Ground Floor (G)</option>
                  <option value="G+1">G + 1</option>
                  <option value="G+2">G + 2</option>
                  <option value="G+3">G + 3</option>
                  <option value="G+4+">G + 4 or Higher</option>
                </select>
                <label htmlFor="jammu_resco_floors_number" className="ax-float__label floating">
                  Floors Number <span style={{ color: '#ef4444' }}>*</span>
                </label>
              </div>

              <div className="ax-float">
                <select
                  id="jammu_resco_water_source"
                  className="ax-float__input"
                  value={waterSource}
                  onChange={(e) => setWaterSource(e.target.value)}
                  disabled={loading}
                  required
                >
                  <option value="Available">Available</option>
                  <option value="Not Available">Not Available</option>
                </select>
                <label htmlFor="jammu_resco_water_source" className="ax-float__label floating">
                  Water Source (Cleaning) <span style={{ color: '#ef4444' }}>*</span>
                </label>
              </div>

              <div className="ax-float">
                <select
                  id="jammu_resco_site_access"
                  className="ax-float__input"
                  value={siteAccess}
                  onChange={(e) => setSiteAccess(e.target.value)}
                  disabled={loading}
                  required
                >
                  <option value="Good">Good (Wide Road)</option>
                  <option value="Average">Average (Narrow Road)</option>
                  <option value="Poor">Poor (Inaccessible by truck)</option>
                </select>
                <label htmlFor="jammu_resco_site_access" className="ax-float__label floating">
                  Site Access Road <span style={{ color: '#ef4444' }}>*</span>
                </label>
              </div>

              <FloatingInput
                label="Distance from Road (m)"
                name="site_distance"
                value={siteDistance}
                onChange={(e) => setSiteDistance(e.target.value)}
                disabled={loading}
                placeholder="e.g. 15"
              />
            </div>
          </div>

          <hr className="swp-section-divider" />

          {/* Section 5: Survey Photos & PDF Document */}
          <div ref={sec5} className="swp-section-block">
            <div className="swp-section-header">
              <div className="swp-section-title-wrap">
                <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>
                  5. Survey Photos & Document <span style={{ color: '#ef4444' }}>*</span>
                </h3>
                <span style={{ fontSize: '12px', color: 'var(--ax-text-muted, #64748b)' }}>
                  Attach clear geo-tagged site images (JPG, PNG) and optional signed feasibility survey PDF
=======
          {/* Section 1: Agency & Contact Information */}
          <div ref={sec1} className="resco-section-block">
            <div className="resco-section-header">
              <div className="resco-section-title-wrap">
                <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>1. Agency &amp; Contact Details</h3>
                <span style={{ fontSize: '12px', color: '#64748b' }}>
                  Site address, agency focal point and building nodal officer contact
>>>>>>> 70f527ba60f555fe6ad1fa61874f359bd66bf9d7
                </span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
<<<<<<< HEAD
              <UploadDropzone
                id="resco_survey_building_image"
                label="Building Overview Image"
                required
                accept=".jpg,.jpeg,.png"
                helperText="JPG or PNG (Max 5 MB)"
                disabled={loading}
                file={buildingImage}
                preview={buildingImagePreview}
                onSelect={(selected) => {
                  setBuildingImage(selected);
                  setBuildingImagePreview(URL.createObjectURL(selected));
                }}
                onRemove={() => {
                  setBuildingImage(null);
                  if (buildingImagePreview) URL.revokeObjectURL(buildingImagePreview);
                  setBuildingImagePreview(undefined);
                }}
              />

              <UploadDropzone
                id="resco_survey_roof_image"
                label="Roof Area Image"
                required
                accept=".jpg,.jpeg,.png"
                helperText="JPG or PNG (Max 5 MB)"
                disabled={loading}
                file={roofImage}
                preview={roofImagePreview}
                onSelect={(selected) => {
                  setRoofImage(selected);
                  setRoofImagePreview(URL.createObjectURL(selected));
                }}
                onRemove={() => {
                  setRoofImage(null);
                  if (roofImagePreview) URL.revokeObjectURL(roofImagePreview);
                  setRoofImagePreview(undefined);
                }}
              />

              <UploadDropzone
                id="resco_survey_control_room_image"
                label="Control Room / Inverter Space Image"
                required
                accept=".jpg,.jpeg,.png"
                helperText="JPG or PNG (Max 5 MB)"
                disabled={loading}
                file={controlRoomImage}
                preview={controlRoomImagePreview}
                onSelect={(selected) => {
                  setControlRoomImage(selected);
                  setControlRoomImagePreview(URL.createObjectURL(selected));
                }}
                onRemove={() => {
                  setControlRoomImage(null);
                  if (controlRoomImagePreview) URL.revokeObjectURL(controlRoomImagePreview);
                  setControlRoomImagePreview(undefined);
                }}
              />

              <UploadDropzone
                id="resco_survey_meter_image"
                label="Electricity Meter / LTDB Image"
                required={false}
                accept=".jpg,.jpeg,.png"
                helperText="JPG or PNG (Max 5 MB)"
                disabled={loading}
                file={meterImage}
                preview={meterImagePreview}
                onSelect={(selected) => {
                  setMeterImage(selected);
                  setMeterImagePreview(URL.createObjectURL(selected));
                }}
                onRemove={() => {
                  setMeterImage(null);
                  if (meterImagePreview) URL.revokeObjectURL(meterImagePreview);
                  setMeterImagePreview(undefined);
                }}
              />

              <UploadDropzone
                id="resco_survey_other_image"
                label="Other Site Image"
                required={false}
                accept=".jpg,.jpeg,.png"
                helperText="JPG or PNG (Max 5 MB)"
                disabled={loading}
                file={otherImage}
                preview={otherImagePreview}
                onSelect={(selected) => {
                  setOtherImage(selected);
                  setOtherImagePreview(URL.createObjectURL(selected));
                }}
                onRemove={() => {
                  setOtherImage(null);
                  if (otherImagePreview) URL.revokeObjectURL(otherImagePreview);
                  setOtherImagePreview(undefined);
                }}
              />

              <UploadDropzone
                id="resco_survey_pdf_file"
                label="Feasibility Survey PDF Document"
                required={false}
                accept=".pdf"
                helperText="PDF document (Max 5 MB)"
                disabled={loading}
                file={pdfFile}
                onSelect={(selected) => setPdfFile(selected)}
                onRemove={() => setPdfFile(null)}
              />
            </div>
          </div>

          <div style={{ marginTop: 32, paddingTop: 20, borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
            <Link to="/vendor-management/jammu/installation/resco/view-assign-installation" className="ax-btn ax-btn--secondary">
=======
              <FloatingInput label="Site Address (details)" name="site_address" value={siteAddress} onChange={(e) => setSiteAddress(e.target.value)} required />
              <FloatingInput label="Nearest Landmark" name="nearest_landmark" value={nearestLandmark} onChange={(e) => setNearestLandmark(e.target.value)} required />
              <FloatingInput label="Name of Contact Person of Agency" name="agency_contact_person" value={agencyContactPerson} onChange={(e) => setAgencyContactPerson(e.target.value)} required />
              <FloatingInput label="Contact Number" name="agency_contact_number" value={agencyContactNumber} onChange={(e) => setAgencyContactNumber(e.target.value)} required />
              <FloatingInput label="Nodal Person of concern building" name="nodal_person" value={nodalPerson} onChange={(e) => setNodalPerson(e.target.value)} required />
              <FloatingInput label="Contact Number of Nodal Person" name="nodal_contact" value={nodalContact} onChange={(e) => setNodalContact(e.target.value)} required />
            </div>
          </div>

          <hr className="resco-section-divider" />

          {/* Section 2: Technical Information */}
          <div ref={sec2} className="resco-section-block">
            <div className="resco-section-header">
              <div className="resco-section-title-wrap">
                <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>2. Technical Information</h3>
                <span style={{ fontSize: '12px', color: '#64748b' }}>
                  Electrical connection, LTDB specs, roof condition and load sanction
                </span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
              {/* Type of Load * */}
              <div className="ax-float">
                <select className="ax-float__input" value={typeOfLoad} onChange={(e) => setTypeOfLoad(e.target.value)} required>
                  <option value="AC">AC</option>
                  <option value="DC">DC</option>
                </select>
                <label className="ax-float__label floating">Type of Load <span style={{ color: '#ef4444' }}>*</span></label>
              </div>

              {/* Connection Phase * */}
              <div className="ax-float">
                <select className="ax-float__input" value={connectionPhase} onChange={(e) => setConnectionPhase(e.target.value)} required>
                  <option value="1 Phase">1 Phase</option>
                  <option value="3 Phase">3 Phase</option>
                </select>
                <label className="ax-float__label floating">Connection Phase <span style={{ color: '#ef4444' }}>*</span></label>
              </div>

              {/* Meter Connection Type * */}
              <div className="ax-float">
                <select className="ax-float__input" value={meterConnectionType} onChange={(e) => setMeterConnectionType(e.target.value)} required>
                  <option value="HT">HT</option>
                  <option value="LT">LT</option>
                </select>
                <label className="ax-float__label floating">Meter Connection Type <span style={{ color: '#ef4444' }}>*</span></label>
              </div>

              {/* Meter Number * */}
              <FloatingInput label="Meter Number" name="meter_number" value={meterNumber} onChange={(e) => setMeterNumber(e.target.value)} required />

              {/* Meter Type * */}
              <div className="ax-float">
                <select className="ax-float__input" value={meterType} onChange={(e) => setMeterType(e.target.value)} required>
                  <option value="Smart Meter">Smart Meter</option>
                  <option value="Normal Meter">Normal Meter</option>
                  <option value="LTCT Meter">LTCT Meter</option>
                  <option value="HT Meter">HT Meter</option>
                </select>
                <label className="ax-float__label floating">Meter Type <span style={{ color: '#ef4444' }}>*</span></label>
              </div>

              {/* Sanction Load * */}
              <FloatingInput label="Sanction Load (KW/KVA)" name="sanction_load" value={sanctionLoad} onChange={(e) => setSanctionLoad(e.target.value)} required />

              {/* Instantaneous/Connected Load * */}
              <FloatingInput label="Instantaneous/Connected Load (KW)" name="instantaneous_load" value={instantaneousLoad} onChange={(e) => setInstantaneousLoad(e.target.value)} required />

              {/* Grid power availability in hours * */}
              <div className="ax-float">
                <select className="ax-float__input" value={gridPowerHours} onChange={(e) => setGridPowerHours(e.target.value)} required>
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
                <label className="ax-float__label floating">Grid power availability in hours <span style={{ color: '#ef4444' }}>*</span></label>
              </div>

              {/* Is all three-phase available in LTDB * */}
              <div className="ax-float">
                <select className="ax-float__input" value={threePhaseAvailable} onChange={(e) => setThreePhaseAvailable(e.target.value)} required>
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
                <label className="ax-float__label floating">Is all three-phase available in LTDB <span style={{ color: '#ef4444' }}>*</span></label>
              </div>

              {/* If phase is missing, name i.e., R, Y, B, N * */}
              <FloatingInput label="If phase is missing, name i.e., R, Y, B, N" name="phase_missing" value={phaseMissingName} onChange={(e) => setPhaseMissingName(e.target.value)} required />

              {/* Is LTDB Present * */}
              <div className="ax-float">
                <select className="ax-float__input" value={ltdbPresent} onChange={(e) => setLtdbPresent(e.target.value)} required>
                  <option value="Present">Present</option>
                  <option value="Not Present">Not Present</option>
                </select>
                <label className="ax-float__label floating">Is LTDB Present <span style={{ color: '#ef4444' }}>*</span></label>
              </div>

              {/* Roof Condition of solar power plant installation * */}
              <div className="ax-float">
                <select className="ax-float__input" value={roofCondition} onChange={(e) => setRoofCondition(e.target.value)} required>
                  <option value="Feasible">Feasible</option>
                  <option value="Not Feasible">Not Feasible</option>
                </select>
                <label className="ax-float__label floating">Roof Condition <span style={{ color: '#ef4444' }}>*</span></label>
              </div>

              {/* Total Area of Roof (in Sq.Feet) * */}
              <FloatingInput label="Total Area of Roof (in Sq.Feet)" name="total_area_roof" value={totalAreaRoof} onChange={(e) => setTotalAreaRoof(e.target.value)} required />

              {/* Free space for solar Installation (in Sq.Feet) * */}
              <FloatingInput label="Free space for solar Installation (in Sq.Feet)" name="free_space_solar" value={freeSpaceSolar} onChange={(e) => setFreeSpaceSolar(e.target.value)} required />

              {/* Free space for Control Room/Inverter (in Sq.Feet) * */}
              <FloatingInput label="Free space for Control Room/Inverter (in Sq.Feet)" name="free_space_control_room" value={freeSpaceControlRoom} onChange={(e) => setFreeSpaceControlRoom(e.target.value)} required />

              {/* Earth pit position * */}
              <div className="ax-float">
                <select className="ax-float__input" value={earthPitPosition} onChange={(e) => setEarthPitPosition(e.target.value)} required>
                  <option value="Ok">Ok</option>
                  <option value="Not Ok">Not Ok</option>
                </select>
                <label className="ax-float__label floating">Earth pit position <span style={{ color: '#ef4444' }}>*</span></label>
              </div>

              {/* Site Feasible * */}
              <div className="ax-float">
                <select className="ax-float__input" value={siteFeasible} onChange={(e) => setSiteFeasible(e.target.value)} required>
                  <option value="Feasible">Feasible</option>
                  <option value="Not Feasible">Not Feasible</option>
                  <option value="Site Install">Site Install</option>
                </select>
                <label className="ax-float__label floating">Site Feasible <span style={{ color: '#ef4444' }}>*</span></label>
              </div>

              {/* Survey Remarks * */}
              <FloatingInput label="Survey Remarks" name="survey_remarks" value={surveyRemarks} onChange={(e) => setSurveyRemarks(e.target.value)} required />
            </div>
          </div>

          <hr className="resco-section-divider" />

          {/* Section 3: Civil / Structural */}
          <div ref={sec3} className="resco-section-block">
            <div className="resco-section-header">
              <div className="resco-section-title-wrap">
                <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>3. Civil / Structural Parameters</h3>
                <span style={{ fontSize: '12px', color: '#64748b' }}>
                  Building age, staircase access, rooftop heights and water source
                </span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
              <FloatingInput label="Age of Building" name="age_of_building" value={ageOfBuilding} onChange={(e) => setAgeOfBuilding(e.target.value)} required />
              
              <div className="ax-float">
                <select className="ax-float__input" value={staircaseAccess} onChange={(e) => setStaircaseAccess(e.target.value)} required>
                  <option value="Available">Available</option>
                  <option value="Not Available">Not Available</option>
                </select>
                <label className="ax-float__label floating">Access to the roof (Staircase) <span style={{ color: '#ef4444' }}>*</span></label>
              </div>

              <FloatingInput label="Rooftop Height (Feet)" name="rooftop_height" value={rooftopHeight} onChange={(e) => setRooftopHeight(e.target.value)} required />
              <FloatingInput label="Parapet Height (Feet)" name="parapet_height" value={parapetHeight} onChange={(e) => setParapetHeight(e.target.value)} required />
              <FloatingInput label="No. of floors (G+...)" name="no_of_floors" value={noOfFloors} onChange={(e) => setNoOfFloors(e.target.value)} required />
              <FloatingInput label="Water Source for Cleaning" name="water_source" value={waterSourceCleaning} onChange={(e) => setWaterSourceCleaning(e.target.value)} required />
            </div>
          </div>

          <hr className="resco-section-divider" />

          {/* Section 4: Other Information & Photo Evidence */}
          <div ref={sec4} className="resco-section-block">
            <div className="resco-section-header">
              <div className="resco-section-title-wrap">
                <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>4. Other Information &amp; Photographic Evidence</h3>
                <span style={{ fontSize: '12px', color: '#64748b' }}>
                  Road distance, site accessibility and visual audit images
                </span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, marginBottom: 20 }}>
              <FloatingInput label="Access to Site" name="access_to_site" value={accessToSite} onChange={(e) => setAccessToSite(e.target.value)} required />
              <FloatingInput label="Distance of site from main Road (km)" name="distance_from_road" value={distanceFromRoad} onChange={(e) => setDistanceFromRoad(e.target.value)} required />
            </div>

            {/* Evidence Dropzones Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
              <DropzoneMini id="b_img" label="Building Image" file={buildingImg} onSelect={setBuildingImg} required />
              <DropzoneMini id="r_img" label="Roof Image" file={roofImg} onSelect={setRoofImg} required />
              <DropzoneMini id="cr_img" label="Control Room Image" file={controlRoomImg} onSelect={setControlRoomImg} required />
              <DropzoneMini id="m_img" label="Meter Image" file={meterImg} onSelect={setMeterImg} />
              <DropzoneMini id="o_img" label="Other Image" file={otherImg} onSelect={setOtherImg} />
              <DropzoneMini id="pdf_doc" label="PDF Document" file={pdfDoc} onSelect={setPdfDoc} />
            </div>
          </div>

          {/* Form Actions Footer */}
          <div style={{ marginTop: '32px', paddingTop: '20px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '12px' }}>
            <Link to="/vendor-management/jammu/installation/resco/dashboard" className="ax-btn ax-btn--secondary">
>>>>>>> 70f527ba60f555fe6ad1fa61874f359bd66bf9d7
              Cancel
            </Link>
            <button
              type="submit"
              className="ax-btn ax-btn--primary"
<<<<<<< HEAD
              disabled={loading || !selectedSiteId || !selectedVendorId || !buildingImage || !roofImage || !controlRoomImage}
              style={{ minWidth: 230, fontWeight: 700 }}
            >
              {loading ? (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                  <span className="ax-spinner" /> Submitting Report...
                </span>
              ) : (
                'Submit Feasibility Report →'
              )}
=======
              disabled={submitting}
              style={{ minWidth: 200, fontWeight: 700 }}
            >
              {submitting ? 'Submitting Feasibility Report...' : 'Submit Feasibility Report'}
>>>>>>> 70f527ba60f555fe6ad1fa61874f359bd66bf9d7
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
<<<<<<< HEAD
=======
=======
  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="solar-erp-page jammu-inst-form">
      <style>{SINGLE_CARD_FORM_CSS}</style>

      {/* ── Page Head ── */}
      <PageHead
        title="Jammu RESCO - Assigned Vendor Installation Desk"
        subtitle="Submit and record vendor rooftop solar plant installations, equipment specifications, serial numbers, and geotagged evidence"
        breadcrumbs={[
          { label: 'Home', href: '/vendor-management' },
          { label: 'Jammu' },
          { label: 'Installation' },
          { label: 'RESCO' },
          { label: 'Vendor Installation' },
        ]}
        actions={
          <div style={{ display: 'inline-flex', gap: 'var(--ax-space-2, 8px)' }}>
            <Link to="/vendor-management/jammu/installation/resco/view-assign-installation" className="ax-btn ax-btn--secondary ax-btn--sm">
              View Assigned
            </Link>
            <Link to="/vendor-management/jammu/installation/resco/verify-installation" className="ax-btn ax-btn--primary ax-btn--sm">
              Verify Installation
            </Link>
          </div>
        }
      />

      {toastMsg && (
        <div className={`ax-alert ax-alert--${toastMsg.type}`} style={{ marginBottom: 'var(--ax-space-4, 16px)' }} role="status">
          <div className="ax-alert__title">{toastMsg.type === 'success' ? 'Success' : 'Error'}</div>
          <div className="ax-alert__text">{toastMsg.text}</div>
        </div>
      )}

      {submitError && (
        <div className="ax-alert ax-alert--danger" style={{ marginBottom: 'var(--ax-space-4, 16px)' }} role="alert">
          <div className="ax-alert__title">Submission Failed</div>
          <div className="ax-alert__text">{submitError}</div>
        </div>
      )}

      {/* ── Main Unified Form Card ── */}
      <div className="ax-card">
        {/* Card Header & Section Navigation Pills */}
        <div className="ax-card__header">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: 'var(--ax-text-strong)' }}>
                Rooftop Solar Installation Form
              </h2>
              <p style={{ margin: 0, fontSize: 12, color: 'var(--ax-text-muted)', marginTop: 2 }}>
                Fields marked with <span style={{ color: '#ef4444' }}>*</span> are required before plant verification
              </p>
            </div>
            {selectedSiteId && (
              <span className="ax-badge ax-badge--soft ax-badge--info">
                Active Site ID #{selectedSiteId}
              </span>
            )}
          </div>

          <div className="swp-section-pills" role="navigation" aria-label="Form Sections">
            <button type="button" className="swp-section-pill-btn" onClick={() => scrollTo('sec-select-site')}>
              <span className="pill-num">1</span>
              <span>Select Site</span>
            </button>
            <button type="button" className="swp-section-pill-btn" onClick={() => scrollTo('sec-site-details')}>
              <span className="pill-num">2</span>
              <span>Site Details</span>
            </button>
            <button type="button" className="swp-section-pill-btn" onClick={() => scrollTo('sec-fill-form')}>
              <span className="pill-num">3</span>
              <span>Equipment Specs</span>
            </button>
            <button type="button" className="swp-section-pill-btn" onClick={() => scrollTo('sec-panel-serials')}>
              <span className="pill-num">4</span>
              <span>Solar Panels</span>
            </button>
            <button type="button" className="swp-section-pill-btn" onClick={() => scrollTo('sec-upload-photos')}>
              <span className="pill-num">5</span>
              <span>Evidence Photos</span>
            </button>
          </div>
        </div>

        {/* Card Body */}
        <div className="ax-card__body">
          <form onSubmit={handleSubmit} noValidate>
            {/* ── SECTION 1: Select Site ── */}
            <div id="sec-select-site" className="swp-section-block">
              <div className="swp-section-header">
                <div className="swp-section-title-wrap">
                  <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0, color: 'var(--ax-text-strong)' }}>
                    Section 1: Site Selection
                  </h3>
                  <span style={{ fontSize: 12, color: 'var(--ax-text-muted)' }}>
                    Choose an assigned rooftop solar project from the active allocation queue
                  </span>
                </div>
              </div>

              <div style={{ maxWidth: 640 }}>
                <label
                  htmlFor="site-select-dropdown"
                  style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6, color: 'var(--ax-text-strong)' }}
                >
                  Select Site Name <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <select
                    id="site-select-dropdown"
                    className="ax-input"
                    style={{ height: 46, fontSize: 13.5, flex: 1 }}
                    value={selectedSiteId}
                    onChange={(e) => setSelectedSiteId(e.target.value)}
                    required
                    disabled={loadingSites}
                  >
                    <option value="">-- Choose Assigned Resco Site --</option>
                    {sitesList.map((st) => (
                      <option key={st.id} value={st.id}>
                        {st.site_name || `Site #${st.id}`} {st.district ? `(${st.district})` : ''}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    className="ax-btn ax-btn--secondary"
                    onClick={loadSites}
                    disabled={loadingSites}
                    title="Reload sites list"
                    style={{ height: 46, padding: '0 14px' }}
                  >
                    {loadingSites ? '…' : '↻ Refresh'}
                  </button>
                </div>
              </div>
            </div>

            <hr className="swp-section-divider" />

            {/* ── SECTION 2: Site Specifications (Auto-Populated) ── */}
            <div id="sec-site-details" className="swp-section-block">
              <div className="swp-section-header">
                <div className="swp-section-title-wrap">
                  <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0, color: 'var(--ax-text-strong)' }}>
                    Section 2: Site Specifications & Allocation Details
                  </h3>
                  <span style={{ fontSize: 12, color: 'var(--ax-text-muted)' }}>
                    Auto-fetched technical specifications and contract parameters for the chosen site
                  </span>
                </div>
                {loadingDetail && (
                  <span style={{ fontSize: 12, color: '#2563eb', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    <span className="ax-spinner" /> Fetching specifications…
                  </span>
                )}
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                  gap: 16,
                  background: 'var(--ax-surface-subtle, #f8fafc)',
                  padding: 18,
                  borderRadius: 12,
                  border: '1px solid var(--ax-border, #e2e8f0)',
                }}
              >
                <div>
                  <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--ax-text-muted)', textTransform: 'uppercase' }}>State</span>
                  <div style={{ fontSize: 13, fontWeight: 600, marginTop: 3 }}>
                    {siteDetail?.state || 'Jammu & Kashmir'}
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--ax-text-muted)', textTransform: 'uppercase' }}>District</span>
                  <div style={{ fontSize: 13, fontWeight: 600, marginTop: 3 }}>
                    {siteDetail?.district || '—'}
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--ax-text-muted)', textTransform: 'uppercase' }}>Capacity (kWp)</span>
                  <div style={{ fontSize: 13, fontWeight: 600, marginTop: 3, color: '#2563eb' }}>
                    {siteDetail?.capacity_kwp || siteDetail?.capacity || '—'} kWp
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--ax-text-muted)', textTransform: 'uppercase' }}>Consumer CA No.</span>
                  <div style={{ fontSize: 13, fontWeight: 600, marginTop: 3 }}>
                    {siteDetail?.ca_no || siteDetail?.cano || '—'}
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--ax-text-muted)', textTransform: 'uppercase' }}>Department</span>
                  <div style={{ fontSize: 13, fontWeight: 600, marginTop: 3 }}>
                    {siteDetail?.department || '—'}
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--ax-text-muted)', textTransform: 'uppercase' }}>Discom</span>
                  <div style={{ fontSize: 13, fontWeight: 600, marginTop: 3 }}>
                    {siteDetail?.discom || 'JPDCL / KPDCL'}
                  </div>
                </div>
              </div>
            </div>

            <hr className="swp-section-divider" />

            {/* ── SECTION 3: Fill Installation Details ── */}
            <div id="sec-fill-form" className="swp-section-block">
              <div className="swp-section-header">
                <div className="swp-section-title-wrap">
                  <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0, color: 'var(--ax-text-strong)' }}>
                    Section 3: Equipment Specifications & BOS
                  </h3>
                  <span style={{ fontSize: 12, color: 'var(--ax-text-muted)' }}>
                    Enter serial numbers for solar inverter, bidirectional net-meter, and data logger
                  </span>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
                <FloatingInput
                  label="Vendor Name"
                  name="vendor_name"
                  value={vendorName}
                  onChange={(e) => setVendorName(e.target.value)}
                  required
                />

                <FloatingInput
                  label="Contact Person"
                  name="contact_person"
                  value={contactPerson}
                  onChange={(e) => setContactPerson(e.target.value)}
                  required
                />

                <FloatingInput
                  label="Contact Number"
                  name="contact_number"
                  value={contactNumber}
                  onChange={(e) => setContactNumber(e.target.value)}
                  type="tel"
                  required
                />

                <FloatingInput
                  label="Inverter Serial No."
                  name="inverter_no"
                  value={inverterNo}
                  onChange={(e) => setInverterNo(e.target.value)}
                  required
                  onCameraClick={() => handleOpenScanner({ type: 'field', name: 'inverter_no', title: 'Scan Inverter Serial No.' })}
                />

                <FloatingInput
                  label="Solar Generation Meter No."
                  name="solarmeter_no"
                  value={solarMeterNo}
                  onChange={(e) => setSolarMeterNo(e.target.value)}
                  required
                  onCameraClick={() => handleOpenScanner({ type: 'field', name: 'solarmeter_no', title: 'Scan Solar Meter No.' })}
                />

                <FloatingInput
                  label="Net / Smart Meter No."
                  name="nm_sm_no"
                  value={nmSmNo}
                  onChange={(e) => setNmSmNo(e.target.value)}
                  required
                  onCameraClick={() => handleOpenScanner({ type: 'field', name: 'nm_sm_no', title: 'Scan Net / Smart Meter No.' })}
                />

                <FloatingInput
                  label="RMS Data Logger No."
                  name="loger_no"
                  value={logerNo}
                  onChange={(e) => setLogerNo(e.target.value)}
                  onCameraClick={() => handleOpenScanner({ type: 'field', name: 'loger_no', title: 'Scan Data Logger No.' })}
                />
              </div>

              {/* Geotagging GPS Coordinates */}
              <div style={{ marginTop: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--ax-text-strong)' }}>
                    Geotagged Plant Coordinates
                  </label>
                  <button
                    type="button"
                    className="ax-btn ax-btn--secondary ax-btn--sm"
                    onClick={handleGetLocation}
                    style={{ fontSize: 11, padding: '0 10px', height: 28 }}
                  >
                    Locate GPS Coordinates
                  </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
                  <FloatingInput
                    label="Latitude"
                    name="inst_latitude"
                    value={latitude}
                    onChange={(e) => setLatitude(e.target.value)}
                    required
                    placeholder="e.g. 32.726601"
                  />

                  <FloatingInput
                    label="Longitude"
                    name="inst_longitude"
                    value={longitude}
                    onChange={(e) => setLongitude(e.target.value)}
                    required
                    placeholder="e.g. 74.857025"
                  />
                </div>
              </div>

              {/* Remarks */}
              <div style={{ marginTop: 16 }}>
                <FloatingInput
                  label="Installation Remarks / Notes"
                  name="remarks"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Enter plant commissioning notes, earthing pit status, etc."
                />
              </div>
            </div>

            <hr className="swp-section-divider" />

            {/* ── SECTION 4: Solar Panel Serial Numbers ── */}
            <div id="sec-panel-serials" className="swp-section-block">
              <div className="swp-section-header">
                <div className="swp-section-title-wrap">
                  <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0, color: 'var(--ax-text-strong)' }}>
                    Section 4: Solar PV Module Serials
                  </h3>
                  <span style={{ fontSize: 12, color: 'var(--ax-text-muted)' }}>
                    Record barcode serial number for each solar module installed on the rooftop structure
                  </span>
                </div>
                <button
                  type="button"
                  className="ax-btn ax-btn--secondary ax-btn--sm"
                  onClick={handleAddPanel}
                  style={{ height: 30, fontSize: 12 }}
                >
                  + Add Next Module
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 14 }}>
                {panelNos.map((pVal, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <FloatingInput
                      label={`Module #${idx + 1} Serial`}
                      name={`panel_no_${idx}`}
                      value={pVal}
                      onChange={(e) => handlePanelChange(idx, e.target.value)}
                      onCameraClick={() =>
                        handleOpenScanner({
                          type: 'panel',
                          index: idx,
                          title: `Scan Module #${idx + 1} Barcode`,
                        })
                      }
                    />
                    {panelNos.length > 1 && (
                      <button
                        type="button"
                        className="ax-btn ax-btn--ghost ax-btn--sm"
                        onClick={() => handleRemovePanel(idx)}
                        style={{ color: '#ef4444', height: 46, padding: '0 8px' }}
                        title="Remove module"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <hr className="swp-section-divider" />

            {/* ── SECTION 5: Upload Photos ── */}
            <div id="sec-upload-photos" className="swp-section-block">
              <div className="swp-section-header">
                <div className="swp-section-title-wrap">
                  <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0, color: 'var(--ax-text-strong)' }}>
                    Section 5: Geotagged Installation Evidence Photos
                  </h3>
                  <span style={{ fontSize: 12, color: 'var(--ax-text-muted)' }}>
                    High-resolution photographs of solar modules, inverter, meters, and overall site layout
                  </span>
                </div>
              </div>

              <div className="jammu-upload-grid">
                <UploadDropzone
                  id="system-image"
                  label="Complete Rooftop Solar Plant"
                  required
                  file={files.system_image}
                  preview={previews.system_image}
                  onSelect={(f) => handleFileSelect('system_image', f)}
                  onRemove={() => handleFileRemove('system_image')}
                />

                <UploadDropzone
                  id="inverter-image"
                  label="Solar Inverter & Disconnect Switch"
                  required
                  file={files.inverter_image}
                  preview={previews.inverter_image}
                  onSelect={(f) => handleFileSelect('inverter_image', f)}
                  onRemove={() => handleFileRemove('inverter_image')}
                />

                <UploadDropzone
                  id="panel-image"
                  label="Solar PV Modules Array & Tilt"
                  required
                  file={files.panel_image}
                  preview={previews.panel_image}
                  onSelect={(f) => handleFileSelect('panel_image', f)}
                  onRemove={() => handleFileRemove('panel_image')}
                />

                <UploadDropzone
                  id="nmsm-image"
                  label="Bidirectional Net-Meter / Smart Meter"
                  required
                  file={files.nmsm_image}
                  preview={previews.nmsm_image}
                  onSelect={(f) => handleFileSelect('nmsm_image', f)}
                  onRemove={() => handleFileRemove('nmsm_image')}
                />

                <UploadDropzone
                  id="loger-image"
                  label="RMS Data Logger & Connectivity"
                  file={files.loger_image}
                  preview={previews.loger_image}
                  onSelect={(f) => handleFileSelect('loger_image', f)}
                  onRemove={() => handleFileRemove('loger_image')}
                />
              </div>
            </div>

            {/* ── Submit Actions ── */}
            <div
              style={{
                marginTop: 32,
                paddingTop: 20,
                borderTop: '1px solid var(--ax-border, #e2e8f0)',
                display: 'flex',
                justifyContent: 'flex-end',
                alignItems: 'center',
                gap: 12,
              }}
            >
              <button
                type="button"
                className="ax-btn ax-btn--secondary"
                onClick={() => navigate('/vendor-management/jammu/installation/resco/view-assign-installation')}
                disabled={submitting}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="ax-btn ax-btn--primary"
                disabled={submitting}
                style={{ minWidth: 160 }}
              >
                {submitting ? 'Submitting Installation…' : 'Submit Installation Record'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* ── Barcode Scanner Camera Modal ── */}
      {scannerOpen && scannerTargetField && (
        <CameraBarcodeScannerModal
          title={scannerTargetField.title}
          onScan={handleBarcodeScanned}
          onClose={() => setScannerOpen(false)}
        />
      )}
    </div>
  );
>>>>>>> 1734fe6c6a1a76ca36492f9e29deed599b8f9488
};
>>>>>>> 59fd9085bf4bc8a389c8081f5e629e98c59272e9
>>>>>>> 70f527ba60f555fe6ad1fa61874f359bd66bf9d7

export default ViewAssignVendorInstallation;
