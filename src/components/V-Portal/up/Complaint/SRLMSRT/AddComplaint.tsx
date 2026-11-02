import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  upComplaintService,
  type UpSrlmsrtDetails,
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
  { id: 'srlm-sec-1', num: '1', title: 'District, Block & Site' },
  { id: 'srlm-sec-2', num: '2', title: 'Customer & Technical Info' },
  { id: 'srlm-sec-3', num: '3', title: 'Complaint & File' },
];

export function UPComplaintSRLMAdd() {
  const navigate = useNavigate();

  // Form State
  const [complaintDate, setComplaintDate] = useState(getTodayFormatted());
  const [district, setDistrict] = useState('');
  const [block, setBlock] = useState('');
  const [siteId, setSiteId] = useState('');
  const [siteName, setSiteName] = useState('');

  // Auto-populated fields
  const [customerName, setCustomerName] = useState('');
  const [contactNo, setContactNo] = useState('');
  const [caNo, setCaNo] = useState('');
  const [capacity, setCapacity] = useState('');
  const [sanctionLoad, setSanctionLoad] = useState('');
  const [roofShedArea, setRoofShedArea] = useState('');
  const [roofType, setRoofType] = useState('');
  const [shadowFreeArea, setShadowFreeArea] = useState('');
  const [phase, setPhase] = useState('');
  const [installation, setInstallation] = useState('');
  const [installationDate, setInstallationDate] = useState('');
  const [requiredSqft, setRequiredSqft] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');

  // Complaint specific
  const [complaintText, setComplaintText] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [sendSms, setSendSms] = useState<'yes' | 'no'>('no');
  const [fileKey, setFileKey] = useState(0);

  // Options
  const [districts, setDistricts] = useState<string[]>([]);
  const [blocks, setBlocks] = useState<string[]>([]);
  const [sites, setSites] = useState<{ id: string | number; site_name: string }[]>([]);

  // Loading States
  const [loadingInitial, setLoadingInitial] = useState(false);
  const [loadingBlocks, setLoadingBlocks] = useState(false);
  const [loadingSites, setLoadingSites] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Feedback
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
      .getSrlmsrtAddData()
      .then((res) => {
        if (!mounted) return;
        if (res.status && res.districts) {
          setDistricts(res.districts);
        }
      })
      .catch((e) => {
        console.error('Failed to load SRLMSRT districts:', e);
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
    setSiteId('');
    setSiteName('');
    setBlocks([]);
    setSites([]);
    resetAutoPopulatedFields();

    if (!newDist) return;

    setLoadingBlocks(true);
    try {
      const data = await upComplaintService.getSrlmsrtBlocks(newDist);
      setBlocks(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingBlocks(false);
    }
  };

  // When Block changes, load Sites
  const handleBlockChange = async (newBlock: string) => {
    setBlock(newBlock);
    clearErr('block');
    setSiteId('');
    setSiteName('');
    setSites([]);
    resetAutoPopulatedFields();

    if (!newBlock || !district) return;

    setLoadingSites(true);
    try {
      const data = await upComplaintService.getSrlmsrtSiteNames(district, newBlock);
      setSites(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingSites(false);
    }
  };

  // When Site is selected, load Details
  const handleSiteChange = async (selectedId: string) => {
    setSiteId(selectedId);
    clearErr('site_name');
    const chosen = sites.find((s) => String(s.id) === selectedId);
    setSiteName(chosen ? chosen.site_name : selectedId);
    resetAutoPopulatedFields();

    if (!selectedId) return;

    setLoadingDetails(true);
    try {
      const details = await upComplaintService.getSrlmsrtSiteDetails(selectedId);
      if (details) {
        populateDetails(details);
      }
    } catch (e) {
      console.error('Error fetching SRLMSRT site details:', e);
    } finally {
      setLoadingDetails(false);
    }
  };

  const populateDetails = (details: UpSrlmsrtDetails) => {
    if (details.customer_name || details.beneficiary_name) {
      setCustomerName(String(details.customer_name || details.beneficiary_name));
    }
    if (details.contact_no) setContactNo(String(details.contact_no));
    if (details.ca_no) setCaNo(String(details.ca_no));
    if (details.capacity) setCapacity(String(details.capacity));
    if (details.sanction_load) setSanctionLoad(String(details.sanction_load));
    if (details.roof_shed_area) setRoofShedArea(String(details.roof_shed_area));
    if (details.roof_type) setRoofType(String(details.roof_type));
    if (details.shadow_free_area) setShadowFreeArea(String(details.shadow_free_area));
    if (details.phase) setPhase(String(details.phase));
    if (details.installation || details.installtion) {
      setInstallation(String(details.installation || details.installtion));
    }
    if (details.installation_date || details.installtion_date) {
      setInstallationDate(String(details.installation_date || details.installtion_date).split('T')[0]);
    }
    if (details.required_sqft) setRequiredSqft(String(details.required_sqft));
    if (details.latitude) setLatitude(String(details.latitude));
    if (details.longitude) setLongitude(String(details.longitude));
  };

  const resetAutoPopulatedFields = () => {
    setCustomerName('');
    setContactNo('');
    setCaNo('');
    setCapacity('');
    setSanctionLoad('');
    setRoofShedArea('');
    setRoofType('');
    setShadowFreeArea('');
    setPhase('');
    setInstallation('');
    setInstallationDate('');
    setRequiredSqft('');
    setLatitude('');
    setLongitude('');
  };

  const handleReset = () => {
    setComplaintDate(getTodayFormatted());
    setDistrict('');
    setBlock('');
    setSiteId('');
    setSiteName('');
    setBlocks([]);
    setSites([]);
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
    if (!siteId && !siteName) errs.site_name = 'Site Name is required.';
    if (!customerName.trim()) errs.customer_name = 'Customer Name is required.';
    if (!contactNo.trim()) errs.contact_no = 'Contact Number is required.';
    if (!capacity.trim()) errs.capacity = 'Capacity is required.';
    if (!sanctionLoad.trim()) errs.sanction_load = 'Sanction Load is required.';
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
    fd.append('site_name', siteName);
    if (siteId) fd.append('site_id', siteId);
    fd.append('customer_name', customerName);
    fd.append('beneficiary_name', customerName);
    fd.append('contact_no', contactNo);
    fd.append('ca_no', caNo);
    fd.append('capacity', capacity);
    fd.append('sanction_load', sanctionLoad);
    fd.append('roof_shed_area', roofShedArea);
    fd.append('roof_type', roofType);
    fd.append('shadow_free_area', shadowFreeArea);
    fd.append('phase', phase);
    fd.append('installation', installation);
    fd.append('installtion', installation);
    fd.append('installation_date', installationDate);
    fd.append('installtion_date', installationDate);
    fd.append('required_sqft', requiredSqft);
    fd.append('latitude', latitude);
    fd.append('longitude', longitude);
    fd.append('complaint', complaintText);
    fd.append('send_sms', sendSms === 'yes' ? '1' : '0');
    fd.append('sms', sendSms === 'yes' ? 'Yes' : 'No');

    if (selectedFile) {
      fd.append('document', selectedFile);
      fd.append('file', selectedFile);
    }

    try {
      const res = await upComplaintService.saveSrlmsrtComplaint(fd);
      if (res.status) {
        setToast({ type: 'success', message: res.message || 'SRLMSRT Complaint saved successfully!' });
        window.scrollTo({ top: 0, behavior: 'smooth' });
        handleReset();
        setTimeout(() => {
          navigate('/v/complaint/up/srlmsrt/view-complaint');
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
      title="Welcome to, Add Vendor UP SRLMSRT Complaint"
      subtitle={
        <span style={{ fontSize: 'var(--ax-text-sm, 13px)', color: 'var(--ax-text-muted, #64748b)' }}>
          Register SRLM Solar Rooftop maintenance tickets and site breakdown reports
        </span>
      }
      breadcrumbs={[
        { label: 'Home', href: '/v' },
        { label: 'UP SRLMSRT Complaints', href: '/v/complaint/up/srlmsrt/view-complaint' },
        { label: 'Add Vendor UP SRLMSRT Complaint' },
      ]}
      viewLink="/v/complaint/up/srlmsrt/view-complaint"
      viewLabel="View Complaints"
      eyebrow="SRLM Solar Rooftop"
      formTitle="Add Vendor UP SRLMSRT Complaint"
      formSubtitle="Select block and rooftop solar site, verify technical parameters, and register the complaint across 3 dedicated sections."
      sections={SECTIONS}
      onSubmit={handleSubmit}
      onReset={handleReset}
      loading={submitting}
      submitLabel="Save Complaint"
      toast={toast}
    >
      {/* Section 1 */}
      <div id="srlm-sec-1" className="up-section-block">
        <SectionHeader
          num="1"
          total={3}
          title="Complaint Date & Site Selection"
          desc={loadingDetails ? 'Loading site details...' : 'Pick district, block and site to auto-fill the details below.'}
        />
        <div className="up-form-grid up-form-grid--3col">
          <FloatingInput
            id="srlm-date"
            label="Complaint Date"
            type="date"
            required
            value={complaintDate}
            onChange={setText(setComplaintDate, 'complaint_date')}
            error={err('complaint_date')}
          />
          <FloatingSelect
            id="srlm-district"
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
            id="srlm-block"
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
            id="srlm-site"
            label={`Site Name${loadingSites ? ' (Loading...)' : ''}`}
            required
            disabled={!block || loadingSites}
            placeholder="-- Select Site Name --"
            value={siteId}
            options={sites.map((s) => ({ value: String(s.id), label: s.site_name }))}
            onChange={handleSiteChange}
            error={err('site_name')}
          />
          <FloatingInput
            id="srlm-customer"
            label="Customer Name"
            required
            value={customerName}
            onChange={setText(setCustomerName, 'customer_name')}
            error={err('customer_name')}
          />
          <FloatingInput
            id="srlm-contact"
            label="Contact No."
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
      <div id="srlm-sec-2" className="up-section-block">
        <SectionHeader
          num="2"
          total={3}
          title="Rooftop Technical Parameters & Load Details"
          desc="Auto-populated upon site selection; editable."
        />
        <div className="up-form-grid up-form-grid--3col">
          <FloatingInput id="srlm-ca" label="CA No." value={caNo} onChange={setCaNo} />
          <FloatingInput
            id="srlm-capacity"
            label="Capacity"
            required
            value={capacity}
            onChange={setText(setCapacity, 'capacity')}
            error={err('capacity')}
          />
          <FloatingInput
            id="srlm-sanction"
            label="Sanction Load"
            required
            value={sanctionLoad}
            onChange={setText(setSanctionLoad, 'sanction_load')}
            error={err('sanction_load')}
          />
          <FloatingInput id="srlm-shed" label="Roof Shed Area" value={roofShedArea} onChange={setRoofShedArea} />
          <FloatingInput id="srlm-roof-type" label="Roof Type" value={roofType} onChange={setRoofType} />
          <FloatingInput id="srlm-shadow" label="Shadow Free Area" value={shadowFreeArea} onChange={setShadowFreeArea} />
          <FloatingInput id="srlm-phase" label="Phase" value={phase} onChange={setPhase} />
          <FloatingInput id="srlm-installation" label="Installation (YES/NO)" value={installation} onChange={setInstallation} />
          <FloatingInput id="srlm-inst-date" label="Installation Date" type="date" value={installationDate} onChange={setInstallationDate} />
          <FloatingInput id="srlm-sqft" label="Required Sqft" value={requiredSqft} onChange={setRequiredSqft} />
          <FloatingInput id="srlm-lat" label="Latitude" value={latitude} onChange={setLatitude} />
          <FloatingInput id="srlm-lng" label="Longitude" value={longitude} onChange={setLongitude} />
        </div>
      </div>

      <hr className="up-section-divider" />

      {/* Section 3 */}
      <div id="srlm-sec-3" className="up-section-block">
        <SectionHeader
          num="3"
          total={3}
          title="Complaint Description & Attachment"
          desc="Describe the problem and attach a rooftop photo or fault document."
        />
        <div className="up-form-grid up-form-grid--3col">
          <FloatingFileInput
            key={fileKey}
            id="srlm-file"
            label="Upload File (Rooftop Photo / Fault Document)"
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
              id="srlm-complaint"
              label="Complaint"
              required
              rows={4}
              placeholder="e.g. inverter trip, earthing fault, ACDB/DCDB sparking, solar panel micro-crack"
              value={complaintText}
              onChange={setText(setComplaintText, 'complaint')}
              error={err('complaint')}
            />
          </div>
          <div className="up-form-col-span-full">
            <SmsRadioGroup
              name="srlm-sms"
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

export default UPComplaintSRLMAdd;
