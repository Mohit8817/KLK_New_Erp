import { PageHead } from '../../../../shell/PageHead';

export function AMCRescoViewSurvey() {
  return (
    <div className="ax-page">
      <PageHead
        title="Jammu AMC - Resco View Survey"
        subtitle="View completed RESCO AMC inspection reports and health logs"
        breadcrumbs={[
          { label: 'Jammu & Kashmir' },
          { label: 'AMC' },
          { label: 'Resco' },
          { label: 'View Survey' },
        ]}
      />
      <div className="ax-dash-grid">
        <div className="ax-card ax-col--12">
          <div className="ax-card__header">
            <h3 className="ax-card__title">Completed AMC Survey Records</h3>
          </div>
          <div className="ax-card__body">
            <p>Archive of completed annual maintenance inspections and health scores for RESCO sites.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AMCRescoViewSurvey;
