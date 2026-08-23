import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { useLanguage } from '../../context/LanguageContext';
import {
  Building2,
  Users,
  ShieldCheck,
  TrendingUp,
  Activity,
  DollarSign,
  Award,
  MapPin,
  RefreshCw,
  AlertTriangle,
  ArrowRight,
  BrainCircuit,
  Cpu
} from 'lucide-react';
import { StatCard } from '../../components/common/StatCard';
import { LeafletCoopMap } from '../../components/map/LeafletCoopMap';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid
} from 'recharts';

export function FederationDashboard() {
  const { t } = useLanguage();
  const [data, setData] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFederationData();
  }, []);

  const fetchFederationData = async () => {
    setLoading(true);
    try {
      const fRes = await api.getFederationDashboard();
      if (fRes.success) setData(fRes);

      const aRes = await api.getDemandAnalytics();
      if (aRes.success) setAnalytics(aRes);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const macro = data?.macroMetrics || {
    totalSocieties: 2,
    totalWorkers: 12,
    onlineWorkers: 9,
    verifiedWorkers: 11,
    totalJobs: 15,
    completedJobs: 10,
    totalGrossEarnings: 82500,
    totalWelfareFundAccumulated: 825,
    averageWorkerRating: 4.86,
    underutilizedTotal: 3,
    highWorkloadTotal: 1
  };

  const societySummaries = data?.societySummaries || [];
  const trendData = analytics?.trendData || [
    { day: 'Mon', actualJobs: 14, predictedDemand: 16, workersAvailable: 15 },
    { day: 'Tue', actualJobs: 18, predictedDemand: 20, workersAvailable: 16 },
    { day: 'Wed', actualJobs: 12, predictedDemand: 14, workersAvailable: 15 },
    { day: 'Thu', actualJobs: 22, predictedDemand: 25, workersAvailable: 18 },
    { day: 'Fri', actualJobs: 26, predictedDemand: 28, workersAvailable: 20 },
    { day: 'Sat', actualJobs: 30, predictedDemand: 34, workersAvailable: 22 },
    { day: 'Sun', actualJobs: 28, predictedDemand: 31, workersAvailable: 20 }
  ];

  const aiForecasts = analytics?.forecast?.forecasts || [
    {
      district: 'North District',
      serviceCategory: 'Plumbing',
      predictedDemand: 24,
      activeWorkersAvailable: 15,
      potentialShortage: 9,
      demandLevel: 'High',
      recommendation: 'Mobilize 4-6 certified plumbers from East District / reserve roster.',
      status: 'Model Estimate — Demo'
    },
    {
      district: 'East District',
      serviceCategory: 'Caregiving',
      predictedDemand: 13,
      activeWorkersAvailable: 7,
      potentialShortage: 6,
      demandLevel: 'High',
      recommendation: 'Alert Society SOC-DEMO-002 for on-call caregiver activation.',
      status: 'Model Estimate — Demo'
    },
    {
      district: 'Central Metro',
      serviceCategory: 'Electrical',
      predictedDemand: 14,
      activeWorkersAvailable: 14,
      potentialShortage: 0,
      demandLevel: 'Balanced',
      recommendation: 'Workforce adequately balanced with predicted demand.',
      status: 'Model Estimate — Demo'
    }
  ];

  const mlModelDetails = analytics?.forecast?.model || {
    name: 'Scikit-Learn Random Forest Regressor',
    r2_score: 0.912,
    mae: 1.15,
    status: 'Model Estimate — Demo'
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className="bg-amber-100 text-amber-900 text-xs font-bold px-2.5 py-0.5 rounded-full uppercase">
              State Federation (Demo)
            </span>
            <span className="text-xs text-slate-500 font-medium">
              ID: {data?.federation?.id || 'FED-DEMO-001'}
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">
            {t('federation.title', 'Labour Cooperative Federation Governance')}
          </h1>
          <p className="text-xs text-slate-500">
            Cross-Society Workforce Mobilization, AI-Based Demand Forecasting & Cooperative Policy Oversight
          </p>
        </div>

        <button
          onClick={fetchFederationData}
          className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1 border border-slate-200 self-start"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Analytics</span>
        </button>
      </div>

      {/* Macro KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title={t('federation.totalSocieties', 'Affiliated Societies')}
          value={`${macro.totalSocieties} Societies`}
          subtitle="Central & Eastern Districts"
          icon={Building2}
          color="blue"
        />
        <StatCard
          title="Registered Workforce"
          value={`${macro.totalWorkers} Workers`}
          subtitle={`${macro.onlineWorkers} active on-duty`}
          icon={Users}
          color="green"
        />
        <StatCard
          title={t('federation.macroVolume', 'Total Gross Service Volume')}
          value={`₹${macro.totalGrossEarnings}`}
          subtitle="Collective wage generation"
          icon={DollarSign}
          color="amber"
        />
        <StatCard
          title="Accumulated Welfare Fund"
          value={`₹${macro.totalWelfareFundAccumulated}`}
          subtitle="Demo Cooperative Welfare Pool"
          icon={ShieldCheck}
          color="purple"
        />
      </div>

      {/* Smart Automation Section: Predictive Demand Forecasting */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-3 gap-2">
          <div>
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <BrainCircuit className="w-4 h-4 text-purple-700" />
              {t('federation.aiForecasting', 'AI-Based Demand Forecasting & Workforce Allocation')}
            </h2>
            <p className="text-xs text-slate-500">
              Machine learning model ({mlModelDetails.name} • R²: {mlModelDetails.r2_score || '0.91'}) estimating regional demand spikes.
            </p>
          </div>
          <span className="bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-bold px-2.5 py-1 rounded self-start">
            Model Estimate — Demo
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {aiForecasts.slice(0, 3).map((f, idx) => (
            <div
              key={idx}
              className={`p-4 rounded-xl space-y-2 border-2 ${
                f.demandLevel === 'High'
                  ? 'bg-red-50/70 border-red-200'
                  : 'bg-emerald-50/70 border-emerald-200'
              }`}
            >
              <div className="flex justify-between items-start">
                <span className="font-bold text-xs text-slate-900">{f.district}</span>
                <span
                  className={`text-white text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${
                    f.demandLevel === 'High' ? 'bg-red-600' : 'bg-emerald-700'
                  }`}
                >
                  {f.demandLevel} Demand
                </span>
              </div>
              <div className="text-xs text-slate-700">
                Predicted {f.serviceCategory} Demand: <strong>{f.predictedDemand} jobs</strong> (Available: {f.activeWorkersAvailable})
              </div>
              <div
                className={`text-[11px] p-2 rounded ${
                  f.demandLevel === 'High' ? 'text-red-900 bg-red-100' : 'text-emerald-900 bg-emerald-100'
                }`}
              >
                <strong>{f.potentialShortage > 0 ? `Shortage: ${f.potentialShortage} Workers` : 'Workforce Balanced'}</strong> • {f.recommendation}
              </div>
              {f.potentialShortage > 0 && (
                <button
                  onClick={async()=>{
                    try{
                      const from = f.district==='North District'?'East District':'Central Metro';
                      const res=await api.mobilizeWorkforce({fromDistrict:from,toDistrict:f.district,serviceCategory:f.serviceCategory,count:Math.min(6,f.potentialShortage)});
                      alert(res.message); fetchFederationData();
                    }catch(e){alert(e.message)}
                  }}
                  className="w-full mt-2 bg-[#0f2e5a] hover:bg-[#1a4b8c] text-white py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1"
                >
                  <ArrowRight className="w-3 h-3" /> Mobilize {Math.min(6,f.potentialShortage)} Workers
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Chart: 7-Day Demand Forecasting vs Available Workforce */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900">
              Weekly Predicted Demand vs Available Workforce Capacity
            </h3>
            <span className="text-[10px] text-slate-400 font-mono">Scikit-Learn + Recharts</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Bar dataKey="predictedDemand" name="Predicted Demand (Jobs)" fill="#0f2e5a" radius={[4, 4, 0, 0]} />
                <Bar dataKey="workersAvailable" name="Workers Available" fill="#166534" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Leaflet Geo-Spatial Multi-Society Map */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-blue-700" />
              {t('federation.geoCoverage', 'Regional Society Centers & Demand Zones')}
            </h3>
            <span className="text-[10px] text-slate-400">Leaflet + OpenStreetMap</span>
          </div>

          <LeafletCoopMap
            demandClusters={analytics?.heatmap || []}
            height="240px"
          />
        </div>
      </div>

      {/* Multi-Society Comparison Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 font-bold text-sm text-slate-900">
          Affiliated Primary Cooperative Societies Comparison
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] border-b border-slate-200">
              <tr>
                <th className="p-3">Society Code & Name</th>
                <th className="p-3">District</th>
                <th className="p-3">Registered Workers</th>
                <th className="p-3">On-Duty</th>
                <th className="p-3">Total Completed</th>
                <th className="p-3">Gross Turnover</th>
                <th className="p-3">Underutilized Pool</th>
                <th className="p-3">High Workload</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {societySummaries.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50/70">
                  <td className="p-3">
                    <div className="font-bold text-slate-900">{s.name}</div>
                    <div className="font-mono text-[10px] text-slate-400">{s.id}</div>
                  </td>
                  <td className="p-3 text-slate-700 font-semibold">{s.district}</td>
                  <td className="p-3 font-mono font-bold text-slate-900">{s.workersCount}</td>
                  <td className="p-3 text-emerald-700 font-bold">{s.onlineCount} Online</td>
                  <td className="p-3 font-mono">{s.completedCount}</td>
                  <td className="p-3 font-mono font-bold text-slate-900">₹{s.grossEarnings}</td>
                  <td className="p-3">
                    <span className="bg-blue-100 text-blue-900 px-2 py-0.5 rounded text-[10px] font-bold">
                      {s.underutilizedCount} Workers
                    </span>
                  </td>
                  <td className="p-3">
                    <span className="bg-amber-100 text-amber-900 px-2 py-0.5 rounded text-[10px] font-bold">
                      {s.overloadedCount} Workers
                    </span>
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
export default FederationDashboard;
