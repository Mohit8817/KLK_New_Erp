import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { PageHead } from '../../../../shell/PageHead';
import { authService } from '../../../../../services/authService';
import type { UpAssignedDataResponse } from '../../up-services';
import {
  Pagination,
  usePagination,
  SearchInput,
  TableExportToolbar,
  TableEmptyState,
  copyTableDataToClipboard,
  exportDataToCSV,
  exportDataToExcel,
  printTableData,
  type ExportColumn,
} from '../../../../../common';
import {
  DASH,
  Modal,
  ImagePreviewModal,
  PAGE_CSS,
  OVERLAY_CSS,
  X_ICON,
  ICON_REFRESH,
  actionsRowStyle,
  footerStyle,
  centerCell,
  pick,
  allDocUrlsOf,
  StatusBadge,
  type DetailField,
  type ComplaintColumn,
} from '../CommonSharedComplaints/UpComplaintsShared';
import {
  UploadDrop,
  DetailSectionCard,
  AttachmentCardGrid,
} from './UpComplaintModalUI';

type Tab = 'open' | 'approved' | 'close';
const TAB_LABEL: Record<Tab, string> = { open: 'Open', approved: 'Approved', close: 'Closed' };

const num = (x: unknown) => (Number(x) || 0).toLocaleString('en-IN');

/* ───────── KPI card (same as Bihar Assigned Lights) ───────── */
type KpiTone = 'accent' | 'cyan' | 'emerald' | 'amber';

const TONE: Record<KpiTone, { bg: string; fg: string }> = {
  accent: { bg: 'rgba(37, 99, 235, 0.12)', fg: '#2563eb' },
  cyan: { bg: 'color-mix(in oklab, var(--ax-viz-cyan, #06b6d4) 14%, transparent)', fg: '#0891b2' },
  emerald: { bg: 'color-mix(in oklab, var(--ax-viz-emerald, #10b981) 14%, transparent)', fg: '#16a34a' },
  amber: { bg: 'color-mix(in oklab, var(--ax-viz-amber, #f59e0b) 14%, transparent)', fg: '#d97706' },
};

