/*
 * Vireo React — Post a Job (route "jobs/job-post").
 *
 * Faithful re-expression of src/html/jobs/job-post.html: a 6-step posting form
 * (role details, compensation, description w/ editor toolbar, dynamic
 * requirements, skill tag input + suggestions, application settings) plus a
 * visibility/hiring-team/live-preview rail and a sticky action bar. The Alpine
 * axJobPost() state is ported to React; classes + ARIA match the reference 1:1.
 */
import { useState, type KeyboardEvent } from 'react';
import { Link } from 'react-router-dom';
import { PageHead } from '../../components/shell/PageHead';

const EMPLOYMENT_TYPES = [
  { id: 'full_time', name: 'Full-time' },
  { id: 'part_time', name: 'Part-time' },
  { id: 'contract', name: 'Contract' },
  { id: 'internship', name: 'Internship' },
];
const SUGGESTIONS = ['Figma', 'Design Systems', 'Accessibility', 'TypeScript', 'UX Research', 'Prototyping', 'Roadmapping'];
const STATUSES = [
  { id: 'active', name: 'Published', desc: 'Live on your careers page', c: 'var(--ax-viz-emerald)' },
  { id: 'draft', name: 'Draft', desc: 'Only visible to your team', c: 'var(--ax-text-subtle)' },
  { id: 'scheduled', name: 'Scheduled', desc: 'Goes live on a set date', c: 'var(--ax-viz-amber)' },
];
const DEPT_NAMES: Record<string, string> = { eng: 'Engineering', design: 'Design', product: 'Product', marketing: 'Marketing', sales: 'Sales', ops: 'Operations' };
const WORK_MODELS: Record<string, string> = { onsite: 'On-site', hybrid: 'Hybrid', remote: 'Remote' };
const CURRENCY_SYMBOLS: Record<string, string> = { usd: '$', eur: '€', gbp: '£' };

interface Req { id: number; text: string; }
interface Question { id: number; text: string; }

