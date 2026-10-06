import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHead } from '../../../../shell/PageHead';
import {
  dleService,
  extractList,
  filterByCompany,
  filterApproved,
} from '../../../../../services/dleServices';
import {
  upSslAmc,
  toArray,
  toOptions,
  type Option,
} from '../../../../../services/Sslamcservice';

const FLOAT_CSS = `
.ax-float{position:relative}
.ax-float__input::placeholder{color:transparent}
.ax-float__label{
  position:absolute;
  inset-inline-start:var(--ax-space-3);
  top:50%;
  transform:translateY(-50%);
  margin:0;
  padding-inline:4px;
  font-size:var(--ax-text-sm);
  color:var(--ax-text-subtle);
  background:var(--ax-surface-solid);
  border-radius:var(--ax-radius-xs);
  pointer-events:none;
  transition:
    top var(--ax-motion-fast) var(--ax-ease-standard),
    font-size var(--ax-motion-fast) var(--ax-ease-standard),
    color var(--ax-motion-fast) var(--ax-ease-standard)
}

.ax-float--area .ax-float__label{
  top:calc(var(--ax-space-3) + 9px);
  transform:none
}

.ax-float__input:focus+.ax-float__label,
.ax-float__input:not(:placeholder-shown)+.ax-float__label,
.ax-float--select .ax-float__label,
.ax-float--area .ax-float__input:focus+.ax-float__label,
.ax-float--area .ax-float__input:not(:placeholder-shown)+.ax-float__label{
  top:0;
  font-size:var(--ax-text-2xs);
  color:var(--ax-text-muted)
}

.ax-float__input:focus+.ax-float__label{
  color:var(--ax-accent)
}

.ax-float__input.is-invalid+.ax-float__label{
  color:var(--ax-danger-500)
}

@media (prefers-reduced-motion:reduce){
  .ax-float__label{
    transition:none
  }
}
`;

/** Sirf Uttar Pradesh ke districts rakhta hai (agar API me state info ho). */
const isUpState = (v: any): boolean => {
  const s = String(v ?? '').trim().toLowerCase();
  return s === 'uttar pradesh' || s === 'up';
};

const filterUpDistricts = (list: any[]): any[] => {
  const hasStateInfo = list.some(
    (d: any) => d?.state ?? d?.state_name
  );

  // API me state field nahi hai -> API already UP ke hi districts de rahi hai
  if (!hasStateInfo) return list;

  return list.filter((d: any) =>
    isUpState(d?.state ?? d?.state_name)
  );
};

