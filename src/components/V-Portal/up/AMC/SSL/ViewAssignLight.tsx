import { PageHead } from '../../../../shell/PageHead';

export function UP_AMC_SSL_ViewAssignLight() {
  return (
    <div className="ax-page">
      <PageHead
        title="Uttar Pradesh - AMC > SSL > ViewAssignLight"
        subtitle="ViewAssignLight management portal for Uttar Pradesh operations"
        breadcrumbs={[
          { label: 'Uttar Pradesh' },
          { label: 'AMC' },
          { label: 'SSL' },
          { label: 'ViewAssignLight' },
        ]}
      />
      <div className="ax-dash-grid">
        <div className="ax-card ax-col--12">
          <div className="ax-card__header">
            <h3 className="ax-card__title">ViewAssignLight Overview</h3>
          </div>
          <div className="ax-card__body">
            <p>Uttar Pradesh AMC - SSL - ViewAssignLight operational data and details.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default UP_AMC_SSL_ViewAssignLight;