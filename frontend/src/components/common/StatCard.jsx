import React from 'react';

export function StatCard({ title, value, subtitle, icon: Icon, trend, trendLabel, color = 'blue' }) {
  const colorMap = {
    blue: 'bg-blue-50 text-blue-900 border-blue-200 text-blue-700',
    green: 'bg-emerald-50 text-emerald-950 border-emerald-200 text-emerald-800',
    amber: 'bg-amber-50 text-amber-950 border-amber-200 text-amber-800',
    purple: 'bg-purple-50 text-purple-950 border-purple-200 text-purple-800',
    slate: 'bg-slate-100 text-slate-900 border-slate-200 text-slate-700'
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{title}</span>
        {Icon && (
          <div className={`p-2 rounded-lg ${colorMap[color] || colorMap.blue} bg-opacity-60`}>
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>
      <div className="mt-2 flex items-baseline justify-between">
        <div className="text-2xl font-bold text-slate-900 tracking-tight">{value}</div>
        {trend && (
          <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
            {trend}
          </span>
        )}
      </div>
      {subtitle && <p className="text-[11px] text-slate-500 mt-1">{subtitle}</p>}
    </div>
  );
}

export function WorkloadBadge({ status, count }) {
  if (status === 'High Workload' || count > 4) {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-600 mr-1.5 animate-pulse"></span>
        High Workload ({count !== undefined ? count : '5+'} jobs)
      </span>
    );
  }

  if (status === 'Underutilized' || count === 0) {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-900 border border-blue-300">
        <span className="w-1.5 h-1.5 rounded-full bg-blue-600 mr-1.5"></span>
        Underutilized ({count !== undefined ? count : 0} jobs)
      </span>
    );
  }

  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 mr-1.5"></span>
      Balanced ({count !== undefined ? count : '1-4'} jobs)
    </span>
  );
}
