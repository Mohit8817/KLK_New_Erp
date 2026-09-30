import { PageHead } from '../../../../shell/PageHead';

export function BiharAMCSSLViewAssignLight() {
  return (
    <div className="ax-page">
      <PageHead
        title="DLE - Bihar AMC SSL View Assign Light"
        subtitle="View assigned SSL lights for AMC in Bihar"
        breadcrumbs={[
          { label: 'DLE' },
          { label: 'Bihar' },
          { label: 'AMC' },
          { label: 'SSL' },
          { label: 'View Assign Light' },
        ]}
      />
      <div className="ax-dash-grid">
        <div className="ax-card ax-col--12">
          <div className="ax-card__header">
            <h3 className="ax-card__title">View Assign Light</h3>
          </div>
          <div className="ax-card__body">
            <p>View assigned SSL lights for AMC in Bihar. (Content yahan add hoga.)</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default BiharAMCSSLViewAssignLight;
