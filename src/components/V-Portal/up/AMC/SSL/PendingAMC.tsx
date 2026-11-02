import { UpAmcPendingForm } from '../CommonSharedAMC';
import { upSslAmcApi } from '../../up-services';

export function UP_AMC_SSL_PendingAMC() {
  const fetchYears = async () => {
    // SSL has pending months formatted MM-YYYY returned from light details
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
    if (res?.status && res.ssl_details) {
      return {
        ...res.ssl_details,
        pending_months: res.pending_months,
        amc_type_name: res.amc_type_name,
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
      mode="ssl"
      photoMode="fourImages"
      onFetchYears={fetchYears}
      onFetchSites={fetchSites}
      onFetchSiteDetails={fetchSiteDetails}
      onSubmit={submitAmc}
    />
  );
}

export default UP_AMC_SSL_PendingAMC;
