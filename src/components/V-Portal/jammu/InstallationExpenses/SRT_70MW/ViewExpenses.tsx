import { PageHead } from '../../../../shell/PageHead';

export function ViewExpenses() {
  return (
    <div className="ax-page">
      <PageHead
        title="Jammu SRT 70MW - View Expenses"
        subtitle="Review submitted installation expense requests, approval status, and audit logs"
        breadcrumbs={[
          { label: 'Jammu & Kashmir' },
          { label: 'Installation Expenses' },
          { label: 'SRT 70MW' },
          { label: 'View Expenses' },
        ]}
      />
      <div className="ax-dash-grid">
        <div className="ax-card ax-col--12">
          <div className="ax-card__header">
            <h3 className="ax-card__title">Site Expense Summary Table</h3>
          </div>
          <div className="ax-card__body">
            <p>List of all site installation expense requests with manager approval details.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ViewExpenses;
