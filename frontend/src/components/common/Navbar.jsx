import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { api } from '../../api/client';
import {
  Users,
  Briefcase,
  ShieldCheck,
  Building2,
  Sliders,
  LogOut,
  User,
  Sparkles,
  ChevronDown,
  RotateCcw,
  Menu,
  X,
  Languages,
  Home,
  FileText,
  Bell,
  UserPlus,
  BarChart3,
  Vote,
  Mic,
  Award,
  Heart,
  Coins,
  Globe
} from 'lucide-react';

export function Navbar({ onOpenDemoScenarios }) {
  const { user, logout, quickSwitchRole, resetAllData } = useAuth();
  const { lang, toggleLanguage, t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifLoading, setNotifLoading] = useState(false);

  const demoRoles = [
    { label: 'Customer Demo 01 (Household)', email: 'customer01@demo.coop', role: 'customer', icon: Users },
    { label: 'Customer Demo 02 (Institution / Clinic)', email: 'institution01@demo.coop', role: 'customer', icon: Building2 },
    { label: 'Worker Demo 01 (Worker B - Low Workload)', email: 'worker01@demo.coop', role: 'worker', icon: Briefcase },
    { label: 'Worker Demo 02 (Worker A - Overloaded 8 Jobs)', email: 'worker02@demo.coop', role: 'worker', icon: Briefcase },
    { label: 'Society Admin 01 (Central Metro)', email: 'society01.admin@demo.coop', role: 'society_admin', icon: Building2 },
    { label: 'Federation Admin 01 (Sample Federation)', email: 'federation.admin@demo.coop', role: 'federation_admin', icon: ShieldCheck },
    { label: 'Platform Admin 01 (System Admin)', email: 'platform.admin@demo.coop', role: 'platform_admin', icon: Sliders }
  ];

  const handleRoleSwitch = async (email, role) => {
    setRoleDropdownOpen(false);
    setMobileMenuOpen(false);
    await quickSwitchRole(email);
    if (role === 'customer') navigate('/customer');
    else if (role === 'worker') navigate('/worker');
    else if (role === 'society_admin') navigate('/society');
    else if (role === 'federation_admin') navigate('/federation');
    else if (role === 'platform_admin') navigate('/admin');
  };

  const fetchNotifications = async () => {
    if (!user) return;
    setNotifLoading(true);
    try {
      const res = await api.getNotifications({ limit: 10 });
      if (res.success) setNotifications(res.notifications || []);
    } catch (e) { /* silent */ }
    setNotifLoading(false);
  };

  useEffect(() => {
    if (user) {
      fetchNotifications();
      const iv = setInterval(fetchNotifications, 6000);
      return () => clearInterval(iv);
    }
  }, [user]);

  const handleReset = async () => {
    if (window.confirm('Reset all demo data (jobs, workers, complaints, logs) back to initial default state?')) {
      setResetting(true);
      await resetAllData();
      setResetting(false);
      alert('Demo data restored to clean initial state.');
      window.location.reload();
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-sm">
      {/* Top Ministry / NCCT Notification Bar */}
      <div className="bg-[#0a1d37] text-slate-200 px-4 py-1.5 text-xs font-medium flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="bg-amber-600/90 text-white px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">
            Ministry of Cooperation
          </span>
          <span className="hidden sm:inline text-slate-300">
            NCCT • SIH26089
          </span>
        </div>
        <div className="flex items-center space-x-3 text-[11px]">
          <span className="bg-emerald-950 text-emerald-300 border border-emerald-800/80 px-2 py-0.5 rounded flex items-center gap-1 font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            {t('app.demoEnv', 'Demo Environment')}
          </span>
          <button
            onClick={handleReset}
            disabled={resetting}
            className="hover:text-amber-300 flex items-center gap-1 text-slate-300 underline text-[11px]"
            title="Reset demo data to default"
          >
            <RotateCcw className="w-3 h-3" />
            <span className="hidden sm:inline">{resetting ? 'Resetting...' : 'Reset Demo Data'}</span>
          </button>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Title */}
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="w-10 h-10 rounded-lg bg-[#0f2e5a] flex items-center justify-center text-white shadow-sm font-bold text-lg tracking-wider border border-blue-900 group-hover:bg-[#1a4b8c] transition-colors">
              <Building2 className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <div className="font-bold text-slate-900 leading-tight text-base sm:text-lg flex items-center gap-2">
                {t('app.title', 'Sahakar Gig Platform')}
              </div>
              <div className="text-[11px] text-slate-500 font-medium leading-none hidden sm:block">
                {t('app.subtitle', 'Cooperative Workforce & Services Infrastructure')}
              </div>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1">
            {user ? (
              <>
                {user.role === 'customer' && (
                  <>
                    <Link
                      to="/customer"
                      className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        location.pathname === '/customer'
                          ? 'bg-blue-50 text-blue-900 font-semibold'
                          : 'text-slate-700 hover:text-blue-900 hover:bg-slate-50'
                      }`}
                    >
                      {t('customer.title', 'Book & Request')}
                    </Link>
                    <Link
                      to="/customer/bookings"
                      className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        location.pathname === '/customer/bookings'
                          ? 'bg-blue-50 text-blue-900 font-semibold'
                          : 'text-slate-700 hover:text-blue-900 hover:bg-slate-50'
                      }`}
                    >
                      {t('customer.pastBookings', 'My Bookings & Invoices')}
                    </Link>
                    <Link
                      to="/customer/voice-book"
                      className={`px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-1 ${
                        location.pathname === '/customer/voice-book'
                          ? 'bg-amber-50 text-amber-900 font-semibold'
                          : 'text-slate-700 hover:text-amber-900 hover:bg-amber-50'
                      }`}
                    >
                      <Mic className="w-3.5 h-3.5" /> Voice Book
                    </Link>
                    <Link
                      to="/impact"
                      className={`px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-1 ${
                        location.pathname === '/impact'
                          ? 'bg-green-50 text-green-900 font-semibold'
                          : 'text-slate-700 hover:text-green-900 hover:bg-green-50'
                      }`}
                    >
                      <Globe className="w-3.5 h-3.5" /> Impact
                    </Link>
                    <Link
                      to="/customer/househelp"
                      className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        location.pathname === '/customer/househelp'
                          ? 'bg-green-50 text-green-900 font-semibold'
                          : 'text-slate-700 hover:text-green-900 hover:bg-green-50'
                      }`}
                    >
                      🏠 Househelp
                    </Link>
                    <Link
                      to="/customer/beauty-spa"
                      className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        location.pathname === '/customer/beauty-spa'
                          ? 'bg-pink-50 text-pink-900 font-semibold'
                          : 'text-slate-700 hover:text-pink-900 hover:bg-pink-50'
                      }`}
                    >
                      💆 Beauty & Spa
                    </Link>
                    <Link
                      to="/customer/manicure-pedicure"
                      className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        location.pathname === '/customer/manicure-pedicure'
                          ? 'bg-purple-50 text-purple-900 font-semibold'
                          : 'text-slate-700 hover:text-purple-900 hover:bg-purple-50'
                      }`}
                    >
                      💅 Nails
                    </Link>
                    <Link
                      to="/customer/profile"
                      className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        location.pathname === '/customer/profile'
                          ? 'bg-blue-50 text-blue-900 font-semibold'
                          : 'text-slate-700 hover:text-blue-900 hover:bg-blue-50'
                      }`}
                    >
                      👤 Profile
                    </Link>
                  </>
                )}

                {user.role === 'worker' && (
                  <>
                    <Link
                      to="/worker"
                      className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        location.pathname === '/worker'
                          ? 'bg-blue-50 text-blue-900 font-semibold'
                          : 'text-slate-700 hover:text-blue-900 hover:bg-slate-50'
                      }`}
                    >
                      {t('worker.title', 'Worker Hub')}
                    </Link>
                    <Link
                      to="/worker/earnings"
                      className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        location.pathname === '/worker/earnings'
                          ? 'bg-blue-50 text-blue-900 font-semibold'
                          : 'text-slate-700 hover:text-blue-900 hover:bg-slate-50'
                      }`}
                    >
                      {t('worker.earnings', 'Earnings Ledger')}
                    </Link>
                    <Link
                      to="/worker/welfare"
                      className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        location.pathname === '/worker/welfare'
                          ? 'bg-blue-50 text-blue-900 font-semibold'
                          : 'text-slate-700 hover:text-blue-900 hover:bg-slate-50'
                      }`}
                    >
                      {t('worker.welfare', 'Welfare & Insurance')}
                    </Link>
                    <Link
                      to="/worker/passport"
                      className={`px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-1 ${
                        location.pathname === '/worker/passport'
                          ? 'bg-purple-50 text-purple-900 font-semibold'
                          : 'text-slate-700 hover:text-purple-900 hover:bg-purple-50'
                      }`}
                    >
                      <Award className="w-3.5 h-3.5" /> Passport
                    </Link>
                    <Link
                      to="/worker/wellness"
                      className={`px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-1 ${
                        location.pathname === '/worker/wellness'
                          ? 'bg-red-50 text-red-900 font-semibold'
                          : 'text-slate-700 hover:text-red-900 hover:bg-red-50'
                      }`}
                    >
                      <Heart className="w-3.5 h-3.5" /> Wellness
                    </Link>
                    <Link
                      to="/worker/dividend"
                      className={`px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-1 ${
                        location.pathname === '/worker/dividend'
                          ? 'bg-amber-50 text-amber-900 font-semibold'
                          : 'text-slate-700 hover:text-amber-900 hover:bg-amber-50'
                      }`}
                    >
                      <Coins className="w-3.5 h-3.5" /> Dividend
                    </Link>
                  </>
                )}

                {user.role === 'society_admin' && (
                  <>
                    <Link
                      to="/society"
                      className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        location.pathname === '/society'
                          ? 'bg-blue-50 text-blue-900 font-semibold'
                          : 'text-slate-700 hover:text-blue-900 hover:bg-slate-50'
                      }`}
                    >
                      {t('society.title', 'Society Overview')}
                    </Link>
                    <Link
                      to="/society/workers"
                      className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        location.pathname === '/society/workers'
                          ? 'bg-blue-50 text-blue-900 font-semibold'
                          : 'text-slate-700 hover:text-blue-900 hover:bg-slate-50'
                      }`}
                    >
                      {t('society.workerRoster', 'Worker Roster')}
                    </Link>
                    <Link
                      to="/society/complaints"
                      className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        location.pathname === '/society/complaints'
                          ? 'bg-blue-50 text-blue-900 font-semibold'
                          : 'text-slate-700 hover:text-blue-900 hover:bg-slate-50'
                      }`}
                    >
                      {t('society.complaints', 'Grievance Board')}
                    </Link>
                  </>
                )}

                {user.role === 'federation_admin' && (
                  <Link
                    to="/federation"
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      location.pathname === '/federation'
                        ? 'bg-blue-50 text-blue-900 font-semibold'
                        : 'text-slate-700 hover:text-blue-900 hover:bg-slate-50'
                    }`}
                  >
                    {t('federation.title', 'Federation Governance')}
                  </Link>
                )}

                {user.role === 'platform_admin' && (
                  <Link
                    to="/admin"
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      location.pathname === '/admin'
                        ? 'bg-blue-50 text-blue-900 font-semibold'
                        : 'text-slate-700 hover:text-blue-900 hover:bg-slate-50'
                    }`}
                  >
                    {t('common.dashboard', 'Master Registry')}
                  </Link>
                )}
              </>
            ) : (
              <>
                <Link to="/" className="px-3 py-2 text-sm font-medium text-slate-700 hover:text-blue-900">
                  Home
                </Link>
                <Link to="/login" className="px-3 py-2 text-sm font-medium text-slate-700 hover:text-blue-900">
                  {t('common.login', 'Sign In')}
                </Link>
                <Link to="/register" className="px-3 py-2 text-sm font-medium text-slate-700 hover:text-blue-900">
                  {t('common.register', 'Register')}
                </Link>
              </>
            )}
          </nav>

          {/* Action Buttons & Persona Switcher */}
          <div className="hidden lg:flex items-center space-x-3">
            {/* Notifications Bell */}
            {user && (
              <div className="relative">
                <button
                  onClick={() => { setNotifOpen(!notifOpen); if (!notifOpen) fetchNotifications(); }}
                  className="relative bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 p-2 rounded-lg"
                  title="Notifications & Audit Updates"
                >
                  <Bell className="w-4 h-4 text-blue-900" />
                  {notifications.length > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                      {notifications.length > 9 ? '9+' : notifications.length}
                    </span>
                  )}
                </button>
                {notifOpen && (
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-200 z-50 overflow-hidden">
                    <div className="px-3 py-2 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800 flex items-center gap-1"><Bell className="w-3.5 h-3.5" /> Notifications</span>
                      <button onClick={() => setNotifOpen(false)} className="text-slate-400 hover:text-slate-600 text-xs">✕</button>
                    </div>
                    <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                      {notifLoading ? <div className="p-4 text-xs text-slate-400 text-center">Loading...</div>
                        : notifications.length === 0 ? <div className="p-4 text-xs text-slate-400 text-center">No new notifications</div>
                          : notifications.map(n => (
                            <div key={n.id} className="p-3 hover:bg-slate-50">
                              <div className="text-xs font-semibold text-slate-800">{n.title || n.action}</div>
                              <div className="text-[11px] text-slate-500 line-clamp-2">{n.message || n.details}</div>
                              <div className="text-[10px] text-slate-400 mt-1">{new Date(n.timestamp).toLocaleString()}</div>
                            </div>
                          ))}
                    </div>
                  </div>
                )}
              </div>
            )}
            {/* Language Switcher Button */}
            <button
              onClick={toggleLanguage}
              className="bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
              title="Toggle Language (English / हिन्दी)"
            >
              <Languages className="w-3.5 h-3.5 text-blue-900" />
              <span>{lang === 'en' ? 'हिन्दी' : 'English'}</span>
            </button>

            {/* Guided Scenarios Button */}
            <button
              onClick={onOpenDemoScenarios}
              className="bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300/80 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
              title="Launch SIH Hackathon Evaluation Scenarios"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>{t('common.sihScenarios', 'SIH Demo Scenarios')}</span>
            </button>

            {/* 1-Click Demo Persona Dropdown */}
            <div className="relative">
              <button
                onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-2 transition-colors"
              >
                <User className="w-3.5 h-3.5 text-blue-800" />
                <span>
                  {user ? `${user.role.replace('_', ' ').toUpperCase()}` : t('common.quickSwitch', 'Quick Switch')}
                </span>
                <ChevronDown className="w-3 h-3 text-slate-500" />
              </button>

              {roleDropdownOpen && (
                <div className="absolute right-0 mt-2 w-72 bg-white rounded-lg shadow-xl border border-slate-200 py-1.5 z-50">
                  <div className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100">
                    {t('common.quickSwitch', 'Switch Active Demo Persona (1-Click)')}
                  </div>
                  {demoRoles.map((dr, idx) => {
                    const Icon = dr.icon;
                    const isActive = user?.email === dr.email;
                    return (
                      <button
                        key={idx}
                        onClick={() => handleRoleSwitch(dr.email, dr.role)}
                        className={`w-full text-left px-3 py-2 text-xs flex items-center gap-2.5 transition-colors ${
                          isActive
                            ? 'bg-blue-50 text-blue-900 font-bold'
                            : 'hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <Icon className={`w-4 h-4 ${isActive ? 'text-blue-700' : 'text-slate-400'}`} />
                        <div className="truncate">
                          <div>{dr.label}</div>
                          <div className="text-[10px] text-slate-400 font-normal">{dr.email}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Auth Buttons */}
            {user ? (
              <div className="flex items-center space-x-2 border-l border-slate-200 pl-3">
                <div className="text-right leading-tight">
                  <div className="text-xs font-bold text-slate-800 truncate max-w-[120px]">{user.name}</div>
                  <div className="text-[10px] text-slate-500 capitalize">{user.role?.replace('_', ' ')}</div>
                </div>
                <button
                  onClick={logout}
                  className="p-1.5 text-slate-500 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link
                  to="/login"
                  className="px-3 py-1.5 text-xs font-semibold text-blue-900 hover:bg-blue-50 border border-blue-200 rounded-lg transition-colors"
                >
                  {t('common.login', 'Sign In')}
                </Link>
                <Link
                  to="/register"
                  className="px-3 py-1.5 text-xs font-semibold text-white bg-[#0f2e5a] hover:bg-[#1a4b8c] rounded-lg shadow-sm transition-colors"
                >
                  {t('common.register', 'Register')}
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu trigger */}
          <div className="md:hidden flex items-center space-x-2">
            <button
              onClick={toggleLanguage}
              className="bg-slate-100 text-slate-800 p-1.5 rounded-lg text-xs font-semibold"
              title="Toggle Language"
            >
              {lang === 'en' ? 'हिन्दी' : 'EN'}
            </button>
            <button
              onClick={onOpenDemoScenarios}
              className="bg-amber-100 text-amber-900 p-1.5 rounded-lg text-xs"
              title="SIH Demo Scenarios"
            >
              <Sparkles className="w-4 h-4 text-amber-700" />
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-2 pb-6 space-y-3">
          {user ? (
            <div className="border-b border-slate-100 pb-2">
              <div className="font-bold text-sm text-slate-800">{user.name}</div>
              <div className="text-xs text-slate-500 capitalize">{user.role?.replace('_', ' ')} (Demo)</div>
            </div>
          ) : null}

          {/* Direct Mobile Nav Links */}
          {user?.role === 'customer' && (
            <div className="space-y-1">
              <Link to="/customer" onClick={() => setMobileMenuOpen(false)} className="block py-1.5 text-sm font-semibold text-blue-900">
                Book & Request
              </Link>
              <Link to="/customer/bookings" onClick={() => setMobileMenuOpen(false)} className="block py-1.5 text-sm text-slate-700">
                My Bookings & Invoices
              </Link>
              <Link to="/customer/voice-book" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-1.5 py-1.5 text-sm text-amber-700 font-semibold">
                <Mic className="w-3.5 h-3.5" /> Voice Booking (Hindi/EN)
              </Link>
              <Link to="/impact" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-1.5 py-1.5 text-sm text-green-700">
                <Globe className="w-3.5 h-3.5" /> Community Impact
              </Link>
            </div>
          )}

          {user?.role === 'worker' && (
            <div className="space-y-1">
              <Link to="/worker" onClick={() => setMobileMenuOpen(false)} className="block py-1.5 text-sm font-semibold text-blue-900">
                Worker Hub (Operations)
              </Link>
              <Link to="/worker/earnings" onClick={() => setMobileMenuOpen(false)} className="block py-1.5 text-sm text-slate-700">
                Transparent Earnings Ledger
              </Link>
              <Link to="/worker/welfare" onClick={() => setMobileMenuOpen(false)} className="block py-1.5 text-sm text-slate-700">
                Welfare & Insurance (Demo)
              </Link>
              <Link to="/worker/utilization" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-1.5 py-1.5 text-sm text-slate-700">
                <BarChart3 className="w-3.5 h-3.5" /> Utilization Dashboard
              </Link>
              <Link to="/worker/passport" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-1.5 py-1.5 text-sm font-semibold text-purple-700">
                <Award className="w-3.5 h-3.5" /> Digital Skill Passport
              </Link>
              <Link to="/worker/wellness" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-1.5 py-1.5 text-sm text-red-600">
                <Heart className="w-3.5 h-3.5" /> Wellness & Fatigue
              </Link>
              <Link to="/worker/dividend" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-1.5 py-1.5 text-sm text-amber-700">
                <Coins className="w-3.5 h-3.5" /> Dividend Calculator
              </Link>
            </div>
          )}

          {!user && (
            <div className="space-y-1">
              <Link to="/worker/apply" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2 py-1.5 text-sm font-semibold text-emerald-700">
                <UserPlus className="w-4 h-4" />
                Apply as Cooperative Worker
              </Link>
            </div>
          )}

          {user?.role === 'society_admin' && (
            <div className="space-y-1">
              <Link to="/society" onClick={() => setMobileMenuOpen(false)} className="block py-1.5 text-sm font-semibold text-blue-900">
                Society Overview
              </Link>
              <Link to="/society/workers" onClick={() => setMobileMenuOpen(false)} className="block py-1.5 text-sm text-slate-700">
                Worker Roster & Verification
              </Link>
              <Link to="/society/complaints" onClick={() => setMobileMenuOpen(false)} className="block py-1.5 text-sm text-slate-700">
                Grievance Board
              </Link>
              <Link to="/society/governance" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-1.5 py-1.5 text-sm font-semibold text-emerald-700">
                <Vote className="w-3.5 h-3.5" /> Governance & Decisions
              </Link>
            </div>
          )}

          {user?.role === 'federation_admin' && (
            <div className="space-y-1">
              <Link to="/federation" onClick={() => setMobileMenuOpen(false)} className="block py-1.5 text-sm font-semibold text-blue-900">
                Federation Macro Analytics & Demand Forecast
              </Link>
            </div>
          )}

          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider pt-2 border-t border-slate-100">
            {t('common.quickSwitch', 'Quick Persona Switcher')}
          </div>
          <div className="grid grid-cols-1 gap-1">
            {demoRoles.map((dr, idx) => (
              <button
                key={idx}
                onClick={() => handleRoleSwitch(dr.email, dr.role)}
                className="w-full text-left py-1.5 px-2 rounded text-xs text-slate-700 hover:bg-slate-100 flex items-center justify-between"
              >
                <span>{dr.label}</span>
                <span className="text-[10px] text-slate-400">{dr.role}</span>
              </button>
            ))}
          </div>

          {user && (
            <button
              onClick={logout}
              className="w-full text-left text-xs font-semibold text-red-600 pt-2 border-t border-slate-100 flex items-center gap-1"
            >
              <LogOut className="w-3.5 h-3.5" /> Logout
            </button>
          )}
        </div>
      )}
    </header>
  );
}
export default Navbar;
