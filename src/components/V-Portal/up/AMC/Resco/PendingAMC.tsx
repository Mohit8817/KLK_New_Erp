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
    try {
      const m = months || new Date().getMonth() + 1;
      const res: any = await upRescoAmcApi.getSiteName(year, m);
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
      const r = res?.data?.site_details || res?.data?.site || res?.site_details || res?.site || res?.data || res;
      const d = Array.isArray(r) ? r[0] : r;
      if (d) {
        return {
          ...d,
          state: d.state || 'UP',
          district: d.district || '',
          village: d.village || d.location || '',
          beneficiary_name: d.beneficiary_name || d.site_name || d.name || '',
          contact: d.contact || d.mobile || d.contact_person_number || '',
          gender: d.gender || '',
          phase: d.phase || '',
          serial_number: d.serial_number || d.ca_no || d.consumer_no || '',
          address: d.address || d.location || '',
          volume: d.volume || d.sanction_load || d.plant_sc || d.capacity || '',
          contractor_name: d.contractor_name || d.vendor_name || '',
          amc_type: d.amc_type || 'Monthly',
        };
      }
      return null;
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
      defaultAmcType="Monthly"
      onFetchYears={fetchYears}
      onFetchMonths={fetchMonths}
      onFetchSites={fetchSites}
      onFetchSiteDetails={fetchSiteDetails}
      onSubmit={submitAmc}
    />
  );
}

export default UP_AMC_Resco_PendingAMC;
