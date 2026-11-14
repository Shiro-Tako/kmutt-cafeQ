import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import CafeLayout, { asset, Icon, StatusBar } from '../components/layout/CafeLayout.jsx';
import DrinkCard from '../components/common/DrinkCard.jsx';
import { baht, cafes, getCafe, getItem } from '../data/menu.js';

export function total(items) {
  return Object.entries(items).reduce((sum, [id, count]) => sum + getItem(id).price * count, 0);
}

export function BasketPage({ basket, orders, changeQuantity, clearCafe }) {
  const [params, setParams] = useSearchParams();
  const [expanded, setExpanded] = useState(null);
  const showOrders = params.get('tab') === 'orders';
  const myOrders = orders.filter((order) => order.customer === 'Somchai P.');
  return (
    <CafeLayout title="Your Basket">
      <div className="segments basket-tabs">
        <button aria-pressed={!showOrders} onClick={() => setParams({})}>Basket</button>
        <button aria-pressed={showOrders} onClick={() => setParams({ tab: 'orders' })}>Orders</button>
      </div>
      {showOrders ? (
        <div className="order-list">
          {myOrders.map((order) => {
            const [id, count] = Object.entries(order.items)[0];
            const item = getItem(id);
            return (
              <article className="outlined history-card" key={order.id}>
                <span className="history-photo">{item.image && <img src={asset(item.image)} alt="" />}</span>
                <div>
                  <div className="spread"><small>{order.cafe}</small><small>{order.date}</small></div>
                  <p>{count}x　<strong>{item.name}</strong></p>
                  <div className="spread history-footer">
                    <button aria-expanded={expanded === order.id} onClick={() => setExpanded(expanded === order.id ? null : order.id)}>Details</button>
                    <strong className="order-status">{order.status}</strong>
                  </div>
                  {expanded === order.id && (
                    <ul className="history-details">
                      {Object.entries(order.items).map(([itemId, quantity]) => <li key={itemId}>{quantity}× {getItem(itemId).name}</li>)}
                      <li>Total {baht(total(order.items) + (order.fee ?? 0))}</li>
                    </ul>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="basket-list">
          {Object.keys(basket).length === 0 && <p>Your basket is empty. <Link to="/cafes">Browse the menu</Link></p>}
          {cafes.map((cafe) => {
            const entries = Object.entries(basket).filter(([id]) => getCafe(getItem(id)) === cafe);
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
                <div className="spread subtotal"><strong>Subtotal</strong><strong>{baht(total(Object.fromEntries(entries)))}</strong></div>
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

export function PaymentPage({ basket, placeOrder }) {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const cafe = cafes.find((name) => name === params.get('cafe')) ?? cafes[0];
  const [pickup, setPickup] = useState(cafe);
  const [editing, setEditing] = useState(false);
  const items = Object.fromEntries(Object.entries(basket).filter(([id]) => getCafe(getItem(id)) === cafe));
  const subtotal = total(items);
  const fee = subtotal ? 5 : 0;
  return (
    <main className="payment-screen">
      <StatusBar />
      <section className="payment-section pickup-section">
        <h1><Icon file="7a138.svg" /> Pickup at</h1>
        <p>{cafe}</p><p>KMUTT Thonburi campus</p>
        <hr />
        <h2><Icon file="26886.svg" /> Pickup point</h2>
        <div className="spread">
          {editing
            ? <select aria-label="Pickup point" value={pickup} onChange={(event) => setPickup(event.target.value)}><option>{cafe}</option><option>{cafe} pickup counter</option></select>
            : <p>{pickup}</p>}
          <button onClick={() => setEditing(!editing)}>{editing ? 'Done' : 'Edit'}</button>
        </div>
      </section>
      <section className="payment-section">
        <h2>Your order</h2>
        {Object.entries(items).map(([id, count]) => (
          <div className="spread" key={id}><p>{count}x　{getItem(id).name}</p><p>{baht(getItem(id).price * count)}</p></div>
        ))}
        <Link className="edit-order" to="/basket">Edit order</Link>
        <hr />
        <div className="section-heading"><h3>Add more to your order</h3><Link to="/cafes">See all</Link></div>
        <div className="payment-recommendations">
          <DrinkCard item={{ ...getItem('coffee-lemonade'), image: '1d2da.png' }} />
          <DrinkCard item={{ ...getItem('lemonade'), image: '7ea1a.png' }} />
        </div>
        <div className="spread"><p>Subtotal</p><p>{baht(subtotal)}</p></div>
        <div className="spread"><p>Packaging fee</p><p>{baht(fee)}</p></div>
        <div className="spread payment-total"><strong>TOTAL</strong><strong>{baht(subtotal + fee)}</strong></div>
      </section>
      <section className="payment-section">
        {subtotal > 0 ? <button className="primary" onClick={() => { placeOrder(cafe, pickup, items, fee); navigate('/basket?tab=orders'); }}>Confirm pickup order</button> : <Link to="/cafes">Browse the menu</Link>}
        <p>Preview only. No payment is collected.</p>
      </section>
    </main>
  );
}

const statuses = ['Waiting', 'Preparing', 'Ready', 'Done'];
const nextAction = ['Start Preparing', 'Mark Ready', 'Complete Order'];

export function StaffPage({ orders, advanceOrder }) {
  const [status, setStatus] = useState(statuses[0]);
  const [settings, setSettings] = useState(false);
  const cafeOrders = orders.filter((order) => order.cafe === cafes[0]);
  const currentOrders = cafeOrders.filter((order) => order.status === status);
  const next = statuses.indexOf(status) + 1;
  return (
    <main className="staff-screen">
      <StatusBar />
      <section>
        <div className="spread staff-title"><h1>Cafe Rung — Orders</h1><button aria-label="Staff settings" aria-expanded={settings} onClick={() => setSettings(!settings)}><Icon file="474a4.svg" /></button></div>
        {settings && <p role="status">Cafe Rung queue preview · changes are saved in this browser.</p>}
        <p className="staff-date">28 Sep 2026</p>
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
              <small>Placed: {order.time}</small>
              <ul>{Object.entries(order.items).map(([id, count]) => <li className="spread" key={id}>{getItem(id).name}<strong>×{count}</strong></li>)}</ul>
              <div className="spread"><span>Total Amount</span><strong>{baht(total(order.items) + (order.fee ?? 0))}</strong></div>
              {next < statuses.length && <button className="primary" onClick={() => advanceOrder(order.id, statuses[next])}>{nextAction[next - 1]} →</button>}
            </article>
          ))}
          {currentOrders.length === 0 && <p>No {status.toLowerCase()} orders.</p>}
        </div>
      </section>
    </main>
  );
}
