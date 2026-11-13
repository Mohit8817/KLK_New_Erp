import { UPModulePlaceholder } from '../../common/UPModulePlaceholder';

export function UPRescoSurveyDashboard() {
  return (
    <UPModulePlaceholder
      title="Resco Survey Dashboard"
      category="Survey"
      subCategory="Resco Survey"
      description="Executive overview of Uttar Pradesh Resco rooftop solar pre-installation surveys, feasibility audits, and vendor field allocations."
      icon="dashboard"
      metrics={[
        { label: 'Surveys Sanctioned', value: '0', sub: 'UP Target Sites', color: '#4f46e5' },
        { label: 'Assigned to Surveyors', value: '0', sub: 'In Field', color: '#2563eb' },
        { label: 'Completed Surveys', value: '0', sub: 'Feasible Sites', color: '#10b981' },
        { label: 'Pending Verification', value: '0', sub: 'Awaiting Audit', color: '#f59e0b' },
        { label: 'Total Assessed MW', value: '0 kW', sub: 'Rooftop Capacity', color: '#7c3aed' },
      ]}
    />
  );
}

export default UPRescoSurveyDashboard;
