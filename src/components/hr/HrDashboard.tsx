import React from 'react';
import { ArrowRight, Clock, Phone, Upload, UserPlus, Users } from 'lucide-react';
import { AuthUser, Lead } from '../../types';

export function companyName(brand: AuthUser['brandAccess']) { return brand === 'APNI_ESTATE' ? 'Apni Estate' : 'Apni Vidya'; }

export const HrDashboard: React.FC<{ user: AuthUser; leads: Lead[]; telecallers: AuthUser[]; onNavigate: (tab: string) => void }> = ({ user, leads, telecallers, onNavigate }) => {
  const today = new Date().toISOString().slice(0, 10);
  const called = leads.filter((lead) => lead.lastCallAt?.startsWith(today)).length;
  const followUps = leads.filter((lead) => lead.activeFollowUp?.dueDate === today).length;
  const greeting = new Date().getHours() < 12 ? 'Good morning' : new Date().getHours() < 17 ? 'Good afternoon' : 'Good evening';
  return <div className="max-w-6xl mx-auto p-5 sm:p-8 space-y-8">
    <div><p className="text-sm font-semibold text-blue-600">{companyName(user.brandAccess)}</p><h1 className="text-3xl font-bold text-slate-900 mt-1">{greeting}, {user.name}</h1><p className="text-slate-500 mt-2">Here is your team’s progress today.</p></div>
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">{[
      ['Telecallers', telecallers.length, <Users/>], ['Total Leads', leads.length, <Users/>], ['Calls Today', called, <Phone/>], ['Follow-ups Today', followUps, <Clock/>]
    ].map(([label,value,icon]) => <div key={String(label)} className="bg-white border border-slate-200 rounded-2xl p-5"><div className="text-blue-600 w-5 h-5">{icon}</div><p className="text-3xl font-bold text-slate-900 mt-4">{value}</p><p className="text-sm text-slate-500 mt-1">{label}</p></div>)}</div>
    <div className="grid sm:grid-cols-2 gap-4"><button onClick={()=>onNavigate('telecallers')} className="text-left bg-blue-600 text-white rounded-2xl p-6 hover:bg-blue-700"><UserPlus className="w-7 h-7"/><h2 className="text-xl font-bold mt-5">Create Telecaller</h2><p className="text-blue-100 mt-1">Add a caller to your company</p><ArrowRight className="mt-5"/></button><button onClick={()=>onNavigate('upload')} className="text-left bg-white border-2 border-slate-200 rounded-2xl p-6 hover:border-blue-400"><Upload className="w-7 h-7 text-blue-600"/><h2 className="text-xl font-bold text-slate-900 mt-5">Upload Excel</h2><p className="text-slate-500 mt-1">Assign a sheet directly to one telecaller</p><ArrowRight className="mt-5 text-blue-600"/></button></div>
    <section className="bg-white border border-slate-200 rounded-2xl overflow-hidden"><div className="px-5 py-4 border-b"><h2 className="font-bold text-slate-900">Telecaller progress</h2></div><div className="divide-y">{telecallers.map(tc=>{const own=leads.filter(l=>l.assignedTo===tc.id);const calls=own.filter(l=>l.totalCallsCount>0).length;const fu=own.filter(l=>l.activeFollowUp).length;return <button key={tc.id} onClick={()=>onNavigate('telecallers')} className="w-full grid grid-cols-2 sm:grid-cols-4 gap-2 text-left px-5 py-4 hover:bg-slate-50"><span className="font-semibold text-slate-900">{tc.name}</span><span>{own.length} leads</span><span>{calls} called</span><span>{fu} follow-ups</span></button>})}{telecallers.length===0&&<p className="p-8 text-center text-slate-500">Create your first telecaller to get started.</p>}</div></section>
  </div>;
};
