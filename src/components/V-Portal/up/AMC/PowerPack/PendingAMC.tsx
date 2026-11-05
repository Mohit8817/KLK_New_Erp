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
        label: `${s.beneficiary_name || s.farmer_name || 'Beneficiary'} [Site #${s.site_id}]`,
        ...s,
      }));
    }
    return [];
  };

  const fetchSiteDetails = async (id: number | string, year?: number, month?: number | string) => {
    const res = await upPowerPackAmcApi.fetchSiteName(id, year, month);
    const p = res?.powerpack || res?.data || res;
    if (p) {
      return {
        ...p,
        state: p.state || 'UP',
        district: p.district || '',
        village: p.village || p.block || '',
        beneficiary_name: p.beneficiary_name || '',
        contact: p.contact || p.mobile || '',
        gender: p.gender || '',
        phase: p.phase || '',
        serial_number: p.serial_number || p.system_id || '',
        address: p.address || p.location || '',
        volume: p.capacity || p.plant_capacity || p.volume || '',
        contractor_name: p.contractor_name || '',
        amc_type: p.amc_type || 'Monthly',
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
      defaultAmcType="Monthly"
      onFetchYears={fetchYears}
      onFetchMonths={fetchMonths}
      onFetchSites={fetchSites}
      onFetchSiteDetails={fetchSiteDetails}
      onSubmit={submitAmc}
    />
  );
}

export default UP_AMC_PowerPack_PendingAMC;
