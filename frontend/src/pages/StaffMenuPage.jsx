import { useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router';
import { asset, Icon, StatusBar } from '../components/layout/CafeLayout.jsx';
import { useMenu } from '../data/MenuContext.jsx';
import { baht, categories } from '../data/menu.js';

export function StaffLayout({ cafe, onLogout }) {
  const [settings, setSettings] = useState(false);
  const { pathname } = useLocation();

  return (
    <main className="staff-screen">
      <StatusBar />
      <section>
        <div className="spread staff-title">
          <h1>{cafe} — {pathname.endsWith('/menu') ? 'Menu' : 'Orders'}</h1>
          <button aria-label="Staff settings" aria-expanded={settings} onClick={() => setSettings(!settings)}><Icon file="474a4.svg" /></button>
        </div>
        {settings && (
          <div className="outlined staff-settings">
            <p>Store preview · changes are saved in this browser.</p>
            <Link className="staff-logout" to="/login" replace onClick={onLogout}><Icon file="dc0aa.svg" />Log out</Link>
          </div>
        )}
        <nav className="staff-nav" aria-label="Store navigation">
          <NavLink to="orders">Orders</NavLink>
          <NavLink to="menu">Menu</NavLink>
        </nav>
        <Outlet />
      </section>
    </main>
  );
}

function MenuItemForm({ item, onSave, onCancel }) {
  const [error, setError] = useState('');

  function submit(event) {
    event.preventDefault();
    const fields = new FormData(event.currentTarget);
    const name = fields.get('name').trim();
    if (!name) {
      setError('Enter an item name.');
      return;
    }
    onSave({
      name,
      price: Number(fields.get('price')),
      category: fields.get('category'),
      description: fields.get('description').trim(),
    });
  }

  return (
    <form className="outlined staff-card staff-menu-form" onSubmit={submit}>
      <h3>{item ? 'Edit menu item' : 'Add menu item'}</h3>
      <label>Item name<input name="name" defaultValue={item?.name} required maxLength={80} /></label>
      <div className="store-select">
        <label htmlFor="staff-item-category">Category</label>
        <select id="staff-item-category" name="category" defaultValue={item?.category ?? categories[0]}>
          {categories.map((category) => <option key={category}>{category}</option>)}
        </select>
      </div>
      <label>Price (baht)<input name="price" type="number" min="1" max="9999" defaultValue={item?.price} required /></label>
      <label>Description<textarea name="description" maxLength={160} rows={3} defaultValue={item?.description} /></label>
      {error && <p role="alert">{error}</p>}
      <div className="staff-card-actions">
        <button type="button" className="outlined" onClick={onCancel}>Cancel</button>
        <button type="submit" className="primary">{item ? 'Save changes' : 'Add item'}</button>
      </div>
    </form>
  );
}

export function StaffMenuPage({ cafe, editMenuItem, addMenuItem, deleteMenuItem }) {
  const { menu } = useMenu();
  const [editor, setEditor] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [notice, setNotice] = useState('');
  const items = menu.filter((item) => item.cafe === cafe && !item.archived);

  function saveItem(details) {
    if (editor.item) editMenuItem(editor.item.id, details);
    else addMenuItem(details);
    setNotice(`${details.name} ${editor.item ? 'updated' : 'added to the menu'}.`);
    setEditor(null);
  }

  return (
    <div className="staff-list staff-menu">
      <div className="spread staff-menu-heading">
        <h2>Current menu</h2>
        <button className="primary" onClick={() => { setEditor({}); setDeleting(null); }}>Add menu item</button>
      </div>
      {notice && <p role="status">{notice}</p>}
      {editor && !editor.item && <MenuItemForm key="new" onSave={saveItem} onCancel={() => setEditor(null)} />}
      {items.length === 0 && <p>This café has no menu items yet.</p>}
      <div className="staff-menu-grid">
        {items.map((item) => (
          editor?.item?.id === item.id ? (
            <MenuItemForm key={item.id} item={item} onSave={saveItem} onCancel={() => setEditor(null)} />
          ) : (
            <article className="staff-menu-card" key={item.id}>
              <div className="staff-menu-photo">
                {item.image ? <img src={asset(item.image)} alt="" loading="lazy" /> : <Icon file="42cd8.svg" />}
                <span>{item.category}</span>
              </div>
              <div className="staff-menu-copy">
                <div className="spread"><h3>{item.name}</h3><strong>{baht(item.price)}</strong></div>
                {item.description && <p>{item.description}</p>}
              </div>
              {deleting === item.id ? (
                <div className="staff-delete-confirm">
                  <p>Remove {item.name} from the menu?</p>
                  <div className="staff-card-actions">
                    <button type="button" className="outlined" onClick={() => setDeleting(null)}>Cancel</button>
                    <button type="button" className="staff-delete" onClick={() => {
                      deleteMenuItem(item.id);
                      setDeleting(null);
                      setNotice(`${item.name} removed from the menu.`);
                    }}>Remove item</button>
                  </div>
                </div>
              ) : (
                <div className="staff-card-actions">
                  <button type="button" className="outlined" onClick={() => { setEditor({ item }); setDeleting(null); }} aria-label={`Edit ${item.name}`}>Edit</button>
                  <button type="button" className="staff-delete" onClick={() => setDeleting(item.id)} aria-label={`Delete ${item.name}`}>Delete</button>
                </div>
              )}
            </article>
          )
        ))}
      </div>
    </div>
  );
}
