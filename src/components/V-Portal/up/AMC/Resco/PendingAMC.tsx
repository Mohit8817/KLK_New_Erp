import { UpAmcPendingForm } from '../CommonSharedAMC';
import { upRescoAmcApi } from '../../up-services';

export function UP_AMC_Resco_PendingAMC() {
  const fetchYears = async () => {
    const res = await upRescoAmcApi.getCreateYears();
    const arr = res?.data?.amc_years;
    if (Array.isArray(arr) && arr.length > 0) return arr;
    return [new Date().getFullYear()];
  };

  const fetchMonths = async (year: number) => {
    const res = await upRescoAmcApi.getMonth(year);
    if (Array.isArray(res?.data) && res.data.length > 0) {
      return res.data;
    }
    return [];
  };

  const fetchSites = async (year: number, month?: number | string) => {
    if (!month) return [];
    const res = await upRescoAmcApi.getSiteName(year, month);
    if (Array.isArray(res?.data)) {
      return res.data.map((s: any) => ({
        id: s.id,
        label: s.site_name ? `${s.site_name} (ID: ${s.id})` : `Site #${s.id}`,
        ...s,
      }));
    }
    return [];
  };

  const fetchSiteDetails = async (id: number | string) => {
    const res = await upRescoAmcApi.getSiteDetails(id);
    return res?.data || null;
  };

  const submitAmc = async (formData: FormData) => {
    return upRescoAmcApi.storeSite(formData);
  };

  return (
    <UpAmcPendingForm
      title="UP RESCO — Submit Pending AMC Report"
      subtitle="Complete scheduled periodic maintenance for assigned RESCO rooftop solar sites"
      projectEyebrow="Uttar Pradesh RESCO Solar"
      breadcrumbs={[
        { label: 'Home', href: '/v' },
        { label: 'UP AMC' },
        { label: 'Resco', href: '/v/up-resco-amc-view-site' },
        { label: 'Pending AMC' },
      ]}
      viewLink="/v/up-resco-amc-view-site"
      viewLabel="View Completed AMC"
      mode="resco"
      photoMode="beforeAfter"
      hasJmrReport={true}
      hasDigitalSignature={true}
      onFetchYears={fetchYears}
      onFetchMonths={fetchMonths}
      onFetchSites={fetchSites}
      onFetchSiteDetails={fetchSiteDetails}
      onSubmit={submitAmc}
    />
  );
}

export default UP_AMC_Resco_PendingAMC;
