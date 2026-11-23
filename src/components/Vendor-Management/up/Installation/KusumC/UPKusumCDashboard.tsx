import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { upKusumCAdminService, type UpKusumCDashboardData } from '../../up-services';
import {
  UPDashboardTemplate,
  dashNum,
  dashPct,
  type NormalizedUpTotals,
  type NormalizedDistrictRow,
  type NormalizedVendorRow,
} from '../UPDashboardTemplate';
import { fmtCurrency } from '../upInstallationShared';

const BLANK_DISTRICT_LABEL = 'Unassigned / Blank';

function mapKusumCStatus(key: string): string {
  const m: Record<string, string> = {
    total: 'total',
    assigned: 'assign',
    'not-assigned': 'not-assign',
    'acceptance-pending': 'acceptance-pending',
    complete: 'installed',
    pending: 'pending-installed',
    'verify-approved': 'verify',
    'verify-pending': 'verify-pending',
    'verify-reject': 'verify-reject',
    'claim-applicable': 'claim-applicable',
    'claim-raised': 'claim-raised',
    'claim-approved': 'claim-approved',
    'claim-pending': 'claim-pending',
    'claim-reject': 'claim-reject',
    'pay-complete': 'pay-done',
    'pay-partially': 'pay-partially',
    'pay-pending': 'pay-pending',
  };
  return m[key] || key;
}

