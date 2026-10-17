import { PageHead } from '../../../../shell/PageHead';

export function Bihar_Installation_ULA_RequestAccept() {
  return (
    <div className="ax-page">
      <PageHead
        title="Bihar - Installation > ULA > Request Accept"
        subtitle="Review and accept assigned ULA solar installation sites"
        breadcrumbs={[
          { label: 'Bihar' },
          { label: 'Installation' },
          { label: 'ULA' },
          { label: 'Request Accept' },
        ]}
      />
      <div className="ax-dash-grid">
        <div className="ax-card ax-col--12">
          <div className="ax-card__header">
            <h3 className="ax-card__title">Assigned ULA Sites Queue</h3>
          </div>
          <div className="ax-card__body">
            <p>Queue of assigned ULA sites pending vendor acceptance and mobilization.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Bihar_Installation_ULA_RequestAccept;
