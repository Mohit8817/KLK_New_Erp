import { PageHead } from '../../../../shell/PageHead';

export function Bihar_AMC_SSL_AddData() {
  return (
    <div className="ax-page">
      <PageHead
        title="Bihar - AMC > SSL > Add Data"
        subtitle="Record periodic AMC maintenance and service visits for Bihar SSL lights"
        breadcrumbs={[
          { label: 'Bihar' },
          { label: 'AMC' },
          { label: 'SSL' },
          { label: 'Add Data' },
        ]}
      />
      <div className="ax-dash-grid">
        <div className="ax-card ax-col--12">
          <div className="ax-card__header">
            <h3 className="ax-card__title">Log SSL AMC Service Record</h3>
          </div>
          <div className="ax-card__body">
            <p>Enter AMC service inspection checklist, cleaning of PV module, battery health, and pole status.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Bihar_AMC_SSL_AddData;
