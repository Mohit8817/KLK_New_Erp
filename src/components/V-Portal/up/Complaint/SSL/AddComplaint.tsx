import { useEffect, useRef, useState, type FormEvent } from 'react';
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
import { getMediaUrl, upComplaintService, type UpSslBeneficiaryDetails } from '../../up-services';

const SECTIONS: SectionItem[] = [
  { id: 'ssl-sec-1', num: '1', title: 'Location & Beneficiary' },
  { id: 'ssl-sec-2', num: '2', title: 'Light Hardware & Installation' },
  { id: 'ssl-sec-3', num: '3', title: 'Complaint & Attachment' },
];

/** Map UI label → backend-accepted type value */
const SSL_TYPE_MAP: Record<string, string> = {
  'SSL 18W': 'upssl18w',
  'SSL 12W': 'upssl12w',
  'ssl 18w': 'upssl18w',
  'ssl 12w': 'upssl12w',
  'upssl18w': 'upssl18w',
  'upssl12w': 'upssl12w',
};

/** Convert any form type value to the API-accepted slug */
const toApiType = (t: string): string =>
  SSL_TYPE_MAP[t] ?? SSL_TYPE_MAP[t.toLowerCase().trim()] ?? t;

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
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('edit');
  const isEdit = Boolean(editId);
  const skipTypeResetRef = useRef(isEdit);

  const [form, setForm] = useState(INITIAL_FORM);
  const [complaintCode, setComplaintCode] = useState('');
  const [existingFile, setExistingFile] = useState('');
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
  if (skipTypeResetRef.current) {
    skipTypeResetRef.current = false;
  } else {
    // Reset cascading fields and selected form values on type change
    setDistricts([]);
    setBlocks([]);
    setPanchayats([]);
    setBeneficiaries([]);
    setForm((p) => ({
      ...p,
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
    }));
  }

  const loadDistricts = async () => {
    try {
      if (typeof upComplaintService.getSslDistricts === 'function') {
        const list = await upComplaintService.getSslDistricts(toApiType(form.type));
        if (active && Array.isArray(list) && list.length > 0) {
          setDistricts(list);
        }
      }
    } catch (err) {
      console.error('Error loading SSL districts:', err);
    }
  };
  loadDistricts();
  return () => { active = false; };
}, [form.type]);  // ← re-run when type changes

  // Hydrate form in Edit mode (?edit=<id>)
  useEffect(() => {
    if (!editId) return;
    let active = true;

    const applyRecord = async (rec: Record<string, any>) => {
      if (!active || !rec) return;
      const rawType = String(rec.ssl_type || rec.type || 'SSL 18W').trim().toLowerCase();
      const uiType = rawType.includes('12') ? 'SSL 12W' : 'SSL 18W';
      const dist = String(rec.district || rec.district_name || '').trim();
      const block = String(rec.block || rec.block_name || '').trim();
      const panchayat = String(rec.panchyat || rec.panchayat || rec.panchayt || rec.gp_name || '').trim();
      const bName = String(rec.beneficiary_name || rec.name || '').trim();
      const bId = String(rec.beneficiary_id || rec.uid || rec.uid_no || bName || '').trim();
      const rawSms = String(rec.sms ?? rec.send_sms ?? 'Yes').trim().toLowerCase();

      if (rec.complaint_id) setComplaintCode(String(rec.complaint_id));
      setExistingFile(getMediaUrl(rec.file || rec.document || rec.file1) || '');
      skipTypeResetRef.current = true;
      setForm({
        type: uiType,
        district: dist,
        block,
        panchayat,
        beneficiary_name: bName,
        beneficiary_id: bId,
        contact_no: String(rec.contact_no || rec.mobile || rec.phone || ''),
        uid_no: String(rec.uid_no || rec.uid || rec.uuid_no || ''),
        latitude: rec.latitude !== undefined && rec.latitude !== null ? String(rec.latitude) : '',
        longitude: rec.longitude !== undefined && rec.longitude !== null ? String(rec.longitude) : '',
        along_with_pole: String(rec.along_with_pole || ''),
        luminary_no: String(rec.luminary_no || rec.luminary_serial_no || ''),
        sim_no: String(rec.sim_no || rec.sim_number || ''),
        battery_serial_no: String(rec.battery_serial_no || rec.battery_no || ''),
        module_no: String(rec.module_no || rec.panel_no || ''),
        date_of_installation: formatDateForInput(rec.date_of_installation || rec.installation_date || rec.inst_date),
        complaint_date: formatDateForInput(rec.complaint_date || rec.start_date || rec.created_at) || getTodayFormatted(),
        complaint_source: String(rec.complaint_source || rec.source || 'Vendor App'),
        complaint_issue: String(rec.complaint_issue || rec.issue || ''),
        complaint: String(rec.complaint || rec.remarks || ''),
        sms: rawSms === 'no' || rawSms === '0' || rawSms === 'false' ? 'No' : 'Yes',
      });

      const apiT = toApiType(uiType);
      if (dist) {
        try {
          const bList = await upComplaintService.getSslBlocks(dist, apiT);
          if (active) setBlocks(bList);
        } catch {}
        if (block) {
          try {
            const pList = await upComplaintService.getSslPanchayats(dist, block, apiT);
            if (active) setPanchayats(pList);
          } catch {}
          if (panchayat) {
            try {
              const list = await upComplaintService.getSslBeneficiaryNames(dist, block, panchayat, apiT);
              if (!active) return;
              const matched = list.find((b) => String(b.id) === bId || b.name === bName);
              if (matched) {
                setBeneficiaries(list);
                setForm((p) => ({ ...p, beneficiary_id: String(matched.id), beneficiary_name: matched.name }));
              } else if (bId || bName) {
                setBeneficiaries([{ id: bId || bName, name: bName || bId }, ...list]);
              } else {
                setBeneficiaries(list);
              }
            } catch {
              if (active && (bId || bName)) setBeneficiaries([{ id: bId || bName, name: bName || bId }]);
            }
          }
        }
      }
    };

    const stateRow = (location.state as any)?.editComplaint;
    if (stateRow) applyRecord(stateRow);

    upComplaintService
      .getSslEditComplaint(editId)
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
      const bList = await upComplaintService.getSslBlocks(d, toApiType(form.type));
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
      const pList = await upComplaintService.getSslPanchayats(form.district, b, toApiType(form.type));
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
      const list = await upComplaintService.getSslBeneficiaryNames(form.district, form.block, panch, toApiType(form.type));
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
      const det: UpSslBeneficiaryDetails | null = await upComplaintService.getSslBeneficiaryDetails(
        idOrName,
        bName,
        toApiType(form.type),
      );
      if (det) {
        const rawInstDate = det.date_of_installation || det.installation_date || '';
        const formattedInstDate = rawInstDate ? String(rawInstDate).split('T')[0].split(' ')[0] : '';
        setForm((p) => ({
          ...p,
          contact_no: det.contact_no || p.contact_no,
          uid_no: det.uid_no || det.uuid_no || p.uid_no,
          latitude: det.latitude !== undefined ? String(det.latitude) : p.latitude,
          longitude: det.longitude !== undefined ? String(det.longitude) : p.longitude,
          along_with_pole: det.along_with_pole || p.along_with_pole,
          luminary_no: det.luminary_no || p.luminary_no,
          sim_no: det.sim_no || p.sim_no,
          battery_serial_no: det.battery_serial_no || p.battery_serial_no,
          module_no: det.module_no || det.panel_no || p.module_no,
          date_of_installation: formattedInstDate || p.date_of_installation,
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
    if (!isEdit && !file) errs.file = 'Supporting document / photo is required';

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
      if (isEdit && editId) {
        fd.append('id', String(editId));
        if (complaintCode) fd.append('complaint_id', complaintCode);
      }
      Object.entries(form).forEach(([k, v]) => {
        if (v !== '' && v !== null && v !== undefined) {
          // 'type' field: backend expects 'upssl18w' / 'upssl12w'
          fd.append(k, k === 'type' ? toApiType(String(v)) : String(v));
        }
      });
      if (file) {
        fd.append('file', file);
        fd.append('file1', file);
      }

      const res = isEdit
        ? await upComplaintService.updateSslComplaint(fd)
        : await upComplaintService.saveSslComplaint(fd);
      if (res.status) {
        setToast({
          type: 'success',
          message: res.message || (isEdit ? 'SSL Complaint updated successfully!' : 'SSL Complaint registered successfully!'),
        });
        if (!isEdit) handleReset();
        setTimeout(() => {
          navigate('/v/complaint/up/ssl-view-complaint');
        }, 1200);
      } else {
        setToast({ type: 'error', message: res.message || (isEdit ? 'Failed to update complaint.' : 'Failed to submit complaint.') });
      }
    } catch (err: any) {
      setToast({ type: 'error', message: err?.message || 'Error occurred.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <ComplaintFormLayout
      title={isEdit ? 'Edit Vendor UP SSL Complaint' : 'Add Vendor UP SSL Complaint'}
      subtitle={isEdit ? 'Update Solar Street Light breakdown, hardware faults, and repair request' : 'Register Solar Street Light breakdown, hardware faults, and repair requests'}
      breadcrumbs={[
        { label: 'Home', href: '/v' },
        { label: 'Vendor UP SSL Complaints', href: '/v/complaint/up/ssl-view-complaint' },
        { label: isEdit ? 'Edit UP SSL Complaint' : 'Add UP SSL Complaint' },
      ]}
      viewLink="/v/complaint/up/ssl-view-complaint"
      eyebrow="Solar Street Light (SSL)"
      formTitle={isEdit ? `Edit UP SSL Complaint${complaintCode ? ` #${complaintCode}` : ''}` : 'Add UP SSL Complaint'}
      formSubtitle={isEdit ? 'Update complaint details and save changes.' : 'Enter location, luminary details, and issue description across 3 sections.'}
      sections={SECTIONS}
      onSubmit={handleSubmit}
      onReset={handleReset}
      loading={loading}
      submitLabel={isEdit ? 'Update Complaint' : 'Submit Complaint'}
      statusLabel={isEdit ? 'Edit Complaint' : 'New Complaint'}
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
            required={!isEdit}
            file={file}
            existingUrl={existingFile}
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
