import { Link } from 'react-router';
import CafeLayout, { asset, Icon } from '../components/layout/CafeLayout.jsx';
import DrinkCard from '../components/common/DrinkCard.jsx';
import { useMenu } from '../data/MenuContext.jsx';

export default function HomePage() {
  const { menu, loading, error, refresh, account } = useMenu();
  const available = menu.filter((item) => !item.archived);
  const featured = available.find((item) => item.id === 'sweet-heaven') ?? available[0];
  const recommended = available.filter((item) => item.id !== featured?.id).slice(0, 3);
  return (
    <CafeLayout title={account ? `Good day, ${account.name}` : 'Welcome to KMUTT CafeQ'}>
      {error && <p role="alert">{error} <button onClick={refresh}>Retry catalog</button></p>}
      {loading && <p role="status">Loading menu…</p>}
      {featured && <Link className="feature" to={`/drink/${featured.id}`}>
        <span><small>Popular at {featured.cafe}</small><strong>{featured.name}</strong><small>More info <Icon file="81ec2.svg" /></small></span>
        {featured.image && <img className="feature-photo" src={asset(featured.id === 'sweet-heaven' ? '39b54.png' : featured.image)} alt="" />}
      </Link>}
      <section className="recommendations">
        <div className="section-heading"><h2>This week’s recommendations</h2><Link to="/cafes">See all</Link></div>
        <div className="recommendation-row">
          {recommended.map((item) => <DrinkCard key={item.id} item={item} />)}
        </div>
      </section>
      <section className="shop">
        <h2>What’s in the shop?</h2>
        <Link to="/cafes" className="shop-banner" style={{ backgroundImage: `linear-gradient(90deg, #492719f5, #49271999 56%, transparent), url(${asset('d6a61.png')})` }}>
          <strong>Your next coffee break<br />at KMUTT</strong>
          <span>Explore drinks for campus pickup.</span>
        </Link>
      </section>
    </CafeLayout>
  );
}
