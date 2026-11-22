// ให้ลูกค้าเปลี่ยนชื่อ รูปโปรไฟล์ และรหัสผ่านผ่าน API บัญชี
import { useRef, useState } from 'react';
import CafeLayout, { asset } from '../components/layout/CafeLayout.jsx';
import { requestJson } from '../services/api.js';

async function preparePhoto(file) {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 10 * 1024 * 1024) {
    throw new Error('Choose a JPG, PNG or WebP image under 10 MB.');
  }
  const bitmap = await createImageBitmap(file);
  try {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 192;
    const context = canvas.getContext('2d');
    context.fillStyle = '#fffaf5';
    context.fillRect(0, 0, 192, 192);
    const side = Math.min(bitmap.width, bitmap.height);
    context.drawImage(bitmap, (bitmap.width - side) / 2, (bitmap.height - side) / 2, side, side, 0, 0, 192, 192);
    return canvas.toDataURL('image/jpeg', 0.8);
  } finally {
    bitmap.close();
  }
}

export default function ProfilePage({ account, onAccount }) {
  const picker = useRef(null);
  const [photoMessage, setPhotoMessage] = useState('');
  const [nameMessage, setNameMessage] = useState('');
  const [passwordMessage, setPasswordMessage] = useState('');
  const [savingPhoto, setSavingPhoto] = useState(false);
  const [savingName, setSavingName] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  async function changePhoto(event) {
    const file = event.target.files[0];
    event.target.value = '';
    if (!file) return;
    setSavingPhoto(true);
    setPhotoMessage('Saving photo…');
    try {
      const photo = await preparePhoto(file);
      const saved = await requestJson('/auth/photo', { method: 'PATCH', body: { photo } });
      onAccount((current) => current?.userId === account.userId ? { ...current, photo: saved.photo } : current);
      setPhotoMessage('Profile photo updated.');
    } catch (error) { setPhotoMessage(error.message); }
    finally { setSavingPhoto(false); }
  }

  async function changeName(event) {
    event.preventDefault();
    const name = new FormData(event.currentTarget).get('name').trim();
    if (!name) {
      setNameMessage('Enter your name.');
      return;
    }
    setSavingName(true);
    setNameMessage('');
    try {
      const saved = await requestJson('/auth/name', { method: 'PATCH', body: { name } });
      onAccount((current) => current?.userId === account.userId ? { ...current, name: saved.name } : current);
      setNameMessage('Name updated.');
    } catch (error) {
      setNameMessage(error.message);
    } finally {
      setSavingName(false);
    }
  }

  async function changePassword(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const { currentPassword, newPassword, confirm } = Object.fromEntries(new FormData(form));
    if (newPassword !== confirm) {
      setPasswordMessage('The new passwords must match.');
      return;
    }
    setSavingPassword(true);
    try {
      await requestJson('/auth/password', { method: 'PATCH', body: { currentPassword, newPassword } });
      form.reset();
      setPasswordMessage('Password changed.');
    } catch (error) { setPasswordMessage(error.message); }
    finally { setSavingPassword(false); }
  }

  return <CafeLayout title="My profile">
    <section className="account-card">
      <h2>My profile</h2>
      <button className="avatar-picker" disabled={savingPhoto} onClick={() => picker.current.click()}>
        <img src={account.photo || asset('49e89.png')} alt="" />Change photo
      </button>
      <input ref={picker} hidden type="file" accept="image/jpeg,image/png,image/webp" onChange={changePhoto} />
      {photoMessage && <p role="status">{photoMessage}</p>}
      <form className="profile-name-form" onSubmit={changeName}>
        <label>Name<input key={account.name} name="name" type="text" defaultValue={account.name} autoComplete="name" maxLength={80} required disabled={savingName} onChange={() => setNameMessage('')} /></label>
        <button className="primary" disabled={savingName}>{savingName ? 'Saving…' : 'Save name'}</button>
        {nameMessage && <p role="status">{nameMessage}</p>}
      </form>
      <dl><dt>Email</dt><dd>{account.email}</dd></dl>
    </section>
    <form className="account-card" onSubmit={changePassword}>
      <h2>Change password</h2>
      <label>Current password<input required type="password" name="currentPassword" autoComplete="current-password" maxLength={128} /></label>
      <label>New password (8–128 characters)<input required type="password" name="newPassword" minLength={8} maxLength={128} autoComplete="new-password" /></label>
      <label>Confirm new password<input required type="password" name="confirm" maxLength={128} autoComplete="new-password" /></label>
      <button className="primary" disabled={savingPassword}>Save password</button>
      {passwordMessage && <p role="status">{passwordMessage}</p>}
    </form>
  </CafeLayout>;
}
