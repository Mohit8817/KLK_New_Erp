import { PageHead } from '../../../../shell/PageHead';

export function UP_Survey_SRT_ViewSurvey() {
  return (
    <div className="ax-page">
      <PageHead
        title="Uttar Pradesh - Survey > SRT > View Survey"
        subtitle="View and verify SRT solar rooftop survey records for Uttar Pradesh"
        breadcrumbs={[
          { label: 'Uttar Pradesh' },
          { label: 'Survey' },
          { label: 'SRT' },
          { label: 'View Survey' },
        ]}
      />
      <div className="ax-dash-grid">
        <div className="ax-card ax-col--12">
          <div className="ax-card__header">
            <h3 className="ax-card__title">SRT Survey Records</h3>
          </div>
          <div className="ax-card__body">
            <p>Uttar Pradesh SRT Rooftop survey records and verification details.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default UP_Survey_SRT_ViewSurvey;
