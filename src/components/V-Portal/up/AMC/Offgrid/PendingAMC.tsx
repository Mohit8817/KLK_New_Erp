import { UpAmcPendingForm } from '../CommonSharedAMC';
import { upOffgridAmcApi } from '../../up-services';

export function UP_AMC_Offgrid_PendingAMC() {
  const fetchYears = async () => {
    const res = await upOffgridAmcApi.getYears();
    const arr = Array.isArray(res) ? res : res?.data;
    if (Array.isArray(arr) && arr.length > 0) return arr;
    return [new Date().getFullYear()];
  };

  const fetchMonths = async (year: number) => {
    const res = await upOffgridAmcApi.getMonths(year);
    const arr = Array.isArray(res) ? res : res?.data;
    if (Array.isArray(arr) && arr.length > 0) return arr;
    return [];
  };

  const fetchSites = async (year: number) => {
    const res = await upOffgridAmcApi.getSites(year);
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
    const res = await upOffgridAmcApi.fetchSiteName(id, year, month);
    if (res?.data) {
      const d = res.data;
      return {
        ...d,
        beneficiary_name: d.beneficiary_name,
        district: d.district,
        plant_capacity: d.plant_capacity,
        work_order_no: d.work_order_no,
        contractor_name: d.contractor_name,
      };
    }
    return null;
  };

  const submitAmc = async (formData: FormData) => {
    return upOffgridAmcApi.updateSite(formData);
  };

  return (
    <UpAmcPendingForm
      title="UP Offgrid Solar — Submit AMC Report"
      subtitle="Complete periodic maintenance inspection report for assigned Offgrid solar power systems"
      projectEyebrow="Uttar Pradesh Offgrid Solar"
      breadcrumbs={[
        { label: 'Home', href: '/v' },
        { label: 'UP AMC' },
        { label: 'Offgrid', href: '/v/up/offgrid/amc/completed-details' },
        { label: 'Pending AMC' },
      ]}
      viewLink="/v/up/offgrid/amc/completed-details"
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

export default UP_AMC_Offgrid_PendingAMC;
