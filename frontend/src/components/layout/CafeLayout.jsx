import { useState } from 'react';
import { Link, NavLink } from 'react-router';

export const asset = (file) => `${import.meta.env.BASE_URL}figma/${file}`;

export function Icon({ file, className }) {
  return <img className={className} src={asset(file)} alt="" />;
}

export function StatusBar() {
  return (
    <div className="status-bar" aria-hidden="true">
      <span>9:41</span>
      <span className="status-icons">
        <Icon file="1b501.svg" /><Icon file="59091.svg" />
        <span className="battery"><Icon file="b209d.svg" /><Icon file="e0680.svg" /><Icon file="55ff2.svg" /></span>
      </span>
    </div>
  );
}

const tabs = [
  ['/', 'Home', '8a8d4.svg', 'b0f25.svg'],
  ['/cafes', 'Cafes', '4612e.svg', '42cd8.svg'],
  ['/basket', 'My Order', '536f7.svg', '8fac3.svg'],
  ['/favorites', 'Favorites', 'cdf20.svg', '7dc11.svg'],
];

export default function CafeLayout({ title, children }) {
  const [panel, setPanel] = useState('');
  const [notice, setNotice] = useState('');
  const toggle = (name) => {
    setNotice('');
    setPanel((current) => current === name ? '' : name);
  };

  return (
    <div className="cafe-screen">
      <StatusBar />
      <header className="screen-header">
        <h1>{title}</h1>
        <div className="header-actions">
          <button aria-label="Notifications" aria-expanded={panel === 'notifications'} onClick={() => toggle('notifications')}><Icon file="64b09.svg" /></button>
          <button aria-label="Menu" aria-expanded={panel === 'menu'} onClick={() => toggle('menu')}><Icon file="63585.svg" /></button>
        </div>
        {panel === 'menu' && (
          <div className="profile-menu">
            <button onClick={() => setNotice('Customer preview · Somchai P.')}><Icon file="49e89.png" />Profile</button>
            <Link to="/login"><Icon file="dc0aa.svg" />Logout</Link>
          </div>
        )}
        {panel === 'notifications' && <p className="header-notice" role="status">Check My Order for pickup updates.</p>}
        {notice && <p className="header-notice" role="status">{notice}</p>}
      </header>
      <main className="screen-content">{children}</main>
      <nav className="bottom-nav" aria-label="Main navigation">
        {tabs.map(([path, label, icon, activeIcon]) => (
          <NavLink key={path} to={path} end={path === '/'}>
            {({ isActive }) => <><Icon file={isActive ? activeIcon : icon} /><span>{label}</span></>}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
