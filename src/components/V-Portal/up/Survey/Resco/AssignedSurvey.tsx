import { PageHead } from '../../../../shell/PageHead';

export function UP_Survey_Resco_AssignedSurvey() {
  return (
    <div className="ax-page">
      <PageHead
        title="Uttar Pradesh - Survey > Resco > AssignedSurvey"
        subtitle="AssignedSurvey management portal for Uttar Pradesh operations"
        breadcrumbs={[
          { label: 'Uttar Pradesh' },
          { label: 'Survey' },
          { label: 'Resco' },
          { label: 'AssignedSurvey' },
        ]}
      />
      <div className="ax-dash-grid">
        <div className="ax-card ax-col--12">
          <div className="ax-card__header">
            <h3 className="ax-card__title">AssignedSurvey Overview</h3>
          </div>
          <div className="ax-card__body">
            <p>Uttar Pradesh Survey - Resco - AssignedSurvey operational data and details.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default UP_Survey_Resco_AssignedSurvey;