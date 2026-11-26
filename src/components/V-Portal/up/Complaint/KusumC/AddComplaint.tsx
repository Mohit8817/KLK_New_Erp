import { useEffect, useState, type FormEvent } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import {
  ComplaintFormLayout,
  FloatingInput,
  FloatingSelect,
  FloatingTextarea,
  FloatingFileInput,
  SectionHeader,
  opts,
  getTodayFormatted,
  formatDateForInput,
  type SectionItem,
} from '../CommonSharedComplaints';
import { getMediaUrl, upComplaintService, type UpKusumCDetails } from '../../up-services';

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
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('edit');
  const isEdit = Boolean(editId);

  const [form, setForm] = useState(INITIAL_FORM);
  const [complaintCode, setComplaintCode] = useState('');
  const [existingFile, setExistingFile] = useState('');
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

  // Hydrate form in Edit mode (?edit=<id>)
  useEffect(() => {
    if (!editId) return;
    let active = true;

    const applyRecord = async (rec: Record<string, any>) => {
      if (!active || !rec) return;
      const dist = String(rec.district || rec.f_district || '').trim();
      const post = String(rec.post || rec.f_post || '').trim();
      const village = String(rec.village || rec.f_village || '').trim();
      const fName = String(rec.farmer_name || rec.f_name || rec.beneficiary_name || '').trim();
      const fKcid = String(rec.kcid || rec.kc_id || rec.farmer_id || fName || '').trim();
      const rawSms = String(rec.sms ?? rec.send_sms ?? 'No').trim().toLowerCase();

      if (rec.complaint_id) setComplaintCode(String(rec.complaint_id));
      setExistingFile(getMediaUrl(rec.document || rec.file || rec.file1) || '');
      setForm((p) => ({
        ...p,
        complaint_date: formatDateForInput(rec.complaint_date || rec.created_date || rec.created_at) || getTodayFormatted(),
        district: dist,
        post,
        village,
        farmer_id: fKcid,
        kcid: fKcid,
        farmer_name: fName,
        father_name: String(rec.father_name || rec.f_father_name || ''),
        contact_no: String(rec.contact_no || rec.contact_number || rec.f_contact || rec.f_mobile || ''),
        lot_no: String(rec.lot_no || ''),
        invoice_no: String(rec.invoice_no || rec.f_invoice_no || ''),
        pump_capacity: String(rec.pump_capacity || rec.pump_capicity || rec.spv_capacity || ''),
        installation_date: formatDateForInput(rec.installation_date || rec.inst_date),
        contractor_name: String(rec.contractor_name || rec.c_contractor_name || ''),
        contractor_no: String(rec.contractor_no || rec.contractor_mo_no || rec.contractor_mobile_no || rec.c_contact_no || ''),
        complaint: String(rec.complaint || ''),
        sms: rawSms === 'yes' || rawSms === '1' || rawSms === 'true' ? 'Yes' : 'No',
      }));

      if (dist) {
        try {
          const pList = await upComplaintService.getKusumCPosts(dist);
          if (active) setPosts(pList);
        } catch {}
        if (post) {
          try {
            const vList = await upComplaintService.getKusumCVillages(dist, post);
            if (active) setVillages(vList);
          } catch {}
          if (village) {
            try {
              const fList = await upComplaintService.getKusumCFarmerNames(dist, post, village);
              if (!active) return;
              const matched = fList.find((f) => String(f.id) === fKcid || f.name === fName);
              if (matched) {
                setFarmers(fList);
                setForm((p) => ({ ...p, farmer_id: String(matched.id), farmer_name: matched.name }));
              } else if (fKcid || fName) {
                setFarmers([{ id: fKcid || fName, name: fName || fKcid }, ...fList]);
              } else {
                setFarmers(fList);
              }
            } catch {
              if (active && (fKcid || fName)) setFarmers([{ id: fKcid || fName, name: fName || fKcid }]);
            }
          }
        }
      }
    };

    const stateRow = (location.state as any)?.editComplaint;
    if (stateRow) applyRecord(stateRow);

    upComplaintService
      .getKusumCEditComplaint(editId)
      .then((fresh) => {
        if (active && fresh) applyRecord({ ...(stateRow || {}), ...fresh });
      })
      .catch(() => {});

    return () => {
      active = false;
    };
  }, [editId, location.state]);

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
      const det: UpKusumCDetails | null = await upComplaintService.getKusumCDetails(fId, chosen?.name);
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
    if (!isEdit && !file) errs.document = 'Document / Photo is required.';

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
        if (!isEdit) fd.set('id', String(kcidVal));
      }
      if (isEdit && editId) {
        fd.set('id', String(editId));
        if (complaintCode) fd.set('complaint_id', complaintCode);
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

      const res =
        isEdit && editId
          ? await upComplaintService.updateKusumCComplaint(editId, fd)
          : await upComplaintService.saveKusumCComplaint(fd);
      if (res.status) {
        setToast({
          type: 'success',
          message: res.message || (isEdit ? 'Complaint updated successfully!' : 'Complaint submitted successfully!'),
        });
        if (!isEdit) handleReset();
        setTimeout(() => {
          navigate('/v/complaint/up/swp-view-complaint');
        }, 1200);
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
          setToast({ type: 'error', message: res.message || (isEdit ? 'Failed to update complaint.' : 'Failed to submit complaint.') });
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
      title={isEdit ? 'Edit UP Kusum C Complaint' : 'Add UP Kusum C Complaint'}
      subtitle={isEdit ? 'Update PM Kusum Component-C solar agriculture pump breakdown complaint' : 'Register PM Kusum Component-C solar agriculture pump breakdown complaints'}
      breadcrumbs={[
        { label: 'Home', href: '/v' },
        { label: 'View Vendor UP Kusum C Complaints', href: '/v/complaint/up/swp-view-complaint' },
        { label: isEdit ? 'Edit UP Kusum C Complaint' : 'Add UP Kusum C Complaint' },
      ]}
      viewLink="/v/complaint/up/swp-view-complaint"
      eyebrow="Kusum Component-C"
      formTitle={isEdit ? `Edit UP Kusum C Complaint${complaintCode ? ` #${complaintCode}` : ''}` : 'Add UP Kusum C Complaint'}
      formSubtitle={isEdit ? 'Update complaint details and save changes.' : 'Enter complaint information, select beneficiary farmer, and submit pump repair ticket across 4 sections.'}
      sections={SECTIONS}
      onSubmit={handleSubmit}
      onReset={handleReset}
      loading={loading}
      submitLabel={isEdit ? 'Update Complaint' : 'Submit Complaint'}
      statusLabel={isEdit ? 'Edit Complaint' : 'New Complaint'}
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
          <FloatingFileInput id="kc-file" label="Upload Document / Photo" required={!isEdit} file={file} existingUrl={existingFile} onChange={setFile} error={errors.document} />
          <FloatingSelect id="kc-sms" label="Send SMS" value={form.sms} options={[{ value: 'Yes', label: 'Yes' }, { value: 'No', label: 'No' }]} onChange={(v) => setVal('sms', v)} />
          <FloatingTextarea id="kc-text" label="Complaint" required className="ax-col--span-3" value={form.complaint} onChange={(v) => setVal('complaint', v)} error={errors.complaint} />
        </div>
      </div>
    </ComplaintFormLayout>
  );
}

export default UPComplaintKCAdd;
