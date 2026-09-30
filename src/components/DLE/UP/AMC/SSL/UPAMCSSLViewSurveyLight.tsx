import { PageHead } from '../../../../shell/PageHead';

export function UPAMCSSLViewSurveyLight() {
  return (
    <div className="ax-page">
      <PageHead
        title="DLE - Uttar Pradesh AMC SSL View Survey Light"
        subtitle="View surveyed / verified SSL lights in Uttar Pradesh"
        breadcrumbs={[
          { label: 'DLE' },
          { label: 'Uttar Pradesh' },
          { label: 'AMC' },
          { label: 'SSL' },
          { label: 'View Survey Light' },
        ]}
      />
      <div className="ax-dash-grid">
        <div className="ax-card ax-col--12">
          <div className="ax-card__header">
            <h3 className="ax-card__title">View Survey Light</h3>
          </div>
          <div className="ax-card__body">
            <p>View surveyed / verified SSL lights in Uttar Pradesh. (Content yahan add hoga.)</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default UPAMCSSLViewSurveyLight;
