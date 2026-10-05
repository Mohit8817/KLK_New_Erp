import { PageHead } from '../../../../shell/PageHead';

export function UP_AMC_Offgrid_ViewAssignAMC() {
  return (
    <div className="ax-page">
      <PageHead
        title="Uttar Pradesh - AMC > Offgrid > ViewAssignAMC"
        subtitle="ViewAssignAMC management portal for Uttar Pradesh operations"
        breadcrumbs={[
          { label: 'Uttar Pradesh' },
          { label: 'AMC' },
          { label: 'Offgrid' },
          { label: 'ViewAssignAMC' },
        ]}
      />
      <div className="ax-dash-grid">
        <div className="ax-card ax-col--12">
          <div className="ax-card__header">
            <h3 className="ax-card__title">ViewAssignAMC Overview</h3>
          </div>
          <div className="ax-card__body">
            <p>Uttar Pradesh AMC - Offgrid - ViewAssignAMC operational data and details.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default UP_AMC_Offgrid_ViewAssignAMC;