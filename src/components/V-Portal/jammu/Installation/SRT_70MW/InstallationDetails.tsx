import { PageHead } from '../../../../shell/PageHead';

export function InstallationDetails() {
  return (
    <div className="ax-page">
      <PageHead
        title="Jammu SRT 70MW - Installation Details"
        subtitle="Detailed technical specs, inspection reports, and site documentation"
        breadcrumbs={[
          { label: 'Jammu & Kashmir' },
          { label: 'Installation' },
          { label: 'SRT 70MW' },
          { label: 'Installation Details' },
        ]}
      />

      <div className="ax-dash-grid">
        <div className="ax-card ax-col--6">
          <div className="ax-card__header">
            <h3 className="ax-card__title">Site Specs Summary</h3>
          </div>
          <div className="ax-card__body">
            <p><strong>Total Installed Capacity:</strong> 42.5 MW / 70 MW</p>
            <p><strong>Active Sites:</strong> 142 sites</p>
            <p><strong>Inverters Commissioned:</strong> 310 Units</p>
            <p><strong>Net Meters Installed:</strong> 118 Units</p>
          </div>
        </div>

        <div className="ax-card ax-col--6">
          <div className="ax-card__header">
            <h3 className="ax-card__title">Document Audit Status</h3>
          </div>
          <div className="ax-card__body">
            <p><strong>Inspection Certificates:</strong> 128 Verified</p>
            <p><strong>JPDCL Approval:</strong> 110 Approved</p>
            <p><strong>Safety Sign-off:</strong> 135 Completed</p>
            <p><strong>Vendor Warranty Cards:</strong> Submitted</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default InstallationDetails;
