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
  padding: var(--ax-space-5, 20px) var(--ax-space-6, 24px);
  border-bottom: 1px solid var(--ax-border-subtle, #f1f5f9);
  background: var(--ax-surface-subtle, #f8fafc);
  display: flex;
  flex-direction: column;
  gap: var(--ax-space-4, 16px);
}
.resco-feasibility-form .ax-card__body { padding: var(--ax-space-6, 24px); }

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
  border-color: #2559bf;
  box-shadow: 0 0 0 3px color-mix(in srgb, #2559bf 20%, transparent);
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
  color: #2559bf;
}
.ax-float__label.has-val:not(.floating) {
  top: 0;
  font-size: 11px;
  font-weight: 500;
  color: var(--ax-text-muted, #64748b);
}
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

interface FloatingInputProps {
  label: string;
  name: string;
  value: string;
  onChange: (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
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
        style={{ display: 'none' }}
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onSelect(f);
        }}
      />
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
    </div>
  );
}

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
  const [siteFeasible, setSiteFeasible] = useState('Feasible');
  const [surveyRemarks, setSurveyRemarks] = useState('');

  // Civil / Structural
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
  const sec1 = useRef<HTMLDivElement>(null);
  const sec2 = useRef<HTMLDivElement>(null);
  const sec3 = useRef<HTMLDivElement>(null);
  const sec4 = useRef<HTMLDivElement>(null);

  const scrollTo = (ref: React.RefObject<HTMLDivElement | null>) => {
    ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // Currently selected site details
  const activeSite: RescoSiteItem | undefined = useMemo(() => {
    if (!selectedSiteId) return JAMMU_RESCO_SITES_CATALOG[0];
    return JAMMU_RESCO_SITES_CATALOG.find((s) => String(s.id) === selectedSiteId) || JAMMU_RESCO_SITES_CATALOG[0];
  }, [selectedSiteId]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!selectedSiteId) return setErrorMsg('Please select a Site.');
    if (!siteAddress) return setErrorMsg('Site Address (details) is required.');
    if (!nearestLandmark) return setErrorMsg('Nearest Landmark is required.');
    if (!meterNumber) return setErrorMsg('Meter Number is required.');
    if (!sanctionLoad) return setErrorMsg('Sanction Load (KW/KVA) is required.');
    if (!totalAreaRoof) return setErrorMsg('Total Area of Roof (in Sq.Feet) is required.');

    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('site_id', selectedSiteId);
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
    } finally {
      setSubmitting(false);
    }
  };

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
          { label: 'Site Feasibility Report' },
        ]}
        actions={
          <Link
            to="/vendor-management/jammu/installation/resco/view-assign-installation"
            className="ax-btn ax-btn--secondary ax-btn--sm"
          >
            ← View Assigned Sites
          </Link>
        }
      />

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
            </button>
          </div>
        </div>

        <div className="ax-card__body">
          {/* Section 1: Agency & Contact Information */}
          <div ref={sec1} className="resco-section-block">
            <div className="resco-section-header">
              <div className="resco-section-title-wrap">
                <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>1. Agency &amp; Contact Details</h3>
                <span style={{ fontSize: '12px', color: '#64748b' }}>
                  Site address, agency focal point and building nodal officer contact
                </span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
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
              Cancel
            </Link>
            <button
              type="submit"
              className="ax-btn ax-btn--primary"
              disabled={submitting}
              style={{ minWidth: 200, fontWeight: 700 }}
            >
              {submitting ? 'Submitting Feasibility Report...' : 'Submit Feasibility Report'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

export default ViewAssignVendorInstallation;
