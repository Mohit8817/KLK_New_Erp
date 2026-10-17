import { PageHead } from '../../../../shell/PageHead';

export function Bihar_Survey_SRT200MW_ViewData() {
  return (
    <div className="ax-page">
      <PageHead
        title="Bihar - Survey > SRT200MW > View Data"
        subtitle="View and verify 200MW SRT solar rooftop survey records for Bihar"
        breadcrumbs={[
          { label: 'Bihar' },
          { label: 'Survey' },
          { label: 'SRT200MW' },
          { label: 'View Data' },
        ]}
      />
      <div className="ax-dash-grid">
        <div className="ax-card ax-col--12">
          <div className="ax-card__header">
            <h3 className="ax-card__title">200MW SRT Survey Records</h3>
          </div>
          <div className="ax-card__body">
            <p>Bihar 200MW Solar Rooftop (SRT) survey records overview and management.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Bihar_Survey_SRT200MW_ViewData;
