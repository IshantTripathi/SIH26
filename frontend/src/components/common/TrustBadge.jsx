import React, { useState, useEffect } from 'react';
import { Shield } from 'lucide-react';

export function TrustBadge({ score, showDetails = false, size = 'sm' }) {
  const getTier = (s) => {
    if (s >= 90) return { label: 'Platinum', badge: 'Platinum Trust', color: 'purple', bg: 'bg-purple-100 text-purple-800 border-purple-300' };
    if (s >= 75) return { label: 'Gold', badge: 'Gold Trust', color: 'amber', bg: 'bg-amber-100 text-amber-800 border-amber-300' };
    if (s >= 60) return { label: 'Silver', badge: 'Silver Trust', color: 'slate', bg: 'bg-slate-100 text-slate-700 border-slate-300' };
    if (s >= 40) return { label: 'Bronze', badge: 'Bronze Trust', color: 'orange', bg: 'bg-orange-100 text-orange-800 border-orange-300' };
    return { label: 'New', badge: 'New Member', color: 'blue', bg: 'bg-blue-100 text-blue-800 border-blue-300' };
  };

  const tier = getTier(score || 0);
  const sizeClasses = size === 'lg' ? 'px-4 py-2 text-sm' : 'px-2 py-1 text-[10px]';

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full font-bold border ${tier.bg} ${sizeClasses}`}>
      <Shield className={size === 'lg' ? 'w-4 h-4' : 'w-3 h-3'} />
      {tier.badge}
      <span className="font-mono opacity-75">({score})</span>
    </span>
  );
}

export function TrustScoreCard({ trust }) {
  if (!trust) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold text-slate-900">Trust Score</h3>
        <TrustBadge score={trust.trustScore} size="lg" />
      </div>
      <div className="text-center py-2">
        <div className="text-4xl font-bold text-slate-900">{trust.trustScore}</div>
        <div className="text-xs text-slate-500">out of 100</div>
      </div>
      <div className="space-y-2">
        {Object.entries(trust.dimensions || {}).map(([key, dim]) => (
          <div key={key} className="space-y-0.5">
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-slate-600 capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
              <span className="font-mono font-bold text-slate-800">{dim.score}/{dim.max}</span>
            </div>
            <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 rounded-full transition-all" style={{ width: `${(dim.score / dim.max) * 100}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
