/*
 * Assam SWP Install Site — Installation Site Entry.
 * Built only from template form components (ax-* classes, --ax-* tokens).
 * No custom colors or gradients.
 */
import { useEffect, useCallback, useState } from 'react';
import { Link } from 'react-router-dom';
import { PageHead } from '../../../../shell/PageHead';
import { SAMPLE_FARMERS } from '../../../../../data/demo/assamSwpData';
import {
  ASSAM_SWP_INSTALL_SITE_LIST_URL,
  ASSAM_SWP_INSTALL_SITE_STORE_URL,
} from '../../../V_Portal_APIS/Assam_API';
import { authService } from '../../../../../services/authService';

type ImgState = { file: File | null; preview: string };
const EMPTY_IMG: ImgState = { file: null, preview: '' };

const ICON = {
  check: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12l5 5l10 -10" /></svg>,
  cross: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M18 6l-12 12" /><path d="M6 6l12 12" /></svg>,
  plus: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 5l0 14" /><path d="M5 12l14 0" /></svg>,
  trash: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 7l16 0" /><path d="M10 11l0 6" /><path d="M14 11l0 6" /><path d="M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2 -2l1 -12" /><path d="M9 7v-3a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v3" /></svg>,
  upload: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2 -2v-2" /><path d="M7 9l5 -5l5 5" /><path d="M12 4l0 12" /></svg>,
  gps: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 12a3 3 0 1 0 6 0a3 3 0 1 0 -6 0" /><path d="M12 2l0 2" /><path d="M12 20l0 2" /><path d="M20 12l2 0" /><path d="M2 12l2 0" /></svg>,
};

/* Reusable image-upload field (same pattern as Elements → File Upload) */
function ImageField({ id, label, value, onPick }: { id: string; label: string; value: ImgState; onPick: (e: React.ChangeEvent<HTMLInputElement>) => void }) {
  return (
    <div className="ax-field">
      <label className="ax-label" htmlFor={id}>{label} <span className="ax-field__required" aria-hidden="true">*</span></label>
      <div className="ax-cluster" style={{ gap: 'var(--ax-space-3)' }}>
        <label className="ax-btn ax-btn--secondary" style={{ cursor: 'pointer' }}>
          <span className="ax-btn__icon">{ICON.upload}</span>
          <span className="ax-btn__label">Choose file</span>
          <input id={id} type="file" accept="image/*" required className="ax-visually-hidden" style={{ position: 'absolute', width: 1, height: 1, opacity: 0 }} onChange={onPick} />
        </label>
        <span style={{ fontSize: 'var(--ax-text-sm)', color: 'var(--ax-text-subtle)' }} className="ax-truncate">
          {value.file ? value.file.name : 'No file selected'}
        </span>
        {value.preview && (
          <img src={value.preview} alt="Preview" style={{ width: 32, height: 32, borderRadius: 'var(--ax-radius-sm)', objectFit: 'cover', border: '1px solid var(--ax-border)' }} />
        )}
      </div>
    </div>
  );
}

