import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { api } from '../api/client';
import { BarChart3, Users, Briefcase, Heart, Leaf, Building2, TrendingUp, Award, Globe } from 'lucide-react';

export function CommunityImpactPage() {
  const { t } = useLanguage();
  const [impact, setImpact] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadImpact(); }, []);

  const loadImpact = async () => {
    setLoading(true);
    try {
      const res = await api.getCommunityImpact();
      if (res.success) setImpact(res.impact);
    } catch (err) { /* silent */ }
    setLoading(false);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-4 border-blue-900 border-t-transparent rounded-full animate-spin" /></div>;
  if (!impact) return <div className="text-center p-8 text-slate-500">Failed to load impact data</div>;

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
          { label: 'Total Jobs Completed', value: impact.overview.totalJobsCompleted, icon: Briefcase, color: 'blue' },
          { label: 'Worker Earnings', value: impact.overview.totalWorkerEarnings, icon: TrendingUp, color: 'green' },
          { label: 'Welfare Fund', value: impact.overview.totalWelfareFund, icon: Heart, color: 'red' },
          { label: 'Completion Rate', value: `${impact.overview.completionRate}%`, icon: BarChart3, color: 'purple' }
        ].map((card, i) => {
          const Icon = card.icon;
          return (
            <div key={i} className={`bg-white rounded-xl p-4 border border-slate-200 shadow-sm`}>
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
            <div className="flex justify-between"><span className="text-slate-600">Registered Workers</span><span className="font-bold">{impact.workforce.totalRegisteredWorkers}</span></div>
            <div className="flex justify-between"><span className="text-slate-600">Verified Workers</span><span className="font-bold text-green-600">{impact.workforce.verifiedWorkers}</span></div>
            <div className="flex justify-between"><span className="text-slate-600">Currently Active</span><span className="font-bold text-blue-600">{impact.workforce.currentlyActive}</span></div>
            <div className="flex justify-between"><span className="text-slate-600">Avg Earnings/Worker</span><span className="font-bold">{impact.workforce.averageEarningsPerWorker}</span></div>
            <div className="flex justify-between"><span className="text-slate-600">Average Rating</span><span className="font-bold text-amber-600">{impact.workforce.averageRating}★</span></div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
          <h3 className="font-bold text-sm text-slate-800 mb-3 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-purple-600" /> Customer Impact
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-slate-600">Households Served</span><span className="font-bold">{impact.customerImpact.householdServed}</span></div>
            <div className="flex justify-between"><span className="text-slate-600">Institutions Served</span><span className="font-bold">{impact.customerImpact.institutionsServed}</span></div>
            <div className="flex justify-between"><span className="text-slate-600">Unique Customers</span><span className="font-bold">{impact.customerImpact.totalCustomersServed}</span></div>
            <div className="flex justify-between"><span className="text-slate-600">Repeat Customers</span><span className="font-bold text-blue-600">{impact.customerImpact.repeatCustomers}</span></div>
          </div>
        </div>
      </div>

      {/* Service Distribution */}
      <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
        <h3 className="font-bold text-sm text-slate-800 mb-3 flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-indigo-600" /> Service Distribution
        </h3>
        <div className="space-y-2">
          {impact.serviceDistribution.slice(0, 8).map((s, i) => (
            <div key={i} className="flex items-center gap-3">
              <span className="text-xs text-slate-600 w-32 truncate">{s.category}</span>
              <div className="flex-1 bg-slate-100 rounded-full h-3 overflow-hidden">
                <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full" style={{ width: `${s.percentage}%` }} />
              </div>
              <span className="text-xs font-bold text-slate-700 w-12 text-right">{s.percentage}%</span>
            </div>
          ))}
        </div>
      </div>

      {/* Welfare & Environmental */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
          <h3 className="font-bold text-sm text-slate-800 mb-3 flex items-center gap-2">
            <Heart className="w-4 h-4 text-red-500" /> Welfare Impact
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-slate-600">Claims Filed</span><span className="font-bold">{impact.welfareImpact.totalClaimsFiled}</span></div>
            <div className="flex justify-between"><span className="text-slate-600">Claims Approved</span><span className="font-bold text-green-600">{impact.welfareImpact.claimsApproved}</span></div>
            <div className="flex justify-between"><span className="text-slate-600">Total Disbursed</span><span className="font-bold">{impact.welfareImpact.totalDisbursed}</span></div>
            <div className="flex justify-between"><span className="text-slate-600">Approval Rate</span><span className="font-bold text-blue-600">{impact.welfareImpact.approvalRate}%</span></div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
          <h3 className="font-bold text-sm text-slate-800 mb-3 flex items-center gap-2">
            <Leaf className="w-4 h-4 text-green-600" /> Environmental Impact
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-slate-600">CO₂ Saved</span><span className="font-bold text-green-600">{impact.environmentalImpact.estimatedCo2SavedKg} kg</span></div>
            <div className="flex justify-between"><span className="text-slate-600">Local Service Rate</span><span className="font-bold">{impact.environmentalImpact.localServiceRate}</span></div>
            <div className="flex justify-between"><span className="text-slate-600">Avg Worker Travel</span><span className="font-bold">{impact.environmentalImpact.avgWorkerTravelKm} km</span></div>
            <p className="text-[10px] text-slate-400 mt-2 italic">{impact.environmentalImpact.note}</p>
          </div>
        </div>
      </div>

      {/* Governance */}
      <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
        <h3 className="font-bold text-sm text-slate-800 mb-3 flex items-center gap-2">
          <Award className="w-4 h-4 text-amber-600" /> Cooperative Governance
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
          <div className="p-2 bg-slate-50 rounded-lg"><div className="text-lg font-bold">{impact.governance.totalSocieties}</div><div className="text-[10px] text-slate-500">Societies</div></div>
          <div className="p-2 bg-slate-50 rounded-lg"><div className="text-lg font-bold">{impact.governance.totalFederations}</div><div className="text-[10px] text-slate-500">Federations</div></div>
          <div className="p-2 bg-slate-50 rounded-lg"><div className="text-lg font-bold">{impact.governance.activeProposals}</div><div className="text-[10px] text-slate-500">Active Proposals</div></div>
          <div className="p-2 bg-slate-50 rounded-lg"><div className="text-lg font-bold">{impact.governance.totalResolutions}</div><div className="text-[10px] text-slate-500">Resolutions</div></div>
        </div>
      </div>

      {/* Platform Badge */}
      <div className="text-center text-xs text-slate-400 py-4">
        <p>{impact.platform.name} • {impact.platform.problemStatement}</p>
        <p>{impact.platform.organization} • {impact.platform.hackathon}</p>
      </div>
    </div>
  );
}
export default CommunityImpactPage;
