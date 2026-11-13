import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHead } from '../../../../shell/PageHead';
import { biharAdminService } from '../../bihar-services/biharAdminService';

interface VendorOption {
  id: number | string;
  name: string;
}

interface VolumeOption {
  id: number | string;
  name: string;
}

export function BiharULAInstallationAssignSites() {
  const navigate = useNavigate();

  // Form State
  const [vendorName, setVendorName] = useState('');
  const [volume, setVolume] = useState('');
  const [district, setDistrict] = useState('');
  const [block, setBlock] = useState('');
  const [village, setVillage] = useState('');
  const [beneficiaryName, setBeneficiaryName] = useState('');
  const [deadlineDate, setDeadlineDate] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [remarks, setRemarks] = useState('');

  // Dropdown Lists
  const [vendorList, setVendorList] = useState<VendorOption[]>([
    { id: 1, name: 'ETS Networks Pvt Ltd' },
    { id: 2, name: 'Shakti Pumps Ltd' },
    { id: 3, name: 'Tata Power Solar Systems' },
    { id: 4, name: 'RenewSys Power Ltd' },
  ]);
  const [volumeList, setVolumeList] = useState<VolumeOption[]>([
    { id: 'Phase-1', name: 'Phase-1 (2024-25)' },
    { id: 'Phase-2', name: 'Phase-2 (2025-26)' },
    { id: 'Phase-3', name: 'Phase-3 (2026-27)' },
  ]);
  const [districtList, setDistrictList] = useState<string[]>([
    'Patna',
    'Gaya',
    'Nalanda',
    'Muzaffarpur',
    'Bhagalpur',
    'Rohtas',
    'Vaishali',
  ]);
  const [blockList, setBlockList] = useState<string[]>([]);
  const [villageList, setVillageList] = useState<string[]>([]);
  const [beneficiaryList, setBeneficiaryList] = useState<string[]>([]);

  // UI state
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Load initial form data
  useEffect(() => {
    async function loadInitial() {
      try {
        const res = await biharAdminService.getUlaAssignForm();
        if (res && res.data) {
          if (Array.isArray(res.data.vendors)) {
            setVendorList(
              res.data.vendors.map((v: any) => ({
                id: v.id || v.vendor_id,
                name: v.name || v.vendor_name || v.firm_name,
              }))
            );
          }
          if (Array.isArray(res.data.volumes)) {
            setVolumeList(
              res.data.volumes.map((vol: any) => ({
                id: vol.id || vol.volume || vol.name,
                name: vol.name || vol.volume || vol.title,
              }))
            );
          }
        }
      } catch (err) {
        console.warn('[AssignSites ULA] Error fetching form data, using fallback lists:', err);
      }
    }
    loadInitial();
  }, []);

  // When volume changes, load districts
  const handleVolumeChange = async (val: string) => {
    setVolume(val);
    setDistrict('');
    setBlock('');
    setVillage('');
    setBeneficiaryName('');
    setBlockList([]);
    setVillageList([]);
    setBeneficiaryList([]);

    if (!val) return;
    try {
      const res = await biharAdminService.getUlaDistricts(val);
      if (res && res.data && Array.isArray(res.data)) {
        setDistrictList(res.data.map((d: any) => (typeof d === 'string' ? d : d.district || d.name)));
      }
    } catch (err) {
      console.warn('[AssignSites ULA] District fetch failed:', err);
    }
  };

  // When district changes, load blocks
  const handleDistrictChange = async (val: string) => {
    setDistrict(val);
    setBlock('');
    setVillage('');
    setBeneficiaryName('');
    setVillageList([]);
    setBeneficiaryList([]);

    if (!val) return;
    try {
      const res = await biharAdminService.getUlaBlocks(volume, val);
      if (res && res.data && Array.isArray(res.data)) {
        setBlockList(res.data.map((b: any) => (typeof b === 'string' ? b : b.block || b.name)));
      } else {
        setBlockList([]);
      }
    } catch (err) {
      setBlockList([]);
    }
  };

  // When block changes, load villages
  const handleBlockChange = async (val: string) => {
    setBlock(val);
    setVillage('');
    setBeneficiaryName('');
    setBeneficiaryList([]);

    if (!val) return;
    try {
      const res = await biharAdminService.getUlaVillages(val);
      if (res && res.data && Array.isArray(res.data)) {
        setVillageList(res.data.map((v: any) => (typeof v === 'string' ? v : v.village || v.name)));
      } else {
        setVillageList([]);
      }
    } catch (err) {
      setVillageList([]);
    }
  };

  // When village changes, load beneficiaries
  const handleVillageChange = async (val: string) => {
    setVillage(val);
    setBeneficiaryName('');

    if (!val) return;
    try {
      const res = await biharAdminService.getUlaBeneficiaries(val);
      if (res && res.data && Array.isArray(res.data)) {
        setBeneficiaryList(res.data.map((b: any) => (typeof b === 'string' ? b : b.beneficiary_name || b.name)));
      } else {
        setBeneficiaryList([]);
      }
    } catch (err) {
      setBeneficiaryList([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!vendorName || !volume || !district || !block || !village || !beneficiaryName || !deadlineDate) {
      setErrorMessage('Please fill in all mandatory fields marked with an asterisk (*).');
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('vendor_name', vendorName);
      formData.append('volume', volume);
      formData.append('district', district);
      formData.append('block', block);
      formData.append('village', village);
      formData.append('beneficiary_name', beneficiaryName);
      formData.append('deadline_date', deadlineDate);
      if (file) {
        formData.append('file', file);
      }
      formData.append('remarks', remarks);

      await biharAdminService.storeUlaAssign(formData);
      setSuccessMessage('Bihar ULA site assigned successfully!');
      setTimeout(() => {
        navigate('/vendor-management/bihar/ula/installation/view-assign-site');
      }, 1200);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to submit site assignment. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="solar-erp-page app-container" style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <PageHead
        title="Assign Bihar ULA Installation"
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Vendor Management', href: '/vendor-management' },
          { label: 'Bihar', href: '/vendor-management/bihar' },
          { label: 'ULA Installation', href: '/vendor-management/bihar/ula/installation/dashboard' },
          { label: 'Assign Bihar ULA Installation' },
        ]}
      />

      {errorMessage && (
        <div
          className="ax-banner ax-banner--danger"
          style={{
            marginBottom: '16px',
            padding: '12px 16px',
            borderRadius: '8px',
            background: '#fee2e2',
            color: '#b91c1c',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <span className="material-symbols-outlined">error</span>
          <span>{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div
          className="ax-banner ax-banner--success"
          style={{
            marginBottom: '16px',
            padding: '12px 16px',
            borderRadius: '8px',
            background: '#dcfce7',
            color: '#15803d',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <span className="material-symbols-outlined">check_circle</span>
          <span>{successMessage}</span>
        </div>
      )}

      <div className="ax-card" style={{ padding: '28px', borderRadius: '12px', background: '#ffffff', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <div style={{ marginBottom: '20px', borderBottom: '1px solid #f1f5f9', paddingBottom: '14px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#1e293b', margin: 0 }}>
            Assign Bihar ULA Installation
          </h2>
          <p style={{ fontSize: '13px', color: '#64748b', marginTop: '6px' }}>
            The field labels marked with <span style={{ color: '#ef4444', fontWeight: 'bold' }}>*</span> are required input fields.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
            {/* Vendor Name * */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                Vendor Name <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <select
                value={vendorName}
                onChange={(e) => setVendorName(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  background: '#ffffff',
                  fontSize: '13px',
                }}
              >
                <option value="">-- Select Vendor --</option>
                {vendorList.map((v) => (
                  <option key={v.id} value={v.name}>
                    {v.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Volume * */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                Volume <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <select
                value={volume}
                onChange={(e) => handleVolumeChange(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  background: '#ffffff',
                  fontSize: '13px',
                }}
              >
                <option value="">-- Select Volume --</option>
                {volumeList.map((vol) => (
                  <option key={vol.id} value={String(vol.id)}>
                    {vol.name}
                  </option>
                ))}
              </select>
            </div>

            {/* District * */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                District <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <select
                value={district}
                onChange={(e) => handleDistrictChange(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  background: '#ffffff',
                  fontSize: '13px',
                }}
              >
                <option value="">-- Select District --</option>
                {districtList.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            {/* Block * */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                Block <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <select
                value={block}
                onChange={(e) => handleBlockChange(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  background: '#ffffff',
                  fontSize: '13px',
                }}
              >
                <option value="">-- Select block --</option>
                {blockList.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>

            {/* Village * */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                Village <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <select
                value={village}
                onChange={(e) => handleVillageChange(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  background: '#ffffff',
                  fontSize: '13px',
                }}
              >
                <option value="">-- Select Village --</option>
                {villageList.map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
            </div>

            {/* Beneficiary Name * */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                Beneficiary Name <span style={{ color: '#ef4444' }}>*</span>
              </label>
              {beneficiaryList.length > 0 ? (
                <select
                  value={beneficiaryName}
                  onChange={(e) => setBeneficiaryName(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    background: '#ffffff',
                    fontSize: '13px',
                  }}
                >
                  <option value="">-- Select Beneficiary --</option>
                  {beneficiaryList.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  placeholder="Enter Beneficiary Name..."
                  value={beneficiaryName}
                  onChange={(e) => setBeneficiaryName(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13px',
                  }}
                />
              )}
            </div>

            {/* Deadline Date * */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                Deadline Date <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="date"
                value={deadlineDate}
                onChange={(e) => setDeadlineDate(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  fontSize: '13px',
                }}
              />
            </div>

            {/* File * */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                File <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="file"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                style={{
                  width: '100%',
                  padding: '7px 10px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  fontSize: '12px',
                }}
              />
            </div>
          </div>

          {/* Remarks */}
          <div style={{ marginTop: '20px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
              Remarks
            </label>
            <textarea
              rows={3}
              placeholder="Enter Remarks..."
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              style={{
                width: '100%',
                padding: '9px 12px',
                borderRadius: '6px',
                border: '1px solid #cbd5e1',
                fontSize: '13px',
                resize: 'vertical',
              }}
            />
          </div>

          <div style={{ marginTop: '24px', display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button
              type="button"
              className="ax-btn ax-btn--secondary"
              onClick={() => navigate('/vendor-management/bihar/ula/installation/dashboard')}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="ax-btn ax-btn--primary"
              disabled={submitting}
              style={{ minWidth: '120px' }}
            >
              {submitting ? 'Assigning...' : 'Assign Sites'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
