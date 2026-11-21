import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router';
import { useMenu } from '../../data/MenuContext.jsx';
import { sessionEnabled } from '../../services/auth.js';
import { baht } from '../../data/menu.js';

export const asset = (file) => file.startsWith('/') || file.startsWith('https://') ? file : `${import.meta.env.BASE_URL}figma/${file}`;

export function Icon({ file, className }) {
  return <img className={className} src={asset(file)} alt="" />;
}

const tabs = [
  ['/', 'Home', '8a8d4.svg', 'b0f25.svg'],
  ['/cafes', 'Cafes', '4612e.svg', '42cd8.svg'],
  ['/basket', 'My Order', '536f7.svg', '8fac3.svg'],
  ['/favorites', 'Favorites', 'cdf20.svg', '7dc11.svg'],
];

function DesktopBasket() {
  const { basket, getItem, changeQuantity } = useMenu();
  const items = Object.entries(basket).map(([id, quantity]) => ({ ...getItem(id), id, quantity })).filter((item) => item.name && !item.archived);
  const cafes = [...new Set(items.map((item) => item.cafe))];
  return <aside className="desktop-basket" aria-label="Basket summary">
    <div className="spread"><h2>Your basket</h2><Link to="/basket">View all</Link></div>
    <p className="basket-hint">Your next campus coffee break.</p>
    {!items.length && <div className="basket-empty"><Icon file="4612e.svg" /><p>A little pick-me-up?</p><span>Choose a drink to start your order.</span><Link to="/cafes">Explore the menu →</Link></div>}
    {cafes.map((cafe) => {
      const lines = items.filter((item) => item.cafe === cafe);
      return <section className="desktop-basket-group" key={cafe}>
        <h3>{cafe}</h3>
        {lines.map((item) => <div className="desktop-basket-line" key={item.id}>
          {item.image && <img src={asset(item.image)} alt="" />}
          <div><strong>{item.name}</strong><small>{baht(item.price)}</small><div className="quantity"><button className="square-button" onClick={() => changeQuantity(item.id, -1)} aria-label={`Decrease ${item.name}`}>−</button><span>{item.quantity}</span><button className="square-button" onClick={() => changeQuantity(item.id, 1)} aria-label={`Increase ${item.name}`}>+</button></div></div>
        </div>)}
        <div className="spread"><span>Subtotal</span><strong>{baht(lines.reduce((sum, item) => sum + item.price * item.quantity, 0))}</strong></div>
        <Link className="primary" to={`/payment?cafe=${encodeURIComponent(cafe)}`}>Review order →</Link>
      </section>;
    })}
    <p className="basket-hint">Pay online (demo), then pick up at your café.</p>
  </aside>;
}

export default function CafeLayout({ title, children }) {
  const { account, logout, viewMode, setViewMode } = useMenu();
  const navigate = useNavigate();
  const [panel, setPanel] = useState('');
  const [notice, setNotice] = useState('');
  const toggle = (name) => {
    setNotice('');
    setPanel((current) => current === name ? '' : name);
  };

  return (
    <div className="cafe-screen">
      <div className="desktop-topbar">
        <Link className="desktop-brand" to="/">KMUTT <span>CafeQ</span><small>YOUR CAMPUS COFFEE BREAK</small></Link>
        <nav aria-label="Desktop navigation">{tabs.map(([path, label]) => <NavLink key={path} to={path} end={path === '/'}>{label}</NavLink>)}</nav>
        <Link className="desktop-account" to={account ? '/basket?tab=orders' : '/login'}>{account ? account.name : 'Log in / Sign up'}</Link>
      </div>
      <header className="screen-header">
        <h1>{title}</h1>
        <div className="header-actions">
          <button aria-label="Notifications" aria-expanded={panel === 'notifications'} onClick={() => toggle('notifications')}><Icon file="64b09.svg" /></button>
          <button aria-label="Menu" aria-expanded={panel === 'menu'} onClick={() => toggle('menu')}><Icon file="63585.svg" /></button>
        </div>
        {panel === 'menu' && (
          <div className="profile-menu">
            <label className="view-setting">Display view<select aria-label="Display view" value={viewMode} onChange={(event) => setViewMode(event.target.value)}><option value="auto">Auto (screen size)</option><option value="desktop">Desktop</option><option value="mobile">Mobile</option></select><small>Desktop layout on screens 1000px and wider.</small></label>
            <button onClick={() => setNotice(account?.name ?? (sessionEnabled ? 'Guest' : 'Customer preview · Somchai P.'))}><Icon file="49e89.png" />Profile</button>
            {sessionEnabled && account ? <button onClick={async () => {
              try { await logout(); navigate('/login'); }
              catch (error) { setNotice(error.message); }
            }}><Icon file="dc0aa.svg" />Logout</button> : <Link to="/login"><Icon file="dc0aa.svg" />{sessionEnabled ? 'Log in' : 'Logout'}</Link>}
          </div>
        )}
        {panel === 'notifications' && <p className="header-notice" role="status">Check My Order for pickup updates.</p>}
        {notice && <p className="header-notice" role="status">{notice}</p>}
      </header>
      <main className="screen-content">{children}</main>
      <DesktopBasket />
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
