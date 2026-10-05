import { PageHead } from '../../../../shell/PageHead';

export function UP_Survey_SSL_Survey() {
  return (
    <div className="ax-page">
      <PageHead
        title="Uttar Pradesh - Survey > SSL > Survey"
        subtitle="Survey management portal for Uttar Pradesh operations"
        breadcrumbs={[
          { label: 'Uttar Pradesh' },
          { label: 'Survey' },
          { label: 'SSL' },
          { label: 'Survey' },
        ]}
      />
      <div className="ax-dash-grid">
        <div className="ax-card ax-col--12">
          <div className="ax-card__header">
            <h3 className="ax-card__title">Survey Overview</h3>
          </div>
          <div className="ax-card__body">
            <p>Uttar Pradesh Survey - SSL - Survey operational data and details.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default UP_Survey_SSL_Survey;