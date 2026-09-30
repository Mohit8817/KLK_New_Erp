import { PageHead } from '../../../../shell/PageHead';

export function BiharAMCSSLViewSurveyLight() {
  return (
    <div className="ax-page">
      <PageHead
        title="DLE - Bihar AMC SSL View Survey Light"
        subtitle="View surveyed / verified SSL lights in Bihar"
        breadcrumbs={[
          { label: 'DLE' },
          { label: 'Bihar' },
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
            <p>View surveyed / verified SSL lights in Bihar. (Content yahan add hoga.)</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default BiharAMCSSLViewSurveyLight;
