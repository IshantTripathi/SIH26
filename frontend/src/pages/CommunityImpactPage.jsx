import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { api } from '../api/client';
import { BarChart3, Users, Briefcase, Heart, Leaf, Building2, TrendingUp, Award, Globe } from 'lucide-react';

export function CommunityImpactPage() {
  const { t } = useLanguage();
  const [impact, setImpact] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => { loadImpact(); }, []);

  const loadImpact = async () => {
    setLoading(true);
    try {
      const res = await api.getCommunityImpact();
      if (res.success && res.impact) setImpact(res.impact);
      else setError('Failed to load impact data');
    } catch (err) {
      setError('Failed to load impact data');
    }
    setLoading(false);
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center">
        <div className="w-8 h-8 border-4 border-blue-900 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm text-slate-500">Loading impact data...</p>
      </div>
    </div>
  );

  if (error || !impact) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center">
        <Globe className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <p className="text-slate-500">{error || 'No data available'}</p>
        <button onClick={loadImpact} className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">Retry</button>
      </div>
    </div>
  );

  const overview = impact.overview || {};
  const workforce = impact.workforce || {};
  const serviceDist = impact.serviceDistribution || [];
  const customerImpact = impact.customerImpact || {};
  const welfareImpact = impact.welfareImpact || {};
  const environmentalImpact = impact.environmentalImpact || {};
  const governance = impact.governance || {};
  const platform = impact.platform || {};

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="text-center bg-gradient-to-r from-green-600 to-blue-700 rounded-2xl p-8 text-white">
        <Globe className="w-12 h-12 mx-auto mb-3 text-green-200" />
        <h1 className="text-3xl font-bold">Community Impact Dashboard</h1>
        <p className="text-green-100 mt-2">Real-time social impact metrics — Ministry of Cooperation / NCCT</p>
        <p className="text-xs text-green-200 mt-1">Problem Statement SIH26089 — Smart India Hackathon 2026</p>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total Jobs Completed', value: overview.totalJobsCompleted || 0, icon: Briefcase, color: 'blue' },
          { label: 'Worker Earnings', value: overview.totalWorkerEarnings || 'Rs.0', icon: TrendingUp, color: 'green' },
          { label: 'Welfare Fund', value: overview.totalWelfareFund || 'Rs.0', icon: Heart, color: 'red' },
          { label: 'Completion Rate', value: `${overview.completionRate || 0}%`, icon: BarChart3, color: 'purple' }
        ].map((card, i) => {
          const Icon = card.icon;
          return (
            <div key={i} className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
              <Icon className={`w-5 h-5 text-${card.color}-500 mb-2`} />
              <div className="text-xl font-bold text-slate-900">{card.value}</div>
              <div className="text-[11px] text-slate-500">{card.label}</div>
            </div>
          );
        })}
      </div>

      {/* Workforce & Customer Impact */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
          <h3 className="font-bold text-sm text-slate-800 mb-3 flex items-center gap-2">
            <Users className="w-4 h-4 text-blue-600" /> Workforce Impact
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-slate-600">Registered Workers</span><span className="font-bold">{workforce.totalRegisteredWorkers || 0}</span></div>
            <div className="flex justify-between"><span className="text-slate-600">Verified Workers</span><span className="font-bold text-green-600">{workforce.verifiedWorkers || 0}</span></div>
            <div className="flex justify-between"><span className="text-slate-600">Currently Active</span><span className="font-bold text-blue-600">{workforce.currentlyActive || 0}</span></div>
            <div className="flex justify-between"><span className="text-slate-600">Avg Earnings/Worker</span><span className="font-bold">{workforce.averageEarningsPerWorker || 'Rs.0'}</span></div>
            <div className="flex justify-between"><span className="text-slate-600">Average Rating</span><span className="font-bold text-amber-600">{workforce.averageRating || '0'}</span></div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
          <h3 className="font-bold text-sm text-slate-800 mb-3 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-purple-600" /> Customer Impact
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-slate-600">Households Served</span><span className="font-bold">{customerImpact.householdServed || 0}</span></div>
            <div className="flex justify-between"><span className="text-slate-600">Institutions Served</span><span className="font-bold">{customerImpact.institutionsServed || 0}</span></div>
            <div className="flex justify-between"><span className="text-slate-600">Unique Customers</span><span className="font-bold">{customerImpact.totalCustomersServed || 0}</span></div>
            <div className="flex justify-between"><span className="text-slate-600">Repeat Customers</span><span className="font-bold text-blue-600">{customerImpact.repeatCustomers || 0}</span></div>
          </div>
        </div>
      </div>

      {/* Service Distribution */}
      <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
        <h3 className="font-bold text-sm text-slate-800 mb-3 flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-indigo-600" /> Service Distribution
        </h3>
        <div className="space-y-2">
          {serviceDist.length > 0 ? serviceDist.slice(0, 8).map((s, i) => (
            <div key={i} className="flex items-center gap-3">
              <span className="text-xs text-slate-600 w-32 truncate">{s.category}</span>
              <div className="flex-1 bg-slate-100 rounded-full h-3 overflow-hidden">
                <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full" style={{ width: `${s.percentage || 0}%` }} />
              </div>
              <span className="text-xs font-bold text-slate-700 w-12 text-right">{s.percentage || 0}%</span>
            </div>
          )) : <p className="text-xs text-slate-400 text-center py-2">No completed services yet</p>}
        </div>
      </div>

      {/* Welfare & Environmental */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
          <h3 className="font-bold text-sm text-slate-800 mb-3 flex items-center gap-2">
            <Heart className="w-4 h-4 text-red-500" /> Welfare Impact
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-slate-600">Claims Filed</span><span className="font-bold">{welfareImpact.totalClaimsFiled || 0}</span></div>
            <div className="flex justify-between"><span className="text-slate-600">Claims Approved</span><span className="font-bold text-green-600">{welfareImpact.claimsApproved || 0}</span></div>
            <div className="flex justify-between"><span className="text-slate-600">Total Disbursed</span><span className="font-bold">{welfareImpact.totalDisbursed || 'Rs.0'}</span></div>
            <div className="flex justify-between"><span className="text-slate-600">Approval Rate</span><span className="font-bold text-blue-600">{welfareImpact.approvalRate || 0}%</span></div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
          <h3 className="font-bold text-sm text-slate-800 mb-3 flex items-center gap-2">
            <Leaf className="w-4 h-4 text-green-600" /> Environmental Impact
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-slate-600">CO2 Saved</span><span className="font-bold text-green-600">{environmentalImpact.estimatedCo2SavedKg || 0} kg</span></div>
            <div className="flex justify-between"><span className="text-slate-600">Local Service Rate</span><span className="font-bold">{environmentalImpact.localServiceRate || 'N/A'}</span></div>
            <div className="flex justify-between"><span className="text-slate-600">Avg Worker Travel</span><span className="font-bold">{environmentalImpact.avgWorkerTravelKm || 0} km</span></div>
            {environmentalImpact.note && <p className="text-[10px] text-slate-400 mt-2 italic">{environmentalImpact.note}</p>}
          </div>
        </div>
      </div>

      {/* Governance */}
      <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
        <h3 className="font-bold text-sm text-slate-800 mb-3 flex items-center gap-2">
          <Award className="w-4 h-4 text-amber-600" /> Cooperative Governance
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
          <div className="p-2 bg-slate-50 rounded-lg"><div className="text-lg font-bold">{governance.totalSocieties || 0}</div><div className="text-[10px] text-slate-500">Societies</div></div>
          <div className="p-2 bg-slate-50 rounded-lg"><div className="text-lg font-bold">{governance.totalFederations || 0}</div><div className="text-[10px] text-slate-500">Federations</div></div>
          <div className="p-2 bg-slate-50 rounded-lg"><div className="text-lg font-bold">{governance.activeProposals || 0}</div><div className="text-[10px] text-slate-500">Active Proposals</div></div>
          <div className="p-2 bg-slate-50 rounded-lg"><div className="text-lg font-bold">{governance.totalResolutions || 0}</div><div className="text-[10px] text-slate-500">Resolutions</div></div>
        </div>
      </div>

      {/* Platform Badge */}
      <div className="text-center text-xs text-slate-400 py-4">
        <p>{platform.name || 'Sahakar Gig Platform'} — {platform.problemStatement || 'SIH26089'}</p>
        <p>{platform.organization || 'Ministry of Cooperation / NCCT'} — {platform.hackathon || 'Smart India Hackathon 2026'}</p>
      </div>
    </div>
  );
}
export default CommunityImpactPage;
