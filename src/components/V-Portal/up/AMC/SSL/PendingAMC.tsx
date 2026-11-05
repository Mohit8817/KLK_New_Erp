import { UpAmcPendingForm } from '../CommonSharedAMC';
import { upSslAmcApi } from '../../up-services';

export function UP_AMC_SSL_PendingAMC() {
  const fetchYears = async () => {
    return [new Date().getFullYear(), new Date().getFullYear() - 1];
  };

  const fetchSites = async () => {
    const res = await upSslAmcApi.getCreateLight();
    if (Array.isArray(res?.data)) {
      return res.data.map((l: any) => ({
        id: l.id,
        label: `${l.beneficiary_name || 'SSL Site'} — ${l.district || ''} (${l.block || ''}, ${l.village || ''}) [ID: ${l.id}]`,
        ...l,
      }));
    }
    return [];
  };

  const fetchSiteDetails = async (id: number | string) => {
    const res = await upSslAmcApi.fetchLightDetails(id);
    const s = res?.ssl_details || res?.data || res;
    if (s) {
      return {
        ...s,
        state: s.state || 'UP',
        district: s.district || '',
        village: s.village || s.block || '',
        beneficiary_name: s.beneficiary_name || '',
        contact: s.contact || s.mobile || '',
        gender: s.gender || '',
        phase: s.phase || '',
        serial_number: s.serial_number || s.light_no || s.pole_no || s.id || '',
        address: s.address || s.location || '',
        volume: s.volume || s.wattage || s.capacity || 'SSL',
        contractor_name: s.contractor_name || '',
        amc_type: res?.amc_type_name || s.amc_type || 'Monthly',
      };
    }
    return null;
  };

  const submitAmc = async (formData: FormData) => {
    return upSslAmcApi.storeLight(formData);
  };

  return (
    <UpAmcPendingForm
      title="UP SSL — Submit Street Light AMC Report"
      subtitle="Complete periodic maintenance report for assigned Solar Street Light (SSL) sites"
      projectEyebrow="Uttar Pradesh Solar Street Light (SSL)"
      breadcrumbs={[
        { label: 'Home', href: '/v' },
        { label: 'UP AMC' },
        { label: 'SSL', href: '/v/up-ssl-amc-view-light' },
        { label: 'Pending AMC' },
      ]}
      viewLink="/v/up-ssl-amc-view-light"
      viewLabel="View Completed AMC"
      defaultAmcType="Monthly"
      onFetchYears={fetchYears}
      onFetchSites={fetchSites}
      onFetchSiteDetails={fetchSiteDetails}
      onSubmit={submitAmc}
    />
  );
}

export default UP_AMC_SSL_PendingAMC;
