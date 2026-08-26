import React, { useState } from 'react';
import { KeyRound, Power, UserPlus } from 'lucide-react';
import { api } from '../../lib/api';
import { AuthUser, Lead } from '../../types';
import { PasswordResetModal } from '../common/PasswordResetModal';
import { companyName } from './HrDashboard';

export const HrTelecallers: React.FC<{ user: AuthUser; telecallers: AuthUser[]; leads: Lead[]; refresh: () => Promise<boolean> }> = ({ user, telecallers, leads, refresh }) => {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: '', loginId: '', password: '', phone: '', email: '' });
  const [resetUser, setResetUser] = useState<AuthUser | null>(null);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState('');

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (busy) return;
    setBusy('create'); setError(''); setSuccess('');
    try {
      await api.createTelecaller({ ...form, brandAccess: user.brandAccess });
      setSuccess('Telecaller created successfully.'); setOpen(false);
      setForm({ name: '', loginId: '', password: '', phone: '', email: '' });
      if (!await refresh()) setError('Telecaller was created, but the team list could not be refreshed. Please refresh the page.');
    } catch (caught: any) { setError(caught.message); } finally { setBusy(''); }
  };

  const toggle = async (telecaller: AuthUser) => {
    if (busy) return;
    setBusy(`toggle-${telecaller.id}`); setError(''); setSuccess('');
    try {
      await api.updateTelecaller(telecaller.id, { isActive: !telecaller.isActive });
      if (!await refresh()) setError('Telecaller was updated, but the team list could not be refreshed. Please refresh the page.');
    } catch (caught: any) { setError(caught.message); } finally { setBusy(''); }
  };

  const resetPassword = async (password: string) => {
    if (!resetUser) return;
    await api.resetTelecallerPassword(resetUser.id, password);
    setResetUser(null); setSuccess('Password updated successfully.');
  };

  return <div className="max-w-6xl mx-auto p-5 sm:p-8 space-y-6">
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"><div><p className="text-sm font-semibold text-blue-600">{companyName(user.brandAccess)}</p><h1 className="text-3xl font-bold">Telecallers</h1></div><button onClick={() => setOpen(!open)} className="bg-blue-600 text-white rounded-xl px-4 py-3 font-semibold flex justify-center gap-2"><UserPlus />Create Telecaller</button></div>
    {error && <p className="bg-rose-50 text-rose-700 p-3 rounded-xl">{error}</p>}
    {success && <p className="bg-emerald-50 text-emerald-800 p-4 rounded-xl font-semibold">{success}</p>}
    {open && <form onSubmit={submit} className="bg-white border rounded-2xl p-6 grid sm:grid-cols-2 gap-4"><h2 className="sm:col-span-2 text-xl font-bold">New telecaller</h2>{Object.keys(form).map((key) => <label key={key} className="text-sm font-semibold text-slate-700">{key === 'loginId' ? 'Login ID' : key[0].toUpperCase() + key.slice(1)}<input type={key === 'password' ? 'password' : 'text'} required={['name', 'password'].includes(key)} minLength={key === 'password' ? 8 : undefined} placeholder={key === 'loginId' ? 'Optional — generated if blank' : ''} value={(form as any)[key]} onChange={(event) => setForm({ ...form, [key]: event.target.value })} className="mt-2 w-full border rounded-xl p-3 font-normal" /></label>)}<p className="sm:col-span-2 text-sm text-slate-500">Company is automatically set to {companyName(user.brandAccess)}.</p><button disabled={busy === 'create'} className="sm:col-span-2 bg-blue-600 text-white rounded-xl p-3 font-bold disabled:opacity-50">{busy === 'create' ? 'Creating…' : 'Create Telecaller'}</button></form>}
    <div className="bg-white border rounded-2xl overflow-x-auto"><table className="w-full min-w-[820px] text-sm"><thead className="bg-slate-50 text-left"><tr>{['Name', 'Login ID', 'Leads', 'Calls Today', 'Pending', 'Follow-ups', 'Status', 'Actions'].map((heading) => <th key={heading} className="p-4">{heading}</th>)}</tr></thead><tbody className="divide-y">{telecallers.map((telecaller) => { const metrics = telecaller.metrics; const assigned = metrics?.assignedLeads || 0; const called = metrics?.callsMade || 0; return <tr key={telecaller.id}><td className="p-4 font-semibold">{telecaller.name}</td><td className="p-4">{telecaller.loginId}</td><td className="p-4">{assigned}</td><td className="p-4">{called}</td><td className="p-4">{Math.max(0, assigned - called)}</td><td className="p-4">{metrics?.followUps || 0}</td><td className={`p-4 ${telecaller.isActive ? 'text-emerald-700' : 'text-rose-700'}`}>{telecaller.isActive ? 'Active' : 'Inactive'}</td><td className="p-4"><div className="flex gap-2"><button disabled={Boolean(busy)} title="Reset password" onClick={() => setResetUser(telecaller)} className="border rounded-lg p-2 disabled:opacity-40"><KeyRound className="w-4" /></button><button disabled={Boolean(busy)} title={telecaller.isActive ? 'Deactivate' : 'Activate'} onClick={() => toggle(telecaller)} className="border rounded-lg p-2 disabled:opacity-40"><Power className="w-4" /></button></div></td></tr>; })}{telecallers.length === 0 && <tr><td colSpan={8} className="p-8 text-center text-slate-500">No telecallers yet. Create your first telecaller to start assigning leads.</td></tr>}</tbody></table></div>
    {resetUser && <PasswordResetModal user={resetUser} onCancel={() => setResetUser(null)} onUpdate={resetPassword} />}
  </div>;
};
