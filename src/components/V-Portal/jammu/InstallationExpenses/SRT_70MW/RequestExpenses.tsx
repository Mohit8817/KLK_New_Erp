import { PageHead } from '../../../../shell/PageHead';

export function RequestExpenses() {
  return (
    <div className="ax-page">
      <PageHead
        title="Jammu SRT 70MW - Request Expenses"
        subtitle="Submit field expense requests, transport vouchers, and site mobilization costs"
        breadcrumbs={[
          { label: 'Jammu & Kashmir' },
          { label: 'Installation Expenses' },
          { label: 'SRT 70MW' },
          { label: 'Request Expenses' },
        ]}
      />
      <div className="ax-dash-grid">
        <div className="ax-card ax-col--12">
          <div className="ax-card__header">
            <h3 className="ax-card__title">Create Expense Requisition Form</h3>
          </div>
          <div className="ax-card__body">
            <p>Log project site ID, expense head (Travel, Material Handling, Contingency, Labor), amount, and attach receipts.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RequestExpenses;
