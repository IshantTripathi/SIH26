import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Building2,
  Users,
  Briefcase,
  ShieldCheck,
  Sliders,
  LogIn,
  AlertCircle,
  Sparkles,
  ArrowRight
} from 'lucide-react';

export function LoginPage() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('password123');
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { login, quickSwitchRole } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    const res = await login(identifier, password);
    setSubmitting(false);

    if (res.success) {
      redirectByRole(res.user.role);
    } else {
      setError(res.message || 'Login failed. Please check credentials.');
    }
  };

  const redirectByRole = (role) => {
    if (role === 'customer') navigate('/customer');
    else if (role === 'worker') navigate('/worker');
    else if (role === 'society_admin') navigate('/society');
    else if (role === 'federation_admin') navigate('/federation');
    else if (role === 'platform_admin') navigate('/admin');
    else navigate('/');
  };

  const handleDemoLogin = async (email, role) => {
    setSubmitting(true);
    const res = await quickSwitchRole(email);
    setSubmitting(false);
    if (res.success) {
      redirectByRole(role);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 space-y-8">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-1.5 bg-blue-100 text-blue-900 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
          <ShieldCheck className="w-4 h-4 text-blue-800" />
          Cooperative Portal Authentication
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
          Sign In to Sahakar Gig Platform
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 max-w-lg mx-auto">
          Access your role-based dashboard as a Customer, Certified Worker, or Cooperative Administrator.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        {/* Left Form: Standard Credentials */}
        <div className="md:col-span-6 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">
            Standard Login
          </h2>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Email / Mobile Number / ID
              </label>
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="e.g. customer01@demo.coop or 9876500001"
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-900 text-sm"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-900 text-sm font-mono"
              />
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-500">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded text-blue-900 focus:ring-blue-900"
                />
                <span>Remember me</span>
              </label>
              <a href="#forgot" onClick={(e) => { e.preventDefault(); alert('Demo password is: password123'); }} className="text-blue-900 hover:underline">
                Forgot password?
              </a>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-[#0f2e5a] hover:bg-[#1a4b8c] text-white py-2.5 rounded-lg font-bold text-xs shadow-sm flex items-center justify-center gap-2 transition-colors"
            >
              <LogIn className="w-4 h-4" />
              {submitting ? 'Authenticating...' : 'Sign In'}
            </button>
          </form>

          <div className="pt-2 text-center text-xs text-slate-500">
            Don't have an account?{' '}
            <Link to="/register" className="text-blue-900 font-bold hover:underline">
              Create an Account
            </Link>
          </div>
        </div>

        {/* Right Form: 1-Click Demo Logins for Hackathon Evaluators */}
        <div className="md:col-span-6 bg-slate-50 p-6 rounded-2xl border-2 border-blue-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <h2 className="text-sm font-bold text-blue-950 flex items-center gap-1.5 uppercase tracking-wider">
              <Sparkles className="w-4 h-4 text-amber-600" />
              1-Click Demo Logins (SIH Evaluators)
            </h2>
            <span className="text-[10px] bg-amber-200 text-amber-900 font-bold px-2 py-0.5 rounded">
              Ready to Test
            </span>
          </div>
          <p className="text-[11px] text-slate-600">
            Click any demo role below to authenticate instantly and explore that specific role's portal:
          </p>

          <div className="space-y-2">
            {[
              {
                title: 'Customer Demo 01 (Household)',
                desc: 'Book services with problem description, track, pay & rate',
                email: 'customer01@demo.coop',
                role: 'customer',
                icon: Users,
                badge: 'Household'
              },
              {
                title: 'Worker Demo 01 (Worker B - Low Workload)',
                desc: 'Plumber with 2 active jobs (Fair allocation winner)',
                email: 'worker01@demo.coop',
                role: 'worker',
                icon: Briefcase,
                badge: 'Fair Winner'
              },
              {
                title: 'Worker Demo 02 (Worker A - 8 Jobs Overloaded)',
                desc: 'Overloaded plumber (8 active jobs - deprioritized for fairness)',
                email: 'worker02@demo.coop',
                role: 'worker',
                icon: Briefcase,
                badge: 'Overloaded'
              },
              {
                title: 'Society Admin 01 (Central Metro)',
                desc: 'Verify worker certifications, manage jobs & complaints',
                email: 'society01.admin@coopdemo.gov.in',
                role: 'society_admin',
                icon: Building2,
                badge: 'Society Admin'
              },
              {
                title: 'Federation Admin 01 (National NLCF)',
                desc: 'Multi-society macro analytics, demand forecasting & allocation',
                email: 'federation.admin@coopdemo.gov.in',
                role: 'federation_admin',
                icon: ShieldCheck,
                badge: 'Federation'
              },
              {
                title: 'Platform Administrator',
                desc: 'Master services catalogue & system audit logs',
                email: 'platform.admin@coopdemo.gov.in',
                role: 'platform_admin',
                icon: Sliders,
                badge: 'System Admin'
              }
            ].map((p, idx) => {
              const Icon = p.icon;
              return (
                <button
                  key={idx}
                  onClick={() => handleDemoLogin(p.email, p.role)}
                  className="w-full text-left p-2.5 bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-300 rounded-xl transition-all flex items-center justify-between group shadow-2xs"
                >
                  <div className="flex items-center space-x-3 truncate">
                    <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-900 flex items-center justify-center shrink-0">
                      <Icon className="w-4 h-4 text-blue-800" />
                    </div>
                    <div className="truncate">
                      <div className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
                        {p.title}
                        <span className="text-[9px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded font-normal">
                          {p.badge}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400 truncate">{p.desc}</div>
                    </div>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-900 shrink-0 ml-2" />
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
