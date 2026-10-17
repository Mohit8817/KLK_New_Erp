import { PageHead } from '../../../../shell/PageHead';

export function Bihar_Installation_ULA_InstallationDetails() {
  return (
    <div className="ax-page">
      <PageHead
        title="Bihar - Installation > ULA > Installation Details"
        subtitle="Manage pending structure and installation details for ULA sites"
        breadcrumbs={[
          { label: 'Bihar' },
          { label: 'Installation' },
          { label: 'ULA' },
          { label: 'Installation Details' },
        ]}
      />
      <div className="ax-dash-grid">
        <div className="ax-card ax-col--12">
          <div className="ax-card__header">
            <h3 className="ax-card__title">Structure & Module Installation Details</h3>
          </div>
          <div className="ax-card__body">
            <p>Fill structure installation data, module serials, earthing parameters, and upload stage images.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Bihar_Installation_ULA_InstallationDetails;
