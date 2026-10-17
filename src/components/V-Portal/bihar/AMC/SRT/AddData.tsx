import { PageHead } from '../../../../shell/PageHead';

export function Bihar_AMC_SRT_AddData() {
  return (
    <div className="ax-page">
      <PageHead
        title="Bihar - AMC > SRT > Add Data"
        subtitle="Log periodic AMC service routines for Bihar Solar Rooftop systems"
        breadcrumbs={[
          { label: 'Bihar' },
          { label: 'AMC' },
          { label: 'SRT' },
          { label: 'Add Data' },
        ]}
      />
      <div className="ax-dash-grid">
        <div className="ax-card ax-col--12">
          <div className="ax-card__header">
            <h3 className="ax-card__title">Create SRT AMC Service Record</h3>
          </div>
          <div className="ax-card__body">
            <p>Log quarterly AMC performance testing, AC/DC voltage checks, and module washing audits.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Bihar_AMC_SRT_AddData;
