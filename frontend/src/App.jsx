import { Link, Route, Routes, useParams } from 'react-router';
import { getCafe, getItem, initialOrders } from './data/menu.js';
import useStoredState from './hooks/useStoredState.js';
import { LoginPage, WelcomePage } from './pages/AccessPages.jsx';
import { CafesPage, DrinkPage, FavoritesPage } from './pages/CatalogPages.jsx';
import HomePage from './pages/HomePage.jsx';
import OnlinePaymentPage from './pages/OnlinePaymentPage.jsx';
import { BasketPage, PaymentPage, StaffPage } from './pages/OrderPages.jsx';

function DrinkRoute(props) {
  const { id } = useParams();
  return <DrinkPage key={id} {...props} />;
}

export default function App() {
  const [favorites, setFavorites] = useStoredState('cafeq-favorites', ['sweet-heaven', 'iced-chocolate', 'lemonade', 'cappuccino', 'lemon-tea']);
  const [basket, setBasket] = useStoredState('cafeq-basket', { lemonade: 2, 'sweet-heaven': 1, 'hot-chocolate': 2, 'thai-tea': 1, cake: 1 });
  const [orders, setOrders] = useStoredState('cafeq-orders', initialOrders);

  function toggleFavorite(id) {
    setFavorites((current) => current.includes(id) ? current.filter((favorite) => favorite !== id) : [...current, id]);
  }

  function changeQuantity(id, change) {
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

  function placeOrder(cafe, pickup, items, fee) {
    const now = new Date();
    setOrders((current) => [{
      id: Math.max(0, ...current.map((order) => order.id)) + 1,
      customer: 'Somchai P.',
      date: now.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' }),
      time: now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
      cafe,
      pickup,
      fee,
      status: 'Waiting',
      items,
    }, ...current]);
    clearCafe(cafe);
  }

  function advanceOrder(id, status) {
    setOrders((current) => current.map((order) => order.id === id ? { ...order, status } : order));
  }

  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/welcome" element={<WelcomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/cafes" element={<CafesPage />} />
      <Route path="/drink/:id" element={<DrinkRoute favorites={favorites} toggleFavorite={toggleFavorite} addToBasket={changeQuantity} />} />
      <Route path="/favorites" element={<FavoritesPage favorites={favorites} toggleFavorite={toggleFavorite} />} />
      <Route path="/basket" element={<BasketPage basket={basket} orders={orders} changeQuantity={changeQuantity} clearCafe={clearCafe} />} />
      <Route path="/payment" element={<PaymentPage basket={basket} />} />
      <Route path="/payment/online" element={<OnlinePaymentPage basket={basket} placeOrder={placeOrder} />} />
      <Route path="/staff/orders" element={<StaffPage orders={orders} advanceOrder={advanceOrder} />} />
      <Route path="*" element={<main className="missing"><h1>Page not found</h1><Link to="/">Back to home</Link></main>} />
    </Routes>
  );
}
