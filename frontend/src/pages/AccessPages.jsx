import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { asset, Icon } from '../components/layout/CafeLayout.jsx';
import { cafes } from '../data/menu.js';
import { register, sessionEnabled, signIn } from '../services/auth.js';

function Brand({ welcome = false }) {
  return <div className="brand"><h1>KMUTT CafeQ</h1><p>{welcome ? 'Grab your favorite drink' : 'Skip the line, grab your favorite drink'}</p></div>;
}

export function WelcomePage() {
  return (
    <main className="welcome-screen" style={{ '--wallpaper': `url("${asset('86a85.png')}")` }}>
      <Link className="welcome-link" to="/login" aria-label="Continue to KMUTT CafeQ"><Brand welcome /></Link>
    </main>
  );
}

export function LoginPage({ staff = false, onStaffLogin, onAccount }) {
  const [mode, setMode] = useState('Login');
  const [visible, setVisible] = useState(false);
  const [help, setHelp] = useState(false);
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);
  const navigate = useNavigate();
  const signUp = mode === 'Sign Up';

  async function submit(event) {
    event.preventDefault();
    const fields = new FormData(event.currentTarget);
    if (sessionEnabled) {
      setError('');
      if (signUp && fields.get('password') !== fields.get('confirmation')) {
        setError('Passwords must match.');
        return;
      }
      setPending(true);
      try {
        const credentials = { email: fields.get('username').trim(), password: fields.get('password') };
        const account = signUp ? await register({ ...credentials, name: fields.get('name').trim(), phone: fields.get('phone').trim() }) : await signIn(credentials);
        onAccount(account);
        if (staff && !account.staffCafeIds?.length) {
          setError('This account has no assigned café.');
          return;
        }
        navigate(staff ? '/staff/orders' : '/', { replace: true });
      } catch (failure) {
        setError(failure.message);
      } finally {
        setPending(false);
      }
      return;
    }
    if (!staff) {
      navigate('/');
      return;
    }

    if (signUp && fields.get('password') !== fields.get('confirmation')) {
      setError('Passwords must match.');
      return;
    }
    onStaffLogin(fields.get('cafe'));
    navigate('/staff/orders', { replace: true });
  }

  return (
    <main className="login-screen">
      <div className="login-wallpaper" style={{ '--wallpaper': `url("${asset('86a85.png')}")` }} />
      <Brand />
      <section className={staff ? 'login-panel outlined staff-access' : 'login-panel outlined'}>
        {staff && <><h2>Store access</h2><p>{sessionEnabled ? 'Sign in with your assigned staff account.' : 'Demo only. Use sample credentials.'}</p></>}
        <div className="segments login-tabs">
          {(staff && sessionEnabled ? ['Login'] : ['Login', 'Sign Up']).map((tab) => <button key={tab} disabled={pending} aria-pressed={tab === mode} onClick={() => { setMode(tab); setHelp(false); setError(''); }}>{tab}</button>)}
        </div>
        <form onSubmit={submit}>
          {staff && !sessionEnabled && (
            <div className="store-select">
              <label htmlFor="staff-store">Store</label>
              <select id="staff-store" name="cafe" required defaultValue="">
                <option value="" disabled>Choose your store</option>
                {cafes.map((cafe) => <option key={cafe}>{cafe}</option>)}
              </select>
            </div>
          )}
          {sessionEnabled && signUp && <input name="name" aria-label="Name" placeholder="Name" autoComplete="name" required />}
          {sessionEnabled && signUp && <input name="phone" aria-label="Phone (optional)" placeholder="Phone (optional)" autoComplete="tel" type="tel" maxLength={30} />}
          <input name="username" aria-label={sessionEnabled ? 'Email' : 'Username or email'} placeholder={sessionEnabled ? 'Email' : 'Username or email'} type={sessionEnabled ? 'email' : 'text'} autoComplete="username" required={staff || sessionEnabled} />
          <div className="password-field">
            <input name="password" aria-label="Password" placeholder="Password" autoComplete={signUp ? 'new-password' : 'current-password'} type={visible ? 'text' : 'password'} required={staff || sessionEnabled} />
            <button type="button" aria-label={visible ? 'Hide password' : 'Show password'} aria-pressed={visible} onClick={() => setVisible(!visible)}><Icon file="e6126.svg" /></button>
          </div>
          {signUp
            ? <input name="confirmation" aria-label="Confirm password" placeholder="Confirm password" autoComplete="new-password" type={visible ? 'text' : 'password'} required={staff || sessionEnabled} />
            : <button type="button" className="forgot-password" onClick={() => setHelp(!help)}>Forgot password?</button>}
          {help && <p role="status" className="login-help">Password reset is unavailable in this preview.</p>}
          {error && <p role="alert" className="login-help">{error}</p>}
          <button type="submit" className="primary login-submit" disabled={pending}>{pending ? 'Please wait…' : mode}</button>
        </form>
        <div className="login-divider">or</div>
        <Link className="staff-login outlined" to={staff ? '/login' : '/staff/login'}>{staff ? 'Switch to customer side' : 'Switch to store side'}</Link>
        {!staff && <p className="staff-hint">For café staff &amp; store managers</p>}
      </section>
      <img className="login-decoration beans" src={asset('83570.png')} alt="" />
      <img className="login-decoration chocolate" src={asset('9c2ba.png')} alt="" />
    </main>
  );
}
