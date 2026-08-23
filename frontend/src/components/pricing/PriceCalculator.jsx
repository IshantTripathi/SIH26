import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { Calculator, ChevronDown, ChevronUp, Info } from 'lucide-react';

export function PriceCalculator({ serviceCategory, basePrice, durationHours, urgency, scheduledTime, scheduledDate, customerLocation, workerLocation, subTasks = [] }) {
  const [result, setResult] = useState(null);
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (serviceCategory) calculatePrice();
  }, [serviceCategory, durationHours, urgency, scheduledTime]);

  const calculatePrice = async () => {
    setLoading(true);
    try {
      const res = await api.calculateEffortPrice({
        serviceCategory, basePrice, durationHours, urgency,
        scheduledTime, scheduledDate, customerLocation, workerLocation, subTasks
      });
      if (res.success) setResult(res);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  if (!result) return null;
  const { pricing } = result;

  return (
    <div className="bg-gradient-to-r from-slate-50 to-blue-50 border border-slate-200 rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
          <Calculator className="w-4 h-4 text-blue-700" />
          Effort-Based Price Calculator
        </div>
        <button onClick={() => setExpanded(!expanded)} className="text-xs text-blue-700 flex items-center gap-1">
          {expanded ? 'Hide' : 'Show'} Breakdown {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>
      </div>

      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-bold text-slate-900">₹{pricing.grossAmount}</span>
        <span className="text-xs text-slate-500">gross amount</span>
      </div>

      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="p-2 bg-white rounded-lg border border-slate-200">
          <div className="text-[10px] text-slate-500">Worker (95%)</div>
          <div className="text-sm font-bold text-emerald-700">₹{pricing.netWorkerEarnings}</div>
        </div>
        <div className="p-2 bg-white rounded-lg border border-slate-200">
          <div className="text-[10px] text-slate-500">Society (4%)</div>
          <div className="text-sm font-bold text-blue-700">₹{pricing.coopContribution}</div>
        </div>
        <div className="p-2 bg-white rounded-lg border border-slate-200">
          <div className="text-[10px] text-slate-500">Welfare (1%)</div>
          <div className="text-sm font-bold text-amber-700">₹{pricing.welfareDeduction}</div>
        </div>
      </div>

      {expanded && pricing.breakdown && (
        <div className="space-y-2 pt-2 border-t border-slate-200 text-xs">
          <DetailRow label="Base Rate" value={`₹${pricing.breakdown.basePrice} × ${pricing.breakdown.durationHours}h`} />
          <DetailRow label="Service Amount" value={`₹${pricing.breakdown.serviceAmount}`} />
          <DetailRow label={`Complexity (${pricing.breakdown.complexity.level})`} value={`×${pricing.breakdown.complexity.multiplier}`} />
          <DetailRow label={`Physical Demand (${pricing.breakdown.physicalDemand.level})`} value={`×${pricing.breakdown.physicalDemand.multiplier}`} />
          <DetailRow label={`Skill Difficulty (${pricing.breakdown.skillDifficulty.level})`} value={`×${pricing.breakdown.skillDifficulty.multiplier}`} />
          <DetailRow label="Effort Multiplier" value={`×${pricing.breakdown.effortMultiplier}`} highlight />
          {pricing.breakdown.urgency.surcharge > 0 && <DetailRow label={`Urgency (${pricing.breakdown.urgency.level})`} value={`+₹${pricing.breakdown.urgency.surcharge}`} />}
          {pricing.breakdown.timeOfDay.surcharge > 0 && <DetailRow label={`Time (${pricing.breakdown.timeOfDay.period})`} value={`+₹${pricing.breakdown.timeOfDay.surcharge}`} />}
          {pricing.breakdown.subTasks.count > 0 && <DetailRow label={`Sub-tasks (${pricing.breakdown.subTasks.count})`} value={`+₹${pricing.breakdown.subTasks.fee}`} />}
          {pricing.breakdown.travel.compensation > 0 && <DetailRow label={`Travel (${pricing.breakdown.travel.distanceKm}km, ${pricing.breakdown.travel.billableKm} billable)`} value={`+₹${pricing.breakdown.travel.compensation}`} />}
          {pricing.breakdown.waiting.compensation > 0 && <DetailRow label={`Waiting (${pricing.breakdown.waiting.totalMinutes}min)`} value={`+₹${pricing.breakdown.waiting.compensation}`} />}
          <div className="pt-2 border-t border-slate-200">
            <DetailRow label="Gross Amount" value={`₹${pricing.grossAmount}`} highlight />
          </div>
          <p className="text-[10px] text-slate-400 italic">{pricing.disclaimer}</p>
        </div>
      )}
    </div>
  );
}

function DetailRow({ label, value, highlight }) {
  return (
    <div className={`flex items-center justify-between py-1 ${highlight ? 'font-bold text-slate-900' : 'text-slate-600'}`}>
      <span>{label}</span>
      <span className="font-mono">{value}</span>
    </div>
  );
}
