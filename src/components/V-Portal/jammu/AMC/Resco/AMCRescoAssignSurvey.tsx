import { PageHead } from '../../../../shell/PageHead';

export function AMCRescoAssignSurvey() {
  return (
    <div className="ax-page">
      <PageHead
        title="Jammu AMC - Resco Assign Survey"
        subtitle="Assign AMC site inspection surveys for RESCO solar projects"
        breadcrumbs={[
          { label: 'Jammu & Kashmir' },
          { label: 'AMC' },
          { label: 'Resco' },
          { label: 'Assign Survey' },
        ]}
      />
      <div className="ax-dash-grid">
        <div className="ax-card ax-col--12">
          <div className="ax-card__header">
            <h3 className="ax-card__title">Assign RESCO AMC Survey</h3>
          </div>
          <div className="ax-card__body">
            <p>Allocate technical maintenance survey teams to inspect RESCO rooftop installations.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AMCRescoAssignSurvey;
