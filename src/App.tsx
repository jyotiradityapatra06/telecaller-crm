import React, { useState, useEffect, useCallback } from 'react';
import { AuthUser, Lead } from './types';
import { api } from './lib/api';
import { soundManager } from './lib/sound';
import { LoginScreen } from './components/auth/LoginScreen';
import { Sidebar } from './components/common/Sidebar';
import { TopHeader } from './components/common/TopHeader';
import { BottomNav } from './components/common/BottomNav';
import { CallSimulatorModal } from './components/common/CallSimulatorModal';
import { SimpleTelecallerHome } from './components/telecaller/SimpleTelecallerHome';
import { TelecallerLeadList } from './components/telecaller/TelecallerLeadList';
import { TelecallerLeadDetailModal } from './components/telecaller/TelecallerLeadDetailModal';
import { TelecallerFollowUps } from './components/telecaller/TelecallerFollowUps';
import { TelecallerProfile } from './components/telecaller/TelecallerProfile';
import { AdminTelecallerDetailModal } from './components/admin/AdminTelecallerDetailModal';
import { OwnerPortal } from './components/owner/OwnerPortal';
import { HrDashboard } from './components/hr/HrDashboard';
import { HrLeadUpload } from './components/hr/HrLeadUpload';
import { HrTelecallers } from './components/hr/HrTelecallers';

