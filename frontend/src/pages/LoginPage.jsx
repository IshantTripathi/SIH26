import React, { useState, useEffect } from 'react';
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

const GOOGLE_CLIENT_ID = '975487436727-abc123def456.apps.googleusercontent.com';

export function LoginPage() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('password123');
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const { login, quickSwitchRole, googleLogin } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);

    script.onload = () => {
      if (window.google) {
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: handleGoogleResponse,
          auto_select: false
        });
      }
    };

    return () => {
      const existing = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
      if (existing) existing.remove();
    };
  }, []);

  const handleGoogleResponse = async (response) => {
    setGoogleLoading(true);
    setError('');
    try {
      const result = await googleLogin(response.credential);
      if (result.success) {
        redirectByRole(result.user.role);
      } else {
        setError(result.message || 'Google login failed');
      }
    } catch (err) {
      setError('Google authentication failed. Please try again.');
    }
    setGoogleLoading(false);
  };

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

  const renderGoogleButton = () => {
    if (window.google) {
      window.google.accounts.id.renderButton(
        document.getElementById('google-signin-btn'),
        { theme: 'outline', size: 'large', width: '100%', text: 'signin_with' }
      );
    }
  };

  useEffect(() => {
    const timer = setTimeout(renderGoogleButton, 500);
    return () => clearTimeout(timer);
  }, []);

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

            {/* Divider */}
            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-300"></div>
              </div>
              <div className="relative flex justify-center text-[11px]">
                <span className="px-2 bg-white text-slate-500">OR</span>
              </div>
            </div>

            {/* Google Sign-In Button */}
            {googleLoading && (
              <div className="text-center text-xs text-blue-600 py-2 mb-2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mx-auto mb-2"></div>
                Authenticating with Google...
              </div>
            )}
            <button
              type="button"
              onClick={() => {
                if (window.google) {
                  window.google.accounts.id.prompt();
                } else {
                  setError('Google Sign-In is loading. Please wait and try again.');
                }
              }}
              disabled={googleLoading}
              className="w-full bg-white border-2 border-slate-300 hover:border-blue-500 hover:bg-blue-50 text-slate-700 py-3 rounded-lg font-bold text-sm shadow-sm flex items-center justify-center gap-3 transition-all disabled:opacity-50"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              {googleLoading ? 'Signing in...' : 'Sign in with Google'}
            </button>
            <p className="text-[10px] text-slate-400 text-center mt-2">Use your Gmail account to sign in</p>
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
