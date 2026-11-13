import { UPModulePlaceholder } from '../../common/UPModulePlaceholder';

export function UPRescoSurveyVerify() {
  return (
    <UPModulePlaceholder
      title="Verify Survey (Resco)"
      category="Survey"
      subCategory="Resco Survey"
      description="Super Admin technical validation of uploaded rooftop shadow analysis, structural feasibility, GPS coordinates, and SLD diagrams for UP Resco."
      icon="survey"
      metrics={[
        { label: 'Surveys Uploaded', value: '0', sub: 'Submitted by Surveyors', color: '#4f46e5' },
        { label: 'Feasible & Approved', value: '0', sub: 'Ready for Installation', color: '#10b981' },
        { label: 'Pending Verification', value: '0', sub: 'Under Technical Scrutiny', color: '#f59e0b' },
        { label: 'Unfeasible / Rejected', value: '0', sub: 'Shadow / Structural Issues', color: '#ef4444' },
      ]}
    />
  );
}

export default UPRescoSurveyVerify;
