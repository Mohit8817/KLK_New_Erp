import { UpAmcPendingForm } from '../CommonSharedAMC';
import { upRescoAmcApi } from '../../up-services';

export function UP_AMC_Resco_PendingAMC() {
  const fetchYears = async () => {
    try {
      const res: any = await upRescoAmcApi.getCreateYears();
      const arr =
        res?.data?.amc_years ||
        res?.amc_years ||
        res?.data?.years ||
        res?.years ||
        (Array.isArray(res?.data) ? res.data : null) ||
        (Array.isArray(res) ? res : null);
      if (Array.isArray(arr) && arr.length > 0) return arr.map(Number);
      return [new Date().getFullYear()];
    } catch (err) {
      console.error('Error fetching Resco AMC years:', err);
      return [new Date().getFullYear()];
    }
  };

  const fetchMonths = async (year: number) => {
    try {
      const res: any = await upRescoAmcApi.getMonth(year);
      let list: any[] = [];
      if (Array.isArray(res)) {
        list = res;
      } else if (Array.isArray(res?.months)) {
        list = res.months;
      } else if (Array.isArray(res?.data?.months)) {
        list = res.data.months;
      } else if (Array.isArray(res?.data)) {
        list = res.data;
      } else if (res?.data && typeof res.data === 'object') {
        const firstArr = Object.values(res.data).find(Array.isArray);
        if (firstArr) list = firstArr as any[];
      } else if (res && typeof res === 'object') {
        const firstArr = Object.values(res).find(Array.isArray);
        if (firstArr) list = firstArr as any[];
      }

      return list
        .map((m: any) => (typeof m === 'object' && m !== null ? (m.month ?? m.months ?? m.id ?? m.value ?? m) : m))
        .filter((m: any) => m !== undefined && m !== null && m !== '');
    } catch (err) {
      console.error('Error fetching Resco AMC months:', err);
      return [];
    }
  };

  const fetchSites = async (year: number, months?: number | string) => {
    if (!months) return [];
    try {
      const res: any = await upRescoAmcApi.getSiteName(year, months);
      let list: any[] = [];
      if (Array.isArray(res)) {
        list = res;
      } else if (Array.isArray(res?.data)) {
        list = res.data;
      } else if (Array.isArray(res?.data?.site_name)) {
        list = res.data.site_name;
      } else if (Array.isArray(res?.data?.sites)) {
        list = res.data.sites;
      } else if (Array.isArray(res?.site_name)) {
        list = res.site_name;
      } else if (Array.isArray(res?.sites)) {
        list = res.sites;
      } else if (res?.data && typeof res.data === 'object') {
        const firstArr = Object.values(res.data).find(Array.isArray);
        if (firstArr) list = firstArr as any[];
      } else if (res && typeof res === 'object') {
        const firstArr = Object.values(res).find(Array.isArray);
        if (firstArr) list = firstArr as any[];
      }

      return list.map((s: any) => {
        const id = s.id ?? s.site_id ?? s.site_name;
        const name = s.site_name ?? s.name ?? `Site #${id}`;
        return {
          id,
          label: name ? `${name} (ID: ${id})` : `Site #${id}`,
          site_name: name,
          ...s,
        };
      });
    } catch (err) {
      console.error('Error fetching Resco AMC sites:', err);
      return [];
    }
  };

  const fetchSiteDetails = async (id: number | string) => {
    try {
      const res: any = await upRescoAmcApi.getSiteDetails(id);
      const d =
        res?.data?.site_details ||
        res?.data?.site ||
        res?.site_details ||
        res?.site ||
        res?.data ||
        res ||
        null;
      if (Array.isArray(d)) return d[0] || null;
      return d;
    } catch (err) {
      console.error('Error fetching Resco AMC site details:', err);
      return null;
    }
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
