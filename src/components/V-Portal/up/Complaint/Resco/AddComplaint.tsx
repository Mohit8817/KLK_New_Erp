import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ComplaintFormLayout,
  FloatingInput,
  FloatingSelect,
  FloatingTextarea,
  FloatingFileInput,
  SectionHeader,
  opts,
  getTodayFormatted,
  type SectionItem,
} from '../CommonSharedComplaints';
import { upComplaintService, type UpRescoSiteDetails } from '../../up-services';

const SECTIONS: SectionItem[] = [
  { id: 'rs-sec-1', num: '1', title: 'Site & Location' },
  { id: 'rs-sec-2', num: '2', title: 'Technical & Equipment' },
  { id: 'rs-sec-3', num: '3', title: 'Contact & Complaint' },
];

const INITIAL_FORM = {
  complaint_date: getTodayFormatted(),
  district: '',
  site_name: '',
  site_id: '',
  department: '',
  address: '',
  contact_person: '',
  contact_number: '',
  ca_no: '',
  sanction_load: '',
  plant_capacity: '',
  inverter_no: '',
  solarmeter_no: '',
  nm_sm_no: '',
  logger_no: '',
  panel_no: '',
  wo_no: '',
  latitude: '',
  longitude: '',
  phase: '',
  complaint: '',
  sms: 'Yes',
};

type FormKey = keyof typeof INITIAL_FORM;

