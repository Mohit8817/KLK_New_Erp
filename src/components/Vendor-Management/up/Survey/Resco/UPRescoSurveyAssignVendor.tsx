import { UPModulePlaceholder } from '../../common/UPModulePlaceholder';

export function UPRescoSurveyAssignVendor() {
  return (
    <UPModulePlaceholder
      title="Assigned Sites Update (Resco Survey)"
      category="Survey"
      subCategory="Resco Survey"
      description="Update vendor survey assignments, reallocate survey quotas, modify site boundaries, and update site survey data in Uttar Pradesh."
      icon="assign"
      metrics={[
        { label: 'Active Vendor Assignments', value: '0', sub: 'Survey Sites', color: '#4f46e5' },
        { label: 'Quota Updated', value: '0', sub: 'Reallocated Batches', color: '#2563eb' },
        { label: 'Sites Rescheduled', value: '0', sub: 'Updated Sites', color: '#10b981' },
        { label: 'Survey Exceptions', value: '0', sub: 'Action Required', color: '#f59e0b' },
      ]}
    />
  );
}

export default UPRescoSurveyAssignVendor;
