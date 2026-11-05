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
        label: `${s.farmer_name || s.f_farmer_name || 'Farmer'} (Father: ${s.father_name || s.f_father_name || '—'}) [ID: ${s.site_id}]`,
        ...s,
      }));
    }
    return [];
  };

  const fetchSiteDetails = async (id: number | string, year?: number, month?: number | string) => {
    const res = await upKusumCAmcApi.fetchSiteName(id, year, month);
    const d = res?.data || res;
    if (d) {
      return {
        ...d,
        state: d.state || 'UP',
        district: d.f_district || d.district || '',
        village: d.f_village || d.village || '',
        beneficiary_name: d.f_farmer_name || d.farmer_name || d.beneficiary_name || '',
        contact: d.f_mobile || d.mobile || d.beneficiary_contact || '',
        gender: d.f_gender || d.gender || '',
        phase: d.f_phase || d.phase || '',
        serial_number: d.f_sr_no || d.serial_number || d.serial_no || d.saral_id || '',
        address: d.f_address || d.address || d.location || '',
        volume: d.pump_capacity || d.volume || d.capacity || '',
        contractor_name: d.contractor_name || d.contractor || '',
        amc_type: d.amc_type || 'Monthly',
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
      defaultAmcType="Monthly"
      onFetchYears={fetchYears}
      onFetchSites={fetchSites}
      onFetchSiteDetails={fetchSiteDetails}
      onSubmit={submitAmc}
    />
  );
}

export default UP_AMC_KusumC_PendingAMC;
