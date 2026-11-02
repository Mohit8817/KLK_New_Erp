import { UpAmcPendingForm } from '../CommonSharedAMC';
import { upSsl18wAmcApi } from '../../up-services';

export function UP_AMC_SSL18W_PendingAMC() {
  const fetchYears = async () => {
    return [new Date().getFullYear(), new Date().getFullYear() - 1];
  };

  const fetchSites = async () => {
    const res = await upSsl18wAmcApi.getCreateLight();
    if (Array.isArray(res?.data)) {
      return res.data.map((l: any) => ({
        id: l.id,
        label: `${l.beneficiary_name || 'SSL 18W Site'} — ${l.district || ''} (${l.block || ''}, ${l.village || ''}) [ID: ${l.id}]`,
        ...l,
      }));
    }
    return [];
  };

  const fetchSiteDetails = async (id: number | string) => {
    const res = await upSsl18wAmcApi.fetchLightDetails(id);
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
    return upSsl18wAmcApi.storeLight(formData);
  };

  return (
    <UpAmcPendingForm
      title="UP SSL 18W — Submit Street Light AMC Report"
      subtitle="Complete periodic maintenance report for assigned Solar Street Light (SSL 18W) sites"
      projectEyebrow="Uttar Pradesh Solar Street Light (SSL 18W)"
      breadcrumbs={[
        { label: 'Home', href: '/v' },
        { label: 'UP AMC' },
        { label: 'SSL 18W', href: '/v/up-ssl18w-amc-view-light' },
        { label: 'Pending AMC' },
      ]}
      viewLink="/v/up-ssl18w-amc-view-light"
      viewLabel="View Completed AMC"
      mode="ssl18w"
      photoMode="fourImages"
      onFetchYears={fetchYears}
      onFetchSites={fetchSites}
      onFetchSiteDetails={fetchSiteDetails}
      onSubmit={submitAmc}
    />
  );
}

export default UP_AMC_SSL18W_PendingAMC;
