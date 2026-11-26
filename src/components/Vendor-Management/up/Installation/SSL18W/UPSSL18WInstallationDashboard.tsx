import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { upSsl18wAdminService, type UpSsl18wDashboardData } from '../../up-services';
import {
  UPDashboardTemplate,
  dashNum,
  type NormalizedUpTotals,
  type NormalizedDistrictRow,
  type NormalizedVendorRow,
} from '../UPDashboardTemplate';

const BLANK_DISTRICT_LABEL = 'Unassigned / Blank';

function mapSsl18wStatus(key: string): string {
  const m: Record<string, string> = {
    total: 'total',
    assigned: 'assigned',
    accept: 'accept',
    'not-assigned': 'not-assigned',
    complete: 'complete',
    pending: 'pending',
    'verify-approved': 'verify-approved',
    'verify-pending': 'verify-pending',
    'verify-reject': 'verify-reject',
    'claim-applicable': 'claim-applicable',
    'claim-not-applicable': 'claim-not-applicable',
    'claim-raised': 'claim-raised',
    'claim-approved': 'claim-verify-approved',
    'claim-pending': 'claim-verify-pending',
    'claim-reject': 'claim-verify-reject',
    'pay-complete': 'payment-completed',
    'pay-partially': 'payment-partially',
    'pay-pending': 'payment-pending',
  };
  return m[key] || key;
}

export function UPSSL18WInstallationDashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState<UpSsl18wDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setApiError(null);
    try {
      const res = await upSsl18wAdminService.getDashboard();
      setData(res);
      setUpdatedAt(new Date());
    } catch (err: any) {
      setApiError(err?.message || 'Failed to fetch UP SSL-18W dashboard data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const totals: NormalizedUpTotals = useMemo(() => {
    const d = data?.install_detail;
    return {
      total: Number(d?.total ?? 0),
      assigned: Number(d?.assigned ?? 0),
      accepted: Number(d?.accept ?? 0),
      not_assigned: Number(d?.not_assigned ?? 0),
      complete: Number(d?.complete ?? 0),
      pending: Number(d?.pending ?? 0),
      verify_approved: Number(d?.verify_approved ?? 0),
      verify_pending: Number(d?.verify_pending ?? 0),
      verify_reject: Number(d?.verify_reject ?? 0),
      claim_applicable: Number(d?.claim_applicable ?? 0),
      claim_raised: Number(d?.claim_raised ?? 0),
      claim_approved: Number(d?.claim_verify_approved ?? 0),
      claim_pending: Number(d?.claim_verify_pending ?? 0),
      claim_reject: Number(d?.claim_verify_reject ?? 0),
      pay_complete: Number(d?.payment_complete ?? 0),
      pay_partially: Number(d?.payment_partially ?? 0),
      pay_pending: Number(d?.payment_pending ?? 0),
    };
  }, [data]);

  const districts: NormalizedDistrictRow[] = useMemo(
    () =>
      (data?.districtwise || []).map((d) => ({
        district: (d.district || '').trim() || BLANK_DISTRICT_LABEL,
        total: Number(d.total ?? 0),
        assigned: Number(d.assigned ?? 0),
        not_assigned: Number(d.not_assigned ?? Math.max(0, Number(d.total ?? 0) - Number(d.assigned ?? 0))),
        complete: Number(d.complete ?? 0),
        pending: Number(d.pending ?? 0),
        verify_approved: Number(d.verify_approved ?? 0),
        verify_pending: Number(d.verify_pending ?? 0),
        verify_reject: Number(d.verify_reject ?? 0),
        claim_raised: Number(d.claim_raised ?? 0),
        claim_approved: Number(d.claim_verify_approved ?? 0),
        claim_reject: Number(d.claim_verify_reject ?? 0),
        pay_complete: Number(d.payment_complete ?? 0),
        pay_partially: Number(d.payment_partially ?? 0),
        pay_pending: Number(d.payment_pending ?? 0),
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
        vendor_name: v.name || nameMap.get(id) || `Vendor #${id}`,
        today_install: todayMap.get(id) || 0,
        site_count: Number(v.assigned ?? 0),
        complete: Number(v.complete ?? 0),
        pending: Number(v.pending ?? 0),
        verify_approved: Number(v.verify_approved ?? 0),
        verify_pending: Number(v.verify_pending ?? 0),
        verify_reject: Number(v.verify_reject ?? 0),
        claim_raised: Number(v.claim_raised ?? 0),
        claim_approved: Number(v.claim_verify_approved ?? 0),
        claim_reject: Number(v.claim_verify_reject ?? 0),
        pay_complete: Number(v.payment_complete ?? 0),
        pay_partially: Number(v.payment_partially ?? 0),
        pay_pending: Number(v.payment_pending ?? 0),
      });
    });

    (data?.vendors || []).forEach((v) => {
      const id = Number(v.inst_vendor);
      if (!isNaN(id) && !rowMap.has(id)) {
        rowMap.set(id, {
          vendor_id: id,
          vendor_name: v.name || `Vendor #${id}`,
          today_install: todayMap.get(id) || 0,
          site_count: Number(v.vendor ?? 0),
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
    (statusKey: string, extra?: { district?: string; vendor?: string | number }) => {
      const mapped = mapSsl18wStatus(statusKey);
      const params = new URLSearchParams({ status: mapped });
      if (extra?.vendor !== undefined) {
        params.set('mode', 'vendor');
        params.set('value', String(extra.vendor));
      } else if (extra?.district && extra.district !== BLANK_DISTRICT_LABEL) {
        params.set('mode', 'district');
        params.set('value', extra.district);
      }
      navigate(`/vendor-management/up/ssl18w/installation/status-view?${params.toString()}`);
    },
    [navigate]
  );

  return (
    <UPDashboardTemplate
      pageTitle="UP SSL-18W Installation Dashboard"
      pageSubtitle="Uttar Pradesh 18W Solar Street Light (Feasible) Installation Analytics, District & Vendor Tracking"
      moduleName="SSL 18W"
      programEyebrow="Uttar Pradesh 18W Solar Street Light (SSL) Program"
      welcomeHeading="Welcome to UP SSL-18W Operations Dashboard"
      unitLabel="Lights"
      unitShort="feasible 18W street lights"
      fileBase="UP_SSL18W"
      updatedAt={updatedAt}
      loading={loading}
      apiError={apiError}
      totals={totals}
      districts={districts}
      vendors={vendors}
      monthly={sortedMonthly}
      extraWelcomeStat={{
        label: 'Accepted / Verify',
        value: `${dashNum(totals.accepted)} / ${dashNum(totals.verify_approved)}`,
        sub: `Claim Applicable: ${dashNum(totals.claim_applicable)} · Reject: ${dashNum(totals.verify_reject)}`,
        color: '#0891b2',
      }}
      routes={{
        statusRegister: '/vendor-management/up/ssl18w/installation/status-view?status=total',
        assign: '/vendor-management/up/ssl18w/installation/assign',
        viewAssign: '/vendor-management/up/ssl18w/installation/view-assign',
        verify: '/vendor-management/up/ssl18w/installation/verify',
        viewClaim: '/vendor-management/up/ssl18w/installation/view-claim',
        viewPayment: '/vendor-management/up/ssl18w/installation/view-payment',
      }}
      onDrillDown={handleDrillDown}
    />
  );
}

export default UPSSL18WInstallationDashboard;
