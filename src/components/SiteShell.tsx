import { useState } from 'react';
import { ArrowUpRight, Compass, Menu, X } from 'lucide-react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { usePrototype } from '../lib/PrototypeContext';

function Wordmark() {
  return (
    <Link className="wordmark" to="/" aria-label="Career Discovery home">
      <span className="wordmark-mark" aria-hidden="true">
        <svg viewBox="0 0 40 40" fill="none">
          <path d="M8 29V21c0-4 2.5-6 6-6h7c4 0 6-2.5 6-6M8 21c0 4 2.5 6 6 6h7c4 0 6 2.5 6 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
          <circle cx="8" cy="29" r="2.25" fill="#D2A45F" />
          <circle cx="27" cy="9" r="2.25" fill="currentColor" />
          <circle cx="27" cy="33" r="2.25" fill="currentColor" />
        </svg>
      </span>
      <span className="wordmark-type"><strong>Career</strong><span>Discovery</span></span>
    </Link>
  );
}

export function SiteShell() {
  const [open, setOpen] = useState(false);
  const [logoutError, setLogoutError] = useState('');
  const { authStatus, user, signOut } = usePrototype();
  const navigate = useNavigate();
  const closeMenu = () => setOpen(false);
  const isSignedIn = authStatus === 'authenticated' && Boolean(user);

  const handleSignOut = async () => {
    setLogoutError('');
    try {
      await signOut();
      closeMenu();
      navigate('/');
    } catch {
      setLogoutError('We could not sign you out. Please try again.');
    }
  };

  const startPath = isSignedIn ? '/onboarding' : '/login';
  return (
    <div className="site-frame">
      <a className="skip-link" href="#main-content">Skip to content</a>
      <header className="site-header">
        <div className="header-inner">
          <Wordmark />
          <button className="menu-toggle" type="button" onClick={() => setOpen((value) => !value)} aria-label={open ? 'Close navigation menu' : 'Open navigation menu'} aria-expanded={open}>
            {open ? <X size={21} /> : <Menu size={21} />}
          </button>
          <nav className={`primary-nav ${open ? 'is-open' : ''}`} aria-label="Main navigation">
            <NavLink onClick={closeMenu} to="/how-it-works" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>How it works</NavLink>
            {isSignedIn ? <NavLink onClick={closeMenu} to="/dashboard" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>My space</NavLink> : <Link onClick={closeMenu} className="nav-link" to="/login">Sign in</Link>}
            <NavLink onClick={closeMenu} to="/privacy" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>Privacy</NavLink>
            {isSignedIn && <button className="button button-small button-secondary" type="button" onClick={handleSignOut}>Sign out</button>}
            <Link onClick={closeMenu} className="button button-small button-dark nav-cta" to={startPath}>{isSignedIn ? 'Continue discovery' : 'Sign in to begin'} <ArrowUpRight size={15} /></Link>
          </nav>
        </div>
      </header>
      {logoutError && <div className="content-wrap"><p className="form-error" role="alert">{logoutError}</p></div>}
      <main id="main-content" className="site-main"><Outlet /></main>
      <footer className="site-footer">
        <div className="footer-inner">
          <div className="footer-brand"><Compass size={19} strokeWidth={1.7} /><span>Career Discovery</span></div>
          <p>Exploration, not a verdict. This is not a validated assessment.</p>
          <div className="footer-links"><Link to="/how-it-works">Method</Link><Link to="/privacy">Privacy</Link>{isSignedIn && <Link to="/settings">Settings</Link>}</div>
        </div>
      </footer>
    </div>
  );
}
