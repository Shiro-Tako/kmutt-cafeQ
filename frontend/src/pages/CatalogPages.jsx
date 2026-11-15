import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router';
import CafeLayout, { asset, Icon } from '../components/layout/CafeLayout.jsx';
import DrinkCard from '../components/common/DrinkCard.jsx';
import { baht, categories, getCafe } from '../data/menu.js';
import { useMenu } from '../data/MenuContext.jsx';
import { fetchMenuItems, toMenuItem } from '../services/catalog.js';
import { sessionEnabled } from '../services/auth.js';

export function CafesPage() {
  const { menu, cafes, overrides, refresh: refreshCatalog } = useMenu();
  const [category, setCategory] = useState(categories[0]);
  const [query, setQuery] = useState('');
  const [cafeId, setCafeId] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [request, setRequest] = useState(0);
  const cafe = cafes.find((entry) => String(entry.cafeId) === cafeId)?.name;
  const localItems = menu.filter((item) =>
    !item.archived && item.category === category &&
    (!cafeId || getCafe(item) === cafe) &&
    item.name.toLowerCase().includes(query.trim().toLowerCase()),
  );

  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const items = await fetchMenuItems({ cafeId, category, query }, controller.signal);
        if (!controller.signal.aborted) setResult(items);
      } catch {
        if (!controller.signal.aborted) setResult(null);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 180);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [cafeId, category, query, request]);

  const changedIds = new Set(overrides.map(({ id }) => id));
  const items = result === null ? localItems : [
    ...result.map((row) => toMenuItem(row, cafes)).filter((item) => !changedIds.has(item.id)),
    ...localItems.filter((item) => changedIds.has(item.id)),
  ];

  function refresh(update) {
    setLoading(true);
    update();
  }

  return (
    <CafeLayout title="Choose a café to start ordering">
      <div className="cafe-filter">
        <label htmlFor="cafe-filter">Café</label>
        <select id="cafe-filter" value={cafeId} onChange={(event) => refresh(() => setCafeId(event.target.value))}>
          <option value="">All cafés</option>
          {cafes.map(({ cafeId: id, name }) => <option key={id} value={id}>{name}</option>)}
        </select>
      </div>
      <input className="search" type="search" aria-label="Search menu" placeholder="Search.." value={query} onChange={(event) => refresh(() => setQuery(event.target.value))} />
      <div className="segments category-tabs" aria-label="Menu categories">
        {categories.map((name) => <button key={name} aria-pressed={name === category} onClick={() => { if (name !== category) refresh(() => setCategory(name)); }}>{name}</button>)}
      </div>
      <section className="catalog-list" aria-label={category} aria-busy={loading}>
        {loading && <p role="status">Loading menu…</p>}
        {!loading && result === null && <p role="status">{sessionEnabled ? 'Live menu search is unavailable.' : 'Using the demo menu.'} <button className="edit-order" onClick={() => refresh(() => { refreshCatalog(); setRequest(request + 1); })}>Retry API</button></p>}
        {!loading && items.map((item) => (
          <article key={item.id} className="menu-item">
            <Link className="menu-item-info" to={`/drink/${item.id}`}>
              <span className="menu-photo">{item.image && <img src={asset(item.image)} alt="" />}</span>
              <span className="menu-item-copy"><strong>{item.name}</strong><small>{getCafe(item)}</small><span>{item.description}</span><b>{baht(item.price)}</b></span>
            </Link>
            <Link className="square-button" to={`/drink/${item.id}`} aria-label={`Choose ${item.name}`}>+</Link>
          </article>
        ))}
        {!loading && items.length === 0 && <p>No menu items found.</p>}
      </section>
    </CafeLayout>
  );
}

export function FavoritesPage({ favorites, loading, error, toggleFavorite }) {
  const { menu, loading: catalogLoading, error: catalogError } = useMenu();
  const items = menu.filter((item) => !item.archived && favorites.includes(item.id));
  return (
    <CafeLayout title="Your saved items across campus cafés">
      <div className="favorites-grid">
        {items.map((item) => <DrinkCard key={item.id} item={item} onRemove={() => toggleFavorite(item.id)} />)}
      </div>
      {(loading || catalogLoading) && <p role="status">Loading favorites…</p>}
      {(error || catalogError) && <p role="alert">{error || catalogError}</p>}
      {!loading && !catalogLoading && !error && !catalogError && items.length === 0 && <p>Save a menu item to see it here.</p>}
    </CafeLayout>
  );
}

export function DrinkPage({ favorites, favoriteError, toggleFavorite, addToBasket }) {
  const { menu, loading, error, refresh } = useMenu();
  const { id } = useParams();
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(null);
  const timeout = useRef();
  useEffect(() => () => clearTimeout(timeout.current), []);
  const item = menu.find((entry) => entry.id === id);
  if (loading) return <main className="missing" role="status">Loading item…</main>;
  if (error && !item) return <main className="missing"><p role="alert">{error}</p><button onClick={refresh}>Retry</button></main>;
  if (!item || item.archived) return <main className="missing"><h1>Menu item unavailable</h1><Link to="/cafes">Back to cafés</Link></main>;

  const image = id === 'sweet-heaven' && item.image?.endsWith('e532a.png') ? '6310f.png' : item.image;
  const isFavorite = favorites.includes(id);

  function handleAdd() {
    addToBasket(id, quantity);
    setAdded({ quantity });
    clearTimeout(timeout.current);
    timeout.current = setTimeout(() => setAdded(null), 2200);
  }
  return (
    <main className="detail-screen" style={image ? { '--detail-photo': `url(${JSON.stringify(asset(image))})` } : undefined}>
      <div className="detail-actions">
        <Link to="/cafes" aria-label="Close drink details"><Icon file="a66de.svg" /></Link>
        <button aria-pressed={isFavorite} aria-label="Favorite" onClick={() => toggleFavorite(id)}><Icon file={isFavorite ? '7dc11.svg' : 'd350a.svg'} /></button>
      </div>
      <section className="detail-copy">
        <h1>{item.name}</h1>
        {favoriteError && <p role="alert">{favoriteError}</p>}
        <small className="item-cafe">{getCafe(item)}</small>
        {item.description && <div className="detail-description"><h2>Description</h2><p>{item.description}</p></div>}
        <b>{baht(item.price)}</b>
        <div className="quantity">
          <button className="square-button" aria-label="Decrease quantity" disabled={quantity === 1} onClick={() => setQuantity(quantity - 1)}>−</button>
          <output aria-label="Quantity">{quantity}</output>
          <button className="square-button" aria-label="Increase quantity" onClick={() => setQuantity(quantity + 1)}>+</button>
        </div>
        <button className="primary add-to-basket" onClick={handleAdd}>Add to basket</button>
        <div className="basket-feedback" role="status">
          {added && <span className="basket-feedback-message"><span aria-hidden="true">✓</span> Added {added.quantity} to basket</span>}
        </div>
      </section>
    </main>
  );
}