export function JobPost() {
  const [saved, setSaved] = useState(false);
  const [savedKind, setSavedKind] = useState('');
  const [title, setTitle] = useState('');
  const [dept, setDept] = useState('');
  const [level, setLevel] = useState('senior');
  const [type, setType] = useState('full_time');
  const [location, setLocation] = useState('');
  const [remote, setRemote] = useState('remote');
  const [salMin, setSalMin] = useState('');
  const [salMax, setSalMax] = useState('');
  const [currency, setCurrency] = useState('usd');
  const [period, setPeriod] = useState('year');
  const [showEquity, setShowEquity] = useState(true);
  const [desc, setDesc] = useState('');
  const [skills, setSkills] = useState<string[]>([]);
  const [deadline, setDeadline] = useState('');
  const [cap, setCap] = useState('60');
  const [requireResume, setRequireResume] = useState(true);
  const [status, setStatus] = useState('active');
  const [scheduleDate, setScheduleDate] = useState('');
  const [manager, setManager] = useState('priya');
  const [requirements, setRequirements] = useState<Req[]>([{ id: 1, text: '' }]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const ridRef = useState({ rid: 2, qid: 0 })[0];

  const currencySymbol = () => CURRENCY_SYMBOLS[currency] ?? '$';
  const deptName = () => DEPT_NAMES[dept] ?? '';
  const typeName = () => EMPLOYMENT_TYPES.find((t) => t.id === type)?.name ?? 'Full-time';
  const workModel = () => WORK_MODELS[remote] ?? 'Remote';
  const salaryPreview = () => {
    const fmt = (v: string) => { const n = parseInt(String(v).replace(/[^0-9]/g, ''), 10); if (!n) return ''; return n >= 1000 ? '$' + Math.round(n / 1000) + 'K' : '$' + n; };
    const a = fmt(salMin), b = fmt(salMax);
    if (a && b) return a + ' – ' + b; if (a) return 'From ' + a; if (b) return 'Up to ' + b; return 'Salary TBD';
  };
  const addReq = () => { ridRef.rid += 1; setRequirements((p) => [...p, { id: ridRef.rid, text: '' }]); };
  const addQuestion = () => { ridRef.qid += 1; setQuestions((p) => [...p, { id: ridRef.qid, text: '' }]); };
  const addSkill = (e: KeyboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const t = e.currentTarget;
    const v = t.value.trim().replace(/,$/, '');
    if (v && !skills.includes(v)) setSkills((p) => [...p, v]);
    t.value = '';
  };
  const save = (kind: string) => { setSavedKind(kind); setSaved(true); window.scrollTo({ top: 0, behavior: 'smooth' }); setTimeout(() => setSaved(false), 4000); };

  return (
    <form onSubmit={(e) => { e.preventDefault(); save('publish'); }}>
      <PageHead
        title="Post a Job"
        subtitle="Write the posting, set compensation & screening, then publish to your careers page."
        actions={
          <Link className="ax-btn ax-btn--ghost" to="/jobs/list">
            <svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12l14 0" /><path d="M5 12l6 6" /><path d="M5 12l6 -6" /></svg>
            <span className="ax-btn__label">Back to jobs</span>
          </Link>
        }
      />

      {saved && (
        <div className="ax-alert ax-alert--success" role="status" style={{ marginBottom: 'var(--ax-space-6)' }}>
          <span className="ax-alert__icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12l5 5l10 -10" /></svg></span>
          <div className="ax-alert__content"><p className="ax-alert__title">{savedKind === 'draft' ? 'Saved as draft' : 'Job published'}</p><p className="ax-alert__message">{savedKind === 'draft' ? "Your posting is saved. Publish it when you're ready." : 'This posting is now live on your careers page.'}</p></div>
          <button type="button" className="ax-btn ax-btn--ghost ax-btn--icon ax-btn--sm" onClick={() => setSaved(false)} aria-label="Dismiss"><svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M18 6l-12 12" /><path d="M6 6l12 12" /></svg></button>
        </div>
      )}

      <div className="ax-dash-grid" style={{ paddingBottom: 96 }}>
        {/* LEFT COLUMN (8) */}
        <div className="ax-col--8" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--ax-space-6)' }}>
          {/* BASIC INFO */}
          <section className="ax-card" role="region" aria-label="Role details">
            <StepHeader step="Step 1" title="Role details" sub="What candidates see at the top of the posting." />
            <div className="ax-card__body" style={{ paddingTop: 0, display: 'flex', flexDirection: 'column', gap: 'var(--ax-space-5)' }}>
              <div className="ax-field">
                <label className="ax-label" htmlFor="j-title">Job title <span className="ax-field__required">*</span></label>
                <input id="j-title" type="text" className="ax-input" placeholder="e.g. Senior Product Designer" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={100} />
                <span className="ax-help">Appears as the posting headline and page title.</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12,1fr)', gap: 'var(--ax-space-4)' }}>
                <div className="ax-field" style={{ gridColumn: 'span 6', margin: 0 }}>
                  <label className="ax-label" htmlFor="j-dept">Department <span className="ax-field__required">*</span></label>
                  <select id="j-dept" className="ax-select" value={dept} onChange={(e) => setDept(e.target.value)}>
                    <option value="">Select department</option>
                    <option value="eng">Engineering</option>
                    <option value="design">Design</option>
                    <option value="product">Product</option>
                    <option value="marketing">Marketing</option>
                    <option value="sales">Sales</option>
                    <option value="ops">Operations</option>
                  </select>
                </div>
                <div className="ax-field" style={{ gridColumn: 'span 6', margin: 0 }}>
                  <label className="ax-label" htmlFor="j-level">Experience level</label>
                  <select id="j-level" className="ax-select" value={level} onChange={(e) => setLevel(e.target.value)}>
                    <option value="junior">Junior (0–2 yrs)</option>
                    <option value="mid">Mid (3–5 yrs)</option>
                    <option value="senior">Senior (6–9 yrs)</option>
                    <option value="lead">Lead / Staff (10+ yrs)</option>
                  </select>
                </div>
              </div>
              <div className="ax-field" style={{ margin: 0 }}>
                <span className="ax-label" style={{ marginBottom: 'var(--ax-space-2)' }}>Employment type</span>
                <div className="ax-cluster" style={{ gap: 'var(--ax-space-2)', flexWrap: 'wrap' }}>
                  {EMPLOYMENT_TYPES.map((t) => (
                    <button key={t.id} type="button" className={`ax-btn ax-btn--sm ax-btn--pill ${type === t.id ? 'ax-btn--primary' : 'ax-btn--secondary'}`} onClick={() => setType(t.id)}>{t.name}</button>
                  ))}
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12,1fr)', gap: 'var(--ax-space-4)' }}>
                <div className="ax-field" style={{ gridColumn: 'span 7', margin: 0 }}>
                  <label className="ax-label" htmlFor="j-location">Location</label>
                  <input id="j-location" type="text" className="ax-input" placeholder="e.g. Berlin, DE" value={location} onChange={(e) => setLocation(e.target.value)} disabled={remote === 'remote'} />
                </div>
                <div className="ax-field" style={{ gridColumn: 'span 5', margin: 0 }}>
                  <label className="ax-label" htmlFor="j-remote">Work model</label>
                  <select id="j-remote" className="ax-select" value={remote} onChange={(e) => setRemote(e.target.value)}>
                    <option value="onsite">On-site</option>
                    <option value="hybrid">Hybrid</option>
                    <option value="remote">Fully remote</option>
                  </select>
                </div>
              </div>
            </div>
          </section>

          {/* COMPENSATION */}
          <section className="ax-card" role="region" aria-label="Compensation">
            <StepHeader step="Step 2" title="Compensation" sub="Transparent pay ranges get up to 2× more applicants." />
            <div className="ax-card__body" style={{ paddingTop: 0, display: 'flex', flexDirection: 'column', gap: 'var(--ax-space-5)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12,1fr)', gap: 'var(--ax-space-4)' }}>
                <div className="ax-field" style={{ gridColumn: 'span 4', margin: 0 }}>
                  <label className="ax-label" htmlFor="j-min">Min. salary</label>
                  <div className="ax-input-group">
                    <span className="ax-input-group__addon" style={{ color: 'var(--ax-text-muted)' }}>{currencySymbol()}</span>
                    <input id="j-min" type="text" className="ax-input ax-num" inputMode="numeric" placeholder="95,000" value={salMin} onChange={(e) => setSalMin(e.target.value)} style={{ border: 0, background: 'transparent', fontFamily: 'var(--ax-font-mono)' }} />
                  </div>
                </div>
                <div className="ax-field" style={{ gridColumn: 'span 4', margin: 0 }}>
                  <label className="ax-label" htmlFor="j-max">Max. salary</label>
                  <div className="ax-input-group">
                    <span className="ax-input-group__addon" style={{ color: 'var(--ax-text-muted)' }}>{currencySymbol()}</span>
                    <input id="j-max" type="text" className="ax-input ax-num" inputMode="numeric" placeholder="120,000" value={salMax} onChange={(e) => setSalMax(e.target.value)} style={{ border: 0, background: 'transparent', fontFamily: 'var(--ax-font-mono)' }} />
                  </div>
                </div>
                <div className="ax-field" style={{ gridColumn: 'span 4', margin: 0 }}>
                  <label className="ax-label" htmlFor="j-currency">Currency</label>
                  <select id="j-currency" className="ax-select" value={currency} onChange={(e) => setCurrency(e.target.value)}>
                    <option value="usd">USD ($)</option>
                    <option value="eur">EUR (€)</option>
                    <option value="gbp">GBP (£)</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12,1fr)', gap: 'var(--ax-space-4)' }}>
                <div className="ax-field" style={{ gridColumn: 'span 6', margin: 0 }}>
                  <label className="ax-label" htmlFor="j-period">Pay period</label>
                  <select id="j-period" className="ax-select" value={period} onChange={(e) => setPeriod(e.target.value)}>
                    <option value="year">Per year</option>
                    <option value="month">Per month</option>
                    <option value="hour">Per hour</option>
                  </select>
                </div>
                <div className="ax-field" style={{ gridColumn: 'span 6', margin: 0, justifyContent: 'flex-end' }}>
                  <label className="ax-check" style={{ gap: 'var(--ax-space-3)' }}>
                    <input type="checkbox" className="ax-switch" checked={showEquity} onChange={(e) => setShowEquity(e.target.checked)} />
                    <span style={{ display: 'flex', flexDirection: 'column' }}><span style={{ fontSize: 'var(--ax-text-sm)', color: 'var(--ax-text)', fontWeight: 'var(--ax-weight-medium)' }}>Includes equity</span><span style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-subtle)' }}>Show an equity note on the posting.</span></span>
                  </label>
                </div>
              </div>
            </div>
          </section>

          {/* DESCRIPTION */}
          <section className="ax-card" role="region" aria-label="Description">
            <StepHeader step="Step 3" title="Description" sub="Sell the role — the mission, the impact, and the team." />
            <div className="ax-card__body" style={{ paddingTop: 0 }}>
              <div className="ax-field" style={{ margin: 0 }}>
                <label className="ax-label" htmlFor="j-desc">About the role</label>
                <div role="toolbar" aria-label="Formatting" style={{ display: 'flex', gap: 2, padding: 6, border: '1px solid var(--ax-border)', borderBottom: 0, borderRadius: 'var(--ax-radius-sm) var(--ax-radius-sm) 0 0', background: 'var(--ax-surface-subtle)', flexWrap: 'wrap' }}>
                  <ToolBtn label="Bold"><path d="M7 5h6a3.5 3.5 0 0 1 0 7h-6z" /><path d="M13 12h1a3.5 3.5 0 0 1 0 7h-7v-7" /></ToolBtn>
                  <ToolBtn label="Italic"><path d="M11 5l6 0" /><path d="M7 19l6 0" /><path d="M14 5l-4 14" /></ToolBtn>
                  <ToolBtn label="Underline"><path d="M7 5v5a5 5 0 0 0 10 0v-5" /><path d="M5 21h14" /></ToolBtn>
                  <span style={{ width: 1, background: 'var(--ax-border)', margin: '2px 4px' }} />
                  <ToolBtn label="Bulleted list"><path d="M9 6l11 0" /><path d="M9 12l11 0" /><path d="M9 18l11 0" /><path d="M5 6l0 .01" /><path d="M5 12l0 .01" /><path d="M5 18l0 .01" /></ToolBtn>
                  <ToolBtn label="Numbered list"><path d="M11 6h9" /><path d="M11 12h9" /><path d="M12 18h8" /><path d="M4 16a2 2 0 1 1 4 0c0 .591 -.5 1 -1 1.5l-3 2.5h4" /><path d="M6 10v-6l-2 2" /></ToolBtn>
                  <ToolBtn label="Insert link"><path d="M9 15l6 -6" /><path d="M11 6l.463 -.536a5 5 0 0 1 7.071 7.072l-.534 .464" /><path d="M13 18l-.397 .534a5.068 5.068 0 0 1 -7.127 0a4.972 4.972 0 0 1 0 -7.071l.524 -.463" /></ToolBtn>
                </div>
                <textarea id="j-desc" className="ax-textarea" rows={6} placeholder="Describe the mission, the team, and what success looks like in this role…" value={desc} onChange={(e) => setDesc(e.target.value)} style={{ borderRadius: '0 0 var(--ax-radius-sm) var(--ax-radius-sm)', minHeight: 160 }} />
              </div>
            </div>
          </section>

          {/* REQUIREMENTS */}
          <section className="ax-card" role="region" aria-label="Requirements">
            <div className="ax-card__header">
              <div className="ax-card__titles">
                <span className="ax-card__eyebrow">Step 4</span>
                <h2 className="ax-card__title">Requirements</h2>
                <p className="ax-card__subtitle">Add must-haves as a clean, scannable list.</p>
              </div>
              <button type="button" className="ax-btn ax-btn--secondary ax-btn--sm" onClick={addReq}>
                <svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 5l0 14" /><path d="M5 12l14 0" /></svg>
                <span className="ax-btn__label">Add requirement</span>
              </button>
            </div>
            <div className="ax-card__body" style={{ paddingTop: 0, display: 'flex', flexDirection: 'column', gap: 'var(--ax-space-3)' }}>
              {requirements.map((r, ri) => (
                <div key={r.id} className="ax-cluster" style={{ gap: 'var(--ax-space-3)', flexWrap: 'nowrap' }}>
                  <span style={{ flex: 'none', color: 'var(--ax-text-subtle)' }}><svg viewBox="0 0 24 24" width={18} height={18} fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 6l11 0" /><path d="M9 12l11 0" /><path d="M9 18l11 0" /><path d="M5 6l0 .01" /><path d="M5 12l0 .01" /><path d="M5 18l0 .01" /></svg></span>
                  <input type="text" className="ax-input" placeholder="e.g. 6+ years designing SaaS products" value={r.text} onChange={(e) => setRequirements((p) => p.map((x) => x.id === r.id ? { ...x, text: e.target.value } : x))} style={{ flex: '1 1 auto' }} />
                  <button type="button" className="ax-btn ax-btn--ghost ax-btn--icon ax-btn--sm" onClick={() => setRequirements((p) => p.filter((_, i) => i !== ri))} aria-label={'Remove requirement ' + (ri + 1)} disabled={requirements.length === 1}><svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 7l16 0" /><path d="M10 11l0 6" /><path d="M14 11l0 6" /><path d="M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2 -2l1 -12" /><path d="M9 7v-3a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v3" /></svg></button>
                </div>
              ))}
            </div>
          </section>

          {/* SKILLS */}
          <section className="ax-card" role="region" aria-label="Skills">
            <StepHeader step="Step 5" title="Skills" sub="Tags help candidates and search match this role." />
            <div className="ax-card__body" style={{ paddingTop: 0 }}>
              <div className="ax-field" style={{ margin: 0 }}>
                <label className="ax-label" htmlFor="j-skills">Add skills</label>
                <div className="ax-tags">
                  {skills.map((s, si) => (
                    <span key={si} className="ax-badge ax-badge--accent ax-badge--soft ax-badge--pill" style={{ gap: 4 }}><span>{s}</span><button type="button" onClick={() => setSkills((p) => p.filter((_, i) => i !== si))} aria-label={'Remove skill ' + s} style={{ background: 'none', border: 0, cursor: 'pointer', color: 'inherit', display: 'inline-flex' }}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ width: 11, height: 11 }}><path d="M18 6l-12 12" /><path d="M6 6l12 12" /></svg></button></span>
                  ))}
                  <input id="j-skills" type="text" className="ax-tags__input" placeholder="Add a skill…" onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ',') addSkill(e); }} />
                </div>
                <span className="ax-help">Press Enter or comma to add. Try: Figma, TypeScript, Discovery.</span>
              </div>
              <div style={{ marginTop: 'var(--ax-space-4)' }}>
                <div className="ax-label" style={{ marginBottom: 'var(--ax-space-2)' }}>Suggestions</div>
                <div className="ax-cluster" style={{ gap: 'var(--ax-space-2)', flexWrap: 'wrap' }}>
                  {SUGGESTIONS.filter((x) => !skills.includes(x)).map((s) => (
                    <button key={s} type="button" className="ax-badge ax-badge--outline" style={{ borderRadius: 'var(--ax-radius-pill)', cursor: 'pointer', gap: 4 }} onClick={() => setSkills((p) => [...p, s])}><svg viewBox="0 0 24 24" width={12} height={12} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 5l0 14" /><path d="M5 12l14 0" /></svg><span>{s}</span></button>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* APPLICATION SETTINGS */}
          <section className="ax-card" role="region" aria-label="Application settings">
            <StepHeader step="Step 6" title="Application settings" sub="Control how people apply and what you collect." />
            <div className="ax-card__body" style={{ paddingTop: 0, display: 'flex', flexDirection: 'column', gap: 'var(--ax-space-5)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12,1fr)', gap: 'var(--ax-space-4)' }}>
                <div className="ax-field" style={{ gridColumn: 'span 6', margin: 0 }}>
                  <label className="ax-label" htmlFor="j-deadline">Application deadline</label>
                  <input id="j-deadline" type="date" className="ax-input ax-num" value={deadline} onChange={(e) => setDeadline(e.target.value)} style={{ fontFamily: 'var(--ax-font-mono)' }} />
                </div>
                <div className="ax-field" style={{ gridColumn: 'span 6', margin: 0 }}>
                  <label className="ax-label" htmlFor="j-cap">Applicant cap</label>
                  <input id="j-cap" type="text" className="ax-input ax-num" inputMode="numeric" placeholder="60" value={cap} onChange={(e) => setCap(e.target.value)} style={{ fontFamily: 'var(--ax-font-mono)' }} />
                </div>
              </div>
              <label className="ax-check" style={{ gap: 'var(--ax-space-3)' }}>
                <input type="checkbox" className="ax-switch" checked={requireResume} onChange={(e) => setRequireResume(e.target.checked)} />
                <span style={{ display: 'flex', flexDirection: 'column' }}><span style={{ fontSize: 'var(--ax-text-sm)', color: 'var(--ax-text)', fontWeight: 'var(--ax-weight-medium)' }}>Require a resume</span><span style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-subtle)' }}>Applicants must upload a PDF or DOCX.</span></span>
              </label>
              <div>
                <div className="ax-cluster" style={{ justifyContent: 'space-between', marginBottom: 'var(--ax-space-2)' }}>
                  <span className="ax-label">Screening questions</span>
                  <button type="button" className="ax-btn ax-btn--link ax-btn--sm" onClick={addQuestion}>+ Add question</button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--ax-space-2)' }}>
                  {questions.map((qn, qi) => (
                    <div key={qn.id} className="ax-cluster" style={{ gap: 'var(--ax-space-3)', flexWrap: 'nowrap' }}>
                      <input type="text" className="ax-input ax-input--sm" placeholder="e.g. Share a portfolio link" value={qn.text} onChange={(e) => setQuestions((p) => p.map((x) => x.id === qn.id ? { ...x, text: e.target.value } : x))} style={{ flex: '1 1 auto' }} />
                      <button type="button" className="ax-btn ax-btn--ghost ax-btn--icon ax-btn--sm" onClick={() => setQuestions((p) => p.filter((_, i) => i !== qi))} aria-label={'Remove question ' + (qi + 1)}><svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M18 6l-12 12" /><path d="M6 6l12 12" /></svg></button>
                    </div>
                  ))}
                  {!questions.length && <div style={{ fontSize: 'var(--ax-text-sm)', color: 'var(--ax-text-subtle)', padding: 'var(--ax-space-2) 0' }}>No screening questions yet — add one to pre-qualify applicants.</div>}
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* RIGHT RAIL (4) */}
        <aside className="ax-col--4" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--ax-space-6)' }}>
          {/* VISIBILITY */}
          <section className="ax-card" role="region" aria-label="Visibility">
            <div className="ax-card__header"><div className="ax-card__titles"><h2 className="ax-card__title">Visibility</h2></div></div>
            <div className="ax-card__body" style={{ paddingTop: 0, display: 'flex', flexDirection: 'column', gap: 'var(--ax-space-3)' }}>
              {STATUSES.map((s) => (
                <label key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 'var(--ax-space-3)', cursor: 'pointer', borderRadius: 'var(--ax-radius-md)', padding: 'var(--ax-space-3) var(--ax-space-4)', border: '1.5px solid', transition: 'border-color var(--ax-motion-fast) var(--ax-ease-standard)', ...(status === s.id ? { borderColor: 'var(--ax-accent)', background: 'var(--ax-accent-wash)' } : { borderColor: 'var(--ax-border)', background: 'var(--ax-surface)' }) }}>
                  <input type="radio" name="j-status" className="ax-radio" value={s.id} checked={status === s.id} onChange={() => setStatus(s.id)} />
                  <span style={{ width: 8, height: 8, borderRadius: '50%', flex: 'none', background: s.c }} />
                  <span style={{ flex: '1 1 auto' }}><span style={{ display: 'block', fontSize: 'var(--ax-text-sm)', fontWeight: 'var(--ax-weight-medium)', color: 'var(--ax-text-strong)' }}>{s.name}</span><span style={{ display: 'block', fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-subtle)' }}>{s.desc}</span></span>
                </label>
              ))}
              {status === 'scheduled' && (
                <div className="ax-field" style={{ marginTop: 'var(--ax-space-1)' }}>
                  <label className="ax-label" htmlFor="j-schedule">Publish date</label>
                  <input id="j-schedule" type="date" className="ax-input ax-num" value={scheduleDate} onChange={(e) => setScheduleDate(e.target.value)} style={{ fontFamily: 'var(--ax-font-mono)' }} />
                </div>
              )}
            </div>
          </section>

          {/* HIRING TEAM */}
          <section className="ax-card" role="region" aria-label="Hiring team">
            <div className="ax-card__header"><div className="ax-card__titles"><h2 className="ax-card__title">Hiring team</h2></div></div>
            <div className="ax-card__body" style={{ paddingTop: 0, display: 'flex', flexDirection: 'column', gap: 'var(--ax-space-4)' }}>
              <div className="ax-field" style={{ margin: 0 }}>
                <label className="ax-label" htmlFor="j-manager">Hiring manager</label>
                <select id="j-manager" className="ax-select" value={manager} onChange={(e) => setManager(e.target.value)}>
                  <option value="priya">Priya Nair</option>
                  <option value="marcus">Marcus Lindqvist</option>
                  <option value="lena">Lena Brandt</option>
                </select>
              </div>
              <div>
                <div className="ax-label" style={{ marginBottom: 'var(--ax-space-2)' }}>Reviewers</div>
                <div className="ax-cluster" style={{ gap: 'var(--ax-space-2)' }}>
                  <span className="ax-avatar ax-avatar--sm" style={{ background: 'color-mix(in oklab,var(--ax-viz-cyan) 18%,transparent)', color: 'var(--ax-viz-cyan)' }}><span className="ax-avatar__initials">TH</span></span>
                  <span className="ax-avatar ax-avatar--sm" style={{ background: 'color-mix(in oklab,var(--ax-viz-violet) 18%,transparent)', color: 'var(--ax-viz-violet)' }}><span className="ax-avatar__initials">DO</span></span>
                  <span className="ax-avatar ax-avatar--sm" style={{ background: 'color-mix(in oklab,var(--ax-viz-pink) 18%,transparent)', color: 'var(--ax-viz-pink)' }}><span className="ax-avatar__initials">AS</span></span>
                  <button type="button" className="ax-avatar ax-avatar--sm" style={{ background: 'var(--ax-surface-subtle)', color: 'var(--ax-text-muted)', border: '1px dashed var(--ax-border-strong)', cursor: 'pointer' }} aria-label="Add reviewer"><svg viewBox="0 0 24 24" width={14} height={14} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 5l0 14" /><path d="M5 12l14 0" /></svg></button>
                </div>
              </div>
            </div>
          </section>

          {/* PREVIEW */}
          <section className="ax-card" role="region" aria-label="Posting preview">
            <div className="ax-card__header"><div className="ax-card__titles"><h2 className="ax-card__title">Live preview</h2></div></div>
            <div className="ax-card__body" style={{ paddingTop: 0 }}>
              <div style={{ border: '1px solid var(--ax-border)', borderRadius: 'var(--ax-radius-md)', padding: 'var(--ax-space-4)', background: 'var(--ax-surface-subtle)' }}>
                <div className="ax-cluster" style={{ gap: 'var(--ax-space-3)' }}>
                  <span className="ax-avatar ax-avatar--md ax-avatar--squircle" style={{ background: 'color-mix(in oklab,var(--ax-accent) 16%,transparent)', color: 'var(--ax-accent)' }}><svg className="ax-avatar__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 21l18 0" /><path d="M5 21v-16a2 2 0 0 1 2 -2h10a2 2 0 0 1 2 2v16" /></svg></span>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 'var(--ax-weight-semibold)', color: 'var(--ax-text-strong)', lineHeight: 1.25 }}>{title || 'Job title'}</div>
                    <div style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-subtle)' }}>{(deptName() || 'Department') + ' · ' + workModel()}</div>
                  </div>
                </div>
                <div className="ax-cluster" style={{ gap: 'var(--ax-space-2)', marginTop: 'var(--ax-space-3)', flexWrap: 'wrap' }}>
                  <span className="ax-badge ax-badge--soft ax-badge--accent" style={{ borderRadius: 'var(--ax-radius-xs)' }}>{typeName()}</span>
                  <span className="ax-num" style={{ fontFamily: 'var(--ax-font-mono)', fontSize: 'var(--ax-text-sm)', fontWeight: 'var(--ax-weight-semibold)', color: 'var(--ax-text-strong)' }}>{salaryPreview()}</span>
                </div>
              </div>
            </div>
          </section>
        </aside>
      </div>

      {/* STICKY ACTION BAR — the full-bleed gutter cancel reads --ax-page-pad, the
         variable .ax-main sets alongside its inline padding, NOT a hard-coded
         space-6: the phone breakpoint tightens the gutter to space-4, and the
         hard-coded value bled 8px past the viewport there. */}
      <div style={{ position: 'sticky', bottom: 0, zIndex: 5, marginInline: 'calc(-1 * var(--ax-page-pad, var(--ax-space-6)))', padding: 'var(--ax-space-4) var(--ax-page-pad, var(--ax-space-6))', background: 'var(--ax-surface)', backdropFilter: 'blur(18px) saturate(1.1)', borderTop: '1px solid var(--ax-border)', boxShadow: 'var(--ax-shadow-sm)' }}>
        <div className="ax-cluster" style={{ justifyContent: 'space-between', gap: 'var(--ax-space-3)', flexWrap: 'wrap' }}>
          <span className="ax-cluster" style={{ gap: 'var(--ax-space-2)', fontSize: 'var(--ax-text-sm)', color: 'var(--ax-text-muted)' }}>
            <svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ color: 'var(--ax-warning-500)' }}><path d="M12 9v4" /><path d="M12 16h.01" /><path d="M3 12a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" /></svg>
            <span>Draft not yet published</span>
          </span>
          <div className="ax-cluster" style={{ gap: 'var(--ax-space-2)' }}>
            <Link className="ax-btn ax-btn--ghost" to="/jobs/list">Cancel</Link>
            <button type="button" className="ax-btn ax-btn--secondary" onClick={() => save('draft')}>Save draft</button>
            <button type="submit" className="ax-btn ax-btn--primary">
              <svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M10 14l11 -11" /><path d="M21 3l-6.5 18a.55 .55 0 0 1 -1 0l-3.5 -7l-7 -3.5a.55 .55 0 0 1 0 -1l18 -6.5" /></svg>
              <span className="ax-btn__label">Publish job</span>
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}

function StepHeader({ step, title, sub }: { step: string; title: string; sub: string }) {
  return (
    <div className="ax-card__header">
      <div className="ax-card__titles">
        <span className="ax-card__eyebrow">{step}</span>
        <h2 className="ax-card__title">{title}</h2>
        <p className="ax-card__subtitle">{sub}</p>
      </div>
    </div>
  );
}

function ToolBtn({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <button type="button" className="ax-btn ax-btn--ghost ax-btn--icon ax-btn--sm" aria-label={label}><svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{children}</svg></button>
  );
}

export default JobPost;