export function UPAMCSSLAssignLights() {
  const navigate = useNavigate();

  const [users, setUsers] = useState<Option[]>([]);
  const [districts, setDistricts] = useState<Option[]>([]);
  const [blocks, setBlocks] = useState<Option[]>([]);
  const [panchayats, setPanchayats] = useState<Option[]>([]);

  const [f, setF] = useState({
    user_id: '',
    district_id: '',
    block_id: '',
    panchayat_id: '',
    light_count: '',
    remarks: '',
  });

  const [errors, setErrors] =
    useState<Record<string, string>>({});

  const [busy, setBusy] = useState(false);

  const [alert, setAlert] = useState<{
    type: 'success' | 'danger';
    msg: string;
  } | null>(null);

  const set = (
    k: keyof typeof f,
    v: string
  ) => {
    setF((s) => ({
      ...s,
      [k]: v,
    }));
  };

  /* ─────────────────────────────────────────────
     Load ONLY Uttar Pradesh DLE Users
     ───────────────────────────────────────────── */

  useEffect(() => {
    const ac = new AbortController();

    dleService
      .getAdminUsers(ac.signal)
      .then((j: any) => {
        const approvedUsers = filterApproved(
          filterByCompany(extractList(j))
        );

<<<<<<< HEAD
        const upUsers = approvedUsers.filter((u: any) => {
          const state = String(u?.state ?? '').trim().toLowerCase();
          return state === 'uttar pradesh' || state === 'up';
        });
=======
        const upUsers = approvedUsers.filter((u: any) =>
          isUpState(u?.state)
        );
>>>>>>> origin/harshklk

        setUsers(toOptions(upUsers));

        if (!upUsers.length) {
          setAlert({
            type: 'danger',
            msg: 'No approved DLE users found for your company.',
          });
        }
      })
      .catch((err: any) => {
        if (err?.name !== 'AbortError') {
          console.error('Failed to load UP DLE users:', err);
          setAlert({
            type: 'danger',
            msg: err?.message || 'Unable to load DLE users.',
          });
        }
      });

<<<<<<< HEAD
    upSslAmc
      .getDistricts(ac.signal)
      .then((j) => setDistricts(toOptions(j)))
      .catch((err: any) => {
        if (err?.name !== 'AbortError') {
          console.error('Failed to load UP districts:', err);
        }
=======
    return () => ac.abort();
  }, []);

  /* ─────────────────────────────────────────────
     Load Districts (klkerp.com /district API)
     ───────────────────────────────────────────── */

  useEffect(() => {
    const ac = new AbortController();

    upSslAmc
      .getDistricts(ac.signal)
      .then((j: any) => {
        const list = filterUpDistricts(toArray(j));

        setDistricts(toOptions(list));

        if (!list.length) {
          setAlert({
            type: 'danger',
            msg: 'No districts found.',
          });
        }
      })
      .catch((e: any) => {
        if (e?.name === 'AbortError') return;

        console.error('Failed to load districts:', e);

        setAlert({
          type: 'danger',
          msg: e?.message || 'Unable to load districts.',
        });
>>>>>>> origin/harshklk
      });

    return () => ac.abort();
  }, []);

  /* ─────────────────────────────────────────────
     District
     ───────────────────────────────────────────── */

  const onDistrict = (v: string) => {
    setF((s) => ({
      ...s,
      district_id: v,
      block_id: '',
      panchayat_id: '',
    }));

    setBlocks([]);
    setPanchayats([]);

    if (!v) return;

    upSslAmc
      .getBlocks(v)
      .then((j) =>
        setBlocks(toOptions(j))
      )
      .catch((e: any) => {
        if (e?.name !== 'AbortError') {
          setAlert({
            type: 'danger',
            msg: e.message,
          });
        }
      });
  };

  /* ─────────────────────────────────────────────
     Block
     ───────────────────────────────────────────── */

  const onBlock = (v: string) => {
    setF((s) => ({
      ...s,
      block_id: v,
      panchayat_id: '',
    }));

    setPanchayats([]);

    if (!v) return;

    upSslAmc
      .getPanchayats(
        v,
        f.district_id
      )
      .then((j) =>
        setPanchayats(toOptions(j))
      )
      .catch((e: any) => {
        if (e?.name !== 'AbortError') {
          setAlert({
            type: 'danger',
            msg: e.message,
          });
        }
      });
  };

  /* ─────────────────────────────────────────────
     Submit
     ───────────────────────────────────────────── */

  const submit = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    const er: Record<string, string> = {};

    if (!f.user_id) {
      er.user_id = 'Select a user.';
    }

    if (!f.district_id) {
      er.district_id = 'Select a district.';
    }

    if (!f.block_id) {
      er.block_id = 'Select a block.';
    }

    if (!f.panchayat_id) {
      er.panchayat_id =
        'Select a panchayat.';
    }

    if (
      !f.light_count ||
      Number(f.light_count) < 1
    ) {
      er.light_count =
        'Enter light count.';
    }

    setErrors(er);

    if (Object.keys(er).length) {
      return;
    }

    setBusy(true);
    setAlert(null);

    try {
      const res =
        await upSslAmc.storeAssignLight({
          ...f,
          district: f.district_id,
          block: f.block_id,
          panchayat: f.panchayat_id,
        });

      setAlert({
        type: 'success',
        msg:
          res?.message ||
          'Assigned successfully.',
      });

      setF({
        user_id: '',
        district_id: '',
        block_id: '',
        panchayat_id: '',
        light_count: '',
        remarks: '',
      });

      setBlocks([]);
      setPanchayats([]);
      setErrors({});
    } catch (err: any) {
      setAlert({
        type: 'danger',
        msg:
          err?.message ||
          'Something went wrong.',
      });
    } finally {
      setBusy(false);
    }
  };

  const cls = (k: string) =>
    `ax-input ax-float__input${
      errors[k] ? ' is-invalid' : ''
    }`;

  const scls = (k: string) =>
    `ax-select ax-float__input${
      errors[k] ? ' is-invalid' : ''
    }`;

  const err = (k: string) =>
    errors[k] && (
      <span
        className="ax-field__message ax-field__message--error"
        role="alert"
        style={{
          display: 'block',
          marginTop:
            'var(--ax-space-2)',
        }}
      >
        {errors[k]}
      </span>
    );

  return (
    <>
      <style>{FLOAT_CSS}</style>

      <PageHead
        title="Assign UP SSL AMC Lights"
        subtitle="Assign SSL AMC lights to a DLE user by district, block and panchayat."
      />

      <div className="ax-dash-grid">

        {alert && (
          <div className="ax-col--12">
            <div
              className={`ax-alert ax-alert--${alert.type}`}
              role="status"
            >
              <div className="ax-alert__content">
                <p className="ax-alert__message">
                  {alert.msg}
                </p>
              </div>
            </div>
          </div>
        )}

        <section
          className="ax-card ax-col--12 ax-card--accent-edge"
          role="region"
          aria-label="Assign UP SSL AMC lights"
        >

          <div className="ax-card__header">
            <div className="ax-card__titles">
              <span className="ax-card__eyebrow">
                Uttar Pradesh
              </span>

              <p className="ax-card__subtitle">
                All fields except remarks are
                required.
              </p>
            </div>
          </div>

          <form
            onSubmit={submit}
            noValidate
          >
            <div className="ax-card__body">

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns:
                    'repeat(2,minmax(0,1fr))',
                  gap: 'var(--ax-space-6)',
                }}
              >

                {/* DLE USER */}

                <div>
                  <div className="ax-float ax-float--select">

                    <select
                      id="up-user"
                      className={scls(
                        'user_id'
                      )}
                      value={f.user_id}
                      onChange={(e) =>
                        set(
                          'user_id',
                          e.target.value
                        )
                      }
                    >
                      <option value="">
                        {' '}
                      </option>

                      {users.map((o) => (
                        <option
                          key={o.value}
                          value={o.value}
                        >
                          {o.label}
                        </option>
                      ))}
                    </select>

                    <label
                      className="ax-float__label"
                      htmlFor="up-user"
                    >
                      DLE user *
                    </label>

                  </div>

                  {err('user_id')}
                </div>

                {/* DISTRICT */}

                <div>
                  <div className="ax-float ax-float--select">

                    <select
                      id="up-district"
                      className={scls(
                        'district_id'
                      )}
                      value={f.district_id}
                      onChange={(e) =>
                        onDistrict(
                          e.target.value
                        )
                      }
                    >
                      <option value="">
                        {' '}
                      </option>

                      {districts.map((o) => (
                        <option
                          key={o.value}
                          value={o.value}
                        >
                          {o.label}
                        </option>
                      ))}
                    </select>

                    <label
                      className="ax-float__label"
                      htmlFor="up-district"
                    >
                      District *
                    </label>

                  </div>

                  {err('district_id')}
                </div>

                {/* BLOCK */}

                <div>
                  <div className="ax-float ax-float--select">

                    <select
                      id="up-block"
                      className={scls(
                        'block_id'
                      )}
                      value={f.block_id}
                      onChange={(e) =>
                        onBlock(
                          e.target.value
                        )
                      }
                      disabled={
                        !f.district_id
                      }
                    >
                      <option value="">
                        {' '}
                      </option>

                      {blocks.map((o) => (
                        <option
                          key={o.value}
                          value={o.value}
                        >
                          {o.label}
                        </option>
                      ))}
                    </select>

                    <label
                      className="ax-float__label"
                      htmlFor="up-block"
                    >
                      Block *
                    </label>

                  </div>

                  {err('block_id')}
                </div>

                {/* PANCHAYAT */}

                <div>
                  <div className="ax-float ax-float--select">

                    <select
                      id="up-pan"
                      className={scls(
                        'panchayat_id'
                      )}
                      value={
                        f.panchayat_id
                      }
                      onChange={(e) =>
                        set(
                          'panchayat_id',
                          e.target.value
                        )
                      }
                      disabled={
                        !f.block_id
                      }
                    >
                      <option value="">
                        {' '}
                      </option>

                      {panchayats.map(
                        (o) => (
                          <option
                            key={o.value}
                            value={o.value}
                          >
                            {o.label}
                          </option>
                        )
                      )}
                    </select>

                    <label
                      className="ax-float__label"
                      htmlFor="up-pan"
                    >
                      Panchayat *
                    </label>

                  </div>

                  {err(
                    'panchayat_id'
                  )}
                </div>

                {/* LIGHT COUNT */}

                <div>
                  <div className="ax-float">

                    <input
                      id="up-count"
                      type="number"
                      min="1"
                      className={cls(
                        'light_count'
                      )}
                      placeholder=" "
                      value={
                        f.light_count
                      }
                      onChange={(e) =>
                        set(
                          'light_count',
                          e.target.value
                        )
                      }
                    />

                    <label
                      className="ax-float__label"
                      htmlFor="up-count"
                    >
                      Light count *
                    </label>

                  </div>

                  {err(
                    'light_count'
                  )}
                </div>

                {/* REMARKS */}

                <div
                  style={{
                    gridColumn: 'span 2',
                  }}
                >
                  <div className="ax-float ax-float--area">

                    <textarea
                      id="up-remarks"
                      className="ax-textarea ax-float__input"
                      rows={3}
                      placeholder=" "
                      value={f.remarks}
                      onChange={(e) =>
                        set(
                          'remarks',
                          e.target.value
                        )
                      }
                    />

                    <label
                      className="ax-float__label"
                      htmlFor="up-remarks"
                    >
                      Remarks
                    </label>

                  </div>
                </div>

              </div>
            </div>

            <div
              className="ax-card__footer"
              style={{
                display: 'flex',
                justifyContent:
                  'space-between',
                gap: 'var(--ax-space-3)',
              }}
            >

              <button
                type="submit"
                className="ax-btn ax-btn--primary ax-btn--pill"
                disabled={busy}
              >
                <span className="ax-btn__label">
                  {busy
                    ? 'Submitting…'
                    : 'Submit'}
                </span>
              </button>

              <button
                type="button"
                className="ax-btn ax-btn--secondary ax-btn--pill"
                onClick={() =>
                  navigate(-1)
                }
              >
                <span className="ax-btn__label">
                  Cancel
                </span>
              </button>

            </div>
          </form>
        </section>
      </div>
    </>
  );
}

export default UPAMCSSLAssignLights;