export function UPKusumCDashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState<UpKusumCDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setApiError(null);
    try {
      const res = await upKusumCAdminService.getDashboard();
      setData(res);
      setUpdatedAt(new Date());
    } catch (err: any) {
      setApiError(err?.message || 'Failed to fetch UP Kusum C dashboard data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const totals: NormalizedUpTotals = useMemo(() => {
    const k = data?.kusumc;
    const totalSites = Number(k?.site_count ?? k?.total_site ?? 0);
    const siteAssigned = Number(k?.site_assigned ?? 0);
    const acceptPending = Number(k?.accept_pending ?? 0);
    const notAssigned = Number(k?.site_not_assigned ?? Math.max(0, totalSites - siteAssigned - acceptPending));
    const claimReject = (data?.districtwise || []).reduce((s, d) => s + (Number(d.claim_reject) || 0), 0);

    return {
      total: totalSites,
      assigned: siteAssigned,
      accepted: siteAssigned,
      not_assigned: notAssigned,
      complete: Number(k?.complete ?? 0),
      pending: Number(k?.pending ?? 0),
      verify_approved: Number(k?.verify_approved ?? 0),
      verify_pending: Number(k?.verify_pending ?? 0),
      verify_reject: Number(k?.verify_reject ?? 0),
      claim_applicable: Number(k?.claim_applicable ?? 0),
      claim_raised: Number(k?.claim_raised ?? 0),
      claim_approved: Number(k?.claim_approved ?? 0),
      claim_pending: Number(k?.claim_pending ?? 0),
      claim_reject: claimReject,
      pay_complete: Number(k?.inst_pay_done ?? 0),
      pay_partially: Number(k?.inst_pay_partially ?? 0),
      pay_pending: Number(k?.inst_pay_pending ?? 0),
    };
  }, [data]);

  const districts: NormalizedDistrictRow[] = useMemo(
    () =>
      (data?.districtwise || []).map((d) => ({
        district: (d.f_district || '').trim() || BLANK_DISTRICT_LABEL,
        total: Number(d.total || 0),
        assigned: Number(d.total_assigned || 0),
        not_assigned: Math.max(0, Number(d.total || 0) - Number(d.total_assigned || 0)),
        complete: Number(d.inst_complete || 0),
        pending: Number(d.inst_pending || 0),
        verify_approved: Number(d.verify_approved || 0),
        verify_pending: Number(d.verify_pending || 0),
        verify_reject: Number(d.verify_reject || 0),
        claim_raised: Number(d.claim_raised || 0),
        claim_approved: Number(d.claim_approved || 0),
        claim_reject: Number(d.claim_reject || 0),
        pay_complete: Number(d.payment_done || 0),
        pay_partially: Number(d.payment_partially || 0),
        pay_pending: Number(d.payment_pending || 0),
      })),
    [data?.districtwise]
  );

  const vendors: NormalizedVendorRow[] = useMemo(() => {
    const nameMap = new Map<number, string>();
    (data?.vendors || []).forEach((v) => {
      const id = Number(v.inst_vendor);
      if (!isNaN(id)) nameMap.set(id, v.name || `Vendor #${id}`);
    });
    const todayMap = new Map<number, number>();
    (data?.vendor_today_installation || []).forEach((t) => {
      const id = Number(t.inst_vendor);
      if (!isNaN(id)) todayMap.set(id, Number(t.today_install) || 0);
    });

    const rowMap = new Map<number, NormalizedVendorRow>();
    (data?.vendorswise || []).forEach((v) => {
      const id = Number(v.inst_vendor);
      rowMap.set(id, {
        vendor_id: id,
        vendor_name: nameMap.get(id) || `Vendor #${id}`,
        today_install: todayMap.get(id) || 0,
        site_count: Number(v.site_count || 0),
        complete: Number(v.inst_complete || 0),
        pending: Number(v.inst_pending || 0),
        verify_approved: Number(v.verify_approved || 0),
        verify_pending: Number(v.verify_pending || 0),
        verify_reject: Number(v.verify_reject || 0),
        claim_raised: Number(v.claim_raised || 0),
        claim_approved: Number(v.claim_approved || 0),
        claim_reject: Number(v.claim_reject || 0),
        pay_complete: Number(v.payment_done || 0),
        pay_partially: Number(v.payment_partially || 0),
        pay_pending: Number(v.payment_pending || 0),
      });
    });

    // Include vendors present in `vendors` or `vendor_today_installation` with zeroed installation stats if not in `vendorswise`
    (data?.vendors || []).forEach((v) => {
      const id = Number(v.inst_vendor);
      if (!isNaN(id) && !rowMap.has(id)) {
        rowMap.set(id, {
          vendor_id: id,
          vendor_name: v.name || `Vendor #${id}`,
          today_install: todayMap.get(id) || 0,
          site_count: 0,
          complete: 0,
          pending: 0,
          verify_approved: 0,
          verify_pending: 0,
          verify_reject: 0,
          claim_raised: 0,
          claim_approved: 0,
          claim_reject: 0,
          pay_complete: 0,
          pay_partially: 0,
          pay_pending: 0,
        });
      }
    });

    return Array.from(rowMap.values());
  }, [data]);

  const sortedMonthly = useMemo(() => {
    return [...(data?.vendor_installation_month || [])].sort((a, b) =>
      String(a.month_year || '').localeCompare(String(b.month_year || ''))
    );
  }, [data?.vendor_installation_month]);

  const handleDrillDown = useCallback(
    (statusKey: string, extra?: { district?: string; vendor?: string | number; phase?: string | number }) => {
      const mapped = mapKusumCStatus(statusKey);
      const params = new URLSearchParams({ status: mapped });
      if (extra?.vendor !== undefined) {
        params.set('mode', 'vendor');
        params.set('value', String(extra.vendor));
      } else if (extra?.district && extra.district !== BLANK_DISTRICT_LABEL) {
        params.set('mode', 'district');
        params.set('value', extra.district);
      } else if (extra?.phase !== undefined) {
        params.set('mode', 'phase');
        params.set('value', String(extra.phase));
      }
      navigate(`/vendor-management/up/kusumc/installation/status-view?${params.toString()}`);
    },
    [navigate]
  );

  const acceptPendingCount = Number(data?.kusumc?.accept_pending ?? 0);

  const phaseSection = (data?.phasewise || []).length > 0 && (
    <section className="ax-card ax-col--12" role="region" aria-label="Phase Wise Performance">
      <div className="ax-card__header">
        <div className="ax-card__titles">
          <span className="ax-card__eyebrow">Scheme Phases</span>
          <h2 className="ax-card__title">Phase-Wise Kusum C Performance</h2>
          <p className="ax-card__subtitle">
            Click any phase row or count to inspect phase-specific installation sites
            {acceptPendingCount > 0 ? ` · Acceptance Pending: ${dashNum(acceptPendingCount)}` : ''}
          </p>
        </div>
        {acceptPendingCount > 0 && (
          <div className="ax-card__actions">
            <button
              type="button"
              className="ax-btn ax-btn--secondary ax-btn--sm"
              onClick={() => handleDrillDown('acceptance-pending')}
            >
              Acceptance Pending ({dashNum(acceptPendingCount)})
            </button>
          </div>
        )}
      </div>
      <div className="ax-table-wrap">
        <table className="ax-table ax-table--hover" style={{ minWidth: 1350, whiteSpace: 'nowrap' }}>
          <thead className="ax-table__head">
            <tr>
              <th className="ax-table__th">Phase</th>
              <th className="ax-table__th ax-table__th--num">Total</th>
              <th className="ax-table__th ax-table__th--num">Assigned</th>
              <th className="ax-table__th ax-table__th--num">Installed</th>
              <th className="ax-table__th ax-table__th--num">Pending</th>
              <th className="ax-table__th ax-table__th--num">Verify Approved</th>
              <th className="ax-table__th ax-table__th--num">Verify Pending</th>
              <th className="ax-table__th ax-table__th--num">Verify Reject</th>
              <th className="ax-table__th ax-table__th--num">Claims Raised</th>
              <th className="ax-table__th ax-table__th--num">Claim Approved</th>
              <th className="ax-table__th ax-table__th--num">Pay Done</th>
              <th className="ax-table__th ax-table__th--num">Pay Partial</th>
              <th className="ax-table__th ax-table__th--num">Pay Pending</th>
              <th className="ax-table__th" style={{ width: 140 }}>Progress</th>
            </tr>
          </thead>
          <tbody>
            {(data?.phasewise || []).map((p) => {
              const pct = dashPct(p.inst_complete, p.total);
              return (
                <tr
                  key={String(p.phase)}
                  className="ax-table__row"
                  onClick={() => handleDrillDown('total', { phase: p.phase })}
                  style={{ cursor: 'pointer' }}
                >
                  <td className="ax-table__td" style={{ fontWeight: 700 }}>Phase {p.phase}</td>
                  <td className="ax-table__td ax-table__td--num ax-num">{dashNum(p.total)}</td>
                  <td
                    className="ax-table__td ax-table__td--num ax-num"
                    style={{ color: '#0891b2' }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDrillDown('assigned', { phase: p.phase });
                    }}
                  >
                    {dashNum(p.total_assigned)}
                  </td>
                  <td
                    className="ax-table__td ax-table__td--num ax-num"
                    style={{ color: '#10b981', fontWeight: 600 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDrillDown('complete', { phase: p.phase });
                    }}
                  >
                    {dashNum(p.inst_complete)}
                  </td>
                  <td
                    className="ax-table__td ax-table__td--num ax-num"
                    style={{ color: '#f59e0b' }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDrillDown('pending', { phase: p.phase });
                    }}
                  >
                    {dashNum(p.inst_pending)}
                  </td>
                  <td
                    className="ax-table__td ax-table__td--num ax-num"
                    style={{ color: '#0891b2' }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDrillDown('verify-approved', { phase: p.phase });
                    }}
                  >
                    {dashNum(p.verify_approved)}
                  </td>
                  <td
                    className="ax-table__td ax-table__td--num ax-num"
                    style={{ color: '#f59e0b' }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDrillDown('verify-pending', { phase: p.phase });
                    }}
                  >
                    {dashNum(p.verify_pending)}
                  </td>
                  <td
                    className="ax-table__td ax-table__td--num ax-num"
                    style={{ color: '#ef4444' }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDrillDown('verify-reject', { phase: p.phase });
                    }}
                  >
                    {dashNum(p.verify_reject)}
                  </td>
                  <td className="ax-table__td ax-table__td--num ax-num" style={{ color: '#2563eb' }}>{dashNum(p.claim_raised)}</td>
                  <td className="ax-table__td ax-table__td--num ax-num" style={{ color: '#10b981' }}>{dashNum(p.claim_approved)}</td>
                  <td className="ax-table__td ax-table__td--num ax-num" style={{ color: '#10b981' }}>{dashNum(p.payment_done)}</td>
                  <td className="ax-table__td ax-table__td--num ax-num" style={{ color: '#0891b2' }}>{dashNum(p.payment_partially)}</td>
                  <td className="ax-table__td ax-table__td--num ax-num" style={{ color: '#f59e0b' }}>{dashNum(p.payment_pending)}</td>
                  <td className="ax-table__td">
                    <div className="ax-cluster" style={{ gap: 'var(--ax-space-2)', flexWrap: 'nowrap', alignItems: 'center' }}>
                      <div className="ax-progress ax-progress--sm" style={{ minWidth: 60, width: 60 }}>
                        <div className="ax-progress__track">
                          <div className="ax-progress__fill" style={{ width: `${pct}%`, background: pct >= 90 ? '#10b981' : '#2563eb' }} />
                        </div>
                      </div>
                      <span className="ax-num" style={{ fontSize: 'var(--ax-text-xs)', color: 'var(--ax-text-muted)', minWidth: 36 }}>{pct}%</span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );

  return (
    <UPDashboardTemplate
      pageTitle="UP Kusum-C Installation Dashboard"
      pageSubtitle="Uttar Pradesh Kusum C Installation Operations, District, Vendor & Phase Analytics"
      moduleName="Kusum C"
      programEyebrow="Uttar Pradesh Kusum C Solar Pump Program"
      welcomeHeading="Welcome to UP Kusum-C Operations Dashboard"
      unitLabel="Sites"
      unitShort="Kusum C solar pump sites"
      fileBase="UP_KusumC"
      updatedAt={updatedAt}
      loading={loading}
      apiError={apiError}
      totals={totals}
      districts={districts}
      vendors={vendors}
      monthly={sortedMonthly}
      extraWelcomeStat={{
        label: 'Payment Disbursed',
        value: fmtCurrency(data?.payment_amount || 0),
        sub: `Claimed: ${fmtCurrency(data?.claim_amount || 0)} · Accept Pending: ${dashNum(acceptPendingCount)}`,
        color: '#7c3aed',
      }}
      routes={{
        statusRegister: '/vendor-management/up/kusumc/installation/status-view?status=total',
        assign: '/vendor-management/up/kusumc/installation/assign',
        viewAssign: '/vendor-management/up/kusumc/installation/view-assign',
        verify: '/vendor-management/up/kusumc/installation/verify',
        viewClaim: '/vendor-management/up/kusumc/installation/verify-claim',
        viewPayment: '/vendor-management/up/kusumc/installation/view-payment',
      }}
      onDrillDown={handleDrillDown}
      extraBottomSection={phaseSection}
    />
  );
}

export default UPKusumCDashboard;
