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
  { id: 'kc-sec-2', num: '2', title: 'Farmer & Allotment' },
  { id: 'kc-sec-3', num: '3', title: 'Pump & Contractor' },
  { id: 'kc-sec-4', num: '4', title: 'Complaint & Files' },
];

const INITIAL_FORM = {
  complaint_date: getTodayFormatted(),
  district: '',
  post: '',
  village: '',
  farmer_id: '',
  kcid: '',
  farmer_name: '',
  father_name: '',
  contact_no: '',
  lot_no: '',
  invoice_no: '',
  pump_capacity: '',
  installation_date: '',
  contractor_name: '',
  contractor_no: '',
  complaint: '',
  sms: 'No',
  // Optional / backwards-compatibility fields
  gender: '',
  category: '',
  aadhar_status: '',
  location: '',
  application_no: '',
  saral_id: '',
  pump_type: '',
  pump_make: '',
  controller_make: '',
  module_make: '',
  spv_capacity: '',
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
      kcid: '',
      farmer_name: '',
      father_name: '',
      contact_no: '',
      lot_no: '',
      invoice_no: '',
      pump_capacity: '',
      installation_date: '',
      contractor_name: '',
      contractor_no: '',
      gender: '',
      category: '',
      aadhar_status: '',
      location: '',
      application_no: '',
      saral_id: '',
      pump_type: '',
      pump_make: '',
      controller_make: '',
      module_make: '',
      spv_capacity: '',
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
    setForm((p) => ({
      ...p,
      post,
      village: '',
      farmer_id: '',
      kcid: '',
      farmer_name: '',
      father_name: '',
      contact_no: '',
      lot_no: '',
      invoice_no: '',
      pump_capacity: '',
      installation_date: '',
      contractor_name: '',
      contractor_no: '',
    }));
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
    setForm((p) => ({
      ...p,
      village: v,
      farmer_id: '',
      kcid: '',
      farmer_name: '',
      father_name: '',
      contact_no: '',
      lot_no: '',
      invoice_no: '',
      pump_capacity: '',
      installation_date: '',
      contractor_name: '',
      contractor_no: '',
    }));
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
    const resolvedKcid = (chosen as any)?.kcid || (chosen as any)?.kc_id || (chosen as any)?.id || fId;
    setForm((p) => ({
      ...p,
      farmer_id: fId,
      kcid: String(resolvedKcid),
      farmer_name: chosen ? chosen.name : fId,
    }));
    clearErr('farmer_name');

    if (!fId) return;

    try {
      const det: UpKusumCDetails | null = await upComplaintService.getKusumCDetails(fId);
      if (det) {
        const finalKcid = det.kcid || det.kc_id || det.id || resolvedKcid;
        const farmerName = det.farmer_name || det.f_name || det.beneficiary_name || det.name || (chosen ? chosen.name : fId);
        const fatherName = det.f_father_name ?? det.father_name ?? '';
        const contactNo = det.f_contact ?? det.contact_no ?? det.f_mobile ?? det.contact_number ?? det.mobile ?? '';
        const lotNo = det.lot_no ?? '';
        const invoiceNo = det.f_invoice_no ?? det.invoice_no ?? '';
        const pumpCapacity = det.pump_capacity ?? det.pump_capicity ?? det.spv_capacity ?? '';
        const contractorName = det.c_contractor_name ?? det.contractor_name ?? '';
        const contractorNo = det.c_contact_no ?? det.contractor_no ?? det.contractor_mo_no ?? det.contractor_mobile_no ?? '';
        const rawInstDate = det.inst_date ?? det.installation_date ?? det.date_of_installation ?? '';
        const installationDate = rawInstDate ? String(rawInstDate).split('T')[0] : '';

        setForm((p) => ({
          ...p,
          kcid: String(finalKcid),
          farmer_id: String(det.farmer_id || det.id || fId),
          farmer_name: farmerName || p.farmer_name,
          father_name: fatherName !== '' ? String(fatherName) : p.father_name,
          contact_no: contactNo !== '' ? String(contactNo) : p.contact_no,
          lot_no: lotNo !== '' ? String(lotNo) : p.lot_no,
          invoice_no: invoiceNo !== '' ? String(invoiceNo) : p.invoice_no,
          pump_capacity: pumpCapacity !== '' ? String(pumpCapacity) : p.pump_capacity,
          installation_date: installationDate !== '' ? installationDate : p.installation_date,
          contractor_name: contractorName !== '' ? String(contractorName) : p.contractor_name,
          contractor_no: contractorNo !== '' ? String(contractorNo) : p.contractor_no,
          // Optional/backwards-compatible fields
          gender: det.gender ? String(det.gender) : p.gender,
          category: det.category ? String(det.category) : p.category,
          aadhar_status: det.aadhar_status ? String(det.aadhar_status) : p.aadhar_status,
          location: det.location ? String(det.location) : p.location,
          application_no: det.application_no ? String(det.application_no) : p.application_no,
          saral_id: det.saral_id ? String(det.saral_id) : p.saral_id,
          pump_type: det.pump_type ? String(det.pump_type) : p.pump_type,
          pump_make: det.pump_make ? String(det.pump_make) : p.pump_make,
          controller_make: det.controller_make ? String(det.controller_make) : p.controller_make,
          module_make: det.module_make ? String(det.module_make) : p.module_make,
          spv_capacity: det.spv_capacity ? String(det.spv_capacity) : p.spv_capacity,
        }));

        if (contactNo) clearErr('contact_no');
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

      const kcidVal = form.kcid || form.farmer_id;
      if (kcidVal) {
        fd.set('kcid', String(kcidVal));
        fd.set('kc_id', String(kcidVal));
        fd.set('farmer_id', String(kcidVal));
        fd.set('beneficiary_id', String(kcidVal));
        fd.set('id', String(kcidVal));
      }

      const smsVal = form.sms && String(form.sms).toLowerCase() === 'yes' ? 'Yes' : 'No';
      fd.set('sms', smsVal);
      fd.set('send_sms', smsVal === 'Yes' ? '1' : '0');

      if (form.farmer_name) {
        fd.append('f_name', form.farmer_name);
        fd.append('beneficiary_name', form.farmer_name);
      }
      if (form.father_name) {
        fd.append('f_father_name', form.father_name);
      }
      if (form.contact_no) {
        fd.append('f_contact', form.contact_no);
        fd.append('f_mobile', form.contact_no);
        fd.append('contact_number', form.contact_no);
      }
      if (form.lot_no) {
        fd.append('lot_no', form.lot_no);
      }
      if (form.invoice_no) {
        fd.append('f_invoice_no', form.invoice_no);
        fd.append('invoice_no', form.invoice_no);
      }
      if (form.pump_capacity) {
        fd.append('pump_capicity', form.pump_capacity);
        fd.append('pump_capacity', form.pump_capacity);
      }
      if (form.contractor_name) {
        fd.append('c_contractor_name', form.contractor_name);
        fd.append('contractor_name', form.contractor_name);
      }
      if (form.contractor_no) {
        fd.append('c_contact_no', form.contractor_no);
        fd.append('contractor_no', form.contractor_no);
        fd.append('contractor_mo_no', form.contractor_no);
        fd.append('contractor_mobile_no', form.contractor_no);
      }
      if (form.installation_date) {
        fd.append('inst_date', form.installation_date);
        fd.append('installation_date', form.installation_date);
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
          navigate('/v/complaint/up/swp-view-complaint');
        }, 1500);
      } else {
        if (res.errors) {
          const mapped: Record<string, string> = {};
          Object.entries(res.errors).forEach(([k, v]) => {
            mapped[k] = Array.isArray(v) ? v[0] : String(v);
          });
          setErrors(mapped);
          const firstErr = Object.values(mapped)[0];
          setToast({ type: 'error', message: firstErr || res.message || 'Validation failed.' });
        } else {
          setToast({ type: 'error', message: res.message || 'Failed to submit complaint.' });
        }
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
        { label: 'View Vendor UP Kusum C Complaints', href: '/v/complaint/up/swp-view-complaint' },
        { label: 'Add UP Kusum C Complaint' },
      ]}
      viewLink="/v/complaint/up/swp-view-complaint"
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

      {/* ── Section 2: Farmer & Allotment ── */}
      <div id="kc-sec-2" className="up-section-block">
        <SectionHeader num="2" total={4} title="Farmer Demographics & Allotment" desc="Auto-populated beneficiary details & allotment information; editable if updated." />
        <div className="up-form-grid up-form-grid--4col">
          <FloatingInput id="kc-father" label="Father Name" value={form.father_name} onChange={(v) => setVal('father_name', v)} />
          <FloatingInput id="kc-contact" label="Contact No." type="tel" required value={form.contact_no} onChange={(v) => setVal('contact_no', v)} error={errors.contact_no} />
          <FloatingInput id="kc-lot" label="Lot No." value={form.lot_no} onChange={(v) => setVal('lot_no', v)} />
          <FloatingInput id="kc-invoice" label="Invoice No." value={form.invoice_no} onChange={(v) => setVal('invoice_no', v)} />
        </div>
      </div>

      <hr className="up-section-divider" />

      {/* ── Section 3: Pump & Contractor Specifications ── */}
      <div id="kc-sec-3" className="up-section-block">
        <SectionHeader num="3" total={4} title="Pump & Contractor Specifications" desc="Pump capacity, installation date, and assigned contractor details." />
        <div className="up-form-grid up-form-grid--4col">
          <FloatingInput id="kc-cap" label="Pump Capacity" value={form.pump_capacity} onChange={(v) => setVal('pump_capacity', v)} />
          <FloatingInput id="kc-inst" label="Installation Date" type="date" value={form.installation_date} onChange={(v) => setVal('installation_date', v)} />
          <FloatingInput id="kc-cname" label="Contractor Name" value={form.contractor_name} onChange={(v) => setVal('contractor_name', v)} />
          <FloatingInput id="kc-cno" label="Contractor Contact No." type="tel" value={form.contractor_no} onChange={(v) => setVal('contractor_no', v)} />
        </div>
      </div>

      <hr className="up-section-divider" />

      {/* ── Section 4: Complaint & Files ── */}
      <div id="kc-sec-4" className="up-section-block">
        <SectionHeader num="4" total={4} title="Complaint Description & Attachment" desc="Describe the fault and attach photo/document." />
        <div className="up-form-grid up-form-grid--3col">
          <FloatingFileInput id="kc-file" label="Upload Document / Photo" required file={file} onChange={setFile} error={errors.document} />
          <FloatingSelect id="kc-sms" label="Send SMS" value={form.sms} options={[{ value: 'Yes', label: 'Yes' }, { value: 'No', label: 'No' }]} onChange={(v) => setVal('sms', v)} />
          <FloatingTextarea id="kc-text" label="Complaint" required className="ax-col--span-3" value={form.complaint} onChange={(v) => setVal('complaint', v)} error={errors.complaint} />
        </div>
      </div>
    </ComplaintFormLayout>
  );
}

export default UPComplaintKCAdd;
