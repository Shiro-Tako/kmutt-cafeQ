import { Link } from 'react-router';
import CafeLayout, { asset, Icon } from '../components/layout/CafeLayout.jsx';
import DrinkCard from '../components/common/DrinkCard.jsx';
import { useMenu } from '../data/MenuContext.jsx';
import welcomeAnt from '../assets/campus/ant-welcome.png';
import CampusAnt from '../components/common/CampusAnt.jsx';

export default function HomePage() {
  const { menu, loading, error, refresh, account } = useMenu();
  const available = menu.filter((item) => !item.archived);
  const featured = available.find((item) => item.id === 'sweet-heaven') ?? available[0];
  const recommended = available.filter((item) => item.id !== featured?.id).slice(0, 3);
  return (
    <CafeLayout title={account ? `Good day, ${account.name}` : 'Welcome to KMUTT CafeQ'}>
      <Link className="campus-poster" to="/cafes">
        <div><h2>Your campus<br />coffee break.</h2><span>Explore cafés <b aria-hidden="true">↗</b></span></div>
        <img src={welcomeAnt} alt="" width="512" height="512" />
      </Link>
      <nav className="campus-shortcuts" aria-label="Pickup shortcuts">
        <Link to="/cafes"><CampusAnt pose="cafes" />Find a café</Link>
        <Link to="/basket?tab=orders"><CampusAnt pose="orders" />My queue</Link>
        <Link to="/favorites"><CampusAnt pose="favorites" />Favorites</Link>
      </nav>
      {error && <p role="alert">{error} <button onClick={refresh}>Retry catalog</button></p>}
      {loading && <p role="status">Loading menu…</p>}
      {featured && <Link className="feature" to={`/drink/${featured.id}`}>
        <span><small>Popular at {featured.cafe}</small><strong>{featured.name}</strong><small>More info <Icon file="81ec2.svg" /></small></span>
        {featured.image && <img className="feature-photo" src={asset(featured.image)} alt="" />}
      </Link>}
      <section className="recommendations">
        <div className="section-heading"><h2>This week’s recommendations</h2><Link to="/cafes">See all</Link></div>
        <div className="recommendation-row">
          {recommended.map((item) => <DrinkCard key={item.id} item={item} />)}
        </div>
      </section>
    </CafeLayout>
  );
}
