import { PageHead } from '../../../../shell/PageHead';

export function Bihar_Survey_SRT200MW_AddData() {
  return (
    <div className="ax-page">
      <PageHead
        title="Bihar - Survey > SRT200MW > Add Data"
        subtitle="Add new 200MW SRT solar rooftop survey record for Bihar"
        breadcrumbs={[
          { label: 'Bihar' },
          { label: 'Survey' },
          { label: 'SRT200MW' },
          { label: 'Add Data' },
        ]}
      />
      <div className="ax-dash-grid">
        <div className="ax-card ax-col--12">
          <div className="ax-card__header">
            <h3 className="ax-card__title">Add 200MW SRT Survey Record</h3>
          </div>
          <div className="ax-card__body">
            <p>Bihar 200MW Solar Rooftop (SRT) survey data entry and verification portal.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Bihar_Survey_SRT200MW_AddData;
