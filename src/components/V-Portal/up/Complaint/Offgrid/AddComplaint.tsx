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
import { getMediaUrl, upComplaintService, type UpOffgridDetails } from '../../up-services';

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
  mobile_no: '',
  plant_capacity: '',
  work_order_no: '',
  work_order_date: '',
  contractor_name: '',
  complaint: '',
  sms: 'No',
};

type FormKey = keyof typeof INITIAL_FORM;

export function UPComplaintOffgridAdd() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('edit');
  const isEdit = Boolean(editId);

  const [form, setForm] = useState(INITIAL_FORM);
  const [complaintCode, setComplaintCode] = useState('');
  const [existingFile, setExistingFile] = useState('');
  const [selectedBeneficiary, setSelectedBeneficiary] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [fileKey, setFileKey] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [loadingBeneficiaries, setLoadingBeneficiaries] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);
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
    setLoadingDistricts(true);
    upComplaintService
      .getOffgridAddData()
      .then((res) => {
        if (active && res.districts && res.districts.length > 0) {
          setDistricts(res.districts);
        }
      })
      .finally(() => {
        if (active) setLoadingDistricts(false);
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
      const dist = String(rec.district || '').trim();
      const bName = String(rec.beneficiary_name || '').trim();
      const bId = String(rec.ogid || rec.offgrid_id || rec.beneficiary_id || bName || '').trim();
      const rawSms = String(rec.sms ?? rec.send_sms ?? 'No').trim().toLowerCase();

      if (rec.complaint_id) setComplaintCode(String(rec.complaint_id));
      setExistingFile(getMediaUrl(rec.document || rec.file || rec.file1) || '');
      setSelectedBeneficiary(bId);
      setForm({
        complaint_date: formatDateForInput(rec.complaint_date || rec.created_date || rec.created_at) || getTodayFormatted(),
        district: dist,
        ogid: bId,
        beneficiary_name: bName,
        mobile_no: String(rec.mobile_no || rec.contact_no || rec.contact_number || ''),
        plant_capacity: String(rec.plant_capacity || ''),
        work_order_no: String(rec.work_order_no || rec.wo_no || ''),
        work_order_date: formatDateForInput(rec.work_order_date || rec.wo_date),
        contractor_name: String(rec.contractor_name || ''),
        complaint: String(rec.complaint || ''),
        sms: rawSms === 'yes' || rawSms === '1' || rawSms === 'true' ? 'Yes' : 'No',
      });

      if (dist) {
        try {
          const list = await upComplaintService.getOffgridBeneficiaryNames(dist);
          if (!active) return;
          const matched = list.find((b) => String(b.id) === bId || b.name === bName);
          if (matched) {
            setBeneficiaries(list);
            setSelectedBeneficiary(String(matched.id));
            setForm((p) => ({ ...p, beneficiary_name: matched.name }));
          } else if (bId || bName) {
            setBeneficiaries([{ id: bId || bName, name: bName || bId }, ...list]);
          } else {
            setBeneficiaries(list);
          }
        } catch {
          if (active && (bId || bName)) {
            setBeneficiaries([{ id: bId || bName, name: bName || bId }]);
          }
        }
      }
    };

    const stateRow = (location.state as any)?.editComplaint;
    if (stateRow) applyRecord(stateRow);

    upComplaintService
      .getOffgridEditComplaint(editId)
      .then((fresh) => {
        if (active && fresh) applyRecord({ ...(stateRow || {}), ...fresh });
      })
      .catch(() => {});

    return () => {
      active = false;
    };
  }, [editId, location.state]);

  const handleDistrictChange = async (d: string) => {
    setSelectedBeneficiary('');
    setForm((p) => ({
      ...p,
      district: d,
      ogid: '',
      beneficiary_name: '',
      mobile_no: '',
      plant_capacity: '',
      work_order_no: '',
      work_order_date: '',
      contractor_name: '',
    }));
    clearErr('district');
    setBeneficiaries([]);
    if (!d) return;

    setLoadingBeneficiaries(true);
    try {
      const list = await upComplaintService.getOffgridBeneficiaryNames(d);
      setBeneficiaries(list);
    } catch {
      setBeneficiaries([]);
    } finally {
      setLoadingBeneficiaries(false);
    }
  };

  const handleBeneficiaryChange = async (idOrName: string) => {
    setSelectedBeneficiary(idOrName);
    const chosen = beneficiaries.find((b) => String(b.id) === idOrName) as any;
    const initialOgid = chosen?.ogid ?? chosen?.offgrid_id ?? chosen?.id ?? idOrName;

    setForm((p) => ({
      ...p,
      ogid: idOrName ? String(initialOgid) : '',
      beneficiary_name: idOrName ? (chosen ? chosen.name : idOrName) : '',
      mobile_no: '',
      plant_capacity: '',
      work_order_no: '',
      work_order_date: '',
      contractor_name: '',
    }));
    clearErr('beneficiary_name');
    clearErr('ogid');

    if (!idOrName) return;

    setLoadingDetails(true);
    try {
      const det: UpOffgridDetails | null = await upComplaintService.getOffgridDetails(idOrName, chosen?.name);
      if (det) {
        const resolvedId = det.id ?? det.ogid ?? det.offgrid_id ?? initialOgid;
        const resolvedMobile = det.mobile_no ?? det.contact_no ?? det.contact_number ?? '';
        const resolvedWoNo = det.work_order_no ?? det.wo_no ?? '';
        const resolvedWoDate = det.work_order_date ?? det.wo_date ?? '';
        const formattedWoDate = resolvedWoDate ? String(resolvedWoDate).split('T')[0].split(' ')[0] : '';

        setForm((p) => ({
          ...p,
          ogid: resolvedId !== undefined && resolvedId !== null && String(resolvedId).trim() !== '' ? String(resolvedId) : p.ogid,
          beneficiary_name: det.beneficiary_name ? String(det.beneficiary_name) : p.beneficiary_name,
          mobile_no: resolvedMobile !== '' && resolvedMobile !== null ? String(resolvedMobile) : '',
          plant_capacity: det.plant_capacity !== undefined && det.plant_capacity !== null ? String(det.plant_capacity) : '',
          work_order_no: resolvedWoNo !== '' && resolvedWoNo !== null ? String(resolvedWoNo) : '',
          work_order_date: formattedWoDate,
          contractor_name: det.contractor_name !== undefined && det.contractor_name !== null ? String(det.contractor_name) : '',
        }));

        if (resolvedMobile) {
          clearErr('mobile_no');
          clearErr('contact_no');
        }
      }
    } catch {
      // keep manually editable if lookup fails
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleReset = () => {
    setForm(INITIAL_FORM);
    setSelectedBeneficiary('');
    setFile(null);
    setFileKey((k) => k + 1);
    setErrors({});
    setBeneficiaries([]);
  };

  const validate = (): Record<string, string> => {
    const errs: Record<string, string> = {};
    if (!form.complaint_date) errs.complaint_date = 'Complaint Date is required.';
    if (!form.district) errs.district = 'District is required.';
    if (!selectedBeneficiary && !form.ogid && !form.beneficiary_name) errs.beneficiary_name = 'Beneficiary Name is required.';
    if (!form.mobile_no.trim()) errs.mobile_no = 'Mobile Number is required.';
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
        if (v !== '' && v !== null && v !== undefined) fd.set(k, String(v));
      });

      const resolvedId = form.ogid || selectedBeneficiary;
      if (resolvedId) {
        fd.set('ogid', String(resolvedId));
        fd.set('offgrid_id', String(resolvedId));
        fd.set('beneficiary_id', String(resolvedId));
        if (!isEdit) fd.set('id', String(resolvedId));
      }
      if (isEdit && editId) {
        fd.set('id', String(editId));
        if (complaintCode) fd.set('complaint_id', complaintCode);
      }

      if (form.mobile_no) {
        fd.set('mobile_no', form.mobile_no);
        fd.set('contact_no', form.mobile_no);
        fd.set('contact_number', form.mobile_no);
      }

      if (form.work_order_no) {
        fd.set('work_order_no', form.work_order_no);
        fd.set('wo_no', form.work_order_no);
      }

      if (form.work_order_date) {
        fd.set('work_order_date', form.work_order_date);
        fd.set('wo_date', form.work_order_date);
      }

      const smsVal = form.sms && String(form.sms).toLowerCase() === 'yes' ? 'Yes' : 'No';
      fd.set('sms', smsVal);
      fd.set('send_sms', smsVal === 'Yes' ? '1' : '0');

      if (file) {
        fd.set('document', file);
        fd.set('file', file);
      }

      const res = isEdit
        ? await upComplaintService.updateOffgridComplaint(fd)
        : await upComplaintService.saveOffgridComplaint(fd);
      if (res.status) {
        setToast({
          type: 'success',
          message: res.message || (isEdit ? 'Offgrid Complaint updated successfully!' : 'Offgrid Complaint submitted successfully!'),
        });
        if (!isEdit) handleReset();
        setTimeout(() => {
          navigate('/v/complaint/up/offgrid-view-complaint');
        }, 1200);
      } else {
        const extracted = extractBackendError(res, isEdit ? 'Failed to update complaint.' : 'Failed to submit complaint.');
        const mapped = { ...extracted.fieldErrors };
        if ((mapped.ogid || mapped.offgrid_id || mapped.beneficiary_id) && !mapped.beneficiary_name) {
          mapped.beneficiary_name = mapped.ogid || mapped.offgrid_id || mapped.beneficiary_id;
        }
        if ((mapped.contact_no || mapped.contact_number) && !mapped.mobile_no) {
          mapped.mobile_no = mapped.contact_no || mapped.contact_number;
        }
        if (mapped.wo_no && !mapped.work_order_no) {
          mapped.work_order_no = mapped.wo_no;
        }
        if (mapped.wo_date && !mapped.work_order_date) {
          mapped.work_order_date = mapped.wo_date;
        }
        if (mapped.file && !mapped.document) {
          mapped.document = mapped.file;
        }
        setErrors((prev) => ({ ...prev, ...mapped }));
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
      title={isEdit ? 'Edit UP Offgrid Complaint' : 'Add UP Offgrid Complaint'}
      subtitle={isEdit ? 'Update standalone offgrid solar home system breakdown complaint' : 'Register standalone offgrid solar home system and power pack breakdown complaints'}
      breadcrumbs={[
        { label: 'Home', href: '/v' },
        { label: 'View Vendor UP Offgrid Complaints', href: '/v/complaint/up/offgrid-view-complaint' },
        { label: isEdit ? 'Edit UP Offgrid Complaint' : 'Add UP Offgrid Complaint' },
      ]}
      viewLink="/v/complaint/up/offgrid-view-complaint"
      eyebrow="Offgrid Solar Power"
      formTitle={isEdit ? `Edit UP Offgrid Complaint${complaintCode ? ` #${complaintCode}` : ''}` : 'Add UP Offgrid Complaint'}
      formSubtitle={isEdit ? 'Update complaint details and save changes.' : 'Enter beneficiary location, equipment details, and problem description across 3 sections.'}
      sections={SECTIONS}
      onSubmit={handleSubmit}
      onReset={handleReset}
      loading={loading}
      submitLabel={isEdit ? 'Update Complaint' : 'Submit Complaint'}
      statusLabel={isEdit ? 'Edit Complaint' : 'New Complaint'}
      toast={toast}
    >
      {/* ── Section 1: District & Beneficiary ── */}
      <div id="og-sec-1" className="up-section-block">
        <SectionHeader
          num="1"
          total={3}
          title="District & Beneficiary Selection"
          desc={loadingDetails ? 'Loading beneficiary & plant details...' : 'Pick the district to find eligible Offgrid system beneficiaries.'}
        />
        <div className="up-form-grid up-form-grid--3col">
          <FloatingInput
            id="og-date"
            label="Complaint Date"
            type="date"
            required
            value={form.complaint_date}
            onChange={(v) => setVal('complaint_date', v)}
            error={errors.complaint_date}
          />
          <FloatingSelect
            id="og-district"
            label={`District${loadingDistricts ? ' (Loading...)' : ''}`}
            required
            disabled={loadingDistricts}
            value={form.district}
            options={opts(districts)}
            onChange={handleDistrictChange}
            error={errors.district}
          />
          <FloatingSelect
            id="og-ben"
            label={`Beneficiary Name${loadingBeneficiaries ? ' (Loading...)' : ''}`}
            required
            disabled={!form.district || loadingBeneficiaries}
            value={selectedBeneficiary}
            options={beneficiaries.map((b) => ({ value: String(b.id), label: b.name }))}
            onChange={handleBeneficiaryChange}
            error={errors.beneficiary_name || errors.ogid}
          />
        </div>
      </div>

      <hr className="up-section-divider" />

      {/* ── Section 2: Plant & Work Order ── */}
      <div id="og-sec-2" className="up-section-block">
        <SectionHeader num="2" total={3} title="Plant & Work Order Details" desc="Auto-populated from installation records." />
        <div className="up-form-grid up-form-grid--3col">
          <FloatingInput
            id="og-contact"
            label="Mobile No."
            type="tel"
            required
            value={form.mobile_no}
            onChange={(v) => setVal('mobile_no', v)}
            error={errors.mobile_no || errors.contact_no}
          />
          <FloatingInput
            id="og-cap"
            label="Plant Capacity"
            value={form.plant_capacity}
            onChange={(v) => setVal('plant_capacity', v)}
            error={errors.plant_capacity}
          />
          <FloatingInput
            id="og-wo"
            label="Work Order No."
            value={form.work_order_no}
            onChange={(v) => setVal('work_order_no', v)}
            error={errors.work_order_no || errors.wo_no}
          />
          <FloatingInput
            id="og-wodate"
            label="Work Order Date"
            type="date"
            value={form.work_order_date}
            onChange={(v) => setVal('work_order_date', v)}
            error={errors.work_order_date || errors.wo_date}
          />
          <FloatingInput
            id="og-cont"
            label="Contractor Name"
            value={form.contractor_name}
            onChange={(v) => setVal('contractor_name', v)}
            error={errors.contractor_name}
          />
        </div>
      </div>

      <hr className="up-section-divider" />

      {/* ── Section 3: Complaint & File ── */}
      <div id="og-sec-3" className="up-section-block">
        <SectionHeader num="3" total={3} title="Complaint Description & Supporting File" desc="Detail the fault and upload photographic proof." />
        <div className="up-form-grid up-form-grid--3col">
          <FloatingFileInput
            key={fileKey}
            id="og-file"
            label="Upload Document / Photo"
            required={!isEdit}
            file={file}
            existingUrl={existingFile}
            onChange={(f) => {
              setFile(f);
              if (f) clearErr('document');
            }}
            error={errors.document}
          />
          <FloatingSelect
            id="og-sms"
            label="Send SMS"
            value={form.sms}
            options={[{ value: 'Yes', label: 'Yes' }, { value: 'No', label: 'No' }]}
            onChange={(v) => setVal('sms', v)}
            error={errors.sms || errors.send_sms}
          />
          <FloatingTextarea
            id="og-text"
            label="Complaint"
            required
            className="ax-col--span-3"
            value={form.complaint}
            onChange={(v) => setVal('complaint', v)}
            error={errors.complaint}
          />
        </div>
      </div>
    </ComplaintFormLayout>
  );
}

export default UPComplaintOffgridAdd;
