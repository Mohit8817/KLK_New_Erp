import { useCallback } from 'react';
import { UpAmcPendingForm } from '../CommonSharedAMC';
import { upRescoAmcApi } from '../../up-services';

export function UP_AMC_Resco_PendingAMC() {
  const fetchYears = useCallback(async () => {
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
  }, []);

  const fetchMonths = useCallback(async (year: number) => {
    try {
      const res: any = await upRescoAmcApi.getMonth(year);
      let list: any[] = [];
      if (Array.isArray(res)) {
        list = res;
      } else if (Array.isArray(res?.months)) {
        list = res.months;
      } else if (Array.isArray(res?.month)) {
        list = res.month;
      } else if (Array.isArray(res?.data?.months)) {
        list = res.data.months;
      } else if (Array.isArray(res?.data?.month)) {
        list = res.data.month;
      } else if (Array.isArray(res?.amc_months)) {
        list = res.amc_months;
      } else if (Array.isArray(res?.data?.amc_months)) {
        list = res.data.amc_months;
      } else if (Array.isArray(res?.data)) {
        list = res.data;
      } else if (typeof res === 'object' && res !== null) {
        const found = Object.values(res).find((v) => Array.isArray(v)) as any[] | undefined;
        if (found) list = found;
      }

      return list
        .map((m: any) => (typeof m === 'object' && m !== null ? (m.month ?? m.months ?? m.id ?? m.value ?? m) : m))
        .filter((m: any) => m !== undefined && m !== null && m !== '');
    } catch (err) {
      console.error('Error fetching Resco AMC months:', err);
      return [];
    }
  }, []);

  const fetchSites = useCallback(async (year: number, months?: number | string) => {
    try {
      const m = months || new Date().getMonth() + 1;
      const res: any = await upRescoAmcApi.getSiteName(year, m);
      let list: any[] = [];
      if (Array.isArray(res)) {
        list = res;
      } else if (Array.isArray(res?.srtsite)) {
        list = res.srtsite;
      } else if (Array.isArray(res?.data?.srtsite)) {
        list = res.data.srtsite;
      } else if (Array.isArray(res?.srt_site)) {
        list = res.srt_site;
      } else if (Array.isArray(res?.data?.srt_site)) {
        list = res.data.srt_site;
      } else if (Array.isArray(res?.sites)) {
        list = res.sites;
      } else if (Array.isArray(res?.data?.sites)) {
        list = res.data.sites;
      } else if (Array.isArray(res?.site_name)) {
        list = res.site_name;
      } else if (Array.isArray(res?.data?.site_name)) {
        list = res.data.site_name;
      } else if (Array.isArray(res?.data)) {
        list = res.data;
      } else if (typeof res === 'object' && res !== null) {
        if (Array.isArray(res.srtsite)) {
          list = res.srtsite;
        } else if (res.data && Array.isArray(res.data.srtsite)) {
          list = res.data.srtsite;
        } else if (Array.isArray(res.srt_site)) {
          list = res.srt_site;
        } else if (res.data && Array.isArray(res.data.srt_site)) {
          list = res.data.srt_site;
        } else {
          const arrInRes = Object.values(res).find((v) => Array.isArray(v)) as any[] | undefined;
          if (arrInRes) {
            list = arrInRes;
          } else if (res.data && typeof res.data === 'object') {
            const arrInData = Object.values(res.data).find((v) => Array.isArray(v)) as any[] | undefined;
            if (arrInData) list = arrInData;
          }
        }
      }

      return list.map((s: any, idx: number) => {
        if (typeof s === 'string' || typeof s === 'number') {
          return {
            id: s,
            label: String(s),
            site_name: String(s),
          };
        }
        const id = s.id ?? s.site_id ?? s.site_name ?? idx + 1;
        const name = s.site_name ?? s.name ?? s.beneficiary_name ?? s.farmer_name ?? `Site #${id}`;
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
  }, []);

  const fetchSiteDetails = useCallback(async (id: number | string) => {
    try {
      const res: any = await upRescoAmcApi.getSiteDetails(id);
      const r =
        res?.data?.srtsite ||
        res?.srtsite ||
        res?.data?.srt_site ||
        res?.srt_site ||
        res?.data?.site_details ||
        res?.data?.site ||
        res?.site_details ||
        res?.site ||
        res?.data ||
        res;
      const d = Array.isArray(r) ? r[0] : r;
      if (d) {
        return {
          ...d,
          id: d.id ?? id,
          state: d.state || 'UP',
          district: d.district || d.f_district || d.installation_dsitrict || '',
          village: d.village || d.f_village || d.location || d.block || '',
          beneficiary_name: d.beneficiary_name || d.site_name || d.name || d.farmer_name || d.f_farmer_name || d.contact_person || '',
          contact: d.contact || d.mobile || d.f_mobile || d.contact_person_number || d.contact_number || d.contact_no || '',
          gender: d.gender || d.f_gender || '',
          phase: d.phase || d.f_phase || '',
          serial_number: d.serial_number || d.ca_no || d.consumer_no || d.f_sr_no || d.application_no || d.system_id || '',
          address: d.address || d.f_address || d.location || '',
          volume: d.volume || d.sanction_load || d.plant_sc || d.plant_capacity || d.capacity || '',
          contractor_name: d.contractor_name || d.vendor_name || '',
          amc_type: d.amc_type || 'Monthly',
        };
      }
      return null;
    } catch (err) {
      console.error('Error fetching Resco AMC site details:', err);
      return null;
    }
  }, []);

  const submitAmc = useCallback(async (formData: FormData) => {
    return upRescoAmcApi.storeSite(formData);
  }, []);

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
