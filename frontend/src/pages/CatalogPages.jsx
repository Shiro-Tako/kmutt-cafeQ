import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import CafeLayout, { asset, Icon } from '../components/layout/CafeLayout.jsx';
import DrinkCard from '../components/common/DrinkCard.jsx';
import { baht, getItem, menu } from '../data/menu.js';

const categories = ['Coffee', 'Tea & More', 'Snacks'];

export function CafesPage() {
  const [category, setCategory] = useState(categories[0]);
  const [query, setQuery] = useState('');
  const items = menu.filter((item) => item.category === category && item.name.toLowerCase().includes(query.trim().toLowerCase()));

  return (
    <CafeLayout title="Choose a café to start ordering">
      <input className="search" type="search" aria-label="Search menu" placeholder="Search.." value={query} onChange={(event) => setQuery(event.target.value)} />
      <div className="segments category-tabs" aria-label="Menu categories">
        {categories.map((name) => <button key={name} aria-pressed={name === category} onClick={() => setCategory(name)}>{name}</button>)}
      </div>
      <section className="catalog-list" aria-label={category}>
        {items.map((item) => (
          <article key={item.id} className="menu-item">
            <Link className="menu-item-info" to={`/drink/${item.id}`}>
              <span className="menu-photo">{item.image && <img src={asset(item.image)} alt="" />}</span>
              <span className="menu-item-copy"><strong>{item.name}</strong><span>{item.description}</span><b>{baht(item.price)}</b></span>
            </Link>
            <Link className="square-button" to={`/drink/${item.id}`} aria-label={`Choose ${item.name}`}>+</Link>
          </article>
        ))}
        {items.length === 0 && <p>No menu items found.</p>}
      </section>
    </CafeLayout>
  );
}

export function FavoritesPage({ favorites, toggleFavorite }) {
  return (
    <CafeLayout title="Your saved items across campus cafés">
      <div className="favorites-grid">
        {favorites.map(getItem).filter(Boolean).map((item) => <DrinkCard key={item.id} item={item} onRemove={() => toggleFavorite(item.id)} />)}
      </div>
      {favorites.length === 0 && <p>Save a menu item to see it here.</p>}
    </CafeLayout>
  );
}

export function DrinkPage({ favorites, toggleFavorite, addToBasket }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [quantity, setQuantity] = useState(1);
  const item = getItem(id);
  if (!item) return <main className="missing"><h1>Menu item not found</h1><Link to="/cafes">Back to cafés</Link></main>;

  const image = id === 'sweet-heaven' ? '6310f.png' : item.image;
  const isFavorite = favorites.includes(id);
  return (
    <main className="detail-screen" style={image ? { '--detail-photo': `url("${asset(image)}")` } : undefined}>
      <div className="detail-actions">
        <Link to="/cafes" aria-label="Close drink details"><Icon file="a66de.svg" /></Link>
        <button aria-pressed={isFavorite} aria-label="Favorite" onClick={() => toggleFavorite(id)}><Icon file={isFavorite ? '7dc11.svg' : 'd350a.svg'} /></button>
      </div>
      <section className="detail-copy">
        <h1>{item.name}</h1>
        <p>{item.description}</p>
        <b>{baht(item.price)}</b>
        <div className="quantity">
          <button className="square-button" aria-label="Decrease quantity" disabled={quantity === 1} onClick={() => setQuantity(quantity - 1)}>−</button>
          <output aria-label="Quantity">{quantity}</output>
          <button className="square-button" aria-label="Increase quantity" onClick={() => setQuantity(quantity + 1)}>+</button>
        </div>
        <button className="primary buy-button" onClick={() => { addToBasket(id, quantity); navigate('/basket'); }}>Buy Now</button>
      </section>
    </main>
  );
}
