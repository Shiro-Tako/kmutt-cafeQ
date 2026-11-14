import { Link, useNavigate, useSearchParams } from 'react-router';
import { StatusBar } from '../components/layout/CafeLayout.jsx';
import { baht } from '../data/menu.js';
import { useMenu } from '../data/MenuContext.jsx';
import { getCheckout } from './OrderPages.jsx';

export default function OnlinePaymentPage({ basket, placeOrder }) {
  const { getItem } = useMenu();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { cafe, pickup, items, subtotal, fee } = getCheckout(basket, params.get('cafe'), params.get('pickup'), getItem);
  const checkoutUrl = `/payment?${params.toString()}`;

  function completeDemoPayment() {
    if (subtotal === 0) return;
    placeOrder(cafe, pickup, items, fee, subtotal);
    navigate('/basket?tab=orders', { replace: true });
  }

  return (
    <main className="payment-screen online-payment">
      <StatusBar />
      <section className="payment-section">
        <Link className="edit-order" to={checkoutUrl}>← Back to checkout</Link>
        <h1>Online payment</h1>
        <p>Demo only. No payment will be collected.</p>
        {subtotal > 0 ? (
          <>
            <div className="outlined online-summary">
              <h2>{cafe}</h2>
              <div className="spread"><span>Subtotal</span><span>{baht(subtotal)}</span></div>
              <div className="spread"><span>Packaging fee</span><span>{baht(fee)}</span></div>
              <div className="spread online-total"><strong>Total</strong><strong>{baht(subtotal + fee)}</strong></div>
            </div>
            <div className="outlined online-method">
              <span className="payment-preview-icon" aria-hidden="true">฿</span>
              <div><h2>PromptPay demo</h2><p>Complete the demo payment to send your order to the pickup queue.</p></div>
            </div>
            <button className="primary" onClick={completeDemoPayment}>Simulate payment · {baht(subtotal + fee)}</button>
          </>
        ) : (
          <p>Your basket has no items for {cafe}. <Link className="edit-order" to="/cafes">Browse the menu</Link></p>
        )}
      </section>
    </main>
  );
}
