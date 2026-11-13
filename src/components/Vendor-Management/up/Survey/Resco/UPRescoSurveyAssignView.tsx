import { UPModulePlaceholder } from '../../common/UPModulePlaceholder';

export function UPRescoSurveyAssignView() {
  return (
    <UPModulePlaceholder
      title="Assign View Survey (Resco)"
      category="Survey"
      subCategory="Resco Survey"
      description="Track and inspect all assigned UP Resco rooftop survey allocations, survey agency acceptance, and progress milestones."
      icon="assign"
      metrics={[
        { label: 'Total Allocated Surveys', value: '0', sub: 'Assigned Batches', color: '#4f46e5' },
        { label: 'Agency Accepted', value: '0', sub: 'Under Survey', color: '#10b981' },
        { label: 'Pending Acceptance', value: '0', sub: 'Awaiting Agency', color: '#f59e0b' },
        { label: 'Super Admin Approved', value: '0', sub: 'Cleared', color: '#7c3aed' },
      ]}
    />
  );
}

export default UPRescoSurveyAssignView;
