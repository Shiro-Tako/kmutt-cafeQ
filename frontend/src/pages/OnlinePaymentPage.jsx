import { useCallback, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { baht } from '../data/menu.js';
import { useMenu } from '../data/MenuContext.jsx';
import { getCheckout } from './OrderPages.jsx';
import { useApiResource } from '../hooks/useApiResource.js';
import { sessionEnabled } from '../services/auth.js';
import { confirmOrder, quoteOrder } from '../services/orders.js';
import demoQr from '../assets/demo-payment-qr.png';

const demoQrLink = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';

export default function OnlinePaymentPage({ basket, placeOrder, clearCafe, account }) {
  const { getItem, cafes } = useMenu();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { cafe, cafeId, pickup, items, subtotal, fee } = getCheckout(basket, params.get('cafe'), params.get('pickup'), getItem, cafes);
  const checkoutUrl = `/payment?${params.toString()}`;

  // ส่งรหัสร้าน รหัสเมนู และจำนวน เพื่อให้เซิร์ฟเวอร์คำนวณราคาจริงของออเดอร์
  const payload = JSON.stringify({
    cafeId,
    items: Object.entries(items).map(([id, quantity]) => ({ menuItemId: getItem(id).menuItemId, quantity })),
  });
  const hasItems = Object.keys(items).length > 0;
  const loadQuote = useCallback((signal) => quoteOrder(JSON.parse(payload), signal), [payload, account]);
  const quote = useApiResource(loadQuote, sessionEnabled && Boolean(account && cafeId && hasItems));
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const confirmation = useRef(null);
  const inFlight = useRef(false);
  const shownSubtotal = sessionEnabled ? quote.data?.subtotal / 100 : subtotal;
  const shownFee = sessionEnabled ? quote.data?.packagingFee / 100 : fee;
  const shownTotal = sessionEnabled ? quote.data?.total / 100 : subtotal + fee;

  async function completeDemoPayment() {
    if (!hasItems || inFlight.current || (sessionEnabled && !quote.data)) return;
    inFlight.current = true;
    setPending(true);
    setError('');
    try {
      if (sessionEnabled) {
        const expectedTotal = quote.data.total;
        const key = JSON.stringify([account.userId, payload, expectedTotal]);
        // ใช้รหัสยืนยันเดิมตอนลองส่งซ้ำ และล้างตะกร้าร้านนี้เมื่อ API ตอบว่าสำเร็จ
        if (confirmation.current?.key !== key) confirmation.current = { key, id: crypto.randomUUID() };
        await confirmOrder({ ...JSON.parse(payload), expectedTotal, confirmationId: confirmation.current.id });
        clearCafe(cafe);
      } else {
        placeOrder(cafe, pickup, items, fee, subtotal);
      }
      navigate('/basket?tab=orders', { replace: true });
    } catch (failure) {
      setError(failure.message);
      if (failure.code === 'PRICE_CHANGED') {
        confirmation.current = null;
        quote.refresh();
      }
    } finally {
      inFlight.current = false;
      setPending(false);
    }
  }

  return (
    <main className="payment-screen online-payment">
      <section className="payment-section">
        <Link className="edit-order" to={checkoutUrl}>← Back to checkout</Link>
        <h1>Online payment</h1>
        <p>Demo only. No payment will be collected.</p>
        {sessionEnabled && !account && <p><Link to="/login">Log in before confirming payment</Link></p>}
        {quote.loading && <p role="status">Getting your order total…</p>}
        {(quote.error || error) && <p role="alert">{quote.error || error}</p>}
        {quote.error && <button onClick={quote.refresh}>Retry quote</button>}
        {hasItems && (!sessionEnabled || quote.data) && (
          <>
            <div className="outlined online-summary">
              <h2>{cafe}</h2>
              <div className="spread"><span>Subtotal</span><span>{baht(shownSubtotal)}</span></div>
              <div className="spread"><span>Packaging fee</span><span>{baht(shownFee)}</span></div>
              <div className="spread online-total"><strong>Total</strong><strong>{baht(shownTotal)}</strong></div>
            </div>
            <div className="outlined online-method">
              <div className="online-method-heading">
                <span className="payment-preview-icon" aria-hidden="true">฿</span>
                <h2>PromptPay demo</h2>
              </div>
              <figure className="payment-demo-qr">
                <a href={demoQrLink} target="_blank" rel="noreferrer" aria-label="Open demo QR link in a new tab">
                  <img src={demoQr} width="180" height="180" alt="Scannable demo QR code" />
                </a>
                <figcaption>Demo QR only. Use the button below to send your order to the pickup queue.</figcaption>
              </figure>
            </div>
            <button className="primary" disabled={pending} onClick={completeDemoPayment}>Simulate payment · {baht(shownTotal)}</button>
          </>
        )}
        {!hasItems && (
          <p>Your basket has no items for {cafe}. <Link className="edit-order" to="/cafes">Browse the menu</Link></p>
        )}
      </section>
    </main>
  );
}
