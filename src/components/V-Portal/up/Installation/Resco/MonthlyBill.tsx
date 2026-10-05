import { PageHead } from '../../../../shell/PageHead';

export function UP_Installation_Resco_MonthlyBill() {
  return (
    <div className="ax-page">
      <PageHead
        title="Uttar Pradesh - Installation > Resco > MonthlyBill"
        subtitle="MonthlyBill management portal for Uttar Pradesh operations"
        breadcrumbs={[
          { label: 'Uttar Pradesh' },
          { label: 'Installation' },
          { label: 'Resco' },
          { label: 'MonthlyBill' },
        ]}
      />
      <div className="ax-dash-grid">
        <div className="ax-card ax-col--12">
          <div className="ax-card__header">
            <h3 className="ax-card__title">MonthlyBill Overview</h3>
          </div>
          <div className="ax-card__body">
            <p>Uttar Pradesh Installation - Resco - MonthlyBill operational data and details.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default UP_Installation_Resco_MonthlyBill;