import { Link, Navigate, Route, Routes, useParams } from 'react-router';
import { getCafe, initialOrders, menu as initialMenu } from './data/menu.js';
import { MenuContext } from './data/MenuContext.jsx';
import useStoredState from './hooks/useStoredState.js';
import { LoginPage, WelcomePage } from './pages/AccessPages.jsx';
import { CafesPage, DrinkPage, FavoritesPage } from './pages/CatalogPages.jsx';
import HomePage from './pages/HomePage.jsx';
import OnlinePaymentPage from './pages/OnlinePaymentPage.jsx';
import { BasketPage, PaymentPage, StaffPage } from './pages/OrderPages.jsx';
import { StaffLayout, StaffMenuPage } from './pages/StaffMenuPage.jsx';

function DrinkRoute(props) {
  const { id } = useParams();
  return <DrinkPage key={id} {...props} />;
}

export default function App() {
  const [favorites, setFavorites] = useStoredState('cafeq-favorites', ['sweet-heaven', 'iced-chocolate', 'lemonade', 'cappuccino', 'lemon-tea']);
  const [basket, setBasket] = useStoredState('cafeq-basket', { lemonade: 2, 'sweet-heaven': 1, 'hot-chocolate': 2, 'thai-tea': 1, cake: 1 });
  const [orders, setOrders] = useStoredState('cafeq-orders', initialOrders);
  const [menu, setMenu] = useStoredState('cafeq-menu', initialMenu);
  const [staffCafe, setStaffCafe] = useStoredState('cafeq-staff-cafe', '');
  const getItem = (id) => menu.find((item) => item.id === id);

  function editMenuItem(id, details) {
    setMenu((current) => current.map((item) => item.id === id && item.cafe === staffCafe && !item.archived ? { ...item, ...details } : item));
  }

  function addMenuItem(item) {
    setMenu((current) => [...current, { ...item, id: crypto.randomUUID(), cafe: staffCafe }]);
  }

  function deleteMenuItem(id) {
    const item = getItem(id);
    if (!item || item.cafe !== staffCafe || item.archived) return;
    editMenuItem(id, { archived: true });
    changeQuantity(id, -(basket[id] ?? 0));
    setFavorites((current) => current.filter((favorite) => favorite !== id));
  }

  function toggleFavorite(id) {
    setFavorites((current) => current.includes(id) ? current.filter((favorite) => favorite !== id) : [...current, id]);
  }

  function changeQuantity(id, change) {
    if (change > 0 && getItem(id)?.archived) return;
    setBasket((current) => {
      const next = { ...current };
      const quantity = (next[id] ?? 0) + change;
      if (quantity > 0) next[id] = quantity;
      else delete next[id];
      return next;
    });
  }

  function clearCafe(cafe) {
    setBasket((current) => Object.fromEntries(Object.entries(current).filter(([id]) => getCafe(getItem(id)) !== cafe)));
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
    <MenuContext.Provider value={{ menu, getItem }}>
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/welcome" element={<WelcomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/staff/login" element={<LoginPage key="staff" staff onStaffLogin={setStaffCafe} />} />
      <Route path="/cafes" element={<CafesPage />} />
      <Route path="/drink/:id" element={<DrinkRoute favorites={favorites} toggleFavorite={toggleFavorite} addToBasket={changeQuantity} />} />
      <Route path="/favorites" element={<FavoritesPage favorites={favorites} toggleFavorite={toggleFavorite} />} />
      <Route path="/basket" element={<BasketPage basket={basket} orders={orders} changeQuantity={changeQuantity} clearCafe={clearCafe} />} />
      <Route path="/payment" element={<PaymentPage basket={basket} />} />
      <Route path="/payment/online" element={<OnlinePaymentPage basket={basket} placeOrder={placeOrder} />} />
      <Route path="/staff" element={staffCafe ? <StaffLayout cafe={staffCafe} onLogout={() => setStaffCafe('')} /> : <Navigate to="/staff/login" replace />}>
        <Route index element={<Navigate to="orders" replace />} />
        <Route path="orders" element={<StaffPage cafe={staffCafe} orders={orders} advanceOrder={advanceOrder} />} />
        <Route path="menu" element={<StaffMenuPage key={staffCafe} cafe={staffCafe} editMenuItem={editMenuItem} addMenuItem={addMenuItem} deleteMenuItem={deleteMenuItem} />} />
      </Route>
      <Route path="*" element={<main className="missing"><h1>Page not found</h1><Link to="/">Back to home</Link></main>} />
    </Routes>
    </MenuContext.Provider>
  );
}
