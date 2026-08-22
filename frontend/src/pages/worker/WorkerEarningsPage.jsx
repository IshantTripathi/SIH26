import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { useLanguage } from '../../context/LanguageContext';
import { DollarSign, ArrowLeft, RefreshCw, FileText, CheckCircle2, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

export function WorkerEarningsPage() {
  const { t } = useLanguage();
  const [earnings, setEarnings] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEarnings();
  }, []);

  const fetchEarnings = async () => {
    setLoading(true);
    try {
      const res = await api.getWorkerEarnings();
      if (res.success) {
        setEarnings(res);
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const summary = earnings?.summary || {
    grossTotal: 14200,
    coopDeductionTotal: 568,
    welfareDeductionTotal: 142,
    netTotal: 13490,
    paidTotal: 12500,
    pendingPayout: 990,
    completedJobsCount: 28
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <Link to="/worker" className="text-xs font-semibold text-blue-900 hover:underline flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Worker Operations
          </Link>
          <h1 className="text-2xl font-bold text-slate-900">{t('worker.earnings', 'Transparent Earnings Ledger')}</h1>
          <p className="text-xs text-slate-500">
            Cooperative transparent wage distribution model (Demo Environment).
          </p>
        </div>

        <button
          onClick={fetchEarnings}
          className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1 self-start"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Ledger</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-1 shadow-sm">
          <div className="text-xs font-semibold text-slate-400 uppercase">{t('worker.grossEarnings', 'Gross Service Value')}</div>
          <div className="text-2xl font-bold text-slate-900 font-mono">₹{summary.grossTotal}</div>
          <div className="text-[11px] text-slate-500">Across {summary.completedJobsCount} completed jobs</div>
        </div>

        <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-4 space-y-1 shadow-sm">
          <div className="text-xs font-semibold text-emerald-800 uppercase">{t('worker.netEarnings', 'Net Worker Direct Wage (95%)')}</div>
          <div className="text-2xl font-bold text-emerald-950 font-mono">₹{summary.netTotal}</div>
          <div className="text-[11px] text-emerald-700">Directly credited to worker balance</div>
        </div>

        <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-4 space-y-1 shadow-sm">
          <div className="text-xs font-semibold text-blue-800 uppercase">Settled Payouts</div>
          <div className="text-2xl font-bold text-blue-950 font-mono">₹{summary.paidTotal}</div>
          <div className="text-[11px] text-blue-700">Pending settlement: ₹{summary.pendingPayout}</div>
        </div>
      </div>

      {/* Deductions Breakdown Explanation Callout */}
      <div className="bg-slate-100 p-4 rounded-xl border border-slate-200 text-xs space-y-2">
        <div className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
          Demo Cooperative Contribution Breakdown (Values are configurable by societies):
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-slate-700">
          <div className="bg-white p-3 rounded-lg border border-slate-200">
            <span className="font-bold text-slate-900 block">95% Worker Direct Wage</span>
            <span className="text-[11px] text-slate-500">Credited directly to worker bank account without surge commissions.</span>
          </div>
          <div className="bg-white p-3 rounded-lg border border-slate-200">
            <span className="font-bold text-slate-900 block">4% Society Operations</span>
            <span className="text-[11px] text-slate-500">Maintains cooperative dispatch tooling, support staff, and local society operations.</span>
          </div>
          <div className="bg-white p-3 rounded-lg border border-slate-200">
            <span className="font-bold text-slate-900 block">1% Demo Welfare Fund</span>
            <span className="text-[11px] text-slate-500">Cooperative fund for health checks, tool allowances, and accidental shield.</span>
          </div>
        </div>
        <div className="text-[11px] text-slate-500 pt-1">
          {t('common.demoDisclaimer', 'Demo contribution model — values are configurable and are not presented as statutory rates.')}
        </div>
      </div>

      {/* Itemized Jobs History */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 font-bold text-sm text-slate-900">
          Job-by-Job Itemized Wage Ledger
        </div>

        {loading ? (
          <div className="p-8 text-center text-xs text-slate-400">Loading ledger data...</div>
        ) : earnings?.history?.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">No completed jobs yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] border-b border-slate-200">
                <tr>
                  <th className="p-3">Job Code</th>
                  <th className="p-3">Service Trade</th>
                  <th className="p-3">Date</th>
                  <th className="p-3">Gross (₹)</th>
                  <th className="p-3">Coop Fee (4%)</th>
                  <th className="p-3">Welfare (1%)</th>
                  <th className="p-3">Net Worker Pay (95%)</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {earnings?.history?.map((j, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/70">
                    <td className="p-3 font-mono text-blue-900 font-bold">#{j.code || j.jobId?.slice(-6)}</td>
                    <td className="p-3 text-slate-800">{j.service}</td>
                    <td className="p-3 text-slate-500">
                      {j.date ? new Date(j.date).toLocaleDateString() : 'Recent'}
                    </td>
                    <td className="p-3 font-mono font-bold text-slate-900">₹{j.gross}</td>
                    <td className="p-3 font-mono text-slate-500">-₹{j.coopFee}</td>
                    <td className="p-3 font-mono text-slate-500">-₹{j.welfareFee}</td>
                    <td className="p-3 font-mono font-bold text-emerald-800 text-sm">₹{j.netPay}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 uppercase">
                        {j.paymentStatus || 'Settled'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
export default WorkerEarningsPage;
