import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import {
  Building2,
  ShieldCheck,
  Award,
  HeartHandshake,
  Users,
  Search,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Activity,
  Briefcase
} from 'lucide-react';

export function LandingPage({ onOpenDemoScenarios }) {
  const [problemQuery, setProblemQuery] = useState('');
  const [detectedIntent, setDetectedIntent] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const navigate = useNavigate();
  const { quickSwitchRole } = useAuth();
  const { t } = useLanguage();

  const handleProblemSearch = async (e) => {
    e.preventDefault();
    if (!problemQuery.trim()) return;
    setIsSearching(true);
    try {
      const res = await api.classifyIntent(problemQuery);
      if (res.success) {
        setDetectedIntent(res.intent);
      }
    } catch (err) {
      console.error(err);
    }
    setIsSearching(false);
  };

  const handleBookNowWithIntent = async (type = 'Household') => {
    const res = await quickSwitchRole(type === 'Institution' ? 'institution01@demo.coop' : 'customer01@demo.coop');
    if (res?.success) navigate('/customer', { state: { prefilledIntent: detectedIntent, problemQuery, customerType: type } });
  };

  return (
    <div className="space-y-16 pb-16">
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-[#0a1d37] to-[#0f2e5a] text-white py-14 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="max-w-5xl mx-auto space-y-7 text-center relative z-10">
          <div className="inline-flex items-center gap-2 bg-blue-950/80 border border-blue-800/80 px-3.5 py-1 rounded-full text-xs font-semibold text-amber-300">
            <ShieldCheck className="w-4 h-4 text-amber-400" />
            <span>{t('app.ministryTag', 'Ministry of Cooperation / NCCT')} • SIH26089</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight max-w-4xl mx-auto">
            {t('landing.heroTitle', 'Cooperative Digital Workforce & Community Services Platform')}
          </h1>

          <p className="text-base sm:text-lg text-slate-200 max-w-3xl mx-auto font-normal leading-relaxed">
            {t('landing.heroSubtitle', 'Empowering Labour Cooperative Federations and Societies with transparent work allocation, fair wages, worker social security, and AI-based demand planning.')}
          </p>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={async () => {
                const res = await quickSwitchRole('customer01@demo.coop');
                if (res?.success) navigate('/customer');
              }}
              className="bg-amber-600 hover:bg-amber-700 text-white px-5 py-2.5 rounded-lg font-bold text-sm shadow-md transition-all flex items-center gap-2"
            >
              <Search className="w-4 h-4" />
              <span>{t('landing.householdBtn', 'Book for Household')}</span>
            </button>
            <button
              onClick={async () => {
                const res = await quickSwitchRole('institution01@demo.coop');
                if (res?.success) navigate('/customer');
              }}
              className="bg-blue-800 hover:bg-blue-700 text-white border border-blue-600 px-5 py-2.5 rounded-lg font-bold text-sm shadow-md transition-all flex items-center gap-2"
            >
              <Building2 className="w-4 h-4 text-amber-300" />
              <span>{t('landing.institutionBtn', 'Book for Institution')}</span>
            </button>
            <button
              onClick={async () => {
                await quickSwitchRole('worker01@demo.coop');
                navigate('/worker');
              }}
              className="bg-white/10 hover:bg-white/20 text-white border border-white/30 px-5 py-2.5 rounded-lg font-bold text-sm transition-all flex items-center gap-2"
            >
              <Briefcase className="w-4 h-4 text-amber-300" />
              <span>{t('worker.title', 'Worker Hub')}</span>
            </button>
            <button
              onClick={onOpenDemoScenarios}
              className="bg-emerald-700 hover:bg-emerald-800 text-white px-5 py-2.5 rounded-lg font-bold text-sm shadow-sm transition-all flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>{t('common.sihScenarios', 'SIH Demo Scenarios')}</span>
            </button>
          </div>

          {/* Problem-First Interactive Search Bar */}
          <div className="max-w-2xl mx-auto mt-8 bg-white/95 backdrop-blur-md rounded-2xl p-4 shadow-2xl border border-slate-200 text-slate-800 text-left">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-blue-700" />
              <span>{t('landing.searchPlaceholder', 'Describe your problem naturally (No need to guess trade category)')}</span>
            </div>
            <form onSubmit={handleProblemSearch} className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={problemQuery}
                onChange={(e) => setProblemQuery(e.target.value)}
                placeholder='e.g., "I have a leaking kitchen tap" or "Ceiling fan makes strange noise"'
                className="flex-1 px-4 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900 bg-white"
              />
              <button type="button" onClick={()=>{
                const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
                if(!SR) return alert('Voice not supported');
                const r=new SR(); r.lang='hi-IN'; r.onresult=e=>setProblemQuery(e.results[0][0].transcript); r.start();
              }} className="px-3 py-2.5 bg-amber-100 border border-amber-300 rounded-lg text-xs" title="Speak in Hindi/English">🎙️</button>
              <button
                type="submit"
                disabled={isSearching}
                className="bg-[#0f2e5a] hover:bg-[#1a4b8c] text-white px-5 py-2.5 rounded-lg text-xs font-bold shadow-sm flex items-center justify-center gap-1.5 transition-colors"
              >
                {isSearching ? 'Analyzing...' : t('landing.identifyService', 'Identify Service')}
              </button>
            </form>

            {/* Classification Result Card */}
            {detectedIntent && (
              <div className="mt-3 p-3 bg-emerald-50 border border-emerald-300 rounded-lg text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 animate-in fade-in">
                <div>
                  <div className="text-emerald-950 font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                    Suggested Trade: <span className="text-emerald-800 font-extrabold">{detectedIntent.serviceCategory}</span>
                  </div>
                  <div className="text-slate-600 text-[11px] mt-0.5">
                    {detectedIntent.serviceTitle} • Est. Base: ₹{detectedIntent.basePrice} (Confidence: {Math.round(detectedIntent.confidence * 100)}%)
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleBookNowWithIntent('Household')}
                    className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-3 py-1.5 rounded-lg text-xs shadow-sm flex items-center gap-1"
                  >
                    <span>Household</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => handleBookNowWithIntent('Institution')}
                    className="bg-blue-900 hover:bg-blue-800 text-white font-bold px-3 py-1.5 rounded-lg text-xs shadow-sm flex items-center gap-1"
                  >
                    <span>Institution</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Key Differentiators / Cooperative Pillars */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto space-y-2 mb-10">
          <span className="text-xs font-bold text-blue-900 uppercase tracking-wider bg-blue-50 border border-blue-200 px-3 py-1 rounded-full">
            Core Difference
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
            Cooperative-Owned Infrastructure vs Commercial Gig Apps
          </h2>
          <p className="text-sm text-slate-600">
            Labour Cooperative Federations and Societies own and operate the digital workforce network — ensuring fair livelihood distribution rather than private commission extraction.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-2.5">
            <div className="w-9 h-9 rounded-lg bg-blue-100 text-blue-900 flex items-center justify-center font-bold">
              <Activity className="w-5 h-5 text-blue-700" />
            </div>
            <h3 className="font-bold text-slate-900 text-sm">{t('landing.feature1Title', 'Fair Work Allocation')}</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              {t('landing.feature1Desc', 'Balances skill, availability, proximity, and workload fairness instead of blind distance dispatching.')}
            </p>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-2.5">
            <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-900 flex items-center justify-center font-bold">
              <HeartHandshake className="w-5 h-5 text-emerald-700" />
            </div>
            <h3 className="font-bold text-slate-900 text-sm">{t('landing.feature2Title', 'Transparent Cooperative Wages')}</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              {t('landing.feature2Desc', 'Direct worker earnings with configurable cooperative admin and welfare fund allocations.')}
            </p>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-2.5">
            <div className="w-9 h-9 rounded-lg bg-amber-100 text-amber-900 flex items-center justify-center font-bold">
              <Award className="w-5 h-5 text-amber-700" />
            </div>
            <h3 className="font-bold text-slate-900 text-sm">{t('landing.feature3Title', 'Worker Social Security')}</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              {t('landing.feature3Desc', 'Integrated welfare coverage and safety equipment allowances for registered cooperative members.')}
            </p>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-2.5">
            <div className="w-9 h-9 rounded-lg bg-purple-100 text-purple-900 flex items-center justify-center font-bold">
              <Sparkles className="w-5 h-5 text-purple-700" />
            </div>
            <h3 className="font-bold text-slate-900 text-sm">{t('landing.feature4Title', 'Smart Demand Forecasting')}</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              {t('landing.feature4Desc', 'AI-driven predictive demand modeling to prevent district workforce shortages.')}
            </p>
          </div>
        </div>
      </section>

      {/* How It Works (Ecosystem Flow) */}
      <section className="bg-slate-100 py-12 border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold text-slate-900">How the Cooperative Service Model Works</h2>
            <p className="text-xs text-slate-600">
              Coordinated transparent execution from household or institutional request to welfare credit
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-2">
              <div className="text-xs font-bold text-blue-900 bg-blue-50 px-2 py-0.5 rounded inline-block">
                1. Request Problem
              </div>
              <h4 className="font-bold text-sm text-slate-900">Household or Institution</h4>
              <p className="text-xs text-slate-500">
                Customer posts description (e.g. leaking tap, wiring issue). System classifies urgency and category.
              </p>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-2">
              <div className="text-xs font-bold text-blue-900 bg-blue-50 px-2 py-0.5 rounded inline-block">
                2. Fair Matching
              </div>
              <h4 className="font-bold text-sm text-slate-900">Allocation Engine</h4>
              <p className="text-xs text-slate-500">
                Calculates skill match, certification, availability, distance, and current workload balance.
              </p>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-2">
              <div className="text-xs font-bold text-blue-900 bg-blue-50 px-2 py-0.5 rounded inline-block">
                3. Verified Execution
              </div>
              <h4 className="font-bold text-sm text-slate-900">Cooperative Worker</h4>
              <p className="text-xs text-slate-500">
                Worker arrives with badge, performs service, and validates completion with a secure customer OTP.
              </p>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-2">
              <div className="text-xs font-bold text-blue-900 bg-blue-50 px-2 py-0.5 rounded inline-block">
                4. Settlement & Welfare
              </div>
              <h4 className="font-bold text-sm text-slate-900">Digital Invoice</h4>
              <p className="text-xs text-slate-500">
                Immediate wage credit to worker ledger, automatic 1% welfare fund allocation, and cooperative invoice.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Available Trades Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">{t('landing.popularServices', 'Available Cooperative Trades')}</h2>
            <p className="text-xs text-slate-500">
              Verified artisans & technicians registered with Primary Labour Cooperative Societies (Demo)
            </p>
          </div>
          <Link
            to="/login"
            className="text-xs font-bold text-blue-900 hover:text-blue-700 flex items-center gap-1"
          >
            {t('common.view', 'View All Services')} <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-center">
          {[
            { name: 'Plumbing', icon: '🔧', desc: 'Leaks, Pipes & Sanitary' },
            { name: 'Electrical', icon: '⚡', desc: 'Wiring, MCBs & Fans' },
            { name: 'Carpentry', icon: '🪚', desc: 'Woodwork & Fixtures' },
            { name: 'Caregiving', icon: '🩺', desc: 'Elderly & Patient Aid' },
            { name: 'Gardening', icon: '🌿', desc: 'Lawn & Horticulture' },
            { name: 'Cleaning', icon: '🧹', desc: 'Deep Sanitization' }
          ].map((cat, idx) => (
            <div
              key={idx}
              className="bg-white p-4 rounded-xl border border-slate-200 hover:border-blue-400 hover:shadow-sm transition-all space-y-1.5 cursor-pointer"
              onClick={async () => {
                await quickSwitchRole('customer01@demo.coop');
                navigate('/customer', { state: { prefilledCategory: cat.name } });
              }}
            >
              <div className="text-2xl">{cat.icon}</div>
              <div className="font-bold text-sm text-slate-900">{cat.name}</div>
              <div className="text-[10px] text-slate-500">{cat.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Worker Onboarding CTA */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border-2 border-emerald-200 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-emerald-900 flex items-center gap-2">
              🛠️ {t('onboarding.apply', 'Apply as a Verified Cooperative Worker')}
            </h3>
            <p className="text-xs text-emerald-700 mt-1">
              Join the cooperative workforce. Complete a skill assessment and get society-verified certification.
            </p>
          </div>
          <Link
            to="/worker/apply"
            className="bg-emerald-700 hover:bg-emerald-800 text-white px-5 py-2.5 rounded-lg text-xs font-bold flex items-center gap-1.5 whitespace-nowrap shadow-sm"
          >
            Apply Now <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </section>
    </div>
  );
}
export default LandingPage;
