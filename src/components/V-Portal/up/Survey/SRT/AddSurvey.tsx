import { PageHead } from '../../../../shell/PageHead';

export function UP_Survey_SRT_AddSurvey() {
  return (
    <div className="ax-page">
      <PageHead
        title="Uttar Pradesh - Survey > SRT > Add Survey"
        subtitle="Add new SRT solar rooftop survey record for Uttar Pradesh"
        breadcrumbs={[
          { label: 'Uttar Pradesh' },
          { label: 'Survey' },
          { label: 'SRT' },
          { label: 'Add Survey' },
        ]}
      />
      <div className="ax-dash-grid">
        <div className="ax-card ax-col--12">
          <div className="ax-card__header">
            <h3 className="ax-card__title">Create SRT Survey</h3>
          </div>
          <div className="ax-card__body">
            <p>Uttar Pradesh SRT Rooftop survey form & creation portal.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default UP_Survey_SRT_AddSurvey;
