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
  extractBackendError,
  formatMissingRequiredMsg,
  scrollToFirstError,
  type SectionItem,
} from '../CommonSharedComplaints';
import { getMediaUrl, upComplaintService, type UpKusumBDetails } from '../../up-services';
import { authService } from '../../../../../services/authService';

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
  sms: 'No',
};

type FormKey = keyof typeof INITIAL_FORM;

export function UPComplaintKBAdd() {
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

  // Hydrate form in Edit mode (?edit=<id>)
  useEffect(() => {
    if (!editId) return;
    let active = true;

    const applyRecord = async (rec: Record<string, any>) => {
      if (!active || !rec) return;
      const dist = String(rec.district || rec.f_district || '').trim();
      const village = String(rec.village || rec.f_village || '').trim();
      const bName = String(rec.beneficiary_name || rec.farmer_name || rec.f_name || '').trim();
      const bId = String(rec.kbid || rec.kb_id || rec.beneficiary_id || rec.farmer_id || bName || '').trim();
      const rawSms = String(rec.sms ?? rec.send_sms ?? 'No').trim().toLowerCase();

      if (rec.complaint_id) setComplaintCode(String(rec.complaint_id));
      setExistingFile(getMediaUrl(rec.document || rec.file || rec.file1) || '');
      setForm({
        complaint_date: formatDateForInput(rec.complaint_date || rec.created_date || rec.created_at) || getTodayFormatted(),
        district: dist,
        village,
        beneficiary_id: bId,
        beneficiary_name: bName,
        gender: String(rec.gender || ''),
        contact_no: String(rec.contact_no || rec.contact_number || rec.f_mobile || ''),
        application_no: String(rec.application_no || rec.app_no || ''),
        location: String(rec.location || ''),
        father_name: String(rec.father_name || rec.f_father_name || ''),
        category: String(rec.category || ''),
        aadhar_status: String(rec.aadhar_status || ''),
        saral_id: String(rec.saral_id || ''),
        required_pump: String(rec.required_pump || rec.pump_type || ''),
        pump_sub_type: String(rec.pump_sub_type || ''),
        pump_make: String(rec.pump_make || ''),
        module_make: String(rec.module_make || ''),
        spv_capacity: String(rec.spv_capacity || ''),
        sys_installed_date: formatDateForInput(rec.sys_installed || rec.sys_installed_date || rec.installation_date || rec.inst_date),
        total_pump_cost: String(rec.total_pumb_cost ?? rec.total_pump_cost ?? rec.pumb_cost ?? rec.pump_cost ?? ''),
        complaint: String(rec.complaint || ''),
        sms: rawSms === 'yes' || rawSms === '1' || rawSms === 'true' ? 'Yes' : 'No',
      });

      if (dist) {
        try {
          const vList = await upComplaintService.getKusumBVillages(dist);
          if (active) setVillages(vList);
        } catch {}
        if (village) {
          try {
            const bList = await upComplaintService.getKusumBBeneficiaryNames(dist, village);
            if (!active) return;
            const matched = bList.find((b) => String(b.id) === bId || b.name === bName);
            if (matched) {
              setBeneficiaries(bList);
              setForm((p) => ({
                ...p,
                beneficiary_id: String(matched.id),
                beneficiary_name: matched.name && matched.name !== bId ? matched.name : p.beneficiary_name || matched.name,
              }));
            } else if (bId || bName) {
              setBeneficiaries([{ id: bId || bName, name: bName || bId }, ...bList]);
            } else {
              setBeneficiaries(bList);
            }
          } catch {
            if (active && (bId || bName)) setBeneficiaries([{ id: bId || bName, name: bName || bId }]);
          }
        }
      }

      // If beneficiary name in edit mode was saved as raw ID (e.g. "1936"), auto-fetch details to resolve real name
      if (bId && (!bName || bName === bId || /^\d+$/.test(bName))) {
        upComplaintService
          .getKusumBDetails(bId, bName)
          .then((det) => {
            if (!active || !det) return;
            const realName = det.beneficiary_name || det.farmer_name || det.f_name || det.name;
            if (realName && realName !== bId) {
              setForm((p) => ({ ...p, beneficiary_name: String(realName) }));
            }
          })
          .catch(() => {});
      }
    };

    const stateRow = (location.state as any)?.editComplaint;
    if (stateRow) applyRecord(stateRow);

    upComplaintService
      .getKusumBEditComplaint(editId)
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
    const chosenName = chosen?.name && chosen.name !== bId ? chosen.name : '';
    setForm((p) => ({
      ...p,
      beneficiary_id: bId,
      beneficiary_name: chosenName || p.beneficiary_name || bId,
    }));
    clearErr('beneficiary_name');

    if (!bId) return;

    try {
      const det: UpKusumBDetails | null = await upComplaintService.getKusumBDetails(bId, chosen?.name);
      if (det) {
        const resolvedName =
          det.beneficiary_name ||
          det.farmer_name ||
          det.f_name ||
          det.name ||
          chosenName;
        const resolvedContact = det.contact_no || det.contact_number || det.f_mobile || det.mobile;
        const resolvedAppNo = det.application_no || det.app_no;
        const resolvedFather = det.father_name || det.f_father_name;
        const resolvedLocation = det.location || det.f_location || det.address;
        const resolvedCategory = det.category || det.caste;
        const resolvedAadhar = det.aadhar_status || det.aadhar_no || det.aadhar;
        const resolvedSaral = det.saral_id || det.saral_no;
        const resolvedPump = det.required_pump || det.pump_type || det.pump_capacity;
        const resolvedPumpSub = det.pump_sub_type || det.sub_type;
        const resolvedPumpMake = det.pump_make || det.make;
        const resolvedModuleMake = det.module_make;
        const resolvedSpv = det.spv_capacity;
        const rawInstDate = det.sys_installed || det.sys_installed_date || det.installation_date || det.inst_date;
        const resolvedCost = det.total_pumb_cost ?? det.total_pump_cost ?? det.pumb_cost ?? det.pump_cost;

        setForm((p) => ({
          ...p,
          beneficiary_name: resolvedName ? String(resolvedName) : p.beneficiary_name,
          gender: det.gender ? String(det.gender) : p.gender,
          contact_no: resolvedContact ? String(resolvedContact) : p.contact_no,
          application_no: resolvedAppNo ? String(resolvedAppNo) : p.application_no,
          location: resolvedLocation ? String(resolvedLocation) : p.location,
          father_name: resolvedFather ? String(resolvedFather) : p.father_name,
          category: resolvedCategory ? String(resolvedCategory) : p.category,
          aadhar_status: resolvedAadhar ? String(resolvedAadhar) : p.aadhar_status,
          saral_id: resolvedSaral ? String(resolvedSaral) : p.saral_id,
          required_pump: resolvedPump ? String(resolvedPump) : p.required_pump,
          pump_sub_type: resolvedPumpSub ? String(resolvedPumpSub) : p.pump_sub_type,
          pump_make: resolvedPumpMake ? String(resolvedPumpMake) : p.pump_make,
          module_make: resolvedModuleMake ? String(resolvedModuleMake) : p.module_make,
          spv_capacity: resolvedSpv ? String(resolvedSpv) : p.spv_capacity,
          sys_installed_date: rawInstDate ? String(rawInstDate).split('T')[0] : p.sys_installed_date,
          total_pump_cost: resolvedCost !== undefined && resolvedCost !== null && resolvedCost !== '' ? String(resolvedCost) : p.total_pump_cost,
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

  const validate = (): Record<string, string> => {
    const errs: Record<string, string> = {};
    if (!form.district) errs.district = 'District is required.';
    if (!form.village) errs.village = 'Village is required.';
    if (!form.beneficiary_id && !form.beneficiary_name) {
      errs.beneficiary_id = 'Please select a beneficiary.';
    }
    if (!form.beneficiary_name.trim()) {
      errs.beneficiary_name = 'Beneficiary Name is required.';
    }
    if (!form.gender) errs.gender = 'Gender is required.';
    if (!form.contact_no.trim()) errs.contact_no = 'Contact Number is required.';
    if (!form.application_no.trim()) errs.application_no = 'Application Number is required.';
    if (!form.complaint.trim()) errs.complaint = 'Complaint description is required.';
    if (!isEdit && !file) errs.document = 'Document / Photo is required.';

    setErrors(errs);
    return errs;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setToast(null);

    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      const missingMsg = formatMissingRequiredMsg(validationErrors);
      setToast({ type: 'error', message: missingMsg });
      setTimeout(() => scrollToFirstError(), 50);
      return;
    }

    setLoading(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => {
        if (v !== '' && v !== null && v !== undefined) fd.append(k, String(v));
      });

      // Beneficiary / Farmer ID & aliases
      const kbidVal = form.beneficiary_id || (form as any).kbid;
      if (kbidVal) {
        fd.set('kbid', String(kbidVal));
        fd.set('kb_id', String(kbidVal));
        fd.set('beneficiary_id', String(kbidVal));
        fd.set('farmer_id', String(kbidVal));
        if (!isEdit) fd.set('id', String(kbidVal));
      }

      // Edit Mode ID & complaint_id
      if (isEdit && editId) {
        fd.set('id', String(editId));
        if (complaintCode) {
          fd.set('complaint_id', complaintCode);
          fd.set('complaint_code', complaintCode);
        }
      }

      // SMS
      const smsVal = form.sms && String(form.sms).toLowerCase() === 'yes' ? 'Yes' : 'No';
      fd.set('sms', smsVal);
      fd.set('send_sms', smsVal === 'Yes' ? '1' : '0');

      // Beneficiary / Farmer Name aliases
      if (form.beneficiary_name) {
        fd.set('beneficiary_name', form.beneficiary_name.trim());
        fd.set('farmer_name', form.beneficiary_name.trim());
        fd.set('f_name', form.beneficiary_name.trim());
        fd.set('name', form.beneficiary_name.trim());
      }

      // Contact No aliases
      if (form.contact_no) {
        fd.set('contact_no', form.contact_no.trim());
        fd.set('contact_number', form.contact_no.trim());
        fd.set('f_mobile', form.contact_no.trim());
        fd.set('mobile', form.contact_no.trim());
      }

      // Father Name aliases
      if (form.father_name) {
        fd.set('father_name', form.father_name.trim());
        fd.set('f_father_name', form.father_name.trim());
      }

      // Application No aliases
      if (form.application_no) {
        fd.set('application_no', form.application_no.trim());
        fd.set('app_no', form.application_no.trim());
      }

      // Location
      if (form.location) {
        fd.set('location', form.location.trim());
      }

      // Category
      if (form.category) {
        fd.set('category', form.category.trim());
      }

      // Aadhar Status
      if (form.aadhar_status) {
        fd.set('aadhar_status', form.aadhar_status.trim());
      }

      // Saral ID
      if (form.saral_id) {
        fd.set('saral_id', form.saral_id.trim());
      }

      // Village & District aliases
      if (form.village) {
        fd.set('village', form.village.trim());
        fd.set('f_village', form.village.trim());
      }
      if (form.district) {
        fd.set('district', form.district.trim());
        fd.set('f_district', form.district.trim());
      }

      // Required Pump / Pump Type aliases
      if (form.required_pump) {
        fd.set('required_pump', form.required_pump.trim());
        fd.set('pump_type', form.required_pump.trim());
      }

      // SYS Installed Date (CRITICAL: Backend column is sys_installed!)
      if (form.sys_installed_date) {
        fd.set('sys_installed', form.sys_installed_date.trim());
        fd.set('sys_installed_date', form.sys_installed_date.trim());
        fd.set('installation_date', form.sys_installed_date.trim());
        fd.set('inst_date', form.sys_installed_date.trim());
      }

      // Total Pump Cost (CRITICAL: Backend column is total_pumb_cost with 'b'!)
      if (form.total_pump_cost) {
        fd.set('total_pumb_cost', form.total_pump_cost.trim());
        fd.set('total_pump_cost', form.total_pump_cost.trim());
        fd.set('pumb_cost', form.total_pump_cost.trim());
        fd.set('pump_cost', form.total_pump_cost.trim());
      }

      // Complaint Date / Created Date (CRITICAL: Backend column is created_date!)
      if (form.complaint_date) {
        fd.set('created_date', form.complaint_date.trim());
        fd.set('complaint_date', form.complaint_date.trim());
        fd.set('date', form.complaint_date.trim());
      }

      // State
      fd.set('state', 'up');

      // Vendor Name & Company ID
      const session = authService.getSession();
      const vName = session?.firm_name || session?.name || session?.vendor_name || '';
      if (vName) {
        fd.set('vendor_name', vName);
      }
      if (session?.company_id) {
        fd.set('company_id', String(session.company_id));
      }

      // File / Document upload
      if (file) {
        fd.set('document', file);
        fd.set('file', file);
        fd.set('file1', file);
      }

      const res =
        isEdit && editId
          ? await upComplaintService.updateKusumBComplaint(editId, fd)
          : await upComplaintService.saveKusumBComplaint(fd);
      if (res.status) {
        setToast({
          type: 'success',
          message: res.message || (isEdit ? 'Complaint updated successfully!' : 'Complaint submitted successfully!'),
        });
        if (!isEdit) handleReset();
        setTimeout(() => {
          navigate('/v/complaint/up/kusumb-view-complaint');
        }, 1200);
      } else {
        const extracted = extractBackendError(res, isEdit ? 'Failed to update complaint.' : 'Failed to submit complaint.');
        setErrors((prev) => ({ ...prev, ...extracted.fieldErrors }));
        setToast({ type: 'error', message: extracted.message });
        setTimeout(() => scrollToFirstError(), 50);
      }
    } catch (err: any) {
      const extracted = extractBackendError(err, 'Error occurred.');
      setToast({ type: 'error', message: extracted.message });
      if (extracted.fieldErrors && Object.keys(extracted.fieldErrors).length > 0) {
        setErrors((prev) => ({ ...prev, ...extracted.fieldErrors }));
        setTimeout(() => scrollToFirstError(), 50);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <ComplaintFormLayout
      title={isEdit ? 'Edit UP Kusum B Complaint' : 'Welcome to, Add UP Kusum B Complaint'}
      subtitle={isEdit ? 'Update standalone solar pump maintenance & breakdown complaint' : 'Register standalone solar pump maintenance & breakdown complaints'}
      breadcrumbs={[
        { label: 'Home', href: '/v' },
        { label: 'View Vendor UP Kusum B Complaints', href: '/v/complaint/up/kusumb-view-complaint' },
        { label: isEdit ? 'Edit UP Kusum B Complaint' : 'Add UP Kusum B Complaint' },
      ]}
      viewLink="/v/complaint/up/kusumb-view-complaint"
      eyebrow="Kusum Component-B"
      formTitle={isEdit ? `Edit UP Kusum B Complaint${complaintCode ? ` #${complaintCode}` : ''}` : 'Add UP Kusum B Complaint'}
      formSubtitle={isEdit ? 'Update complaint details and save changes.' : 'Enter complaint information, select beneficiary farmer, and submit pump repair ticket across 4 dedicated sections.'}
      sections={SECTIONS}
      onSubmit={handleSubmit}
      onReset={handleReset}
      loading={loading}
      submitLabel={isEdit ? 'Update Complaint' : 'Submit Complaint'}
      statusLabel={isEdit ? 'Edit Complaint' : 'New Complaint'}
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
            label="Select Beneficiary / Farmer"
            required
            disabled={!form.village}
            value={form.beneficiary_id}
            options={beneficiaries.map((b) => ({ value: String(b.id), label: b.name }))}
            onChange={handleBeneficiaryChange}
            error={errors.beneficiary_id || errors.beneficiary_name}
          />
        </div>
      </div>

      <hr className="up-section-divider" />

      {/* ── Section 2: Beneficiary Details ── */}
      <div id="kb-sec-2" className="up-section-block">
        <SectionHeader num="2" total={4} title="Beneficiary & Demographics" desc="Auto-populated from system record; editable if needed." />
        <div className="up-form-grid up-form-grid--3col">
          <FloatingInput
            id="kb-bname"
            label="Beneficiary Name"
            required
            value={form.beneficiary_name}
            onChange={(v) => setVal('beneficiary_name', v)}
            error={errors.beneficiary_name}
          />
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
          <FloatingFileInput id="kb-file" label="Upload Document / Photo" required={!isEdit} file={file} existingUrl={existingFile} onChange={setFile} error={errors.document} />
          <FloatingSelect id="kb-sms" label="Send SMS" value={form.sms} options={[{ value: 'Yes', label: 'Yes' }, { value: 'No', label: 'No' }]} onChange={(v) => setVal('sms', v)} />
          <FloatingTextarea id="kb-text" label="Complaint" required className="ax-col--span-3" value={form.complaint} onChange={(v) => setVal('complaint', v)} error={errors.complaint} />
        </div>
      </div>
    </ComplaintFormLayout>
  );
}

export default UPComplaintKBAdd;
