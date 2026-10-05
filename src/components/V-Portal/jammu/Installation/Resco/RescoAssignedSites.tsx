import { PageHead } from '../../../../shell/PageHead';

export function RescoAssignedSites() {
  return (
    <div className="ax-page">
      <PageHead
        title="Jammu RESCO - Assigned Sites"
        subtitle="RESCO solar site assignments, EPC developer allocations, and location mapping"
        breadcrumbs={[
          { label: 'Jammu & Kashmir' },
          { label: 'Installation' },
          { label: 'Resco' },
          { label: 'Assigned Sites' },
        ]}
      />
      <div className="ax-dash-grid">
        <div className="ax-card ax-col--12">
          <div className="ax-card__header">
            <h3 className="ax-card__title">Assigned RESCO Sites</h3>
          </div>
          <div className="ax-card__body">
            <p>View government and institutional rooftop sites allocated under the RESCO model.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RescoAssignedSites;
