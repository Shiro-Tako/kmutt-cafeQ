import { useCallback, useEffect, useState } from 'react';
import { Link, Navigate, Route, Routes, useLocation, useParams } from 'react-router';
import { initialOrders, menu as initialMenu } from './data/menu.js';
import { MenuContext } from './data/MenuContext.jsx';
import useStoredState from './hooks/useStoredState.js';
import { useCatalog } from './hooks/useCatalog.js';
import { LoginPage, WelcomePage } from './pages/AccessPages.jsx';
import { CafesPage, DrinkPage, FavoritesPage } from './pages/CatalogPages.jsx';
import HomePage from './pages/HomePage.jsx';
import OnlinePaymentPage from './pages/OnlinePaymentPage.jsx';
import { BasketPage, PaymentPage, StaffPage } from './pages/OrderPages.jsx';
import { StaffLayout, StaffMenuPage } from './pages/StaffMenuPage.jsx';
import StaffTeamPage from './pages/StaffTeamPage.jsx';
import { getSession, sessionEnabled, signOut } from './services/auth.js';
import { demoItemIds, writeMenuItem } from './services/catalog.js';
import { getFavorites, saveFavorite } from './services/favorites.js';
import { useApiResource } from './hooks/useApiResource.js';
import useOrderNotifications from './hooks/useOrderNotifications.js';

function DrinkRoute(props) {
  const { id } = useParams();
  return <DrinkPage key={id} {...props} />;
}

