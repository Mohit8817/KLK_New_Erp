/*
 * Vireo React — CRM pill sub-nav shared by the four CRM section pages
 * (contacts / companies / deals / leads). Mirrors the .ax-tabs--pill block
 * at the top of each reference CRM page; the active tab is set per page.
 */
import { Link } from 'react-router-dom';

type CrmTab = 'contacts' | 'companies' | 'deals' | 'leads';

const TABS: { id: CrmTab; label: string; to: string }[] = [
  { id: 'contacts', label: 'Contacts', to: '/crm/contacts' },
  { id: 'companies', label: 'Companies', to: '/crm/companies' },
  { id: 'deals', label: 'Deals', to: '/crm/deals' },
  { id: 'leads', label: 'Leads', to: '/crm/leads' },
];

export function CrmSubNav({ active }: { active: CrmTab }) {
  return (
    <nav className="ax-tabs ax-tabs--pill ax-tabs--scrollable" aria-label="CRM sections" style={{ marginBottom: 'var(--ax-space-5)' }}>
      <div className="ax-tabs__list" role="tablist">
        {TABS.map((t) =>
          t.id === active ? (
            <Link key={t.id} className="ax-tabs__tab is-active" role="tab" aria-selected="true" aria-current="page" to={t.to}>{t.label}</Link>
          ) : (
            <Link key={t.id} className="ax-tabs__tab" role="tab" to={t.to}>{t.label}</Link>
          ),
        )}
      </div>
    </nav>
  );
}

export default CrmSubNav;
