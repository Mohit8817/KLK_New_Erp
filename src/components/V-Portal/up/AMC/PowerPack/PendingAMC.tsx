import { UpAmcPendingForm } from '../CommonSharedAMC';
import { upPowerPackAmcApi } from '../../up-services';

export function UP_AMC_PowerPack_PendingAMC() {
  const fetchYears = async () => {
    const res = await upPowerPackAmcApi.getYears();
    const arr = Array.isArray(res) ? res : res?.data;
    if (Array.isArray(arr) && arr.length > 0) return arr;
    return [new Date().getFullYear()];
  };

  const fetchMonths = async (year: number) => {
    const res: any = await upPowerPackAmcApi.getMonths(year);
    const arr = Array.isArray(res) ? res : res?.months || res?.data?.months || res?.data;
    if (Array.isArray(arr) && arr.length > 0) return arr;
    return [];
  };

  const fetchSites = async (year: number) => {
    const res = await upPowerPackAmcApi.getSites(year);
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
    const res = await upPowerPackAmcApi.fetchSiteName(id, year, month);
    if (res?.powerpack) {
      const p = res.powerpack;
      return {
        ...p,
        beneficiary_name: p.beneficiary_name,
        district: p.district,
        block: p.block,
        village: p.village,
        contractor_name: p.contractor_name,
        installation_date: p.installation_date,
      };
    }
    return null;
  };

  const submitAmc = async (formData: FormData) => {
    return upPowerPackAmcApi.updateSite(formData);
  };

  return (
    <UpAmcPendingForm
      title="UP Power Pack — Submit Maintenance AMC Report"
      subtitle="Complete periodic maintenance inspection report for assigned Solar Power Pack sites"
      projectEyebrow="Uttar Pradesh Solar Power Pack"
      breadcrumbs={[
        { label: 'Home', href: '/v' },
        { label: 'UP AMC' },
        { label: 'Power Pack', href: '/v/up/powerpack/amc/completed-details' },
        { label: 'Pending AMC' },
      ]}
      viewLink="/v/up/powerpack/amc/completed-details"
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

export default UP_AMC_PowerPack_PendingAMC;
