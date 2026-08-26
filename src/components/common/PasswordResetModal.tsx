import React, { useState } from 'react';
import { AuthUser } from '../../types';

export const PasswordResetModal: React.FC<{
  user: AuthUser;
  onCancel: () => void;
  onUpdate: (password: string) => Promise<void>;
}> = ({ user, onCancel, onUpdate }) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (password.length < 8) return setError('Password must be at least 8 characters.');
    if (password !== confirmPassword) return setError('Passwords do not match.');
    setBusy(true);
    setError('');
    try { await onUpdate(password); } catch (caught: any) { setError(caught.message || 'Unable to update password.'); setBusy(false); }
  };

  return <div className="fixed inset-0 z-50 bg-slate-950/60 flex items-center justify-center p-4">
    <form onSubmit={submit} className="w-full max-w-md bg-white rounded-2xl p-6 space-y-4 shadow-xl">
      <div><h2 className="text-xl font-bold">Reset Password</h2><p className="text-sm text-slate-500 mt-1">{user.name} · {user.loginId}</p></div>
      {error && <p className="bg-rose-50 text-rose-700 rounded-xl p-3 text-sm">{error}</p>}
      <label className="block text-sm font-semibold">New Password<input autoFocus type="password" required minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} className="mt-2 w-full border rounded-xl p-3 font-normal" /></label>
      <label className="block text-sm font-semibold">Confirm New Password<input type="password" required minLength={8} value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} className="mt-2 w-full border rounded-xl p-3 font-normal" /></label>
      <div className="flex justify-end gap-3"><button type="button" disabled={busy} onClick={onCancel} className="border rounded-xl px-4 py-2 font-semibold">Cancel</button><button disabled={busy} className="bg-blue-600 text-white rounded-xl px-4 py-2 font-semibold disabled:opacity-50">{busy ? 'Updating…' : 'Update Password'}</button></div>
    </form>
  </div>;
};
