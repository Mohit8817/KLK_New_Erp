import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  upComplaintService,
  type UpOngridDetails,
} from '../../up-services';
import {
  ComplaintFormLayout,
  FloatingInput,
  FloatingSelect,
  FloatingTextarea,
  FloatingFileInput,
  SectionHeader,
  SmsRadioGroup,
  opts,
  getTodayFormatted,
  type SectionItem,
} from '../CommonSharedComplaints';

const SECTIONS: SectionItem[] = [
  { id: 'ong-sec-1', num: '1', title: 'District & Beneficiary' },
  { id: 'ong-sec-2', num: '2', title: 'Work Order & Plant Details' },
  { id: 'ong-sec-3', num: '3', title: 'Complaint & Attachment' },
];

export function UPComplaintOngridAdd() {
  const navigate = useNavigate();

  // Form State
  const [complaintDate, setComplaintDate] = useState(getTodayFormatted());
  const [district, setDistrict] = useState('');
  const [beneficiaryId, setBeneficiaryId] = useState('');
  const [ogid, setOgid] = useState('');
  const [beneficiaryName, setBeneficiaryName] = useState('');

  // Auto-populated fields
  const [contactNo, setContactNo] = useState('');
  const [workOrderNo, setWorkOrderNo] = useState('');
  const [workOrderDate, setWorkOrderDate] = useState('');
  const [plantCapacity, setPlantCapacity] = useState('');
  const [firmName, setFirmName] = useState('');
  const [contractorName, setContractorName] = useState('');
  const [contractorNo, setContractorNo] = useState('');

  // Complaint specific
  const [complaintText, setComplaintText] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [sendSms, setSendSms] = useState<'yes' | 'no'>('no');
  const [fileKey, setFileKey] = useState(0);

  // Options & Dropdowns
  const [districts, setDistricts] = useState<string[]>([]);
  const [beneficiaries, setBeneficiaries] = useState<{ id: string | number; name: string }[]>([]);

  // Loading States
  const [loadingInitial, setLoadingInitial] = useState(false);
  const [loadingBeneficiaries, setLoadingBeneficiaries] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Errors & Feedback
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const clearErr = (k: string) =>
    setFieldErrors((prev) => {
      if (!prev[k]) return prev;
      const next = { ...prev };
      delete next[k];
      return next;
    });

  const err = (k: string) => fieldErrors[k];
  const setText = (setter: (v: string) => void, key?: string) => (v: string) => {
    setter(v);
    if (key) clearErr(key);
  };

  // Load districts on mount
  useEffect(() => {
    let mounted = true;
    setLoadingInitial(true);
    upComplaintService
      .getOngridAddData()
      .then((res) => {
        if (!mounted) return;
        if (res.status && res.districts) {
          setDistricts(res.districts);
        }
      })
      .catch((e) => {
        console.error('Failed to load Ongrid districts:', e);
      })
      .finally(() => {
        if (mounted) setLoadingInitial(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  // When District changes, load Beneficiary names
  const handleDistrictChange = async (newDist: string) => {
    setDistrict(newDist);
    clearErr('district');
    setBeneficiaryId('');
    setBeneficiaryName('');
    setOgid('');
    setBeneficiaries([]);
    resetAutoPopulatedFields();

    if (!newDist) return;

    setLoadingBeneficiaries(true);
    try {
      const data = await upComplaintService.getOngridBeneficiaryNames(newDist);
      setBeneficiaries(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingBeneficiaries(false);
    }
  };

  // When Beneficiary is selected, load Details
  const handleBeneficiaryChange = async (bId: string) => {
    setBeneficiaryId(bId);
    clearErr('beneficiary_name');
    clearErr('ogid');
    const chosen = beneficiaries.find((b) => String(b.id) === bId) as any;
    setBeneficiaryName(chosen ? chosen.name : bId);
    const resolvedOgid = String(chosen?.ogid || chosen?.id || bId || '');
    setOgid(resolvedOgid);
    resetAutoPopulatedFields();

    if (!bId) return;

    setLoadingDetails(true);
    try {
      const details = await upComplaintService.getOngridDetails(bId);
      if (details) {
        populateDetails(details);
        if (details.ogid || details.id) {
          setOgid(String(details.ogid || details.id));
        }
      }
    } catch (e) {
      console.error('Error fetching ongrid beneficiary details:', e);
    } finally {
      setLoadingDetails(false);
    }
  };

  const populateDetails = (details: UpOngridDetails) => {
    if (details.contact_no || details.contact_number) {
      setContactNo(String(details.contact_no || details.contact_number));
    }
    if (details.work_order_no) setWorkOrderNo(String(details.work_order_no));
    if (details.work_order_date) {
      setWorkOrderDate(String(details.work_order_date).split('T')[0]);
    }
    if (details.plant_capacity) setPlantCapacity(String(details.plant_capacity));
    if (details.firm_name) setFirmName(String(details.firm_name));
    if (details.contractor_name) setContractorName(String(details.contractor_name));
    if (details.contractor_no || details.contractor_number) {
      setContractorNo(String(details.contractor_no || details.contractor_number));
    }
  };

  const resetAutoPopulatedFields = () => {
    setContactNo('');
    setWorkOrderNo('');
    setWorkOrderDate('');
    setPlantCapacity('');
    setFirmName('');
    setContractorName('');
    setContractorNo('');
  };

  const handleReset = () => {
    setComplaintDate(getTodayFormatted());
    setDistrict('');
    setBeneficiaryId('');
    setBeneficiaryName('');
    setOgid('');
    setBeneficiaries([]);
    resetAutoPopulatedFields();
    setComplaintText('');
    setSelectedFile(null);
    setSendSms('no');
    setFieldErrors({});
    setFileKey((k) => k + 1);
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!complaintDate) errs.complaint_date = 'Complaint Date is required.';
    if (!district) errs.district = 'District is required.';
    if (!beneficiaryId && !beneficiaryName && !ogid) errs.beneficiary_name = 'Beneficiary Name is required.';
    if (!contactNo.trim()) errs.contact_no = 'Contact Number is required.';
    if (!selectedFile) errs.document = 'Document / Photo is required.';
    if (!complaintText.trim()) errs.complaint = 'Complaint description is required.';
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setToast(null);

    if (!validate()) {
      setToast({ type: 'error', message: 'Please correct the highlighted errors before submitting.' });
      setTimeout(() => {
        document.querySelector('.has-error')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 50);
      return;
    }

    setSubmitting(true);
    const fd = new FormData();
    const resolvedOgid = ogid || beneficiaryId || '';
    fd.append('ogid', resolvedOgid);
    fd.append('id', resolvedOgid);
    if (beneficiaryId) fd.append('beneficiary_id', beneficiaryId);
    fd.append('complaint_date', complaintDate);
    fd.append('district', district);
    fd.append('beneficiary_name', beneficiaryName);
    fd.append('contact_no', contactNo);
    fd.append('contact_number', contactNo);
    fd.append('work_order_no', workOrderNo);
    fd.append('work_order_date', workOrderDate);
    fd.append('plant_capacity', plantCapacity);
    fd.append('firm_name', firmName);
    fd.append('contractor_name', contractorName);
    fd.append('contractor_no', contractorNo);
    fd.append('contractor_number', contractorNo);
    fd.append('complaint', complaintText);

    // Backend requires `sms` ('Yes' / 'No') as well as `send_sms` ('1' / '0')
    const smsVal = sendSms === 'yes' ? 'Yes' : 'No';
    fd.append('sms', smsVal);
    fd.append('send_sms', sendSms === 'yes' ? '1' : '0');

    if (selectedFile) {
      fd.append('document', selectedFile);
      fd.append('file', selectedFile);
    }

    try {
      const res = await upComplaintService.saveOngridComplaint(fd);
      if (res.status) {
        setToast({ type: 'success', message: res.message || 'On Grid Complaint registered successfully!' });
        window.scrollTo({ top: 0, behavior: 'smooth' });
        handleReset();
        setTimeout(() => {
          navigate('/v/complaint/up/ongrid-view-complaint');
        }, 1500);
      } else {
        if (res.errors) {
          const mapped: Record<string, string> = {};
          Object.entries(res.errors).forEach(([k, v]) => {
            mapped[k] = Array.isArray(v) ? v[0] : String(v);
          });
          if (mapped.ogid && !mapped.beneficiary_name) {
            mapped.beneficiary_name = mapped.ogid;
          }
          if (mapped.sms && !mapped.send_sms) {
            mapped.send_sms = mapped.sms;
          }
          setFieldErrors(mapped);
        }
        setToast({ type: 'error', message: res.message || 'Submission failed. Please check form data.' });
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch (errAny: any) {
      setToast({ type: 'error', message: errAny?.message || 'Network error occurred during submission.' });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ComplaintFormLayout
      title="Welcome to, Add UP On Grid Complaint"
      subtitle={
        <span style={{ fontSize: 'var(--ax-text-sm, 13px)', color: 'var(--ax-text-muted, #64748b)' }}>
          Register grid-connected rooftop solar plant breakdown & service tickets
        </span>
      }
      breadcrumbs={[
        { label: 'Home', href: '/v' },
        { label: 'Vendor UP On Grid Complaints', href: '/v/complaint/up/ongrid-view-complaint' },
        { label: 'Add UP On Grid Complaint' },
      ]}
      viewLink="/v/complaint/up/ongrid-view-complaint"
      viewLabel="View Complaints"
      eyebrow="On Grid Solar System"
      formTitle="Add UP On Grid Complaint"
      formSubtitle="Enter complaint details, select the plant beneficiary, and register the rooftop system repair ticket across 3 dedicated sections."
      sections={SECTIONS}
      onSubmit={handleSubmit}
      onReset={handleReset}
      loading={submitting}
      submitLabel="Save Complaint"
      toast={toast}
    >
      {/* Section 1 */}
      <div id="ong-sec-1" className="up-section-block">
        <SectionHeader
          num="1"
          total={3}
          title="Complaint Date & Beneficiary Lookup"
          desc={loadingDetails ? 'Loading plant specifications...' : 'Pick the district and beneficiary to auto-fill the plant details.'}
        />
        <div className="up-form-grid up-form-grid--3col">
          <FloatingInput
            id="ong-date"
            label="Complaint Date"
            type="date"
            required
            value={complaintDate}
            onChange={setText(setComplaintDate, 'complaint_date')}
            error={err('complaint_date')}
          />
          <FloatingSelect
            id="ong-district"
            label={`District${loadingInitial ? ' (Loading...)' : ''}`}
            required
            disabled={loadingInitial}
            placeholder="-- Select District --"
            value={district}
            options={opts(districts)}
            onChange={handleDistrictChange}
            error={err('district')}
          />
          <FloatingSelect
            id="ong-beneficiary"
            label={`Beneficiary Name${loadingBeneficiaries ? ' (Loading...)' : ''}`}
            required
            disabled={!district || loadingBeneficiaries}
            placeholder="-- Select Beneficiary Name --"
            value={beneficiaryId}
            options={beneficiaries.map((b) => ({ value: String(b.id), label: b.name }))}
            onChange={handleBeneficiaryChange}
            error={err('beneficiary_name') || err('ogid')}
          />
          <FloatingInput
            id="ong-contact"
            label="Contact Number"
            type="tel"
            required
            value={contactNo}
            onChange={setText(setContactNo, 'contact_no')}
            error={err('contact_no')}
          />
        </div>
      </div>

      <hr className="up-section-divider" />

      {/* Section 2 */}
      <div id="ong-sec-2" className="up-section-block">
        <SectionHeader
          num="2"
          total={3}
          title="Work Order, Plant Capacity & Contractor Details"
          desc="Populated from plant registry; editable if contractor has changed."
        />
        <div className="up-form-grid up-form-grid--3col">
          <FloatingInput id="ong-wo-no" label="Work Order No." value={workOrderNo} onChange={setWorkOrderNo} />
          <FloatingInput id="ong-wo-date" label="Work Order Date" type="date" value={workOrderDate} onChange={setWorkOrderDate} />
          <FloatingInput id="ong-capacity" label="Plant Capacity" value={plantCapacity} onChange={setPlantCapacity} />
          <FloatingInput id="ong-firm" label="Firm Name" value={firmName} onChange={setFirmName} />
          <FloatingInput id="ong-contractor" label="Contractor Name" value={contractorName} onChange={setContractorName} />
          <FloatingInput id="ong-contractor-no" label="Contractor Number" type="tel" value={contractorNo} onChange={setContractorNo} />
        </div>
      </div>

      <hr className="up-section-divider" />

      {/* Section 3 */}
      <div id="ong-sec-3" className="up-section-block">
        <SectionHeader
          num="3"
          total={3}
          title="Complaint Description & Attachment"
          desc="Describe the problem and attach a plant photo or defect sheet."
        />
        <div className="up-form-grid up-form-grid--3col">
          <FloatingFileInput
            key={fileKey}
            id="ong-file"
            label="Upload File (Plant Photo / Defect Sheet)"
            required
            accept="image/*,.pdf,.doc,.docx"
            file={selectedFile}
            onChange={(f) => {
              setSelectedFile(f);
              clearErr('document');
            }}
            error={err('document')}
          />
          <div className="up-form-col-span-full">
            <FloatingTextarea
              id="ong-complaint"
              label="Complaint"
              required
              rows={4}
              placeholder="e.g. ongrid inverter error 04, grid sync failure, solar generation low, net meter tripping"
              value={complaintText}
              onChange={setText(setComplaintText, 'complaint')}
              error={err('complaint')}
            />
          </div>
          <div className="up-form-col-span-full">
            <SmsRadioGroup
              name="ong-sms"
              value={sendSms}
              yesValue="yes"
              noValue="no"
              onChange={(v) => {
                setSendSms(v as typeof sendSms);
                clearErr('sms');
                clearErr('send_sms');
              }}
            />
            {(err('sms') || err('send_sms')) && (
              <span style={{ fontSize: 11.5, color: 'var(--ax-danger-500, #ef4444)', marginTop: 4, display: 'block' }}>
                {err('sms') || err('send_sms')}
              </span>
            )}
          </div>
        </div>
      </div>
    </ComplaintFormLayout>
  );
}

export default UPComplaintOngridAdd;
