import { PageHead } from '../../../../shell/PageHead';

export function Bihar_Survey_ULA_ViewData() {
  return (
    <div className="ax-page">
      <PageHead
        title="Bihar - Survey > ULA > View Data"
        subtitle="View and manage ULA survey records for Bihar"
        breadcrumbs={[
          { label: 'Bihar' },
          { label: 'Survey' },
          { label: 'ULA' },
          { label: 'View Data' },
        ]}
      />
      <div className="ax-dash-grid">
        <div className="ax-card ax-col--12">
          <div className="ax-card__header">
            <h3 className="ax-card__title">ULA Survey Records</h3>
          </div>
          <div className="ax-card__body">
            <p>Bihar ULA (Unnat Lok Abhiyan) survey data listing, verification, and inspection table.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Bihar_Survey_ULA_ViewData;
