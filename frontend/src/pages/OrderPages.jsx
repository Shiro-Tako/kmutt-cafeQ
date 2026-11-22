import { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import CafeLayout, { asset, Icon } from '../components/layout/CafeLayout.jsx';
import DrinkCard from '../components/common/DrinkCard.jsx';
import PickupMap from '../components/common/PickupMap.jsx';
import { baht, menu as initialMenu } from '../data/menu.js';
import { useMenu } from '../data/MenuContext.jsx';
import { useApiResource } from '../hooks/useApiResource.js';
import { sessionEnabled } from '../services/auth.js';
import { confirmPickup, getOrders, getStaffOrders, toDisplayOrder, updateOrderStatus } from '../services/orders.js';

export function total(items, getItem) {
  return Object.entries(items).reduce((sum, [id, count]) => sum + getItem(id).price * count, 0);
}

function orderTotal(order) {
  if (order.total !== undefined) return order.total;
  const subtotal = order.subtotal ?? total(order.items, (id) => initialMenu.find((item) => item.id === id));
  return subtotal + (order.fee ?? 0);
}

function orderLines(order, getItem) {
  return order.lines ?? Object.entries(order.items).map(([id, quantity]) => ({ id, quantity, name: getItem(id)?.name ?? 'Unavailable item' }));
}

export function getCheckout(basket, requestedCafe, pickupOption, getItem, cafes) {
  const store = cafes.find(({ name }) => name === requestedCafe) ?? cafes[0];
  const cafe = store?.name;
  const items = Object.fromEntries(Object.entries(basket).filter(([id]) => {
    const item = getItem(id);
    return item && !item.archived && item.cafe === cafe;
  }));
  const subtotal = total(items, getItem);
  const counter = store?.pickupPoint ?? `${cafe} pickup counter`;
  const pickup = pickupOption === 'counter' ? counter : cafe;
  return { cafe, cafeId: store?.cafeId, items, subtotal, fee: subtotal ? 5 : 0, counter, pickup };
}

export function BasketPage({ basket, orders, account, changeQuantity, clearCafe }) {
  const { getItem, cafes, orderNotifications, loading: catalogLoading, error: catalogError } = useMenu();
  const [params, setParams] = useSearchParams();
  const [expanded, setExpanded] = useState(null);
  const [pickup, setPickup] = useState(null);
  useEffect(() => {
    const orderId = params.get('order');
    if (orderId && /^\d+$/.test(orderId)) setExpanded(Number(orderId));
  }, [params]);
  const showOrders = params.get('tab') === 'orders';
  const loadOrders = useCallback((signal) => account ? getOrders(signal) : null, [account]);
  const history = useApiResource(loadOrders, sessionEnabled && showOrders && Boolean(account), 5000);
  const myOrders = sessionEnabled ? (history.data?.items ?? []).map((order) => toDisplayOrder(order, cafes)) : orders.filter((order) => order.customer === 'Somchai P.');

  async function acceptPickup(id) {
    setPickup({ id, pending: true });
    try {
      // อัปเดตออเดอร์ในหน้าลูกค้าหลัง API ยืนยันว่ารับสินค้าแล้ว
      await confirmPickup(id);
      history.refresh();
      orderNotifications.refresh();
      setPickup({ id, confirmed: true });
    } catch (error) {
      setPickup({ id, error: error.message });
    }
  }

  return (
    <CafeLayout pose="orders" title={showOrders ? "Your orders" : "Your basket"}>
      <div className="segments basket-tabs">
        <button aria-pressed={!showOrders} onClick={() => setParams({})}>Basket</button>
        <button aria-pressed={showOrders} onClick={() => setParams({ tab: 'orders' })}>Orders</button>
      </div>
      {showOrders ? (
        <div className="order-list">
          {pickup?.confirmed && <p role="status">Pickup confirmed.</p>}
          {sessionEnabled && !account && <Link to="/login">Log in to see your orders</Link>}
          {history.loading && <p role="status">Loading orders…</p>}
          {history.error && <p role="alert">{history.error}</p>}
          {(!sessionEnabled || account) && !history.loading && !history.error && myOrders.length === 0 && <p>No orders yet.</p>}
          {myOrders.map((order) => {
            const lines = orderLines(order, getItem);
            const first = lines[0];
            const item = getItem(first?.id);
            return (
              <article className="outlined history-card" key={order.id}>
                <span className="history-photo">{item?.image && <img src={asset(item.image)} alt="" />}</span>
                <div>
                  <div className="spread"><small>{order.cafe}</small><small>{order.date}</small></div>
                  <p>{first?.quantity}x　<strong>{first?.name}</strong></p>
                  {order.queueNumber && <p>Queue #{String(order.queueNumber).padStart(3, '0')}</p>}
                  <div className="spread history-footer">
                    <button aria-expanded={expanded === order.id} aria-controls={`order-details-${order.id}`} onClick={() => setExpanded(expanded === order.id ? null : order.id)}>Details</button>
                    <strong className="order-status">{order.status}</strong>
                  </div>
                </div>
                {expanded === order.id && (
                  <div className="expanded-order-details" id={`order-details-${order.id}`}>
                    <ul className="history-details">
                      {lines.map(({ id, name, quantity }) => <li key={id}>{quantity}× {name}</li>)}
                      <li>Total {baht(orderTotal(order))}</li>
                    </ul>
                    {order.status === 'Ready' && <button type="button" className="primary" disabled={pickup?.pending} onClick={() => acceptPickup(order.id)}>
                      {pickup?.id === order.id && pickup.pending ? 'Confirming…' : 'Confirm pickup'}
                    </button>}
                    {pickup?.id === order.id && pickup.error && <p role="alert">{pickup.error}</p>}
                    <h3>Pickup location</h3>
                    <PickupMap cafeName={order.cafe} pickupPoint={order.pickupPoint ?? order.pickup ?? cafes.find((store) => store.name === order.cafe)?.pickupPoint} />
                  </div>
                )}
              </article>
            );
          })}
        </div>
      ) : (
        <div className="basket-list">
          {Object.keys(basket).length === 0 && <p>Your basket is empty. <Link to="/cafes">Browse the menu</Link></p>}
          {catalogLoading && <p role="status">Loading menu…</p>}
          {catalogError && <p role="alert">{catalogError}</p>}
          {!catalogLoading && !catalogError && Object.keys(basket).filter((id) => !getItem(id) || getItem(id).archived).map((id) => (
            <p key={id}>An item is unavailable. <button onClick={() => changeQuantity(id, -basket[id])}>Remove item</button></p>
          ))}
          {cafes.map(({ name: cafe }) => {
            const entries = Object.entries(basket).filter(([id]) => getItem(id)?.cafe === cafe && !getItem(id).archived);
            if (entries.length === 0) return null;
            return (
              <section className="basket-group" key={cafe}>
                <h2>{cafe}</h2>
                {entries.map(([id, count]) => {
                  const item = getItem(id);
                  return (
                    <article key={id} className="outlined basket-row">
                      <span className="basket-photo">{item.image && <img src={asset(item.image)} alt="" />}</span>
                      <span><strong>{item.name}</strong><small>{baht(item.price)}</small></span>
                      <div className="quantity">
                        <button aria-label={`Decrease ${item.name}`} onClick={() => changeQuantity(id, -1)}>−</button>
                        <output>{count}</output>
                        <button aria-label={`Increase ${item.name}`} onClick={() => changeQuantity(id, 1)}>+</button>
                        <button className="remove-button" aria-label={`Remove ${item.name}`} onClick={() => changeQuantity(id, -count)}>×</button>
                      </div>
                    </article>
                  );
                })}
                <div className="spread subtotal"><strong>Subtotal</strong><strong>{baht(total(Object.fromEntries(entries), getItem))}</strong></div>
                <div className="basket-buttons">
                  <button className="outlined" onClick={() => clearCafe(cafe)}>Cancel</button>
                  <Link className="primary" to={`/payment?cafe=${encodeURIComponent(cafe)}`}>Place Order</Link>
                </div>
              </section>
            );
          })}
        </div>
      )}
    </CafeLayout>
  );
}

export function PaymentPage({ basket }) {
  const { getItem, cafes, loading, error } = useMenu();
  const [params, setParams] = useSearchParams();
  const { cafe, items, subtotal, fee, counter, pickup } = getCheckout(basket, params.get('cafe'), params.get('pickup'), getItem, cafes);
  const [editing, setEditing] = useState(false);
  const recommendations = ['coffee-lemonade', 'lemonade'].map(getItem).filter(Boolean);
  return (
    <main className="payment-screen">
      <Link className="checkout-back" to="/basket">← Back to basket</Link>
      <section className="payment-section pickup-section">
        <h1><Icon file="7a138.svg" /> Pickup at</h1>
        <p>{cafe}</p><p>KMUTT Thonburi campus</p>
        <hr />
        <h2><Icon file="26886.svg" /> Pickup point</h2>
        <div className="spread">
          {editing && !sessionEnabled
            ? <select aria-label="Pickup point" value={pickup} onChange={(event) => setParams({ cafe, pickup: event.target.value === counter ? 'counter' : 'cafe' }, { replace: true })}><option>{cafe}</option><option>{counter}</option></select>
            : <p>{sessionEnabled ? counter : pickup}</p>}
          {!sessionEnabled && <button onClick={() => setEditing(!editing)}>{editing ? 'Done' : 'Edit'}</button>}
        </div>
        {!loading && !error && <PickupMap cafeName={cafe} pickupPoint={counter} />}
      </section>
      <section className="payment-section">
        <h2>Your order</h2>
        {loading && <p role="status">Loading menu…</p>}
        {error && <p role="alert">{error}</p>}
        {Object.entries(items).map(([id, count]) => (
          <div className="spread" key={id}><p>{count}x　{getItem(id).name}</p><p>{baht(getItem(id).price * count)}</p></div>
        ))}
        <Link className="edit-order" to="/basket">Edit order</Link>
        <hr />
        <div className="section-heading"><h3>Add more to your order</h3><Link to="/cafes">See all</Link></div>
        <div className="payment-recommendations">
          {recommendations.map((item) => <DrinkCard key={item.id} item={item} />)}
        </div>
        <div className="spread"><p>Subtotal</p><p>{baht(subtotal)}</p></div>
        <div className="spread"><p>Packaging fee</p><p>{baht(fee)}</p></div>
        <div className="spread payment-total"><strong>{sessionEnabled ? 'Estimated total' : 'TOTAL'}</strong><strong>{baht(subtotal + fee)}</strong></div>
      </section>
      <section className="payment-section">
        {subtotal > 0 ? (
          <Link className="primary" to={`/payment/online?${params.toString()}`}>Continue to payment</Link>
        ) : <Link to="/cafes">Browse the menu</Link>}
      </section>
    </main>
  );
}

const statuses = ['Waiting', 'Preparing', 'Ready', 'Done'];
const nextAction = ['Start Preparing', 'Mark Ready', 'Complete Order'];

export function StaffPage({ cafe, cafeId, orders, advanceOrder }) {
  const { getItem, cafes } = useMenu();
  const [status, setStatus] = useState(statuses[0]);
  const [pending, setPending] = useState(null);
  const [error, setError] = useState('');
  const loadOrders = useCallback((signal) => getStaffOrders(cafeId, signal), [cafeId]);
  const queue = useApiResource(loadOrders, sessionEnabled && Boolean(cafeId), 5000);
  const cafeOrders = sessionEnabled ? (queue.data?.items ?? []).map((order) => toDisplayOrder(order, cafes)) : orders.filter((order) => order.cafe === cafe);
  const currentOrders = cafeOrders.filter((order) => order.status === status);
  const next = statuses.indexOf(status) + 1;
  async function advance(id) {
    if (!sessionEnabled) return advanceOrder(id, statuses[next]);
    setError('');
    setPending(id);
    try {
      // ส่งสถานะถัดไปให้ Backend บันทึก แล้วโหลดรายการออเดอร์ของร้านใหม่
      await updateOrderStatus(cafeId, id, statuses[next]);
      queue.refresh();
    } catch (failure) {
      setError(failure.message);
      queue.refresh();
    } finally {
      setPending(null);
    }
  }
  return (
    <>
        {queue.loading && <p role="status">Loading queue…</p>}
        {(error || queue.error) && <p role="alert">{error || queue.error}</p>}
        <div className="staff-tabs">
          {statuses.map((name) => {
            const count = cafeOrders.filter((order) => order.status === name).length;
            return <button key={name} aria-pressed={name === status} onClick={() => setStatus(name)}>{name}{count > 0 && <span>{count}</span>}</button>;
          })}
        </div>
        <div className="staff-list">
          {currentOrders.map((order) => (
            <article key={order.id} className="outlined staff-card">
              <div className="spread"><h2>Order #{String(order.id).padStart(3, '0')}</h2><strong>{order.customer}</strong></div>
              {order.queueNumber && <p>Queue #{String(order.queueNumber).padStart(3, '0')}</p>}
              <small>Placed: {order.time}</small>
              <ul>{orderLines(order, getItem).map(({ id, name, quantity }) => <li className="spread" key={id}>{name}<strong>×{quantity}</strong></li>)}</ul>
              <div className="spread"><span>Total Amount</span><strong>{baht(orderTotal(order))}</strong></div>
              {next < statuses.length && <button className="primary" disabled={pending !== null} onClick={() => advance(order.id)}>{nextAction[next - 1]} →</button>}
            </article>
          ))}
          {!queue.loading && !queue.error && currentOrders.length === 0 && <p>No {status.toLowerCase()} orders.</p>}
        </div>
    </>
  );
}
