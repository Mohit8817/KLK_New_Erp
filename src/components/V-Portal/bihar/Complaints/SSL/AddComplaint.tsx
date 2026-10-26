import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PageHead } from '../../../../shell/PageHead';
import { biharComplaintService, type SslPoleDataResponse } from '../../bihar-services';

const SECTIONS = [
  { id: 'sec-location', num: '1', title: 'Location Hierarchy' },
  { id: 'sec-system', num: '2', title: 'Street Light Details' },
  { id: 'sec-grievance', num: '3', title: 'Breakdown Grievance' },
  { id: 'sec-documents', num: '4', title: 'Upload Defect Photo' },
];

const ISSUE_OPTIONS: Option[] = [
  { value: 'Light not working', label: 'Light not working / LED Off' },
  { value: 'Luminaire Failure', label: 'Luminaire Failure' },
  { value: 'Battery Low Backup', label: 'Battery Low Backup' },
  { value: 'Solar Module Damaged', label: 'Solar Module Damaged' },
  { value: 'Pole Damaged / Tilted', label: 'Pole Damaged or Tilted' },
  { value: 'Other', label: 'Other Technical Grievance' },
];

const SOURCE_OPTIONS: Option[] = [
  { value: 'Phone', label: 'Phone / Consumer Toll-Free' },
  { value: 'BREDA Portal', label: 'BREDA Portal Inspection' },
  { value: 'Mobile App', label: 'Vendor Mobile App' },
  { value: 'Field Survey', label: 'Routine Field Survey' },
  { value: 'Letter', label: 'Panchayat Letter' },
];

