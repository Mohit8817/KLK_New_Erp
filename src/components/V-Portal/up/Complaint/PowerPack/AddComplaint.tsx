import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  upComplaintService,
  type UpPowerpackDetails,
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
  { id: 'pp-sec-1', num: '1', title: 'Location & Beneficiary' },
  { id: 'pp-sec-2', num: '2', title: 'System Specs & Contractor' },
  { id: 'pp-sec-3', num: '3', title: 'Complaint & Document' },
];

export function UPComplaintPPAdd() {
  const navigate = useNavigate();

  // Form State
  const [complaintDate, setComplaintDate] = useState(getTodayFormatted());
  const [district, setDistrict] = useState('');
  const [block, setBlock] = useState('');
  const [village, setVillage] = useState('');
  const [beneficiaryId, setBeneficiaryId] = useState('');
  const [beneficiaryName, setBeneficiaryName] = useState('');

  // Auto-populated fields
  const [gender, setGender] = useState('');
  const [contactNo, setContactNo] = useState('');
  const [address, setAddress] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [uidNo, setUidNo] = useState('');
  const [empanelledAgencies, setEmpanelledAgencies] = useState('');
  const [installationStatus, setInstallationStatus] = useState('');
  const [installationDate, setInstallationDate] = useState('');
  const [contractorName, setContractorName] = useState('');

  // Complaint specific
  const [complaintText, setComplaintText] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [sendSms, setSendSms] = useState<'yes' | 'no'>('no');
  const [fileKey, setFileKey] = useState(0);

  // Dropdowns & Options
  const [districts, setDistricts] = useState<string[]>([]);
  const [blocks, setBlocks] = useState<string[]>([]);
  const [villages, setVillages] = useState<string[]>([]);
  const [beneficiaries, setBeneficiaries] = useState<{ id: string | number; name: string }[]>([]);

  // Loading States
  const [loadingInitial, setLoadingInitial] = useState(false);
  const [loadingBlocks, setLoadingBlocks] = useState(false);
  const [loadingVillages, setLoadingVillages] = useState(false);
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
      .getPowerpackAddData()
      .then((res) => {
        if (!mounted) return;
        if (res.status && res.districts) {
          setDistricts(res.districts);
        }
      })
      .catch((e) => {
        console.error('Failed to load Power Pack districts:', e);
      })
      .finally(() => {
        if (mounted) setLoadingInitial(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  // When District changes, load Blocks
  const handleDistrictChange = async (newDist: string) => {
    setDistrict(newDist);
    clearErr('district');
    setBlock('');
    setVillage('');
    setBeneficiaryId('');
    setBeneficiaryName('');
    setBlocks([]);
    setVillages([]);
    setBeneficiaries([]);
    resetAutoPopulatedFields();

    if (!newDist) return;

    setLoadingBlocks(true);
    try {
      const data = await upComplaintService.getPowerpackBlocks(newDist);
      setBlocks(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingBlocks(false);
    }
  };

  // When Block changes, load Villages
  const handleBlockChange = async (newBlock: string) => {
    setBlock(newBlock);
    clearErr('block');
    setVillage('');
    setBeneficiaryId('');
    setBeneficiaryName('');
    setVillages([]);
    setBeneficiaries([]);
    resetAutoPopulatedFields();

    if (!newBlock || !district) return;

    setLoadingVillages(true);
    try {
      const data = await upComplaintService.getPowerpackVillages(district, newBlock);
      setVillages(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingVillages(false);
    }
  };

  // When Village changes, load Beneficiaries
  const handleVillageChange = async (newVillage: string) => {
    setVillage(newVillage);
    clearErr('village');
    setBeneficiaryId('');
    setBeneficiaryName('');
    setBeneficiaries([]);
    resetAutoPopulatedFields();

    if (!newVillage || !district || !block) return;

    setLoadingBeneficiaries(true);
    try {
      const data = await upComplaintService.getPowerpackBeneficiaryNames(district, block, newVillage);
      setBeneficiaries(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingBeneficiaries(false);
    }
  };

  // When Beneficiary is selected, load Details
  const handleBeneficiaryChange = async (selectedId: string) => {
    setBeneficiaryId(selectedId);
    clearErr('beneficiary_name');
    const chosen = beneficiaries.find((b) => String(b.id) === selectedId);
    setBeneficiaryName(chosen ? chosen.name : selectedId);
    resetAutoPopulatedFields();

    if (!selectedId) return;

    setLoadingDetails(true);
    try {
      const details = await upComplaintService.getPowerpackDetails(selectedId);
      if (details) {
        populateDetails(details);
      }
    } catch (e) {
      console.error('Error fetching power pack details:', e);
    } finally {
      setLoadingDetails(false);
    }
  };

  const populateDetails = (details: UpPowerpackDetails) => {
    if (details.gender) setGender(String(details.gender));
    if (details.contact_no || details.contact_number) {
      setContactNo(String(details.contact_no || details.contact_number));
    }
    if (details.address) setAddress(String(details.address));
    if (details.latitude) setLatitude(String(details.latitude));
    if (details.longitude) setLongitude(String(details.longitude));
    if (details.uid || details.uid_no) setUidNo(String(details.uid || details.uid_no));
    if (details.empanelled_agency || details.empanelled_agencies) {
      setEmpanelledAgencies(String(details.empanelled_agency || details.empanelled_agencies));
    }
    if (details.installation || details.installation_status) {
      setInstallationStatus(String(details.installation || details.installation_status));
    }
    if (details.installation_date) {
      setInstallationDate(String(details.installation_date).split('T')[0]);
    }
    if (details.contractor_name) setContractorName(String(details.contractor_name));
  };

  const resetAutoPopulatedFields = () => {
    setGender('');
    setContactNo('');
    setAddress('');
    setLatitude('');
    setLongitude('');
    setUidNo('');
    setEmpanelledAgencies('');
    setInstallationStatus('');
    setInstallationDate('');
    setContractorName('');
  };

  const handleReset = () => {
    setComplaintDate(getTodayFormatted());
    setDistrict('');
    setBlock('');
    setVillage('');
    setBeneficiaryId('');
    setBeneficiaryName('');
    setBlocks([]);
    setVillages([]);
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
    if (!block) errs.block = 'Block is required.';
    if (!village) errs.village = 'Village is required.';
    if (!beneficiaryId && !beneficiaryName) errs.beneficiary_name = 'Beneficiary Name is required.';
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
      setToast({ type: 'error', message: 'Please correct highlighted errors before submitting.' });
      setTimeout(() => {
        document.querySelector('.has-error')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 50);
      return;
    }

    setSubmitting(true);
    const fd = new FormData();
    fd.append('complaint_date', complaintDate);
    fd.append('district', district);
    fd.append('block', block);
    fd.append('village', village);
    fd.append('beneficiary_name', beneficiaryName);
    if (beneficiaryId) fd.append('beneficiary_id', beneficiaryId);
    fd.append('gender', gender);
    fd.append('contact_no', contactNo);
    fd.append('contact_number', contactNo);
    fd.append('address', address);
    fd.append('latitude', latitude);
    fd.append('longitude', longitude);
    fd.append('uid', uidNo);
    fd.append('uid_no', uidNo);
    fd.append('empanelled_agency', empanelledAgencies);
    fd.append('empanelled_agencies', empanelledAgencies);
    fd.append('installation', installationStatus);
    fd.append('installation_status', installationStatus);
    fd.append('installation_date', installationDate);
    fd.append('contractor_name', contractorName);
    fd.append('complaint', complaintText);
    fd.append('send_sms', sendSms === 'yes' ? '1' : '0');
    fd.append('sms', sendSms === 'yes' ? 'Yes' : 'No');

    if (selectedFile) {
      fd.append('document', selectedFile);
      fd.append('file', selectedFile);
    }

    try {
      const res = await upComplaintService.savePowerpackComplaint(fd);
      if (res.status) {
        setToast({ type: 'success', message: res.message || 'Power Pack Complaint registered successfully!' });
        window.scrollTo({ top: 0, behavior: 'smooth' });
        handleReset();
        setTimeout(() => {
          navigate('/v/complaint/up/powerpack-view-complaint');
        }, 1500);
      } else {
        if (res.errors) {
          const mapped: Record<string, string> = {};
          Object.entries(res.errors).forEach(([k, v]) => {
            mapped[k] = Array.isArray(v) ? v[0] : String(v);
          });
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
      title="Welcome to, Add Vendor UP Power Pack Complaints"
      subtitle={
        <span style={{ fontSize: 'var(--ax-text-sm, 13px)', color: 'var(--ax-text-muted, #64748b)' }}>
          Register mini-grid / micro-solar power pack breakdown and repair requests
        </span>
      }
      breadcrumbs={[
        { label: 'Home', href: '/v' },
        { label: 'Vendor Power Pack Complaints', href: '/v/complaint/up/powerpack-view-complaint' },
        { label: 'Add UP Power Pack Complaints' },
      ]}
      viewLink="/v/complaint/up/powerpack-view-complaint"
      viewLabel="View Complaints"
      eyebrow="Solar Power Pack"
      formTitle="Add UP Power Pack Complaints"
      formSubtitle="Select the rural micro-grid beneficiary, verify solar power pack details, and submit the service request across 3 dedicated sections."
      sections={SECTIONS}
      onSubmit={handleSubmit}
      onReset={handleReset}
      loading={submitting}
      submitLabel="Submit Complaint"
      toast={toast}
    >
      {/* Section 1 */}
      <div id="pp-sec-1" className="up-section-block">
        <SectionHeader
          num="1"
          total={3}
          title="Complaint Date & Beneficiary Lookup"
          desc={loadingDetails ? 'Loading power pack details...' : 'Pick district, block, village and beneficiary to auto-fill the details below.'}
        />
        <div className="up-form-grid up-form-grid--3col">
          <FloatingInput
            id="pp-date"
            label="Complaint Date"
            type="date"
            required
            value={complaintDate}
            onChange={setText(setComplaintDate, 'complaint_date')}
            error={err('complaint_date')}
          />
          <FloatingSelect
            id="pp-district"
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
            id="pp-block"
            label={`Block${loadingBlocks ? ' (Loading...)' : ''}`}
            required
            disabled={!district || loadingBlocks}
            placeholder="-- Select Block --"
            value={block}
            options={opts(blocks)}
            onChange={handleBlockChange}
            error={err('block')}
          />
          <FloatingSelect
            id="pp-village"
            label={`Village${loadingVillages ? ' (Loading...)' : ''}`}
            required
            disabled={!block || loadingVillages}
            placeholder="-- Select Village --"
            value={village}
            options={opts(villages)}
            onChange={handleVillageChange}
            error={err('village')}
          />
          <FloatingSelect
            id="pp-beneficiary"
            label={`Beneficiary Name${loadingBeneficiaries ? ' (Loading...)' : ''}`}
            required
            disabled={!village || loadingBeneficiaries}
            placeholder="-- Select Beneficiary Name --"
            value={beneficiaryId}
            options={beneficiaries.map((b) => ({ value: String(b.id), label: b.name }))}
            onChange={handleBeneficiaryChange}
            error={err('beneficiary_name')}
          />
          <FloatingSelect
            id="pp-gender"
            label="Gender"
            placeholder="-- Select Gender --"
            options={opts(['Male', 'Female', 'Other'])}
            value={gender}
            onChange={setGender}
          />
          <FloatingInput
            id="pp-contact"
            label="Contact No."
            type="tel"
            required
            value={contactNo}
            onChange={setText(setContactNo, 'contact_no')}
            error={err('contact_no')}
          />
          <FloatingInput id="pp-address" label="Address" value={address} onChange={setAddress} />
          <FloatingInput id="pp-uid" label="UID No." value={uidNo} onChange={setUidNo} />
        </div>
      </div>

      <hr className="up-section-divider" />

      {/* Section 2 */}
      <div id="pp-sec-2" className="up-section-block">
        <SectionHeader
          num="2"
          total={3}
          title="Geo Coordinates, Agency & Contractor Info"
          desc="Auto-populated from system record; editable."
        />
        <div className="up-form-grid up-form-grid--3col">
          <FloatingInput id="pp-lat" label="Latitude" value={latitude} onChange={setLatitude} />
          <FloatingInput id="pp-lng" label="Longitude" value={longitude} onChange={setLongitude} />
          <FloatingInput id="pp-agencies" label="Empanelled Agencies" value={empanelledAgencies} onChange={setEmpanelledAgencies} />
          <FloatingInput id="pp-inst-status" label="Installation Status" value={installationStatus} onChange={setInstallationStatus} />
          <FloatingInput id="pp-inst-date" label="Installation Date" type="date" value={installationDate} onChange={setInstallationDate} />
          <FloatingInput id="pp-contractor" label="Contractor Name" value={contractorName} onChange={setContractorName} />
        </div>
      </div>

      <hr className="up-section-divider" />

      {/* Section 3 */}
      <div id="pp-sec-3" className="up-section-block">
        <SectionHeader
          num="3"
          total={3}
          title="Complaint Description & Attachment"
          desc="Describe the problem and attach a defect photo or site document."
        />
        <div className="up-form-grid up-form-grid--3col">
          <FloatingFileInput
            key={fileKey}
            id="pp-file"
            label="Upload File (Defect Photo / Site Document)"
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
              id="pp-complaint"
              label="Complaint"
              required
              rows={4}
              placeholder="e.g. battery bank discharged, control box LED fault, solar pack power outage"
              value={complaintText}
              onChange={setText(setComplaintText, 'complaint')}
              error={err('complaint')}
            />
          </div>
          <div className="up-form-col-span-full">
            <SmsRadioGroup
              name="pp-sms"
              value={sendSms}
              yesValue="yes"
              noValue="no"
              onChange={(v) => setSendSms(v as typeof sendSms)}
            />
          </div>
        </div>
      </div>
    </ComplaintFormLayout>
  );
}

export default UPComplaintPPAdd;
