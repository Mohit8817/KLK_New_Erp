import { UpAmcPendingForm } from '../CommonSharedAMC';
import { upKusumBAmcApi } from '../../up-services';

export function UP_AMC_KusumB_PendingAMC() {
  const fetchYears = async () => {
    const res = await upKusumBAmcApi.getYears();
    const arr = Array.isArray(res) ? res : res?.data;
    if (Array.isArray(arr) && arr.length > 0) return arr;
    return [new Date().getFullYear()];
  };

  const fetchMonths = async (year: number) => {
    const res: any = await upKusumBAmcApi.getMonths(year);
    const arr = Array.isArray(res) ? res : res?.months || res?.data?.months || res?.data;
    if (Array.isArray(arr) && arr.length > 0) return arr;
    return [];
  };

  const fetchSites = async (year: number) => {
    const res = await upKusumBAmcApi.getSites(year);
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

  const fetchSiteDetails = async (id: number | string, year?: number, month?: number | string) => {
    const res = await upKusumBAmcApi.fetchSiteName(id, year, month);
    if (res?.kusumb) {
      const k = res.kusumb;
      return {
        ...k,
        beneficiary_name: k.beneficiary,
        beneficiary_contact: k.mobile,
        district: k.installation_dsitrict,
        village: k.installation_village,
        pump_capacity: k.pump_capacity,
        saral_id: k.saral_id,
        application_no: k.application_no,
      };
    }
    return null;
  };

  const submitAmc = async (formData: FormData) => {
    return upKusumBAmcApi.updateSite(formData);
  };

  return (
    <UpAmcPendingForm
      title="UP Kusum B — Submit Pump AMC Report"
      subtitle="Complete periodic maintenance report for assigned PM Kusum Component-B solar pumps"
      projectEyebrow="PM Kusum Component B (Solar Pumps)"
      breadcrumbs={[
        { label: 'Home', href: '/v' },
        { label: 'UP AMC' },
        { label: 'Kusum B', href: '/v/up/kusumb/amc/completed-details' },
        { label: 'Pending AMC' },
      ]}
      viewLink="/v/up/kusumb/amc/completed-details"
      viewLabel="View Completed AMC"
      mode="schedule"
      photoMode="fourImages"
      onFetchYears={fetchYears}
      onFetchMonths={fetchMonths}
      onFetchSites={fetchSites}
      onFetchSiteDetails={fetchSiteDetails}
      onSubmit={submitAmc}
    />
  );
}

export default UP_AMC_KusumB_PendingAMC;
