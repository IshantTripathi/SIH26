import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import {
  Building2,
  Users,
  ShieldCheck,
  Activity,
  DollarSign,
  CheckCircle2,
  AlertTriangle,
  FileText,
  TrendingUp,
  RefreshCw,
  Award,
  Sliders,
  Save,
  Settings
} from 'lucide-react';
import { StatCard, WorkloadBadge } from '../../components/common/StatCard';
import { Link } from 'react-router-dom';

export function SocietyDashboard() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [verifyingWorkerId, setVerifyingWorkerId] = useState(null);
  const [coopPercent, setCoopPercent] = useState(4);
  const [welfarePercent, setWelfarePercent] = useState(1);
  const [coverageRadius, setCoverageRadius] = useState(15);
  const [savingConfig, setSavingConfig] = useState(false);
  const [welfareClaims, setWelfareClaims] = useState([]);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const res = await api.getSocietyDashboard();
      if (res.success) {
        setData(res);
        if (res.society) {
          setCoopPercent(res.society.coopContributionPercent ?? 4);
          setWelfarePercent(res.society.welfareFundPercent ?? 1);
          setCoverageRadius(res.society.coverageRadiusKm ?? 15);
        }
      }
      try {
        const wRes = await api.getWelfareClaims();
        if (wRes.success) setWelfareClaims(wRes.claims || []);
      } catch(e) {}
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const handleSaveConfig = async () => {
    const total = Number(coopPercent) + Number(welfarePercent);
    if (total > 15) { alert('Total cooperative deductions must be ≤15% to protect 85%+ worker payout.'); return; }
    setSavingConfig(true);
    try {
      const societyId = data?.society?.id || 'SOC-DEMO-001';
      const res = await api.updateSocietyConfig(societyId, { coopContributionPercent: Number(coopPercent), welfareFundPercent: Number(welfarePercent), coverageRadiusKm: Number(coverageRadius) });
      if (res.success) { alert(`Society config updated: Coop ${coopPercent}%, Welfare ${welfarePercent}%, Radius ${coverageRadius}km. Future jobs will use new rates.`); await fetchDashboard(); }
    } catch (err) { alert(`Save failed: ${err.message}`); }
    setSavingConfig(false);
  };

  const handleWelfareReview = async (claimId, status) => {
    try {
      await api.updateWelfareClaimStatus(claimId, { status, reviewNotes: `${status} by ${user?.name}` });
      await fetchDashboard();
    } catch (err) { alert(err.message); }
  };

  const handleVerify = async (workerId, newStatus) => {
    setVerifyingWorkerId(workerId);
    try {
      const res = await api.verifyWorkerSkill(workerId, {
        verificationStatus: newStatus,
        notes: `Updated by Society Administrator (${user?.name})`
      });
      if (res.success) {
        await fetchDashboard();
      }
    } catch (err) {
      alert(`Verification error: ${err.message}`);
    }
    setVerifyingWorkerId(null);
  };

  const stats = data?.stats || {
    totalWorkers: 8,
    activeWorkers: 6,
    verifiedWorkers: 7,
    pendingVerification: 1,
    totalJobsCount: 4,
    completedJobsCount: 2,
    totalEarnings: 21500,
    totalCoopFundCollected: 860,
    totalWelfareFundCollected: 215,
    workloadBreakdown: { underutilized: 2, balanced: 5, highWorkload: 1 }
  };

  const workersList = data?.workersList || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className="bg-blue-100 text-blue-900 text-xs font-bold px-2.5 py-0.5 rounded-full uppercase">
              Society Administration
            </span>
            <span className="text-xs text-slate-500 font-medium">
              ID: {data?.society?.id || 'SOC-DEMO-001'} • Reg: {data?.society?.registrationNumber || 'SOC-REG-DEMO-01'}
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">
            {data?.society?.name || 'Central Metro Labour Cooperative Society (Demo)'}
          </h1>
          <p className="text-xs text-slate-500">
            Jurisdiction: Central Metro & Surrounding Zones • Affiliated with Sample Labour Cooperative Federation (Demo)
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={fetchDashboard}
            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1 border border-slate-200"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>
          <Link
            to="/society/workers"
            className="px-4 py-2 bg-[#0f2e5a] hover:bg-[#1a4b8c] text-white rounded-lg text-xs font-bold shadow-sm"
          >
            {t('society.workerRoster', 'Worker Roster')} ({workersList.length})
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title={t('society.totalWorkers', 'Total Registered Workers')}
          value={stats.totalWorkers}
          subtitle={`${stats.activeWorkers} currently on-duty`}
          icon={Users}
          color="blue"
        />
        <StatCard
          title="Gross Service Turnover"
          value={`₹${stats.totalEarnings}`}
          subtitle={`Coop Admin Fund: ₹${stats.totalCoopFundCollected}`}
          icon={DollarSign}
          color="green"
        />
        <StatCard
          title="Labour Welfare Fund"
          value={`₹${stats.totalWelfareFundCollected}`}
          subtitle="Demo Cooperative Welfare Pool"
          icon={ShieldCheck}
          color="purple"
        />
        <StatCard
          title="Workforce Fatigue Index"
          value={`${stats.workloadBreakdown.highWorkload} Overloaded`}
          subtitle={`${stats.workloadBreakdown.underutilized} underutilized workers`}
          icon={Activity}
          color={stats.workloadBreakdown.highWorkload > 0 ? 'amber' : 'green'}
        />
      </div>

      {/* Workload Balancing Distribution Grid */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Activity className="w-4 h-4 text-blue-700" />
              {t('society.workloadBalanced', 'Workforce Opportunity & Workload Distribution')}
            </h2>
            <p className="text-xs text-slate-500">
              Cooperative objective: Keep workers in "Balanced" tier, avoiding worker burnout and underutilization.
            </p>
          </div>
          <span className="text-[11px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-semibold">
            Real-time Balancer
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl space-y-1">
            <span className="text-xs font-bold text-blue-900 block">{t('society.underutilized', 'Underutilized (0 active jobs)')}</span>
            <div className="text-2xl font-bold text-blue-950">{stats.workloadBreakdown.underutilized} Workers</div>
            <p className="text-[11px] text-blue-700">Fair Allocation Engine gives +15 bonus points to these workers.</p>
          </div>

          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-1">
            <span className="text-xs font-bold text-emerald-900 block">{t('society.balanced', 'Balanced (1–4 active jobs)')}</span>
            <div className="text-2xl font-bold text-emerald-950">{stats.workloadBreakdown.balanced} Workers</div>
            <p className="text-[11px] text-emerald-700">Optimal sustainable workload state.</p>
          </div>

          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-1">
            <span className="text-xs font-bold text-amber-900 block">{t('society.highWorkload', 'High Workload (5+ active jobs)')}</span>
            <div className="text-2xl font-bold text-amber-950">{stats.workloadBreakdown.highWorkload} Workers</div>
            <p className="text-[11px] text-amber-800">Penalized during dispatch to prevent fatigue.</p>
          </div>
        </div>

        <div className="text-[11px] text-slate-500 pt-1">
          {t('common.demoDisclaimer', 'Demo contribution model — values are configurable and are not presented as statutory rates.')}
        </div>
      </div>

      {/* Configurable Contribution Model */}
      <div className="bg-white border-2 border-blue-200 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <Settings className="w-4 h-4 text-blue-700" />
            {t('society.configRates', 'Configure Contribution Rates')} <span className="text-[10px] bg-amber-100 text-amber-900 px-2 py-0.5 rounded">Configurable Model</span>
          </h2>
          <span className="text-xs font-bold text-emerald-800">Worker Payout: {(100 - Number(coopPercent) - Number(welfarePercent)).toFixed(1)}%</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Society Operations & Tooling (%)</label>
            <input type="range" min="1" max="10" step="0.5" value={coopPercent} onChange={e=>setCoopPercent(e.target.value)} className="w-full" />
            <div className="flex justify-between text-[11px] text-slate-500"><span>1%</span><span className="font-bold text-blue-900 text-sm">{coopPercent}%</span><span>10%</span></div>
          </div>
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Welfare & Insurance Fund (%)</label>
            <input type="range" min="0.5" max="5" step="0.5" value={welfarePercent} onChange={e=>setWelfarePercent(e.target.value)} className="w-full" />
            <div className="flex justify-between text-[11px] text-slate-500"><span>0.5%</span><span className="font-bold text-purple-900 text-sm">{welfarePercent}%</span><span>5%</span></div>
          </div>
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Service Coverage Radius (km)</label>
            <input type="number" min="5" max="30" value={coverageRadius} onChange={e=>setCoverageRadius(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg" />
            <div className="text-[11px] text-slate-400">Regional service boundary for proximity scoring</div>
          </div>
        </div>
        <div className="flex items-center justify-between pt-2">
          <p className="text-[11px] text-slate-500 max-w-xl">{t('common.demoDisclaimer','Demo contribution model — values are configurable and are not presented as statutory rates.')}</p>
          <button onClick={handleSaveConfig} disabled={savingConfig} className="px-4 py-2 bg-[#0f2e5a] hover:bg-[#1a4b8c] text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm">
            <Save className="w-3.5 h-3.5" />{savingConfig?'Saving...':'Save Configuration'}
          </button>
        </div>
      </div>

      {/* Welfare Claims Review for Society Admin */}
      {welfareClaims.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-purple-700" /> Pending Welfare Benefit Claims ({welfareClaims.filter(c=>c.status==='Under Review').length})</h3>
            <span className="text-xs text-slate-500">Review & Approve worker claims</span>
          </div>
          <div className="divide-y divide-slate-100">
            {welfareClaims.slice(0,5).map(c => (
              <div key={c.id} className="p-3 flex items-center justify-between text-xs">
                <div>
                  <div className="font-bold text-slate-900">{c.workerName} — {c.claimPurpose}</div>
                  <div className="text-slate-500">₹{c.requestedAmount} • {c.claimDetails} • <span className={`font-bold ${c.status==='Approved'?'text-emerald-700':c.status==='Rejected'?'text-red-700':'text-amber-700'}`}>{c.status}</span></div>
                </div>
                {c.status==='Under Review' && (
                  <div className="flex gap-1">
                    <button onClick={()=>handleWelfareReview(c.id,'Approved')} className="px-3 py-1 bg-emerald-700 text-white rounded text-[11px] font-bold">Approve</button>
                    <button onClick={()=>handleWelfareReview(c.id,'Rejected')} className="px-3 py-1 bg-slate-200 text-slate-700 rounded text-[11px] font-bold">Reject</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Verification Queue & Active Worker Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
            <Award className="w-4 h-4 text-amber-600" />
            {t('society.workerRoster', 'Registered Worker Roster & Skill Verification')}
          </h3>
          <span className="text-xs text-slate-500 font-medium">Society: SOC-DEMO-001</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] border-b border-slate-200">
              <tr>
                <th className="p-3">Worker ID & Name</th>
                <th className="p-3">Primary Trade</th>
                <th className="p-3">Experience</th>
                <th className="p-3">Certification</th>
                <th className="p-3">Workload Status</th>
                <th className="p-3">Verification</th>
                <th className="p-3 text-right">Admin Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {workersList.map((worker) => (
                <tr key={worker.id} className="hover:bg-slate-50/70">
                  <td className="p-3">
                    <div className="font-bold text-slate-900">{worker.name}</div>
                    <div className="font-mono text-[10px] text-slate-400">{worker.code || worker.id}</div>
                  </td>
                  <td className="p-3 text-slate-800 font-semibold">{worker.primarySkill}</td>
                  <td className="p-3 text-slate-600">{worker.experienceYears} Years</td>
                  <td className="p-3">
                    <span className="font-mono bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded text-[10px]">
                      {worker.certifications?.[0]?.code || 'CERT-DEMO-001'}
                    </span>
                  </td>
                  <td className="p-3">
                    <WorkloadBadge status={worker.currentWorkload} count={worker.activeJobsCount} />
                  </td>
                  <td className="p-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        worker.verificationStatus === 'Verified'
                          ? 'bg-emerald-100 text-emerald-800'
                          : worker.verificationStatus === 'Suspended'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-amber-100 text-amber-900'
                      }`}
                    >
                      {worker.verificationStatus}
                    </span>
                  </td>
                  <td className="p-3 text-right space-x-1">
                    {worker.verificationStatus !== 'Verified' && (
                      <button
                        onClick={() => handleVerify(worker.id, 'Verified')}
                        disabled={verifyingWorkerId === worker.id}
                        className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded text-[10px] font-bold shadow-2xs"
                      >
                        {t('society.verifyWorker', 'Approve & Verify')}
                      </button>
                    )}

                    {worker.verificationStatus === 'Verified' && (
                      <button
                        onClick={() => handleVerify(worker.id, 'Suspended')}
                        disabled={verifyingWorkerId === worker.id}
                        className="px-2 py-1 bg-slate-100 hover:bg-red-50 text-red-700 rounded text-[10px] font-bold"
                      >
                        Suspend
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
export default SocietyDashboard;
