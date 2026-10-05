/*
 * Vireo React — School Admin dashboard (route "dashboards/school").
 *
 * Faithful re-expression of src/html/dashboards/school.html: a full-width "Key
 * figures" .ax-statgroup band on an .ax-card--filled, an
 * attendance stacked column + students-by-grade donut, an average-exam-scores
 * distributed column + fee-collection goal bars, today's timetable, a notices
 * timeline, a top-performers list and a recent-admissions table. Charts go
 * through <ApexChart>; DOM classes/ARIA match the reference 1:1.
 */
import type { ReactElement } from 'react';
import { PageHead } from '../../components/shell/PageHead';
import { ApexChart } from '../../components/charts/ApexChart';

const cv = (n: string) => getComputedStyle(document.documentElement).getPropertyValue(n).trim();

const ICON_GRAD = (
  <svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M22 9l-10 -4l-10 4l10 4l10 -4v6" /><path d="M6 10.6v5.4a6 3 0 0 0 12 0v-5.4" /></svg>
);
const ICON_CHEV = (
  <svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M6 9l6 6l6 -6" /></svg>
);
const ICON_EXPORT = (
  <svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2 -2v-2" /><path d="M7 11l5 5l5 -5" /><path d="M12 4l0 12" /></svg>
);
const ICON_PLUS = (
  <svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 5l0 14" /><path d="M5 12l14 0" /></svg>
);

