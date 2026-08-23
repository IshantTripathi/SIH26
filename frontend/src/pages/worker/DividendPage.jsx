import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { api } from '../../api/client';
import { Coins, TrendingUp, PieChart, Calendar, Award, ArrowRight } from 'lucide-react';

export function DividendPage() {
  const { t } = useLanguage();
  const [dividend, setDividend] = useState(null);
  const [surplus, setSurplus] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [divRes, surRes] = await Promise.all([
        api.getMyDividend(),
        api.getCooperativeSurplus()
      ]);
      if (divRes.success) setDividend(divRes.dividend);
      if (surRes.success) setSurplus(surRes.summary);
    } catch (err) { /* silent */ }
    setLoading(false);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-4 border-blue-900 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="max-w-3xl mx-auto p-4 space-y-4">
      <div className="text-center mb-4">
        <h1 className="text-2xl font-bold text-slate-900">Cooperative Dividend Calculator</h1>
        <p className="text-sm text-slate-500">Your real-time dividend projection from cooperative surplus</p>
      </div>

      {dividend && (
        <>
          {/* Dividend Card */}
          <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl p-6 text-white shadow-xl text-center">
            <Coins className="w-10 h-10 mx-auto mb-2 text-amber-200" />
            <div className="text-3xl font-bold">{dividend.dividend.estimatedDividend}</div>
            <div className="text-sm text-amber-100 mt-1">Estimated This Quarter</div>
            <div className="mt-3 flex justify-center gap-4 text-xs">
              <div className="bg-white/20 rounded-lg px-3 py-1">
                <div className="font-bold">{dividend.dividend.guaranteedMinimum}</div>
                <div className="text-amber-100">Guaranteed Min</div>
              </div>
              <div className="bg-white/20 rounded-lg px-3 py-1">
                <div className="font-bold">₹{dividend.totalDividendReceived.toLocaleString('en-IN')}</div>
                <div className="text-amber-100">Total Received</div>
              </div>
            </div>
          </div>

          {/* Your Contribution */}
          <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
            <h3 className="font-bold text-sm text-slate-800 mb-3 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-green-600" /> Your Contribution to Cooperative
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-2 bg-slate-50 rounded-lg text-center">
                <div className="text-lg font-bold text-slate-900">{dividend.contribution.totalJobsCompleted}</div>
                <div className="text-[10px] text-slate-500">Jobs Completed</div>
              </div>
              <div className="p-2 bg-slate-50 rounded-lg text-center">
                <div className="text-lg font-bold text-green-600">{dividend.contribution.totalEarnings}</div>
                <div className="text-[10px] text-slate-500">Total Earned</div>
              </div>
              <div className="p-2 bg-slate-50 rounded-lg text-center">
                <div className="text-lg font-bold text-blue-600">{dividend.contribution.totalCoopContribution}</div>
                <div className="text-[10px] text-slate-500">Coop Contribution (4%)</div>
              </div>
              <div className="p-2 bg-slate-50 rounded-lg text-center">
                <div className="text-lg font-bold text-slate-900">{dividend.contribution.monthlyContribution}</div>
                <div className="text-[10px] text-slate-500">Monthly Avg</div>
              </div>
            </div>
          </div>

          {/* Dividend Weight Breakdown */}
          <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
            <h3 className="font-bold text-sm text-slate-800 mb-3 flex items-center gap-2">
              <PieChart className="w-4 h-4 text-purple-600" /> How Your Dividend is Calculated
            </h3>
            <div className="space-y-2">
              {Object.entries(dividend.weightBreakdown).map(([key, value], i) => (
                <div key={i} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
                  <span className="text-xs text-slate-600 capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                  <span className="text-xs font-bold text-slate-800">{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Historical Dividends */}
          <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
            <h3 className="font-bold text-sm text-slate-800 mb-3 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-indigo-600" /> Dividend History
            </h3>
            <div className="space-y-2">
              {dividend.historicalDividends.map((d, i) => (
                <div key={i} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
                  <span className="text-xs font-medium text-slate-700">{d.quarter}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold">₹{d.amount.toLocaleString('en-IN')}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      d.status === 'Paid' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                    }`}>{d.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Next Distribution */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
            <div className="text-sm font-bold text-blue-800">Next Dividend Distribution</div>
            <div className="text-lg font-bold text-blue-900 mt-1">{dividend.nextDistribution.date}</div>
            <div className="text-xs text-blue-600 mt-1">{dividend.nextDistribution.daysRemaining} days remaining • Pool: {dividend.nextDistribution.poolStatus}</div>
          </div>
        </>
      )}

      {/* Cooperative Surplus */}
      {surplus && (
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
          <h3 className="font-bold text-sm text-slate-800 mb-3 flex items-center gap-2">
            <Award className="w-4 h-4 text-amber-600" /> Cooperative Surplus Pool
          </h3>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="p-2 bg-slate-50 rounded-lg"><div className="text-[10px] text-slate-500">Total Volume</div><div className="font-bold">{surplus.totalGrossVolume}</div></div>
            <div className="p-2 bg-slate-50 rounded-lg"><div className="text-[10px] text-slate-500">Worker Payout</div><div className="font-bold text-green-600">{surplus.totalWorkerPayout}</div></div>
            <div className="p-2 bg-slate-50 rounded-lg"><div className="text-[10px] text-slate-500">Surplus Pool</div><div className="font-bold text-amber-600">{surplus.surplusPool}</div></div>
            <div className="p-2 bg-slate-50 rounded-lg"><div className="text-[10px] text-slate-500">Avg Dividend/Worker</div><div className="font-bold">{surplus.averageDividendPerWorker}</div></div>
          </div>
        </div>
      )}
    </div>
  );
}
export default DividendPage;
