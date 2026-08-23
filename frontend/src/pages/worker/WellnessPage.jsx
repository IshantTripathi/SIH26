import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api/client';
import { Heart, Clock, AlertTriangle, CheckCircle, Coffee, DollarSign, Shield, Activity } from 'lucide-react';

export function WellnessPage() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [wellness, setWellness] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadWellness(); }, []);

  const loadWellness = async () => {
    setLoading(true);
    try {
      const res = await api.getMyWellness();
      if (res.success) setWellness(res.wellness);
    } catch (err) { /* silent */ }
    setLoading(false);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-4 border-blue-900 border-t-transparent rounded-full animate-spin" /></div>;
  if (!wellness) return <div className="text-center p-8 text-slate-500">No wellness data available</div>;

  const wellnessColor = wellness.wellnessScore >= 80 ? 'green' : wellness.wellnessScore >= 50 ? 'amber' : 'red';
  const fatigueColor = wellness.fatigueRisk === 'Low' ? 'green' : wellness.fatigueRisk === 'Medium' ? 'amber' : 'red';

  return (
    <div className="max-w-3xl mx-auto p-4 space-y-4">
      <div className="text-center mb-4">
        <h1 className="text-2xl font-bold text-slate-900">Worker Wellness Dashboard</h1>
        <p className="text-sm text-slate-500">Monitor your health, rest, and fair wage compliance</p>
      </div>

      {/* Wellness Score */}
      <div className={`bg-gradient-to-r from-${wellnessColor}-500 to-${wellnessColor}-600 rounded-2xl p-6 text-white text-center`}>
        <Activity className="w-10 h-10 mx-auto mb-2 text-white/80" />
        <div className="text-4xl font-bold">{wellness.wellnessScore}/100</div>
        <div className="text-sm text-white/80 mt-1">Wellness Score</div>
        <div className="mt-2 text-xs bg-white/20 rounded-full px-3 py-1 inline-block">
          {wellness.wellnessScore >= 80 ? '✓ You are doing great!' :
           wellness.wellnessScore >= 50 ? '⚠ Consider taking a break' :
           '🚨 Please rest immediately'}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl p-3 border border-slate-200 shadow-sm text-center">
          <Clock className="w-5 h-5 text-blue-500 mx-auto mb-1" />
          <div className="text-lg font-bold text-slate-900">{wellness.workHours.today}h</div>
          <div className="text-[10px] text-slate-500">Today ({wellness.workHours.dailyLimit}h max)</div>
        </div>
        <div className="bg-white rounded-xl p-3 border border-slate-200 shadow-sm text-center">
          <DollarSign className="w-5 h-5 text-green-500 mx-auto mb-1" />
          <div className="text-lg font-bold text-slate-900">{wellness.earnings.today}</div>
          <div className="text-[10px] text-slate-500">Earned Today</div>
        </div>
        <div className="bg-white rounded-xl p-3 border border-slate-200 shadow-sm text-center">
          <AlertTriangle className={`w-5 h-5 text-${fatigueColor}-500 mx-auto mb-1`} />
          <div className={`text-lg font-bold text-${fatigueColor}-600`}>{wellness.fatigueRisk}</div>
          <div className="text-[10px] text-slate-500">Fatigue Risk</div>
        </div>
        <div className="bg-white rounded-xl p-3 border border-slate-200 shadow-sm text-center">
          <CheckCircle className="w-5 h-5 text-slate-400 mx-auto mb-1" />
          <div className="text-lg font-bold text-slate-900">{wellness.completedJobsToday}</div>
          <div className="text-[10px] text-slate-500">Jobs Today</div>
        </div>
      </div>

      {/* Work Hours */}
      <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
        <h3 className="font-bold text-sm text-slate-800 mb-3 flex items-center gap-2">
          <Clock className="w-4 h-4 text-blue-600" /> Work Hours Tracker
        </h3>
        <div className="space-y-3">
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-600">Daily: {wellness.workHours.today}h / {wellness.workHours.dailyLimit}h</span>
              <span className="font-bold">{wellness.workHours.dailyUtilization}%</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-3">
              <div className={`h-full rounded-full ${wellness.workHours.dailyUtilization >= 100 ? 'bg-red-500' : wellness.workHours.dailyUtilization >= 75 ? 'bg-amber-500' : 'bg-blue-500'}`} style={{ width: `${Math.min(wellness.workHours.dailyUtilization, 100)}%` }} />
            </div>
          </div>
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-600">Weekly: {wellness.workHours.thisWeek}h / {wellness.workHours.weeklyLimit}h</span>
              <span className="font-bold">{wellness.workHours.weeklyUtilization}%</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-3">
              <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${Math.min(wellness.workHours.weeklyUtilization, 100)}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* Earnings & Wage Compliance */}
      <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
        <h3 className="font-bold text-sm text-slate-800 mb-3 flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-green-600" /> Earnings & Minimum Wage
        </h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between"><span className="text-slate-600">Today</span><span className="font-bold">{wellness.earnings.today}</span></div>
          <div className="flex justify-between"><span className="text-slate-600">This Week</span><span className="font-bold">{wellness.earnings.thisWeek}</span></div>
          <div className="flex justify-between"><span className="text-slate-600">Total Earned</span><span className="font-bold text-green-600">{wellness.earnings.total}</span></div>
          <div className="border-t border-slate-100 pt-2 mt-2">
            <div className="flex justify-between">
              <span className="text-slate-600">Effective Hourly Rate</span>
              <span className={`font-bold ${wellness.earnings.meetsMinimumWage ? 'text-green-600' : 'text-red-600'}`}>{wellness.earnings.effectiveHourlyRate}/hr</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Minimum Wage</span>
              <span className="font-bold">{wellness.earnings.minimumWagePerHour}/hr</span>
            </div>
            <div className={`mt-2 text-xs p-2 rounded-lg ${wellness.earnings.meetsMinimumWage ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
              {wellness.earnings.meetsMinimumWage ? '✓ Meets minimum wage requirement' : '⚠ Below minimum wage — discuss with society admin'}
            </div>
          </div>
        </div>
      </div>

      {/* Rest Recommendation */}
      {wellness.restRecommendation && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <h3 className="font-bold text-sm text-amber-800 mb-2 flex items-center gap-2">
            <Coffee className="w-4 h-4" /> Rest Recommendation
          </h3>
          <p className="text-sm text-amber-700">{wellness.restRecommendation.message}</p>
          <p className="text-xs text-amber-600 mt-1">Rest remaining: {wellness.restRecommendation.restMinutesRemaining} minutes</p>
        </div>
      )}

      {/* Recommendations */}
      {wellness.recommendations.length > 0 && (
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
          <h3 className="font-bold text-sm text-slate-800 mb-3">Recommendations</h3>
          <div className="space-y-2">
            {wellness.recommendations.map((r, i) => (
              <div key={i} className={`p-2 rounded-lg text-xs ${
                r.priority === 'High' ? 'bg-red-50 text-red-700 border border-red-200' :
                r.priority === 'Medium' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                'bg-blue-50 text-blue-700 border border-blue-200'
              }`}>
                <span className="font-bold">[{r.type}]</span> {r.message}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Insurance */}
      <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
        <h3 className="font-bold text-sm text-slate-800 mb-3 flex items-center gap-2">
          <Shield className="w-4 h-4 text-indigo-600" /> Insurance & Welfare
        </h3>
        {wellness.insuranceStatus.hasInsurance ? (
          <div className="space-y-1 text-sm">
            <div className="flex justify-between"><span className="text-slate-600">Status</span><span className="font-bold text-green-600">{wellness.insuranceStatus.status}</span></div>
            <div className="flex justify-between"><span className="text-slate-600">Policy</span><span className="font-bold">{wellness.insuranceStatus.policyNumber}</span></div>
            <div className="flex justify-between"><span className="text-slate-600">Coverage</span><span className="font-bold">₹{wellness.insuranceStatus.coverageAmount?.toLocaleString('en-IN')}</span></div>
          </div>
        ) : (
          <p className="text-sm text-amber-600">{wellness.insuranceStatus.message}</p>
        )}
      </div>

      {/* Stats */}
      <div className="bg-slate-50 rounded-xl p-4 text-center text-xs text-slate-500">
        <p>Completed: {wellness.completedJobsToday} today • {wellness.completedJobsThisWeek} this week • {wellness.totalJobsCompleted} total</p>
      </div>
    </div>
  );
}
export default WellnessPage;
