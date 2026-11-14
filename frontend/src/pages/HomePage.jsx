import { Link } from 'react-router';
import CafeLayout, { asset, Icon } from '../components/layout/CafeLayout.jsx';
import DrinkCard from '../components/common/DrinkCard.jsx';
import { getItem } from '../data/menu.js';

export default function HomePage() {
  return (
    <CafeLayout title="Good day, Somchai">
      <Link className="feature" to="/drink/sweet-heaven">
        <span><small>Popular right now</small><strong>Iced Coffee<br />Sweet Heaven</strong><small>More info <Icon file="81ec2.svg" /></small></span>
        <img className="feature-photo" src={asset('39b54.png')} alt="" />
      </Link>
      <section className="recommendations">
        <div className="section-heading"><h2>This week’s recommendations</h2><Link to="/cafes">See all</Link></div>
        <div className="recommendation-row">
          <DrinkCard item={getItem('americano')} />
          <DrinkCard item={{ ...getItem('cappuccino'), image: '61865.png' }} />
          <DrinkCard item={{ ...getItem('iced-chocolate'), image: '7c328.png' }} />
        </div>
      </section>
      <section className="shop">
        <h2>What’s in the shop?</h2>
        <Link to="/cafes" className="shop-banner" style={{ backgroundImage: `linear-gradient(90deg, #af950c, transparent 69%), url(${asset('d6a61.png')})` }}>
          <strong>New menu items<br />at Cafe Rung!</strong>
          <span>Explore drinks for campus pickup.</span>
        </Link>
      </section>
    </CafeLayout>
  );
}
