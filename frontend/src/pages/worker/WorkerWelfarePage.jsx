import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { useLanguage } from '../../context/LanguageContext';
import { ShieldCheck, HeartHandshake, Award, FileText, ArrowLeft, Plus, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';

export function WorkerWelfarePage() {
  const { t } = useLanguage();
  const [welfare, setWelfare] = useState(null);
  const [claimModalOpen, setClaimModalOpen] = useState(false);
  const [claimPurpose, setClaimPurpose] = useState('Safety & Tool Kit Grant');
  const [requestedAmount, setRequestedAmount] = useState('2500');
  const [claimDetails, setClaimDetails] = useState('');
  const [submittingClaim, setSubmittingClaim] = useState(false);

  useEffect(() => {
    fetchWelfare();
  }, []);

  const fetchWelfare = async () => {
    try {
      const res = await api.getMyWelfare();
      if (res.success) {
        setWelfare(res.welfareRecord);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmitClaim = async (e) => {
    e.preventDefault();
    setSubmittingClaim(true);
    try {
      const res = await api.submitWelfareClaim({
        claimPurpose,
        requestedAmount: Number(requestedAmount),
        claimDetails
      });
      if (res.success) {
        setClaimModalOpen(false);
        setClaimDetails('');
        alert('Claim request submitted to Cooperative Society Board for approval (ID: ' + res.claim.id + ').');
      }
    } catch (err) {
      alert(`Claim error: ${err.message}`);
    }
    setSubmittingClaim(false);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <Link to="/worker" className="text-xs font-semibold text-blue-900 hover:underline flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Operations
          </Link>
          <h1 className="text-2xl font-bold text-slate-900">{t('worker.welfare', 'Worker Welfare & Social Security Hub')}</h1>
          <p className="text-xs text-slate-500">
            Cooperative Worker Welfare & Accidental Protection System (Demo Record).
          </p>
        </div>

        <button
          onClick={() => setClaimModalOpen(true)}
          className="bg-[#0f2e5a] hover:bg-[#1a4b8c] text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm self-start"
        >
          <Plus className="w-4 h-4" />
          Apply for Welfare Benefit Claim
        </button>
      </div>

      {/* Insurance & Welfare Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="text-xs font-bold text-slate-400 uppercase">Policy Identifier</div>
          <div className="text-xl font-bold text-slate-900 font-mono">
            {welfare?.insurancePolicyNumber || 'INS-DEMO-001'}
          </div>
          <div className="text-xs text-emerald-700 font-semibold flex items-center gap-1">
            <ShieldCheck className="w-4 h-4" /> Policy Status: Active (Demo Record)
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="text-xs font-bold text-slate-400 uppercase">Accidental Shield Cover</div>
          <div className="text-xl font-bold text-blue-900 font-mono">
            ₹{welfare?.accidentalCoverage || 300000}
          </div>
          <div className="text-xs text-slate-500">Occupational Safety Coverage (Demo Model)</div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="text-xs font-bold text-slate-400 uppercase">Health Screening Limit</div>
          <div className="text-xl font-bold text-emerald-800 font-mono">
            ₹{welfare?.coverageAmount || 200000}
          </div>
          <div className="text-xs text-slate-500">Annual Subsidized Health Check & Diagnostics</div>
        </div>
      </div>

      {/* Entitled Benefits Checklist */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
          <HeartHandshake className="w-4 h-4 text-emerald-700" />
          Entitled Welfare Benefits Under Cooperative Scheme
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          {[
            { title: 'Annual Health Screening Support', desc: 'Complimentary annual health and vitals check at affiliated cooperative health centres.' },
            { title: 'Protective Kit & Tool Subsidy', desc: 'Subsidized gear reimbursement for insulated footwear, toolboxes, and safety goggles.' },
            { title: 'Emergency Distress Fund Support', desc: 'Immediate non-interest emergency bridge advance during illness or family distress.' },
            { title: 'Vocational Up-skilling Support', desc: 'Access to skill certification programs and green plumbing/solar wiring workshops.' }
          ].map((b, idx) => (
            <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <div className="font-bold text-slate-900 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                {b.title}
              </div>
              <p className="text-[11px] text-slate-500">{b.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Claim Modal */}
      {claimModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-md p-6 space-y-4 animate-in zoom-in-95">
            <h3 className="text-base font-bold text-slate-900">File a Cooperative Welfare Claim</h3>
            <p className="text-xs text-slate-500">
              Claims are reviewed by the Cooperative Society Committee within 48 hours (Demo Environment).
            </p>

            <form onSubmit={handleSubmitClaim} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Claim Purpose</label>
                <select
                  value={claimPurpose}
                  onChange={(e) => setClaimPurpose(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                >
                  <option value="Safety & Tool Kit Grant">Safety & Tool Kit Grant</option>
                  <option value="Medical Diagnostic Reimbursement">Medical Diagnostic Reimbursement</option>
                  <option value="Emergency Distress Grant">Emergency Distress Grant</option>
                  <option value="Child Education Stipend">Child Education Stipend</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Requested Amount (₹)</label>
                <input
                  type="number"
                  value={requestedAmount}
                  onChange={(e) => setRequestedAmount(e.target.value)}
                  required
                  min="500"
                  max="50000"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono text-sm"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Details & Supporting Notes</label>
                <textarea
                  rows="3"
                  value={claimDetails}
                  onChange={(e) => setClaimDetails(e.target.value)}
                  placeholder="Provide receipt numbers or details for the committee..."
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setClaimModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingClaim}
                  className="px-5 py-2 bg-[#0f2e5a] hover:bg-[#1a4b8c] text-white font-bold rounded-lg shadow-sm"
                >
                  {submittingClaim ? 'Submitting...' : 'Submit Claim'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
export default WorkerWelfarePage;
