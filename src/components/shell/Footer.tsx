/*
 * Vireo React — Footer (1:1 with partials/footer.html).
 */
import { Link } from 'react-router-dom';

export function Footer() {
  return (
    <footer className="ax-footer">
      <div className="ax-footer__left">
        <span className="ax-footer__copy">© 2026 Vireo</span>
        <span className="ax-footer__sep" aria-hidden="true">·</span>
        <span className="ax-footer__version ax-mono">v1.0.0</span>
      </div>
      <nav className="ax-footer__links" aria-label="Footer">
        <Link className="ax-footer__link" to="/pages/landing">About</Link>
        <Link className="ax-footer__link" to="/pages/support">Support</Link>
        <Link className="ax-footer__link" to="/pages/terms">Terms</Link>
        <Link className="ax-footer__link" to="/pages/privacy">Privacy</Link>
      </nav>
    </footer>
  );
}

export default Footer;
