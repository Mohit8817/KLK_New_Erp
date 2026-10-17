import { PageHead } from '../../../../shell/PageHead';

export function Bihar_Installation_SRT_RequestAccept() {
  return (
    <div className="ax-page">
      <PageHead
        title="Bihar - Installation > SRT > Request Accept"
        subtitle="Accept or decline assigned SRT solar rooftop sites"
        breadcrumbs={[
          { label: 'Bihar' },
          { label: 'Installation' },
          { label: 'SRT' },
          { label: 'Request Accept' },
        ]}
      />
      <div className="ax-dash-grid">
        <div className="ax-card ax-col--12">
          <div className="ax-card__header">
            <h3 className="ax-card__title">Assigned SRT Sites Queue</h3>
          </div>
          <div className="ax-card__body">
            <p>Review newly assigned consumer rooftop sites, capacity requirements, and accept installation work orders.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Bihar_Installation_SRT_RequestAccept;
