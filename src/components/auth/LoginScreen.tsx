import React, { useState, useEffect } from 'react';
import {
  PhoneCall,
  Shield,
  User,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  ArrowRight,
  Sparkles,
  GraduationCap,
  Building2,
  Zap,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import { api } from '../../lib/api';
import { soundManager } from '../../lib/sound';
import { AuthUser } from '../../types';

interface LoginScreenProps {
  onLoginSuccess: (user: AuthUser) => void;
}

interface DemoAccountItem {
  name: string;
  loginId: string;
  password: string;
  role: 'ADMIN' | 'TELECALLER';
  brandAccess: string;
  badge: string;
  icon: 'admin' | 'vidya' | 'estate' | 'dual';
}

const DEFAULT_DEMO_ACCOUNTS: DemoAccountItem[] = [
  {
    name: 'Master Admin HQ',
    loginId: 'admin',
    password: 'admin123',
    role: 'ADMIN',
    brandAccess: 'BOTH',
    badge: 'Dual Brand HQ',
    icon: 'admin',
  },
  {
    name: 'Rahul Sharma',
    loginId: 'TC_VIDYA_1',
    password: 'password123',
    role: 'TELECALLER',
    brandAccess: 'APNI_VIDYA',
    badge: 'Apni Vidya (EdTech)',
    icon: 'vidya',
  },
  {
    name: 'Amit Kumar',
    loginId: 'TC_ESTATE_1',
    password: 'password123',
    role: 'TELECALLER',
    brandAccess: 'APNI_ESTATE',
    badge: 'Apni Estate (Realty)',
    icon: 'estate',
  },
  {
    name: 'Vikram Malhotra',
    loginId: 'TC_DUAL_1',
    password: 'password123',
    role: 'TELECALLER',
    brandAccess: 'BOTH',
    badge: 'Dual Brand Caller',
    icon: 'dual',
  },
];

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const [authMode, setAuthMode] = useState<'SIGN_IN' | 'REGISTER_ADMIN'>('SIGN_IN');
  const isDevMode = import.meta.env.DEV;

  // Sign In States
  const [roleTab, setRoleTab] = useState<'ADMIN' | 'TELECALLER'>('TELECALLER');
  const [loginId, setLoginId] = useState<string>(isDevMode ? 'TC_VIDYA_1' : '');
  const [password, setPassword] = useState<string>(isDevMode ? 'password123' : '');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [demoAccounts, setDemoAccounts] = useState<DemoAccountItem[]>(isDevMode ? DEFAULT_DEMO_ACCOUNTS : []);

  // Admin Registration States
  const [regCompanyName, setRegCompanyName] = useState<string>('');
  const [regLoginId, setRegLoginId] = useState<string>('');
  const [regPassword, setRegPassword] = useState<string>('');
  const [regConfirmPassword, setRegConfirmPassword] = useState<string>('');
  const [regPhone, setRegPhone] = useState<string>('');
  const [regEmail, setRegEmail] = useState<string>('');
  const [regShowPassword, setRegShowPassword] = useState<boolean>(false);
  const [regShowConfirmPassword, setRegShowConfirmPassword] = useState<boolean>(false);
  const [regIsLoading, setRegIsLoading] = useState<boolean>(false);
  const [regError, setRegError] = useState<string | null>(null);

  // Fetch real demo accounts from server on mount only in dev mode
  useEffect(() => {
    if (!isDevMode) return;
    let isMounted = true;
    api
      .getDemoAccounts()
      .then((data) => {
        if (!isMounted || !data) return;
        const list: DemoAccountItem[] = [];

        if (data.admin) {
          list.push({
            name: data.admin.name || 'Master Admin HQ',
            loginId: data.admin.loginId || 'admin',
            password: data.admin.password || 'admin123',
            role: 'ADMIN',
            brandAccess: 'BOTH',
            badge: 'Dual Brand HQ',
            icon: 'admin',
          });
        }

        if (Array.isArray(data.telecallers)) {
          data.telecallers.forEach((tc) => {
            let icon: 'vidya' | 'estate' | 'dual' = 'vidya';
            let badge = 'Apni Vidya';
            if (tc.brandAccess === 'APNI_ESTATE') {
              icon = 'estate';
              badge = 'Apni Estate';
            } else if (tc.brandAccess === 'BOTH') {
              icon = 'dual';
              badge = 'Dual Brand';
            }

            list.push({
              name: tc.name,
              loginId: tc.loginId,
              password: tc.password || 'password123',
              role: 'TELECALLER',
              brandAccess: tc.brandAccess,
              badge,
              icon,
            });
          });
        }

        if (list.length > 0) {
          setDemoAccounts(list);
        }
      })
      .catch(() => {
        // Fallback
      });

    return () => {
      isMounted = false;
    };
  }, [isDevMode]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanId = loginId.trim();
    const cleanPass = password.trim();

    if (!cleanId || !cleanPass) {
      setError('Please enter both Login ID and Password.');
      soundManager.playError();
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await api.login(cleanId, cleanPass);
      soundManager.playSuccess();
      onLoginSuccess(response.user);
    } catch (err: any) {
      setError(err.message || 'Invalid login ID or password. Please check your credentials and try again.');
      soundManager.playError();
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = regCompanyName.trim();
    const id = regLoginId.trim().toUpperCase();
    const pass = regPassword.trim();
    const confirm = regConfirmPassword.trim();

    if (!name) {
      setRegError('Please enter your Company or Admin Name.');
      soundManager.playError();
      return;
    }

    if (!id || id.length < 3) {
      setRegError('Admin Login ID must be at least 3 characters long.');
      soundManager.playError();
      return;
    }

    if (!/^[A-Z0-9_-]+$/.test(id)) {
      setRegError('Login ID can only contain letters, numbers, hyphens, and underscores.');
      soundManager.playError();
      return;
    }

    if (!pass || pass.length < 8) {
      setRegError('Password must be at least 8 characters long.');
      soundManager.playError();
      return;
    }

    if (pass !== confirm) {
      setRegError('Passwords do not match. Please verify.');
      soundManager.playError();
      return;
    }

    setRegIsLoading(true);
    setRegError(null);

    try {
      const res = await api.registerAdmin({
        companyName: name,
        loginId: id,
        password: pass,
        confirmPassword: confirm,
        phone: regPhone.trim() || undefined,
        email: regEmail.trim() || undefined,
      });

      soundManager.playSuccess();
      onLoginSuccess(res.user);
    } catch (err: any) {
      setRegError(err.message || 'Unable to register company account. Please try again.');
      soundManager.playError();
    } finally {
      setRegIsLoading(false);
    }
  };

  const handleQuickSelect = (acc: DemoAccountItem) => {
    soundManager.playTap();
    setRoleTab(acc.role);
    setLoginId(acc.loginId);
    setPassword(acc.password);
    setError(null);
  };

  const switchMode = (mode: 'SIGN_IN' | 'REGISTER_ADMIN') => {
    soundManager.playTap();
    setAuthMode(mode);
    setError(null);
    setRegError(null);
  };

  return (
    <div className="min-h-screen w-full bg-slate-950 text-slate-100 flex flex-col lg:flex-row antialiased">
      {/* Left Column: SaaS Brand Showcase (Visible on Desktop lg+) */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-7/12 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 p-12 flex-col justify-between relative overflow-hidden border-r border-slate-800">
        {/* Ambient Glow Orbs */}
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />

        {/* Top Branding */}
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-emerald-500 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30">
              <PhoneCall className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-white">
                TeleCaller <span className="text-blue-400">CRM</span>
              </h1>
              <p className="text-xs font-semibold text-slate-400">Enterprise Multi-Brand Sales Suite</p>
            </div>
          </div>
        </div>

        {/* Center Highlights */}
        <div className="relative z-10 space-y-8 my-auto max-w-xl">
          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-wider mb-4">
              <Sparkles className="w-3.5 h-3.5" /> High-Velocity Telecalling Operations
            </span>
            <h2 className="text-3xl xl:text-4xl font-black text-white tracking-tight leading-tight">
              Scale customer outreach across{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-emerald-400">
                EdTech & Real Estate
              </span>
            </h2>
            <p className="text-slate-400 text-sm sm:text-base mt-3 leading-relaxed">
              Unified calling queues, 1-tap WhatsApp workflows, real-time follow-up scheduling, and strict brand-segregated conversion analytics.
            </p>
          </div>

          {/* Value Pillars Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
              <div className="w-8 h-8 rounded-xl bg-indigo-500/15 text-indigo-400 flex items-center justify-center mb-2.5">
                <GraduationCap className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-white">Apni Vidya EdTech</h3>
              <p className="text-xs text-slate-400 mt-1">Course inquiries, live demo scheduling & student enrollment pipeline.</p>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center mb-2.5">
                <Building2 className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-white">Apni Estate Realty</h3>
              <p className="text-xs text-slate-400 mt-1">High-value property leads, site visit bookings & deal closures.</p>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
              <div className="w-8 h-8 rounded-xl bg-blue-500/15 text-blue-400 flex items-center justify-center mb-2.5">
                <Zap className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-white">1-Tap Outcome Disposition</h3>
              <p className="text-xs text-slate-400 mt-1">Instant outcome recording with automated customer timeline.</p>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
              <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center mb-2.5">
                <Clock className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-white">Smart Follow-up Reminders</h3>
              <p className="text-xs text-slate-400 mt-1">Never lose a hot lead with intelligent overdue callback alerts.</p>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="relative z-10 text-xs text-slate-500 flex items-center justify-between">
          <span>Enterprise Secure JWT Authentication</span>
          <span>v2.5 Production Ready</span>
        </div>
      </div>

      {/* Right Column: Authentication Form Container */}
      <div className="w-full lg:w-1/2 xl:w-5/12 flex items-center justify-center p-4 sm:p-8 md:p-12 overflow-y-auto">
        <div className="w-full max-w-md space-y-6">
          {/* Mobile Header (Shown on small screens) */}
          <div className="lg:hidden text-center mb-6">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-emerald-500 text-white shadow-lg shadow-indigo-600/30 mb-2.5">
              <PhoneCall className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">
              TeleCaller <span className="text-blue-400">CRM</span>
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">Enterprise Dual-Brand CRM</p>
          </div>

          {/* Auth Card */}
          <div className="bg-slate-900/90 rounded-3xl border border-slate-800 shadow-2xl p-6 sm:p-8 backdrop-blur-xl">
            {authMode === 'SIGN_IN' ? (
              <>
                <div className="mb-6">
                  <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Welcome back</h2>
                  <p className="text-xs sm:text-sm text-slate-400 mt-1">Sign in to your account to start your calling queue</p>
                </div>

                {/* Role Tab Selector (Telecaller vs Admin) */}
                <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-950 rounded-2xl border border-slate-800 mb-6">
                  <button
                    type="button"
                    id="tab-role-telecaller"
                    onClick={() => {
                      soundManager.playTap();
                      setRoleTab('TELECALLER');
                      if (isDevMode) {
                        setLoginId('TC_VIDYA_1');
                        setPassword('password123');
                      }
                      setError(null);
                    }}
                    className={`py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer min-h-[42px] ${
                      roleTab === 'TELECALLER'
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <PhoneCall className="w-3.5 h-3.5 shrink-0" />
                    <span>Telecaller</span>
                  </button>

                  <button
                    type="button"
                    id="tab-role-admin"
                    onClick={() => {
                      soundManager.playTap();
                      setRoleTab('ADMIN');
                      if (isDevMode) {
                        setLoginId('admin');
                        setPassword('admin123');
                      }
                      setError(null);
                    }}
                    className={`py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer min-h-[42px] ${
                      roleTab === 'ADMIN'
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Shield className="w-3.5 h-3.5 shrink-0" />
                    <span>Admin HQ</span>
                  </button>
                </div>

                {/* Error Alert Banner */}
                {error && (
                  <div
                    id="alert-login-error"
                    className="mb-5 p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2.5"
                  >
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                {/* Sign In Form */}
                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                      {roleTab === 'ADMIN' ? 'Admin Login ID' : 'Telecaller ID'}
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                        {roleTab === 'ADMIN' ? <Shield className="w-4 h-4" /> : <User className="w-4 h-4" />}
                      </div>
                      <input
                        type="text"
                        id="input-login-id"
                        value={loginId}
                        onChange={(e) => setLoginId(e.target.value)}
                        placeholder={roleTab === 'ADMIN' ? 'Enter admin login ID' : 'Enter telecaller ID'}
                        required
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700/80 text-white placeholder-slate-500 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all min-h-[44px]"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-semibold text-slate-300">Password</label>
                    </div>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                        <Lock className="w-4 h-4" />
                      </div>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        id="input-login-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter your account password"
                        required
                        className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-950 border border-slate-700/80 text-white placeholder-slate-500 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all min-h-[44px]"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-white cursor-pointer"
                        title={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    id="btn-login-submit"
                    disabled={isLoading}
                    className={`w-full mt-2 py-3 px-4 rounded-xl text-sm font-bold text-white transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg min-h-[46px] ${
                      isLoading
                        ? 'bg-slate-700 cursor-not-allowed opacity-70'
                        : roleTab === 'ADMIN'
                        ? 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/30'
                        : 'bg-blue-600 hover:bg-blue-500 shadow-blue-600/30'
                    }`}
                  >
                    {isLoading ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <span>Sign In to {roleTab === 'ADMIN' ? 'Admin Portal' : 'Calling Portal'}</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>

                {/* Company Account Creation Link */}
                <div className="mt-5 pt-4 border-t border-slate-800 text-center">
                  <span className="text-xs text-slate-400 block mb-1">Don't have a company account?</span>
                  <button
                    type="button"
                    id="btn-switch-to-register-admin"
                    onClick={() => switchMode('REGISTER_ADMIN')}
                    className="text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer inline-flex items-center gap-1.5"
                  >
                    <Shield className="w-3.5 h-3.5" />
                    <span>Create Company Admin Account</span>
                  </button>
                </div>

                {/* Quick Demo Credentials - Gated to Development Mode Only */}
                {isDevMode && demoAccounts.length > 0 && (
                  <div className="mt-6 pt-5 border-t border-slate-800">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                        <span>Development One-Tap Accounts</span>
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      {demoAccounts.slice(0, 4).map((acc) => {
                        const isSelected = loginId.toLowerCase() === acc.loginId.toLowerCase();
                        return (
                          <button
                            key={acc.loginId}
                            type="button"
                            onClick={() => handleQuickSelect(acc)}
                            className={`p-2.5 rounded-xl border text-left transition-all group cursor-pointer ${
                              isSelected
                                ? 'bg-slate-800 border-blue-500/80 shadow-xs'
                                : 'bg-slate-950/80 hover:bg-slate-950 border-slate-800'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span
                                className={`text-xs font-bold flex items-center gap-1 truncate ${
                                  acc.icon === 'admin'
                                    ? 'text-indigo-400 group-hover:text-indigo-300'
                                    : acc.icon === 'estate'
                                    ? 'text-emerald-400 group-hover:text-emerald-300'
                                    : acc.icon === 'dual'
                                    ? 'text-purple-400 group-hover:text-purple-300'
                                    : 'text-blue-400 group-hover:text-blue-300'
                                }`}
                              >
                                {acc.icon === 'admin' && <Shield className="w-3 h-3 shrink-0" />}
                                {acc.icon === 'vidya' && <GraduationCap className="w-3 h-3 shrink-0" />}
                                {acc.icon === 'estate' && <Building2 className="w-3 h-3 shrink-0" />}
                                {acc.icon === 'dual' && <PhoneCall className="w-3 h-3 shrink-0" />}
                                <span className="truncate">{acc.name}</span>
                              </span>
                            </div>
                            <span className="text-[11px] text-slate-400 block mt-0.5 font-mono truncate">
                              {acc.loginId}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </>
            ) : (
              /* ========================================================================= */
              /* AUTH MODE: CREATE COMPANY ADMIN ACCOUNT */
              /* ========================================================================= */
              <>
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                      <Shield className="w-3 h-3" /> Master Company Admin
                    </span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                    Create Company Account
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-400 mt-1">
                    Set up your organization to manage telecalling operations
                  </p>
                </div>

                {/* Error Alert Banner */}
                {regError && (
                  <div
                    id="alert-admin-reg-error"
                    className="mb-5 p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2.5"
                  >
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                    <span>{regError}</span>
                  </div>
                )}

                {/* Admin Registration Form */}
                <form onSubmit={handleRegisterAdmin} className="space-y-4">
                  {/* Company / Admin Name */}
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                      Company / Admin Name *
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                        <Building2 className="w-4 h-4" />
                      </div>
                      <input
                        type="text"
                        id="input-admin-reg-company"
                        value={regCompanyName}
                        onChange={(e) => setRegCompanyName(e.target.value)}
                        placeholder="e.g. Apex Global Corp"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700/80 text-white placeholder-slate-500 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all min-h-[44px]"
                        required
                      />
                    </div>
                  </div>

                  {/* Admin Login ID */}
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                      Desired Admin Login ID * <span className="text-slate-500 font-normal">(letters, numbers, _)</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500 font-mono text-xs">
                        #
                      </div>
                      <input
                        type="text"
                        id="input-admin-reg-loginid"
                        value={regLoginId}
                        onChange={(e) => setRegLoginId(e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, ''))}
                        placeholder="e.g. APEX_ADMIN"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700/80 text-white placeholder-slate-500 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all min-h-[44px]"
                        required
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                      Password * <span className="text-slate-500 font-normal">(min. 8 characters)</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                        <Lock className="w-4 h-4" />
                      </div>
                      <input
                        type={regShowPassword ? 'text' : 'password'}
                        id="input-admin-reg-password"
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        placeholder="Create strong admin password"
                        className="w-full pl-10 pr-11 py-2.5 rounded-xl bg-slate-950 border border-slate-700/80 text-white placeholder-slate-500 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all min-h-[44px]"
                        required
                        minLength={8}
                      />
                      <button
                        type="button"
                        id="btn-toggle-reg-password"
                        onClick={() => setRegShowPassword(!regShowPassword)}
                        className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300 cursor-pointer"
                        aria-label={regShowPassword ? 'Hide password' : 'Show password'}
                      >
                        {regShowPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                      Confirm Password *
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                        <Lock className="w-4 h-4" />
                      </div>
                      <input
                        type={regShowConfirmPassword ? 'text' : 'password'}
                        id="input-admin-reg-confirm-password"
                        value={regConfirmPassword}
                        onChange={(e) => setRegConfirmPassword(e.target.value)}
                        placeholder="Re-enter admin password"
                        className="w-full pl-10 pr-11 py-2.5 rounded-xl bg-slate-950 border border-slate-700/80 text-white placeholder-slate-500 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all min-h-[44px]"
                        required
                        minLength={8}
                      />
                      <button
                        type="button"
                        id="btn-toggle-reg-confirm-password"
                        onClick={() => setRegShowConfirmPassword(!regShowConfirmPassword)}
                        className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300 cursor-pointer"
                        aria-label={regShowConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                      >
                        {regShowConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Optional Contact Fields */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs font-semibold text-slate-300 block mb-1">
                        Phone <span className="text-slate-500 font-normal">(optional)</span>
                      </label>
                      <input
                        type="text"
                        value={regPhone}
                        onChange={(e) => setRegPhone(e.target.value)}
                        placeholder="+91 98765 43210"
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700/80 text-white placeholder-slate-500 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[38px]"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-300 block mb-1">
                        Email <span className="text-slate-500 font-normal">(optional)</span>
                      </label>
                      <input
                        type="email"
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        placeholder="admin@company.com"
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700/80 text-white placeholder-slate-500 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[38px]"
                      />
                    </div>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    id="btn-admin-reg-submit"
                    disabled={regIsLoading}
                    className="w-full py-3.5 px-4 rounded-xl text-white font-bold text-sm sm:text-base flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 shadow-lg shadow-indigo-600/30 active:scale-98 transition-all cursor-pointer min-h-[48px] disabled:opacity-60"
                  >
                    {regIsLoading ? (
                      <span>Creating Company Account...</span>
                    ) : (
                      <>
                        <span>Register Company & Enter CRM</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>

                {/* Back to Sign In */}
                <div className="mt-5 pt-4 border-t border-slate-800 text-center">
                  <button
                    type="button"
                    id="btn-switch-to-signin"
                    onClick={() => switchMode('SIGN_IN')}
                    className="text-xs text-slate-400 hover:text-white font-semibold transition-colors cursor-pointer"
                  >
                    Already have an account? <span className="text-indigo-400 underline">Sign In instead</span>
                  </button>
                </div>
              </>
            )}
          </div>

          <p className="text-center text-xs text-slate-500">
            Protected by role-based authorization & JWT encryption
          </p>
        </div>
      </div>
    </div>
  );
};
