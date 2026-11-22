import { useCallback, useState } from 'react';
import { useMenu } from '../data/MenuContext.jsx';
import { useApiResource } from '../hooks/useApiResource.js';
import { addStaff, getTeam } from '../services/auth.js';

export default function StaffTeamPage() {
  const { account, staffStore } = useMenu();
  const load = useCallback((signal) => getTeam(staffStore.cafeId, signal), [staffStore.cafeId]);
  const team = useApiResource(load, true);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const isOwner = team.data?.ownerUserId === account?.userId;

  async function submit(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const fields = Object.fromEntries(new FormData(form));
    setPending(true); setError(''); setSuccess('');
    try {
      await addStaff(staffStore.cafeId, fields);
      form.reset(); team.refresh();
      setSuccess('Staff added. They can log in on the store side to manage orders and menu items.');
    } catch (failure) { setError(failure.message); }
    finally { setPending(false); }
  }

  return <div className="staff-team">
    <h2>Store team</h2>
    <p>Each account can join one store. Your team can manage this store’s orders and menu.</p>
    {team.loading && <p role="status">Loading team…</p>}
    {team.error && <p role="alert">{team.error} <button onClick={team.refresh}>Retry</button></p>}
    <ul className="team-list">{team.data?.items.map((user) => <li className="outlined" key={user.userId}><strong>{user.name}</strong><span>{user.email}</span><small>{user.userId === team.data.ownerUserId ? 'Owner' : 'Staff'}</small></li>)}</ul>
    {isOwner ? <form className="staff-menu-form outlined team-form" onSubmit={submit}>
      <h3>Add staff</h3>
      <p>Existing account: enter their email. New account: also enter a name and a password of at least 8 characters. Existing passwords stay unchanged.</p>
      <label>Email<input name="email" type="email" autoComplete="off" maxLength={254} required /></label>
      <label>Name (new account)<input name="name" autoComplete="off" maxLength={80} /></label>
      <label>Password (new account)<input name="password" type="password" autoComplete="new-password" minLength={8} maxLength={128} /></label>
      {error && <p role="alert">{error}</p>}
      {success && <p role="status">{success}</p>}
      <button className="primary" disabled={pending}>{pending ? 'Adding…' : 'Add staff'}</button>
    </form> : team.data && <p>Ask your store owner to add more team members.</p>}
  </div>;
}
