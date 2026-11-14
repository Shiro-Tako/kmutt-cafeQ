import { Link } from 'react-router';
import { asset, Icon } from '../layout/CafeLayout.jsx';
import { baht } from '../../data/menu.js';

export default function DrinkCard({ item, onRemove }) {
  return (
    <article className="drink-card">
      <Link to={`/drink/${item.id}`}>
        {item.image && <img className="drink-photo" src={asset(item.image)} alt="" />}
        <span><strong>{item.name}</strong><b>{baht(item.price)}</b></span>
      </Link>
      {onRemove && <button aria-label={`Remove ${item.name} from favorites`} onClick={onRemove}><Icon file="5c95c.svg" /></button>}
    </article>
  );
}
