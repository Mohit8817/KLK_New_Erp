import { useRef } from 'react';
import { UpAmcPendingForm } from '../CommonSharedAMC';
import { upKusumCAmcApi } from '../../up-services';

const AMC_TYPE_MAP: Record<string, string> = {
  M: 'Monthly',
  Q: 'Quarterly',
  H: 'Half Yearly',
  Y: 'Yearly',
};

const normalizeAmcType = (t?: string | null) => {
  if (!t) return 'Monthly';
  const key = String(t).trim().toUpperCase();
  return AMC_TYPE_MAP[key] || String(t);
};

export function UP_AMC_KusumC_PendingAMC() {
  // getSites ka data (schedule, current_due, amc_type) yahan cache hota hai,
  // kyunki fetchSiteName API mein ye fields nahi aate.
  const siteCache = useRef<Map<string, any>>(new Map());

  const fetchYears = async () => {
    const res = await upKusumCAmcApi.getYears();
    const arr = Array.isArray(res) ? res : res?.data;
    if (Array.isArray(arr) && arr.length > 0) return arr;
    return [new Date().getFullYear()];
  };

  const fetchSites = async (year: number) => {
    const res = await upKusumCAmcApi.getSites(year);
    const arr = Array.isArray(res) ? res : res?.data;
    if (Array.isArray(arr)) {
      siteCache.current.clear();
      return arr.map((s: any) => {
        siteCache.current.set(String(s.site_id), s);
        return {
          id: s.site_id,
          label: `${s.farmer_name || s.f_farmer_name || 'Farmer'} (Father: ${
            s.father_name || s.f_father_name || '—'
          }) [ID: ${s.site_id}]`,
          ...s,
        };
      });
    }
    return [];
  };

  const fetchSiteDetails = async (
    id: number | string,
    year?: number,
    month?: number | string
  ) => {
    const res = await upKusumCAmcApi.fetchSiteName(id, year, month);
    const d = res?.data || res;
    if (!d) return null;

    // list API se aaya hua schedule / current_due
    const listItem = siteCache.current.get(String(id)) || {};
    const schedule: any[] =
      res?.schedule || d?.schedule || listItem.schedule || [];
    const currentDue =
      res?.current_due || d?.current_due || listItem.current_due || null;

    const pendingMonths =
      res?.pending_months ||
      d?.pending_months ||
      schedule
        .filter((m: any) => m.status === 'pending')
        .map((m: any) => ({
          year: m.year,
          month: m.month,
          month_name: m.month_name,
          label: m.month_name,
          value: m.month,
        }));

    const address =
      d.f_address ||
      d.address ||
      [d.f_village, d.f_post, d.f_district].filter(Boolean).join(', ');

    return {
      ...d,
      state: d.state ? String(d.state).toUpperCase() : 'UP',
      district: d.f_district || d.district || '',
      village: d.f_village || d.village || '',
      beneficiary_name:
        d.f_farmer_name || listItem.farmer_name || d.farmer_name || '',
      father_name:
        d.f_father_name || listItem.father_name || d.father_name || '',
      contact: d.f_contact || d.f_mobile || d.mobile || '',
      gender: d.f_gender || d.gender || '',
      phase: d.phase || d.f_phase || '',
      serial_number: d.f_customer_no || d.f_sr_no || d.serial_number || '',
      address,
      volume: d.pump_capacity || d.volume || '',
      contractor_name: d.c_contractor_name || d.contractor_name || '',
      // pehle AMC type (M -> Monthly), phir month
      amc_type: normalizeAmcType(d.amc_type || listItem.amc_type),
      pending_months: pendingMonths,
      schedule,
      current_due: currentDue,
      // default month = current due (agar form use karta ho)
      default_month: currentDue?.month ?? null,
    };
  };

  const submitAmc = async (formData: FormData) => {
    return upKusumCAmcApi.updateSite(formData);
  };

  return (
    <UpAmcPendingForm
      title="UP Kusum C — Submit Pump AMC Report"
      subtitle="Complete periodic maintenance report for assigned PM Kusum Component-C solar pumps"
      projectEyebrow="PM Kusum Component C (Solar Pumps)"
      breadcrumbs={[
        { label: 'Home', href: '/v' },
        { label: 'UP AMC' },
        { label: 'Kusum C', href: '/v/up/kusumc/amc/completed-details' },
        { label: 'Pending AMC' },
      ]}
      viewLink="/v/up/kusumc/amc/completed-details"
      viewLabel="View Completed AMC"
      defaultAmcType="Monthly"
      onFetchYears={fetchYears}
      onFetchSites={fetchSites}
      onFetchSiteDetails={fetchSiteDetails}
      onSubmit={submitAmc}
    />
  );
}

export default UP_AMC_KusumC_PendingAMC;