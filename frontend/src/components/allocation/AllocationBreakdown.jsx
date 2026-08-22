import React from 'react';
import { ShieldCheck, Award, MapPin, Activity, Heart, Clock, CheckCircle } from 'lucide-react';

export function AllocationBreakdown({ candidate, isTop = false }) {
  if (!candidate) return null;
  const { breakdown = {}, workerName, totalScore, recommendationReason, distanceKm, activeJobs, isOnline } = candidate;

  return (
    <div
      className={`border rounded-xl p-4 transition-all ${
        isTop
          ? 'bg-emerald-50/50 border-emerald-300 ring-2 ring-emerald-500/20 shadow-sm'
          : 'bg-white border-slate-200'
      }`}
    >
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center space-x-2">
            <span className="font-bold text-slate-900 text-sm">{workerName}</span>
            {isTop && (
              <span className="bg-emerald-700 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                ★ Recommended Candidate
              </span>
            )}
            {!isOnline && (
              <span className="bg-red-100 text-red-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                Offline
              </span>
            )}
          </div>
          <div className="flex items-center space-x-3 text-xs text-slate-500 mt-1">
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              {distanceKm} km away
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Activity className="w-3.5 h-3.5 text-slate-400" />
              {activeJobs} active jobs
            </span>
          </div>
        </div>

        <div className="text-right">
          <div className="text-xs text-slate-500 font-semibold uppercase">Total Score</div>
          <div className="text-xl font-black text-slate-900 font-mono">
            {totalScore} <span className="text-xs font-normal text-slate-400">/ 100</span>
          </div>
        </div>
      </div>

      {/* 6-Point Weighted Breakdown */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mt-3 pt-3 border-t border-slate-200/80 text-center">
        <div className="bg-slate-50 p-1.5 rounded-md border border-slate-100">
          <div className="text-[9px] text-slate-500 font-semibold uppercase">Skill (25)</div>
          <div className="text-xs font-bold text-slate-800 font-mono">{breakdown.skillScore || 0}</div>
        </div>
        <div className="bg-slate-50 p-1.5 rounded-md border border-slate-100">
          <div className="text-[9px] text-slate-500 font-semibold uppercase">Cert (15)</div>
          <div className="text-xs font-bold text-slate-800 font-mono">{breakdown.certScore || 0}</div>
        </div>
        <div className="bg-slate-50 p-1.5 rounded-md border border-slate-100">
          <div className="text-[9px] text-slate-500 font-semibold uppercase">Avail (20)</div>
          <div className="text-xs font-bold text-slate-800 font-mono">{breakdown.availScore || 0}</div>
        </div>
        <div className="bg-slate-50 p-1.5 rounded-md border border-slate-100">
          <div className="text-[9px] text-slate-500 font-semibold uppercase">Dist (15)</div>
          <div className="text-xs font-bold text-slate-800 font-mono">{breakdown.distScore || 0}</div>
        </div>
        <div className="bg-slate-50 p-1.5 rounded-md border border-slate-100">
          <div className="text-[9px] text-slate-500 font-semibold uppercase">Workload (15)</div>
          <div className="text-xs font-bold text-slate-800 font-mono">{breakdown.workloadScore || 0}</div>
        </div>
        <div className="bg-slate-50 p-1.5 rounded-md border border-slate-100">
          <div className="text-[9px] text-slate-500 font-semibold uppercase">Fairness (10)</div>
          <div className="text-xs font-bold text-slate-800 font-mono">{breakdown.fairnessScore || 0}</div>
        </div>
      </div>

      {recommendationReason && (
        <div className="mt-2.5 text-[11px] text-slate-600 bg-slate-100/70 p-2 rounded border border-slate-200 flex items-start gap-1.5">
          <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
          <span>{recommendationReason}</span>
        </div>
      )}
    </div>
  );
}
