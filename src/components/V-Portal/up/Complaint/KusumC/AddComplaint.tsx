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
import { upComplaintService, type UpKusumCDetails } from '../../up-services';

const SECTIONS: SectionItem[] = [
  { id: 'kc-sec-1', num: '1', title: 'Date & Farmer' },
  { id: 'kc-sec-2', num: '2', title: 'Demographics' },
  { id: 'kc-sec-3', num: '3', title: 'Pump Specs' },
  { id: 'kc-sec-4', num: '4', title: 'Complaint & Files' },
];

const INITIAL_FORM = {
  complaint_date: getTodayFormatted(),
  district: '',
  post: '',
  village: '',
  farmer_id: '',
  farmer_name: '',
  father_name: '',
  contact_no: '',
  gender: '',
  category: '',
  aadhar_status: '',
  location: '',
  application_no: '',
  saral_id: '',
  pump_capacity: '',
  pump_type: '',
  pump_make: '',
  controller_make: '',
  module_make: '',
  spv_capacity: '',
  installation_date: '',
  complaint: '',
  sms: 'no',
};

type FormKey = keyof typeof INITIAL_FORM;

export function UPComplaintKCAdd() {
  const navigate = useNavigate();

  const [form, setForm] = useState(INITIAL_FORM);
  const [file, setFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const [districts, setDistricts] = useState<string[]>([]);
  const [posts, setPosts] = useState<string[]>([]);
  const [villages, setVillages] = useState<string[]>([]);
  const [farmers, setFarmers] = useState<{ id: string | number; name: string }[]>([]);

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
    upComplaintService.getKusumCAddData().then((res) => {
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
      post: '',
      village: '',
      farmer_id: '',
      farmer_name: '',
      father_name: '',
      contact_no: '',
      gender: '',
      category: '',
      aadhar_status: '',
      location: '',
      application_no: '',
      saral_id: '',
      pump_capacity: '',
      pump_type: '',
      pump_make: '',
      controller_make: '',
      module_make: '',
      spv_capacity: '',
      installation_date: '',
    }));
    clearErr('district');
    setPosts([]);
    setVillages([]);
    setFarmers([]);
    if (!d) return;

    try {
      const pList = await upComplaintService.getKusumCPosts(d);
      setPosts(pList);
    } catch {
      setPosts([]);
    }
  };

  const handlePostChange = async (post: string) => {
    setForm((p) => ({ ...p, post, village: '', farmer_id: '', farmer_name: '' }));
    clearErr('post');
    setVillages([]);
    setFarmers([]);
    if (!post || !form.district) return;

    try {
      const vList = await upComplaintService.getKusumCVillages(form.district, post);
      setVillages(vList);
    } catch {
      setVillages([]);
    }
  };

  const handleVillageChange = async (v: string) => {
    setForm((p) => ({ ...p, village: v, farmer_id: '', farmer_name: '' }));
    clearErr('village');
    setFarmers([]);
    if (!v || !form.district || !form.post) return;

    try {
      const list = await upComplaintService.getKusumCFarmerNames(form.district, form.post, v);
      setFarmers(list);
    } catch {
      setFarmers([]);
    }
  };

  const handleFarmerChange = async (fId: string) => {
    const chosen = farmers.find((f) => String(f.id) === fId);
    setForm((p) => ({ ...p, farmer_id: fId, farmer_name: chosen ? chosen.name : fId }));
    clearErr('farmer_name');

    if (!fId) return;

    try {
      const det: UpKusumCDetails | null = await upComplaintService.getKusumCDetails(fId);
      if (det) {
        setForm((p) => ({
          ...p,
          father_name: det.father_name || det.f_father_name ? String(det.father_name || det.f_father_name) : p.father_name,
          contact_no: det.contact_no || det.f_mobile ? String(det.contact_no || det.f_mobile) : p.contact_no,
          gender: det.gender ? String(det.gender) : p.gender,
          category: det.category ? String(det.category) : p.category,
          aadhar_status: det.aadhar_status ? String(det.aadhar_status) : p.aadhar_status,
          location: det.location ? String(det.location) : p.location,
          application_no: det.application_no ? String(det.application_no) : p.application_no,
          saral_id: det.saral_id ? String(det.saral_id) : p.saral_id,
          pump_capacity: det.pump_capacity ? String(det.pump_capacity) : p.pump_capacity,
          pump_type: det.pump_type ? String(det.pump_type) : p.pump_type,
          pump_make: det.pump_make ? String(det.pump_make) : p.pump_make,
          controller_make: det.controller_make ? String(det.controller_make) : p.controller_make,
          module_make: det.module_make ? String(det.module_make) : p.module_make,
          spv_capacity: det.spv_capacity ? String(det.spv_capacity) : p.spv_capacity,
          installation_date: det.installation_date ? String(det.installation_date).split('T')[0] : p.installation_date,
        }));
      }
    } catch {}
  };

  const handleReset = () => {
    setForm(INITIAL_FORM);
    setFile(null);
    setErrors({});
    setPosts([]);
    setVillages([]);
    setFarmers([]);
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.district) errs.district = 'District is required.';
    if (!form.post) errs.post = 'Post is required.';
    if (!form.village) errs.village = 'Village is required.';
    if (!form.farmer_id && !form.farmer_name) errs.farmer_name = 'Farmer Name is required.';
    if (!form.contact_no.trim()) errs.contact_no = 'Contact Number is required.';
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
      if (form.farmer_name) {
        fd.append('f_name', form.farmer_name);
        fd.append('beneficiary_name', form.farmer_name);
      }
      if (form.father_name) {
        fd.append('f_father_name', form.father_name);
      }
      if (form.contact_no) {
        fd.append('f_mobile', form.contact_no);
        fd.append('contact_number', form.contact_no);
      }
      if (file) {
        fd.append('document', file);
        fd.append('file', file);
      }

      const res = await upComplaintService.saveKusumCComplaint(fd);
      if (res.status) {
        setToast({ type: 'success', message: res.message || 'Complaint submitted successfully!' });
        handleReset();
        setTimeout(() => {
          navigate('/v/complaint/up/kusumc-view-complaint');
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
      title="Add UP Kusum C Complaint"
      subtitle="Register PM Kusum Component-C solar agriculture pump breakdown complaints"
      breadcrumbs={[
        { label: 'Home', href: '/v' },
        { label: 'View Vendor UP Kusum C Complaints', href: '/v/complaint/up/kusumc-view-complaint' },
        { label: 'Add UP Kusum C Complaint' },
      ]}
      viewLink="/v/complaint/up/kusumc-view-complaint"
      eyebrow="Kusum Component-C"
      formTitle="Add UP Kusum C Complaint"
      formSubtitle="Enter complaint information, select beneficiary farmer, and submit pump repair ticket across 4 sections."
      sections={SECTIONS}
      onSubmit={handleSubmit}
      onReset={handleReset}
      loading={loading}
      toast={toast}
    >
      {/* ── Section 1: Date & Farmer ── */}
      <div id="kc-sec-1" className="up-section-block">
        <SectionHeader num="1" total={4} title="Complaint Date & Farmer Lookup" desc="Select District, Post, Village, and Farmer to auto-populate existing records." />
        <div className="up-form-grid up-form-grid--3col">
          <FloatingInput id="kc-date" label="Complaint Date" type="date" required value={form.complaint_date} onChange={(v) => setVal('complaint_date', v)} />
          <FloatingSelect id="kc-district" label="District" required value={form.district} options={opts(districts)} onChange={handleDistrictChange} error={errors.district} />
          <FloatingSelect id="kc-post" label="Post" required disabled={!form.district} value={form.post} options={opts(posts)} onChange={handlePostChange} error={errors.post} />
          <FloatingSelect id="kc-village" label="Village" required disabled={!form.post} value={form.village} options={opts(villages)} onChange={handleVillageChange} error={errors.village} />
          <FloatingSelect
            id="kc-farmer"
            label="Farmer Name"
            required
            disabled={!form.village}
            value={form.farmer_id}
            options={farmers.map((f) => ({ value: String(f.id), label: f.name }))}
            onChange={handleFarmerChange}
            error={errors.farmer_name}
          />
        </div>
      </div>

      <hr className="up-section-divider" />

      {/* ── Section 2: Demographics ── */}
      <div id="kc-sec-2" className="up-section-block">
        <SectionHeader num="2" total={4} title="Farmer Demographics" desc="Auto-populated beneficiary details; editable if updated." />
        <div className="up-form-grid up-form-grid--3col">
          <FloatingInput id="kc-father" label="Father Name" value={form.father_name} onChange={(v) => setVal('father_name', v)} />
          <FloatingInput id="kc-contact" label="Contact No." type="tel" required value={form.contact_no} onChange={(v) => setVal('contact_no', v)} error={errors.contact_no} />
          <FloatingSelect id="kc-gender" label="Gender" options={opts(['Male', 'Female', 'Other'])} value={form.gender} onChange={(v) => setVal('gender', v)} />
          <FloatingInput id="kc-cat" label="Category" value={form.category} onChange={(v) => setVal('category', v)} />
          <FloatingInput id="kc-aadhar" label="Aadhar Status" value={form.aadhar_status} onChange={(v) => setVal('aadhar_status', v)} />
          <FloatingInput id="kc-loc" label="Location" value={form.location} onChange={(v) => setVal('location', v)} />
          <FloatingInput id="kc-appno" label="Application No." value={form.application_no} onChange={(v) => setVal('application_no', v)} />
          <FloatingInput id="kc-saral" label="Saral ID" value={form.saral_id} onChange={(v) => setVal('saral_id', v)} />
        </div>
      </div>

      <hr className="up-section-divider" />

      {/* ── Section 3: Pump Specs ── */}
      <div id="kc-sec-3" className="up-section-block">
        <SectionHeader num="3" total={4} title="Pump & Technical Specifications" desc="Equipment specifications from site records." />
        <div className="up-form-grid up-form-grid--3col">
          <FloatingInput id="kc-cap" label="Pump Capacity" value={form.pump_capacity} onChange={(v) => setVal('pump_capacity', v)} />
          <FloatingInput id="kc-type" label="Pump Type" value={form.pump_type} onChange={(v) => setVal('pump_type', v)} />
          <FloatingInput id="kc-pmake" label="Pump Make" value={form.pump_make} onChange={(v) => setVal('pump_make', v)} />
          <FloatingInput id="kc-cmake" label="Controller Make" value={form.controller_make} onChange={(v) => setVal('controller_make', v)} />
          <FloatingInput id="kc-mmake" label="Module Make" value={form.module_make} onChange={(v) => setVal('module_make', v)} />
          <FloatingInput id="kc-spv" label="SPV Capacity" value={form.spv_capacity} onChange={(v) => setVal('spv_capacity', v)} />
          <FloatingInput id="kc-inst" label="Installation Date" type="date" value={form.installation_date} onChange={(v) => setVal('installation_date', v)} />
        </div>
      </div>

      <hr className="up-section-divider" />

      {/* ── Section 4: Complaint & Files ── */}
      <div id="kc-sec-4" className="up-section-block">
        <SectionHeader num="4" total={4} title="Complaint Description & Attachment" desc="Describe the fault and attach photo/document." />
        <div className="up-form-grid up-form-grid--3col">
          <FloatingFileInput id="kc-file" label="Upload Document / Photo" required file={file} onChange={setFile} error={errors.document} />
          <FloatingSelect id="kc-sms" label="Send SMS" value={form.sms} options={[{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }]} onChange={(v) => setVal('sms', v)} />
          <FloatingTextarea id="kc-text" label="Complaint" required className="ax-col--span-3" value={form.complaint} onChange={(v) => setVal('complaint', v)} error={errors.complaint} />
        </div>
      </div>
    </ComplaintFormLayout>
  );
}

export default UPComplaintKCAdd;