export function Bihar_Complaint_SSL_AddComplaint() {
  const navigate = useNavigate();

  // Cascade dropdown states (API 1 to 5)
  const [districts, setDistricts] = useState<string[]>([]);
  const [blocks, setBlocks] = useState<string[]>([]);
  const [panchayats, setPanchayats] = useState<string[]>([]);
  const [wards, setWards] = useState<string[]>([]);
  const [poles, setPoles] = useState<string[]>([]);

  // Loading states
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [loadingBlocks, setLoadingBlocks] = useState(false);
  const [loadingPanchayats, setLoadingPanchayats] = useState(false);
  const [loadingWards, setLoadingWards] = useState(false);
  const [loadingPoles, setLoadingPoles] = useState(false);
  const [loadingPoleData, setLoadingPoleData] = useState(false);

  // Form State (Exact SSL Store fields from API documentation)
  const [formData, setFormData] = useState({
    uid: `BR-SSL-${Math.floor(1000 + Math.random() * 9000)}`,
    complaint_id: String(Math.floor(100000 + Math.random() * 900000)),
    district: '',
    block: '',
    panchyat: '',
    ward_no: '',
    pole_no: '',
    light_no: '',
    phase: '1',
    beneficiary_name: '',
    contact_no: '',
    latitude: '',
    longitude: '',
    complaint_source: 'Phone',
    complaint_issue: 'Light not working',
    luminary_no: '',
    sim_no: '',
    battery_serial_no: '',
    module_no: '',
    date_of_installation: '',
    complaint: '',
    complaint_date: new Date().toISOString().split('T')[0],
    sms: 'Yes',
    mobile: '',
  });

  const [file, setFile] = useState<File | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // 1. Load Districts: GET /bihar/ssl/complaint/add
  useEffect(() => {
    (async () => {
      setLoadingDistricts(true);
      try {
        const list = await biharComplaintService.getSslDistricts();
        setDistricts(list);
      } catch (err) {
        console.error('Error fetching districts:', err);
      } finally {
        setLoadingDistricts(false);
      }
    })();
  }, []);

  // 2. District change -> GET /bihar/ssl/complaint/getblocks?district=...
  const handleDistrictChange = async (district: string) => {
    setFormData((prev) => ({
      ...prev,
      district,
      block: '',
      panchyat: '',
      ward_no: '',
      pole_no: '',
      light_no: '',
      beneficiary_name: '',
      contact_no: '',
    }));
    setBlocks([]);
    setPanchayats([]);
    setWards([]);
    setPoles([]);
    clearError('district');
    if (!district) return;

    setLoadingBlocks(true);
    try {
      const list = await biharComplaintService.getSslBlocks(district);
      setBlocks(list);
    } catch (err) {
      console.error('Error fetching blocks:', err);
    } finally {
      setLoadingBlocks(false);
    }
  };

  // 3. Block change -> GET /bihar/ssl/complaint/getpanchyats?district=...&block=...
  const handleBlockChange = async (block: string) => {
    setFormData((prev) => ({
      ...prev,
      block,
      panchyat: '',
      ward_no: '',
      pole_no: '',
      light_no: '',
      beneficiary_name: '',
      contact_no: '',
    }));
    setPanchayats([]);
    setWards([]);
    setPoles([]);
    clearError('block');
    if (!block || !formData.district) return;

    setLoadingPanchayats(true);
    try {
      const list = await biharComplaintService.getSslPanchayats(formData.district, block);
      setPanchayats(list);
    } catch (err) {
      console.error('Error fetching panchayats:', err);
    } finally {
      setLoadingPanchayats(false);
    }
  };

  // 4. Panchayat change -> GET /bihar/ssl/complaint/getwards?district=...&block=...&panchyat=...
  const handlePanchayatChange = async (panchyat: string) => {
    setFormData((prev) => ({
      ...prev,
      panchyat,
      ward_no: '',
      pole_no: '',
      light_no: '',
      beneficiary_name: '',
      contact_no: '',
    }));
    setWards([]);
    setPoles([]);
    clearError('panchyat');
    if (!panchyat || !formData.district || !formData.block) return;

    setLoadingWards(true);
    try {
      const list = await biharComplaintService.getSslWards(formData.district, formData.block, panchyat);
      setWards(list);
    } catch (err) {
      console.error('Error fetching wards:', err);
    } finally {
      setLoadingWards(false);
    }
  };

  // 5. Ward change -> GET /bihar/ssl/complaint/getpoles?district=...&block=...&panchyat=...&ward_no=...
  const handleWardChange = async (ward_no: string) => {
    setFormData((prev) => ({
      ...prev,
      ward_no,
      pole_no: '',
      light_no: '',
      beneficiary_name: '',
      contact_no: '',
    }));
    setPoles([]);
    clearError('ward_no');
    if (!ward_no || !formData.district || !formData.block || !formData.panchyat) return;

    setLoadingPoles(true);
    try {
      const list = await biharComplaintService.getSslPoles(
        formData.district,
        formData.block,
        formData.panchyat,
        ward_no
      );
      setPoles(list);
    } catch (err) {
      console.error('Error fetching poles:', err);
    } finally {
      setLoadingPoles(false);
    }
  };

  // 6. Pole change -> Auto-fill GET /bihar/ssl/complaint/getpoledatas?...
  const handlePoleChange = async (pole_no: string) => {
    setFormData((prev) => ({ ...prev, pole_no }));
    clearError('pole_no');
    if (!pole_no || !formData.district || !formData.block || !formData.panchyat || !formData.ward_no) return;

    setLoadingPoleData(true);
    try {
      const poleData: SslPoleDataResponse | null = await biharComplaintService.getSslPoleData(
        formData.district,
        formData.block,
        formData.panchyat,
        formData.ward_no,
        pole_no
      );

      if (poleData) {
        setFormData((prev) => ({
          ...prev,
          beneficiary_name: poleData.beneficiary_name || prev.beneficiary_name,
          contact_no: poleData.contact_no || prev.contact_no,
          latitude: String(poleData.latitude || prev.latitude || '25.5941'),
          longitude: String(poleData.longitude || prev.longitude || '85.1376'),
          luminary_no: poleData.luminary_no || prev.luminary_no,
          sim_no: poleData.sim_no || prev.sim_no,
          light_no: poleData.light_no || prev.light_no,
          battery_serial_no: poleData.battery_serial_no || prev.battery_serial_no,
          module_no: poleData.module_no || prev.module_no,
          date_of_installation: poleData.date_of_installation || prev.date_of_installation || '2025-12-10',
        }));
      }
    } catch (err) {
      console.error('Error fetching pole data:', err);
    } finally {
      setLoadingPoleData(false);
    }
  };

  const clearError = (name: string) => {
    setErrors((prev) => {
      if (!prev[name]) return prev;
      const next = { ...prev };
      delete next[name];
      return next;
    });
  };

  const setField = (name: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    clearError(name);
  };

  // Shortcut props for floating fields
  const f = (name: keyof typeof formData) => ({
    value: formData[name],
    onChange: (v: string) => setField(name, v),
    error: errors[name],
  });

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.district) newErrors.district = 'District is required.';
    if (!formData.block) newErrors.block = 'Block is required.';
    if (!formData.panchyat) newErrors.panchyat = 'Panchayat is required.';
    if (!formData.ward_no) newErrors.ward_no = 'Ward No is required.';
    if (!formData.pole_no) newErrors.pole_no = 'Pole No is required.';
    if (!formData.beneficiary_name) newErrors.beneficiary_name = 'Beneficiary Name is required.';
    if (!formData.contact_no || !/^\d{10}$/.test(formData.contact_no.trim())) {
      newErrors.contact_no = 'Contact number must be exactly 10 digits.';
    }
    if (!formData.complaint.trim()) newErrors.complaint = 'Please describe the breakdown complaint.';
    if (!file) newErrors.file = 'Defect / Street Light Photo (file) is required.';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!validate()) {
      setErrorMsg('Please resolve all validation errors before submitting.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('complaint_id', formData.complaint_id);
      fd.append('uid', formData.uid);
      fd.append('district', formData.district);
      fd.append('block', formData.block);
      fd.append('panchyat', formData.panchyat);
      fd.append('phase', formData.phase);
      fd.append('ward_no', formData.ward_no);
      fd.append('pole_no', formData.pole_no);
      fd.append('light_no', formData.light_no || 'L1');
      fd.append('beneficiary_name', formData.beneficiary_name);
      fd.append('contact_no', formData.contact_no);
      fd.append('latitude', formData.latitude || '25.5941');
      fd.append('longitude', formData.longitude || '85.1376');
      fd.append('complaint_source', formData.complaint_source);
      fd.append('complaint_issue', formData.complaint_issue);
      fd.append('luminary_no', formData.luminary_no || 'LUM-1');
      fd.append('sim_no', formData.sim_no || 'SIM-1');
      fd.append('battery_serial_no', formData.battery_serial_no || 'BAT-1');
      fd.append('module_no', formData.module_no || 'MOD-1');
      fd.append('date_of_installation', formData.date_of_installation || '2025-12-10');
      fd.append('complaint', formData.complaint);
      fd.append('complaint_date', formData.complaint_date);
      fd.append('sms', formData.sms);

      if (formData.mobile) {
        fd.append('mobile', formData.mobile);
      }

      if (file) {
        fd.append('file', file);
      }

      const resp = await biharComplaintService.storeSslComplaint(fd);

      if (resp.success) {
        setSuccessMsg(resp.message || 'SSL Complaint registered successfully!');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        setTimeout(() => {
          navigate('/v/complaint/bihar/ssl-view-complaint');
        }, 1500);
      } else {
        setErrorMsg(resp.message || 'Failed to submit complaint. Please check your data.');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch (err: any) {
      console.error('Submission error:', err);
      setErrorMsg(err?.message || 'Server error while submitting complaint.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setSubmitting(false);
    }
  };

  const T = SECTIONS.length;

  return (
    <div className="bihar-single-card-form">
      <style>{SINGLE_CARD_FORM_CSS}</style>

      <PageHead
        title="Register SSL Complaint"
        subtitle={
          <span style={{ fontSize: 'var(--ax-text-sm)', color: 'var(--ax-text-muted)' }}>
            Log street light breakdown issues, luminary not glowing, damaged pole, or theft ticket
          </span>
        }
        breadcrumbs={[
          { label: 'Home', href: '/v-dashboard' },
          { label: 'Bihar' },
          { label: 'Complaints' },
          { label: 'SSL', href: '/v/complaint/bihar/ssl-view-complaint' },
          { label: 'Add Complaint' },
        ]}
        actions={
          <Link to="/v/complaint/bihar/ssl-view-complaint" className="ax-btn ax-btn--secondary ax-btn--pill">
            <svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12l14 0" /><path d="M5 12l6 6" /><path d="M5 12l6 -6" /></svg>
            <span className="ax-btn__label">Complaint List</span>
          </Link>
        }
      />

      {successMsg && (
        <div className="ax-alert ax-alert--success" role="status" style={{ marginBottom: 'var(--ax-space-6)' }}>
          <span className="ax-alert__icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l5 5l10 -10" /></svg>
          </span>
          <div className="ax-alert__content">
            <h3 className="ax-alert__title" style={{ fontSize: 'var(--ax-text-base)', fontWeight: 600 }}>{successMsg}</h3>
          </div>
        </div>
      )}

      {errorMsg && (
        <div className="ax-alert ax-alert--danger" role="alert" style={{ marginBottom: 'var(--ax-space-6)' }}>
          <span className="ax-alert__icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M12 9v4" /><path d="M10.363 3.591l-8.106 13.534a1.914 1.914 0 0 0 1.636 2.871h16.214a1.914 1.914 0 0 0 1.636 -2.87l-8.106 -13.536a1.914 1.914 0 0 0 -3.274 0" /><path d="M12 16h.01" /></svg>
          </span>
          <div className="ax-alert__content">
            <h4 className="ax-alert__title" style={{ fontWeight: 600 }}>{errorMsg}</h4>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate>
        <div className="ax-card">
          <div className="ax-card__header">
            <div>
              <h2 className="ax-card__title" style={{ margin: 0 }}>Solar Street Light (SSL) Grievance Registration</h2>
              <p className="ax-card__subtitle" style={{ margin: '4px 0 0' }}>
                Select District ➔ Block ➔ Panchayat ➔ Ward ➔ Pole to auto-populate light parameters.
              </p>
            </div>

            <div className="bihar-section-pills" role="navigation" aria-label="Jump to section">
              {SECTIONS.map((s) => (
                <button key={s.id} type="button" onClick={() => scrollToSection(s.id)} className="bihar-section-pill-btn">
                  <span className="pill-num">{s.num}</span>
                  <span>{s.title}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="ax-card__body">
            {/* Section 1 */}
            <div id="sec-location" className="bihar-section-block">
              <SectionHeader num="1" total={T} title="Location & Pole Selection" desc="Select District, Block, Panchayat, Ward, and Pole No." />
              <div className="bihar-form-grid bihar-form-grid--3col">
                <FloatingSelect
                  id="cs-district"
                  label="District"
                  required
                  placeholder={loadingDistricts ? 'Loading districts...' : '-- Select District --'}
                  value={formData.district}
                  options={opts(districts)}
                  disabled={loadingDistricts}
                  onChange={handleDistrictChange}
                  error={errors.district}
                />
                <FloatingSelect
                  id="cs-block"
                  label="Block"
                  required
                  placeholder={!formData.district ? 'Select District First' : loadingBlocks ? 'Loading blocks...' : '-- Select Block --'}
                  value={formData.block}
                  options={opts(blocks)}
                  disabled={!formData.district || loadingBlocks}
                  onChange={handleBlockChange}
                  error={errors.block}
                />
                <FloatingSelect
                  id="cs-panchayat"
                  label="Panchayat"
                  required
                  placeholder={!formData.block ? 'Select Block First' : loadingPanchayats ? 'Loading panchayats...' : '-- Select Panchayat --'}
                  value={formData.panchyat}
                  options={opts(panchayats)}
                  disabled={!formData.block || loadingPanchayats}
                  onChange={handlePanchayatChange}
                  error={errors.panchyat}
                />
                <FloatingSelect
                  id="cs-ward"
                  label="Ward No"
                  required
                  placeholder={!formData.panchyat ? 'Select Panchayat First' : loadingWards ? 'Loading wards...' : '-- Select Ward No --'}
                  value={formData.ward_no}
                  options={wards.map((w) => ({ value: w, label: `Ward ${w}` }))}
                  disabled={!formData.panchyat || loadingWards}
                  onChange={handleWardChange}
                  error={errors.ward_no}
                />
                <FloatingSelect
                  id="cs-pole"
                  label="Pole No"
                  required
                  placeholder={!formData.ward_no ? 'Select Ward First' : loadingPoles ? 'Loading poles...' : '-- Select Pole No --'}
                  value={formData.pole_no}
                  options={opts(poles)}
                  disabled={!formData.ward_no || loadingPoles}
                  onChange={handlePoleChange}
                  error={errors.pole_no}
                />
                <FloatingSelect
                  id="cs-phase"
                  label="Phase"
                  options={[{ value: '1', label: '1 (Single Phase)' }, { value: '3', label: '3 (3 Phase)' }]}
                  {...f('phase')}
                />
                {/* <FloatingInput id="cs-uid" label="System UID" readOnly value={formData.uid} />
                <FloatingInput id="cs-cid" label="Complaint Ref ID" readOnly value={formData.complaint_id} /> */}
              </div>
            </div>

            <hr className="bihar-section-divider" />

            {/* Section 2 */}
            <div id="sec-system" className="bihar-section-block">
              <SectionHeader
                num="2"
                total={T}
                title="Beneficiary & Street Light Hardware Details"
                desc={loadingPoleData ? 'Fetching pole parameters from BREDA database...' : 'Beneficiary contact, light ID, hardware serial numbers, and GPS coordinates.'}
              />
              <div className="bihar-form-grid bihar-form-grid--3col">
                <FloatingInput id="cs-ben" label="Beneficiary Name" required placeholder="e.g. Ramesh" {...f('beneficiary_name')} />
                <FloatingInput id="cs-contact" label="Contact No (10 Digits)" type="tel" required maxLength={10} placeholder="e.g. 9876543210" {...f('contact_no')} />
                <FloatingInput id="cs-light" label="Light No" placeholder="e.g. L45" {...f('light_no')} />
                <FloatingInput id="cs-doi" label="Date of Installation" type="date" {...f('date_of_installation')} />
                <FloatingInput id="cs-luminary" label="Luminary No" placeholder="e.g. LUM123" {...f('luminary_no')} />
                <FloatingInput id="cs-battery" label="Battery Serial No" placeholder="e.g. BAT123" {...f('battery_serial_no')} />
                <FloatingInput id="cs-module" label="Module No" placeholder="e.g. MOD123" {...f('module_no')} />
                <FloatingInput id="cs-sim" label="SIM No" placeholder="e.g. SIM123" {...f('sim_no')} />
                <div />
                <FloatingInput id="cs-lat" label="Latitude" placeholder="25.5941" {...f('latitude')} />
                <FloatingInput id="cs-lng" label="Longitude" placeholder="85.1376" {...f('longitude')} />
              </div>
            </div>

            <hr className="bihar-section-divider" />

            {/* Section 3 */}
            <div id="sec-grievance" className="bihar-section-block">
              <SectionHeader num="3" total={T} title="Breakdown & Issue Details" desc="Classify the malfunction type and describe the specific breakdown reason." />
              <div className="bihar-form-grid bihar-form-grid--3col">
                <FloatingSelect id="cs-issue" label="Complaint Issue Category" options={ISSUE_OPTIONS} {...f('complaint_issue')} />
                <FloatingSelect id="cs-source" label="Complaint Source" options={SOURCE_OPTIONS} {...f('complaint_source')} />
                <FloatingSelect id="cs-sms" label="Send SMS / WhatsApp Notification?" options={[{ value: 'Yes', label: 'Yes (Notify)' }, { value: 'No', label: 'No' }]} {...f('sms')} />
                <div className="bihar-form-col-span-full">
                  <FloatingTextarea
                    id="cs-complaint"
                    label={`Detailed Complaint Description (${formData.complaint.length}/2000)`}
                    required
                    maxLength={2000}
                    placeholder="Explain the breakdown observation in detail (e.g. Light off since 3 days, luminary indicator off, battery backup zero)..."
                    {...f('complaint')}
                  />
                </div>
              </div>
            </div>

            <hr className="bihar-section-divider" />

            {/* Section 4 */}
            <div id="sec-documents" className="bihar-section-block">
              <SectionHeader num="4" total={T} title="Upload Breakdown / Defect Photo" desc="Attach site photograph showing non-glowing luminaire or defective pole." />
              <div className="bihar-form-grid bihar-form-grid--3col">
                <FloatingFileInput
                  id="file"
                  label="Breakdown / Street Light Photo (File)"
                  required
                  file={file}
                  onChange={(x) => {
                    setFile(x);
                    clearError('file');
                  }}
                  error={errors.file}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Sticky Action Footer */}
        <div className="bihar-form-sticky-bar">
          <span className="ax-badge ax-badge--soft ax-badge--primary ax-badge--pill">New Complaint</span>
          <div className="ax-cluster" style={{ gap: 'var(--ax-space-3)' }}>
            <button type="button" className="ax-btn ax-btn--secondary" onClick={() => navigate('/v/complaint/bihar/ssl-view-complaint')}>
              <span className="ax-btn__label">Cancel</span>
            </button>
            <button type="submit" disabled={submitting} className="ax-btn ax-btn--primary" style={{ minWidth: 200 }}>
              {submitting ? (
                <>
                  <svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ animation: 'spin 1s linear infinite' }}><path d="M12 3a9 9 0 1 0 9 9" /></svg>
                  <span className="ax-btn__label">Submitting Ticket...</span>
                </>
              ) : (
                <>
                  <svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l5 5l10 -10" /></svg>
                  <span className="ax-btn__label">Submit Complaint Ticket</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>

      <footer style={{ marginTop: 'var(--ax-space-8)', textAlign: 'center', fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-muted)' }}>
        Copyright © <a href="https://klkerp.com" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--ax-primary)' }}>ETS NETWORKS</a>. All rights reserved.
      </footer>
    </div>
  );
}

export default Bihar_Complaint_SSL_AddComplaint;

/* =========================================================================
 * Shared design (same as Bihar_Survey_SRT200MW_AddData)
 * ========================================================================= */

const SINGLE_CARD_FORM_CSS = `
.bihar-single-card-form .ax-card { border: 1px solid var(--ax-border); border-radius: var(--ax-radius-xl); background: var(--ax-surface-solid); box-shadow: var(--ax-shadow-sm); overflow: hidden; }
.bihar-single-card-form .ax-card__header { padding: var(--ax-space-5) var(--ax-space-6); border-bottom: 1px solid var(--ax-border-subtle); background: var(--ax-surface-subtle); display: flex; flex-direction: column; gap: var(--ax-space-4); }
.bihar-single-card-form .ax-card__body { padding: var(--ax-space-6); }

.bihar-section-pills { display: flex; gap: var(--ax-space-2); overflow-x: auto; padding-bottom: 4px; scrollbar-width: thin; }
.bihar-section-pill-btn { display: inline-flex; align-items: center; gap: 6px; padding: 6px 14px; border-radius: var(--ax-radius-pill); font-size: var(--ax-text-xs); font-weight: 500; white-space: nowrap; background: var(--ax-surface-solid); border: 1px solid var(--ax-border); color: var(--ax-text); cursor: pointer; transition: all var(--ax-motion-fast) var(--ax-ease-standard); text-decoration: none; }
.bihar-section-pill-btn:hover { border-color: var(--ax-accent); color: var(--ax-accent); background: color-mix(in srgb, var(--ax-accent) 6%, var(--ax-surface-solid)); }
.bihar-section-pill-btn .pill-num { width: 18px; height: 18px; border-radius: 50%; background: var(--ax-surface-subtle); display: inline-flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 700; }

.bihar-section-block { padding-top: var(--ax-space-2); }
.bihar-section-header { display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: var(--ax-space-2); margin-bottom: var(--ax-space-5); padding-bottom: var(--ax-space-3); border-bottom: 1px solid var(--ax-border-subtle); }
.bihar-section-title-wrap { display: flex; flex-direction: column; gap: 4px; }
.bihar-section-divider { border: 0; border-top: 1px dashed var(--ax-border); margin: var(--ax-space-8) 0 var(--ax-space-6); }

.ax-float { position: relative; width: 100%; }
.ax-float__input { width: 100%; height: 46px; padding: 12px 14px 4px 14px; font-size: var(--ax-text-sm); background: var(--ax-surface-solid); border: 1px solid var(--ax-border); border-radius: var(--ax-radius-md); color: var(--ax-text); outline: none; transition: border-color var(--ax-motion-fast) var(--ax-ease-standard), box-shadow var(--ax-motion-fast) var(--ax-ease-standard); }
.ax-float__input::placeholder { color: transparent; }
.ax-float__input:focus { border-color: var(--ax-accent); box-shadow: 0 0 0 3px color-mix(in srgb, var(--ax-accent) 20%, transparent); }
.ax-float__input[readonly] { background: var(--ax-surface-subtle); }

.ax-float__label { position: absolute; inset-inline-start: 12px; top: 50%; transform: translateY(-50%); margin: 0; padding: 0 4px; font-size: var(--ax-text-sm); color: var(--ax-text-subtle); background: var(--ax-surface-solid); border-radius: var(--ax-radius-xs); pointer-events: none; transition: top var(--ax-motion-fast) var(--ax-ease-standard), font-size var(--ax-motion-fast) var(--ax-ease-standard), color var(--ax-motion-fast) var(--ax-ease-standard); z-index: 2; white-space: nowrap; max-width: calc(100% - 24px); overflow: hidden; text-overflow: ellipsis; }

.ax-float__input:focus + .ax-float__label,
.ax-float__input:not(:placeholder-shown) + .ax-float__label,
.ax-float--select .ax-float__label,
.ax-float--file .ax-float__label { top: 0; transform: translateY(-50%); font-size: var(--ax-text-2xs); font-weight: 500; color: var(--ax-text-muted); }
.ax-float__input:focus + .ax-float__label { color: var(--ax-accent); }

.ax-float__input.is-invalid { border-color: var(--ax-danger-500) !important; }
.ax-float__input.is-invalid:focus { box-shadow: 0 0 0 3px color-mix(in srgb, var(--ax-danger-500) 24%, transparent) !important; }
.ax-float__input.is-invalid + .ax-float__label { color: var(--ax-danger-500) !important; }

.ax-float--area .ax-float__input { height: auto; min-height: 84px; padding-top: 18px; resize: vertical; }
.ax-float--area .ax-float__label { top: 18px; transform: none; }
.ax-float--area .ax-float__input:focus + .ax-float__label,
.ax-float--area .ax-float__input:not(:placeholder-shown) + .ax-float__label { top: 0; transform: translateY(-50%); }

.ax-field-feedback { display: flex; align-items: center; gap: 4px; margin-top: 4px; font-size: var(--ax-text-2xs); min-height: 16px; }
.ax-field-feedback--error { color: var(--ax-danger-500); }

.bihar-form-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: var(--ax-space-4); }
@media (min-width: 1024px) { .bihar-form-grid--3col { grid-template-columns: repeat(3, 1fr); } }
.bihar-form-col-span-full { grid-column: 1 / -1; }

.bihar-form-sticky-bar { position: sticky; bottom: var(--ax-space-4); z-index: 30; margin-top: var(--ax-space-6); padding: var(--ax-space-3) var(--ax-space-5); background: var(--ax-surface-solid); border: 1px solid var(--ax-border); border-radius: var(--ax-radius-xl); box-shadow: var(--ax-shadow-lg); display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: var(--ax-space-3); backdrop-filter: blur(12px); }
`;

type Option = { value: string; label: string };
const opts = (arr: string[]): Option[] => arr.map((v) => ({ value: v, label: v }));

function SectionHeader({ num, total, title, desc }: { num: string; total: number; title: string; desc?: ReactNode }) {
  return (
    <div className="bihar-section-header">
      <div className="bihar-section-title-wrap">
        <div className="ax-cluster" style={{ gap: 'var(--ax-space-2)', alignItems: 'center' }}>
          <span className="ax-badge ax-badge--soft ax-badge--primary ax-badge--pill" style={{ fontWeight: 600 }}>
            Section {num} of {total}
          </span>
          <h3 style={{ fontSize: 'var(--ax-text-base)', fontWeight: 600, margin: 0, color: 'var(--ax-text-strong)' }}>{title}</h3>
        </div>
        {desc && <p style={{ margin: '4px 0 0', fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-muted)' }}>{desc}</p>}
      </div>
    </div>
  );
}

const Asterisk = () => <span style={{ color: 'var(--ax-danger-500)', marginLeft: 3 }}>*</span>;

function FieldFeedback({ error }: { error?: string }) {
  if (error) {
    return (
      <span className="ax-field-feedback ax-field-feedback--error" role="alert">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ width: 12, height: 12 }}>
          <circle cx="12" cy="12" r="9" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        {error}
      </span>
    );
  }
  return <span className="ax-field-feedback" />;
}

interface FloatingInputProps {
  id: string;
  label: string;
  type?: string;
  required?: boolean;
  readOnly?: boolean;
  placeholder?: string;
  maxLength?: number;
  value: string;
  onChange?: (val: string) => void;
  error?: string;
}

function FloatingInput({ id, label, type = 'text', required, readOnly, placeholder = ' ', maxLength, value, onChange, error }: FloatingInputProps) {
  return (
    <div>
      <div className={`ax-float${type === 'date' ? ' ax-float--select' : ''}`}>
        <input
          id={id}
          type={type}
          className={`ax-input ax-float__input ${error ? 'is-invalid' : ''}`}
          placeholder={placeholder}
          value={value}
          readOnly={readOnly}
          maxLength={maxLength}
          onChange={(e) => onChange?.(e.target.value)}
          aria-invalid={Boolean(error)}
        />
        <label className="ax-float__label" htmlFor={id}>
          {label}
          {required && <Asterisk />}
        </label>
      </div>
      <FieldFeedback error={error} />
    </div>
  );
}

interface FloatingSelectProps {
  id: string;
  label: string;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  value: string;
  options: Option[];
  onChange: (val: string) => void;
  error?: string;
}

function FloatingSelect({ id, label, required, disabled, placeholder = '-- Select --', value, options, onChange, error }: FloatingSelectProps) {
  return (
    <div>
      <div className="ax-float ax-float--select">
        <select
          id={id}
          className={`ax-select ax-float__input ${error ? 'is-invalid' : ''}`}
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={Boolean(error)}
        >
          <option value="">{placeholder}</option>
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <label className="ax-float__label" htmlFor={id}>
          {label}
          {required && <Asterisk />}
        </label>
      </div>
      <FieldFeedback error={error} />
    </div>
  );
}

interface FloatingTextareaProps {
  id: string;
  label: string;
  required?: boolean;
  placeholder?: string;
  value: string;
  rows?: number;
  maxLength?: number;
  onChange: (val: string) => void;
  error?: string;
}

function FloatingTextarea({ id, label, required, placeholder = 'Enter Remarks...', value, rows = 4, maxLength, onChange, error }: FloatingTextareaProps) {
  return (
    <div>
      <div className="ax-float ax-float--area">
        <textarea
          id={id}
          rows={rows}
          maxLength={maxLength}
          className={`ax-textarea ax-float__input ${error ? 'is-invalid' : ''}`}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={Boolean(error)}
        />
        <label className="ax-float__label" htmlFor={id}>
          {label}
          {required && <Asterisk />}
        </label>
      </div>
      <FieldFeedback error={error} />
    </div>
  );
}

interface FloatingFileInputProps {
  id: string;
  label: string;
  required?: boolean;
  accept?: string;
  file: File | null;
  onChange: (file: File | null) => void;
  error?: string;
}

function FloatingFileInput({ id, label, required, accept = 'image/jpeg,image/png,image/webp,application/pdf', file, onChange, error }: FloatingFileInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const chosen = e.dataTransfer.files?.[0];
    if (chosen) onChange(chosen);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label
        htmlFor={id}
        style={{
          fontSize: '12px',
          fontWeight: 600,
          color: error ? 'var(--ax-danger-500, #ef4444)' : 'var(--ax-text-strong, #334155)',
          display: 'flex',
          alignItems: 'center',
          gap: 4,
        }}
      >
        <span>{label}</span>
        {required && <Asterisk />}
      </label>

      <input ref={inputRef} id={id} type="file" accept={accept} style={{ display: 'none' }} onChange={(e) => onChange(e.target.files?.[0] || null)} />

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
            : isHovered ? '1.5px dashed #94a3b8' : '1.5px dashed #cbd5e1',
          borderRadius: 8,
          background: isDragging ? '#eff6ff' : error ? '#fef2f2' : isHovered ? '#fbfcfd' : '#ffffff',
          padding: file ? '12px 16px' : '22px 16px',
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
        {file ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, textAlign: 'left' }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#ecfdf5', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ax-text-strong)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name}</div>
                <div style={{ fontSize: 11, color: 'var(--ax-text-muted)', marginTop: 2 }}>{(file.size / 1024).toFixed(0)} KB · Ready to upload</div>
              </div>
            </div>
            <button type="button" className="ax-btn ax-btn--ghost ax-btn--sm" onClick={handleClear} style={{ color: '#ef4444', flexShrink: 0 }} title="Remove file">
              Remove
            </button>
          </div>
        ) : (
          <>
            <div style={{ width: 38, height: 38, borderRadius: '50%', background: '#eff6ff', color: '#3b82f6', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 6 }}>
              <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" />
                <path d="M12 12v9" />
                <path d="m8 16 4-4 4 4" />
              </svg>
            </div>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ax-text-strong, #1e293b)' }}>Click to upload or drag & drop</div>
            <div style={{ fontSize: 11, color: 'var(--ax-text-muted, #64748b)', marginTop: 3 }}>JPG, PNG, WEBP, PDF · Max 5MB</div>
          </>
        )}
      </div>

      <FieldFeedback error={error} />
    </div>
  );
}