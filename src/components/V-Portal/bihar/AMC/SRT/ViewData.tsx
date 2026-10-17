import { PageHead } from '../../../../shell/PageHead';

export function Bihar_AMC_SRT_ViewData() {
  return (
    <div className="ax-page">
      <PageHead
        title="Bihar - AMC > SRT > View Data"
        subtitle="Review completed AMC maintenance logs for Bihar SRT"
        breadcrumbs={[
          { label: 'Bihar' },
          { label: 'AMC' },
          { label: 'SRT' },
          { label: 'View Data' },
        ]}
      />
      <div className="ax-dash-grid">
        <div className="ax-card ax-col--12">
          <div className="ax-card__header">
            <h3 className="ax-card__title">SRT AMC Maintenance Archive</h3>
          </div>
          <div className="ax-card__body">
            <p>Complete directory of maintenance visits, inverter telemetry checks, and technician signs.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Bihar_AMC_SRT_ViewData;
