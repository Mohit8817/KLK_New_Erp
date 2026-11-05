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
import { upComplaintService, type UpKusumBDetails } from '../../up-services';

const SECTIONS: SectionItem[] = [
  { id: 'kb-sec-1', num: '1', title: 'Complaint & Beneficiary' },
  { id: 'kb-sec-2', num: '2', title: 'Beneficiary Details' },
  { id: 'kb-sec-3', num: '3', title: 'Pump & Technical' },
  { id: 'kb-sec-4', num: '4', title: 'Complaint & Attachment' },
];

const INITIAL_FORM = {
  complaint_date: getTodayFormatted(),
  district: '',
  village: '',
  beneficiary_id: '',
  beneficiary_name: '',
  gender: '',
  contact_no: '',
  application_no: '',
  location: '',
  father_name: '',
  category: '',
  aadhar_status: '',
  saral_id: '',
  required_pump: '',
  pump_sub_type: '',
  pump_make: '',
  module_make: '',
  spv_capacity: '',
  sys_installed_date: '',
  total_pump_cost: '',
  complaint: '',
  sms: 'no',
};

type FormKey = keyof typeof INITIAL_FORM;

export function UPComplaintKBAdd() {
  const navigate = useNavigate();

  const [form, setForm] = useState(INITIAL_FORM);
  const [file, setFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const [districts, setDistricts] = useState<string[]>([]);
  const [villages, setVillages] = useState<string[]>([]);
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
    upComplaintService.getKusumBAddData().then((res) => {
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
      village: '',
      beneficiary_id: '',
      beneficiary_name: '',
      gender: '',
      contact_no: '',
      application_no: '',
      location: '',
      father_name: '',
      category: '',
      aadhar_status: '',
      saral_id: '',
      required_pump: '',
      pump_sub_type: '',
      pump_make: '',
      module_make: '',
      spv_capacity: '',
      sys_installed_date: '',
      total_pump_cost: '',
    }));
    clearErr('district');
    setVillages([]);
    setBeneficiaries([]);
    if (!d) return;

    try {
      const vList = await upComplaintService.getKusumBVillages(d);
      setVillages(vList);
    } catch {
      setVillages([]);
    }
  };

  const handleVillageChange = async (v: string) => {
    setForm((p) => ({ ...p, village: v, beneficiary_id: '', beneficiary_name: '' }));
    clearErr('village');
    setBeneficiaries([]);
    if (!v || !form.district) return;

    try {
      const list = await upComplaintService.getKusumBBeneficiaryNames(form.district, v);
      setBeneficiaries(list);
    } catch {
      setBeneficiaries([]);
    }
  };

  const handleBeneficiaryChange = async (bId: string) => {
    const chosen = beneficiaries.find((b) => String(b.id) === bId);
    setForm((p) => ({ ...p, beneficiary_id: bId, beneficiary_name: chosen ? chosen.name : bId }));
    clearErr('beneficiary_name');

    if (!bId) return;

    try {
      const det: UpKusumBDetails | null = await upComplaintService.getKusumBDetails(bId);
      if (det) {
        setForm((p) => ({
          ...p,
          gender: det.gender ? String(det.gender) : p.gender,
          contact_no: det.contact_no ? String(det.contact_no) : p.contact_no,
          application_no: det.application_no ? String(det.application_no) : p.application_no,
          location: det.location ? String(det.location) : p.location,
          father_name: det.father_name ? String(det.father_name) : p.father_name,
          category: det.category ? String(det.category) : p.category,
          aadhar_status: det.aadhar_status ? String(det.aadhar_status) : p.aadhar_status,
          saral_id: det.saral_id ? String(det.saral_id) : p.saral_id,
          required_pump: String(det.required_pump || det.pump_type || p.required_pump),
          pump_sub_type: det.pump_sub_type ? String(det.pump_sub_type) : p.pump_sub_type,
          pump_make: det.pump_make ? String(det.pump_make) : p.pump_make,
          module_make: det.module_make ? String(det.module_make) : p.module_make,
          spv_capacity: det.spv_capacity ? String(det.spv_capacity) : p.spv_capacity,
          sys_installed_date: det.sys_installed_date || det.installation_date ? String(det.sys_installed_date || det.installation_date).split('T')[0] : p.sys_installed_date,
          total_pump_cost: det.total_pump_cost ? String(det.total_pump_cost) : p.total_pump_cost,
        }));
      }
    } catch {}
  };

  const handleReset = () => {
    setForm(INITIAL_FORM);
    setFile(null);
    setErrors({});
    setVillages([]);
    setBeneficiaries([]);
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.district) errs.district = 'District is required.';
    if (!form.village) errs.village = 'Village is required.';
    if (!form.beneficiary_id && !form.beneficiary_name) errs.beneficiary_name = 'Beneficiary Name is required.';
    if (!form.gender) errs.gender = 'Gender is required.';
    if (!form.contact_no.trim()) errs.contact_no = 'Contact Number is required.';
    if (!form.application_no.trim()) errs.application_no = 'Application Number is required.';
    if (!form.complaint.trim()) errs.complaint = 'Complaint description is required.';
    if (!file) errs.document = 'Document / Photo is required.';

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
      if (form.beneficiary_name) {
        fd.append('f_name', form.beneficiary_name);
        fd.append('farmer_name', form.beneficiary_name);
      }
      if (form.beneficiary_id) {
        fd.append('farmer_id', form.beneficiary_id);
        fd.append('id', form.beneficiary_id);
      }
      if (form.contact_no) {
        fd.append('contact_number', form.contact_no);
        fd.append('f_mobile', form.contact_no);
      }
      if (file) {
        fd.append('document', file);
        fd.append('file', file);
      }

      const res = await upComplaintService.saveKusumBComplaint(fd);
      if (res.status) {
        setToast({ type: 'success', message: res.message || 'Complaint submitted successfully!' });
        handleReset();
        setTimeout(() => {
          navigate('/v/complaint/up/kusumb-view-complaint');
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
      title="Welcome to, Add UP Kusum B Complaint"
      subtitle="Register standalone solar pump maintenance & breakdown complaints"
      breadcrumbs={[
        { label: 'Home', href: '/v' },
        { label: 'View Vendor UP Kusum B Complaints', href: '/v/complaint/up/kusumb-view-complaint' },
        { label: 'Add UP Kusum B Complaint' },
      ]}
      viewLink="/v/complaint/up/kusumb-view-complaint"
      eyebrow="Kusum Component-B"
      formTitle="Add UP Kusum B Complaint"
      formSubtitle="Enter complaint information, select beneficiary farmer, and submit pump repair ticket across 4 dedicated sections."
      sections={SECTIONS}
      onSubmit={handleSubmit}
      onReset={handleReset}
      loading={loading}
      toast={toast}
    >
      {/* ── Section 1: Complaint & Beneficiary ── */}
      <div id="kb-sec-1" className="up-section-block">
        <SectionHeader num="1" total={4} title="Complaint Date & Beneficiary Lookup" desc="Pick the district, village and beneficiary to auto-fill the details below." />
        <div className="up-form-grid up-form-grid--3col">
          <FloatingInput id="kb-date" label="Complaint Date" type="date" required value={form.complaint_date} onChange={(v) => setVal('complaint_date', v)} />
          <FloatingSelect id="kb-district" label="District" required value={form.district} options={opts(districts)} onChange={handleDistrictChange} error={errors.district} />
          <FloatingSelect id="kb-village" label="Village" required disabled={!form.district} value={form.village} options={opts(villages)} onChange={handleVillageChange} error={errors.village} />
          <FloatingSelect
            id="kb-beneficiary"
            label="Beneficiary Name"
            required
            disabled={!form.village}
            value={form.beneficiary_id}
            options={beneficiaries.map((b) => ({ value: String(b.id), label: b.name }))}
            onChange={handleBeneficiaryChange}
            error={errors.beneficiary_name}
          />
        </div>
      </div>

      <hr className="up-section-divider" />

      {/* ── Section 2: Beneficiary Details ── */}
      <div id="kb-sec-2" className="up-section-block">
        <SectionHeader num="2" total={4} title="Beneficiary & Demographics" desc="Auto-populated from system record; editable if needed." />
        <div className="up-form-grid up-form-grid--3col">
          <FloatingSelect id="kb-gender" label="Gender" required options={opts(['Male', 'Female', 'Other'])} value={form.gender} onChange={(v) => setVal('gender', v)} error={errors.gender} />
          <FloatingInput id="kb-contact" label="Contact No." type="tel" required value={form.contact_no} onChange={(v) => setVal('contact_no', v)} error={errors.contact_no} />
          <FloatingInput id="kb-appno" label="Application No." required value={form.application_no} onChange={(v) => setVal('application_no', v)} error={errors.application_no} />
          <FloatingInput id="kb-location" label="Location" value={form.location} onChange={(v) => setVal('location', v)} />
          <FloatingInput id="kb-father" label="Father Name" value={form.father_name} onChange={(v) => setVal('father_name', v)} />
          <FloatingInput id="kb-category" label="Category" value={form.category} onChange={(v) => setVal('category', v)} />
          <FloatingInput id="kb-aadhar" label="Aadhar Status" value={form.aadhar_status} onChange={(v) => setVal('aadhar_status', v)} />
          <FloatingInput id="kb-saral" label="Saral ID" value={form.saral_id} onChange={(v) => setVal('saral_id', v)} />
        </div>
      </div>

      <hr className="up-section-divider" />

      {/* ── Section 3: Pump & Technical ── */}
      <div id="kb-sec-3" className="up-section-block">
        <SectionHeader num="3" total={4} title="Pump & Technical Specifications" desc="Auto-populated from system record; update if replacement or change occurred." />
        <div className="up-form-grid up-form-grid--3col">
          <FloatingInput id="kb-pump" label="Required Pump" value={form.required_pump} onChange={(v) => setVal('required_pump', v)} />
          <FloatingInput id="kb-pump-sub" label="Pump Sub Type" value={form.pump_sub_type} onChange={(v) => setVal('pump_sub_type', v)} />
          <FloatingInput id="kb-pump-make" label="Pump Make" value={form.pump_make} onChange={(v) => setVal('pump_make', v)} />
          <FloatingInput id="kb-module-make" label="Module Make" value={form.module_make} onChange={(v) => setVal('module_make', v)} />
          <FloatingInput id="kb-spv" label="SPV Capacity" value={form.spv_capacity} onChange={(v) => setVal('spv_capacity', v)} />
          <FloatingInput id="kb-installed" label="SYS Installed Date" type="date" value={form.sys_installed_date} onChange={(v) => setVal('sys_installed_date', v)} />
          <FloatingInput id="kb-cost" label="Total Pump Cost" value={form.total_pump_cost} onChange={(v) => setVal('total_pump_cost', v)} />
        </div>
      </div>

      <hr className="up-section-divider" />

      {/* ── Section 4: Complaint & Attachment ── */}
      <div id="kb-sec-4" className="up-section-block">
        <SectionHeader num="4" total={4} title="Complaint Description & Attachment" desc="Describe the problem and attach a document or site photo." />
        <div className="up-form-grid up-form-grid--3col">
          <FloatingFileInput id="kb-file" label="Upload Document / Photo" required file={file} onChange={setFile} error={errors.document} />
          <FloatingSelect id="kb-sms" label="Send SMS" value={form.sms} options={[{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }]} onChange={(v) => setVal('sms', v)} />
          <FloatingTextarea id="kb-text" label="Complaint" required className="ax-col--span-3" value={form.complaint} onChange={(v) => setVal('complaint', v)} error={errors.complaint} />
        </div>
      </div>
    </ComplaintFormLayout>
  );
}

export default UPComplaintKBAdd;