export function UP_Complaint_Resco_AddComplaint() {
  const navigate = useNavigate();

  const [form, setForm] = useState(INITIAL_FORM);
  const [file1, setFile1] = useState<File | null>(null);
  const [file2, setFile2] = useState<File | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Dynamic dropdown lists
  const [districts, setDistricts] = useState<string[]>([]);
  const [sites, setSites] = useState<{ id: string | number; site_name: string }[]>([]);

  const clearErr = (k: string) =>
    setErrors((prev) => {
      if (!prev[k]) return prev;
      const next = { ...prev };
      delete next[k];
      return next;
    });

  const setVal = (k: FormKey, v: string) => {
    setForm((p) => ({ ...p, [k]: v }));
    clearErr(k);
  };

  // 1. Load initial districts
  useEffect(() => {
    let active = true;
    upComplaintService.getRescoAddData().then((res) => {
      if (active && res.districts && res.districts.length > 0) {
        setDistricts(res.districts);
      } else if (active && res.data && Array.isArray(res.data) && res.data.length > 0) {
        setDistricts(res.data.map((d: any) => (typeof d === 'string' ? d : d.district || d.name || '')).filter(Boolean));
      }
    });
    return () => {
      active = false;
    };
  }, []);

  // 2. District change -> load sites
  const handleDistrictChange = async (d: string) => {
    setForm((prev) => ({
      ...prev,
      district: d,
      site_name: '',
      site_id: '',
      department: '',
      address: '',
      contact_person: '',
      contact_number: '',
      ca_no: '',
      sanction_load: '',
      plant_capacity: '',
      inverter_no: '',
      solarmeter_no: '',
      nm_sm_no: '',
      logger_no: '',
      panel_no: '',
      wo_no: '',
      latitude: '',
      longitude: '',
      phase: '',
    }));
    clearErr('district');
    setSites([]);
    if (!d) return;

    try {
      const siteList = await upComplaintService.getRescoSiteNames(d);
      setSites(siteList);
    } catch {
      setSites([]);
    }
  };

  // 3. Site change -> auto-populate
  const handleSiteChange = async (val: string) => {
    const selectedObj = sites.find((s) => String(s.id) === val || s.site_name === val);
    const siteName = selectedObj?.site_name || val;
    const siteId = selectedObj?.id || val;

    setForm((prev) => ({
      ...prev,
      site_name: siteName,
      site_id: val ? String(siteId) : '',
    }));
    clearErr('site_name');

    if (!val) return;

    try {
      const details: UpRescoSiteDetails | null = await upComplaintService.getRescoSiteDetails(siteId);
      if (details) {
        setForm((prev) => ({
          ...prev,
          department: details.dept_name || details.department || prev.department,
          address: details.address || details.site_address || prev.address,
          contact_person: details.contact_person || prev.contact_person,
          contact_number: details.contact_number || details.contact_no || prev.contact_number,
          ca_no: details.ca_no || prev.ca_no,
          sanction_load: details.sanction_load !== undefined ? String(details.sanction_load) : prev.sanction_load,
          plant_capacity: details.plant_capacity !== undefined ? String(details.plant_capacity) : (details.plant_sc !== undefined ? String(details.plant_sc) : prev.plant_capacity),
          inverter_no: details.inverter_no || prev.inverter_no,
          solarmeter_no: details.solarmeter_no || details.solar_meter_no || prev.solarmeter_no,
          nm_sm_no: details.nm_sm_no || prev.nm_sm_no,
          logger_no: details.logger_no || details.loger_no || prev.logger_no,
          panel_no: details.panel_no || prev.panel_no,
          wo_no: details.wo_no || prev.wo_no,
          latitude: details.latitude !== undefined ? String(details.latitude) : prev.latitude,
          longitude: details.longitude !== undefined ? String(details.longitude) : prev.longitude,
          phase: details.phase || prev.phase,
        }));
      }
    } catch {
      // Ignore
    }
  };

  const handleReset = () => {
    setForm(INITIAL_FORM);
    setFile1(null);
    setFile2(null);
    setErrors({});
    setSites([]);
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.district) errs.district = 'District is required';
    if (!form.site_name) errs.site_name = 'Name of the Site is required';
    if (!form.contact_number.trim()) {
      errs.contact_number = 'Contact number is required';
    } else if (!/^\d{10}$/.test(form.contact_number.trim())) {
      errs.contact_number = 'Must be exactly 10 digits';
    }
    if (!form.complaint.trim()) errs.complaint = 'Complaint description is required';
    if (!file1) errs.file1 = 'Upload File - 1 is required';

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setToast(null);

    if (!validate()) {
      setToast({ type: 'error', message: 'Please correct the highlighted errors before submitting.' });
      return;
    }

    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('district', form.district);
      fd.append('site_name', form.site_name);
     if (form.site_id) fd.append('resco_id', form.site_id);
      if (form.department) fd.append('dept_name', form.department);
      if (form.address) fd.append('address', form.address);
      if (form.contact_person) fd.append('contact_person', form.contact_person);
      fd.append('contact_number', form.contact_number.trim());
      if (form.ca_no) fd.append('ca_no', form.ca_no);
      if (form.sanction_load) fd.append('sanction_load', form.sanction_load);
      if (form.plant_capacity) {
        fd.append('plant_capacity', form.plant_capacity);
        fd.append('plant_sc', form.plant_capacity);
      }
      if (form.inverter_no) fd.append('inverter_no', form.inverter_no);
      if (form.solarmeter_no) fd.append('solarmeter_no', form.solarmeter_no);
      if (form.nm_sm_no) fd.append('nm_sm_no', form.nm_sm_no);
     if (form.logger_no) fd.append('loger_no', form.logger_no);
      if (form.panel_no) fd.append('panel_no', form.panel_no);
      if (form.wo_no) fd.append('wo_no', form.wo_no);
      if (form.latitude) fd.append('latitude', form.latitude);
      if (form.longitude) fd.append('longitude', form.longitude);
      if (form.phase) fd.append('phase', form.phase);
      fd.append('complaint', form.complaint.trim());
      fd.append('sms', form.sms);
      fd.append('complaint_date', form.complaint_date);

      if (file1) {
        fd.append('file', file1);
        fd.append('file1', file1);
      }
      if (file2) fd.append('file2', file2);

      const res = await upComplaintService.saveRescoComplaint(fd);
      if (res.status) {
        setToast({ type: 'success', message: res.message || 'Complaint submitted successfully!' });
        handleReset();
        setTimeout(() => {
          navigate('/v/complaint/up/resco-view-complaint');
        }, 1500);
      } else {
        setToast({ type: 'error', message: res.message || 'Failed to submit complaint.' });
      }
    } catch (err: any) {
      setToast({ type: 'error', message: err?.message || 'Error occurred during submission.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <ComplaintFormLayout
      title="Add Vendor UP Resco Complaint"
      subtitle="File a new solar rooftop / RESCO complaint with complete site equipment information"
      breadcrumbs={[
        { label: 'Home', href: '/v' },
        { label: 'Vendor UP Resco Complaints', href: '/v/complaint/up/resco-view-complaint' },
        { label: 'Add UP Resco Complaint' },
      ]}
      viewLink="/v/complaint/up/resco-view-complaint"
      eyebrow="RESCO Rooftop Solar"
      formTitle="Add UP Resco Complaint"
      formSubtitle="Fill in complaint details across 3 dedicated sections with automatic site data population."
      sections={SECTIONS}
      onSubmit={handleSubmit}
      onReset={handleReset}
      loading={loading}
      toast={toast}
    >
      {/* ── Section 1: Site & Location ── */}
      <div id="rs-sec-1" className="up-section-block">
        <SectionHeader num="1" total={3} title="Site & Location Information" desc="Select the district and site name to auto-populate existing site equipment details." />
        <div className="up-form-grid up-form-grid--3col">
          <FloatingInput
            id="rs-date"
            label="Complaint Date"
            type="date"
            required
            value={form.complaint_date}
            onChange={(v) => setVal('complaint_date', v)}
          />
          <FloatingSelect
            id="rs-district"
            label="District"
            required
            value={form.district}
            options={opts(districts)}
            onChange={handleDistrictChange}
            error={errors.district}
          />
          <FloatingSelect
            id="rs-site"
            label="Name of the Site"
            required
            disabled={!form.district}
            value={form.site_id}
            options={sites.map((s) => ({ value: String(s.id), label: s.site_name }))}
            onChange={handleSiteChange}
            error={errors.site_name}
          />
          <FloatingInput
            id="rs-dept"
            label="Department"
            value={form.department}
            onChange={(v) => setVal('department', v)}
          />
          <FloatingInput
            id="rs-address"
            label="Address"
            className="ax-col--span-2"
            value={form.address}
            onChange={(v) => setVal('address', v)}
          />
        </div>
      </div>

      <hr className="up-section-divider" />

      {/* ── Section 2: Technical & Equipment ── */}
      <div id="rs-sec-2" className="up-section-block">
        <SectionHeader num="2" total={3} title="Technical & Equipment Details" desc="Technical specifications auto-filled from site master data; edit if updated on-site." />
        <div className="up-form-grid up-form-grid--3col">
          <FloatingInput id="rs-ca" label="CA Number" value={form.ca_no} onChange={(v) => setVal('ca_no', v)} />
          <FloatingInput id="rs-sanction" label="Sanction Load" value={form.sanction_load} onChange={(v) => setVal('sanction_load', v)} />
          <FloatingInput id="rs-capacity" label="Plant Capacity (kW)" value={form.plant_capacity} onChange={(v) => setVal('plant_capacity', v)} />
          <FloatingInput id="rs-inverter" label="Inverter No." value={form.inverter_no} onChange={(v) => setVal('inverter_no', v)} />
          <FloatingInput id="rs-solar" label="Solar Meter No." value={form.solarmeter_no} onChange={(v) => setVal('solarmeter_no', v)} />
          <FloatingInput id="rs-nmsm" label="Net / Smart Meter No." value={form.nm_sm_no} onChange={(v) => setVal('nm_sm_no', v)} />
          <FloatingInput id="rs-logger" label="Logger No." value={form.logger_no} onChange={(v) => setVal('logger_no', v)} />
          <FloatingInput id="rs-panel" label="Panel No." value={form.panel_no} onChange={(v) => setVal('panel_no', v)} />
          <FloatingInput id="rs-wo" label="Work Order No." value={form.wo_no} onChange={(v) => setVal('wo_no', v)} />
          <FloatingInput id="rs-lat" label="Latitude" value={form.latitude} onChange={(v) => setVal('latitude', v)} />
          <FloatingInput id="rs-long" label="Longitude" value={form.longitude} onChange={(v) => setVal('longitude', v)} />
          <FloatingInput id="rs-phase" label="Phase" value={form.phase} onChange={(v) => setVal('phase', v)} />
        </div>
      </div>

      <hr className="up-section-divider" />

      {/* ── Section 3: Contact & Complaint ── */}
      <div id="rs-sec-3" className="up-section-block">
        <SectionHeader num="3" total={3} title="Contact & Complaint Description" desc="Provide contact information, problem statement, and supporting photographic proof." />
        <div className="up-form-grid up-form-grid--3col">
          <FloatingInput id="rs-contact-p" label="Contact Person Name" value={form.contact_person} onChange={(v) => setVal('contact_person', v)} />
          <FloatingInput
            id="rs-contact-n"
            label="Contact Number"
            required
            maxLength={10}
            value={form.contact_number}
            onChange={(v) => setVal('contact_number', v)}
            error={errors.contact_number}
          />
          <FloatingSelect
            id="rs-sms"
            label="Send SMS Notification"
            value={form.sms}
            options={[{ value: 'Yes', label: 'Yes' }, { value: 'No', label: 'No' }]}
            onChange={(v) => setVal('sms', v)}
          />
          <FloatingTextarea
            id="rs-complaint"
            label="Complaint Description"
            required
            className="ax-col--span-3"
            value={form.complaint}
            onChange={(v) => setVal('complaint', v)}
            error={errors.complaint}
          />
          <FloatingFileInput
            id="rs-file1"
            label="Upload File - 1 (Proof)"
            required
            file={file1}
            onChange={setFile1}
            error={errors.file1}
          />
          <FloatingFileInput
            id="rs-file2"
            label="Upload File - 2 (Optional)"
            file={file2}
            onChange={setFile2}
          />
        </div>
      </div>
    </ComplaintFormLayout>
  );
}

export default UP_Complaint_Resco_AddComplaint;
