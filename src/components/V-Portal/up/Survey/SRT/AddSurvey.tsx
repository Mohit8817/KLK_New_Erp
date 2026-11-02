import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHead } from '../../../../shell/PageHead';
import { upSurveyService } from '../../up-services';

const CSS = `
  .solar-erp-page .ax-card { min-width: 0; }
  .solar-erp-page img,
  .solar-erp-page .ax-card img {
    border-radius: 0 !important;
  }

  .survey-section-title {
    font-size: 14px;
    font-weight: 700;
    color: var(--ax-text, #0f172a);
    text-transform: uppercase;
    letter-spacing: 0.04em;
    margin: 0 0 14px 0;
    padding-bottom: 8px;
    border-bottom: 2px solid var(--ax-border, #e2e8f0);
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .form-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
    gap: 16px;
  }
  @media (min-width: 1024px) {
    .form-grid-3 {
      grid-template-columns: repeat(3, 1fr);
    }
    .form-grid-4 {
      grid-template-columns: repeat(4, 1fr);
    }
  }

  .form-field {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .form-field label {
    font-size: 12.5px;
    font-weight: 600;
    color: var(--ax-text, #1e293b);
  }
  .form-field label span.req {
    color: #dc2626;
    margin-left: 2px;
  }
  .form-field input,
  .form-field select,
  .form-field textarea {
    padding: 9px 12px;
    border-radius: 8px;
    border: 1px solid var(--ax-border, #cbd5e1);
    background: var(--ax-surface-solid, #ffffff);
    color: var(--ax-text, #0f172a);
    font-size: 13px;
    outline: none;
    transition: all 0.15s ease;
  }
  .form-field input:focus,
  .form-field select:focus,
  .form-field textarea:focus {
    border-color: var(--ax-accent, #2563eb);
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.15);
  }
`;

