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
import { upComplaintService, type UpSslBeneficiaryDetails } from '../../up-services';

const SECTIONS: SectionItem[] = [
  { id: 'ssl-sec-1', num: '1', title: 'Location & Beneficiary' },
  { id: 'ssl-sec-2', num: '2', title: 'Light Hardware & Installation' },
  { id: 'ssl-sec-3', num: '3', title: 'Complaint & Attachment' },
];

const INITIAL_FORM = {
  type: 'SSL 18W',
  district: '',
  block: '',
  panchayat: '',
  beneficiary_name: '',
  beneficiary_id: '',
  contact_no: '',
  uid_no: '',
  latitude: '',
  longitude: '',
  along_with_pole: '',
  luminary_no: '',
  sim_no: '',
  battery_serial_no: '',
  module_no: '',
  date_of_installation: '',
  complaint_date: getTodayFormatted(),
  complaint_source: 'Vendor App',
  complaint_issue: '',
  complaint: '',
  sms: 'Yes',
};

type FormKey = keyof typeof INITIAL_FORM;

export function UP_Complaint_SSL_AddComplaint() {
  const navigate = useNavigate();

  const [form, setForm] = useState(INITIAL_FORM);
  const [file, setFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Cascading lists
  const [districts, setDistricts] = useState<string[]>([]);
  const [blocks, setBlocks] = useState<string[]>([]);
  const [panchayats, setPanchayats] = useState<string[]>([]);
  const [beneficiaries, setBeneficiaries] = useState<{ id: string | number; name: string }[]>([]);

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

  useEffect(() => {
    let active = true;
    upComplaintService.getSslAddData().then((res) => {
      if (active && res.districts && res.districts.length > 0) {
        setDistricts(res.districts);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  const handleDistrictChange = async (d: string) => {
    setForm((p) => ({
      ...p,
      district: d,
      block: '',
      panchayat: '',
      beneficiary_name: '',
      beneficiary_id: '',
      contact_no: '',
      uid_no: '',
      latitude: '',
      longitude: '',
      along_with_pole: '',
      luminary_no: '',
      sim_no: '',
      battery_serial_no: '',
      module_no: '',
      date_of_installation: '',
    }));
    clearErr('district');
    setBlocks([]);
    setPanchayats([]);
    setBeneficiaries([]);
    if (!d) return;

    try {
      const bList = await upComplaintService.getSslBlocks(d);
      setBlocks(bList);
    } catch {
      setBlocks([]);
    }
  };

  const handleBlockChange = async (b: string) => {
    setForm((p) => ({ ...p, block: b, panchayat: '', beneficiary_name: '', beneficiary_id: '' }));
    clearErr('block');
    setPanchayats([]);
    setBeneficiaries([]);
    if (!b || !form.district) return;

    try {
      const pList = await upComplaintService.getSslPanchayats(form.district, b);
      setPanchayats(pList);
    } catch {
      setPanchayats([]);
    }
  };

  const handlePanchayatChange = async (panch: string) => {
    setForm((p) => ({ ...p, panchayat: panch, beneficiary_name: '', beneficiary_id: '' }));
    clearErr('panchayat');
    setBeneficiaries([]);
    if (!panch || !form.district || !form.block) return;

    try {
      const list = await upComplaintService.getSslBeneficiaryNames(form.district, form.block, panch);
      setBeneficiaries(list);
    } catch {
      setBeneficiaries([]);
    }
  };

  const handleBeneficiaryChange = async (idOrName: string) => {
    const chosen = beneficiaries.find((b) => String(b.id) === idOrName);
    const bName = chosen ? chosen.name : idOrName;

    setForm((p) => ({ ...p, beneficiary_name: bName, beneficiary_id: idOrName }));
    clearErr('beneficiary_name');

    if (!idOrName) return;

    try {
      const det: UpSslBeneficiaryDetails | null = await upComplaintService.getSslBeneficiaryDetails(idOrName);
      if (det) {
        setForm((p) => ({
          ...p,
          contact_no: det.contact_no || p.contact_no,
          uid_no: det.uid_no || p.uid_no,
          latitude: det.latitude !== undefined ? String(det.latitude) : p.latitude,
          longitude: det.longitude !== undefined ? String(det.longitude) : p.longitude,
          along_with_pole: det.along_with_pole || p.along_with_pole,
          luminary_no: det.luminary_no || p.luminary_no,
          sim_no: det.sim_no || p.sim_no,
          battery_serial_no: det.battery_serial_no || p.battery_serial_no,
          module_no: det.module_no || p.module_no,
          date_of_installation: det.date_of_installation || p.date_of_installation,
        }));
      }
    } catch {}
  };

  const handleReset = () => {
    setForm(INITIAL_FORM);
    setFile(null);
    setErrors({});
    setBlocks([]);
    setPanchayats([]);
    setBeneficiaries([]);
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.district) errs.district = 'District is required';
    if (!form.block) errs.block = 'Block is required';
    if (!form.panchayat) errs.panchayat = 'Panchayat is required';
    if (!form.beneficiary_name) errs.beneficiary_name = 'Beneficiary Name is required';
    if (!form.contact_no.trim()) {
      errs.contact_no = 'Contact Number is required';
    } else if (!/^\d{10}$/.test(form.contact_no.trim())) {
      errs.contact_no = 'Must be exactly 10 digits';
    }
    if (!form.complaint.trim()) errs.complaint = 'Complaint description is required';
    if (!file) errs.file = 'Supporting document / photo is required';

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
      Object.entries(form).forEach(([k, v]) => {
        if (v !== '' && v !== null && v !== undefined) fd.append(k, String(v));
      });
      if (file) {
        fd.append('file', file);
        fd.append('file1', file);
      }

      const res = await upComplaintService.saveSslComplaint(fd);
      if (res.status) {
        setToast({ type: 'success', message: res.message || 'SSL Complaint registered successfully!' });
        handleReset();
        setTimeout(() => {
          navigate('/v/complaint/up/ssl-view-complaint');
        }, 1500);
      } else {
        setToast({ type: 'error', message: res.message || 'Failed to submit complaint.' });
      }
    } catch (err: any) {
      setToast({ type: 'error', message: err?.message || 'Error occurred.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <ComplaintFormLayout
      title="Add Vendor UP SSL Complaint"
      subtitle="Register Solar Street Light breakdown, hardware faults, and repair requests"
      breadcrumbs={[
        { label: 'Home', href: '/v' },
        { label: 'Vendor UP SSL Complaints', href: '/v/complaint/up/ssl-view-complaint' },
        { label: 'Add UP SSL Complaint' },
      ]}
      viewLink="/v/complaint/up/ssl-view-complaint"
      eyebrow="Solar Street Light (SSL)"
      formTitle="Add UP SSL Complaint"
      formSubtitle="Enter location, luminary details, and issue description across 3 sections."
      sections={SECTIONS}
      onSubmit={handleSubmit}
      onReset={handleReset}
      loading={loading}
      toast={toast}
    >
      {/* ── Section 1: Location & Beneficiary ── */}
      <div id="ssl-sec-1" className="up-section-block">
        <SectionHeader num="1" total={3} title="Location & Beneficiary Information" desc="Select District, Block and Panchayat to find assigned SSL installations." />
        <div className="up-form-grid up-form-grid--3col">
          <FloatingSelect
            id="ssl-type"
            label="System Type"
            value={form.type}
            options={[{ value: 'SSL 18W', label: 'SSL 18W' }, { value: 'SSL 12W', label: 'SSL 12W' }]}
            onChange={(v) => setVal('type', v)}
          />
          <FloatingSelect
            id="ssl-district"
            label="District"
            required
            value={form.district}
            options={opts(districts)}
            onChange={handleDistrictChange}
            error={errors.district}
          />
          <FloatingSelect
            id="ssl-block"
            label="Block"
            required
            disabled={!form.district}
            value={form.block}
            options={opts(blocks)}
            onChange={handleBlockChange}
            error={errors.block}
          />
          <FloatingSelect
            id="ssl-panchayat"
            label="Panchayat"
            required
            disabled={!form.block}
            value={form.panchayat}
            options={opts(panchayats)}
            onChange={handlePanchayatChange}
            error={errors.panchayat}
          />
          <FloatingSelect
            id="ssl-ben"
            label="Beneficiary / Site Name"
            required
            disabled={!form.panchayat}
            value={form.beneficiary_id}
            options={beneficiaries.map((b) => ({ value: String(b.id), label: b.name }))}
            onChange={handleBeneficiaryChange}
            error={errors.beneficiary_name}
          />
          <FloatingInput
            id="ssl-contact"
            label="Contact Number"
            required
            maxLength={10}
            value={form.contact_no}
            onChange={(v) => setVal('contact_no', v)}
            error={errors.contact_no}
          />
          <FloatingInput id="ssl-uid" label="UID Number" value={form.uid_no} onChange={(v) => setVal('uid_no', v)} />
          <FloatingInput id="ssl-lat" label="Latitude" value={form.latitude} onChange={(v) => setVal('latitude', v)} />
          <FloatingInput id="ssl-long" label="Longitude" value={form.longitude} onChange={(v) => setVal('longitude', v)} />
          <FloatingInput id="ssl-pole" label="Along with Pole" value={form.along_with_pole} onChange={(v) => setVal('along_with_pole', v)} />
        </div>
      </div>

      <hr className="up-section-divider" />

      {/* ── Section 2: Light Hardware & Installation ── */}
      <div id="ssl-sec-2" className="up-section-block">
        <SectionHeader num="2" total={3} title="Light Hardware & Installation Specs" desc="Auto-populated equipment serial numbers." />
        <div className="up-form-grid up-form-grid--3col">
          <FloatingInput id="ssl-lum" label="Luminary Number" value={form.luminary_no} onChange={(v) => setVal('luminary_no', v)} />
          <FloatingInput id="ssl-sim" label="SIM Number" value={form.sim_no} onChange={(v) => setVal('sim_no', v)} />
          <FloatingInput id="ssl-bat" label="Battery Serial Number" value={form.battery_serial_no} onChange={(v) => setVal('battery_serial_no', v)} />
          <FloatingInput id="ssl-mod" label="Module Serial Number" value={form.module_no} onChange={(v) => setVal('module_no', v)} />
          <FloatingInput id="ssl-inst" label="Installation Date" type="date" value={form.date_of_installation} onChange={(v) => setVal('date_of_installation', v)} />
        </div>
      </div>

      <hr className="up-section-divider" />

      {/* ── Section 3: Complaint & Attachment ── */}
      <div id="ssl-sec-3" className="up-section-block">
        <SectionHeader num="3" total={3} title="Complaint & Documentation" desc="Describe the streetlight issue and attach photo evidence." />
        <div className="up-form-grid up-form-grid--3col">
          <FloatingInput id="ssl-cdate" label="Complaint Date" type="date" required value={form.complaint_date} onChange={(v) => setVal('complaint_date', v)} />
          <FloatingSelect
            id="ssl-source"
            label="Complaint Source"
            value={form.complaint_source}
            options={[{ value: 'Vendor App', label: 'Vendor App' }, { value: 'Helpline', label: 'Helpline' }]}
            onChange={(v) => setVal('complaint_source', v)}
          />
          <FloatingInput id="ssl-issue" label="Issue Category" value={form.complaint_issue} onChange={(v) => setVal('complaint_issue', v)} />
          <FloatingTextarea
            id="ssl-text"
            label="Complaint Description"
            required
            className="ax-col--span-3"
            value={form.complaint}
            onChange={(v) => setVal('complaint', v)}
            error={errors.complaint}
          />
          <FloatingFileInput
            id="ssl-file"
            label="Upload Proof Photo / Document"
            required
            file={file}
            onChange={setFile}
            error={errors.file}
          />
          <FloatingSelect
            id="ssl-sms"
            label="Send SMS Notification"
            value={form.sms}
            options={[{ value: 'Yes', label: 'Yes' }, { value: 'No', label: 'No' }]}
            onChange={(v) => setVal('sms', v)}
          />
        </div>
      </div>
    </ComplaintFormLayout>
  );
}

export default UP_Complaint_SSL_AddComplaint;
