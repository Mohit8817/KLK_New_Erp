/*
 * Vireo React — Calendar (apps/calendar).
 * 1:1 re-expression of src/html/apps/calendar.html: mini-month rail + month grid
 * (static cells, mirroring the reference) + agenda fallback + event editor modal.
 * Alpine inline x-data → native React state.
 */
import { useState } from 'react';

interface Editor { id: number | null; title: string; cat: string; start: string; end: string; allday: boolean; repeat: string; location: string; desc: string }
const blankEditor = (date = '2026-06-27'): Editor => ({ id: null, title: '', cat: 'work', start: `${date}T10:00`, end: `${date}T11:00`, allday: false, repeat: 'none', location: '', desc: '' });

interface CalEv { id: number; title: string; cat: string; start: string; end?: string; allday?: boolean }
const evt = (e: Partial<CalEv>): Editor => ({ id: e.id ?? null, title: e.title || '', cat: e.cat || 'work', start: e.start || '', end: e.end || '', allday: e.allday || false, repeat: 'none', location: '', desc: '' });

export function Calendar() {
  const [view, setView] = useState<'month' | 'week' | 'day' | 'list'>('month');
  const [editorOpen, setEditorOpen] = useState(false);
  const [editor, setEditor] = useState<Editor>(blankEditor());

  const openNew = (date?: string) => { setEditor(blankEditor(date)); setEditorOpen(true); };
  const openEdit = (e: Partial<CalEv>) => { setEditor(evt(e)); setEditorOpen(true); };
  const setE = (patch: Partial<Editor>) => setEditor((s) => ({ ...s, ...patch }));

  const Cell = (props: { day: number; date: string; muted?: boolean; today?: boolean; children?: React.ReactNode }) => (
    <button type="button" className={`ax-cal-cell${props.today ? ' ax-cal-cell--today' : ''}`} onClick={() => openNew(props.date)}>
      <span className={`ax-cal-cell__n ax-num${props.muted ? ' ax-cal-cell__n--muted' : ''}${props.today ? ' ax-cal-cell__n--today' : ''}`}>{props.day}</span>
      {props.children}
    </button>
  );
  const Event = (props: { c: string; label: React.ReactNode; ev: Partial<CalEv> }) => (
    <span className="ax-cal-event" style={{ ['--c' as string]: props.c }} onClick={(e) => { e.stopPropagation(); openEdit(props.ev); }}>{props.label}</span>
  );

  return (
    <>
      {/* ════════════════ APP HEAD · status + actions (the app bar names the app) ════════════════ */}
      <div className="ax-apphead">
        <p className="ax-apphead__status">June 2026 — 6 events scheduled this week across your calendars.</p>
        <div className="ax-apphead__actions">
          <button type="button" className="ax-btn ax-btn--secondary ax-btn--pill">
            <svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 7l16 0" /><path d="M10 11l0 6" /><path d="M14 11l0 6" /><path d="M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2 -2l1 -12" /><path d="M9 7v-3a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v3" /></svg>
            <span className="ax-btn__label">Trash</span>
          </button>
          <button type="button" className="ax-btn ax-btn--ghost">
            <svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2 -2v-2" /><path d="M7 11l5 5l5 -5" /><path d="M12 4l0 12" /></svg>
            <span className="ax-btn__label">Export</span>
          </button>
          <button type="button" className="ax-btn ax-btn--primary" onClick={() => openNew()}>
            <svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 5l0 14" /><path d="M5 12l14 0" /></svg>
            <span className="ax-btn__label">New event</span>
          </button>
        </div>
      </div>

      <div className="ax-dash-grid" data-ax-route="apps/calendar">
        <aside className="ax-card ax-col--3" role="region" aria-label="Calendar navigation">
          <div className="ax-card__body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--ax-space-5)' }}>
            <button type="button" className="ax-btn ax-btn--primary ax-btn--block" onClick={() => openNew()}>
              <svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12.5 21h-6.5a2 2 0 0 1 -2 -2v-12a2 2 0 0 1 2 -2h12a2 2 0 0 1 2 2v5" /><path d="M16 3v4" /><path d="M8 3v4" /><path d="M4 11h16" /><path d="M16 19h6" /><path d="M19 16v6" /></svg>
              <span className="ax-btn__label">Create event</span>
            </button>

            <div>
              <div className="ax-cluster" style={{ justifyContent: 'space-between', marginBottom: 'var(--ax-space-3)' }}>
                <b style={{ color: 'var(--ax-text-strong)', fontFamily: 'var(--ax-font-display)', fontSize: 'var(--ax-text-md)' }}>June 2026</b>
                <span className="ax-cluster" style={{ gap: 2 }}>
                  <button type="button" className="ax-btn ax-btn--ghost ax-btn--icon ax-btn--sm" aria-label="Previous month"><svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M15 6l-6 6l6 6" /></svg></button>
                  <button type="button" className="ax-btn ax-btn--ghost ax-btn--icon ax-btn--sm" aria-label="Next month"><svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 6l6 6l-6 6" /></svg></button>
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 2, textAlign: 'center' }}>
                {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => <small key={i} style={{ color: 'var(--ax-text-subtle)', fontSize: 'var(--ax-text-2xs)', fontWeight: 'var(--ax-weight-semibold)', padding: '4px 0' }}>{d}</small>)}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 2, textAlign: 'center' }}>
                {[26, 27, 28, 29, 30, 31].map((n) => <span key={`l${n}`} className="ax-num" style={{ fontFamily: 'var(--ax-font-mono)', fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-subtle)', padding: '5px 0' }}>{n}</span>)}
                {Array.from({ length: 30 }, (_, i) => i + 1).map((n) => (
                  <button key={n} type="button" className="ax-num" onClick={() => openNew(`2026-06-${String(n).padStart(2, '0')}`)}
                    style={{ fontFamily: 'var(--ax-font-mono)', fontSize: 'var(--ax-text-xs)', padding: '5px 0', border: 0, cursor: 'pointer', borderRadius: 'var(--ax-radius-sm)', ...(n === 27 ? { background: 'var(--ax-accent)', color: 'var(--ax-on-accent)', fontWeight: 600 } : [4, 12, 18, 23].includes(n) ? { color: 'var(--ax-text-strong)', background: 'var(--ax-accent-wash)' } : { color: 'var(--ax-text)', background: 'transparent' }) }}>{n}</button>
                ))}
              </div>
            </div>

            <hr className="ax-divider" style={{ margin: 0, border: 0, borderTop: '1px solid var(--ax-border)' }} />

            <div>
              <small style={{ display: 'block', color: 'var(--ax-text-subtle)', fontSize: 'var(--ax-text-2xs)', fontWeight: 'var(--ax-weight-semibold)', letterSpacing: '.04em', textTransform: 'uppercase', marginBottom: 'var(--ax-space-3)' }}>My calendars</small>
              <ul className="ax-list ax-list--compact">
                {[['Work', 'var(--ax-accent)', 12, true], ['Personal', 'var(--ax-viz-cyan)', 5, true], ['Design team', 'var(--ax-viz-violet)', 8, true], ['Holidays', 'var(--ax-viz-amber)', 3, false]].map(([name, color, count, on]) => (
                  <li key={name as string} className="ax-list__row" style={{ border: 0, paddingInline: 0 }}>
                    <span className="ax-list__leading"><input type="checkbox" className="ax-checkbox" defaultChecked={on as boolean} style={name === 'Work' ? { accentColor: 'var(--ax-accent)' } : undefined} /></span>
                    <span className="ax-list__content"><span className="ax-list__title" style={{ fontWeight: 'var(--ax-weight-medium)', display: 'flex', alignItems: 'center', gap: 'var(--ax-space-2)' }}><i style={{ width: 9, height: 9, borderRadius: 3, background: color as string }} />{name}</span></span>
                    <span className="ax-list__trailing ax-num" style={{ fontFamily: 'var(--ax-font-mono)' }}>{count}</span>
                  </li>
                ))}
              </ul>
            </div>

            <hr className="ax-divider" style={{ margin: 0, border: 0, borderTop: '1px solid var(--ax-border)' }} />

            <div>
              <small style={{ display: 'block', color: 'var(--ax-text-subtle)', fontSize: 'var(--ax-text-2xs)', fontWeight: 'var(--ax-weight-semibold)', letterSpacing: '.04em', textTransform: 'uppercase', marginBottom: 'var(--ax-space-3)' }}>Upcoming</small>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--ax-space-3)' }}>
                {[['Sprint planning', 'var(--ax-accent)', 'Today · 10:00 AM'], ['Design critique', 'var(--ax-viz-violet)', 'Today · 2:30 PM'], ['Dentist appointment', 'var(--ax-viz-cyan)', 'Tomorrow · 9:00 AM']].map(([title, color, time]) => (
                  <div key={title} className="ax-cluster" style={{ gap: 'var(--ax-space-3)', flexWrap: 'nowrap', alignItems: 'flex-start' }}>
                    <span style={{ width: 3, alignSelf: 'stretch', borderRadius: 2, background: color, flex: '0 0 auto' }} />
                    <div style={{ minWidth: 0, flex: '1 1 auto' }}>
                      <div className="ax-text-truncate" style={{ fontWeight: 'var(--ax-weight-medium)', color: 'var(--ax-text-strong)', fontSize: 'var(--ax-text-sm)' }}>{title}</div>
                      <div className="ax-num" style={{ fontFamily: 'var(--ax-font-mono)', fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-subtle)' }}>{time}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </aside>

        <section className="ax-card ax-col--9" role="region" aria-label="Month calendar">
          <div className="ax-card__header">
            <div className="ax-cluster" style={{ gap: 'var(--ax-space-3)' }}>
              <span className="ax-cluster" style={{ gap: 2 }}>
                <button type="button" className="ax-btn ax-btn--ghost ax-btn--icon ax-btn--sm" aria-label="Previous period"><svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M15 6l-6 6l6 6" /></svg></button>
                <button type="button" className="ax-btn ax-btn--secondary ax-btn--sm">Today</button>
                <button type="button" className="ax-btn ax-btn--ghost ax-btn--icon ax-btn--sm" aria-label="Next period"><svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 6l6 6l-6 6" /></svg></button>
              </span>
              <h2 className="ax-card__title" style={{ margin: 0 }}>June 2026</h2>
            </div>
            <div className="ax-card__actions">
              <div className="ax-segment" role="radiogroup" aria-label="Calendar view">
                {(['month', 'week', 'day', 'list'] as const).map((v) => (
                  <button key={v} type="button" className={`ax-segment__option${view === v ? ' is-active' : ''}`} role="radio" aria-checked={view === v} onClick={() => setView(v)}>{v.charAt(0).toUpperCase() + v.slice(1)}</button>
                ))}
              </div>
            </div>
          </div>

          {view === 'month' && (
            <div className="ax-card__body" style={{ paddingTop: 0 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,minmax(0,1fr))', border: '1px solid var(--ax-border)', borderRadius: 'var(--ax-radius-md) var(--ax-radius-md) 0 0', overflow: 'hidden' }}>
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d, i) => (
                  <div key={d} style={{ padding: 'var(--ax-space-2) var(--ax-space-3)', fontSize: 'var(--ax-text-2xs)', fontWeight: 'var(--ax-weight-semibold)', letterSpacing: '.04em', textTransform: 'uppercase', color: 'var(--ax-text-subtle)', textAlign: 'center', background: 'var(--ax-surface-subtle)', ...(i < 6 ? { borderInlineEnd: '1px solid var(--ax-border)' } : {}) }}>{d}</div>
                ))}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,minmax(0,1fr))', borderInline: '1px solid var(--ax-border)', borderBlockEnd: '1px solid var(--ax-border)', borderRadius: '0 0 var(--ax-radius-md) var(--ax-radius-md)', overflow: 'hidden' }}>
                {/* Week 1 */}
                <Cell day={26} date="2026-05-26" muted /><Cell day={27} date="2026-05-27" muted /><Cell day={28} date="2026-05-28" muted /><Cell day={29} date="2026-05-29" muted /><Cell day={30} date="2026-05-30" muted /><Cell day={31} date="2026-05-31" muted />
                <Cell day={1} date="2026-06-01"><Event c="var(--ax-accent)" ev={{ id: 1, title: 'Team standup', cat: 'work', start: '2026-06-01T09:30', end: '2026-06-01T09:45' }} label={<><b className="ax-num">09:30</b> Standup</>} /></Cell>
                {/* Week 2 */}
                <Cell day={2} date="2026-06-02"><Event c="var(--ax-viz-violet)" ev={{ id: 2, title: 'Design critique', cat: 'design', start: '2026-06-02T14:30', end: '2026-06-02T15:30' }} label={<><b className="ax-num">14:30</b> Critique</>} /></Cell>
                <Cell day={3} date="2026-06-03" />
                <Cell day={4} date="2026-06-04"><Event c="var(--ax-viz-cyan)" ev={{ id: 3, title: '1:1 with Maya', cat: 'personal', start: '2026-06-04T11:00', end: '2026-06-04T11:30' }} label={<><b className="ax-num">11:00</b> 1:1 Maya</>} /><Event c="var(--ax-accent)" ev={{ id: 4, title: 'Release review', cat: 'work', start: '2026-06-04T16:00', end: '2026-06-04T17:00' }} label={<><b className="ax-num">16:00</b> Release</>} /></Cell>
                <Cell day={5} date="2026-06-05" />
                <Cell day={6} date="2026-06-06"><Event c="var(--ax-viz-amber)" ev={{ id: 5, title: 'Cabin weekend', cat: 'personal', start: '2026-06-06', end: '2026-06-07', allday: true }} label="Cabin trip" /></Cell>
                <Cell day={7} date="2026-06-07" /><Cell day={8} date="2026-06-08" />
                {/* Week 3 */}
                <Cell day={9} date="2026-06-09"><Event c="var(--ax-accent)" ev={{ id: 6, title: 'Roadmap sync', cat: 'work', start: '2026-06-09T10:00', end: '2026-06-09T11:00' }} label={<><b className="ax-num">10:00</b> Roadmap</>} /></Cell>
                <Cell day={10} date="2026-06-10" />
                <Cell day={11} date="2026-06-11"><Event c="var(--ax-viz-violet)" ev={{ id: 7, title: 'Brand workshop', cat: 'design', start: '2026-06-11T13:00', end: '2026-06-11T15:00' }} label={<><b className="ax-num">13:00</b> Workshop</>} /></Cell>
                <Cell day={12} date="2026-06-12"><Event c="var(--ax-accent)" ev={{ id: 8, title: 'All-hands', cat: 'work', start: '2026-06-12T15:00', end: '2026-06-12T16:00' }} label={<><b className="ax-num">15:00</b> All-hands</>} /></Cell>
                <Cell day={13} date="2026-06-13" /><Cell day={14} date="2026-06-14" /><Cell day={15} date="2026-06-15" />
                {/* Week 4 */}
                <Cell day={16} date="2026-06-16"><Event c="var(--ax-viz-cyan)" ev={{ id: 9, title: 'Yearly checkup', cat: 'personal', start: '2026-06-16T09:00', end: '2026-06-16T10:00' }} label={<><b className="ax-num">09:00</b> Checkup</>} /></Cell>
                <Cell day={17} date="2026-06-17" />
                <Cell day={18} date="2026-06-18"><Event c="var(--ax-accent)" ev={{ id: 10, title: 'QA sign-off', cat: 'work', start: '2026-06-18T11:00', end: '2026-06-18T12:00' }} label={<><b className="ax-num">11:00</b> QA sign-off</>} /><Event c="var(--ax-viz-violet)" ev={{ id: 11, title: 'Icon review', cat: 'design', start: '2026-06-18T14:00', end: '2026-06-18T15:00' }} label={<><b className="ax-num">14:00</b> Icons</>} /><span className="ax-cal-more">+2 more</span></Cell>
                <Cell day={19} date="2026-06-19" /><Cell day={20} date="2026-06-20" />
                <Cell day={21} date="2026-06-21"><Event c="var(--ax-viz-amber)" ev={{ id: 12, title: "Father's Day", cat: 'holiday', start: '2026-06-21', allday: true }} label="Father's Day" /></Cell>
                <Cell day={22} date="2026-06-22" />
                {/* Week 5 */}
                <Cell day={23} date="2026-06-23"><Event c="var(--ax-accent)" ev={{ id: 13, title: 'Customer call — Northwind', cat: 'work', start: '2026-06-23T10:30', end: '2026-06-23T11:00' }} label={<><b className="ax-num">10:30</b> Northwind</>} /></Cell>
                <Cell day={24} date="2026-06-24" />
                <Cell day={25} date="2026-06-25"><Event c="var(--ax-viz-violet)" ev={{ id: 14, title: 'Portfolio review', cat: 'design', start: '2026-06-25T15:30', end: '2026-06-25T16:30' }} label={<><b className="ax-num">15:30</b> Portfolio</>} /></Cell>
                <Cell day={26} date="2026-06-26" />
                <button type="button" className="ax-cal-cell ax-cal-cell--today" onClick={() => openNew('2026-06-27')}>
                  <span className="ax-cal-cell__n ax-num ax-cal-cell__n--today">27</span>
                  <span className="ax-cal-now" aria-hidden="true" />
                  <Event c="var(--ax-accent)" ev={{ id: 15, title: 'Sprint planning', cat: 'work', start: '2026-06-27T10:00', end: '2026-06-27T11:00' }} label={<><b className="ax-num">10:00</b> Sprint planning</>} />
                  <Event c="var(--ax-viz-violet)" ev={{ id: 16, title: 'Design critique', cat: 'design', start: '2026-06-27T14:30', end: '2026-06-27T15:30' }} label={<><b className="ax-num">14:30</b> Critique</>} />
                </button>
                <Cell day={28} date="2026-06-28"><Event c="var(--ax-viz-cyan)" ev={{ id: 17, title: 'Dentist', cat: 'personal', start: '2026-06-28T09:00', end: '2026-06-28T09:45' }} label={<><b className="ax-num">09:00</b> Dentist</>} /></Cell>
                <Cell day={29} date="2026-06-29" />
                {/* Week 6 */}
                <Cell day={30} date="2026-06-30"><Event c="var(--ax-accent)" ev={{ id: 18, title: 'Month-end review', cat: 'work', start: '2026-06-30T16:00', end: '2026-06-30T17:00' }} label={<><b className="ax-num">16:00</b> Month-end</>} /></Cell>
                <Cell day={1} date="2026-07-01" muted /><Cell day={2} date="2026-07-02" muted /><Cell day={3} date="2026-07-03" muted /><Cell day={4} date="2026-07-04" muted /><Cell day={5} date="2026-07-05" muted /><Cell day={6} date="2026-07-06" muted />
              </div>
            </div>
          )}

          {view !== 'month' && (
            <div className="ax-card__body" style={{ paddingTop: 0 }}>
              <p className="ax-card__subtitle" style={{ marginBottom: 'var(--ax-space-4)' }}>{view === 'list' ? 'Agenda — upcoming events' : `${view.charAt(0).toUpperCase() + view.slice(1)} view`}</p>
              <ul className="ax-list">
                {[['Sprint planning', 'var(--ax-accent)', 'Work · Conference room B', 'Today · 10:00 AM'], ['Design critique', 'var(--ax-viz-violet)', 'Design team · Figjam', 'Today · 2:30 PM'], ['Dentist appointment', 'var(--ax-viz-cyan)', 'Personal · Bright Smile Clinic', 'Tomorrow · 9:00 AM'], ['Month-end review', 'var(--ax-accent)', 'Work · Zoom', 'Jun 30 · 4:00 PM']].map(([title, color, meta, time]) => (
                  <li key={time} className="ax-list__row">
                    <span className="ax-list__leading"><i style={{ width: 9, height: 9, borderRadius: 3, background: color }} /></span>
                    <span className="ax-list__content"><span className="ax-list__title">{title}</span><span className="ax-list__meta">{meta}</span></span>
                    <span className="ax-list__trailing ax-num" style={{ fontFamily: 'var(--ax-font-mono)', color: 'var(--ax-text)' }}>{time}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      </div>

      {editorOpen && (
        <div className="ax-modal-scrim" onClick={() => setEditorOpen(false)}>
          <div className="ax-card" role="dialog" aria-modal="true" aria-label="Event editor" onClick={(e) => e.stopPropagation()} style={{ width: 'min(520px,100%)', maxHeight: '84vh', overflow: 'auto' }}>
            <div className="ax-card__header">
              <div className="ax-card__titles"><h2 className="ax-card__title">{editor.id ? 'Edit event' : 'New event'}</h2></div>
              <button type="button" className="ax-btn ax-btn--ghost ax-btn--icon ax-btn--sm" aria-label="Close editor" onClick={() => setEditorOpen(false)}><svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M18 6l-12 12" /><path d="M6 6l12 12" /></svg></button>
            </div>
            <form className="ax-card__body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--ax-space-4)' }} onSubmit={(e) => { e.preventDefault(); setEditorOpen(false); }}>
              <div className="ax-field">
                <label className="ax-label" htmlFor="ev-title">Title</label>
                <input id="ev-title" type="text" className="ax-input" value={editor.title} onChange={(e) => setE({ title: e.target.value })} placeholder="Add a title" required />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--ax-space-4)' }}>
                <div className="ax-field">
                  <label className="ax-label" htmlFor="ev-cat">Calendar</label>
                  <select id="ev-cat" className="ax-select" value={editor.cat} onChange={(e) => setE({ cat: e.target.value })}>
                    <option value="work">Work</option><option value="personal">Personal</option><option value="design">Design team</option><option value="holiday">Holidays</option>
                  </select>
                </div>
                <div className="ax-field">
                  <label className="ax-label" htmlFor="ev-repeat">Repeat</label>
                  <select id="ev-repeat" className="ax-select" value={editor.repeat} onChange={(e) => setE({ repeat: e.target.value })}>
                    <option value="none">Does not repeat</option><option value="daily">Daily</option><option value="weekly">Weekly</option><option value="monthly">Monthly</option>
                  </select>
                </div>
              </div>
              <label className="ax-check" style={{ gap: 'var(--ax-space-3)' }}>
                <input type="checkbox" className="ax-switch" checked={editor.allday} onChange={(e) => setE({ allday: e.target.checked })} />
                <span style={{ color: 'var(--ax-text)', fontSize: 'var(--ax-text-sm)' }}>All-day event</span>
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--ax-space-4)' }}>
                <div className="ax-field"><label className="ax-label" htmlFor="ev-start">Starts</label><input id="ev-start" type="datetime-local" className="ax-input ax-num" style={{ fontFamily: 'var(--ax-font-mono)' }} value={editor.start} onChange={(e) => setE({ start: e.target.value })} /></div>
                <div className="ax-field"><label className="ax-label" htmlFor="ev-end">Ends</label><input id="ev-end" type="datetime-local" className="ax-input ax-num" style={{ fontFamily: 'var(--ax-font-mono)' }} value={editor.end} onChange={(e) => setE({ end: e.target.value })} /></div>
              </div>
              <div className="ax-field"><label className="ax-label" htmlFor="ev-loc">Location</label><input id="ev-loc" type="text" className="ax-input" value={editor.location} onChange={(e) => setE({ location: e.target.value })} placeholder="Add a location or video link" /></div>
              <div className="ax-field"><label className="ax-label" htmlFor="ev-desc">Description</label><textarea id="ev-desc" className="ax-textarea" rows={3} value={editor.desc} onChange={(e) => setE({ desc: e.target.value })} placeholder="Add notes, agenda or links" /></div>
              <div className="ax-cluster" style={{ justifyContent: 'space-between', marginTop: 'var(--ax-space-2)' }}>
                {editor.id && <button type="button" className="ax-btn ax-btn--ghost" onClick={() => setEditorOpen(false)} style={{ color: 'var(--ax-danger-500)' }}>
                  <svg className="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 7l16 0" /><path d="M10 11l0 6" /><path d="M14 11l0 6" /><path d="M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2 -2l1 -12" /><path d="M9 7v-3a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v3" /></svg>
                  <span className="ax-btn__label">Delete</span>
                </button>}
                <span style={{ flex: '1 1 auto' }} />
                <button type="button" className="ax-btn ax-btn--secondary" onClick={() => setEditorOpen(false)}>Cancel</button>
                <button type="submit" className="ax-btn ax-btn--primary">Save event</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .ax-modal-scrim { position:fixed; inset:0; z-index:120; display:flex; align-items:flex-start; justify-content:center; padding:8vh var(--ax-space-5); background:var(--ax-backdrop); -webkit-backdrop-filter:blur(2px); backdrop-filter:blur(2px); }
        [data-ax-route="apps/calendar"] .ax-cal-cell { position:relative; display:flex; flex-direction:column; gap:3px; align-items:stretch; text-align:left; min-height:104px; padding:var(--ax-space-2); background:var(--ax-surface-solid); border:0; border-inline-end:1px solid var(--ax-border); border-block-start:1px solid var(--ax-border); cursor:pointer; transition:background var(--ax-motion-instant) var(--ax-ease-standard); }
        [data-ax-route="apps/calendar"] .ax-cal-cell:nth-child(7n) { border-inline-end:0; }
        [data-ax-route="apps/calendar"] .ax-cal-cell:hover { background:var(--ax-fill-hover); }
        [data-ax-route="apps/calendar"] .ax-cal-cell--today { background:var(--ax-accent-wash); }
        [data-ax-route="apps/calendar"] .ax-cal-cell__n { align-self:flex-start; font-family:var(--ax-font-mono); font-size:var(--ax-text-xs); color:var(--ax-text-strong); padding:1px 2px; }
        [data-ax-route="apps/calendar"] .ax-cal-cell__n--muted { color:var(--ax-text-subtle); }
        [data-ax-route="apps/calendar"] .ax-cal-cell__n--today { display:inline-flex; align-items:center; justify-content:center; min-width:22px; height:22px; border-radius:var(--ax-radius-pill); background:var(--ax-accent); color:var(--ax-on-accent); font-weight:600; }
        [data-ax-route="apps/calendar"] .ax-cal-now { position:absolute; inset-inline:0; top:38px; height:2px; background:var(--ax-accent); }
        [data-ax-route="apps/calendar"] .ax-cal-now::before { content:""; position:absolute; inset-inline-start:0; top:-3px; width:8px; height:8px; border-radius:50%; background:var(--ax-accent); }
        [data-ax-route="apps/calendar"] .ax-cal-event { display:block; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; padding:2px 7px; font-size:var(--ax-text-xs); color:var(--ax-text-strong); border-radius:var(--ax-radius-sm); background:color-mix(in oklab, var(--c) 16%, transparent); border-inline-start:3px solid var(--c); cursor:pointer; }
        [data-ax-route="apps/calendar"] .ax-cal-event b { font-family:var(--ax-font-mono); font-weight:600; color:var(--c); margin-inline-end:3px; }
        [data-ax-route="apps/calendar"] .ax-cal-event:hover { background:color-mix(in oklab, var(--c) 26%, transparent); }
        [data-ax-route="apps/calendar"] .ax-cal-more { font-size:var(--ax-text-2xs); color:var(--ax-text-muted); padding:1px 7px; font-weight:var(--ax-weight-medium); }
        @media (max-width:768px){ [data-ax-route="apps/calendar"] .ax-cal-cell { min-height:74px; } }
      `}</style>
    </>
  );
}

export default Calendar;
