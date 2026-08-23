import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { BarChart3, Clock, TrendingUp, DollarSign, Shield, Activity, Calendar, Award } from 'lucide-react';

export function WorkerUtilizationPage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [trust, setTrust] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [pRes, jRes] = await Promise.all([api.getWorkerProfile(), api.getJobs()]);
      if (pRes.success) setProfile(pRes.worker);
      if (jRes.success) setJobs(jRes.jobs);
      if (pRes.worker?.id) {
        const tRes = await api.getWorkerTrustScore(pRes.worker.id);
        if (tRes.success) setTrust(tRes.trust);
      }
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const completedJobs = jobs.filter(j => j.status === 'COMPLETED' || j.status === 'PAID');
  const activeJobs = jobs.filter(j => ['ACCEPTED','ON_THE_WAY','ARRIVED','IN_PROGRESS'].includes(j.status));
  const totalEarnings = completedJobs.reduce((s, j) => s + (j.pricing?.netWorkerEarnings || 0), 0);
  const totalGross = completedJobs.reduce((s, j) => s + (j.pricing?.grossAmount || 0), 0);

  const thisWeekJobs = completedJobs.filter(j => (Date.now() - new Date(j.completedAt || j.createdAt).getTime()) < 7*24*60*60*1000);
  const earningsThisWeek = thisWeekJobs.reduce((s, j) => s + (j.pricing?.netWorkerEarnings || 0), 0);

  const avgEarningsPerJob = completedJobs.length > 0 ? Math.round(totalEarnings / completedJobs.length) : 0;
  const utilizationRate = jobs.length > 0 ? Math.round((completedJobs.length / Math.max(1, jobs.length)) * 100) : 0;

  const skillBreakdown = {};
  completedJobs.forEach(j => {
    const cat = j.serviceCategory || 'Other';
    if (!skillBreakdown[cat]) skillBreakdown[cat] = { count: 0, earnings: 0 };
    skillBreakdown[cat].count++;
    skillBreakdown[cat].earnings += j.pricing?.netWorkerEarnings || 0;
  });

  if (loading) return <div className="min-h-screen flex items-center justify-center text-sm text-slate-500">Loading utilization data...</div>;

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="bg-gradient-to-r from-[#0f2e5a] to-[#1a4b8c] text-white rounded-2xl p-6">
        <h1 className="text-lg font-bold flex items-center gap-2"><BarChart3 className="w-5 h-5" /> Worker Utilization & Welfare Dashboard</h1>
        <p className="text-xs text-blue-200 mt-1">Analytics on your cooperative workforce performance, earnings trends, and welfare coverage.</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatBox icon={Activity} label="Utilization Rate" value={`${utilizationRate}%`} color="blue" />
        <StatBox icon={DollarSign} label="Total Net Earnings" value={`₹${totalEarnings.toLocaleString()}`} color="green" />
        <StatBox icon={TrendingUp} label="This Week" value={`${thisWeekJobs.length} jobs`} sub={`₹${earningsThisWeek.toLocaleString()}`} color="emerald" />
        <StatBox icon={Clock} label="Avg per Job" value={`₹${avgEarningsPerJob}`} color="amber" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5"><BarChart3 className="w-4 h-4 text-blue-700" /> Skill Specialization Breakdown</h2>
          {Object.entries(skillBreakdown).sort((a,b) => b[1].count - a[1].count).map(([cat, data]) => (
            <div key={cat} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
              <div>
                <div className="text-xs font-bold text-slate-900">{cat}</div>
                <div className="text-[10px] text-slate-500">{data.count} jobs completed</div>
              </div>
              <div className="text-right">
                <div className="text-xs font-bold text-emerald-700">₹{data.earnings.toLocaleString()}</div>
                <div className="text-[10px] text-slate-500">net earned</div>
              </div>
            </div>
          ))}
          {Object.keys(skillBreakdown).length === 0 && <p className="text-xs text-slate-400">No completed jobs yet.</p>}
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5"><Shield className="w-4 h-4 text-emerald-700" /> Trust & Welfare Status</h2>
          {trust ? (
            <div className="space-y-3">
              <div className="p-4 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl border border-emerald-200 text-center">
                <div className="text-3xl font-bold text-emerald-800">{trust.trustScore}</div>
                <div className="text-xs text-emerald-700 font-semibold mt-1">{trust.badge} — {trust.tier}</div>
              </div>
              {Object.entries(trust.dimensions).map(([key, dim]) => (
                <div key={key} className="flex items-center justify-between text-xs">
                  <span className="text-slate-600 capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${(dim.score/dim.max)*100}%` }} />
                    </div>
                    <span className="font-mono font-bold text-slate-800 w-8 text-right">{dim.score}/{dim.max}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 bg-slate-50 rounded-xl text-xs text-slate-500">Trust score loading...</div>
          )}

          <div className="border-t border-slate-100 pt-3 space-y-2">
            <h3 className="text-xs font-bold text-slate-700">Welfare Coverage</h3>
            <div className="p-3 bg-blue-50 rounded-xl border border-blue-200 text-xs space-y-1">
              <div className="flex justify-between"><span className="text-slate-600">Policy</span><span className="font-bold text-blue-800">INS-DEMO-001</span></div>
              <div className="flex justify-between"><span className="text-slate-600">Accident Cover</span><span className="font-bold text-blue-800">₹5,00,000</span></div>
              <div className="flex justify-between"><span className="text-slate-600">Health Benefit</span><span className="font-bold text-blue-800">₹2,00,000</span></div>
              <div className="flex justify-between"><span className="text-slate-600">Tool Allowance</span><span className="font-bold text-blue-800">₹5,000/yr</span></div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-3">
        <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5"><Calendar className="w-4 h-4 text-purple-700" /> Recent Job Activity</h2>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {jobs.slice(0, 15).map(j => (
            <div key={j.id} className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg border border-slate-100 text-xs">
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${j.status === 'COMPLETED' || j.status === 'PAID' ? 'bg-emerald-500' : j.status === 'CANCELLED' ? 'bg-red-500' : 'bg-blue-500'}`} />
                <span className="font-bold text-slate-900">{j.serviceCategory}</span>
                <span className="text-slate-500">{j.code}</span>
              </div>
              <div className="text-right">
                <span className="font-bold text-slate-800">₹{j.pricing?.netWorkerEarnings || 0}</span>
                <span className={`ml-2 px-1.5 py-0.5 rounded text-[9px] font-bold ${j.status === 'PAID' ? 'bg-green-100 text-green-800' : j.status === 'COMPLETED' ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-600'}`}>{j.status}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatBox({ icon: Icon, label, value, sub, color }) {
  const colors = { blue: 'bg-blue-50 text-blue-700 border-blue-200', green: 'bg-emerald-50 text-emerald-700 border-emerald-200', emerald: 'bg-teal-50 text-teal-700 border-teal-200', amber: 'bg-amber-50 text-amber-700 border-amber-200' };
  return (
    <div className={`p-4 rounded-xl border ${colors[color] || colors.blue} space-y-1`}>
      <Icon className="w-5 h-5 mb-1" />
      <div className="text-[10px] font-semibold uppercase tracking-wider opacity-70">{label}</div>
      <div className="text-xl font-bold">{value}</div>
      {sub && <div className="text-[10px] opacity-60">{sub}</div>}
    </div>
  );
}
