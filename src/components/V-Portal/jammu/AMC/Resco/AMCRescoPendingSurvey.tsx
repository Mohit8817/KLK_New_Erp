import { PageHead } from '../../../../shell/PageHead';

export function AMCRescoPendingSurvey() {
  return (
    <div className="ax-page">
      <PageHead
        title="Jammu AMC - Resco Pending Survey"
        subtitle="Track pending AMC health check surveys for RESCO sites"
        breadcrumbs={[
          { label: 'Jammu & Kashmir' },
          { label: 'AMC' },
          { label: 'Resco' },
          { label: 'Pending Survey' },
        ]}
      />
      <div className="ax-dash-grid">
        <div className="ax-card ax-col--12">
          <div className="ax-card__header">
            <h3 className="ax-card__title">Pending AMC Surveys</h3>
          </div>
          <div className="ax-card__body">
            <p>List of RESCO sites scheduled for mandatory periodic maintenance inspection.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AMCRescoPendingSurvey;
