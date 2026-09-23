/*
 * Vireo React — crypto pill sub-nav shared by the five crypto section pages
 * (wallet / exchange / buy-sell / marketcap / transactions). Mirrors the
 * .ax-tabs--pill block at the top of each reference crypto page; the active tab
 * is set per page.
 */
import { Link } from 'react-router-dom';

type CryptoTab = 'wallet' | 'exchange' | 'buy-sell' | 'marketcap' | 'transactions';

const TABS: { id: CryptoTab; label: string; to: string }[] = [
  { id: 'wallet', label: 'Wallet', to: '/crypto/wallet' },
  { id: 'exchange', label: 'Exchange', to: '/crypto/exchange' },
  { id: 'buy-sell', label: 'Buy & Sell', to: '/crypto/buy-sell' },
  { id: 'marketcap', label: 'Marketcap', to: '/crypto/marketcap' },
  { id: 'transactions', label: 'Transactions', to: '/crypto/transactions' },
];

export function CryptoSubNav({ active }: { active: CryptoTab }) {
  return (
    <nav className="ax-tabs ax-tabs--pill ax-tabs--scrollable" aria-label="Crypto sections" style={{ marginBottom: 'var(--ax-space-5)' }}>
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

export default CryptoSubNav;