export default function App() {
  const [viewMode, setViewMode] = useStoredState('cafeq-view-mode', 'auto');
  const [wideScreen, setWideScreen] = useState(() => window.matchMedia('(min-width: 1000px)').matches);
  useEffect(() => {
    const query = window.matchMedia('(min-width: 1000px)');
    const update = () => setWideScreen(query.matches);
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);
  const [favorites, setFavorites] = useStoredState('cafeq-favorites', ['sweet-heaven', 'iced-chocolate', 'lemonade', 'cappuccino', 'lemon-tea']);
  const [basket, setBasket] = useStoredState(sessionEnabled ? 'cafeq-account-basket' : 'cafeq-basket', sessionEnabled ? {} : { lemonade: 2, 'sweet-heaven': 1, 'hot-chocolate': 2, 'thai-tea': 1, cake: 1 });
  const [orders, setOrders] = useStoredState('cafeq-orders', initialOrders);
  const [menu, setMenu] = useStoredState('cafeq-menu', initialMenu);
  const [staffCafe, setStaffCafe] = useStoredState('cafeq-staff-cafe', '');
  const catalog = useCatalog(menu);
  const { getItem } = catalog;
  useEffect(() => {
    if (catalog.loading || catalog.error) return;
    setBasket((current) => {
      const entries = Object.entries(current).filter(([id]) => {
        const item = catalog.getItem(id);
        return item && !item.archived;
      });
      return entries.length === Object.keys(current).length ? current : Object.fromEntries(entries);
    });
  }, [catalog.menu, catalog.loading, catalog.error, setBasket]);
  const [account, setAccount] = useState(null);
  const { pathname } = useLocation();
  const orderNotifications = useOrderNotifications(account, catalog.cafes, sessionEnabled && !pathname.startsWith('/staff'));
  const [sessionLoading, setSessionLoading] = useState(sessionEnabled);
  const [selectedCafe, setSelectedCafe] = useState(null);
  const [favoriteError, setFavoriteError] = useState('');
  const loadFavorites = useCallback((signal) => account ? getFavorites(signal) : null, [account]);
  const saved = useApiResource(loadFavorites, sessionEnabled && Boolean(account));
  const activeFavorites = sessionEnabled
    ? (saved.data?.items ?? []).map(({ menuItemId }) => demoItemIds[menuItemId] ?? String(menuItemId))
    : favorites;
  const allowedCafes = catalog.cafes.filter(({ cafeId }) => account?.staffCafeIds?.includes(cafeId));
  const staffStore = allowedCafes.find(({ name }) => name === selectedCafe) ?? allowedCafes[0];
  const activeStaffCafe = sessionEnabled ? staffStore?.name : staffCafe;

  useEffect(() => {
    if (!sessionEnabled) return;
    const controller = new AbortController();
    getSession(controller.signal).then((user) => {
      if (!controller.signal.aborted) setAccount(user);
    }).catch(() => {}).finally(() => {
      if (!controller.signal.aborted) setSessionLoading(false);
    });
    return () => controller.abort();
  }, []);

  async function logout() {
    if (sessionEnabled) await signOut();
    setAccount(null);
    setBasket({});
    setFavoriteError('');
    setSelectedCafe(null);
    setStaffCafe('');
  }

  function editMenuItem(id, details) {
    if (sessionEnabled) return writeMenuItem(staffStore.cafeId, getItem(id).menuItemId, details).then(catalog.refresh);
    setMenu((current) => current.map((item) => item.id === id && item.cafe === staffCafe && !item.archived ? { ...item, ...details } : item));
  }

  function addMenuItem(item) {
    if (sessionEnabled) return writeMenuItem(staffStore.cafeId, null, item).then(catalog.refresh);
    setMenu((current) => [...current, { ...item, id: crypto.randomUUID(), cafe: staffCafe }]);
  }

  async function deleteMenuItem(id) {
    const item = getItem(id);
    if (!item || item.cafe !== activeStaffCafe || item.archived) return;
    if (sessionEnabled) {
      await writeMenuItem(staffStore.cafeId, item.menuItemId);
      catalog.refresh();
      saved.refresh();
    } else {
      editMenuItem(id, { archived: true });
    }
    changeQuantity(id, -(basket[id] ?? 0));
    setFavorites((current) => current.filter((favorite) => favorite !== id));
  }

  async function toggleFavorite(id) {
    if (sessionEnabled) {
      try {
        setFavoriteError('');
        if (!account) throw new Error('Log in to save favorites.');
        await saveFavorite(getItem(id).menuItemId, !activeFavorites.includes(id));
        saved.refresh();
      } catch (error) {
        setFavoriteError(error.message);
      }
      return;
    }
    setFavorites((current) => current.includes(id) ? current.filter((favorite) => favorite !== id) : [...current, id]);
  }

  function changeQuantity(id, change) {
    if (change > 0 && (!getItem(id) || getItem(id).archived)) return;
    setBasket((current) => {
      const next = { ...current };
      const quantity = (next[id] ?? 0) + change;
      if (quantity > 0) next[id] = quantity;
      else delete next[id];
      return next;
    });
  }

  function clearCafe(cafe) {
    setBasket((current) => Object.fromEntries(Object.entries(current).filter(([id]) => getItem(id)?.cafe !== cafe)));
  }

  function placeOrder(cafe, pickup, items, fee, subtotal) {
    const now = new Date();
    setOrders((current) => [{
      id: Math.max(0, ...current.map((order) => order.id)) + 1,
      customer: 'Somchai P.',
      date: now.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' }),
      time: now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
      cafe,
      pickup,
      fee,
      subtotal,
      status: 'Waiting',
      items,
    }, ...current]);
    clearCafe(cafe);
  }

  function advanceOrder(id, status) {
    setOrders((current) => current.map((order) => order.id === id ? { ...order, status } : order));
  }

  return (
    <MenuContext.Provider value={{ ...catalog, account, logout, staffStore, allowedCafes, selectStaffCafe: setSelectedCafe, viewMode, setViewMode, basket, changeQuantity, orderNotifications }}>
    <div className={wideScreen && viewMode !== 'mobile' ? 'desktop-view' : 'mobile-view'}>
    {orderNotifications.toast && <aside className="ready-toast" role="status" aria-live="polite">
      <div><strong>{orderNotifications.toast.title}</strong><p>{orderNotifications.toast.cafe}{orderNotifications.toast.queueNumber ? ` · Queue #${String(orderNotifications.toast.queueNumber).padStart(3, '0')}` : ''}</p>
      <Link to={`/basket?tab=orders&order=${orderNotifications.toast.orderId}`} onClick={() => orderNotifications.markRead([orderNotifications.toast.key])}>{orderNotifications.toast.linkLabel}</Link></div>
      <button aria-label="Dismiss order notification" onClick={orderNotifications.dismissToast}>×</button>
    </aside>}
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/welcome" element={<WelcomePage />} />
      <Route path="/login" element={<LoginPage onAccount={setAccount} />} />
      <Route path="/staff/login" element={<LoginPage key="staff" staff onAccount={setAccount} onStaffLogin={sessionEnabled ? setSelectedCafe : setStaffCafe} />} />
      <Route path="/cafes" element={<CafesPage />} />
      <Route path="/drink/:id" element={<DrinkRoute favorites={activeFavorites} favoriteError={favoriteError} toggleFavorite={toggleFavorite} addToBasket={changeQuantity} />} />
      <Route path="/favorites" element={<FavoritesPage favorites={activeFavorites} loading={saved.loading} error={favoriteError || saved.error} toggleFavorite={toggleFavorite} />} />
      <Route path="/basket" element={<BasketPage basket={basket} orders={orders} account={account} changeQuantity={changeQuantity} clearCafe={clearCafe} />} />
      <Route path="/payment" element={<PaymentPage basket={basket} />} />
      <Route path="/payment/online" element={<OnlinePaymentPage basket={basket} placeOrder={placeOrder} clearCafe={clearCafe} account={account} />} />
      <Route path="/staff" element={sessionLoading || (account?.staffCafeIds?.length && !staffStore && !catalog.error) ? <p role="status">Loading your store…</p> : activeStaffCafe ? <StaffLayout cafe={activeStaffCafe} onLogout={logout} /> : <Navigate to="/staff/login" replace />}>
        <Route index element={<Navigate to="orders" replace />} />
        <Route path="orders" element={<StaffPage cafe={activeStaffCafe} cafeId={staffStore?.cafeId} orders={orders} advanceOrder={advanceOrder} />} />
        <Route path="menu" element={<StaffMenuPage key={activeStaffCafe} cafe={activeStaffCafe} editMenuItem={editMenuItem} addMenuItem={addMenuItem} deleteMenuItem={deleteMenuItem} />} />
        <Route path="team" element={<StaffTeamPage key={staffStore?.cafeId} />} />
      </Route>
      <Route path="*" element={<main className="missing"><h1>Page not found</h1><Link to="/">Back to home</Link></main>} />
    </Routes>
    </div>
    </MenuContext.Provider>
  );
}