function KpiCard({ icon, tone, label, value, sub }: { icon: ReactNode; tone: KpiTone; label: string; value: ReactNode; sub: string }) {
  const t = TONE[tone];
  return (
    <div className="ax-card" style={{ padding: '14px 18px', borderRadius: 12, minWidth: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        <span
          style={{
            width: 28, height: 28, borderRadius: 8, background: t.bg, color: t.fg,
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}
        >
          <span style={{ width: 15, height: 15, display: 'inline-flex' }}>{icon}</span>
        </span>
        <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ax-text-muted)', letterSpacing: '0.04em' }}>
          {label}
        </span>
      </div>
      <div style={{ fontSize: 24, fontWeight: 800, color: t.fg, marginTop: 4, fontFamily: 'var(--ax-font-display)' }}>{value}</div>
      <div style={{ fontSize: 12, color: 'var(--ax-text-muted)', marginTop: 2 }}>{sub}</div>
    </div>
  );
}

const ASSIGNED_CSS = `
  .solar-erp-page .asw-cards-row {
    display: grid; grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: var(--ax-space-4, 16px); margin-bottom: var(--ax-space-5, 20px);
  }
  @media (max-width: 992px) { .solar-erp-page .asw-cards-row { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
  @media (max-width: 520px) { .solar-erp-page .asw-cards-row { grid-template-columns: 1fr; } }
  .ax-modal .ula-m-note { margin: 0; font-size: var(--ax-text-sm, 13px); color: var(--ax-text-muted, #64748b); }
  .ax-modal textarea.ax-input { resize: vertical; min-height: 84px; line-height: 1.45; }
  .ax-modal .ula-m-two { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: var(--ax-space-4, 16px); }
  @media (max-width: 560px) { .ax-modal .ula-m-two { grid-template-columns: minmax(0, 1fr); } }
`;

const Req = () => <span style={{ color: 'var(--ax-danger-500)' }} aria-hidden="true">*</span>;

const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

/* ───────── Close complaint modal ───────── */
export interface CloseValues {
  remarks: string;
  date: string;
  file: File;
  resolvedBy: string;
  contactPerson: string;
  contactNumber: string;
  email: string;
  mobile: string;
  closeSms: 'Yes' | 'No';
  file1: File | null;
}

export interface CloseConfig<T> {
  heading: string;
  /** 'resolver' adds Resolved By / Mobile / Email / Send SMS / extra file. */
  variant?: 'simple' | 'resolver';
  /** Show editable Contact Person & Contact Number fields (pre-filled from complaint row). */
  showContactFields?: boolean;
  summary: (item: T) => { label: string; value: string }[];
  remarksPlaceholder: string;
  fileLabel: string;
  fileHint?: string;
  defaultSuccess: string;
  /** resolver variant: make the email mandatory. */
  emailRequired?: boolean;
  /** resolver variant: default for the Send SMS radio. */
  smsDefault?: 'Yes' | 'No';
  file1Label?: string;
  file1Hint?: string;
  file1Required?: boolean;
  submit: (v: CloseValues, item: T) => Promise<{ status?: boolean | number; message?: string; errors?: Record<string, unknown> }>;
}

function getLoggedInUserInfo(): { name: string; email: string; mobile: string } {
  const session = authService.getSession() as any;
  const raw = authService.getRawResponse() as any;
  const userObj =
    raw?.vendor || raw?.user || raw?.data?.vendor || raw?.data?.user || raw?.data || {};
  const name = String(
    session?.name ||
      session?.vendor_name ||
      session?.user?.name ||
      session?.vendor?.name ||
      userObj?.name ||
      userObj?.vendor_name ||
      userObj?.company_name ||
      session?.email ||
      ''
  ).trim();
  const email = String(
    session?.email || session?.user?.email || session?.vendor?.email || userObj?.email || ''
  ).trim();
  const mobile = String(
    session?.contact ||
      session?.mobile ||
      session?.phone ||
      session?.contact_no ||
      userObj?.contact ||
      userObj?.mobile ||
      userObj?.phone ||
      userObj?.contact_no ||
      ''
  )
    .replace(/\D/g, '')
    .slice(0, 10);
  return { name, email, mobile };
}

function CloseModal<T extends object>({
  item,
  cfg,
  onClose,
  onSuccess,
}: {
  item: T | null;
  cfg: CloseConfig<T>;
  onClose: () => void;
  onSuccess: (msg: string) => void;
}) {
  const resolver = cfg.variant === 'resolver';
  const showContact = Boolean(cfg.showContactFields);
  const [remarks, setRemarks] = useState('');
  const [date, setDate] = useState(todayStr);
  const [file, setFile] = useState<File | null>(null);
  const [file1, setFile1] = useState<File | null>(null);
  const [resolvedBy, setResolvedBy] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [closeSms, setCloseSms] = useState<'Yes' | 'No'>(cfg.smsDefault ?? 'Yes');
  const [attempted, setAttempted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!item) return;
    const logged = getLoggedInUserInfo();
    setRemarks('');
    setDate(todayStr());
    setFile(null);
    setFile1(null);
    setResolvedBy(logged.name || 'Vendor');
    setContactPerson(
      pick(item, ['contact_person', 'beneficiary_name', 'site_name', 'name'], '')
    );
    setContactNumber(
      pick(item, ['contact_number', 'contact_no', 'mobile_no', 'mobile', 'phone'], '')
        .replace(/\D/g, '')
        .slice(0, 10)
    );
    setEmail(logged.email || '');
    setMobile(logged.mobile || '');
    setCloseSms(cfg.smsDefault ?? 'Yes');
    setAttempted(false);
    setError('');
  }, [item, cfg.smsDefault]);

  const summaryItems = useMemo(() => {
    if (!item) return [];
    const logged = getLoggedInUserInfo();
    const base = cfg.summary(item);
    const existingKeys = new Set(
      base.map((s) => s.label.toLowerCase().replace(/[^a-z0-9]/g, ''))
    );

    const extras: { label: string; value: string; fullWidth?: boolean }[] = [
      { label: 'State', value: pick(item, ['state'], 'UP') },
      { label: 'District', value: pick(item, ['district', 'district_name', 'f_district']) },
      {
        label: 'Beneficiary Name',
        value: pick(item, [
          'beneficiary_name',
          'farmer_name',
          'f_name',
          'customer_name',
          'site_name',
          'name',
        ]),
      },
      { label: 'Order No', value: pick(item, ['wo_no', 'work_order_no', 'order_no']) },
      {
        label: 'Created By',
        value: pick(item, ['created_by', 'complaint_raised_by'], logged.name || DASH),
      },
      { label: 'Complaint No', value: pick(item, ['complaint_id', 'id']) },
      {
        label: 'Complaint Date',
        value: pick(item, ['start_date', 'complaint_date', 'created_date', 'created_at']),
      },
      { label: 'Complaint', value: pick(item, ['complaint']), fullWidth: true },
    ];

    const merged: { label: string; value: string; fullWidth?: boolean }[] = [...base];
    for (const ex of extras) {
      const norm = ex.label.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (
        existingKeys.has(norm) ||
        (norm === 'beneficiaryname' && existingKeys.has('beneficiary')) ||
        (norm === 'orderno' && (existingKeys.has('wono') || existingKeys.has('workorderno')))
      ) {
        continue;
      }
      merged.push(ex);
    }
    return merged;
  }, [item, cfg]);

  const contactPersonInvalid = showContact && attempted && !contactPerson.trim();
  const contactNumberInvalid = showContact && attempted && !/^\d{10}$/.test(contactNumber.trim());
  const mobileInvalid = resolver && attempted && !/^\d{10}$/.test(mobile.trim());
  const emailInvalid =
    resolver &&
    attempted &&
    ((cfg.emailRequired && (!email.trim() || !/\S+@\S+\.\S+/.test(email.trim()))) ||
      (!cfg.emailRequired && email.trim() !== '' && !/\S+@\S+\.\S+/.test(email.trim())));
  const dateInvalid = attempted && !date;
  const remarksInvalid = attempted && !remarks.trim();
  const fileInvalid = attempted && !file;
  const file1Invalid = Boolean(cfg.file1Required && attempted && !file1);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!item) return;
    setAttempted(true);
    const activeResolvedBy = resolvedBy.trim() || getLoggedInUserInfo().name || 'Vendor';
    if (showContact && !contactPerson.trim()) return setError('Contact person is required.');
    if (showContact && !/^\d{10}$/.test(contactNumber.trim())) return setError('10-digit Contact number is required.');
    if (resolver && !/^\d{10}$/.test(mobile.trim())) return setError('10-digit Resolver Mobile is required.');
    if (resolver && cfg.emailRequired && !/\S+@\S+\.\S+/.test(email.trim())) return setError('A valid Resolver Email is required.');
    if (resolver && !cfg.emailRequired && email.trim() && !/\S+@\S+\.\S+/.test(email.trim())) return setError('Enter a valid Resolver Email.');
    if (!date) return setError('Closing date is required.');
    if (!remarks.trim()) return setError('Resolution remarks are required.');
    if (!file) return setError('Resolution verification document / photo is required.');
    if (cfg.file1Required && !file1) {
      return setError(cfg.file1Label ? `${cfg.file1Label.replace(/\s*\(Required\)/i, '')} is required.` : 'Resolution File 2 is required.');
    }

    setSubmitting(true);
    setError('');
    try {
      const res = await cfg.submit(
        {
          remarks: remarks.trim(),
          date,
          file,
          resolvedBy: activeResolvedBy,
          contactPerson: contactPerson.trim(),
          contactNumber: contactNumber.trim(),
          email: email.trim(),
          mobile: mobile.trim(),
          closeSms,
          file1,
        },
        item
      );
      if (res.status) {
        onSuccess(res.message || cfg.defaultSuccess);
        onClose();
      } else {
        let errorMsg = res.message || 'Failed to close complaint.';
        if (res.errors && typeof res.errors === 'object') {
          const detailMsgs = Object.entries(res.errors)
            .map(([k, v]) => {
              const text = Array.isArray(v) ? v.join(', ') : String(v);
              return `${k.replace(/_/g, ' ')}: ${text}`;
            })
            .join(' | ');
          if (detailMsgs && !errorMsg.includes(detailMsgs)) {
            errorMsg = errorMsg ? `${errorMsg} — ${detailMsgs}` : detailMsgs;
          }
        }
        setError(errorMsg);
      }
    } catch (err: any) {
      setError(err?.message || 'Error occurred while closing complaint.');
    } finally {
      setSubmitting(false);
    }
  };

  const close = () => !submitting && onClose();

  return (
    <Modal open={!!item} onClose={close} labelledBy="up-assigned-close-title">
      {item && (
        <form onSubmit={handleSubmit} noValidate>
          <div className="ax-modal__header">
            <div>
              <span className="up-modal__eyebrow">Vendor Close Complaints</span>
              <h2 className="ax-modal__title" id="up-assigned-close-title">
                Resolve Complaint {pick(item, ['complaint_id', 'id'])}
              </h2>
              <p className="up-modal__sub">
                Enter resolution information, attach proof images and submit to close.
              </p>
            </div>
            <button type="button" className="ax-modal__close" onClick={close} disabled={submitting} aria-label="Close dialog">
              {X_ICON}
            </button>
          </div>

          <div className="ax-modal__body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--ax-space-5, 20px)' }}>
            {error && (
              <div className="ax-alert ax-alert--danger" role="alert">
                <span className="ax-alert__icon">
                  <svg viewBox="0 0 24 24" width={18} height={18} fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M12 9v4" /><path d="M12 16v.01" /><path d="M5 19h14a2 2 0 0 0 1.84 -2.75l-7.1 -12.25a2 2 0 0 0 -3.5 0l-7.1 12.25a2 2 0 0 0 1.75 2.75" />
                  </svg>
                </span>
                <div className="ax-alert__content">
                  <p className="ax-alert__message" style={{ margin: 0 }}>{error}</p>
                </div>
              </div>
            )}

            {/* ── Read-only Complaint Information Card ── */}
            <div className="assigned-overview-card">
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: '#64748b',
                  marginBottom: 12,
                }}
              >
                Complaint Information
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '8px 16px', fontSize: 12 }}>
                {summaryItems.map((s) => (
                  <div key={s.label} style={s.fullWidth ? { gridColumn: '1 / -1' } : undefined}>
                    <span style={{ color: '#64748b' }}>{s.label}:</span> <b>{s.value}</b>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Resolution Inputs with Floating Labels ── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 20 }}>
              {/* Resolved By (Locked to logged-in user) */}
              <div className="ax-float ax-float--locked">
                <input
                  id="up-cl-by"
                  type="text"
                  className="ax-input ax-float__input"
                  placeholder=" "
                  value={resolvedBy}
                  readOnly
                  disabled
                  style={{ cursor: 'not-allowed', opacity: 0.85 }}
                />
                <label className="ax-float__label" htmlFor="up-cl-by">
                  Resolved By <Req /> (Locked)
                </label>
              </div>

              {showContact && (
                <>
                  <div className="ax-float">
                    <input
                      id="up-cl-contact-person"
                      type="text"
                      className={`ax-input ax-float__input${contactPersonInvalid ? ' is-invalid' : ''}${attempted && !contactPersonInvalid ? ' is-valid' : ''}`}
                      placeholder=" "
                      value={contactPerson}
                      onChange={(e) => {
                        setContactPerson(e.target.value);
                        if (error) setError('');
                      }}
                      disabled={submitting}
                      required
                    />
                    <label className="ax-float__label" htmlFor="up-cl-contact-person">
                      Contact Person / Incharge <Req />
                    </label>
                    {contactPersonInvalid && (
                      <span className="ax-field__message ax-field__message--error" role="alert">
                        Enter contact person name.
                      </span>
                    )}
                  </div>

                  <div className="ax-float">
                    <input
                      id="up-cl-contact-number"
                      type="tel"
                      maxLength={10}
                      className={`ax-input ax-float__input ax-num${contactNumberInvalid ? ' is-invalid' : ''}${attempted && !contactNumberInvalid ? ' is-valid' : ''}`}
                      placeholder=" "
                      value={contactNumber}
                      onChange={(e) => {
                        setContactNumber(e.target.value.replace(/\D/g, ''));
                        if (error) setError('');
                      }}
                      style={{ fontFamily: 'var(--ax-font-mono)' }}
                      disabled={submitting}
                      required
                    />
                    <label className="ax-float__label" htmlFor="up-cl-contact-number">
                      Contact Number (10 Digits) <Req />
                    </label>
                    {contactNumberInvalid && (
                      <span className="ax-field__message ax-field__message--error" role="alert">
                        Contact number must be exactly 10 digits.
                      </span>
                    )}
                  </div>
                </>
              )}

              {resolver && (
                <>
                  <div className="ax-float">
                    <input
                      id="up-cl-mobile"
                      type="tel"
                      maxLength={10}
                      className={`ax-input ax-float__input ax-num${mobileInvalid ? ' is-invalid' : ''}${attempted && !mobileInvalid ? ' is-valid' : ''}`}
                      placeholder=" "
                      value={mobile}
                      onChange={(e) => {
                        setMobile(e.target.value.replace(/\D/g, ''));
                        if (error) setError('');
                      }}
                      style={{ fontFamily: 'var(--ax-font-mono)' }}
                      disabled={submitting}
                      required
                    />
                    <label className="ax-float__label" htmlFor="up-cl-mobile">
                      Resolver Mobile (10 Digits) <Req />
                    </label>
                    {mobileInvalid && (
                      <span className="ax-field__message ax-field__message--error" role="alert">
                        Resolver mobile must be 10 digits.
                      </span>
                    )}
                  </div>

                  <div className="ax-float">
                    <input
                      id="up-cl-email"
                      type="email"
                      className={`ax-input ax-float__input${emailInvalid ? ' is-invalid' : ''}${attempted && !emailInvalid && email.trim() ? ' is-valid' : ''}`}
                      placeholder=" "
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (error) setError('');
                      }}
                      disabled={submitting}
                      required={cfg.emailRequired}
                    />
                    <label className="ax-float__label" htmlFor="up-cl-email">
                      Resolver Email {cfg.emailRequired ? <Req /> : '(Optional)'}
                    </label>
                    {emailInvalid && (
                      <span className="ax-field__message ax-field__message--error" role="alert">
                        Enter a valid email address.
                      </span>
                    )}
                  </div>
                </>
              )}

              <div className="ax-float ax-float--date">
                <input
                  id="up-cl-date"
                  type="date"
                  className={`ax-input ax-float__input${dateInvalid ? ' is-invalid' : ''}${attempted && !dateInvalid ? ' is-valid' : ''}`}
                  placeholder=" "
                  value={date}
                  onChange={(e) => {
                    setDate(e.target.value);
                    if (error) setError('');
                  }}
                  disabled={submitting}
                  required
                />
                <label className="ax-float__label" htmlFor="up-cl-date">
                  Closing Date <Req />
                </label>
                {dateInvalid && (
                  <span className="ax-field__message ax-field__message--error" role="alert">
                    Select closing date.
                  </span>
                )}
              </div>

              {/* ── Proof Images & Documents (Dashed Dropzones) ── */}
              <div
                style={{
                  gridColumn: '1 / -1',
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                  gap: 16,
                }}
              >
                <UploadDrop
                  id="up-cl-file"
                  label={cfg.fileLabel}
                  required
                  file={file}
                  accept="image/*,.pdf,.doc,.docx"
                  hint={cfg.fileHint || 'PDF, JPG or PNG — single file'}
                  invalid={fileInvalid}
                  errorText="Please upload resolution document or proof image."
                  disabled={submitting}
                  onPick={(f) => {
                    setFile(f);
                    if (error) setError('');
                  }}
                  onClear={() => setFile(null)}
                />
                {resolver && (
                  <UploadDrop
                    id="up-cl-file1"
                    label={cfg.file1Label || (cfg.file1Required ? 'Resolution File 2 (Required)' : 'Resolution File 2 (Optional)')}
                    required={Boolean(cfg.file1Required)}
                    file={file1}
                    accept="image/*,.pdf"
                    hint={cfg.file1Hint || (cfg.file1Required ? 'PDF, JPG or PNG — single file (Required)' : 'PDF, JPG or PNG — single file (Optional)')}
                    invalid={file1Invalid}
                    errorText={cfg.file1Label ? `Please upload ${cfg.file1Label.replace(/\s*\(Required\)/i, '')}.` : 'Please upload resolution file 2.'}
                    disabled={submitting}
                    onPick={(f) => {
                      setFile1(f);
                      if (error) setError('');
                    }}
                    onClear={() => setFile1(null)}
                  />
                )}
              </div>

              {/* ── Remarks Textarea ── */}
              <div className="ax-float ax-float--area" style={{ gridColumn: '1 / -1' }}>
                <textarea
                  id="up-cl-remarks"
                  className={`ax-textarea ax-float__input${remarksInvalid ? ' is-invalid' : ''}${attempted && !remarksInvalid ? ' is-valid' : ''}`}
                  rows={3}
                  placeholder=" "
                  value={remarks}
                  onChange={(e) => {
                    setRemarks(e.target.value);
                    if (error) setError('');
                  }}
                  disabled={submitting}
                  required
                />
                <label className="ax-float__label" htmlFor="up-cl-remarks">
                  Remarks <Req />
                </label>
                {remarksInvalid && (
                  <span className="ax-field__message ax-field__message--error" role="alert">
                    Please enter remarks / resolution notes.
                  </span>
                )}
              </div>

              {/* ── Send SMS Notification ── */}
              {resolver && (
                <div className="up-sms-bar">
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#0f172a' }}>
                    Send SMS Notification <Req />
                  </div>
                  <div className="ax-cluster" style={{ gap: 20 }}>
                    {(['Yes', 'No'] as const).map((v) => (
                      <label
                        key={v}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 8,
                          cursor: 'pointer',
                          fontSize: 13.5,
                          color: '#0f172a',
                        }}
                      >
                        <input
                          type="radio"
                          className="ax-radio"
                          name="up-close-sms"
                          value={v}
                          checked={closeSms === v}
                          onChange={() => setCloseSms(v)}
                          disabled={submitting}
                        />
                        <span>{v}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="ax-modal__footer">
            <button type="button" className="ax-btn ax-btn--ghost" onClick={close} disabled={submitting}>
              <span className="ax-btn__label">Cancel</span>
            </button>
            <button
              type="submit"
              className="ax-btn ax-btn--primary"
              disabled={submitting}
              aria-busy={submitting}
              style={{ minWidth: 160 }}
            >
              {submitting && <span className="ax-spinner ax-spinner--xs" aria-hidden="true" />}
              <span className="ax-btn__label">{submitting ? 'Resolving…' : 'Confirm & Resolve Complaint'}</span>
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}

/* ───────── Details modal ───────── */
function DetailViewModal<T extends object>({
  row,
  eyebrow,
  fields,
  onClose,
  onPreview,
}: {
  row: T | null;
  eyebrow: string;
  fields: (row: T) => DetailField[];
  onClose: () => void;
  onPreview: (url: string, title: string, candidates?: string[]) => void;
}) {
  const docs = row ? allDocUrlsOf(row) : [];
  return (
    <Modal open={!!row} onClose={onClose} labelledBy="up-assigned-detail-title">
      {row && (
        <>
          <div className="ax-modal__header">
            <div>
              <span className="up-modal__eyebrow">{eyebrow}</span>
              <h2 className="ax-modal__title" id="up-assigned-detail-title">
                Complaint #{pick(row, ['complaint_id', 'id'])}
              </h2>
              <p className="up-modal__sub">
                Complete complaint record, site specifications and attached proof files.
              </p>
            </div>
            <button type="button" className="ax-modal__close" onClick={onClose} aria-label="Close dialog">{X_ICON}</button>
          </div>

          <div className="ax-modal__body">
            <div className="view-modal-wrap">
              <div className="view-summary-strip">
                <div className="view-summary-col">
                  <span className="view-summary-label">Complaint ID</span>
                  <span className="view-summary-value">#{pick(row, ['complaint_id', 'id'])}</span>
                </div>
                <div className="view-summary-col">
                  <span className="view-summary-label">District</span>
                  <span className="view-summary-value">{pick(row, ['district', 'district_name'])}</span>
                </div>
                <div className="view-summary-col">
                  <span className="view-summary-label">Complaint Date</span>
                  <span className="view-summary-value">{pick(row, ['start_date', 'complaint_date', 'created_date', 'created_at'])}</span>
                </div>
                <div className="view-summary-col">
                  <span className="view-summary-label">Status</span>
                  <div><StatusBadge row={row} /></div>
                </div>
              </div>

              <DetailSectionCard
                title="Complaint & Site Specifications"
                tone="blue"
                icon={
                  <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <rect x="4" y="2" width="16" height="20" rx="2" />
                    <path d="M9 22v-4h6v4M8 6h.01M16 6h.01M12 6h.01M12 10h.01M12 14h.01M16 10h.01M16 14h.01M8 10h.01M8 14h.01" />
                  </svg>
                }
              >
                <div className="view-grid-3">
                  {fields(row).map((f) => (
                    <div key={f.label} className="view-data-cell">
                      <span className="view-data-label">{f.label}</span>
                      <div className="view-data-value">{f.value}</div>
                    </div>
                  ))}
                </div>
              </DetailSectionCard>

              <DetailSectionCard
                title="Complaint Description & Attachments"
                tone="purple"
                icon={
                  <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                }
              >
                <div className="view-data-cell">
                  <span className="view-data-label" style={{ marginBottom: 4 }}>Detailed Problem Description</span>
                  <div className="view-desc-box">{pick(row, ['complaint'])}</div>
                </div>

                <AttachmentCardGrid docs={docs} onPreview={onPreview} />
              </DetailSectionCard>
            </div>
          </div>

          <div className="ax-modal__footer">
            <button type="button" className="ax-btn ax-btn--primary" onClick={onClose}>Close</button>
          </div>
        </>
      )}
    </Modal>
  );
}

/* ───────── Generic assigned-complaints page ───────── */
export interface AssignedPageProps<T extends object> {
  title: string;
  subtitle: string;
  breadcrumbs: { label: string; href?: string }[];
  cardTitle: string;
  kpiSub: { total: string; open: string; approved: string; close: string };
  searchPlaceholder?: string;
  fetchData: () => Promise<UpAssignedDataResponse<T>>;
  columns: ComplaintColumn<T>[];
  searchFields: (row: T) => unknown[];
  exportName: string;
  exportTitle: string;
  close: CloseConfig<T>;
  /** Adds a View button + details modal. */
  detail?: { eyebrow: string; fields: (row: T) => DetailField[] };
  /** Allow closing from the Approved tab too. */
  closeOnApproved?: boolean;
}

const EMPTY = {
  open: [], approved: [], close: [],
  total_complaint: 0, open_complaint: 0, approved_complaint: 0, close_complaint: 0,
};

export function AssignedComplaintPage<T extends object>(props: AssignedPageProps<T>) {
  const { title, subtitle, breadcrumbs, cardTitle, kpiSub, columns, searchFields, exportName, exportTitle, close } = props;

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<UpAssignedDataResponse<T>>(EMPTY as unknown as UpAssignedDataResponse<T>);
  const [activeTab, setActiveTab] = useState<Tab>('open');
  const [search, setSearch] = useState('');
  const [district, setDistrict] = useState('All');
  const [closingItem, setClosingItem] = useState<T | null>(null);
  const [detailRow, setDetailRow] = useState<T | null>(null);
  const [preview, setPreview] = useState<{ url: string; title: string; candidates?: string[] } | null>(null);
  const [toastMsg, setToastMsg] = useState<{ type: 'success' | 'danger'; text: string } | null>(null);

  const openPreview = useCallback((url: string, t: string, candidates?: string[]) => setPreview({ url, title: t, candidates }), []);
  const closePreview = useCallback(() => setPreview(null), []);

  useEffect(() => {
    if (!toastMsg) return;
    const t = window.setTimeout(() => setToastMsg(null), 4000);
    return () => window.clearTimeout(t);
  }, [toastMsg]);

  const fetchRef = useRef(props.fetchData);
  fetchRef.current = props.fetchData;

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchRef.current();
      setData(res);
    } catch (err: any) {
      console.error(`[${exportName}] load error:`, err);
      setToastMsg({ type: 'danger', text: err?.message || 'Failed to load assigned complaints.' });
    } finally {
      setLoading(false);
    }
  }, [exportName, fetchRef]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const currentList: T[] = useMemo(() => {
    if (activeTab === 'approved') return data.approved || [];
    if (activeTab === 'close') return data.close || [];
    return data.open || [];
  }, [activeTab, data]);

  const districts = useMemo(() => {
    const set = new Set<string>();
    [...(data.open || []), ...(data.approved || []), ...(data.close || [])].forEach((r) => {
      const d = (r as Record<string, any>).district;
      if (d) set.add(String(d));
    });
    return Array.from(set).sort();
  }, [data]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return currentList.filter((r) => {
      if (district !== 'All' && (r as Record<string, any>).district !== district) return false;
      if (!q) return true;
      return searchFields(r).some((v) => String(v ?? '').toLowerCase().includes(q));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentList, search, district]);

  const { paginatedData, currentPage, pageSize, totalItems, setPage, setPageSize } =
    usePagination({ data: filtered, initialPageSize: 100 });

  useEffect(() => {
    setPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, district, activeTab]);

  const hasFilters = search.trim() !== '' || district !== 'All';
  const resetFilters = () => {
    setSearch('');
    setDistrict('All');
    setPage(1);
  };

  const exportCols: ExportColumn<T>[] = useMemo(
    () => [
      { header: 'Sr. No.', accessor: (_r: T, i: number) => i + 1 },
      ...columns
        .filter((c) => c.exportValue)
        .map((c) => ({ header: c.header, accessor: (r: T, i: number) => c.exportValue!(r, i) })),
      { header: 'Action Status', accessor: () => TAB_LABEL[activeTab] },
    ] as ExportColumn<T>[],
    [columns, activeTab]
  );

  const stamp = new Date().toISOString().slice(0, 10);
  const TOTAL_COLUMNS = columns.length + 2;

  const tabCount: Record<Tab, number> = {
    open: data.open?.length ?? 0,
    approved: data.approved?.length ?? 0,
    close: data.close?.length ?? 0,
  };

  return (
    <div className="solar-erp-page">
      <style>{PAGE_CSS}</style>
      <style>{OVERLAY_CSS}</style>
      <style>{ASSIGNED_CSS}</style>

      {/* ── Page Head ── */}
      <PageHead
        title={title}
        subtitle={subtitle}
        breadcrumbs={breadcrumbs}
        actions={
          <div style={{ display: 'inline-flex', gap: 'var(--ax-space-2)' }}>
            <button type="button" className="ax-btn ax-btn--secondary ax-btn--sm" onClick={loadData} disabled={loading}>
              {ICON_REFRESH}
              <span className="ax-btn__label">Refresh</span>
            </button>
          </div>
        }
      />

      {toastMsg && (
        <div className={`ax-alert ax-alert--${toastMsg.type}`} style={{ marginBottom: 'var(--ax-space-4)' }} role="status">
          <div className="ax-alert__title">{toastMsg.type === 'success' ? 'Success' : 'Error'}</div>
          <div className="ax-alert__text">{toastMsg.text}</div>
        </div>
      )}

      {/* ── KPI cards (4 in a row) ── */}
      <div className="asw-cards-row">
        <KpiCard
          tone="accent" label="Total Complaints" value={num(data.total_complaint)} sub={kpiSub.total}
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
          }
        />
        <KpiCard
          tone="amber" label="Open Complaints" value={num(data.open_complaint)} sub={kpiSub.open}
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          }
        />
        <KpiCard
          tone="cyan" label="Pending Approval" value={num(data.approved_complaint)} sub={kpiSub.approved}
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          }
        />
        <KpiCard
          tone="emerald" label="Resolved Complaints" value={num(data.close_complaint)} sub={kpiSub.close}
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          }
        />
      </div>

      {/* ── Status tabs above the table ── */}
      <div style={{ marginBottom: 'var(--ax-space-3, 12px)' }}>
        <div className="ax-cluster" role="tablist" aria-label="Complaint status tabs" style={{ gap: 'var(--ax-space-2)' }}>
          {(['open', 'approved', 'close'] as Tab[]).map((t) => (
            <button
              key={t}
              type="button"
              role="tab"
              aria-selected={activeTab === t}
              className={`ax-btn ax-btn--sm ${activeTab === t ? 'ax-btn--primary' : 'ax-btn--secondary'}`}
              onClick={() => setActiveTab(t)}
            >
              <span className="ax-btn__label">{TAB_LABEL[t]} ({tabCount[t]})</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Main table card ── */}
      <section className="ax-card ax-col--12" role="tabpanel" aria-label={cardTitle}>
        <div className="ax-card__header">
          <div className="ax-card__titles">
            <h2 className="ax-card__title">{cardTitle}</h2>
            <p className="ax-card__subtitle">
              <span className="ax-num">{filtered.length}</span> of <span className="ax-num">{currentList.length}</span> {TAB_LABEL[activeTab].toLowerCase()} complaints
            </p>
          </div>
          <div className="ax-card__actions">
            <div className="ax-cluster" style={actionsRowStyle}>
              <select
                className="ax-input ax-input--sm"
                style={{ width: 140, height: 32, fontSize: 'var(--ax-text-xs)' }}
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                aria-label="Filter by district"
              >
                <option value="All">All Districts</option>
                {districts.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>

              {hasFilters && (
                <button
                  type="button"
                  className="ax-btn ax-btn--ghost ax-btn--sm"
                  onClick={resetFilters}
                  style={{ height: 30, padding: '0 8px', fontSize: 'var(--ax-text-xs)' }}
                >
                  Reset
                </button>
              )}

              <SearchInput
                value={search}
                onChange={setSearch}
                placeholder={props.searchPlaceholder || 'Search ID, name, district, contact…'}
                size="sm"
                ariaLabel="Search assigned complaints"
              />

              <TableExportToolbar
                onCopy={() => copyTableDataToClipboard(filtered, exportCols)}
                onExportCSV={() => exportDataToCSV(`${exportName}_${activeTab}_${stamp}`, filtered, exportCols)}
                onExportExcel={() => exportDataToExcel(`${exportName}_${activeTab}_${stamp}`, filtered, exportCols)}
                onExportPDF={() => printTableData(`${exportTitle} (${TAB_LABEL[activeTab]})`, filtered, exportCols)}
              />
            </div>
          </div>
        </div>

        <div className="ax-table-wrap">
          <table className="ax-table ax-table--hover" style={{ whiteSpace: 'nowrap', minWidth: Math.max(1200, TOTAL_COLUMNS * 130) }}>
            <caption className="ax-visually-hidden">{cardTitle}</caption>
            <thead className="ax-table__head">
              <tr>
                <th className="ax-table__th" scope="col">Sr. No.</th>
                {columns.map((c) => (
                  <th key={c.header} className="ax-table__th" scope="col">{c.header}</th>
                ))}
                <th className="ax-table__th" scope="col" style={{ textAlign: 'center' }}>Action</th>
              </tr>
            </thead>
            <tbody aria-busy={loading}>
              {loading && (
                <tr>
                  <td className="ax-table__td" colSpan={TOTAL_COLUMNS} style={centerCell}>
                    <span className="ax-spinner" style={{ marginRight: 8 }} /> Loading assigned complaints…
                  </td>
                </tr>
              )}
              {!loading && filtered.length === 0 && (
                <tr>
                  <td className="ax-table__td" colSpan={TOTAL_COLUMNS} style={{ padding: 0 }}>
                    <TableEmptyState
                      title="No complaints in this category"
                      message={
                        hasFilters
                          ? 'No records match your filters or search. Try clearing your query.'
                          : `No ${TAB_LABEL[activeTab].toLowerCase()} complaints right now.`
                      }
                      onClear={hasFilters ? resetFilters : undefined}
                      clearLabel="Clear filters"
                    />
                  </td>
                </tr>
              )}
              {!loading &&
                paginatedData.map((row, index) => {
                  const serial = (currentPage - 1) * pageSize + index + 1;
                  const key = pick(row, ['id', 'complaint_id'], String(serial));
                  const canClose = activeTab === 'open' || (!!props.closeOnApproved && activeTab === 'approved');
                  return (
                    <tr key={`${key}-${serial}`} className="ax-table__row">
                      <td className="ax-table__td ax-num">{serial}</td>
                      {columns.map((c) => (
                        <td key={c.header} className="ax-table__td">
                          {c.cell(row, { serial, openPreview })}
                        </td>
                      ))}
                      <td className="ax-table__td" style={{ textAlign: 'center' }}>
                        <div style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
                        {props.detail && (
                          <button type="button" className="ax-btn ax-btn--secondary ax-btn--sm" onClick={() => setDetailRow(row)}>
                            View
                          </button>
                        )}
                        {canClose ? (
                          <button type="button" className="ax-btn ax-btn--primary ax-btn--sm" onClick={() => setClosingItem(row)}>
                            Close Complaint
                          </button>
                        ) : activeTab === 'approved' ? (
                          <span className="ax-badge ax-badge--soft ax-badge--info">Under Review</span>
                        ) : (
                          <span className="ax-badge ax-badge--soft ax-badge--success">Resolved</span>
                        )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>

        <div className="ax-card__footer" style={footerStyle}>
          <div className="ula-pagination-left">
            <Pagination
              currentPage={currentPage}
              totalItems={totalItems}
              pageSize={pageSize}
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
              pageSizeOptions={[25, 50, 100, 200]}
            />
          </div>
        </div>
      </section>

      {preview && (
        <ImagePreviewModal
          url={preview.url}
          candidates={preview.candidates}
          title={preview.title}
          onClose={closePreview}
        />
      )}

      {props.detail && (
        <DetailViewModal
          row={detailRow}
          eyebrow={props.detail.eyebrow}
          fields={props.detail.fields}
          onClose={() => setDetailRow(null)}
          onPreview={openPreview}
        />
      )}

      <CloseModal
        item={closingItem}
        cfg={close}
        onClose={() => setClosingItem(null)}
        onSuccess={(msg) => {
          setToastMsg({ type: 'success', text: msg });
          loadData();
        }}
      />
    </div>
  );
}

export { DASH };