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
        label: `${s.farmer_name || s.beneficiary || 'Farmer'} (Father: ${s.father_name || '—'}) [ID: ${s.site_id}]`,
        ...s,
      }));
    }
    return [];
  };

  const fetchSiteDetails = async (id: number | string, year?: number, month?: number | string) => {
    const res = await upKusumBAmcApi.fetchSiteName(id, year, month);
    const k = res?.kusumb || res?.data || res;
    if (k) {
      return {
        ...k,
        state: k.state || 'UP',
        district: k.installation_dsitrict || k.district || k.f_district || '',
        village: k.installation_village || k.village || k.f_village || '',
        beneficiary_name: k.beneficiary || k.beneficiary_name || k.farmer_name || '',
        contact: k.mobile || k.contact || k.beneficiary_contact || '',
        gender: k.gender || k.f_gender || '',
        phase: k.phase || k.f_phase || '',
        serial_number: k.saral_id || k.application_no || k.serial_number || '',
        address: k.address || k.location || k.installation_village || '',
        volume: k.pump_capacity || k.volume || k.capacity || '',
        contractor_name: k.contractor_name || k.contractor || '',
        amc_type: k.amc_type || 'Monthly',
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
      defaultAmcType="Monthly"
      onFetchYears={fetchYears}
      onFetchMonths={fetchMonths}
      onFetchSites={fetchSites}
      onFetchSiteDetails={fetchSiteDetails}
      onSubmit={submitAmc}
    />
  );
}

export default UP_AMC_KusumB_PendingAMC;
