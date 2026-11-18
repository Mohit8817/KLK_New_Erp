import { useState, useRef, useEffect, useMemo, type FormEvent, type ChangeEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PageHead } from '../../../../shell/PageHead';
import {
  goaAdminService,
  type GoaAmcVendor,
  type GoaAmcSiteOption,
  type GoaAmcAssignRecord,
} from '../../goa-services';

// Unified Single-Card Layout with Floating Labels & Section Dividers (matching exact user reference)
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
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
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

export function GoaSRTAMCAssignSRT() {
  const navigate = useNavigate();

  // Dynamic Options from API
  const [vendorList, setVendorList] = useState<GoaAmcVendor[]>([]);
  const [districtList, setDistrictList] = useState<string[]>(['North Goa', 'South Goa']);
  const [recentSrts, setRecentSrts] = useState<GoaAmcAssignRecord[]>([]);

  // Available Sites for selected AMC and District
  const [availableSites, setAvailableSites] = useState<GoaAmcSiteOption[]>([]);
  const [fetchingSites, setFetchingSites] = useState<boolean>(false);

  // Form State
  const [vendor, setVendor] = useState<string>('');
  const [amcNumber, setAmcNumber] = useState<string>(''); // 1 to 5
  const [stateName, setStateName] = useState<string>('Goa');
  const [district, setDistrict] = useState<string>('');
  const [selectedSiteIds, setSelectedSiteIds] = useState<number[]>([]);
  const [siteSearchQuery, setSiteSearchQuery] = useState<string>('');
  const [selectedSiteDropdownId, setSelectedSiteDropdownId] = useState<string>('');
  const [remarks, setRemarks] = useState<string>('');

  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');
  const [alreadyAssignedSites, setAlreadyAssignedSites] = useState<string[]>([]);

  // Section refs for smooth navigation pills
  const sec1 = useRef<HTMLDivElement>(null);
  const sec2 = useRef<HTMLDivElement>(null);
  const sec3 = useRef<HTMLDivElement>(null);
  const sec4 = useRef<HTMLDivElement>(null);

  const scrollTo = (ref: React.RefObject<HTMLDivElement | null>) => {
    ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // Fetch Vendors and Districts on component mount (GET /goa/srt/amc/assign)
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    goaAdminService
      .getAMCAssignFormData()
      .then((res) => {
        if (cancelled) return;
        setVendorList(Array.isArray(res.vendors) ? res.vendors : []);

        const fallbackDists = ['North Goa', 'South Goa'];
        const dists = Array.isArray(res.district)
          ? res.district.map((d: any) => (typeof d === 'string' ? d : d.district)).filter(Boolean)
          : [];
        setDistrictList(dists.length > 0 ? Array.from(new Set(dists)) : fallbackDists);
        setRecentSrts(Array.isArray(res.srts) ? res.srts : []);
      })
      .catch((err) => {
        if (!cancelled) {
          console.warn('Initial AMC assign data load error:', err);
          setDistrictList(['North Goa', 'South Goa']);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // Fetch Sites when district and amcNumber change (GET /goa/srt/amc/get-site-name)
  useEffect(() => {
    if (!district || !amcNumber) {
      setAvailableSites([]);
      setSelectedSiteIds([]);
      setSiteSearchQuery('');
      setSelectedSiteDropdownId('');
      return;
    }

    let cancelled = false;
    setFetchingSites(true);
    setSelectedSiteIds([]);
    setSiteSearchQuery('');
    setSelectedSiteDropdownId('');

    goaAdminService
      .getAMCSiteNames(district, amcNumber)
      .then((sites) => {
        if (!cancelled && Array.isArray(sites)) {
          setAvailableSites(sites);
        }
      })
      .catch((err) => {
        console.warn('Failed to fetch sites for AMC:', district, amcNumber, err);
        if (!cancelled) setAvailableSites([]);
      })
      .finally(() => {
        if (!cancelled) setFetchingSites(false);
      });

    return () => {
      cancelled = true;
    };
  }, [district, amcNumber]);

  // Filter sites for search query
  const filteredSites = useMemo(() => {
    const q = siteSearchQuery.trim().toLowerCase();
    if (!q) return availableSites;
    return availableSites.filter(
      (s) =>
        String(s.id).includes(q) ||
        (s.site_name || '').toLowerCase().includes(q)
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
    setAlreadyAssignedSites([]);

    if (!vendor) return setErrorMsg('Vendor Name is required.');
    if (!amcNumber) return setErrorMsg('AMC Cycle is required.');
    if (!stateName) return setErrorMsg('State is required.');
    if (!district) return setErrorMsg('District is required.');
    if (selectedSiteIds.length === 0) return setErrorMsg('Please select at least one site to assign.');

    setLoading(true);
    try {
      const payload = {
        vendor: parseInt(vendor, 10),
        amc: parseInt(amcNumber, 10),
        state: stateName.toLowerCase(),
        site_name: selectedSiteIds,
      };

      const res = await goaAdminService.storeAMCAssign(payload);

      if (res?.already_assigned_sites && Array.isArray(res.already_assigned_sites) && res.already_assigned_sites.length > 0) {
        setAlreadyAssignedSites(res.already_assigned_sites);
      }

      const msg = res?.message || `${selectedSiteIds.length} Goa SRT AMC site(s) successfully assigned!`;
      setSuccessMsg(msg);

      // Refresh recent assignments table
      goaAdminService.getAMCAssignFormData().then((fresh) => {
        if (fresh?.srts) setRecentSrts(fresh.srts);
      }).catch(() => {});

      setSelectedSiteIds([]);

      setTimeout(() => {
        navigate('/vendor-management/goa/srt/amc/view-assign');
      }, 1500);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to assign AMC sites.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ax-page swp-inst-form">
      <style>{SINGLE_CARD_FORM_CSS}</style>

      {/* Page Head */}
      <PageHead
        title="Goa Assign SRT AMC"
        subtitle="The field labels marked with * are required input fields."
        breadcrumbs={[
          { label: 'ERP Dashboard', href: '/' },
          { label: 'Vendor Management', href: '/vendor-management' },
          { label: 'Goa' },
          { label: 'AMC' },
          { label: 'SRT' },
          { label: 'Assign SRT AMC' },
        ]}
        actions={
          <div style={{ display: 'inline-flex', gap: 'var(--ax-space-2)' }}>
            <Link
              to="/vendor-management/goa/srt/amc/view-assign"
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
                aria-hidden="true"
              >
                <path d="M10 12a2 2 0 1 0 4 0a2 2 0 0 0 -4 0" />
                <path d="M21 12c-2.4 4 -5.4 6 -9 6c-3.6 0 -6.6 -2 -9 -6c2.4 -4 5.4 -6 9 -6c3.6 0 6.6 2 9 6" />
              </svg>
              View Assigned AMC Sites
            </Link>
            <Link
              to="/vendor-management/goa/srt/amc/dashboard"
              className="ax-btn ax-btn--secondary ax-btn--sm"
            >
              Dashboard
            </Link>
          </div>
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
            gap: 12,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span>{errorMsg}</span>
          </div>
          <button
            type="button"
            onClick={() => setErrorMsg('')}
            style={{ background: 'none', border: 'none', color: '#b91c1c', cursor: 'pointer', padding: 4 }}
            aria-label="Dismiss error"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      )}

      {alreadyAssignedSites.length > 0 && (
        <div
          style={{
            padding: '12px 16px',
            background: '#fffbeb',
            border: '1px solid #fde68a',
            color: '#92400e',
            borderRadius: 8,
            marginBottom: 16,
            fontSize: 13,
          }}
        >
          <b>Notice:</b> Some sites were already assigned for this AMC round and were skipped:{' '}
          <span style={{ fontWeight: 600 }}>{alreadyAssignedSites.join(', ')}</span>
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
            gap: 12,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
            <span>{successMsg}</span>
          </div>
          <span style={{ fontSize: 12, opacity: 0.8 }}>Redirecting...</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="ax-card">
        {/* Header with Section Pills */}
        <div className="ax-card__header">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
            <div>
              <h2 className="ax-card__title" style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: 'var(--ax-text-strong, #0f172a)' }}>
                Assign Goa SRT AMC
              </h2>
              <p className="ax-card__subtitle" style={{ fontSize: '0.85rem', color: '#ef4444', margin: '4px 0 0' }}>
                The field labels marked with * are required input fields.
              </p>
            </div>
          </div>

          {/* Quick Nav Pills */}
          <div className="swp-section-pills">
            <button type="button" className="swp-section-pill-btn" onClick={() => scrollTo(sec1)}>
              <span className="pill-num">1</span> Vendor & AMC Cycle
            </button>
            <button type="button" className="swp-section-pill-btn" onClick={() => scrollTo(sec2)}>
              <span className="pill-num">2</span> State & District
            </button>
            <button type="button" className="swp-section-pill-btn" onClick={() => scrollTo(sec3)}>
              <span className="pill-num">3</span> Sites {selectedSiteIds.length > 0 ? `(${selectedSiteIds.length})` : ''}
            </button>
            <button type="button" className="swp-section-pill-btn" onClick={() => scrollTo(sec4)}>
              <span className="pill-num">4</span> Recent Assignments
            </button>
          </div>
        </div>

        <div className="ax-card__body">
          {/* Section 1: Vendor Name * & AMC Cycle * */}
          <div ref={sec1} className="swp-section-block">
            <div className="swp-section-header">
              <div className="swp-section-title-wrap">
                <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>
                  1. Vendor Name & AMC Cycle <span style={{ color: '#ef4444' }}>*</span>
                </h3>
                <span style={{ fontSize: '12px', color: 'var(--ax-text-muted, #64748b)' }}>
                  Select authorized empaneled contractor and target AMC round
                </span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
              {/* Vendor Select */}
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
                    <option key={v.id} value={String(v.id)}>
                      {v.name}
                    </option>
                  ))}
                </select>
                <label htmlFor="vendor_select" className="ax-float__label floating">
                  Vendor Name <span style={{ color: '#ef4444' }}>*</span>
                </label>
              </div>

              {/* AMC Cycle Select */}
              <div className="ax-float">
                <select
                  id="amc_select"
                  className="ax-float__input"
                  value={amcNumber}
                  onChange={(e) => setAmcNumber(e.target.value)}
                  disabled={loading}
                  required
                >
                  <option value="">-- Select AMC Cycle --</option>
                  <option value="1">1st AMC (Year 1)</option>
                  <option value="2">2nd AMC (Year 2)</option>
                  <option value="3">3rd AMC (Year 3)</option>
                  <option value="4">4th AMC (Year 4)</option>
                  <option value="5">5th AMC (Year 5)</option>
                </select>
                <label htmlFor="amc_select" className="ax-float__label floating">
                  AMC Cycle <span style={{ color: '#ef4444' }}>*</span>
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
                  3. Unassigned AMC Sites <span style={{ color: '#ef4444' }}>*</span>
                </h3>
                <span style={{ fontSize: '12px', color: 'var(--ax-text-muted, #64748b)' }}>
                  {district && amcNumber
                    ? `Select one or more unassigned sites in ${district} for AMC Round ${amcNumber}.`
                    : 'Please select both an AMC cycle and a district above to fetch available unassigned sites.'}
                </span>
              </div>
              {district && amcNumber && availableSites.length > 0 && (
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

            {/* State A: No district or AMC cycle selected */}
            {!district || !amcNumber ? (
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
                -- Select AMC Cycle and District to Load Sites --
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
                Fetching unassigned sites for <b>{district}</b> under <b>AMC {amcNumber}</b>...
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
                No unassigned sites available in <b>{district}</b> for <b>AMC {amcNumber}</b>. All sites may have already been assigned or completed.
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
                            {isSelected ? '[Selected] ' : ''}{s.site_name} (ID: {s.id})
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
                      placeholder="Search sites by ID or name..."
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
                            <span>Site ID: <b>{site.id}</b></span>
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
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                    <span>{selectedSiteIds.length} site(s) selected for assignment</span>
                  </div>
                )}
              </div>
            )}
          </div>

          <hr className="swp-section-divider" />

          {/* Section 4: Remarks & Recent Assignments */}
          <div ref={sec4} className="swp-section-block">
            <div className="swp-section-header">
              <div className="swp-section-title-wrap">
                <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>4. Remarks & Recent Assignments</h3>
                <span style={{ fontSize: '12px', color: 'var(--ax-text-muted, #64748b)' }}>
                  Optional AMC maintenance instructions and user assignment records
                </span>
              </div>
            </div>

            <div style={{ maxWidth: '480px', marginBottom: 20 }}>
              <FloatingInput
                label="Remarks"
                name="remarks"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                disabled={loading}
                placeholder="Optional maintenance instructions or scheduling notes"
              />
            </div>

            {/* Recent Assignments Table */}
            <div className="ax-table-wrap" style={{ overflowX: 'auto' }}>
              <table className="ax-table ax-table--hover" style={{ whiteSpace: 'nowrap', width: '100%' }}>
                <thead className="ax-table__head">
                  <tr className="ax-table__header-row">
                    <th className="ax-table__th ax-num">Sr. No.</th>
                    <th className="ax-table__th">AMC Round</th>
                    <th className="ax-table__th">Site ID</th>
                    <th className="ax-table__th">Site Name</th>
                    <th className="ax-table__th">Assigned Vendor</th>
                    <th className="ax-table__th">Assigned Time</th>
                    <th className="ax-table__th">State</th>
                  </tr>
                </thead>
                <tbody>
                  {recentSrts.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ textAlign: 'center', padding: '24px', color: '#64748b' }}>
                        No recent AMC assignment records found.
                      </td>
                    </tr>
                  ) : (
                    recentSrts.map((item, idx) => (
                      <tr key={item.id || idx} className="ax-table__row">
                        <td className="ax-table__td ax-num">{idx + 1}</td>
                        <td className="ax-table__td">
                          <span
                            className="ax-badge"
                            style={{
                              background: 'rgba(37, 99, 235, 0.1)',
                              color: '#2563eb',
                              fontWeight: 700,
                              padding: '2px 8px',
                              borderRadius: 4,
                            }}
                          >
                            AMC {item.amc}
                          </span>
                        </td>
                        <td className="ax-table__td">
                          <b style={{ fontFamily: 'monospace' }}>{item.site_id}</b>
                        </td>
                        <td className="ax-table__td" style={{ fontWeight: 600 }}>{item.site_name || `Site #${item.site_id}`}</td>
                        <td className="ax-table__td">
                          {vendorList.find((v) => v.id === item.amc_assigned_to)?.name ||
                            `Vendor #${item.amc_assigned_to}`}
                        </td>
                        <td className="ax-table__td" style={{ fontFamily: 'monospace', fontSize: 12 }}>{item.amc_assigned_time || '—'}</td>
                        <td className="ax-table__td" style={{ textTransform: 'capitalize' }}>
                          {item.state || 'Goa'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Submit Footer */}
          <div style={{ marginTop: '32px', paddingTop: '20px', borderTop: '1px solid var(--ax-border, #e2e8f0)', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '12px' }}>
            <Link to="/vendor-management/goa/srt/amc/view-assign" className="ax-btn ax-btn--secondary">
              Cancel
            </Link>
            <button
              type="submit"
              className="ax-btn ax-btn--primary"
              disabled={loading || !vendor || !amcNumber || !district || selectedSiteIds.length === 0}
              style={{ minWidth: 180, fontWeight: 700 }}
            >
              {loading ? (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                  <span className="ax-spinner" /> Assigning...
                </span>
              ) : (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  Assign ({selectedSiteIds.length}) Goa SRT AMC Sites
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                </span>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

export default GoaSRTAMCAssignSRT;
