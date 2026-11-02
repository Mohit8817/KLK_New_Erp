import { UpAmcPendingForm } from '../CommonSharedAMC';
import { upKusumCAmcApi } from '../../up-services';

export function UP_AMC_KusumC_PendingAMC() {
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
      return arr.map((s: any) => ({
        id: s.site_id,
        label: `${s.farmer_name || 'Farmer'} (Father: ${s.father_name || '—'}) [ID: ${s.site_id}]`,
        ...s,
      }));
    }
    return [];
  };

  const fetchSiteDetails = async (id: number | string, year?: number) => {
    const res = await upKusumCAmcApi.fetchSiteName(id, year);
    if (res?.status && res.data) {
      return {
        ...res.data,
        beneficiary_name: res.data.f_farmer_name,
        beneficiary_contact: res.data.f_mobile,
        district: res.data.f_district,
        village: res.data.f_village,
        pump_capacity: res.data.pump_capacity,
      };
    }
    return null;
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
      mode="schedule"
      photoMode="fourImages"
      onFetchYears={fetchYears}
      onFetchSites={fetchSites}
      onFetchSiteDetails={fetchSiteDetails}
      onSubmit={submitAmc}
    />
  );
}

export default UP_AMC_KusumC_PendingAMC;
