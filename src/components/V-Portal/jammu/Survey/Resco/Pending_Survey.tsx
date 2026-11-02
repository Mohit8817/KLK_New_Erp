import { useState, useEffect, useMemo, type FormEvent, type ChangeEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { PageHead } from '../../../../shell/PageHead';
import {
  getStoredAssignedSites,
  saveAssignedSites,
  getStoredRescoSurveys,
  saveRescoSurveys,
  type AssignedRescoSite,
  type RescoSurveyRecord,
} from './rescoSurveyData';

/* ───────── Single-Card Layout & Floating Labels CSS (Matching Karnataka Reference) ───────── */
const SINGLE_CARD_FORM_CSS = `
  .resco-survey-page {
    --asw-primary: #2563eb;
    --asw-primary-rgb: 37, 99, 235;
  }
  .resco-survey-page .ax-card {
    border: 1px solid var(--ax-border, #e2e8f0);
    border-radius: var(--ax-radius-xl, 16px);
    background: var(--ax-surface-solid, #ffffff);
    box-shadow: var(--ax-shadow-sm, 0 1px 3px rgba(0,0,0,0.05));
    overflow: hidden;
    margin-bottom: var(--ax-space-6, 24px);
  }
  .resco-survey-page .ax-card__header {
    padding: var(--ax-space-5, 20px) var(--ax-space-6, 24px);
    border-bottom: 1px solid var(--ax-border-subtle, #f1f5f9);
    background: var(--ax-surface-subtle, #f8fafc);
    display: flex;
    flex-direction: column;
    gap: var(--ax-space-4, 16px);
  }
  .resco-survey-page .ax-card__body {
    padding: var(--ax-space-6, 24px);
  }

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
    border-radius: 9999px;
    font-size: var(--ax-text-xs, 12px);
    font-weight: 500;
    white-space: nowrap;
    background: var(--ax-surface-solid, #ffffff);
    border: 1px solid var(--ax-border, #cbd5e1);
    color: var(--ax-text, #334155);
    cursor: pointer;
    transition: all 0.15s ease;
    text-decoration: none;
  }
  .resco-section-pill-btn:hover {
    border-color: #2563eb;
    color: #2563eb;
    background: #eff6ff;
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

  /* Floating Label Core (Matching Karnataka InstallationSite) */
  .ax-float { position: relative; width: 100%; }
  .ax-float__input {
    width: 100%;
    height: 46px;
    padding: 12px 14px 4px 14px;
    font-size: var(--ax-text-sm, 13.5px);
    background: var(--ax-surface-solid, #ffffff);
    border: 1px solid var(--ax-border, #cbd5e1);
    border-radius: var(--ax-radius-md, 8px);
    color: var(--ax-text, #1e293b);
    outline: none;
    transition: border-color 0.15s ease, box-shadow 0.15s ease;
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
    transition: top 0.15s ease, font-size 0.15s ease, color 0.15s ease;
    z-index: 2;
    white-space: nowrap;
    max-width: calc(100% - 24px);
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .ax-float__label.floating,
  .ax-float:focus-within .ax-float__label {
    top: 0;
    transform: translateY(-50%);
    font-size: 11px;
    font-weight: 600;
    color: #2563eb;
  }
  .ax-float__label.has-val:not(.floating) {
    top: 0;
    transform: translateY(-50%);
    font-size: 11px;
    font-weight: 500;
    color: var(--ax-text-muted, #64748b);
  }

  /* Responsive Grid Forms */
  .resco-form-grid-2 {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 16px;
  }
  .resco-form-grid-3 {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 16px;
  }
  @media (max-width: 860px) {
    .resco-form-grid-3 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  }
  @media (max-width: 600px) {
    .resco-form-grid-2,
    .resco-form-grid-3 { grid-template-columns: 1fr; }
  }

  /* Upload Dropzone */
  .resco-dropzone {
    border: 1.5px dashed var(--ax-border, #cbd5e1);
    border-radius: var(--ax-radius-lg, 12px);
    padding: 16px;
    text-align: center;
    background: var(--ax-surface-subtle, #f8fafc);
    cursor: pointer;
    transition: all 0.15s ease;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
  }
  .resco-dropzone:hover {
    border-color: #2563eb;
    background: #eff6ff;
  }
`;

interface FloatingFieldProps {
  label: string;
  name: string;
  value: string | number;
  onChange: (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  required?: boolean;
  disabled?: boolean;
  type?: string;
  placeholder?: string;
  options?: { value: string; label: string }[];
}

function FloatingField({
  label,
  name,
  value,
  onChange,
  required,
  disabled,
  type = 'text',
  placeholder,
  options,
}: FloatingFieldProps) {
  const [focused, setFocused] = useState(false);
  const hasVal = Boolean(value !== undefined && value !== null && String(value).length > 0);

  if (options) {
    return (
      <div className="ax-float">
        <select
          id={name}
          name={name}
          value={value}
          onChange={onChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          required={required}
          disabled={disabled}
          className="ax-float__input"
          style={{ paddingTop: 14 }}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <label htmlFor={name} className={`ax-float__label ${focused ? 'floating' : hasVal ? 'has-val' : ''}`}>
          {label} {required && <span style={{ color: 'var(--ax-danger, #ef4444)' }}>*</span>}
        </label>
      </div>
    );
  }

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

export function Pending_Survey() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const querySiteId = searchParams.get('siteId') || '';

  const [assignedSites, setAssignedSites] = useState<AssignedRescoSite[]>([]);
  const [selectedSiteId, setSelectedSiteId] = useState<string>(querySiteId);
  const [toastMsg, setToastMsg] = useState<{ type: 'success' | 'danger'; text: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const list = getStoredAssignedSites();
    setAssignedSites(list);
    if (querySiteId && list.some((s) => s.id === querySiteId)) {
      setSelectedSiteId(querySiteId);
    }
  }, [querySiteId]);

  // Selected site object for auto-filling General Information
  const selectedSite = useMemo(() => {
    return assignedSites.find((s) => s.id === selectedSiteId) || null;
  }, [assignedSites, selectedSiteId]);

  // Form State initialized matching exact user fields
  const [formData, setFormData] = useState({
    // Contact & Authority
    siteAddress: '',
    nearestLandmark: '',
    agencyContactPerson: '',
    agencyContactNo: '',
    nodalPerson: '',
    nodalPersonContact: '',

    // Technical Information
    loadType: '',
    connectionPhase: '',
    meterConnectionType: '',
    meterNumber: '',
    meterType: '',
    sanctionLoadKw: '',
    connectedLoadKw: '',
    gridPowerAvailability: 'No',
    threePhaseAvailability: '',
    missingPhase: 'None',
    ltdbPresent: '',
    roofCondition: '',
    totalRoofAreaSqFt: '',
    freeSpaceSolarSqFt: '',
    freeSpaceControlRoomSqFt: '',
    earthPitPosition: '',
    siteFeasible: '',
    surveyRemarks: '',

    // Civil / Structural
    ageOfBuilding: '',
    accessToRoof: 'Not Available',
    rooftopHeightFt: '',
    parapetHeightFt: '',
    noOfFloors: '',
    waterSourceForCleaning: '',

    // Other Information
    accessToSite: '',
    distanceFromMainRoadKm: '',
    latitude: '32.7266° N',
    longitude: '74.8570° E',
  });

  // File states
  const [buildingImage, setBuildingImage] = useState<File | null>(null);
  const [roofImage, setRoofImage] = useState<File | null>(null);
  const [controlRoomImage, setControlRoomImage] = useState<File | null>(null);
  const [meterImage, setMeterImage] = useState<File | null>(null);
  const [otherImage, setOtherImage] = useState<File | null>(null);
  const [pdfFile, setPdfFile] = useState<File | null>(null);

  // Auto-fill when site is selected
  useEffect(() => {
    if (selectedSite) {
      setFormData((prev) => ({
        ...prev,
        siteAddress: prev.siteAddress || selectedSite.location,
        agencyContactPerson: prev.agencyContactPerson || 'Er. Amit Khajuria (KLK Lead)',
        agencyContactNo: prev.agencyContactNo || '+91 94191 55667',
        surveyRemarks: prev.surveyRemarks || `Feasibility assessment for ${selectedSite.siteName}`,
      }));
    }
  }, [selectedSite]);

  const handleInputChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFormSubmit = (e: FormEvent) => {
    e.preventDefault();

    if (!selectedSite) {
      setToastMsg({ type: 'danger', text: 'Please select an assigned RESCO site to proceed.' });
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setIsSubmitting(true);

    try {
      // Build new survey record
      const existingSurveys = getStoredRescoSurveys();
      const newRecord: RescoSurveyRecord = {
        srNo: existingSurveys.length + 1,
        uniqueId: selectedSite.id,
        state: selectedSite.state,
        district: selectedSite.district,
        division: selectedSite.division,
        subDivision: selectedSite.subDivision,
        department: selectedSite.department,
        siteName: selectedSite.siteName,
        siteAddress: formData.siteAddress || selectedSite.location,
        caNo: selectedSite.caNo,
        surveyAddress: formData.siteAddress || selectedSite.location,
        nearestLandmark: formData.nearestLandmark || 'Near Main Gate',
        agencyContactPerson: formData.agencyContactPerson || 'KLK Operations',
        agencyContactNo: formData.agencyContactNo || '+91 94191 00000',
        nodalPerson: formData.nodalPerson || 'Concern Officer',
        nodalPersonContact: formData.nodalPersonContact || '+91 94191 11111',
        latitude: formData.latitude,
        longitude: formData.longitude,
        loadType: formData.loadType || 'Institutional',
        connectionPhase: formData.connectionPhase || '3 Phase',
        meterConnectionType: formData.meterConnectionType || 'LT-CT Metered',
        meterNumber: formData.meterNumber || 'MTR-PENDING',
        meterType: formData.meterType || 'Bidirectional Smart',
        sanctionLoadKw: formData.sanctionLoadKw ? `${formData.sanctionLoadKw} KW` : '60 KW',
        connectedLoadKw: formData.connectedLoadKw ? `${formData.connectedLoadKw} KW` : '40 KW',
        gridPowerAvailability: formData.gridPowerAvailability ? `${formData.gridPowerAvailability} Hours` : '20 Hours',
        threePhaseAvailability: formData.threePhaseAvailability || 'Yes',
        missingPhase: formData.missingPhase || 'None',
        ltdbPresent: formData.ltdbPresent || 'Yes',
        roofCondition: formData.roofCondition || 'Good (RCC Flat)',
        totalRoofAreaSqFt: Number(formData.totalRoofAreaSqFt) || 8500,
        freeSpaceSolarSqFt: Number(formData.freeSpaceSolarSqFt) || 5400,
        freeSpaceControlRoomSqFt: Number(formData.freeSpaceControlRoomSqFt) || 180,
        earthPitPosition: formData.earthPitPosition || 'Campus Boundary Corner',
        ageOfBuilding: formData.ageOfBuilding ? `${formData.ageOfBuilding} Years` : '10 Years',
        accessToRoof: formData.accessToRoof || 'Standard Staircase',
        rooftopHeightFt: Number(formData.rooftopHeightFt) || 32,
        parapetHeightFt: Number(formData.parapetHeightFt) || 3.5,
        noOfFloors: formData.noOfFloors || 'G + 1',
        waterSourceForCleaning: formData.waterSourceForCleaning || 'Overhead Tank',
        accessToSite: formData.accessToSite || 'Paved Road',
        distanceFromMainRoadKm: Number(formData.distanceFromMainRoadKm) || 0.1,
        siteFeasible: formData.siteFeasible || 'Yes',
        surveyRemarks: formData.surveyRemarks || 'Feasibility confirmed for RESCO model.',
        buildingImage: buildingImage ? URL.createObjectURL(buildingImage) : '/images/panleimg.jpg',
        roofImage: roofImage ? URL.createObjectURL(roofImage) : '/images/solar-panel-field.png',
        controlRoomImage: controlRoomImage ? URL.createObjectURL(controlRoomImage) : '/images/panleimg.jpg',
        meterImage: meterImage ? URL.createObjectURL(meterImage) : '/images/panleimg.jpg',
        otherImage: otherImage ? URL.createObjectURL(otherImage) : '/images/solar-panel-bg.png',
        pdfUrl: pdfFile ? URL.createObjectURL(pdfFile) : '/documents/JK-RESCO-survey.pdf',
        bosStatus: 'Pending',
        bosFile: '',
        bosRemarks: 'New feasibility report submitted for technical BOS verification.',
      };

      // Save into storage
      const updatedSurveys = [newRecord, ...existingSurveys.filter((s) => s.uniqueId !== selectedSite.id)];
      saveRescoSurveys(updatedSurveys);

      // Mark assigned site as completed
      const updatedAssigned = assignedSites.map((s) =>
        s.id === selectedSite.id ? { ...s, surveyStatus: 'completed' as const } : s
      );
      saveAssignedSites(updatedAssigned);
      setAssignedSites(updatedAssigned);

      setToastMsg({
        type: 'success',
        text: `Site Feasibility Report for ${selectedSite.id} (${selectedSite.siteName}) successfully submitted!`,
      });

      // Navigate to View Survey after short delay
      window.setTimeout(() => {
        navigate('/v/jammu/survey/resco/view-survey');
      }, 1500);
    } catch (err: any) {
      setToastMsg({ type: 'danger', text: 'Failed to submit feasibility report. Please verify inputs.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="resco-survey-page">
      <style>{SINGLE_CARD_FORM_CSS}</style>

      {/* ── Page Head ── */}
      <PageHead
        title="Site Feasibility Report"
        subtitle="Record technical rooftop solar feasibility, electrical metering parameters, civil structure inspection, and photo evidence for RESCO sites"
        breadcrumbs={[
          { label: 'Home', href: '/v-dashboard' },
          { label: 'Jammu & Kashmir' },
          { label: 'Survey' },
          { label: 'RESCO' },
          { label: 'Site Feasibility Report' },
        ]}
        actions={
          <div style={{ display: 'inline-flex', gap: 'var(--ax-space-2)' }}>
            <Link to="/v/jammu/survey/resco/assign-survey" className="ax-btn ax-btn--secondary ax-btn--sm">
              ← Assigned Sites
            </Link>
            <Link to="/v/jammu/survey/resco/view-survey" className="ax-btn ax-btn--primary ax-btn--sm">
              View Survey Ledger ➔
            </Link>
          </div>
        }
      />

      {toastMsg && (
        <div className={`ax-alert ax-alert--${toastMsg.type}`} style={{ marginBottom: 'var(--ax-space-4)' }} role="status">
          <div className="ax-alert__title">{toastMsg.type === 'success' ? 'Success' : 'Notice'}</div>
          <div className="ax-alert__text">{toastMsg.text}</div>
        </div>
      )}

      {/* ── MAIN UNIFIED FORM CARD ── */}
      <form onSubmit={handleFormSubmit} className="ax-card">
        {/* Card Header with Site Selector & Section Nav Pills */}
        <div className="ax-card__header">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <div style={{ flex: '1 1 320px', maxWidth: 480 }}>
              <label htmlFor="select-site" style={{ display: 'block', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: '#2563eb', marginBottom: 6 }}>
                Select Site <span style={{ color: 'var(--ax-danger, #ef4444)' }}>*</span>
              </label>
              <select
                id="select-site"
                className="ax-input"
                style={{ width: '100%', height: 42, fontWeight: 600 }}
                value={selectedSiteId}
                onChange={(e) => setSelectedSiteId(e.target.value)}
                required
              >
                <option value="">-- Select Site --</option>
                {assignedSites.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.id} — {s.siteName} ({s.district}) [{s.surveyStatus === 'completed' ? '✓ Surveyed' : 'Pending'}]
                  </option>
                ))}
              </select>
            </div>

            {selectedSite && (
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <span className="ax-badge ax-badge--soft ax-badge--accent ax-badge--pill">
                  CA: {selectedSite.caNo}
                </span>
                <span className="ax-badge ax-badge--soft ax-badge--neutral ax-badge--pill">
                  {selectedSite.department}
                </span>
              </div>
            )}
          </div>

          {/* Nav Pills for smooth jumping */}
          <nav className="resco-section-pills" aria-label="Survey Sections">
            <a href="#section-general" className="resco-section-pill-btn">
              <span className="pill-num">1</span> General Info
            </a>
            <a href="#section-contact" className="resco-section-pill-btn">
              <span className="pill-num">2</span> Contacts &amp; Authority
            </a>
            <a href="#section-technical" className="resco-section-pill-btn">
              <span className="pill-num">3</span> Technical &amp; Load
            </a>
            <a href="#section-civil" className="resco-section-pill-btn">
              <span className="pill-num">4</span> Civil &amp; Structural
            </a>
            <a href="#section-other" className="resco-section-pill-btn">
              <span className="pill-num">5</span> Logistics &amp; Access
            </a>
            <a href="#section-media" className="resco-section-pill-btn">
              <span className="pill-num">6</span> Images &amp; PDF
            </a>
          </nav>
        </div>

        {/* Card Body with all Form Sections */}
        <div className="ax-card__body">
          {/* ── 1. General Information (Read-only summary of selected site) ── */}
          <div id="section-general" className="resco-section-block">
            <div className="resco-section-header">
              <div className="resco-section-title-wrap">
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--ax-text-strong)' }}>
                  General Information
                </h3>
                <span style={{ fontSize: 12, color: 'var(--ax-text-muted)' }}>
                  Auto-populated administrative attributes for the selected site
                </span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
              <div style={{ background: 'var(--ax-surface-subtle, #f8fafc)', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--ax-border, #e2e8f0)' }}>
                <span style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', color: 'var(--ax-text-muted)', display: 'block' }}>Unique ID</span>
                <b style={{ color: '#2563eb', fontFamily: 'monospace' }}>{selectedSite?.id || '—'}</b>
              </div>
              <div style={{ background: 'var(--ax-surface-subtle, #f8fafc)', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--ax-border, #e2e8f0)' }}>
                <span style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', color: 'var(--ax-text-muted)', display: 'block' }}>State</span>
                <b>{selectedSite?.state || 'Jammu & Kashmir'}</b>
              </div>
              <div style={{ background: 'var(--ax-surface-subtle, #f8fafc)', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--ax-border, #e2e8f0)' }}>
                <span style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', color: 'var(--ax-text-muted)', display: 'block' }}>District</span>
                <b>{selectedSite?.district || '—'}</b>
              </div>
              <div style={{ background: 'var(--ax-surface-subtle, #f8fafc)', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--ax-border, #e2e8f0)' }}>
                <span style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', color: 'var(--ax-text-muted)', display: 'block' }}>Division</span>
                <b>{selectedSite?.division || '—'}</b>
              </div>
              <div style={{ background: 'var(--ax-surface-subtle, #f8fafc)', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--ax-border, #e2e8f0)' }}>
                <span style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', color: 'var(--ax-text-muted)', display: 'block' }}>Sub Division</span>
                <b>{selectedSite?.subDivision || '—'}</b>
              </div>
              <div style={{ background: 'var(--ax-surface-subtle, #f8fafc)', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--ax-border, #e2e8f0)' }}>
                <span style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', color: 'var(--ax-text-muted)', display: 'block' }}>Department</span>
                <b>{selectedSite?.department || '—'}</b>
              </div>
              <div style={{ background: 'var(--ax-surface-subtle, #f8fafc)', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--ax-border, #e2e8f0)' }}>
                <span style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', color: 'var(--ax-text-muted)', display: 'block' }}>Site Name</span>
                <b>{selectedSite?.siteName || '—'}</b>
              </div>
              <div style={{ background: 'var(--ax-surface-subtle, #f8fafc)', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--ax-border, #e2e8f0)' }}>
                <span style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', color: 'var(--ax-text-muted)', display: 'block' }}>Location</span>
                <b>{selectedSite?.location || '—'}</b>
              </div>
              <div style={{ background: 'var(--ax-surface-subtle, #f8fafc)', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--ax-border, #e2e8f0)' }}>
                <span style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', color: 'var(--ax-text-muted)', display: 'block' }}>CA No.</span>
                <b style={{ fontFamily: 'monospace' }}>{selectedSite?.caNo || '—'}</b>
              </div>
            </div>
          </div>

          <hr className="resco-section-divider" />

          {/* ── 2. Fill this Form Notice & Contact Person Details ── */}
          <div id="section-contact" className="resco-section-block">
            <div className="resco-section-header">
              <div className="resco-section-title-wrap">
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--ax-text-strong)' }}>
                  Fill this Form
                </h3>
                <span style={{ fontSize: 12, color: 'var(--ax-text-muted)' }}>
                  The field labels marked with <span style={{ color: 'var(--ax-danger, #ef4444)' }}>*</span> are input fields.
                </span>
              </div>
            </div>

            <div className="resco-form-grid-2">
              <FloatingField
                label="Site Address (details)"
                name="siteAddress"
                value={formData.siteAddress}
                onChange={handleInputChange}
                required
                placeholder="Enter Site Address"
              />
              <FloatingField
                label="Nearest Landmark"
                name="nearestLandmark"
                value={formData.nearestLandmark}
                onChange={handleInputChange}
                required
                placeholder="Enter Nearest Landmark"
              />
              <FloatingField
                label="Name of Contact Person of Agency"
                name="agencyContactPerson"
                value={formData.agencyContactPerson}
                onChange={handleInputChange}
                required
                placeholder="Enter Name of Contact Person"
              />
              <FloatingField
                label="Contact Number"
                name="agencyContactNo"
                value={formData.agencyContactNo}
                onChange={handleInputChange}
                required
                placeholder="Enter Contact No. of the Person"
              />
              <FloatingField
                label="Nodal Person of concern building"
                name="nodalPerson"
                value={formData.nodalPerson}
                onChange={handleInputChange}
                required
                placeholder="Enter Name of Nodal Person"
              />
              <FloatingField
                label="Contact Number of Nodal Person"
                name="nodalPersonContact"
                value={formData.nodalPersonContact}
                onChange={handleInputChange}
                required
                placeholder="Enter Contact of Nodal Person"
              />
            </div>
          </div>

          <hr className="resco-section-divider" />

          {/* ── 3. Technical Information ── */}
          <div id="section-technical" className="resco-section-block">
            <div className="resco-section-header">
              <div className="resco-section-title-wrap">
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--ax-text-strong)' }}>
                  Technical Information
                </h3>
                <span style={{ fontSize: 12, color: 'var(--ax-text-muted)' }}>
                  Grid connection, metering, load parameters, and rooftop solar feasibility
                </span>
              </div>
            </div>

            <div className="resco-form-grid-3">
              <FloatingField
                label="Type of Load"
                name="loadType"
                value={formData.loadType}
                onChange={handleInputChange}
                required
                options={[
                  { value: '', label: 'Select Type of Load...' },
                  { value: 'Institutional / Commercial', label: 'Institutional / Commercial' },
                  { value: 'Continuous Critical Hospital Load', label: 'Continuous Critical Hospital Load' },
                  { value: 'Commercial Office', label: 'Commercial Office' },
                  { value: 'Educational Institution', label: 'Educational Institution' },
                  { value: 'Industrial Power Load', label: 'Industrial Power Load' },
                  { value: 'Domestic / Mixed Load', label: 'Domestic / Mixed Load' },
                ]}
              />

              <FloatingField
                label="Connection Phase"
                name="connectionPhase"
                value={formData.connectionPhase}
                onChange={handleInputChange}
                required
                options={[
                  { value: '', label: 'Select Connection Phase...' },
                  { value: '3 Phase', label: '3 Phase' },
                  { value: '1 Phase', label: '1 Phase' },
                ]}
              />

              <FloatingField
                label="Meter Connection Type"
                name="meterConnectionType"
                value={formData.meterConnectionType}
                onChange={handleInputChange}
                required
                options={[
                  { value: '', label: 'Select Meter Connection Type...' },
                  { value: 'LT-CT Metered', label: 'LT-CT Metered' },
                  { value: 'HT Dedicated Substation', label: 'HT Dedicated Substation' },
                  { value: 'Direct Bidirectional', label: 'Direct Bidirectional' },
                  { value: 'Smart Feeder Net-Metered', label: 'Smart Feeder Net-Metered' },
                ]}
              />

              <FloatingField
                label="Meter Number"
                name="meterNumber"
                value={formData.meterNumber}
                onChange={handleInputChange}
                required
                placeholder="Enter Meter Number"
              />

              <FloatingField
                label="Meter Type"
                name="meterType"
                value={formData.meterType}
                onChange={handleInputChange}
                required
                options={[
                  { value: '', label: 'Select Meter Type...' },
                  { value: 'Bidirectional Smart Net-Meter', label: 'Bidirectional Smart Net-Meter' },
                  { value: 'Electronic Bidirectional', label: 'Electronic Bidirectional' },
                  { value: 'Smart AMR Meter', label: 'Smart AMR Meter' },
                  { value: 'Conventional Mechanical', label: 'Conventional Mechanical' },
                ]}
              />

              <FloatingField
                label="Sanction Load (KW/KVA)"
                name="sanctionLoadKw"
                value={formData.sanctionLoadKw}
                onChange={handleInputChange}
                required
                placeholder="Enter Sanction Load"
              />

              <FloatingField
                label="Instantaneous/Connected Load (KW)"
                name="connectedLoadKw"
                value={formData.connectedLoadKw}
                onChange={handleInputChange}
                required
                placeholder="Enter Instantaneous/Connected Load"
              />

              <FloatingField
                label="Grid power availability in hours"
                name="gridPowerAvailability"
                value={formData.gridPowerAvailability}
                onChange={handleInputChange}
                required
                placeholder="Enter hours (e.g. 22)"
              />

              <FloatingField
                label="Is all three-phase available in LTDB"
                name="threePhaseAvailability"
                value={formData.threePhaseAvailability}
                onChange={handleInputChange}
                required
                options={[
                  { value: '', label: 'Select three-phase availability...' },
                  { value: 'Yes', label: 'Yes' },
                  { value: 'No', label: 'No' },
                ]}
              />

              <FloatingField
                label="If phase is missing, name i.e., R, Y, B, N"
                name="missingPhase"
                value={formData.missingPhase}
                onChange={handleInputChange}
                required
                placeholder="e.g. None or R-Phase"
              />

              <FloatingField
                label="Is LTDB Present"
                name="ltdbPresent"
                value={formData.ltdbPresent}
                onChange={handleInputChange}
                required
                options={[
                  { value: '', label: 'Select Is LTDB Present...' },
                  { value: 'Yes', label: 'Yes' },
                  { value: 'No', label: 'No' },
                ]}
              />

              <FloatingField
                label="Roof Condition of solar plant"
                name="roofCondition"
                value={formData.roofCondition}
                onChange={handleInputChange}
                required
                options={[
                  { value: '', label: '-- Select Roof Condition --' },
                  { value: 'Excellent (Waterproofed RCC)', label: 'Excellent (Waterproofed RCC)' },
                  { value: 'Good (RCC Flat Slab)', label: 'Good (RCC Flat Slab)' },
                  { value: 'Average (RCC Clean Surface)', label: 'Average (RCC Clean Surface)' },
                  { value: 'Metal Shed / Profile Sheet', label: 'Metal Shed / Profile Sheet' },
                  { value: 'Needs Waterproofing / Repair', label: 'Needs Waterproofing / Repair' },
                ]}
              />

              <FloatingField
                label="Total Area of Roof (in Sq.Feet)"
                name="totalRoofAreaSqFt"
                value={formData.totalRoofAreaSqFt}
                onChange={handleInputChange}
                required
                type="number"
                placeholder="Enter Total Area of Roof"
              />

              <FloatingField
                label="Free space for solar (in Sq.Feet)"
                name="freeSpaceSolarSqFt"
                value={formData.freeSpaceSolarSqFt}
                onChange={handleInputChange}
                required
                type="number"
                placeholder="Enter Free space for solar Installation"
              />

              <FloatingField
                label="Free space for Control Room (in Sq.Feet)"
                name="freeSpaceControlRoomSqFt"
                value={formData.freeSpaceControlRoomSqFt}
                onChange={handleInputChange}
                required
                type="number"
                placeholder="Enter Free space for Control Room/Inverter"
              />

              <FloatingField
                label="Earth pit position"
                name="earthPitPosition"
                value={formData.earthPitPosition}
                onChange={handleInputChange}
                required
                options={[
                  { value: '', label: 'Select Earth pit position...' },
                  { value: 'North-East Corner Campus Lawn', label: 'North-East Corner Campus Lawn' },
                  { value: 'South Substation Boundary Yard', label: 'South Substation Boundary Yard' },
                  { value: 'Open Field Area Behind Main Building', label: 'Open Field Area Behind Main Building' },
                  { value: 'East Boundary Ground Area', label: 'East Boundary Ground Area' },
                  { value: 'Courtyard Boundary Corner', label: 'Courtyard Boundary Corner' },
                ]}
              />

              <FloatingField
                label="Site Feasible"
                name="siteFeasible"
                value={formData.siteFeasible}
                onChange={handleInputChange}
                required
                options={[
                  { value: '', label: 'Select Feasibility...' },
                  { value: 'Yes', label: 'Yes (Highly Feasible)' },
                  { value: 'Feasible with Modifications', label: 'Feasible with Modifications' },
                  { value: 'No', label: 'No (Not Feasible)' },
                ]}
              />

              <div style={{ gridColumn: 'span 2' }}>
                <FloatingField
                  label="Survey Remarks"
                  name="surveyRemarks"
                  value={formData.surveyRemarks}
                  onChange={handleInputChange}
                  required
                  placeholder="Enter survey findings, structural note, or proposed capacity"
                />
              </div>
            </div>
          </div>

          <hr className="resco-section-divider" />

          {/* ── 4. Civil / Structural ── */}
          <div id="section-civil" className="resco-section-block">
            <div className="resco-section-header">
              <div className="resco-section-title-wrap">
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--ax-text-strong)' }}>
                  Civil / Structural
                </h3>
                <span style={{ fontSize: 12, color: 'var(--ax-text-muted)' }}>
                  Building age, rooftop access staircases, height measurements, and water source
                </span>
              </div>
            </div>

            <div className="resco-form-grid-3">
              <FloatingField
                label="Age of Building"
                name="ageOfBuilding"
                value={formData.ageOfBuilding}
                onChange={handleInputChange}
                required
                placeholder="e.g. 12 Years"
              />

              <FloatingField
                label="Access to the roof (Availability of Staircase)"
                name="accessToRoof"
                value={formData.accessToRoof}
                onChange={handleInputChange}
                required
                options={[
                  { value: 'Permanent Concrete Staircase', label: 'Permanent Concrete Staircase' },
                  { value: 'Enclosed Staircase with Fire Door', label: 'Enclosed Staircase with Fire Door' },
                  { value: 'Steel Cage Ladder', label: 'Steel Cage Ladder' },
                  { value: 'Cat Ladder', label: 'Cat Ladder' },
                  { value: 'Not Available', label: 'Not Available' },
                ]}
              />

              <FloatingField
                label="Rooftop Height (Feet)"
                name="rooftopHeightFt"
                value={formData.rooftopHeightFt}
                onChange={handleInputChange}
                required
                type="number"
                placeholder="Enter Rooftop Height"
              />

              <FloatingField
                label="Parapet Height (Feet)"
                name="parapetHeightFt"
                value={formData.parapetHeightFt}
                onChange={handleInputChange}
                required
                type="number"
                placeholder="Enter Parapet Height"
              />

              <FloatingField
                label="No. of floors (G+...)"
                name="noOfFloors"
                value={formData.noOfFloors}
                onChange={handleInputChange}
                required
                placeholder="e.g. G + 2"
              />

              <FloatingField
                label="Water Source for Cleaning"
                name="waterSourceForCleaning"
                value={formData.waterSourceForCleaning}
                onChange={handleInputChange}
                required
                options={[
                  { value: '', label: 'Select Water Source...' },
                  { value: 'Overhead Tank Supply with Piped Tap', label: 'Overhead Tank Supply with Piped Tap' },
                  { value: 'Borewell & Dedicated Overhead Tank', label: 'Borewell & Dedicated Overhead Tank' },
                  { value: 'Municipal Water Connection', label: 'Municipal Water Connection' },
                  { value: 'Industrial Water Connection', label: 'Industrial Water Connection' },
                  { value: 'Tanker Supply Required', label: 'Tanker Supply Required' },
                  { value: 'None', label: 'None' },
                ]}
              />
            </div>
          </div>

          <hr className="resco-section-divider" />

          {/* ── 5. Other Information ── */}
          <div id="section-other" className="resco-section-block">
            <div className="resco-section-header">
              <div className="resco-section-title-wrap">
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--ax-text-strong)' }}>
                  Other Information
                </h3>
                <span style={{ fontSize: 12, color: 'var(--ax-text-muted)' }}>
                  Site logistics, approach road conditions, and GPS coordinates
                </span>
              </div>
            </div>

            <div className="resco-form-grid-2">
              <FloatingField
                label="Access to Site"
                name="accessToSite"
                value={formData.accessToSite}
                onChange={handleInputChange}
                required
                placeholder="Enter Access to Site (e.g. Wide 4-Lane Paved Road)"
              />

              <FloatingField
                label="Distance of site from main Road (km)"
                name="distanceFromMainRoadKm"
                value={formData.distanceFromMainRoadKm}
                onChange={handleInputChange}
                required
                type="number"
                placeholder="Enter Distance of site from main Road"
              />

              <FloatingField
                label="Latitude"
                name="latitude"
                value={formData.latitude}
                onChange={handleInputChange}
                required
                placeholder="e.g. 32.7266° N"
              />

              <FloatingField
                label="Longitude"
                name="longitude"
                value={formData.longitude}
                onChange={handleInputChange}
                required
                placeholder="e.g. 74.8570° E"
              />
            </div>
          </div>

          <hr className="resco-section-divider" />

          {/* ── 6. Photo Evidence & Attachments ── */}
          <div id="section-media" className="resco-section-block">
            <div className="resco-section-header">
              <div className="resco-section-title-wrap">
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--ax-text-strong)' }}>
                  Photo Evidence &amp; PDF Document
                </h3>
                <span style={{ fontSize: 12, color: 'var(--ax-text-muted)' }}>
                  Upload survey site photographs, meter readings, and technical feasibility dossier
                </span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 14 }}>
              {/* Building Image * */}
              <div className="resco-dropzone" onClick={() => document.getElementById('file-building')?.click()}>
                <input
                  type="file"
                  id="file-building"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={(e) => e.target.files?.[0] && setBuildingImage(e.target.files[0])}
                />
                <span style={{ fontSize: 24 }}>🏢</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#2563eb' }}>Building Image *</span>
                <span style={{ fontSize: 11, color: 'var(--ax-text-muted)' }}>
                  {buildingImage ? `✓ ${buildingImage.name}` : 'Click to upload building photo'}
                </span>
              </div>

              {/* Roof Image * */}
              <div className="resco-dropzone" onClick={() => document.getElementById('file-roof')?.click()}>
                <input
                  type="file"
                  id="file-roof"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={(e) => e.target.files?.[0] && setRoofImage(e.target.files[0])}
                />
                <span style={{ fontSize: 24 }}>☀️</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#2563eb' }}>Roof Image *</span>
                <span style={{ fontSize: 11, color: 'var(--ax-text-muted)' }}>
                  {roofImage ? `✓ ${roofImage.name}` : 'Click to upload rooftop panorama'}
                </span>
              </div>

              {/* Control Room Image * */}
              <div className="resco-dropzone" onClick={() => document.getElementById('file-control-room')?.click()}>
                <input
                  type="file"
                  id="file-control-room"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={(e) => e.target.files?.[0] && setControlRoomImage(e.target.files[0])}
                />
                <span style={{ fontSize: 24 }}>⚡</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#2563eb' }}>Control Room Image *</span>
                <span style={{ fontSize: 11, color: 'var(--ax-text-muted)' }}>
                  {controlRoomImage ? `✓ ${controlRoomImage.name}` : 'Click to upload inverter room'}
                </span>
              </div>

              {/* Meter Image */}
              <div className="resco-dropzone" onClick={() => document.getElementById('file-meter')?.click()}>
                <input
                  type="file"
                  id="file-meter"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={(e) => e.target.files?.[0] && setMeterImage(e.target.files[0])}
                />
                <span style={{ fontSize: 24 }}>📟</span>
                <span style={{ fontSize: 12, fontWeight: 700 }}>Meter Image</span>
                <span style={{ fontSize: 11, color: 'var(--ax-text-muted)' }}>
                  {meterImage ? `✓ ${meterImage.name}` : 'Click to upload meter photo'}
                </span>
              </div>

              {/* Other Image */}
              <div className="resco-dropzone" onClick={() => document.getElementById('file-other')?.click()}>
                <input
                  type="file"
                  id="file-other"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={(e) => e.target.files?.[0] && setOtherImage(e.target.files[0])}
                />
                <span style={{ fontSize: 24 }}>📷</span>
                <span style={{ fontSize: 12, fontWeight: 700 }}>Other Image</span>
                <span style={{ fontSize: 11, color: 'var(--ax-text-muted)' }}>
                  {otherImage ? `✓ ${otherImage.name}` : 'Click to upload additional photo'}
                </span>
              </div>

              {/* PDF Document */}
              <div className="resco-dropzone" onClick={() => document.getElementById('file-pdf')?.click()}>
                <input
                  type="file"
                  id="file-pdf"
                  accept=".pdf"
                  style={{ display: 'none' }}
                  onChange={(e) => e.target.files?.[0] && setPdfFile(e.target.files[0])}
                />
                <span style={{ fontSize: 24 }}>📄</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#dc2626' }}>Survey PDF</span>
                <span style={{ fontSize: 11, color: 'var(--ax-text-muted)' }}>
                  {pdfFile ? `✓ ${pdfFile.name}` : 'Click to upload Feasibility PDF'}
                </span>
              </div>
            </div>
          </div>

          {/* Form Actions Footer */}
          <div style={{ marginTop: 32, paddingTop: 20, borderTop: '1px solid var(--ax-border, #e2e8f0)', display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
            <Link to="/v/jammu/survey/resco/assign-survey" className="ax-btn ax-btn--ghost">
              Cancel
            </Link>
            <button
              type="submit"
              className="ax-btn ax-btn--primary"
              disabled={isSubmitting}
              style={{ padding: '0 24px', fontWeight: 700 }}
            >
              {isSubmitting ? 'Saving Feasibility Report…' : 'Save & Submit Feasibility Report ➔'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

export default Pending_Survey;
