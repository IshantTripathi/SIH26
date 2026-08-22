import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { Link } from 'react-router-dom';
import { ArrowLeft, RefreshCw, ShieldCheck, Award, Search, Download } from 'lucide-react';
import { WorkloadBadge } from '../../components/common/StatCard';

export function SocietyWorkersPage() {
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tradeFilter, setTradeFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchWorkers();
  }, []);

  const fetchWorkers = async () => {
    setLoading(true);
    try {
      const res = await api.getSocietyDashboard();
      if (res.success) {
        setWorkers(res.workersList || []);
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const handleExportCSV = () => {
    const headers = ['Worker ID', 'Name', 'Trade', 'Experience (Yrs)', 'Workload', 'Verification', 'Rating', 'Gross Earnings'];
    const rows = workers.map(w => [
      w.code || w.id,
      `"${w.name}"`,
      w.primarySkill,
      w.experienceYears,
      w.currentWorkload,
      w.verificationStatus,
      w.ratingAvg,
      w.totalEarningsGross
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Cooperative_Worker_Roster_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filtered = workers.filter(w => {
    const matchTrade = tradeFilter === 'ALL' || w.primarySkill === tradeFilter;
    const matchSearch = w.name?.toLowerCase().includes(searchQuery.toLowerCase()) || w.code?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchTrade && matchSearch;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <Link to="/society" className="text-xs font-semibold text-blue-900 hover:underline flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Society Dashboard
          </Link>
          <h1 className="text-2xl font-bold text-slate-900">Cooperative Society Worker Roster</h1>
          <p className="text-xs text-slate-500">
            Registered, certified technicians affiliated with Central Metro Labour Society.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleExportCSV}
            className="px-3 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </button>
          <button
            onClick={fetchWorkers}
            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by worker name or code..."
            className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs w-full sm:w-64"
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <span className="text-xs font-semibold text-slate-500">Trade:</span>
          <select
            value={tradeFilter}
            onChange={(e) => setTradeFilter(e.target.value)}
            className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white"
          >
            <option value="ALL">All Trades</option>
            <option value="Plumbing">Plumbing</option>
            <option value="Electrical">Electrical</option>
            <option value="Carpentry">Carpentry</option>
            <option value="Caregiving">Caregiving</option>
            <option value="Gardening">Gardening</option>
            <option value="Cleaning">Cleaning</option>
          </select>
        </div>
      </div>

      {/* Worker List Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-400">Loading worker roster...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] border-b border-slate-200">
                <tr>
                  <th className="p-3">Worker ID & Name</th>
                  <th className="p-3">Trade</th>
                  <th className="p-3">Certification</th>
                  <th className="p-3">Workload Status</th>
                  <th className="p-3">Duty Status</th>
                  <th className="p-3">Rating</th>
                  <th className="p-3">Gross Earnings</th>
                  <th className="p-3 text-right">Verification</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filtered.map((w) => (
                  <tr key={w.id} className="hover:bg-slate-50/70">
                    <td className="p-3">
                      <div className="font-bold text-slate-900">{w.name}</div>
                      <div className="font-mono text-[10px] text-slate-400">{w.code || w.id}</div>
                    </td>
                    <td className="p-3 text-slate-800">{w.primarySkill}</td>
                    <td className="p-3">
                      <span className="font-mono bg-slate-100 px-2 py-0.5 rounded text-[10px] text-slate-700">
                        {w.certifications?.[0]?.code || 'CERT-DEMO-001'}
                      </span>
                    </td>
                    <td className="p-3">
                      <WorkloadBadge status={w.currentWorkload} count={w.activeJobsCount} />
                    </td>
                    <td className="p-3">
                      <span className={w.isOnline ? 'text-emerald-700 font-bold' : 'text-slate-400'}>
                        {w.isOnline ? '● Online' : '○ Offline'}
                      </span>
                    </td>
                    <td className="p-3 font-semibold text-slate-800">
                      {w.ratingAvg || 4.8} ★ <span className="text-[10px] text-slate-400 font-normal">({w.ratingCount || 0})</span>
                    </td>
                    <td className="p-3 font-mono font-bold text-slate-900">
                      ₹{w.totalEarningsGross || 0}
                    </td>
                    <td className="p-3 text-right">
                      <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded text-[10px] font-bold">
                        {w.verificationStatus || 'Verified'}
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
