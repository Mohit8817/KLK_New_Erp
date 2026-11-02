import { PageHead } from '../../../../shell/PageHead';
import { TableEmptyState } from '../../../../../common';

export function Kashmir_Installation_InstallSites() {
  return (
    <div className="solar-erp-page">
      <PageHead
        title="Install Sites"
        subtitle="Welcome to Kashmir SRT 70MW Install Sites"
        breadcrumbs={[
          { label: 'Home', href: '/v-dashboard' },
          { label: 'Kashmir' },
          { label: 'Installation' },
          { label: 'SRT 70MW' },
          { label: 'Install Sites' },
        ]}
      />

      <section className="ax-card ax-col--12" style={{ padding: 40, textAlign: 'center' }}>
        <TableEmptyState
          message="No active site selected for installation. Please select a site from Assign Sites to proceed."
        />
      </section>
    </div>
  );
}
export default Kashmir_Installation_InstallSites;