export default function App() {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [allTelecallers, setAllTelecallers] = useState<AuthUser[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoadingInitial, setIsLoadingInitial] = useState(true);

  // Active navigation tab per role
  const [telecallerTab, setTelecallerTab] = useState<'home' | 'leads' | 'followups' | 'profile'>('home');
  const [ownerTab, setOwnerTab] = useState<'dashboard' | 'companies' | 'hrs' | 'reports'>('dashboard');
  const [hrTab, setHrTab] = useState<'dashboard' | 'telecallers' | 'upload' | 'followups'>('dashboard');

  // Modals
  const [selectedLeadForDetail, setSelectedLeadForDetail] = useState<Lead | null>(null);
  const [selectedTcForDetail, setSelectedTcForDetail] = useState<AuthUser | null>(null);

  // Calling & WhatsApp Simulator
  const [callModalLead, setCallModalLead] = useState<Lead | null>(null);
  const [callModalMode, setCallModalMode] = useState<'call' | 'whatsapp'>('call');
  const [isCallModalOpen, setIsCallModalOpen] = useState(false);

  // Fetch / Refresh data
  const fetchData = useCallback(async () => {
    try {
      const user = api.getCurrentUser();
      setCurrentUser(user);

      if (!user) {
        setLeads([]);
        setAllTelecallers([]);
        setIsLoadingInitial(false);
        return false;
      }

      if (user.role !== 'TELECALLER') {
        const [leadsData, tcsData] = await Promise.all([
          api.getAdminLeads(),
          api.getAdminTelecallers(),
        ]);
        setLeads(leadsData);
        setAllTelecallers(tcsData);
      } else {
        const myLeads = await api.getTelecallerLeads();
        setLeads(myLeads);
        setAllTelecallers([]);
      }
      return true;
    } catch (err) {
      console.error('Failed to load CRM data:', err);
      if (!api.isAuthenticated()) {
        setCurrentUser(null);
        setLeads([]);
        setAllTelecallers([]);
      }
      return false;
    } finally {
      setIsLoadingInitial(false);
    }
  }, []);

  useEffect(() => {
    // Check local token or restore session
    const user = api.getCurrentUser();
    if (user) {
      fetchData();
    } else {
      setIsLoadingInitial(false);
    }
  }, [fetchData]);

  // Login handler
  const handleLoginSuccess = (user: AuthUser) => {
    setLeads([]);
    setAllTelecallers([]);
    setSelectedLeadForDetail(null);
    setSelectedTcForDetail(null);
    setCallModalLead(null);
    setIsCallModalOpen(false);
    setCurrentUser(user);
    if (user.role === 'OWNER') {
      setOwnerTab('dashboard');
    } else if (user.role === 'HR') {
      setHrTab('dashboard');
    } else {
      setTelecallerTab('home');
    }
    fetchData();
  };

  // Quick switch user / role (Development Testing Only)
  const handleQuickSwitchUser = async (targetLoginId: string) => {
    if (!import.meta.env.DEV) {
      return;
    }
    try {
      const pass = targetLoginId === 'admin' ? 'admin123' : 'password123';
      const res = await api.login(targetLoginId, pass);
      setLeads([]);
      setAllTelecallers([]);
      setSelectedLeadForDetail(null);
      setSelectedTcForDetail(null);
      setCallModalLead(null);
      setIsCallModalOpen(false);
      setCurrentUser(res.user);
      if (res.user.role === 'OWNER') {
        setOwnerTab('dashboard');
      } else if (res.user.role === 'HR') {
        setHrTab('dashboard');
      } else {
        setTelecallerTab('home');
      }
      fetchData();
    } catch (err: any) {
      alert('Unable to switch user: ' + err.message);
    }
  };

  // Logout handler
  const handleLogout = () => {
    api.logout();
    setCurrentUser(null);
    setLeads([]);
    setAllTelecallers([]);
    setSelectedLeadForDetail(null);
    setSelectedTcForDetail(null);
    setCallModalLead(null);
    setIsCallModalOpen(false);
  };

  // Initiate Call
  const handleInitiateCall = (lead: Lead) => {
    setCallModalLead(lead);
    setCallModalMode('call');
    setIsCallModalOpen(true);
  };

  // Initiate WhatsApp
  const handleInitiateWhatsApp = (lead: Lead) => {
    setCallModalLead(lead);
    setCallModalMode('whatsapp');
    setIsCallModalOpen(true);
  };

  // When call / whatsapp simulator finishes, log call and open LeadDetailModal for quick status entry
  const handleCallEnded = async (durationSeconds: number) => {
    if (!callModalLead) {
      setIsCallModalOpen(false);
      return;
    }

    try {
      // Record call log to server
      await api.logCall(
        callModalLead.id,
        durationSeconds,
        callModalLead.status,
        callModalMode === 'call' ? 'Call' : 'WhatsApp'
      );

      // Re-fetch lead data
      await fetchData();

      setIsCallModalOpen(false);

      // Open the lead detail modal immediately for rapid 1-tap outcome classification
      setSelectedLeadForDetail(callModalLead);
    } catch (err: any) {
      console.error('Failed to log call:', err);
      setIsCallModalOpen(false);
    }
  };

  if (isLoadingInitial) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-sm font-bold text-slate-400">Loading TeleCaller CRM Enterprise...</p>
      </div>
    );
  }

  // If not logged in, render the clean LoginScreen
  if (!currentUser) {
    return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
  }

  // Calculate Badges
  const overdueOrTodayCount = leads.filter((l) => {
    if (!l.activeFollowUp || l.activeFollowUp.isCompleted) return false;
    const today = new Date().toISOString().split('T')[0];
    return l.activeFollowUp.dueDate <= today;
  }).length;

  const unassignedCount = leads.filter((l) => !l.assignedTo).length;
  const selectedLeadIndex = leads.findIndex((lead) => lead.id === selectedLeadForDetail?.id);
  const nextPendingLead = currentUser.role === 'TELECALLER'
    ? leads.slice(selectedLeadIndex + 1).find((lead) => lead.status === 'NEW') || leads.find((lead) => lead.status === 'NEW' && lead.id !== selectedLeadForDetail?.id)
    : undefined;

  const currentTab = currentUser.role === 'OWNER' ? ownerTab : currentUser.role === 'HR' ? hrTab : telecallerTab;
  const handleSelectTab = (tab: string) => {
    if (currentUser.role === 'OWNER') {
      setOwnerTab(tab as any);
    } else if (currentUser.role === 'HR') {
      setHrTab(tab as any);
    } else {
      setTelecallerTab(tab as any);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-row antialiased selection:bg-blue-600 selection:text-white font-sans overflow-x-hidden">
      {/* Desktop Persistent Left Sidebar */}
      <Sidebar
        currentUser={currentUser}
        currentTab={currentTab}
        onSelectTab={handleSelectTab}
        allTelecallers={allTelecallers}
        onSwitchUser={handleQuickSwitchUser}
        onLogout={handleLogout}
        followUpBadgeCount={overdueOrTodayCount}
        unassignedBadgeCount={unassignedCount}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden bg-slate-50">
        {/* Top Header Bar (Shown on mobile & tablet) */}
        <div className="lg:hidden">
          <TopHeader
            currentUser={currentUser}
            allTelecallers={allTelecallers}
            onSwitchUser={handleQuickSwitchUser}
            onLogout={handleLogout}
          />
        </div>

        {/* Scrollable Viewport Content */}
        <main className="flex-1 overflow-y-auto custom-scrollbar relative pb-20 lg:pb-6">
          {currentUser.role === 'TELECALLER' ? (
            <>
              {telecallerTab === 'home' && (
                <SimpleTelecallerHome user={currentUser} leads={leads} onStart={(lead)=>setSelectedLeadForDetail(lead)} onLead={setSelectedLeadForDetail} onNavigate={(tab)=>setTelecallerTab(tab as any)} />
              )}

              {telecallerTab === 'leads' && (
                <TelecallerLeadList
                  leads={leads}
                  currentUser={currentUser}
                  currentTelecaller={currentUser}
                  onSelectLead={(lead) => setSelectedLeadForDetail(lead)}
                  onInitiateCall={handleInitiateCall}
                  onInitiateWhatsApp={handleInitiateWhatsApp}
                />
              )}

              {telecallerTab === 'followups' && (
                <TelecallerFollowUps
                  leads={leads}
                  currentUser={currentUser}
                  currentTelecaller={currentUser}
                  onSelectLead={(lead) => setSelectedLeadForDetail(lead)}
                  onInitiateCall={handleInitiateCall}
                  onInitiateWhatsApp={handleInitiateWhatsApp}
                  onFollowUpCompleted={fetchData}
                />
              )}

              {telecallerTab === 'profile' && (
                <TelecallerProfile
                  currentUser={currentUser}
                  telecaller={currentUser}
                  allTelecallers={allTelecallers}
                  leads={leads}
                  onSwitchTelecaller={handleQuickSwitchUser}
                  onSwitchToAdmin={() => handleQuickSwitchUser('admin')}
                  onLogout={handleLogout}
                />
              )}
            </>
          ) : currentUser.role === 'OWNER' ? (
            <OwnerPortal tab={ownerTab} leads={leads} telecallers={allTelecallers} refresh={fetchData} />
          ) : (
            <>
              {hrTab === 'dashboard' && <HrDashboard user={currentUser} leads={leads} telecallers={allTelecallers} onNavigate={(tab)=>setHrTab(tab as any)} />}
              {hrTab === 'telecallers' && <HrTelecallers user={currentUser} leads={leads} telecallers={allTelecallers} refresh={fetchData} />}
              {hrTab === 'upload' && <HrLeadUpload user={currentUser} telecallers={allTelecallers} onComplete={fetchData} onViewTelecaller={()=>setHrTab('telecallers')} />}
              {hrTab === 'followups' && <div className="max-w-6xl mx-auto p-5 sm:p-8"><h1 className="text-3xl font-bold">Team follow-ups</h1><p className="text-slate-500 mt-2">Today and overdue follow-ups across your company.</p><div className="mt-6 bg-white border rounded-2xl divide-y">{leads.filter(l=>l.activeFollowUp).map(l=><div key={l.id} className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-left p-4"><b>{l.name}</b><span>{l.assignedTelecallerName||'Unassigned'}</span><span>{l.activeFollowUp?.dueDate}</span><span>{l.activeFollowUp?.dueTime}</span></div>)}{!leads.some(l=>l.activeFollowUp)&&<p className="p-8 text-center text-slate-500">No team follow-ups are pending.</p>}</div></div>}
            </>
          )}
        </main>

        {/* Mobile / Tablet Bottom Navigation */}
        <BottomNav
          role={currentUser.role === 'OWNER' ? 'owner' : currentUser.role === 'HR' ? 'hr' : 'telecaller'}
          currentTab={currentTab}
          onSelectTab={handleSelectTab}
          followUpBadgeCount={overdueOrTodayCount}
          unassignedBadgeCount={unassignedCount}
        />
      </div>

      {/* Telecaller Lead Detail / Status / Follow-up Workspace Modal */}
      <TelecallerLeadDetailModal
        lead={selectedLeadForDetail}
        currentUser={currentUser}
        currentTelecaller={currentUser}
        isOpen={Boolean(selectedLeadForDetail)}
        onClose={() => setSelectedLeadForDetail(null)}
        onLeadUpdated={fetchData}
        onNextLead={nextPendingLead ? () => setSelectedLeadForDetail(nextPendingLead) : undefined}
        onInitiateCall={(l) => {
          setSelectedLeadForDetail(null);
          handleInitiateCall(l);
        }}
        onInitiateWhatsApp={(l) => {
          setSelectedLeadForDetail(null);
          handleInitiateWhatsApp(l);
        }}
      />

      {/* Admin Telecaller Detail Modal */}
      <AdminTelecallerDetailModal
        telecaller={selectedTcForDetail}
        allTelecallers={allTelecallers}
        leads={leads}
        isOpen={Boolean(selectedTcForDetail)}
        onClose={() => setSelectedTcForDetail(null)}
        onLeadUpdated={fetchData}
        onTelecallerUpdated={fetchData}
      />

      {/* Real-time Call / WhatsApp Simulator Modal */}
      <CallSimulatorModal
        lead={callModalLead}
        currentUser={currentUser}
        isOpen={isCallModalOpen}
        onClose={() => setIsCallModalOpen(false)}
        onCallSaved={() => {
          fetchData();
          setIsCallModalOpen(false);
        }}
        mode={callModalMode}
      />
    </div>
  );
}
