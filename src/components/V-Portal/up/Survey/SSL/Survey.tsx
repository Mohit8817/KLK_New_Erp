import { useEffect, useState, type FormEvent } from 'react';
import { PageHead } from '../../../../shell/PageHead';
import {
  upSurveyService,
  getUpSurveyMediaUrl,
  type UpSslSiteRecord,
} from '../../up-services';

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
    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
    gap: 14px;
  }
  @media (min-width: 1024px) {
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
    padding: 8px 12px;
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
  .form-field input[readonly],
  .form-field textarea[readonly] {
    background: var(--ax-surface-subtle, #f8fafc);
    cursor: default;
  }
`;

export function UP_Survey_SSL_Survey() {
  const [uids, setUids] = useState<Array<{ id: number | string; uid: string; site_name?: string }>>([]);
  const [loadingUids, setLoadingUids] = useState(false);
  const [selectedUid, setSelectedUid] = useState('');
  const [siteDetail, setSiteDetail] = useState<UpSslSiteRecord | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Status updates
  const [mode, setMode] = useState('ONLINE');
  const [remarks, setRemarks] = useState('');
  const [demo1, setDemo1] = useState<File | null>(null);
  const [demo2, setDemo2] = useState<File | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Load UIDs
  useEffect(() => {
    setLoadingUids(true);
    upSurveyService
      .getSslUids()
      .then((res) => {
        setUids(res);
      })
      .catch((err) => {
        console.error('Error fetching SSL UIDs:', err);
      })
      .finally(() => {
        setLoadingUids(false);
      });
  }, []);

  // Fetch site detail upon UID selection
  const handleSelectUid = async (uidVal: string) => {
    setSelectedUid(uidVal);
    if (!uidVal) {
      setSiteDetail(null);
      return;
    }
    setLoadingDetail(true);
    try {
      const detail = await upSurveyService.getSslSiteDetail(uidVal);
      setSiteDetail(detail);
      if (detail?.remarks) setRemarks(detail.remarks);
      if (detail?.mode) setMode(detail.mode);
    } catch (err) {
      console.error('Error loading site detail:', err);
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedUid) {
      setToast({ type: 'error', message: 'Please select a UID first.' });
      return;
    }

    setSubmitting(true);
    setToast(null);

    const fd = new FormData();
    fd.append('uid', selectedUid);
    fd.append('mode', mode);
    fd.append('remarks', remarks);
    if (demo1) fd.append('demo1_image', demo1);
    if (demo2) fd.append('demo2_image', demo2);

    try {
      const res = await upSurveyService.updateSslSurvey(fd);
      if (res.status) {
        setToast({ type: 'success', message: res.message || 'SSL survey status updated successfully!' });
      } else {
        setToast({ type: 'error', message: res.message || 'Failed to update survey status.' });
      }
    } catch (err: any) {
      setToast({ type: 'error', message: err?.message || 'Error occurred while saving.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="ax-page solar-erp-page">
      <style>{CSS}</style>

      {/* Header */}
      <PageHead
        title="Welcome to, UPDATE SSL SURVEY STATUS"
        subtitle="UPDATE SSL SURVEY STATUS — Review site details and update SSL survey status"
        breadcrumbs={[
          { label: 'Home', href: '/v' },
          { label: 'UPDATE SSL SURVEY STATUS' },
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

      {/* Step 1: Select UID */}
      <div className="ax-card" style={{ marginBottom: 20, padding: 20, borderRadius: 12 }}>
        <div className="form-field" style={{ maxWidth: 450 }}>
          <label htmlFor="ssl-uid-select">
            Select UID&apos;s <span className="req">*</span>
          </label>
          <select
            id="ssl-uid-select"
            value={selectedUid}
            onChange={(e) => handleSelectUid(e.target.value)}
            disabled={loadingUids}
            required
          >
            <option value="">Select</option>
            {uids.map((u, i) => (
              <option key={u.id || i} value={u.uid || u.id}>
                {u.uid} {u.site_name ? `(${u.site_name})` : ''}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Step 2: Site Details (read-only grid) */}
      <div className="ax-card" style={{ marginBottom: 20, padding: 20, borderRadius: 12 }}>
        <div className="survey-section-title">Site Details</div>
        <div className="form-grid form-grid-4">
          <div className="form-field">
            <label>Financial Year</label>
            <input type="text" readOnly value={siteDetail?.financial_year || '—'} />
          </div>
          <div className="form-field">
            <label>State</label>
            <input type="text" readOnly value={(siteDetail?.state || 'UP').toUpperCase()} />
          </div>
          <div className="form-field">
            <label>District</label>
            <input type="text" readOnly value={siteDetail?.district || '—'} />
          </div>
          <div className="form-field">
            <label>Village</label>
            <input type="text" readOnly value={siteDetail?.village || '—'} />
          </div>
          <div className="form-field">
            <label>Scheme</label>
            <input type="text" readOnly value={siteDetail?.scheme || '—'} />
          </div>
          <div className="form-field">
            <label>Vendor</label>
            <input type="text" readOnly value={siteDetail?.vendor || '—'} />
          </div>
          <div className="form-field">
            <label>Beneficiary Name</label>
            <input type="text" readOnly value={siteDetail?.beneficiary_name || '—'} />
          </div>
          <div className="form-field">
            <label>UID</label>
            <input type="text" readOnly value={siteDetail?.uid || selectedUid || '—'} style={{ fontWeight: 600 }} />
          </div>
          <div className="form-field">
            <label>Contact</label>
            <input type="text" readOnly value={siteDetail?.contact_no || '—'} />
          </div>
          <div className="form-field">
            <label>Material Supply</label>
            <input type="text" readOnly value={siteDetail?.material_supply || '—'} />
          </div>
          <div className="form-field">
            <label>Supply Date</label>
            <input type="text" readOnly value={siteDetail?.supply_date || '—'} />
          </div>
          <div className="form-field">
            <label>Install</label>
            <input type="text" readOnly value={siteDetail?.install || '—'} />
          </div>
          <div className="form-field">
            <label>Installed Date</label>
            <input type="text" readOnly value={siteDetail?.installed_date || '—'} />
          </div>
          <div className="form-field">
            <label>Payment 85%</label>
            <input type="text" readOnly value={siteDetail?.payment_85 || '—'} />
          </div>
          <div className="form-field">
            <label>AMC 1</label>
            <input type="text" readOnly value={siteDetail?.amc_1 || '—'} />
          </div>
          <div className="form-field">
            <label>AMC 2</label>
            <input type="text" readOnly value={siteDetail?.amc_2 || '—'} />
          </div>
          <div className="form-field">
            <label>AMC 3</label>
            <input type="text" readOnly value={siteDetail?.amc_3 || '—'} />
          </div>
          <div className="form-field">
            <label>AMC 4</label>
            <input type="text" readOnly value={siteDetail?.amc_4 || '—'} />
          </div>
          <div className="form-field">
            <label>AMC 5</label>
            <input type="text" readOnly value={siteDetail?.amc_5 || '—'} />
          </div>
          <div className="form-field">
            <label>Document Submitted</label>
            <input type="text" readOnly value={siteDetail?.document_submitted || '—'} />
          </div>
        </div>
      </div>

      {/* Step 3: Survey Update & Demo Images Form */}
      <form onSubmit={handleSubmit}>
        <div className="ax-card" style={{ marginBottom: 20, padding: 20, borderRadius: 12 }}>
          <div className="survey-section-title">Remarks & Mode</div>
          <div className="form-grid form-grid-4" style={{ marginBottom: 20 }}>
            <div className="form-field">
              <label>Mode</label>
              <select value={mode} onChange={(e) => setMode(e.target.value)}>
                <option value="ONLINE">ONLINE</option>
                <option value="OFFLINE">OFFLINE</option>
              </select>
            </div>
            <div className="form-field" style={{ gridColumn: 'span 3' }}>
              <label>Remarks</label>
              <input
                type="text"
                placeholder="Enter remarks..."
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
              />
            </div>
          </div>

          <div className="survey-section-title">Demo Images</div>
          <div className="form-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', marginBottom: 20 }}>
            <div className="form-field">
              <label>Demo 1 (Image 1)</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => e.target.files && setDemo1(e.target.files[0])}
              />
            </div>
            <div className="form-field">
              <label>Demo 2 (Image 2)</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => e.target.files && setDemo2(e.target.files[0])}
              />
            </div>
          </div>

          {/* Uploaded Images section */}
          <div className="survey-section-title">Uploaded Images</div>
          {siteDetail?.uploaded_images && siteDetail.uploaded_images.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
              {siteDetail.uploaded_images.map((img, i) => (
                <div key={i} style={{ textAlign: 'center' }}>
                  <a href={getUpSurveyMediaUrl(img)} target="_blank" rel="noreferrer">
                    <img
                      src={getUpSurveyMediaUrl(img)}
                      alt={`Uploaded ${i + 1}`}
                      style={{ width: '100%', height: 110, objectFit: 'cover', border: '1px solid var(--ax-border)' }}
                    />
                  </a>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ fontSize: 12.5, color: 'var(--ax-text-muted)', margin: '0 0 16px' }}>
              No images uploaded yet for this site.
            </p>
          )}

          {/* Submit */}
          <div
            style={{
              marginTop: 24,
              paddingTop: 16,
              borderTop: '1px solid var(--ax-border, #e2e8f0)',
              display: 'flex',
              justifyContent: 'flex-end',
            }}
          >
            <button
              type="submit"
              className="ax-btn ax-btn--primary"
              disabled={submitting}
              style={{
                padding: '10px 24px',
                borderRadius: 8,
                background: '#2563eb',
                color: '#ffffff',
                fontWeight: 600,
              }}
            >
              {submitting ? 'Updating...' : 'Update SSL Survey Status'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

export const UPSurveySSLSurvey = UP_Survey_SSL_Survey;
export default UP_Survey_SSL_Survey;
