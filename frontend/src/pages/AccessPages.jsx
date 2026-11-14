import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { asset, Icon, StatusBar } from '../components/layout/CafeLayout.jsx';

function Brand({ welcome = false }) {
  return <div className="brand"><h1>KMUTT CafeQ</h1><p>{welcome ? 'Grab your favorite drink' : 'Skip the line, grab your favorite drink'}</p></div>;
}

export function WelcomePage() {
  return (
    <main className="welcome-screen" style={{ '--wallpaper': `url("${asset('86a85.png')}")` }}>
      <StatusBar />
      <Link className="welcome-link" to="/login" aria-label="Continue to KMUTT CafeQ"><Brand welcome /></Link>
    </main>
  );
}

export function LoginPage() {
  const [mode, setMode] = useState('Login');
  const [visible, setVisible] = useState(false);
  const [help, setHelp] = useState(false);
  const navigate = useNavigate();
  const signUp = mode === 'Sign Up';

  return (
    <main className="login-screen">
      <div className="login-wallpaper" style={{ '--wallpaper': `url("${asset('86a85.png')}")` }} />
      <StatusBar />
      <Brand />
      <section className="login-panel outlined">
        <div className="segments login-tabs">
          {['Login', 'Sign Up'].map((tab) => <button key={tab} aria-pressed={tab === mode} onClick={() => { setMode(tab); setHelp(false); }}>{tab}</button>)}
        </div>
        <form onSubmit={(event) => { event.preventDefault(); navigate('/'); }}>
          <input aria-label="Username or email" placeholder="Username or email" autoComplete="username" />
          <div className="password-field">
            <input aria-label="Password" placeholder="Password" autoComplete={signUp ? 'new-password' : 'current-password'} type={visible ? 'text' : 'password'} />
            <button type="button" aria-label={visible ? 'Hide password' : 'Show password'} aria-pressed={visible} onClick={() => setVisible(!visible)}><Icon file="e6126.svg" /></button>
          </div>
          {signUp
            ? <input aria-label="Confirm password" placeholder="Confirm password" autoComplete="new-password" type={visible ? 'text' : 'password'} />
            : <button type="button" className="forgot-password" onClick={() => setHelp(!help)}>Forgot password?</button>}
          {help && <p role="status" className="login-help">Password reset is unavailable in this preview.</p>}
          <button type="submit" className="primary login-submit">{mode}</button>
        </form>
        <div className="login-divider">or</div>
        <Link className="staff-login outlined" to="/staff/orders">Staff Login</Link>
        <p className="staff-hint">For café staff &amp; store managers</p>
      </section>
      <img className="login-decoration beans" src={asset('83570.png')} alt="" />
      <img className="login-decoration chocolate" src={asset('9c2ba.png')} alt="" />
    </main>
  );
}
