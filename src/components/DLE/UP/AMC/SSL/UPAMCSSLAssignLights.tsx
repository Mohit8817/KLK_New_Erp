import { PageHead } from '../../../../shell/PageHead';

export function UPAMCSSLAssignLights() {
  return (
    <div className="ax-page">
      <PageHead
        title="DLE - Uttar Pradesh AMC SSL Assign Lights"
        subtitle="Assign SSL lights for AMC in Uttar Pradesh"
        breadcrumbs={[
          { label: 'DLE' },
          { label: 'Uttar Pradesh' },
          { label: 'AMC' },
          { label: 'SSL' },
          { label: 'Assign Lights' },
        ]}
      />
      <div className="ax-dash-grid">
        <div className="ax-card ax-col--12">
          <div className="ax-card__header">
            <h3 className="ax-card__title">Assign Lights</h3>
          </div>
          <div className="ax-card__body">
            <p>Assign SSL lights for AMC in Uttar Pradesh. (Content yahan add hoga.)</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default UPAMCSSLAssignLights;