interface Stat { icon: ReactElement; iconClass: string; label: string; value: string; delta: string }
const STATS: Stat[] = [
  { iconClass: '', label: 'Total Students', value: '2,340', delta: '+2.0%', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M22 9l-10 -4l-10 4l10 4l10 -4v6" /><path d="M6 10.6v5.4a6 3 0 0 0 12 0v-5.4" /></svg> },
  { iconClass: ' ax-statgroup__icon--c2', label: 'Teachers', value: '148', delta: '+1.0%', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M10 13a2 2 0 1 0 4 0a2 2 0 0 0 -4 0" /><path d="M8 21v-1a2 2 0 0 1 2 -2h4a2 2 0 0 1 2 2v1" /><path d="M15 5a2 2 0 1 0 4 0a2 2 0 0 0 -4 0" /><path d="M17 10h2a2 2 0 0 1 2 2v1" /><path d="M5 5a2 2 0 1 0 4 0a2 2 0 0 0 -4 0" /><path d="M3 13v-1a2 2 0 0 1 2 -2h2" /></svg> },
  { iconClass: ' ax-statgroup__icon--c3', label: 'Attendance Rate', value: '94.8%', delta: '+0.4%', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M8 7a4 4 0 1 0 8 0a4 4 0 0 0 -8 0" /><path d="M6 21v-2a4 4 0 0 1 4 -4h4" /><path d="M15 19l2 2l4 -4" /></svg> },
  { iconClass: ' ax-statgroup__icon--c4', label: 'Fee Collection', value: '88%', delta: '+3.0%', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M16.7 8a3 3 0 0 0 -2.7 -2h-4a3 3 0 0 0 0 6h4a3 3 0 0 1 0 6h-4a3 3 0 0 1 -2.7 -2" /><path d="M12 3v3m0 12v3" /></svg> },
];

const GRADES = [
  { label: 'Grade 9', color: 'var(--ax-viz-cyan)', value: '648' },
  { label: 'Grade 10', color: 'var(--ax-viz-violet)', value: '612' },
  { label: 'Grade 11', color: 'var(--ax-viz-pink)', value: '558' },
  { label: 'Grade 12', color: 'var(--ax-viz-amber)', value: '522' },
];

const TIMETABLE = [
  { time: '08:30', timeColor: 'var(--ax-accent)', subject: 'Mathematics', sub: 'Ms. Ferreira · Room 14' },
  { time: '09:30', timeColor: 'var(--ax-accent)', subject: 'Physics', sub: 'Mr. Adeyemi · Lab 2' },
  { time: '11:00', timeColor: 'var(--ax-accent)', subject: 'English Literature', sub: 'Ms. Holloway · Room 9' },
  { time: '13:30', timeColor: 'var(--ax-text-muted)', subject: 'Chemistry', sub: 'Dr. Singh · Lab 1' },
];

const PERFORMERS = [
  { rank: '1', color: 'var(--ax-viz-amber)', weight: 700, name: 'Aisha Rahman', cls: 'Grade 12-A', gpa: '4.00' },
  { rank: '2', color: 'var(--ax-text-subtle)', weight: 700, name: 'Noah Castellanos', cls: 'Grade 11-B', gpa: '3.98', muted: true },
  { rank: '3', color: 'var(--ax-viz-pink)', weight: 700, name: 'Mei Lin Chow', cls: 'Grade 12-C', gpa: '3.95' },
  { rank: '4', color: 'var(--ax-viz-cyan)', weight: 600, name: 'Oliver Tan', cls: 'Grade 10-A', gpa: '3.92' },
  { rank: '5', color: 'var(--ax-viz-violet)', weight: 600, name: 'Sara Bianchi', cls: 'Grade 11-A', gpa: '3.90' },
];

const ADMISSIONS = [
  { initials: 'LK', color: 'var(--ax-viz-cyan)', name: 'Leah Kowalski', id: '#S-22841', grade: 'Grade 9', guardian: 'Anna Kowalski', date: 'Jun 24', fees: 'Paid', feesTone: 'success', status: 'Active', statusTone: 'success' },
  { initials: 'JM', color: 'var(--ax-viz-violet)', name: 'Jamal Mensah', id: '#S-22840', grade: 'Grade 10', guardian: 'Kofi Mensah', date: 'Jun 23', fees: 'Partial', feesTone: 'warning', status: 'Active', statusTone: 'success' },
  { initials: 'YN', color: 'var(--ax-viz-pink)', name: 'Yara Nasser', id: '#S-22839', grade: 'Grade 9', guardian: 'Layla Nasser', date: 'Jun 22', fees: 'Paid', feesTone: 'success', status: 'Active', statusTone: 'success' },
  { initials: 'DP', color: 'var(--ax-viz-amber)', name: 'Diego Paredes', id: '#S-22838', grade: 'Grade 11', guardian: 'Rosa Paredes', date: 'Jun 21', fees: 'Overdue', feesTone: 'danger', status: 'Pending', statusTone: 'warning' },
  { initials: 'HK', color: 'var(--ax-viz-emerald)', name: 'Hana Kim', id: '#S-22837', grade: 'Grade 12', guardian: 'Soo-jin Kim', date: 'Jun 20', fees: 'Paid', feesTone: 'success', status: 'Active', statusTone: 'success' },
];

export function School() {
  return (
    <>
      <PageHead
        title="School Admin"
        subtitle="Attendance, performance and fees — Greenfield Academy, term 3."
        actions={
          <>
            <button type="button" className="ax-btn ax-btn--secondary ax-btn--pill">{ICON_GRAD}<span className="ax-btn__label">All grades</span>{ICON_CHEV}</button>
            <button type="button" className="ax-btn ax-btn--ghost">{ICON_EXPORT}<span className="ax-btn__label">Export</span></button>
            <button type="button" className="ax-btn ax-btn--primary">{ICON_PLUS}<span className="ax-btn__label">Add Student</span></button>
          </>
        }
      />

      <div className="ax-dash-grid">
        {/* KEY FIGURES — one band, not a row of four separate tiles */}
        <section className="ax-card ax-card--filled ax-col--12" role="region" aria-label="Key figures">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <h2 className="ax-card__title">Key figures</h2>
            </div>
          </div>
          <div className="ax-card__body" style={{ paddingTop: 0 }}>
            <div className="ax-statgroup">
              {STATS.map((s) => (
                <div key={s.label} className="ax-statgroup__cell">
                  <span className={`ax-statgroup__icon${s.iconClass}`}>{s.icon}</span>
                  <span className="ax-statgroup__text">
                    <span className="ax-statgroup__label">{s.label}</span>
                    <span className="ax-statgroup__value ax-num">{s.value}</span>
                  </span>
                  <span className="ax-statgroup__delta ax-statgroup__delta--up">{s.delta}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* HERO: Attendance stacked column (7) */}
        <section className="ax-card ax-card--chart ax-col--7" role="region" aria-label="Attendance overview">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <span className="ax-card__eyebrow">This week</span>
              <h2 className="ax-card__title">Attendance Overview</h2>
              <p className="ax-card__subtitle">Present, late and absent per day</p>
            </div>
            <div className="ax-card__actions">
              <span className="ax-cluster" style={{ gap: 'var(--ax-space-2)' }}><i style={{ width: 9, height: 9, borderRadius: 3, background: 'var(--ax-accent)' }} /><small style={{ color: 'var(--ax-text-muted)', fontSize: 'var(--ax-text-sm)' }}>Present</small></span>
              <span className="ax-cluster" style={{ gap: 'var(--ax-space-2)' }}><i style={{ width: 9, height: 9, borderRadius: 3, background: 'var(--ax-viz-amber)' }} /><small style={{ color: 'var(--ax-text-muted)', fontSize: 'var(--ax-text-sm)' }}>Late</small></span>
              <span className="ax-cluster" style={{ gap: 'var(--ax-space-2)' }}><i style={{ width: 9, height: 9, borderRadius: 3, background: 'var(--ax-viz-pink)' }} /><small style={{ color: 'var(--ax-text-muted)', fontSize: 'var(--ax-text-sm)' }}>Absent</small></span>
            </div>
          </div>
          <div className="ax-card__body" style={{ paddingTop: 0 }}>
            <ApexChart
              type="bar" height={310} legend="none" stacked accent
              ariaLabel="Stacked column chart of present, late and absent students per weekday"
              series={[
                { name: 'Present', data: [2180, 2210, 2150, 2240, 2120] },
                { name: 'Late', data: [92, 78, 110, 64, 102] },
                { name: 'Absent', data: [68, 52, 80, 36, 118] },
              ]}
              apex={{
                colors: [cv('--ax-accent'), cv('--ax-viz-amber'), cv('--ax-viz-pink')],
                plotOptions: { bar: { columnWidth: '46%', borderRadius: 4 } },
                xaxis: { categories: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'] },
              }}
            />
          </div>
        </section>

        {/* By Grade donut (5) */}
        <section className="ax-card ax-col--5" role="region" aria-label="Students by grade">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <h2 className="ax-card__title">By Grade</h2>
              <p className="ax-card__subtitle">Enrollment distribution</p>
            </div>
          </div>
          <div className="ax-card__body" style={{ paddingTop: 0 }}>
            <ApexChart
              type="donut" height={220} legend="none"
              ariaLabel="Donut: Grade 9, Grade 10, Grade 11, Grade 12"
              series={[648, 612, 558, 522]}
              apex={{
                labels: ['Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'],
                colors: [cv('--ax-viz-cyan'), cv('--ax-viz-violet'), cv('--ax-viz-pink'), cv('--ax-viz-amber')],
                stroke: { width: 0 },
                plotOptions: { pie: { donut: { size: '72%', labels: { show: true, value: { fontFamily: cv('--ax-font-mono'), fontWeight: 600 }, total: { show: true, label: 'Students', formatter: () => '2,340' } } } } },
              }}
            />
            <ul className="ax-list ax-list--compact" style={{ marginTop: 'var(--ax-space-2)' }}>
              {GRADES.map((g) => (
                <li key={g.label} className="ax-list__row" style={{ border: 0, paddingInline: 0 }}>
                  <span className="ax-list__leading"><i style={{ width: 9, height: 9, borderRadius: 3, background: g.color, display: 'inline-block' }} /></span>
                  <span className="ax-list__content"><span className="ax-list__title" style={{ fontWeight: 'var(--ax-weight-medium)' }}>{g.label}</span></span>
                  <span className="ax-list__trailing ax-num" style={{ color: 'var(--ax-text-strong)' }}>{g.value}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Average Exam Scores column (8) */}
        <section className="ax-card ax-card--chart ax-col--8" role="region" aria-label="Exam results by subject">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <h2 className="ax-card__title">Average Exam Scores</h2>
              <p className="ax-card__subtitle">Mid-term results by subject (out of 100)</p>
            </div>
            <a className="ax-btn ax-btn--link" href="#">Gradebook</a>
          </div>
          <div className="ax-card__body" style={{ paddingTop: 0 }}>
            <ApexChart
              type="bar" height={290} legend="none" accent
              ariaLabel="Column chart of average exam scores by subject"
              series={[{ name: 'Avg score', data: [82, 76, 88, 71, 79, 85, 68] }]}
              apex={{
                plotOptions: { bar: { columnWidth: '52%', borderRadius: 5, distributed: true } },
                colors: [cv('--ax-accent'), cv('--ax-viz-cyan'), cv('--ax-viz-violet'), cv('--ax-viz-pink'), cv('--ax-viz-amber'), cv('--ax-viz-emerald'), cv('--ax-accent')],
                xaxis: { categories: ['Math', 'Physics', 'English', 'Chem', 'Biology', 'History', 'Geo'] },
                yaxis: { max: 100 },
                tooltip: { y: { formatter: (v: number) => v + ' / 100' } },
              }}
            />
          </div>
        </section>

        {/* Fee Collection goal (4) */}
        <section className="ax-card ax-col--4" role="region" aria-label="Fee collection status">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <h2 className="ax-card__title">Fee Collection</h2>
              <p className="ax-card__subtitle">Term 3 · $1.84M billed</p>
            </div>
          </div>
          <div className="ax-card__body" style={{ paddingTop: 0, display: 'flex', flexDirection: 'column', gap: 'var(--ax-space-4)' }}>
            <div>
              <div className="ax-cluster" style={{ justifyContent: 'space-between', marginBottom: 6 }}><span style={{ fontSize: 'var(--ax-text-sm)', color: 'var(--ax-text)' }}>Collected</span><b className="ax-num" style={{ color: 'var(--ax-viz-emerald)', fontSize: 'var(--ax-text-sm)' }}>$1.62M</b></div>
              <div className="ax-progress ax-progress--sm"><div className="ax-progress__track"><div className="ax-progress__fill" style={{ width: '88%', background: 'var(--ax-viz-emerald)' }} /></div></div>
            </div>
            <div>
              <div className="ax-cluster" style={{ justifyContent: 'space-between', marginBottom: 6 }}><span style={{ fontSize: 'var(--ax-text-sm)', color: 'var(--ax-text)' }}>Pending</span><b className="ax-num" style={{ color: 'var(--ax-warning-500)', fontSize: 'var(--ax-text-sm)' }}>$148K</b></div>
              <div className="ax-progress ax-progress--sm"><div className="ax-progress__track"><div className="ax-progress__fill" style={{ width: '8%', background: 'var(--ax-warning-500)' }} /></div></div>
            </div>
            <div>
              <div className="ax-cluster" style={{ justifyContent: 'space-between', marginBottom: 6 }}><span style={{ fontSize: 'var(--ax-text-sm)', color: 'var(--ax-text)' }}>Overdue</span><b className="ax-num" style={{ color: 'var(--ax-danger-500)', fontSize: 'var(--ax-text-sm)' }}>$72K</b></div>
              <div className="ax-progress ax-progress--sm"><div className="ax-progress__track"><div className="ax-progress__fill" style={{ width: '4%', background: 'var(--ax-danger-500)' }} /></div></div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--ax-space-3)', textAlign: 'center', marginTop: 'var(--ax-space-2)', paddingTop: 'var(--ax-space-4)', borderTop: '1px solid var(--ax-border)' }}>
              <div><small style={{ display: 'block', color: 'var(--ax-text-subtle)', fontSize: 'var(--ax-text-xs)', marginBottom: 2 }}>Paid in full</small><b className="ax-num" style={{ color: 'var(--ax-text-strong)', fontSize: 'var(--ax-text-md)' }}>2,058</b></div>
              <div><small style={{ display: 'block', color: 'var(--ax-text-subtle)', fontSize: 'var(--ax-text-xs)', marginBottom: 2 }}>Defaulters</small><b className="ax-num" style={{ color: 'var(--ax-danger-500)', fontSize: 'var(--ax-text-md)' }}>94</b></div>
            </div>
          </div>
        </section>

        {/* Today's Timetable (4) */}
        <section className="ax-card ax-col--4" role="region" aria-label="Today's timetable">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <h2 className="ax-card__title">Today's Timetable</h2>
              <p className="ax-card__subtitle">Grade 11-B</p>
            </div>
            <a className="ax-btn ax-btn--link" href="#">Full</a>
          </div>
          <div className="ax-card__body" style={{ paddingTop: 0, display: 'flex', flexDirection: 'column', gap: 'var(--ax-space-3)' }}>
            {TIMETABLE.map((t) => (
              <div key={t.subject} className="ax-cluster" style={{ gap: 'var(--ax-space-3)', flexWrap: 'nowrap', alignItems: 'flex-start' }}>
                <span className="ax-num" style={{ fontFamily: 'var(--ax-font-mono)', fontSize: 'var(--ax-text-sm)', color: t.timeColor, minWidth: 48, fontWeight: 600 }}>{t.time}</span>
                <div style={{ flex: '1 1 auto', minWidth: 0, borderLeft: '2px solid var(--ax-border)', paddingLeft: 'var(--ax-space-3)' }}>
                  <div style={{ fontWeight: 'var(--ax-weight-medium)', color: 'var(--ax-text-strong)' }}>{t.subject}</div>
                  <div style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-subtle)' }}>{t.sub}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Notices (4) */}
        <section className="ax-card ax-col--4" role="region" aria-label="Notices and announcements">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <h2 className="ax-card__title">Notices</h2>
              <p className="ax-card__subtitle">Latest announcements</p>
            </div>
            <a className="ax-btn ax-btn--link" href="#">Board</a>
          </div>
          <div className="ax-card__body" style={{ paddingTop: 0 }}>
            <ul className="ax-timeline">
              <li className="ax-timeline__item ax-timeline__item--success">
                <span className="ax-timeline__marker"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M10 5a2 2 0 1 1 4 0a7 7 0 0 1 4 6v3a4 4 0 0 0 2 3h-16a4 4 0 0 0 2 -3v-3a7 7 0 0 1 4 -6" /><path d="M9 17v1a3 3 0 0 0 6 0v-1" /></svg></span>
                <div className="ax-timeline__content">
                  <p className="ax-timeline__title"><b style={{ color: 'var(--ax-text-strong)' }}>Sports Day</b> moved to Jul 4 — full schedule posted</p>
                  <span className="ax-timeline__time">2h ago · Admin</span>
                </div>
              </li>
              <li className="ax-timeline__item">
                <span className="ax-timeline__marker" style={{ color: 'var(--ax-viz-violet)' }}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M14 3v4a1 1 0 0 0 1 1h4" /><path d="M5 21v-16a2 2 0 0 1 2 -2h7l5 5v11a2 2 0 0 1 -2 2z" /><path d="M9 9l1 0" /><path d="M9 13l6 0" /><path d="M9 17l6 0" /></svg></span>
                <div className="ax-timeline__content">
                  <p className="ax-timeline__title">Mid-term <b style={{ color: 'var(--ax-text-strong)' }}>report cards</b> available to parents</p>
                  <span className="ax-timeline__time">Yesterday · Academics</span>
                </div>
              </li>
              <li className="ax-timeline__item">
                <span className="ax-timeline__marker" style={{ color: 'var(--ax-viz-amber)' }}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 7a2 2 0 0 1 2 -2h12a2 2 0 0 1 2 2v12a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2l0 -12" /><path d="M16 3l0 4" /><path d="M8 3l0 4" /><path d="M4 11l16 0" /></svg></span>
                <div className="ax-timeline__content">
                  <p className="ax-timeline__title"><b style={{ color: 'var(--ax-text-strong)' }}>Parent-teacher</b> meetings on Jul 9, 16:00</p>
                  <span className="ax-timeline__time">Jun 25 · Admin</span>
                </div>
              </li>
              <li className="ax-timeline__item">
                <span className="ax-timeline__marker" style={{ color: 'var(--ax-viz-cyan)' }}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 17v-13h13v13" /><path d="M9 8h13" /><path d="M5 21v-9a2 2 0 0 1 2 -2h2" /></svg></span>
                <div className="ax-timeline__content">
                  <p className="ax-timeline__title">Library closed Jul 2 for <b style={{ color: 'var(--ax-text-strong)' }}>inventory</b></p>
                  <span className="ax-timeline__time">Jun 24 · Facilities</span>
                </div>
              </li>
            </ul>
          </div>
        </section>

        {/* Top Performers (4) */}
        <section className="ax-card ax-col--4" role="region" aria-label="Top performers">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <h2 className="ax-card__title">Top Performers</h2>
              <p className="ax-card__subtitle">By GPA · this term</p>
            </div>
          </div>
          <div className="ax-card__body" style={{ paddingTop: 0, display: 'flex', flexDirection: 'column', gap: 'var(--ax-space-4)' }}>
            {PERFORMERS.map((p) => (
              <div key={p.name} className="ax-cluster" style={{ gap: 'var(--ax-space-3)', flexWrap: 'nowrap' }}>
                <span className="ax-avatar ax-avatar--squircle" style={{ background: `color-mix(in oklab,${p.muted ? 'var(--ax-text-subtle)' : p.color} ${p.muted ? 22 : (p.weight === 700 ? 20 : 18)}%,transparent)`, color: p.muted ? 'var(--ax-text-muted)' : p.color, fontWeight: p.weight }}>{p.rank}</span>
                <div style={{ flex: '1 1 auto', minWidth: 0 }}><div style={{ fontWeight: 'var(--ax-weight-medium)', color: 'var(--ax-text-strong)' }}>{p.name}</div><div style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-subtle)' }}>{p.cls}</div></div>
                <div className="ax-num" style={{ fontFamily: 'var(--ax-font-mono)', fontWeight: 600, color: 'var(--ax-text-strong)' }}>{p.gpa}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Recent Admissions (12) */}
        <section className="ax-card ax-col--12" role="region" aria-label="Recent admissions">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <h2 className="ax-card__title">Recent Admissions</h2>
              <p className="ax-card__subtitle">New student enrollments</p>
            </div>
            <a className="ax-btn ax-btn--link" href="#">View all</a>
          </div>
          <div className="ax-table-wrap">
            <table className="ax-table ax-table--hover">
              <thead className="ax-table__head">
                <tr>
                  <th className="ax-table__th" scope="col">Student</th>
                  <th className="ax-table__th" scope="col">Grade</th>
                  <th className="ax-table__th" scope="col">Guardian</th>
                  <th className="ax-table__th" scope="col">Enrolled</th>
                  <th className="ax-table__th" scope="col">Fees</th>
                  <th className="ax-table__th" scope="col">Status</th>
                </tr>
              </thead>
              <tbody>
                {ADMISSIONS.map((a) => (
                  <tr key={a.id} className="ax-table__row">
                    <td className="ax-table__td"><div className="ax-cluster" style={{ gap: 'var(--ax-space-3)', flexWrap: 'nowrap' }}><span className="ax-avatar ax-avatar--sm ax-avatar--squircle" style={{ background: `color-mix(in oklab,${a.color} 18%,transparent)`, color: a.color, fontWeight: 600 }}>{a.initials}</span><div><div style={{ fontWeight: 'var(--ax-weight-medium)', color: 'var(--ax-text-strong)' }}>{a.name}</div><div style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-subtle)' }}>{a.id}</div></div></div></td>
                    <td className="ax-table__td" style={{ color: 'var(--ax-text-muted)' }}>{a.grade}</td>
                    <td className="ax-table__td" style={{ color: 'var(--ax-text-muted)' }}>{a.guardian}</td>
                    <td className="ax-table__td ax-num" style={{ fontFamily: 'var(--ax-font-mono)', color: 'var(--ax-text-muted)' }}>{a.date}</td>
                    <td className="ax-table__td"><span className={`ax-badge ax-badge--soft ax-badge--${a.feesTone} ax-badge--pill`}>{a.fees}</span></td>
                    <td className="ax-table__td"><span className={`ax-badge ax-badge--soft ax-badge--${a.statusTone} ax-badge--pill`}><span className="ax-badge__dot" />{a.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </>
  );
}

export default School;