export function UP_Survey_SRT_AddSurvey() {
  const navigate = useNavigate();

  // Location Details
  const [districts, setDistricts] = useState<string[]>([]);
  const [district, setDistrict] = useState('');
  const [blocks, setBlocks] = useState<string[]>([]);
  const [block, setBlock] = useState('');
  const [panchayats, setPanchayats] = useState<string[]>([]);
  const [panchayat, setPanchayat] = useState('');
  const [villages, setVillages] = useState<string[]>([]);
  const [village, setVillage] = useState('');
  const [wardNo, setWardNo] = useState('');
  const [address, setAddress] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [locating, setLocating] = useState(false);
  const [geoError, setGeoError] = useState('');

  // Beneficiary Details
  const [beneficiary, setBeneficiary] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [aadhaarNo, setAadhaarNo] = useState('');
  const [panNo, setPanNo] = useState('');
  const [caNo, setCaNo] = useState('');

  // Electricity & Rooftop Details
  const [sanctionedLoad, setSanctionedLoad] = useState('');
  const [loadDemand, setLoadDemand] = useState('');
  const [consumption, setConsumption] = useState('');
  const [quotation, setQuotation] = useState('');
  const [rooftopArea, setRooftopArea] = useState('');

  // Bank Details
  const [bankName, setBankName] = useState('');
  const [accountHolder, setAccountHolder] = useState('');
  const [accountNo, setAccountNo] = useState('');
  const [ifsc, setIfsc] = useState('');

  // Documents
  const [aadhaarPhoto, setAadhaarPhoto] = useState<File | null>(null);
  const [panPhoto, setPanPhoto] = useState<File | null>(null);
  const [electricityBill, setElectricityBill] = useState<File | null>(null);
  const [bankPassbook, setBankPassbook] = useState<File | null>(null);
  const [rooftopPhoto, setRooftopPhoto] = useState<File | null>(null);

  // Remark
  const [remark, setRemark] = useState('');

  // Form Submission
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Load Districts on mount
  useEffect(() => {
    upSurveyService.getSrtDistricts().then((dists) => setDistricts(dists));
  }, []);

  // Cascading Blocks
  useEffect(() => {
    if (district) {
      upSurveyService.getSrtBlocks(district).then((b) => setBlocks(b));
    } else {
      setBlocks([]);
      setBlock('');
    }
  }, [district]);

  // Cascading Panchayats
  useEffect(() => {
    if (district && block) {
      upSurveyService.getSrtPanchayats(district, block).then((p) => setPanchayats(p));
    } else {
      setPanchayats([]);
      setPanchayat('');
    }
  }, [district, block]);

  // Cascading Villages
  useEffect(() => {
    if (district && block && panchayat) {
      upSurveyService.getSrtVillages(district, block, panchayat).then((v) => setVillages(v));
    } else {
      setVillages([]);
      setVillage('');
    }
  }, [district, block, panchayat]);

  // Browser Geolocation
  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      setGeoError('Location permission denied. Allow location access in your browser/site settings, then retry.');
      return;
    }
    setLocating(true);
    setGeoError('');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitude(pos.coords.latitude.toFixed(7));
        setLongitude(pos.coords.longitude.toFixed(7));
        setLocating(false);
      },
      (err) => {
        setLocating(false);
        setGeoError(`Location permission denied (${err.message}). Allow location access in your browser/site settings, then retry.`);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setToast(null);

    const fd = new FormData();
    fd.append('district', district);
    fd.append('block', block);
    fd.append('panchayat', panchayat);
    fd.append('village', village);
    fd.append('ward_no', wardNo);
    fd.append('address', address);
    fd.append('latitude', latitude);
    fd.append('longitude', longitude);

    fd.append('beneficiary', beneficiary);
    fd.append('phone', phone);
    fd.append('email', email);
    fd.append('aadhaar_no', aadhaarNo);
    fd.append('pan_no', panNo);
    fd.append('ca_no', caNo);

    fd.append('sanctioned_load', sanctionedLoad);
    fd.append('load_demand', loadDemand);
    fd.append('consumption', consumption);
    fd.append('quotation', quotation);
    fd.append('rooftop_area', rooftopArea);

    fd.append('bank_name', bankName);
    fd.append('account_holder', accountHolder);
    fd.append('account_no', accountNo);
    fd.append('ifsc', ifsc);

    if (aadhaarPhoto) fd.append('aadhaar_photo', aadhaarPhoto);
    if (panPhoto) fd.append('pan_photo', panPhoto);
    if (electricityBill) fd.append('electricity_bill', electricityBill);
    if (bankPassbook) fd.append('bank_passbook', bankPassbook);
    if (rooftopPhoto) fd.append('rooftop_photo', rooftopPhoto);

    fd.append('remark', remark);

    try {
      const res = await upSurveyService.storeSrtSurvey(fd);
      if (res.status) {
        setToast({ type: 'success', message: res.message || 'UP SRT Survey Details submitted successfully!' });
        setTimeout(() => {
          navigate('/v/up/srt-surveys/view');
        }, 1200);
      } else {
        setToast({ type: 'error', message: res.message || 'Failed to submit survey.' });
      }
    } catch (err: any) {
      setToast({ type: 'error', message: err?.message || 'Error occurred while saving survey.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="ax-page solar-erp-page">
      <style>{CSS}</style>

      {/* Header */}
      <PageHead
        title="Welcome to, UP SRT Survey"
        subtitle="UP SRT Survey Details — Fields marked with * are required."
        breadcrumbs={[
          { label: 'Home', href: '/v' },
          { label: 'UP SRT Survey', href: '/v/up/srt-surveys/view' },
          { label: 'Add Survey' },
        ]}
      />

      {/* Toast Notification */}
      {toast && (
        <div
          style={{
            padding: '12px 18px',
            borderRadius: 8,
            marginBottom: 20,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: toast.type === 'success' ? '#ecfdf5' : '#fef2f2',
            border: `1px solid ${toast.type === 'success' ? '#a7f3d0' : '#fecaca'}`,
            color: toast.type === 'success' ? '#065f46' : '#991b1b',
            fontSize: 13.5,
            fontWeight: 500,
          }}
        >
          <span>{toast.message}</span>
          <button
            type="button"
            onClick={() => setToast(null)}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'inherit' }}
          >
            ✕
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="ax-card" style={{ padding: 24, borderRadius: 12 }}>
          {/* Section: Location Details */}
          <div className="survey-section-title">Location Details</div>
          <div className="form-grid form-grid-3" style={{ marginBottom: 24 }}>
            <div className="form-field">
              <label>
                District <span className="req">*</span>
              </label>
              <select value={district} onChange={(e) => setDistrict(e.target.value)} required>
                <option value="">Select District</option>
                {districts.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-field">
              <label>
                Block <span className="req">*</span>
              </label>
              <select value={block} onChange={(e) => setBlock(e.target.value)} required>
                <option value="">Select Block</option>
                {blocks.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-field">
              <label>
                Panchayat <span className="req">*</span>
              </label>
              <select value={panchayat} onChange={(e) => setPanchayat(e.target.value)} required>
                <option value="">Select Panchayat</option>
                {panchayats.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-field">
              <label>
                Village <span className="req">*</span>
              </label>
              <select value={village} onChange={(e) => setVillage(e.target.value)} required>
                <option value="">Select Village</option>
                {villages.map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-field">
              <label>Ward No.</label>
              <input
                type="text"
                placeholder="Enter ward number"
                value={wardNo}
                onChange={(e) => setWardNo(e.target.value)}
              />
            </div>

            <div className="form-field">
              <label>
                Address <span className="req">*</span>
              </label>
              <input
                type="text"
                placeholder="Enter full address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                required
              />
            </div>

            <div className="form-field">
              <label>Latitude</label>
              <input
                type="text"
                placeholder="e.g. 28.6031650"
                value={latitude}
                onChange={(e) => setLatitude(e.target.value)}
              />
            </div>

            <div className="form-field">
              <label>Longitude</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  type="text"
                  placeholder="e.g. 77.3573570"
                  value={longitude}
                  onChange={(e) => setLongitude(e.target.value)}
                  style={{ flex: 1 }}
                />
                <button
                  type="button"
                  onClick={handleGetLocation}
                  disabled={locating}
                  className="ax-btn ax-btn--subtle"
                  style={{ padding: '0 12px', fontSize: 12, whiteSpace: 'nowrap' }}
                >
                  {locating ? 'Detecting...' : '📍 GPS'}
                </button>
              </div>
            </div>
          </div>

          {geoError && (
            <div style={{ color: '#dc2626', fontSize: 12, marginBottom: 20, padding: '8px 12px', background: '#fef2f2', borderRadius: 6 }}>
              {geoError}
            </div>
          )}

          {/* Section: Beneficiary Details */}
          <div className="survey-section-title">Beneficiary Details</div>
          <div className="form-grid form-grid-3" style={{ marginBottom: 24 }}>
            <div className="form-field">
              <label>
                Beneficiary Name <span className="req">*</span>
              </label>
              <input
                type="text"
                placeholder="Enter beneficiary name"
                value={beneficiary}
                onChange={(e) => setBeneficiary(e.target.value)}
                required
              />
            </div>

            <div className="form-field">
              <label>
                Phone No. <span className="req">*</span>
              </label>
              <input
                type="tel"
                placeholder="Enter 10-digit mobile number"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
            </div>

            <div className="form-field">
              <label>
                Email <span className="req">*</span>
              </label>
              <input
                type="email"
                placeholder="Enter email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-field">
              <label>
                Aadhaar No. <span className="req">*</span>
              </label>
              <input
                type="text"
                placeholder="Enter 12-digit Aadhaar number"
                value={aadhaarNo}
                onChange={(e) => setAadhaarNo(e.target.value)}
                required
              />
            </div>

            <div className="form-field">
              <label>
                PAN No. <span className="req">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. ABCDE1234F"
                value={panNo}
                onChange={(e) => setPanNo(e.target.value.toUpperCase())}
                required
              />
            </div>

            <div className="form-field">
              <label>
                CA No. <span className="req">*</span>
              </label>
              <input
                type="text"
                placeholder="Enter CA number"
                value={caNo}
                onChange={(e) => setCaNo(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Section: Electricity & Rooftop Details */}
          <div className="survey-section-title">Electricity & Rooftop Details</div>
          <div className="form-grid form-grid-3" style={{ marginBottom: 24 }}>
            <div className="form-field">
              <label>
                Sanctioned Load (kW) <span className="req">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. 5"
                value={sanctionedLoad}
                onChange={(e) => setSanctionedLoad(e.target.value)}
                required
              />
            </div>

            <div className="form-field">
              <label>
                Load Demand (kW) <span className="req">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. 5"
                value={loadDemand}
                onChange={(e) => setLoadDemand(e.target.value)}
                required
              />
            </div>

            <div className="form-field">
              <label>
                Consumption (Units/Month) <span className="req">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. 2000"
                value={consumption}
                onChange={(e) => setConsumption(e.target.value)}
                required
              />
            </div>

            <div className="form-field">
              <label>Quotation (₹)</label>
              <input
                type="text"
                placeholder="e.g. 1200000"
                value={quotation}
                onChange={(e) => setQuotation(e.target.value)}
              />
            </div>

            <div className="form-field">
              <label>
                Rooftop Area (Sq. Ft.) <span className="req">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. 123.4"
                value={rooftopArea}
                onChange={(e) => setRooftopArea(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Section: Bank Details */}
          <div className="survey-section-title">Bank Details</div>
          <div className="form-grid form-grid-4" style={{ marginBottom: 24 }}>
            <div className="form-field">
              <label>
                Bank Name <span className="req">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. State Bank of India"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                required
              />
            </div>

            <div className="form-field">
              <label>
                Account Holder Name <span className="req">*</span>
              </label>
              <input
                type="text"
                placeholder="Enter account holder name"
                value={accountHolder}
                onChange={(e) => setAccountHolder(e.target.value)}
                required
              />
            </div>

            <div className="form-field">
              <label>
                Account No. <span className="req">*</span>
              </label>
              <input
                type="text"
                placeholder="Enter account number"
                value={accountNo}
                onChange={(e) => setAccountNo(e.target.value)}
                required
              />
            </div>

            <div className="form-field">
              <label>
                IFSC Code <span className="req">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. SBIN0001234"
                value={ifsc}
                onChange={(e) => setIfsc(e.target.value.toUpperCase())}
                required
              />
            </div>
          </div>

          {/* Section: Documents */}
          <div className="survey-section-title">Documents (Photos)</div>
          <div className="form-grid form-grid-3" style={{ marginBottom: 24 }}>
            <div className="form-field">
              <label>
                Aadhaar Card (Photo) <span className="req">*</span>
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => e.target.files && setAadhaarPhoto(e.target.files[0])}
                required
              />
            </div>

            <div className="form-field">
              <label>
                PAN Card (Photo) <span className="req">*</span>
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => e.target.files && setPanPhoto(e.target.files[0])}
                required
              />
            </div>

            <div className="form-field">
              <label>
                Electricity Bill (Photo) <span className="req">*</span>
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => e.target.files && setElectricityBill(e.target.files[0])}
                required
              />
            </div>

            <div className="form-field">
              <label>
                Bank Passbook (Photo) <span className="req">*</span>
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => e.target.files && setBankPassbook(e.target.files[0])}
                required
              />
            </div>

            <div className="form-field">
              <label>
                Rooftop (Photo) <span className="req">*</span>
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => e.target.files && setRooftopPhoto(e.target.files[0])}
                required
              />
            </div>
          </div>

          {/* Section: Remark */}
          <div className="survey-section-title">Remark</div>
          <div className="form-field" style={{ marginBottom: 24 }}>
            <label>Remark (if any)</label>
            <textarea
              rows={3}
              placeholder="Enter remark (if any)..."
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
            />
          </div>

          {/* Form Actions */}
          <div
            style={{
              paddingTop: 16,
              borderTop: '1px solid var(--ax-border, #e2e8f0)',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: 12,
            }}
          >
            <button
              type="button"
              onClick={() => navigate('/v/up/srt-surveys/view')}
              className="ax-btn ax-btn--subtle"
              disabled={submitting}
              style={{ padding: '10px 20px', borderRadius: 8 }}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="ax-btn ax-btn--primary"
              disabled={submitting}
              style={{
                padding: '10px 28px',
                borderRadius: 8,
                background: '#2563eb',
                color: '#ffffff',
                fontWeight: 600,
                fontSize: 14,
              }}
            >
              {submitting ? 'Submitting...' : 'Submit SRT Survey'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

export const UPSurveySRTAdd = UP_Survey_SRT_AddSurvey;
export default UP_Survey_SRT_AddSurvey;
