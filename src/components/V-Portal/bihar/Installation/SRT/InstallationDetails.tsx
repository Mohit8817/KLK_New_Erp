import { PageHead } from '../../../../shell/PageHead';

export function Bihar_Installation_SRT_InstallationDetails() {
  return (
    <div className="ax-page">
      <PageHead
        title="Bihar - Installation > SRT > Installation Details"
        subtitle="Submit module, inverter, BOS, and installation site parameters"
        breadcrumbs={[
          { label: 'Bihar' },
          { label: 'Installation' },
          { label: 'SRT' },
          { label: 'Installation Details' },
        ]}
      />
      <div className="ax-dash-grid">
        <div className="ax-card ax-col--12">
          <div className="ax-card__header">
            <h3 className="ax-card__title">Site Installation Execution</h3>
          </div>
          <div className="ax-card__body">
            <p>Update solar panel serials, inverter capacity, net-metering status, and installation work completion photos.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Bihar_Installation_SRT_InstallationDetails;
