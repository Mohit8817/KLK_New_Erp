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
import { upComplaintService, type UpOffgridDetails } from '../../up-services';

const SECTIONS: SectionItem[] = [
  { id: 'og-sec-1', num: '1', title: 'District & Beneficiary' },
  { id: 'og-sec-2', num: '2', title: 'Plant & Work Order' },
  { id: 'og-sec-3', num: '3', title: 'Complaint & File' },
];

const INITIAL_FORM = {
  complaint_date: getTodayFormatted(),
  district: '',
  ogid: '',
  beneficiary_name: '',
  contact_no: '',
  plant_capacity: '',
  wo_no: '',
  wo_date: '',
  contractor_name: '',
  complaint: '',
  sms: 'No',
};

type FormKey = keyof typeof INITIAL_FORM;

export function UPComplaintOffgridAdd() {
  const navigate = useNavigate();

  const [form, setForm] = useState(INITIAL_FORM);
  const [file, setFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const [districts, setDistricts] = useState<string[]>([]);
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
    upComplaintService.getOffgridAddData().then((res) => {
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
      ogid: '',
      beneficiary_name: '',
      contact_no: '',
      plant_capacity: '',
      wo_no: '',
      wo_date: '',
      contractor_name: '',
    }));
    clearErr('district');
    setBeneficiaries([]);
    if (!d) return;

    try {
      const list = await upComplaintService.getOffgridBeneficiaryNames(d);
      setBeneficiaries(list);
    } catch {
      setBeneficiaries([]);
    }
  };

  const handleBeneficiaryChange = async (idOrName: string) => {
    const chosen = beneficiaries.find((b) => String(b.id) === idOrName);
    setForm((p) => ({ ...p, ogid: idOrName, beneficiary_name: chosen ? chosen.name : idOrName }));
    clearErr('beneficiary_name');

    if (!idOrName) return;

    try {
      const det: UpOffgridDetails | null = await upComplaintService.getOffgridDetails(idOrName);
      if (det) {
        setForm((p) => ({
          ...p,
          contact_no: det.contact_no ? String(det.contact_no) : p.contact_no,
          plant_capacity: det.plant_capacity ? String(det.plant_capacity) : p.plant_capacity,
          wo_no: det.wo_no || det.work_order_no ? String(det.wo_no || det.work_order_no) : p.wo_no,
          wo_date: det.wo_date || det.work_order_date ? String(det.wo_date || det.work_order_date).split('T')[0] : p.wo_date,
          contractor_name: det.contractor_name ? String(det.contractor_name) : p.contractor_name,
        }));
      }
    } catch {}
  };

  const handleReset = () => {
    setForm(INITIAL_FORM);
    setFile(null);
    setErrors({});
    setBeneficiaries([]);
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.district) errs.district = 'District is required.';
    if (!form.ogid && !form.beneficiary_name) errs.beneficiary_name = 'Beneficiary Name is required.';
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
      if (form.ogid) {
        fd.append('beneficiary_id', form.ogid);
        fd.append('id', form.ogid);
      }
      if (form.wo_no) fd.append('work_order_no', form.wo_no);
      if (form.wo_date) fd.append('work_order_date', form.wo_date);
      if (form.contact_no) fd.append('contact_number', form.contact_no);
      if (file) {
        fd.append('document', file);
        fd.append('file', file);
      }

      const res = await upComplaintService.saveOffgridComplaint(fd);
      if (res.status) {
        setToast({ type: 'success', message: res.message || 'Offgrid Complaint submitted successfully!' });
        handleReset();
        setTimeout(() => {
          navigate('/v/complaint/up/offgrid-view-complaint');
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
      title="Add UP Offgrid Complaint"
      subtitle="Register standalone offgrid solar home system and power pack breakdown complaints"
      breadcrumbs={[
        { label: 'Home', href: '/v' },
        { label: 'View Vendor UP Offgrid Complaints', href: '/v/complaint/up/offgrid-view-complaint' },
        { label: 'Add UP Offgrid Complaint' },
      ]}
      viewLink="/v/complaint/up/offgrid-view-complaint"
      eyebrow="Offgrid Solar Power"
      formTitle="Add UP Offgrid Complaint"
      formSubtitle="Enter beneficiary location, equipment details, and problem description across 3 sections."
      sections={SECTIONS}
      onSubmit={handleSubmit}
      onReset={handleReset}
      loading={loading}
      toast={toast}
    >
      {/* ── Section 1: District & Beneficiary ── */}
      <div id="og-sec-1" className="up-section-block">
        <SectionHeader num="1" total={3} title="District & Beneficiary Selection" desc="Pick the district to find eligible Offgrid system beneficiaries." />
        <div className="up-form-grid up-form-grid--3col">
          <FloatingInput id="og-date" label="Complaint Date" type="date" required value={form.complaint_date} onChange={(v) => setVal('complaint_date', v)} />
          <FloatingSelect id="og-district" label="District" required value={form.district} options={opts(districts)} onChange={handleDistrictChange} error={errors.district} />
          <FloatingSelect
            id="og-ben"
            label="Beneficiary Name"
            required
            disabled={!form.district}
            value={form.ogid}
            options={beneficiaries.map((b) => ({ value: String(b.id), label: b.name }))}
            onChange={handleBeneficiaryChange}
            error={errors.beneficiary_name}
          />
        </div>
      </div>

      <hr className="up-section-divider" />

      {/* ── Section 2: Plant & Work Order ── */}
      <div id="og-sec-2" className="up-section-block">
        <SectionHeader num="2" total={3} title="Plant & Work Order Details" desc="Auto-populated from installation records." />
        <div className="up-form-grid up-form-grid--3col">
          <FloatingInput id="og-contact" label="Contact No." type="tel" required value={form.contact_no} onChange={(v) => setVal('contact_no', v)} error={errors.contact_no} />
          <FloatingInput id="og-cap" label="Plant Capacity" value={form.plant_capacity} onChange={(v) => setVal('plant_capacity', v)} />
          <FloatingInput id="og-wo" label="Work Order No." value={form.wo_no} onChange={(v) => setVal('wo_no', v)} />
          <FloatingInput id="og-wodate" label="Work Order Date" type="date" value={form.wo_date} onChange={(v) => setVal('wo_date', v)} />
          <FloatingInput id="og-cont" label="Contractor Name" value={form.contractor_name} onChange={(v) => setVal('contractor_name', v)} />
        </div>
      </div>

      <hr className="up-section-divider" />

      {/* ── Section 3: Complaint & File ── */}
      <div id="og-sec-3" className="up-section-block">
        <SectionHeader num="3" total={3} title="Complaint Description & Supporting File" desc="Detail the fault and upload photographic proof." />
        <div className="up-form-grid up-form-grid--3col">
          <FloatingFileInput id="og-file" label="Upload Document / Photo" required file={file} onChange={setFile} error={errors.document} />
          <FloatingSelect id="og-sms" label="Send SMS" value={form.sms} options={[{ value: 'Yes', label: 'Yes' }, { value: 'No', label: 'No' }]} onChange={(v) => setVal('sms', v)} />
          <FloatingTextarea id="og-text" label="Complaint" required className="ax-col--span-3" value={form.complaint} onChange={(v) => setVal('complaint', v)} error={errors.complaint} />
        </div>
      </div>
    </ComplaintFormLayout>
  );
}

export default UPComplaintOffgridAdd;
