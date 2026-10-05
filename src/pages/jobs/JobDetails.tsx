/*
 * Vireo React — Job Details (route "jobs/job-details").
 *
 * Faithful re-expression of src/html/jobs/job-details.html: a job summary card,
 * description / requirements / skills / benefits, similar roles, a sticky apply
 * rail, company card, at-a-glance list, plus a native apply modal (focus-trapped,
 * Escape/backdrop close) ported from the Alpine x-data. Classes + ARIA match 1:1.
 */
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { PageHead } from '../../components/shell/PageHead';
import { useFocusTrap } from '../../hooks/useFocusTrap';

const BOOKMARK = (saved: boolean) => (
  <svg className="ax-btn__icon" viewBox="0 0 24 24" fill={saved ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M18 7v14l-6 -4l-6 4v-14a4 4 0 0 1 4 -4h4a4 4 0 0 1 4 4" /></svg>
);
const SEND = (
  <svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M10 14l11 -11" /><path d="M21 3l-6.5 18a.55 .55 0 0 1 -1 0l-3.5 -7l-7 -3.5a.55 .55 0 0 1 0 -1l18 -6.5" /></svg>
);

const RESPONSIBILITIES = [
  'Lead the design of core workspace surfaces — navigation, dashboards, and the token-driven theming system.',
  'Run discovery — interviews, journey mapping, and concept testing — and turn insight into shippable bets.',
  'Contribute to and steward the design system, ensuring WCAG 2.2 AA across light and dark themes.',
  'Mentor two mid-level designers and raise the craft bar through critique and pairing.',
];
const SKILLS = ['Design Systems', 'Figma', 'Accessibility', 'Prototyping', 'UX Research', 'Design Tokens'];

export function JobDetails() {
  const [saved, setSaved] = useState(false);
  const [applied, setApplied] = useState(false);
  const [showApply, setShowApply] = useState(false);
  const [resume, setResume] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  useFocusTrap(dialogRef, showApply);

  useEffect(() => {
    if (!showApply) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setShowApply(false); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [showApply]);

  return (
    <>
      <PageHead
        title="Senior Product Designer"
        subtitle="Northwind Labs · Design · Posted Jun 24, 2026 · 38 applicants."
        actions={
          <>
            <Link className="ax-btn ax-btn--ghost" to="/jobs/list">
              <svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12l14 0" /><path d="M5 12l6 6" /><path d="M5 12l6 -6" /></svg>
              <span className="ax-btn__label">All jobs</span>
            </Link>
            <button type="button" className={`ax-btn ax-btn--secondary ${saved ? 'ax-btn--soft-success' : ''}`} onClick={() => setSaved((s) => !s)}>
              {BOOKMARK(saved)}
              <span className="ax-btn__label">{saved ? 'Saved' : 'Save'}</span>
            </button>
            <button type="button" className="ax-btn ax-btn--primary" disabled={applied} onClick={() => setShowApply(true)}>
              {SEND}
              <span className="ax-btn__label">{applied ? 'Applied' : 'Apply now'}</span>
            </button>
          </>
        }
      />

      {applied && (
        <div className="ax-alert ax-alert--success" role="status" style={{ marginBottom: 'var(--ax-space-6)' }}>
          <span className="ax-alert__icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12l5 5l10 -10" /></svg></span>
          <div className="ax-alert__content"><p className="ax-alert__title">Application submitted</p><p className="ax-alert__message">Northwind Labs has received your application — you'll hear back within 5 business days.</p></div>
        </div>
      )}

      <div className="ax-dash-grid">
        {/* MAIN (8) */}
        <div className="ax-col--8" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--ax-space-6)', minWidth: 0 }}>
          {/* HEADER CARD */}
          <section className="ax-card" role="region" aria-label="Job summary">
            <div className="ax-card__body">
              <div className="ax-cluster" style={{ gap: 'var(--ax-space-4)', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                <span className="ax-avatar ax-avatar--xl ax-avatar--squircle" style={{ background: 'color-mix(in oklab,var(--ax-viz-cyan) 18%,transparent)', color: 'var(--ax-viz-cyan)', flex: 'none' }}>
                  <svg className="ax-avatar__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ width: 26, height: 26 }}><path d="M3 21l18 0" /><path d="M9 8l1 0" /><path d="M9 12l1 0" /><path d="M9 16l1 0" /><path d="M14 8l1 0" /><path d="M14 12l1 0" /><path d="M14 16l1 0" /><path d="M5 21v-16a2 2 0 0 1 2 -2h10a2 2 0 0 1 2 2v16" /></svg>
                </span>
                <div style={{ flex: '1 1 240px', minWidth: 0 }}>
                  <h2 style={{ fontFamily: 'var(--ax-font-display)', fontSize: 'var(--ax-text-xl)', fontWeight: 700, color: 'var(--ax-text-strong)', lineHeight: 1.2 }}>Senior Product Designer</h2>
                  <div className="ax-cluster" style={{ gap: 'var(--ax-space-2)', marginTop: 'var(--ax-space-2)' }}>
                    <span style={{ fontWeight: 'var(--ax-weight-medium)', color: 'var(--ax-text)' }}>Northwind Labs</span>
                    <span className="ax-badge ax-badge--soft ax-badge--success ax-badge--pill"><span className="ax-badge__dot" />Actively hiring</span>
                  </div>
                </div>
              </div>

              {/* fact strip */}
              <div className="ax-jd-facts" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,minmax(0,1fr))', gap: 'var(--ax-space-4)', marginTop: 'var(--ax-space-5)' }}>
                <Fact label="Location" value="Remote (EU)" icon={<><path d="M9 11a3 3 0 1 0 6 0a3 3 0 0 0 -6 0" /><path d="M17.657 16.657l-4.243 4.243a2 2 0 0 1 -2.827 0l-4.244 -4.243a8 8 0 1 1 11.314 0" /></>} />
                <Fact label="Type" value="Full-time" icon={<><path d="M3 9a2 2 0 0 1 2 -2h14a2 2 0 0 1 2 2v9a2 2 0 0 1 -2 2h-14a2 2 0 0 1 -2 -2l0 -9" /><path d="M8 7v-2a2 2 0 0 1 2 -2h4a2 2 0 0 1 2 2v2" /></>} />
                <Fact label="Salary" value="$95K – $120K" num icon={<><path d="M16.7 8a3 3 0 0 0 -2.7 -2h-4a3 3 0 0 0 0 6h4a3 3 0 0 1 0 6h-4a3 3 0 0 1 -2.7 -2" /><path d="M12 3v3m0 12v3" /></>} />
                <Fact label="Experience" value="Senior · 6+ yrs" icon={<><path d="M12 8v4l3 3" /><path d="M3 12a9 9 0 1 0 18 0a9 9 0 0 0 -18 0" /></>} />
              </div>
            </div>
          </section>

          {/* DESCRIPTION + REQUIREMENTS */}
          <section className="ax-card" role="region" aria-label="Job description">
            <div className="ax-card__body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--ax-space-6)' }}>
              <div>
                <h3 style={H3}>About the role</h3>
                <p style={{ color: 'var(--ax-text)', lineHeight: 1.75, fontSize: 'var(--ax-text-sm)' }}>We're looking for a Senior Product Designer to shape the next generation of Northwind's design platform. You'll own end-to-end product flows — from early discovery and prototyping to polished, accessible production UI — partnering daily with PMs and engineers across the Surface team. This is a high-ownership role where your design decisions ship to <span className="ax-num" style={{ fontFamily: 'var(--ax-font-mono)' }}>40,000+</span> teams.</p>
              </div>

              <div>
                <h3 style={H3}>What you'll do</h3>
                <ul style={{ display: 'flex', flexDirection: 'column', gap: 'var(--ax-space-3)', listStyle: 'none', padding: 0 }}>
                  {RESPONSIBILITIES.map((r) => (
                    <li key={r} className="ax-cluster" style={{ gap: 'var(--ax-space-3)', alignItems: 'flex-start', flexWrap: 'nowrap' }}><svg viewBox="0 0 24 24" width={18} height={18} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flex: 'none', marginTop: 2, color: 'var(--ax-accent)' }}><path d="M5 12l5 5l10 -10" /></svg><span style={{ color: 'var(--ax-text)', fontSize: 'var(--ax-text-sm)', lineHeight: 1.6 }}>{r}</span></li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 style={H3}>Requirements</h3>
                <ul style={{ display: 'flex', flexDirection: 'column', gap: 'var(--ax-space-3)', listStyle: 'none', padding: 0 }}>
                  <Req><b style={{ color: 'var(--ax-text-strong)' }}>6+ years</b> designing complex SaaS or developer products, with a portfolio that shows shipped work.</Req>
                  <Req>Fluency in <b style={{ color: 'var(--ax-text-strong)' }}>Figma</b>, component-driven design, and design-token systems.</Req>
                  <Req>A real accessibility practice — you can reason about contrast, focus order, and semantics.</Req>
                  <Req>Comfortable working async across European time zones with strong written communication.</Req>
                </ul>
              </div>

              <div>
                <h3 style={H3}>Skills</h3>
                <div className="ax-cluster" style={{ gap: 'var(--ax-space-2)', flexWrap: 'wrap' }}>
                  {SKILLS.map((s) => <span key={s} className="ax-badge ax-badge--soft ax-badge--accent" style={{ borderRadius: 'var(--ax-radius-xs)' }}>{s}</span>)}
                </div>
              </div>

              <div>
                <h3 style={H3}>Benefits &amp; perks</h3>
                <div className="ax-jd-perks" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--ax-space-3)' }}>
                  <Perk color="var(--ax-viz-emerald)" text="Fully remote, async-first" icon={<path d="M12 3l2.582 6.953l7.418 .382l-5.755 4.704l1.91 7.961l-6.155 -4.318l-6.155 4.318l1.91 -7.961l-5.755 -4.704l7.418 -.382z" />} />
                  <Perk color="var(--ax-viz-cyan)" text="Equity + annual bonus" icon={<><path d="M16.7 8a3 3 0 0 0 -2.7 -2h-4a3 3 0 0 0 0 6h4a3 3 0 0 1 0 6h-4a3 3 0 0 1 -2.7 -2" /><path d="M12 3v3m0 12v3" /></>} />
                  <Perk color="var(--ax-viz-violet)" text="30 days paid leave" icon={<><path d="M4 7a2 2 0 0 1 2 -2h12a2 2 0 0 1 2 2v12a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2v-12" /><path d="M16 3v4" /><path d="M8 3v4" /><path d="M4 11h16" /></>} />
                  <Perk color="var(--ax-viz-amber)" text="$2K yearly learning budget" icon={<><path d="M22 9l-10 -4l-10 4l10 4l10 -4v6" /><path d="M6 10.6v5.4a6 3 0 0 0 12 0v-5.4" /></>} />
                </div>
              </div>
            </div>
          </section>

          {/* SIMILAR JOBS */}
          <section className="ax-card" role="region" aria-label="Similar jobs">
            <div className="ax-card__header">
              <div className="ax-card__titles"><h2 className="ax-card__title">Similar roles</h2></div>
              <Link className="ax-btn ax-btn--link" to="/jobs/list">View all</Link>
            </div>
            <div className="ax-card__body" style={{ paddingTop: 0, display: 'flex', flexDirection: 'column', gap: 'var(--ax-space-3)' }}>
              <SimilarRole color="var(--ax-viz-violet)" title="UX Research Lead" sub="Northwind Labs · London, UK" salary="$105K – $135K" />
              <SimilarRole color="var(--ax-viz-pink)" title="Design Systems Engineer" sub="Helios Cloud · Remote (EU)" salary="$120K – $150K" />
              <SimilarRole color="var(--ax-viz-amber)" title="Senior Product Manager" sub="Vela Systems · Berlin, DE" salary="$110K – $140K" />
            </div>
          </section>
        </div>

        {/* RAIL (4) */}
        <aside className="ax-col--4" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--ax-space-6)', minWidth: 0 }}>
          {/* STICKY APPLY PANEL */}
          <section className="ax-card ax-card--accent-edge" role="region" aria-label="Apply" style={{ alignSelf: 'start' }}>
            <div className="ax-card__body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--ax-space-4)' }}>
              <div>
                <div className="ax-num" style={{ fontFamily: 'var(--ax-font-display)', fontSize: 'var(--ax-text-2xl)', fontWeight: 700, color: 'var(--ax-text-strong)', lineHeight: 1.1 }}>$95K – $120K</div>
                <div style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-subtle)' }}>Base salary · per year</div>
              </div>
              <div className="ax-divider" role="separator" style={{ height: 1, background: 'var(--ax-border)' }} />
              <div>
                <div className="ax-cluster" style={{ justifyContent: 'space-between', marginBottom: 6 }}><span style={{ fontSize: 'var(--ax-text-sm)', color: 'var(--ax-text-muted)' }}>Applicants</span><b className="ax-num" style={{ fontFamily: 'var(--ax-font-mono)', color: 'var(--ax-text-strong)', fontSize: 'var(--ax-text-sm)' }}>38 / 60</b></div>
                <div className="ax-progress ax-progress--sm"><div className="ax-progress__track"><div className="ax-progress__fill" style={{ width: '63%', background: 'var(--ax-accent)' }} /></div></div>
                <div style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-subtle)', marginTop: 6 }}>Position closes when 60 applications are reached.</div>
              </div>
              <button type="button" className="ax-btn ax-btn--primary ax-btn--block ax-btn--lg" disabled={applied} onClick={() => setShowApply(true)}>
                {SEND}
                <span className="ax-btn__label">{applied ? 'Application sent' : 'Apply for this job'}</span>
              </button>
              <button type="button" className="ax-btn ax-btn--secondary ax-btn--block" onClick={() => setSaved((s) => !s)}>
                {BOOKMARK(saved)}
                <span className="ax-btn__label">{saved ? 'Saved to your list' : 'Save for later'}</span>
              </button>
              <div className="ax-cluster" style={{ justifyContent: 'center', gap: 'var(--ax-space-2)', fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-subtle)' }}>
                <svg viewBox="0 0 24 24" width={14} height={14} fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12a7 7 0 0 1 14 0a7 7 0 0 1 -14 0" /><path d="M12 9v3l1.5 1.5" /></svg>
                <span>Typical reply within 5 days</span>
              </div>
            </div>
          </section>

          {/* COMPANY CARD */}
          <section className="ax-card" role="region" aria-label="About the company">
            <div className="ax-card__header"><div className="ax-card__titles"><h2 className="ax-card__title">About Northwind Labs</h2></div></div>
            <div className="ax-card__body" style={{ paddingTop: 0, display: 'flex', flexDirection: 'column', gap: 'var(--ax-space-4)' }}>
              <div className="ax-cluster" style={{ gap: 'var(--ax-space-3)' }}>
                <span className="ax-avatar ax-avatar--lg ax-avatar--squircle" style={{ background: 'color-mix(in oklab,var(--ax-viz-cyan) 18%,transparent)', color: 'var(--ax-viz-cyan)' }}><svg className="ax-avatar__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 21l18 0" /><path d="M5 21v-16a2 2 0 0 1 2 -2h10a2 2 0 0 1 2 2v16" /></svg></span>
                <div>
                  <div style={{ fontWeight: 'var(--ax-weight-semibold)', color: 'var(--ax-text-strong)' }}>Northwind Labs</div>
                  <div style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-subtle)' }}>Developer tools · Series B</div>
                </div>
              </div>
              <p style={{ color: 'var(--ax-text-muted)', fontSize: 'var(--ax-text-sm)', lineHeight: 1.6 }}>Northwind builds the workspace platform trusted by modern product teams. Remote-first, 140 people across 18 countries.</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--ax-space-3)' }}>
                <Stat value="140" label="Employees" />
                <Stat value="12" label="Open roles" />
              </div>
              <Link to="/jobs/list" className="ax-btn ax-btn--ghost ax-btn--block">
                <svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 12a9 9 0 1 0 18 0a9 9 0 0 0 -18 0" /><path d="M3.6 9h16.8" /><path d="M3.6 15h16.8" /><path d="M11.5 3a17 17 0 0 0 0 18" /><path d="M12.5 3a17 17 0 0 1 0 18" /></svg>
                <span className="ax-btn__label">View company profile</span>
              </Link>
            </div>
          </section>

          {/* KEY DETAILS */}
          <section className="ax-card" role="region" aria-label="At a glance">
            <div className="ax-card__header"><div className="ax-card__titles"><h2 className="ax-card__title">At a glance</h2></div></div>
            <ul className="ax-list ax-list--compact" style={{ padding: '0 var(--ax-space-5) var(--ax-space-4)' }}>
              <Glance label="Job ID" value="JOB-120" />
              <Glance label="Posted" value="Jun 24, 2026" />
              <Glance label="Closes" value="Jul 22, 2026" />
              <li className="ax-list__row"><span className="ax-list__content"><span className="ax-list__title" style={{ color: 'var(--ax-text-muted)', fontWeight: 400 }}>Visa sponsorship</span></span><span className="ax-list__trailing"><span className="ax-badge ax-badge--soft ax-badge--success" style={{ borderRadius: 'var(--ax-radius-xs)' }}>Available</span></span></li>
            </ul>
          </section>
        </aside>
      </div>

      {/* APPLY MODAL */}
      {showApply && (
        <div className="ax-backdrop ax-grid" onClick={() => setShowApply(false)} style={{ position: 'fixed', inset: 0, zIndex: 60, placeItems: 'center', padding: 'var(--ax-space-4)', background: 'color-mix(in oklab,var(--ax-canvas) 60%,transparent)', backdropFilter: 'blur(6px)' }}>
          <div ref={dialogRef} className="ax-card" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="apply-title" style={{ width: '100%', maxWidth: 520, margin: 0, maxHeight: '90vh', overflow: 'auto', boxShadow: 'var(--ax-shadow-lg)' }}>
            <div className="ax-card__header">
              <div className="ax-card__titles"><span className="ax-card__eyebrow">Northwind Labs</span><h2 className="ax-card__title" id="apply-title">Apply — Senior Product Designer</h2></div>
              <button type="button" className="ax-btn ax-btn--ghost ax-btn--icon ax-btn--sm" onClick={() => setShowApply(false)} aria-label="Close"><svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M18 6l-12 12" /><path d="M6 6l12 12" /></svg></button>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); setApplied(true); setShowApply(false); }} className="ax-card__body" style={{ paddingTop: 0, display: 'flex', flexDirection: 'column', gap: 'var(--ax-space-4)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--ax-space-4)' }}>
                <div className="ax-field" style={{ margin: 0 }}><label className="ax-label" htmlFor="a-first">First name <span className="ax-field__required">*</span></label><input id="a-first" type="text" className="ax-input" placeholder="Aria" required /></div>
                <div className="ax-field" style={{ margin: 0 }}><label className="ax-label" htmlFor="a-last">Last name <span className="ax-field__required">*</span></label><input id="a-last" type="text" className="ax-input" placeholder="Voss" required /></div>
              </div>
              <div className="ax-field" style={{ margin: 0 }}><label className="ax-label" htmlFor="a-email">Email <span className="ax-field__required">*</span></label><input id="a-email" type="email" className="ax-input" placeholder="aria@example.com" required /></div>
              <div className="ax-field" style={{ margin: 0 }}><label className="ax-label" htmlFor="a-link">Portfolio / LinkedIn</label><input id="a-link" type="url" className="ax-input" placeholder="https://" /></div>
              <div className="ax-field" style={{ margin: 0 }}>
                <label className="ax-label">Resume <span className="ax-field__required">*</span></label>
                <div className="ax-dropzone">
                  <label className="ax-dropzone__area" htmlFor="a-resume" onChange={() => setResume(true)} style={{ cursor: 'pointer' }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M7 18a4.6 4.4 0 0 1 0 -9a5 4.5 0 0 1 11 2h1a3.5 3.5 0 0 1 0 7h-1" /><path d="M9 15l3 -3l3 3" /><path d="M12 12l0 9" /></svg>
                    {!resume && <div><b style={{ color: 'var(--ax-text)' }}>Upload your resume</b> — PDF or DOCX</div>}
                    {resume && <div className="ax-cluster" style={{ gap: 6, color: 'var(--ax-viz-emerald)' }}><svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12l5 5l10 -10" /></svg><b className="ax-num" style={{ fontFamily: 'var(--ax-font-mono)' }}>aria-voss-resume.pdf</b></div>}
                    <input id="a-resume" type="file" accept=".pdf,.doc,.docx" className="ax-visually-hidden" />
                  </label>
                </div>
              </div>
              <div className="ax-field" style={{ margin: 0 }}><label className="ax-label" htmlFor="a-cover">Why are you a fit?</label><textarea id="a-cover" className="ax-textarea" rows={3} placeholder="A few lines on why this role excites you…" /></div>
              <div className="ax-cluster" style={{ justifyContent: 'flex-end', gap: 'var(--ax-space-2)', marginTop: 'var(--ax-space-1)' }}>
                <button type="button" className="ax-btn ax-btn--ghost" onClick={() => setShowApply(false)}>Cancel</button>
                <button type="submit" className="ax-btn ax-btn--primary">Submit application</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

const H3: React.CSSProperties = { fontFamily: 'var(--ax-font-display)', fontSize: 'var(--ax-text-lg)', fontWeight: 600, color: 'var(--ax-text-strong)', marginBottom: 'var(--ax-space-3)' };

function Fact({ label, value, icon, num }: { label: string; value: string; icon: React.ReactNode; num?: boolean }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <span className="ax-cluster" style={{ gap: 6, color: 'var(--ax-text-subtle)', fontSize: 'var(--ax-text-xs)' }}><svg viewBox="0 0 24 24" width={15} height={15} fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{icon}</svg>{label}</span>
      <b className={num ? 'ax-num' : undefined} style={{ fontFamily: num ? 'var(--ax-font-mono)' : undefined, fontSize: 'var(--ax-text-sm)', color: 'var(--ax-text-strong)' }}>{value}</b>
    </div>
  );
}

function Req({ children }: { children: React.ReactNode }) {
  return (
    <li className="ax-cluster" style={{ gap: 'var(--ax-space-3)', alignItems: 'flex-start', flexWrap: 'nowrap' }}><span style={{ flex: 'none', marginTop: 7, width: 6, height: 6, borderRadius: '50%', background: 'var(--ax-text-subtle)' }} /><span style={{ color: 'var(--ax-text)', fontSize: 'var(--ax-text-sm)', lineHeight: 1.6 }}>{children}</span></li>
  );
}

function Perk({ color, text, icon }: { color: string; text: string; icon: React.ReactNode }) {
  return (
    <span className="ax-cluster" style={{ gap: 'var(--ax-space-3)' }}><svg viewBox="0 0 24 24" width={18} height={18} fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ color, flex: 'none' }}>{icon}</svg><span style={{ fontSize: 'var(--ax-text-sm)', color: 'var(--ax-text)' }}>{text}</span></span>
  );
}

function SimilarRole({ color, title, sub, salary }: { color: string; title: string; sub: string; salary: string }) {
  return (
    <Link to="/jobs/job-details" className="ax-list__row" style={{ border: '1px solid var(--ax-border)', borderRadius: 'var(--ax-radius-md)', padding: 'var(--ax-space-3) var(--ax-space-4)', textDecoration: 'none' }}>
      <span className="ax-avatar ax-avatar--sm ax-avatar--squircle" style={{ background: `color-mix(in oklab,${color} 18%,transparent)`, color }}><svg className="ax-avatar__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 21l18 0" /><path d="M5 21v-16a2 2 0 0 1 2 -2h10a2 2 0 0 1 2 2v16" /></svg></span>
      <span className="ax-list__content"><span className="ax-list__title" style={{ color: 'var(--ax-text-strong)' }}>{title}</span><span style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-subtle)' }}>{sub}</span></span>
      <span className="ax-list__trailing ax-num" style={{ fontFamily: 'var(--ax-font-mono)', fontSize: 'var(--ax-text-sm)', color: 'var(--ax-text-strong)' }}>{salary}</span>
    </Link>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div style={{ border: '1px solid var(--ax-border)', borderRadius: 'var(--ax-radius-md)', padding: 'var(--ax-space-3)', textAlign: 'center' }}>
      <div className="ax-num" style={{ fontFamily: 'var(--ax-font-mono)', fontWeight: 'var(--ax-weight-semibold)', color: 'var(--ax-text-strong)', fontSize: 'var(--ax-text-md)' }}>{value}</div>
      <div style={{ fontSize: 'var(--ax-text-2xs)', color: 'var(--ax-text-subtle)', textTransform: 'uppercase', letterSpacing: '.04em' }}>{label}</div>
    </div>
  );
}

function Glance({ label, value }: { label: string; value: string }) {
  return (
    <li className="ax-list__row"><span className="ax-list__content"><span className="ax-list__title" style={{ color: 'var(--ax-text-muted)', fontWeight: 400 }}>{label}</span></span><span className="ax-list__trailing ax-num" style={{ fontFamily: 'var(--ax-font-mono)', color: 'var(--ax-text)' }}>{value}</span></li>
  );
}

export default JobDetails;
