import { UPModulePlaceholder } from '../../common/UPModulePlaceholder';

export function UPRescoSurveyAssign() {
  return (
    <UPModulePlaceholder
      title="Assign Survey (Resco)"
      category="Survey"
      subCategory="Resco Survey"
      description="Allot UP Resco rooftop solar survey sites, building locations, and consumer applications to certified survey agencies."
      icon="assign"
      metrics={[
        { label: 'Unassigned Survey Sites', value: '0', sub: 'Ready for Field Survey', color: '#4f46e5' },
        { label: 'Active Survey Agencies', value: '0', sub: 'Authorized Surveyors', color: '#2563eb' },
        { label: 'Batches Issued', value: '0', sub: 'Current Term', color: '#10b981' },
        { label: 'Pending Acceptance', value: '0', sub: 'Agency Review', color: '#f59e0b' },
      ]}
    />
  );
}

export default UPRescoSurveyAssign;
