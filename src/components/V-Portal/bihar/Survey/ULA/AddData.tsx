import { PageHead } from '../../../../shell/PageHead';

export function Bihar_Survey_ULA_AddData() {
  return (
    <div className="ax-page">
      <PageHead
        title="Bihar - Survey > ULA > Add Data"
        subtitle="Add new ULA survey record for Bihar"
        breadcrumbs={[
          { label: 'Bihar' },
          { label: 'Survey' },
          { label: 'ULA' },
          { label: 'Add Data' },
        ]}
      />
      <div className="ax-dash-grid">
        <div className="ax-card ax-col--12">
          <div className="ax-card__header">
            <h3 className="ax-card__title">Add ULA Survey Record</h3>
          </div>
          <div className="ax-card__body">
            <p>Bihar ULA (Unnat Lok Abhiyan) survey data collection and entry portal.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Bihar_Survey_ULA_AddData;
