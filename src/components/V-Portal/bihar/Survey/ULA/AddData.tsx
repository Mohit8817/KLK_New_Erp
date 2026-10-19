import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { PageHead } from '../../../../shell/PageHead';
import {
  biharUlaSurveyService,
  type BiharUlaSurveyItem,
} from '../../../../../services/biharUlaSurveyService';

export function Bihar_Survey_ULA_AddData() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('id');

  // Loading & submission state
  const [initialLoading, setInitialLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [geoError, setGeoError] = useState('');

  // Dropdown options
  const [districts, setDistricts] = useState<string[]>([]);
  const [blocks, setBlocks] = useState<string[]>([]);
  const [panchayats, setPanchayats] = useState<string[]>([]);
  const [loadingBlocks, setLoadingBlocks] = useState(false);
  const [loadingPanchayats, setLoadingPanchayats] = useState(false);

  // Form Fields
  const [formData, setFormData] = useState({
    district: '',
    block: '',
    panchayat: '',
    village: '',
    address: '',
    consumer_name: '',
    gender: 'Male',
    contact_no: '',
    aadhar_no: '',
    ca_number: '',
    feasible_status: '1', // '1' = Feasible, '0' = Not Feasible
    smart_meter: '0', // '1' = Yes, '0' = No
    smart_meter_no: '',
    smart_meter_functional: '1', // '1' = Yes, '0' = No
    latitude: '',
    longitude: '',
    remarks: '',
  });

  // Photo files
  const [files, setFiles] = useState<{
    electricity_bill_photo: File | null;
    consent_form_photo: File | null;
    aadhar_card_photo: File | null;
  }>({
    electricity_bill_photo: null,
    consent_form_photo: null,
    aadhar_card_photo: null,
  });

  // Existing photo URLs for edit mode
  const [existingPhotos, setExistingPhotos] = useState<{
    electricity_bill_photo?: string | null;
    consent_form_photo?: string | null;
    aadhar_card_photo?: string | null;
  }>({});

  // 1. Initial Load: Districts & Edit record if present
  useEffect(() => {
    const init = async () => {
      setInitialLoading(true);
      setErrorMsg('');
      try {
        const distList = await biharUlaSurveyService.getDistricts();
        setDistricts(distList);

        if (editId) {
          const { survey } = await biharUlaSurveyService.getSurveyForEdit(editId);
          if (survey) {
            setFormData({
              district: survey.district || '',
              block: survey.block || '',
              panchayat: survey.panchayat || '',
              village: survey.village || '',
              address: survey.address || '',
              consumer_name: survey.consumer_name || '',
              gender: survey.gender || 'Male',
              contact_no: survey.contact_no || '',
              aadhar_no: survey.aadhar_no || '',
              ca_number: survey.ca_number || '',
              feasible_status: String(survey.feasible_status ?? 1),
              smart_meter: String(survey.smart_meter ?? 0),
              smart_meter_no: survey.smart_meter_no || '',
              smart_meter_functional: String(survey.smart_meter_functional ?? 1),
              latitude: survey.latitude ? String(survey.latitude) : '',
              longitude: survey.longitude ? String(survey.longitude) : '',
              remarks: survey.remarks || '',
            });

            setExistingPhotos({
              electricity_bill_photo: survey.electricity_bill_photo,
              consent_form_photo: survey.consent_form_photo,
              aadhar_card_photo: survey.aadhar_card_photo,
            });

            // Load blocks & panchayats for existing record
            if (survey.district) {
              const bList = await biharUlaSurveyService.getBlocks(survey.district);
              setBlocks(bList);
              if (survey.block) {
                const pList = await biharUlaSurveyService.getPanchayats(survey.district, survey.block);
                setPanchayats(pList);
              }
            }
          }
        } else {
          // Auto fetch coordinates on new survey
          detectCoordinates();
        }
      } catch (err: any) {
        console.error('[ULA Survey] Init failed:', err);
        setErrorMsg(err?.message || 'Failed to initialize survey form');
      } finally {
        setInitialLoading(false);
      }
    };

    init();
  }, [editId]);

  // Geolocation detector
  const detectCoordinates = () => {
    setGeoError('');
    if (!navigator.geolocation) {
      setGeoError('Geolocation is not supported by your browser.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setFormData((prev) => ({
          ...prev,
          latitude: pos.coords.latitude.toFixed(6),
          longitude: pos.coords.longitude.toFixed(6),
        }));
      },
      (_err) => {
        setGeoError(
          'Location permission denied. Please allow location access in your browser/site settings, then retry — or continue and enter address manually.'
        );
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Handle District change -> fetch blocks
  const handleDistrictChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const dist = e.target.value;
    setFormData((prev) => ({ ...prev, district: dist, block: '', panchayat: '' }));
    setBlocks([]);
    setPanchayats([]);
    if (!dist) return;

    setLoadingBlocks(true);
    try {
      const bList = await biharUlaSurveyService.getBlocks(dist);
      setBlocks(bList);
    } catch (err) {
      console.error('[ULA Survey] Error fetching blocks:', err);
    } finally {
      setLoadingBlocks(false);
    }
  };

  // Handle Block change -> fetch panchayats
  const handleBlockChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const blk = e.target.value;
    setFormData((prev) => ({ ...prev, block: blk, panchayat: '' }));
    setPanchayats([]);
    if (!blk || !formData.district) return;

    setLoadingPanchayats(true);
    try {
      const pList = await biharUlaSurveyService.getPanchayats(formData.district, blk);
      setPanchayats(pList);
    } catch (err) {
      console.error('[ULA Survey] Error fetching panchayats:', err);
    } finally {
      setLoadingPanchayats(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, fieldName: keyof typeof files) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 2 * 1024 * 1024) {
        alert('File size exceeds 2 MB limit.');
        e.target.value = '';
        return;
      }
      setFiles((prev) => ({ ...prev, [fieldName]: file }));
    }
  };

  // Form submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    // Validations
    if (!formData.district) {
      setErrorMsg('Please select a District.');
      return;
    }
    if (!formData.block) {
      setErrorMsg('Please select a Block.');
      return;
    }
    if (!formData.panchayat) {
      setErrorMsg('Please select a Panchayat.');
      return;
    }
    if (!formData.village.trim()) {
      setErrorMsg('Village is required.');
      return;
    }
    if (!formData.address.trim()) {
      setErrorMsg('Address is required.');
      return;
    }
    if (!formData.consumer_name.trim()) {
      setErrorMsg('Consumer name is required.');
      return;
    }
    if (!/^\d{10}$/.test(formData.contact_no.trim())) {
      setErrorMsg('Contact number must be exactly 10 digits.');
      return;
    }
    if (formData.aadhar_no.trim() && !/^\d{12}$/.test(formData.aadhar_no.trim())) {
      setErrorMsg('Aadhaar number must be exactly 12 digits.');
      return;
    }
    if (!formData.ca_number.trim()) {
      setErrorMsg('CA Number is required.');
      return;
    }

    const isFeasible = formData.feasible_status === '1';

    if (isFeasible) {
      if (formData.smart_meter === '1' && !formData.smart_meter_no.trim()) {
        setErrorMsg('Smart Meter Number is required when Smart Meter is Yes.');
        return;
      }
      // On new record, all 3 photos required
      if (!editId) {
        if (!files.electricity_bill_photo) {
          setErrorMsg('Electricity Bill Photo is required when Feasible Status is Yes.');
          return;
        }
        if (!files.consent_form_photo) {
          setErrorMsg('Consent Form Photo is required when Feasible Status is Yes.');
          return;
        }
        if (!files.aadhar_card_photo) {
          setErrorMsg('Aadhaar Card Photo is required when Feasible Status is Yes.');
          return;
        }
      }
    } else {
      if (!formData.remarks.trim()) {
        setErrorMsg('Remarks are required when Feasible Status is Not Feasible.');
        return;
      }
    }

    const payload = new FormData();
    if (editId) {
      payload.append('id', editId);
    }
    payload.append('district', formData.district);
    payload.append('block', formData.block);
    payload.append('panchayat', formData.panchayat);
    payload.append('village', formData.village);
    payload.append('address', formData.address);
    payload.append('consumer_name', formData.consumer_name);
    payload.append('gender', formData.gender);
    payload.append('contact_no', formData.contact_no);
    if (formData.aadhar_no.trim()) {
      payload.append('aadhar_no', formData.aadhar_no);
    }
    payload.append('ca_number', formData.ca_number);
    payload.append('feasible_status', formData.feasible_status);

    if (formData.latitude) payload.append('latitude', formData.latitude);
    if (formData.longitude) payload.append('longitude', formData.longitude);

    if (isFeasible) {
      payload.append('smart_meter', formData.smart_meter);
      if (formData.smart_meter === '1') {
        payload.append('smart_meter_no', formData.smart_meter_no);
        payload.append('smart_meter_functional', formData.smart_meter_functional);
      }
      if (files.electricity_bill_photo) {
        payload.append('electricity_bill_photo', files.electricity_bill_photo);
      }
      if (files.consent_form_photo) {
        payload.append('consent_form_photo', files.consent_form_photo);
      }
      if (files.aadhar_card_photo) {
        payload.append('aadhar_card_photo', files.aadhar_card_photo);
      }
      if (formData.remarks.trim()) {
        payload.append('remarks', formData.remarks);
      }
    } else {
      payload.append('remarks', formData.remarks);
    }

    setSaving(true);
    try {
      if (editId) {
        const resp = await biharUlaSurveyService.updateSurvey(payload);
        setSuccessMsg(resp.message || 'ULA Survey updated successfully.');
      } else {
        const resp = await biharUlaSurveyService.storeSurvey(payload);
        setSuccessMsg(resp.message || 'ULA Survey saved successfully.');
      }
      setTimeout(() => {
        navigate('/v/bihar/ula-surveys/view');
      }, 1500);
    } catch (err: any) {
      console.error('[ULA Survey] Submit error:', err);
      setErrorMsg(err?.message || 'Failed to save survey. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="ax-page">
      <PageHead
        title={editId ? `Edit Bihar ULA Survey (#${editId})` : 'Bihar ULA Survey Details'}
        subtitle="Unnat Lok Abhiyan (ULA) solar rooftop survey entry form"
        breadcrumbs={[
          { label: 'Home', href: '/v-dashboard' },
          { label: 'Bihar' },
          { label: 'Survey' },
          { label: 'ULA', href: '/v/bihar/ula-surveys/view' },
          { label: editId ? 'Edit' : 'Add Survey' },
        ]}
        actions={
          <Link to="/v/bihar/ula-surveys/view" className="ax-btn ax-btn--secondary ax-btn--sm">
            ← View All Surveys
          </Link>
        }
      />

      <div className="ax-dash-grid">
        <div className="ax-col--12">
          {errorMsg && (
            <div
              className="ax-alert ax-alert--danger"
              style={{
                marginBottom: 'var(--ax-space-4)',
                padding: 'var(--ax-space-3) var(--ax-space-4)',
                borderRadius: 'var(--ax-radius-md)',
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid var(--ax-danger-500, #ef4444)',
                color: 'var(--ax-danger-500, #ef4444)',
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--ax-space-2)',
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div
              className="ax-alert ax-alert--success"
              style={{
                marginBottom: 'var(--ax-space-4)',
                padding: 'var(--ax-space-3) var(--ax-space-4)',
                borderRadius: 'var(--ax-radius-md)',
                background: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid var(--ax-success-500, #10b981)',
                color: 'var(--ax-success-500, #10b981)',
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--ax-space-2)',
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
              <span>{successMsg}</span>
            </div>
          )}

          {initialLoading ? (
            <div className="ax-card" style={{ padding: 'var(--ax-space-10)', textAlign: 'center' }}>
              <span className="ax-spinner" style={{ width: 28, height: 28, margin: '0 auto var(--ax-space-3)' }} />
              <p style={{ color: 'var(--ax-text-muted)' }}>Loading survey data…</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              {/* ── CARD 1: Location Details ── */}
              <section className="ax-card" style={{ marginBottom: 'var(--ax-space-5)' }}>
                <div className="ax-card__header">
                  <div className="ax-card__titles">
                    <span className="ax-card__eyebrow">Section 1</span>
                    <h3 className="ax-card__title">Location Details</h3>
                    <p className="ax-card__subtitle">Select district, block, panchayat, and geographic position</p>
                  </div>
                </div>

                <div className="ax-card__body">
                  <div className="ax-form-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 'var(--ax-space-4)' }}>
                    {/* District */}
                    <div className="ax-field">
                      <label className="ax-label" htmlFor="district">
                        District <span style={{ color: 'var(--ax-danger-500)' }}>*</span>
                      </label>
                      <select
                        id="district"
                        name="district"
                        className="ax-select"
                        value={formData.district}
                        onChange={handleDistrictChange}
                        required
                      >
                        <option value="">Select District</option>
                        {districts.map((d) => (
                          <option key={d} value={d}>
                            {d}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Block */}
                    <div className="ax-field">
                      <label className="ax-label" htmlFor="block">
                        Block <span style={{ color: 'var(--ax-danger-500)' }}>*</span>
                        {loadingBlocks && <small style={{ color: 'var(--ax-text-muted)', marginLeft: 8 }}>(Loading…)</small>}
                      </label>
                      <select
                        id="block"
                        name="block"
                        className="ax-select"
                        value={formData.block}
                        onChange={handleBlockChange}
                        disabled={!formData.district || loadingBlocks}
                        required
                      >
                        <option value="">{formData.district ? 'Select Block' : 'Select District First'}</option>
                        {blocks.map((b) => (
                          <option key={b} value={b}>
                            {b}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Panchayat */}
                    <div className="ax-field">
                      <label className="ax-label" htmlFor="panchayat">
                        Panchayat <span style={{ color: 'var(--ax-danger-500)' }}>*</span>
                        {loadingPanchayats && <small style={{ color: 'var(--ax-text-muted)', marginLeft: 8 }}>(Loading…)</small>}
                      </label>
                      <select
                        id="panchayat"
                        name="panchayat"
                        className="ax-select"
                        value={formData.panchayat}
                        onChange={handleInputChange}
                        disabled={!formData.block || loadingPanchayats}
                        required
                      >
                        <option value="">{formData.block ? 'Select Panchayat' : 'Select Block First'}</option>
                        {panchayats.map((p) => (
                          <option key={p} value={p}>
                            {p}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Village */}
                    <div className="ax-field">
                      <label className="ax-label" htmlFor="village">
                        Village <span style={{ color: 'var(--ax-danger-500)' }}>*</span>
                      </label>
                      <input
                        id="village"
                        type="text"
                        name="village"
                        className="ax-input"
                        placeholder="Enter village name"
                        value={formData.village}
                        onChange={handleInputChange}
                        maxLength={255}
                        required
                      />
                    </div>

                    {/* Address */}
                    <div className="ax-field" style={{ gridColumn: '1 / -1' }}>
                      <label className="ax-label" htmlFor="address">
                        Address <span style={{ color: 'var(--ax-danger-500)' }}>*</span>
                      </label>
                      <textarea
                        id="address"
                        name="address"
                        className="ax-textarea"
                        placeholder="Enter full address / ward details"
                        rows={2}
                        value={formData.address}
                        onChange={handleInputChange}
                        required
                      />
                    </div>

                    {/* Coordinates */}
                    <div className="ax-field">
                      <label className="ax-label" htmlFor="latitude">
                        Latitude
                      </label>
                      <input
                        id="latitude"
                        type="text"
                        name="latitude"
                        className="ax-input"
                        placeholder="e.g. 26.120000"
                        value={formData.latitude}
                        onChange={handleInputChange}
                      />
                    </div>

                    <div className="ax-field">
                      <label className="ax-label" htmlFor="longitude">
                        Longitude
                      </label>
                      <input
                        id="longitude"
                        type="text"
                        name="longitude"
                        className="ax-input"
                        placeholder="e.g. 85.360000"
                        value={formData.longitude}
                        onChange={handleInputChange}
                      />
                    </div>

                    <div className="ax-field" style={{ display: 'flex', alignItems: 'flex-end' }}>
                      <button
                        type="button"
                        className="ax-btn ax-btn--secondary"
                        onClick={detectCoordinates}
                        style={{ width: '100%' }}
                      >
                        📍 Auto Detect Location
                      </button>
                    </div>
                  </div>

                  {geoError && (
                    <div
                      style={{
                        marginTop: 'var(--ax-space-3)',
                        fontSize: 'var(--ax-text-xs)',
                        color: 'var(--ax-warning-500, #d97706)',
                        background: 'rgba(217, 119, 6, 0.08)',
                        padding: 'var(--ax-space-2) var(--ax-space-3)',
                        borderRadius: 'var(--ax-radius-sm)',
                        border: '1px solid rgba(217, 119, 6, 0.25)',
                      }}
                    >
                      {geoError}
                    </div>
                  )}
                </div>
              </section>

              {/* ── CARD 2: Customer Details ── */}
              <section className="ax-card" style={{ marginBottom: 'var(--ax-space-5)' }}>
                <div className="ax-card__header">
                  <div className="ax-card__titles">
                    <span className="ax-card__eyebrow">Section 2</span>
                    <h3 className="ax-card__title">Customer Details</h3>
                    <p className="ax-card__subtitle">Consumer information, identifier numbers, and feasibility</p>
                  </div>
                </div>

                <div className="ax-card__body">
                  <div className="ax-form-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 'var(--ax-space-4)' }}>
                    {/* Consumer Name */}
                    <div className="ax-field">
                      <label className="ax-label" htmlFor="consumer_name">
                        Consumer Name <span style={{ color: 'var(--ax-danger-500)' }}>*</span>
                      </label>
                      <input
                        id="consumer_name"
                        type="text"
                        name="consumer_name"
                        className="ax-input"
                        placeholder="Enter consumer name"
                        value={formData.consumer_name}
                        onChange={handleInputChange}
                        required
                      />
                    </div>

                    {/* Gender */}
                    <div className="ax-field">
                      <label className="ax-label" htmlFor="gender">
                        Gender <span style={{ color: 'var(--ax-danger-500)' }}>*</span>
                      </label>
                      <select
                        id="gender"
                        name="gender"
                        className="ax-select"
                        value={formData.gender}
                        onChange={handleInputChange}
                        required
                      >
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    {/* Contact No */}
                    <div className="ax-field">
                      <label className="ax-label" htmlFor="contact_no">
                        Contact No. (Registered Mobile No.) <span style={{ color: 'var(--ax-danger-500)' }}>*</span>
                      </label>
                      <input
                        id="contact_no"
                        type="tel"
                        name="contact_no"
                        className="ax-input"
                        placeholder="Enter 10-digit mobile number"
                        value={formData.contact_no}
                        onChange={handleInputChange}
                        maxLength={10}
                        required
                      />
                    </div>

                    {/* Aadhaar No */}
                    <div className="ax-field">
                      <label className="ax-label" htmlFor="aadhar_no">
                        Aadhaar No.
                      </label>
                      <input
                        id="aadhar_no"
                        type="text"
                        name="aadhar_no"
                        className="ax-input"
                        placeholder="Enter 12-digit Aadhaar number"
                        value={formData.aadhar_no}
                        onChange={handleInputChange}
                        maxLength={12}
                      />
                    </div>

                    {/* CA No */}
                    <div className="ax-field">
                      <label className="ax-label" htmlFor="ca_number">
                        CA No. <span style={{ color: 'var(--ax-danger-500)' }}>*</span>
                      </label>
                      <input
                        id="ca_number"
                        type="text"
                        name="ca_number"
                        className="ax-input"
                        placeholder="Enter CA number"
                        value={formData.ca_number}
                        onChange={handleInputChange}
                        maxLength={100}
                        required
                      />
                    </div>

                    {/* Feasibility Status */}
                    <div className="ax-field">
                      <label className="ax-label" htmlFor="feasible_status">
                        Feasibility Status <span style={{ color: 'var(--ax-danger-500)' }}>*</span>
                      </label>
                      <select
                        id="feasible_status"
                        name="feasible_status"
                        className="ax-select"
                        value={formData.feasible_status}
                        onChange={handleInputChange}
                        required
                      >
                        <option value="1">Feasible</option>
                        <option value="0">Not Feasible</option>
                      </select>
                    </div>
                  </div>
                </div>
              </section>

              {/* ── CARD 3: Feasibility Details & Documents ── */}
              {formData.feasible_status === '1' ? (
                <section className="ax-card" style={{ marginBottom: 'var(--ax-space-6)' }}>
                  <div className="ax-card__header">
                    <div className="ax-card__titles">
                      <span className="ax-card__eyebrow">Section 3 (Feasible Site)</span>
                      <h3 className="ax-card__title">Meter &amp; Mandatory Documents</h3>
                      <p className="ax-card__subtitle">Smart meter specs and mandatory survey photographs</p>
                    </div>
                  </div>

                  <div className="ax-card__body">
                    <div className="ax-form-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 'var(--ax-space-4)', marginBottom: 'var(--ax-space-5)' }}>
                      {/* Smart Meter */}
                      <div className="ax-field">
                        <label className="ax-label" htmlFor="smart_meter">
                          Smart Meter <span style={{ color: 'var(--ax-danger-500)' }}>*</span>
                        </label>
                        <select
                          id="smart_meter"
                          name="smart_meter"
                          className="ax-select"
                          value={formData.smart_meter}
                          onChange={handleInputChange}
                          required
                        >
                          <option value="0">No</option>
                          <option value="1">Yes</option>
                        </select>
                      </div>

                      {/* Smart Meter No (if smart_meter = 1) */}
                      {formData.smart_meter === '1' && (
                        <>
                          <div className="ax-field">
                            <label className="ax-label" htmlFor="smart_meter_no">
                              Smart Meter No. <span style={{ color: 'var(--ax-danger-500)' }}>*</span>
                            </label>
                            <input
                              id="smart_meter_no"
                              type="text"
                              name="smart_meter_no"
                              className="ax-input"
                              placeholder="Enter Smart Meter Number"
                              value={formData.smart_meter_no}
                              onChange={handleInputChange}
                              required
                            />
                          </div>

                          <div className="ax-field">
                            <label className="ax-label" htmlFor="smart_meter_functional">
                              Smart Meter Functional <span style={{ color: 'var(--ax-danger-500)' }}>*</span>
                            </label>
                            <select
                              id="smart_meter_functional"
                              name="smart_meter_functional"
                              className="ax-select"
                              value={formData.smart_meter_functional}
                              onChange={handleInputChange}
                              required
                            >
                              <option value="1">Yes</option>
                              <option value="0">No</option>
                            </select>
                          </div>
                        </>
                      )}

                      {/* Remarks (optional if feasible) */}
                      <div className="ax-field" style={{ gridColumn: '1 / -1' }}>
                        <label className="ax-label" htmlFor="remarks">
                          Survey Remarks (Optional)
                        </label>
                        <textarea
                          id="remarks"
                          name="remarks"
                          className="ax-textarea"
                          placeholder="Enter any additional observations…"
                          rows={2}
                          value={formData.remarks}
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>

                    {/* Photos Upload */}
                    <div style={{ borderTop: '1px solid var(--ax-border)', paddingTop: 'var(--ax-space-4)' }}>
                      <h4 style={{ margin: '0 0 var(--ax-space-3)', fontSize: 'var(--ax-text-sm)', color: 'var(--ax-text-strong)' }}>
                        Mandatory Photographs (Max 2MB each: JPG, JPEG, PNG)
                      </h4>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 'var(--ax-space-4)' }}>
                        {/* Electricity Bill Photo */}
                        <div className="ax-field">
                          <label className="ax-label">
                            Electricity Bill Photo {!editId && <span style={{ color: 'var(--ax-danger-500)' }}>*</span>}
                          </label>
                          <input
                            type="file"
                            accept="image/jpeg,image/png,image/jpg"
                            className="ax-input"
                            onChange={(e) => handleFileChange(e, 'electricity_bill_photo')}
                            required={!editId}
                          />
                          {existingPhotos.electricity_bill_photo && (
                            <small style={{ marginTop: 4, display: 'block', color: 'var(--ax-text-muted)' }}>
                              Current file: {existingPhotos.electricity_bill_photo}
                            </small>
                          )}
                        </div>

                        {/* Consent Form Photo */}
                        <div className="ax-field">
                          <label className="ax-label">
                            Consent Form Photo {!editId && <span style={{ color: 'var(--ax-danger-500)' }}>*</span>}
                          </label>
                          <input
                            type="file"
                            accept="image/jpeg,image/png,image/jpg"
                            className="ax-input"
                            onChange={(e) => handleFileChange(e, 'consent_form_photo')}
                            required={!editId}
                          />
                          {existingPhotos.consent_form_photo && (
                            <small style={{ marginTop: 4, display: 'block', color: 'var(--ax-text-muted)' }}>
                              Current file: {existingPhotos.consent_form_photo}
                            </small>
                          )}
                        </div>

                        {/* Aadhaar Card Photo */}
                        <div className="ax-field">
                          <label className="ax-label">
                            Aadhaar Card Photo {!editId && <span style={{ color: 'var(--ax-danger-500)' }}>*</span>}
                          </label>
                          <input
                            type="file"
                            accept="image/jpeg,image/png,image/jpg"
                            className="ax-input"
                            onChange={(e) => handleFileChange(e, 'aadhar_card_photo')}
                            required={!editId}
                          />
                          {existingPhotos.aadhar_card_photo && (
                            <small style={{ marginTop: 4, display: 'block', color: 'var(--ax-text-muted)' }}>
                              Current file: {existingPhotos.aadhar_card_photo}
                            </small>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </section>
              ) : (
                /* Feasible Status = 0 (Not Feasible) */
                <section className="ax-card" style={{ marginBottom: 'var(--ax-space-6)' }}>
                  <div className="ax-card__header">
                    <div className="ax-card__titles">
                      <span className="ax-card__eyebrow">Section 3 (Not Feasible)</span>
                      <h3 className="ax-card__title">Non-Feasibility Reason</h3>
                      <p className="ax-card__subtitle">Please explain why this site is not feasible</p>
                    </div>
                  </div>
                  <div className="ax-card__body">
                    <div className="ax-field">
                      <label className="ax-label" htmlFor="remarks">
                        Remarks / Reason for Non-Feasibility <span style={{ color: 'var(--ax-danger-500)' }}>*</span>
                      </label>
                      <textarea
                        id="remarks"
                        name="remarks"
                        className="ax-textarea"
                        placeholder="State clear reasons why the site is not feasible (e.g. shadow issues, damaged roof, dispute, etc.)"
                        rows={4}
                        value={formData.remarks}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                  </div>
                </section>
              )}

              {/* Submit Buttons */}
              <div style={{ display: 'flex', gap: 'var(--ax-space-3)', justifyContent: 'flex-end', marginTop: 'var(--ax-space-6)' }}>
                <button
                  type="button"
                  className="ax-btn ax-btn--secondary"
                  onClick={() => navigate('/v/bihar/ula-surveys/view')}
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="ax-btn ax-btn--primary"
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <span className="ax-spinner" style={{ width: 16, height: 16, marginRight: 8 }} />
                      Saving…
                    </>
                  ) : editId ? (
                    'Update ULA Survey'
                  ) : (
                    'Submit ULA Survey'
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default Bihar_Survey_ULA_AddData;