export function InstallationSite() {
  const [loading, setLoading] = useState(false);
  const [sites, setSites] = useState<any[]>([]);
  const [selectedFarmerId, setSelectedFarmerId] = useState('FARMER-001');
  const [selectedFarmer, setSelectedFarmer] = useState<any | null>(SAMPLE_FARMERS[0]);

  const [vendor, setVendor] = useState('ABC Vendor');
  const [inverterNo, setInverterNo] = useState('');
  const [vfdSerialNo, setVfdSerialNo] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [remarks, setRemarks] = useState('');
  const [moduleSerials, setModuleSerials] = useState<string[]>(['']);

  const [farmerModuleImg, setFarmerModuleImg] = useState<ImgState>(EMPTY_IMG);
  const [inverterVfdImg, setInverterVfdImg] = useState<ImgState>(EMPTY_IMG);
  const [runningWaterImg, setRunningWaterImg] = useState<ImgState>(EMPTY_IMG);

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // 4. Fetch installable sites list
  const loadInstallableSites = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const token = authService.getToken();
      const headers: Record<string, string> = { 'Accept': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(ASSAM_SWP_INSTALL_SITE_LIST_URL, {
        method: 'GET',
        headers,
      });

      if (res.ok) {
        const json = await res.json();
        const data = json?.data;
        if (data?.ven?.name) {
          setVendor(data.ven.name);
        }
        if (Array.isArray(data?.sites) && data.sites.length > 0) {
          const mapped = data.sites.map((s: any) => ({
            id: String(s.id),
            farmerName: s.farmer_name,
            fatherName: s.father_name,
            farmerContact: s.farmer_contact,
            customerNo: s.customer_no,
            district: s.district,
            tehsil: s.tehsil,
            block: s.block,
            village: s.village,
            pumpCapacity: s.pump_capacity,
            pumpType: s.pump_type,
            pumpSubType: s.pump_sub_type,
            state: s.state || 'Assam',
            sanctionedPumpHp: s.pump_capacity || '3HP',
          }));
          setSites(mapped);
          setSelectedFarmerId(mapped[0].id);
          setSelectedFarmer(mapped[0]);
        }
      }
    } catch (err) {
      console.warn('Failed to load installable sites:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInstallableSites();
  }, [loadInstallableSites]);

  const handleFarmerChange = (farmerId: string) => {
    setSelectedFarmerId(farmerId);
    setLoading(true);
    const pool = sites.length > 0 ? sites : SAMPLE_FARMERS;
    const found = pool.find((f: any) => String(f.id) === String(farmerId)) || null;
    setSelectedFarmer(found);
    setLoading(false);
  };

  const handleModuleChange = (index: number, val: string) =>
    setModuleSerials((prev) => prev.map((s, i) => (i === index ? val : s)));
  const handleAddModule = () => setModuleSerials((prev) => [...prev, '']);
  const handleRemoveModule = (index: number) =>
    setModuleSerials((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== index) : prev));

  const handleGetLocation = () => {
    const fallback = () => { setLatitude('26.144512'); setLongitude('91.736230'); };
    if (!navigator.geolocation) return fallback();
    navigator.geolocation.getCurrentPosition(
      (pos) => { setLatitude(pos.coords.latitude.toFixed(6)); setLongitude(pos.coords.longitude.toFixed(6)); },
      fallback,
    );
  };

  const handleImagePick = (e: React.ChangeEvent<HTMLInputElement>, setter: React.Dispatch<React.SetStateAction<ImgState>>) => {
    const file = e.target.files?.[0];
    if (file) setter({ file, preview: URL.createObjectURL(file) });
  };

  // 5. Store / Submit Installation Site
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!selectedFarmerId) {
      setErrorMsg('Please select a farmer site.');
      return;
    }

    if (!farmerModuleImg.file || !inverterVfdImg.file || !runningWaterImg.file) {
      setErrorMsg('All three photos (Farmer with Module, Inverter/VFD, and Running Water) are required.');
      return;
    }

    const filledSerials = moduleSerials.filter((s) => s.trim().length > 0);
    if (filledSerials.length === 0) {
      setErrorMsg('Please provide at least one solar module serial number.');
      return;
    }

    // Check for duplicate serials in form
    const uniqueSerials = new Set(filledSerials.map((s) => s.trim().toLowerCase()));
    if (uniqueSerials.size !== filledSerials.length) {
      setErrorMsg('Duplicate Module Serial Numbers found in your input. Each serial must be unique.');
      return;
    }

    setSubmitting(true);
    try {
      const token = authService.getToken();
      const headers: Record<string, string> = { 'Accept': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const fd = new FormData();
      fd.append('site_id', String(selectedFarmer?.id || selectedFarmerId));
      fd.append('inverter_no', inverterNo.trim());
      fd.append('vfd_no', vfdSerialNo.trim());
      filledSerials.forEach((sn, idx) => {
        fd.append(`module_serial_no[${idx}]`, sn.trim());
      });
      fd.append('module_image', farmerModuleImg.file);
      fd.append('inverter_vfd_image', inverterVfdImg.file);
      fd.append('running_water_image', runningWaterImg.file);
      fd.append('inst_latitude', latitude.trim());
      fd.append('inst_longitude', longitude.trim());
      if (remarks.trim()) fd.append('inst_remarks', remarks.trim());

      const res = await fetch(ASSAM_SWP_INSTALL_SITE_STORE_URL, {
        method: 'POST',
        headers,
        body: fd,
      });

      const json = await res.json().catch(() => null);

      if (res.ok && (json?.status === true || json?.success === true)) {
        setSuccessMsg(json?.message || 'Site Install Successfully!!!');
        handleCancel();
        loadInstallableSites();
      } else {
        let msg = json?.message || 'Error occurred while installing site';
        if (json?.errors) {
          const firstErr = Object.values(json.errors)[0];
          if (Array.isArray(firstErr) && firstErr[0]) {
            msg = firstErr[0] as string;
          }
        }
        setErrorMsg(msg);
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Network error occurred while submitting installation site');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    setInverterNo(''); setVfdSerialNo(''); setLatitude(''); setLongitude(''); setRemarks('');
    setModuleSerials(['']);
    setFarmerModuleImg(EMPTY_IMG); setInverterVfdImg(EMPTY_IMG); setRunningWaterImg(EMPTY_IMG);
  };

  const infoRows: [string, string | undefined][] = selectedFarmer ? [
    ['State', selectedFarmer.state],
    ['District', selectedFarmer.district],
    ['Tehsil / Block', `${selectedFarmer.tehsil || ''} ${selectedFarmer.block ? `/ ${selectedFarmer.block}` : ''}`.trim() || undefined],
    ['Village', selectedFarmer.village],
    ['Farmer Name', selectedFarmer.farmerName],
    ['Father Name', selectedFarmer.fatherName],
    ['Pump Capacity', selectedFarmer.pumpCapacity || selectedFarmer.sanctionedPumpHp],
    ['Pump Type', `${selectedFarmer.pumpType || ''} ${selectedFarmer.pumpSubType ? `(${selectedFarmer.pumpSubType})` : ''}`.trim() || undefined],
    ['Farmer Contact', selectedFarmer.farmerContact],
  ] : [];

  return (
    <>
      <PageHead
        title="Assam SWP Install Site"
        subtitle="Installation Site Entry"
        actions={
          <Link className="ax-btn ax-btn--secondary ax-btn--pill" to="/assam/swp/view-installation">
            <span className="ax-btn__label">View Installations</span>
          </Link>
        }
      />

      {successMsg && (
        <div className="ax-alert ax-alert--success ax-alert--inline" role="status" style={{ margin: 'var(--ax-space-3) var(--ax-space-4)' }}>
          <span className="ax-alert__icon">{ICON.check}</span>
          <div className="ax-alert__content"><p className="ax-alert__message">{successMsg}</p></div>
        </div>
      )}

      {errorMsg && (
        <div className="ax-alert ax-alert--danger ax-alert--inline" role="alert" style={{ margin: 'var(--ax-space-3) var(--ax-space-4)' }}>
          <span className="ax-alert__icon">{ICON.cross}</span>
          <div className="ax-alert__content"><p className="ax-alert__message">{errorMsg}</p></div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="ax-dash-grid">
        {/* SELECT FARMER + INFORMATION */}
        <section className="ax-card ax-col--12" role="region" aria-label="Site information">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <span className="ax-card__eyebrow">Step 1</span>
              <h2 className="ax-card__title">Site Information</h2>
              <p className="ax-card__subtitle">Pick a farmer to load the site details.</p>
            </div>
          </div>
          <div className="ax-card__body" style={{ paddingTop: 0, display: 'flex', flexDirection: 'column', gap: 'var(--ax-space-5)' }}>
            <div className="ax-field" style={{ maxWidth: 450 }}>
              <label className="ax-label" htmlFor="farmer-select">
                Select Assigned Site {sites.length > 0 ? `(${sites.length} Available)` : ''}
              </label>
              <select id="farmer-select" className="ax-select" value={selectedFarmerId} onChange={(e) => handleFarmerChange(e.target.value)}>
                <option value="">-- Choose Assigned Site / Farmer --</option>
                {(sites.length > 0 ? sites : SAMPLE_FARMERS).map((f: any) => (
                  <option key={f.id} value={f.id}>
                    #{f.id} · {f.farmerName} — {f.district || 'Assam'} {f.pumpCapacity ? `(${f.pumpCapacity})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <hr className="ax-divider" style={{ margin: 0 }} />

            {loading ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 'var(--ax-space-4)' }}>
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--ax-space-2)' }}>
                    <div className="ax-skeleton ax-skeleton--line" style={{ width: 60, height: 12 }} />
                    <div className="ax-skeleton ax-skeleton--line" style={{ width: 140, height: 16 }} />
                  </div>
                ))}
              </div>
            ) : selectedFarmer ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 'var(--ax-space-4)' }}>
                {infoRows.map(([k, v]) => (
                  <div key={k} style={{ padding: 'var(--ax-space-3) var(--ax-space-4)', background: 'var(--ax-surface-subtle)', border: '1px solid var(--ax-border)', borderRadius: 'var(--ax-radius-md)' }}>
                    <div style={{ fontSize: 'var(--ax-text-2xs)', textTransform: 'uppercase', letterSpacing: '.06em', color: 'var(--ax-text-subtle)' }}>{k}</div>
                    <div style={{ marginTop: 4, color: 'var(--ax-text-strong)', fontSize: 'var(--ax-text-sm)', fontWeight: 500 }}>{v || '—'}</div>
                  </div>
                ))}
              </div>
            ) : (
              <span className="ax-help">Please select a farmer above to populate site information.</span>
            )}
          </div>
        </section>

        {/* INSTALLATION DETAILS */}
        <section className="ax-card ax-col--6" role="region" aria-label="Installation details">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <span className="ax-card__eyebrow">Step 2</span>
              <h2 className="ax-card__title">Installation Details</h2>
              <p className="ax-card__subtitle">Vendor, equipment numbers and location.</p>
            </div>
          </div>
          <div className="ax-card__body" style={{ paddingTop: 0, display: 'flex', flexDirection: 'column', gap: 'var(--ax-space-5)' }}>
            <div className="ax-field">
              <label className="ax-label" htmlFor="vendor">Vendor <span className="ax-field__required" aria-hidden="true">*</span></label>
              <input id="vendor" type="text" className="ax-input" value={vendor} onChange={(e) => setVendor(e.target.value)} placeholder="Vendor Name" required />
            </div>
            <div className="ax-field">
              <label className="ax-label" htmlFor="inverterNo">Inverter No. <span className="ax-field__required" aria-hidden="true">*</span></label>
              <input id="inverterNo" type="text" className="ax-input ax-mono" value={inverterNo} onChange={(e) => setInverterNo(e.target.value)} placeholder="Enter Inverter Number" required />
            </div>
            <div className="ax-field">
              <label className="ax-label" htmlFor="vfdSerialNo">VFD Serial No. <span className="ax-field__required" aria-hidden="true">*</span></label>
              <input id="vfdSerialNo" type="text" className="ax-input ax-mono" value={vfdSerialNo} onChange={(e) => setVfdSerialNo(e.target.value)} placeholder="Enter VFD Number" required />
            </div>
            <div className="ax-field">
              <div className="ax-cluster" style={{ justifyContent: 'space-between' }}>
                <label className="ax-label" htmlFor="latitude">Latitude</label>
                <button type="button" className="ax-btn ax-btn--ghost ax-btn--sm" onClick={handleGetLocation}>
                  <span className="ax-btn__icon">{ICON.gps}</span>
                  <span className="ax-btn__label">Auto GPS</span>
                </button>
              </div>
              <input id="latitude" type="text" inputMode="decimal" className="ax-input ax-mono" value={latitude} onChange={(e) => setLatitude(e.target.value)} placeholder="e.g. 26.1445" />
            </div>
            <div className="ax-field">
              <label className="ax-label" htmlFor="longitude">Longitude</label>
              <input id="longitude" type="text" inputMode="decimal" className="ax-input ax-mono" value={longitude} onChange={(e) => setLongitude(e.target.value)} placeholder="e.g. 91.7362" />
            </div>
            <div className="ax-field">
              <label className="ax-label" htmlFor="remarks">Installation Remarks</label>
              <input id="remarks" type="text" className="ax-input" value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="e.g. Installed OK, pump operational" />
            </div>
          </div>
        </section>

        {/* PHOTOS */}
        <section className="ax-card ax-col--6" role="region" aria-label="Installation photos">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <span className="ax-card__eyebrow">Step 3</span>
              <h2 className="ax-card__title">Site Photos</h2>
              <p className="ax-card__subtitle">All three photos are required.</p>
            </div>
          </div>
          <div className="ax-card__body" style={{ paddingTop: 0, display: 'flex', flexDirection: 'column', gap: 'var(--ax-space-5)' }}>
            <ImageField id="img-module" label="Farmer With Module Image" value={farmerModuleImg} onPick={(e) => handleImagePick(e, setFarmerModuleImg)} />
            <ImageField id="img-inverter" label="Inverter and VFD with Farmer Image" value={inverterVfdImg} onPick={(e) => handleImagePick(e, setInverterVfdImg)} />
            <ImageField id="img-water" label="Running Water With Farmer Image" value={runningWaterImg} onPick={(e) => handleImagePick(e, setRunningWaterImg)} />
          </div>
        </section>

        {/* MODULE SERIALS + ACTIONS */}
        <section className="ax-card ax-col--12" role="region" aria-label="Module serial numbers">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <span className="ax-card__eyebrow">Step 4</span>
              <h2 className="ax-card__title">Module Serial Numbers</h2>
              <p className="ax-card__subtitle">Add one row per solar module.</p>
            </div>
            <div className="ax-card__actions">
              <span className="ax-num" style={{ fontFamily: 'var(--ax-font-mono)', fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-subtle)' }}>
                {moduleSerials.length} {moduleSerials.length === 1 ? 'module' : 'modules'}
              </span>
            </div>
          </div>
          <div className="ax-card__body" style={{ paddingTop: 0, display: 'flex', flexDirection: 'column', gap: 'var(--ax-space-3)', maxWidth: 600 }}>
            {moduleSerials.map((ser, index) => (
              <div key={index} className="ax-cluster" style={{ gap: 'var(--ax-space-2)', flexWrap: 'nowrap' }}>
                <input
                  type="text"
                  className="ax-input ax-mono"
                  style={{ flex: '1 1 auto' }}
                  placeholder={`Enter Module Serial No. ${index + 1}`}
                  aria-label={`Module serial number ${index + 1}`}
                  value={ser}
                  onChange={(e) => handleModuleChange(index, e.target.value)}
                />
                {moduleSerials.length > 1 && (
                  <button type="button" className="ax-btn ax-btn--ghost ax-btn--icon" onClick={() => handleRemoveModule(index)} aria-label={`Remove module ${index + 1}`}>
                    <span className="ax-btn__icon">{ICON.trash}</span>
                  </button>
                )}
                {index === moduleSerials.length - 1 && (
                  <button type="button" className="ax-btn ax-btn--secondary ax-btn--icon" onClick={handleAddModule} aria-label="Add another module serial">
                    <span className="ax-btn__icon">{ICON.plus}</span>
                  </button>
                )}
              </div>
            ))}
          </div>
          <div className="ax-card__footer" style={{ justifyContent: 'flex-end', gap: 'var(--ax-space-3)' }}>
            <button type="button" className="ax-btn ax-btn--ghost" onClick={handleCancel}>
              <span className="ax-btn__icon">{ICON.cross}</span>
              <span className="ax-btn__label">Cancel</span>
            </button>
            <button type="submit" className="ax-btn ax-btn--primary" disabled={submitting} aria-busy={submitting}>
              <span className="ax-btn__icon">{ICON.check}</span>
              <span className="ax-btn__label">{submitting ? 'Submitting…' : 'Submit'}</span>
            </button>
          </div>
        </section>
      </form>
    </>
  );
}

export default InstallationSite;