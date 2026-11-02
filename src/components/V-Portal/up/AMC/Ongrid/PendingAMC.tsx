import { UpAmcPendingForm } from '../CommonSharedAMC';
import { upOngridAmcApi } from '../../up-services';

export function UP_AMC_Ongrid_PendingAMC() {
  const fetchYears = async () => {
    const res = await upOngridAmcApi.getYears();
    const arr = Array.isArray(res) ? res : res?.data;
    if (Array.isArray(arr) && arr.length > 0) return arr;
    return [new Date().getFullYear()];
  };

  const fetchMonths = async (year: number) => {
    const res = await upOngridAmcApi.getMonths(year);
    const arr = Array.isArray(res) ? res : res?.data;
    if (Array.isArray(arr) && arr.length > 0) return arr;
    return [];
  };

  const fetchSites = async (year: number) => {
    const res = await upOngridAmcApi.getSites(year);
    const arr = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
    if (Array.isArray(arr)) {
      return arr.map((s: any) => ({
        id: s.site_id,
        label: `${s.beneficiary_name || 'Beneficiary'} [Site #${s.site_id}]`,
        ...s,
      }));
    }
    return [];
  };

  const fetchSiteDetails = async (id: number | string, year?: number, month?: number | string) => {
    const res = await upOngridAmcApi.fetchSiteName(id, year, month);
    if (res?.ongrid) {
      const o = res.ongrid;
      return {
        ...o,
        beneficiary_name: o.beneficiary_name,
        district: o.district,
        plant_capacity: o.plant_capacity,
        contractor_name: o.contractor_name,
        contractor_number: o.contractor_number,
      };
    }
    return null;
  };

  const submitAmc = async (formData: FormData) => {
    return upOngridAmcApi.updateSite(formData);
  };

  return (
    <UpAmcPendingForm
      title="UP Ongrid Solar — Submit AMC Report"
      subtitle="Complete periodic maintenance inspection report for assigned Ongrid solar rooftop plants"
      projectEyebrow="Uttar Pradesh Ongrid Rooftop Solar"
      breadcrumbs={[
        { label: 'Home', href: '/v' },
        { label: 'UP AMC' },
        { label: 'Ongrid', href: '/v/up/ongrid/amc/completed-details' },
        { label: 'Pending AMC' },
      ]}
      viewLink="/v/up/ongrid/amc/completed-details"
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

export default UP_AMC_Ongrid_PendingAMC;
