import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router';
import { useMenu } from '../../data/MenuContext.jsx';
import { sessionEnabled } from '../../services/auth.js';
import { baht } from '../../data/menu.js';
import CampusAnt from '../common/CampusAnt.jsx';
import CampusSearch from './CampusSearch.jsx';
import universityMark from '../../assets/campus/kmutt.jpg';
import homeIcon from '../../assets/campus/nav-home.png';
import cafesIcon from '../../assets/campus/nav-cafes.png';
import basketIcon from '../../assets/campus/nav-basket.png';
import favoritesIcon from '../../assets/campus/nav-favorites.png';

export const asset = (file) => file.startsWith('/') || file.startsWith('https://') || file.startsWith('data:image/jpeg;base64,') ? file : `${import.meta.env.BASE_URL}figma/${file}`;

export function Icon({ file, className }) {
  return <img className={className} src={asset(file)} alt="" />;
}

const tabs = [
  ['/', 'Home', homeIcon],
  ['/cafes', 'Cafes', cafesIcon],
  ['/basket', 'My Order', basketIcon],
  ['/favorites', 'Favorites', favoritesIcon],
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

export default function CafeLayout({ title, children, pose }) {
  const { account, logout, viewMode, setViewMode, orderNotifications } = useMenu();
  const navigate = useNavigate();
  const [panel, setPanel] = useState('');
  const [notice, setNotice] = useState('');
  const toggle = (name) => {
    setNotice('');
    if (name === 'notifications' && panel !== 'notifications') orderNotifications.markRead();
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
        <div className="campus-heading">{pose ? <CampusAnt pose={pose} /> : <img src={universityMark} width="44" height="44" alt="KMUTT" />}<h1>{title}</h1></div>
        {pose && <img className="mobile-kmutt" src={universityMark} alt="KMUTT" />}
        <CampusSearch />
        <div className="header-actions">
          <button className={`notification-bell${orderNotifications.unreadCount ? ' has-unread' : ''}`} aria-label={`Notifications${orderNotifications.unreadCount ? ` (${orderNotifications.unreadCount} unread)` : ''}`} aria-expanded={panel === 'notifications'} aria-controls="order-notification-panel" onClick={() => toggle('notifications')}><svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 2a1 1 0 0 0-1 1v1.08A6 6 0 0 0 6 10v5l-2 3v1h16v-1l-2-3v-5a6 6 0 0 0-5-5.92V3a1 1 0 0 0-1-1Zm-2 18a2 2 0 0 0 4 0Z" /></svg>{orderNotifications.unreadCount > 0 && <span className="notification-count" aria-hidden="true">{orderNotifications.unreadCount > 99 ? '99+' : orderNotifications.unreadCount}</span>}</button>
          <button aria-label="Menu" aria-expanded={panel === 'menu'} onClick={() => toggle('menu')}><Icon file="63585.svg" /></button>
        </div>
        {panel === 'menu' && (
          <div className="profile-menu">
            <label className="view-setting">Display view<select aria-label="Display view" value={viewMode} onChange={(event) => setViewMode(event.target.value)}><option value="auto">Auto (screen size)</option><option value="desktop">Desktop</option><option value="mobile">Mobile</option></select><small>Desktop layout on screens 1000px and wider.</small></label>
            <Link to={account ? '/profile' : '/login'} onClick={() => setPanel('')}><img src={account?.photo || asset('49e89.png')} alt="" />Profile</Link>
            {sessionEnabled && account ? <button onClick={async () => {
              try { await logout(); navigate('/login'); }
              catch (error) { setNotice(error.message); }
            }}><Icon file="dc0aa.svg" />Logout</button> : <Link to="/login"><Icon file="dc0aa.svg" />{sessionEnabled ? 'Log in' : 'Logout'}</Link>}
          </div>
        )}
        {panel === 'notifications' && <section className="notification-panel" id="order-notification-panel" aria-label="Pickup notifications">
          <h2>Notifications</h2>
          {!account ? <p><Link to="/login">Log in for order updates</Link></p> : <>
            {orderNotifications.loading && <p role="status">Checking your orders…</p>}
            {orderNotifications.error && <p role="alert">Could not check order updates. <button onClick={orderNotifications.refresh}>Retry</button></p>}
            {orderNotifications.items.map((item) => <Link className="ready-notification" key={item.key} to={`/basket?tab=orders&order=${item.orderId}`} onClick={() => { orderNotifications.markRead([item.key]); setPanel(''); }}>
              <img className="notification-photo" src={asset(item.image || '4612e.svg')} alt={item.image ? item.imageAlt : ''} />
              <div className="notification-copy"><strong>{item.title}</strong><span>{item.cafe}</span><small>{item.queueNumber ? `Queue #${String(item.queueNumber).padStart(3, '0')}` : `Order #${item.orderId}`} · {item.detail}</small></div>
            </Link>)}
            {!orderNotifications.loading && !orderNotifications.error && orderNotifications.items.length === 0 && <p>No pickup notifications yet. We’ll let you know when your order is ready.</p>}
            <Link className="notification-all" to="/basket?tab=orders" onClick={() => setPanel('')}>View all orders →</Link>
          </>}
        </section>}
        {notice && <p className="header-notice" role="status">{notice}</p>}
      </header>
      <main className="screen-content">{children}</main>
      <DesktopBasket />
      <nav className="bottom-nav" aria-label="Main navigation">
        {tabs.map(([path, label, icon]) => (
          <NavLink key={path} to={path} end={path === '/'}>
            <img src={icon} alt="" /><span>{label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
